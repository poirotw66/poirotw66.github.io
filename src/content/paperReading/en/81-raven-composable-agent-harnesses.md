---
title: "Raven Paper Reading: How a Harness of Harnesses Plans Multi-Agent Work"
description: "Raven composes model–harness pairs as specialists and asks a Host Agent to plan a dependency DAG. This reading unpacks harness composition, the MAOB benchmark, and what its +10.4/+10.5 percentage-point result actually measures: graph planning match, not successful worker execution."
pubDate: 2026-10-01
updatedDate: 2026-10-01
tldr:
  - "Raven's composable unit is not a bare model, but an executable model–harness pair that includes tools, memory, skills, policies, context management, and recovery behavior."
  - "On 140 occupation-inspired MAOB tasks and two backbones, the authors report a 10.4- and 10.5-percentage-point exact-graph-match lead over the strongest baseline."
  - "MAOB scores the plan before workers run. It does not establish final task success, answer correctness, lower coordination cost, or universal multi-agent superiority."
  - "The engineering question worth retaining is how to validate specialist selection and dependencies while measuring planning quality separately from execution quality."
audience:
  - "Engineers building multi-agent orchestration, agent harnesses, or tool-execution platforms"
  - "Researchers evaluating agent benchmarks, workflow DAGs, and planner reliability"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Multi-Agent Systems", "Evaluation", "Systems Research"]
image: "/paperReading/81-raven-composable-agent-harnesses/title_image.webp"
field: "AI Systems"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
paper:
  title: "Raven: The Harness of Harnesses for Composable Agentic Intelligence"
  authors:
    - "EverMind AI"
  year: 2026
  venue: "arXiv:2609.33439 v1 (2026-09-27; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.33439v1"
    arxiv: "https://arxiv.org/abs/2609.33439"
    doi: "https://doi.org/10.48550/arXiv.2609.33439"
    code: "https://github.com/EverMind-AI/Raven"
    project: "https://arxiv.org/html/2609.33439v1"
series:
  id: "agent-orchestration-planning"
  title: "Agent Orchestration and Planning"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Adding agents to a workflow does not automatically make it more reliable. A host must choose specialists, split the work, order dependencies, and decide what can run in parallel. Otherwise, extra coordination adds calls, waiting, state synchronization, and failure modes.
- **Core idea:** Raven treats an executable model plus its harness as a specialist. The harness includes tools, context management, memory, skills, policies, and recovery behavior. A Host Agent uses the specialists' capability descriptions to produce a directed acyclic graph (DAG), which the runtime validates before dispatch.
- **Main evidence:** The authors build the Multi-Agent Orchestration Benchmark (MAOB), with 140 occupation-inspired tasks and reviewed reference DAGs. With Qwen3.8-27B and DeepSeek-V4-Flash-0731 backbones, Raven's exact graph match is reported to exceed the strongest baseline by 10.4 and 10.5 percentage points, respectively.
- **Critical boundary:** MAOB stops before workers are dispatched. It measures how closely specialist nodes and task dependencies match reference graphs—not whether workers complete the task, the final content is correct, or the total multi-agent cost is lower. The repository is marked pre-alpha, and no independent rerun was found.

The most useful question for this paper is not “Has Raven proved that multi-agent systems beat single agents?” It is: “If we compose specialists with different harnesses, what must the planner decide, and which layer does the benchmark actually measure?” Raven treats models, tools, and execution behavior as a single specialist unit. Its Host Agent produces a task graph with nodes, inputs, and dependencies; MAOB then measures whether that graph matches a reviewed reference. This separation has engineering value: planning can be measured before execution, but graph quality remains a precondition for system success, not a substitute for it.

This reading follows arXiv v1, submitted on September 27, 2026. The author field identifies EverMind AI; the inspected sources do not establish peer review or formal acceptance. The paper links a public Apache-2.0 repository, but its README labels the project pre-alpha. Inspectable code is not the same as an independent reproduction of MAOB.

> **Huahua's engineering note**
>
> A plausible-looking agent DAG does not mean the task is done. First ask where the benchmark's scoring boundary lies: if workers have not run, the score can support “the plan better matches a reference graph,” not “agent success improved.”

## Where prior approaches fall short: model choice and free-form delegation lack a checkable collaboration contract

Comparing foundation models alone hides differences introduced by tools, memory, skills, and failure recovery. But wiring several agents into free-form conversation also makes it hard to tell who owns each task, which outputs are prerequisites, and how to localize a failure. Another simple baseline is to launch every subtask in parallel. That fails when tasks depend on one another: even if both workers return, a workflow may still be wrong if implementation starts before requirements are verified. A fixed workflow makes ordering explicit, but may not adapt when different requests need different specialists.

These are design tensions Raven addresses; they are not evidence that every existing system cannot coordinate. Its proposed compromise is to register model–harness pairs in a capability directory, let a Host produce a dependency-aware plan for each request, and have the runtime check the contract before execution. This makes assignments and ordering more visible, but adds planning, graph validation, state tracking, and coordination costs. MAOB directly evaluates only the plan graph; it does not answer whether the full trade-off pays off after real execution.

## Core intuition: decide who does what and what it depends on before work starts

Think of Raven as a workshop with several specialist workbenches. Each bench is not just an expert (the model), but also the tools, operating rules, memory approach, and failure-recovery method around that expert (the harness). The Host receives a job, splits it into nodes, and draws which nodes must wait for which artifacts. The runtime checks that each node has an available workbench and that dependencies do not form a cycle before dispatch.

This mental model separates two quality questions. First: is the graph a sensible decomposition, with the right specialists and dependencies? Second: can the workbenches execute their nodes well, and does the final result pass acceptance? MAOB evaluates the first question against author-assembled reference graphs. Treating its exact-match score as an answer to the second question confuses planning quality with completion quality.

## From “choose a model” to “compose a specialist”

### Why the harness is part of the capability

When people discuss agents, a model name often stands in for capability. Yet the same model can behave like a different system when connected to different tools, memory, system prompts, skill loading, policy checks, and failure recovery. The paper calls this executable unit an **agent**: a pairing of a model and its harness. A specialist is therefore not merely “a model that can code” or “a model that can research.” It is a model exposed through a set of tools, context rules, and recovery mechanisms that a host can invoke.

This definition splits the architecture into two responsibilities. A specialist harness performs work within its domain. The Host Agent receives the broader request, chooses specialists, describes handoffs, marks dependencies, and coordinates after tool results or exceptions return. The Host is not just a chat moderator that sends prompts to several models; it plans within a system that has a capability registry, execution constraints, and resource budgets.

Figure 2 places this idea in Raven's proposed ecosystem: model–harness pairs expose different executable capabilities, a Host Agent constructs a collaboration graph, and a runtime executes it afterward. The figure describes the authors' architecture. It is not an MAOB success-rate result, nor evidence that every specialist shown received the same level of validation in the benchmark.

![Original paper Figure 2: Raven places model–harness specialists, a Host Agent planning layer, and composable task graphs in one architecture.](/paperReading/81-raven-composable-agent-harnesses/figures/figure-2-raven-ecosystem.svg)

*Original paper Figure 2, reused unmodified. Source: [Raven v1, Figure 2](https://arxiv.org/html/2609.33439v1#S2.F2), © EverMind AI, CC BY 4.0. It depicts the system concept; see the MAOB results below for measurements. The architecture alone implies no performance result.*

### Represent work as a DAG, not a pile of parallel prompts

Suppose a user asks for a security review of an open-source agent project, a change to a configuration example, and an operations handoff. In Raven's representation, the Host can plan research, coding, content, or on-call work nodes. Some may run in parallel; others must wait for an earlier artifact. The deliverable is not a set of disconnected model replies, but a task graph of nodes, inputs, outputs, and dependencies.

A simplified DAG is $G=(V,E)$: $V$ is the set of specialist work nodes, and $E$ marks a dependency. If a research node $v_r$ first produces verified findings, coding node $v_c$ and documentation node $v_d$ can consume them; a final integration node $v_f$ waits for both. Whether $v_c$ and $v_d$ can run in parallel depends on their actual inputs—not on the Host's intuition that “more agents must be faster.”

That is why Raven's benchmark does not only ask whether the planner picked the right specialist categories. If a task requires diagnosis, then modification, then verification, choosing all three kinds of specialist but ordering them incorrectly may still yield an unusable plan. Conversely, reference edges do not necessarily define the only valid plan: some work can be done in more than one valid order. The paper therefore reports node, edge, partial-order, and exact-graph metrics. Its graph comparison uses accepted partial-order relations rather than requiring every raw edge string to match.

## Method flow: from a user request to a checkable execution outcome

The system path described in the paper can be reconstructed in this order. This is Raven's architecture flow, not evidence that workers completed the MAOB tasks:

1. **Read the request and capability registry:** The Host receives the task and descriptions of registered specialists. The system stage-loads a concise orchestration guide; it loads the full guide only when it determines that a multi-agent graph is needed.
2. **Choose specialists and decompose the work:** The Host turns the request into nodes, assigning an agent, summary, prompt template, inputs, and optional shared execution context. Nodes represent work; they should not merely copy one prompt to several models.
3. **Express dependencies and resource limits:** The Host connects tasks that have prerequisites into a DAG. It preserves parallelism where possible while respecting the execution environment, budget, and approval conditions.
4. **Planning admission/preflight:** The runtime checks schema, unique IDs, cycles, dependency and path references, agent registration/enabled state, and capability. It returns a locatable rejection before execution on failure, without starting partial workers.
5. **Dispatch ready nodes:** Only nodes whose dependencies are complete, whose verdict state permits execution, and for which a concurrency semaphore has capacity can run. Each specialist executes its own harness and returns outputs and artifacts to the runtime.
6. **Judge state, retain artifacts, handle exceptions:** A judge provides a workflow verdict from the prompt, output, and transcript tail; the runtime updates node state. Completed artifacts can be referenced downstream, while exceptions return to the Host to continue, stop, or replan.
7. **Integrate and verify:** The Host may synthesize node artifacts, but final quality still needs a verifier, test, or human approval appropriate to the task. The MAOB planning comparison stops around step 3; it does not establish worker outcomes for these 140 tasks.

Aligning this flow with the benchmark shows that each stage answers a different question. Graph nodes and edges can measure whether the Host understood the task structure; admission can measure whether a plan follows an executable contract; node completion and a verifier concern work outcomes. A score from an earlier stage cannot stand in for evidence from a later one.

### Planning admission: the runtime does not blindly execute the Host's plan

The boundary between Raven planning and execution is easy to blur into the claim that it “automatically finds experts to collaborate.” The Host first proposes task nodes, the specialist for each, a summary, prompt template, dependencies, inputs, and optionally a shared instance. Before dispatch, the runtime checks the plan's format and schema, node-ID uniqueness, graph cycles, dependency references, path references, and whether the required agent is registered, enabled, and capable. An invalid plan receives a focused rejection at the first error. The admission stage does not start some workers only to discover later that the overall graph cannot run.

![Original paper Figure 4: Raven sends the Host's collaboration graph through planning admission and preflight checks before execution.](/paperReading/81-raven-composable-agent-harnesses/figures/figure-4-planning-admission.svg)

*Original paper Figure 4, reused unmodified. Source: [Raven v1, Figure 4](https://arxiv.org/html/2609.33439v1#S3.F4), © EverMind AI, CC BY 4.0. It illustrates plan admission and validation, not benchmark accuracy.*

The value is not that schema validation guarantees a correct plan. It is that some errors can be rejected before expensive work begins. Cyclic dependencies, an unregistered specialist, an invalid ID, or an unsupported capability should be caught early. By contrast, “Should this task really go to a coding specialist?” or “Is the research sufficient to justify the change?” are semantic and objective-correctness questions that structural validation cannot answer.

### How node states and exceptions remain visible in the graph

During execution, nodes can move through states such as pending, running, completed, exception, failed, skipped, or cancelled. A node normally becomes runnable only after its dependencies have completed and the relevant verdict has settled. Later nodes can reference completed artifacts, and finished work can be retained rather than rerun whenever the plan is reconsidered. On an exception, the Host may continue, abandon the work, or replan. Exceptions are therefore explicit coordination states rather than details hidden in a long transcript.

Still, a node marked **completed** is not necessarily objectively successful. Raven's completion judge examines the rendered prompt, output, and transcript tail to decide whether a node is complete. It is a runtime control signal, not an external ground-truth oracle. The paper also describes a fallback when the judge times out or fails, which can mark a normal-response path complete. This fault tolerance prevents the whole workflow from stopping when the judge is unavailable; it also means completion status cannot be treated as proof of quality. High-impact nodes involving files, deployment, security, or other sensitive actions still need independent tests, artifact checks, permission boundaries, or human approval.

![Original paper Figure 5: Node states, dependency release, completion judgment, and Host handling of exceptions.](/paperReading/81-raven-composable-agent-harnesses/figures/figure-5-node-lifecycle.svg)

*Original paper Figure 5, reused unmodified. Source: [Raven v1, Figure 5](https://arxiv.org/html/2609.33439v1#S3.F5), © EverMind AI, CC BY 4.0. It depicts the runtime lifecycle. “Completed” is a control-flow state, not independently verified correctness.*

## What does MAOB measure?

### 140 occupation-inspired tasks across four specialist domains

The Multi-Agent Orchestration Benchmark (MAOB) is the paper's central evaluation of Host planning. It contains 140 occupation-inspired scenarios drawn from 137 occupations, with human-reviewed specialist nodes and reference dependency graphs. The four main domains are research, coding, content production, and on-call execution. Each scenario averages about 2.72 nodes and 1.84 dependency edges. The authors also report the distribution of tasks spanning two, three, or four domains, with both serially ordered and parallel-admissible cases.

The benchmark is designed to compare plans before execution. It does not have a group of agents complete every task and then ask reviewers to judge the work products. Instead, a request goes to a planner, which proposes specialist nodes and relations; those are compared with a reviewed reference structure. This makes the subproblem of task decomposition measurable at a manageable cost. At the same time, similarity to a reference graph is only one measure of planning quality.

![Original paper Figure 12: MAOB task-domain composition and the structure of its reference workflow graphs.](/paperReading/81-raven-composable-agent-harnesses/figures/figure-12-maob-composition.svg)

*Original paper Figure 12, reused unmodified. Source: [Raven v1, Figure 12](https://arxiv.org/html/2609.33439v1#S4.F12), © EverMind AI, CC BY 4.0. It summarizes MAOB task and graph composition. The benchmark was created by the paper's authors, not sampled independently by an external organization.*

The authors begin with patterns extracted from public occupational task collections, create templates and candidate graphs, fix a reference graph first, then generate request text backward with GLM-5.2. Claude Opus 5 participates in reference-graph construction, followed by leakage filtering and review. Fixing the graph before writing the request helps avoid giving a planner an explicit sequence to copy; it also means the benchmark target structure is defined up front by the authors' process. Automatic lexical filters cannot rule out every paraphrased planning cue, and graph-first construction does not prove that a reference graph is unique or fully appropriate.

The authors describe automated quality checks and expert review of reference nodes, partial orders, and attribution. That is stronger than using entirely unchecked synthetic graphs, but several boundaries remain. The dataset and reference graphs come from the authors' design process; the inspected material does not establish an external study of annotator agreement across the complete graph set; and a task may admit multiple equally reasonable decompositions. Accepting partial orders handles some valid ordering variation, but it does not automatically cover every reasonable choice of node abstraction or alternative plan.

### Four graph metrics answer different questions

- **Node F1:** Did the planner select the important specialist work nodes in the reference? This asks *what work* to do, not its order.
- **Edge F1:** How many predicted dependency edges align with reference dependencies? This asks about explicit links, but can be sensitive to representation and equivalent ordering.
- **Partial-Order Accuracy (POA):** Do the predicted ordering relations between node pairs match an accepted partial order? Independent tasks need not be forced into a sequence.
- **Exact Match:** Does the overall node set and accepted partial-order structure match the reference for a task? It is a strict graph-level metric, but not execution success.

The denominators need not all be 140. Node- or edge-level scores are computed over evaluable elements; task-level exact match asks whether a whole graph matches. Readers should retain each metric's definition and scoring unit rather than calling every number a “task success rate.”

## The +10.4/+10.5 points: a planning result, not an end-to-end win rate

The authors compare Raven, Claude Code, and Hermes Agent on the same tasks and delegation instruction, using two backbones: Qwen3.8-27B and DeepSeek-V4-Flash-0731. Each system retains its native orchestration interface, while domain details are exposed through its corresponding interface. This paired design avoids giving Raven a stronger model and a baseline a weaker one, then attributing the entire difference to the harness. System interfaces still differ, however, so the result reflects the full planning method and its paired implementation—not an environment-free, single-variable test of an abstract algorithm.

![Original paper Figure 13: MAOB node, edge, partial-order, and exact graph-match metrics for Raven and baselines on two backbones.](/paperReading/81-raven-composable-agent-harnesses/figures/figure-13-maob-results.svg)

*Original paper Figure 13, reused unmodified. Source: [Raven v1, Figure 13](https://arxiv.org/html/2609.33439v1#S4.F13), © EverMind AI, CC BY 4.0. These are author-reported planner-only MAOB metrics; exact-match percentage-point differences are not final task-success gains.*

With Qwen3.8-27B, Raven's exact match is 0.711 versus 0.607 for the strongest baseline, a 10.4-percentage-point difference. With DeepSeek-V4-Flash-0731, Raven is 0.867 versus 0.762, a 10.5-point difference. The paper also reports Raven leading on all four MAOB graph metrics in those two settings. The supported conclusion is that, on this MAOB, with these prompts, backbones, and comparison implementations, Raven more often produced a plan graph that matched the scored reference.

The result does **not** support broader claims that Raven increased end-to-end task success by ten points, improved quality of completed multi-step workflows, reduced worker failures, lowered total tokens or latency, or that any model–harness pairing gets the same gain. MAOB did not dispatch workers in this comparison; execution quality and planning score are different observables.

## Worked example: walk the full method from “configure website security” to a checkable graph

The following is a **teaching example written to explain DAG construction. It is not an MAOB task from the paper or a case measured by Raven.** Suppose a request asks for a website security control to be enabled, with a change record and rollback plan. The Host first needs to know what specialists exist in the registry—for example, documentation research, code/configuration changes, testing, and operations review. A reasonable graph might be:

1. **Research and verify the specification:** Inspect the current architecture, vendor documentation, environment differences, and constraints; produce sourced requirements.
2. **Plan the change:** Based on verified requirements, identify settings to change, impact scope, and rollback steps. This node depends on research.
3. **Prepare the configuration and examples:** Make the change in a controlled environment. A coding specialist's ability to edit files must not imply production write access.
4. **Test and operations review:** Check the new configuration and existing behavior, including rollback on failure. This depends on the change artifact, while some documentation work can proceed in parallel.
5. **Integrate the handoff:** Give the user evidence, the diff, test results, and remaining risks.

The graph can be written as $v_1 \rightarrow v_2 \rightarrow v_3 \rightarrow v_4 \rightarrow v_5$, with independent documentation or test preparation running alongside where inputs allow. Whether an agent may perform the actual deployment is a permission and approval policy; it should not be implicit in a dependency graph. This example shows how a DAG makes ordering explicit, but it does not answer whether a source is trustworthy, a change is safe, or someone authorized the write.

Read through Raven using three distinct layers: **planning**, which asks whether the required work and dependencies were selected; **admission/runtime**, which asks whether the structure is executable and the capabilities are registered under the applicable budget and approval boundary; and **execution/verification**, which asks whether the work actually ran and passed its tests. MAOB primarily measures the first layer. The paper discusses runtime design for the second. This does not mean MAOB verified the third.

## Evidence map: paper claims, measurements, inference, and what remains unproven

| Evidence layer | What this reading can say | What it should not become |
| --- | --- | --- |
| **Direct MAOB comparison** | On the authors' 140 tasks and two paired backbones, Raven leads the compared systems on reference-graph metrics; exact match is +10.4/+10.5 percentage points. | Raven's end-to-end task completion rose by ten points, or its final outputs were more correct. |
| **System design** | Raven treats a model–harness pair as a composable specialist; the Host plans a dependency DAG and the runtime checks its structure and agent capabilities before dispatch. | Schema preflight determines semantic correctness, source reliability, or final-artifact quality. |
| **Theoretical analysis** | Under the paper's assumptions about complementary capabilities and a shared resource budget, composition can expand reliable task coverage, with planning and operation errors included in conditional bounds. | Theory proves any multi-agent system always beats a single agent or provides empirical MAOB success rates. |
| **Other author-reported component results** | The paper also discusses specialist execution, harness evolution, and skill reuse; some results build on earlier HarnessBank and SkillCorpus work and should be separated from the new MAOB comparison. | Every component result is a new MAOB experiment or independent replication. |
| **Bloss0m engineering interpretation** | A multi-agent platform can record the plan, admission/rejection reasons, node states, and artifact provenance, then evaluate execution success and cost in a separate stage. | This is a production policy validated by Raven or a universal standard. |

The theory section is worth reading, but its conditional propositions should not be turned into a universal slogan. The Host-level reliability proposition can be summarized as:

$$
p_{S_H}(t;B)\geq(1-\eta_H(t;B))(1-\bar{\epsilon}(t;B)).
$$

$p_{S_H}(t;B)$ is the probability that the composed Host system delivers an outcome accepted by the task verifier under a common budget $B$; $\eta_H$ bounds the risk that the Host fails to select a valid plan; and $\bar{\epsilon}$ bounds accumulated failure risk across nodes and handoffs in a valid plan. This lower bound requires a valid plan with compatible handoffs, operations that satisfy their contracts, a feasible budget, and a lower bound on the Host's probability of finding a valid plan within that budget. The theory accounts for planning and coordination costs rather than treating them as free. It does not say that merely adding specialists to a DAG yields gains: wrong assignments, decomposition cost, waiting, and handoff errors can erase any benefit. It analyzes how composition *may* expand reliable coverage under stated conditions, not a multi-agent law empirically established for every task ([Sections 2.4–2.6](https://arxiv.org/html/2609.33439v1#S2)).

## Raven's full system also includes harness evolution, memory, and skill reuse

MAOB is the focus here, but Raven is not just a DAG planner. Its broader design has three related components whose evidence must still be kept separate:

1. **Harness self-evolution:** The task model remains frozen; model weights are not updated. Execution traces are used to diagnose failures, after which an Evolver Agent proposes harness candidates that modify prompts, knowledge, runtime, or configuration. Candidates pass validity, activation, and paired-gain screening before entering a gene bank organized by failure pathology, and the selected candidate is compared on held-out tasks. This method builds on earlier HarnessBank work. Section 7.2 explicitly labels the cross-benchmark results as reported published HarnessBank experiments; they should not be described as a new, independent Raven rerun in this paper.
2. **EverOS long-term memory:** Interactions are segmented into episodes and consolidated into atomic facts, time-bounded foresight, and provenance metadata; user memory and agent execution cases take separate paths. Completing an artifact can release DAG dependencies while memory extraction continues asynchronously. Current task artifacts and experience that may be reused later are therefore distinct, with source and session context retained.
3. **Skill Forge:** The system retrieves procedures for current work from a curated SkillHub catalog, local skills, and EverOS agent cases; it also turns execution experience into skills that may be used or revised later. The catalog and retrieval stack are linked to the earlier SkillCorpus work. A structurally valid skill update or high confidence alone does not prove improved task performance; that effect requires separate skill evaluations with model and harness conditions controlled.

The paper also evaluates Raven-Research, Raven-Code, Raven-Design, Raven-Oncall, and skill retrieval separately; those results are not MAOB planning scores. The system can be understood as three paths—composing capabilities, adapting execution policies from experience, and reusing information across tasks—but each path uses different benchmarks, baselines, source versions, and cost accounting. In particular, group memory is disabled by default and not evaluated in this report. The authors also state that memory verdicts may be wrong, records do not expire, and worker-native writes are not reviewed ([Sections 3.3–3.4 and 4–7](https://arxiv.org/html/2609.33439v1#S3)).

## What is still needed to move from planning metrics to system evaluation?

MAOB makes one intermediate question measurable, but leaves a planner-to-execution gap. To establish that a multi-agent system is actually better than a single agent, graph scoring must connect to post-execution task utility rather than stop at graph similarity. A follow-up evaluation could fix the task set and models, then record for each plan:

- whether the task completed and whether an independent test or blind review accepted the output;
- which specialist nodes succeeded, failed, retried, or were cancelled, and how exceptions propagated downstream;
- tokens, wall-clock time, API/GPU cost, and queueing for agents, tools, and judges;
- artifact provenance, source dependencies, write permissions, rollback state, and human approvals;
- whether tasks have multiple valid DAGs and how scoring treats equivalent plans;
- ablations against a single agent and a fixed workflow, so only increasingly complex systems are not compared with each other.

These are proposals for extending MAOB, not measurements already completed by the Raven paper. Planner metrics can remain in place to evaluate the planning layer. To measure system value, workers must actually run, outcome reviewers should be independent of planning, and coordination costs must be counted. Reporting the two layers side by side would reveal whether plans closer to the reference more often produce good outcomes—or merely resemble the decomposition preferred by benchmark authors.

## Artifacts and reproducibility: code exists, but version and data still matter

Raven has a public [GitHub repository](https://github.com/EverMind-AI/Raven) under Apache-2.0. As of this reading, the repository labels the project **pre-alpha**. It lets readers inspect code, interfaces, and examples, which is more inspectable than a proposal containing only architecture diagrams. It is still maintained by the author organization and is not independent validation. Repository demos and later updates also cannot automatically be assumed to be the exact implementation behind MAOB in arXiv v1.

Reproducing MAOB would require the same 140-task inputs, reference DAGs, model and harness versions, system/delegation prompts, inference settings, native interfaces, scoring code, and run records. Even if all were public, reference-graph annotation and judgments about accepted partial orders would need to be auditable. This reading verified a public repository and project documentation, but did not find a clearly identified release containing a complete frozen MAOB task set, annotation-review record, run-level outputs, and costs. Nor did it find an independent external rerun. The calibrated statement is: “There is an Apache-2.0 code repository; an independent reproduction and a complete benchmark artifact were not verified”—not “the paper is impossible to reproduce” or “the result has been validated.”

Original paper figures in this article come from arXiv v1, whose page lists CC BY 4.0. The figures are reused unmodified, with source and license identified below each. Their inclusion shows architecture, benchmark composition, and author-reported results; it does not mean this site independently verified the experiments.

## Bloss0m engineering judgment: treat “the task graph is valid” as gate one, not final acceptance

The practical takeaway is to observe multi-agent orchestration in distinct stages. My engineering interpretation is to persist the Host's plan manifest, check node uniqueness, dependency completeness, capability availability, and execution permissions, then separately record dispatch, node state, artifact provenance, retries/cancellations, and final verifier outcomes. This can distinguish “the plan omitted a dependency,” “the chosen agent lacks a capability,” “the worker produced nothing,” “the judge accepted a bad result,” and “the output failed verification”—instead of leaving only an agent's assertion that it finished.

If a system writes to external services, deploys, pays, or changes production configuration, a valid graph is not enough to authorize the action. Bind tool permissions to task nodes, require explicit approval for high-impact operations, avoid relying solely on a Host's or worker's self-assessment, and preserve completed artifacts, side effects, and compensation/rollback state after failure or cancellation. These controls are engineering recommendations inferred from the paper's architecture boundaries, not Raven security guarantees measured by MAOB.

Conversely, do not introduce multiple agents just because the DAG looks elegant. If specialists overlap, handoffs are hard to verify, context/API costs are high, or the task is one continuous reasoning process, a single agent or fixed workflow may be more stable. Raven offers a composable design and a planner benchmark. Whether it belongs in a deployment still needs testing on your own tasks, models, tools, cost budget, and failure consequences.

## Seven teach-back questions

1. **What is Raven's composable unit?**
   Not a bare model, but a model paired with an executable harness, including tools, context, memory, skills, policies, and recovery behavior.
2. **What does the Host Agent do?**
   Given the task and specialist capabilities, it proposes work nodes, inputs, and a dependency DAG; the runtime then checks structure and capabilities. It is not simply free-form model group chat.
3. **What does MAOB measure?**
   On 140 author-created, reviewed occupational scenarios and reference DAGs, it measures which specialist work is selected and how its partial order/graph agrees with the reference.
4. **What do +10.4/+10.5 percentage points mean?**
   The exact graph-match difference between Raven and the strongest baseline in each of two backbone settings. They are not differences in task completion, answer quality, or worker execution success.
5. **What can planning admission guarantee?**
   It can reject checkable structural issues before dispatch—schema, IDs, cycles, dependency references, or agent capabilities. It does not establish that the semantic goal, data, or final answer is correct.
6. **What is the biggest validity limitation?**
   MAOB scores plans before workers run and uses author-created tasks and reference graphs. The reported comparison covers two backbones and has no verified independent rerun.
7. **What would be needed to show Raven improves real work?**
   Run the workers; add independent task-quality evaluation, cost/latency, failure and retry tracking, valid alternative DAGs, and single-agent/fixed-workflow baselines, while fixing data, versions, and prompts.

## Three things to remember

1. **Architecture:** A specialist is a model plus harness; the Host composes capabilities with a DAG, and the runtime checks whether the plan may enter execution.
2. **Evidence:** Raven's MAOB exact-graph-match lead is 10.4/10.5 percentage points across two backbones. It measures plan-to-reference matching, not task completion.
3. **Evaluation:** A planner-only benchmark is a useful intermediate layer. A claim that multi-agent systems work better still needs worker execution, independent verification, cost, failures, and valid-plan diversity.

## Further reading

- [LLM Agents Can Easily Tamper With Their Own Traces](/en/paper-reading/77-llm-agents-can-easily-tamper-with-traces/): external observation and auditability in agent systems, complementary to Raven's Host/runtime state boundary.
- [Completed Pairs Hide Capped Failures](/en/paper-reading/79-completed-pairs-capped-failures/): how evaluation-runner behavior shapes visible outcomes; useful alongside MAOB's scoring unit and pre-execution boundary.
- [The RAT: A Unified Bayesian Model for RAG Evaluation](/en/paper-reading/70-rat-unified-bayesian-rag-evaluation/): another study that makes uncertainty and scoring layers explicit in system evaluation.

## Primary sources

- EverMind AI, [Raven: The Harness of Harnesses for Composable Agentic Intelligence (arXiv v1)](https://arxiv.org/html/2609.33439v1), submitted 2026-09-27. This reading draws primarily on Sections 2–7, Appendices A–C, and Figures 2, 4, 5, 12, and 13; all reported numbers are author-reported.
- [Raven GitHub repository](https://github.com/EverMind-AI/Raven), Apache-2.0; README marked the project pre-alpha as of 2026-10-01. It is a first-party artifact, not an independent replication.
