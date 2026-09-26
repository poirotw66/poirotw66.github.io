---
title: "Gemini 3.8 Flash Coding-Agent Workflow: Routing Uncertainty from Planning to Execution"
displayTitle: "Uncertainty Routing for Coding Agents"
subtitle: "Astra plans; Flash checks assumptions and executes bounded work"
description: "Using Astra planning and Flash execution as an example, this article adds a SPEC verification gate, escalation rules, and a careful reading of DeepSWE costs."
pubDate: 2026-09-15
updatedDate: 2026-09-27
tldr:
  - "Route by task uncertainty, permissions, and side-effect radius rather than a permanent model-brand hierarchy."
  - "The planning model produces SPEC v0; the executor checks repository assumptions and stops on material conflicts."
  - "In the September 22, 2026 DeepSWE v1.1 snapshot, Astra and Flash High both show a 74% completion point estimate; that is not a team success rate."
  - "Evaluate retries, human review, rollback, and escaped defects; this article contains no controlled comparison or reproducible task trace."
audience:
  - "Engineers designing AI coding agents, model routing, or agent harnesses"
  - "Technical decision-makers balancing model quality, usage limits, and development speed"
category: "AI Engineering"
tags: ["AI Agent", "OpenAI", "Gemini", "Evaluation", "Agentic Coding"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 33
kind: "article"
showToc: true
readingStyle: focused
tocLabels:
  "conclusion-route-uncertainty-not-fixed-model-roles": "Route uncertainty"
  "astra--flash-workflow-verify-the-spec-before-editing": "Verify before editing"
  "why-might-this-split-be-economical": "Why the split can save cost"
  "what-do-the-official-model-positioning-and-deepswe-leaderboard-say": "Model positioning and DeepSWE"
  "where-does-this-workflow-fit-best": "Where the workflow fits"
  "how-to-validate-this-hypothesis-beyond-gut-feel": "How to validate it"
  "turn-model-routing-into-an-engineering-contract": "The engineering contract"
  "final-judgment": "Final judgment"
wideHeader: true
image: "/blog/100-gemini-3-8-flash-coding-agent-workflow/title_image.webp"
---

A useful coding-agent design is to use a high-reasoning model to clarify a problem, then let a lower-cost tool-capable model handle bounded implementation. The routing decision should follow task uncertainty, permissions, and side-effect radius—not permanently assign one model brand to planning and another to execution. This article uses GPT-6 Astra and Gemini 3.8 Flash High as current examples; the roles should be reevaluated as models and tools change.

Part of the motivation comes from Work/Codex usage limits. Depending on the plan, Astra usage may have both five-hour and weekly windows; actual usage also varies with model, reasoning setting, and task. [OpenAI's usage guidance](https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex) says message counts are not fixed limits. That raises a practical question: which decisions justify allocating part of the shared Work/Codex allowance to higher reasoning?

This is a workflow-design note, not a model shootout or an experiment report. It contains no publicly reproducible task trace and does not use my bill or success rate to claim that this pairing is cheaper, faster, or equally reliable. The design hypothesis, vendor material, and public DeepSWE results are kept separate below.

> **Huahua in one sentence**
>
> Route uncertainty: turn unknowns into checkable requirements, let the executor verify repository assumptions, and stop for escalation when they fail.

## Conclusion: route uncertainty, not fixed model roles

Ranking models on a single “which is stronger?” scale misses the more useful design question: **which unknowns must be resolved first, and which work can an execution model handle under explicit constraints?**

| Role | Current example in this article | Expected artifact | Boundary to preserve |
| --- | --- | --- | --- |
| Planning tier | GPT-6 Astra | Goal, non-goals, evidence, unverified assumptions, acceptance criteria, and escalation rules | The output is SPEC v0; repository assumptions are not verified just because they are written down |
| Execution tier | Gemini 3.8 Flash High | Repository-check record, bounded diff, test evidence, and unresolved questions | Do not widen file scope, data access, or external side effects without approval |
| Human gate | Engineer or task owner | Confirm intent, review the diff and risks, accept or reject delivery | Passing tests does not authorize deployment or delivery |

These are routing roles, not permanent model titles. Either model can inspect or write code, and simple low-risk tasks may not need multi-model planning. Start with ambiguity, change surface, and failure cost, then decide whether planning and escalation gates are worth the overhead.

## Astra → Flash workflow: verify the SPEC before editing

Passing a polished specification between two models is not enough. The planner may not have inspected the whole repository or may be working from a wrong assumption. The executor should verify the plan before writing code.

### 1. The planning tier produces SPEC v0

Turn the task into a checkable contract that includes:

* The goal and explicit non-goals.
* Repository evidence that supports the current understanding, plus assumptions still to verify.
* The expected change surface and compatibility, data, or permission risks.
* Observable acceptance criteria, test commands, and a rollback direction.
* Conditions that require stopping, returning to the planning tier, or asking a human to decide.

SPEC v0 identifies what to check and how to judge it. It does not declare its own assumptions correct.

### 2. The execution tier performs repository reconnaissance

After Gemini 3.8 Flash High receives the task, it first reads only the relevant code, configuration, and tests. It checks entry points, data flow, existing behavior, test locations, and the proposed change surface. It marks each key assumption as “verified,” “contradicted,” or “unknown,” with file or test evidence, and makes no edits at this stage.

This is the **plan verification gate**. If an entry point, dependency, business behavior, or permission boundary conflicts with the SPEC, the executor stops and reports the conflict and its impact. The planning tier or a human updates the SPEC and confirms the acceptance criteria before implementation begins. This prevents a mistaken assumption from being treated as a settled plan.

### 3. Run a bounded implementation loop after confirmation

Only after the SPEC passes this check does the execution model begin editing:

1. Change only the approved surface; avoid unrelated refactors.
2. Run the agreed tests and make local repairs based on failure evidence.
3. Preserve the diff, test results, unresolved questions, and affected modules for each loop.
4. Cap steps, time, or change surface. Stop and escalate when new assumptions, permission changes, or external side effects appear.

Lower cost does not justify unlimited retries. Every loop adds latency, tool and token usage, and review work.

### 4. Keep the delivery decision with a human

Before delivery, a person reviews the actual diff, test output, error handling, permissions, and rollback path. “Tests passed” is one piece of evidence, not delivery authorization. This follows the principle in the site's [AI Agent architecture guide](/en/blog/64-ai-agent-guide/): a verifiable control loop matters more than a single answer.

## Why might this split be economical?

### A frontier model's value is uncertainty compression

The value of a frontier model is not only that it can write more code. It can turn a vague requirement into fewer plausible branches. When the problem involves architecture, responsibility boundaries, data lifecycles, or security conditions, avoiding the wrong branches can be worth more than producing tens of thousands of additional tokens later.

That is an engineering inference in this article, not an official definition from any model provider. I call it **uncertainty compression**: use the stronger model to turn “we do not know what to change” into “we know what to verify,” then let an execution model handle repeatable operations.

### The execution model's value is stable long-loop work

The implementation phase of a coding agent is rarely a single elegant answer. It is often read, edit, compile, inspect the error, retry, test, and edit again. If the task boundary is clear, the tool environment is stable, and the tests provide reliable signals, an executor (execution model) that uses more steps may still produce lower per-task cost and consume less frontier-model allowance.

But “more steps” is not free. It consumes time, tool calls, tokens, review attention, and failure budget. I therefore treat “Flash is cheaper” as a hypothesis to validate with completed-task results, not as a conclusion.

### Usage limits and API prices are different surfaces

OpenAI's Astra usage window is a Work/Codex product rule; Gemini API pricing is a separate billing surface. Google's [official pricing page](https://ai.google.dev/gemini-api/docs/pricing?hl=en) currently lists Gemini 3.8 Flash standard paid-tier input at USD 0.75 per million tokens and output, including thinking tokens, at USD 3.75 through December 31, 2026; the prices become USD 1.50 and USD 7.50 on January 1, 2027. Those are API token prices, not a Gemini subscription fee and not my actual bill.

Total cost also includes retries, tool-result context, caching, review time, and failed tasks. The site's [LLM inference cost article](/en/blog/94-llm-api-pricing-inference-cost/) explains why API prices, public benchmarks, and derived cost scenarios should not be collapsed into one number.

## What do the official model positioning and DeepSWE leaderboard say?

Google describes Gemini 3.8 Flash as a Flash model for long-horizon software engineering, autonomous agents, and complex enterprise workflows. The [Gemini API documentation](https://ai.google.dev/gemini-api/docs/latest-model) lists a 1M-token context window, 64K maximum output, and low, medium, and high thinking levels; the [Google DeepMind model card](https://deepmind.google/models/model-cards/gemini-3-8-flash/) also lists hallucinations, occasional slowness or timeouts, and higher token use at higher thinking effort among its limitations. That makes it a candidate for a workhorse executor, but it does not make it reliable for every repository, language, or product decision.

Another easily misread signal is the DeepSWE v1.1 leaderboard. The following is the 113-task snapshot I checked on September 27, 2026; the page says it was updated on September 22. Because the leaderboard changes, record the snapshot date with any quoted values:

*On mobile, swipe horizontally to see the full numeric table.*

| Model configuration | Completion | Average task cost | Output tokens | Steps |
| --- | ---: | ---: | ---: | ---: |
| GPT-6 Astra [xhigh] | 74% ± 3% | USD 4.43 | 30K | 29 |
| Gemini 3.8 Flash [high] | 74% ± 1% | USD 2.36 | 143K | 166 |
| Claude Opus 5 [max] | 74% ± 4% | USD 11.84 | 118K | 99 |
| GPT-5.6 Sol [max] | 73% ± 3% | USD 6.46 | 60K | 61 |

The data comes from the [DeepSWE v1.1 leaderboard](https://deepswe.datacurve.ai/), which says all models run on mini-swe-agent for consistency. On this task set and configuration, Flash High and Astra both display a 74% completion point estimate, with overlapping ± ranges; Flash reports lower average task cost but uses more output tokens and steps. This is one signal worth testing: inside this benchmark harness, a lower per-task cost may come with more execution loops. It is not total delivery cost and does not include a team's human review, retry policy, or production side effects.

It does not support these conclusions:

* Flash High has universally surpassed Astra.
* 74% is a normal-project success rate; it also means roughly one quarter of the tasks were not solved.
* The average task cost is every team's real cost.
* 166 steps are necessarily worse than 29, or necessarily more reliable.

The [DeepSWE paper](https://arxiv.org/abs/2607.07946) explains that SWE-bench-style evaluations can be affected by public solutions appearing in pretraining data and by tests that encode one fix rather than accept any correct implementation. DeepSWE responds with original tasks and hand-written behavioral verifiers. That makes it a more informative reference than older benchmark scores, but it still covers 113 tasks, a specific repository pool, and a fixed harness. It can shape a hypothesis; it cannot replace a team's representative tasks, tools, and human review.

> **Huahua's engineering note**
>
> A SPEC compresses uncertainty; it is not an unattended deployment button. Track completed tasks that pass tests and review, not just an attractive leaderboard score.

## Where does this workflow fit best?

I would start with:

* Bug fixes, test additions, local refactors, and documentation synchronization with clear acceptance criteria.
* Repositories whose structure is stable enough for the executor to get reliable signals from existing code and tests.
* Tasks that need multiple read, edit, and test loops but whose permissions and external side effects can be constrained.
* Work where the planning stage can state non-goals clearly, preventing “while we are here” from becoming a large rewrite.

This aligns with the direction of the site's [AI software-development environment guide](/en/blog/89-ai-powered-software-development-environments/): the Vibe Coding problem is not only whether a model can write code, but whether context, tools, acceptance, and recovery paths form an observable harness.

Conversely, a lower Flash price should never lower the bar for these conditions:

| Risk signal | What can happen | My response |
| --- | --- | --- |
| The SPEC fixes a wrong assumption too early | The executor efficiently completes the wrong design | Reframe with Astra or a human |
| Test coverage is weak | Green status only shows that old tests survived | Add acceptance tests and review business semantics |
| Cross-service, migration, or permission changes appear | A small diff has a large side-effect radius | Raise the review level and prohibit unattended delivery |
| Repair loops do not converge | Tokens, time, and diff size grow quickly | Cap steps, time, and change surface, then escalate |
| The benchmark differs from the real workload | Leaderboard results fail to predict team success | Rerun on representative internal tasks |

## How to validate this hypothesis beyond gut feel

This article does not provide a reproducible personal task case, so it cannot establish the real delivery cost or success rate of Astra → Flash. A team evaluating the design should first build a small, repeatable baseline:

1. Choose representative tasks covering small fixes, features, cross-module changes, and deliberately high-risk cases.
2. Fix the repository version, tool permissions, test commands, timeouts, context delivery, and human-intervention rules.
3. Record Astra-only, Flash-only, and Astra-planning → Flash-execution results separately.
4. Measure first-pass completion, completion after repair, human review minutes, total tokens and steps, retries, rollback, and escaped defects.
5. Record why tasks escalated. Escalation is routing data, not merely failure.
6. Observe canary tasks before expanding Flash's autonomous execution scope.

That answers the real question: **at the same quality bar, does putting high-reasoning capability at the planning gate reduce this team's total cost and waiting time per completed task?**

## Turn model routing into an engineering contract

If the idea is reduced to “Astra writes the SPEC and Flash writes the code,” model brands obscure the conditions that actually need control. A deliverable routing contract should state at least:

* What counts as planning complete: non-goals, verified and unverified assumptions, acceptance, tests, and rollback?
* What counts as execution complete: a diff, or a diff whose tests and human review pass?
* Which data and tools may the executor access?
* Which operations need human approval?
* Which step, time, token, or change-surface limit triggers escalation?
* Which role reviews the request, SPEC, diff, and test evidence? Which decisions require human confirmation?
* Which representative tasks must be rerun after a model upgrade?

That is why I see this as an agent-harness problem, not only a model-selection problem. The existing [GPT-5.6 architecture and efficiency article](/en/blog/79-openai-gpt-5-6-frontier-intelligence-efficiency/) offers another angle: capability, intelligence per token, and inference cost have to be evaluated inside the execution system. Routing ultimately serves delivery results, not a prettier leaderboard.

## Final judgment

The September 22, 2026 DeepSWE v1.1 snapshot shows the same displayed completion point estimate for Astra and Flash High across its 113 tasks. Flash reports lower average task cost but more output tokens and steps. This is a limited public benchmark signal, not my own task evidence, and it does not prove that Astra → Flash is cheaper or equally reliable on ordinary projects.

The useful takeaway is a testable routing hypothesis: choose the reasoning tier from task uncertainty and side-effect radius, have the executor verify the specification and work only within the approved boundary, then let a human accept the result. Model brands can change; plan verification, bounded execution, and a human gate remain the workflow's core.

The design depends on a checkable SPEC, bounded permissions, meaningful tests, a human delivery decision, and recorded task cost and outcomes. Without any one of these, model routing can make the wrong change grow faster and more cheaply.
