---
title: "FinRank：金融文件 RAG 的 hard-negative 檢索評測"
description: "精讀 FinRank：用公司、年度與披露邊界構造金融文件檢索測試，說明為什麼 pooled corpus、hard negatives 與 metadata filter 會改變企業 RAG 的結論。"
pubDate: 2026-08-11
updatedDate: 2026-08-11
tldr:
  - "FinRank 的核心不是再提出一個 embedding，而是把金融文件檢索的錯誤邊界做得更接近真實：同一家公司、不同年度、相似披露與跨公司段落都可能是誘人的錯證據。"
  - "在論文報告的 pooled corpus 上，e5-mistral-7b-instruct 的 Recall@10 為 44.8，BM25 為 32.1；套用 metadata filter 的 BM25 可到 55.0，但可能先把正確答案排除。"
  - "這個 benchmark 支持的是候選證據召回與 hard-negative 鑑別的判斷，不是 answer generation、faithfulness 或生產環境效能的完整證明。"
audience:
  - "正在建置企業搜尋、金融 RAG 或文件問答平台的 AI 與資料工程師"
  - "需要一起衡量 Recall、metadata policy、hard negatives 與資料切分風險的技術負責人"
tags: ["Paper Reading", "RAG", "Information Retrieval", "Enterprise AI", "Benchmark"]
image: "/paperReading/18-finrank-evidence-grounded-rag/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
paper:
  title: "FinRank: A Financial Document Retrieval Benchmark for Evaluating Embedding and Reranking Models"
  authors:
    - "Sasan Mansouri"
    - "Daniel Saad"
    - "Mark Wahrenburg"
    - "Manu Weissel"
    - "Fabian Woebbeking"
  year: 2026
  venue: "arXiv 2608.07400 v1 (2026-08-07; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.07400v1"
    arxiv: "https://arxiv.org/abs/2608.07400"
    code: "https://github.com/datanxt/FinRank"
series:
  id: "finrank"
  title: "金融檢索評測"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文 / The paper in 90 seconds

- **問題：** 金融文件問答的錯誤不只來自「找不到相似文字」。同一個詞可能出現在不同公司、不同申報年度、不同 Note，metadata filter 也可能把真正的 supporting passage 一起裁掉。FinRank 要測的是：檢索器能否在這些近似但不正確的段落中保住正確證據。
- **核心想法：** 建立 1,185 筆人工撰寫的金融 QA、5,230 段 pooled corpus 與 6,021 個 curated hard negatives，再用多種資料切分測試跨年份、跨公司與查詢改寫的泛化。
- **最重要證據：** 在 pooled corpus 的 Recall@10 表中，e5-mistral-7b-instruct 為 44.8、BM25 為 32.1；metadata-filtered BM25 為 55.0，但 Section 7.1 說明 filter 可能因 first-occurrence metadata 把 gold passage 排除。Section 7.3 的 hard-negative 對比又讓 pairwise accuracy 比 random negatives 低 13.0–20.5 個百分點。
- **主要邊界：** 論文沒有測 answer generation、citation correctness 或 faithfulness；資料主要來自 2024–2025 的美國 10-K/10-Q，且標註與資料分布仍有版本不一致。因此它是 retrieval evaluation 的好起點，不是金融 RAG 上線安全證明。

## 先知道什麼 / What to know first

這篇論文把「retrieval」與「generation」切開。對每個問題，先有一個 supporting passage，再從候選池中召回段落；Recall@10 問的是 gold 是否出現在前十名，而不是模型最後是否寫出了正確答案。Pairwise accuracy 則比較模型能否把 supporting passage 排在 hard negative 前面。

你也需要區分三種資料：

1. **In-record candidates：** 同一份申報文件內的候選段落，較接近「在一份文件內找答案」。
2. **Pooled corpus：** 把不同公司與文件的段落放進同一個候選池，測跨文件候選發現與 entity/year 邊界。
3. **Hard negatives：** 與問題表面上高度相關、但不是 supporting passage 的段落；它們比隨機負例更接近生產環境的錯誤。

這和 Bloss0m 既有的 [BM25 scaling 精讀](/paper-reading/13-bm25-wins-at-scale) 與 [RubricRanker 精讀](/paper-reading/17-rubric-ranker-deep-research) 可以接起來：前者問 access layer 如何隨 corpus scale 變化，後者問 reranker 的 rubric 如何改變文件排序；FinRank 則把「錯證據為什麼難」變成可重跑的資料與切分問題。

## 既有方法為什麼不夠 / Why the previous retrieval approach is insufficient

只用隨機負例或單一小型文件集，會讓 retriever 看起來已經學會 relevance，卻沒有測到跨公司、跨年度與跨 Note 的近似錯證據。只報一個 pooled score，也會把 candidate recall、metadata exclusion 與 hard-negative discrimination 混成同一個數字。FinRank 的前置限制正是這個 evaluation gap；它沒有宣稱解決 generation 或 safety 的全部問題。

## 核心直覺 / Core intuition

一般相似度檢索的直覺是：問題與段落越像，段落越可能是答案。FinRank 的挑戰是把這個直覺推到它會失效的地方：

- **公司邊界：** 「operating segments」可能在多家公司的 10-K 中都出現，但問的是 JNJ，不是 LLY。
- **時間邊界：** 同一家公司不同年度的財務數字都合理，卻不一定回答當年的問題。
- **披露邊界：** 財報 Note、風險因素與管理層討論可能共享詞彙，只有其中一段真正承載答案。
- **查詢邊界：** 69% 的資料帶有 query rewrite；改寫可以補足口語問題，也可能改變 entity、年度或欄位語意。

因此工程上的決策規則不是「dense 一定勝 BM25」，而是：先問候選池是否包含正確證據，再問排序器是否能把正確證據推到前面，最後才問生成器能否忠實使用它。FinRank 主要覆蓋前兩問。

> **花花的工程提醒**
>
> hard negative 不是「另一段看起來不相關的文字」。它是會讓一個看過金融語料的檢索器犯錯的對手。沒有 entity、year、document 與 passage provenance，Recall@10 的漂亮數字很容易只是資料分布的反映。

## 走一個例子 / Worked example

論文 Appendix E 提供一個已去識別化的 JNJ 範例。問題詢問 J&J 在 FY2024 的 segments；supporting passage 來自 JNJ 的公司概覽，而 hard negative 來自 LLY 的 Note 19。這不是要我們背出財報內容，而是看一次完整的判斷流程：

1. **Input：** 將問題、公司與年度意圖送入檢索器；若 query rewrite 改寫問題，仍要保留 JNJ 與 FY2024 這些約束。
2. **Candidate pool：** 在 pooled corpus 中同時出現 JNJ 段落與 LLY 段落。兩者可能共享 segments、year 或 business vocabulary。
3. **Ranking decision：** 模型不只要看語意相似度，也要讓 entity、period 與 disclosure provenance 形成排序訊號。若 metadata filter 先刪除不符合 first-occurrence 的候選，正確 JNJ passage 可能在 ranking 前就消失。
4. **Output：** 前十名應包含 supporting passage，且最好把它排在 LLY hard negative 之前；這才是 Recall@10 與 pairwise accuracy 分別在測的兩層能力。
5. **Failure point：** 若模型只認得「segments」這個詞，它可能選中 LLY。若 filter 只信段落先出現的 metadata，則可能得到更乾淨卻錯誤的候選池。

這個例子也解釋為什麼本文不把 FinRank 當成 answer benchmark：文章可以先回答「找到了哪段證據」，但還沒有驗證生成器是否引用正確段落、保留數字、處理衝突或拒答。

## 技術機制 / Technical mechanism

FinRank 的資料與評測流程可以拆成四步：

1. **Question and passage construction：** 作者從 2024–2025 年、22 家美國公司的 10-K/10-Q 建立 1,185 筆 QA，涵蓋 pharmaceuticals、oil/gas 與 automotive；資料有 6,021 個 curated hard negatives，並提供 supporting passage。
2. **Corpus pooling：** 先保留每筆資料的 in-record candidates，再形成 5,230 個 unique passages 的 pooled corpus。這讓「在正確文件內找」與「在跨公司候選中找」成為兩種不同難度。
3. **Retriever comparison：** Section 6.1 比較 TF-IDF、BM25、all-mpnet-base-v2、cross-encoder、bge-large、finance-adapted embedder 與 e5-mistral-7b-instruct 等基線；文中也固定 512-token truncation，避免不同模型看見不同長度的輸入。
4. **Split and contrast：** 五種 generalization splits、query-rewrite 對比、metadata-filtered BM25，以及 hard-versus-random negative 對比，分別檢查跨資料分布、規則過濾與負例難度。

這裡沒有需要神秘化的新 loss。論文的可取之處在於把錯誤來源拆開：資料如何構成、候選如何混合、負例是否真的困難，以及 metadata policy 是否在檢索前改變了任務。

## 如何讀證據 / How to read the evidence

### Pooled retrieval：Recall@10 到底回答什麼

**問題與控制：** Section 3.6 的 pooled corpus 把不同記錄的段落放在同一候選池；同一批問題、supporting passage 與候選集合讓模型之間可比較。**觀察：** Section 7 / Figure 3 / Table 4 報告 e5-mistral-7b-instruct 的 Recall@10 為 44.8，BM25 為 32.1。**解釋：** 在這個 pool 與截斷設定下，較強的語意模型能把更多 gold passage 帶進前十名。**邊界：** 這不代表它會生成正確答案，也不代表在另一個公司分布、語言或長文件切法仍維持同一差距。

![FinRank Figure 3：已執行的 retrieval baseline 與 hard-negative 對比](/paperReading/18-finrank-evidence-grounded-rag/figure-3-executed-baselines.png)

*圖｜原文 Figure 3（Section 7）：上半部是 pooled retrieval 的 Recall@k，下半部是 curated hard negatives 與 random negatives 的 pairwise accuracy。來源：[FinRank v1 Figure 3](https://arxiv.org/html/2608.07400v1#S7.F3)；原論文標示為 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。*

### Metadata filter：高分是否可能是風險訊號

**問題與控制：** Section 7.1 比較普通 BM25 與 metadata-filtered BM25。**觀察：** filter 版 Recall@10 報告為 55.0。**解釋：** 如果 metadata 事先把大量不可能的候選排除，排序器面對的問題變簡單。**邊界：** 論文指出 first-occurrence metadata 可能排除 gold passage；所以 55.0 不是免費的準確率，必須與 metadata coverage、false exclusion rate 一起看。這是一個典型的「offline score 上升、任務邊界改變」問題。

### Hard negatives：接近生產錯誤的壓力測試

**問題與控制：** Section 7.3 / Table 5 把 curated hard negatives 與 random negatives 對比。**觀察：** hard-negative 條件使 pairwise accuracy 比 random 條件低 13.0–20.5 個百分點。**解釋：** 模型可能在一般語料上學會「有關鍵詞就相似」，但還不會可靠處理 entity、year 與 disclosure provenance。**邊界：** 這個差距不能直接轉成 production failure rate；它只說明負例設計會顯著改變難度。

### Generalization 與資料品質

Appendix A 的 Sections 3.2–3.5 描述資料構造與 annotation。論文主文與 artifact summary 對資料分布有約 87% / 88% 為 10-K 的差異；我把它保留為版本待釐清，而不選一個數字假裝精確。資料約 75% 來自 2025 年、質性問題約佔四分之三，且是 single-annotator，沒有正式 inter-annotator agreement。另有 442 個 hard negatives（約 7.3%）與別筆紀錄的 supporting passage byte-equal；這些都會影響你對 split leakage、難度與獨立性的判讀。

## 證據地圖 / Evidence map

- **論文直接支持：** FinRank 的資料規模、pooled corpus、baseline 清單、Recall@10、pairwise accuracy、五種 split 與 hard-negative 對比；定位點是 Sections 3.6、6.1、7、7.1、7.3，以及 Appendix A。
- **作者的解讀：** hard negatives 比 random negatives 更能暴露金融檢索器的 ranking weakness；metadata-aware retrieval 可以改善召回，但不是沒有 exclusion risk。
- **尚未建立：** 沒有 answer generation、citation correctness、faithfulness、human preference、在線延遲或金融決策風險結果；也不能從這些 retrieval numbers 推出某個模型在生產環境最安全。
- **Bloss0m 工程判斷：** 最值得帶走的是 evaluation contract：每次報 Recall 時，同時保存 entity/year/document provenance、候選池版本、hard-negative taxonomy 與 filter 的 false-exclusion audit。這是工程推論，不是論文實驗結果。

### Limitations 與 unsupported interpretations

這些 limitations 不是腳註，而是結論的一部分：FinRank 的 preprint 結果不能支持「某個 retriever 在所有金融資料都更好」、不能支持「metadata filter 不會漏掉答案」，也不能支持 generation faithfulness 或金融決策安全。資料的 10-K 比例、single-annotator 品質、hard-negative byte equality 與沒有正式 IAA，都應在採用前重新核對。

## Artifact 與可重現性 / Artifacts and reproducibility

截至 **2026-08-11**（as of 2026-08-11），作者的 [FinRank repository](https://github.com/datanxt/FinRank) 可直接連線，包含 `FinRank.jsonl`、`baselines/`、splits、validation script、repair log、hard-negative taxonomy 與 summary。README 說明資料集以 CC BY-NC 4.0 提供，完整 SEC filing 原文不隨 repo 重新散布；因此 artifact repository 可用於檢查 schema、跑 smoke-level validation 與理解 reported results，但不是拿到所有外部文件後就能無條件重現論文。

重跑至少要固定：repo commit、`FinRank.jsonl` 版本、五種 split、模型 checkpoint、512-token truncation、query-rewrite 狀態、metadata filter 規則，以及 raw filing 的取得方式。若缺少 SEC 原始文件、模型權重或相同 preprocessing，應報告「partial reproduction」而不是「reproduced」。

## 工程判斷與不適用條件 / Engineering decision and when not to use it

**值得使用的情境：**

- 你正在做企業財報、法務或合規 RAG，需要把「候選召回」和「回答正確」拆成兩個 gate。
- 你有多個公司、年度與文件版本，想測 metadata policy 是否誤刪 gold evidence。
- 你希望用 hard negatives 建立 retriever/reranker regression set，而不是只用隨機負例。

**不要直接套用的情境：**

- 你要驗證生成答案、數字計算、引用範圍或拒答；FinRank 沒有這些結果。
- 你的資料是多語、即時市場資料、表格與圖形密集文件；本文只把表格與圖形文字化，不能假設視覺證據已被涵蓋。
- 你的系統只允許嚴格 metadata filter，卻沒有 false-exclusion audit；55.0 的 filter 結果反而應該先觸發風險檢查。
- 你要比較 production latency、API cost 或金融決策安全；這篇 preprint 沒有提供完整 operational study。

一個實務 rollout 可以先把 FinRank schema 改成自己的 document provenance，再加入公司/年度/文件型別的 hard-negative matrix，最後把 top-k evidence 送進 answer-and-citation audit。不要跳過候選池覆蓋率，就直接用最終答案分數調參。

## 三個要記住的點 / Three things to remember

1. **技術想法：** 金融檢索的難點不是相似文字，而是相似文字跨越了錯誤的公司、年度與披露邊界。
2. **證據：** pooled corpus 的 Recall@10 與 hard-negative drop 說明候選池與負例設計會顯著改變排序結論；metadata filter 的高分必須搭配 exclusion audit。
3. **邊界：** FinRank 是 retrieval benchmark，不是 generation、faithfulness、latency 或金融安全的完整驗證；artifact 可查驗，但完整重現仍有外部文件與版本條件。

## Primary sources

- [FinRank arXiv abstract and v1 metadata](https://arxiv.org/abs/2608.07400)
- [FinRank v1 HTML, Sections 3.6, 6.1, 7 and Appendix A](https://arxiv.org/html/2608.07400v1)
- [FinRank artifact repository](https://github.com/datanxt/FinRank)
- [BM25 Wins at Scale paper reading](/paper-reading/13-bm25-wins-at-scale)
- [RubricRanker paper reading](/paper-reading/17-rubric-ranker-deep-research)
