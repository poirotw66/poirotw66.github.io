---
stableId: "url:https://aws.amazon.com/blogs/machine-learning/implementing-synthetic-monitoring-using-amazon-nova-act/"
status: "candidate"
firstSeenAt: 2026-10-01
lastVerifiedAt: 2026-10-01
primaryCategory: "Cloud & Platform"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 23
decision: "candidate"
---

# Implementing synthetic monitoring using Amazon Nova Act

## Identity

- Search window: 2026-09-28 through 2026-10-01; the source page gives a date but no publication time, so this is marked as a seven-day backfill at the 72-hour boundary.
- Discovery queries: `agent-driven synthetic monitoring browser journey Nova Act September 2026`; `site:aws.amazon.com/blogs/machine-learning/ Nova Act monitoring AgentCore`; `Amazon Nova Act synthetic monitoring sample repository`.
- Canonical URL: https://aws.amazon.com/blogs/machine-learning/implementing-synthetic-monitoring-using-amazon-nova-act/
- Publisher or author: Amazon Web Services; authors Sarath Krishnan, Matthew Jorat, and Karen Huttsell.
- Published or updated date: 2026-09-28.
- Source type: First-party cloud engineering walkthrough.
- Direct supporting sources: [MIT-0 sample implementation](https://github.com/aws-samples/sample-nova-act-synthetic-monitoring); [sample README and deployment instructions](https://github.com/aws-samples/sample-nova-act-synthetic-monitoring#readme).

## Editorial fit

- Why now: This is a complete implementation rather than a conceptual agent demo: journey assertions, runtime deployment, scheduling, isolated browser sessions, alerts, infrastructure alarms, and cleanup are all described and represented in a public sample.
- Reader question: Can a vision-based agent make synthetic monitoring less brittle without making the monitor itself an unreliable or expensive source of false alerts?
- Story hook: Nova Act replaces CSS/DOM selector scripts with screenshot-based language actions, but AWS says adaptation succeeds around 90% of the time and the sample uses a single attempt by default. That makes retries, false-alert rates, and cost part of the monitor's correctness contract.
- Category and topic cluster: Cloud & Platform; `ai-agent` is a plausible writing-time cluster if the post is framed around the agent runtime and operational boundary.
- Existing coverage and duplication risk: No matching Nova Act synthetic-monitoring article or draft was found in either language archive or the Blog Radar ledger. This is distinct from generic browser-agent and AgentCore material because it separates customer-journey failures from schedule/runtime delivery failures.
- Why this remains useful after the current news cycle: Teams still need to test real user outcomes rather than infer them from service health. The split between application assertions, agent execution, and monitor-infrastructure alarms is reusable across visual-agent monitoring designs.

## Claim map

- Primary claim: AWS describes scheduled user-journey checks using Nova Act inside Amazon Bedrock AgentCore, with AgentCore Browser for isolated browser sessions and EventBridge/SNS for scheduling and failure notification.
- Measured evidence: The article's sample uses natural-language `act()` actions and Boolean-schema `act_get()` assertions. The sample repository includes login, ecommerce, and login-failure journeys; a deploy script; a test script; and a production CDK option. CDK provisions a schedule, least-privilege invocation, an SQS dead-letter queue, and CloudWatch alarms for failed or missing invocations. The article estimates a six-step journey at two to four minutes and lists the billable components for a five-minute schedule, but does not present one all-in price.
- Vendor or author claims requiring qualification: AWS reports more than 90% browser-workflow accuracy in early enterprise use cases and approximately 90% natural-language adaptation success, but the post does not disclose the evaluation set, metric definition, confidence interval, or independent comparison. The architecture and benefits are AWS-authored and AWS-specific.
- Bloss0m engineering consequence: Monitor two systems independently: whether the user journey produced the intended outcome, and whether the schedule/runtime/browser infrastructure ran at all. Instrument assertions and agent failures separately from EventBridge delivery, DLQ depth, and missing invocations; choose retries only after measuring their effect on false positives and cost.

## Evidence audit

- Primary evidence inspected: The dated AWS walkthrough and its linked `aws-samples/sample-nova-act-synthetic-monitoring` repository, including its README, deployment and cleanup instructions, architecture assets, and MIT-0 license.
- Baseline or comparison: The article contrasts selector-based Selenium/Playwright scripts with visual language actions but provides no head-to-head study of maintenance burden, completion rate, false alerts, or total cost.
- Missing evidence: Independent execution, a reproducible comparison against Playwright or another monitor, the method behind the 90% accuracy claim, empirical false-positive/false-negative rates, and full price assumptions for the recurring workflow.
- Conflicts or uncertainty: The article discusses a five-minute cost scenario while the public sample README defaults to a ten-minute EventBridge schedule. Keep those configurations separate. Its CloudWatch alarms detect scheduling/invocation failures; user-journey logic failures are sent through the agent's SNS path.

## Recommended treatment

- Output level: write-now; durable-post-candidate, not a publication promise.
- Proposed angle: “An agent can watch the checkout—but who watches the watcher?” Trace the full path from scheduled invocation to browser action and explicit outcome assertion, then explain why monitor correctness, infrastructure health, false alerts, retry policy, and recurring spend need separate signals.
- Internal routes: Link to existing browser-agent, observability, and AgentCore material only after confirming the current bilingual routes during drafting.
- Score rationale: 23/25 (topic 5, durability 4, evidence 4, engineering 5, reader interest 5). The MIT-0 artifact and operationally complete flow support close inspection; the reported accuracy is vendor-supplied and has no disclosed evaluation method.
- Human decision required: Do not call the sample independently validated or production-proven; preserve the difference between the article's five-minute cost scenario and the repository's ten-minute default, and label the ~90% figures as AWS-reported.
