---
title: "YOLO: Detect From One Full-Image Pass, but VOC 2016 Is Not the Later YOLO Family Product Contract"
description: "A source-grounded reading of Redmon et al., CVPR 2016 / arXiv:1506.02640: object detection as a single forward-pass regression—an S×S grid, B boxes, and C class probabilities in one shot. On VOC 2007, YOLO reaches 63.4% mAP at 45 FPS; this is 2016 unified-detection evidence, not YOLOv3 COCO or Ultralytics product numbers."
pubDate: 2026-08-28
updatedDate: 2026-08-28
tldr:
  - "YOLO changes the control point: one full-image forward pass where a single CNN regresses box coordinates and class probabilities, instead of an R-CNN-style propose-then-classify-then-refine pipeline."
  - "On PASCAL VOC with S=7, B=2, C=20, the output is a 7×7×30 tensor at 448×448 input. VOC 2007 (Table 1): YOLO 63.4% mAP at 45 FPS; Fast YOLO 52.7% mAP at 155 FPS. Compare Fast R-CNN 70.0% mAP at 0.5 FPS and Faster R-CNN VGG-16 73.2% mAP at 7 FPS."
  - "Failure modes (Figure 4): YOLO is dominated by localization errors (19.0%) and makes fewer background false positives than Fast R-CNN (4.75% vs 13.6%). VOC 2012 test YOLO is 57.9% mAP; later YOLOv2/v3/v8 and COCO 2017 leaderboards are outside this PDF."
audience:
  - "CV practitioners who finished AlexNet and ResNet and need to separate classification backbones from unified detection."
  - "Technical leads deciding whether VOC-era mAP/FPS transfers to modern one-stage products or video streaming."
tags: ["Paper Reading", "Computer Vision", "Object Detection", "YOLO", "Deep Learning"]
image: "/paperReading/38-yolo-you-only-look-once/title_image.webp"
field: "CV"
difficulty: "intermediate"
showToc: true
topics:
  - computer-vision-foundations
paper:
  title: "You Only Look Once: Unified, Real-Time Object Detection"
  authors:
    - "Joseph Redmon"
    - "Santosh Divvala"
    - "Ross Girshick"
    - "Ali Farhadi"
  year: 2016
  venue: "CVPR 2016 (arXiv 1506.02640 v5)"
  links:
    pdf: "https://arxiv.org/pdf/1506.02640.pdf"
    arxiv: "https://arxiv.org/abs/1506.02640"
    doi: "https://doi.org/10.1109/CVPR.2016.91"
    project: "https://openaccess.thecvf.com/content_cvpr_2016/html/Redmon_You_Only_Look_CVPR_2016_paper.html"
series:
  id: "yolo-you-only-look-once"
  title: "Original YOLO deep reading"
  part: 1
  totalParts: 1
---

Pair this with the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). This note follows [AlexNet part 1](/en/paper-reading/01-alexnet-paper-reading-part-1/), [part 2](/en/paper-reading/02-alexnet-paper-reading-part-2/), and [ResNet](/en/paper-reading/37-resnet-deep-residual-learning/) on the CV foundations spine: AlexNet shows large CNNs can train; ResNet makes deeper classification backbones optimizable; YOLO moves the **object-detection** control point to one full-image forward pass with boxes and classes regressed together, and puts **latency (FPS)** on the headline evidence table.

## The paper in 90 seconds

- **Problem:** Pre-2016 detectors (DPM, R-CNN, Fast/Faster R-CNN) split proposals, features, scoring, and post-processing into separate stages that are hard to optimize end-to-end and slow at test time (for example R-CNN over 40 seconds per image; Fast R-CNN about 0.5 FPS).
- **Core insight:** Recast detection as **single regression**: one CNN maps the full image directly to spatially separated bounding boxes and class probabilities. The control point is **one-shot global reasoning** versus **two-stage propose-then-classify**; the whole pipeline is one network trained end-to-end on detection loss (Sections 1-2, Figures 1-2).
- **Strongest evidence:** PASCAL VOC 2007 (Table 1, train 2007+2012): **YOLO 63.4% mAP at 45 FPS** (Titan X, no batching); **Fast YOLO 52.7% mAP at 155 FPS**. Same table: Fast R-CNN **70.0% mAP at 0.5 FPS**; Faster R-CNN VGG-16 **73.2% mAP at 7 FPS**. Figure 4: YOLO's top error bucket is **localization at 19.0%**; background false positives are **4.75%** versus Fast R-CNN **13.6%**.
- **Main boundary:** Coarse grid (two boxes and one class set per cell), VOC's 20 classes, not instance segmentation; VOC 2012 test **57.9% mAP** trails leaderboard leaders. **YOLOv2/v3/v8, COCO 2017, and Ultralytics product mAP are not in this PDF**; ResNet-152 ImageNet 4.49% is not a detection contract either.

My bounded verdict: **YOLO is worth keeping as the 2016 control point "detection equals one forward pass with mAP and FPS reported together." It is not worth treating VOC 2007's 63.4%/45 FPS as a 2026 video-streaming or COCO product SLA.**

> **Huahua in one sentence**
>
> ResNet teaches how to make classification backbones trainable; YOLO asks whether you can drop region proposals entirely and regress boxes from one full-image pass—but the VOC table is historical evidence, not a spec sheet for the later YOLO family.

## Version and reading scope

This note reads [Redmon et al., CVPR 2016](https://openaccess.thecvf.com/content_cvpr_2016/html/Redmon_You_Only_Look_CVPR_2016_paper.html) against [arXiv:1506.02640 v5](https://arxiv.org/abs/1506.02640) (revised 2016-05-09). The PDF is marked with the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/); the CVPR camera-ready is additionally under IEEE terms. Author order follows the PDF: **Joseph Redmon, Santosh Divvala, Ross Girshick, and Ali Farhadi** (University of Washington, Allen Institute for AI, Facebook AI Research).

Beyond the abstract, the note checks Section 2 unified detection and network design, Sections 2.2-2.4 training/inference/limits, Section 3 comparisons to two-stage detectors, and Section 4.1-4.4 experiments (Tables 1-3, Figures 4-5), plus `pjreddie.com/yolo` and Darknet endpoints as of **2026-08-28**. Post-YOLO versions, COCO 2017 leaderboards, and ResNet classification tables are **not** written back.

## The question the reader actually needs

Once you can train AlexNet/ResNet-scale CNNs, how do you build a deployable **multi-object, multi-class, boxed** detector? Keep the R-CNN recipe of propose-then-classify, or encode the whole image once and regress boxes and probabilities? Redmon et al. choose the latter and report VOC mAP **and** FPS on the same table.

The precise reading is not "is YOLO the most accurate 2026 detector?" The real question is: **how single-pass regression rewrites the pipeline and error profile, what VOC-era numbers support, and which later product numbers must not be imported.**

## Evidence map

| Layer | How this article uses it |
| --- | --- |
| **Paper directly supports** | Figures 1-3 define the single-pass pipeline, S×S grid, and 24 conv + 2 fc stack; Equations (1)(3) with S=7, B=2, C=20 to 7×7×30; Table 1 VOC 2007 mAP/FPS; Figure 4 error breakdown; Table 2 Fast R-CNN+YOLO 75.0% mAP; Table 3 VOC 2012 YOLO 57.9% mAP. |
| **Author claims** | Unified architecture is extremely fast; full-image context reduces background mistakes; representations generalize to artwork (Figure 5); YOLO can rescore Fast R-CNN to complement errors. |
| **Not established** | Beating every contemporary mAP leader; small or densely grouped objects; a real-time SLA on arbitrary data; later YOLO family or COCO numbers. |
| **Bloss0m engineering judgment** | Read this as the **third foundations spine node** (detection control point) after ResNet classification. Do not mix Ultralytics, YOLOv8 COCO, or ResNet ImageNet tables into the YOLO story. |

## Why the previous approach is insufficient

Sections 1 and 3 set the stage. **DPM** uses sliding windows with a disjoint feature/classification pipeline. **R-CNN** runs Selective Search for about 2000 boxes, then CNN features, SVM, box refinement, and NMS—each stage tuned separately, **over 40 seconds per image** at test. **Fast R-CNN** speeds classification but still needs Selective Search (**about 2 seconds per image** for proposals), landing at **0.5 FPS** (Table 1). **Faster R-CNN** neural proposals reach **7 FPS and 73.2% mAP** with VGG-16—still not real-time.

[ResNet](/en/paper-reading/37-resnet-deep-residual-learning/) fixes **ImageNet classification** depth; its COCO table is a Faster R-CNN **backbone swap**, not one-stage regression. The AlexNet pair teaches a **large CNN classification system**; it does not address multi-box detection with latency as a first-class metric.

> **Huahua's engineering note**
>
> Two-stage bottlenecks often sit in proposals plus per-box features; YOLO decodes a full-image tensor in one pass, but **VOC 2012 still trails Fast R-CNN+YOLO at 70.7% mAP**—speed and accuracy are not the same 2026 product table.

## Core intuition

Ignore the 24-layer laundry list for a moment. A street scene with people, dogs, and cars: **two-stage methods** ask "where might objects be?" then classify patches; **YOLO** resizes to **448×448**, runs one CNN, and outputs a **7×7 grid** where each cell owns objects whose **center** falls inside it, predicting **two boxes** (coordinates and confidence) plus **20 conditional class probabilities**, packed as **7×7×30** (Figure 2, Section 2).

At inference the network emits up to **98 candidates** (7×7×2), thresholds class×confidence scores, and optionally applies NMS for **+2-3% mAP** (Section 2.3)—far less pipeline than R-CNN.

Contrast three next steps that later writing often collapses:

- **Faster R-CNN (two-stage):** RPN proposals plus RoI classification; **73.2% mAP, 7 FPS** (Table 1)—accurate but slow.
- **YOLO (this paper):** single-network regression; **63.4% mAP, 45 FPS**—trades some mAP for real-time throughput.
- **Later YOLO product lines (leaves):** anchors, FPN, COCO training, and more—**numbers outside the 2016 PDF**.

## Walk one example through the method

The walk follows Figure 1's street scene for **PASCAL VOC inference**, not a standalone experiment ID.

1. **Input:** RGB image resized to **448×448×3** (Figure 1 step 1).
2. **Intermediate representation:** 24 conv layers plus 2 fc layers output a **7×7×30** tensor—per cell two $(x,y,w,h,\text{conf})$ groups and 20-dimensional $\Pr(\text{class}\mid\text{object})$ (Figures 2-3, Section 2).
3. **Model or system decision:** compute Equation (1) class scores $\Pr(\text{class}_i)\times \text{IOU}$ per box; threshold low scores; run NMS (Section 2.3).
4. **Output:** a handful of boxes and labels on the image (Figure 1 step 3, for example Person 94%, Dog 92%).
5. **Likely failure point:** objects straddling cell boundaries or **small/dense groups**—only two boxes and one class vector per cell (Section 2.4); localization hurts IOU on small boxes, so Figure 4 shows **localization at 19.0%** as YOLO's dominant error.

## Technical mechanism

### Grid, boxes, and classes (Section 2)

- Split the image into an **S×S** grid; the cell containing an object's **center** is responsible for detecting it.
- Each cell predicts **B** boxes with $(x,y,w,h,\text{confidence})$; confidence $=\Pr(\text{Object})\times \text{IOU}_{\text{pred}}^{\text{truth}}$.
- Each cell has **C** conditional class probabilities. On VOC: **S=7, B=2, C=20** to **7×7×30**.

### Loss and training (Equation 3, Section 2.2)

Multi-part sum-squared error: coordinates ($\lambda_{\text{coord}}=5$), object confidence, no-object confidence ($\lambda_{\text{noobj}}=0.5$), and classes. Training assigns each object to the box predictor with **highest IOU**. Train on VOC 2007+2012 for about **135 epochs**; batch 64, momentum 0.9, weight decay 0.0005; learning rate $10^{-3}\to10^{-2}$ for 75 epochs then decay. Pretrain the first 20 conv layers on ImageNet at 224 input, then raise to 448 for detection.

### Architecture (Figure 3, Section 2.1)

**24 conv + 2 fc** (GoogLeNet-inspired, using 1×1 reduction plus 3×3 conv instead of inception modules). **Fast YOLO** uses **9 conv** layers with the same training/testing recipe.

![YOLO paper Figure 1: resize, single CNN forward pass, then thresholding and NMS.](/paperReading/38-yolo-you-only-look-once/paper/figure-1-detection-pipeline.webp)

*Figure 1, Section 1: unified detection pipeline. See [arXiv PDF Figure 1](https://arxiv.org/pdf/1506.02640.pdf#page=1). Cropped from the CVPR 2016 camera-ready PDF; copyright remains with the authors/IEEE. This note preserves attribution for scholarly commentary and cites [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

![YOLO paper Figure 2: each grid cell predicts B boxes and C classes, encoded as an S×S×(B·5+C) tensor.](/paperReading/38-yolo-you-only-look-once/paper/figure-2-grid-model.webp)

*Figure 2, Section 2: detection as regression. See [arXiv PDF Figure 2](https://arxiv.org/pdf/1506.02640.pdf#page=2). Crop and license note match Figure 1.*

![YOLO paper Figure 3: 24 convolutional layers plus 2 fully connected layers output 7×7×30.](/paperReading/38-yolo-you-only-look-once/paper/figure-3-architecture.webp)

*Figure 3, Section 2.1: detection network at 448 input. See [arXiv PDF Figure 3](https://arxiv.org/pdf/1506.02640.pdf#page=3). Crop and license note match Figure 1; the tall architecture strip is cramped in narrow layouts—use the PDF for layer-by-layer detail.*

## How to read the evidence

### Table 1: mAP and FPS together (Section 4.1)

**Question:** Is there a detector above **30 FPS** with much higher mAP than prior real-time systems? **Controls:** PASCAL VOC **2007** test; YOLO/Fast YOLO trained on **2007+2012**. **Observation:** Fast YOLO **52.7% mAP at 155 FPS**; YOLO **63.4% mAP at 45 FPS**—the authors report Fast YOLO at roughly **twice** other real-time mAP. **Boundary:** Faster R-CNN VGG-16 is **~10 mAP higher at 73.2%** but only **7 FPS**; Fast R-CNN is **70.0% mAP at 0.5 FPS**. This is a **speed-accuracy tradeoff table**, not a COCO contract.

### Figure 4: complementary error profiles (Section 4.2)

**Question:** Why can YOLO boost Fast R-CNN despite lower standalone mAP? **Method:** Hoiem et al. error taxonomy (correct/localization/background, and others). **Observation:** YOLO **localization 19.0%** versus Fast R-CNN **8.6%**; YOLO **background 4.75%** versus Fast R-CNN **13.6%** (about 3×). **Boundary:** explains Table 2's **+3.2 mAP** rescoring, not unconditional single-model dominance.

![YOLO paper Figure 4 with Tables 1-2 (same-page crop): VOC 2007 mAP/FPS comparison and Fast R-CNN vs YOLO error pies.](/paperReading/38-yolo-you-only-look-once/paper/figure-4-error-analysis.webp)

*Figure 4 with Tables 1-2, Sections 4.1-4.3. See [arXiv PDF page 6](https://arxiv.org/pdf/1506.02640.pdf#page=6). This crop bundles tables and pie charts; numbers follow the PDF. Crop and license note match Figure 1.*

### Tables 2-3: ensembles and VOC 2012 (Sections 4.3-4.4)

**Table 2:** best Fast R-CNN **71.8%**; add YOLO rescoring to **75.0% (+3.2)**; ensembling Fast R-CNN variants alone adds only **+0.3 to +0.6**. **Table 3:** on VOC **2012 test** public leaderboard YOLO is **57.9% mAP** (only real-time row); **Fast R-CNN+YOLO is 70.7%**. YOLO trails R-CNN by **8-10%** on bottle, sheep, and tv (small objects) but wins on categories like cat and train—**per-class slices** resist a single win/loss sentence.

## Ablations and design choices

- **Coarse grid:** S=7 forces spatial specialization and caps objects per cell (Section 2.4).
- **$\lambda_{\text{coord}}$ / $\lambda_{\text{noobj}}$:** balance empty-cell confidence gradients (Section 2.2).
- **$\sqrt{w}, \sqrt{h}$:** penalize small-box deviations less in large boxes (Section 2.2).
- **NMS:** +2-3% mAP, unlike R-CNN-level dependence (Section 2.3).
- **YOLO VGG-16** (Table 1): **66.4% mAP at 21 FPS**—more accurate but the paper focuses on faster models afterward.

## Limitations and threats to validity

1. **Two boxes and one class vector per cell:** struggles with bird flocks and dense small objects (Section 2.4).
2. **Localization dominates errors:** Figure 4; do not blame VOC mAP gaps on classification alone.
3. **Data and classes:** VOC's 20 natural-image classes are not open-vocabulary or COCO-80.
4. **Hardware era:** 45 FPS on Titan X; remeasure on your device and resolution.
5. **Do not backfill:** YOLOv2 anchors, YOLOv3 COCO, YOLOv8, RT-DETR, and others are later leaves.
6. **Keep ResNet separate:** ResNet teaches classification residuals; this paper teaches the detection pipeline—COCO +6 mAP transfer tables do not reverse into YOLO single-pass evidence.

## Engineering decision and when not to use it

**When to borrow this paper:** your product puts **end-to-end latency** and **detection quality** on the same decision table and can accept single-pass full-image decoding. Measure **one forward pass plus NMS** before debating mAP.

**When not to copy it wholesale:**

- You need **SOTA mAP** and can pay two-stage cost—Table 1 still favors Faster R-CNN on mAP.
- **Small or crowded objects**—read Section 2.4 and VOC 2012 per-class slices first.
- You embed **63.4% VOC 2007** in a COCO or YOLOv8 product SLA.
- You confuse the **Ultralytics repo** with the **2016 paper**—the latter is the historical starting point, not a deployment contract.

> **Huahua's judgment**
>
> From ResNet, keep "rewrite the control point"; from YOLO, add one rule—**latency is a first-class metric, but VOC 2016 mAP/FPS is not a 2026 detector product guarantee.**

## Artifacts and reproducibility

As of **2026-08-28**:

- **Paper:** [arXiv abs](https://arxiv.org/abs/1506.02640) and [PDF](https://arxiv.org/pdf/1506.02640.pdf) are readable; [CVF open-access HTML](https://openaccess.thecvf.com/content_cvpr_2016/html/Redmon_You_Only_Look_CVPR_2016_paper.html) opens.
- **Code/models:** the authors state training/testing code is open source with pretrained models (abstract, Section 6); project page `http://pjreddie.com/yolo/` and the **Darknet** framework (Section 2.2). Modern PyTorch reimplementations are **downstream ports**, not identical training logs.
- **Data:** PASCAL VOC 2007/2012 are obtainable; ImageNet pretraining uses a different split.

A minimal useful reproduction: run **single forward plus 7×7×30 decode** on a VOC subset and compare **FPS versus localization/background error rates**—validate the mechanism, not 63.4%.

## Three things to remember

1. **Technical idea:** detection equals one CNN regression over an S×S grid of boxes and classes—the control point is removing propose-then-classify pipelines.
2. **Evidence:** VOC 2007 Table 1—YOLO **63.4% mAP at 45 FPS**; Fast YOLO **52.7% at 155 FPS**; Figure 4 shows more localization errors and fewer background errors; Fast R-CNN+YOLO **75.0%** comes from complementary mistakes.
3. **Boundary:** VOC 2012 **57.9%**, coarse grid and small-object limits; **not** a YOLOv3/v8 or COCO contract. AlexNet to ResNet to YOLO is the foundations spine: trainable classification, residual depth, unified real-time detection.

## Further reading

If you have not read the entry points, return to [AlexNet part 1](/en/paper-reading/01-alexnet-paper-reading-part-1/), [part 2](/en/paper-reading/02-alexnet-paper-reading-part-2/), and [ResNet](/en/paper-reading/37-resnet-deep-residual-learning/). For reading method, see the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). This note covers **original YOLO** only; later YOLO versions and COCO-era detection leaves are intentionally out of scope.

## Primary sources

- [Redmon et al., "You Only Look Once: Unified, Real-Time Object Detection," CVPR 2016 / arXiv:1506.02640 v5](https://arxiv.org/abs/1506.02640)
- [CVF open-access camera-ready](https://openaccess.thecvf.com/content_cvpr_2016/html/Redmon_You_Only_Look_CVPR_2016_paper.html)
- [DOI 10.1109/CVPR.2016.91](https://doi.org/10.1109/CVPR.2016.91)
- [YOLO project page (historical)](http://pjreddie.com/yolo/)
