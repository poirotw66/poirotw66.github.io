---
stableId: "arxiv:2609.02095"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-03
lastVerifiedAt: 2026-09-03
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
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

# READY：企業 Agent 的問題不是能不能做，而是在什麼監督成本下可以可靠部署

## Identity

- Search window: strict 72-hour scan from 2026-08-31 00:32Z to 2026-09-03 00:32Z.
- Canonical URL: https://arxiv.org/abs/2609.02095
- Authors: Veronica Chatrath, Bryan Zhu, Jingxuan Fan, George Pu, Soham Dinesh Tiwari, Soham Dan, Ryan Young, Yuan Li, Yuang Yao, Apaar Shanker, Minglai Yang, Daniel Yue Zhang, Yunzhong He, Ying Liu, Chenguang Wang, Zhijun Yin, and Yuan Xue; primarily Scale AI with UC Santa Cruz and Vanderbilt University Medical Center.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-02; CC BY 4.0 HTML version available.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.02095
- Implementation context: The paper describes an open testbed implemented on Inspect and an Inspect-Harbor adapter; a direct READY repository URL was not located in the verified primary source.

## Editorial fit

- Reader question: How should an enterprise decide whether an agent is deployable when a human can review some cases, reliability has a target, and every review has a cost?
- Why this belongs in the selected track: READY makes deployment qualification a separate layer above task execution, with workflow-specific success semantics, policy optimization, and held-out statistical qualification.
- Gap it fills: Agent evaluation—connecting autonomous accuracy to reliability, human oversight burden, operating cost, and tail-risk assumptions.
- Why now: Leaderboards usually collapse deployment into one success number; READY demonstrates that nearly tied autonomous accuracy can imply very different review policies and operating points.

## Claim map

- Problem: An agent can perform well autonomously yet be unsuitable for deployment if failures are hard to detect, expensive to review, or too risky for the workflow.
- Main claim: Given an agent, workflow, candidate oversight policies, and a reliability target, READY can choose the minimum-cost policy and statistically qualify it on held-out cases.
- Method: Define workflow-specific success and evidence semantics, execute agents and oversight policies, estimate reliability and cost, optimize a policy on development data, freeze it, and evaluate the selected operating point on held-out qualification data with confidence bounds.
- What is genuinely new: Deployment is characterized as a reliability–oversight–cost profile rather than a property of the agent alone.

## Evidence audit

- Case study: Retrospective clinical-audit workflow on CliniCARE-Bench, 16 agent systems and 750 cases. The agent must identify evidence, apply a clinical standard, and return a verdict; deployment adds accept-or-escalate decisions.
- Main result: Two systems with 72.8% and 72.5% autonomous accuracy require 39.2% and 29.6% human review to qualify at the same 76% reliability target under the evaluated oversight policy.
- Controls and methodology: READY separates workflow evaluation, policy optimization, and deployment qualification; thresholds are selected on development data and frozen before held-out qualification. The paper includes process-aware success, sensitivity to human-review assumptions, tail-risk definitions, and complete per-system tables.
- Statistical uncertainty: The method reports held-out lower confidence bounds and warns that tail estimates are weak when the relevant qualification tail has few observations; insufficient evidence is a valid outcome rather than a relaxed threshold.
- Threats to validity: The empirical setting is terminal accept-or-escalate; trajectory-dependent intervention, reviewer success, latency, and cost are partly assumptions. The result applies to a versioned workflow population and does not certify an agent universally.

## Reproducibility

- Available artifacts: Full HTML paper, formal definitions, Inspect mapping, evaluation protocol, workflow semantics, and supplementary held-out analyses. The source describes an open testbed, but a direct public READY repository was not located in the verified source set.
- Environment or compute requirements: Inspect-based agent evaluation, CliniCARE-Bench or a replacement workflow, executable evaluators, oversight policy simulation, and enough held-out cases to estimate lower bounds.
- Smallest useful reproduction: Use a small workflow with a deterministic success predicate, compare autonomous-only versus accept-or-escalate policies, choose a threshold on development cases, freeze it, and report held-out reliability, review fraction, and assumed reviewer cost separately.
- Blocking unknowns: Direct code availability, exact CliniCARE data access, sensitivity to workflow distribution shift, and how to measure reviewer latency and correction quality in real operations.

## Critical reading

- Strongest result: READY changes the decision variable from an agent score to an operating policy and shows the distinction empirically in a 16-system clinical-audit comparison.
- Weakest assumption: Review success, review cost, and the routing signal can be modeled well enough for qualification; the paper explicitly makes these deployment assumptions visible rather than eliminating them.
- Unsupported leap: A qualified policy on CliniCARE-Bench does not establish clinical safety, legal compliance, or robustness for another enterprise workflow.

## Bloss0m connection

- Related routes: agent evaluation, human-in-the-loop systems, cost-aware routing, reliability qualification, and provenance contracts.
- Duplication risk: Low; existing candidates emphasize agent failure diagnosis or benchmark capability, while READY focuses on deployment operating points.
- Suggested internal links: Pair with EDGE for failure attribution and with Jamf Tokenomics for the separate but related question of enforcing operating budgets.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: clear enterprise consequence, formal objective, held-out qualification, explicit uncertainty, and a strong counterexample to leaderboard-only thinking. Reproducibility is 3/5 because the testbed is described as open but its direct repository and dataset access were not verified.
- Open questions requiring human approval: Which oversight policies are realistic outside terminal review? How should review latency, correction quality, tail risk, and changing workflow populations enter the deployment contract?

