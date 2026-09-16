---
title: "Tool Call Succeeds, Workflow Fails: External-Effect Anomalies at the Agent–Tool Boundary"
description: "A deep reading of the effect-history model behind Agent–Tool Boundary: why a successful tool response cannot guarantee a coherent external world state, and what MCP annotations and transactional contracts still leave unspecified."
pubDate: 2026-09-16
updatedDate: 2026-09-16
tldr:
  - "The paper separates runtime observations from effects that actually happen in the outside world, then catalogs eight recurring anomalies under retry, speculation, concurrency, and partial failure."
  - "A1–A8 are not eight API error codes. They are a workflow-level external-effect anomaly vocabulary; the paper then groups their consequences into four safety guarantee profiles. Duplicated, missing, orphaned, residue, premature, contaminated, conflicting, and phantom effects require different outcome, compensation, dependency, coordination, or visibility capabilities."
  - "A census of the official MCP registry snapshot from 2026-07-27 contains 98,291 tools in the anonymously reachable remote subset. Although 74.0% serialize at least one standard annotation, the four advisory hints do not express an idempotency key, status query, prepare/commit, or compensation contract."
  - "The central engineering result is a boundary argument: without an authoritative one-outcome primitive, a black-box call cannot generally guarantee both unknown-safe and compensation-safe behavior. Tool-call success is not workflow commit."
audience:
  - "AI engineers designing long-running agents, tool platforms, MCP servers, or external-side-effect controls"
  - "Platform owners who need retry, audit, compensation, concurrency, and safety profiles to fit one contract"
tags: ["Paper Reading", "Agent Systems", "Tool Use", "AI Engineering", "Evaluation", "Safety"]
image: "/paperReading/49-tool-calls-workflows-fail/title_image.webp"
field: "AI Systems"
difficulty: "advanced"
showToc: true
topics:
  - agent-safety-governance
  - tool-use-coding-agents
  - agent-evaluation-observability
paper:
  title: "When Tool Calls Succeed but Workflows Fail: Anomalies at the Agent–Tool Boundary"
  authors:
    - "Artem Trofimov"
    - "Boris Novikov"
  year: 2026
  venue: "arXiv 2609.15397 v1 (2026-09-14; not peer-reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2609.15397v1"
    arxiv: "https://arxiv.org/abs/2609.15397"
    doi: "https://doi.org/10.48550/arXiv.2609.15397"
    code: "https://github.com/flame-stream/mcp-annotation-census"
    project: "https://arxiv.org/html/2609.15397"
series:
  id: "agent-tool-boundary-reliability"
  title: "Agent–Tool Boundary and Effect Reliability"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** An agent workflow may reserve a table, charge a card, and send a confirmation. Each tool may return success, failure, or a timeout, but the workflow actually cares about which irreversible effects happened in the outside world and which effects still survive. If the runtime only trusts the latest response, retries, speculation, concurrency, and crashes can separate “the call succeeded” from “the work is complete.”
- **Core insight:** Separate external-effect history from runtime observation. An attempt can produce an unknown observation even when externalization already happened; conversely, a runtime can observe success without the later commit, abort, or compensation producing the intended world state. Workflow safety is about effect history, not one API response.
- **Strongest evidence:** Table 2 in Section 3 maps eight anomalies to the boundary capabilities they require. Section 5 audits the 2026-07-27 MCP registry snapshot: 98,291 tools were observed, 74.0% serialized at least one standard annotation, and 61.7% carried all four, yet Table 4 finds no sufficient transactional capability for A2–A8.
- **Main boundary:** This is an effect-history vocabulary, a conjectural coverage analysis, and a runtime-contract argument. It is not a prevalence study showing that all production agents exhibit these eight anomalies. The coverage labels for ACRFence, RAC, Atomix, Cordon, CoAgent, and Shepherd are stated or partial comparisons, not formal proofs.

My bounded verdict is: **the paper’s most useful artifact is not another retry wrapper. It is a checklist that forces a team to put outcome uncertainty, compensation, dependencies, shared resources, and external visibility into the tool contract. If the boundary has no authoritative outcome or prepare/commit protocol, the system should expose unknown honestly instead of treating a polished success response as exactly-once.**

> **Huahua’s engineering note**
>
> For an external side effect, success is an observation, not necessarily a fact. Reservations, payments, messages, and deletions need a queryable logical-operation identity, a status endpoint, and an explicit unknown state. Otherwise, a retry policy can turn network uncertainty into duplicate charges, orphaned compensation, or an external reaction that cannot be retracted.

## Version, sources, and the reader question

This article reads [When Tool Calls Succeed but Workflows Fail](https://arxiv.org/abs/2609.15397) v1, submitted to arXiv on 2026-09-14 by Artem Trofimov and Boris Novikov. It is an arXiv preprint, not a peer-reviewed conference or journal result. I do not turn the authors’ capability mapping or runtime comparison into a demonstrated production guarantee. I checked the [full arXiv HTML](https://arxiv.org/html/2609.15397), the [PDF](https://arxiv.org/pdf/2609.15397v1), Tables 1–4, Sections 2–6, the Appendix discussion of open-world interactions, and the authors’ [MCP annotation census repository](https://github.com/flame-stream/mcp-annotation-census).

The reader question is: **When a long-running agent must make an irreversible change to the outside world, what must the tool boundary declare so that the runtime knows when it may retry, when it must wait, when it may compensate, and when it can only report unknown?** This follows naturally from [K-Bench’s agent-level leakage evaluation](/en/paper-reading/46-k-bench-agentic-unlearning/), [Parsing the Stream’s live trace view](/en/paper-reading/43-parsing-the-stream-live-trace/), and [ReVA’s reusable evidence views](/en/paper-reading/47-reva-reusable-evidence-views/): those readings discuss governing, observing, and evaluating agents, while this paper asks whether the boundary contract can support those controls.

## Evidence map: Paper, Evidence, and Bloss0m judgment

| Layer | What this reading says |
| --- | --- |
| **Directly supported by the Paper** | The separation of effect history and observation; the definitions of eight anomalies; four safety guarantee profiles; contract families; the four MCP 2025-03-26 advisory annotations; the census sampling procedure, counts, and annotation distribution; four black-box guarantee boundaries; and explicit scope exclusions. |
| **Author claims** | A1–A8 form a reusable vocabulary for agent–tool boundary anomalies; current runtimes usually cover only slices; standard MCP hints express call-level intent but not a full transactional capability. |
| **Not established by the Evidence** | The frequency of the eight anomalies in real services; a complete safety proof for any named runtime; the correctness of every MCP annotation; the semantic correctness of compensation across industries; or the claim that any one contract family eliminates workflow failure in general. |
| **Bloss0m engineering judgment** | Treat the tool schema as the entry point to an effect protocol, not as the protocol itself. Make unknown, reconciliation, compensation, and mediation first-class observability states, then verify workflow invariants rather than measuring only tool-level success. |

### Paper Essence Contract

1. **What problem does it solve?** It addresses the reliability blind spot created when an agent executes a long workflow through external tools but the response for an individual call does not reveal the resulting external-effect history.
2. **Why are previous approaches insufficient?** A timeout policy, retry, idempotence hint, or after-the-fact compensation covers only part of the problem. None alone handles unknown outcomes, cross-tool atomicity, non-commuting effects, and open-world reactions at once.
3. **What is the core technical idea?** Represent attempts, externalization, commit, abort, compensation, dependency, commutativity, and observation as an effect history; then use capability contracts and safety profiles to identify missing boundary protocols.
4. **How does one input flow?** Workflow intent → tool attempt → external observation → resolve, retry, commit, or compensate → verify surviving effects. If the observation is unknown, the runtime should not silently advance to another irreversible action.
5. **What evidence supports the headline claim?** Table 2’s anomaly-to-capability mapping, Table 3’s runtime coverage comparison, Table 4’s MCP capability matrix, and the Section 5 census of 98,291 tools.
6. **Where does the claim stop?** The paper does not run a common benchmark across these runtimes and does not prove that a server author implements any annotation correctly. It provides an analytical framework and boundary argument, not a production SLA or an exactly-once implementation.

## Why prior approaches are insufficient

Traditional approaches often reduce reliability to three local knobs: retry on timeout, add an idempotent hint to the schema, or call rollback when a later step fails. Each knob is useful, but none answers whether the original effect happened or whether rollback actually neutralized it. Without an authoritative outcome, retry can duplicate an effect. Without a precise target, rollback can compensate the wrong object. Once an effect has crossed an observation boundary, internal rollback cannot promise to retract every reaction. This is the prior-approach limitation in the paper: the semantics of one call and the world state of a workflow are different layers.

## Core intuition before the machinery

Imagine every external operation passing through a door. Inside the door, the runtime sees a request, a timeout, and a response. Outside it, the world may already contain a reservation, a charge, or a webhook reaction. If the door returns only success or failure, the agent lacks an authoritative history for the logical operation. The safe first response is not to guess a boolean. It is to preserve unknown, look for a status or reconciliation path, and then decide whether retry, commit, or compensation is allowed. This mental model explains why a clean local trace can still correspond to several different outside-world states.

## Bloss0m engineering synthesis: a runtime checklist

### Method flow: from intent to reconciliation

The following is not a runtime algorithm proposed by the authors. It is my engineering synthesis of the effect history and contract requirements. The paper itself defines the effect-history model, builds the anomaly catalog, maps anomalies to required capabilities, organizes contract families, derives black-box guarantee boundaries, and uses the MCP census to test how much the current interface can express. The five steps below should not be misread as the authors’ algorithm:

1. **Declare:** Split the workflow intent into logical operations, required effects, dependencies, shared-resource scope, and visibility boundaries.
2. **Attempt:** Send the tool call while recording attempt identity, parameters, time, and observation separately.
3. **Resolve:** Route confirmed, failed, and unknown outcomes through different protocols. An unknown outcome must first query authoritative status or enter reconciliation.
4. **Release:** Commit or externalize only when required outcomes are resolved and dependency, commutativity, compensation, or mediation conditions are satisfied.
5. **Verify:** After abort or compensation, check surviving effects and residue, and preserve downstream reactions in the audit trail.

The flow does not require every tool to implement a complete transaction. It requires the runtime to expose missing capabilities so the product can choose a safe downgrade, human confirmation, or refusal to execute.

## Why is the tool boundary relative?

The paper’s transaction reasoning is not one-level reasoning. It uses a multilevel transaction-management view: L0 is an atomic tool operation as seen by the agent; L1 is a workflow composed from multiple L0 operations; a higher level may then treat the entire L1 workflow as one operation. `book_flight()` may look atomic to the agent while still hiding a provider workflow below the caller’s L0 boundary. Correctness at each composition layer therefore depends on the outcome, ordering, and effect semantics exposed by the next lower boundary; an upper layer cannot infer guarantees that the lower layer never declares.

```text
L2   Travel Agent
     │
     ▼
L1   BookTrip workflow
     ├─ book_flight()
     ├─ reserve_hotel()
     └─ charge_card()
             │
             ▼
L0   External Tool Boundary
             │
             ▼
     Provider's hidden workflow
```

This is a Bloss0m explanatory diagram derived from the multilevel transaction view in Section 2, not an original paper figure or an additional experiment. If `book_flight()` exposes no queryable logical operation, outcome resolution, or externalization semantics, an L1 workflow can record its own trace completely and still fail to prove that the provider’s hidden workflow happened only once.

## End-to-end worked example: one reservation workflow

Suppose an agent receives: “Reserve a table for two next Friday evening and send a confirmation after it succeeds.” It calls reserve_table, charge_card, and send_email in sequence. The first request leaves the client waiting. The runtime sees unknown. If it retries immediately, the restaurant may already have created the first reservation, so the second attempt creates a duplicate. This is A1 duplicated effect, not merely an HTTP retry bug: the world may now contain two reservations.

The canonical shape of A3 is cleaner with a payment:

```text
pay_invoice()
↓ timeout / unknown
↓ payment outcome is still unresolved
↓ issue refund directly
↓ the original payment may never have happened
```

A3 is not primarily about compensation accidentally finding another reservation. It is about issuing compensation while the original outcome remains unresolved; Table 2 therefore requires outcome resolution before a precisely bound, conditioned compensation. The reservation example remains useful for A1, while A8’s external reaction deserves a separate treatment below.

The example separates three questions:

- **Outcome:** Did reserve_table succeed, fail, or remain unknown?
- **Lifecycle:** Was the effect staged, committed, aborted, or compensated, and did compensation actually neutralize it?
- **Coordination:** Did another concurrent workflow touch the same table, card, or notification channel?

An agent can record a complete trace and still lack the information needed to infer world state from that trace.

## The effect-history model: separating observation from world events

Section 2 does not pretend that a runtime directly sees every real event. For a workflow w, an attempt can be written as attempt(a, ℓ), meaning one execution attempt for logical operation ℓ. An external effect is externalize(q, e), while the runtime result is observe(a, s), where s may be confirmed, failed, or unknown. The separation is the point: observe(a, unknown) does not imply that effect e was not externalized.

The paper also separates relationships that are commonly collapsed:

- cmp(c, a) says that compensation c targets attempt a;
- neutralizes(c, e) says whether c actually neutralizes effect e;
- dep(e2 ← e1) says that effect e2 depends on e1;
- commute(e1, e2) says whether the order of two effects can be exchanged;
- commit(w) and abort(w) are workflow-level release decisions;
- Req(w) is the set of effects required by workflow w, while resolved(w) says that required outcomes have been resolved;
- survives(e) says that an effect remains in the outside world after abort or compensation.

The notation is not a demand that every product deploy a theorem prover. It is a design discipline: “Am I handling a response, or do I know the authoritative external outcome?” For example, idempotentHint=true may state an author’s intent about a call, but it does not provide a logical-operation ID, the original result on retry, or atomic commit across tools.

## Five dimensions of an L0 operation

Section 2 further breaks the contract problem for each L0 operation into five dimensions. They cannot be collapsed into one reversible/irreversible scale: an operation may be idempotent but not commute, or commute under a condition without being idempotent.

- **Idempotence:** Whether resending the same logical operation creates an additional effect or can return the original outcome.
- **Invertibility:** Whether a true inverse exists that neutralizes the effect; an API that looks like `cancel` does not automatically neutralize the original effect.
- **Externalization timing and control:** When an effect crosses the boundary and becomes visible, and whether the system can quote, dry-run, hold, or delay release first.
- **Determinism:** Whether the same logical input produces a predictable decision and effect. This is especially important for black-box, LLM-backed tools: the same request may produce a different decision or effect on retry.
- **Commutativity:** Whether swapping two operations on a shared resource yields an equivalent result. It is a relation between operation pairs and may depend on state.

The last two are easy to miss in ordinary retry design. Determinism makes replay comparison meaningful, but does not make retry safe by itself. Commutativity cannot be declared only in one tool’s metadata. These are framework concerns from the paper, not measurements of LLM retry behavior in this article.

## Eight effect anomalies and the boundary capabilities they need

The following operationalizes Table 2. The first column describes the smallest shape of the anomaly; the middle explains why ordinary retry or rollback is insufficient; the last column names what the boundary must at least make possible. A capability is not a guarantee by itself: the runtime still has to use the right protocol.

| ID | External-effect anomaly | Typical shape | Required capability |
| --- | --- | --- | --- |
| A1 | **Duplicated effect** | One logical operation is externalized twice after an unknown outcome. | Authoritative convergence, logical-operation identity, idempotent re-issue, and original-outcome lookup. |
| A2 | **Missing committed effect** | The workflow commits even though a required effect never happened or did not complete. | An authoritative outcome plus atomic participation of multiple effects, such as status and prepare/commit. |
| A3 | **Orphaned compensation** | Compensation runs while the original outcome is unknown and does not bind to the original effect. | Resolve the outcome before compensating; provide an outcome query and precisely conditioned compensation. |
| A4 | **Uncompensated residue** | An external effect survives an abort. | Residue prevention or verifiable safe neutralization, normally through staging or reliable compensation. |
| A5 | **Premature externalization** | An effect is externally observed before the workflow outcome is known and may later fail to survive. | Pre-externalization control such as a quote, dry run, expiring hold, or delayed release. |
| A6 | **Contaminated speculation** | A committed effect depends on a speculative effect that later does not survive. | Dependency observability, stable effect/resource identity, and commit gating. |
| A7 | **Conflicting externalization** | Independent workflows produce unordered, non-commuting effects on shared resources. | Shared-resource coordination, scope, commutativity declaration, a mediator, or ordered release. |
| A8 | **Phantom compensation** | A compensated effect has already triggered an exogenous reaction that remains. | Control external observability or use mediated observation to limit reactions that cannot be retracted. |

### Safety profiles are not an all-or-nothing label

The paper distinguishes four guarantee profiles, which is more precise than calling a system “transaction-safe”:

1. **Unknown-safe:** A1–A3 are about not duplicating, omitting a commit, or compensating the wrong object when the outcome is unknown.
2. **Compensation-safe:** A4 requires compensation to be semantically correct, executable, and verifiably able to remove residue.
3. **Speculation-safe:** A5–A6 require control over release before externalization and visibility into speculative dependencies.
4. **Externally mediated:** A7–A8 require an external mediator or sufficient visibility control; wrapping a black-box tool in an agent loop does not create it.

A3 is an action-time anomaly; A5 and A7 are profile-relative preventive patterns. Not every workflow must prohibit early externalization or unmediated concurrency; the answer depends on the declared safety profile. A read-only lookup may not need the same guarantees as a payment or a public message. The more irreversible the action and the wider its observation boundary, the more the contract must say.

## Four black-box boundaries: why another wrapper is not enough

### 1. No authoritative one-outcome primitive means no general exactly-once barrier

When an unreliable channel leaves the runtime unable to tell whether attempt a externalized an effect, and the tool has no authoritative lookup by logical-operation ID, retry can create A1, commit can create A2, compensation can create A3, and direct abort can leave A4. Waiting only postpones giving up; it does not transform unknown into resolved. This is not a prompt-engineering problem.

### 2. Without mediation, non-commuting irreversible effects have no general conflict repair

If two workflows make irreversible, non-commuting changes to an account, inventory item, or ticket, the agent has no general repair once the ordering conflict is discovered after the fact and no operation-specific reconciliation exists. Typical controls are coordination before release: resource scope, locking, serialization, or a mediator that owns the ordering decision. Not every case requires a mediator if the resource orders operations itself or the operation exposes reliable reconciliation.

### 3. An open-world reaction may not be retractable by compensation

Deleting an internal record and retracting a reaction already seen by a webhook, a user, a search engine, or a third party are different problems. A more precise A8 sequence is: `offer sent → supplier sees it → supplier acts → offer withdrawn successfully`. The original offer effect is successfully neutralized, but the supplier reaction is a new effect that survives. This is not merely compensation changing internal state; even 100% successful compensation cannot make the outside world behave as if the event never happened.

### 4. Multiple irreversible effects cannot pretend to be atomic above the tool layer

If payment, fulfillment, and notification belong to different tools, an orchestration layer cannot turn sequential calls into one atomic release just by ordering them. A crash can leave partial externalization. A2, the missing required effect, and A4, the surviving residue, are opposite sides of the same partial-commit problem. Prepare/commit, staging, or an explicitly compensatable saga contract must be supported at the boundary.

## The MCP annotation census: intent hints are not transaction capabilities

Section 5 uses an official MCP registry snapshot from 2026-07-27. The registry contained 59,625 entries and 18,688 distinct servers. Researchers queried 9,234 remote targets anonymously: 4,838 returned at least one tool, 4,318 failed to connect, 74 timed out, and 4 returned no tools. The final census contained 98,291 tools. This describes an anonymously reachable remote subset, not every registry server, and it does not establish that authors intended or correctly implemented every field.

Across the 98,291 tools:

- 74.0% serialized at least one standard annotation;
- 61.7% serialized all four fields: readOnlyHint, destructiveHint, idempotentHint, and openWorldHint;
- the most common all-four signature represented 39.9%, no annotation represented 26.0%, and the top three signatures together represented 75.8%;
- destructiveHint appeared on 65.8% of all tools, but only 12.9% of the non-read-only subset where the researchers considered it applicable; tools classified as actually destructive represented 3.1%;
- only 66 of 81 observed signatures appeared, and among servers using multiple signatures the median share of the dominant signature was 79.4%.

These numbers support the claim that annotations are widely emitted but coarse. They do not support a claim that annotations guarantee safety. The four MCP 2025-03-26 fields are advisory boolean hints about read-only, destructive, idempotent, and open-world behavior. They do not standardize a logical-operation key, an authoritative status, a compensation target, staging or prepare/commit, dependency edges, commutativity over a pair or resource, or an external-visibility policy.

That is why Table 4 is conservative: A1 receives at most limited support from an idempotence hint; A2–A8 are No. No does not mean that a private server has none of these capabilities. It means that the four standard annotations do not express the capability completely in a machine-verifiable way. For a platform team, this is a schema and protocol gap, not a documentation gap that can be fixed by renaming fields.

## Runtime coverage: partial is not a safety certificate

Table 3’s comparison of ACRFence, RAC, Atomix, Cordon, CoAgent, and Shepherd shows different slices of coverage:

- ACRFence is partial for A1;
- RAC is partial for A4;
- Atomix covers A1/A3, A4, and A5/A6, with partial A7 under assumptions;
- Cordon is partial for A1/A3/A4/A5;
- CoAgent is partial for A7;
- Shepherd observes per-effect reversibility tiers for A7;
- none of the listed runtimes fully covers A1–A8, and none controls A8.

The authors explicitly describe this as conjectural scope and coverage rather than a theorem. The effect model also excludes semantic planning errors, such as choosing the wrong city; read-side anomalies; security or policy violations; contract misclassification; intra-execution ordering other than A7; and liveness. These exclusions matter. Even a complete boundary contract cannot stop an agent from choosing the wrong business action or sending a permitted but unwanted request.

## Failure modes, cost, and transfer

The paper does not provide a common quantitative ablation, latency benchmark, or cross-runtime transfer experiment, so this section is a diagnostic reading rather than a new measurement. The failure modes themselves suggest different operational costs. A1 creates duplicate reconciliation work and possibly a financial charge; A2 and A4 require inventory or ledger repair; A3 consumes compensation budget while increasing blast radius; A5 and A8 create communication or reputational cost that may be impossible to reverse; A6 and A7 make dependency and concurrency bugs harder to localize. The transfer question is whether a capability learned for one tool family transfers to another: an idempotence hint for a read-like endpoint does not transfer to a payment endpoint, and a correct compensation for an internal record does not transfer to an externally visible message. A production evaluation should therefore measure failure-mode incidence, reconciliation cost, calibration of unknown handling, and cross-tool transfer instead of only aggregate call success.

## Artifact audit: what #49 can and cannot reproduce

As of 2026-09-16, I directly inspected the authors’ [mcp-annotation-census repository](https://github.com/flame-stream/mcp-annotation-census). The repository is public, MIT licensed, and not archived. The main branch was available at commit 5c24643d447402fc7bf8096555f72859b2c126cb when checked. Its README describes a single-file Python tool requiring Python 3.10+ and mcp>=1.25,<2. It only calls remote MCP tools/list and never calls or executes a tool.

The artifact status is best separated into four parts:

1. **Code: available.** The census script and instructions are in the GitHub repository and can be inspected for field parsing and offline aggregation.
2. **Data: partly available.** The repository ships output_full2/registry_snapshot.json, an approximately 90 MB snapshot marked 2026-07-27; the raw snapshot and tools.csv endpoints also responded to range requests when checked. This enables offline recomputation, but it does not make the live registry immutable.
3. **Model/checkpoint: not applicable and not released.** This is not a model-training or checkpoint-comparison paper. There are no model weights, inference endpoint, or model benchmark to fetch.
4. **Demo: no interactive demo provided.** The repository is an analysis tool, not a hosted UI. The repository and its LICENSE remain the correct artifact entry points under the MIT terms.

What can be reproduced is the annotation-census pipeline over the shipped snapshot, not a guarantee that a fresh registry query will return the same 98,291 tools. A careful rerun must lock the snapshot, MCP client version, anonymous query time, timeout/retry policy, and reachability conditions. A remote connection failure should not be silently interpreted as “the server has no tools.”

## Engineering decisions: when to adopt which contract

If a tool only reads public data, unknown may mostly create a stale answer; timeout, trace, and freshness still matter. If it charges a card, changes inventory, sends a message, deletes a file, or triggers a webhook, the minimum design should contain more than idempotentHint:

- give each logical operation a client-supplied identity, a repeatable status/outcome endpoint, and a retention period for the original outcome;
- separate preview, quote, or dry-run from actual externalization, so the agent can obtain an expiring hold before release;
- declare a compensation target, precondition, retry behavior, and a way to verify neutralization;
- use prepare/commit, staging, or saga steps across tools, and model partial commit, residue, and reconciliation as explicit state;
- declare resource scope, versions, commutativity, or mediator ownership for shared resources instead of putting “avoid races” in a prompt;
- record the observation boundary and downstream reaction for effects already visible to external actors, so A8 remains an explicit risk.

**When should this vocabulary not be treated as a sufficient solution?** When the problem is the wrong destination, wrong SQL, permission abuse, prompt injection, or service liveness, A1–A8 cannot replace policy validation, semantic evaluation, authorization, or availability engineering. This is a boundary lens, not the whole agent-safety program.

## Limitations and next reading

**Paper limitations:** The anomaly catalog’s coverage is analytical and conjectural; there is no common runtime benchmark, production-frequency measurement, or cross-industry trace study. The MCP census covers only an anonymously reachable remote subset, and annotation values were not manually validated one by one. A8 depends on external visibility and open-world actors; without visibility control, formal repair remains limited. The paper also explicitly excludes semantic planning error, read-side anomalies, policy violations, contract misclassification, liveness, and general ordering.

**Adoption limitations:** Do not begin by asking which runtime supports the most anomalies. First define the effect invariant for the product. A payment system might require “at most one settled charge per customer intent.” A messaging system may only be able to promise “at most one enqueue into the provider,” not that a recipient sees one message. Only a queryable invariant makes it possible to choose a status endpoint, compensation, or mediator.

Next read [Continuity Security’s context contract](/en/paper-reading/45-continuity-security-context-contracts/) for cross-turn security state; [ReVA’s reusable evidence views](/en/paper-reading/47-reva-reusable-evidence-views/) for connecting effect history to auditable evaluation views; and [Parsing the Stream](/en/paper-reading/43-parsing-the-stream-live-trace/) for lower-level trace observation.

## Three takeaways to remember

1. **A tool response is not world state:** success, failed, and unknown are observations; externalize, commit, abort, and survives describe what the workflow leaves in the outside world.
2. **The eight anomalies need different capabilities:** idempotency touches only part of A1; A2–A8 also require outcome resolution, compensation, staging, dependencies, coordination, or visibility control.
3. **Without a boundary protocol, do not pretend exactly-once:** MCP advisory annotations express intent, but they do not alone guarantee logical-operation identity, atomic release, verifiable compensation, or retractable external reactions.

## Primary sources and further material

- [arXiv abstract and metadata](https://arxiv.org/abs/2609.15397)
- [Full arXiv HTML, including Tables 1–4](https://arxiv.org/html/2609.15397)
- [Versioned PDF](https://arxiv.org/pdf/2609.15397v1)
- [MCP annotation census code and snapshot](https://github.com/flame-stream/mcp-annotation-census)
- [MCP specification revision 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26)

### Figure note

<!-- paper-reading-no-body-figures: arXiv:2609.15397v1 exposes no material figure assets; evidence is presented in Tables 1–4 only. -->

The v1 HTML of the original paper contains no figure elements and no material figure assets; its primary evidence is carried by Tables 1–4 and the effect-history definitions, census method, and capability argument in the body. This article therefore uses an explicit no-body-figure exception: the Evidence Atlas cover is not counted as a body figure, and no decorative image is substituted for a figure that the source does not contain. This exception applies only to #49, where the source has no sufficient figures; it does not permit later paper readings to skip original figure assets and caption provenance.
