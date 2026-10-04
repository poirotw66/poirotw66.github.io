---
title: "GameLogicBench: Testing Coding Agents Against Runtime Game Logic"
description: "GameLogicBench places coding agents inside Godot projects and checks rules at every simulation tick across multiple scenarios and seeds. This reading explains how the benchmark calibrates its judge, what failures it observes, and why its results do not establish reliability for general software agents."
pubDate: 2026-10-04
updatedDate: 2026-10-04
tldr:
  - "GameLogicBench checks runtime state and event history at every tick instead of asking only whether code runs or the final state looks plausible."
  - "Its 72 tasks span Atom, Combo, and Repo integration tiers, with 403 hand-designed scenarios and 1,451 seeded test cases. The best of 20 model–scaffold configurations solved 52.78% of tasks in one observed run."
  - "Of failed scenarios, 74.3% were still runnable but violated a gameplay contract. Removing tick-level checks or testing only the public preview allowed many incorrect solutions to pass."
  - "The evidence is limited to controlled evaluation of Godot 4.4/GDScript gameplay logic; it does not show that benchmark scores predict reliability in other engines, products, or general software-agent work."
audience:
  - "Engineers building or evaluating coding agents, game tests, and behavioral benchmarks"
  - "Researchers checking whether automated tests catch failures during execution"
  - "Technical leads comparing agent models, tool scaffolds, costs, and task scope"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "Research"]
image: "/paperReading/84-gamelogicbench-deterministic-gameplay-evaluation/title_image.webp"
field: "AI Systems"
difficulty: "intermediate"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "GameLogicBench: Evaluating Coding Agents on Runtime Game Logic with Tick-Level State Assertions"
  authors:
    - "Xinyu Che"
    - "Yunfei Ge"
    - "Shihao Li"
    - "Yanchen Liu"
    - "Hang Yan"
    - "Xinping Lei"
    - "Yanghai Wang"
    - "Zixuan Dong"
    - "Yifan Yao"
    - "Qianqian Xie"
    - "Letian Zhu"
    - "Jiaheng Liu"
  year: 2026
  venue: "arXiv:2609.21562 v2 (2026-09-21; preprint; peer-review status unverified)"
  links:
    pdf: "https://arxiv.org/pdf/2609.21562v2"
    arxiv: "https://arxiv.org/abs/2609.21562"
    code: "https://github.com/NJU-LINK/GameLogicBench"
    project: "https://github.com/NJU-LINK/GameLogicBench-Tasks"
series:
  id: "agent-evaluation-runtime-benchmarks"
  title: "Agent Evaluation and Runtime Reliability"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Gameplay rules can be violated at one point and appear satisfied again in the final state. Compilation, a fixed demo, or a terminal-state check can miss that intermediate failure. Asking another language model to grade a game adds cost and makes the verdict harder to reproduce.
- **Core idea:** Express correctness as assertions over observable state and event history at each simulation tick. Replay the same behavioral contract across multiple evaluator-selected scenarios and seeds. The judge targets behavior, so it need not require a particular reference implementation.
- **Strongest evidence:** The benchmark contains 72 Godot gameplay tasks, 403 hand-designed scenarios, and 1,451 test cases. The authors calibrate each judge with proper solutions, behavior-preserving alternatives, naive implementations, and single-capability mutants. Removing either tick-level checks or multiple scenarios lets many mutants pass.
- **Main boundary:** The best model–scaffold configuration solved 52.78% of tasks in one sealed evaluation run. This is not a general capability score. The benchmark covers deterministic gameplay logic in Godot/GDScript; it does not assess art, player experience, network synchronization, other engines, or external validity against real software projects.

The paper starts with a familiar testing trap: code that runs is not necessarily code that preserves a rule. GameLogicBench puts agent-written mechanics into a Godot runtime and checks their state at every simulation tick. The same contract is exercised under several hand-designed scenarios, seed variations, and legal call schedules. The headline finding is not that one model “wins”; most failed submissions actually run but fail to preserve the required behavior. A benchmark can overstate success if it lacks intermediate-state checks, scenario variation, or judge calibration with mutants. The paper offers a concrete design for evaluating behavior over time, while staying within a deliberately narrow gameplay domain.

This reading follows the arXiv v2 preprint updated on September 21, 2026; the paper is not marked as peer reviewed. The figures below are author-reported results, not an independent rerun. Version 2 retains the benchmark’s main claims and core results from v1; this reading uses the current title and the latest limitations discussion.

> **Huahua's engineering note**
>
> A passing test matters only if the test distinguishes correct behavior from plausible mistakes. Inspect how the judge itself was calibrated before comparing agent rankings; otherwise a precise score may precisely measure the wrong thing.

## Runnable code and correct behavior are separated by the whole execution

Gameplay rules often constrain a state as it changes over time. A character may climb a step below a configured height but must not treat a taller obstacle as a step; collisions, cooldowns, jumps, and conserved resources involve multiple objects and successive updates. If an agent only produces code that compiles, or succeeds in one simple preview, the evaluator may never learn whether the rule also holds for a different direction, input order, object layout, or concurrent call.

The prior approach to agent evaluation is not uniformly wrong, but existing game-development benchmark designs leave a specific blind spot (Section 1, Table 1): some replay fixed examples or test terminal states; others grade videos or use a vision-language judge; still others ask an agent judge to interact with and score a submission. The authors argue that these approaches do not consistently combine three properties: multiple evaluator-selected scenarios, runtime-state checks for every task, and a deterministic verdict without a language model in the scoring path. This is the authors’ diagnosis of an evaluation gap. It does not show that other testing methods are useless or that their proposed combination applies unchanged to every software domain.

GameLogicBench divides tasks by integration scope rather than presenting a simple easy-to-hard ladder:

| Tier | What the agent does | Added integration demand |
| --- | --- | --- |
| Atom | Implements one mechanic in a small game built for the benchmark | Isolates one behavior as a basic measurement unit |
| Combo | Combines several mechanics in a benchmark-built game | Rules must hold across time, space, and concurrent calls |
| Repo | Changes a mechanic in an existing Godot project | Requires understanding heterogeneous subsystems and preserving invariants over shared state |

For example, a Repo task asks the agent to rebuild a character controller while preserving the interface used by the rest of the project. The public preview has the character approach one step from the $+X$ direction. A scored scenario may approach from $-X$ and place a wall above the allowed step height farther along the path. The specification stays fixed while the layout and input sequence change. A solution hard-coded to the preview may appear to work without implementing the rule “climb from any direction when the step is low enough, but do not treat a taller wall as a step” (Section 2.1, Appendix F).

## Core intuition: inspect the state trajectory, not the code the author chose

A game updates its state over discrete simulation ticks. GameLogicBench’s judge runs the game at a fixed timestep and applies behavioral assertions to runtime state and event history. One can represent a run as a trajectory $s_0,s_1,\ldots,s_T$, where $s_t$ is the observable state at tick $t$. The task contract requires some values, event orderings, or conserved quantities to satisfy conditions over that trajectory. A judge can then accept different implementations that exhibit the same correct behavior and reject runnable code that violates the contract.

The agent receives a task brief and a Godot project. The brief states behavioral and interface requirements and names the files the agent may modify. It can run the game, inspect the preview, and reseed the public scenario; it is not given every scored scenario or the judge implementation. The evaluator uses the same interface to run a submission across multiple scenarios, seeds, and legal call schedules. Those schedules include concurrent calls, re-entry, and stretched time bases. They alter execution conditions, not the required behavior (Sections 2.1 and 3.1).

![Original paper Figure 1: Observed task success and total inference cost for different model–scaffold configurations; configurations with the same success rate can have different costs.](/paperReading/84-gamelogicbench-deterministic-gameplay-evaluation/figure-1-cost-vs-solve-rate.webp)

*Original Figure 1 (Section 4.1), converted to WebP under CC BY 4.0 with the figure information retained. Each point reports one model–scaffold configuration’s observed solve rate and total cost over all tasks. The frontier is descriptive, not a new ranking rule; the plot does not show that cost causes a change in success. Source: [arXiv v2, Figure 1](https://arxiv.org/html/2609.21562v2#F1).*

## Walk one example through the method: a step-climbing task

The character-controller example illustrates the full path:

1. **Read the brief and project.** The agent learns which files it can edit, the controller interface, and the step-height rule. The public preview demonstrates a step approached from $+X$.
2. **Implement a solution.** The agent may modify the controller using collision queries, movement state, or checks across frames. The benchmark does not require it to reproduce the internal structure of a reference implementation.
3. **Run local experiments.** It can replay the public preview, invoke Godot, or write its own scripts to debug. The paper reports that 99.0% of sessions launched the engine at least once, but this counts a tool action; it does not establish that the local tests covered the full contract.
4. **Submit to the sealed evaluator.** Main-table scores come from runs with egress sealed. The evaluator receives a copy of the agent’s workspace and runs frozen judge files over every scored scenario and seed.
5. **Vary conditions while retaining the contract.** A scenario can approach from the opposite direction, change its layout, or place an over-height wall in the path. Seeds vary scenario parameters. The judge checks the rule against state and event history at each tick.
6. **Return a replayable verdict.** With the same submission, scenario, seed, and fixed judge, the result is the same because the scoring path does not call a language model. Passing means the submission met the assertions in the tested scenarios; it does not prove that every possible game state is correct.

The likely failure point is treating a successful public preview as proof that the rule is implemented. A controller may work only when approaching from one side, or may misclassify a high wall after stepping over a low obstacle. The preview still looks right. Such hard-coding is exposed only if evaluation changes direction, layout, or input while observing runtime state. But the evaluator itself can also be incomplete, so the authors do not rely only on agent outputs: they calibrate the judge as well.

![Original paper Figure 5: As tasks move from Atom to Repo, solve rates fall and mean interaction turns rise; engine use and preview reseeding also vary by tier.](/paperReading/84-gamelogicbench-deterministic-gameplay-evaluation/figure-5-tier-effects.webp)

*Original Figure 5, converted to WebP under CC BY 4.0. Under the Claude Code scaffold, the left panel shows solve rates and turns, the center panel reports engine invocation and preview reseeding, and the right panel groups tool calls by type on a logarithmic scale. These are observed differences across task tiers, not proof that integration scope alone causes the lower success rate. Source: [arXiv v2, Section 4.2, Figure 5](https://arxiv.org/html/2609.21562v2#F5).*

## Method skeleton: human screening, agent-assisted construction, and mutants that test the tests

Benchmark construction is not a matter of handing game requirements to a generative agent and scoring its own generated tests. Figure 3 shows a pipeline with human review at both ends and agent-assisted prototyping, blueprinting, implementation, and review in between (Sections 2.2–2.3):

1. **Source and screen candidates.** Mechanics come from open-source Godot projects, released games, and a taxonomy of functional capabilities. Three human annotators check whether a mechanic can be evaluated through a unique state value, legal event ordering, or a conserved quantity. Tasks that depend on art or subjective experience are excluded.
2. **Prototype the mechanic.** A construction agent compares a proper implementation with a naive one across parameter settings. If the mechanic does not create a clear, repeatable difference, it does not proceed.
3. **Blueprint the task.** A blueprint agent specifies the task, behavior interface, and scenarios, then tests the design. A candidate that can be completed directly from its brief without reasoning about runtime interactions is discarded.
4. **Implement and calibrate.** An implementation agent builds the project and judge, along with a proper solution, naive solution, single-capability mutants, and behavior-preserving control.
5. **Independently review and adjudicate.** A separate review agent reruns every scenario and seed and checks the calibration and information boundary. The three annotators make the final decision about whether the task measures its intended mechanism, fits the benchmark, and adds capability coverage.

![Original paper Figure 3: Tasks move from sourcing and human screening through agent-assisted construction and calibration before admission to the benchmark.](/paperReading/84-gamelogicbench-deterministic-gameplay-evaluation/figure-3-benchmark-construction.webp)

*Original Figure 3, converted to WebP under CC BY 4.0. The figure depicts the construction and review process; it does not mean the process has been independently reproduced by an outside team. Source: [arXiv v2, Sections 2.2–2.3, Figure 3](https://arxiv.org/html/2609.21562v2#F3).*

The authors began with roughly 200 candidate ideas. 122 completed construction, calibration, and agent review; 72 were admitted. This funnel makes the benchmark’s task count conditional: it is not a random sample of gameplay mechanics, but a set retained because its behavior could be deterministically checked, its task could run to completion, and its judge could discriminate between correct and incorrect implementations. That improves measurability while also defining which problems enter the benchmark.

Each calibration program answers a different question:

| Calibration artifact | What should happen | What a contrary result signals |
| --- | --- | --- |
| Proper solution | Pass every scenario and seed with margin from the tolerance boundary | The criterion may be too strict, the environment unstable, or the reference incomplete |
| Behavior-preserving control | A different implementation with the same observable behavior should also pass | The judge may favor an implementation detail instead of the required behavior |
| Naive solution | A common-logic-error implementation should fail | Scenarios may not distinguish even an obvious incorrect strategy |
| Single-capability mutants | Removing one named capability should be caught by at least one scenario | The claimed capability may lack a corresponding effective check |

The idea is not “more tests are always better.” Correct alternatives test the acceptance boundary; mutants test the rejection boundary. Showing that a correct implementation passes does not show that incorrect ones will be caught. Conversely, making one bad implementation fail does not show that the judge accepts every valid alternative.

## Experimental setup: tasks, scenarios, models, and scaffolds

The library contains 21 Atom, 28 Combo, and 23 Repo tasks, spanning 12 game genres. In total, the tasks use 403 hand-designed scenarios and 1,451 test cases. Each task has 2–12 scenarios and 10–38 cases; each scenario can generate cases with varying numeric parameters through seeds. Repo tasks average 209 game files and 17,599 lines, with substantial variation in project size (Table 2, Figure 4).

The main evaluation runs each of 20 model–scaffold configurations once. The three scaffolds are Claude Code 2.1.177, Codex 0.144.1, and OpenCode 1.17.18. Both solving and judging use Godot 4.4; sessions use effort=high and a 3,600-second limit. The solver container blocks outbound access except to the model API. The judge runs separately without network access. This is a single-observation comparison for each configuration in the main table, not a repeated estimate of every configuration’s variation.

| Result slice | Author-reported result | Scope for interpretation |
| --- | --- | --- |
| Best overall configuration | Claude-Opus-5 with Claude Code: 52.78% average solve rate; 61.90% Atom, 53.57% Combo, 43.48% Repo (Table 3) | One sealed run on these 72 tasks and this scaffold version; not a model-only capability measure |
| Tier gradient | Nearly all configurations decline from Atom through Combo to Repo | Direction is consistent, but magnitude varies and the tiers also contain different tasks and projects |
| Model and scaffold | Qwen-3.8-Max solve rates range from 26.39% to 44.44% across scaffolds | Compare model–scaffold pairs; do not assign all observed differences to the model |
| Cost variation | Equal solve rates differ by up to 25× in cost; endpoints of the cost frontier solve 31.94% and 52.78%, with a 123× cost gap | Author estimates use model-vendor prices and all tasks; prices and caching affect transfer |
| Tool activity | 99.0% of sessions launched the engine at least once; 39.2% ran a custom Godot test script | A tool call is evidence of activity, not evidence that the rule was adequately tested |

Figure 1’s solve-rate versus cost plot warns against treating “more expensive” and “more capable” as one ranking: configurations with the same score can have very different costs, and the best result also has a high cost. The dollar estimates use prices reported by the authors for the evaluation period. They help explain this experiment’s trade-offs; they should not be copied into a budget for a different date or deployment. Table 3 reports only one main observation for each configuration and cannot estimate its repeat-run variation.

## The key diagnosis: most failures run, but violate behavior

Across all 20 configurations and task tiers, 74.3% of failed scenarios are classified as mechanism failures: the submission runs and can be judged, but violates the behavioral contract. Another 17.2% have no judgeable solution, and 8.5% are nonviable computations. The denominator is failed scenarios; this is not “74.3% of every submission is wrong,” nor a production defect rate (Section 4.5). The engineering implication is that better success cannot be pursued only through syntax, startup, or code generation. The entire execution must preserve the intended rules.

The authors predefine seven capability classes, including Engine contract, Commitment, Spatial, and Timing; scenarios may belong to more than one. A strict pass for a class requires all seeds for the scenario to pass. Figure 8 shows Engine contract ranking highest in 19 of 20 configurations, with a pooled strict pass rate of 88.75%. Commitment, Spatial, and Timing are among the weakest classes in most configurations, with pooled rates around 53.4%–58.57%. The authors interpret this as evidence that basic familiarity with Godot’s clock, solver, and time base is usually not the main bottleneck; maintaining commitments, spatial relations, and timing rules is harder.

Appendix B’s seven labels are an evaluation taxonomy, not a complete theory of game-playing intelligence. **Intention commitment** covers carrying a decision across frames and resisting dithering; **Resource accounting** covers shared scarce pools, allocation, and conservation; **Spatial navigation and steering** includes position, orientation, reachability, avoidance, and contact classification; **State machine** covers transitions, lifecycles, and inherited state; **Timing** includes frame- or second-scale windows, cooldowns, cadence, and temporal invariants; **Arbitration** concerns priority, yielding, and deduplication among competing claims; **Engine contract** checks the correct use of the engine clock, solver, time base, and subsystem semantics (Table 7). These classes overlap, so a task should not be forced into one exclusive skill bucket or read as a clean league table of independent abilities.

![Original paper Figure 8: Strict scenario pass rates across seven capability classes and 20 model–scaffold configurations.](/paperReading/84-gamelogicbench-deterministic-gameplay-evaluation/figure-8-capability-failures.webp)

*Original Figure 8 (Appendix B), converted to WebP under CC BY 4.0. A strict pass requires every seed for that scenario to succeed; classes can overlap, and a preview baseline is shown separately. It locates weaknesses in this benchmark and does not show that every programming task is limited by Commitment, Spatial, or Timing. Source: [arXiv v2, Appendix B, Figure 8](https://arxiv.org/html/2609.21562v2#A2.F8).*

### Two evaluator ablations ask whether incorrect solutions slip through

On the same 36-task audit set, the authors keep tasks and submissions fixed but change the evidence available to the evaluator (Table 5). `Terminal-only` retains all scenarios and seeds but checks only terminal-state assertions. `Preview-only` retains the full tick-level criterion but evaluates only the public preview scenario.

| Evaluation setup | Mutants that escape | Tasks with escapes | Incorrect solutions changed to PASS | Mean solve-rate change |
| --- | ---: | ---: | ---: | ---: |
| Terminal-only | 236 / 666 (35.4%) | 34 / 36 | 64 / 488 (13.1%) | +8.9% |
| Preview-only | 508 / 666 (76.3%) | 36 / 36 | 418 / 488 (85.7%) | +58.1% |

These controlled comparisons support two distinct conclusions. First, terminal-only grading can miss a violation that occurs during execution and disappears by the end, even when many scenarios and seeds are retained. Second, a single public preview can reward code hard-coded for the demo, even if it checks every tick. These are evaluator-design ablations on the authors’ tasks and submissions; they are not improvements from training a new model, and the effect sizes should not be assumed for every testing domain.

A separate construction ablation compares correct solutions with mutants. Under the original criteria without mutant validation, 127 of 666 mutants passed, exposing 24 missing checks across 19 of the 36 tasks. After repairs, a comparison involving nine models and two scaffolds changed three task outcomes from PASS to FAIL; proper solutions and behavior-preserving controls still passed (Section 4.6). This shows that the mutant gate changed scoring in this benchmark pipeline; the study does not measure how much adopting the same process would cost another organization.

### Open network access creates another source of evaluation contamination

Because Repo tasks derive from public projects, the authors ran five configurations on the Repo tier with and without outbound network access. They searched trajectories for URLs, queries, and shell commands, then manually inspected returned content. Four configurations retrieved upstream code; reviewed traces included direct reuse. All four configurations had higher Repo scores with open-network access than when sealed (Section 4.7, Figure 7). The authors’ point is that a Repo benchmark score depends not only on what its tests reject, but also on whether the agent can retrieve the source material from outside the task.

This is an observation about specific upstream-derived tasks and five configurations. It does not mean all web access is cheating, and it does not mean an open-network score is a pure measure of improved ability. Researchers should state their network policy, task provenance, and accessible information. If real development permits searching public documentation and source, then network access is part of the task conditions and should be disclosed rather than hidden.

## Evidence map: what is measured and what remains extrapolation

| Paper claim | Supporting evidence | What it supports | What it does not establish |
| --- | --- | --- | --- |
| A deterministic tick-level multi-scenario judge can catch some runtime violations | Table 5 compares Terminal-only, Preview-only, and full evaluation on the same 36-task set | Removing checks allows more incorrect solutions through in this task and mutant set | The same effect in general software tests, other engines, or production failures |
| Runtime behavior errors are common in this benchmark | Failure classification across 20 configurations; 74.3% of failed scenarios are runnable but violate behavior | Largest failure class within the stated denominator and benchmark | Failure prevalence in real game teams or all coding agents |
| Larger integration scope is harder | Tiered results in Table 3 and turns/tool activity in Figure 5 | Nearly all configurations perform worse on Repo than Atom here | That task scope alone causes the effect; tasks and projects differ across tiers |
| A model cannot be ranked apart from its scaffold | Model solve rates change across interfaces in Table 3 | Measurements apply to concrete model–scaffold pairs | A universal scaffold ordering across models, tasks, and versions |
| Public source retrieval can contaminate Repo scores | Four of five tested configurations retrieved upstream code, and their open-network Repo score increased | Network policy changed evaluation conditions for the inspected runs | All network access invalidates evaluation, or open sources should always be blocked |

The strongest evidence consists of observations inside a controlled benchmark, rescoring ablations on fixed tasks, and author inspection of tool traces. It is not an independent cross-organization reproduction, an industry deployment study, or a transfer experiment across engines. The 20 model–scaffold configurations broaden the comparisons, but the main table has one run per configuration; small score differences are not stable statistical rankings. Three configurations have three repeats. Their pass@3 and worst@3 results differ by 26.39–36.11 percentage points (Table 4), illustrating repeat instability without estimating it for every model configuration.

## Limits and tempting overclaims

First, the target is whether an implementation preserves deterministically checkable gameplay mechanics, not overall game quality. Art, narrative, content depth, and player experience are deliberately outside the assertions. The paper’s future-work discussion suggests longer interactions and additional runtime signals; those are not capabilities validated by the current benchmark (Section 6, Limitations).

Second, the benchmark uses Godot 4.4 and GDScript. Repo task composition reflects runnable open-source Godot projects, and the single-container harness does not test network synchronization. These limits constrain external validity. The 52.78% result should not become “top coding agents succeed only half the time on real software projects.”

Third, a deterministic verdict does not guarantee representative tasks or complete assertions. A fixed judge can produce the same verdict every time while consistently missing an important state. Multiple scenarios, seeds, correct alternatives, naive solutions, and single-capability mutants are the authors’ calibration strategy; they are not a formal proof that no unknown incorrect implementation can pass.

Fourth, model comparisons combine scaffold, tool behavior, prices, versions, and model selection. The reported costs use vendor prices collected by the authors for their evaluation period. A newer release, changed caching policy, API discount, or different hardware can change the dollar comparison. A single run is not a permanent ordering of model capability.

Fifth, the authors treat retrieval from public sources as a possible source of score inflation in a sealed benchmark, which is reasonable for that evaluation goal. In actual development, however, searching public documentation and upstream code may be explicitly allowed. A benchmark should set network policy to match the question it intends to answer and record what information was available to the agent.

## Artifacts and reproducibility

As of October 4, 2026, the [benchmark code repository](https://github.com/NJU-LINK/GameLogicBench) and the [72-task library](https://github.com/NJU-LINK/GameLogicBench-Tasks) are publicly browsable; the main-branch revisions inspected that day were [`d9854d6`](https://github.com/NJU-LINK/GameLogicBench/tree/d9854d616e4f7beaa6c4321b7c8452c6509e41c2) and [`18c54e6`](https://github.com/NJU-LINK/GameLogicBench-Tasks/tree/18c54e69cf962fd402e245811d4925d129f4b33c), respectively. The task-library README describes each task as a Godot 4.4 project with a frozen judge and reference solutions; Repo tasks include their upstream licenses and source-change notes. At inspection time, neither repository had one top-level license file covering the entire repository, so public visibility should not be read as blanket reuse permission. Running the benchmark requires Docker, Godot task environments, and model-provider access or substitutes. Reproducing the reported cost also requires matching model/scaffold versions, price conditions, and network isolation.

This article did not install the environment or rerun the benchmark; all results are the authors’ reports in arXiv v2. The current public repository branches are useful starting points, but a reproduction should first pin code and task commits that match the paper, inspect the upstream licenses for each Repo task, and follow the README for Docker, Godot, model API, and network isolation. This reading does not claim that the current main branches exactly reproduce the paper’s experimental snapshot. Even a close numerical replication would be evidence for the same setup, not proof that this benchmark predicts reliability in real products.

## Bloss0m engineering judgment: measure “runs” and “keeps the contract” separately

The following is a Bloss0m engineering interpretation, not a universal standard proposed by the authors. If an agent controls a stateful workflow, ask three questions before choosing an evaluation design. First, is the result observable and specified? If correctness depends mainly on aesthetics or user experience, deterministic state assertions are insufficient. Second, can an important invariant break during execution and be hidden by the final state? If so, record the trajectory or key events rather than asserting only the end state. Third, can the test set defeat code tailored to a public preview? Vary legal directions, parameters, layouts, call schedules, or seeds, and use incorrect variants to test whether the assertions have real discriminating power.

This does not mean every system needs 1,451 cases or a game engine. A small set of representative high-risk cases may control cost better than indiscriminately multiplying scenarios. For APIs, databases, permissions, or collaborative workflows, replace the game-specific objects with appropriate service boundaries and side effects; do not transplant tick semantics without justification. If the task only checks a stateless input–output transformation, ordinary unit tests may be more suitable. If a rule is subjective, unobservable, or impossible to reconstruct reliably in a test environment, deterministic grading should not be treated as complete acceptance.

The most useful engineering lesson is to treat the judge as software that needs its own validation. A test suite should not only let a correct solution pass; it should also catch targeted wrong variants while accepting behavior-preserving alternatives. Without these checks, more test cases may simply confirm the test designer’s assumptions more often.

## Three things to remember

1. **Technical idea:** A fixed Godot timestep exposes state and event history so the same behavior contract can be checked across varied scenarios and seeds.
2. **Evidence:** 72 tasks, 403 scenarios, 1,451 cases, and mutant calibration support the benchmark’s failure analysis. The 74.3% figure is the share of failed scenarios that remain runnable but violate behavior; 52.78% is one observed run for a model–scaffold configuration.
3. **Adoption boundary:** Reuse the evaluation and judge-calibration ideas, but do not project Godot gameplay results onto the real-world reliability of general coding agents.

## Further reading

- [Agents are systems, not models: Rethinking agentic evaluation](/en/paper-reading/83-agents-are-systems-not-models-agentic-evaluation/): Agent evaluation across model, scaffold, task information, and run-to-run variation.
- [When Is Complex Chunking Worth It?](/en/paper-reading/72-when-is-complex-chunking-worth-it/): Another systems-evaluation case that separates conditions, cost, and adoption limits.
- [Interleaved Tool Use: Mid-Tool Reasoning](/en/paper-reading/23-midtool-agentic-tool-use/): Extends the discussion to tool-call contracts, external state, and execution consequences.

## Primary sources

- Che et al., [GameLogicBench: Evaluating Coding Agents on Runtime Game Logic with Tick-Level State Assertions](https://arxiv.org/abs/2609.21562), arXiv v2, September 21, 2026. Figure anchors: [HTML full text](https://arxiv.org/html/2609.21562v2) and [PDF](https://arxiv.org/pdf/2609.21562v2).
- [Benchmark code repository](https://github.com/NJU-LINK/GameLogicBench) · [Task library](https://github.com/NJU-LINK/GameLogicBench-Tasks).
- Paper license: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
