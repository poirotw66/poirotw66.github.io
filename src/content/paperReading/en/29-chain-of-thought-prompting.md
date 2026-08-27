---
title: "CoT: Make the Model Write the Reasoning, but Do Not Treat It as an Agent That Moves"
description: "A source-grounded reading of Wei et al., NeurIPS 2022: few-shot exemplars with intermediate steps elicit multi-step reasoning in large frozen models. PaLM 540B on GSM8K moves from 17.9 to 56.9; this is still a prompt, not tools, an environment, or memory paging."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "CoT changes whether the prompt writes intermediate natural-language steps before the answer; weights stay frozen, with no tool calls, environment observations, or memory paging."
  - "On GSM8K, PaLM 540B moves from 17.9 standard to 56.9 CoT (Table 1); the gain appears around 100B parameters, and smaller models often emit fluent but illogical chains that score worse (Table 2)."
  - "Ablations show equation-only, dummy compute, and reasoning-after-the-answer stay near the baseline (Figure 5); this is not a ReAct loop and not later self-consistency."
audience:
  - "AI engineers who need to pull CoT out of an agent loop and keep “reason without touching the world” as its own contract."
  - "Technical leads who must treat exemplar quality, model scale, and unfaithful chains as adoption boundaries."
tags: ["Paper Reading", "Agent Systems", "Chain-of-Thought", "Prompting"]
image: "/paperReading/29-chain-of-thought-prompting/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - tool-use-coding-agents
  - agent-evaluation-observability
paper:
  title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models"
  authors:
    - "Jason Wei"
    - "Xuezhi Wang"
    - "Dale Schuurmans"
    - "Maarten Bosma"
    - "Brian Ichter"
    - "Fei Xia"
    - "Ed H. Chi"
    - "Quoc V. Le"
    - "Denny Zhou"
  year: 2022
  venue: "NeurIPS 2022（arXiv 2201.11903 v6）"
  links:
    pdf: "https://arxiv.org/pdf/2201.11903v6"
    arxiv: "https://arxiv.org/abs/2201.11903"
    doi: "https://doi.org/10.48550/arXiv.2201.11903"
    code: "https://github.com/jasonwei20/chain-of-thought-prompting"
series:
  id: "chain-of-thought-prompting"
  title: "CoT deep reading"
  part: 1
  totalParts: 1
---

To see where this note sits in the ReAct family, start with the [Agent foundations reading map](/en/blog/91-agent-method-foundation-reading-map/). For the reading method itself, pair this with the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/).

## The paper in 90 seconds

- **Problem:** Standard few-shot prompting gives only $\langle$question, answer$\rangle$ pairs. Multi-step arithmetic, commonsense, and symbolic tasks stay weak, and scaling the model alone often leaves those curves flat.
- **Core insight:** Change the exemplar to $\langle$question, intermediate reasoning, answer$\rangle$. The decision point moves from “answer immediately” to “write the work, then answer.” Weights stay frozen. This is still a prompt, not an agent.
- **Strongest evidence:** PaLM 540B on GSM8K moves from 17.9 to 56.9, above Cobbe et al.’s finetuned GPT-3 + verifier at 55 (Table 1, Figure 2). Figure 4 / Table 2 show the gain appearing around 100B parameters.
- **Main boundary:** No environment, no tools, no memory paging. Small models often get worse. A chain can be unfaithful, or luckily reach the right number. Self-consistency (Wang et al., 2022a) is a later paper; the main tables here use greedy decoding.

My bounded verdict: **CoT is worth keeping as the control point “write the reasoning into the prompt.” It is not worth reading as an agent that calls tools, consumes observations, or pages its own memory.**

> **Huahua in one sentence**
>
> Showing how to think is what gets the model to write the work. That still happens inside a frozen prompt. The world never returns an observation.

## Version and reading scope

This note reads [Wei et al., NeurIPS 2022](https://proceedings.neurips.cc/paper_files/paper/2022/hash/9d5609613524ecf4f15af0f7b31abca4-Abstract-Conference.html) against [arXiv:2201.11903 v6](https://arxiv.org/abs/2201.11903) (first posted 2022-01-28; last revised 2023-01-10). The PDF and [arXiv HTML](https://arxiv.org/html/2201.11903v6) are marked CC BY 4.0. Author order follows the camera-ready / v6 PDF: Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, Brian Ichter, Fei Xia, Ed H. Chi, Quoc V. Le, and Denny Zhou. The arXiv abs page shortens the last two names to Ed Chi and Quoc Le; the NeurIPS HTML page lowercases Brian Ichter. This article follows the PDF.

Beyond the abstract, the note checks Section 2’s exemplar format, Sections 3–5 on arithmetic / commonsense / symbolic tasks, Appendix Tables 1–7, Figures 1 / 4 / 5, and artifact endpoints as of **2026-08-27**. The paper states that no language model was finetuned while it was written. Later self-consistency, o1 / o3, DeepSeek-R1, and 2025–26 GSM8K leaderboards are **not** written back into these tables.

This is a published NeurIPS paper, not a preprint.

## The question the reader actually needs

When a model cannot do multi-step reasoning, should engineering collect a large rationale corpus and finetune, or only change the text that sits in front of the answer inside a few-shot prompt? Wei et al. answer: on a large enough frozen model, writing intermediate steps into the prompt is enough to elicit a readable reasoning chain.

The precise reading is not “is CoT an agent?” The real question is: **does writing the work before the answer move the score, on which tasks and at which scale, and where does it fail because the model is too small, the item is too easy, or the chain is unfaithful?**

## Evidence map

| Layer | How this article uses it |
| --- | --- |
| **Paper directly supports** | Figure 1 contrasts standard and CoT exemplars; Tables 1–2 give scale curves on five arithmetic benchmarks; Figure 5 and Table 6 give the GSM8K ablation; Table 4 covers commonsense; Table 5 covers last-letter and coin-flip in-domain and OOD. |
| **Author claims** | Intermediate natural-language steps elicit multi-step reasoning; the ability is emergent in scale; one frozen checkpoint can do many tasks without a per-task finetune. |
| **Not established** | That the network is “really reasoning”; that the chain is faithful to internal computation; a deployable agent runtime; tool use; environment feedback; memory paging; numbers from later sample-and-vote methods. |
| **Bloss0m engineering judgment** | Implement CoT as the reason-only ancestor. For thought interleaved with environment actions, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). For inserting APIs during training, read [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/). |

Numbers, author claims, and engineering reads stay in separate buckets below. “SOTA” means the row the paper reports at the time of writing, not a 2026 leaderboard.

## Why the previous approach is insufficient

Section 1 splits the 2021–2022 landscape into two lines.

**Expensive rationale training.** Ling et al. (2017) and Cobbe et al. (2021) already let models emit natural-language intermediate steps, but they train from scratch or finetune, and they need a large set of high-quality rationales. That is much more expensive than ordinary input–output pairs.

**Standard few-shot prompting.** Brown et al. (2020) showed that $\langle$input, output$\rangle$ exemplars can solve many simple QA tasks. On tasks that need reasoning, the same recipe is weak, and scaling often does not lift the curve (the paper cites Rae et al., 2021).

So the prior approach is insufficient not because nobody had thought of intermediate steps, but because **the control point was split**: either pay for finetuning and annotation, or demonstrate answers only and ask the model to jump the whole multi-step gap in one shot. CoT changes the text that sits in front of the answer inside the exemplar.

## Core intuition

Ignore the tables first. A student solving a word problem does not write only “the answer is 9.” They write “there were 23, 20 were used, 3 remain, 6 more are bought, so 9.” CoT asks a language model to do the same thing—and it asks that through few-shot demonstration, not a weight update.

Keep three next moves that later get collapsed into one slogan:

- **Standard prompting:** the next move can only be the final answer.
- **CoT prompting:** the next move is a stretch of intermediate natural-language steps, then the answer. The environment does not change, and no observation comes back.
- **[ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/):** a thought is a legal action that does not touch the world, and it can interleave with search / lookup; the environment does return an observation. That merge comes later. It is not this paper.

WebGPT can act through a browser and asks for little explicit verbal reasoning. CoT is the opposite: reason without acting.

> **Huahua's engineering note**
>
> Do not read “the model wrote steps” as “the model called a tool.” The paper’s optional Python calculator runs `eval` on equations *after* generation. It is not an in-decoding API, and it is not a ReAct environment action.

## Walk one example through the method

The following is the teaching example in Figure 1, not an independent experimental result. The test item is: *The cafeteria had 23 apples. If they used 20 to make lunch and bought 6 more, how many apples do they have?* The correct answer is 9.

1. **Input:** Only that test question. No Wikipedia, no calculator API, no environment state. The few-shot prefix first shows a tennis-ball item: Roger has 5 balls and buys 2 cans of 3.
2. **Intermediate representation:** A standard exemplar is `Q: … A: The answer is 11.` A CoT exemplar inserts the highlighted steps before the answer: “Roger started with 5 balls. 2 cans of 3 tennis balls each is 6 tennis balls. 5 + 6 = 11. The answer is 11.” The actual math experiments use the **eight** demonstrations in Appendix Table 20 (AQuA is the exception: four multiple-choice solutions).
3. **Model or system decision:** The test question is appended to those exemplars and a frozen model is decoded with **greedy decoding**. The model must write intermediate sentences itself rather than answer first and explain later. No tool is invoked, and no observation is written back into context.
4. **Output:** Figure 1’s right-hand trace generates “23 originally, used 20, 3 left, bought 6, so 9.” The left-hand standard output is 27, marked wrong.
5. **Likely failure point:** Smaller models emit fluent but illogical chains and score worse than standard prompting (Table 2). Even a correct final answer does not guarantee a correct chain: among 50 GSM8K items that LaMDA 137B answered correctly, two reached the right number coincidentally (Section 3.2, Section D.1). Among 50 incorrect items, 46% were almost right except for a small slip (calculator, symbol mapping, one missing step) and 54% had major semantic or coherence errors (Section D.2).

The cafeteria item teaches **how the mechanism runs to completion**. To see scale lift the curve, go to Figure 4. To see whether “write the steps” is just extra tokens, go to Figure 5.

## Technical mechanism

There is no new loss. What changes is the few-shot triple.

In standard prompting, the $i$-th demonstration is $\langle x_i, y_i \rangle$: the question is glued to the answer. At test time the model is asked for $y_{\text{test}}$.

Chain-of-thought prompting expands the same demonstration to

$$
\langle x_i,\ r_i,\ y_i \rangle,
$$

where $r_i$ is a series of intermediate natural-language steps that lead to $y_i$. At test time the model first generates $\hat{r}$, then $\hat{y}$. Lengthening $r$ writes more intermediate computation as readable tokens; that can give a hard item more room, and it can also let a small model narrate an error until it looks finished. Drop $r$ and the method is standard prompting again. Move $r$ to **after** $y$, or replace $r$ with a string of dots as long as the equation, and Figure 5 shows almost no gain—so the extra text is not “any tokens.” It is **natural-language steps before the answer**.

Operational constraints:

- **Frozen models.** Section 6 is explicit: no finetuning was done while writing the paper. UL2, LaMDA, GPT-3 (`text-ada-001` through `text-davinci-002`), PaLM 8B / 62B / 540B, and Codex `code-davinci-002` are all off-the-shelf prompting.
- **Decoding.** The main tables are greedy. A parenthetical notes that later work can improve CoT by taking a majority over sampled generations (Wang et al., 2022a). That is self-consistency. It is **not** the setting of these tables, and this article does not borrow its numbers.
- **Exemplar count.** Math items share eight human-written CoT traces (Appendix Table 20); AQuA uses four training-set solutions (Table 21). The authors say those eight traces were not prompt-engineered; robustness is in Section 3.4 and Appendix A.2.
- **Optional post-hoc calculator.** Appendix B runs Python `eval` on equations in the generated chain after decoding, then substitutes the result into later equations. Table 1’s “+ ext. calc” column is that post-process. It is **not** an in-decoding tool call and it yields no environment observation.

Contrast with later control points: CoT does not expand the action space; a thought is not a legal next move that can interleave with environment actions. For that contract, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). For inserting APIs into the training distribution, read [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/).

![CoT Figure 1: standard prompting answers 27; with intermediate steps the model writes 23−20+6=9.](/paperReading/29-chain-of-thought-prompting/paper/figure-1-method.webp)

*Figure 1, paper Introduction / Section 2: the left exemplar is answer-only and the test item is answered 27; the right exemplar includes intermediate reasoning and the model produces a step-by-step calculation that yields 9. Locate the original at [Figure 1](https://arxiv.org/html/2201.11903v6#S0.F1); the PNG endpoint is [new-pull-figure-landscape.png](https://arxiv.org/html/2201.11903v6/new-pull-figure-landscape.png). From the arXiv HTML / matching asset; page marked CC BY 4.0.*

## How to read the evidence

The arithmetic, commonsense, and symbolic suites do not ask the same question. Arithmetic is multi-step word problems; commonsense is world knowledge and multi-hop strategy; symbolic tests whether an operation shown in the exemplars transfers to longer unseen inputs. Main decoding is greedy. LaMDA averages five seeds that shuffle exemplar order; the other models use one order to save compute.

### Table 1: 56.9 on GSM8K is prompting, not finetuning

This table asks: for a frozen model, if exemplars change from “answer directly” to “write steps first,” how does accuracy move on five math benchmarks? The model and (for free-response math) the same eight demonstrations are held fixed; what changes is whether $r$ is present.

| Model | Prompting | GSM8K | SVAMP | ASDiv | AQuA | MAWPS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Prior best (finetuning) | — | 55 | 57.4 | 75.3 | 37.9 | 88.4 |
| GPT-3 175B | Standard | 15.6 | 65.7 | 70.3 | 24.8 | 72.7 |
| | CoT | 46.9 | 68.9 | 71.3 | 35.8 | 87.1 |
| Codex | Standard | 19.7 | 69.9 | 74.0 | 29.5 | 78.7 |
| | CoT | 63.1 | 76.4 | 80.4 | 45.3 | 92.6 |
| PaLM 540B | Standard | 17.9 | 69.4 | 72.1 | 25.2 | 79.2 |
| | CoT | 56.9 | 79.0 | 73.9 | 35.8 | 93.3 |

Observation: on GSM8K, PaLM 540B moves from 17.9 to 56.9 (+39.0), above Cobbe et al.’s prior best of 55 and above Figure 2’s finetuned GPT-3 175B bar of 33. Figure 2 rounds 56.9 to 57. CoT also exceeds the then-supervised best on SVAMP and MAWPS; the authors note that standard prompting had already passed the prior best on SVAMP. On ASDiv and AQuA, PaLM CoT lands within two points of then-SOTA (73.9 vs 75.3; 35.8 vs 37.9).

Codex CoT’s GSM8K 63.1 is **higher** than PaLM’s 56.9. That row is `code-davinci-002`, added in v5. The abstract still headlines PaLM 540B with eight exemplars against finetuned GPT-3 + verifier. Do not write 63.1 back into that sentence.

The post-hoc calculator lifts PaLM GSM8K only from 56.9 to 58.6. It helps more on smaller UL2 / LaMDA runs. That supports “GSM8K’s bottleneck is closer to semantic decomposition than to the last addition.”

The table **cannot** support a 2026 GSM8K SOTA, and it **cannot** make Codex 63.1 the official abstract protagonist.

### Figure 4 / Table 2: the gain appears only at scale

These plots ask: does the curve rise smoothly, or do small models simply not have CoT? Prompt format is held fixed; parameter count changes.

Table 2’s diagnostic slices: LaMDA 420M on GSM8K drops from 2.6 to 0.4; GPT 6.7B drops from 4.0 to 2.4; PaLM 8B goes from 4.9 to 4.1. PaLM 62B is the first clear lift (9.6 → 29.9); 540B is 17.9 → 56.9. The authors place positive gains around 100B parameters and qualitatively observe that smaller models produce **fluent but illogical** chains.

Table 3 splits MAWPS. On SingleOp, PaLM 540B is 94.1 for both standard and CoT; on AddSub it even falls from 93.9 to 91.9. The large move is MultiArith: 42.2 → 94.7. That supports “when the item is already easy and the curve is already high, CoT has little headroom.”

This suite **supports** “CoT is not a bonus at every scale.” It does **not** support treating 100B as a law for today’s small models—pretraining data and post-training have changed—but that is extrapolation, not a cell in these tables.

![CoT Figure 4: on GSM8K / SVAMP / MAWPS, CoT only clearly beats standard prompting at the largest LaMDA, GPT, and PaLM scales.](/paperReading/29-chain-of-thought-prompting/paper/figure-4-scaling.webp)

*Figure 4, paper Section 3.2: columns are LaMDA / GPT / PaLM; rows are GSM8K / SVAMP / MAWPS. Filled markers are standard prompting, open markers are CoT, dashed lines are then-supervised best. Locate the original at [Figure 4](https://arxiv.org/html/2201.11903v6#S3.F4). From the arXiv v6 PDF / HTML; page marked CC BY 4.0.*

### Figure 5 / Table 6: not extra compute, and not explain-after-answer

The ablation asks: if the model only emits an equation, only emits a string of dots as long as that equation, or places the reasoning after the answer, does the same gain appear? Models are LaMDA 137B and PaLM 540B; the task is GSM8K.

In Figure 5, the first four bars on LaMDA all sit near 6%. On PaLM, equation-only rises slightly while dots and reasoning-after-answer remain near standard 17.9. Only CoT lifts PaLM to about 57. Table 6 reports LaMDA 137B with five exemplar-order seeds: standard 6.5±0.4, CoT 14.3±0.4, equation-only 5.4±0.2, variable compute 6.4±0.3, reasoning after answer 6.1±0.4.

The authors’ reading: GSM8K semantics cannot be translated into one equation in a single hop (Appendix A.4’s ping-pong item: equation-only yields 6, CoT yields 9). The dots condition rules out “just extra tokens.” Reasoning after the answer rules out “just activating pretrained knowledge.”

This **supports** “natural-language steps before the answer” as the mechanism, not decoration. It does **not** support “every intermediate sentence faithfully reflects internal computation”—the paper leaves that as an open question.

![CoT Figure 5: on GSM8K, equation-only, dummy compute, and reasoning-after-answer stay near standard prompting; only CoT lifts PaLM 540B.](/paperReading/29-chain-of-thought-prompting/paper/figure-5-ablation.webp)

*Figure 5, paper Section 3.3: LaMDA 137B on the left, PaLM 540B on the right. Other datasets are in Appendix Tables 6 and 7. Locate the original at [Figure 5](https://arxiv.org/html/2201.11903v6#S3.F5). From the arXiv v6 PDF / HTML; page marked CC BY 4.0.*

### Table 4: commonsense is not a blanket win

Figure 7 / Table 4 ask whether language-shaped intermediate steps transfer to commonsense. PaLM 540B, standard → CoT:

| Task | Standard | CoT |
| --- | ---: | ---: |
| CSQA | 78.1 | 79.9 |
| StrategyQA | 68.6 | 77.8 |
| Date understanding | 49.0 | 65.3 |
| Sports understanding | 80.5 | 95.4 |
| SayCan | 80.8 | 91.7 |

Section 4’s prose reports StrategyQA as 75.6% versus a then-leaderboard single-model 69.4% (as of 2022-05-05), and sports understanding as 95.4% versus an unaided sports enthusiast at 84%. Appendix Table 4 lists PaLM 540B CoT at 77.8. This article uses Table 4 for model numbers and treats 75.6 / 69.4 as the authors’ prior-SOTA comparison, not a second official PaLM cell. CSQA barely moves (78.1 → 79.9); the authors say the gain was minimal.

On GPT-3 175B, CoT **drops** CSQA (79.5 → 73.5) and is essentially flat on StrategyQA (65.9 → 65.4). Appendix A.2 records as a limitation that the same prompts do not help every model equally.

BIG-bench Date / Sports have no training split: the authors take the first ten evaluation items as exemplars and score the rest. The protocol is repeatable, and it is also a threat to “never saw the evaluation distribution.”

### Table 5: in-domain symbolic tasks copy a structure; OOD tests length

Last-letter concatenation and coin flip are toy tasks: the in-domain solution structure is already in the exemplars. PaLM 540B CoT is nearly perfect on two-word names and two-flip stories (99.4 / 100.0). OOD lengthens to four: last-letter standard stays at 0.0 while CoT reaches 63.0; coin-flip standard is 54.8 and CoT 90.2. Small models fail even in-domain.

That supports “a large enough model can copy an operation shown in the prompt onto a longer input.” It does **not** support reading 100% as general symbolic competence: the authors call these toy tasks.

## Limitations and threats to validity

Section 6 already lists four limits: emitting human-like steps does not prove the network is “reasoning”; few-shot annotation is cheap, but finetuning still might not be; reasoning paths are not guaranteed correct, and a right answer can come from a wrong chain; the ability mainly appears in large models, which are expensive to serve.

Several more boundaries appear when the tables are read as engineering evidence:

1. **No environment.** There is no search, no browser, and no observation. CoT is not [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/).
2. **No tool learning.** Post-hoc `eval` is not Toolformer’s training-time API insert.
3. **No memory paging.** The whole chain stays in one prompt.
4. **Scale-dependent, and sometimes negative.** Table 2’s small models, Table 3’s SingleOp, and Table 4’s GPT-3 CSQA are not “add CoT and the score rises.”
5. **Exemplars still matter.** Most variants beat the baseline, but on coin flip Annotator A is 99.6 and Annotator C is 71.4 (Table 7); one co-author could write a CoT that reverses a five-item list and two others could not (Appendix A.2).
6. **The headline models are not generally rerunnable.** PaLM and LaMDA weights are not public. What is public is a then-current GPT-3 API setup (many of those engines are gone) and supplementary inputs / outputs.
7. **Do not back-fill later papers.** Self-consistency appears only as a later leaf; o1, o3, DeepSeek-R1, and 2025–26 GSM8K scores do not belong in these tables.

## Engineering decision and when not to use it

When is CoT worth borrowing? When the task is multi-step, the model is large enough, you need a readable intermediate trace, and you **do not** need to touch the outside world. In that case, log “steps” and “final answer” as separate fields, and spot-check whether correct answers came from coincidental chains.

When should this paper not be used as a construction drawing?

- If the next move must look up documents, change an environment, or wait for an observation, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). CoT has no such loop.
- If the question is whether training should insert one API call, read [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/).
- If the model is small, or the item is already one-step arithmetic: Tables 2 and 3 show CoT can hurt or have no headroom.
- If you need the intermediate sentence to match internal computation: the paper leaves that open and it is not a safety audit.
- If you want a majority over many samples: that is later self-consistency, not this paper’s greedy main table.

> **Huahua's take**
>
> Leave CoT in the “reason only” column. ReAct is what sews thought into a trajectory that can touch the world. Later leaves grow from that seam; they do not promote CoT into a runtime.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** the [arXiv abs](https://arxiv.org/abs/2201.11903), [v6 PDF](https://arxiv.org/pdf/2201.11903v6), and [HTML](https://arxiv.org/html/2201.11903v6) are readable under CC BY 4.0. The [NeurIPS 2022 abstract page](https://proceedings.neurips.cc/paper_files/paper/2022/hash/9d5609613524ecf4f15af0f7b31abca4-Abstract-Conference.html) opens; the matching Supplemental zip returns 404.
- **Code and supplement:** [jasonwei20/chain-of-thought-prompting](https://github.com/jasonwei20/chain-of-thought-prompting) is reachable (created the same day as v1). Visible files include `chain-of-thought-zip.zip` (LaMDA 137B and GPT-3 `text-davinci-002` inputs / targets / predictions, plus SayCan outputs) and `LICENSE_COINFLIP_LAST_LETTER` (MIT / Copyright 2021 Google, applying only to the synthetic coin-flip and last-letter sets). This is not PaLM training code and not an official runtime.
- **Models:** PaLM and LaMDA are **not** generally downloadable checkpoints. The paper’s Reproducibility Statement already said the main experiments are therefore hard to reproduce fully. GPT-3 public-API runs were reproducible at the time; `text-davinci-002` is no longer a default public engine.
- **Data:** GSM8K, SVAMP, ASDiv, AQuA, MAWPS, CSQA, StrategyQA, BIG-bench Date / Sports, and SayCan each have upstream pages (Appendix E.3). The synthetic symbolic sets are in the supplement.

The smallest useful reproduction is: take the eight math exemplars in Appendix Table 20, run a frozen model on a handful of GSM8K items, and check that the output contains intermediate steps and that no external API is called. Do not claim that this reproduces Table 1’s PaLM 540B 56.9.

## Three things to remember

1. **Technical idea:** CoT changes few-shot demonstrations from $\langle x, y \rangle$ to $\langle x, r, y \rangle$; the control point is whether intermediate steps are written before the answer, not weights, tools, or an environment.
2. **Evidence:** PaLM 540B on GSM8K moves from 17.9 to 56.9, and the ablation shows extra tokens or explain-after-answer are not enough; positive gains stabilize mainly at the largest models.
3. **Boundary:** This is a frozen prompt. Small models can get worse; chains can be unfaithful; there is no observation. When you need acting, read ReAct, and do not write later reasoning-model scores back into these tables.

## Further reading

CoT asks whether the prompt should write the reasoning. If the next question is whether thought and environment actions should interleave, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). If the question is whether training should insert one API call, read [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/). For the spine that places this note before ReAct, read the [Agent foundations reading map](/en/blog/91-agent-method-foundation-reading-map/). For the reading method, see the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/).

## Primary sources

- [Wei et al., “Chain-of-Thought Prompting Elicits Reasoning in Large Language Models,” NeurIPS 2022 / arXiv:2201.11903 v6](https://arxiv.org/abs/2201.11903)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2201.11903v6)
- [NeurIPS 2022 abstract page](https://proceedings.neurips.cc/paper_files/paper/2022/hash/9d5609613524ecf4f15af0f7b31abca4-Abstract-Conference.html)
- [Author supplementary traces (LaMDA / GPT-3 outputs; not a PaLM runtime)](https://github.com/jasonwei20/chain-of-thought-prompting)
