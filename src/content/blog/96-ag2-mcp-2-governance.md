---
title: "AG2 v1.0.3：MCP 2.0 Migration 與確定性 Agent Governance"
description: "拆解 AG2 v1.0.3 的 MCP 2.0 breaking migration、TealTiger deterministic governance 與可驗證的 Agent runtime rollout 邊界。"
pubDate: 2026-09-09
updatedDate: 2026-09-09
tldr:
  - "AG2 v1.0.3 將 client 與 server 的 MCP surface 一起遷移到 MCP 2.0，依賴範圍固定為 mcp>=2.0.0,<3；這是相容性 migration，不是一般 patch upgrade。"
  - "TealTiger 把工具 allowlist、PII／secret／prompt injection 檢查、成本上限、kill switch 與 TEEC receipt 放在沒有 LLM 的 deterministic path 上。"
  - "最安全的採用方式是先做 client／server／SDK 矩陣與 contract tests，再以 MONITOR shadow test 推進 ENFORCE；deterministic 不等於完整安全。"
audience:
  - "負責 Agent runtime、MCP integration 或 AI platform governance 的工程師"
  - "需要把開源 Agent framework 升級成可測試、可稽核正式服務的架構師與安全團隊"
category: "AI Engineering"
tags: ["AI Agent", "MCP", "Enterprise AI", "Governance", "Platform Engineering"]
cluster: "ai-platform-governance"
clusterRole: "signal"
clusterOrder: 11
kind: "article"
showToc: true
image: "/blog/96-ag2-mcp-2-governance/title_image.webp"
---

AG2 v1.0.3 在 2026 年 8 月 28 日發布，表面上是一個版本更新，實際上同時改了兩個 production boundary：MCP integration 的 protocol contract，以及 Agent tool call 的 governance path。官方 [v1.0.3 release notes](https://github.com/ag2ai/ag2/releases/tag/v1.0.3) 明確把所有 MCP surface 搬到 MCP 2.0，並把依賴範圍提高到 `mcp>=2.0.0,<3`；同一版也加入 TealTiger 的 prompt injection policy。

這篇不把 release note 當成「升級後就安全」的公告，而是回答一個更實際的問題：**如果團隊要把 AG2 v1.0.3 放進 Agent runtime，哪些部分必須遷移、哪些部分可以由 deterministic governance 接住，以及要用什麼測試證明它真的在自己的部署邊界內工作？** 結論是：先將 MCP 2.0 當成相容性專案處理，再將 TealTiger 當成工具執行前的可觀測控制點；兩者都不能取代服務端授權、供應鏈審查或高風險操作的人工作業。

> **花花的一句話**
>
> AG2 v1.0.3 的重點不是「Agent 更自主」，而是把 protocol migration 與每次 tool call 的治理決策變成可以明確測試、記錄與回溯的 runtime contract。

## 這次 release 改的是兩條邊界

AG2 是一個以 `ag2` 為頂層套件、以 async Agent、工具與多 Agent 協作為核心的 framework；官方 repository 的 README 也提醒，v1.0 之後它不再提供 classic `autogen` import 與舊的 classic agent classes。這篇聚焦在 v1.0.3 的 MCP 與治理變更，但這個背景很重要：不要把 Classic 專案的升級，誤判成只改一個 Python dependency。

v1.0.3 的 release notes 可以拆成兩個互相配合、但責任不同的面：

| 變更面 | AG2 v1.0.3 提供的能力 | 團隊仍必須驗證的事 |
| --- | --- | --- |
| MCP 2.0 migration | 所有 MCP client／server surface、server metadata、modern conversation handling | 舊 SDK、client、host、transport 與自家 wrapper 是否仍相容 |
| Deterministic governance | tool allowlist、PII、secret、prompt injection、cost、kill switch、decision 與 receipt | policy 是否覆蓋真正的 tool path，規則是否有誤判，授權是否仍在正確的服務端 |
| Agent runtime | ACP human-input failure 不再無限等待，另有多項 subagent、evaluation 與 usage accounting 修正 | timeout、retry、state、人工接管與 rollback 是否符合自己的 SLO |

工程上的關鍵，是不要把三列合併成一個「安全升級」標籤。MCP 2.0 解決的是 protocol contract；TealTiger 解決的是 AG2 tool execution 前的 policy decision；而資料權限、目標 API 的業務授權與使用者同意，仍在更外層。

## MCP 2.0 migration：不是換版本字串而已

### 依賴與 API 的 breaking surface

release note 將 MCP 依賴上限寫成 `mcp>=2.0.0,<3`，並提醒如果應用自行 pin 了低於 2.0 的 `mcp`，或其他套件把它 pin 在 2.0 以下，就必須先更新 pin。這表示升級前應先查完整 dependency graph，而不是只執行 `pip install -U ag2`。

從 v1.0.3 tag 的 `pyproject.toml` 可以看到，`ag2[mcp]` 同時要求 `mcp>=2.0.0,<3`、`mcp-types>=2.0.0,<3` 與用於 tool argument validation 的 `jsonschema`。這個 extra 的存在也說明一個採用邊界：MCP serving／consuming 不是每個最小 AG2 安裝都自動具備的能力，部署 manifest 必須明確宣告它。

更容易被忽略的是 handler contract。v1.0.3 的 [MCP server 原始碼](https://github.com/ag2ai/ag2/blob/v1.0.3/ag2/mcp/server.py)註明，MCP 2.0 移除了 1.x 的 decorator registration API；新的 handler 透過 constructor callback 註冊，接收 request context 與 typed params，回傳完整 result model。2.0 也不再由 1.x decorator 自動完成同樣的 argument validation 與錯誤轉換，因此 AG2 在 serving layer 明確保留兩個相容性責任：

- 依照廣告中的 input schema 先做 validation，避免不合格式的 arguments 直接進入 handler。
- 將 handler exception 轉成 tool-level error result，避免原本的 tool error 語意意外變成 caller 不預期的 JSON-RPC error。

這是很好的 migration 訊號：**protocol SDK 的型別能編譯，不代表應用層的錯誤語意仍然相同。** Contract test 應該對成功結果、schema error、未知 tool、handler failure 與部分 capability 都留下預期形狀。

### 會話狀態從 transport 移到明確 handle

MCP 2026-07-28 的核心方向是 self-contained request：現代 protocol era 不再依賴 `initialize`／`initialized` handshake 與 `Mcp-Session-Id` 來代表連線狀態。官方 [MCP specification](https://modelcontextprotocol.io/specification/2026-07-28) 將 base protocol 描述為 stateless、每次 request 自帶 capability negotiation；extensions 則必須由 client 與 server 明確支援，不能把 extension 的存在當成核心能力。

AG2 v1.0.3 的 [ADR 0015](https://github.com/ag2ai/ag2/blob/v1.0.3/docs/adr/0015-mcp-conversation-continuity-by-handle.md) 把這項變化落成具體行為：

1. 有命名的 conversation 由 server mint 的 opaque handle 指向；caller 不能自行選一個 key 來建立或驅逐別人的 history。
2. 舊 handshake era 沒有命名 conversation 時，仍可使用 MCP session；現代 era 沒有 session，未命名呼叫則從 fresh conversation 開始。
3. handle 同時放在文字結果與 `_meta` 的 `ai.ag2/conversation`，分別服務 model recovery 與 programmatic client；不混入 agent 自己的 `structuredContent` schema。
4. unknown、expired 或 principal 不匹配的 handle 會成為 tool execution error，而不是悄悄 fallback 到另一段 history。

這個設計消除了「同一條 connection 就是同一個 conversation」的直覺假設，卻也把責任推回部署者：如果是多 replica 服務，應驗證 handle registry 與 history backend 的可達性、TTL、LRU eviction、principal binding 與跨 replica 行為。ADR 明確指出，共用 history storage 本身不會自動讓每個 replica 都能解析同一份 handle mapping；若沒有額外的 routing 或共享 registry，重試可能得到合法但不同的 conversation。

若是 expose AG2 Agent 的 [MCPServer](https://docs.ag2.ai/docs/user-guide/tools/serving_mcp/)，預設 sessions 會累積 multi-turn history；若選擇 `sessions=False`，就不能假設 caller 還能拿到可延續的 handle。這些選項應被視為資料生命週期與安全設定，而非單純的 transport preference。

### 先分清 client-side 與 provider-side

目前 AG2 文件把接入 MCP server 分成兩條路徑：[MCPToolkit](https://docs.ag2.ai/docs/user-guide/tools/mcp_servers/) 由 AG2 自己連線、discover tools 並在本地執行；`MCPServerTool` 則把 URL 與 credentials 交給原生支援 MCP passthrough 的 LLM provider。前者能用於任意 provider、支援 local stdio、也讓 AG2 middleware 看到 tool call；後者的生命週期由 provider 管理，credentials 會離開自己的 infrastructure。

因此採用決策很直接：需要 local control、provider portability、stdio 或 AG2-side governance 時，優先從 `MCPToolkit` 開始；只有在明確信任 provider、理解 credentials 邊界，且接受 provider-side tool filtering 語意時，才選 `MCPServerTool`。官方文件也提醒，某些 provider 的 remote MCP request 只有 allow-list，未必能表達 `blocked_tools`；不能把 provider 的 tool descriptor 當成自己的 enforcement point。

這也延續 [MCP 規格更新：無狀態核心、Tasks 與 Apps](/blog/34-model-context-protocol-mcp/) 的閱讀重點：protocol interoperability 降低接入成本，卻不會自動產生 authorization、quota、approval、input validation 或 audit。

## Deterministic governance：把政策放到 tool call 前面

TealTiger 是 v1.0.3 隨 AG2 提供的 `ag2.extensions.tealtiger` 模組。官方文件寫得很清楚：它在沒有 LLM 的 governance path 上處理工具 allowlist／blocklist、arguments validation、PII 與 secret detection、prompt injection、session cost、per-agent kill switch，並產生 structured TEEC audit receipts；不需要額外 API key 或外部治理套件。

「Deterministic」在這裡有明確的工程含義：給定相同的 tool name、serialized arguments、policies 與 mode，decision 由 in-process glob／precompiled regex 與成本狀態決定，不把「這次要不要放行」再交給另一個 model 判斷。v1.0.3 新增的 prompt injection detection 也不是 keyword-only 的萬用分類器；原始碼的 pattern 針對 instruction override、jailbreak framing 與 context manipulation 等結構，並為 finding 設定 confidence。

它目前提供三種 rollout mode：

- `OBSERVE`：跳過 policy evaluation、放行並追蹤成本，適合最低干擾的初始基線。
- `MONITOR`：執行 policy evaluation、記錄會被拒絕的 decision，但不阻擋，適合 staging 或 shadow test。
- `ENFORCE`：命中 policy 時阻擋 tool call，適合已完成規則驗證的 production path。

此外，budget limit 在 policy evaluation 前檢查；freeze 可以依 agent name 暫停該 agent 的 turn 與 tool call；decision 會保留 action、mode、reason code、risk score、evaluation time 與累積成本；每次 tool evaluation 都會產生 TEEC receipt，標示 executed 或 blocked。長生命週期的 middleware factory 也可以被多個 Agent 共用，集中保存 decisions、receipts、cost 與 frozen agents。

> **花花的工程提醒**
>
> 無 LLM 的 policy path 讓結果可預期、可 replay、可在沒有 API key 的測試環境執行；它不代表 regex 覆蓋了所有語言與攻擊變體，也不代表被允許的 tool 一定對租戶、資料或目標 API 有權限。

從 [Enterprise AI agent security](/blog/43-enterprise-ai-agent-security/) 的 threat model 來看，TealTiger 主要接在「runtime tool execution」這一格。它無法替代 identity／tenant isolation、服務端 authorization、secret manager、供應鏈驗證、輸出審批，或高影響寫入動作的 human approval。對 prompt injection 而言，它是低延遲的第一道規則層；若輸入來自不可信文件或跨語言資料，仍應把 detection findings 加進獨立 evaluation，而不是宣稱已完成防禦。

## 採用邊界：什麼情況值得升級

AG2 v1.0.3 很適合以下條件：團隊確實需要 MCP 2.0 的 stateless request／modern conversation model；希望一個 Agent framework 同時接 remote HTTP 與 local stdio；或需要在 AG2 tool execution 前集中做 allowlist、敏感資訊、成本與 audit。

相反地，以下情況不應只靠「升到 1.0.3 + 開 ENFORCE」作為答案：

- Classic `autogen` application 還沒完成 Agent、orchestration 與 import migration。先依 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 重新盤點狀態、工具、評測與失敗復原。
- 服務需要嚴格跨 replica 的 conversation continuity，卻沒有共享 handle registry、可驗證 routing 或明確的 session expiry。
- Provider-side MCP 會把 credentials 交給不在信任邊界內的 provider，或 `blocked_tools` 的語意在該 provider 無法表達。
- tool 會刪除資料、移動資金、改變 production state 或處理高敏感個資。這些操作仍需要目標服務端的 authorization、idempotency、approval 與完整 audit。

換句話說，MCP 2.0 適合當 integration contract，TealTiger 適合當 runtime policy checkpoint；兩者都不是 business authorization contract。這也是 [GitHub Copilot MCP 企業治理](/blog/87-github-mcp-enterprise-controls/) 所強調的 control-plane 分層：policy、enforcement、telemetry 必須連在一起，卻不能互相冒充證據。

## 一套可以真的驗證的 migration plan

### 1. 先建立相容性矩陣

把每條 integration 寫成一列：AG2 版本、`mcp`／`mcp-types` 版本、client、server、SDK、host、transport、是否依賴 handshake/session、是否使用 metadata、conversation 或 optional extension。對 Classic 專案另列 migration，不要把舊 import 與新 `ag2` 混在一個模糊的成功標準裡。

### 2. 把 protocol 行為寫成 contract tests

至少測試：舊 client 與現代 request 的協商、tools／resources／prompts list、server metadata、valid／invalid arguments、unknown tool、handler exception、tool-level error、stdio 與 HTTP、未命名與命名 conversation、unknown／expired handle、principal mismatch、LRU／TTL，以及兩個 replica 間的 retry。若採用 `MCPServer`，還要測試 `sessions=True`、`sessions=False`、`stateless=True` 的組合是否符合自己的 continuity 期待。

### 3. 把治理規則寫成 policy tests

對每一條 allowlist 測試允許與拒絕的 tool name；對 PII、secret 與 prompt injection 測試正常值、誤判案例、多語輸入、巢狀 serialized arguments 與超長 arguments。接著在三種 mode 下驗證相同 input 的 action、reason code、risk score、成本累積與 receipt outcome。若需要確保 middleware 真的包住 MCP tool，應以 client-side `MCPToolkit` 做整合測試，不能只對 policy helper 做 unit test。

### 4. 先 MONITOR，再 ENFORCE

在 staging 以 `MONITOR` 做 shadow run，保存 policy version、tool name、serialized argument 的資料分類、decision、reason code、latency 與 receipt；修正 false positive 後，挑選 read-only 或可快速 rollback 的 canary。切到 `ENFORCE` 後，持續觀察 denial、人工接管、tool error、成本與任務完成率。這個流程與 [Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/) 的原則一致：runtime 能跑只是起點，控制面必須能說清楚發生了什麼。

### 5. 預先定義回退條件

回退不應只寫成「把 enforcement 關掉」。要明確定義 protocol error rate、conversation continuity failure、policy false-positive rate、未知 handle、receipt 遺失與成本異常的門檻；準備相容的 dependency lock、舊版 deployment、session／handle cleanup 與資料保留方案。對高風險 tool，回退到人工流程通常比回退到 unrestricted execution 更合理。

## 最後的工程判斷

AG2 v1.0.3 值得注意，並不是因為它把 MCP 或 governance 包裝成一個更大的 Agent 故事，而是它把兩個長期被隱藏的假設攤到檯面上：protocol 的連線不應被當成 conversation identity；模型提出的 tool call 不應直接等於可執行的 action。

對平台團隊而言，最有價值的升級路徑是把 MCP 2.0 migration、dependency lock、handle lifecycle、tool policy、receipt、evaluation 與 rollback 放在同一份 runtime contract 裡。先用測試證明 request、state 與 error 的語義，再用 deterministic governance 降低 policy decision 的不確定性；最後仍要讓每個真正改變資料或外部狀態的服務，自己守住 authorization 與 approval。

## Primary sources

- [AG2 v1.0.3 release notes](https://github.com/ag2ai/ag2/releases/tag/v1.0.3)
- [AG2 repository README](https://github.com/ag2ai/ag2/tree/v1.0.3)
- [AG2 v1.0.3 `pyproject.toml`](https://github.com/ag2ai/ag2/blob/v1.0.3/pyproject.toml)
- [AG2 v1.0.3 MCP server implementation](https://github.com/ag2ai/ag2/blob/v1.0.3/ag2/mcp/server.py)
- [AG2 ADR 0015: MCP conversation continuity by handle](https://github.com/ag2ai/ag2/blob/v1.0.3/docs/adr/0015-mcp-conversation-continuity-by-handle.md)
- [MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28)
- [AG2 MCP Servers documentation](https://docs.ag2.ai/docs/user-guide/tools/mcp_servers/)
- [AG2 TealTiger Governance documentation](https://docs.ag2.ai/docs/user-guide/extensions/tealtiger/)
