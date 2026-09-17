---
title: "When Failure Propagates, Can We Still Find the Start? Causal Failure Attribution in Agentic RAG"
description: "A deep reading of When Failures Propagate: an interventional benchmark, three-hop MuSiQue, and certified content corruption that separate failure detection, causal attribution, propagation, and recovery in agentic RAG."
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "The paper does not treat a wrong answer as a root-cause label. It injects a certifiable fault at a specified hop, lets the agent genuinely rerun its suffix, and tests whether a diagnoser recovers that injection point."
  - "In the strict sweep of 80 three-hop MuSiQue questions with Claude Haiku 4.5 and dense retrieval, coverage-based attribution is 0.91 at hop 1 and 0.00 at hops 2 and 3. This is evidence of post-hoc signal loss after propagation, not proof that all agentic RAG failures are impossible to attribute."
  - "The content-corruption arm keeps documents topically relevant while changing an answer fact or bridge entity. Hop-2 coverage is 0.00 and frozen-hop counterfactual attribution is 0.67, but the pooled denominator is only 18 failed cases, so this remains an exploratory comparison."
  - "The engineering distinction is causal attribution versus general failure diagnosis: the former needs an intervention label, hop-level trace, and replayable counterfactual; the latter only asks which class of signal looks problematic."
audience:
  - "Engineers building agentic RAG, multi-hop retrieval, or trajectory evaluation"
  - "RAG platform teams that need to trace retrieval faults, suffix propagation, recovery, and diagnosis cost"
tags: ["Paper Reading", "RAG", "Agentic RAG", "Retrieval", "Evaluation", "Observability"]
image: "/paperReading/57-agentic-rag-causal-failure-attribution/title_image.webp"
field: "Retrieval Systems"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
paper:
  title: "When Failures Propagate: Causal Failure Attribution in Agentic Retrieval-Augmented Generation"
  authors:
    - "Lauren Pothuru"
  year: 2026
  venue: "arXiv 2608.20627 v1（2026-08-20；未同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2608.20627v1"
    arxiv: "https://arxiv.org/abs/2608.20627"
    doi: "https://doi.org/10.48550/arXiv.2608.20627"
    code: "https://github.com/anote-ai/Research-AgenticRAG"
    project: "https://arxiv.org/html/2608.20627v1"
series:
  id: "agentic-rag-failure-attribution"
  title: "Agentic RAG Failure Diagnosis and Attribution"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Research problem:** Agentic RAG splits retrieval, reasoning, and answering across several hops. An early bad piece of evidence can become query drift, a wrong bridge, or a wrong answer, but later retrieval can also repair it. A final answer or the last trace state therefore cannot directly tell us which hop first caused the failure.
- **Core insight:** AgenticRAG-FP injects a certifiable fault at a specified hop, then resumes execution from the changed prefix and regenerates the suffix. The diagnoser is not guessing the cause of a static error trace; it is tested against the known injected_at_hop label with exact-hop attribution.
- **Strongest evidence:** The strict dense Claude Haiku 4.5 sweep uses 80 three-hop MuSiQue questions. Among cases that still fail, coverage-based exact-hop accuracy is hop 1: 0.91 [0.81, 0.98], hop 2: 0.00 [0.00, 0.00], and hop 3: 0.00 [0.00, 0.00], with failed denominators 43, 36, and 21 respectively ([Table 2, Section 7.1](https://arxiv.org/html/2608.20627v1#S7.T2)).
- **Main boundary:** The result supports the claim that, under this strict intervention and suffix-resumption setup, coverage’s hop-level signal disappears at deeper hops. It does not support the claim that every natural agentic RAG failure is un-attributable. The content study has only 18 hop-2 failed cases and 3 hop-3 failed cases, so its method comparisons cannot be generalized.

My bounded verdict is: **the paper’s real contribution is to turn “the answer is wrong” into an intervention-labeled, propagation-depth-aware causal attribution problem.** Its hardest evidence is the collapse of coverage in the strict MuSiQue setting; the Propagation-Aware versus Suf-Regen comparison explains counterfactual scope on small samples rather than establishing a generally superior diagnoser.

> **Huahua's engineering note**
>
> A dashboard that can name a failure stage does not thereby prove a root cause. If the trace does not preserve hop, query, document version, intervention position, and replay conditions, a low-coverage observation may only be an early fault’s downstream effect. Do not write a general diagnosis score as a causal-RCA guarantee.

## Version, sources, and the reader question

This article reads [When Failures Propagate: Causal Failure Attribution in Agentic Retrieval-Augmented Generation](https://arxiv.org/abs/2608.20627), arXiv v1. The arXiv record lists Lauren Pothuru as the author and 2026-08-20 as the submission date; it is a preprint, so this article does not describe it as a peer-reviewed conference or journal result. I checked the [full HTML](https://arxiv.org/html/2608.20627v1), [PDF](https://arxiv.org/pdf/2608.20627v1), TeX source, Sections 3–10, Appendices A–C, Tables 1–5, and the author’s [Research-AgenticRAG repository](https://github.com/anote-ai/Research-AgenticRAG). The arXiv HTML page marks the paper CC BY 4.0. The repository keeps additional evaluation plots under paper/figures but has no independent license file, so every figure caption here preserves the original source and copyright/reuse caveat.

The reader question is: **when a three-hop RAG answer is wrong, can we distinguish the earliest hop that caused a propagating fault from the hop that merely looks most suspicious at the end?** This is a natural follow-up to [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/), [REVA’s reusable evidence views](/en/paper-reading/47-reva-reusable-evidence-views/), and [Predicting Partial Answer Quality](/en/paper-reading/53-agentic-rag-partial-answer-prediction/): the first separates evidence discipline, REVA discusses reusable evidence views, and this paper turns root-cause attribution itself into an interventional evaluation problem.

## Evidence map: Paper, Evidence, and Bloss0m judgment

| Layer | What this article says |
| --- | --- |
| **Directly supported by the Paper** | AgenticRAG-FP’s trace model, seven live interventions, certified content corruption, exact-hop/stage/recovery/cost metrics, strict dense Claude Haiku 4.5 MuSiQue results, and the pooled content-fault results with their limitations. |
| **Author’s interpretation** | Resuming a suffix after intervention makes propagation depth an evaluation axis; post-hoc coverage may lose its signal at deeper hops; frozen-hop repair and suffix regeneration answer different downstream-dependence questions. |
| **Not established by the Evidence** | A universal root cause for natural production faults, a cross-backbone or cross-dataset ranking, complete factorial coverage, persistent corpus-corruption recovery, or an impossibility theorem saying that all agentic RAG failures cannot be attributed. |
| **Bloss0m engineering judgment** | Treat causal attribution as a replayable evidence contract: preserve the intervention label, original and injected prefix, each hop’s query/document/version, suffix policy, final outcome, and diagnosis cost, while keeping uncertainty separate from an ordinary failure class. |

### Paper Essence Contract

1. **What problem does it solve?** It asks whether a diagnoser can recover the injected hop after an early retrieval fault has propagated through a multi-hop agentic RAG trajectory or has been partly repaired, rather than merely observing that the final answer is wrong.
2. **Why are prior approaches insufficient?** Final-answer accuracy, retrieval recall, and a completed trace mix the injected fault with downstream consequences and recovery. Without an intervention label, a late symptom cannot be separated from the earliest cause.
3. **What is the core technical idea?** Intervene on evidence, a query, or a termination decision at a specified hop; preserve the certified target; resume the agent from the changed prefix; and evaluate exact-hop attribution against the known intervention location.
4. **How does one input move through the method?** The path is question → base trace → inject at hop h → resume from hop h+1 → changed suffix → final answer → failed-only attribution or recovered outcome. Content corruption additionally stores the original and replacement spans, making absorbed, resisted, and derailed outcomes deterministic rather than dependent on an LLM judge.
5. **What evidence supports the headline claim?** [Table 2 in Section 7.1](https://arxiv.org/html/2608.20627v1#S7.T2) is the strongest evidence: under strict dense Claude Haiku 4.5 and three-hop MuSiQue, coverage accuracy falls from 0.91 at hop 1 to 0.00 at hops 2 and 3. [Table 3](https://arxiv.org/html/2608.20627v1#S7.T3) keeps the small-sample content-fault counterfactual comparison separate.
6. **Where does the claim stop?** The conclusion stops at the selected benchmark, model, retriever, intervention family, and failed-case denominator. It describes one observed post-hoc identifiability limitation; it does not prove that natural faults are un-attributable and does not provide a production diagnosis SLO.

## Why prior approaches are insufficient: a wrong answer is not a root-cause label

Standard RAG evaluation asks whether the answer is correct, while retrieval evaluation asks whether supporting documents were found. Both questions matter, but neither captures the temporal structure of agentic RAG: what each hop saw, how the next sub-query was formed, whether later evidence repaired the path, and which later observation is merely a consequence. In a three-hop trajectory, empty evidence at hop 1 can produce a drifted hop-2 query and a hop-3 document that appears relevant while resting on a false premise. The final trace may show low coverage at hop 2 or hop 3, but that observation is a symptom until an intervention establishes causality.

The reverse situation is just as important. Later retrieval may find a clean supporting document and let the agent answer correctly. If an evaluator records only “no final failure,” it misses that an injected fault was absorbed or repaired. If it counts the case as a diagnoser error, it conflates recovery with attribution. The paper consequently separates two questions:

- **General failure diagnosis:** does this trace look like a retrieval, tool, or answer-generation problem?
- **Causal failure attribution:** after a known fault has been injected and the agent has reacted to it, does the diagnoser recover the exact injected hop?

The second question needs an intervention. Without a fixed fault and hop, a late low-coverage hop may be a cause, an effect, or a benign consequence; these possibilities can look observationally similar ([Task and Trace Model, Section 3](https://arxiv.org/html/2608.20627v1#S3)).

## Core intuition: one trace contains information the system needs and information the diagnoser needs

Consider a minimal three-hop flow. At each hop, the agent writes a sub-query, the retriever returns documents, and the agent decides whether to continue or answer. The agent needs enough evidence to produce an answer. An RCA diagnoser needs more: it needs to know which evidence was altered by a fault and which evidence was generated later in reaction to that alteration. These are not the same information requirements. Compensating evidence can restore the answer without putting the overwritten intervention signature back into the completed trace.

The paper makes this boundary explicit with the following trace object ([Section 3](https://arxiv.org/html/2608.20627v1#S3)):

$$
\tau=\bigl(q,\{(q_h,D_h)\}_{h=1}^{H},A,y,c\bigr).
$$

Here, $q$ is the original question, $q_h$ is the sub-query at hop $h$, $D_h$ is the evidence retrieved from corpus $\mathcal{C}$ at that hop, $A$ is the final answer, $y$ is the reference answer, and $c$ is the total token cost. The operational meaning is simple: suffix replay cannot be performed from the final answer alone. At minimum, every hop’s query and documents must be retained so that execution can resume from a prefix.

Each hop also has a stage $s\in\{\mathrm{retrieval},\mathrm{tool},\mathrm{answer},\mathrm{none}\}$. A diagnoser returns a predicted stage $\hat{s}$ and hop $\hat{h}$. A trajectory is **identifiable at depth $h$** only when the exact-hop condition $\hat{h}=h$ holds. Correctly naming the retrieval stage and correctly naming the hop that caused the failure are therefore different targets with different difficulty.

## Worked example: walking one input through the method

The following is a teaching simplification of the paper’s three-hop scenario, not one of the authors’ MuSiQue questions and not new experimental evidence. It exists to show why a live intervention and a static trace edit have different semantics.

1. **Input:** The question asks for an answer satisfying three linked relations. A clean agent begins by forming a hop-1 sub-query from the original question.
2. **Intermediate representation:** Hop 1 returns document $D_1$. The agent extracts an entity from $D_1$ to form hop-2 query $q_2$, then extracts a bridge from $D_2$ to form hop-3 query $q_3$.
3. **Intervention:** The experiment replaces hop-1 evidence with empty or irrelevant evidence and records injected_at_hop=1. This is the certified root label, not a label the diagnoser guessed after the fact.
4. **Changed suffix:** The agent resumes from hop 2. It may form a drifted $q_2$ because the evidence is empty, or it may find a supporting document later. This suffix is the agent’s actual response to the corrupted context, not text copied from the original completed trace.
5. **Output:** If the final answer is wrong, the diagnoser sees a failed trace after propagation. If the final answer is correct, the case is a recovery outcome; the absence of a final failure must not be silently counted as successful exact-hop attribution.
6. **Likely failure point:** Suppose a coverage diagnoser marks hop 3 as the first low-coverage location. It has identified the most visible symptom, while the intervention ground truth remains hop 1. Comparing predicted h with certified h is the only way to know whether it actually performed causal localization.

This example contains two easily confused successes. The agent can answer correctly without the diagnoser identifying the injection, and the diagnoser can find a low-support hop without finding the earliest cause. The benchmark separates these outcomes precisely so that end-answer quality cannot substitute for causal evidence.

## Method mechanism: intervention, resumption, and two counterfactual scopes

### How live intervention preserves a causal label

The AgenticRAG-FP live path takes an executed prefix, changes evidence, a sub-query, or a termination decision at a selected hop, and then calls a resumable agent to execute the suffix. Structural interventions include empty retrieval, irrelevant documents, query drift, false premise, stale evidence, and early termination ([Table 1, Section 4](https://arxiv.org/html/2608.20627v1#S4.T1)). They cover missing evidence, misleading evidence, and altered decisions. Their different visibility patterns test whether a post-hoc signal observes only a local symptom or can locate the position that caused it.

The important property of resume-from-hop execution is semantics, not an API name. The prefix before hop $h$ remains in the state specified by the experiment; the agent starts again at $h+1$ and makes new query, retrieval, reasoning, or answer decisions. Replacing a passage in an already completed trace without regenerating later queries would be a static edit. It would not measure propagation through the agent.

### Content corruption: the document stays relevant while a fact changes

Structural faults are often easy for coverage to see: empty or off-topic documents naturally lower answer overlap. The paper adds a harder content-corruption arm that preserves topical relevance while changing one certifiable span. The selection priority is:

- **Answer fact:** if the gold answer appears in the evidence at that hop, replace it with another certifiable value.
- **Bridge entity:** if an entity appears both in that hop’s document and in a later query, but not in the original question, change that link in the chain.
- **Salient entity or number:** if the first two strategies do not apply, use a fallback. Numbers receive a deterministic perturbation; an entity is replaced with an in-domain distractor that has no token overlap with the original span.

Each corruption records the original span, corrupted span, strategy, and replacement kind. Samples without a certifiable span are skipped and counted. More importantly, this arm changes a trajectory copy while keeping the corpus clean. Later retrieval can therefore retrieve the original fact and repair the trajectory. That is a limitation of the study, not a persistent stale-index experiment ([Certified content corruption, Section 4](https://arxiv.org/html/2608.20627v1#S4)).

### The diagnosers ask different questions

| Diagnoser | What it observes or executes | The question it mainly answers |
| --- | --- | --- |
| Rule-based | Empty retrieval, tool calls, answer text, and grounding overlap in the final trace | Which visible stage looks like it failed? |
| Doctor-RAG / coverage | Token coverage of the gold answer at each hop; marks the first hop below a threshold | Where does answer support first look missing? |
| LLM-Judge | The complete hop-level trace, with predicted stage and hop | Which hop is semantically most suspicious? |
| Propagation-Aware | Retrieves clean evidence for a candidate hop, holds other hops fixed, and force-answers with a frozen-hop repair | Would repairing one local input flip the answer while downstream evidence stays fixed? |
| Suf-Regen | Repairs a candidate hop, then rebuilds the suffix from the next hop | Would a repaired prefix lead the agent down a different downstream path? |

This is a reader-oriented organization of the paper’s implementation, not a new author taxonomy. The two active probes differ in downstream evidence. Propagation-Aware holds other hops fixed, including later corrupted documents. Suf-Regen permits the suffix to regenerate. The former may preserve a content fault in a later hop; the latter can handle a changed bridge entity better, but may also re-retrieve clean corpus evidence and accidentally remove the deeper fault being measured.

## Metrics and experimental setup: fix the denominator before reading the curve

### Exact-hop attribution and recovery are two different scores

For injected traces that still fail, the paper computes:

$$
\mathrm{Acc}_d(h)=\frac{1}{|\mathcal{F}_h|}\sum_{\tau_i\in\mathcal{F}_h}1[\hat{h}_{d,i}=h_i].
$$

Here $d$ is a diagnoser, $h_i$ is the known intervention hop, and $\hat{h}_{d,i}$ is the prediction. The denominator includes **only cases that still fail after live suffix resumption**. Recovered trajectories are not scored as diagnoser failures because recovery has a separate meaning. Each cell reports a bootstrap 95% interval with $B=1{,}000$; cells with fewer than 10 failed traces are descriptive rather than a basis for robust ranking.

Recovery asks whether the intervention reaches the answer:

$$
\mathrm{Recovery}(h)=\Pr\bigl[\mathrm{correct}(A,y)\mid do(f,h)\bigr].
$$

A high recovery rate means that the agent can sometimes self-repair with later evidence. It does not mean that a diagnoser recovered the root cause. Stage accuracy, hop tolerance, ancestor hit, and mean absolute hop error are supplementary diagnostic views; exact-hop remains the central attribution target.

### How the experiments line up

1. **Strict structural arm:** 80 three-hop MuSiQue questions, Claude Haiku 4.5, dense retrieval, and four propagation-aware probes. For each requested depth, a case is eligible only if it actually reaches that depth and the clean base answer is correct. The strict result is not a complete backbone × dataset × retriever × depth factorial grid.
2. **Content-corruption arm:** GPT-4o-mini and Claude Haiku 4.5 agents, HotpotQA and MuSiQue, $n=40$ base examples per condition, BM25, depths 1–3, five diagnosers, and a cross-family judge. The pooled failed cases are hop 1: 44, hop 2: 18, and hop 3: 3.
3. **Other substrates:** The repository also includes FRAMES, CRAG, BM25, dense retrieval, local models, and several scripts. The FRAMES link-only fallback is not a fetched passage corpus, and CRAG is normalized as a single-turn setting in this version, so neither is mixed into the strict MuSiQue headline.
4. **Cost:** The provider returns input/output tokens, which the agent accumulates in the trace. LLM-Judge and active probes add token or re-execution cost. The paper does not offer a latency or TCO guarantee that can be directly converted into a production billing SLO.

## Results: coverage collapse with depth does not mean all diagnosis fails

### Strict structural result: Table 2 makes a narrow but clear claim

| Injection depth | Doctor-RAG coverage | LLM-Judge | Propagation-Aware | failed $n$ |
| --- | ---: | ---: | ---: | ---: |
| Hop 1 | 0.91 [0.81, 0.98] | 0.26 [0.12, 0.40] | 0.51 [0.37, 0.67] | 43 |
| Hop 2 | 0.00 [0.00, 0.00] | 0.25 [0.11, 0.42] | 0.25 [0.11, 0.39] | 36 |
| Hop 3 | 0.00 [0.00, 0.00] | 0.43 [0.24, 0.67] | 0.48 [0.29, 0.67] | 21 |

Read this as question → controls → observation → explanation → boundary:

- **Question:** after the suffix is regenerated, does the low answer coverage associated with the injected hop remain in the final trace?
- **Controls:** the same strict dense Claude Haiku 4.5, the same three-hop MuSiQue setting, and the same requested depths; coverage, LLM-Judge, and frozen-hop Propagation-Aware are compared.
- **Observation:** hop-1 coverage of 0.91 shows that a structural fault can remain visible. At hops 2 and 3 it is 0.00, while the judge and frozen probe retain partial, overlapping signal.
- **Explanation:** the suffix can form a new query from corrupted context or retrieve compensating evidence. That can overwrite the local coverage signature of the injection hop. An active probe spends more tokens and may recover information from a repair outcome, but this does not prove general superiority over post-hoc diagnosis.
- **Boundary:** this is observed post-hoc signal loss under a defined evaluation boundary. It cannot become an impossibility claim for all systems, and 0.00 must not be read as saying an agent must fail at hops 2 or 3.

![Repository-retained structural curve: Claude Haiku 4.5 on FRAMES across injection depth.](/paperReading/57-agentic-rag-causal-failure-attribution/paper/figure-repo-frames-structural.webp)

*Figure 1: A repository-retained FRAMES structural attribution curve. It uses the same propagation-depth axis and coverage/active-probe curves, but it is not the arXiv v1 headline result from the 80-question strict dense MuSiQue sweep; n_failed and recovery belong to that retained run. Source: the [repository figure file](https://github.com/anote-ai/Research-AgenticRAG/blob/982b73dc4b8ed7442f044ccc0947f248e3b63d09/paper/figures/identifiability_curve_claude_claude-haiku-4-5_frames.pdf), with the paper’s [Section 7.1](https://arxiv.org/html/2608.20627v1#S7.SS1) as context. The arXiv paper page marks CC BY 4.0; the repository has no independent license, so reuse remains subject to the original author’s copyright and licensing terms.*

### Repository-retained plot: a transfer reminder, not a replacement headline

![Repository-retained structural curve: GPT-4o-mini on MuSiQue across injection depth.](/paperReading/57-agentic-rag-causal-failure-attribution/paper/figure-repo-gpt4o-mini-musique-structural.webp)

*Figure 2: A repository-retained GPT-4o-mini MuSiQue structural curve. It supplies another model/condition view in the public artifact and reminds us that curve shape depends on backbone, retriever, and run condition; it must not be merged with Table 2’s Claude Haiku 4.5 dense denominator. Source: the [repository figure file](https://github.com/anote-ai/Research-AgenticRAG/blob/982b73dc4b8ed7442f044ccc0947f248e3b63d09/paper/figures/identifiability_curve_openai_gpt-4o-mini_musique.pdf), with the paper’s [Section 6 setup boundary](https://arxiv.org/html/2608.20627v1#S6) as context. The arXiv paper page marks CC BY 4.0; the repository has no independent license, so reuse remains subject to the original author’s copyright and licensing terms.*

These retained plots are useful for teaching the transfer boundary, not for quietly replacing the paper’s primary result with broader repository runs. In particular, a FRAMES passage corpus consisting only of link titles has different retrieval fidelity. Any cross-condition visual trend must remain inside the artifact context.

### Content faults: topical relevance does not preserve causal signal

| Diagnoser | Hop 1 ($n=44$) | Hop 2 ($n=18$) |
| --- | ---: | ---: |
| Doctor-RAG (coverage) | 1.00 [1.00, 1.00] | 0.00 [0.00, 0.00] |
| LLM-Judge (cross-family) | 0.59 [0.43, 0.73] | 0.89 [0.72, 1.00]† |
| Propagation-Aware (frozen-hop) | 0.89 [0.80, 0.98] | 0.67 [0.44, 0.89] |
| Suf-Regen | 0.91 [0.82, 0.98] | 0.11 [0.00, 0.28] |

This is the pooled comparison in [Table 3, Section 7.2](https://arxiv.org/html/2608.20627v1#S7.T3). Read the denominator first: hop 2 has only 18 failed cases, so its interval describes uncertainty within this pooled sample rather than definitive head-to-head significance. The 0.00 coverage result says that answer coverage is no longer a reliable root-cause locator when a document remains relevant but its fact has been rewritten. The 0.67 frozen-hop result says that holding other hops fixed and repairing one candidate can expose additional information in some cases; it is not a 67% production RCA guarantee.

† The hop-2 LLM-Judge estimate also carries a positional prior: the authors report a strong tendency toward the middle hop. Cross-family judging reduces self-recognition concerns but does not automatically make semantic localization unbiased.

![Figure 1 left panel: GPT-4o-mini agent judged by Claude Haiku 4.5 on HotpotQA content corruption.](/paperReading/57-agentic-rag-causal-failure-attribution/paper/figure-1-gpt4o-mini-hotpotqa-corruption.webp)

*Figure 3: The left panel of the paper’s Figure 1: HotpotQA, BM25, a GPT-4o-mini agent, and a Claude Haiku 4.5 judge in the content-corruption curve. Notice that this is a different model/dataset condition from Table 2’s strict dense Claude–MuSiQue result. Source: [Figure 1, Appendix C / A3.F1](https://arxiv.org/html/2608.20627v1#A3.F1); the original figure is from the arXiv source and the corresponding author-repository PDF. The arXiv HTML marks CC BY 4.0; this local WebP preserves the original plot after format conversion, and reuse remains subject to the original license and copyright terms.*

![Figure 1 right panel: Claude Haiku 4.5 agent judged by GPT-4o-mini on HotpotQA content corruption.](/paperReading/57-agentic-rag-causal-failure-attribution/paper/figure-1-claude-haiku-hotpotqa-corruption.webp)

*Figure 4: The right panel of the paper’s Figure 1: HotpotQA, BM25, a Claude Haiku 4.5 agent, and a GPT-4o-mini judge in the content-corruption curve. Notice that Suf-Regen falls at hop 2 because re-retrieving from the clean corpus can restore the original evidence; this visualizes the different scope of frozen-hop and suffix-regeneration counterfactuals. Source: [Figure 1, Appendix C / A3.F1](https://arxiv.org/html/2608.20627v1#A3.F1); the original figure is from the arXiv source and the corresponding author-repository PDF. The arXiv HTML marks CC BY 4.0; this local WebP preserves the original plot after format conversion, and reuse remains subject to the original license and copyright terms.*

### Answer outcomes: keep recovery, absorption, and derailment separate

Content corruption also permits deterministic answer-level evaluation using the certified span, without asking another judge whether the agent “copied” the bad value:

| Depth | Absorbed | Resisted | Derailed | all-injected $n$ |
| --- | ---: | ---: | ---: | ---: |
| Hop 1 | 0.15 | 0.58 | 0.26 | 106 |
| Hop 2 | 0.09 | 0.74 | 0.18 | 68 |
| Hop 3 | 0.00 | 0.85 | 0.15 | 20 |

These are the all-injected denominators from [Table 4, Section 7.3](https://arxiv.org/html/2608.20627v1#S7.T4), not the failed-only denominators used for attribution above. **Absorbed** means the answer contains tokens from the corrupted span; **resisted** takes priority when the answer is correct; the remainder is **derailed**. At hop 1, 15% of 106 cases were absorbed, 58% resisted, and 26% derailed. Of 22 absorbed cases overall, 20 were answer-fact corruptions; salient-entity corruption was absorbed in 0 of 40 cases. Query contamination was only 3/129, suggesting that bad content more often affects intermediate reasoning or the answer than being copied directly into the next query. This supports the claim that query-text-only monitoring can miss content propagation, but it does not establish the same pattern beyond three hops.

## Ablations and failure modes: the two repairs ask different causal questions

### Frozen-hop repair and suffix regeneration have different scopes

Propagation-Aware repairs candidate hop $h$, holds other hops fixed, and force-answers to test whether the outcome flips. It asks: “If downstream evidence stays as observed, does changing this one local input change the outcome?” Its advantage is preserving other corruptions; its limitation is that later hops may already depend on the corrupted prefix. Repairing an early cause can still leave a late error in place.

Suf-Regen repairs a candidate hop and lets the agent query and retrieve again from the next hop. It asks: “Can a clean prefix lead to a different downstream trajectory?” This is useful for bridge-entity corruption. But with answer-fact corruption, a clean corpus can let the regenerated suffix retrieve the original fact, thereby removing the deeper fault being measured. The paper reports hop-2 Suf-Regen at 0.11 versus frozen-hop at 0.67; on the descriptive bridge-entity slice, Suf-Regen is 1.00 versus Propagation-Aware at 0.73 ($n=11$). This supports a scope-complementarity interpretation, not a universal method ranking ([Section 7.2](https://arxiv.org/html/2608.20627v1#S7.SS2)).

### A 0.00 coverage score is not a universal theorem

In the Discussion, the authors describe the observed collapse as a coverage-signal identifiability limitation. If regenerated suffixes overwrite the local signature of the injection point, changing the threshold cannot recreate information that is no longer represented. This describes a limitation of the current intervention, trace representation, and post-hoc signal; it is not an impossibility proof for every agentic RAG. Versioned prefixes, query decisions, retriever candidate lists, or multiple counterfactual lineages could change what remains identifiable, but the paper does not test those variants ([Discussion, Section 8](https://arxiv.org/html/2608.20627v1#S8)).

## Bloss0m engineering synthesis: make causal RCA a replayable trace contract

The following is not a production architecture proposed by the paper. It is a **Bloss0m engineering synthesis** derived from the paper’s evidence and failure boundary; the label is intentional so that readers do not mistake it for the authors’ framework.

1. **Separate the fields:** Store failure_detected, failure_stage, injected_at_hop, predicted_hop, and confidence separately. Do not make a single root_cause field carry both an observation and a causal claim.
2. **Preserve a replayable prefix:** Record each hop’s query, retriever, candidate and selected document IDs, corpus version, evidence-text hash, decision, and token cost. Without the prefix, the suffix cannot be rerun under the same conditions.
3. **Make intervention semantics explicit:** Distinguish empty, irrelevant, query drift, false premise, stale, content corruption, and early termination. A content arm must record the original span, replacement span, and selection strategy.
4. **Choose the counterfactual scope deliberately:** Bridge dependence may need suffix regeneration; a deep answer-fact fault may be better tested by frozen-hop repair. If the two answers disagree, report uncertainty instead of selecting whichever score looks higher.
5. **Make recovery a separate outcome:** recovered_after_intervention does not equal attributed_correctly. A dashboard should show failed-only exact-hop, all-injected recovery, stage accuracy, and diagnosis token cost together.
6. **Gate offline before production:** Estimate false attribution, skips, cost, and judge priors on fixed benchmarks and natural failures before placing a causal probe in an online incident workflow. This paper does not provide a production threshold.

The engineering implication is direct. If a platform stores only the final answer, the last top-k list, and one error label, it can perform general diagnosis. To claim causal RCA, it must answer what was changed, how the suffix was replayed, which evidence was held fixed, whether the answer recovered, and how much the probe cost.

### When is this worth using?

- You need to compare whether a retrieval or agent-routing change alters the root-cause distribution, not merely end-answer accuracy.
- The multi-hop workflow has a durable hop-level trace, a stable corpus snapshot, and a retrievable provider/retriever configuration.
- Failure replay is affordable, and the team is willing to report recovered, failed, and uncertain cases separately.

### When should it not be used directly?

- The agent has no discrete hops or replayable prefix, or a downstream tool has irreversible side effects; the paper’s resumption semantics then do not hold.
- The online corpus changes continuously and ACL or document versions cannot be pinned; a counterfactual repair may only have read a different world.
- There are few natural failures, but the team wants to turn 18 hop-2 content failures or 3 hop-3 failures into a stable ranking.
- Coverage, LLM-Judge, or one counterfactual flip is being presented as a proven causal guarantee; these are evidence under this benchmark boundary, not a guarantee.

## Limitations, threats, and unsupported interpretations

1. **Model and benchmark boundary:** The headline strict result uses one Claude Haiku 4.5 model, one dense retriever, and 80 three-hop MuSiQue questions. The paper does not cover a full backbone × dataset × retriever × depth factorial design.
2. **Intervention is not a natural fault:** A certifiable fault makes ground truth evaluable, but whether an artificial injection represents production upstream extraction, a stale index, or model-induced query drift remains an external-validity question.
3. **The content arm uses a clean corpus:** Re-retrieval after editing a trajectory copy can recover the original correct evidence. That recovery may come from the clean corpus rather than repair of a persistent stale index, which the paper leaves for future work.
4. **Unequal sample sizes:** Pooled failed $n$ for content hops 1, 2, and 3 is 44, 18, and 3. Hop 2 supports exploratory mechanism reading; hop 3 is descriptive and cannot support method ranking.
5. **LLM-Judge is not ground truth:** Cross-family judging reduces self-recognition, but the hop-2 score of 0.89 carries a middle-hop positional prior. A higher judge score is not automatically better causal localization.
6. **Stage and hop are different granularities:** A diagnoser can correctly name the retrieval stage and still miss the exact injected hop. Calling stage accuracy RCA accuracy weakens the paper’s central question.
7. **No impossibility claim:** The 0.00 coverage scores at hops 2 and 3 are observed signal loss under this evaluation boundary. They cannot be extended to every agentic RAG system, trace representation, or diagnoser.

## Artifact status and reproducibility (as of September 17, 2026)

| Endpoint | Status | What can be done, and what is missing |
| --- | --- | --- |
| [arXiv v1 HTML / PDF / TeX](https://arxiv.org/abs/2608.20627) | Readable; HTML has section, table, and appendix anchors; the page marks CC BY 4.0 | Claims, table values, and figure provenance can be checked against the fixed v1; no unknown later revision is mixed in. |
| [Research-AgenticRAG repository](https://github.com/anote-ai/Research-AgenticRAG) | Public; this audit checked HEAD 982b73dc4b8ed7442f044ccc0947f248e3b63d09 | src/agenticrag/, scripts, tests, paper source, results JSON, and plots are readable; the repository has no independent license file. |
| MockProvider / offline path | Available without an API key | The framework, injection, and diagnoser smoke/unit paths can run; MockProvider is a token-overlap stand-in, not the paper’s LLM evidence. |
| MuSiQue / HotpotQA dataset adapters | Code is readable, but the benchmark payload is not fully bundled | A real strict run needs Hugging Face dataset access, Python dependencies, and a pinned data version; the small fallback cannot reproduce the 80-question result. |
| Claude / OpenAI real-provider path | Code and resumable commands are readable; provider keys are required | A rerun needs ANTHROPIC_API_KEY or OPENAI_API_KEY, model endpoints, retriever dependencies, and spend. This article did not use private keys to rerun the strict sweep. |

The smallest local check is to clone the repository and run PYTHONPATH=src python -m pytest -q; in an isolated environment this audit obtained **304 passed**. I also used MockProvider to exercise synthetic content corruption and frozen/suffix probe paths, confirming that injection records a certified span, suffix replay is callable, and diagnosers report cost. Running the repository’s strict depth runner with its FRAMES fallback loaded only three link-only samples and produced no eligible strict cells, so that smoke output cannot be reported as a paper result. To rerun the author’s strict structural sweep, follow the repository’s scripts/run_submission_dense_claude.sh command with the required API key, MuSiQue dataset, dense dependencies, and same model version; for the content arm, use scripts/run_final_corruption_claude.sh or scripts/run_final_corruption_openai.sh with the cross-family judge setting. These are conditional reproduction paths, not a claim that cloning alone reproduces the published cells.

## Three things to remember

1. **Technical idea:** Inject a certified fault at a specified hop and let the agent rerun its suffix. Exact-hop causal attribution is measurable only when the intervention label and changed trajectory remain available.
2. **Strongest evidence:** In the strict dense Claude Haiku 4.5 sweep over 80 three-hop MuSiQue questions, coverage attribution falls from 0.91 at hop 1 to 0.00 at hops 2 and 3. This is narrow, clear evidence of post-propagation signal loss.
3. **Adoption boundary:** Frozen-hop and suffix regeneration are complementary counterfactuals, not a universal diagnoser. Small hop-2/hop-3 content denominators, clean-corpus recovery, one model, and artificial injection mean that this benchmark is a research attribution instrument, not a production RCA guarantee.

## Primary sources

- [When Failures Propagate: Causal Failure Attribution in Agentic Retrieval-Augmented Generation, arXiv v1](https://arxiv.org/abs/2608.20627); [full HTML](https://arxiv.org/html/2608.20627v1); [PDF](https://arxiv.org/pdf/2608.20627v1). The definitions, table values, intervention semantics, limitations, and Figures 1–4 in this article follow this version.
- [Official Research-AgenticRAG repository](https://github.com/anote-ai/Research-AgenticRAG), including the [paper figures directory at the audited commit](https://github.com/anote-ai/Research-AgenticRAG/tree/982b73dc4b8ed7442f044ccc0947f248e3b63d09/paper/figures). Figures 1–2 in this article are repository-retained plots and are explicitly not substitutes for the v1 headline.
- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401), [ReAct](https://arxiv.org/abs/2210.03629), [Doctor-RAG](https://arxiv.org/abs/2604.00865), [HotpotQA](https://arxiv.org/abs/1809.09600), [MuSiQue](https://arxiv.org/abs/2108.00573), [FRAMES](https://arxiv.org/abs/2409.12941), [CRAG](https://arxiv.org/abs/2406.04744), and Pearl’s [Causality](https://doi.org/10.1017/CBO9780511803161) are the original sources in the paper’s related-work and methodological context, not replacements for this article’s strict evidence.
