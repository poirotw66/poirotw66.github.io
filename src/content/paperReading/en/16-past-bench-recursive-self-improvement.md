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

- **Problem:** a persistent agent's later score can improve because of model, prompt, task difficulty, or residual context—not because it used prior experience correctly.
- **Core insight:** PAST-Bench uses fresh-session task families, holds prompt, grader, and tool stack fixed, and switches persistence on/off while reporting task-score gap and write/read/artifact mechanism evidence.
- **Strongest evidence:** 26 scenarios, 204 episodes, four capabilities, seven models, and four frameworks; Hermes+ reports its overall gap from +0.13 to +0.15 and Mech from 0.64 to 0.73 (Table 2; Section 4.3).
- **Main boundary:** the gap difference is smaller than run-to-run variation, tasks are authored by the proposing team, and matched ablation is a strong control rather than complete causal proof.

## Why the previous approach is insufficient

One-shot benchmarks and memory retrieval scores mix base model, runtime, prompt, and persistence. Sequential sessions can still be prompt propagation if volatile context remains. PAST-Bench's key move is to stop the evaluation episode from receiving that earlier-context shortcut (Sections 2 and 3.2).

## Core intuition

Each family has cold, learn/update, evaluation, and control episodes, and evaluation starts fresh. $\Delta_f=S_f^{w/ evolve}-S_f^{w/o\ evolve}$ changes access to family state; mechanism evidence asks whether the agent wrote, read, and updated the intended substrate. Both must align before a later gain is plausibly experience-driven (Figure 1; Section 3.2; Appendix B).

## Worked example: an update family

An early episode writes an old rule, an Update episode writes an authorized replacement, and evaluation does not restate either. The persistence-on agent should retrieve the replacement and reject the stale value; persistence-off cannot access the family state. If the first scores higher but trace evidence lacks the correct read/update—or uses the wrong substrate—it is not credible self-evolution. This is a simplified explanation of Figures 4–8 / Appendix A.3.

## How to read the evidence

**Table 2** holds family, grader, tools, and seed fixed while switching persistence access; three-run-average $\Delta$ is behavioral evidence. **Section 4.3 / Table 4** ablates Plan, Render, Route, Gate, and Close interventions; its clearest Update improvement is not a universal capability gain. **Appendix D.5** is the counterweight: +0.13 to +0.15 is smaller than reported run variance and cannot alone establish Hermes+ superiority.

## Artifacts and engineering decision

As of **2026-08-09**, the official [PAST-Bench repository](https://github.com/Gen-Verse/PAST-Bench) is reachable and announces Apache-2.0 code, benchmark, runner, adapters, and tests. Full reproduction still needs a pinned clone, model/API credentials, and upstream-framework license checks. Use the design to make persistence switchable and traceable. Do not call one $\Delta$ recursive self-improvement or let an agent write long-term rules before stale and distractor controls.

## Three things to remember

1. A later score gain is not self-improvement without matched persistence-off and trace evidence.
2. Separating better outcomes from the intended pathway is PAST-Bench's main contribution.
3. Small aggregate gains, variance, and framework dependence call for controlled experiments before RSI claims.

## Start with one question: if an agent is better tomorrow, how do we know yesterday's experience helped?

My reading is that **PAST-Bench's most durable contribution is not the claim that agents already perform recursive self-improvement. It is the conversion of cross-session improvement from a vague demo into an attribution problem with controls, metrics, and inspectable traces.**

A later-task score can rise because of the base model, prompt overlap, runtime behavior, task difficulty, tool outcomes, or scoring noise. PAST-Bench combines fresh-session task families, matched persistence-on/off controls, saved artifacts, and runtime telemetry to test whether the gain followed an intended write → retrieve → apply/update path ([paper §§1 and 3](https://arxiv.org/html/2608.04003v1#S3)).

The result is “improvement is real, but uneven, and one overall score is not enough.” All seven base models show a positive average gap, yet each model concentrates its gains on different capabilities. With MiniMax-M2.7 fixed, nanobot and Hermes both reach $\Delta=+0.13$, while their Mech scores are 0.57 and 0.64 ([Tables 2 and 3](https://arxiv.org/html/2608.04003v1#S4)). After reading the paper, I would split “self-evolution” into three questions: **did the agent improve, was the difference caused by retained state, and does the trace support the intended mechanism?**

> **Huahua's engineering note**
>
> Separate “the next session scored higher” from “it scored higher because it read and applied yesterday's state.” The first is an outcome; the second is closer to attributable improvement.

## Paper identity and scope: this self-evolution is one layer narrower than RSI

PAST-Bench is an **arXiv cs.CL v1 preprint** by Shuhan Xue, Zixin Ding, Yichen Shen, Yinjie Wang, Zhenfei Yin, Yingcheng Wu, Yuxin Chen, Mengdi Wang, and Ling Yang, submitted on 2026-08-04. It lists no journal, conference, or OpenReview review record, so this article treats it as a preprint rather than as a peer-reviewed result ([arXiv metadata](https://arxiv.org/abs/2608.04003)).

The authors call the target capability **online self-evolution**. The agent does not retrain model parameters, optimize prompts, or simply append the previous conversation to a long context. Instead, it carries preferences, task history, tool routines, skills, or revised rules across sessions and uses them on later tasks. This is narrower than full recursive self-improvement, but operational in today's personal agents. The paper measures whether persistent state improves the next piece of work; it does not measure whether an agent can rewrite its own learning algorithm or recursively improve its whole architecture.

## Evidence Map: paper directly supports, author claims, and our engineering judgment

| Voice | Evidence boundary | What this reading does with it |
| --- | --- | --- |
| **Paper directly supports** | In the authors' synthetic 26-family / 204-episode suite, fresh sessions, persistence-on/off controls, score definitions, and trace contracts yield the reported $\Delta$ and Mech results. | Treat a positive paired gap as evidence within this suite, not a general causal effect or a deployed-agent outcome. |
| **Author claims** | The authors frame PAST-Bench and Hermes+ as a foundation for studying systematic improvement, and report mechanism-specific diagnoses. | Keep “foundation” at the level of evaluation and diagnosis; do not promote it to proof of full recursive self-improvement. |
| **Our engineering judgment** | Artifact diffs, retrieval events, and paired controls are useful observability requirements for a memory claim. | Require counterfactual checks and external outcomes before treating a trace as evidence that a production agent learned. |

The distinction matters: **paper directly supports** measured behavior under a harness; **author claims** provide the intended interpretation; **our engineering judgment** is a deployment recommendation that the paper does not itself validate.

## The PAST-Bench method skeleton

### 1. Split the capability into four cross-session dependencies

The suite contains 26 task families and 204 synthetic episodes; no task uses real-user data. The four capability groups are below. The counts come from Table 7 in Appendix A.1, and their distribution is visible in Figure 2:

| Capability | Families | Episodes | What it asks |
| --- | ---: | ---: | --- |
| Memory | 5 | 41 | Can the agent retain a preference, constraint, prior case, or exception and retrieve it under a weak trigger? |
| Procedural reuse | 8 | 64 | Can it turn an SOP, playbook, or multi-step workflow into a reusable skill? |
| Information gathering | 6 | 48 | Can it proactively look up existing evidence before acting when that evidence is absent from the current prompt? |
| Update | 7 | 51 | Can new state override old state without stale information leaking into the next session? |

This decomposition matters. A conventional memory benchmark may ask only whether something is remembered; PAST-Bench also asks whether it was **written, retrieved, applied, and updated**. Update checks not only whether the new value is read, but whether the old value remains mixed into the artifact or answer. Information Gathering isolates the failure mode where an agent should have looked something up but acts irreversibly without doing so. The later diagnosis therefore does not call every persistence failure a memory failure.

![PAST-Bench Figure 2: distribution of four capabilities across 26 task families and 204 episodes](https://arxiv.org/html/2608.04003v1/assets/figure2_suite_distribution.png)

*Figure 2. The figure shows benchmark coverage by capability and sub-family. Source: Xue et al., PAST-Bench, §3 / Figure 2 ([figure anchor](https://arxiv.org/html/2608.04003v1#S3.F2)); reused directly from the arXiv HTML with attribution under the arXiv.org perpetual non-exclusive license.*

### 2. Every family is cold → learn/update → evaluation, plus controls

Each task family is an ordered sequence of episodes, not 204 unrelated questions:

1. **Cold** measures first-contact behavior, providing calibration and headroom; it is not the persistence-off baseline.
2. **Learn** exposes a clause, procedure, or piece of evidence that should be saved into the benchmark-managed persistence substrate.
3. **Update**, for Update families, supplies an authoritative second write and tests whether it replaces the old state.
4. **Evaluation** clears volatile context, starts a fresh session, removes the decisive trigger wording, and asks the agent to recover and apply the earlier state.
5. **Controls** include no-retention, distractor, stale, and wrong-mechanism conditions to test whether a gain is only a prompt shortcut, surface memorization, stale reuse, or a write to the wrong substrate.

Here persistence includes memory records, skills, profile entries, session-history indices, saved artifacts, and home-state fixtures. Every evaluation episode has a matched pair: **persistence-off** denies the runtime access to state produced by that family, while **persistence-on** permits it. Prompt, grader, tool stack, and seed are held fixed; volatile session context is still cleared. The authors explicitly call this a strong design control rather than causal proof ([§3.2](https://arxiv.org/html/2608.04003v1#S3.SS2)).

### 3. Keep the score and the mechanism evidence separate

For family $f$, the paper defines the persistence gap:

$$
\Delta_f = S_f^{\mathrm{w/}} - S_f^{\mathrm{w/o}}
$$

Here $S_f^p$ is the mean task score over evaluation episodes under persistence condition $p$. Capability scores macro-average over families, and Overall averages the four capabilities. The metric therefore does not flatten every episode into one micro-average.

The per-episode task score is:

$$
s_e = \sigma_e \times (0.80c_e + 0.20r_e)
$$

$c_e$ is completion, $r_e$ is recovery from tool-call errors, and $\sigma_e$ is a safety gate; a safety violation zeros the entire episode score. Each episode runs for three independent trials, and missing or crashed trials score 0 ([Appendix B.1](https://arxiv.org/html/2608.04003v1#A2.SS1)).

But $\Delta$ answers only whether the outcome changed. To ask whether the expected pathway was used, the authors add a **mechanism-evidence score (Mech)**. Each family expectation contract specifies an expected artifact type, keyword patterns, minimum write/read counts, and retrieval signals. Mech combines write precision, recall accuracy, update correctness, retention horizon, and pollution rate:

$$
\mathrm{Mech}_f = \frac{1}{5}(\mathrm{wp}+\mathrm{ra}+\mathrm{uc}+\mathrm{rh}+(1-\mathrm{pr}))
$$

Intuitively, Mech=1 means “the agent wrote the right state, later retrieved it, and applied or updated it correctly,” while Mech=0 means the expected pathway is absent. It is still a **telemetry signal for consistency with an expectation contract**, not a causal effect from a counterfactual experiment ([Appendix B.3](https://arxiv.org/html/2608.04003v1#A2.SS3)).

## Experimental setup: models, agent frameworks, graders, and cost

The main model comparison covers seven base models: GLM-5.1, Kimi K2.6, DeepSeek-V4-Pro, MiniMax-M2.7, GPT-5.4, Claude Sonnet 4.6, and Claude Opus 4.6. The fixed-MiniMax-M2.7 framework comparison includes nanobot, ZeroClaw, Agent-Zero, Hermes, and Hermes+ with five added runtime mechanisms. Appendix C.2 also checks the protocol on Codex CLI and Claude Code; it does not call them personal-agent frameworks, only demonstrates that a matched protocol can run on systems with switchable persistence access ([Appendix C.1–C.3](https://arxiv.org/html/2608.04003v1#A3)).

The main grader is MiniMax-M2.7 with temperature 0 and a maximum output of 8,192 tokens. The authors perform human validation on 48 blinded samples, 12 per capability. Human–human exact agreement is 83.3%; judge versus the human mean is within ±0.25 for 68.8% of samples and within ±0.5 for 91.7%. That makes the grader useful for scalable evaluation, not a replacement for human judgment. The study also does not vary the judge model or prompt ([Appendix B.4](https://arxiv.org/html/2608.04003v1#A2.SS4)).

Cost belongs in the same reading. Table 12 reports a per-episode mean of 12,615 tokens and 70.5 seconds for Base Hermes + MiniMax-M2.7, versus 31,859 tokens and 77.4 seconds for Hermes+. That is about 2.5× the tokens but about 1.10× the wall-clock time. It is a runtime-prompt/context trade-off with some additional decisions, not a complete full-suite monetary cost report ([Appendix D.6](https://arxiv.org/html/2608.04003v1#A4.SS6)).

## Result one: persistent state helps, but the gains are not evenly distributed

In Table 2's Hermes model comparison, all seven base models have a positive Overall $\Delta$, ranging from +0.13 to +0.24: MiniMax-M2.7 is +0.13, GLM-5.1 is +0.20, and GPT-5.4 is +0.24. The capability mix differs sharply, however. GPT-5.4 spreads its movement mainly across Memory (+0.37) and Update (+0.34), while GLM-5.1 puts +0.36 on Update and Kimi K2.6 puts +0.33 on Memory. Overall alone hides both the model's existing strengths and which persistence capability actually helped ([Table 2](https://arxiv.org/html/2608.04003v1#S4.T2)).

Table 3, with MiniMax-M2.7 fixed, makes the attribution issue concrete:

| Framework | Overall $\Delta$ | Mech | How to read it |
| --- | ---: | ---: | --- |
| nanobot | +0.13 | 0.57 | The same headline gain as Hermes, but weaker pathway evidence; Procedural is -0.06. |
| ZeroClaw | +0.12 | 0.55 | Most movement is Memory (+0.29), while Procedural is -0.04. |
| Agent-Zero | -0.08 | 0.39 | Memory, Information, and Update regress; a persistent framework does not automatically benefit. |
| Hermes | +0.13 | 0.64 | All four capabilities move upward, with stronger baseline pathway alignment. |
| Hermes+ | +0.15 | 0.73 | Highest reported gap and mechanism evidence, but Procedural is -0.02. |

These are the two axes in Figure 10: Overall persistence gap on x, Mech on y. Hermes and nanobot are nearly aligned on x but differ on y. “How much did it improve?” and “Does the trace look like the intended persistence mechanism?” should not be collapsed into one leaderboard score.

![PAST-Bench Figure 10: agent attribution frontier with MiniMax-M2.7 fixed](https://arxiv.org/html/2608.04003v1/assets/figure_agent_attribution_frontier.png)

*Figure 10. The x-axis is Overall persistence gap and the y-axis is mechanism evidence; the same $\Delta$ can correspond to different pathway evidence. Source: Xue et al., Appendix D.3 (§A4) / Figure 10 ([figure anchor](https://arxiv.org/html/2608.04003v1#A4.F10)); reused directly from the arXiv HTML with attribution under the arXiv.org perpetual non-exclusive license.*

## Result two: Hermes+'s five fixes help most on Update, but are not a stable global win

Hermes+ is diagnosis-driven design, not a large new architecture introduced before looking at failures. The authors map trace failures to five loop stages:

| Mechanism | Insertion point | Failure it targets |
| --- | --- | --- |
| E1 Plan | Check saved state before planning | The agent acts irreversibly before consulting persistence. |
| E2 Render | Render the current value as a typed binding | New and old memory forms compete, leaving the next session unsure which is valid. |
| E3 Route | Create, rank, and patch executable skills | An SOP stays in transcript text or duplicate notes rather than becoming reusable. |
| E4 Gate | Require retrieval before a recall-dependent action | The agent answers or acts through a noisy prompt without checking the needed evidence. |
| E5 Close | Extract and synchronously flush state at episode end | A corrected rule never becomes an authoritative artifact for the next session. |

Table 4's single-mechanism ablations show a signal on the targeted capabilities: E3 gives Procedural $\Delta=+0.10$, E4 gives Information Gathering $\Delta=+0.17$, and E5 gives Update $\Delta=+0.16$; full Hermes+ reaches Update $\Delta=+0.24$ but Procedural $\Delta=-0.02$. This is evidence that the benchmark can diagnose components, not that component effects add linearly ([Table 4 and Figure 9](https://arxiv.org/html/2608.04003v1#A4.SS1)).

![PAST-Bench Figure 9: capability-level persistence-gap ablation for individual mechanisms and full Hermes+](https://arxiv.org/html/2608.04003v1/assets/figure_ablation_heatmap.png)

*Figure 9. E3, E4, and E5 produce clearer single-mechanism gaps on Procedural, Information Gathering, and Update respectively; full Hermes+ is strongest on Update. Source: Xue et al., Appendix D.1 (§A4) / Figure 9 ([figure anchor](https://arxiv.org/html/2608.04003v1#A4.F9)); reused directly from the arXiv HTML with attribution under the arXiv.org perpetual non-exclusive license.*

The authors also run a focused Procedural interaction diagnosis. Base Hermes has a gap of +0.087, full Hermes+ +0.085, removing E2 raises it to +0.108, removing E3 lowers it to +0.062, and removing E5 lowers it to +0.042. Runtime mechanisms can interfere with one another, so a single-mechanism row should not be read as an additive contribution to the full system ([Table 5](https://arxiv.org/html/2608.04003v1#S4.T5)).

Transfer across models is also mixed. Hermes+ at least matches or improves Hermes on MiniMax-M2.7, Claude Sonnet 4.6, and GPT-5.4, while DeepSeek-V4-Pro and Claude Opus 4.6 regress slightly. This is a transferable diagnostic scaffold, not a universal improvement ([Table 6](https://arxiv.org/html/2608.04003v1#S4.T6)).

Run variance matters even more. Hermes has Overall $\Delta=0.13\pm0.04$, while Hermes+ has $0.15\pm0.06$; the +0.02 difference is smaller than run-to-run variation. Update's mean gap moves from +0.12 to +0.24, but its standard deviation also grows from 0.01 to 0.09. For an attribution benchmark, this caveat is part of the result, not a footnote ([Appendix D.5 / Table 11](https://arxiv.org/html/2608.04003v1#A4.T11)).

> **Huahua's engineering note**
>
> Mech is closer to a telemetry indicator for whether the pathway left evidence than to a causal estimate. To test necessity, delete, replace, or corrupt the candidate artifact and measure whether behavior changes with it.

## What does this evidence support, and what does it not support?

### Paper evidence

- In the authors' fully synthetic 26-family / 204-episode suite, matched persistence controls measure a cross-session positive gap; every Hermes/base-model configuration in Table 2 has a positive Overall $\Delta$ ([§§4.1–4.2](https://arxiv.org/html/2608.04003v1#S4)).
- The same task-score gap can have different artifact and telemetry evidence: nanobot and Hermes both reach +0.13, but their Mech scores differ ([Table 3 and Appendix D.3](https://arxiv.org/html/2608.04003v1#S4.T3)).
- Target-specific ablations and trace case studies connect Plan, Render, Route, Gate, and Close to observable failure stages; the clearest full-composition gain is on Update ([§§4.3–4.4 and Appendix A.3](https://arxiv.org/html/2608.04003v1#S4.SS3)).

### Author claims, kept in their proper register

The authors say PAST-Bench and Hermes+ provide a foundation for studying how persistent agents move from retaining experience toward systematic improvement. I read “foundation” as an evaluation and diagnosis foundation, not proof of full RSI. Hermes+ should likewise be read as a diagnostic scaffold for the tested benchmark traces, not as a runtime that will improve every model, task, or deployment environment.

### Bloss0m inference and unsupported claims

My engineering inference is that an enterprise agent claiming “memory made it better” should at minimum retain paired runs from the same task family, persistent-artifact diffs, retrieval events, and the final external outcome. A final answer or one-shot success rate is not enough. This is an engineering inference, not an enterprise result tested by the paper.

The paper does not support these statements:

1. PAST-Bench has established recursive self-improvement or an agent that improves its own learning algorithm.
2. Synthetic, author-written families represent real-user long-term traffic; Appendix A.2 explicitly says there is no real-user data.
3. The matched on/off difference is a causal effect; the authors call it a strong design control, and Mech measures consistency with an expected pathway.
4. Hermes+ is superior to every memory architecture in production or enterprise agents; framework adapters retain native context, compaction, and truncation differences, so absolute cross-system scores are not a clean ranking.
5. Mech is available for every persistence interface; Appendix C.3 says a black-box agent can report Task Score and $\Delta$, but Mech requires observable persistence events.

## Engineering use: build the attribution harness before optimizing memory

### When this method is a good fit

- You can toggle persistence access while keeping model, prompt, tools, grader, and seed matched.
- You need to locate whether failure occurs at write, read, apply, update, stale filtering, or retrieval timing rather than receive one memory leaderboard number.
- Your agent exposes artifact diffs and persistence events; otherwise you can measure the behavioral gap but not Mech.

A minimal internal harness could be:

```text
family: learn -> fresh eval -> control
             |              |
      persistence-on   persistence-off
             |              |
       artifact + trace + external outcome
             \__________ paired delta _________/
```

Start with one capability slice and measure four things: task score, $\Delta$, artifact correctness, and retrieval/apply events. Then add counterfactuals by failure type: delete the candidate memory, replace it with stale state, or put the skill in the wrong namespace, and check whether behavior changes. That answers which persistence surface is actually doing work more directly than stuffing the entire history into context.

### When not to apply it directly

- The agent has no controllable session boundary, so prior prompts or context leak into evaluation; persistence gain and in-context carry-over will be confounded.
- The task is one-shot and fully decidable by a deterministic verifier; checking external state directly is more appropriate than adding Mech or an LLM judge.
- You need claims about real customers, cross-domain transfer, or month-scale drift; this v1's synthetic isolated families do not provide that evidence.
- You want to use Overall $\Delta$ as a production gate; Agent-Zero's negative gap, Hermes+'s Procedural regression, and run variance require capability- and risk-specific reading.

## Reproducibility and artifact status (as of 2026-08-09)

This section separates “the paper says it exists” from “the endpoint is independently usable”:

| Artifact | Independent verification | Status |
| --- | --- | --- |
| arXiv abstract, HTML, and v1 PDF | `arxiv.org/abs/2608.04003`, `/html/2608.04003v1`, and `/pdf/2608.04003v1` all resolve. | Usable; still a v1 preprint. |
| Official PAST-Bench code | [Gen-Verse/PAST-Bench](https://github.com/Gen-Verse/PAST-Bench) is public on `main`; `src/past_bench`, `self-evolve-tasks-v2`, configs, mock services, and tests are present. | Usable; original code is Apache-2.0. |
| Benchmark families, runner, and tests | The task, runner, and test paths open directly; the README documents Python 3.11+, uv, Docker, API keys, and smoke-test commands. | Usable with external dependencies. |
| Release, checkpoint, or dataset page | The official GitHub repository and its API were reachable on 2026-08-09; the releases and tags endpoints each returned an empty list, and the README lists no separate Hugging Face dataset, checkpoint, or demo URL. | **Not found as of the check**; do not describe a released checkpoint, versioned bundle, or offline reproduction. |
| Models and APIs | README profiles require external MiniMax, Zhipu, Kimi, DeepSeek, or OpenAI API keys; model weights are not in the PAST-Bench repo. | Requires credentials and provider access. |
| Third-party agents | The repo contains adapters/local components and upstream license files for Agent Zero, Hermes, nanobot, and ZeroClaw; their upstream repositories resolve, but their licenses and runtime dependencies still apply. | Partially usable; not byte-for-byte identical in every environment. |

The smallest useful reproduction should therefore be **conditional**: follow the README to create Python 3.11, uv, Docker, and a model API environment; build the sandbox image; run one family such as `SM01_preference_adoption` with Hermes+ and MiniMax-M2.7, enabling `--compare-no-persistence`; save `sequence_results.json`, `sequence_summary.json`, and `sequence_comparison.json`; then compare one paired persistence gap with its trace evidence. A full 26-family, seven-model, four-framework reproduction still needs external services plus time/cost measurement. Table 12 reports per-episode tokens and wall time, not the total cost of the full suite.

## Reading conclusion and next step

PAST-Bench belongs in an agent-evaluation reading path because it asks for **cross-session outcome, control difference, and mechanism evidence** together. It also makes the current boundary visible: the task families are synthetic, framework comparison is not a pure causal comparison of one architectural component, Mech depends on observable events and prewritten expectation contracts, and Hermes+'s overall gain is smaller than run variance.

For the existing Bloss0m path, read [Beyond RAG for Agent Memory](/en/paper-reading/06-beyond-rag-for-agent/) for the persistence substrate, then compare [OSReward](/en/paper-reading/08-osreward-agent-evaluation/) on the failure mode where an outcome looks successful but its evidence is weak; [ContextWeave](/en/paper-reading/09-contextweave-workflow-benchmark/) pushes the question toward longer, more realistic workflow evaluation. Together, the engineering question is not “which memory is strongest?” but: **can an agent's next action be supported by inspectable state and external outcomes that show it actually learned?**

## Primary sources

- [PAST-Bench arXiv abstract and version history](https://arxiv.org/abs/2608.04003)
- [PAST-Bench full HTML paper, v1](https://arxiv.org/html/2608.04003v1)
- [PAST-Bench PDF, v1](https://arxiv.org/pdf/2608.04003v1)
- [PAST-Bench official repository](https://github.com/Gen-Verse/PAST-Bench)
- [PAST-Bench Apache-2.0 license](https://raw.githubusercontent.com/Gen-Verse/PAST-Bench/main/LICENSE)
