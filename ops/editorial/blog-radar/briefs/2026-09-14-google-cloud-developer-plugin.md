---
stableId: "url:https://cloud.google.com/blog/topics/developers-practitioners/introducing-the-google-cloud-developer-plugin-for-ai-coding-agents"
status: "durable-post-candidate"
firstSeenAt: 2026-09-14
lastVerifiedAt: 2026-09-14
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 4
  total: 22
decision: "shortlist"
---

# Google Cloud Developer Plugin：把 Agent Skills 與 MCP Tools 包成可治理的安裝單位

## Identity

- Search window: 7-day backfill ending 2026-09-13 16:31 UTC; the source exposes a 2026-09-10 publication date but no precise publication time.
- Discovery queries: `Google Cloud Developer Plugin AI coding agents`, `Agent Plugins standard`, `skills MCP manifest governance`.
- Canonical URL: https://cloud.google.com/blog/topics/developers-practitioners/introducing-the-google-cloud-developer-plugin-for-ai-coding-agents
- Publisher or author: Google Cloud.
- Published or updated date: 2026-09-10.
- Source type: engineering-blog.
- Direct supporting sources:
  - https://github.com/google/skills/blob/main/index.json

## Editorial fit

- Why now: The strict window did not yield a new packaging/governance source with a fully verifiable publication timestamp. This clearly labeled backfill remains useful because coding agents increasingly depend on bundles of skills, tools, and MCP servers, and a plugin manifest can make those dependencies discoverable and reviewable as one unit.
- Reader question: Does an installable agent plugin solve tool coupling, or does it simply move an uncontrolled collection of instructions into a new package boundary?
- Category and topic cluster: Cloud & Platform / AI platform governance.
- Existing coverage and duplication risk: Medium. Existing skills and MCP governance coverage discusses individual permissions; this candidate focuses on packaging, installation, and workflow guardrails.
- Why this remains useful after the current news cycle: Manifest shape, ownership, versioning, and preflight checks are governance primitives even when the provider or coding agent changes.

## Claim map

- Primary claim: Google Cloud's developer plugin packages skills and MCP tools behind a vendor-neutral Agent Plugins structure, including authentication, IAM/project management, gcloud guardrails, and a Developer Knowledge MCP server.
- Measured evidence: The official post documents a unified manifest/directory model and install examples for Antigravity CLI, Claude Code, and Codex CLI. Its example workflow checks the environment, reviews IAM risk, and proposes a roadmap before resource changes. The linked public Google Skills index is available for inspection.
- Vendor or author claims requiring qualification: The post is first-party and does not provide adoption, task-success, latency, or security-bypass metrics. The plugin source path and implementation maturity need direct repository review before publication.
- Bloss0m engineering consequence: A plugin should be reviewed like a dependency manifest: pin versions, declare tools and permissions, show provenance, run preflight checks, and make destructive actions explicit.

## Evidence audit

- Primary evidence inspected: Google Cloud's engineering post and the public Google Skills index.
- Baseline or comparison: No controlled comparison with unbundled skills or hand-written MCP configuration is provided.
- Missing evidence: No independent adoption data, cross-agent compatibility test, manifest schema specification, version/rollback policy, or measured guardrail effectiveness.
- Conflicts or uncertainty: The post links to a public repository, but the exact plugin implementation path was not independently opened during the scan. Treat the package structure and install examples as verified source claims, not as proof of a stable standard.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “從散落 skills 到可治理 plugin：Agent Plugins standard 如何處理 tool coupling。” Compare plugin boundaries with package manifests, MCP server permissions, and environment preflight.
- Internal routes: Link to agent skill governance, MCP allowlists, and cloud-agent deployment coverage.
- Human decision required: Verify the implementation and schema before promoting from shortlist to write-now; avoid calling it an open standard until the normative specification is independently available.
