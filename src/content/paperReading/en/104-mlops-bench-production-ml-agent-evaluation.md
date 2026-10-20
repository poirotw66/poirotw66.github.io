---
title: "MLOps-Bench Reading: Can Agents Complete Production ML Operations?"
description: "MLOps-Bench places coding agents in 31 real open-source ML repositories and tests whether they can make executable changes across data, training, serving, monitoring, and governance. This reading explains how tasks are grounded in repository evidence, what six agents did on 187 held-out tasks, and why a 31.2% task completion rate beside a 68.7% test pass rate matters."
pubDate: 2026-10-20
updatedDate: 2026-10-20
tldr:
  - "MLOps-Bench measures whether an agent can meet a new behavioral contract and preserve existing behavior inside a frozen ML repository, not whether it can produce plausible-looking code."
  - "On 187 held-out tasks, Codex (GPT-5.5) achieved 31.2% task completion [25.0, 43.1] and 68.7% test pass rate [54.0, 75.6]; passing individual tests is not the same as completing the whole task contract."
  - "This is a benchmark built from public repositories and synthesized tasks, not a study of commercial production incidents. Test suites approximate contracts, and the paper does not explain how it calculated confidence intervals."
audience:
  - "Researchers building repository-level coding-agent evaluations and software reliability gates"
  - "Technical leaders assessing AI coding agents for ML platform, MLOps, and operations work"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "AI Research"]
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
image: "/paperReading/104-mlops-bench-production-ml-agent-evaluation/title_image.webp"
field: "AI Systems"
difficulty: "intermediate"
showToc: true
paper:
  title: "MLOps-Bench: Benchmarking AI Agents on Production ML Engineering in Real Repositories"
  authors:
    - "Quoc Co Tran"
    - "Hitesh Laxmichand Patel"
    - "Diwakar Mahajan"
    - "Kshitij Bakliwal"
    - "Avi Sil"
    - "Katrin Kirchhoff"
  year: 2026
  venue: "arXiv:2610.23506 v1 (2026-10-16); Findings of EMNLP 2026 (forthcoming)"
  links:
    pdf: "https://arxiv.org/pdf/2610.23506v1"
    arxiv: "https://arxiv.org/abs/2610.23506"
    code: "https://github.com/oracle-samples/mlops-bench"
series:
  id: "agent-systems-agent-evaluation"
  title: "Agent Systems and Evaluation"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Generic repository-repair benchmarks ask whether an agent can fix an issue; competition-style ML benchmarks ask about a model or analysis result. Neither necessarily checks the cross-stage contracts that keep an ML system operational: train/serve feature consistency, versioned deployment artifacts, useful monitoring signals, or CI gates that block an unsafe release.
- **Core insight:** Put an agent inside a frozen, real open-source ML repository, ground the request in that repository's code, configuration, and workflow, then use fail-to-pass (F2P) tests for new behavior and pass-to-pass (P2P) tests to protect existing behavior. The goal is not to copy an oracle patch; it is to satisfy an externally observable engineering contract.
- **Strongest evidence:** The authors construct 212 validated tasks from 31 repositories. They tune the generation process on a 25-task development split and compare six agents on 187 tasks from the remaining 29 repositories. Codex (GPT-5.5) has the highest task completion rate, 31.2% [95% CI 25.0–43.1], and an individual test pass rate of 68.7% [54.0–75.6] (Tables 3 and 6).
- **Main boundary:** Test pass rate is the share of all individual scoring tests passed; task completion requires every effective scoring test for a task to pass. Their gap indicates that many changes implement some behavior but miss at least one requirement. It is not a direct estimate of production incident rates or the probability of success in real engineering work.

The paper appeared as arXiv v1 on October 16, 2026; the arXiv page lists Findings of EMNLP 2026 as forthcoming. The authors address an evaluation gap: an agent working in a plausible codebase must do more than make code run—it must reason about the constraints that span an ML system's lifecycle. They select public ML repositories with traceable MLOps surfaces, generate tasks from each repository's existing data, feature, training, serving, monitoring, and governance workflows, and test both required new behavior and behavior that must remain intact. Six agents are evaluated by execution on 187 tasks that were not used to tune benchmark construction. The results show that interactive coding agents often produce executable, partially correct patches, while a much smaller share passes every test for a task. “Some tests passed” and “the engineering change is complete” therefore need separate measures.

## Limitations of prior approaches: why ordinary coding benchmarks miss MLOps

Correctness in a machine-learning system does not live only inside a model function. A loader must preserve its schema contract; feature definitions must agree between training and inference; training outputs need traceable artifact metadata; a serving interface must reject malformed requests; monitoring must emit useful signals; and a release workflow must connect quality gates to an actual decision. A change to one module may alter downstream services, and one passing test does not show that adjacent behavior stayed intact.

In the Introduction and Table 1, the paper contrasts this gap with two groups of prior evaluations. SWE-bench centers on real repository issues, while data-science and ML-agent benchmarks often emphasize experiments, analysis, modeling, or competition outcomes. The authors argue that these directions do not combine repository-grounded execution, MLOps lifecycle semantics, and tests that distinguish a plausible but behaviorally incomplete patch in one benchmark. Table 1 is the authors' comparison of related-work scope; it does not establish that MLOps-Bench represents every commercial ML operations environment.

An MLOps-Bench instance is a repository-level intervention. An agent receives a frozen repository workspace and a natural-language task, inspects files, changes code or configuration, runs commands, and returns a patch. The evaluator then adds benchmark tests and checks both which new behaviors hold and which existing behaviors were preserved. The agent does not receive the oracle patch, buggy baseline, repository-analysis metadata used during generation, or generator retry traces (Section 4A). The comparison is therefore based on executable outcomes, not on whether an explanation sounds convincing.

## Core intuition: a complete task must add and preserve behavior

“How many tests passed?” can make local progress look like task success. MLOps-Bench separates its tests into two contracts:

- **Fail-to-pass (F2P):** A new requirement should fail on the starting buggy baseline and pass after an implementation that meets the task. Examples include rejecting input with missing fields in a serving API or blocking a release when model quality regresses.
- **Pass-to-pass (P2P):** The patch should not break behavior that already existed, such as a public function signature, empty-input handling, or adjacent module behavior. These tests can reuse or lightly extend existing tests.

A task is therefore more than “make a new test green.” The new contract must hold while relevant old contracts remain true. An agent might add a threshold check but fail to connect it to the CI entry point; a local function test could pass while the release still would not be blocked. Or a patch might add the requested behavior but break an existing API and fail a P2P regression test. Table 5 defines task completion as passing all effective scoring tests for a task; the test pass rate is the proportion of individual tests passed across evaluation tasks.

![Figure 1: MLOps-Bench builds and evaluates tasks from evidence in public repositories](/paperReading/104-mlops-bench-production-ml-agent-evaluation/figures/figure-1-construction.webp)

**Figure 1.** Figure 1 in the paper: freeze a repository, extract lifecycle evidence, generate a task and oracle/buggy patches, create behavioral tests, and score an agent patch. It illustrates benchmark construction, not agent success rates. Source: Tran et al., arXiv v1, Figure 1, CC BY 4.0. [Original figure and caption](https://arxiv.org/html/2610.23506#S0.F1).

## Walk a worked example through end to end: make a model release auditable

Appendix A, Tables 8–10, uses a healthcare waiting-time forecasting example to show a cross-stage task. The source repository contains Airflow DAGs, Python task modules, MLflow metadata, KServe-style deployment YAML, Kubernetes manifests, and ELK observability manifests. This is an example benchmark task in the paper's appendix, not a separate case study of a real commercial deployment.

1. **Input:** The agent receives the task description and an editable starting repository snapshot. It must build an end-to-end flow from data to a release decision.
2. **Data and features:** The DAG must produce a validated dataset version, quality report, and schema/lineage metadata. The feature stage must output a feature version, statistics, and a train-serving-skew baseline.
3. **Training and serving:** Training outputs an MLflow run or model URI, evaluation metrics, and a promotion-candidate status. The serving stage needs a versioned deployment manifest, readiness checks, and prediction telemetry.
4. **Monitoring and governance:** The monitoring contract defines drift, latency, and error thresholds plus a prediction-log contract. CI/CD then verifies upstream artifact handoffs, produces an auditable release-evidence bundle and rollback target, and returns a decision such as blocked, canary_only, or approved.
5. **Likely failure point:** Each file can be valid in isolation while stages refer to different data, feature, or model versions. If a deployment manifest points to an old model, or monitoring thresholds never reach the release workflow, local features may appear complete while the end-to-end contract is not.

The example constraints in Table 9 include at least 10,000 rows, categorical feature completeness above 99.5%, target completeness above 99.9%, duplicate rate below 0.5%, feature freshness within 24 hours, model-quality regression no greater than 2% versus baseline, p95 serving latency at most 500 ms, and prediction error-log rate below 1%. These values belong to that example task specification; they are not universal thresholds for every benchmark task and are not measurements of an experimental serving system. Table 10 then shows how artifacts pass from data pipeline to features, training, serving, and monitoring before CI/CD governance consumes them.

An oracle patch is one feasible implementation, not the only correct answer. An alternative patch that passes the contract tests and preserves behavior is also acceptable. The buggy baseline is not a straw man with deliberate syntax errors. It models incomplete engineering attempts: add an API but skip schema validation, compute features differently in training and serving, omit artifact metadata, support only normal inputs, emit metrics without thresholds, or add a governance check that never fails (Section 3.5).

## Method pipeline: how repository evidence becomes executable tests

The authors search public ML projects with MLOps-related terms, then manually select 31 repositories for lifecycle signals, domain variety, buildability, and audit feasibility (Section 3.1). Each repository is pinned to a source snapshot with metadata such as commit, license, language, dependencies, test commands, workflows, and likely change locations. This frozen snapshot gives task generation and evaluation a shared starting point and makes repository version part of benchmark provenance.

The generator organizes evidence into four context views. **Business context** describes the domain, users, and operational risks. **Technical context** identifies architecture, entry points, data paths, configuration, model artifacts, service interfaces, and tests. **MLOps context** records evidence about data, features, training, evaluation, serving, monitoring, CI, deployment, and governance. **Requirement context** turns an observed gap into a candidate requirement with file-level evidence, expected behavior, constraints, and behavior that must be preserved (Sections 3.2–3.4). Candidates without repository evidence, a native change surface, or executable checks are rejected.

Each accepted task has five description fields: business motivation, technical context, behavioral requirement, constraints, and evaluation intent describing what the hidden tests check. The authors then generate an oracle implementation and a plausible buggy baseline, followed by F2P and P2P tests. A task is accepted only when its oracle passes both test sets, its buggy baseline fails at least one F2P test for the intended reason, and tests do not rely on external services or hidden state (Section 3.5).

![Figure 2: MLOps-Bench stage-level task completion rates](/paperReading/104-mlops-bench-production-ml-agent-evaluation/figures/figure-2a-stage-task-completion.png)

![Figure 2: MLOps-Bench individual test pass rates by lifecycle stage](/paperReading/104-mlops-bench-production-ml-agent-evaluation/figures/figure-2b-stage-test-pass.png)

**Figure 2.** The paper's two Figure 2 heat maps show each agent's task completion and individual test pass rate across seven MLOps stages. Performance is uneven: the authors report relatively stronger coding-agent results on monitoring/observability and end-to-end tasks, while feature engineering and serving remain difficult for several agents. Do not read the second panel's individual-test proportions as task completion rates for those stages. Source: Tran et al., arXiv v1, Figure 2(a–b), CC BY 4.0. [Original figure and caption](https://arxiv.org/html/2610.23506#S4.F2).

## Evaluation setup: which agents solved which tasks

The full benchmark has 212 tasks across six core MLOps stages and one end-to-end category (Table 3): 31 data-pipeline tasks, 30 feature-engineering, 29 model-training, 31 model-serving, 31 monitoring/observability, 31 CI/CD and governance, and 29 end-to-end MLOps-flow tasks. The authors held out 25 development tasks to tune prompts, oracle construction, test construction, and validation checks. They report results on the remaining **29 repositories and 187 evaluation tasks**. The full corpus contains 636 F2P and 856 P2P tests, 1,492 total; the evaluation split contains 563 F2P and 736 P2P tests, 1,299 total (Table 3). The stage totals are slightly uneven because five candidate tasks were removed during quality checks.

Table 4 divides evaluated systems into two types. Interactive coding agents can inspect files, edit a workspace, run commands, observe failures, and repair; base agents are ReAct-style code-generation-and-execution agents built with LangGraph. The six systems and underlying model identifiers in Table 6 are:

| Agent system | Type and model | Task completion (95% CI) | Individual test pass rate (95% CI) |
| --- | --- | ---: | ---: |
| Codex | Coding agent, GPT-5.5 | 31.2% [25.0, 43.1] | 68.7% [54.0, 75.6] |
| Claude Code (Sonnet) | Coding agent, Sonnet 4.6 | 16.5% [8.6, 24.4] | 52.3% [44.9, 64.2] |
| Claude Code (Opus) | Coding agent, Opus 4.6 | 19.4% [15.7, 25.8] | 52.9% [42.1, 63.9] |
| Base Agent Sonnet | ReAct base agent, Claude Sonnet 4.6 | 14.5% [7.8, 24.9] | 39.2% [25.9, 47.7] |
| Base Agent GPT 5.5 | ReAct base agent, GPT-5.5 | 16.9% [8.6, 25.9] | 47.9% [36.5, 52.7] |
| Base Agent GPT 5.2 | ReAct base agent, GPT-5.2 | 13.4% [8.8, 21.9] | 31.4% [24.7, 46.3] |

These are results from the reported evaluation run under a common type of repository-level harness. The paper reports the agent and model identifiers available at evaluation time but does not fully specify product-version settings, tool/token/time limits, or the calculation method for the 95% confidence intervals next to the results. The values should therefore be treated as author-reported benchmark results. The paper does not give enough detail to tell whether the intervals capture variation across repeated runs or how task-level differences were handled.

## Reading the results: passing some tests can still leave the task incomplete

The main tension in Table 6 is not the leaderboard position; it is that the two metrics answer different questions. For each evaluation task, completion is counted only when every effective scoring test passes. The test pass rate aggregates the outcome of every individual test across tasks. Codex's 68.7% test pass rate means that many required behaviors are satisfied; its 31.2% task completion rate means only about three in ten tasks pass every tested requirement. We cannot subtract the percentages and claim “36.5% of tasks were nearly successful”: they use different units of observation and do not show how many tests each individual task passed.

This gap supports a scoped but important conclusion: in this benchmark, executable partial progress often coexists with at least one unmet contract or regression. A patch that runs, passes a local test, or comes with a complete-sounding explanation should not by itself count as task completion. The results do not measure incident rates in enterprise workflows, nor do they show that the same models will score identically with other tools, repositories, constraints, or human oversight.

Coding agents have higher overall completion than each of the base-agent wrappers; Claude Code Opus also exceeds Sonnet. This supports the claim that interactive tools and repair loops help in this task setting. It is not a pure model comparison, because agent scaffolds, tools, and workflows differ together. The gap among six systems cannot be attributed to underlying model capability alone.

Figure 2 shows that lifecycle-stage results vary. The authors report relatively stronger coding-agent performance on monitoring/observability and end-to-end tasks, while feature engineering and serving are harder for several agents. Since the main text does not discuss every heat-map cell, we do not turn its colors into a universal ranking of task difficulty. Table 7 categorizes failed tasks only: 56.8% of Codex's failed tasks were assigned to “wrong code functionalities,” followed by import problems (20.5%) and missing dependencies (13.6%). These are error-category shares among failed tasks, not failure rates over all 187 tasks. The authors also report more repository-integration failures for Sonnet, a broader mix including timeouts for Opus, and different weaknesses in base wrappers that lack dynamic browsing, execution, or repair loops.

![Figure 3: A passing Codex patch example in the benchmark](/paperReading/104-mlops-bench-production-ml-agent-evaluation/figures/figure-3a-codex-pass.webp)

![Figure 3: A failing Codex patch example in the benchmark](/paperReading/104-mlops-bench-production-ml-agent-evaluation/figures/figure-3b-codex-fail.webp)

**Figure 3.** Figures 3(a–b) in the paper pair one passing and one failing Codex benchmark example to show how behavior tests distinguish patch outcomes. They are two examples, not a statistical breakdown of all failures; consult Table 7 for error-category shares. Source: Tran et al., arXiv v1, Figure 3(a–b), CC BY 4.0. [Original figure and caption](https://arxiv.org/html/2610.23506#A2.F3).

## Task and human audits: checking generation quality, with sampling limits

The authors report three manual reviews. The first asks whether existing issues can be repurposed as MLOps tasks. Five annotators with ML-engineering backgrounds double-annotated two groups of 25 items. Among SWE-bench PRs flagged as MLOps candidates, only 12/25 (48%) were unanimously accepted as MLOps; pooled agreement was κ=0.50. In contrast, all 25 generated tasks were unanimously accepted. The authors use this result to support constructing tasks from explicit lifecycle evidence rather than relabeling generic repository issues (Section 3.8.1). With only 25 items in each group, this does not characterize every SWE-bench issue or every generated task.

The second review checks whether F2P tests cover the observable behaviors stated in a task contract. The authors randomly selected 10 tasks, each independently reviewed by two annotators. Nine suites were unanimously judged to capture the stated contract; one was not fully covered, but both reviewers estimated that it covered an average of 85% of functional requirements. Raw agreement was 100%, with κ=1.0 (Section 3.8.2). This is evidence beyond a generator's own claim of test quality, but the sample is still only ten tasks. Moreover, F2P focuses directly on required new behaviors; it does not establish coverage of every environmental interaction or long-term operations risk.

The third review checks whether alternative implementations can pass as correct. Of ten patches, both annotators initially accepted eight as valid alternatives; after a third-person adjudication, the other two were accepted as well (Section 3.8.3). This matters because the oracle is a feasibility reference, while the behavioral contract defines acceptance. It reduces concern that tests merely prefer the oracle's exact text, but the review covers only ten patches and cannot eliminate overfitting or narrow-test risks across all tasks.

## Evidence map and main limitations

| Question | Paper evidence | What it supports | What it does not establish |
| --- | --- | --- | --- |
| Can agents make repository-native MLOps changes? | 187 tasks across 29 held-out repositories; task completion in Table 6 | Whole-task pass rates for these six systems on this frozen benchmark; coding agents do better overall | The success rate of all AI agents, commercial ML platforms, or natural workflows |
| How do partial progress and full contract completion differ? | Metric definitions in Table 5; both measures in Table 6 | Many individual tests can pass while a task still has at least one unmet requirement | The per-task distribution of partial passes or the number of “almost solved” tasks; the paper does not report the joint distribution needed to calculate these |
| Do tests privilege the oracle patch? | A 10-task F2P contract audit and a 10-patch alternatives audit in Sections 3.8.2–3.8.3 | Small human audits suggest that tests mostly cover stated behavior and accept reviewed alternatives | Full manual validation of tests across all 212 tasks |
| Where are the weak points? | Figure 2 and Table 7 | Stage differences and failure categories deserve follow-up; wrong functionality, imports, and dependencies are important failure modes | A complete causal explanation of stage results or real-world incident probability |

The authors explicitly state in the Limitations section that their repositories have genuine ML lifecycle structure but are public codebases, not deployed commercial systems. Tasks are synthesized from repository evidence rather than drawn entirely from naturally occurring production incidents. Synthesis enables balanced lifecycle coverage, oracle solutions, buggy baselines, and executable F2P/P2P tests, but tasks may be more localized, explicit, and test-oriented than real requests. Finite test suites approximate production correctness and cannot cover every downstream interaction, workload, data distribution, or operational failure (Section 6). Thus “production ML engineering” in the title describes the engineering domain and lifecycle contracts the tasks model; it is not direct evidence of enterprise deployment outcomes.

One model family participates in task generation while evaluation uses several models. The authors acknowledge possible validity threats from generated test style aligning with some agents. The top-scoring system is not from the generation model family, which reduces the most direct concern, but does not rule out subtler stylistic bias (Section 6). Also, Table 6 reports 95% confidence intervals without describing the calculation procedure in the available methods text. The paper does not provide enough settings to reconstruct every agent's tools, versions, token budgets, or time limits. These reporting gaps limit precise comparisons across benchmarks.

## Artifacts and reproducibility

As of October 20, 2026, the authors' [GitHub repository](https://github.com/oracle-samples/mlops-bench) makes the code, task corpus, and source-repository inventory public. Its README lists 31 source repositories, 212 tasks, 636 F2P tests, and 856 P2P tests, and describes released task workspaces as independently inspectable benchmark artifacts. The repository is marked Apache-2.0; the arXiv HTML marks the paper CC BY 4.0. The repository does not prescribe one suite-wide agent runner. Its README provides a pytest quick start for an individual task and its oracle contract; comparing agents across the full suite requires a compatible external evaluation harness.

This reading did not rerun the six agents or reconstruct the full leaderboard; its scores are author-reported. Public frozen tasks, tests, and repository provenance give external researchers material for a rerun. Reproducing the full paper result still requires access to and configuration of the corresponding agent systems, underlying models, and a compatible runner, as well as clarification of the original tool and time limits. Since the paper does not report all these settings or the confidence-interval procedure, the dataset alone cannot ensure that another environment will yield identical numbers.

## Bloss0m engineering judgment and when not to use it

The following is **Bloss0m engineering judgment**, not a theorem from the authors or a production-readiness level defined by the benchmark. For agent changes to an ML repository, define completion using both tests for new requirements and regression tests for existing behavior. For tasks involving features, data versions, artifacts, serving, or release governance, also check cross-component handoffs; a patch merely running is not enough. The benchmark's F2P/P2P distinction is a useful test-design pattern, not a guarantee that every system contract is covered.

Use the scores as a baseline or risk signal while retaining the repository, task, agent, model, and test scope. The evidence is insufficient for authorizing direct agent deployment, estimating enterprise productivity, or comparing vendors' real incident rates. A better next step is to build an acceptance set from frozen versions of your own repositories, representative operations requests, regression tests, and human review. Inspect patches and failure behaviors task by task, then decide which low-risk work may be automated incrementally. This is an engineering recommendation inferred from the benchmark design and limitations, not a deployment process validated by the paper's authors.

## Three things to remember

1. **Technical idea:** MLOps-Bench turns lifecycle evidence in repositories into a dual test contract for new behavior and preserved behavior; the oracle patch is not the only valid answer.
2. **Finding:** On 187 tasks from 29 held-out repositories, Codex (GPT-5.5) passed 31.2% of tasks completely and 68.7% of individual tests. A high test pass rate still falls short of whole-task completion.
3. **Boundary:** This evaluates synthesized production-style tasks on 31 public repositories. It is not evidence of commercial deployment performance or proof that agents can safely publish changes autonomously.

## Primary sources

- Tran, Quoc Co, Hitesh Laxmichand Patel, Diwakar Mahajan, Kshitij Bakliwal, Avi Sil, and Katrin Kirchhoff. [“MLOps-Bench: Benchmarking AI Agents on Production ML Engineering in Real Repositories.”](https://arxiv.org/abs/2610.23506) arXiv:2610.23506v1, October 16, 2026. [PDF](https://arxiv.org/pdf/2610.23506v1) · [HTML](https://arxiv.org/html/2610.23506).
- [Official MLOps-Bench artifacts and task corpus](https://github.com/oracle-samples/mlops-bench).
