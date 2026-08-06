---
stableId: "arxiv:2608.04830"
sourceVersion: "v1"
status: "published"
firstSeenAt: 2026-08-06
lastVerifiedAt: 2026-08-07
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
decision: "published"
---

# ContextWeave: A Real-World Workflow Benchmark

## Identity

- Canonical URL: https://arxiv.org/abs/2608.04830
- Authors: Bo Wang; Yuqian Yao; Enxi Wang; Luozhijie Jin; Yang Liu; Yiran Suo; Yuxuan Cai; Enyu Zhou; Yufei Gao; Honglin Guo; Tianyu Huai; Li Ji; Zhikai Lei; Bufan Li; Lizhi Lin; Jinxiu Liu; Jie Yang; Jiazheng Zhou; Maosen Zhou; Pengfang Qian; Shichun Liu; Guanshan Liu; Hao Zheng; Yunhao Yu; Hang Yan; Jihua Kang; Xinchi Chen; Xipeng Qiu.
- Venue or review status: arXiv cs.AI preprint, v1 submitted 2026-08-05; no venue or OpenReview record identified.
- DOI / OpenReview / arXiv aliases: arXiv `2608.04830`; arXiv-issued DOI link is available; no separate DOI or OpenReview record identified.
- Code / model / data: Official repository https://github.com/OpenMOSS/ContextWeave provides the runner, Docker workflow, memory-component interface, metrics, data archive, and reproduction instructions. The repository exposes benchmark data and reference images, but a complete run is costly and the repository currently shows one commit.

## Editorial fit

- Reader question: Does persistent memory improve an agent's usable work across a real workflow, or only improve retrieval and apparent task completion?
- Why this belongs in the selected track: It evaluates memory through downstream workspace state, user-preference alignment, execution continuity, solvability, and memory-induced errors rather than isolated recall questions.
- Gap it fills: `agent-evaluation`, while extending the existing agent-memory path.
- Why now: Long-running enterprise agents increasingly carry workspace state and prior traces, but one-shot benchmarks do not show whether recalled experience helps the next action or introduces misleading state.

## Claim map

- Problem: Retrieval or QA scores do not establish that memory improves the final workspace, preserves user conventions, or avoids harmful recall during execution.
- Main claim: Longitudinal, executable workflow evaluation can reveal whether memory improves downstream agent behavior and which memory representations are useful.
- Method: Reconstruct privacy-preserved multi-month workflows from 14 participants into 1,005 executable tasks, including 568 core tasks, with containerized environments, reference traces, task rubrics, and with-recall versus no-recall controls. Compare six memory components under fixed execution conditions, then vary the base model.
- What is genuinely new: The benchmark makes memory an intervention on continued work and measures both outcome quality and behavioral diagnostics, including continuity and hallucination robustness.

## Evidence audit

- Datasets: 1,005 tasks from 14 participants; 568 manually labeled core tasks; 541 core tasks depend on preceding work, producing 8,084 relevant links. The longest message log reaches 212.3K tokens.
- Benchmarks and metrics: Workspace Score, Preference Score, pairwise with-recall win rate, relevance, continuity, solvability, and memory-induced task rate. Under the reported GPT-5.5/xhigh setting, the strongest tested component reaches Workspace 78.20 versus 68.08 without recall and Preference 70.60 versus 41.50.
- Baselines: No-recall execution, six memory components, and five base models under the fixed Codex harness and task/workspace controls.
- Ablations: Memory-component comparisons, fixed-memory base-model comparisons, and diagnostic decomposition of relevance, continuity, solvability, and hallucination robustness. A fixed-token-budget comparison between richer recall and summaries remains future work.
- Statistical uncertainty: The paper reports aggregate scores and paired conditions, but extensive human validation of task-specific LLM rubrics is still ongoing; confidence intervals and independent replication are not established in the paper.
- Threats to validity: Workflow reconstruction and simulated APIs may not preserve all real-world dependencies; most grading is GPT-5.5-based; privacy-preserving task selection may bias coverage; richer recall often improves outcomes while also increasing memory-induced task rates.

## Reproducibility

- Available artifacts and licenses: The official GitHub repository includes source code, a compressed benchmark archive, Docker image manifests, metric implementations, built-in memory components, and setup instructions. License and per-component licensing should be verified before redistribution; the repository's top-level license is not summarized in the paper.
- Environment or compute requirements: Python 3.11+, `uv`, Docker images, an OpenAI-compatible agent endpoint, an embedding endpoint for memory diagnostics, and model/API credentials. The README notes approximately $200 for a complete model-harness configuration in the current setup.
- Smallest useful reproduction: Run one participant and a small set of subtasks with `simple-text` or one released memory component, compare with-recall and no-recall, and compute workspace plus memory diagnostics before attempting the full suite.
- Blocking unknowns: Exact data archive version and license, reproducible Docker image digests, full-run cost under current endpoints, rubric calibration against human judgments, and whether the benchmark transfers to non-Codex enterprise harnesses.

## Critical reading

- Strongest result: The paper connects memory to usable workspace outcomes and shows gains across all five tested base models under the fixed mem0 comparison, while the component comparison exposes a trade-off between actionable recall and memory-induced errors.
- Weakest assumption: LLM-generated task reconstruction, preference rubrics, and graders can stand in for the participant's true workflow requirements without introducing systematic evaluator preference.
- Stated limitations: Rubric calibration and human validation remain incomplete; full evaluation is expensive; reconstructed resources and simulated APIs necessarily abstract away parts of the original workflows.
- Claims not supported by the evidence: The study does not establish that one memory architecture is universally best, that richer recall reduces production cost, or that the measured gains persist in arbitrary enterprise agents. The HTML limitation section also uses the name `MemoryBench`; confirm whether this is a leftover name or a separate artifact before publication.

## Bloss0m connection

- Related Traditional Chinese routes: `06-Beyond-RAG-for-Agent`; `08-osreward-agent-evaluation`.
- Related English routes: `06-Beyond-RAG-for-Agent`; `08-osreward-agent-evaluation`.
- Duplication risk: Medium. OSReward evaluates computer-use success and hybrid judging, while xMemory focuses on memory architecture; ContextWeave's distinctive unit is continued real-world workflow execution with memory-on/off controls.
- Suggested internal links: Agent evaluation, persistent state, trace logging, workspace verification, and the enterprise agent guide at `/blog/64-ai-agent-guide/`.

## Recommendation

- Output level: Deep Read
- Score rationale: High score reflects a named agent-evaluation gap, executable longitudinal controls, broad task coverage, a public artifact, and direct engineering implications. Evidence and reproducibility are discounted for reconstructed workflows, model-judge dependence, costly execution, and incomplete human calibration.
- Open questions requiring human approval: Decide whether to pair this with the existing agent-memory route or OSReward; verify repository and data licenses; and frame the result as workflow-level evaluation rather than proof that richer memory is always better.
- Publication state: The Traditional Chinese and English pair is prepared as `09-contextweave-workflow-benchmark`, with Figure 1–2 attribution, Table 1–2 result anchors, explicit memory-induced risk, and conditional artifact/reproducibility notes.
