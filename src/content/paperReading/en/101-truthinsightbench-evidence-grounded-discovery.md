---
title: "TruthInsightBench: Evaluating Whether AI Agents Can Make Evidence-Grounded Scientific Discoveries"
description: "TruthInsightBench shifts evaluation from reproducing a prescribed answer to examining whether an agent's own scientific claims are traceable, robust, controlled, and falsifiable. This reading explains its blind tasks, 29-item scoring rubric, and four-scaffold results, while examining the limits of one frozen base model, single-run evaluations, and an uncalibrated LLM judge."
pubDate: 2026-10-20
updatedDate: 2026-10-20
tldr:
  - "Instead of asking an agent to recover a target paper's conclusion, TruthInsightBench gives it a neutral research goal and frozen data, then evaluates the maturity of claims against analyses and artifacts it actually produced."
  - "Across 40 blind tasks in 10 scientific domains, four coding-agent scaffolds using DeepSeek-V4-Flash form a narrow, statistically indistinguishable plateau at 58.40–60.27/100."
  - "Auditability and novelty are comparatively strong, while control testing, robustness, cross-dataset validation, and falsifiability are weak. The scores expose a gap between execution and scientific judgment; they do not show that scientific discovery is automated."
audience:
  - "Researchers designing or procuring AI-scientist, coding-agent, and research-automation systems"
  - "Engineers building agent benchmarks, model evaluations, and human-review workflows"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "AI Research"]
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
field: "AI Systems"
difficulty: "advanced"
showToc: true
image: "/paperReading/101-truthinsightbench-evidence-grounded-discovery/title_image.webp"
paper:
  title: "TruthInsightBench: An Evidence-Grounded Benchmark for Automated Evaluation of Open-Ended Scientific Discovery Agents"
  authors:
    - "Zhibo Yang"
    - "Chen Zhang"
    - "Yuewei Zhang"
    - "Hao Wang"
  year: 2026
  venue: "arXiv:2609.05079 v1 (2026-09-04; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.05079v1"
    arxiv: "https://arxiv.org/abs/2609.05079"
    code: "https://github.com/TruthInsight-stack/TruthInsightBench"
series:
  id: "scientific-discovery-agent-evaluation"
  title: "Agent Evaluation and Observability"
  part: 1
  totalParts: 1
---

<!-- paper-reading-no-body-figures: No material original figures were licensed for reuse as of 2026-10-20. -->

## The paper in 90 seconds

- **Problem:** Many scientific-agent benchmarks organize tasks, data, and rubrics around a study whose answer is already known. They therefore measure whether an agent can reproduce a prescribed analysis or recover a target result. That matters for reproducibility, but does not answer whether an agent can form a justified, testable claim from data on its own.
- **Core insight:** TruthInsightBench keeps the paper identity, source conclusions, expected values, analysis path, and evaluation assets outside the agent workspace. An agent sees only a neutral goal, frozen data, and necessary metadata. After its run is frozen, a judge examines the code, results, and report it actually produced for evidentiary maturity.
- **Strongest evidence:** The benchmark has 40 tasks across 10 domains and compares four coding-agent scaffolds on the same frozen base model. Scores range from 58.40 to 60.27/100, with no reliable pairwise ranking. Dimension scores reveal a much larger gap: evidence auditability is about 78–81% and novelty 83–87%, while control testing is about 11–16%, robustness 9–14%, and cross-dataset generalization is near zero (Sections 4.2–4.3; Figures 2–3; Tables 4–6).
- **Main boundary:** This is a retrospective, dry-lab benchmark, not evidence of a real-world first discovery. Each system–task combination runs once, and all four scaffolds share one frozen base model. Human calibration of the single GLM-5.1 judge and sensitivity analysis with a second judge remain future work. Automatically recomputable scores are not, by themselves, independently validated measures (Sections 6.1 and 6.3).

This reading follows arXiv v1, submitted on September 4, 2026. It treats the work as a preprint; peer-review status has not been established. The central contribution is not just the scores of four agents. It is a change in what evaluation asks: instead of “How closely does the answer match a prior study?”, it asks “Did the agent's claim grow out of an analysis that can be traced?” The benchmark makes that distinction executable and inspectable. Its results also suggest that systems able to produce code, figures, and plausible reports often fail to conduct enough control, robustness, or external-validation tests. One question is whether an automated judge can become a trustworthy research feedback signal. Another is whether the observed weaknesses mean agents do not perform these checks, or whether the tasks and single-phase protocol have not given them enough opportunity to do so.

## Prior approach limitations: from reproducing answers to evaluating evidence

Retrospective evaluation has a clear use. If the question is whether an agent can reconstruct a paper's method, code, and numeric results, supplying the target study and its expected outcomes is necessary. But when both the task and rubric derive from a known paper, an agent can navigate toward a privileged endpoint; it need not decide which data pattern merits a discovery claim or compare alternative explanations. The authors distinguish two abilities: **executing a specified analysis** and **exercising research judgment without a prescribed answer**. The latter involves selecting a phenomenon worth claiming, checking numerical or modeling artifacts, comparing explanations, setting controls, testing robustness, checking independent data, and narrowing the conclusion's scope (Section 1).

This does not make reproduction benchmarks unhelpful, nor does it make an open-ended task the only superior form of evaluation. The authors present TruthInsightBench as an exploratory complement: reproduction asks whether a system can reproduce a specified study; this benchmark asks whether it can form a claim grounded in data. Mixing the scores would rank tools on different capabilities as though they measured one thing.

The paper also defines “discovery” narrowly and operationally: a scientific claim formed from task data, independently testable, and adding a judgment about relationships, mechanisms, quantitative properties, or applicability boundaries of the objects studied. A valid output need not claim a positive new effect. A null result, counterexample, method artifact, or boundary can count if its evidence is inspectable (Section 3). This separates novelty from credibility: saying that a claim has not been reported before does not replace the evidence and analysis that support it.

## Core intuition: separate research material from the scoring key

### What the blind task reveals

The authors represent a task with this information boundary:

$$
\tau = (g, D, M, T_0 \mid p^*, F^*, A^*)
$$

The agent can see the neutral research goal $g$, frozen data $D$, metadata $M$ (variables, units, experimental conditions, and independent-observation structure), and a literature cutoff $T_0$. To the right of the bar, $p^*$ is the source study, $F^*$ is a non-exhaustive set of reference findings, and $A^*$ contains verification scripts, tolerances, scoring weights, and the audit trail. These remain on the evaluation side until the agent submits a frozen run. The run output is $y=(\pi,o,r)$: the executed code and analysis process, intermediate results and artifacts, and final research report (Equation 1; Figure 1).

“Blind” therefore means protocol-level blindness. The benchmark can establish that source conclusions and scoring assets were not placed in the task workspace. It cannot establish that DeepSeek-V4-Flash never encountered related papers during pretraining. Setting each task's $T_0$ before the source study and evaluating novelty against literature before that cutoff mitigates this concern, but the authors do not claim to eliminate it (Sections 3.1 and 6.1). Task-level information isolation and model memory are separate risks.

### How the tasks were selected and constructed

The 40 tasks each derive from a peer-reviewed study published from 2018 to 2024. The builders selected studies using three conditions. First, the data must preserve enough structure to interpret variables, units, and experimental conditions. Second, they must be able to re-derive at least two major results using only the data that the agent will receive. Third, the data must contain genuine repeats, condition variation, controls, or alternative analyses that allow robustness and competing-explanation checks. For every task, the builders re-derived two main results and ran sample, method, and measurement-definition perturbations on each result: eight construction-time checks per task, or 320 across the benchmark (Section 3.2).

This is purposeful curation, not a random sample of all scientific work. The 40 tasks cover Astronomy (3), Chemistry (3), Computational Mathematics (4), Earth Science (4), Energy (4), Information Science (4), Life Science (5), Materials Science (4), Neuroscience (4), and Physics (5). Data include tables, time series, structured arrays, networks, molecular or particle coordinates, and scientific images (Table 2). This range can test whether agents choose analyses appropriate to different data forms, but three to five tasks per field cannot support a domain-level league table.

### Six dimensions are not six model capabilities

The 29 rubric items divide the relationship between a claim and its evidence into six measurable properties. These are dimensions of the benchmark's measurement framework, not a guaranteed procedure for scientific discovery. Their weights are:

| Dimension | Weight | What it examines |
| --- | ---: | --- |
| Evidence auditability | 45 | Whether data source, object, analysis, results, and claim form a traceable, verifiable, internally consistent chain. |
| Robustness | 15 | Whether the conclusion survives randomized reruns, sample changes, method or threshold changes, and states its scope. |
| Control testing | 15 | Whether simple baselines, no-signal controls, competing explanations, confounds/artifacts, or methods with different error sources are tested. |
| Cross-dataset generalization | 10 | Whether the claim is retested on independent data, periods, or objects with pre-specified analysis and criteria. |
| Novelty | 10 | Whether the claim adds an object, relation, quantitative result, or boundary relative to literature before $T_0$. |
| Falsifiability | 5 | Whether a future observation distinguishes competing hypotheses and supplies an executable conclusion-update rule. |

Each item receives 0, 0.5, or 1. Proposing that a test should be run earns no credit unless the analysis has actually been executed and its result can be located. Evidence auditability receives the largest weight because a claim must first be supported by current data. But the rubric also assigns weight to robustness, controls, and external confirmation so that reproducible code output is not automatically equivalent to a credible discovery (Sections 3.5–3.6; Table 3; Appendix B).

### Scoring mechanism: from claim scores to a task score

The judge first calculates a weighted quality score $Q(d)$ for a claim across the 29 items. It then semantically deduplicates discoveries within a system–task report by object, scope, relation direction, and key evidence. The two strongest distinct claims become $S_1$ and $S_2$. The task score is:

$$
R_{a,t}=\mathrm{clamp}(0.60S_1+0.20S_2+B_{yield}+B_{target}-P_{false}, 0, 100)
$$

The evidence-quality body contributes up to 80 points. Up to 10 additional points reward distinct discoveries scoring at least 40, with bonuses of 4, 2, 2, and 2 points. Coverage of two hidden reference findings contributes up to 10 points. If a report asserts a claim that executed results or re-derivation clearly contradict, each deduplicated false-direction claim costs five points, up to a 10-point penalty. The 40 task scores are then equally averaged for each system (Equations 2–4; Section 3.6).

This arrangement caps the breadth bonus so that the score is driven mainly by evidence quality for the best and second-best claims. $B_{target}$ does use the hidden source findings after the run for up to 10 points of reference coverage. It is not the main answer key: the 80-point body scores agent-selected claims from their evidence artifacts, and the authors report that a main-body-only ablation without either bonus preserves the same system ordering. It is therefore a deliberate trade-off, not a design with no reference answer at all. It avoids turning the benchmark into simple recovery of a paper's result while still allowing limited source-finding coverage (Section 3.6).

## Worked example: walk through a scientific judgment in the chemistry task

Chemistry_07 contains sharp local spikes in photoionization-delay curves. An agent that simply plots the data and chooses one interpolation method could quickly describe a spike as a new physical resonance. Its code may run successfully. But a high-order interpolation method can also create a numerical artifact. Distinguishing these accounts requires comparing interpolation methods and perturbing the nodes to test whether the spike remains (Section 5).

The benchmark's logic makes the steps visible:

1. **Input:** The agent receives the scientific goal, frozen data, variable definitions, and experimental context, but not the source paper or its conclusion.
2. **Form an observation:** It notices a spike in part of the delay curve, proposes a possible resonance, and saves the analysis code and numeric output behind the plot.
3. **Distinguish explanations:** It compares interpolation methods, moves sampling nodes, and checks negative controls or alternative hypotheses. If the spike moves or disappears with the method, confidence in the physical explanation should fall. If it remains under reasonable perturbations, its scope still needs to be stated.
4. **Supply checkable evidence:** The judge compares the report with the executed code, outputs, key numbers, and claim. A promise to “run robustness tests later” is not evidence that the tests were run.
5. **Specify what could overturn the claim:** A mature report identifies a future measurement that would support, narrow, or overturn the physical interpretation, with enough detail to make the measurement and decision rule executable.

This is a teaching path derived from the Chemistry_07 case, not a complete execution trace published for one agent. The paper reports scores of 50.9–59.9 for the four systems on this task. Its difficulty lies in distinguishing a surface pattern from a numerical artifact, not in tricking an agent with an adversarial puzzle. Similarly, Physics_05 asks whether a temporal-delay transition seen in synthetic models generalizes to real networks. A visible trend in the report cannot substitute for an actual cross-dataset test (Sections 4.4–5; Table 7).

> **Huahua's engineering note**
>
> A script that finishes has only reached a reportable result. Ask which simple alternative could produce the same plot, then ask what observation would make you withdraw the conclusion. Those questions often add more value than another paragraph explaining a mechanism.

## How to read the experiment: a narrow plateau is not a ranking

### Evaluation setup

The authors compare Claude Code 2.1.220, OpenScience 2.0.1, Codex CLI 0.149.0, and DeepSeek Harness 0.1.0rc7. All four scaffolds use the same frozen DeepSeek-V4-Flash base model with thinking disabled, aiming to isolate differences in tool use, state management, task decomposition, and workflow. Each system runs once on each of 40 tasks, for 160 system–task runs. The scoring judge is a fixed GLM-5.1 in a W4A8 quantized setup with thinking disabled. Across the experiment, the judge evaluates 724 reported discoveries, which become 630 after semantic deduplication (Section 4.1).

Using the same base model is a meaningful control, but it answers only how four scaffolds compare under this model snapshot. It is not a factorial study of four scaffolds across multiple base models, and it does not estimate how much claim selection varies when the same system reruns a task. The control helps interpretation while also limiting its scope.

### Overall scores: small mean differences, no reliable winner

| System | Mean task score / 100 | 95% CI of mean | Per-task range |
| --- | ---: | ---: | ---: |
| Claude Code | 60.27 | 58.36–62.18 | 44.3–72.9 |
| OpenScience | 59.03 | 57.08–60.97 | 36.2–67.4 |
| Codex CLI | 58.81 | 57.25–60.36 | 46.8–70.8 |
| DeepSeek Harness | 58.40 | 56.31–60.49 | 43.8–72.2 |

The four means span only 1.87 points, and their 95% confidence intervals overlap. Paired Wilcoxon signed-rank tests on 40 task-level differences found no reliable pair: the smallest $p$ was 0.118 and all others were at least 0.14. The conclusion remained after Holm correction. A TOST using a pre-specified practical-equivalence margin of ±4 points also placed all six pairs inside that range. These results do not support saying that Claude Code “won” or that one harness is more scientifically capable. They also do not mean that the benchmark cannot discriminate: system scores on an individual task differ by as much as 25.5 points, and each system leads a similar number of tasks (8–13). Similar aggregate means arise because leads and deficits on different tasks offset one another (Section 4.2; Figure 2; Tables 4 and 7).

### Dimension scores: execution and traceability do not establish judgment

The more revealing result is a gap of about 38–40 percentage points between stronger and weaker dimensions. The authors normalize scores over all reported discoveries: evidence auditability is about 78–81%, and novelty 83–87%; control testing is 11–16%, robustness 9–14%, falsifiability 29–33%, and cross-dataset generalization only 0.00–0.41%. A high novelty score should not be taken to mean that new claims are correct. It mainly reflects claims formed from task data and adding something relative to the literature cutoff; without controls, a novel claim can still be an artifact (Section 4.3; Table 6; Figure 3).

Near-zero cross-dataset performance has more than one cause. Some tasks do not have a natural second dataset, period, or population for a holdout. Even where repeats or condition variation exist, agents rarely hold out data, freeze criteria, and run out-of-sample validation. A single-phase workflow also makes it hard to establish that criteria were fixed before validation data were seen. The authors therefore interpret the near-zero rate mainly as a lack of self-initiated external validation, while acknowledging that this dimension is not fully measured by the current tasks. Task-level feasibility labels and a two-phase release of validation data remain future work (Section 4.3).

### Task difficulty and disagreement are another kind of signal

Figure 5 places mean task score alongside disagreement among systems. The nine tasks with a four-system mean below 55 often require distinguishing artifacts, delimiting extrapolation, or deriving a governing form; some also show large differences between systems. The authors report Pearson $r=-0.31, p=0.049$ and Spearman $\rho=-0.23, p=0.15$ between task mean and disagreement. They treat this as descriptive: Spearman is not significant, and the mean and range share the same four scores, creating mathematical coupling. The result should not be simplified to “harder tasks always make agents less consistent” (Section 4.4; Figure 5; Table 7).

## Evidence map: what is supported, and what remains an interpretation

| Layer | What the paper provides | Reasonable reading and boundary |
| --- | --- | --- |
| Benchmark design | 40 curated tasks, blinding protocol, artifact-grounded 29-item rubric, and hidden source/verification assets (Sections 3.1–3.6; Figure 1; Appendix B) | An operational and automatically scored proposal for open-ended claim quality; not a sample representing every research activity. |
| Average performance | Four scaffolds share one DeepSeek-V4-Flash snapshot; means are 58.40–60.27 with no reliable pairwise difference (Section 4.2; Table 4) | No stable scaffold winner under this benchmark and model; not evidence that results would hold for different base models. |
| Discovery–execution gap | Better traceability and novelty, weaker controls, robustness, external validation, and falsifiability across all four systems (Section 4.3; Table 6; Figure 3) | Supports the diagnosis that running analyses and retaining artifacts are easier than testing a claim within this benchmark; does not prove agents universally fail at these tasks in real laboratories. |
| Concrete failure slices | Interpolation spikes in Chemistry_07 and synthetic-to-real extrapolation in Physics_05 (Section 5) | Shows why plausible-looking trends need artifact checks and transfer tests; two examples are not representative of every task. |
| Judge validity | Fixed quantized GLM-5.1, artifact grounding, and deterministic aggregation; human calibration and a second-judge sensitivity analysis remain future work (Sections 4.1 and 6.3) | Fixing a judge can make a process repeatable. Until comparison with experts or another judge, repeatability is not calibration against scientific review. |

The authors describe the bottleneck as scientific judgment rather than coding. The results do show that, within this benchmark, systems can produce code, run analyses, and report traceable artifacts, while controls, sample or method perturbations, and validation-data use are scarce. Here “judgment” means the rubric-scored ability to choose discriminating tests, compare alternatives, and delimit a claim; the experiment does not directly observe an agent's internal mental state. A more precise summary is that the evaluated outputs show a large execution–discovery gap, while the broader causal explanation still needs wider testing.

## Limitations, judge calibration, and unsupported conclusions

### One frozen base model across four scaffolds

Giving all four agents DeepSeek-V4-Flash reduces confounding from different base models and lets the study examine tool calling, state management, and workflow differences. It answers only how these scaffolds behaved under that model. The paper calls this an initial baseline; it reports neither multiple base models nor multiple seeds. We therefore cannot say that four commercial systems generally score alike or that this gap applies to every frontier model. Each system–task cell ran once. The 95% confidence intervals for means estimate uncertainty across tasks, not claim-selection variance when the same task is rerun (Sections 4.2, 6.1, and 6.3).

### The fixed LLM judge has not completed validity calibration

One fixed GLM-5.1 W4A8 judge with thinking disabled scores each claim under the 29-item rubric. A fixed judge, three-level item decisions, evidence grounded in artifacts, and deterministic aggregation help make the scoring procedure repeatable. They also avoid relying solely on a report's style. But “repeatable” and “correctly calibrated” are different properties: the same judge can consistently repeat a bias. The paper says that a small audit with a non-quantized judge with thinking enabled, human-expert calibration, and a second-judge sensitivity analysis remain future work (Sections 4.1 and 6.3). For now, the score can be described as automated and artifact-grounded, not as a scale shown to agree with experts or calibrated across judges.

### The rubric and task set embody choices

Assigning 45 points to auditability and 15 each to robustness and controls encodes the authors' operational account of credible discovery. This explicit definition is a strength, and it also means the total score reflects a value choice. The 40 tasks were purposefully selected for interpretable data, recoverable results, and testable variation. They are real scientific data suited to the evaluation, not a population sample balanced by the volume of research in each domain. The evidence comes from retrospective computational dry-lab tasks; external validity for wet-lab work, restricted datasets, long-horizon research cycles, or discovery from genuinely new data remains unknown (Sections 3.2–3.4, 6.1, and 6.3).

### Blinding, the reference bonus, and task scores

Source conclusions are kept out of the task workspace, but the model may have encountered related literature during pretraining. The $T_0$ novelty comparison can reduce the benefit of memorized answers; it cannot eliminate contamination risk. The task score also contains up to 10 points for hidden-reference coverage. It is therefore a mixed measure dominated by evidence quality with limited reference coverage, not a pure discovery score entirely detached from source findings. A reward for each sufficiently strong distinct claim could also influence claim volume. The top-two 80-point body and minimum quality threshold limit this incentive, but the breadth–quality relationship should be examined in further work (Section 3.6).

## Artifacts and reproducibility

As of October 20, 2026, the authors' [TruthInsightBench repository](https://github.com/TruthInsight-stack/TruthInsightBench) is publicly accessible. Its README identifies V1.0, task data for 40 tasks, four agent-harness adapters, run-freezing code, and evaluation/scoring tools. Benchmark-authored software, documentation, metadata, and evaluation assets are licensed under Apache-2.0. Third-party scientific data retain upstream terms; some components are limited to non-commercial research. Check the repository's [third-party notices](https://github.com/TruthInsight-stack/TruthInsightBench/blob/main/provenance/THIRD_PARTY_NOTICES.md) and [source attribution](https://github.com/TruthInsight-stack/TruthInsightBench/tree/main/provenance) before reuse. Running experiments requires Python 3.11, Node.js 20, Docker, an agent-model endpoint, and a judge endpoint/key configured by the user; model inference costs are not covered by the code license.

The repository supplies the main programs and task data needed to assemble a run workspace and score a frozen run. It does not include the four systems' original run artifacts, nor does it expose all prompts, decoding, resource, network-permission, and failure-handling settings used in the paper. This reading did not install the environment or rerun the benchmark; the four-system results are the authors' reported results. Public artifact access is not the same as an independent reproduction. Researchers can run published tasks under the applicable data terms; to compare with the paper, they must fix model and harness configurations, provide compatible endpoints, and preserve outputs. Some exact alignment may remain impossible because the authors' original internal run settings were not all released (Section 4.1; repository README).

## Bloss0m engineering judgment: separate two evaluation layers

**Bloss0m engineering synthesis:** When designing an AI research workflow, acceptance can be split into two layers. First ask whether the task ran to completion and whether its code and numbers are traceable. Then ask whether the claim was tested through controls, perturbations, independent data, and conditions that could falsify it. This two-layer framing is an engineering recommendation inferred from TruthInsightBench's six dimensions; it is not an additional method formally proposed by the authors and should not replace domain-expert review.

If the objective is faithful reproduction of a paper, use a reproduction benchmark with its target values and method details. If the objective is to find a new phenomenon, preserve answer blinding and score failures, negative results, and applicability boundaries. Both evaluations can coexist, but they answer different questions. Before deployment, separately check whether the judge is calibrated for your field, data modality, and consequences. An automated score alone should not be treated as peer review of a new discovery.

One measurable improvement direction follows from the results: require each conclusion to link to code and output; make simple baselines, no-signal controls, competing explanations, and method sensitivity explicit in the task; and release held-out data only after discovery criteria are recorded. These steps follow the gaps in control, robustness, cross-dataset evaluation, and falsifiability in the rubric. They are engineering experiments to test, not interventions shown by this paper to improve real scientific productivity.

The limits also define where this benchmark is not enough. A claim of a first real-world discovery cannot be established by 40 retrospective tasks. A broad ranking of different base models cannot be derived from one frozen model. And a single judge without completed expert calibration cannot serve alone as formal scientific peer review. TruthInsightBench is useful as a direction for research-output quality checks and evaluation design, not as a standalone certification of research ability.

## Three things to remember

1. **What is evaluated:** Reproducing a known conclusion measures execution and replication. TruthInsightBench instead tries to measure whether an agent can form its own claim from blinded data and show that the evidence supports it.
2. **Main result:** Four scaffolds using one frozen DeepSeek-V4-Flash form a narrow 58.40–60.27 plateau. Shared weaknesses lie in controls, robustness, cross-dataset validation, and falsifiability; the study does not establish a reliable winner.
3. **Trust boundary:** A fixed judge and automatically recomputable score do not prove calibration against experts. A single retrospective dry-lab benchmark run cannot replace multi-model, multi-seed tests, new data, and independent research teams.

Continue with [the Sol-Pi auto-research harness evaluation](/en/paper-reading/92-sol-pi-auto-research-harness/), [composable Raven agent harnesses](/en/paper-reading/81-raven-composable-agent-harnesses/), and [trace-accountable agentic retrieval](/en/paper-reading/93-trace-accountable-agentic-retrieval-archives/). These readings add perspectives on research loops, harness components, and traceable execution evidence.

## Primary sources

- Yang, Zhibo; Zhang, Chen; Zhang, Yuewei; Wang, Hao. [TruthInsightBench: An Evidence-Grounded Benchmark for Automated Evaluation of Open-Ended Scientific Discovery Agents](https://arxiv.org/abs/2609.05079), arXiv:2609.05079 v1, submitted September 4, 2026. This reading anchors claims to v1 Sections 1–6, Figures 1–5, Tables 2–7, and Appendices B–C.
- [arXiv HTML v1](https://arxiv.org/html/2609.05079v1) · [arXiv PDF v1](https://arxiv.org/pdf/2609.05079v1).
- The authors' [TruthInsightBench repository](https://github.com/TruthInsight-stack/TruthInsightBench) · [README](https://github.com/TruthInsight-stack/TruthInsightBench/blob/main/README.md) · [third-party notices](https://github.com/TruthInsight-stack/TruthInsightBench/blob/main/provenance/THIRD_PARTY_NOTICES.md).
