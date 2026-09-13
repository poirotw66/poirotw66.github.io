---
stableId: "url:https://github.blog/changelog/2026-09-01-copilot-code-review-can-now-approve-pull-requests/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-08
lastVerifiedAt: 2026-09-08
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

# Copilot code review approvals: AI enters the merge gate

## Identity

- Search window: 2026-09-07 00:36–2026-09-08 00:36 Asia/Taipei; seven-day backfill from 2026-09-01 00:36.
- Discovery queries: `GitHub Copilot code review approvals September 2026`; `site:github.blog/changelog Copilot approval pull requests`.
- Canonical URL: https://github.blog/changelog/2026-09-01-copilot-code-review-can-now-approve-pull-requests/
- Publisher or author: GitHub.
- Published or updated date: 2026-09-01.
- Source type: first-party release note with configuration documentation.
- Direct supporting sources: https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-code-review

## Editorial fit

- Why now: GitHub's public-preview feature moves Copilot from review commentary toward an approval that can count toward a repository's required-approval rule when administrators explicitly enable it.
- Reader question: What policy boundary is required before an AI review can become part of a software project's merge gate?
- Category and topic cluster: Enterprise AI; `ai-platform-governance`.
- Existing coverage and duplication risk: The archive and Radar cover MCP allowlists, agent plugins, shared sessions, content exclusions, and developer-agent security, but not AI-authored approval as a merge authority. Duplication risk is medium; the distinct angle is change-control policy, not review quality or model availability.
- Why this remains useful after the current news cycle: The three-level policy hierarchy, default-off behavior, file-path scoping, and dismissal after new commits are durable controls for any automated change approver.

## Claim map

- Primary claim: Copilot can submit an approving review in public preview, and an organization's configuration can allow that approval to satisfy merge requirements.
- Measured evidence: GitHub documents the approval assessment, enterprise/organization/repository controls, optional file-glob restrictions, default-off enterprise policy, and automatic dismissal after new commits.
- Vendor claim requiring qualification: The feature's reliability, security, and real-world review accuracy are not established by the release note or configuration guide; “ready to approve” is a model assessment, not evidence that a human-equivalent review occurred.
- Bloss0m engineering consequence: Treat AI approval as a capability grant in the merge-control plane. Start with explicit repository classes and path allowlists, require fresh review after every new commit, and keep approval authority independent from the model's prose assessment.

## Evidence audit

- Primary evidence inspected: GitHub's September 1 release note and the official code-review configuration guide.
- Baseline or comparison: The documented baseline is default-off approval and the existing human/required-approval flow; no independent accuracy benchmark or incident data was located.
- Missing evidence: Approval precision/recall, security-sensitive change handling, bypass resistance, audit-log semantics, and adoption or rollback outcomes.
- Conflicts or uncertainty: The feature is public preview and subject to change; the guide separates an assessment from an approval that counts toward merge requirements, so those two states must not be conflated.

## Recommended treatment

- Output level: Durable-post-candidate.
- Proposed angle: “The moment an AI reviewer becomes a merge participant.”
- Internal routes: `43-enterprise-ai-agent-security`, `39-enterprise-agentic-ai-governance`, `89-ai-powered-software-development-environments`, and `ai-platform-governance`.
- Human decision required: Decide whether to frame this as a least-privilege merge policy pattern and require explicit separation of assessment, approval, and merge authority in the final article.

