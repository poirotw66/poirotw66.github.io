---
title: "RAG vs GraphRAG：系統性對照與混合策略（詳細筆記）"
description: "依 arXiv:2502.11371 解讀統一評估協議、四類 GraphRAG、Table 1–5 數字、效率 trade-off 與 Selection／Integration 混合策略。"
pubDate: 2026-03-24
tags: ["論文精讀", "RAG", "GraphRAG", "Benchmark", "多跳推理", "混合檢索"]
image: "/paperReading/07-GraphRAG-vs-RAG/image_3.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
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
    code: "https://github.com/haoyuhan1/RAGvsGraphRAG"
series:
  id: "graphrag-vs-rag"
  title: "GraphRAG vs RAG 精讀"
  part: 1
  totalParts: 1
---

GraphRAG 在文本任務上報告了多跳推理、全局摘要等優勢，但各系統 **graph 建法、檢索模式、評估協議** 各異，難以回答：**什麼時候該用 RAG、什麼時候該上 GraphRAG？** Han 等人（Michigan State / Meta / IBM 等，arXiv:2502.11371）在 **統一前處理、檢索預算、生成腳本** 下，對 **QA 與 query-based summarization** 做 controlled benchmark，並提出 **Selection / Integration** 混合策略。

以下依 **§3 Evaluation Framework → §4 QA → §4.6 Efficiency → §5 Summarization → §5.3 Position bias** 整理；主表數字以 **Llama-3.1-8B-Instruct** 為準（論文 §4.2）。

---

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

### 原始出處

- Han et al. *RAG vs. GraphRAG: A Systematic Evaluation and Key Insights*. arXiv:2502.11371 (2025). [PDF](https://arxiv.org/pdf/2502.11371.pdf)  
- Code: [haoyuhan1/RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG)
