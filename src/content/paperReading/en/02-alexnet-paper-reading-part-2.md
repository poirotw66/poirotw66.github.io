---
title: "AlexNet Part 2: Turning the Training Recipe into Testable Design Choices"
description: "A source-grounded reading of ReLU, multi-GPU splitting, overlapping pooling, augmentation, and dropout in Figure 1–3 and Sections 3–6."
pubDate: 2026-03-19
updatedDate: 2026-08-09
tldr:
  - "AlexNet is a package of architecture and training-system choices: ReLU, two-GPU splitting, augmentation, dropout, and a manual learning-rate schedule."
  - "It contains component comparisons, not a full factorial ablation; its historical details are not defaults for current systems."
audience:
  - "Practitioners turning classic CNN details into testable engineering hypotheses."
  - "Readers separating hardware-era constraints from general principles."
tags: ["Deep Learning", "AlexNet", "ImageNet", "Convolutional Neural Network", "Paper Reading", "Computer Vision"]
image: "/paperReading/01-alexnet-paper-reading-part-1/paper-title.webp"
showToc: true
field: "CV"
difficulty: "intermediate"
paper:
  title: "ImageNet Classification with Deep Convolutional Neural Networks"
  authors:
    - "Alex Krizhevsky"
    - "Ilya Sutskever"
    - "Geoffrey E. Hinton"
  year: 2012
  venue: "NeurIPS 2012"
  links:
    pdf: "https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf"
    code: "https://github.com/BVLC/caffe/tree/master/models/bvlc_alexnet"
series:
  id: "alexnet"
  title: "AlexNet Deep Dive"
  part: 2
  totalParts: 2
---

## The paper in 90 seconds

- **Problem:** a 60M-parameter CNN can overfit even with 1.2M images, and its training recipe must be separated from the competition result.
- **Core insight:** random crop/flip, RGB PCA lighting jitter, and dropout change or regularize the effective training distribution; SGD, momentum, weight decay, and a learning-rate schedule make Part 1's architecture converge.
- **Strongest evidence:** color augmentation reduces top-1 error by over 1%, overlapping pooling by 0.4/0.3 points, and the full system reaches 37.5/17.0 on ILSVRC-2010 and 15.3 top-5 in 2012 (Sections 4–6; Table 1).
- **Main boundary:** these ablations belong to the era's architecture, data, and compute; they do not show every modern vision model needs ten-crop, LRN, or the same schedule.

## Why the previous approach is insufficient

Part 1 capacity can memorize fixed center crops, while a literal ensemble is too expensive. Dropout approximates a shared-weight ensemble and augmentation exposes label-preserving transformations. This part focuses on generalization and the optimization recipe rather than repeating convolutional architecture (Sections 4–5).

## Core intuition and method

Random 224×224 crops and horizontal flips vary position; PCA color jitter varies illumination while preserving class; dropout zeros a hidden unit with probability 0.5 so units cannot rely on fixed co-adaptations. The SGD update combines loss gradient, 0.9 momentum, and $5\times10^{-4}$ weight decay; when validation error stalls, learning rate is divided by ten (Sections 4.1–5).

## Worked example: one image across training and test

The same dog image may be a left-top flipped crop in one round and a different crop with RGB jitter in another, so the model must represent the dog across those changes. A fully connected unit can be dropped in that round, requiring other features to support classification. At test time, softmax predictions from ten crops are averaged, trading inference cost for stability. A crop can still omit the object; this is a mechanism walkthrough, not an error guarantee (Section 4).

## How to read the evidence

**Section 4.1** calls 2048 the number of transformation combinations, not independent samples. **Section 3.4, 4.1, and Figure 1** answer different questions about pooling, nonlinearity, and color jitter; their deltas cannot simply be added. **Table 1 / Section 6** is an ILSVRC-2010 full-system comparison; 2012 labels were unavailable and 15.3% is not a same-table ablation.

## Artifacts and engineering decision

As of **2026-08-09**, the original cuda-convnet endpoint is not a runnable artifact; the NeurIPS PDF is the primary accessible source. The transferable practice is validation-driven schedules, measuring the generalization gap, and evaluating each regularizer with its compute cost. Do not copy period-specific hyperparameters or ten-crop inference unchanged into a modern pipeline.

## Three things to remember

1. Part 2 makes large capacity generalize and converge; it does not add architectural depth.
2. Augmentation, dropout, and schedule are an interacting recipe, not additive ablation points.
3. AlexNet's win is a system result; modern adoption must remeasure data and cost conditions.

## Reader question and verdict

What should an engineer borrow from AlexNet? Not its 11×11 convolution or LRN by default, but its decomposition of trainability, capacity, and overfitting into measurable hypotheses. This continues [Part 1](/en/paper-reading/01-alexnet-paper-reading-part-1/) and covers the method and training recipe within the original evidence boundary.

## Evidence Map

- **Paper directly supports:** Section 3.1 and Figure 1 support faster convergence for ReLU in one four-layer CIFAR-10 network; Sections 3.2–3.4 report component differences for multi-GPU execution, LRN, and overlapping pooling.
- **Author claims:** Figure 2’s eight learned layers plus Sections 4–5 augmentation, dropout, and SGD recipe make a large model trainable.
- **Not supported:** these figures are not a full factorial ablation and do not compare BatchNorm, Adam, mixed precision, or modern augmentation.
- **Our engineering judgment:** turn each historical trick into a fixed-budget experiment rather than copying it wholesale.

## Method skeleton

1. Resize to 256, sample 224×224 crops and horizontal flips, then add RGB PCA colour perturbation (Section 4.1).
2. Use five convolutional and three fully connected layers with a 1,000-way softmax; apply ReLU after every learned layer (Figure 2; Section 3.5).
3. Split kernels over two GPUs and exchange activations only at selected layers (Section 3.2).
4. Apply dropout to the first two fully connected layers and update by mini-batch SGD (Section 4.2; Section 5).

## Architecture and training details

Figure 2 starts with 96 11×11×3 kernels at stride four; Section 3.5 gives the connections through convolution layers two to five and two 4,096-unit fully connected layers. This is not an abstract single-GPU “AlexNet”: convolution layers two, four, and five have local GPU connections, a memory/communication compromise.

Section 5 specifies **compute/training**: batch size 128, momentum 0.9, weight decay 0.0005, initial learning rate 0.01, divide the rate by ten when validation error stops improving, and roughly 90 epochs. Training consumed five to six days on two GTX 580 3GB GPUs. Treat these as a reproduction starting point, not optimal parameters after hardware and data change.

## Experiments, ablations, and failure signals

- **Figure 1 / Section 3.1:** ReLU reaches 25% training error six times faster than tanh, but only for a four-layer CIFAR-10 net; this is not an ImageNet accuracy conversion.
- **Section 3.2:** two-GPU execution reduces top-1/top-5 error by 1.7/1.2 points relative to a smaller one-GPU net; the footnote says the comparison is biased in favour of the one-GPU model.
- **Sections 3.3–3.4:** LRN reduces error by 1.4/1.2 points and overlapping pooling by 0.4/0.3 points. These are component ablations, not independent additive causal effects.
- **Sections 4.1–4.2:** colour PCA reduces top-1 error by over one point; without dropout the net substantially overfits, while dropout roughly doubles convergence iterations. That is the accuracy/regularization/training-cost trade-off.

Table 1 and Table 2 supply the benchmark outcomes discussed in Part 1. Training-loss improvement must not be misread as improvement for every downstream metric.

## Reading Figure 2 layer by layer: shape, connectivity, history

Figure 2 and Section 3.5 permit an input-to-classifier check: 224×224×3 enters 96 11×11 stride-four filters; layer two has 256 5×5×48 filters; layer three 384 3×3×256; layers four/five 384/256 3×3×192 filters; then two 4,096-unit fully connected layers and a 1,000-way softmax. The figure also gives neuron counts (253,440 through 1,000), an entry point for activation memory rather than memorising only “60M parameters.”

Layers two, four, and five connect only to feature maps on the same GPU; layer three and the fully connected layers cross GPUs. This pattern is not a representation-learning principle: Section 3.2 locates its motivation in GTX 580 3GB memory and cross-GPU communication. With data parallelism or another accelerator, measure fully connected and split variants for memory, throughput, and accuracy; Figure 2 supplies no universal optimal partition.

LRN should not be called generic “normalization.” Section 3.3 sets k=2, n=5, α=10^-4, β=0.75 and applies it after ReLU in selected layers; the authors call it closer to brightness normalization because it does not subtract mean activity. Its purpose/statistics are not interchangeable with modern batch or layer normalization. If a current experiment removes LRN, report what normalization replaces it instead of attributing every difference to model age.

## Training/regularization interactions

Section 4.1’s random 224 crop plus mirror yields 2,048 position/mirror combinations per 256×256 training image, but they are highly dependent—not 2,048 independent samples. Test prediction averages five crops (corners and centre) and mirrors, at ten forward passes. RGB PCA samples one α for all pixels of an image to approximate illumination invariance; it is not arbitrary per-pixel noise.

Dropout zeros hidden-neuron outputs with probability 0.5, then uses all neurons at test time with output multiplied by 0.5. Section 4.2 frames it as an approximation to an expensive ensemble and reports substantial overfitting without it plus roughly doubled convergence iterations. Preserve the interaction with weight decay: Section 5 says 0.0005 weight decay not only regularizes but reduces training error. That is an observation for this setup, not a guarantee under every optimizer.

## From original recipe to modern reproduction: what to fix and reselect

To test the paper’s claims, first fix the comparison unit: the same data split, 224 crop, top-1/top-5 metric, an SGD-family optimizer, an explicit train/test crop policy, and validation error by epoch. Only then change one factor—ReLU versus tanh, dropout on/off, overlapping versus non-overlapping pooling, or single versus ten crops. Report accuracy, wall-clock, peak memory, and per-image latency together. Best accuracy alone cannot answer the paper’s engineering question of making large networks experimentable.

Do not transplant every number. Two-GPU splitting targets memory feasibility; when a current single GPU fits the model, keeping it can add complexity only. Ten crops are test-time ensembling; ten forward passes may violate a serving latency budget. LRN’s small error improvement should be evaluated with its kernels, memory traffic, and replacement normalization. ReLU, augmentation, and regularization retain a transferable question: under fixed data and budget, do they improve optimization or generalization?

Separate three reproduction levels. **Functional reconstruction** means layers run and shapes match Figure 2. **Protocol reconstruction** means split, crops, metric, and epoch schedule match. **Numerical reconstruction** means approaching Table 1/2 errors. The first two are usually achievable; the third is limited by missing original CUDA code, data revisions, hardware nondeterminism, and unavailable competition labels. Naming the level is more honest and more useful than claiming to have “reproduced AlexNet.”

## Limitations and evidence boundary

LRN, cross-GPU group connections, and ten-crop inference are strongly era-specific. The paper lacks head-to-head **baselines** for modern normalization, optimizers, or augmentation. Its validation-guided schedule may fail under a different seed, data revision, or distributed setup. Without complete code, seed, checkpoint, and original preprocessing artifacts, digit-for-digit agreement is an unsupported interpretation.

## Artifact and reproducibility status (as of 2026-08-09)

The accessible [BVLC Caffe AlexNet definition](https://github.com/BVLC/caffe/tree/master/models/bvlc_alexnet) supplies model configuration and a later weights workflow: it is a **usable partial artifact**, not the authors’ original CUDA-convnet release. The paper’s Google Code repository does not provide a verifiable complete training release; licensed ImageNet data and ILSVRC test labels are not bundled. “Official full reproducibility” is therefore **missing/unavailable**.

Implement an equivalent Figure 2 layer sequence in a current framework, toggle augmentation, dropout, and crop policy independently, and report target-data accuracy, latency, memory, and seed variance. A Caffe checkpoint is not proof of the original experiment.

## Engineering implications: when not to use it

Use it when constrained GPU memory calls for a CNN training baseline and each choice can be ablated. **Do not use it** to import LRN, two-GPU grouping, or ten-crop inference into production unchanged; compare current backbones and training/serving cost when memory, latency, or energy matter.

## Primary Sources

- [Full AlexNet paper](https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf): Figure 1–3, Sections 3–6, Table 1–2.
- [BVLC Caffe AlexNet model definition](https://github.com/BVLC/caffe/tree/master/models/bvlc_alexnet): accessible but not original complete artifact.
