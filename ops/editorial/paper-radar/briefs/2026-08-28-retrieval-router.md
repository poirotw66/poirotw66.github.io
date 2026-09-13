---
stableId: "arxiv:2608.25625"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-28
lastVerifiedAt: 2026-08-28
primaryTrack: "retrieval-systems"
primaryGap: "production-rag"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "deep-read-candidate"
---

# RetrievalRouter: Joint Modality and Architecture Selection for Document Retrieval

## Identity

- Stable ID: `arxiv:2608.25625`.
- Canonical URL: https://arxiv.org/abs/2608.25625
- Authors: Emre Kuru, Mehmet Onur Keskin, Reza Farahbakhsh, and Noel Crespi.
- Venue or review status: arXiv v1 submitted 2026-08-26; the record and repository identify it as an EMNLP 2026 main-conference paper.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2608.25625`; no separate identifier located.
- Code / model / data: https://github.com/emrekuruu/retrieval-router; MIT repository with released datasets, checkpoints, training data, prediction files, evaluation scripts, and launchers.

## Editorial fit

- Reader question: Can a production RAG system choose a cheaper or richer retrieval pipeline per query instead of accepting one fixed accuracy-latency compromise?
- Why this belongs in the selected track: RetrievalRouter jointly routes among sparse, dense, multimodal, late-interaction, and reranking pipelines, directly filling `retrieval-systems` / `production-rag`.
- Gap it fills: Existing retrieval coverage discusses reranking, chunking, and evaluation, but not query-time selection across heterogeneous retrieval arms with an explicit operating frontier.
- Why now: The paper evaluates 11 datasets and 85,103 queries, and the public repository exposes all released checkpoints and test predictions needed to inspect aggregate and paired results.

## Claim map

- Problem: No fixed retrieval pipeline dominates across query modality, document structure, effectiveness, and latency.
- Main claim: A router using query text alone can select an appropriate retrieval pipeline and reach an operating point that is more accurate and faster than the reported static baselines.
- Method: Train a five-arm routing policy from per-query pipeline measurements, then tune a lambda-weighted objective to expose accuracy-latency frontier points.
- Reported result: At the paper's lambda=0.1 point, the HTML reports nDCG@5 of about 0.755 and mean latency of about 0.666 seconds, versus the strongest static ML baseline at about 0.737 and 8.283 seconds; the repository provides matching prediction files and reproduction commands.
- What is genuinely new: The engineering object is a learned policy over heterogeneous retrieval infrastructure, not another single retriever or reranker.

## Evidence audit

- Datasets and benchmarks: REAL-MM-RAG, T2-RAGBench, and MMDocRAG spanning financial, scientific, open-domain, text, and multimodal retrieval; 11 datasets and 85,103 queries are listed in the repository.
- Benchmarks and metrics: nDCG, MRR, Recall, mean and P95 latency, plus paired significance tests with Holm correction in the paper.
- Baselines: BM25, dense and multimodal retrieval, late interaction, reranking, static policies, and an adapted prior routing baseline.
- Ablations: Lambda operating points, static-vs-adaptive comparisons, and an oracle upper bound are central to the interpretation.
- Statistical uncertainty: The paper reports significance tests, but deployment-level variance, index-refresh effects, tail latency under load, and routing drift remain unknown.
- Threats to validity: The evaluation uses a single H100-oriented environment and curated benchmark corpora; a real deployment must account for index duplication, cache behavior, model serving topology, and the cost of measuring or maintaining every arm.

## Reproducibility

- Available artifacts and licenses: MIT repository; released datasets/checkpoints, 8,506 unique test-query predictions, training data, evaluation code, and retrieval launchers are exposed.
- Environment or compute requirements: Separate retrieval, training, and evaluation environments; multimodal indexes and model endpoints require substantial storage and GPU resources.
- Smallest useful reproduction: Run the included evaluation command on `retrievalrouter_l10.xlsx`, compare nDCG and mean latency with `baseline.xlsx`, then test whether the same policy survives a held-out corpus and a changed serving topology.
- Blocking unknowns: End-to-end index-build cost, per-query routing overhead under concurrency, artifact freshness, and third-party reproduction outside the authors' hardware remain to be audited.

## Critical reading

- Strongest result: The repository makes the headline operating point mechanically inspectable rather than leaving the router claim as a plot-only result.
- Weakest assumption: Query text is sufficient to predict which retrieval pipeline will win when document distributions, index freshness, and infrastructure load change.
- Stated limitations: Benchmark and hardware scope, the need to maintain multiple arms, and the gap between offline per-query measurements and online serving economics are material limitations.
- Claims not supported by the evidence: The results do not prove universal superiority, lower total cost of ownership, or safe routing under unseen modalities and adversarial queries.

## Bloss0m connection

- Related Traditional Chinese routes: Existing retrieval and RAG evaluation coverage, especially the BM25-at-scale and evidence-grounded RAG routes; no duplicate article was found.
- Related English routes: Connect to the retrieval-systems and production-RAG reading series during drafting.
- Duplication risk: Low-to-medium with existing retriever and chunking candidates; the heterogeneous query router and latency frontier are the differentiators.
- Suggested internal links: `retrieval-systems`, `production-rag`, and the existing BM25, chunking, and RAT Radar candidates.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 4 evidence quality + 5 reproducibility + 5 engineering value + 5 series value = 29. The breadth of evaluation and public artifact are strong; production economics and distribution shift remain open.
- Open questions requiring human approval: Re-run the released prediction evaluation, inspect per-dataset failures, and decide whether to frame the article around the accuracy-latency frontier or the operational cost of maintaining multiple retrieval arms.

