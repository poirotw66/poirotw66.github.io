---
stableId: "url:https://aws.amazon.com/blogs/machine-learning/monitoring-production-agent-lifecycle-with-aws-devops-agent-and-agentcore-evaluations/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-14
lastVerifiedAt: 2026-09-14
primaryCategory: "Enterprise AI"
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

# Monitoring the Production Agent Lifecycle with AWS DevOps Agent and AgentCore Evaluations

## Identity

- Search window: strict 72-hour scan ending 2026-09-13 16:31 UTC; the post was published 2026-09-11.
- Discovery queries: `production agent evaluation`, `agent observability OpenTelemetry`, `AWS AgentCore Evaluations DevOps Agent`.
- Canonical URL: https://aws.amazon.com/blogs/machine-learning/monitoring-production-agent-lifecycle-with-aws-devops-agent-and-agentcore-evaluations/
- Publisher or author: AWS Machine Learning Blog.
- Published or updated date: 2026-09-11.
- Source type: engineering-blog.
- Direct supporting sources:
  - https://github.com/aws-samples/sample-FAST-applications/tree/main/samples/dual-monitoring-system

## Editorial fit

- Why now: Multi-agent systems can fail at two different layers: the answer or trajectory can be poor, while the infrastructure path can also be broken. The post offers a concrete split between quality evaluation and infrastructure diagnosis.
- Reader question: How should a team tell whether an agent failed because it chose the wrong tool, handed off badly, or simply lacked permission to call the underlying model?
- Category and topic cluster: Enterprise AI / agent observability and governance.
- Existing coverage and duplication risk: Medium-low. Existing governance coverage discusses policy and audit; this candidate adds an operational evaluation loop and a trace-to-IAM failure path.
- Why this remains useful after the current news cycle: Sampling policy, evaluator calibration, OpenTelemetry fields, and incident runbooks remain design decisions after the service release changes.

## Claim map

- Primary claim: AgentCore Evaluations can assess agent quality from traces while AWS DevOps Agent investigates the infrastructure and permission path behind failures.
- Measured evidence: AWS describes a four-agent airline-reservation swarm, 16 built-in evaluators (13 LLM-as-Judge and 3 deterministic trajectory matchers), asynchronous sampling from 0.01% to 100%, and CloudWatch emission through OpenTelemetry. The example traces a blank result through the runtime, Bedrock API, and an `AccessDenied` caused by a missing `bedrock:InvokeModel` permission.
- Vendor or author claims requiring qualification: These are AWS's architecture and feature claims. The post does not report an independent production baseline, evaluator precision, false-positive rate, or incident-resolution time.
- Bloss0m engineering consequence: Keep quality scores and infrastructure diagnosis as separate signals, then join them with trace IDs, actor/model identity, tool calls, permissions, and timestamps before creating an incident conclusion.

## Evidence audit

- Primary evidence inspected: The AWS engineering post and its linked public reference sample.
- Baseline or comparison: The post is a reference architecture, not a controlled benchmark. The useful comparison is one-layer monitoring versus a joined quality-plus-infrastructure view.
- Missing evidence: No third-party evaluation of the 16 evaluators, production coverage distribution, trace retention/cost data, or measured reduction in mean time to resolution.
- Conflicts or uncertainty: LLM-as-Judge scores can inherit evaluator bias, and the sample's four-agent workflow may not represent graph-shaped or human-in-the-loop deployments.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “Agent observability 要拆成兩層：品質分數與基礎設施故障路徑。” Use a lifecycle diagram and a table mapping quality symptoms to trace, IAM, and tool evidence.
- Internal routes: Link to agent evaluation, MCP governance, and production reliability coverage.
- Human decision required: Frame the post as an inspectable AWS reference pattern, not proof that the monitoring stack works equally well in every production workload.
