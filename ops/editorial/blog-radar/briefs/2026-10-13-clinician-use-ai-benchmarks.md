---
stableId: "url:https://arxiv.org/abs/2610.11069"
status: "durable-post-candidate"
firstSeenAt: 2026-10-13
lastVerifiedAt: 2026-10-13
primaryCategory: "Industry Pulse"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 23
decision: "write-now"
---

# Clinician use of language models diverges from how the models are evaluated

## Identity

- Search window: 2026-10-10 01:48 UTC to 2026-10-13 01:48 UTC; seven-day backfill began 2026-10-06 01:48 UTC. This paper was submitted on 2026-10-08 and is labeled backfill.
- Discovery queries: `AI agent failure and incident October 10 2026`; `AI workforce task use study October 2026`; `arXiv agent evaluation and RAG October 2026`; `NYU clinician AI benchmark real use October 2026`; `official model MCP cloud AI updates October 2026`.
- Canonical URL: https://arxiv.org/abs/2610.11069
- Publisher or author: Krithik Vishwanath et al.; NYU Langone Health and research collaborators.
- Published or updated date: 2026-10-08 (arXiv v1).
- Source type: research paper with public code and benchmark artifacts.
- Direct supporting sources: [RCQ-Map code and annotation guidelines](https://github.com/nyuolab/RCQ-Map); [Clinical AI Benchmark Atlas code and labels](https://github.com/nyuolab/CABA); [RCQ-Map archived release](https://doi.org/10.5281/zenodo.23223807); [CABA archived data release](https://doi.org/10.5281/zenodo.23223809).

## Editorial fit

- Why now: A seven-day-backfill study connects how clinicians use an AI assistant in routine work with what clinical AI benchmarks actually test, using a large real deployment corpus and public benchmark comparisons.
- Reader question: Are medical language models being evaluated on the work clinicians actually ask them to do?
- Story hook: In one eight-month deployment, documentation and administration accounted for 36.2% of requests, knowledge retrieval 28.9%, and diagnosis 3.7%; the median of 58 public benchmarks contained no documentation requests and covered only 31% of the deployment's task mix.
- Category and topic cluster: Industry Pulse; no existing cluster assigned.
- Existing coverage and duplication risk: Stable arXiv ID, canonical URL, title, bilingual blog and paper-reading archives, and Blog Radar `contentEntries` were checked. No matching article or draft was found.
- Why this remains useful after the news cycle: It provides a concrete way to compare AI benchmarks with real workflow distributions and highlights when assistants should retrieve local information or ask clinicians for missing context.

## Claim map

- Primary claim: The clinical assistant's observed task mix differs substantially from the tasks covered by commonly used public clinical AI benchmarks.
- Measured evidence: The authors analyzed 127,833 first-turn queries from 6,342 physicians, advanced practice providers, and nurses across 35 specialties at one academic health system during an eight-month rollout. RCQ-Map labels were validated against seven clinicians on 100 queries. The authors mapped up to 200 items from each of 58 public benchmarks; the median task-mix overlap was 31%, and the median benchmark included no documentation or administrative tasks, compared with 36.2% of observed requests.
- Vendor or author claims requiring qualification: All corpus labels, benchmark comparisons, and conclusions are author-reported; no independent reanalysis was found. The paper's potential-harm measure assumes that a clinician acts on an incorrect answer and is not an observed adverse-event rate.
- Bloss0m engineering consequence: Build evaluations from the work users actually send to a deployment, including documentation, retrieval, clarification, missing-context handling, and role differences, instead of treating exam-style clinical reasoning as representative of the full workload.

## Evidence audit

- Primary evidence inspected: arXiv v1 full text and methods; RCQ-Map repository, README and license; CABA repository, README and license; paper-linked Zenodo release records.
- Baseline or comparison: The same RCQ-Map annotation framework was applied to the deployment corpus and the sampled benchmark items. The paper compares the median benchmark with both the real query mix and an even distribution across ten task categories.
- Missing evidence: Raw query text is not released because it may contain protected health information; label-level deployment data are available only by request under institutional approval and a data-use agreement. No independent rerun or external health-system cohort was verified.
- Conflicts or uncertainty: The evidence covers one academic health system and one assistant, and the authors did not inspect the assistant's responses or measure actual harms. They used only the first clinician turn; 9.0% contained no recoverable request. Human agreement was modest for harm, missing-context, and safest-response labels, so absolute rates for those judgments are less certain than comparisons across tasks or groups. The benchmark set was author-selected and public, English-language, and text-only.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “Clinicians asked AI mostly to document care and find information; medical benchmarks mostly do not test that work.” Lead with the gap between the observed task mix and benchmark coverage, then show how under-specified and higher-risk requests call for clarification or retrieval. Do not describe the query distribution as universal or equate potential harm with observed harm.
- Internal routes: Confirm current routes for clinical AI, evaluation, and RAG coverage if this candidate is approved for drafting.
- Human decision required: Approve this topic before bilingual drafting. Attribute the measurements to the paper and state the single-system scope, protected-data boundary, and annotation-agreement limitations.
