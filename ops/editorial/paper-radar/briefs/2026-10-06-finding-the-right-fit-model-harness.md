---
stableId: "arxiv:2610.00917"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-10-06
lastVerifiedAt: 2026-10-06
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

# Finding the Right Fit: Model–Harness Interactions across Agent Tasks

## Identity

- Search window: 2026-09-29–2026-10-06; seven-day backfill. arXiv v1 was submitted 2026-10-01.
- Canonical URL: https://arxiv.org/abs/2610.00917
- Full paper: https://arxiv.org/html/2610.00917
- Authors and venue: Yixuan Li, Yiyun Zhou, Yao Long Teng, Fuchao Yang, Yanchen Deng, Zhiyi Lyu, Xuyu Dong, Feng Chen, and Bo An; arXiv preprint, cs.AI and cs.SE.
- DOI / OpenReview / arXiv aliases: arXiv:2610.00917v1; arXiv DOI https://doi.org/10.48550/arXiv.2610.00917.
- Code / model / data: [Experiment suite](https://github.com/liyix/finding-the-right-fit); [6,204 scored trajectories and result tables](https://huggingface.co/datasets/yixuanli97/finding-the-right-fit). The repository includes pinned configuration, adapters, cost accounting, and figure/table scripts. A full reproduction requires Linux, Docker, API access, and roughly 100 GB local ALE task data by request.
- License: Paper page reports CC BY 4.0. Check each repository/dataset license before reuse.

## Editorial fit

- Reader question: Does choosing a model determine an agent's performance, or can the harness reverse model rankings and cost for the actual task?
- Track and gap: agent-systems / agent-evaluation.
- Why now: Model and agent leaderboards can blur the model, harness, and task into one score. This cross-product study gives practitioners a concrete way to see how rankings and cost change when the harness changes.
- Existing coverage: Paper Reading #83 covers configuration effects and repeat-run variance in scientific model-use tasks. This paper asks a distinct question with cross-harness coding-agent comparisons on three task collections; link as a related reading and avoid repeating the broad “agents are systems” thesis.

## Claim map

- Problem: A model leaderboard does not reveal whether its ranking survives a different tool loop, error handling, context policy, timeout, or task.
- Method: The authors compare 66 model–harness configurations across TUA-Bench (120 tasks), ALE-CLI (99 tasks), and a 63-task non-H100 subset of Terminal-Bench 4. Four configurable harnesses are crossed with five models; Codex–GPT and Claude Code–Claude are added as native references. They report scores and cost per task, inspect matched trajectories, and release 6,204 scored traces.
- Main result: The winning harness changes across task collections for four of five models. On Terminal-Bench 4, Claude leads GPT by 7.94 points in OpenHands but trails GPT by 30.16 points in PI. For GPT-6 Astra, PI reports 60.32% at $4.66 per task versus DSH's 52.38% at $19.94. Matched traces connect differences to timeout and feedback behavior; they do not isolate a single causal component.
- Strongest interpretation: Evaluate the model–harness pairing on the target workload, and inspect how runtime choices turn a tool failure into useful feedback or a silent timeout.

## Evidence audit

- Primary evidence inspected: arXiv record and full HTML, experiment repository README and configuration description, and linked trajectory dataset description.
- Baseline or comparison: Three separate benchmark task sets, common task IDs per collection, four configurable harnesses, five models, and two native pairings. The authors state that results are not combined into one overall score.
- Limitations: One counted run per task; settings, tools, reasoning budgets, task subsets, and default context/retry behavior are not uniformly matched. Run-to-run variance is not measured. Some infrastructure failures were rerun, the final rerun determines reward and cost, and unresolved outcomes receive zero. Matched-trajectory analysis uses a small number of pairs. Thus this is comparative system evidence, not a causal ranking of base models or proof that one harness is generally superior.
- Independent replication: None found in this scan. Public data/code allow inspection and analysis, but a complete run is costly and ALE task data is gated/requested separately.

## Critical reading

- Main risk: The paper's cross-setting score reversals are useful deployment evidence, but they combine differences among harness defaults and model–harness interactions. Avoid interpreting the measured gaps as isolated causal effects.
- Suggested article focus: Show one ranking reversal and one matched failure-recovery trace, then connect them to task-specific selection and cost measurement. Distinguish authors' observed scores from recommendations for future harness design.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30 (topic 5, novelty 5, evidence 4, reproducibility 4, engineering 5, series value 5). The three-benchmark comparison, detailed runtime traces, and public code/data are unusually actionable. Evidence and reproducibility are capped because this is a single campaign with unmatched defaults, no variance estimate or independent rerun, and nontrivial/gated setup.
- Open questions for approval: Which benchmark subset is most useful for a focused read; whether to emphasize the ranking reversal or error-feedback mechanism; and how much reproduction scope is realistic.
