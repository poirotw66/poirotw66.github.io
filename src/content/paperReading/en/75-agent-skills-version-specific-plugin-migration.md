---
title: "Do Agent Skills Help with Version-Specific Plugin Migration? Scores and Contract Audits in a Retrospective Study"
description: "A close reading of the arXiv v1 comparison of a dsh plugin migration skill: what the static diagnostic scores show, how a contract counterexample qualifies them, and where task concentration, LLM judges, and artifact coverage set limits."
pubDate: 2026-09-27
updatedDate: 2026-09-27
tldr:
  - "Across 16 sampled static tasks, 64 reports, and 328 criterion decisions, the original GLM-5.3-Flash judge recorded a mean reward of 98.75 with the skill and 93.83 without it, a +4.92 difference. This is a static-advice score for one retrospective configuration."
  - "The gain is concentrated in S1: six tasks improve, two decline, and eight remain at the 100-point ceiling. Removing S1 leaves a +2.42 mean difference."
  - "Figure 1's `..` parent-path counterexample shows that full rubric credit is not proof of contract correctness. Two other LLM judges also estimate positive differences, but neither provides human validation."
  - "The public artifact supports inspection and recalculation of archived focal evidence; it does not establish completed executable migrations, live repair success, or transfer across frameworks."
audience:
  - "Engineers and platform teams using agent skills for version-specific maintenance."
  - "Researchers designing coding-agent evaluations, rubrics, human review, and reproducible studies."
tags: ["Paper Reading", "AI Agent", "Evaluation", "Software Engineering", "Agent Skills"]
image: "/paperReading/75-agent-skills-version-specific-plugin-migration/title_image.webp"
field: "AI Agent"
difficulty: "intermediate"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "Evaluating Agent Skills for Version-Specific Plugin Migration: A Retrospective Study"
  authors:
    - "Beiming Liu"
    - "Haihao Li"
    - "Minjie Chen"
    - "Ning Chen"
    - "Yiran Wang"
    - "Jiming Ye"
    - "Puzhao Zhang"
    - "Tongtao Wang"
    - "Sheng Gao"
    - "William Jin"
    - "Weihao Mu"
    - "Chengzhi Liu"
    - "Yucheng Xia"
    - "Guangren Wang"
    - "Chaoyang Fan"
    - "Changfeng Huang"
    - "Xunming Lin"
    - "Yuanjie Shen"
  year: 2026
  venue: "arXiv cs.SE preprint v1, submitted 2026-09-24; peer-review status not established"
  links:
    pdf: "https://arxiv.org/pdf/2609.30120v1"
    arxiv: "https://arxiv.org/abs/2609.30120"
    code: "https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill"
series:
  id: "agent-systems"
  title: "Agent Systems and Evaluation"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Version migration advice must obey the target version's API, data ownership, safety, and lifecycle contracts. An agent can propose plausible steps while missing an exact boundary or a callable interface.
- **Core insight:** Rewarding “how much sounds right” is not a substitute for checking whether advice satisfies a contract. The authors link archived answers and criterion-level judge decisions to task contracts, bounded review, and limited executable mechanism probes.
- **Strongest evidence:** In a focal comparison of 16 static tasks, 64 reports, and 328 criterion decisions, the original GLM-5.3-Flash reward rises from 93.83 to 98.75, a +4.92 difference with a 95% task-bootstrap interval of [0.31, 10.86]. Yet six tasks improve, two decline, and eight are tied at the ceiling; S1 contributes +42.5 points, and removing it leaves +2.42 (Table 1, Figure 3, Appendix A).
- **Main boundary:** This is a retrospective comparison of development-exposed static diagnosis in one plugin framework. Reward is not migration correctness. The study does not measure whether agents edit and successfully execute complete plugin migrations, nor does it validate transfer to another framework (Sections 3, 4.1, and 7).

The paper is most useful not as proof that skills work, but as an example of bringing an average score back to concrete contracts, judge sensitivity, and the scope of the artifacts. I follow that argumentative path below, keeping the recorded result, directly inspected evidence, and engineering interpretation distinct.
This reading follows the arXiv v1 cs.SE preprint submitted on 2026-09-24; peer-review status has not been established.

## Prior approach limitation: why migration advice cannot be judged by a score alone

Software migration is more than replacing old names with new ones. A maintainer needs to know which APIs the target version exposes, which component owns producing or retaining data, how a path boundary is defined, and when a process must exit. Plugin frameworks scatter these questions across loading, authentication, events, rendering, and shutdown. Even when a model names the right version or migration card, it can recommend an unavailable API or omit the boundary condition that makes the repair fail (Introduction; Section 3.1).

An agent skill packages instructions, reference material, and sometimes tools into knowledge an agent can load. It may help the agent find version-specific facts faster; it may also add stale steps, unnecessary work, or misplaced confidence. Prior skill benchmarks already find heterogeneous benefits across tasks. This study narrows the question to a shipped dsh plugin-upgrade skill: when the skill is available, how does recorded diagnostic reward change, and does that change correspond to the target version's contract? (Sections 1–2.)

The intervention boundary matters. This comparison does not test procedure alone. The skill includes upgrade cards, version-specific facts, and a workflow; the S1 rubric explicitly rewards mapping an answer to supplied migration cards. The estimated difference therefore combines access to organized facts with the use of a procedure. There is no raw-document or generic-procedure control arm that would isolate the contribution of skill organization (Sections 3.1, 5.2, and 7).

## Core intuition: follow aggregate reward back to operational contracts

Think of an answer as a set of contract claims: an API exists, a component owns data, a path remains under an allowed root, or a timer fix obeys the host lifecycle. The rubric assigns criterion-level credit, and a deterministic scorer combines weighted decisions into a 0–100 reward. That reward is useful for comparing conditions on the same task set. It is still an aggregation of judge decisions under a particular rubric, not ground truth about software behavior (Section 4.1).

Here, “contract inspection” means returning to an observable condition on which the answer depends. Is the public API callable in the target release? Can `..` escape the root? Did a test merely get proposed, or did it actually run? Must cleanup wait for host unmount, or must the process exit while a probe is still mounted? These questions distinguish actionable advice from a high-scoring answer that has missed a requirement better than the broad question “does this sound complete?”

The study combines two levels of analysis. First, it retains all 328 original focal decisions so that the account is not built only from selected successes or failures. Second, it maps every selected rubric criterion to a contract domain, then conducts a non-blind, purposive review of a small number of answers and targeted mechanism probes. The levels answer different questions: the cohort accounting describes what the original judge scored; bounded review finds concrete counterexamples the score may have missed, but cannot estimate how often such errors occur in the full cohort (Sections 4.2, 4.4, and 6.1).

## End-to-end worked example: walk through the S11 contract counterexample

S11 is the paper's clearest worked example. The task requires a relative path to remain inside an allowed directory. The with-skill answer proposes a lexical predicate: accept the empty string, or accept a non-absolute relative path that does not begin with two dots followed by a path separator. That looks like a defense against `../` traversal, but it does not reject a path whose entire value is `..`.

1. **Input:** A system has an allowed root such as `/workspace/plugins` and must decide whether a supplied candidate path stays under that root.
2. **Intermediate representation:** The implementation computes a relative path from the root. If the candidate is the root's parent, the string is `..`; a deeper ancestor produces a form like `../` followed by another component.
3. **Decision:** The predicate rejects strings beginning with `..` plus a separator. The exact string `..` does not have that shape, so it passes.
4. **Output:** Executable probes observe the parent and ancestor escape under both Node POSIX and Windows path algorithms. Across the declared lexical cases, two of fourteen inputs fail the expected behavior and the other twelve controls behave as expected. The probe tests the predicate, not the surrounding HTTP route, native Windows filesystem, or symlink resolution.
5. **Likely failure in interpretation:** Treating full rubric credit as verified containment. The original judge gives the criterion full credit; bounded review changes it to partial and the answer score from 90 to 80. Whether this is exploitable still depends on the surrounding route, which the paper's probe does not execute (Figure 1; Sections 4.5 and 5.2).

![Original explainer: the string `..` passes a prefix-style guard while resolving to the parent of the allowed root.](/paperReading/75-agent-skills-version-specific-plugin-migration/figure-1-explainer.svg)

*Bloss0m's original Figure 1 explainer, based on the paper's Figure 1 and Sections 4.5 and 5.2. It explains the concept without copying the paper image. See the [original Figure 1 anchor](https://arxiv.org/html/2609.30120v1#S1.F1). The arXiv page identifies a perpetual non-exclusive submission license; it does not show an explicit Creative Commons reuse license for Figures 1–3, so those images are not reproduced here.*

This counterexample does not invalidate the focal mean. It qualifies confidence in the reward construct. Since 91.5% of original criterion decisions receive full credit, both high agreement and high scores can look reassuring. Yet a missed parent boundary shows why measurement validity still needs checks against the actual contract (Section 5.3).

## Method: which evidence belongs to the focal comparison?

Only the focal comparison serves as the primary estimate in this reading. The paper reviews data accumulated across different periods and separates the focal archive from historical comparisons and supplementary configurations. Those configurations differ in task pools, judges, aggregation, and artifact coverage; they cannot be pooled into a single “model capability curve” (Sections 3.2–3.3; Appendix B).

| Evidence tier | Data and role | How to read it |
| --- | --- | --- |
| Focal comparison | A seeded stratified sample of 16 from 22 static tasks; two attempts per task and arm; 64 reports and 328 original criterion decisions | Main paired reward estimate, task distribution, complete criterion accounting, bounded review, and judge sensitivity |
| Historical context | Five earlier configurations with 56, 23, 21, or 22 tasks; different scoring methods, repeat counts, and environments | Descriptive within-configuration context only; not pooled into the focal mean |
| Supplementary evidence | A newer 16-task Qwen configuration and three later GLM-5.3 rounds | Not treated as a focal replication when original answers are missing or the judge changed |

Focal S16 names the configuration; it is not task S16. The selected set contains five static-contract diagnosis tasks, seven runtime/client API tasks, three release/install tasks, and one Cordis profile task. Fourteen prompts are in English and two in Chinese. The 16 tasks come from a development-exposed pool: a seeded draw makes selection reproducible, but does not turn prior development exposure into a clean holdout. Each task's two attempts are averaged within each arm, then skill-minus-no-skill differences are averaged with equal task weights. The authors bootstrap the 16 paired tasks 10,000 times. That interval describes variability over these observed tasks under resampling assumptions; it is not uncertainty over arbitrary repositories or model versions (Section 4.1).

![Original explainer: 16 tasks are selected from 22, pass through two conditions and repeats, and form 64 reports and three analysis paths.](/paperReading/75-agent-skills-version-specific-plugin-migration/figure-2-explainer.svg)

*Bloss0m's original Figure 2 study-flow explainer, based on Figure 2 and Sections 3–4 of the paper. It shows the focal cohort without using paper-figure pixels. See the [original Figure 2 anchor](https://arxiv.org/html/2609.30120v1#S4.F2). The figure's reuse rights were not explicitly granted, so this article uses a new diagram.*

The criterion scorer gives full weight to a pass, half weight to partial credit, and zero to fail or missing, subject to any declared rubric cap. The original judge returns criterion-level verdicts and reasons for each report; a deterministic scorer then calculates total reward. A proposal can satisfy a static task by describing verification, but describing a test does not establish that it ran (Section 4.1). This is why the article retains “advice reward” and does not recast the endpoint as migration pass rate.

## Result 1: the mean rises, but change is concentrated in a few tasks

| Original GLM-5.3-Flash endpoint | No-skill mean | With-skill mean | Difference | 95% task-bootstrap interval |
| --- | ---: | ---: | ---: | ---: |
| Original judgments | 93.83 | 98.75 | +4.92 | [0.31, 10.86] |
| Replace reviewed S11 only | 93.83 | 98.44 | +4.61 | [−0.23, 10.63] |
| Replace all reviewed decisions | 93.05 | 98.44 | +5.39 | [0.00, 11.80] |

The first row of Table 1 is the original archived endpoint. The latter two replace only a small number of reviewed decisions; they are sensitivity analyses, not corrected scores from a fully validated dataset. The original difference is +4.92 points and its interval's lower endpoint is above zero, but the authors read this as a descriptive association, not causal confirmation. Figure 3 shows the task-level distribution: six tasks improve, two decline, and eight do not change. Those eight pairs score 100 in both arms, leaving no headroom. S1 alone contributes a 42.5-point increase; removing it leaves a +2.42 mean difference over the other fifteen tasks (Section 5.1; Appendix A).

![Original explainer: S1's +42.5, five smaller improvements, two −5 declines, and eight ties at the 100-point ceiling.](/paperReading/75-agent-skills-version-specific-plugin-migration/figure-3-explainer.svg)

*Bloss0m's original Figure 3 task-concentration explainer, reorganizing the task-level results in Figure 3, Table 1, and Appendix A for readers. It is not a copy of the paper figure. See the [original Figure 3 anchor](https://arxiv.org/html/2609.30120v1#S5.F3). Reuse permission for the original image was not explicit, so the article uses an original data explanation.*

The signed-rank approximation is p=0.0797, based on only eight nonzero paired differences. The authors also report an exhaustive sign-enumeration tail fraction of 20/256=0.0781. These statistics describe the observed data and its sensitivity; they do not make the study a test of a general skill effect. All sixteen leave-one-task-out means stay positive, ranging from +2.42 to +5.58. That says the direction does not flip when any one task is removed, while the size of the estimate remains highly dependent on task composition (Sections 4.5 and 5.1).

Historical comparisons are heterogeneous too. Earlier configurations show mean changes from −3.07 to +10.67 but use different task pools, repeat counts, judges, environments, timeout handling, and protocols. The paper neither sums these rows nor regresses their gains on baseline scores to produce a capability curve. A supplementary Qwen result on a newer configuration reports +6.72 with a wide interval, while the original answers and grading reasons are not archived. Three later GLM-5.3 rounds have a +1.59 median lift, but the judge changes in the third round. These results provide context, not independent replication (Appendix B).

## Result 2: full credit in a contract domain is not a safety rate

The authors retrospectively map focal rubric criteria into six primary domains: version/release applicability; API, data, and ownership; lifecycle, ordering, and deployment; safety and boundary handling; failure attribution; and evidence, verification, and provenance. Table 2 reports original full-credit counts by domain and per-arm criterion denominator. For example, version/release decisions are 8/12 versus 12/12, and API/data/ownership decisions are 35/46 versus 45/46. Both arms receive full credit in safety/boundary and failure attribution. This is finite-cohort accounting of the original judge. Each criterion receives one primary label, so the mapping is not an independently validated taxonomy and the counts are not correctness rates (Section 4.4; Table 2).

Two common misreadings follow. First, domains with different denominators cannot be treated as a ranking of difficulty or as causal mechanisms; the same task can contribute to more than one domain. Second, 10/10 full credit in safety/boundary cannot be called verified safe when S11 still contains a parent-directory escape. Cohort accounting shows the reviewer did not report only favorable or unfavorable examples, but all original judge decisions remain subject to construct validity limits (Sections 5.2 and 6.1).

S6 shows that grading errors can also favor the other arm. The no-skill answer correctly recommends removing obsolete defensive code but attributes informational-event handling entirely to the host and recommends an unqualified append route. Review changes two criteria and lowers the answer from 87.5 to 62.5. Its paired with-skill answer remains at 100 by distinguishing producer responsibilities, retention, and unavailable public surfaces. Correcting S6 increases the estimated skill difference, opposite to the reduction when S11 is corrected. The three criterion disagreements occur in two of ten purposively selected answers; this is not an error-rate estimate (Sections 4.2 and 5.2).

S18 shows that the rubric can be narrower than the task instruction. The with-skill answer proposes host teardown. The task asks for a solution to a hanging probe, while the rubric requires the timer not to keep the process alive while the host remains mounted. The authors reconstruct a minimal self-rearming timer in child processes: the referenced chain and an uninvoked cleanup callback remain alive until a watchdog stops them; explicit unmount with timer cancellation and unreferencing every timeout exit naturally; unreferencing only the first timeout is insufficient if another live handle lets the next timeout be scheduled. This is a mechanism observation, not an execution of the original plugin, and it does not show teardown can never fix a CI hang. Partial credit means the answer failed the rubric's narrower requirement, not that an alternative repair cannot work (Sections 4.5 and 5.2).

## Result 3: judge sensitivity, resource use, and Table 3

The authors re-grade all 64 reports with judges from two other model families. Each item is supplied without arm labels or prior scores, using the same prompt, rubric, and frozen excerpts. Concealment is incomplete: 18 of 32 with-skill reports mention the skill in their own text. Claude runs in sixteen isolated sessions of four items each, whereas GPT-5.5 handles all 64 sequentially in one isolated session. This is a sensitivity analysis across judge configurations, not independent human annotation (Section 4.3; Appendix C).

| Table 3 judge | No-skill → with-skill | Mean difference | 95% task-bootstrap interval | Agreement with GLM criterion decisions |
| --- | ---: | ---: | ---: | --- |
| GLM-5.3-Flash (original) | 93.83 → 98.75 | +4.92 | [0.31, 10.86] | — |
| Claude Opus 5.5 | 87.19 → 97.81 | +10.63 | [3.44, 19.14] | 91.8%, weighted κ=0.64 |
| GPT-5.5 | 93.28 → 99.38 | +6.09 | [1.56, 11.09] | 95.7%, weighted κ=0.72 |
| All-judge mean | 91.43 → 98.65 | +7.21 | [1.98, 13.46] | Not an additional judge |

Both cross-family LLM judges preserve a positive mean direction, but estimate larger gains than GLM's +4.92. Because 300 of 328 original criterion decisions receive full credit, exact agreement needs to be read alongside chance-adjusted weighted κ. Claude agrees with the original on 301/328 decisions and GPT on 314/328; the two panel judges agree with each other on 297/328, κ=0.57. All three judges are LLMs using the same rubric and prompt. High agreement neither proves rubric validity nor supplies human validation. A non-blind plugin-author review covers only 56 decisions and starts from the original judge's decisions; it is not a gold standard (Sections 5.3 and 7).

Resource accounting also needs separate interpretation. Across the 64 formal executions, recorded totals are 3,185,993 subagent_tokens without the skill and 12,320,379 with it, a ratio of 3.87. Summed task durations are 9,446 and 11,450 seconds, a ratio of 1.21. The token field does not separately define input, output, and cache accounting, so it is not billing cost. Executions overlap, so summed durations are not end-to-end wall-clock time. The study supports the claim that higher reward accompanies higher recorded token use in this configuration. It does not support a monetary cost-benefit estimate or the claim that extra tokens produced more successful repairs (Section 5.3).

## Evidence map: what the paper claims, what the evidence shows, and where it stops

| Claim | Supporting evidence | Interpretive boundary |
| --- | --- | --- |
| Original mean reward is higher when the skill is available in this focal archived configuration | Table 1, Figure 3, 16 paired tasks | Descriptive association; task concentration, ceilings, development exposure, and non-random arm order limit causal interpretation |
| A judge score can miss a concrete contract defect | S11 predicate probe, Figure 1, Sections 4.5 and 5.2 | Probe tests the predicate, not a full request route, symlinks, or a live plugin |
| Recomputed differences vary with judge configuration | Table 3: +4.92, +10.63, and +6.09 | All judges are LLMs; the shared rubric lacks independent validation, so agreement does not establish human validity or correctness |
| More skill context coincides with more recorded tokens in this setup | Section 5.3's 3.87× token ratio | The field is not billing accounting and is not a successful-migration cost measure |
| Evaluation should link reward to operational requirements | S6 API/ownership, S11 containment, and S18 liveness cases | This is a review lesson inferred from the cases, not a generally validated checklist proposed by the authors |

The authors contribute a traceable retrospective evaluation: task contracts, original answers, criteria, judge records, and resource data can be linked, and an executable check exposes a concrete counterexample. Stronger propositions are not established by these data: that skills are generally effective, that procedure alone caused the gain, that an agent correctly repairs a live repository, or that an LLM judge score has been independently confirmed by humans. Those claims extend beyond the endpoint studied here (Sections 1, 6, and 7).

## Threats, limitations, and external validity

- **Construct validity:** Static diagnostic reward is not functional repair success. Some criteria reward card mapping or metadata, and semantic and keyword grading are not the same construct. Normalizing both to 0–100 does not make them equivalent (Sections 3.3 and 7).
- **Internal validity:** This is a retrospective archive, and contributors developed the skill and tasks in an overlapping workflow. The seeded sample still comes from a development-exposed pool. The two arms were not isolated in separate containers and had different workspace paths; model identity is a recorded infrastructure label, not independent confirmation of served weights (Sections 4.1 and 7).
- **Statistical conclusion validity:** There are only 16 tasks and two attempts per arm per task; eight pairs are at the ceiling. Incident sources may overlap, although the bootstrap resamples tasks as if independent. The bounded review selected cases purposively after outcomes were known, so it cannot estimate population error. Replacements change only reviewed decisions; the unreviewed judgments remain uncertain (Sections 4.2, 4.5, and 7).
- **Judge validity:** Cross-family re-grading reduces dependence on one judge but cannot remove construct-validity problems in their shared rubric. Judge family and session structure are partly confounded, each configuration is scored once, and human follow-up was conducted by contributing plugin authors, non-blind, without an independent item-level scoring sheet (Sections 4.3 and 7).
- **External validity and reproducibility:** The main cohort concerns static reports in one plugin framework. Historical and supplementary artifact coverage differs. A future rerun also depends on live models and dependencies. The public archive supports deterministic recalculation of the focal recorded analysis; it does not guarantee reproducing the same future model outputs or establish transfer to another framework (Sections 7–8; Appendix D).

The paper's middle position is worth preserving. Its cases make some grading errors and a timer mechanism concretely inspectable, giving more explanatory evidence than an aggregate reward alone. But one selected counterexample is not a cohort error rate, and the domain table is not a census of correctness. These forms of evidence complement one another; neither should stand in for the other.

## Bloss0m engineering judgment and when not to use it

**Bloss0m engineering judgment:** Treat a version-specific skill as a traceable source of knowledge and workflow first, not as a certificate of migration correctness. If a team plans to use the skill's presence as evidence that a repair is safe, this study shows which validation layer is still missing.

For high-risk migrations, the cases suggest three review prompts:

1. **API and ownership:** Is each recommended method exposed on the target version's public surface? Which part—the host, plugin producer, or storage layer—owns producing, retaining, or writing the data? S6 shows that naming the correct version is not enough to get the data flow right.
2. **Boundary values:** In addition to a normal descendant path, test the exact parent and ancestor, prefix siblings, empty path, and platform-specific behavior. S11's defect appears only when the exact value `..` is tested.
3. **Lifecycle effect:** When an answer describes cleanup, unmount, or timer `unref`, specify whether acceptance means “matches the rubric's required strategy” or “achieves liveness in the real host.” S18 shows these are not identical claims.

These are review questions distilled from observed cases, not a universally validated framework proposed by the paper. The study's approach is useful when the task is to compare static version knowledge, inspect why a rubric gave credit, or identify a contract that needs human or executable verification. Do not use the focal reward to infer live-migration pass rates, fewer production defects, security certification, transfer across plugin platforms, or a causal improvement in repair correctness. Those outcomes would require prospective designs, raw-document and generic-procedure controls, blinded review, and executable repairs in version-pinned hosts (Sections 6.2 and 8).

> **Huahua's engineering note**
>
> Record “the agent says it will test” separately from a test that CI actually ran. Also keep criterion score, contract probe, and end-to-end repair outcome as different evidence fields; otherwise a later evaluation cannot identify which validation layer improved.

## Artifacts and reproducibility

As of 2026-09-27, the [official GitHub artifact](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill) is publicly browsable and the repository identifies an MIT license. Its public tree contains benchmark task fixtures, outputs and results for configurations, paper audit records, scripts, and generated summaries. Appendix D says the focal archive preserves selection, schedule, execution order, original reports and judgments, aggregate scores, paired analysis, and an earlier targeted review. The later review stores its frozen selection, criterion verdicts, and replacement scores separately.

The archived materials let researchers inspect task/report coverage, check report hashes, and use `paper/scripts/summarize-submission-evidence.mjs` to recalculate review sensitivities and historical resource summaries; `--check` verifies the committed generated summary. This article did not rerun the model or execute the benchmark tasks. Model/provider state can change, and the paper records identity-verification gaps, missing raw artifacts, and pending declarations. Public files permit recalculation of the focal recorded endpoint; they do not promise reproduction of the same 64 answers or execution of sixteen live migrations.

Artifact availability should be read by evidence tier. The focal archive is sufficiently populated to trace reports and original criteria. Answers and judge reasoning for the supplementary Qwen cohort are absent, preventing an exact rerun of that endpoint. Future model reproduction depends on service versions and environments. The repository's MIT license is information about the code/artifact project; it is separate from the decision not to reuse arXiv Figure 1–3 imagery. The article links to the original figure anchors but does not copy their pixels. Its three SVGs are original Bloss0m teaching diagrams, listed in the asset directory's figure inventory.

## Three takeaways to remember

1. **Name the endpoint precisely:** This focal comparison evaluates rubric-scored static advice under skill availability, not executable migration success.
2. **Inspect task distribution and measurement limits:** The original +4.92 difference coexists with S1 at +42.5 and eight pairs at the 100-point ceiling; removing S1 leaves +2.42, and S11 shows that full criterion credit can still miss a `..` escape.
3. **Treat re-grading as sensitivity, not correctness:** Two other LLM judges estimate positive gains of different sizes. A shared rubric, non-blind author review, limited token/time accounting, and one-framework scope constrain extrapolation.

## Related reading

- [Trajectory-Aware Benchmark Subset Selection (Paper Reading #67)](/en/paper-reading/67-trajectory-aware-benchmark-subset-selection/): how to interpret benchmark subset selection and task concentration.
- [Agentic Configuration Management (Paper Reading #74)](/en/paper-reading/74-agentic-configuration-management/): a complementary view of versions, runtime provenance, and agent-system governance.

## Primary sources

- Liu et al., [Evaluating Agent Skills for Version-Specific Plugin Migration: A Retrospective Study, arXiv:2609.30120v1](https://arxiv.org/html/2609.30120v1), submitted 2026-09-24. This reading relies on Figures 1–3, Tables 1–3, Sections 3–8, and Appendices A–D.
- Authors' [artifact repository](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill): benchmark, results, paper audit materials, and scripts; the repository identifies an MIT license.
