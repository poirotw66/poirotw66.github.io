---
title: "BTS-AgentBench: Compiling Read-Only Telemetry into Replayable Agent Episodes"
description: "A deep read of Jeong-Yoon Kim's BTS-AgentBench (arXiv:2608.27334 v1): a deterministic path from building telemetry to read-only tools, executable tasks, bounded interaction contracts, and evidence-grounded evaluation—strong on replay consistency, bounded beyond production safety or arbitrary-domain portability."
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "The paper's primary contribution is not a claim that one model is best. It is a construction method that compiles fixed building telemetry and metadata into executable, replayable, evidence-bearing multi-turn Agent benchmark episodes."
  - "The central layering is read-only tool store → static executable task → typed interaction contract → operator-facing episode → deterministic verifier. Every clarification, revision, timestamp policy, or quality decision that adds telemetry work is re-executed against the source store."
  - "The 532-row BTS release passes contract preflight with zero findings; two independent raw-to-episode builds match 11 logical tool-store exports and the 356/87/89 split. One-shot test runs report 79/89 for GPT-5.5, 71/89 for Gemini 3.1 Pro, and 58/89 for Claude Opus 4.7."
  - "The decisive boundary is read-only, offline, bounded building telemetry. The paper does not evaluate write-side control, safety-critical actuation, maintenance planning, or long-horizon troubleshooting, and benchmark scores are not production safety evidence."
audience:
  - "AI engineers designing Agent benchmarks, tool-use harnesses, data agents, or enterprise evaluation workflows"
  - "Technical owners who need source data, interaction contracts, evidence, replay, and failure diagnosis joined into an auditable pipeline"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Agent Evaluation", "Benchmark", "Observability", "AI Engineering"]
image: "/paperReading/56-bts-agentbench-replayable-telemetry/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "BTS-AgentBench: A Deterministic, Replayable Pipeline from Read-Only Telemetry Logs to Agent Benchmarks"
  authors:
    - "Jeong-Yoon Kim"
  year: 2026
  venue: "arXiv 2608.27334 v1 (submitted 2026-08-27; preprint)"
  links:
    pdf: "https://arxiv.org/pdf/2608.27334v1"
    arxiv: "https://arxiv.org/abs/2608.27334"
    code: "https://github.com/kjy7567/BTS-AgentBench"
series:
  id: "telemetry-agent-evaluation"
  title: "Telemetry to Agent Evaluation"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Buildings accumulate years of sensor and equipment telemetry, but a raw history is not an executable multi-turn task for an Agent. Hand-authoring each task makes it difficult to preserve a site's vocabulary, source-derived answers, split identity, and evidence links at the same time.
- **Core insight:** Treat benchmark construction as a replayable compiler. First place metadata and histories behind read-only tools; then build a static executable task with fixed golds; finally wrap that computation in a typed, bounded interaction contract. Clarification, goal revision, nearest-timestamp policy, quality decisions, and evidence follow-ups can change the surface, but the source computation and its gold must be re-executed together.
- **Strongest evidence:** Two independent raw-to-episode builds match all 11 logical tool-store exports and regenerate the BTS 356/87/89 train/dev/test release row by row; all 532 released episodes pass coded contract preflight. This supports construction consistency, not operator realism or production deployment (paper Table 7 and Appendix A.3).
- **Main boundary:** BTS-AgentBench is a read-only, offline, bounded building-telemetry benchmark. Its zero controller success is a construction-exclusion condition, not an independent hardness estimate; XAI4HEAT's 41/41 result shows execution on a second telemetry corpus, not portability to arbitrary event logs or physical control.

My bounded verdict is: **the durable idea is to make the source of an answer, the interaction obligations, and the replayable scorer one executable contract. That is useful for building and auditing a constrained read-only telemetry benchmark. Once the question becomes device writes, authorization, or real-site safety, this paper does not provide enough evidence.**

> **Huahua's engineering note**
>
> “Two reconstructions are identical” is not the same claim as “the Agent is reliable on site.” BTS-AgentBench shows that fixed inputs, a fixed selection contract, and a pinned environment can regenerate the same benchmark. It does not show that the source data represents every site, or that a read-only lookup becomes an authorized physical control action.

## What exactly does the paper introduce? / Paper identity and scope

This reading uses the [complete arXiv 2608.27334 v1 HTML](https://arxiv.org/html/2608.27334v1) and [v1 PDF](https://arxiv.org/pdf/2608.27334v1). The version was submitted on 2026-08-27 by Jeong-Yoon Kim. The arXiv record identifies it as a preprint; it should not be described as peer-reviewed. In paper type, it is both a **dataset/evaluation paper** and a **systems paper**: it describes a method for constructing a benchmark from source telemetry and releases one instance called BTS-AgentBench. The released benchmark is not a separate model algorithm.

The reader question is: **how can an already collected, site-specific telemetry corpus become an executable, verifiable, replayable Agent benchmark with bounded operator context?** Answering it requires keeping four objects separate:

1. **The source corpus** is BTS metadata plus timestamp/value histories. It carries site, equipment, zone, point-class, and stream identifiers.
2. **A static task** is a fixed query, tool call, gold, evidence bundle, verifier, and split produced by the read-only runtime.
3. **An episode** places that static task inside a finite user simulator and adds trackable clarification, revision, policy, commitment, or evidence phases.
4. **A model trace** is the Agent's tool calls and answers produced during evaluation. It does not participate in task retention and cannot repair the benchmark after the fact.

The paper calls the source task $r$ and the episode $r^{\star}$: the latter changes the Agent-facing interface while preserving the source computation and target. The star does not guarantee that the episode is more realistic; it marks an interface transformation whose source semantics should remain visible. Each episode combines a deterministic user simulator, read-only tools, an Agent trace, and a programmatic evaluator. Success requires the telemetry target and the interaction obligations, with no mutable final database state (Section 3.1).

## Why the prior approach is insufficient / Why the obvious alternatives are insufficient

### Rich telemetry is not an executable task

BTS contains long time series and standardized Brick metadata, but “the data exists” does not mean there is a queryable, answerable, scoreable episode. An Agent answering a point lookup, daily mean, window comparison, or quality decision needs stable stream binding, tool arguments, a timestamp policy, acceptable answer forms, and evidence naming the contributing stream.

Hand-writing these conversations creates two scaling problems. First, generic Agent data cannot supply the local vocabulary of a particular site. Second, if every row is authored independently, adding a clarification or revision turn can make the user prompt, tool call, gold, evidence, and verifier drift apart. The construction method avoids asking a model to generate prettier prose for every row; it keeps those fields inside a replayable contract.

### The candidate space is large, so retention must be fixed first

In paper Table 1, BTS metadata contains 19,665 streams, of which 14,422 match raw histories and become tool-ready points. The candidate space includes 2,193,431 day-mean candidates, 315,929 window-mean candidates, and 5,989,083 window-pairwise candidates. The final diversity-capped release keeps 60 rows for point disambiguation, day mean, relative 24-hour mean, window pairwise comparison, window rank, timestamp value, and timestamp nearest; 53 window-mean rows; and 59 quality-gate rows, for 532 total.

Those candidate counts describe the search space induced by the tool store and task generator, not task counts in the original BTS release. BTS_C is held out for testing. Other candidates are diversity-capped by point class and calendar quarter, then a fixed ordering assigns every fifth non-held-out candidate to development. Model output and a descriptive difficulty proxy do not affect retention or split assignment (Section 3.2 and Table 1). This is what makes the evaluation a test on a fixed release rather than a split tuned after seeing model answers.

## Core intuition: compile the contract before the Agent interacts

The easiest misreading is to treat the paper as a templating tool for synthetic dialogue. A better mental model is:

```text
BTS metadata + raw histories
  → normalized read-only tool store
  → static executable task
  → typed interaction contract
  → deterministic operator surface
  → programmatic verifier and replay report
```

The changed control point is the **boundary between source computation and the interaction contract**. A surface renderer may hide an exact timestamp behind a recoverable clarification slot, or extend a lookup into “use the nearest observation and explain the quality.” But when a new turn introduces telemetry work, that operation is executed against the same read-only store, and its phase gold, final target, evidence, and verifier are updated together. Language presents the contract; it does not replace the computation.

The episode contract in Section 4.2 is:

$$C=(Q,\Phi,A,E,V), \qquad \phi_i=(f_i,g_i,R_i)$$

Here $Q$ stores the interaction mode, missing slots, and operator turns; $\Phi=(\phi_1,\ldots,\phi_n)$ is the phase sequence; $f_i$ is a phase type; $g_i$ is its structured gold map; $R_i$ lists the scoring fields; $A$ contains canonical and acceptable read-only calls; $E$ identifies contributing streams; and $V$ contains milestones, tolerances, and protocol conditions. The value of this notation is operational: what a turn says and what the evaluator must check remain one object.

The contract transformation can be summarized as:

$$T_k(C;D)=
\begin{cases}
\bigl(U_k(C,z_k),P_k(C)=1\bigr), & z_k=\operatorname{Exec}_D(a_k(C))\\
C, & P_k(C)=0
\end{cases}$$

$D$ is the normalized read-only store. $P_k$ is an eligibility predicate over typed fields; $a_k$ constructs tool arguments from the existing contract; $\operatorname{Exec}_D$ runs the source operation; and $U_k$ updates affected turns, calls, golds, evidence, and verifiers together. The predicate does not infer labels from free-form text. A false predicate records a no-op; a true predicate applies a fixed-order stage. “Deterministic” here means construction and scoring are replayable for fixed inputs, rules, runtime, and environment. It does not mean a future hosted-model generation will be identical.

### Figure provenance

The v1 full text exposes only one material raster figure endpoint; Tables 1–12 are typeset tables rather than additional downloadable figure images. This pair therefore embeds the same Figure 1 in both languages instead of fabricating three original-paper figures that do not exist.

![BTS-AgentBench Figure 1: building time-series data passes through read-only tools, a static task, and an interaction contract to become an evidence-backed multi-turn Agent benchmark episode.](/paperReading/56-bts-agentbench-replayable-telemetry/paper/figure-1-pipeline.webp)

*Figure 1, located in the paper's Section 2 “Building telemetry data and metadata” and reused as the pipeline overview in Section 3: notice how source telemetry on the left becomes read-only tools and contract stages, then reaches the nearest-lookup episode and evidence-backed answer on the right. See the [original Figure 1 anchor](https://arxiv.org/html/2608.27334v1#S2.F1) and [original image endpoint](https://arxiv.org/html/2608.27334v1/figure1.png). The arXiv HTML page marks the paper CC BY 4.0; the local PNG is converted to WebP with attribution retained, and the evidence is not redrawn.*

## Walk one released row through the method

This is not a new toy benchmark. It is the repository's worked row, `test_timestamp_value_lookup_00051`, used to explain the data flow rather than to add a statistical sample. The complete [construction walkthrough](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/CONSTRUCTION_WALKTHROUGH.md) and [replay trace](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/examples/REPLAY_TRACE.md) retain its lineage.

1. **Input: a fixed source record.** `Site_Caa.zip`, member `Site_Caa/2254.pickle`, contains 194,563 observations for stream `c24589e8_a1f3_4529_b409_5a56761c9d20`. Metadata binds it to `BTS_C Zone 005` and `Air_Differential_Pressure_Sensor`; at 2022-02-03 07:03:23.640 UTC the value is `12.9457`.
2. **Intermediate representation: a read-only runtime.** Preprocessing joins CSV/Brick mapping to the raw member and exposes `resolve_point`, exact/nearest `lookup_observation`, `aggregate_window`, `compare_window`, `rank_window`, and `inspect_quality_window`. Tool outputs come from the DuckDB-backed store or its raw lineage; a label is not guessed from prose.
3. **Static contract: complete the original query first.** The row first resolves `BTS_C`, `Air_Differential_Pressure_Sensor`, and `BTS_C Zone 005`, then performs an exact lookup at the full timestamp and obtains `12.9457`. It stores the stream evidence, gold timestamp, gold value, acceptable calls, and verifier.
4. **Interaction composition: withhold a typed field deliberately.** The episode renderer turns the timestamp into a missing `time_reference` slot, so the initial operator request asks only for the Zone 005 reading. If the Agent asks for clarification, the simulator releases the stored `07:03:23.64 UTC on February 3, 2022`; it does not invent a new value.
5. **Revision and policy: re-execute instead of copying an old gold.** After the exact lookup, the revised request rounds the public time to 07:03. The runtime tries exact mode, then nearest mode returns the same observation 23.64 seconds later. `inspect_quality_window` checks the week from 2022-01-31 through 2022-02-07 and returns `observed_fraction=1.0`, `gap_ratio=1.0563`, and `decision=answer`. The reporting policy then produces `commitment_action=answer`, `reason=nearest_but_acceptable`, and requests the original stream as evidence.
6. **Output and likely failure point.** A correct response must say that the value is the nearest reading, not an exact 07:03:00 observation, and provide stream evidence. If exact/nearest status is collapsed, the window and quality phase are not updated together, or the Agent misses the final evidence request, the value can look right while the episode still fails its contract or protocol.

This row makes “replayable” concrete at three boundaries: can the source value be rebuilt from the raw member; does each phase come from typed fields; and can the same scorer produce the same component scores for a retained trace? None of those boundaries is a safety guarantee.

## Method skeleton: telemetry to episode

### 1. Raw-to-static: build the read-only tool store

BTS covers three buildings over roughly three years. The paper aligns metadata, raw stream archives, and the Brick graph; normalizes site, point, equipment, and location fields; and promotes only points matched to raw history. The DuckDB-backed store materializes a raw stream index, per-stream quality statistics, daily/weekly/monthly aggregates, calendar profiles, and stream previews. Missing observations are not imputed; they affect coverage and quality policies.

Fixed eligibility predicates generate nine task families: point disambiguation, day mean lookup, relative 24-hour mean lookup, window mean lookup, window pairwise comparison, window rank, timestamp value lookup, timestamp nearest lookup, and quality gate. Aggregate candidates below the corpus 10th-percentile coverage floor or above the site/class 99.5th-percentile absolute-mean cap are removed. Pairwise and rank candidates require positive margins; nearest lookup selects the earlier observation when absolute offsets tie. These are construction rules, not task definitions from the BTS source release.

| Static task family (Table 1) | Candidate space | Retained |
| --- | ---: | ---: |
| Point lookup / disambiguation | 4,263 | 60 |
| Day mean lookup | 2,193,431 | 60 |
| Relative 24-hour mean lookup | 2,193,431 | 60 |
| Window mean lookup | 315,929 | 53 |
| Window pairwise comparison | 5,989,083 | 60 |
| Window rank | 1,084 | 60 |
| Timestamp value / nearest lookup | 2,123 / 2,123 | 60 / 60 |
| Quality-aware reporting | 315 | 59 |
| **Total** | — | **532** |

### 2. Static task to episode: separate computation, contract, and surface

Each static row fixes the source operation, arguments, tool-derived result, contributing streams, acceptable alternatives, and gold contract. The episode compiler then selects a finite interaction grammar. Table 3's phase vocabulary includes:

| Phase | What the evaluator checks |
| --- | --- |
| Clarification | Whether missing site or time context is obtained before querying |
| Initial answer | Whether the source telemetry task is executed with read-only tools |
| Goal revision | Whether resolved state is reused under a revised request |
| Timestamp policy | Whether exact, nearest, or insufficient-time reporting is distinguished |
| Quality commitment | Whether coverage/gap evidence leads to answer or abstain |
| Rationale follow-up | Whether a quality or reportability decision is explained |
| Evidence follow-up | Whether the supporting stream, point, timestamp, or aggregate is returned |

The compiler can render bounded references such as “the same signal,” “the next day,” or “the second month's winner” from fixed fields. No language model chooses the construction mode, paraphrases the prompt, or supplies a missing value. The simulator tracks pending clarification slots, an initial-answer flag, a revision index, and a post-answer index. Tool-call messages do not advance user state; only a matching clarification releases a withheld typed value.

### 3. Coupled updates: repair the interaction contract without overwriting the source

The paper requires three conditions for each typed stage:

- **Source preservation:** unaffected static phases, stream bindings, and split fields stay unchanged.
- **Execution grounding:** every introduced value, timestamp, aggregate, or quality statistic equals `$z_k$` or an explicit deterministic policy function.
- **Discourse alignment:** the rendered turn, prior state, tool path, gold fields, evidence, and verifier describe the same operation.

A surface-only wording normalization may change text alone. If a timestamp or window changes, an old gold cannot be copied; the runtime operation must run again. Each stage appends a before/after contract summary, status, and ordered history so replay can show which layer changed.

### 4. Controller-aware acceptance: use shortcuts to find construction defects

Release validation has two different meanings. Contract preflight checks phase/turn cardinality, final-phase linkage, required verifier fields, scorer acceptance of rendered golds, runtime agreement for timestamp and quality windows, derived commitments, evidence identifiers, and prompt-phase alignment. All 532 BTS rows report zero findings; that says only that the declared executable contract passed.

The construction-exclusion controller is a rule-based controller with bounded parsers and explicit site/stream state. It invokes the model-facing read-only tools and is scored by the same evaluator; it contains no learned parser or LLM. The release condition requires it to complete no row, so BTS is 0/532 (0/89 on test) and XAI4HEAT is 0/41. The first blocking layers are 353 parse/binding failures, 127 phase-completion failures, and 52 required-tool process failures; these are controller-audit diagnostics, not ground-truth task difficulty.

## What exactly does replay guarantee?

The strongest construction evidence is in Appendix A and Table 7. Two independent preprocessing executions begin with checksummed BTS raw archives, the retained normalized catalog, and a 532-entry selection contract; all 11 sorted logical tool-store exports match. Two complete episode builds, plus a build from the independently reconstructed store, regenerate the 356/87/89 rows exactly, including turns, calls, phase/final golds, evidence, verifiers, generation history, provenance, row order, and serialization.

The guarantee is scoped to fixed inputs and a pinned environment. DuckDB container bytes need not be identical because physical layout is not the canonical serialization; the comparison is over logical exports and final JSONL bytes. New hosted-provider calls are outside the replay boundary because provider services, routes, output caps, and model behavior can change. The repository retains 267 BTS model traces that can be deterministically rescored, but those fixed records are not an estimate of repeated-call variance.

## How to read the evaluation: data, controls, metrics, and models

### Evaluation setup

The BTS test split has 89 rows across nine families. Three frontier LLMs are invoked once per row: GPT-5.5 through OpenAI direct, Gemini 3.1 Pro through OpenRouter, and Claude Opus 4.7 through OpenRouter. They share the released rows, deterministic user simulator, read-only tools, one-tool-per-turn loop, stopping protocol, and scorer, but provider route, output cap, seed support, and family guidance differ. The recorded environment uses Python 3.11.11, DuckDB 1.5.0, NumPy 1.26.4, pandas 3.0.1, PyArrow 23.0.1, and RDFLib 7.6.0; raw replay needs about 19 GB of compressed archives plus additional tool-store space.

The controls are not only the three models. The construction-time controller audits whether a hand-written shortcut can complete the contract. The deterministic scorer decomposes each model trace into final, evidence, phase, task, and protocol. `accomplished` means `task_ok AND protocol_ok`: an initially correct telemetry value can still fail because clarification, goal revision, quality commitment, or evidence follow-up is missing.

### Table 5: family results are not a model leaderboard

| Family | Rows | GPT-5.5 | Gemini 3.1 Pro | Claude Opus 4.7 |
| --- | ---: | ---: | ---: | ---: |
| Point disambiguation | 10 | 8/10 | 5/10 | 6/10 |
| Day mean lookup | 10 | 10/10 | 8/10 | 7/10 |
| Relative 24-hour mean lookup | 10 | 10/10 | 9/10 | 9/10 |
| Window mean lookup | 10 | 9/10 | 10/10 | 7/10 |
| Window pairwise comparison | 10 | 6/10 | 5/10 | 5/10 |
| Window rank | 10 | 8/10 | 5/10 | 4/10 |
| Timestamp value lookup | 10 | 9/10 | 10/10 | 5/10 |
| Timestamp nearest lookup | 10 | 10/10 | 10/10 | 7/10 |
| Quality gate | 9 | 9/9 | 9/9 | 8/9 |
| **Overall** | **89** | **79/89 (88.8%)** | **71/89 (79.8%)** | **58/89 (65.2%)** |

**What does this experiment test?** Under the fixed release and simulator, can an Agent complete both the source query and every interaction obligation? **What is held constant?** Rows, tools, simulator, one-tool-per-turn behavior, stopping protocol, and scorer; model route, prompt profile, and model output vary. **What changes?** Direct lookup and aggregation cells are often 90–100%, while pairwise comparison, ranking, and point disambiguation are lower. **What might explain it?** The latter families demand carried state, comparison/ranking fields, and evidence closure rather than one value copied from a tool result. **What does it not establish?** Each model has one retained provider execution per row, so repeated-call variance is unmeasured; provider-compatible configurations are not a perfectly homogeneous head-to-head leaderboard. These qualifications follow Section 6.3, Section 7.1, and Table 5.

### Table 6: why the final score is not enough

| Model | Final | Evidence | Phase | Task | Protocol |
| --- | ---: | ---: | ---: | ---: | ---: |
| GPT-5.5 | 0.978 | 0.955 | 0.949 | 0.965 | 86/89 |
| Gemini 3.1 Pro | 0.921 | 0.955 | 0.939 | 0.957 | 81/89 |
| Claude Opus 4.7 | 0.903 | 0.933 | 0.875 | 0.927 | 81/89 |

Final is the row-level macro-average of final-phase fields. Evidence is required-stream coverage over all 89 evidence-bearing rows. Phase is the fraction of ordered phases passed. Task combines core answer, grounding, temporal, and phase checks. Protocol checks clarification, revision, rationale/evidence follow-up, tool errors, empty messages, and nontermination. The decomposition can expose a near-success where the answer string is correct but evidence is not closed, instead of compressing all failures into the last score (Section 7.2 and Table 6).

Appendix B gives four retained cases. `QG-00051` is a quality-gate consensus success for all three models. In `PD-00003`, GPT-5.5 is accomplished, while Gemini misses early stream grounding and Opus under-specifies a later phase decision. In `WR-00009`, all three produce the gold abstention but fail at evidence follow-up or quality commitment. In `WP-00044`, all three reach the high-level abstention, but each leaves a different comparison field or cue unresolved. These are fixed-trace failure localizations, not universal model-capability theorems.

## XAI4HEAT portability: reuse the downstream path, not a universal adapter

XAI4HEAT is a second continuous telemetry corpus with a different source boundary. It supplies row-oriented SCADA tables, heating-area metadata, and seven channel columns, while BTS combines per-stream ZIP histories with graph-derived metadata. The repository's `xai4heat.py` performs the corpus-specific mapping from `t_amb`, `t_ref`, `t_sup_prim`, `t_ret_prim`, `t_sup_sec`, `t_ret_sec`, and `delta_e` into common `site_id / stream_id / point_class / equipment / timestamp / value` fields.

After that mapping, the authors reuse the tool-store construction, five applicable single-stream temporal families, clarification, episode lifting, contract preflight, controller audit, runner protocol, and scorer. Point disambiguation, pairwise comparison, rank, and standalone quality gate are not silently claimed as supported because this schema lacks the same ambiguity and candidate-group structure as BTS. The result is 204 rows split 132/31/41; on held-out `XAI4HEAT_L17`, the controller is 0/41 and the retained GPT-5.5 execution is 41/41 (Section 7.3, Appendix D, and Table 12).

**What does this experiment test?** Can a corpus-specific adapter make the same downstream construction/evaluation topology execute on a second continuous telemetry schema? **What is held constant?** Shared tools, phases, scorer, and held-out-site protocol; the adapter, source identifiers, domain wording, values, and supported family subset change. **What is observed?** 204 rows can be constructed, and all 41 held-out GPT-5.5 traces complete. **What is a reasonable explanation?** The shared contract topology can be reused across the two evaluated telemetry corpora. **What does it not establish?** Arbitrary event logs, incident narratives, manufacturing state transitions, and write-side tools cannot be assumed to work by swapping in a mapping.

## Evidence map: Paper, Evidence, and Bloss0m judgment

### Paper directly supports

- The paper introduces a deterministic construction path from normalized raw telemetry to static tasks, typed interaction contracts, operator-facing episodes, and evidence-grounded verifiers (Sections 3–4).
- The BTS release has 532 rows, nine families, and a 356/87/89 split; contract preflight reports zero findings; two independent builds match 11 logical exports and the release bytes (Table 7 and Appendix A).
- The construction-exclusion controller is 0/532 on BTS and 0/41 on the XAI4HEAT test split; the three BTS model runs and one XAI4HEAT GPT-5.5 run report the values in Table 5 and Table 12.

### Author interpretation

- Real telemetry can serve as a substrate for raw-to-static task compilation and multi-turn benchmark construction.
- The XAI4HEAT result supports downstream reuse across the two evaluated telemetry corpora; structurally different event/state-transition logs would require new tools, families, and evaluators.
- Controller-aware acceptance is a construction-hardening signal; zero controller accomplishment means the declared exclusion criterion was satisfied.

### Not established

- The benchmark construction does not show that tasks predict production operator behavior, deployment safety, or physical-control correctness.
- The paper does not show that GPT-5.5 is better on all telemetry or Agent tasks; the study has 89 rows per model, one call per row, and provider configurations differ.
- “Deterministic” does not include hosted-model generation, and the two-corpus result does not prove the same transfer property outside the evaluated datasets.

### Bloss0m engineering synthesis

The following four points are my engineering reading of the paper's boundary, not a production framework separately introduced by the authors: **(1)** make source operations and evidence replayable before writing interaction prose, **(2)** treat the interaction surface as typed transformations rather than free-form dialogue generation, **(3)** re-execute the runtime and perform a coupled update for every new phase, and **(4)** use a controller as a construction audit rather than a hardness oracle. This synthesis can guide an offline benchmark, but it should not be read as a specification for authorizing on-site actions.

## Limitations, failure modes, and unsupported readings

The paper deliberately keeps its scope narrow:

- **Read-only scope:** it evaluates building-telemetry search, aggregation, comparison, ranking, timestamp reportability, and quality-aware reporting. It does not include write-side control, safety-critical actuation, maintenance planning, or long-horizon troubleshooting (Section 8, Limitations, and Ethical Considerations).
- **Bounded interaction:** deterministic user turns and bounded episodes help automatic scoring and trace analysis, but reduce linguistic diversity and the messy state of real operator conversations.
- **Data and external validity:** only BTS and XAI4HEAT are used as continuous telemetry corpora, and the final release has no systematic domain-expert audit. Candidate pools and model counts are not industry prevalence.
- **Model evidence:** every model-row has one retained provider invocation. Temperature, output cap, seed support, prompt profile, and route differ across provider-compatible configurations; repeated-call variance, cost sensitivity, and broader model families are not measured.
- **Controller is not an oracle:** the 0/532 condition deliberately requires the controller not to complete a row; the failure analysis still separates parser/binding, phase-completion, and tool-process blockers. It would exceed the evidence to call a row impossible for rule-based methods.
- **Portability requires an adapter:** XAI4HEAT reuses only five families. Event causality, incident narratives, action side effects, or manufacturing state transitions would need new tools, contracts, and evaluators, not configuration-only portability.

The appropriate reading of Table 5 is therefore not production superiority, and the appropriate reading of exact replay is not source-data validity. They answer different questions: whether fixed released rows were completed, and whether the construction can be rebuilt.

## Artifacts and reproducibility

The following records the independently checked endpoint state and repository artifacts **as of 2026-09-17**:

| Artifact | Status and scope |
| --- | --- |
| [Official BTS-AgentBench repository](https://github.com/kjy7567/BTS-AgentBench) | Accessible; the inspected shallow clone is release commit `ecc80721f3da941cda611bab041a054cfa8d79e6` (2026-08-27). It contains construction code, static tasks, 532 episodes, 204 XAI4HEAT episodes, retained traces, replay reports, and runners. |
| [`dist/source.zip`](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/dist/source.zip) / [`dist/dataset.zip`](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/dist/dataset.zip) | Downloadable; the repository's `verify_packaged_release.py --dist-dir dist --require-bundles` passed locally, checking 532 BTS rows, 204 XAI4HEAT rows, 267 BTS model traces, 41 XAI4HEAT traces, and bundle checksums. This is packaged-release verification, not a full raw-to-episode replay. |
| [BTS Figshare article](https://doi.org/10.6084/m9.figshare.28705559.v3) | Accessible; the three raw ZIP direct Figshare endpoints respond with download redirects and total about 19 GB compressed. The repository does not redistribute raw archives, so a clone without them cannot perform the complete replay. |
| BTS metadata and normalized catalog | CSV, Brick TTL, and checksummed Parquet files are readable in the repository. Raw payloads and catalog mappings remain subject to upstream attribution and licensing terms. |
| Code, documentation, and benchmark artifacts | The repository `LICENSE` assigns source code, scripts, and runners to MIT; benchmark artifacts, reports, provenance, and documentation are covered by CC BY 4.0 unless a file says otherwise. Raw BTS data follows the upstream Figshare CC BY 4.0 terms; redistribution must retain attribution. |

The smallest useful reproduction is to obtain the three exact BTS archive filenames, verify the SHA-256 values in `DATA_SOURCES.md`, install Python 3.11.11 and the pinned dependencies, run `make replay RAW_DIR=/absolute/path/to/BTS_RAW_ARCHIVES`, and compare the 11 logical exports, fixed selection identities, static/episode split hashes, and controller audit. Without the raw archives, one can still run package verification, inspect release rows, and rescore retained traces when a compatible tool store is available; that path must not be called a complete source-to-release reproduction.

## Engineering decision and when not to use it

### When it is worth adopting

For an **offline, read-only, fixed-source telemetry benchmark whose answers can be recomputed by a deterministic runtime**, this pattern has three practical benefits:

1. Source computation, interaction obligations, and evidence IDs have explicit boundaries, so a prompt-surface change reveals what needs to be re-executed.
2. Split, selection identity, tool outputs, and phase golds can be preflighted and replayed before release instead of inferred from model results after drift.
3. Final score is accompanied by phase, evidence, task, and protocol failures, separating “the value was looked up” from “the whole interaction contract was completed.”

This recommendation is **Bloss0m engineering interpretation**, not the paper's universal recipe. An implementation should record its read-only scope, corpus-specific family subset, artifact version, source-data license, runtime version, and replay boundary in the release contract.

### When this paper should not drive the decision

Do not use BTS-AgentBench directly to sign off device writes, physical actuation, maintenance scheduling, incident response, or safety-critical authorization. It does not test tool side effects, permissions, rollback, human escalation, equipment state transitions, or long-running operation; an evidence follow-up in a benchmark does not authorize an on-site action.

Do not treat it as a converter for arbitrary data types. An incident event log, a causal event stream, a tool with external side effects, or an operator context without a bounded contract would need new tools, phase vocabulary, evaluators, and domain audits. Finally, if the actual goal is only to compare final answer strings, first decide whether the additional construction, replay-storage, and source-license costs are justified; the paper's extra value is precisely the structure that final answers omit.

## Three things to remember

1. **Technical idea:** BTS-AgentBench compiles read-only telemetry into a static executable task, then adds bounded interaction through a typed contract; changing the surface should not silently change the source computation.
2. **Strongest evidence:** Two independent raw-to-episode builds match 11 logical exports and the 356/87/89 release, with zero contract-preflight findings. That supports construction replay, not production safety.
3. **Adoption boundary:** Results from two continuous telemetry corpora do not cover arbitrary logs, write-side control, or physical sites; the model numbers come from fixed 89-row, one-call traces and retain uncertainty.

## Next reading

To connect benchmark construction with trace observability, read [Parsing the Stream: Long-Horizon Agents Need Auditable Live State](/en/paper-reading/43-parsing-the-stream-live-trace/), which examines typed trace state shared by worker and observer; then read [Real-Time Detection and Repair of LLM Agent Failures](/en/paper-reading/14-agent-trajectory-sentinel/) for a different runtime failure-detection path. For operational tool use and task evaluation, compare [ContextWeave: A Real-World Workflow Benchmark for Long-Running Agents](/en/paper-reading/09-contextweave-workflow-benchmark/). These links are conceptual continuations, not evidence that different scopes form one benchmark.

## Primary sources

- [BTS-AgentBench arXiv v1 full text](https://arxiv.org/html/2608.27334v1) · [arXiv record](https://arxiv.org/abs/2608.27334) · [v1 PDF](https://arxiv.org/pdf/2608.27334v1). The arXiv HTML marks the paper CC BY 4.0; this article reuses only its one material Figure 1 and retains attribution.
- [BTS-AgentBench official repository at the inspected release commit](https://github.com/kjy7567/BTS-AgentBench/tree/ecc80721f3da941cda611bab041a054cfa8d79e6) · [replay report](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/replay/release_replay_report.json) · [artifact map](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/ARTIFACTS.md).
- [BTS: Building Timeseries Dataset: Raw, Figshare v3](https://doi.org/10.6084/m9.figshare.28705559.v3) · [upstream DIEF_BTS repository](https://github.com/cruiseresearchgroup/DIEF_BTS) · [CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/).
- [XAI4HEAT source publication](https://doi.org/10.1016/j.dib.2025.111320), the second telemetry corpus described in Appendix D. This reading does not turn its data terms into a redistribution permission for BTS-AgentBench.
