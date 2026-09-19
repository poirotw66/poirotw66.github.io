---
stableId: "arxiv:2609.20538"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-19
lastVerifiedAt: 2026-09-19
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 4
  total: 28
decision: "deep-read-candidate"
---

# Refuse, Decompose, Refresh: A Claim-Safe Protocol for Closed-Loop AI Evaluation

## Identity

- Search window: Strict 72-hour scan ending 2026-09-19; arXiv v1 was submitted on 2026-09-17.
- Canonical URL: https://arxiv.org/abs/2609.20538
- Full paper: https://arxiv.org/html/2609.20538v1
- Venue or review status: arXiv preprint; no peer-review status was assumed.
- Artifact: Anonymous 4open.science release with frozen protocol, generator, validator, simulator source, rows/configuration, and a hash map.

## Editorial fit

- Reader question: How should an evaluation system avoid turning an unsupported runtime result into a confident claim?
- Track and gap: agent-systems / agent-evaluation.
- Why now: Closed-loop evaluation can silently invalidate its own reference map under distribution shift; this protocol makes abstention and refresh explicit states.

## Claim map

- Refuse: Abstain when a clean reference or matched runtime lacks support for the requested claim.
- Decompose: Separate execution integrity, false admission, coverage/power, and structural hypotheses instead of collapsing them into one score.
- Refresh: When drift invalidates the reference map, recompute it rather than treating drift as direct fault evidence.
- Reported study: Aggregate-only simulator with 24 policy components, three demand regimes, two fault-mask families, independent development/held-out sets, 1,440 held-out cases and 21,600 rows.

## Evidence audit

- Results: 55/72 regime-component units were admitted; 54/55 runtime-admitted units passed; false admission was 0/20 with a one-sided 95% upper bound of .1391 under a frozen .20 rule.
- Drift check: The log reports 0/15, 15/15, and 14/15 alarms across regimes, illustrating that the null is reference-relative.
- Artifact quality: Frozen protocol and validator support a real rerun, but there is no public GitHub project or live agent deployment.
- Limitations: Simulator abstractions and aggregate-only traces may omit tool, model, and multi-agent failure modes.

## Reproducibility

- Reproduce the held-out validator and drift log first, then replace the aggregate simulator with a trace-level agent workload while preserving the admission rules.
- The artifact contains enough protocol material for a bounded rerun, but anonymous hosting and simulator scope remain operational risks.

## Critical reading

- Strongest insight: “No evidence” and “evidence of no fault” are different outcomes and should have different states in an evaluation ledger.
- Main risk: A rigorous protocol can still provide false comfort if the simulator omits the failure channels that matter in production.
- Evidence limit: Strong methodological artifact, but external validity and live-system engineering value require follow-up.

## Bloss0m connection

- Suggested links: benchmark governance, agent traces, evidence/provenance contracts, and evaluation under drift.
- Article focus: model the evaluator as a state machine with refuse, decompose, refresh, and admitted-claim transitions.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: unusually clear claim-safety protocol and reproducible held-out artifact; series value is lower because the current evidence is a simulator rather than a deployed agent system.
- Open questions: Which runtime events must be preserved so a refresh can distinguish distribution shift from an actual regression?
