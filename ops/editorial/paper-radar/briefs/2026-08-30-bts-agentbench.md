---
stableId: "arxiv:2608.27334"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-30
lastVerifiedAt: 2026-08-30
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
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

# BTS-AgentBench: A Deterministic, Replayable Pipeline from Read-Only Telemetry Logs to Agent Benchmarks

## Identity

- Stable ID: `arxiv:2608.27334`.
- Canonical URL: https://arxiv.org/abs/2608.27334
- Authors: Jeong-Yoon Kim.
- Venue or review status: arXiv v1 submitted 2026-08-27; no separate review record verified in this scan.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2608.27334`; no separate identifier located.
- Code / model / data: https://github.com/kjy7567/BTS-AgentBench; the paper reports code, artifacts, and replay reports.

## Editorial fit

- Reader question: How can a real telemetry corpus become a deterministic, replayable benchmark for multi-turn operational agents?
- Why this belongs in the selected track: The paper directly fills `agent-systems` / `agent-evaluation` with a telemetry-to-episode construction and audit pipeline.
- Gap it fills: Existing evaluation work often starts with hand-authored tasks or scores only final outcomes; this work makes raw telemetry, executable tools, interaction contracts, evidence, and replay part of the benchmark artifact.
- Why now: Industrial and enterprise agents need evidence-backed evaluation that can be rebuilt from source data when prompts, models, or harnesses change.

## Claim map

- Problem: Existing operational telemetry is rich but is rarely compiled into executable, multi-turn agent tasks with deterministic targets.
- Main claim: A deterministic construction pipeline can produce bounded episodes with read-only tools, source-derived gold answers, evidence obligations, and replayable splits.
- Method: Normalize BTS metadata and raw histories, materialize a DuckDB-backed read-only tool store, compile nine task families, lift retained tasks into typed episodes, and apply controller-aware acceptance and replay audits.
- What is genuinely new: The contribution is the reproducible construction contract from a public telemetry corpus to an agent benchmark, not a claim that one agent model is best.

## Evidence audit

- Datasets: BTS public multi-year building telemetry and a small portability study over XAI4HEAT.
- Benchmarks and metrics: The release has 532 rows across nine task families and reproduces a 356/87/89 train/dev/test artifact; the XAI4HEAT conversion has 204 episodes and a 41-row held-out test.
- Baselines: Deterministic component scoring and a construction-exclusion controller are the primary controls; retained GPT-5.5 executions are reported as an application of the benchmark rather than a universal model comparison.
- Ablations: The paper audits exact raw-to-episode replay, contract preflight, controller exclusion, and cross-corpus portability.
- Statistical uncertainty: Exact replay establishes construction consistency, but the model-run sample and domain portability study do not establish broad agent ranking or deployment prevalence.
- Threats to validity: The setting is read-only building telemetry with bounded deterministic turns; it excludes write-side control, safety-critical actuation, maintenance planning, and long-horizon troubleshooting.

## Reproducibility

- Available artifacts and licenses: The paper is CC BY 4.0 and links a repository containing code, benchmark artifacts, and replay reports; repository and source-data licenses should be checked before redistribution.
- Environment or compute requirements: Reproduction requires the repository, BTS/XAI4HEAT source data, Python/DuckDB-style data processing, and optional model/API access for agent traces.
- Smallest useful reproduction: Rebuild a single task family from the released telemetry, compare the generated logical exports and split hashes, then run one bounded agent episode and inspect the evidence contract.
- Blocking unknowns: Current repository commit, exact source-data mirrors, hardware/runtime cost, and portability outside telemetry domains remain to be independently verified.

## Critical reading

- Strongest result: Two independent raw-to-episode builds reportedly match all 11 logical tool-store exports and reproduce the released split exactly.
- Weakest assumption: Read-only telemetry and bounded interactions are a sufficiently informative proxy for the operational decisions an enterprise agent will make.
- Stated limitations: The paper explicitly narrows scope to read-only building-telemetry search and reporting and excludes mutable control and long-horizon troubleshooting.
- Claims not supported by the evidence: The work does not prove that the benchmark predicts production safety, that GPT-5.5 is an operationally suitable controller, or that the construction recipe generalizes without corpus-specific mapping.

## Bloss0m connection

- Related Traditional Chinese routes: Existing agent-evaluation, harness observability, and production-RAG evidence routes; no exact published duplicate was found.
- Related English routes: `agent-evaluation`, operational harnesses, and trace-backed verification.
- Duplication risk: Medium with the A2E, Agent Trajectory Sentinel, and StarHarness candidates; differentiate by deterministic construction replay from real telemetry.
- Suggested internal links: `agent-evaluation`, `64-ai-agent-guide`, and the existing harness/evidence candidates.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 4 evidence quality + 5 reproducibility + 5 engineering value + 5 series value = 29. The artifact and exact replay evidence are unusually actionable, while domain narrowness limits external validity.
- Open questions requiring human approval: Verify repository/data licensing and current commit, attempt a small replay, and decide whether the reading should center on benchmark construction contracts or telemetry-grounded agent evaluation.
