---
stableId: "url:https://github.com/pydantic/pydantic-ai/releases/tag/v2.45.0"
status: "durable-post-candidate"
firstSeenAt: 2026-09-21
lastVerifiedAt: 2026-09-21
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

# Pydantic AI v2.45.0：把 durable run、MCP session 與可觀測性接在一起

## Identity

- Search window: Seven-day backfill ending 2026-09-21; the release is dated 2026-09-17.
- Canonical URL: https://github.com/pydantic/pydantic-ai/releases/tag/v2.45.0
- Publisher or author: Pydantic AI maintainers.
- Source type: Open-source GitHub release.

## Editorial fit

- Reader question: What does it mean for a tool-using agent to have one durable run instead of repeatedly rebuilding its tool context?
- Why now: v2.45.0 adds `TypeSafeModel`, resolves a dynamic toolset once per durable run, holds one MCP server session per durable run, preserves MCP tool history, and reports each agent run's usage on its own span.
- Engineering angle: Explain durable execution as a state and observability contract: session lifetime, tool history, model effort, and per-run accounting must line up.
- Archive fit: Connects the site's TypeSafe AI, MCP governance, and agent observability threads through a small but consequential open-source release.

## Claim map

- Primary claim: The release changes how long-lived runs retain tool and MCP state, while adding type-safe model selection and per-run usage reporting.
- Inspectable evidence: GitHub release notes list the `TypeSafeModel` feature, one-MCP-session-per-durable-run behavior, preserved tool history, Bedrock effort handling, and usage spans.
- Engineering consequence: Recreating MCP sessions inside every durable unit can duplicate state and break continuity; telemetry should attribute cost and usage to the agent run that owns the work.

## Evidence audit

- Primary evidence inspected: Signed GitHub release v2.45.0, its changelog entries, and the public repository context.
- Missing evidence: No independent workload benchmark, migration guide for every persistence backend, or cross-provider session stress test was verified.
- Uncertainty: The release notes establish intended behavior; deployment-specific durability and replay semantics still require local testing.

## Recommended treatment

- Output level: Durable post candidate.
- Proposed angle: “Agent 的可靠性藏在 session lifetime：拆解 Pydantic AI 如何把 MCP、durable run 與 usage span 對齊。”
- Artifact: Public release commit, changelog, and inspectable implementation in the Pydantic AI repository.
- Human decision required: Distinguish the release's stated lifecycle guarantees from the behavior of a particular durable-execution backend.
