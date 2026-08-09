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
image: "/paperReading/13-bm25-wins-at-scale/title_image.png"
field: "NLP"
difficulty: "intermediate"
showToc: true
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

- **Problem:** RAG paradigms are often compared at one corpus size, hiding joint accuracy, construction-cost, query-cost, and latency scaling.
- **Core insight:** 28 nested corpus tiers (1,144 to 511,959 documents) hold reader/judge and adversarial bedrock fixed while comparing lexical, dense, graph, and file-system agency; a retrieval-swap control isolates access substrate.
- **Strongest evidence:** at large shared tiers, BM25 reportedly overtakes raw file-system agency around 10M corpus tokens; a matched 150-question resweep gives Agent+BM25 69.4 versus raw-file agency 36.9 (Section 5.1; Figure 4; Table 4).
- **Main boundary:** EnterpriseRAG-Bench is fictional and enterprise-shaped, with 500 questions and one main reader/judge; no public executable data/benchmark artifact is confirmed, so this is not “BM25 always wins.”

## Why the previous approach is insufficient

A fixed small benchmark hides each paradigm's build/query cost curve. File browsing can look plausible at small scale but does not provide scalable global candidate discovery. The paper does not reject dense/graph retrieval; it asks for access layers to be compared on the same ladder and harness (Sections 1 and 3).

## Core intuition and method

BM25 quickly discovers global lexical candidates; agentic reasoning should spend tokens on a ranked evidence set rather than replace indexing. The retrieval-swap control attaches the same harness to different substrates, making changed scores more plausibly about access layer. It still cannot make a fictional corpus transfer to your vocabulary or access policy (Figure 2; Section 4).

## Worked example: policy discovery at scale

A support agent must find a versioned policy among 500K internal documents. A raw-file agent explores folders and reads decoys; BM25 retrieves candidates using policy name, version, and exception phrases, then the same reader checks contradictions. If wording differs completely or the answer requires a multi-entity relation chain, lexical discovery can fail and dense/graph/hybrid retrieval may be needed. This is explanatory, not a paper query.

## How to read the evidence

**Figure 4 / Section 4.4** asks how costs change with corpus scale, not for a one-size ranking. **Section 5.1 / Table 4**'s 69.4 versus 36.9 is a matched 150-question resweep holding harness fixed while changing substrate; it supports the access-layer swap, not unconditional advantage for every agent loop. **Section 4.4 and appendix cost fits** return graph construction, query tokens, and latency to the decision. Cost extrapolation and close ranks remain bounded by confidence bands, judge, and fictional corpus.

## Artifacts and engineering decision

As of **2026-08-09**, arXiv v3 and TeX source are accessible; no direct official executable benchmark, data, or code endpoint was found, so artifact status is **unknown/missing**. Use BM25 as a measurable large-corpus baseline, then test dense/graph hybrids in query slices. Do not claim it replaces all retrieval without measuring vocabulary mismatch, index refresh, ACL filtering, and p95 latency.

## Three things to remember

1. The contribution is scale-and-cost control, not “BM25 magically beats everything.”
2. Global candidate discovery and agentic reasoning are separable layers.
3. Corpus size, vocabulary, access control, and SLA determine lexical, dense, graph, or hybrid choice.

This reading answers one reader question: **when an enterprise corpus grows from thousands of documents to hundreds of thousands, which substrate should handle global candidate discovery, and where should agentic reasoning begin?**

The short answer is scale-dependent. On the fixed questions, evidence, and adversarial documents in this synthetic enterprise-shaped corpus, there is no unconditional winner. File-System Agent has the higher point estimate at the smallest tiers; around 10 million corpus tokens, BM25 catches it and leads at every larger measured tier. At the full 600.8M-token corpus, BM25 reaches an official combined score of 50.5, compared with 30.7 for File-System Agent and 29.9 for DenseRAG. That supports a design choice of ranked discovery first and agentic reading second. It does not support the claim that BM25 is the best retriever for every enterprise system.

> **Huahua in one sentence**
>
> At large scale, the first bottleneck is not whether an agent can reason; it is whether the agent can reach the right documents. Give it globally ranked candidates before asking it to explore and synthesize.

## Paper identity and reading scope

Wang et al.'s **BM25 Wins at Scale: A Scaling Study of Retrieval-Augmented Generation Paradigms** is `arXiv:2607.26497v3`: v1 was submitted on 2026-07-29 and v3 was revised on 2026-07-31. It is an arXiv preprint, not a peer-reviewed or accepted conference paper; this reading does not imply otherwise. The primary paper, HTML, PDF, TeX source, and appendix are available through the [arXiv record](https://arxiv.org/abs/2607.26497), [HTML version](https://arxiv.org/html/2607.26497v3), [PDF](https://arxiv.org/pdf/2607.26497v3), and [TeX source archive](https://arxiv.org/src/2607.26497v3).

I read the Introduction, Related Work, Method, Experiment, Discussion, and Conclusion, together with Appendix B's corpus ladder; Appendix C's prompts, tools, and shared settings; Appendix D/F's figure metrics and full native ladder; Appendix G's matched controls; Appendix H's robustness checks; Appendix I's failure and stopping criteria; Appendix K's bootstrap intervals; and Appendix L/M's artifact-to-claim map and artifact contents.

## Evidence Map: what the paper directly supports, what authors claim, and our engineering judgment

| Voice | Evidence boundary | What this reading does with it |
| --- | --- | --- |
| **Paper directly supports** | The 28 nested EnterpriseRAG-Bench tiers, fixed bedrock, shared reader/judge, cost metering, and matched retrieval controls produce the reported crossover and scores. | Treat the result as conditional evidence about this corpus, workload, harness, and budget; cite the relevant table or appendix for each quantitative claim. |
| **Author or benchmark-maintainer claims** | The paper's Appendix L names internal-looking `results/` and `scripts/` paths; EnterpriseRAG-Bench separately describes public data and evaluation tooling. | Do not turn either statement into a claim that the exact study run, prompts, deployment image, or all outputs are publicly reproducible. |
| **Bloss0m engineering judgment** | “Rank globally, then let an agent reason over the narrowed evidence” is an interpretation of the matched controls, not a universal winner declaration. | Use it as a hypothesis to test against permission filters, update patterns, question types, latency, and operating cost in the target system. |

This separation is intentional: **paper evidence** is a measurement; **author claims** describe a release or interpretation; **our engineering judgment** is a decision rule that still needs local validation.

## Method: turn scale into a controlled variable

The paper's contribution is not another fixed-size RAG leaderboard. It varies corpus size while holding the main confounders as steady as possible. The method skeleton is:

1. **Build a fixed bedrock**: EnterpriseRAG-Bench has 500 questions, 722 gold documents, 326 traps, 99 lures, and two organizational overview scaffolds. Removing five cross-category duplicates leaves 1,144 documents in the smallest tier.
2. **Add background documents along a nested ladder**: one source- and noise-stratified order produces 28 strictly nested tiers, growing by about 1.25 per rung, from 1,144 documents and 1.7M tokens to 511,959 documents and 600.8M tokens. Questions, relevant documents, and adversarial documents stay in the bedrock while only the background corpus grows.
3. **Compare seven native pipelines**: BM25, DenseRAG, HippoRAG 2, MS-GraphRAG, LightRAG, LinearRAG, and a File-System Agent that searches the raw file tree without an index. Together they cover lexical, dense, graph-based, and agentic retrieval.
4. **Share the reader, segmentation, and cost meter**: the shared reader is Qwen3.6-27B at temperature 0 with thinking disabled, served through vLLM; the shared embedding model is Qwen3-Embedding-0.6B. Where applicable, systems use 1,200 tokenizer-token chunks, 100-token overlap, and top-5 chunks; File-System Agent has an 80-LLM-call budget per question. Build tokens, query tokens, calls, and single-stream latency on an idle server are measured separately.
5. **Separate agency from substrate**: in a matched resweep of the same 150 questions at bedrock and full scale, the raw file-search tool is replaced with a BM25 top-5 tool while model, harness, prompt, judge, and 80-call budget stay fixed. The first BM25 search is programmatically forced to use the original question, so its top-5 matches native BM25. This isolates the retrieval primitive from the agent policy.

## Evaluation: what does the score measure?

The official combined score first uses an LLM judge to check whether an answer aligns with the gold answer, then checks the completeness of atomic answer facts. If the answer is not aligned, completeness cannot rescue it. The paper also reports document recall, computed as exact set overlap between retrieved document IDs and gold document IDs for answerable questions. Each method/question/tier runs once; uncertainty is estimated with 10,000 question-level bootstrap resamples. Build and query tokens, LLM calls, and latency form the cost axis.

This design still depends on a judge, but the paper performs two useful checks: binary rescoring preserves every family ranking at nine shared scales, and an independent official judge agrees on 96.2% of pooled alignment verdicts, with 94.4–98.0% agreement per cell. Close pairs can still move by a few points; the broad family separation is the more stable signal.

## Results: the crossover matters more than a permanent winner

### 1. Main ladder: BM25 takes over after roughly 10M tokens

[Table 1's official main results](https://arxiv.org/html/2607.26497v3#S4.T1) show File-System Agent at 77.4 and BM25 at 74.7 on the bedrock. Their 95% intervals are 73.9–80.8 and 71.4–77.9, so they overlap. This is evidence against an immediate BM25 win at the smallest scale. Around 10M corpus tokens the point-estimate curves cross; at the full tier, BM25 scores 50.5 versus 30.7 for File-System Agent and 29.9 for DenseRAG. Graph results are reported only for tiers that were actually completed: HippoRAG 2 reaches 41.0 at 131,876 documents, MS-GraphRAG reaches 38.4 at 8,750, and LightRAG reaches 42.5 at 2,254. Dashes mean unbuilt or unevaluated, not zero.

![Figure 3: official combined score over the nested corpus ladder](https://arxiv.org/html/2607.26497v3/x3.png)

*Figure 1 (paper Figure 3, §4.2): official combined score with 95% confidence bands; the curves cross around 10M tokens and graph curves end at their largest feasible tier. Source: [arXiv HTML Figure 3](https://arxiv.org/html/2607.26497v3#S4.F3). The image is provided under the [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html); author and source attribution are retained.*

The “around 10M” wording matters. Appendix D says this is a rounded regime marker based on the interval between neighboring measured tiers where the point-estimate ordering changes. It is not a fitted threshold or a significance boundary. We should not rewrite it as a hard switch point for every enterprise system.

### 2. Build cost: graph-index problems appear before deployment

[Table 2 and Figure 4](https://arxiv.org/html/2607.26497v3#S4.F4) fit construction cost against corpus tokens. HippoRAG 2 is approximately linear with (b=1.01), extrapolating to about 2.9B generative tokens and roughly three single-instance days at the full corpus. MS-GraphRAG extrapolates to about 7.9B tokens and 50 instance-days. LightRAG's (b=1.36) fit extrapolates to about 102B tokens and four instance-years. These are construction-cost projections fitted to the 600.8M-token full corpus, not fully measured wall-clock results or dollar quotes.

![Figure 4 left: construction-token scaling](https://arxiv.org/html/2607.26497v3/x4.png)

*Figure 2 (paper Figure 4 left panel, §4.4): construction tokens and fitted power laws; hollow markers for embedding-only builders should not be read as zero CPU or storage cost. Source: [arXiv HTML Figure 4](https://arxiv.org/html/2607.26497v3#S4.F4). The image is provided under the [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html); author and source attribution are retained.*

LinearRAG is an important control here: it uses no generative build calls, but still incurs local NER and embedding work. DenseRAG completes the full corpus with 659.4M embedding tokens. In this paper, “build = 0” means zero generative model-token construction, not zero computation, storage, or indexing work.

### 3. Query cost: global ranking is closer to a fixed cost than local exploration

BM25, DenseRAG, and HippoRAG 2 use about 5.8K, 4.9K, and 6.5K query tokens per question, mostly from the shared reader prompt. File-System Agent grows from 226K at the bedrock to 343K at (N=21{,}614), respectively 39 and 60 times BM25 as exploration deepens. Its median LLM calls rise from 5 to 8 by (N=42{,}587); budget exhaustion is 15% at (N=131{,}876) and 31% at full scale. The authors also report that accuracy falls among questions that remain within budget, so truncation alone does not explain the collapse.

This is the practical pressure created by scale. File-System Agent uses a sequential search policy; an early local mistake can keep later tool calls inside the wrong branch while increasing cost. BM25 completes corpus-wide candidate ranking in an index and passes a bounded evidence set to the reader. That explains the mechanism observed here; it does not mean BM25 solves evidence synthesis by itself.

### 4. Question type: the headline must not erase the counterexamples

[Figure 5](https://arxiv.org/html/2607.26497v3#S4.F5) shows the question-type slice at (N=42{,}587). File-System Agent leads BM25 on intra-document, project-related, completeness, and conflicting-information questions; completeness is 56 versus 27. BM25 is best or tied on the other five types, while a graph system leads only on miscellaneous. The saturated not-found scores mainly measure abstention: one-shot readers decline without supporting evidence, whereas iterative exploration can commit to an unsupported answer.

![Figure 5 right: official combined score by question type](https://arxiv.org/html/2607.26497v3/x7.png)

*Figure 3 (paper Figure 5 right panel, §4.5): question-type slice at (N=42{,}587); labels show question counts, and MS-GraphRAG/LightRAG cannot build at this tier. Source: [arXiv HTML Figure 5](https://arxiv.org/html/2607.26497v3#S4.F5). The image is provided under the [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html); author and source attribution are retained.*

This slice bounds the BM25 headline to candidate discovery and this benchmark's question distribution. It does not prove that lexical ranking replaces methods for multi-document aggregation, relationship traversal, or long-range structured reasoning.

## Matched controls: is the improvement discovery or agency?

[Table 4](https://arxiv.org/html/2607.26497v3#S5.T4) is the most portable engineering control in the paper. On the same 150 questions at bedrock and full scale, it replaces raw file-tree search with a BM25 top-5 tool. The full-scale values come from one shared rejudge:

| access layer | bedrock score | full-scale score | full-scale document recall | calls / question | tokens / question |
| --- | ---: | ---: | ---: | ---: | ---: |
| Native BM25 | 81.3 | 54.8 | 65.6 | 1.00 | 5.8K |
| File-System Agent | 87.1 | 36.9 | 36.8 | 36.12 | 895K |
| Agent+BM25 | 90.1 | **69.4** | **72.4** | 5.79 | **101K** |

On the descriptive slice where each method finds at least one gold document, File-System Agent scores 85.9 versus BM25's 73.8. But its any-gold hit rate collapses to 39.0% at full scale, compared with 71.6% for BM25. The failure is therefore easy to localize: once raw-file agency reaches the right documents, its synthesis is not necessarily poor; it more often fails to discover the right candidates in the first place.

**Paper evidence** is the 69.4 versus 36.9 full-scale matched result, with roughly one ninth of the raw-file query tokens. **Bloss0m inference** is a two-layer design: global candidate discovery should be measurable, cacheable, and cost-controlled; the agent should handle query reformulation, local reading, conflict resolution, and completeness after the candidate set is narrowed, rather than being asked to perform global search and reasoning simultaneously.

## Ablations and robustness: which conclusions hold up?

The paper does not label every control an ablation, but Appendix G/H and Tables 5/6/13/14 provide substantive checks:

- **Judge protocol**: binary rescoring preserves the family ranking at all nine shared scales; the independent judge agrees on 96.2% of pooled alignment decisions. The broad direction is more stable than close pairs.
- **Question wording**: in the small-tier paraphrase control, BM25, File-System Agent, and DenseRAG all fall, but BM25 remains above DenseRAG. The paper does not generalize this small control to every language or paraphrase distribution.
- **Retrieval depth**: in the available top-10 cells, BM25 scores 83.0 versus DenseRAG's 70.0 at (N=1{,}144); at (N=2{,}254), BM25 scores 81.9, DenseRAG 66.5, and HippoRAG 2 73.0. This means top-5 is not the only possible explanation, although the depth control is small-scale and method-limited.
- **Proposal sensitivity**: a direct full-corpus DenseRAG top-10 audit over 90 questions overlaps the historical BM25-prefiltered dense candidates by 1.2 documents on average, recovers 57 of 431 confirmed items, and identifies 115 traps plus 100 not-found lures. This reduces the concern that every adversarial candidate was visible only because the benchmark used a BM25 prefilter.
- **Harness control**: on the same bedrock, 150 questions, policy model, raw corpus, and judge, the authors' File-System harness scores 86.3, Pi-Agent 82.3, Codex harness 43.9, and native BM25 82.1. Agent-harness implementation matters too; not every difference should be attributed to the retrieval substrate.

## Limitations, threats to validity, and unsupported interpretations

### Boundaries of the paper's evidence

1. **One synthetic, fictional but enterprise-shaped corpus**: the corpus spans wiki pages, chats, tickets, email, meeting transcripts, CRM records, and code reviews, with misfiled documents, near-duplicates, and wrong versions. It is not real enterprise ACL behavior, update traffic, tenant isolation, or user traffic.
2. **Fixed bedrock and fixed workload**: questions, gold documents, traps, and lures remain fixed from the smallest tier while background documents are added in one source- and noise-stratified order. That makes scaling interpretable, but it is not how every knowledge base grows, deletes, deduplicates, or versions itself.
3. **Coverage bias in unfinished graph tiers**: the main curves show only completed cells. The coverage-adjusted left side of Figure 5 is the only summary that assigns zero to unavailable graph tiers. Missing MS-GraphRAG or LightRAG cells are not observed answer accuracy.
4. **Extrapolated build cost**: Table 2 fits (C(x)=ax^b) to measured build tokens and extrapolates to the 600.8M-token corpus. Hardware throughput, parallelism, and retries may change calendar time; they do not turn the extrapolation into a measurement.
5. **One reader, one main judge, one run**: Qwen3.6-27B, an 80-call budget, and temperature 0 improve comparability but do not cover other readers, tool policies, retrieval depths, context windows, or concurrency. The independent judge and binary protocol help, while the paper still notes that close pairs can move.
6. **The benchmark favors lexical anchors in part**: enterprise questions contain precise lexical anchors, while traps are semantically similar but factually wrong, so exact matching has a natural advantage. The small-tier paraphrase controls do not replace multilingual, spelling-variation, or genuine semantic-search evaluations.

### What the evidence does not support

- BM25 is the best retriever for every enterprise corpus, language, or relational workload.
- GraphRAG is never worth building in production, or every graph index will hit the same construction wall.
- Agentic retrieval has no value; Agent+BM25 shows the opposite, with agency helping after ranked discovery.
- These scores equal real user satisfaction, permission correctness, SLA performance, dollar cost, or overall production superiority.

> **Huahua's engineering note**
>
> Track “could not build” separately from “answered incorrectly.” An unfinished graph index is a deployment-coverage problem; a retrieved-but-wrong answer is a synthesis or judging problem. Collapsing both into one zero can distort an architecture decision.

## Engineering implications: turn the result into a testable architecture decision

The following are **Bloss0m inferences**, not production recipes directly validated by the paper:

1. **Start with a measurable lexical baseline**: use BM25 or an equivalent sparse retriever for global candidate discovery, and log any-gold hit rate, document recall, query tokens, latency, and the number of viable candidates after permission and version filters. Do not evaluate only the final LLM answer.
2. **Put the agent after ranking**: pass top-k evidence, source paths, versions, and permission context to the agent for query reformulation, local reading, conflict resolution, and completeness. Needing an agent does not require starting from an empty file tree.
3. **Route by question type**: for mostly precise lookups, BM25 may be a low-cost default; for cross-document completeness, project aggregation, semantic paraphrase, or relationship queries, compare hybrid, dense, reranking, or graph substrates on a fixed workload rather than applying the 10M-token crossover as a hard threshold.
4. **Treat graph construction as a conditional investment**: pay for a graph when relational questions are material, extraction quality is testable, and build budget plus incremental-update requirements are acceptable. Report coverage for unfinished tiers and build tokens, freshness, and query latency for completed ones.
5. **Copy the evaluation shape**: at minimum, use nested corpus tiers, a fixed gold/adversarial set, a shared reader/judge, separate build and query accounting, question bootstrap, and a matched control that changes only the retrieval primitive. This answers a production question better than declaring GraphRAG the winner at one corpus size.

## Reproducibility and artifact status (as of 2026-08-09)

The distinction here is deliberate: “the authors say it exists” is not the same as “the endpoint is independently usable.”

| artifact | independent endpoint check | status and meaning |
| --- | --- | --- |
| Paper PDF / HTML / TeX source | [PDF](https://arxiv.org/pdf/2607.26497v3), [HTML](https://arxiv.org/html/2607.26497v3), and [source archive](https://arxiv.org/src/2607.26497v3) each returned 200; the source archive lists `main.tex`, `appendix.tex`, the PDF, and seven figures | **Available**. The source archive verifies the paper and figure materials, but it does not contain a complete `scripts/`, `results/`, or benchmark-data experiment bundle. |
| EnterpriseRAG-Bench code / questions / methodology | [GitHub repository](https://github.com/onyx-dot-app/EnterpriseRAG-Bench) returned 200 and exposes a README, `src/`, `questions.jsonl`, quickstart, MIT license, and release/download instructions | **Available, but not the exact study-run package**. It is the public release of the benchmark used by the paper; the paper's `results/...` and `scripts/...` paths are not present in the arXiv source archive. |
| EnterpriseRAG-Bench data | [Hugging Face dataset page](https://huggingface.co/datasets/onyx-dot-app/EnterpriseRAG-Bench) is reachable and exposes the dataset card, files area, and a partial document preview. On the 2026-08-09 check, its full viewer reported an API/server error, while the [GitHub README](https://github.com/onyx-dot-app/EnterpriseRAG-Bench) still documents release/zip and Hugging Face download routes. | **Public download route, viewer currently unreliable**. A reachable card or preview is not evidence that the complete data was downloaded, nor that the exact paper run has been reproduced. |
| Exact study outputs / model weights / deployment config | Appendix L/M lists relative `results/`, `figures/`, `scripts/`, and README paths, but no separate paper-specific code, checkpoint, or demo URL was independently available | **Unknown / not independently obtained**. Qwen3.6-27B and Qwen3-Embedding-0.6B are reported experimental settings, not a released serving image, checkpoint bundle, or exact-run environment. |

The smallest useful reproduction is conditional: download the benchmark from its GitHub release or Hugging Face, recreate a few nested tiers from §3 and Appendix B, keep the bedrock, reader, judge, and token meter fixed, and compare BM25, dense, graph, and raw-file/Agent+BM25 access. That is a **proposed reproduction experiment**, not a completed reproduction reported here. Without the study-specific `results/`, full runner, and environment configuration, it should not be called an exact reproduction.

## Next reading and primary sources

To place this study in Bloss0m's existing path, read [RAG vs. GraphRAG: A Systematic Evaluation](/en/paper-reading/07-GraphRAG-vs-RAG/) first, then use the [Enterprise RAG Guide](/en/blog/65-enterprise-rag-guide/) for permissions, versioning, evaluation, and operations. For the role of agents inside a RAG pipeline, continue with [Agentic RAG](/en/blog/07-agentic-rag/). These are verified existing routes, not evidence for this paper's results.

Primary sources:

- [Wang et al., BM25 Wins at Scale, arXiv record](https://arxiv.org/abs/2607.26497); [full HTML](https://arxiv.org/html/2607.26497v3); [PDF v3](https://arxiv.org/pdf/2607.26497v3).
- [arXiv v3 TeX source archive](https://arxiv.org/src/2607.26497v3) and [arXiv distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html).
- [EnterpriseRAG-Bench official GitHub repository](https://github.com/onyx-dot-app/EnterpriseRAG-Bench).
- [EnterpriseRAG-Bench Hugging Face dataset endpoint](https://huggingface.co/datasets/onyx-dot-app/EnterpriseRAG-Bench).
