---
stableId: "arxiv:2609.19897"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-19
lastVerifiedAt: 2026-09-19
primaryTrack: "retrieval-systems"
primaryGap: "rag-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "deep-read-candidate"
---

# TRACE: Accountable Agentic Retrieval for Source Discovery in Digital Archives

## Identity

- Search window: Strict 72-hour scan ending 2026-09-19; arXiv v1 was submitted on 2026-09-17.
- Canonical URL: https://arxiv.org/abs/2609.19897
- Full paper: https://arxiv.org/html/2609.19897v1
- Venue or review status: arXiv preprint; no peer-review status was assumed.
- Code: https://github.com/Kepler1908/TRACE; the paper describes an internal DECIDON deployment for 24 researchers across six partner institutions.

## Editorial fit

- Reader question: How can an agent search messy historical archives while retaining a traceable path back to the source?
- Track and gap: retrieval-systems / rag-evaluation.
- Why now: TRACE targets OCR-degraded, heterogeneous archives where answer quality is not enough if the source-discovery path cannot be audited.

## Claim map

- Method: A training-free agentic retrieval pipeline uses corpus-targeted decomposition, fused warm starts, retrieval verdicts with deferred re-evaluation, and count-grouped reranking.
- Dataset: HistoriQA-ThirdRepublic contains 1,752 French historical questions.
- Result: TRACE reports R@10 0.856 and MRR 0.653, outperforming sparse, dense, graph, and agentic RAG baselines, with the largest gains on multi-hop and cross-corpus questions.
- Deployment claim: DECIDON serves real researchers, and the paper estimates about $0.02 per question under its hosted-inference setup.

## Evidence audit

- Baselines and metrics: Sparse/dense/graph/agentic RAG comparisons, Recall@10, MRR, question-type analysis, and cost estimate.
- Artifact: Public TRACE repository and a named benchmark make the retrieval logic inspectable.
- Limitations: The internal deployment and archive corpus are not fully reproducible from the public repository; hosted-model prices and OCR conditions may shift.
- Independent evidence: No independent rerun or external deployment was verified.

## Reproducibility

- A smallest useful reproduction is to run the public pipeline on HistoriQA with the released index/configuration, then compare source paths and reranking decisions rather than only final answers.
- Blocking unknowns include exact corpus preparation, OCR normalization, model prompts, and current hosted-inference cost.

## Critical reading

- Strongest insight: Accountability can be implemented as retrieval decisions and deferred re-evaluation, not only as a citation appended after generation.
- Main risk: Higher retrieval metrics do not guarantee that a historian can reconstruct every claim's provenance in a heterogeneous archive.
- Evidence limit: Strong primary evaluation and code, but production and corpus transfer remain author-reported.

## Bloss0m connection

- Suggested links: RAG evaluation, source provenance, partial-answer stopping, and agent trace models.
- Article focus: trace one query through decomposition, warm start, verdict, reranking, and evidence handoff.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30: concrete retrieval architecture, public code, real user context, baseline coverage, and direct provenance consequences; reproducibility is limited by corpus and deployment details.
- Open questions: What should a provenance contract guarantee when OCR, source versions, and multi-hop retrieval all change?
