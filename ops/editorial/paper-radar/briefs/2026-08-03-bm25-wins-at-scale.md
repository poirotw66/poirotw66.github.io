---
stableId: "arxiv:2607.26497"
sourceVersion: "v3"
status: "published"
firstSeenAt: 2026-08-03
lastVerifiedAt: 2026-08-07
primaryTrack: "retrieval-systems"
primaryGap: "production-rag"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 2
  engineeringValue: 5
  seriesValue: 5
  total: 26
decision: "published"
---

# BM25 Wins at Scale: A Scaling Study of Retrieval-Augmented Generation Paradigms

## Identity

- Stable ID: `arxiv:2607.26497`
- Canonical URL: https://arxiv.org/abs/2607.26497
- Authors: Pengyu Wang, Benfeng Xu, Shaohan Wang, Mingxuan Du, Xin Zeng, Huarui Wu, Lei Zhang, Licheng Zhang (current v3 list)
- Venue or review status: arXiv v3, revised 2026-07-31; not peer reviewed
- DOI / OpenReview / arXiv aliases: arXiv 2607.26497; arXiv-issued DOI `10.48550/arXiv.2607.26497`; v1/v2/v3 are versions of the same normalized arXiv ID
- Code / model / data: The paper and TeX source are accessible. A public executable benchmark or data release is unknown from the inspected primary page.

## Editorial fit

- Reader question: When an enterprise corpus grows from thousands to hundreds of thousands of documents, which retrieval substrate should carry global candidate discovery, and where should agentic reasoning begin?
- Why this belongs in the selected track: It directly addresses the `production-rag` gap and stress-tests the existing GraphRAG/RAG coverage at scale with cost, latency, and accuracy held in one controlled protocol.
- Gap it fills: `production-rag`, with a direct follow-up to the existing GraphRAG-vs-RAG reading path.
- Why now: The current v3 is a recent revision with changed title and author list, and its 28-tier scaling design produces an engineering decision rule rather than another fixed-size benchmark comparison.

## Claim map

- Problem: RAG paradigms are often compared on different benchmarks at one corpus size, hiding how accuracy and cost change as an enterprise corpus grows.
- Main claim: In this controlled study, BM25 overtakes file-system agency around 10M corpus tokens, leads at larger shared tiers, and provides a low-cost scalable default; agentic reasoning works better after ranked discovery.
- Method: Evaluate lexical, dense, graph-based, and file-system-agent pipelines over 28 nested tiers from 1,144 to 511,959 documents, with a fixed bedrock of relevant and adversarial documents, one reader/judging protocol, token metering, latency, and matched retrieval controls.
- What is genuinely new: The nested corpus ladder, cross-paradigm cost/accuracy scaling, and retrieval-swap control that changes only the access substrate while holding the agent harness fixed.

## Evidence audit

- Datasets: EnterpriseRAG-Bench with 511,959 documents, 500 questions, gold documents, adversarial traps, and lures; the corpus is fictional but enterprise-shaped.
- Benchmarks and metrics: Official combined answer score, document recall, construction/query tokens, latency, and independent/binary re-judging; full-scale Agent+BM25 scores 69.4 versus 36.9 for raw-file agency on the matched 150-question resweep.
- Baselines: BM25, DenseRAG, HippoRAG 2, MS-GraphRAG, LightRAG, LinearRAG, File-System Agent, and matched retrieval/harness controls.
- Ablations: Corpus scaling tiers, independent judge, binary protocol, matched access-layer swap, harness control, and graph construction cost fits.
- Statistical uncertainty: The paper reports 95% confidence bands/intervals for selected comparisons and 96.2% agreement from an independent judge; close-pair rankings can vary.
- Threats to validity: One enterprise-shaped fictional corpus, one main reader/judging setup, limited question set and fixed adversarial bedrock, extrapolated graph build costs, and unavailable public executable artifact are important constraints.

## Reproducibility

- Available artifacts and licenses: arXiv PDF, HTML, and TeX source are available; dataset, code, exact model weights, and deployment setup are unknown unless separately released.
- Environment or compute requirements: The study uses multiple retrieval builders and LLM readers over a 600.8M-token full corpus; exact compute and wall-clock cost are not fully specified in the primary abstract/page.
- Smallest useful reproduction: Recreate a few nested tiers with a fixed bedrock and compare BM25, dense, graph, and agentic access under shared reader/judge and token metering; treat this as a proposed experiment, not evidence from the paper.
- Blocking unknowns: EnterpriseRAG-Bench access/license, corpus construction scripts, exact prompts and model versions, full graph builder configuration, and artifact release status.

## Critical reading

- Strongest result: The matched retrieval swap isolates candidate discovery: Agent+BM25 raises the full-scale score from 36.9 to 69.4 while using roughly one ninth of the raw file-agent query tokens.
- Weakest assumption: The fixed bedrock and source/noise-stratified growth order make scaling interpretable, but they may not represent how real enterprise knowledge bases evolve, duplicate, or enforce ACLs.
- Stated limitations: Broad family rankings are robust across the paper's checks, but close pairs can vary; graph costs include extrapolation beyond completed tiers, and the study does not imply BM25 is universally best for every relational or semantic workload.
- Claims not supported by the evidence: The paper does not prove BM25 is the best retriever for every enterprise corpus, that GraphRAG is never justified, or that agentic retrieval has no value after candidate ranking.

## Bloss0m connection

- Related Traditional Chinese routes: `07-GraphRAG-vs-RAG`; `65-enterprise-rag-guide`; `35-graph-rag-llm`; `07-agentic-rag`.
- Related English routes: `en/07-GraphRAG-vs-RAG`; `en/65-enterprise-rag-guide`; `en/35-graph-rag-llm`; `en/07-agentic-rag`.
- Duplication risk: Moderate overlap with the GraphRAG comparison and Enterprise RAG guide; differentiate by corpus scaling, cost/latency, candidate discovery, and matched controls rather than a generic BM25-versus-GraphRAG verdict.
- Suggested internal links: `production-rag` gap path and the enterprise-rag cluster; link back to the existing GraphRAG reading for fixed-size evaluation context.

## Recommendation

- Output level: Deep Read
- Score rationale: 26/30. It fills a priority production-RAG gap with unusually actionable scaling and cost evidence; reproducibility is limited because the public primary page does not expose a complete executable artifact and the benchmark's external availability is unknown.
- Open questions requiring human approval: Verify whether EnterpriseRAG-Bench, code, prompts, or full configurations are released; decide whether to foreground the v3 revision history; and determine whether the practical angle should be a production-RAG architecture guide or a critical paper reading.
