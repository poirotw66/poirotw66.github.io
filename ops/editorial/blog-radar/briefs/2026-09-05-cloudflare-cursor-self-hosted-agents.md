---
stableId: "url:https://developers.cloudflare.com/changelog/post/2026-09-02-cursor-cloud-agents/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-05
lastVerifiedAt: 2026-09-05
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 4
  total: 22
decision: "durable-post-candidate"
---

# Cloudflare self-hosted machines put agent execution under your control

## Identity

- Search window: 2026-09-04 00:27–2026-09-05 00:27 Asia/Taipei; seven-day backfill from 2026-08-29 00:27.
- Canonical URL: https://developers.cloudflare.com/changelog/post/2026-09-02-cursor-cloud-agents/
- Publisher or author: Cloudflare Developers.
- Published or updated date: 2026-09-02; tutorial updated 2026-09-02.
- Source type: first-party platform changelog and implementation tutorial.
- Direct supporting source: https://developers.cloudflare.com/sandbox/tutorials/cursor-cloud-agents/.

## Editorial fit

- Reader question: Which side of an agent platform should own the execution environment, credentials, repository operations, and session isolation?
- Category and topic cluster: Cloud & Platform; `ai-platform-governance`.
- Existing coverage and duplication risk: The archive covers managed-agent control planes, Cloudflare/agent infrastructure patterns, and tool-boundary security. This candidate adds a concrete split between Cursor's planning/inference and Cloudflare's controlled execution substrate. Duplication risk is medium.
- Why now: Cloudflare documents Cursor Cloud Agents running through self-hosted machines, with each session assigned to an isolated Cloudflare Container while commands, edits, repository operations, and tools execute in customer-controlled infrastructure.
- Durable value: The architecture turns “self-hosted agent” into an inspectable control-plane/data-plane boundary involving Workers, Durable Objects, Containers, R2, cron, outbound connections, and repository credentials.

## Claim map

- Primary claim: Cursor hosts the agent loop, inference, and planning while Cloudflare runs tool execution in isolated infrastructure controlled by the customer.
- Inspectable evidence: The changelog and tutorial specify the required Cursor Enterprise and Cloudflare plans, container isolation, the Worker/DO/container/R2/cron template, and the deployment flow.
- Vendor claim requiring qualification: Isolation and customer control are documented architecture properties, not an independent security audit or capacity result.
- Bloss0m engineering consequence: Model an agent deployment as explicit control-plane, execution-plane, and evidence-plane contracts. Bind credentials, repository access, egress, session lifecycle, logs, and cleanup to the execution plane rather than assuming the model provider owns them.
- Unknowns: Container escape resistance, secret lifetime, outbound policy enforcement, concurrency/cost limits, audit completeness, failure recovery, and behavior when the Cursor control connection is unavailable.

## Evidence audit

- Primary evidence inspected: Cloudflare changelog and Sandbox SDK tutorial.
- Availability boundary: The tutorial requires Cursor Enterprise self-hosted machines, a Workers Paid account with Containers/R2, Node.js 20+, and Docker; this is not a generally available turnkey path for all accounts.
- Reproduction boundary: The template is inspectable and deployable, but meaningful isolation and operational claims require a configured paid account and security review.
- Governance boundary: Customer-controlled execution does not automatically imply customer-controlled inference, context retention, model routing, or provider-side logs.

## Recommended treatment

- Output level: Durable post candidate.
- Proposed angle: “The agent loop can be hosted elsewhere; the dangerous part is still the execution plane.”
- Internal routes: `88-claude-managed-agents-control-plane`, `43-enterprise-ai-agent-security`, `56-aws-hoyabit-bedrock-agentcore`, and `ai-platform-governance`.
- Human decision required: Decide whether to publish as an architecture teardown and require a threat model for credentials, egress, isolation, and cleanup before recommending deployment.

