---
title: "Harness Design for Long-Running AI Engineering: Generation, Evaluation, and Verification Chains"
description: "Based on Anthropic's 'Harness design for long-running application development': Improving the reliability and controllability of long-running tasks through generator-evaluator separation, external evaluation, and QA contracts."
pubDate: 2026-03-30
updatedDate: 2026-03-30
tldr:
  - "Based on Anthropic's 'Harness design for long-running application development': Improving the reliability and controllability of long-running tasks through generator-evaluator…"
audience:
  - "Enterprise AI / platform engineers and technical leads"
  - "Decision-makers who need deployable architecture, governance, and risk trade-offs"
category: "Enterprise AI"
tags: ["AI Agent", "Harness Engineering", "evaluation", "QA", "long-running"]
image: "/blog/09-harness-design-long-running-apps/title_image.webp"
---

Original Source:  
**Prithvi Rajasekaran (2026). Harness design for long-running application development.**  
[https://www.anthropic.com/engineering/harness-design-long-running-apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)

Where exactly does long-running, semi-autonomous AI engineering get stuck? Many teams attribute the problem to the "model not being capable enough": outputs are incomplete, reasoning drifts, or the final delivered code cannot actually run. In this engineering article, Anthropic provides a more systematic answer: when you stretch the same agent across multiple hours and multiple rounds of interaction, failures are often not due to a lack of single-generation capability, but rather because the entire harness (task framework architecture) hasn't engineered "reliability" into the system.

They break the core issues down into two major categories: context drift (context anxiety / context blindness) in long-running tasks, and self-evaluation bias (overly optimistic self-evaluation). The solution is likewise not single-point prompting, but rather separating "generation" from "evaluation," and making the evaluation calibratable, repeatable, and capable of generating iterative feedback.

> The real turning point for long-running tasks is not a smarter single output, but turning the "verification chain" into an iterable system.

---
### Why Long-Running Tasks Spiral Out of Control

The article begins by discussing two frequently overlooked failure modes.

The first is "context blindness": the model knows the text looks similar, but does not know which information has been updated, whether certain exception clauses override, or if a piece of content merely has a similar tone but opposite logic. In enterprise scenarios, errors are not necessarily hallucinations, but rather making decisions "using a version that seems reasonable but is actually outdated or incompatible."

The second is "context anxiety": as a task runs longer, when the model approaches what it perceives as its context limit, it tends to wrap up prematurely or alter its behavior. Anthropic points out that their previous approach of using "compaction (in-place summarization)" was still insufficient to handle this drift; in some later versions, they adopted a "context reset": clearing the context and keeping a structured handoff artifact so the next turn of the agent can start with a clean slate.

Such a strategy is indeed more stable, but the cost is additional orchestration complexity, token overhead, and latency. Thus, the article's focus is not just on "whether to reset," but that you must know exactly which failure mode is dominating your experience to decide how much orchestration cost you are willing to pay.

---
### Shifting from Self-Evaluation to External Evaluation

The second key source of failure is "self-evaluation bias." When an agent is asked to evaluate what it has produced, it often praises itself in a highly confident tone, even if human observation clearly shows it is "only passing or mediocre." This problem is particularly severe in subjective tasks like design, because there is no binary ground truth as there is in testing.

Anthropic's solution is to separate the "generator" and the "evaluator": the generator produces, and the evaluator reviews. More importantly, they tune the evaluator to be more "skeptical" rather than expecting the generator to become stricter with itself. The concrete feedback provided by external evaluation is what enables the generator to truly iterate, rather than just feeling good about itself in the same erroneous direction.

---
### GAN-Style Generation-Evaluation Architecture: Making the Subjective Scorable

The article borrows the "generation-evaluation" pattern from the spirit of GANs (Generative Adversarial Networks): letting one agent generate work, and another agent score it based on measurable criteria, allowing the generator to continuously correct itself.

In a frontend design experiment, they first broke down subjective quality into four scorable criteria, and simultaneously required both the generator and the evaluator to use the same semantic framework:

- **Design quality**: Whether it feels cohesive, with consistent colors, typography, layout, and vibe.
- **Originality**: Whether there are custom decisions, rather than being templated, default-looking, or having an obvious "AI-generated feel."
- **Craft**: The correctness of technical details (hierarchy, spacing, color coordination, contrast, etc.).
- **Functionality**: Whether the user can understand what the interface does and successfully complete tasks.

They place special emphasis on the weights for **design quality** and **originality** because, without external evaluation, models typically lean toward being safe and regular but lacking personality. Only through calibrated evaluation statements can the generator be "pulled" toward a direction that is riskier but more like a crafted piece of work.

---
### Applying to Full-Stack Engineering: Specs, Contracts, and QA

When bringing this architecture to full-stack applications, Anthropic formed three roles:

- **Planner**: Expands a 1–4 sentence prompt into a complete product specification (avoiding hardcoding details too early).
- **Generator**: Works in a "one chunk per sprint" manner to translate the specification into code and features.
- **Evaluator**: Uses Playwright (paired with a Playwright MCP) to operate the interface like a user, determining if each chunk meets the standards based on guidelines and hard thresholds.

Particularly noteworthy is the "sprint contract": before actually writing code, the generator proposes how to do it and what constitutes completion; the evaluator first reviews whether this truly aligns with the requirements and can be verified through testing. The article notes that without this contract layer, because specifications themselves are high-level, agents can easily mistake "doing a lot" for "actually getting it done."

Furthermore, this harness handles message handoffs through files: one agent writes to a file, and another reads the file and replies or creates a new one. This method of "externalizing artifacts" makes the context more controllable and is more conducive to cross-round iteration.

---
### Subsequent Evolution: From "Evaluating Every Sprint" to "Final Verification"

As model capabilities improved (e.g., Opus 4.6), Anthropic discovered that certain burdens could be removed. This was most obvious in two directions:

1. **Context reset**: No longer as necessary on some new models (because context anxiety is significantly suppressed).
2. **Sprint-based evaluation**: Evaluation doesn't have to be done for every chunk, depending on whether the task falls within the model's reliable capability boundaries.

They compared the expensive, multi-round sprint evaluation of Opus 4.5 (which included QA per chunk) with a newer version. In the updated harness (with the sprint construct removed), long-running task quality could still be maintained, but evaluation costs were concentrated at the end and on boundaries that still required external QA.

For instance, they used prompts to generate a Digital Audio Workstation (DAW) in the browser, with the whole process still on the scale of about 4 hours and a cost of roughly $124: the planner took about 4.7 minutes ($0.46), and the chunked costs for multiple rounds of build and QA were sequentially $71.08 / $3.24, $36.89 / $3.09, and $5.88 / $4.06; the final total time was about 3 hours and 50 minutes, with a total cost of $124.70.

However, QA still plays a role in "catching gaps": for example, treating core DAW interactions as "display-only," or missing key interactions like dragging clips or visualizing signals. This shows that the evaluator is not a silver bullet, but should rather be used where "generation is likely to step on landmines."

---
### Actionable Best Practices

- Break down long-running task failures into "context-related" and "evaluation-related," and prescribe the right remedy for each.
- Make the evaluator an independent role, and calibrate its level of skepticism.
- Break subjective quality down into scorable criteria (using a unified semantic framework makes iteration more stable).
- Introduce a "contract" before implementation: align on the verification method for "done" before starting to write code.
- Let QA/verification focus on boundary risks, rather than having it handle everything from the start in the most expensive way.

---
### Summary

If summarizing the article's perspective in one sentence: the essence of long-running AI engineering is turning "verification" from an after-the-fact remediation into a part of the architecture. Only when you separate generation and evaluation, make evaluation calibratable, and then use repeatable QA to approximate real usability, can a system deliver work that "doesn't just run, but gets the task done" after multiple hours of autonomy.

---
Original Source:  
**Prithvi Rajasekaran (2026). Harness design for long-running application development.**  
[https://www.anthropic.com/engineering/harness-design-long-running-apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
