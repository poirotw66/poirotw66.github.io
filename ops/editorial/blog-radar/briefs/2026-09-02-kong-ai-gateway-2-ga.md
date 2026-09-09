---
stableId: "url:https://konghq.com/blog/product-releases/kong-ai-gateway-2-0-ga"
status: "durable-post-candidate"
firstSeenAt: 2026-09-02
lastVerifiedAt: 2026-09-02
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 5
  total: 24
decision: "write-now"
---

# Kong AI Gateway 2.0 GA：把 MCP、模型路由與成本治理放進同一個控制平面

## Identity

- Search window: strict 72-hour scan from 2026-08-30 00:30Z to 2026-09-02 00:30Z.
- Discovery queries: `Kong AI Gateway 2.0 GA`; `Kong MCP server bundling ACL tool catalog`; `AI gateway modality pricing identity aware routing`.
- Canonical URL: https://konghq.com/blog/product-releases/kong-ai-gateway-2-0-ga
- Publisher or author: Kong
- Published or updated date: 2026-09-01
- Source type: release-notes
- Direct supporting sources:
  - AI Gateway documentation: https://developer.konghq.com/ai-gateway/
  - v2 migration guide: https://developer.konghq.com/ai-gateway/v2-migration-guide/

## Editorial fit

- Why now: The GA release treats model-provider routing and MCP tool exposure as one platform-governance problem. It names concrete controls for tool discovery, identity, modality-aware pricing, provider schemas, and migration.
- Reader question: If one gateway fronts both models and MCP servers, what should be centralized, and what must remain an application or server responsibility?
- Category and topic cluster: Cloud & Platform / ai-platform-governance.
- Existing coverage and duplication risk: Distinct from existing MCP allowlists and agent-runtime releases because the focus is a gateway entity model spanning model routes, MCP bundles, cost catalogs, and principals. Avoid presenting it as an independent security or performance result.
- Why this remains useful after the current news cycle: ACL-filtered discovery, cost metadata, identity attribution, and v2 migration constraints are durable platform decisions.

## Claim map

- Primary claim: Kong AI Gateway 2.0 GA provides MCP Server Bundling, a unified tool catalog filtered by caller ACLs, modality-aware model pricing, identity-aware principals, and additional provider integrations.
- Measured evidence: The primary release and docs expose the control surfaces, quickstart, entity model, migration workflow, authentication, ACL, observability, and cost-management configuration. They do not publish an independent benchmark.
- Vendor or author claims requiring qualification: “Unified” governance and security posture are product claims. Invisible unauthorized tools at discovery is documented behavior, not proof that every downstream authorization or prompt-injection path is safe.
- Bloss0m engineering consequence: Treat gateway configuration as a typed control plane: define canonical provider/model/tool entities, filter discovery before the model sees tools, bind identity to quotas and attribution, and test migration behavior before changing the gateway’s entity model.

## Evidence audit

- Primary evidence inspected: Kong GA announcement, AI Gateway docs, and v2 migration guide.
- Baseline or comparison: v1 versus v2 entity/control-plane model; direct MCP exposure versus bundled upstream servers; static versus modality-aware cost metadata.
- Missing evidence: No independent latency, cost savings, authorization-bypass, availability, or production-adoption measurements; no public end-to-end benchmark.
- Conflicts or uncertainty: The release is detailed but vendor-authored. The article should separate documented configuration behavior from inferred operational benefits and should verify which integrations are generally available in the reader’s deployment.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “Gateway 不只是 proxy：Kong AI Gateway 2.0 如何把 MCP tool discovery、provider routing、identity 與 token/audio/video cost metadata 變成可治理的 control plane。”
- Internal routes: Existing MCP governance, enterprise agent security, AgentCore, and enterprise RAG routes after archive-aware lookup.
- Human decision required: Approve a release-and-docs-led engineering explainer; do not frame first-party controls as independently validated security outcomes.
