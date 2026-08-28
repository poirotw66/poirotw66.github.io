---
stableId: "arxiv:1706.03762"
sourceVersion: "v7"
status: "published"
firstSeenAt: 2026-08-28
lastVerifiedAt: 2026-08-28
primaryTrack: "foundations"
primaryGap: "transformer"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "published"
---

# Attention Is All You Need

## Identity

- Stable ID: `arxiv:1706.03762`.
- Canonical URL: https://arxiv.org/abs/1706.03762
- Authors (v7 PDF / NeurIPS 2017, randomized equal-contribution order): Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, and Illia Polosukhin (Google Brain / Google Research / University of Toronto).
- Venue or review status: NeurIPS 2017; arXiv v7 (2017-12-06). arXiv.org perpetual non-exclusive license; Google grants scholarly figure reproduction per arXiv HTML header.
- Code / model / data: Training code announced at https://github.com/tensorflow/tensor2tensor; WMT 2014 EN-DE (~4.5M pairs) and EN-FR (36M sentences).

## Editorial fit

- Reader question: After AlexNet, ResNet, and YOLO on the foundations spine, how does the original Transformer replace recurrence with parallel global self-attention for machine translation, and what do WMT 2014 BLEU and 2017 training-cost numbers actually contract for versus later BERT/GPT/ViT leaves?
- Why this belongs in the selected track: Fifth node on the foundations path; teaches sequence transduction control point (encoder-decoder attention stacks) after CV classification and detection nodes.
- Gap it fills: Landmark attention-only transduction paper; bounded to WMT 2014 MT evidence and tensor2tensor-era artifacts.
- Why now: Completes foundations path sequence-modeling step immediately after YOLO without inventing BERT/GPT/ViT notes.

## Claim map

- Problem: RNN/LSTM seq2seq is hard to parallelize within examples; Bahdanau attention still sits on recurrence.
- Core idea: Stacked encoder-decoder with multi-head self-attention, position-wise FFN, and sinusoidal positional encodings (base: N=6, d_model=512, h=8).
- Evidence: Table 2 Transformer (big) EN-DE 28.4 BLEU, EN-FR 41.8 BLEU; base 12h / big 3.5 days on 8xP100; Table 3 ablations; appendix attention visualizations.
- Boundary: MT encoder-decoder only; do not import BERT GLUE, GPT-3, T5, ViT ImageNet, YOLO mAP, or ResNet classification numbers.

## Publication

- Content entries: `39-attention-is-all-you-need` (ZH + EN).
- Path wiring: `foundations` immediately after `38-yolo-you-only-look-once` in `paperReadingPaths.ts`.
- Tiny inbound: one-line pointer from YOLO further-reading section.
