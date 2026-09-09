---
stableId: "url:https://github.com/initializ/forge/releases/tag/v0.18.1"
status: "durable-post-candidate"
firstSeenAt: 2026-08-27
lastVerifiedAt: 2026-08-27
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 5
  total: 25
decision: "write-now"
---

# Forge v0.18.1: MCP auth for real multi-user agents

## Identity

- Search window: 2026-08-20 to 2026-08-27; daily frontier scan with a 7-day backfill.
- Discovery queries: `open source agent runtime MCP OAuth 2.1 release August 2026`, `Forge v0.18.1 MCP auth`.
- Canonical URL: https://github.com/initializ/forge/releases/tag/v0.18.1
- Publisher or author: initializ / Forge maintainers.
- Published date: 2026-08-20.
- Source type: Open-source GitHub release and public repository.
- Direct supporting sources: https://useforge.ai/changelog/ and https://github.com/initializ/forge

## Editorial fit

- Why now: Forge addresses the part of MCP demos that is usually hand-waved away: each user’s identity, consent, tenancy, egress, and audit trail.
- Reader question: How can one agent safely broker different users’ credentials to the same remote MCP tools?
- Category and topic cluster: AI Engineering / ai-agent.
- Existing coverage and duplication risk: Strong complement to enterprise MCP governance coverage; the article should be a code-and-protocol walkthrough, not a generic OAuth explainer.
- Why this remains useful after the current news cycle: Multi-user authorization, fail-closed approvals, and per-invocation attribution are long-lived runtime requirements.

## Claim map

- Primary claim: Forge v0.18.1 adds delegated per-user MCP authentication and OAuth 2.1 discovery/Dynamic Client Registration to an open-source A2A/MCP agent runtime.
- Concrete implementation detail: `auth.type: user`, pooled per-user connections, lazy consent, an auth-required gate that parks and resumes calls, tenancy headers, token TTL caps, and an agent-principal OAuth path are documented.
- Additional runtime controls: The release describes SOCKS5 egress allowlists, private-CIDR controls, per-tool DEFER approvers, a policy decision point before tool execution, and per-invocation audit attribution.
- Developer workflow: `forge try` creates a keyless local demo; skill-folder import turns a `SKILL.md` plus scripts and references into a runnable agent.
- Engineering inference: Authentication, approval, egress, and audit should be part of the agent runtime contract instead of middleware added after tool calling works.

## Evidence audit

- Primary evidence inspected: GitHub v0.18.1 release page, public repository structure, and Forge’s detailed changelog.
- Baseline or comparison: The release provides an explicit v0.17.1 → v0.18.1 diff and implementation-level feature list; no independent security audit or production adoption study was found.
- Inspectable artifacts: Public source, configuration examples, issue/commit references, and a local onboarding path.
- Missing evidence: Authorization bypass testing, token leakage behavior, multi-tenant load, recovery guarantees, and formal threat-model coverage.
- Conflicts or uncertainty: The release is maintained by the project authors; “safe for real multi-user deployments” is a project claim, not independent certification.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “The missing half of MCP is identity: tracing one delegated user call through consent, policy, egress, and audit.”
- Suggested article structure: user versus agent principal → OAuth discovery/DCR → consent gate → per-user connection pool → policy/egress checks → audit attribution → local reproduction with `forge try`.
- Human decision required: Run the documented quick start and inspect the auth/approval paths before making security claims; retain a clear distinction between available code and verified operational behavior.
