---
stableId: "arxiv:2608.29696"
sourceVersion: "v1"
status: "shortlist"
firstSeenAt: 2026-09-02
lastVerifiedAt: 2026-09-02
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 4
  novelty: 5
  evidenceQuality: 5
  reproducibility: 5
  engineeringValue: 3
  seriesValue: 3
  total: 25
decision: "shortlist"
---

# Ideation Arena: Evaluating LLM Generated Research Ideas with Battle-style Human Expert Assessment

## Identity

- Canonical URL: https://arxiv.org/abs/2608.29696
- Authors: Zhiyu Chen, Keyu Zhao, Jigao Fu, Dong Liang, Yanbiao Wu, Jiaoyang Li, Haidong Xue, Xinhua Zeng, Yuanyi Zhen, Fengli Xu, Yong Li.
- Venue or review status: arXiv preprint, v1 submitted 2026-08-30.
- DOI / OpenReview / arXiv aliases: arXiv:2608.29696; DOI https://doi.org/10.48550/arXiv.2608.29696.
- Code / model / data: Research-Ideation-Arena repository https://github.com/foss12138/Research-Ideation-Arena; the paper states that code, data, and leaderboards are available. CC BY 4.0 paper license.

## Editorial fit

- Reader question: Can an automated judge tell whether an AI-generated research idea is genuinely useful, or does it only reward fluent plausibility?
- Why this belongs in the selected track: The paper evaluates research-agent systems and the evaluator itself with a sizeable human pairwise protocol.
- Gap it fills: Agent evaluation—human preference alignment and meta-evaluation for open-ended outputs without a single reference answer.
- Why now: Research agents are moving from literature summarization toward proposal generation, but benchmark scores can conceal a mismatch between automated judgment and expert value.

## Claim map

- Problem: Scientific idea quality is difficult to score objectively and cannot be reduced to a reference answer.
- Main claim: A shared-context battle arena with double-blind expert comparisons can produce a stable preference leaderboard and expose the limits of LLM judges.
- Method: Compare 14 frontier LLMs and five research-agent architectures built on two base models under shared literature contexts; collect more than 6,000 pairwise comparisons from 105 active CS researchers; construct Elo rankings; evaluate automated judges against human preferences.
- What is genuinely new: The benchmark treats the evaluator as a system under test and quantifies judge alignment rather than assuming an LLM judge is a reliable oracle.

## Evidence audit

- Datasets: Shared literature contexts drawn from papers familiar to participants; generated research proposals; human pairwise labels and an Ideation Arena Eval benchmark.
- Benchmarks and metrics: Elo ranking, inter-rater agreement, robustness to annotator composition and domain coverage, and Soft Accuracy for automated judges.
- Baselines: 14 frontier models, five agent architectures, two base models, and current LLM judge configurations.
- Reported result: The best reported automated judge reaches 72.56% Soft Accuracy on Overall Quality, while agent frameworks vary: some improve their backbone and others do not.
- Ablations: Domain coverage, annotator composition, order/length diagnostics, closed-context adaptations, tie sensitivity, and confidence intervals are covered in the appendices.
- Statistical uncertainty: The full paper reports robustness analyses and Elo confidence intervals; the exact intervals and participant stratification should be transcribed before publication.
- Threats to validity: Proposal-stage preference is not scientific correctness, the main benchmark is computer-science and closed-context, and participants may share topical familiarity with the seed literature.

## Reproducibility

- Available artifacts and licenses: Public repository, data, and leaderboards are stated by the paper; verify exact files, participant-data handling, and dataset license before writing.
- Environment or compute requirements: Re-running model generations requires access to the listed frontier models; re-running the human protocol requires expert recruitment and compensation.
- Smallest useful reproduction: Use a small shared-context corpus, two or three models, blinded pairwise presentation, Bradley–Terry/Elo ranking, and a held-out LLM judge evaluated against human choices.
- Blocking unknowns: Raw proposal data, annotator instructions, recruitment filters, compensation, prompt templates, model snapshots, and whether generated outputs can be redistributed.

## Critical reading

- Strongest result: The work demonstrates a measurable gap between automated judging and expert preference instead of silently treating judge scores as truth.
- Weakest assumption: Pairwise expert preference is a useful proxy for research value even when ideas are not implemented or scientifically tested.
- Stated limitations: The authors warn that leaderboard scores reflect a particular closed-context snapshot and should not replace expert scientific judgment.
- Claims not supported by the evidence: A high Elo score does not show novelty, correctness, feasibility, or downstream publication impact.

## Bloss0m connection

- Related Traditional Chinese routes: Existing agent-evaluation, paper-reading, and research-agent entries after archive-aware lookup.
- Related English routes: Existing Agent Systems evaluation entries after archive-aware lookup.
- Duplication risk: Medium; distinguish evaluator validity from generic “AI scientist” stories and keep the human-protocol details central.
- Suggested internal links: Pair with future coverage of evidence-grounded research agents and LLM-as-a-judge reliability.

## Recommendation

- Output level: Shortlist.
- Score rationale: 4/5 topic relevance, 5/5 novelty, 5/5 evidence quality, 5/5 reproducibility, 3/5 engineering value, 3/5 series value. It is a strong evaluation paper with accessible artifacts, but its direct connection to production agent reliability is indirect.
- Open questions requiring human approval: Are the data and prompts redistributable? How stable are rankings across truly novel domains? Does judge calibration improve with structured evidence or execution outcomes?
