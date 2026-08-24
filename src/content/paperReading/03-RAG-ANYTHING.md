---
title: "RAG-Anything：多模態文件檢索不只是把圖片轉成文字"
description: "以論文、附錄與官方程式庫為據，拆解 RAG-Anything 的雙圖索引、實驗證據、失敗案例與工程採用邊界。"
pubDate: 2026-03-23
updatedDate: 2026-08-24
tldr:
  - "RAG-Anything 將表格、圖片與公式保留為可回指的節點，再把跨模態圖與文字圖融合；它不是單純 caption-to-text RAG。"
  - "它在兩個長文件多模態基準的整體分數領先列出的 baseline，但拒答題、複雜版面與成本沒有被勝利數字消除。"
audience:
  - "需要處理 PDF、財報、論文與圖表問答的 RAG 工程師。"
  - "想判斷多模態 GraphRAG 是否值得進入產品 PoC 的讀者。"
tags: ["Paper Reading", "RAG", "Multimodal", "Knowledge Graph", "Retrieval-Augmented Generation", "Long Context"]
image: "/paperReading/03-RAG-ANYTHING/image_1.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
paper:
  title: "RAG-ANYTHING: ALL-IN-ONE RAG FRAMEWORK"
  authors:
    - "Zirui Guo"
    - "Xubin Ren"
    - "Lingrui Xu"
    - "Jiahao Zhang"
    - "Chao Huang"
  year: 2025
  venue: "arXiv 2510.12323"
  links:
    pdf: "https://arxiv.org/pdf/2510.12323.pdf"
    arxiv: "https://arxiv.org/abs/2510.12323"
    code: "https://github.com/HKUDS/RAG-Anything"
series:
  id: "rag-anything"
  title: "RAG-Anything 精讀"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文

一份財報的答案可能藏在「2020」欄與「Wages and salaries」列的交點；一篇論文的答案可能只在四格圖中的其中一格。把 PDF 先 OCR，再把圖片替換成一句 caption，雖然讓所有資料都能進向量庫，卻常抹掉列／欄、panel／axis、公式／變數定義這些決定答案的關係。RAG-Anything 的主張是：非文字內容應是可檢索、可回到原始 artifact 的一級知識單位，而不是僅供生成模型參考的文字附註。

這份文章的結論較窄：在作者使用的兩個多模態長文件 QA 基準上，雙圖索引加上混合檢索的完整系統勝過列出的 baseline，且文件變長時優勢擴大。[論文 Section 3.2、Table 2、Table 3、Figure 2](https://arxiv.org/html/2510.12323v1) 支持這個結論。它仍是一篇 arXiv 技術報告，沒有報告端到端 SLA、每頁 VLM token、索引大小、人工盲評或跨模型／跨 parser 的成本對照；因此不能從 benchmark accuracy 直接推論「所有企業 RAG 都應改成 GraphRAG」。

- **問題**：傳統方法把圖片與表格壓成 caption 後，常遺失 cell、panel、axis 與跨頁關係。
- **核心洞見**：用文字代理負責檢索，但保留可回指的原始圖表；再讓顯式圖關係與 dense similarity 共同找證據。
- **最強證據**：Table 2--4 與 Figure 2 顯示完整系統整體領先，主要收益來自 graph construction，長文件切面差距更明顯。
- **主要邊界**：拒答、parser 錯誤、entity alignment、成本與 latency 都沒有被總體 accuracy 解決。

> **花花的一句話**
>
> 真正的採用門檻不是「文件裡有圖片」，而是你的高價值問題是否反覆需要正確的表格座標、圖中空間關係，或跨頁的圖文對照；先量這個比例，再為圖建圖。

## Evidence Map

- **論文直接證據**：Section 2.2--2.4 定義 atomic unit、雙圖、dense index 與 VLM synthesis；Section 3.1 定義資料、baseline、共同設定與 GPT-4o-mini 評分；Table 2、3、4 與 Figure 2 給出結果；Appendix A.2--A.5 給出案例、prompt 與失敗模式。
- **作者的因果解讀**：作者把整體提升主要歸因於 graph construction，將 reranker 視為較小但有價值的精修；這是 Table 4 的消融解讀，不是已被獨立控制每一個元件後的普遍定律。
- **論文沒有證明**：沒有 production latency／吞吐量／雲端費用、資料外流風險、人工 correctness、不同 OCR 品質或不同 VLM 的敏感度；accuracy evaluator 也是 GPT-4o-mini。
- **Bloss0m 工程判斷**：把圖、表、公式的 raw artifact 與 source-page ID 保留下來是值得借用的介面；但圖融合前的 entity name alignment、parser 可靠度與 prompt 版本都應當是可觀測、可回滾的產品元件。

## 方法骨架（Section 2）

1. **解析與切分**：把來源拆成附有型態、頁面與局部文脈的文字、圖、表、公式 atomic units。
2. **建兩張圖並融合**：非文字 unit 用 multimodal anchor 與 `belongs_to` 邊保留結構；文字另建 entity-relation graph，再以 entity alignment 融合並建立 dense table。
3. **雙路召回**：從圖上作 entity／關係擴展，同時以 embedding 找語意近鄰；將候選融合、重排。
4. **取回原物再回答**：文字代理供 ranking，入選圖表則 dereference 回原始 artifact，和文字 context 一起交給 VLM。

![RAG-Anything Figure 1：從異質文件解析、雙圖建構到 hybrid retrieval 與回答的整體框架。](/paperReading/03-RAG-ANYTHING/image_1.webp)

*Figure 1，論文 Section 2 的 framework overview：圖中把 multimodal knowledge unification、dual-graph construction、vector index、structural／semantic retrieval 與 VLM response 串成一條資料流。[原始 Figure 1 anchor](https://arxiv.org/html/2510.12323v1#S2.F1)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2510.12323v1/framework.png)。arXiv source 標示 perpetual non-exclusive license；本文保留 attribution，依 [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) 使用。*

## 核心直覺：檢索代理與回答證據應該分工

傳統多模態 RAG 常把「讓圖片可搜尋」和「讓模型看懂圖片」合成同一步：先產生 caption，再把 caption 當成圖片本身。問題是 caption 適合做語意搜尋，卻不是表格座標或圖中空間關係的可靠替身。RAG-Anything 改變的控制點，是把兩者拆開：文字代理只負責讓候選容易被找到，真正回答時再回到原始 table／figure。

雙圖的作用也不是讓所有內容變成 graph。顯式關係回答「哪些元素確實相連」，dense index 回答「哪些內容語意相近但圖上沒有邊」。因此最值得帶走的心智模型是：**graph 保存可導航的結構，embedding 補語意近鄰，raw artifact 保留最後判讀所需的細節。**

## 用一個例子走完整個方法：找出財報中的 2020 年薪資

假設問題是「2020 年 Wages and salaries 是多少？」論文 Figure 4 的案例可以簡化成以下資料流：

1. **輸入**：parser 將財報頁拆成文字段落與一張表，並保留頁碼、表頭、列名、cell 與原始表格影像。
2. **中間表示**：VLM 為表格產生可搜尋描述；graph 建立 `Wages and salaries → 2020 → value` 的結構線索，anchor 指回原表。
3. **檢索決策**：dense path 因「薪資」語意找到表格，structural path 沿列與欄定位候選 cell；fusion 與 reranker 決定把該表送往回答階段。
4. **輸出**：系統不只把 caption 交給 VLM，而是 dereference 原表，讓 VLM 讀出交點的 **26,778 million**。
5. **可能失敗**：若 merged cell 被 parser 切錯、`2020` 對到錯欄，或 entity alignment 合併錯誤，graph 會很有自信地導航到錯誤結構；這正是 Appendix A.5 顯示的邊界。

這個例子不是額外實驗，而是把論文 Figure 4 的質性案例轉成可追蹤的工程流程。

## 從 PDF 到索引：不是一條「多模態 embedding」管線

### 1. modality-specific parsing：先定義資料單位，再談模型

Section 2.2 將來源 $k_i$ 分解成 $c_j=(t_j,x_j)$：$t_j$ 是 text、image、table、equation 等型態，$x_j$ 是對應原始內容。這個表示法看似平凡，卻界定了資料契約：段落要保留段落／清單邊界；figure 要有 caption、交叉引用與鄰近文脈；table 要有 header、cell、value；equation 不是一串 OCR 字元，而是符號表示及其附近的變數定義。[Section 2.2、Equation (1)](https://arxiv.org/html/2510.12323v1) 是架構的第一個證據錨點。

論文描述以不同 parser 做高保真抽取；實驗共同用 MinerU 抽出文字、圖片、表格與公式（Section 3.1）。官方程式庫截至 2026-08-09 已把 parser 選項擴成 MinerU、Docling、PaddleOCR，也允許直接插入預先解析的 `content_list`。這是實作版本的能力，不應倒灌成論文實驗的設定。尤其 table parsing 的失誤會在後面的圖中被放大：一旦 merged cell 被切錯，縱使 retriever 找到正確 table，也沒有正確的 row--column 關係可走。

非文字單位會經 context-aware VLM prompt 產生兩種文字代理：較長的 $d_j^{chunk}$ 用於跨模態檢索，較短的 $e_j^{entity}$ 提供 entity 名稱、類型、描述以造圖。prompt 同時讀取局部視窗 $C_j=\{c_k\mid |k-j|\leq\delta\}$，意義是同一張圖在不同章節不能只靠像素被描述；它須被 caption 與相鄰段落限定。[Section 2.2.1、Equation (2)](https://arxiv.org/html/2510.12323v1) 與 Appendix A.3 的 vision/table/equation prompts 都直接說明這一點。對工程而言，這也引入一個成本和風險邊界：描述一旦 hallucinate，後續 graph 的關係會把錯誤變成「可導航證據」，不是普通 chunk 的單點噪音。

### 2. dual graph：保留兩種不相同的訊號

第一張是 cross-modal knowledge graph。每個非文字 unit 都有一個 multimodal anchor $v_j^{mm}$；從其描述抽出的細粒度 entity／relation 用 `belongs_to` 邊連回 anchor（Section 2.2.1 的 Equation (3)--(4)）。因此「圖例藍線」、「2020」、「wages」不只是一段 caption 裡的字，也能回到特定圖或特定表格。論文在 Figure 3 的多 panel t-SNE 例子用 panel $\leftrightarrow$ caption $\leftrightarrow$ axis 關係，避免把相鄰 content-space panel 當成 style-space panel；Figure 4 則以 row $\leftrightarrow$ column $\leftrightarrow$ unit 導向正確 cell。這是資料模型上的承諾，並非 VLM 自然保證的視覺理解。

第二張是 text-based knowledge graph：只對 $t_j=\text{text}$ 的 chunk 做 named entity 與 relation extraction，沿用類 LightRAG／GraphRAG 的文字圖流程（Section 2.2.1）。作者刻意沒有讓 VLM context 取代文字圖，理由是純文字有自己的細緻語義和關係密度。這個拆分很重要：如果把所有內容硬塞進單一圖，會容易讓圖片的 context description 覆蓋原始文本，或把 table 的 cell 結構降格成 entity 名稱。

兩圖再用 entity name 作主要 key 對齊、合併成 $\mathcal{G}=(\mathcal{V},\mathcal{E})$；所有 entity、relation、atomic chunk 都被 embed 到表 $\mathcal{T}$，完整 index 是 $(\mathcal{G},\mathcal{T})$。[Section 2.2.2、Equation (5)](https://arxiv.org/html/2510.12323v1) 證明它不是「雙向量庫」：圖處理顯式關係，embedding table 補圖上沒有邊的語義近鄰。不過 name-based alignment 也留下未量化的風險：同名 entity、縮寫、跨語言別名與 parser 噪音如何合併，論文沒有 error rate 或消融。

### 3. retrieval 與 storage mechanics：兩條召回路徑，最後才讓 VLM 看原物

查詢 $q$ 先被分析是否帶有「table」「figure」「chart」「equation」等 modality cue，再得到與索引一致的文字 embedding $\mathbf e_q$。structural navigation 從 exact entity match／keyword 找種子，擴展指定 hop 的鄰居，產生 $\mathcal C_{stru}(q)$；semantic matching 對 $\mathcal T$ 的 entities、relations、chunks 做 cosine top-$k$，產生 $\mathcal C_{seman}(q)$。[Section 2.3](https://arxiv.org/html/2510.12323v1) 的關鍵不是宣稱這兩者都準，而是它們互補：前者擅長已有顯式連結的 multi-hop 關係，後者找沒有拓撲連線但語意相近的候選。

候選集合取聯集，依 graph structural importance、dense similarity 與 query-inferred modality preference 做 multi-signal fusion score，才送入 reranking。論文沒有公布 score 的係數、top-$k$ 或每階段延遲；因此讀者不能把「hybrid」誤讀成可直接複製的排序公式。最後 synthesis 一面串接 entity summary、relation description、chunk content，並以型態／來源 delimit；另一面對入選的 multimodal chunk dereference 出原始視覺 artifact $\mathcal V^*(q)$，交給 VLM：$\text{Response}=\text{VLM}(q,\mathcal P(q),\mathcal V^*(q))$（Section 2.4、Equation (6)）。這個「proxy 用於檢索，raw visual 用於回答」的分工，是整篇最可移植的設計。

## 實驗先看規則：分數回答的是哪個問題？

Section 3.1 的 DocBench 有 229 份、5 類文件、1,102 組 expert-crafted QA，平均 66 頁、46,377 tokens；MMLongBench 有 135 份、7 類文件、1,082 題，平均 47.5 頁、21,214 tokens。[Table 1](https://arxiv.org/html/2510.12323v1) 與 Appendix A.1 的 Table 5--6 顯示這不是均勻的長度分布：DocBench 財報平均 192 頁而 News 平均 1 頁；MMLongBench 的 guidebook 約 78 頁、財報 87 頁。故「長文件提升」應以 length slice 解讀，不是把所有 domain 混成一個抽象長度。

baseline 有直接讀文件的 GPT-4o-mini、文字圖 RAG 的 LightRAG、跨視覺與語言的 MMGraphRAG。所有 baseline 都以 GPT-4o-mini 作 backbone、MinerU parse、`text-embedding-3-large` 的 3,072 維 embedding、`bge-reranker-v2-m3` 重排；graph 方法被設 entity+relation 20k token 以及 chunks 12k token 上限，輸出限一句話。直接 GPT-4o-mini 的文件會轉成 144 dpi 圖、至多 50 頁。所有答案再由 GPT-4o-mini 做 binary accuracy evaluation（Section 3.1、Appendix A.4）。這給比較一個共同控制，但也帶來 evaluator 同源性、50 頁截斷以及單句答案無法衡量引用完整度的威脅。

## Table 2：整體第一，不代表每個安全切面第一

DocBench 的 Table 2 整體 accuracy 為 RAG-Anything **63.4%**、MMGraphRAG 61.0、LightRAG 58.4、GPT-4o-mini 51.2。相對直接模型多 12.2 points，相對最強列出 RAG baseline 多 2.4 points；這是可以說的 headline。domain 切面卻不整齊：它在 Finance 67.0、News 66.3 最佳，但 Academia 是 61.4，低於 MMGraphRAG 的 64.3；Government 61.5，也低於其 64.9。這削弱了「雙圖對所有文件都一律較佳」的敘事。

型態切面很能說明適用範圍：text-only 是 85.0，與 LightRAG 並列；multimodal 是 76.3，明顯高於 MMGraphRAG 66.0 與 LightRAG 59.7。這符合作者的結構保留假說，但 unanswerable 是 **46.0**，不只低於 LightRAG 46.8，更低於 MMGraphRAG 60.5。若產品需安全拒答，不能把總體 63.4 當成 confidence calibration；必須另外測「沒有答案時是否拒答」、citation provenance 與否定問題。Table 2 本身已提醒我們：最會抓 multimodal evidence 的 retriever，不必然最會辨識證據不存在。

## Table 3 與 Figure 2：長度優勢是品質／成本取捨，不是免費午餐

MMLongBench 的 Table 3 整體結果是 42.8% 對 LightRAG 38.9、MMGraphRAG 37.7、GPT-4o-mini 33.5。分 domain，RAG-Anything 在 Research reports 46.6、Academic papers 38.7、Guidebooks 43.9、Financial reports 43.6 為最高；卻在 Tutorial 43.5 低於 GPT-4o-mini 的 44.0，在 Admin 45.7 也低於 MMGraphRAG 46.9。也就是說它不是把每一種排版都「通吃」，而是在多個但非全部 domain 提升整體。

Figure 2 對 DocBench 顯示超過 100 頁後與 MMGraphRAG 的差距：101--200 頁是 **68.2 vs 54.6**，200+ 頁是 **68.8 vs 55.0**，皆超過 13 points；短文件時兩者較接近。MMLongBench 的長度分桶也報告 11--50、51--100、101--200 頁分別多 3.4、9.3、7.9 points。這支持「散落跨頁、跨模態證據時，結構召回更有價值」；它不報 ingestion latency 或 storage footprint，因此也沒有回答這 13 points 要付多少解析、VLM description、embedding、graph update 與 query rerank 時間。把 Figure 2 放進採購簡報時，旁邊應有自己的每頁成本、p95 latency、index bytes/page 曲線。

## Table 4、案例與 Appendix A.5：它也會被錯誤結構帶偏

Table 4 的 Chunk-only 為 60.0，移除 reranker 的圖架構為 62.4，完整系統 63.4。相對 chunk-only，圖架構增加 2.4 points；reranker 再增加 1.0 point。這與作者「主要收益來自 graph construction，reranker 是 marginal refinement」的說法相符。切面仍有反例：完整系統的 Legal 60.2 低於 chunk-only 60.7；Unanswerable 46.0 僅略高於無 reranker 45.4，且兩者都沒有解決拒答問題。因此 Table 4 是兩個 bundle-level ablation，不是每個 edge type、entity alignment 或 VLM prompt 的因果證明。

Figure 3、4 將收益具體化。前者要求辨識 t-SNE 的 style-space panel，不要被相鄰 content-space panel 干擾；後者要求在財務表中找到 Wages and salaries × 2020，目標是 **26,778 million**。這些不是「圖片看得懂」的泛泛例子，而是需要 panel--caption--axis 或 row--column--unit 結構的定位題。Appendix A.2 再給出 bar chart 找最低 accuracy 的 `-S-A`，及跨多 dataset table 找最高 AUPRC 0.506 的例子。它們是機制合理性的質性案例，不能取代 benchmark 的逐題錯誤分布。

Appendix A.5 則正好限制了樂觀解讀。第一類 failure 是 **text-centric retrieval bias**：即使 query 指明要看圖，系統仍可能取回關鍵字較多、但粒度不對的文字；Figure 11 是所有方法都未能從指定影像取到答案的 cross-modal noise case。第二類是 **document structure processing challenge**：模型常用自上而下、左到右的僵硬掃描，遇到必須 column-wise 讀的 table 或方向非線性的圖就錯。Figure 12 的 GEM row 沒有獨立 cell boundary，`Joint` 與 `Slot` 欄混合，所有方法都誤抽。這是清楚的 failure taxonomy：檢索偏誤、空間／版面偏誤、以及由不規則結構引起的 parser ambiguity；不是只要再加一個 reranker 就會消失。

## Artifact 與可重現範圍（截至 2026-08-09）

官方 [GitHub repository](https://github.com/HKUDS/RAG-Anything) 可公開存取、可 clone，含 MIT license、PyPI／`uv sync` 安裝說明、examples、tests 與 `reproduce/` 目錄；**程式碼狀態：usable**。README 可執行 `rag.process_document_complete(...)` 與 `aquery(..., mode="hybrid")`，也明列 `mineru`、`docling`、`paddleocr` parser。這足以做功能 PoC，不代表可無條件重現論文數字。

執行仍需自行提供 LLM、embedding、vision endpoint 與 API key；MinerU 會下載模型，Office 轉檔另需 LibreOffice，PaddleOCR 另需對應平台的 `paddlepaddle`。**資料／checkpoint／demo 狀態：沒有看到一個由作者提供、固定版本且可一鍵驗證 Table 2--4 的完整 benchmark artifact；不要宣稱數值可重現。** 若要 replication，應固定 paper v1、repository commit、parser／模型版本、144 dpi／50-page baseline 規則、prompt、token limit 和 evaluator，並確認 DocBench、MMLongBench 原始資料的各自授權與取得方式。遇到 gated dataset 或 API 型號變動時，報告應標為 partial reproduction，而非失敗或成功的二分法。

## 工程決策矩陣：何時選它，何時退回簡單 RAG

| 工作負載條件 | 建議 | 首先驗證的量 |
| --- | --- | --- |
| 問題常要求表格 cell、圖中 panel／axis、公式定義，且多為 100+ 頁文件 | 做 RAG-Anything PoC | evidence retrieval recall、cell/panel exact match、長度分桶 accuracy、p95 latency |
| 多是文字 FAQ、短政策文件或已乾淨結構化的資料庫 | 用 chunk + metadata + reranker | 與雙圖的品質差是否超過運維成本 |
| 高敏感資料不能外傳 VLM／embedding 端點 | 先停用或改用可審計的內網模型 | data egress、cache retention、頁面／圖片存取紀錄 |
| parser 對掃描件、合併欄位、雙欄版面錯誤率高 | 先修 ingestion QA，不建圖 | page-level parse success、cell boundary error、人工抽樣 |
| 產品把拒答、安全引用當硬需求 | 加獨立 abstention 與 provenance gate | unanswerable precision/recall、citation-to-page correctness |

具體落地時，把每個 atomic unit 存 `document_id`、page、bbox／raw path、parser version、caption/context prompt hash；把 graph edge 的建立來源和 confidence 記錄下來。query log 要同時存 structural 與 semantic candidate、fusion score、reranker 排名、送 VLM 的 raw artifact。如此 Table 4 所說的圖收益才可在自己的資料上被診斷：是 parser 失敗、alignment 合錯、檢索漏圖，還是 synthesis 看錯圖。

**不適用條件很明確**：text-only、低延遲或低成本服務；無法保存原始頁圖或不允許外部 VLM；資料很快變動而無法做 graph incremental update；缺乏人工標註來測 cell/panel 問題；或團隊無法追查一條 `belongs_to` 邊為何存在。這些情況下，先把 chunk metadata、文件結構、reranking 和 citation UI 做好，通常比增加一個看不見的雙圖更可控。

## 讀完後的三個記憶點

1. **技術精髓**：不要把 caption 當作圖表本身；讓 proxy 負責檢索、raw artifact 負責回答。
2. **證據精髓**：雙圖在作者的長文件多模態 benchmark 有整體優勢，但 Table 4 顯示 graph construction 的貢獻大於 reranker，且不是所有 domain 都贏。
3. **採用邊界**：只有當高價值問題真的依賴 cell、panel、axis 或跨頁關係，且團隊能監控 parser、alignment、拒答與成本時，複雜度才可能值得。

## 下一步與 Primary Sources

若你的 corpus 真有圖表依賴題，先抽樣標註 100 題：答案在哪一頁、屬於 text/table/figure/equation、是否需要空間關係、以及沒有證據時應否拒答。以這些 slice 同時跑 chunk baseline 和雙圖 PoC，才能知道 Figure 2 的長文件優勢是否移轉到你自己的文件。

- [RAG-Anything arXiv record](https://arxiv.org/abs/2510.12323)（2025-10-14 v1；為 preprint／technical report）與 [full paper HTML](https://arxiv.org/html/2510.12323v1)：Section 2、3，Figure 2--4，Table 1--4，Appendix A.1--A.5。
- [Full paper PDF](https://arxiv.org/pdf/2510.12323.pdf)：正式頁面版面與附錄圖 5--12。
- [Official RAG-Anything repository](https://github.com/HKUDS/RAG-Anything)：程式碼可用性、安裝、parser 與 runtime 依賴（於 2026-08-09 核查）。
