---
title: "BM25 Wins at Scale: A Scaling Study of Retrieval-Augmented Generation Paradigms"
description: "A deep reading of Wang et al.'s arXiv v3 study: across 28 nested enterprise-shaped corpus tiers with fixed questions, evidence, and adversarial documents, why BM25 crosses over at roughly 10 million corpus tokens and why agents should begin after global candidate discovery."
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "This is not evidence that BM25 wins everywhere; it is evidence that, in this controlled study, the accuracy-cost curve turns toward BM25 after roughly 10 million corpus tokens."
  - "On the full 511,959-document matched resweep, Agent+BM25 scores 69.4 versus 36.9 for raw-file agency; it uses about 101K tokens per question versus about 895K."
  - "An unfinished graph tier is not the same as an incorrect answer. The useful engineering rule is global candidate discovery first, then agentic reasoning over a narrowed evidence set."
audience:
  - "AI and platform engineers building enterprise search, RAG, or knowledge assistants"
  - "Technical leads who need to evaluate retrieval quality, latency, token cost, and index-construction cost together"
tags: ["Paper Reading", "RAG", "Information Retrieval", "Enterprise AI", "Benchmark"]
image: "/paperReading/13-bm25-wins-at-scale/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
paper:
  title: "BM25 Wins at Scale: A Scaling Study of Retrieval-Augmented Generation Paradigms"
  authors:
    - "Pengyu Wang"
    - "Benfeng Xu"
    - "Shaohan Wang"
    - "Mingxuan Du"
    - "Xin Zeng"
    - "Huarui Wu"
    - "Lei Zhang"
    - "Licheng Zhang"
  year: 2026
  venue: "arXiv 2607.26497 v3 (revised 2026-07-31; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2607.26497v3"
    arxiv: "https://arxiv.org/abs/2607.26497"
series:
  id: "retrieval-systems"
  title: "Retrieval Systems Deep Dive"
  part: 2
  totalParts: 3
---

## The paper in 90 seconds

- **Problem:** Retrieval-Augmented Generation (RAG) paradigms have long been evaluated almost exclusively on single, small-scale benchmarks, obscuring how answer accuracy, index construction overhead, query token expenditure, and serving latency scale nonlinearly as corpus volume expands.
- **Core insight:** Across EnterpriseRAG-Bench's 28 strictly nested corpus tiers (ranging from 1,144 to 511,959 documents, or 1.7M to 600.8M tokens) with a fixed bedrock and shared reader/judge, an index-free File-System Agent holds a slight advantage at the smallest tier, but crosses over with BM25 around 10 million corpus tokens. Beyond this threshold, traditional BM25 demonstrates robust global candidate discovery, substantially outperforming DenseRAG and raw file-system agency.
- **Strongest evidence:** On the full 511,959-document matched 150-question resweep, replacing raw directory exploration with a BM25 candidate-retrieval tool (Agent+BM25) raises accuracy from 36.9 to 69.4 while slashing query tokens per question from 895K to 101K (nearly a 9x reduction); native BM25 scores 50.5 on the full ladder, compared to 30.7 for the File-System Agent and 29.9 for DenseRAG (Section 4.2, Section 5.1, Figure 3, Table 1, Table 4).
- **Main boundary:** EnterpriseRAG-Bench is a synthetic, enterprise-shaped corpus (500 questions, one primary reader/judge) featuring precise named entities and factual trap documents that inherently favor lexical matching; furthermore, official end-to-end execution packages and full datasets remain unconfirmed at verification time. The evidence supports separating global candidate retrieval from agentic reasoning, not an unconditional claim that BM25 beats all alternatives across arbitrary tasks.

When an enterprise knowledge base grows from thousands of documents to hundreds of thousands, which substrate should handle global candidate discovery, and where should agentic reasoning begin? Prior architectural intuition often assumed that as LLMs gain reasoning and tool-calling capabilities, letting an autonomous agent browse directories or constructing full GraphRAG indexes would provide the ultimate solution. However, this scaling study by Wang et al. demonstrates that the primary bottleneck at scale is not reasoning, but candidate exposure. This reading follows arXiv:2607.26497v3 (submitted 2026-07-29, revised 2026-07-31; a preprint not yet peer-reviewed).

> **Huahua in one sentence**
>
> At scale, the first bottleneck is not whether an agent can reason, but whether it can reach the right documents; placing the agent after BM25 global candidate ranking is far more controllable than letting it wander through a raw file tree.

## What to know first

Before interpreting the experimental results, it is essential to understand the evaluation dimensions, retrieval substrates, and limitations of prior evaluation setups:

1. **Nested Corpus Ladder:** Rather than evaluating independently sampled corpora of arbitrary sizes, the benchmark constructs a fixed bedrock containing 500 questions, 722 gold documents, 326 trap documents (semantically similar but factually contradictory), and 99 lure documents (unanswerable questions), deduplicated to 1,144 documents at the smallest tier. From there, background distractor documents from stratified enterprise sources are added in a fixed sequence across 28 strictly nested tiers, growing geometrically by roughly 1.25x per tier up to 511,959 documents (600.8M tokens).
2. **Four Core Retrieval Paradigms:**
   - **Lexical Retrieval:** Represented by an inverted index under BM25, requiring zero generative construction tokens.
   - **Dense Retrieval:** Represented by DenseRAG, utilizing Qwen3-Embedding-0.6B to encode chunks into vector space for approximate nearest neighbor search.
   - **Graph-based Retrieval:** Including HippoRAG 2, MS-GraphRAG, LightRAG, and LinearRAG, which use LLMs to extract entities, relations, and communities into structured graph indexes.
   - **Agentic Retrieval (File-System Agent):** Builds no index in advance; an LLM policy uses directory tools (`ls`, `grep`, `view`) over multiple rounds of interactive navigation.
3. **Retrieval-Swap Control:** To isolate whether performance differences stem from the retrieval substrate or agent policy, the authors designed a controlled intervention: holding the agent harness, model, prompt, judge, and 80-call budget constant, while swapping the raw file-exploration tool for a BM25 top-5 retrieval tool (Agent+BM25).

### Why previous approaches and fixed-scale benchmarks are insufficient

Traditional RAG benchmarks (such as early BEIR, HotpotQA, or standard enterprise POC evaluations) typically evaluate systems on a single fixed corpus size, often between 1,000 and 10,000 documents. This traditional approach suffers from three critical blind spots:
- **Concealing nonlinear construction costs:** At thousands of documents, GraphRAG's entity extraction costs appear manageable; but as the corpus expands to hundreds of thousands of files, generative token costs and indexing runtime scale rapidly along high-degree power laws.
- **Flattering sequential exploration policies:** In shallow directory structures, an agent without an index can easily stumble across relevant files in a few `ls` and `grep` calls. In a vast corpus, however, thousands of competing directory paths cause any early navigation error to trap the agent in irrelevant subtrees.
- **Ignoring distractor dilution in vector space:** In dense vector spaces, adding hundreds of thousands of distractor documents significantly dilutes semantic boundaries, causing top-k document recall to deteriorate under heavy noise.

Without a multi-tiered scaling ladder, engineering teams cannot observe where accuracy, token budget, latency, and index construction curves actually intersect.

## Core intuition

To understand the core findings of this study, one must recognize the fundamental algorithmic difference between **Global Candidate Discovery** and **Agentic Evidence Reasoning**.

In previous architectural patterns, developers frequently assumed that because frontier LLMs excel at multi-step reasoning, giving them raw file access would allow them to investigate repositories just like human systems engineers. Alternatively, teams believed knowledge graphs could capture arbitrary multi-hop relationships, justifying the indexing of entire enterprise corpora into graph structures.

This study's evidence illustrates the geometric reality of search at scale:
1. **File-System Agent executes a sequential decision policy over an enormous state tree:** Across 511,959 documents, an agent without an index faces tens of thousands of directories. If its first two tool calls enter the wrong folder due to deceptive filenames, subsequent tool calls merely accumulate costs in irrelevant branches. This is a severe error-cascading dynamic.
2. **BM25's inverted index provides virtually costless global pruning:** Within milliseconds, an inverted index uses term frequency (TF) and inverse document frequency (IDF) to prune a 500,000-document search space down to the top-5 or top-10 most promising candidates. It does not need deep semantic comprehension; as long as documents contain distinctive names, version strings, or policy codes, it exposes them directly to the surface.
3. **The Agent should act as a judge, not a patrol officer:** The true strength of agentic reasoning lies in inspecting the narrowed 5 to 10 candidates, reconciling version contradictions, verifying completeness across atomic claims, and discarding decoy traps. Asking the agent to perform both global exploration and fine-grained synthesis simultaneously is a misallocation of capability.

In short, **BM25 does not out-reason the agent; rather, its global candidate discovery at scale is vastly superior to blind file browsing.** Combining the two (Agent+BM25) pairs BM25's global pruning with the agent's contextual discrimination.

## Walk one example through the method

To trace the operational mechanics through a concrete enterprise policy inquiry:

1. **Input:**
   - User Query: "Under Acme's internal operating guidelines, what is the approved exception process and maximum reimbursement limit for remote workstation cybersecurity equipment revised in Q3 2025?"
   - Corpus Environment: 511,959 heterogeneous internal documents (Jira tickets, Slack logs, Wiki pages, superseded 2024 drafts, adversarial trap documents, and the finalized Q3 2025 policy document).
2. **Intermediate representation:**
   - *BM25 Index Layer:* Tokenizes the query into terms like "Acme", "Q3 2025", "remote workstation", "cybersecurity equipment", "reimbursement limit", and "exception process". The inverted index compresses common words via IDF while heavily weighting distinctive tokens like "Q3 2025" and "cybersecurity", producing a ranked top-5 candidate set.
   - *Raw File Tree (Baseline):* The corpus exists as nested directory structures (e.g., `/company/it/security/policies/2025/`, `/hr/benefits/remote/archive/`).
3. **Decision or transformation:**
   - *Raw File-System Agent Behavior:* The agent calls `ls("/company/policies")`, observes several subdirectories, guesses HR, calls `cd("/hr/benefits")`, finds an outdated 2024 document named `remote_stipend_guidelines.md`, and continues searching in that directory. Attracted by decoys, it expends 25+ tool calls, accumulates a massive context window, and ultimately hits its 80-call limit or commits to an erroneous answer.
   - *Agent+BM25 Behavior:* The agent's initial tool call is forced to execute BM25 over the raw query. BM25 immediately surfaces 5 top candidates directly from the 511,959 documents (including the official Q3 2025 policy, a deceptive trap document with invalid signatures, and an exception request form). The agent reads these 5 candidates, identifies that the trap document was signed by an unauthorized officer, and extracts the valid rule: "$1,500 maximum limit with VP approval."
4. **Output:**
   - The system synthesizes an aligned response covering all atomic facts from the gold answer, explicitly warning against the invalidated draft terms.
5. **Likely failure point:**
   - *Vocabulary Mismatch:* If the user query uses informal colloquialisms (e.g., "wfh wifi router expense payback") while official policy documents strictly use "remote operating telecommunications hardware stipend", BM25's lexical matching may fail to surface the gold document in top-5 candidates. In such situations, dense embeddings or hybrid retrieval are required.

## Technical mechanism

Wang et al.'s experimental setup enforces rigorous controls across four primary architectural layers:

### 1. Corpus ladder architecture

EnterpriseRAG-Bench constructs a controlled synthetic enterprise repository:
- **Bedrock Layer:** Consists of 500 questions, 722 gold documents, 326 trap documents (semantically similar but factually altered), 99 lure documents (unanswerable queries), and two organizational overview documents. After removing duplicate entries across categories, the bedrock establishes tier 0 with $N_0 = 1,144$ documents (1.7M tokens).
- **Nested Corpus Ladder:** Defines a sequence of 28 tiers $\{T_i\}_{i=0}^{27}$, expanding geometrically:
  $$ N_i \approx N_0 \times (1.25)^i $$
  Scaling from tier 0 ($N_0 = 1,144$ documents, 1.7M tokens) to tier 27 ($N_{27} = 511,959$ documents, 600.8M tokens). The 500 evaluation questions, gold documents, and adversarial traps remain identical across all rungs, with background noise documents added in a stratified order across source types (wiki, email, chat, ticket, meeting transcripts). This guarantees that accuracy degradation reflects corpus scaling interference rather than evaluation drift.

### 2. BM25 scoring formulation

BM25 serves as the sparse lexical baseline. Given query $Q = \{q_1, q_2, \dots, q_m\}$ and document $D$:

$$ \text{Score}(D, Q) = \sum_{i=1}^{m} \text{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)} $$

Where inverse document frequency is computed as:

$$ \text{IDF}(q_i) = \ln \left( \frac{N - n(q_i) + 0.5}{n(q_i) + 0.5} + 1 \right) $$

Here $f(q_i, D)$ is term frequency, $|D|$ and $\text{avgdl}$ denote document length and mean document length, with parameters configured to $k_1 = 1.5, b = 0.75$. As corpus size $N$ expands to over 500,000 documents, common terms experience severe IDF attenuation while unique domain terms gain substantial discriminative power.

### 3. Seven native retrieval pipelines

The study evaluates seven pipelines across four conceptual approaches:
- **BM25:** Standard inverted index feeding top-5 chunks to the reader.
- **DenseRAG:** Qwen3-Embedding-0.6B with 1,200 token chunks and 100 token overlap, retrieving top-5 chunks by vector similarity.
- **HippoRAG 2:** Biologically inspired hippocampal memory indexing over entity graphs.
- **MS-GraphRAG:** Microsoft's GraphRAG framework utilizing LLMs for community summaries and entity-relationship extraction.
- **LightRAG:** Dual-level graph indexing architecture.
- **LinearRAG:** Graph indexing using local NER and embedding models without generative LLM extraction calls.
- **File-System Agent:** Qwen3.6-27B policy model with tools (`ls`, `grep`, `view`) and an 80-call budget per query.

### 4. Shared reader harness and scoring protocols

To eliminate reader capability as a confounding variable, all systems share identical synthesis infrastructure:
- **Reader Model:** Qwen3.6-27B served via vLLM with temperature = 0 and thinking disabled.
- **Official Combined Score:** Evaluated via an independent LLM judge in two sequential steps: first verifying semantic alignment with the gold answer; if aligned, scoring atomic fact completeness. If an answer fails alignment, completeness defaults to zero.
- **Document Recall:** Exact set overlap between retrieved document IDs and gold document IDs for answerable queries.
- **Disaggregated Cost Accounting:** Tracking generative build tokens, embedding build tokens, query tokens, LLM API calls, and single-stream inference latency on an idle server.

## How to read the evidence

Interpreting the experimental results requires examining accuracy in conjunction with scale, construction overhead, and query typology:

### 1. Main ladder accuracy and crossover point (Section 4.2, Table 1, Figure 3)

On the bedrock tier ($N_0 = 1,144$), the File-System Agent reaches a point estimate of 77.4, compared to 74.7 for BM25. However, their 95% bootstrap confidence intervals overlap (73.9–80.8 vs. 71.4–77.9), demonstrating no immediate superiority for BM25 at minimal scale.

As corpus volume increases, the curves cross around 10 million corpus tokens (approximately $N = 8,750$ documents). At the full 511,959-document scale, BM25 maintains a score of 50.5, while the File-System Agent falls to 30.7 and DenseRAG drops to 29.9.

![Figure 3: official combined score over the nested corpus ladder](https://arxiv.org/html/2607.26497v3/x3.png)

*Figure 1 (paper Figure 3, §4.2): official combined score with 95% confidence bands; the curves cross around 10M tokens and graph curves end at their largest feasible tier. Source: [arXiv HTML Figure 3](https://arxiv.org/html/2607.26497v3#S4.F3). The image is provided under the [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html); author and source attribution are retained.*

Key observations regarding Figure 1:
- "Around 10M tokens" is designated in Appendix D as a rounded regime marker reflecting when neighboring measured tiers invert their point-estimate ordering, not an exact regression threshold.
- Graph pipelines terminate early (HippoRAG 2 at 131,876 documents scoring 41.0; MS-GraphRAG at 8,750 documents scoring 38.4; LightRAG at 2,254 documents scoring 42.5). Missing entries represent **unbuilt or unevaluated tiers**, not zero scores.

### 2. The power-law wall of index construction cost (Section 4.4, Table 2, Figure 4)

The primary barrier for graph-based retrieval in large corpora is pre-deployment index generation. Power-law fits ($C(x) = a \cdot x^b$) illustrate this scaling wall:

![Figure 4 left: construction-token scaling](https://arxiv.org/html/2607.26497v3/x4.png)

*Figure 2 (paper Figure 4 left panel, §4.4): construction tokens and fitted power laws; hollow markers for embedding-only builders should not be read as zero CPU or storage cost. Source: [arXiv HTML Figure 4](https://arxiv.org/html/2607.26497v3#S4.F4). The image is provided under the [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html); author and source attribution are retained.*

- HippoRAG 2 scales nearly linearly ($b = 1.01$), extrapolating to approximately 2.9B generative tokens on the full corpus (around 3 single-instance days).
- MS-GraphRAG extrapolates to roughly 7.9B tokens (50 instance-days).
- LightRAG exhibits a steeper exponent ($b = 1.36$), extrapolating to 102B tokens on the full corpus (roughly 4 instance-years).
- Note that while LinearRAG and DenseRAG show hollow points (zero generative tokens), DenseRAG requires 659.4M embedding tokens. Zero generative tokens does not imply zero computation, storage, or indexing work.

### 3. Query cost and budget exhaustion analysis (Section 4.4, Table 3)

During inference, BM25, DenseRAG, and HippoRAG 2 consume approximately 5.8K, 4.9K, and 6.5K query tokens per question, governed by the shared top-5 reader prompt.

In contrast, the File-System Agent scales from 226K tokens per question on the bedrock to 343K tokens at $N=21,614$ (nearly 60x BM25). Its budget exhaustion rate (hitting the 80-call limit) reaches 15% at $N=131,876$ and 31% at full scale. Critically, the authors show that accuracy degrades even among questions that complete within the 80-call budget, confirming that performance decline is driven by state-space disorientation rather than arbitrary truncation.

### 4. Question-type breakdown: BM25 is not a silver bullet (Section 4.5, Figure 5)

An analysis across 9 question types at tier $N=42,587$ (Figure 5 right panel) reveals essential counterexamples:

![Figure 5 right: official combined score by question type](https://arxiv.org/html/2607.26497v3/x7.png)

*Figure 3 (paper Figure 5 right panel, §4.5): question-type slice at (N=42{,}587); labels show question counts, and MS-GraphRAG/LightRAG cannot build at this tier. Source: [arXiv HTML Figure 5](https://arxiv.org/html/2607.26497v3#S4.F5). The image is provided under the [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html); author and source attribution are retained.*

- The File-System Agent outperforms BM25 on four categories: **intra-document synthesis**, **project-related inquiries**, **completeness queries**, and **conflicting-information resolution**. In completeness questions, the Agent scores 56 versus 27 for BM25.
- BM25 leads or ties on the remaining five categories, driven by exact-match entity lookups.
- On not-found queries, one-shot BM25 reader prompts achieve high scores primarily through abstention, whereas interactive agents tend to hallucinate unverified assertions.

### 5. Matched controls: isolating retrieval substrate from agency (Section 5.1, Table 4)

Table 4 presents the paper's most impactful engineering intervention. Holding the agent harness, model, prompt, judge, and 80-call budget identical across 150 questions, the authors substituted file exploration with a BM25 top-5 retrieval tool:

| Access Substrate & Configuration | Bedrock Score | Full-Scale Score | Full-Scale Document Recall | Calls / Question | Tokens / Question |
| --- | ---: | ---: | ---: | ---: | ---: |
| Native BM25 (One-shot Reader) | 81.3 | 54.8 | 65.6% | 1.00 | 5.8K |
| Raw File-System Agent | 87.1 | 36.9 | 36.8% | 36.12 | 895K |
| **Agent + BM25 Candidate Tool** | **90.1** | **69.4** | **72.4%** | **5.79** | **101K** |

This comparison highlights crucial architectural dynamics:
- Providing the agent with a BM25 retrieval tool increases full-scale score from 36.9 to 69.4 and doubles document recall from 36.8% to 72.4%, while reducing query tokens by almost 9x.
- On questions where systems retrieve at least one gold document, the raw File-System Agent scores 85.9 versus 73.8 for BM25. However, the raw agent's full-scale any-gold hit rate plummets to 39.0%, whereas BM25 achieves 71.6%.
- This demonstrates that **agentic reasoning and synthesis capabilities remain strong at scale; the primary failure mode is failing to discover relevant documents initially.**

## Evidence map

To ensure balanced technical interpretation, we categorize findings across four explicit levels of attribution:

### Direct paper evidence

The following points represent verified empirical observations under the benchmark's conditions:
1. Across 28 nested tiers in EnterpriseRAG-Bench, BM25 and File-System Agent accuracy curves invert around 10 million corpus tokens, with BM25 maintaining higher accuracy beyond this scale (Section 4.2, Table 1, Figure 3).
2. On 150 matched questions at full scale (511,959 documents), equipping the agent with BM25 top-5 retrieval yields a score of 69.4 and 72.4% recall at 101K tokens/question, outperforming raw file exploration (36.9 score, 36.8% recall, 895K tokens/question) (Section 5.1, Table 4).
3. Graph indexing frameworks (MS-GraphRAG, LightRAG) exhibit steep power-law token scaling during construction, preventing completion at larger rungs (Section 4.4, Table 2, Figure 4).
4. At $N=42,587$, the File-System Agent outperforms BM25 on completeness, conflicting-information, and intra-document synthesis tasks (Section 4.5, Figure 5).

### Author causal claims

The following represent causal explanations offered by the study's authors:
1. The authors attribute the breakdown of file browsing at scale to error cascades in sequential decision-making over vast search trees.
2. The authors credit BM25's large-scale resilience to the inverted index providing deterministic, constant-overhead global candidate pruning.
3. The authors identify construction feasibility as the primary deployment constraint for GraphRAG in enterprise environments lacking partitioned index updates.

### Unsupported claims

The following assertions are **unsupported by the evidence and must not be assumed**:
1. **"BM25 is universally superior to dense or graph retrieval across all enterprise domains."** The benchmark emphasizes named entities and factual contradictions, favoring lexical match. Performance under extensive synonymy, colloquial phrasing, or multilingual queries was not demonstrated.
2. **"GraphRAG lacks production utility."** Graph pipelines were truncated due to single-instance compute budgets, not fundamental synthesis failure. With batch processing or incremental extraction, relational advantages remain plausible.
3. **"Agentic workflows are obsolete."** Agent+BM25 achieved the benchmark's highest overall score (69.4), underscoring the value of agency once candidates are retrieved.
4. **"Benchmark results transfer directly to enterprise production."** The synthetic corpus does not capture real-time updates, tenant isolation, or enterprise ACL hierarchies.

### Bloss0m engineering synthesis

Based on these boundaries, Bloss0m synthesizes the following production guidelines:
- **Layered Architecture:** Decouple systems into Global Candidate Discovery (Layer 1) and Deep Evidence Synthesis (Layer 2). Layer 1 should rely on efficient, cacheable inverted and vector indexes; Layer 2 should deploy agentic loops for validation, cross-document reconciliation, and completeness.
- **Query Routing:** Route simple factual lookups directly through BM25/Dense hybrid retrieval to a one-shot reader; route complex, multi-document synthesis queries to an agentic reasoning loop.

## Artifacts and reproducibility

Public artifact verification as of **2026-08-09**:
- **Primary Paper Source:** arXiv v3 [PDF](https://arxiv.org/pdf/2607.26497v3), [HTML](https://arxiv.org/html/2607.26497v3), and [TeX source archive](https://arxiv.org/src/2607.26497v3) are publicly accessible, containing the complete manuscript, appendices, and seven original figures.
- **Benchmark Code and Suite:** EnterpriseRAG-Bench is available on [GitHub](https://github.com/onyx-dot-app/EnterpriseRAG-Bench) under an MIT license, including harness code, `questions.jsonl`, and setup guides.
- **Dataset Hosting:** EnterpriseRAG-Bench files are hosted on [Hugging Face](https://huggingface.co/datasets/onyx-dot-app/EnterpriseRAG-Bench); files and dataset cards are accessible, though web preview tools experienced intermittent downtime on the check date. Data remains downloadable via official scripts.
- **Study Execution Package:** Paper-specific internal directories (`results/...`, `scripts/...`) and exact container images mentioned in Appendix L/M are not included in the public archive.
- **Reproduction Scope:** The metrics cited in this reading reflect author-reported results from arXiv:2607.26497v3; an independent 28-tier replication was not conducted. Teams seeking local verification should download the official benchmark and evaluate a targeted subset (e.g., 1K, 10K, and 50K documents) across BM25 and Agent+BM25 controls.

## Bloss0m engineering judgment and when not to use it

We outline the following operational principles and boundary conditions for engineering adoption:

### 1. When to adopt a BM25-first + downstream agent architecture
- **High Entity Density:** Workloads involving technical documentation, part catalogs, API references, or Jira issues where exact identifiers provide reliable retrieval anchors.
- **Strict Latency and Token Budgets:** Production systems requiring sub-second responses and low serving costs, where one-shot BM25 keeps query contexts within 6K tokens.
- **Granular Access Control (ACL):** Environments requiring boolean permission filtering, which executes efficiently inside inverted search engines like Elasticsearch or OpenSearch.

### 2. When not to rely solely on BM25
- **Pronounced Vocabulary Mismatch:** Queries featuring colloquial descriptions, paraphrases, or cross-lingual terms where lexical match degrades. In these settings, dense vector models or HyDE query expansions are necessary.
- **Multi-hop Relational Reasoning:** Queries spanning relationship chains across disparate systems (e.g., tracing ownership across tickets, repositories, and specifications) where graph retrieval remains advantageous.
- **High-completeness Aggregations:** As demonstrated in Figure 5, completeness inquiries require iterative agentic exploration to gather comprehensive evidence.

> **Huahua's engineering note**
>
> Track “could not build” separately from “answered incorrectly.” An unfinished graph index is a deployment-coverage problem; a retrieved-but-wrong answer is a synthesis or judging problem. Collapsing both into one zero can distort an architecture decision.

## Three things to remember

1. **Technical idea:** Global candidate discovery and agentic evidence reasoning are distinct architectural responsibilities; never task an agent with unindexed file browsing when deterministic retrieval can prune the search space upfront.
2. **Evidence:** On the 511,959-document resweep, Agent+BM25 reached 69.4 accuracy and 72.4% recall at 101K query tokens, versus 36.9 accuracy and 895K tokens for raw file exploration, with BM25 crossing over around 10 million corpus tokens.
3. **Boundary:** Findings are situated within a synthetic, entity-rich enterprise benchmark; unfinished graph indexes reflect construction costs rather than zero performance; semantic paraphrasing and multi-hop queries still require hybrid and reranking architectures.

## Primary sources

- **Wang et al., BM25 Wins at Scale: A Scaling Study of Retrieval-Augmented Generation Paradigms:**
  - [arXiv:2607.26497 record](https://arxiv.org/abs/2607.26497)
  - [arXiv:2607.26497v3 full HTML](https://arxiv.org/html/2607.26497v3)
  - [arXiv:2607.26497v3 PDF](https://arxiv.org/pdf/2607.26497v3)
  - [arXiv:2607.26497v3 TeX source archive](https://arxiv.org/src/2607.26497v3)
  - [arXiv non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html)
- **EnterpriseRAG-Bench Resources:**
  - [EnterpriseRAG-Bench GitHub Repository](https://github.com/onyx-dot-app/EnterpriseRAG-Bench)
  - [EnterpriseRAG-Bench Hugging Face Dataset](https://huggingface.co/datasets/onyx-dot-app/EnterpriseRAG-Bench)
- **Bloss0m Internal Routes:**
  - [RAG vs. GraphRAG: A Systematic Evaluation](/en/paper-reading/07-GraphRAG-vs-RAG/)
  - [Enterprise RAG Implementation Guide](/en/blog/65-enterprise-rag-guide/)
  - [Agentic RAG Architectural Patterns](/en/blog/07-agentic-rag/)
