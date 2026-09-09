---
stableId: "arxiv:2609.05269"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-08
lastVerifiedAt: 2026-09-08
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 5
  total: 30
decision: "deep-read-candidate"
---

# CONTINUITY：讓 Agent 的 provenance、授權與 effect-bound execution 跨過每一道邊界

## Identity

- Search window: strict 72-hour scan from 2026-09-05 00:31Z to 2026-09-08 00:31Z found no newer sufficiently evidenced paper with a stronger fit; this candidate is a 7-day backfill from 2026-09-04.
- Canonical URL: https://arxiv.org/abs/2609.05269
- Authors: Chris Zheng and Geng Yang, ZAST.AI.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-04; full HTML paper is available and dated 2026-09-05.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.05269
- Code and artifact: https://github.com/zast-ai/continuity

## Editorial fit

- Reader question: When an agent passes through provenance tracking, authorization, policy gateways, protocol adapters, and effect sinks, what proves that the final side effect is still authorized by the original context?
- Why this belongs in the selected track: CONTINUITY turns a familiar “defense in depth” slogan into an explicit composition contract: every boundary must preserve or justify security-relevant fields, and the final effect needs a current, single-use witness.
- Gap it fills: Tool-use reliability—end-to-end security-context continuity across agent components, including transformations, delegation, revocation, and replay.
- Why now: Agent systems increasingly chain model output, memory, MCP/tool adapters, policy checks, and external actions. Local signatures or local allowlists can all pass while a downstream adapter silently changes the destination or drops the source binding.

## Claim map

- Problem: Individually correct controls can compose into an insecure path when context is truncated, amplified, rebound, transformed without proof, or used after revocation/expiry.
- Main claim: An assume–guarantee contract model plus signed roots, field-level provenance, typed releases, transition receipts, transformation witnesses, and finality permits can enforce end-to-end consequence integrity (ECI).
- Method: Model a path from ingress through components to a verifier and finality sink; bind canonical JSON-pointer leaves, producer roles, task/policy epochs, source commitments, transformations, and one-shot effect permits; then inject cross-layer faults.
- What is genuinely new: The paper treats the transition relation—not merely endpoint signatures—as a first-class security object, and makes “the final sink can explain why this exact effect is allowed” the system invariant.

## Evidence audit

- Main results: The 1.5-KLOC prototype covers 32 fault classes across four domains, 3,460 scenarios, and 24,220 system–scenario runs. In 2,560 attack instances the full configuration commits no harmful effect, completes all 700 benign tasks, and escalates all 200 ambiguous tasks.
- Method controls: Targeted ablations reopen 4–24 fault–domain classes depending on the omitted invariant. The paper reports median proof verification of 4.21 ms and median end-to-end transition/finality of 7.17 ms on the recorded host.
- Baseline or comparison: The strongest incomplete reference configuration commits a harmful effect in 65.6% of attack instances under the same conformance setup.
- Artifact: The authors link a public dependency-light Python reference implementation with regression tests, deterministic fault injection, raw results, and reproducibility commands.
- Statistical uncertainty: The test matrix is deterministic and parameterized, but it is not an estimate of real-world attack probability; the paper explicitly frames it as conformance evidence under a declared trusted-computing-base model.
- Threats to validity: The benchmark assumes trusted roots, deterministic sinks, a bounded transformation language, and complete mediation of effects. Semantic correctness, malicious trusted issuers, covert channels, denial of service, and arbitrary provider behavior remain outside the guarantee.

## Reproducibility

- Available artifacts: Full HTML paper, public GitHub artifact, 30 regression tests, fault-injection suite, reference configurations, raw results, and commands mapping claims to artifacts.
- Environment or compute requirements: Dependency-light Python prototype; deterministic cryptographic objects and JSON-pointer field checks; the paper reports timing on a recorded host rather than a large distributed deployment.
- Smallest useful reproduction: Run the reference verifier against the minimal alias-transformation example, then disable one invariant at a time and confirm that the corresponding fault classes reopen while benign/ambiguous cases retain their expected outcomes.
- Blocking unknowns: Whether the artifact’s released code exactly matches every HTML claim, how the verifier behaves under real MCP/HTTP/gRPC serialization boundaries, and the operational cost of key rotation, revocation, and policy-epoch management.

## Critical reading

- Strongest result: It identifies a failure mode that ordinary signatures and tool allowlists miss, then makes the missing transition relation executable and testable.
- Weakest assumption: The trusted computing base includes the roots, role bindings, policy state, canonicalization, verifier, finality sinks, and key lifecycle. A deployment that misconfigures those inputs can satisfy the proof while remaining unsafe in practice.
- Unsupported leap: “No harmful effect in the conformance suite” is not “prompt injection solved.” ECI protects a declared structural boundary; it cannot establish that the source is truthful or that the model’s high-level intent is semantically correct.

## Bloss0m connection

- Related routes: agent governance, provenance, MCP/tool authorization, prompt-injection containment, and effect-bound execution.
- Duplication risk: Low to medium with existing MCP governance and agent-safety coverage; this paper’s distinctive object is the contract carried across transitions, not a new detector or model safeguard.
- Suggested internal links: Pair with the Open Science provenance contract article, the MCP stateless deployment notes, and future coverage of agent observability and policy enforcement.

## Recommendation

- Output level: Deep Read.
- Score rationale: 30/30 on topical fit, novelty, evidence, reproducibility, engineering consequence, and series value. The artifact and explicit limits justify the high score, while the paper’s declared assumptions should remain central to any reading.
- Open questions requiring human approval: Can the same contract survive real protocol adapters and asynchronous retries? Which fields are worth carrying in production without making every agent transition too expensive to operate?
