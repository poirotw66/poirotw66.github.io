---
stableId: "url:https://github.com/snyk/agent-scan"
status: "durable-post-candidate"
firstSeenAt: 2026-09-19
lastVerifiedAt: 2026-09-19
primaryCategory: "AI Engineering"
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

# Snyk Agent Scan: MCP 掃描器本身也必須被納入安全邊界

## Identity

- Search window: Strict 72-hour scan ending 2026-09-19; the repository received a current update on 2026-09-18.
- Canonical URL: https://github.com/snyk/agent-scan
- Publisher or author: Snyk open-source maintainers.
- Published or updated date: 2026-09-18.
- Source type: Official open-source security tool repository.
- Supporting evidence: CLI documentation, risk catalog, MCP discovery flow, consent prompt, standalone binaries, checksums, and vulnerable demo server.

## Editorial fit

- Reader question: What does an agent security scanner need to inspect before it can claim to protect MCP and skills?
- Why now: Agent Scan scans local agent configuration, MCP servers, tools, prompts, resources, and skills, while requiring interactive consent before starting stdio servers.
- Engineering angle: Scanning is not a pure read operation when the scanner connects to a local server; command display, redaction, consent, and CI policy become part of the threat model.
- Archive fit: It complements existing MCP authorization and provenance articles with a concrete scanner boundary.

## Claim map

- Primary claim: Agent Scan discovers common agent/MCP configuration and produces risk-based findings for local and CI use.
- Inspectable evidence: CLI examples, a vulnerable MCP demo, standalone release artifacts, secret redaction, and explicit consent behavior.
- Vendor claim requiring qualification: The risk catalog and analysis API show coverage, not independently measured detection precision or false-negative rate.
- Engineering consequence: Security tooling for agents needs its own execution policy, provenance log, redaction contract, and non-interactive CI mode.

## Evidence audit

- Primary evidence inspected: Public README, source repository, release artifacts, CLI examples, and demo configuration.
- Missing evidence: No independent benchmark against a labeled corpus, bypass rate, performance profile, or third-party security audit was verified.
- Uncertainty: Auto-discovery varies by installed client and local configuration; coverage should not be presented as universal.

## Recommended treatment

- Output level: Durable post candidate.
- Proposed angle: “MCP scanner 也有 attack surface：從 consent、stdio 啟動到 secrets redaction 拆解 Agent Scan。”
- Artifact: Public CLI, standalone binaries with SBOM/checksums, and a vulnerable demo server.
- Human decision required: Treat the scanner as an inspectable control surface, not as proof that an environment is safe.
