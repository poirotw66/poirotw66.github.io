---
stableId: "arxiv:2608.02464"
sourceVersion: "v1"
status: "draft"
firstSeenAt: 2026-08-05
lastVerifiedAt: 2026-08-05
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

# Real-Time Detection and Repair of LLM Agent Failures

## Identity

- Canonical URL: https://arxiv.org/abs/2608.02464
- Authors: Sunny Dubey
- Venue or review status: arXiv cs.AI/cs.LG/cs.SE preprint, v1 submitted 2026-08-03.
- DOI / OpenReview / arXiv aliases: arXiv `2608.02464`; arXiv-issued DOI link is available, but no venue or OpenReview record was identified.
- Code / model / data: Official repository https://github.com/sunnydubey1111/agent-trajectory-sentinel; code, traces, results, data card, and demo are linked from the paper. Reproduction uses CPU for most studies and optionally local Ollama/qwen2.5:7b for the live demo.

## Editorial fit

- Reader question: How can an agent platform detect a failing trajectory early and repair it without paying for an LLM judge on every step?
- Why this belongs in the selected track: It extends the existing agent-evaluation path from end-task benchmark scores to runtime telemetry, deterministic verification, rollback, and repair.
- Gap it fills: `agent-evaluation`, with a secondary connection to observability and agent security.
- Why now: The paper is a current, artifact-backed example of treating agent reliability as a runtime control loop rather than a post-hoc score.

## Claim map

- Problem: Agents can loop, cascade tool errors, drift from goals, fabricate results, or absorb corrupted content before a final evaluator notices.
- Main claim: A healthy-only echo-state/CUSUM monitor plus deterministic verification can detect failures cheaply, and rollback-and-retry can recover a meaningful fraction of flagged runs.
- Method: Train causal monitors on healthy episodes; combine temporal telemetry with deterministic checks over tool results; intervene by rollback and targeted retry.
- What is genuinely new: The paper closes detection into repair and makes the cost/false-alarm trade-off explicit, while releasing a large trace corpus and runnable analysis path.

## Evidence audit

- Datasets: 2,823 committed episodes across three agent frameworks, local Qwen/Llama models, and Gemini 2.5 Flash; additional external corpora include ATBench and AFTraj-2K.
- Benchmarks and metrics: AUROC, detection at a fixed false-alarm budget, steps saved, false positives, recovery rate, task success, latency, and state footprint.
- Baselines: Memoryless Mahalanobis, GRU/LSTM/TCN, VAR-ridge, deterministic checks, and resampling repair controls.
- Ablations: Channel fusion, temporal horizon, hybrid monitors, deterministic-check variants, and repair-policy comparisons are exposed in the repository and paper tables.
- Statistical uncertainty: The paper reports five-seed means/standard deviations and paired tests, but small healthy test splits make some realized false-alarm rates unstable.
- Threats to validity: Failure injection, filtered external corpora, deployment-specific healthy nulls, short-horizon episodes, and weak detection of purely textual hallucination limit generalization.

## Reproducibility

- Available artifacts and licenses: Public GitHub repository with pinned requirements, traces, results, data card, and reproduction scripts; repository license and third-party model/data terms must be checked before redistribution.
- Environment or compute requirements: Most experiments are CPU/offline; live demo needs Ollama and qwen2.5:7b. Full multi-seed and real-trace studies take materially longer than the quickstart.
- Smallest useful reproduction: Run the synthetic experiment, deterministic verification study, and repair-policy analysis from the pinned environment; then compare results against the shipped tables.
- Blocking unknowns: Whether the monitor transfers without per-deployment healthy calibration in a new production stack remains unresolved.

## Critical reading

- Strongest result: Runtime verification and targeted retry raise task success from 52% to 73% in the reported repair study, with deterministic checks avoiding the monitor's false-positive burden in that setup.
- Weakest assumption: Healthy-only monitoring assumes a representative null distribution and enough post-onset trajectory for temporal signal to accumulate.
- Stated limitations: Cold-start calibration, selected external traces, short episodes, weak hallucination induction, and non-bit-reproducible latency measurements.
- Claims not supported by the evidence: The paper does not establish universal zero-false-positive production monitoring or reliable detection of all agent hallucinations.

## Bloss0m connection

- Related Traditional Chinese routes: `08-osreward-agent-evaluation`; `39-enterprise-agentic-ai-governance`; `43-enterprise-ai-agent-security`.
- Related English routes: `08-osreward-agent-evaluation`; `39-enterprise-agentic-ai-governance`; `43-enterprise-ai-agent-security`.
- Duplication risk: Low to medium. OSReward studies outcome evaluation; this paper focuses on online detection and repair. Keep the runtime/operations angle distinct.
- Suggested internal links: Agent evaluation, trace/observability, failure containment, and rollback safety.

## Recommendation

- Output level: Deep Read
- Score rationale: High score is justified by direct agent-evaluation fit, a concrete runtime intervention, strong measured comparisons, and unusually complete artifacts. Evidence quality is discounted for filtered external corpora, deployment-specific calibration, and short-horizon limits; reproducibility remains strong because the artifact includes pinned requirements, traces, results, and runnable studies.
- Open questions requiring human approval: Decide whether to frame the piece around runtime observability or failure repair; verify artifact license/model access; and avoid presenting selected-trace results as a universal production guarantee.
