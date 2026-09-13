---
stableId: "url:https://github.blog/changelog/2026-09-08-enterprise-managed-sandbox-in-copilot-for-jetbrains/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-11
lastVerifiedAt: 2026-09-11
primaryCategory: "Enterprise AI"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 4
  total: 23
decision: "durable-post-candidate"
---

# Enterprise-managed sandbox in Copilot for JetBrains: policy reaches the execution boundary

## Identity

- Search window: 2026-09-10 22:47–2026-09-11 22:47 Asia/Taipei; seven-day backfill from 2026-09-04 22:47.
- Discovery queries: `site:github.blog/changelog enterprise-managed sandbox Copilot JetBrains September 2026`; `GitHub Copilot JetBrains sandbox policy diagnostics`.
- Canonical URL: https://github.blog/changelog/2026-09-08-enterprise-managed-sandbox-in-copilot-for-jetbrains/
- Publisher or author: GitHub.
- Published or updated date: 2026-09-08.
- Source type: first-party release note with local-sandbox configuration documentation.
- Direct supporting sources: https://docs.github.com/en/copilot/how-tos/cloud-and-local-sandboxes/configuring-local-sandbox-settings

## Editorial fit

- Why now: JetBrains Copilot now exposes enterprise-managed sandbox policies for filesystem, network, proxy, developer-tool, and macOS Keychain access, with managed settings taking precedence over local choices.
- Reader question: How does an enterprise make a local coding agent's execution sandbox enforceable inside a developer IDE?
- Category and topic cluster: Enterprise AI; `ai-platform-governance`.
- Existing coverage and duplication risk: This is a follow-up to the archive's 2026-08-18 JetBrains managed-settings candidate and overlaps the sandbox/control-plane routes. The distinct angle is execution-boundary policy, effective-policy diagnostics, and `/ide` bridge behavior; human review should decide standalone versus refresh.
- Why this remains useful after the current news cycle: Sandbox policy precedence, bypass controls, and effective-policy inspection remain relevant regardless of which IDE hosts the agent.

## Claim map

- Primary claim: Enterprise administrators can centrally manage and enforce Copilot sandbox behavior in JetBrains, including whether users can bypass the sandbox and which filesystem/network/developer-tool surfaces are reachable.
- Measured evidence: GitHub documents managed-policy labels, `sandbox.allowBypass=false`, `/sandbox policy` effective-policy inspection, policy diagnostics, and the `/ide` bridge for JetBrains workflows.
- Vendor claim requiring qualification: The preview status and documented control surface do not establish isolation strength, telemetry quality, or resistance to host-specific escapes.
- Bloss0m engineering consequence: Treat the IDE sandbox as an execution policy boundary with an inspectable effective configuration, explicit bypass semantics, and a separate control channel for IDE integration.

## Evidence audit

- Primary evidence inspected: GitHub's September 8 changelog entry and official local-sandbox configuration guide.
- Baseline or comparison: Existing JetBrains managed settings and user/workspace sandbox configuration; managed values are documented to override lower-level controls.
- Missing evidence: Windows/Insiders availability details, enforcement telemetry, escape testing, network egress semantics, and rollout/rollback behavior.
- Conflicts or uncertainty: The feature remains public preview and the exact client/version and enterprise-plan prerequisites require confirmation before publication.

## Recommended treatment

- Output level: Durable-post-candidate; follow-up/refresh candidate for the existing JetBrains governance record.
- Proposed angle: “The IDE is no longer the boundary: enterprise policy follows the coding agent into its sandbox.”
- Internal routes: `87-github-mcp-enterprise-controls`, `43-enterprise-ai-agent-security`, `89-ai-powered-software-development-environments`, and `ai-platform-governance`.
- Human decision required: Choose standalone follow-up versus merging into the existing JetBrains governance article; keep preview status and unverified isolation claims explicit.

