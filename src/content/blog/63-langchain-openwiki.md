---
title: "LangChain OpenWiki：更新跑完，知識就跟上程式碼了嗎？"
description: "從 Grounded Claims、頁面 checkpoint 與來源漂移看 OpenWiki 的更新邊界，設計可審查的程式庫知識驗收。"
pubDate: 2026-07-09
updatedDate: 2026-11-03
tldr:
  - "Claims 能追蹤來源變動，不能單獨保證主張的語義正確。"
  - "頁面保存、流程收尾與涵蓋最新程式碼是不同的驗收條件。"
  - "先用合成改動檢查漂移、中斷與契約影響，再決定是否導入。"
audience:
  - "維護跨模組程式庫知識與 Coding Agent 工作流程的架構師"
  - "需要設計文件更新、來源版本與接受條件的平台工程師"
category: "AI Engineering"
tags: ["AI Agent","LangChain","RAG","Knowledge Graph","Enterprise AI"]
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 5
kind: "article"
showToc: true
image: "/blog/63-langchain-openwiki/title_image.webp"
---

一個 Coding Agent 根據 Wiki 修改訂單 API，文件說回應欄位叫 `status`，程式碼卻已改成 `state`。團隊明明剛跑完文件更新，為什麼仍可能讀到過時答案？

問題在於「更新完成」可能指不同的事：這一頁已寫入、證據仍可解析、整個工作流程已收尾，或知識真的對應準備修改的程式碼版本。**這幾個狀態不能用同一個綠燈代替。**

[LangChain OpenWiki](https://github.com/langchain-ai/openwiki) 把程式庫脈絡整理成可搜尋的 Markdown Wiki，並用 Grounded Claims 追蹤事實背後的版本化來源。它值得研究的地方，是讓「哪些知識需要重查」成為可保存的狀態；但這不是替每個推論、跨服務契約或部署版本背書。

本文以 2026-11-03 可讀的官方 main [`c5deb62`](https://github.com/langchain-ai/openwiki/tree/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19) 為範圍，依文件與實作討論導入判斷；沒有執行 OpenWiki、模型或下述驗收情境。這是來源導向的架構分析，不是導入心得。

## 先分清「來源改了」與「文件說錯了」

OpenWiki 的 Claim 是一個有證據的事實主張，例如「這個 endpoint 回傳 `status`」。Claim 的 statement、來源與版本保存在 `openwiki/.claims/` 的 JSON sidecar，與閱讀用的 Markdown 分開。[官方 Claims 文件](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/openwiki/concepts/grounded-claims.md) 說明了這個模型；它目前針對 repository code wiki 與儲存庫證據，不涵蓋任意連接器事實。

更新前的檢查會重新解析來源：仍存在但版本不同，標為 `stale`；來源無法解析，標為 `unresolved`。這個區分也能在[preflight 實作](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/src/claims/brains/code/preflight.ts#L40-L111)看到。兩者都需要回到目前程式碼重查，不能直接翻譯成「刪除這個 Claim」。

在前面的 API 情境中，欄位真的從 `status` 換成 `state`，就需要修改主張與頁面。如果只是重排程式碼，相關行範圍內容並未改變，則不一定需要重寫說明。官方的[來源解析器](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/src/claims/evidence/repository/resolver.ts)會利用內容與定位資訊處理行範圍移動；無法可靠解析時，應視為待處理，而不是猜一個相近位置。

但雜湊只能回答「引用的內容是否仍相同」，不能回答「主張是否正確解讀了它」。若先前就把 timeout 寫成重試次數，來源完全沒變，錯誤也可能繼續存在。這是本文的工程判斷：**來源新鮮度與語義正確性要分開驗收。**

## 同一份 Wiki，頁面可以停在不同的來源基準

以下是教學情境，並非實測紀錄：一次更新開始時程式碼位於 commit B；Agent 已完成 API 頁，另一位開發者又提交 commit C，修改了消費端的欄位映射。此時「API 頁保存成功」不代表整份 Wiki 已理解 C。

OpenWiki 以頁面作為可恢復的工作單位，使用 `.run.json` 與 `.page-manifest.json` 保存執行及頁面覆蓋資訊。[官方生成流程](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/openwiki/workflows/repository-generation.md)區分了已完成、待完成與跳過的工作。

更值得注意的是最後收尾。[`finishRepositoryRun` 的實作](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/src/generation/repository-run.ts#L1690-L1759)在整體持久化驗證後仍會檢查來源漂移。它可以回傳 `status: "complete"`，同時帶有 `sourceChanged: true`，並把最後更新 metadata 記為 `interrupted`，讓後續更新再對齊。這是內部完成狀態，不等於本文已驗證 CLI 在所有此類情境下的退出碼。

同一段程式也保留未重新產生頁面的既有來源 checkpoint，而不是把所有頁面一律蓋成最新 HEAD。因此不能只看整份 Wiki 的生成時間；要看準備使用的頁面實際覆蓋哪個來源狀態。這不是產品失敗，而是把部分進度與完整新鮮度分開記錄的設計取捨。[收尾流程文件](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/openwiki/workflows/wiki-finalization.md)有更完整的說明。

## 把它當成可丟棄的衍生知識，別當成第二份真實系統

我的採用判斷是：讓 Wiki 幫 Agent 找入口、縮小閱讀範圍和提出影響假設；真正要修改的契約，仍回到目前程式碼、型別與測試。不要把它變成另一份需要靠人猜哪個版本才對的規格書。 可重新生成的是衍生頁面，不是說可以丟掉人工指令、審查決定或版本證據；這些應另有可恢復的保存方式。

`AGENTS.md` 適合放測試方式、修改範圍與提交規則；Wiki 適合放按需查找的模組脈絡；原始碼與契約測試負責可執行行為。OpenWiki 的搜尋／閱讀工具能提供相關段落，但搜尋命中不是修改權限，來源連結也不是相容性測試。

以合成的訂單 API 為例，團隊可以先建立一份人工核對的期望：哪些 producer、consumer 與測試應受 `status` → `state` 影響。再拿 Wiki 的更新建議與這份期望比較。若跨另一個 repository，還要明確納入它的來源版本；不能把 workspace 搜尋範圍誤當成已完成跨庫契約驗證。

這個方法的成本，是多維護一個可回溯的知識產物與接受流程。若程式庫小、問題固定，而且 README 與測試已能讓人找到答案，先改善那些入口可能更划算。若跨模組探索反覆發生、文件更新有負責人、也願意保存證據與版本，OpenWiki 才值得小範圍試行。節省 token、減少延遲或提升改碼成功率，都需要同任務、同模型的比較；這篇沒有提供這類量測。

## CI 出現文件 PR，並不代表這次更新成功

官方的[GitHub Actions 基本範例](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/examples/openwiki-update.yml)會以完整 Git 歷史 checkout，執行 `openwiki code --update --print`。值得讀的是錯誤路徑：生成步驟使用 `continue-on-error`，即使失敗，也可能建立保留已完成頁面的 PR，最後再把失敗傳回 workflow。**PR 存在，是有變更可審，不是整次知識更新已成功。**

同一範例會移除暫時的 `.run.json`。因此「本機中斷可恢復」與「短命 CI runner 下次一定接著跑」不能混為一談；[官方 CI 排程說明](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/openwiki/operations/ci-scheduling.md)也討論這個邊界。要檢查保存了哪些文件與控制狀態，以及下一次工作的基準；不要只把重試次數調大。

官方也提供[auto-merge 範例](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/examples/openwiki-update-auto-merge.yml)，但它與基本範例不能混讀：基本版的候選路徑包含 workflow；auto-merge 版會先還原並排除 workflow。後者還固定安裝 `openwiki@0.5.0`，而此來源快照的 [package.json](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/package.json) 標為 `0.7.3`。這不是本文驗證過的相容組合。我的建議是先對齊版本、保留必要 checks 與審查，再決定允許變更路徑；不要把「docs-only」名稱當成白名單已符合自己的政策。自動合併是 repository 的發布機制，不是模型自己判定知識已可信。

## 一次低風險試行，先驗收這些失敗

以下是建議的驗收設計，不是本文跑過的測試。使用可公開或合成、無秘密的小型 repository，先固定來源 commit 與人工答案，再逐項改動；每次保存頁面差異、Claims、來源 checkpoint、執行結果及人工接受決定。

| 合成改動 | 應檢查什麼 | 不能據此宣稱什麼 |
|---|---|---|
| 把 API 欄位改名 | 文件是否改正，producer／consumer 契約測試是否各自通過 | Wiki 改了就代表系統相容 |
| 刪除引用的檔案 | 對應證據是否成為 unresolved，主張是否被重查或撤回 | 所有刪檔都必須刪掉整頁 |
| 完成部分頁面後中斷 | 已完成頁面與 Claims 是否保留，重跑後是否真的對齊 | PR 出現就表示整次成功 |
| 更新期間再次改來源 | 是否留下漂移／interrupted 訊號，頁面 checkpoint 是否可追 | finish complete 就表示涵蓋最新 HEAD |

在已核准模型與 repository 存取、並完成安裝的隔離試行環境，可從官方 CLI 路徑開始：

```bash
# 只讀記錄試行起點；不要用這些命令替代內容審查
git rev-parse HEAD
git status --short

# 可能使用已設定的模型並寫入 Wiki；先確認資料與費用邊界
openwiki code --update --print

# 檢查文字、Claims 與管理指令；status 也會列出未追蹤產物
git status --short
git diff --stat
git diff -- openwiki/ AGENTS.md CLAUDE.md
```

不要為排除問題而直接重跑 `--init`：官方 README 說明，重新初始化會替換既有生成 Wiki 與 Claims，與增量更新是不同操作。也不要把 `.openwikiignore` 當成企業資料外送的完整政策；來源選擇、Host 可用工具與模型服務的資料邊界仍要各自確認。這些導入條件應在試行前寫清楚，不是事後再從漂亮文件反推安全性。

> **花花的工程提醒**
>
> 最值得保存的不是「這次有產生文件」，而是「哪些頁面基於哪個來源狀態、哪些主張仍待確認，以及誰接受這次更新」。

OpenWiki、[Enterprise RAG](/blog/65-enterprise-rag-guide/) 與 [LLM Wiki 知識變更驗證](/blog/143-llm-wiki-knowledge-change-validation/)可以在同一套架構裡各司其職：前者幫 Coding Agent 維護程式庫脈絡，檢索層幫忙找證據，知識變更流程管理接受與回歸。選工具之前，先決定自己要接受的是「有用的閱讀入口」，還是「可作為變更依據的版本化知識」；後者需要更明確的驗收契約。
