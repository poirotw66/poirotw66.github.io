---
stableId: "url:https://ai.google.dev/gemini-api/docs/changelog"
status: "durable-post-candidate"
firstSeenAt: 2026-09-21
lastVerifiedAt: 2026-09-21
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

# Gemini API Release Notes：Antigravity Agent 09-2026 改寫工具執行介面

## Identity

- Search window: Seven-day backfill ending 2026-09-21; Google published the entry on 2026-09-17.
- Canonical URL: https://ai.google.dev/gemini-api/docs/changelog
- Publisher or author: Google AI for Developers.
- Source type: Official release notes.

## Editorial fit

- Reader question: When an agent runtime changes its file and code-search tools, which contracts must an integration actually migrate?
- Why now: The new `antigravity-preview-09-2026` replaces the earlier preview and changes local-tool parameters from snake_case to PascalCase while replacing whole-file edits with line-range replacement.
- Engineering angle: Treat an agent model/runtime release as a protocol migration: compare remote-sandbox compatibility, local tool names, argument casing, edit semantics, and the deprecation deadline.
- Archive fit: Extends the site's agent runtime and governed tool-use coverage with a concrete breaking-change matrix rather than a model leaderboard.

## Claim map

- Primary claim: Remote sandbox users reading only output fields can change only the agent string, while local tool users and function-call parsers must migrate to new built-in tool contracts.
- Inspectable evidence: The official changelog lists the new model ID, file/read/list/search tool mappings, PascalCase parameter changes, and the 2026-10-05 shutdown date for the old preview.
- Engineering consequence: Tool names, argument casing, edit granularity, and parser assumptions belong in compatibility tests and versioned adapters.

## Evidence audit

- Primary evidence inspected: Google AI for Developers release notes dated 2026-09-17 and the linked Antigravity Agent guide.
- Missing evidence: No independent migration benchmark, error-rate comparison, or long-running production compatibility report was verified.
- Uncertainty: The release note documents the contract surface, but not every behavioral difference inside the new runtime or its remote sandbox.

## Recommended treatment

- Output level: Durable post candidate.
- Proposed angle: “Agent runtime 升版不是換 model ID：從 snake_case 到 PascalCase、從整檔覆寫到行範圍 patch 的相容性拆解。”
- Artifact: Official release-note migration table and Antigravity Agent guide with concrete tool signatures.
- Human decision required: Keep the 2026-10-05 shutdown as a dated compatibility fact, and avoid claiming that the new runtime is universally better.
