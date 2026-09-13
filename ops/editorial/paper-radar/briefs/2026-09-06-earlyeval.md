---
stableId: "arxiv:2609.02783"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-06
lastVerifiedAt: 2026-09-06
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

# EarlyEval: Cheaper Agent Evaluation via Early Outcome Prediction

## Identity

- Stable ID: `arxiv:2609.02783`.
- Canonical URL: https://arxiv.org/abs/2609.02783
- Authors: Yuling Shi, Zhensu Sun, Junsen Dong, Chengcheng Wan, David Lo, and Xiaodong Gu.
- Venue or review status: arXiv v1 submitted 2026-09-02; subjects cs.AI and cs.LG.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2609.02783`; no separate venue record located.
- Code / model / data: Paper HTML and the authors' code repository are available at https://arxiv.org/html/2609.02783v1 and https://github.com/inphotoo/earlyeval. The repository describes a code-only release with a smoke test; full trajectory inputs and trained models are not all bundled.

## Editorial fit

- Reader question: Can an evaluation harness stop doomed agent runs early without turning a cheaper measurement into a biased score?
- Why this belongs in the selected track: It fills `agent-systems` / `agent-evaluation` with an operational cost-control layer for trajectory-based evaluation.
- Gap it fills: Existing benchmark and harness work mostly improves task realism, judging, or environment generation; EarlyEval asks when enough trajectory evidence exists to stop spending tokens.
- Why now: The paper evaluates more than 21,000 trajectories across SWE-bench Verified, TerminalBench, and Toolathlon, reporting 13–26% fewer steps, up to 44.1% input and 29.4% output token savings, 89–97% prediction accuracy, and only 1–2 percentage-point resolve-rate perturbation.

## Claim map

- Problem: Full agent trajectories are expensive to evaluate, while many failures become predictable before the run ends.
- Main claim: Calibrated LightGBM classifiers over behavioral, textual, and reference-solution features can predict success or failure early enough to reduce evaluation cost with small score distortion.
- Method: Train paired success/failure predictors, monitor each trajectory, and halt when confidence crosses an operating threshold; leave-one-agent-out splits test transfer to unseen agent configurations.
- What is genuinely new: Early stopping is treated as an evaluation protocol with a measurable cost–accuracy frontier rather than as a heuristic timeout.

## Evidence audit

- Dataset and construction: The full HTML reports 16/37/22 agents across the three benchmarks and more than 21,000 trajectories, with task-partitioned leakage controls and leave-one-agent-out evaluation.
- Metrics: Step reduction, input/output token proxies, success/failure accuracy, Spearman correlation, pass-rate perturbation, calibration, and feature ablation.
- Baselines: LightGBM is compared with MLP, logistic regression, Qwen LoRA, and an LLM judge; behavior features are reported as the main driver.
- Strongest reported result: At the recommended operating point on SWE-bench Verified, the repository reports 26% fewer steps, 32.7% lower input tokens, 28.7% lower output tokens, and 1.1 percentage-point pass@1 perturbation.
- Threats to validity: Token proxies may not equal provider cost; historical labeled trajectories can encode benchmark or agent-family regularities; first-ever evaluation of a new agent has weaker calibration; stopping rules can change the population being measured.

## Reproducibility

- Available artifacts and licenses: Public code and a smoke test are available; the README indicates that reproducing the headline tables still requires benchmark artifacts, trajectory data, and trained models.
- Environment or compute requirements: Multiple benchmark suites, historical trajectory collection, classifier training, and repeated agent evaluation.
- Smallest useful reproduction: Train the released classifier on one benchmark's held-out trajectories, run leave-one-agent-out evaluation, and plot cost savings against pass-rate distortion across thresholds.
- Blocking unknowns: Provider billing semantics, training-data provenance, calibration drift on new model families, and whether early stopping changes ranking stability across agents.

## Critical reading

- Strongest result: The explicit cost–resolve-rate frontier and unseen-agent split make the method actionable for continuous evaluation pipelines.
- Weakest assumption: Behavioral signals learned from existing trajectories remain calibrated when the agent architecture, executor model, benchmark, or task distribution changes.
- Claims not supported by the evidence: The results do not show that early stopping is safe for a first-ever benchmark, production incident review, or any evaluation where a complete trajectory is itself the object of study.

## Bloss0m connection

- Related series areas: `agent-evaluation`, evaluation realism, terminal-agent harnesses, and deployment-simulation coverage.
- Related candidates: Terminal-Universe, BTS-AgentBench, AgentJudgeBench, SARA, and the agent-harness series.
- Duplication risk: Medium; differentiate by focusing on evaluation economics and the bias introduced by selective truncation, not another benchmark overview.
- Suggested internal links: `agent-evaluation`, `85-trec-rag-2026-rag-evaluation-harness`, and `64-ai-agent-guide`.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 5 evidence quality + 4 reproducibility + 5 engineering value + 5 series value = 29. The scale, leakage controls, public implementation, and operational cost frontier are unusually strong; data and calibration boundaries still need a critical read.
- Open questions requiring human approval: Decide whether the article should foreground cheaper continuous benchmarking or the validity risk of selectively truncating trajectories, and require a reproduction table before publication.

