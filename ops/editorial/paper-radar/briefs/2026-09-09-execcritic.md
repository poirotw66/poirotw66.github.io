---
stableId: "arxiv:2609.09133"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-11
lastVerifiedAt: 2026-09-11
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

# ExecCritic: testing is useful only when the evidence stays independent

## Identity

- Stable ID: `arxiv:2609.09133`.
- Canonical URL: https://arxiv.org/abs/2609.09133
- Authors: Taha Ahmed, Wenting Li, and Michael Hirzel.
- Venue or review status: arXiv v1 submitted 2026-09-08; no separate venue record located.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2609.09133`; full HTML at https://arxiv.org/html/2609.09133v1.
- Code / model / data: Public implementation at https://github.com/MSR-Orchard/execcritic. The paper trains Test and Repair policies with Qwen-3.5-35B-A3B and evaluates on SWE-bench Verified, with GPT-5.6-sol, Codex-5.3, and DeepSeek-V4-Flash comparison points.

## Editorial fit

- Reader question: How can a coding agent use generated tests as feedback without letting the repair agent rewrite or overfit its own evidence?
- Why this belongs in the selected track: It treats test generation, verification, repair, and official evaluation as separate roles in an agent harness.
- Gap it fills: Existing agent-evaluation papers often score the final patch; ExecCritic makes evidence independence and fail-closed execution part of the evaluation protocol.
- Why now: The paper was submitted during this scan and reports both strong gains from reliable test feedback and regressions from weak generated tests.

## Claim map

- Problem: Generated tests can provide useful behavioral feedback, but a bad test can steer repair toward an incomplete or incorrect interpretation of an issue.
- Main claim: A separate Test agent, an isolated fail-closed harness, and a Repair agent that receives bounded feedback can improve coding-agent repair under the evaluated conditions.
- Method: Generate one qualified test bundle per issue, require it to fail on Base and pass on Gold, keep it fixed during repair, distinguish behavioral failure from operational invalidity, and retain the official evaluator as final authority.
- What is genuinely new: The independence boundary is enforced operationally: the Repair trajectory cannot modify the generated evidence, while Base-to-Gold qualification measures whether the test discriminates behavior rather than merely executing.

## Evidence audit

- Datasets: SWE-bench Verified is used for the main reported evaluation; test training uses SWE-ReBench trajectories.
- Benchmarks and metrics: Base-to-Gold test success, resolved rate, feedback gain, and repair turns; reported averages use three Repair runs with fixed generated bundles per issue.
- Baselines: No-test repair, Oracle F2P feedback, Qwen-generated tests, GPT-5.6-sol-generated tests, and separately trained versus base Qwen Repair policies.
- Strongest results: GPT-5.6 feedback raises SWE-bench Verified from 81.5% to 85.7% for the off-the-shelf comparison; the trained Qwen Test policy reaches 62.2% Base-to-Gold success; the composed trained Test–Repair pair reaches 72.6%, 11.4 points above the original no-test Qwen Repair baseline.
- Ablations: SFT versus RL for Test reliability, feedback-source swaps, trained versus base Repair, and fixed-test revision behavior.
- Statistical uncertainty: Three Repair runs are reported, but no confidence intervals or significance tests were located in the inspected paper sections.
- Threats to validity: SWE-bench scope, one generated bundle per issue, model/source dependence, resource cost, and the gap between local forwarding and official correctness constrain generalization.

## Reproducibility

- Available artifacts and licenses: The authors link a public GitHub repository and describe configuration, harness, prompts, and execution contracts; the exact release/license boundary and model-weight availability require a reproduction audit.
- Environment or compute requirements: Separate Test and Repair training uses Qwen-3.5-35B-A3B with multi-GPU SGLang rollouts; the paper reports 8-GPU, single-node training settings and bounded repository sandboxes.
- Smallest useful reproduction: Run the public harness on a small SWE-bench Verified slice with one fixed Test bundle, record Base/Gold qualification, classify operational invalidity separately, and compare no-test against reliable/weak feedback sources.
- Blocking unknowns: Artifact version pinning, model endpoint/weights, full training data access, exact cost and time, multi-seed stability, and replication outside SWE-bench.

## Critical reading

- Strongest result: The paper demonstrates that feedback quality is a first-class variable: the same Repair policy improves with GPT-5.6-generated tests but degrades with weaker Qwen-generated tests.
- Weakest assumption: Base-to-Gold success is treated as useful evidence of test validity, but a test that distinguishes the benchmark's Gold patch may still miss alternate correct behaviors or overfit the issue's known fix.
- Stated limitations: Separate policies are not jointly trained; the framework uses a single fixed test bundle; future work includes multi-check harnesses, stronger Test agents, and lower cost/latency.
- Claims not supported by the evidence: The results do not prove that generated tests are reliable in general, that local passes predict production correctness, or that the two-role architecture is optimal outside the evaluated coding benchmark.

## Bloss0m connection

- Related series areas: `agent-evaluation`, coding-agent harnesses, deployment-realism evaluation, and tool-use reliability.
- Related candidates: Evaluation Realism/Deployment Scaffolds, HarnessDev, EarlyEval, Terminal-Universe, AgentJudgeBench, and RefactorPlatform.
- Duplication risk: Medium; differentiate by centering the evidence-independence boundary and the harmful-feedback result rather than another aggregate coding score.
- Suggested internal links: `43-enterprise-ai-agent-security`, `89-ai-powered-software-development-environments`, and the agent-evaluation reading path.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 5 evidence quality + 4 reproducibility + 5 engineering value + 5 series value = 29. Public code, explicit harness contracts, and a strong negative result justify a deep read, while artifact/version and replication boundaries remain open.
- Open questions requiring human approval: Confirm the repository's reproducible release and licenses; decide whether the article should teach evidence independence as a harness pattern or focus on the test-quality bottleneck; require a clear separation between local acceptance and official correctness.

