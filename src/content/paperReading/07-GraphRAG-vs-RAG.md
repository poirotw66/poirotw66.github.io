---
title: "RAG vs GraphRAG：系統性對照與混合策略（詳細筆記）"
description: "依 arXiv:2502.11371 解讀統一評估協議、四類 GraphRAG、Table 1–5 數字、效率 trade-off 與 Selection／Integration 混合策略。"
pubDate: 2026-03-24
updatedDate: 2026-08-24
tldr:
  - "依 arXiv:2502.11371 解讀統一評估協議、四類 GraphRAG、Table 1–5 數字、效率 trade-off 與 Selection／Integration 混合策略"
audience:
  - "想先掌握論文方法、實驗證據與工程啟示，再決定是否深讀的 AI／ML 實作者與研究者。"
  - "評估論文想法是否值得實作或引用的工程師。"
tags: ["論文精讀", "RAG", "GraphRAG", "Benchmark", "多跳推理", "混合檢索"]
image: "/paperReading/07-GraphRAG-vs-RAG/image_3.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
paper:
  title: "RAG vs. GraphRAG: A Systematic Evaluation and Key Insights"
  authors:
    - "Haoyu Han"
    - "Li Ma"
    - "Yu Wang"
    - "Harry Shomer"
    - "Yongjia Lei"
    - "Zhisheng Qi"
    - "Kai Guo"
    - "Zhigang Hua"
    - "Bo Long"
    - "Hui Liu"
    - "Charu C. Aggarwal"
    - "Jiliang Tang"
  year: 2025
  venue: "arXiv 2502.11371"
  links:
    pdf: "https://arxiv.org/pdf/2502.11371.pdf"
    arxiv: "https://arxiv.org/abs/2502.11371"
    code: "https://github.com/haoyuhan1/RAGvsGraphRAG"
series:
  id: "graphrag-vs-rag"
  title: "GraphRAG vs RAG 精讀"
  part: 1
  totalParts: 1
---

## 90 秒地圖 / The paper in 90 seconds

- **問題**：不同 GraphRAG 系統同時改變圖建構、檢索、context budget 與生成流程，單看個別論文很難回答何時值得付圖的成本。
- **核心想法**：在統一 preprocessing、retrieval budget 與 generation script 下，將 RAG 與 KG-based、community-based、text-centric、hierarchical GraphRAG 分開測，並提出 Selection/Integration hybrid。
- **最強證據**：QA 與 query-based summarization 的比較用 Table 1–5、Section 4–5 與效率分析顯示優勢依 query type、global context 與建圖成本而變。
- **邊界**：受測系統、語料、Llama-3.1-8B-Instruct 與固定預算限制外推；benchmark win 不等於圖會在你的文件或 SLA 下有 ROI。

## 先前方法為何不足 / Why the previous approach is insufficient

把「GraphRAG」當單一方法會掩蓋 KG triplet、community report、text graph 與 hierarchy 的不同控制點；不同資料處理與 token budget 也會把 pipeline 差異誤當圖的優勢。本文先將設定對齊，再比較 Selection（何時選哪個 retriever）與 Integration（如何合併 evidence）（Section 3、Table 1）。

## 核心直覺 / Core intuition

平面 RAG 擅長以局部 chunk 回答直接問題；graph 的價值在要跨 entity 關係、多跳或聚合 global corpus structure 時，代價是建圖、檢索、摘要與 context 的額外成本。故正確問題不是「graph 是否更好」，而是 query 需要哪種 evidence topology，並以 quality、latency、cost 一起決定（Figure 1、Section 3.2）。

![RAG vs GraphRAG Figure 3(a)：Llama 3.1 8B 設定下四種 retrieval strategy 的 QA 表現比較。](/paperReading/07-GraphRAG-vs-RAG/image_3.webp)

*Figure 3(a)，論文 Section 4.4 的 QA comparison：RAG、GraphRAG、Selection 與 Integration 在 NQ、HotpotQA、MultiHop-RAG 與 NovelQA 上的差異，讓「graph 是否值得」回到 query type 與 evidence topology。見 [原始 Figure 3 anchor](https://arxiv.org/html/2502.11371v1#S4.F3) 與 [Figure 3(a) source endpoint](https://arxiv.org/html/2502.11371v1/qa_improvement_8B.svg)。arXiv source 標示 perpetual non-exclusive license；本文保留 attribution，依 [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) 使用。*

## 逐步例子 / Worked example

若問題是「某公司去年收購後哪個部門負責服務 X？」平面 RAG 可能取到收購新聞與服務頁，但未把 acquisition、部門與服務鏈起來；graph-guided retrieval 可從 entity/path 擴展並取回支撐鏈。若問題只是「服務 X 的定價」，同一圖流程可能只增加延遲。Selection 可先判斷 query type，Integration 再合併 chunk 與 graph evidence；此為教學例子，不是論文 benchmark item。

## 如何讀實驗 / Evidence, controls, and limits

**Section 3 / Table 1** 定義各類 GraphRAG，避免把方法混為一談。**Section 4 的 QA 表格** 固定 preprocessing/budget/generation，問各 query 類型是否改變；multi-hop 或特定 global query 的優勢不等於所有 NQ/單跳問題都應建圖。**Section 4.6 與 Section 5.3** 把 efficiency 與 position bias 放回結果：好分數若依賴較長 context 或 costly community summaries，需另算 SLA。這些是 controlled benchmark evidence，不是 production cost study。

## Artifact 與採用判斷 / Artifacts and engineering decision

截至 **2026-08-09**，[官方 RAGvsGraphRAG repository](https://github.com/haoyuhan1/RAGvsGraphRAG) 可存取；需 clone 後確認 commit、資料授權、模型/API 與各 GraphRAG dependency 才能宣稱重現。適合先用 query taxonomy 做 hybrid canary，量品質與 p95 latency/索引成本；不適合沒有關係型需求、資料快速變動卻無增量建圖能力，或只因 benchmark 分數就替換既有 RAG。

## 三個記憶點 / Three things to remember

1. GraphRAG 是多個設計族群，不是單一 baseline。
2. 關係／多跳／全局結構可能受益；直接局部問題未必值得圖成本。
3. 採用要以 query slice、增量建圖與端到端 SLA 驗證 hybrid，而非追平均分數。


GraphRAG 在文本任務上報告了多跳推理、全局摘要等優勢，但各系統 **graph 建法、檢索模式、評估協議** 各異，難以回答：**什麼時候該用 RAG、什麼時候該上 GraphRAG？** Han 等人（Michigan State / Meta / IBM 等，arXiv:2502.11371）在 **統一前處理、檢索預算、生成腳本** 下，對 **QA 與 query-based summarization** 做 controlled benchmark，並提出 **Selection / Integration** 混合策略。

以下依 **§3 Evaluation Framework → §4 QA → §4.6 Efficiency → §5 Summarization → §5.3 Position bias** 整理；主表數字以 **Llama-3.1-8B-Instruct** 為準（論文 §4.2）。

---

> **花花的一句話**
>
> RAG 與 GraphRAG 沒有誰必然更好；應依問題是否需要關係、多跳與全局脈絡，並把品質提升和延遲成本一起評估。

### §3 統一評估框架

**設計原則（§3）：**

1. **Retrieval 與 generation 解耦** — 先存各方法檢索結果，再用同一 generation script  
2. **預算對齊** — 盡可能 identical settings；否則 match key budgets  
3. **開源實作** — [github.com/haoyuhan1/RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG)

#### §3.1 RAG Pipeline

標準 dense retrieval：chunk → embed → query cosine → top-k chunks。

#### §3.2 四類 GraphRAG（§3.2）

| 類別 | 代表實作 | 檢索單位 | 特點 |
|------|----------|----------|------|
| **KG-based** | LlamaIndex KG-GraphRAG [24] | entity 多跳 triplets（± 原文） | Triplets only vs Triplets+Text |
| **Community-based** | Microsoft GraphRAG [5] | **Local**：entity 鄰域 + 低層 community report；**Global**：高層 community 摘要 | global 偏 corpus-level |
| **Text-centric graph-guided** | HippoRAG2 [10] | **仍以 text chunk 為主**；graph 引導打分/遍歷 | chunk 為 primary target |
| **Hierarchical summary** | RAPTOR [32] | 遞迴聚類 + 多層 summary | 無顯式 KG |

#### §3.3 任務與資料（§3.3, §4.1）

**QA：**

| 資料集 | 類型 | 指標 |
|--------|------|------|
| **NQ** | single-hop | P, R, F1 |
| **HotPotQA** | multi-hop | P, R, F1 |
| **MultiHop-RAG** | 四類：Inference, Comparison, Temporal, **Null** | Accuracy |
| **NovelQA** | 21 種細粒度 query type | Accuracy |

**Summarization：** SQuALITY、QMSum（單文檔）；ODSum-story、ODSum-meeting（多文檔）；ROUGE-2 + BERTScore。

---

### §4.2 QA 主結果

#### Table 1：NQ（single-hop）與 HotPotQA（multi-hop）F1（%）

| Method | NQ F1 | HotPot F1 |
|--------|-------|-----------|
| **RAG** | **64.78** | 60.04 |
| RaptorRAG | 60.04 | 61.31 |
| KG-GraphRAG (Triplets only) | 34.28 | 25.02 |
| KG-GraphRAG (Triplets+Text) | 50.27 | 42.60 |
| Community-GraphRAG (Local) | 63.01 | 61.66 |
| Community-GraphRAG (Global) | 54.48 | 45.16 |
| **HippoRAG2** | 61.03 | **63.01** |

**觀察 (1)（§4.2）：** **RAG 在 single-hop NQ 最強**（F1 64.78）；HotPot 上 **HippoRAG2 與 RAG 並列 63.01**，優於 Community-Global（45.16）。

**觀察 (4) KG 覆蓋率（Appendix C）：** HotPotQA 僅 **~65.8%** answer entities 出現在 constructed KG；NQ **~65.5%** — 解釋 KG-GraphRAG (Triplets only) 在 NQ 僅 **34.28 F1**。

#### Table 2：MultiHop-RAG Overall Accuracy（%）

| Method | Inference | Comparison | Null | Temporal | **Overall** |
|--------|-----------|------------|------|----------|-------------|
| RAG | 92.16 | 57.59 | **96.01** | 30.70 | 67.02 |
| RaptorRAG | 91.91 | 55.26 | 90.03 | 45.28 | 68.78 |
| KG (Triplets) | 55.76 | 22.55 | 98.67 | 18.70 | 41.24 |
| KG (Triplets+Text) | 67.40 | 34.70 | 97.34 | 17.15 | 48.51 |
| Community (Local) | 86.89 | 60.63 | 80.07 | 50.60 | 69.01 |
| Community (Global) | 89.34 | 64.02 | **19.27** | **53.34** | 64.40 |
| **HippoRAG2** | 91.54 | 58.41 | 85.71 | 49.91 | **70.27** |

**怎麼讀：**

- **Overall 最高：HippoRAG2 70.27** — graph-guided chunk 在多跳綜合榜領先  
- **Community-Global 的 Null 僅 19.27%** — 該答「資訊不足」時易 hallucinate（§4.2 觀察 3）  
- **Temporal：Global 53.34 > Local 50.60 > RAG 30.70** — 需全局時間線時，摘要級檢索有優勢  
- **Inference / Null：RAG 92.16 / 96.01 仍強** — 單跳事實 + 拒答

#### Table 3：NovelQA 子集（§4.2, Table 3 節選 avg %）

| 子集 | RAG avg | HippoRAG2 avg | 解讀 |
|------|---------|---------------|------|
| **sh** (single-hop) | **68.73** | — | RAG 領先 |
| **mh** (multi-hop) | 57.12 | — | Graph 方法在 mh 更 competitive |
| **dtl** (detail-oriented) | 55.28 | — | RAG 擅長細節題 |

（完整 21 類型見 Appendix B。）

---

### §4.3 Reranking 與 IRCoT（Figure 1）

**Figure 1：** NQ 與 MultiHop-RAG 上，**rerank / IRCoT 普遍提升** 所有方法，但 **結論不變**：

- NQ：**RAG 仍 best** on single-hop  
- MultiHop-RAG：**GraphRAG 方法在增強推理下通常優於 RAG**  
- 例外：Community-Local + IRCoT 在 **NULL** 查詢仍很差  

> **錨點：** 推理時增強（rerank、迭代）是 **正交增益**，不能替代架構選型。

---

### §4.5–4.7 混合策略與 Graph 品質

#### Selection（§Appendix G）

用 LLM **分類 query**：Fact-based → RAG；Reasoning-based → GraphRAG（Figure 7 prompt）。

#### Integration（§Appendix H, Table 20–24）

**拼接** RAG 與 GraphRAG 檢索結果再生成 — **多數設定提升**；例外：**Llama-3.1-8B + MultiHop-RAG** 整合後 **Null accuracy 大跌**（context 過長，8B 易誤答）。

#### Table 5：Graph construction model 影響（MultiHop-RAG, Llama-3.1-70B）

| Construction LLM | Inference | Comparison | Temporal | **Overall** |
|------------------|-----------|------------|----------|-------------|
| None (RAG) | 94.85 | 56.31 | 25.73 | 65.77 |
| GPT-4o-mini | 92.03 | 60.16 | 49.06 | 71.17 |
| **GPT-4o** | 93.63 | **66.59** | **58.49** | **75.08** |

**Temporal 25.73 → 58.49** — GraphRAG 上限高度依賴 **建圖 LLM 能力**；強模型也意味 **更高建構成本**。

---

### §4.6 效率：Table 4（MultiHop-RAG）

| Method | Construction (s) | Retrieval (s) | Storage |
|--------|------------------|---------------|---------|
| **RAG** | **135** | 1724 | 127MB |
| KG-GraphRAG | 7702 | **14434** | **117MB** |
| Community-GraphRAG | 5560 | **1249** | **165MB** |

**解讀（§4.6）：**

- Graph **建構時間 >> RAG**（55–57×）  
- **KG 檢索最慢**（LLM entity expansion + 多步 traversal）  
- **Community 檢索可快於 RAG**（community-level matching）  
- **Community 儲存最大**（community + summaries）

GraphRAG **不是免費午餐** — 選型需同時看 **construction $、retrieval latency、storage**。

---

### §5 Query-Based Summarization

#### §5.2 主發現（Table 6–7, §5.2）

1. **RAG / RaptorRAG / HippoRAG2** 在 query-based summarization 通常好 — 因 retrieve **原始 chunk**，更接近 human reference  
2. **KG-GraphRAG：Triplets+Text > Triplets only** — 細節來自原文  
3. **Community：Local > Global** — Global 只有高層摘要，缺 query-specific detail  
4. **Integration 常 ≈ RAG alone** — 單純 concat 兩路證據 **未必** 提升 ROUGE/BERTScore 對齊  

#### §5.3 LLM-as-a-Judge 的 Position Bias（Figure 4）

**與 Edge et al. [5] 的差異（§5.3）：**

| 維度 | Edge GraphRAG 論文 | 本文 |
|------|-------------------|------|
| 任務 | **Global** summarization | **Query-specific** 角色/事件 |
| 評估 | LLM-as-Judge，無 GT | ROUGE + BERTScore vs 人工 |

**Figure 4：** 用 LLM 評 Comprehensiveness / Diversity，**改變 RAG vs GraphRAG 摘要呈現順序（O1/O2）** → 勝率劇烈反轉：

- **Comprehensiveness：** O1 偏 RAG；O2 偏 GraphRAG（Local）  
- **Diversity：** Global GraphRAG 在 O2 更受青睞  

> **錨點：** 「GraphRAG 摘要更好」可能是 **評估協議 artifact**；benchmark 論文必須報 **position effect**。

---

### §4.4 失敗模式案例（Appendix D, Figure 5–6）

- **Case 1 (HotPot)：** RAG 未 retrieve 到關鍵 bridge entity → 錯；Community-Global 用 **community summary** 涵蓋必要脈絡 → 對  
- **Case 2：** RAG retrieve 到精確 span → 對；Graph 走錯 community → 錯  

→ **沒有 universal winner**，需 **query-type routing**。

---

### 決策樹（編者整理）

```
Query 類型？
├─ Single-hop / detail / Null-abstain → 優先 RAG（Table 1 NQ, Table 2 Null 96%）
├─ Multi-hop / Temporal / Comparison → 優先 HippoRAG2 或 Community-Local（Table 2 Overall 70.27）
├─ Corpus-level global summary → Community-Global + 注意 judge position bias
└─ 預算有限 → 避免 KG 全量建圖；考慮 Selection 路由
```

**Integration：** 70B 或長 context 可試 concat；8B 在 MultiHop-RAG 上要 **警惕 Null 退化**。

---

### 限制

1. **Llama-3.1 為主表 backbone** — 70B 見 Appendix，趨勢一致但幅度不同  
2. **Graph 建構一次固定** — 未測 incremental update  
3. **NovelQA 21 類僅部分入正文** — 細粒度需讀 Appendix  
4. **Summarization Integration 收益有限** — 與 QA 不同，不能照搬混合策略  

---

### 編者總評

這是 **「RAG vs GraphRAG」少數 truly controlled** 的對照：Table 1–2 給出可引用的 **F1 / Accuracy 數字**，Table 4–5 補上 **成本與建圖品質**。實務上最值錢的結論是 **互補 + Selection/Integration**，而非「全面換 GraphRAG」。若你的產品只有 single-hop FAQ，GraphRAG 可能是 **貴且無增益**；若 HotPot 型多跳 + 長 corpus 摘要，HippoRAG2 / Community-Local 值得 POC — 但請用 **與本文一致的 token budget** 量測。

---

### 第三遍延伸

- [ ] Clone [RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG)，在你 corpus 重跑 Table 4 latency  
- [ ] 實作 **Selection router**，用 MultiHop-RAG 四類量測 routing accuracy  
- [ ] 摘要評估：**固定 O1/O2 雙序** LLM-judge，避免 position confound  
- [ ] 讀 Appendix **Table 16 retrieval accuracy** 對照 end-to-end QA  

---

## 證據地圖：不能從 benchmark 推論成產品定律

- **論文直接支持的證據**：Section 3 的統一 preprocessing／retrieval／generation protocol；Table 1–3 的 QA 設定與 query-type slice；Table 4–5 的 query-based summarization；Section 4.6 的 construction、retrieval、storage cost；Figure 4 的 LLM judge position bias；Appendix D 的 RAG 與 community retrieval failure cases。這支持「在本文 implementation、corpus、budget 與 Llama 3.1 evaluation 下，方法優勢會隨 query 類型改變」。
- **作者主張**：RAG 與 GraphRAG 互補，Selection／Integration 可以結合長處；Graph construction quality 是重要變因。
- **證據沒有建立的事**：不是企業私有資料、增量 graph update、跨語言、freshness、權限過濾或 production traffic 的測試；主要 generation model 是 Llama-3.1-8B/70B。Table 4 的秒數與 MB 是 benchmark run，不是含 API、抽取失敗、retry、queue、cache、監控與人力的 total cost。
- **Bloss0m 工程判斷**：最可採用的是 query-aware routing 與同 budget evaluation discipline，不是把「GraphRAG」當成單一可替換產品。Graph 可能對 relation / temporal evidence 有價值，也可能讓 null-abstention 與細節 retrieval 變差。

## Artifact 與可重現狀態（核對日期：2026-08-09）

[arXiv record](https://arxiv.org/abs/2502.11371) 的 PDF／HTML／TeX 為 **可存取（usable for reading）**；本文的 table／appendix anchors 對應文章原先精讀的 v1，record 目前已到 v3，不能混用不同版本的數字。[haoyuhan1/RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG) 是 **可存取（usable）** 的官方 benchmark code：README 列出 RAG、RAPTOR、KG／Community GraphRAG、HippoRAG2、index/retrieval/QA/evaluation scripts 與 command flags。

但 repo 只有 1 commit，GitHub Releases 為 **空白（empty）**，未見固定的 paper result snapshot、graph cache、checkpoint、container lockfile 或完整 raw result log。README 依賴 LlamaIndex、vLLM、HippoRAG、RAPTOR、Microsoft GraphRAG 與 OpenAI API；上游方法、model/API version、dataset acquisition、keys 與 runtime environment 仍會改變。因此 code 可以用來重跑一個近似 pipeline，原論文每個表格的 exact artifact、cost accounting 與 deterministic reproduction 仍是 **missing/incomplete**，不應把「有 repo」寫成「已完全可重現」。

## 工程採用與不適用條件

| 情境 | 建議 | 原因 |
| --- | --- | --- |
| 可明確路由的 multi-hop、comparison、temporal query，corpus 關係密集 | 先做 RAG vs graph-guided retrieval 的同 budget POC | Table 2 的 query slice 才是採用理由；保留 per-type metric，而非只看 overall。 |
| single-hop FAQ、detail lookup、正確 abstention 是核心 | **不要預設採用**GraphRAG | Table 1 的 NQ 與 Table 2 的 Null 顯示 RAG 常較強；Community-Global Null 只有 19.27%。 |
| 需要 corpus-level synthesis，且可接受 summary loss | 可評估 Community-Global | 它對 comparison／temporal 有訊號，但 Table 4–5 也顯示 query-specific summarization 不一定佔優。 |
| 成本／latency budget 緊、corpus 頻繁增量、無 graph refresh ownership | **不要先建 full KG** | Section 4.6 的 construction/retrieval trade-off 已很大，論文未測 incremental maintenance。 |
| 想把 RAG+Graph evidence 直接 concat | 先做 context-length 與 null calibration test | Appendix H 的 Integration 不是普遍單調改善；較小 backbone 有 null degradation。 |

### 原始出處

- Han et al. *RAG vs. GraphRAG: A Systematic Evaluation and Key Insights*. arXiv:2502.11371 (2025). [PDF](https://arxiv.org/pdf/2502.11371.pdf)  
- Code: [haoyuhan1/RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG)
- [arXiv record（目前 v3）](https://arxiv.org/abs/2502.11371)：版本歷史與全文入口。
- [RAGvsGraphRAG 官方 repository](https://github.com/haoyuhan1/RAGvsGraphRAG)：method scripts、evaluation instructions、dependencies 與 Releases 核對來源。
