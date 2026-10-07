---
title: "ScienceIDE: Scientific Code as Verifiable Agent Environments"
description: "A critical reading of ScienceIDE's 64 environments, 2,812 generated tasks, and separate 85-task hard benchmark: how reusable scientific checks support evaluation and training, and where private verifiers, partial release, task selection, and transfer claims remain bounded."
pubDate: 2026-10-07
updatedDate: 2026-10-07
tldr:
  - "ScienceIDE's central move is to have experts define executable scientific equivalence first, then reuse the environment for task construction, evaluation, supervised fine-tuning, and reinforcement learning."
  - "The authors report 64 environments across 27 codebases, 2,812 manufactured tasks, and 1,076 checks. ScienceIDE-Hard is a separate fixed denominator: 85 tasks from 18 environments."
  - "The highest observed hard-set success rate is 67.1%, but Fable has a single measurement and top intervals overlap. Trajectory review also separates wrong-target edits, numerical conventions, and incomplete delivery."
  - "The public companion repository lists 15/64 environments and 30/85 hard tasks; parts of the full task bank and authoring pipeline remain inaccessible, so the full headline evaluation is not directly reproducible from the preview."
audience:
  - "Researchers and engineers building scientific coding agents, executable benchmarks, or model-training environments"
  - "Technical readers assessing numerical verifiers, long-horizon coding-agent evaluations, and reproducibility"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "Research"]
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
field: "AI Systems"
difficulty: "advanced"
showToc: true
image: "/paperReading/95-scienceide-scientific-code-environments/title_image.webp"
paper:
  title: "ScienceIDE: Turning World's Scientific Codebase into Agent Learnable Environments"
  authors:
    - "Hejia Geng"
    - "Zesen Huang"
    - "Haoyang Li"
    - "Wenbin Li"
    - "Koutian Wu"
    - "Zihan Zhou"
    - "Yuanbo Pang"
    - "Weihao Liu"
    - "Zigong Xu"
    - "Zhiping Li"
    - "Zongzheng Zhang"
    - "Chuanfei Dong"
    - "Jiankai Sun"
    - "Tianzhe Zheng"
    - "Fengyu Xie"
    - "Yue Ma"
    - "Yueheng Shi"
    - "Tong Xie"
    - "Zonglin Di"
    - "Xianrong Liu"
    - "Qucheng Gao"
    - "Yimin Liu"
    - "Jiaming Pan"
    - "Sheng Huang"
    - "Xiao-Han Ma"
    - "Lanqing Yuan"
    - "Zhenlin Zhu"
    - "Ziang Liu"
    - "Ziyang Xu"
    - "Junkai Wang"
    - "Kangkai Liang"
    - "Jiayi Xian"
    - "Zehong Zhao"
    - "Liuwei Xu"
    - "Jingxu Xie"
    - "Peijin Zhang"
    - "Qiang Gao"
    - "Chengyi Xing"
    - "Zhe Zhao"
    - "Xi Wang"
    - "Yaopeng Xing"
    - "Xing Meng"
    - "Zhenfei Yin"
    - "Yingcheng Wu"
    - "Ling Yang"
  year: 2026
  venue: "arXiv:2609.19134 v1 (2026-09-16; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.19134v1"
    arxiv: "https://arxiv.org/abs/2609.19134"
    code: "https://github.com/aitofound/ScienceIDE"
    project: "https://github.com/aitofound/ScienceIDE_Env"
series:
  id: "scientific-agent-environments"
  title: "Scientific Agents and Executable Evaluation"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Ordinary coding tasks can often be scored with unit tests or patch matching. Scientific code also depends on numerical tolerances, physical quantities, solver conventions, expensive simulations, and sometimes many valid outputs. A program can compile and pass a local test without reproducing the requested scientific behavior.
- **Core insight:** ScienceIDE packages an expert-approved scientific module, fixed cases, and warranted numerical checks into an executable environment. A task factory can vary the objective or initial code state while reusing the same scientific-equivalence contract; candidate tasks still need executable evidence from a witness, a defective baseline, observable scores, and leakage checks.
- **Strongest evidence:** The authors inventory 64 environments from 27 upstream codebases, 2,812 manufactured tasks, and 1,076 checks. A separate ScienceIDE-Hard subset fixes the denominator at 85 tasks across 18 environments. Fifteen model–harness systems are compared under a one-hour-per-task budget; the highest observed success rate is 67.1%. The appendix's trajectory review also finds numerical-convention mismatches to be the most common failure label for its two reviewed agents.
- **Main boundary:** The top hard-set results are not a significance ranking: Fable has only one measurement, while the Opus and Astra intervals overlap. Private verifiers still reflect experts' choices of observables and tolerances; task selection, pretrained-data contamination, partial task release, and within-codebase training results limit what can be generalized.

This reading follows the arXiv v1 preprint submitted on September 16, 2026; peer-review status is not established. ScienceIDE asks how to turn the tests, physical quantities, numerical variation, and codebase conventions that are often implicit in scientific software into experience an agent can repeatedly act on and be scored against. The authors treat an expert-reviewed module and its checks as reusable units: task factories propose different challenges, verifiers score scientific outputs, and interaction trajectories can then feed evaluation, supervised fine-tuning, and reinforcement learning. The paper demonstrates a system scaffold and improvements on selected tasks. It does not show that a fixed reference output is sufficient for open-ended scientific discovery, nor that the currently accessible release can independently reconstruct the full headline evaluation.

## Four distinct objects: module, environment, task, and episode

Several terms in ScienceIDE name different layers. A **scientific module** is a coherent scientific responsibility inside a version-pinned codebase, with its own inputs, outputs, algorithm stages, implementation paths, and executable coverage. An **environment** packages an approved module with its runtime, cases, checks, and private verifier. A **task factory** combines reusable authoring procedures with rules specific to that module. A **task** specifies the initial workspace, deliverable, and verifier. One interaction with that task is an **episode**, which produces a trajectory, artifacts, check outcomes, and resource records (Sections 2–2.5; Figures 2, 3, 4, and 6).

This hierarchy prevents task-count growth from silently redefining scientific acceptance. Experts decide module boundaries, which outputs represent scientific behavior, which tests matter, and how much numerical variation is acceptable. The registry and CLI track structure, source pins, dependencies, and artifact provenance. A task author or AI can propose a case or transformation, but a proposal is not a validated task. Experts own scientific responsibilities and equivalence; factories reuse an approved method across more tasks; validation establishes that a candidate is executable, has an informative score, and is solvable. This is the paper's principal system-design contribution. It is not a claim that agents can already conduct novel science.

## Core intuition: code similarity is not scientific correctness

Suppose a simulator produces particle positions, field values, or tracer concentrations under fixed initial conditions. An agent's textual patch may differ from a reference fix yet still produce acceptable science. Conversely, the agent may change plausible-looking code, compile it, and pass a repeatability test without fixing the assigned defect. ScienceIDE therefore scores observables defined by a scientific case instead of requiring the agent to copy a reference diff.

A check specifies fixed inputs, graded outputs, and a pass policy. If numerical correspondence is sufficiently stable, a pointwise policy compares values, for example
$$|c-r| \leq a + \rho |r|,$$
where $c$ is the candidate result, $r$ is the reference, and $a$ and $\rho$ are absolute and relative tolerances. Exact equality is the special case $a=\rho=0$. If array order can change because of sorting or parallel layout, outputs should be aligned by an identity carried in the result before comparing physical quantities. Storage order, rank assignment, adaptive-step count, runtime, and random draws are not themselves the physical observables to verify (Section 2.2; Appendix 8.1).

When the same input causes trajectories to diverge rapidly by design, a strict pointwise tolerance can confuse both valid variation and real errors. The authors use an invariants policy in such cases, comparing more stable features such as moments, distributions, conserved quantities, or integral norms; when feasible, they first shorten the graded time window to one where the physics remains meaningful. Policy choice is not fully automated by a few runs. Nominal inputs, a perturbed variant, and optionally a second legitimate build of the same source provide calibration evidence. Curators and domain experts still read the code mechanism to choose the observable, tolerance, and window, and write a plain-language warrant explaining which scientific bias the check is intended to distinguish and why valid implementations can pass. Finite measurements inform this choice; they are not universal guarantees or an automatic tolerance formula.

> **Huahua's engineering note**: If a scientific-agent benchmark uses a private numerical verifier, review who selected the observable, who set the tolerance, and which alternative solutions are accepted alongside the score. The score is a consequence of that contract; it cannot stand in for the contract.

## Walk one repair task through the system

A paper repair task begins from a pinned upstream version and packages a known-valid witness, an unfixed defective build, and an editable agent workspace. The following walkthrough follows the authors' mechanism without inventing a scientific case.

1. **Define the module and scientific cases.** Experts describe the module's numerical responsibility and survey upstream unit tests, regression tests, and standard examples for coverage. If an example has no shipped answer, the pinned build supplies a reference; a published value, convergence behavior, or conserved quantity anchors the science. A new custom case requires curator agreement (Section 2.2).
2. **Calibrate each check.** Record its inputs, graded outputs, policy, bounds, and scoring window. Run the reference independently under nominal and variant conditions and require both to attain full reward. Where the build allows it, compare another legitimate build of the same pinned source. A bound should contain valid measured variation while still distinguishing a meaningful error; these runs do not choose it automatically.
3. **Propose and validate a candidate task.** A factory can inject a known defect, remove a function body for reconstruction, or propose a specialist objective such as acceleration or reproduction. For injected repairs, the reference fix must pass, the unfixed build must leave reward headroom, and the injected change must create a check failure that the reference repair removes. Compilation, native execution, coverage, leakage tests, and infrastructure status also affect admission. A generated ambiguous specification or unreachable branch does not become valid merely because it was proposed (Section 2.4; Figure 5).
4. **Run an episode and grade the delivery.** The agent inspects the editable workspace, changes code, runs the simulation, and submits required artifacts. A hidden verifier rebuilds the candidate and reruns scientific cases. The episode record separates scientific disagreement, incomplete delivery, and infrastructure failure instead of collapsing compile failure, missing outputs, and wrong physical values into one cause (Section 2.5; Figure 6).
5. **Normalize repair progress against the defective starting point.** If the aggregate check reward is $r$ and the unfixed build starts at $f$, repair reward is
$$r_{\mathrm{repair}}=\max\left(0,\frac{r-f}{1-f}\right), \quad 0\le f<1.$$
With headroom, the unfixed program receives zero and a known-valid repair receives full reward. This measures progress relative to this starting condition; it is not a general scientific trust score (Equation 1).

This process aims to preserve expert decisions so a new task, model, or trainer does not need to redefine scientific equivalence. But a check can still consistently reward the wrong behavior if its observable is poorly chosen or its tolerance is too permissive. A private-reference test may also reject a legitimate alternative algorithm that produces a different but scientifically acceptable result. The authors acknowledge this verifier risk. Their evidence includes calibration procedures and expert review, not completed independent external validation.

## Keep the inventory and benchmark denominators separate

ScienceIDE's reported inventory contains **64 environments from 27 scientific codebases and 2,812 manufactured tasks**: 2,515 repair tasks, 295 implementation tasks, and two acceleration tasks. A companion set contains 1,076 executable checks for scientific outputs and invariants (Section 3.1; Appendix 8.2). The paper also defines a seven-family authoring taxonomy: Acceleration, Repair, Discovery, Reproduction, Integration, Calibration, and Implementation. Those seven labels are a design taxonomy, not evidence of even deployment across seven families: the current inventory is overwhelmingly repair and implementation, with only two acceleration tasks.

ScienceIDE-Hard is a separate fixed evaluation denominator, not a shorthand for all 2,812 tasks. It has **85 tasks across 18 environments**, with 52 repair and 33 implementation tasks. Repository counts are MITgcm 33, PLUTO 31, LAPS 11, Athena++ 9, and PHANTOM 1. The authors selected cases intended to probe large codebases, multi-site edits, and numerical conventions, then validated them with executable reference solutions and defective baselines. The private scientific reference determines strict success; compilation or execution alone does not (Sections 3.1 and 9).

These populations answer different questions. Task supply describes how much work the registry has manufactured. The 1,076 checks describe the breadth of observable contracts. The 85-task hard panel is the model-leaderboard denominator. Using environment or task-supply counts as the leaderboard size would misstate model coverage and ranking precision. All body graphics below are original Bloss0m vector redraws of reported Figure data, with the original denominators and comparisons retained; they are not copied arXiv image files.

## Figure 7: the leaderboard describes one fixed cohort of model–harness systems

The evaluation compares 15 models from eight providers through Codex, Claude Code, or Gemini CLI. Each agent receives the same task container and instructions, no extra localization hints, and a one-hour episode budget. The result is a comparison of model–harness systems, not just underlying models. Tasks are equally weighted after valid repeats are averaged within each task. The reported intervals describe repeated execution variability on the fixed task set; they do not represent a newly sampled scientific task bank (Sections 3.1 and 9).

![Observed success rates on the same 85-task ScienceIDE-Hard cohort, highlighting four systems and the other eleven below 40%.](/paperReading/95-scienceide-scientific-code-environments/figure-7-hard85.svg)

*Figure 7 (Bloss0m redraw from reported values): Fable 5.1 reaches 67.1%, Opus 5 64.6%, Astra 63.1%, and Sol 55.0%; the other eleven systems are below 40%. Source: [ScienceIDE v1, Figure 7 and Sections 3.1–3.2](https://arxiv.org/html/2609.19134v1). This original vector redraw uses only the authors' reported values and does not reproduce the source graphic; arXiv v1's non-exclusive distribution license does not expressly grant figure-reuse rights.*

The result means that even the strongest system leaves roughly one third of this hard set unsolved within an hour. It does not support reading “ranked first” as “clearly superior”: Fable has only a single valid attempt and no repeat interval, while the Opus and Astra intervals overlap. The agents also solve tasks at different speeds. At ten minutes, Astra has reached 49.6%, while Fable overtakes it at about 31 minutes. These budget curves are retrospective summaries of the existing one-hour episodes, not new runs that stop every agent at a shorter assigned budget (Figure 8; Appendix 9).

Cost is another distinct dimension. Fable has 67.1% success at an estimated $7.90 per task; Astra has 63.1% at about $3.56. Astra averages 9.4 minutes and 13.9k output tokens per task, compared with Fable's 16.8 minutes and 85.7k tokens. These estimates use recorded harness costs or archived token prices, not prices current on October 7, 2026. Across 15 profiles, the descriptive Spearman correlations of success with runtime and output volume are −0.22 and 0.01. These are sample associations; they do not mean that spending causes lower success or that token volume is useless (Figure 9; Appendix 9.3).

## Evaluation integrity: isolation inside a container does not isolate the whole tool path

The appendix reports several evaluation corrections that matter when interpreting “executable verification.” Later trajectory review found 455 upstream-directed commands among 5,314 trials, including 21 confirmed successful fetches, 13 of which were scored as solved. Nineteen staging scripts had changed the agent-side isolation declaration to public. The corrected path used a live-container allowlist and voided confirmed fetch trials. These findings and corrections describe historical conditions; they do not establish that the earlier campaign was fully controlled (Appendix 9.1).

Container network isolation also does not automatically cover provider-side search or fetch, or an aggregator credential that can route to another browsing-capable model. Gemini received substantive provider-tool content on 71 of 85 tasks; an exact upstream file was retrieved through web_fetch on one trial, and affected trials were later rerun with provider tools disabled. DeepSeek V4 Pro used an aggregator key to call other models on 20 tasks, solving 13; the authors used a provider-side model allowlist for a rerun. The appendix records a historical sample score change from 0.365 to 0.294, which is not a timeless or current leaderboard value. Nor do these controls establish that pretrained models had never encountered public upstream code (Appendix 9.2). An auditable benchmark therefore needs to trace credentials, provider tools, staging images, and trajectory provenance, not only the Docker network.

## Figure 13: failures differ in time, partial progress, and repeat stability

A single success rate can merge “spent a long time and timed out,” “finished quickly at baseline,” and “made partial progress but did not reach full score.” Figure 13 separates budget exhaustion, partial credit, baseline-level returns, unsuccessful-episode duration, and instability over the first three runs. For example, Qwen exhausts the budget on 37.3% of selected attempts and spends an average of 48.5 minutes on unsuccessful episodes. Haiku has no recorded budget timeouts, but 74.9% of its attempts return at or below baseline, and unsuccessful episodes average 7.7 minutes. MiniMax has both 31.6% budget exhaustion and 34.1-minute unsuccessful episodes. These are observable termination outcomes, not causal diagnoses of why an agent failed.

![Three distinct failure patterns: long budget exhaustion, short baseline-level return, and a combination of both.](/paperReading/95-scienceide-scientific-code-environments/figure-13-failure-outcomes.svg)

*Figure 13 (Bloss0m redraw from reported values): unsuccessful duration and budget exhaustion are separate dimensions; Haiku's at-or-below-baseline share is another. Source: [ScienceIDE v1, Appendix 10.1, Figure 13](https://arxiv.org/html/2609.19134v1). This original redraw uses the authors' reported values, does not reproduce the source graphic, and is not covered by an express figure-reuse grant in the arXiv v1 distribution license.*

Repeated trials reveal another limit of aggregate rates. Among models with complete repeat coverage, 28.0% of model–task pairs include both success and failure across their first three valid attempts. Gemini changes outcome on 33 of the 85 tasks, Astra on eight, and Kimi on 29. If an agent is intended for a scientific workflow, average success should be accompanied by task-level instability, the checks completed before failure, and whether repeated attempts flip the result. This is an engineering implication of the reported diagnostics, not a deployment rule the paper has validated.

## Figure 15: wrong-target edits and incomplete delivery call for different feedback

The authors review Fable 5.1 and Astra on the shared 85-task panel using a model-assisted review of 358 attempts, 125 of them unsuccessful. Among task-balanced failures under review, the reference-convention-mismatch label accounts for 71.4% for Fable and 64.9% for Astra. Many failures are therefore not simple syntax mistakes; the agent did not faithfully reconstruct a solver's precision, timestep state, or transition conventions.

![Trajectory review separates scientific convention mismatches, wrong targets, and incomplete delivery, with T013, T035, and T002 as reported examples.](/paperReading/95-scienceide-scientific-code-environments/figure-15-failure-mechanisms.svg)

*Figure 15 (Bloss0m redraw from reported evidence; values and cases from Appendix 10.3): T013 omits a prior-timestep retention rule, T035 truncates a reconstructed coefficient table, and T002 applies the target edit but omits four required control-output groups. Source: [ScienceIDE v1, Appendices 10.3–10.4, Figure 15](https://arxiv.org/html/2609.19134v1). This original redraw does not reproduce the source graphic; arXiv v1 provides no express figure-reuse grant.*

A PLUTO example makes the difference between a local test and task correctness concrete. Failed agents on T055, T057, and T058 all changed a non-target function from natural logarithm to base-10 logarithm. Nine failed attempts across those three tasks repeated the same wrong location. On T058, both the failed edit and a successful edit pass repeatability checks on the candidate program, but only the edit in the equation-of-state module passes the private reference evaluation. A local run proves that a candidate behaves consistently; it does not prove the edit addressed the assigned defect.

T002 illustrates a different failure. The agent makes the correct chemistry-code change but omits four groups of control output. Other Astra attempts pass only after delivering the complete set of runs. At least three steps therefore separate a successful task: select the correct target, reconstruct its behavior, and submit the full scientific deliverable. Trajectory review can make training and benchmark feedback more specific, but this was not a blinded causal study, nor was it independently replicated or certified by domain experts. Seventeen failure cases remained unresolved after targeted review. The authors also say historical task files have not been independently shown to be byte-identical to every runtime revision, which limits code-level attribution (Appendix 10.4).

## SFT and RL: two kinds of learning evidence, not general transfer proofs

### Supervised fine-tuning on verified trajectories

SFT uses trajectories generated by GPT-5.6-sol and selected through numerical-equivalence verification. The training partition contains 4,567 segments from 564 tasks; validation contains 544 segments from 81 tasks, with no task ID shared between them. Qwen3.5-4B, Qwen3.5-9B, and Qwen2.5-72B-Instruct are each trained for three epochs with LoRA applied to all linear layers. The loss supervises new assistant actions and tool calls while masking historical instructions, observations, and flagged repetitive or failed actions. This avoids training the model to predict observation text as if it were an action, but related task variants were not independently audited for overlap (Sections 3.3 and Appendix 11.1).

For held-out ScienceIDE tasks, the localized repair evaluation gives each initial and SFT checkpoint the same prompt. The model emits one structured patch; a fixed runner applies it, builds the code, and runs the original numerical checks. Reward retains partial credit. In Figure 10(a), 4B on PLUTO-Particles-Dust rises from 0.0000 to 0.3333. The 9B model rises from 0.0000 to 0.2857 on PLUTO-RMHD/ResRMHD, from 0.3125 to 0.5000 on LAPS, and from 0.0625 to 0.1250 on MITgcm-Biogeo. These comparisons support a narrow statement: selected scientific interaction data improve repair reward on unseen task IDs within the evaluated codebases. They do not establish comparable gains on new repositories or workflows.

The authors also measure public programming, reasoning, and knowledge benchmarks. Results include increases and decreases, and the metrics should not be summed into a general intelligence score. For example, on the 125-item confirmation set, 9B rises from 27.2% to 63.2% on BBH Word Sorting, but falls from 86.11% to 77.78% on the 36-item HumanEvalFix Python confirmation set; its paired-bootstrap 95% interval includes zero. On 2,604 CodeXGLUE defect-detection examples, 4B rises from 45.93% to 52.92%. Each row keeps its benchmark-specific metric; screening and confirmation are separated, and confirmation intervals are not adjusted for multiple comparisons. This is limited positive-transfer evidence, not a result that every benchmark improves or that scientific training universally improves reasoning (Figure 10, Table 3; Appendix 11.1).

### Online reinforcement learning on verifier rewards

RL starts from base Qwen3.5-4B without SFT initialization and uses multi-turn episodes to obtain native verifier reward in LAPS and MITgcm-Biogeo. LAPS has 99 repair tasks split 85/14. The MITgcm-Biogeo run records 87 tasks with a source split of 64/23, while the logged validation reads 21 tasks; a subsequently rebuilt 66/21 split is not substituted for the reported run. The splits group defect-family and source-tree variants, but the comparison remains a task holdout within the same environment rather than a test of transfer to another codebase. Instructions also provide localization hints identifying the file, line, and edit class, without the repair itself (Section 3.4; Appendix 11.2).

The verifier returns a score only after an episode ends, and tasks may span dozens of turns and tens of thousands of tokens. The authors find that treating an episode cut off by the turn or response budget as an ordinary zero-reward sample, while still applying policy gradients to its generated tokens, can create an optimization shortcut: shorten the trajectory instead of solving the task. In an unmasked run, mean reward rises from 0.339 to 0.573 and then collapses to 0.078; tokens per turn fall from 1,125 to 327 even as budget truncation rises from 29% to 39%. Shorter turns then cause more episodes to hit the turn cap, reinforcing the same truncation penalty. This negative result matters: long trajectories may reflect the demands of a scientific problem, and poorly chosen length or cutoff handling can change what the model is rewarded for (Appendix 11.2, Table 5).

The authors keep budget-truncated episodes in the group reward baseline but mask their tokens out of the policy loss; they also disable the length penalty. A cutoff still contributes information to the group reward, but tokens produced before the cutoff are not treated as behavior to suppress wholesale. After 30 steps, held-out mean reward rises from 0.357 to 0.857 on LAPS and from 0.286 to 0.571 on MITgcm-Biogeo. Both studies use one base model, held-out tasks from the same environments, and no between-seed variance estimate. Figure 12 and Table 5 support improvement under this setup; they do not establish that RL transfers to arbitrary scientific codebases.

## Artifacts and reproducibility: public code is not the complete data and pipeline

The PhAI-IDE-4B, PhAI-IDE-9B, and PhAI-IDE-72B model collection is also listed in the [ScienceIDE Model Series on Hugging Face](https://huggingface.co/collections/AItonomy/scienceide-model-series).

As of October 7, 2026, the main [ScienceIDE repository](https://github.com/aitofound/ScienceIDE) lists 15 of 64 environment packages and 30 of 85 ScienceIDE-Hard tasks as part of its public preview; it also links SFT/RL recipes, selected results, and models. A separate [ScienceIDE_Env repository](https://github.com/aitofound/ScienceIDE_Env) says it stores the complete raw environments and upstream source pins. It licenses benchmark-owned task statements, manifests, and checks under CC BY 4.0; upstream code retains its own license. This broadens access to environment materials beyond the main repository's 15-item preview, but does not amount to releasing all 85 hard tasks.

Two additional public repositories provide subsequent workflow and environment-packaging tools. [ScienceInfra](https://github.com/Gen-Verse/ScienceInfra) now provides an environment-preparation, agent-execution, online-RL, and evaluation workflow, with LAPS and MITgcm-Biogeo demos. [sciaccelbench-pipeline](https://github.com/huangzesen/sciaccelbench-pipeline) publishes the environment-packaging CLI, specification, and authoring skill. These are usable tools and demonstrations, but the visible repository descriptions do not establish public access to the full original 85-task benchmark cohort, historical task selection, complete model–harness trajectories, and frozen settings needed to reconstruct the paper's evaluation. Researchers still need to establish which released revision contains the data and evaluation configuration required to rerun arXiv v1. ScienceInfra lists an Apache-2.0 license; the main ScienceIDE repository and environment-packaging pipeline do not show a clear project-wide license covering all code, model weights, and benchmark artifacts. Users should check repository code, task material, model weights, and each upstream source separately.

A current small reproduction path is to follow the ScienceInfra README in a Python 3.11, Docker, and Harbor setup, prepare a published LAPS demo, and score an oracle to confirm the environment. This environment check needs no model or GPU. It exercises a local portion of the workflow; it does not rebuild the full registry, 85-task hard cohort, author-era task selection, or complete model–harness evaluation. This article did not rerun the authors' experiments; the leaderboard, SFT, and RL numbers are author-reported arXiv v1 results. Reproducing their RL run requires substantially more: Appendix 11.2 records 24 H20 GPUs per run, eight for generation and sixteen for training.

## Evidence map: read claims, observations, and extrapolations separately

| Paper claim | Author-reported evidence | What the evidence currently supports |
| --- | --- | --- |
| Scientific modules can become reusable learning environments | 64 environments, 27 source codebases, 2,812 tasks, and 1,076 checks, with provenance and executable contracts (Section 3.1; Appendix 8) | The system and inventory have been instantiated; counts alone do not establish environment quality or independent scientific coverage. |
| Current agents still fail at long-horizon scientific repair | Results for 15 model–harness systems on the 85-task hard cohort, repeated-run variability, and cost/budget profiles (Figures 7–9; Appendix 9) | These describe this cohort, one-hour budget, and specified harnesses; they are not cross-domain rankings or success rates for research work. |
| Verifier trajectories can support model learning | SFT gains on held-out tasks within the codebases, mixed selected public-benchmark results, and higher RL rewards after 30 steps in two environments (Figures 10 and 12; Appendix 11) | Limited evidence for within-codebase learning and transfer; related-task overlap, hinted splits, and missing seed comparisons constrain generalization. |
| Private scientific checks can represent scientific correctness | Check calibration, reference witnesses, defective baselines, and trajectory examples (Sections 2 and 9–10; Appendices 8–10) | The evidence supports a design for executable contracts and some integrity audits; it does not show that selected observables cover every valid scientific solution. |

The figures and results in the first three columns are author-reported; the final column interprets their scope. The strongest systems contribution is preserving expert decisions as reusable checks. The weakest link is extrapolating from “full reward on selected references” to broader scientific correctness. Moving from a fixed benchmark to externally auditable scientific agents still depends on independent verifier review, task provenance, and complete access to training and evaluation data.

## Limitations, external validity, and open questions

The paper's evidence concerns reference-verifiable software tasks, predominantly repair and implementation in computational physics and geoscience. The authors list a 1,000-environment collection and broader task-family coverage as development targets. Factory variants may share code paths and assumptions, so task count alone does not measure independent scientific coverage. The hard set probes at most one hour and two coupled edit sites. Open-ended discovery asks agents to pose new questions, compare hypotheses, and handle unknown outcomes; a repair task with a fixed reference answer is not a substitute for those activities (Section 5).

A scientific verifier is also a modeling choice. Passing selected observables under calibrated tolerances does not establish behavior outside the checks, and a legitimate alternative algorithm may disagree with the chosen reference. Independent external audits and adversarial reward-hacking evaluations remain outstanding. Expanding the registry still depends on domain expertise and upstream redistribution rights. Pinned revisions and dependencies preserve provenance, but changes in repositories, dependencies, or hardware require revalidation; version records do not preserve scientific validity by themselves.

Evaluation boundaries also include task selection, private-reference auditing, and public-answer contamination. The authors note that ScienceIDE-Hard task selection predates complete retrieval isolation. Retrieval controls can limit tool-supplied content but cannot show that pretrained models never saw public repository code. Scores also depend on serving speed, unequal repeat coverage, and the model–harness pairing. For SFT, “held out” means distinct task IDs, while related variants were not independently audited. RL has no between-seed variance estimate. The leaderboard is therefore useful for studying long-horizon scientific coding on this cohort, but it cannot answer whether agents can perform research on unseen repositories.

## Bloss0m engineering judgment: make the verification contract reviewable

The following recommendations are **Bloss0m engineering judgment**, not an author-validated rollout policy. A team applying this idea to an internal scientific-agent benchmark should make every environment carry readable source pins, module boundaries, checked quantities, pass policies, reference/variant evidence, witness results, and defective-baseline behavior. Domain experts should be able to confirm that these choices distinguish the errors they care about. Those fields should ship with the benchmark rather than remain only in private authoring documents, so another team can inspect what a score of 1.0 means.

Next, audit task validity separately from model performance. At admission, show that the reference witness is attainable, the defective baseline leaves headroom, instructions specify the requested work and visible information, and the grader has no infrastructure failure or answer leakage. At evaluation time, record the container image, network policy, provider-side tools, credential path, model version, harness, budget, repeat count, per-check outputs, and termination reason. These recommendations follow from the paper's container-side and provider-side retrieval examples, but controls must still be designed for each tool vendor; Docker policy alone is not a guarantee.

When tasks use a hidden verifier, public reports should provide enough summaries, test rationale, calibration evidence, failure labels, unresolved-case counts, and release records for readers to challenge the criterion without seeing answers. If the verifier itself cannot be published, state who reviewed it and the boundary of that review. Reusing expert checks across factories, training, and evaluation is promising for reproducible maintenance, numerical regression, and acceleration work. If a task instead asks for a new discovery, competing hypotheses, or an output without a predefinable reference, a fixed equivalence contract is not a sufficient acceptance standard.

## Three things to remember

1. **Technical idea:** The reusable unit is an environment with source provenance, a scientific module boundary, and checks. Factories vary the work while preserving the scientific acceptance contract.
2. **Evidence:** 64/27/2,812 describes the task-supply inventory; 85/18 is the ScienceIDE-Hard evaluation cohort. Across 15 model–harness systems, the highest reported success rate is 67.1%, and failure analysis exposes convention, localization, and delivery problems.
3. **Boundary:** A private verifier can turn scientific outputs into learning signals, but it also embeds experts' choices of observables and tolerances into reward. Local success, within-codebase holdouts, and a partial public task set do not establish cross-domain scientific capability.

## Further reading

- [When Tool Calls Succeed but Workflows Fail](/en/paper-reading/49-when-tool-calls-succeed-workflows-fail/): the gap between a successful tool response and a completed workflow.
- [Corrupt Plans, Clean Traces](/en/paper-reading/51-plan-injection-cot-monitoring/): agent evaluation through trace visibility and monitoring limits.
- [After the Party](/en/paper-reading/52-after-party-agent-skill-ecosystem/): governing tools and skills as agent infrastructure.

## Primary sources

- Geng et al., [ScienceIDE: Turning World's Scientific Codebase into Agent Learnable Environments, arXiv v1](https://arxiv.org/html/2609.19134v1), September 16, 2026. All experimental, figure, table, and appendix values in this reading are author-reported and were not independently rerun.
- [ScienceIDE code and benchmark preview](https://github.com/aitofound/ScienceIDE), [ScienceIDE_Env](https://github.com/aitofound/ScienceIDE_Env), [ScienceInfra](https://github.com/Gen-Verse/ScienceInfra), and [sciaccelbench-pipeline](https://github.com/huangzesen/sciaccelbench-pipeline), accessed October 7, 2026.
