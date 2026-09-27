---
stableId: "url:https://aws.amazon.com/blogs/machine-learning/build-a-multi-account-ai-agent-with-agentcore-gateway-and-mcp/"
status: "approved"
firstSeenAt: 2026-09-27
lastVerifiedAt: 2026-09-27
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 24
decision: "write-now"
---

# Build a multi-account AI agent with AgentCore Gateway and MCP

## Identity

- Search window: 2026-09-24 through 2026-09-27 (Asia/Taipei); the source date is at the edge of the 72-hour window and the page does not state a publication time.
- Discovery queries: `AWS AgentCore Gateway multi-account MCP`; `cross-account AI agents line-of-business tools AWS`; `AgentCore Gateway OAuth Cedar identity federation`.
- Canonical URL: https://aws.amazon.com/blogs/machine-learning/build-a-multi-account-ai-agent-with-agentcore-gateway-and-mcp/
- Publisher or author: AWS Machine Learning Blog.
- Published or updated date: 2026-09-24.
- Source type: first-party engineering walkthrough.
- Direct supporting sources: AWS sample repository and README; AgentCore Gateway identity, authorization, and workload configuration documentation linked from the walkthrough.

## Editorial fit

- Why now: The walkthrough makes a consequential account-boundary choice concrete: keep MCP servers and data in line-of-business accounts while centralizing the agent and tool entry point in a platform account.
- Reader question: How can a shared agent use business-owned tools without centralizing all data or granting the runtime broad cross-account access?
- Story hook: A runnable-looking multi-account topology exposes the less-obvious identity chain—user JWT into Gateway, then Gateway-to-LOB machine identity—and its authorization boundaries.
- Category and topic cluster: Cloud & Platform / `ai-platform-governance`.
- Existing coverage and duplication risk: Follow-up to existing AgentCore and MCP authorization coverage, but the three-LOB-account topology and identity flow are distinct. Keep the article focused on cross-account architecture rather than a general AgentCore overview.
- Why this remains useful after the current news cycle: Account ownership, delegated authorization, workload identity, and data-locality trade-offs persist across agent platform designs.

## Claim map

- Primary claim: AgentCore Gateway can expose MCP tools hosted in separate LOB accounts to an agent running in a platform account.
- Measured evidence: The AWS walkthrough describes a four-account proof of concept: one platform account and three LOB accounts. It shows user JWT validation at Gateway and outbound machine-to-machine OAuth for LOB access; the sample does not exercise on-behalf-of delegation.
- Vendor or author claims requiring qualification: This is an AWS-authored reference walkthrough, not independent validation. The README labels the sample a proof of concept, uses synthetic data, and does not establish production readiness.
- Bloss0m engineering consequence: Separate user authentication from downstream workload identity; constrain Gateway resource access and test authorization at both the central tool boundary and each data-owning account.

## Evidence audit

- Primary evidence inspected: AWS post, linked sample repository/README, and the official Gateway identity and `allowedWorkloadConfiguration` references.
- Baseline or comparison: Centralizing data/tools versus keeping each LOB server and dataset in its owning account; no measured comparative benchmark is reported.
- Missing evidence: Independent deployment, policy-bypass tests, production scale, latency/cost, and a demonstrated OBO path.
- Conflicts or uncertainty: The page date is verified but no time is stated; its age is near the 72-hour boundary. OBO is described as an option, not as part of the sample flow.

## Recommended treatment

- Output level: write-now; bilingual Blog #120 created, not published.
- Proposed angle: “Keep the data in its account: trace the identity and authorization hops in AWS’s multi-account AgentCore/MCP pattern.”
- Internal routes: AgentCore, MCP authorization, cross-account identity, and enterprise agent governance articles.
- Human decision required: None for the requested draft; do not present this PoC as a production-validated architecture.
