---
title: "PAST-Bench: What Did a Persistent Agent Actually Learn from the Past?"
description: "A deep read of how PAST-Bench uses fresh-session task families, matched persistence controls, and trace-level mechanism evidence to separate genuine retained-experience gains from higher scores with unrelated causes."
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "PAST-Bench reframes persistent-agent improvement as longitudinal attribution: 26 task families and 204 episodes across Memory, Procedural Reuse, Information Gathering, and Update."
  - "Persistence-on and persistence-off runs use fresh sessions with the same prompt, grader, tools, and seed; the self-evolution gap Δ is more informative than a one-shot task score, but it is still not causal proof."
  - "On MiniMax-M2.7, Hermes+ raises the reported mean Δ from +0.13 to +0.15 and Mech from 0.64 to 0.73; that +0.02 is smaller than three-run variation, while the clearest gain is on Update."
  - "The paper shows that cross-session behavioral improvement can be measured and diagnosed; it does not establish full recursive self-improvement, enterprise-agent generalization, or a universally superior memory architecture."
audience:
  - "AI engineers building persistent agents, memory, skills, or workspace state."
  - "Research and platform teams designing longitudinal evaluation harnesses that separate task score from mechanism evidence."
tags: ["Paper Reading", "AI Agent", "Evaluation", "Agent Memory", "Benchmark", "Self-Improvement"]
image: "/paperReading/16-past-bench-recursive-self-improvement/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-memory-adaptation
paper:
  title: "PAST-Bench: Benchmarking the Foundations of Recursive Self-Improvement in Personal Agents"
  authors:
    - "Shuhan Xue"
    - "Zixin Ding"
    - "Yichen Shen"
    - "Yinjie Wang"
    - "Zhenfei Yin"
    - "Yingcheng Wu"
    - "Yuxin Chen"
    - "Mengdi Wang"
    - "Ling Yang"
  year: 2026
  venue: "arXiv 2608.04003 v1 (cs.CL preprint)"
  links:
    pdf: "https://arxiv.org/pdf/2608.04003v1"
    arxiv: "https://arxiv.org/abs/2608.04003"
    code: "https://github.com/Gen-Verse/PAST-Bench"
series:
  id: "agent-evaluation"
  title: "Agent Evaluation"
  part: 4
  totalParts: 4
---

## The paper in 90 seconds

- **Problem:** When a persistent agent scores higher on later tasks, it is difficult to determine whether the gain comes from genuinely retaining and applying prior experience, or from the base model's general capability, prompt cues, residual conversational context, task difficulty variance, or scoring noise.
- **Core insight:** PAST-Bench frames cross-session self-evolution as a strictly controlled attribution experiment: in a fresh session with all volatile context wiped clean, holding prompt, grader, tool stack, and random seed fixed, it switches persistence access on versus off while evaluating both behavioral task-score gaps ($\Delta$) and trace-level mechanism evidence scores (Mech).
- **Strongest evidence:** Across 26 task families, 204 synthetic episodes, and 7 mainstream base models, persistence-on consistently yields a positive mean score gap ($\Delta$ between +0.13 and +0.24); however, with the same model and the exact same $\Delta = +0.13$, nanobot and Hermes yield Mech scores of 0.57 and 0.64 respectively, demonstrating that higher task scores do not guarantee execution through the intended memory mechanism (Table 2; Table 3; Figure 10).
- **Main boundary:** Benchmark tasks are entirely authored by the research team and do not represent long-term real-user workloads; the diagnosis-driven Hermes+ achieves only a +0.02 overall gain (from +0.13 to +0.15), which is smaller than run-to-run variation and introduces negative interactions across mechanisms.

This reading is based on the arXiv v1 preprint submitted by Shuhan Xue et al. on 2026-08-04 ([arXiv:2608.04003v1](https://arxiv.org/abs/2608.04003)); all text, figures, and empirical data reflect this version. The authors define their target capability as **online self-evolution**: an agent carrying preferences, procedural routines, or revised rules across sessions to assist later tasks without parameter updates or prompt stuffing. This is one layer narrower than full recursive self-improvement (RSI), but directly applicable to personal agents today.

## What to know first

Evaluating whether an autonomous agent genuinely learns from long-term experience requires clarifying the nature of persistent state and separating it from evaluation confounds.

### 1. Persistent agents versus stateless agents

A traditional stateless agent resets all memory when a session closes. A persistent agent does not retrain model weights or stuff unbounded conversation histories into an oversized prompt. Instead, it writes user preferences, standard operating procedures (SOPs or custom skills), environmental states, or revised rules into an external persistence substrate (such as a key-value store, vector database, structured file, or skill registry), proactively retrieving and executing them in future sessions.

### 2. The attribution problem

If an agent performs better on day two than on day one, where does that improvement originate? In multi-session evaluation, at least four confounding factors intervene:
1. **Base model priors:** The base model's intrinsic world knowledge or zero-shot reasoning is sufficient to solve the task without consulting historical memory.
2. **Prompt leakage and trigger overlap:** The evaluation prompt inadvertently leaks hints or trigger phrases, allowing the agent to answer correctly without retrieving past state.
3. **Volatile context leakage:** If the evaluation harness fails to purge the conversation buffer across sessions, the agent simply benefits from standard in-context learning rather than true persistent retrieval.
4. **Grader noise and variance:** Variations in single-task scores may simply stem from random fluctuations or biases within the LLM judge.

### 3. Why previous approaches are insufficient

Prior evaluation paradigms fail to provide rigorous attribution:
- **Traditional single-turn agent benchmarks (e.g., SWE-bench, GAIA):** These evaluate execution within an isolated, single-episode task. They lack any temporal cross-session dimension and cannot evaluate how experience accumulates or updates over time.
- **Traditional memory benchmarks (e.g., Needle-in-a-Haystack, long-context QA):** These measure only passive retrieval accuracy. Detached from an active decision-making loop, they cannot tell whether an agent will trigger retrieval at the appropriate juncture, reject obsolete state, or successfully ground retrieved rules into tool calls.
- **Uncontrolled multi-session dialogues:** Existing multi-session tests often lack matched ablation controls, treating later score improvements as direct proof of self-improvement while conflating outcome success with persistent state retention.

## Core intuition

Assessing whether an agent truly evolves requires a fundamental shift in decision rules.

Previous approaches relied on an uncritical outcome comparison: **"If the agent scores higher in session $N$ than in session 1, the agent has improved through memory."** This inference ignores all underlying confounds.

PAST-Bench establishes a new **dual-track attribution rule**:
1. **Ablation-controlled score gap ($\Delta$):** Evaluation must execute in a fresh session with all volatile context wiped clean. Holding prompt, tools, grader, and random seed identical, the harness executes two parallel branches: a **persistence-on** branch with access to historical family state, and a **persistence-off** branch with access denied. The difference in evaluation task scores defines the persistence gap $\Delta_f$.
2. **Trace-level mechanism contract (Mech):** A positive $\Delta_f$ is necessary but insufficient. The system must also audit execution traces against a pre-specified contract: did the agent write to the correct substrate, trigger retrieval before acting, apply the updated rule, and discard stale information?

Only when external task improvement ($\Delta_f > 0$) aligns with internal mechanistic fidelity (high Mech) can the performance gain be legitimately attributed to persistent experience.

> **Huahua's engineering note**
>
> Separate “the next session scored higher” from “it scored higher because it read and applied yesterday's state.” The first is an outcome; the second is closer to attributable improvement.

## Walk one example through the method

To trace the end-to-end evaluation pipeline, consider a representative **Update task family** (derived from the structure in Figures 4–8 and Appendix A.3):

1. **Input and cold start (Cold episode):**
   - *Scenario:* A personal agent assists a user with daily business report exports.
   - *Execution:* With zero historical context, the system issues a baseline export task. The agent relies purely on default zero-shot capabilities, establishing the task family's cold-start calibration score.
2. **Learning and writing (Learn episode):**
   - *Scenario:* The user instructs the agent: "Starting today, please format all financial exports as JSON and send them to the internal API endpoint `/v1/reports`."
   - *Intermediate state:* The agent invokes its memory tool, creating a persistent record: `export_format: json, target_endpoint: /v1/reports`.
3. **Authoritative update (Update episode):**
   - *Scenario:* Several sessions later, an authoritative system notification arrives: "The internal API has been migrated. Endpoint `/v1/reports` is deprecated immediately in favor of `/v2/analytics`; export formats must now be Parquet."
   - *Decision and transformation:* The agent must recognize this as an authoritative overwrite, updating its persistent substrate by marking the old endpoint as stale and recording the new parameters.
4. **Fresh evaluation and decision transformation (Fresh evaluation episode):**
   - *Execution environment:* All conversational history is completely wiped, initializing a clean, isolated session. The prompt uses an uninformative, weak trigger (e.g., "Please export yesterday's financial summary"), deliberately omitting formatting instructions.
   - *Branch comparison:*
     - **Persistence-on branch:** The agent detects the need for historical configuration, retrieves the `/v2/analytics` and Parquet rules, actively rejects the stale `/v1/reports` configuration, and executes the export.
     - **Persistence-off branch:** Access to the family's persistent substrate is severed. The agent cannot read past rules and must fall back to zero-shot defaults or ask for clarification.
5. **Output and failure mode diagnosis (Likely failure points):**
   - *Scoring:* Both branches are graded under the same MiniMax-M2.7 judge to calculate task score $s_e$.
   - *Trace verification:* The trace auditor inspects execution logs. Common failure points include agents scoring well by lucky zero-shot guessing without querying memory, or retrieving the new rule but leaking the obsolete endpoint into the API payload (increasing the pollution rate). The Mech score detects these ungrounded gains immediately.

## Technical mechanism

PAST-Bench consists of four capability dimensions, structured episodic task lifecycles, and explicit mathematical scoring formulations.

### 1. Four capabilities across 26 families and 204 episodes

The benchmark decomposes online self-evolution into four distinct cross-session capabilities, spanning 26 task families and 204 synthetic episodes (counts from Table 7 in Appendix A.1; distribution shown in Figure 2):

| Capability | Families | Episodes | Core Evaluation Question |
| :--- | :---: | :---: | :--- |
| **Memory** | 5 | 41 | Can the agent retain user preferences, constraints, past cases, and exceptions, retrieving them under weak prompts? |
| **Procedural reuse** | 8 | 64 | Can the agent consolidate multi-step workflows, playbooks, or scripts into reusable, executable skills? |
| **Information gathering** | 6 | 48 | Can the agent proactively inspect stored evidence before taking irreversible actions when evidence is omitted from the prompt? |
| **Update** | 7 | 51 | When new authoritative rules arrive, can the agent overwrite old state and prevent stale values from leaking? |

![PAST-Bench Figure 2: distribution of four capabilities across 26 task families and 204 episodes](https://arxiv.org/html/2608.04003v1/assets/figure2_suite_distribution.png)

*Figure 2. The figure shows benchmark coverage by capability and sub-family. Source: Xue et al., PAST-Bench, §3 / Figure 2 ([figure anchor](https://arxiv.org/html/2608.04003v1#S3.F2)); reused directly from the arXiv HTML with attribution under the arXiv.org perpetual non-exclusive license.*

This decomposition is crucial for engineering diagnosis: Update verifies not only that new values are read, but that obsolete values do not pollute downstream artifacts; Information Gathering isolates premature action without verification from ordinary retrieval failures.

### 2. Task family episodic lifecycle

Each task family follows a sequential progression:
- **Cold:** Measures zero-retention baseline performance to provide calibration and headroom.
- **Learn:** Exposes target knowledge clauses, procedures, or facts to be written into the benchmark-managed substrate.
- **Update:** (In Update families) Delivers an authoritative second write to evaluate state replacement.
- **Evaluation:** Initiates a clean session with volatile context purged and prompt triggers stripped, testing autonomous retrieval and application.
- **Controls:** Employs control conditions (no-retention, distractor, stale, wrong-substrate) to ensure performance improvements do not reflect surface shortcuts or trivial memorization.

### 3. Metric definitions and mathematical formulations

#### Persistence gap
For a given task family $f$, the persistence gap is defined as:

$$
\Delta_f = S_f^{\mathrm{w/}} - S_f^{\mathrm{w/o}}
$$

where $S_f^{\mathrm{w/}}$ and $S_f^{\mathrm{w/o}}$ denote mean evaluation episode scores under persistence-on and persistence-off conditions. Capabilities macro-average across families, and Overall $\Delta$ averages the four capability scores.

#### Per-episode task score
Each episode score is formulated as:

$$
s_e = \sigma_e \times (0.80c_e + 0.20r_e)
$$

where $c_e \in [0, 1]$ represents task completion, $r_e \in [0, 1]$ represents tool error recovery rate, and $\sigma_e \in \{0, 1\}$ is a binary safety gate. Any safety violation zeros out the episode score. Each episode executes across three independent trials; missing or crashed runs receive 0 points ([Appendix B.1](https://arxiv.org/html/2608.04003v1#A2.SS1)).

#### Mechanism-evidence score (Mech)
To quantify whether improvement followed the expected architectural path, the benchmark calculates Mech:

$$
\mathrm{Mech}_f = \frac{1}{5}(\mathrm{wp} + \mathrm{ra} + \mathrm{uc} + \mathrm{rh} + (1 - \mathrm{pr}))
$$

comprising write precision ($\mathrm{wp}$), recall accuracy ($\mathrm{ra}$), update correctness ($\mathrm{uc}$), retention horizon ($\mathrm{rh}$), and pollution rate ($\mathrm{pr}$). Mech ranges from 0 to 1, measuring trace alignment with pre-specified expectation contracts ([Appendix B.3](https://arxiv.org/html/2608.04003v1#A2.SS3)).

### 4. Experimental setup and baseline controls

- **Base models:** Evaluates 7 mainstream foundation models: GLM-5.1, Kimi K2.6, DeepSeek-V4-Pro, MiniMax-M2.7, GPT-5.4, Claude Sonnet 4.6, and Claude Opus 4.6.
- **Agent frameworks:** Fixes MiniMax-M2.7 as the standard backbone across nanobot, ZeroClaw, Agent-Zero, Hermes, and the authors' diagnosis-extended Hermes+.
- **Grader calibration:** Uses MiniMax-M2.7 (temperature 0, max 8,192 tokens) as the automated judge. Human validation on 48 blinded samples (12 per capability) shows 83.3% exact agreement between human raters, with judge scores matching human averages within $\pm 0.25$ in 68.8% of cases and within $\pm 0.5$ in 91.7% of cases ([Appendix B.4](https://arxiv.org/html/2608.04003v1#A2.SS4)).
- **Compute and latency overhead:** Table 12 reports that Base Hermes with MiniMax-M2.7 consumes an average of 12,615 tokens and 70.5 seconds per episode; Hermes+ consumes 31,859 tokens and 77.4 seconds. Guardrails and routing incur a 2.5× token overhead, but wall-clock latency increases by only 1.10× ([Appendix D.6](https://arxiv.org/html/2608.04003v1#A4.SS6)).

## How to read the evidence

Reading PAST-Bench results requires examining task-score gains alongside mechanism fidelity, while accounting for capability disparities and run-to-run variation.

### 1. Persistence yields positive average gains, but distributions are highly uneven (Table 2)

- **Central question:** Does enabling persistent state consistently enhance cross-session performance across different LLM backbones?
- **Controls:** Evaluates 7 models under the Hermes framework, holding prompts, tool stacks, and seeds constant across persistence-on and persistence-off conditions.
- **Observations:** Table 2 reveals that Overall $\Delta$ is positive across all 7 models (+0.13 to +0.24). GPT-5.4 achieves the highest Overall $\Delta$ (+0.24), GLM-5.1 reaches +0.20, and MiniMax-M2.7 scores +0.13. However, capability breakdowns differ substantially: GPT-5.4 concentrates its gains in Memory (+0.37) and Update (+0.34); GLM-5.1 excels primarily in Update (+0.36); Kimi K2.6 focuses its advantage in Memory (+0.33).
- **Explanation and boundary:** Aggregate numbers obscure underlying model characteristics. Some architectures excel at overwriting stale knowledge, while others excel at retrieving nuances under weak triggers.

### 2. The attribution frontier: identical score gaps can mask divergent mechanism fidelity (Table 3; Figure 10)

- **Central question:** Do different agent frameworks achieve their performance gains through the intended persistent mechanisms?
- **Controls:** Fixes the base model to MiniMax-M2.7 and evaluates nanobot, ZeroClaw, Agent-Zero, Hermes, and Hermes+ under identical task suites.
- **Observations:** Table 3 documents stark discrepancies in attribution:

| Framework | Overall $\Delta$ | Mech | Key Phenomenon |
| :--- | :---: | :---: | :--- |
| **nanobot** | +0.13 | 0.57 | Overall gain matches Hermes, but mechanism alignment is weaker, with negative Procedural reuse (-0.06). |
| **ZeroClaw** | +0.12 | 0.55 | Gains concentrate in Memory (+0.29), with negative Procedural reuse (-0.04). |
| **Agent-Zero** | -0.08 | 0.39 | Persistence causes widespread regression across Memory, Information Gathering, and Update. |
| **Hermes** | +0.13 | 0.64 | All four capabilities are positive, maintaining healthy alignment between gap and mechanism scores. |
| **Hermes+** | +0.15 | 0.73 | Highest mean gap and mechanism score, though Procedural reuse shows a slight dip (-0.02). |

![PAST-Bench Figure 10: agent attribution frontier with MiniMax-M2.7 fixed](https://arxiv.org/html/2608.04003v1/assets/figure_agent_attribution_frontier.png)

*Figure 10. The x-axis shows the overall persistence gap and the y-axis shows mechanism evidence; identical $\Delta$ can correspond to different levels of mechanistic support. Source: Xue et al., Appendix D.3 (§A4) / Figure 10 ([figure anchor](https://arxiv.org/html/2608.04003v1#A4.F10)); reused directly from the arXiv HTML with attribution under the arXiv.org perpetual non-exclusive license.*

- **Explanation and boundary:** As illustrated in Figure 10, nanobot and Hermes occupy the exact same horizontal position ($\Delta = +0.13$), but differ markedly in vertical Mech scores. Task scores alone cannot verify whether an agent succeeded through genuine memory retrieval or through unaligned shortcuts.

### 3. Hermes+ diagnostic interventions: update breakthroughs versus interaction trade-offs and run variance (Table 4; Table 5; Figure 9; Table 11)

- **Central question:** Can targeted runtime interventions designed from trace diagnostics provide additive, system-wide improvements?
- **Intervention design:** Five loop-stage mechanisms were introduced: E1 Plan (check state prior to planning), E2 Render (bind current active values structurally), E3 Route (rank and hot-patch skills), E4 Gate (enforce retrieval before recall-dependent actions), and E5 Close (flush and synchronize state at episode completion).
- **Observations:**
  - **Single-mechanism ablations (Table 4; Figure 9):** Each mechanism demonstrates targeted utility: E3 delivers Procedural $\Delta = +0.10$, E4 yields Information Gathering $\Delta = +0.17$, and E5 brings Update $\Delta = +0.16$.
  - **Composite trade-offs:** When combined into Hermes+, Update shows the largest improvement ($\Delta = +0.24$), but Procedural reuse degrades to $\Delta = -0.02$.
  - **Mechanism interaction (Table 5):** Focused analysis reveals that Base Hermes achieves a Procedural gap of +0.087 while Hermes+ achieves +0.085; removing E2 Render actually increases the gap to +0.108, proving that rigid rendering constraints can disrupt skill routing flexibility.

![PAST-Bench Figure 9: capability-level persistence-gap ablation for individual mechanisms and full Hermes+](https://arxiv.org/html/2608.04003v1/assets/figure_ablation_heatmap.png)

*Figure 9. E3, E4, and E5 show noticeable single-mechanism gaps on Procedural, Information Gathering, and Update respectively; full Hermes+ peaks on Update. Source: Xue et al., Appendix D.1 (§A4) / Figure 9 ([figure anchor](https://arxiv.org/html/2608.04003v1#A4.F9)); reused directly from the arXiv HTML with attribution under the arXiv.org perpetual non-exclusive license.*

- **Statistical variance counterweight (Appendix D.5 / Table 11):**
  The most critical counterweight lies in run-to-run statistical variation. Base Hermes achieves an Overall $\Delta$ of $0.13 \pm 0.04$, while Hermes+ records $0.15 \pm 0.06$. The +0.02 difference is smaller than the standard deviation across three trials! In Update, while the mean gap doubles from 0.12 to 0.24, its standard deviation expands from 0.01 to 0.09. Hermes+ cannot be claimed as a universally superior production architecture.

> **Huahua's engineering note**
>
> Mech is closer to a telemetry metric verifying whether an intended path left evidence than it is to a causal estimate. Proving necessity requires deleting, mutating, or corrupting candidate artifacts and verifying that behavioral changes follow.

## Evidence map

To separate verifiable findings from engineering synthesis, the paper's claims are categorized into four distinct levels:

### Direct paper evidence

- In the authors' synthetic benchmark of 26 task families and 204 episodes, matched persistence-on versus persistence-off comparisons yield positive Overall $\Delta$ across 7 foundation models (+0.13 to +0.24, [§§4.1–4.2](https://arxiv.org/html/2608.04003v1#S4)).
- Identical task score gains can correspond to divergent mechanism scores: nanobot and Hermes both reach $\Delta = +0.13$, but their Mech scores are 0.57 and 0.64 respectively, with nanobot showing negative Procedural reuse ([Table 3](https://arxiv.org/html/2608.04003v1#S4.T3)).
- The Plan, Render, Route, Gate, and Close interventions align with specific capability improvements in isolation; their composition yields the strongest gain in Update ($\Delta = +0.24$, [Table 4; Figure 9](https://arxiv.org/html/2608.04003v1#S4.SS3)).
- Multi-run variance shows that Hermes+'s overall gain (+0.02) is smaller than the standard deviation across three runs (Hermes $0.13 \pm 0.04$ vs Hermes+ $0.15 \pm 0.06$, [Appendix D.5 / Table 11](https://arxiv.org/html/2608.04003v1#A4.T11)).

### Author causal claims

- The authors claim that PAST-Bench and Hermes+ establish a foundation for studying how personal agents transition from mere experience retention toward systematic online self-evolution.
- The authors argue that trace-level mechanism scoring allows practitioners to pinpoint exact failure stages across planning, retrieval, updating, and session closure.
- *Editorial reserve:* This "foundation" represents an evaluation and diagnostic toolkit rather than proof of generalized self-improvement algorithms; Hermes+ functions as a specialized diagnostic harness rather than a universal runtime solution.

### Unsupported claims

- **No proof of recursive self-improvement (RSI):** The paper does not demonstrate agents modifying their own code, improving core learning algorithms, or exhibiting open-ended recursive self-enhancement.
- **No validation on real-world distributions:** All 26 task families are synthetically constructed; the paper includes no telemetry from real enterprise or consumer user sessions (Appendix A.2 explicitly confirms this).
- **Persistence gap does not equate to pure causal effect:** While matched controls are rigorous, the authors explicitly define them as "strong design controls" rather than formal causal proofs.
- **Hermes+ is not proven superior for production:** Framework adapters retain differing native context truncation strategies, and Hermes+ introduces 2.5× token costs with marginal statistical gains.
- **Mech cannot be computed on unobservable black boxes:** Appendix C.3 acknowledges that without structured persistence events and artifact logging, Mech cannot be generated.

### Bloss0m engineering synthesis

- **Production memory evaluation contract:** Evaluating persistent agent memory in enterprise systems requires four observable touchpoints: paired on/off testing on identical tasks, persistence artifact diffs, retrieval invocation telemetry, and external task outcomes.
- **Counterfactual verification:** Legitimate claims of learning require actively corrupting or swapping stored records to confirm that the agent's behavior shifts in response, rather than relying exclusively on passive telemetry.

## Artifacts and reproducibility

As of **2026-08-09**, the official [Gen-Verse/PAST-Bench repository](https://github.com/Gen-Verse/PAST-Bench) is publicly accessible on GitHub under the Apache-2.0 license, containing benchmark runner code in `src/past_bench`, task suites in `self-evolve-tasks-v2`, configurations, mock services, and unit test suites.

However, several operational boundaries and external dependencies govern reproduction:
1. **Absence of pre-built checkpoints or standalone packages:** The repository does not host pre-packaged releases or Hugging Face dataset bundles; there are no pre-trained weights for offline execution.
2. **Commercial API requirements:** Execution requires external API credentials across providers such as MiniMax, Zhipu, Kimi, DeepSeek, and OpenAI, incurring commercial inference costs.
3. **Environment setup:** Full reproduction demands Python 3.11+, the `uv` package manager, and a running Docker daemon to build sandbox images for tool execution.

**Minimal conditional reproduction path:**
Practitioners wishing to verify the evaluation mechanism without running the full 204 episodes can follow the repository README to establish the Python and Docker environments. They can run a single task family (such as preference adoption `SM01_preference_adoption`) on MiniMax-M2.7 with the `--compare-no-persistence` flag enabled. This produces `sequence_results.json` and `sequence_comparison.json`, verifying the on/off score delta and trace logs.

This article did not rerun the complete benchmark; all experimental numbers reflect results reported by the original authors.

## Bloss0m engineering judgment and when not to use it

This section outlines original engineering architectural recommendations and explicit boundaries for adopting this methodology.

### Minimal viable attribution harness

Teams building longitudinal evaluation for persistent agents can implement this streamlined control architecture:

```text
Task Family: Learn -> Fresh Session Evaluation -> Control Episodes
                 |                             |
          Persistence-on                Persistence-off
                 |                             |
        Artifact + Trace Events       Clean Baseline Run
                 \________ Paired Delta (Δ) _______/
```

Implementation should proceed through four stages:
1. Ensure session boundaries reliably wipe all volatile buffers, eliminating in-context prompt propagation.
2. Build a feature toggle to switch access to the persistence substrate on or off.
3. Implement artifact diffs and tool telemetry to measure write-read fidelity.
4. Introduce stale fixtures and distractors to test update robustness.

### When to adopt

- **Agent systems with strict session boundaries:** Systems that clear context between runs and rely on structured memory or external document stores for cross-session continuity.
- **Teams diagnosing memory lifecycle failures:** Scenarios requiring visibility into whether errors stem from unwritten records, missed retrieval, misapplication, or stale overwrite failures.
- **Platforms with comprehensive observability:** Environments capable of capturing tool traces, retrieval events, and persistent artifact modifications.

### When not to use it

- **Continuous long-context systems without session isolation:** If context freely spills across rounds, $\Delta$ becomes confounded with in-context memory, destroying attribution validity.
- **Deterministic single-turn tasks:** Tasks that can be verified immediately with deterministic unit tests or compilers do not benefit from the overhead of LLM judges or Mech scores.
- **Extrapolating synthetic benchmarks directly to production:** PAST-Bench's 26 synthetic families cannot capture the ambiguity, concurrent modifications, or multi-month drift of real user environments.
- **Using Overall $\Delta$ as a single deployment gate:** Aggregate scores can hide critical regressions in sub-capabilities such as procedural reuse or skill routing.

### Reading path connections

To connect this evaluation methodology with adjacent agent architectures, consider these readings:
- For persistent substrate design beyond naive vector retrieval: read [Beyond RAG for Agent Memory](/en/paper-reading/06-beyond-rag-for-agent/).
- For mitigating judge bias and addressing shallow task completion: read [OSReward](/en/paper-reading/08-osreward-agent-evaluation/).
- For complex multi-session benchmarks reflecting enterprise workflows: read [ContextWeave](/en/paper-reading/09-contextweave-workflow-benchmark/).
- For verbal reinforcement and self-correction across trials: read [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/).

## Three things to remember

1. **Technical idea:** Higher later-session task scores do not prove self-improvement; attributing gains to retained experience requires fresh-session matched persistence-off controls and trace-level mechanism evidence.
2. **Evidence:** Cross-session gains are highly capability-dependent; Hermes+'s overall gain (+0.02) falls within run-to-run statistical variance, with its primary breakthrough in Update accompanied by negative mechanism interactions.
3. **Engineering boundary:** PAST-Bench shows that cross-session behavioral improvement can be measured and diagnosed, not that agents possess recursive self-improvement; production implementations must augment synthetic evaluations with counterfactual tests and external outcome validation.

## Primary sources

- [PAST-Bench arXiv abstract and version history](https://arxiv.org/abs/2608.04003)
- [PAST-Bench full HTML paper, v1](https://arxiv.org/html/2608.04003v1)
- [PAST-Bench PDF, v1](https://arxiv.org/pdf/2608.04003v1)
- [PAST-Bench official repository](https://github.com/Gen-Verse/PAST-Bench)
- [PAST-Bench Apache-2.0 license](https://raw.githubusercontent.com/Gen-Verse/PAST-Bench/main/LICENSE)
