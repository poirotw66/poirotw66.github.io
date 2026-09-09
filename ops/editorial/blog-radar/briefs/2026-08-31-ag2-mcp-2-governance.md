---
stableId: "url:https://github.com/ag2ai/ag2/releases/tag/v1.0.3"
status: "durable-post-candidate"
firstSeenAt: 2026-08-31
lastVerifiedAt: 2026-08-31
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 5
  total: 25
decision: "write-now"
---

# AG2 v1.0.3: MCP 2.0 與 Agent 治理進入同一個 Runtime

## Identity

- Search window: strict 72-hour scan was 2026-08-29 00:31Z to 2026-09-01 00:31Z. This candidate is a 7-day backfill because the official release was published 2026-08-28 20:15Z, just outside the strict cutoff.
- Discovery queries: `AG2 v1.0.3 release MCP 2.0`; `site:github.com/ag2ai/ag2/releases agent governance prompt injection`; `open-source agent runtime TEEC receipt`
- Canonical URL: https://github.com/ag2ai/ag2/releases/tag/v1.0.3
- Publisher or author: AG2 / ag2ai
- Published or updated date: 2026-08-28
- Source type: release-notes
- Direct supporting sources:
  - Project repository: https://github.com/ag2ai/ag2
  - TealTiger governance documentation: https://www.tealtiger.ai/

## Editorial fit

- Why now: This release combines a breaking MCP 2.0 migration with deterministic tool-call governance, human-input handling, and observable receipts. It is a concrete example of an open-source agent runtime treating protocol compatibility and policy enforcement as one upgrade surface.
- Reader question: What does an agent runtime need to enforce before a tool call reaches a server, and how should a blocked decision remain auditable?
- Category and topic cluster: AI Engineering / ai-agent.
- Existing coverage and duplication risk: Distinct from the existing GitHub Agent Plugins packaging story and Forge’s multi-user auth runtime. The new angle is in-process, deterministic policy evaluation plus a protocol-major-version migration.
- Why this remains useful after the current news cycle: The migration boundary, policy modes, kill switch, cost ceiling, human-input failure semantics, and receipt shape are durable runtime design decisions.

## Claim map

- Primary claim: AG2 v1.0.3 ports every MCP surface to MCP 2.0, raises the dependency bound to `mcp>=2.0.0,<3`, adds server metadata and updated conversation handling, and ships TealTiger governance with prompt-injection detection alongside allowlists, PII/secret checks, and cost limits.
- Measured evidence: The release notes expose the breaking dependency change, the three policy modes (`ENFORCE`, `MONITOR`, `OBSERVE`), kill switch and budget checks, reason codes/risk scores/running cost, and a TEEC receipt for each tool evaluation. It also documents ACP host responses to agent human-input requests and clean failure when no one can answer.
- Vendor or author claims requiring qualification: The release demonstrates implementation scope, not a measured reduction in prompt injection, cost, or incidents. The governance middleware is contributed and maintained by a project contributor, and the receipt semantics require a code-level audit before treating them as a complete audit trail.
- Bloss0m engineering consequence: A production agent should put deterministic authorization, budget, and input-validation gates in front of model-generated tool calls, expose explicit monitor/enforce modes for staged rollout, and emit a machine-readable decision receipt whether the call executes or is blocked.

## Evidence audit

- Primary evidence inspected: The official GitHub v1.0.3 release page, its linked project repository, and the linked TealTiger documentation. The release lists the exact dependency bound, migration consequence, policy behavior, and changed components.
- Baseline or comparison: MCP 1.x versus MCP 2.0; blocking versus monitoring versus observation modes; answered versus unanswerable human-input requests; and ordinary tool calls versus calls evaluated by a shared governance instance.
- Missing evidence: No independent security assessment, injection-detection precision/recall, false-positive rate, latency overhead, adoption data, or production incident evidence. No external benchmark demonstrates that TEEC receipts improve operator response or compliance outcomes.
- Conflicts or uncertainty: The release uses “governance” and “prompt injection detection” for a deterministic serialized-argument check; that is narrower than detecting malicious instructions hidden in tool outputs or multi-step trajectories. Treat protocol compatibility as documented, and security effectiveness as unproven.

## Recommended treatment

- Output level: durable-post-candidate
- Proposed angle: “Agent 的安全邊界不該由另一個 LLM 口頭判斷：AG2 如何把 MCP 2.0、deterministic middleware、budget、kill switch 與 TEEC receipt 放進 runtime。”
- Internal routes: Link to existing MCP governance and Agent Plugins coverage after archive-aware route lookup during writing.
- Human decision required: Approve a code-and-release-note-led article, with a migration checklist and an explicit warning that deterministic argument checks are not a complete prompt-injection defense.
