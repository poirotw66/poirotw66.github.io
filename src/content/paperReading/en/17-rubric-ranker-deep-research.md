---
title: "RubricRanker Deep Read: RAG Needs the Right Document Set, Not Just the Most Relevant Documents"
description: "A close reading of how RubricRanker uses query-specific search rubrics, SFT, and GRPO to train a document reranker, and what its deep-research and RAG benchmark results actually establish."
pubDate: 2026-08-07
updatedDate: 2026-08-07
tldr:
  - "RubricRanker changes the reranking target from individual-document relevance to set-level coverage, conciseness, consistency, authority, and timeliness."
  - "It reaches 60.1 on four sampled deep-research benchmarks, 2.6 points above Rank4Gen, and 40.0 average exact match across five RAG benchmarks."
  - "Cold-start SFT matters more than the later RL stage: removing SFT drops the three-dataset average from 52.5 to 48.3, while removing rubric-guided labels drops it to 49.2."
  - "The paper supports treating reranking as evidence-set selection, but remains dependent on GPT-5.1 rewards, sampled benchmarks, and downstream LLM judges."
audience:
  - "AI engineers building deep-research agents, RAG retrieval stacks, or evidence-set rerankers."
  - "Technical leads deciding whether set-level retrieval is worth its training and inference cost."
tags: ["Paper Reading", "RAG", "Deep Research", "Reranking", "Information Retrieval", "Evaluation"]
image: "/paperReading/17-rubric-ranker-deep-research/title_image.webp"
field: "Retrieval Systems"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
paper:
  title: "Training Documents Reranker with Search Rubrics for Deep Research Agent"
  authors:
    - "Wenhan Liu"
    - "Yu Lu"
    - "Qiaolin Xia"
    - "Hui Xu"
    - "Tong Zhao"
    - "Jian Xi"
    - "Yutao Zhu"
    - "Haijin Liang"
    - "Haibo Shi"
    - "Hao Wang"
    - "Zhicheng Dou"
  year: 2026
  venue: "arXiv cs.IR preprint, v1 (2026-08-04)"
  links:
    pdf: "https://arxiv.org/pdf/2608.03527v1"
    arxiv: "https://arxiv.org/abs/2608.03527"
    code: "https://github.com/8421BCD/RubricRanker"
series:
  id: "retrieval-systems"
  title: "Retrieval Systems"
  part: 3
  totalParts: 3
---

One of the most persistent RAG illusions is that a high-quality evidence context follows automatically from sorting individual documents by query relevance and truncating at top-k. For simple factual lookups, this approximation is often sufficient. For multi-step deep-research agents, however, it frequently omits critical sub-aspects, floods the prompt with repetitive text, and passes unauthoritative sources into the reasoning window. **RubricRanker** starts from an explicit premise: autonomous agents do not need documents that are merely individually relevant; they require a coherent evidence set that jointly supports a complete, authoritative answer.

As of August 7, 2026, this reading follows the **arXiv v1 preprint**; no separate conference, journal, or peer-reviewed OpenReview record is indexed as of this date. The authors provide a public [GitHub repository](https://github.com/8421BCD/RubricRanker), whose documentation links to model checkpoints, supervised fine-tuning (SFT) data, and reinforcement learning (RL) data hosted on ModelScope.

> **Huahua's engineering note**
>
> A reranker's output is not merely a ranking leaderboard; it is an evidence budget allocated to downstream reasoning models. Evaluating it requires inspecting what the selected set covers, what it duplicates, what contradictions it introduces, and whether sources carry genuine authority—not simply the relevance score of the top-ranked document.

## The paper in 90 seconds

- **Problem:** Traditional rerankers score documents independently via pairwise relevance, meaning a collection of top-ranked items offers no guarantee of set-level completeness, conciseness, factual consistency, or source credibility.
- **Core insight:** Refactor the reranking objective from document-level ranking to selecting an evidence set that collectively answers the query, guided by query-specific search rubrics for label synthesis and reinforcement learning rewards.
- **Strongest evidence:** On four sampled deep-research benchmarks, RubricRanker achieves an average score of **60.1**, outperforming the runner-up Rank4Gen by **2.6** points; ablations reveal that removing SFT cold start reduces average performance by **4.2** points and removing rubric-guided labels drops it by **3.3** points, whereas omitting the RL stage only causes a **1.4**-point decrease.
- **Main boundary:** Reported benchmark scores remain tied to downstream agent performance and LLM-judge evaluations; providing a superior evidence set does not prevent downstream agents from making reasoning errors, hallucinating claims, or misinterpreting source passages.

Across the four sampled deep-research benchmarks, RubricRanker reaches an average score of **60.1**, exceeding Rank4Gen's **57.5**. On five closed-form RAG benchmarks, it attains an average exact match of **40.0**, compared to **38.2** for Rank4Gen. At the agent execution level, it decreases search frequency: on HealthBench, Dr-Tulu search calls fall from 3.2 (RankT5) and 3.4 (Rank4Gen) to **2.9**; on ResearchQA, calls decrease from 3.2 and 3.5 to **2.9**.

These results support treating set-level reranking as a valuable architectural control point for agent retrieval pipelines. However, they do not prove universal evidence reliability or autonomous production-grade research validity. Evaluation scores remain mediated by downstream agents and LLM judges; assembling a better document collection cannot replace downstream verification or fact-checking.

## What to know first

Traditional rerankers treat post-retrieval ranking as a collection of independent query-document pairs. Given query $q$ and candidate document $d_i$, the model scores relevance $s(q, d_i)$ and returns the top-$k$ elements. This architecture relies on an unexamined assumption: that independent relevance scores sum to an optimal composite context.

RubricRanker redefines the operational formulation. Denoting the initial candidate pool as $\mathcal{D}_t=\{d_1,\ldots,d_n\}$, the reranker's goal is to directly output a selected subset $\mathcal{S}_t\subseteq\mathcal{D}_t$. This shifts the supervision signal from total ordering over arbitrary pairs to subset utility: learning to identify which combination of documents collectively resolves the information need.

The paper formalizes evaluation criteria into two distinct tiers of search rubrics:

1. **Set-level rubrics:**
   - **Relevance & Coverage:** Whether the combined set comprehensively covers all key facets, factual dimensions, and constraints needed to answer the query.
   - **Conciseness:** Whether the set actively eliminates redundancy, overlapping claims, and off-topic passages.
   - **Consistency:** Whether the selected documents avoid mutual factual contradictions or unaddressed inconsistencies.
2. **Document-level rubrics:**
   - **Authority:** Whether each source is credible, published by reputable institutions, or grounded in professional consensus (an irrelevant document does not satisfy this rubric merely by having a prestigious origin).
   - **Timeliness:** Whether the temporal freshness of the content satisfies the specific time constraints of the query.

Ten documents addressing clinical depression might all focus exclusively on cognitive behavioral therapy, omitting pharmacological treatments and lifestyle interventions while duplicating identical claims and citing unverified forum posts. Figure 1 illustrates this structural discrepancy between single-document relevance and evidence-set requirements.

![RubricRanker Figure 1: individual-document relevance does not guarantee coverage, conciseness, or authority](https://arxiv.org/html/2608.03527v1/x1.png)

*Figure 1 — The depression-treatment example illustrates the gap between individual-document relevance and evidence-set requirements. Paper Section 1. Source: [Liu et al., RubricRanker Figure 1](https://arxiv.org/html/2608.03527v1#S1.F1). The arXiv page states an arXiv.org perpetual non-exclusive license; this reading preserves the source link, and redistribution outside this article should be checked separately.*

## Core intuition

The mental model of traditional rerankers is an individual track race: every candidate document competes for an isolated relevance score, and the highest scorers advance. RubricRanker shifts this framing to team roster construction: even if a candidate document exhibits high individual relevance, its marginal value drops to zero if it merely duplicates evidence already provided by an existing selection. Conversely, a lower-ranked document that fills a missing clinical aspect (coverage) or supplies institutional consensus (authority) provides substantial marginal utility to the overall set.

Consequently, the unit of supervision transitions from "Is document $A$ more relevant than document $B$?" to "Does subset $\mathcal{S}_t$ maximize complementary information while minimizing noise and contradiction?" Although explicit rubric texts are not provided to the model during inference, the training process bakes these holistic set criteria directly into the model's selection weights.

## Walk one example through the method

Using the depression-treatment query illustrated in Figure 1, consider a scenario where a deep-research agent issues a sub-query: "What are the primary adult depression treatments, clinical indications, and comparative outcomes?"

1. **Input:** The upstream retriever returns 30 candidates $\mathcal{D}_t=\{d_1,\ldots,d_{30}\}$. The raw pool is heavily skewed toward popular psychotherapy discussions, with only isolated passages mentioning pharmacotherapy, neurostimulation, clinical guidelines, and contraindications.
2. **Intermediate representation:** In the offline training pipeline, GPT-5.1 leverages web search to synthesize a reference answer detailing necessary factual facets. It then instantiates fixed meta-rubrics into weighted query-specific rubrics (graded 1 to 5):
   - Set-level: The set must represent multiple modalities including psychotherapy, pharmacotherapy, and somatic treatments (weight 5); eliminate verbatim repetition (weight 4); ensure contraindications do not conflict without clinical context (weight 4).
   - Document-level: Guideline statements must stem from accredited psychiatric bodies or peer-reviewed journals (weight 5); eliminate anecdotal forum discussions (weight 5).
3. **Decision or transformation:**
   - **Cold-start SFT:** The teacher model (GPT-5.1) inspects the query, agent trajectory history, rubrics, and the 30 candidate documents to output a balanced subset ID list (such as `[2] [7] [19]`) as silver supervision. The student model (Qwen3-8B) receives only the query and candidate texts—without seeing the rubrics—learning to output the document IDs directly.
   - **Rubric-guided RL:** When the student model proposes an output candidate set during rollout, a GPT-5.1 judge computes set-level and document-level rubric scores, forming an aggregated scalar reward; invalid output syntaxes immediately receive a -1 penalty.
4. **Output:** At deployment, RubricRanker ingests the query and 30 candidates, emitting an evidence set $\mathcal{S}_t$ (e.g., one systematic psychotherapy review, one pharmacological guideline, and one neurostimulation trial summary) to the downstream agent.
5. **Likely failure point:** If the synthesized reference answer omits an essential treatment category (such as transcranial magnetic stimulation), the generated rubrics will inherit that omission. Furthermore, even when an optimal evidence set is provided, downstream agents can still misinterpret comparative statistics or fabricate citations during complex synthesis.

## Technical mechanism

RubricRanker's pipeline integrates two primary phases: query-specific search rubric construction and two-stage reranker model training.

![RubricRanker Figure 2: query-specific search rubrics and two-stage reranker training](https://arxiv.org/html/2608.03527v1/x2.png)

*Figure 2 — Reference-answer synthesis generates query-specific rubrics, followed by SFT and rubric-based RL training. Paper Section 4. Source: [Liu et al., RubricRanker Figure 2](https://arxiv.org/html/2608.03527v1#S4.F2). The arXiv page states an arXiv.org perpetual non-exclusive license; this reading preserves the source link, and redistribution outside this article should be checked separately.*

### 1. Query-specific Rubric Construction

For complex multi-turn research tasks, the authors run Dr-Tulu-8B across OpenScholar, SearchArena, GlaiveAI-Reasoning-v1-20M, and WebWalker-Silver to extract realistic intermediate agent sub-queries.

Because autonomous sub-queries typically lack standardized ground-truth answers, the framework prompts GPT-5.1 with web search to synthesize an extensive reference answer capturing necessary factual facets, constraints, and scope. GPT-5.1 then translates meta-rubrics into tailored query-specific rubrics across set and document levels, assigning each criterion an importance weight between 1 and 5. For standard RAG queries (such as HotpotQA and NQ), rubrics are generated directly from the existing gold reference answers.

### 2. Stage 1: Cold-start Supervised Fine-Tuning (SFT)

During the SFT stage, candidate list sizes are randomly sampled between 10 and 40 documents. The teacher model (GPT-5.1) reviews the query, preceding agent thought history, query-specific rubrics, and the candidate pool to generate filtered document ID sets as silver training labels.

The student model is built on Qwen3-8B. Crucially, the student receives only the query and candidate documents, **with no access to rubric descriptions**. This ensures inference remains lightweight and eliminates the latency and token overhead of generating dynamic rubrics at serving time. SFT data comprises 9,843 curated query instances.

### 3. Stage 2: Rubric-guided Reinforcement Learning (GRPO)

In the second stage, the student outputs candidate document set $D$. A GPT-5.1 judge scores set-level rubrics $sr_i$ and document-level rubrics $dr_j$. The aggregated rubric reward is defined as:

$$
P^r(D)=\frac{\sum_i sw_i S(sr_i,D)+\sum_j dw_j F(dr_j,D)}{\sum_i sw_i+\sum_j dw_j},
$$

where:
- $S(sr_i, D)$ denotes the set-level evaluation score for criterion $sr_i$ over document set $D$;
- $F(dr_j, D)$ denotes the average document-level score for criterion $dr_j$ across the individual documents in $D$;
- $sw_i$ and $dw_j$ represent importance weights assigned to the respective rubrics;
- If the model output violates the structured document ID syntax (e.g., `[1] [3] [2]`), the reward defaults to **-1**.

Policy parameters are optimized using Group Relative Policy Optimization (GRPO). The RL training set contains 14,624 queries, trained over 150 optimization steps with 8 rollouts per sample on an 8 × NVIDIA H20 GPU cluster. Calling GPT-5.1 on every rollout incurs substantial offline computational and API overhead.

## How to read the evidence

The empirical evaluation examines deep-research agents, closed-form question answering, ablation breakdowns, and operational candidate trade-offs.

### 1. Deep Research Benchmarks (Table 1)

- **Question:** Does set-level evidence selection improve downstream research agent output compared to pairwise and generative rerankers?
- **Controls:** Sampled evaluations across HealthBench (100 queries), WebWalkerQA (200 queries), DeepResearchBench (100 queries), and ResearchQA (100 queries). Rerankers filter top-30 candidates retrieved via Google Search API, with final answers evaluated by benchmark-specific LLM judges.
- **Observation:** As shown in Table 1, RubricRanker secures the top score across all four benchmarks, averaging **60.1**, outperforming Rank4Gen (57.5) by **2.6** points and initial retrieval (54.0) by **6.1** points.

| Method | WebWalkerQA | HealthBench | DRB | ResearchQA | Avg. |
| --- | ---: | ---: | ---: | ---: | ---: |
| Initial retrieval | 44.5 | 55.2 | 45.3 | 71.1 | 54.0 |
| BGE-Reranker-Large | 52.0 | 58.7 | 46.5 | 71.2 | 57.1 |
| RankT5 | 53.0 | 57.0 | 46.6 | 72.8 | 57.4 |
| SetR | 49.0 | 58.7 | 44.8 | 73.3 | 56.5 |
| Rank4Gen | 52.0 | 59.2 | 46.6 | 72.0 | 57.5 |
| RubricRanker | **58.0** | **61.5** | **46.8** | **74.2** | **60.1** |

- **Explanation:** Set-level coverage and redundancy filtering deliver higher factual density to downstream agent contexts, leading to more thorough report synthesis.
- **Boundary:** DeepResearchBench utilizes Gemini 2.5 Flash as its judge, whereas ResearchQA relies on GPT-4.1-mini; score metrics across benchmarks are not on a standardized scale, and LLM judges possess intrinsic stylistic and length biases.

### 2. Closed-form RAG Generalization (Table 2)

- **Question:** Can a selector trained on research sub-queries generalize effectively to standard closed-form RAG?
- **Controls:** Evaluated on a December 2018 Wikipedia dump; BGE retrieves top-30 passages; Qwen3-8B generates responses; performance is scored via Exact Match (EM).
- **Observation:** Table 2 demonstrates that RubricRanker attains an average EM of **40.0**, improving upon Rank4Gen (38.2) and initial retrieval (34.3).

| Method | HotpotQA | Bamboogle | NQ | PopQA | TriviaQA | Avg. EM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial retrieval | 29.8 | 15.2 | 31.0 | 37.2 | 58.4 | 34.3 |
| BGE-Reranker-Large | 35.3 | 17.6 | 28.0 | 40.4 | 60.8 | 36.4 |
| Rank4Gen | 35.1 | 20.0 | 33.2 | 41.0 | 61.7 | 38.2 |
| RubricRanker | **38.0** | **23.2** | **34.0** | **42.2** | **62.4** | **40.0** |

- **Explanation:** Selecting complementary passages enhances multi-hop reasoning and factual recall even for brief factoid extraction.
- **Boundary:** Wikipedia articles are cleanly formatted and curated; these results do not automatically transfer to noisy enterprise data lakes, multilingual corpuses, or real-time streaming data.

### 3. Ablation Study: SFT and Rubric Labels Drive Gains (Table 3)

- **Question:** Which architectural component drives performance gains—RL optimization, SFT cold start, or rubric supervision?
- **Controls:** Evaluated across WebWalkerQA, HealthBench, and HotpotQA; full RubricRanker averages **52.5**.
- **Observation:** As detailed in Table 3, removing RL leads to a modest **1.4**-point drop; omitting SFT triggers a **4.2**-point drop; omitting rubrics causes a **3.3**-point decline; and substituting relevance-ranking labels leads to a **4.4**-point deficit.

| Variant | WebWalkerQA | HealthBench | HotpotQA | Avg. |
| --- | ---: | ---: | ---: | ---: |
| RubricRanker | 58.0 | 61.5 | 38.0 | **52.5** |
| w/o RL | 55.0 | 61.0 | 37.2 | 51.1 |
| w/o SFT | 48.0 | 61.0 | 35.8 | 48.3 |
| w/o rubrics | 51.5 | 60.0 | 36.0 | 49.2 |
| Relevance-ranking labels | 50.0 | 59.2 | 35.0 | 48.1 |

- **Explanation:** The primary catalyst is not policy optimization alone, but the construction of rubric-aligned set-level silver labels combined with supervised cold start.

### 4. Candidate Budgets and Search Call Trade-offs (Figures 3 and 4)

In Figure 3, candidate depths are swept across 10, 20, 30, 40, and 50 documents. WebWalkerQA performance plateaus near 30 candidates, while HotpotQA exhibits slight degradation beyond 40. Constraining the candidate window omits valuable tail evidence, while overly deep candidate sets introduce context distraction and degrade model attention.

![RubricRanker Figure 3: the effect of candidate count on WebWalkerQA and HotpotQA](https://arxiv.org/html/2608.03527v1/x3.png)

*Figure 3 — Candidate-count performance trade-off. Paper Section 5. Source: [Liu et al., RubricRanker Figure 3](https://arxiv.org/html/2608.03527v1#S5.F3). The arXiv page states an arXiv.org perpetual non-exclusive license; this reading preserves the source link, and redistribution outside this article should be checked separately.*

In Figure 4, the authors inspect search call frequencies executed by Dr-Tulu under different rerankers.

![RubricRanker Figure 4: Dr-Tulu search calls with different rerankers](https://arxiv.org/html/2608.03527v1/x4.png)

*Figure 4 — Dr-Tulu search calls across different rerankers. Paper Section 5. Source: [Liu et al., RubricRanker Figure 4](https://arxiv.org/html/2608.03527v1#S5.F4). The arXiv page states an arXiv.org perpetual non-exclusive license; this reading preserves the source link, and redistribution outside this article should be checked separately.*

RubricRanker reduces average search calls on HealthBench to 2.9 (compared to 3.2 for RankT5 and 3.4 for Rank4Gen) and on ResearchQA to 2.9. However, fewer search calls do not guarantee lower system costs: the token overhead of feeding candidate pools into an 8B generative selector, combined with GPU serving latency, must be weighed in the total cost model.

## Evidence map

### Direct paper evidence

- **Downstream performance gains:** Across four sampled deep-research benchmarks (Table 1), RubricRanker scores 60.1, exceeding baseline configurations (54.0–57.5) by 2.6 to 6.1 points.
- **Closed-form RAG transfer:** Across five Wikipedia-based RAG benchmarks (Table 2), average Exact Match reaches 40.0, outperforming Rank4Gen's 38.2.
- **Component ablation attribution:** Ablation experiments (Table 3) show that removing SFT degrades average performance by 4.2 points, removing rubric labels degrades it by 3.3 points, and removing RL causes a 1.4-point drop.
- **Search frequency reduction:** Trajectory analysis (Figure 4) documents a drop in Dr-Tulu search calls on HealthBench and ResearchQA from 3.2–3.5 down to 2.9.
- **Candidate ceiling effects:** Candidate sweeps (Figure 3) demonstrate that performance saturates around 30 documents on WebWalkerQA and begins decaying past 40 on HotpotQA.

### Author causal claims

- The authors claim performance improvements stem directly from RubricRanker satisfying holistic set-level criteria (coverage, conciseness, consistency, authority, timeliness) that independent relevance scoring ignores.
- The authors attribute search call reductions to the selector providing complementary evidence in earlier turns, enabling agents to satisfy stopping conditions sooner.

### Unsupported claims

- **Unverified judge objectivity:** The paper does not prove that GPT-5.1 rubric evaluations align better with genuine user information needs than human domain experts.
- **Absence of intrinsic set evaluation:** The study does not evaluate the selected document set through direct factual recall metrics, relying entirely on downstream end-to-end generation scored by LLM judges.
- **Unsubstantiated total cost savings:** The paper does not prove that reduced search calls result in lower end-to-end operational inference latency or serving costs once 8B model token budgets are accounted for.
- **Unverified robustness in regulated domains:** The authors do not evaluate behavior on non-English documents, real-time news streams, or enterprise compliance settings.

### Bloss0m engineering synthesis

- **Pipeline placement:** RubricRanker should operate strictly as an evidence-budget optimizer positioned between broad vector/keyword retrieval and agent reasoning.
- **Separation of concerns:** A learned neural selector should not replace deterministic compliance mechanisms; source authority and temporal freshness in high-stakes domains require explicit metadata filters and policy gates.
- **Cost-latency trade-offs:** Serving an 8B generative selector introduces noticeable GPU latency; for small retrieval pools (fewer than 10 documents), traditional cross-encoders or rule-based heuristics remain more cost-effective.

## Artifacts and reproducibility

As of August 7, 2026, the official [GitHub repository](https://github.com/8421BCD/RubricRanker) is publicly accessible under an MIT license, providing evaluation scripts, LLaMA-Factory SFT recipes, and VERL GRPO configurations. The repository links to ModelScope endpoints for the [model checkpoint](https://modelscope.cn/models/lwhlwh/rubricranker_sft_rl), [SFT data](https://modelscope.cn/datasets/lwhlwh/rubricranker_sft_data), and [RL data](https://modelscope.cn/datasets/lwhlwh/rubricranker_rl_data).

The experimental metrics cited in this reading reflect author-reported results; full benchmarks were not independently rerun on separate compute clusters.

For reproduction, a minimal inference smoke test is accessible: using Qwen3-8B as generator and BGE as retriever on a small HotpotQA subset, teams can compare selected sets and EM across BGE-Reranker-Large, Rank4Gen, and RubricRanker. However, full training reproduction entails high operational barriers, requiring Serper API access, substantial GPT-5.1 API reward budgets, an 8 × NVIDIA H20 GPU environment, and extensive dataset pre-processing.

## Bloss0m engineering judgment and when not to use it

### When to use it

1. **Multi-faceted research queries:** Tasks requiring synthesis across disparate sub-topics, contrasting clinical options, or complex trade-offs where single documents fail to cover the problem space.
2. **High candidate redundancy and mixed quality:** Scenarios where search APIs or dense indices return repetitive passages mixed with questionable sources, requiring set-level pruning before prompt assembly.
3. **Strict agent context limits:** Systems where prompt token budgets or context distraction require maximizing the marginal information density of top-k inputs.
4. **Observable set tracking:** Production environments equipped to log, trace, and audit selected document IDs for debugging and alignment checks.

### When not to use it

1. **Small corpuses or deterministic collections:** Repositories where clean metadata or small retrieval pools (<10 candidates) make an 8B neural selector an unnecessary source of latency and operational cost.
2. **Ultra-low latency applications:** User-facing conversational interfaces that cannot tolerate the end-to-end generation delay of an 8B model inside the retrieval loop.
3. **Regulated legal and clinical compliance:** Contexts where source authority and freshness require strict deterministic guarantees, whitelists, or timestamp verification rather than learned model preferences.
4. **Unaligned evaluation pipelines:** Workflows lacking rigorous end-to-end baselines, where adding a complex set-level reranker risks masking upstream indexing defects.

For deeper architectural context, cross-reference this analysis with [RAG-MCP's analysis on prompt bloat](/en/paper-reading/04-rag-mcp/) and [the systematic RAG vs. GraphRAG evaluation](/en/paper-reading/07-graphrag-vs-rag/): the former examines context budget constraints, while the latter reinforces relying on empirical metrics over architectural hype.

## Three things to remember

1. **Technical idea:** RubricRanker reframes reranking from pairwise document relevance to set-level evidence selection.
2. **Evidence:** Table 3 establishes that rubric-guided set labels and SFT cold start drive primary performance gains (3.3 to 4.2 points), while RL fine-tuning provides an incremental boost (1.4 points).
3. **Boundary:** It optimizes the evidence budget delivered to reasoning agents, but does not guarantee factual correctness, accurate citations, or regulatory compliance downstream.

## Primary sources

- [RubricRanker arXiv record](https://arxiv.org/abs/2608.03527): Version history, authors, and abstract.
- [RubricRanker full paper](https://arxiv.org/html/2608.03527v1): Figures 1–4, Tables 1–4, Sections 4–5, and reported limitations.
- [RubricRanker official repository](https://github.com/8421BCD/RubricRanker): Source code, MIT license, evaluation, and training scripts.
- [ModelScope model](https://modelscope.cn/models/lwhlwh/rubricranker_sft_rl), [SFT data](https://modelscope.cn/datasets/lwhlwh/rubricranker_sft_data), and [RL data](https://modelscope.cn/datasets/lwhlwh/rubricranker_rl_data): Official artifacts referenced in the project documentation.
