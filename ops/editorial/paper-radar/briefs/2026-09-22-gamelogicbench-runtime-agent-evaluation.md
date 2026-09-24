---
stableId: "arxiv:2609.21562"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-22
lastVerifiedAt: 2026-09-22
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
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

# GameLogicBench: A Deterministic Benchmark for Gameplay Logic Code Generation

## Identity

- Search window: Seven-day backfill ending 2026-09-22; arXiv v1 was submitted 2026-09-18.
- Canonical URL: https://arxiv.org/abs/2609.21562
- Full paper: https://arxiv.org/html/2609.21562v1
- Authors: GameLogicBench authors, NJU-LINK.
- Venue or review status: arXiv preprint; review status not verified.
- DOI / OpenReview / arXiv aliases: arXiv:2609.21562v1.
- Code / model / data:
  - Benchmark code: https://github.com/NJU-LINK/GameLogicBench
  - Task repository: https://github.com/NJU-LINK/GameLogicBench-Tasks
  - Godot-based deterministic evaluator with seeded scenarios and held-out cases.

## Editorial fit

- Reader question: How do we evaluate an agent that writes game logic when compiling and producing plausible text are much easier than preserving behavior across every simulation tick?
- Why this belongs in the selected track: It evaluates an agent's executable behavior in a stateful runtime, extending agent evaluation beyond text, unit tests, or single-turn code acceptance.
- Gap it fills: agent-systems / agent-evaluation.
- Why now: This seven-day backfill offers a concrete answer to the common benchmark failure mode where runnable but incorrect submissions pass without meaningful validation.

## Claim map

- Problem: Gameplay logic requires state transitions, collision/interaction semantics, and robustness to hidden variations; text similarity cannot verify those properties.
- Main claim: A deterministic Godot benchmark with tick-level black-box assertions can separate genuinely correct gameplay implementations from plausible but behaviorally wrong code.
- Method: 72 gameplay-logic tasks, 403 hand-designed scenarios, seeded variations producing 1,451 test cases, fixed judge behavior, hidden/held-out scenarios, and 20 model/scaffold combinations.
- What is genuinely new: The evaluator accepts multiple correct implementations while rejecting mutants, making behavioral equivalence the target rather than a reference-code string match.

## Evidence audit

- Datasets: Hand-designed tasks and seeded scenario variations; the task repository is separate from the benchmark runner.
- Benchmarks and metrics: Best reported run is 52.78% across the evaluated model/scaffold combinations; scope degradation is reported as tasks become broader.
- Baselines: Multiple model/scaffold combinations, with comparisons across task scope and execution outcomes.
- Ablations: Held-out scenarios and behavioral-mutant checks probe whether the evaluator rewards implementation rather than copying.
- Statistical uncertainty: The paper reports aggregate outcomes, but no independent rerun or broad confidence analysis was verified.
- Threats to validity: Public network access can enable code copying; Godot-specific behavior may not transfer to other runtimes or agent coding domains.

## Reproducibility

- Available artifacts and licenses: Public benchmark and task repositories with CLI instructions; license and environment pinning should be checked before reproduction.
- Environment or compute requirements: Godot runtime plus Python benchmark tooling, task repository, model/scaffold access, and fixed judge configuration.
- Smallest useful reproduction: Run one task family with frozen judge/scenario seeds, compare a correct implementation with a behavioral mutant, and verify tick-level assertions.
- Blocking unknowns: Exact model prompt/scaffold registry, container versions, full task checkout workflow, and cost of reproducing all 1,451 cases.

## Critical reading

- Strongest result: The benchmark makes “it runs” and “it behaves correctly under hidden state transitions” visibly different outcomes.
- Weakest assumption: Deterministic game scenarios are a useful proxy for agentic software behavior, but they do not cover external APIs, mutable services, or long-lived production state.
- Stated limitations: Task scope hurts performance, public networks permit copying, and runnable submissions can still evade validation without the full behavioral judge.
- Claims not supported by the evidence: The results do not establish that the benchmark predicts real-world software-agent reliability or that the best model generalizes beyond Godot gameplay logic.

## Bloss0m connection

- Related Traditional Chinese routes: Agent evaluation, executable artifacts, long-horizon workflow reliability.
- Related English routes: Agent benchmarks, code agents, behavioral testing, and reproducible evaluation.
- Duplication risk: Low; distinguish it from generic coding benchmarks by centering the deterministic runtime and mutant rejection.
- Suggested internal links: Link to existing agent-evaluation and tool-use-reliability readings after verifying route names.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30: high topic fit and novelty, unusually concrete evaluator evidence, strong engineering value, and a public artifact; reproducibility loses one point because task/environment assembly and independent rerun remain unresolved.
- Open questions requiring human approval: Approve a figure showing task → Godot runtime → tick-level assertions, and explicitly separate benchmark validity from general software-agent reliability.
