---
title: "AIPOCH Open Science：把科研 Agent 做成可治理工作台"
description: "拆 AIPOCH Open Science v0.19.0：Skills、Notebook 依賴、OAuth 與 artifact provenance。版本號放進正文，搜尋入口是產品名與科研 Agent。"
pubDate: 2026-08-26
updatedDate: 2026-08-28
tldr:
  - "Open Science 的核心不是再加一個聊天模型，而是把科學研究流程變成可執行、可檢查的本機工作台。"
  - "v0.19.0 把 Marketplace Specialists、Notebook stale detection、OAuth 與 Artifact preview 連成一個控制面。"
  - "這是 release-level evidence：能證明工程邊界變清楚，不能直接證明研究成果或 Agent reliability 提升。"
audience:
  - "想把 Agent 接進資料、Notebook 與科學工具的工程師"
  - "需要本機部署、可追蹤產物與權限控制的研究團隊"
  - "設計 AI 平台控制面與治理規則的技術主管"
category: "AI Engineering"
tags: ["AI Agent", "Governance", "Platform Engineering"]
cluster: "ai-platform-governance"
clusterRole: "case"
clusterOrder: 9
kind: "article"
showToc: true
image: "/blog/90-aipoch-open-science-workbench/title_image.webp"
---

AIPOCH 在 2026 年 8 月 24 日發布 [Open Science v0.19.0](https://github.com/aipoch/open-science/releases/tag/v0.19.0)。這是一個以 local-first、model-agnostic 為方向的開源 AI research workbench：Agent 可以讀取檔案、執行 Python 與 R、呼叫科學資料連接器，並把報告、表格與圖形連回可檢查的活動歷史。

這個版本最值得看的地方，不是又多了一個模型或一個聊天入口，而是它把幾個容易被藏在 UI 背後的狀態，提升成可治理的系統邊界：Marketplace Specialists 有 package provenance，Notebook output 有 stale state，OAuth 有完整 lifecycle，Artifact 有穩定識別與預覽，session 啟動則改成 summary-first。**它正在把 scientific agent 從「會回答問題的介面」推向「能執行、能回看、能知道何時不該相信結果的本機工作台」。**

> **花花的一句話**
>
> 一個 scientific agent 是否值得信任，不只看它寫出的結論，而要看每個結論背後的輸入、執行、身份、版本與產物能不能被檢查。

## 先把問題說清楚：Research Agent 不只是聊天 UI

科學研究的 Agent loop，比一般問答多了幾個不能省略的階段：理解問題、選擇資料與工具、提出計畫、取得執行許可、執行程式或 connector、產生 artifact，最後讓研究者檢視、重跑或否決結果。只要其中一段沒有留下狀態，最後的報告就可能看起來完整，卻無法回答幾個基本問題：

- 這張圖是由哪一個 notebook state 產生的？中間的變數是否已經被改過？
- Agent 當時載入了哪個 Specialist 或 skill？它是誰發布的？
- 這次外部請求使用哪個身份、哪種 protocol，token 何時取得與刷新？
- 報告中的檔案、Markdown 圖片和 notebook output，能否連回同一次執行的 artifact version？
- session 被壓縮或重新開啟後，研究者看到的是原始 evidence，還是模型重新拼出的敘述？

[Open Science 的 repository](https://github.com/aipoch/open-science) 將產品定位為可重現、可檢查的科學發現工作台；v0.19.0 則把這個定位落到一組具體的 runtime 機制。這些機制不等於已經證明科學結論正確，也不是 benchmark 結果。它們先處理的是「系統是否知道自己做了什麼，以及能否把這些狀態交給人檢查」。

## v0.19.0 的四個控制面

### 1. Skills 從內容檔變成可治理套件

這個版本把 Marketplace-installed Specialists 視為有來源與生命週期的 governed package。官方 release notes 描述了幾個重要邊界：套件會帶有 `marketplace` origin；publisher-owned content 變成 read-only；手動 ZIP 覆寫會被阻擋；更新必須以較高的 SemVer 對應 exact content baseline；Installed 頁面則把 All、Custom、Marketplace、Built-in 分組，並將更新、建立 editable copy、enable/disable 與 uninstall 放進同一個 managed lifecycle。

這個設計解決的是一個常被低估的供應鏈問題：**如果一個 skill 能改變 Agent 選工具、讀資料或執行 side effect 的方式，它就不是普通的 Markdown 附件。** 它至少需要可辨識的 origin、版本比較規則、內容完整性與可逆的安裝操作。

但 read-only publisher content 只代表本機不能直接竄改已安裝的內容，不代表 publisher 本身可信，也不代表 skill 沒有 prompt injection 或危險工具權限。實際部署仍應留下 package digest、publisher identity、審查者、依賴、允許的 filesystem/network scope，以及每次 session 實際載入的版本。

這和 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 裡談的 execution envelope 是同一個方向：Agent 的能力不應只寫在 system prompt，而應被放進可觀察、可回滾的 runtime contract。

### 2. Notebook 不再假裝所有 output 都是最新的

Notebook 的危險不只在程式碼會失敗，也在程式碼成功執行後，舊 output 仍然看起來像新結果。v0.19.0 對已完成的 Python 與 R runs 做 cross-run dependency tracking，並在 process 內使用 tree-sitter WASM 分析程式。release notes 特別列出 aliases、root-object mutations、classes、S4/R6 objects、copy/reference semantics，以及常見 scientific-library effects；後續 output 會被標記為 `stale`、`clear` 或 `unknown`，而不是靜默地沿用過期狀態。

可以把它想成一個有限的依賴圖：

1. 某次 run 讀取或建立變數，並產生一個 output。
2. 後續 run 可能透過 alias、物件 mutation、class method 或 library operation 改變同一個根物件。
3. 系統比較 output 所依賴的變數狀態與最新執行狀態。
4. 若能判定依賴仍然一致，標記為 `clear`；若依賴已改變，標記為 `stale`；若靜態分析無法安全判斷，保留 `unknown`。

工程上最重要的不是某個 parser 能涵蓋多少語法，而是它拒絕把「無法判斷」偽裝成「沒有問題」。`stale` 表示依賴狀態變了，不直接表示研究結論錯誤；`clear` 也只表示目前追蹤到的依賴沒有被判定為改變，不能取代 domain review、統計檢查或 deterministic rerun。對 [Enterprise RAG 的評估與失敗診斷](/blog/65-enterprise-rag-guide/) 來說，這是一個相似的原則：系統要把 evidence state 暴露出來，讓使用者知道何時需要重新取得或重新驗證資料。

### 3. OAuth 不只是「登入成功」

v0.19.0 新增 xAI（Grok）OAuth subscription provider，讓同一個 subscription account 可以透過 xAI Responses API，服務 Claude Code 的 Anthropic Messages、OpenCode 的 Chat Completions，以及 Codex 的 Responses 三種 agent protocol。release notes 同時提到 Settings 與 onboarding 的 device-code sign-in、由 app main process 負責 token refresh、一次 401 retry，以及本機的 `o200k_base` count-token approximation。

這裡其實有兩層不同的工程問題：

- **協定相容性**：同一個 provider 如何把不同 protocol 的 message、tool call、token counting 與 model capability 映射到共同的 Responses API。
- **身份與授權生命週期**：如何開始授權、取消、失敗恢復、重新嘗試、finish later、處理 runtime invalidation，以及如何以預先註冊的 redirect URI 限制 callback 邊界。

把 token refresh 放在 main process、對 401 做單次 retry，表示產品有明確的 runtime ownership；但它不會自動解決 secret storage、log redaction、connector scope 或多使用者主機的隔離。release notes 也把 agent identity 與 capability scope isolation 列為修正項目，這提醒我們：**「能呼叫同一個模型」和「能代表同一個身份做所有事情」必須分開。**

如果團隊要採用類似設計，至少應為每次 connector invocation 記錄 actor、provider、protocol、scope、token source、redirect client 與 refresh outcome，而不是只在 UI 顯示一個「已連線」。

### 4. Artifact、session 與 context 都需要可追蹤的邊界

v0.19.0 讓 message body 裡的 managed file links 與 Markdown artifact images，可以依 stable artifact/version ID、managed path 或 unique filename 找到產物，並在既有 preview workbench 中開啟與縮放；notebook figure 也能在 tool group 內預覽，終止的 notebook 則改為 read-only preview。這些改動看似是 UX，但它們會直接影響 evidence 是否能被回看：研究者看到的是哪個 artifact、哪一個版本、從哪一次執行產生。

Session 也採用 summary-first startup：session query metadata 與 per-turn usage 會複製進 SQLite materialized view，啟動時先讀摘要與索引，只有開啟或 export 某個 session 時才載入完整 session file。這解決的是啟動時逐一解析大量 JSON 的效能與可用性問題，但 summary 是 materialized view，不應被誤當成完整 transcript。Context compaction 則以清楚的 transcript boundary 呈現，讓使用者知道 continuity 中間發生過壓縮，而不是看到一列難以解釋的 tool row。

這些機制合在一起，形成一個實用的 artifact contract：**結果要有穩定身份，session 要知道自己載入的是摘要還是完整歷史，context 被壓縮時要留下可見邊界，結束後的研究狀態要避免再被誤寫。** 它仍然不能保證 provenance 的語義完整；例如 artifact 可能被正確連回 run，卻沒有記錄資料集版本、環境 lock、隨機種子或外部 API response。

## 一個完整的研究回合：從能力到可回放產物

把 release notes 的功能放進同一個研究回合，會更容易看出它們如何互相配合。以下是根據 v0.19.0 已公布能力整理出的工程流程，不是 AIPOCH 宣稱的單一內建 pipeline：

1. **建立身份與能力邊界。** 使用者選定 agent framework 與 provider，完成 OAuth device authorization；系統同時記錄 actor、protocol、skill 的 origin/version，以及這個 session 被授予的 tool scope。token 本身不應進入研究紀錄。
2. **先產生計畫，再取得執行許可。** Agent 把研究問題拆成資料讀取、程式執行與 artifact 產生步驟；在需要 review 的設定下，研究者先批准計畫，才讓有 side effect 的動作開始。
3. **執行 notebook 與 connectors。** Python 或 R run 完成後，依 tree-sitter WASM 的分析結果更新變數與依賴狀態。若後續程式改變了前一個 output 的依賴，系統將它標成 `stale`；若無法安全判定，則保留 `unknown`。
4. **完成並註冊 artifact。** 圖片、表格、報告與 managed file 都要掛到 run 和 stable artifact/version ID；訊息內的連結再透過這個識別找到 preview，而不是只依賴檔名或模型描述。
5. **在交付前檢查 freshness 與 provenance。** `clear` 只代表追蹤到的依賴沒有被判定為改變；`stale` 與 `unknown` 應觸發 rerun、人工審查或明確的限制說明，不能直接進入正式報告。
6. **結束、壓縮與重開都保留邊界。** 終止的 notebook 以 read-only preview 保留；session 啟動先讀 SQLite summary；context compaction 以 transcript boundary 告知使用者。重新開啟時，系統應能分辨「摘要可供導航」和「完整 evidence 已被載入」是兩件事。

這個流程的重點，是把「模型做了什麼」拆成幾種可以分別測試的狀態：身份是否正確、能力是否受控、程式結果是否新鮮、產物是否可定位、交付是否經過足夠審查。當其中一個狀態是 `unknown`，安全的行為不是補一段更有信心的文字，而是把不確定性傳遞到下一個 gate。

## Provenance contract：至少要能回答這十個問題

v0.19.0 的 release notes 描述了 artifact lineage、connector provenance、session metadata 與 notebook dependency tracking 等能力，但沒有宣稱以下欄位就是公開且固定的 AIPOCH schema。這是一份可用來設計團隊研究紀錄的建議 contract：

| 欄位 | 建議記錄 | 用來檢查什麼 |
| --- | --- | --- |
| `run_id` | run、session、parent run 與 actor | 這次動作屬於哪個研究回合，誰觸發了它 |
| `input_ref` | 檔案／資料集 URI、版本與必要的 hash | 輸入是否能被重新取得，內容是否已變更 |
| `code_ref` | notebook、cell、repository revision 與 environment lock | 哪份程式與執行環境產生結果 |
| `model_ref` | model、provider、framework、protocol 與設定 | 哪個推論路徑影響了結果 |
| `skill_ref` | skill origin、publisher、SemVer、digest 與依賴 | 能力是否來自已審查且可重建的套件 |
| `permission_snapshot` | connector、filesystem、network 與 approval scope | 執行時實際被允許做什麼 |
| `dependency_snapshot` | output 依賴的變數、root object 與狀態 | 為何 output 是 `clear`、`stale` 或 `unknown` |
| `artifact_ref` | stable artifact ID、version、類型與 parent artifact | 這個檔案或圖形能否連回正確的 run |
| `freshness` | 狀態、判定時間、判定器版本與 rerun 結果 | 交付時是否仍可把結果視為當前狀態 |
| `review_record` | reviewer、決策、理由、時間與 export/replay 事件 | 誰在什麼證據上批准、否決或重新執行 |

不要把 raw OAuth token、secret 或完整敏感輸入直接塞進這份紀錄；`token_source`、client identity、refresh outcome 與 secret reference 通常比 token 本身更適合進入 audit trail。證據欄位也應採 append-only 或 immutable version，使用者可編輯的標題、顏色與筆記則放在另外的 presentation layer，避免 UI 修改覆蓋研究事實。

這份 contract 的價值不是欄位越多越好，而是每個欄位都對應一個可執行的決策：缺少 dataset version 就不能宣稱可重現；`unknown` 就不能自動匯出；skill digest 改變就要跑 regression；artifact 找不到 parent run 就要標記 provenance 不完整。這也是把 release-level feature 轉成團隊 operating rule 的關鍵一步。

## 用一個工程模型讀這個 release

可以把 v0.19.0 的功能整理成研究工作流中的幾個決策點：

| 研究步驟 | 系統要回答的問題 | v0.19.0 提供的對應 | 團隊仍需驗證 |
| --- | --- | --- | --- |
| 選擇模型與身份 | 這次請求代表誰？走哪個 protocol？ | xAI OAuth、device auth、token refresh、三種 protocol adapter | secret storage、scope、費用與多使用者隔離 |
| 載入能力 | Agent 用的是哪份操作知識？ | Marketplace origin、read-only publisher content、SemVer baseline | digest pinning、review、dependency 與 injection 測試 |
| 執行 Notebook | output 是否仍對應當前變數？ | Python/R cross-run tracking、`clear`/`stale`/`unknown` | parser 覆蓋率、動態程式碼、科學語義與 rerun policy |
| 產生 evidence | 圖片與檔案從哪次執行來？ | stable artifact/version resolution、preview、read-only terminated notebook | dataset/environment/seed 完整 provenance |
| 重開或壓縮 session | 使用者看到的是什麼狀態？ | SQLite summary-first、compaction transcript boundary | summary loss、replay、export 與 disaster recovery |

這個表也說明了為什麼不能只用「功能數量」評估 release。它的價值在於把失效模式放到產品表面：過期 output 不再默認新鮮；未經授權或 callback 不完整的 connector 不再只是背景錯誤；可更新的 skill 不再是任意覆寫的資料夾；artifact 也不再只能靠一段模型文字描述。

## 它解決了什麼，還沒有解決什麼

### 已經變清楚的邊界

第一，能力供應鏈有 origin、version 與 lifecycle。這讓團隊有機會對 skill 做 review、回滾與更新策略，而不是將所有操作指示視為同一種可信文字。

第二，Notebook 的 freshness 變成一級狀態。即使分析不是完整的語言語義證明，至少 `unknown` 和 `stale` 能阻止 UI 默默把舊結果當成當前結果。

第三，身份與產物的可見性變好。OAuth connector、agent capability、artifact version、session summary 和 compaction boundary 都有更明確的 ownership 與查詢入口。

### 仍不能直接宣稱的事

- `clear` 不等於科學結論正確；它只反映被系統追蹤的依賴沒有被判定為改變。
- publisher content read-only 不等於 publisher 可信，也不等於 skill 具備最小權限。
- OAuth lifecycle 完整不等於 token 一定安全；本機儲存、撤銷、log、redirect 與 connector scope 仍要單獨測試。
- artifact lineage 不等於 citation correctness；資料來源、單位、統計方法與外部 API 回應仍需要 domain-specific validation。
- release notes 能證明功能與 maturity 狀態，不能單獨證明 Agent reliability、研究產出品質或團隊 ROI。

官方 release 仍列出幾個重要限制：R 目前是 managed-only，remote compute 仍以 SSH 為主，沒有 Slurm 或 cloud GPU submission；provider choice 依 active framework 的 endpoint compatibility 而定；review 是 opt-in、record-scoped，不能取代對 citations、units、statistics 或 methods 的領域驗證；sandboxing、credential vault、multi-user collaboration 等也仍在 roadmap 或未完成狀態。這些限制反而讓 v0.19.0 的定位更容易理解：它先把 local-first workbench 的狀態邊界做好，並沒有把科學研究的責任外包給 Agent。

## 如果要導入，先建立五條團隊規則

如果你要把類似模式帶進自己的 research agent 或 AI platform，我會先建立以下規則，而不是先追求更多 tools：

1. **任何 artifact 都要有 identity。** 至少記錄產生它的 run、input、code revision、model、prompt/config、environment、dataset version 與時間；缺少的欄位要明確標成 unknown。
2. **任何可改變行為的 skill 都當作 package。** 固定來源與 digest，記錄 publisher 和依賴，更新走 review 與 regression；若只允許 editable copy，也要保留與原 package 的 lineage。
3. **`stale` 與 `unknown` 都要進入 gate。** 顯示警告只是第一步；在匯出報告、送出決策或寫入共享資料集之前，定義何時必須 rerun、何時需要人工批准。
4. **把身份、能力與模型分開。** 一個 subscription 可以服務多種 protocol，不代表每種 agent、connector 或 filesystem 都有相同 scope；execution identity 應該能被審計與撤銷。
5. **用失效模式評估系統。** 除了 task success，也測 false freshness、stale detection 的誤判、artifact provenance completeness、重跑成本、token 與 connector 費用、context compaction 後的 replay，以及 provider outage 時的 recovery。

> **花花的工程提醒**
>
> 可見的 trace 只能證明系統留下了痕跡，不能單獨證明研究結果正確；每個 `clear` 都還需要適合問題的重跑、資料檢查與領域判讀。

## Bloss0m 的判斷：真正的變化是從 chat history 走向 project state

Open Science v0.19.0 值得寫，不是因為它把所有 scientific agent 問題都解完，而是因為它示範了一條很務實的產品路線：把研究 Agent 的可靠性拆成一組可以被 UI、runtime 與資料層共同承擔的狀態契約。

Skills 需要來源與版本；Notebook output 需要 freshness；OAuth 需要身份與生命週期；Artifact 需要 stable ID 與 provenance；session 需要知道摘要和完整歷史的差別。這些東西放在一起，才形成一個可操作的 governance surface。

對想把 Agent 接進真實研究資料的團隊，最值得借鑑的不是某個特定模型或桌面介面，而是這個判斷：**當 workflow 會產生程式、資料變更與可被引用的結果，系統的核心資料結構就不該只有 chat history，還必須有能被檢查、重跑與撤銷的 project state。**

## 相關閱讀與原始來源

- [AI Agent 完整指南：架構、工具、評測與企業落地](/blog/64-ai-agent-guide/)
- [Enterprise RAG 完整指南：檢索架構、評估與企業落地](/blog/65-enterprise-rag-guide/)
- [Claude Managed Agents 走向受治理的 Runtime：預算、委派、地域與 Inference Hooks](/blog/88-claude-managed-agents-control-plane/)
- [AIPOCH Open Science v0.19.0 release notes](https://github.com/aipoch/open-science/releases/tag/v0.19.0)
- [AIPOCH Open Science repository](https://github.com/aipoch/open-science)
