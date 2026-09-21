---
title: "Gemini Antigravity Agent 09-2026：一次 Agent Runtime 的 Protocol Migration"
description: "拆解 Antigravity Agent 09-2026 的 remote/local 相容性邊界、內建工具契約變更、adapter 設計與 contract tests，並整理 05-2026 在 2026-10-05 退場前的遷移風險。"
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "`antigravity-preview-09-2026` 不是只換一個 model string：remote sandbox 且只讀 `output_text`／`model_output` 的整合，主要是改 agent ID；local execution 或解析 `function_call` 的整合則面對完整的工具契約遷移。"
  - "05-2026 到 09-2026 的內建工具變更包括 PascalCase 參數、行號範圍檔案編輯，以及 `list_files`／`read_file`／`write_file` 等名稱映射；shell execution 與 web search 契約維持不變。"
  - "最穩定的做法是把 vendor protocol 收斂在 adapter，對外維持自己的 canonical operation，再用 fixture、golden trace 與 negative cases 驗證兩個 runtime path。"
  - "Google 宣布 05-2026 將於 2026-10-05 shutdown；preview schema 仍可能變動，所以遷移完成不等於可以停止監控。"
audience:
  - "維護 AI agent runtime、tool broker 或 coding-agent harness 的工程師"
  - "需要在 preview API 退場前評估相容性、測試與營運風險的平台團隊"
category: "AI Engineering"
tags: ["AI Agent", "Gemini", "Platform Engineering", "Evaluation", "MCP"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 37
kind: "article"
showToc: true
wideHeader: true
image: "/blog/gemini-antigravity-agent-09-2026/title_image.webp"
---

Google 在 2026 年 9 月 17 日的 [Gemini API release notes](https://ai.google.dev/gemini-api/docs/changelog) 宣布 `antigravity-preview-09-2026`，取代並淘汰 `antigravity-preview-05-2026`。表面上看，這像是一次 preview model ID 更新；但 release note 同時把整合者分成兩條完全不同的路徑：在 `environment: "remote"` 的 sandbox 中，只讀 `output_text` 或 `model_output` steps 的 client，更新 agent string 後主要不必改其他東西；使用 `local_environment` 或解析 `function_call` steps 的 client，則必須處理內建工具的名稱、參數與檔案編輯語意變更。

這個差異值得被稱為 **protocol migration**。它不是在宣稱 09-2026 的模型品質全面提升，也不是把所有程式碼做一次字串取代就結束。真正的問題是：你的 runtime 依賴的是最終文字，還是依賴 agent loop 中可執行、可重播、可稽核的 tool contract？答案會決定遷移範圍、測試方法與 10 月 5 日之後的故障模式。

> **花花的一句話**
>
> Agent preview 升級的相容性，不由 agent ID 決定，而由你的程式讀到了哪一層 protocol 決定。

## 先把相容性切成兩條路徑

Release note 給出的第一個重要訊號，是不要用「有沒有使用 Antigravity」來估算影響面，而要用 runtime 觀察的資料型別來分流：

| 整合路徑 | 09-2026 的必要變更 | 主要風險 |
| --- | --- | --- |
| Remote sandbox，僅消費 `output_text`／`model_output` | 將 agent 更新為 `antigravity-preview-09-2026` | 低估整合面；日後若開始讀 steps，會突然進入另一個契約 |
| `local_environment`，或解析 `function_call` steps | 更新內建工具名稱、PascalCase 參數與 file-edit 語意 | 舊 dispatcher 可能得到未知工具、錯誤參數或不可重播的編輯結果 |
| Remote sandbox，但保留完整 steps／trace | 至少驗證 step parser 與 built-in function-call fixtures | 以為 remote 等於免遷移，卻在 observability 或 replay pipeline 中解析了舊 schema |
| Custom function calling | 保留 stateful continuation，檢查 call/result 對應與 environment ID | 把 built-in filesystem calls 和自家 function calls 混成同一套處理規則 |

因此，「我只是跑 remote」不是完整的風險判斷。官方 guide 說明 filesystem tools 會因 `environment` 自動啟用；它們在 steps 中仍會以 function calls 表示，但由 environment 自動執行。若 trace collector、policy engine、replay runner 或人工審查介面會讀這些 steps，就已經依賴 tool-level protocol。

[AI Agent 完整指南](/blog/64-ai-agent-guide/)把工具、狀態、控制迴圈與評測視為同一個 production contract；這次更新正好示範為什麼「模型回了什麼」和「runtime 做了什麼」必須分開觀察。

## 09-2026 改的是工具契約，不是品質排行榜

Antigravity guide 把它描述為 Gemini API 上的 managed agent：一次 interaction 會在 Google-hosted Linux sandbox 中進行推理、執行程式、管理檔案與瀏覽網路；文件並指出 09-2026 預設使用 Gemini 3.8 Flash，底層 model 可以透過 `agent_config` 設定。這些是產品定位與執行方式，不足以推出「所有 agent task 都更準」或「遷移後不需要重新評測」的結論。

對工程團隊來說，更可操作的觀察是：同一個高階任務，現在需要被拆成兩種相容性問題。

1. **Semantic output compatibility**：remote client 只依賴 `output_text`／`model_output`，回答呈現與上層業務 schema 是否仍符合預期？
2. **Execution protocol compatibility**：runtime 是否能辨認新的 function-call name、參數 key、檔案編輯範圍與後續 result？

前者可能只需要 smoke test；後者則需要像 API version migration 一樣做 contract tests、fixture replay、錯誤分類與 canary。不要用模型 benchmark 代替工具契約測試，也不要把供應商對 agent 能力的描述當成你自己的成功率證據。

## 逐項核對 05-2026 → 09-2026 mapping

Release notes 列出的內建工具變更如下。這張表應該直接成為 adapter 的 migration checklist，而不是只放在 release note 閱讀筆記裡：

| 能力 | 05-2026 | 09-2026 | 遷移含義 |
| --- | --- | --- | --- |
| 建立檔案 | `write_file(path, content)` | `write_to_file(TargetFile, CodeContent, Overwrite, Description)` | 不只改名稱；payload 變成多個 PascalCase 欄位，並新增 overwrite／description 語意 |
| 編輯檔案 | `write_file(path, content)`，整檔重寫 | `replace_file_content(TargetFile, StartLine, EndLine, TargetContent, ReplacementContent)` | 從 full rewrite 轉為 line-range replacement，必須處理行號基準與內容漂移 |
| 讀取檔案 | `read_file(path, offset, limit)`，byte offsets | `view_file(AbsolutePath, StartLine, EndLine, ContentOffset)` | 讀取定位從 byte offset 轉成行號範圍加 content offset |
| 列出目錄 | `list_files(path)` | `list_dir(DirectoryPath)` | 工具名稱與參數名稱都變更 |
| 檔案／程式碼搜尋 | 無內建工具，依賴 shell | `find_by_name(SearchDirectory, Pattern, MaxDepth)`、`grep_search(SearchPath, Query, IsRegex)` | 新增兩種 built-in search contract；不要把它們當成 shell 輸出的別名 |
| Shell execution | `code_execution(command, timeout_seconds)` | 不變 | 仍應保留既有 command、timeout、exit-status 的測試 |
| Web search | `google_search(queries)` | 不變 | 不變不等於不需監控；仍要驗證 response parser 與 quota／failure handling |

其中最容易被低估的是 file editing。05-2026 的 `write_file` 是整檔重寫；09-2026 的 `replace_file_content` 要求 `TargetFile`、`StartLine`、`EndLine`、`TargetContent` 與 `ReplacementContent`。這不是把 `path` 改名成 `TargetFile` 就好：adapter 必須知道 agent 看到的檔案版本、行號是否以 1 為起點、替換區間是否仍匹配，以及重試時是否會把同一段內容套用兩次。

同樣地，`read_file` 的 byte offsets 和 `view_file` 的 line ranges 不是等價座標系。若你的 trace 只留下「讀了第幾個 byte」而沒有保存當時的檔案 snapshot 或 hash，遷移後的 replay 可能看似成功，實際上讀到的是另一段文字。

## Adapter 的責任邊界：內部 canonical，外部 versioned

不要讓每一個 planner、policy engine、trace viewer 和 test helper 都知道 `write_to_file` 的 PascalCase 欄位。比較穩定的做法，是在 runtime 中建立一個與 vendor 無關的 canonical operation，例如：

```text
read_file   { absolutePath, startLine?, endLine?, contentOffset? }
write_file  { targetFile, content, overwrite, description }
replace     { targetFile, startLine, endLine, targetContent, replacementContent }
list_dir    { directoryPath }
find_name   { searchDirectory, pattern, maxDepth? }
grep        { searchPath, query, isRegex? }
```

這個 canonical layer 不代表把所有版本硬壓成一個「最小公分母」。它應該保留會影響安全與重播的語意：line range、overwrite intent、description、search regex，以及原始 `call_id` 和 interaction/environment ID。對外再由 versioned serializer 產出 05-2026 或 09-2026 的 wire contract。

一個可維護的 adapter 至少應有四個步驟：

1. **Detect**：由明確設定或已驗證的 agent version 決定 serializer；不要從工具名稱猜版本。
2. **Normalize**：把 provider payload 轉成內部 operation，拒絕缺欄位、未知欄位或不合理 line range。
3. **Authorize**：在 tool broker 重新檢查 workspace、租戶、路徑、權限、可接受的副作用與 timeout；模型選了工具不等於獲得執行權。
4. **Trace**：同時保存 normalized operation 與 raw call，讓故障能回答「vendor 回了什麼」和「我們執行了什麼」。

若仍需支援 05-2026，保留雙 serializer 的時間應由 shutdown date 和測試覆蓋率決定，而不是由「兩套名稱看起來很像」決定。adapter 的目標是隔離變動，不是永久替供應商維護舊 preview。

## Contract tests 要測的是邊界，不只是 happy path

一套有用的測試可以分成四層。這些是本文建議的工程做法，不是 Google 宣布的官方測試套件。

### 1. Remote output-only smoke fixtures

固定一個 `antigravity-preview-09-2026` interaction fixture，驗證：

- agent string 已更新，remote environment 仍被正確建立。
- `output_text` 和 `model_output` 的選取規則不依賴某個不保證穩定的 step index。
- 只讀最終輸出的 client 不會意外進入 built-in tool dispatcher。

這層測試的目標不是證明內容品質，而是確認最小 migration path 沒有被共用 parser 破壞。

### 2. Built-in tool contract fixtures

為每個 mapping 建立一個成功 fixture，並保留原始 function-call name 與 arguments。至少覆蓋 `write_to_file`、`replace_file_content`、`view_file`、`list_dir`、`find_by_name`、`grep_search`、未變更的 `code_execution` 與 `google_search`。

同時加入 negative cases：

- 舊的 `write_file` 被送到 09-2026 serializer。
- PascalCase 欄位缺失、拼錯或混入 snake_case。
- `StartLine` 大於 `EndLine`，或替換前的 `TargetContent` 和 snapshot 不相符。
- `AbsolutePath` 不在允許 workspace 內。
- `IsRegex`、`MaxDepth` 或 timeout 的型別不符合 canonical schema。

negative case 的價值在於把「未知工具」和「工具執行失敗」分開。前者通常是 adapter 或版本判斷問題，後者可能是外部環境或權限問題；兩者若都只記成 generic 400，修復速度會很慢。

### 3. Stateful continuation and replay

官方 function-calling guide 使用 `previous_interaction_id` 繼續互動，並以 `environment_id` 把後續 turn 接回原本的 sandbox。測試應把「agent 要求 function call → broker 執行或拒絕 → 回傳 function result → agent 完成」整段固定下來，檢查 `call_id`、function name、result schema 與 environment reference 是否一致。

不要用手工重建的 stateless history 假裝已測過 continuation；官方 guide 明確指出 function calling 只支援 stateful mode。這裡的契約錯誤未必在第一次 request 出現，常見故障會延後到第二個 turn 才發生。

### 4. Operational invariants

最後測試那些不會出現在工具名稱表中的條件：同一個 operation retry 是否冪等、line-range edit 是否在檔案被外部程序修改後安全失敗、trace 是否能還原 tool decision、以及 timeout／取消／budget incomplete 是否會留下可處理的狀態。

Antigravity guide 也提醒，這仍是 preview：schema 可能改變；background execution 需要 `store=True`；remote MCP 使用 Streamable HTTP，不支援 SSE，server name 必須嚴格符合小寫字母、數字、底線或連字號的限制。這些不是本次 mapping 的直接替換項，卻是同一個 runtime contract 的營運面，應在 compatibility matrix 中獨立標記。

## 10 月 5 日前的 migration runbook

Google 已標明 `antigravity-preview-05-2026` 將在 2026 年 10 月 5 日 shutdown。倒數期間最重要的不是一次性改完，而是讓每一步都能回答「目前哪一類 client 還依賴舊契約」：

1. **Inventory**：列出所有 agent ID、environment mode、是否讀 steps、是否攔截 built-in filesystem calls、是否使用 custom functions 或 MCP。
2. **Classify**：將 client 分成 remote output-only、remote trace-aware、local/tool-dispatch 三組，為每組建立不同的 acceptance criteria。
3. **Dual-run**：在可控流量或離線 fixture 上，同時跑 05 與 09 serializer；比較 tool selection、argument normalization、side-effect count、trace completeness 與成本，不把「文字看起來一樣」當成充分證據。
4. **Canary**：先讓 09-2026 處理唯讀、可回放、低副作用工作；觀察 unknown-tool、schema-validation、line-drift、timeout、continuation failure 與人工升級率。
5. **Cutover**：將 09-2026 設為唯一新請求路徑，保留 adapter feature flag 與完整 trace。feature flag 是為了切換自己的處理策略，不是保證 shutdown 後還能呼叫舊 preview。
6. **Post-cutover**：把 05-2026 呼叫與舊 tool names 視為應告警的遺留流量；一旦命中，回到 client inventory 查來源，而不是靜默 fallback 到另一個工具。

這個順序也指出 rollback 的實際限制：在 10 月 5 日前，回退可能是切回舊 endpoint；在 shutdown 後，可靠的 rollback 只能是回到自己的上一版 adapter、停用高副作用路徑或轉人工，不能把已不存在的 preview 當作災備服務。

## 對工程與企業團隊的判斷

這次更新把 agent system 的「可攜性」邊界畫得很清楚：

- 如果你的 client 只需要 remote sandbox 的最終文字，migration surface 小，但仍應固定 agent ID、更新 smoke tests，並追蹤 output schema 的實際使用方式。
- 如果你的 runtime 會解析 `function_call`、攔截 filesystem execution、重播 trace 或做 policy gate，請把它當成 breaking protocol migration，建立 versioned adapter 與 contract-test fixtures。
- 如果你使用 custom functions，built-in tool mapping 不會自動替你驗證 stateful continuation、call/result pairing 或人工拒絕路徑。
- 如果你使用 remote MCP，請把 Streamable HTTP、server-name regex、`allowed_tools` 與 header／credential handling 放進自己的 deployment checklist；「能連上」不等於「可以安全交給 agent」。

最值得保留的抽象不是某一組 Google tool names，而是三個可觀測邊界：模型提出什麼、adapter 正規化什麼、broker 最後允許什麼。這也呼應 [Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/)：狀態、權限、評測與 trace 必須一起接上，否則相容性問題只會在副作用發生後才被看見。

## 結語：把 preview 升級當成 interface lifecycle

Antigravity 09-2026 的重要性，不在於我們能不能替它寫一個更大的「支援新模型」標籤，而在於它提醒所有 agent runtime 團隊：provider 的 agent ID、step schema、tool name、argument casing、file-edit semantics 與 environment state，都是會演進的介面。

因此，遷移的完成定義不應是「production request 成功一次」，而是：每條相容性路徑都有明確 owner；每個內建工具都有成功與拒絕 fixture；每次副作用都能從 raw call 還原到 authorized operation；舊 preview 退場後，系統仍有可驗證的人工、停用與自有 adapter rollback 路徑。

想先補 agent 架構背景，可讀 [AI Agent 完整指南](/blog/64-ai-agent-guide/)；若你的 runtime 還涉及 MCP server，接著看 [MCP 規格與工具邊界](/blog/34-model-context-protocol-mcp/)。最後，所有「品質變好了」的判斷都應回到自己的 task set、tool-contract pass rate、side-effect safety 與 operational metrics，而不是從這次 preview release note 直接推導。

## 來源與延伸閱讀

- [Gemini API release notes：2026-09-17 Antigravity Agent 09-2026](https://ai.google.dev/gemini-api/docs/changelog) — agent ID、remote／local distinction、工具 mapping 與 05-2026 shutdown 日期。
- [Antigravity agent guide](https://ai.google.dev/gemini-api/docs/antigravity-agent) — execution environment、function calling、MCP、model configuration、budget controls 與 preview limitations。
- [Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/) — 將狀態、權限、評測與 trace 接成 production control plane。
- [MCP 規格與工具邊界](/blog/34-model-context-protocol-mcp/) — 了解外部 tool server 如何進入 agent runtime。
