---
stableId: "url:https://github.com/lobehub/lobehub/releases/tag/v2.2.18"
status: "durable-post-candidate"
firstSeenAt: 2026-09-22
lastVerifiedAt: 2026-09-22
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 24
decision: "write-now"
---

# LobeHub v2.2.18：Self-hosted agent 平台開始把 Gateway、durable run 與 provenance 寫成部署契約

## Identity

- Search window: Seven-day scan ending 2026-09-22; the official release was published 2026-09-20.
- Discovery queries: `LobeHub v2.2.18 release gateway mode`; `LobeHub durable agent operation token provenance`; `LobeHub search capture migration`.
- Canonical URL: https://github.com/lobehub/lobehub/releases/tag/v2.2.18
- Publisher or author: LobeHub maintainers.
- Published or updated date: 2026-09-20.
- Source type: release-notes.
- Direct supporting sources:
  - Repository: https://github.com/lobehub/lobehub
  - Release history: https://github.com/lobehub/lobehub/releases

## Editorial fit

- Why now: This release is valuable because it exposes the wiring behind a self-hosted agent product: Gateway Mode defaults, JWKS/service tokens, gateway URLs, search-capture migrations, provenance fields, durable operation renewal, and recovery payloads.
- Reader question: Which deployment and state contracts must be explicit when an agent platform moves from a single process to a gateway-mediated system?
- Category and topic cluster: AI Engineering / ai-agent.
- Existing coverage and duplication risk: No LobeHub article was found in the bilingual archive or Radar ledger. Avoid a product tour; focus on the boundaries that make an agent run survive process, network, and data-state changes.
- Why this remains useful after the current news cycle: Gateway identity, run durability, provenance, and migration behavior recur in every self-hosted agent stack.

## Claim map

- Primary claim: v2.2.18 turns several previously implicit agent-platform assumptions into explicit deployment and recovery contracts.
- Measured evidence: The release documents server-side Gateway Mode, required JWKS/service-token configuration, browser-reachable `AGENT_GATEWAY_URL`, search-capture versioning, document comments/provenance, operation-token renewal, shared rule assembly, evaluation resources, and payload reduction for recovery.
- Vendor or author claims requiring qualification: The release is a first-party change list; its stated fixes do not prove successful migrations or reliable behavior across all deployment topologies.
- Bloss0m engineering consequence: Model Gateway identity, token renewal, provenance, and migration versioning as first-class state, and test rollback before changing the default deployment mode.

## Evidence audit

- Primary evidence inspected: Official v2.2.18 release page, repository documentation, migration notes, and release validation notes.
- Baseline or comparison: Earlier LobeHub deployment behavior versus the Gateway Mode default and durable-run changes in v2.2.18.
- Missing evidence: Independent upgrade tests, rollback success rate, gateway latency/availability data, and provenance correctness under partial failure.
- Conflicts or uncertainty: The release notes explicitly say some product tests, lint, typecheck, and acceptance checks were not rerun solely for this release; preserve that limitation.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: 「Agent 的可靠性先從 deployment contract 開始：拆解 LobeHub v2.2.18 的 Gateway、token、provenance 與 recovery」。
- Internal routes: Link to durable agent runs, MCP/session governance, RAG provenance, and self-hosted AI operations.
- Human decision required: Include a minimal Docker/Gateway diagram and label migration steps as release documentation rather than independently tested guarantees.
