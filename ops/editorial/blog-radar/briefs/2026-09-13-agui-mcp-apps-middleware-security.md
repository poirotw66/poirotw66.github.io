---
stableId: "url:https://github.com/ag-ui-protocol/ag-ui/releases/tag/release/2026-09-10"
status: "durable-post-candidate"
firstSeenAt: 2026-09-13
lastVerifiedAt: 2026-09-13
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 4
  total: 24
decision: "write-now"
---

# AG-UI MCP Apps Middleware：把「能連上 MCP」變成可檢查的 proxy security contract

## Identity

- Search window: strict 72-hour scan ending 2026-09-13; the release was published on 2026-09-10 at 20:53 UTC.
- Discovery queries: `MCP middleware release`, `AG-UI MCP apps middleware`, `MCP proxy credential redirect session cleanup`.
- Canonical URL: https://github.com/ag-ui-protocol/ag-ui/releases/tag/release/2026-09-10
- Publisher or author: AG-UI Protocol maintainers.
- Published or updated date: 2026-09-10.
- Source type: Official GitHub release and package publication.
- Direct supporting sources: https://github.com/ag-ui-protocol/ag-ui; package `@ag-ui/mcp-apps-middleware@0.1.0` published from the release.

## Editorial fit

- Why now: MCP app integrations increasingly put a proxy between a client and a remote server. The operational risk is not only protocol compatibility; it is whether credentials, redirects, sessions, and blocked methods cross that proxy boundary safely.
- Reader question: What should an MCP app middleware guarantee before it forwards an authenticated request or opens a server session?
- Category and topic cluster: AI Engineering / agent runtime and MCP security.
- Existing coverage and duplication risk: Medium-low. Existing MCP governance coverage discusses allowlists, identity, and audit policy; this release adds transport-level proxy behavior, credential stripping, and session lifecycle semantics.
- Why this remains useful after the current news cycle: These rules belong in middleware tests and threat models even after the package version changes. They provide a checklist for any proxy that fronts MCP or other tool protocols.

## Claim map

- Primary claim: `@ag-ui/mcp-apps-middleware@0.1.0` hardens MCP app proxy behavior around credentials, redirects, method blocking, authentication forwarding, and failed-session cleanup.
- Measured evidence: The official release lists credential removal from public server hashes, forwarding of auth headers to HTTP/SSE transports, prevention of credential forwarding through redirects, early rejection of blocked proxy methods, bounded session cleanup, and failed-handshake release behavior. It also states the SDK requirement (`@modelcontextprotocol/sdk` 1.15.0) and that public server hashes now exclude credentials.
- Vendor or author claims requiring qualification: These are release-note implementation claims. The release does not provide an independent security audit, exploit corpus, compatibility matrix, or production incident data.
- Bloss0m engineering consequence: Treat middleware as a security boundary with explicit invariants: credentials never enter public identifiers, redirects cannot widen their destination, policy blocks happen before session creation, and failed sessions do not leak resources.

## Evidence audit

- Primary evidence inspected: The signed public GitHub release, package publication metadata, and the public AG-UI repository. The release records the exact package version, breaking changes, and implementation-facing behavior.
- Baseline or comparison: The release is a point-in-time change log rather than a benchmark. The relevant comparison is the prior middleware behavior implied by the listed fixes, not an independently measured baseline.
- Missing evidence: No latency or memory measurements, fuzzing results, third-party penetration test, cross-client interoperability matrix, or proof that every transport path applies identical credential rules.
- Conflicts or uncertainty: The release is one package inside a larger 32-commit repository release and requires MCP SDK 1.15.0. Consumers must verify the SDK and public-hash migration together; the release page does not quantify downstream breakage.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “MCP middleware 的真正產品不是 connector，而是 credential、redirect、session 與 policy block 的安全邊界。” Use a request lifecycle diagram and a small invariant table: before session, during forwarding, on redirect, and on failure.
- Internal routes: Link to existing MCP allowlist/governance and agent-security articles, plus RAG-MCP for the cost of exposing tools through a protocol.
- Human decision required: Confirm whether to frame this as an AG-UI release analysis or a broader MCP proxy security checklist; avoid claiming the release is a complete security audit.
