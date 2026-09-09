---
stableId: "url:https://www.salesforce.com/ap/news/press-releases/2026/08/25/salesforce-turns-enterprise-applications-into-enterprise-capabilities/"
status: "durable-post-candidate"
firstSeenAt: 2026-08-27
lastVerifiedAt: 2026-08-27
primaryCategory: "Enterprise AI"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 4
  total: 22
decision: "write-now"
---

# Headless 360: MCP servers as governed business capabilities

## Identity

- Search window: 2026-08-20 to 2026-08-27; daily frontier scan with a 7-day backfill.
- Discovery queries: `enterprise MCP server governed capabilities August 2026`, `Salesforce Headless 360 MCP`.
- Canonical URL: https://www.salesforce.com/ap/news/press-releases/2026/08/25/salesforce-turns-enterprise-applications-into-enterprise-capabilities/
- Publisher or author: Salesforce.
- Published date: 2026-08-25.
- Source type: First-party product announcement with architecture and availability details.
- Direct supporting source: https://modelcontextprotocol.io/

## Editorial fit

- Why now: Salesforce is framing MCP as the interface for discovering and invoking governed enterprise capabilities, not as a thin wrapper around raw APIs.
- Reader question: What must an enterprise MCP server preserve when an external agent invokes a business operation?
- Category and topic cluster: Enterprise AI / ai-platform-governance.
- Existing coverage and duplication risk: Distinct from generic MCP introductions; check existing enterprise-agent governance posts for internal links rather than duplicating a protocol explainer.
- Why this remains useful after the current news cycle: Identity, permissions, metadata, workflow rules, validation, and provenance are durable control-plane concerns.

## Claim map

- Primary claim: Headless 360 turns Salesforce application capabilities into reusable, agent-discoverable business operations.
- Concrete implementation detail: The announcement describes Headless 360 MCP, Data 360 MCP, multi-framework support, Slackbot MCP Client, and a repository of reusable Skills.
- Measured scope stated by the source: Data 360 MCP exposes nearly 200 Data 360 APIs; the company says more than 100 Skills and plugins are available or planned across the listed surfaces.
- Engineering inference: A useful MCP server should carry the authorization and semantic context needed to make an operation safe, rather than exposing an ungoverned function catalogue.
- Vendor claims requiring qualification: Availability, customer impact, and the claim that these are trusted business capabilities are first-party assertions, not an independent security or reliability evaluation.

## Evidence audit

- Primary evidence inspected: The official Salesforce announcement, including the Headless 360, Data 360 MCP, Skills, and Slackbot sections.
- Baseline or comparison: Feature and availability comparison within the announcement; no independent latency, incident, authorization, or adoption benchmark found.
- Missing evidence: Permission-denial behavior, audit-log schema, prompt-injection resistance, versioning guarantees, rollback semantics, and performance under multi-agent load.
- Conflicts or uncertainty: Product availability varies by edition and region; the article uses roadmap language for some components.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “MCP should expose governed business capabilities, not raw APIs: the Headless 360 control-plane checklist.”
- Suggested article structure: capability boundary → identity/permission propagation → metadata-aware discovery → validation and workflow enforcement → provenance and audit → failure cases an implementation must test.
- Human decision required: Keep Salesforce feature counts and release status explicitly attributed; verify current availability before publication.
