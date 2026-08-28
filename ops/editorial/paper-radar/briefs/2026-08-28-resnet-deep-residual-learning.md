---
stableId: "arxiv:1512.03385"
sourceVersion: "v1"
status: "published"
firstSeenAt: 2026-08-28
lastVerifiedAt: 2026-08-28
primaryTrack: "foundations"
primaryGap: "computer-vision-foundations"
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

# Deep Residual Learning for Image Recognition

## Identity

- Stable ID: `arxiv:1512.03385`.
- Canonical URL: https://arxiv.org/abs/1512.03385
- Authors (v1 PDF / CVPR 2016): Kaiming He, Xiangyu Zhang, Shaoqing Ren, and Jian Sun (Microsoft Research).
- Venue or review status: CVPR 2016; arXiv v1 PDF (2015-12-10). arXiv.org perpetual non-exclusive license; CVPR camera-ready additionally under IEEE terms.
- DOI: `10.1109/CVPR.2016.90`
- Code / model / data: Historical Caffe release at https://github.com/KaimingHe/deep-residual-networks (HTTP 200). ImageNet 2012 requires license; ILSVRC test labels not public.

## Editorial fit

- Reader question: After AlexNet-scale CNNs train on ImageNet, why do plain nets degrade when depth increases, and does rewriting the block as F(x)+x with identity shortcuts fix optimization without changing the depth contract into detection or ViT leaderboards?
- Why this belongs in the selected track: Second node on the CV foundations spine after the AlexNet pair; teaches residual shortcuts as the control point for trainable depth.
- Gap it fills: Landmark depth/architecture paper between AlexNet and later vision leaves; bounded to 2015 ImageNet classification + CIFAR diagnostics.
- Why now: Completes the foundations path entry after AlexNet without inventing a full CV reading-map blog.

## Claim map

- Problem: Deeper plain nets show higher training error (degradation), not explained as overfitting alone.
- Core idea: Learn residual F(x)=H(x)-x with identity shortcuts; output y=F(x)+x.
- Evidence: Table 2 plain-34 28.54% vs ResNet-34 25.03% top-1; ResNet-152 single-model top-5 4.49%; ensemble test 3.57%; CIFAR Table 6 / Figures 1,4,6,7.
- Boundary: COCO/PASCAL tables are Faster R-CNN backbone transfer; do not import YOLO, ViT, ConvNeXt, or ResNet-RS numbers.

## Publication

- Content entries: `37-resnet-deep-residual-learning` (ZH + EN).
- Path wiring: `foundations` immediately after AlexNet slugs in `paperReadingPaths.ts`.
- Tiny inbound: one-line pointer from AlexNet part 2 only.
