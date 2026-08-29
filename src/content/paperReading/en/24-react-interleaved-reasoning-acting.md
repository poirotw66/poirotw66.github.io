---
title: "ReAct: Interleave Thought and Action, but Do Not Treat a Few-Shot Loop as an Agent Runtime"
description: "A source-grounded reading of Yao et al., ICLR 2023: language thoughts join the action space, while HotpotQA, FEVER, ALFWorld, and WebShop keep hallucination, search failure, and the abstract's +34% / +10% in separate buckets."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "ReAct adds language thoughts to the action space: a thought does not change the environment or yield an environment observation; it only updates context, then interleaves with environment actions."
  - "On HotpotQA with PaLM-540B, pure ReAct EM is 27.4, below CoT at 29.4; 35.1 / 64.6 are ReAct↔CoT-SC switches, not pure ReAct."
  - "ALFWorld best-of-6 71 versus BUTLER best-of-8 37, and WebShop SR 40.0 versus IL+RL 28.7, are the source of the abstract's +34% / +10%; the Wikipedia API is only search / lookup / finish."
audience:
  - "AI engineers wiring a ReAct loop to tools, browsers, or enterprise APIs."
  - "Technical leads who need an auditable thought–action–observation contract rather than a framework name."
tags: ["Paper Reading", "Agent Systems", "Tool Use", "Chain-of-Thought", "Prompting"]
image: "/paperReading/24-react-interleaved-reasoning-acting/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - tool-use-coding-agents
  - agent-evaluation-observability
paper:
  title: "ReAct: Synergizing Reasoning and Acting in Language Models"
  authors:
    - "Shunyu Yao"
    - "Jeffrey Zhao"
    - "Dian Yu"
    - "Nan Du"
    - "Izhak Shafran"
    - "Karthik Narasimhan"
    - "Yuan Cao"
  year: 2023
  venue: "ICLR 2023（arXiv 2210.03629 v3）"
  links:
    pdf: "https://arxiv.org/pdf/2210.03629v3"
    arxiv: "https://arxiv.org/abs/2210.03629"
    doi: "https://doi.org/10.48550/arXiv.2210.03629"
    code: "https://github.com/ysymyth/ReAct"
    project: "https://react-lm.github.io/"
series:
  id: "react-reasoning-acting"
  title: "ReAct Deep Dive"
  part: 1
  totalParts: 1
---

For the broader relationship among ReAct and related methods, start from the [Agent foundations reading map](/en/blog/91-agent-method-foundation-reading-map/).

## The paper in 90 seconds

- **Problem:** LLM reasoning (chain-of-thought) and acting (WebGPT, SayCan) were treated as separate lines of work. CoT never touches an environment; act-only methods can query the outside world but lack high-level plans and exception handling.
- **Core insight:** Add language thoughts to the action space. A thought does not change the environment and produces no environment observation; it only updates context, then interleaves with environment actions. The changed decision point is no longer “only think” or “only act,” but “in this same trajectory, is the next legal move a sentence to oneself or a touch of the world?”
- **Strongest evidence:** ALFWorld best-of-6 ReAct 71% versus Act 45% and BUTLER best-of-8 37%; WebShop SR 40.0 versus IL+RL 28.7. In a human analysis of HotpotQA failures, 56% of CoT failures are hallucinations versus 0% for ReAct (Table 2).
- **Main boundary:** On HotpotQA with PaLM-540B, pure ReAct EM is 27.4, below CoT at 29.4. The 35.1 / 64.6 headline cells are ReAct↔CoT-SC switches. The method is few-shot prompting with a Wikipedia API of search, lookup, and finish. It is not a deployable runtime.

My conclusion: **ReAct's most useful contribution is making thought, action, and observation part of an inspectable execution trajectory. The paper uses only one to six human demonstrations and three Wikipedia actions, so it does not directly represent today's deployable agent frameworks.**

> **Huahua in one sentence**
>
> A thought is working memory written into context, not a button pressed on the environment. If the next step still needs an external fact, the model should actually search or look up, not invent the answer inside a thought.

## Version and reading scope

This article reads the ICLR 2023 paper by [Yao et al.](https://openreview.net/forum?id=WE_vluYUL-X) in the [arXiv:2210.03629 v3](https://arxiv.org/abs/2210.03629) snapshot. The v3 PDF and [arXiv HTML](https://arxiv.org/html/2210.03629v3) are marked CC BY 4.0.

Beyond the abstract, I checked the action-space definition in Section 2, the Wikipedia API and Tables 1–2 in Section 3, ALFWorld and WebShop in Section 4, and Appendix A–E on GPT-3, human thought editing, and the Colorado orogeny trace. As of **2026-08-27**, the [project page](https://react-lm.github.io/) and [ysymyth/ReAct](https://github.com/ysymyth/ReAct) repository remain reachable.

This is a published ICLR paper, not a preprint. It is also not a runtime specification.

## The question a reader should actually answer

When a language model can both “think” and “act,” should those abilities live in two separate systems? ReAct’s answer is no: inside one few-shot trajectory, the model should alternate verbal thoughts and environment actions.

The precise reading is not “is ReAct stronger than CoT,” because Table 1 says it is not on HotpotQA. The real question is: **once a thought becomes a legal action that does not touch the environment, can the model use external observations to revise a plan, and where does it fail because the tool is weak, the step budget is small, or decoding repeats itself?**

## Evidence map

| Layer | Wording used in this article |
| --- | --- |
| **Paper directly supports** | Section 2 expands the action space to $\hat{\mathcal{A}}=\mathcal{A}\cup\mathcal{L}$; Table 1 reports PaLM-540B prompting numbers; Table 2 reports a 200-trace human taxonomy of success and failure; Tables 3–4 report ALFWorld and WebShop; Figure 3 shows the 8B / 62B finetuning direction. |
| **Author claims** | Interleaving reasoning and acting can improve groundedness, interpretability, and success on some decision-making tasks; the abstract’s +34% / +10% come from the specified ALFWorld and WebShop comparisons. |
| **Not established** | Few-shot ReAct is not a deployable agent runtime; three Wikipedia actions are not an enterprise tool interface; general readers cannot rerun the PaLM-540B experiments; pure ReAct does not beat CoT on HotpotQA. |
| **Bloss0m engineering judgment** | Implement ReAct as an auditable thought–action–observation contract. Do not attach Wikipedia’s search / lookup / finish loop to side-effecting tools. |

The rest of the article keeps reported numbers, author claims, and engineering judgment in separate buckets. “Improvement” refers only to the paper’s setup.

## Why the previous approach is insufficient

Section 1 draws two 2022 lines clearly.

**Reasoning only.** Chain-of-thought lets a model emit multi-step thoughts, but the process is a static black box. The model uses only its internal representation, with no external grounding, so it cannot revise itself from environment feedback and can propagate hallucinated facts all the way to the answer (Figure 1(1b)).

**Acting only.** Work such as WebGPT and SayCan converts observations to text and lets a language model emit domain-specific actions. Those systems usually do not ask the model to maintain a high-level goal or working memory in language. Inner Monologue adds some verbal feedback, but the authors treat it mainly as a restatement of environment state and unfinished subgoals, not as flexible internal reasoning.

The prior approach is insufficient not because “the model is too small,” but because **the decision rule was split**: CoT’s only next move is another thought; Act’s only next move is an environment action. ReAct changes exactly that control point.

## Core intuition

Skip the notation for a moment. Picture someone in a kitchen. After cutting vegetables, they can say to themselves “now I should boil water” (a thought) or open the fridge to check whether salt is still there (an action). The sentence does not light the stove. Only the action changes the world and returns a new observation.

ReAct writes that division into the decoder’s legal next step:

- **Thought:** plan, extract, apply commonsense, handle exceptions over the current context. The environment is unchanged.
- **Action:** search, walk, click a product. The environment returns an observation.
- **Observation:** the only channel that can write an external fact into context.

CoT has only the first kind of next step, so errors often look like confident invention. Act-only has only the second, so even when Wikipedia has already surfaced the key sentence, the model may still fail to synthesize a final answer. Figure 1’s Apple Remote example is that contrast: Act finds Front Row and still Finishes incorrectly; ReAct uses thoughts to fold the observations into “keyboard function keys.”

> **Huahua's engineering note**
>
> Do not attach these three read-only Wikipedia actions to tools that send mail, edit files, place orders, or call a paid API. The paper’s action space is intentionally weak, and the Ethics Statement says the agent cannot actually buy products on the WebShop research benchmark or edit Wikipedia.

## Walk one example through the method

The following is a human exemplar from Appendix C.1, not an independent experimental result. The HotpotQA question is: *What is the elevation range for the area that the eastern sector of the Colorado orogeny extends into?* The labeled answer is `1,800 to 7,000 ft`.

1. **Input:** only that question. No support paragraph. The Wikipedia API’s legal environment actions are `search[entity]`, `lookup[string]`, and `finish[answer]`.
2. **Intermediate representation:** context $c_t$ is the Thought / Action / Observation string so far. Thought 1 decomposes the question into “search Colorado orogeny, find where the eastern sector extends, then find that area’s elevation.” That sentence is **not sent to Wikipedia**; it is appended to the next prompt.
3. **Model or system decision:** Action 1 `Search[Colorado orogeny]` is the first touch of the environment. Observation 1 returns the first five sentences of the wiki page and does not mention the eastern sector. Thought 2 therefore chooses `Lookup[eastern sector]`. Observation 2 says the eastern sector extends into the High Plains. Thought 3 chooses `Search[High Plains]`, but Observation 3 is a disambiguation page (two distinct regions). Thought 4 reformulates to `Search[High Plains (United States)]`.
4. **Output:** Observation 4 states that the High Plains rise from about 1,800 to 7,000 ft. Thought 5 synthesizes the answer; Action 5 is `Finish[1,800 to 7,000 ft]`.
5. **Likely failure point:** if the model Finishes on the Observation 3 disambiguation page, or if lookup / search returns empty or useless text, the trace derails. Table 2 records that pattern as search-result error (23% of ReAct failures). Another failure the authors name is repeating the same thought–action pair, counted inside reasoning error (47%).

In the same Appendix C.1, the act-only exemplar also Finishes with the same elevation span. This Colorado trace therefore teaches **how the mechanism walks end to end**, not “without thoughts the answer must fail.” To see a thought change the ending, go back to Figure 1’s Apple Remote item, or to the ALFWorld knife trace in Appendix D.2: Act finds the knife, tries to clean it before walking to the sinkbasin, then gets stuck repeating commands.

## Technical mechanism

Section 2 starts from a generic agent. At time $t$, the agent receives observation $o_t\in\mathcal{O}$ and selects action $a_t\in\mathcal{A}$ from policy $\pi(a_t\mid c_t)$. Context is the trajectory so far:

$$
c_t=(o_1,a_1,\ldots,o_{t-1},a_{t-1},o_t).
$$

When the map $c_t\mapsto a_t$ is highly implicit, “read the whole trace and guess the next environment action” fails. In Figure 1(1c), act-only still cannot emit the correct final Finish even with Act 1–3 and Obs 1–3. In Figure 1(2a), the agent cannot read from context that the sinkbasin does not contain the peppershaker, so it repeats hallucinated actions.

ReAct’s core change is to enlarge the action space:

$$
\hat{\mathcal{A}}=\mathcal{A}\cup\mathcal{L}.
$$

What each symbol does in the running system:

- $\mathcal{A}$ is the set of task actions that change the environment. For HotpotQA / FEVER that is Wikipedia search / lookup / finish; for ALFWorld, go to / take / clean / put; for WebShop, search / click.
- $\mathcal{L}$ is the free language space. An element $\hat{a}_t\in\mathcal{L}$ is a thought.
- A thought **does not affect the external environment**, so it yields **no environment observation**. It reasons over $c_t$ and writes itself back into context:

$$
c_{t+1}=(c_t,\hat{a}_t).
$$

- Only an environment action makes Wikipedia, the household, or the product page return $o_{t+1}$, which is then concatenated into the next $c_{t+1}$.

Increasing the number of thoughts writes more inspectable working memory into the prompt. That creates room for planning and exception handling, but it also lengthens context and makes greedy decoding more likely to fall into a loop that repeats the same Thought / Action. Removing thoughts and leaving only $\mathcal{A}$ is act-only: environment signals remain, but the model has no legal “update my own plan” move.

The paper also changes how densely thoughts appear. Knowledge-intensive tasks use a **dense** thought–action–observation alternation because every step must decide what to retrieve. Decision-making traces can exceed 50 actions, so thoughts become **sparse** and the language model decides when to think versus act. The Inner Monologue-style ReAct-IM ablation restricts thoughts to environment feedback and the current subgoal; ALFWorld best-of-6 then drops from 71 to 53 (Table 3). Having an inner monologue is not the same as having a thought that can revise the plan.

### The Wikipedia three-action $\mathcal{A}$ is intentionally weak

The Section 3.1 environment is neither BM25 nor a dense retriever:

1. `search[entity]`: if the page exists, return the **first five sentences** of that entity’s wiki page; otherwise return the **top-5 similar entities** from the Wikipedia search engine.
2. `lookup[string]`: return the next sentence on the current page that contains the string, simulating browser Ctrl+F.
3. `finish[answer]`: end the task and emit the answer.

The authors say this is much weaker than then-SOTA lexical or neural retrievers: it can usually retrieve only a small span, and only by exact page name. The point is to mimic how a person uses Wikipedia and to force the model to say in language why the next lookup should happen. As of 2026-08-27, the public [`wikienv.py`](https://github.com/ysymyth/ReAct/blob/master/wikienv.py) issues a live request to `https://en.wikipedia.org/w/index.php?search=`; `think[]` returns `"Nice thought."` and does not change page state. The HotpotQA main-experiment prompt format is `Thought n` / `Action n` / `Observation n`, so thoughts travel through $\mathcal{L}$ and do not have to pretend to be Wikipedia actions.

The prompt budget is also small: six human traces for HotpotQA, three for FEVER; three ALFWorld traces per task type, then six permutations of two traces to test prompt robustness; WebShop is one-shot. The authors report that more QA exemplars do not help. Main results use greedy decoding; only CoT-SC samples 21 traces at temperature 0.7.

![ReAct Figure 1: Standard, CoT, act-only, and ReAct traces on HotpotQA and ALFWorld.](/paperReading/24-react-interleaved-reasoning-acting/paper/figure-1-method.webp)

*Figure 1, paper Section 1: on the left, the same HotpotQA item, where CoT hallucinates from internal knowledge, Act finds Front Row but cannot Finish correctly, and ReAct uses thoughts to fold observations into an answer; on the right, ALFWorld, where Act stalls on “Nothing happens” and ReAct uses sparse thoughts to change where it searches. Locate the original at [Figure 1](https://arxiv.org/html/2210.03629v3#S1.F1); the SVG endpoint is [teaser-new.svg](https://arxiv.org/html/2210.03629v3/teaser-new.svg). From the arXiv HTML page, marked CC BY 4.0.*

## How to read the evidence

The four benchmarks are not one question. HotpotQA and FEVER are question-only: the model never sees gold paragraphs and must rely on internal knowledge or the Wikipedia API. ALFWorld is 134 unseen text games where an expert policy may take more than 50 steps. WebShop has 1.18M products and 12k human instructions, and reports average score and success rate on 500 test instructions.

The main model is frozen PaLM-540B. QA baselines are the same ReAct traces with fields stripped: Standard removes thoughts, actions, and observations; CoT removes actions and observations; Act removes thoughts. Table 1 therefore compares **different visible slices of one human trace**, not four independently annotated prompt sets.

### Table 1: pure ReAct does not win HotpotQA

This table asks: under PaLM-540B few-shot prompting, how do EM / Acc change if the model only thinks, only acts, interleaves both, or switches between them? The model and exemplar source stay fixed; what changes is whether the prompt can see the environment and whether it can see thoughts.

| Prompt method | HotpotQA EM | FEVER Acc |
| --- | ---: | ---: |
| Standard | 28.7 | 57.1 |
| CoT | 29.4 | 56.3 |
| CoT-SC | 33.4 | 60.4 |
| Act | 25.7 | 58.9 |
| ReAct | 27.4 | 60.9 |
| CoT-SC → ReAct | 34.2 | 64.6 |
| ReAct → CoT-SC | 35.1 | 62.0 |
| Supervised SoTA | 67.5 | 89.5 |

ReAct is consistently above Act (27.4 vs 25.7; 60.9 vs 58.9), which supports “thoughts help synthesize the final action.” On FEVER, ReAct beats CoT (60.9 vs 56.3), which fits “SUPPORTS / REFUTES claims may differ by a small factual detail that must be looked up.” On HotpotQA, pure ReAct at 27.4 is **below** CoT at 29.4 and also below Standard at 28.7. The best prompting rows are switches: 35.1 on HotpotQA is ReAct→CoT-SC; 64.6 on FEVER is CoT-SC→ReAct. Both remain far below supervised SoTA at 67.5 / 89.5.

The switch rule is in Section 3.2: ReAct→CoT-SC backs off when ReAct fails to return an answer within a step cap (7 steps on HotpotQA, 5 on FEVER); CoT-SC→ReAct backs off when the majority answer among $n$ CoT-SC samples occurs fewer than $n/2$ times. This is a heuristic backoff, not a learned router.

The table **does not** support “ReAct prompting universally beats CoT on multi-hop QA,” and it **does not** let 35.1 / 64.6 be quoted as pure ReAct.

![ReAct Figure 2: HotpotQA EM and FEVER Acc versus the number of CoT-SC samples.](/paperReading/24-react-interleaved-reasoning-acting/paper/figure-2-cot-sc.webp)

*Figure 2, paper Section 3.3: HotpotQA EM on the left, FEVER Acc on the right. The two ReAct↔CoT-SC curves sit above pure CoT-SC at most sample counts; dashed lines are the pure ReAct and pure CoT baselines. Locate the original at [Figure 2](https://arxiv.org/html/2210.03629v3#S3.T1.fig2), from [cots_scale.svg](https://arxiv.org/html/2210.03629v3/cots_scale.svg) and [fever_cots_scale.svg](https://arxiv.org/html/2210.03629v3/fever_cots_scale.svg). The arXiv HTML page is marked CC BY 4.0.*

### Table 2: even when the score goes the other way, failure types still support groundedness

The authors sampled 50 EM-correct and 50 EM-incorrect traces from ReAct and from CoT (200 traces in total) and labeled success and failure modes by hand. This does not ask “who has higher EM.” It asks “when the answer is right, was it lucky, and when it is wrong, what kind of wrong?”

| | Type | ReAct | CoT |
| --- | --- | ---: | ---: |
| Success | True positive | 94% | 86% |
| Success | False positive (hallucinated reasoning or facts still judged correct) | 6% | 14% |
| Failure | Reasoning error | 47% | 16% |
| Failure | Search result error | 23% | — |
| Failure | Hallucination | 0% | 56% |
| Failure | Label ambiguity | 29% | 28% |

Among failures, 56% of CoT cases are hallucinations versus 0% for ReAct; among successes, false positives are 14% for CoT versus 6% for ReAct. The cost is that ReAct’s reasoning-error rate rises to 47%, plus 23% empty or unhelpful searches. The authors also fold “the model repeats the previous thoughts and actions” into reasoning error and suspect greedy decoding as one cause.

The table **supports** “interleaving an environment reduces hallucination.” It **does not support** “ReAct’s reasoning structure is stronger.” It also does not transfer to side-effecting tool calls: a search error here is a wrong page, not a destructive write.

### Table 3: ALFWorld’s +34% is a headline with mismatched trial budgets

ALFWorld asks whether sparse thoughts beat act-only and imitation learning in a long-horizon, sparse-reward household game. The controlled comparison is the same human traces with thoughts removed (Act). BUTLER is a different method, trained on about $10^5$ expert trajectories, reported as best-of-8. ReAct and Act are best-of-6.

On the All column: Act best-of-6 45, ReAct avg 57, ReAct best-of-6 71, ReAct-IM best-of-6 53, BUTLER best-of-8 37. The abstract’s +34% is 71−37. The authors also write that the worst ReAct trial (48%) still beats the best trial of both Act and BUTLER; the relative gain over Act across six controlled trials ranges from 33% to 90%, averaging 62%.

This supports “on this text game, sparse thoughts help more than emitting actions only.” It **does not** compare ReAct and BUTLER under the same trial budget, so +34% is a headline rather than a matched-budget causal claim. It is also not a real-robot result: the environment is a text game aligned with ALFRED.

### Table 4: WebShop’s +10% is the rounded SR gap

WebShop asks whether one-shot ReAct can beat IL trained on 1,012 human trajectories, and IL+RL trained on a further 10,587 instructions, in a noisy real-product website.

| Method | Score | SR |
| --- | ---: | ---: |
| Act | 62.3 | 30.1 |
| ReAct | 66.6 | 40.0 |
| IL | 59.9 | 29.1 |
| IL+RL | 62.4 | 28.7 |
| Human | 82.1 | 59.6 |

ReAct’s SR of 40.0 versus IL+RL 28.7 is an 11.3 point gap, written as +10% in the abstract. The score gap is smaller (66.6 vs 62.4). The authors observe that ReAct is more likely to use thoughts to align noisy observations with relevant options. Humans remain substantially higher and explore more products and reformulate queries; prompting has not caught up.

This **cannot** be read as “ReAct is already a production shopping agent.” The research benchmark also cannot complete a real purchase.

### Figure 3: finetuning changes who learns to look things up, not another 540B prompt sweep

Because annotating thoughts plus actions at scale is expensive, the authors use a STaR-like bootstrap: 3,000 trajectories with **correct answers** generated by ReAct (and the other baselines) finetune PaLM-8B / 62B to decode the full thought / action / observation trace from the question. Appendix B.1: batch size 64; ReAct / Act train for 4,000 steps; Standard / CoT train for 2,000 steps at 8B and 1,000 at 62B. The authors find ReAct / Act benefit from more steps and data, while Standard / CoT degrade quickly.

Figure 3’s qualitative result: under prompting, ReAct is the worst of the four methods at 8B / 62B, because in-context learning must acquire both reasoning and acting. After finetuning, ReAct becomes the best; the paper states that PaLM-8B finetuned ReAct outperforms all PaLM-62B prompting methods, and PaLM-62B finetuned ReAct outperforms all 540B prompting methods. Their interpretation: finetuning Standard / CoT is closer to memorizing (possibly hallucinated) facts, while finetuning ReAct / Act teaches how to access Wikipedia.

This article does not read unpublished exact EM values off the bars. The figure supports “trajectory format on a small model can matter more than scaling up a prompt.” It is **not** a publicly rerunnable training curve: PaLM weights are not generally available, and the 3,000 correct traces themselves come from PaLM-540B.

![ReAct Figure 3: prompting versus finetuning on HotpotQA across model scales.](/paperReading/24-react-interleaved-reasoning-acting/paper/figure-3-finetune.webp)

*Figure 3, paper Section 3.3: prompting on the left, finetuning on the right (no 540B finetune point). The authors use it to argue that a smaller model finetuned with ReAct can beat larger-model prompting. Locate the original at [Figure 3](https://arxiv.org/html/2210.03629v3#S3.F3); the SVG is [hotpot_finetune.svg](https://arxiv.org/html/2210.03629v3/hotpot_finetune.svg). From the arXiv HTML page, marked CC BY 4.0.*

## Limitations and threats to validity

The paper’s own limits are already explicit. The conclusion says complex tasks with large action spaces need more demonstrations and easily exceed the in-context window; finetuning is only an initial result and still wants high-quality human annotation. The Ethics Statement confines interaction to Wikipedia and the WebShop research environment to avoid private lookups and dangerous actions.

Several more boundaries appear when the tables are read as engineering evidence:

1. **The abstract’s +34% / +10% are not Table 1.** They come from ALFWorld 71 vs 37 and WebShop SR 40.0 vs 28.7, and the ALFWorld trial budgets are not aligned.
2. **Pure ReAct does not beat CoT on HotpotQA.** If a product task looks like multi-hop QA and the tool is weak, assuming “adding thoughts must raise the score” conflicts with Table 1.
3. **The Wikipedia API is toy retrieval.** There is no permission model, versioning, or citation graph, and no modern retriever. Live Wikipedia also means a 2023 trace may not match today’s pages.
4. **PaLM-540B is not a generally reproducible runtime.** The paper’s Reproducibility Statement already said PaLM was not openly accessible. The public repo is GPT-3 prompting notebooks. The README’s 500-example table (HotpotQA 29.4, FEVER 62.2) is not aligned with Table 1’s ReAct 27.4 / 60.9 and should not replace it.
5. **Table 5’s GPT-3 comparison has a subset denominator.** Appendix A.1 reports GPT-3 (text-davinci-002) at 30.8 / 78.4 on 500 HotpotQA questions and 134 ALFWorld games, against PaLM-540B 29.4 / 70.9 in that table. The caption says ReAct prompting, but 29.4 matches Table 1’s CoT rather than pure ReAct 27.4. This article treats Table 5 as evidence that the ReAct format also runs on GPT-3, not as a third official Table 1.

Appendix A.3’s human thought edit is suggestive: editing thoughts at Act 17 and Act 23 turns a failing ALFWorld trace into a success. It is a single example, not a human-in-the-loop study. It supports “thought is an editable control surface,” not “a product can be aligned by editing two sentences.”

## Engineering decision and when not to use it

When is ReAct worth borrowing? When you need a **readable, logged, mid-trace-editable** trajectory, and when environment actions themselves are auditable: looking up documents, searching an internal knowledge base, walking around a simulator. In that case, store thought, tool name, arguments, observation, and finish as separate fields instead of one prose blob.

When should this paper not be used as a construction drawing?

- If tools can write, charge money, or cross a permission boundary, do not copy the Wikipedia three-action loop.
- If you need retrieval quality, citations, or schema validation, ReAct does not provide those layers. Compare the site’s [RAG-MCP](/en/paper-reading/04-rag-mcp/) reading: that paper is about too many candidate tools, not about the thought interface.
- If you need to measure “the system searched but never read evidence before answering,” see [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/). ReAct’s Table 2 has search error, but not a Read-Gate-style procedural failure split.
- If you need durable state, a verifier, and rollback, see [Argus](/en/paper-reading/10-argus-agentic-runtime/). Few-shot ReAct has no control plane.
- If the bottleneck is that the model never learned tool affordances, rather than that the prompt lacks thoughts, see [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/).

> **Huahua's take**
>
> Treat ReAct as a contract: every step should be identifiable as a thought, an environment action, or an observation. Do not treat it as a product name, and do not assume a LangChain-style “ReAct Agent” inherits Table 3’s 71%.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** the [arXiv abs](https://arxiv.org/abs/2210.03629), [v3 PDF](https://arxiv.org/pdf/2210.03629v3), and [HTML](https://arxiv.org/html/2210.03629v3) are readable under CC BY 4.0. The OpenReview page is [WE_vluYUL-X](https://openreview.net/forum?id=WE_vluYUL-X).
- **Project page:** [react-lm.github.io](https://react-lm.github.io/) loads; it is a paper tour, not an executable service.
- **Code and prompts:** [ysymyth/ReAct](https://github.com/ysymyth/ReAct) is reachable under the MIT License. Visible files include `hotpotqa.ipynb`, `FEVER.ipynb`, `alfworld.ipynb`, `WebShop.ipynb`, `wikienv.py`, and `prompts/` files `prompts_naive.json`, `fever.json`, and ALFWorld JSON. This is GPT-3 prompting code, not PaLM training code.
- **Models:** PaLM-540B / 8B / 62B are **not** generally downloadable checkpoints. The paper already stated that the main experiments are therefore hard to reproduce. GPT-3 text-davinci-002 is itself no longer a default public API.
- **Task environments:** HotpotQA, FEVER, ALFWorld, and WebShop each need their own install. The Wikipedia implementation hits the live site, not a frozen dump.

The smallest useful reproduction is: take the public notebook prompts, run search / lookup / finish on a handful of HotpotQA questions, and check that thoughts do not change wiki state and that empty searches do not simply repeat the same action. Do not claim that this reproduces Table 1’s PaLM-540B numbers.

## Three things to remember

1. **Technical idea:** ReAct adds thoughts from $\mathcal{L}$ to the action space; a thought only updates context, and only an environment action buys an observation.
2. **Evidence:** On decision-making tasks, few-shot ReAct is clearly above Act and the paper’s IL / RL baselines; on QA it reduces hallucination, but pure ReAct HotpotQA EM does not beat CoT, and the headline best cells are switches.
3. **Boundary:** This is one to six human traces, plus an intentionally weak Wikipedia API, plus PaLM weights that are not generally available. The auditable contract can transfer; runtime, tool governance, and retrievers cannot be inferred as finished from this paper.

## Further reading

ReAct asks whether thinking and acting should interleave. Continue according to the question:

- For too many tool schemas, read [RAG-MCP](/en/paper-reading/04-rag-mcp/).
- For teaching tool use during mid-training, read [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/).
- For verifying that retrieved evidence was read before answering, read [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/).
- For long-horizon runtime and rollback, read [Argus](/en/paper-reading/10-argus-agentic-runtime/).

## Primary sources

- [Yao et al., “ReAct: Synergizing Reasoning and Acting in Language Models,” ICLR 2023 / arXiv:2210.03629 v3](https://arxiv.org/abs/2210.03629)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2210.03629v3)
- [OpenReview forum WE_vluYUL-X](https://openreview.net/forum?id=WE_vluYUL-X)
- [Project page](https://react-lm.github.io/)
- [GPT-3 prompting code and prompts (MIT)](https://github.com/ysymyth/ReAct)
