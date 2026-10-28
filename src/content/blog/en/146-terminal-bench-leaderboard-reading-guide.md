---
title: "How to Read the Terminal-Bench 4.0 Leaderboard: Scores, Agents, Cost, and Limits"
description: "Use a BenchLM snapshot to interpret Terminal-Bench configurations, resolution rates, confidence intervals, evaluation costs, and cross-leaderboard comparisons."
pubDate: 2026-10-28
updatedDate: 2026-10-28
tldr:
  - "A row measures a model, agent, and evaluation configuration together, not a model in isolation."
  - "Check the source, version, and execution conditions before comparing scores, uncertainty, and costs."
  - "Use leaderboards to build a shortlist; evaluate candidates on your own tasks and acceptance criteria."
audience:
  - "Engineers and technical leads choosing coding agents"
  - "Teams designing AI agent evaluations and procurement"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Software Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 30
kind: "article"
showToc: true
image: "/blog/146-terminal-bench-leaderboard-reading-guide/title_image.webp"
---

A Terminal-Bench score such as 64.85% looks like a convenient way to rank coding agents. Before using it to choose one, ask what tasks, agent, and settings produced that number.

This guide uses [BenchLM's Terminal-Bench 4.0 page](https://benchlm.ai/benchmarks/terminal-bench-4) to show how to read a result. The first table uses its **October 25, 2026 snapshot**. Rankings change; the examples teach a method rather than recommend a permanent winner.

> **Huahua in one sentence**
>
> A Terminal-Bench row is the result of a model, agent, execution settings, and task set working together.

## 1. Identify the leaderboard

Terminal-Bench evaluates agents working on tasks in a terminal environment. The [official 4.0 announcement](https://www.tbench.ai/news/terminal-bench-4-0) describes resource calibration, task fixes, and removals. Each task has an eight-hour agent timeout. That is an evaluation limit, not the duration of every run or a promise that such a wait fits your workflow.

BenchLM's main table mirrors published Terminal-Bench results. It says it neither reran the results nor verified each row. The page also has a separate **AA Terminal-Bench 4.0** table: Artificial Analysis controls its own agent harness and settings. Record the source before comparing scores; do not combine the rows into one ranking.

## 2. Read each row as a configuration

These four examples preserve the ranks shown in the BenchLM snapshot. Equal scores can still appear at different ranks.

| Page rank | Model | Agent / reasoning setting | Tasks completed |
| --- | --- | --- | --- |
| 1 | Claude Opus 5.5 | Claude Code / max | 64.85% |
| 2 | Claude Sonnet 5.5 | Claude Code / max | 61.82% |
| 3 | GPT-6 Astra | Codex / max | 58.18% |
| 4 | GPT-6.1 Sol | Codex / max | 58.18% |

The unit of comparison is **model + agent + configuration**. The agent determines how files, commands, context, and feedback are handled; the reasoning setting can change both resource use and results. Different agents make a useful comparison of product combinations, but do not isolate the models' intrinsic capabilities.

The same snapshot lists GPT-6 Astra with Codex at 58.18% on max and 54.24% on medium. Settings matter, but this does not prove max is better on every task, run, or budget. Equal 58.18% scores do not imply that two configurations solved the same tasks or will behave identically in your project.

## 3. Read the score alongside uncertainty

Resolution rate describes the proportion of evaluated tasks passing verification; check the leaderboard's actual denominator, repetitions, and aggregation method. A 64.85% score does not guarantee success on 65 of your next 100 work items. Your task distribution, permissions, verifier, and codebase can differ. The score also does not capture all maintainability, security, or human review costs.

The [official leaderboard](https://www.tbench.ai/leaderboard/terminal-bench/4.0) says its error bars show 95% confidence intervals. These express uncertainty in an estimate, not a range for the probability of the next task succeeding, and they do not automatically cover every source of evaluation bias. As a hypothetical illustration, 60% ± 3 percentage points gives approximately 57%–63%; this is not an interval quoted from a row.

When scores are close, don't decide from rank and decimal places alone. **Overlapping confidence intervals do not by themselves prove a difference is insignificant or that the systems are equivalent.** To assess a difference, obtain task-level or trial-level results, use a suitable paired comparison on shared tasks, and check the number of runs and method. If those data are unavailable, retain the uncertainty.

## 4. Consider cost and tokens with the score

[Snorkel AI's Terminal-Bench 4.0 leaderboard](https://snorkel.ai/leaderboard/terminal-bench/) lists success rate, tokens, and cost together. The following values were displayed when checked on October 28, 2026; they are rounded by the leaderboard and are not live price quotes.

| Model / agent / reasoning setting | Success rate | Tokens | Cost (USD) |
| --- | ---: | ---: | ---: |
| Opus 5.5 / Claude Code / max | 64.8% | 8.0B | \$4,700 |
| Sonnet 5.5 / Claude Code / max | 61.8% | 19.4B | \$7,300 |
| GPT-6 Astra / Codex / max | 58.2% | 1.5B | \$3,300 |
| GPT-6.1 Sol / Codex / max | 58.2% | 1.5B | \$600 |
| GLM-5.3 / Claude Code / max | 41.8% | 8.7B | \$2,700 |
| Grok 4.7 / Grok Build / xhigh | 37.6% | 5.5B | \$3,700 |
| GLM-5.3-Flash / Claude Code / none | 35.8% | 2.9B | \$100 |
| Gemini 3.8 Flash / mini-SWE-agent / high | 19.1% | 17.2B | \$1,800 |

B means billion tokens. Snorkel describes the figures as totals for an evaluation across 66 tasks, not per-task values, and says they are not normalized by effort. The displayed figures are rounded; consult the original run records for pricing, caching, and retry details.

For example, Astra and GPT-6.1 Sol both show 58.2%, but their displayed costs are approximately \$3,300 and \$600. Sonnet 5.5 shows more tokens and higher cost than Opus 5.5, with a lower success rate. These are comparisons of the reported evaluation rows; they do not establish identical task outcomes, the cause of a difference, or what you will pay in practice.

Gemini 3.8 Flash shows 17.2B tokens, more than most entries in this selection, while its displayed \$1,800 cost is lower than some configurations with fewer tokens. This illustrates why pricing structure matters, but does not establish the cause: it uses mini-SWE-agent and high effort, while other rows may differ in agent, settings, and token mix. Its 19.1% result applies to that configuration and task set.

The official leaderboard also shows Cost and Tokens; BenchLM's main table does not. Before comparing costs, establish the number of tasks and trials, pricing method, caching, input versus output tokens, and whether tool or infrastructure charges are included. **Without a known scope, do not treat a whole evaluation's cost as a per-task price or your monthly bill.**

More tokens do not necessarily mean higher cost: input, output, and cached tokens can have different prices. If task sets, run counts, and cost accounting are comparable, total cost divided by successful attempts is a rough evaluation-efficiency indicator. It still excludes human repair, retries, and quality risks, so it is not a direct estimate of real work cost.

> **Huahua's engineering note**
>
> The top row can be a capability candidate. Choosing a system also requires success rate, waiting time, cost, control, and human review.

## When a new model is absent from an older snapshot: GPT-6.1 Terra

[OpenAI's GPT-6.1 Terra announcement](https://openai.com/index/introducing-gpt-6-1-terra/) reports **50.3%** on Terminal-Bench 4.0 at maximum reasoning effort, alongside a previously published 21.5% for GPT-5.6 Terra. These are OpenAI-reported results under particular settings. Review the run details and task-level results before assessing the difference or comparability.

The BenchLM main-table snapshot above ends on October 25 and does not include the subsequently released GPT-6.1 Terra. BenchLM's separate Artificial Analysis table shows Terra at 55.6% under another execution setup. **Do not combine OpenAI's 50.3%, AA's 55.6%, and the main table into a new ranking.** They are signals to investigate, not enough on their own to explain a change in capability.

OpenAI also lists standard API prices per million tokens: \$1 input, \$0.05 cached input, and \$5 output. These unit prices cannot be compared directly with the full-evaluation costs above; actual cost depends on the input, output, and cache mix. OpenAI's other claims about computer use and cost use different benchmarks and are not evidence for Terminal-Bench. If Terra is a candidate, test it against Gemini and other combinations on the same internal tasks and cost accounting.

## 5. Do not compare versions directly

The organizers say 4.0 removed eight tasks, fixed nineteen, and changed resource limits; some removed tasks no longer distinguished frontier systems. The [version announcement](https://www.tbench.ai/news/terminal-bench-4-0) treats these changes as requiring new runs. A 70% score on 3.0 and 60% on 4.0 therefore do not establish that the same model fell by ten percentage points. First check whether the version, task set, and environment match.

Evaluations also evolve: the organizers list verifier improvements as future work. Public tasks may be vulnerable to contamination or optimization for the scoring mechanism; one leaderboard score cannot rule out those risks. The [tasks and source code](https://github.com/harbor-framework/terminal-bench) are open for inspection, but public access does not mean every row has been independently reproduced.

## Turn the leaderboard into your own evaluation

1. **Shortlist candidates.** Record the source, snapshot date, benchmark version, model, agent, reasoning setting, and score. Keep results from different sources separate.
2. **Choose representative work.** Sample bug fixes, cross-file changes, tests, and environment operations, including hard cases that require judgment. Keep some test tasks private.
3. **Control comparable conditions.** Use the same tasks, environment, permissions, time, and budget limits; record model and agent versions, repeat runs, and retain per-task outcomes. If product capabilities differ, say explicitly that the comparison is between complete products.
4. **Define acceptance.** Check requirements, code quality, security, and regressions alongside test results. Have someone familiar with the project review the work and record failure causes and repair time.
5. **Choose against your priorities.** Compare pass rate, latency, actual bills, and human intervention. Treat small samples as exploratory; expand the sample before major procurement or release decisions.

A leaderboard narrows the search. Running your own tasks tells you whether its advantages transfer to your work. For more on tools and context, see the [AI Agent guide](/en/blog/64-ai-agent-guide/); for testing whether an agent follows repository requirements, see [SWE-CC and coding agent evaluation](/en/blog/137-swe-cc-repository-policy-compliance/).
