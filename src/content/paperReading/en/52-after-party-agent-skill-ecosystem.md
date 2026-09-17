---
title: "After the Party: Governing What a Viral Agent-Skill Ecosystem Left Behind"
description: "A deep reading of After the Party’s OpenClaw and ClawHub ecosystem study: 91 days of explosive growth, download concentration, the reviewability gap, privilege evidence, scanner disagreement, and the governance method that can transfer without pretending the rates do."
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "The study separates an OpenClaw and ClawHub ecosystem into four questions: growth, observable governance signals, privilege evidence, and security-scanner behavior. Rapid growth is not treated as proof of insecurity."
  - "Across 91.11 days, the reconstructed skill stock grew from 33,399 to 65,175. Downloads were concentrated: the top 10% received 46.93%, but popularity was never treated as authorization."
  - "A total of 77.86% of skills had no stars or comments. Among 64,324 evaluable items, 85.06% showed at least one privilege signal, while three scanners disagreed substantially."
  - "The transferable engineering lesson is layered governance across provenance and versions, artifact review, host policy, and runtime telemetry. The Zenodo DOI was unreachable as of 2026-09-17."
audience:
  - "Engineers responsible for agent-skill registries, tool supply chains, permission governance, or AI platform risk"
  - "Research and platform teams that need to connect downloads, review, scanners, and runtime policy into a traceable control plane"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Agent Evaluation", "Governance", "Tool Use"]
image: "/paperReading/52-after-party-agent-skill-ecosystem/title_image.webp"
field: "AI Safety"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
  - tool-use-coding-agents
paper:
  title: "After the Party: Governing What a Viral Agent-Skill Ecosystem Left Behind"
  authors:
    - "Yunpeng Xiong"
    - "Ting Zhang"
  year: 2026
  venue: "arXiv 2609.17274 v1（2026-09-15；APSEC 2026 accepted version，尚未 camera-ready）"
  links:
    pdf: "https://arxiv.org/pdf/2609.17274v1"
    arxiv: "https://arxiv.org/abs/2609.17274"
    doi: "https://doi.org/10.48550/arXiv.2609.17274"
    project: "https://arxiv.org/html/2609.17274v1"
series:
  id: "agent-skill-ecosystem-governance"
  title: "Agent Skill 生態治理"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Research problem:** When an agent-skill registry expands rapidly, which signals can still support governance decisions across downloads, stars, versions, comments, declared capabilities, and executable privileges? The authors study OpenClaw and ClawHub through growth, association portability, reviewability, and scanner agreement.
- **Core insight:** A skill does not live only in its text. The same SKILL.md or package can expose a different privilege surface under a different host, tool visibility, execution context, and policy. Registry metadata therefore cannot collapse popularity, reviewability, static evidence, and runtime behavior into one trust score.
- **Strongest evidence:** RQ1 reconstructs stock growth from 33,399 to 65,175 over 91.11 days; the top 10% receive 46.93% of downloads and the Gini coefficient is 0.528. RQ3 finds at least one privilege signal in 85.06% of evaluable skills. RQ4 shows only 446 items flagged by all three scanners; on the small adjudicated reference set, the LLM scanner has 61.06% sensitivity versus 21.67% for the static scanner.
- **Main boundary:** This is not an insecurity prevalence estimate for every registry, nor a general scanner benchmark. It is one ecosystem, a set of snapshots, partially reconstructed history, withdrawn data, missing fields, and no perfect ground truth.

My bounded verdict is: **the most useful contribution is not a scanner ranking. It is the separation between discovering something and authorizing it to execute.** Popularity can guide discovery but cannot authorize an action; metadata can expose an unknown state but cannot vouch for runtime policy; a scanner flag can route review but cannot alone declare an artifact malicious.

> **Huahua's engineering note**
>
> Treat a skill registry as a supply-chain entrance, not an app store. Every installation should be able to answer provenance, version, publisher, capability, review state, host policy, runtime telemetry, and revocation conditions. If one is missing, preserve unknown instead of silently filling in safe.

## Version, sources, and the reader question

This article reads [After the Party: Governing What a Viral Agent-Skill Ecosystem Left Behind](https://arxiv.org/abs/2609.17274) v1, submitted to arXiv on 2026-09-15 by Yunpeng Xiong and Ting Zhang; the record identifies it as an APSEC 2026 accepted version. The arXiv record also has a v2 revised on 2026-09-16 with a broader title, “Growth, Governance, and Security Scanning in the OpenClaw Agent Skill Ecosystem.” To follow the Paper Radar brief’s sourceVersion, I checked the [v1 full HTML](https://arxiv.org/html/2609.17274v1), [v1 PDF](https://arxiv.org/pdf/2609.17274v1), every figure, table, appendix, limitation, and data-availability statement. The numbers below do not mix in v2 language.

The reader question is: **When a registry becomes a high-traffic supply chain, which observable signals belong in a governance contract, and which are only discovery hints?** This fits after [why Tool Calls can break workflows](/en/paper-reading/49-tool-calls-workflows-fail/), [Continuity Security’s context contract](/en/paper-reading/45-continuity-security-context-contracts/), and [Plan Injection’s observer blind spot](/en/paper-reading/51-plan-injection-cot-monitoring/): it brings context, tool boundaries, and supply-chain provenance into one governance question without pretending they are one metric.

## Evidence map: Paper, Evidence, and Bloss0m judgment

| Layer | What this reading says |
| --- | --- |
| **Directly supported by the Paper** | Three snapshots; OpenClaw Git history and GitHub issues／PRs; stock growth from 33,399 to 65,175; download concentration; RQ2 cohort／age associations; RQ3 privilege dimensions; and RQ4 scanner coverage, overlap, reference sampling, and bootstrap intervals. |
| **Author claims** | Hypergrowth increases governance burden without proving insecurity; feedback scarcity and privilege visibility form a reviewability gap; scanner disagreement calls for layered governance rather than one gate. |
| **Not yet established by the authors** | Which skills caused real runtime harm; the true maliciousness rate of popular skills; scanner transfer to another registry or host; or any scanner’s ability to replace human adjudication. |
| **Bloss0m engineering judgment** | Separate registry trust into discovery, provenance, artifact review, host policy, and runtime telemetry states. Store unknown, withdrawn, not evaluated, flagged for review, and allowed as different values. |

### Paper Essence Contract

1. **What problem does it solve?** It uses observable OpenClaw and ClawHub data to ask what a viral skill ecosystem leaves behind in growth, reviewability, privilege evidence, and scanner coverage.
2. **Why are previous approaches insufficient?** Downloads and stars are skewed attention signals whose associations shift by cohort; a SKILL.md declaration cannot describe host policy or runtime effect; and scanner output has no natural perfect ground truth.
3. **What is the core technical idea?** Build a multi-snapshot corpus around stable skill IDs, measure growth, cohort and age portability, observable feedback, and privilege features, then normalize scanner statuses and calibrate them with a small adjudicated reference set.
4. **How does one item move through the method?** Registry crawl → stable ID and version／download／feedback normalization → Git and issue／PR context → privilege regex evidence plus unknown state → three scanner statuses → coverage and overlap → stratified sample and two-annotator adjudication → bounded interpretation.
5. **What evidence supports the headline claim?** Figure 2’s growth, stock, and download concentration; the RQ2 association table in Section 4.2; Figure 4’s accountability and privilege evidence; Figure 5’s scanner overlap; and Tables 3–5 together, rather than one isolated number.
6. **Where does the claim stop?** The paper measures a public artifact surface and defined static evidence, not complete execution behavior. The measurement protocol can transfer more plausibly than the reported rates.

## Core intuition: a skill has three layers, not one block of text

The paper’s most important conceptual move is a three-layer decomposition. The first is **declared artifact content**: README, SKILL.md, scripts, package files, and metadata. The second is **host policy and tool visibility**: which tools, shell, network, filesystem, credentials, approvals, and sandbox controls the agent runtime exposes. The third is **actual invocation and runtime effects**: what the skill really called, which bytes went where, which side effects were created, and whether they were logged or rolled back.

The layers cannot substitute for one another. Skill A and Skill B can contain similar instructions while A runs in a read-only sandbox and B runs on a host with shell, network, and cloud credentials. Conversely, an artifact containing a network script does not prove that every host will execute it. Static evidence is a capability signal, not a runtime observation. This is why the paper preserves present, absent, and unknown: a missing SKILL.md, invalid UTF-8 file, malformed frontmatter, or withdrawn source does not justify treating “not seen” as “does not exist.”

The authors therefore avoid a single trust score. RQ2 measures popularity, stars, versions, files, scripts, and age; RQ3 measures twelve privilege dimensions; RQ4 separately analyzes LLM, static, and VirusTotal status. That separation matters operationally because each signal has a different owner, refresh schedule, false-positive profile, remediation path, and revocation semantics.

## Worked example: seeing the governance gap in one installation request

The following is a composite walkthrough faithful to the paper’s three-layer model. It is not one row from the dataset and does not claim that the paper ran a runtime experiment on this particular skill. Suppose a team wants to install a skill that “organizes an incident timeline”:

1. **Discovery:** The registry shows many downloads and several versions, but stars and comments are empty. This says the item was noticed, not that it was reviewed.
2. **Provenance:** The platform pins publisher, stable skill ID, latest version, content hash, source, and crawl time. If latestVersion is absent, it records unknown instead of using an old version as a proxy for the latest one.
3. **Artifact review:** The platform parses SKILL.md, scripts, file count, network access, shell invocation, destructive commands, and secret references. Static results indicate possible privileges; they do not claim an effect occurred.
4. **Host policy:** A staging host permits read-only retrieval while a production host also exposes a ticket API, shell, and outbound network. The allow decision must differ by host, and write authority cannot be derived from popularity.
5. **Runtime telemetry:** After invocation, the agent records tool name, input hash, credential scope, destination, effect result, and policy decision. If it sees a tool response but cannot confirm an external side effect, the result remains unknown.
6. **Scanner triage:** LLM, static, and VirusTotal flags are stored separately. Any flag routes to review; the absence of a flag cannot be treated as clean when coverage is missing.
7. **Revocation:** If publisher, version, hash, host policy, or runtime incident is revoked, installed copies must be discoverable, isolated, and rollback-capable. Removing a listing from the registry does not prove that every cache disappeared.

The example exposes the gap between popular and executable: downloads are a discovery signal, content review is artifact evidence, host policy is execution authorization, and runtime telemetry is the closest layer to effect observation. The paper supports this separation; it does not require a particular product to implement these seven steps.

## Method: three snapshots and four research questions

### Data and study boundary

The authors build a corpus from the OpenClaw Git head, GitHub issues and pull requests, and the ClawHub registry. The Git head has 68,858 commits as of 2026-07-15. The GitHub issue／PR number range is about 96,000; the authors obtain 94,248 records, with 1,752 inaccessible. The main June registry crawl is 65,175 skills on 2026-06-22, with a 2026-07-14 crawl of 68,096 used as context. RQ1 reconstructs an earlier stock at 2026-03-20; the main study window runs from 2026-03-20 to 2026-06-19, with the final portion right-censored.

The unit is a stable skill ID, not each listing event. The authors normalize downloaded count, stars, comments, latest version, versions, file count, scripts, and age, while retaining missingness for analysis. The benchmark is not downstream QA. The dataset is the public registry, Git history, and issue corpus; metrics include stock, downloads, Gini, Spearman, odds ratios, rank-biserial effect, coverage, precision, sensitivity, specificity, and 95% bootstrap intervals. Compute and annotator context are described in the method and threats; this should not be read as a large production test.

### RQ1: how did the ecosystem grow, and how concentrated was attention?

![Figure 2: OpenClaw and ClawHub growth, stock, and download concentration](/paperReading/52-after-party-agent-skill-ecosystem/paper/figure-2-ecosystem.svg)

*Figure 2 (original paper Section 4.1, RQ1): the authors place commit, issue／PR activity, skill stock, and downloads in one growth view. The important pattern is that stock growth and attention concentration occur together. See the [original figure and caption](https://arxiv.org/html/2609.17274v1#S4.F2). License status: the paper page marks the work CC BY 4.0; this article uses the original figure without altering its content.*

Figure 2 corresponds to “fast growth, not uniform growth.” Daily commits rise from about 2,151 in December to a peak of 16,832 in March and fall to 7,124 in June. Issues and PRs peak in March at 11,211 and 16,859. The reconstructed stock grows from 33,399 to 65,175 over 91.11 days, an increase of 95.14%; March and April contribute 41,223 additions, or 63.25% of the study-window accumulation. This describes an activity burst and stock growth, not low quality for every new artifact.

Downloads are more skewed: total downloads are 62,342,228, the median is 515, the top 1% receives 21.36%, the top 10% receives 46.93%, the bottom half receives 18.79%, and the Gini coefficient is 0.528. For registry UX, the implication is that a small set of artifacts becomes the entry point for most users. Visibility amplifies review burden: if a highly downloaded skill lacks provenance, version pinning, or capability metadata, the impact is not confined to one repository.

### RQ2: do associations transfer across cohort and age?

RQ2 does not read high downloads as high quality. The authors compute seven signals on the June full cohort of 65,175 skills: log downloads, stars present, multiple versions, version depth, file count, scripts present, and script count. They compare it with a 31,031-skill pre-cutoff cohort and with cohort／age-adjusted models. June visibility is about 63,574／65,175, or 97.54%; pre-cutoff visibility is 30,566／31,031, or 98.50%. Missingness is not the majority, but 321 missing latestVersion values can still be outcome-differential.

![Figure 3: direction and transportability of baseline associations across three cohorts](/paperReading/52-after-party-agent-skill-ecosystem/paper/figure-3-transportability.svg)

*Figure 3 (original paper Section 4.2, RQ2): the March discovery, June full, and pre-cutoff cohorts are compared in one view. Notice that effect direction, magnitude, and age-adjusted odds ratios are not stable. See the [original figure and caption](https://arxiv.org/html/2609.17274v1#S4.F3). License status: the paper page marks the work CC BY 4.0; this article uses the original figure without altering its content.*

Six of seven signs recur in the full cohort, but only three are significant. The download association ranges from roughly −0.19 to +0.20, while rank correlation is about −0.61, showing unstable ordering. After age standardization, only has-scripts remains positive at an odds ratio of about 1.14 (95% CI 1.08–1.20), while downloads are about 0.81 (0.76–0.87). In the pre-cutoff cohort, all seven signs are negative; downloads are about 0.47 and stars about 0.72. None of the seven signals survives as 7／7 in that cut.

The engineering lesson is not to pick a better popularity feature. It is to acknowledge transportability failure. Skill age, listing policy, registry features, withdrawn data, and user behavior can change the association. If one snapshot’s correlation becomes an admission rule, the next cohort may produce the opposite decision.

### RQ3: do accountability and privilege evidence coexist?

![Figure 4: the observable gap between accountability signals and privilege evidence](/paperReading/52-after-party-agent-skill-ecosystem/paper/figure-4-reviewability-gap.svg)

*Figure 4 (original paper Section 4.3, RQ3): the left side presents accountability evidence such as owner, auto status, and versions; the right side compares twelve privilege dimensions. The point is that metadata visibility and capability evidence are not complete review. See the [original figure and caption](https://arxiv.org/html/2609.17274v1#S4.F4). License status: the paper page marks the work CC BY 4.0; this article uses the original figure without altering its content.*

The June snapshot has 65,175 skills, of which 64,324 are evaluable; 851 are excluded because every field is unknown. Owner evidence is about 99.82%, auto status 99.51%, multiple versions 41.32%, moderation 35.19%, and comments only 1.72%. The strongest reviewability result is that 77.86% have no stars or comments. In 97.79% of governance states, user feedback does not form a visible record; only 1.71% are classified as complete records.

Privilege evidence is encoded as present, absent, or unknown rather than as an author-declared YAML key. Regex extraction finds evidence in 153,536／153,986 present results. At least one privilege signal appears in 85.06% of evaluable skills; at least four appear in 25.25%; the mean is 2.39 and the median is 2. Shell is about 58.08%, network about 57.06%, and destructive about 1.61%. These are static artifact-surface signals, not runtime invocation rates.

The cross-tab makes the reviewability gap visible: among evaluable items with zero feedback, 42,160 have privilege evidence, or 84.34%. Skills with a commenter average 2.92 privilege dimensions; the zero-feedback group averages 2.32. The share with at least four dimensions is 36.46% versus 23.46%. This does not mean comments make a skill safe. It means review input and capability evidence do not cover the ecosystem evenly.

### RQ4: are the three scanners seeing the same world?

![Figure 5: overlap and disagreement among LLM, static, and VirusTotal scanner flags](/paperReading/52-after-party-agent-skill-ecosystem/paper/figure-5-scanner-overlap.svg)

*Figure 5 (original paper Section 4.4, RQ4): coverage, common flags, and scanner-specific flags make the distance between “no common warning” and “proven clean” visible. See the [original figure and caption](https://arxiv.org/html/2609.17274v1#S4.F5). License status: the paper page marks the work CC BY 4.0; this article uses the original figure without altering its content.*

The authors normalize scanner status before analyzing coverage. LLM, static, and VirusTotal cover about 99.42%, 97.80%, and 97.19%; all three have usable results for 61,990 items, or 95.11%, while 3,185 are missing or indeterminate. At least one scanner flags 24,148; all three flag only 446; LLM-only flags number 15,874. This is not simply a tool contest. It shows that visibility, rule vocabulary, and decision unit differ.

From an eligible pool of 276 items, the authors draw a stratified sample with seed 42: 180 items, including 80 flagged and 100 clean. Two annotators with seven and five years of experience adjudicate 69 flags and 111 do_not_flag labels. The reference label is broader than maliciousness: it includes suspicious evidence, privilege, prompt injection, or a need for review. Precision therefore must not be called a maliciousness accuracy rate.

On this small reference set, with bootstrap intervals as the boundary, LLM sensitivity is 61.06%, specificity 81.28%, and precision 67.40%; static sensitivity is 21.67%, specificity 95.38%, and precision 74.84%; VirusTotal sensitivity is 25.11%, specificity 84.54%, and precision 50.74%. These numbers support different coverage and error profiles. They do not support replacing human review in production, and the paper does not claim a statistical precision ranking between LLM and static.

## Interpreting the evidence: numbers, missingness, and uncertainty

### Comparability is not automatic

RQ2’s cohort, age, missingness, and multiple-testing correction must be read together. Selecting only full-June positive associations would hide the pre-cutoff result where all seven were negative. Dropping missing latestVersion items would hide outcome-differential missingness. Mann–Whitney, rank-biserial effect, Spearman, and odds ratios express different relationship types; none is a substitute for the whole analysis.

RQ3’s privilege features must also be read with parser quality. Missing SKILL.md, invalid encoding, and malformed frontmatter become unknown. Absent means that the detector did not find evidence in a parseable artifact surface. Thus 85.06% should be read as “the evaluable share with at least one static privilege signal,” not as a runtime risk rate.

RQ4’s reference sample is small, and its labels are not malware ground truth. Most raw flags are suspicious rather than malicious: LLM has about 22,862 suspicious versus 1 malicious, while VirusTotal has about 4,643 suspicious versus 210 malicious. Scanner overlap is triage evidence, not severity truth.

### Failure modes, cost, and transfer

The paper’s failure modes are operationally useful:

- **Snapshot drift:** registry policy, host features, withdrawn items, and downloads change; an old correlation cannot become a new gate unchanged.
- **Cohort confounding:** early items have more age and later items encounter different discovery policies; age adjustment cannot guarantee that every confounder is removed.
- **Schema missingness:** missing latestVersion, SKILL.md, frontmatter, or Git source changes the denominator.
- **Static/runtime gap:** shell, network, and destructive evidence are possible capabilities, not observed effects.
- **Scanner-label gap:** there is no perfect ground truth; the reference label is broader than maliciousness, so precision and sensitivity apply only to this sampling and label contract.
- **Review cost:** manually reviewing 65,175 items is unrealistic, but “automatically scanned” does not mean the review queue is solved. Flags, unknowns, and high-impact exposure need different priorities.
- **Transfer failure:** the authors explicitly warn against copying rates to another registry. The measurement protocol, field semantics, and audit trail are more transferable than 85.06%, 61.06%, or 0.528.

## Artifact status and reproducibility

The paper’s data-availability statement points to [Zenodo DOI 10.5281/zenodo.21469516](https://doi.org/10.5281/zenodo.21469516). I independently checked the DOI redirect and Zenodo record API on 2026-09-17: the DOI endpoint returned 404, and the Zenodo API reported that the persistent identifier was not registered. Therefore this article does not call it a currently downloadable replication package. The precise status is: **the paper claims data availability, but the named endpoint was unreachable on the check date.**

The [OpenClaw repository](https://github.com/openclaw/openclaw) and [ClawHub repository](https://github.com/openclaw/clawhub) are reachable at their GitHub endpoints, but that only establishes that the current repositories exist. It does not guarantee that the historical crawl, withdrawn items, registry dump, issue-access snapshot, or derived tables can be rebuilt today. A rerun would need fixed commits and crawl dates, stable-ID mapping, missing-data rules, regex version, scanner versions, sample seed, annotator rubric, and adjudication labels.

## Bloss0m engineering synthesis: write registry trust as five states

This section is a Bloss0m engineering judgment, not a product specification proposed by the paper. It translates the paper’s evidence layers into a record contract that can be implemented:

| Control plane | Fields to retain | Question it can answer | Claim it must not make |
| --- | --- | --- | --- |
| Discovery | download snapshot, stars, comments, ranking, age | What do users usually encounter? | Popular means safe |
| Provenance | publisher, stable ID, version, content hash, source, withdrawn time | Where did this artifact come from, and can we trace it? | A source exists, so it is trusted |
| Artifact review | parsed files, scripts, network／shell／destructive evidence, unknown reason, scanner flags | Which possible capabilities are visible statically? | Evidence equals runtime effect |
| Host policy | tool visibility, filesystem scope, credential scope, network egress, approval, sandbox | What is allowed on this host? | Artifact metadata can override host policy |
| Runtime telemetry | invocation, input／output hash, destination, policy decision, effect outcome, rollback／revocation | What actually happened, and can we replay the trail? | An unobserved effect did not happen |

Each control plane should have its own state machine, such as discovered → provenance_verified → artifact_review_required → host_allowed → runtime_observed. Missing data should stop at unknown or review_required. The cost is more fields, queues, and operator workflow. The benefit is that an incident can answer which control plane made the wrong decision instead of hiding responsibility inside one trust score.

### When should this not be used directly?

For a purely read-only system with no external side effects and no third-party skill installation, a full registry governance stack may cost more than the risk. Start with simplified provenance and permission boundaries. Conversely, a skill that reads credentials, writes production, changes policy, sends messages, or runs arbitrary shell must not be admitted using only scanner flags, a downloads threshold, or a stars gate. High-impact actions require host-level least privilege, approval or sandbox controls, runtime audit, revocation, and incident replay; the paper’s public static measurements cannot vouch for those controls.

## Limitations and unsupported interpretations

Internal validity is constrained by missing latestVersion, absent SKILL.md, invalid encoding, malformed metadata, withdrawn data, and right-censoring at the end of the June endpoint. External validity is narrower still: this is OpenClaw and ClawHub, a short, fast-growing registry whose activity, policies, publisher behavior, and scanner coverage may differ elsewhere. The privilege regex can miss semantic, indirect, or runtime-only capabilities. The reference sample is small, and annotator labels are not maliciousness truth. The study does not execute skills in a sandbox, build an independent ground truth for the entire registry, or show that one static flag causes real harm.

Do not infer that 85.06% is OpenClaw’s real dangerousness rate; that the top 10% download share is the risk concentration rate; that no scanner flag means clean; that an owner or auto status means accountable; or that every agent-skill registry will reproduce the same 91.11-day curve. What transfers more plausibly is how to preserve unknown, freeze snapshots and cohorts, and separate artifact evidence from runtime evidence.

## Three things to remember

1. **Growth and trust are different axes:** a 95.14% stock increase and a 0.528 download Gini are discovery and capacity signals, not authorization signals.
2. **Reviewability is both data quality and governance:** 77.86% have no stars or comments while 85.06% show at least one privilege signal; unknowns and missing feedback belong in the workflow.
3. **Scanners route triage:** only 446 items are flagged by all three; sensitivity and precision depend on label, sample, version, and coverage. Runtime safety still needs host policy and telemetry.

## Primary sources

- [After the Party v1 arXiv abstract and version record](https://arxiv.org/abs/2609.17274)
- [After the Party v1 full HTML](https://arxiv.org/html/2609.17274v1)
- [After the Party v1 PDF](https://arxiv.org/pdf/2609.17274v1)
- [Paper data-availability DOI](https://doi.org/10.5281/zenodo.21469516) (endpoint returned 404 as of 2026-09-17)
- [OpenClaw repository](https://github.com/openclaw/openclaw) and [ClawHub repository](https://github.com/openclaw/clawhub)
