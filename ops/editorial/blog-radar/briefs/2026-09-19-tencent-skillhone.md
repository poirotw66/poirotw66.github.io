---
stableId: "url:https://github.com/Tencent/SkillHone"
status: "durable-post-candidate"
firstSeenAt: 2026-09-19
lastVerifiedAt: 2026-09-19
primaryCategory: "AI Engineering"
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

# SkillHone: Agent Skills 的自我修復，從提示詞優化變成可審計的 Issue lifecycle

## Identity

- Search window: Strict 72-hour scan ending 2026-09-19; the repository was updated on 2026-09-18.
- Canonical URL: https://github.com/Tencent/SkillHone
- Publisher or author: Tencent open-source maintainers.
- Published or updated date: 2026-09-18.
- Source type: Official open-source repository.
- Supporting evidence: README, issue-linked repair workflow, regression reports, and Apache/MIT licensing information in the repository.

## Editorial fit

- Reader question: How can an agent improve a reusable skill without silently replacing the skill's behavior?
- Why now: SkillHone turns runtime failures into reproducible problems, regression tests, Git diffs, run records, and a local pull-request approval queue.
- Engineering angle: The interesting unit is not a better prompt but a governed repair loop: capture → diagnose → revise → regress → review.
- Archive fit: Existing coverage discusses agent self-improvement; this source adds a concrete repository and approval boundary rather than another framework promise.

## Claim map

- Primary claim: SkillHone captures skill failures, repairs a complete Skill repository, runs regression checks, and queues only verified changes for review.
- Inspectable evidence: The public repository documents Issue, regression, evidence, rejected alternatives, Git diff, run record, and local PR artifacts.
- Vendor or author claim: The repository reports first-party gains on GAIA and WebWalkerQA-EN; these are not independent reproductions.
- Engineering consequence: Every autonomous repair should have a stable issue identity, a test that reproduces the failure, a diff, and an explicit human approval state.

## Evidence audit

- Primary evidence inspected: Repository README, workflow documentation, examples, and current commit/update metadata.
- Missing evidence: No independent benchmark, cost curve, repair precision/recall, regression escape rate, or long-term repository history was verified.
- Uncertainty: The repository's compatibility claims cover several agent runtimes, but cross-runtime parity was not independently tested.

## Recommended treatment

- Output level: Durable post candidate.
- Proposed angle: “Agent 自我修復的安全版本：為什麼每次改 Skill 都需要 Issue、regression、diff 與 review gate？”
- Artifact: Public repository that can be inspected and run; no independent evaluation artifact was verified.
- Human decision required: Separate the inspectable lifecycle design from the repository's claimed benchmark improvements.
