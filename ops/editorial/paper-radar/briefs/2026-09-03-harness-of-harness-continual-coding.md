---
stableId: "arxiv:2609.01481"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-03
lastVerifiedAt: 2026-09-03
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 4
  total: 27
decision: "deep-read-candidate"
---

# Harness-of-Harness：讓 Coding Agent 在多日迭代中持續變好，而不是重複犯錯

## Identity

- Search window: strict 72-hour scan from 2026-08-31 00:32Z to 2026-09-03 00:32Z.
- Canonical URL: https://arxiv.org/abs/2609.01481
- Authors: Haoyang Yan, Min-Le Su, Hangfan Zhang, Zhanhao Li, Chen Zhang, Shao Zhang, Yang Chen, Lei Bai, and Shuyue Hu, Shanghai Artificial Intelligence Laboratory.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-01; CC BY 4.0 HTML version available.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.01481
- Public project repository: https://github.com/Flesymeb/HarnessOfHarness; project page https://flesymeb.github.io/HarnessOfHarness/.

## Editorial fit

- Reader question: What does a coding agent need to carry from one autonomous development loop to the next so later work improves rather than recreates or regresses?
- Why this belongs in the selected track: HoH wraps existing agent harnesses with explicit planner, developer, and read-only QA roles, then transfers both the artifact and an evidence bundle across loops.
- Gap it fills: Tool-use reliability—moving from one-shot benchmark success toward evidence-conditioned, versioned, multi-day execution.
- Why now: The paper tests the same idea on GameCraft-Bench, FrontierSWE, and ProgramBench, and pairs short benchmark loops with a 70-loop FPS case study.

## Claim map

- Problem: Autonomous software development needs capability growth and repair while preserving already verified behavior. Re-running a coding harness without durable evidence risks rebuilding, regressions, and opaque improvement claims.
- Main claim: Iterative planning–coding–testing over a shared workspace, with evidence records and independent QA fed into the next planner, consistently improves artifact quality over the corresponding standalone harnesses.
- Method: The planner reads requirements plus prior evidence and writes a prioritized development document; the developer implements it in the existing workspace; the QA tester executes or inspects the artifact, separating verified records from gaps. HoH uses versioned project history, warm starts, evidence feedback, and explicit isolation from hidden benchmark evaluation.
- What is genuinely new: The unit of progress is a harness loop plus an evidence handoff, not merely a larger prompt or a longer agent run.

## Evidence audit

- Benchmarks and configurations: GameCraft-Bench, FrontierSWE, and ProgramBench; three harness–model pairs are Codex/GPT-5.5, OpenCode/DeepSeek-V4-Pro, and Pi/MiniMax-M3. The paper reports an average relative gain of 52.25% and a maximum of 82.86% after three iterations.
- Budget-controlled result: On a matched pass budget, HoH scores 59.71, 64.84, and 71.52 at one, two, and three passes versus 49.58, 54.99, and 58.24 for Vanilla. HoH@2 reaches 64.84 with 5.67M tokens, above three-pass Vanilla Continuation at 58.24 with 6.33M tokens.
- Ablations: Removing plan updates lowers GameCraft-Bench score by 8.13 points, removing evidence feedback by 6.28, and removing warm-start by 7.85; the no-warm-start variant uses 11.12M rather than 8.41M tokens per task.
- Multi-day case: A Fusepoint FPS project ran for 70 loops from a PRD in an empty workspace, with human intervention limited to restoring network or API availability. This is a single case study, not a population estimate.
- Statistical uncertainty: The paper includes bootstrap uncertainty and resource accounting in the appendices, but model, harness, prompt, and environment are still coupled in a small number of configurations.
- Threats to validity: Benchmark-hidden evaluator materials are withheld; the public repository says HoH-lite is forthcoming and does not yet constitute a turnkey reproduction of the full system. “Human-playable” and visual quality are supported by the study's evaluation setup, not independent field deployment.

## Reproducibility

- Available artifacts: Public project repository, paper HTML, role and evidence descriptions, benchmark protocol details, and a forthcoming HoH-lite notice. Benchmark repositories, hidden evaluator contents, provider credentials, and private secrets are not included.
- Environment or compute requirements: Reproducing the headline model/harness pairs requires the corresponding coding-agent runtimes, model access, benchmark environments, and potentially substantial inference budget.
- Smallest useful reproduction: Implement the planner/developer/QA loop over one public repository task, persist a structured verified/gap evidence bundle, compare warm-start and rebuild variants at a fixed pass/token budget, and measure regression preservation separately from new feature count.
- Blocking unknowns: Exact public implementation availability, run seeds and per-task variance, benchmark license/setup friction, and whether independent agents reproduce the same multi-day trajectory.

## Critical reading

- Strongest result: The ablations connect gains to evidence feedback, plan updates, and warm-start rather than to “more loops” alone, while the benchmark protocol isolates hidden evaluation from the agent's evidence.
- Weakest assumption: A small set of harness–model pairs and one long-running game can stand in for broader autonomous software development.
- Unsupported leap: The paper does not show that HoH is safe for arbitrary repositories, production credentials, or irreversible deployment actions; quality improvement is not equivalent to operational autonomy.

## Bloss0m connection

- Related routes: coding agents, agent harnesses, provenance contracts, evaluation isolation, and long-horizon state.
- Duplication risk: Medium with coding-agent coverage, but the cross-loop evidence handoff and budget-controlled ablations provide a distinct angle.
- Suggested internal links: Pair with the trace-state paper and the existing tool-use reliability candidates; compare its “verified/gap evidence” with the repository's provenance-contract discussion.

## Recommendation

- Output level: Deep Read.
- Score rationale: 27/30: strong topic fit and novelty, detailed benchmark/ablation evidence, high engineering value, and a public project surface. Reproducibility is capped at 3/5 because the repository advertises HoH-lite as forthcoming and does not yet expose a complete turnkey implementation.
- Open questions requiring human approval: Can an independent team reproduce the fixed-budget gains? How should evidence be signed, invalidated, and permission-scoped when the agent edits a real repository or deploys infrastructure?

