---
title: "Loopjacking: How Human Approval Loses Its Binding to an Action"
description: "A deep reading of Loopjacking: how incomplete approval representations and post-approval state substitution detach a human decision from the executed side effect, and what version-pinned product traces do and do not establish."
pubDate: 2026-10-04
updatedDate: 2026-10-04
tldr:
  - "Loopjacking is a product-owned failure in which a real human decision for operation A is reused to authorize or release materially different operation B. The paper distinguishes incomplete representation before approval from state substitution after approval."
  - "The authors reproduce traces at seven Agno AgentOS release points, 12 conditional in-memory LangGraph Agent Server compositions, and OpenClaw 2026.2.23. OpenClaw 2026.2.24 and OpenAI Agents SDK 0.22.0/0.22.2 serve as a fixed-release case and negative control."
  - "Tests use synthetic identities, loopback services, and harmless ledger or temporary-file sinks. They support the named traces, not an ecosystem-wide prevalence estimate or a human deception rate."
  - "The engineering lesson is to approve a complete canonical operation, compare it with the current operation before its effect, and prevent unauthorized changes to pending state."
audience:
  - "Engineers building approval flows for agent tools, MCP gateways, and human-in-the-loop workflows."
  - "Security engineers responsible for authorization, product security, workflow state, and auditable side effects."
tags: ["Paper Reading", "AI Agent", "Agent Security", "Governance", "Evaluation"]
image: "/paperReading/86-loopjacking-approval-binding/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-safety-governance
  - agent-evaluation-observability
paper:
  title: "Loopjacking: Hijacking Human-in-the-Loop Approval"
  authors:
    - "Adithyan Arun Kumar"
  year: 2026
  venue: "arXiv cs.CR preprint v1, submitted 2026-09-17; peer-review status not established"
  links:
    pdf: "https://arxiv.org/pdf/2609.21081v1"
    arxiv: "https://arxiv.org/abs/2609.21081"
    project: "https://github.com/adithyan-ak/loopjacking"
series:
  id: "agent-approval-binding-security"
  title: "Agent Approval and Action-Binding Security"
  part: 1
  totalParts: 1
---

This reading follows [arXiv:2609.21081v1](https://arxiv.org/abs/2609.21081), submitted by Adithyan Arun Kumar on 2026-09-17. The source is an arXiv preprint; peer review has not been established. The paper is not asking whether a person can be persuaded by a string of text. It asks whether a system can ensure that the operation a person approved is the operation that eventually reaches a tool or other effect. The authors show two ways this link can break, then test it across isolated product paths, version comparisons, a negative control, and harmless sinks. They do not estimate how common the weakness is across the agent ecosystem.

> **Huahua's engineering note**
>
> “A person clicked approve” proves that a UI or workflow recorded a decision. Unless the runtime binds the complete operation, decision-maker, task scope, and final effect together, that event alone does not prove the side effect was authorized by the decision.

## The paper in 90 seconds

- **Problem:** Human approval is often treated as the final guard before a consequential action, but an operation can pass through different representations as it is rendered, stored, resumed, and dispatched. Product logic may still consume approval when the person saw A but the system executes B.
- **Core insight:** The authors call this product-owned mismatch between a human decision and an operation's effect Loopjacking. They distinguish a request that already contains B before approval while showing an incomplete A, from a workflow whose state changes from a correctly reviewed A to B afterward.
- **Strongest evidence:** Table 2 reports exact release points and controls. Agno 3.0.9 produced the substitution trace in 5/5 trials, while direct-B attempts were denied in 3/3. OpenClaw 2026.2.23 reproduced the representation mismatch in 3/3 trials; 2026.2.24 rejected the same mismatch in 3/3. Twelve LangGraph Agent Server release points reproduced substitution under a specified in-memory composition and authorization policy.
- **Main boundary:** Products were selected purposively, and testing covers named versions and configurations. The LangGraph result depends on a custom Auth policy; scripted approval does not measure human understanding; all effects went to harmless sinks, so there is no evidence of real transactions, customer-data access, or production impact.

## Prior approach limitation: approval can lose the operation it should constrain

Human-in-the-loop is often drawn as a simple sequence: an agent proposes an action, a person reviews it, the person approves it, and the system executes it. A real product can first create a structured tool call and render a string from it. Another may store a pending action in a thread, wait for a different role to resolve it, reconstruct a request from current state, and only then send arguments to a tool. The human decision, displayed representation, authoritative state, and operation received by the sink may be controlled by different components (Introduction; Section 2.1).

The paper treats a complete operation as more than a command string. It can include the action, arguments, target resource, principal, task scope, and execution context that could materially change the effect. Let A be the operation the human understands and approves, D_A the decision, and B the operation that reaches the sink. The **approval-binding invariant** says D_A may authorize execution only when the complete operation reconstructed at use time is materially equivalent to A and the decision remains valid for the current principal, task, and scope. Otherwise, the product should reject the operation or request fresh approval (Section 2.1). This is an operational security requirement in the paper, not a formal proof about arbitrary implementations.

## Core intuition: A is wrong before review, or replaced afterward

The two variants share one failure: the product transfers the authority of a decision for A to B. They differ in when the change occurs and where a defense must act.

| Variant | When B exists | What the person sees | Where the product fails | Safe branch |
| --- | --- | --- | --- | --- |
| **Representation-based** | The complete request or execution context already contains B before approval | An incomplete or misleading A | The approval renderer, canonicalization, or check does not expose the complete operation | Approve a complete canonical operation and reject representations that cannot be interpreted consistently |
| **Post-approval state substitution** | After the person approves A but before the decision is consumed | Correct A at review time | Pending task, thread, session, or continuation state is replaced by B while the old decision remains valid | Reconstruct and compare at use time, or prevent unauthorized mutation of pending state |

![Paper Figure 1: An approval decision must bind to the operation eventually released.](/paperReading/86-loopjacking-approval-binding/figure-1.png)

*Figure 1 (paper Section 2.1): The approval-binding model compares human-visible A with the operation the product releases as B. A material mismatch must be rejected or reauthorized. Cropped from and rasterized from the arXiv v1 PDF by Adithyan Arun Kumar, “Loopjacking: Hijacking Human-in-the-Loop Approval,” [Figure 1](https://arxiv.org/html/2609.21081v1#S2.F1); the content is unadapted and used under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license stated on arXiv.*

The term is deliberately narrower than general agent security. To qualify a trace as Loopjacking, the authors require a genuine human decision; a material difference between A and B for authorization; a reachable attacker influence path; product-owned logic that applies the decision for A to B; evidence of the exact operation at a consequential sink; and evidence that the attacker did not already have an equivalent direct authority path (Sections 2.2–2.4). A person knowingly approving visible B, ordinary mutable state, a forged confirmation without a human decision, or prompt injection that never reuses approval for A falls outside the definition.

![Paper Figure 2: Two mismatch paths and their safe branches.](/paperReading/86-loopjacking-approval-binding/figure-2.png)

*Figure 2 (paper Section 2.2): B can be present before review while the person sees incomplete A, or a correct A can become B after review. Complete rendering and use-time binding address both; preventing unauthorized mutation additionally protects the second path. Cropped from and rasterized from the arXiv v1 PDF by Adithyan Arun Kumar, “Loopjacking: Hijacking Human-in-the-Loop Approval,” [Figure 2](https://arxiv.org/html/2609.21081v1#S2.F2); the content is unadapted and used under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license stated on arXiv.*

## Worked example: walk through a 20-unit approval and state substitution

The paper uses a harmless transfer stub to make the operation mismatch concrete: A transfers 20 units to an approved vendor; B transfers 2,000 units to an attacker-designated sink. The experiments do not move real assets. Instead, the tool appends the exact arguments it received to a ledger (Sections 3 and 4.1).

1. **Create A.** A lower-privilege maker creates a pending action. The product's approval view and record both show 20 units and the vendor. The maker can start or continue their own work but has neither an approval token nor a direct way to execute B.
2. **A separate role approves.** An administrator with approval authority reviews A and approves it. This is a decision recorded by the product, not a model's claim that approval occurred.
3. **Change state after approval.** In some tested paths, the maker submits B against the same run or thread. If continuation loads the changed arguments from current state but checks only that “no approval is pending,” or reuses the earlier approval, B may be released.
4. **Inspect the sink instead of stopping at an HTTP response.** The researchers verify that the ledger received 2,000 units and the attacker sink. They also check that direct unapproved B is denied, unchanged A still works, and an unauthorized actor cannot cross the declared role boundary. This is stronger than treating an HTTP 200 or a model response as proof of the operation performed.
5. **Apply a repair control.** A research-authored canonical-descriptor comparison rejects B while preserving A in the Agno trace. This shows that the invariant can block the tested trace; it is not an Agno vendor fix. In LangGraph, a supported policy that denies the maker's update also blocks B while leaving A available for approval.

The crucial question is not whether the maker can click approve. It is whether continuation carries the authority for A to a changed B. For state substitution, showing A in the approval UI does not ensure that execution remains A. For representation mismatch, checking again at use time is also insufficient if the comparison still sees only truncated fields. It must cover the complete operation content that matters for authorization.

## Three product paths, two failure moments

The authors selected different ownership, state, and approval boundaries to create three positive paths and one negative control expected to preserve binding. This is a purposive case set chosen to make the mechanisms and sinks observable, not a random sample of frameworks (Sections 3 and 4.1; Table 1).

| Product path | Failure point and conditions | Observed effect | Necessary qualification |
| --- | --- | --- | --- |
| **Agno AgentOS regular Agent** | After A is approved, continuation of the same run accepts caller-supplied B; the maker has run/continue authority but no admin approval token | Seven tested release points—2.5.6, 2.9.0, 3.0.1, 3.0.2, 3.0.3, 3.0.6, and 3.0.9—produced the strict trace; A→B was 5/5 and direct B was denied 3/3 on 3.0.9 | Version 2.5.5 already allowed direct B, so approval hijacking was unnecessary. Not all intermediate releases were executed, no continuous affected range is established, and no vendor fix is identified. |
| **LangGraph Agent Server in-memory composition** | A custom Auth policy allows a maker to update a shared pending thread but not resume it or execute B; a separate approver resumes from current thread state | Twelve executed release points from 0.7.5 through 0.14.0 passed the strict trace; a deny-update policy blocked B and preserved A | This is a conditional composition of documented extension points, not the default configuration. Version 0.14.0 is a separate execution point; wheel scans are not the same as rerunning every version; production Postgres was not tested. |
| **OpenClaw shell wrapper** | The complete argv already contains B before approval, while the approval event displays only an inline shell payload for A | All 3/3 trials on 2026.2.23 released B; 2026.2.24 rejected the same mismatch before node execution in 3/3 trials and retained the normal A path | This is the only positive case with a native affected/fixed release pair. The automated approval role does not test human understanding, deception rates, or UI quality. |

**The Agno path** separates a run-level approval gate from continuation. Its approval record contains the approved tool and arguments. After approval clears, the continuation route deserializes caller-supplied tool executions, installs them into the run, and dispatches a confirmed execution. In the main tested path, call identity is matched, but current tool arguments are not compared with the descriptor in the approval record (Section 3.1). The listed release points each produced a positive trace; the authors do not claim every neighboring patch is affected. Version 2.5.5 is an important boundary control because direct B already worked without approval hijacking. That distinction matters: to meet the paper's definition, the approval must be necessary to the tested effect.

**The LangGraph composition is conditional.** The maker can submit the shipped A2A <code>message.command.update</code> to change a shared pending thread but cannot resume it. An approver can inspect, approve, and resume, but cannot perform the maker's update. Resume reconstructs a call from current thread state, then executes it under the authenticated resume principal. The paper shows how this composition applies an earlier decision for A to B in 12 specified in-memory Agent Server releases; it also shows that the deny-update policy blocks substitution (Section 3.2; Table 2). The result is “this configured path can misbind approval when such an update policy permits mutation,” not “LangGraph is compromised by default.”

**OpenClaw fails at the opposite time.** B already exists in the complete positional argument vector before the approval event, but the displayed representation contains only the inline shell payload <code>$0 "$1"</code>. Version 2026.2.23 released the complete vector through the gateway/node-host path; 2026.2.24 added consistency checking for the complete argv and rejected the mismatch (Section 3.3). The authors corroborate their local native trace with a vendor advisory and patch. They also reconcile a later apparently duplicate advisory against release artifacts and commit ancestry; that is their evidence-led reconciliation, not a formal vendor or GitHub determination that two records are duplicates.

## Technical mechanism: the path from approval representation to final effect

This is not a benchmark comparing which model is “safer.” Model choice was not the claimed cause; deterministic local model fixtures keep attention on the product's approval-to-effect data path. Identities are synthetic, network traffic uses loopback, and consequential tools are replaced with append-only ledgers or temporary markers. The tests do not call production services (Section 4.1; Section 7.2).

A positive trace requires several complementary checks: exact A is presented for approval; unchanged A succeeds; direct B under the attacker identity fails; wrong-actor or outsider operations fail where the product exposes that boundary; and exact B reaches the sink. A safe control must reject the mismatch while preserving legitimate A. These checks address “what operation was actually performed, and under whose authority?” more directly than an HTTP status alone. They remain deterministic local reproductions, not production incident telemetry or human-factors experiments.

**The denominators in Table 2 are not interchangeable.** At Agno 3.0.9, the strict-positive point has 5/5 substitutions, 5/5 unchanged-A controls, 3/3 direct-B denials, and all 23 declared test cells completed. This does not mean every listed version ran the same 23-cell matrix. The paired OpenClaw traces on 2026.2.23 and 2026.2.24 each report 3/3. The OpenAI SDK mutation rejection is also 3/3 for each tested version. These counts describe fixed harness outcomes; they should not be added up or converted into an ecosystem risk probability (Table 2; Sections 4.2–4.3).

## Evidence map: author claims, observed traces, and this reading's inference

| Layer | What it contains | Anchors and boundary |
| --- | --- | --- |
| **Authors' claim** | Loopjacking has two main variants. Complete canonical rendering plus use-time comparison, or preventing unauthorized pending-state mutation, blocks the tested mismatches while preserving legitimate A. | Definition, Figure 2, Sections 2.2 and 6; this is a testable definition and a conclusion about named traces, not a formal guarantee for arbitrary systems. |
| **Directly observed** | Product paths at named versions wrote B to harmless sinks; direct-B, unchanged-A, role-boundary, and safe controls jointly locate whether approval was reused. | Table 2, Sections 3–4; these are trials for specified versions/configurations, not prevalence across products. |
| **Authors' stated limits** | The sample is purposive; LangGraph is conditional; scripted approvers do not test human factors; there are no production side effects or independent reproductions. | Section 7; Agno version coverage, LangGraph intermediate releases, and Postgres scope each remain bounded. |
| **This reading's engineering inference** | For delayed or resumable workflows, test both representation completeness before approval and state freshness after approval, then check operation equivalence before the sink. | This is Bloss0m's engineering synthesis from Sections 2 and 6.4, not an independent protocol proposed by the authors. |

The evidence most directly supports the design requirement that approval constrain the final effect, and shows that meaningful product traces can test it. It does not establish default behavior outside the named product paths, an affected range for every release, or how often real users encounter approval mismatch in daily work.

## What the negative control shows: serialization and resume are not vulnerabilities by themselves

OpenAI Agents SDK 0.22.0 and 0.22.2 serve as a negative control, not a vulnerability finding. The authors serialize an approved per-call state, restore it, and resume it; unchanged A executes in all tested controls. They then modify the serialized pending invocation to B while retaining the canonical approval/invocation records and call ID. Restoration succeeds, but resume raises <code>ModelBehaviorError</code> and the ledger remains empty; direct unapproved B pauses as well (Section 4.2).

There are two readings. First, pause/resume, serialization, or a shared call ID is not enough to establish a vulnerability; the authority-binding behavior matters. Second, this result covers ordinary function-tool per-call approval in the specified SDK versions. It does not prove that every application-authored approval built around the SDK is safe, and it does not cover an intentional sticky <code>always_approve</code> policy or an attacker who can forge every trusted canonical field.

## Figure 3 and A2A: a protocol provides a carrier, not authorization by itself

![Paper Figure 3: the boundary between A2A coordination state and implementation-owned authorization semantics.](/paperReading/86-loopjacking-approval-binding/figure-3.png)

*Figure 3 (paper Section 2.5): A2A supplies Task, message, interrupt, and resume coordination for a deferred-approval workflow. The approval view, decision scope, selection of the current operation, use-time comparison, and sink belong to the implementation or issuer. Only the red branch, where implementation logic applies D_A to B, meets the paper's Loopjacking definition. Cropped from and rasterized from the arXiv v1 PDF by Adithyan Arun Kumar, “Loopjacking: Hijacking Human-in-the-Loop Approval,” [Figure 3](https://arxiv.org/html/2609.21081v1#S2.F3); the content is unadapted and used under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license stated on arXiv.*

The paper treats A2A as a **conditional carrier**, not as an inherently vulnerable protocol. It describes the then-current nonterminal <code>TASK_STATE_AUTH_REQUIRED</code>, coordination messages on the same Task, and continuation after an out-of-band credential. If an implementation shows A to an approver, then later selects B from the latest state on that Task and consumes D_A after the credential arrives, the authorization-binding error belongs to the application. The authors trace Issue 2080 and merged PR 2081, which clarified that an interrupt state is a coordination signal rather than an authorization grant; the implementer must define the authorized operation and check it at later use (Section 2.5). This clarifies responsibility in the specification; it is not an A2A vulnerability or a universal claim about SDKs.

## How the authors position the contribution: a name and comparison, not the invention of approval integrity

The paper distinguishes Loopjacking from adjacent ideas narrowly. *Lies in the Loop* covers manipulated approval-dialog content and overlaps with the representation variant. *Consent Integrity* already states trusted rendering and bind-to-execution. *Authorization Continuity* asks whether a grant remains valid when state, delegation, or task phase changes. Session smuggling and memory poisoning can supply B to a workflow without necessarily reusing a human decision for A (Section 5; Table 3).

A more defensible novelty claim is that the authors provide a testable trace definition and compare named approval paths across products, separating mismatch at presentation from mismatch after a correct review. The paper does not claim to be the first to identify action binding, authorization continuity, or commit-time revalidation. The practical value is a consistent way to locate where approval becomes detached from an effect, not a new universal security law.

## Failure patterns and repair implications

The authors' core defenses are a **canonical approval record** and a **use-time decision** (Sections 6.1–6.3). Preserve the complete operation a person approves in a consistent, reconstructable form. Before a side effect, reconstruct the operation that will actually execute and compare authorization-relevant fields; also verify that approver, principal, task, scope, expiry, and consumption state remain valid. If the comparison fails, reject or request new approval. For mutable pending state, prevent unauthorized roles from changing it; every mutation must pass policy rather than inheriting authority from the statement “this was approved earlier.” These are the authors' directions, not a claim that one implementation recipe alone provides complete security.

The following **Bloss0m engineering synthesis** turns the two variants into complementary test surfaces. First, vary the approval view, canonicalization, and command encoding to test whether B is already present in the complete execution context while the person sees A. Second, between approval and effect, mutate arguments, target, principal, thread, session, scope, expiry, and resume context one at a time; assert that use-time comparison fails closed. Finally, use sink-level ledger assertions to verify both rejection of mismatches and continued availability of unchanged A. This checklist is synthesized from the paper's two variants and Section 6.4 test guidance; the authors do not present it as a standardized protocol.

**Do not compare only one identifier.** In the Agno trace, call identity can stay the same while arguments change, so matching the call ID does not prove that the operation is unchanged. Similarly, a workflow-wide <code>approved=true</code> can expand a decision about one action into authority over later task state. A digest or canonical serialization can help create a stable representation, but engineers still need to specify which fields canonicalization covers and which state must be checked immediately before the effect. Approval binding does not replace action-level authorization, argument validation, least privilege, or authorization enforced by the backend itself.

## Limitations and claims the evidence does not support

First, **the sample is not a prevalence sample**. Three positive product paths plus one negative control were selected to illustrate distinct mechanisms, not randomly sampled from agent frameworks. The results cannot support claims that “most tool approvals are insecure,” that every version in a framework range is affected, or that the umbrella definition implies one severity, CWE, or CVSS result (Section 7.1).

Second, **version and configuration boundaries matter**. Agno establishes only the listed seven strict-positive release points in the regular-Agent configuration; intermediate releases were not all executed, and no fixed release was identified. LangGraph depends on an in-memory runtime, LangChain 1.3.18, LangGraph 1.2.11, and a custom Auth policy that allows a non-approver to update a shared thread. Its supported deny-update policy refutes a claim that the product path is inevitably unsafe. Production Postgres was not tested because the official deployment required a license key. OpenClaw has an affected/fixed pair at 2026.2.23 and 2026.2.24. These version statements reflect the paper's September 10, 2026 evidence cutoff; they do not describe every current release.

Third, **a system trace is not human-factors evidence**. The approval role was automated after the harness asserted the exact product event. This isolates product binding but does not measure whether people understand the displayed operation, how often they would be deceived, or interface usability. The experiments also caused no real payment, data exposure, or destructive effect: sinks were harmless mock ledgers or temporary markers (Sections 4.1 and 7.2).

Fourth, **author-run evidence is not independent replication**. One researcher operated the experiments. Some representative versions were repeated on Linux; most runs used clean macOS environments. The authors do not claim independent reproduction. The public evidence archive contains raw requests, approval records, outcomes, versions, and checksum manifests, plus a read-only <code>verify_archive.py</code>. This lets readers check the integrity of the archived evidence, but it is not the same as another research team rerunning all experiments from a clean environment.

## Artifacts and reproducibility

As of 2026-10-04, the authors' [Loopjacking evidence archive](https://github.com/adithyan-ak/loopjacking) publicly contains <code>EVIDENCE.md</code>, versioned bundles, checksum manifests, harness instructions, and <code>verify_archive.py</code>. The README says Python 3.10 or later can run the read-only archive verifier; rerunning experiments may need network access if pinned packages or dependencies are not cached. The verifier checks archive hashes and result oracles; it does not rerun AgentOS, LangGraph, or OpenClaw. “Verifying the archived record” and “reproducing the experiment” are different activities. The GitHub repository has no confirmed code license, so public visibility should not be mistaken for permission to redistribute or modify its code. This reading did not independently rerun the paper's experiments; results remain author-reported.

## Bloss0m engineering judgment and when not to use it

If a workflow waits for a callback, queue, human handoff, or agent resume after approval, bind approval to a complete, unambiguous operation descriptor and revalidate current state at the side-effect boundary. The descriptor should distinguish authorization-relevant action, arguments, target, principal, task/scope, and validity. The product threat model must define which fields are material. If the person is approving a mutable task rather than one action, show that scope clearly and constrain each later effect.

Do not use this paper to infer that every prompt injection is an approval-binding failure, estimate the real-world affected rate, or replace a system's security review. If the attacker already has direct authority to execute B, the trace does not meet the authors' necessary conditions. If no human decision occurred, it is outside the definition. If the complete operation cannot be reconstructed, the trusted approval record can be forged, or the actual sink is not observed, the result should remain unknown rather than treating a UI message as proof of safety.

Read this paper alongside [Bounded Agents on delegation and action-composition authorization](/en/paper-reading/bounded-agents-delegation-security/): Loopjacking asks whether one human decision remains bound to the same effect; Bounded Agents asks whether individually allowed actions combine into a disallowed outcome. [MobileCybench's executable security probes](/en/paper-reading/68-mobilecybench-executable-security-probes/) offers a related view of how a security claim can be tied to observable effects. For runtime acceptance authority, see [Specifications, Not Agents, Sign Off](/en/paper-reading/76-specifications-not-agents-sign-off/).

## Three things to remember

1. **Approval is not a permanent pass.** It applies only to the operation, principal, task, and scope the person understood and accepted.
2. **The mismatches occur at different times.** Representation mismatch hides B before review; state substitution changes A to B after review. Fixing only one leaves the other path open.
3. **The evidence supports named traces.** Version-pinned sink-level mocks and controls establish outcomes for specified configurations, not industry prevalence or a human deception rate.

## Primary sources

- Adithyan Arun Kumar, [“Loopjacking: Hijacking Human-in-the-Loop Approval,” arXiv:2609.21081v1](https://arxiv.org/abs/2609.21081) (full text: [HTML v1](https://arxiv.org/html/2609.21081v1), [PDF v1](https://arxiv.org/pdf/2609.21081v1); submitted 2026-09-17).
- The authors' [public evidence archive](https://github.com/adithyan-ak/loopjacking), especially [EVIDENCE.md](https://github.com/adithyan-ak/loopjacking/blob/main/EVIDENCE.md) and the README. The archive includes a verifier; the repository has no clear code license statement.
- Figures reproduced from the paper: [Figure 1](https://arxiv.org/html/2609.21081v1#S2.F1), [Figure 2](https://arxiv.org/html/2609.21081v1#S2.F2), and [Figure 3](https://arxiv.org/html/2609.21081v1#S2.F3), unchanged, under arXiv's stated [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license.
