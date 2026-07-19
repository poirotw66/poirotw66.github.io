---
title: "RAG-Anything：多模態一體化 RAG 與雙圖混合檢索（詳細筆記）"
description: "依 arXiv:2510.12323 逐節解讀：多模態統一、Dual-Graph、Cross-Modal Hybrid Retrieval、DocBench／MMLongBench 實驗與附錄失敗案例。"
pubDate: 2026-03-23
updatedDate: 2026-03-23
tldr:
  - "依 arXiv:2510.12323 逐節解讀：多模態統一、Dual-Graph、Cross-Modal Hybrid Retrieval、DocBench／MMLongBench 實驗與附錄失敗案例"
audience:
  - "想先掌握論文方法、實驗證據與工程啟示，再決定是否深讀的 AI／ML 實作者與研究者。"
  - "評估論文想法是否值得實作或引用的工程師。"
tags: ["論文精讀", "RAG", "多模態", "知識圖譜", "檢索增強生成", "長上下文"]
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
    code: "https://github.com/HKUDS/RAG-Anything"
series:
  id: "rag-anything"
  title: "RAG-Anything 精讀"
  part: 1
  totalParts: 1
---


這篇論文要回答的不是「多模態 RAG 能不能做」，而是：**當知識庫裡同時有正文、圖、表、公式時，你還用純文本 chunk + 向量檢索，會在哪些地方結構性失效？** Guo 等人（香港大學，arXiv:2510.12323）提出 **RAG-Anything**：把多模態內容當成**互聯的知識實體**，用 **dual-graph** 同時保留跨模態結構與文本語意，再用 **hybrid retrieval** 做結構導航 + 語意匹配，最後在生成階段 **dereference** 還原真實圖像給 VLM。

以下筆記依論文 **§1 Introduction → §2 Framework → §3 Evaluation → Appendix A.5** 順序整理，數字均來自原文表格。

---

> **花花的一句話**
>
> 多模態 RAG 的難點不是把所有內容轉成文字，而是在保留版面、圖像與文字關係的同時，讓不同證據能一起被檢索與驗證。

### §1 Introduction：問題怎麼被定義

**核心矛盾（Abstract, §1）：** 現有 RAG 幾乎只處理 text-only，但真實文件（學術、財報、法規、技術手冊）是** heterogeneous multimodal** 的。要嘛丟掉非文本，要嘛 OCR 壓成純文本——後者會丟失**空間佈局、表格行列、圖表內部實體**。

作者舉三類場景（§1）：

| 場景 | 非文本承載的關鍵資訊 |
|------|---------------------|
| 科學研究 | 實驗圖、統計圖、機制示意 |
| 金融分析 | 走勢圖、相關矩陣、績效表 |
| 醫學文獻 | 影像、診斷圖、臨床數據表 |

**三個技術挑戰（§1 Technical Challenges）：**

1. **Unified multimodal representation** — 保留模態特性與跨模態關係  
2. **Structure-aware decomposition** — 解析複雜版面，保留層級與空間關係  
3. **Cross-modal retrieval** — 查詢與證據可跨模態跳轉  

**貢獻摘要（§1 Our Contributions）：** dual-graph + cross-modal hybrid retrieval + 在 DocBench / MMLongBench 上 SOTA 級表現，**長文檔優勢尤其明顯**。

---

### §2.1–2.2 Multimodal Knowledge Unification

**Figure 1 左側（§2.2, Figure 1 caption）：** 並行解析器（實驗用 **MinerU**）把 PDF 拆成結構化內容列表：

- 文本：段落、列表  
- 圖：caption、交叉引用  
- 表：表頭、儲存格  
- 公式：LaTeX 符號表示  

每個原子單元寫成 $c_j = (t_j, x_j)$，$t_j$ 為模態類型，$x_j$ 為內容；**層級順序與上下文綁定**必須保留（§2.2 末段）。

> **閱讀錨點：** 這一步決定上限。後面圖譜再精，parser 錯了就是 GIGO（Appendix A.5 會再驗證）。

---

### §2.2.1 Dual-Graph Construction（論文核心）

作者認為「單一統一圖」會忽略模態特有信號，因此拆成兩張圖再對齊：

#### A. Cross-Modal Knowledge Graph

對**非文本**單元 $c_j$（圖、表、式）：

1. 取局部鄰域 $C_j = \{c_k \mid |k-j| \le \delta\}$（§2.2.1, Eq. 上下文窗口）  
2. 用 MLLM 產生兩種文本表示：  
   - **$d_j^{chunk}$**：詳述描述，供跨模態檢索  
   - **$e_j^{entity}$**：實體摘要（name, type, description），供建圖  
3. 對 $d_j^{chunk}$ 跑抽取 $R(\cdot)$ 得 $(V_j, E_j)$（Eq. 2）  
4. 以 **multimodal anchor node** $v_j^{mm}$ 為錨，子實體用 **`belongs_to`** 邊掛上（Eq. 3–4）

**你要記住的設計意圖：** 圖不是「附件 URL」，而是圖譜裡的**一級節點**，且子實體（軸、圖例、panel）可拆分。

#### B. Text-based Knowledge Graph

對 $t_j = \text{text}$ 的 chunk，沿用 **LightRAG / GraphRAG** 類 NER + 關係抽取（§2.2.1 第二 bullet），**不需**多模態鄰域。

#### C. Graph Fusion & Index（§2.2.2）

- **Entity alignment：** 以實體名為 key 合併 $(\tilde V, \tilde E)$ 與文本圖 → 統一圖 $G=(V,E)$  
- **Dense embeddings：** 對 entities、relations、chunks 建 embedding table $T$（Eq. 5）  
- 完整索引 $I = (G, T)$

---

### §2.3 Cross-Modal Hybrid Retrieval

**Modality-aware query encoding（§2.3）：** 若 query 含 "figure", "chart", "table", "equation" 等詞，作為模態偏好信號；query embedding $e_q$ 與索引用同一 encoder（text-embedding-3-large，§3.1）。

**雙路徑：**

| 路徑 | 機制 | 候選集 | 擅長 |
|------|------|--------|------|
| Structural navigation | 圖上 exact match + k-hop 擴展 | $C_{stru}(q)$ | 多跳、跨模態鏈 |
| Semantic matching | $e_q$ 與 $T$ cosine top-k | $C_{seman}(q)$ | 無顯式邊但語意近 |

**融合（§2.3）：** $C(q) = C_{stru} \cup C_{seman}$，再以 **multi-signal fusion** 綜合：圖拓撲重要性、語意分數、模態偏好 → $C^\*(q)$。

---

### §2.4 From Retrieval to Synthesis

1. **Textual context：** 拼接 entity summary、relation、chunk，帶模態 delimiter（§2.4 (i)）  
2. **Visual dereferencing：** 對視覺 chunk 還原原始圖像集合 $V^\*(q)$（§2.4 (ii)）  
3. **VLM 生成（Eq. 6）：** $\text{Response} = \text{VLM}(q, P(q), V^\*(q))$

**關鍵：** 檢索階段用文本代理 embedding；生成階段用**真圖**，避免「只看 caption 猜圖」。

---

### §3 實驗設定（§3.1）

**資料集（Table 1, §3.1）：**

| 資料集 | 文件數 | 平均頁數 | 平均 tokens | 問題數 |
|--------|--------|----------|-------------|--------|
| DocBench | 229 | 66 | 46,377 | 1,102 |
| MMLongBench | 135 | 47.5 | 21,214 | 1,082 |

**Baselines：** GPT-4o-mini 長上下文、LightRAG、MMGraphRAG  

**設定：** 全系統 backbone = GPT-4o-mini；解析 MinerU；embedding **text-embedding-3-large (3072d)**；reranker **bge-reranker-v2-m3**；圖方法 entity+relation token 上限 **20,000**，chunk **12,000**（§3.1）。

---

### §3.2 主結果：Table 2–3 怎麼讀

#### DocBench（Table 2, §3.2）

| Method | Overall | Mm.（多模態題） | Law | News |
|--------|---------|----------------|-----|------|
| GPT-4o-mini | 51.2 | 49.6 | 61.0 | 43.8 |
| LightRAG | 58.4 | 46.8 | 85.0 | 59.7 |
| MMGraphRAG | 61.0 | 60.5 | 67.6 | 66.0 |
| **RAG-Anything** | **63.4** | **76.3** | **85.0** | 76.3 |

**解讀：**

- Overall 第一，但 **Mm. 76.3%** 才是「多模態框架」的招牌：比 MMGraphRAG 的 60.5 拉開 **15.8 pt**。  
- 純文本子集 Txt. 上 RAG-Anything 46.0，低於 MMGraphRAG 60.5 — **並非所有題型都贏**，圖譜開銷在純文本題可能不划算。  
- Law / News 上與 LightRAG 同分 85.0（News Mm.），顯示領域差異仍大。

#### MMLongBench（Table 3）

| Method | Overall | Res. | Fin. |
|--------|---------|------|------|
| GPT-4o-mini | 35.5 | 44.0 | 33.5 |
| LightRAG | 40.8 | 34.1 | 38.9 |
| MMGraphRAG | 40.8 | 36.5 | 37.7 |
| **RAG-Anything** | **46.6** | **43.5** | **42.8** |

**§3.2 敘述：** Research Reports、Financial Reports 等**資訊密集 + 長上下文**領域增益最大。

#### 長度分桶（Figure 2, §3.2）

- DocBench **>100 頁：** **68.2% vs 54.6%**（vs MMGraphRAG），差距 **>13 pt**  
- 更長桶（101–200、200+ 頁）論文亦報告類似趨勢（§3.2 末段）

![Figure 2：文檔長度 vs 準確率](/paperReading/03-RAG-ANYTHING/image_2.webp)

#### 消融（Table 4, §3.2）

| 變體 | DocBench Acc. |
|------|---------------|
| Chunk-only（無 dual-graph） | **60.0%** |
| Full RAG-Anything | **63.4%** |

**結論：** 去掉圖結構掉 **3.4 pt** — 支持「結構關係」而非單純換 embedding。

---

### §3.3 案例與 Appendix A.5 失敗模式

**成功案例（§3.3 + Figure 3–4）：**

- **Multi-panel figure：** baseline 把整圖混談；RAG-Anything 靠 panel 邊界（如 sub-figure (a) belongs_to Style Space）排除相鄰干擾  
- **Financial table：** 需 `row-of` / `column-of` 定位「2020 Wages = 26,778」；純文本 flatten 會對齊錯誤  

![多面板圖案例（Figure 3 類）](/paperReading/03-RAG-ANYTHING/image_3.webp)

![財報表格案例（Figure 4 類）](/paperReading/03-RAG-ANYTHING/image_4.webp)

**失敗案例（Appendix A.5）：**

| 風險 | 現象 | 根因 |
|------|------|------|
| Text-centric bias | Query 指定 Figure 3 仍撈到相似**文本** | VLM 融合時重文輕圖（Figure 7） |
| Parser failure | 不規則表格全軍覆沒 | 錯誤節點/邊 → 圖譜全錯（Figure 8） |

![跨模態對齊失敗（Appendix Figure 7）](/paperReading/03-RAG-ANYTHING/image_7.webp)

![表格解析失敗（Appendix Figure 8）](/paperReading/03-RAG-ANYTHING/image_8.webp)

---

### 工程落地清單（§3 + Appendix）

1. **Parser 預算 ≥ 檢索調參預算** — MinerU 輸出品質決定天花板  
2. **Index 成本** — MLLM 描述 + 實體抽取；適合低更新、高價值庫  
3. **模態路由** — 純文本 FAQ 型問題未必需要 full dual-graph  
4. **Prompt 結構化** — 附錄 VLM 抽取 JSON（detailed_description, entity_name, entity_type, summary）保證建圖穩定  

---

### 編者總評

RAG-Anything 把多模態 RAG 從「把 PDF OCR 成 txt」推進到**可復現的索引結構**：dual-graph 明確對應 §2.2.1–2.2.2 的公式，實驗在 **Mm. 與長文檔** 維度給出強證據（76.3%、68.2% vs 54.6%）。我仍會警惕兩點：（1）Txt-only 子集未必划算；（2）Appendix 失敗案例說明 **檢索偏置與 parser** 仍是主導因素。若你的場景是「100 頁財報 + 圖表問答」，值得以本文為架構藍本做 POC；若只是短 FAQ，可先從 LightRAG 級文本圖譜起步。

---

### 第三遍：建議深挖清單

- [ ] 重現 **Table 4** chunk-only，在你領域 PDF 上量測 Δacc  
- [ ] 對比 **MinerU vs 其他 parser** 的表格 F1，再決定是否上 cross-modal graph  
- [ ] 讀 Appendix **fusion scoring** 權重與 modality cue 詞表  
- [ ] 估算 index 階段 MLLM token / 文件 vs 查詢階段 QPS  

---

### 原始出處

- Guo, Ren, Xu, Zhang, Huang. *RAG-ANYTHING: ALL-IN-ONE RAG FRAMEWORK*. arXiv:2510.12323 (2025). [PDF](https://arxiv.org/pdf/2510.12323.pdf)  
- Code: [HKUDS/RAG-Anything](https://github.com/HKUDS/RAG-Anything)
