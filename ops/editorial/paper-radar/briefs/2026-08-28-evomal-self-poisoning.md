---
stableId: "arxiv:2608.25776"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-28
lastVerifiedAt: 2026-08-28
primaryTrack: "agent-systems"
primaryGap: "agent-security"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 2
  engineeringValue: 5
  seriesValue: 5
  total: 26
decision: "deep-read-candidate"
---

# EvoMal: Self-Poisoning in Self-Evolving Coding Agents

## Identity

- Stable ID: `arxiv:2608.25776`.
- Canonical URL: https://arxiv.org/abs/2608.25776
- Authors: Use the canonical arXiv record for the authoritative author list.
- Venue or review status: arXiv v1 submitted 2026-08-26; no separate review record located.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2608.25776`; no separate identifier located.
- Code / model / data: No paper-specific public implementation repository was located. The paper reports experiments on RedCode and SWE-bench Verified-style tasks, but the attack and agent-skill artifact boundary requires verification.

## Editorial fit

- Reader question: Can a coding agent's self-improvement library turn a single malicious skill into a persistent, self-propagating capability?
- Why this belongs in the selected track: EvoMal studies skill poisoning, propagation, persistence after removal, and defenses in self-evolving coding agents, directly filling `agent-systems` / `agent-security`.
- Gap it fills: Existing security coverage discusses tool permissions and step-level guardrails; this adds a supply-chain and memory-propagation threat against agent-authored skills.
- Why now: The paper reports propagation across six models and tests persistence after the planted skill is withdrawn, which is a materially different failure mode from one-shot prompt injection.

## Claim map

- Problem: A self-evolving coding agent may copy instructions from a retrieved skill into a new authored skill, re-index it, and amplify the malicious payload.
- Main claim: Skill libraries can become self-poisoning and sustain an infection after the original planted skill is removed.
- Method: Seed malicious skills, let agents perform tool-relevant software tasks and author or retrieve skills, then measure attack success, library growth, persistence, and counter-prompt effects.
- Reported result: Across six models and 153 SWE-bench Verified tasks, the abstract reports attack success rates of 20.3–41.8%, library growth of 4.9–9.0 times the planted count, 11.1% payload-only success for DeepSeek V4 Pro, and 68% ASPR for Qwen3 after removal in a five-round cascade.
- What is genuinely new: The threat model treats agent-authored knowledge as a propagating executable supply-chain surface rather than only as static prompt content.

## Evidence audit

- Datasets and benchmarks: 153 tool-relevant SWE-bench Verified tasks, RedCode-related task families, six models, and targeted categories such as pytest fixtures and configuration parsing.
- Benchmarks and metrics: Attack success / payload propagation rate, library growth, persistence after removal, task completion, and defense impact.
- Baselines: Control versus attack conditions, payload-only settings, and counter-prompt mitigation are compared in the HTML tables.
- Ablations: Generic versus targeted tasks, model families, planted-skill removal, and defense prompts expose where propagation is strongest.
- Statistical uncertainty: The full paper gives detailed tables, but the no-artifact boundary and task-family concentration limit independent confidence.
- Threats to validity: Agent prompts, skill formats, indexing policy, tool environment, and task benchmark may all materially affect propagation; deployed systems with signatures, review, sandboxing, or content provenance may behave differently.

## Reproducibility

- Available artifacts and licenses: No paper-specific code or experiment package was located in this scan; arXiv source is not equivalent to an executable benchmark artifact.
- Environment or compute requirements: Reproduction would require the model set, coding-agent harness, skill-library implementation, RedCode/SWE-bench access, and safe containment for malicious payloads.
- Smallest useful reproduction: Build a sandboxed two-agent skill loop, seed one inert test payload, measure copy/re-index/removal persistence, and verify that containment prevents execution outside the test tenant.
- Blocking unknowns: Attack code, task prompts, exact model snapshots, skill parser behavior, and defense implementation remain unverified.

## Critical reading

- Strongest result: Persistence after planted-skill removal makes the risk concrete: deletion of the original artifact may not be equivalent to eradication of the capability.
- Weakest assumption: The measured propagation mechanism transfers from the paper's skill format and task harness to production agent libraries.
- Stated limitations: The paper's controlled benchmark, task-family scope, and defense evaluation do not establish incident prevalence or deployment-wide risk.
- Claims not supported by the evidence: The results do not show that all self-evolving agents are vulnerable, that prompt defenses are sufficient, or that the reported ASPR predicts real-world compromise rates.

## Bloss0m connection

- Related Traditional Chinese routes: Existing agent-security and skill/memory candidates; no duplicate published route was found.
- Related English routes: Connect to the agent-security series, MCP/plugin governance, and the existing SkillZip and Catastrophic Remembering candidates.
- Duplication risk: Medium with skill-poisoning and memory-integrity candidates; the self-propagating worm and removal-persistence angle is the differentiator.
- Suggested internal links: `agent-security`, `ai-platform-governance`, and the existing StepGuard / SkillZip Radar candidates.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 4 evidence quality + 2 reproducibility + 5 engineering value + 5 series value = 26. The threat model is high-impact and technically specific, but no executable artifact was located and transfer to production remains unknown.
- Open questions requiring human approval: Confirm whether the authors will release the attack harness, reproduce the removal-persistence experiment safely, and decide how much detail can be published without operationalizing abuse.

