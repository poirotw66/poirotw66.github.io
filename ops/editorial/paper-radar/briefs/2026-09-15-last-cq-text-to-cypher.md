---
stableId: "arxiv:2609.12746"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-15
lastVerifiedAt: 2026-09-15
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
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

# What Drives Recovery in Agentic Text-to-Cypher? LAST-CQ

## Identity

- Search window: 7-day backfill from 2026-09-08 through 2026-09-15; arXiv v1 was submitted 2026-09-11, outside the strict 72-hour window.
- Canonical URL: https://arxiv.org/abs/2609.12746
- Authors: The authors listed on the arXiv record; accepted to REALM at EMNLP 2026 according to the paper record.
- Venue or review status: arXiv preprint, v1; accepted REALM at EMNLP 2026.
- DOI / OpenReview / arXiv aliases: https://doi.org/10.48550/arXiv.2609.12746
- Code / model / data: No paper-specific public repository or artifact link was verified during this scan.

## Editorial fit

- Reader question: When an agent writes a database query that fails, is the best recovery signal a language-model explanation or the database's own error?
- Why this belongs in the selected track: LAST-CQ studies a concrete tool-use loop where execution feedback, parallel sampling, and correction policy can be measured directly.
- Gap it fills: Tool-use reliability—how an agent should recover from executable failures without adding noisy multi-agent chatter.
- Why now: Text-to-database agents make the difference between plausible syntax and executable correctness visible in a real external system.

## Claim map

- Problem: Single-pass Text-to-Cypher agents fail on schema and execution details, while synthesized feedback can be verbose, expensive, or less reliable than raw errors.
- Main claim: A five-agent, training-free, execution-grounded recovery workflow improves correction and can recover most single-pass failures; raw database errors nearly match LLM-synthesized schema feedback.
- Method: The system samples candidate Cypher, executes it against a live database, uses failure evidence and coordination to propose corrections, and compares sequential versus parallel recovery.
- What is genuinely new: The paper isolates the information value of the external executor and tests whether additional agent feedback actually improves recovery.

## Evidence audit

- Datasets: 2,471 live-database queries across 16 domains, with reported subset metrics over 1,917 and 214 queries for different analyses.
- Benchmarks and metrics: Exact match, execution correctness, recovery rate, set-F1 equivalence, judge calibration, and error-category breakdowns across six backbones and three scale tiers.
- Baselines: Single-pass generation, no-refinement, raw database error feedback, LLM-synthesized schema feedback, and parallel sampling.
- Ablations: Feedback source, sequential versus parallel sampling, backbone/scale tier, and judge versus executable equivalence.
- Statistical uncertainty: Results compare large query sets and report concrete percentage differences, but the paper does not provide a verified public artifact or a broad confidence-interval suite in the inspected material.
- Threats to validity: One Neo4j executable subset, 16 domains, conditioning on the system's own failures, Gemini substitutions, and untested large-scale cost/latency.

## Reproducibility

- Available artifacts and licenses: No paper-specific repository or executable artifact was verified during this scan.
- Environment or compute requirements: A Neo4j-compatible database, schema/domain corpus, multiple LLM agents, execution sandboxing, and controlled query/evaluation splits.
- Smallest useful reproduction: Build a small Neo4j corpus, compare single-pass, raw-error repair, synthesized-feedback repair, and sequential multi-agent repair on fixed failed queries while logging query count, latency, and token cost.
- Blocking unknowns: Exact prompts, agent coordination protocol, sampling budgets, and data release details need verification before a faithful rerun.

## Critical reading

- Strongest result: The workflow recovers 91.7% of single-pass failures, while raw database errors nearly match synthesized schema feedback and parallel sampling performs worse by 10–11%.
- Weakest assumption: A live Neo4j executable subset is representative of the schema ambiguity, permissions, and transaction constraints of production graph databases.
- Stated limitations: The paper identifies the single-engine scope, model substitutions, conditional subsets, and missing cost/latency study as limitations.
- Claims not supported by the evidence: The results do not show that five agents are necessary, or that the same recovery policy transfers to SQL, APIs, or write-capable database tools.

## Bloss0m connection

- Related Traditional Chinese routes: tool-use reliability, agent evaluation, structured retrieval, and execution-grounded feedback.
- Related English routes: Agent Systems, Tool Use Reliability, and Production RAG.
- Duplication risk: Low; this is a recovery/evidence paper rather than a generic Text-to-SQL model comparison.
- Suggested internal links: Pair with ExecCritic for test-driven repair and with agent observability coverage for executor traces.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30 for a clean counterintuitive result, large live-database evaluation, executable metrics, and direct engineering consequences. Reproducibility is capped at 3 because no verified artifact and several protocol details remain unavailable.
- Open questions requiring human approval: What is the marginal value of each agent? How do transaction safety and read/write permissions alter the recovery policy? Can raw errors be normalized into a portable tool-feedback contract?
