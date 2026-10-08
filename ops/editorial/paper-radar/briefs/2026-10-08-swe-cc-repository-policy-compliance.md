---
stableId: "arxiv:2610.06193"
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

# Correct Code, Broken Contributions? SWE-CC: Benchmarking Repository Policy Compliance for Coding Agents

## Identity

- Canonical URL: https://arxiv.org/abs/2610.06193
- Authors: Hai Dang Truong, Rayner Goh, Thanh Le-Cong, and Yintong Huo; Singapore Management University and Singapore University of Technology and Design.
- Venue or review status: arXiv preprint, v1 submitted 2026-10-05; not peer-reviewed in the inspected record.
- DOI / OpenReview / arXiv aliases: arXiv:2610.06193; DOI 10.48550/arXiv.2610.06193 pending registration.
- Code / model / data: https://github.com/dangtruong01/swe-cc-arxiv (MIT code); benchmark policies, checker functions, tasks, configs, and result exports are present.

## Editorial fit

- Reader question: Can an agent produce a patch that passes tests but still violates the repository's contribution rules?
- Why this belongs in the selected track: It evaluates agent behavior during repository work, beyond final functional correctness.
- Gap it fills: agent-evaluation; operational evaluation of repository-policy compliance.
- Why now: The paper was submitted 2026-10-05 and provides a current, inspectable benchmark and results.

## Claim map

- Problem: Issue-resolution benchmarks can award success to patches that pass tests while ignoring repository policies and workflow requirements.
- Main claim: Across 500 contribution tasks in 12 repositories, the evaluated coding agents violated 43.1% of applicable policies; nearly half of violations occurred during intermediate execution.
- Method: The authors extracted 823 machine-checkable policies, built deterministic checkers, and evaluated four models under mini-SWE-agent and OpenHands in native-policy-discovery and consolidated-policy settings.
- What is genuinely new: It grades both runtime trajectories and final deliverables against repository-specific policies, separating functional issue resolution from contribution compliance.

## Evidence audit

- Datasets: 500 tasks extended from SWE-bench Verified across 12 open-source repositories; 823 policies.
- Benchmarks and metrics: Policy-triggering and compliance outcomes, paired with SWE-bench functional resolution; the paper reports 8,000 experimental runs.
- Baselines: Four models, two scaffolds, and two policy-provision settings.
- Ablations: Native discovery is compared with directly provided consolidated policy text; full model-level results are in the paper and released exports.
- Statistical uncertainty: The paper reports experimental aggregates; no independent replication or broad real-world compliance prevalence estimate was verified.
- Threats to validity: The released repository includes aggregate outcomes but not all 8,000 original trajectories or the independent checker-audit ratings. Policy extraction and deterministic checker coverage are limited to the selected repositories and checkable rules.

## Reproducibility

- Available artifacts and licenses: MIT repository with task data, policy corpora, checker code, tests, runner configurations, result exports, and one full example trajectory. Third-party policy text retains source licenses.
- Environment or compute requirements: Python 3.11; reproducing full runs requires Docker, SWE-bench images, model-service credentials, and substantial time and compute.
- Smallest useful reproduction: Re-score the included example trajectory, inspect a project's policy/checker tests, then run a small task sample on an additional agent.
- Blocking unknowns: Historical full trajectories and external checker-audit ratings are not in the release.

## Critical reading

- Strongest result: The paper shows a measured gap between functional resolution and repository-policy compliance, including policy violations made before the final patch.
- Weakest assumption: The selected machine-checkable rules and their extraction represent only part of the tacit, evolving standards maintainers apply.
- Stated limitations: The benchmark covers 12 projects and policies that can be translated into deterministic checks; full trajectories are not released.
- Claims not supported by the evidence: The results do not establish a universal 43.1% real-world violation rate or prove that each policy violation would cause rejection or maintenance harm.

## Bloss0m connection

- Related Traditional Chinese routes: No matching paper-reading article found for this arXiv ID or title.
- Related English routes: No matching paper-reading article found for this arXiv ID or title.
- Duplication risk: Adjacent to existing agent evaluation and runtime-governance coverage, but the repository-policy compliance target is distinct.
- Suggested internal links: Coding-agent evaluation and runtime governance articles, after confirming their current routes at drafting time.

## Recommendation

- Output level: Deep Read
- Score rationale: Topic 5 (direct agent-evaluation gap); novelty 5 (trajectory plus deliverable policy audit); evidence 4 (large controlled evaluation with inspectable method, capped by unshared trajectories and no independent rerun); reproducibility 4 (substantial public code/data/configs, but full traces and repeated service runs are unavailable or costly); engineering 5 (adds a concrete compliance gate to agent evaluation); series 5 (extends the agent-evaluation path).
- Open questions requiring human approval: Whether to focus the reading on policy retrieval versus execution behavior, and how to present the missing raw trajectories without overgeneralizing the reported rate.
