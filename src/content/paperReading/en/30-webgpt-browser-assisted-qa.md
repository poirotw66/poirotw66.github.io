---
title: "WebGPT: Let the Model Browse for Answers, but Do Not Treat It as a Reasoning Agent Loop"
description: "A source-grounded reading of Nakano et al., arXiv:2112.09332 v3: GPT-3 is given a text browser and trained with human demonstrations and preference / reward modeling to search, quote, and answer. The 175B best-of-64 model is preferred 56% versus demonstrators and 69% versus Reddit; this is browsing QA, not ReAct’s thought–action–observation contract."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "WebGPT changes whether the model may issue search / click / quote commands to a text browser and then answer with citations; there is no separate thought channel and no general agent runtime."
  - "The best recipe is behavior cloning plus rejection sampling against a reward model: 175B best-of-64 is preferred 56% to human demonstrators and 69% to the highest-voted ELI5 answer (Section 4.1, Figure 2)."
  - "RL alone is preferred about 58% to BC, but adding it on top of best-of-n yields little extra (Figure 4); on TruthfulQA the model is true 75% of the time and true-and-informative 54%, still below humans (Section 4.2, Figure 3)."
audience:
  - "AI engineers who need to pull WebGPT out of a ReAct loop and keep “act with little explicit reasoning” as its own contract."
  - "Technical leads who must treat the text browser, human preferences, and citation faithfulness as adoption boundaries."
tags: ["Paper Reading", "Agent Systems", "Tool Use", "Human Feedback"]
image: "/paperReading/30-webgpt-browser-assisted-qa/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - tool-use-coding-agents
  - agent-evaluation-observability
paper:
  title: "WebGPT: Browser-assisted question-answering with human feedback"
  authors:
    - "Reiichiro Nakano"
    - "Jacob Hilton"
    - "Suchir Balaji"
    - "Jeff Wu"
    - "Long Ouyang"
    - "Christina Kim"
    - "Christopher Hesse"
    - "Shantanu Jain"
    - "Vineet Kosaraju"
    - "William Saunders"
    - "Xu Jiang"
    - "Karl Cobbe"
    - "Tyna Eloundou"
    - "Gretchen Krueger"
    - "Kevin Button"
    - "Matthew Knight"
    - "Benjamin Chess"
    - "John Schulman"
  year: 2021
  venue: "arXiv 2112.09332 v3（OpenAI 技術報告／preprint）"
  links:
    pdf: "https://arxiv.org/pdf/2112.09332v3"
    arxiv: "https://arxiv.org/abs/2112.09332"
    doi: "https://doi.org/10.48550/arXiv.2112.09332"
    project: "https://openaipublic.blob.core.windows.net/webgpt-answer-viewer/index.html"
series:
  id: "webgpt-browser-assisted-qa"
  title: "WebGPT deep reading"
  part: 1
  totalParts: 1
---

To see where this note sits in the ReAct family, start with the [Agent foundations reading map](/en/blog/91-agent-method-foundation-reading-map/). For the reading method itself, pair this with the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/).

## The paper in 90 seconds

- **Problem:** Long-form question answering lags humans. Retrieval and synthesis were built as separate pieces. Without citations, people cannot cheaply check paragraph-level facts.
- **Core insight:** Outsource search to Bing, leave synthesis to a finetuned GPT-3, and insert a **text browser** between them. The model may only issue Table 1 commands (search, click, quote, scroll, end), collect quotes while browsing, then write the answer. Training is behavior cloning from human demonstrations, plus a reward model from human preferences, plus rejection sampling at inference.
- **Strongest evidence:** 175B best-of-64 is preferred 56% to demonstrators and 69% to the highest-voted ELI5 answers (Section 4.1, Figure 2). Best-of-64 is preferred 68% to plain BC; RL is preferred 58% to BC, but stacking RL on rejection sampling adds little (Section 5.1, Figures 4 and 5).
- **Main boundary:** There is no separate thought action. The text browser is a constrained action space, not a general tool loop. Answers can still mis-paraphrase quotes or cherry-pick sources that look convincing to labelers. This is a 2021 OpenAI technical report / arXiv preprint, not a later production browsing product.

My bounded verdict: **WebGPT is worth keeping as the control point “act without opening a reasoning channel.” It is not worth reading as ReAct, or as today’s search-agent OS.**

> **Huahua in one sentence**
>
> What the model learns is to issue browser commands and carry quotes into the answer. It is not taught to talk to itself before it acts. That seam is later ReAct.

## Version and reading scope

This note reads [Nakano et al., arXiv:2112.09332 v3](https://arxiv.org/abs/2112.09332) (first posted 2021-12-17; last revised 2022-06-01). The PDF and [arXiv HTML](https://arxiv.org/html/2112.09332v3) are marked **arXiv.org perpetual non-exclusive license**, not CC BY. Author order follows the v3 PDF: Reiichiro Nakano, Jacob Hilton, Suchir Balaji, Jeff Wu, Long Ouyang, Christina Kim, Christopher Hesse, Shantanu Jain, Vineet Kosaraju, William Saunders, Xu Jiang, Karl Cobbe, Tyna Eloundou, Gretchen Krueger, Kevin Button, Matthew Knight, Benjamin Chess, and John Schulman. A footnote marks the first three as equal contribution with randomized order; the correspondence list also includes John Schulman. The source tarball ships `neurips_2020.sty`; that is a formatting template, **not** a NeurIPS or ICLR publication record.

Beyond the abstract, the note checks Section 2’s environment and Table 1, Section 3’s data and four training methods, Section 4 on ELI5 / TruthfulQA / TriviaQA, Section 5’s method comparison and scaling, Section 6’s limits, and artifact endpoints as of **2026-08-27**. Bing Chat, SearchGPT, Deep Research, Browser-use leaderboards, and ReAct’s WebShop 40.0 are **not** written back into these tables.

This is an OpenAI technical report / arXiv preprint, not a published conference paper.

## The question the reader actually needs

When a model must answer a long question that needs the web, should engineering build a differentiable retriever, or give the model a search box that a person can also operate and train that policy with demonstrations and preferences? Nakano et al. answer: outsource Bing, freeze the contract “only browser commands are legal,” and optimize answer quality directly with imitation plus human feedback.

The precise reading is not “is WebGPT an agent?” The real question is: **if the model may act on an environment but is not given a legal verbal thought, which preference scores move on ELI5 and TruthfulQA, and where does the method fail because quotes are unfaithful, sources are unreliable, or the action space is too narrow?**

## Evidence map

| Layer | How this article uses it |
| --- | --- |
| **Paper directly supports** | Figure 1 shows the environment observation; Table 1 lists legal commands; Table 4 reports about 6,209 demonstrations and 21,548 comparisons; Figure 2 gives ELI5 human preference; Figure 3 gives TruthfulQA; Figures 4 and 5 give RL versus best-of-n; Table 9 gives TriviaQA transfer. |
| **Author claims** | End-to-end optimization of browsing and synthesis, plus quotes that cheapen fact-checking, can match or slightly beat human demonstrations on ELI5 preference; rejection sampling is the main path, and RL helps more when inference compute is tight. |
| **Not established** | A thought–action–observation contract; a general agent runtime; faithfulness of answers to quotes; 2026 live-search products; ReAct’s WebShop score. |
| **Bloss0m engineering judgment** | Implement WebGPT as the act-only ancestor. For writing reasoning into a frozen prompt, read [CoT](/en/paper-reading/29-chain-of-thought-prompting/). For interleaving thought with environment actions, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). |

Numbers, author claims, and engineering reads stay in separate buckets below. “Better than humans” means the preference rate under the paper’s protocol, not a 2026 product evaluation.

## Why the previous approach is insufficient

Sections 1 and 7 split the 2020–2021 landscape into two lines.

**Differentiable retrieval.** REALM, RAG, and DPR retrieve with inner products and then generate. Optimization is fast; the method cannot attach a non-differentiable engine such as Bing, and the process is hard to inspect. Krishna et al. (2021) already showed that ROUGE-L is not meaningful on ELI5, and their answers were preferred only 23% of the time to the reference answers.

**Long-form generation without citations.** GPT-3 can write a paragraph, but labelers cannot judge facts without doing independent research. Without quotes, there is no cheap interface for factual checking.

So the prior approach is insufficient not because nobody had thought of using the web, but because **the control point was split**: either retrieval is a differentiable module, or the model writes the whole answer in one shot. WebGPT changes that: the model must act in a text browser and collect quotes before humans score answer pairs.

## Core intuition

Ignore the preference percentages first. Picture a person looking things up in a text terminal. The terminal does not accept “think, then search.” It accepts commands. They type `Search …`, see results, `Clicked on link`, `Quote` a passage, and finally `End: Answer`. Almost every next move the model is asked for is one of those commands, not a plan spoken to itself.

Keep three next moves that later get collapsed into one slogan:

- **[CoT](/en/paper-reading/29-chain-of-thought-prompting/):** the next move is a stretch of intermediate natural-language steps. The environment does not change, and no observation comes back.
- **WebGPT:** the next move is a browser command; the environment returns a text observation. There is no separate thought action.
- **[ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/):** a thought is a legal action that does not touch the world, and it can interleave with search / lookup. That merge comes later. It is not this paper.

> **Huahua's engineering note**
>
> Do not read “the model searched” as “the model reasoned.” Table 1 has no thought. Past actions record only browser commands already executed. Later ChatGPT browsing, SearchGPT, and Deep Research are not this contract.

## Walk one example through the method

The following is the teaching observation in Figure 1, not an independent experimental result. The question is: *How can I train the crows in my neighborhood to bring me gifts?*

1. **Input:** Only that question. No Wikipedia tool wrapper, and no thought field. There is no few-shot prefix: this is a finetuned policy, not exemplar prompting.
2. **Intermediate representation:** The human demonstration GUI (Figure 1a) and the text the model sees (Figure 1b) carry the same state: Question, collected Quotes, Past actions, current Title / Scrollbar / Text, and remaining actions. Links are encoded as `【id†text†domain】`. Figure 1’s past actions are already `Search how to train crows to bring you gifts` → `Click Gifts From Crows | Outside My Window` → `Quote` → `Back`.
3. **Model or system decision:** The model must emit one command from Table 1. The legal set includes `Search <query>`, `Clicked on link <link ID>`, `Find in page`, `Quote`, scrolling, `Back`, and `End: Answer`. Any other string is an invalid action: it still counts toward the action cap, but the environment ignores it. Browsing stops when the model ends, hits the action maximum, or hits the total-quote-length cap; at least one quote is required before answering.
4. **Output:** The answering phase concatenates the question and the quotes into a new prompt; the model writes a long-form answer with citations. Table 2 shows a different ELI5 test item from the 175B best-of-64 model (why some words are “bad”). That is what an output looks like, not the official answer to Figure 1’s crow question.
5. **Likely failure point:** A quote can come from an unreliable source (Table 3’s TruthfulQA miss: a wish will come true). Synthesis can mis-paraphrase rather than hallucinate wildly. Invalid commands are swallowed but still spend the action budget. RL could in principle reinforce real-world side effects if the model found them, but this environment only allows Bing queries and following links that already exist (Section 6.5).

The crow item teaches **how the mechanism runs to completion**. To see preference pushed past 50%, go to Figure 2. To see whether “write the reasoning” is this paper’s job, look at Table 1—there is no thought.

## Technical mechanism

The environment renders the current browsing state as a text summary. The model produces the next command in a **fresh context**; earlier steps survive only as Past actions and Quotes inside that summary (Section 2). This is not an agent OS with accumulating hidden state. It is a rewritten observation at every step.

What Table 1 actually does:

| Command | Effect on the environment |
| --- | --- |
| `Search <query>` | Call the Bing API and show a results page |
| `Clicked on link <id>` | Open a new page after Readability HTML simplification |
| `Quote: <text>` | If the span is found on the current page, record it as a reference |
| `End: Answer` | Stop browsing and enter the answering phase |

`End: <Nonsense, Controversial>` skips answering. Results from reddit.com and quora.com are stripped so the model cannot copy ELI5 answers. Pages with a 10-gram overlap with the question (or a provided reference answer) are censored into an error message (Appendix A).

Training has four methods on disjoint question sets (Section 3.2):

1. **Behavior cloning (BC).** Supervised fine-tuning with the demonstrators’ commands as labels.
2. **Reward modeling (RM).** Starting from the BC model with the final unembedding removed, the network takes a question plus an answer with references and emits a scalar. Following Stiennon et al. (2020), that score is Elo: the difference of two scores is the logit of human preference. Ties are soft 50% labels. The final reward models train on about 16,000 comparisons; the remaining 5,500 are evaluation-only.
3. **Reinforcement learning (RL).** PPO fine-tunes the BC policy. The environment reward is the RM score at episode end plus a per-token KL penalty from the BC model, which is there to slow RM overoptimization.
4. **Rejection sampling (best-of-$n$).** Draw 4, 16, or 64 answers from BC (or RL) and keep the one the same-size RM ranks highest. No extra training; it spends inference compute.

The three WebGPT models in the main evaluation are all **BC plus same-size RM rejection sampling**: 760M best-of-4, 13B best-of-16, and 175B best-of-64. Sampling temperature is 0.8; browsing is capped at 100 actions. The authors drop RL from that headline set because Figure 4 shows little extra benefit once rejection sampling is already on.

How to read the reward: raising $r(q,a)$ means the RM is more confident that this answer would win a pairwise comparison. A difference of $1$ is about $\sigma(1)\approx 73\%$ preference (Section 5.2). That scalar can rank samples, and RL can overoptimize it—which is why the headline path is best-of-$n$, not “always run PPO.”

Contrast with later control points: WebGPT expands a browser action space but does not add thought to that space. For that contract, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). For writing reasoning into a frozen prompt without touching the world, read [CoT](/en/paper-reading/29-chain-of-thought-prompting/).

![WebGPT Figure 1: left, the human demonstration GUI; right, the text observation the model sees, with Question, Quotes, Past actions, and page text.](/paperReading/30-webgpt-browser-assisted-qa/paper/figure-1-environment.webp)

*Figure 1, paper Introduction / Section 2: the same browsing state, shown as a GUI to demonstrators on the left and serialized for the model on the right. The crow-gift item has already executed Search → Click → Quote → Back. Locate the original at [Figure 1](https://arxiv.org/html/2112.09332v3#S1.F1). From the arXiv v3 PDF / HTML; page marked arXiv.org perpetual non-exclusive license; copyright remains with the authors / OpenAI.*

## How to read the evidence

The headline task is ELI5 long-form QA. TruthfulQA is an adversarial short-form set used to probe imitative falsehoods. TriviaQA is short-form transfer, not the source of the abstract’s percentages. The headline models are BC + best-of-$n$; RL appears as a contrast in Section 5.

Table 4 is the data scale: 6,209 demonstrations (5,711 from ELI5, about 92%) and 21,548 comparisons (21,068 from ELI5, about 98%). Small mixes of TriviaQA, ARC, handwritten items, and ELI5 fact-check are included. Researcher–labeler agreement on comparisons is 74% and labeler–labeler agreement is 73% (a tie versus a non-tie counts as 50%; Appendix C).

### Figure 2: 56% and 69% are not the same comparison

These plots ask: against demonstrators, or against Reddit’s highest-voted answer, how often do humans prefer the same WebGPT answer? The three models correspond to different inference budgets: 760M best-of-4, 13B best-of-16, 175B best-of-64.

Versus demonstrators (Figure 2a) the protocol matches reward-model training, citations included. Versus ELI5 references (Figure 2b) citations are stripped, new contractors who never saw the detailed instructions are hired, and only the minimal Appendix F rubric is used—the authors worry about ecological validity and blinding. Ties count as 50% and are not dropped.

Observation: 175B best-of-64 wins **overall usefulness** 56% of the time against demonstrators and 69% against Reddit’s top answer. The authors read 56% as human-level use of the text browser, and note that imitation of demonstrations alone should not usually exceed 50%. 69% is far above Krishna et al.’s 23%, at much higher compute. Figure 2a also shows that **coherence** bars mostly sit below 50%, while factual accuracy is near a coin flip—so 56% is not “every axis beats the demonstrator.”

The figure **cannot** support a 2026 long-form QA product beating humans, and it **cannot** make 69% a fair cited, same-rubric match.

![WebGPT Figure 2: left, preference versus human demonstrations; right, preference versus ELI5 highest-voted answers; best-of-n follows Figure 8’s compute frontier.](/paperReading/30-webgpt-browser-assisted-qa/paper/figure-2-eli5.webp)

*Figure 2, paper Section 4.1: Overall usefulness is underlined in the left panel and matches the abstract’s 56%; the right panel is 69% against Reddit answers with citations stripped. Locate the original at [Figure 2](https://arxiv.org/html/2112.09332v3#S4.F2). From the arXiv v3 source PDF figures; page marked arXiv.org perpetual non-exclusive license; copyright remains with the authors / OpenAI.*

### Figure 3: TruthfulQA’s 75% / 54% still sits below humans

This plot asks whether browsing plus quotes reduces imitative falsehoods. Controls are GPT-3 from the same family with the QA prompt and the helpful prompt. WebGPT is scored by humans; answers are truncated to 50 tokens (which accidentally produced empty answers for about 3% of items, counted as true but uninformative).

Section 4.2 and the introduction report WebGPT true 75% of the time and true-and-informative 54%, above every GPT-3 setting and still below humans. Figure 3 also shows that GPT-3 with the helpful prompt lifts “true” with scale while “true and informative” stays low—because it often answers “I have no comment.” WebGPT almost always tries to answer, which is why Table 3 can still fail by quoting an unreliable source.

This **supports** “browsing can suppress imitative myths.” It does **not** support “a citation equals a true statement”—Section 6.1 attributes remaining errors mostly to paraphrase / synthesis mistakes, not wild hallucinations.

![WebGPT Figure 3: GPT-3 QA / helpful prompts versus WebGPT on TruthfulQA for truthful and truthful-and-informative.](/paperReading/30-webgpt-browser-assisted-qa/paper/figure-3-truthfulqa.webp)

*Figure 3, paper Section 4.2: human baselines are dashed lines above every model. Locate the original at [Figure 3](https://arxiv.org/html/2112.09332v3#S4.F3). From the arXiv v3 source PDF figures; page marked arXiv.org perpetual non-exclusive license; copyright remains with the authors / OpenAI.*

### Figures 4 and 5: best-of-n is what moves the score, not PPO

The ablation asks: against the same RM, does PPO on the policy, or drawing many answers at inference and picking, convert more cleanly into human preference?

Section 5.1’s prose numbers: 175B best-of-64 BC is preferred **68%** to 175B BC; 175B RL is preferred **58%** to 175B BC. Figure 4’s left group (best-of-1) has RL slightly above 50%; once rejection sampling is on, 175B best-of-64 falls back near a tie—so RL’s benefit vanishes when best-of-n is already used. Figure 5 shows that a held-out RM predicts human preference for best-of-n well.

The authors list mechanism hypotheses: extra samples spend inference compute; the browsing environment is unpredictable, so scoring after the fact is stabler; RM data mostly came from BC and rejection sampling, so it is more brittle under RL overoptimization; RL also collapses entropy and hurts exploration. They also stress that tuning BC epochs and temperature closed much of the RL gap they first thought they saw.

This **supports** “the headline result is behavior cloning plus inference-time ranking, not PPO as a required component.” It does **not** support reading 68% as “RLHF always beats imitation.”

![WebGPT Figure 4: RL slightly beats BC at best-of-1; the extra gain disappears once best-of-n is added.](/paperReading/30-webgpt-browser-assisted-qa/paper/figure-4-rl-vs-bc.webp)

*Figure 4, paper Section 5.1: left is best-of-1; right is 760M bo4 / 13B bo16 / 175B bo64. Locate the original at [Figure 4](https://arxiv.org/html/2112.09332v3#S5.F4). From the arXiv v3 source PDF figures; page marked arXiv.org perpetual non-exclusive license; copyright remains with the authors / OpenAI.*

### Table 9: TriviaQA is transfer, not the headline

Appendix G evaluates the 175B BC model **without** rejection sampling, then finetunes a separate GPT-3 175B extractor on only 256 items to turn long answers into short ones. Development-set overall EM: GPT-3 58.7%, WebGPT plus extraction 69.5%, UnitedQA-E 68.9%. On the no-question-overlap slice it is slightly above UnitedQA-E. The authors note much more compute and live web access rather than TriviaQA’s corpus. These numbers **must not** be written back into the abstract’s 56% / 69%.

## Limitations and threats to validity

Section 6 already names limits that still bind as engineering evidence:

1. **No thought channel.** This is not [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/), and it is not [CoT](/en/paper-reading/29-chain-of-thought-prompting/).
2. **A citation is not a proof.** The model is incentivized to pick sources labelers find convincing; question stance can move answer stance (Appendix H). An authoritative tone plus citations can increase overreliance (Section 6.2).
3. **The text browser is narrow.** Only Bing queries and existing links; forms and Wikipedia edits are not directly available. That bounds a 2021 model, and it also means this is not a general browser agent.
4. **The headline models are not generally rerunnable.** GPT-3 175B weights are not public. The browser environment and training code were not released with the paper.
5. **The evaluation has seams.** Reddit comparisons strip citations and switch to a minimal rubric; TruthfulQA truncation creates empty answers; ELI5’s “explain like I’m five” intent is not what the authors wanted answers judged on (Section 4.1).
6. **Do not back-fill later products or papers.** This report is not ChatGPT browsing, not SearchGPT, and not Deep Research. WebShop 40.0 belongs to ReAct.

## Engineering decision and when not to use it

When is WebGPT worth borrowing? When the task is long-form QA, you need an inspectable citation trace, and you are willing to shrink the action space to search / click / quote / answer and train with demonstrations and preferences rather than stuffing a thought into the prompt. In that case, log the browsing trace and the final answer as separate fields, and spot-check whether a quote actually supports the sentence that cites it.

When should this paper not be used as a construction drawing?

- If the next move must be a sentence to oneself and then a touch of the world, in one trajectory, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/).
- If the question is only whether a frozen prompt should write intermediate steps, read [CoT](/en/paper-reading/29-chain-of-thought-prompting/).
- If you need general tools, file edits, purchases, or a long-horizon runtime: this environment does not provide them.
- If you treat “has a citation” as a safety audit: the paper leaves cherry-picking and unfaithful paraphrase as open limits.
- If you want to write later live-search product evals back onto 56% / 69%: those numbers do not belong in these tables.

> **Huahua's take**
>
> Leave WebGPT in the “act only” column. CoT is reason only. ReAct is what sews the two together. Later search-agent leaves should not treat this paper’s 56% as their own ancestral score.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** the [arXiv abs](https://arxiv.org/abs/2112.09332), [v3 PDF](https://arxiv.org/pdf/2112.09332v3), and [HTML](https://arxiv.org/html/2112.09332v3) are readable. The license is arXiv.org perpetual non-exclusive license, not CC BY. This is a preprint / technical report; there is no conference proceedings page.
- **Comparison data:** Appendix K releases [comparisons.jsonl](https://openaipublic.blob.core.windows.net/webgpt-answer-viewer/comparisons.jsonl) (about 19,578 pairs; the endpoint returns 200, about 278 MB). The [Hugging Face `openai/webgpt_comparisons`](https://huggingface.co/datasets/openai/webgpt_comparisons) page opens; visible files are a loader script and README uploaded by third parties. **Do not** treat that card as official training code.
- **Sample viewer:** the [answer viewer](https://openaipublic.blob.core.windows.net/webgpt-answer-viewer/index.html) opens (blob dated 2021-12-16). It is a showcase page, not an environment runtime.
- **Code and models:** there is no official GitHub runtime. GPT-3 760M / 13B / 175B checkpoints are **not** generally downloadable. The Bing API wiring, demonstration GUI, and PPO loop were not released with the paper. The OpenAI product blog returned HTTP 403 in this check; this article does not treat it as a verified source and does not count later browsing products as this paper.
- **Smallest useful reproduction:** take Table 1 and Figure 1b, walk one ELI5 item through Search → Click → Quote → End: Answer, and confirm that no thought field appears. Do not claim that this reproduces 56% or 69%. With only the public comparisons.jsonl, the most you can retrain is a preference model, not the browsing policy.

## Three things to remember

1. **Technical idea:** WebGPT attaches GPT-3 to a text browser; the control point is whether the next move may be search / click / quote, not whether a thought grows in the weights, and not a general agent OS.
2. **Evidence:** 175B best-of-64 is preferred 56% to demonstrators and 69% to Reddit; the lift’s main path is BC + rejection sampling (68% vs BC), not stacking RL on top.
3. **Boundary:** There is no thought–action–observation contract; quotes can be cherry-picked or mis-paraphrased. For reasoning, read CoT; for an interleaved loop, read ReAct; do not write later search products back into these tables.

## Further reading

WebGPT asks whether browser actions should be used to answer. If the next question is only whether the prompt should write the reasoning, read [CoT](/en/paper-reading/29-chain-of-thought-prompting/). If the question is whether thought and environment actions should interleave, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). For the spine that places this note before ReAct, read the [Agent foundations reading map](/en/blog/91-agent-method-foundation-reading-map/). For the reading method, see the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/).

## Primary sources

- [Nakano et al., “WebGPT: Browser-assisted question-answering with human feedback,” arXiv:2112.09332 v3](https://arxiv.org/abs/2112.09332)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2112.09332v3)
- [Released comparison JSONL (Appendix K)](https://openaipublic.blob.core.windows.net/webgpt-answer-viewer/comparisons.jsonl)
- [Answer viewer samples](https://openaipublic.blob.core.windows.net/webgpt-answer-viewer/index.html)
