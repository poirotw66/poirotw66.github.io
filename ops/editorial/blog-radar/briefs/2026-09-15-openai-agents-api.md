---
stableId: "url:https://openai.com/index/introducing-the-agents-api/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-15
lastVerifiedAt: 2026-09-15
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 3
  engineeringValue: 5
  archiveFit: 4
  total: 22
decision: "write-now"
---

# Introducing the Agents API

## Identity

- Search window: 7-day backfill from 2026-09-08 through 2026-09-15; the announcement was published 2026-09-10, outside the strict 72-hour window.
- Discovery queries: `OpenAI Agents API Codex harness MCP tool search`, `OpenAI cloud agents public beta`, `Agents API programmatic tool calling`.
- Canonical URL: https://openai.com/index/introducing-the-agents-api/
- Publisher or author: OpenAI.
- Published or updated date: 2026-09-10.
- Source type: company-announcement.
- Direct supporting sources: https://developers.openai.com/

## Editorial fit

- Why now: The announcement packages a cloud agent runtime, Codex harness, MCP, web search, custom functions, compaction, tool search, and parallel subagents behind one API boundary.
- Reader question: What actually moves into the managed runtime when “an agent” becomes one API call, and which control surfaces still belong to the application team?
- Category and topic cluster: AI Engineering / agent runtime and orchestration.
- Existing coverage and duplication risk: Medium-high. Existing Harness and managed-agent coverage means the article needs a system-boundary and portability angle, not another launch recap.
- Why this remains useful after the current news cycle: The hosted-versus-self-hosted harness boundary, tool discovery, context compaction, and cost/latency observability are durable design questions for agent platforms.

## Claim map

- Primary claim: The public beta lets a caller specify a task, model, tools, and environment while the hosted Codex harness handles execution and supports MCP, custom functions, web search, automatic compaction, tool search, programmatic tool calling, and parallel subagents.
- Measured evidence: The official announcement links the developer platform and an open-source Codex harness reference. It also reports customer/vendor evaluation claims such as score, latency, cost, and failed-response improvements.
- Vendor or author claims requiring qualification: The quantitative improvements are first-party or customer testimonials, not independent evaluations; public-beta behavior, pricing, limits, and compatibility may change.
- Bloss0m engineering consequence: Model the managed runtime as a policy boundary with explicit tool permissions, environment identity, trace retention, compaction semantics, egress controls, and a fallback plan for self-hosting.

## Evidence audit

- Primary evidence inspected: OpenAI announcement and the linked developer documentation entry point.
- Baseline or comparison: The article describes hosted, self-hosted, and partner runtime options, but its outcome numbers are not a neutral benchmark.
- Missing evidence: No independent workload benchmark, public compatibility matrix for MCP servers, detailed rate/latency limits, cost model by task shape, or production incident data.
- Conflicts or uncertainty: The open-source harness reference and managed Agents API are related but not interchangeable; an article must keep API guarantees, reference code, and customer anecdotes separate.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “一個 API call 背後其實是一個 execution boundary：拆解 managed agent 的工具、環境、記憶與觀測責任。”
- Internal routes: Link to Harness Engineering, managed-agent control planes, MCP governance, and agent observability coverage.
- Human decision required: Do not elevate the vendor/customer metrics to general conclusions; verify the current developer docs again before publication.
