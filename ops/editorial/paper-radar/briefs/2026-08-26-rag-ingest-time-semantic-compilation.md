---
stableId: "arxiv:2608.20845"
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

# RAG Deserves an Index: why ingest-time compilation beats query-time interpretation

## Identity

- Stable ID: `arxiv:2608.20845`.
- Canonical URL: https://arxiv.org/abs/2608.20845
- Authors: Kyle Wild, Yusuke Takahashi, and Asako Uraki.
- Venue or review status: arXiv v1, submitted 2026-08-21; no separate review record identified.
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI `10.48550/arXiv.2608.20845`; companion paper `arxiv:2608.16621` is related but not a duplicate record.
- Code / model / data: The paper describes a PostgreSQL-oriented reference schema and synthetic/held-out experiments; no public implementation repository was identified during this scan.

## Editorial fit

- Reader question: When should a RAG system pay the cost of semantic interpretation—at query time, or once at ingestion with explicit provenance and maintenance contracts?
- Why this belongs in the selected track: It proposes a production-RAG architecture built around a maintained semantic index, filling `retrieval-systems` / `production-rag`.
- Why now: The paper supplies a measurable maintenance pilot and held-out comparison while making provenance a first-class data object.

## Claim map

- Problem: Query-time chunk interpretation spends tokens repeatedly and makes exact provenance, updates, and semantic consistency difficult to govern.
- Main claim: Ingest-time semantic compilation can maintain geometric embeddings plus symbolic atomic claims with exact quote provenance as a derived database object.
- Reported evidence: In a synthetic 3k-to-9k-document maintenance pilot with 50 updates, the paper reports 33.7x lower cost per update, 23.8x lower cumulative cost, recall@10 of 1.0, and principal-angle drift below 1e-11 degrees; a held-out transcript set reports 85.2% claim correctness at about 2.2k reader tokens versus 72.5% for the best chunk baseline at about 16.3k tokens.
- Inference boundary: The pilot is synthetic and idealized; the results do not yet establish production API, multi-tenant, or long-lived data-quality behavior.

## Evidence audit

- Benchmarks and setup: Synthetic maintenance data plus 500 held-out transcripts/499 questions; the paper also reports a 69,746-claim replay with 1.1% rejection in a 20-document example.
- Related evidence: Companion paper https://arxiv.org/abs/2608.16621 studies cost scaling with change and should be read together with the main proposal.
- Artifacts and unknowns: A full public implementation, production workload, update failure handling, extraction recall, and review workflow were not located.

## Critical reading

- Strongest result: It makes provenance and semantic maintenance explicit, enabling a discussion of data contracts rather than only retrieval scores.
- Weakest assumption: Extraction and compilation remain correct enough under messy, changing, contradictory enterprise documents.
- Human review focus: Verify the held-out protocol, cost model, claim rejection behavior, and how a production system detects and repairs stale compiled claims.

## Recommendation

- Output level: Deep Read.
- Series fit: `retrieval-systems` / `production-rag`; connect to chunking, provenance, update semantics, and token-budget governance.
- Suggested internal framing: “A RAG index is a maintained semantic database object—or an ungoverned cache.”
