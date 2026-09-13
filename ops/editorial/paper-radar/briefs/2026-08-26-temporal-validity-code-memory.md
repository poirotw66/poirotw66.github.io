---
stableId: "arxiv:2608.20685"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-26
lastVerifiedAt: 2026-08-26
primaryTrack: "retrieval-systems"
primaryGap: "production-rag"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 27
decision: "deep-read-candidate"
---

# Temporal validity on real software histories: stale-fact errors in code-assistant memory

## Identity

- Stable ID: `arxiv:2608.20685`.
- Canonical URL: https://arxiv.org/abs/2608.20685
- Authors: Neeraj Yadav.
- Venue or review status: arXiv v1, submitted 2026-08-21; follow-up to `arxiv:2606.26511`, “Temporal Validity in Retrieval Memory.”
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI `10.48550/arXiv.2608.20685`; the June paper is a related predecessor, not a duplicate.
- Code / model / data: The method and SHA256-pinned data description are public in the paper, but no clearly public implementation repository was identified; the product/research context references MemStrata.dev.

## Editorial fit

- Reader question: Can a code assistant stop retrieving a fact after a later GitHub fix supersedes it, without relying on timestamps or marker tokens?
- Why this belongs in the selected track: It tests temporal retrieval memory on real software histories and fills `retrieval-systems` / `production-rag` with a concrete stale-fact failure mode.
- Why now: The work turns memory freshness into an auditable benchmark rather than a generic “long-term memory” claim.

## Claim map

- Problem: Code-assistant memory can return a once-correct fact after a later issue or commit invalidates it.
- Main claim: Deterministic subject/relation/object supersession can close old validity intervals and expose only current facts to retrieval.
- Reported evidence: From 707 SWE-bench Lite/Verified GitHub issues, the paper identifies 130 clean atomic state transitions. It reports answer accuracy of .908 for temporal retrieval versus .569 naive RAG and .585 advanced reranking, with stale-fact error .023 versus .262 for the two baselines.
- Inference boundary: The benchmark covers only 130 clean transitions and one local 7B answer model; the results do not establish general temporal-memory reliability.

## Evidence audit

- Setup: State A/B transitions from real GitHub fixes, fixed seeds, no network access, Qwen2.5-Coder-7B answering, and 3B judges; the paper documents extraction and data hashes.
- Reproducibility limits: Only 18.4% of the 707 issues qualify as clean atomic transitions; extraction coverage is separate from retrieval evaluation, and no clear public code artifact was found.
- Missing evidence: Multiple model families, noisy multi-step histories, cross-repository conflicts, concurrent updates, and production write-back or rollback behavior.

## Critical reading

- Strongest result: It measures the exact failure engineers care about—retrieving a stale software fact—rather than treating memory as a single aggregate score.
- Weakest assumption: Deterministic supersession triples can be extracted and maintained reliably enough from messy project histories.
- Human review focus: Audit the transition-selection protocol, extraction false negatives, temporal query construction, and the gap between benchmark memory and a live codebase.

## Recommendation

- Output level: Deep Read.
- Series fit: `retrieval-systems` / `production-rag`; the paper complements current RAG integrity and enterprise retrieval evaluation work.
- Suggested internal framing: “Freshness is a retrieval invariant, not a metadata afterthought.”
