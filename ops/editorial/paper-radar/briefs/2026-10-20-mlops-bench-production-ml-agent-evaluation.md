---
stableId: "arxiv:2610.23506"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-10-20
lastVerifiedAt: 2026-10-20
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 4
  evidenceQuality: 4
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# MLOps-Bench: Benchmarking AI Agents on Production ML Engineering in Real Repositories

## Identity

- Stable ID: `arxiv:2610.23506`.
- Canonical URL: https://arxiv.org/abs/2610.23506
- Authors: Quoc Co Tran, Hitesh Laxmichand Patel, Diwakar Mahajan, Kshitij Bakliwal, Avi Sil, and Katrin Kirchhoff.
- Venue or review status: arXiv v1 submitted 2026-10-16; the paper lists Findings of EMNLP 2026 as forthcoming.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2610.23506`.
- Code / model / data: https://github.com/oracle-samples/mlops-bench. The repository publishes benchmark code, task workspaces, and source-repository inventory; the paper is CC BY 4.0 and the repository is Apache-2.0.

## Editorial fit

- Reader question: Can a coding agent make a complete ML engineering change inside a real repository while satisfying new behavior and preserving existing behavior?
- Why this belongs in the selected track: It evaluates repository-level agents across data pipelines, feature engineering, model training, serving, monitoring, CI/CD and governance, and end-to-end workflows. It fills `agent-systems` / `agent-evaluation` with an MLOps lifecycle benchmark.
- Gap it fills: General coding and ML competition benchmarks do not jointly test repository-grounded changes, lifecycle-specific requirements, and regression preservation across an ML system.
- Why now: The paper reports 212 tasks from 31 public ML repositories and evaluates six systems on 187 held-out tasks. Its strongest reported result exposes a gap between Codex GPT-5.5's 31.2% task-completion rate and 68.7% per-test pass rate; these are different denominators and must not be collapsed into a single success claim.

## Claim map

- Problem: Agent benchmarks often reward plausible code or task-level outcomes without checking whether an ML repository's lifecycle behavior is complete and prior behavior remains intact.
- Main claim: A repository-grounded benchmark built from explicit behavior contracts and executable tests can reveal meaningful gaps in agent performance on production-style ML engineering tasks.
- Method: Freeze source repositories; derive tasks from repository evidence; construct oracle and buggy baselines; test new behavior with fail-to-pass (F2P) checks and preserved behavior with pass-to-pass (P2P) checks; evaluate agent patches in the frozen workspace.
- What is genuinely new: It combines real repository context, lifecycle-spanning task categories, and separate test contracts for new and retained behavior. The tasks are synthesized and localized to public repositories, so “production-style” describes task shape rather than observed commercial deployments.

## Evidence audit

- Datasets: 31 public ML repositories; 212 tasks total; a 25-task development split and a 187-task evaluation split across 29 held-out repositories. The full suite includes 636 F2P and 856 P2P tests.
- Benchmarks and metrics: Task completion requires all valid scoring tests for a task to pass; test pass rate aggregates individual test outcomes. For Codex GPT-5.5, the paper reports 31.2% completion [95% CI 25.0, 43.1] and 68.7% test pass [54.0, 75.6] on evaluation tasks.
- Baselines: Six coding-agent systems are compared in the same repository-level evaluation setup. Results remain author-reported; model/product versions, tool and time budgets, and the method used to calculate confidence intervals are not fully documented alongside the result table.
- Ablations: The paper audits generated task and test quality, including a 10-task F2P contract audit and 10 alternative-patch audit. These support the construction process but do not constitute complete manual verification of all 212 tasks.
- Statistical uncertainty: The paper gives confidence intervals for headline results but does not explain their calculation method in the result table. No independent rerun has been located.
- Threats to validity: The corpus consists of selected public repositories, and tasks/tests are synthesized and localized from repository evidence. Finite test suites can miss requirements; generation or coding-style alignment may affect results; commercial production systems, ongoing operations, and real incident rates were not measured.

## Reproducibility

- Available artifacts and licenses: The official repository exposes code, task workspaces, source inventory, and a pytest quick start; code is Apache-2.0. The arXiv v1 paper is CC BY 4.0. Availability does not establish a complete rerun of all six systems.
- Environment or compute requirements: Python and pytest for individual task/oracle checks; an external compatible evaluation harness and access to the compared agent systems are needed for full agent comparisons.
- Smallest useful reproduction: Run the task-level pytest quick start on a pinned workspace, then inspect one F2P task and one P2P contract to see whether a passing patch both adds the requested behavior and preserves existing behavior.
- Blocking unknowns: Exact full-suite runner configuration, model/product versions, tool/time budgets, confidence-interval calculation, independent replication, and transfer from synthesized open-repository tasks to commercial ML operations.

## Critical reading

- Strongest result: The split between task completion and per-test pass rate makes partial behavioral success visible; the public task workspaces also allow targeted inspection of contracts and patches.
- Weakest assumption: A finite synthesized test suite derived from selected repositories captures enough of each task's behavior to support “complete” outcomes without rewarding generator or style alignment.
- Stated limitations: The paper notes a selected open-source repository corpus, synthesized tasks, limited benchmark size, and incomplete coverage of production conditions.
- Claims not supported by the evidence: The results do not show that coding agents succeed at the reported rate in commercial deployments, that a test-passing patch is safe to release, or that the completion/pass-rate difference measures near-complete tasks.

## Bloss0m connection

- Related Traditional Chinese routes: Connect to the existing agent-evaluation and coding-agent evaluation series; the new article is Paper Reading #104.
- Related English routes: The paired #104 reading provides the same benchmark interpretation and limits.
- Duplication risk: Medium with coding-agent benchmark readings; differentiate by focusing on ML lifecycle maintenance and the F2P/P2P behavior contract.
- Suggested internal links: `agent-evaluation-observability`, `tool-use-coding-agents`, and production RAG / repository-level agent evaluation.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 4 novelty + 4 evidence quality + 5 reproducibility + 5 engineering value + 5 series value = 28. The task corpus and executable artifacts are inspectable, while author-only results, synthesized tasks, finite tests, and reporting gaps cap the evidence score.
- Open questions requiring human approval: Whether to foreground benchmark design or the completion-versus-test-pass gap, and how to present the forthcoming venue status after publication proceedings are available.
