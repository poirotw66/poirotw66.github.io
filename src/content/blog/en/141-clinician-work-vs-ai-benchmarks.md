---
title: "Do Clinical AI Benchmarks Measure Exam Questions or Everyday Work?"
description: "A single-system study at NYU Langone compares 127,833 clinical AI requests with 58 public benchmarks and finds that their task mix differs from clinicians’ day-to-day work."
pubDate: 2026-10-13
updatedDate: 2026-10-13
tldr:
  - "Across eight months at one large academic health system, documentation and administration accounted for 36.2% of requests, knowledge retrieval 28.9%, and diagnosis 3.7%."
  - "Across 58 public benchmarks, median overlap with the real-use task mix was 31%; the median benchmark had no documentation tasks."
  - "Evaluations should reflect deployed work and include context and retrieval needs; this study did not measure assistant answer quality or actual harm."
audience:
  - "Engineering and research teams building or evaluating clinical AI assistants"
  - "Healthcare staff responsible for AI governance, clinical informatics, and deployment evaluation"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Research", "Enterprise AI"]
kind: "article"
showToc: true
---

A language model can score highly on medical exam questions without having been shown to handle the work clinicians send to an assistant each day. A recent study from NYU Langone Health and collaborators asks whether **evaluations cover the work clinicians actually do**. The paper was submitted to arXiv on **October 8, 2026** and is included as a seven-day backfill in this week’s window. It compares eight months of assistant use at one large academic health system with public clinical AI benchmarks.

The authors analyzed the first clinician request in 127,833 conversations from 6,342 physicians, advanced practice providers (APPs), and nurses across 35 specialties. By their grouped task categories, documentation and administration accounted for 36.2%, knowledge retrieval 28.9%, and diagnosis 3.7%. The team applied the same annotation framework to 58 public benchmarks. Median overlap between a benchmark’s task distribution and real requests was 31%; the median benchmark contained no documentation tasks.

These findings identify a **representativeness gap**, not a clinical assistant’s accuracy or incident rate. The data came from one institutional assistant in one health system. The authors did not inspect the assistant’s answers or measure actual harm. For health systems and evaluation teams, the practical next step is to profile local work and use it to shape evaluations—not to treat these percentages as universal clinical norms.

> **Huahua in one sentence**
>
> Medical exam questions can test specific clinical reasoning skills, but they do not represent all the work clinicians bring to AI assistants.

## Comparing real requests and benchmarks with one taxonomy

The researchers developed RCQ-Map to describe each request by its task, intent, whether it included necessary context, potential harm, and a safer response type. They applied it to the first request in each conversation from the institutional assistant, then assembled the Clinical AI Benchmark Atlas (CABA). The atlas draws on public evaluation suites and frontier model reports; the authors sampled up to 200 items per benchmark and used the same annotator, guidelines, and schema for comparison.

Using one taxonomy makes it possible to quantify whether both sets cover similar work. The paper reports that the median task-mix overlap across 58 benchmarks was 31%. A hypothetical distribution spread evenly across ten task categories reached 55%. The median benchmark also had no documentation or administrative tasks, although these represented 36.2% of real requests. This is a comparison of task distributions, **not a score of model performance in deployment**.

The study does not argue that exam-style benchmarks are useless. They can measure what they were designed to measure. The problem arises when a score on that slice is used to infer readiness for the full range of clinical work. The 58 benchmarks were selected by the authors from public evaluation suites and model reports; this is not a complete or random sample of available benchmarks. The English-language, text-only set may also miss an institution’s electronic health record (EHR), forms, policies, or nursing workflows.

## Different work calls for different evaluation behavior

A high share of documentation and retrieval requests does not mean every request can be answered directly. In the study’s annotations, 36.1% of requests could not be answered well as posed. Some lacked patient history, test results, a local formulary, or an institutional workflow; others required current external evidence. A safer assistant may need to ask for context or ground its answer in traceable authoritative material. A score that checks only whether the final text is “correct” may not tell these behaviors apart.

The mix of requests also varied by professional role. Residents, APPs, nurses, and attending physicians differed in their shares of retrieval, clinical reasoning, and non-clinical tasks. A benchmark built around one role or one kind of question can therefore hide needs that matter to other workers.

For engineering teams, an evaluation set should include documentation generation, knowledge retrieval, missing patient or institutional context, clarification, source retrieval, and refusal or escalation when those reflect the deployment. The goal is not to make every benchmark a single score for overall clinical competence. It is to make each score’s measurement scope explicit.

> **Huahua's engineering note**
>
> The paper’s “potential harm” labels assume a clinician acts on an incorrect answer without checking it. The study did not evaluate assistant answers or track patient outcomes. The authors also report weaker annotator agreement for harm, context needs, and safest-response judgments, so those prevalence estimates call for caution.

## Turning the finding into an evaluation workflow

Health systems applying this idea can start with a governed profile of their own workflows instead of copying the paper’s percentages:

1. **Define the intended setting.** Specify the product, user roles, departments, workflows, and observation period. Use at one institution cannot stand in for another’s work mix.
2. **Classify requests in an approved environment.** Resolve data access and de-identification first; validate task labels with a sample and examine differences by role. Do not send identifiable patient requests to a model or service the institution has not approved for that data.
3. **Report representativeness separately from capability.** Show the share of each work category and benchmark coverage, then separately test answer quality, context recognition, clarification, grounding, and safe escalation. Coverage alone does not demonstrate capability.
4. **Make data and annotation limits visible.** State whether requests are first-turn only, which labels came from models or humans, how much annotators agreed, and which outcomes describe potential risk rather than real events.

The paper’s raw clinical request text is not public because it may contain protected health information. Researchers may request label-level data without query text from the authors, subject to institutional approval and a data-use agreement. CABA publishes labels and item identifiers for benchmarks, while redistribution of benchmark questions depends on each source’s license. RCQ-Map’s guidelines, schema, and code, along with CABA’s assembly and comparison code, are available in public releases.

To continue into implementation, the [Enterprise RAG guide](/en/blog/65-enterprise-rag-guide/) covers connecting authoritative institutional sources, and the [Enterprise RAG evaluation harness](/en/blog/85-trec-rag-2026-rag-evaluation-harness/) separates retrieval, evidence support, and answer quality. For evaluation that includes multi-step assistants or tool use, see the [AI Agent field guide](/en/blog/64-ai-agent-guide/).

## Sources

- Vishwanath et al., 2026, [*Clinician use of language models diverges from how the models are evaluated*](https://arxiv.org/abs/2610.11069), arXiv v1, October 8, 2026. Findings, methods, data availability, and limitations are based on this version.
- [RCQ-Map source, annotation guidelines, and schema](https://github.com/nyuolab/RCQ-Map); [Zenodo archived version 1.0.0](https://doi.org/10.5281/zenodo.23223807).
- [Clinical AI Benchmark Atlas (CABA) source and labels](https://github.com/nyuolab/CABA); [Zenodo archived version 1.0.0](https://doi.org/10.5281/zenodo.23223809).
