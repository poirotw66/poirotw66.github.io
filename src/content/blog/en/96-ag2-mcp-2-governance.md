---
title: "AG2 v1.0.3: MCP 2.0 Migration with Deterministic Agent Governance"
description: "A technical review of AG2 v1.0.3's MCP 2.0 breaking migration, TealTiger's deterministic governance path, and a testable rollout boundary for agent runtimes."
pubDate: 2026-09-09
updatedDate: 2026-09-09
tldr:
  - "AG2 v1.0.3 moves every MCP client and server surface to MCP 2.0 and raises the dependency bound to mcp>=2.0.0,<3; treat it as a compatibility migration, not an ordinary patch upgrade."
  - "TealTiger places tool allowlists, PII, secret and prompt-injection checks, cost ceilings, kill switches, and TEEC receipts on a path with no LLM in the governance decision."
  - "The safest adoption path is a client/server/SDK matrix plus contract tests, followed by a MONITOR shadow run and then ENFORCE; deterministic does not mean complete security."
audience:
  - "Engineers responsible for agent runtimes, MCP integrations, or AI platform governance"
  - "Architects and security teams turning an open-source agent framework into a testable, auditable production service"
category: "AI Engineering"
tags: ["AI Agent", "MCP", "Enterprise AI", "Governance", "Platform Engineering"]
cluster: "ai-platform-governance"
clusterRole: "signal"
clusterOrder: 11
kind: "article"
showToc: true
image: "/blog/96-ag2-mcp-2-governance/title_image.webp"
---

AG2 v1.0.3 was released on August 28, 2026. It looks like a version update, but it changes two production boundaries at once: the protocol contract around MCP integrations and the governance path around agent tool calls. The official [v1.0.3 release notes](https://github.com/ag2ai/ag2/releases/tag/v1.0.3) say that every MCP surface moved to MCP 2.0 and that the dependency bound is now `mcp>=2.0.0,<3`; the same release also adds TealTiger prompt-injection policy support.

This article does not treat a release note as a claim that an upgrade is automatically safe. It asks the more useful engineering question: **if a team puts AG2 v1.0.3 into an agent runtime, what must migrate, what can deterministic governance control, and what evidence should prove that it works inside the team's own deployment boundary?** The answer is to treat MCP 2.0 as a compatibility project and TealTiger as a pre-tool-execution control point. Neither replaces service-side authorization, supply-chain review, or human handling of high-impact actions.

> **Huahua in one sentence**
>
> The important change in AG2 v1.0.3 is not more agent autonomy; it is a runtime contract that makes protocol migration and every tool-call decision explicit, testable, and traceable.

## This release changes two different boundaries

AG2 is an `ag2` top-level package built around async agents, tools, and multi-agent cooperation. The official repository README also notes that, after v1.0, it no longer ships the classic `autogen` import or classic agent classes. This article focuses on the v1.0.3 MCP and governance changes, but that context matters: upgrading a Classic application is not the same as changing one Python dependency.

The release can be understood as two connected but distinct surfaces:

| Surface | What AG2 v1.0.3 provides | What the team still has to verify |
| --- | --- | --- |
| MCP 2.0 migration | All MCP client/server surfaces, server metadata, and modern conversation handling | Compatibility across older SDKs, clients, hosts, transports, and wrappers |
| Deterministic governance | Tool allowlists, PII, secret, prompt-injection and cost policies, kill switches, decisions, and receipts | Whether policy covers the real tool path, whether rules misclassify inputs, and whether service authorization remains correct |
| Agent runtime | ACP human-input failures no longer wait forever, plus subagent, evaluation, and usage-accounting fixes | Whether timeout, retry, state, human handoff, and rollback behavior meet the service's SLOs |

The operational mistake is to collapse these rows into one “security upgrade” label. MCP 2.0 addresses a protocol contract. TealTiger addresses the policy decision before an AG2 tool executes. Data permissions, business authorization at the target API, and user consent remain outside those mechanisms.

## MCP 2.0 migration: more than changing a version string

### Dependency and API breaking surfaces

The release notes set the MCP dependency range to `mcp>=2.0.0,<3` and warn that applications pinning an older `mcp`, or depending on another package that does so, must update that pin first. Before upgrading, inspect the complete dependency graph rather than only running `pip install -U ag2`.

The v1.0.3 tag's `pyproject.toml` shows that `ag2[mcp]` also requires `mcp-types>=2.0.0,<3` and `jsonschema` for tool-argument validation. The extra itself is an adoption boundary: MCP serving and consuming are explicit capabilities, not something every minimal AG2 install should be assumed to contain. The deployment manifest should say that it is using them.

The handler contract is easier to miss. The [MCP server source at the v1.0.3 tag](https://github.com/ag2ai/ag2/blob/v1.0.3/ag2/mcp/server.py) notes that MCP 2.0 removed the 1.x decorator registration API. New handlers are registered through constructor callbacks, receive request context and typed parameters, and return a complete result model. MCP 2.0 also no longer supplies the same argument validation and error conversion that the 1.x decorator did, so AG2 explicitly preserves two compatibility responsibilities in its serving layer:

- validate arguments against the advertised input schema before dispatching to the handler;
- convert handler exceptions into tool-level error results instead of silently changing the caller-visible contract into an unexpected JSON-RPC error.

That is a useful migration signal: **a protocol SDK compiling does not prove that application error semantics stayed the same.** Contract tests should record expected shapes for successful results, schema errors, unknown tools, handler failures, and partially advertised capabilities.

### Conversation state moves from transport to an explicit handle

The MCP 2026-07-28 direction is a self-contained request. The modern protocol era no longer relies on the `initialize`/`initialized` handshake or `Mcp-Session-Id` to represent connection state. The official [MCP specification](https://modelcontextprotocol.io/specification/2026-07-28) describes a stateless base protocol with per-request capability negotiation; extensions must be explicitly supported by both client and server and cannot be treated as core capabilities.

AG2 v1.0.3's [ADR 0015](https://github.com/ag2ai/ag2/blob/v1.0.3/docs/adr/0015-mcp-conversation-continuity-by-handle.md) turns that change into concrete behavior:

1. A named conversation points to a server-minted opaque handle; callers cannot choose a key to create or evict someone else's history.
2. In the older handshake era, an unnamed call can still use the MCP session; in the modern era there is no session, so an unnamed call starts a fresh conversation.
3. The handle is returned both in a text result and in `_meta` under `ai.ag2/conversation`, serving model recovery and programmatic clients respectively; it is not mixed into the agent's own `structuredContent` schema.
4. An unknown, expired, or principal-mismatched handle becomes a tool-execution error rather than silently falling back to another history.

This removes the intuitive but unsafe assumption that “one connection equals one conversation,” while moving more responsibility to the deployment. In a multi-replica service, verify handle-registry reachability, history storage, TTL, LRU eviction, principal binding, and cross-replica behavior. The ADR explicitly notes that shared history storage alone does not make the handle mapping usable from every replica; without routing or a shared registry, a retry may reach a valid but different conversation.

For an exposed AG2 agent, the [MCPServer documentation](https://docs.ag2.ai/docs/user-guide/tools/serving_mcp/) describes stateful sessions by default, with multi-turn history across `tools/call` invocations. With `sessions=False`, callers should not expect a continuation handle. Treat these settings as data-lifecycle and security choices, not merely transport preferences.

### Separate client-side from provider-side MCP

AG2's current [MCP server documentation](https://docs.ag2.ai/docs/user-guide/tools/mcp_servers/) describes two paths. `MCPToolkit` connects to the server from AG2, discovers tools, and executes them locally. `MCPServerTool` sends the URL and credentials to an LLM provider that natively supports MCP passthrough. The first works with any provider, supports local stdio, and exposes the tool call to AG2 middleware; the second delegates lifecycle management to the provider and moves credentials outside the application's infrastructure.

The decision boundary is therefore practical: start with `MCPToolkit` when you need local control, provider portability, stdio, or AG2-side governance. Choose `MCPServerTool` only when the provider is inside the trust boundary, the credential flow is understood, and its tool-filtering semantics are acceptable. The official documentation also warns that some providers' remote-MCP requests express only an allowlist and cannot represent `blocked_tools`; a provider's tool descriptor should not be mistaken for your enforcement point.

This extends the point in [MCP Spec Update: Stateless Core, Tasks, and Apps](/en/blog/34-model-context-protocol-mcp/): protocol interoperability lowers integration cost, but it does not create authorization, quotas, approvals, input validation, or auditing by itself.

## Deterministic governance: put policy before the tool call

TealTiger is shipped with AG2 v1.0.3 as the `ag2.extensions.tealtiger` module. Its official documentation is explicit: on a governance path with no LLM, it handles tool allowlists and blocklists, argument validation, PII and secret detection, prompt injection, session cost, per-agent kill switches, and structured TEEC audit receipts. No extra API key or governance service is required.

“Deterministic” has a specific engineering meaning here. Given the same tool name, serialized arguments, policies, and mode, the decision comes from in-process glob/precompiled-regex checks and cost state rather than asking another model whether the action should pass. The prompt-injection detection added in v1.0.3 is not a universal keyword classifier either: the source patterns target structures such as instruction override, jailbreak framing, and context manipulation, with a configured confidence for findings.

There are three rollout modes:

- `OBSERVE`: skip policy evaluation, pass through, and track cost; useful for a low-interference initial baseline;
- `MONITOR`: evaluate policies and record what would be denied without blocking; useful for staging or shadow tests;
- `ENFORCE`: block the tool call when a policy matches; appropriate after the rules have been validated.

The middleware also checks budget limits before policy evaluation. A freeze can stop an agent by name from taking turns or calling tools. Decisions retain action, mode, reason codes, risk score, evaluation time, and cumulative cost. Each tool evaluation emits a TEEC receipt marked executed or blocked. A long-lived middleware factory can be shared across agents, keeping decisions, receipts, cost, and frozen-agent state together.

> **Huahua's engineering note**
>
> A no-LLM policy path makes outcomes predictable, replayable, and easy to test without an API key; it does not mean regexes cover every language or attack variant, and it does not mean an allowed tool is authorized for every tenant, dataset, or target API.

From the [Enterprise AI agent security](/en/blog/43-enterprise-ai-agent-security/) threat model, TealTiger belongs mainly at the runtime tool-execution layer. It does not replace identity and tenant isolation, service-side authorization, secret management, supply-chain verification, output approval, or human confirmation for high-impact writes. For prompt injection, it is a low-latency rule layer; untrusted documents and multilingual inputs still belong in an independent evaluation set rather than an assertion that defense is complete.

## Adoption boundary: when the upgrade is worth it

AG2 v1.0.3 is a good fit when the team genuinely needs MCP 2.0's stateless request and modern conversation model, wants one agent framework to connect both remote HTTP and local stdio, or needs centralized allowlist, sensitive-data, cost, and audit controls before AG2 tool execution.

It should not be reduced to “upgrade to 1.0.3 and turn on ENFORCE” in these cases:

- A Classic `autogen` application has not migrated its agents, orchestration, and imports. Start with the [AI Agent complete guide](/en/blog/64-ai-agent-guide/) to inventory state, tools, evaluation, and failure recovery.
- The service needs strict cross-replica conversation continuity but has no shared handle registry, verified routing, or explicit expiry behavior.
- Provider-side MCP sends credentials outside the trusted boundary, or that provider cannot express the required `blocked_tools` behavior.
- A tool deletes data, moves money, changes production state, or handles highly sensitive personal data. Those operations still need target-service authorization, idempotency, approval, and a complete audit trail.

MCP 2.0 is an integration contract; TealTiger is a runtime policy checkpoint. Neither is a business-authorization contract. This is the same control-plane separation described in [GitHub Copilot MCP Governance](/en/blog/87-github-mcp-enterprise-controls/): policy, enforcement, and telemetry should connect, but none should impersonate the evidence supplied by another.

## A migration plan that produces evidence

### 1. Build the compatibility matrix first

Record each integration as a row: AG2 version, `mcp`/`mcp-types` version, client, server, SDK, host, transport, handshake/session assumptions, metadata, conversation behavior, and optional extensions. Track Classic applications separately; do not make a vague success criterion that mixes old imports with the new `ag2` package.

### 2. Turn protocol behavior into contract tests

At minimum, test negotiation between older clients and modern requests, tools/resources/prompts listing, server metadata, valid and invalid arguments, unknown tools, handler exceptions, tool-level errors, stdio and HTTP, named and unnamed conversations, unknown/expired handles, principal mismatches, LRU/TTL behavior, and retries across two replicas. For `MCPServer`, also test `sessions=True`, `sessions=False`, and `stateless=True` combinations against the continuity behavior you actually want.

### 3. Turn governance rules into policy tests

For each allowlist, test both permitted and rejected tool names. For PII, secrets, and prompt injection, include normal values, false-positive cases, multilingual input, nested serialized arguments, and oversized arguments. Then verify the same input in all three modes: action, reason code, risk score, cost accumulation, and receipt outcome. If it matters that middleware really wraps MCP tools, use client-side `MCPToolkit` in an integration test; a unit test of the policy helper is not enough.

### 4. Start with MONITOR, then move to ENFORCE

Run `MONITOR` in staging as a shadow pass. Store policy version, the data classification of serialized arguments, decision, reason code, latency, and receipt. Fix false positives, then choose a read-only or quickly reversible canary. After switching to `ENFORCE`, watch denials, human handoffs, tool errors, cost, and task completion. This follows the principle in [Agentic AI Platform Contract](/en/blog/93-agentic-ai-platform-contract/): a runtime that runs is only the beginning; the control plane must explain what happened.

### 5. Define rollback conditions in advance

Rollback should not mean only “turn enforcement off.” Define thresholds for protocol errors, conversation-continuity failures, policy false positives, unknown handles, missing receipts, and anomalous cost. Keep a compatible dependency lock, an older deployment, session/handle cleanup, and a data-retention plan ready. For high-risk tools, falling back to a human workflow is usually safer than falling back to unrestricted execution.

## The engineering judgment

AG2 v1.0.3 matters not because it turns MCP or governance into a bigger agent story, but because it exposes two assumptions that runtimes often leave implicit: a protocol connection should not be treated as conversation identity, and a model-produced tool call should not automatically equal an executable action.

For a platform team, the valuable path is to put MCP 2.0 migration, dependency locks, handle lifecycle, tool policy, receipts, evaluation, and rollback into one runtime contract. First prove request, state, and error semantics with tests. Then use deterministic governance to reduce uncertainty in policy decisions. Finally, let every service that changes data or external state keep ownership of authorization and approval.

## Primary sources

- [AG2 v1.0.3 release notes](https://github.com/ag2ai/ag2/releases/tag/v1.0.3)
- [AG2 repository README](https://github.com/ag2ai/ag2/tree/v1.0.3)
- [AG2 v1.0.3 `pyproject.toml`](https://github.com/ag2ai/ag2/blob/v1.0.3/pyproject.toml)
- [AG2 v1.0.3 MCP server implementation](https://github.com/ag2ai/ag2/blob/v1.0.3/ag2/mcp/server.py)
- [AG2 ADR 0015: MCP conversation continuity by handle](https://github.com/ag2ai/ag2/blob/v1.0.3/docs/adr/0015-mcp-conversation-continuity-by-handle.md)
- [MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28)
- [AG2 MCP Servers documentation](https://docs.ag2.ai/docs/user-guide/tools/mcp_servers/)
- [AG2 TealTiger Governance documentation](https://docs.ag2.ai/docs/user-guide/extensions/tealtiger/)
