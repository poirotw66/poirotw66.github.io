---
title: "Pydantic AI v2.45：把耐久 Agent 的可靠性寫進 Session 與 Trace 契約"
description: "拆解 Pydantic AI v2.45.0 如何對齊 durable run 的 DynamicToolset、MCP session、tool history 與 usage spans，並說明 TypeSafeModel 與 Bedrock effort 修正的採用邊界。"
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "v2.45.0 的主線不是多幾個 API，而是把 durable run 的生命週期當成可重播、可觀測的工程邊界。"
  - "`DynamicToolset` 與 MCP session 在適用的 durable engine 中從每個 unit 對齊到每個 run，讓 cache、連線與工具歷史不再被 step 邊界切斷。"
  - "`MCPSamplingModel` 保留原生 tool history，agent-run span 改記錄該 run 自己的 usage；兩者一起改善續跑與成本歸因，但不等於完成完整的 reliability proof。"
  - "TypeSafeModel 與 Bedrock `xhigh` 是相鄰的模型介面修正；採用前仍要檢查模型能力、MCP 版本、durability engine 與重試語意。"
audience:
  - "設計 durable Agent、MCP tool runtime 或多代理可觀測性的 AI／平台工程師"
  - "需要把 Pydantic AI 從可運作的 prototype 推進到可重播、可稽核營運環境的團隊"
category: "AI Engineering"
tags: ["AI Agent", "MCP", "Platform Engineering", "Evaluation", "Enterprise AI"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 37
kind: "article"
showToc: true
wideHeader: true
image: "/blog/pydantic-ai-v245-durable-mcp-sessions/title_image.webp"
---

Pydantic AI v2.45.0 在 2026 年 9 月 17 日發布。release note 表面上列了幾個分散的項目：新增 `TypeSafeModel`、修正 Amazon Bedrock 的 `xhigh` effort、調整 `DynamicToolset` 與 MCP session、保留 MCP sampling 的工具歷史，以及修正 agent-run span 的 usage。真正值得放在一起看的問題是：**當 Agent 被 durable execution 拆成多個可重試的 unit，什麼才算同一個 run？**

這個問題比「一次呼叫是否成功」更接近 production reliability。若每個 unit 都重新解析工具、建立 MCP session、遺失前一輪 tool result，或把子 Agent 的 token 算到父 span，系統可能仍然能跑完，卻無法有效重播、解釋成本，也無法判斷一次恢復究竟延續了哪個狀態。

本文把 v2.45.0 的內容分成三層：release 與 PR 明確承諾的行為、由這些行為推導出的工程意義，以及仍需在自己的 engine／provider 組合中驗證的限制。它不是 Pydantic AI 的完整教學，也不把 maintainers 的測試結果改寫成跨環境 SLA。

> **花花的一句話**
>
> Durable Agent 的 session、tool history 與 usage trace 必須共享同一個 run 邊界，重試才可能既延續狀態，又留下可解釋的證據。

## 先看這次 release 真正改了什麼

官方 [v2.45.0 release note](https://github.com/pydantic/pydantic-ai/releases/tag/v2.45.0) 列出的變更可以分成「新介面」與「耐久執行修正」兩組。這個區分很重要：`TypeSafeModel` 擴展的是模型選擇面；後面幾項則在修正 Agent runtime 如何跨 unit 保存狀態與觀測資料。

### 新介面：TypeSafeModel 是 typed decision model，不是聊天 LLM

`TypeSafeModel` 把 TypeSafe 的 Jev 接進 Pydantic AI。官方 [PR #8450](https://github.com/pydantic/pydantic-ai/pull/8450) 說得很清楚：Jev 接收文字與 typed questions，回答每個欄位的機率；它不負責生成長文字、讀檔或填任意工具參數。`output_type` 的欄位因此更像一組可校準的判斷問題，而不是讓模型自由生成的 schema。

這對 Agent runtime 有兩個實際用途：把低延遲的 triage、route 或 rubric 判斷放在決策層；需要開放式回答或有參數的工具呼叫時，再用一般語言模型或 `FallbackModel` 接手。它不能因為回傳型別正確，就自動取得工具權限或取代 policy engine。Jev 的 confidence 也仍是模型訊號，不是 authorization 證明。

### 耐久執行：從 unit 邊界修正為 run 邊界

release note 的四項修正共同指向同一個錯位：durable engine 以 unit 記錄、重試與重播，但某些 runtime 資源的生命週期其實應該跟著整個 run。

| 變更 | v2.45.0 的行為 | 工程意義 |
| --- | --- | --- |
| `DynamicToolset` | `per_run_step=False` 時，每個 durable run 解析一次；第一次需要它的 unit 才 enter，run 結束再 close | factory、toolset cache 與連線不會因每個 step 被反覆建立 |
| MCP session | DBOS／Prefect 的適用路徑以每個 durable run 持有一個 session | `initialize`、`tools/list` 與 server-side cache 不再被每個 unit 冷啟動 |
| MCP tool history | `MCPSamplingModel` 使用原生 `tool_use`／`tool_result` 保留歷史、ID、參數、結果與 retry feedback | 續跑或 server/client round trip 可以看見前一輪工具交換 |
| agent-run usage span | 每個 run span 歸因到自己發出的 requests，而不是錯把共享或巢狀 run 的 usage 算進來 | parent／delegate 的成本與 token 觀測可以相加而不重複計算 |

這裡的「每個 run 一次」不是無條件的全域保證。`DynamicToolset` 的 `per_run_step=True` 仍代表每個 unit 重新解析；若 run context 需要跨程序序列化，像 Temporal 的 worker／activity 邊界也可能看不到已解析的 toolset，因此回到每 unit 的行為。MCP session 的 engine lifecycle 也不同：PR #8463 明確保留 Temporal 每 activity 的設計，因為 activity 可能在另一個 worker 執行。

> **花花的工程提醒**
>
> 「一個 durable run、一個 MCP session」是特定 lifecycle 與 context 能力下的行為，不是可以跳過 engine 文件、跨程序測試與 retry review 的部署承諾。

## 為什麼 session lifetime 會改變 reliability

### 1. Toolset resolution 先決定你重播的是哪一套工具

在舊的錯位下，`DynamicToolset` factory 可能在每個 durable unit 重新執行。若 factory 回傳 MCP toolset，連線與 `cache_tools` 也會跟著重建；同一個 run 的第二個 model request 看見的工具環境，可能只是第一個 unit 的複製品，而不是延續中的 session。

[PR #8455](https://github.com/pydantic/pydantic-ai/pull/8455) 的核心設計是把「解析物件」與「進入會做 I/O 的 session」分開：factory 在 container code 中解析一次；第一個真正需要工具的 durable unit 才 enter；之後由 run 持有到 close。這保留了 durable engine 的 deterministic unit sequence，也把連線失敗放回可重試的 unit。

這個改動帶來一個必須寫進 migration review 的 factory 契約：在 container code 執行的 factory 必須能根據 run dependencies deterministic 地建立 toolset，不能偷偷連線、讀取只存在於 unit 的暫態，或依賴不可重播的外部副作用。`per_run_step=True` 則是另一個明確選擇：當平行 tool-call units 不應共享同一個可變 toolset，重新解析仍然合理。

### 2. Session lifetime 會改變 MCP 的網路與快取成本

MCP client 在呼叫工具前會取得工具定義；server 端也可能維護初始化狀態與 `cache_tools`。PR #8455 以 in-process server 測量三個 model requests、兩個 tool calls：dynamic toolset 在修正前是 5 次 `initialize` 與 5 次 `tools/list`，修正後是 1 次與 1 次。PR #8463 也補上 static `MCPToolset` 的 DBOS／Prefect 路徑，從每 durable unit 變成每 run；`tools/list` 仍會在 discovery unit 被記錄，並沒有被不透明的 process-local cache 取代。

這不是單純的效能微調。session 反覆重建會增加連線、認證、schema discovery 與 server warm-up 的失敗面；但 session 活得更久也意味著 credentials、tenant scope、server-side state 與 concurrency 必須在 run 邊界內保持正確。若工具權限可能在 run 中途撤銷，團隊就不能只因為少了 round trip 而無限延長 session。

### 3. Tool history 決定「續跑」是否真的續在同一個上下文

`MCPSamplingModel` 的修正不是把所有歷史轉成一段純文字，而是保留 MCP 原生的 `tool_use` 與 `tool_result` blocks。官方 [PR #8466](https://github.com/pydantic/pydantic-ai/pull/8466) 指出，現在會保留原始 tool ID、arguments、results 與 retry feedback；平行結果也維持在獨立的 user message 中。因此，當 durable run 在工具呼叫後重啟或進行 server/client round trip，後續模型可以辨認「這個工具已呼叫過、結果是什麼、是否要求 retry」。

但這個能力有清楚的格式邊界：需要 MCP 2025-11-25 sampling format；新的 tool execution 與 multimodal tool results 仍不支援。Migration 不能只更新 Python package，還要把 client、server、sampling adapter 與已保存的 message history 一起做版本矩陣測試。

## Usage span 修正：可觀測性也必須尊重 run 邊界

工具 session 解決的是「執行時狀態被切斷」；usage attribution 解決的是「事後觀測把誰的成本算錯」。[PR #8456](https://github.com/pydantic/pydantic-ai/pull/8456) 修正兩個常見情境：下一次 run 帶著上一輪的 `RunUsage` object，或父 Agent 把同一個 usage object 傳給平行 delegate。舊邏輯會讓後續 run 看見 conversation total，或讓 sibling delegate 把彼此 token 算進自己的 span。

v2.45.0 改成在 agent-run span 開啟期間，把 usage 歸因給真正發出 request 的 run；巢狀與平行 task 透過 context attribution 分開。`result.usage`、`UsageLimits` 與每 request 的 chat span 沒有改變，durable activity 端仍以 `usage_delta` 回傳到 run span。換句話說，這是 observability contract 的修正，不是重新定義 token 計費。

營運上要注意 aggregation 規則：若後端會同時加總 parent 與 child span，應加總最外層的 agent-run spans，不能把每個巢狀 span 再全部相加。否則同一批 tokens 會被計兩次。這個細節是為什麼「每個 run 記自己的 usage」要和 trace topology 一起發布，而不是只換一個欄位名稱。

> **花花的判斷**
>
> Durable reliability 不只是重試成功率；如果 session、history 與 usage 都沒有同一個 run identity，系統即使恢復了，也很難證明它恢復的是原本那次工作。

## Bedrock 與 TypeSafeModel：相鄰修正，不要混成同一個承諾

v2.45.0 還包含兩個容易被 release summary 混在一起的 provider 變更。

首先，Bedrock Converse 的 `thinking='xhigh'` 不再硬編碼成 `effort='max'`。依 [PR #8392](https://github.com/pydantic/pydantic-ai/pull/8392)，`BedrockConverseModel` 會讀取 merged model profile：模型支援 `xhigh` 時原值傳遞；不支援時仍映射到 Bedrock 接受的 `max`。PR 以 Opus 4.7、Opus 4.8 與 Sonnet 5 為可接受 `xhigh` 的例子，也保留較舊模型的 fallback。

這改善的是 request semantics 與 provider compatibility，不是「xhigh 一定比 max 品質更好」的 benchmark。PR 的 live check 證明 API 接受該值，但沒有測量 Bedrock 對 `xhigh` 與 `max` 的實際推理差異。正式環境仍要記錄 resolved model profile、thinking level、provider error 與 fallback path。

其次，`TypeSafeModel` 讓 Agent 可以把 Jev 當成 typed decision provider，但它和 durable session 的生命週期沒有自動關聯。若把 Jev 放進 durable workflow，仍需自己定義：decision 是否可重播、confidence threshold 是否版本化、fallback 到 LLM 是否會產生不同的 tool history，以及 Jev 的 provider details 要不要進 trace。新 provider 不會自動替你完成 runtime contract。

## Migration checklist：升版前先驗證這五條

### 1. 盤點 toolset factory 的 I/O 與 scope

找出所有 `DynamicToolset`，標記 `per_run_step`，並確認 `per_run_step=False` 的 factory 只做 deterministic object construction。把 user、tenant、credential scope 明確放進 run dependencies；不要依賴「剛好在某個 unit 裡存在」的 state。

### 2. 針對 engine 建立 wire-count 與 lifecycle 測試

至少量測一個 run 的 `initialize`、`tools/list`、`tools/call`、enter、close 與 retry 次數。DBOS／Prefect 應確認適用路徑是否達到每 run 一個 session；Temporal 則要確認 per-activity session 是跨 worker 的刻意設計，而不是誤把它當成 regression。

### 3. 做 message-history 版本矩陣

用真實的 tool call、tool result、平行結果與 retry feedback，測試 `MCPSamplingModel` 在 MCP 2025-11-25 與舊 SDK 組合下的行為。把 unsupported multimodal tool result 當成明確 failure mode，不要在 adapter 裡悄悄降級成看似完整的文字。

### 4. 重畫 usage aggregation 與 budget dashboard

檢查 log backend 是以 chat span、agent-run span，還是兩者一起做成本彙總。加入三層巢狀、平行 delegate、跨 conversation 重用 usage 與 durable `usage_delta` 的 fixture；驗證 `result.usage`、UsageLimits、span totals 彼此一致。

### 5. 將 provider profile 與 fallback 變成 trace 欄位

Bedrock 的 `xhigh`、Jev 的 confidence、fallback model、MCP protocol version 與 engine name 都會影響一次 run 的語意。沒有這些欄位，之後只看到「完成／失敗」仍然不足以解釋成本、延遲與品質變化。

## Failure modes：哪些問題不是 v2.45.0 自動解決的

| Failure mode | v2.45.0 幫你處理的部分 | 仍需由應用／平台負責 |
| --- | --- | --- |
| unit 重試造成 MCP session 冷啟動 | 適用 engine 把 toolset／session 留在 run | credential rotation、租戶隔離、server timeout、併發上限 |
| factory 在 replay 時有外部副作用 | 文件與 PR 說明 deterministic factory 契約 | code review、測試 replay、禁止 container-side I/O |
| tool history 遺失或 retry 被誤解 | 保留原生 history blocks 與 IDs | protocol version、schema migration、unsupported content policy |
| parent／delegate 成本重複計算 | run span 記自己的 usage | 正確選擇 outermost spans、後端 aggregation 設定 |
| Bedrock effort 被 provider 拒絕 | 依 model profile 傳 `xhigh` 或 fallback `max` | model availability、品質比較、成本與延遲 SLO |
| typed decision 格式正確但判斷錯 | `TypeSafeModel` 提供 typed decision 介面 | golden set、校準、人工升級、權限與 side-effect gate |

如果團隊要的是一份可重播、可追查的 Agent runtime，建議先從 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 的狀態、工具與觀測分層開始，再用 [Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/) 把 trace、policy 與評測寫成上線條件。MCP 權限與 connection attribution 則可對照 [Forge 的多使用者 MCP auth runtime](/blog/99-forge-mcp-auth-runtime/)；若要理解 agent-run 決策如何跨閘門，接著看 [Jev 的 confidence-gated runtime](/blog/108-jev-confidence-gated-agent-runtime/)。

## 結語：把 v2.45 當成 lifecycle contract 的提醒

Pydantic AI v2.45.0 的價值，不在於每一個 changelog item 都能單獨宣稱「更可靠」，而在於它把幾個常被分開處理的細節重新對齊：toolset resolution 決定工具環境何時固定，MCP session 決定外部連線活多久，tool history 決定重啟後能否理解上一個交換，usage span 決定營運者能否把成本歸給正確的 run。

這也說明了 release 的限制。Temporal 的跨 worker 邊界、MCP sampling 的 protocol 版本、Bedrock 的 profile capability、Jev 的 typed-decision scope，都仍然要求應用團隊做自己的 compatibility matrix。升版後最有價值的測試不是只跑一次 happy path，而是故意中斷一個 run、重試一個 tool、平行啟動兩個 delegate，然後回答三個問題：**它連到哪個 session？它看到了哪段 history？它的 usage 算在誰身上？**

## 來源與延伸閱讀

- [Pydantic AI v2.45.0 release notes](https://github.com/pydantic/pydantic-ai/releases/tag/v2.45.0) — 官方版本變更與完整 changelog。
- [Pydantic AI repository](https://github.com/pydantic/pydantic-ai) — 官方 SDK repository 與 durable execution、MCP、provider 實作入口。
- [PR #8450：Add `TypeSafeModel` for TypeSafe's Jev](https://github.com/pydantic/pydantic-ai/pull/8450) — TypeSafeModel 的能力與限制。
- [PR #8455：Resolve a `DynamicToolset` once per durable run](https://github.com/pydantic/pydantic-ai/pull/8455) — dynamic toolset 的 resolution、enter、close 與 factory 契約。
- [PR #8463：Hold one MCP server session per durable run](https://github.com/pydantic/pydantic-ai/pull/8463) — static MCPToolset 與不同 durable engine 的 lifecycle。
- [PR #8466：Preserve tool history in `MCPSamplingModel`](https://github.com/pydantic/pydantic-ai/pull/8466) — MCP sampling history 的格式與 unsupported scope。
- [PR #8456：Report each agent run's own usage on its span](https://github.com/pydantic/pydantic-ai/pull/8456) — usage attribution 與 span aggregation 契約。
- [PR #8392：Pass `xhigh` effort through on Bedrock](https://github.com/pydantic/pydantic-ai/pull/8392) — model profile 對 Bedrock effort 的控制。
