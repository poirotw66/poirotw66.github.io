---
title: "Claude Managed Agents 走向受治理的 Runtime：預算、委派、地域與 Inference Hooks"
description: "Anthropic 的 Managed Agents 把 session budget、advisor、inference geography、repository skills 與 inference hooks 變成 runtime 控制面；本文拆解它們能治理什麼，以及仍然未知的邊界。"
pubDate: 2026-08-11
updatedDate: 2026-08-11
tldr:
  - "Managed Agents 的重要變化不是多了幾個設定，而是把 spend、delegation、version、locality、skills provenance 與 policy decision 變成可觀察的 runtime state。"
  - "Session budget 是以 public list price 計算的硬上限，會在 model request 之間檢查；in-flight request 仍可能造成 overshoot，multi-agent thread 也共享同一個 session budget。"
  - "Inference hooks 目前是 Claude Enterprise beta；它能在 inference 前等待 allow／deny，但 failure handling、地域、模型相容性與獨立 bypass 證據仍需由部署團隊驗證。"
audience:
  - "設計長時間、多 agent 或受治理 AI runtime 的平台工程師"
  - "需要控制 agent 成本、資料地域、技能供應鏈與政策攔截的企業團隊"
category: "Cloud & Platform"
tags: ["AI Agent", "Anthropic", "Claude", "Platform Engineering", "Governance"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 8
kind: "article"
showToc: true
image: "/blog/88-claude-managed-agents-control-plane/title_image.webp"
---

長時間 agent 真正難以生產化的地方，通常不是「模型能不能再多做一步」，而是系統能不能回答：這一步花了多少、由誰委派、使用哪個版本、在哪裡推論、載入了什麼技能，以及為什麼被允許或拒絕。

2026 年 8 月 7 日的 Claude Platform release notes 同時列出 Managed Agents 的 session budget、advisor、`inference_geo` 與 GitHub skills；8 月 5 日則將 inference hooks 列為 Claude Enterprise beta。

這些功能不應只被讀成一張產品 feature list。它們共同指向一個更大的變化：**agent platform 正在把 runtime control plane 從 wrapper code 與 prompt 裡抽出來，成為可配置、可觀察、可審計的服務契約。** Anthropic 的文件可以證明功能語義，但不能單獨證明成本精準、policy 不可繞過或任何企業工作流的品質提升。

> **花花的一句話**
>
> 受治理的 agent runtime，不是把模型關進更多 prompt，而是讓 spend、delegation、locality、provenance 與 policy decision 都能被系統看見、限制與回放。

## 從 Agent API 到 Runtime Contract

Anthropic 的 [Managed Agents release notes](https://platform.claude.com/docs/en/release-notes/overview) 把近期新增項目分散在不同功能頁，但可以整理成一份 runtime contract：

| Runtime primitive | 官方文件提供的控制 | 平台團隊還要補的證據 |
| --- | --- | --- |
| Spend | session budget、`budget_reached` stop reason | 實際合約價格、in-flight overshoot、所有工具成本 |
| Delegation | advisor 與 multi-agent roster | 委派品質、latency、失敗回復與權限邊界 |
| Locality | `inference_geo` 與可用地區／價格資訊 | 真正的資料流向、region availability 與合規映射 |
| Provenance | GitHub repository 的 `.claude/skills` 自動發現 | commit pinning、review、dependency 與技能變更審計 |
| Policy | inference 前的 signed allow／deny hook、Activity Feed | failure mode、bypass 測試、延遲與營運責任 |

這種整理方式延續 [企業 agent governance control plane](/blog/39-enterprise-agentic-ai-governance/) 的核心觀念：控制不只存在於模型選擇，也存在於 agent lifecycle、tool scope、identity、evidence 與 shutdown path。

## Session budget：硬上限也不是精確帳單

根據 [Session budgets 文件](https://platform.claude.com/docs/en/managed-agents/budgets)，session budget 是以 public list rates 計算的硬 spend cap。當 session 到達預算，系統會以 `budget_reached` 暫停，不再開始新的 model request；修改或移除 budget 後才能繼續。Deployment 設定的 budget 會套用到它啟動的每個 session。

這個語義很適合拿來做最外層的 runaway protection，但要讀清楚它的邊界：

- 預算是在 model requests 之間檢查，不是每個 token 或每個 side effect 都能即時切斷。
- 已經開始的 in-flight request 可能讓實際花費超過設定值一小段。
- multi-agent threads 共享 session budget；advisor consultation 也算在同一個 budget 裡。
- public list price 是控制語義，不一定等於企業 negotiated billing 或完整工作流成本。

因此平台不應把 budget 直接當成「這個任務一定不會超過某個帳單數字」。更可靠的實作是預留 margin，另外追蹤 tool、sandbox、外部 API、human handoff 與 retry 的成本，並在接近 cap 時發出可操作的 warning，而不是等到 `budget_reached` 才讓 workflow 突然停止。

## Delegation：advisor 與 multi-agent 必須能被解釋

Managed Agents 的 multiagent roster 可以描述 primary agent、subagent 與 advisor。Advisor 是主 thread 在中途可以諮詢的模型；這對複雜任務可能有幫助，但也會增加成本、延遲與一條新的 decision path。文件描述的是可用的 orchestration primitive，不是獨立的 accuracy uplift。

對平台工程而言，重要的是把 delegation 變成 trace state，而不是一段只存在於 prompt 的敘述。每次委派至少要留下：

1. parent session、thread 與 child agent 的關係；
2. 使用的 model、agent version、roster entry 與 skills set；
3. 委派原因、輸入摘要、輸出結論與是否改變原本計畫；
4. 額外的 tokens、latency、tool calls、budget consumption 與 human handoff；
5. child agent 是否擁有比 parent 更寬的資料或 tool scope。

如果 advisor 只能被看成「又問了一次更強的模型」，團隊就很難解釋成本為何上升、決策在哪一層改變，或某個錯誤是否來自主 thread、advisor 還是 tool result。這也是 [AI Agent architecture guide](/blog/64-ai-agent-guide/) 強調 execution envelope 與 evidence lineage 的原因。

> **花花的工程提醒**
>
> Multi-agent 不是把一個黑盒拆成幾個黑盒。每次 delegation 都應留下 parent、child、version、scope 與 cost，否則 orchestration 只增加了難以回放的狀態。

## Locality 與 skills：平台設定也是供應鏈設定

`inference_geo` 讓團隊可以在 agent 或單一 session 指定模型推論的地理位置；官方 release notes 指向 data residency 文件，並提醒可用地區與價格需要一起查。

這項設定只決定 provider 的 inference location，不代表整個 workflow 的資料都停留在同一 region。工具 API、sandbox、logs、memory store 與 backup 仍要分別標示資料流向。

同一個更新也讓 Managed Agents session 從 GitHub repository 載入 skills；session mount repository 後，根目錄 `.claude/skills` 會在 session 開始時自動被發現。這對團隊重用操作知識很方便，但也把 skills 變成新的供應鏈輸入：

- repository、branch 或 ref 的來源與 owner 要能被辨識；
- skill 內容需要 code review、secret scanning 與最小 tool scope；
- session trace 應記錄實際載入的 skill version，而不只記 repository 名稱；
- skill 更新應觸發 regression、prompt-injection 與權限測試。

「可以載入」和「可以被信任」是兩件事。技能內容若能改變 agent 的工具選擇、資料處理或 side effect，就應被當成 runtime dependency 管理，而不是普通的 Markdown 附件。

## Inference hooks：把 policy decision 放到模型請求之前

Anthropic 在 [Inference hooks 文件](https://platform.claude.com/docs/en/manage-claude/inference-hooks) 中將這項能力描述為 Claude Enterprise beta。每個受治理的 prompt 在 inference 前會先送到組織的 AI security server，等待 allow 或 deny；request 會簽名，failure handling 可配置，deny 也會記錄在 compliance Activity Feed。

這是一個比 output filter 更清楚的 enforcement point，因為 decision 發生在 model request 開始之前。但它也把幾個營運選擇變成一級問題：

| 決策 | Fail closed 的代價 | Fail open 或寬鬆模式的代價 |
| --- | --- | --- |
| Security server timeout | 可用性下降、工作中斷、需要 replay | 未經 policy verdict 的 prompt 可能繼續 inference |
| Hook schema／signature error | 需要明確的 incident 與 retry path | 若自動放行，錯誤可能被隱藏 |
| Deny result | 需要使用者可理解的 remediation | 若只顯示 generic error，團隊會反覆重試 |
| Activity Feed | 需要 retention、PII 與 access policy | 沒有證據就難以調查 policy drift |

官方文件能證明 hook 的流程與欄位，但目前不能替部署團隊回答：security server 故障時哪個 failure mode 最適合、延遲是否可接受、所有 supported surface 是否一致，以及是否存在尚未發現的 bypass。這些要在自己的 threat model、load test 與 chaos exercise 中驗證。

## 一份可操作的 runtime rollout contract

### Stage 0：先定義可回放的 session state

把 session ID、tenant、actor、agent version、model、roster、skills、inference geo、budget、policy version 與 side-effect scope 放進最小 trace。不要等事故發生才發現只有 prompt text，卻沒有決策上下文。

### Stage 1：用 budget 做 bounded execution

先為不同 workflow 設定保守 budget，明確區分 model spend 與工具／外部服務成本。測試正常完成、retry、advisor、multi-agent fan-out、長時間 idle 與 budget reached 的 recovery。

### Stage 2：固定 delegation 與 skill provenance

為 parent／child agent 建立 allowlisted roster；對重要 agent 釘住可回溯的 version，並為 repository skill 建立 review owner、來源 ref、變更 diff 與撤銷流程。若目前不能 pin，至少把每次實際解析到的 commit 或內容 hash 記進 trace。

### Stage 3：把 locality 變成資料流圖

列出 inference、tool call、sandbox、memory、logging、backup 與 human review 的實際位置，分別標註資料類型與 retention。`inference_geo` 是其中一個選項，不是完整 residency guarantee。

### Stage 4：以 hook 做 policy canary

先針對高風險 prompt、敏感資料與高成本 workflow 啟用 hook，準備 signed request verification、timeout、retry、deny message、manual review 與 emergency disable。觀察 allow／deny rate、latency、false positive、重試與 handoff，不要只看模型輸出是否成功。

### Stage 5：持續重跑 failure exercises

模型、agent version、skills、MCP server、policy server 與資料來源任何一項改變，都可能讓舊的 evaluation 失效。把 budget boundary、delegation trace、skill poisoning、region mismatch、hook outage 與 Activity Feed completeness 放進回歸測試。

## 文件沒有替你解決的問題

Managed Agents 的控制面已經比「把規則放進 system prompt」成熟，但仍要保留幾個 unknown：

- budget 以 public list rates 計算，與 negotiated contract、工具成本、重試和外部 side effect 的總帳單如何對齊，仍需部署方實測；
- in-flight request 可能 overshoot，且 model request 之間的檢查不會自動撤銷已發生的 side effect；
- advisor、skills、model version、region 與 hooks 的相容性和可用性可能受 beta、模型或部署地區限制；
- inference hooks 的 signed request 與 Activity Feed 不等於已證明 zero-bypass；仍需做故障、重放、延遲與攻擊測試；
- 官方 feature semantics 不提供獨立的品質提升或事故下降證據。

## 平台團隊應該留下什麼能力

1. 把 spend、delegation、version、locality、skills provenance、policy verdict 與 side effect 做成一級事件，而不是藏在散落的 log 裡。
2. 把「停止」設計成可恢復狀態：budget reached、policy denied、hook timeout、credential revoked 與 human handoff 都要有明確的 retry／abort 語義。
3. 把 beta 或 vendor-specific capability 包在可替換 adapter 裡，並保存 provider claim、實測結果與未知項目，不讓產品文件變成唯一的安全證據。
4. 對高影響工作流保留 deterministic authorization：模型可以提出計畫，runtime、tool gateway 或人工核准才決定 side effect。

Anthropic 最近的 Managed Agents 變化，值得看的不是某個設定名稱，而是它把 agent runtime 的責任邊界畫得更清楚：平台要能限制成本、限制委派、記錄來源、選擇地域、攔截請求，並在失敗時留下可調查的理由。當這些 state 都能被觀察與回放，長時間 agent 才有機會從 demo 變成可以營運的服務。

## Primary sources

- [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview)
- [Session budgets](https://platform.claude.com/docs/en/managed-agents/budgets)
- [Multiagent orchestration](https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration)
- [Inference hooks](https://platform.claude.com/docs/en/manage-claude/inference-hooks)
- [Accessing GitHub repositories from Managed Agents](https://platform.claude.com/docs/en/managed-agents/github)
