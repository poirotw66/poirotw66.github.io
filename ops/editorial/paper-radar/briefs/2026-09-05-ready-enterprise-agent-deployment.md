---
stableId: "arxiv:2609.02095"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-05
lastVerifiedAt: 2026-09-05
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 27
decision: "deep-read-candidate"
---

# READY or Not: Reliable Enterprise Agent Deployment

## Identity

- Stable ID: `arxiv:2609.02095`.
- Canonical URL: https://arxiv.org/abs/2609.02095
- Authors: Veronica Chatrath, Bryan Zhu, Jingxuan Fan, George Pu, Soham Dinesh Tiwari, Soham Dan, Ryan Young, Yuan (Christy) Li, Yuang Yao, Apaar Shanker, Minglai Yang, Daniel Yue Zhang, Yunzhong He, Ying Liu, Chenguang Wang, Zhijun Yin, and Yuan Xue.
- Venue or review status: arXiv v1 submitted 2026-09-02; venue status not established in the arXiv record.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2609.02095`; no separate identifier located.
- Code / model / data: The paper describes an open testbed implemented on existing agent-evaluation infrastructure; a public runnable artifact was not located during this scan.

## Editorial fit

- Reader question: How can an enterprise qualify an agent for a workflow when reliability, human review, and operating cost matter more than autonomous benchmark accuracy?
- Why this belongs in the selected track: It fills `agent-systems` / `agent-evaluation` with a deployment qualification objective rather than another capability leaderboard.
- Gap it fills: Existing evaluation candidates measure judges, harness realism, and trace replay; READY explicitly selects and statistically qualifies a human-oversight policy.
- Why now: The paper reports a clinical-audit case with 16 systems and 750 cases where nearly equal autonomous accuracy required materially different human-review rates.

## Claim map

- Problem: A strong autonomous score does not establish a safe or economical operating point for a human–AI workflow.
- Main claim: READY preserves workflow-specific success, chooses a minimum-cost oversight policy at a target reliability, and qualifies that frozen policy on held-out cases.
- Method: Separate workflow specification, execution, evaluation, oversight-policy optimization, and held-out qualification; report reliability, review burden, cost, assumptions, and scope as a deployment profile.
- What is genuinely new: The unit of evaluation is the deployed human–AI system under an explicit policy, not the agent in isolation.

## Evidence audit

- Study design: 16 agent systems evaluated over 750 clinical-audit cases, producing 12,000 system–case runs; held-out qualification uses 375 cases in the reported table.
- Metrics: Workflow correctness, process defects, reliability lower bounds, human-review percentage, review-success assumptions, and operating-point qualification.
- Baselines: Autonomous accuracy and alternative reliability targets; the paper compares systems with similar autonomous accuracy but different qualified review burden.
- Statistical uncertainty: The paper uses development/qualification separation and one-sided confidence bounds, but review effectiveness is an assumption and the case study is one workflow.
- Threats to validity: Clinical domain, post-execution accept-or-escalate policy, stated confidence as routing signal, and lack of a located public runnable artifact limit transfer.

## Reproducibility

- Available artifacts and license: The paper documents interfaces and an Inspect-based reference realization, but no verified public code/data URL was found in the arXiv record.
- Environment or compute requirements: Reproduction needs an agent-evaluation runtime, workflow-specific data and labels, agent access, and a declared human-review model and cost.
- Smallest useful reproduction: Build a synthetic enterprise workflow with deterministic success labels, split development/qualification cases, and compare minimum-cost review policies at two reliability targets.
- Blocking unknowns: Exact implementation package, clinical data access, annotation process, cost model, and whether the qualification procedure remains stable under online or interactive intervention.

## Critical reading

- Strongest result: The 72.8% versus 72.5% autonomous-accuracy comparison hides a 39.2% versus 29.6% human-review difference at the same 76% reliability target.
- Weakest assumption: A declared review-success rate and terminal confidence signal can stand in for the operational behavior of real human review.
- Stated limitations: The paper limits its claims to workflow-specific qualification and does not present a universal deployment certificate.
- Claims not supported by the evidence: READY does not prove that a qualified system is safe outside the evaluated workflow, policy class, human assumption, and data distribution.

## Bloss0m connection

- Related Traditional Chinese routes: `64-ai-agent-guide`, `85-trec-rag-2026-rag-evaluation-harness`, `08-osreward-agent-evaluation`, and AgentCore Evaluations.
- Related English routes: selective prediction, learning-to-defer, operational reliability, and AI release gates.
- Duplication risk: Medium; differentiate from judge/harness papers by focusing on deployment qualification and human-cost trade-offs.
- Suggested internal links: `agent-evaluation`, `ai-platform-governance`, `64-ai-agent-guide`, and the AgentCore Evaluations candidate.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 4 evidence quality + 3 reproducibility + 5 engineering value + 5 series value = 27. The objective and case-study evidence are strong, but the missing verified artifact and workflow-specific human assumptions require careful qualification.
- Open questions requiring human approval: Decide whether to reproduce the qualification loop on a non-clinical workflow and whether the eventual article should emphasize evaluation design, economics, or human oversight.

