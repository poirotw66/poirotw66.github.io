---
stableId: "arxiv:2609.19526"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-21
lastVerifiedAt: 2026-09-21
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
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

# Self Improvement via Fast Tree-search：用廉價的偏好排序，替自我改進 agent 篩掉昂貴評測

## Identity

- Search window: Seven-day backfill ending 2026-09-21; arXiv v1 was submitted 2026-09-17.
- Canonical URL: https://arxiv.org/abs/2609.19526
- Full paper: https://arxiv.org/html/2609.19526v1
- Source type: arXiv research paper.

## Editorial fit

- Reader question: If an agent can rewrite its own harness, how do we decide which patch deserves the next expensive benchmark run?
- Track and gap: agent-systems / agent-evaluation.
- Why now: SIFT inserts pairwise LLM judging and a regularized Bradley–Terry rank between self-modification and full evaluation, then uses a disaggregated tree-search pipeline to expand promising candidates while evaluations are still running.

## Claim map

- Method: Candidate patches are compared against incumbent agents; pairwise wins produce BT scores, and parent sampling combines judge rank, subset accuracy rank, and a visit-count exploration term.
- Results: On Polyglot-225, SIFT reports 31.1% with Qwen3-Coder-30B and Qwen3-480B judge, 35.1% with o3-mini and gpt-5.4 judge, and lower resource use such as 224 CPU-hours, 6.7 hours, and $34.3 for one Qwen configuration.
- Transfer and diagnostics: The paper reports repeated o3-mini runs, cross-model transfer, and a judge-rank correlation of 0.71 for a weaker judge, while showing that full-file input beats diff-only judging.

## Critical reading

- Strongest insight: In recursive self-improvement, the scarce resource is not only candidate generation; it is deciding which candidates deserve verification.
- Main risk: A cheap judge is a noisy ranking signal, not a substitute for the downstream benchmark. A single latent BT strength can hide task-specific regressions.
- Suggested article focus: Draw the split between speculative ranking and empirical verification, then connect sandboxing and writable-file allow-lists to evaluation integrity.

## Evidence audit

- Primary evidence inspected: arXiv v1/full HTML, method equations, Polyglot setup, tables, repeated runs, judge ablations, and safety discussion.
- Strength: The paper gives concrete compute/API costs, matched baselines, an ablation of judge input formats, and a clear description of when full evaluation remains necessary.
- Limitations: No public implementation repository was verified; results are concentrated on Polyglot/TerminalBench-style coding-agent settings, and the strongest judge is stronger than the coding backbone, so this is not pure self-judged improvement.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: a crisp systems intervention with cost, latency, transfer, and integrity consequences; reproducibility is reduced because the implementation and independent rerun are not public in the inspected source.
