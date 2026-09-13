---
stableId: "url:https://platform.claude.com/docs/en/release-notes/overview"
status: "durable-post-candidate"
firstSeenAt: 2026-08-11
lastVerifiedAt: 2026-08-24
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 4
  total: 24
decision: "durable-post-candidate"
---

# Claude Managed Agents: budgets, advisors, and hooks for a governed runtime

## Identity

- Search window: 2026-08-23 08:31–2026-08-24 08:31 Asia/Taipei; seven-day backfill from 2026-08-17.
- Discovery queries: Claude Platform release notes August 2026; Managed Agents computer use Files API Agent Skills; web search domain allow block; SDK breaking changes.
- Canonical URL: https://platform.claude.com/docs/en/release-notes/overview
- Publisher or author: Anthropic / Claude Platform Docs.
- Published or updated date: 2026-08-20 for the newest SDK entry and 2026-08-19 for computer use, Files API, Agent Skills, Managed Agent web-search controls, and related platform updates; the same release page retains the 2026-08-07 Managed Agents controls and 2026-08-05 inference hooks.
- Source type: release-notes / official documentation.
- Direct supporting sources: https://platform.claude.com/docs/en/managed-agents/budgets; https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration; https://platform.claude.com/docs/en/manage-claude/inference-hooks; https://platform.claude.com/docs/en/managed-agents/github.

## Editorial fit

- Why now: Anthropic's Managed Agents surface is adding runtime controls while the platform release notes also move computer use, Files API, Agent Skills, and web-search domain policy toward broader availability. The update makes the boundary between product capability and governed runtime state more concrete.
- Reader question: What does an agent platform need to expose before a long-running or multi-agent workflow can be operated as a governed production service?
- Category and topic cluster: Cloud & Platform; `ai-platform-governance`.
- Existing coverage and duplication risk: Follow-up to `83-anthropic-memory-and-dreaming` and `39-enterprise-agentic-ai-governance`. The existing Anthropic article focuses on memory and dreaming; this candidate focuses on runtime budgets, delegation, policy hooks, and data locality. Duplication risk is medium.
- Why this remains useful after the current news cycle: Hard budget semantics, shared multi-agent accounting, version pinning, policy interception, and data-residency choices are durable operational design questions.

## Claim map

- Primary claim: Anthropic's Managed Agents documentation now exposes a governance-oriented runtime contract rather than only an agent execution API.
- Measured evidence: A session budget is a hard public-list-price ceiling enforced between model requests; an in-flight request may overshoot by one request and the session pauses with `budget_reached`. Multi-agent threads share one session budget, advisor consultations count against it, and roster entries can pin agent versions. Inference hooks hold governed prompts for an allow/deny verdict, with signed requests, configurable failure handling, and denial records in the Activity Feed. The 2026-08-19 and 2026-08-20 release-note entries additionally list computer use GA, browser use, Files API GA, Agent Skills/Skills API GA, Managed Agent web-search domain controls, and SDK breaking changes.
- Vendor or author claims requiring qualification: Anthropic presents these controls as platform behavior and beta/preview capabilities where noted. The docs do not establish independent cost accuracy, policy bypass resistance, or general production availability across regions and plans.
- Bloss0m engineering consequence: Agent platforms should make spend, delegation, version, locality, skills provenance, and policy decisions first-class observable state; otherwise an agent trace cannot explain why work ran, stopped, or was denied.

## Evidence audit

- Primary evidence inspected: Anthropic release notes for 2026-08-20, 2026-08-19, 2026-08-07, and 2026-08-05; session budget reference; multi-agent orchestration reference; inference hooks reference; GitHub and skills documentation links.
- Baseline or comparison: The documented additions move common guardrails from prompts or wrapper code into session and organization-level runtime controls: spend caps, advisor routing, geographic inference selection, repository skills, and pre-inference policy checks.
- Missing evidence: Independent verification of enforcement under network or provider failure, total cost behavior with all supported tools, production incident data, regional availability, and customer-specific billing behavior are unknown.
- Conflicts or uncertainty: Budgets use public list prices rather than negotiated contract prices and pause between requests, not mid-request. Managed Agents beta headers, model compatibility, and inference-hook failure semantics must be checked for the target deployment. Release-note availability labels do not establish uniform regional or plan coverage.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: "The production agent runtime is becoming a control plane: budget, delegate, locate, load, and intercept."
- Internal routes: `83-anthropic-memory-and-dreaming`; `39-enterprise-agentic-ai-governance`; `43-enterprise-ai-agent-security`; `ai-platform-governance` cluster.
- Human decision required: Decide whether to publish a platform-neutral control-plane analysis with Anthropic as the concrete case, or a narrower Managed Agents update. Preserve the distinction between documented feature semantics, beta availability, and Bloss0m's architecture inference.

## Update history

- 2026-08-24: Re-verified the canonical release-notes page. The candidate remains `durable-post-candidate` at 24/25; no status or score change. Added the dated 2026-08-19/20 release-note changes as context, while keeping availability and independent enforcement unknown.
