---
stableId: "url:https://aws.amazon.com/blogs/machine-learning/implementing-defense-in-depth-authorization-for-mcp-tools-on-amazon-quick/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-18
lastVerifiedAt: 2026-09-18
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 3
  engineeringValue: 5
  archiveFit: 5
  total: 23
decision: "write-now"
---

# Implementing defense-in-depth authorization for MCP tools on Amazon Quick

## Identity

- Search window: Strict 72-hour scan ending 2026-09-18; the AWS post was dated 2026-09-17.
- Discovery queries: Amazon Quick MCP authorization Entra ID; AgentCore Gateway custom JWT interceptor; MCP tool allowlist group RBAC.
- Canonical URL: https://aws.amazon.com/blogs/machine-learning/implementing-defense-in-depth-authorization-for-mcp-tools-on-amazon-quick/
- Publisher or author: AWS Machine Learning Blog.
- Published or updated date: 2026-09-17.
- Source type: Engineering blog and vendor reference architecture.
- Direct supporting sources:
  - https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/
  - https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow

## Editorial fit

- Why now: An authenticated MCP request can still be unauthorized for a particular tool, tenant, country, or write operation. This walkthrough makes that distinction concrete at the gateway and tool boundary.
- Reader question: Where should an enterprise agent re-check identity, scope, and policy before an MCP call causes an external side effect?
- Category and topic cluster: Cloud & Platform / ai-platform-governance.
- Existing coverage and duplication risk: Medium. Existing coverage addresses OAuth consent, MCP governance, and tool-boundary reliability; this candidate adds a concrete multi-gate authorization path for an enterprise assistant.
- Why this remains useful after the current news cycle: Claim checks, group-to-role mapping, allowlists, server-side reauthorization, and audit records are durable controls even as AWS product names change.

## Claim map

- Primary claim: The reference design separates authentication from authorization and enforces four gates: IdP MFA, country geo-fencing through the ctry claim, group-based RBAC, and a tool allowlist.
- Measured evidence: The walkthrough connects Microsoft Entra ID OIDC and PKCE with RFC 8707 resource indicators, AgentCore Gateway CUSTOM_JWT validation, a Lambda REQUEST interceptor, a second server-side tool check, and tenant-keyed DynamoDB audit records. A denied call stops before the tool executes.
- Vendor or author claims requiring qualification: This is a vendor-authored architecture for a fictional enterprise. The code snippets and configuration demonstrate a possible flow, not proof of policy completeness or security effectiveness.
- Bloss0m engineering consequence: Make authorization a stateful contract that carries principal, token claims, policy version, tenant, tool operation, requested resource, decision, and audit identifier across gateway and tool boundaries.

## Evidence audit

- Primary evidence inspected: The dated AWS post and the linked AWS and Microsoft identity documentation for the described configuration.
- Baseline or comparison: The useful comparison is one gateway authentication check versus defense-in-depth rechecks at the interceptor and tool service; no controlled baseline is measured.
- Missing evidence: No public runnable repository, independent penetration test, policy-conflict analysis, authorization latency, false-denial rate, revocation test, or production outcome is supplied.
- Conflicts or uncertainty: The design assumes an existing Amazon Quick, AgentCore, Microsoft Entra, and DynamoDB deployment. Resource indicators, optional claims, group limits, and product defaults must be re-verified before implementation.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “MCP auth 之後還有四道 authorization gate：把 JWT、group、tool allowlist 與 server-side recheck 串成可審計流程。”
- Internal routes: Link to AgentCore Consent Portal, MCP middleware security, delegated authorization, and tool-call workflow reliability.
- Human decision required: Keep the article as an architecture teardown with a policy-decision sequence diagram; do not present the AWS example as an independently audited security blueprint.
