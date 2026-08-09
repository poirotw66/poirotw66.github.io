# Paper Reading comprehension audit — 2026-08-09

## Objective

Determine whether a target reader can understand the paper's technical essence, evidence, intended message, and adoption boundary from the Bloss0m article alone. This audit supplements evidence coverage; it does not re-verify the primary papers.

## Pilot result

The deterministic audit originally scored the three pilot pairs between 44% and 56%. After adding teaching layers without removing their evidence sections, every pilot language reaches 9/9 structural signals. The existing strict evidence audit remains at zero warnings and zero advisories.

| Pair | Before zh/en | After zh/en | Main repair |
| --- | ---: | ---: | --- |
| 03 RAG-Anything | 44% / 44% | 100% / 100% | proxy-versus-artifact mental model; Figure 4 end-to-end table trace; three-point recap |
| 08 OSReward | 44% / 44% | 100% / 100% | observation-interface intuition; file-state verification walkthrough; reward-boundary recap |
| 17 RubricRanker | 56% / 44% | 100% / 100% | ranking-versus-set-selection intuition; depression evidence-set walkthrough; ablation-centered recap |

## Semantic teach-back

The following answers were produced from the revised articles without consulting the papers during the comprehension pass.

### 03 RAG-Anything

1. **Problem:** caption-only multimodal RAG loses table coordinates, figure topology, and cross-page relationships.
2. **Prior limitation:** one textual surrogate is asked to serve both retrieval and final visual interpretation.
3. **Core idea:** combine a structural graph and dense search, use textual proxies to retrieve, and dereference raw artifacts to answer.
4. **Mechanism:** the 2020 wages walkthrough traces parsing, graph and dense candidates, fusion, artifact recovery, and the parser failure point.
5. **Evidence:** Tables 2–4 and Figure 2 support an overall and long-document advantage while showing graph construction contributes more than reranking and some slices regress.
6. **Boundary and consequence:** use the design when valuable questions depend on cells, panels, axes, or cross-page links; do not adopt it without parser QA, abstention, provenance, and cost monitoring.

Scorecard: 18/18. Every answer points to the ninety-second map, core-intuition section, worked example, result sections, decision matrix, or exit recap.

### 08 OSReward

1. **Problem:** VLM judges can mistake a plausible completion narrative for actual computer-use success.
2. **Prior limitation:** compressed screenshots and text histories omit the live state that defines task completion.
3. **Core idea:** verdict quality is bounded by evidence quality; deterministic state checks, model judgment, and human arbitration need separate roles.
4. **Mechanism:** the saved-file walkthrough connects agent execution, human gold labeling, judge input, false success, and a hybrid verifier.
5. **Evidence:** Table 1 and Figures 5–7 show large Hard-set degradation, directional failure-recall errors, and structured platform/failure differences.
6. **Boundary and consequence:** OS-Shepherd is a lower-cost semantic judge, not a replacement for state verification; artifact and label-generation limits remain.

Scorecard: 18/18. The article can teach the paper's evaluation message without requiring the reader to reconstruct it from the benchmark tables.

### 17 RubricRanker

1. **Problem:** independently relevant top-k documents can still form an incomplete, repetitive, contradictory, or unauthoritative evidence set.
2. **Prior limitation:** pairwise relevance optimizes document order rather than the joint usefulness of the selected context.
3. **Core idea:** train a generative selector on query-specific set rubrics so it chooses a complementary evidence set.
4. **Mechanism:** the depression-treatment walkthrough traces candidate retrieval, rubric construction, SFT labels, RL reward, inference, and label/judge failure.
5. **Evidence:** Tables 1–3 show downstream gains and identify query-specific labels plus cold-start SFT as more important than RL alone.
6. **Boundary and consequence:** the selector improves the evidence budget but does not verify citations or answers; use it between retrieval and an independently verified answer path.

Scorecard: 18/18. The revised article makes the paper's real message—set-level supervision, not merely a larger reranker—explicit.

## Remaining archive backlog

Priority is based on the lower score in each bilingual pair. These are structural comprehension findings, not claims that the underlying evidence is incorrect.

### P0 — repair first

| Pair | zh/en | Main gaps |
| --- | ---: | --- |
| 09 ContextWeave | 22% / 22% | all teaching layers plus explicit engineering boundary |
| 10 ARGUS | 33% / 22% | intuition, walkthrough, method flow parity, engineering boundary |
| 12 Agents4D | 33% / 33% | intuition, walkthrough, engineering consequence |
| 14 Agent Trajectory Sentinel | 33% / 33% | intuition, walkthrough, engineering consequence |
| 16 PAST-Bench | 33% / 44% | intuition, walkthrough, Chinese engineering consequence |
| 05 RAG without Forgetting | 33% / 44% | Chinese method flow plus shared teaching layers |
| 06 Beyond RAG for Agent | 33% / 44% | method flow and shared teaching layers |
| 07 GraphRAG vs RAG | 33% / 33% | method flow and all teaching wrappers |

## P0 repair result

The eight P0 pairs were re-read against their primary arXiv sources and the current Paper Radar records where those records exist. The repair preserves the original evidence sections and cover assets, adds a bounded reader path, and sets `updatedDate` to 2026-08-09. Both strict pair and comprehension audits now pass at 9/9 per language.

| Pair | Before zh/en | After zh/en | Teach-back result |
| --- | ---: | ---: | --- |
| 05 RAG without Forgetting | 33% / 44% | 100% / 100% | ERM is verifier-gated, attributable key mutation; the gate and rollback are adoption boundaries. |
| 06 Beyond RAG for Agent | 33% / 44% | 100% / 100% | xMemory spends context budget top-down through a hierarchy; QA gains do not establish production memory governance. |
| 07 GraphRAG vs RAG | 33% / 33% | 100% / 100% | The contribution is controlled method selection/integration, not a universal GraphRAG win. |
| 09 ContextWeave | 22% / 22% | 100% / 100% | Memory is an intervention on later workspace outcomes; misleading recall remains a measured failure mode. |
| 10 Argus | 33% / 22% | 100% / 100% | The portable idea is verified state transition and rollback, not four role prompts; runtime artifacts remain unavailable. |
| 12 AgentS4D | 33% / 33% | 100% / 100% | Completion and unsafe evidence are separate outcomes across a full harness–model–environment configuration. |
| 14 Agent Trajectory Sentinel | 33% / 33% | 100% / 100% | Temporal detection is triage, deterministic verification decides predicates, and rollback has operational limits. |
| 16 PAST-Bench | 33% / 44% | 100% / 100% | A persistence gain needs both a matched no-persistence control and trace-backed mechanism evidence. |

### P0 semantic teach-back

For every P0 article, the revised draft alone answers all six Paper Essence Contract questions: the problem, prior limitation, core technical decision, representative end-to-end path, strongest bounded evidence, and adoption/non-adoption boundary. Worked examples are explicitly labelled explanatory when they are not original paper episodes. The original evidence sections retain at least three locatable Figure/Table/Section/Appendix anchors; the new teaching sections identify the controls and what each result does not establish.

### P1 — strong evidence, add a reader path

| Pair | zh/en | Main gaps |
| --- | ---: | --- |
| 01 AlexNet Part 1 | 44% / 44% | ninety-second map, intuition, worked example, method flow, recap |
| 02 AlexNet Part 2 | 56% / 44% | teaching layers and English prior-limitation parity |
| 04 RAG-MCP | 44% / 44% | ninety-second map, intuition, walkthrough, recap |
| 11 AskChem | 44% / 44% | ninety-second map, intuition, walkthrough, recap |
| 13 BM25 at Scale | 56% / 44% | teaching layers and English prior-limitation parity |
| 15 Before Reasoning Fails | 44% / 44% | ninety-second map, intuition, walkthrough, recap |

## P1 repair result

The six P1 pairs were then re-read against the primary paper and relevant Paper Radar brief/ledger records. Both strict pair and comprehension audits now pass at 9/9 per language. AlexNet was deliberately split by reader question: Part 1 explains why the architecture became trainable at scale; Part 2 explains generalization, training recipe, and how to interpret the reported result.

| Pair | Before zh/en | After zh/en | Teach-back result |
| --- | ---: | ---: | --- |
| 01 AlexNet Part 1 | 44% / 44% | 100% / 100% | Convolutional locality, ReLU, and constrained multi-GPU design make capacity trainable; they are not timeless defaults. |
| 02 AlexNet Part 2 | 56% / 44% | 100% / 100% | Augmentation, dropout, and schedule make the architecture generalize; individual deltas do not add to a system result. |
| 04 RAG-MCP | 44% / 44% | 100% / 100% | Retrieval narrows MCP candidates, while compatibility, permission, invocation, and task success remain separate controls. |
| 11 AskChem | 44% / 44% | 100% / 100% | Provenance-carrying claims make sources inspectable; locator quality does not establish claim truth. |
| 13 BM25 at Scale | 56% / 44% | 100% / 100% | The result is a controlled scaling decision about candidate discovery, not a universal lexical-retrieval claim. |
| 15 Before Reasoning Fails | 44% / 44% | 100% / 100% | Read-Gate enforces an observable evidence action; it cannot make an incorrect or incomplete read grounded. |

### P1 semantic teach-back

The revised drafts independently expose problem, prior limitation, technical decision, a bounded worked example, strongest evidence, and adoption boundary. Each preserves the existing Figure/Table/Section/Appendix evidence anchors and distinguishes a direct paper result from an explanatory engineering example. The direct artifact status is recorded as reachable, historical, missing, or unverified as of 2026-08-09; no repository link is treated as automatic reproduction.

## Next batch rule

Repair P0 in small bilingual batches. Preserve existing evidence anchors and artifact status, add only teaching material supported by the current article or primary paper, run both strict auditors, then perform the six-answer semantic teach-back before moving to the next batch.
