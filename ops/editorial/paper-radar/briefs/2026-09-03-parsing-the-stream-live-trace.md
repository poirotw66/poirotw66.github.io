---
stableId: "arxiv:2609.01466"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-03
lastVerifiedAt: 2026-09-07
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 4
  total: 29
decision: "deep-read-candidate"
---

# Parsing the Stream：把長程 Agent Trace 變成可審計、可重播的 live state

## Identity

- Search window: strict 72-hour scan from 2026-08-31 00:32Z to 2026-09-03 00:32Z.
- Canonical URL: https://arxiv.org/abs/2609.01466
- Authors: Egor Pakhomov and Erik Nijkamp, Salesforce AI Research.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-01; CC BY 4.0 HTML version available.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.01466
- Code and data: https://github.com/SalesforceAIResearch/tracelab; synthetic corpus https://huggingface.co/datasets/Salesforce/tracelab-comprehend. Code is BSD-3-Clause; the synthetic corpus is CC-BY-4.0. As of 2026-09-07, the public GitHub repository is accessible, while the Hugging Face card is visible but its Dataset Viewer fails to load the train split and returns a 401 / repository-not-found error for a revision file request.

## Editorial fit

- Reader question: When an agent trace is too large for both a human observer and the next agent turn, what state should be retained, and how can that state be audited?
- Why this belongs in the selected track: The paper treats trace handling as an agent-system primitive shared by worker context and observability, not as an after-the-fact summarization prompt.
- Gap it fills: Agent evaluation—especially the missing link between long-horizon context management, deterministic evidence, and observer-facing monitoring.
- Why now: The released workbench turns familiar “context compression” advice into a typed event ledger, explicit coverage requirements, regression tests, and a boundary where fixed aggregates fail.

## Claim map

- Problem: A raw trace grows beyond a useful context budget. In twelve real sessions totaling 112 MB, the raw-tail observer reached 0.479 accuracy; a 120-link full-context worker accumulated 2.37M billed input tokens and failed on the development-era schedule.
- Main claim: An append-only event ledger folded into typed `RunState`, then rendered into per-consumer views, can improve monitoring accuracy and make worker state compact, deterministic, and auditable.
- Method: Parse events once, maintain keyed facts and deterministic aggregates, preserve source identity and coverage, evict without losing aggregates, and expose a recent raw suffix plus a curated view to the worker. An LLM reader answers observer questions against the same representation.
- What is genuinely new: The paper combines the data model, the failure-derived eleven requirements, cost accounting, control arms, and a released scoreboard. It explicitly says the view is conditional on schema coverage rather than a universal compression win.

## Evidence audit

- Datasets and tasks: COMPREHEND uses twelve real transcripts with 70 monitoring questions per condition; CONTINUE uses 120-link sequential-dependency workbench tasks with deterministic ground truth and seeded error schedules.
- Metrics and baselines: On the real corpus, compiled views reach 0.871/0.850 accuracy for Sonnet 5/Haiku 4.5 versus 0.479/0.476 on raw tails, with 57K/43K versus 779K/652K panel input tokens. On the final clean 120-link protocol, curated and scratchpad arms reach 30/30 versus 8/30 full context; curated costs 1.59 dollars per run versus 7.13.
- Controls and ablations: Flat logs, scratchpads, calculator, retrieval, full-history deconfounds, coverage stamps, cache variants, and a boundary alternating-sign chain are reported. The independent raw-JSONL recount reproduces five chain-120 traces with zero mismatches, and bookkeeping fields are mutation-tested 8/8.
- Statistical uncertainty: Transcript bootstrap intervals are provided for the observer comparison, but one reader call per transcript-condition and fixed corpus selection do not quantify reader-call noise or population transfer.
- Threats to validity: Questions are co-designed with the schema; the complete stack is from one vendor; real transcripts are withheld; multi-session and multi-agent ledgers, prompt-injection handling, secret redaction, and retrieval-available tasks remain untested. On alternating-sign chains the curated view underperforms full context at 60 links and both fail at 120.

## Reproducibility

- Available artifacts: Public tracelab code, four benchmark harnesses, workbench traces, seeded synthetic corpus generator, scoreboard, spend ledger, and 99 regression tests. The repository is directly accessible; the Hugging Face dataset card is currently only partially usable as described above.
- Environment or compute requirements: Re-scoring needs the named model endpoints; COMPREHEND real transcripts are not released because they contain personal working sessions.
- Smallest useful reproduction: Run the released CONTINUE 120-link final-protocol cell, compare curated/full/scratchpad arms, then rerun the five-chain recount oracle and inspect the coverage-stamp regression cases.
- Blocking unknowns: Transfer to an external trace schema, multi-agent identity isolation, and whether a task-aware projection written by an independent team closes the same gap.

## Critical reading

- Strongest result: The same state representation serves both worker and observer, and the paper separates deterministic aggregation from boundedness with explicit controls instead of presenting one opaque summary prompt.
- Weakest assumption: The benchmark rewards the statistics the fold was designed to preserve; the authors acknowledge benchmark–system co-evolution and report the failure boundary.
- Unsupported leap: The results do not prove that a live trace model is safer, better for arbitrary tools, or cheaper than a production multi-call observer with provider-side caching.

## Bloss0m connection

- Related routes: Long-horizon agents, agent observability, context engineering, event-sourced memory, and provenance contracts.
- Duplication risk: Low; this is a trace-state and evaluation paper rather than a generic context-compression survey.
- Suggested internal links: Connect to the existing agent-evaluation and MCP observability candidates; use its eleven requirements as a checklist for the site's future paper-reading figures.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30 because it has a strong problem fit, a novel shared-state framing, released code/data/traces, explicit controls, deterministic oracles, and immediate engineering consequences. Series value is 4/5 because the single-vendor and single-session boundaries make it a strong case study rather than a universal recipe.
- Open questions requiring human approval: How would the contract change for multi-agent traces, tenant-sensitive tool output, injected instructions, and schema evolution? Can independent traces reproduce the cost/accuracy crossover without co-designing the questions?
- Draft prepared: The bilingual Paper Reading pair is `43-parsing-the-stream-live-trace`, with an Evidence Atlas cover and original paper Figures 1–4 in both language bodies. Strict figure, pair, comprehension, reading-quality, i18n, and Paper Radar checks passed on 2026-09-07; the article remains a local draft until explicitly published.
