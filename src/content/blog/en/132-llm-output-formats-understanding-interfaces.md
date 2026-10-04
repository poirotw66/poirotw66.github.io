---
title: "Don't Just Ask an LLM for an Answer: Build an Interface for Understanding"
description: "Extending Karpathy's thoughts on text, diagrams, interactive pages, and explainer videos into a practical method for choosing and reviewing AI-generated artifacts."
pubDate: 2026-10-04
updatedDate: 2026-10-04
tldr:
  - "Text, diagrams, interactive pages, and video are not a ladder of progress; choose a format for the shape of knowledge the reader needs."
  - "Review criteria should change with the format: check claims, relationships, interactive states, or sequence—not only visual polish."
  - "Disposable artifacts lower the cost of production, not the bar for correctness, accessibility, credential safety, or human review."
audience:
  - "Engineers and educators who use LLMs to create technical explanations, lessons, or research aids"
  - "Product and platform teams building AI-generated web, visual, video, or workflow artifacts"
category: "AI Engineering"
tags: ["AI", "Developer Tools", "Productivity", "Multimodal"]
kind: "article"
showToc: true
image: "/blog/132-llm-output-formats-understanding-interfaces/title_image.webp"
---

In a [recent post on X](https://x.com/karpathy/status/2105819303471976479), Andrej Karpathy suggested several ways to make language-model output easier to understand: ask for writing closer to ASD-STE100, request a diagram, generate an interactive web page, or go further and create a bespoke explainer video. He also predicted that as models take on more execution work, people will spend more time on oversight and understanding—and that large, custom, disposable software artifacts may become worth making.

I read the post as a practical design question: **the goal is not a more impressive model output; it is an interface that helps a person complete a specific understanding task.** Text, diagrams, web pages, and video are not steps on a ladder where each later format is automatically better. They externalize different kinds of thinking and introduce different failure modes and review requirements.

> **Huahua's take**
>
> Before choosing a format, state what the reader should be able to explain, compare, or do afterward. If the only acceptance test is “it looks clear,” a polished artifact can make a wrong explanation more persuasive.

## Choose the representation after defining the learning task

The same technical subject can be explained in different forms, but each form directs the reader's attention elsewhere. Take the question of why a database index can speed up a query. Text can define the index, its cost, and its limits. A diagram can show how a tree narrows the search. An interactive page can let a reader vary the data volume or branching factor and observe how the number of steps changes. A video can animate a node split or trace one query through the index over time. These are different ways to explain the same subject; none is automatically more correct.

| What the reader needs to do | A useful format | The key review question |
| --- | --- | --- |
| Understand a precise definition, procedure, or limitation | Concise prose or controlled language | Is each important claim correct, sourced, and explicit about its conditions? |
| See components, dependencies, or a causal claim | Diagram | Are the nodes and links supported? Does the drawing imply causality that the source does not establish? |
| Compare states, explore a parameter, or inspect branches | Interactive page | What does each control change? Are defaults, data, and edge cases visible? |
| Understand a mechanism changing over time | Explainer video | Do narration, visuals, and sequence agree? Can people access important visual information another way? |

That is why “turn the answer into a diagram” is not a universal quality upgrade. A flowchart can hide uncertainty. An interactive control can make demonstration values look like real measurements. Music, pacing, and animation can make an incorrect explanation easier to remember. A format is a cognitive interface—and it comes with its own failure modes.

## Controlled language is a writing aid, not proof of compliance

ASD-STE100, or Simplified Technical English, is more than a request to “write simply.” The [standard's official FAQ](https://www.asd-ste100.org/STE_faq.html) describes a controlled dictionary and a set of writing rules for clear technical documentation with less ambiguity. It was originally developed for aircraft maintenance documentation. Correct use still requires writers to understand both the technical subject and the rules.

So “80% of the way to ASD-STE100” is best treated as an informal style prompt, not a statement that the result complies with the standard. The ASD page describing its [white paper on AI](https://www.asd-ste100.org/STE_downloads.html) warns that AI text may look clear, authoritative, and consistent with STE without correctly applying its rules and vocabulary. Plausibility is not verified compliance. The guidance also says AI can support technical authors, but cannot replace professional knowledge and review.

The same principle applies to other media: **a format can improve readability, but cannot replace source checking.** A diagram still needs its connections checked against evidence; a web page still needs its calculations and defaults tested; a video still needs its narration and storyboard reviewed.

## Write a short “understanding artifact contract”

Instead of asking an LLM to “make a great explainer video,” specify who the artifact is for, what they should be able to do, and how the result will be checked. Start with five items:

1. **Reader and task**: What does the reader already know? Should they explain, compare, predict, or perform something afterward?
2. **Shape of the knowledge**: Is the problem a definition, a relationship, a variable to explore, or a change over time? Choose text, a diagram, an interactive page, or video accordingly.
3. **Evidence boundary**: Name the sources. Ask the model to separate sourced facts from assumptions and inferences, and flag what it cannot verify.
4. **Acceptance test**: Request inspectable text, data, or calculations. Then use a new example to test transfer, not just recall of the original wording.
5. **Artifact lifecycle**: Say whether this is a personal one-off aid, a shared team resource, or a formal decision document. The latter two need an owner, version, and update plan.

For example, a prompt for explaining query indexes could look like this:

```text
Reader: A junior engineer who knows basic SQL but not database indexes.
Goal: The reader can explain how an index narrows a search and what it costs to update.
Format: Start with a component diagram; propose a minimal HTML prototype only if interaction helps.
Evidence: Use only the attached database documentation and link each claim to its source section.
Limits: Separate documented facts from explanatory assumptions. Do not invent performance numbers.
Review: Provide a plain-text summary, inspectable diagram legend or calculations, and one case where an index may not help.
```

This contract moves the request from “make something impressive” to “solve this reader's understanding problem.” It also gives a human reviewer something concrete to inspect: the goal, evidence, representation, and boundaries.

## Interactive pages and video add execution and accessibility responsibilities

When a model generates HTML, the output is no longer only readable text; it may be executable code. Even for a local, one-off demonstration, check what data it reads, which external scripts it loads, and whether controls only change the display or cause side effects. If it needs a voice service, do not paste a real API key into the prompt or embed it in frontend code. [ElevenLabs' authentication docs](https://elevenlabs.io/docs/api-reference/authentication) say to treat API keys as secrets and not expose them in browsers. Use a controlled backend or secret-management mechanism to supply narrowly scoped credentials, and set usage limits.

Video is more than an image that moves. For teaching or publication, review narration, visuals, captions, and transcript together. Under [WCAG 2.2](https://www.w3.org/TR/WCAG22/), prerecorded synchronized media has caption requirements; Level AA also requires audio description for prerecorded video so people who cannot see important visual information can access it. That means “the model exported an MP4” is not the finish line. Check that captions match, narration covers important visuals, and a searchable, citable text version is available.

> **Huahua's engineering note**
>
> The ElevenLabs API-key example in the post is illustrative; do not put a secret in a prompt. The more an artifact behaves like runnable software or media, the less acceptable it is to skip permission, provenance, and accessibility checks.

## “Disposable” does not mean “mistakes do not matter”

Karpathy's idea of disposable artifacts has a practical economic implication: if a diagram or small web page takes only minutes to produce, it can be made for a meeting, a debugging session, or one difficult concept without turning it into a product first. This lowers the **production threshold**, not the **cost of being wrong**.

Choose the governance level based on how the artifact will be used:

- **Private, short-lived learning aid**: it can be revised or discarded quickly, but still verify key facts. Do not give it unnecessary sensitive data or credentials.
- **Shared team resource or decision aid**: retain sources, assumptions, generation version, reviewer, and date. Set a re-check date if the underlying sources change.
- **Formal training, product, or public content**: add accessibility, security, licensing, ownership, and regression checks. Do not treat a prototype as a production interface.

If readers only see the final artifact and cannot inspect its sources or transcript, it may no longer be disposable in practice: it may have become a decision document that others rely on. Preserve enough provenance for the next person to know what it rests on, when it can be trusted, and when it needs to be rebuilt.

## Test understanding, not only the output

The completion test should not be “the LLM made a diagram, page, or video,” or even “the author thinks it is clear.” Ask the reader to explain the mechanism in their own words without the artifact, apply the idea to a different case, or identify a condition where the conclusion does not hold. If they cannot, revisit the sources, concept decomposition, or representation—not just the animation, word count, or visual effects.

Karpathy's prediction that human work will rise toward oversight and understanding is a useful direction to consider, not labor-market evidence established by this post. What we can say is that as production gets cheaper, people must choose problems, define acceptance conditions, review artifacts, and judge whether they actually help someone understand. The best LLM output is not the most polished, longest, or most interactive one. It is **the one that helps the reader complete the task accurately with the least cognitive and verification cost**.

For the machine-facing side of this idea, see [how TypeSafe AI turns model output into typed decisions](/en/blog/107-typesafe-ai-jev-system-one/). For a research workflow that separates automated computation from human judgment, continue with [Claude-shaped science](/en/blog/131-anthropic-claude-shaped-science-agentic-research-workflow/). [Choosing an AI software development environment](/en/blog/89-ai-powered-software-development-environments/) offers another angle on AI-generated code and engineering workflows.

## Sources and Further Reading

- Andrej Karpathy, [X post on understanding language-model output through writing, diagrams, web pages, and explainer videos](https://x.com/karpathy/status/2105819303471976479).
- [ASD-STE100 FAQ](https://www.asd-ste100.org/STE_faq.html) — the purpose, rules, and controlled vocabulary of Simplified Technical English.
- [ASD-STE100 and AI white paper page](https://www.asd-ste100.org/STE_downloads.html) — why surface readability does not prove compliance and why professional review remains necessary.
- [ASD STEMG: Tools for STE](https://www.asd-ste100.org/STEsoftware.html) — limits, accuracy, and privacy considerations for language tools and AI assistance.
- [W3C Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) — caption and audio-description criteria for prerecorded synchronized media.
- [ElevenLabs API Authentication](https://elevenlabs.io/docs/api-reference/authentication) — API-key secrecy and frontend exposure.
