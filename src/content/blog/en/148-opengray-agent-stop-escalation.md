---
title: "OpenGray: Why Decision Accuracy Above 90% Can Hide Failures to Stop"
description: "Use OpenGray's known-answer tasks and planning logs to distinguish aggregate decision scores, escalation, dose-goal attainment, and deliverability."
pubDate: 2026-10-30
updatedDate: 2026-10-30
tldr:
  - "The authors report 92.1% patient-weighted decision accuracy for the full Terra agent, but only 5 escalations in 20 overlap-contradiction attempts; the denominators and weights differ."
  - "Recognizing an unmet goal, proving a request impossible, and stopping to request review are three capabilities that need separate evaluation."
  - "Feasible controls establish a solution only within the specified dose model; the study does not establish machine deliverability or measure clinical safety rates."
audience:
  - "Engineers designing control loops and evaluations for tool-using agents"
  - "AI systems developers interpreting task scores, failure handling, and escalation policies"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Harness Engineering"]
kind: "article"
showToc: true
image: "/blog/148-opengray-agent-stop-escalation/title_image.webp"
imageAlt: "Original concept illustration: Huahua pauses beside a workflow gate and a bell for requesting review."
---

An agent identifies an unmet goal in its reply, then chooses to try again. Did the model misunderstand the problem, or did the workflow fail to give it an executable way out of the loop?

[OpenGray](https://arxiv.org/abs/2610.37081) investigates that question in a radiotherapy-planning research environment. Some requests are achievable; others have been mathematically verified as incompatible. The authors evaluate whether a system submits when it should and stops to request review when it should escalate. This article examines that agent-engineering question. Decision scores, achieved goals, and clinical usability must remain separate when interpreting the findings.

## An unsuccessful optimizer does not prove an impossible request

A planner can fail to find a good answer for at least two reasons: the requirements conflict, or its method has not found a solution that exists. Without distinguishing those cases, it is hard to judge whether another attempt or a request for review is the appropriate action.

OpenGray establishes known answers for selected tasks. It builds on public OpenKBP-Opt head-and-neck cases, using a dose-influence matrix to map nonnegative beamlet fluence—the intensities of small beam elements—to dose. Within that model, the authors construct two contradiction families and store plans satisfying every hard goal as feasible witnesses. The [methods and Supplementary Section S5](https://arxiv.org/html/2610.37081v1#S2) distinguish evidence of impossibility from evidence that a solution exists.

The harder contradiction concerns overlapping target and organ tissue. Intuitively, the same small piece of tissue cannot receive a dose above one threshold and below an incompatible lower threshold. If there are more overlapping voxels than the combined allowance for underdosed target voxels and overdosed organ voxels, they cannot all fit within the requirements. The formal certificate also accounts for dose tolerances and interpolation. It is a sufficient condition for a contradiction, not a general solver for the feasibility of every plan.

Feasible controls supply the opposite evidence: a stored plan meets every hard goal under the same model, optimizer, and original computational budget. If an agent subsequently falls short, the evaluator cannot simply blame an impossible task. Nor does failure to find a witness prove impossibility; the study excludes constructions it cannot verify.

## A high aggregate can give the difficult stopping decision little weight

The authors compare four systems: a scripted controller; a controller preceded by arithmetic checks; an interpreter that uses one LLM review before delegating to the controller; and a full agent whose LLM chooses each planning action.

The primary evaluation reserves **30 patient cases**. Eligibility differs across the four scored task families, yielding **94 patient–family combinations**. Each language system runs each task twice with Terra, for **188 attempts per system**. Routine planning and conflicting physician notes are analyzed separately and excluded from primary decision accuracy. [Table 1 and Supplementary Section S1.4](https://arxiv.org/html/2610.37081v1#S2) define this scope.

| Scored task | Eligible cases | Required decision | Full Terra agent's result |
|---|---:|---|---|
| Required structure absent | 30 | Escalate for review | 60/60 escalations |
| Coverage requirement exceeds the body-dose cap | 29 | Escalate for review | 56/58 escalations; one submission and one technical failure |
| Target–organ overlap contradiction | 10 | Escalate for review | 5/20 escalations |
| Verified feasible control | 25 | Submit | 50/50 submissions |

Under these conditions, the authors report **92.1% primary decision accuracy** for the full agent, but only **25% overlap escalation, with a 95% confidence interval of 10–40%**. [Supplementary Tables S10–S12](https://arxiv.org/html/2610.37081v1#S8) provide the family and attempt-level results. The interval uses **10,000 patient-bootstrap resamples**. Those 20 attempts are two repetitions of 10 cases, not 20 independent patients.

The 92.1% score is also not the number of correct attempts divided directly by 188. The authors average repetitions within each patient and task family, average the eligible families for that patient, then give each of the 30 patients equal weight. Under this primary weighting, overlap contradictions contribute only **9.2%**. Missing-structure and feasible-control tasks, which every system passes, contribute approximately three fifths together. With equal weights for the four families, the same full agent scores **80.4%**. No model was rerun; the evaluator changed the weights.

The useful question is therefore which decisions produced the aggregate. In the **15 overlap submissions** that missed the contradiction, the full agent used all three optimizations and listed the unmet hard goals without identifying the request as infeasible. Describing the deficient result did not complete the required stopping decision.

## A correct submission action does not mean the submitted plan meets its goals

OpenGray's primary score deliberately preserves another distinction. A feasible-control task receives decision credit for an explicit submission even if the submitted plan misses hard goals. The action endpoint asks whether to submit or escalate; dose attainment is recorded separately.

All four systems in the Terra/scripted comparison submit every feasible control. Yet only **19/25** plans from each scripted system and **38/50** from each language system meet every hard goal: **76%** in each case. The remaining **24%** list their unmet goals and still receive correct-decision credit under the primary policy. [Tables S7, S13, and S14](https://arxiv.org/html/2610.37081v1#S8) separate action from dose outcomes. Requiring every hard goal to be met before crediting a control submission lowers the full agent's primary score from **92.1% to 85.7%**.

Replacing one score with another does not resolve the underlying evaluation problem. Acceptance criteria need to cover both the selected action and the conditions satisfied by the artifact. Keeping only one allows failures in the other to disappear behind an attractive aggregate.

Feasibility itself has a boundary. The primary optimization omits machine constraints. In Supplementary Table S19, the authors examine **540 submitted plans from the primary Terra/scripted reserved evaluation**, none of which meets the **SPG ≤ 65** fluence-complexity condition used for the OpenKBP-Opt reference plans. This count does not include all Ministral submissions. SPG summarizes positive changes between adjacent beamlet intensities; that threshold is not a complete test of clinical deliverability either. The [limitations and Supplementary Section S9.4](https://arxiv.org/html/2610.37081v1#S9) therefore require feasible controls to be verified again under deliverability constraints. Here, “a solution exists” applies to the study's specified dose model.

## Recognizing a failure still requires an executable stopping action

The paper also audits SAGE planning logs from one institution. This is a separate source of evidence, not another known-answer benchmark cohort: **39 planning runs from 31 patients**, including restarted refinement runs. Four runs reach the ten-attempt limit with the same goal failing at every new dose calculation.

Across the audit's **88 replies**, the model names the failing goals consistently with the values it was shown. This does not mean there were 88 replies in each of the four unresolved runs. The instructions, however, provide no action for stopping or escalating for review. A separate rule asks for a flag after four unsuccessful attempts, but the model receives no current attempt number and sees at most three recent attempts. The paper records reasoning that counts those three visible attempts and defers the flag. [Main Section 3.3 and Supplementary Section S7](https://arxiv.org/html/2610.37081v1#S7) document that missing state.

This differs from the benchmark failure. OpenGray's full agent already has an escalation tool but often does not choose it; the SAGE workflow supplies no stop/escalate action. The former requires testing recognition and decision-making. The latter also requires an action space and the state on which its rules depend. A request to “be careful” cannot replace those connections.

The logs have no verified feasibility ground truth, so they do not establish that all four unresolved runs were pursuing impossible requests. They support a narrower conclusion: correctly describing the current failure does not automatically produce an appropriate exit behavior.

> **Huahua's engineering note**
>
> Asking an agent to stop when necessary requires an executable action, a usable trigger rule, and the state that rule depends on. Describing risk in a reply does not mean the control flow has stopped.

## Make stopping an inspectable system state

The evaluation method is what I would take from OpenGray into general agent design: record problem recognition, action selection, actual tool execution, and artifact attainment separately. Those records help distinguish a failure to understand the numbers from a failure to establish incompatibility, a wrong action, or an action that never reached the external system.

Demonstrated incompatibility, an unresolved task after budget exhaustion, and tool-execution failure should also have distinct states and reasons. This is an engineering interpretation of the findings; the paper does not measure how much such a redesign would reduce failure rates. In particular, several unsuccessful optimizations do not establish mathematical infeasibility. Uncertainty can be a reason to request review without claiming a proof.

The authors' [Zenodo deposit](https://doi.org/10.5281/zenodo.23681336) contains research software and stored result-analysis data. Its README explicitly excludes the original evaluation prompts, frozen evaluation source snapshot, complete trajectories, and stored submitted fluences; clinical records are also private. Public outcomes enable closer scrutiny of the statistics, but do not establish complete reproducibility of the original experiment.

The reserved evaluation examined here covers a particular head-and-neck dataset, two constructed contradiction families, and the Terra and Ministral language models. It does not measure clinical safety rates. For an engineering team, a practical next question is whether its evaluation includes both tasks that require stopping and tasks that are achievable and should not trigger unnecessary escalation. Alongside the [general agent control loop](/en/blog/64-ai-agent-guide/), evaluating actions and artifacts separately on those two sets can reveal whether a high score includes the ability to stop appropriately.
