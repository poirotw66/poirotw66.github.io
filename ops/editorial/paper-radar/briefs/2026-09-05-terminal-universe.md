---
stableId: "arxiv:2609.04148"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-05
lastVerifiedAt: 2026-09-05
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
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

# Terminal-Universe：把一次性的 Agent trajectory 變成可反覆驗證的 executable environment

## Identity

- Search window: strict 72-hour scan from 2026-09-02 00:31Z to 2026-09-05 00:31Z.
- Canonical URL: https://arxiv.org/abs/2609.04148
- Authors: Jie Wu, Zhenru Zhang, Beichen Zhang, Xuwu Wang, Yuhui Su, Mouxiang Chen, Peng Wang, Zhihai Wang, Que Shen, Hao Zhou, An Yang, Fei Huang, Yujiu Yang, and Dayiheng Liu.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-03; full HTML version available.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.04148
- Benchmarks: Terminal-Bench 2.0 and 2.1; EvoCode-Bench v2.

## Editorial fit

- Reader question: If a coding-agent trajectory is only one frozen demonstration, how can we turn it into many executable tasks with real test feedback?
- Why this belongs in the selected track: The paper makes the terminal workspace, verifier, cross-workspace dependency, and multi-round user feedback part of data construction rather than adding more synthetic prompts to a static dataset.
- Gap it fills: Tool-use reliability—training agents in environments where file state, dependencies, tests, and follow-up requirements actually change.
- Why now: Long-horizon coding agents need more than trajectories; they need resettable workspaces and verifiable consequences. Terminal-Universe offers an environment-first recipe based on recorded tool execution.

## Claim map

- Problem: Existing agent trajectories are useful demonstrations but do not provide reusable, executable environments for post-training.
- Main claim: Replaying file operations and completing missing workspace state can produce thousands of task-sufficient environments, which can then be expanded in breadth and depth for supervised training.
- Method: Restore each file before it was modified, have a completion agent fill missing files and dependencies, reconstruct the original intent, synthesize within-workspace and cross-workspace tasks, extend them into multi-round sessions, and retain only verifier-passing trajectories.
- What is genuinely new: The unit of scaling is an environment with an executable verifier, not a single trajectory or a generated task description.

## Evidence audit

- Data funnel: The pipeline produces 37.3k task-sufficient environments and 31,977 verifier-filtered SFT demonstrations, totaling about 1.42B training tokens. The mixture contains 25,386 Single-WS, 3,512 Cross-WS, and 3,079 Multi-Round trajectories.
- Training result: Fine-tuning Qwen3.5-27B for two epochs improves Terminal-Bench 2.1 by 11.9 points and EvoCode-Bench v2 MT@4 by 13.8 points. Under Claude Code on Terminal-Bench 2.1, the reported model reaches 58.2%, a 10.4-point gain over the base model.
- Controls: The authors use contamination checks, verifier filtering, ablations for reconstruction and re-solving, six independent Terminal-Bench runs, and four EvoCode runs. Re-solving reconstructed environments outperforms simply imitating raw trajectories in the reported comparisons.
- Evaluation setup: Terminal-Bench uses long contexts, up to 500 agent turns, four-hour limits, and 12 CPU cores with 32 GiB memory per container; EvoCode preserves workspaces across 227 rounds over 26 tasks.
- Statistical uncertainty: Results are mean pass rates over repeated runs, but the paper does not provide a broad independent replication or confidence-interval treatment for every benchmark comparison.
- Threats to validity: Completion agents may introduce artifacts not present in the original workspace, verifier design can filter the data toward easy-to-check behaviors, and results depend on Qwen3.5-27B, the Terminus2 or Claude Code scaffolds, and benchmark distributions.

## Reproducibility

- Available artifacts: Full HTML paper, reconstruction and synthesis algorithm details, benchmark configurations, contamination protocol, ablations, and complete training/evaluation settings. A dedicated public code repository was not verified in the primary source.
- Environment or compute requirements: Public terminal-agent trajectories, replayable file-operation logs, a completion model, containerized workspaces, executable verifiers, Qwen3.5-27B fine-tuning, and multi-hour benchmark runs.
- Smallest useful reproduction: Take a small set of terminal traces, reconstruct pre-action workspaces, synthesize one within-workspace task per trace, add a deterministic verifier, and compare imitation training with re-solving under the same model and scaffold.
- Blocking unknowns: Public training-data release, reconstruction failure rate, exact completion-agent prompts, compute cost per accepted environment, and transfer to proprietary repositories or non-terminal agents.

## Critical reading

- Strongest result: The ablation and benchmark evidence connect environment reconstruction to both single-turn and multi-round performance, including cross-workspace and iterative feedback settings.
- Weakest assumption: A verifier-passing synthetic environment is a faithful enough proxy for real software development; verifier correctness does not guarantee realistic requirements or dependency complexity.
- Unsupported leap: More executable environments do not automatically imply better production coding agents. The method still inherits scaffold, benchmark, and data-mixture biases.

## Bloss0m connection

- Related routes: coding agents, tool-use reliability, continual improvement, benchmark realism, and agent evaluation.
- Duplication risk: Medium with Harness-of-Harness and other coding-agent candidates, but this paper focuses on training-environment generation rather than online self-improvement.
- Suggested internal links: Pair with Harness-of-Harness for multi-day interaction, Discriminative World Models for action ranking, and Improving Evaluation Realism for deployment-scaffold fidelity.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: concrete environment reconstruction, verifier-filtered data, 37.3k environments, 1.42B training tokens, multi-round evidence, and reproducible evaluation settings. Reproducibility is capped because a dedicated public implementation and data release were not verified.
- Open questions requiring human approval: What fraction of recorded trajectories reconstruct successfully? How much of the gain comes from environment diversity versus the verifier filter, and can the recipe preserve realistic failure cases rather than only passing ones?

