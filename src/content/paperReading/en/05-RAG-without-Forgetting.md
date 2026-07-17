---
title: "RAG without Forgetting: Evolving Retrieval Memory Detailed Notes"
description: "Interpreting ERM based on arXiv:2602.05152: correctness gating, selective attribution, progressive Key updating, and BEIR/BRIGHT empirical study."
pubDate: 2026-03-23
tags: ["Paper Reading", "RAG", "Retrieval", "Query Expansion", "Continual Learning", "Vector Index"]
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
  title: "RAG without Forgetting Deep Dive"
  part: 1
  totalParts: 1
---

**Query Expansion (QE)** rewrites the query at every inference and discards it after use; **Key Expansion (KE)** enriches document keys offline, but gets disconnected from online query distributions and is prone to drifting. Hu et al. propose **Evolving Retrieval Memory (ERM)** (arXiv:2602.05152): under **correctness gating**, it writes the "truly useful atomic signals from this QE" **back to the corresponding document key**, allowing the index to **accumulate across queries** with **zero additional overhead** during the inference stage.

---

### §1–2 Problem Formulation (§3 Problem Formulation)

**Retrieval System:**

- Corpus $D=\{d_1,\ldots,d_n\}$, where each document has a key $k_i \in K$  
- Similarity $S: Q \times K \to \mathbb{R}$ (e.g., inner product)  
- Top-N: $R_K(q)$  

**RAG Generation (Eq. 2, §3):**

$$
Y_K(q) \sim \pi(\cdot \mid q, \{d_i\}_{i \in R_K(q)})
$$

**Query Expansion (§3):** The expander $\phi$ generates $c(q)=\{e_1,\ldots,e_m\}$, $q'=\{q\}\cup c(q)$, and is **discarded after inference**.

**The Gap ERM Aims to Fill (§1–2):**  
Query-side adaptation is **stateless**; index-side persistence is **weakly supervised and noisy** — it lacks the credit assignment for "**which time succeeded, and what should be remembered**".

---

### §4 The Three Modules of ERM (Figure 2)

#### §4.1 Correctness-Gated Feedback Verifier

**Unified Success Signal (Eq. 4, §4.1):**

$$
\text{success}(q', K) := \mathbb{1}\big[ V_r(R_K(q')) + V_g(Y_K(q')) \geq 1 \big]
$$

- $V_r$: Retrieval verification (recall@K, DPR match, etc.)  
- $V_g$: Generation verification (ROUGE, task loss, LLM-as-judge)  
- It triggers if **any subsystem succeeds** — avoiding optimizing only retrieval or only generation.  

**Only successful expansion units enter the memory update** (End of §4.1).

#### §4.2 Selective Expansion Attribution

For each retrieved document $d_i$ and each expansion unit $e_j$, define the **marginal gain** (Eq. 5, §4.2):

$$
\Delta_{i,j}(q) = \text{sim}(f(q), k_i \oplus f(e_j)) - \text{sim}(f(q), k_i)
$$

- $\oplus$: Appending expansion representation to the key (additive: $k_i + v$)  
- **Only attribute positive-gain $e_j$ to benefiting $k_i$** — to avoid global pollution.  

**Query-local softmax weights (Eq. 6–7, §4.2):**

$$
w_{i,j}(q) = \text{softmax}_{e_j \in c(q)} \Delta_{i,j}(q), \quad
s_{i,j} \leftarrow s_{i,j} + \sum_{q \in B} w_{i,j}(q)\Delta_{i,j}(q)
$$

Accumulate relevance scores $s_{i,j}$ across the batch to drive key updates.

#### §4.3 Progressive Key Evolution

- **Norm-bounded** updates — stable, non-exploding (§4, Figure 2(c))  
- **Training-free** — leaves retriever weights untouched.  
- Theory: **QE and KE are equivalent under standard similarity**; selective updating is **provably convergent** (§1 bullet, Abstract).

---

### Figure 1 Three-Column Comparison (§1, Figure 1 caption)

| | QE | KE | **ERM** |
|---|----|----|---------|
| Timing | Inference time | Offline | Online, after task verification |
| Persistence | None | Yes but drifting | **Yes and selective** |
| Inference Cost | High (expand per query) | Low | **Low (amortized)** |

---

### Experiments (§5, Table 1–2, Figure 3–4)

**Setup (§5.1, Appendix B.1):**

- **BEIR + BRIGHT**, **13 domains** (Abstract; statistics in Table 3)  
- Retrievers: **BM25**, **BGE-M3**, **BGE-Large/Base**, GTE-Base, MiniLM, Cohere/Voyage API  
- Metrics: **nDCG@1** (primary), MRR (secondary); **Claude 3.5 Sonnet** on the generation side for QA generation + evaluation (Table 2).

#### Table 1: Retrieval Gains (§5.2, Table 1 description)

**Overall (§5.2):** ERM consistently improves nDCG across **all domains and retrievers**.

| Retriever Type | Average nDCG Improvement (Paper Description) | Notes |
|----------------|----------------------------------------------|-------|
| **BM25** | **+46%** | Sparse retrieval benefits the most |
| **Dense** (BGE, etc.) | **+13–15%** | Still stably positive |

**Reasoning-intensive subset (listed in §5.2):**

| Dataset | nDCG Gain Range (Paper) |
|--------|----------------------|
| LeetCode | +19–44% |
| Pony | +64–103% |
| AoPS | +115–2200% |
| TheoremQA | +75–378% |

> **Anchor:** When surface lexical overlap is low, ERM's key accumulation aligns with query intent better than "per-query LLM QE".

#### Table 2: End-to-End QA (§5.2)

| Retriever | Generation Quality Gain (Paper) |
|-----------|--------------------------------|
| BM25 | **+6%** average |
| Dense | **+2–4%** |

Paper explanation: Even if retrieval metric gains are modest (e.g., in Biology), **generator feedback can still drive key updates**, forming a tighter retrieval–generation loop (§5.2 Downstream generation quality).

#### Figure 3–4: Latency and adaptation budget (§5.2–5.3)

| Comparison | ERM | HyDE (QE Representative) |
|------|-----|-------------------------|
| Latency | **150–280 ms / query** | 7–15 s |
| Multiplier | baseline | **50–100× slower** |

**Figure 4:** As the adaptation budget goes from 0.3 to 0.8, **nDCG@10 increases monotonically** — key evolution accumulates signals rather than overfits.

#### Label-disjoint Robustness (§5.2 Analysis)

On the five **label-disjoint** datasets of BRIGHT StackExchange (**zero gold overlap** across queries), ERM still yields **+6–47% for BM25**; dense remains at baseline **±3%** — updates do not "pollute" gold docs of irrelevant queries.

#### §5.3 Two Mechanisms + Risks (Discussion)

1. **Key enrichment** — For docs successfully retrieved and generated, their keys align with successful query patterns.  
2. **Disambiguation** — The semantic space becomes less crowded after key specialization (in domains with high lexical overlap like theorems).  

**Drawback admitted in paper:** Positive feedback might **reinforce early retrieval bias**; Mitigation: increase adaptation batch size, more patient stopping (§5.3).

![ERM Flowchart (Figure 1–2)](/paperReading/05-RAG-without-Forgetting/image_1.webp)

---

### Relationship with Agentic / Iterative RAG (§2.2)

ERM **does not replace** multi-step agentic RAG, but supplements **cross-query memory**:

- Agentic: Reflects and corrects within a single query.  
- ERM: **Solidifies verified successful** expansion patterns **into keys**.  

If the queries have a clear Zipf distribution (§4 citing Beitzel et al.), repeated intents will make ERM **increasingly accurate with use**.

---

### Limitations

1. **Requires correctness signals** — Relies on LLM-judge when there is no Ground Truth; gating quality determines the upper bound.  
2. **Key drift risk** — Despite bounded updates, versioning and auditing are still needed in the long term.  
3. **Attribution assumptions** — Additive keys may not suit all retrievers (requires $\oplus$ and $f$ to be compatible).

---

### Editor's Summary

ERM concretizes "RAG without Forgetting" into **index-side memory with credit assignment** — which is more principled than just "adding another vector DB layer" (QE↔KE equivalence + convergence). Suitable for **high QPS, highly repetitive query** enterprise searches; if every query is unique, the accumulated value is limited.

---

### Third Pass

- [ ] Calculate query repetition rate on single-domain logs to estimate ERM ROI.  
- [ ] Compare **per-query LLM QE** vs ERM in terms of **$/query**.  
- [ ] Read Appendix for convergence proofs and $\oplus$ implementation details.  

---

### Original Source

- Hu, Li, Ramakrishnan, Zhao. *RAG without Forgetting: Continual Query-Infused Key Memory*. arXiv:2602.05152 (2026). [PDF](https://arxiv.org/pdf/2602.05152.pdf)
