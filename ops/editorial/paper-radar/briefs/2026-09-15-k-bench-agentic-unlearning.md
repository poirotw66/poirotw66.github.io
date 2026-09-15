---
stableId: "arxiv:2609.12808"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-15
lastVerifiedAt: 2026-09-15
primaryTrack: "agent-systems"
primaryGap: "agent-security"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "deep-read-candidate"
---

# K-Bench: A Benchmark for LLM Unlearning in Agentic Deployments

## Identity

- Search window: 7-day backfill from 2026-09-08 through 2026-09-15; arXiv v1 was submitted 2026-09-11, outside the strict 72-hour window.
- Canonical URL: https://arxiv.org/abs/2609.12808
- Authors: The authors listed on the arXiv record; the paper introduces the K-Bench benchmark.
- Venue or review status: arXiv preprint, v1.
- DOI / OpenReview / arXiv aliases: https://doi.org/10.48550/arXiv.2609.12808
- Code / model / data: https://github.com/OniReimu/kbench and https://huggingface.co/datasets/kbench/kbench-assets; the repository is MIT-licensed code, while full assets include large indexes and a gated model snapshot.

## Editorial fit

- Reader question: If an agent has already copied a secret into a prompt, retrieval result, tool argument, memory, or final answer, what does it mean to say that a model has “forgotten” it?
- Why this belongs in the selected track: The paper moves unlearning evaluation from isolated model answers to an agent's complete observable execution trace.
- Gap it fills: Agent security—how to test leakage and forgetting across planning, memory, retrieval, tool use, and final responses.
- Why now: Agent deployments create more channels through which sensitive information can survive even when a model-level certificate appears clean.

## Claim map

- Problem: TOFU/MUSE-style answer-only certificates can miss secrets emitted by intermediate ReAct channels or retrieved substrates.
- Main claim: K-Bench's six-channel, four-substrate evaluation exposes leaks that answer-only tests report as removed, and changes the ranking of unlearning methods by base model and substrate.
- Method: The benchmark uses an OR-of-channels leakage rule, collapse-aware scoring, prompt and retrieval substrates, registered inference adapters, paired statistical tests, and 13 methods across four substrates and three model families.
- What is genuinely new: It defines unlearning as an end-to-end agent observation problem rather than a property visible only in the final answer.

## Evidence audit

- Datasets: K-Bench's synthetic and ecological-check cases, with forget and retain splits; the public bundle supplies indexes and evaluation assets.
- Benchmarks and metrics: Six ReAct channels, four substrates, leakage detection, retain behavior, and collapse-aware aggregate scores. The paper reports 22–86% leakage in prompt/retrieval settings where TOFU/MUSE report none.
- Baselines: Answer-only TOFU/MUSE-style evaluation, 20 published weight-based methods, input-corruption baselines, and multiple model families.
- Ablations: Substrate and channel breakdowns, model-family comparisons, method ranking changes, and observer/evaluator variations.
- Statistical uncertainty: The paper describes pre-registered paired McNemar tests with FDR correction; the public evaluator emits deterministic reports for configured seeds.
- Threats to validity: Synthetic PII, pure substrate lanes, LoRA injection, fixed snapshots, and limited ecological coverage may not represent messy production memories, tools, or data stores.

## Reproducibility

- Available artifacts and licenses: Public MIT code, dataset assets, evaluator commands, fixed base snapshot, adapter hash, and documented seeds. The asset bundle requires roughly 16.8 GB of indexes and a gated model may be required for full runs.
- Environment or compute requirements: The repository provides a CPU smoke path, but full evaluation requires substantial local storage, model access, and model/inference tooling.
- Smallest useful reproduction: Run the CPU smoke test, then evaluate one forget/retain slice across answer, retrieval, and tool-observation channels with a fixed seed and emit the deterministic report.
- Blocking unknowns: Full reproduction time, model-access friction, and whether the benchmark's synthetic secrets predict real enterprise data-handling failures.

## Critical reading

- Strongest result: The union-of-channels view reveals substantial agent-side leakage precisely where answer-only certificates claim success, making a hidden evaluation blind spot operationally concrete.
- Weakest assumption: A fixed set of substrates and registered adapters can stand in for the mutable memory, retrieval, and tool stacks used by deployed agents.
- Stated limitations: The authors note synthetic PII, narrow substrate implementations, LoRA-based injection, and limited ecological validation.
- Claims not supported by the evidence: Passing K-Bench does not prove complete deletion from every external cache, log, tool database, or model copy.

## Bloss0m connection

- Related Traditional Chinese routes: agent security, memory governance, observability, and evaluation methodology.
- Related English routes: Agent Security, Agent Evaluation, and Production RAG.
- Duplication risk: Low; it complements backdoor and prompt-injection coverage by testing the post-unlearning execution surface.
- Suggested internal links: Pair with SpecGuard for model-side detection and agent trace/observability coverage for channel-level evidence.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30 for a sharp agent-security gap, a surprising failure mode, explicit channel/substrate design, statistical testing, and unusually inspectable public artifacts. Reproducibility is 4 rather than 5 because full runs have heavy assets and gated-model friction.
- Open questions requiring human approval: Which production channels should be mandatory in a deletion certificate? How should external tool databases and immutable logs be handled? What would an independent rerun on non-synthetic enterprise data show?
