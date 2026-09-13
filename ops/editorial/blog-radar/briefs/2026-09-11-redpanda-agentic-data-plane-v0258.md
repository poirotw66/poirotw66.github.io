---
stableId: "url:https://docs.redpanda.com/agentic-data-plane/reference/release-notes/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-11
lastVerifiedAt: 2026-09-11
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 4
  total: 23
decision: "write-now"
---

# Redpanda Agentic Data Plane v0.2.58：把被拒絕的 Agent 行為也寫進 audit log

## Identity

- Search window: 7-day backfill because the latest verified release is 2026-09-07, outside the strict 72-hour window.
- Discovery queries: `Redpanda Agentic Data Plane v0.2.58`; `agent audit log denied MCP calls caller identity`; `enterprise agent observability release September 2026`.
- Canonical URL: https://docs.redpanda.com/agentic-data-plane/reference/release-notes/
- Publisher or author: Redpanda Agentic Data Plane documentation.
- Published or updated date: v0.2.58, 2026-09-07.
- Source type: release-notes.
- Direct supporting sources:
  - Official release notes: https://docs.redpanda.com/agentic-data-plane/reference/release-notes/

## Editorial fit

- Why now: The release changes the semantics of operational evidence: denied MCP calls, model identity, caller type, resource links, policy decisions, and full timestamps become searchable audit events instead of invisible failures.
- Reader question: What must an enterprise agent audit log record when a tool call is denied, a model changes, or an agent delegates to another agent?
- Category and topic cluster: Cloud & Platform / ai-platform-governance.
- Existing coverage and duplication risk: It is adjacent to OpenAI Secure MCP Tunnel, GitHub Agentic Workflows, and MCP governance candidates, but the distinct angle is denied-action observability and actor/resource/policy joins inside an agentic data plane.
- Why this remains useful after the current news cycle: Audit completeness, denied-action visibility, identity propagation, and version-aware cost/usage evidence are durable requirements for incident response and governance.

## Claim map

- Primary claim: Redpanda v0.2.58 expands agent observability so every agent call to an MCP tool, LLM provider, or another agent is recorded, including policy-denied calls, with model and caller identity.
- Measured evidence: The official release notes document searchable full-history audit events, actor type, model name, linked agent/MCP server/provider/policy resources, full timestamps, and explicit non-backfill behavior for calls that predate the release. They also document a provider leaderboard by requests, tokens, and spend.
- Vendor or author claims requiring qualification: The source is a product release note; it does not independently measure event completeness, ingestion loss, query latency, retention, or incident-response outcomes.
- Bloss0m engineering consequence: Treat denied actions as first-class telemetry. Define an event schema that preserves intended action, policy decision, principal, model version, resource identity, timestamp, and whether the event was observed before or after execution.

## Evidence audit

- Primary evidence inspected: Official Redpanda v0.2.58 release-notes page and the surrounding versioned changelog.
- Baseline or comparison: Prior audit behavior that omitted policy-denied calls and did not expose the same actor/model/resource joins versus the new searchable event model.
- Missing evidence: Independent audit-log completeness test, retention and export guarantees, event delivery SLO, production query benchmarks, and a public runnable deployment artifact.
- Conflicts or uncertainty: The release notes are detailed but vendor-authored. The article must preserve the explicit warning that older denied calls are not backfilled and that usage counts recorded before the release may not be directly comparable.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “Agent 被拒絕也要留下證據：Redpanda 如何把 denied tool calls、caller identity 與 policy decision 變成可查詢的 audit contract。”
- Internal routes: Link to MCP governance, agent permissions, trace observability, cost attribution, and provenance contracts.
- Human decision required: Approve a write-now article only if it demonstrates the event schema and clearly distinguishes product-documented behavior from unverified completeness and reliability claims.
