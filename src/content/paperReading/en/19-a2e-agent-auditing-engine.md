---
title: "A²E: A Traceable, Re-Evaluable Engine for Agent Auditing"
description: "A deep reading of A²E: ATP aligns benchmarks with agent harnesses, span-based traces preserve execution causality, and lifecycle-aligned metrics analyze correctness, tools, cost, and safety."
pubDate: 2026-08-11
updatedDate: 2026-08-11
tldr:
  - "A²E does not claim that one agent framework is universally stronger. It argues that the same model can produce different tool, state, and cost behavior across harnesses, so evaluation must preserve the full trajectory."
  - "It separates Task, Monitor, and Evaluation: ATP aligns benchmarks with harnesses, OpenTelemetry-style spans preserve execution structure, and a database allows existing traces to be rescored with new metrics or judge versions."
  - "The 1,035 scored runs in Table 1 and the case study in Table 2 are diagnostically useful, but sample size, model and endpoint details, judge calibration, and an internal table inconsistency limit strong cross-harness claims."
audience:
  - "AI engineers responsible for agent evaluation, observability, platform governance, and benchmark harnesses"
  - "Technical leads who need correctness, tool use, latency, token cost, and safety in one auditable execution record"
tags: ["Paper Reading", "Agent Systems", "Evaluation", "Observability", "AI Engineering"]
image: "/paperReading/19-a2e-agent-auditing-engine/title_image.webp"
field: "AI Engineering"
difficulty: "intermediate"
showToc: true
paper:
  title: "An End-to-End Agent Auditing Engine"
  authors:
    - "Haoning Wang"
    - "Mingxun Zhang"
    - "Chenyue Yu"
    - "Yingjun Shang"
    - "Xia Hu"
    - "Guanchu Wang"
    - "Na Zou"
  year: 2026
  venue: "arXiv 2608.07346 v1 (2026-08-07; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.07346v1"
    arxiv: "https://arxiv.org/abs/2608.07346"
    code: "https://github.com/datamllab/A2E"
series:
  id: "agent-auditing"
  title: "Agent Auditing"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** A correct final answer does not tell you whether an agent took a reliable, cheap, or safe path. A wrong answer does not tell you whether the failure came from planning, tool use, memory, judging, or runtime. When each harness stores its own text log, cross-framework comparison and later metric iteration become difficult.
- **Core insight:** A²E separates Task, Monitor, and Evaluation. The Agent Task Protocol (ATP) separates benchmark tasks from harness execution; the Monitor turns model calls, tool calls, state, and errors into parent-child traces; Evaluation organizes process, outcome, and runtime metrics under one lifecycle-aligned taxonomy.
- **Strongest evidence:** The experiment covers 23 benchmarks, 9 harnesses, 5 tasks per cell, and 1,035 scored runs while holding the DeepSeek-V4-pro FP4 backbone, inference configuration, tool setup, step limit, and timeout fixed. Section 6 reports success-rate gaps of 0.20 on GDPVal, 0.30 on MMLU-Pro, and 0.66 on tau³-bench.
- **Main boundary:** This is a platform architecture and diagnostic demonstration, not a universal ranking of nine harnesses. The prose and displayed `task_succeeded`/`correctness` values in Table 2 conflict; paper commit, judge calibration, API drift, and component-level ablations are not fixed enough for strong causal claims.

## What to know first

Agent evaluation has at least three distinct questions:

1. **Outcome:** Was the final answer correct, and did the task reach a valid terminal state?
2. **Process:** How did the agent plan, call tools, use memory, and deviate from the goal?
3. **Runtime:** How many tokens, seconds, and dollars did it consume, and did it exhibit safety or prompt-injection risk?

Recording only the final answer loses process and runtime. Recording a flat log loses causal structure. A²E's choice is to store a run as a TaskTrace and describe model calls, tool invocations, and workflow operations with an ordered span tree and parent-child relations. This connects to Bloss0m's [OSWorld-style agent evaluation deep read](/en/paper-reading/08-osreward-agent-evaluation) and [Agent Trajectory Sentinel deep read](/en/paper-reading/14-agent-trajectory-sentinel): the former shows how evaluation protocols can shape behavior, while the latter treats the trajectory as a surface for runtime failure detection.

## Why the previous approach is insufficient

Compressing an agent trajectory into a final-answer score hides tool choice, state accumulation, failure location, and runtime cost. Keeping separate flat text logs for each framework also makes comparison and re-evaluation difficult. A²E's prior limitation is the absence of a shared lifecycle-aligned observation and evaluation schema, not merely a shortage of scores.

## Core intuition

Traditional benchmarks often compress an agent run into one number: success is 1, failure is 0. In platform engineering, two runs with the same score can be very different. One may finish in three turns with four LLM calls and three tool calls; another may spend ten times the tokens and still fail. A²E's mental model is:

**Task creates a comparable input → Monitor records a causal trajectory → Evaluation projects that trajectory into multiple metrics.**

The most important separation is that re-evaluation does not require re-running the agent. Once TaskTrace records and spans are stored structurally, a new metric, judge model, or aggregation policy can read the existing database records. Expensive agent execution is decoupled from cheaper metric iteration.

> **Huahua's engineering note**
>
> A trace is not “all text in a database.” It should answer which action was triggered by which model call, how long it took, what happened, and which metric version later re-evaluated it. Without parent-child links, versions, and run metadata, log volume is not auditability.

## Walk one example through the method

Start with the paper's tau³-bench case study, but do not treat its table as an error-free ground truth. The same GLM-5.2 API model, task, and initial environment produce two very different trajectories under LangGraph and CrewAI:

1. **Input:** The same customer-support task asks the agent to diagnose a suspended line and follow the payment-based recovery path.
2. **Trace:** The LangGraph path records 3 turns, 4 LLM calls, 3 tool calls, and 10,122 total tokens. The CrewAI path records 5 turns, 9 LLM calls, 5 tool calls, and 96,704 total tokens.
3. **Decision path:** LangGraph checks status, reseats the SIM, verifies that the signal remains unavailable, and shifts to account-level diagnosis. CrewAI continues device-level recovery with APN, reboot, and airplane-mode actions.
4. **Evaluation projection:** The same trace can produce correctness, task completion, tool invocation, plan alignment, token usage, latency, hallucination, privacy leakage, and harmful-action metrics.
5. **Failure point:** The useful lesson is the execution and cost contrast. But Table 2 also displays `task_succeeded=1.0, correctness=0.0` in both columns, while the prose describes LangGraph as correctness 1.0 and CrewAI as correctness 0.0. Treat the case as an illustrative diagnostic, not a cleaned ground-truth record.

## Technical mechanism

### 1. Task layer: ATP aligns benchmarks and harnesses

Section 4.1 separates the benchmark adapter from the agent harness. The adapter creates a `TaskInput` and an `AgentBinding`; the input stores the instruction, state, expected actions and outputs, metadata, and optional sandbox specification, while the binding provides tool schemas, tool execution, and prompt construction. An `AgentRunner` consumes the binding, runs the task, and returns a `TaskTrace`.

Section 4.2 describes 23 benchmarks across coding, conversational, research, and computer-use areas. The registry includes Agno, AutoGen AgentChat, CrewAI, Google ADK, LangGraph, LlamaIndex, OpenAI Agents SDK, Smolagents, and the Anthropic Python SDK. The paper explicitly says registry support does not imply that every framework–benchmark pair has passed end-to-end validation.

### 2. Monitor layer: events become structured traces

Sections 3.1–3.2 use semantic, span, and SDK layers to map framework-specific calls into comparable operations. An OpenTelemetry-style span preserves start/end time, status, context, trace identity, and parent-child relations. A high-level agent span can contain reasoning chains, model calls, and tool invocations.

The `TaskTrace` stores run status, turn count, ordered tool calls, final answer, elapsed time, and raw framework output. This two-level design matters: the normalized record supports comparison, while the span tree preserves the execution causality needed to locate delays and failures.

### 3. Evaluation layer: metrics follow the lifecycle

Section 5.1 divides metrics into four stages: Reasoning (Task, Flow, Logical), Action (Tool, Skill, Memory), Final Answer (Answer Correctness, Task Completion), and Runtime Quality (Efficiency, Safety). Implementations may be LLM judges, deterministic rules, environment verifiers, or aggregation functions; where a property is evaluated is separated from how it is computed.

Sections 5.2–5.3 provide the operational center of gravity. Runs, turns, tool calls, errors, resource usage, and metric results are related in a database-backed schema. A new metric version or judge model can query stored traces without repeating API calls. Re-evaluation, aggregation, auditing, and experiment provenance therefore share one substrate.

![A²E Figure 2: Task, Monitor, and Evaluation system overview](/paperReading/19-a2e-agent-auditing-engine/figure-2-system-overview.png)

*Figure | Paper Figure 2 (Section 2): Task manages benchmarks and execution support, Monitor unifies agent access and instruments the runtime loop, and Evaluation performs multidimensional assessment with centralized result storage. Source: [A²E v1 Figure 2](https://arxiv.org/html/2608.07346v1#S2.F2); the arXiv page lists a [non-exclusive license to distribute](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html), while copyright remains with the paper authors.*

## How to read the evidence

### Table 1: correctness differences across harnesses

**Question and control:** Table 1 compares 9 harnesses across 23 benchmarks, with 5 tasks per harness–benchmark cell and 1,035 scored runs. The same DeepSeek-V4-pro FP4 model, inference configuration, tool setup, step limit, and timeout are used; full traces from 19 non-sandbox benchmarks feed the trajectory analysis in Figure 6. **Observation:** Average correctness is approximately LangGraph .58, CrewAI .57, Google ADK .57, AutoGen .58, Smolagents .63, Agno .68, LlamaIndex .64, Claude AS .58, and OpenAI Agents .58. **Interpretation:** Even with a fixed model backend, prompt construction, state management, and control loops can change the outcome. **Boundary:** Five tasks per cell are too few for a stable leaderboard, and benchmark, provider, judge, and framework-version interactions remain hidden by averages.

### Figure 7 / Section 6: read success and cost together

**Question and control:** The authors compare nine harnesses on three benchmarks using a common GLM-5.2 API model, plotting success rate against completion tokens. **Observation:** The success-rate gap reaches 0.20 on GDPVal, 0.30 on MMLU-Pro, and 0.66 on tau³-bench, with large token differences as well. **Interpretation:** A harness is not merely a wrapper; tool interaction, prompt/state accumulation, and termination policy can turn the same model into a different agent. **Boundary:** This is not a component-level ablation and does not show that one harness is more efficient on every task.

![A²E Figure 7: success rate and completion-token trade-offs across three benchmarks](/paperReading/19-a2e-agent-auditing-engine/figure-7-harness-comparison.png)

*Figure | Paper Figure 7 (Section 6.2): nine harnesses are plotted with task success rate against average completion tokens for GDPVal, MMLU-Pro, and τ³-bench under the shared GLM-5.2 API model; circles mark the top three trade-offs per benchmark. Source: [A²E v1 Figure 7](https://arxiv.org/html/2608.07346v1#S6.F7); the arXiv page lists a [non-exclusive license to distribute](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html), while copyright remains with the paper authors.*

### Table 2: a diagnostic example with a data inconsistency

**Question:** With the same model, task, and environment, can a trace show why one path succeeds while another fails? **Observation:** The prose and Table 2 describe LangGraph as finding the account-level cause with 3 turns, 4 calls, 3 tools, and 10,122 tokens, while CrewAI uses 5 turns, 9 calls, 5 tools, and 96,704 tokens and remains in device-level troubleshooting. **Interpretation:** This demonstrates why execution-aware metrics can provide repair signals that final-answer scores cannot. **Boundary:** The table also lists `task_succeeded=1.0, correctness=0.0` for both columns, contradicting the later LangGraph 1.0 / CrewAI 0.0 correctness description. That inconsistency belongs in the evidence ledger; it should not be silently repaired into an unstated truth.

### Failure, calibration, and transfer questions

The paper includes a failure-oriented case study and token/cost analysis, but not a complete component-level ablation, cross-provider calibration study, judge-version agreement analysis, subgroup fairness analysis, or long-horizon transfer evaluation. It also notes that sandbox benchmarks need container images, datasets, and execution environments. Therefore, extrapolating from 19 non-sandbox full traces to all 23 benchmarks requires care.

## Evidence map

- **Paper directly supports:** The Task/Monitor/Evaluation architecture, ATP objects, span-based traces, lifecycle metric taxonomy, database re-evaluation, 23 benchmarks, 9 harnesses, 1,035 scored runs, and the numbers in Tables 1–2 and Sections 4–6.
- **Author interpretation:** With the model backend fixed, harness-level effectiveness and efficiency differences remain; execution-aligned evaluation can locate planning, tool-choice, resource, and termination failures.
- **Not established:** The evidence is not enough to call the average correctness values a universal ranking. There is no independent judge calibration, full component ablation, cross-provider/version reproduction matrix, or basis for equating a platform metric with safety or production reliability.
- **Bloss0m engineering judgment:** The reusable asset is the trace/evaluator data model, not the table's average ranking. Pin run identity, model endpoint, tool schema, prompt version, judge version, and cost metadata first; treat metric results as recomputable views.

## Artifacts and reproducibility

As of **2026-08-11**, the author's [A²E repository](https://github.com/datamllab/A2E) is directly reachable. It contains `task`, `monitor`, `eval`, `server`, `example`, `script`, `ui`, and documentation. The README provides a local server, CLI experiment, dataset/harness/evaluator registry, and OpenTelemetry/OpenInference trace directions, making it useful for source inspection and smoke setup. Full reproduction of the paper experiment is conditional: it needs provider/API keys, the same model endpoint and inference settings, while sandbox datasets need Docker and 1–3 GB images. Dataset version, judge prompt, paper commit, and cost status were not fixed as a downloadable release bundle in this audit.

A reproduction record should preserve the repository commit, benchmark-adapter version, sample seed, task IDs per cell, harness/framework version, model endpoint, prompt/config, tool setup, step limit, timeout, sandbox image, judge version, raw traces, and metric outputs. Running the README example is not a reproduction of Table 1.

## Engineering decision and when not to use it

**Use it when:**

- You need to compare LangGraph, CrewAI, OpenAI Agents SDK, or a custom harness on the same benchmark while retaining tool, turn, latency, token, and error evidence.
- You want correctness, task completion, tool recall, safety, and cost as separate evaluators rather than one opaque LLM-judge score.
- You want new metrics or judge versions to rescore stored traces without paying for agent execution again.

**Do not apply it directly when:**

- You have only final answers and no ordered tool calls, state, model calls, versions, or timing. A²E's diagnostic value depends on trajectory evidence.
- You want a long-term production ranking from five-task cells. Sample size, version drift, and task mix do not support that inference.
- You operate in a high-risk setting without judge calibration, deterministic verification, human review, and failure escalation. A taxonomy is not a safety guarantee.
- Your sandbox, dataset, provider, or model endpoint differs from the paper. Build your own run manifest and transfer study instead of copying Table 1 averages.

In practice, start with an immutable `RunManifest` and normalized `TaskTrace`, then implement evaluators as versioned functions or jobs over traces. Verify that the same trace can be recomputed under metric versions before expanding the benchmark registry or building a cross-harness dashboard.

## Three things to remember

1. **Technical idea:** Separate task input, execution trace, and metric projection so re-evaluation does not require re-running the agent.
2. **Evidence:** A fixed model backend still shows harness differences in success, tool path, and token cost, but the sample size and Table 2 inconsistency require conservative reading.
3. **Boundary:** A²E demonstrates an auditable evaluation architecture. It is not a universal ranking of nine harnesses or a sufficient condition for calibration, safety, or production reliability.

## Primary sources

- [A²E arXiv abstract and v1 metadata](https://arxiv.org/abs/2608.07346)
- [A²E v1 HTML, Sections 2, 4, 5, and 6](https://arxiv.org/html/2608.07346v1)
- [A²E artifact repository](https://github.com/datamllab/A2E)
- [OSReward agent evaluation paper reading](/en/paper-reading/08-osreward-agent-evaluation)
- [Agent Trajectory Sentinel paper reading](/en/paper-reading/14-agent-trajectory-sentinel)
