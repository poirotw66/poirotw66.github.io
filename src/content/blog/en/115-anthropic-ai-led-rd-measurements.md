---
title: "What Should We Measure When AI Starts Doing AI R&D? Anthropic's Three Dashboards"
description: "Anthropic proposes three measurements for AI-led R&D: automation, agent oversight, and safety compute; this article separates its internal self-report from methodology limits and cross-lab comparability."
pubDate: 2026-09-22
updatedDate: 2026-09-22
tldr:
  - "The pace of AI building AI cannot be reduced to model capability; it needs separate measurements for AI-led R&D, agent oversight, and safety compute."
  - "Using an August 2026 internal snapshot, Anthropic reports Claude leading 26% of measured AI R&D work and more than 90% at or above the 'AI collaborates' level; the result depends on Anthropic's task tree, models, judgments, and internal data."
  - "Coverage, review latency, escalation rate, and safety-compute share can form an operational dashboard, but a one-week snapshot, best-effort labels, different definitions, and no third-party replication mean cross-lab comparison is not established."
audience:
  - "Engineers building AI research agents, agent runtimes, and oversight pipelines"
  - "Technical leaders and policy teams evaluating frontier-AI progress, transparency, and governance measures"
category: "Industry Pulse"
tags: ["Anthropic", "AI Agent", "Evaluation", "Governance", "Research"]
cluster: "ai-platform-governance"
clusterRole: "signal"
clusterOrder: 33
kind: "article"
showToc: true
wideHeader: true
image: "/blog/115-anthropic-ai-led-rd-measurements/title_image.webp"
---

When AI does more than help humans write code or run experiments—when it starts participating in building the next generation of AI—the hard question is no longer only “How capable is the model?” We also need to know: how much AI leads AI R&D, whether agent actions are visible and reviewable, and how much compute a lab assigns to safety work.

In [Measurements for understanding the pace of AI development inside frontier labs](https://www.anthropic.com/institute/measuring-pace-of-ai-development), Anthropic proposes three measurement families and publishes an internal snapshot from its own systems. This is not a benchmark that compresses frontier progress into one score, nor is it an already-completed cross-lab comparison. It is closer to a set of dashboards that turns “AI is accelerating AI” into questions with explicit denominators, evidence trails, and possible external checks.

> **Huahua in one sentence**
>
> To make AI-led R&D governable, measure how much work is automated, whether actions are overseen, and where the compute goes.

## What the three measurements answer

| Measurement area | Question Anthropic is trying to answer | Current snapshot and what it cannot establish |
| --- | --- | --- |
| AI-led R&D | Which automation level has AI reached across AI R&D tasks? | Claude “leads” 26% of measured AI R&D work, with more than 90% at or above “AI collaborates”; this is not a 26% capability gain and does not establish recursive self-improvement. |
| Agent oversight | How much agent activity is monitored, how quickly is it reviewed, and how much is blocked or escalated? | About 30,000 agents were on Anthropic’s measured internal platform; online and offline coverage were both 100%; this does not show that all unknown behavior is detected or that coverage transfers across platforms. |
| Safety compute | What share of AI R&D compute is classified as safety work? | About 6% of AI R&D compute and about 12% of AI-driven AI R&D compute went to safety in the sampled week; this is not total safety effort, a long-term trend, or a safety-quality score. |

The denominators are not interchangeable. Automation asks who is doing the work; oversight asks whether actions enter a control loop; compute allocation asks where resources are being spent. Turning them into one “AI progress rate” would hide the engineering judgments that matter most.

## 1. AI-led R&D: measure how far work has been automated

Anthropic built a prototype **Anthropic R&D Automation Index**. Instead of counting how often a tool was used, it first catalogs the kinds of AI R&D work happening across the company, rates the automation level of each kind of work, and aggregates those ratings with weights intended to reflect importance.

The index uses the Automation Level (AL) scale proposed by Epoch AI. AL0 means no AI involvement; AL5 means AI operates fully autonomously with no human in the loop. At AL3, “AI collaborates”: it can do large chunks of work under close human direction. At AL4, “AI leads”: it can complete most of the task end to end from a high-level prompt while a human supervises. That distinction matters. Moving from collaboration to leadership changes the pace of supervision and the allocation of responsibility; it is not simply a matter of producing more tokens.

As of August 2026, Anthropic reports three findings: Claude was not fully autonomous for any measured subset of AI R&D; Claude “leads” 26% of Anthropic’s AI R&D work; and more than 90% of the work was at or above “AI collaborates.” These are internal, self-reported measurements from Anthropic’s own method. They describe the work distribution Anthropic observed, not a percentage for the frontier industry as a whole.

### How the index was constructed

The appendix makes the method unusually concrete. Anthropic built a bottom-up task list from work records including Slack and internal documentation. For each week in July 2026, it randomly sampled 20% of staff from each department involved in the model-R&D loop. A Claude research agent reviewed each sampled person’s week and produced about 15,000 granular model-R&D tasks. Claude then organized those tasks into a hierarchy with 542 nodes and 378 leaves. The tree was frozen so later measurements could use the same basket of work.

For every node, another Claude judge assigned an automation level based on the evidence. The weights used person-time as a rough proxy: one person-week was divided across the tasks that person worked on. Anthropic also asked staff who owned the relevant work areas to rate their areas independently. Exact model–human agreement was 59%, exact human–human agreement was 35%, and model and human ratings were within one level of each other 97% of the time.

Those numbers are both methodological evidence and a warning. The judge model and the evaluated Claude belong to the same model family and could make similar errors. Anthropic also says there is real disagreement around the boundary between “AI collaborates” and “AI leads.” A frozen task basket provides a fixed baseline for a time series, but a rising index alone cannot show whether new kinds of work have appeared while humans moved onto them. Anthropic constructed an alternative January 2026 tree and reports no increase in “novel” tasks between the January and July baskets at its level of analysis; it also plans to rebuild the basket periodically and version the published numbers.

The durable value is therefore not the isolated 26%. The index forces a team to define the task boundary, the automation-level rubric, and the weighting denominator. Without those three layers, a percentage across quarters or labs may mostly reflect different classifiers and taxonomies.

## 2. Agent oversight: coverage is not the same as effective supervision

The second measurement family addresses visibility when semi-autonomous agents work for long stretches. Anthropic says that, in August 2026, about 30,000 agents were doing research and engineering work at any one time on its most-used internal platform. The figure covers that platform only; it is not a company-wide count of every Anthropic agent.

Anthropic breaks oversight into three operational metrics:

- **Coverage**: the share of an agent’s actions that pass through a monitor before or after execution.
- **Review latency**: the time from an action to automated monitoring and then to human review.
- **Escalation rate**: the share of activity blocked or redirected by online monitoring, or flagged for further review by offline monitoring.

There are two monitor types. Online monitors check actions in real time before execution, which fits harms that happen quickly and cannot be undone—for example, an agent copying model weights out of a system. Offline monitors read activity after the fact, which fits dangerous behaviors that develop slowly and can still be reversed, such as signs of model misalignment.

Anthropic’s internal snapshot reports 100% coverage for both monitor types on that platform. Online monitoring happens before an agent acts, usually within seconds; humans review blocked actions within one week. Offline monitoring flags about 100,000 transcripts per week, which then go through multiple classifiers for false positives and initial oversight review. The highest-priority flags—about 50 per week—are escalated to human review.

In an August 2026 analysis of more than one billion research-and-engineering agent decisions, the online monitor blocked 0.002%, or about one in 47,000 decisions. The offline monitor flagged about one or two in every thousand agent activities for further review. These are Anthropic’s measurements of its own platform and process, not a general agent error rate, harm rate, or false-negative rate.

More importantly, 100% coverage means that activity entered a monitor. It does not mean the monitor understood every action, caught every problem, or that humans could resolve every escalation quickly. Anthropic’s scaffold gives agents individual identities and makes their records traceable, while its agents communicate through an open, cross-referenced messaging system. That helps monitoring follow behavior through identities and transcripts. The appendix also acknowledges that this monitoring has existed for months rather than years, so it is difficult to know whether all possible behaviors are covered or sufficiently legible to human oversight.

> **Huahua's engineering note**
>
> Coverage is an entry condition, not a conclusion about oversight quality; production systems still need review latency, escalation outcomes, and independent tests for known misbehavior.

For teams operating research agents, this is more actionable than saying “we have logs.” Which actions must be intercepted before execution? How quickly must an event enter review? Which events go to a human? Anthropic argues that other AI developers could publish the same metrics and points to third-party verification as a next step. That is the missing bridge from an internal control plane to a comparable regime.

## 3. Safety compute: measure an input without mistaking it for an outcome

The third measurement shifts attention from actions and tasks to resources. Anthropic examined all compute used from July 13 to July 20, 2026, classified workloads into a small set of categories, and estimated how much compute going to AI R&D was used for safety work.

In that snapshot, about 6% of AI R&D compute was allocated to safety. Looking only at AI-driven AI R&D, about 12% of compute was allocated to safety. Anthropic explicitly calls these conservative estimates: if a token advanced capabilities and safety equally, it was not counted for these metrics. The estimates also exclude a separate, comparable amount of compute used for safeguards classifiers.

This metric is easy to misread as a safety score. Safety research often consists of researchers designing experiments; running those experiments is not necessarily compute-intensive. Compute share is therefore an imperfect proxy for how much a company focuses on safety. A more efficient safety classifier can lower the safety share without less safety work being done. Conversely, more efficient production inference can increase the relative share of classifier compute. Anthropic says the metric is more useful as a straightforward way to compare like with like across developers and over time than as an absolute account of effort.

### The classification boundary is the central risk

Anthropic joined existing capacity-planning tools, accelerator usage, workload metadata, and third-party cloud-provider reports. It then used a Claude classifier to decide whether a workload’s dominant purpose was making AI systems safer, more understandable, or more secure. Everything else—including capability research, production-model training, product development, and developer tooling—was classified as AI R&D. For research training and evaluation runs, which numbered almost 10,000 in the week, Anthropic sampled about 14% and weighted the sample toward the runs that used the most compute so the result represented compute flow rather than run count.

Many underlying labels came from automated rules or users and were best effort rather than verified one by one. When an agent transcript was inaccessible because of compartmentalization, the pipeline used the user’s team or conservatively defaulted to AI R&D. Anthropic reports that extensive written definitions and boundary cases brought classifier and human-reviewer results within one or two percentage points, but some cases remained hard to determine even after hours of human review. The time window is another limitation: one week is enough to show that the measurement can be made, not enough to establish a meaningful trend.

If a company adopts a safety-compute share, it needs to put category definitions, gray areas, sampling, weighting, label provenance, and rechecks into a measurement contract. The number is not a safety guarantee. A rerunnable classification pipeline and a contestable evidence trail are the real engineering artifacts.

## Can these dashboards be compared across labs? Not directly yet

Anthropic says any frontier developer could publish these measures regularly using a public methodology, enabling comparison over time and potentially across labs. The same page also names the two main obstacles: there is no common methodology, and developers are using their own models to evaluate their own systems, which means a judge model may make the same kinds of errors as the model it is checking.

The most accurate reading today is therefore: these are **internal, self-reported measurement prototypes from Anthropic, with disclosed methods but without a cross-lab protocol that has been independently validated**. They are more informative than having no numbers, but they are not externally reproduced benchmarks. Cross-lab comparison would need common task taxonomies and Automation Level definitions, explicit oversight events and denominators, comparable safety-work boundary cases, and checks by third parties or other developers’ models. Even then, platform scope, time window, and data availability would need to sit next to each number.

That limitation is not a footnote; it is part of the design. When we see 26%, 100%, 0.002%, 6%, or 12%, the first question should be “What are the denominator, observation window, and classifier?” It should not be to rank percentages from different labs as if they were one leaderboard.

## A practical sequence for engineering teams

The most useful enterprise lesson in Anthropic’s post is to turn “Will AI do more work?” into auditable control loops:

1. **Fix the measurement unit first.** Separate task, agent action, transcript, decision, workload, and compute. Different units cannot share one percentage.
2. **Fix the denominator and time window.** State whether the scope is all AI R&D, AI-driven AI R&D, one platform, or one week’s snapshot. Do not package a snapshot as a trend.
3. **Keep classification evidence.** Automation levels, monitor escalations, and safety-work labels should lead back to source records, rules, samples, and reviewers.
4. **Only then discuss cross-organization comparison.** Publish definitions, boundary cases, and known limitations before asking a third party or another model to check the result. Without a common method, an honest within-organization time series is better than a false ranking.

This sequence also explains why the state, tools, evaluation, observability, and failure recovery in the [AI Agent guide](/en/blog/64-ai-agent-guide/) are not just architecture components: they are the evidence sources needed to answer what an agent did, who reviewed it, and where it was stopped. For threat boundaries, see [Enterprise AI Agent Security](/en/blog/43-enterprise-ai-agent-security/). For turning control surfaces into launch criteria, read the [Agentic AI Platform Contract](/en/blog/93-agentic-ai-platform-contract/). For the denominator problem around compute and cost, see [How to measure LLM inference cost](/en/blog/94-llm-api-pricing-inference-cost/).

> **Huahua's take**
>
> Once AI participates in AI R&D, the smallest useful unit of transparency is not model capability; it is a rerunnable task definition, a traceable agent action, and an explainable resource classification.

## Sources

- [Anthropic: Measurements for understanding the pace of AI development inside frontier labs](https://www.anthropic.com/institute/measuring-pace-of-ai-development) — the three measurements, August 2026 internal snapshot, and methodology appendix.
