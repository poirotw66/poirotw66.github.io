---
title: "InstructGPT: Align Instructions with Human Feedback, but 2022 Preference Win Rates Are Not a Later ChatGPT Product Contract"
description: "A source-grounded reading of Ouyang et al., NeurIPS 2022 / arXiv:2203.02155: on a frozen GPT-3 architecture, a three-stage pipeline—SFT demonstrations, a reward model, and PPO (default PPO-ptx)—aligns a pretrained LM to human preferences. 175B InstructGPT is preferred over 175B GPT-3 85±3% of the time; this is 2022 API labeler evidence, not a ChatGPT product SLA, GPT-4 eval, or DPO contract."
pubDate: 2026-08-28
updatedDate: 2026-08-28
tldr:
  - "InstructGPT changes the control point after next-token pretraining: labeler demonstrations for SFT, human comparisons to train a 6B reward model, then PPO optimization (default PPO-ptx) with a per-token KL penalty; the architecture stays in the GPT-3 family, not a new Transformer."
  - "Figure 1 / Section 4.1: 175B InstructGPT (PPO-ptx) is preferred to 175B GPT-3 85±3% of the time and to few-shot GPT-3 71±4%; 1.3B InstructGPT still beats 175B GPT-3. SFT alone is a major step; PPO adds another gain on top."
  - "This is closed-model 2022 RLHF pipeline evidence, not ChatGPT launch MAU, GPT-4 evals, DPO (Rafailov), Llama-2-chat, or Constitutional AI. BERT NLU, YOLO mAP, and Transformer WMT BLEU numbers are outside this PDF."
audience:
  - "ML practitioners who finished Transformer and need to separate sequence-transduction architecture from post-pretraining alignment control points."
  - "Technical leads deciding whether 2022 labeler preference win rates transfer to 2026 chat product SLAs."
tags: ["Paper Reading", "InstructGPT", "RLHF", "Alignment", "Instruction Following", "NLP"]
image: "/paperReading/40-instructgpt-human-feedback/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - sequence-modeling-foundations
paper:
  title: "Training language models to follow instructions with human feedback"
  authors:
    - "Long Ouyang"
    - "Jeff Wu"
    - "Xu Jiang"
    - "Diogo Almeida"
    - "Carroll L. Wainwright"
    - "Pamela Mishkin"
    - "Chong Zhang"
    - "Sandhini Agarwal"
    - "Katarina Slama"
    - "Alex Ray"
    - "John Schulman"
    - "Jacob Hilton"
    - "Fraser Kelton"
    - "Luke Miller"
    - "Maddie Simens"
    - "Amanda Askell"
    - "Peter Welinder"
    - "Paul Christiano"
    - "Jan Leike"
    - "Ryan Lowe"
  year: 2022
  venue: "NeurIPS 2022 (arXiv 2203.02155 v1)"
  links:
    pdf: "https://arxiv.org/pdf/2203.02155v1"
    arxiv: "https://arxiv.org/abs/2203.02155"
    doi: "https://doi.org/10.48550/arXiv.2203.02155"
    code: "https://github.com/openai/following-instructions-human-feedback"
    project: "https://arxiv.org/abs/2203.02155"
series:
  id: "instructgpt-human-feedback"
  title: "Original InstructGPT deep reading"
  part: 1
  totalParts: 1
---

Pair this with the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). This note follows [AlexNet part 1](/en/paper-reading/01-alexnet-paper-reading-part-1/), [part 2](/en/paper-reading/02-alexnet-paper-reading-part-2/), [ResNet](/en/paper-reading/37-resnet-deep-residual-learning/), [YOLO](/en/paper-reading/38-yolo-you-only-look-once/), and [Transformer](/en/paper-reading/39-attention-is-all-you-need/) on the foundations spine. Transformer teaches sequence-transduction architecture; InstructGPT moves the **post-pretraining control point** to **human-feedback alignment (SFT → RM → PPO)** on the **same GPT-3 architecture**, and puts **labeler preference win rates** on the headline evidence table.

## The paper in 90 seconds

- **Problem:** Bigger LMs do not automatically follow user intent better. GPT-3-class models under a next-token pretraining objective often produce untruthful, toxic, or unhelpful outputs (Section 1). Language modeling is misaligned with responding helpfully and safely to instructions.
- **Core insight:** On a **frozen GPT-3 architecture**, run three stages: **(1) SFT**—fine-tune on demonstrations from about 40 contractors; **(2) RM**—train a **6B** reward model on human rankings; **(3) PPO**—optimize the policy against RM scores with a **per-token KL penalty** toward SFT; the default **PPO-ptx** mixes pretraining gradients to reduce public NLP regressions (Figure 2, Equation 2, Section 3.5). The control point is **human-preference alignment**, not a new attention stack.
- **Strongest evidence:** Labeler preference evals on the API prompt distribution (Figure 1, Section 4.1): **175B InstructGPT is preferred to 175B GPT-3 85±3%** of the time; to few-shot GPT-3 **71±4%**; **1.3B InstructGPT still beats 175B GPT-3** (>100× parameter gap). Versus the 175B SFT baseline, InstructGPT wins **73.4±2%**, beating FLAN/T0 fine-tunes (26.8±2%, 29.8±2%).
- **Main boundary:** **Closed 2022 GPT-3 family** models; preferences come from a specific labeler pool and API Playground distribution (Sections 5.2–5.3). **ChatGPT product metrics, GPT-4, DPO, Llama-2-chat, and Constitutional AI are outside this PDF**; YOLO mAP and Transformer WMT BLEU are not alignment contracts.

My bounded verdict: **keep the 2022 engineering lesson that post-pretraining SFT+RM+PPO rewrites the control point; do not treat 85±3% preference win rates as a 2026 chat product SLA.**

> **Huahua's one-liner**
>
> The architecture is still GPT-3; the pipeline changes—copy labeler demos, score with a reward model, then PPO-chase the score. Figure 1 win rates are 2022 labeler preferences, not a ChatGPT MAU contract.

## Version and reading scope

This reading follows [Ouyang et al., NeurIPS 2022](https://arxiv.org/abs/2203.02155) as [arXiv:2203.02155 v1](https://arxiv.org/abs/2203.02155) (2022-03-04). The PDF carries the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/). Author order follows v1 (* marks equal contribution): **Long Ouyang, Jeff Wu, Xu Jiang, Diogo Almeida, Carroll L. Wainwright, Pamela Mishkin, Chong Zhang, Sandhini Agarwal, Katarina Slama, Alex Ray, John Schulman, Jacob Hilton, Fraser Kelton, Luke Miller, Maddie Simens, Amanda Askell, Peter Welinder, Paul Christiano, Jan Leike, and Ryan Lowe**.

Beyond the abstract, this note checks Section 3 (Figure 2, Equations 1–2), Section 4 results (Figures 1, 3–7), Section 5 discussion and limits, and the `openai/following-instructions-human-feedback` link as of **2026-08-28**. ChatGPT, GPT-4, DPO, and Llama-2-chat numbers are **not** backfilled.

## The reader question

Given a **pretrained GPT-3-class LM**, should you rely on scale and prompt engineering, or add **SFT, a reward model, and PPO on a frozen architecture** to follow natural-language instructions on open-ended tasks? Ouyang et al. choose the latter and report **labeler preference win rates** alongside TruthfulQA, toxicity, and hallucination slices.

The precise question is not whether InstructGPT is the strongest 2026 chat system. It is **how the three-stage RLHF pipeline rewrites post-pretraining data flow, what preference win rates actually contract for, and which later product numbers must not be imported.**

## Evidence map

| Layer | How this article uses it |
| --- | --- |
| **Paper directly supports** | Figure 1 preference eval; Figure 2 three-stage pipeline; Figure 3 held-out labeler win rates; Figure 4 metadata; Equation (1) RM loss and Equation (2) PPO-ptx objective; Table 1 API use-case mix; Section 3.2 dataset sizes (SFT ~13k, RM ~33k, PPO ~31k prompts). |
| **Author claims** | Human-feedback fine-tuning aligns broad instruction tasks; preference win rates beat GPT-3 and SFT-only; PPO-ptx reduces alignment tax; alignment cost is far below retraining GPT-3. |
| **Not established** | ChatGPT product performance; GPT-4 / Claude-class systems; DPO-style RL-free preference optimization; universal cross-user preference; fully open reproduction of the 175B pipeline. |
| **Bloss0m engineering judgment** | Treat this as **foundations spine node six** (instruction alignment), after [Transformer](/en/paper-reading/39-attention-is-all-you-need/). Do not mix BERT GLUE, YOLO VOC, or WMT BLEU into RLHF tables; do not write 85±3% as a ChatGPT SLA. |

## Why the previous approach is insufficient

Sections 1–2 set the context. **Pure pretrained LMs** optimize next-token prediction, which misaligns with helpful, honest, harmless use. **Prompt engineering / few-shot prefixes** (GPT-3 prompted) help modestly but stay far below SFT and PPO in Figure 1. **SFT alone** imitates demonstrations but lacks ranked preference signal. **FLAN / T0** fine-tunes on public NLP tasks; on the API distribution they trail SFT and InstructGPT (Section 4.1, Figure 5).

[Transformer](/en/paper-reading/39-attention-is-all-you-need/) addresses **encoder–decoder transduction and WMT BLEU**; [YOLO](/en/paper-reading/38-yolo-you-only-look-once/) addresses **unified detection**—neither tackles **post-pretraining human-preference alignment**.

> **Huahua's engineering note**
>
> A capable LM is not the same as an instruction-following LM. InstructGPT evidence is **which output labelers prefer on API prompts**—not MMLU scores or post-ChatGPT retention.

## Core intuition

Skip the PPO notation for a moment. Picture a pretrained **175B GPT-3** asked to “list five ideas to regain enthusiasm for my career.” It may ramble in web-page style, miss the instruction, or hallucinate.**SFT** shows tens of thousands of **labeler-written ideal answers** to imitate.**The RM** learns which of several candidates humans prefer.**PPO** lets the model **generate freely**, scores with the RM, and pulls each token back with a **KL penalty** so it does not drift too far from SFT.

Three easy-to-confuse next steps:

- **GPT-3 base + prompt:** no weight change; cheap but capped (Figure 1).
- **InstructGPT (this paper):** SFT → 6B RM → PPO (default PPO-ptx); still GPT-3 architecture.
- **Later leaves:** ChatGPT the product, GPT-4, DPO, Constitutional AI—**numbers and system boundaries are outside the 2022 PDF**.

## Walk one example through the method

A simplified API prompt through **inference and training** (Bloss0m teaching example, not a paper table row).

1. **Input:** “Explain gradient vanishing in at most two paragraphs.” (Generation/QA mix common in Table 1.)
2. **Intermediate representation:** tokenized input through the **same GPT-3 transformer stack**; SFT already saw similar demos; the RM ranked concise vs verbose vs wrong answers.
3. **Model or system decision:** the PPO policy autoregresses; RM reward accumulates per token minus $\beta \log(\pi_{\mathrm{RL}}/\pi_{\mathrm{SFT}})$ KL (Equation 2); PPO-ptx also mixes pretraining gradients ($\gamma$ in Appendix C is 27.8).
4. **Output:** a two-paragraph, instruction-following explanation (in the ideal case).
5. **Likely failure point:** **false premises**—the model may accept bad assumptions (Figure 9); **over-hedging** on simple questions; **reward hacking** if the RM has blind spots; **closed labeler distribution**—preferences may not match your end users (Section 5.2).

## Technical mechanism

### Three-stage pipeline (Figure 2, Section 3.1)

- **Step 1 SFT:** labeler demonstrations on API / labeler-written prompts; fine-tune GPT-3. **~13k** training prompts; **16 epochs** (Section 3.5).
- **Step 2 RM:** labelers rank $K{=}4$–$9$ candidates; train a **6B** reward model (175B RM unstable per Appendix C). **~33k** training prompts.
- **Step 3 PPO:** optimize SFT against RM reward with **per-token KL** toward SFT; default **PPO-ptx** mixes pretraining gradients. **~31k** PPO prompts (inputs only, no human labels).

Model sizes: **1.3B, 6B, 175B**, all **GPT-3 architecture** (Section 3.5).

### Reward model loss (Equation 1, Section 3.5)

$$
\operatorname{loss}(\theta)=-\frac{1}{\binom{K}{2}} E_{(x,y_w,y_l)\sim D}\left[\log\left(\sigma\left(r_\theta(x,y_w)-r_\theta(x,y_l)\right)\right)\right]
$$

$r_\theta(x,y)$ is the scalar reward for prompt $x$ and completion $y$; $y_w$ is the human-preferred side. Larger $r_\theta(x,y_w)-r_\theta(x,y_l)$ lowers loss and better matches rankings.

### PPO-ptx objective (Equation 2, Section 3.5)

$$
\operatorname{objective}(\phi)=E_{(x,y)\sim D_{\pi_\phi^{\mathrm{RL}}}}\left[r_\theta(x,y)-\beta\log\frac{\pi_\phi^{\mathrm{RL}}(y\mid x)}{\pi^{\mathrm{SFT}}(y\mid x)}\right]+\gamma E_{x\sim D_{\mathrm{pretrain}}}\left[\log\pi_\phi^{\mathrm{RL}}(x)\right]
$$

$\beta$ controls KL penalty strength; $\gamma$ controls pretraining mix (zero for plain PPO). **Unless stated otherwise, InstructGPT means PPO-ptx in this paper.**

![InstructGPT Figure 1: preference evals versus the 175B SFT model across model sizes.](/paperReading/40-instructgpt-human-feedback/paper/figure-1-preference-eval.webp)

*Figure 1, paper Section 1 / 4.1: human preference evals on the API prompt distribution; 1.3B PPO-ptx beats 175B GPT-3. Original at [arXiv PDF Figure 1](https://arxiv.org/pdf/2203.02155v1#page=1). Cropped from the NeurIPS 2022 camera-ready PDF; [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/). This crop includes surrounding text; see the PDF for full detail.*

![InstructGPT Figure 2: SFT, reward-model training, and PPO.](/paperReading/40-instructgpt-human-feedback/paper/figure-2-rlhf-pipeline.webp)

*Figure 2, paper Section 3.1: three-step method—demonstration data trains SFT, ranking data trains the RM, PPO optimizes the policy. Original at [arXiv PDF Figure 2](https://arxiv.org/pdf/2203.02155v1#page=3). License note same as Figure 1.*

## How to read the evidence

### Figure 1 / Section 4.1: preference win rates (headline)

**Question:** How much do labelers prefer InstructGPT over **175B GPT-3** and over **SFT alone**? **Controls:** held-out API test prompts; three labelers; 95% CIs. **Observation:** ladder GPT-3 < GPT-3 prompted < SFT < PPO < PPO-ptx; **direct 175B vs GPT-3 comparison 85±3%**; **vs few-shot GPT-3 71±4%**; **1.3B PPO-ptx still beats 175B GPT-3**. **Boundary:** **2022 contractor preferences**, not product NPS; Playground-skewed prompts.

### Figure 3: held-out labelers and GPT-3 API prompts

**Question:** Overfit to training labelers? Still true on **prompts submitted to GPT-3**? **Observation:** held-out labelers rank similarly; conclusions largely hold on GPT-3 prompts (Section 4.1). **Boundary:** still **English-majority, specific contractor pool**.

![InstructGPT Figure 3: win rates versus 175B SFT across labeler splits and API prompt sources.](/paperReading/40-instructgpt-human-feedback/paper/figure-3-winrate-panels.webp)

*Figure 3, paper Section 4.1: win rate vs 175B SFT; left GPT API prompts, right InstructGPT API prompts; top held-out labelers, bottom training labelers. Original at [arXiv PDF Figure 3](https://arxiv.org/pdf/2203.02155v1#page=8). Crop includes other page content; PDF is authoritative. License note same as Figure 1.*

### Figure 4 / supporting metrics: TruthfulQA, toxicity, hallucination

**Question:** Beyond preferences, do truthfulness / toxicity / hallucination improve? **Observation:** on TruthfulQA, **truthful and informative answers about twice as often as GPT-3** (Figure 6, Section 4.2); closed-domain hallucination **21% vs 41%** (Section 1); with a respectful prompt, **~25% fewer toxic outputs** (Section 4.2). **Boundary:** **bias** (Winogender, CrowS-Pairs) **does not clearly improve**; public NLP (SQuAD, DROP, etc.) shows **alignment tax**, partially mitigated by PPO-ptx (Section 4.2).

![InstructGPT Figure 4: metadata scores on the API distribution (appropriateness, instruction following, hallucination).](/paperReading/40-instructgpt-human-feedback/paper/figure-4-metadata.webp)

*Figure 4, paper Section 4.1: PPO models score better than GPT-3 on customer-assistant appropriateness, constraint following, and reduced hallucination. Original at [arXiv PDF Figure 4](https://arxiv.org/pdf/2203.02155v1#page=9). License note same as Figure 1.*

### Cost (Section 5.1)

**175B SFT** ~**4.9 petaflops/s-days**; **175B PPO-ptx** ~**60**; versus **GPT-3 pretraining 3640** (Brown et al., 2020). Authors argue alignment spend is **much smaller than pretraining**, and aligned 1.3B can beat 175B base.

## Ablations and design choices

- **SFT-only vs +PPO** (Figure 1): SFT is a big jump; PPO adds another—**read both stages**.
- **PPO vs PPO-ptx:** similar preference scores; PPO-ptx cuts public NLP regression (Section 4.2, Figure 29).
- **KL vs pretraining mix** (Figures 33–34): larger KL hurts validation reward; **ptx mixing** recovers SQuAD/DROP better.
- **RM size:** **6B RM** in practice, not 175B (unstable).
- **FLAN / T0 baselines** (Figure 5): public instruction tuning **trails** API-preference RLHF; head-to-head **78±4%** (vs FLAN), **79±4%** (vs T0).

## Limitations and threats to validity

1. **Alignment target:** ~**40** contractors, **~73%** agreement (Sections 3.4, 5.2)—**not universal human values**.
2. **Task boundary:** API Playground prompts; **96%+ English**; not full production API traffic.
3. **Safety gaps:** still toxic, biased, or fabricated; **can be more toxic when instructed to be toxic** (Sections 4.2, 5.3).
4. **Do not backfill:** ChatGPT launch stats, GPT-4, Claude, DPO, Llama-2-chat, o1.
5. **Keep other foundations nodes separate:** WMT BLEU, YOLO mAP, ImageNet top-5 **must not** enter RLHF evidence tables.

## Engineering decision and when not to use it

**When to borrow this paper?** You already have a **large base LM**, pain is **instruction following / style / preference mismatch**, and you can fund **demos + rankings + RL training**—three-stage RLHF remains the textbook starting point. Measure **labeler agreement and RM calibration** before citing win rates.

**When not to copy blindly?**

- You need **fully open 175B reproduction**—checkpoints and data are **not fully released**.
- You have **little SFT data** but expect ChatGPT-class behavior—RM+PPO still has cost and data-quality floors.
- You write **85±3%** into a 2026 product SLA or conflate **the InstructGPT paper** with **ChatGPT the product**.
- You assume **DPO / RL-free preference optimization** is proven here—that is later work.

> **Huahua's judgment**
>
> From Transformer, keep “match the control point to the era’s evidence.” From InstructGPT, add: **alignment is a post-pretraining training procedure; 2022 preference win rates are a research contract, not a chat product warranty.**

## Artifacts and reproducibility

Artifact status as of 2026-08-28:

- **Paper:** [arXiv abs](https://arxiv.org/abs/2203.02155) and [PDF v1](https://arxiv.org/pdf/2203.02155v1) are readable.
- **Samples:** [openai/following-instructions-human-feedback](https://github.com/openai/following-instructions-human-feedback) releases sampled outputs on some NLP tasks; **not** a full 175B retraining recipe.
- **Weights:** **175B InstructGPT checkpoints are not public**; reproduction needs your own base LM and labeling budget.

Minimal useful reproduction: run **SFT → RM → PPO** on a **small model** and log **KL and reward curves**—validate mechanism, not 85±3%.

## Three things to remember

1. **Technical idea:** frozen GPT-3 architecture; **SFT demos → 6B RM rankings → PPO (+KL, default PPO-ptx)**; control point is **human-preference alignment**, not a new Transformer.
2. **Evidence:** Figure 1—**175B InstructGPT vs GPT-3 85±3%**, vs few-shot **71±4%**; **1.3B beats 175B GPT-3**; supported by TruthfulQA / toxicity / hallucination slices.
3. **Boundary:** **closed 2022 API labeler preferences**; not ChatGPT / GPT-4 / DPO; AlexNet → … → Transformer → **InstructGPT** is the foundations spine: CV → sequence transduction → **instruction alignment**.

## Further reading

If you have not read the sequence node, return to [Transformer](/en/paper-reading/39-attention-is-all-you-need/). For reading method, see the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). The next foundations spine node is [Speculative Decoding](/en/paper-reading/41-speculative-decoding/) (lossless inference acceleration on frozen weights, not a new architecture). To contrast **in-prompt reasoning** and **browser-assisted QA** control points, see [CoT](/en/paper-reading/29-chain-of-thought-prompting/) and [WebGPT](/en/paper-reading/30-webgpt-browser-assisted-qa/)—they **do not change the post-training preference pipeline** and complement this note. BERT, GPT-2/3 pretraining, ChatGPT the product, and DPO leaves are intentionally out of scope.

## Primary sources

- [Ouyang et al., “Training language models to follow instructions with human feedback,” NeurIPS 2022 / arXiv:2203.02155 v1](https://arxiv.org/abs/2203.02155)
- [DOI 10.48550/arXiv.2203.02155](https://doi.org/10.48550/arXiv.2203.02155)
- [Sample outputs repository](https://github.com/openai/following-instructions-human-feedback)
