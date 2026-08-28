---
stableId: "arxiv:2211.17192"
sourceVersion: "v2"
status: "published"
firstSeenAt: 2026-08-28
lastVerifiedAt: 2026-08-28
primaryTrack: "foundations"
primaryGap: "inference-efficiency"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "published"
---

# Fast Inference from Transformers via Speculative Decoding

## Identity

- Stable ID: `arxiv:2211.17192`.
- Canonical URL: https://arxiv.org/abs/2211.17192
- Authors (v2 PDF / ICML 2023): Yaniv Leviathan, Matan Kalman, and Yossi Matias (Google Research; Leviathan and Kalman equal contribution).
- Venue or review status: ICML 2023; arXiv v2 (2023-05-18). arXiv.org perpetual non-exclusive license.
- Code / model / data: T5-XXL experiments implemented in Google T5X pipeline; no standalone public reproduction repo. T5 v1.1 checkpoints public.

## Editorial fit

- Reader question: After InstructGPT on the foundations spine, how does Speculative Decoding accelerate autoregressive Transformer decoding without changing the target distribution, and what do T5-XXL 2X-3X wall-clock numbers contract for versus later vLLM, GPTQ, or Medusa/EAGLE leaves?
- Why this belongs in the selected track: Seventh foundations node; teaches lossless inference-efficiency control point (draft plus parallel verify) after instruction alignment.
- Gap it fills: inference-efficiency gap in series-map; bounded to 2023 T5X / TPU-v4 evidence.
- Why now: Completes foundations path immediately after InstructGPT without inventing GPTQ, FlashAttention, vLLM, or Medusa/EAGLE notes.

## Claim map

- Problem: Large autoregressive Transformer decoding is serial and memory-bandwidth bound; K tokens need K target-model runs.
- Core idea: Small M_q drafts gamma tokens; M_p evaluates gamma+1 positions in parallel; speculative sampling (rejection sampling) preserves M_p's distribution.
- Evidence: Table 2 T5-XXL 11B + T5-small 77M: EnDe 3.4X/2.6X, CNN/DM 3.1X/2.3X on single TPU-v4 batch=1 vs T5X; Theorem 3.8 alpha/gamma/c tradeoff; Figure 1 38 tokens with 9 M_p calls (97M/6M lm1b).
- Boundary: Needs aligned draft and spare parallel compute; ops can rise; not vLLM/GPTQ/Medusa; do not import InstructGPT win rates, WMT BLEU, or YOLO mAP.

## Publication

- Content entries: `41-speculative-decoding` (ZH + EN).
- Path wiring: `foundations` immediately after `40-instructgpt-human-feedback` in `paperReadingPaths.ts`.
- Tiny inbound: one-line pointer from InstructGPT further-reading section.
