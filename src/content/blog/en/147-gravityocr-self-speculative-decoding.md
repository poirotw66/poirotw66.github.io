---
title: "GravityOCR: Why 3.94× Faster Decoding Becomes a 1.32× Page Speedup"
description: "Understand GravityOCR's shared diffusion drafter and AR verifier through three timing boundaries, output-equivalence conditions, and OCR pipeline bottlenecks."
pubDate: 2026-10-29
updatedDate: 2026-10-29
tldr:
  - "The authors' 3.94× result measures decode-only speed on English region crops; the full page pipeline improves by 1.32×, both against the same checkpoint's AR path."
  - "One set of weights drafts in parallel, then verifies causally, accepting only a consecutive matching prefix; draft errors first reduce acceptance length."
  - "Greedy equivalence in exact arithmetic does not imply identical bf16 outputs; Chinese documents and other concurrency settings need separate validation."
audience:
  - "Engineers comparing document OCR models and inference pipelines"
  - "AI systems developers interpreting decoding speedups and their limits"
category: "AI Engineering"
tags: ["Multimodal", "Evaluation", "Platform Engineering"]
kind: "article"
showToc: true
image: "/blog/147-gravityocr-self-speculative-decoding/title_image.webp"
---

If a PDF recognizer generates text almost four times faster, should a user wait only a quarter as long for a converted page? GravityOCR makes that question unusually concrete. Its authors report a **3.94× decode-only speedup**, but a **1.32× improvement in full-page processing**. Both compare against the autoregressive (AR) path of the same model checkpoint. They start and stop the clock at different places. The paper's [measurement protocol](https://arxiv.org/html/2609.26638v1#A3) turns that gap into a useful systems question.

For an engineer comparing OCR options, the largest multiplier is only a starting point. GravityOCR uses one set of weights to propose a sequence and check it, reducing sequential waiting during decoding. Reading the image, preparing context, and assembling a page still take time. Understanding the gain requires looking at both what can be guessed together and what the speed measurement includes.

## Seeing the text does not make every parallel guess safe to commit

Document OCR has an advantage over open-ended writing: the input image constrains the answer. Predicting several positions together therefore looks promising. But visual grounding does not remove dependencies within the output. Text needs the right order; HTML tables need closing tags; LaTeX needs balanced delimiters.

Positions predicted in the same parallel step cannot condition on the values selected at the other positions in that step. Each guess can look confident while their combination omits or repeats text. Confidence and consistency within the completed sequence are different judgments.

GravityOCR separates them. A block-diffusion path proposes candidate tokens; a causal AR path decides which candidates enter the output. They share the vision encoder, language decoder, and output head. The model adds a learned mask-token embedding and receives joint training for denoising and next-token prediction. This capability requires adaptation and training; it is not an inference switch that makes any AR checkpoint a parallel drafter. Both the [paper's method](https://arxiv.org/html/2609.26638v1#S3) and the [official implementation guide](https://github.com/trillion-labs/GravityOCR/blob/main/docs/SGLANG_SELFSPEC_IMPL.md) identify the two trained paths as prerequisites.

## Draft in parallel, accept a consecutive prefix

In the authors' configuration, each drafting round starts with a boundary token followed by **32 masks**. The first forward pass produces a causal prediction, `a0`, and parallel draft tokens, `d1…d32`. A second forward pass uses causal attention to check those drafts against AR predictions. The [official README](https://github.com/trillion-labs/GravityOCR#how-it-works) describes this as two forwards per round.

Consider an illustrative example of the acceptance rule. Suppose `d1` and `d2` match the verifier, but `d3` is the first mismatch. The round commits `a0`, `d1`, and `d2`, followed by the verifier's own `a3`. Even if `d4` happens to match its verification prediction, it cannot be accepted across the mismatch: the prefix it depended on has changed. If the entire draft matches, the verifier supplies a further token after it.

That distinction gives draft quality a specific role. A poor draft first reduces how far the round advances, instead of directly placing every confident guess into the answer. The implementation must also discard rejected draft states and preserve a causal key/value (KV) cache for the next round. Otherwise, accepting only verified tokens would be a superficial safeguard. The [decode-path documentation](https://github.com/trillion-labs/GravityOCR/blob/main/docs/DECODE_PATHS.md) distinguishes a vision-prefix-only cache from full incremental caching, another reason that the name “self-speculative” alone does not determine performance.

## Three speed measurements with progressively wider boundaries

The following are **author-reported results on one H100**, each comparing self-speculative decoding with the AR path of the same final GravityOCR checkpoint. They are not measurements reproduced for this article. Speed uses English data; quality is scored on the full evaluation set.

| Timing boundary | AR → self-speculative | Speedup | Work included |
|---|---|---|---|
| Region-crop decode only | 777 → 3,057 tok/s | 3.94× | Output-token generation |
| Complete region request | 486 → 844 tok/s | 1.74× | Vision encoding, prompt prefill, decoding |
| Complete page | 0.554 → 0.730 pages/s | 1.32× | Layout, cropping, recognition, Markdown assembly |

The first two rows use **8,922 annotated English region crops at batch size 1**, sent directly to the recognizer without layout analysis. The third uses a **100-page subset with one page in flight**, but issues approximately 18 region requests within that page concurrently. One page in flight does not mean one crop request at a time. The authors use full resolution and natural EOS without an output cap. These conditions appear in [Tables 1 and 3 and Appendix C](https://arxiv.org/html/2609.26638v1#A3).

The first reduction is straightforward: once decoding becomes faster, the fixed cost of vision encoding and prefill becomes more visible. The page measurement adds further work and region scheduling. Plain AR can already use concurrent regions to keep the GPU busy, so the sequential delay of one crop does not transfer directly into the page's elapsed time.

These ratios do not, however, establish layout analysis as the new dominant bottleneck. Aggregate rates do not provide enough stage-by-stage timing to separate the remaining costs of layout, vision encoding, and assembly. They support a narrower conclusion: other stages and scheduling dilute the local decoding gain. Identifying the next bottleneck still requires profiling.

The authors' **9.7 tokens per forward** also counts both drafting and verification model calls, while excluding vision and prompt prefill. It measures decoding-step efficiency. It means neither one model call per round nor a 9.7× wall-clock speedup. The [official results](https://github.com/trillion-labs/GravityOCR#results) show it alongside the actual page rates.

## Verification preserves a checkpoint's decoding contract, not the original model's score

Two different claims about preserving quality need to stay separate.

The first concerns decoding equivalence. In exact arithmetic, greedy verification commits the tokens that the same checkpoint would choose under AR decoding. Under bf16 serving, however, the authors measured **96.6% exact output-string agreement** between the two paths on the English crops. Different attention kernels can flip argmax decisions when logits are close. That is a gap between the mathematical contract and numerical execution, and “lossless” alone does not describe it adequately. [Appendix B.3](https://arxiv.org/html/2609.26638v1#A2.SS3) specifies the test; the [model card](https://huggingface.co/trillionlabs/GravityOCR) also reports the observed agreement rate.

The second concerns quality before and after model adaptation. On the full **OmniDocBench v1.6 evaluation of 1,651 pages**, the authors report an Overall score of **95.16 for final GravityOCR**, compared with **95.48 for original GLM-OCR**. Shared weights between decoding paths do not make the adapted checkpoint identical to its starting model. The authors also apply Group Relative Policy Optimization (GRPO) through the AR path, improving GravityOCR from **94.92 to 95.16**. This changes the shared model; it does not make the verifier a universal correction mechanism for OCR errors. [Tables 1 and 6](https://arxiv.org/html/2609.26638v1#S4) support that distinction.

> **Huahua's engineering note**
>
> Equivalence to a model's own token-by-token decoding is a decoding contract. Reading a particular document correctly still depends on the model, data, and quality evaluation. Assess those two properties separately.

## Fix the documents and the waiting pattern before comparing speed

What I find useful here is the connection between predicting more tokens and safely committing more tokens, followed by an account of what that local improvement becomes inside a pipeline. Sharing parameters avoids another drafting model, but two full-model forwards still have a cost. The useful quantity is the accepted consecutive prefix and the sequential waiting it removes.

This makes workload differences concrete. A short text region may finish quickly enough that reading the image remains a large part of the request. A long structured output has more decoding work over which to amortize that cost, but the word “table” alone cannot predict the benefit. Concurrency also changes AR utilization. In a separate **pre-RL batch sweep**, using a queue protocol different from the crop test above, the authors report a speedup narrowing from **1.85× at batch 1 to 1.13× at batch 64**. Those points should not be presented as the same final-checkpoint curve as Table 3. [Appendix C and Figure 6](https://arxiv.org/html/2609.26638v1#A3) distinguish the protocols.

The [weights and model card](https://huggingface.co/trillionlabs/GravityOCR) are public, but loading the checkpoint for ordinary Transformers AR generation does not automatically provide the paper's self-speculative acceleration. That requires the [repository's SGLang v0.5.12 patch or specified incremental-cache path](https://github.com/trillion-labs/GravityOCR). The released repository covers inference, serving, and evaluation; it excludes training and RL code, as the [official scope statement](https://github.com/trillion-labs/GravityOCR/blob/main/AGENTS.md) explains.

To judge suitability for a document collection, the next step is to fix the documents, quality criteria, and timing boundaries, then compare crop latency separately from page throughput before deciding whether a model experiment is worthwhile. English speed results do not guarantee the same benefit for Chinese scanned PDFs, another GPU, or higher concurrency. The answer to the opening question is therefore specific: GravityOCR accelerates verified text generation. How closely a whole-page speedup approaches that gain depends on where the workload spends its time.
