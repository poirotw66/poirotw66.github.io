---
stableId: "arxiv:2609.16541"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-17
lastVerifiedAt: 2026-09-17
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 4
  evidenceQuality: 4
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 4
  total: 25
decision: "deep-read-candidate"
---

# A Cyber Range Evaluation of Autonomous Network Incident Response Agents

## Identity

- Search window: strict 72-hour scan ending 2026-09-17; arXiv v1 was submitted on 2026-09-15.
- Canonical URL: https://arxiv.org/abs/2609.16541
- Full paper: https://arxiv.org/html/2609.16541
- Venue or review status: arXiv preprint in cs.CR and cs.AI; the primary record is the source version used here.
- Evaluation environment: ADS-24 cyber range with 37 virtual machines, four subnets, Wazuh/SIEM telemetry, red-team Lore, and simulated user agents.
- Public supporting artifacts: CadsLang https://doi.org/10.71775/kth.rpcde-z6r38, MAL Simulator https://doi.org/10.71775/kth.hp777-8rw38, logs https://doi.org/10.71775/kth.4mh6z-zw065, simulator extension https://doi.org/10.71775/kth.gq7cc-2ww92, and the Wazuh/MAL interface https://doi.org/10.71775/kth.enqp2-38375. The full ADS-24 and Lore setup were not verified as publicly available.

## Editorial fit

- Reader question: How do autonomous incident-response agents behave when the network, attacker, telemetry, and simulated users all change together?
- Why this belongs in the selected track: It evaluates an agent in a cyber range with environmental dynamics and operational costs instead of relying on a static command benchmark.
- Gap it fills: `agent-systems / agent-evaluation`, especially evaluation under adversary behavior, user behavior, telemetry faults, and action-cost trade-offs.
- Why now: A live-looking demo can hide brittle assumptions about successful actions, alert availability, and environment mappings. This study is useful precisely because its range design and failure notes expose those assumptions.

## Claim map

- Environment: ADS-24 models a target network with endpoints and services, Wazuh monitoring, a Lore red team, and simulated users that introduce benign activity and noise.
- Agents and training: RL policies are trained in the MAL simulator with a Vejde graph-neural-network policy and then evaluated in the target network; a heuristic policy is the comparison baseline.
- Evaluation scale: The study reports 134 episodes over approximately one month, with roughly 30 episodes per agent type.
- Main result: RL policies are more efficient overall than the heuristic baseline, but performance depends heavily on the adversary and simulated-user configuration.
- Policy detail: Vejde with noise has the highest overall average return and lower defense cost in the reported comparison, but it sometimes lets Lore reach the client network. Vejde has the lowest attack cost but the highest defense cost. Reported wait probabilities are 85% for Vejde, 88% for the heuristic policy, and 94% for Vejde with noise.
- Detection detail: False-alert probabilities are reported at 1.7% without simulated users and 3.3% with users; `attemptConnectToApplications` rises from 10% to 17% in the corresponding settings.

## Evidence audit

- Primary measurements: Episode outcomes, return, attack cost, defense cost, wait behavior, alert rates, and agent-type comparisons are reported from the cyber-range evaluation.
- Baseline quality: The heuristic baseline provides a useful operational comparator, but the study does not establish that it represents a strong modern SOC policy or a human analyst ceiling.
- Artifact evidence: KTH DOI packages make the simulator language, MAL components, logs, extension, and Wazuh/MAL interface inspectable. They improve auditability but do not by themselves recreate the target network and red-team implementation.
- Instrumentation limitations: One `flightlogs` host missed its Wazuh agent, which affects the scenario. Some agent actions are assumed to succeed even when the Wazuh queue can be full. The mapping for `ConnectionRule.attemptAccessNetworks` can miss a false-negative path and is effectively reported at rate 1.0 in that mapping.
- Vendor or author claims requiring qualification: “More efficient” is conditional on the tested adversary, users, simulator, reward, and cost model. It is not a general claim that autonomous IR is safer or cheaper than analysts.

## Reproducibility

- Available artifacts and licenses: The linked KTH DOI artifacts provide meaningful public components and logs. The verified paper does not make the complete ADS-24/Lore environment available as a one-command reproduction.
- Smallest useful reproduction: Re-run the MAL scenario with the published interface and logs, then vary one factor at a time: adversary policy, simulated-user activity, telemetry availability, and action success. Compare return, detection, attack cost, defense cost, and wait behavior rather than only aggregate reward.
- Blocking unknowns: Full network topology, Lore behavior, exact training seeds/checkpoints, missing-host repair, queue-overflow semantics, and the intended false-negative mapping are not all available from the public artifacts reviewed.

## Critical reading

- Strongest result: The paper treats the environment as part of the evaluation target and demonstrates that simulated users and adversary behavior materially change outcomes. The telemetry and mapping caveats also make the operational error surface visible.
- Weakest assumption: The evaluation’s action-success abstraction and incomplete telemetry may make the agent appear more reliable than a deployment with real command failures, queue pressure, and sensor outages.
- Engineering consequence: Agent-evaluation harnesses should inject telemetry loss, queue saturation, user noise, action failure, and adversary adaptation, then record whether a policy’s apparent improvement survives those perturbations.
- Claims not supported by the evidence: The result does not prove transfer to a real enterprise SOC, robustness to unseen attacks, lower total cost of ownership, or safe autonomous remediation.

## Bloss0m connection

- Related Traditional Chinese routes: [ADIAS](/paper-reading/49-adias-agent-self-improvement/), [Corrupt Plans, Clean Traces](/paper-reading/51-plan-injection-cot-monitoring/), and [When Tool Calls Succeed but Workflows Fail](/paper-reading/52-when-tool-calls-succeed-workflows-fail/).
- Related English routes: [ADIAS](/en/paper-reading/49-adias-agent-self-improvement/), [Corrupt Plans, Clean Traces](/en/paper-reading/51-plan-injection-cot-monitoring/), and [When Tool Calls Succeed but Workflows Fail](/en/paper-reading/52-when-tool-calls-succeed-workflows-fail/).
- Suggested article angle: “Agent 的評測不是多跑幾個 episode：要把攻擊者、使用者、遙測故障與成本一起放進 cyber range。”
- Duplication risk: Low-medium. Existing readings cover self-improvement, monitoring evasion, and tool-boundary failures; this candidate contributes a concrete adversarial evaluation environment and operational instrumentation critique.

## Recommendation

- Output level: Deep Read candidate; preserve the difference between public supporting artifacts and the unavailable full range.
- Score rationale: 25/30: high agent-evaluation relevance, concrete cyber-range novelty, substantial episode evidence and engineering value. Reproducibility is 3 because several important artifacts and environment details remain closed or incomplete; series value is 4 because the domain is narrower than general agent evaluation.
- Open questions requiring human approval: Can the full range be released? How do results change with real command failure and queue saturation? What is the right safety gate before an agent may perform irreversible remediation?
