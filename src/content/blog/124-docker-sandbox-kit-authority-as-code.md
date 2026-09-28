---
title: "Docker Sandbox Kit：把 Agent 權限請求和軟體一起版本化"
description: "拆解 Docker Sandbox Kit v3 如何把 Agent 的網路、憑證與 mixin 宣告放進 OCI artifact，並說明 descriptor 仍是 request、enforcement 仍取決於 runtime。"
pubDate: 2026-09-28
updatedDate: 2026-09-28
tldr:
  - "Dockerfile 描述軟體如何建置與啟動；Kit v3 嘗試把 workload 周邊的權限請求也放入同一個 digest-pinned OCI image。"
  - "Descriptor 是 request，不是 grant；只有實作相應 capability 的 runtime 才能執行網路、credential 與其他限制。"
  - "Resolver、deny-overrides、credential proxy 與雙層 conformance tests 提供可檢查的契約，但實驗性規格和單一 conforming runtime 尚不足以構成跨平台安全保證。"
audience:
  - "建置 coding agent、sandbox runtime 與開發者平台的工程師"
  - "需要審查 Agent 權限、供應鏈與執行環境的安全及平台團隊"
category: "Cloud & Platform"
tags: ["AI Agent", "Enterprise AI", "Governance", "Platform Engineering"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 42
kind: "article"
showToc: true
image: "/blog/124-docker-sandbox-kit-authority-as-code/title_image.webp"
---

Dockerfile 讓團隊能重建應用程式的內容與啟動方式，但 Agent 真正能做什麼，往往還散落在 `docker run` 參數、Compose、CI 設定、token 注入和操作手冊裡。Docker Sandbox Kit v3 試著把這些外部權限需求也寫進一個可檢查、可釘選的 OCI artifact。它值得注意的工程主張是：**Dockerfile 固定軟體；Kit 嘗試讓請求的執行權限也跟著軟體一起版本化。**

這句話裡的「請求」很重要。Kit descriptor 描述 workload 需要哪些 capability，並不自行授權；runtime 仍要辨識並落實每種 capability。Docker 的說明把 Docker Sandboxes 稱為第一個 conforming runtime，而規格明確標記為 experimental。因此，可檢查的規格不等於已經跨 runtime 驗證的安全保證。

> **花花的一句話**
>
> Kit 把權限需求放進 artifact，方便審查與釘選；真正的授權和執行仍掌握在 runtime 手上。

## Dockerfile 沒有描述的那一半

一般 image 已經能封裝 root filesystem、entrypoint、command、環境變數和使用者設定。Agent 執行時還要依工作取得外部資源：網路目的地、持久化 volume、CLI 工具、MCP server、skills、憑證或啟動 hook。這些設定若分散在不同部署檔案和人工操作中，更新 agent image 時就很難一起看出它的有效權限是否變大。

Docker 在 2026 年 9 月 24 日發布 [Sandbox Kit Specification v3](https://www.docker.com/blog/docker-sandbox-kit-spec/)。Kit 沿用 OCI image：manifest annotation `vnd.docker.sandbox.kit.descriptor` 放 descriptor，image layers 放內容。沒有新 media type 或 sidecar，既有 registry、scanner、signer 和一般 OCI tooling 仍能處理 image；descriptor 與內容也能一起由 digest 固定。這讓權限變更有機會進入一般 image review 和 release 流程，但不會自動替組織定義批准規則。

v3 有兩種 Kit。`workload` 提供執行用的 root filesystem；`mixin` 疊加工具、網路規則、credential binding 或 agent context。一次 composition 必須有且只有一個 workload，可以加上多個 mixin。集合可用 `kind: set` 發佈成另一個普通 Kit，並留下組成來源，讓團隊可以把環境以一個引用交付。

## Descriptor 宣告需求，runtime 才實際授權

v3 descriptor 以 `schemaVersion: "3"` 表示格式版本，並用 `capabilities` 列出型別化、各自版本化的請求，例如 `com.docker.sandbox/network-policy@2` 或 `com.docker.sandbox/credential@1`。規格的 [v3 grammar](https://github.com/docker/sandbox-kit-spec/blob/main/docs/spec/SPEC-v3.md) 和 JSON Schema 可協助驗證 descriptor 的結構；Go validator 是 repository 指定的 grammar validator，未知欄位會直接報錯，避免 typo 被忽略後悄悄少掉一條宣告。

這仍是描述層。Kit 只能要求某個 network policy 或 credential capability，不能靠 YAML 自己攔住封包或拿到 secret。Runtime 必須知道該 capability 的規範行為、願意提供它，並在執行時落實；遇到無法滿足的必要請求，應拒絕啟動，而不是靜默刪掉設定後照常執行。非必要能力可以明確標記為 optional，但其效果仍由 runtime 契約定義。

也要分清兩種容易混淆的關係：Kit 彼此之間用 `provides`、`requires`、`integrates` 和 `conflicts` 描述相依；`capabilities` 則是 Kit 對 host runtime 提出的請求。前者由 resolver 檢查組合是否完整，後者需由 runtime 決定能否 grant 並執行。

## Resolver 把 mixin 組合變成可預期的結果

Kit 的 resolver 不按命令列旗標順序堆疊 mixin，而依 dependency graph 排序。組合是一個封閉集合：缺少 `requires` 對應的 provider、出現 conflict，或有多個 Kit 提供相同 normalized name，都要失敗；composition 也只能有一個 workload。這種失敗即時發生在解析階段，不去 registry 盲目找東西補缺口，也不默默讓其中一份內容蓋過另一份。

`kind: set` 會在 build/publish 時跑同一套 coherence rules。發佈後，`set` 這個 authoring form 會成為一般 `workload` 或 `mixin`，而集合中的來源與 digest 記錄在輸出的 descriptor。團隊能把經過組合檢查的環境當成一個 artifact 傳遞；但這只證明集合可解析，不表示每個 runtime 都會依相同方式執行它。

網路政策則示範了能力合併的安全含義。Docker blog 的 GitHub CLI 範例允許連到 `api.github.com`，但明確拒絕 `DELETE /repos/**`；同一 policy 同時有 allow 與 deny 時，deny-overrides-allow。審查時不能只看「允許 GitHub」這行摘要，還要檢查方法、host、path、不同 mixin 合併後的結果，以及升級是否移除既有 deny。

## Credential proxy 的界線是 secret 不進 sandbox

範例中的 credential capability 以 `proxyManaged: true` 標示 API key，並指定只對特定 domain 注入授權 header。Secret 保存在 host/runtime 管理的來源，由 conforming runtime 代理符合條件的請求；sandbox 內看到的是 sentinel，而不是實際 token。這可減少 agent 直接讀取長效 token 的機會，也把 credential 使用綁到特定服務端點。

但 proxy 不會自行縮小 token 的服務端權限，也不會證明 runtime 沒有其他憑證外洩路徑。實際部署還要驗證：secret 的生命週期與撤銷方式、代理是否只匹配預期 domain/header、重新導向和錯誤回應是否可能洩漏、其他 egress 是否封鎖，以及 audit log 是否避免記錄 secret。Capability 的名稱和 descriptor 只能表達契約，不能代替這些 runtime 測試。

## Conformance tests 測兩件不同的事

公開 repository 提供兩套測試：`kit-tck` 驗證已發布的 artifact 是否符合 Kit 格式；`runtime` TCK 則透過 adapter 檢查 runtime 行為是否符合各 capability 規範。Build frontend 也在 build 時驗證 Kit。兩者不能互相代替：有效的 descriptor 不證明 runtime 真的封鎖未允許的 egress；runtime 通過一套測試，也不代表組織自己的網路拓樸、credential provider 或威脅模型都已驗證。

[Conformance 文件](https://github.com/docker/sandbox-kit-spec/blob/main/docs/spec/conformance.md) 說明兩套 suite 的用途。repository 提供可供 runtime 作者執行的工具與測試規則，這是可重現驗證的起點，不是已存在多家實作的證據。依發佈說明，Docker Sandboxes 是第一個 conforming runtime；Docker 同時維護這份仍屬實驗性的規格，並以 2026 年第四季為目標，在社群回饋後再定稿。跨 runtime 的互通與 enforcement 成效仍待獨立實作和測試佐證。

## 工程團隊可以怎麼導入

一個可操作的試行流程，可以把「格式正確」「權限變更可接受」「runtime 真正執行」分成獨立 gate：

1. **建立 workload 與 mixin**：先把 agent root filesystem 當 workload；將 CLI、網路政策、credential binding 和 context 拆成有明確責任的 mixin。用 schema 和 validator 檢查 `schemaVersion`、capability config 與拼字。
2. **固定組成輸入**：把每個 Kit 的 registry reference 釘到 digest，檢查 `provides`／`requires` 是否完整，讓 resolver 對缺少 provider、衝突、重複提供者和多個 workload 直接 fail closed。不要把可變 tag 當成穩定的 production input。
3. **建置並檢查最終 artifact**：用 BuildKit frontend 建置，再檢查發布後 manifest annotation、layers 與 digest。對最終 registry artifact 跑 Kit TCK；如果輸入經 `set` 合併，也要檢查 merged descriptor 是否仍符合預期。
4. **審查權限 diff**：將 normalized authority 列成 review 項目，特別標記新增 host、方法、volume、credential、device 或持久化路徑；把移除 deny 規則視為權限擴張。可接受的變更需要明確 reviewer 和可追溯批准，不能因為程式版本更新就自動放行。
5. **在目標 runtime 驗證 enforcement**：確認 runtime 宣稱支援哪些 capability，執行 runtime TCK，另加組織自己的負向測試：未允許的 host 是否連不上、缺少必要 capability 是否啟動失敗、credential 是否只經代理送往指定 endpoint、volume 是否只暴露需要的路徑。測試不通過時，要讓部署被阻擋。
6. **部署並保留證據**：部署 image digest，而非會漂移的 tag；記錄 Kit digest、runtime 版本、有效授權集合、核准人與 TCK 結果。Runtime 更新或權限集合改變時，重跑相同測試並比較結果。

對團隊而言，Kit 現階段最實際的價值，是把原本分散的權限設定變成可和 image 一起 review、簽署、掃描與釘選的輸入。這能改善供應鏈與變更審查的可見性；真正的安全邊界仍取決於 runtime 的隔離品質、capability 實作、host 授權政策和端到端測試。

> **花花的工程提醒**
>
> Digest 能固定「這個 Kit 說了什麼」，不能保證 runtime 照著執行。沒有目標 runtime 的 conformance 與負向測試，descriptor 仍只是可讀的請求。

## 延伸閱讀與來源

- 若要先理解 sandbox runtime 與多租戶隔離取捨，可讀本站的 [EKS 多租戶 AI Agent 沙箱](/blog/54-eks-multitenant-ai-agent-sandbox-bitoclaw/)。
- 若要把權限與工具供應鏈、版本和 provenance 一起審查，可接著看 [AIPOCH Open Science 的 Agent 工作台治理](/blog/90-aipoch-open-science-workbench/) 和 [Ouroboros 自修改 Agent 的 release provenance](/blog/113-ouroboros-self-modifying-agent-provenance/)。
- 主要來源：[Docker 工程文章](https://www.docker.com/blog/docker-sandbox-kit-spec/)；[Docker Sandbox Kit Specification repository](https://github.com/docker/sandbox-kit-spec)。兩者為第一方資料，本文未把它們視為獨立安全評估。
