---
title: "Speculative Decoding: Draft with a Small Model, Verify in Parallel, but T5 Speedups Do Not Represent Every Serving Stack"
description: "A source-grounded reading of Leviathan et al., ICML 2023 / arXiv:2211.17192: a cheap draft model M_q proposes tokens, the target model M_p verifies a chunk in parallel, and rejection sampling keeps the output distribution identical to target-only decoding. T5-XXL 11B reaches 2.3X-3.4X wall-clock speedup on T5X; this is 2023 lossless inference-algorithm evidence, not a GPTQ, FlashAttention, vLLM, Medusa, or EAGLE contract."
pubDate: 2026-08-28
updatedDate: 2026-08-28
tldr:
  - "Speculative Decoding changes the control point: a cheap M_q autoregressively drafts gamma tokens, then M_p evaluates gamma+1 forward positions in parallel and speculative sampling (rejection sampling) decides how many drafts to accept; the output distribution matches M_p alone, not distillation or quantization."
  - "Algorithm 1 plus Theorem 3.8: acceptance rate alpha and draft length gamma set how many tokens each target call produces. Table 2: T5-XXL 11B plus T5-small 77M on WMT EnDe reaches 3.4X (temp=0) and 2.6X (temp=1); CNN/DM reaches 3.1X and 2.3X; batch=1, single TPU-v4, versus the T5X baseline."
  - "This is an inference algorithm, not a new architecture, not alignment, and not weight quantization. It needs a usable draft model and spare parallel compute; it helps most when memory bandwidth dominates. vLLM tokens/s, GPTQ perplexity, and Medusa/EAGLE numbers are outside this PDF."
audience:
  - "ML practitioners who finished InstructGPT and need to separate training alignment from lossless inference acceleration."
  - "Technical leads deciding whether T5-era 2X-3X wall-clock numbers transfer to 2026 serving-stack SLAs."
tags: ["Paper Reading", "Speculative Decoding", "Inference", "Transformer", "NLP", "Deep Learning"]
image: "/paperReading/41-speculative-decoding/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - sequence-modeling-foundations
paper:
  title: "Fast Inference from Transformers via Speculative Decoding"
  authors:
    - "Yaniv Leviathan"
    - "Matan Kalman"
    - "Yossi Matias"
  year: 2023
  venue: "ICML 2023 (arXiv 2211.17192 v2)"
  links:
    pdf: "https://arxiv.org/pdf/2211.17192"
    arxiv: "https://arxiv.org/abs/2211.17192"
    doi: "https://doi.org/10.48550/arXiv.2211.17192"
    project: "https://arxiv.org/abs/2211.17192"
series:
  id: "speculative-decoding"
  title: "Original Speculative Decoding deep reading"
  part: 1
  totalParts: 1
---

Pair this with the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). In this site's foundations sequence, the note follows [InstructGPT](/en/paper-reading/40-instructgpt-human-feedback/). InstructGPT covers post-pretraining alignment; Speculative Decoding keeps target weights frozen and accelerates inference through drafting plus parallel verification, using wall-clock speedup and acceptance rate alpha as its core evidence.

[YOLO](/en/paper-reading/38-yolo-you-only-look-once/) also treats latency as a first-class metric, but the experiments are not interchangeable: this paper measures T5-XXL decoding, not VOC mAP.

## The paper in 90 seconds

- **Problem:** Decoding K tokens from a large autoregressive Transformer takes K **serial** forward passes; each step is often limited by **memory bandwidth** rather than raw arithmetic throughput, leaving spare parallel capacity idle (Section 1).
- **Core insight:** **Speculative Decoding** lets a small model M_q autoregressively draft gamma tokens, then runs the target model M_p **in parallel** on the prefix through each draft position to obtain distributions p_1 through p_{gamma+1}. **Speculative sampling** (rejection sampling plus an adjusted distribution) decides how many drafts to accept and adds one token guaranteed to come from M_p. The control point is **lossless parallel verification** versus **step-by-step target-only decoding**; the output distribution is **identical** to M_p alone (Algorithm 1, Appendix A.1).
- **Strongest evidence:** T5-XXL **11B** as M_p and off-the-shelf T5-small **77M** as M_q versus the T5X baseline, **batch=1**, **single TPU-v4** (Table 2): WMT EnDe **3.4X** (temp=0, gamma=7, alpha=0.75) and **2.6X** (temp=1, alpha=0.62); CNN/DM **3.1X** and **2.3X**. The abstract and Section 4 also report a **2X-3X** band relative to T5X.
- **Main boundary:** You need a **task-aligned draft model** and **compute that can host gamma+1 parallel M_p forwards**; total **arithmetic operations can rise** (Sections 3.4 and 6). This is a **2023 Google T5X experimental contract**, not a vLLM or TensorRT-LLM product SLA, not GPTQ bitwidth, and not Medusa or EAGLE draft heads. InstructGPT 85±3% win rates, Transformer WMT BLEU, and YOLO mAP are not in this PDF.

My conclusion: **Speculative Decoding's lasting contribution is using a draft model to reduce wall-clock decoding time without changing the target distribution. Table 2's 3.4X applies to the paper's setup and cannot guarantee performance for every 2026 LLM serving stack.**

> **Huahua's one-liner**
>
> The small model guesses, the large model verifies in one parallel pass; accept drafts when rejection sampling says yes, otherwise correct back to M_p. But Table 2's 3.4X is T5X on a TPU-v4, not vLLM dashboard tokens/s.

## Version and reading scope

This article reads [Leviathan et al., ICML 2023](https://proceedings.mlr.press/v202/leviathan23a.html) as [arXiv:2211.17192 v2](https://arxiv.org/abs/2211.17192) (revised 2023-05-18). The PDF carries the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/). Author order follows v2: **Yaniv Leviathan, Matan Kalman, and Yossi Matias** (**Leviathan and Kalman contributed equally**).

Beyond the abstract, I checked Section 2 (algorithm and speculative sampling), Section 3 (acceptance rate and wall-clock analysis: Theorem 3.8, Figures 2-5, Table 1), Section 4 T5-XXL experiments (Tables 2-3), Section 6 limitations, and paper readability as of **2026-08-28**. GPTQ, AWQ, FlashAttention TFLOPS, vLLM, Medusa, EAGLE, and Lookahead numbers are **not** written back.

## The question a reader should answer

When you already have a trained large autoregressive model M_p and decoding latency is the product bottleneck, should you keep **sampling M_p one token at a time**, or let a smaller M_q draft and have M_p **verify in parallel**? Leviathan et al. choose the latter and report both a **distribution-equivalence proof** and **T5-XXL wall-clock tables**.

The precise read is not "this is the fastest 2026 LLM inference stack." The real question is: **how rejection sampling preserves losslessness, how alpha and gamma translate into tokens per target call, what Table 2 actually contracts for hardware, and which later serving, quantization, or learned-draft numbers must not be copied into this paper's tables.**

## Evidence map

| Layer | How this article uses it |
| --- | --- |
| **Paper directly supports** | Figure 1 unconditional-generation sketch (green=accepted drafts, red=rejected, blue=corrected); Algorithm 1; Equation (1) expected tokens per iteration; Theorem 3.5 beta=1-D_LK(p,q) and Corollary 3.6 alpha=E(min(p,q)); Theorem 3.8 wall-clock formula; Table 1 theoretical speed/ops; Table 2 T5-XXL measurements; Table 3 alpha across tasks; Figure 5 encoder-decoder trace. |
| **Author claims** | Large-model decoding can speed up via speculative execution **without changing the output distribution**; extra parallelism pays when memory bandwidth is the bottleneck; off-the-shelf small Transformers as M_q already yield 2X-3X; negligible-cost drafts such as n-grams can still have nonzero alpha. |
| **Not established** | vLLM or TensorRT-LLM SLAs on arbitrary hardware; GPTQ or AWQ quality; Medusa or EAGLE learned draft heads; FlashAttention kernel wins; adaptive computation with **identical distribution** guarantees after retraining. |
| **Bloss0m engineering judgment** | Place this note in the lossless-inference-efficiency section, after InstructGPT. [YOLO](/en/paper-reading/38-yolo-you-only-look-once/) offers a useful latency comparison, while [InstructGPT](/en/paper-reading/40-instructgpt-human-feedback/) helps distinguish model architecture from later procedures. GPTQ WikiText, vLLM tokens/s, and Medusa acceptance do not belong in Table 2. |

## Why the previous approach is insufficient

Sections 1 and 5 set the context. **Standard autoregressive decoding** calls M_p once per emitted token, so K tokens need K serial forwards. Even when per-step FLOPs are modest, **weight and KV-cache memory traffic** often dominates latency.

Common acceleration routes differ from this paper:

- **Distillation, quantization, architecture changes** (Hinton et al., Hubara et al., So et al.): usually **change the model or retrain** and **do not guarantee** the same distribution as M_p.
- **Adaptive computation and early exits** (Han et al., Schwartz et al.): heuristics skip work but **do not guarantee** M_p's distribution.
- **Blockwise Parallel Decoding and SAD** (Stern et al., Sun et al.): need **extra training** or restrict to greedy or copy-input settings, not general stochastic lossless decoding.
- **Greedy or nucleus sampling with M_p alone**: distribution-correct but **cannot** verify multiple tokens in one M_p call.

[InstructGPT](/en/paper-reading/40-instructgpt-human-feedback/) addresses **alignment training**; [Transformer](/en/paper-reading/39-attention-is-all-you-need/) addresses **sequence-transduction architecture**. Neither solves **decoding wall-clock without changing weights**.

> **Huahua's engineering note**
>
> "Use a small model to help" via distillation gives you **a different distribution**; Speculative Decoding's point is **rejection sampling pulls the distribution back to M_p**. Table 2 is still T5 task evidence, not ChatGPT product latency.

## Core intuition

Before Algorithm 1, picture target model M_p continuing an English summary.

**Standard decoding:** M_p runs one step, samples t_1, runs again, samples t_2, and so on. Each step waits for a full M_p forward.

**Speculative Decoding:** a much cheaper M_q (for example T5-small) **autoregressively guesses** gamma tokens x_1 through x_gamma. M_p evaluates the prefix and each prefix plus drafts **in parallel**, yielding p_1 through p_{gamma+1}. Each x_i faces a rejection test with acceptance probability min(1, p_i(x_i)/q_i(x_i)). At the first rejection, sample a correction from p'=norm(max(0,p-q)), guaranteed to come from M_p. If all drafts pass, sample one more token from p_{gamma+1}.

Three easy confusions:

- **Target-only stepwise decoding (baseline):** correct distribution, wall-clock equals K serial M_p calls.
- **Speculative Decoding (this paper):** still correct (Appendix A.1), wall-clock depends on **how many drafts survive each round**.
- **Deploy a distilled small model alone:** may be faster, but **no longer M_p's distribution**; a different problem statement.

## Walk one example through the method

The following walks **one Algorithm 1 round** on a simplified **T5 English-to-German** fragment (a Bloss0m teaching example, not a Table 2 row).

1. **Input:** the encoder has consumed the English sentence; the decoder prefix is `<s> Die` (partial German already emitted).
2. **Intermediate representation:** M_q=T5-small autoregressively drafts gamma=3 tokens, for example `Katze / schläft / gut`, with per-step q_i recorded.
3. **Model or system decision:** M_p=T5-XXL computes p_1 through p_4 **in parallel**. Suppose `Katze` and `schläft` pass rejection (r_i <= p_i(x_i)/q_i(x_i)) but `gut` fails; sample correction `friedlich` from p'=norm(max(0,p_3-q_3)).
4. **Output:** new prefix `<s> Die Katze schläft friedlich` (**two accepted drafts plus one corrected token** this round).
5. **Likely failure point:** if M_q is a poor match to M_p (low alpha), almost every round emits **only one** token while still paying gamma M_q steps, **slower than baseline** (Corollary 3.9: need alpha>c for net speedup). Misaligned task, tokenizer, or architecture also crushes alpha.

## Technical mechanism

### Speculative sampling (Section 2.3)

To sample from p(x), propose x from q(x): accept when q(x)<=p(x); when q(x)>p(x), reject with probability 1-p(x)/q(x) and resample from p'(x)=norm(max(0,p(x)-q(x))). Appendix A.1 shows the marginal remains p(x).

### Algorithm 1: one decoding round (Sections 2.1-2.3)

- Inputs: M_p, M_q, prefix.
- M_q autoregressively produces x_{1..gamma} and q_i.
- M_p computes p_1 through p_{gamma+1} **in parallel**.
- n <- index of first failed rejection minus one (or gamma if all pass).
- If n<gamma, sample correction t from adjusted p_{n+1}; else sample t from p_{gamma+1}.
- Output: prefix plus accepted x_{1..n} plus t (at least **one** new token on the M_p chain).

### Acceptance rate and expected throughput (Sections 3.1-3.2)

Acceptance rate beta_{x_{<t}} = Pr[accept x_t ~ q]; alpha = E(beta). Under an i.i.d. simplification, expected tokens per round:

$$
E(\#\ \text{generated tokens}) = \frac{1-\alpha^{\gamma+1}}{1-\alpha}
$$

Theorem 3.5: beta = 1 - D_LK(p,q) for a symmetric divergence D_LK. Corollary 3.6: alpha = E(min(p,q)), so **the closer M_q is to M_p, the higher alpha**.

### Wall-clock speedup (Theorem 3.8, Section 3.3)

Let c be the ratio of one M_q step time to one M_p step time. Each Algorithm 1 round costs about T(c*gamma + 1) and produces the expectation above, giving improvement factor:

$$
\frac{1-\alpha^{\gamma+1}}{(1-\alpha)(\gamma c + 1)}
$$

In the paper's experiments M_q is often **two orders of magnitude smaller** than M_p, with c < 0.05 and often near zero (Section 3.3).

![Speculative Decoding Figure 1: unconditional language-model generation with green drafts accepted by M_p.](/paperReading/41-speculative-decoding/paper/figure-1-speculative-illustration.webp)

*Figure 1, Section 1: speculative decoding sketch (green=accepted, red=rejected, blue=corrected). Source: [arXiv PDF Figure 1](https://arxiv.org/pdf/2211.17192#page=1). Extracted from the ICML 2023 camera-ready PDF; [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/). This crop includes surrounding text; use the PDF for fine detail.*

![Speculative Decoding Figure 2: expected tokens per Algorithm 1 iteration versus alpha and gamma.](/paperReading/41-speculative-decoding/paper/figure-2-expected-tokens-vs-alpha.webp)

*Figure 2, Section 3.1: E(tokens) versus alpha (Equation 1). Source: [arXiv PDF Figure 2](https://arxiv.org/pdf/2211.17192#page=3). License note as for Figure 1.*

## How to read the evidence

### Table 2: T5-XXL wall-clock (Section 4.1)

**Question:** versus the **T5X baseline**, can off-the-shelf small T5 models as M_q deliver **2X-3X** speedup with identical outputs? **Controls:** M_p=T5-XXL **11B**; tasks WMT EnDe and CNN/DM summarization; **batch=1**; **single TPU-v4**; existing checkpoints; argmax (temp=0) and standard sampling (temp=1). **Observation:** T5-small (77M) wins overall: EnDe **3.4X** (gamma=7, alpha=0.75) and **2.6X** (gamma=7, alpha=0.62); CNN/DM **3.1X** (gamma=5, alpha=0.65) and **2.3X** (gamma=5, alpha=0.53). T5-large shows higher alpha but larger c, so speedup falls to **1.4X-1.7X**. **Boundary:** **Google-internal T5X implementation**; not default open-source vLLM; LaMDA 137B reports alpha only (Table 3), not Table 2 wall-clock.

![Speculative Decoding Table 2: measured T5-XXL 11B speedups (excerpt).](/paperReading/41-speculative-decoding/paper/table-2-t5-xxl-speedups.webp)

*Table 2, Section 4.1: T5-XXL empirical walltime. Source: [arXiv PDF Table 2](https://arxiv.org/pdf/2211.17192#page=6). This crop includes headers and partial rows; use the PDF for the full table. License note as for Figure 1.*

### Table 3 and the small-model experiment in Figure 1

**Question:** how does alpha move with M_q size and temperature? **Observation:** GPT-like **97M** M_p plus **6M** M_q on lm1b reaches alpha about **0.88-0.89** (Table 3); the Figure 1 sentence needs only **9** serial M_p calls for **38** tokens. **Boundary:** lm1b unconditional generation is **not** a production chat SLA.

### Figure 5: encoder-decoder trace (Section 3.5)

**Question:** how does gamma reshape **wall-clock structure**? **Observation:** versus standard decoding (one long purple M_p block), gamma=3 or 7 trades multiple blue M_q segments for fewer purple M_p segments. **Boundary:** schematic, not a benchmark table.

![Speculative Decoding Figure 5: simplified encoder-decoder trace for gamma=3, gamma=7, and baseline decoding.](/paperReading/41-speculative-decoding/paper/figure-5-trace-diagram.webp)

*Figure 5, Section 3.5: simplified trace diagram. Source: [arXiv PDF Figure 5](https://arxiv.org/pdf/2211.17192#page=5). This crop includes surrounding caption text. License note as for Figure 1.*

### Table 1: theoretical speed versus ops (Section 3.5)

**Question:** what does high alpha with large gamma **cost**? **Observation:** for example alpha=0.9 and gamma=10 yields theoretical speed **6.86X** but ops **1.60X**. **Boundary:** assumes c=hat{c}=0; plug into Theorem 3.8 for real hardware.

## Ablations and design choices

- **M_q size** (Tables 2-3): alpha rises with larger M_q, but so does c; T5-small balances best on T5-XXL.
- **gamma** (Figure 3, Section 3.5): optimize numerically from alpha and c; higher alpha permits larger gamma.
- **Sampling temperature** (Table 2): **temp=0 (argmax)** beats temp=1 on both alpha and speedup because sharper distributions agree more often.
- **Negligible-cost drafts** (Section 3.6): an EnDe bigram M_q still has alpha about **0.2**, worth about **1.25X** at gamma=3, low but **nonzero**.

## Limitations and threats to validity

1. **Compute prerequisite:** you must **parallelize** gamma+1 M_p forwards; if already saturated, the method **does not help** (Section 6).
2. **Total operations:** low alpha **wastes** parallel M_p work and M_q drafting (Theorem 3.11).
3. **Draft quality:** M_q should share **architecture family, tokenizer, and task distribution** with M_p; cross-modal or cross-task use is unverified.
4. **Hardware era:** **single TPU-v4**, T5X; remeasure on 2026 GPU clusters.
5. **Do not mix in later results:** vLLM, TensorRT-LLM, GPTQ, Medusa, EAGLE, and FlashAttention benchmarks **are outside this PDF**.
6. **Keep alignment and CV separate:** InstructGPT win rates, Transformer WMT BLEU, and YOLO mAP **must not** enter Table 2.

## Engineering decision and when not to use it

**When to borrow this paper:** when **(a)** you must preserve M_p's **exact sampling distribution**, **(b)** decoding is **memory-bandwidth bound** with spare compute, **(c)** you have a **same-family small checkpoint** as M_q, and latency is a product metric (echoing [YOLO](/en/paper-reading/38-yolo-you-only-look-once/) putting cost on the same table).

**When not to copy it blindly:**

- You can accept an **approximate distribution** (distillation, quantization) and care more about **memory footprint**.
- You lack a suitable M_q or alpha is estimated too low.
- GPUs are **already saturated** and cannot host parallel M_p paths.
- You write **3.4X EnDe** into a 2026 arbitrary LLM API p99 latency SLA.
- You confuse **Medusa or EAGLE learned drafts** with this paper's **rejection-sampling lossless contract**.

> **Huahua's judgment**
>
> From YOLO, keep "latency is a first-class metric." From InstructGPT, keep "add a procedure on frozen weights." From Speculative Decoding, add one more line: **losslessness comes from rejection sampling; T5X 2X-3X is a 2023 experimental contract, not a 2026 serving product warranty.**

## Artifacts and reproducibility

As of 2026-08-28:

- **Paper:** [arXiv abs](https://arxiv.org/abs/2211.17192), [PDF v2](https://arxiv.org/pdf/2211.17192), and the [ICML 2023 proceedings page](https://proceedings.mlr.press/v202/leviathan23a.html) are readable.
- **Code:** experiments run in **Google's T5X pipeline** (Section 4.1); there is **no** standalone public repo that one-click reproduces Table 2. Later community ports (including independent 2023 speculative-sampling work) are downstream implementations.
- **Models:** T5 v1.1 checkpoints are available in the public T5 ecosystem; T5-XXL 11B needs corresponding resources.

The smallest useful reproduction: implement **one Algorithm 1 round** on small GPT or T5 models and measure the **distribution of accepted length n** plus whether **parallel M_p forwards** are feasible. That validates mechanism, not 3.4X.

## Three things to remember

1. **Technical idea:** M_q drafts, M_p verifies in parallel, and **speculative sampling** keeps the **same distribution as M_p**; the control point is **lossless inference acceleration**, not a new architecture.
2. **Evidence:** Table 2: T5-XXL plus T5-small, EnDe **3.4X/2.6X**, CNN/DM **3.1X/2.3X**; Figure 2 and Theorem 3.8 explain the alpha, gamma, and c tradeoff.
3. **Boundary:** The method needs a draft model plus parallel compute and is not GPTQ, vLLM, or Medusa. In the foundations sequence, this note's specific topic is **inference efficiency**.

## Further reading

If you have not read the preceding sequence, return to [Transformer](/en/paper-reading/39-attention-is-all-you-need/) and [InstructGPT](/en/paper-reading/40-instructgpt-human-feedback/). For reading method, see the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). To compare **latency on the evidence table** with a CV example, read [YOLO](/en/paper-reading/38-yolo-you-only-look-once/). GPTQ, FlashAttention, vLLM, Medusa, and EAGLE are intentionally not expanded here.

## Primary sources

- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding," ICML 2023 / arXiv:2211.17192 v2](https://arxiv.org/abs/2211.17192)
- [ICML 2023 proceedings entry](https://proceedings.mlr.press/v202/leviathan23a.html)
- [DOI 10.48550/arXiv.2211.17192](https://doi.org/10.48550/arXiv.2211.17192)
