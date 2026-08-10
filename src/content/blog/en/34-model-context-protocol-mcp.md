---
title: "MCP 2026-07-28: Stateless Core, Tasks, Apps, and Migration Decisions"
description: "A practical reading of the Model Context Protocol 2026-07-28 breaking changes, official Tasks and Apps extensions, and the compatibility and security work required for enterprise migration."
pubDate: 2026-07-02
updatedDate: 2026-08-09
tldr:
  - "MCP 2026-07-28 removes the required handshake and session header so any request can reach any compatible server instance."
  - "Tasks and MCP Apps are official extensions, but usability still depends on matching client, server, host, and SDK support."
  - "Stateless transport reduces coordination overhead; it does not provide authorization, quotas, approvals, validation, or auditing."
audience:
  - "Engineers building or operating MCP clients, servers, and agent platforms"
  - "Platform architects evaluating MCP compatibility, migration, and security"
category: "AI Engineering"
tags: ["MCP", "AI Agent", "Cloud Native", "Architecture Patterns"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 2
kind: "article"
showToc: true
image: "/blog/34-model-context-protocol-mcp/title_image.webp"
---

The Model Context Protocol released a new specification on July 28, 2026. This is more than a few additional methods. It changes the deployment assumptions for remote MCP: the core protocol no longer requires the `initialize`/`initialized` handshake or `Mcp-Session-Id`. Requests carry their protocol version, client identity, and capabilities, allowing ordinary load balancing across server instances.

The official [2026-07-28 release note](https://blog.modelcontextprotocol.io/posts/2026-07-28/) also places long-running work and interactive interfaces in an extension ecosystem. MCP now fits horizontally scaled web infrastructure more naturally, but the release is a breaking migration. Existing clients, servers, SDKs, and hosts do not gain support simultaneously.

> **Huahua in one sentence**
>
> The new MCP replaces connection-scoped sessions with self-describing requests, making horizontal server scaling substantially simpler.

> **Huahua's engineering note**
>
> Stateless is a deployment property, not a security guarantee; every tool call still needs identity, authorization, validation, quota, and approval checks.

## 1. What the stateless core changes

A client no longer has to complete a handshake before calling a method, and remote transport no longer depends on session affinity. Version, method, tool name, client information, and capabilities travel in headers and `_meta`. A client may use `server/discover` to inspect capabilities, but discovery is not required before every request.

Operational benefits include:

- no sticky-session requirement at the load balancer;
- workers can be replaced between requests, fitting autoscaling and serverless runtimes;
- transport state does not require a shared session store;
- losing one instance does not strand a connection-scoped session.

“Stateless core” does not mean the application has no state. Long-running tasks, user grants, quotas, approvals, and business transactions still need durable storage. They become explicit application resources rather than hidden transport state.

## 2. Tasks move asynchronous work beyond one connection

Tasks live in the `io.modelcontextprotocol/tasks` extension. For a compatible request, a server can return a task handle; the client can retrieve status or results through `tasks/get` and cancel through `tasks/cancel`, while the draft extension also defines `tasks/update`. The key separation is between the lifetime of a job and the timeout of one HTTP request.

Tasks are a contract, not a complete job system. A production server still owns:

- authorization scope and unguessable task identifiers;
- durable storage, retries, and idempotency;
- deadlines, cancellation semantics, and partial failure;
- result retention, deletion, and privacy policy;
- per-tenant concurrency, compute, token, and cost quotas.

For compilation, large queries, and long-running agent work, MCP describes how parties refer to the job. Queues, schedulers, and policy remain implementation responsibilities.

## 3. MCP Apps add interactive tool results

[MCP Apps](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) is an official extension. A tool can declare a `ui://` resource and a compatible host can render a chart, form, dashboard, or multi-step workflow in a sandboxed iframe. A standard bridge carries tool data and subsequent interactions between the View and host.

Host support varies, so a server should not assume every client renders an App. Tools need a meaningful structured fallback result. Security review should cover:

- iframe sandbox and Content Security Policy;
- origin and schema validation for bridge messages;
- renewed authorization when the UI triggers a tool;
- sanitization of HTML, URLs, external assets, and user input;
- core functionality when the host lacks App support.

Apps make sense for genuinely interactive results, not as compulsory packaging around every text tool.

## 4. Authorization and deprecations

The release moves toward Client ID Metadata Documents (CIMD), deprecates Dynamic Client Registration, and binds credentials to the issuer that minted them. Roots, Sampling, Logging, and legacy HTTP+SSE also enter a deprecation window; the release notes describe at least a twelve-month offramp.

That is not a mandate to remove every legacy capability immediately. Inventory first:

1. Protocol versions actually announced by each client and server.
2. SDK support for 2026-07-28.
3. Dependencies on session IDs, roots, sampling, logging, or SSE.
4. Host support for Tasks and Apps—not merely SDK compilation.
5. Authorization-server support for client metadata and issuer binding.

## 5. A staged enterprise migration

| Stage | Main action | Acceptance evidence |
| --- | --- | --- |
| Inventory | Record client, server, SDK, transport, and extensions | Complete dependency map |
| Dual testing | Run legacy and 2026-07-28 contract tests | Success, error, and timeout behavior per tool |
| State extraction | Turn implicit sessions into tasks or business state | Any instance can process a later request |
| Security review | Test identity, authorization, quota, and audit | Cross-tenant and privilege-negative tests |
| Progressive rollout | Upgrade and roll back by client or tenant | Error rate, latency, task-completion metrics |

Local stdio servers may receive little benefit from stateless remote transport. Multi-tenant, multi-region, autoscaled MCP platforms have a much stronger architectural reason to migrate.

## 6. Problems MCP does not solve

MCP standardizes capability discovery, invocation, resources, and extensions. It does not prove that:

- a tool is semantically safe or resistant to prompt injection;
- the model selected the correct tool or parameters;
- the user may perform a high-impact action;
- retries are idempotent;
- results are true, complete, or compliant with data policy.

Before connecting MCP to an agent, establish a control plane using the [enterprise AI agent security guide](/en/blog/43-enterprise-ai-agent-security/) and evaluate tool choice and outcomes using the [AI Agent guide](/en/blog/64-ai-agent-guide/). For the responsibility boundary between Skills and MCP, read [four extension mechanisms for agentic development](/en/blog/29-agent-era-skills-subagents-commands-hooks/).

## Primary sources

- [MCP: The 2026-07-28 Specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- [MCP Apps official extension](https://apps.extensions.modelcontextprotocol.io/)
- [MCP Tasks official extension](https://tasks.extensions.modelcontextprotocol.io/)
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2026-07-28)
