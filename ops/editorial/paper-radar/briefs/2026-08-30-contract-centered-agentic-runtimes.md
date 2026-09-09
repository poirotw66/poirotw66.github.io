---
stableId: "arxiv:2608.27086"
sourceVersion: "v1"
status: "shortlist"
firstSeenAt: 2026-08-30
lastVerifiedAt: 2026-08-30
primaryTrack: "agent-systems"
primaryGap: "multi-agent-coordination"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 1
  reproducibility: 1
  engineeringValue: 5
  seriesValue: 5
  total: 22
decision: "shortlist"
---

# A Contract-Centered Architecture for Scalable and Manageable Agentic Runtimes

## Identity

- Canonical URL: https://arxiv.org/abs/2608.27086
- Authors: Yaxiao Liu, Pengbo Liu, Yiwen Liu, Yihua Guan, Zhenghe Hou, Jiaxing Song
- Venue or review status: arXiv preprint, v1; submitted 2026-08-27
- DOI / OpenReview / arXiv aliases: arXiv:2608.27086
- Code / model / data: None reported; the paper explicitly reports no completed implementation, experiment, dataset, or measured result.

## Editorial fit

- Reader question: How can an enterprise change an agent’s skill, model, runtime, capacity, and data without losing ownership, evidence, or operational control?
- Why this belongs in the selected track: It names four responsibility objects—Skill, Harness, Scaffold, and an external data substrate—and turns them into an organizational and runtime contract rather than treating an agent as a single opaque application.
- Gap it fills: `multi-agent-coordination`, especially ownership and admission boundaries across teams. It also complements `agent-evaluation` by proposing how a deployment experiment should be designed before results exist.
- Why now: It is a fresh architecture proposal that directly addresses the operational gap between one-agent benchmark scores and enterprise lifecycle management.

## Claim map

- Problem: Enterprise agent deployment spans business units, application teams, AI platform teams, testing, infrastructure, security, operations, and data governance, but current benchmarks do not show who may change which part or how changes should be evidenced.
- Main claim: A contract-centered runtime can separate capability, execution governance, capacity/NFR ownership, and data semantics, then test a bounded hypothesis called P1: changing activated capability preserves the capacity interaction, while changing compatible Scaffold capacity preserves capability semantics within declared margins and control budgets.
- Method: Define six design conditions as measurable obligations, then propose a cluster-period randomized crossover experiment with balanced order, reset/washout, repeated seeds and failure regimes, cluster-aware uncertainty, and four verdicts: supported, falsified, conditional-engineering, or inconclusive.
- What is genuinely new: The paper’s contribution is the responsibility-object decomposition plus a falsifiable measurement protocol. It is not an empirical demonstration that the proposed architecture improves cost, reliability, or agent quality.

## Evidence audit

- Datasets: None.
- Benchmarks and metrics: None completed. The paper specifies an experiment protocol and an equivalence/non-inferiority framing, but does not report benchmark scores.
- Baselines: No completed baseline comparison.
- Ablations: None completed; the six design conditions are proposed obligations, not measured ablations.
- Statistical uncertainty: The protocol calls for cluster-aware uncertainty, repeated seeds, and failure regimes, but no intervals or sample-size result are reported.
- Threats to validity: The central hypothesis may be difficult to operationalize across heterogeneous enterprise systems; “capability semantics,” “compatible capacity,” and control budgets require precise measurement contracts before falsification is possible.

## Reproducibility

- Available artifacts and licenses: No code, model, dataset, or configuration artifact was confirmed from the arXiv record.
- Environment or compute requirements: Unknown because no implementation is provided.
- Smallest useful reproduction: Translate the four objects into a toy multi-agent service with a versioned skill, a harness, a capacity-limited scaffold, and an external data store; pre-register the six obligations and run the proposed crossover over repeated seeds. This is a new engineering experiment, not a reproduction of reported results.
- Blocking unknowns: Exact operational definitions, treatment assignments, sample-size/power analysis, instrumentation schema, and how to measure semantic non-inferiority are unspecified.

## Critical reading

- Strongest result: The paper provides a useful vocabulary and a falsifiable shape for an enterprise runtime experiment, including explicit “inconclusive” and “conditional-engineering” outcomes.
- Weakest assumption: It assumes the organization can isolate capability and capacity changes cleanly enough for the proposed separability hypothesis to be meaningful; the paper offers no implementation evidence that this isolation is practical.
- Stated limitations: The paper is a design proposal and reports no completed implementation, experiment, dataset, or measured result.
- Claims not supported by the evidence: It does not establish scalability, lower cost, improved reliability, or superiority over existing agent frameworks.

## Bloss0m connection

- Related Traditional Chinese routes: Search the archive at handoff time for agent governance, MCP authorization, and multi-agent evaluation routes; no route slug is invented here.
- Related English routes: Resolve paired routes during writing.
- Duplication risk: Medium with existing Google verifiable-delegation and governance candidates, but distinct in its ownership/capacity/data separation and explicit statistical protocol.
- Suggested internal links: Existing agent-systems evaluation and governance readings after archive-aware lookup.

## Recommendation

- Output level: Shortlist
- Score rationale: 5/5 topic relevance, 5/5 novelty, 1/5 evidence quality, 1/5 reproducibility, 5/5 engineering value, and 5/5 series value = 22/30. It is valuable as a framework, but the absent implementation and results make it ineligible for Deep Read under the evidence-quality gate.
- Open questions requiring human approval: Should the site cover architecture proposals with no empirical evidence as critical reading, or wait for an implementation/pre-registration? What concrete metrics would make P1 falsifiable in a real deployment?

