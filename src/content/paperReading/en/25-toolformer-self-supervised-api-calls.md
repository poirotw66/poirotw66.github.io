---
title: "Toolformer: Self-Supervised API Calls Are Not an Agent Loop"
description: "A source-grounded reading of Schick et al., NeurIPS 2023: future-token loss filters QA, Wikipedia, calculator, calendar, and translation calls on CCNet for GPT-J. LAMA and math jump; this is still not a chainable agent runtime."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "Toolformer treats tool use as a language-modeling filter: a handful of API demonstrations, candidate calls sampled over CCNet, keep only calls that reduce future-token loss versus no call or a call without a result, then finetune GPT-J 6.7B."
  - "On LAMA (lenient first-five-words): SQuAD 33.8 versus GPT-J 17.8, Google-RE 11.5 versus 4.9, T-REx 53.5 versus 31.9, with the QA tool used on about 98.1% of examples. On math (first number): ASDiv 40.4 versus 7.5, SVAMP 29.4 versus 5.2, MAWPS 44.0 versus 9.9, with the calculator used on 97.9%."
  - "With the QA tool disabled, Wikipedia search still trails GPT-3: WebQS 26.3 versus 29.0, NQ 17.7 versus 22.6, TriviaQA 48.8 versus 65.9. The authors state they cannot chain tools, cannot browse search results, are wording-sensitive, evaluate at most one API call, are sample-inefficient for the calculator, and do not account for tool cost."
audience:
  - "AI engineers putting function-calling or tool-use data into training, rather than only demonstrating a ReAct loop in the prompt."
  - "Technical leads who need to separate Toolformer, ReAct, and MidTool into a training filter, a prompting loop, and a mid-training prior, instead of one agent framework name."
tags: ["Paper Reading", "Agent Systems", "Tool Use", "Training"]
image: "/paperReading/25-toolformer-self-supervised-api-calls/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - tool-use-coding-agents
  - agent-evaluation-observability
paper:
  title: "Toolformer: Language Models Can Teach Themselves to Use Tools"
  authors:
    - "Timo Schick"
    - "Jane Dwivedi-Yu"
    - "Roberto Dessì"
    - "Roberta Raileanu"
    - "Maria Lomeli"
    - "Eric Hambro"
    - "Luke Zettlemoyer"
    - "Nicola Cancedda"
    - "Thomas Scialom"
  year: 2023
  venue: "NeurIPS 2023（arXiv 2302.04761 v1）"
  links:
    pdf: "https://arxiv.org/pdf/2302.04761v1"
    arxiv: "https://arxiv.org/abs/2302.04761"
    doi: "https://doi.org/10.48550/arXiv.2302.04761"
    project: "https://ai.meta.com/research/publications/toolformer-language-models-can-teach-themselves-to-use-tools/"
series:
  id: "toolformer-self-supervised-tool-use"
  title: "Toolformer Deep Dive"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Language models are weak at arithmetic, factual lookup, low-resource languages, and time awareness compared with much smaller specialized systems. Tool use at the time either needed large human annotation budgets or was tied to task-specific few-shot prompts that already knew which tool to call.
- **Core insight:** Insert API calls into next-token prediction. A handful of human demonstrations only teach the call format. Whether a sampled call is kept is decided by whether the call plus its result reduces future-token loss. The changed control point is not a thought–action loop; it is **when a single API call is written into the language-modeling string**.
- **Strongest evidence:** Same GPT-J 6.7B, zero-shot. LAMA SQuAD / Google-RE / T-REx rise from 17.8 / 4.9 / 31.9 to 33.8 / 11.5 / 53.5 and beat OPT-66B and GPT-3-175B. Math ASDiv / SVAMP / MAWPS rise from 7.5 / 5.2 / 9.9 to 40.4 / 29.4 / 44.0. The QA tool and calculator are selected on about 98.1% and 97.9% of examples.
- **Main boundary:** With the QA tool off, Wikipedia search still trails GPT-3. The authors cannot chain tools, cannot browse search results interactively, are wording-sensitive, evaluate at most one API call, get few calculator examples, and ignore tool cost. This is not a production agent runtime.

My bounded verdict is: **what is worth keeping from Toolformer is a training contract that uses language-model loss as tool supervision; what is not worth keeping is the habit of calling a next-token API insertion today’s agent loop.**

> **Huahua in one sentence**
>
> A useful tool call is the one that makes the next few tokens easier to predict, not the one that makes the model look as if it is “acting.”

## Version and reading scope

This article reads the NeurIPS 2023 paper by [Schick et al.](https://proceedings.neurips.cc/paper_files/paper/2023/hash/d842425e4bf79ba039352da0f658a906-Abstract-Conference.html) in the [arXiv:2302.04761 v1](https://arxiv.org/abs/2302.04761) snapshot (submitted 2023-02-09; only this arXiv version exists). Beyond the abstract, I checked sampling / execution / filtering / finetuning in Section 2, the five tools in Section 3, LAMA / math / QA / MLQA / temporal / perplexity / scaling in Section 4, decoding $k$ and Table 10 in Section 5, the limitations in Section 7, and Appendix A–D. As of **2026-08-27**, the [arXiv HTML](https://arxiv.org/html/2302.04761v1) and [NeurIPS PDF](https://proceedings.neurips.cc/paper_files/paper/2023/file/d842425e4bf79ba039352da0f658a906-Paper-Conference.pdf) are readable; the [Meta research page](https://ai.meta.com/research/publications/toolformer-language-models-can-teach-themselves-to-use-tools/) loads, but there is no official code. `https://github.com/facebookresearch/toolformer` returns 404.

This is a published NeurIPS paper, not a preprint. The arXiv v1 author list has eight names; the NeurIPS proceedings add Eric Hambro. Numbers below follow arXiv v1 and were cross-checked against the combined LAMA / math row in the NeurIPS tables. The paper is also not a runtime specification.

## The question a reader should actually answer

When a language model cannot do arithmetic and hallucinates facts, should the first move be a multi-step agent that searches, reformulates queries, and chains tools? Toolformer’s answer is narrower: first ask **whether the next tokens need a single API result**.

The precise reading is not “is Toolformer stronger than GPT-3,” because Table 5 says it is not on open-domain QA. The real question is: **once tool use moves from “a human already showed how this task should call a tool” to “the language model filters calls with future loss,” where can a 6.7B model catch larger models on single-call tasks, and where does it stop because it cannot chain, cannot browse search hits, or is evaluated with at most one call?**

## Evidence map

| Layer | Wording used in this article |
| --- | --- |
| **Paper directly supports** | Section 2 filters API calls with $L_i^{-}-L_i^{+}\ge\tau_f$; Tables 3–8 report zero-shot numbers for GPT-J / GPT-J+CC / Toolformer / disabled / OPT-66B / GPT-3-175B; Figure 4 shows API use becoming useful around 775M; Section 7 lists no chaining, no interactive search, wording sensitivity, few calculator examples, and no tool-cost term. |
| **Author claims** | Self-supervised tool use does not need large human annotation budgets and need not be tied to a task; learning tools need not sacrifice language-modeling ability. |
| **Not established** | Next-token tool use is not a deployable agent runtime; a single API insertion is not ReAct’s multi-step thought–action–observation loop; there is no official training code or GPT-J+CCNet $\mathcal{C}^{*}$ with which to rerun Table 3. |
| **Bloss0m engineering judgment** | Read Toolformer as a training-side tool-supervision contract: the ancestor of MidTool and the prompting cousin of ReAct. Do not treat “the model can emit `[QA(...)]`” as tool governance. |

The rest of the article keeps reported numbers, author claims, and engineering judgment in separate buckets. “Improvement” refers only to the paper’s setup.

## Why the previous approach is insufficient

Section 1 draws two 2022 lines clearly.

**Heavily annotated tool use.** Work such as BlenderBot, LaMDA, and WebGPT can search or browse, but it depends on expensive human demonstrations. The authors add a sharper point: a call that looks useful to a person need not be the call the model needs in order to predict the next token.

**Task-locked few-shot tool use.** PAL, TALM, and contemporaneous [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/) (cited in Related Work as Yao et al., 2022) usually already know that the item wants a calculator, a search engine, or Wikipedia’s three actions, then demonstrate that use in the prompt. That setup does not ask whether the model can decide when and which tool to use, and it does not put tool use back onto the original language-modeling distribution.

The prior approach is insufficient not because “the model is too small,” but because **the supervision was attached in the wrong place**: it either came from humans or from a task prompt that already knew the answer shape. Toolformer changes exactly that control point. Demonstrations teach API syntax; keeping a call is decided by future-token loss.

## Core intuition

Skip the notation for a moment. Imagine completing the sentence “The Nile has an approximate length of _____ kilometers.” You can guess a number, or you can ask a book that looks up facts. Toolformer’s rule is harsh: the lookup stays only if the book’s answer actually makes “6,853” easier to write next. If you ask which countries the Nile runs through, a correct answer still does not help complete the length, so that call is discarded.

This is not ReAct. ReAct’s next legal move can be a thought (context only) or an environment action (an observation), and it can run for many steps. Toolformer’s next move is still the next token; an API call is only a special substring inserted into that token sequence. The environment is not a browsable agent world. It is one function call.

Against later notes on this site:

- [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/) changes **which next move is legal inside a prompt**.
- Toolformer changes **whether a single API call is inserted into the training string**.
- [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/) moves tool affordances earlier into mid-training data. It inherits “teach tool use on the training side,” not Toolformer’s one-shot loss filter itself.

> **Huahua's engineering note**
>
> The evaluation allows at most one API call per input, and training calls are sampled independently. If a product needs “look up the date, then ask QA with that date,” or “rewrite the query when search is useless,” that workflow has already left this method. Do not pretend Table 3 covers it.

## Walk one example through the method

The walkthrough joins Figure 2’s Pittsburgh schematic with Table 10’s Nile filter score. Pittsburgh is the paper’s own method figure; Nile is a kept CCNet-style example. Neither is an independent experimental score.

1. **Input:** ordinary language-model text, such as `Pittsburgh is also known as the Steel City`, or Table 10’s `The Nile has an approximate length of 6,853 kilometers...`. There is still no tool and no agent state. The corpus is a CCNet subset; some tools first apply heuristics (at least three numbers, strings such as `equals`) so annotation does not run on every document.
2. **Intermediate representation:** a handful of human-written prompts $P(\mathbf{x})$ (Figure 3 / Appendix A.2) make the same GPT-J estimate, at each position $i$, whether an API call should start there. Positions above $\tau_s$ keep at most $k=5$ spots, and each spot samples at most $m=5$ candidates. In the Pittsburgh sketch, one candidate asks what else Pittsburgh is called; another asks which country it is in.
3. **Model or system decision:** execute the APIs. QA uses Atlas (Atlas-large while labeling, Atlas-xxl at inference, finetuned on Natural Questions); the calculator is Python with only `+ - * /`; Wikipedia is BM25 over the KILT dump; translation is NLLB-600M; the calendar approximates document creation time from the URL during training. Then compare two losses: $L_i^{+}$ is the weighted cross-entropy of future tokens when $e(c,r)$ (the call **and** the result) is given as a prefix; $L_i^{-}$ is the minimum of “no call at all” and “call but no result.” Keep the call only if $L_i^{-}-L_i^{+}\ge\tau_f$. In Figure 2, the “Steel City” call stays and the “United States” call is dropped, because the latter does not help predict `the Steel City`. In Table 10, the Nile QA scores $2.08$ and is marked useful; `Calculator(85 / 23)` scores $-0.02$ and is marked useless—the sentence “23% were hospitalised” is not asking for 85÷23.
4. **Output:** kept calls are written back into the original sentence, yielding $\mathbf{x}^{*}$. Merging them produces $\mathcal{C}^{*}$, and GPT-J is finetuned with a standard language-modeling objective. At inference, decoding runs until the model emits `→` (implemented as `->`); generation pauses, the API is called, and the result plus the closing token are inserted before decoding continues. Evaluation additionally treats the start-of-call token as allowed among the top $k=10$ tokens, and allows **at most one API call per input**, so the model does not loop on calls without writing an answer.
5. **Likely failure point:** a wrong question can still pass the filter (Table 10’s `WikiSearch(Fast train success)` scores $0.92$, labeled useless, yet still lowered perplexity); calendar-then-QA items never appear in training (the calendar is used on 0.2% of TempLAMA); a bad search hit cannot be reformulated. Section 7 also says the model is sensitive to exact wording.

The same Table 10 shows that high scores usually look “intuitively useful,” while low scores usually add nothing for future tokens. The authors argue that a little noise left in $\mathcal{C}^{*}$ can stop the finetuned model from blindly obeying every call.

## Technical mechanism

Section 2 writes each API call as $c=(a_c,i_c)$: $a_c$ is the tool name and $i_c$ is the string input. Linearization does not grow the vocabulary; existing tokens stand in for special markers:

$$
e(c)=\texttt{[}\,a_c\texttt{(}i_c\texttt{)}\,\texttt{]},\qquad e(c,r)=\texttt{[}\,a_c\texttt{(}i_c\texttt{)}\rightarrow r\,\texttt{]}.
$$

In the implementation, the three markers are `[`, `]`, and `->`. Inserting a call into text therefore does not require new tokens.

For $\mathbf{x}=x_1,\ldots,x_n$, the model first computes $p_i=p_M(\texttt{[}\mid P(\mathbf{x}),x_{1:i-1})$, then samples, executes, and filters. The filter is a weighted future loss:

$$
L_i(\mathbf{z})=-\sum_{j=i}^{n}w_{j-i}\cdot\log p_M(x_j\mid\mathbf{z},x_{1:j-1}),
$$

$$
w_t=\frac{\tilde{w}_t}{\sum_s\tilde{w}_s},\qquad \tilde{w}_t=\max(0,1-0.2\cdot t).
$$

The weight hits zero after about five tokens, forcing calls to occur near where the information is actually used. $L_i^{+}$ uses $e(c_i,r_i)$ as a **prefix** rather than a mid-sentence insertion, because an unfinetuned $M$ that sees a never-before-seen API string in the middle of $\mathbf{x}$ would leave the pretraining distribution and hurt perplexity. $L_i^{-}$ takes the min of an empty prefix and a call without a result, so calls that merely like API syntax without using the result are dropped.

$\tau_s$ and $\tau_f$ are set per tool. Defaults are $\tau_s=0.05$ and $\tau_f=1.0$; the calculator and translation tools, after heuristic filtering leaves little data, use $\tau_s=0$, $k=20$, $m=10$, and $\tau_f=0.5$. Table 2 at $\tau_f=1.0$: QA 18,526, Wikipedia 60,974, calculator 994, calendar 20,587, translation 1,034. The calculator count is tiny, matching Section 7’s sample-inefficiency. Appendix B: at most 25k examples per API, so Wikipedia / calendar are subsampled; batch size 128, learning rate $1\cdot 10^{-5}$, sequence length 1,024, up to 2k steps; 8×A100 40GB, BF16, DeepSpeed ZeRO-3.

All five tools (Table 1 / Section 3) are text-in, text-out:

| API | What it does | What it cannot do |
| --- | --- | --- |
| QA (Atlas) | Answer simple factoids | LAMA disables Wikipedia search; downstream QA disables QA itself so Atlas’s NQ finetuning does not make the task trivial |
| Wikipedia Search (BM25 / KILT) | Return a short snippet the model must read | Not a dense retriever; cannot turn the page |
| Calculator | Four arithmetic ops, rounded to two decimals | Invalid equations return nothing |
| Calendar | No input; returns today’s date | Training approximates the date from the URL; the date cannot be fed into another tool |
| MT (NLLB) | Any language → English | The target language is always English |

Toolformer at inference is not a chat runtime: it only inserts a result when generation hits `->`. Evaluation adds two knobs—top-10 encouragement to call, and at most one call per item—and Section 5 / Table 9 show those knobs are not minor.

![Toolformer Figure 1: the model inserts QA, calculator, translation, and Wikipedia calls while completing text.](/paperReading/25-toolformer-self-supervised-api-calls/paper/figure-1-method.webp)

*Figure 1, paper Section 1: top to bottom, QA, calculator, machine translation, and Wikipedia search. The figure teaches what an API looks like inside a next-token string; it is not a benchmark score. Locate the original at [Figure 1](https://arxiv.org/html/2302.04761v1#S1.F1); the SVG endpoint is [example.svg](https://arxiv.org/html/2302.04761v1/example.svg). From the arXiv HTML page, marked with the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/); used with attribution under the [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

![Toolformer Figure 2: sample, execute, then filter API calls with future-token loss, illustrated for QA.](/paperReading/25-toolformer-self-supervised-api-calls/paper/figure-2-pipeline.webp)

*Figure 2, paper Section 1: for the same sentence `Pittsburgh is also known as the Steel City`, the call that asks for the nickname is kept and the call that asks for the country is dropped. Locate the original at [Figure 2](https://arxiv.org/html/2302.04761v1#S1.F2); the SVG is [approach.svg](https://arxiv.org/html/2302.04761v1/approach.svg). From the arXiv HTML page, marked with the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/); used with attribution under the [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

## How to read the evidence

The shared protocol in Section 4.2 matters more than any one score. Every task is **prompted zero-shot**: a natural-language instruction, and **no** in-context demonstration of how that task should call a tool. That is a harder setup than PAL- or ReAct-style few-shot tool use. Main decoding is greedy, but Toolformer allows the start-of-call token among the top 10, and at most one API call per item. Metrics are intentionally lenient: LAMA checks whether the correct word appears in the first five predicted words; math checks the first number (or the first number after `=` if the model emits an equation); open QA checks whether the first 20 words contain the answer. GPT-3 is original `davinci`, not an instruction-tuned variant.

The controlled GPT-J family is: vanilla GPT-J, GPT-J finetuned on $\mathcal{C}$ without APIs, Toolformer finetuned on $\mathcal{C}^{*}$, the same Toolformer weights with APIs disabled at decoding, plus OPT-66B and GPT-3-175B, which are about 10× and 25× larger.

### Table 3: on LAMA, one QA call lets 6.7B beat 175B

This table asks: when completing Wikipedia-style statements, and when Wikipedia search is disabled, can a self-supervised QA call beat parameter memory alone? The GPT-J family and the zero-shot instruction stay fixed; what changes is whether an Atlas result is inserted. LAMA was built for masked LMs, so examples where the mask is not the final token are dropped.

| Model | SQuAD | Google-RE | T-REx |
| --- | ---: | ---: | ---: |
| GPT-J | 17.8 | 4.9 | 31.9 |
| GPT-J + CC | 19.2 | 5.6 | 33.2 |
| Toolformer (disabled) | 22.1 | 6.3 | 34.9 |
| Toolformer | 33.8 | 11.5 | 53.5 |
| OPT (66B) | 21.6 | 2.9 | 30.1 |
| GPT-3 (175B) | 26.8 | 7.0 | 39.8 |

The three tool-free GPT-J rows are similar. Toolformer is 11.7 / 5.2 / 18.6 points above the best same-size baseline, and above OPT and GPT-3. The authors say the QA tool is used on 98.1% of examples, another tool on 0.7%, and no tool on 1.2%. Disabled is slightly above GPT-J+CC, so finetuning on API text helps memory a little; the main effect is actually calling.

The table **supports** “a single factoid QA insertion can let a small model beat larger tool-free models on LAMA’s lenient metric.” It **does not support** “Toolformer is already a better knowledge base”: the metric is first-five-word hit, Wikipedia search is off, and Atlas is itself another retrieval-augmented model.

### Table 4: on math, the calculator is almost always invoked

This asks whether four-function arithmetic can close GPT-J’s arithmetic gap on zero-shot word problems. The metric is the first number, not a full reasoning trace.

| Model | ASDiv | SVAMP | MAWPS |
| --- | ---: | ---: | ---: |
| GPT-J | 7.5 | 5.2 | 9.9 |
| GPT-J + CC | 9.6 | 5.0 | 9.3 |
| Toolformer (disabled) | 14.8 | 6.3 | 15.0 |
| Toolformer | 40.4 | 29.4 | 44.0 |
| OPT (66B) | 6.0 | 4.9 | 7.9 |
| GPT-3 (175B) | 14.0 | 10.0 | 19.8 |

Allowing API calls more than doubles every column, and 97.9% of examples call the calculator. Disabled already beats GPT-J; the authors guess that finetuning on many expression→result pairs helps. This **supports** “inserting a calculator into next-token prediction helps on these three benchmarks.” It **does not support** “mathematical reasoning is solved”: there is no multi-step program, no unit-conversion tool, and the calculator API is only four operations.

### Table 5: open QA is the negative result the authors keep

This asks whether a 6.7B model can catch GPT-3 when QA is disabled and only Wikipedia BM25 is allowed. QA is disabled because Atlas was finetuned on Natural Questions; otherwise NQ would become trivial.

| Model | WebQS | NQ | TriviaQA |
| --- | ---: | ---: | ---: |
| GPT-J | 18.5 | 12.8 | 43.9 |
| GPT-J + CC | 18.4 | 12.2 | 45.6 |
| Toolformer (disabled) | 18.9 | 12.6 | 46.7 |
| Toolformer | 26.3 | 17.7 | 48.8 |
| OPT (66B) | 18.6 | 11.4 | 45.7 |
| GPT-3 (175B) | 29.0 | 22.6 | 65.9 |

Toolformer beats every GPT-J row and uses Wikipedia search on 99.3% of examples, but remains below GPT-3 at 29.0 / 22.6 / 65.9. The authors name two causes: BM25 often returns a poor match, and the model cannot interact—it cannot reformulate the query or page through top hits. That is Section 7’s boundary, not a table footnote.

The table **supports** “a single Wikipedia snippet helps same-size models.” It **does not support** “Toolformer already beats large LMs at open QA,” and it **does not support** wiring this loop to a modern search agent.

### Tables 6–8 and Figure 4: translation helps, the calendar cannot chain, perplexity does not degrade, and the ability appears around 775M

On MLQA (Table 6), the translation tool is used on 63.8%–94.9% of examples for most languages (only 7.3% for Hindi), and APIs beat disabled; but CCNet finetuning itself hurts some languages, so Toolformer **does not consistently beat** vanilla GPT-J. OPT and GPT-3 are surprisingly weak; the authors observe they often fail to answer in English as instructed.

On temporal tasks (Table 7), Dateset is the calendar’s evidence: the tool is used on 54.8% of examples, 27.3 versus GPT-J 3.9. TempLAMA is 16.3 versus GPT-J 13.7, but the calendar is used on 0.2% of examples; Wikipedia / QA do the work. “Look up today, then ask who plays for which club” would need chaining, and training samples calls independently while evaluation allows only one call.

On language modeling (Table 8), with APIs disabled, WikiText / CCNet perplexity matches GPT-J+CC at 10.3 / 10.5. Learning tools does not degrade core LM ability. The authors do not report perplexity with APIs enabled, because that would require marginalizing over every possible call.

![Toolformer Figure 4: average performance for GPT-2 scales and GPT-J with and without API calls.](/paperReading/25-toolformer-self-supervised-api-calls/paper/figure-4-scaling.webp)

*Figure 4, paper Section 4.4: averages are taken over LAMA, the math benchmarks, and the QA benchmarks. APIs barely help the smallest models and start to matter around 775M; even at GPT-J the gap with versus without APIs stays large. Wikipedia search is the exception; the authors treat that API as easier to use. Locate the original at [Figure 4](https://arxiv.org/html/2302.04761v1#S4.F4); the SVG is [scaling_laws.svg](https://arxiv.org/html/2302.04761v1/scaling_laws.svg). From the arXiv HTML page, marked with the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/); used with attribution under the [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

### Table 9: headline numbers depend on $k=10$, not pure greedy decoding

On T-REx, $k=1$ (true greedy) already rises from 34.9 to 47.8 with a 40.3% call rate; $k=10$ reaches 53.5 with a 98.1% call rate. On WebQS, $k=1$ almost never calls (8.5%, overall 19.3, close to disabled 18.9); $k=3$ jumps to 26.3 (99.3% calls), matching $k=10$ at 26.3 / 100%. At $k=1$ the model is somewhat calibrated: the no-call subset (44.3 / 19.9) beats fully disabled APIs (34.9 / 18.9). That calibration disappears as $k$ grows.

So the “almost always uses a tool” rates in Tables 3 and 5 are produced by the decoding knob together with the filter, not by greedy decoding alone.

## Limitations and threats to validity

Section 7 is already an engineering checklist:

1. **No tool chaining.** Calls for each API are sampled independently, so $\mathcal{C}^{*}$ has no examples of feeding one tool’s output into another.
2. **No interactive search.** The model cannot browse hundreds of hits or reformulate a query the way WebGPT can.
3. **Wording sensitivity.** Whether a call happens often depends on exact phrasing.
4. **At most one API call per evaluation input.** That avoids loops; it is not a product limit, and it also means Tables 3–5 do not represent multi-step tool use.
5. **The calculator is sample-inefficient.** Processing more than a million documents yields only a few thousand useful calls.
6. **No tool-cost term.** The decision to call ignores latency, billing, and side effects.

Several more boundaries appear when the tables are read as engineering evidence:

- Beating GPT-3 on LAMA and math uses lenient metrics and near-always invoking a specialized tool; the same method loses to GPT-3 on open QA.
- Atlas and NLLB are external models. Toolformer learns **when to call them**, not how to internalize retrieval or translation.
- Figure 4’s 775M threshold is measured on the GPT-2 family with only QA, calculator, and Wikipedia.
- There is no official $\mathcal{C}^{*}$ and no official training script. Third-party GitHub implementations do not replace Table 3.

## Engineering decision and when not to use it

When is Toolformer worth borrowing? When you already have text-in, text-out tools, and the missing piece is **supervision for when to insert one result**, not multi-step planning. In that case, log the candidate call, whether it was kept, whether it passed $L_i^{-}-L_i^{+}$, and how many calls inference is allowed. Sensible prototypes are a calculator, an exchange-rate lookup, or a single document lookup—one result that changes the next few tokens.

When should this paper not be used as a construction drawing?

- If you need multi-step thought–action–observation, query reformulation, or exception handling, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). That is a prompting loop, not this loss filter.
- If you need mid-training to build tool affordances, schemas, and recovery, read [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/). Toolformer is its training-side ancestor, but only with five fixed APIs and one call.
- If there are too many candidate tools and schemas bloat the prompt, read [RAG-MCP](/en/paper-reading/04-rag-mcp/). Toolformer assumes a tiny, always-available tool set.
- If tools can write, charge money, or cross a permission boundary, do not copy “insert whenever loss drops.” This paper does not model side effects.

> **Huahua's take**
>
> Treat Toolformer as a data contract: every tool call should answer “did this make the following tokens easier to predict?” Do not treat it as a product name, and do not assume that any modern function-calling model inherits Table 3’s 33.8.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** the [arXiv abs](https://arxiv.org/abs/2302.04761), [v1 PDF](https://arxiv.org/pdf/2302.04761v1), and [HTML](https://arxiv.org/html/2302.04761v1) are readable under the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/), not CC BY. The NeurIPS 2023 proceedings PDF is also readable.
- **Project page:** the [Meta research page](https://ai.meta.com/research/publications/toolformer-language-models-can-teach-themselves-to-use-tools/) loads; it is a paper tour, not an executable service.
- **Official code and $\mathcal{C}^{*}$:** **missing**. The paper and research page do not provide a first-party GitHub repository, training scripts, annotated CCNet, or a GPT-J Toolformer checkpoint. `facebookresearch/toolformer` is 404. Community forks such as [conceptofmind/toolformer](https://github.com/conceptofmind/toolformer) are not official artifacts and cannot be used to claim that Table 3 is reproducible.
- **Tool dependencies:** Atlas, NLLB, the KILT Wikipedia dump, GPT-J weights, a CCNet subset, and 8×A100 40GB. Even restating Appendix A–B, without the official annotation file there is no way to check which 18,526 QA calls those 18,526 rows were.
- **Smallest useful reproduction:** take the QA prompt in Appendix A.2, sample `[QA(...)]` on a short factual sentence, actually query a source, and compare future-token loss under “result / no result / no call.” That only checks the filter’s direction. It does not reproduce LAMA 33.8.

## Three things to remember

1. **Technical idea:** Toolformer samples APIs from a few demonstrations, keeps calls with $L_i^{-}-L_i^{+}\ge\tau_f$, and writes tool use into next-token training rather than into an agent loop.
2. **Evidence:** Under lenient zero-shot metrics and almost always one QA or calculator call, GPT-J 6.7B beats OPT-66B and GPT-3-175B on LAMA and math; the same method stays below GPT-3 on open QA, and headline call rates depend on $k=10$.
3. **Boundary:** No chaining, no interactive search, at most one evaluation call, and no official code. The loss-filter training contract can transfer; runtime, permissions, and multi-step tool use cannot be inferred as finished from this paper.

## Further reading

Toolformer asks whether a training run should insert one API call. If the next question is whether thought and environment actions should interleave, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). If the question is whether mid-training should teach tool affordances first, read [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/). If the question is too many tool schemas, read [RAG-MCP](/en/paper-reading/04-rag-mcp/).

## Primary sources

- [Schick et al., “Toolformer: Language Models Can Teach Themselves to Use Tools,” NeurIPS 2023 / arXiv:2302.04761 v1](https://arxiv.org/abs/2302.04761)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2302.04761v1)
- [NeurIPS 2023 proceedings PDF](https://proceedings.neurips.cc/paper_files/paper/2023/file/d842425e4bf79ba039352da0f658a906-Paper-Conference.pdf)
- [Meta research page](https://ai.meta.com/research/publications/toolformer-language-models-can-teach-themselves-to-use-tools/)
- [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/)
