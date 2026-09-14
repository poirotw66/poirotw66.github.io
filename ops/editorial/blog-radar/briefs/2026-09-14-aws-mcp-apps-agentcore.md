---
stableId: "url:https://aws.amazon.com/blogs/machine-learning/build-interactive-mcp-apps-using-amazon-bedrock-agentcore/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-14
lastVerifiedAt: 2026-09-14
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 4
  total: 24
decision: "write-now"
---

# Build Interactive MCP Apps Using Amazon Bedrock AgentCore

## Identity

- Search window: strict 72-hour scan ending 2026-09-13 16:31 UTC; the post was published 2026-09-11.
- Discovery queries: `MCP Apps AgentCore`, `MCP resources read interactive UI`, `MCP app security sandbox`.
- Canonical URL: https://aws.amazon.com/blogs/machine-learning/build-interactive-mcp-apps-using-amazon-bedrock-agentcore/
- Publisher or author: AWS Machine Learning Blog.
- Published or updated date: 2026-09-11.
- Source type: engineering-blog.
- Direct supporting sources:
  - https://github.com/aws-samples/sample-agentcore-mcp-apps

## Editorial fit

- Why now: MCP Apps make a tool response an interactive UI resource, so the integration surface now includes rendering, sandboxing, session isolation, authentication, and lifecycle cleanup—not only JSON tool schemas.
- Reader question: What does a complete request path look like when an AI host calls an MCP tool and receives a UI widget instead of plain text?
- Category and topic cluster: AI Engineering / agent runtime and MCP applications.
- Existing coverage and duplication risk: Medium. Existing MCP coverage focuses on governance and transport; this candidate contributes the end-to-end UI/resource path and deployment controls.
- Why this remains useful after the current news cycle: The boundaries between host, gateway, runtime, tool, resource, and iframe are architectural contracts that can be tested independently of AWS branding.

## Claim map

- Primary claim: AgentCore Runtime and Gateway can host MCP Apps with session isolation, while `resources/read` returns self-contained HTML rendered in a sandboxed iframe inside an AI host.
- Measured evidence: The official walkthrough uses Unicorn Rentals and documents `tools/list`, `resources/list`, `tools/call`, and `resources/read`. The sample architecture is AI host → WAF → AgentCore Gateway → AgentCore Runtime MCP server → Lambda → DynamoDB, with CloudFront/S3 for images. Inbound Gateway auth is shown as No Auth and outbound calls use IAM SigV4; WAF and Runtime resource policy provide controls in the example.
- Vendor or author claims requiring qualification: AWS presents a reference implementation, not an independent security assessment or interoperability test across hosts.
- Bloss0m engineering consequence: Treat an MCP App as two coupled contracts: a tool/action contract and a UI/resource contract, with explicit trust boundaries, session ownership, origin policy, and failure behavior.

## Evidence audit

- Primary evidence inspected: The AWS engineering post and the public `sample-agentcore-mcp-apps` repository, including its deployment and verification documentation.
- Baseline or comparison: No benchmark is supplied. The evidence is inspectable code and an architecture walkthrough, which is stronger for implementation detail than for general performance claims.
- Missing evidence: No cross-host compatibility matrix, browser/iframe security review, load test, cost curve, or production incident record.
- Conflicts or uncertainty: The sample repository explicitly describes itself as a demo/reference and warns that production use requires hardening, testing, and review. Standing WAF, CloudFront, and Runtime costs also matter for idle deployments.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “MCP App 從 tool call 到 UI widget 的完整請求／資安鏈。” Include an end-to-end sequence diagram and a contract table for tool, resource, auth, sandbox, and cleanup.
- Internal routes: Link to MCP middleware security, enterprise allowlists, and agent runtime observability.
- Human decision required: Keep AWS-specific controls clearly labeled and distinguish the sample's default-deny WAF/resource-policy setup from a production security guarantee.
