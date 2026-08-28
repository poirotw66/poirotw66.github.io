---
title: "Transformer: Drop Recurrence for Self-Attention, but WMT 2017 BLEU Is Not a Later LLM Product Contract"
description: "A source-grounded reading of Vaswani et al., NeurIPS 2017 / arXiv:1706.03762: stacked encoder-decoder with multi-head self-attention and positional encodings replaces RNNs and convolutions for machine translation. On WMT 2014, the big model reaches 28.4 BLEU EN-DE and 41.8 BLEU EN-FR; this is 2017 sequence-transduction evidence, not a BERT, GPT-3, or ViT contract."
pubDate: 2026-08-28
updatedDate: 2026-08-28
tldr:
  - "Transformer changes the control point: parallel global self-attention replaces recurrence and convolutions in the encoder-decoder, so every position can interact with the full sequence in constant sequential steps; positional encodings restore order information."
  - "Base setup uses N=6, d_model=512, h=8 heads, d_ff=2048; on 8xP100 GPUs the base model trains in about 12 hours (100K steps). Table 2: Transformer (big) on WMT 2014 newstest2014 reaches 28.4 BLEU EN-DE and 41.8 BLEU EN-FR, with lower training FLOPs than GNMT / ConvS2S ensembles."
  - "This is an MT encoder-decoder, not a pretrained LM, not bidirectional BERT, not decoder-only GPT, and not ViT. Bahdanau-style seq2seq+attention is the named prior; BERT, GPT-2/3, T5, and LLaMA numbers are outside this PDF."
audience:
  - "ML practitioners who finished AlexNet, ResNet, and YOLO and need to separate CV backbones from sequence-transduction control points."
  - "Technical leads deciding whether WMT-era BLEU and training cost transfer to 2026 LLM product SLAs."
tags: ["Paper Reading", "Transformer", "Attention", "Machine Translation", "NLP", "Deep Learning"]
image: "/paperReading/39-attention-is-all-you-need/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - sequence-modeling-foundations
paper:
  title: "Attention Is All You Need"
  authors:
    - "Ashish Vaswani"
    - "Noam Shazeer"
    - "Niki Parmar"
    - "Jakob Uszkoreit"
    - "Llion Jones"
    - "Aidan N. Gomez"
    - "Łukasz Kaiser"
    - "Illia Polosukhin"
  year: 2017
  venue: "NeurIPS 2017 (arXiv 1706.03762 v7)"
  links:
    pdf: "https://arxiv.org/pdf/1706.03762v7"
    arxiv: "https://arxiv.org/abs/1706.03762"
    doi: "https://doi.org/10.48550/arXiv.1706.03762"
    code: "https://github.com/tensorflow/tensor2tensor"
    project: "https://arxiv.org/abs/1706.03762"
series:
  id: "attention-is-all-you-need"
  title: "Original Transformer deep reading"
  part: 1
  totalParts: 1
---

Pair this with the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). This note follows [AlexNet part 1](/en/paper-reading/01-alexnet-paper-reading-part-1/), [part 2](/en/paper-reading/02-alexnet-paper-reading-part-2/), [ResNet](/en/paper-reading/37-resnet-deep-residual-learning/), and [YOLO](/en/paper-reading/38-yolo-you-only-look-once/) on the foundations spine. The first three nodes teach CV classification and detection control points; Transformer moves **sequence transduction (machine translation)** to attention-only stacks and puts **parallelism and WMT BLEU** on the headline evidence table.

## The paper in 90 seconds

- **Problem:** Before 2017, state-of-the-art sequence transduction (seq2seq) relied on RNN/LSTM/GRU encoder-decoders whose computation unfolds along time steps, limiting within-example parallelism on long sequences. Bahdanau et al. already attached attention to RNNs, but recurrence remained the backbone (Sections 1-2).
- **Core insight:** The **Transformer** stacks **multi-head self-attention** and **position-wise FFN** in both encoder and decoder, injects order with **sinusoidal positional encodings**, and removes recurrence and convolutions entirely. The control point is **parallel global attention** versus **sequential hidden states**; path length for long-range dependencies is $O(1)$ per layer (Table 1).
- **Strongest evidence:** WMT 2014 newstest2014 (Table 2): **Transformer (big) reaches 28.4 BLEU EN-DE** (above prior bests including ensembles) and **41.8 BLEU EN-FR**; big-model training takes **3.5 days** on 8xP100 GPUs (300K steps). The base model reaches **27.3 BLEU EN-DE** with training FLOPs of **$3.3\times10^{18}$**, below GNMT+RL at **$2.3\times10^{19}$**. Hardware text: base training **12 hours** / 100K steps at **0.4 seconds per step** (Section 5.2).
- **Main boundary:** The task is **supervised MT encoder-decoder**, not a pretrained language model, not bidirectional BERT, not decoder-only GPT, and not ViT. **BERT, GPT-2/3, T5, LLaMA, and ChatGPT benchmarks are not in this PDF**; YOLO VOC mAP and ResNet ImageNet 4.49% are not MT contracts either.

My bounded verdict: **Transformer is worth keeping as the 2017 control point where attention becomes the new sequential inductive bias and training parallelizes. It is not worth treating WMT 28.4 / 41.8 BLEU or 12-hour / 3.5-day training as a 2026 LLM product SLA.**

> **Huahua's one-liner**
>
> RNNs pass hidden state one step at a time; Transformer lets every token attend across the whole sentence—but Table 2 BLEU is a translation contest score, not a ChatGPT user contract.

## Version and reading scope

This article reads [Vaswani et al., NeurIPS 2017](https://papers.nips.cc/paper/7181-attention-is-all-you-need) as [arXiv:1706.03762 v7](https://arxiv.org/abs/1706.03762) (revised 2017-12-06). The PDF and [arXiv HTML](https://arxiv.org/html/1706.03762v7) carry the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/); Google additionally grants permission to reproduce tables and figures for scholarly commentary. Author order follows v7 (**randomized, equal contribution**): **Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, and Illia Polosukhin**.

Beyond the abstract, I checked Section 3 architecture and attention, Section 4 complexity versus RNN/CNN (Table 1), Section 5 training, Section 6 results (Tables 2-4, appendix Figures 3-5), and artifacts as of **2026-08-28**. BERT, GPT-2/3, T5, ViT, and LLaMA numbers are **not** written back.

## The question a reader should answer

When you need **sequence-to-sequence** transformation (here, English-German and English-French translation), should you keep an RNN encoder-decoder with Bahdanau attention, or replace recurrence with self-attention throughout? Vaswani et al. choose the latter and report WMT BLEU **together with** training FLOPs and wall-clock time.

The precise read is not "Transformer is the best 2026 LLM." The real question is: **how global parallel attention rewires seq2seq data flow and training cost, what WMT-era numbers actually support, and which later pretrained-LM scores must not be copied into this paper's tables.**

## Evidence map

| Layer | How this article uses it |
| --- | --- |
| **Paper directly supports** | Figure 1 encoder-decoder stack; Figure 2 scaled dot-product and multi-head attention; Equations (1)-(2); Table 1 path length and parallelism; Table 2 WMT BLEU and training FLOPs; Table 3 base/big ablations; Table 4 parsing F1; appendix Figures 3-5 attention visualizations. |
| **Author claims** | An attention-only transduction model can be higher quality, more parallelizable, and faster to train; shorter paths help long-range dependencies; the architecture transfers to constituency parsing. |
| **Not established** | Bidirectional pretraining (BERT); decoder-only generative pretraining (GPT); vision Transformers (ViT); instruction tuning / RLHF; arbitrary-length inference product SLAs. |
| **Bloss0m engineering judgment** | Treat this as **foundations spine node five** (sequence transduction), after YOLO. CV starting points: [AlexNet](/en/paper-reading/01-alexnet-paper-reading-part-1/), [ResNet](/en/paper-reading/37-resnet-deep-residual-learning/), [YOLO](/en/paper-reading/38-yolo-you-only-look-once/). Do not mix BERT GLUE, GPT-3 few-shot, or ViT ImageNet into Transformer tables. |

## Why the previous approach is insufficient

Sections 1-2 set the context. **RNN/LSTM/GRU seq2seq** (Sutskever et al., Cho et al.) updates $h_t=f(h_{t-1},x_t)$ along time, so computation is inherently **sequential** and hard to parallelize within long examples. **Bahdanau et al.** add **additive attention** between encoder and decoder, but **recurrence remains the backbone**. **ConvS2S and ByteNet** parallelize with convolutions, yet distant dependencies still require depth or dilation; path length grows with distance (Table 1).

[YOLO](/en/paper-reading/38-yolo-you-only-look-once/) reframes **full-image detection as one regression pass**; [ResNet](/en/paper-reading/37-resnet-deep-residual-learning/) addresses **ImageNet classification depth**—neither handles **variable-length symbol transduction or MT BLEU**.

> **Huahua's engineering note**
>
> "Has attention" is not the same as "no recurrence." Bahdanau attention sits on RNNs; Transformer makes **self-attention the only mixing mechanism**—but WMT BLEU is still a translation metric, not GLUE or MMLU.

## Core intuition

Before the equations, picture English-to-German translation. An **RNN encoder** reads left to right into a hidden chain; an **RNN decoder** generates German step by step, optionally attending back to encoder positions. **Transformer** lets every English subword **attend to all English positions** in each encoder layer (self-attention). The decoder uses **masked self-attention** (left context only) plus **encoder-decoder attention** (full English), with **no $h_{t-1}$ recurrence**.

Three easy confusions:

- **Bahdanau seq2seq + attention:** attention links encoder and decoder, but both sides stay RNN-based.
- **Transformer (this paper):** encoder/decoder stacks are **self-attention + FFN**; order comes from **positional encodings**.
- **Later leaves:** BERT bidirectional MLM, GPT decoder-only pretraining, T5 text-to-text, ViT patch attention—**different tasks and numbers than this 2017 PDF**.

## Walk one example through the method

The following walks **inference** on a simplified English-to-German fragment (a Bloss0m teaching example, not a numbered paper experiment).

1. **Input:** English subword tokens, e.g. `The / cat / sat` (BPE in practice, ~37K vocabulary, Section 5.1).
2. **Intermediate representation:** Token embeddings ($d_{\text{model}}=512$) plus positional encodings enter **six encoder layers**; each layer applies **8-head self-attention** ($d_k=d_v=64$ per head) then **FFN (512 to 2048 to 512)** with residual connections and LayerNorm (Sections 3.1-3.3).
3. **Model or system decision:** The decoder has already emitted `Die / Katze`; the next step combines **masked self-attention** over the left context with **encoder-decoder attention** over all English positions; beam search (beam 4, $\alpha=0.6$, Section 6.1) picks the next subword.
4. **Output:** A full German hypothesis such as `Die Katze saß` for English *sat*.
5. **Likely failure point:** **Long sequences** make self-attention $O(n^2)$ in memory; **copy-like behavior** can appear when alignments are near-literal (appendix Figures 3-5 show head specialization but do not guarantee correct inference). **Rare BPE pieces** still rely on subword segmentation, not LLM-style world knowledge.

## Technical mechanism

### Encoder-decoder stack (Figure 1, Section 3.1)

- **Encoder:** $N=6$ layers; each layer = multi-head self-attention + FFN; residual + LayerNorm; width $d_{\text{model}}=512$.
- **Decoder:** $N=6$ layers; each layer = masked self-attention + encoder-decoder attention + FFN.
- **Big model** (Table 3 last row): $d_{\text{model}}=1024$, $d_{ff}=4096$, $h=16$, 300K steps, $P_{drop}=0.3$ for EN-FR.

### Scaled dot-product attention (Equation 1, Figure 2)

$$
\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V
$$

$Q$, $K$, and $V$ come from linear projections; dividing by $\sqrt{d_k}$ keeps softmax gradients usable at larger $d_k$. Higher compatibility between a query and a key increases that value's weight in the output.

### Multi-head attention (Section 3.2.2)

$h=8$ heads with $d_k=d_v=64$; heads specialize across subspaces (appendix visualizations show syntax and coreference-like patterns). **Encoder-decoder attention** lets each decoder position query the full encoder sequence.

### Positional encoding (Section 3.5)

Sine and cosine features inject position because there is **no recurrence**. Table 3 row (E): learned positional embeddings match the sinusoidal version within ~0.1 BLEU on dev.

![Transformer Figure 1: encoder-decoder stack with multi-head attention and FFN blocks.](/paperReading/39-attention-is-all-you-need/paper/figure-1-transformer-architecture.webp)

*Figure 1, Section 3: Transformer architecture. Source: [arXiv PDF Figure 1](https://arxiv.org/pdf/1706.03762v7#page=3). Extracted from the NeurIPS 2017 camera-ready PDF; Google grants scholarly reproduction per the [arXiv HTML header](https://arxiv.org/html/1706.03762v7). This page crop includes surrounding text; use the PDF for fine detail.*

![Transformer Figure 2: scaled dot-product attention and multi-head attention.](/paperReading/39-attention-is-all-you-need/paper/figure-2-attention.webp)

*Figure 2, Section 3.2: attention mechanisms. Source: [arXiv PDF Figure 2](https://arxiv.org/pdf/1706.03762v7#page=4). License note as for Figure 1.*

## How to read the evidence

### Table 2: BLEU and training cost (Section 6.1)

**Question:** Can Transformer beat GNMT / ConvS2S (including ensembles) at **lower training FLOPs**? **Controls:** WMT 2014 **newstest2014**; beam 4, length penalty 0.6; big model averages the last 20 checkpoints. **Observation:** Transformer (big) reaches **28.4 EN-DE** and **41.8 EN-FR** BLEU; big-model EN-DE training FLOPs are **$2.3\times10^{19}$**, below GNMT+RL ensemble at **$1.8\times10^{20}$**. **Boundary:** This is **2014 MT test data**, not MMLU or HumanEval; **41.8** comes from the Table 2 EN-FR column (consistent with the abstract).

### Table 1: Why recurrence can be removed (Section 4)

**Question:** What does self-attention trade for parallelism and path length? **Observation:** Self-attention uses **$O(1)$ sequential operations** per layer and **$O(1)$ maximum path length**; RNN layers need **$O(n)$**. **Boundary:** Per-layer cost is **$O(n^2 d)$**—long sequences remain expensive; the paper plans restricted attention for future work (end of Section 4).

### Table 3: Ablations (Section 6.2)

**Question:** Which knobs move BLEU on EN-DE dev? **Observation:** Base (six layers, eight heads) reaches **25.8 BLEU** on newstest2013; a single head drops to **24.9**; $N=2$ reaches only **23.7**; $d_{\text{model}}=1024$ improves to **26.0**. **Boundary:** All rows are **EN-DE dev**, not EN-FR test.

### Appendix Figures 3-5: Attention visualizations (Section 4, appendix)

**Question:** Do heads learn interpretable structure? **Observation:** Encoder layer five shows long-distance links such as *making...difficult*; some heads track **coreference**. **Boundary:** Visuals are **qualitative** support, not extra BLEU gains.

![Transformer appendix Figure 3: encoder self-attention long-distance dependency example.](/paperReading/39-attention-is-all-you-need/paper/figure-3-attention-visualization.webp)

*Figure 3, appendix: attention visualization (layer 5 of 6). Source: [arXiv PDF appendix](https://arxiv.org/pdf/1706.03762v7#page=15). This page crop includes other content; colors distinguish heads—see the PDF. License and reuse note as for Figure 1.*

### Table 4: Parsing transfer (Section 6.3)

A four-layer Transformer reaches **91.3 F1** on WSJ with WSJ-only training and **92.7** semi-supervised—architecture transfers, but hyperparameters still follow the MT base setup, not a parsing product SOTA claim.

## Ablations and design choices

- **Head count** (Table 3A): eight heads win; too few or too many hurts BLEU.
- **Smaller $d_k$** (Table 3B): dot-product compatibility gets harder.
- **Depth $N$** (Table 3C): six layers beat two or four.
- **Dropout / label smoothing** (Table 3D): $P_{drop}=0.1$ and $\epsilon_{ls}=0.1$ for base.
- **Checkpoint averaging:** base averages the last five checkpoints; big averages the last twenty (Section 6.1).

## Limitations and threats to validity

1. **Task boundary:** supervised **MT**; not zero-shot LLM usage or retrieval-augmented generation.
2. **$O(n^2)$ attention:** long documents or high-resolution inputs need approximations (the paper's stated future work).
3. **Hardware era:** 8x**P100** GPUs, 12 hours / 3.5 days—remeasure on your cluster and model size today.
4. **Do not backfill:** BERT, GPT-2/3, T5, ViT, LLaMA, and ChatGPT benchmarks **are outside this PDF**.
5. **Keep CV foundations separate:** ResNet / YOLO ImageNet and VOC numbers **must not** enter MT evidence tables.

## Engineering decision and when not to use it

**When to borrow this paper:** If your system needs **global dependencies between sequence elements** and can pay $O(n^2)$ attention cost, the encoder-decoder Transformer remains the textbook starting point. Measure **per-layer attention memory and latency** before chasing BLEU or downstream scores.

**When not to copy it blindly:**

- You need **bidirectional pretraining** (BERT) or **decoder-only generative pretraining** (GPT)—different objectives.
- You need **image patch sequences** (ViT)—different modality and inductive bias.
- You write **28.4 EN-DE BLEU** into a 2026 chat product SLA.
- You confuse the historical **tensor2tensor** repository with the **2017 paper's experimental contract**.

> **Huahua's judgment**
>
> From YOLO, keep "rewrite the control point and put cost on the same table." From Transformer, add one more line: **attention is the new sequential inductive bias, but WMT 2017 BLEU is translation evidence, not a later LLM product contract.**

## Artifacts and reproducibility

As of **2026-08-28**:

- **Paper:** [arXiv abs](https://arxiv.org/abs/1706.03762), [PDF v7](https://arxiv.org/pdf/1706.03762v7), and the [NeurIPS 2017 page](https://papers.nips.cc/paper/7181-attention-is-all-you-need) are readable.
- **Code:** The paper points to [tensorflow/tensor2tensor](https://github.com/tensorflow/tensor2tensor) (Section 7). This environment did not verify one-click reproduction of Table 2; modern PyTorch/JAX ports are downstream implementations.
- **Data:** WMT 2014 EN-DE (~4.5M sentence pairs) and EN-FR (36M sentences); you must obtain the era-appropriate preprocessing pipeline yourself.

The smallest useful reproduction: run encoder-decoder forward plus one masked-attention step on a **tiny parallel corpus** and check that **attention maps are non-degenerate**—mechanism validation, not a 28.4 BLEU replication.

## Three things to remember

1. **Technical idea:** seq2seq transduction via **stacked self-attention + FFN** instead of recurrence; positional encodings restore order; the control point is **parallel global attention**.
2. **Evidence:** Table 2—Transformer (big) **28.4 EN-DE** and **41.8 EN-FR BLEU**; base **12 hours** / big **3.5 days** on 8xP100; training FLOPs below most RNN/CNN SOTA rows.
3. **Boundary:** **MT encoder-decoder**, not BERT / GPT / ViT; AlexNet to ResNet to YOLO to Transformer is the foundations spine: trainable CV to residuals to real-time detection to **sequence transduction**.

## Further reading

If you have not read the CV starting points, return to [AlexNet part 1](/en/paper-reading/01-alexnet-paper-reading-part-1/), [part 2](/en/paper-reading/02-alexnet-paper-reading-part-2/), [ResNet](/en/paper-reading/37-resnet-deep-residual-learning/), and [YOLO](/en/paper-reading/38-yolo-you-only-look-once/). For reading method, see the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). This note covers the **original Transformer**; the next foundations node is [InstructGPT](/en/paper-reading/40-instructgpt-human-feedback/) (post-pretraining human-feedback alignment, not a new architecture). BERT, GPT, T5, and ViT leaves are intentionally not expanded here.

## Primary sources

- [Vaswani et al., "Attention Is All You Need," NeurIPS 2017 / arXiv:1706.03762 v7](https://arxiv.org/abs/1706.03762)
- [NeurIPS 2017 proceedings entry](https://papers.nips.cc/paper/7181-attention-is-all-you-need)
- [DOI 10.48550/arXiv.1706.03762](https://doi.org/10.48550/arXiv.1706.03762)
- [tensor2tensor repository](https://github.com/tensorflow/tensor2tensor)
