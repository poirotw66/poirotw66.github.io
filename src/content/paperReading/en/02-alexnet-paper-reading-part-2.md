---
title: "Re-reading a Foundational Work of Deep Learning 9 Years Later: AlexNet (Part 2)"
description: "How to read 'what the methods really look like' during the second pass: why ReLU is key, how to read the architecture diagram, the historical baggage of multi-GPU partitioning, and AlexNet's data augmentation and training hyperparameters—what is worth learning and what is just a limitation of the era."
pubDate: 2026-03-19
updatedDate: 2026-03-19
tldr:
  - "How to read 'what the methods really look like' during the second pass: why ReLU is key, how to read the architecture diagram, the historical baggage of multi-GPU partitioning,…"
audience:
  - "AI/ML practitioners and researchers who want method, evidence, and engineering implications before a full paper read."
  - "Engineers deciding whether a paper’s ideas are worth implementing or citing."
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

The previous part used the first pass to establish a big picture; this part enters the **second pass of reading**: quickly reading through the paper from beginning to end. The goal is not to "understand every detail", but to:

- Write down what each paragraph is doing in one sentence
- Find the technical points the authors really want to sell (as well as the places they didn't explain clearly, but you should circle)
- Make a list of questions to "dig deep into during the third pass"


---

### The mindset for the second pass: Read from the authors' perspective, not by memorizing details

The most valuable takeaway from the second pass is often "how the authors describe the problem" and "how the authors arrange the evidence".

- Classic papers often contain many **engineering details of their era**, which do not necessarily need to be copied exactly today
- But they allow you to see: what the bottlenecks were back then, and what was considered a breakthrough

---

### How to read the Introduction: Break the "story" into three claims

AlexNet's Introduction basically says three things (restated in today's language):

- **The task is very hard**: Large-scale, multi-class image recognition requires very strong representation capabilities
- **The model needs to be large enough**: The larger the capacity, the more likely it is to overfit or be untrainable
- **Engineering makes it runnable**: Data, GPUs, training tricks, and architecture design work together to make the model trainable

The approach for the second pass is: after reading each paragraph, write down a sentence about "which claim/evidence this paragraph is laying the groundwork for".

---

### 1) ReLU: Its value is not mystery, but "simplicity, trainability, and runnability"

ReLU is placed very early on because the authors wanted to emphasize "training speed/feasibility".

During your second pass, you don't need to fully understand "saturating/non-saturating", but you need to be able to note down:

- The authors treat ReLU as a key technical point
- They use graphs (training curves) to convince you of "faster convergence"
- The real reasons and complete comparisons might require filling in background knowledge during the third pass

**To-do for the third pass (circle these first)**

- Why does ReLU make training better? What does it have to do with vanishing gradients/initialization?
- Is AlexNet's experimental setup sufficient to support the causal conclusion that "ReLU is faster"?

---

### 2) Multi-GPU partitioning: The important thing is the "historical bottleneck", not copying the partition method

In 2012, single-GPU memory was small, and the authors spent a lot of effort splitting the network across two cards, which was packaged as an important contribution in the paper's narrative.

But reading the second pass with today's perspective, you can treat it as:

- **Evidence of a bottleneck**: Hardware limitations were very strong back then, forcing out many "as long as it runs" designs
- **Ignorable details**: If your goal is not to reproduce it under the same hardware conditions, the partitioning method itself is not the core of the methodology


**An interesting historical echo**

This kind of partitioning can be seen as an early form of *model parallel*. It was unpopular for a while, but as models got larger (especially in NLP), it re-emerged as one of the mainstream tools.

---

### 3) How to read the architecture diagram: First read "tensor size changes", then read "the purpose of the layers"

AlexNet's diagram is easy to get lost in. For the second pass, it is recommended to only grasp two levels:

- **Shape changes**: An input of $224 \times 224 \times 3$, after convolutions/strides/pooling, spatial resolution gradually decreases, and the number of channels gradually increases
- **Functional division**: The front convolutions extract features, the back fully connected layers do classification, and finally softmax

**Two sentences you should write down in the second pass**

- This is a typical early deep network paradigm of "five convolutional layers + three fully connected layers"
- It uses large convolutional kernels (e.g., 11×11) and larger strides to quickly reduce resolution, trading it for trainable computational load

---

### 4) Pooling and Overlapping pooling: Just know what it changed

For pooling/overlapping pooling, the focus is not on the derivation, but on:

- It was a small modification to the common pooling at the time
- The authors claimed there were benefits, and you need to note down the "modification points" and fill in the details when needed


---

### 5) How to handle overfitting: Data augmentation + Dropout + Weight decay

#### 5.1 Data augmentation: Random cropping lets you "see more samples"

The first technique is: randomly cropping $224 \times 224$ patches from $256 \times 256$ images as training inputs.

The intuition to grasp in the second pass here is:

- Multiple "viewpoints" can be generated from the same image
- The model is less likely to memorize the fixed positions/compositions of the training data


#### 5.2 PCA color augmentation (Color jitter): Just know "it tweaked the color channels"

AlexNet used PCA to perturb the RGB channels. For the second pass, you can just note down:

- This is a random perturbation to the color distribution
- The purpose is to increase the diversity of color/lighting conditions


#### 5.3 Weight decay (L2 regularization) and Momentum: The mainstream SGD recipe of the time

Two points worth keeping in your notes:

- **Weight decay** is often treated by the deep learning community as the implementation language for L2 regularization
- **Momentum** became standard equipment for a long time afterwards (even though there were more "fancy acceleration methods" at the time)

---

### 6) Learning rate strategy: From "manually monitoring training" to a "regular/smooth schedule"

The common practice in the AlexNet era was: start with a certain initial learning rate, and when the validation error stops decreasing, multiply the learning rate by 0.1 (reduce it by ten times).

Reading the second pass with today's perspective, you can understand it as:

- Computing power was expensive and toolchains were immature back then, so many strategies relied on manual monitoring
- Later it gradually evolved into a fixed-rhythm step decay, or even a smoother cosine decay

---

### Summary: The checklist you should be left with after the second pass

If you write down "the outlines you already understand" and "the holes to fill in the third pass" separately, the second pass is very successful:

- **Outlines**: ReLU, architecture design, data augmentation, SGD recipe, and learning rate decay
- **Holes (Third pass)**: Why ReLU is faster, the specific implementation of PCA color jitter, and which engineering details are really important for reproducibility
- **Preview for the next post in the series**: The next post will organize these "holes" into a reproducibility checklist and verify which details can actually be replaced with more stable modern practices today
