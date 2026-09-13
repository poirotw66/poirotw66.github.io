---
stableId: "url:https://github.com/openai/tunnel-client"
status: "durable-post-candidate"
firstSeenAt: 2026-09-10
lastVerifiedAt: 2026-09-10
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 4
  total: 24
decision: "write-now"
---

# OpenAI Secure MCP Tunnel：讓私有工具留在內網，卻能被 agent 使用

## Identity

- Search window: 24–72-hour scan ending 2026-09-10; the repository activity was verified on 2026-09-09.
- Discovery queries: `OpenAI Secure MCP Tunnel`; `openai tunnel-client private MCP server`; `MCP outbound-only connector agent security September 2026`.
- Canonical URL: https://github.com/openai/tunnel-client
- Publisher or author: OpenAI / openai/tunnel-client maintainers.
- Published or updated date: 2026-09-09 repository update; this is a repository activity date, not a versioned release date.
- Source type: repository.
- Direct supporting sources:
  - OpenAI Secure MCP Tunnel guide: https://developers.openai.com/api/docs/guides/secure-mcp-tunnels
  - Project repository: https://github.com/openai/tunnel-client

## Editorial fit

- Why now: The client turns a common enterprise MCP dilemma into an inspectable runtime: the MCP server can remain private or localhost-only while a customer-run process maintains an outbound HTTPS tunnel to OpenAI services.
- Reader question: How can an agent call internal tools without exposing an inbound firewall port or handing every credential to a hosted control plane?
- Category and topic cluster: Cloud & Platform / ai-platform-governance.
- Existing coverage and duplication risk: The ledger has OpenAI model-safety and inference candidates, but no Secure MCP Tunnel entry. Avoid another model announcement; focus on network directionality, customer-run ownership, permissions, health endpoints, and the operator boundary.
- Why this remains useful after the current news cycle: Private tool connectivity, least-privilege permissions, health checks, and auditability remain architecture decisions even when the model or client changes.

## Claim map

- Primary claim: OpenAI's tunnel-client provides a customer-run connector that keeps private MCP servers off the public internet while exposing them to ChatGPT, Codex, the Responses API, and AgentKit through an OpenAI-hosted tunnel.
- Measured evidence: The public repository documents the Go client/SDK, outbound tunnel behavior, `/healthz`, `/readyz`, `/metrics`, and `/ui` operator surfaces, installation, tests, SBOM verification, permissions, deployment, and protocol documentation. OpenAI's guide describes the outbound HTTPS path and the model-request/response forwarding sequence.
- Vendor or author claims requiring qualification: The repository and guide establish the intended design and shipped code surface; they do not independently measure latency, availability, credential-broker compromise resistance, or production incident rates.
- Bloss0m engineering consequence: Treat a hosted MCP tunnel as a security boundary with explicit trust ownership. Document which side holds credentials, which requests are allowed, what metadata is observable, and how liveness/readiness failures affect agent behavior.

## Evidence audit

- Primary evidence inspected: Official OpenAI repository, README, linked architecture/permissions/protocol documentation, and official Secure MCP Tunnel guide.
- Baseline or comparison: Private/localhost MCP server plus outbound-only tunnel versus exposing an inbound MCP endpoint on the public internet.
- Missing evidence: Independent security review, production scale data, failure-injection results, latency distributions, and a complete threat-model validation by an external party.
- Conflicts or uncertainty: The repository's 2026-09-09 timestamp is an update signal rather than a tagged release date. The article must pin the inspected commit or snapshot and distinguish documented behavior from security inference.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “MCP 不必公開：把 outbound-only connector、permissions、healthz 與 operator boundary 做成可驗證的企業 runtime contract。”
- Internal routes: Link to MCP governance, agent permissions, private networking, enterprise control planes, and provenance/audit trails.
- Human decision required: Approve a write-now article only if it includes a small network-boundary walkthrough and clearly labels the absence of independent production/security measurements.
