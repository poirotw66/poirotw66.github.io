---
title: "Pydantic AI v2.45: Durable Agent Reliability Is a Session and Trace Contract"
description: "A technical reading of how Pydantic AI v2.45.0 aligns DynamicToolset, MCP sessions, tool history, and usage spans with durable runs, plus the adoption boundaries for TypeSafeModel and Bedrock effort handling."
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "The main story in v2.45.0 is not a handful of new APIs; it is treating the durable run as the boundary for replayable, observable agent behavior."
  - "Where the engine supports it, `DynamicToolset` resolution and MCP sessions move from per-unit behavior to per-run behavior, so caches, connections, and tool history survive step boundaries."
  - "`MCPSamplingModel` preserves native tool history, while agent-run spans report the run's own usage; together they improve continuation and cost attribution without proving reliability across every deployment."
  - "TypeSafeModel and Bedrock `xhigh` are adjacent model-interface fixes; adoption still requires checking model capabilities, MCP versions, durability engines, and retry semantics."
audience:
  - "AI and platform engineers designing durable agents, MCP runtimes, or multi-agent observability"
  - "Teams moving Pydantic AI from a working prototype toward replayable, auditable operations"
category: "AI Engineering"
tags: ["AI Agent", "MCP", "Platform Engineering", "Evaluation", "Enterprise AI"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 37
kind: "article"
showToc: true
wideHeader: true
image: "/blog/pydantic-ai-v245-durable-mcp-sessions/title_image.webp"
---

Pydantic AI v2.45.0 shipped on September 17, 2026. The release note appears to contain several unrelated items: a new `TypeSafeModel`, an Amazon Bedrock `xhigh` effort fix, changes to `DynamicToolset` and MCP sessions, preserved MCP sampling history, and corrected agent-run usage. The more useful way to read them is through one question: **when a durable execution engine splits an agent into retryable units, what counts as the same run?**

That question is closer to production reliability than “did one call succeed?” If every unit re-resolves tools, creates a new MCP session, loses the previous tool result, or charges a child agent’s tokens to its parent span, the workflow may still finish. It will be much harder to replay, explain cost, or tell whether recovery continued the original state.

This article separates three layers: behavior explicitly promised by the release and its PRs, engineering meaning inferred from those changes, and limitations that still need verification in your own engine/provider combination. It is not a complete Pydantic AI tutorial, and it does not turn maintainer tests into a cross-environment SLA.

> **Huahua in one sentence**
>
> A durable agent can only make retries both stateful and explainable when its session, tool history, and usage trace share the same run boundary.

## What the release actually changed

The official [v2.45.0 release note](https://github.com/pydantic/pydantic-ai/releases/tag/v2.45.0) groups naturally into a new interface and a set of durable-execution fixes. The distinction matters: `TypeSafeModel` expands the model surface, while the later changes repair how the agent runtime carries state and telemetry across units.

### New interface: TypeSafeModel is a typed decision model, not a chat LLM

`TypeSafeModel` brings TypeSafe’s Jev into Pydantic AI. [PR #8450](https://github.com/pydantic/pydantic-ai/pull/8450) is explicit: Jev receives text and typed questions, then answers each field with probabilities; it does not generate long-form text, read files, or fill arbitrary tool arguments. The fields in `output_type` are therefore closer to calibrated decision questions than to a free-form generation schema.

There are two practical uses in an agent runtime: put low-latency triage, routing, or rubric decisions in a decision layer; then use a general language model or `FallbackModel` when the task needs open-ended answers or parameterized tool calls. A correct output type does not grant tool permission or replace a policy engine. Jev confidence is also a model signal, not proof of authorization.

### Durable execution: correcting the unit boundary to a run boundary

The four durability-related fixes share one misalignment: the durable engine records, retries, and replays units, while some runtime resources should live for the whole run.

| Change | v2.45.0 behavior | Engineering meaning |
| --- | --- | --- |
| `DynamicToolset` | With `per_run_step=False`, resolve once per durable run; enter on the first unit that needs it, then close at run end | Factories, toolset caches, and connections are not rebuilt for every step |
| MCP session | Applicable DBOS and Prefect paths hold one session per durable run | `initialize`, `tools/list`, and server-side caches do not cold-start at every unit |
| MCP tool history | `MCPSamplingModel` keeps native `tool_use`/`tool_result` blocks, IDs, arguments, results, and retry feedback | A continuation or server/client round trip can see the previous tool exchange |
| Agent-run usage span | Each run span is attributed with requests made by that run, rather than shared or nested usage | Parent and delegate costs can be added without duplicate attribution |

“Once per run” is not an unconditional global guarantee. `per_run_step=True` still asks `DynamicToolset` to resolve per unit. When the run context must cross a process boundary, such as Temporal worker/activity boundaries, the engine may not see the resolved toolset and can fall back to per-unit behavior. MCP engine lifecycles also differ: PR #8463 deliberately keeps Temporal at per-activity sessions because an activity can execute on another worker.

> **Huahua's engineering note**
>
> “One durable run, one MCP session” is behavior under a particular lifecycle and context model—not a deployment promise that bypasses engine documentation, cross-process tests, or retry review.

## Why session lifetime changes reliability

### 1. Toolset resolution determines what a replay is replaying

Under the old mismatch, a `DynamicToolset` factory could run again inside every durable unit. If it returned an MCP toolset, the connection and `cache_tools` were rebuilt too. The second model request in one run could see a copy of the first unit’s environment rather than a continuing tool session.

[PR #8455](https://github.com/pydantic/pydantic-ai/pull/8455) separates object resolution from session entry, which performs I/O: resolve the factory once in container code; enter on the first durable unit that actually needs the tool; hold it for the run; close it at the end. The durable engine keeps its deterministic unit sequence, while connection failure returns to a retryable unit.

That design adds a factory contract worth putting into migration review: a factory executed in container code must deterministically build a toolset from run dependencies. It cannot quietly connect, read transient unit-only state, or rely on an unreplayable side effect. `per_run_step=True` remains an explicit choice when parallel tool-call units should not share mutable toolset state.

### 2. Session lifetime changes MCP network and cache cost

An MCP client obtains tool definitions before calling a tool; the server may also retain initialization state and `cache_tools`. PR #8455 measured three model requests and two tool calls against an in-process server: a dynamic toolset took five `initialize` and five `tools/list` calls before the fix, then one of each after it. PR #8463 applies the run-held lifecycle to the static `MCPToolset` path for DBOS and Prefect; discovery remains a recorded unit rather than an opaque process-local cache.

This is not only a performance tweak. Rebuilding a session adds connection, authentication, schema-discovery, and server warm-up failure points. A longer-lived session also means credentials, tenant scope, server-side state, and concurrency must remain correct within the run. If tool access can be revoked mid-run, the team cannot extend a session indefinitely just to save round trips.

### 3. Tool history determines whether a continuation is actually a continuation

The `MCPSamplingModel` fix does not flatten history into plain text. [PR #8466](https://github.com/pydantic/pydantic-ai/pull/8466) preserves native MCP `tool_use` and `tool_result` blocks, including original tool IDs, arguments, results, and retry feedback. Parallel results remain in a separate user message. After a durable restart or a server/client round trip, the next model can identify which tool was called, what it returned, and whether a retry was requested.

The format boundary is explicit: tool history requires the MCP 2025-11-25 sampling format, while new tool execution and multimodal tool results remain unsupported. Migration therefore needs a version matrix across the Python package, client, server, sampling adapter, and persisted message history—not only a package upgrade.

## Usage spans: observability must respect the run boundary too

Session lifetime fixes the problem of execution state being cut apart; usage attribution fixes the problem of after-the-fact telemetry charging the wrong run. [PR #8456](https://github.com/pydantic/pydantic-ai/pull/8456) addresses two cases: a later run carrying a previous `RunUsage` object, and a parent agent handing the same usage object to concurrent delegates. The old behavior could expose a conversation total on a later run or count sibling tokens inside each delegate span.

v2.45.0 attributes usage to the run that actually made the request while its agent-run span is open, separating nested and concurrent tasks through context attribution. `result.usage`, `UsageLimits`, and per-request chat spans are unchanged; durable activities still return `usage_delta` to the run span. This is an observability-contract correction, not a new definition of provider billing.

Operationally, aggregation needs a rule: when the backend sums parent and child span attributes, sum the outermost agent-run spans rather than every nested span. Otherwise the same tokens are counted twice. That is why “each run reports its own usage” must ship with trace-topology guidance, not only a renamed field.

> **Huahua's take**
>
> Durable reliability is more than successful retries: without one run identity across session, history, and usage, it is difficult to prove that recovery resumed the original work.

## Bedrock and TypeSafeModel: adjacent fixes, separate promises

v2.45.0 also contains two provider changes that are easy to blend into the same release summary.

First, Bedrock Converse no longer hardcodes `thinking='xhigh'` to `effort='max'`. Per [PR #8392](https://github.com/pydantic/pydantic-ai/pull/8392), `BedrockConverseModel` reads the merged model profile: when the model supports `xhigh`, the original value is forwarded; otherwise it still maps to Bedrock’s accepted `max`. The PR names Opus 4.7, Opus 4.8, and Sonnet 5 as examples that accept `xhigh`, while older models keep the fallback.

This improves request semantics and provider compatibility; it does not prove that `xhigh` produces better reasoning than `max`. The PR’s live check confirms that Bedrock accepts the value, not how the two settings differ in inference quality. Production traces should still record the resolved model profile, thinking level, provider error, and fallback path.

Second, `TypeSafeModel` lets an agent use Jev as a typed decision provider, but it does not automatically share a lifecycle with durable sessions. If Jev is placed inside a durable workflow, the application still has to define whether the decision is replayable, version confidence thresholds, record fallback-to-LLM behavior, and include provider details in the trace. A new provider does not complete the runtime contract for you.

## Migration checklist: verify these five things first

### 1. Inventory toolset factory I/O and scope

Find every `DynamicToolset`, record `per_run_step`, and verify that `per_run_step=False` factories perform deterministic object construction only. Put user, tenant, and credential scope into run dependencies; do not rely on state that merely happens to exist inside one unit.

### 2. Add engine-specific wire-count and lifecycle tests

Measure `initialize`, `tools/list`, `tools/call`, enter, close, and retry counts for one run. DBOS and Prefect should confirm the applicable path reaches one session per run; Temporal should confirm that per-activity sessions are an intentional cross-worker design rather than a regression.

### 3. Build a message-history version matrix

Use real tool calls, results, parallel results, and retry feedback to test `MCPSamplingModel` across MCP 2025-11-25 and older SDK combinations. Treat unsupported multimodal tool results as an explicit failure mode rather than silently downgrading them to text that looks complete.

### 4. Reconcile usage aggregation and budget dashboards

Check whether the logging backend aggregates chat spans, agent-run spans, or both. Add fixtures for three-level nesting, parallel delegates, usage reuse across conversations, and durable `usage_delta`; verify that `result.usage`, UsageLimits, and span totals agree.

### 5. Make provider profiles and fallbacks trace fields

Bedrock `xhigh`, Jev confidence, fallback model, MCP protocol version, and engine name all affect the meaning of a run. Without those fields, “completed” or “failed” is not enough to explain changes in cost, latency, or quality.

## Failure modes v2.45.0 does not solve automatically

| Failure mode | What v2.45.0 helps with | Still owned by the application/platform |
| --- | --- | --- |
| Unit retry creates a cold MCP session | Applicable engines hold the toolset/session for the run | Credential rotation, tenant isolation, server timeouts, concurrency limits |
| Factory has an external side effect during replay | Docs and PRs state the deterministic-factory contract | Code review, replay tests, and banning container-side I/O |
| Tool history loses a retry or result | Native history blocks and IDs are preserved | Protocol version, schema migration, and unsupported-content policy |
| Parent/delegate costs are counted twice | Run spans report their own usage | Choosing outermost spans and configuring backend aggregation |
| Bedrock rejects the requested effort | Model profile selects `xhigh` or falls back to `max` | Model availability, quality comparison, cost, and latency SLOs |
| Typed decision has the right shape but the wrong meaning | `TypeSafeModel` provides a typed decision interface | Golden sets, calibration, human escalation, permissions, and side-effect gates |

If the goal is a replayable, inspectable agent runtime, start with the state, tools, and observability layers in the [AI Agent guide](/en/blog/64-ai-agent-guide/), then use the [Agentic AI platform contract](/en/blog/93-agentic-ai-platform-contract/) to turn trace, policy, and evaluation into release criteria. For MCP identity and connection attribution, compare the [multi-user Forge MCP auth runtime](/en/blog/99-forge-mcp-auth-runtime/); for decision gates inside an agent loop, read the [Jev confidence-gated runtime](/en/blog/108-jev-confidence-gated-agent-runtime/).

## Closing: treat v2.45 as a lifecycle-contract reminder

The value of Pydantic AI v2.45.0 is not that every changelog item can independently claim “more reliable.” It is that several details commonly handled in isolation now line up: toolset resolution fixes when the tool environment becomes stable, MCP session lifetime fixes how long the external connection lives, tool history fixes whether a restart can understand the previous exchange, and usage spans fix whether operations can charge the right run.

The limitations are part of the story. Temporal’s worker boundary, the MCP sampling version, Bedrock profile capabilities, and Jev’s typed-decision scope still require an application-specific compatibility matrix. After upgrading, the most valuable test is not another happy path. Intentionally interrupt a run, retry a tool, and fan out two delegates, then answer three questions: **Which session did it use? Which history did it see? Whose usage did it record?**

## Sources and further reading

- [Pydantic AI v2.45.0 release notes](https://github.com/pydantic/pydantic-ai/releases/tag/v2.45.0) — official release changes and changelog.
- [Pydantic AI repository](https://github.com/pydantic/pydantic-ai) — official SDK repository and entry point for durable execution, MCP, and provider implementations.
- [PR #8450: Add `TypeSafeModel` for TypeSafe's Jev](https://github.com/pydantic/pydantic-ai/pull/8450) — TypeSafeModel capabilities and boundaries.
- [PR #8455: Resolve a `DynamicToolset` once per durable run](https://github.com/pydantic/pydantic-ai/pull/8455) — dynamic toolset resolution, entry, close, and factory contract.
- [PR #8463: Hold one MCP server session per durable run](https://github.com/pydantic/pydantic-ai/pull/8463) — static MCPToolset lifecycle across durable engines.
- [PR #8466: Preserve tool history in `MCPSamplingModel`](https://github.com/pydantic/pydantic-ai/pull/8466) — MCP sampling history format and unsupported scope.
- [PR #8456: Report each agent run's own usage on its span](https://github.com/pydantic/pydantic-ai/pull/8456) — usage attribution and span aggregation contract.
- [PR #8392: Pass `xhigh` effort through on Bedrock](https://github.com/pydantic/pydantic-ai/pull/8392) — model-profile control of Bedrock effort.
