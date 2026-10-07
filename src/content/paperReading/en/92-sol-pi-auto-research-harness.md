---
title: "SoL-Pi: Recursively Scaling Auto-Research Loops for Efficient Agent Harness"
description: "SoL-Pi treats harness improvement as a family of auto-research loops with frozen metrics, capability gates, and independent validation. This reading explains the four retained mechanisms, the held-out design, author-reported token and cost estimates, and the limits of transfer and deployment claims."
pubDate: 2026-10-07
updatedDate: 2026-10-07
tldr:
  - "SoL-Pi searches for changes around a fixed model: candidate lines use frozen capability tolerances and efficiency metrics before accepting a harness change."
  - "Its four retained mechanisms act on tool calls, compaction after completed subtasks, large tool outputs, and evidence extracted from long build or test logs."
  - "On 51 EdgeBench tasks, the authors report 44.7–49.0% less recorded token traffic and about one-third lower estimated API cost for the complete efficiency configuration. These prices are calculated from recorded traffic, not live bills or an independent rerun."
  - "The mechanisms found with GPT-5.6 Sol were applied to Opus 5 without more search. This is bounded evidence for transfer to one additional backend, not a guarantee across models, tasks, or prices."
audience:
  - "Engineers building or evaluating long-running coding and tool-using agents"
  - "Researchers studying harness search, agent efficiency, and held-out evaluation"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "Research"]
topics:
  - agent-evaluation-observability
  - agent-systems
field: "AI Systems"
difficulty: "advanced"
showToc: true
image: "/paperReading/92-sol-pi-auto-research-harness/title_image.webp"
paper:
  title: "SoL-Pi: Recursively Scaling Auto-Research Loops for Efficient Agent Harness"
  authors:
    - "Haozhe Liu"
    - "Tian Ye"
    - "Sensen Gao"
    - "Qihang Cao"
    - "Yitong Li"
    - "Mingchen Zhuge"
    - "Duomin Wang"
    - "Ruihua Zhang"
    - "Ping Luo"
    - "Jiawang Bian"
    - "Lei Zhu"
    - "Ligeng Zhu"
    - "Enze Xie"
    - "Song Han"
  year: 2026
  venue: "arXiv:2609.20519 v1 (2026-09-17; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.20519v1"
    arxiv: "https://arxiv.org/abs/2609.20519"
    code: "https://github.com/NVlabs/SoL-Pi"
    project: "https://nvlabs.github.io/SoL-Pi/"
series:
  id: "agent-harness-efficiency"
  title: "Agent Harness and Efficiency"
  part: 1
  totalParts: 1
---

<!-- paper-reading-no-body-figures: The arXiv v1 paper does not state a permissive license for reusing its figures. The source figures remain linked in the text; no body image is republished without permission. -->

## The paper in 90 seconds

- **Problem:** Long-running agents spend tokens beyond the model's answers: they replay history, handle large tool outputs, repeat calls, and read long logs. These costs are spread across the harness, so a local change may save tokens in one place while weakening capability or moving work downstream.
- **Core insight:** Treat harness improvement as a set of scalable auto-research loops. Each line analyzes trajectories, proposes and implements a candidate, and evaluates it in development environments. A candidate must satisfy frozen capability tolerances and improve at least one predeclared efficiency metric. Final evaluation stays outside the search loop.
- **Strongest evidence:** The authors report roughly 150 improvement directions, 535 executable search environments, more than 3,000 runs, and over 60,000 agent–environment interactions. On 51 EdgeBench tasks, the four-mechanism efficiency configuration changes GPT-5.6 Sol's average score from 44.833 with Pi to 42.003, recorded token traffic from 2.1538B to 1.0990B, and author-estimated token cost from $1,339 to $894 (Sections 2–3, Tables 1–4).
- **Main boundary:** Eleven EdgeBench tasks serve as a one-way acceptance check for frozen candidates; the other 40 are reserved for final evaluation. Results do not feed back into search. The main efficiency comparisons are author-reported traffic and price-based estimates, not live provider bills or an independent rerun. The full stack retains 93.7% of Pi's average score on GPT-5.6 Sol, so efficiency must be read alongside capability.

SoL-Pi places its self-improvement target outside the model: model weights stay fixed while auto-research loops change how the harness executes tools, manages context, and handles observations. This design addresses two practical problems. Harness components interact, so a local token saving may shift cost to a later stage. And when search repeatedly modifies a system using task traces, it can mistake development-specific patterns for reusable improvements. The authors separate candidate development from final evaluation: they search across executable environments, freeze candidates, and then evaluate on an EdgeBench split that does not return results to search. Four mechanisms survive selection: Action Fusion, Online Context Compact, ObservationPack, and Evidence-Preserving Reducer. The paper presents a system for searching under capability constraints. Its results support lower recorded traffic and estimated cost on the selected workloads; they do not establish a scaling law in which larger research loops always produce further efficiency gains. This reading follows the arXiv v1 preprint submitted on 17 September 2026.

## The research question: how can search widen without letting the test set guide candidates?

A coding agent's harness includes the execution policies around its model: which tools are available, how tool outputs enter context, when context is compacted, whether failures are retried, and when the task ends. These policies affect model-call counts, repeated text, and the diagnostic evidence retained across a task. Unlike reducing the cost per token, routing to a smaller model, or compressing model weights, SoL-Pi studies another layer: hold the underlying model fixed and change how it interacts with its environment (Section 1).

## Why previous harness-search approaches still need held-out evaluation

Tools, context, verification, delegation, recovery, and stopping rules interact inside a harness. A change that saves tokens on one development workload may fail to preserve completion ability elsewhere. Prior approaches to harness evolution have also reported that gains on search tasks may shrink to limited gains on held-out tasks when candidates are repeatedly revised against the same task pool. Manually reading long trajectories and translating them into code changes is difficult to scale across enough environments (Sections 1 and 4.2). SoL-Pi's answer is not to assume that a search process will generalize by itself. It uses multiple development environments and keeps one-way acceptance checks and the remaining final test outside search after candidates are frozen. This isolation reduces direct tuning against held-out outcomes, but it does not prove transfer to every unseen task.

Here, “recursive” first describes how the auto-research loop is organized. A research AI observes traces from the base harness; analyzers identify repeated calls, context growth, large outputs, or weak diagnostic signals; and an optimizer proposes and changes the harness. This is not model-weight training, and it is not proof of indefinite self-improvement. In the limitations section, the authors describe a cheaper harness enabling a broader next research cycle as future work (Section 5.1).

## Core intuition: freeze how much capability may change before reducing repeated work

If token count is the only objective, a search process could lower traffic by calling fewer tools, stopping early, or dropping observations the agent needs. SoL-Pi first fixes capability metrics and acceptable tolerances, then fixes a set of efficiency metrics. A candidate must pass two gates:

1. Every capability metric stays within its predeclared tolerance.
2. At least one declared efficiency metric improves.

Candidates that pass both gates are retained as nondominated results under the declared metrics. In simple terms, no other qualifying candidate can be as good or better on every objective and strictly better on at least one. The optimizer itself does not control the acceptance criteria, which limits its ability to game the target. Integration still follows candidate selection: the mechanisms are combined and their implementation and parameters are refined while capability remains under review (Section 2.1).

**Engineering interpretation:** This design turns “preserve capability” into a search constraint rather than a reminder outside the leaderboard. Its guarantee is limited to the capability metrics, tolerances, and task distribution actually measured. It does not automatically protect safety, latency, service reliability, tool side effects, or unmeasured work quality.

## How the method runs: 152 directions, 535 search environments, and a separate evaluation pool

The outer search starts with 152 proposed directions in six families: context, progress, tools, delegation, prompt and policy, and improvement and evaluation. These labels describe where an idea came from; they do not constrain where it is implemented. ObservationPack, for example, starts from two context hypotheses but changes the boundary at which observations enter context. Each direction must identify a concrete source of overhead and a testable change. The search lines are independent, so an unpromising idea can stop without affecting other experiments (Section 2.2).

An inner research line follows a cycle: propose a change, implement it, run a fixed experiment, inspect the result, and retain, revise, or discard the candidate. The authors add an explicit completion criterion and independent code review. One iteration can produce multiple execution trajectories. Separate analyzers look for repeated actions, context growth, large observations, or sparse diagnostics; a reducer combines these findings into a summary for the next proposal. Each line copies a shared skill template, runs with its own parameters and candidate, retains evidence, and discards modified orchestration code. Across the search, the authors report about 150 directions, 535 environments, more than 3,000 runs, and over 60,000 interactions. They explicitly say these counts describe search scope; they do not establish a scaling law (Section 2.2).

The search set contains 535 executable environments in two groups. The 495 repository-derived tasks pair a GitHub issue with a pre-fix repository state and offline dependencies. The accepted patch and regression test are hidden from the agent, and the authors retain tasks only when the test fails before the patch and passes afterward. The other 40 are verifier-driven synthetic tasks: an executable success condition is written first, and then the task is built around that verifier. These tasks permit multiple valid solution paths rather than requiring the agent to match one reference patch (Section 2.3, Figure 3).

The 51 public EdgeBench tasks are separate from the search pool. The paper says 11 tasks are used for one-way acceptance checks of frozen candidates, while the remaining 40 are reserved for final generalization evaluation. The candidate and acceptance rule are frozen before evaluation; a failed check rejects the candidate without sending the result back for targeted optimization (Sections 2.1, 2.5). Thus “held out” does not mean all 51 tasks have the same role: the 11-task slice is a one-way acceptance check, and the 40-task slice is the remaining final test.

### Worked example: following Action Fusion from a trace to a retained mechanism

The authors use Action Fusion to show how a mechanism moves from an observation to selection. Oracle Analysis finds that editing a file and immediately running a test or build are common adjacent actions. It projects an 11.5% token reduction under full triggering, which motivates a dedicated search line. Prompt-only triggering proves unreliable. The research line then exposes a fused action directly through the tool schema and refines its prompt and schema on development tasks. Trigger rate is added as an intermediate metric alongside task score; the final configuration is frozen and retained after held-out validation (Section 3.5, Figure 8).

The case shows that an efficiency mechanism need not be only a prompt change: the tool interface can make an operation explicit, while trigger rate helps the research line determine whether the model uses it. The 11.5% is projected from observed adjacent actions under the assumption that every such opportunity triggers; it is not a measured saving across all tasks.

## Four retained mechanisms: change the data path without replacing the main model's judgment

The four mechanisms operate at different points in the agent–environment loop. The original illustration appears in [Figure 4 of the arXiv v1 paper](https://arxiv.org/html/2609.20519v1#S2.F4). This reading links to the source but does not republish the image because the version does not state a figure-reuse license.

### Action Fusion: combine an edit and its follow-up check in one tool request

Base Pi often edits a file and then makes a separate call to run a test, build, or command. Action Fusion allows a file-mutation tool to include an optional follow-up command and returns both outcomes in one tool request, removing an intermediate model round trip. If the next command needs to inspect the mutation result and decide what to do from it, the two operations should remain separate (Section 2.4).

### Online Context Compact: reconsider compaction at completed subtask boundaries

This mechanism does not compact whenever a fixed token threshold is reached. When the agent completes a plan step, the harness estimates remaining model requests from the observed number of requests between completed steps and the unfinished steps. It caps that estimate by how many requests would fill the current context window at the observed growth rate. Then it compares projected input savings with the estimated cost of rewriting the prompt cache. Later compactions also account for unrecovered rewrite costs, so they need a larger savings margin. If the context approaches its limit and compaction can shorten it, the harness can still invoke Pi's native compaction under that pressure condition (Section 2.4).

The implementation estimates rewrite cost from the cache read/write price ratio, but the paper says the gate does not separately price the summarization call. This is a cost decision for a particular cache price and usage pattern, not a universal formula for every provider or cache strategy.

### ObservationPack: keep exact large outputs retrievable instead of resending them

Large tool results above 10 KiB are stored in a local archive. The next two provider requests still receive the full result. Starting with the third request, the model receives a stable handle, the original size, and a short excerpt of complete head and tail lines, about 1 KiB. When the agent needs exact content, it can retrieve the original through the handle page by page. Smaller outputs stay unchanged (Section 2.4).

The key separation is between a preview in context and a retrievable original. If the agent decides from the preview alone, it can still miss a relevant line. Exact recall provides a path to the full result, but it does not ensure that the model knows when to use it.

### Evidence-Preserving Reducer: compact logs while keeping verifiable evidence

The reducer handles only outputs of at least 4 KiB from a predefined set of build and test commands. File reads and search results bypass it. The harness archives the original output and asks the lower-cost GPT-5.6 Luna (high) model to extract a concise evidence receipt. A deterministic verifier checks the receipt schema, source hash, exit status, exact quotations, and whether the receipt is actually shorter. If verification fails, credentials are suspected, or the receipt does not reduce size, the harness falls back to the original log. A marker on the receipt tells ObservationPack to skip it, preserving the verified evidence (Section 2.4).

This design separates two responsibilities: an auxiliary model selects evidence that may matter, while the main model still diagnoses and chooses the next action. Deterministic checks can verify that quotes appear in the source, that the exit status and format are correct, and that the receipt is shorter. They cannot prove the receipt contains every detail the main model will need. The fallback and original archive are therefore safeguards, not a guarantee that compression is lossless.

## EdgeBench results: token savings and retained score are separate objectives

At the time of the paper, EdgeBench released 51 of its 134 tasks publicly; the authors compare harnesses on those 51. They search the mechanisms with GPT-5.6 Sol, then apply the same complete efficiency configuration to Opus 5 without further search or adaptation. The main report includes recorded token traffic (ordinary input, cache read, cache write, and output), token cost calculated with fixed API prices, average score, and cost per score point. The paper notes that its API prices are those of 17 August 2026 (Section 3.1, Table 1).

| EdgeBench configuration | Average score | Recorded token traffic | Author-estimated token cost | Cost per score |
| --- | ---: | ---: | ---: | ---: |
| GPT-5.6 Sol + Pi | 44.833 | 2.1538B | $1,339 | $0.5855 |
| GPT-5.6 Sol + SoL-Pi Efficiency | 42.003 | 1.0990B | $894 | $0.4174 |
| Opus 5 + Pi | 44.756 | 2.3697B | $1,741 | $0.7625 |
| Opus 5 + SoL-Pi Efficiency | 42.224 | 1.3101B | $1,158 | $0.5376 |

The traffic and dollar values are reported by the paper's authors from recorded experiment data and fixed prices. They are not provider invoices obtained for this article, nor independent payment records reproduced with the same APIs, price snapshot, and environments. With GPT-5.6 Sol, the full stack records 49.0% less traffic and about 33.2% lower token cost than Pi, while retaining 93.7% of Pi's average score. With Opus 5, the reported differences are 44.7% less traffic and 33.5% lower estimated cost, while retaining 94.3% of Pi's average score (Table 2). The efficiency configuration therefore means “less recorded traffic with a slightly lower average score,” not “the same capability at a guaranteed lower bill.”

The authors also report a single-mechanism Performance point. Under GPT-5.6 Sol, Pi plus ObservationPack scores 47.208, a 5.3% gain over Pi, with 6.1% less token traffic and a 9.8% improvement in token efficiency. Under Opus 5, Action Fusion is the highest-scoring single mechanism at 50.482. These are backend-specific highest-scoring single-mechanism configurations, not the same fixed four-mechanism stack or a universal shared configuration. This distinction prevents the best-score candidate from being conflated with the lowest-traffic candidate (Tables 1, 2, and 4).

Applying the GPT-5.6 Sol configuration to Opus 5 provides a cross-backend check, but only within the paper's tested setup. Figure 6 shows lower trigger rates and lower activation intensity per triggered task on Opus 5; the authors suggest this may reflect searching exclusively on GPT-5.6 Sol trajectories. Efficiency improves on Opus 5 tasks where mechanisms trigger, but an aggregate score–efficiency result may hide which tasks activate a mechanism. This is evidence of limited transfer between two evaluated backends, not evidence of general transfer across model families or untested harnesses (Section 3.4, Figure 6).

## Diagnostic evidence: mechanism composition may help, but the component comparisons do not isolate interaction effects

Table 4 compares Pi plus one mechanism at a time with the full SoL-Pi stack. All four mechanisms reduce recorded token traffic in the GPT-5.6 Sol and Opus 5 blocks. The complete stack has the lowest total traffic and the lowest author-estimated token cost in each backend block. For GPT-5.6 Sol, cache-read traffic falls from Pi's 2.1326B to 1.0605B tokens, while cache-write traffic rises from 0.0141B to 0.0316B. After accounting for the cached-input price, estimated token cost still falls from $1,339 to $894 (Table 4, Section 3.4). This is why a single cache hit or cache-read statistic cannot stand in for total task cost.

Figure 7 compares each single-mechanism configuration with the complete stack. The authors observe a larger token-efficiency gain for every mechanism on its own triggered-task subset in the full stack, while ObservationPack activates more selectively. They consider this pattern consistent with complementarity and suggest possible overlap between ObservationPack and Evidence-Preserving Reducer on observation-heavy trajectories. However, each configuration is evaluated on its own triggered-task subset and corresponding disabled baseline. This is not a factorial experiment on the same task set, so it cannot estimate independent interactions or establish that the four mechanisms cause an additional combined gain (Section 3.4, Figure 7).

### Additional benchmarks and a limited swarm result

On 63 CPU-only Terminal-Bench 4 tasks, Pi and Codex each solve 18 tasks, while SoL-Pi solves 15. Relative to Pi, the authors report lower total model cost for SoL-Pi, $211.12 versus $286.45, and lower cost per solved task, $14.07 versus $15.91. GPU-dependent tasks are excluded due to infrastructure limits. The result makes the efficiency–capability trade-off visible: total cost is lower, but so is the number of solved tasks. Reporting only the per-solved-task cost would omit that difference (Section 3.2, Table 3).

For six IMO 2026 problems, using GPT-5.6 Sol at xhigh and requiring Lean 4 verification, SoL-Pi passes three problems at a total reported model cost of $62.69, or $20.90 per passed problem. Pi also passes three, at $75.95 total and $25.32 per pass; Codex passes five, at $114.47 total and $22.89 per pass. Each problem is capped at 150 minutes, and the reported costs include model activity within that limit. With only six problems, cost per pass describes this run; it does not estimate a stable cost for mathematics tasks in general (Section 3.2, Table 3).

The kernel-optimization swarm comparison includes one two-hour run per configuration. A single Codex agent reaches 1,333 simulated cycles at $39.20. A Codex coordinator with 20 Pi workers reaches 1,366 cycles at $82.12. A coordinator with 20 SoL-Pi workers reaches 1,127 cycles at $60.11. All final candidates pass the official correctness check; the Pi swarm misses the last speed threshold, while the SoL-Pi swarm and the single agent pass all eight (Section 3.3, Figure 5). This shows what one run achieved: the SoL-Pi swarm spent less and found a lower cycle count than the Pi swarm. It does not show that SoL-Pi cost less than a single agent, and the single runs do not estimate run-to-run variance.

## Evidence map: which results are measured, and which remain a vision?

| Claim | Main evidence | Supported reading | Open question |
| --- | --- | --- | --- |
| Auto-research selects four reusable harness mechanisms | 152 directions, 535 environments, over 3,000 runs and 60,000 interactions; Sections 2.2–2.4 | The process produced these mechanisms under the authors' development environments and gates | Would the same search effort reliably find them, and how does search cost scale with direction or environment count? |
| The complete stack reduces recorded traffic | Tables 1–2 on 51 EdgeBench tasks | Traffic falls in the tested setups while average score remains close to Pi | How do results vary across repeated runs, other models, unreleased tasks, latency, or reliability? |
| Combining mechanisms may be complementary | Tables 4 and Figures 6–7 | Descriptive results on triggered-task subsets are consistent with complementarity | What are the interactions under a fixed task set, and what is their causal contribution? |
| There is some evidence beyond one benchmark | Terminal-Bench 4, IMO 2026, and kernel swarm; Sections 3.2–3.3 | Author-reported results across several workloads motivate further evaluation | Can the different benchmarks, model budgets, and single swarm trials predict deployment outcomes? |
| A cheaper harness could broaden the next research loop | Section 5.1 on recursive efficient improvement | This is an author-proposed research hypothesis and future direction | The paper does not demonstrate several rounds in which savings fund broader search and produce another gain |

Keep three voices distinct when reading these results. The authors report measured scores, recorded traffic, and dollar estimates calculated using fixed prices. The data supports observations within those tested conditions. The idea that a more efficient auto-research process will recursively reduce the cost of the next search is a proposed direction, not an effect demonstrated by this experiment.

## Limitations and interpretations the paper does not support

1. **Search and final testing are separated, but the evaluation pool has two roles.** The 11-task one-way acceptance check informs whether a frozen candidate passes; the other 40 tasks are reserved for final evaluation. Keep this split in view instead of describing all 51 tasks as untouched post-selection scoring.
2. **Capability retention is limited by the chosen metrics.** Candidate gates protect only predeclared capability metrics and tolerances. Safety policy, external side effects, latency, cost spikes, or output quality not measured by the gate require separate acceptance checks.
3. **Transfer covers one search backend and one additional backend.** The mechanisms are searched using GPT-5.6 Sol traces and applied to Opus 5. The authors' own activation analysis finds backend-dependent behavior; two models cannot establish universal transfer.
4. **Environment and search-budget coverage are bounded.** The 495 repository-derived and 40 verifier-driven tasks support executable search, but their sources and task types are specific choices. The authors say the complete research loop is expensive and do not systematically compare search breadth and depth under a fixed budget. Counts of 152 directions and 535 environments are not scaling-law evidence.
5. **Cost depends on recorded traffic, models, and a price snapshot.** EdgeBench API token costs use prices dated 17 August 2026 and recorded token categories. These author-reported estimates are not live invoices, total operating costs, or provider charges independently reproduced for this reading. Latency, hardware, environment setup, and engineering labor are not token cost.
6. **The composition analysis cannot remove selection effects.** Each single mechanism and the stack are assessed using their own triggered-task subsets. Larger gains are consistent with complementarity, but task composition and mechanism interactions are not separated.
7. **Each swarm configuration is run once.** A two-hour result records one cycle count and cost; it does not establish a stable swarm advantage or measure run-to-run variance.
8. **Recursive efficiency remains a future hypothesis.** The paper measures mechanisms found in one research cycle and their task results. It does not demonstrate multiple cycles where a cheaper harness funds broader search that then discovers still more efficient mechanisms.

## Artifacts and reproducibility

As of 7 October 2026, the paper-linked [NVlabs/SoL-Pi GitHub repository](https://github.com/NVlabs/SoL-Pi) is publicly browsable; its repository page lists an MIT License. The README describes the public release as a standalone extension installed on Pi and documents the required Pi and Node.js versions, configuration, and security guidance. The [project page](https://nvlabs.github.io/SoL-Pi/) describes the method and mechanisms. These pages establish that code and documentation are available. They do not by themselves establish that the 535 search environments, complete research orchestrator, and original EdgeBench runs can all be reproduced with one command. Before reproducing results, verify dependency versions, benchmark task access, model APIs, prices, and execution isolation.

This article did not run the code or rerun any benchmark. Token traffic, costs, and task scores in the article are all author-reported in arXiv v1. In particular, the dollar values are estimates calculated using that paper's stated prices; they are neither live provider bills nor independently verified charges. The MIT license on the GitHub repository does not automatically extend to the paper's images, so this reading links to Figures 1–8 in the source and does not copy them.

## Bloss0m engineering judgment: treat each mechanism as a testable change

The following is **Bloss0m engineering synthesis**, not a deployment guarantee or product-selection rule proposed by the authors. If a team wants to adopt one mechanism, first freeze the complete harness version: model and version, tool interface, prompt, context policy, cache prices, command timeouts, verifier, retries, and permissions. Create focused tests for each proposed change, then compare the same representative tasks before and after on capability, token categories, dollar cost, latency, and failure type.

Action Fusion fits an edit–validate sequence when the next command is already known. If the second action needs to inspect the first result and decide what comes next, keep the calls separate. For ObservationPack and the reducer, test whether the model knows when to retrieve full source material, whether validation failures reliably fall back, and whether original archives need sensitive-data protection or cleanup. For logs that may contain credentials, personal data, or confidential code, examine both the reducer's model route and the archive location.

Recalculate the Online Context Compact gate using the deployment's prompt-cache read/write prices and the summarization call cost. The paper explicitly says the gate does not separately include the summarization call. If provider cache rates, prefix reuse, or task lengths differ, the paper's setting may make the wrong decision locally. Treat “the task still completed after compaction” and “compaction preserved necessary evidence” as separate acceptance questions; token reduction alone is not enough.

For broader auto-research, freeze inspectable verifiers, capability tolerances, and efficiency targets. Record separate boundaries for candidate generation, development iteration, candidate acceptance, and final testing. Use a one-way validation pool only after the candidate is frozen; do not feed failed tasks back into search. Retain data on mechanisms that did not trigger, human intervention, timeouts, and tool errors. Otherwise, low token traffic could reflect early stopping or an easier task mix.

For a product that needs safe, accurate, or reliable completion, do not use one average score or token cost as the whole acceptance test. Do not apply the reported 44.7–49.0% traffic reduction directly to a billing forecast. Treat it as a hypothesis worth testing against the local workload, prices, latency, safety boundary, and repeat-run variance.

## Three things to remember

1. **The research process is part of the system design:** SoL-Pi connects candidate search, frozen gates, capability retention, and held-out validation. It defines success before search.
2. **Four mechanisms address different data paths:** Fusing actions, compacting context under an economic rule, keeping large outputs retrievable, and verifying log summaries all need end-to-end capability and cost checks.
3. **Every number has a boundary:** Token traffic, dollar cost, and scores on EdgeBench and the additional benchmarks are author-reported. The 40-task final split, two model backends, one run per swarm setup, and untested multi-round recursion bound adoption claims.

## Primary sources

- Liu, Haozhe, et al. [SoL-Pi: Recursively Scaling Auto-Research Loops for Efficient Agent Harness](https://arxiv.org/abs/2609.20519), arXiv:2609.20519v1, 17 September 2026. Key anchors: Sections 1–3 and 5.1; Figures 1–8; Tables 1–4.
- [NVlabs/SoL-Pi source repository](https://github.com/NVlabs/SoL-Pi), including its README, configuration, compatibility, and security documentation. Repository license: MIT.
- [SoL-Pi project page](https://nvlabs.github.io/SoL-Pi/).
