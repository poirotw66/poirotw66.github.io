---
title: "Agentic Configuration Management: Treating Agent Systems as Governed Configuration, Not Just One Execution"
description: "A deep reading of how ACM uses a framework-independent Configuration Graph, immutable revisions, dependency-aware impact propagation, and runtime provenance to govern heterogeneous agent configurations across LangGraph, CrewAI, and the OpenAI Agents SDK."
pubDate: 2026-08-12
updatedDate: 2026-08-12
tldr:
  - "ACM is not another agent orchestration framework; it adds a framework-independent configuration-governance layer above execution frameworks."
  - "It represents agents, prompts, models, tools, workflows, and policies as typed, independently versioned Agentic Configuration Items, with an immutable Release Baseline for reconstructing a complete governed configuration."
  - "Across 27 governance scenarios and 9 impact cases, LangGraph, CrewAI, and the OpenAI Agents SDK feed the same governance kernel; a global model change reaches 5 ACIs in the controlled graph and converges in 3 fixed-point iterations."
  - "The paper supports semantic-projection and deterministic-governance feasibility in controlled cases, not production incident reduction, universal interoperability, or regulatory compliance."
audience:
  - "AI engineers designing agent platforms, AgentOps, prompt/tool/model versioning, and release governance."
  - "Platform and governance teams that need to connect heterogeneous framework configurations, dependencies, runtime traces, and audit evidence."
tags: ["Paper Reading", "AI Agent", "Agent Security", "Governance", "AgentOps", "Evaluation"]
image: "/paperReading/18-agentic-configuration-management/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
paper:
  title: "Agentic Configuration Management (ACM): A Reference Configuration Model for Governed Agentic Systems"
  authors:
    - "Audrey Quessada-Vial"
  year: 2026
  venue: "arXiv cs.SE preprint, v1 (submitted 2026-08-11; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.11166v1"
    arxiv: "https://arxiv.org/abs/2608.11166"
    doi: "https://doi.org/10.48550/arXiv.2608.11166"
    code: "https://github.com/audreyqvial/ACM"
series:
  id: "agent-security"
  title: "Agent Security"
  part: 2
  totalParts: 2
---

## The paper in 90 seconds

- **Problem:** an agent system's behavior is determined not only by code, but also by prompts, models, tools, skills, workflows, policies, frameworks, and runtime state. Existing frameworks and AgentOps tools each manage part of this surface, but do not easily pin down the complete configuration that produced an execution.
- **Core insight:** ACM normalizes heterogeneous artifacts into typed, independently versioned Agentic Configuration Items (ACIs), managed through four connected Configuration, Evolution, Assurance, and Runtime Graphs. Execution frameworks project into this representation; the governance kernel operates on the common form.
- **Strongest evidence:** 27 controlled governance scenarios across LangGraph, CrewAI, and the OpenAI Agents SDK, plus 9 quantitative impact cases. Within the evaluated scope, all three frameworks produce equivalent governance outcomes, and repeated impact sets and metrics are stable (Sections 7.2–7.6; Tables 8, 10, and 12).
- **Main boundary:** this is conformance and feasibility evidence for a reference model and prototype. Distributed execution, learning, long-term memory, native MCP/A2A protocols, and large-scale industrial validation are outside the current scope (Tables 13–14; Sections 8.4 and 9).

## Why do agents need configuration management like software does?

When an agent execution fails, a team often has to reconstruct what actually ran: which prompt revision, model, tools, permissions, workflow version, policy, deployment parameter, and runtime mutation were involved. A trace can show what happened without identifying the complete configuration that produced it. Prompt versioning alone also misses tools, handoffs, policies, and dependencies.

ACM's central move is: **govern the deployable configuration first, then connect runtime observations back to it; do not collapse configuration and execution into the same object.** That makes ACM closer to a cross-framework SCM/governance layer than to a new agent runtime. The paper positions the gap between Software Configuration Management, AI governance, LLMOps/AgentOps, and agent frameworks (Sections 2.3–2.5; Table 2).

> **Huahua's engineering note**
>
> If a production audit can answer only “what did the agent do?” but not “which prompt, tool, model, policy, and baseline composed it?”, you have observability, but not complete configuration governance.

## Limitation of prior approaches

Traditional Software Configuration Management can manage conventional software artifacts, but lacks an agent-specific, framework-independent representation. AI governance frameworks can state accountability and auditability requirements without defining an operational configuration model. LLMOps/AgentOps can provide tracing, evaluation, and deployment tooling, but usually center on platform-specific artifacts. Agent frameworks define execution semantics rather than a common governance representation. Each family solves part of the problem, but none supplies a shared semantic boundary for governing the complete agent configuration. This is the gap ACM addresses (Sections 2.1–2.5; Table 2).

## Core intuition: convert framework objects into governed objects first

The usual approach lets each framework retain its own graph, agent, task, tool, or handoff representation, then connects tracing, evaluation, and deployment metadata separately. Each tool can be useful, but the semantics differ: LangGraph exposes an explicit state graph, CrewAI combines crews, tasks, flows, and dynamic orchestration, and the OpenAI Agents SDK expresses delegation through agent handoffs. If governance rules live directly inside each framework adapter, the platform becomes coupled to framework-specific semantics.

ACM changes the control point into two stages:

1. **Semantic projection:** extract governance-relevant entities, relationships, and metadata from the native framework; normalize identities, references, and digests; and construct immutable ACI revisions.
2. **Common governance kernel:** run validation, lifecycle/quality/assurance/eligibility evaluation, impact propagation, release governance, and runtime reconstruction on the normalized Configuration Graph.

This separation keeps framework-specific differences at the projection stage. Table 5 describes three introspection regimes: LangGraph mainly exposes its graph directly; CrewAI requires adapter metadata and semantic reconstruction for part of its topology; and the OpenAI Agents SDK reconstructs delegation topology from handoff relationships. All three then feed the same governance kernel (Section 6.3; Table 5).

## Walk one example through the method

The following is an **explanatory example** rewritten from ACM's model and impact experiment, not a new production experiment.

1. **Input:** a report-agent workflow contains a planner, writer, shared model, two prompts, a web-search tool, and a dependency/handoff chain. The platform team wants to replace shared model revision `m1` with `m2`.
2. **Intermediate representation:** an adapter projects agents, prompts, model, tool, workflow, and relationships into ACI revisions. Each revision retains a stable logical ID, content digest, and native provenance; the complete deployment is represented by an immutable Release Baseline that points to those exact revisions.
3. **Governance decision:** ACM initializes an impact valuation for the model change and propagates it through typed dependency relationships. While the impact state expands, affected ACIs remain on a worklist; once another pass makes no change, the least fixed point is reached.
4. **Output:** the governance report lists affected prompts, agents, workflows, or release baselines and links runtime entities back to their governing revisions. The team can decide what must be revalidated and which baseline cannot be promoted directly.
5. **Likely failure point:** if CrewAI's dynamic flow topology is not exposed through native introspection, the adapter may need metadata or runtime evidence. ACM can record extraction status and unresolved/approximated semantics, but cannot recover unobserved framework semantics by inference.

The point is not that ACM decides whether one model is better than another. It turns the **blast radius of a change and the resulting verification boundary** into traceable, replayable, repeatable governance output.

## ACM's four graphs and the configuration boundary

ACM organizes its reference model into four connected graphs:

- **Configuration Graph:** the governed composition of the agent system and its structural dependencies.
- **Evolution Graph:** immutable revisions, lineage, replacement, and derivation history.
- **Assurance Graph:** policies, assurance evidence, compliance constraints, ownership, and governance evaluation.
- **Runtime Graph:** execution observations linked back to the governing configuration revision.

The paper's expression can be read first as a data structure:

$$\mathcal{G}_{\mathrm{ACM}}=(G_C,G_E,G_A,G_R)$$

Here $G_C$ through $G_R$ are not four unrelated databases but four governance views. They are separated so runtime mutation does not rewrite a released configuration, and connected so an audit can trace a runtime node back to one immutable revision (Section 4.1; Appendix H.4).

### Why is the Release Baseline a governance unit?

A single prompt or tool revision is not a complete deployable system. ACM's Release Baseline is an immutable snapshot of ACI revisions, configuration relationships, and governance information. It is the main unit for reproducibility, audit, release management, and compliance assessment (Section 4.5; Figure 6).

Rollback therefore should not mean merely changing one prompt name back to an old value. It should reconstruct the complete historical baseline while preserving the relationship between runtime observations and that baseline.

## Technical mechanism: how dependency changes converge to a fixed point

For each ACI revision, ACM first evaluates local quality, assurance, and lifecycle states, then propagates impact. A simplified reading of Section 5.5 is:

$$\iota^{(k+1)}=\widehat{\mathrm{Prop}}_{G_C,\Pi}(\iota^{(k)})$$

- $\iota^{(k)}$ is the impact valuation for every revision at iteration $k$.
- $G_C$ is the fixed Configuration Graph.
- $\Pi$ is the propagation policy associated with the relationships.
- $\widehat{\mathrm{Prop}}$ produces the next valuation from current impact and incoming dependencies.

If the operator is monotone, the valuation cannot move backward during propagation. Because the impact domain is finite, the sequence stabilizes after a finite number of iterations:

$$\iota^{*}=\widehat{\mathrm{Prop}}_{G_C,\Pi}(\iota^{*})$$

This $\iota^{*}$ is the least fixed point reached from the initial change under the model's assumptions. It answers which revisions receive impact under this graph and policy; it does not say that model output quality will improve, and it does not replace human approval or domain tests. Eligibility is evaluated only after propagation stabilizes, using lifecycle, quality, assurance, and $\iota^{*}$ (Sections 5.4–5.7; Appendices E–G).

## How to read the evidence: this tests a governance kernel, not production agent quality

### Campaign A: 27 governance scenarios

This campaign addresses RQ1–RQ3: can the model represent governance concepts, does the implementation conform to its formal semantics, and can different frameworks project into governance-equivalent representations? The 27 controlled scenarios cover immutable revisions, lifecycle evolution, governance states, dependency propagation, release baselines, runtime governance, dynamic agents, and semantic projection. Each framework is projected first and then processed by the same kernel (Section 7.2.1; Table 8).

**Question:** do the same governance concepts produce different governance outcomes when represented by different native abstractions?

**Controls:** keep the normalized kernel and expected semantic properties fixed while changing native representation and introspection mechanism.

**Observation:** the paper reports that all 27 scenarios across the three frameworks produce governed representations consistent with the expected semantic properties; differences stay in extraction status rather than the downstream kernel (Section 7.3; Table 10).

**Possible explanation:** the projection boundary isolates framework-specific extraction from framework-independent governance.

**Boundary:** this is scenario-based conformance evidence, not universal correctness on an independent dataset or proof that every framework can be projected without loss.

### Campaign B: nine impact cases, five repeated executions

This campaign combines three frameworks with three change scopes—local, intermediate, and global—into nine cases, each repeated five times. It measures impact size, impact depth, impact ratio, fixed-point convergence/reproducibility, and residual configuration-inspection scope (Section 7.5; Table 12).

Table 12 reports identical metrics across the three frameworks in the controlled graph: local and intermediate changes each affect 2 ACIs, while a global model update affects 5 ACIs; all three scopes converge in 3 fixed-point iterations. Inspection-scope reduction is `0.846` for local, `0.692` for intermediate, and `0.615` for global changes.

Read these numbers precisely: **reduction means protocol-defined residual configuration-inspection scope, not human time, operational cost, or engineer productivity.** The evidence supports a smaller set of elements to re-check in the controlled cases; it does not justify saying that change-review cost fell by 84.6%.

### Framework slice: extraction capability is itself part of the result

The paper treats the three frameworks as complementary introspection regimes, not competing products. LangGraph's execution graph can be introspected directly; part of CrewAI's flow topology is resolved at execution time and needs metadata/semantic reconstruction; and the OpenAI Agents SDK's handoff topology can be reconstructed directly from agent definitions (Section 6.3; Section 7.4).

This slice matters: **a common governance model does not mean that native configurations contain identical information.** The paper explicitly says governance equivalence is not complete informational identity. ACM's success condition is preserving governance-relevant semantics, not flattening every framework detail into one graph (Section 7.4).

## Evidence map

- **Paper directly supports:** the four-graph ACM representation, typed ACIs and immutable baselines, the semantic-projection pipeline, formal monotone impact propagation, and deterministic/cross-framework consistency across the three named frameworks, 27 scenarios, and 9 impact cases (Sections 4–7; Tables 5, 8, 10, and 12).
- **Author interpretation:** ACM can act as a framework-independent governance layer between AgentOps/LLMOps and execution frameworks and can be extended to more ecosystems (Sections 8.3 and 10.4).
- **Not established:** production incident reduction, human audit time, industrial scale, complete semantic coverage for all frameworks, regulatory certification, or guaranteed safety after connecting ACM to MCP/A2A.
- **Bloss0m engineering judgment:** the most portable boundary is projection → governance kernel → runtime provenance, together with a reconstructable baseline. Adoption should make unsupported/approximated extraction an explicit release gate rather than treating a normalized graph as complete truth.

## Ablations, failure modes, and validity threats

This is not primarily a model-accuracy ablation paper. Its boundary analysis is closer to comparing frameworks, introspection regimes, change scopes, and scenarios involving invalid lifecycle transitions, missing dependencies, unauthorized runtime behavior, and configuration drift. Within the controlled scenarios, the paper reports that differences stay in projection and do not change the common kernel's governance outcomes (Sections 7.3–7.4; Section 9.5).

Three failure modes deserve attention:

1. **Projection loss:** a framework's dynamic or opaque semantics may not be fully extracted. ACM can mark them approximated or unsupported, but the label is not a repair.
2. **Model-scope omission:** the current model deliberately omits distributed execution, multi-agent planning, learning/adaptation, self-modifying execution, long-term memory, native MCP/A2A protocols, and collective negotiation (Table 13).
3. **Evaluation overreach:** the 27 scenarios are normative cases authored by the proposing team. The formal proofs cover monotonicity, convergence, termination, and least-fixed-point properties of the specified propagation semantics—not machine-verified correctness of the complete governance model (Sections 9.1–9.4).

The weakest inference would be: “the model converges on three controlled frameworks, therefore production governance is solved.” The evidence does not support that step.

## Artifacts and reproducibility

As of **2026-08-12**, the [arXiv v1](https://arxiv.org/abs/2608.11166) and [full HTML](https://arxiv.org/html/2608.11166v1) are accessible. The [official GitHub repository](https://github.com/audreyqvial/ACM) is publicly reachable, with HEAD `36d3d5ba20c2f4b652a4060a49874520653f746f`. Its `acm-project-scaffold` currently exposes the Python core, LangGraph/CrewAI/OpenAI Agents SDK adapters, 27 scenario fixtures, a pytest suite, and generated evaluation, impact, and preservation reports. The README also documents pytest and report-generation commands.

However, three claims must remain separate:

- **Endpoint usable:** the repository and scaffold files are accessible; the tests, fixtures, and reports are not empty links.
- **Artifact completeness:** the GitHub API metadata does not declare a license; optional framework dependencies, Python versions, and exact correspondence between the current HEAD and every paper table still need a local clone check.
- **Reproduction claim:** the README provides a path to attempt reproduction, but as of this check this is not a one-command, independently verified reproduction. There is also no production trace or external dataset for outside validation.

The smallest reproduction path is to clone the pinned HEAD, create a Python 3.11–3.13 virtual environment, install the core plus `pytest`/`pyyaml`, run `PYTHONPATH=. python -m pytest tests/ -q`, and then run `run_evaluation.py --repeat 10`. Cross-framework projection additionally requires the relevant optional framework dependencies and an explicit record of extraction status, missing/approximated constructs, and report version.

## Engineering decision: when to adopt it, and when not to

**Good fit:** you run multiple agent frameworks, prompts/tools/models evolve independently, releases must be auditable, runtime traces need to point back to exact configuration, or one shared dependency change can cross several workflow layers. Start with ACM's smallest boundary: ACI identity plus content digest, immutable baseline, typed dependency graph, projection status, and runtime provenance, then connect it to existing CI, evaluation, and observability pipelines.

**Do not apply it directly when:** the goal is agent planning, runtime learning, long-term memory, distributed consensus, MCP/A2A protocol semantics, production incident prevention, or regulatory certification. ACM lists these as uncovered. Treating a governance graph as execution safety would confuse “traceable” with “unable to fail.”

Before deployment, I would require three gates:

1. **Projection coverage gate:** every native construct has a preserved/approximated/unsupported status.
2. **Baseline gate:** each production promotion can reconstruct exact ACI revisions, dependency graph, and policy evidence.
3. **Runtime gate:** every runtime entity points to its governing revision; if event order, baseline, or replay semantics are not fixed, do not claim deterministic replay.

## Three things to remember

1. **Technical idea:** ACM governs versioned configuration across frameworks—not a single prompt, model, or runtime trace. Semantic projection connects native abstractions to a common governance kernel.
2. **Evidence:** three frameworks, 27 governance scenarios, and 9 impact cases produce consistent governance outcomes in the controlled scope; global-change impact and fixed-point metrics repeat, but inspection-scope reduction is not labor cost.
3. **Boundary:** this is a checkable reference model and partial artifact, not a production safety guarantee, universal standard, complete formal verification, or regulatory proof.

## Next reading

To connect ACM's configuration governance to runtime safety, read [AgentS4D: The Task Finished—Is the Runtime Safe?](/en/paper-reading/12-agents4d-runtime-risks/), which separates carriers, lifecycle, and unsafe-complete behavior. To examine trajectory detection and repair during execution, read [Real-Time Detection and Repair of LLM Agent Failures](/en/paper-reading/14-agent-trajectory-sentinel/). For platform governance context, compare [Enterprise Agentic AI Governance](/en/blog/39-enterprise-agentic-ai-governance/) and [Enterprise AI Agent Security](/en/blog/43-enterprise-ai-agent-security/).

## Primary sources

- [Paper: arXiv 2608.11166 v1](https://arxiv.org/abs/2608.11166)
- [Paper: full HTML](https://arxiv.org/html/2608.11166v1)
- [Official artifact: audreyqvial/ACM](https://github.com/audreyqvial/ACM)
