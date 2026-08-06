---
stableId: "url:https://docs.aws.amazon.com/bedrock/latest/userguide/agents-classic-maintenance-mode.html"
status: "candidate"
firstSeenAt: 2026-08-05
lastVerifiedAt: 2026-08-05
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 4
  total: 24
decision: "candidate"
---

# Amazon Bedrock Agents Classic: maintenance mode and AgentCore migration

## Identity

- Search window: 2026-08-04 00:50–2026-08-05 00:50 Asia/Taipei; seven-day backfill from 2026-07-29.
- Discovery queries: AWS Bedrock Agents Classic maintenance mode; AWS AgentCore migration; enterprise agent platform release notes.
- Canonical URL: https://docs.aws.amazon.com/bedrock/latest/userguide/agents-classic-maintenance-mode.html
- Publisher or author: Amazon Web Services
- Published or updated date: Effective 2026-07-30; page was verified on 2026-08-05. A separate page publication timestamp is unknown.
- Source type: official documentation
- Direct supporting sources: https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html; https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-get-started-cli.html

## Editorial fit

- Why now: The service transition is already effective, and AWS documents account allowlisting, model-catalog freeze, capability mismatches, and migration paths.
- Reader question: What changes in an existing Bedrock agent platform when Agents becomes Classic, and how should teams evaluate AgentCore as the replacement?
- Category and topic cluster: Cloud & Platform; ai-platform-governance
- Existing coverage and duplication risk: Refreshes `56-aws-hoyabit-bedrock-agentcore` and connects to `65-enterprise-rag-guide`; avoid repeating a generic AgentCore feature tour.
- Why this remains useful after the current news cycle: Maintenance-mode transitions change architecture, provisioning, compatibility, and governance decisions long after the announcement date.

## Claim map

- Primary claim: AWS says Bedrock Agents Classic is in maintenance mode, is no longer open to new customers as of 2026-07-30, and recommends AgentCore for new development and migration.
- Measured evidence: The documentation provides a capability matrix, API/account behavior, model-freeze statement, and migration procedure; it is not an independent benchmark.
- Vendor or author claims requiring qualification: AWS's “equivalent and expanded functionality,” “hours” migration estimate, and token-efficiency/cost language are vendor claims. Multi-agent and stage-specific prompt-override parity is explicitly limited or incomplete.
- Bloss0m engineering consequence: Treat this as a migration and control-plane decision: inventory agent features, preserve trace and policy requirements, test RAG/tool mappings, and validate region/account eligibility before changing deployment paths.

## Evidence audit

- Primary evidence inspected: AWS maintenance-mode guide, AWS Bedrock Agents user guide, and AgentCore CLI quickstart.
- Baseline or comparison: Bedrock Agents Classic versus AgentCore managed harness and code-defined agents in AWS's own capability matrix.
- Missing evidence: No independent migration case study, cost comparison, production reliability data, or universal region-availability result was found.
- Conflicts or uncertainty: Existing workloads are documented as unaffected, but new-account allowlisting and region availability are operational conditions that require account-specific checks.

## Recommended treatment

- Output level: durable-post-candidate
- Proposed angle: “Bedrock Agents is now Classic: a migration checklist for AgentCore, RAG, tools, identity, observability, and multi-agent gaps.”
- Internal routes: `/blog/56-aws-hoyabit-bedrock-agentcore/`, `/blog/65-enterprise-rag-guide/`, and the `ai-platform-governance` cluster.
- Human decision required: Approve a platform-migration refresh and decide how much AWS-specific capability detail remains useful; verify current pricing, regions, and legal/commercial caveats before publication.
