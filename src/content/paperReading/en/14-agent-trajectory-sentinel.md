---
title: "Real-Time Detection and Repair of LLM Agent Failures: A Deep Read of AgentTrajectorySentinel"
description: "A critical reading of AgentTrajectorySentinel's low-cost healthy-only temporal monitor, deterministic verification, and rollback-and-retry loop, separating measured detection and repair gains from calibration dependence, content blind spots, and reproducibility limits."
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "The paper turns agent reliability into a runtime control loop: detect behavioural drift from step telemetry, verify tool results deterministically, then roll back to a known state and retry."
  - "Across 2,823 episodes in 25 corpora, the primary ESN-CUSUM monitor reports 0.707 detection and 0.872 AUROC at a 5% false-alarm budget, but direct cross-deployment transfer falls to 0.527 AUROC without recalibration."
  - "On the same labelled episodes, deterministic verification catches 60% of failures at 0/63 false positives, or 96% with coverage; the located repair policy lifts overall success from 52% to 73%."
  - "The durable engineering result is not a universal zero-false-positive monitor. It is a layered boundary where behavioural monitoring, contract checks, judge escalation, and rollback each handle the failures they can actually see."
audience:
  - "AI engineers designing agent observability, runtime guards, or evaluation harnesses."
  - "Technical leads connecting tool contracts, failure containment, retry cost, and calibration to a production agent platform."
tags: ["Paper Reading", "AI Agent", "Evaluation", "Agent Runtime", "Observability", "Governance"]
image: "/paperReading/14-agent-trajectory-sentinel/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
paper:
  title: "Real-Time Detection and Repair of LLM Agent Failures"
  authors:
    - "Sunny Dubey"
  year: 2026
  venue: "arXiv cs.AI/cs.LG/cs.SE preprint, v1 (submitted 2026-08-03)"
  links:
    pdf: "https://arxiv.org/pdf/2608.02464v1"
    arxiv: "https://arxiv.org/abs/2608.02464"
    doi: "https://doi.org/10.48550/arXiv.2608.02464"
    code: "https://github.com/sunnydubey1111/agent-trajectory-sentinel"
series:
  id: "agent-evaluation"
  title: "Agent Evaluation"
  part: 3
  totalParts: 4
---

## The paper in 90 seconds

- **Problem:** LLM agent failures typically germinate multiple steps before final answer delivery (such as looping, tool error cascades, or gradual goal drift). However, invoking an external LLM judge at every step introduces prohibitive latency and doubles inference costs, making real-time monitoring impractical in production (Sections 1–3).
- **Core insight:** Operational reliability is achieved through a layered runtime control loop: a lightweight temporal monitor (ESN-CUSUM) trained exclusively on healthy trajectories flags statistical behavioral drift; zero-false-positive deterministic verifiers validate tool contracts and numeric consistency; and upon alarm, the runtime rolls back state to the nearest verified checkpoint for targeted repair (`located` policy) (Sections 3, 10).
- **Strongest evidence:** Across 2,823 episodes in 25 corpora, the primary ESN-CUSUM monitor achieves 0.707 detection at a 5% false-alarm budget with an AUROC of 0.872, providing an average early warning lead of 4.6 steps (Section 5, Table 1). In the repair study, naming the specific unsatisfied check (`located` policy) raises overall task success from 52% to 73% (Table 4).
- **Main boundary:** The behavioral monitor strictly depends on healthy calibration matching the exact serving distribution; uncalibrated transfer across model families drops AUROC to 0.527 (near chance). Furthermore, statistical telemetry has an inherent blind spot for plausible-sounding but factually corrupt content, and irreversible external side-effects cannot be recovered via rollback (Sections 5.4, 8, 11).

This 16-page arXiv preprint was submitted by Sunny Dubey on August 3, 2026 (arXiv:2608.02464v1) without an initial formal conference or journal appearance recorded at publication time. If an agent begins looping at step four, cascades tool errors, or treats corrupted mock data as fact, can we intercept and repair it before delivering the final answer—without paying the computational cost of a step-level LLM judge?

AgentTrajectorySentinel demonstrates that agent safety does not require an omniscient, all-purpose detector. Instead, it provides a disciplined runtime boundary that unites behavioral monitoring, contract verification, state rollback, and targeted repair.

> **Huahua's engineering note**
>
> Before treating healthy trajectories as a null distribution, freeze the deployment's model, temperature, tool roster, telemetry schema, and acceptance gate. The monitor is cheap because it avoids a second model call, but it is not free: every deployment still pays a calibration and maintenance cost.

## What to know first

To evaluate the system architecture rigorously, we must first establish why prior approaches are insufficient and define the technical foundations:

1. **Why prior methods are insufficient:**
   - **Post-hoc outcome evaluation:** Frameworks such as OSReward assess trajectories only after task termination. While valuable for offline benchmarking, they cannot arrest cascading errors mid-flight or protect external systems from unauthorized actions.
   - **Step-level LLM auditor:** Prompting a 7B or larger language model to evaluate every intermediate action adds hundreds of milliseconds to seconds of latency per step and doubles API spend, making it economically unviable for high-throughput production workloads.
   - **Memoryless anomaly detection:** Classical anomaly detectors (such as single-step Mahalanobis distance) inspect steps in isolation without temporal context. They struggle to detect gradual goal drift or compound retry cascades, achieving only ~0.374 detection at a 5% false-alarm budget.

2. **Core prerequisite concepts:**
   - **Echo State Network (ESN):** A reservoir computing architecture maintaining a fixed, randomly initialized sparse recurrent reservoir. Because recurrent weights remain untracked during gradient updates, only a linear ridge regression readout layer is fitted, enabling inference in roughly 200 microseconds per step.
   - **CUSUM (Cumulative Sum Control Chart):** A sequential statistical analysis technique that accumulates persistent, small-magnitude directional residuals. An alarm triggers only when cumulative deviations exceed a threshold, making it ideal for detecting steady operational drift.
   - **Healthy-only Null Calibration:** Training does not require collecting exhaustive or synthetic failure labels. Baseline dynamics are fitted strictly on successful, healthy runs, and the alert threshold $\theta$ is calibrated using validation percentiles.
   - **Deterministic Verification:** Rule-based predicate engines (such as JSON schema checkers, call coverage trackers, and arithmetic evaluators) operating with zero false positives and negligible computational overhead.

## Core intuition

Conventional agent monitoring often attempts to deploy an LLM at every step to read natural language and guess whether the trajectory is intact. This approach is costly, slow, and prone to the very hallucinations it seeks to catch.

AgentTrajectorySentinel shifts the decision boundary by **separating behavioral dynamics from data contracts, and coupling detection directly to rollback repair**:

- **Temporal dynamics expose behavioral anomalies at low cost:** When an agent parses instructions, queries tools, and synthesizes answers normally, its token uncertainty, execution latency, and character n-gram frequencies follow recognizable temporal rhythms. Failures such as infinite loops or cascading retries alter these sequential dynamics, allowing ESN residuals to accumulate rapidly in CUSUM charts.
- **Data contracts belong to deterministic logic:** Whether an API response satisfies expected schemas, whether mandatory tools were called, and whether mathematical totals match raw tool data are formal engineering invariants. Evaluating them deterministically eliminates hallucination and guarantees zero false positives.
- **Intervention requires checkpoint rollback, not blind retry:** When an anomaly is confirmed, restarting from scratch wastes tokens, while retrying inside a corrupted context compounds errors. The optimal control strategy rolls back environment state to the last clean fact-gathering checkpoint and issues a directed prompt identifying the exact failed invariant.

## Walk one example through the method

Consider a production task where an agent collects quarterly financial metrics across regional branches and compiles a consolidated report:

1. **Task Input:** The user prompts the agent: "Query the APIs of 3 regional bank branches for Q2 revenue, compute the aggregate sum, and generate a Markdown financial summary table."
2. **Intermediate Representation and Telemetry:**
   - Step 1: The agent calls Branch 1 API, receiving `{"revenue": 1200000}`. The telemetry adapter extracts char 3-gram hashes, step latency (115ms), and token entropy into a 60-dimensional vector $x_1$. The ESN updates reservoir states, and CUSUM residuals remain baseline.
   - Step 2: The agent calls Branch 2 API, which encounters a transient `500 Internal Error`. Failing to parse the error cleanly, the agent repeats identical calls three times in a tight loop.
3. **Anomaly Detection and Verification Trigger:**
   - Steps 3–4: ESN predictions clash with repetitive error codes and elevated token surprisal. The maximum channel CUSUM score $s_t$ crosses the calibrated threshold $\theta$ (Threshold alarm).
   - The alarm triggers the Deterministic Verifier Suite:
     - `tool_contract`: flags that Branch 2 returned an unexpected HTTP error payload rather than the required schema.
     - `required_coverage`: verifies that only 1 of the 3 mandatory branch endpoints completed successfully.
     - `total_consistency`: marks the final summation as unverified due to missing source data.
4. **Rollback and Directed Repair:**
   - The runtime intercepts execution, rolling back agent memory and environment state to the checkpoint established after Step 1 (preserving Branch 1's valid output).
   - The system initiates the `located` repair policy: injecting a targeted prompt: "Validation failure: Branch 2 call returned an invalid error schema, and data for Branch 2 and Branch 3 remains uncollected; adjust request parameters or query the secondary fallback endpoint."
   - The agent switches to the fallback endpoint, retrieves data for Branches 2 and 3, recomputes the sum, satisfies all deterministic predicates, and emits the verified Markdown report.
5. **Likely Failure Point:** If Branch 2 had returned a syntactically valid JSON payload containing an erroneous, fabricated figure (e.g., 120,000 instead of 1,200,000) and no external cross-reconciliation source was configured, both the ESN behavioral monitor and schema checkers would pass the output. Detecting this form of plausible semantic hallucination remains outside the scope of observable telemetry.

## Technical mechanism

AgentTrajectorySentinel comprises four interconnected components (Sections 3–4):

### 1. Observable Telemetry Vector ($x_t$)

At each execution step $t=1,\ldots,T$, the runtime adapter maps raw agent execution traces into a fixed-dimensional observable feature vector $x_t = [e_t; u_t; m_t]$ (Section 4, Table 1):
- $e_t$: Deterministic character 3-gram hash embeddings of output text, projecting shallow lexical and structural patterns into a compact vector space.
- $u_t$: Token-level uncertainty aggregates, including average entropy, top-1 probability, and surprisal metrics.
- $m_t$: Action and execution metadata, encompassing one-hot action types, wall-clock latency, string length, and tool error flags.

The feature representation evolved across study iterations: starting with a 43-dimensional base telemetry, expanding to 51 dimensions with behavioral dynamics, and reaching 60 dimensions in version 4 by adding nine content-grounding features (such as query-result dissimilarity, result self-consistency, JSON prefix validity, and lexical relevance flags).

### 2. Healthy-Only Temporal Monitor (ESN-CUSUM)

For each feature channel $c \in \{1,\ldots,D\}$, the system instantiates an independent Echo State Network. Its recurrent reservoir state $r_{t,c} \in \mathbb{R}^{N_r}$ (reservoir dimension $N_r=100$) updates as:
$$r_{t,c} = (1 - \alpha) r_{t-1,c} + \alpha \tanh(W_{in} x_{t,c} + W_{res} r_{t-1,c})$$
where the input matrix $W_{in}$ and sparse reservoir weight matrix $W_{res}$ are fixed upon initialization, and $\alpha$ denotes the leaking rate.

A linear readout layer $W_{out,c}$ is fitted via ridge regression exclusively on healthy validation trajectories to predict the one-step-ahead value $\hat{x}_{t+1,c} = W_{out,c} r_{t,c}$. Defining standardized residuals $z_{t,c} = (\epsilon_{t,c} - \mu_c) / \sigma_c$, a one-sided CUSUM statistic accumulates directional drift:
$$C_{t,c}^+ = \max(0, C_{t-1,c}^+ + z_{t,c} - k)$$
where $k$ represents the slack parameter. The composite monitor score reflects the maximum across all feature channels:
$$s_t = \max_{c} C_{t,c}^+$$
An alarm fires when $s_t > \theta$, where $\theta$ is set to an empirical quantile on held-out healthy episodes corresponding to a chosen false-alarm budget (e.g., 5%). This causal scoring protocol guarantees that step $t$ cannot observe future steps and requires no failure labels during training.

![Real agent traces: step-level monitor behaviour on injected failures and the grounding blind spot](https://arxiv.org/html/2608.02464v1/fig1_score_traces_real.png)

*Figure 1: CUSUM scores on real-tool trajectories. Injected context corruption, goal drift, looping, and tool cascade trigger alarms after the verified onset, while behavioural channels can remain flat for grounding loss; that class is handled by the deterministic grounding verifier. Source: [Dubey, Figure 1 / §5](https://arxiv.org/html/2608.02464v1#S5.F1), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*

### 3. Deterministic Verifier Suite

The verification layer enforces three calibration-free software invariants:
- `total_consistency`: Recomputes arithmetic values by independently parsing numbers from raw tool responses and matching them against the agent's asserted totals.
- `required_coverage`: Validates against task specifications to ensure all mandatory API or tool endpoints were successfully invoked.
- `tool_contract`: Evaluates incoming tool outputs at the moment of arrival against predefined JSON schemas to verify structural integrity.

### 4. Hybrid Logistic Fusion

Section 7 details a cross-fitted logistic fusion model combining instantaneous Mahalanobis distance with cumulative ESN-CUSUM scores:
$$P(\text{failure} \mid x_t) = \sigma(\beta_0 + \beta_1 d_{Mahal}(x_t) + \beta_2 s_t)$$

![Hybrid logistic fusion: Mahalanobis/ESN decision boundaries across deployments](https://arxiv.org/html/2608.02464v1/hybrid_explain.png)

*Figure 5: Hybrid logistic fusion learns a distinct decision boundary for each deployment; short-horizon real-agent data relies more on Mahalanobis distance, while the long-horizon simulator relies more on ESN. Source: [Dubey, Figure 5 / §7](https://arxiv.org/html/2608.02464v1#S7.F5), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*

## How to read the evidence

To interpret the experimental claims accurately, we examine the empirical design, baseline comparisons, and diagnostic ablations:

### 1. Experimental Setup, Corpora, and Compute Footprint

- **Corpus Breadth (Datasets & Corpora):** The evaluation spans 2,823 episodes across 25 distinct corpora. Among these, 770 episodes executed real tools (real-tool corpus), while the remainder utilized a deterministic mock-tool suite.
- **Model Distribution (Models):** qwen2.5:7b (1,890 episodes), llama3.1:8b (433 episodes), qwen2.5:3b (357 episodes), and gemini-2.5-flash (143 episodes).
- **Agent Frameworks (Frameworks):** Native Ollama execution loops, LangGraph, and AutoGen.
- **Baselines:** Memoryless Mahalanobis and $\Delta$-Mahalanobis, cosine/self-drift, rolling entropy, linear VAR-ridge, GRU, LSTM, TCN, and ESN-Mahalanobis hybrid fusion.
- **Evaluation Metrics (Metrics):** AUROC, detection rate at a fixed 5% false-alarm rate (detection @ 5% FPR), mean lead steps, false positives, recovery rate, and overall task success.
- **Compute and Latency Overhead (Compute & Latency):** Offline studies were conducted on standard CPU architectures (recorded environment: 24 logical cores). ESN-CUSUM scoring requires approximately 200 microseconds per step; including the full v4 telemetry adapter, median latency is 674 microseconds per step—orders of magnitude faster than a 7B LLM auditor call.

### 2. Result One: Temporal Horizon Dynamics

Across five random seeds in the synthetic testbed, `esn_cusum_max` reports $0.707 \pm 0.068$ detection at a 5% false-alarm budget, an episode AUROC of $0.872 \pm 0.015$, and an average lead of 4.6 steps before task termination. In comparison, the strongest memoryless baseline ($\Delta$-Mahalanobis) detects only $0.374 \pm 0.03$.

Crucially, post-onset horizon analysis across 1,002 injected episodes reveals the temporal dependency:
- When post-onset horizon $\le 3$ steps, ESN's detection advantage over Mahalanobis is only +0.09.
- For horizons between 4 and 8 steps, the margin expands to +0.14.
- For horizons $\ge 9$ steps, the gap surges to +0.40.

This demonstrates that temporal reservoir dynamics require a window of steps between fault inception and episode conclusion to accumulate residuals; for very short trajectories, memoryless spatial distances remain highly competitive.

### 3. Result Two: Cross-Class Coverage and Transfer Fragility

![Real deployments: monitor coverage across failure classes](https://arxiv.org/html/2608.02464v1/fig3_class_coverage_real.png)

*Figure 2: Primary-monitor detection rates across nine real corpora. A blank indicates that the corpus does not contain that failure class. Looping detection is approximately 0.48–1.00, tool cascade 0.17–1.00, and goal drift 0.66–0.86 where present; clear weak spots are wrong_document (0.00–0.20) and malformed_json (0.05–0.50). Source: [Dubey, Figure 2 / §5](https://arxiv.org/html/2608.02464v1#S5.F2), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*

Figure 2 highlights the precise boundaries of behavioral monitoring: the monitor reliably catches dynamic anomalies (looping detection 0.48–1.00, tool cascade 0.17–1.00, goal drift 0.66–0.86). Conversely, errors that leave sequential dynamics undisturbed evade the monitor (wrong_document detection 0.00–0.20, malformed_json 0.05–0.50).

Furthermore, **uncalibrated cross-model transfer fails drastically**: transferring a monitor calibrated on qwen2.5:7b directly to llama3.1:8b on an identical task drops AUROC to 0.527 with a 75% false-alarm rate on healthy episodes. Recalibrating on the target model restores AUROC to 0.885, proving that calibration distribution matching is non-negotiable.

### 4. Result Three: Deterministic Verification and Repair Gains

The combination of deterministic checks and targeted repair (Section 10, Tables 3–4) represents the paper's most impactful engineering contribution:
- **Verification Performance (Table 3):** On matched episodes at served temperature $T=0.2$, deterministic checks catch 60% of failures, rising to 96% when coverage checking is enabled (compared to 54% for the monitor). Critically, deterministic checks yielded 0/63 false positives (0%), whereas the statistical monitor produced 11/63 false alarms (17%). On a 120-episode disjoint holdout, totals alone detect 54%, rising to 93% with coverage, with 0/64 false positives.
- **Repair Policy Analysis (Table 4):** Evaluated over 55 confirmed failure episodes, plain resampling recovers 16%; the `located` policy (which names the failed invariant without supplying the answer) recovers 45% ($p=0.0005$, averaging 6.4 calls per recovery); generic and specific prompt hints achieve 36%. Under Bonferroni correction ($\alpha=0.01$), only `located` achieves statistical significance.
- **End-to-End Accounting:** Across the entire 120-episode study, `located` repair lifts overall task success from 52% to 73%, recovering 25 failed runs without corrupting any previously successful episodes.

### 5. Result Four: Organic Failures and Hallucination Realities

In 30 non-injected, high-temperature episodes containing 11 organic failures (seven silent aborts, three fabricated counts, one ungrounded retrieval blend), the unadapted behavioral monitor caught only one fabrication and exhibited an AUROC of 0.31–0.42 (worse than random guessing), with a 36% false-alarm rate on healthy traces. A 55-episode preregistered replication produced only two candidate hallucinations; due to low base rates, the authors **explicitly make no claim of general hallucination detection**.

In contrast, deterministic completion checks caught 7/7 silent aborts with zero false positives, and numeric verifiers caught 0.55 of 11 provoked ungrounded inputs. This confirms that factual hallucination requires dedicated verification and external ground-truth references rather than behavioral telemetry.

## Evidence map

To prevent overgeneralization, we map the paper's findings across four distinct evidential tiers:

| Dimension | Concrete Items and Anchors | Engineering Consequence and Boundary |
| --- | --- | --- |
| **Direct paper evidence** | Table 1 (telemetry dimensions 43→51→60), Table 3 (deterministic verifiers 60%–96% detection, 0/63 FP), Table 4 (`located` repair raising success from 52% to 73%), Figure 1 (CUSUM residual traces), Figure 2 (class coverage), Figure 5 (hybrid decision boundaries). | In controlled mock and real-tool task environments, the layered control loop is effective. Temporal monitoring reliably catches looping and cascades; deterministic checks catch schema and arithmetic violations with zero false alarms. |
| **Author causal claim** | Claims that ESN reservoir dynamics uniquely capture long-range temporal anomalies; claims that `located` prompting succeeds because it preserves the model's autonomous reasoning space rather than forcing hardcoded answers. | The reasoning is plausible, but ablation studies show that wrapping a GRU in an identical per-channel max pool achieves 0.873 AUC. This suggests performance gains stem primarily from channel-wise max pooling and calibrated thresholds, rather than an intrinsic advantage of ESNs over all sequence models. |
| **Unsupported claims** | Does not establish deployment-agnostic, zero-calibration monitoring (uncalibrated transfer AUC drops to 0.527); does not demonstrate reliable detection of plausible factual hallucinations (organic AUC 0.31–0.42); does not prove that broken external APIs or irreversible side-effects can be resolved via rollback. | Never market the system as a universal zero-false-positive safety guardrail. Production deployments without healthy calibration must be rejected; irreversible external actions (such as sent emails or payments) cannot be undone via rollback. |
| **Bloss0m engineering synthesis** | Formulates the paper into four decoupled runtime control planes: (1) versioned telemetry schemas, (2) deployment-specific healthy calibration, (3) deterministic hard contracts, and (4) checkpointed rollback with directed repair. | Complements OSReward (post-hoc trajectory evaluation). In production platforms, behavioral monitoring functions as a low-cost triage signal, deterministic verification acts as a hard gate, and LLM judges serve as an expensive escalation path. |

## Artifacts and reproducibility

As of **August 7, 2026**, the official artifacts provided by the authors exhibit the following accessibility status:

- [Official GitHub Repository](https://github.com/sunnydubey1111/agent-trajectory-sentinel): Publicly accessible, containing `README.md`, pinned lockfiles, source code, episode traces, `DATA_CARD.md`, `REPRODUCE.md`, the claims ledger, and reproduction scripts under the MIT License.
- [Hugging Face Dataset](https://huggingface.co/datasets/sunnydubey1111/agent-trajectory-sentinel): Reachable endpoint hosting the complete 2,823-episode corpus in Parquet format, designated as `mixed-see-licensing`. Embedded model outputs, Wikipedia text, and weather data remain subject to upstream terms.
- [Hugging Face Spaces Demo](https://huggingface.co/spaces/sunnydubey1111/agent-trajectory-sentinel-demo): The interactive endpoint was verified in a `Running` operational state, confirming demo interface availability (distinct from an independent full-scale benchmark re-run).
- [Video Walkthrough](https://youtu.be/a05n_000klE): A YouTube demonstration video serving as supplementary explanatory documentation.

**Reproduction Scope and Constraints:**
The full benchmark suite was not re-executed from scratch for this review; experimental data reflects reported findings from the primary source. The minimal offline reproduction path consists of executing the synthetic experiments, verification studies, and repair re-analyses within the pinned CPU environment, cross-referencing generated tables against `CLAIMS.md`. Live experiments requiring local Ollama (Qwen/Llama) or the Gemini API constitute conditional reproductions contingent on external model access and local compute.

Furthermore, `DATA_CARD.md` documents that 512 out of 2,056 collection attempts were discarded by the acceptance gate (an overall 24.9% discard rate across corpora), underscoring that strict filtering is essential to baseline stability. External benchmarks (AFTraj-2K and ATBench) are downloaded for evaluation rather than redistributed by the repository.

## Bloss0m engineering judgment and when not to use it

Based on deep analysis of the experimental data and structural limitations, we establish the following operational guidelines:

### Recommended Adoption Patterns

1. **Deterministic Invariant Guards on High-Risk Tools:**
   Deploy `tool_contract` and `total_consistency` checks adjacent to high-risk tools (e.g., database transactions, billing APIs, report generation). These checks operate with 0 false positives and sub-millisecond execution, providing an uncompromising first line of defense.
2. **Behavioral Telemetry Triage for Multi-Step Agents:**
   In extended workflows ($\ge 5$ steps), employ ESN-CUSUM as an efficient telemetry sentinel to intercept infinite loops, retry storms, and goal divergence. Escalate to human review or LLM judges only when cumulative alarm thresholds are crossed, avoiding continuous per-step judge invocation.
3. **Transactional Sandboxes with Clean Checkpointing:**
   Structure agent environments with explicit fact-gathering checkpoints. When a tool error or contract failure is flagged, the runtime can cleanly revert memory and workspace state to a verified snapshot.
4. **Located Constraint Prompting for Repair:**
   Avoid blind resampling or hardcoded answer injection upon failure. Utilize the `located` prompting strategy, specifying exactly which invariant failed so that the agent can autonomously navigate the corrected reasoning path.

### Strict Non-Adoption Criteria and Prohibitions (When NOT to use it)

1. **Cold-Start Deployments Lacking Baseline Data:**
   Uncalibrated cross-model transfer degrades AUROC to 0.527 with a 75% false-alarm rate. Never enable statistical monitors without first accumulating and calibrating against a representative corpus of healthy traces from the exact target deployment.
2. **Irreversible External Side-Effects:**
   Operations such as dispatching emails, executing financial transactions, or modifying external production databases cannot be resolved by state rollback. Such actions require proactive human-in-the-loop authorization, not reactive recovery.
3. **Exclusive Reliance for Factual Hallucination Detection:**
   If an agent generates plausible but factually erroneous numbers without altering execution pacing or tool call structures, the behavioral monitor is fundamentally blind. Such cases necessitate external fact-checking or retrieval reconciliation.
4. **Very Short Trajectories ($\le 3$ steps):**
   Reservoir dynamics cannot accumulate sufficient residuals over short horizons, offering no benefit over simple single-step distance metrics.

This framework directly complements [OSReward's cross-platform agent outcome evaluation](/en/paper-reading/08-osreward-agent-evaluation/): OSReward addresses post-hoc trajectory scoring, while AgentTrajectorySentinel tackles real-time mid-trajectory containment. To address adversarial tool outputs, see [Indirect Prompt Injection (2023)](/en/paper-reading/42-indirect-prompt-injection/); for broader organizational frameworks, consult [Enterprise Agentic AI Governance](/en/blog/39-enterprise-agentic-ai-governance/) and [Enterprise AI Agent Security](/en/blog/43-enterprise-ai-agent-security/).

## Three things to remember

1. **Technical Idea:** Operational agent reliability is achieved via a layered runtime control loop—a lightweight temporal monitor flags dynamic behavioral drift, deterministic verifiers enforce strict data contracts, and transactional checkpoints enable directed rollback repair.
2. **Core Evidence:** Across 2,823 episodes, ESN-CUSUM achieves 0.707 detection at 5% FPR; deterministic verifiers capture up to 96% of failures at 0/63 false positives; and `located` repair raises overall task success from 52% to 73% (Tables 3, 4).
3. **Operational Boundary:** Behavioral monitors require distribution-matched healthy calibration (uncalibrated transfer drops to 0.527 AUROC) and cannot detect plausible semantic hallucinations. It is a failure-containment system, not an all-knowing silver bullet.

## Primary sources

- [arXiv record: Real-Time Detection and Repair of LLM Agent Failures](https://arxiv.org/abs/2608.02464): Version, author, abstract, and submission metadata.
- [arXiv HTML full paper v1](https://arxiv.org/html/2608.02464v1): §§3–11, Figures 1–5, Tables 1–5, limitations, and the artifact appendix.
- [arXiv PDF v1](https://arxiv.org/pdf/2608.02464v1): Complete 16-page preprint.
- [Official artifact repository](https://github.com/sunnydubey1111/agent-trajectory-sentinel): Source code, traces, evaluation results, data card, reproduction guide, and claims ledger.
- [Dataset](https://huggingface.co/datasets/sunnydubey1111/agent-trajectory-sentinel) · [Live demo](https://huggingface.co/spaces/sunnydubey1111/agent-trajectory-sentinel-demo) · [Walkthrough](https://youtu.be/a05n_000klE): Primary material artifact endpoints named by the authors.
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): License for the reused arXiv figures; repository source code is governed under the MIT License, and third-party data terms apply separately.
