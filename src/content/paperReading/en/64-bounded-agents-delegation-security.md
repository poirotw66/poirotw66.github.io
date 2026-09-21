---
title: "Bounded Agents: When Agent Security Is an Authorization-Architecture Problem"
description: "A deep read of Bounded Agents (arXiv:2608.15888 v1): the Agentic Principal Chain, six conjunctive authorization conditions, and composition closure for constraining delegated authority and cross-step side effects—together with the complete-restriction, serialized-admission, enforcement, and utility boundaries."
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "APC turns the human, orchestrator, sub-agent, and tool into an Agentic Principal Chain. Scope, budgets, session history, and intent narrow as delegation proceeds instead of treating every request as a fresh check against a static grant."
  - "Every action must pass identity, scope/composition, context, approval, evidence, and intent. Composition closure uses prior-action state to block outcomes such as read→send that are individually permitted but prohibited in combination."
  - "Across 1,054 InjecAgent cases, APC takes data-stealing ASR from 100% to 0%; exfiltration is also 0% in the four compromised-model AgentDojo domains. The pair-weighted interactive utility delta is −8.6 percentage points."
  - "The central boundary is not the 0% headline: Composition Soundness requires a complete effective restriction set and serialized admission. Single-action parameter misuse, session splitting, action-taxonomy errors, and policy incompleteness need complementary controls."
audience:
  - "Engineers building multi-agent orchestration, tool gateways, MCP gateways, or enterprise authorization platforms."
  - "Security and governance teams connecting prompt injection, delegation, action history, approval, and audit evidence to one runtime gate."
tags: ["Paper Reading", "AI Agent", "Agent Security", "Authorization", "Governance", "Evaluation"]
image: "/paperReading/bounded-agents-delegation-security/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-safety-governance
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "Bounded Agents: Delegation Security for Multi-Agent AI Systems"
  authors:
    - "Xabier Muruaga"
  year: 2026
  venue: "arXiv cs.AI preprint, v1（2026-08-16；未經同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2608.15888v1"
    arxiv: "https://arxiv.org/abs/2608.15888"
    doi: "https://doi.org/10.48550/arXiv.2608.15888"
    code: "https://github.com/xmuruaga/bounded-agents"
series:
  id: "bounded-agents-security"
  title: "Bounded Agents Security"
  part: 1
  totalParts: 1
---

This reading covers [Bounded Agents: Delegation Security for Multi-Agent AI Systems](https://arxiv.org/abs/2608.15888), arXiv v1. The paper was submitted on 2026-08-16 by independent researcher Xabier Muruaga. What can be verified here is an arXiv preprint and a public Apache-2.0 reference implementation; there is no evidence of an accepted venue. It is a mixed paper: a formal and conceptual authorization model, a runtime enforcement architecture, deterministic benchmark evidence, live AgentDojo experiments, and adaptive attacks.

I read the complete arXiv HTML/PDF, Sections 1–9, Appendices A–I, Tables 1–16, and Figures 1–4. I also independently inspected the author’s [bounded-agents repository](https://github.com/xmuruaga/bounded-agents), its `v1.0.0` artifact, tests, committed results, evaluation manifest, paper source, and PDF. I will keep Paper claims, Evidence, and Bloss0m engineering judgment separate. The paper’s central question is not simply whether a model can resist one prompt injection. It is: **when a model or delegated principal is already compromised, can infrastructure still prevent authority from expanding across delegation hops, or prevent several permitted actions from composing into a prohibited outcome?**

## The paper in 90 seconds

- **Problem:** Static session permissions and independent per-request checks can see that an actor may read and that it may send mail, but not that the two operations become exfiltration when joined in one session. They also do not naturally express why authority should narrow as it moves from a user through an orchestrator to a sub-agent.
- **Core insight:** The Agentic Principal Chain (APC) carries session-level authorization state down the principal chain. Infrastructure computes a meet at every hop so scope only narrows; consumed budget is inherited; prior actions, approval, evidence, and pre-declared intent participate in every admissibility decision.
- **Strongest evidence:** With a complete restriction set, InjecAgent’s 544 data-stealing cases go from 100% ASR to 0%; observed exfiltration ASR is also 0% across 609 compromised-model task–injection pairs in four AgentDojo domains. These are observed rates under a specified benchmark protocol, not worst-case theorems for arbitrary tools or production organizations.
- **Main boundary:** Composition Soundness needs a complete effective restriction set and serialized admission. APC also does not perform full semantic parameter validation for every authorized action. The 0% result does not cover omitted restrictions, cross-session splitting, malicious parameters on one action, compromised PDP/PEP/evidence infrastructure, or unmodeled external side effects.

My bounded verdict is: **APC’s most valuable move is to take delegated authority and action composition out of model behavior and put them into session authorization state plus an execution gate outside the model. That separation is useful, but it moves the hardest governance work into action taxonomy, restriction completeness, intent specification, approval calibration, and trusted infrastructure.**

> **Huahua's engineering note**
>
> A prompt is not an authorization control. If a model is induced to read data and then send an external message, the place that should decide whether the second action can execute is a gateway between the model and the backend that can see session state. That gateway still does not automatically validate parameters, replace backend authorization, or substitute for data-flow isolation and model defenses.

## Paper identity, problem, and three voices

### What problem is the paper solving?

The authors argue that agentic workflows violate assumptions behind traditional access control: the acting entity is a probabilistic, non-human identity; delegation is dynamic and recursive through orchestrators and sub-agents; the tool-call sequence emerges at runtime; and effective scope changes with session history. A static grant may therefore authorize both read and send without expressing that the two operations must not be combined in one session (Sections 2.1–2.3).

The threat model allows an attacker to inject content into context, fully compromise one principal in the chain, observe action success or failure to probe scope, and retain influence for the task session (Table 1, Section 3.2). The trusted computing base consists of the identity provider, policy decision point, policy enforcement point, signed policy configuration, approval service, and append-only evidence store. Model outputs, retrieved content, tool outputs, sub-agent messages, and natural-language instructions are untrusted data; they do not become authorization by assertion (Table 2, Section 3.3).

The non-goals are equally important. APC does not solve model alignment or all hallucination, replace backend authorization, protect a compromised trusted infrastructure, or perform complete semantic parameter validation for every tool call. It constrains which actions can execute on which resources and in which combinations; it does not prove that every authorized action is the best choice for the task (Section 3.5).

| Layer | Precise reading |
| --- | --- |
| **Paper proposes** | A session-scoped APC model, delegation chain, scope attenuation, delegation budget, composition closure, six-condition admissibility predicate, PEP/PDP gateway, Blast Radius Monotonicity, and Composition Soundness. |
| **Evidence directly shows** | The repository’s README reports 215 tests; results cover 99 depth-2–8 delegation scenarios, 1,054 InjecAgent cases, 400 ASB cases, 609 compromised-model pairs, 949 utility pairs, and 43 adaptive variants. |
| **Authors interpret** | Prompt-injection consequences are partly an authorization-architecture problem; moving composition constraints outside the model can block some outcomes even under full model compromise. |
| **Bloss0m engineering synthesis** | Read APC as a session-authorization kernel, not another agent framework or a complete safety solution. It belongs between existing identity, policy, tool-gateway, and backend-authorization layers. This is engineering interpretation, not an additional theorem. |

## Why the prior approach is insufficient

RBAC, ABAC, OAuth grants, and per-tool allowlists are good at asking whether a principal may perform an action on a resource now. They do not usually retain which actions have already occurred in the same agent session, or compute a narrowed scope and remaining budget at every delegation hop. Recording a delegation chain in a token is also not the same as having infrastructure enforce attenuation; putting “do not send externally” in a system prompt is not a backend gate the model cannot bypass. The gap the authors target is therefore authorization state across actions, hops, and sessions—not another prompt policy (Sections 2.2–2.3).

## Core intuition: permitted actions are not the same as permitted sequences

With independent checks, both statements below may be true:

```text
read(confidential_report)        → permitted
send_external(report, recipient) → permitted
```

Yet in one session they may compose into exfiltration. A per-request check asks only about the current action. APC asks: **after placing action (a) into the current principal chain, scope, budget, prior-action history, intent, and evidence state, is it still admissible?**

That change has three dependent layers:

1. **Authority flow:** authority moves from human principal $p_0$ to orchestrator $p_1$, sub-agent $p_2$, and finally a tool, but should not become broader through delegation.
2. **Session state:** scope is not enough; completed actions, consumed blast-radius budget, policy version, approval tokens, and evidence-sink state can all affect the next decision.
3. **Infrastructure decision:** the model proposes an action; the PDP evaluates it; the PEP gates the backend call. A denial at the gateway cannot be overridden by emitting different prose.

APC is therefore not primarily a smarter prompt classifier. It places model output at a less trusted layer: output is a proposed action, not authorization. This is why the compromised-model evaluation injects the benchmark ground-truth attack call directly. If the gate depends on the model saying “do not do that,” authorization and model compliance have not been separated.

## APC’s formal objects: scope, budgets, chain, history, and intent

### Scope and delegation budget

APC represents scope $S$ as an authorization object with a resource set $R(S)$, action-type set $A(S)$, data-classification set $D(S)$, and composition restriction set $X(S)$. Delegation does not copy the parent grant unchanged. It computes:

$$
S(p_i)=S(p_{i-1})\sqcap S_{role}(p_i)
$$

Resource, action, and data-classification sets intersect, while restriction sets union. A child cannot add back a resource or action that its parent did not have just because its role description is broader (Definitions 4.1–4.3).

Budget $B$ contains six ceilings: delegation depth, cumulative blast radius, irreversible effects, sensitivity class, cross-domain composition, and compute cost (Definition 4.3). These are set at session initialization and cannot be changed by the agent. Ceilings only decrease along the chain, while consumption is accumulated by infrastructure before each action executes.

### Blast Radius Monotonicity is not “always safe”

The paper defines $BR_{max}(p_i)$ as the resource set reachable by a principal under its current scope and remaining blast-radius budget:

$$
BR_{max}(p_i)=R(S(p_i))\cap\{r:\mathrm{blast}(r)\leq\beta_{max}(p_i)-\beta_{consumed}(p_i)\}
$$

Theorem 4.6 states that $BR_{max}(p_i)\subseteq BR_{max}(p_{i-1})$ along the chain. The proof relies on two facts: resources narrow by intersection, and the child inherits the parent’s consumed-budget floor. This means the reachable blast radius does not grow as authority moves down the chain; it does not mean that no principal can make a mistake. Without consistent blast calibration, atomic budget updates, and trusted infrastructure, an implementation may not satisfy the theorem’s premises.

### Prior-action state and composition closure

Restriction set $X$ can contain pairwise restrictions such as `read + send_external`, as well as ordered $k$-tuple restrictions for staged exfiltration such as `read → write → send_internal`. Admission does not only compare action $a_j$ with a static policy. It checks whether adding $a_j$ to the session history completes a prohibited tuple. Composition Soundness (Theorem 4.8; theorem numbering is presented slightly differently in the abstract and source rendering, so this article follows the Section 4.7 theorem anchor) is conditional: when the effective restriction set $X_{eff}$ is complete and admissions are serialized over the ordered session history, no admissible sequence produces an outcome prohibited by $X_{eff}$.

It would be too strong to summarize this as “APC prevents exfiltration.” The accurate statement is that it prevents **combinations expressible in the restriction set and detectable in the action-type history of one session**. Appendix A’s coverage metric is relative to the enumerated prohibited outcomes $\mathcal{O}$, not a complete enumeration of every possible harmful sequence.

### Session intent only narrows

The initiator pre-declares intent $\Psi$. It contains a task objective, permitted resource patterns, permitted action sequences, negative constraints, and optionally an action–resource map. Negative constraints are evaluated first. If the intent’s resource and action subsets do not fit inside the scope, the envelope cannot be created. The key point of Intent Refinement is that intent is another narrowing constraint; it is not a model-generated guess about what the user probably meant at runtime (Section 4.5).

## Six conditions: a conjunctive gate, not a risk score

Every proposed action must satisfy:

$$
\mathrm{Admissible}(a,C,S,B,\mathcal{A},E,\Psi)
\iff C_1\land C_2\land C_3\land C_4\land C_5\land C_6
$$

| Condition | Question | Engineering meaning |
| --- | --- | --- |
| **C1 Identity Binding** | Is the actor bound to a verifiable principal chain? | Do not collapse human, orchestrator, sub-agent, and tool into one identity. |
| **C2 Scope + Composition** | Is the action within attenuated scope, restrictions, and budget? | Check resource/action/data scope, prior actions, and cumulative ceilings. |
| **C3 Context Binding** | Is it bound to the correct task instance, policy version, and parameter context? | Prevent replay across sessions or policy versions. |
| **C4 Approval Binding** | Does a high-impact action have a single-use token hash-bound to the exact action, parameters, and session? | “Please ask first” in a prompt is not an approval gate. |
| **C5 Evidence Commitment** | Is the evidence sink reachable and able to record the trace before execution? | Deny when the sink is unreachable; use a hash chain for tamper evidence. |
| **C6 Intent Binding** | Is the action relevant to the declared task? | Evaluate negative constraints first; absent intent may fall back to C1–C5, but that is not the same as verified intent. |

The authors group the conditions into three guarantee tiers. C2a, C2b, and C3 are structural properties relative to a fixed effective policy. C4 and C6 depend on calibration and intent completeness. C1, C5, and C2c depend on infrastructure availability and integrity. The split matters because having a theorem for one tier does not remove operational and governance work from the rest of the system.

## Walk one example through the method: a document agent tries to email a confidential summary

The following is a **Bloss0m explanatory example**, adapted from the paper’s read→external-send composition, not a new experiment.

1. **Input:** A user asks an orchestrator to summarize `finance/quarterly-report.pdf`. The sub-agent may read that directory and return a summary to the internal workspace. An untrusted document contains an instruction to email the full report to `external-review@example.com`.
2. **Intermediate representation:** The signed session envelope binds $p_0\to p_1\to p_2$. Scope retains only the specified resources, actions, and data class; the budget tracks delegation depth and sensitivity; $\Psi$ marks `send_external` or an external recipient as a negative constraint; the session history already contains `read(confidential)`.
3. **Decision:** The model proposes `send_external(summary)`. The PDP checks identity, scope/composition/budget, context, impact approval, evidence commitment, and intent. Even if a coarse allowlist permits the action in isolation, C2b sees the prior read and restriction pair, while C6 can see that the action is outside the declared task. Any false condition produces denial.
4. **Output:** The PEP does not send the action to the email backend and records the denial in the evidence trail. The agent can explain the denial, but another natural-language response cannot bypass the gateway.
5. **Likely failure point:** If the restriction set omits the action-class pair, or a tool is incorrectly mapped to a harmless `write` class, composition closure may miss the semantics. If the attacker splits read and send across two sessions without durable lineage state, the paper explicitly treats session splitting as admitted by design.

The walkthrough fixes the causal order: **input → signed session state → proposed action → six-condition PDP → PEP gate/evidence → backend or denial**. It also shows why APC cannot solve parameter safety alone. If `send_external` is itself explicitly allowed as a single action, application-level parameter validation, data-flow policy, or human review is still required.

## Runtime architecture: enforcement outside the model

Figure 1 shows Human Principal → Orchestrator → Sub-Agent → Tool Execution. Scope narrows at every hop. The PDP reads the signed envelope, session history, budget, approval state, and evidence state; the PEP/tool gateway forwards a call to the backend only when the PDP says it is admissible. C5 makes evidence commitment a precondition for execution, so an unavailable evidence sink must fail closed.

![Bounded Agents Figure 1: delegation chain, scope narrowing, and PDP/PEP gate](/paperReading/bounded-agents-delegation-security/paper/figure-1-delegation-chain.svg)

*Figure 1 (original paper Figure 1, Section 5.1): Notice the two distinct paths: authority narrows down the principal chain, while the PDP/PEP outside the model gates tool execution against six conditions. This is not a security instruction placed in a prompt. [Original Figure 1 anchor](https://arxiv.org/html/2608.15888v1#S5.F1) · [arXiv licensing information](https://info.arxiv.org/help/license/index.html). The asset is the v1 arXiv HTML inline SVG; the arXiv page marks the work CC BY 4.0, and this article preserves the source and figure number.*

Figure 2 makes composition closure concrete. The top row is a legitimate read followed by internal sharing; the middle row is direct exfiltration caught by a pairwise restriction; the bottom row is an intermediate write that evades pairwise checking and therefore requires a $k$-tuple restriction. The figure does not claim that every harm can be solved with tuples. It shows that action-type history must match the domain’s prohibited outcomes.

![Bounded Agents Figure 2: pairwise and k-tuple composition closure](/paperReading/bounded-agents-delegation-security/paper/figure-2-composition-closure.svg)

*Figure 2 (original paper Figure 2, Section 5.3): The important distinction is between each step being individually permitted and the whole sequence being permitted. An intermediate write creates a blind spot for a pair-only policy; a $k$-tuple restriction can express the ordered staged exfiltration. [Original Figure 2 anchor](https://arxiv.org/html/2608.15888v1#S5.F2) · [arXiv licensing information](https://info.arxiv.org/help/license/index.html). The asset is the v1 arXiv HTML inline SVG; the article preserves the source, figure number, and CC BY 4.0 reuse context.*

## What the authorization state remembers, and why each field exists

The model is easier to evaluate if its state is read as four linked objects rather than as one large policy blob. First is the **authorization scope**, which answers which resources, action classes, and data classifications are reachable, plus which combinations are forbidden. Second is the **principal chain and delegation budget**, which records who delegated to whom and how much depth, blast radius, irreversibility, sensitivity, cross-domain composition, and compute cost remain. Third is **prior-action state**, which makes the decision history-dependent. Fourth is **session intent**, which expresses the task-specific subset and its negative constraints. The paper says these objects travel together in a signed authorization envelope (Section 4.1).

That decomposition also clarifies what a denial means. C1–C3 can reject an action because the actor, session, policy version, scope, budget, or composition history is wrong. C4 can reject it because the impact score exceeds the approval threshold and the exact single-use token is missing, expired, consumed, or bound to different parameters. C5 can reject it because the evidence sink is unavailable; in this design, “we will log it later” is not equivalent to committing evidence before the side effect. C6 can reject it because the action is outside the declared task, even when a broad role grant would otherwise allow it.

The paper is careful that these conditions are not interchangeable. A hash-bound approval token cannot repair a missing composition restriction. A complete composition restriction cannot establish that the caller has the right identity. Intent cannot widen a scope, and an evidence hash chain cannot prove that the action parameters were semantically benign. The conjunction is a safety boundary precisely because one failed condition is enough to deny, but it is not a single score that ranks how safe a request feels.

The restriction authoring procedure in Appendix A makes this operational. A deployment first enumerates semantic action classes and maps each tool through μ:Tools→C. It then enumerates prohibited outcomes O, derives pairwise or ordered-tuple restrictions from the minimal sequence for each outcome, and measures coverage relative to that outcome list. This is a practical bridge from threat modeling to policy configuration, but it is also a source of residual risk: a coverage value of 1.0 means “all enumerated outcomes are covered,” not “all harmful sequences in the world are covered.”

There is a similar distinction between proof and deployment. The formal theorem is about an implementation faithful to APC semantics. The deployment still needs an IdP that binds each principal, a PDP that evaluates the same envelope, a PEP that cannot be bypassed, a signed policy configuration, a single-use approval service, and an append-only evidence store. The paper’s trust boundary excludes compromise of those components. This makes the theorem easier to state, but it also means the architecture’s real security depends on keeping the control plane inside the trusted computing base.

## How to read the evidence: each experiment answers a different question

This is not one leaderboard. The paper separates formal validation, deterministic composition tests, compromised-model enforcement, utility preservation, and adaptive attacks. Turning them into one “security improved by X%” claim would erase the denominator and guarantee boundary of each result.

### Deterministic evidence: restriction completeness changes the answer

InjecAgent contains 1,054 cases: 544 data-stealing and 510 direct-harm cases. The baseline has 100% ASR in both categories. Complete $X$ takes data-stealing ASR to 0%, but direct-harm ASR remains 60.4% because many direct-harm actions are single actions that remain within coarse scope and require parameter-level validation. Removing one pair from $X$ produces partial $X$ and raises data-stealing ASR to 39.9%.

ASB provides a similar boundary across 400 attack tools. Complete $X$ takes the 200 disruptive cases to 0% ASR, while 200 stealthy cases remain at 30%. The authors trace two residual tool types: their natural-language semantics are exfiltration-like, but the benchmark-level classifier assigns them to the write class. Under the correct `read` + `send_external` mapping, the existing pair blocks them. This is not extra evidence that the taxonomy is automatically correct; it is a useful warning that **composition closure’s ceiling is set by action-class granularity** (Figures 3–4, Tables 4–5, Sections 6.2–6.3).

Figure 3 pools the compromised-model result across four AgentDojo domains: exfiltration falls from 87.0% undefended ASR to 0% with APC, destruction from 38.6% to 4.0%, and manipulation from 90.5% to 12.1%. The protocol inserts the benchmark ground-truth attack call after the first legitimate tool call, intentionally separating whether the model can be induced from whether infrastructure admits the action. The evidence supports this bounded statement: when the ground-truth attack call enters the pipeline, APC can still block policy-expressible compositions. It does not show that a model will never emit an attack call.

![Bounded Agents Figure 3: compromised-model AgentDojo attack success rate](/paperReading/bounded-agents-delegation-security/paper/figure-3-compromised-model-results.svg)

*Figure 3 (original paper Figure 3, Section 6.4): The decrease has different proposed mechanisms: exfiltration is primarily associated with C2b composition closure, while destruction and manipulation depend more on C6 intent binding. The 0% is an observed rate over 609 specified task–injection pairs, not a proof over an arbitrary attack space. [Original Figure 3 anchor](https://arxiv.org/html/2608.15888v1#S6.F3) · [arXiv licensing information](https://info.arxiv.org/help/license/index.html). The asset is the v1 arXiv HTML inline SVG; the article preserves the source, figure number, and CC BY 4.0 reuse context.*

### Formal validation: theorems are paired with executable reference checks

The repository and paper report 99 delegation-chain scenarios at depths 2–8, covering 20 attack categories; all 99 produced the expected outcome. The reference implementation is described as roughly 2,500 LOC of source and 3,000 LOC of tests; the README reports 215 tests and 90% statement coverage. The latency appendix reports full six-condition admissibility at 0.05 ms p50 and 0.24 ms p99 on an idle host, with a highest observed repeated p99 of 0.35 ms. This measures the authorization path only, excluding model inference, network round trips, and the end-to-end agent runtime.

These checks support the existence of an executable APC semantics and make the formal claims more inspectable than prose alone. They do not validate arbitrary distributed deployment, concurrent admission, a persistent policy store, or a production tool graph. The paper does not present machine-checked proofs of the two theorems; the conclusion lists that as future work.

### AgentDojo utility: the security/utility trade-off is part of the result

Utility Preservation Rate (UPR) is the fraction of task–injection pairs in which the user task succeeds, evaluated with Claude Sonnet 4.6 across four AgentDojo suites and three runs per suite. Table 7 compares baseline, APC strict (approval-gated actions denied), and APC interactive (human approval simulated for C4-only denials). The pair-weighted aggregate delta is −13.9 pp in strict mode and −8.6 pp in interactive mode. Interactive deltas are −9.6 pp for Workspace, −10.0 pp for Banking, +0.2 pp for Travel, and −13.0 pp for Slack; domain variation should not disappear behind the aggregate.

The headline should therefore read: under this protocol, an interactive approval trade-off of about 8.6 percentage points accompanies 0% observed exfiltration ASR in the compromised-model cohort across four domains. It does not support “security is almost free,” or “APC is better than every other defense.” It also does not turn task utility into product success rate. AgentDojo has fixed tasks, tools, classifiers, restrictions, and intent-parser configurations; the utility and compromised-model cohorts come from the same task–injection space and are not independent samples.

### Adaptive attacks: integrity tests expose the session boundary

The adaptive suite has 23 named attacks and 43 variants. Twenty-four target prohibited outcomes, and 23 are blocked. It covers approval replay, expired or consumed tokens, evidence evasion, budget exhaustion, intent drift, and decomposed exfiltration. A `read → write → send_internal` sequence that evades pairwise restrictions is caught by a $k$-tuple. Splitting the composition across sessions is admitted by design because composition state exists only within one session.

That is not a footnote to hide. It states the theorem’s scope. A system that needs cross-session provenance must add durable lineage state; session-level history does not automatically cross a session boundary.

## Evidence map: what do the claims and numbers actually support?

- **Paper directly supports:** APC is a session-scoped authorization model; scope narrows monotonically along a delegation chain; the six conditions are conjunctive; Composition Soundness and Blast Radius Monotonicity hold under explicit assumptions; an external PEP/PDP can place composition restrictions, approval, evidence, and intent before execution; and the specified deterministic, AgentDojo, and adaptive protocols produce the reported outcomes.
- **Authors interpret:** Prompt-injection consequences are partly an authorization-architecture problem. An agent without external-send authority cannot complete an exfiltration that requires that authority, regardless of the injected text. APC is intended to complement OAuth, OBO, RBAC, ABAC, policy-as-code, and backend authorization.
- **Evidence does not establish:** That APC prevents every prompt injection, solves model alignment, guarantees semantic intent understanding, automatically derives a complete $X$ for any enterprise policy, or retains a 0% attack rate under production concurrency and arbitrary external side effects.
- **Bloss0m engineering judgment:** The deployment unit is not just “add a PDP library.” It is the combined control plane of action taxonomy, restriction authoring, impact calibration, approval UX, durable evidence, gateway coverage, backend authorization, and recovery. If a team cannot enumerate prohibited outcomes and map tools to action classes, the theorem may be correct only over an incomplete policy universe.

## Artifacts and reproducibility: public does not mean every result is offline-replayable

As of **2026-09-21**, the `v1.0.0` checkout at `https://github.com/xmuruaga/bounded-agents` is accessible and contains:

- the `apc/` core library, `tests/`, and the README’s 215-test claim;
- scripts, inputs, and committed result files for delegation, adaptive attacks, InjecAgent, ASB, and latency;
- AgentDojo utility/compromised summaries, details, and `results/MANIFEST.md`;
- `paper/bounded-agents.pdf`, submitted `main.tex`, and `references.bib`;
- an Apache-2.0 repository license; redistributed InjecAgent and ASB data remain subject to upstream MIT notices.

The README states that the core library and deterministic evaluations have no runtime dependencies beyond Python 3.11+. `pytest`, `demo.py`, `verify_numbers.py`, and the deterministic benchmark scripts form the smallest local reproduction path. AgentDojo utility requires `evals/requirements-evals.txt` and AWS Bedrock access to Claude Sonnet 4.6; compromised-model runs use Claude Haiku 4.5. These are not offline, credential-free reproductions, and live utility results vary by run. The committed summaries should therefore be treated as the v1 artifact snapshot, not as output that must remain identical on every future execution.

A practical reproduction order is to run the tests, demo, `verify_numbers.py`, delegation, adaptive, InjecAgent, and ASB scripts first. Then, with explicit AWS access, fixed model routes, and fixed versions, rerun one AgentDojo suite and report UPR, attack success, cohort denominator, and approval mode separately. “Publicly available” should not be rewritten as “all live evaluations can be reproduced unconditionally.”

## Limitations, failure modes, and when not to use it

### The paper’s own boundary

1. **A complete restriction set is an assumption, not an automatically generated fact.** $X$ is authored per security domain. Coverage is relative to enumerated $\mathcal{O}$. Omitting one pair raises InjecAgent data-stealing ASR to 39.9%; a missing pair also appears among the 18 residual AgentDojo attacks.
2. **Serialized admission is a theorem condition.** If concurrent admissions read the same prior-action state, pass independently, and commit together, composition closure may be bypassed by a race. Soundness does not automatically include arbitrary distributed concurrency.
3. **Session splitting is out of scope by design.** Cross-session composition state does not continue automatically; durable lineage or cross-session provenance is required.
4. **Action taxonomy controls visibility.** If tool semantics are collapsed into an overly coarse or wrong class, the policy may not see the exfiltration semantics. APC is not a semantic-understanding oracle.
5. **Single-action misuse remains.** Malicious parameters, wrong resources, data-flow direction, or external side effects on an in-scope action need parameter-level validation, backend policy, sandboxing, or data-flow controls.
6. **Trusted infrastructure is a trust boundary.** The PDP, PEP, key management, approval service, and evidence store are assumed not to be compromised. If the gateway can be bypassed, or the append-only evidence and its anchoring are not trustworthy, C5 cannot be carried over as stated.
7. **Utility cost is not incidental noise.** The −13.9 pp strict and −8.6 pp interactive deltas are adoption inputs, and the costs differ across Banking, Slack, Workspace, and Travel.

### When should you not use APC alone?

Do not treat APC as the only control when tool parameters carry most of the harm, when data flow needs field-level or taint-level guarantees, when workflows cross many sessions, when admission is highly concurrent without atomic history commit, when domain owners cannot maintain the restriction set, or when you need an external-validity claim about production incident rates. APC can still be the delegation/composition layer, but it should be combined with application authorization, secret isolation, schema and parameter validation, human approval, sandboxing, rate limits, rollback, and durable audit.

Conversely, if a system already has a tool gateway and can maintain signed session envelopes, an action taxonomy, a restriction matrix, and append-only evidence—and if the key concern is whether read and send can be combined within one agent session—APC is a useful abstraction to adopt or at least a useful design target for a policy kernel. This is engineering interpretation, not a universal adoption rule proven by the paper.

## Engineering decision: move one security question to a more verifiable control point

APC does not make the model more aligned. Its practical value is to turn one class of security problem into infrastructure objects that can be inspected:

1. **Every hop has a verifiable principal and irreversible narrowing.** Delegation is not merely passing a token; role scope, resources, data class, and budget are computed into child state.
2. **Every step can inspect session history.** If safety depends on what has been read, sent, or consumed, the policy must be stateful rather than a request/response pair.
3. **The six conditions separate structural, configured, and operational responsibility.** Theorems can describe the structural subset; intent, restriction completeness, calibration, and evidence availability remain governance and operations work.
4. **The denial point sits close to the side effect.** The PEP is the actual control point. An agent can explain a denial, but it cannot make email, delete, transfer, or an MCP call cross the gateway by changing its prose.

For an existing platform, I would begin with four tables from this **Bloss0m engineering synthesis**, rather than copying the paper’s benchmark numbers: a `principal chain` table for who may delegate to whom; an `action taxonomy` table for each tool’s semantic class and resources; a `composition/restriction` table for forbidden pairs/tuples and its coverage denominator; and an `evidence/approval` table for gate decision, hash, policy version, token, denial reason, and recovery path. This checklist is a synthesis in this article, not an additional framework proposed by the authors.

## Three things to remember

1. **Technical idea:** APC puts delegated authority, scope attenuation, budget, prior actions, and intent into one session state. An external PEP/PDP uses six conjunctive conditions to decide whether an action reaches the backend.
2. **Strongest evidence:** Complete $X$ reaches 0% observed ASR on InjecAgent’s 544 data-stealing cases; exfiltration is also 0% in the four compromised-model AgentDojo domains. The interactive pair-weighted utility cost is −8.6 pp, and direct-harm/manipulation residuals remain.
3. **Boundary:** APC is not a complete answer to prompt injection, intent, parameter validation, or production safety. Composition Soundness depends on complete restrictions and serialized admission; session splitting, taxonomy errors, single-action misuse, and trusted-infrastructure compromise require additional design.

## Primary sources

- [Bounded Agents: Delegation Security for Multi-Agent AI Systems (arXiv v1 HTML)](https://arxiv.org/html/2608.15888v1): definitions, theorems, figures, tables, evaluation protocol, limitations, and appendices used here.
- [Bounded Agents (arXiv v1 PDF)](https://arxiv.org/pdf/2608.15888v1): the PDF version inspected for this reading.
- [xmuruaga/bounded-agents](https://github.com/xmuruaga/bounded-agents): Apache-2.0 reference implementation, tests, deterministic inputs/results, AgentDojo manifests, paper source, and reproduction scripts; checked at the `v1.0.0` artifact.
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0): license for the repository’s core implementation; the upstream notices for redistributed InjecAgent and ASB data still apply.

For related reading, continue with [AgentS4D: Is a completed task really safe at runtime?](/en/paper-reading/12-agents4d-runtime-risks/), [Agentic Configuration Management](/en/paper-reading/18-agentic-configuration-management/), and [SilentProbe: Measuring silent API failures](/en/paper-reading/54-silentprobe-silent-api-failures/). The first makes unsafe execution evidence concrete, the second covers configuration provenance, and APC adds the delegated-authority and cross-action-composition control-plane layer.
