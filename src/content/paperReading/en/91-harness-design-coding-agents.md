---
title: "An Empirical Study of Harness Design for Coding Agents: Planning, Tools, and Context Management"
description: "When does a coding agent benefit from planning, a structured tool interface, or context management, and when do these components only add cost? Read the conditional effects across four models, two benchmarks, and 176 matched settings."
pubDate: 2026-10-07
updatedDate: 2026-10-07
tldr:
  - "Context management mainly prevents trajectories from ending in overflow when the window is tight; its average success-rate advantage narrows as the window grows."
  - "T4, which elides old observations before selectively summarizing, has the lowest average cost at broadly similar success. Recoverable elision is rarely recalled and brings no consistent accuracy gain."
  - "Planning acts as a trajectory scaffold for a weaker model and often reduces repeated verification cost for stronger models. Tool preferences also depend on shell proficiency and task type."
  - "The study covers specific harness implementations, four models, and two coding benchmarks. It supports tuning components to model, workload, and context pressure, not adopting a universal configuration."
audience:
  - "Engineers designing or evaluating coding-agent harnesses"
  - "Researchers studying long-horizon agents, tool interfaces, and context management"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "Research"]
topics:
  - agent-evaluation-observability
  - agent-safety-governance
field: "AI Systems"
difficulty: "advanced"
showToc: true
image: "/paperReading/91-harness-design-coding-agents/title_image.webp"
paper:
  title: "An Empirical Study of Harness Design for Coding Agents"
  authors:
    - "Run-Ze Fan"
    - "Zihao Zhang"
    - "Simin Ma"
    - "Yebowen Hu"
    - "Shouju Wang"
    - "Kaiqiang Song"
    - "Fei Liu"
    - "Hamed Zamani"
    - "Xiaoyang Wang"
  year: 2026
  venue: "arXiv:2609.20804 v1 (2026-09-17; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.20804v1"
    arxiv: "https://arxiv.org/abs/2609.20804"
series:
  id: "agent-harness-design"
  title: "Agent Evaluation and Reliability"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** When two coding agents score differently, we often credit the model. Yet the harness also determines what the agent can plan, how it operates on a repository, and how a long trajectory fits inside a finite context window. Comparing complete systems conflates these effects.
- **Core insight:** The authors keep a ReAct execution loop and several supporting components fixed, then vary planning, the action interface, and context management to see how their effects depend on model, task, and window budget.
- **Strongest evidence:** Across 176 settings for four models on SWE-Bench Verified and Terminal-Bench 2.1, the average success-rate gap between managed context and no management at a 32k window is 35.7 and 9.5 percentage points, respectively. At 128k, it narrows to 2.7 and 2.8 points. The small-window gains track avoided overflow rather than a general improvement in model reasoning (paper Figure 3, Tables 3–4, §3.2).
- **Main boundary:** Each task-setting pair is run once. Planning and the action interface are compared only at T4/128k, and the interface change also alters prompts, state tracking, and post-edit diagnostics. These are conditional estimates for the tested implementations, not a universal model ranking or isolated causal effects for every interface feature (§§3.1, 6).

This reading follows the arXiv v1 preprint submitted on 17 September 2026; the paper page does not establish peer-review status. The authors ask a practical question: when an agent must take hundreds of coding steps, which harness components help turn model capability into task completion? They compare context management, planning, and action interfaces within one lightweight loop, then use trajectory analysis to ask how success rates change. The answer is not that more components are always better. Avoiding overflow can matter when windows are tight, planning can help a model that gives up early, and coarser shell actions can suit a model proficient with Bash. Each effect depends on conditions.

## What does a harness change?

In this paper, a harness is the software around a model that lets it operate on a workspace over multiple turns: the control loop, tool interface, planning state, and policy for retaining context. It changes what the model sees on each turn, which actions it can call, how tool failures return, and when execution stops. Treating the model name as the whole agent cannot explain why the same model follows different trajectories under different tool workflows.

The authors hold the basic ReAct structure fixed. On each turn, the harness assembles the model input, receives a thought and action, executes tool calls in a task container, and appends the observations to history $H$. They intervene at three points:

1. **Planning:** whether the model has an explicit task plan that persists and can be updated.
2. **Action space:** whether it uses typed workspace tools or Bash alone.
3. **Context management:** how older model and tool turns are retained, compressed, or recalled within a bounded window.

Other important conditions are held fixed as far as possible, including safety checks, read-before-write requirements, fast post-edit Python diagnostics, and stuck detection. This makes the comparison closer to asking what a particular intervention does on this execution substrate. The conclusions still apply only to the prompts, thresholds, tools, and models the paper tested.

This is an empirical component study, not a formal definition of a standard “harness,” and it does not establish that the three interventions are independent. The components are compared separately under selected conditions; the authors do not run a full factorial design to estimate every combination and interaction.

## Core intuition: why prior whole-harness comparisons are insufficient

Most agent evaluations measure the joint outcome of a model and the surrounding system. Different systems may change tools, prompts, error feedback, context policies, and stopping rules at once. Their aggregate scores can compare product configurations, but cannot easily show which component accounts for a gap. This study fixes a lightweight substrate, makes paired comparisons on selected components, and examines how effects vary with model and resource budget.

The prior approach of evaluating complete harnesses leaves those mechanisms bundled together: a higher score cannot reveal whether the difference came from planning, the action interface, context management, or their interaction with the model.

One way to organize the experiment is as $(m, b, w, c)$, where $m$ is a model, $b$ a benchmark, $w$ a context-window budget, and $c$ a harness configuration. Let the observed success rate and cost be $S(m,b,w,c)$ and $K(m,b,w,c)$. This notation is a **Bloss0m engineering synthesis**, not a formalism proposed by the authors. It highlights that the question is not only which configuration maximizes $S$, but which $c$ improves success, controls cost, or prevents premature termination on a target workload and budget.

This framing also cautions against treating parameter count as capability itself. Mistral-Medium-3.5-128B and Nemotron-3 120B are both in the hundred-billion-parameter range, yet react differently to Bash and planning. Training, tool familiarity, and shell proficiency may all contribute. The paper does not attribute the effects to model size alone.

## Walk one worked example through the context-management method

The following is a **Bloss0m-created illustration**, not an experimental trajectory from the paper. Imagine an agent fixing a repository issue. It has read several long test outputs and later discovers that it needs to revisit one specific error message.

1. **History grows:** each model action and tool observation is appended to $H$. The preamble, task description, and most recent turns are likely to support the current work directly.
2. **T0, no additional management:** retain everything until the model window is exceeded. The trajectory then terminates with a context-overflow error.
3. **T1, elision (M1):** once a management threshold is reached, replace the body of an older middle-region tool observation with a short stub. This is cheap, but its details are no longer directly available.
4. **T2, elision plus recall (M1+M2):** save the original observation externally before eliding it, and expose a recall_event tool. The model can retrieve it on demand, but must recognize that it may matter and choose to call the tool.
5. **T3, summarization (M3):** pass older middle-region events to a separate, tool-free call to the same model, which writes a natural-language summary. It may lose details and incurs additional model cost.
6. **T4, staged management:** elide bulky old tool observations first; if history still exceeds the hard threshold, summarize the oldest middle-region events. The preamble and recent turns remain verbatim; the recent-window budget preserves at least two turns.
7. **A likely failure point:** a detail in an elided observation may become critical later, but the model may not think to recall it. A summary may also omit an exact path or test value. The paper finds recall is rarely used, but that does not establish that recall has no value in other tasks.

T0–T4 are the five policies compared in the paper; M1, M2, and M3 are the underlying mechanisms. T1 and T2 differ in whether elided content can be recalled; T3 uses summarization alone; T4 combines elision, recall, and summarization. T1–T3 each use a single management action and operate at the hard threshold $B_2$. T4 first elides at a lower soft threshold $B_1$, then summarizes only if history still exceeds the hard threshold. In the experiment, the soft and hard thresholds are 0.6 and 0.85 of the usable window; the verbatim recent window is budgeted at 0.3 and has a two-turn floor (§§2.3, 3.1, Algorithm 1).

## How the three context mechanisms fit together

Context management balances two kinds of loss. Elision and summarization are lossy: details that later become useful may disappear. External storage and recall preserve recoverability, but require additional state and a tool, and depend on the model to recognize when retrieval is worthwhile. The authors compose these mechanisms into five tiers:

| Tier | Elision M1 | Recall M2 | Summarization M3 | Interpretation |
| --- | --- | --- | --- | --- |
| T0 | — | — | — | No extra compaction; stop on overflow |
| T1 | ✓ | — | — | Replace older middle-region tool outputs with stubs |
| T2 | ✓ | ✓ | — | Save elided originals for on-demand recall |
| T3 | — | — | ✓ | Summarize older middle-region events |
| T4 | ✓ | ✓ | ✓ | Elide large observations first, then summarize if needed |

In T4, when history $H$ exceeds $B_1$, the system finds bulky tool observations in the middle region $M$, saves the originals externally, and replaces them with stubs. If history still exceeds $B_2$, it adds the oldest middle-region events to a running summary. The “middle” is the history between the preamble and recent verbatim turns; the policy does not delete all old messages indiscriminately. Algorithm 1 in the supplement lists the per-turn order, and Appendix 7.3 gives the summarization prompt and the fragments inserted into the model input.

The intuition behind T4 is to use low-cost compaction first and invoke model summarization less often. It is one policy the authors test, not a universally optimal design; its effect depends on thresholds, output sizes, model, and task. Because summarization uses a separate call to the model under evaluation, compression itself consumes input and output tokens.

## Experimental design: a controlled substrate with bounded comparisons

The authors test four models: Nemotron-3 30B, 120B, and 550B, plus Mistral-Medium-3.5-128B from another family. The benchmarks are SWE-Bench Verified, with 500 human-verified GitHub issues, and Terminal-Bench 2.1, with 89 end-to-end command-line tasks. The metrics are task success rate and mean cost per task. The models are served with SGLang in BF16; temperature is 0, top-p is 0.95, and output is capped at 16,384 tokens per turn. Each task has a maximum of 300 steps. The authors price model calls using OpenRouter rates per million tokens accessed in August 2026 (§3.1).

For each model and benchmark, the context sweep compares T0–T4 at 32k, 64k, 96k, and 128k. Planning and the full predefined tool set stay enabled in this stage. The authors then run one planning ablation and one action-space ablation at T4/128k: disable planning or replace the full tool set with Bash-only. This yields 22 configurations per model–benchmark pair, or 176 settings across four models and two benchmarks (§3.1).

| Component question | Paired settings | What it can answer | What it cannot isolate |
| --- | --- | --- | --- |
| Context management | T1–T4 vs. T0 at four window sizes | Conditional effects of management with planning and full tools held fixed | Interactions between planning or tools and other context tiers |
| Planning | Planning on vs. off at T4/128k | Effect of this persistent planning scaffold in that setting | Other window sizes, context tiers, or planning implementations |
| Action interface | Full tools vs. Bash-only at T4/128k | Difference between these two complete interface configurations | Independent effects of tool count, granularity, prompts, state tracking, and diagnostics |

Success-rate comparisons use two-sided exact McNemar tests on task-paired outcomes, with Benjamini–Hochberg false-discovery-rate control to 0.05 within each comparison family. Pairing uses whether the same task changes from success to failure or vice versa. It does not replace repeated runs to estimate stochastic variation, and not every numerical gap is statistically significant. Terminal-Bench has only 89 tasks, and the paper notes that most of its contrasts do not reach significance.

## Evidence 1: context management mainly prevents early termination under tight windows

The authors define the “value” of management as the success-rate gap between T1–T4 and T0, averaged across the four models. On SWE-Bench, this average gap shrinks from 35.7 percentage points at 32k to 15.9, 5.5, and 2.7 points at 64k, 96k, and 128k. On Terminal-Bench, the corresponding gaps are 9.5, 7.5, 4.8, and 2.8 points (Tables 3–4, Figure 3, §3.2).

These gaps track overflow rates. On SWE-Bench, the average T0 overflow rate falls from 78.7% at 32k to 8.7% at 128k. On Terminal-Bench it falls from 61.0% to 12.1%. All managed tiers have zero overflow terminations in these settings (Figure 3). Trajectory analysis also finds that under small windows, T0 often stops during file localization. Management lets trajectories continue into editing and verification; at 128k, the trajectory differences across tiers largely diminish (§4).

The most careful interpretation is that context management helps tasks continue when a window cannot hold long trajectories. When the window is large enough, the additional accuracy gain is smaller and more model-dependent. This is not evidence that compression generally improves reasoning, nor that summaries never discard useful information.

## Evidence 2: T4 has low average cost, but no winner across every condition

Across eight model–benchmark panels, T4 has the lowest cost in seven while achieving broadly similar success to T1–T3. In equal-weight comparisons across all four window budgets, T4 has the lowest mean cost per task at each budget (Figures 4–5, §3.2). The authors explain that T4 elides bulky tool observations before summarizing, so it makes fewer summarization calls than T3. Compared with T1 and T2, it also performs fewer elisions at 32k and 64k. Its mean peak-context ratio is lowest across the four window sizes.

However, the configuration with the highest success rate varies by model, benchmark, and window. On SWE-Bench with Nemotron-3 550B at 128k, T0 scores 59.8%, T2 scores 67.4%, and T4 scores 65.8%. For Mistral on the same benchmark, T0 scores 67.4% and T1/T4 each score 68.6%; T4 is not needed to reach the top observed rate (Table 3). On Terminal-Bench at 128k, Nemotron-3 550B’s T4 rate is 44.94%, above T0’s 34.83%. Mistral’s T4 rate is 37.08%, compared with 34.83% for T0, while other tiers produce their own accuracy–cost trade-offs (Table 4).

T4 is therefore a candidate cost–success configuration in these experiments, not a recipe to copy without regard to workload. Figure 4 also shows sensitivity across window budgets. When using averages, retain the variation across windows and models; “lowest average cost” does not mean “lowest cost in every cell.”

## Evidence 3: models rarely recall elided observations

T1 and T2 differ only in that T2 stores elided tool observations externally and lets the model retrieve them with recall_event. Across 32 paired comparisons, T2 has higher success in 15 settings, lower success in 14, and ties in three. Its equal-weight mean difference is −0.36 percentage points: +0.40 on SWE-Bench and −1.12 on Terminal-Bench. Among the 64 T2 and T4 settings, 36 (56.3%) never call recall; the median number of calls is zero. Across models, the mean calls per task fall from 0.540 at 32k to 0.069, 0.011, and 0.007 at 64k, 96k, and 128k (Table 13, §3.2).

Recall is concentrated in the tightest windows and mostly in Nemotron-3 30B. Even the configuration with the most recall use—30B on Terminal-Bench at 32k under T2—averages 4.326 calls per task and scores 3.37 points below T1. “Information can be recovered” does not automatically mean “the model retrieves it at the right time” or “more tasks succeed.” Yet infrequent use in these settings does not establish that recall is useless under different prompts, tasks, or tool workflows.

## Evidence 4: planning can sustain a short trajectory or shorten an overlong one

The planning component provides a system instruction that asks the model to create a plan for nontrivial tasks and maintain it with update_plan. The harness reinjects the plan into each model input rather than letting it accumulate in the conversation history. The no-planning condition removes the plan instructions, reminders, tool, and injection. Thus the paper tests this explicit persistent scaffold, not every possible meaning of “planning” (§2.1, Appendix 7.2).

At T4/128k, adding planning raises Nemotron-3 30B’s success rate by 11.6 points on SWE-Bench and 4.5 points on Terminal-Bench, at higher cost. Trajectory analysis offers one explanation. On SWE-Bench, without planning, 68.6% of runs end without an edit and 58.4% stop during localization. With planning, those shares are 27.8% and 10.4%, respectively. Median trajectory length grows from 5 turns to 40 (Table 6, Figure 8, §4). This supports the interpretation that planning helps this weaker model reach an initial edit attempt, while the added turns also cost more.

For stronger Nemotron-3 550B and Mistral, planning lowers SWE-Bench cost by about 30% and 32%, while success falls by only 2.0 and 0.4 points (Tables 3 and 5). Their median trajectories shorten, and the analysis attributes most of that change to fewer post-edit verification turns. This suggests planning may also help a model stop repeated verification, not only decompose a task (§4). On Terminal-Bench, cost depends on how planning reshapes the trajectory-length distribution: it can extend runs that would have ended prematurely and truncate the tail of runs that would otherwise continue too long. The balance varies by model (Figure 9, §4).

The paper does not establish a rule that planning saves money as models grow stronger. Nemotron-3 120B reacts differently across the two benchmarks; the evidence shows that planning’s effects vary with model and task.

## Evidence 5: the action interface changes action size and failure risk

The full tool set includes read_file, write_file, edit_file, file listing and search tools, web_fetch, and Bash. Bash-only removes the predefined file, search, and web tools, keeping Bash and the auxiliary tools needed when planning or recall is enabled (Table 1, §2.2). The full interface also includes read-before-write checks, workspace-state tracking, and automatic diagnostics after supported edits. The paper cautions that this comparison changes the complete action interface—tools, interface prompts, state tracking, and validation support—not only tool count.

On SWE-Bench at T4/128k, Bash-only raises Nemotron-3 550B’s success rate from 65.8% with the full tool set to 69.4%, while lowering mean cost from $2.33 to $1.11 per task. The same interface change takes Mistral from 68.6% to 45.4%. On Terminal-Bench, Mistral moves in the other direction, from 37.1% to 43.8% (Tables 3–4). Model size alone does not predict the crossover.

Behavioral analysis finds that Bash-only lets shell-proficient models bundle low-level operations into fewer commands. On Terminal-Bench, Nemotron-3 550B’s median trajectory shortens from 47 actions with the full tools to 31 with Bash-only; the share of Write Code actions rises from 16% to 27%. All four models make fewer repeat edits to already edited files under Bash-only (Figure 9, Table 7, §4). For weaker models, the full interface may reduce the difficulty of each step through specific, constrained actions. Mistral’s Bash-only SWE-Bench trajectories more often end before an edit: the no-edit share rises from 1.2% with full tools to 32.8% (Table 12, Appendix 9.3.1).

The interface therefore changes success, cost, action granularity, and where failures occur. Reducing this result to tool count would hide the simultaneous changes to prompts, state tracking, and post-edit diagnostics.

## What does trajectory analysis establish?

The authors pass trajectory turns to an LLM judge that assigns workflow phases according to benchmark-specific taxonomies, then validate a sample with human annotation. SWE-Bench labels include localization, reproduction, fixing, verification, and other; Terminal-Bench labels distinguish understanding, writing code, verification, and other, with finer action types (Appendix 9.1). Human validation covers 200 trajectories and 15,610 labeled units. Overall raw agreement is about 94.2%, and the weighted mean Cohen’s $\kappa$ is 0.929. Terminal-Bench action labels have a wider range across splits: the lowest raw agreement is 79.8%, and the lowest $\kappa$ is 0.758 (Appendix 9.2).

This validation supports using the LLM judge to scale behavioral analysis; it does not mean a human checked every label in the full trajectory set. The judge uses a specified taxonomy and GPT-5.5 with high reasoning effort and temperature 0.6. New task types or label definitions need their own validation. We should therefore read trajectory results as evidence that helps explain behavior, not as an independent causal proof of task success.

| Component | Observed trajectory change | Limit of the explanation |
| --- | --- | --- |
| Context management | Extends execution under small windows while leaving phase proportions broadly similar | Supports overflow prevention as the main mechanism, not an unchanged strategy in every respect |
| Planning | More weak-model runs reach an initial edit; strong models spend fewer turns on repeated verification | Helps explain joint cost and success changes, within the tested settings |
| Action space | Bash-only permits coarser bundled actions; some models stop before localization/editing more often | Shows that a bundled interface change reshapes behavior, not which single tool feature caused it |

## Evidence map: author claims, measured results, and Bloss0m judgment

| Layer | What this reading can safely say | Main anchors |
| --- | --- | --- |
| Author claims | Context management matters more when windows are tight; T4 has a favorable average cost–success trade-off; planning and tools depend on the model | Abstract, §3.2, §6 |
| Measured results | In these models and benchmarks, managed tiers reduce observed overflow terminations; planning and Bash-only do not move every model in the same direction | Figure 3, Tables 3–7 and 12–13 |
| What the evidence does not support | One run per task, component ablations limited to T4/128k, and a bundled interface change do not establish a universal best harness or isolate each interface feature’s causal effect | §§3.1, 6 |
| Bloss0m engineering judgment | Select a candidate component from the local failure pattern, then measure success, cost, and failure stage in paired reruns | Engineering judgment section; this is a local evaluation suggestion, not an author-validated workflow |

## Artifacts and reproducibility

As of 7 October 2026, the arXiv page provides the v1 PDF, HTML, and TeX source bundle. The TeX bundle contains paper tables, figures, and experimental prompts, so readers can inspect configuration details and reported numbers. The arXiv page records only the submitter’s non-exclusive license for arXiv to distribute the paper; it does not grant this article permission to republish the paper’s figures. This reading therefore does not reproduce Figures 1–9. I found no paper-specific executable harness repository or raw benchmark-trajectory dataset. TeX and prompts make the method easier to inspect, but they are not an executable implementation, task containers, or all data needed for a complete rerun.

The experiments were not rerun for this reading; scores, costs, and trajectory analyses are author-reported. A reproduction still requires the relevant benchmark task containers and verifiers, rebuilding the harness loop, and access to the same models and serving conditions. The paper gives prompts, tool descriptions, thresholds, and several execution limits, which can support a close implementation. Without the original executable implementation, however, implementation drift, model-serving differences, and cost accounting may make a reproduction different from a rerun of the authors’ system.

## Limitations: paired comparisons do not span the full design space

Section 6 identifies three main limitations. First, planning is instantiated with one prompt and update mechanism, and context management uses one fixed threshold policy. The action-interface comparison changes tools, interface prompts, workspace-state tracking, and post-edit diagnostics together. Second, planning and the action interface are tested only at T4/128k. A full interaction study would be needed to know whether their effects persist with other management policies and window sizes. Each task-setting pair is run once; Terminal-Bench has only 89 tasks, so many contrasts lack statistical power to reach significance. Third, the conclusions cover three sizes of Nemotron-3, one Mistral model, and two long-horizon coding benchmarks. SWE-Bench Verified is Python-only, and model scale is an imperfect proxy for capability.

It is also useful to separate measured outcomes from behavioral explanation. The authors use paired tests and multiple-comparison correction, but do not repeat runs to estimate run-to-run variance. T4’s low-cost result uses the paper’s token prices and does not include inference infrastructure, hardware, development and maintenance, or human work. These define the evaluation boundary; they do not erase the reported findings.

## Bloss0m engineering judgment: choose what to test from the failure pattern

The following is a **Bloss0m engineering synthesis**, not a deployment workflow tested by the authors. If you are tuning a coding agent, read the findings as clues for forming local hypotheses:

| Failure first observed in the target environment | Candidate intervention to test | Signals to record with it |
| --- | --- | --- |
| Long tasks often terminate from context overflow | Context policies such as T1, T3, or T4 | Overflow rate, success, peak context, summarization cost |
| The model stops during localization before editing | Persistent plan and explicit progress reminders | No-edit rate, localization completion, steps, and cost |
| The model makes many small edits or is proficient with the shell | Bash-only or a different-granularity tool interface | Success, pre-edit failures, tool errors, repeat patches, auditability |
| Average scores barely differ after an intervention | Rerun representative tasks | Per-task variation, task slices, cost, and failure reasons |

Start from the observed failure and change one measurable configuration dimension. For context policy, record overflow and elision, summarization, and recall calls. For planning, record whether runs reach an edit or whether redundant verification falls. For the action interface, retain which errors reach the model, when files change, and how each outcome is verified. Changing every condition at once makes it hard to tell whether a score shift came from a context threshold, prompt, or interface support.

Then run paired, repeated experiments on the actual workload. Success and cost per task are a minimum; also preserve latency, overflow, tool errors, human escalation, and verifier outcomes. For production, include safety policy and recovery in the acceptance conditions. The paper keeps the safety layer fixed and does not compare permission designs. It therefore cannot show that coarser Bash actions are equally safe in your workspace or that benchmark success can replace permission and side-effect controls.

### When not to transfer the result directly

- Your tasks are not long-horizon coding or terminal work, or require a substantially different interface such as a browser, database, or cloud deployment tools.
- Your model differs materially in training, tool familiarity, context window, or reasoning behavior from those studied.
- You need to attribute the independent effect of planning, tool count, pre-edit checks, or post-edit diagnostics; this study does not separate those action-interface features.
- You want to claim high reliability or production safety. One run per task and these limited benchmarks do not support that claim.

For related questions, continue with [AgentPProf: profiling agent behavior from trajectory signals](/en/paper-reading/87-agentpprof-semantic-profiler/) and [MAGS: turning natural-language requirements into checkable specifications](/en/paper-reading/89-mags-autoformalization-safety/). Their tasks and evidence differ; they extend thinking about observation and verification but do not fill in the models, tasks, or harness interactions this paper did not test.

> **Huahua's engineering note**: Context compaction, planning, and the tool interface can all change how far an agent gets. Keep failure stage and cost per task so you can tell whether the model failed to find the right file, the harness stopped too early, or verification still failed after an edit.

## Three things to remember

1. **Context management first extends executable trajectories:** it sharply reduces overflow terminations under small windows; the average success gain narrows as windows grow.
2. **The same component can play different roles:** planning may help a weaker model reach an edit and help a stronger model avoid repeated verification. Whether shell access helps depends on proficiency and task type.
3. **Scores belong to the tested configurations:** one run per task, a limited set of models and benchmarks, and incomplete interaction coverage support local paired evaluations, not a universal harness ranking.

## Primary sources

- Fan, Run-Ze, et al. [An Empirical Study of Harness Design for Coding Agents](https://arxiv.org/abs/2609.20804), arXiv:2609.20804v1, 17 September 2026. Main evidence: Figures 3–9; Tables 3–7 and 12–13; §§2–4, 6; Appendices 7–9.
- [arXiv v1 HTML](https://arxiv.org/html/2609.20804v1) and [PDF](https://arxiv.org/pdf/2609.20804v1).
- [arXiv v1 TeX source bundle](https://arxiv.org/src/2609.20804v1), including the paper source, figures and table sources, and prompt text.

<!-- paper-reading-no-body-figures: arXiv v1 lists only a non-exclusive license to distribute the paper to arXiv, which does not grant figure reuse rights. -->
