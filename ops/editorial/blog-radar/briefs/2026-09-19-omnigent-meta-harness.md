---
stableId: "url:https://github.com/omnigent-ai/omnigent"
status: "durable-post-candidate"
firstSeenAt: 2026-09-19
lastVerifiedAt: 2026-09-19
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 5
  total: 23
decision: "write-now"
---

# Omnigent: 多個 Agent Harness 之上的 control plane

## Identity

- Search window: Strict 72-hour scan ending 2026-09-19; the public repository was updated on 2026-09-19.
- Canonical URL: https://github.com/omnigent-ai/omnigent
- Publisher or author: Omnigent open-source maintainers.
- Published or updated date: 2026-09-19.
- Source type: Official open-source agent runtime/meta-harness repository.
- Supporting evidence: README, terminal orchestration, Linux bubblewrap, macOS Seatbelt, policy/sandbox documentation, and cloud-session provisioning paths.

## Editorial fit

- Reader question: If teams use Claude Code, Codex, Cursor, or Pi, where should cross-agent policy and isolation live?
- Why now: Omnigent wraps several agent harnesses and exposes a shared control plane for collaboration, policy, terminal capture, and local or cloud sandboxing.
- Engineering angle: The abstraction is not another model wrapper; it is an execution boundary that must normalize terminal, filesystem, and network authority.
- Archive fit: It broadens the agent-runtime cluster from individual CLI hardening to multi-harness orchestration.

## Claim map

- Primary claim: Omnigent can orchestrate multiple coding-agent harnesses while applying platform-specific sandbox mechanisms.
- Inspectable evidence: Linux bubblewrap, macOS Seatbelt, session policies, terminal wrappers, and cloud sandbox references are visible in the repository.
- Author claim requiring qualification: Real-time collaboration and broad harness compatibility are repository claims, not independently measured outcomes.
- Engineering consequence: A meta-harness needs a capability matrix and one canonical audit record across otherwise incompatible agent runtimes.

## Evidence audit

- Primary evidence inspected: Public repository documentation and source paths for wrappers, policy, and sandbox setup.
- Missing evidence: No independent isolation test, escape-resistance benchmark, compatibility matrix, or cost/latency comparison was verified.
- Uncertainty: Platform behavior differs between Linux, macOS, and provisioned cloud sessions; the article must keep those paths separate.

## Recommended treatment

- Output level: Durable post candidate.
- Proposed angle: “Meta-harness 不是多一層 UI：它其實是 agent execution 的 control plane。”
- Artifact: Public Apache-2.0 repository with inspectable sandbox and wrapper code.
- Human decision required: Present this as an architecture audit and test plan, not as a validated security guarantee.
