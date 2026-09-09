---
stableId: "arxiv:2608.30685"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-02
lastVerifiedAt: 2026-09-02
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 2
  engineeringValue: 5
  seriesValue: 5
  total: 27
decision: "deep-read-candidate"
---

# ATLAS: Dual-Horizon Diagnostic Evaluation for Industrial Tool-Use Agents

## Identity

- Canonical URL: https://arxiv.org/abs/2608.30685
- Authors: Wei Chen, Peilun Zhou, Zhaoyu Hu, Jiajun Chai, Zhongni Hou, Yufei Zhang, Derong Xu, Guojun Yin, Wei Lin, Zhi Zheng, Tong Xu.
- Venue or review status: arXiv preprint, v1 submitted 2026-08-31; affiliated with USTC and Meituan.
- DOI / OpenReview / arXiv aliases: arXiv:2608.30685; DOI https://doi.org/10.48550/arXiv.2608.30685.
- Code / model / data: Project page https://atlas-eval.github.io/; the paper uses Meituan Xiaotuan production traffic, but the production logs and calibration references are not released.

## Editorial fit

- Reader question: How can an industrial tool-use team tell whether a failure occurred in planning, tool execution, response generation, or the next turn of the user relationship?
- Why this belongs in the selected track: ATLAS turns agent evaluation from one final score into executable, evidence-scoped diagnosis across both a request trajectory and continued interaction.
- Gap it fills: Agent evaluation—diagnostic signals that can localize failures and feed the same semantics back into policy optimization.
- Why now: Production agents increasingly operate over dynamic tools and repeated interactions, where a successful-looking final answer can hide trajectory errors or context drift.

## Claim map

- Problem: Final-outcome metrics do not identify where an industrial agent failed or whether its service remains aligned across subsequent turns.
- Main claim: ATLAS’s within-turn and across-turn horizons provide structured diagnostic evidence and can guide policy iteration.
- Method: Within-turn signals map Thinking and Reflection, Tool and Skill Execution, and Response Generation against Relevance, Factuality, Timeliness, Reliability, and Intent and Planning; Norms and Compliance remains an independent guardrail. Across-turn signals track user-wise continuity. LLM judges are calibrated on high-confidence business logs, with selected signals distilled into lower-cost diagnostic models.
- What is genuinely new: The paper makes the evaluation object itself two-horizon and keeps signal meaning stable from diagnosis to optimization instead of treating evaluation as a terminal report.

## Evidence audit

- Datasets: Real Meituan Xiaotuan traffic; the full production dataset and reference construction are private. The paper reports roughly 500–1000 instances per signal, 2,000 offline replay queries, and 10,000 policy-optimization queries, with query-disjoint handling described in the paper.
- Benchmarks and metrics: Signal fidelity, diagnostic agreement, replay-based policy improvement, online user engagement, downstream business outcomes, and sampled human-audit quality. The source also inventories 41 LLM-based diagnostic signals.
- Baselines: Calibrated LLM-judge interfaces and distilled diagnostic models are compared within the ATLAS evaluation pipeline; the paper’s full tables and model configurations should be extracted during a Deep Read.
- Ablations: The paper tests signal calibration, judge-interface variants, distillation, offline policy optimization, and online A/B evaluation; exact effect sizes need table-level transcription.
- Statistical uncertainty: The abstract confirms online A/B gains but does not expose confidence intervals in the metadata page. Treatment assignment, experiment duration, and metric denominators must be checked in the full paper.
- Threats to validity: A single product, private production logs, one organization’s traffic, judge-model dependence, and possible selection effects limit external validity.

## Reproducibility

- Available artifacts and licenses: Public project page and paper are available; no public production corpus or executable implementation was confirmed.
- Environment or compute requirements: Unknown for the complete pipeline; distilled diagnostic models are intended to reduce latency and cost, but deployment requirements are not fully specified in the abstract.
- Smallest useful reproduction: Build a synthetic two-horizon trace set with explicit evidence scopes, deterministic checks, an LLM judge calibrated on labeled references, and a small policy replay loop.
- Blocking unknowns: Signal prompts, labels, judge calibration set, A/B assignment, policy optimizer, raw metrics, and production-serving cost.

## Critical reading

- Strongest result: The framework connects failure localization to a real service iteration loop and claims both offline replay and online A/B validation rather than only a benchmark score.
- Weakest assumption: Judge-based diagnostic signals and sampled human audits are sufficiently faithful to user value and operational correctness.
- Stated limitations: The paper’s production setting, dynamic business conditions, and judge calibration make the result difficult to reproduce outside Meituan.
- Claims not supported by the evidence: The source does not establish that ATLAS generalizes to other domains, that every diagnostic signal is causal, or that online gains come only from the diagnostic framework.

## Bloss0m connection

- Related Traditional Chinese routes: Existing agent evaluation, tool-use reliability, and enterprise agent governance routes after archive-aware lookup.
- Related English routes: Existing Agent Systems and evaluation entries after archive-aware lookup.
- Duplication risk: Low; the two-horizon diagnostic matrix and production-policy feedback loop are distinct from benchmark-only evaluation.
- Suggested internal links: Pair with a future article on evaluation receipts or production agent observability; contrast with executable environment benchmarks such as NetConfArena.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5/5 topic relevance, 5/5 novelty, 5/5 evidence quality, 2/5 reproducibility, 5/5 engineering value, 5/5 series value. The evidence is unusually deployment-grounded, but the private data and implementation block direct reproduction.
- Open questions requiring human approval: How large are the A/B effects and uncertainty intervals? Which diagnostic signals survive distillation? How were online gains isolated from concurrent product changes? Can the framework be safely adapted to an open trace corpus?
