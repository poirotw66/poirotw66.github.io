---
stableId: "arxiv:2610.08662"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-10-08
lastVerifiedAt: 2026-10-08
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# ParanoiaEval: Benchmarking Unnecessary Defensive Work in Agentic Coding

## Identity

- Canonical URL: https://arxiv.org/abs/2610.08662
- Authors: Hanjun Luo, Xiucheng Zhang, Zhuoning Xu, Zhimu Huang, Yingbin Jin, Xinfeng Li, and Hanan Salam; affiliations include New York University and The Hong Kong Polytechnic University.
- Venue or review status: arXiv preprint, v1 submitted 2026-10-06; not peer-reviewed in the inspected record.
- DOI / OpenReview / arXiv aliases: arXiv:2610.08662; DOI 10.48550/arXiv.2610.08662 pending registration.
- Code / model / data: https://github.com/ZhuoningXu/ParanoiaEval_release (MIT); includes paired tasks, runners, environment setup, and judge code.

## Editorial fit

- Reader question: Can a coding agent tell when a risk is already handled and extra defensive work is unnecessary?
- Why this belongs in the selected track: It measures risk-treatment judgment as an agent capability, not just whether an agent can implement a requested change.
- Gap it fills: agent-evaluation; evaluation of context-sensitive tool and implementation decisions.
- Why now: The paper was submitted 2026-10-06, with a public benchmark and a measured developer-acceptance consequence.

## Claim map

- Problem: Existing evaluations often reward task completion without checking whether an agent's risk response matches the evidence and context.
- Main claim: In a study of eight models across two harnesses and 9,600 runs, unnecessary risk treatment occurred in 11.2%–58.7% of runs; in a post-hoc study with 20 developers, excess-treatment runs received satisfaction ratings 1.27 points lower on a five-point scale and were accepted as-is 38% versus 78% of the time.
- Method: The authors constructed 200 paired repository tasks where one treatment-relevant piece of evidence differs, applied an agentic judge calibrated against human labels, and conducted a post-hoc developer-rating study.
- What is genuinely new: It frames appropriate risk treatment (avoid, transfer, mitigate, or accept) as an independently measurable behavior and tests paired evidence sensitivity.

## Evidence audit

- Datasets: 200 paired tasks based on 44 situations observed in practice and instantiated across 50 open-source Python and Go repositories.
- Benchmarks and metrics: Risk-treatment violations and evidence responsiveness, evaluated across eight model configurations and two harnesses; reported run count is 9,600.
- Baselines: Paired task variants differ in treatment-defining evidence; configurations use Claude Code and Codex harnesses.
- Ablations: The paper compares treatment behavior across task variants and agent configurations; see the paper's per-condition results and judge-validation appendix.
- Statistical uncertainty: Human study has 20 developers; the result is post-hoc and should not be read as a general estimate of developer preferences.
- Threats to validity: Situations, repositories, tasks, and participants are bounded; the human sample is from a single regional developer population. Results and full trajectories are not included in the public repository.

## Reproducibility

- Available artifacts and licenses: MIT repository with paired task files, environment setup, Claude/Codex runners, and judge scripts.
- Environment or compute requirements: Linux command-line runtimes and model access; reproducing the multi-model experiment requires paid or gated model services.
- Smallest useful reproduction: Run a small paired subset on one available coding agent and inspect the judge outputs against manual labels.
- Blocking unknowns: Full trajectories and experimental results are not in the repository; no independent rerun was verified.

## Critical reading

- Strongest result: The paired design isolates a narrow but practical judgment failure, while the human study connects that behavior to developer acceptance.
- Weakest assumption: The evidence presented to agents is more controlled and locally salient than scattered, ambiguous evidence in many real repositories.
- Stated limitations: The findings rely on 44 mined situations, a bounded repository sample, and a post-hoc human study of 20 participants.
- Claims not supported by the evidence: The measured rates do not establish how often unnecessary defenses occur in all production coding-agent use or quantify maintenance cost over time.

## Bloss0m connection

- Related Traditional Chinese routes: No matching paper-reading article found for this arXiv ID or title.
- Related English routes: No matching paper-reading article found for this arXiv ID or title.
- Duplication risk: Adjacent to agent evaluation and workflow-governance posts, but the focus on whether defensive code is warranted and the developer-acceptance study is distinct.
- Suggested internal links: Coding-agent evaluation and practical review-workflow articles, after confirming routes at drafting time.

## Recommendation

- Output level: Deep Read
- Score rationale: Topic 5 (direct agent-evaluation gap); novelty 5 (paired evidence design and independent risk-treatment dimension); evidence 4 (large controlled run set plus human study, capped by sample and no independent replication); reproducibility 4 (task, runner, and judge code are public, but runs/results are absent and model access is required); engineering 5 (teams can evaluate whether agents overbuild instead of judging only correctness); series 5 (strengthens the agent-evaluation path).
- Open questions requiring human approval: How prominently to foreground the 20-person developer study and how to explain the agentic judge's calibration and limitations.
