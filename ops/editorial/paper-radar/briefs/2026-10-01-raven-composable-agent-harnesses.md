---
stableId: "arxiv:2609.33439"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-10-01
lastVerifiedAt: 2026-10-01
primaryTrack: "agent-systems"
primaryGap: "multi-agent-coordination"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# Raven: The Harness of Harnesses for Composable Agentic Intelligence

## Identity

- Search window: 2026-09-27 through 2026-10-01; arXiv v1 was submitted 2026-09-27 at 10:44 UTC, approximately 86 hours before this run, so it is a seven-day backfill.
- Discovery queries: `arXiv agent harness composition multi-agent DAG 2026-09-27`; `agent model harness pair composable intelligence benchmark`; `EverMind Raven MAOB code repository`.
- Canonical URL: https://arxiv.org/abs/2609.33439
- Full paper: https://arxiv.org/html/2609.33439
- Authors: EverMind AI.
- Venue or review status: arXiv preprint, version 1; peer review or acceptance is not established by the inspected source.
- DOI / OpenReview / arXiv aliases: arXiv:2609.33439v1; no separate OpenReview record was verified.
- Code / model / data: [Apache-2.0 Raven repository](https://github.com/EverMind-AI/Raven). The repository labels the project pre-alpha; independent replication was not found.

## Editorial fit

- Reader question: When does a host agent benefit from delegating work to specialists, and can it predict the dependency graph before paying to run them?
- Why this belongs in the selected track: Raven treats an executable model-plus-harness as a specialist rather than treating the foundation model alone as the agent. A host plans over specialist domains, dependencies, shared context, and resource budgets.
- Gap it fills: `agent-systems` / `multi-agent-coordination`, especially the evaluation of specialist choice and inter-agent dependency planning.
- Why now: The paper combines a systems design with an explicit orchestration benchmark and a public implementation; its central distinction between planning quality and actual worker execution is useful when interpreting current multi-agent claims.

## Claim map

- Problem: Strong individual agents remain narrow, while manually composing domain-specific harnesses is difficult to scale. Adding agents can also introduce planning and coordination costs.
- Main claim: Raven constructs and evolves modular harnesses, then uses a Host Agent to assign subtasks to specialists and coordinate their dependencies. The paper argues that, under stated conditions and a shared resource budget, composing complementary agents can expand reliable task coverage.
- Method: Raven represents specialist work as a directed acyclic graph (DAG). Its Multi-Agent Orchestration Benchmark (MAOB) contains 140 occupation-inspired requests and reviewed reference DAGs spanning four specialist domains: research, coding, content production, and on-call execution. Raven is compared with Claude Code and Hermes Agent under two matched backbones, with identical requests and delegation instructions.
- What is genuinely new: The system makes the model–harness pair the composable unit and scores both selected specialist nodes and their ordering/dependency edges, instead of reporting only an end-task answer score.

## Evidence audit

- Datasets: MAOB has 140 tasks drawn from 137 occupations. The paper describes automatic quality checks and expert review of reference nodes, partial order, and attribution; all tasks are self-contained text.
- Benchmarks and metrics: Node F1, Edge F1, partial-order accuracy, and exact graph match. The authors report Raven ranked first on all four graph metrics under both tested backbones. Exact Match is reported as 0.711 vs 0.607 for the strongest baseline on Qwen3.8-27B and 0.867 vs 0.762 on DeepSeek-V4-Flash-0731, corresponding to +10.4 and +10.5 percentage points.
- Baselines: Claude Code and Hermes Agent, compared with Raven on the same request set and backbone; their native orchestration interfaces are retained.
- Ablations: The paper reports planning, specialist execution, harness self-evolution, and skill reuse as separate evaluation areas. Some self-evolution and skill-reuse results are attributed to prior HarnessBank and SkillCorpus studies rather than being wholly new experiments in this paper.
- Statistical uncertainty: The inspected MAOB discussion reports aggregate scores but does not establish independent annotation or external replication. Different metrics can have different valid denominators; the paper notes that the nominal 140 task count does not determine every metric's denominator.
- Threats to validity: MAOB evaluates proposed dependency graphs before workers are dispatched. It therefore measures planning agreement with the authors' reviewed references, not end-to-end task completion, final-answer quality, realized coordination cost, or the correctness of a live multi-agent workflow. The task set and reference graphs are author-constructed even with expert review; the implementation is pre-alpha and company-authored.

## Reproducibility

- Available artifacts and licenses: Public Apache-2.0 repository with implementation, documentation, and examples. The repository's showcased recursive-self-improvement outcomes are first-party project claims and should not be conflated with the paper's controlled MAOB results.
- Environment or compute requirements: The repository includes installation and execution instructions, but reproducing all reported specialists and model comparisons requires the model/API access and execution environment described by the project; no independent reproduction was found.
- Smallest useful reproduction: Re-run the MAOB planner-only comparison on the 140 requests with the two named backbones, preserve the exact request/delegation prompts, and independently audit a sample of reference DAGs before scoring all four metrics.
- Blocking unknowns: Independent access to the complete benchmark and reference-review records, full run-level cost and failure data, and evidence that the pre-alpha repository reproduces the submitted-paper version exactly.

## Critical reading

- Strongest result: The matched-backbone MAOB comparison isolates a planning claim more cleanly than a comparison that changes both agent framework and model, and it separately reports node selection and graph dependencies.
- Weakest assumption: Agreement with an expert-reviewed reference DAG is treated as a proxy for useful coordination. Other valid plans, runtime adaptation, worker quality, and coordination overhead are not established by a planner-only score.
- Stated limitations: The paper describes the memory/feedback layer as observational: verdicts may be wrong, records do not expire, and worker-native writes are not reviewed. Group memory is disabled by default and not evaluated. Cross-instance coordination and end-to-end evaluations are future work.
- Claims not supported by the evidence: MAOB does not show that Raven improves end-to-end success on arbitrary long-horizon tasks, that adding specialists is always better, or that the reported planning gains generalize beyond this benchmark and its two backbones.

## Bloss0m connection

- Related Traditional Chinese routes: Existing Agent Systems readings on execution reliability and evaluation; verify exact localized routes before drafting.
- Related English routes: The paired Agent Systems readings; verify exact localized routes before drafting.
- Duplication risk: Distinct from papers about agent trace integrity or tool-call reliability. Raven's focus is the host's predicted specialist DAG and the boundary between planning metrics and worker execution.
- Suggested internal links: Connect to prior agent-evaluation and workflow-reliability readings, while distinguishing orchestration graph quality from actual task success.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30 (topic 5, novelty 5, evidence 4, reproducibility 4, engineering 5, series 5). The paper gives a concrete composable-harness design, matched-backbone comparisons, separate graph metrics, and a public Apache-2.0 repository. Evidence and reproducibility are not scored higher because MAOB is author-constructed and planner-only, some component evidence is carried forward from prior studies, the project is pre-alpha, and no independent rerun was verified.
- Open questions requiring human approval: Keep the +10.4/+10.5 figures explicitly tied to exact MAOB graph match; do not describe them as end-to-end task-success gains. Separate original experiments from the HarnessBank/SkillCorpus results, and identify Raven as an early company-authored preprint rather than an independently validated production system.
