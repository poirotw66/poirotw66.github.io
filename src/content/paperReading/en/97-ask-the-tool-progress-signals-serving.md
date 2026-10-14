---
title: "Ask the Tool, Don't Guess: How Progress Signals Change KV Cache Scheduling"
description: "Tool duration depends on the live environment, so names and call histories cannot reliably predict remaining work. This reading explains how Ask the Tool, Don't Guess recovers progress from tool output and execution traces, turns it into KV cache retention, offload, and reload hints, and bounds the reported TTFT gains to the authors' four-H100 experiment."
image: "/paperReading/97-ask-the-tool-progress-signals-serving/title_image.webp"
pubDate: 2026-10-13
tldr:
  - "While an agent waits for a tool, its conversation KV cache may continue to occupy GPU memory. A tool name or duration history cannot reveal how much work this call has left under current load."
  - "The paper routes counters, phase messages, and execution-side traces into a separate side channel, allowing a serving controller to refresh, release, or reload KV cache based on progress."
  - "In the authors' replay of agent sessions on four H100 SXM GPUs, p90 post-tool TTFT fell 20.7% with HBM only and 20.8% with HBM plus DRAM versus LRU. These results are not a general guarantee across services or workloads."
  - "Tools may expose no readable signal, parsers may change tool behavior, and tenants may lie. The paper simulates session credit ledgers, but no paper-specific code, traces, or engine patch was verified for an independent rerun."
audience:
  - "Engineers building LLM agent serving, KV cache, and tool execution platforms"
  - "Readers studying long-running tool calls, inference scheduling, and agent observability"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Inference", "Observability", "Research"]
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
field: "AI Systems"
difficulty: "advanced"
showToc: true
paper:
  title: "Ask the Tool, Don’t Guess: Agent Tool Calls Hold Their Progress, and the Serving System Should Read It"
  authors:
    - "Yipeng Liu"
    - "Yingqiang Zhang"
    - "Feifei Li"
    - "Huanchen Zhang"
  year: 2026
  venue: "arXiv:2609.18849 v1 (2026-09-16; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.18849v1"
    arxiv: "https://arxiv.org/abs/2609.18849v1"
---

<!-- paper-reading-no-body-figures: The arXiv v1 record provides a perpetual non-exclusive distribution license but no explicit permission to reuse its figures, and no locally available figure assets with separately verified reuse permission were found. This reading therefore includes no copied paper figures. -->

## The paper in 90 seconds

- **Problem:** During a tool call, the previous conversation's KV cache may keep occupying GPU memory. Serving must decide whether to retain it, move it off GPU, or reload it near tool completion. Tool names, duration histories, predeclared times, and GPU occupancy cannot reveal how much work this particular call has left under its current load.
- **Core insight:** A running tool may already hold the answer in test counts, compile units, downloaded bytes, or phase messages. If that progress travels through a side channel that leaves the agent's original observation unchanged, serving can replace guesses about total duration with revisable observations of work completed and use them to manage cache lifetime.
- **Strongest evidence:** The authors census recoverable signals in four public agent trace sources, compare a harness with four published duration predictors, and add control hints to vLLM before replaying sessions on four H100 SXM GPUs. Figure 9 reports p90 post-tool TTFT reductions against LRU of 20.7% for GPU HBM only and 20.8% for GPU HBM plus host DRAM (Sections 4–5).
- **Main boundary:** This is an author experiment in an arXiv v1 preprint. Long remote APIs, human waits, downloads stalled before the first byte, and unparseable tools may still expose no useful progress. The result does not show that every tool protocol, engine, or production workload gets the same latency improvement.

The paper treats tool calls as a control interface between an agent runtime and model serving. Its claim is not that every task can report a precise ETA. Rather, tool execution often contains two useful kinds of signals: a strong signal that can be converted into remaining work, and a weak signal that only says the final phase is near. The serving layer may use these signals to schedule cache lifetime without changing what the agent sees. All numbers below are author-reported; this reading did not independently rerun the experiments.

## What to know first

Transformer inference stores key/value tensors for processed tokens in a KV cache, avoiding recomputation of the full context on the next turn. After an agent calls a tool, the model emits no tokens for a while, but the session may still need its context. When GPU space is scarce, serving may retain some idle request caches, evict others, or reload them later. Evicting too early can force recomputation or a wait after the tool returns; retaining too long can crowd out active generation.

TTFT, or time to first token, measures the wait from request submission until the model emits its first new token. This paper studies post-tool TTFT: the wait from a completed tool call until the agent's next model response begins. p90 is the 90th percentile of the measured latency distribution, not its average. HBM is high-bandwidth GPU memory. In this paper, “HBM + DRAM” means GPU memory plus host memory used as a KV offload tier.

## Prior approach limitation and core intuition: observe while the call runs

Tool duration is not a fixed property of a command string. The same build can run an order of magnitude faster in an idle sandbox than in its recorded run; contending neighbors can then make many calls several times slower. Package indexes, object stores, and model APIs also vary with time, quota, and external conditions. A history helps only when it resembles the current environment; mixing histories from different load conditions harms predictions near the end of a call (Section 2.1, Figure 3, Table 1).

Existing estimates include fixed TTLs, elapsed time, per-tool duration statistics, models over tool names and arguments, engine occupancy, and a duration declared by the caller before execution. Their shared limitation is that they do not observe the work in progress. An engine may know whether a GPU is busy without knowing whether one particular tool just started or is about to finish. A fixed declaration can be corrected only after the call returns. The paper adds another information source: a running tool emits progress that can be revised over time (Section 2.1, Table 1).

That progress need not be a polished bar from zero to one hundred percent. A **strong signal** includes a counter and a credible total, such as “40 of 66 compile units complete.” A **weak signal** lacks a reliable total but identifies a final phase or completion marker, such as an upcoming link step in a build. A weak signal cannot say how many minutes remain, but it may arrive early enough to trigger a cache reload that takes a few seconds (Section 2.2). By contrast, a remote API that responds only at completion, a command waiting for human input, or a download that has not received its first byte has no readable in-flight signal at that moment.

## Walk one example through the method

Consider the paper's scikit-learn build. It may take 232 seconds, while the agent sees only the final lines preserved by `tail`. In verbose mode, however, the compiler names each file as it starts, and a dry run can reveal that the total is 66. The paper's flow is:

1. **Register the call:** The harness registers the execution with the serving side under a call ID and prepares a verbose switch, dry run, or other available instrumentation.
2. **Preserve the original output:** The tool runs as before, and the agent still sees what it would have received through its existing pipeline. Additional details remain on the side channel.
3. **Emit events:** An executor-side tap reads compiler output or watches object files appear in the build directory. It sends the call ID, work completed, total if known, phase, and timestamp.
4. **Update remaining time:** The controller estimates completion from observed rate and remaining work. If retaining the context is useful, the engine refreshes the KV blocks' place in the eviction queue; if the call still has a long way to go, it stops refreshing and lets LRU or DRAM offload take over.
5. **Prepare for return:** With a DRAM tier, the controller can reload the context with some lead time before the predicted return. When the tool finishes, its original output and exit status still reach the agent.

The most likely failure is treating the fraction of completed units as the fraction of elapsed time. If compile units vary greatly in duration, 40 of 66 does not mean 61% of the time has passed. For multi-phase builds whose phase shares are unknown, the paper downgrades the report to a weak signal and uses only the last-phase marker as a reload cue. This distinction is central: a progress interface should preserve confidence in its signal rather than invent a precise percentage merely to produce an ETA (Sections 2.2 and 3.2).

## Technical mechanism: a state side channel and cache control

The wrapper sits between the executor and tool process. Its main path passes the tool's bytes to the agent unchanged. A second state path converts tool output and execution-environment traces into a common event form. Events contain a call ID, work completed, an optional total, a phase, and a timestamp. Output parsers read percentages, counters, and progress libraries; environment observers may count newly created object files, inspect package-index download sizes, or obtain the test runner's collection count (Section 3.2, Figure 6).

The authors lift three layers of “silence.” Infrastructure environment variables may disable tqdm and similar progress bars; the agent may add `-q`, `tail`, redirects, or pipeline filters; and the tool may need a specific option before it reports progress. The wrapper re-enables a signal without passing it through to the agent, copies filtered stream data to a side file, or performs a dry run to obtain a total. A third case is code written by the agent itself: the authors ask the model to add a side-channel progress line at generation time, then compare original and instrumented output and exit status and compare benchmark scores (Section 3.1, Appendix B).

The paper handles signal quality in two ways. If a counter exceeds its declared total, the wrapper retracts the total and falls back to a count without one; it does not clamp the value at 100% and produce a false completion alarm. For multi-phase work, historical phase-duration shares can be used to combine bars into a weighted fraction. When the shares are unknown or unstable, the wrapper keeps only the final phase's end marker and classifies the call as a weak signal. On realistic calls, the authors measure less than 1% wall-clock overhead for the wrapper (Section 3.2). These choices conservatively downgrade uncertain signals; they do not prove the signal is truthful.

Serving does not require replacing the scheduler. The paper adds several vLLM operations for a context identified by a prior response ID: `refresh` moves resident blocks toward the safe end of the eviction queue; `release` makes them eligible for earlier eviction while keeping them addressable; and `query` reports how much of the context remains on the GPU. Operations run between scheduler steps, skip blocks held by a running request, and do not propagate errors into the serving loop. With no hints, the engine behaves as before (Appendix D). A controller reads the event stream and refreshes while estimated remaining time is below a keep threshold. Once it moves beyond the threshold, refreshes stop. With DRAM, the controller also reloads the context ahead of the predicted return. Progress therefore affects cache retention, offload, and prefetch, rather than appearing only as a UI status.

## How to read the evidence: signal accuracy and latency are separate claims

The authors first census tool time in mini-SWE-agent, OpenHands, Terminal-Bench, and OpenTelemetry trace sources. In Table 2, after instrumentation, strong signals cover 38.2%, 50.6%, and 48.0% of tool time in the three main corpora. Including weak signals raises the shares to 66.2%, 59.2%, and 71.8%. These percentages are shares of execution time, not shares of tool calls that support progress. Unparsable time still makes up roughly 12–18%, and the sources of silence vary by corpus. The paper does not show that these shares represent all production agent traffic (Section 2.2, Table 2, Figure 4).

For prediction quality, the authors compare the progress stream at KV decision points with reimplementations of four published predictors: Continuum's per-tool duration distribution, CacheWise's name/argument clusters, TokenCake's recent-call average, and InferCept's profiled per-tool duration and elapsed-time rule. They add an in-flight history estimator. At 50% of a call, when deciding which context to evict, progress has median ETA error around one-fifth of the call duration, versus around one-third for the best history predictor. At 90%, progress median error is under 10%, versus around 80% for the best history predictor (Figure 7). Static predictors that always say “almost done” can look accurate at 90% by construction but false-alarm at nearly every earlier checkpoint, so ETA error alone is not enough; trigger timing matters (Section 4.2).

The trigger test treats the time needed to reload a context as a recovery budget and asks whether the first trigger falls near the desired point. With a two-second budget and extra lead equal to that budget, the progress stream triggers on time in 31% of test runs, 15% of builds, and 50% of scripts. Under a half-second budget, the rates are 21%, 2%, and 50%, respectively. Build units vary considerably in duration, making precise triggering difficult under tight budgets; instrumented scripts with uniform loop iterations are more consistent. If “on time” is relaxed to mean within a two-sided error window, early or late, 61% and 33% of all runs fall within the two-second and half-second budgets (Appendix C). This shows a clear improvement over predictors, while also showing that reload timing depends on work-unit regularity and recovery cost.

The authors replay calls on the same machine under four conditions: idle, contention throughout, contention starting one third into a call, and contention ending halfway through. A history matched to the environment can be useful; histories mixed across load conditions are an order of magnitude worse near the call's end. Progress relies on the rate observed during execution, reducing dependence on old history when load changes. However, Appendix C says a whole-run rate can carry the old load into its ETA for tens of seconds after contention stops. A windowed rate adapts in about ten seconds at the cost of possible overshoot (Section 4.3, Appendix C). “Robust to environment changes” therefore does not mean instantaneous adaptation.

The central system experiment replays the authors' agent sessions on 4×H100 SXM in two configurations: GPU memory only, and GPU plus host DRAM. Baselines include LRU and an oracle that knows every exact return time. Under HBM only, keeping the wrong cache can evict another context, while evicting the wrong one makes this call recompute. The decision is mainly which context should stay. With DRAM, eviction copies the context to the host tier, so the controller must decide when to release and when to reload, trading reload latency and DRAM traffic. The progress controller therefore uses thresholds and hysteresis suited to each configuration (Sections 5.1–5.2).

In Figure 9, for that setup, progress reduces p90 post-tool TTFT versus LRU by 20.7% with HBM only and 20.8% with HBM plus DRAM, approaching the oracle. In the DRAM configuration, both progress and oracle reload roughly a third of LRU's volume. These figures describe a specific replay cohort, modified vLLM, four H100 GPUs, and two memory configurations; they do not imply any online service will reduce latency by one fifth. The authors also report mean post-tool TTFT reductions of 34.2% and 35.3% for calls of at least ten seconds. Those are conditional mean results, not the overall p90 (Figure 10).

Diagnostics show that short calls gain little because most calls shorter than a second do not trigger eviction; longer calls make cache decisions more consequential. For some calls lasting at least a minute, the authors' method retains about a quarter of the improvement while the oracle keeps most of its gain. Giving the method oracle information only in phases from which it receives no signals recovers 63% of the oracle's benefit; giving it oracle information in already-covered phases recovers 17%. The authors thus identify signal coverage, rather than precision on already-covered phases, as the larger remaining opportunity (Section 5.2). The duration predictors either lack a hint and fall back to LRU or underestimate most calls and keep nearly all contexts. In HBM-only mode, the latter can make p90 up to a quarter worse than LRU; with DRAM, they reload too early and produce 8–13 times the reload volume of this method (Section 5.2).

The authors separately test whether the harness changes agent behavior on 100 SWE-bench Verified tasks. With the side channel alone, solved tasks change by a paired difference of −1 from a baseline of 100; steps, tokens, tool time, and wall time do not show significant changes. Prompting the agent to expose more signals increases strong-signal coverage to 33.3% of tool time but adds an average of 1,575 completion tokens, with a paired solved-task difference of −2. A more intrusive variant that removes output suppression does not increase signal share and adds 455 non-zero exit codes (Section 4.3, Table 4). “No measurable agent-score cost” should be read within the tested harness and uncertainty interval, not as a theorem of behavioral equivalence.

## When the reporter lies: bound authority and allocate risk

Progress content may be controlled by the tenant. A malicious or faulty script can report 90% completion early while leaving heavy work to the end; before return, the transcript alone may not reveal the lie. The authors give no single report automatic authority. Instead, every session has two credit ledgers: one for memory retention justified by reports, another for latency risked on those reports. Correct reports earn credit; engine decisions spend it; after completion, a report found inaccurate is charged. When a ledger is empty, the corresponding decision falls back to the no-signal policy (Section 5.3).

In a preliminary lying simulation, inaccurate reporters increased the memory they held by 6%, and the two ledgers recovered 5% of that increase. This is evidence about one simulated strategy and mechanism, not proof that adversaries cannot find another attack or that every tenant strategy is fair. The authors also warn that progress streams reveal tenant workload structure and should be treated as sensitive as tool output. Deciding who bears the cost of a bad serving decision is a policy choice, not something the technical mechanism resolves automatically (Ethics Statement).

## Evidence map: where the paper's claims stop

| Author claim | Evidence | What it supports and does not support |
| --- | --- | --- |
| Pre-call estimates do not observe current execution conditions | Same-command replays and duration/rank comparisons across load conditions (Section 2.1, Figure 3) | Supports environmental effects on duration; does not mean every tool is unpredictable |
| Tool stacks contain recoverable progress of different strengths | Four-corpus census, tool counters, and end markers (Section 2.2, Table 2, Figures 4–5) | Supports readable signals across much of tool time in these traces; opaque calls remain and the corpus is not all online traffic |
| A separate side channel can carry state without changing agent input | Wrapper, output comparisons, and benchmark/control comparisons (Section 3, Table 4) | Supports behavior preservation in the tested harness; each new instrumentation still needs verification |
| Progress can improve KV decisions and post-tool TTFT | Predictor comparison and 4×H100 vLLM integration (Sections 4–5, Figures 7–10) | Supports the reported replay, engine, and memory settings; there is no external validation across production traffic or providers |
| Untrusted reports can be bounded with a credit mechanism | Preliminary simulation with separate memory and latency ledgers (Section 5.3) | Demonstrates one risk-control design; it does not eliminate malicious reports or prove policy fairness |

## Limitations, reproduction scope, and available artifacts

The source is an arXiv v1 preprint submitted September 16, 2026. This reading uses that version and does not imply peer review. The primary arXiv record links no paper-specific author repository. A third-party search page's “Request Code” button is not evidence of an author release. No downloadable author trace bundle or patch for the paper's vLLM changes was verified; public agent projects and vLLM itself are context, not a complete reproduction package. Availability was checked on October 13, 2026.

The paper describes the event schema, wrapper approach, engine hints, and controller logic. Recreating the headline result still requires matching traces, parser and preprocessing details, the workload mix, exact controller thresholds, the serving patch, and four H100 GPUs or a validated simulator. The results are author experiments; this reading did not independently rerun them. A smaller follow-up could instrument one local long-running tool with a verifiable monotonic counter and completion event, then compare fixed-duration prediction with progress-based scheduling under a small synthetic load while measuring GPU residency, reload volume, and post-tool TTFT. That would test a local tool and controller, not reproduce the paper benchmark.

The signal is not worth using when a dry run changes caches or side effects, verbose mode changes execution, or an instrumented script fails output and exit-status equivalence checks. Remote APIs, human approval waits, downloads with no first byte, and tools that expose only start and completion events still need another estimate or a conservative fallback.

## Bloss0m engineering judgment: treat progress events as sourced control hints

The following is **Bloss0m engineering judgment**, not a deployment recommendation validated by the paper. A platform considering a similar interface should define which observable unit an event counts, how its total is obtained, when a counter can be retracted, whether phases can be compared, and how a call ID maps to one request. The controller should distinguish “a signal exists” from “the signal is reliable enough to act on.” It should at least retain strong, weak, absent, and retracted states, and record the progress version, action, and actual completion time for each decision. That makes it possible to investigate early reloads, late reloads, and incorrect retention.

A small rollout is more defensible than adding parsers to every tool at once. Start with a local tool whose output format is stable, whose units can be counted, and whose instrumentation can be checked for output equivalence. Measure the agent-visible stream, tool side effects, exit status, cache bytes, DRAM traffic, TTFT, and throughput together. A changing-load policy also needs an explicit rate-adaptation strategy: the paper's windowed rate tracks changes faster but may overshoot. Reports controlled by tenants need quotas, fallback behavior, and audit paths; a credit system should not be treated as proof that reports are trustworthy.

Do not adopt the mechanism directly when work units are highly uneven and there is no end-phase signal; the tool responds only when finished; a multi-tenant environment cannot treat workload progress as sensitive data; cache mistakes cost more than saved recomputation; or the engine lacks safe operations to refresh, release, and query context. The paper offers a measurable runtime-contract direction. Actual gains depend on signal coverage, control policy, cache layout, and workload shape.

## Three things to remember

1. **Concept:** Tool progress can be an input to serving control. It may be a work fraction with a total, or only a final-phase signal good enough to trigger prefetch.
2. **Evidence:** In a specific 4×H100 vLLM replay, the authors report p90 post-tool TTFT reductions versus LRU of 20.7% with HBM only and 20.8% with HBM plus DRAM; those outcomes depend on the tested coverage and setup.
3. **Boundary:** Signals may be absent, parsing may perturb execution, reporters may lie, and the paper's artifacts are insufficient for an independent rerun. Any deployment needs fresh checks for behavior preservation, privacy, and the cost of control errors.

## Further reading

- [Parsing the Stream: A Data Model for Live Agent Traces](/en/paper-reading/43-parsing-the-stream-live-trace/): how execution events can become structured traces for analysis.
- [Tool Call Succeeds, Workflow Fails](/en/paper-reading/49-tool-calls-workflows-fail/): the gap between a successful tool response and a completed workflow.
- [Predicting Partial Answer Quality and Utility in Agentic RAG](/en/paper-reading/53-agentic-rag-partial-answer-prediction/): another study of using intermediate signals to support decisions during agent execution.

## Primary sources

- Liu, Zhang, Li, and Zhang, [Ask the Tool, Don’t Guess: Agent Tool Calls Hold Their Progress, and the Serving System Should Read It, arXiv v1](https://arxiv.org/html/2609.18849v1), submitted September 16, 2026. The census, predictor comparison, vLLM evaluation, and lying simulation in this reading are author-reported and were not independently rerun.
- [arXiv abstract and version record](https://arxiv.org/abs/2609.18849v1): records the v1 date and a perpetual non-exclusive distribution license; that license does not explicitly grant permission to reuse the paper's figures.
