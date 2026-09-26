---
title: "Argus Deep Read: Long-Running Agents Need a Runtime, Not a Longer Prompt"
description: "A critical reading of Argus's Manager–Planner–Engineer–Reviewer runtime, durable state, verification-gated evolution, and rollback, separating benchmark results from author-operated case studies and unproven self-learning claims."
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "Argus frames long-running agents as a control-plane problem: preserve intent, revise operational objectives, verify outcomes, and roll back after failure."
  - "Manager, Planner, Engineer, and Reviewer operate over durable project state; memories, skills, procedures, and routing become persistent only after role-owned review."
  - "Across seven GPT-5.5 arenas, the report gives roughly 78% versus 59% for Direct Copilot on SWE-Bench Pro at 1.41x aggregate tokens, but the runtime, prompts, traces, and benchmark package are not public."
  - "The portable insight is the boundary around authority, provenance, verifiers, and rollback—not four agent prompts copied verbatim."
audience:
  - "AI engineers designing long-running agents, multi-agent orchestration, or auditable harnesses."
  - "Technical leads connecting task delegation, durable state, and verification gates to an enterprise AI platform."
tags: ["Paper Reading", "AI Agent", "Multi-Agent Systems", "Agent Runtime", "Evaluation", "Governance"]
image: "/paperReading/10-argus-agentic-runtime/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
  - tool-use-coding-agents
paper:
  title: "Argus: A General-Purpose Agentic Runtime for Long-Horizon Reasoning"
  authors:
    - "Boxiu Li"
    - "Zimo Wen"
    - "Yijia Fan"
    - "Junxiang Lei"
    - "Sufeng Guo"
    - "Jiaao Wu"
    - "Ruize Tang"
    - "Mukai Li"
    - "Yifei Shen"
    - "Xiaoyu Chen"
    - "Wanbo Zhang"
    - "Runjing Gu"
    - "Yifei Gao"
    - "Yuheng Wu"
    - "Xuyao Huang"
    - "Zelong Zhao"
    - "Jiachen Zhang"
    - "Shibo Hu"
    - "Hangxi Guo"
    - "Yilin Chen"
    - "Yuzhe Zhang"
    - "Fan Yang"
    - "Chuan Wen"
    - "Xian Zhang"
    - "Xuanhe Zhou"
    - "Zhijie Deng"
  year: 2026
  venue: "arXiv cs.AI technical report, v1 (2026-08-05)"
  links:
    pdf: "https://arxiv.org/pdf/2608.05144v1"
    arxiv: "https://arxiv.org/abs/2608.05144"
series:
  id: "multi-agent-coordination"
  title: "Multi-Agent Coordination"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** When autonomous agents execute complex, long-horizon tasks across hours or days, single-context prompts suffer from intent drift, context contamination, and premature declarations of completion; prompt histories alone provide no explicit task authority, auditable checkpoints, or atomic rollback boundaries.
- **Core insight:** Argus redefines long-horizon reasoning as a control-plane engineering challenge. By coordinating four specialized roles—Manager, Planner, Engineer, and Reviewer—over durable project state, the runtime ensures that memories, skills, procedures, and routing rules persist only after rigorous, role-owned verification, with all failure paths protected by versioned rollbacks.
- **Strongest evidence:** On a 731-task SWE-Bench Pro evaluation using a fixed GPT-5.5 backend, Argus achieved a 78% resolve rate compared to 59% for the Direct Copilot baseline at 1.41× aggregate tokens; across 466 independently reviewed tasks, structured revision loops rescued 34 tasks that would have otherwise failed (Figure 1, Figure 3, Section 5).
- **Main boundary:** This article covers an arXiv v1 technical report. As of August 2026, the authors have not released the official runtime implementation, model checkpoints, benchmark packages, or inspectable execution traces; furthermore, reported outcomes bundle roles, prompt policies, and retry harnesses without clean single-component ablations.

> This reading follows the arXiv v1 technical report (2026-08-05); Figures 1 through 4 are reproduced from the original paper.

## What to know first

Before examining Argus's internal machinery, it is helpful to clarify why previous approaches fail in long-horizon reasoning and what concepts underpin runtime orchestration:

1. **Failure patterns of long-horizon agents:** For complex tasks spanning software engineering, scientific research, or multi-step analysis, an agent's primary failure mode is rarely an inability to invoke individual tools. Instead, the failure stems from context degradation. As conversation history grows, models suffer from intent drift—substituting localized, trivial sub-goals for the user's primary objective—and treat intermediate, unverified scratchpad drafts as finished work. Even worse, failed attempts and buggy code snippets leak into memory, contaminating subsequent execution rounds.
2. **Why previous approaches are insufficient:** Traditional multi-agent collaboration frameworks rely heavily on chat-based interactions or conversational broadcasting. In such architectures, conversational history is conflated with system state. These systems lack formal authority boundaries, artifact provenance, deterministic verifiers, and transaction-like rollback boundaries. When one agent produces an invalid conjecture or faulty patch, that error enters the global conversation log, forcing subsequent agents to reason over noisy, hallucinated premises.
3. **Decoupling the control plane from the data plane:** In distributed systems, the data plane handles execution throughput while the control plane manages routing, policy enforcement, lifecycle state, and fault tolerance. Argus applies this principle to AI systems: model inference and tool invocations belong to the data plane, whereas intent preservation, operational contracts, verification gating, and state persistence must be governed deterministically by a runtime control plane.

## Core intuition

The conventional paradigm assumes that providing a longer prompt or larger context window will allow models to self-correct over time. Argus's central intuition is the opposite: **long-horizon reasoning requires an operating-system-like runtime state machine, not a longer prompt.**

The table below contrasts the decision mechanics of chat-based agents with the Argus runtime control plane:

| Dimension | Chat-Based Agents (Prompt History) | Argus Agentic Runtime (Control Plane) |
| :--- | :--- | :--- |
| **State Representation** | Unstructured conversational text and scratchpads | Typed, serializable durable project state |
| **Intent Management** | Original intent gets submerged by localized dialogue turns | Standing intent is decoupled from operational contracts |
| **Quality Assurance** | Execution agent self-declares completion | Independent Reviewer backed by deterministic verifiers |
| **Failure Recovery** | Additional prompt turns append instructions after errors | Snapshot rollback restores state; logs rejected routes |
| **Evolution Mechanism** | Unchecked conversational summaries written to memory | Skills, procedures, and routes admitted only after review |

Argus captures the user's overarching objective as an immutable "standing intent" while deriving bounded operational contracts—consisting of specific objectives, environmental constraints, and objective verification criteria—for each session. Even when an agent encounters dozens of failed tool invocations or intermediate bugs, the runtime prevents local errors from compromising the broader project state.

> **Huahua's engineering note**
>
> A long-running agent's “self-evolution” should first be an auditable state transition, not a freely generated prompt. Every new skill, memory, tool route, or objective revision needs an approver, an evidence boundary, and a rollback path.

## Walk one example through the method

To see how Argus operates in practice, consider a realistic software engineering workflow: "Fix a regression test failure in a large repository and update the release notes with an accurate summary."

1. **Input:** The user submits a problem description: "Fix the `test_kv_cache_eviction` failure and update the release notes with a concise bugfix entry."
2. **Intermediate representation and contract formulation:** The Manager locks the standing user intent and derives an operational contract $C = \langle I, O, K, V \rangle$. The objective $O$ specifies repairing the cache eviction algorithm and documenting the fix; constraints $K$ require preserving public API signatures and capping token expenditure at 50,000; verification criteria $V$ mandate passing the full regression test suite, zero linter warnings, and specifying the exact semver target in the release notes. The Planner then translates this contract into a directed acyclic graph (DAG): subtask A locates the bug and writes a patch; subtask B runs the test suite; subtask C edits the documentation.
3. **Decision or transformation:** The Engineer role is dispatched to execute subtask A inside an isolated sandbox. It searches the codebase, generates a Git diff artifact, and triggers the test harness in subtask B, creating structured event logs.
4. **Output and review gating:** All generated artifacts (the code diff, test execution output, and release notes markdown) are submitted to the Reviewer. Rather than trusting the Engineer's summary, the Reviewer executes deterministic validation checks: running the compiler, linter, and PyTest harness against the patched workspace.
5. **Likely failure point and rollback:**
   - *Failure scenario:* The Engineer's patch successfully resolves `test_kv_cache_eviction` but inadvertently introduces a race condition in `test_distributed_backend`, or records an incorrect release date.
   - *Traditional behavior:* A standard chat agent appends "that caused another test to fail, please fix it," often producing increasingly tangled diffs or dropping earlier context.
   - *Argus mechanism:* The Reviewer detects the regression, rejects the submission, and triggers an atomic snapshot rollback. The workspace is immediately reverted to the pre-mission clean state, while the failed patch, deadlock trace, and root cause are indexed as a "rejected route" in the project event log. When the Planner receives the task for a second iteration, it possesses explicit counter-evidence, allowing it to design an alternative strategy without repeating the same error.

## Technical mechanism

Argus's architecture rests on two complementary pillars: a four-role runtime topology and a review-gated evolutionary control cycle.

### Roles share durable project state, not chat history

**Figure 1** illustrates the system topology of Argus. Instead of arranging multiple models into an unconstrained multi-party conversation, Argus organizes agents around a typed, serializable "Shared Workspace State."

![Argus Figure 1: Manager, Planner, Engineer, Reviewer, and durable project state](https://arxiv.org/html/2608.05144v1/x1.png)

*Figure 1 — Argus runtime and evaluation breadth. Paper Section 2. Source: [Li et al., Argus Figure 1](https://arxiv.org/html/2608.05144v1#S2.F1), used under the paper's [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license.*

As depicted in Figure 1, the four roles fulfill strictly demarcated responsibilities (Section 2):
- **Manager (Top Authority & Contract Custodian):** Manages phase lifecycles, allocates token and time budgets, protects user standing intent, and holds exclusive authority to dispatch bounded missions and approve contract modifications.
- **Planner (Plan Generator):** Ingests current workspace state, event logs, and previously rejected routes to decompose complex goals into verifiable execution plans and dependency graphs.
- **Engineer (Sandbox Executor):** Operates within isolated sandbox environments to execute shell commands, edit files, or synthesize mathematical derivations, outputting concrete artifacts and tool execution traces.
- **Reviewer (Independent Gatekeeper):** Evaluates Engineer outputs against objective verification criteria and automated test suites, holding explicit veto authority to accept, request revisions, or demand rollbacks.

Crucially, the underlying **Durable Project State** consists of structured, persistent assets: Knowledge bases, Event Logs, Artifacts, Backlogs, Resource Budgets, background Daemons, and long-term Memory. Communication occurs via observable state mutations and event emissions rather than ephemeral dialogue strings.

### Recurrent role loops and review-gated state updates

**Figure 2** contrasts naive session resets with Argus's recurrent role loop mechanism.

![Argus Figure 2: runtime self-evolution from session reset to a recurrent role loop](https://arxiv.org/html/2608.05144v1/x2.png)

*Figure 2 — Argus's recurrent role loop and review-gated state updates. Paper Section 3. Source: [Li et al., Argus Figure 2](https://arxiv.org/html/2608.05144v1#S3.F2), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*

In standard practice, developers face an unappealing dilemma: either allow context windows to expand until inference degrades, or wipe the session clean (Session Reset) between tasks, discarding valuable environment understanding, debugging insights, and operational lessons.

In Section 3, Argus resolves this by defining an eight-stage cyclic control flow managed by the Manager:
1. **Contract Formulation:** Align standing intent, operational objectives, constraints, and acceptance criteria.
2. **Resource & Route Allocation:** Review accessible tool routes, available budget, and existing skill repositories.
3. **Mission Dispatch:** Assign bounded task slices to the Planner and Engineer.
4. **Execution:** The Engineer produces candidate artifacts in isolation.
5. **Result Inspection:** The Reviewer applies deterministic verification checks.
6. **Failure Handling & Rollback:** If verification fails, revert to the last stable snapshot and record the rejected route.
7. **Review Gating:** If verification succeeds, evaluate whether the solution yields reusable procedures, tools, or domain insights.
8. **State Admission:** Commit reviewed skills, routing heuristics, and procedural memory into durable storage.

Formally, let $S_t$ denote the project state at step $t$. The operational contract is defined as a tuple:
$$C_t = \langle I_{\text{standing}}, O_t, K_t, V_t \rangle$$
where $I_{\text{standing}}$ is the immutable standing intent, $O_t$ is the operational objective, $K_t$ represents environmental and computational constraints, and $V_t$ denotes computable verification criteria. The Engineer produces an artifact $A_t = \text{Engineer}(S_t, C_t)$, and the Reviewer evaluates it:
$$\mathcal{R}(A_t, V_t) \in \{\text{Accept}, \text{Revise}, \text{Reject}\}$$
Upon an $\text{Accept}$ judgment, the state machine advances: $S_{t+1} = \mathcal{T}(S_t, A_t)$. Upon $\text{Reject}$, the rollback operator $\rho(S_t)$ restores the system to $S_{\text{last\_valid}}$, and the error trace $\Delta_{\text{rejected}}$ is recorded into the event log. This mechanism prevents erroneous trial-and-error from poisoning the primary context, transforming negative outcomes into defensive assets.

## How to read the evidence

Argus reports evaluations across multiple benchmark suites. Interpreting these results requires examining control baselines, computational trade-offs, and methodological boundaries.

### Evaluation is not a single leaderboard: seven arenas with native verifiers

Rather than collapsing diverse capabilities into an arbitrary composite benchmark score (Section 2, Section 5), Argus evaluates performance across seven task-native arenas:
1. **SWE-Bench Pro:** Real-world software engineering issue resolution within containerized Docker environments.
2. **GPU Kernel Optimization:** PyTorch and Triton kernel tuning evaluated by H100 execution latency and compute throughput.
3. **nanochat Training:** Coordination of small conversational model training pipelines.
4. **nanoGPT Speedrun:** Distributed systems and training optimization tasks.
5. **AARRI-Bench:** Long-horizon tool invocation and multi-step reasoning benchmarks.
6. **Mathematical Data Synthesis:** Formal theorem proposition and automated proof generation.
7. **Paper Production Pipeline:** End-to-end research formulation, experimentation, and technical drafting.

Each arena utilizes domain-specific, deterministic verification mechanisms—such as unit test runners, compilers, CUDA profilers, or formal proof checkers. Consequently, these experiments demonstrate the architectural breadth of runtime control across heterogeneous domains, rather than an aggregated leaderboard ranking.

### 731-task SWE-Bench Pro and wave-level maturity gains

In the 731-task SWE-Bench Pro longitudinal evaluation (Section 5, using a uniform GPT-5.5 backend), Argus demonstrates substantial performance gains:

![Argus Figure 4: SWE-Bench Pro outcomes, review, and longitudinal efficiency](https://arxiv.org/html/2608.05144v1/x4.png)

*Figure 4 — Results, review, and wave-level efficiency for 731 SWE-Bench Pro tasks. Paper Section 5. Source: [Li et al., Argus Figure 4](https://arxiv.org/html/2608.05144v1#S5.F4), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*

Key experimental dimensions include:
- **Resolve Rate:** Argus achieved approximately **78%** resolve accuracy, outperforming the Direct Copilot baseline of **59%**.
- **Computational Overhead:** Argus consumed **1.41×** the aggregate tokens of Direct Copilot, demonstrating that improvements do not require an order-of-magnitude increase in compute.
- **Longitudinal Efficiency:** As illustrated in Figure 4, moving from early waves (W1–6) to mature waves (W19–22), Argus reduced input tokens per solved task by **21%** and shortened active workflow time by **15%**.

**Controls and confounding factors:** Readers should approach longitudinal trends with appropriate caution. The report notes that two incomplete waves were omitted from final calculations. Furthermore, because the baseline Copilot did not record wave-by-wave longitudinal traces, the evaluation cannot definitively isolate the effects of accumulated runtime state from potential task ordering biases or operator familiarity gains.

### Reviewers add token overhead, but provide genuine recovery boundaries

**Figure 3** provides an ablation-style analysis of review routing across the 731 SWE-Bench Pro tasks, offering valuable operational insight into cost-benefit trade-offs (Section 4).

![Argus Figure 3: review routing, revision, and verifier recovery](https://arxiv.org/html/2608.05144v1/x3.png)

*Figure 3 — Reviewer routing and recovery outcomes. Paper Section 4. Source: [Li et al., Argus Figure 3](https://arxiv.org/html/2608.05144v1#S4.F3), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*

The routing policy partitioned the 731 tasks based on risk and complexity:
- **466 tasks** were routed to an independent Reviewer agent.
- **265 tasks** were evaluated via Engineer self-review.

In terms of cost, routing to an independent Reviewer increased solve-input tokens by **2.75×** and active workflow time by **1.80×**. However, this overhead produced measurable recovery outcomes:
- Of the 466 reviewed tasks, **388** were accepted on the first pass.
- **43 tasks** received revision requests from the Reviewer.
- Among those 43 revised tasks, **34** subsequently passed the official benchmark verifier.
- Crucially, **22 tasks** represented "strict review-loop rescues"—tasks that Engineer self-review would have falsely accepted, leading to benchmark failure.

This evidence confirms that while independent review carries substantial token costs, it provides an indispensable safeguard against silent error propagation in high-stakes workflows.

### Paper-production traces: valuable case studies, not standardized benchmarks

Beyond standard datasets, the report documents six end-to-end paper production campaigns totaling **640 campaign hours, 576 Engineer rounds, 286 Reviewer revisions, 89 session rolls, and 16 stage rollbacks**.

In one **163.6-hour** trajectory, the runtime made seven early no-go decisions, pivoting an unsupported positive methodology claim into a rigorous audit study, followed by two late-stage rollbacks.

**Contextualizing this evidence:** These longitudinal traces showcase essential operational resilience—pruning dead ends, retaining counter-evidence, and dynamically scoping work. However, these author-operated campaigns cannot be equated with blind academic peer review. They function as illustrative case studies rather than objective, standardized benchmark evaluations.

## Evidence map

To maintain analytical clarity, the table and subsections below delineate verified empirical results from author interpretations and engineering synthesis:

| Category | Core Claims & Evidence | Conditions & Methodological Boundaries |
| :--- | :--- | :--- |
| **Direct paper evidence** | SWE-Bench Pro 78% vs 59%; Reviewer rescues 34 tasks; 21% token drop across waves; RWKV6 PR #1045 speedup | Evaluated under fixed GPT-5.5 backend in unreleased test environments; reflects full runtime composite |
| **Author causal claims** | Gains stem directly from four-role topology; wave efficiency proves agent operational "self-evolution" | Lacks isolated single-role ablations; cannot rule out task ordering or operator learning effects |
| **Unsupported claims** | Agent autonomously generalizes across unseen domains; four roles surpass alternative multi-agent topologies | Model weights remain frozen; no third-party replication due to lack of public code and trace bundles |
| **Bloss0m engineering synthesis** | Long-running agency reduces to a four-stage state machine; review routing should be risk-tiered; build minimal harnesses | Architectural abstraction is portable, but depends strictly on external verifier coverage |

### Direct paper evidence

The paper empirically demonstrates the following results:
1. In 731 SWE-Bench Pro tasks, Argus (GPT-5.5) achieved a 78% resolve rate versus 59% for Direct Copilot, consuming 1.41× aggregate tokens.
2. Across 466 reviewed tasks, the Reviewer issued 43 revision requests, enabling 34 tasks to pass official verification, including 22 strict loop rescues.
3. Longitudinal efficiency improved between early waves (W1–6) and mature waves (W19–22), reducing input tokens by 21% and workflow time by 15%.
4. A downstream operational artifact, [flash-linear-attention PR #1045](https://github.com/fla-org/flash-linear-attention/pull/1045), achieved measurable performance gains on NVIDIA H100 NVL hardware: RWKV6 forward time decreased from 0.199 ms to 0.168 ms, and forward-backward time fell from 0.900 ms to 0.747 ms.

### Author causal claims

The authors put forward the following causal arguments:
1. The specialized division of labor among Manager, Planner, Engineer, and Reviewer is the direct cause of superior long-horizon reasoning stability.
2. The accumulation of persistent state enables frozen-weight models to achieve operational "self-evolution," progressively improving problem-solving efficiency over time.
3. The Argus framework represents a general-purpose reasoning runtime suitable across diverse cognitive domains.

### Unsupported claims

Critical examination reveals that several claims remain unproven:
1. **Isolated role contribution:** The evaluation does not include clean single-role ablations (e.g., measuring performance without the Reviewer while keeping durable memory), leaving the exact contribution of individual components unverified.
2. **True model learning:** Because model weights remain strictly frozen throughout all experiments, efficiency improvements reflect external prompt and memory curation rather than intrinsic model learning.
3. **General-purpose generalization:** The reported arenas were managed and tuned by the authors, providing insufficient evidence that the system maintains equal efficacy across unseen domains without domain-specific engineering.

### Bloss0m engineering synthesis

Bloss0m translates these findings into practical architectural recommendations:
1. **Standardized state machine interfaces:** The primary transferable asset of Argus is not four persona prompts, but four distinct control-plane interfaces:
   $$\text{Standing Intent} \xrightarrow{\text{Manager}} \text{Contract} \xrightarrow{\text{Planner/Engineer}} \text{Artifact} \xrightarrow{\text{Reviewer}} \text{Verified State} \xrightarrow{\text{Engine}} \text{Admission / Rollback}$$
2. **Risk-tiered review policies:** Treat the Reviewer as a selective safety valve. Reserve independent reviewer models for high-impact, irreversible, or weakly tested tasks, while routing routine steps to lightweight self-review to mitigate the 2.75× token cost.
3. **First-class negative memory:** Persist rejected routes with explicit failure reasons, transforming unsuccessful paths into durable defensive constraints.

## Artifacts and reproducibility

Evaluating Argus for real-world adoption requires assessing artifact transparency and public accessibility:

- **Artifact availability:** As of **August 2026**, the paper remains an arXiv v1 technical report. The authors have **not publicly released** the official Argus runtime source code, system prompts, policy configurations, model checkpoints, full benchmark packages, or inspectable execution traces.
- **Downstream artifacts:** The referenced [flash-linear-attention PR #1045](https://github.com/fla-org/flash-linear-attention/pull/1045) is a verifiable, merged open-source pull request optimizing an RWKV6 Triton kernel. While this confirms that the runtime produced tangible engineering artifacts, the downstream PR does not make the underlying runtime reproducible.
- **Empirical verification status:** All performance numbers in this article, including the 78% SWE-Bench Pro resolve rate, represent author-reported results that await independent reproduction by the wider research community.

## Bloss0m engineering judgment and when not to use it

Based on this analysis, Bloss0m provides the following technical guidance for platform architects:

### When to adopt the Argus pattern

1. **Workflows with deterministic verifiers:** Environments featuring automated test suites, compilers, schema validators, or static analysis tools. Independent review gates provide high return on investment only when anchored by objective verification.
2. **Multi-hour workflows with severe failure costs:** Long-running repository migrations, large-scale data refactoring, or critical infrastructure automation where uncontained errors can corrupt global state.
3. **Compliance-critical systems:** Enterprise applications requiring complete provenance records, immutable audit logs, and clear ownership for every goal revision and tool invocation.

### When not to use it (anti-patterns)

1. **Subjective or unconstrained generative tasks:** For open-ended creative writing or marketing copy lacking deterministic verifiers, an independent Reviewer simply applies another model's arbitrary stylistic preferences, tripling token consumption without improving objective quality.
2. **Low-latency, interactive applications:** Single-turn assistants, chatbots, and real-time coding auto-completers cannot tolerate the multi-second latency and overhead imposed by multi-role coordination and verification gating.
3. **Superficial prompt mimicry:** Copying the Manager, Planner, Engineer, and Reviewer persona prompts into an unmanaged conversational loop without underlying snapshot rollbacks, durable event logs, and contract boundaries will only increase conversational noise.

### Incremental migration path

For teams seeking to adopt Argus's principles, we recommend an incremental three-phase roadmap:
- **Phase 1 (Contract Isolation):** Restructure agent inputs into four distinct fields—standing intent, operational objective, constraints, and verification criteria—preventing free-form text from overwriting core requirements.
- **Phase 2 (Snapshots and Rollbacks):** Implement automated sandbox snapshots prior to each tool execution. If tests fail, execute an atomic Git rollback and log the failure trace to a rejected routes registry.
- **Phase 3 (Selective Review Routing):** Implement a rules engine that escalates irreversible operations (e.g., database writes, production deployments) to an independent Reviewer model, while keeping low-risk steps on self-review.

## Three things to remember

1. **Technical core:** Long-horizon agency is fundamentally a control-plane problem, not a prompt-length limitation; managing execution through an auditable, four-role state machine with versioned rollbacks is essential for stability.
2. **Empirical evidence:** The 78% SWE-Bench Pro resolve rate demonstrates the power of review gating—rescuing 34 failed tasks—but incurs 1.41× overall and 2.75× review-specific token costs that require deterministic verifiers to justify.
3. **Adoption boundaries:** Without public source code or trace archives, do not attempt to replicate the unreleased prompts directly; instead, implement the four-stage contract interface and snapshot rollback mechanisms within verifiable internal workflows.

## Primary sources

- [Argus arXiv record](https://arxiv.org/abs/2608.05144): Official paper entry, authorship, and abstract.
- [Argus full report](https://arxiv.org/html/2608.05144v1): Complete technical report including Figures 1–4, SWE-Bench Pro experimental setup, and limitations.
- [flash-linear-attention PR #1045](https://github.com/fla-org/flash-linear-attention/pull/1045): Downstream RWKV6 Triton kernel optimization pull request discussed in the paper.
- [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/): Licensing terms governing paper text and figure reuse.
- [ContextWeave workflow memory evaluation](/en/paper-reading/09-contextweave-workflow-benchmark/): Deep read examining memory retrieval benefits and misleading-recall risks in long-horizon tasks.
- [Indirect Prompt Injection analysis](/en/paper-reading/42-indirect-prompt-injection/): Foundational analysis of untrusted inputs and control-plane vulnerabilities in autonomous agents.
