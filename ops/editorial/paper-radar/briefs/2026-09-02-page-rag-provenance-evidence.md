---
stableId: "arxiv:2608.29753"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-02
lastVerifiedAt: 2026-09-02
primaryTrack: "retrieval-systems"
primaryGap: "rag-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 4
  total: 28
decision: "deep-read-candidate"
---

# PAGE-RAG: Provenance-Aware Graph Evidence Promotion for Fixed-Budget Multi-hop Retrieval-Augmented Generation

## Identity

- Canonical URL: https://arxiv.org/abs/2608.29753
- Authors: Haokun Deng, Xunkai Li, Hongchao Qin, Rong-Hua Li.
- Venue or review status: arXiv preprint, v1 submitted 2026-08-30.
- DOI / OpenReview / arXiv aliases: arXiv:2608.29753; DOI https://doi.org/10.48550/arXiv.2608.29753.
- Code / model / data: Implementation https://github.com/denghk666/PAGE-RAG under Apache License 2.0; third-party baselines retain their original licenses.

## Editorial fit

- Reader question: When a multi-hop retriever finds many connected passages, how can it promote the few that jointly support the answer without increasing the reader’s context budget?
- Why this belongs in the selected track: PAGE-RAG isolates a retrieval-to-reading selection layer and evaluates both answer quality and supporting-fact quality under a fixed final budget.
- Gap it fills: RAG evaluation—separating candidate reachability, support selection, and final answer generation instead of treating graph connectivity as evidence.
- Why now: GraphRAG systems often expose useful relations but can also create plausible distractor paths; the paper offers an inspectable provenance-aware correction.

## Claim map

- Problem: A narrow top-k can miss a necessary hop, while expanding the reader input admits distractors. Connected candidates are not automatically answer-supporting evidence.
- Main claim: A query-local provenance-aware graph plus support-aware path scoring and minimal sufficient selection improves multi-hop QA while keeping the final reader budget fixed.
- Method: Retrieve an expanded candidate pool, build a temporary graph with source and trigger metadata, score paths using relevance, source diversity, confidence, specificity, hubness, noise, and coherence, then select a compact context of at most five final units.
- What is genuinely new: The graph is explicitly a selection workspace and edges are support hypotheses, not facts; the method can be inserted after several existing RAG backends without replacing their upstream retrieval logic.

## Evidence audit

- Datasets: HotpotQA, MuSiQue, and 2WikiMultiHopQA.
- Benchmarks and metrics: Supporting-fact F1 and answer F1, with sentence-level and mixed document/passage/chunk protocols. The main reader is DeepSeek-V4-Pro and the final reader budget is fixed at five units.
- Baselines: NV-Embed-v2, IRCoT@5, RECOMP@5, SelfRAG, EfficientRAG, GFM-RAG, LightRAG, KG2RAG, and HippoRAG2 in the reported comparisons.
- Reported results: Against NV-Embed-v2, the weighted average answer F1 rises from 58.00 to 65.00 and supporting-fact F1 from 44.86 to 55.31. The paper also reports plug-in gains across all listed backend families.
- Ablations: Removing support-aware scoring lowers average answer F1 to 50.64; removing minimal selection lowers it to 54.44 versus 65.00 for the full method. Feature-group ablations separately test query alignment, provenance reliability, bridge specificity, and path quality control.
- Statistical uncertainty: The paper reports weighted averages and noise-sensitivity values, but no confidence interval or significance protocol is visible in the abstract-level evidence.
- Threats to validity: The candidate pool must already contain the missing fact; the reader model, benchmark construction, entity extraction, and mixed-granularity mapping may affect transfer to enterprise corpora.

## Reproducibility

- Available artifacts and licenses: Public Apache-2.0 implementation; benchmark datasets are established public QA resources, while third-party baseline licenses vary.
- Environment or compute requirements: Need the repository’s setup and DeepSeek-V4-Pro access or a substitute reader; reproducing every backend comparison may be expensive.
- Smallest useful reproduction: Run the provided sentence-level pipeline on one benchmark with NV-Embed-v2, compare top-5 retrieval with PAGE-RAG, and reproduce the support-aware and minimal-selection ablations.
- Blocking unknowns: Exact implementation defaults, index construction, entity/relation extraction, reader prompts, random seeds, API cost, and whether all upstream baselines are runnable from the public repository.

## Critical reading

- Strongest result: The paper directly links the mechanism to a fixed-budget outcome and shows that provenance-aware scoring and minimal selection both matter.
- Weakest assumption: Benchmark supporting facts and extracted graph edges are reliable enough to stand in for the evidence-quality problem in real, messy documents.
- Stated limitations: PAGE-RAG cannot recover facts absent from the expanded pool; noise sensitivity degrades monotonically as distractors are added; graph backends often see smaller gains because they already expose relations.
- Claims not supported by the evidence: The experiments do not prove universal improvement for arbitrary retrievers, domain corpora, languages, or readers.

## Bloss0m connection

- Related Traditional Chinese routes: Existing RAG, GraphRAG, reranking, and production-RAG routes after archive-aware lookup.
- Related English routes: Existing Retrieval Systems entries after archive-aware lookup.
- Duplication risk: Low; the fixed-budget support-promotion layer is narrower and more operational than a general GraphRAG survey.
- Suggested internal links: Contrast with RAG-MCP and GraphRAG-vs-RAG, then connect to future provenance-contract coverage.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5/5 topic relevance, 5/5 novelty, 5/5 evidence quality, 4/5 reproducibility, 5/5 engineering value, 4/5 series value. It has public code, transparent ablations, and a clear deployment knob: expand search, keep reading fixed.
- Open questions requiring human approval: Does the code reproduce the weighted averages? How sensitive are results to entity extraction and graph edge types? What happens with stale, permission-filtered, or conflicting enterprise sources? Can support F1 predict real answer trustworthiness?
