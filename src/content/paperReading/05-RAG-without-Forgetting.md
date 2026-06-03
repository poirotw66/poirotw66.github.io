---
title: "RAG without Forgetting：Evolving Retrieval Memory 詳細筆記"
description: "依 arXiv:2602.05152 解讀 ERM：正確性門控、選擇性歸因、漸進 Key 更新，以及 BEIR／BRIGHT 實證。"
pubDate: 2026-03-23
tags: ["論文精讀", "RAG", "檢索", "Query Expansion", "持續學習", "向量索引"]
image: "/paperReading/05-RAG-without-Forgetting/image_1.webp"
field: "NLP"
difficulty: "intermediate"
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

### 實驗（§experiments, Table 1–2）

**範圍：**

- **BEIR + BRIGHT**，**13 domains**（Abstract）  
- 多 retriever、多 indexing 策略  
- **Table 1：** ERM 一致提升 **nDCG@1**（retrieval）  
- **Table 2：** 端到端 QA（Claude 3.5 Sonnet 生成+評估），ERM-augmented **全面優於** baseline retriever  

**Abstract 強調：** reasoning-intensive 任務增益尤大；**native retrieval speed** — 查詢時不再跑 LLM QE。

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
