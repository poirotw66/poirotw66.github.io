---
title: "RAG vs GraphRAG: A Systematic Evaluation and Hybrid Strategies (Detailed Notes)"
description: "Interpreting the unified evaluation protocol, four types of GraphRAG, figures in Tables 1-5, efficiency trade-offs, and Selection/Integration hybrid strategies based on arXiv:2502.11371."
pubDate: 2026-03-24
updatedDate: 2026-08-24
tldr:
  - "Interpreting the unified evaluation protocol, four types of GraphRAG, figures in Tables 1-5, efficiency trade-offs, and Selection/Integration hybrid strategies based on arXiv:2502"
audience:
  - "AI/ML practitioners and researchers who want method, evidence, and engineering implications before a full paper read."
  - "Engineers deciding whether a paper’s ideas are worth implementing or citing."
tags: ["Paper Reading", "RAG", "GraphRAG", "Benchmark", "Multi-hop Reasoning", "Hybrid Retrieval"]
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
  title: "GraphRAG vs RAG Deep Dive"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** GraphRAG systems change graph construction, retrieval, context budget, and generation at once, so individual papers do not answer when graph cost is worthwhile.
- **Core insight:** under unified preprocessing, retrieval budgets, and generation scripts, the paper separates RAG from KG-based, community-based, text-centric, and hierarchical GraphRAG, then proposes Selection/Integration hybrids.
- **Strongest evidence:** QA and query-based-summarization comparisons in Tables 1–5 and Sections 4–5 show that benefits vary by query type, global context, and graph-building cost.
- **Main boundary:** tested systems, corpora, Llama-3.1-8B-Instruct, and fixed budgets limit transfer; a benchmark win is not ROI for your documents or SLA.

## Why the previous approach is insufficient

“GraphRAG” hides different control points—KG triplets, community reports, text graphs, and hierarchies. Different preprocessing and token budgets can also make pipeline differences look like graph benefit. The paper aligns settings before asking Selection (which retriever) and Integration (how to combine evidence) questions (Section 3; Table 1).

## Core intuition and method

Flat RAG is often effective for direct local chunks. Graph structure can help when a query needs entity relationships, multi-hop evidence, or global aggregation, at the cost of construction, retrieval, summaries, and context. The useful question is therefore which evidence topology the query needs, decided with quality, latency, and cost together (Figure 1; Section 3.2).

![RAG vs GraphRAG Figure 3(a): QA performance of four retrieval strategies in the Llama 3.1 8B setting.](/paperReading/07-GraphRAG-vs-RAG/image_3.webp)

*Figure 3(a), the paper's Section 4.4 QA comparison: RAG, GraphRAG, Selection, and Integration differ across NQ, HotpotQA, MultiHop-RAG, and NovelQA, bringing the “is graph worth it?” question back to query type and evidence topology. See the [original Figure 3 anchor](https://arxiv.org/html/2502.11371v1#S4.F3) and [Figure 3(a) source endpoint](https://arxiv.org/html/2502.11371v1/qa_improvement_8B.svg). The arXiv source states a perpetual non-exclusive license; this article preserves attribution and follows the [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

## Worked example: selecting an evidence topology

For “which division owns service X after last year's acquisition?”, flat RAG may retrieve the acquisition story and service page without linking the chain. Graph-guided retrieval can expand entities/paths and retrieve supporting relations. For “what is service X's price?”, the graph may only add latency. Selection chooses a query path; Integration combines chunk and graph evidence. This is a teaching example, not a benchmark item.

## How to read the evidence

**Section 3 / Table 1** distinguishes GraphRAG types. **The QA tables in Section 4** hold preprocessing, budget, and generation fixed and ask which query types change; a multi-hop or global-query benefit is not a reason to build graphs for all single-hop NQ questions. **Section 4.6 and Section 5.3** restore efficiency and position bias: a higher score that needs more context or costly community summaries needs separate SLA accounting. This is controlled benchmark evidence, not a production cost study.

## Artifacts and engineering decision

As of **2026-08-09**, the [official RAGvsGraphRAG repository](https://github.com/haoyuhan1/RAGvsGraphRAG) is reachable. Reproduction still needs a pinned clone, data-license, model/API, and GraphRAG-dependency check. Start a hybrid canary using query taxonomy and measure quality with p95 latency and index cost. Do not replace established RAG merely for a benchmark score when relationships are not material or incremental graph construction is unavailable.

## Three things to remember

1. GraphRAG names a family of designs, not one baseline.
2. Relational, multi-hop, and global structure can benefit; direct local questions may not repay graph cost.
3. Validate hybrid selection with query slices, incremental construction, and end-to-end SLA—not an average score.

GraphRAG has reported advantages in text tasks such as multi-hop reasoning and global summarization, but different systems vary in **graph construction methods, retrieval modes, and evaluation protocols**, making it difficult to answer: **when should we use RAG, and when should we use GraphRAG?** Han et al. (Michigan State / Meta / IBM, etc., arXiv:2502.11371) conducted a controlled benchmark on **QA and query-based summarization** under **unified preprocessing, retrieval budgets, and generation scripts**, and proposed **Selection / Integration** hybrid strategies.

The following is organized based on **§3 Evaluation Framework → §4 QA → §4.6 Efficiency → §5 Summarization → §5.3 Position bias**; main table figures are based on **Llama-3.1-8B-Instruct** (paper §4.2).

---

> **Huahua in one sentence**
>
> Neither RAG nor GraphRAG is universally better; choose by whether questions need relationships, multi-hop reasoning, or global context, then evaluate quality gains alongside latency and cost.

### §3 Unified Evaluation Framework

**Design Principles (§3):**

1. **Decoupling retrieval and generation** — Save retrieval results from each method first, then use the same generation script
2. **Budget alignment** — Keep settings as identical as possible; otherwise match key budgets
3. **Open-source implementation** — [github.com/haoyuhan1/RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG)

#### §3.1 RAG Pipeline

Standard dense retrieval: chunk → embed → query cosine → top-k chunks.

#### §3.2 Four Types of GraphRAG (§3.2)

| Category | Representative Implementation | Retrieval Unit | Characteristics |
|------|----------|----------|------|
| **KG-based** | LlamaIndex KG-GraphRAG [24] | entity multi-hop triplets (± original text) | Triplets only vs Triplets+Text |
| **Community-based** | Microsoft GraphRAG [5] | **Local**: entity neighborhood + low-level community report; **Global**: high-level community summary | global leans towards corpus-level |
| **Text-centric graph-guided** | HippoRAG2 [10] | **Still primarily text chunks**; graph-guided scoring/traversal | chunk is the primary target |
| **Hierarchical summary** | RAPTOR [32] | Recursive clustering + multi-layer summary | No explicit KG |

#### §3.3 Tasks and Data (§3.3, §4.1)

**QA:**

| Dataset | Type | Metrics |
|--------|------|------|
| **NQ** | single-hop | P, R, F1 |
| **HotPotQA** | multi-hop | P, R, F1 |
| **MultiHop-RAG** | Four categories: Inference, Comparison, Temporal, **Null** | Accuracy |
| **NovelQA** | 21 fine-grained query types | Accuracy |

**Summarization:** SQuALITY, QMSum (single-document); ODSum-story, ODSum-meeting (multi-document); ROUGE-2 + BERTScore.

---

### §4.2 Main QA Results

#### Table 1: NQ (single-hop) and HotPotQA (multi-hop) F1 (%)

| Method | NQ F1 | HotPot F1 |
|--------|-------|-----------|
| **RAG** | **64.78** | 60.04 |
| RaptorRAG | 60.04 | 61.31 |
| KG-GraphRAG (Triplets only) | 34.28 | 25.02 |
| KG-GraphRAG (Triplets+Text) | 50.27 | 42.60 |
| Community-GraphRAG (Local) | 63.01 | 61.66 |
| Community-GraphRAG (Global) | 54.48 | 45.16 |
| **HippoRAG2** | 61.03 | **63.01** |

**Observation (1) (§4.2):** **RAG is strongest on single-hop NQ** (F1 64.78); on HotPotQA, **HippoRAG2 ties with RAG at 63.01**, outperforming Community-Global (45.16).

**Observation (4) KG Coverage (Appendix C):** Only **~65.8%** of answer entities in HotPotQA appear in the constructed KG; NQ is **~65.5%** — explaining why KG-GraphRAG (Triplets only) scores only **34.28 F1** on NQ.

#### Table 2: MultiHop-RAG Overall Accuracy (%)

| Method | Inference | Comparison | Null | Temporal | **Overall** |
|--------|-----------|------------|------|----------|-------------|
| RAG | 92.16 | 57.59 | **96.01** | 30.70 | 67.02 |
| RaptorRAG | 91.91 | 55.26 | 90.03 | 45.28 | 68.78 |
| KG (Triplets) | 55.76 | 22.55 | 98.67 | 18.70 | 41.24 |
| KG (Triplets+Text) | 67.40 | 34.70 | 97.34 | 17.15 | 48.51 |
| Community (Local) | 86.89 | 60.63 | 80.07 | 50.60 | 69.01 |
| Community (Global) | 89.34 | 64.02 | **19.27** | **53.34** | 64.40 |
| **HippoRAG2** | 91.54 | 58.41 | 85.71 | 49.91 | **70.27** |

**How to read:**

- **Highest Overall: HippoRAG2 70.27** — graph-guided chunk leads the comprehensive multi-hop leaderboard
- **Null for Community-Global is only 19.27%** — prone to hallucination when it should answer "insufficient information" (§4.2 Observation 3)
- **Temporal: Global 53.34 > Local 50.60 > RAG 30.70** — summary-level retrieval has an advantage when a global timeline is needed
- **Inference / Null: RAG 92.16 / 96.01 remains strong** — single-hop facts + refusal to answer

#### Table 3: NovelQA Subsets (§4.2, Table 3 excerpt avg %)

| Subset | RAG avg | HippoRAG2 avg | Interpretation |
|------|---------|---------------|------|
| **sh** (single-hop) | **68.73** | — | RAG leads |
| **mh** (multi-hop) | 57.12 | — | Graph methods are more competitive in mh |
| **dtl** (detail-oriented) | 55.28 | — | RAG excels at detail questions |

(For all 21 types, see Appendix B.)

---

### §4.3 Reranking and IRCoT (Figure 1)

**Figure 1:** On NQ and MultiHop-RAG, **rerank / IRCoT generally improves** all methods, but **the conclusions remain unchanged**:

- NQ: **RAG is still best** on single-hop
- MultiHop-RAG: **GraphRAG methods typically outperform RAG** under enhanced reasoning
- Exception: Community-Local + IRCoT remains very poor on **NULL** queries

> **Anchor Point:** Inference-time enhancements (reranking, iterations) offer **orthogonal gains** and cannot replace architecture selection.

---

### §4.5–4.7 Hybrid Strategies and Graph Quality

#### Selection (§Appendix G)

Use LLM to **classify query**: Fact-based → RAG; Reasoning-based → GraphRAG (Figure 7 prompt).

#### Integration (§Appendix H, Table 20–24)

**Concatenate** retrieval results from RAG and GraphRAG before generation — **improves in most settings**; exception: **Llama-3.1-8B + MultiHop-RAG** sees a **sharp drop in Null accuracy** after integration (context is too long, 8B is prone to incorrect answers).

#### Table 5: Impact of Graph construction model (MultiHop-RAG, Llama-3.1-70B)

| Construction LLM | Inference | Comparison | Temporal | **Overall** |
|------------------|-----------|------------|----------|-------------|
| None (RAG) | 94.85 | 56.31 | 25.73 | 65.77 |
| GPT-4o-mini | 92.03 | 60.16 | 49.06 | 71.17 |
| **GPT-4o** | 93.63 | **66.59** | **58.49** | **75.08** |

**Temporal 25.73 → 58.49** — The upper limit of GraphRAG heavily depends on the **capabilities of the graph construction LLM**; a stronger model also means **higher construction costs**.

---

### §4.6 Efficiency: Table 4 (MultiHop-RAG)

| Method | Construction (s) | Retrieval (s) | Storage |
|--------|------------------|---------------|---------|
| **RAG** | **135** | 1724 | 127MB |
| KG-GraphRAG | 7702 | **14434** | **117MB** |
| Community-GraphRAG | 5560 | **1249** | **165MB** |

**Interpretation (§4.6):**

- Graph **construction time >> RAG** (55–57×)
- **KG retrieval is the slowest** (LLM entity expansion + multi-step traversal)
- **Community retrieval can be faster than RAG** (community-level matching)
- **Community requires the largest storage** (communities + summaries)

GraphRAG **is not a free lunch** — selection requires simultaneously considering **construction $, retrieval latency, and storage**.

---

### §5 Query-Based Summarization

#### §5.2 Main Findings (Tables 6–7, §5.2)

1. **RAG / RaptorRAG / HippoRAG2** are typically better in query-based summarization — because they retrieve **raw chunks**, which are closer to human references
2. **KG-GraphRAG: Triplets+Text > Triplets only** — details come from the original text
3. **Community: Local > Global** — Global only has high-level summaries and lacks query-specific details
4. **Integration often ≈ RAG alone** — simply concatenating evidence from both paths **does not necessarily** improve ROUGE/BERTScore alignment

#### §5.3 Position Bias of LLM-as-a-Judge (Figure 4)

**Differences from Edge et al. [5] (§5.3):**

| Dimension | Edge GraphRAG Paper | This Paper |
|------|-------------------|------|
| Task | **Global** summarization | **Query-specific** roles/events |
| Evaluation | LLM-as-Judge, no GT | ROUGE + BERTScore vs Human |

**Figure 4:** Evaluating Comprehensiveness / Diversity using an LLM, **changing the presentation order of RAG vs GraphRAG summaries (O1/O2)** → leads to a drastic reversal in win rates:

- **Comprehensiveness:** O1 favors RAG; O2 favors GraphRAG (Local)
- **Diversity:** Global GraphRAG is more preferred in O2

> **Anchor Point:** "GraphRAG generates better summaries" might be an **evaluation protocol artifact**; benchmark papers must report **position effects**.

---

### §4.4 Failure Mode Cases (Appendix D, Figures 5–6)

- **Case 1 (HotPotQA):** RAG fails to retrieve the key bridge entity → Incorrect; Community-Global covers the necessary context using the **community summary** → Correct
- **Case 2:** RAG retrieves the precise span → Correct; Graph wanders into the wrong community → Incorrect

→ **There is no universal winner**, requiring **query-type routing**.

---

### Decision Tree (Compiled by Editor)

```
Query Type?
├─ Single-hop / detail / Null-abstain → Prioritize RAG (Table 1 NQ, Table 2 Null 96%)
├─ Multi-hop / Temporal / Comparison → Prioritize HippoRAG2 or Community-Local (Table 2 Overall 70.27)
├─ Corpus-level global summary → Community-Global + note judge position bias
└─ Limited budget → Avoid full KG construction; consider Selection routing
```

**Integration:** 70B or long contexts can try concatenation; for 8B on MultiHop-RAG, **beware of Null degradation**.

---

### Limitations

1. **Llama-3.1 is the backbone for main tables** — 70B results are in the Appendix, showing consistent trends but different magnitudes
2. **Graph construction is fixed once** — incremental updates were not tested
3. **Only some of the 21 NovelQA types are in the main text** — fine-grained details require reading the Appendix
4. **Summarization Integration yields limited benefits** — unlike QA, hybrid strategies cannot be directly copy-pasted

---

### Editor's Overall Review

This is one of the few **truly controlled** comparisons of **"RAG vs GraphRAG"**: Tables 1–2 provide citable **F1 / Accuracy figures**, while Tables 4–5 supplement **costs and graph construction quality**. In practice, the most valuable conclusion is **complementarity + Selection/Integration**, rather than "switching completely to GraphRAG". If your product only handles single-hop FAQs, GraphRAG might be **expensive with no gain**; for HotPotQA-style multi-hop + long corpus summaries, HippoRAG2 / Community-Local are worth a POC — but please measure using a **token budget consistent with this paper**.

---

### Third Pass Extensions

- [ ] Clone [RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG) and rerun Table 4 latency on your corpus
- [ ] Implement a **Selection router** and measure routing accuracy using the four MultiHop-RAG categories
- [ ] Summarization evaluation: **fix O1/O2 dual-order** LLM-judges to avoid position confounds
- [ ] Read Appendix **Table 16 retrieval accuracy** to compare with end-to-end QA

---

## Evidence Map: A Benchmark Result Is Not a Product Law

- **Paper directly supports:** the unified preprocessing/retrieval/generation protocol in Section 3; QA settings and query-type slices in Tables 1–3; query-based summarization in Tables 4–5; construction/retrieval/storage trade-offs in Section 4.6; LLM-judge position bias in Figure 4; and RAG/community failure cases in Appendix D. This supports query-type-dependent strengths under the paper's implementations, corpora, budgets, and Llama 3.1 evaluation.
- **Author claims:** RAG and GraphRAG are complementary; Selection/Integration can combine strengths; graph-construction quality matters.
- **Not yet supported:** no enterprise-private-data, incremental graph-update, multilingual, freshness, permission-filtering, or production-traffic evaluation; generation is primarily Llama-3.1-8B/70B. Table 4 seconds and MB are benchmark-run numbers, not total API, extraction-failure, retry, queue, cache, observability, and human-operation cost.
- **Our engineering judgment:** query-aware routing and same-budget evaluation discipline are the transferable ideas—not “GraphRAG” as a single drop-in product. A graph can help relation/temporal evidence while harming null abstention and detail retrieval.

## Artifact Availability and Reproducibility (as of 2026-08-09)

The [arXiv record](https://arxiv.org/abs/2502.11371) provides **usable for reading** PDF, HTML, and TeX. This article's table/appendix anchors refer to its original v1 reading; the record is now v3, so numbers across versions must not be silently mixed. [haoyuhan1/RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG) is **usable** official benchmark code: its README lists RAG, RAPTOR, KG/Community GraphRAG, HippoRAG2, plus indexing, retrieval, QA, evaluation scripts, and command flags.

The repository has one commit and GitHub Releases was **empty**. There is no fixed paper-result snapshot, graph cache, checkpoint, container lockfile, or complete raw-result log. The README depends on LlamaIndex, vLLM, HippoRAG, RAPTOR, Microsoft GraphRAG, and the OpenAI API; upstream methods, model/API versions, dataset acquisition, keys, and runtime environment can therefore vary. The code can run an approximate pipeline, while exact artifacts, cost accounting, and deterministic reproduction for every original table remain **missing/incomplete**. A public repository is not by itself full reproducibility.

## Engineering Adoption and When Not to Use It

| Situation | Decision | Why |
| --- | --- | --- |
| Routeable multi-hop, comparison, or temporal questions in a relationship-dense corpus | Run a same-budget RAG vs graph-guided retrieval POC | Table 2's query slices—not a headline overall—supply the adoption evidence; retain per-type metrics. |
| Single-hop FAQ, detail lookup, or correct abstention is central | **Do not default to** GraphRAG | Table 1 NQ and Table 2 Null often favor RAG; Community-Global is only 19.27% on Null. |
| Corpus-level synthesis where summary loss is acceptable | Evaluate Community-Global | It has a comparison/temporal signal, but Tables 4–5 show it is not automatically better for query-specific summarization. |
| Tight cost/latency budget, rapidly changing corpus, or no graph-refresh owner | **Do not build** a full KG first | Section 4.6 already shows substantial construction/retrieval trade-offs; incremental maintenance was not tested. |
| Planning to concatenate RAG and graph evidence | First test context length and null calibration | Appendix H Integration is not monotonically beneficial; smaller backbones can lose null accuracy. |

### Original Source

- Han et al. *RAG vs. GraphRAG: A Systematic Evaluation and Key Insights*. arXiv:2502.11371 (2025). [PDF](https://arxiv.org/pdf/2502.11371.pdf)
- Code: [haoyuhan1/RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG)
- [Current arXiv record (v3)](https://arxiv.org/abs/2502.11371): version history and full-text entry points.
- [Official RAGvsGraphRAG repository](https://github.com/haoyuhan1/RAGvsGraphRAG): method scripts, evaluation instructions, dependencies, and the Releases check.
