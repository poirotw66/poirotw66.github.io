---
title: "ParanoiaEval: When a Coding Agent Treats a Resolved Risk Again"
description: "ParanoiaEval uses paired tasks to test whether coding agents choose risk responses from evidence; this article examines its results, limits, and practical evaluation lessons."
pubDate: 2026-10-08
updatedDate: 2026-10-08
tldr:
  - "More agent safeguards do not always mean more reliability: once repository or instruction evidence bounds a risk, extra checks, backups, or defensive logic may duplicate treatment."
  - "Across 9,600 runs of 200 paired tasks, eight models, and two native harnesses, ParanoiaEval reports unnecessary treatment rates of 11.2%–58.7% across configurations."
  - "In a post-hoc study with 20 developers, completed runs with excess treatment scored 1.27/5 lower in satisfaction and were accepted as-is 38% vs. 78%; these are not production-prevalence or long-term maintenance-cost estimates."
audience:
  - "Engineers building coding-agent evaluations, tool workflows, and code review processes"
  - "Engineering leaders assessing whether agent output is adoptable, not merely test-passing"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Research", "架構模式"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 48
kind: "article"
showToc: true
image: "/blog/136-paranoiaeval-risk-treatment/title_image.webp"
---

A coding agent finds the right fix and passes the tests, yet still adds another backup layer, broadens verification, or asks the user to repeat a decision already made. Those actions can look careful. But when repository evidence has already removed or bounded the risk, doing the work again can make a usable change harder to review and slower to adopt.

Published on October 6, 2026, [the ParanoiaEval paper](https://arxiv.org/abs/2610.08662) turns this behavior into a measurable coding-agent capability: can an agent choose a proportionate risk response from the evidence available? Across 9,600 controlled runs, the authors report unnecessary risk treatment rates from 11.2% to 58.7%, depending on the agent configuration. In a post-hoc study with 20 developers, completed runs with excess treatment received satisfaction ratings 1.27 points lower on a five-point scale and were accepted as-is 38% of the time, compared with 78% for runs without excess treatment. These are observations from the authors' benchmark and limited study design. They are not prevalence estimates for production teams, nor do they establish the size of any long-term maintenance cost.

> **Huahua in one sentence**
>
> A good agent must do more than add safeguards: it must recognize when the evidence is already sufficient and stop at the right point.

## More checks do not always mean more safety

A passing test usually answers one question: did the expected functionality work for this task? It does not automatically tell us whether the agent did unnecessary work along the way. One central observation in ParanoiaEval is that 92.7% of the `E+` runs with excess treatment still passed the functional oracle. If a team measures only completion, these extra actions can disappear inside the success count.

The failure is not necessarily visibly broken code. It might be another fallback for a dependency whose version is already pinned, a full suite of checks the task did not call for, or a request to reconfirm a final state the user already specified. The risk itself may be legitimate, but available evidence may show that it no longer exists, belongs to another owner, has a bounded treatment, or has been accepted by the responsible person. The question is not whether the agent looks cautious; it is whether its actions exceed what the evidence supports.

This is not an argument for always doing less. Additional verification may be necessary when the risk remains, no responsible owner is clear, or the user's goal is not yet satisfied. Engineering judgment should compare **risk evidence, ownership, and treatment magnitude** instead of treating either conservatism or minimalism as universally correct.

## How ParanoiaEval makes “doing too much” comparable

The study organizes coding-agent behavior around four responses from software risk management: Avoidance of a risk whose source has been eliminated, Transfer to an existing responsible party, Mitigation within a stated magnitude, and Acceptance of a remaining risk by decision. The authors derived 44 situations from 18,922 de-identified sessions involving coding agents, then instantiated them in 50 open-source Python or Go repositories.

The benchmark contains 200 pairs of repository tasks. Within a pair, one fact that defines the appropriate risk treatment changes; the task objective, repository revision, environment, and oracle remain the same. For example, one version may state that the current version is final while the other omits that fact. The pair tests whether the agent stops creating another backup or asking for confirmation when it sees evidence that the version is final. Two experts checked the paired evidence and tasks.

The authors ran eight model configurations in their native harnesses, Claude Code and Codex, with three runs per condition for 9,600 runs overall. A read-only agentic judge inspected observable run records. The paper reports task success, the unnecessary-treatment violation rate on `E+`, and evidence responsiveness: how much excess treatment falls on `E+` compared with `E−`. On 200 held-out human consensus labels, the authors report judge accuracy of 0.965 and Cohen's κ of 0.93. That is the authors' calibration result, not external validation.

The paired design has a useful property: a model is not judged evidence-responsive merely because it rarely performs extra checks. The study also examines what the agent does when the key evidence is absent, then compares that behavior with the evidence-present condition. This helps distinguish “usually does less” from “adjusts its response to context.”

> **Huahua's engineering note**
>
> This is a controlled capability evaluation, not an incident survey. The paired tasks make the key evidence deliberately clear; real work may contain scattered, ambiguous, or conflicting signals.

## What the numbers show—and what they do not

The authors report that 11.2%–58.7% of runs in the evidence-present `E+` condition still contained excess treatment, depending on the model configuration. The spread across model and harness configurations was large, and higher task success did not guarantee a lower violation rate. The appropriately narrow conclusion is that task completion and risk-treatment judgment are separate metrics worth observing.

Twenty experienced developers took part in the post-hoc review. The authors stratified 800 records from runs that had passed the task oracle; each participant rated 80 records, every record received two ratings, and model identity, judge label, and paired-condition role were hidden. Satisfaction was anchored in code maintainability, runtime, and required corrections. Records with excess treatment averaged 2.58 in satisfaction, compared with 3.85 without it, a 1.27-point difference (`p < .001`). As-is acceptance was 38% versus 78%.

That means excess treatment coincided with lower willingness to adopt these completed runs in this blind review. The study did not follow teams for weeks or months to see whether code was reverted, and it did not estimate cost or delivery delays. The difference should not be rewritten as “unnecessary checks have been proven to cause long-term maintenance losses.” Likewise, 11.2%–58.7% describes the paper's model configurations and task mix, not the prevalence of the behavior across coding agents or company repositories.

Claude-family models ran in Claude Code, while GPT-family models ran in Codex. The authors did not run each model across both harnesses, so cross-harness differences cannot be separated into model effects. The results are more useful for examining behavior classes and evaluation blind spots than for choosing a production model directly.

## Turn the four risk responses into a team review checklist

The taxonomy can become a practical set of questions in code review. These are engineering recommendations derived from the paper's concepts, not interventions whose effectiveness the paper tested:

1. **Avoidance:** Has the source of the risk already been removed? For example, if a dependency is pinned or calls are serialized, is the agent still adding a fallback meant to prevent that risk?
2. **Transfer:** Does CI, a release script, a maintainer, or another service already own this responsibility? Is the agent repeating the same validation or backup?
3. **Mitigation:** Did the user set a limit on test count, scope, or report length? Does the extra verification exceed that boundary?
4. **Acceptance:** Has the responsible person accepted a remaining risk or specified the final state? Is the agent still asking for confirmation, widening treatment, or reopening the decision?

In review, connect each defensive change to concrete evidence: what risk exists, who owns it, why current controls are insufficient, and which risk the proposed action reduces. If that link is unclear, the change is not necessarily wrong, but it needs a better justification and may duplicate treatment of a resolved risk. This lets a code review examine both functionality and change scope.

Teams adopting this idea can score task completion separately from treatment quality, while recording observable signals such as unnecessary edits, extra tool actions, renewed user confirmations, and review effort. Build paired cases that control the key evidence and have people review what counts as the minimum sufficient work. Do not use the paper's 11.2%–58.7% as an internal baseline: each team's repositories, tools, permissions, and risk policies differ. For agent traces, tool permissions, and release evaluation architecture, see the [AI Agent guide](/en/blog/64-ai-agent-guide/). For a related evaluation angle on whether tool actions stay within authorization, read [how agents probe government websites](/en/blog/135-ai-agents-government-site-probing/) and [how executable security probes validate a claim](/en/blog/119-mobilecybench-executable-security-probes/).

> **Huahua's take**
>
> Alongside “did the tests pass?”, code review can ask, “Which unresolved risk justifies each extra safeguard?”

## Evidence boundaries and how to read the artifacts

ParanoiaEval combines a controlled benchmark, an author-designed judge, and a small post-hoc human study. The paired tasks help isolate the effect of one fact. The limits are equally important: evidence in real work may be dispersed, ambiguous, or conflicting; a judge may still err even after calibration against human labels; and participants came from a single regional developer population, which does not represent every team culture or work environment. The benchmark covers 44 situations across 50 open-source Python and Go repositories, not every language, closed commercial codebase, or high-stakes operations task.

The [public repository](https://github.com/ZhuoningXu/ParanoiaEval_release) includes the 200 task pairs, runners, judge, and build scripts, allowing readers to inspect the benchmark structure and configure an execution environment. But the authors say that results and full trajectories are not included: the trajectories are large and require information review, and the authors say they will be handled separately. The repository alone therefore cannot fully reproduce the paper's 9,600-run results; we also found no independent rerun. Readers can inspect the tasks and execution method, but should attribute the headline numbers to the paper's authors.

If a team wants to use this approach, the next step is not to impose a blanket rule against doing more. Identify common forms of duplicated treatment, state what evidence is sufficient to stop, then use paired cases to check whether agents change behavior with that evidence instead of skipping safeguards indiscriminately. ParanoiaEval offers a framework for decomposing the problem and leaves open how agents should handle ambiguous evidence in real work.

## Sources

- [Luo et al., ParanoiaEval: Benchmarking Unnecessary Defensive Work in Agentic Coding](https://arxiv.org/abs/2610.08662) — paper, task design, experiments, post-hoc study, and limitations.
- [Full paper and appendices in HTML](https://arxiv.org/html/2610.08662v1) — judge calibration, study sampling, and limitations.
- [ParanoiaEval_release](https://github.com/ZhuoningXu/ParanoiaEval_release) — public tasks, runners, and judge; its README states that results and full trajectories are not included.
