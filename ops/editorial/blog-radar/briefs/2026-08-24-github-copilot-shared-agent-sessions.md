---
stableId: "url:https://github.blog/changelog/2026-08-21-the-new-github-copilot-experience-in-slack"
status: "durable-post-candidate"
firstSeenAt: 2026-08-24
lastVerifiedAt: 2026-08-24
primaryCategory: "Enterprise AI"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 4
  total: 23
decision: "durable-post-candidate"
---

# GitHub Copilot shared agent sessions: the collaboration surface becomes a control plane

## Identity

- Search window: 2026-08-23 08:31–2026-08-24 08:31 Asia/Taipei; seven-day backfill from 2026-08-17.
- Discovery queries: GitHub Copilot Slack agent session changelog; GitHub Copilot Microsoft Teams shared agent work; Copilot cloud agent Slack permissions; Slack GitHub app data retention.
- Canonical URL: https://github.blog/changelog/2026-08-21-the-new-github-copilot-experience-in-slack
- Publisher or author: GitHub.
- Published or updated date: 2026-08-21; public preview.
- Source type: official changelog / product documentation.
- Direct supporting sources: https://github.blog/changelog/2026-08-21-shared-agentic-work-with-github-copilot-in-microsoft-teams; https://docs.github.com/en/copilot/how-tos/copilot-integrations/integrate-cloud-agent-with-slack; https://docs.github.com/en/copilot/how-tos/copilot-integrations/integrate-cloud-agent-with-teams; https://slack.com/marketplace/A01BP7R4KNY-github.

## Editorial fit

- Why now: GitHub is moving an agent session into the place where teams already discuss incidents, issues, and code changes. The engineering problem is no longer only how an agent calls tools, but how shared conversation, identity, permissions, budgets, sandbox state, and approvals compose.
- Reader question: What must a chat-integrated coding agent expose so that shared delegation does not turn conversation context into an uncontrolled execution authority?
- Category and topic cluster: Enterprise AI; `ai-platform-governance`.
- Existing coverage and duplication risk: Follow-up to `87-github-mcp-enterprise-controls`, `43-enterprise-ai-agent-security`, `39-enterprise-agentic-ai-governance`, and the Agent Plugins candidate. Duplication risk is medium: those entries cover tool identity, package governance, and enterprise policy; this candidate covers multi-user session context and side-effect approval.
- Why this remains useful after the current news cycle: Shared-agent session design, thread-to-context rules, per-user versus app identity, async execution, budget ceilings, and merge approval are durable control-plane questions for any collaboration-integrated agent.

## Claim map

- Primary claim: GitHub's Slack preview makes collaboration chat an agent control plane with explicit context, identity, execution, and approval boundaries.
- Measured evidence: GitHub documents @GitHub direct-message, channel, and thread entry points; the agent can answer repository questions, triage or change issues, investigate and implement in a secure cloud sandbox, open a pull request, and continue asynchronously. The docs state that a full shared thread is captured as context, shared artifacts use the GitHub app identity, existing repository permissions apply, cloud-agent budgets apply, and an additional approval is required before merge under rulesets.
- Vendor claims requiring qualification: “Secure cloud sandbox,” inherited permissions, and app-identity handling are documented product behavior, not independent evidence of containment, least privilege, or incident reduction. Slack Marketplace disclosures also describe data-retention and model-provider policies, but do not prove zero retention or universal enterprise defaults.
- Bloss0m engineering consequence: Model the session as separate state machines for conversation context, actor identity, repository authorization, sandbox execution, budget, artifact ownership, and merge approval. A shared thread must not be treated as equivalent to a shared write grant.

## Evidence audit

- Primary evidence inspected: GitHub's 2026-08-21 Slack changelog; 2026-08-21 Teams changelog; Slack and Teams integration documentation; GitHub cloud-agent permission and approval descriptions; Slack Marketplace data-handling page.
- Baseline or comparison: Existing GitHub MCP and Agent Plugins coverage starts at tool/package boundaries. The new surface adds a collaboration boundary where participants can provide context while a designated write-capable user triggers changes and a later approval may still gate merge.
- Missing evidence: Preview reliability, sandbox escape resistance, context leakage across threads, budget exhaustion behavior, audit-log completeness, repository-wide rollout coverage, and production outcome metrics are unknown.
- Conflicts or uncertainty: The docs distinguish DM context from shared thread context and use different identities for personal requests versus shared artifacts. Exact behavior depends on enterprise installation, repository access, branch/ruleset configuration, and plan eligibility.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “When chat becomes an agent console, draw the boundary between shared context and shared authority.”
- Internal routes: `43-enterprise-ai-agent-security`; `39-enterprise-agentic-ai-governance`; `87-github-mcp-enterprise-controls`; `ai-platform-governance` cluster.
- Human decision required: Decide whether to frame this as a platform-neutral shared-agent control-plane article or as a GitHub implementation teardown. Preserve public-preview status and separate documented permission semantics from the inference that the design is safe in production.
