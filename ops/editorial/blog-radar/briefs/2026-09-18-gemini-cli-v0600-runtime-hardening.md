---
stableId: "url:https://github.com/google-gemini/gemini-cli/releases/tag/v0.60.0"
status: "durable-post-candidate"
firstSeenAt: 2026-09-18
lastVerifiedAt: 2026-09-18
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

# Gemini CLI v0.60.0: provenance, OAuth, and sandbox hardening at the agent boundary

## Identity

- Search window: Strict 72-hour scan ending 2026-09-18; the release was published on 2026-09-15 at 20:31 UTC.
- Discovery queries: Gemini CLI v0.60.0; Gemini CLI MCP OAuth issuer; Gemini CLI tool output provenance sandbox.
- Canonical URL: https://github.com/google-gemini/gemini-cli/releases/tag/v0.60.0
- Publisher or author: Google Gemini CLI maintainers.
- Published or updated date: 2026-09-15.
- Source type: Official GitHub release and source repository.
- Direct supporting sources:
  - https://github.com/google-gemini/gemini-cli
  - https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md
  - https://github.com/google-gemini/gemini-cli/blob/main/docs/tools.md
  - https://github.com/google-gemini/gemini-cli/releases/download/v0.60.0/gemini-cli-bundle.zip

## Editorial fit

- Why now: A coding agent's practical attack surface is the boundary between model intent and local or remote side effects. This release is valuable because it hardens several boundaries together instead of presenting one isolated feature.
- Reader question: Which runtime invariants should an agent CLI enforce before it trusts an MCP server, loads an extension, follows a path, or accepts tool output?
- Category and topic cluster: AI Engineering / ai-agent.
- Existing coverage and duplication risk: Medium. Existing site coverage discusses MCP governance, secure tunnels, permissions, and sandboxing; this candidate is a versioned implementation audit of how those concerns meet inside one open-source CLI.
- Why this remains useful after the current news cycle: OAuth issuer validation, path containment, sandbox configuration, environment redaction, provenance metadata, and configuration ownership are durable review items for any agent runtime.

## Claim map

- Primary claim: Gemini CLI v0.60.0 adds or enforces runtime checks around MCP OAuth issuer identification, web-fetch destination validation, macOS Seatbelt temporary directories, extension path resolution, environment changes, workspace and symlink boundaries, configuration permissions, and untrusted tool-output provenance.
- Measured evidence: The signed release enumerates the implementation changes and publishes a 21 MB bundle plus unsigned macOS archives. The repository exposes the surrounding configuration, tool, sandbox, extension, and workspace code paths.
- Vendor or author claims requiring qualification: Release notes prove that maintainers shipped these checks; they do not prove that every bypass is closed or that the changes are compatible with every extension, operating system, MCP server, or enterprise policy.
- Bloss0m engineering consequence: Treat an agent CLI as a policy enforcement point. Its contract should include issuer and redirect checks, path canonicalization, environment-change consent, extension trust, tool-output provenance, and ownership of configuration files.

## Evidence audit

- Primary evidence inspected: The signed v0.60.0 GitHub release, release assets, repository source, configuration reference, and tool documentation.
- Baseline or comparison: v0.59.0 and the release's listed fixes provide a version boundary; the comparison is implementation scope, not a before-and-after security benchmark.
- Missing evidence: No independent penetration test, fuzzing corpus, bypass rate, compatibility matrix, performance overhead, or production incident trend is published.
- Conflicts or uncertainty: The release combines security fixes, platform-specific behavior, and user-facing consent changes. An article must keep documented enforcement separate from the stronger claim that the runtime is secure.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “一次 release 看懂 coding agent 的 runtime hardening：OAuth、path boundary、sandbox、environment consent 與 tool provenance。”
- Internal routes: Link to MCP middleware security, secure MCP tunneling, managed permissions, and agent observability coverage.
- Human decision required: Present the article as a source-level contract audit and include a small test matrix for issuer, redirect, path, symlink, environment, and tool-output cases; do not label it an independent security audit.
