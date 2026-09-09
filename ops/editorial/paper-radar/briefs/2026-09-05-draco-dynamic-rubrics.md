---
stableId: "arxiv:2609.04094"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-05
lastVerifiedAt: 2026-09-05
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "deep-read-candidate"
---

# DRACO：沒有 ground-truth verifier 時，如何把整條 Agent trajectory 的分數分配回每一步

## Identity

- Search window: strict 72-hour scan from 2026-09-02 00:31Z to 2026-09-05 00:31Z.
- Canonical URL: https://arxiv.org/abs/2609.04094
- Authors: Shubham Gandhi, Saurabh Goyal, Kiran Kate, and Yara Rizk; Carnegie Mellon University and IBM Research.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-03; full HTML version available.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.04094
- Code: https://github.com/IBM/draco

## Editorial fit

- Reader question: When an agent has dozens of tool calls but only a trajectory-level rubric score, how can training identify which steps helped or hurt?
- Why this belongs in the selected track: DRACO supplies dynamic rubric criteria and a closed-form step-credit allocation without requiring a trained attribution model or ground-truth verifier.
- Gap it fills: Tool-use reliability—fine-grained credit assignment for long-horizon agents in domains where success is difficult to check programmatically.
- Why now: Customer-support, research, and tool-use agents often have outcome-blind or delayed feedback. A single scalar for a whole trajectory can reward lucky or redundant actions and punish correct steps inside a failed run.

## Claim map

- Problem: Verifiable-reward training works when a programmatic checker exists, but many long-horizon agent tasks have no ground-truth success signal and a single trajectory score is too coarse.
- Main claim: Dynamic rubrics can judge what matters in each rollout, and a closed-form redistribution of the trajectory advantage can improve GRPO training by concentrating credit on implicated steps.
- Method: Generate rubric criteria from the task and sampled trajectories, merge and deduplicate the criteria, score completed trajectories, map criterion verdicts to responsible steps, and redistribute the GRPO advantage while conserving the total trajectory-level push.
- What is genuinely new: The paper combines task-adaptive criteria with step-level credit assignment while avoiding a separate learned attribution network.

## Evidence audit

- Main results: On AppWorld, DRACO improves 15.9 points over the base model and 5.3 points over GRPO trained with a sparse ground-truth reward. On out-of-domain tau-bench, it improves 5.3 points over the base model without a frontier judge.
- Method controls: The full HTML derives conservation, sign preservation, monotone correctness, length independence, reward-scale invariance, and winner/loser symmetry properties for the redistribution formula. It includes a worked logged-rollout example and ablations for rubric generation, scoring, and step attribution.
- Generalization: The tau-bench result tests transfer beyond AppWorld and reports that DRACO beats both ground-truth-reward training and other rubric-based settings under the tested configuration.
- Artifact: IBM publishes the DRACO code, prompts, configuration details, and evaluation-oriented appendices, making this the most directly runnable candidate in today’s new paper set.
- Statistical uncertainty: The paper reports benchmark gains and ablations but not a broad independent replication, confidence intervals for every headline comparison, or a production-cost study.
- Threats to validity: Dynamic rubrics and LLM judgments can inherit bias, step attribution depends on whether the rubric correctly names responsible actions, and the method may collapse to weak signal when all rollouts are uniformly good or bad.

## Reproducibility

- Available artifacts: Full HTML paper, MIT-licensed or publicly linked IBM/draco code, algorithm details, prompts, configuration appendices, and worked examples.
- Environment or compute requirements: AppWorld and tau-bench environments, Qwen2.5-32B-class serving configuration described in the appendix, GRPO training, and judge calls for rubric generation and scoring.
- Smallest useful reproduction: Run the code on a small AppWorld slice, compare sparse trajectory reward with DRACO under the same rollout budget, and inspect whether the redistributed step advantages identify tool calls that a human can independently label as causally useful.
- Blocking unknowns: Exact current repository parity with the arXiv v1 paper, compute and judge cost at scale, sensitivity to rubric prompt changes, and performance when task outcomes are noisy or rubrics cannot localize responsibility.

## Critical reading

- Strongest result: DRACO offers algebraic guarantees about the redistribution while showing out-of-domain improvement, so the method is more than an intuitive reward-shaping heuristic.
- Weakest assumption: A rubric-generated description can reliably identify the steps responsible for a criterion, especially when actions have delayed or interacting effects.
- Unsupported leap: Better training scores do not prove causal credit assignment is correct. The paper does not establish reliability on arbitrary long-horizon domains or eliminate judge bias.

## Bloss0m connection

- Related routes: tool-use reliability, agent evaluation, process supervision, dynamic rubrics, and long-horizon training.
- Duplication risk: Medium with Toolformer, ReAct, and recent tool-use papers, but DRACO addresses the post-training credit signal rather than tool selection alone.
- Suggested internal links: Pair with MidTool for tool-use training placement, Harness-of-Harness for continual coding feedback, and EDGE for diagnosing multi-agent errors.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30: strong priority-gap fit, a clean method, formal properties, AppWorld plus out-of-domain evidence, and public code. Evidence quality is capped because the headline gains remain first-party benchmark results without broad independent replication or a cost analysis.
- Open questions requiring human approval: Can human-labeled causal steps validate the rubric attribution? What is the failure mode when tool effects are delayed, coupled, or only visible after the final answer?

