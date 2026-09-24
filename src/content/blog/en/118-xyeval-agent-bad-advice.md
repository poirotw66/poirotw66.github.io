---
title: "AI Agents Should Do More Than Agree: How the XY Problem Derails a Fix"
description: "XYEval shows how a plausible but misplaced user suggestion can lower agent success; the practical response is to verify the goal, then explain a better path with evidence."
pubDate: 2026-09-24
updatedDate: 2026-09-24
tldr:
  - "Treat a user's proposed fix as a hypothesis. Return to observable symptoms, success criteria, and tests to confirm the problem that actually needs solving."
  - "XYEval compares five models facing misleading suggestions across six existing suites; results vary by model and benchmark, with a maximum relative score drop of 46.7% for Gemini 3.1 Pro on Terminal-Bench."
  - "The 46.7% figure is a relative decline from the original Pass@1 score, not 46.7 percentage points or a measure of how often users mislead agents in real conversations."
  - "A system-prompt reminder is not enough. Tool feedback, tests, clarification, and clear explanations should work together in an evaluable correction process."
audience:
  - "Engineers building coding agents, support agents, or multi-step tool workflows"
  - "Technical leaders responsible for agent evaluation, product experience, and launch readiness"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Research", "AI Safety"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 39
kind: "article"
showToc: true
image: "/blog/118-xyeval-agent-bad-advice/title_image.webp"
---

“The site is slow. Could we raise the cache TTL from five minutes to a day?” That sounds like a clear engineering task. But if the actual latency comes from a database lock, a longer cache might make the page seem faster while keeping stale data around for longer. A user's symptom, their guess about the cause, and their proposed fix may describe three different things.

This communication gap is known as the **XY problem**: someone asks how to do X when the real need is to solve Y. In a [paper submitted on September 20, 2026](https://arxiv.org/abs/2609.23939), Google DeepMind researchers bring this problem into agent evaluation: when a user offers advice that sounds credible but would steer the task off course, can an agent check it, correct course, and help the user understand why?

> **Huahua in one sentence**
>
> A useful agent treats the user's guess as a hypothesis, then uses the task goal and verifiable evidence to choose what to do next.

## Treat advice as a hypothesis; return to the success criteria

Many interactive systems are trained to be agreeable. That can make them easier to use, but it can also lead an agent to mistake a confident diagnosis for a confirmed requirement. It might edit the wrong file, choose the wrong tool, or take an unnecessary step in a support workflow. The agent may look busy without solving the original problem.

An engineering team can start by separating a request into three layers:

1. **Observed facts:** the actual error, reproduction steps, logs, the transaction the user needs, or the expected outcome.
2. **User hypotheses:** possible causes, suggested files, tools to call, or workarounds to try.
3. **Verifiable success criteria:** passing tests, a policy-compliant state, correct data, or a completed workflow.

A suggestion can be a useful clue, but it cannot replace the success criteria. The agent should find evidence that distinguishes “X is the root cause” from “X is only a guess,” then decide whether to act, investigate, or ask a question. This extends a principle from the [AI Agent architecture guide](/en/blog/64-ai-agent-guide/): workflows need explicit state, tool boundaries, and verification loops; they cannot rely on a model sounding more confident about a prompt.

## How XYEval turns bad advice into a testable condition

XYEval is a meta-evaluation framework that adapts existing benchmarks to test the XY problem. The researchers keep the original task environment and scoring oracle, then add a misleading suggestion to the task instruction. This lets them compare performance on the same task with and without the suggestion. For some SWE-bench Verified tasks that already included a user's guess, the researchers first separated the objective problem description from the subjective direction, then replaced that direction with a misleading one to avoid conflicting signals in the prompt.

The source of these “user suggestions” matters. For SWE-bench, Gemini 3.5 Flash used an internal tool harness to explore the issue and correct patch before generating a wrong direction. For Terminal-Bench, the generator sees the task, solution, and verification tests; for some models, the model under evaluation generates its own suggestion. On HLE, each tested model also generates its own misleading hint. Tau-bench instead uses researcher-designed, rule-based suggestions for airline, retail, and telecom scenarios. These are controlled, model-generated or expert-designed test inputs, not a random sample measuring how often real users mislead agents.

The paper evaluates Gemini 3.1 Pro, Gemini 3.5 Flash, Gemini 3.7 Flash, Claude Opus 4.8, and GPT 5.5 across τ²-bench, SWE-bench Verified, SWE-bench Pro, Terminal-Bench, Humanity’s Last Exam (HLE), and MCP-Atlas. The six suites do not share one task format or scoring method: HLE, for example, is a single-turn question-answering benchmark, not a tool-using agent workflow. XYEval's value is that it applies a related “does advice misdirect the decision?” question to several established evaluations, not that every setting has the same risk.

## What is the denominator behind 46.7%?

The largest relative drop appears on Terminal-Bench: Gemini 3.1 Pro's Pass@1 falls from **67.4%** on the original tasks to **36.0%** with the suggestion. That is a difference of 31.4 percentage points. Divide that difference by the original 67.4% score, and the result is a **46.7% relative score decline**. It would be incorrect to say that “the agent was misled on 46.7% of tasks.”

| Benchmark and model | Original score | With suggestion | Relative change |
| --- | ---: | ---: | ---: |
| Terminal-Bench, Gemini 3.1 Pro | 67.4% | 36.0% | −46.7% |
| τ²-bench, Gemini 3.5 Flash | 85.6% | 53.8% | −37.2% |
| MCP-Atlas, Gemini 3.1 Pro | 79.6% | 58.8% | −26.2% |

These are relative changes in each benchmark's reported score. τ²-bench uses average task reward, MCP-Atlas uses claim coverage, and the other suites mainly report Pass@1 or accuracy. The appendix also calculates a drop over only the tasks a model solved in the control condition. That solved-only denominator more directly measures previously solved tasks lost after bad advice, and should not be conflated with the score across the full task set.

The result does not mean every model or task drops by 46.7%. Outcomes vary: Claude Opus 4.8 has a 9.1% relative drop on Terminal-Bench, while Gemini 3.7 Flash improves by 2.4% on SWE-bench Pro. The data shows that misleading advice can change a solution path in these evaluation settings; it is not an estimate of how often the problem occurs in real user conversations.

## Recognizing a problem is not the same as explaining it

The XY problem tests communication as well as root-cause analysis. In an extension to τ²-bench, a simulated user keeps insisting after the agent gives an appropriate objection, until the agent explains why the suggestion would not help. The paper finds that this “pedantic user” setting causes further performance drops in most domains. System instructions that encourage the agent to explain its reasoning help, but leave substantial gaps.

The authors also analyze interaction traces. In τ²-bench, agents on average recognized a problem or policy constraint in their internal reasoning in 92.1% of traces. Yet under the standard misleading-suggestion setting, some models still failed to voice their disagreement in the conversation. That separates two quality dimensions: noticing a problem internally and communicating it clearly to the user. If a product records only final task success, it is hard to tell whether the agent missed the issue, skipped verification, or suspected a problem but failed to explain it.

> **Huahua's engineering note**
>
> A system prompt that says “do not blindly follow” is not enough as a control. Give the agent access to test or tool feedback, record how it checks a suggestion, and evaluate whether it communicates the reason to the user.

## Make disagreement part of a verifiable workflow

For a coding agent, the process can use explicit checkpoints:

1. **Restate the goal:** confirm the correct outcome the user wants before accepting their diagnosis.
2. **Keep the source of each claim:** record whether a diagnosis came from the user, retrieved evidence, or the agent's own inference, so a hypothesis is not later mistaken for an observed fact.
3. **Find evidence that distinguishes the possibilities:** inspect relevant code, reproduce the issue, run a targeted test, or check tool state. Do not edit just because a suggestion sounds plausible.
4. **Explain the decision and uncertainty:** if the evidence supports another path, briefly say what the original suggestion would and would not solve, then propose a next step. If evidence is insufficient or the action has significant impact, clarify or ask for approval first.
5. **Verify the outcome:** check the success criteria and connect the result to the original task instead of treating “did what was suggested” as completion.

These checkpoints also fit support and tool-using agents. A support agent can check order state and policy before deciding whether to cancel an order, rather than acting solely because the user says it “should be canceled.” A data agent can first check whether query results support the conclusion a user expects. When an agent's recommendation has side effects, checkpoints should connect to tool authorization and human approval; the model should not be the sole judge of its own decision. Teams can use the Evidence, Policy, Judge, and Trace dimensions in the [Agentic AI platform contract](/en/blog/93-agentic-ai-platform-contract/) to bring this capability into system controls and regression tests.

Evaluation should measure more than how many suggestions the agent rejects. For each task, record the original outcome, the outcome with a misleading suggestion, the suggestion's source, whether the agent verified it, whether it found the actual goal, whether it explained its reasoning, tool side effects, and whether the user had to ask again. Otherwise, an agent that distrusts every user could slow down simple tasks or reject correct advice.

## Research limits and further reading

XYEval is a controlled benchmark, not a survey of real product conversations. Some wrong suggestions are generated by models given the correct solution, and others are designed with expert rules; the tested models and suggestion generators are not fully independent across datasets. Benchmarks also differ in their baselines, scoring oracles, and task formats, so scores should be interpreted within each setup. The authors state in the paper that they will release the benchmark, but when I rechecked the [specified GitHub repository](https://github.com/google-deepmind/xyeval) on **September 24, 2026**, the GitHub API returned HTTP 404. A usable public artifact could not be verified or obtained.

This article focuses on the workflow and how to interpret the evaluation. For the full mutation method, model analysis, and per-suite results, read our [paper reading: XYEval—Why agents say yes to bad advice](/paper-reading/69-xyeval-agents-say-yes-to-bad-advice/). To explore out-of-domain tool reasoning, see [AgentEscapeBench: Evaluating Out-of-Domain Tool Reasoning](/en/blog/74-agentescapebench-ood-tool-reasoning/); for a broader map of agent architecture, start with the [AI Agent architecture guide](/en/blog/64-ai-agent-guide/).

### Sources

- Wu, Zhengxuan, Yuxuan Li, Oyvind Tafjord, and Been Kim. [“XYEval: Agents say yes to bad advice.”](https://arxiv.org/abs/2609.23939) arXiv:2609.23939, submitted 2026-09-20. [Full text and appendices](https://arxiv.org/html/2609.23939), CC BY 4.0.
- Repository named in the paper: [google-deepmind/xyeval](https://github.com/google-deepmind/xyeval) (returned HTTP 404 on the 2026-09-24 check; public availability could not be verified).
