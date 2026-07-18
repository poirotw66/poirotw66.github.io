---
title: "Martin Fowler on Harness: Building Trust in Coding Agents with Control Loops"
description: "A deep dive into Thoughtworks' analysis: guides/sensors, computational/inferential, three types of regulation, and the behavior harness gap. By comparing with OpenAI's practical experience and common Agent failure modes, we present an actionable Harness checklist."
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "A deep dive into Thoughtworks' analysis: guides/sensors, computational/inferential, three types of regulation, and the behavior harness gap"
  - "By comparing with OpenAI's practical experience and common Agent failure modes, we present an actionable Harness checklist"
audience:
  - "Enterprise AI / platform engineers and technical leads"
  - "Decision-makers who need deployable architecture, governance, and risk trade-offs"
category: "Enterprise AI"
tags: ["AI Agent","Enterprise AI","Harness Engineering","Architecture Patterns","Anthropic"]

image: "/blog/14-martin-fowler-harness-engineering-review/title_image.webp"
showToc: true
---
If you have already read OpenAI's [Harness Engineering in Practice](/blog/11-harness-engineering/), you might ask: besides million-line codebases and AGENTS.md, **how do general teams systematically "trust" the output of Coding Agents?** Martin Fowler's long article at Thoughtworks (full version from April 2026, replacing earlier memos) narrows Harness down to **Coding Agent usage scenarios**, using cybernetics vocabulary to answer: **Trust is not a feeling, but designable feedforward and feedback.**

This article is the second deep dive in Phase 1 of the [Harness Reading Map](/blog/13-harness-engineering-reading-map/). It is recommended to read it alongside the [LangChain Component Map](/blog/15-langchain-agent-harness-anatomy/): Fowler talks about "control logic," while LangChain talks about "product primitives."

> **Boundaries**: The industry often broadly defines "Harness" as "everything in the Agent except the model." Fowler intentionally focuses on the **outer harness**—beyond the product's built-in system prompts, retrieval, and orchestration, this is the code, configuration, and execution logic **that you add to your own system**.

---

### Background: Why Engineers Inherently Distrust AI-Generated Code

LLMs are **non-deterministic**, **unaware of your context**, and **do not operate on "understanding code" in a human sense** (Fowler describes this using token thinking). Under this premise, the outer Harness must simultaneously achieve:

1. **Increase the probability of getting it right the first time**—waste fewer tokens, reduce rework.  
2. **Self-correct as much as possible before human review**—lower review toil, improve system quality.

This aligns with OpenAI's "observable, verifiable, and enforceable architectural boundaries"; the difference is that Fowler provides a **taxonomy**, allowing you to audit "what controls we already have, and which categories we lack."

---

### Core Framework 1: Guides (Feedforward) and Sensors (Feedback)

A Harness simultaneously needs **prevention** and **detection for correction**:

| Type | English | Timing | Purpose |
|------|---------|--------|---------|
| Guide | Guides | **Before** Agent action | Anticipate unwanted output, steer behavior |
| Sensor | Sensors | **After** Agent action | Observe results, trigger self-correction |

Typical symptom of **only feedback**: The Agent repeatedly makes the same mistakes—the linter fails every time, but it is never "taught" the rules.  
Typical symptom of **only feedforward**: AGENTS.md is very long, but adherence is never verified, turning rules into prayers.

A mature approach uses both, and feedback signals are ideally **designed for LLM consumption**: for example, linter output embedding "Please fix Y according to project X conventions"—Fowler calls this a positive prompt injection, making the correction loop **machine-readable and auto-iterative**.

#### Comparison Examples from the Original Text

| Direction | Computational / Inferential | Implementation Example |
|-----------|----------------------------|------------------------|
| Coding Conventions | Feedforward · Inferential | AGENTS.md, Skills |
| New Project Setup | Feedforward · Both | Skill description + bootstrap script |
| Code Modification | Feedforward · Computational | Code mod tools like OpenRewrite |
| Module Boundaries | Feedback · Computational | ArchUnit in pre-commit / hooks |
| Review Methods | Feedback · Inferential | "How to review" type Skills |

---

### Core Framework 2: Computational and Inferential

| Execution Type | Characteristics | Typical Tools |
|----------------|-----------------|---------------|
| **Computational** | Deterministic, fast, CPU | Tests, linters, type checkers, structural analysis |
| **Inferential** | Semantic, slow, expensive, non-deterministic | AI code review, LLM-as-judge |

- **Feedforward** can be mixed: Writing conventions in a Skill (inferential) + one-click bootstrap (computational).  
- On **feedback**: Computational is suitable to run on **every change**; inferential is suitable when tasks are clear and you are willing to accept probabilistic results to add semantic judgment.

Fowler cites the intuition from **Ashby's Law of Requisite Variety**: The complexity of the controller must match that of the controlled system; for Agents, this means you cannot rely on just one type of sensor for everything.

---

### Steering Loop: The Human's Job is to Modify the Harness

When the same problem **reappears repeatedly**, the engineering response should be:

- Strengthen the **guide** (so it doesn't do that again next time), or  
- Strengthen the **sensor** (so it is corrected immediately after doing it wrong), or do both.

Coding Agents have also lowered the cost of "writing Harness": using Agents to generate structural tests, draft rules from observed patterns, or write how-tos through codebase archaeology—this shares the same spirit as OpenAI using Agents for "garbage collection" drift cleanup, but Fowler formulates it as a habit adoptable by **teams of any scale**.

---

### Shift Left on Quality: Paving Sensors Across the Lifecycle

The old problem of continuous integration is magnified in the Agent era: **Where on the timeline should checks be placed?**

**Within the change lifecycle (feedforward + feedback on change)**

- Pre-integration, or even pre-commit: Shift left if it's fast enough—linters, fast tests, lightweight review agents.  
- Post-integration pipeline: Run the more expensive ones again—mutation testing, code reviews requiring a global perspective.

**Continuous drift and health sensing (continuous sensors)**

- Gradually accumulating problems: Dead code, coverage quality, dependency vulnerability scanning.  
- Runtime feedback: SLO degradation, log anomalies, sampled response quality from AI judges.

Inferential sensors **cannot all be piled onto PR gates**—cost and latency will crush throughput; they must be allocated by **criticality**. This point can be juxtaposed with OpenAI's narrative of shortening PR lifecycles and reducing blocking gates: it's not about not checking, but about **reconfiguring checks**.

---

### Three Types of Regulation: Maintainability, Architecture Fitness, Behavior

Fowler uses "regulation targets" to slice Harness, preventing the term "Harness" from being too hollow.

#### 1. Maintainability harness (Currently the most mature)

Most examples in this article fall into this category: internal quality, maintainability, style, structure. Existing toolchains can be hooked up directly.

He maps **common Coding Agent failure modes** against the coverage of this type of Harness (summarized below):

| Failure Mode | Computational Sensors | Inferential Sensors | Notes |
|--------------|-----------------------|---------------------|-------|
| Duplicated code, high complexity, missing tests, architectural drift, style violations | Reliably caught | — | Cheap, mature |
| Semantic duplication, redundant tests, brute-force patches, over-engineering | Partially | Partially possible, expensive and unstable | Not suitable for every commit |
| Misdiagnosed problems, excessive features, misunderstood requirements | — | Occasionally | **If humans haven't clearly defined what is needed, correctness cannot be guaranteed** |

The last row is crucial: Harness cannot replace **requirements and intent**; it can only maintain "defined goodness."

#### 2. Architecture fitness harness

Corresponds to **Fitness Functions** (evolutionary architecture vocabulary):

- Feedforward: Writing performance goals in Skills, observability conventions (logging standards).  
- Feedback: Performance testing, asking the Agent to reflect on whether "the logs at hand are sufficient for debugging."

This bridges "writing elegant code" and "the system performing acceptably in production."

#### 3. Behaviour harness (The elephant in the room)

**Does the functional behavior meet the requirements?** The status quo for most high-autonomy teams is:

- **Feedforward**: Functional specifications (from a single sentence to multi-file descriptions).  
- **Feedback**: AI-generated tests are all green, coverage is fine, someone adds mutation testing, and finally manual testing.

Fowler believes that **over-trusting AI self-generated tests** is still insufficient to reduce supervision. Thoughtworks' internal **approved fixtures** pattern has shown results, but it **cannot be applied universally to all domains**—it is not a wholesale solution.

This directly fills the gap between [OpenAI 11](/blog/11-harness-engineering/) and [Anthropic Long-Running 10](/blog/10-effective-harnesses-for-long-running-agents/): the former emphasizes repo and E2E reproducibility, while the latter emphasizes feature lists and browser automation, but **a "universal solution for behavior harness"** is still awaiting industry consensus.

---

### Harnessability: Greenfield vs Legacy

Not every codebase is equally easy to "harness":

- Strong typing → Type checkers are naturally sensors.  
- Clear module boundaries → ArchUnit-like rules can be written.  
- Frameworks like Spring → Abstract away details the Agent doesn't need to touch, **implicitly improving success rates**.

**Greenfield** allows choosing the tech stack and architecture from day one, determining future governability.  
**Legacy, tech-debt-heavy** systems are often **the most in need of a Harness, yet the hardest to build**—this is a reality in investment prioritization.

**Harness templates** (corresponding to common enterprise service templates): Packaging guides + sensors for API services, event processing, dashboards, etc. The risks are the same as with templates: detachment from upstream after instantiation; non-deterministic guides are harder to version and regression-test.

---

### The Human Role: Implicit Harness Cannot Be Fully Explicit

Human engineers naturally bring:

- Conventions learned from pain and an aversion to complexity;  
- Social accountability from commit signatures;  
- Organizational intuition on tech debt tolerance and "we don't do that here";  
- The thinking space left by taking small steps.

Agents **do not** have an aesthetic aversion to 300-line functions, cannot distinguish if a convention is load-bearing or just a habit, and do not know what debt the business should tolerate right now.

Harness attempts to make experience **explicit**, but Fowler clearly states: the goal is not to eliminate human input, but to direct input toward **intent, trade-offs, and exceptions**—consistent with the distinction between Harness vs Prompt / Context in [Reading Map 13](/blog/13-harness-engineering-reading-map/).

---

### Industry Dynamics (Practical signals cited in the original text)

At the end of the article, several "already happening" Harness engineering efforts are listed, making it easy to compare with your own practices:

- **OpenAI Team**: Layered architecture + custom linters/structural tests + periodic GC for drift scanning; concluding that the difficulties lie in "environment, feedback loops, control systems"—echoing [blog 11](/blog/11-harness-engineering/).  
- **Stripe minions**: Pre-push running relevant linters via heuristics, emphasizing shift feedback left, and blueprints embedding sensors into workflows.  
- **Mutation / Structural Testing**: Previously underused computational feedback, seeing a revival in the Agent era.  
- **LSP / Code Intelligence**: Discussions on computational feedforward guides are heating up.  
- **Thoughtworks Projects**: API quality (Agent + custom linters), a "janitor army" to improve code quality, etc.

These are not checklists to copy, but to illustrate: **Harness engineering is an ongoing engineering practice**, not a one-time configuration file.

---

### How to Read Alongside OpenAI and LangChain

| Dimension | OpenAI 11 | Fowler 14 | LangChain 15 |
|-----------|-----------|-----------|--------------|
| Question | How to govern a million-line agentic repo? | How to design trust and control? | What primitives make up a Harness? |
| Keywords | AGENTS.md, layering, GC, merge culture | guides, sensors, regulation types | files, bash, sandbox, compaction |
| Honest Gap | Human attention | behaviour harness, harness quality metrics | Behavior verification still relies on test stacks |

---

### Pending Questions to Clarify (Research and Tool Opportunities)

Fowler intentionally leaves open questions for teams and tool vendors to align on:

1. As a Harness grows, how to ensure guides and sensors **remain consistent and don't fight each other**?  
2. Sensors **never triggering**—does this mean good quality, or insufficient detection?  
3. How should an Agent make **trade-offs** when instructions and feedback conflict?  
4. Can we evaluate **the coverage and quality of the harness itself**, just like coverage / mutation?  
5. Feedforward and feedback are scattered across IDEs, pre-commits, CI, and runtime—is a platform for **unified configuration and inference** needed?

---

### Takeaways and Recommendations: An Audit Checklist for Teams

If you can only do one thing this week, it is recommended to do a **Harness Audit Checklist** (you don't have to finish it all at once):

1. List the **same type of repeated errors** the Agent has made in its last 10 runs → map each to whether a guide or a sensor needs to be added.  
2. Tag whether each control is **computational** or **inferential** → inferential ones should be forbidden from defaulting to "run on every commit."  
3. Draw the sensors on a **timeline**: pre-commit, CI, nightly, production monitoring.  
4. Open a separate column for **behaviour**: What are "definition of done" and "verification" right now? Are you overly relying on AI-written tests?  
5. Ask every quarter: Are we **steering** the Harness, or just steering prompts?

---

### Summary

Fowler converges Harness Engineering from a buzzword into: **A control system composed of feedforward guides and feedback sensors within the boundaries of a Coding Agent**, while using three types of regulation to highlight that **behavior verification** remains a weak point. Paired with OpenAI's scale narrative and LangChain's component map, you will get a more complete "Theory + Product + Organizational Practice" triangle.

---

### Series Guide

- [Harness Engineering Reading Map](/blog/13-harness-engineering-reading-map/)  
- [LangChain Harness Anatomy](/blog/15-langchain-agent-harness-anatomy/) · [Hashimoto's Six Phases](/blog/16-mitchell-hashimoto-harness-origin/)

---

Original Source:  
**Martin Fowler (2026). Harness engineering for coding agent users.**  
URL: <https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html>
