---
stableId: "arxiv:2609.31342"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-29
lastVerifiedAt: 2026-09-29
primaryTrack: "retrieval-systems"
primaryGap: "production-rag"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# Stale-Document Poisoning: When Outdated Retrieval Overrides Correct Model Answers

## Identity

- Search window: Seven-day backfill ending 2026-09-29; arXiv v1 submitted 2026-09-25.
- Canonical URL: https://arxiv.org/abs/2609.31342
- Full paper: https://arxiv.org/html/2609.31342v1
- Authors: Md Shamim Ahmed, Lukas Galke Poech, and Richard Röttger; the paper lists the University of Southern Denmark.
- Venue or review status: arXiv preprint; peer-review status not established by the source.
- DOI / OpenReview / arXiv aliases: arXiv:2609.31342v1; DOI 10.48550/arXiv.2609.31342.
- Code / model / data: Appendix P says the release contains the frozen benchmark, official-source provenance, archived snapshots, scripts, per-run results, and pinned model revisions. No separate public repository or direct release URL was located; artifact accessibility and license remain unverified.

## Editorial fit

- Reader question: Can RAG distinguish a genuine source that used to be correct from one that is still applicable now?
- Why this belongs in the selected track: It tests temporal validity as a retrieval-trust problem, not merely relevance or factual correctness.
- Gap it fills: retrieval-systems / production-rag.
- Why now: Long-lived corpora preserve superseded medical, legal, software, and policy guidance. A real old source can be more dangerous than fabricated prompt injection because its provenance looks legitimate.

## Claim map

- Problem: A model that answers correctly without retrieval may reverse its answer after seeing an authentic but superseded document.
- Main claim: Models follow current and stale retrieved evidence readily, but often fail to condition trust on when a recommendation stopped applying; date-only signals are weaker than explicit validity intervals.
- Method: The authors build 317 source-verified knowledge reversals across medicine, law, software/API guidance, and platform policy; test twelve models on medicine, open models across four domains, a 50-item temporal control, causal interventions, and a fixed recency-aware reranker.
- What is genuinely new: Poisoning is counted only when retrieval overturns an answer the same model already got right without retrieval; the experiments separate evidence content from temporal applicability.

## Evidence audit

- Datasets: 317 reversals: 87 medicine, 100 law, 60 software/API, and 70 platform-policy items. Each records an official source URL; the temporal-applicability subset contains 50 reversals.
- Benchmarks and metrics: Outdated retrieval flips 30% of Llama and 37% of Qwen answers in the reported medical comparison without an instruction to trust it; explicit follow-dated-document wording raises these figures to 66% and 75%. Across four open models and domains, reported poisoning ranges from 17–91%; matched current evidence is followed in 97–100% of trials.
- Baselines: Correct answer without retrieval, current versus stale evidence, neutral versus explicit-follow instructions, validity-date conditions, and dense retrieval versus a fixed hybrid recency reranker.
- Ablations: The paper holds historical evidence fixed while changing evaluation date and validity-interval wording; it also reports model/domain subsets, causal interventions, and retrieval-date-quality conditions.
- Statistical uncertainty: Item-level denominators, confidence intervals, paired reranking tests, and eligible subsets are reported. Do not present the percentages as a pooled universal rate.
- Threats to validity: Temporal-applicability results use four open models and a 50-item subset; the twelve-model recency analysis uses medicine. Automated capture succeeded for 39/87 medical official pages; the remaining URLs and capture status are retained, while 460 nonmedical snapshots passed the reported audit. No independent reproduction was found.

## Reproducibility

- Available artifacts and licenses: Appendix P describes benchmark items, provenance, archived snapshots, corpora, code, per-run outputs, and pinned model revisions. A direct repository/download URL and artifact license were not found on the paper page; do not claim a verified one-click reproduction.
- Environment or compute requirements: Python manifests are named; full reproduction also needs the model/API revisions and inference budget in the appendices.
- Smallest useful reproduction: Re-run a small set of current-versus-superseded pairs on one open model, separately varying date-only and explicit-validity metadata, and report paired answers plus retrieval selection.
- Blocking unknowns: Direct artifact location/license, current-model replication, externally reviewed validity labels, and whether production systems can maintain reliable temporal metadata.

## Critical reading

- Strongest result: Genuine stale evidence can reverse an otherwise-correct answer; explicit validity information helps more than merely displaying a date in the controlled subset.
- Weakest assumption: A system can obtain accurate applicability metadata. With incorrect dates, the reranker selects current evidence less often than the dense baseline in every reported domain.
- Stated limitations: The benchmark is frozen and domain-bounded; medical source archival is incomplete; mitigation is sensitive to metadata quality.
- Claims not supported by the evidence: This does not show that recency sorting alone makes RAG safe, that historical evidence should always be discarded, or that the rates transfer directly to live corpora.

## Bloss0m connection

- Related Traditional Chinese routes: #63 Learning When to Trust; #73 When Stale Constraints Go Unchecked; #61 BioPhys-Bridge.
- Related English routes: The paired #63, #73, and #61 readings.
- Duplication risk: High thematic adjacency to selective evidence trust and stale agent memory, but distinct: authentic superseded documents induce retrieval-driven reversal of an answer already correct without retrieval. Contrast source validity with memory-constraint verification.
- Suggested internal links: Connect selective trust (#63) to temporal validity, then contrast stale retrieval evidence with inherited agent-memory constraints (#73).

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30 (5/5/5/3/5/5). The multi-domain benchmark, controlled validity manipulation, causal tests, and retrieval defense are unusually actionable. Reproducibility is 3 because Appendix P describes extensive files but no direct repository or licensed bundle was found.
- Open questions requiring human approval: Preserve the distinction between dates and explicit validity intervals; state that reranking helps only with reliable metadata; verify the described release before claiming artifacts are directly downloadable.
