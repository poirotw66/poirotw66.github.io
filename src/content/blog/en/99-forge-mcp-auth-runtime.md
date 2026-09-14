---
title: "Forge v0.18.1: Open-Source Multi-User MCP Auth and Agent Governance"
description: "A runtime-contract analysis of how Forge v0.18.1 connects multi-user MCP identity, OAuth consent, tenancy, policy, egress, and per-invocation audit—and where independent evidence is still missing."
pubDate: 2026-09-14
updatedDate: 2026-09-14
tldr:
  - "The important change in Forge v0.18.1 is not an MCP login button; it separates user and agent principals into two observable token and connection paths."
  - "`auth.type: user` uses `{subject, server}` for lazy consent and a per-user connection pool, while `type: platform` or 2LO lets the agent act as a service identity."
  - "OAuth 2.1 discovery/DCR, PDP/DEFER, SOCKS5/private-CIDR egress, and audit attribution form a runtime boundary, not a production-security certificate."
  - "Adoption should test consent, TTL/revocation, cross-tenant isolation, bypasses, load, and recovery first; `forge try` is only a local onboarding smoke test."
audience:
  - "Engineers responsible for agent runtimes, MCP integrations, or AI platform governance"
  - "Architects and security teams bringing an open-source runtime into multi-tenant or production environments"
category: "AI Engineering"
tags: ["AI Agent", "MCP", "Enterprise AI", "Governance", "Platform Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 32
kind: "article"
showToc: true
image: "/blog/99-forge-mcp-auth-runtime/title_image.webp"
---

Forge v0.18.1 was released on August 20, 2026. The official [v0.18.1 release notes](https://github.com/initializ/forge/releases/tag/v0.18.1) position the release around delegated per-user MCP auth, OAuth 2.1 discovery/DCR, `forge try`, and a set of runtime capabilities for egress, approvals, PDP, and audit. The interesting question is not simply whether MCP has OAuth. It is: **when one agent runtime serves many people, which principal obtains the token, who gives consent, which connection executes the call, which policy decides, and whether the invocation can be reconstructed as one audit trail?**

This article separates three levels of evidence. Release notes and the changelog are official claims from the Forge maintainers. The documentation and source at the v0.18.1 tag are inspectable implementation details. The question of whether the design fits a production boundary is a Bloss0m engineering inference. Open source makes inspection and testing possible; it is not proof of an independent security audit or coverage of every multi-tenant threat model.

> **Huahua in one sentence**
>
> Forge v0.18.1 is not mainly about giving agents more authority; it turns “under which identity, through which consent gate, over which connection” into a runtime contract.

## Separate the user principal from the agent principal

Most MCP examples have one server credential, so “the agent called a tool” appears to be one event. A multi-user deployment has at least two principals: the agent principal representing the service, and the user principal behind the current request. If they share a token or connection, an audit trail has difficulty answering who authorized a write.

Forge v0.18.1 writes this boundary into the server definition through `auth.type`. The following is a shortened illustration based on the official [MCP configuration reference](https://github.com/initializ/forge/blob/v0.18.1/docs/mcp/configuration.md), not a complete copy-paste configuration:

```yaml
platform:
  token_endpoint: ${INITIALIZ_TOKEN_ENDPOINT}
  agent_identity: ${FORGE_PLATFORM_TOKEN}
  authorize_endpoint: ${INITIALIZ_AUTHORIZE_ENDPOINT}

mcp:
  servers:
    - name: vendor-read
      url: https://mcp.example.com/read
      auth: { type: platform, ref: vendor.tools }
      required: true
    - name: vendor-write
      url: https://mcp.example.com/write
      auth: { type: user, ref: vendor.tools }
      required: false
      tools:
        schemas: []
```

| Boundary | `auth.type: user` | `auth.type: platform` or `oauth` + `client_credentials` |
| --- | --- | --- |
| Token principal | The user subject extracted from the authenticated request; managed mode delegates to the platform broker | The Forge agent identity or the OAuth client itself |
| Connection | One lazy connection per requesting subject; subjects do not share it | Usually established at startup and reused as a service connection |
| Consent/startup | A missing grant enters auth-required; `required: true` is not valid | No per-user delegated consent; `required: true` can be valid |
| Token failure | 401/403/404 means a delegated grant is not available and triggers the gate | A credential or protocol failure is handled under the service identity |

This distinction creates an easy-to-miss configuration rule: `type:user` has no user token or live connection available at startup, so `tools.schemas` must be supplied ahead of time. Forge can materialize the schema from a registry and register the tool; the real per-user connection is established on the first call. The schema is a deployment-time snapshot. If the upstream MCP server changes its tools, it must be materialized again or redeployed; it is not automatically rediscovered on every call.

`ref` is not a username. It is the key in the platform tool registry, defaulting to the server name when omitted. `type: platform` calls the platform token endpoint with an agent credential. `type:user` adds `subject`, allowing the platform to decide whether that user has a grant. These are genuinely different authorization paths: “the agent acts for the user” versus “the agent acts as its service identity.”

## OAuth 2.1 discovery/DCR is a login-time protocol, not per-request authorization

Standalone `forge mcp login` resolves explicit configuration first, then a persisted registration, and only then discovery. The inspectable v0.18.1 implementation roughly connects these steps:

1. It uses RFC 9728 protected-resource metadata to find the authorization server. Metadata may come from a well-known URL or from `WWW-Authenticate: resource_metadata` on a 401 response.
2. It uses RFC 8414 authorization-server metadata, with an OpenID Connect configuration fallback when needed, to find authorize, token, and registration endpoints.
3. If the server supports RFC 7591 DCR, the first login uses a public PKCE client, persists the client ID and resolved endpoints in encrypted form, and deliberately does not persist a client secret; a confidential registration is rejected fail closed.
4. If there is no registration endpoint and no explicit `client_id`, login fails instead of guessing a client or relaxing validation. Headless refresh does not start discovery unexpectedly.

This flow serves interactive standalone login. Managed `auth.type: user` does not rediscover OAuth from every runtime pod; it calls the platform's token and authorize broker. The platform owns the provider callback, refresh token, and tenancy rules. Forge receives a short-lived access token; the documentation explicitly says that a refresh token should not be returned through the Forge endpoint.

For a standalone agent principal, `auth.type: oauth` with `grant: client_credentials` is a separate 2LO path. It requires an explicit `client_id`, `client_secret_env`, and `token_url`, does not open a browser, and has no per-user consent. “Supports OAuth discovery” therefore does not mean that every MCP call has an end-user identity.

## Four runtime components: resolver, gate, pool, and audit

### 1. The resolver separates user and agent tokens

The managed token endpoint receives `{server: ref}` for an agent principal or `{server: ref, subject}` for a delegated user. The request carries the platform agent identity as a bearer token, plus optional `Org-Id` and `Workspace-Id` tenancy headers. The endpoint returns `access_token` and an optional `expires_in`; if it is omitted, Forge defaults to five minutes.

The v0.18.1 `SubjectTokenStore` is an in-process memory cache by default. It stores access tokens, not refresh tokens; expired entries are evicted, and refresh begins roughly 30 seconds early. Delegated tokens also have a five-minute cache TTL cap. Even if the provider grants a longer lifetime, Forge asks the platform to re-evaluate the grant within that window. This is a useful disconnect bound, but it is not a guarantee of immediate revocation: downstream, platform, cache, and replica behavior still need testing.

If the deployment has multiple replicas or needs grants to survive restarts, it should use a shared or durable store and test token rotation, cross-replica misses, and revocation. `${VAR}` endpoint and identity values are expanded at request/use time, so a rotated platform secret need not require a full runtime restart. That still does not solve secret-manager, audit-redaction, or process-memory risks by itself.

### 2. The auth gate makes “not authorized yet” resumable

When the delegated token resolver receives 401, 403, or 404, Forge classifies it as `ErrNoToken` instead of treating the tool call as permanently failed. The auth gate deduplicates on `{subject, server}`: the first waiter marks the task `auth-required`, emits one `mcp_auth_required` event, and delivers consent; concurrent calls for the same subject and server share the gate. The default wait is ten minutes.

`POST /mcp/consent` accepts an authenticated `{subject, server, granted}` signal and no token. The platform should send `granted:true` only after its token endpoint can return the access token. Forge then re-resolves the token and wakes all parked calls. `granted:false` fails waiting calls quickly; timeout and cancellation produce their corresponding audit events. This separates “the user completed provider OAuth” from “a particular tool operation should be allowed.”

### 3. The subject pool binds identity to the connection

The `subjectConnPool` is not a larger shared connection cache. It means one independent MCP connection for each user subject. The first use runs the factory and `Initialize` under that subject's auth identity; later calls reuse it. A burst for one subject is merged through single-flight so it opens one connection, while distinct subjects do not block one another. A connection error can trigger `Evict`, allowing the next call to establish a fresh connection; `Close` tears down all subject connections.

The implementation also uses a background-derived context and an establishment timeout of about 30 seconds. That keeps one caller's cancellation from tearing down a shared establishment that other callers are waiting for. It is a meaningful concurrency contract, but it also means an MCP server that treats connection state as a user session must be tested for identity binding, reconnect semantics, and cross-pod routing. A 200 from the token endpoint is not enough.

### 4. Audit joins the invocation without becoming a content archive

MCP tool call/result, auth required/resolved/timeout, PDP decision, DEFER, and egress allowed/blocked events can share a correlation ID, task ID, and invocation-scoped monotonic sequence. MCP tool audit records argument size, result size, duration, and reason by default; it does not write complete arguments or results into the audit stream. That reduces data exposure, but means that replay requires separately controlled evidence.

There is one important exception to keep visible: raw SOCKS5 has no `Proxy-Authorization` identity channel when it runs without authentication. Its egress audit can reliably record host, port, and allow/deny, but cannot guarantee task or invocation attribution for every socket. If compliance requires every outbound socket to map to a user and task, this path must be restricted or extended.

## The full lifecycle of one delegated MCP tool call

Putting the components together gives a testable runtime contract:

1. **Create request context.** The inbound request is authenticated. Forge takes the email, when available, or an opaque user ID as the subject, and carries org/workspace, task, correlation, and invocation IDs.
2. **Select a namespaced tool.** The agent sees a registered MCP tool. A name such as `server__operation` is a routing identity, not authorization by itself.
3. **Run execution policy first.** The runner's hook order includes guardrails, intent alignment, step-up, and then managed PDP or static DEFER. PDP returns `allow`, `deny`, or `defer`; transport timeout, malformed response, or an unknown decision fails closed, with at most one transport retry.
4. **If deferred, stop at action approval.** Static DEFER uses task ID and a tool allowlist, with approval or rejection through `POST /tasks/{id}/decisions`. It asks whether this high-risk tool action may run now, not whether the Agent may log into the MCP server as a user.
5. **Resolve the user credential.** For `type:user`, Forge checks the subject token store. On a miss it calls the platform token endpoint with the agent bearer, `server`, `subject`, and tenancy headers. 401/403/404 means that a grant is not available and moves to the next step; other protocol failures should surface as errors.
6. **Enter the auth-required gate.** The gate merges concurrent waiters by `{subject, server}`, updates task state, and delivers the platform's authorize URL or another consent prompt. The URL is opaque delivery; Forge should never see the provider authorization code or refresh token. When the default ten-minute gate expires, parked calls fail with `mcp_auth_timeout`.
7. **Resolve again after consent.** After the user completes the platform-owned OAuth callback, the platform places the delegated access token in its own custody and calls the authenticated `POST /mcp/consent`. Forge wakes and fetches the token again rather than trusting the grant signal forever.
8. **Create or reuse the subject connection.** The pool lazily initializes the MCP server under that subject's credential, then performs the tool call. All MCP HTTP, token, and authorize traffic uses the same egress controls; raw TCP is constrained by SOCKS5 port and CIDR rules.
9. **Close the invocation.** Policy, auth-gate, egress, tool-result, and task outcome events are joined by correlation, task, and sequence. When content evidence is needed, use a separately controlled trace rather than assuming the audit event contains the complete tool payload.

The ordering matters. Managed `BeforeToolExec` PDP runs before MCP tool execution; the MCP auth gate sits inside the MCPTool resolve-to-CallTool sequence. A PDP `allow` therefore means only that policy permits entry into the tool path. It does not mean that the user has completed MCP consent, or that the downstream server will accept the subject's token.

## Gate, DEFER, and PDP are three different decisions

Calling all three “approval” mechanisms makes rollout ambiguous. The v0.18.1 documentation and source distinguish them like this:

| Mechanism | Key | Question | Typical outcome |
| --- | --- | --- | --- |
| MCP auth gate | `{subject, server}` | Has this user authorized the Agent to connect to this MCP server as them? | Grant/reject/timeout; one grant can wake parked calls for that subject/server |
| Static DEFER | `taskID`, plus a tool allowlist | Does this task's high-risk tool action need human approval right now? | Approve/reject within the task |
| Managed PDP | Agent, task, invocation, tool, and parsed arguments | Does the current policy context allow, deny, or defer this tool call? | `allow`/`deny`/`defer`; failures default-deny |

The runner uses one decision source: when `security.pdp.enabled`, the managed PDP wins and the static `security.defer.tools` map is ignored. Do not assume that two rule sets are automatically combined. Also note that the v0.18.1 PDP request represents `caller.subject` as `agent:<agentID>`, not the inbound end-user subject; the user subject primarily drives delegated token resolution. The engineering inference is straightforward: if the PDP must enforce per-user authorization, user and tenant identity need to be explicitly carried into and validated in the policy context. “PDP enabled” alone is not evidence of that mapping.

The PDP also receives the full parsed arguments. That supports precise policy, but sends sensitive data outside the runtime pod. The PDP endpoint should be internal and TLS-protected, with redaction or schema-aware handling for secrets, personal data, and large payloads. The fact that MCP audit does not record full arguments does not mean the PDP cannot see them.

## Egress is part of the auth boundary

Forge puts the MCP server, OAuth discovery/authorize hosts, platform resolver host, and MCP HTTP traffic behind an egress-controlled client. The HTTP forward proxy and optional SOCKS5 raw TCP listener share the SafeDialer matcher. Private CIDRs can narrow the allowed space; cloud metadata and loopback are always blocked; malformed CIDRs fail during configuration loading.

SOCKS5 allowlists use host:port or a wildcard plus an exact port. There is a practical trap here: HTTP `allowed_hosts` are port-agnostic. Listing `api.example.com` to allow HTTPS can also expose that hostname through SOCKS5 on other TCP ports. When port-level control matters, specify `allowed_tcp` explicitly and test wildcards, DNS, redirects, and private IPs together. `socks5h://` forces server-side DNS resolution; even if a client resolves locally first, SafeDialer should still block disallowed IPs and private CIDRs.

This makes “where can the runtime connect?” part of the contract, but it does not answer “may this user call that API?” Egress allow, MCP delegated token, PDP allow, and downstream service authorization are four different gates and should remain separate in tests and audit analysis.

## Rollout and migration checklist

- [ ] Map the principal for every MCP server: which read/write operations require end-user delegation, and which only need the agent's service identity.
- [ ] Use `required:false` for `type:user`; materialize and version `tools.schemas` ahead of time; test stale schemas, renamed tools, and upstream capability changes.
- [ ] Contract-test the token endpoint: agent/delegated request bodies, `Org-Id`/`Workspace-Id`, 401/403/404, `expires_in`, secret rotation, and the rule that only an access token—not a refresh token—is returned.
- [ ] Choose managed or standalone consent. For managed mode, verify platform callback, grant persistence, delivery channel, and tenant binding. For standalone mode, specifically test whether a single-use, expiring, session-bound consent capability link can leak.
- [ ] Test gate fan-out for one subject/server, grant/reject races, timeout, caller cancellation, restart, and multiple replicas. Do not rely on the default in-memory token store when state must cross pods.
- [ ] Verify the five-minute delegated TTL cap and downstream-401 eviction/reconnect behavior. Treat “short-lived” as a measurable property, not a replacement for a revocation SLA.
- [ ] Choose one policy source: PDP or static DEFER. Test allow/deny/defer, fail closed, approver allowlists, redaction of full arguments, and whether user identity truly reaches the policy context.
- [ ] Test HTTP and SOCKS5 independently for host, port, private CIDR, metadata/loopback, DNS, redirects, and audit attribution. If per-invocation socket attribution is required, restrict raw unauthenticated SOCKS5 or add an identity channel.
- [ ] Establish a local smoke baseline with `forge try --audit`, then test the real MCP flow in staging across consent, token, pool, policy, egress, and recovery. Do not treat `forge try` success as multi-tenant security evidence.

## Failure modes and operational trade-offs

| Failure mode | v0.18.1 path | Operational trade-off |
| --- | --- | --- |
| Delegated endpoint returns 401/403/404 | Classified as `ErrNoToken`, parked at the `{subject, server}` gate, and failed after timeout | The user experience is resumable, but consent delivery and timeout semantics must be reliable; not every 404 should hide a protocol error |
| Consent signal arrives before the token is available | Resume re-resolves; if the token is still absent, the call waits or fails again | Grant notification and token custody need ordering guarantees, or users see “approved but still blocked” |
| Token is revoked or downstream returns 401 | Cache TTL and connection eviction let the next call obtain a fresh token | A five-minute cap reduces the stale window but increases token-endpoint traffic; test that the pool cannot keep sending a revoked token |
| Multiple replicas use the default in-memory store | Each process sees only its own token, gate, and connection state | Simpler deployment trades away restart and cross-pod consistency; a shared store adds encryption, locking, and its own failure modes |
| PDP times out, returns malformed data, or uses an unknown decision | Default-deny, with at most one transport retry | Fail-closed behavior protects the boundary but reduces availability during PDP incidents; denial reasons need to be observable |
| PDP and static DEFER are both configured | Static map is ignored while PDP is enabled | A configuration can look more complete while operators assume two approvals are active; CI should enforce one decision source |
| DCR has no registration endpoint or accepts only a confidential client | Discovery/login fails closed | Interoperability is lower, but login success should not require persisting an unknown callback or client secret |
| `allowed_hosts` unintentionally widens SOCKS5 ports | The HTTP hostname allowlist can cross into arbitrary TCP ports | Convenience and precise isolation pull in opposite directions; high-risk services should use explicit `allowed_tcp` boundaries |
| Raw SOCKS5 has no invocation identity | Audit still records host, port, and decision, but not guaranteed task/user attribution | Network reachability and compliance traceability must be evaluated separately; restrict raw access or strengthen the upstream proxy |

## `forge try` is an onboarding ladder, not an auth security test

The value of `forge try` is that engineers can see the Forge runtime quickly, not that multi-user MCP has been proven. The official CLI reference describes a keyless demo agent that starts in under a minute, includes a weather skill and the built-ins `http_request`, `datetime_now`, and `math_calculate`, and uses the same tool registry, egress, audit, and progress hooks as `forge run`. It runs in-process without starting an A2A server, daemon, or port.

Start with:

```bash
forge try
forge try --audit
forge try --once "what's 17% of 4,200?"
forge try --keep
```

Credential resolution checks explicit flags, environment API keys, saved OpenAI OAuth, local Ollama, and then a picker. Unless `--keep` is used, the temporary workspace is not meant to remain on disk. To exercise `auth.type:user`, keep the local configuration, add a test MCP server, and deliberately run the full path: no grant, consent, token, per-user connection, and tool call. Even a successful smoke test proves only that the local happy path runs; it says nothing about bypasses, tenant load, replica recovery, or an independent security review.

## Limitations: inspectable code is not proven production security

This article statically analyzed the v0.18.1 release, changelog, repository documentation, and tagged source. It does not turn maintainer descriptions into external verification. Several boundaries must remain explicit:

- There is no independent security audit, public penetration or bypass report, or complete threat-model coverage.
- There is no published evidence for multi-tenant load, token leakage, replica restart, gate recovery, connection isolation, or provider interoperability.
- The standalone consent link is documented as a bearer capability. If delivery or the link leaks, it can create a wrong subject association. A managed, platform-owned callback narrows that boundary, but the deployment still has to verify tenant, session, and delivery binding.
- The v0.18.1 PDP request represents the caller subject as an agent principal. Whether that is enough for end-user authorization cannot be inferred from “PDP enabled”; inspect the adapter and policy input.
- Open source exposes the resolver, gate, pool, egress, and audit control points. It does not guarantee that the upstream provider, deployment configuration, secret store, network, or downstream API is safe.

The most defensible positioning for Forge v0.18.1 is therefore an open-source baseline that makes multi-user MCP authorization and agent governance legible as a runtime contract. It is useful for architecture spikes and contract tests. Production adoption still has to satisfy the team's own threat model, tenant model, SLOs, and incident response obligations.

## Further reading

- [The complete AI Agent guide: from models to governable agent systems](/en/blog/64-ai-agent-guide/)
- [Model Context Protocol (MCP): specification and implementation context](/en/blog/34-model-context-protocol-mcp/)
- [Enterprise AI agent security: tools, permissions, and execution boundaries](/en/blog/43-enterprise-ai-agent-security/)
- [The agentic AI platform contract: connecting capability, policy, and evidence](/en/blog/93-agentic-ai-platform-contract/)

## Sources and evidence boundary

- [Forge v0.18.1 release notes](https://github.com/initializ/forge/releases/tag/v0.18.1)
- [Forge changelog](https://useforge.ai/changelog/)
- [Forge repository](https://github.com/initializ/forge)
- [Delegated consent documentation at the v0.18.1 tag](https://github.com/initializ/forge/blob/v0.18.1/docs/mcp/delegated-consent.md)
- [MCP configuration reference at the v0.18.1 tag](https://github.com/initializ/forge/blob/v0.18.1/docs/mcp/configuration.md)
- [Per-subject connection pool implementation](https://github.com/initializ/forge/blob/v0.18.1/forge-core/mcp/subject_pool.go)
- [Auth gate implementation](https://github.com/initializ/forge/blob/v0.18.1/forge-cli/runtime/mcp_authgate.go)
- [Managed PDP resolver](https://github.com/initializ/forge/blob/v0.18.1/forge-cli/runtime/pdp_resolver.go)
- [Egress control documentation](https://github.com/initializ/forge/blob/v0.18.1/docs/security/egress-control.md)
- [Forge CLI reference for `forge try`](https://github.com/initializ/forge/blob/v0.18.1/docs/reference/cli-reference.md)
