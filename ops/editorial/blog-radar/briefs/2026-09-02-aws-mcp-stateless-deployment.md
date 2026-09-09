---
stableId: "url:https://aws.amazon.com/blogs/architecture/mcp-went-stateless-is-your-aws-mcp-server-deployment-well-architected/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-02
lastVerifiedAt: 2026-09-02
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 5
  total: 24
decision: "write-now"
---

# MCP went stateless：把 2026-07-28 protocol migration 變成部署檢查表

## Identity

- Search window: strict 72-hour scan from 2026-08-30 00:30Z to 2026-09-02 00:30Z.
- Discovery queries: `AWS MCP went stateless`; `MCP 2026-07-28 migration sessionless`; `MCP conformance stateless server deployment`.
- Canonical URL: https://aws.amazon.com/blogs/architecture/mcp-went-stateless-is-your-aws-mcp-server-deployment-well-architected/
- Publisher or author: Amazon Web Services Architecture Blog.
- Published or updated date: 2026-09-01
- Source type: engineering-blog
- Direct supporting sources:
  - MCP 2026-07-28 changelog: https://modelcontextprotocol.io/specification/2026-07-28/changelog
  - MCP conformance repository: https://github.com/modelcontextprotocol/conformance

## Editorial fit

- Why now: The post translates a protocol-level change—removing the session-oriented handshake and `Mcp-Session-Id` assumptions—into reliability, auth, tracing, caching, and migration work.
- Reader question: What breaks when an MCP server becomes stateless, and which state must be made explicit in application data, tokens, or continuation handles?
- Category and topic cluster: AI Engineering / ai-agent.
- Existing coverage and duplication risk: Complementary to the existing MCP governance and runtime candidates. The differentiator is deployment architecture and conformance, not another protocol announcement.
- Why this remains useful after the current news cycle: Session handling, idempotent retry, trace context, issuer validation, and cache-scope choices remain operational concerns for every MCP deployment.

## Claim map

- Primary claim: Stateless MCP removes protocol session state and shifts deployment responsibility toward request-scoped context, explicit application state, safe retry, and observable boundaries.
- Measured evidence: The MCP changelog enumerates removed session behavior and new protocol surfaces; the conformance repository exposes versioned client/server scenarios; AWS supplies concrete security, reliability, observability, and migration guidance.
- Vendor or author claims requiring qualification: AWS Well-Architected mapping is expert guidance, not a field study. The presence of a conformance suite does not demonstrate that a particular server is production-safe.
- Bloss0m engineering consequence: Audit every reliance on sticky sessions or server-side session stores, add request IDs and W3C trace context, make continuation state explicit, test idempotency, and validate cache scope across tenants.

## Evidence audit

- Primary evidence inspected: AWS Architecture Blog, MCP protocol changelog, and official conformance repository.
- Baseline or comparison: Session-oriented MCP lifecycle versus the 2026-07-28 stateless lifecycle; implicit server state versus explicit application tokens and datastore IDs.
- Missing evidence: No independent migration failure rate, throughput/latency comparison, security-bypass rate, or production conformance report.
- Conflicts or uncertainty: The blog’s recommendations are AWS-authored and some guidance is deployment-specific. Subscription/listen, MCP Apps, deprecations, and multi-tenant cache behavior need separate review rather than a blanket “stateless is simpler” conclusion.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “MCP 變 stateless 之後，真正增加的是責任：用一條 migration checklist 重新檢查 session、retry、trace、auth、cache 與 conformance。”
- Internal routes: Existing MCP, agent security, and cloud platform routes after archive-aware lookup.
- Human decision required: Approve a protocol-to-operations explainer; distinguish normative spec changes from AWS recommendations and call out the conformance boundary.
