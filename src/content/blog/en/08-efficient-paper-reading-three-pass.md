---
title: "Efficient Academic Paper Reading: The Three-Pass Approach"
description: "Turning the 'three-pass reading method' into an actionable workflow: 5–10 minutes for screening, 1 hour to grasp methods and evidence, and 'virtually re-implementing' to master details. This article integrates Keshav's three-pass method with Mu Li's practical tips, complete with a checklist and literature review guide."
pubDate: 2026-03-18
category: "Technology"
tags: ["論文閱讀", "研究方法", "文獻整理", "學術寫作", "研究生", "時間管理"]
image: "/blog/08-efficient-paper-reading-three-pass/title_image.webp"
subtitle: "從海選到精讀的實戰節奏與檢查清單"
kind: guide
showToc: true
---
Researchers often spend hundreds of hours a year reading papers, yet most are never formally taught how to read them. As a result, they spend a lot of time reading word-by-word, but still struggle to articulate what the paper contributes, whether its hypotheses hold up, and if it is worth pursuing further.

This article merges two sets of notes into a **readily actionable** workflow: the **three-pass approach** proposed by S. Keshav in his classic "How to Read a Paper", combined with the practical pacing emphasized by Mu Li in his teaching ("grasping methods and experiments just by looking at figures and tables"). You don't need to read every paper to the third pass; what you need is to **know when to stop**, and **have usable outputs when you do stop**.

---

### The Core of the Three-Pass Approach: The Further You Go, The More Expensive It Gets

The three passes are not mandatory actions, but rather cost stratification:

- **First pass (5–10 minutes)**: Screening, aiming only for a "bird's-eye view" and determining "whether it is worth continuing."
- **Second pass (30–60 minutes)**: Selecting, grasping the methods, evidence, and comparisons without getting bogged down in derivation details.
- **Third pass (1–5 hours)**: In-depth reading, attempting to "virtually re-implement" the work to unearth implicit assumptions and reproducible paths.

> A very practical goal is: **You can decide to reject a paper by the end of the first pass**; clearly summarize it to a classmate by the end of the second pass; and start conducting research or reproducing it by the end of the third pass.

---

### First Pass: 5–10 Minutes of "Screening" Scan

The first pass involves only four tasks (Keshav's version):

- **Read the title, abstract, and introduction**
- **Scan section and sub-section headings** (skip the main text for now)
- **Read the conclusion/discussion**
- **Scan the references** (mentally tick off familiar ones, and note down unfamiliar but frequently occurring ones)

After doing this, force yourself to answer Keshav's "Five Cs":

- **Category**: What type of paper is this? A measurement? System? Analysis? New method? Prototype implementation?
- **Context**: Which works does it follow? What theories or common setups does it use?
- **Correctness**: Do the assumptions seem reasonable? Do the settings deviate from reality?
- **Contributions**: What does it actually add? A new method, dataset, observation, or engineering integration?
- **Clarity**: Is it well-written? Are the key definitions clear?

#### Outputs of the First Pass (Must be written down)

Leave 3–5 sentences in your notes:

- **One-sentence summary**: What problem is this paper solving, and in what direction?
- **What makes it great**: The most critical result or highlight (could be a figure or a table).
- **Should I continue**: Do not read / Read second pass / Directly list for reproduction.

> The reminder from Mu Li's version is crucial: the task of the first pass is to "judge relevance," not to "understand it completely."

---

### Second Pass: 30–60 Minutes of "Selected" Reading

The principle of the second pass is: **Walk through the paper from beginning to end, but deliberately ignore the most detailed proofs and derivations**, focusing your attention on the "chain of evidence."

You will do two things (Fusion of Keshav + Mu Li's versions):

- **Label what each paragraph is doing with one sentence**: The introduction sets the problem, the method proposes a solution, the experiments validate it, and related work positions it.
- **Understand all key figures and tables**:
  - What do the x-axis and y-axis represent?
  - What setup does each point/line represent?
  - Are there error bars, control groups, or ablation studies?
  - How much does it differ from the baseline? Is the difference stable?

At the same time, circle the "references to catch up on":

- Terminology, setups, or datasets you don't understand usually have sources in the references.
- If the paper is too difficult, read its cited "precursor foundational works" first, as the barrier to entry is often lower.

#### Outputs of the Second Pass (Must be written down)

After the second pass, you should be able to clearly explain without looking at your notes:

- **Problem definition**: Inputs/outputs, evaluation metrics, constraints.
- **Method outline**: What modules make up the method? What does each module solve?
- **Evidence summary**: Which three figures or two tables best support its claims?
- **Failures and limitations**: What limitations do the authors acknowledge? What do you think they missed?

---

### Third Pass: Mastering Details by "Virtually Re-implementing"

Keshav's definition of the third pass is very precise: **Pretend you are going to re-implement what the authors did**. You don't necessarily have to write code, but you need to walk through it in your mind:

- If I were to use the same assumptions and data, how would I produce the experiments?
- Which details are not clearly written and require guessing?
- Which parts seem obvious but are actually critical assumptions?

Mu Li's version is even more straightforward: the third pass requires you to "know what every sentence is doing" and be able to propose:

- **If I were to do it**: How would I implement it? How would I design the control group?
- **Can it be better**: Which parts could be stronger if modified? Which parts are actually unstable?

#### Outputs of the Third Pass (Must be written down)

It is recommended to consistently output three sections:

- **Reproducibility checklist**: Data, preprocessing, models, training details, hyperparameters, hardware, evaluation.
- **Assumptions list**: What assumptions do each key conclusion rely on? Do the assumptions hold in your scenario?
- **Ideas for future work**: 2–5 directions where "I can extend" (the more specific, the better).

---

### One-Page Checklist (Ready to Copy)

#### First Pass (5–10 Minutes)

- [ ] I can state the problem this paper is solving in one sentence.
- [ ] I can name its three keywords (method/data/task).
- [ ] I can point out its main contribution (not the result).
- [ ] I know why I should/should not read the second pass.

#### Second Pass (30–60 Minutes)

- [ ] I can draw the workflow of the method (even just a block diagram).
- [ ] I understand the x/y axes and control groups of every key figure/table.
- [ ] I can explain the experimental design to someone else in 1 minute.
- [ ] I have circled 1–5 must-read references to catch up on.

#### Third Pass (1–5 Hours)

- [ ] I can list the complete reproduction steps and missing information.
- [ ] I can point out at least 3 implicit assumptions or potential loopholes.
- [ ] I can propose at least 2 specific improvements or extended experiments.

---

### Doing Literature Surveys with the Three-Pass Approach: Converge First, Then Expand

Keshav also extends the three-pass approach to literature surveys. A simplified, actionable version is:

- **First, find 3–5 recent and relevant papers**: Only do the first pass for each to quickly gauge the research landscape.
- **Read their related work**: Look for repeatedly cited references and author names.
- **Converge on a "core paper set"**: List those frequently cited papers as candidates for the second/third pass.
- **Iterate when necessary**: If you find everyone is citing a work you haven't read, add it to your list and do a first pass on it.

The advantage of this workflow is: you won't drown in details right at the start. Instead, you get the "map" first, then decide which hole to dig into.

---

### Summary: What the Three-Pass Approach Really Solves is "Attention Allocation"

The three-pass scanning method isn't about finishing every paper faster, but about spending time where it's worth it faster:

- The first pass helps you **reject the unimportant**.
- The second pass helps you **grasp the chain of evidence**.
- The third pass helps you **turn it into usable research material**.

If you are willing to make just one change: starting from the next paper, **spend 10 minutes on the first pass first**, and force yourself to write down the "Five Cs" and "whether to continue." You will immediately feel the resistance to reading literature drop significantly.

---

### How Paper Readings Are Published on This Site (From 2026 Onwards)

The three-pass reading is still a **thought process** (speed read to judge first, then grasp methods and evidence, and dig deep with a third pass if necessary), but the [paperReading](/paper-reading/) series is shifting to **one interpretation article per paper** (no splitting into "Part 1 / Part 2" or `-part-1` / `-part-2` files). For writing and acceptance thresholds, see `docs/guideline/content-reading-quality.md` (PRD-002 / spec-010) in the repo. The historical [AlexNet In-depth Reading (Part 1, Part 2)](/paper-reading/01-alexnet-paper-reading-part-1/) retains two links, but please align new drafts with the single-article format.

---

### Original Sources

- S. Keshav. *How to Read a Paper*. (Proposed the three-pass approach and Five Cs)  
  - Reference link: [How to Read a Paper (University of Waterloo)](https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf)
- [How Mu Li Reads Papers](https://www.bilibili.com/video/BV1H44y1t75x?spm_id_from=333.788.videopod.sections&vd_source=a7e865d522e259242df4f313c5004cc9)
