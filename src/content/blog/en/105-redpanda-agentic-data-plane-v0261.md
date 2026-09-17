---
title: "Redpanda Agentic Data Plane v0.2.61: Push Credentials, Context, and Write Authority to the Agent Boundary"
description: "A close reading of Redpanda Agentic Data Plane v0.2.61 and v0.2.60: credential passthrough, context estimates, activity filtering, Pylon capability gates, and the earlier v0.2.58 audit semantics."
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "v0.2.60 supports caller-supplied Authorization passthrough for OpenAI and compatible providers; ADP does not store the caller API key. That is not a guarantee about every log, proxy, provider, or client path."
  - "The agent inspector labels context usage as an estimate and separately shows model input and output limits. An estimate, reported usage, and cost-sorting scope must not become one number."
  - "v0.2.61 separates Pylon ticket updates, which require allow_writes, from customer replies, which require allow_writes plus allow_customer_replies."
  - "Activity filtering and sorting expand to all matching requests, while cost sorting still covers loaded requests. The v0.2.58 audit semantics also require policy decisions, MCP sessions, and actual calls to be read separately."
audience:
  - "Platform engineers responsible for agent runtimes, data planes, MCP governance, or model gateways"
  - "SRE and security teams that need to turn credential custody, context accounting, external writes, and audit trails into a policy contract"
category: "Cloud & Platform"
tags: ["AI Agent", "Enterprise AI", "Platform Engineering", "Governance", "Cloud Native"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 14
kind: "article"
showToc: true
image: "/blog/105-redpanda-agentic-data-plane-v0261/title_image.webp"
---

The risk in an agent data plane is often not the model’s answer. It is which credential reaches which provider, whether a context number is an estimate or a billing fact, which tool action can change the outside world, and what the audit trail actually records during an incident. Redpanda Agentic Data Plane (ADP) release notes for v0.2.60 on September 15, 2026 and v0.2.61 on September 16 put all four boundaries on the product surface.

The update is worth reading not because the release note proves every control is secure, but because it separates concepts that are easy to merge: caller credential passthrough is not ADP-managed API-key custody; a context estimate is not provider-reported token usage; Pylon write capability is not read permission; and activity filtering over all requests is not cost sorting over the entire history. If a platform collapses them into one “agent observability” metric, it loses the semantics needed at incident time.

> **Huahua's take**
>
> An agent data plane is mature when credential, context, capability, and audit events each state their owner, scope, source, time range, and failure semantics.

## The version difference first

| Version | Release-note change | Boundary to re-check in engineering |
| --- | --- | --- |
| v0.2.61 (2026-09-16) | Pylon filters, dates, teams, states, tags, and get_custom_fields; ticket updates require allow_writes; customer replies require allow_writes plus allow_customer_replies; connection errors identify missing or disabled states; issue pagination, date intervals up to 365 days, and attachments; GPT-6 Astra in model selection; cost-comparison UI | Whether capability reaches policy and audit; whether replies remain distinct from ticket updates; whether filters, pagination, and cost views have the same data scope |
| v0.2.60 (2026-09-15) | Authorization passthrough for OpenAI and compatible providers; callers can provide credentials and ADP does not store the API key; the agent inspector shows context estimates and model input or output limits; activity filtering and sorting expand to all requests | Caller-credential redaction across proxy, traces, retries, and providers; estimate versus reported usage; cost sorting still limited to loaded requests |
| v0.2.59 (2026-09-14) | The preceding release context on the same release page | Do not infer v0.2.61 capability gates onto an older build; pin the deployed version |
| v0.2.58 (2026-09-07) | Audit semantics: policies appear in evaluation order; outcomes are Denied, Masked, or Allowed; opening or keeping an MCP session is not a separate denial event unless refused; calls made remain recorded | Separate session lifecycle, policy outcome, and tool, LLM, or agent calls; do not treat historical versions as one event type |

The first lesson is version semantics. The v0.2.61 Pylon capability is a policy input connected to external side effects, not merely a UI checkbox. The v0.2.60 passthrough is also not a broad statement that every provider secret can never land anywhere. Before deployment, align the release-note statement, the actual build, configuration, proxy path, and log sinks.

## Credential passthrough: caller-supplied secrets still need a boundary

The central v0.2.60 change is Authorization passthrough for OpenAI and compatible providers. The caller supplies a credential, and ADP does not store the caller API key. That is a clearer boundary than centralizing every provider key in the platform, but it does not answer:

- Which hops see the credential between client, ADP, provider, retry queue, trace exporter, and error response?
- Does ADP retain the raw Authorization value in a request object, debug log, HTTP-header capture, span attribute, support bundle, or cache?
- Can a passthrough credential be copied by retry, stream reconnect, fallback provider, or asynchronous job?
- Does the provider retain headers, prompts, metadata, or usage records, and does the caller know the retention?
- How does policy distinguish “this caller may use this key” from “this agent task may carry the key to this provider”?

Therefore, read “ADP does not store the API key” as a scoped product fact: **inside the storage boundary described by ADP, the caller-supplied API key is not stored.** It is not a non-retention guarantee for the client, network, provider, observability pipeline, or third-party integration. The platform still needs header redaction, structured-log review, trace-sampling policy, error scrubbing, rotation, and negative tests.

I would represent the minimum passthrough audit record as:

| Field | Retain | Do not retain |
| --- | --- | --- |
| Caller identity | Tenant, workload, request principal, credential-owner type | Raw API key |
| Provider routing | Provider, model, endpoint class, policy decision | Authorization header |
| Credential provenance | Caller-supplied, vault reference, short-lived token, expiry class | Secret material |
| Execution | Request ID, retry count, fallback, latency, response status | Unscrubbed provider error body |
| Retention | Trace or log TTL, redaction version, deletion state | “Not stored” as a substitute for downstream retention analysis |

This schema is an engineering recommendation, not a complete Redpanda audit format. Its purpose is to preserve the boundary between a product fact and a local control, so that “ADP does not store it” is not later rewritten as “the whole call chain does not store it.”

## Context accounting: estimates, reported tokens, and limits are three numbers

The v0.2.60 agent inspector shows context estimates and separately displays model input and output limits. That distinction is useful because an agent runtime may only know an approximate context size before sending a request, while provider usage returned later is a different source of fact.

Keep at least three fields separate:

1. **Estimated context:** ADP estimates the visible messages, tool schemas, retrieved data, or payload. It may differ because of tokenizers, hidden prompts, serialization, or provider formatting.
2. **Reported input and output tokens:** provider response or usage events report request usage. They may not cover every byte ADP assembled before or after the provider call.
3. **Model limits:** provider or model metadata states input or output capacity. It is a constraint, not the amount consumed by this request.

If a dashboard merges them into one context bar, an operator cannot answer why an estimate stayed below the limit while the provider rejected the request, or why reported tokens differ from the internal payload. A trustworthy UI should expose source, timestamp, model version, tokenizer or estimator version, request scope, and confidence or unknown state.

### Context-estimate failure modes

- A tool schema is expanded at runtime and was not included in the estimate.
- Retrieval results are reranked, truncated, or compressed at the last moment.
- The provider uses a different tokenizer, so internal estimate and reported tokens are not directly subtractable.
- Hidden system instructions, safety wrappers, or Gateway metadata are outside the caller-visible payload.
- Streaming, retry, or fallback turns one user request into multiple provider requests.
- Model input or output limits change while the inspector cache remains stale.

An estimate is useful for preflight, warning, routing, or budget hints. It is not a billing source, complete byte-count evidence, or a guarantee that a request will succeed. If a context limit blocks a request, the policy should retain the limit source, evaluation time, and override reason.

## Activity filtering: all requests does not mean all costs

v0.2.60 improves activity filters and sorting across all requests rather than only the page currently loaded in the UI. This matters for incident response: an operator can filter by status, time, tokens, or latency across the matching request population instead of treating an unloaded virtualized-table page as nonexistent.

The release notes preserve a critical limitation: **cost sorting still covers loaded requests.** The filter and sort scopes are therefore not identical:

| View | Data scope | Good question | Question it should not answer |
| --- | --- | --- | --- |
| Status, time, token, and latency activity filters | All matching requests | Which requests in this period timed out or became expensive? | The complete cost ranking over all history |
| Cost sorting | Loaded requests | How do currently loaded results compare? | Which request was the most expensive globally? |
| Context estimate | Estimated input or output boundary | What should preflight or capacity policy warn about? | What should billing use as its source of truth? |
| Provider-reported usage | Provider-reported request usage | How should usage be reconciled? | How many bytes ADP assembled internally? |

This difference should remain visible in product documentation. If a label only says “sort by cost,” users can reasonably assume that every request is included. A more accurate label exposes loaded scope, query window, pagination, and freshness. If full-history cost sorting arrives later, the lineage from estimate to reported usage to cost calculation should remain explicit.

## Pylon capability gates: read, ticket mutation, and customer reply are different authority

The important v0.2.61 Pylon change is the separation of external-write actions:

- Ticket updates require allow_writes.
- Customer replies require allow_writes plus allow_customer_replies.
- Connection errors identify missing credentials or disabled connections.
- Filters can use date, team, state, tags, and get_custom_fields.
- Issue pagination, a maximum 365-day date interval, and attachments have clearer operational semantics.

This separation is valuable because “can read Pylon” and “can speak to a customer” are not all-or-nothing permissions. A customer reply is a stronger external side effect: it may trigger a notification, imply an SLA commitment, carry legal or contractual meaning, or create an irreversible outward communication record. An agent that can update an internal ticket must not automatically receive reply authority.

I would express the Pylon policy as a capability matrix:

| Action | Read connection | allow_writes | allow_customer_replies | Suggested extra control |
| --- | --- | --- | --- | --- |
| List or search tickets | Required | Not required | Not required | Tenant, team, and field scope |
| Update an internal ticket field | Required | Required | Not required | Field allow-list and before／after diff |
| Add an internal note | Required | Required | Not required | Author identity, redaction, idempotency |
| Reply to a customer | Required | Required | Required | Human approval, message preview, send audit |
| Bulk update | Required | Required | Not required | Maximum batch, dry run, rollback, and rate limit |

This matrix is a Bloss0m engineering synthesis, not a complete policy specification in the release note. The useful standard is that each action records caller, agent, tenant, target ticket, requested capability, policy result, approval, before／after state, provider response, and retry state. A single allow_writes flag without target scope and payload diff can still be too coarse.

## Audit semantics: policy decisions, sessions, and calls are different

The existing brief points to the v0.2.58 audit semantics on the same release-notes page. That section should not be overwritten by the v0.2.61 UI changes. Its important points are:

1. Policies are listed in evaluation order.
2. Each policy result is Denied, Masked, or Allowed.
3. Opening or keeping an MCP session is not treated as a separate denial event unless the action is refused.
4. Calls made remain logged so operators can see the MCP, LLM, or agent calls that were actually sent.

The trap is semantic compression. A session can be established without every later tool call being Allowed; a policy result does not prove that an external effect occurred. At minimum, separate:

| Event layer | Example | What it answers |
| --- | --- | --- |
| Session lifecycle | MCP session opened, kept alive, or refused | Was a channel established or blocked? |
| Policy evaluation | Policy name, order, Denied／Masked／Allowed | What did each rule do to which input? |
| Call execution | MCP, LLM, or agent call, latency, response | Which call was actually sent and what returned? |
| External effect | Pylon update, customer reply, provider side effect | Did the outside world change? |

If the four layers become one “request succeeded” event, incident response cannot distinguish masked input, denied call, allowed-but-provider-failed, allowed-and-external-write, and session keepalive. If the system logs only policy decisions and not calls made, it cannot confirm which allowed request led to a downstream action.

### Version differences in historical audit

The release page’s older v0.2.56 semantics provide historical context: the scope of records for MCP, LLM, and agent calls, denied calls, search, CSV or JSONL export, and non-backfilled history must not be treated as identical to the v0.2.58 session and policy semantics. During migration, compare the deployed build’s event schema, retention, query scope, and backfill policy before drawing a cross-version trend line.

## Connecting the four boundaries: how to interpret one request

Suppose an agent receives: “Read a Pylon ticket, update the internal priority, and reply to the customer.”

1. **Credential boundary:** the caller uses passthrough authorization; ADP does not store the API key, but logs, traces, and provider retention still need separate checks.
2. **Context boundary:** the inspector estimates the prompt, tool schema, and ticket payload. It shows an estimate, not provider-reported usage.
3. **Capability boundary:** reading the ticket needs no write capability; changing priority needs allow_writes; replying needs allow_customer_replies as well.
4. **Audit boundary:** record policy evaluation and outcome first, the actual call second, and the Pylon before／after or provider reference as an external-effect event.
5. **Recovery boundary:** if the reply fails after the update succeeds, a retry cannot assume the two actions were atomic. Use idempotency, effect references, and an operator policy for compensation or review.

The point is to avoid merging four different meanings of success: credential accepted, context within limit, policy Allowed, provider call returned 200, and external state committed. The release notes expose product controls; the enterprise still has to connect them into its own data contract.

## What the release note says, and what it does not prove

| Area | Supported by the official release notes | What this article does not infer |
| --- | --- | --- |
| Credentials | v0.2.60 supports Authorization passthrough for OpenAI and compatible providers; ADP does not store the caller API key | That client, proxy, provider, trace, and error paths never retain or leak it |
| Context | The inspector shows estimates and separates model input and output limits | That an estimate is billing truth, a complete byte count, or a success guarantee |
| Activity | Status, time, token, and latency filters or sorting cover all requests; cost sorting still targets loaded requests | That the cost view covers all history or every page |
| Pylon | Ticket updates require allow_writes; customer replies require both flags | That the flags complete tenant scope, approval, rollback, or payload redaction |
| Audit | v0.2.58 includes evaluation order, Denied／Masked／Allowed, and calls-made semantics | That cross-version events are directly comparable or every effect can be reconstructed from one event |

Vendor release notes are valuable implementation sources, not independent assurance reports. Adoption should still include secret-redaction tests, credential-replay tests, permission-bypass tests, context-estimate calibration, full-history query tests, Pylon negative tests, audit export and retention tests, and an incident drill.

## Where it fits in the Bloss0m archive

Start with the [AI agent guide](/en/blog/64-ai-agent-guide/) for the basic vocabulary of agent permissions. [GitHub MCP enterprise controls](/en/blog/87-github-mcp-enterprise-controls/) is a useful comparison for tool permission, credential boundaries, and audit. If you are designing a cross-provider platform contract, [Agentic AI platform contract](/en/blog/93-agentic-ai-platform-contract/) raises the schema, policy, and observability abstraction. [Unified Knowledge Graph RAG](/en/blog/101-unified-knowledge-graph-rag/) offers a different comparison point for context lineage and evidence accounting.

## Primary source and verification scope

- [Redpanda Agentic Data Plane release notes](https://docs.redpanda.com/agentic-data-plane/reference/release-notes/)

I checked the canonical release-notes page as of 2026-09-17, including the v0.2.61, v0.2.60, v0.2.59, and v0.2.58 entries. I use v0.2.56 only as historical audit context. This article preserves version, scope, and loaded-versus-all-request semantics; it does not turn a vendor-authored release note into independent evidence of security, accuracy, latency, retention, or production reliability.
