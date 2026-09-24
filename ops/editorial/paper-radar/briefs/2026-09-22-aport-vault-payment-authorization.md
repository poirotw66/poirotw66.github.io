---
stableId: "arxiv:2609.22076"
sourceVersion: "v1"
status: "published"
firstSeenAt: 2026-09-22
lastVerifiedAt: 2026-09-24
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "published"
---

# APort Vault: Pre-Action Authorization for Payment Agents

## Identity

- Search window: Seven-day backfill ending 2026-09-22; arXiv v1 was submitted 2026-09-18.
- Canonical URL: https://arxiv.org/abs/2609.22076
- Full paper: https://arxiv.org/html/2609.22076v1
- Authors: APort authors.
- Venue or review status: arXiv preprint; review status not verified.
- DOI / OpenReview / arXiv aliases: arXiv:2609.22076v1.
- Code / model / data:
  - Evaluation data and scoring artifacts: https://huggingface.co/datasets/aporthq/vault-benchmark-v1
  - Related guardrails repository: https://github.com/aporthq/aport-agent-guardrails

## Editorial fit

- Reader question: Can an agent be prevented from making an unauthorized payment before the external side effect occurs, without simply denying every payment?
- Why this belongs in the selected track: It tests authorization at the agent–tool boundary in a live payment-agent setup, where a successful tool call can become an irreversible external action.
- Gap it fills: agent-systems / tool-use-reliability.
- Why now: The result gives a concrete pre-action control and reports both blocked attacks and permitted payments, avoiding the misleading “security equals deny-all” framing.

## Claim map

- Problem: Prompt or model-level safety can fail when a payment agent is manipulated into an unpermitted transfer; the control must bind policy to the action immediately before execution.
- Main claim: APort Vault's pre-action authorization layer prevents the evaluated unauthorized transfer attacks while preserving allowed payment execution.
- Method: Replay 4,371 human attacks against a live payment agent across 14 models from eight labs, five policies, and 225,964 evaluations, with matched model-alone and pre-action tracks.
- What is genuinely new: The benchmark measures authorization as an executable boundary and reports the trade-off between attack prevention and legitimate payment throughput.

## Evidence audit

- Datasets: Public Vault benchmark snapshot with 225,964 evaluations; access conditions and dataset license must be acknowledged.
- Benchmarks and metrics: 140/76,842 unauthorized transfers in the model-alone track versus 0/69,297 behind the pre-action layer; matched triples report 105 versus 0, with an upper bound of 0.38% after zero observed events in 790 sessions.
- Baselines: Model-alone execution, policy variants, and matched triples across models and attacks.
- Ablations: Policy and track comparisons, plus the report that the layer still allowed 25,370 payments and denied 187 of 25,640 calls.
- Statistical uncertainty: Zero-event results are reported with an upper bound, not as proof of universal prevention; the benchmark and threat corpus remain author-controlled.
- Threats to validity: Payment simulation and attack replay may not capture all production providers, policy languages, identity systems, or adaptive attackers.

## Reproducibility

- Available artifacts and licenses: Hugging Face dataset, scoring code/scripts, and related GitHub guardrails repository; dataset access may require accepting conditions.
- Environment or compute requirements: Agent/provider configuration, policy layer, replay harness, scoring scripts, and access to model endpoints or recorded traces.
- Smallest useful reproduction: Re-run the matched-triple subset with harmless payment sinks, compare model-alone and pre-action decisions, and audit every denial/allow reason.
- Blocking unknowns: Full provider setup, exact policy configuration, model version pinning, and whether all 225,964 evaluations are downloadable without additional credentials.

## Critical reading

- Strongest result: The evaluation reports a security layer that blocks the tested unauthorized transfers without reducing all actions to denial.
- Weakest assumption: The replay corpus and payment environment are representative enough to stand in for production authorization failures.
- Stated limitations: The benchmark is bounded by its attack set, model/provider selection, policy set, and snapshot date.
- Claims not supported by the evidence: The paper does not prove zero unauthorized payments in arbitrary live financial systems or against adaptive attacks outside the corpus.

## Bloss0m connection

- Related Traditional Chinese routes: Agent permissions, tool-use reliability, OAuth/consent, and external-write governance.
- Related English routes: Pre-action authorization, agent guardrails, payment security, and evaluation design.
- Duplication risk: Adjacent to approval-binding papers, but the distinct contribution is a large authorization benchmark with allowed-action accounting.
- Suggested internal links: Link to agent permission and workflow-failure readings, explicitly comparing pre-action policy binding with human approval.

## Recommendation

- Output level: Published Deep Read #66 — `66-aport-vault-payment-agent-authorization`.
- Score rationale: 29/30: strong engineering consequence, novel boundary, large evaluation, public artifacts, and careful zero-event reporting; reproducibility loses one point for access and environment friction.
- Open questions requiring human approval: Include a policy decision table and preserve the distinction between vendor/author benchmark claims and an independent security guarantee.
