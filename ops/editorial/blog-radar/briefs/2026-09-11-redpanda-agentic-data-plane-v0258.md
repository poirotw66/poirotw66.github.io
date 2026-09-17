---
stableId: "url:https://docs.redpanda.com/agentic-data-plane/reference/release-notes/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-11
lastVerifiedAt: 2026-09-17
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 5
  total: 24
decision: "write-now"
---

# Redpanda Agentic Data Plane v0.2.61：把憑證、模型與寫入權限推到 Agent 邊界

## Identity

- Search window: Strict 72-hour scan ending 2026-09-17; v0.2.61 was released on 2026-09-16 and v0.2.60 on 2026-09-15.
- Discovery queries: `Redpanda Agentic Data Plane v0.2.61`; `OpenAI authorization passthrough agentic data plane`; `MCP tool write permissions release notes`.
- Canonical URL: https://docs.redpanda.com/agentic-data-plane/reference/release-notes/
- Publisher or author: Redpanda Agentic Data Plane documentation.
- Published or updated date: v0.2.61, 2026-09-16; supporting v0.2.60, 2026-09-15.
- Source type: release-notes.
- Direct supporting sources:
  - Official release notes: https://docs.redpanda.com/agentic-data-plane/reference/release-notes/

## Editorial fit

- Why now: The newest release moves two high-risk decisions closer to the execution boundary: callers can pass their own OpenAI-compatible credentials without storing them in ADP, while Pylon writes and customer replies require explicit capability flags.
- Reader question: How should an agent platform separate provider-secret custody, model context accounting, and permission to mutate external systems?
- Category and topic cluster: Cloud & Platform / ai-platform-governance.
- Existing coverage and duplication risk: This refreshes the existing v0.2.58 record rather than creating a duplicate. It remains adjacent to OpenAI Secure MCP Tunnel, GitHub Agentic Workflows, and MCP governance candidates, but the distinct angle is the operational contract between credential passthrough, context accounting, and explicit external-write permissions.
- Why this remains useful after the current news cycle: Credential custody, model/token attribution, estimated-versus-reported context, and write-capability gates remain durable requirements for agent operations and incident response.

## Claim map

- Primary claim: Redpanda v0.2.61 adds authorization passthrough for OpenAI and OpenAI-compatible providers, improves agent-inspector context accounting, and requires `allow_writes` plus `allow_customer_replies` for higher-risk Pylon actions; v0.2.60 also improves attachment/error visibility.
- Measured evidence: The official release notes name the exact release versions and document the provider-credential behavior, estimated-versus-reported context labels, available model input/output limits, explicit Pylon permission flags, full-list activity filtering, and the earlier audit-log semantics for denied or masked calls.
- Vendor or author claims requiring qualification: The source is a product release note; it does not independently measure credential leakage resistance, permission-bypass resistance, context-estimate accuracy, latency, retention, or incident-response outcomes.
- Bloss0m engineering consequence: Model provider credentials as a caller-owned boundary, keep estimated context separate from billable token facts, and make external writes require a capability that is visible in policy and audit events.

## Evidence audit

- Primary evidence inspected: Official Redpanda Agentic Data Plane release-notes page, v0.2.61/v0.2.60/v0.2.59 entries, and the earlier v0.2.58 audit-log entry on the same canonical page.
- Baseline or comparison: Stored provider credentials versus caller-supplied authorization passthrough; unlabelled context usage versus an explicit estimate; generic Pylon writes versus capability-gated writes; and partial activity filtering versus all-request filtering.
- Missing evidence: Independent secret-handling and permission-bypass tests, credential redaction guarantees, context-estimate accuracy, retention/export guarantees, event-delivery SLOs, production latency/cost benchmarks, and a public runnable deployment artifact.
- Conflicts or uncertainty: The release notes are detailed but vendor-authored. The article must preserve that context estimates are not reported token counts, cost sorting still covers only loaded requests, and earlier denied calls/usage records are not necessarily comparable or backfilled.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “Agent 平台的三個邊界：Redpanda 如何分開 provider credential passthrough、context accounting 與 Pylon write consent。”
- Internal routes: Link to MCP governance, agent permissions, trace observability, cost attribution, and provenance contracts.
- Human decision required: Approve a write-now article only if it demonstrates the permission and evidence schema and clearly distinguishes product-documented behavior from unverified security, completeness, and reliability claims.
