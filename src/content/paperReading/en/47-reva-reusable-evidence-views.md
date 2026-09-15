---
title: "REVA: Moving RAG compression into reusable evidence views instead of paying per request"
description: "A critical reading of Nguyen et al.'s REVA (arXiv 2609.11209 v1): historical generator attention becomes a document-keyed score store, separating offline scoring from online rendering while exposing unseen-document fallback, local/global budgets, quality, and latency boundaries."
pubDate: 2026-09-15
updatedDate: 2026-09-15
tldr:
  - "REVA turns historical query–document–generator interactions into a document-keyed, budget-agnostic word-unit score store; online serving only looks up scores, allocates quotas, and renders plain text in source order."
  - "Its real engineering question is not simply whether attention can find important tokens. It is which scoring work can leave the request path, which compatibility conditions must match, and how an unseen document is safely returned to prefix truncation."
  - "Across four QA benchmarks, three generators, and a fixed top-10 retrieval cache, full-split B=512 REVA-local reports 37.83 F1, 26.98 EM, and 27.5 ms online overhead; the all-seen budget grid reports 43.72 F1, 32.75 EM, and 49 ms for REVA-global, but all-seen is diagnostic."
  - "Attention is an evidence-importance proxy, not a citation-faithfulness proof; offline score-store construction, updates, freshness, coverage, and compatibility-key governance remain adoption costs."
audience:
  - "ML and search engineers designing context compression, RAG serving, KV-cache, and token-cost control planes"
  - "Technical leads who need to connect offline evidence mining, online latency, data versions, and unseen-document fallback into a production RAG contract"
tags: ["Paper Reading", "RAG", "Retrieval", "Information Retrieval"]
image: "/paperReading/47-reva-reusable-evidence-views/title_image.webp"
field: "NLP"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
paper:
  title: "REVA: Reusable Evidence View Aggregation for Context-Efficient RAG Serving"
  authors:
    - "Tuan Nguyen"
    - "Qiran Hu"
    - "Banruo Liu"
    - "Khoa D. Doan"
    - "Kok-Seng Wong"
    - "Fan Lai"
  year: 2026
  venue: "arXiv 2609.11209 v1 (2026-09-10; accepted for IEEE ICDM 2026; author's accepted manuscript)"
  links:
    pdf: "https://arxiv.org/pdf/2609.11209v1"
    arxiv: "https://arxiv.org/abs/2609.11209"
    doi: "https://doi.org/10.48550/arXiv.2609.11209"
    code: "https://github.com/UIUC-MLSys/REVA"
    project: "https://arxiv.org/html/2609.11209v1"
series:
  id: "retrieval-systems-production-rag"
  title: "Retrieval Systems: From Evidence to Production RAG"
  part: 1
  totalParts: 1
---

This note reads [REVA: Reusable Evidence View Aggregation for Context-Efficient RAG Serving](https://arxiv.org/abs/2609.11209) v1 (2026-09-10). The arXiv HTML labels it an author's accepted manuscript accepted for publication at IEEE ICDM 2026; as of this reading, I used arXiv v1 and the authors' artifact rather than presenting it as a paper already available in the final proceedings. I checked the [full paper HTML](https://arxiv.org/html/2609.11209v1), Sections I–VI, Figures 1–4, Tables I–VI, and the [REVA GitHub artifact](https://github.com/UIUC-MLSys/REVA), including its README, `src/reva.py`, `pyproject.toml`, `uv.lock`, and temporary data endpoints.

If you have read [RAG foundations](/en/paper-reading/31-retrieval-augmented-generation/) or [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/), this paper is not asking again whether retrieval is useful. It asks the next serving question: **when the same documents recur across related queries, why recompute context importance on every request? And when a document has never appeared in the historical store, how can the system keep serving without changing the generator interface?**

## The paper in 90 seconds

- **Problem:** A post-retrieval compressor that invokes another model, scores tokens, or rewrites text on every request can erase the latency benefit of a shorter context. A model-agnostic selector may also preserve information the target generator already knows while deleting evidence it actually needs.
- **Core intuition:** Historical RAG requests already contain signals about how the generator used a document. Map attention from the query and available answer/response tokens onto readable word units, average those signals across repeated document accesses, and obtain a reusable evidence prior. This is a document-level retention tendency, not a query-specific answer.
- **Strongest evidence:** With a fixed top-10 retrieval cache, four QA benchmarks, and three generators, Table I's full-split B=512 REVA-local result is higher than Trunc-local on NQ, TriviaQA, HotpotQA, and 2Wiki. Table II averages 37.83 F1, 26.98 EM, and 27.5 ms online overhead across 12 generator–dataset settings. Table III's all-seen 120-cell budget grid gives REVA-global 43.72 F1, 32.75 EM, and 49 ms.
- **Main boundary:** All-seen keeps only held-out queries whose retrieved documents all have scores, so it is diagnostic rather than deployment coverage. Full-split includes prefix fallback. Attention is an evidence-importance proxy, not a citation verifier, and reported online overhead excludes score-store construction and updates.

My bounded verdict is: **REVA's most valuable change is moving the compression control point from “decide again for every query” to “turn historical interactions into a versionable document view, then materialize it lightly on the request path.”** It is a practical serving layer when documents recur, the generator is relatively stable, and the team can govern corpus, tokenizer, template, and scoring-mode compatibility. It is not a substitute for freshness, provenance, or faithfulness controls when the corpus changes quickly, coverage is low, or the product requires a defensible citation chain.

> **Huahua's engineering note**
>
> Do not read “27.5 ms online overhead” as “the whole compression system costs 27.5 ms.” REVA moves attention scoring to an offline or asynchronous path, which is a useful boundary shift; the real cost account still includes historical prompt forward passes, store updates, version misses, fallback, and coverage monitoring.

## Paper identity, reader question, and evidence map

The authors are Tuan Nguyen, Qiran Hu, Banruo Liu, Khoa D. Doan, Kok-Seng Wong, and Fan Lai. The arXiv record dates v1 to 2026-09-10; the HTML header also states acceptance for the 2026 IEEE International Conference on Data Mining and © 2026 IEEE's accepted-manuscript reuse restriction. Keep these facts separate: acceptance is paper status, not proof that the final proceedings version is already the source being cited; reusing a figure is not the same as having a permissive open license.

The reader question here is: **can historical query–document–model traces become a reusable, readable, budget-agnostic document view so online RAG pays only materialization cost?** This places REVA in the production-rag gap of the retrieval-systems track. Unlike [DPR](/en/paper-reading/32-dense-passage-retrieval/), it does not change first-stage recall. Unlike Self-RAG, it does not change when retrieval is called. It changes post-retrieval evidence serving between retrieval and generation.

I will keep three voices distinct:

| Layer | What this reading says |
| --- | --- |
| **Paper directly supports** | Section III's overhead, model-agnostic, and repeated-access motivation; Section IV's attention mining, word-unit materialization, document-keyed store, local/global allocation, and fallback; Tables I–VI and Figures 1–4 for quality, latency, coverage, and ablations. |
| **Authors claim** | Historical generator attention can form reusable evidence views that reach a competitive quality–overhead frontier across four benchmarks and three generator families. |
| **Evidence does not support** | Attention scores alone do not prove citation faithfulness; recurrence does not guarantee stability under time or distribution shift; all-seen is not full deployment behavior; online overhead is not a cloud bill because it excludes offline construction and updates. |
| **Bloss0m engineering judgment** | Treat REVA as a serving artifact with an explicit compatibility key, coverage SLO, fallback, and staleness policy—not as a universal compressor that can safely shorten every RAG context by itself. |

## Why the prior approach is insufficient: a short context is not a low total cost

A conventional post-retrieval compressor often looks like this:

`query → retrieve top-K → request-time compressor → compressed context → generator`

The intuition is sound: retrieve enough evidence, then delete low-value tokens or sentences before the generator sees them. But this path creates two operational problems.

First, a selector, scorer, or rewriter is often tied to the current query, document set, and document order, so it repeats work for every request. Section III and Figure 1(a) plot this overhead: representative request-time compressors can add hundreds of milliseconds, which is difficult to reconcile with sub-200 ms time-to-first-token targets. Second, a model-agnostic importance rule does not know what the target generator already knows or which evidence it tends to use. Figure 1(b) therefore warns that advanced compressors do not consistently beat a simple global prefix truncation at the same budget.

REVA does not claim prefix truncation is useless. It asks whether expensive judgment can be paid once and reused many times. In the authors' setting, Figure 1(c) reports that 85–92% of held-out queries retrieve at least one document previously accessed in the training prefix. That is not a law of production corpora, but it is a measurable condition under which historical traces may have amortization value.

![REVA paper Figure 1: compression overhead, matched-budget quality, and seen-query rate in the motivation study.](/paperReading/47-reva-reusable-evidence-views/paper-fig-1-motivation.png)

*Figure 1: Paper Figure 1, located at the [Figure 1 anchor in Section I Introduction](https://arxiv.org/html/2609.11209v1#S1.F1) and interpreted in Section III. It supports measuring online compressor cost and benefit together, and shows why document recurrence is worth mining; it does not mean every workload will have 85–92% coverage. The image is preserved from the original arXiv endpoint. The page marks it as © 2026 IEEE's accepted manuscript: personal use is permitted, while other reprinting, republication, or reuse requires IEEE permission.*

## Core intuition: turn past document use into an evidence prior

Before the equations, think of REVA as a document-level evidence notebook. When query A retrieves a document, the target generator has already produced an attention trace during its forward pass. When queries B and C retrieve the same document, their traces add information about which word units the model repeatedly relies on. For query D, serving can consult that notebook, select high-score units, and put them back into ordinary text in the source order instead of invoking another compressor to reread the full document.

The intuition involves three deliberate trade-offs:

1. **Model-aware, but not query-bound:** scores come from the target generator and reflect its evidence-use tendencies, but they do not guarantee the best spans for a new query. Coverage and drift must therefore be monitored.
2. **Budget-agnostic, but not a text cache per budget:** the store keeps word-unit scores, sums, counts, and source boundaries rather than separate B=256, B=512, and B=1024 compressed texts. A new budget rematerializes from the same scores without rerunning attention scoring.
3. **Plain text, not a token bag:** the generator keeps its existing text interface, with no KV-cache API or latent-memory requirement; selection happens at word-unit granularity and output returns to source order so numbers and local structure are less likely to be fragmented.

Section IV-B gives a conditional geometric motivation through co-retrieval. Let $e(\cdot)$ be a unit-norm retrieval embedding, let $q_A$ be a historical query, $q_B$ a future query, and $d$ a document retrieved by both. Define $r_A=e(q_A)^\top e(d)$ and $r_B=e(q_B)^\top e(d)$. If both are at least $\rho>0$, the paper gives:

$$e(q_A)^\top e(q_B) \ge r_A r_B-\sqrt{(1-r_A^2)(1-r_B^2)}\ge 2\rho^2-1.$$

The equation only gives a lower bound in retrieval space under an additional condition. It is not a theorem about attention similarity, and top-K retrieval does not automatically enforce the condition. Section IV-B says this explicitly, so this reading does not inflate co-retrieval into identical evidence needs.

## Method flow: the offline score-store and online-rendering boundary

![REVA paper Figure 2: historical interactions build a store, then online serving renders a budgeted reusable text view.](/paperReading/47-reva-reusable-evidence-views/paper-fig-2-pipeline.svg)

*Figure 2: Paper Figure 2, located at the [Figure 2 anchor in Section IV-A Design Overview](https://arxiv.org/html/2609.11209v1#S4.F2). It is the central boundary diagram: historical or asynchronous accesses produce scores, online serving looks up, allocates, and renders, and uncovered documents use prefix fallback. The original SVG is preserved from the arXiv endpoint. The page marks the accepted IEEE manuscript © 2026 IEEE; personal use is permitted, while other reuse requires IEEE permission, so attribution and the restriction are retained here.*

Algorithm 1 can be rewritten as four stages:

1. **Collect historical interactions:** for each historical `(q, D(q), a)`, run an attention-enabled forward pass of the target generator $f$. The source can be the query alone or the query plus an available answer/response. The historical `a` is an offline signal; it is not the future test answer being inserted into that same served context.
2. **Turn token traces into readable units:** for every document-body token $p$, aggregate attention from a source-token set $T$ by averaging across heads and summing source positions:

   $$S_q(p)=\sum_{r\in T}\frac{1}{H}\sum_{h=1}^{H}A^{(h)}_{r,p}.$$

   Here $A^{(h)}_{r,p}$ is the attention weight from source token $r$ to document token $p$ at head $h$, and $H$ is the number of heads. A higher score means that more source positions placed weight on this document position in the offline forward trace; it is not a label saying that the token is necessarily a factual citation. Adjacent tokenizer pieces are merged into word units with whitespace-start boundaries. Short structured spans such as dates, percentages, comma-separated numbers, hyphenated words, and capitalized multiword names receive a protection pass. A unit takes the maximum score among its member tokens.
3. **Accumulate per document:** for every unit $u$ in document or chunk $d$, update $M_{k(d)}(u)\leftarrow M_{k(d)}(u)+S_q(u)$ and $C_{k(d)}(u)\leftarrow C_{k(d)}(u)+1$, then use:

   $$\bar S_{k(d)}(u)=\frac{M_{k(d)}(u)}{C_{k(d)}(u)}.$$

   The compatibility key $k(d)$ binds text/document identity, generator $f$, tokenizer $\tau$, scoring template $\pi$, scoring mode $m$, and corpus/chunk version $\nu$. The operational meaning of averaging is to reduce one-access noise. Under the paper's ideal independent-noise model, the variance bound falls from $\sigma^2$ to $\sigma^2/n$ after $n$ accesses. Under real distribution shift, the authors suggest refresh or exponential decay rather than trusting old counts forever.
4. **Materialize online:** the new query still retrieves top-K units as usual, deduplicates by content key, and allocates token quotas. A compatible scored document selects units by $\bar S$ and renders them in original order; a document without compatible scores uses fallback. The outputs are merged and repaired to the final budget before the unchanged generator receives ordinary text.

This boundary is REVA's claim and its responsibility shift: online latency falls because attention scoring moves to offline or asynchronous work; scoring has not disappeared. Without historical logs, the ability to rerun the target generator, or enough recurrence, the amortization premise is weak.

## A document walkthrough: from unseen fallback to a reusable view

The following is a faithful explanatory example assembled from Section IV and Algorithm 1, not an additional case reported by the paper:

1. **Input:** a new query retrieves ten documents. `d7` is an FAQ chunk retrieved by 40 historical requests; `d9` is a newly published chunk with no compatible row in the score store. The serving budget is $B=512$.
2. **Offline representation:** historical accesses to `d7` used the same generator, tokenizer, template, and scoring mode. The system maps attention to word units and protects pieces such as `2024-09-18` and `$12,400`. Each unit stores source offsets, token boundaries, score sum, and count. The key also records the corpus version. `d9` has no compatible key.
3. **Online decision:** REVA-local gives each deduplicated document about $\lfloor B/K'\rfloor$ tokens. `d7` selects high-score units within its quota; `d9` uses prefix truncation under the same quota. If REVA-global is enabled, bounded historical utility reallocates remaining budget under protected top-ranked documents and per-document caps; it does not pretend to know `d9`'s salience.
4. **Output:** `d7`'s selected units may be scattered in the source, but the renderer merges them back in original order. The ten results are joined in retrieval order into a plain-text context. There is no KV tensor and no new latent interface.
5. **Likely failure point:** if `d7`'s text was edited, or the tokenizer or template changed, its old key should not match. If a deployment checks only document ID and ignores version, stale scores can select the wrong evidence. If most real traffic looks like `d9`, fallback pulls quality toward truncation rather than the all-seen curve. Coverage therefore belongs in dashboards, SLOs, and invalidation policy.

## Compatibility keys: reuse requires more than the same `doc_id`

REVA's artifact is not a global salience map over arbitrary text. Section IV-C defines the composite key:

$$k(d)=(k_{text}(d),f,\tau,\pi,m,\nu).$$

`k_text(d)` can be built from a document ID and chunk ID, or from a text fingerprint when stable IDs are unavailable. The remaining fields are generator, tokenizer, scoring template, scoring mode, and corpus/chunk version. They are not decorative metadata; they are the compatibility contract that determines whether a score is safe to reuse:

- **Generator:** changing the model can change its knowledge gaps and evidence-use pattern.
- **Tokenizer:** changing it can change word-unit boundaries, token counts, and budget accounting.
- **Template:** changing the positions of query, answer, or documents can change the source-token set and attention geometry.
- **Scoring mode:** moving from Q to Q+A changes the signal from a query-oriented lexical trace to one that also includes the response trajectory.
- **Version:** changing the corpus changes offsets, units, and content; old statistics cannot simply be merged into new text.

In a real deployment, I would make compatibility misses observable rather than silently treating them as normal fallback: log miss reasons, store version, document version, generator hash, tokenizer hash, fallback-token share, and quality by coverage bucket. This is Bloss0m engineering advice. The paper directly specifies compatible keys and fallback semantics; it does not provide a complete production telemetry specification.

The artifact and paper claim also need separate readings. The paper's Section IV composite key includes generator, tokenizer, template, mode, and version. The inspected GitHub `main` implementation looks up a `doc_key` made from `doc_id` and optional `chunk_id`; its score-row metadata stores `scoring_model_name`, word-unit type, training hits, raw tokens, and related fields, while `validate_score_doc` checks document/chunk identity and raw text. That public implementation is useful for understanding the data structure and fallback interface, but it is not evidence that every deployment-level compatibility dimension in the paper prose is already enforced by the current artifact. A deployer still needs a namespace or wrapper for the remaining fields.

## Local and global budgets: a policy choice between coverage and salience

Given total context budget $B$ and $K'$ deduplicated retrieved documents, **REVA-local** uses the basic quota:

$$b_i=\min(m_i,\lfloor B/K'\rfloor),$$

where $m_i$ is the original token length of document $d_i$. Each document selects its own high-score units, so one unusually salient document cannot consume the entire budget. The same document view can be reused when its neighboring retrieved documents change. This is easier to predict and easier to make coverage-friendly.

**REVA-global** uses the same unit scores and within-document selection but reallocates remaining budget across documents. In the fixed Section V-A settings, historical utility is estimated from each document's highest-scoring 10% of units, bounded to 1–32 units, and normalized by the square root of uncompressed length. The top $L=\min(5,K')$ documents receive protected initial quotas; each document has $b_i^{max}=\min(m_i,\lceil0.25B\rceil)$; remaining budget follows utility, and excess beyond a cap or document length is redistributed. If all utilities are zero, remaining budget is shared uniformly.

The design lesson is more specific than “global is better.” Global needs a floor, a cap, and coverage repair. Otherwise naive global simply throws every unit into one large pool, which can fill the budget with fragments from one document and hurt both quality and latency. If any document lacks a compatible score, the paper switches to equal document quotas: covered documents use score-guided selection, and uncovered documents use prefix fallback.

Table V makes the trade-off concrete. On HotpotQA, global reaches 43.25 F1, 5.16 above Trunc-local and 1.67 above RECOMP-e, matching or exceeding RECOMP-e in 26 of 30 cells. On TriviaQA, the dataset-slice F1 is 68.74 for global versus 68.86 for local; 2Wiki is also nearly unchanged. The careful conclusion is that protected global allocation can help when decisive evidence is unevenly distributed across documents, while local's lower overhead and predictable coverage may be the better default.

## Experimental setup: read the denominator before the headline

Section V-A fixes retrieval variance. The four open-domain QA benchmarks are Natural Questions, TriviaQA, HotpotQA, and 2WikiMultihopQA. The generator families are Llama-3.1-8B-Instruct, Qwen3.5-9B, and Gemma-4-E4B-it. Every method receives a prebuilt top-$K=10$ retrieval cache, using `intfloat/e5-base-v2` with mean pooling, a maximum encoder length of 512, and FAISS flat inner-product search. The experiments run on a four-H100 server.

The main metrics are token-level F1, exact match (EM), ROUGE-L, emitted context tokens, and online overhead (OO). OO is request-time wall-clock compression/materialization latency, excluding retrieval, offline score-store construction, answer generation, and asynchronous updates. This definition matters: a shorter context and low OO can still carry a substantial offline build cost, while generation time is not OO.

The paper separates transfer and coverage with three regimes:

- **Full-split strict reuse:** the store is built from the training split and frozen. A held-out query may mix covered and uncovered top-K documents; the latter use prefix fallback. This is the closest main result to deployment.
- **All-seen strict reuse:** only held-out queries whose retrieved documents all have stored scores are kept. This measures transfer once coverage exists. It is a diagnostic subset, not a deployment distribution.
- **Component ablations:** the strict-reuse rule remains, while Q versus Q+A scoring, local versus global allocation, word-unit materialization, and rendering order change.

Baselines include Trunc-local/Trunc-global, Selective Context, LLMLingua-2, RECOMP-e, LongLLM, EXIT, and FaviComp. They are not all matched-budget comparisons: EXIT treats B as a post-selection guard, while FaviComp treats B as a maximum decoding length and may stop early. The authors describe these as inference-time stress tests.

## Evidence 1: partial coverage can still help, but coverage is not free

Table I is the full-split, B=512 result averaged over three generators. NQ has 87.9% any-seen coverage; Trunc-local is 33.68/22.56 F1/EM and REVA-local is 38.12/25.23. TriviaQA is 87.1% and 53.70/42.64 versus 58.18/47.57. HotpotQA is 91.6% and 27.48/16.99 versus 31.03/20.79. 2Wiki is 85.2% and 21.60/12.87 versus 23.99/14.90.

This supports a narrow but useful claim: **when at least one top-10 document has a stored score, score-guided views plus fallback beat document-local prefix truncation on these four full-split benchmark settings.** It does not mean all documents are reusable. Any-seen is a query-level “at least one hit” measure, and many individual documents remain uncovered. Production dashboards should therefore track both query-level any-seen and document-level coverage; otherwise 87–92% can hide a large fallback share.

## Evidence 2: quality versus online cost

Table II averages 12 generator–dataset settings at B=512. Trunc-local reports 34.11 F1, 24.10 EM, 30.43 ROUGE-L, 512.0 context tokens, and 17.0 ms OO. REVA-local reports 37.83, 26.98, 33.65, 502.3 tokens, and 27.5 ms. Relative to Trunc-local, it gains 3.72 F1, 2.88 EM, and 3.22 ROUGE-L at an extra 10.5 ms of materialization. That added cost is on a different scale from request-time compressors: SelCtx-local is 822.6 ms, LLM-L2-local 343.0 ms, RECOMP-e 120.0 ms, and LongLLM 598.9 ms.

REVA-local is within about 0.44–0.81 F1 of the LLM-L2 variants and LongLLM, but remains 2.36 points below RECOMP-e. “Near-frontier” is therefore more accurate than “uniformly best.” If the KPI is quality per millisecond of request-time compression, REVA's case is strong; if the KPI is only the highest F1, RECOMP-e remains a higher row in Table II while paying more OO.

The all-seen Table III summary aggregates 120 cells (3 generators × 4 datasets × 10 budgets). REVA-local's mean F1/EM/OO is 43.34/32.73/31 ms; REVA-global is 43.72/32.75/49 ms; RECOMP-e is 43.66/32.69/155 ms. On this diagnostic denominator, global is slightly ahead of RECOMP-e in F1, while local is only 0.32 F1 behind it and both are much cheaper in OO. The all-seen filter still matters: deployment decisions must combine fallback-containing full-split numbers with coverage.

![REVA paper Figure 3: quality across compression budgets for representative generator–dataset pairs.](/paperReading/47-reva-reusable-evidence-views/paper-fig-3-budget-curves.svg)

*Figure 3: Paper Figure 3, located at the [Figure 3 anchor in Section V-B Main Results](https://arxiv.org/html/2609.11209v1#S5.F3). Its teaching purpose is to test whether the frontier persists across budgets: REVA-local/global are often competitive with inference-time compressors, but no curve is uniformly dominant. The original SVG is from the arXiv endpoint; the accepted IEEE manuscript © 2026 IEEE permits personal use, while other reuse requires IEEE permission.*

Figure 3 matters because it prevents a B=512 single point from becoming the whole story. At smaller budgets, word-unit integrity and document coverage can matter more; at larger budgets, prefix truncation may recover part of the gap. The authors' conclusion is near-frontier quality across budgets, not a monotonic theorem that wins on every workload and budget.

## Evidence 3: Q+A scoring, global allocation, and word order have separate jobs

Table IV is the key component ablation. Averaged over the all-seen grid, Trunc-local is 38.75 F1, 28.81 EM, and 15.6 ms; REVA-local with query-only (Q) is 42.29/31.85/28.5; REVA-local with query-plus-answer/response (Q+A) is 43.34/32.73/31.5; REVA-global with Q+A is 43.72/32.75/48.7. This supports the paper's interpretation that response trajectories expose answer-bearing spans, making Q+A stronger than Q. It also means the offline data pipeline needs completed responses, not only query logs.

Naive global with Q reports 41.76 F1 and 92.9 ms; naive global with Q+A reports 42.04 and 105.8 ms. Both are worse than the protected REVA policies even though they pool all candidates globally. The engineering lesson is that global allocation is not “sort everything globally”; it is “reallocate remaining budget while preserving per-document floor, cap, and coverage repair.”

Table V breaks this down by generator and dataset. Global beats local on each generator average by a small amount, but dataset behavior differs: HotpotQA has the clearest uplift, while TriviaQA and 2Wiki show mixed or negligible local/global differences. “Local as the safer default, global as an option for uneven evidence” is therefore more defensible than “global always wins.”

Figure 4 isolates materialization. With Qwen3.5-9B at B=512, removing word-unit materialization reduces F1 from 53.52 to 52.23, EM from 46.13 to 44.47, and ROUGE-L from 47.22 to 45.95. Emitting the same selected units in score order gives 50.61 F1, 42.85 EM, and 44.02 ROUGE-L, versus about 488.3 tokens for original-order rendering and 487.3 for score-order rendering. Correct selection is not enough if the text is rearranged into an importance-ranked bag; local document structure is part of the evidence interface.

![REVA paper Figure 4: ablations for word-unit materialization and original-order rendering.](/paperReading/47-reva-reusable-evidence-views/paper-fig-4-materialization-ablation.svg)

*Figure 4: Paper Figure 4, located at the [Figure 4 anchor in Section V-C Performance Breakdown and Ablation Studies](https://arxiv.org/html/2609.11209v1#S5.F4). It supports two separate mechanisms: word units turn token selection into readable spans, and original order preserves document structure; it is not another benchmark overview. The original SVG is preserved from the accepted IEEE manuscript endpoint; arXiv permits personal use, while other reuse requires IEEE permission, so the source and restriction remain explicit.*

Table VI's EXIT/FaviComp stress test is also informative: EXIT emits 107.5 context tokens but adds 3,858.2 ms OO; FaviComp emits 234.6 tokens and adds 12,837.7 ms; REVA-local/global emit 491.5/491.9 tokens with 26.2/40.6 ms OO. This is not a matched-budget victory because B has different semantics in these methods. It is better read as a warning that extremely short context can come with a much larger request-time compression bill.

## Attention's evidence boundary: a useful proxy, not a faithfulness proof

REVA treats attention as a low-cost trace of how the model allocates weight during a forward trajectory. It is a plausible ranking prior because it comes from the target generator, and repeated attention from query and response tokens can reinforce recurring spans. But several unproven steps remain between “the model attended to this span” and “this span fully and correctly supports a citeable answer”:

- attention can reflect lexical match, position, template effects, and parametric knowledge, not only causal evidence use;
- Q+A scoring depends on historical answers/responses, so incorrect history can turn the wrong span into a high-score prior;
- max-over-member-tokens word-unit scoring improves integrity but does not guarantee that a cross-sentence bridge is retained;
- averaging reduces access-specific noise, not distribution shift, corpus edits, or answer-policy shift;
- the paper reports F1, EM, ROUGE-L, and latency, but does not provide a citation-level evaluator showing that every retained span supports its answer.

The right serving artifact should therefore keep source offsets, document version, and score provenance with the rendered view. Debugging should be able to ask which span was kept, why it was kept, how many historical hits produced its score, and which generator/template produced them. A product that requires citation faithfulness still needs a citation verifier, support entailment check, missing-evidence abstention, or escalation path. Attention scores cannot replace those controls.

## All-seen is a diagnostic subset, not a deployment shortcut

The all-seen regime is easy to misread. It does not leak the test answer into the served context: the paper states that the held-out query and answer are not used to build the context served to that query. That is the value of strict reuse. But the filter removes queries containing any uncovered retrieved document, so it answers “how well do historical scores transfer once coverage is complete?” rather than “what share of live traffic receives a complete reusable view?”

Table I's full split is where unseen-document fallback appears in the end-to-end denominator. Its 85.2–91.6% any-seen rate still means at least one hit, not that every top-10 document is covered. These denominators should not become one headline. Before deployment, I would plot query any-seen, document coverage, fallback-token share, and quality by coverage bucket. If all-seen F1 is high while fallback-token share is also high, real traffic will still be pulled toward truncation.

## Artifact, environment, and reproducibility: inspectable is not one-command reproducible

As of **September 15, 2026**, my artifact audit is:

| Artifact | Status and accessibility | Reproduction meaning |
| --- | --- | --- |
| GitHub repository, `src/reva.py`, `src/cli.py`, metrics, runner, README | **Accessible/usable for inspection**; the public repository includes `uv.lock`, quick-start commands, JSONL schema, and figures | You can inspect the implementation, build a small score store, and run `reva` from a prebuilt store; I did not independently rerun the full paper benchmark in this reading. |
| Python environment | README requires `uv sync --locked`; Python `>=3.10,<3.13`; pinned Transformers commit, Torch `>=2.11,<2.12`, Accelerate, Safetensors, SentencePiece; retrieval extra adds FAISS, Hugging Face Hub, and NumPy | You need an attention-enabled generator, a fast tokenizer, model weights/access, and potentially substantial GPU memory; the paper evaluates on four H100s. |
| Retrieval top-20 artifact | README provides a temporary [Google Drive endpoint](https://drive.google.com/file/d/1buhg89g4n5j4tGiDj_94K1F0bflNzhFb/view?usp=sharing), whose landing page was reachable on the audit date; README says a Zenodo DOI is not ready | The temporary link is not a permanent archival DOI; downloaded contents still need manifest and checksum verification. |
| Compact REVA score cache | README provides a temporary [Google Drive endpoint](https://drive.google.com/file/d/1vO7EmnzyV2-Fqg8KudX-oT2haiwY8uPe/view?usp=sharing), whose landing page was reachable on the audit date | It lists a manifest, verify TSV, SHA-256 checksums, and six generator/scoring-mode filenames; I did not verify that the download reconstructs every paper table. |
| Paper global allocator | Paper Sections IV-D/V-A and Tables III–V define it and report results; the inspected `main` implementation's `select()` still routes to document-wise selection, and quick start only shows `--method reva` | Global is paper evidence, but not a one-command reproducer I could verify from the current public quick start; reproducing it requires checking the artifact version or implementing the allocator. |

The README's smallest runnable path is to prepare JSONL rows with `question`, `answers`, and `contexts[{doc_id,title,text,chunk_id}]`; run `PYTHONPATH=src uv run python -m cli build-store --input data/train.jsonl --model meta-llama/Llama-3.1-8B-Instruct --option max_scoring_tokens=8192 --output outputs/reva_store`; then run `--method reva --budget 512 --option score_store_path=outputs/reva_store/score_store.jsonl` on test input. For rendering semantics, the README gives a word-unit example: score `Paris`, `capital`, and `France`, then output them in source order as `Paris capital France`. That is an interface example, not a paper benchmark.

The smallest useful reproduction is not immediately launching all four benchmarks. Start with three controlled cases:

1. **Seen:** build a small historical JSONL store with fixed generator, tokenizer, template, and scoring mode; confirm high-score units render in source order.
2. **Unseen:** use a document absent from the store; confirm prefix fallback, quota accounting, fallback count, and final budget repair are observable.
3. **Mismatch:** change raw text, chunk ID, generator metadata, or template namespace; confirm stale scores are not silently reused. If the current artifact key only covers doc/chunk, add the remaining compatibility fields in a wrapper.

Only after these cases pass should a team spend model downloads and four-dataset grid time. Full reproduction remains affected by temporary data, model access, four-H100 scale, the pinned Transformers commit, and optional baseline dependencies. This reading does not claim an independent full benchmark run.

## Engineering decision: when to use it and when not to use it

**Good conditions for a PoC:** documents recur; the retrieval cache records stable document/chunk identity; generator, tokenizer, and prompt template are relatively stable; an offline/asynchronous pipeline can run attention-enabled forward passes; and the product understands that a score-guided view is an evidence prior, not a citation proof. Measure document coverage, any-seen, fallback-token share, store bytes, build throughput, update lag, p50/p95/p99 OO, and F1/EM at several budgets.

**Conditions not to adopt directly:** nearly every query retrieves new documents; corpus edits are frequent without versioned invalidation; generators change without namespaces; historical answers are unreliable or sensitive without provenance/retention policy; the product requires sentence-level citation correctness, legal auditability, or abstention guarantees; or an alternate online path bypasses the `reva` boundary. Simple truncation, a sentence-level selector, or a citation verifier may still be needed; REVA can be one layer, not the whole control plane.

I would turn adoption into four operational contracts:

| Contract | What to observe | Action on failure |
| --- | --- | --- |
| **Compatibility** | Key fields, model/tokenizer/template/corpus version, raw-text digest | Fail safely to fallback on a miss; never silently reuse an incompatible score by document ID alone. |
| **Coverage** | Query any-seen, document hit rate, fallback documents, fallback-token share | Fall back to the baseline at low coverage and attribute gains to covered buckets rather than all-traffic averages. |
| **Freshness** | Store age, update lag, score decay, corpus edit rate | Invalidate/rebuild on version or drift thresholds; do not accumulate historical counts forever. |
| **Evidence quality** | F1/EM plus citation support, missing bridge spans, and human audit | Treat attention as ranking only; add a separate faithfulness verifier and escalation path. |

This matrix is Bloss0m's engineering translation, not a production control plane evaluated by the paper. The paper shows that, under its fixed cache, models, datasets, budgets, and strict-reuse protocol, this artifact can produce competitive quality–OO curves.

## Three things to remember

1. **Technical idea:** REVA maps historical generator attention into document-keyed word-unit averages, changing evidence selection from work performed live for every query into a score store reusable across budgets.
2. **Strongest evidence:** With partial coverage, full-split results beat Trunc-local on all four benchmarks; in the all-seen budget grid, REVA-global reaches 43.72 F1/32.75 EM/49 ms and REVA-local 43.34/32.73/31 ms, showing near-frontier quality with much lower request-time compression overhead. The denominators differ and must not be mixed.
3. **Adoption boundary:** Attention is a proxy, all-seen is diagnostic, and online OO excludes offline construction and updates. Production readiness depends on governing compatibility keys, coverage, freshness, fallback, and citation verification.

## Next reading and primary sources

- To understand how retrieved evidence is first connected to a generator, read [RAG: Retrieval-Augmented Generation](/en/paper-reading/31-retrieval-augmented-generation/).
- To understand the dense-retriever candidate stage, read [DPR](/en/paper-reading/32-dense-passage-retrieval/).
- To compare “when to retrieve” with “how to compress after retrieval,” read [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/).

### Primary sources

- Nguyen, Hu, Liu, Doan, Wong, and Lai, [REVA arXiv record](https://arxiv.org/abs/2609.11209), v1 submitted 2026-09-10; author's accepted manuscript, accepted for IEEE ICDM 2026.
- [REVA full paper HTML](https://arxiv.org/html/2609.11209v1): Sections III–V, Algorithm 1, Figures 1–4, and Tables I–VI.
- [Official REVA artifact repository](https://github.com/UIUC-MLSys/REVA): README, `src/reva.py`, `src/cli.py`, `pyproject.toml`, `uv.lock`, and temporary data links; checked on 2026-09-15.
- [Temporary retrieval top-20 data link](https://drive.google.com/file/d/1buhg89g4n5j4tGiDj_94K1F0bflNzhFb/view?usp=sharing); [temporary compact score-cache data link](https://drive.google.com/file/d/1vO7EmnzyV2-Fqg8KudX-oT2haiwY8uPe/view?usp=sharing). Both are temporary endpoints listed by the README; a Zenodo DOI was not ready at audit time.
