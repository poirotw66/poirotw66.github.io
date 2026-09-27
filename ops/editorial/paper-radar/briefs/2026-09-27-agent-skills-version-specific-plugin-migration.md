---
stableId: "arxiv:2609.30120"
sourceVersion: "v1"
status: "approved"
firstSeenAt: 2026-09-27
lastVerifiedAt: 2026-09-27
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
decision: "approved"
---

# Evaluating Agent Skills for Version-Specific Plugin Migration: A Retrospective Study

## Identity

- Search window: Seven-day backfill; arXiv v1 submitted 2026-09-24.
- Canonical URL: https://arxiv.org/abs/2609.30120
- Full paper: https://arxiv.org/html/2609.30120v1
- Authors: Beiming Liu, Haihao Li, Minjie Chen, Ning Chen, Yiran Wang, Jiming Ye, Puzhao Zhang, Tongtao Wang, Sheng Gao, William Jin, Weihao Mu, Chengzhi Liu, Yucheng Xia, Guangren Wang, Chaoyang Fan, Changfeng Huang, Xunming Lin, and Yuanjie Shen.
- Venue or review status: arXiv cs.SE preprint v1; peer-review status not established.
- Code / data: https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill; inspect the repository and paper's artifact map for the exact archived task/report/analysis materials and their current access state.

## Editorial fit

- Reader question: Does giving a coding agent a version-specific maintenance skill improve migration advice, and what does a higher grader score establish about correctness?
- Track / gap: agent-systems / agent-evaluation.
- Why now: Agent skills are increasingly used to package procedural and version-specific knowledge; this study audits not only aggregate score changes but also contract-level grading errors and task-level concentration.

## Claim map

- Problem: An agent may produce plausible migration advice that misses the target version's API, ownership, safety, or lifecycle contract; aggregate diagnostic scores can hide those failures.
- Main claim: In a focal archived configuration over 16 selected static migration tasks, the skill condition had a higher mean recorded reward than the no-skill condition, but the magnitude and interpretation are sensitive to task concentration, ceiling effects, judge configuration, and retrospective correction.
- Method: Seeded stratified selection of 16 from 22 static tasks; two no-skill and two with-skill attempts per task, yielding 64 archived reports and 328 criterion decisions; original GLM-5.3-Flash grading plus full-cohort accounting, bounded review, cross-family LLM re-grading, and limited executable mechanism checks.
- Genuinely new evidence: An artifact-traceable retrospective comparison linking version-pinned tasks, reports, criteria, resource records, and concrete counterexamples, rather than treating one aggregate judge score as correctness.

## Evidence audit

- Focal result: Original recorded reward means 93.83 without the skill and 98.75 with it, difference +4.92 points, 95% task-bootstrap interval [0.31, 10.86] (Table 1; Section 5.1).
- Task-level qualification: Six tasks improve, two decline, and eight remain unchanged at 100 in both conditions; S1 contributes +42.5 points, and removing it leaves a +2.42-point mean difference. The paper describes this as a descriptive association; its approximate Wilcoxon result is p=0.0797 with eight nonzero pairs (Figure 3; Section 5.1).
- Grading sensitivity: Cross-family LLM judges preserve a positive direction but estimate different gains (+10.63 Claude Opus 5.5; +6.09 GPT-5.5); all judges are LLMs, not human validation (Table 3; Section 5.3).
- Contract review: A proposed containment predicate accepts the parent path `..` but initially received full credit; bounded review and executable predicate checks lower/qualify the judgment. Replacement estimates are sensitivity analyses, not fully validated regrades (Figure 1; Sections 4.5, 5.2, 6.1).
- Resource accounting: Recorded token totals are not billing cost and summed durations are not end-to-end wall time under overlapping execution (Section 5.3).
- Threats: Retrospective single-case study, overlapping task/skill development, static advice rather than completed migrations, one plugin framework, selected 16-task focal pool, high score ceiling, judge/rubric uncertainty, and limited external validity.

## Reproducibility

- Public artifact repository is linked by the paper; independently inspect current files, commit history, licenses, data/task/report coverage, and the paper's artifact map before describing it as usable or reproducible.
- No full benchmark rerun is assumed for this article. Distinguish paper-reported archive results from any static artifact inspection or limited check.
- Minimal useful reproduction would require the version-pinned task packets, both-condition archived outputs or execution setup, scoring rubric/judge prompts, and the prescribed paired-task analysis; report any absent/gated component as of the verification date.

## Critical reading

- Strongest result: The paper keeps an auditable task-level record and uses contract inspection to demonstrate a concrete mismatch between a high rubric reward and a path-containment defect.
- Weakest inference: A score increase on this retrospective static-advice task pool does not show that skills generally produce correct or successfully executed software migrations.
- Claims not supported: Universal skill effectiveness, causal attribution to skill organization rather than bundled facts, correct repairs in live repositories, or human-confirmed judge validity.

## Bloss0m connection

- Relates to agent evaluation, software maintenance, skill packaging, and the distinction between plausible advice and executable verified repair.
- Duplication risk: Adjacent to broad skill benchmarks, but this paper's unique angle is version-specific plugin contracts, retrospective artifacts, judge sensitivity, and an executable containment counterexample.

## Recommendation

- Output level: Paper Reading #75 — `75-agent-skills-version-specific-plugin-migration` (bilingual draft created; not published).
- Score rationale: 28/30 (topic 5, novelty 5, evidence 4, reproducibility 4, engineering value 5, series value 5). The concrete correctness counterexample and task-level audit are highly actionable; the single-case design, scoring uncertainty, artifact scope, and absence of independent human validation constrain the evidence and reproducibility scores.
- Human approval: Explicitly approved by the user for a bilingual Deep Read on 2026-09-27.
- Validation: Strict bilingual pair, three-body-figure structure, and comprehension audits passed in both languages. Figures are original explanatory diagrams, not copied paper figures: the arXiv version did not provide an explicit figure-reuse license. Artifact inspection is not a full benchmark rerun.
