---
stableId: "url:https://arxiv.org/abs/2610.06193"
status: "durable-post-candidate"
firstSeenAt: 2026-10-08
lastVerifiedAt: 2026-10-08
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 24
decision: "write-now"
---

# Correct Code, Broken Contributions? SWE-CC: Benchmarking Repository Policy Compliance for Coding Agents

## Identity

- Search window: 2026-10-05 to 2026-10-08; primary source submitted 2026-10-05.
- Discovery queries: `AI agent incident failure postmortem October 2026`; `AI coding agent benchmark evaluation paper arXiv October 2026`; `site:arxiv.org coding agent repository policy compliance`.
- Canonical URL: https://arxiv.org/abs/2610.06193
- Publisher or author: Hai Dang Truong, Rayner Goh, Thanh Le-Cong, and Yintong Huo; Singapore Management University and Singapore University of Technology and Design.
- Published or updated date: 2026-10-05 (arXiv v1).
- Source type: research-lab.
- Direct supporting sources: [full paper](https://arxiv.org/html/2610.06193v1); [benchmark and result artifacts](https://github.com/dangtruong01/swe-cc-arxiv).

## Editorial fit

- Why now: Fresh results expose a gap between benchmark success and the repository rules that determine whether a contribution is acceptable to maintainers.
- Reader question: If an agent's patch passes tests, can its earlier workflow still violate project rules?
- Story hook: In the authors' 500-task evaluation, agents violated 43.1% of applicable policies despite often resolving the coding task; nearly half of violations happened during intermediate execution.
- Category and topic cluster: AI Engineering / ai-agent.
- Existing coverage and duplication risk: No matching source ID, URL, bilingual draft, or content entry was found. Existing agent-governance articles are adjacent, but this paper evaluates repository-specific policies and intermediate agent actions.
- Why this remains useful after the news cycle: Maintainer rules, test workflows, and review requirements remain part of software contribution quality as agents take on more repository work.

## Claim map

- Primary claim: Functional issue resolution does not guarantee compliance with repository contribution policies.
- Measured evidence: Four models, two agent scaffolds, two policy-provision settings, 500 tasks, and 823 machine-checkable policies. The paper reports 43.1% applicable-policy violations and places nearly half of violations in intermediate execution.
- Vendor or author claims requiring qualification: These are author-run results on selected repositories and policies. The public repo contains aggregate exports but not all original trajectories or independent checker-audit ratings.
- Bloss0m engineering consequence: Evaluate policy retrieval, intermediate tool use, and final artifacts alongside functional tests; include deterministic project-specific checks where possible.

## Evidence audit

- Primary evidence inspected: arXiv v1 abstract, benchmark design, experimental comparison, limitations, reproducibility note, and GitHub README/data inventory.
- Baseline or comparison: mini-SWE-agent and OpenHands; native policy discovery versus consolidated policy text; four models.
- Missing evidence: No independent rerun; 8,000 complete historical trajectories and external checker-audit ratings are not published in the repository.
- Conflicts or uncertainty: Applicable-policy denominators depend on the task and checker triggers; the result is not a universal production violation rate.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “Tests pass; the contribution still breaks project rules.” Show how the benchmark audits both the final patch and the steps that produced it, and why a single resolve rate hides maintainability and workflow failures.
- Internal routes: Link to existing agent evaluation and repository governance coverage after route-level duplication review.
- Human decision required: Approve the bilingual drafting topic; preserve the paper's selected-sample boundary and missing-trajectory caveat.
