---
stableId: "arxiv:2609.02786"
sourceVersion: "v1"
status: "shortlist"
firstSeenAt: 2026-09-03
lastVerifiedAt: 2026-09-03
primaryTrack: "agent-systems"
primaryGap: "agent-security"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 4
  total: 27
decision: "shortlist"
---

# SafeEvolve：讓 Agent 的 harness 與 policy 一起演化，但每次變更都要可回溯、可驗證

## Identity

- Search window: strict 72-hour scan from 2026-08-31 00:32Z to 2026-09-03 00:32Z.
- Canonical URL: https://arxiv.org/abs/2609.02786
- Authors: Qinghua Mao, Wanying Qu, Dadi Guo, Leitao Yuan, Qingyu Liu, Yu Li, Guanxu Chen, Yanwei Fu, Xi Lin, Xia Hu, and Dongrui Liu; Shanghai AI Laboratory, SJTU, Fudan University, HKUST, and Zhejiang University.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-02.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.02786
- Code: https://github.com/MaoPopovich/SafeEvolve

## Editorial fit

- Reader question: When an agent learns from its own trajectories, how can runtime safeguards and learned policy improve together without allowing unsafe behavior to become permanent?
- Why this belongs in the selected track: SafeEvolve treats the base policy and the external harness as a coupled system and feeds safety experience into both bounded harness updates and policy optimization.
- Gap it fills: Agent security—bringing auditability, reversibility, verifier gates, and safety regression budgets into continual agent improvement.
- Why now: Self-improving agents are beginning to write skills, prompts, and reusable procedures; this paper makes the update boundary explicit instead of evaluating only the final answer.

## Claim map

- Problem: External harness updates can control runtime behavior but do not internalize safety, while policy optimization can improve intrinsic behavior without controlling the execution scaffolding.
- Main claim: A continual harness-policy co-evolution loop can improve safety-utility trade-offs by turning on-policy safety evidence into bounded component updates and verifier-decomposed SFT/RL signals.
- Method: Collect completed trajectories, decompose utility and safety with rule-based verifiers, update policy with harness-augmented SFT and GRPO, propose one bounded harness mutation at a time, evaluate old and candidate harnesses on a fixed panel, and publish only if the candidate clears a utility margin and a governance gate.
- What is genuinely new: The paper treats prompts and hierarchical skills as versioned, reversible harness artifacts while training the model to actively use those evolved artifacts.

## Evidence audit

- Benchmarks: AgentDojo, AgentDyn, and AgentHarm with two Qwen backbones. Metrics include utility, injection-attack success rate, harmful compliance, refusal, and benign performance.
- Reported results: For Qwen3.5-4B, SafeEvolve reduces AgentDojo ASR to 0.79 while maintaining 61.86 utility; on AgentHarm it reports 12.27 harmful compliance, 83.83 refusal, and 71.31 benign performance. On Qwen3-4B-Instruct-2507, it reports 2.42 AgentDojo ASR, 25.00 AgentDyn utility, and 15.47 harmful compliance.
- Baselines: Base, SFT, DPO, GRPO, MetaSecAlign, and AgentAlign are compared. The paper reports that generic post-training baselines can reduce some attack metrics but may damage tool-use or benign utility more sharply.
- Controls and gates: Rule-based trajectory verifiers separate utility, safety, and joint utility-safety; candidate harnesses are compared with a fixed policy on a fixed evolution panel before publication.
- Statistical uncertainty: The verified paper reports benchmark tables and ablations but no broad independent replication or confidence intervals for the main comparisons.
- Threats to validity: Safety labels, verifier rules, model families, evolution schedule, and harness components are co-designed. Results do not establish robustness to unseen attack families, other agent runtimes, or long-lived production skill libraries.

## Reproducibility

- Available artifacts: Public SafeEvolve repository link, algorithm pseudocode, benchmark descriptions, prompts, baselines, evolution details, and compute appendix.
- Environment or compute requirements: AgentDojo/AgentDyn/AgentHarm environments, Qwen model access, on-policy rollouts, and repeated SFT/GRPO training; exact compute budget and environment setup require repository inspection.
- Smallest useful reproduction: Run one AgentDojo injection task with a fixed harness, collect verifier-labeled trajectories, apply a single bounded prompt or skill mutation, compare on a frozen panel, and reject any update that fails the safety floor or rollback record.
- Blocking unknowns: Exact release completeness, update frequency, seed variance, verifier brittleness, and whether a candidate can be safely rolled back after downstream skill reuse.

## Critical reading

- Strongest result: The method puts acceptance of harness mutations behind fixed-policy comparison and explicit safety/utility verifiers, making the evolution loop inspectable and reversible.
- Weakest assumption: Rule-based verifiers and selected benchmarks may not capture subtle harmful behaviors or safety regressions that appear only after long-horizon composition.
- Unsupported leap: A better benchmark safety-utility table is not proof that unrestricted self-modification is safe; the non-evolvable anchors, sandboxing, and human oversight remain essential.

## Bloss0m connection

- Related routes: agent security, policy gates, skill governance, tool-use reliability, and provenance contracts.
- Duplication risk: Medium with prior agent-governance candidates, but this paper focuses on continual learning and reversible harness evolution rather than static permission control.
- Suggested internal links: Contrast with the site's governance and trust-gate candidates; use its fixed-panel accept/reject loop as a concrete provenance-contract example.

## Recommendation

- Output level: Shortlist.
- Score rationale: 27/30: strong security fit, public code, multiple safety benchmarks, and an actionable co-evolution protocol. Evidence and series value are capped because the evaluation is first-party, verifier-dependent, and not yet a long-lived independent deployment study.
- Open questions requiring human approval: Which harness artifacts are allowed to evolve in production? Can every mutation carry a provenance record, rollback pointer, and non-evolvable safety anchor?

