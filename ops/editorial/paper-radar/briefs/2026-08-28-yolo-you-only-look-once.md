---
stableId: "arxiv:1506.02640"
sourceVersion: "v5"
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

# You Only Look Once: Unified, Real-Time Object Detection

## Identity

- Stable ID: `arxiv:1506.02640`.
- Canonical URL: https://arxiv.org/abs/1506.02640
- Authors (v5 PDF / CVPR 2016): Joseph Redmon, Santosh Divvala, Ross Girshick, and Ali Farhadi (University of Washington, Allen Institute for AI, Facebook AI Research).
- Venue or review status: CVPR 2016; arXiv v5 PDF (2016-05-09). arXiv.org perpetual non-exclusive license; CVPR camera-ready additionally under IEEE terms.
- DOI: `10.1109/CVPR.2016.91`
- Code / model / data: Darknet framework and pretrained models announced at `http://pjreddie.com/yolo/`; PASCAL VOC 2007/2012 publicly obtainable.

## Editorial fit

- Reader question: After AlexNet and ResNet on classification backbones, how does original YOLO reframe object detection as one full-image regression with latency as a first-class metric, and what do VOC 2007/2012 mAP/FPS numbers actually contract for versus later YOLO product versions?
- Why this belongs in the selected track: Third node on the CV foundations spine after AlexNet and ResNet; teaches unified one-pass detection versus two-stage R-CNN / Fast R-CNN / Faster R-CNN.
- Gap it fills: Landmark real-time detection paper between residual classification and later detection leaves; bounded to 2016 VOC evidence.
- Why now: Completes foundations path detection step immediately after ResNet without inventing YOLOv2/v3/v8 notes.

## Claim map

- Problem: Multi-stage propose-classify-refine pipelines are slow and hard to optimize end-to-end.
- Core idea: Single CNN regresses S×S grid boxes and class probabilities from full images in one evaluation (S=7, B=2, C=20 on VOC).
- Evidence: Table 1 YOLO 63.4% mAP / 45 FPS; Fast YOLO 52.7% / 155 FPS; Figure 4 localization vs background errors; Table 2 Fast R-CNN+YOLO 75.0% mAP; VOC 2012 test 57.9% mAP.
- Boundary: Not instance segmentation; not COCO 2017 or Ultralytics numbers; do not import ResNet ImageNet 4.49% or later YOLO family mAP.

## Publication

- Content entries: `38-yolo-you-only-look-once` (ZH + EN).
- Path wiring: `foundations` immediately after `37-resnet-deep-residual-learning` in `paperReadingPaths.ts`.
- Tiny inbound: one-line pointer from ResNet further-reading section.
