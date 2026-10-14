---
title: "LLM Wiki 知識更新：把 Agent 提案變成可驗證的 Knowledge Change PR"
description: "從一次合成的企業知識更新演練，拆解來源追溯、影響分析、答案回歸與人工核可，說明 LLM Wiki 真正需要管理的是知識變更生命週期。"
pubDate: 2026-10-14
updatedDate: 2026-10-14
tldr:
  - "新文件不代表舊規則全面失效；更新要判斷生效時間、適用資格、例外與失敗退路。"
  - "Agent 找出要修改的 Wiki 頁面後，還要檢查哪些內容應保持不變，並測試使用者實際收到的答案。"
  - "同題修復重測由 9/11 升至 11/11，只證明這次合成題組的重測結果，不代表正式部署成效或泛化能力。"
audience:
  - "建置企業 RAG、Agent 或知識庫的工程師與架構師"
  - "負責知識治理、內容審查與 AI 系統上線的技術主管"
category: "Enterprise AI"
tags: ["RAG", "Enterprise AI", "AI Agent", "Evaluation", "Architecture Patterns"]
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 21
kind: "article"
showToc: true
image: "/blog/143-llm-wiki-knowledge-change-validation/title_image.webp"
---

10 月 14 日，我在 [Hello World Dev Conference 2026 分享 LLM Wiki 的架構演進](https://hwdc.ithome.com.tw/2026/session/5018)。回頭整理這次演講，我最想留下的不是「Agent 可以自動寫 Wiki」，而是更實際的工程問題：**來源文件變了，哪些知識要更新、哪些必須保留，而新的答案如何證明沒有漏掉重要條件？**

我用一個合成的企業客服案例，將知識更新拆成來源與範圍整理、變更影響分析、答案回歸，以及人工審查。這場演練沒有連接正式企業資料，也沒有發布 Wiki；它展示的是一套可帶回 Agent 或 RAG 專案的變更驗證方法。

## 演講投影片 PDF

- [下載 PDF：LLM Wiki：企業內部知識問答系統的架構演進](/blog/143-llm-wiki-knowledge-change-validation/slides.pdf)

<div
  data-pdf-viewer
  data-src="/blog/143-llm-wiki-knowledge-change-validation/slides.pdf"
  data-title="LLM Wiki：企業內部知識問答系統的架構演進"
  data-height="800px"
></div>

> **花花的一句話**
>
> 知識更新不該只看 Agent 改了哪些檔案，也要驗證哪些答案因此改變、哪些仍應維持原樣。

## 新規生效，不表示舊規則全部作廢

演講用的情境是員工帳號復原：舊規範要求先找 ExampleDesk 服務台，新規則則允許符合條件的人先嘗試自助復原。新規只在生效日期之後，且員工身分、公司管理筆電、帳戶鎖定狀態與自助復原註冊等條件符合時，才改變第一步。

資格不符或事件發生在生效日前，仍須沿用原流程；資訊不足時先追問；自助復原失敗或結果不明，則要有轉交服務台的退路。這是一個**條件式局部取代**問題。若系統只檢索到最新文件，就把舊答案整段覆蓋，反而可能讓不適用的人收到錯誤指引。

這也是我在 [Enterprise RAG 完整指南](/blog/65-enterprise-rag-guide/) 所談的版本與適用範圍問題：檢索到相關證據，只完成回答的一部分，系統還要判定證據對眼前情境是否有效。

## 把知識更新拆成 Compile、Validate、Review

我把知識生命週期分成三個階段，方便團隊檢查責任邊界。

**Compile** 先整理來源、適用範圍與知識產物。演練把來源證據留在 Raw，將可重用的規則與問答整理到 Wiki，再用 Ops 記錄知識範圍和待審事項。來源、摘要、Concept 與 Query 彼此連結，之後才能追查某項答案依據哪份文件。

**Validate** 評估變更影響，再測量回答行為。更新提案不能只列出「要改哪些頁面」，也要指定哪些檔案、問答與來源摘要應保持不變。更重要的是，必須測試最後呈現給使用者的回答正文，而非只檢查檢索結果或引用摘錄。

**Review** 決定是否核可與發布。Agent 可以提出修改、檢查結構、執行回歸，但一次測試通過不會自動替代內容負責人的審查。這套分工與 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 中的控制、評測與人工治理相同：讓 Agent 做可驗證的工作，再把核准權留給明確的責任人。

## 影響分析要找出應改與應留

在演練中，Agent 對新增規範提出修改四個既有頁面、增加一份來源摘要的提案。指定的五份無關問答與六份既有來源摘要保持不變，這讓「不該改的內容」也能成為明確檢查項目。

但直接相關的頁面找齊了，仍不代表影響分析完整。Agent 最初把 `ops/purpose.md` 判為保留；它保住了舊範圍說明，卻漏掉新版知識範圍已從六份來源擴為七份。維護 Agent 後來發現並修正了這個差異。這說明檔案層級的變更清單需要覆核，因為治理設定也可能落在主要內容頁面的依賴之外。

另一個教訓是：檔案沒變，不代表模型答案一定不變。因此回歸測試必須同時驗證預期變更和保留路徑，而不能只看 Git diff。

## 第一個測試失敗，答案方向卻已經答對

更新後，模型在帳號鎖定問題上選對「先嘗試自助復原」，但答案正文沒有交代完整的適用資格與生效日期。另一題的主要密碼重設路徑也符合預期，卻漏了無法連上公司網路時轉交服務台的退路。影響分析、結構檢查與 Agent 覆核都通過，答案回歸仍然失敗；草稿因此停在人工審查前，沒有發布。

這不是只要多加一條 prompt 就能宣告解決。評測本身也需要治理：v1 有題目要求比使用者問題更多的內容，Model Judge 也曾把來源摘錄當成回答正文。團隊另開 v2 題組並保留 v1 結果，沒有回頭改舊成績。**凍結題目讓測量可追溯；發現題目或判分方式有問題，就建立新版本並說清楚差異。**

在 v2 的同一題組中，Baseline 為 10/11，首次 Updated 為 9/11。兩者的知識快照與情境日期同時改變，因此這不是單變因比較，也不能推論架構讓答案變好或變差。團隊修訂通用回答規則後，用原本的 v2 題目重測，結果為 11/11。這是同題修復重測，不是獨立未見題驗收；資格文字是否每次都必須重述，仍待內容負責人判定。

> **花花的工程提醒**
>
> 11/11 只表示這組合成題目在這次重測全數通過。它沒有證明真實知識庫可安全自動發布，也沒有證明比一般 RAG 更準。

## 把 Knowledge Change PR 帶回現有系統

我把這套做法稱為 **Knowledge Change PR**：

1. **Compile**：列出來源、版本、適用條件與受影響知識。
2. **Validate**：檢查預期修改、必須保留的內容，以及使用者實際看到的回答；同時審視題目和 Judge。
3. **Review**：由內容負責人核可，並定義未通過時禁止發布的條件。

不一定要先導入新的 Wiki 平台。可以從一份知識變更清單開始，記錄依據、影響頁面、回歸題目、失敗原因與核准責任人。若你正在整理 Agent 架構，也可以接著閱讀 [WeKnora 架構解析](/blog/95-weknora-architecture/)，看看知識、檢索與 Agent 執行如何在平台中銜接。

## 延伸實作 Repo

- [`poirotw66/llm-wiki-example`](https://github.com/poirotw66/llm-wiki-example)：可 fork 後建立部門專用 Wiki 的範本，重點放在來源歸檔、知識結構與治理流程；預設 Wiki 內容留白，資料需依自身政策整理後再納入。
- [`Tencent/WeKnora`](https://github.com/Tencent/WeKnora)：開源知識平台，將文件理解、RAG、Agent 與 Wiki 放在共用知識庫上，適合對照平台化實作與自架部署選項。

前者從一個可自行治理的知識庫範本出發，後者提供較完整的平台能力。選型前仍要確認資料權限、來源更新、答案評測、人工核可與運維責任是否符合自己的環境。

### 來源

- [Hello World Dev Conference 2026 演講頁](https://hwdc.ithome.com.tw/2026/session/5018)
- [LLM Wiki 範本 Repo](https://github.com/poirotw66/llm-wiki-example)
- [Tencent WeKnora Repo](https://github.com/Tencent/WeKnora)
