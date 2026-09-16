---
stableId: "arxiv:2609.15397"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-16
lastVerifiedAt: 2026-09-16
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
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

# When Tool Calls Succeed but Workflows Fail: Anomalies at the Agent–Tool Boundary

## Identity

- Search window: strict 72-hour scan ending 2026-09-16; arXiv v1 was submitted on 2026-09-14.
- Canonical URL: https://arxiv.org/abs/2609.15397
- Authors: Artem Trofimov and Boris Novikov.
- Venue or review status: arXiv preprint, v1; not peer-reviewed in the primary record.
- DOI / OpenReview / arXiv aliases: https://doi.org/10.48550/arXiv.2609.15397
- Code / model / data: Public MIT repository https://github.com/flame-stream/mcp-annotation-census at checked commit 5c24643d447402fc7bf8096555f72859b2c126cb. It ships a Python census tool and an approximately 90 MB registry snapshot marked 2026-07-27; this paper is not a model/checkpoint release.

## Editorial fit

- Reader question: When a long-running agent makes an irreversible external change, what must the tool boundary declare before the runtime can safely retry, wait, commit, compensate, or report unknown?
- Why this belongs in the selected track: It gives Agent Systems a vocabulary for failures that happen between a tool response and the external world, complementing existing trace, tool-use, and safety readings.
- Gap it fills: Tool-use reliability—how outcome uncertainty, compensation, dependency, commutativity, coordination, and external visibility should appear in a contract.
- Why now: MCP annotations are increasingly treated as a safety surface, while retry wrappers still commonly reason at call level. The paper tests what four standard advisory hints can and cannot express.

## Claim map

- Problem: A local success, failure, or timeout does not fully describe which external effects happened or survived across retries, speculation, concurrency, and partial failure.
- Main claim: Eight recurring anomalies—duplicated, missing, orphaned, residue, premature, contaminated, conflicting, and phantom effects—need different boundary capabilities and safety profiles.
- Method: Define an effect-history vocabulary, map anomalies to capabilities and safety profiles, compare stated or partial runtime coverage, then census four MCP annotations over an anonymously reachable registry subset.
- What is genuinely new: The effect-history framing separates world events from observations and identifies four black-box boundaries where wrapping a tool above the boundary cannot create authoritative outcome, atomic release, coordination, or visibility control.

## Evidence audit

- Datasets: The main quantitative artifact is not a model benchmark; it is a census of an official MCP registry snapshot from 2026-07-27. The reachable sample contains 9,234 anonymously queried remote targets and 98,291 tools.
- Benchmarks and metrics: Table 2 maps A1–A8 to capabilities; Table 3 compares partial runtime coverage; Table 4 checks whether standard MCP hints express those capabilities. Census metrics include reachability, annotation presence, signature frequency, and destructive-hint coverage.
- Baselines: ACRFence, RAC, Atomix, Cordon, CoAgent, and Shepherd are compared as stated or partial coverage references, not under one shared executable benchmark.
- Ablations: There is no conventional numerical ablation. The diagnostic is the capability matrix and four black-box boundary arguments; the article records this as a limitation rather than implying prevalence evidence.
- Statistical uncertainty: The registry counts are descriptive for the reachable subset and depend on the snapshot, client, anonymous query time, timeout policy, and server availability. No confidence interval or independent annotation-quality audit is provided.
- Threats to validity: The catalog and coverage mapping are conjectural in scope; semantic planning errors, read-side anomalies, policy violations, contract misclassification, liveness, and most intra-execution ordering are out of scope. Annotation emission is not proof of implementation.

## Reproducibility

- Available artifacts and licenses: The public repository is MIT licensed, not archived, and ships the census script, README, CSV outputs, and a registry snapshot. It never calls or executes a discovered tool; it uses remote tools/list metadata.
- Environment or compute requirements: Python 3.10+, mcp>=1.25,<2, network access for live collection, and enough local storage for the approximately 90 MB snapshot. The shipped snapshot enables offline recomputation.
- Smallest useful reproduction: Pin the repository commit and shipped snapshot, run the parser offline, recompute the four annotation rates, then compare the result with a separately collected snapshot while preserving reachability failures as a separate category.
- Blocking unknowns: A fresh live registry will not be identical; the anonymous reachable subset can drift; the paper does not provide a common runtime implementation or model. Model/checkpoint and interactive demo are not applicable or released.

## Critical reading

- Strongest result: The paper turns “tool metadata” into workflow safety questions. Table 2 makes clear why idempotency, compensation, staging, dependency, coordination, and visibility solve different failure shapes.
- Weakest assumption: The runtime coverage comparison is not a shared benchmark or formal proof, and the census cannot verify that an emitted annotation matches server behavior.
- Stated limitations: The external-effect model is conjectural and excludes semantic correctness, policy, read-side, liveness, and most ordering issues. The census is only the anonymously reachable remote subset.
- Claims not supported by the evidence: The paper does not measure production anomaly prevalence, certify any named runtime, show that all MCP servers implement annotations correctly, or prove that one contract family eliminates workflow failure.

## Bloss0m connection

- Related Traditional Chinese routes: [Parsing the Stream](/paper-reading/43-parsing-the-stream-live-trace/), [Continuity Security](/paper-reading/45-continuity-security-context-contracts/), and [ReVA](/paper-reading/47-reva-reusable-evidence-views/).
- Related English routes: [Parsing the Stream](/en/paper-reading/43-parsing-the-stream-live-trace/), [Continuity Security](/en/paper-reading/45-continuity-security-context-contracts/), and [ReVA](/en/paper-reading/47-reva-reusable-evidence-views/).
- Duplication risk: Low; existing entries cover trace observability, memory security, and evidence views, but not the external-effect contract boundary and A1–A8 vocabulary together.
- Suggested internal links: Pair with the existing ReAct/tool-use foundations, MCP retrieval, and future production-effect reconciliation work.

## Recommendation

- Output level: Deep Read; the bilingual pair, comprehension audit, no-figure exception, and full site build passed locally.
- Score rationale: 29/30: direct Agent Systems and tool-reliability fit, a useful new anomaly vocabulary, explicit capability boundaries, and a public MIT census artifact with a shipped snapshot. Evidence quality is capped at 4 because runtime coverage is conjectural and the census is descriptive rather than a prevalence or shared-benchmark study.
- Open questions requiring human approval: Can these anomaly definitions become executable invariants for payment, inventory, messaging, and deletion tools? Which status/compensation protocol is minimal for each effect class? How should MCP evolve from advisory hints to verifiable effect contracts without overstating exactly-once?

## Repair note

- 2026-09-16: Re-read Section 2 and repaired the bilingual pair to distinguish the A1–A8 anomaly vocabulary from the four safety profiles, make the multilevel L0/L1/L2 boundary explicit, document the five L0 operation dimensions including determinism, and correct the A3/A8 examples and black-box boundary wording. No source-version or score change.
