---
title: "RAG without Forgetting: Writing Successful Query Expansion Back into the Index"
description: "A source-grounded assessment of ERM's correctness gate, selective attribution, bounded key updates, BEIR/BRIGHT results, and missing artifacts."
pubDate: 2026-03-23
updatedDate: 2026-08-24
tldr:
  - "ERM is training-free index adaptation: it stores only expansion signals accepted by a correctness gate and attributes them to benefiting document keys."
  - "The paper shows broad benchmark gains, but mutable-index safety still depends on clean verification, repeat traffic, provenance, and rollback."
audience:
  - "Search engineers reducing query-time expansion work in high-QPS RAG."
  - "ML teams governing feedback contamination, index drift, and online memory."
tags: ["Paper Reading", "RAG", "Retrieval", "Query Expansion", "Continual Learning", "Vector Index"]
image: "/paperReading/05-RAG-without-Forgetting/image_1.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
  - agent-memory-adaptation
paper:
  title: "RAG without Forgetting: Continual Query-Infused Key Memory"
  authors:
    - "Yuntong Hu"
    - "Sha Li"
    - "Naren Ramakrishnan"
    - "Liang Zhao"
  year: 2026
  venue: "arXiv 2602.05152 v1 (preprint)"
  links:
    pdf: "https://arxiv.org/pdf/2602.05152.pdf"
    arxiv: "https://arxiv.org/abs/2602.05152"
series:
  id: "rag-without-forgetting"
  title: "RAG without Forgetting Deep Dive"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Query expansion (QE) narrows the representation gap between brief user queries and document text, but re-executes costly large language model (LLM) generation on every online request and discards the result immediately after retrieval. Under high queries-per-second (high-QPS), this incurs prohibitive latency and serving expense. Existing offline key expansion (KE) is persistent, but relies on heuristic or unsupervised document rewriting disconnected from downstream task utility, leading to semantic drift and noise accumulation. Direct continual fine-tuning of retriever encoder parameters causes catastrophic forgetting.
- **Core insight:** Evolving Retrieval Memory (ERM) introduces a training-free index-adaptation architecture: accept expansion signals only when they clear an explicit task correctness gate; compute marginal similarity gain to selectively attribute atomic expansion units only to the document keys they actually benefit; and progressively evolve stored keys via norm-bounded updates. This transforms transient query-time expansion gains into persistent index-side memory, allowing subsequent recurring queries to retrieve targets at native retrieval speed.
- **Strongest evidence:** Across 13 benchmark domains spanning BEIR and BRIGHT, ERM yields broad retrieval improvements (Table 1: BM25 average nDCG@1 rises from 26.3 to 38.5 [+46%]; BGE-Large from 48.6 to 55.7 [+15%]; GTE-Base from 49.9 to 56.4 [+13%]; Cohere and Voyage gain 11–13%), while maintaining downstream StackExchange answer quality gains (Table 2: BM25 answer score improves by 6% and BGE-Large by 4%). Measured serving latency remains at native retrieval levels of 150–180 ms, compared to 7–15 seconds for HyDE (Figure 3).
- **Main boundary:** Theoretical equivalence and cost amortization rely on Zipf-like recurring intent distributions and additive similarity structures. If a correctness gate produces false positives, erroneous associations become permanently encoded into vector keys. Offline benchmark evaluations do not establish long-term index stability under live evolving document corpuses, adversarial prompt injection, or user deletion mandates. The authors have not publicly released runnable code, prompts, or checkpoints.

Standard retrieval-augmented generation (RAG) systems face a fundamental dilemma: online query expansion improves retrieval recall but remains stateless and computationally expensive, while offline key expansion is persistent but blind to actual downstream task utility. Hu et al. address a central question: can atomic expansion units validated by downstream task success be selectively written back into the vector index keys themselves, rather than continually recomputed or used to fine-tune retriever weights? Across 13 benchmark datasets and diverse retriever families, ERM demonstrates that costly query expansions can be amortized into constant-time vector retrieval. The significance of this work lies in treating the vector index itself as a bounded, verifiable continual learning substrate, while making explicit that production deployment strictly depends on gate fidelity, provenance logging, and rollback infrastructure. This analysis examines the arXiv 2602.05152 v1 preprint posted on 2026-02-05.

## What to know first

To evaluate ERM effectively, several foundational concepts and traditional system limitations must be clarified:

1. **Query Expansion (QE) and the Representation Gap:**
   User inquiries are typically terse and underspecified, creating a substantial semantic and lexical disconnect with dense reference documents. Modern RAG pipelines address this by generating pseudo-relevance terms, hypothetical document embeddings (such as HyDE), or multi-perspective rewrites (such as Diver or Facet) before vector search.
2. **Key Expansion (KE) and Dual-Encoder Retrieval:**
   In dual-encoder architectures, a corpus $D=\{d_i\}$ is mapped into a vector key space $K=\{k_i\}$ by an encoder $f$. Traditional key expansion attempts to enrich document keys during offline indexing by prepending generated summaries, synthetic questions, or keywords.
3. **Why previous approaches fall short:**
   - **The Stateless Bottleneck of Traditional Online QE:** Traditional query expansion defers all adaptation to query runtime. Every incoming request must wait for an LLM to generate hundreds of tokens, introducing seconds of latency (7–15 seconds for HyDE). Crucially, this output is discarded once retrieval finishes. When subsequent users submit identical or closely related queries, the system pays the exact same inference latency and financial cost anew.
   - **Task-Agnostic Noise in Traditional Offline KE:** Traditional offline key expansion operates in batch without query context or downstream answer verification. Generating synthetic expansions blindly across an entire corpus frequently introduces tangential keywords and dilutes primary document semantics, causing widespread representation drift.
   - **Catastrophic Forgetting in Continual Retriever Training:** Attempting to update retriever encoder parameters online via continual learning incurs heavy GPU training overhead and routinely destabilizes the global vector space, degrading retrieval quality on historical domains.

## Core intuition

The central intuition of ERM is straightforward: **leave retriever encoder weights frozen, and treat downstream-validated expansion signals as bounded, attributable memory increments applied directly to the benefiting document keys.**

This fundamentally alters the system decision rule:

- **Traditional Online Decision Rule:**
  $$q \xrightarrow{\text{LLM}} c(q) \xrightarrow{\text{Combine}} q_{\text{expanded}} \xrightarrow{\text{Search}} \text{Results} \xrightarrow{\text{Discard}} \emptyset$$
  Every query consumes LLM generation capacity; generated knowledge vanishes after request fulfillment.
- **Traditional Offline Decision Rule:**
  $$d_i \xrightarrow{\text{Heuristic}} d_i \oplus \text{Tags} \xrightarrow{\text{Embed}} k_i$$
  Heuristics modify all document vectors blindly without task-level verification.
- **ERM Decision Rule:**
  $$q \xrightarrow{\text{Expand}} c(q) \xrightarrow{\text{Correctness Gate}} \text{Valid Signals} \xrightarrow{\text{Marginal Gain}} \text{Attributed Keys} \xrightarrow{\text{Bounded Update}} k_i^*$$
  Only expansion units verified by downstream task success that contribute positive marginal similarity gain to a specific document key are preserved and accumulated; unrelated units and non-benefiting keys remain completely untouched.

Through this mechanism, document keys in vector space gently migrate toward historically proven query formulations. Subsequent matching queries retrieve updated keys via standard inner product search at native latency, bypassing runtime LLM expansion entirely.

![ERM Figure 1: Comparison of Query Expansion (QE), Key Expansion (KE), and Evolving Retrieval Memory (ERM).](/paperReading/05-RAG-without-Forgetting/image_1.webp)

*Figure 1, Section 1 of the paper (paradigm comparison): left shows online QE aligning representations at high per-query cost, middle shows offline KE expanding keys without task feedback, and right shows ERM selectively accumulating task-validated units into document keys. See the [original Figure 1 anchor](https://arxiv.org/html/2602.05152v1#S1.F1) and [arXiv HTML figure endpoint](https://arxiv.org/html/2602.05152v1/figs/intro_fig.png). arXiv source identifies a perpetual non-exclusive license; reproduced under [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) with attribution.*

![ERM Figure 2: the flow that writes query expansion back into the index through a correctness gate and selective attribution.](/paperReading/05-RAG-without-Forgetting/image_2.webp)

*Figure 2, Section 3 ERM system overview: showing how query expansion, correctness gating, selective attribution, and bounded key evolution integrate into a traceable index-adaptation loop. See the [original Figure 2 anchor](https://arxiv.org/html/2602.05152v1#S3.F2) and [arXiv HTML figure endpoint](https://arxiv.org/html/2602.05152v1/figs/erm.png). The arXiv source states a perpetual non-exclusive license; this article preserves attribution and follows [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) for scholarly reproduction.*

## Walk one example through the method

To understand the end-to-end mechanics of ERM, consider a concrete enterprise technical support query:

1. **Input:**
   A user submits query $q = \text{"internal security key fails authentication"}$. The expansion module produces candidate atomic expansion units $c(q) = \{e_1, e_2\}$:
   - $e_1 = \text{"hardware token registration timeout and certificate reset"}$
   - $e_2 = \text{"office guest Wi-Fi connectivity guide"}$
2. **Intermediate representation:**
   The expanded query retrieves the top candidate documents from the corpus:
   - Document $d_1$ (key $k_1$): *Hardware Token Troubleshooting & Reset Manual*.
   - Document $d_2$ (key $k_2$): *Corporate Office Guest Network Policies*.
   The downstream generator consumes retrieved context and outputs an instruction guide for resetting the security token certificate.
3. **Decision or transformation:**
   - **Correctness Gate Evaluation:** The retrieval verifier confirms $d_1$ ranks in the top tier; the generation verifier confirms the output accurately resolves the authentication error. The query passes the gate, enabling index write operations.
   - **Selective Attribution Scoring:** Marginal similarity gain $\Delta_{i,j}(q)$ is evaluated for each document key and expansion unit pairing:
     - For $d_1$ (security manual), adding $e_1$ (certificate reset) increases query similarity significantly ($\Delta_{1,1} = +0.34 > 0$); adding $e_2$ provides no benefit ($\Delta_{1,2} = -0.05 \le 0$).
     - For $d_2$ (network policy), adding either $e_1$ or $e_2$ produces negligible or negative similarity deltas ($\Delta_{2,1} \le 0, \Delta_{2,2} \le 0$).
   - **Attribution Decision:** The system assigns $e_1$ exclusively to $k_1$, pruning $e_2$ and leaving $d_2$ unaltered.
4. **Output:**
   The representation $f(e_1)$ is computed, and key $k_1$ is updated under norm bounds: $k_1 \leftarrow k_1 + \eta \cdot f(e_1)$. Key $k_1$ in the vector database shifts toward token troubleshooting terminology. When another user later asks "FIDO security key verification error", native vector retrieval retrieves $d_1$ in 150 ms without invoking LLM query expansion.
5. **Likely failure point:**
   If the generation verifier misjudges an output (for instance, an LLM judge validates a hallucinated answer, or user click feedback rewards an irrelevant page), an erroneous unit or adversarial phrase is permanently written into $k_1$. Subsequent legitimate security queries will be improperly routed, manifesting gate contamination.

## Technical mechanism

ERM models the retrieval corpus as documents $D=\{d_i\}_{i=1}^N$ with vector keys $K=\{k_i\}_{i=1}^N \subset \mathbb{R}^d$. A query encoder $f: \mathcal{X} \to \mathbb{R}^d$ maps query $q$ to embedding $f(q)$, and relevance is computed via similarity function $S(q, k_i) = \operatorname{sim}(f(q), k_i)$. For query $q$, the expansion component extracts atomic semantic units $c(q) = \{e_1, e_2, \ldots, e_m\}$.

The technical framework operates through three discrete stages:

### 1. Correctness-Gated Feedback (Section 4.1)

ERM explicitly rejects unsupervised learning from arbitrary user traffic. It incorporates two complementary verifiers:

- **Retrieval Verifier $V_r(q, R_q)$:** In retrieval-labeled environments (such as BEIR), computes standard metrics over candidate set $R_q$ (such as Recall@K or dense retriever hit rate).
- **Generation Verifier $V_g(q, R_q, y)$:** In end-to-end task environments (such as BRIGHT), evaluates generated answer $y$ against ground truth or automated judge criteria (such as ROUGE or LLM judge score).

Task-specific thresholds $\tau_r$ and $\tau_g$ convert verifier outputs into binary decisions. The write trigger $G(q)$ employs a logical OR:

$$
G(q) = \mathbb{I}[V_r(q, R_q) \ge \tau_r] \lor \mathbb{I}[V_g(q, R_q, y) \ge \tau_g]
$$

When $G(q) = 1$, the query's expansion units proceed to attribution. This enables unified adaptation across pure retrieval and generative QA benchmarks, while establishing the primary perimeter against index corruption.

### 2. Selective Expansion Attribution (Section 4.2)

To prevent generic query terms from corrupting unaligned documents, ERM evaluates the marginal similarity gain for each retrieved document key $k_i$ and candidate unit $e_j$:

$$
\Delta_{i,j}(q) = \operatorname{sim}(f(q), k_i \oplus f(e_j)) - \operatorname{sim}(f(q), k_i)
$$

where $\oplus$ represents feature fusion (vector addition in unnormalised additive spaces). Only pairings with $\Delta_{i,j}(q) > 0$ qualify as valid memory updates.

To balance competing valid units for a single document, weights are normalized using temperature-scaled Softmax:

$$
w_{i,j}(q) = \frac{\exp(\Delta_{i,j}(q) / \tau)}{\sum_{j': \Delta_{i,j'}(q) > 0} \exp(\Delta_{i,j'}(q) / \tau)}
$$

Units with non-positive gains receive a weight of zero. This per-key attribution prevents globally popular expansion phrases from being broadcast across all top-k items.

### 3. Progressive Key Evolution (Section 4.3)

Attribution weights are aggregated over query batch $\mathcal{B}$, filtering out low-scoring or noisy updates:

$$
k_i^{(t+1)} = k_i^{(t)} + \eta \sum_{q \in \mathcal{B}} \sum_{j: \Delta_{i,j}(q) > 0} w_{i,j}(q) \cdot f(e_j)
$$

where $\eta$ is the learning rate step size. To prevent unbounded vector magnitude growth, keys are constrained by norm bound $\|k_i^{(t+1)}\| \le B_k$. A saturation stopping rule monitors marginal gain per key; when incremental retrieval improvement drops below a set threshold, updates for that key terminate.

The entire process **never updates retriever encoder parameters $f$**. This avoids backpropagation compute costs and catastrophic forgetting, but shifts system complexity into vector state management, versioned key tracking, and verification logging.

### Theoretical Bounds and Operating Scope

The mathematical claims in Section 4 and Appendix A require careful operational scoping:

- **Equivalence of Query and Key Expansion:** Under additive inner-product similarity $\operatorname{sim}(u, v) = u^T v$, adding expansion representations to the query vector yields inner product values identical to pre-adding expansion vectors to document keys.
- **Convergence Guarantees (Appendix A.3):** The proof of convergence holds strictly for unnormalised dense retrievers with additive augmentation. For cosine similarity models with L2 normalization, the guarantee holds only approximately under slowly changing vector norms. **The theoretical proof does not extend to sparse retrievers (BM25) or late-interaction retrievers (such as ColBERT).**
- **Amortized Cost Assumptions (Appendix A.4):** Claims of "zero inference-time overhead" depend on a Zipfian distribution of recurring user intents. If incoming traffic consists primarily of single-occurrence, seasonal, or shifting queries, the initial compute and storage overhead cannot be amortized.

## How to read the evidence

Analyzing ERM requires examining evaluation protocols, absolute denominators, and documented regressions.

### Experimental Setup and Evaluation Scope (Section 5 & Appendix B.1)

- **Datasets:** Evaluated across 13 diverse domains:
  - **BRIGHT Benchmark:** 7 StackExchange Q&A domains (Biology, Earth Science, Economics, Psychology, Robotics, StackOverflow, Sustainable Living) and 4 complex reasoning domains (LeetCode, Pony, AoPS, TheoremQA-T), featuring both retrieval labels and answer ground truth.
  - **BEIR Benchmark:** NFCorpus (323 medical queries, 3.1K documents) and SciDocs (1,000 scientific queries, 4K documents), containing retrieval labels only.
  - Corpus size ranges from Pony (7,894 documents) to LeetCode (413,932 documents).
- **Retrievers and Baselines:**
  - Sparse: BM25.
  - Open Dense: BGE-Large, BGE-Base, BGE-M3-Dense, GTE-Base, MiniLM.
  - Proprietary APIs: Cohere embedding, Voyage embedding.
  - Methods: Naive unadapted retrieval, online HyDE, Diver, Facet.
- **Index Representation:** Tested four document formats (full document, title, abstract, keywords). Appendix B logs 393 naive retrieval experiments showing optimal configurations vary by domain (StackExchange favors titles; technical domains favor abstracts and keywords).
- **Metrics and Compute:** Retrieval evaluated on nDCG@1 (primary), nDCG@10, and MRR. Downstream generation evaluated using Claude-3.5-sonnet as generator and judge. Serving latency measured in milliseconds per query.

### Retrieval Results: Absolute Denominators vs Relative Gains (Table 1)

[Table 1](https://arxiv.org/html/2602.05152v1#S4.T1) reports nDCG@1 across all 13 domains. Average scores demonstrate consistent aggregate gains:

- BM25 average increases from **26.3** to **38.5** (+46%)
- BGE-Large increases from **48.6** to **55.7** (+15%)
- GTE-Base increases from **49.9** to **56.4** (+13%)
- Cohere increases from **48.7** to **55.2** (+13%)
- Voyage increases from **50.8** to **56.3** (+11%)

However, two critical patterns qualify these figures:

1. **Extreme Relative Gains on Low Baselines:** BM25 on AoPS rises from 0.9 to 20.7 (+2200%), and on TheoremQA-T from 7.9 to 37.8 (+378%). These spikes reflect severe vocabulary mismatch in mathematical reasoning that expansion helps bridge; they do not indicate a 23-fold increase in production accuracy.
2. **Performance Regressions on Strong Retrievers:** Strong dense retrievers exhibit measurable declines in domains where baseline performance was already high. BGE-Large drops in Biology (95.1 to 91.3), StackOverflow (43.4 to 40.4), and Sustainable Living (79.1 to 75.9); GTE-Base experiences minor dips in multiple domains. When query and document representations are already well-aligned, injecting additional expansion terms introduces noise.

### Downstream Generation Evaluation (Table 2)

[Table 2](https://arxiv.org/html/2602.05152v1#S5.T2) couples retrieval with downstream QA generation across 7 StackExchange domains:

- BM25 average answer score improves from 72.6 to 76.6 (+6%)
- BGE-Large improves from 74.5 to 77.6 (+4%)
- GTE-Base improves from 77.4 to 79.0 (+2%)
- Cohere improves from 79.3 to 80.5 (+2%)

While aggregate gains are positive, regressions appear in specific domains (such as GTE-Base on Earth Science and Cohere on Robotics). Furthermore, using Claude-3.5-sonnet as both answer generator and evaluator introduces potential model-family bias, which cannot substitute for independent blind human evaluation.

### Serving Latency, Adaptation Budgets, and Transfer (Figures 3, 4, 6)

![ERM Figure 3: Inference latency comparison across Native Retrieval, ERM, and HyDE on multiple benchmark domains.](/paperReading/05-RAG-without-Forgetting/image_3.webp)

*Figure 3, Section 5.1 of the paper (inference latency diagnostic): Native and ERM maintain pure vector retrieval speeds of 150–180 ms, whereas HyDE incurs 7–15 seconds per query due to online LLM generation, proving that ERM successfully amortizes expansion latency offline. See the [original Figure 3 anchor](https://arxiv.org/html/2602.05152v1#S5.F3) and [arXiv HTML figure endpoint](https://arxiv.org/html/2602.05152v1/bar_aops.png). arXiv source identifies a perpetual non-exclusive license; reproduced under [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) with attribution.*

- **Serving Latency (Figure 3):** [Figure 3](https://arxiv.org/html/2602.05152v1#S5.F3) compares Native Retrieval, ERM, and HyDE. Native and ERM maintain latency of **150–180 ms**, whereas HyDE requires **7–15 seconds**. This demonstrates ERM's primary operational advantage: shifting expensive LLM generation to offline adaptation while serving repeated queries at native vector search speeds. It does not eliminate total compute, but amortizes it.
- **Adaptation Budget Scaling (Figure 4):** [Figure 4](https://arxiv.org/html/2602.05152v1#S5.F4) demonstrates that increasing adaptation data from 30% to 80% yields monotonic improvements in nDCG@10 on AoPS, Psychology, TheoremQA-T, and SciDocs. This confirms offline benefits from accumulated data, but key resets between splits mean the test does not measure stability over months of live production traffic.
- **Expansion Strategy Complementarity (Appendix B.9 / Figure 6):** [Figure 6](https://arxiv.org/html/2602.05152v1#A2.F6) shows ERM complements diverse QE techniques on LeetCode (Facet+BM25 gains +12%, HyDE+BGE-Large gains +58%). Yet Table 5 logs negative deltas (Biology −0.7%, Pony −0.4%), reaffirming that blind expansion on aligned queries degrades precision.
- **Anti-Forgetting Diagnostic (Section 5.2):** On five BRIGHT datasets with zero gold-document overlap, retrieval variance on non-target documents stayed within ±3% of baseline. This confirms updates do not immediately disrupt unrelated vectors, though it leaves unaddressed adversarial saturation attacks against popular documents.

## Evidence map

To assist engineering evaluations, the paper's claims and experimental results are categorized into four distinct evidential tiers:

### 1. Direct paper evidence

- **Architecture Definition (Figures 1–2, Sections 4.1–4.3):** Defines the training-free adaptation loop uniting correctness gating, selective attribution, and norm-bounded key evolution.
- **Retrieval Performance (Table 1):** Validates nDCG@1 gains across 13 domains, with BM25 gaining 46% and dense models gaining 11–15% on average, alongside documented regressions in Biology, StackOverflow, and Sustainable Living.
- **Downstream Generation Quality (Table 2):** Establishes average QA score gains of 2–6% across 7 StackExchange domains under Claude-3.5-sonnet evaluation.
- **Serving Latency (Figure 3):** Confirms ERM operates at 150–180 ms native retrieval latency, achieving orders-of-magnitude speedups over HyDE (7–15 s).
- **Adaptation Budget Scaling (Figure 4):** Demonstrates monotonic nDCG@10 increases as historical adaptation data scales from 0.3 to 0.8.
- **Cross-Domain Isolation (Section 5.2):** Verifies that non-target document retrieval performance remains within ±3% across disjoint subsets.

### 2. Author causal claims

- **Mathematical Equivalence:** Asserts that query expansion and key expansion are mathematically interchangeable under standard additive inner-product similarity.
- **Convergence and Stability:** Claims bounded selective updates guarantee convergence and eliminate semantic drift.
- **Amortized Efficiency:** Concludes that under Zipf-like query repetition, query expansion overhead is entirely amortized, resulting in zero inference-time overhead.

### 3. Unsupported claims

- **Verifier Precision Under Live Feedback:** The paper **does not establish** that automated judges or user clicks provide sufficient precision in production to prevent gradual index poisoning.
- **Lifecycle Management for Dynamic Documents:** The paper **does not establish** how updated keys are pruned or synchronized when underlying documents are modified, expired, or purged.
- **Robustness Against Adversarial Prompt Injection:** The paper **does not establish** how mutable vector keys resist intentional manipulation by adversarial queries.
- **Privacy and Data Deletion Compliance:** The paper **does not establish** compliance mechanisms for privacy protection or GDPR "right to be forgotten" mandates when user queries become encoded into stored keys.

### 4. Bloss0m engineering synthesis

- **System Classification:** ERM is best understood as a **verification-gated index-level semantic cache**, whose primary utility lies in amortizing LLM inference costs for high-confidence, recurring query workloads.
- **Architectural Boundary:** Production deployment requires strictly decoupling serving evidence from learning evidence, backed by immutable delta logs, versioned key snapshots, and automated rollback triggers.

## Artifacts and reproducibility

- **Audit Date:** Evaluated as of **2026-08-09**.
- **Accessible Components:**
  - The [arXiv preprint page](https://arxiv.org/abs/2602.05152) and [full HTML/PDF paper](https://arxiv.org/html/2602.05152v1) are publicly accessible.
  - Benchmark datasets [BEIR repository](https://github.com/beir-cellar/beir) and [BRIGHT repository](https://github.com/SDU-NLP/BRIGHT) are available via third-party repositories.
- **Missing or Unavailable Components:**
  - No official code repository, pre-trained key checkpoints, interactive demo, or runnable reproduction scripts have been released.
  - Specific prompt templates for query expansion, verifier decision threshold logs, random seed configurations, key-delta update histories, and Claude-3.5-sonnet judge prompts are unavailable.
- **Reproducibility Assessment:**
  - Experimental findings in this review reflect author-reported results; full independent benchmark reproduction was not conducted.
  - Independent engineering teams cannot replicate the reported adaptation runs via a single command, and must implement the gating thresholds, attribution matrices, and norm bounding logic from first principles.

## Bloss0m engineering judgment and when not to use it

Based on mechanistic analysis and operational risk profiles, Bloss0m provides the following deployment decision matrix and architectural safeguards:

### Engineering Decision Matrix

| Scenario | Decision | Rationale and Constraints |
| --- | --- | --- |
| High-QPS internal knowledge bases with objective outcome signals (such as closed tickets or passed builds) | **Recommended:** Replay historical logs offline, then canary deploy ERM | Strongly aligns with repetitive intent assumptions; significantly reduces runtime LLM expansion expenses. |
| Enterprise RAG systems with highly reliable independent verifiers | **Viable:** Pilot version-controlled key memory | Preserves 150–180 ms native retrieval latency while maintaining enhanced semantic retrieval. |
| Ad-hoc, long-tail, seasonal, or rapidly evolving search queries | **Not Recommended:** Use stateless online QE or scheduled offline reindexing | Lacks recurring traffic to amortize adaptation overhead; increases index storage and complexity without benefit. |
| Workloads vulnerable to prompt injection, clickbait, or untrusted tools | **Strictly Avoid:** Do not write interaction feedback to vector keys | Compromised verifiers permanently encode hallucinations or malicious payloads into the index (Gate Contamination). |
| Workloads governed by strict privacy regulations or multi-tenant boundaries | **Strictly Avoid:** Withhold until deletion and privacy semantics are verified | Persisted expansion representations can leak sensitive user query data, violating data deletion mandates. |
| Infrastructure lacking key-level provenance, TTL, and instant rollback | **Strictly Avoid:** Do not deploy mutable vector storage | Representation drift cannot be resolved via vector arithmetic; failure to rollback guarantees severe production incidents. |

### The Core Threat: Gate Contamination

While ERM claims "RAG without forgetting", mathematical norm bounding ensures numerical stability, not semantic correctness.

If the correctness gate misclassifies an output—such as validating an authoritative hallucination or mistaking engagement clicks for technical accuracy—erroneous expansion phrases become permanently encoded into the document's key representation. This generates two systemic vulnerabilities:

1. **Self-Reinforcing Errors in High-Volume Intents:** High-frequency queries amortize costs rapidly, but their volume aggressively reinforces early attribution errors. Conversely, rare long-tail intents fail to accumulate sufficient verification, causing their relative retrieval quality to deteriorate.
2. **Semantic Suppression of New Vocabulary:** Keys saturated with historical expansion weights can overpower emerging product terminology or updated operational procedures.

### Bloss0m Architectural Safeguards

Teams implementing key-memory adaptation should enforce four architectural invariants:

1. **Decouple Serving Context from Learning Authority:** Context deemed sufficient to answer a user inquiry must never automatically receive index write permissions. Candidates must stage in an external verification queue.
2. **Require Independent Multi-Session Support ($\text{Support Count} \ge K$):** An expansion unit must pass verification across multiple independent sessions from distinct users before triggering a key update.
3. **Maintain Immutable Delta Logs with TTL:** Record every key alteration in an append-only log detailing timestamps, query hashes, verifier versions, attribution weights, and delta vectors. Apply time-to-live (TTL) expiration to prevent permanent index drift.
4. **Enforce Instant Snapshot Rollback (Kill Switch):** System recovery must revert to an immutable historical index snapshot or strip delta layers. **Never attempt to repair corrupted live vectors through subtractive inverse updates.**

## Three things to remember

1. **Technical Foundation:** ERM is a training-free, verification-gated key adaptation framework rather than continual model fine-tuning; it uses correctness gates and marginal similarity gains to write validated expansion experience directly into document keys.
2. **Empirical Performance:** Across 13 benchmark domains, ERM bridges semantic representation gaps (BM25 average nDCG@1 +46%, dense models +11–15%) while maintaining 150–180 ms native retrieval latency.
3. **Deployment Guardrails:** Mutable vector indexes are acutely vulnerable to gate contamination; without multi-session validation, immutable delta logs, and snapshot-level rollback mechanisms, online feedback must not be written to production vector keys.

## Primary sources

- **Primary Papers and Repositories:**
  - [Hu et al., RAG without Forgetting: Continual Query-Infused Key Memory (arXiv:2602.05152 v1)](https://arxiv.org/abs/2602.05152) and [Full HTML/PDF Version](https://arxiv.org/html/2602.05152v1): Sections 3–5, Figures 1–4, Tables 1–2, Appendix A, and Appendix B.1/B.7–B.9.
  - [BEIR benchmark repository](https://github.com/beir-cellar/beir): External evaluation dataset suite.
  - [BRIGHT benchmark repository](https://github.com/SDU-NLP/BRIGHT): External evaluation dataset suite.
- **Related Reading:**
  - [RAG-MCP Deep Dive](/en/paper-reading/04-RAG-MCP/): Examines architectural boundaries when routing requests to external tool schemas. Both works underscore that model-generated signals must not become persistent system state without rigorous verification and isolation.
