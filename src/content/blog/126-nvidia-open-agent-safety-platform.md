---
title: "NVIDIA Open Agent Safety Platform：把可執行控制和外部觀測分開驗證"
description: "拆解 OpenShell 可檢查的 Agent runtime 控制，以及 NVIDIA 所提出的 BlueField-4／Sentry 參考設計，釐清兩層各自能做什麼、仍缺哪些成效證據。"
pubDate: 2026-09-29
updatedDate: 2026-09-29
tldr:
  - "OpenShell 的公開程式碼與文件描述可執行的 sandbox、kernel isolation、egress policy、credential mediation 與 policy review；這些控制仍需在目標 runtime 和威脅模型下驗證。"
  - "Sentry／BlueField-4 是 NVIDIA 提出的基礎設施層參考設計，聲稱能在 Agent workload 之外觀測並執行 policy；它和 OpenShell 公開 runtime 不是同一項交付物。"
  - "目前來源未提供獨立 latency、false-positive、red-team 或部署韌性結果；應把架構意圖和量測證據分開採購與驗收。"
audience:
  - "設計 Agent runtime、sandbox、網路出口與憑證邊界的工程師"
  - "評估 AI 平台安全架構與供應商證據的企業平台及資安團隊"
category: "AI Engineering"
tags: ["AI Agent", "AI 安全", "Enterprise AI", "Governance"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 43
kind: "article"
showToc: true
image: "/blog/126-nvidia-open-agent-safety-platform/title_image.webp"
---

NVIDIA 的 Open Agent Safety Platform 把 Agent 安全拆成應用程式、runtime 與基礎設施三層。真正值得工程團隊評估的，不是「多一個安全層」這句總結，而是每層到底能攔什麼、能看到什麼、遇到違規時由誰採取動作。本文的判斷是：**OpenShell 已公開一套可以檢查和試跑的 runtime 邊界；Sentry 搭配 BlueField-4 則是 NVIDIA 提出的硬體側參考設計，效能與偵測成效仍待獨立證明。**

> **花花的判斷**
>
> Sandbox 能執行一條權限規則；外部 observer 只有在看得到關鍵流量、且能可靠地中止或隔離 workload 時，才會增加可驗證的防護。

## 先把「控制」、「觀測」和「回應」分開

在 [2026 年 9 月 28 日的技術文章](https://developer.nvidia.com/blog/nvidia-open-agent-safety-platform-a-reference-for-continuous-in-silicon-agent-monitoring/)中，NVIDIA 把 OpenShell 放在 Vera CPU 上的 Agent runtime，並將 Sentry 描述為 BlueField-4 DPU 上的獨立 watchdog。文章主張，DOCA 可把 Agent interaction、policy decision、tool 與 data access 事件關聯成活動紀錄；對 Vera Rubin POD，NVIDIA 也聲稱 BlueField-4 位於 node 通往 model 的唯一路徑，因此可以在 host 之外持續觀測並以 line speed 執行 policy。這些是供應商對目標架構的說明，不是公開量測結果。

三層各有不同責任：

| 層 | 可執行或觀測的責任 | 公開材料可供驗證的部分 |
| --- | --- | --- |
| Application／Agent harness | 決定任務、選擇模型和工具、產生讀寫請求；應提供可信的主體與資源上下文 | NVIDIA 參考架構描述其角色，但 workload 的工具定義與應用權限仍由部署者負責 |
| OpenShell runtime | sandbox 約束檔案與 process；sandbox 對外只經 supervisor；supervisor 對 egress 做 policy check、注入受限憑證、記錄事件並可拒絕請求 | 開源 repository、CLI、policy、gateway、supervisor、sandbox 程式碼和文件可檢查與試跑 |
| Sentry／BlueField-4 | NVIDIA 描述它在隔離於 host 的 DPU 上觀測流量、關聯行為並在偏離時介入 | 有參考設計敘述與廠商架構主張；在本文檢視的公開來源中，未找到可獨立執行的 Sentry 實作或量測套件 |

這裡要小心「out-of-band」一詞。OpenShell 的 supervisor 位於 Agent sandbox 外側，對 workload 而言是信任邊界之外；但它仍屬於 OpenShell 的軟體 runtime 與執行環境。BlueField-4／Sentry 則是 NVIDIA 宣稱再把觀測與 enforcement 移到 host 之外的硬體層。兩個「外部」指向不同威脅模型，不能混為同一個獨立性保證。

## OpenShell：有程式碼可檢查的執行包絡

NVIDIA 的 [OpenShell 0.1.0 walkthrough](https://developer.nvidia.com/blog/add-runtime-controls-to-ai-agents-with-nvidia-openshell/)描述三個主要元件：Gateway 管理 sandbox 生命週期與政策；Supervisor 在 sandbox 外檢查對外請求；Sandbox 裡才執行 Agent 與本機工具。其文件更細分責任：sandbox 的外層網路 fence 阻擋直接 egress，workload 只能透過受保護的通道到 supervisor；supervisor 按 destination、calling program 與 policy 做決策，再代表 sandbox 連線。若 policy 允許特定服務，憑證可由 supervisor 綁定到核准端點，避免 Agent 直接取得真實 secret。

公開 [OpenShell repository](https://github.com/NVIDIA/openshell)包含 CLI、gateway、supervisor、sandbox、policy 與測試；README 提供可建立本機 sandbox 的 quickstart。文件目前也列出 filesystem、process、network 和 inference 等控制面向：Linux 後端以 Landlock、seccomp 等機制限制檔案和系統呼叫，網路請求經代理與 policy engine；HTTP／GraphQL／MCP 等設定可進一步按方法或路徑限制請求。團隊可檢查 policy 變更、測試工具呼叫被允許或拒絕時的行為，並把自己的 Agent 接到受限環境。

「形式驗證」也要按其實際範圍理解。公開文件中的 Policy Prover 會檢查候選 network policy 是否擴大 credentialed host、HTTP method 或 metadata endpoint 等權限，對風險變更提出阻擋或交由人審。它是在檢查**權限模型的變更**，並不證明自然語言指令等同於政策、策略沒有設錯，或整個 Agent 系統不會產生有害結果。管理者仍須核對 workload 的身分、政策來源、工具參數與被檢查的有效邊界。

這使 OpenShell 是值得做控制驗證的公開軟體，不等於完成正式環境認證。README 的 quickstart 可以作為本機實驗入口；想上 Kubernetes 或共享 gateway，還要驗證部署自己的網路隔離、憑證生命週期、gateway 權限、映像來源、政策更新失敗行為，以及可用性和日誌保留。不要只以「Agent 成功在 sandbox 啟動」當成安全驗收。

## Sentry／DPU：架構主張需要可重現的證據鏈

NVIDIA 的說法有一個工程上的吸引力：若 Agent 或 host 已遭入侵，與 host 分離的觀測點有機會保留另一份流量視圖，並在關鍵路徑上阻止特定行動。該公司把 BlueField-4 描述為不受 Agent 或 host 控制的硬體 watchdog，也提到在 Vera Rubin POD 上 model traffic 經過該 DPU。這可以形成有價值的威脅模型，但仍是特定基礎設施設計的廠商陳述；不能推廣成所有 OpenShell 部署都有硬體隔離或 DPU enforcement。

可用的公開材料沒有回答幾項部署決策的必要問題：

1. **觀測覆蓋率**：哪些 model、tool、MCP、檔案與資料庫存取會經過 DPU？旁路、快取、代理轉送或管理流量是否可繞過？「唯一 model path」是否涵蓋工具和資料服務，來源沒有量化說明。
2. **回應語義**：偏離 behavioral profile 後，是阻擋單一連線、凍結 Agent、隔離整個 workload，還是先告警？誤判、DPU 失聯、重啟與政策版本不一致時採用何種 fail-open／fail-closed 行為？
3. **效能與品質**：NVIDIA 的文章未提供 p50／p95／p99 enforcement latency、吞吐影響、false-positive／false-negative 分母，或不同策略複雜度下的成本比較。
4. **安全評估與運維**：目前來源沒有獨立 red-team 報告、攻擊測試集、跨 host 逃逸測試、部署復原演練或可供重跑的 Sentry 測試工件。

這些缺項不表示設計無效，而是代表讀者目前能驗證的是架構意圖，不能據此判定偵測準確度、攔截延遲或故障時的實際保護水準。建立驗收條件時，應要求涵蓋允許流量、越權流量、策略變更、DPU 不可用與管理面受攻擊的端到端測試，並公開測試環境、樣本數、誤報和漏報定義、延遲分布及恢復結果。

> **花花的工程提醒**
>
> 在沒有可重跑的 Sentry 實作與故障測試前，請把 BlueField-4 的觀測和介入能力列為待驗收的架構主張，別把它計入已證明的控制覆蓋率。

## 採用時先驗證責任邊界，再驗證產品組合

對工程團隊來說，適合的評估順序是：

1. **寫出資產和路徑**：列明 Agent 的 model、工具、MCP、檔案、API、憑證與副作用，再標出每條連線在哪裡被決策、記錄和阻擋。
2. **先試跑 OpenShell 控制**：建立最小權限 policy，以良性和惡性請求確認 egress、方法／路徑限制、credential 綁定、拒絕紀錄與 sandbox 邊界真的生效。將 Prover 的輸出視為政策審查輸入，不是安全證明書。
3. **指定每種失效的反應**：測試 supervisor、gateway、model path 或 DPU 不可用時，workload 是停止、凍結、繼續還是改道；確認操作者能撤銷憑證並重建可信狀態。
4. **單獨驗收硬體層**：若採用 Sentry／BlueField-4，要求供應商提供實際可檢查的 policy-to-event mapping、流量覆蓋矩陣、延遲與誤報資料、紅隊結果及故障注入演練，再於自己的 topology 重跑。

OpenShell 的重點是把一部分 Agent 權限控制帶到模型以外，並提供公開實作供工程師審查；Open Agent Safety Platform 則進一步提出 DPU 作為獨立觀測和 enforcement 點。企業可以先用前者驗證具體政策是否符合自己的 workload，再把後者當成另一個須用量測和失效演練確認的安全主張。閱讀路徑可接續[企業 AI Agent 安全架構](/blog/43-enterprise-ai-agent-security/)、[AI Agent 工程指南](/blog/64-ai-agent-guide/)、[Docker Sandbox Kit 的權限請求與 runtime 邊界](/blog/124-docker-sandbox-kit-authority-as-code/)及[從評估風險到 runtime governance](/blog/123-microsoft-run-assert-eval-risk-to-runtime-governance/)。

## 來源

- NVIDIA Technical Blog：[NVIDIA Open Agent Safety Platform: A Reference for Continuous In-Silicon Agent Monitoring](https://developer.nvidia.com/blog/nvidia-open-agent-safety-platform-a-reference-for-continuous-in-silicon-agent-monitoring/)，2026-09-28。架構主張與 Sentry／BlueField-4 定位。
- NVIDIA Technical Blog：[Add Runtime Controls to AI Agents with NVIDIA OpenShell](https://developer.nvidia.com/blog/add-runtime-controls-to-ai-agents-with-nvidia-openshell/)，2026-09-28。OpenShell 0.1.0 元件與 runtime 控制 walkthrough。
- NVIDIA：[OpenShell GitHub repository](https://github.com/NVIDIA/openshell)。公開程式碼、README 與 quickstart。
- NVIDIA：[OpenShell overview and architecture documentation](https://docs.nvidia.com/openshell/latest/about/overview) 與[架構說明](https://docs.nvidia.com/openshell/latest/about/architecture)。文件涵蓋 sandbox、supervisor、network mediation 與 Policy Prover。
