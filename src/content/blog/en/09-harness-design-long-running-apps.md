---
title: "Harness Design for Long-Running AI Engineering: Generation, Evaluation, and Verification Chains"
description: "A source-grounded engineering guide to Anthropic's long-running application harness, including the planner-generator-evaluator contract, context reset trade-offs, and reported costs."
pubDate: 2026-03-30
updatedDate: 2026-10-19
tldr:
  - "Anthropic separated planning, generation, and browser-driven evaluation, but the evaluator itself required calibration."
  - "The Opus 4.5 full harness cost about US$200 on a six-hour game-maker task; a different Opus 4.6 DAW run cost US$124.70, not a controlled model comparison."
audience:
  - "Enterprise AI / platform engineers and technical leads"
  - "Decision-makers who need deployable architecture, governance, and risk trade-offs"
category: "Enterprise AI"
tags: ["AI Agent","Harness Engineering","Evaluation","Architecture Patterns"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 6

image: "/blog/09-harness-design-long-running-apps/title_image.webp"
showToc: true
---

You ask a coding agent to build a complete web app. It produces a UI, an API, and a database; the repository looks busy and productive. Then you click "Play" and the character does not move. What you need is not ten more generated features. You need **independent evidence that the application satisfies its actual user journey**.

In [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps), published March 24, 2026, Anthropic engineer Prithvi Rajasekaran examines two related tasks: subjective frontend design and verifiable multi-hour full-stack development. The harness makes specifications, external grading, tools, and feedback loops part of the system rather than simply instructing the model to "try harder."

> **Huahua in one sentence**
>
> More generation is not the same as reliable delivery. Define acceptance first, then make builders and reviewers exchange testable evidence.

## 1. Two failures: long context and overconfident self-grading

The original report distinguishes:

| Failure | What was observed | Do not confuse it with |
| --- | --- | --- |
| Long-context incoherence | A long task drifts or wraps up early (context anxiety) | A generic RAG relevance or document-parsing bug |
| Optimistic self-evaluation | The agent praises mediocre output | A problem solved automatically by asking a second LLM |

In earlier experiments with **Sonnet 4.5**, compaction did not fully prevent context anxiety. The team adopted **context resets with structured handoff files**: start a fresh agent session, then resume from an external description of state and next steps.

With **Opus 4.5**, however, the author reported that this behavior largely receded; the later full-stack harness could use **one continuous session with automatic compaction**, dropping the reset entirely. These are **model- and experiment-specific trade-offs**, not a recommendation to reset every agent session indefinitely.

## 2. Turning subjective design into inspectable feedback

The frontend experiment used four grading dimensions:

| Criterion | Question |
| --- | --- |
| Design quality | Do typography, color, layout, and imagery form a coherent identity? |
| Originality | Does the page reflect deliberate, custom decisions rather than templates? |
| Craft | Are spacing, hierarchy, contrast, and fine details executed well? |
| Functionality | Can a user find the controls and complete an actual task? |

A generator created HTML/CSS/JS; an independent evaluator used **Playwright MCP** to browse the live application, interact, screenshot, grade, and document defects. The evaluator was calibrated using few-shot examples so that "looks good" would not pass as a sufficient explanation.

The author reports **5–15 iterations** for a frontend, with full runs sometimes taking **four hours**. Scores often improved, but the author sometimes preferred an earlier iteration, and solution complexity tended to rise. This is an engineering observation, **not a universal controlled aesthetic benchmark**.

## 3. A three-agent full-stack harness with an acceptance contract

The earlier full-stack setup separated three roles:

1. **Planner:** Expand a 1–4 sentence prompt into a product spec without prematurely fixing low-level details.
2. **Generator:** Build features incrementally and maintain the implementation in Git.
3. **Evaluator:** Drive the app through Playwright and test user interaction, APIs, and database state.

One particularly useful practice happened **before** coding: the generator and evaluator negotiated a **Sprint Contract** identifying the behavior to build and the evidence that would count as done. If the proposed contract failed to address the actual requirement, the agents revised it before implementing anything.

For example, suppose the acceptance case is a rectangle-fill tool:

```text
Requirement: dragging a rectangle fills every tile in the range.
Action: select the tool and drag from (2,2) to (4,4).
Expected: all nine tiles update.
Evidence: browser replay plus canvas state / screenshot.
Fail: only the drag start and end tiles change.
```

This is an **illustrative QA contract derived from a defect in the report**, not an official JSON schema. Merely proving that the page loaded would miss the functional bug.

## 4. Costs: better demonstrated behavior, much longer execution

The article compares a solo agent and the full harness on the same retro game-maker prompt:

| Approach | Elapsed time | Reported model cost |
| --- | --- | --- |
| Solo agent | About 20 minutes | About US\$9 |
| Full harness (Opus 4.5) | About 6 hours | About US\$200 |

The author describes better coverage and an actually playable core feature in the full-harness version, while the solo version failed during user testing. But this is a **single reported task comparison**, not proof that multi-agent execution wins across tasks, or a precise return-on-dollar study.

The evaluator itself was initially unreliable: it skipped corner cases and argued legitimate defects away. The team had to inspect evaluator traces and tune its skepticism. **Adding a reviewer agent does not automatically produce strong QA.**

## 5. Better models can change which scaffolding is worthwhile

With Opus 4.6, the author removed sprint decomposition while retaining a planner and evaluator. In a browser-based Digital Audio Workstation (DAW) experiment, the report gives:

| Phase | Reported duration | Model cost |
| --- | --- | --- |
| Planner | 4.7 min | US\$0.46 |
| Build 1 → QA 1 | 2h 7m + 8.8m | US\$71.08 + 3.24 |
| Build 2 → QA 2 | 1h 2m + 6.8m | US\$36.89 + 3.09 |
| Build 3 → QA 3 | 10.9m + 9.6m | US\$5.88 + 4.06 |
| **Total** | **3h 50m** | **US\$124.70** |

Do **not** interpret US\$200 → US\$124.70 as savings caused solely by a model upgrade. The **task, harness design, and model all changed**, so this is not a controlled A/B test.

The evaluator still caught crucial problems in the DAW: timeline clips could not move, the record button did not capture audio, and some effects exposed only numeric sliders. A simpler harness may still benefit from external verification at the boundary of model competence.

## 6. An acceptance-focused adoption pattern

For engineering teams, a minimal version could be:

```text
User requirement
  → Planner: reviewable functional and non-functional spec
  → QA contract: explicit done conditions, negative cases, evidence
  → Generator: incremental code changes in version control
  → Independent evaluator: UI/API interaction and tests
  → Gate: fail → defect report; pass → PR and appropriate review
  → Trace: time, tokens, tools, failures, and rework
```

Start with **5–10 reproducible representative tasks** and compare solo versus full-harness execution on completion rate, severe defects, verification coverage, model cost, P95, and human review effort. For side-effecting operations involving funds, identities, or production databases, keep evaluator tools isolated and least-privileged.

The takeaway is not that every build needs three agents. The value of a harness is turning "looks finished" into **reviewable evidence of actual behavior**. As models improve, revisit which pieces of orchestration remain worth paying for.

## Original source and further reading

- [Anthropic: Harness design for long-running application development (2026-03-24)](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Anthropic: Effective harnesses for long-running agents](/en/blog/10-effective-harnesses-for-long-running-agents/): multi-context handoff.
- [OpenAI Harness Engineering](/en/blog/11-harness-engineering/): repository knowledge, observability, and enforceable rules.
- [Harness Engineering reading map](/en/blog/13-harness-engineering-reading-map/): navigation by reader role.
