---
title: "MCP 2026-07-28 規格：無狀態核心、Tasks、Apps 與遷移判斷"
description: "解讀 Model Context Protocol 2026-07-28 正式規格的 breaking changes、Tasks 與 Apps 擴充，並整理企業升級、相容性與安全控制清單。"
pubDate: 2026-07-02
updatedDate: 2026-08-09
tldr:
  - "MCP 2026-07-28 移除必要 handshake 與 session header，讓任一請求可路由到任一 server instance。"
  - "Tasks 與 MCP Apps 屬官方 extensions；是否可用仍取決於 client、server 與 SDK 的版本支援。"
  - "無狀態降低 transport 協調成本，但不會自動提供授權、配額、審批、輸入驗證或稽核。"
audience:
  - "建置或營運 MCP client、server 與 Agent 平台的工程師"
  - "評估 MCP 升級、安全與相容性風險的平台架構師"
category: "AI Engineering"
tags: ["MCP", "AI Agent", "Cloud Native", "架構模式"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 2
kind: "article"
showToc: true
image: "/blog/34-model-context-protocol-mcp/title_image.webp"
---

Model Context Protocol（MCP）在 2026 年 7 月 28 日發布新規格。這不是單純增加幾個 method，而是重新定義 remote MCP 的部署假設：核心 protocol 不再要求 `initialize`／`initialized` handshake 與 `Mcp-Session-Id`，請求攜帶自己的 protocol version、client identity 與 capabilities，因此可以由一般 load balancer 分配到不同 server instance。

官方 [2026-07-28 release note](https://blog.modelcontextprotocol.io/posts/2026-07-28/) 同時把長時間工作與互動 UI 放進 extensions 生態。這讓 MCP 更接近可水平擴充的 Web workload，但也帶來 breaking migration：舊 client、舊 server、SDK 與 host feature 不會因規格發布就同步升級。

> **花花的一句話**
>
> 新版 MCP 把「每條連線的 session」改成「每個請求自帶足夠脈絡」，讓 server 更容易水平擴充。

> **花花的工程提醒**
>
> Stateless 是部署性質，不是安全保證；每次 tool call 仍要驗證身份、權限、輸入、配額與審批條件。

## 1. 無狀態核心改變了什麼

在 2026-07-28 規格中，client 不必先完成 handshake 才能呼叫 method，也不再依靠 session ID 維持 transport affinity。Request 以 header 和 `_meta` 攜帶版本、method、tool name、client information 與 capabilities。若 client 想先詢問 server 能力，可以使用 `server/discover`，但 discovery 並非每次請求的必要前置步驟。

這項變更的工程效益是：

- Load balancer 不必維持 sticky session。
- Worker 可在請求間被替換，較適合 autoscaling 與 serverless runtime。
- Transport state 不必存進共享 session store。
- 單一失效 instance 不會直接使特定 session 無法延續。

但「protocol core 無狀態」不代表應用沒有狀態。Long-running task、使用者授權、rate limit、審批與業務交易仍需要 durable storage。差別是它們必須成為明確的應用資源，而不是藏在 transport session 裡。

## 2. Tasks：把非同步工作從連線抽離

Tasks 現在屬於 `io.modelcontextprotocol/tasks` extension。Server 可以針對支援 extension 的請求回傳 task handle，client 再用 `tasks/get` 取得狀態或結果、用 `tasks/cancel` 取消，draft extension 也定義 `tasks/update`。核心意義是把「請求是否完成」從單一 HTTP 連線的 timeout 解耦。

不過 Tasks 並沒有替你完成 job system。Server 仍需決定：

- Task ID 的授權範圍與不可猜測性。
- Durable store、worker retry 與 idempotency。
- Deadline、取消語意與部分失敗處理。
- Result retention、刪除與個資保存政策。
- 每個 tenant 的 concurrency、CPU、token 與成本配額。

對編譯、大型查詢或長時間 Agent 工作，Tasks 是 protocol contract；queue、scheduler 與 policy 才是 production implementation。

## 3. MCP Apps：工具結果可以帶互動介面

[MCP Apps](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) 是官方 extension，讓 tool 宣告 `ui://` resource，host 以 sandboxed iframe 顯示 chart、form、dashboard 或多步驟 workflow。View 與 host 透過標準 bridge 傳遞 tool data、訊息與後續 tool call。

這裡最容易過度推論。Server 不能假設所有 client 都會 render App；host support 仍有差異。因此 tool 必須保留結構化、可理解的 fallback result。安全上也必須檢查：

- iframe sandbox 與 Content Security Policy。
- `postMessage`／bridge message 的 origin 與 schema。
- UI 觸發 tool 時是否重新做 authorization。
- HTML、URL、外部 asset 與使用者輸入的 sanitization。
- Host 不支援 App 時是否仍能完成核心工作。

MCP Apps 適合需要互動探索的輸出，不應把每個純文字 tool 都包成前端應用。

## 4. Authorization 與 deprecation

新版規格以 Client ID Metadata Documents（CIMD）作為方向，Dynamic Client Registration 進入 deprecated 路徑；credential 必須綁定簽發它的 issuer。Roots、Sampling、Logging 與 legacy HTTP+SSE transport 也進入 deprecation window，官方說明保留至少十二個月的離場時間。

這不代表所有環境都該立即移除舊能力。升級前應先盤點：

1. Client 與 server 實際宣告的 protocol version。
2. 使用的 SDK 是否支援 2026-07-28。
3. 是否仍依賴 session ID、roots、sampling、logging 或 SSE。
4. Host 是否支援 Tasks 與 Apps，而不只是 SDK 能編譯。
5. Authorization server 是否支援新的 client metadata 與 issuer binding。

## 5. 企業遷移策略

建議採取相容性矩陣，而不是一次切換所有 integration：

| 階段 | 主要動作 | 驗收證據 |
| --- | --- | --- |
| Inventory | 記錄 client、server、SDK、transport 與 extensions | 完整 dependency map |
| Dual testing | 舊版與 2026-07-28 contract test 並行 | 每個 tool 的 success/error/timeout 結果 |
| State extraction | 將 session state 改成明確 task 或業務 state | 任一 instance 可處理後續請求 |
| Security review | 驗證 identity、authorization、quota、audit | 越權與跨 tenant 測試 |
| Progressive rollout | 依 client/tenant 分批升級與回退 | error rate、latency、task completion 指標 |

如果只是本機 stdio server，無狀態 remote transport 的收益可能不大；如果是多租戶、跨區域、需要 autoscaling 的 MCP 平台，這次規格的架構價值才會明顯。

## 6. MCP 沒有替你解決的問題

MCP 標準化 capability discovery、tool invocation、resources 與 extensions，但不保證：

- Tool 的業務語意正確或沒有 prompt injection。
- Model 選到正確工具或參數。
- 使用者有權執行高影響操作。
- Server 對重試具備 idempotency。
- Result 真實、完整或符合資料治理政策。

把 MCP 接上 Agent 前，仍應依 [企業 AI Agent 安全架構](/blog/43-enterprise-ai-agent-security/) 建立 control plane，並依 [AI Agent 實戰指南](/blog/64-ai-agent-guide/) 為工具選擇與結果建立 evaluation。想理解 Skills 與 MCP 的職責差異，可讀 [Agent 時代的四種擴充能力](/blog/29-agent-era-skills-subagents-commands-hooks/)。

## Primary sources

- [MCP：The 2026-07-28 Specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- [MCP Apps official extension](https://apps.extensions.modelcontextprotocol.io/)
- [MCP Tasks official extension](https://tasks.extensions.modelcontextprotocol.io/)
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2026-07-28)
