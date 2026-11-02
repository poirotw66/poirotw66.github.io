---
title: "AI Cosmos: Is Getting It Right with AI the Same as Learning It?"
description: "Use AI Cosmos's legal and programming studies to examine situated participation, executable workbenches, and the difference between earning points and mastering a target skill."
pubDate: 2026-11-02
updatedDate: 2026-11-02
tldr:
  - "AI Cosmos organizes practice around roles, knowledge, and shared workbenches, but a system completing a task does not establish that the learner acquired the skill."
  - "The legal study supports an immediate learning-gain advantage over a vanilla LLM; programming post-test score differences and the 68% versus 45% conditional mastery comparison were not significant."
  - "Credit-earning submissions, expert-rated target-algorithm mastery, retention, and far transfer require separate evaluation."
audience:
  - "Engineers designing AI learning tools and human–AI interaction workflows"
  - "Readers interpreting performance and competence measures in AI tutoring research"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Harness Engineering"]
kind: "article"
showToc: true
image: "/blog/150-ai-cosmos-performance-and-learning/title_image.webp"
imageAlt: "Original watercolor concept illustration: Huahua compares a reference book with an unfinished puzzle at a warm desk, considering how to understand and solve a new problem."
---

Imagine a programming exercise: with AI assistance, you get every test to pass. A week later, a differently framed problem requires the same kind of algorithm, and you cannot work out where to start. What did the earlier success establish—your learning, or an artifact that you and the AI produced together?

[AI Cosmos](https://arxiv.org/abs/2610.40031) addresses that gap. Its authors propose an infrastructure for situated learning and examine learning performance in legal reasoning and competitive programming. The useful move is to separate a credit-earning answer from evidence of the intended skill. The strength of the findings varies, however, and they should not be compressed into “agent-based tutoring has been proven more effective.”

## Keep the learner inside the problem-solving process

A conventional question-and-answer interface can treat artifact delivery as its endpoint: ask a question, receive an explanation or code, and finish the interaction. AI Cosmos instead configures a scenario around a learning objective: who participates, which knowledge resources are available, which workbenches are needed, and what humans and agents can each do.

The programming workbench makes that distinction concrete. Learners and agents work on the same mutable state: write code, execute it, inspect an error, and revise. Execution results can shape the next exchange. This gives “I understand” a place to encounter a counterexample. Explaining an idea is one step; maintaining the algorithm's invariants, handling boundary cases, and explaining a repair are further demands. The [architecture](https://arxiv.org/html/2610.40031v1#S3) connects scenario configuration, interaction scheduling, and workbench operations.

An asset–memory loop also preserves artifacts, process records, failures, repairs, provenance, and dependencies for later scenarios. That is part of the architecture, but the two studies primarily examine scenario-based interaction. They do not separately establish the long-term educational effect of the complete memory-reuse mechanism. Preserving more practice records can make a process inspectable; it does not automatically establish better retention.

## The legal study supports an immediate gain, not an established long-term advantage

The authors describe the legal study as a preregistered three-arm randomized trial using the same underlying LLM. It compares a vanilla assistant, a teacher-persona prompt, and AI Cosmos. **131 participants** were initially assigned; after exclusions under minimum-engagement criteria applied to learning logs, **111 remained, 37 per arm**. These are findings for the analyzed sample, not an analysis of every assigned participant.

Participants completed a pre-test, learning activities, and a difficulty-matched post-test with new questions. Objective items account for **80%** of the legal score and open responses for **20%**. The authors report that AI Cosmos exceeds vanilla LLM interaction by **7.0 percentage points in immediate raw learning gain, p = 0.018**. Cohen's d is **0.56**, with a **95% bootstrap confidence interval of [0.10, 1.05]**. That interval concerns the standardized effect size, not the additional score points. Adjusting for the pre-test gives an estimated difference of **4.47 points, p = 0.018**. The [methods and results](https://arxiv.org/html/2610.40031v1#S4.SS1) distinguish these estimates.

Changing the comparator narrows the conclusion. AI Cosmos's gain over the teacher-persona condition is not significant; the omnibus test of raw gains across all three groups is also **p = 0.057**. This does not erase the planned AI Cosmos–vanilla contrast, but it does prevent turning the findings into a clear ranking of all three architectures. Open-response differences are not significant either, so the study does not establish a general improvement in extended legal argumentation.

Approximately four weeks later, a randomly selected subsample of **18 participants per arm** takes another assessment. AI Cosmos retains the highest mean gain, but the between-group test gives **p = 0.62**, and forgetting also does not differ significantly. This is an inconclusive longer-term signal, not confirmation that the advantage persists for a month.

## The denominator behind 68% versus 45% is submissions, not students

The programming study compares the same three kinds of interaction, but both AI Cosmos and LLM-as-Teacher are prohibited from supplying complete solutions; the vanilla assistant is unrestricted. Comparing the two code-withholding conditions therefore better targets the additional support available through the workbench. Comparisons with vanilla also involve different answer restrictions.

The authors recruit **140 students**; **100** complete the diagnostic pre-test, and **54** complete the full multi-session protocol and enter the analysis: **19 AI Cosmos, 18 LLM-as-Teacher, and 17 vanilla LLM**. The paper also states that participants already proficient in both curricula do not enter training. The entire gap from 140 to 54 therefore cannot be labeled dropout. Nevertheless, the absence of a full flow by arm and reasons for noncompletion limits inference to the recruited population. The [programming methods](https://arxiv.org/html/2610.40031v1#S4.SS2) specify these sample boundaries.

Practice follows a learn, self-check, and independent-quiz sequence. A week later, two unseen post-test problems require variants or combinations of the trained algorithms. AI Cosmos has the highest mean continuous post-test score, but the omnibus comparison gives **p = 0.20**, and adjustment for pre-test and curriculum track gives **p = 0.16**. Neither meets the study's 0.05 threshold.

The authors also have the two problem authors inspect source code while blind to condition. Their assessment is not an undefined claim of “real understanding.” It asks whether the submission implements the problem's target algorithm substantially completely and correctly. **G4 or G5** on a five-level scale meets the criterion; G4 can still contain minor, non-fundamental defects. A non-target approach that earns partial test credit does not thereby count as mastery of the intended algorithm. [Appendix A.3](https://arxiv.org/html/2610.40031v1#A1.SS3) defines the grades and error codes.

| Measure | Denominator and assessment | AI Cosmos / vanilla LLM |
|---|---|---|
| Positive credit | Post-test submissions with online-judge (OJ) scores above zero | 82% / 85% |
| Target-algorithm mastery | All post-test submissions rated at least G4 by experts | 55% / 38% |
| Mastery among scored submissions | Only credit-earning submissions, then the share reaching G4 | 68% / 45% |

These are submission-level proportions. Each participant faces two post-test problems; the final row does not mean “68% of students learned the skill.” The **68% / 45% AI Cosmos–vanilla comparison gives p = 0.12**, which is not significant. The **68% / 32% comparison with LLM-as-Teacher gives p = 0.009**. In a separate participant-level analysis of how many problems each person masters, the AI Cosmos–teacher difference gives **p = 0.024**. Comparators, denominators, and units of analysis must travel with their numbers. The [programming results](https://arxiv.org/html/2610.40031v1#S4.SS2.SSS2) distinguish them.

## Target-algorithm mastery is not proof of broad transfer

The useful feature of this blind assessment is its explicit educational target. If a course teaches segment trees, an answer that earns some points without implementing a segment tree may not satisfy that teaching objective. Conversely, this means the mastery measure concerns implementation of the specified target algorithm. It is not a measure of a person's overall programming ability or a universal rule for dismissing alternative valid solutions.

The new problems use variants and combinations of trained algorithms. That tests generalization close to the trained material, not far transfer to another domain, tool, or substantially longer time horizon. The programming sample is also small and predominantly male and first-year undergraduate. Submission-level analyses are exploratory and uncorrected for multiple comparisons.

Two further conditions should not be supplied on the authors' behalf. The paper describes both studies as preregistered, but this version provides no registration identifier or link to inspect. It does not name the underlying model either. Some activities are described as independent, and the post-test as contest-style, but complete operational rules and supervision for prohibiting AI during each assessment are not specified. This article therefore does not present the findings as fully verified evidence from completely AI-free tests. Those reporting gaps limit the strength of the inference; a product demonstration cannot fill them.

> **Huahua's engineering note**
>
> Automated tests ask which test cases an artifact passes. Blind target-algorithm grading asks which implementation skill its code exhibits. Determining what the learner can do after assistance is removed also requires explicit assessment conditions and follow-up.

## Learning tools need evidence about the person's capability

What I would take from this work is a change in the unit of evaluation: from what the AI delivers to which decisions the learner makes. A workbench makes errors, execution, and repair observable. Even a successful trace still requires distinguishing the learner's actions from those delegated to agents. The paper itself notes that positive and negative experience labels in memory reflect task progress, not pedagogical effectiveness.

This resembles the evaluation distinction in [OpenGray between action selection and artifact attainment](/en/blog/148-opengray-agent-stop-escalation/): first establish which question a score answers, then decide whether it is evidence of the intended capability. A sensible next step here is explicit independent assessment of the skill being taught, documentation of assistance boundaries, and follow-up in new contexts. More agents or more stored conversation cannot, by themselves, establish better learning.

The [authors' product page](https://aicosmos.ai/en) presents interactive videos, notes, and Code Lab. This article reviews those public descriptions; it does not operate or evaluate the product. The demonstrations illustrate ways to organize practice, not evidence of effectiveness. AI Cosmos offers a design worth further testing, a clearer immediate legal-learning comparison, and several programming-mastery signals. It has not made getting something right with AI and being able to do it later oneself the same outcome.
