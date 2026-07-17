---
title: "RAG without Forgetting：Evolving Retrieval Memory 詳細筆記"
description: "依 arXiv:2602.05152 解讀 ERM：正確性門控、選擇性歸因、漸進 Key 更新，以及 BEIR／BRIGHT 實證。"
pubDate: 2026-03-23
updatedDate: 2026-03-23
tldr:
  - "依 arXiv:2602.05152 解讀 ERM：正確性門控、選擇性歸因、漸進 Key 更新，以及 BEIR／BRIGHT 實證"
audience:
  - "想先掌握論文方法、實驗證據與工程啟示，再決定是否深讀的 AI／ML 實作者與研究者。"
  - "評估論文想法是否值得實作或引用的工程師。"
tags: ["論文精讀", "RAG", "檢索", "Query Expansion", "持續學習", "向量索引"]
image: "/paperReading/05-RAG-without-Forgetting/image_1.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
paper:
  title: "RAG without Forgetting: Continual Query-Infused Key Memory"
  authors:
    - "Yuntong Hu"
    - "Sha Li"
    - "Naren Ramakrishnan"
    - "Liang Zhao"
  year: 2026
  venue: "arXiv 2602.05152"
  links:
    pdf: "https://arxiv.org/pdf/2602.05152.pdf"
series:
  id: "rag-without-forgetting"
  title: "RAG without Forgetting 精讀"
  part: 1
  totalParts: 1
---


**Query Expansion (QE)** 每次推理時改寫查詢、用完就丟；**Key Expansion (KE)** 離線 enrich 文檔 key，卻與線上查詢分布脫節、易漂移。Hu 等人提出 **Evolving Retrieval Memory (ERM)**（arXiv:2602.05152）：在 **正確性門控** 下，把「這次 QE 真正有用的原子信號」**寫回對應 document key**，讓索引**跨查詢累積**，且推理階段 **零額外開銷**。

---

### §1–2 問題形式化（§3 Problem Formulation）

**檢索系統：**

- 語料 $D=\{d_1,\ldots,d_n\}$，每篇文檔有 key $k_i \in K$  
- 相似度 $S: Q \times K \to \mathbb{R}$（如 inner product）  
- Top-N：$R_K(q)$  

**RAG 生成（Eq. 2, §3）：**

$$
Y_K(q) \sim \pi(\cdot \mid q, \{d_i\}_{i \in R_K(q)})
$$

**Query Expansion（§3）：** 擴展器 $\phi$ 產生 $c(q)=\{e_1,\ldots,e_m\}$，$q'=\{q\}\cup c(q)$，**推理後丟棄**。

**ERM 要填的洞（§1–2）：**  
查詢側 adaptation **無狀態**；索引側 persistence **弱監督、易噪音** — 缺少「**哪次成功、該記住什麼**」的 credit assignment。

---

### §4 ERM 三模組（Figure 2）

#### §4.1 Correctness-Gated Feedback Verifier

**統一成功信號（Eq. 4, §4.1）：**

$$
\text{success}(q', K) := \mathbb{1}\big[ V_r(R_K(q')) + V_g(Y_K(q')) \geq 1 \big]
$$

- $V_r$：檢索驗證（recall@K、DPR match 等）  
- $V_g$：生成驗證（ROUGE、task loss、LLM-as-judge）  
- **任一子系統成功** 即可觸發 — 避免只優化 retrieval 或只優化 generation  

**只有 success 的 expansion units 才進入記憶更新**（§4.1 末段）。

#### §4.2 Selective Expansion Attribution

對每個被檢索文檔 $d_i$ 與每個 expansion unit $e_j$，定義**邊際增益**（Eq. 5, §4.2）：

$$
\Delta_{i,j}(q) = \text{sim}(f(q), k_i \oplus f(e_j)) - \text{sim}(f(q), k_i)
$$

- $\oplus$：key 追加 expansion 表示（additive: $k_i + v$）  
- **只把正增益的 $e_j$ 歸因到受益的 $k_i$** — 避免全局污染  

**Query-local softmax 權重（Eq. 6–7, §4.2）：**

$$
w_{i,j}(q) = \text{softmax}_{e_j \in c(q)} \Delta_{i,j}(q), \quad
s_{i,j} \leftarrow s_{i,j} + \sum_{q \in B} w_{i,j}(q)\Delta_{i,j}(q)
$$

跨 batch 累積 relevance score $s_{i,j}$，再驅動 key 更新。

#### §4.3 Progressive Key Evolution

- **Norm-bounded** 更新 — 穩定、不爆炸（§4, Figure 2(c)）  
- **Training-free** — 不動 retriever 權重  
- 理論：**QE 與 KE 在標準相似度下等價**；選擇性更新**可證收斂**（§1 bullet, Abstract）

---

### Figure 1 三欄對照（§1, Figure 1 caption）

| | QE | KE | **ERM** |
|---|----|----|---------|
| 時機 | 推理時 | 離線 | 線上、任務驗證後 |
| 持久性 | 無 | 有但漂移 | **有且選擇性** |
| 推理成本 | 高（每 query 擴展） | 低 | **低（amortized）** |

---

### 實驗（§5, Table 1–2, Figure 3–4）

**設定（§5.1, Appendix B.1）：**

- **BEIR + BRIGHT**，**13 domains**（Abstract；Table 3 統計）  
- Retriever：**BM25**、**BGE-M3**、**BGE-Large/Base**、GTE-Base、MiniLM、Cohere/Voyage API  
- 指標：**nDCG@1**（主）、MRR（次）；生成端 **Claude 3.5 Sonnet** 作 QA 生成+評估（Table 2）

#### Table 1：檢索增益（§5.2, Table 1 敘述）

**整體（§5.2）：** ERM 在**所有 domain 與 retriever** 上一致提升 nDCG。

| Retriever 類型 | 平均 nDCG 提升（論文敘述） | 備註 |
|----------------|---------------------------|------|
| **BM25** | **+46%** | 稀疏檢索受益最大 |
| **Dense**（BGE 等） | **+13–15%** | 仍穩定正向 |

**reasoning-intensive 子集（§5.2 原文列舉）：**

| 資料集 | nDCG 增益區間（論文） |
|--------|----------------------|
| LeetCode | +19–44% |
| Pony | +64–103% |
| AoPS | +115–2200% |
| TheoremQA | +75–378% |

> **錨點：** 表面詞彙重疊低時，ERM 的 key 累積比「每次 LLM QE」更能對齊查詢意圖。

#### Table 2：端到端 QA（§5.2）

| Retriever | 生成品質增益（論文） |
|-----------|---------------------|
| BM25 | **+6%** average |
| Dense | **+2–4%** |

論文解釋：即使 retrieval metric 增益 modest（如 Biology），**generator feedback 仍可驅動 key 更新**，形成更緊的 retrieval–generation loop（§5.2 Downstream generation quality）。

#### Figure 3–4：延遲與 adaptation budget（§5.2–5.3）

| 對照 | ERM | HyDE（QE 代表） |
|------|-----|----------------|
| 延遲 | **150–280 ms / query** | 7–15 s |
| 倍率 | baseline | **50–100× 慢** |

**Figure 4：** adaptation budget 0.3→0.8 時 **nDCG@10 單調上升** — key evolution 累積信號而非 overfit。

#### Label-disjoint 穩健性（§5.2 Analysis）

BRIGHT StackExchange 五個 **label-disjoint** 資料集（跨 query **零 gold 重疊**）上，ERM 仍帶來 **BM25 +6–47%**；dense 維持 baseline **±3%** — 更新不會「污染」無關 query 的 gold doc。

#### §5.3 兩機制 + 風險（Discussion）

1. **Key enrichment** — 成功 retrieve+generate 的 doc，key 對齊成功 query pattern  
2. **Disambiguation** — key 專化後 semantic space 較不擁擠（theorem 等高 lexical overlap 域）  

**論文自承 drawback：** 正回饋可能 **reinforce early retrieval bias**；緩解：增大 adaptation batch、更 patient stopping（§5.3）。

![ERM 流程圖（Figure 1–2）](/paperReading/05-RAG-without-Forgetting/image_1.webp)

---

### 與 Agentic / Iterative RAG 的關係（§2.2）

ERM **不取代** 多步 agentic RAG，而是補 **跨查詢記憶**：

- Agentic：單次 query 內反思、修正  
- ERM：把**已驗證成功**的 expansion pattern **固化到 key**  

若查詢 Zipf 分布明顯（§4 引用 Beitzel et al.），重複 intent 會讓 ERM **越用越準**。

---

### 限制

1. **需要正確性信號** — 無 GT 時靠 LLM-judge，門控品質決定上限  
2. **Key 漂移風險** — 雖有 bounded update，長期仍需版本化與審計  
3. **歸因假設** — additive key 未必適用所有 retriever（需 $\oplus$ 與 $f$ 相容）  

---

### 編者總評

ERM 把「RAG without Forgetting」具體化成 **index-side memory with credit assignment** — 比「再加一層 vector DB」更有原理（QE↔KE 等價 + 收斂）。適合 **高 QPS、重複查詢多** 的企業搜尋；若每次 query 都獨一無二，累積價值有限。

---

### 第三遍

- [ ] 在單域 log 上統計 query 重複率，估 ERM ROI  
- [ ] 對比 **每次 LLM QE** vs ERM 的 **$/query**  
- [ ] 讀 Appendix 收斂證明與 $\oplus$ 實作細節  

---

### 原始出處

- Hu, Li, Ramakrishnan, Zhao. *RAG without Forgetting: Continual Query-Infused Key Memory*. arXiv:2602.05152 (2026). [PDF](https://arxiv.org/pdf/2602.05152.pdf)
