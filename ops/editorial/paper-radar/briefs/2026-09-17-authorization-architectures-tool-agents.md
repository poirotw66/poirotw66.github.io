---
stableId: "arxiv:2609.15906"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-17
lastVerifiedAt: 2026-09-17
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 4
  evidenceQuality: 3
  reproducibility: 2
  engineeringValue: 5
  seriesValue: 5
  total: 24
decision: "deep-read-candidate"
---

# Authorization Architectures for Tool-Using AI Agents

## Identity

- Search window: strict 72-hour scan ending 2026-09-17; arXiv v1 was submitted on 2026-09-14.
- Canonical URL: https://arxiv.org/abs/2609.15906
- Authors and venue: The verified arXiv record identifies this as a 70-page cs.CR review. This brief preserves the review’s source status and does not treat its architectural proposal as a benchmark result.
- Source type: Structured narrative review based on primary literature; no full HTML or runnable artifact was verified from the primary record.
- Scope: The authors report screening 89 primary sources from approximately 180 candidates covering tool-using agents and authorization from 2023–2026.
- Artifact status: No public code, model, dataset, or deployable reference implementation was verified.

## Editorial fit

- Reader question: When an agent calls a tool on behalf of a human, where should identity, delegation, consent, policy enforcement, and audit evidence live?
- Why this belongs in the selected track: Authorization is a missing systems layer between an agent’s plan and the external side effect. The review provides a vocabulary for discussing that layer across principals and deployments.
- Gap it fills: `agent-systems / tool-use-reliability`, with direct overlap with provenance, capability boundaries, prompt-injection resistance, and multi-principal delegation.
- Why now: Agent runtimes increasingly combine human identity, orchestrators, subagents, service accounts, MCP tools, and external OAuth providers. Treating this as “just add a token” hides scope propagation and non-repudiation failures that become difficult to investigate after the fact.

## Claim map

- Problem: Traditional application authorization assumptions break when an agent plans, delegates, invokes tools, and may act asynchronously across multiple principals.
- Principal model: The review organizes a hierarchy involving human, operator, deployer, orchestrator, subagent, and tool endpoint. This makes “who authorized this action?” a chain question rather than a single user-ID lookup.
- Five layers: Identity and credential lifecycle; delegation and scope propagation; runtime or just-in-time authorization at policy-enforcement points; prompt injection as an authorization bypass; and auditability, provenance, and non-repudiation.
- Structural proposal: The paper distills seven requirements, a four-layer reference architecture, and three deployable configurations. These are design requirements and configurations synthesized from the literature, not experimentally validated products.
- What is genuinely useful: The decomposition forces teams to model authorization decisions at the tool boundary and to preserve the delegation context that led to a call. It also connects prompt injection to authorization bypass rather than treating it only as a text-filtering problem.

## Evidence audit

- Evidence type: Literature synthesis and architectural analysis. The source is valuable for coverage and terminology, but it does not report a controlled benchmark, incident dataset, or production deployment study.
- Source base: The review states that 89 primary sources were retained after screening. A paper-reading article should sample and link the most consequential primary sources rather than presenting the count as independent validation.
- Quantitative evidence: No verified accuracy, latency, cost, attack-success, or policy-enforcement metric supports the proposed architecture.
- Unresolved boundary: Runtime enforcement, delegated-scope composition, and aggregation bounds remain open. A policy that is safe for one tool or principal can become unsafe when permissions compose through an orchestrator and subagent.
- Vendor or author claims requiring qualification: The reference architecture is an informed synthesis. It should not be described as a proven standard or as evidence that any particular deployment is secure.

## Reproducibility

- Available artifacts: No public runnable artifact, benchmark harness, policy corpus, or reference implementation was verified.
- Smallest useful reproduction: Build a toy chain with a human, orchestrator, subagent, and two tools; issue delegated scopes, rotate a credential, inject an untrusted instruction, and record policy decisions with provenance. Use the review’s five layers as an audit checklist, not as a claim of paper replication.
- Blocking unknowns: The paper does not provide executable policy semantics, a canonical event schema, enforcement latency, failure cases from a shared corpus, or a reproducible procedure for measuring the proposed aggregation bounds.

## Critical reading

- Strongest contribution: A clear systems decomposition of a problem that is frequently flattened into authentication. The hierarchy and layer model provide concrete questions for design reviews: who can delegate, what scope survives delegation, and which component can prove the decision later?
- Weakest assumption: Requirements that sound structurally necessary are not automatically sufficient under concurrency, stale credentials, partial failures, retries, or malicious subagents.
- Engineering consequence: Agent platforms should bind each tool call to a principal chain, requested and granted scope, policy version, consent state, credential reference, and an auditable decision—not only the tool name and success status.
- Claims not supported by the evidence: The review does not establish that the four-layer architecture prevents prompt injection, that the three configurations are interoperable, or that the unresolved aggregation problem has a general solution.

## Bloss0m connection

- Related Traditional Chinese routes: [When Tool Calls Succeed but Workflows Fail](/paper-reading/52-when-tool-calls-succeed-workflows-fail/), [ADIAS](/paper-reading/49-adias-agent-self-improvement/), and [EvoOntology](/paper-reading/50-evoontology-self-evolving-ontology/).
- Related English routes: [When Tool Calls Succeed but Workflows Fail](/en/paper-reading/52-when-tool-calls-succeed-workflows-fail/), [ADIAS](/en/paper-reading/49-adias-agent-self-improvement/), and [EvoOntology](/en/paper-reading/50-evoontology-self-evolving-ontology/).
- Suggested article angle: “Agent 的授權不是一顆 token：從人、協調器、子代理到工具端點的責任鏈。” Contrast the paper’s architecture with real OAuth consent and capability-gated writes.
- Duplication risk: Medium. The topic touches existing tool-boundary and provenance coverage, but the principal hierarchy and authorization layering are distinct enough for a review if the article stays critical.

## Recommendation

- Output level: Deep Read candidate with an explicit review-status label; teach the architecture and its open problems, not a fictitious empirical result.
- Score rationale: 24/30: excellent systems relevance, strong series value and engineering consequences, but novelty is architectural synthesis, evidence is literature-based, and reproducibility is low because there is no runnable artifact or benchmark.
- Open questions requiring human approval: What is the minimum interoperable authorization event? How should delegated scopes compose and expire? Which adversarial tests should a real AgentCore, MCP, or internal agent runtime pass before claiming end-to-end authorization?
