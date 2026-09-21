---
title: "BioPhys-Bridge: Making Scientific RAG Walk from Evidence to Physics, Mechanism, and Decision"
description: "A deep reading of BioPhys-Bridge (arXiv:2609.19180 v1): a benchmark that makes evidence IDs, values and units, physical equations, assumptions, biological mechanisms, and next decisions explicit, while separating attribution from scientific correctness."
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "BioPhys-Bridge models a biophysics case as evidence → quantitative value → physical model → mechanism → next decision, covering 500 cases and 1,517 tasks across six biological domains and nine physical-model families."
  - "Its release gates report complete schema, evidence-integrity, quantitative-grounding, license, unit, and duplicate checks, but only 81/500 cases have expert annotation; manual_review_status is not full expert review."
  - "On the 154-task held-out test, the candidate generator contains 234/267 gold evidence IDs (0.876 recall; all gold IDs for 127/154 tasks), while DeepSeek v4 Flash reaches 0.360 evidence-ID F1. This is attribution and reranking evidence, not full scientific correctness."
  - "The v1 paper says the public release will follow peer review, yet GitHub and Hugging Face are accessible as of 2026-09-21; the full JSONL is on Hugging Face, while raw PDFs, MinerU payloads, and LLM responses are not public."
audience:
  - "Researchers and platform engineers building scientific RAG, paper agents, or AI-for-Science benchmarks"
  - "Evaluation teams that need to separate evidence attribution, numerical consistency, mechanism correctness, and experimental feasibility"
tags: ["Paper Reading", "Retrieval", "RAG", "Scientific AI", "Benchmark", "Agent Evaluation", "Biophysics"]
image: "/paper-reading/biophys-bridge-scientific-grounding/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
paper:
  title: "BioPhys-Bridge: A Benchmark for Interdisciplinary Scientific Reasoning in Physics-Grounded Biological Research"
  authors:
    - "Qingyang Xu"
  year: 2026
  venue: "arXiv 2609.19180 v1 (2026-09-15; workshop version)"
  links:
    pdf: "https://arxiv.org/pdf/2609.19180v1"
    arxiv: "https://arxiv.org/abs/2609.19180"
    doi: "https://doi.org/10.48550/arXiv.2609.19180"
    code: "https://github.com/qyxu1994/BioPhys-Bridge"
    project: "https://huggingface.co/datasets/qyxu1994/BioPhys-Bridge"
series:
  id: "scientific-grounded-rag"
  title: "Scientific Grounded RAG"
  part: 1
  totalParts: 1
---

This reading covers [BioPhys-Bridge: A Benchmark for Interdisciplinary Scientific Reasoning in Physics-Grounded Biological Research](https://arxiv.org/abs/2609.19180), arXiv v1. The record dates the submission to 2026-09-15, and the authors call it a workshop version; it is not a peer-reviewed journal or conference final. I read the full HTML/PDF, Sections 1–10, Tables 1–9, Figures 1–3, Appendices A–C, the quality-control text, and the limitations. I also inspected the authors’ [GitHub repository](https://github.com/qyxu1994/BioPhys-Bridge) and [Hugging Face dataset endpoint](https://huggingface.co/datasets/qyxu1994/BioPhys-Bridge).

The useful question is not “can a model find a similar paragraph?” It is: **can a research-grade answer move from locatable source evidence through values and units, a physical model and its assumptions, a biological mechanism, and finally a testable next experiment or computation?**

## The paper in 90 seconds

- **Problem:** Traditional scientific QA/RAG often treats a passage or paper-level citation as the grounding unit. Biophysics also requires numerical, unit, equation, assumption, and cross-disciplinary mechanism fidelity.
- **Core insight:** BioPhys-Bridge does not flatten a case into a question-answer pair. It stores `evidence[]`, `quantitative_evidence[]`, `biophysical_model`, `physical_interpretation`, `biological_mechanism`, `sci_evo_trajectory[]`, and `agent_tasks[]`. Evaluation asks for both an answer and supporting evidence IDs.
- **Strongest evidence:** The release has 500 cases and 1,517 tasks, with 400/50/50 splits and no source-paper overlap across splits. On 154 held-out tasks, DeepSeek v4 Flash reaches 0.360 evidence-ID F1 versus 0.188 for lexical retrieval.
- **Main boundary:** A lexical candidate generator first reduces a median 206 evidence blocks per case to 48, containing 234 of 267 gold IDs (0.876 recall; all gold IDs for 127/154 tasks). The results therefore measure attribution and reranking inside a lexical candidate set, not unconstrained retrieval or complete physical/biological correctness.

My bounded verdict is: **the most useful contribution is not the 0.360 point score. It is the benchmark object that turns scientific grounding into an auditable evidence-to-decision chain. It can expose missing citations, unit mistakes, skipped model assumptions, and plausible-but-unsupported mechanisms. Its current protocol is not yet enough to claim that a model understands science, especially without full rubric-based expert scoring.**

> **Huahua's engineering note**
>
> A citation can show which evidence block an answer points to; it cannot by itself prove that the equation was applied correctly, the direction was not reversed, the mechanism was not overclaimed, or the proposed experiment is feasible. A production scientific RAG system should keep attribution, numerical consistency, model validity, mechanism plausibility, and decision feasibility as separate checks.

## Paper identity, evidence map, and scope

This is a **dataset and evaluation benchmark paper**, not a new physical model and not a deployable scientific agent. Its research question has two layers. First, can open-access biophysical literature be structured into cases that connect evidence, equations, mechanisms, and decisions? Second, can a model produce attributable answers when gold answers, gold evidence IDs, and expert annotations are hidden?

Keep three voices separate:

| Layer | What this reading says |
| --- | --- |
| **Directly supported by the Paper** | 500 cases, 1,517 tasks, six biological domains, nine physical-model families, deterministic 400/50/50 splits, 81 expert-annotation cases, schema/evidence/quantitative/license/unit/duplicate gates, 154-task no-scaffold evaluation, and evidence-ID F1. |
| **Author interpretation** | Evidence blocks and structured fields extend attribution beyond passage retrieval; the benchmark can study faithfulness, hallucination reduction, and experiment design. |
| **Not established by the Evidence** | Evidence-ID F1 is scientific correctness, all 500 cases have full expert review, models can reliably perform novel physical derivations, or benchmark performance transfers to real laboratories. |
| **Bloss0m engineering synthesis** | Treat evidence → quantitative value → physical model → mechanism → next decision as five persisted audit checkpoints. This is an engineering interpretation, not an additional guarantee claimed by the paper. |

### Paper Essence Contract

1. **What problem does it solve?** It evaluates whether RAG/LM systems can connect literature evidence to values and units, physical models, model assumptions, biological mechanisms, and next decisions instead of merely generating relevant-looking prose.
2. **Why are previous approaches insufficient?** PaperQA, LitQA, and related scientific QA often center passages, paper citations, or answers; equations, units, assumptions, mechanism links, and decisions are not always first-class evaluation fields.
3. **What is the core technical idea?** Make a case a structured object with stable evidence IDs, make every quantitative record cite evidence, require tasks to output both an answer and supporting IDs, and evaluate attribution under a de-leaked prompt.
4. **How does one input flow?** Source paper → MinerU parse → normalized evidence blocks → regex-first numeric/equation candidates → evidence-only structuring → schema/integrity/unit/license/duplicate/content gates → task prompt plus 48 candidates → model JSON answer and IDs → scorer.
5. **What evidence supports the headline?** Release tables support scale and gate results; Appendix B supports the 500→400/50/50 funnel; Tables 7–8 support held-out evidence-ID F1 and task-type diagnostics. These support an attribution benchmark, not mechanism correctness.
6. **Where does the claim stop?** It stops at a public-query, lexically pre-filtered, 154-task, temperature-0, JSON-mode preliminary baseline. There is no human ceiling, hidden test server, repeated stochastic evaluation, or full expert rubric scoring, and release timing is inconsistent between the paper and the current public endpoints.

## Five objects to understand: evidence is more than a passage

A generic RAG path can be written as `query → retrieved chunks → answer`. BioPhys-Bridge splits the scientific middle. An `evidence block` is a locatable citation unit. `quantitative_evidence` stores a metric, value, unit, and cited IDs. `biophysical_model` stores a model family, equation, variables, assumptions, and validity conditions. `physical_interpretation` records derived quantities, directionality, and caveats. `biological_mechanism` connects the physical result to biology. `sci_evo_trajectory` stores stages from research question through observation, interpretation, and next step.

![BioPhys-Bridge Figure 1: the evidence-to-decision case structure](https://arxiv.org/html/2609.19180v1/figure1_case_structure.png)

*Figure 1, Section 3.1: the arrow is not “retrieved text directly becomes an answer.” Evidence first grounds a quantitative value, which is interpreted under a physical model and assumptions before reaching a mechanism and next decision. [Original Figure 1 anchor](https://arxiv.org/html/2609.19180v1#S3.F1) · [Original image endpoint](https://arxiv.org/html/2609.19180v1/figure1_case_structure.png). The arXiv v1 page marks the work [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); this article converts the v1 figure to WebP with attribution and does not redraw an experimental result.*

This split makes “correct” multidimensional. A model can cite the right evidence ID but reverse the direction of `k_off`, giving acceptable attribution and an incorrect physical interpretation. Or it can cite a binding assay and then invent a cellular mechanism the source paper never tested. That is why Section 7 and Section 9 explicitly warn against treating evidence-ID F1 as scientific correctness.

## Core intuition: turn cross-disciplinary reasoning into checkable stations

A prior pipeline might ask only, “Which passages support this answer?” BioPhys-Bridge asks five connected questions:

```text
source evidence
      ↓
quantitative value + unit
      ↓
physical model + assumptions
      ↓
biological mechanism + caveat
      ↓
next experiment or computation
```

Each station can fail differently. Retrieval can omit evidence. Parsing can damage a unit. The model step can apply an equation outside its validity condition. The mechanism step can turn correlation into causation. The next decision can omit controls. The authors make these intermediate fields part of the schema; that does not mean every field already has equally strong ground truth. It creates an interface for future expert rubrics.

This conceptual move differs from [RAGSieve’s retrieval integrity](/en/paper-reading/55-ragsieve-rag-poison-detection/): RAGSieve focuses on whether context is contaminated or distorted, while BioPhys-Bridge carries the question forward into physical interpretation and next-step design. It also pairs naturally with [Agentic RAG partial-answer prediction](/en/paper-reading/53-agentic-rag-partial-answer-prediction/): a partial-answer detector could stop an agent before its evidence chain is complete and its conclusion becomes overconfident.

## Walk one gold case through the method

Appendix A’s Figure 3 is the authors’ real-case schematic. It places source provenance, evidence-linked measurements, a physical model, mechanism, caveat, and task together instead of leaving only a QA pair.

![BioPhys-Bridge Figure 3: the complete gold-case structure](https://arxiv.org/html/2609.19180v1/figure2_golden_case.png)

*Figure 3, Appendix A: the teaching point is the provenance chain, not a standalone biological conclusion. Source, evidence IDs, quantitative values, model, mechanism, and caveat must point to one another. [Original Figure 3 anchor](https://arxiv.org/html/2609.19180v1#A1.F3) · [Original image endpoint](https://arxiv.org/html/2609.19180v1/figure2_golden_case.png). The source is marked CC BY 4.0; this article uses the v1 figure for teaching and does not treat the schematic as independent validation.*

Following the paper’s fields, one input moves like this:

1. **Input:** The agent receives a task type, research question, domain, and ranked candidate evidence blocks. Gold answer, gold IDs, expert annotation, and structured equation fields are hidden.
2. **Intermediate representation:** Each block has a stable ID and source location. A quantitative record keeps value and unit. The model record keeps equations, variables, assumptions, and validity. The trajectory separates observation from the next step.
3. **Decision:** The model chooses which candidate IDs actually support the answer and returns JSON with `answer` and `supporting_evidence_ids`. It cannot cite an ID that is absent from the candidate set.
4. **Output:** The scorer computes evidence-ID precision, recall, and F1 against gold supporting IDs, plus token overlap against the gold answer. These metrics answer different questions.
5. **Likely failure point:** If lexical retrieval misses a necessary ID, the model cannot cite it from the 48 candidates. If the candidates are adequate but the model writes plausible prose without parseable IDs, attribution still approaches zero.

This is a faithful simplification of the benchmark protocol, not a biological inference that I reran. It deliberately separates the evidence visible to the model from the gold labels used after prediction.

## Technical mechanism: curation, schema, and de-leaked evaluation

### 1. The curation pipeline turns papers into traceable records

The authors start with open-access papers that have DOI/PMCID provenance and release-compatible licenses, batching candidates to track domain and model-family coverage. MinerU parses PDFs and preserves text, table, formula, and figure/caption modalities; raw PDFs and MinerU intermediate payloads are not in the public release. A regex-first pass extracts numeric values, equations, units, model keywords, and evidence-rich snippets. An evidence-only LLM pass—gpt-4o for the shipped release—then structures quantitative evidence, interpretation, mechanism text, and agent tasks. The prompt requires the model to use only supplied evidence and leave unsupported fields empty; validation removes fabricated IDs.

![BioPhys-Bridge Figure 2: the curation pipeline and release gates](https://arxiv.org/html/2609.19180v1/figure3_pipeline.png)

*Figure 2, Section 4: open-access source → MinerU → evidence blocks → structured case → validation and quality gates → release. “The LLM generated it” is not itself a release decision. [Original Figure 2 anchor](https://arxiv.org/html/2609.19180v1#S4.F2) · [Original image endpoint](https://arxiv.org/html/2609.19180v1/figure3_pipeline.png). The source is marked CC BY 4.0; this article converts the v1 original to WebP with attribution.*

### 2. Quality gates mean release integrity, not full scientific validation

All 500 records pass Pydantic/JSON Schema. Evidence-ID referential integrity, quantitative grounding, source-license coverage, unit normalization, duplicate checks, and content gates report complete coverage or zero duplicates. 490 cases use CC-BY-4.0 and 10 use CC0-1.0. These gates answer whether the data are parseable, IDs exist, a number appears in cited text, and licenses are recorded. They do not by themselves prove that a physical equation was applied correctly or that a biological mechanism is expert-confirmed.

In particular, `quality.manual_review_status = reviewed` is a release-gate status, not full physics and biology review of all 500 cases. The separate `expert_annotation` field covers 81 cases: 50 held-out test cases, 10 contest gold samples, 30 extended-gold samples, and one legacy reviewed record. The 500 and 81 denominators must not be merged into “500 expert-validated cases.” The 107 cases with an explicit failure/revision stage are a third, different coverage field.

### 3. The evaluation measures attribution and output compliance

Each test task shows 48 candidate evidence blocks. Ranking uses only task type, task question, research question, domain, and source evidence text; it does not use gold IDs, equations, directionality, mechanisms, or quantitative records. Gold labels appear only in scoring. The LLM rows use temperature 0 and JSON mode, with task-level nonparametric bootstrap 95% intervals.

There are three important mathematical readings:

- **Candidate recall:** The test set has 267 gold supporting IDs. The lexical candidate generator contains 234, giving `234/267 = 0.876` ID recall; all gold IDs are present for 127/154 tasks. This is part of the retrieval ceiling, not the model’s final score.
- **Evidence-ID F1:** Given the candidate set, this measures overlap between predicted and gold IDs. It can tell us about attribution, not whether the cited equation was substituted correctly, units were converted correctly, a mechanism is causal, or a proposed experiment is valid.
- **Answer token F1:** Token overlap with the gold answer is a rough sanity check. It may rise with similar wording or fall for a correct open-ended paraphrase; it is not a scientific-quality score.

The harness also computes `overall_score = 0.7 × answer token F1 + 0.3 × evidence-ID F1` for diagnostics, but the paper does not use it as the main metric because token F1 is weak for open-ended scientific answers. Adding two weak signals does not create correctness.

## Release statistics and internal inconsistencies: put four numbers back in context

### 500 cases, 1,517 tasks, 81 annotations

Table 3 reports 500 cases, 1,517 agent tasks, and a 400/50/50 split. Table 4’s domain counts sum to 500, and Table 5’s task counts sum to 1,517. The 81 figure means cases with expert annotation, not the number of task labels and not full manual review. The 107 failure/revision cases are a separate coverage field.

### 154 held-out tasks and 50 test cases

The split contains 50 test **cases**. Those cases expand to 154 agent-facing **tasks**. Therefore Table 7’s n=154 is not a contradiction with 50; it is the task-level denominator after a case-level split. Writing “50-task test” would be wrong, while writing only “50 test cases” would hide the denominator used for model scores.

### Candidate recall and the “maximum achievable F1”

The 0.876 figure is ID-level coverage: 234 of 267 gold IDs are in the candidate pool. The mean maximum achievable evidence-ID F1 of 0.916 is a different per-task summary: it considers the F1 ceiling under each task’s candidate set and then averages. It is therefore not supposed to equal 0.876. The 127/154 all-hit count also does not mean the other 27 tasks have zero possible score; they may contain some gold IDs.

### Evidence-ID F1 and release timing

The abstract and conclusion say that public code and data are available, while Section 8 says that the public dataset and code repository “will be released after peer review.” That is an internal timing mismatch in v1. As of 2026-09-21, the authors’ GitHub repository is public and the Hugging Face page exposes train/validation/test viewers; the full 500-case JSONL is on Hugging Face rather than GitHub. The precise statement is: **the public artifacts are accessible on the audit date, but the release-timing sentence is stale or unreconciled; it should not be rewritten as a peer-reviewed release, and it does not prove that every supplementary file is public.**

## How to read the results: one score cannot carry five claims

Table 7 asks: “Under the same 154 tasks, 48-candidate lexical pre-filter, no-scaffold prompt, and output protocol, can a model choose evidence IDs that overlap the gold set?” Controls are the same tasks and candidate generator, temperature 0, and JSON output. The observations are lexical 0.188, DeepSeek v4 Flash 0.360, Qwen 0.316, and GPT-4o-mini 0.294. This supports “some LLMs improve attribution/reranking over a lexical floor,” not “DeepSeek understands physics.”

DeepSeek v4 Flash has a 95% CI of [0.309, 0.412], Qwen [0.273, 0.359], and GPT-4o-mini [0.251, 0.339]. Paired bootstrap deltas over lexical are +0.172, +0.127, and +0.106, respectively, with intervals above zero. Claude Opus has a smaller +0.050 delta ([0.005, 0.094]); Claude Sonnet’s +0.035 interval crosses zero ([-0.010, 0.081]). These intervals express paired task uncertainty, not variation across seeds, corpora, or expert judgments.

Table 8 splits the test into 39 derivation, 31 discrepancy, 46 mechanism, and 38 next-experiment tasks. Flash scores 0.475 on derivation, 0.404 on discrepancy, 0.352 on mechanism, and 0.216 on next experiment. The last task is open-ended decision making; its lower score does not by itself mean that a model “does not know biology.” It may reflect how gold evidence and next-step prompts are defined. Each cell has only 31–46 tasks, so these are diagnostic slices, not stable rankings.

The most informative negative result is Gemini 2.5 Pro: answer token F1 is 0.099, but 151/154 outputs have no parseable evidence IDs, yielding evidence-ID F1 of 0.010. Plausible prose and usable attribution can separate. This also means evidence-ID F1 is partly sensitive to output-format compliance. A model may write partially reasonable science and be penalized for omitting IDs; a model may output perfect IDs while misusing the physical mechanism. Both require another rubric.

### Author claims, evidence, and what is not established

| Question | What the paper’s evidence supports | What it does not establish |
| --- | --- | --- |
| Can the system cite the right source? | Evidence-ID F1 and candidate coverage measure attribution. | Correct interpretation of the cited passage. |
| Can it write a plausible answer? | Answer token F1 is a rough overlap sanity check. | Numerical or mechanistic correctness. |
| Can it perform physical derivations? | The derivation slice provides a more specific diagnostic. | Full expert verification of every equation step. |
| Can it design the next experiment? | There are 403 next-experiment tasks, and Flash reaches only 0.216 evidence-ID F1. | That the design is feasible, controlled, or worth running. |
| Is the release reliable? | Schema, ID, unit, license, and duplicate gates cover the release. | All 500 cases are expert-checked or free of OCR/parser artifacts. |

## Limitations, failure modes, and artifact status

The first limitation is **incomplete correctness supervision**. Eighty-one cases have expert annotations, but the 50 test-case notes are not independent parallel task-level labels, so the authors do not report inter-annotator agreement for supporting IDs. There is no full rubric-based scoring of physical-model use, numerical consistency, mechanism correctness, uncertainty handling, or experimental feasibility. That is why evidence-ID F1 must remain an attribution metric.

The second is **retrieval ceiling and contamination**. The candidate generator is lexical, with 48 candidates from a median 206 evidence blocks per case; it is not full-corpus retrieval. The test set is public, which creates long-term contamination risk. A future version should use hidden or contamination-aware evaluation.

The third is **data and source bias**. The source pool is open-access and release-compatible, and the six domains are weighted rather than balanced. The last three physical families have only 6, 2, and 2 cases; the paper explicitly presents them as coverage for future expansion rather than standalone family evaluations.

The fourth is **pipeline provenance and parser artifacts**. OCR and table parsing errors may remain in evidence text because the pipeline prioritizes traceability. Raw PDFs, MinerU payloads, and LLM responses are not public, so a reader cannot reconstruct every extraction decision. The release audit starts at the reviewed candidate set rather than the exploratory source pool, so Appendix B is a shipped-release funnel, not a complete rejection funnel.

For artifacts, the GitHub code/schema/tests/samples/aggregate reports are browsable. The Hugging Face page exposes three splits and a viewer; the full JSONL release is provided there rather than tracked in GitHub. Reproduction is conditional: a reader must install the Python package, obtain the dataset, run validation/tests, and provide provider credentials for model baselines. This is not a one-command reproduction of every paper result. Availability is assessed as of 2026-09-21.

## Engineering decision: turn the five-step chain into a production contract

The following is **Bloss0m engineering synthesis**, not an official framework proposed by the authors. To carry BioPhys-Bridge’s idea into a scientific RAG system, I would require five persisted checkpoints in every answer trace:

1. **Evidence:** paper version, evidence ID, source location, and license.
2. **Quantitative value:** raw and normalized values, unit, conversion rule, and proof that the cited evidence contains the number.
3. **Physical model:** equation, variables, assumptions, validity conditions, and directionality. If these are absent, the model should say “unknown” rather than fill in a plausible model.
4. **Mechanism:** distinguish measured, derived, and hypothesized when linking physics to biology; citation presence is not causal proof.
5. **Next decision:** independent variable, control, expected observation, failure interpretation, and feasibility for the proposed experiment or computation.

The point is not to guarantee correctness. It gives reviewers a place to say which station failed. Evidence-ID F1 can live at the first station; numerical and unit checks at the second; symbolic relation checks at the third; domain-expert rubrics at the fourth and fifth. One aggregate score would hide these failure modes.

### When to use it, and when not to

It fits literature QA, hypothesis triage, benchmark design, or research-assistant prototypes where paper provenance and intermediate fields can be preserved. Do not use it directly for clinical decisions, wet-lab protocols, safety-critical engineering, or freshness-sensitive research without domain sign-off, source-version pinning, freshness policy, and independent correctness checks.

Do not treat it as a general physics-solver benchmark either. Its equations and mechanisms come from curated literature cases, not controlled simulation ground truth. If the product question is “which model predicts molecular dynamics most accurately,” a simulation or measurement benchmark is more direct. If the question is “did the answer cite the right paper evidence while preserving assumptions and a next step,” BioPhys-Bridge is better aligned.

## Artifacts and reproducibility

As of **2026-09-21**:

- **Paper:** arXiv v1 HTML, PDF, figures, and CC BY 4.0 attribution are directly accessible.
- **Code:** The [GitHub repository](https://github.com/qyxu1994/BioPhys-Bridge) is public and includes schema, validators, evaluation code, tests, small samples, and aggregate reports. The full release JSONL is not tracked there.
- **Data:** The [Hugging Face dataset](https://huggingface.co/datasets/qyxu1994/BioPhys-Bridge) is public, with train/validation/test viewers; the full JSONL release is loaded from that endpoint according to the repository instructions.
- **Missing inputs:** Raw PDFs, raw MinerU payloads, LLM responses, and the complete exploratory rejection history are not public. Model baselines still require provider credentials.
- **Status caveat:** Section 8’s “after peer review” wording conflicts with the public endpoints. This report describes access on the audit date and does not upgrade it to a peer-reviewed reproducible release.

## Three things to remember

1. **Technical idea:** BioPhys-Bridge makes a case an evidence → quantitative value → physical model → mechanism → next decision bridge, so intermediate reasoning fields can be retained and audited.
2. **Strongest evidence:** On the 154-task, 48-candidate held-out protocol, several LLMs improve evidence-ID F1; that is first an attribution and format-compliance result, not the endpoint of scientific correctness evaluation.
3. **Adoption boundary:** The 500-case release gates strongly support structural and provenance integrity, while 81 expert-annotation cases remind us that full scientific correctness is not validated. The next step needs expert rubrics, independent labels, hidden evaluation, and numerical/mechanistic consistency checks.

## Primary sources

- [BioPhys-Bridge arXiv v1 full HTML](https://arxiv.org/html/2609.19180v1)
- [BioPhys-Bridge arXiv record](https://arxiv.org/abs/2609.19180)
- [Author GitHub repository](https://github.com/qyxu1994/BioPhys-Bridge)
- [Hugging Face dataset endpoint](https://huggingface.co/datasets/qyxu1994/BioPhys-Bridge)
