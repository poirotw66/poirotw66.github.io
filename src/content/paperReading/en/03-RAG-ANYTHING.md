---
title: "RAG-Anything: All-in-One Multimodal RAG and Dual-Graph Hybrid Retrieval (Detailed Notes)"
description: "Section-by-section breakdown of arXiv:2510.12323: Multimodal Unification, Dual-Graph, Cross-Modal Hybrid Retrieval, DocBench/MMLongBench experiments, and failure cases from the appendix."
pubDate: 2026-03-23
updatedDate: 2026-03-23
tldr:
  - "Section-by-section breakdown of arXiv:2510"
  - "12323: Multimodal Unification, Dual-Graph, Cross-Modal Hybrid Retrieval, DocBench/MMLongBench experiments, and failure cases from the appendix"
audience:
  - "AI/ML practitioners and researchers who want method, evidence, and engineering implications before a full paper read."
  - "Engineers deciding whether a paper’s ideas are worth implementing or citing."
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
    code: "https://github.com/HKUDS/RAG-Anything"
series:
  id: "rag-anything"
  title: "RAG-Anything Deep Dive"
  part: 1
  totalParts: 1
---

The question this paper aims to answer is not "can we build a multimodal RAG?", but rather: **When a knowledge base simultaneously contains text, figures, tables, and equations, where will you structurally fail if you still rely on plain text chunks + vector retrieval?** Guo et al. (University of Hong Kong, arXiv:2510.12323) propose **RAG-Anything**: treating multimodal content as **interconnected knowledge entities**, using a **dual-graph** to preserve cross-modal structures and textual semantics simultaneously, then employing **hybrid retrieval** for structural navigation + semantic matching, and finally **dereferencing** to restore actual images to the VLM during the generation phase.

The following notes are organized in the order of the paper's **§1 Introduction → §2 Framework → §3 Evaluation → Appendix A.5**, and the numbers are drawn directly from the original tables.

---

### §1 Introduction: How is the Problem Defined?

**Core Contradiction (Abstract, §1):** Existing RAG systems almost exclusively handle text-only data, yet real-world documents (academic papers, financial reports, regulations, technical manuals) are **heterogeneous multimodal**. You either discard non-text elements or use OCR to flatten them into plain text—the latter causes the loss of **spatial layout, table rows and columns, and internal entities within charts**.

The authors highlight three typical scenarios (§1):

| Scenario | Key Information Carried by Non-Text |
|------|---------------------|
| Scientific Research | Experimental figures, statistical charts, mechanism diagrams |
| Financial Analysis | Trend charts, correlation matrices, performance tables |
| Medical Literature | Images, diagnostic diagrams, clinical data tables |

**Three Technical Challenges (§1 Technical Challenges):**

1. **Unified multimodal representation** — Preserving modality characteristics and cross-modal relationships.
2. **Structure-aware decomposition** — Parsing complex layouts while retaining hierarchical and spatial relationships.
3. **Cross-modal retrieval** — Enabling queries and evidence to jump across modalities.

**Summary of Contributions (§1 Our Contributions):** dual-graph + cross-modal hybrid retrieval + SOTA performance on DocBench / MMLongBench, with **a particularly obvious advantage in long documents**.

---

### §2.1–2.2 Multimodal Knowledge Unification

**Left side of Figure 1 (§2.2, Figure 1 caption):** A parallel parser (the experiment uses **MinerU**) breaks down PDFs into a structured content list:

- Text: Paragraphs, lists
- Figures: Captions, cross-references
- Tables: Headers, cells
- Equations: LaTeX symbolic representations

Each atomic unit is written as $c_j = (t_j, x_j)$, where $t_j$ is the modality type and $x_j$ is the content; **hierarchical order and context binding** must be preserved (end of §2.2).

> **Reading Anchor:** This step determines the upper bound. No matter how precise the downstream graph is, if the parser is wrong, it’s GIGO (Garbage In, Garbage Out) (Appendix A.5 will verify this again).

---

### §2.2.1 Dual-Graph Construction (Core of the Paper)

The authors argue that a "single unified graph" would overlook modality-specific signals, so they split it into two graphs and then align them:

#### A. Cross-Modal Knowledge Graph

For **non-text** units $c_j$ (figures, tables, equations):

1. Take the local neighborhood $C_j = \{c_k \mid |k-j| \le \delta\}$ (§2.2.1, Eq. context window).
2. Use an MLLM to generate two types of textual representations:
   - **$d_j^{chunk}$**: Detailed description for cross-modal retrieval.
   - **$e_j^{entity}$**: Entity summary (name, type, description) for graph construction.
3. Run extraction $R(\cdot)$ on $d_j^{chunk}$ to get $(V_j, E_j)$ (Eq. 2).
4. Use the **multimodal anchor node** $v_j^{mm}$ as an anchor, and attach child entities with **`belongs_to`** edges (Eq. 3–4).

**The design intent you should remember:** A figure is not just an "attachment URL", but a **first-class node** in the graph, and its sub-entities (axes, legends, panels) can be decomposed.

#### B. Text-based Knowledge Graph

For chunks where $t_j = \text{text}$, it follows **LightRAG / GraphRAG** style NER + relation extraction (§2.2.1 second bullet), which **does not require** a multimodal neighborhood.

#### C. Graph Fusion & Index (§2.2.2)

- **Entity alignment:** Merge $(\tilde V, \tilde E)$ with the text graph using the entity name as the key → unified graph $G=(V,E)$.
- **Dense embeddings:** Build an embedding table $T$ for entities, relations, and chunks (Eq. 5).
- Complete index $I = (G, T)$.

---

### §2.3 Cross-Modal Hybrid Retrieval

**Modality-aware query encoding (§2.3):** If a query contains words like "figure", "chart", "table", or "equation", it acts as a modality preference signal; the query embedding $e_q$ and the index use the same encoder (text-embedding-3-large, §3.1).

**Dual pathways:**

| Pathway | Mechanism | Candidate Set | Excels At |
|------|------|--------|------|
| Structural navigation | Exact match on the graph + k-hop expansion | $C_{stru}(q)$ | Multi-hop, cross-modal chains |
| Semantic matching | Cosine top-k between $e_q$ and $T$ | $C_{seman}(q)$ | Semantically close but no explicit edge |

**Fusion (§2.3):** $C(q) = C_{stru} \cup C_{seman}$, and then integrated via **multi-signal fusion**: graph topological importance, semantic score, and modality preference → $C^\*(q)$.

---

### §2.4 From Retrieval to Synthesis

1. **Textual context:** Concatenate entity summaries, relations, and chunks with modality delimiters (§2.4 (i)).
2. **Visual dereferencing:** Restore the original image set $V^\*(q)$ for visual chunks (§2.4 (ii)).
3. **VLM generation (Eq. 6):** $\text{Response} = \text{VLM}(q, P(q), V^\*(q))$.

**Key point:** The retrieval stage uses textual proxies for embeddings; the generation stage uses **real images** to avoid "guessing the image just by looking at the caption".

---

### §3 Experimental Setup (§3.1)

**Datasets (Table 1, §3.1):**

| Dataset | # Documents | Avg Pages | Avg Tokens | # Questions |
|--------|--------|----------|-------------|--------|
| DocBench | 229 | 66 | 46,377 | 1,102 |
| MMLongBench | 135 | 47.5 | 21,214 | 1,082 |

**Baselines:** GPT-4o-mini long context, LightRAG, MMGraphRAG

**Settings:** Full system backbone = GPT-4o-mini; parser = MinerU; embedding = **text-embedding-3-large (3072d)**; reranker = **bge-reranker-v2-m3**; graph methods entity+relation token limit = **20,000**, chunk limit = **12,000** (§3.1).

---

### §3.2 Main Results: How to Read Table 2–3

#### DocBench (Table 2, §3.2)

| Method | Overall | Mm. (Multimodal questions) | Law | News |
|--------|---------|----------------|-----|------|
| GPT-4o-mini | 51.2 | 49.6 | 61.0 | 43.8 |
| LightRAG | 58.4 | 46.8 | 85.0 | 59.7 |
| MMGraphRAG | 61.0 | 60.5 | 67.6 | 66.0 |
| **RAG-Anything** | **63.4** | **76.3** | **85.0** | 76.3 |

**Interpretation:**

- Ranked first in Overall, but the **76.3% in Mm.** is the true hallmark of a "multimodal framework": it widens the gap by **15.8 pt** compared to MMGraphRAG's 60.5.
- On the plain text subset (Txt.), RAG-Anything scores 46.0, lower than MMGraphRAG's 60.5 — **it doesn't win in all question types**, and the graph overhead might not be worth it for text-only questions.
- It ties with LightRAG at 85.0 on Law / News (News Mm.), showing that domain differences remain large.

#### MMLongBench (Table 3)

| Method | Overall | Res. | Fin. |
|--------|---------|------|------|
| GPT-4o-mini | 35.5 | 44.0 | 33.5 |
| LightRAG | 40.8 | 34.1 | 38.9 |
| MMGraphRAG | 40.8 | 36.5 | 37.7 |
| **RAG-Anything** | **46.6** | **43.5** | **42.8** |

**§3.2 Narrative:** Domains with **information density + long context**, such as Research Reports and Financial Reports, show the largest gains.

#### Length Bucketing (Figure 2, §3.2)

- DocBench **>100 pages:** **68.2% vs 54.6%** (vs MMGraphRAG), a gap of **>13 pt**.
- The paper also reports a similar trend for longer buckets (101–200, 200+ pages) (end of §3.2).

![Figure 2: Document length vs. Accuracy](/paperReading/03-RAG-ANYTHING/image_2.webp)

#### Ablation Study (Table 4, §3.2)

| Variant | DocBench Acc. |
|------|---------------|
| Chunk-only (No dual-graph) | **60.0%** |
| Full RAG-Anything | **63.4%** |

**Conclusion:** Removing the graph structure causes a drop of **3.4 pt** — supporting the value of "structural relationships" rather than just swapping embeddings.

---

### §3.3 Case Studies and Appendix A.5 Failure Modes

**Success Cases (§3.3 + Figure 3–4):**

- **Multi-panel figure:** Baselines confuse the entire figure; RAG-Anything relies on panel boundaries (e.g., sub-figure (a) belongs_to Style Space) to eliminate adjacent interference.
- **Financial table:** Requires `row-of` / `column-of` to locate "2020 Wages = 26,778"; flattening to plain text causes alignment errors.

![Multi-panel figure case (Figure 3 type)](/paperReading/03-RAG-ANYTHING/image_3.webp)

![Financial report table case (Figure 4 type)](/paperReading/03-RAG-ANYTHING/image_4.webp)

**Failure Cases (Appendix A.5):**

| Risk | Phenomenon | Root Cause |
|------|------|------|
| Text-centric bias | A query specifying Figure 3 still retrieves similar **text** | VLM heavily favors text over images during fusion (Figure 7) |
| Parser failure | Irregular tables completely fail | Incorrect nodes/edges → entirely wrong graph (Figure 8) |

![Cross-modal alignment failure (Appendix Figure 7)](/paperReading/03-RAG-ANYTHING/image_7.webp)

![Table parsing failure (Appendix Figure 8)](/paperReading/03-RAG-ANYTHING/image_8.webp)

---

### Engineering Implementation Checklist (§3 + Appendix)

1. **Parser budget ≥ Retrieval tuning budget** — The output quality of MinerU dictates the ceiling.
2. **Index cost** — MLLM descriptions + entity extraction; suitable for low-update, high-value repositories.
3. **Modality routing** — Plain text FAQ-style questions might not need a full dual-graph.
4. **Prompt structuring** — Appendix VLM JSON extraction (detailed_description, entity_name, entity_type, summary) ensures stable graph construction.

---

### Editor's Overall Review

RAG-Anything pushes multimodal RAG from "OCR-ing PDFs into txt" to a **reproducible indexing structure**: the dual-graph explicitly corresponds to the formulas in §2.2.1–2.2.2, and the experiments provide strong evidence in the **Mm. and long document** dimensions (76.3%, 68.2% vs 54.6%). I would still be cautious about two points: (1) The Txt-only subset might not be worth the cost; (2) the failure cases in the Appendix show that **retrieval bias and parsers** are still the dominant factors. If your scenario is "100-page financial reports + chart Q&A", it's worth using this paper as an architectural blueprint for a POC; if it's just short FAQs, you can start with a LightRAG-level text graph first.

---

### Third Pass: Recommended Deep-Dive Checklist

- [ ] Reproduce **Table 4** chunk-only, and measure Δacc on PDFs in your domain.
- [ ] Compare the table F1 of **MinerU vs other parsers** before deciding whether to adopt a cross-modal graph.
- [ ] Read the Appendix on **fusion scoring** weights and the modality cue vocabulary.
- [ ] Estimate the MLLM token / document cost during the index phase vs the QPS during the query phase.

---

### Original Source

- Guo, Ren, Xu, Zhang, Huang. *RAG-ANYTHING: ALL-IN-ONE RAG FRAMEWORK*. arXiv:2510.12323 (2025). [PDF](https://arxiv.org/pdf/2510.12323.pdf)  
- Code: [HKUDS/RAG-Anything](https://github.com/HKUDS/RAG-Anything)
