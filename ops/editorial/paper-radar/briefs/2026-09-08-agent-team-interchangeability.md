---
stableId: "arxiv:2609.05279"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-08
lastVerifiedAt: 2026-09-08
primaryTrack: "agent-systems"
primaryGap: "multi-agent-coordination"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 2
  engineeringValue: 5
  seriesValue: 5
  total: 26
decision: "deep-read-candidate"
---

# Testing Interchangeability in LLM Agent Teams

## Identity

- Stable ID: `arxiv:2609.05279`.
- Canonical URL: https://arxiv.org/abs/2609.05279
- Authors: Jianxin Gao, Tianyi Yu, Linna Deng, Runze Li, and Zining Wang.
- Venue or review status: arXiv v1 submitted 2026-09-04; subjects cs.AI and cs.MA.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2609.05279`; no separate venue record located.
- Code / model / data: Full paper HTML is available at https://arxiv.org/html/2609.05279v1. No paper-specific public code or dataset repository was verified during this scan.

## Editorial fit

- Reader question: When a production multi-agent system replaces a role holder, is a role-compatible agent actually interchangeable—or does it carry private coordination conventions that make the team slower?
- Why this belongs in the selected track: It fills `agent-systems` / `multi-agent-coordination` with a controlled replacement test that separates task score from coordination cost.
- Gap it fills: Existing multi-agent work often reports aggregate success or self-play behavior; this paper measures the operational cost of a real roster change while holding model, role, and experience fixed.
- Why now: Production systems replace agents after provider changes, restarts, routing, and scaling events; the paper reports that a swap moves task score little but raises communication per unit progress by 16–63% and recovers more slowly.

## Claim map

- Problem: A role contract may hide partner-specific conventions learned through repeated interaction and stored in private notes.
- Main claim: LLM agents are more fungible in task outcome than in coordination efficiency, especially after longer formation histories and in more coupled tasks.
- Method: Independently form teams from one base model, let each role maintain task and partner notebooks across formation episodes, then compare intact, placebo, swapped, cleared-swap, amnesia, and naive-replacement conditions on held-out tasks.
- What is genuinely new: The placebo isolates the disruption of a roster announcement from the identity of the replacement, enabling a partner-specific coordination penalty rather than a generic restart effect.

## Evidence audit

- Dataset and construction: Eight independently formed teams per setting, ten formation episodes, role-matched swaps, private notebooks, held-out tasks, and Collab-Overcooked plus Hanabi settings with different coupling.
- Metrics: Task score, communication per unit progress, experience value, swap penalty, partner-specific ratio, recovery time, and protocol-signature divergence.
- Controls and ablations: Same-model/role/experience swaps, placebo reinstatement, cleared partner notes, naive replacement, base-model/temperature/team-age manipulations, and recovery curves.
- Strongest reported result: Score returns near placebo sooner than communication cost; in coupled settings the coordination premium can persist through episode ten, even when the task dashboard looks recovered.
- Threats to validity: The study is dyadic, ten episodes is short, no length-matched neutral-text control was run for notebook deletion, protocol signatures are surface features, and no public artifact was located.

## Reproducibility

- Available artifacts and licenses: Paper HTML and detailed experimental definitions are available; code, task traces, and notebooks were not verified as public.
- Environment or compute requirements: Multi-agent harnesses for Collab-Overcooked and Hanabi, persistent notebook state, repeated held-out episodes, and controlled roster-change announcements.
- Smallest useful reproduction: Implement the placebo/swap/naive matrix in one cooperative benchmark, record messages and task progress, and compare recovery curves under transferred versus cleared partner state.
- Blocking unknowns: Exact prompts and seeds, notebook serialization, full sample counts per condition, cost/token accounting, and whether the effect survives heterogeneous models, larger teams, or real tool workflows.

## Critical reading

- Strongest result: The operational warning is concrete: success-rate dashboards can declare a replacement recovered before communication overhead has returned to baseline.
- Weakest assumption: Private notebook sections cleanly separate task knowledge from partner conventions; the authors themselves note that the design may be generous to the observed effect.
- Claims not supported by the evidence: The findings do not establish a universal replacement penalty for production agents, nor that learned compatibility state is safer or better than a compact explicit protocol.

## Bloss0m connection

- Related series areas: `multi-agent-coordination`, agent memory, harness operations, and deployment reliability.
- Related candidates: Repair or Resample, Prime Agent, HarnessDev, Recuris, StarHarness, and READY.
- Duplication risk: Low to medium; differentiate by focusing on replacement compatibility and recovery cost rather than self-improvement or generic team quality.
- Suggested internal links: `18-phil-schmid-agent-harness-2026`, `10-effective-harnesses-for-long-running-agents`, and `multi-agent-coordination`.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 4 evidence quality + 2 reproducibility + 5 engineering value + 5 series value = 26. The placebo-controlled design and recovery metric are highly actionable, but no verified artifact and narrow dyadic setting require careful scope.
- Open questions requiring human approval: Require a reproduction plan with message/token/cost metrics and decide whether the reading should lead with provider failover, team scaling, or private coordination-memory design.

