---
stableId: "url:https://aws.amazon.com/blogs/publicsector/reducing-documentation-drift-with-amazon-bedrock-agentcore/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-21
lastVerifiedAt: 2026-09-21
primaryCategory: "Enterprise AI"
primaryCluster: "enterprise-rag"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 5
  total: 24
decision: "write-now"
---

# Reducing Documentation Drift with Amazon Bedrock AgentCore：讓 code 成為文件同步的 source of truth

## Identity

- Search window: Strict 72-hour scan ending 2026-09-21; AWS published the post on 2026-09-20.
- Canonical URL: https://aws.amazon.com/blogs/publicsector/reducing-documentation-drift-with-amazon-bedrock-agentcore/
- Publisher or author: AWS Public Sector Blog, describing Corley and Eutelsat's solution.
- Source type: Official engineering/customer deployment post.

## Editorial fit

- Reader question: Can an agent update enterprise documentation without turning the knowledge base into another source of drift?
- Why now: The post describes a complete code-to-documentation loop: S3 and S3 Vectors for domain context, Bedrock AgentCore Runtime and Gateway, GitLab and Atlassian MCP servers, Confluence publishing, and human review.
- Engineering angle: Follow the nine-step flow and make the authority boundary explicit: domain context informs language, but repository code wins when existing documentation contradicts it.
- Archive fit: Adds a concrete enterprise RAG/MCP deployment pattern with runtime, ingestion, publishing, timing, human-review, and cost details.

## Claim map

- Primary claim: Eutelsat and Corley processed 30 repositories with roughly 15–20 minutes of agent execution, 1–2 hours of human review per repository, and a few dollars of AWS cost per repository.
- Inspectable evidence: The post includes two architecture diagrams, numbered interactions, the AWS service topology, and a results table.
- Vendor/customer claim: AWS reports more than 90% estimated time savings and a cross-repository relationship view; these figures are not independently audited.

## Evidence audit

- Primary evidence inspected: AWS post dated 2026-09-20, including architecture, MCP integrations, results, and customer context.
- Missing evidence: No public runnable sample, independent cost study, source-code corpus, or quality/error analysis for generated Confluence pages was verified.
- Uncertainty: The solution is a described customer deployment, not a controlled benchmark; “few dollars” and “>90%” remain first-party estimates.

## Recommended treatment

- Output level: Durable post candidate.
- Proposed angle: “Agentic RAG 的關鍵不是生成文件，而是定義誰說了算：拆解 code、knowledge base、MCP 與 human review 的 authority boundary。”
- Artifact: Two official architecture diagrams, nine-step operational flow, and deployment results table.
- Human decision required: Label AWS/Eutelsat performance and savings as reported outcomes, and explain why source-code authority does not eliminate the need for review.
