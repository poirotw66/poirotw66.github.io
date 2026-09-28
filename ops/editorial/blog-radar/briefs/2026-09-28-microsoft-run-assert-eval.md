---
stableId: "url:https://commandline.microsoft.com/run-assert-eval-responsible-ai-agent-risk-discovery-at-runtime/"
status: "candidate"
firstSeenAt: 2026-09-28
lastVerifiedAt: 2026-09-28
primaryCategory: "AI Engineering"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 24
decision: "write-now"
---

# Introducing run-assert-eval: Find the risk, fix it, prove it

## Identity

- Search window: Seven-day backfill ending 2026-09-28 (Asia/Taipei); the Microsoft article is dated 2026-09-24, outside the strict 72-hour window.
- Discovery queries: `agent runtime risk discovery evaluation enforcement Rego`; `ASSERT ACS Clarity agent evaluation`; `Microsoft run-assert-eval billing support agent example`.
- Canonical URL: https://commandline.microsoft.com/run-assert-eval-responsible-ai-agent-risk-discovery-at-runtime/
- Publisher or author: Microsoft Command Line; authored by Microsoft product, engineering, and research staff.
- Published or updated date: 2026-09-24.
- Source type: First-party engineering walkthrough.
- Direct supporting sources:
  - ASSERT evaluation harness: https://github.com/responsibleai/ASSERT
  - Agent Control Specification policy engine: https://github.com/microsoft/agent-governance-toolkit/tree/main/policy-engine
  - Clarity threat discovery: https://github.com/microsoft/clarity-agent/
  - Worked billing-support agent: https://github.com/responsibleai/ASSERT/tree/main/examples/billing_support_agent

## Editorial fit

- Why now: The workflow turns agent risk work into a lifecycle with artifacts and runtime enforcement, rather than stopping after a red-team report or a policy prompt.
- Reader question: How can a team turn an observed agent failure into a deterministic runtime control without hiding regressions behind blanket refusals?
- Story hook: A billing agent returned another customer's record in 30% of the baseline cross-customer cases; a reviewed policy reduced the scenario split from 43.8% to 0%, while the walkthrough separately measured whether legitimate requests were blocked.
- Category and topic cluster: AI Engineering / `ai-platform-governance`.
- Existing coverage and duplication risk: Adjacent to existing agent governance and safety coverage, but the discovery → evaluation → generated Rego → tool-boundary enforcement → same-suite rerun loop is distinct. Keep the post about the lifecycle, not a general Microsoft responsible-AI overview.
- Why this remains useful after the current news cycle: Teams need a repeatable way to convert newly discovered failure modes into testable, reviewable controls as tools and agent behavior change.

## Claim map

- Primary claim: `run-assert-eval` connects Clarity risk discovery, ASSERT behavior-specific evaluation, and ACS policies applied at runtime interception points.
- Measured evidence: The post's billing example starts with a 30.0% impermissible-behavior violation rate for cross-customer exposure. After an ACS policy checks `account_id` at `pre_tool_call`, the cross-customer prompt split changes from 20.8% to 8.7% and the scenario split from 43.8% to 0.0%. The corresponding permissible-behavior violation rates fall from 9.5% to 0.0% and from 8.0% to 0.0%; these are separate test splits, not one pooled denominator.
- Vendor or author claims requiring qualification: Microsoft reports the example and the earlier 80–90% automated-judge/human agreement figures. This is not an independent evaluation, and a single worked billing agent does not establish effectiveness across production agents.
- Bloss0m engineering consequence: Keep unsafe-behavior and over-refusal metrics separate; version the generated policy and manifest; review the selected enforcement hook; then rerun a frozen test set with the same judge.

## Evidence audit

- Primary evidence inspected: Dated Microsoft walkthrough, ASSERT public repository, ACS policy-engine repository, Clarity repository, and the billing-support worked example.
- Baseline or comparison: Same billing agent and risk suite before and after a deterministic `pre_tool_call` account check. The post also describes seven worked domains and fourteen risk suites in the ASSERT repository.
- Missing evidence: Independent rerun, production workload, larger externally sourced test population, operational latency/cost, and judge calibration for this exact before/after example. The linked ACS repository describes its runtime specification as Draft/Public Preview and the pinned crate as pre-1.0 alpha; this is an inspectable artifact, not evidence of production certification.
- Conflicts or uncertainty: The article's figures are vendor-reported. Its split-specific rates should not be combined or described as a universal reduction. The older human-agreement result is not a measurement of the billing example itself. The repository status was checked on 2026-09-28 and may change independently of the article.

## Recommended treatment

- Output level: write-now; durable-post-candidate, not a publication promise.
- Proposed angle: “From discovered risk to a runtime gate: the agent-safety loop that tests both data leaks and over-refusal.” Walk through what Clarity, ASSERT, and ACS each contribute, then show why policy generation still requires human review.
- Internal routes: Agent governance, tool authorization, agent evaluation, and workflow reliability.
- Human decision required: Approve the topic before writing; preserve the vendor-study caveat and the separate denominators.
