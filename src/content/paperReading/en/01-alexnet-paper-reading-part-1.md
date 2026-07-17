---
title: "Rereading a Deep Learning Foundation 9 Years Later: AlexNet (Part 1)"
description: "Approaching AlexNet using the 'Three-Pass Paper Reading Method' starting from the title, abstract, and discussion: why it became famous on ImageNet, the core messages the paper intended to convey, and which conclusions still hold true today versus those needing a more precise interpretation."
pubDate: 2026-03-18
tags: ["深度學習", "AlexNet", "ImageNet", "卷積神經網路", "論文精讀", "Computer Vision"]
image: "/paperReading/01-alexnet-paper-reading-part-1/paper-title.webp"
field: "CV"
difficulty: "intro"
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
series:
  id: "alexnet"
  title: "AlexNet 精讀"
  part: 1
  totalParts: 2
---

If you had to pick a deep learning paper that "changed the course of the industry," AlexNet is almost always at the top of the list. It was not just a model that dominated the leaderboards back then, but more like a signal: **As long as the data is large enough, the model is deep enough, and the computing power can keep up, neural networks can crush mainstream methods of the time on difficult tasks.**

Mu Li attempts to use a more reusable approach to help you turn AlexNet (Krizhevsky et al., 2012) into your own knowledge: build the big picture first, then gradually go deeper. This article is the first part, focusing on the "first pass of reading": only looking at the information that best determines whether it's worth digging deeper into.

> Supplementary content reference for this article: Notes compiled from [Rereading a Deep Learning Foundation 9 Years Later: AlexNet [Paper Reading·2]](https://www.bilibili.com/video/BV1ih411J7Kz/?spm_id_from=333.1387.collection.video_card.click&vd_source=a7e865d522e259242df4f313c5004cc9) (Mu Li's paper reading video).


---

### Why reread AlexNet after so many years?

There are two values in rereading a classic:

- **Practicing the reading method**: Using a paper with a historical status, yet with a writing style that bears distinct marks of its era, to demonstrate how to quickly grasp the key points.
- **Calibrating conclusions from today's perspective**: Even classic works have the limitations of their time; we want to retain the essence, but we must also be able to point out which claims were actually just "reasonable conjectures at the time."

---

### The Three-Pass Paper Reading Method (The version used in this article)

The core spirit of this method is "the further back you go, the more expensive it gets": later stages of reading take more time, so you must first use the cheapest information to make decisions.

- **First pass**: Only look at the title, authors, abstract, and the final section (conclusion or discussion), then glance over the key figures and formulas.
- **Second pass**: Quickly skim the entire text to build an outline of the purposes of paragraphs and the methods.
- **Third pass**: Deeply derive, research background, implement, or reproduce the parts you really need.

This article only covers the first pass: after reading it, you should be able to answer "is this paper worth my time to proceed to the second pass."


> ![Three-Pass Paper Reading Method: from coarse to fine](/paperReading/01-alexnet-paper-reading-part-1/method-three-pass.webp)

---

### In the first pass, look at the title first: it tells you the "topic" and "method"
> ![AlexNet Paper Title (2012)](/paperReading/01-alexnet-paper-reading-part-1/paper-title.webp)
The title of AlexNet is:

**ImageNet Classification with Deep Convolutional Neural Networks**

Breaking down just two keywords is enough:

- **ImageNet Classification**: The massive image classification dataset and competition stage of that year (about 1.2 million training images, 1000 categories).
- **Deep Convolutional Neural Networks**: Convolutional Neural Networks (CNN) were not the common language of all machine learning researchers at the time, let alone the "deep" part. (The mainstream in industry and academia at the time was still SVM combined with hand-crafted features like SIFT/HOG.)

If you are not familiar with CNNs, it's perfectly normal not to understand the model architecture diagram in the first pass; what you need to do in the first pass is to "confirm what problem it is trying to solve and on what grounds it is worth your time."


---

### Next, look at the authors: this is not superstition, but quickly building priors
> Paper author list (Alex Krizhevsky / Ilya Sutskever / Geoffrey E. Hinton)
> ![Author list: Krizhevsky, Sutskever, Hinton](/paperReading/01-alexnet-paper-reading-part-1/paper-authors.webp)
The first author is Alex Krizhevsky, and the author group includes Ilya Sutskever and Geoffrey E. Hinton. Based on the community scale in 2012, author information can quickly give you two judgments:

- **This work is highly likely to be closely related to the neural network route** (Hinton's research context is very clear).
- **It may lean more towards "effectiveness and engineering" rather than a complete theoretical explanation** (this is indeed reflected in the paper's narrative).

Authors are not meant to be "worshipped", but are used to estimate "the writing style and form of evidence you are about to face."



---

### Read the abstract: it puts the selling point on the table in the very first sentence
> ![The abstract directly gives the top-1 / top-5 error rates](/paperReading/01-alexnet-paper-reading-part-1/paper-abstract-metrics.webp)
The abstract of this paper is very direct, written almost like a technical report:

- **What I did**: Trained a large, deep CNN for ImageNet classification (1000 categories).
- **How good my results are**: The top-1 and top-5 error rates on the test set were 37.5% and 17.0% respectively (the paper also mentions the 2012 competition top-5 figure of 15.3%; the difference comes from details in evaluation settings and data processing).
- **How large my model is**: About 60 million parameters, 650,000 neurons, 5 convolutional layers + 3 fully connected layers + a final softmax.
- **How I managed to train it**: GPU implementation, using dropout for regularization.

The key to reading the abstract in the first pass is not to memorize numbers, but to grasp a one-sentence conclusion:

> **This paper claims: On a sufficiently difficult and large-scale dataset, a large and deep CNN can significantly bring down the error rate in image classification.**



---

### Jump directly to the end: it has no "Conclusion", only "Discussion"
> ![The paper concludes with Discussion](/paperReading/01-alexnet-paper-reading-part-1/paper-discussion.webp)

AlexNet does not have a typical conclusion paragraph, but ends with a "Discussion." During the first pass, you can treat the discussion as "the few sentences the authors hope you take away":

- **Depth is important**: Removing a single layer degrades performance (the authors support this with experimental observations).
  - But let's add a more precise statement from today's perspective: performance degradation does not necessarily solely prove that "depth is the only key", as hyperparameters and configurations might also be involved; a more complete understanding is that "the configuration of both depth and width is important."
- **Strong results can be achieved without unsupervised pre-training**: Against the background where "deep networks are hard to train" was still a common intuition at the time, this statement carries a lot of weight.
  - Consequently, for a period of time, the entire field concentrated its firepower more on supervised training with labeled data and scalable computing power.
- **More computing power, data, and longer training might be better**: To today's readers, this statement reads both like a prophecy and a reminder: it relies on engineering conditions, not purely on model design.
- **Extending to video data**: The authors pointed out that videos contain temporal information, but progress was slow at the time limited by computing power and data acquisition (copyrights, etc.).



---

### Figures to scan in the first pass: you don't need to understand the architecture, but you must understand "what it's selling"

The transcript specifically points out several types of figures that are very valuable for the first pass:

> ![Qualitative results: examples of top-5 predictions](/paperReading/01-alexnet-paper-reading-part-1/qualitative-top5.webp)
- **Qualitative result figures (examples of top-5 predictions)**: Let you intuitively feel that "under fine-grained classification and multiple categories, it can provide reasonable candidates."
> ![Feature representation: similar images are clustered together in the semantic space](/paperReading/01-alexnet-paper-reading-part-1/feature-nearest-neighbors.webp)
- **Examples of similarity retrieval (features from the second-to-last layer)**: Even if the paper does not heavily emphasize it, this observation later proved to be very crucial:  
  **The feature representations learned by CNNs can place semantically similar images together, becoming transferable universal features.**
> ![Comparison with previous methods: significantly leading in error rate](/paperReading/01-alexnet-paper-reading-part-1/results-table.webp)
- **Table comparisons with previous methods**: It clarifies the paper's main selling point: **I'm not just winning, I'm winning by a huge margin**.

> ![AlexNet architecture schematic (block diagram)](/paperReading/01-alexnet-paper-reading-part-1/alexnet-architecture.webp)
- **Network architecture diagram (block diagram)**: It's okay if you don't understand it in the first pass; you just need to know first that it's a stacked architecture of "multi-layer convolution + pooling + fully connected."





---

### Summary: Three judgments you should get after finishing the first pass

If you only do the first pass of reading, the ideal takeaway is these three sentences:

- **What it solves**: It significantly brings down the error rate on massive, highly difficult image classification tasks like ImageNet.
- **On what grounds it relies**: A large and deep CNN + feasible training engineering (GPUs, data augmentation, ReLU, dropout, etc.) make the model truly trainable and less prone to overfitting.
- **What long-term impact it leaves**: It's not just a champion model, but it pushed "representation learning" and "scalable training" onto the main stage of industry and academia.

If you proceed to the second and third passes in the next part (middle/lower part), the focus will fall on: how much the model details and training tricks respectively contributed, and how some conclusions should be updated and interpreted today.

---

### Original Source

- **Paper**: Krizhevsky, A., Sutskever, I., & Hinton, G. E. (2012). *ImageNet Classification with Deep Convolutional Neural Networks.* Advances in Neural Information Processing Systems (NeurIPS 2012).  
  - `https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf`
