---
stableId: "arxiv:2609.19134"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-18
lastVerifiedAt: 2026-09-18
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

# ScienceIDE: Turning World's Scientific Codebase into Agent Learnable Environments

## Identity

- Search window: Strict 72-hour scan ending 2026-09-18; arXiv v1 was submitted on 2026-09-16 at 17:55 UTC.
- Canonical URL: https://arxiv.org/abs/2609.19134
- Full paper: https://arxiv.org/html/2609.19134v1
- Authors: Hejia Geng et al.
- Venue or review status: arXiv preprint in cs.CL and cs.CY; no peer-review status was assumed.
- Code / model / data: https://github.com/aitofound/ScienceIDE; PhAI-IDE model collection at https://huggingface.co/collections/AItonomy/scienceide-model-series; fuller infrastructure is linked as https://github.com/Gen-Verse/ScienceInfra.

## Editorial fit

- Reader question: How can scientific software become a reliable learning and evaluation environment for coding agents when correctness means reproducing a physical or numerical result rather than matching a patch?
- Why this belongs in the selected track: ScienceIDE connects agent evaluation, task generation, supervised fine-tuning, and reinforcement learning through executable scientific environments.
- Gap it fills: agent-systems / agent-evaluation, specifically domain-grounded verification and the difference between code-diff success and scientific-result success.
- Why now: General coding benchmarks rarely expose implicit domain conventions, build systems, simulation checks, or the cost of verifying a scientific change. This paper turns those hidden constraints into an explicit environment contract.

## Claim map

- Problem: Scientific repositories contain valuable executable knowledge, but fragmented dependencies, domain conventions, and specialized correctness criteria make them difficult to use for agent learning.
- Main claim: Expert-defined scientific cases and acceptance criteria can be wrapped as executable environments that support task generation, verification, evaluation, SFT, and RL.
- Method: Pin an upstream repository revision and dependencies, package an editable workspace and private verifier, generate tasks with reference fixes, execute the agent episode, and score the rebuilt scientific result rather than a textual diff.
- What is genuinely new: The paper treats a scientific codebase as a reusable experience substrate with a common episode interface and provenance-aware task registry, not merely as a collection of coding prompts.

## Evidence audit

- Datasets: The paper reports 64 environments from 27 scientific codebases and 2,812 manufactured tasks: 2,515 repair, 295 implementation, and 2 acceleration tasks, with 1,076 executable checks. ScienceIDE-Hard contains 85 tasks across 18 environments.
- Benchmarks and metrics: Fifteen model or harness systems are evaluated on one-hour ScienceIDE-Hard episodes. The paper reports Fable 5.1 at 67.1%, Opus 5 at 64.6%, and Astra at 63.1%; the ordering is descriptive and not established as statistically significant.
- Baselines: The environment checks an official reference fix for full reward, leaves headroom in the unfixed baseline, and includes leakage/integrity checks. The public preview compares SFT and RL recipes against their respective starting models and baselines.
- Ablations: SFT uses Qwen3.5-4B/9B and Qwen2.5-72B with localized repair segments; RL uses Qwen3.5-4B and reports LAPS improvement from 0.357 to 0.857 and MITgcm-biogeo from 0.286 to 0.571 after 30 steps.
- Statistical uncertainty: The paper supplies aggregate success, cost, time, and token numbers, including a descriptive success/runtime Spearman correlation of -0.22. It does not establish confidence intervals for the model ranking or broad generalization to scientific codes outside the released tasks.
- Threats to validity: Expert task design can encode selection bias; manufactured tasks may not represent research workflows; private verifiers and held-out environments can hide implementation details; evaluation harness and model choice affect cost and success.

## Reproducibility

- Available artifacts and licenses: The public repository exposes 15 of 64 environments, 30 of 85 hard tasks, SFT/RL recipes, checks, and provenance fields. The README says the remaining environments and full task-authoring pipeline live in ScienceInfra. Upstream licenses are shipped, but the project's own code and task-metadata license is not yet declared.
- Environment or compute requirements: Containerized scientific dependencies, pinned upstream revisions, model inference, and potentially GPU-backed simulation runs are required. The README targets Linux-style container workflows rather than a lightweight local smoke test.
- Smallest useful reproduction: Run one published environment with its unfixed and reference versions, execute one repair episode, inspect the verifier and provenance record, then compare a baseline agent with one SFT or RL recipe on a held-out task.
- Blocking unknowns: The public preview omits 49 environments and 55 hard tasks, the complete generation pipeline, full training data, and the exact evaluation harness state. A clean clone cannot reproduce the headline 64-environment results.

## Critical reading

- Strongest result: Scientific correctness is made executable and can feed the same substrate into evaluation and training; this is a concrete answer to the scientific-experience bottleneck.
- Weakest assumption: Passing a private, expert-authored verifier is treated as a useful proxy for scientific correctness, but the verifier may encode only the chosen case and may not detect scientifically plausible but out-of-distribution errors.
- Stated limitations: The public release is a preview, the complete task bank is held out, and the paper's cost and success measurements are tied to specific models, harnesses, and scientific codebases.
- Claims not supported by the evidence: The results do not prove that ScienceIDE covers real research novelty, that positive transfer is universal, or that the leading system is statistically better than every competitor.

## Bloss0m connection

- Related Traditional Chinese routes: [When Tool Calls Succeed but Workflows Fail](/paper-reading/49-when-tool-calls-succeed-workflows-fail/), [Corrupt Plans, Clean Traces](/paper-reading/51-plan-injection-cot-monitoring/), and [After the Party](/paper-reading/52-after-party-agent-skill-ecosystem/).
- Related English routes: [When Tool Calls Succeed but Workflows Fail](/en/paper-reading/49-when-tool-calls-succeed-workflows-fail/), [Corrupt Plans, Clean Traces](/en/paper-reading/51-plan-injection-cot-monitoring/), and [After the Party](/en/paper-reading/52-after-party-agent-skill-ecosystem/).
- Duplication risk: Low. Existing readings cover tool-boundary anomalies, monitoring blind spots, and skill-registry governance; ScienceIDE adds executable scientific verification and training infrastructure.
- Suggested internal links: Agent evaluation, benchmark replay, provenance contracts, and the site's efficient-inference coverage.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: direct agent-evaluation relevance, a novel executable-environment framing, broad reported construction and training evidence, strong engineering value, and a plausible series bridge to benchmark and provenance articles. Evidence quality and reproducibility are held at 4 because the public repository is only a preview and the project's own license/full task bank are unresolved.
- Open questions requiring human approval: Which verifier failures are scientifically meaningful versus benchmark artifacts? How should private tasks be audited for leakage? Can the episode/provenance interface interoperate with general coding-agent harnesses?
