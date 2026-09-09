---
title: "CONTINUITY: Keeping provenance, authorization, and tool effects continuous across Agent composition"
description: "A critical reading of Zheng and Yang's CONTINUITY (arXiv:2609.05269 v1): security-context contracts, field-level provenance, transformation witnesses, and effect-bound permits for preserving an LLM Agent's instruction-to-effect boundary."
pubDate: 2026-09-09
updatedDate: 2026-09-09
tldr:
  - "CONTINUITY targets a composition failure, not simply whether a model resists prompt injection: provenance, authority, policy, or action semantics can be dropped, amplified, rebound, or replayed as a request crosses individually plausible controls."
  - "It gives each component an assume–guarantee contract and carries a signed root grant, leaf-level provenance, bounded typed release, role-bound transition receipt, transformation witness, and subject/action/policy/replay-bound one-shot permit to finality."
  - "In the authors' deterministic suite, 4 domains, 32 fault classes, and 20 instances per fault–domain pair produce 2,560 attack instances; the full configuration has 0% effect ASR, contains 128/128 fault–domain classes, completes 700 benign tasks, and escalates 200 ambiguous tasks."
  - "This is conditional conformance evidence, not a real-world attack probability or a proof of semantic correctness. Trusted roots, validator correctness, context completeness, complete effect mediation, and provider semantics remain outside the demonstrated boundary."
audience:
  - "Security engineers building Agent tool use, policy gateways, MCP or protocol adapters, and effect brokers"
  - "Technical leads who need to connect provenance, authorization, transformations, replay, and external side effects into a verifiable control plane"
tags: ["Paper Reading", "Agent Systems", "Agent Security", "Tool Use", "Provenance", "Prompt Injection"]
image: "/paperReading/45-continuity-security-context-contracts/title_image.webp"
field: "AI Security"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "CONTINUITY: Security-Context Contracts for Composable LLM Agent Controls"
  authors:
    - "Chris Zheng"
    - "Geng Yang"
  year: 2026
  venue: "arXiv 2609.05269 v1（2026-09-04；未同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2609.05269v1"
    arxiv: "https://arxiv.org/abs/2609.05269"
    doi: "https://doi.org/10.48550/arXiv.2609.05269"
    code: "https://github.com/zast-ai/continuity"
    project: "https://arxiv.org/html/2609.05269"
series:
  id: "agent-security-controls"
  title: "Agent Runtime, Security, and Effect Boundaries"
  part: 1
  totalParts: 1
---

This reading covers [CONTINUITY: Security-Context Contracts for Composable LLM Agent Controls](https://arxiv.org/abs/2609.05269) v1 (2026-09-04). It is an arXiv preprint, not a peer-reviewed conference or journal paper; the article does not present it as peer reviewed. I checked the [full arXiv HTML](https://arxiv.org/html/2609.05269), PDF, all five figures, Tables 1–4, Appendices A–C, the limitations, and the author-provided [research artifact](https://github.com/zast-ai/continuity).

If you have read [Indirect Prompt Injection](/en/paper-reading/42-indirect-prompt-injection/), its starting point should feel familiar: attacker-controlled data can influence an Agent's plan. CONTINUITY asks the next systems question—after the planner is treated as adversarial, why should a final sink commit only the authorized effect when provenance, authorization, and action representations pass through memory, policy, an adapter, a tool server, and a finality boundary? It also pairs naturally with [Parsing the Stream](/en/paper-reading/43-parsing-the-stream-live-trace/): that paper makes execution state replayable and observable, while this one makes security context a contract-bearing state that must survive component boundaries.

## The paper in 90 seconds

- **Problem:** An Agent security path rarely has one control point. Ingress may track provenance, a gateway may enforce policy, an adapter may change the protocol representation, a tool server may create an effect, and a final sink may check a permit. Each can look locally reasonable while security-critical context is truncated, amplified, rebound, or accepted in a stale or replayed form.
- **Core insight:** Give every component an assume–guarantee contract, and make each transition carry verifiable evidence for its root, field provenance, release, role, transformation, and finality state. Security is not “the last signature verifies”; it is whether the effect can be traced to a complete, authorized, current, single-use witness chain (Sections 1, 5, and 6).
- **Strongest evidence:** The authors generate 2,560 attack instances from 4 domains, 32 fault classes, and 20 parameterized instances per fault–domain pair, yielding 128 fault–domain classes. The full CONTINUITY configuration records 0/2,560 harmful effects, contains 128/128 classes, completes 700/700 benign tasks, and escalates 200/200 ambiguous tasks (Table 2 and Figure 3).
- **Main boundary:** These are exact conformance counts over a generated fault space, not a natural attack distribution or a production attack rate. Trusted roots, validator correctness, context capture, finality sinks, and provider semantics sit in the TCB or deployment assumptions; the artifact is not a production MCP, A2A, OWASP ACS, or cloud-IAM integration (Sections 3, 8.1, and 12).

My bounded verdict is: **CONTINUITY's durable contribution is not a new signature primitive or policy engine. It is an executable composition contract for the security-relevant fields and transformations that must not disappear at a boundary. For an Agent platform with explicit effect classes and mediated sinks, it is a useful control-plane blueprint. It is not yet a security guarantee for unmediated paths, untrusted semantic validators, or providers with non-atomic, non-idempotent effects.**

> **Huahua's engineering note**
>
> “Provenance is tracked,” “policy passed,” and “the permit is signed” are not three pieces of end-to-end authorization until they refer to the same field value, task, actor, canonical action, and current finality state. Ask every boundary to preserve or independently justify those bindings.

## Version and reading scope

The paper is arXiv:2609.05269v1, 20 pages, and 5 figures, by Chris Zheng and Geng Yang. The arXiv abstract page gives the submission date as 2026-09-04; the HTML body displays 2026-09-05. This article reads v1 and was updated on **2026-09-09**. The paper HTML marks [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the artifact repository's code license is [MIT](https://github.com/zast-ai/continuity/blob/main/LICENSE).

The scope includes Section 1's problem and contributions; Section 2's prompt compromise, control interfaces, and “a signature is not authorization”; Section 3's entities, adversary, TCB, and effect model; Section 4's discontinuity operators and Table 1; Section 5's ECI, contracts, permits, and composition conditions; Sections 6–7's design and verifier; Section 8's methodology, Tables 2–4, Figures 3–5, ablations, and latency; Section 9's theorem-to-implementation correspondence; Sections 10–12's adoption discussion and limitations; and Appendices A–C's proofs, object schemas, commands, reason codes, and claim-to-artifact map.

## Evidence map and the Paper Essence Contract

The reading keeps direct paper evidence, author interpretation, and Bloss0m judgment separate:

| Layer | What this article says |
| --- | --- |
| **Directly supported by the paper** | The security-context discontinuity taxonomy; ECI and composition conditions; the reference verifier; 4 domains × 32 fault classes × 20 instances; Table 2's attack, benign, and ambiguous results; Table 3's targeted ablations; Table 4 and Figure 5's prototype overhead; and Appendix C's reproduction commands. |
| **Author claim** | If the declared TCB, roots, contracts, validators, mediation, and finality-sink conditions hold, a planner-controlled proposal cannot cross the finality boundary without a complete witness. |
| **Not established** | A real-world attack rate; completeness of the fault taxonomy; semantic correctness of trusted validators; production provider safety under concurrency and partial failure; LLM refusal or prompt-injection quality; or direct interoperability with MCP, A2A, OWASP ACS, or cloud IAM. |
| **Bloss0m engineering judgment** | Treat CONTINUITY as a verification skeleton for cross-component security composition, not as a replacement for every policy engine, provenance service, or transaction protocol. Adoption starts with an inventory of every protected leaf field and every effect-equivalent path. |

The six Paper Essence Contract answers are:

1. **What problem does it solve?** Security-context discontinuity: provenance, authority, policy, action, or finality facts are lost, amplified, rebound, or replayed between controls on the instruction-to-effect path.
2. **Why is the previous approach insufficient?** Local signatures, allowlists, gateways, provenance checks, and final permits each inspect only part of the path. They may not know the upstream value's source or whether the downstream action is the same canonical effect.
3. **What is the core technical idea?** Describe each component with assumptions, guarantees, preserved fields, and allowed transformation relations; then let finality accept only a proof-carrying, effect-bound, single-use permit.
4. **How does one representative input move through the method?** A root grant and deployment policy create an envelope; memory, gateway, and adapter produce receipt-bearing envelopes; provenance and typed release bind leaf paths and exact values; an alias transformation carries a trusted witness; the verifier checks the bundle; and the sink rechecks subject, action, policy, revocation, expiry, nonce, and idempotency before committing.
5. **Which evidence supports the headline claim?** Table 2 and Figure 3 report 2,560 attacks and 128 fault–domain classes; Table 3 and Figure 4 show 4–24 reopened classes when selected invariants are removed; Table 4 and Figure 5 report 4.21 ms median proof verification and 7.17 ms median end-to-end transition plus finality.
6. **Where does the claim stop, and what is the engineering consequence?** It stops at the declared TCB, synthetic fault space, restricted transformation language, simplified provider semantics, and complete-mediation assumption. In engineering terms, roots, validators, runtime context capture, and effect paths need explicit ownership; unexplained fields should fail closed or escalate rather than turning 0/2,560 into a production SLO.

## Why previous local controls are insufficient

The previous approach is not one algorithm; it is the common practice of treating a provenance tracker, allowlist, policy gateway, protocol adapter, and final permit as independent local checks. Each can be correct in isolation while lacking a shared contract that says which source, field, authority, transformation, and freshness facts must cross the next boundary. A local pass therefore does not imply end-to-end authorization of the committed effect. The discontinuity taxonomy and worked example below make that limitation concrete.

## First understand security-context discontinuity

### Proposal, admission, and effect are different events

Section 2.1 separates three events that are often conflated:

1. **Proposal:** the planner emits an action candidate. In attack scenarios, CONTINUITY assumes the planner is compromised, so it may propose arbitrary tools, destinations, arguments, delegations, or explanations.
2. **Admission:** deterministic controls decide whether a canonical action satisfies provenance, authority, policy, and contract conditions.
3. **Effect:** an external sink actually commits a state transition. The primary metric is harmful effect realization, not whether the planner emitted dangerous text.

That separation is the first reading hurdle. The paper is not claiming that an LLM will safely refuse every prompt injection. It asks whether a compromised proposal can be stopped outside the effect boundary by a deterministic control plane. This complements the runtime-control perspective in [ARGUS](/en/paper-reading/10-argus-agentic-runtime/), but narrows the focus to composition obligations at interfaces.

### Four discontinuity operators

Section 4 groups boundary failures into four useful operators:

- **Truncation:** the next component cannot see a required source, task, policy epoch, field constraint, or context manifest.
- **Amplification:** authority, delegation scope, tool privilege, or data release becomes broader downstream than the upstream grant allowed.
- **Rebinding:** a field is still called `destination` or `amount`, but its value, source digest, tool/server, canonical representation, or actor has changed.
- **Staleness or replay:** a grant, policy, permit, or nonce is expired, revoked, already used, or replayed in a different context.

Why do local checks miss these? A signature answers who signed an object; it does not answer whether that key was authorized for this stage, or whether an input field and output field denote the same value. A `ToolAllowlist` may see an allowed tool identifier while the destination has changed. `Gateway + finality` may bind the final action exactly while never verifying how the adapter derived it from the gateway-approved state. This is a composition gap; it does not require one isolated endpoint to be obviously broken.

## Core intuition: turn security context into proof-carrying state

A typical Agent control path can look like:

`planner → provenance check → policy check → adapter → tool → effect`

with each arrow passing only an action object that the next stage must reinterpret. CONTINUITY changes it to:

`authenticated root → signed envelopes + transition receipts → verifier → one-shot permit → mediated finality sink`

Each security-relevant field must have one of two histories: it is explicitly preserved, or it changes under an independently verified relation witness. This does not encrypt every payload or forbid every representation change. It makes a security-relevant change an auditable event.

The paper models a component contract as:

$$\mathcal{C}_{i}=(A_{i},G_{i},P_{i},M_{i})$$

Here $A_i$ is the input assumption set, $G_i$ is what the component guarantees on success, $P_i$ is the set of fields that must be preserved, and $M_i$ is the relation language for permitted security-relevant transformations. For an external effect $e$, ECI has the operational shape:

$$\mathsf{Realize}(e)\Rightarrow\exists W_e:\mathsf{Verify}(W_e)=1\ \land\ \mathsf{Realize}(\mathsf{Canon}(W_e))=e$$

`Verify` is deterministic; `Canon` is the canonical representation jointly covered by signatures, permits, and the sink; and `Realize` is the effect the finality sink commits. The equation means that the actual committed canonical action—not a similar action with a valid signature—must have a valid proof chain from root to sink.

## Walk one finance payment through the method

The following is a faithful explanatory walkthrough assembled from Sections 1, 3, and 6 and Appendix B. It is not a new experimental result:

1. **Input:** The Agent reads an attacker-writable invoice and proposes `payment.transfer`. The amount and destination may originate in an external source; the user's root grant permits only a particular actor, finance tool, account scope, and amount predicate.
2. **Intermediate representation:** Trusted ingress creates a signed root grant and initial envelope `E₀`, containing the principal, actor, task root, allowed tool/server, field constraints, provenance and context roots, policy epoch, and expiry. A provenance manifest points to JSON Pointer leaves such as `/action/parameters/amount_cents` or `/action/destination`, binding each to a source ID and exact value digest.
3. **Component decisions:** Memory or gateway can produce only an `Eᵢ` and signed transition receipt under its contract. If an external amount enters a protected field, it needs a source-, value-, path-, predicate-, task-, tool-, and expiry-bound typed release. If an adapter turns a logical alias into a canonical bank address, it needs a trusted directory `alias_resolution` witness binding before and after digests, field path, component, contract, task, and expiry.
4. **Output:** The verifier checks signer, role, predecessor, contract, changed leaf paths, preservation rules, relation witness, monotonic authority/scope/taint/policy, current policy, and the tool manifest. Only then does it issue an execution permit bound to the principal, subject, task root, grant, audience, canonical action digest, bundle digest, policy epoch, nonce, idempotency key, one-time state, and expiry.
5. **Effect:** Immediately before commit, the finality sink compares the actual caller, audience, actual action digest, current policy and revocation state, expiry, and nonce/idempotency state. It then commits and emits an outcome receipt.
6. **Likely failure point:** If the adapter swaps the alias for a plausible account without a trusted transformation witness, the verifier should return `E_MISSING_TRANSFORM_WITNESS` or an `E_TRANSFORM_*` reason. If the permit has already been used or the grant has been revoked, the sink should reject the replay or `E_REVOKED_AT_FINALITY` path. If a shell, browser, or alternate SDK route bypasses the sink, even a correct normal path does not satisfy complete mediation and should be classified as `E_UNMEDIATED_PATH`.

The key intermediate representation is not a better natural-language summary. It is a set of objects whose source, field, authority, role, relation, and finality state the verifier can recompute. Each component must provide a checkable guarantee instead of merely saying it saw the previous result.

## Technical mechanism: from root to finality

### 1. Authenticated chain origin

A root grant is not a permission the planner can self-declare. Deployment policy names the trusted ingress, root-grant issuer, provenance, context, release, and transformation issuers, together with each stage's component identity, role, and contract. The root carries bounds for authority, delegation scope, tools and servers, field constraints, policy epoch, provenance/context commitments, and expiry. Section 3.3 is explicit: a component key is trusted only for its configured role; a registered key does not thereby gain the power to originate a chain, issue a root grant, or sign a release. If the root authority itself is compromised, rooted guarantees fail; later monotonicity checks cannot repair a maliciously authorized origin.

### 2. Field-resolved provenance and typed release

Object-level provenance is not enough. The prototype uses RFC 6901-style leaf paths so that `/action/parameters/amount_cents` can be bound to a source ID and exact value digest. For an attacker-writable external field, a typed release also binds the source digest, target path, value digest, predicate, principal, actor, task, operation, tool, and expiry. The same field name cannot conceal a changed value or source; a release validator admits only the bounded value it explicitly covers.

### 3. Role-bound transition receipts

Every `Cᵢ` produces a new envelope and signed receipt `ρᵢ`. The verifier checks stage, role, signer, contract, sequence, predecessor, input/output digest, producer, and receipt signer, then recomputes changed leaf paths. A contract publishes its guarantees only after assumptions, required fields, postconditions, and transformation relations pass. Downstream stages therefore do not inherit authority merely because an upstream stage claims success.

### 4. Validated semantic transformation

Real systems cannot forbid every representation change: a logical alias may need to become a provider's canonical address. CONTINUITY's point is not preserve-everything. It restricts a legitimate change to a relation witness containing the trusted directory issuer, relation ID, field path, before/after digests, component signer, contract, parameters, task, and expiry; the verifier independently evaluates the relation predicate. The artifact implements one security-relevant relation, `alias_resolution`, plus a small predicate registry. Currency conversion, schema mapping, identifier resolution, aggregation, and declassification require separate versioned validators. A `may_transform` declaration is not authorization.

### 5. Permit and finality

After verification, the system issues a one-shot permit. The finality sink does more than verify a signature: it rechecks the explicit caller subject, sink audience, actual action digest, policy identity/digest/epoch, grant and permit revocation, expiry, nonce, and idempotency state before consuming one-time state and applying the effect. This is the time-of-check/time-of-use boundary: an earlier gateway decision does not guarantee validity when the effect occurs.

### 6. Complete mediation

Complete mediation is a deployment obligation: every effect-equivalent path must route through a compatible sink. The paper calls out tool aliases, direct SDK calls, browser automation, shell commands, remote agents, and recovery paths as possible alternate routes. The normal verifier cannot discover every unregistered path in your environment; it can enforce ECI only after the path is represented in policy and sink coverage.

## Paper architecture and verifier evidence

![CONTINUITY Figure 3: harmful-effect success and benign auto-completion for the complete system and incomplete compositions.](/paperReading/45-continuity-security-context-contracts/paper/figure-3-main-security-utility.webp)

*Figure 3, the main conformance result in Section 8.2: the full system preserves benign completion while containing harmful effects across 2,560 attack instances; incomplete configurations fail on different fault–domain classes. Original figure anchor: [arXiv Figure 3](https://arxiv.org/html/2609.05269#S8.F3). Original image endpoint: [main_security_utility.svg](https://arxiv.org/html/2609.05269v1/main_security_utility.svg). The local WebP is converted from the authors' [research-artifact figure](https://github.com/zast-ai/continuity/blob/main/figures/main_security_utility.png); the paper HTML marks CC BY 4.0, and attribution is retained.*

The teaching purpose is not to rank every baseline as a product. It is to expose a composition gap: `Gateway + finality` already has gateway policy and exact final-action binding, yet its effect ASR is 65.6%; `Provenance gateway` correctly escalates unreleased fields, yet downstream provenance loss, role misuse, parameter changes, and alternate paths remain. The full configuration's 0% is meaningful only inside this fault space and TCB model.

## How to read the experiments: not one security score

### Methodology: where do the attacks come from?

Section 8.1 covers workspace email, finance payments, DevOps deployment, and multi-agent delegation. Each action has domain-specific operations, resources, destinations, parameters, effect classes, and data classifications. The 32 fault classes are instantiated in all 4 domains with 20 parameterized instances per fault–domain pair, giving `32 × 4 × 20 = 2,560` attack instances. There are also 400 direct benign scenarios, 300 signed typed-release benign scenarios, and 200 unreleased ambiguous scenarios: 3,460 scenarios in total and 24,220 system–scenario runs across 7 configurations.

These are not i.i.d. samples from a real-world attack population. The planner is compromised from the beginning of every attack so that an accidental model refusal does not receive credit as a security boundary. Metrics also respect terminal semantics: effect ASR is the fraction of attacks that commit a harmful effect; benign auto-completion requires one effect without escalation; ambiguous escalation requires no effect and an `Escalate` result; replay and retry require checking both the second outcome and the effect count.

### Main result: preserve utility while tightening the effect boundary

| Configuration | Effect ASR | Contained classes | Benign | Ambiguous |
| --- | ---: | ---: | ---: | ---: |
| Pass-through | 100.0% | 0/128 | 100% | 0% |
| Tool allowlist | 100.0% | 0/128 | 100% | 0% |
| Gateway policy | 96.9% | 4/128 | 100% | 0% |
| Provenance gateway | 84.4% | 20/128 | 100% | 100% |
| Effect-bound permit | 81.3% | 24/128 | 100% | 0% |
| Gateway + finality | 65.6% | 44/128 | 100% | 100% |
| **CONTINUITY** | **0.0%** | **128/128** | **100%** | **100%** |

**Question:** Can local controls prevent cross-layer faults? **Controls:** the same generated scenarios, domains, faults, and parameter variations; only the configuration's invariant composition changes. **Observation:** the full system records no harmful effect in 2,560 attacks, completes 700 benign tasks, and escalates 200 ambiguous tasks; the strongest incomplete `Gateway + finality` still has 65.6% effect ASR. **Possible explanation:** the full configuration adds root trust, leaf provenance, release, role topology, transformation relations, current policy, subject/action binding, replay protection, and mediation. **Boundary:** Table 2 establishes containment for these fault templates; it does not establish universal protection against unmodeled faults, a compromised TCB, or an unmediated route.

`Benign = 100%` also does not mean that the system refuses every change. Every normal trace performs a logical destination alias → canonical address transformation; the full system accepts it with a trusted witness. The 300 signed typed-release external-data tasks all complete, while 200 plausible tasks with no release all escalate. This is a useful positive/negative control: external data is admitted only when its source, value, predicate, task, tool, and expiry are bound.

## Ablation: which invariants change the result?

![CONTINUITY Figure 4: effect ASR under targeted removal of invariants across 128 fault–domain classes.](/paperReading/45-continuity-security-context-contracts/paper/figure-4-ablation.webp)

*Figure 4, the targeted ablation in Section 8.4: one representative instance per fault–domain pair is used; the plot shows nonzero effects while the full CSV retains zero-valued redundant ablations. Original figure anchor: [arXiv Figure 4](https://arxiv.org/html/2609.05269#S8.F4). Original image endpoint: [ablation.svg](https://arxiv.org/html/2609.05269v1/ablation.svg). The local WebP is converted from the [artifact ablation.png](https://github.com/zast-ai/continuity/blob/main/figures/ablation.png); the paper HTML marks CC BY 4.0, and source attribution is retained.*

Table 3 prevents a common misreading: every check does not need to produce a nonzero marginal improvement in this fault space.

- **No field provenance: 24 classes; No contract conformance: 24; Incomplete mediation: 24.** These are the largest openings, corresponding to leaf-level source continuity, cross-stage assumptions/guarantees, and alternate effect paths.
- **No root authentication: 16; No release validation: 12.** A downstream signature cannot repair an untrusted origin or an unbounded external field.
- **No transform-witness validation: 8; No replay protection: 8.** Legitimate transformation and lifecycle finality have distinct obligations.
- **Role, identity, delegation, taint, policy, context, action, subject, and revocation checks each reopen 4 classes; authority monotonicity alone reopens 0.** The last zero does not mean authority monotonicity is unimportant. Other invariants still reject the same faults in this generated space, so it is redundant containment here. The authors explicitly warn that a zero ablation cannot show that a theorem condition is logically unnecessary.

This evidence supports an engineering question—what proof obligations belong in a contract?—not a universal marginal-value estimate for each invariant. The faults share schemas, and the removals are not a natural deployment's mutually exclusive factor experiment.

## Cost: how heavy is a proof-carrying control plane?

![CONTINUITY Figure 5: proof-verification latency as the number of signed transitions increases.](/paperReading/45-continuity-security-context-contracts/paper/figure-5-scaling.webp)

*Figure 5, the scaling result in Section 8.5: with full signed envelope snapshots, bundle size and verification latency grow approximately linearly with signed transitions. Original figure anchor: [arXiv Figure 5](https://arxiv.org/html/2609.05269#S8.F5). Original image endpoint: [scaling.svg](https://arxiv.org/html/2609.05269v1/scaling.svg). The local WebP is converted from the [artifact scaling.png](https://github.com/zast-ai/continuity/blob/main/figures/scaling.png); the paper HTML marks CC BY 4.0, and source attribution is retained.*

Table 4 reports reference-prototype p50/p95 values of **4.21/4.91 ms** for proof verification and **7.17/8.07 ms** for end-to-end transition plus finality. Section 8.5 also gives approximate sizes of 8.1, 12.4, 16.8, 27.6, and 49.4 KiB for 1, 3, 5, 10, and 20 signed transitions. These are measurements on the recorded host, not a cloud-scale SLO. The artifact suggests delta encoding, Merkle commitments, checkpoint receipts, batch verification, and compact binary serialization for production, but those alternatives are not measured in the paper.

## Failure cases, security analysis, and adoption boundary

### Failure cases: a correct state can still lack one proof obligation

The paper's failure-oriented evidence is not only a table of attack counts. Its minimal counterexample shows that if an adapter changes a field but the final sink checks a permit digest that omits that field, an attacker can present a different action at the sink. If the finality path can bypass the sink, correctness on every normal path still cannot establish ECI. Theorem 2 formalizes context-manifest completeness: if a decision `D` depends on field `f` but downstream query `q` omits `f`, then any deterministic decision based only on `q` is wrong for at least one of two inputs that differ only in `f`, unless it fails closed or recovers an authenticated `f`.

These are not failures where the LLM merely emits bad text. They are representation, binding, and mediation failures. In practice, the highest-risk bug may be an effect-equivalent route that never reaches the verifier, rather than an arithmetic error inside the verifier.

### Limitations the authors explicitly state

Section 12 needs to be read next to the 0/2,560 result:

1. **Trusted roots are deployment inputs:** the prototype does not decide who should be trusted or provision roots, and does not cover key rotation, quorum authorization, hardware roots, or certificate-path validation.
2. **Integrity is not semantic correctness:** a trusted provenance, release, or transformation validator can reach a wrong structured conclusion; CONTINUITY may faithfully preserve and enforce it.
3. **Context-manifest completeness:** the surrounding runtime must ensure that every byte and tool output exposed to the planner is covered; the prototype does not instrument a production model runtime.
4. **Restricted transformation language:** the implementation covers alias resolution and a small predicate registry; schema mapping, aggregation, declassification, and richer relations require new semantics, soundness arguments, and review.
5. **No verified implementation:** the Python artifact is regression-tested but not mechanically verified, constant-time, hardened, or formally shown to refine the model; its restricted JSON encoder should be replaced with a standards-conformant canonicalizer for interoperability.
6. **Synthetic conformance benchmark:** the 32 designed templates, 4 domains, and deterministic variations help falsify missing invariants, but they are not a real attack population and do not compare LLM quality.
7. **Simplified provider semantics:** the in-memory finality world, nonce ledger, and idempotency store are atomic; real providers have concurrency, retries, eventual consistency, non-idempotent effects, and partial failures.
8. **Incomplete information-flow coverage:** the system does not eliminate covert channels or infer every semantically equivalent effect path, and it does not prevent leakage through timing, resource names, aggregate queries, or malicious downstream providers.
9. **Human and semantic error:** a user may authorize an unwise action, and a trusted tool may return false data. Continuity preserves authorization context; it does not guarantee that the goal is wise, legal, or semantically correct.
10. **Artifact integration:** the reference pipeline is not a production MCP, A2A, OWASP ACS, cloud-IAM, or blockchain integration.

### Adoption boundary: when to use it, and when not to

**Good adoption conditions:** your Agent platform has enumerated external effect classes; every effect has an explicit final sink; you can name trusted roots, stage identities, protected leaf paths, policy epochs, revocation state, and replay state; and you are willing to escalate unreleased external fields rather than let the planner fill them in. Payments, deployments, permission changes, and cross-tenant tool calls with canonicalizable actions are plausible first contract profiles.

**Do not treat the paper as sufficient when:** effect paths are not inventoried; browser, shell, SDK, or recovery routes can bypass the sink; the validator is another opaque LLM with no auditable semantics; the provider has irreversible, non-idempotent partial failures; transformations require open-ended natural-language reasoning; or the model runtime cannot provide a trustworthy context manifest. First narrow the effect boundary, establish a domain-specific transaction protocol, add runtime instrumentation, or make the state explicitly escalate.

Instead of asking “should we adopt CONTINUITY?”, ask: **for every effect-equivalence class, can we enumerate root → field source → contract transitions → canonical action → current permit → sink as one complete witness?** If not, begin with path inventory and contract linting. If yes, use targeted fault injection to learn which missing invariant reopens which class of failure.

## Artifact and reproducibility (as of 2026-09-09)

The material artifact URL named by the paper, HTML, README, and Appendix C is [github.com/zast-ai/continuity](https://github.com/zast-ai/continuity). As of **2026-09-09**, I checked that the public repository and its `main` branch are readable; `README.md`, `ARTIFACT.md`, `pyproject.toml`, `requirements.txt`, `src/continuity/core.py`, `src/continuity/experiment.py`, `tests/`, `scripts/`, `results/*.csv`, and `figures/*.png` have direct endpoints. Repository metadata reports an MIT code license. The README and artifact guide specify Python 3.11+, the dependencies, quick and full commands, and no model API key because the planner is represented by directly instantiated adversarial actions.

The paper and repository do not provide separate dataset, downloadable checkpoint, hosted demo, or production-integration URLs; the results are a generated deterministic artifact, not an external dataset. Those absent items must not be described as released or reproducible datasets. The precise status is: **the source, tests, scripts, raw CSVs, and figures are accessible; a compatible Python/dependency/host can follow Appendix C, but this publication validation did not claim an independent full reproduction of the authors' experiment.** Timing is particularly host-dependent.

The conditional reproduction path in Appendix C is to create a Python 3.11+ virtual environment, install `requirements.txt`, run `python -m pytest -q` (expected: 30 passed), then run `python scripts/run_experiments.py --output results` and `python scripts/make_figures.py --results results --output figures`. For safety, the artifact writes effects only to an in-memory simulated world; do not connect active fault injection directly to real services.

## Relationship to this site's reading path

This reading sits in the Agent Systems path between prompt injection and runtime control:

- [Indirect Prompt Injection](/en/paper-reading/42-indirect-prompt-injection/): how attacker-controlled data changes an Agent's behavior; CONTINUITY assumes the planner is already compromised and inspects the effect boundary.
- [Parsing the Stream](/en/paper-reading/43-parsing-the-stream-live-trace/): append-only trace, provenance, and replayable state for an observer and worker; this paper connects that style of runtime state to preserve/transform security contracts.
- [ARGUS runtime](/en/paper-reading/10-argus-agentic-runtime/): long-horizon runtime, review, and durable-state controls; this paper offers a narrower, security-composition-oriented verifier and contract view.

## Three things to remember

1. **Technical idea:** Security is not a set of independently successful checkpoints. Every security field must be preserved from an authenticated root to the final effect, or carry an independently verifiable transformation witness.
2. **Strongest evidence:** Within the fixed deterministic fault space, CONTINUITY has 0% effect ASR over 2,560 attacks, contains 128/128 classes, completes 700 benign tasks, and escalates 200 ambiguous tasks; removing field provenance, contract conformance, or mediation reopens 24 classes.
3. **Adoption boundary:** This is a conditional conformance blueprint, not a real-world attack rate or semantic-correctness guarantee. Deployment still owns roots, validators, context capture, complete effect coverage, and provider transaction semantics.

## Primary sources

- [Zheng & Yang, CONTINUITY arXiv abstract and metadata](https://arxiv.org/abs/2609.05269)
- [CONTINUITY full arXiv HTML (Sections 1–13, Figures 1–5, Appendices A–C)](https://arxiv.org/html/2609.05269)
- [CONTINUITY research artifact](https://github.com/zast-ai/continuity)
- [Artifact README](https://github.com/zast-ai/continuity/blob/main/README.md) · [Artifact evaluation guide](https://github.com/zast-ai/continuity/blob/main/ARTIFACT.md)
