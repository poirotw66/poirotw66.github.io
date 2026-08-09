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
image: "/paperReading/14-agent-trajectory-sentinel/title_image.png"
field: "AI Agent"
difficulty: "advanced"
showToc: true
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

- **Problem:** agent failures begin before the final answer; an LLM judge at every step can be too slow and costly.
- **Core insight:** a temporal monitor trained on healthy trajectories works with deterministic verification; supported interventions roll state back to a trusted checkpoint for targeted retry.
- **Strongest evidence:** across 2,823 committed episodes, three frameworks, and several models, the repair study compares monitor, verifier, and policy and reports task success from 52% to 73% (Section 5; Table 4).
- **Main boundary:** healthy-only calibration, short trajectories, injected failures, and weak textual-hallucination detection limit transfer to a new production stack.

## Why the previous approach is insufficient

A post-hoc judge only says failure already occurred, while telemetry-only anomaly detection cannot decide whether a tool result violates specification. The paper gives the temporal monitor a narrower job—cheap early suspicion—and deterministic verification the predicate decision; neither is a universal hallucination detector (Sections 2–3).

## Core intuition

The monitor learns time relationships in healthy telemetry, not a single step; the verifier checks files, schemas, and tool receipts. When intervention is warranted, state returns to the last trusted checkpoint and retries the affected segment (Figure 1; Section 3).

## Worked example: a report-writing run

An agent fetches data, writes a report, and submits it. The monitor flags a departure from healthy tool behavior; a verifier checks the expected file and schema. If schema validation fails, the system returns to pre-fetch state and retries acquisition and validation. If predicates pass, a monitor-only flag becomes false-positive tuning evidence. This is an explanatory Figure 1 flow, not a reported episode.

## How to read the evidence

**Table 4 / Section 5** holds workflow and evaluation fixed while changing detection, verification, and repair policy; 52% to 73% supports that setting only. **Figure 4** compares temporal, memoryless, and deterministic signals, not universal hallucination detection. **Section 5.4 and limitations** qualify average AUROC with filtered traces, small healthy splits, and cold-start limits.

## Artifacts and engineering decision

As of **2026-08-09**, the [official repository](https://github.com/sunnydubey1111/agent-trajectory-sentinel) is reachable and announces requirements, traces, results, a data card, and scripts; local reproduction still needs license, third-party-data, and model-access checks. Use deterministic invariants next to high-risk tools and the monitor for triage. Do not promise low false alarms without healthy calibration or roll back irreversible external actions.

## Three things to remember

1. A monitor detects trajectory drift; a verifier decides formal correctness.
2. 52% to 73% is repair evidence for one data/policy setting, not a universal gain.
3. Define checkpoints, irreversible actions, and a false-positive budget before deployment.

If an agent starts looping at step four, cascades tool errors, or treats a corrupted tool result as fact, can we stop it before the final answer is delivered—without paying for a second LLM judge at every step?

My short answer is: **AgentTrajectorySentinel demonstrates a useful runtime layering, not a deployment-agnostic monitor that catches every hallucination.** Its most transferable idea is closing detection into verification, rollback, and repair while measuring each layer's blind spots instead of hiding them behind one aggregate score.

> **Huahua's engineering note**
>
> Before treating healthy trajectories as a null distribution, freeze the deployment's model, temperature, tool roster, telemetry schema, and acceptance gate. The monitor is cheap because it avoids a second model call, but it is not free: every deployment still pays a calibration and maintenance cost.

## The short answer: reliability comes from layers, not one detector

This 16-page arXiv v1 preprint was submitted by Sunny Dubey on August 3, 2026. I found no venue or OpenReview record. The system has four connected parts:

1. **Observable telemetry:** every agent step emits output semantics, token uncertainty, and action metadata.
2. **Healthy-only behavioural monitoring:** an echo-state network (ESN) and CUSUM accumulate persistent deviations from healthy episodes.
3. **Deterministic verification:** checks recompute answers from the tool results the agent actually received, verify required calls, and validate tool-result shapes; a separate numeric-grounding check covers asserted numbers.
4. **Rollback and repair:** after an alarm, the run returns to its last fact-gathering checkpoint and calls the model again; the repair prompt names the failed check without handing over the answer.

Read it as a **failure-containment loop**, not as a new LLM-as-a-judge. The paper defines the problem, notation, and causal scoring protocol in [§3 Problem and Monitor](https://arxiv.org/html/2608.02464v1#S3).

## What the paper is actually doing: problem, state, and claim boundary

An episode is a step sequence $t=1,\ldots,T$. Each step emits an observable vector $x_t=[e_t;u_t;m_t]$: $e_t$ is a deterministic char-3-gram hash embedding of the output text, $u_t$ contains token-level uncertainty aggregates, and $m_t$ contains action type, latency, output length, and error flags. Telemetry evolves from a 43-dimensional base version to 51 dimensions with behaviour features and 60 dimensions with content-grounding features; the versions are listed in [Table 1 of §4 Telemetry](https://arxiv.org/html/2608.02464v1#S4.T1).

For each channel, the ESN keeps a fixed sparse reservoir and learns only a ridge readout to predict the next step. Let $s_t$ be the maximum of the channel CUSUM scores and let $\theta$ be the upper quantile of scores on healthy validation episodes; the system alarms when $s_t>\theta$. The important property is causality: step $t$ cannot see the future, and training needs no failure labels.

**Paper claim.** ESN-CUSUM scores a step in roughly 200 microseconds, far below a step-level 7B auditor call. But the full v4 telemetry adapter has a median cost of 674 microseconds per step; those numbers are not one interchangeable latency guarantee.

**Bloss0m judgment.** The portable design is the boundary between a healthy null, per-channel accumulation, deterministic checks, and rollback—not the ESN choice by itself.

## Evaluation setup: data, baselines, metrics, and cost

The paper and artifact contain 2,823 episodes across 25 corpora; 770 use real tools and the rest use a deterministic mock-tool suite. The model breakdown is qwen2.5:7b with 1,890 episodes, llama3.1:8b with 433, qwen2.5:3b with 357, and gemini-2.5-flash with 143. The main agent frameworks include a native Ollama loop, LangGraph, and AutoGen, alongside research-task and live-tool corpora. “Real” here means that an episode used real tools, not that it is production traffic; the injector still controls the onset in many research corpora.

Baselines include memoryless Mahalanobis and $\Delta$-Mahalanobis, cosine/self-drift, rolling entropy, linear VAR-ridge, GRU, LSTM, and TCN models, plus ESN–Mahalanobis hybrid fusion. The deterministic layer uses `total_consistency`, `required_coverage`, `tool_contract`, and numeric-grounding checks. The main metrics are AUROC, detection at a fixed false-alarm budget, steps saved or mean lead, false positives, recovery rate, task success, calls per recovery, latency, and state footprint.

Most offline monitor studies are CPU-only. The artifact's reproduction record names Windows 11, Python 3.14.5, and 24 logical cores as one recorded environment; GRU/LSTM/TCN baselines additionally require the CPU PyTorch build. The live agent needs local Ollama with qwen2.5:7b or llama3.1:8b; Gemini corpora and the measured judge need the Gemini API. These are the artifact's recorded settings, not a claim about the minimum hardware for every reproduction.

## Result one: temporal signal helps only when it has time to accumulate

Across five seeds in the synthetic testbed, the primary `esn_cusum_max` reports $0.707\pm0.068$ detection at a 5% false-alarm budget, episode AUROC $0.872\pm0.015$, and a mean lead of 4.6 steps. The strongest memoryless $\Delta$-Mahalanobis baseline reports $0.374\pm0.03$ detection. Read this headline with its testbed caveat: the injector supplies ground-truth onsets, but it is not the full distribution of real agent failures.

![Real agent traces: step-level monitor behaviour on injected failures and the grounding blind spot](https://arxiv.org/html/2608.02464v1/fig1_score_traces_real.png)

*Figure 1: CUSUM scores on real-tool trajectories. Injected context corruption, goal drift, looping, and tool cascade alarm after the verified onset, while the behavioural channels can remain flat for grounding loss; the deterministic grounding verifier handles that class. Source: [Dubey, Figure 1 / §5](https://arxiv.org/html/2608.02464v1#S5.F1), used under the paper's [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license.*

The horizon diagnosis is more useful for engineering than the pooled score. Over 1,002 injected episodes, the ESN's detection gap over Mahalanobis is +0.09 when the post-onset horizon is $\leq3$ steps, +0.14 at 4–8 steps, and +0.40 at $\geq9$ steps. The reservoir needs the failure to have started while the episode still has time left; if only one or two steps remain, a memoryless distance is competitive.

## Result two: cross-corpus failure coverage is the honest headline

![Real deployments: monitor coverage across failure classes](https://arxiv.org/html/2608.02464v1/fig3_class_coverage_real.png)

*Figure 2: primary-monitor detection rates across nine real corpora. A blank means that a corpus does not contain the class, not that detection is zero. Looping is about 0.48–1.00, tool cascade 0.17–1.00, and goal drift 0.66–0.86 on the four corpora where it appears; the weak spots are wrong_document at 0.00–0.20 and malformed_json at 0.05–0.50. Source: [Dubey, Figure 2 / §5](https://arxiv.org/html/2608.02464v1#S5.F2), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).* 

This figure is a better guardrail against overclaiming than pooled AUROC. Looping, tool cascades, and abrupt goal drift usually change observable dynamics; corrupted content that leaves behaviour unchanged does not. Cross-deployment transfer is not free either: a monitor calibrated on qwen2.5:7b and applied to llama3.1:8b on a matched plan reaches AUROC 0.527 with healthy false alarm 0.75, while recalibrating on the target reaches 0.885.

**Evidence.** The safe conclusion is that calibration distribution matters, not that llama3.1 is intrinsically hard. The paper also reports that uncalibrated qwen2.5:7b-to-3b transfer is near chance, while the 3b corpus reaches only 0.556 after recalibration, leaving target difficulty and calibration shift entangled.

## Result three: the content blind spot needs a different mechanism

Behavioural and statistical monitors share a blind spot: data can be corrupted without changing the agent's behaviour. Version 4 telemetry adds nine content-grounding features, including query-result dissimilarity, result self-consistency, JSON-prefix validity, character anomaly, and a lexical relevance flag.

In [Table 2 of §8](https://arxiv.org/html/2608.02464v1#S8.T2), the pooled injected set has $n=874$, with 313 content-class and 561 behavioural-class episodes. The content gate raises content-class detection from 0.27 to 0.58 (+96/−0) and behavioural detection from 0.74 to 0.79 (+27/−0). This supports “the right channel covers structured content errors,” not “grounding verifies every fact.” A plausible but wrong number still needs an external reference.

The paper also ablates token-surprisal telemetry: removing it changes ESN AUROC by +0.000 and detection by +0.002. A provider that withholds logprobs therefore does not automatically break the design; structured tool results visible to the adapter matter more.

## Result four: the hybrid is safer as a default, not dominant everywhere

![Hybrid logistic fusion: Mahalanobis/ESN decision boundaries across deployments](https://arxiv.org/html/2608.02464v1/hybrid_explain.png)

*Figure 5: hybrid logistic fusion learns a different boundary for each deployment; short-horizon real-agent data is more Mahalanobis-driven, while the long-horizon simulator is more ESN-driven. Source: [Dubey, Figure 5 / §7](https://arxiv.org/html/2608.02464v1#S7.F5), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).* 

Cross-fit logistic fusion has pooled AUROC 0.826, versus 0.802 for ESN alone and 0.807 for $\Delta$-Mahalanobis. That is a pooled gain because the parents fail in different regimes. But on eight datasets, the hybrid is no better than the stronger parent on seven AUROC comparisons and all eight detection-rate comparisons, with mean detection difference −0.140. The paper therefore presents it as a default when the deployment regime is unknown, not a dominance result.

The repository's ablation makes the mechanism clearer: giving the same per-channel max wrapper to a GRU raises it to 0.76 detection and 0.873 AUC, versus 0.60/0.82 for the monolithic GRU. **Bloss0m judgment:** much of the margin may come from channel-wise fusion and calibrated thresholds; it should not be summarized as ESN defeating every sequence model.

## Deterministic verification and repair: the closest result to production

The three core deterministic checks need no healthy null, threshold, or calibration:

- `total_consistency` recomputes the stated total from tool results the agent actually received.
- `required_coverage` verifies that every required call was made.
- `tool_contract` checks whether a result matches a shape the tool can return, at the moment the result arrives.

In [Table 3 of §10](https://arxiv.org/html/2608.02464v1#S10.T3), on the same labelled episodes at served temperature $T=0.2$, checks catch 60% of failures, or 96% with coverage, versus 54% for the monitor. Checks produce 0/63 false positives; the monitor produces 11/63 (17%). On a 120-episode holdout with disjoint task seeds, totals alone catch 54%, coverage reaches 93%, and false positives are 0/64. The llama3.1:8b arm on the same plan catches 110/110 failures with 0/10 false positives. These denominators differ; they do not combine into a universal 96% claim.

The repair study rolls each flagged run back to the same checkpoint and replays the same prefix. Each repair rung is repeated three times over 55 genuinely wrong episodes. [Table 4 / §10](https://arxiv.org/html/2608.02464v1#S10.T4) reports 16% recovery for plain resampling; `located`, which names the failed check without giving its value, reaches 45% ($p=0.0005$, 6.4 calls per recovery); `generic` reaches 36%, `specific` 36%, `recompute` 28%, and `adaptive` 21%. After Bonferroni correction at $\alpha=0.01$, only `located` survives as an established headline; generic and specific remain suggestive.

Across all 120 episodes, net accounting puts task success at 52% before repair and 73% with `located`, recovering 25 failures without breaking an originally correct run. Plain resampling already recovers 16%, so the gain cannot all be attributed to retrying. This is the paper's most portable platform lesson: **telling the agent which verifiable condition failed is more useful than handing it the correct answer.**

## Organic failure, hallucination, and negative results

The paper is strongest where it refuses to turn hallucination into a success story. Thirty non-injected high-temperature episodes contain 11 organic failures: seven silent aborts, three fabricated counts, and one ungrounded retrieval blend. Behavioural monitors, carried over with their deployment calibration, catch only one of the three fabrications and rank the organic failure set at or below chance (within-organic AUROC 0.31–0.42); a temperature-matched null still false-alarms on 36% of healthy episodes. The 55-episode preregistered replication produces only two candidate hallucinations, below the planned minimum of ten, so it makes **no hallucination-detection claim**.

In contrast, the completion check catches 7/7 silent aborts with zero false positives; the numeric-grounding verifier detects 0.55 of 11 ungrounded-input fabrications in the provoked corpus, while a separate deterministic-check study catches 26/26 provoked fabrications. Those are different denominators and different layers, not “100% hallucination detection.”

## Limitations, threats, and unsupported interpretations

**Paper-stated limitations.**

- The healthy null must match the exact serving distribution: model family, temperature, toolset, probe pattern, and latency regime.
- Slow goal drift evades every per-step-surprise monitor tested; only trajectory self-consistency sees it weakly.
- Results not sent through the telemetry channel are invisible, and terse results may carry too little signal.
- Plausible-value corruption is unidentifiable from observable telemetry by construction and needs an external reference.
- Organic fabrication has a low base rate; the scope is mock-tool and research-loop tasks, two local model families plus one commercial API, and wall-clock latency is machine-dependent.

**Selection and reproducibility threats.** The data card records 512 rejected episodes out of 2,056 attempts, an overall 24.9% discard rate ranging from 1.2% to 55.4% by corpus. AFTraj-2K and ATBench are downloaded for evaluation rather than redistributed by the repository; their coverage is therefore still shaped by their original data and conversion pipeline.

**Claims not supported by the evidence.** The paper does not establish universal zero-false-positive production monitoring, transfer without calibration, or reliable detection of every agent hallucination. Nor does rollback repair everything when the tool itself is broken: the live repair matrix finds goal drift as the only class fixed by retry, while tool cascade and looping are better treated as fast termination or escalation; grounding loss belongs to the grounding check.

## Engineering translation: when to use it and when not to

To bring the idea into a production agent, I would start with a narrow control loop:

1. Version the telemetry schema at the adapter, retaining tool calls, results, errors, latency, task anchors, and a complete event trace.
2. Build a per-deployment healthy corpus and test recalibration whenever the model, temperature, tool roster, or serving configuration changes.
3. Report precision, recall, latency, and failure-class coverage separately for behavioural monitoring and deterministic checks; do not hide their gaps in one score.
4. Return high-risk alarms to the last verified checkpoint. Let the repair prompt describe a verifiable failed condition and preserve both the original and repaired trace.
5. Put the judge in an escalation layer rather than calling it every step, but calibrate it on the real judge you will use. In §6, the measured Gemini judge has $p_{detect}=0.548$ and $p_{false}=0.052$; replacing the paper's idealized 0.90/0.02 assumption drops detection recovery from 82% to 43%.

Do not use the monitor alone when results never enter telemetry, when correctness requires an external-world reference, when episodes are too short to provide post-onset horizon, or when the deployment's healthy behaviour has not been collected. Use contract verification, external fact checking, human/model escalation, or a recoverable circuit breaker instead.

## Reproducibility: artifact status as of 2026-08-07

I independently checked the endpoints named by the paper on August 7, 2026:

- [GitHub repository](https://github.com/sunnydubey1111/agent-trajectory-sentinel): public. `README.md`, pinned lock files, code, traces, results, `DATA_CARD.md`, `REPRODUCE.md`, the claims ledger, and the manifest are readable; the repository [LICENSE](https://github.com/sunnydubey1111/agent-trajectory-sentinel/blob/main/LICENSE) is MIT. The quickstart includes synthetic study, figure regeneration, verification, repair re-analysis, and live-demo commands.
- [Hugging Face dataset](https://huggingface.co/datasets/sunnydubey1111/agent-trajectory-sentinel): the endpoint is available and its page shows parquet, the 2,823-episode corpus, and `mixed-see-licensing`; it was not an empty or gated page. Model outputs, Wikipedia, Open-Meteo, and external benchmarks remain under their upstream terms.
- [Hugging Face live demo](https://huggingface.co/spaces/sunnydubey1111/agent-trajectory-sentinel-demo): the endpoint is available and was marked `Running` at inspection time. That verifies the demo surface exists; it does not mean I re-ran the model call locally.
- [Recorded walkthrough](https://youtu.be/a05n_000klE): the short URL resolves to a YouTube watch page; it is explanatory material, not a reproduction artifact.

The smallest useful offline reproduction is to use the pinned CPU environment for the synthetic experiment, verification study, and repair-policy re-analysis, then compare the shipped tables with `CLAIMS.md`. Real-trace and live studies that need Ollama or Gemini should be treated as conditional reproductions; AFTraj-2K, ATBench, and third-party model outputs are not automatically redistributable merely because the repository is public.

## Conclusion: manage known boundaries instead of claiming perfect detection

AgentTrajectorySentinel's central contribution is not a magical ESN. It is a decomposition of agent reliability into observable, verifiable, and reversible control points: behavioural drift belongs to the monitor, tool and numeric consistency to deterministic verification, unknown or high-risk states to judge escalation, and bad state to the last verified checkpoint.

This complements [OSReward's cross-platform agent outcome evaluation](/en/paper-reading/08-osreward-agent-evaluation/): OSReward asks how to judge a trajectory after the task, while this paper asks how to detect a trajectory going bad before the task ends. If you connect them in one platform, preserve failure class, denominator, calibration state, and repair cost rather than turning an offline outcome score into a runtime safety guarantee. For the governance extension, see [Enterprise Agentic AI Governance](/en/blog/39-enterprise-agentic-ai-governance/) and [Enterprise AI Agent Security](/en/blog/43-enterprise-ai-agent-security/).

## Primary sources

- [arXiv record: Real-Time Detection and Repair of LLM Agent Failures](https://arxiv.org/abs/2608.02464): version, author, abstract, and submission metadata.
- [arXiv HTML full paper v1](https://arxiv.org/html/2608.02464v1): §§3–11, Figures 1–5, Tables 1–5, limitations, and the artifact appendix.
- [arXiv PDF v1](https://arxiv.org/pdf/2608.02464v1): complete 16-page preprint.
- [Official artifact repository](https://github.com/sunnydubey1111/agent-trajectory-sentinel): code, traces, results, data card, reproduction record, and claim-to-evidence ledger.
- [Dataset](https://huggingface.co/datasets/sunnydubey1111/agent-trajectory-sentinel) · [Live demo](https://huggingface.co/spaces/sunnydubey1111/agent-trajectory-sentinel-demo) · [Walkthrough](https://youtu.be/a05n_000klE): the material artifact endpoints named by the authors.
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): license for the reused arXiv figures; the repository MIT license and recorded third-party data terms apply separately.
