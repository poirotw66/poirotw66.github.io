---
title: "Beyond RAG for Agent Memory：xMemory 詳細筆記"
description: "依 arXiv:2602.02007 解讀 xMemory 四層階層、sparsity–semantics 目標、兩階段 top-down 檢索，以及 LoCoMo／PerLTQA 實證。"
pubDate: 2026-03-24
updatedDate: 2026-08-09
tldr:
  - "依 arXiv:2602.02007 解讀 xMemory 四層階層、sparsity–semantics 目標、兩階段 top-down 檢索，以及 LoCoMo／PerLTQA 實證"
audience:
  - "想先掌握論文方法、實驗證據與工程啟示，再決定是否深讀的 AI／ML 實作者與研究者。"
  - "評估論文想法是否值得實作或引用的工程師。"
tags: ["論文精讀", "RAG", "Agent Memory", "長期記憶", "對話系統", "xMemory"]
image: "/paperReading/06-Beyond-RAG-for-Agent/image_1.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
paper:
  title: "Beyond RAG for Agent Memory: Retrieval by Decoupling and Aggregation"
  authors:
    - "Zhanghao Hu"
    - "Qinglin Zhu"
    - "Hanqi Yan"
    - "Yulan He"
    - "Lin Gui"
  year: 2026
  venue: "arXiv 2602.02007"
  links:
    pdf: "https://arxiv.org/pdf/2602.02007.pdf"
    arxiv: "https://arxiv.org/abs/2602.02007"
    code: "https://github.com/HU-xiaobai/xMemory"
    project: "https://zhanghao-xmemory.github.io/Academic-project-page-template/"
series:
  id: "beyond-rag-agent-memory"
  title: "Beyond RAG for Agent Memory 精讀"
  part: 1
  totalParts: 1
---


Agent memory 系統大多沿用標準 RAG：**embed → top-k 相似度 → 拼接 context → 生成**。Hu 等人（King's College London / Alan Turing Institute，arXiv:2602.02007）指出這在 **Agent memory 設定下假設錯位**：RAG 面對的是**大型、異質、多樣**語料；Agent memory 卻是**有界、連貫、高度相關且常近重複**的對話流。固定 top-k 會 **collapse 到同一密集區域**，回傳冗餘證據；事後 pruning 又可能刪掉 **時序相連的前置條件**（共指、省略、時間線依賴）。

他們提出 **xMemory**：**decoupling → aggregation** 建四層階層，用 **sparsity–semantics objective** 引導 split/merge，推理時 **top-down 檢索**，只在降低 reader uncertainty 時才展開到 episode / raw message。

以下依 **§1 Introduction → §3 Method → §4 Experiments → Appendix 消融** 整理，數字來自 Table 1–3、Figure 3–5。

---

> **花花的一句話**
>
> Agent 記憶不能只靠相似度撈回舊片段；它需要分層整理經驗，才能在長任務中同時保留細節與全局脈絡。

### §1 Introduction：RAG 假設為何失效

**兩種設定對照（§1, Figure 1）：**

| 維度 | 標準 RAG | Agent memory |
|------|----------|--------------|
| 語料 | 大型、異質 | 有界、單一對話流 |
| 候選 span | 多樣 | 高度相關、近重複 |
| 主要失敗 | 不相關 | **冗餘 collapse** |
| 證據結構 | 段落獨立 | **時序糾纏** |

**Figure 1 訊息：** 相似度 top-k 在 agent memory 上會撈到一堆「很像但沒新增資訊」的 chunk；xMemory 改在**語意元件（component）層級**選證據，從結構上避免冗餘。

**核心論點（§1 末段）：** 檢索不應只是 span matching，而應 **surface latent components** —— 兩個 embedding 很接近的 span，若被分到不同 component，就不該一起被檢索。

---

### §3.1 問題形式化

給定歷史 $H$ 與查詢 $q$，目標是在 budget 內建 context $C$，最大化答案品質且保留證據結構。與 RAG 不同，證據來源是 **bounded coherent stream**，候選常為 near duplicates，關鍵事實常依賴相鄰 turn。

---

### §3.2 四層階層與 Sparsity–Semantics 目標（Figure 2）

**四層（§3.2, Figure 2）：**

```
Original messages → Episode → Semantic → Theme
```

| 層級 | 定義 | 映射規則 |
|------|------|----------|
| **Message** | 原始對話 | 1 block → 1 episode |
| **Episode** | 連續 message block 摘要 | 1 episode → 多個 semantic |
| **Semantic** | 可重用長期事實 | **每 semantic 恰屬 1 theme** |
| **Theme** | 高階主題聚合 | 1 theme → 多 semantic |

**LoCoMo 規模（Figure 2 caption）：** 約 **650 themes、2900 semantics、750 episodes**。

**Guidance objective（Eq. 1–3, §3.2）：**

$$
f(P) = \text{SparsityScore}(P) + \text{SemScore}(P)
$$

- **SparsityScore（Eq. 2）：** 獎勵 theme 大小均衡，避免某 theme 過大 → 候選集爆炸 → 檢索 collapse  
- **SemScore（Eq. 3）：** 懲罰 theme centroid 過近（冗餘）或過遠（**semantic islands**）  
- **Split / Merge：** theme 過擠 → 聚類候選 split 取 max $f(P)$；過小 theme → merge 鄰近 theme  

**kNN graph：** theme 與 semantic 節點維護 top-k 相似邊，供高效遍歷（§3.2 末）。

---

### §3.3 兩階段 Adaptive Retrieval

#### Stage I：Query-aware representative selection（Eq. 4）

在 kNN 圖上 **greedy 選代表節點**，平衡 **coverage** 與 **query relevance**：

$$
i^\* = \arg\max_{i \in V \setminus R} \; \alpha \cdot \frac{\sum_{u \in \Delta(i;R)} w_{iu}}{Z} + (1-\alpha) \cdot \tilde{s}(q, i)
$$

- 先選 **themes**，再選 induced **semantics**  
- 支援 **set-level evidence**（多 fact 分散在不同 semantic）與 **multi-hop**（需多個連接 semantic）

#### Stage II：Uncertainty adaptive evidence inclusion

- 從選中 semantics 收集 linked **episodes**（**intact units**，不內部 pruning）  
- 僅當 episode **足夠降低 reader predictive uncertainty** 才納入  
- 可選展開到 original messages；**early stopping** 當額外 episode 不再提升 certainty  

**與 RAG pruning 的差異（§2, §4.2）：** LightMem 等用 LLMLingua-2 類 RAG 假設 pruning —— 在對話流上可能 **fragment evidence chains**；xMemory **不在 evidence unit 內部刪字**。

---

### §4.1 實驗設定

**資料集：**

| 資料集 | 特點 | QA 類別 |
|--------|------|---------|
| **LoCoMo** | 50 對話，平均 ~9K tokens、~300 turns（最多 35 sessions） | single-hop, multi-hop, **temporal**, open-domain |
| **PerLTQA** | 個人終身記憶（profile、關係、事件） | 句子級答案 |

**Backbone：** Qwen3-8B、Llama-3.1-8B-Instruct、GPT-5 nano  

**Baselines（§4.1）：** Naive RAG（top-20 chunks）、A-Mem、MemoryOS、LightMem、Nemori  

**Embedding：** text-embedding-3-small；greedy decoding (T=0)  

**指標：** BLEU-1、token F1；PerLTQA 加 ROUGE-L；**Token/query**（越低越好）

---

### §4.2 主結果：Table 1 LoCoMo

**Qwen3-8B（Table 1 節選）：**

| Method | Avg F1 | Avg BLEU | Token/query |
|--------|--------|----------|-------------|
| Naive RAG | 40.45 | 28.51 | 7754.66 |
| Nemori | 40.45 | 28.51 | — |
| LightMem | 30.28 | 23.77 | 5545.35 |
| A-Mem | 21.78 | 19.49 | **9103.46** |
| MemoryOS | 33.76 | 29.20 | 7234.66 |
| **xMemory** | **43.98** | **34.48** | **4711.29** |

**重點解讀：**

- **Temporal**（長程推理）：xMemory F1 **37.46** vs Nemori **33.74**；BLEU **29.58** vs **23.60**  
- **Multi-hop**：xMemory F1 **20.69** vs Naive RAG **17.01**  
- **Token 效率**：4711 vs A-Mem 9103 — **準確率最高且 token 近乎減半**

**GPT-5 nano：** xMemory avg F1 **50.00** vs Nemori **48.17**；token **6581** vs **9155**

**Llama-3.1-8B：** xMemory avg F1 **34.77**、BLEU **24.73**、token **5539.97** — 三個 backbone **皆為最佳 average**

---

### §4.2 主結果：Table 2 PerLTQA

**Qwen3-8B：**

| Method | BLEU | F1 | ROUGE-L | Token/query |
|--------|------|-----|---------|-------------|
| Naive RAG | 32.08 | 41.37 | 35.95 | 6274.38 |
| MemoryOS | 35.14 | 42.35 | 38.48 | 6499.47 |
| **xMemory** | **36.24** | **47.08** | **42.50** | **5087.18** |

**Llama-3.1-8B：** xMemory F1 **52.37** vs LightMem **35.93**（LightMem 因 RAG 式 pruning 在 PerLTQA 崩到 BLEU **23.47**）

**GPT-5 nano：** xMemory F1 **46.23**、ROUGE-L **41.25**

> **錨點：** 原則可 **遷移到個人終身記憶**，不只 LoCoMo 對話 recall。

---

### §4.3 消融與分析（Figure 3–5, Table 3–4）

**Figure 3 五設定（LoCoMo, Qwen3-8B）：**

1. Naive RAG — raw message chunks top-k  
2. Memory-only — 只用階層、無 adaptive retrieval  
3. w/o Stage II — 無 uncertainty inclusion  
4. w/o split/merge — 凍結結構  
5. **Full xMemory**

**Figure 4 Evidence hit distribution：** xMemory 更多 **multi-hit** 區塊（同一問題需多個語意元件）；pruning baseline 偏向 1-hit — 暗示 **coverage 不足**

**Figure 5 Structural plasticity：** 禁用 split+merge → downstream QA 下降 — **retroactive restructuring** 必要

**Table 3 Performance vs coverage efficiency：** xMemory 在 **較少 token** 下達 **更高 evidence coverage**

---

### 與相關工作的定位（§2）

| 路線 | 代表 | xMemory 差異 |
|------|------|--------------|
| Flat context | MemGPT, MemoryOS | 仍常 raw log → 冗餘累積 |
| Structured | MemoryBank, Zep, A-Mem | 多仍 raw text 為檢索單元；query 時跨層大規模展開 |
| RAG pruning | LightMem + LLMLingua-2 | RAG 假設「段落多樣」；對話流上 brittle |

xMemory 在 **construction 階段** 就優化結構（sparsity–semantics），而非事後壓 context。

---

### 限制與編者判斷

1. **Construction 成本** — split/merge + kNN 維護；論文未與 MemGPT paging 做延遲對照  
2. **Uncertainty 代理** — GPT-5 nano 用 GPT-4.1-mini 估 entropy（§4.1）  
3. **Theme cap** — max semantic per theme = 12（§4.1 footnote），超參敏感（Table 8 Appendix）  
4. **Benchmark 侷限** — LoCoMo / PerLTQA 仍為學術對話；工具型 agent 的 memory 分布可能不同  

**總評：** 這篇把「Agent memory ≠ RAG」講成可操作的 **階層 + 元件級檢索**；Table 1 的 temporal / multi-hop 增益 + token 減半，是 PRD-002 要的 **可對照原文數字**。若你在做 personal assistant memory，應先問：**top-k chunk 是否常回傳同一段對話的變體？** 若是，xMemory 的 theme/semantic 分層比再加 embedding 維度更值得試。

---

### 第三遍延伸

- [ ] 重現 **Figure 3** 五設定，在你對話 log 上量測 avg F1 vs token  
- [ ] 讀 Appendix **Eq. (1) Fano 型 lower bound** 與 theme size cap 掃描（Table 8）  
- [ ] 對比 **A-Mem schema 失敗率** vs xMemory 結構穩定性  

---

## 證據地圖：論文結果與工程推論的分界

- **論文直接支持的證據**：Section 3.2 的四層結構與 Eq. (1)–(4)；Table 1–2 的 LoCoMo／PerLTQA 分數與 token/query；Figure 3–5、Appendix A 的消融、evidence density 與 retroactive restructuring。它們只支持在這兩個 benchmark、指定 backbone 與設定下，xMemory 的答案分數與 inference token 效率較好。
- **作者主張**：先解耦再聚合比 flat top-$k$ 或 generic pruning 更能避免 redundant collapse，且 intact episode 可保留 temporal prerequisite。
- **證據沒有建立的事**：沒有 live agent、跨語言或 adversarial subset（Section 4.1 排除該 LoCoMo subset）、隱私／刪除、concurrent writes、embedding drift、長期更新成本或 production SLO 結果。Table 1 token/query 也不是 hierarchy construction、LLM summary、storage、index update 與 observability 的總成本。
- **Bloss0m 工程判斷**：這是適合以可回放對話資料檢驗的 retrieval design，不是所有 agent 都該換成 hierarchical memory 的證明。先量測目標工作負載是否真的有 temporal/multi-hop evidence chain 與 top-$k$ redundancy。

## Artifact 與可重現狀態（核對日期：2026-08-09）

[arXiv record](https://arxiv.org/abs/2602.02007) 的 PDF／HTML／TeX 為 **可存取（usable for reading）**；上述數字仍採本文原有的 v1 anchors。record 現連到官方 [xMemory repository](https://github.com/HU-xiaobai/xMemory)，有 MIT license、environment.yml、LoCoMo construction／retrieval／evaluation 指令與 upstream dataset links，故 code 為 **可存取（usable）**；README 說明主要是 A100 80G 的 Llama path，並非每個 backbone 的一鍵重現。

repo 的 GitHub Releases 在此日期為 **空白（empty）**。README 雖稱 LoCoMo Llama memory 在 release 提供，direct endpoint 沒有檔案；memory snapshot/checkpoint 是 **僅宣布、實際缺失（announced, unavailable）**。LoCoMo／PerLTQA 是上游資料 endpoint，不是完整 author benchmark bundle；GPT-5 nano/Qwen3 設定、prompt、entropy decision、config、seed、baseline revision 與 raw result log 仍為 **missing**。能重跑一條 Llama pipeline，不等於重現 Table 1–2 每一列。

## 工程採用與不適用條件

| 情境 | 建議 | 原因 |
| --- | --- | --- |
| 多 session 對話，常見 temporal／multi-hop，且 top-$k$ 重複率可量測 | 以 frozen log 做 xMemory shadow replay | 最接近 Figure 1、Table 1 與 Figure 4 的設定；先比較答案、coverage 與總成本。 |
| 有 versioned memory store、episode provenance、可重建 index 與 rollback | 可做小流量 canary | Figure 5 的 split/merge 會 retroactive reassignment，需可追溯結構。 |
| 一次性 FAQ、短文件、主要是 single-hop detail lookup | **不要使用**完整 hierarchy | construction、summary、graph maintenance 可能多於收益；先用 simple RAG + reranker。 |
| 敏感對話、刪除義務、非可信 tool output 或高併發 writes | **不要直接部署**mutable memory | 論文沒有 deletion、access control、poisoning、write-conflict、serving consistency 證據。 |
| 無 GPU/model access 或 release snapshot | 僅作設計參考 | code 可讀，但 advertised release artifact 是 empty，paper-wide settings 也不完整。 |

### 原始出處

- Hu, Zhu, Yan, He, Gui. *Beyond RAG for Agent Memory: Retrieval by Decoupling and Aggregation*. arXiv:2602.02007 (2026). [PDF](https://arxiv.org/pdf/2602.02007.pdf)
- [arXiv record（目前 v4）](https://arxiv.org/abs/2602.02007)：版本、官方 project/code pointer 與 artifact 核對來源。
- [HU-xiaobai/xMemory 官方 repository](https://github.com/HU-xiaobai/xMemory)：environment、Llama pipeline、dataset link 與 Releases 核對來源。
