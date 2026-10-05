---
title: "EconSkills: How Web-Agent Skills Transfer and Get Retrieved"
description: "EconSkills turns successful economic-data browsing traces into parameterized SOPs with scope, verification, and recovery steps. A known match transfers; library-scale retrieval remains constrained by coverage and approximate mismatches."
pubDate: 2026-10-05
updatedDate: 2026-10-05
tldr:
  - "The paper turns 50 verified web trajectories into seven-field SOPs whose dates, regions, and indicators can be filled for a new task. It separately measures transfer with a known match and deployment when an agent must select from a library."
  - "Across 100 held-out variants and three runs per condition, a matched skill raises success from 41.0% to 49.3%; a raw trajectory reaches only 7.0%. The transferable object is the abstracted procedure, not a replay of the old interaction."
  - "Across 360 library-scale tasks, retrieving five skills (RETR5) reaches 28.3% overall, effectively tied with the 28.1% no-skill baseline. On 210 tasks without a direct match, approximate hints can offset gains on covered tasks."
  - "The public dataset contains 50 Apache-2.0 skill files. Results remain author-reported, use one model, and include only one deployment run per task; live-site drift prevents interpreting the result as a general agent guarantee."
audience:
  - "Engineers designing web-agent skill libraries, procedural memory, and retrieval flows"
  - "Researchers evaluating tool-agent transfer, web data retrieval, or skill-selection reliability"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "Research"]
image: "/paperReading/88-econskills-web-agent-skill-transfer/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - retrieval-rag
paper:
  title: "EconSkills: Studying Skill Transfer and Retrieval for Web Agents on Live Economic Data"
  authors:
    - "Yinzhu Quan"
    - "Zefang Liu"
  year: 2026
  venue: "arXiv:2609.19523 v1, submitted 2026-09-17; preprint, peer-review status not established"
  links:
    pdf: "https://arxiv.org/pdf/2609.19523v1"
    arxiv: "https://arxiv.org/abs/2609.19523"
    project: "https://huggingface.co/datasets/EconWebArena/EconSkills"
series:
  id: "agent-skill-transfer-evaluation"
  title: "Agent Skill Transfer and Evaluation"
  part: 1
  totalParts: 1
---

This reading follows the [arXiv v1 preprint](https://arxiv.org/abs/2609.19523), submitted on September 17, 2026; peer review has not been established. The authors ask a narrower question than “does saving successful agent conversations help?” When a web agent must later query the same site with a different date, country, or data series, how can it turn a verified route into a reusable procedure? And when the agent must choose a procedure from an entire skill library, how much of that transfer benefit survives? The study separates those questions using tasks on authoritative economic-data websites. Its key finding is two-sided: a known, correctly matched skill helps, but approximate hints on tasks the library does not directly cover can offset that benefit.

> **Huahua's engineering note**
>
> “There is a skill that looks relevant” does not mean it applies to the current task. A skill should state which data and sites it covers, when it can be used, how to verify the answer, and how to recover when a page changes. When its scope does not fit, withholding the hint is often safer than forcing it into the prompt.

## The paper in 90 seconds

- **Problem:** Many web-agent evaluations treat each task in isolation. After an agent discovers a working path on a site, it may start from scratch when the next task changes only the country or year. Copying the entire old trace into the prompt, however, also copies old task values and irrelevant actions.
- **Core insight:** EconSkills distills trajectories that both succeeded and passed benchmark checks into seven-field SOPs. It replaces values such as dates, countries, and indicators with placeholders while retaining preconditions, site guidance, verification, and recovery. The paper then separates transfer when the correct skill is known from performance when an agent must select from a library.
- **Strongest evidence:** On 100 held-out variants from the same site and procedural families, a matched skill raises success from 41.0% to 49.3% (300 paired seed-level outcomes; McNemar exact test, p = 0.0031); a raw trajectory reaches only 7.0%. But in 360 library-scale tasks, RETR5 scores 28.3% overall versus 28.1% for BASE. On the 210 tasks without a direct skill match, RETR5 reaches 14.3%, below BASE at 16.7%.
- **Main boundary:** Experiments use one gpt-5-mini agent, a BrowserGym/AgentLab setup, and a 30-step limit. The controlled transfer study is given the correct skill; each library-scale task-condition combination runs once. Live sites change, and reaching the right page does not guarantee selecting the correct unit, date, or series.

## Prior approach limitation: from replaying successful traces to asking what can transfer

Economic data retrieval often requires visiting central-bank, national-statistics, or international-organization sites to find a specific value. The challenge is not only navigation. Nearby data can refer to nominal versus real values, seasonally adjusted versus unadjusted series, preliminary versus revised releases, or different effective dates. If an agent finds a time series during one task, the next query on the same site may not require rediscovering the menus. But the country and date from the old trace must not be copied into the new answer.

Many one-shot evaluations discard interaction experience when a task ends. A reflective agent may keep notes, but unless it separates stable site structure from values specific to the prior task, that experience can be too vague or become a click recording that is unsafe to reuse. EconSkills represents reusable knowledge as something closer to a standard operating procedure (SOP): it preserves navigation, scope, and verification while abstracting instance-specific values into slots.

That leads to two distinct capabilities. **Matched transfer** assumes the system already knows which skill to use and tests whether the skill itself helps on a new task. **Library-scale deployment** requires the system to select context from a library and therefore combines artifact quality, retrieval, and how the agent uses the prompt. These results should not be collapsed: the first asks whether a correct procedure helps; the second is closer to what happens when a skill library is deployed.

## Core intuition: abstract task values without abstracting away data meaning

EconSkills describes each skill using seven fields: name, purpose, preconditions, ordered procedure, website guidance, verification, and recovery (Section 3.2; Table 2). To generalize a one-off query such as “get the exchange rate for one currency on a specific day,” the date and currency become `<date>` and `<currency>`. The procedure must still preserve the direction “target currency per euro,” how to set both ends of the date range to the same day, when to use a table or CSV for an exact value, and why a non-business day must not silently be replaced with the previous day.

This abstraction is not guaranteed to work. The authors first solve seed tasks by operating live sites through BrowserGym. A seed enters the library only after it passes EconWebArena’s automatic check: the answer must contain the correct value and the final page must be on the expected authoritative domain. An extractor then reads the successful trajectory, visited URLs, accessibility-tree observations, actions, and final answer, and rewrites them as a seven-field SOP. The JSON skill is rendered as Markdown and inserted into the agent’s extra-instructions channel (Sections 3.1–3.3).

Paper [Figure 1](https://arxiv.org/html/2609.19523v1#S3.F1) shows skills distilled from verified seed trajectories and supplied to an agent working on new economic-data tasks.

*Figure 1 (paper Section 3): The authors' three-stage process is task execution, skill extraction, and skill application. This reading describes the figure through its caption and source anchor rather than copying the image; the arXiv v1 page states a perpetual, non-exclusive distribution license, not an explicit figure-reuse license. Source: [arXiv v1, Figure 1](https://arxiv.org/html/2609.19523v1#S3.F1).*

### Technical mechanism: the two experiments isolate procedure and selection

The authors extract one skill from each of 50 solved seed tasks, covering 37 authoritative sites and nine of EconWebArena’s ten economic categories. Each skill comes from one seed task. Each of the 50 skill families is paired with two held-out variants, for 100 new tasks. The controlled study has three conditions: BASE receives no skill; TRAJ1 receives one raw successful trajectory with its final answer removed; MATCH1 receives an abstracted skill that directly matches the task. Every variant-condition pair is run three times (seeds 0, 1, and 2), for 100 × 3 × 3 = 900 browser-agent episodes (Sections 3.3 and 4.1).

The second experiment makes selection part of the problem. All 360 tasks run once under five conditions: BASE (no skill), ALL50 (the whole library), RETR5 (the five skills retrieved by name and purpose), RAND5 (five random skills), and HINT30 (one optional hint that the agent may ignore). HINT30 gives the corresponding family skill to 150 directly covered tasks; the other 210 still receive a top-1 retrieved skill. Thus “uncovered” does not mean “no hint.” HINT30’s uncovered result measures approximate retrieval together with whether telling the agent to ignore a mismatch is enough to curb it (Section 3.3; Appendix C).

| Evaluation level | Tasks and controls | What it answers | What it cannot answer alone |
| --- | --- | --- | --- |
| Controlled transfer with a known match | 100 held-out variants; BASE, raw TRAJ1, abstract MATCH1; three runs each | Does a known relevant procedure help more than starting over or replaying the old trace? | Can a real system choose the right skill from a large library? |
| Library-scale deployment | 360 live tasks; BASE, ALL50, RETR5, RAND5, HINT30; one run each | How do retrieval size and coverage affect end-to-end success? | How stable are results across repeated deployment runs? Each task-condition has only one run, so there are no across-seed error bars. |

## Worked example: walk the ECB exchange-rate skill through end to end

Table 2 and Appendix B.1 show an ECB reference-rate skill from the European Central Bank. Suppose a new task asks for the euro exchange rate against a specified currency on a given date. This is not a mechanical replay of the seed’s clicks. Instead, the skill’s placeholders and site semantics guide a reconstructed procedure:

1. **Input:** The task supplies a target currency and date. The skill preconditions confirm that this is an ECB euro foreign-exchange reference-rate query and that the site is reachable.
2. **Fill the slots:** Substitute `<currency>` and `<date>` into the procedure. Navigate to that currency’s EUR reference-rate page and set the start and end of the date range to the target day.
3. **Choose an exact view:** If the chart tooltip is ambiguous, switch to a table or CSV. Do not treat an estimate from a plotted trend as an exact daily value.
4. **Verify the result:** Check the source domain, page heading, currency, date, and quote direction. The ECB quotes units of the target currency for one euro, not the inverse rate. Confirm the value is a daily reference rate rather than a percentage change or index.
5. **Recover or stop:** If the page is missing, return to the ECB list or site search; if date entry fails, use the date picker. For a non-business day, do not silently substitute the previous business day.

This procedure separates stable site navigation from task values. It also preserves the distinction between “reached the page” and “obtained the right answer.” Another skill, for the USCIS fee schedule, must check the effective date, the application type, qualifiers such as per-beneficiary versus per-filing, and notes about surcharges or exemptions. Finding the right fee page can still end in the wrong row (Appendix B.2).

Possible failure points include a target date that is not a business day, a renamed menu, neighboring series with similar names, or reversing the exchange-rate direction. Verification and recovery are not decorative additions to the SOP; they help determine whether the procedure can be reused safely. By contrast, a skill that only says “click this menu, select the third row, read the number” no longer describes the same operation after a layout change.

## Result 1: matched skills transfer, but raw trajectories are poor substitutes

Across 100 held-out variants, BASE succeeds 123/300 times (41.0%), while MATCH1 succeeds 148/300 times (49.3%), an 8.3 percentage-point increase. Pairing the three seeds for the same variant and conditions, MATCH1 changes 46 BASE failures into successes, while 21 outcomes move in the opposite direction; McNemar’s exact test gives p = 0.0031 (Table 3; Appendix C). This supports a limited conclusion: for the specified model, web tasks, and known-match condition, abstract skills provide a net improvement, but not every task benefits.

TRAJ1 succeeds only 21/300 times (7.0%), despite using a successful trajectory from the same procedural family. Its average episode length is only 7.95 steps, apparently lower than BASE’s 19.83, but that short length reflects many early failures rather than efficiency. MATCH1 averages 15.67 steps. Comparing only the 102 seed-level cells in which both BASE and MATCH1 succeed, MATCH1 uses 2.37 fewer steps on average and two fewer at the median; it is shorter in 59 cells, tied in 15, and longer in 28. Excluding ties, the two-sided sign test gives p = 0.0012. This comparison includes only paired successes so that early failure is not misread as saved steps (Section 4.2.1).

The paper also summarizes results at the source-variant level instead of treating three seeds on one task as three independent task families. Among 100 pairs, the matched skill improves mean success in 27, reduces it in 12, leaves 29 with at least one success but no increase/decrease label, and both conditions fail in 32. These counts show that a positive aggregate difference is not a guarantee for every task. Whether a skill helps appears related to whether the site has a stable series page or selector path (Table 5; Section 4.2.3).

Paper [Figure 2](https://arxiv.org/html/2609.19523v1#S4.F2) presents representative live-site trajectories. A matched hint changes the ONS navigation path, but the USCIS agent reaches the relevant area without returning a verified answer.

*Figure 2 (paper Section 4.2.3): On the ONS task, the hint moves the agent from a broad download interface to the MM23 time-series page. On the USCIS task, the agent reaches the I-140 fee section but does not return a checked value within 30 steps. The images include third-party website interfaces, so this article links to the originals without copying them. Source: [arXiv v1, Figure 2](https://arxiv.org/html/2609.19523v1#S4.F2).*

## Result 2: one relevant hint does not mean the library works overall

The 360-task deployment study separates covered from uncovered tasks (Table 4). BASE succeeds on 101/360 tasks (28.1%); RETR5 succeeds on 102/360 (28.3%), statistically tied with BASE (McNemar p = 1.0). Restricting the comparison to the 150 tasks with a directly corresponding skill, RETR5 reaches 72/150 (48.0%) versus BASE at 66/150 (44.0%). On the other 210 tasks, RETR5 reaches 30/210 (14.3%), below BASE at 35/210 (16.7%). The five retrieved skills do not produce an overall gain on tasks the library does not directly cover.

ALL50 is a clearer counterexample: placing all 50 skills in the prompt results in 41 successes out of 360 (11.4%), well below BASE’s 28.1%. RAND5 reaches 24.4%, and HINT30 reaches 25.8%. These comparisons suggest that the number and relevance of supplied skills matter. They do not establish that token length alone causes the interference: the discussion does not separately identify prompt length, conflicting instructions, and relevance judgments (Section 4.4).

On its 150 covered tasks, HINT30 reaches 46.0% versus 44.0% for BASE, a non-significant difference (p = 0.711); the two conditions also solve the same 45 of 100 held-out variants. But on the 210 tasks without a direct match, HINT30 tells the agent that the skill may be outdated or mismatched and can be ignored, yet reaches only 24/210 (11.4%) against BASE’s 35/210 (16.7%), with p = 0.043. Across all tasks HINT30 reaches 25.8% versus 28.1% for BASE, p = 0.341 (Tables 4 and 6; Section 4.3). The authors identify coverage-aware filtering as a design target. That proposal is motivated by these observations; it does not mean the study validated a retriever that abstains correctly.

### Two comparisons that are easy to conflate

First, controlled MATCH1 and deployment HINT30 are different experiments. MATCH1 runs three times under three conditions and directly supplies the known-correct skill. HINT30 runs once in a deployment setting, supplies the exact family skill to covered tasks, and gives uncovered tasks an approximate top-1 hint with permission to ignore it. Prompt framing, task composition, and repetition differ. HINT30’s flat result on the held-out variants does not refute MATCH1’s controlled transfer result, and MATCH1’s gains do not establish that the retrieval system works end to end.

Second, the 360-task deployment experiment has no across-seed variance estimate. It compares BASE and other conditions on the same task and supports paired task-level analysis, but each condition has only one run per task. It cannot show how stable those results would be across repeated runs. The reported p-values use paired task outcomes; the absence of error bars does not make the result precise enough to generalize directly to another model or a new set of live sites.

## Failure patterns: site navigation and economic semantics are separate gates

Appendix D makes the aggregate outcomes concrete. On UK ONS Task 225, BASE uses all 30 steps at a general download page without finishing. HINT30 routes the agent to the dedicated MM23 time-series page, where it succeeds in 14 steps (Figure 3). On U.S. Treasury Task 274, BASE spends its budget in site search and ends at a dead link. The matched hint supplies the daily par-yield route and a recovery path, letting the agent reach the historical table and succeed in 15 steps (Figure 5). These cases illustrate how procedural guidance can save repeated route-finding.

USCIS Task 264 shows the boundary. BASE reaches the I-140 fee table and succeeds in nine steps; the hinted agent reaches the relevant fee section but does not return a checked value within 30 steps (Figure 4). This is not a simple story in which skills always win. It separates finding the relevant content from selecting the exact row and verifying the answer. Figure 6 compares BASE and RETR5 endpoints on ONS, USCIS, and SBA tasks: RETR5 turns the ONS endpoint from unresolved into a five-step success and cuts the SBA path from 12 to three steps, while USCIS still exposes extraction difficulty.

The authors’ trajectory analysis identifies two further reuse boundaries. A redesigned page, dynamic selector, or download control can invalidate a route. Even after reaching relevant content, the agent can choose the wrong unit, date, series, adjustment, or filing category. In some traces, an approximate skill even keeps the agent on the wrong page after progress has stalled. These are qualitative observations from preserved trajectories, not measured rates of website redesign or agent error (Sections 4.2.3 and 4.3; Appendix D).

## Evidence map: author claims, what the experiments show, and what remains unknown

| Evidence layer | What can be said | Anchors and boundary |
| --- | --- | --- |
| **Authors’ claim** | Experience can be turned into skills with scope, preconditions, steps, verification, and recovery; a known matched skill can transfer across tasks. | Sections 3–4; tested on one benchmark, one agent backbone, and 50 skills. |
| **Direct measurements** | MATCH1 raises success by 8.3 percentage points on controlled held-out variants; RETR5 leads only on the directly covered subset and ties BASE overall. | Table 3’s 300 paired outcomes and Table 4’s coverage split; the two experiments are not interchangeable. |
| **Diagnostic evidence** | ALL50 underperforms; approximate hints are weaker on uncovered tasks; live-site examples show navigation gains and semantic extraction failures. | Table 4, Table 6, Figures 2–6, and Appendix D; qualitative cases do not estimate prevalence. |
| **Not established** | The result has not been shown to transfer across models, extractors, broader domains, repeated deployment runs, or long-term website changes. Nor has an abstention mechanism been shown to solve mismatches. | Section 7; readable public skill files are not an independent rerun of every experiment. |
| **Bloss0m engineering interpretation** | Evaluate skill libraries by coverage, match quality, mismatch rejection, and answer verification; an aggregate average cannot replace coverage-stratified results. | An engineering synthesis based on Tables 4 and 6 and Section 4.4, not a production architecture tested by the authors. |

## Limitations and conclusions that should not be generalized

The paper states several limits to external validity (Section 7). First, all agent experiments use one gpt-5-mini backbone, one BrowserGym/AgentLab environment, and a fixed 30-step budget. Within each study, the model, browser observations, action set, and prompt channel are held fixed. This supports comparisons between conditions but does not test whether another backbone benefits in the same way. Second, all 50 skills come from verified seed trajectories under one extraction schema. Results may change with the seed task mix, extractor, library size, or site types.

Third, the study covers live economic-data tasks from EconWebArena. Across 360 tasks and 37 source sites, the benchmark includes nine categories such as government, banking, labor, energy, education, and health. It is still not a representative sample of general web work, e-commerce, authenticated workspaces, or enterprise intranets. The paper cannot establish whether skills transfer across different sites, domains, or languages.

Fourth, website drift is part of the task’s environment. The authors handle four benchmark values that had changed at their authoritative sources with a fixed correction table built without reference to condition outcomes (Section 4.1; Appendix A). This is a reasonable way to avoid grading against stale gold values, but live sites and versioned benchmarks still require synchronization. A procedure that worked at one point in time is not guaranteed to keep working. Preconditions, verification, and recovery must be maintained or a once-useful skill may become misleading.

Fifth, controlled MATCH1 assumes the correct skill is known. That helps isolate procedure quality but bypasses the hardest retrieval decision. RETR5 and HINT30 restore selection to the problem, but run each task only once. Sixth, TRAJ1’s low score supports avoiding direct replay in this particular experiment; it does not establish that every demonstration is ineffective. Seventh, ALL50’s lower score is consistent with context interference, but the study does not independently manipulate prompt length, conflicting instructions, and semantic relevance. Token count should not be presented as the sole cause (Section 4.4).

Finally, the main evidence consists of success rates, action counts, paired tests, and selected browser trajectories. The paper does not measure the maintenance labor of a skill library, long-term operating cost, whether economic analysts complete work faster, or the consequences of an incorrect value on a business decision. Reaching an official page is not the same as interpreting the data correctly, and neither is proof that a downstream decision is correct. Human-factors, operational, and longitudinal studies are still needed.

## Artifacts and reproducibility

As of October 5, 2026, the authors’ [EconSkills Hugging Face dataset](https://huggingface.co/datasets/EconWebArena/EconSkills) is publicly readable. Its dataset viewer lists 50 JSON skills, and the page labels the dataset Apache-2.0, allowing readers to inspect the seven-field procedures. The authors also describe rerunning EconWebArena with [BrowserGym](https://github.com/ServiceNow/BrowserGym) and [AgentLab](https://github.com/ServiceNow/AgentLab), both of which are public upstream projects. An accessible skill dataset is not the same as an independently verified package containing the complete experiment pipeline, every condition, and a frozen copy of the evaluated data.

Appendix A provides configuration and reproduction steps, including how changed benchmark values were handled. Running the live benchmark still requires currently available websites, a Python/browser environment, a model endpoint, and API access. The paper uses gpt-5-mini; readers should not assume its model calls are free or reproducible without credentials. Because websites continue to change, a later rerun may not match the original snapshot. This article did not independently rerun the experiments; all numbers are author-reported. Reproducibility here means the skill files and rerun guidance can be inspected, not that Bloss0m reproduced all 900 controlled episodes and the 360-task deployment study.

The paper figures include website-interface screenshots. The arXiv v1 page grants perpetual, non-exclusive distribution but does not state an explicit figure-reuse license; the screenshots also show third-party websites. This article therefore does not copy the figures and instead cites the figure numbers, paper sections, and relevant evidence in context. The Evidence Atlas cover above is an original conceptual drawing of the covered-versus-uncovered evidence paths; it does not represent measured values or reproduce a paper figure.

## Bloss0m engineering judgment: a skill library also needs an “out of scope” path

The following is **Bloss0m engineering interpretation**, not an architecture deployed or experimentally validated by the EconSkills paper. For a team adding procedural memory to a web agent, I would make these checks part of skill selection and execution:

1. **Check scope first.** Each skill should declare its authoritative domain, data type, series, interaction pattern, and required task fields. Sharing a URL does not mean two queries have the same data semantics.
2. **Do not inject a weak match.** Record coverage or retrieval confidence and provide an explicit abstention path. The paper does not test an operational rejection threshold; do not assume the agent will ignore a hint just because the instruction says it may.
3. **Make verification part of success.** Check the domain, entity, period, unit, series definition, and adjustment or revision state, especially when authoritative data portals place similar measures next to each other.
4. **Keep recovery and freshness visible.** If a page or field is missing or a value violates expectations, try site search, an alternate table, or stop for human review. Record where the procedure came from and when it was last checked.
5. **Evaluate by coverage slice.** Report directly matched tasks, approximate-only matches, and no-skill tasks separately, along with outcomes, tool steps, failure type, and variation across seeds. An aggregate can hide gains on covered tasks and regressions elsewhere.

Do not apply EconSkills SOPs directly to authenticated workflows, transactions with side effects, personal data, or high-stakes decisions without separate authorization, audit, human-approval, and recovery design. The paper evaluates browser tasks that read public economic data; it does not evaluate payments, filings, record updates, or formal decision workflows.

## Three things to remember

1. **A skill is an abstracted procedure, not a replay of an old trace.** Replace dates, countries, and indicators with slots, but retain data meaning, preconditions, verification, and recovery.
2. **Transfer and retrieval are different problems.** MATCH1 improves success when the correct skill is known; RETR5 ties BASE overall across 360 tasks and performs worse on tasks without direct coverage.
3. **Reaching a page does not prove that the evidence is right.** Recheck units, periods, series, vintages, and sources; a useful skill needs a way to recognize a mismatch and exit.

## Primary sources

- Quan, Y. and Liu, Z. (2026). [EconSkills: Studying Skill Transfer and Retrieval for Web Agents on Live Economic Data](https://arxiv.org/abs/2609.19523), arXiv:2609.19523v1. Main anchors: Sections 3–4.4 and 7; Tables 1–6; Figures 1–6; Appendices A–D.
- Authors’ [EconSkills skill dataset](https://huggingface.co/datasets/EconWebArena/EconSkills) and related [EconWebArena benchmark](https://huggingface.co/datasets/EconWebArena/EconWebArena).
- [BrowserGym](https://github.com/ServiceNow/BrowserGym) and [AgentLab](https://github.com/ServiceNow/AgentLab), the browser-agent ecosystem cited for the evaluation setup.

<!-- paper-reading-no-body-figures: The paper's figures include third-party live-site screenshots, and arXiv v1 does not state an explicit figure reuse license; the article cites and interprets the material figure evidence instead of copying images. -->
