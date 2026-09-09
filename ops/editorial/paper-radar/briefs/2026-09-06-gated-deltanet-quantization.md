---
stableId: "arxiv:2609.04098"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-06
lastVerifiedAt: 2026-09-06
primaryTrack: "foundations"
primaryGap: "inference-efficiency"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 4
  total: 27
decision: "deep-read-candidate"
---

# Why Gated DeltaNet Survives 4-Bit Quantization：循環狀態不一定會把量化誤差一路累積

## Identity

- Search window: strict 72-hour scan from 2026-09-03 00:31Z to 2026-09-06 00:31Z.
- Canonical URL: https://arxiv.org/abs/2609.04098
- Authors: Sergii Kozyrev and Davyd Maiboroda; Minima / MNMA.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-03; full HTML version available.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.04098
- Released checkpoint: https://huggingface.co/minima-ai/mnma_qwen3.8_27b_nvfp4

## Editorial fit

- Reader question: When a hybrid model contains recurrent Gated DeltaNet layers, which parts actually need higher precision, and what should a serving engineer measure before preserving an expensive BF16 fallback?
- Why this belongs in the selected track: The paper links a model-architecture question to quantization, long-context behavior, memory footprint, and prefill throughput with a public checkpoint that can be inspected.
- Gap it fills: Inference efficiency—how architecture-aware quantization changes the memory, quality, and serving trade-off for long-context open-weight models.
- Why now: Hybrid recurrent-attention models are being used to reduce context-serving cost, but common quantization recipes leave recurrent gates at higher precision based on an intuition that this paper directly tests.

## Claim map

- Problem: Community 4-bit recipes kept Gated DeltaNet projections in 8- or 16-bit precision because recurrent-state errors were expected to accumulate over long contexts.
- Main claim: NVFP4 W4A4 can quantize all 496 linear layers of Qwen3.8-27B, including GDN, while matching BF16 within reported seed noise across language, reasoning, coding, and long-context retrieval tests.
- Method: Compare Minima against BF16 and other quantization recipes at 4K and 32K perplexity, five task benchmarks, and RULER retrieval to 64K; replay captured activations by projection; inspect recurrence error and serving-path effects; publish the repaired quantized checkpoint.
- What is genuinely new: The mechanism study challenges the assumed fragile component. Gate nonlinearities compress approximately 11% GEMM error to roughly 2% output error, recurrent noise reaches a flat plateau over 32K rather than growing unbounded, and the end-to-end recipe reports 17.5 GiB weights plus 14–19% faster prefill than the compared recipes.

## Evidence audit

- Main results: The paper reports a five-task average of -0.52 relative to BF16, matching BF16 on the listed tasks within seed noise, perfect retrieval on the tested 64K RULER setting, and approximately 14.5K-token generations matching BF16 token-for-token in the mechanism study.
- Method controls: It includes per-projection replays over 96 layer/sequence cases, activation and weight statistics at NVFP4 block granularity, a kernel-versus-reference numerical probe, text-only versus multimodal serving-path checks, and KV-cache calibration ablations.
- Baseline or comparison: BF16, Minima variants, and other community quantization recipes are compared under the paper’s serving harness; the paper distinguishes measured task scores from inherited scores for the calibrated KV-cache variant.
- Artifact: The released Hugging Face checkpoint is public and the paper exposes enough calibration, precision-map, and measurement detail to attempt a focused reproduction, but a complete public training/evaluation code release was not verified.
- Statistical uncertainty: The paper reports seed-noise framing and detailed tables, but no broad independent replication, confidence intervals for every task, or cross-architecture study.
- Threats to validity: Recurrent behavior is tested on one Qwen3.8-27B hybrid family and one NVFP4 format; serving kernels and activation-quantization overhead can change the practical result.

## Reproducibility

- Available artifacts: Full HTML paper, public quantized checkpoint, precision maps, captured-activation methodology, numerical probes, and detailed measurement tables.
- Environment or compute requirements: A compatible NVFP4-capable serving stack, the Qwen3.8-27B model family, long-context evaluation, and enough GPU memory to compare the 17.5 GiB quantized and BF16 variants.
- Smallest useful reproduction: Load the public checkpoint, verify weight size, run a fixed short perplexity and 32K retrieval slice, then repeat the projection-replay and text-only serving-path checks on the same kernel stack.
- Blocking unknowns: Exact repository or script availability, hardware-specific kernel support, calibration-file provenance, small-batch decode cost, and behavior beyond the tested 64K retrieval or 128K context extrapolation.

## Critical reading

- Strongest result: The paper combines an actionable released artifact with a mechanism-level explanation and controls for a serving-path confound, making its central “recurrent error need not explode” claim testable rather than purely empirical.
- Weakest assumption: A bounded activation-error mechanism observed for this hybrid architecture and context range will transfer to other recurrent attention designs, quantization formats, and kernels.
- Unsupported leap: Matching the reported benchmark suite on one model does not prove universal 4-bit safety for Gated DeltaNet, nor does faster prefill guarantee better total cost when decode overhead and concurrency differ.

## Bloss0m connection

- Related routes: efficient inference, hybrid model architecture, long-context evaluation, quantization, and reproducible serving measurement.
- Duplication risk: Low to medium with the existing speculative-decoding and inference-efficiency routes; this paper is about quantizing recurrent layers and measuring error propagation, not decoding acceleration.
- Suggested internal links: Pair with the existing Speculative Decoding reading and recent measurement-realism papers to contrast algorithmic speedups with hardware- and kernel-dependent serving effects.

## Recommendation

- Output level: Deep Read.
- Score rationale: 27/30: direct model/inference fit, a counter-intuitive mechanism, broad within-paper controls, a public checkpoint, and concrete serving consequences. Reproducibility and series value are capped because the evidence covers one model family and the full evaluation harness was not verified as open.
- Open questions requiring human approval: Does the result survive another hybrid architecture and another NVFP4 implementation? How much of the prefill gain remains at realistic batch sizes once decode, KV-cache policy, and kernel warm-up are included?
