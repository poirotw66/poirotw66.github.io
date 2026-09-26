---
stableId: "arxiv:2608.15888"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-24
lastVerifiedAt: 2026-08-24
primaryTrack: "agent-systems"
primaryGap: "agent-security"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 4
  total: 29
decision: "deep-read-candidate"
---

# Bounded Agents: delegation security as an authorization architecture

## Identity

- Stable ID: `arxiv:2608.15888`.
- Canonical URL: https://arxiv.org/abs/2608.15888
- Authors: Xabier Muruaga.
- Venue or review status: arXiv v1, submitted 2026-08-16 UTC (2026-08-17 Asia/Taipei); no venue or review record identified.
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI `10.48550/arXiv.2608.15888`; no separate identifier identified.
- Code / model / data: https://github.com/xmuruaga/bounded-agents; Apache-2.0 reference implementation, tests, deterministic evaluation inputs/results, paper PDF/source, and optional AgentDojo runs requiring AWS Bedrock credentials.

## Editorial fit

- Reader question: How can an agent runtime prevent delegated authority and individually permitted actions from composing into a prohibited outcome?
- Why this belongs in the selected track: It fills the `agent-systems` / `agent-security` gap with an explicit authorization architecture for multi-hop delegation, session history, budgets, composition, evidence, approval, and intent.
- Gap it fills: Delegation attenuation, composition-aware authorization, blast-radius reasoning, and security evaluation outside model behavior.
- Why now: The paper is a fresh August 2026 artifact with runnable tests and data. It provides a concrete counterpoint to prompt-only safety and connects directly to existing Bloss0m governance/configuration coverage.

## Claim map

- Problem: Static session permissions and independent per-request checks allow a compromised sub-agent to inherit broad authority or combine permitted actions into exfiltration or destructive outcomes.
- Main claim: Agentic Principal Chain (APC) can carry delegated scope and budgets through a principal chain and enforce six conjunctive authorization conditions over accumulated session state.
- Method: Represent authority as a narrowing chain; check identity, scope/composition, context, approval, evidence, and intent outside the model; enforce composition closure over prior actions; evaluate deterministic attack suites and AgentDojo cohorts.
- What is genuinely new: The paper makes delegation and action composition first-class authorization state, proves blast-radius monotonicity and conditional composition soundness, and tests the enforcement path independently of model behavior by inserting ground-truth attack calls.

## Evidence audit

- Datasets: 3,154 evaluation instances across deterministic delegation, InjecAgent, ASB, adaptive attacks, and AgentDojo cohorts; the repository commits the deterministic inputs/results and documents AgentDojo dependencies.
- Benchmarks and metrics: AgentDojo exfiltration falls from 75–100% to 0% across four compromised-model suites; APC blocks 544 InjecAgent data-stealing cases; intent binding reduces destruction from 38.6% to 4.0% and manipulation from 90.5% to 12.1%; p99 authorization latency is reported as 0.24 ms on an idle host. Utility is 8.6 and 13.9 percentage points lower in the two AgentDojo settings.
- Baselines: Static permissions and unconstrained delegation/composition are the relevant conceptual baselines; exact head-to-head mechanism comparisons and all harness settings require the full paper.
- Ablations: Delegation chain, budget, evidence, approval, composition, and intent components are mapped to code/tests; the editorial read should verify which result changes when each condition is removed.
- Statistical uncertainty: Deterministic suites provide repeatable counts, but model/harness diversity, AgentDojo sampling, and utility variance need careful denominator checks.
- Threats to validity: Composition soundness assumes a complete restriction set and serialized admission; production concurrency, missing restrictions, compromised policy metadata, model/tool semantic ambiguity, and unmodeled external side effects can weaken the guarantee.

## Reproducibility

- Available artifacts and licenses: Public Apache-2.0 repository with core library, 215 tests, evaluation harnesses, committed result files, adapted benchmark inputs, and paper-to-code mapping. AgentDojo live-LLM runs require AWS Bedrock credentials.
- Environment or compute requirements: Python 3.11+; deterministic core/evaluations have zero runtime dependencies according to the README; full AgentDojo utility/compromised-model evaluations need external packages, credentials, and model access.
- Smallest useful reproduction: Run the test suite, demo, `verify_numbers.py`, and deterministic delegation/InjecAgent/ASB scripts; then reproduce one AgentDojo suite with a fixed model and compare utility versus attack blocking.
- Blocking unknowns: Independent audit of formal assumptions, concurrency semantics, policy-restriction completeness, benchmark adaptation fidelity, and whether the public result files exactly match the arXiv v1 paper.

## Critical reading

- Strongest result: The artifact separates authorization enforcement from model compliance and shows a measurable security/utility trade-off across both deterministic and model-mediated settings.
- Weakest assumption: The guarantee is strongest when the restriction set is complete and admissions are serialized; real systems may have missing policy edges, concurrent calls, or side effects outside the modeled action algebra.
- Stated limitations: The abstract explicitly limits composition soundness to complete restriction sets and serialized admission; the paper also reports utility loss and relies on selected attack suites.
- Claims not supported by the evidence: APC does not prove general agent safety, eliminate prompt injection, guarantee intent understanding, or transfer its 0% exfiltration result to arbitrary tools, policies, concurrency models, or organizations.

## Bloss0m connection

- Related Traditional Chinese routes: `43-enterprise-ai-agent-security`; `39-enterprise-agentic-ai-governance`; `74-agentic-configuration-management`; `12-agents4d-runtime-risks`.
- Related English routes: the paired English routes for the same entries.
- Duplication risk: Medium. Existing papers cover intent-bound controls, configuration provenance, and lifecycle risk; this candidate's distinct center is delegated authority plus composition closure with a runnable authorization kernel.
- Suggested internal links: least privilege, policy graph completeness, approval tokens, evidence chains, session state, cross-agent handoff, and side-effect rollback.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30 reflects direct agent-security relevance, a novel authorization framing, formal and executable evidence, public code/data/tests, and high engineering value. Series value is 4 because it strengthens an existing high-priority gap but should be read alongside—not as a replacement for—configuration and runtime-risk work.
- Open questions requiring human approval: Decide whether to teach APC as a reusable policy-kernel pattern or critique its formal boundary first; reproduce the deterministic claims; preserve the utility loss and complete-restriction/serialized-admission assumptions in both languages.
