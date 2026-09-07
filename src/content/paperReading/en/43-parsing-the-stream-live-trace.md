---
title: "Parsing the Stream: Long-Horizon Agents Need Auditable Live State, Not Just Memory"
description: "A critical reading of Pakhomov and Nijkamp's Parsing the Stream (arXiv:2609.01466): an append-only trace is folded into typed RunState and compiled into observer and worker views. The paper reports gains on specific accumulation tasks and monitoring costs, but does not show that fixed aggregates replace every form of trace memory."
pubDate: 2026-09-07
updatedDate: 2026-09-07
tldr:
  - "The paper treats an Agent trace as a shared system asset with two consumers: a human observer who needs to understand execution and a worker that must fold a growing trace back into bounded context."
  - "Its core pipeline is append-only typed event ledger → deterministic RunState → versioned derived nodes → observer and worker compiled views; one state supplies observability, context control, and provenance."
  - "On 12 real sessions, the observer proxy reports compiled-view accuracy of 0.850–0.871 versus 0.476–0.479 for raw tails; on a clean 120-link chain, curated and scratchpad arms are both 30/30 while full context is 8/30."
  - "This is not a universal context-compression win: the evidence does not cover order-sensitive operations, multi-agent or multi-session ledgers, prompt injection, secret redaction, or schema evolution."
audience:
  - "AI engineers designing long-horizon agents, context management, trace observability, or agent-evaluation harnesses"
  - "Technical leads who need to connect execution state, cost, coverage, provenance, and failure boundaries into an auditable control plane"
tags: ["Paper Reading", "Agent Systems", "Agent Evaluation", "Observability", "Context Engineering"]
image: "/paperReading/43-parsing-the-stream-live-trace/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "Parsing the Stream: A Live Trace Model for Long-Horizon Agents and Their Observers"
  authors:
    - "Egor Pakhomov"
    - "Erik Nijkamp"
  year: 2026
  venue: "arXiv 2609.01466 v1（2026-09-01；未同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2609.01466v1"
    arxiv: "https://arxiv.org/abs/2609.01466"
    code: "https://github.com/SalesforceAIResearch/tracelab"
    project: "https://huggingface.co/datasets/Salesforce/tracelab-comprehend"
series:
  id: "agent-trace-observability"
  title: "Agent Trace Observability"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** A long-horizon Agent trace outgrows both of its consumers. A human observer needs to know what is happening, what has settled, and what is still missing; the worker Agent must put the same growing trace back into a bounded context window. A tail-only view loses early facts, while replaying the full history on every turn makes tokens, cost, and failure risk grow together.
- **Core insight:** Instead of building two unrelated summarizers for the worker and observer, write the trace as an append-only typed ledger, fold it into a `RunState` with source and coverage information, and compile consumer-specific views from that state.
- **Strongest evidence:** In COMPREHEND, using 12 real transcripts and 70 monitoring questions per condition, the compiled view reaches 0.871 accuracy for Sonnet 5 and 0.850 for Haiku 4.5; raw tails reach only 0.479 and 0.476. In CONTINUE's clean 120-link protocol, the curated fold scores 30/30, the scratchpad scores 30/30, and full context scores 8/30 (Tables 1–2, Figures 2–3).
- **Main boundary:** The evidence is conditional on schema coverage and task shape. The authors show that the fold loses its advantage on an alternating-sign chain, and they acknowledge benchmark–system co-evolution, a single vendor, a fixed schema, single-session traces, and untested prompt injection, secret redaction, and multi-agent ledgers.

My bounded verdict is: **the durable contribution is not “a summary is better than the original.” It is the proposal to make the trace a replayable, verifiable state machine that can serve two consumers. For Agents that need accumulation or explicit provenance, this is a useful architecture hypothesis. For unknown operations, undefined schemas, or untrusted tool output, it is not yet a safe general-purpose compressor.**

> **Huahua's engineering note**
>
> If a product Agent runs for a long time, do not ask only how much context remains. Ask whether every retained fact has a source, a validity range, and an explicit coverage boundary. If an aggregate already includes a file, can the worker tell? The paper's failure analysis shows that correct state is not enough: missing coverage can still cause a final double-add.

![Parsing the Stream Figure 1: the four-layer architecture from an append-only trace to RunState, derived nodes, and views for two consumers.](/paperReading/43-parsing-the-stream-live-trace/paper/figure-1-architecture.webp)

*Figure 1, the live trace model in Section 3: an Agent run produces append-only JSONL, which passes through a typed ledger, a single-pass fold, and versioned derived nodes before becoming an observer page and a worker view; the curator loop sends worker actions back into the ledger. [Original Figure 1](https://arxiv.org/html/2609.01466v1#S3.F1) · [Original image endpoint](https://arxiv.org/html/2609.01466v1/figures/fig1_architecture.png). The image is taken from the arXiv HTML page, which marks the paper CC BY 4.0; attribution is retained and the PNG is converted to WebP for this site.*

## What problem is this paper solving?

An Agent run produces more than a final answer. It produces a trace that keeps growing: user turns, model messages, thinking, tool calls, tool results, file changes, errors, retries, compaction summaries, and cost fields. That trace has two different but coupled consumers:

1. **The human observer** needs to monitor the run while it is still happening. The observer wants the current goal, frontier, pending calls, touched files, errors, and cost—not a JSONL tail that may already have discarded the relevant evidence.
2. **The worker LLM** needs to continue on the next turn. It cannot keep unlimited history, so it must fold early observations into a small representation without losing the state that matters for the task.

Section 1 gives two concrete scales for the raw-trace problem. Twelve real sessions total 112 MB. On the observer side, a frontier-tier model reading raw tails reaches 0.479 accuracy and consumes 779K input tokens across the 12-transcript panel. On the agent side, the 120-link sequential-dependency workbench makes a full-context worker accumulate 2.37M billed input tokens; the development-era success rate drops to 7/30, while the final clean protocol gives full context only 8/30. None of these numbers is a theorem that all long contexts fail. They define the controlled problem the authors chose to measure.

## Why the previous approach is insufficient

It helps to separate the baselines that are easy to conflate.

### Raw tail: cheap, but it guarantees only recency

Truncating a trace to its last segment controls the input budget, but does not guarantee that early facts remain visible. If an observer asks for the sum of every file delta, the latest tool results may not contain the answer. COMPREHEND exposes the asymmetry: a recency-sensitive latest-ask question still scores 0.833 from the raw tail, while the whole-run files question scores only 0.13–0.20. Not every question is equally hard; the representation fails where retention matters.

### Flat logs and generic summarization: shorter does not mean task-aware

A flat log renders the whole run more compactly, yet it still receives about eight times as many input tokens as the compiled view and trails it in accuracy. The authors also test rolling summarization with an approximately 400-word cap: it scores 0/3 at both 30 and 60 links. Removing the hard cap raises the small cells to 3/5 at 30 links and 4/5 at 60 links, but the 120-link directional cell is still 3/10. The lesson is not that summarization can never work. It is that **a silently binding length budget can itself become a silent state-corruption mechanism**.

### Retrieval: relevant fragments do not always solve accumulation

The paper tests retrieval over the worker's own trace: retain the last five steps, then select up to ten earlier steps using token-overlap relevance. It still scores 0/10 at 120 links. The authors do not claim that retrieval is always useless. The chain task asks the worker to add every delta; relevance ranking has no natural way to select a set whose correct answer requires all members. The question becomes more precise: **does the state explicitly carry the statistic required by the task?**

### A worker scratchpad: successful, but not the whole value proposition

In the final protocol, the cached scratchpad also scores 30/30 and costs about $0.97 per run, compared with $1.59 for the curated fold. This is important counterevidence: the paper does not show that a deterministic fold beats a well-instructed worker note on chain accuracy. The fold's extra value is elsewhere: it does not depend on the worker remembering to write a note; its state is replayable and auditable; and the observer can be served from the same fold. If the only requirement is task success, a scratchpad may be enough. If the requirement includes “where did this value come from?”, the comparison changes.

## Core intuition: make the trace a state machine

The control point that changes is not “use a better summary prompt.” It is the **intermediate representation of the trace**.

The usual mental model is:

`raw trace → truncation, summary, or retrieval → next prompt`

The paper's model is:

`Agent run → append-only events → typed ledger → deterministic RunState → consumer-specific views`

Let $e_t$ be event $t$ and $R_{t-1}$ the execution state before it. The fold can be expressed as:

$$R_t = \operatorname{Fold}(R_{t-1}, e_t)$$

Here, $R_t$ is not a prose summary. It contains a goal, frontier, pending calls, turn/tool/error counters, files, and source-scoped facts with running aggregates. A view is then compiled for consumer $c$:

$$V_t^{(c)} = \operatorname{Compile}_c(R_t), \qquad c \in \{\text{observer},\text{worker}\}$$

$\operatorname{Compile}_{observer}$ can produce an HTML page with anomaly badges, stat cards, episode drill-downs, and provenance links. $\operatorname{Compile}_{worker}$ can produce a shorter `GOAL / NOW / ANOMALY / COUNTERS / FILES / KEY FACTS` block. The two views may look different while still sharing the same $R_t$. `Fold` controls what state is retained; `Compile` controls which projection a consumer receives.

This layering also makes the deterministic boundary explicit. The non-extractor fold, aggregate, and renderer can be replayed through tests. The optional semantic extractor is an LLM: its output can be memoized per event and carry provenance, but it cannot be called cross-environment deterministic after cache loss or model retirement.

## Walk one representative input through the method

The following is a faithful, simplified walkthrough of the CONTINUE chain family. It explains the data flow, not a new experimental result.

1. **Input:** The first file points to the next file, and each file carries one delta. The goal is to traverse 120 dependency links, add every delta, and write `total = <sum>`. Search is disabled in this chain protocol so the Agent cannot bypass the dependency structure through external lookup.
2. **Intermediate representation:** The Agent run writes append-only JSONL. An adapter turns each content block into a typed event, preserving tool-call/result correlation, byte offsets, cache-aware usage, and a SHA-256 fingerprint of original content. Most payloads are stored by reference; malformed lines are quarantined, and unknown record types are retained rather than silently discarded.
3. **State transformation:** The fold stores `node/<id>:delta` facts with source-scoped identity. When the bounded store evicts old numeric values, their per-key count and sum move into an aggregate. Re-reading an event should not count it again. The renderer also adds coverage to the aggregate so the worker can see which source has already been included.
4. **Decision and output:** Every five steps, the curator re-materializes a compact view from the worker's own trace and pairs it with the last five raw steps. Instead of seeing all 120 files again, the worker sees the frontier, errors, tool counters, and a coverage-aware state such as `[aggregate] delta: 120 values total, sum = 5281`. It then writes the answer.
5. **Likely failure point:** If the aggregate already covers the last file but the view does not say so, the worker can add that file a second time. The paper's five curated misses are this kind of last-mile ambiguity: the fold had the correct total, but the worker added a final already-included delta. After adding a coverage stamp, all five motivating failures recovered in the rerun.

The point is not the arithmetic of `sum`. It is the change in intermediate representation. Raw history is a sequence of events; `RunState` is a queryable, bounded object that can state its own coverage boundary.

## Technical mechanism: the four layers

### 1. Ledger: append-only is a parser precondition

In Section 3, the ledger is primarily a typed event stream. The source framework can repeat the same message-level usage on every content block. The adapter converts blocks to events while preserving causal chains, tool-call/result pairing, cache-aware usage, and reference-based payload storage. For content-bearing records—messages, thinking, tool calls and results, and compaction summaries—the complete original text receives a SHA-256 fingerprint. A view may inline only a bounded excerpt while still retaining a link to the original content identity.

The parser adds several engineering defenses:

- Under the observed append-at-tail writer discipline, with no rotation, truncation, or replacement, a byte offset can serve as a resume token. The parser does not consume a partial line.
- Malformed lines are quarantined and counted; unknown record types are retained. The observer page can therefore show a materialization point and malformed count instead of hiding ingestion damage.
- If a block-exploded transcript is not deduplicated by API message ID, token accounting inflates by up to 3.49× in the verification session. This is not a cosmetic bug: token and cost ratios become wrong together.
- Across the ten largest transcripts, 104 MB and 16,737 events parse in about 0.4 seconds on one Apple silicon performance core under a warm-cache, single-threaded timing. The paper calls this indicative; it excludes optional LLM extraction and view materialization, so it is not a complete benchmark.

### 2. RunState: a bounded store is not newest-wins

RunState is produced by a single-pass fold. It stores execution position, goal, frontier, pending calls, counters not exposed by the SDK, touched files, and facts. A fact key uses source-scoped identity, such as `file:key`; repeated occurrences of the same key count as repeated observations rather than replacing one another with the newest value.

The key discipline is **aggregate-preserving eviction**. When the visible fact store becomes too large, an old numeric value can leave the visible set while its count and sum remain in the corresponding aggregate. This guarantees only the statistics explicitly declared for tracking. It does not pretend to preserve arbitrary detail. If a future task needs a median, an order, a paired relationship, or another non-commutative operation, that information must be modeled first; the existing sum cannot stand in for it.

The paper checks this layer with two kinds of oracle. Chunked ingestion and whole-file parsing agree under property tests. An independent from-scratch recount written against raw JSONL reproduces every per-key fact and aggregate sum on five chain-120 traces with zero mismatches. Bookkeeping fidelity is separately mutation-tested on 8/8 fields.

### 3. Derived nodes: revise the past without erasing it

Some live-run states can be recognized only after a later turn. An interrupted turn becomes visible when the next user turn arrives with dangling calls; a late result must attach to the episode that issued it. For hindsight re-parsing, a derived node is not overwritten by the newest interpretation. It stores a versioned episode digest with a validity lifecycle such as `current`, `suspected-stale`, and `invalidated/superseded`.

This separates the best current interpretation from the interpretations that existed earlier. For incident review or audit, that is more useful than a log that contains only its latest summary. In production, it also means schema versions, staleness propagation, and terminal-state guards need to become migration contracts rather than prompt instructions.

### 4. Compiled views and curator: one state, two readings

The observer view is an HTML page with a goal, live frontier, anomaly badges, stat cards, episode drill-downs, provenance links, and an honesty watermark that states the materialization point and malformed count. The worker view is compact text that organizes key facts, running aggregates, files, counters, and recent steps for the model.

In the deployed setup, the curator re-materializes the worker view from the worker's own recorded trace every $K=5$ steps. The closed loop is:

`worker action → ledger → fold → state → worker view → next worker turn`

This arrangement also surfaces an adoption problem. If the curator is merely another opaque LLM summarizer, the observer and worker can diverge again. That is why the paper places deterministic folding, provenance, coverage, and replayable rendering closer to the core than prose summarization.

## How to read the observer evidence: observer leg

### What does COMPREHEND test?

COMPREHEND uses 12 real transcripts totaling 112 MB, with 70 monitoring questions per condition and one reader call per transcript-condition. The LLM reader is an observer proxy, not an LLM judge: a question builder derives questions mechanically from ledger ground truth, and answers are scored with exact match, substring, or set-F1 rules.

| reader / condition | raw tail | flat log | compiled view |
| --- | ---: | ---: | ---: |
| Sonnet 5 accuracy | 0.479 | 0.621 | **0.871** |
| Haiku 4.5 accuracy | 0.476 | 0.522 | **0.850** |
| Sonnet 5 panel input | 779K tokens | 479K | **57K** |
| Haiku 4.5 panel input | 652K tokens | 372K | **43K** |
| Sonnet 5 panel cost | $2.37 | $1.59 | **$0.42** |
| Haiku 4.5 panel cost | $0.53 | $0.32 | **$0.08** |

**What does the experiment test?** It tests whether a consumer with no direct API access, limited to reading a textual rendering under a fixed budget, can answer questions about run state. **What is held constant?** The transcripts, question builder, reader, reading budget, and grading rules; the representation changes between raw tail, flat log, and compiled view. **What changes?** The view raises accuracy by about 0.37–0.39 for both readers and lowers input tokens by approximately 14–15× for the same reader. **What may explain it?** Aggregation retains whole-run facts that the budget cannot reach in the raw tail. **What does it not establish?** It does not establish that an LLM is necessary, or that every monitoring question outside the schema will improve.

![Parsing the Stream Figure 2: observer accuracy for raw tail, flat log, and compiled view in COMPREHEND, with input-token totals for each condition.](/paperReading/43-parsing-the-stream-live-trace/paper/figure-2-comprehend.webp)

*Figure 2, COMPREHEND accuracy in Section 5.1: the compiled view is higher for both Sonnet 5 and Haiku 4.5, but the questions are co-designed with the view schema. Token counts are panel totals over 12 reader calls, not one call; [Original Figure 2](https://arxiv.org/html/2609.01466v1#S5.F2) · [Original image endpoint](https://arxiv.org/html/2609.01466v1/figures/fig2_comprehend.png). The image is taken from arXiv HTML, which marks the paper CC BY 4.0; attribution is retained and the PNG is converted to WebP for this site.*

Two corrections matter. First, the 0.871/0.850 compiled-view scores and 0.479/0.476 raw-tail scores use the same experimental conditions, but a cross-model cost ratio of about 30× mixes model-tier pricing. The appropriate summary is the same-reader 5–7× reduction. Second, these 70 questions are not a schema-independent observer exam. Whole-run aggregation questions require the view, while the dangling-call question is 0.917 in every condition because 11 of 12 transcripts share the majority answer `none`; it contributes little discrimination.

The authors also report transcript-level bootstrap 95% intervals: Sonnet view 0.86 [0.78, 0.93] versus raw 0.51 [0.42, 0.61], and Haiku view 0.81 [0.74, 0.88] versus raw 0.46 [0.39, 0.54]. These intervals quantify transcript resampling for a fixed, size-selected corpus. They do not capture reader-call noise or imply transfer to a wider session population.

## How to read the agent evidence: agent leg

The CONTINUE workbench's chain family makes each file point to the next, defines the answer as the sum of all deltas, and verifies success against deterministic final environment state. The design has a strength: it isolates whether a context policy retains an accumulating statistic. It also has a cost: the task generator, fold mechanism, and extension experiments evolved together.

### Primary comparison: clean protocol, 120 links, $n=30$

| arm | success | cost per run | cache |
| --- | ---: | ---: | --- |
| curated view (fold) | **30/30** | $1.59 | cached |
| scratchpad (full context + note instruction) | **30/30** | $0.97 | cached |
| full context (flat) | 8/30 | $7.13 | uncached |

This is Table 2's final protocol: identical seeds, shipped renderer, and no injected errors. Against full context, the curated arm has 22 sole successes and 0 sole failures; exact two-sided McNemar $p \approx 5\times10^{-7}$. The authors label it descriptive because the design was not preregistered and the task and system co-evolved. The central comparison is not “the fold beats the scratchpad”—both are 30/30. It is that the fold places deterministic, auditable state and the observer view on the same substrate.

### What do the controls tell us?

Figure 3 and Table 3's development-era grid give a fuller picture. At 120 links, full context is 7/30, curated is 25/30, cached scratchpad is 26/30, mask-plus-notes is 10/10, the calculator tool is 10/10 at about $14.88, retrieval-over-trace is 0/10, and uncapped summarization is 3/10. The controls imply:

- **Several mechanisms can succeed when they carry the running statistic.** The fold is not the only route through the chain.
- **Prompting is a first-order treatment.** One instruction to emit a per-step note moves development-era full context from 7/30 to cached scratchpad 26/30.
- **Packaging and caching change cost.** Flat full context is uncached, while cached notes can be cheaper than the curated fold. The $1.59 versus $7.13 comparison does not show that the trace model is inherently the cheapest option.
- **External state is not sufficient by itself.** Retrieval stores the full trace outside the prompt and still fails because top-k relevance does not preserve a statistic that requires every item.

![Parsing the Stream Figure 3: success rate and per-run cost across dependency horizons, with cached and uncached conditions marked.](/paperReading/43-parsing-the-stream-live-trace/paper/figure-3-crossover.webp)

*Figure 3, the development-era grid in Section 5.2: the left panel shows success by horizon and the right panel shows cost by horizon. The 120-link primary clean comparison is Table 2; different cell sizes and the injected-error protocol in this figure must not be combined into one leaderboard. [Original Figure 3](https://arxiv.org/html/2609.01466v1#S5.F3) · [Original image endpoint](https://arxiv.org/html/2609.01466v1/figures/fig3_crossover.png). The image is taken from arXiv HTML, which marks the paper CC BY 4.0; attribution is retained and the PNG is converted to WebP for this site.*

## Eleven requirements surfaced by failure

The paper does not present its 11 rules as universal laws established by a preregistered factorial ablation. They come from a sequential development ladder: a variant failed, the authors identified a missing property, and the property was implemented and pinned with a regression test. That makes the data model unusually teachable for engineers because each field connects to a concrete failure, while also making clear that the requirements remain hypotheses for this task family.

| # | requirement | failure it prevents |
| ---: | --- | --- |
| 1 | carry facts, not references | A view retained file references but not their contents, causing re-reading loops; content pinning moved scatter from 0.20 to 1.000 |
| 2 | occurrence identity, not newest-wins | Multiple deltas with the same key collapsed into the last value |
| 3 | never truncate silently | The renderer said “complete list” while retaining only the last 40 facts, corrupting totals |
| 4 | source-scoped identity | Equal values from different files were merged incorrectly |
| 5 | deterministic running aggregates | Arithmetic over 30 values was deferred to the end and slipped |
| 6 | aggregate-preserving eviction | Early values disappeared under the 120-link bounded cap |
| 7 | re-read idempotence across eviction | Re-reading an event double-counted it; the verification case gained +65 |
| 8 | canonical key schemas across extraction batches | Different phrasing fragmented one accumulator into several keys |
| 9 | refusal-tolerant batching | A safety classifier rejected a batch of individually benign machine text |
| 10 | verbatim validation of extracted facts | Batch nondeterminism invented a phantom value; the case gained +41 |
| 11 | aggregates state their own coverage | The fold was correct but the worker added an already-included final delta; the coverage stamp recovered all five motivating failures |

Requirements 3, 7, 10, and 11 are the most portable engineering lesson. Together they say: **retaining data does not mean the consumer understands its boundary, and extracting a fact does not mean the fact has been checked against its source.** A dashboard can look polished while still producing an untraceable final error if it omits the materialization point, source range, extraction validity, and coverage.

## The parser has its own failure boundary

The live trace model is not a completely deterministic parser. Once optional semantic extraction enters the pipeline, it adds availability, schema drift, refusal, batch-nondeterminism, and model-retirement failure axes.

Figure 4's prose-chain-60 diagnostic uses only $n=3$. The full-context arm scores 0.333, curated with a $0 parser$ scores 0.000, the small parser scores 1.000 at about $0.80 total and $0.023 parser cost, and the frontier parser scores 0.667 at about $1.01 total and $0.24 parser cost. The recovery ladder moves from 0 for plain batches to 0.333 after bisection, then 0.667 after a fallback model; verbatim validation remains at 0.667.

This is not enough data for a model-quality ranking. The cells have three seeds, and the authors position them as a diagnostic of parser availability and validation. The narrower engineering conclusion is: **if an extractor becomes infrastructure, measure refusal rate, retry strategy, canonical schemas, source validation, and per-event cost—not only average parser latency.**

![Parsing the Stream Figure 4: success and cost for prose-chain extraction arms and the parser recovery ladder.](/paperReading/43-parsing-the-stream-live-trace/paper/figure-4-parser.webp)

*Figure 4, the parser diagnostic in Section 5.5: the left panel compares full context, $0 parser$, small parser, and frontier parser; the right panel adds bisection, a fallback model, and verbatim validation step by step. With $n=3$, these cells are directional diagnostics rather than a robust model leaderboard. [Original Figure 4](https://arxiv.org/html/2609.01466v1#S5.F4) · [Original image endpoint](https://arxiv.org/html/2609.01466v1/figures/fig4_parser.png). The image is taken from arXiv HTML, which marks the paper CC BY 4.0; attribution is retained and the PNG is converted to WebP for this site.*

## Boundary: when should you not use a fixed fold?

Much of the paper's value comes from not treating 30/30 as a universal capability. The authors actively look for tasks on which the fold fails.

### Alternating-sign chain: order itself is information

In the boundary family, the $k$-th file contributes its delta with sign $(-1)^{k+1}$. The operation makes traversal order matter; a per-key sum is no longer sufficient because the answer depends on sequence. At 60 links, curated view scores 3/10 and full context 6/10; at 120 links, both score 0/10. The cached scratchpad on the same alternating family scores 5/5 at 60 links and 9/10 at 120 links.

This is the key counterexample: **a fixed aggregate works only when the preserved statistic matches the task operation.** The result must not be rewritten as “structured state beats raw history.” A more accurate reading is: “for accumulation tasks, an appropriate state discipline can prevent long context from losing a known statistic.”

### Short horizons: not every small task needs curation

On the short-horizon scatter task, full context scores 1.000 while structure-only curation scores 0.20; adding content pinning restores curation to 1.000. If the task needs only a few raw contents, compressing them into structure too early can hurt the worker. A bounded view is not better simply because it is smaller; it must know which content must remain verbatim.

### Security boundary: provenance is not safety

The curator feeds trace-derived content, including tool outputs, back into the worker's context. A SHA-256 fingerprint, source link, and verbatim validation can establish where content came from. They cannot establish that the content should be treated as an instruction. The paper explicitly leaves prompt-injection analysis, provenance-based policy, and secret redaction for future work; multi-session and multi-agent ledgers are also untested. For now, the work is best treated as an observability and context-architecture case study, not as a security-certified Agent memory layer.

## Evidence map: what the paper supports and what it does not

| layer | precise reading |
| --- | --- |
| **Directly supported by the paper** | Under the specified schema, reader, and budget, the compiled view makes ledger-scoped monitoring questions easier to answer than a raw tail or flat log; in the co-developed 120-link chain protocol, both the curated fold and scratchpad are more reliable than plain full context. |
| **Author's conditional interpretation** | Success is attributed mainly to the deterministic aggregate and boundedness; observer token and cost reductions must be read as conditional on schema coverage. The fold's distinct value is auditability, provenance, and serving both consumers from one state. |
| **Not established** | A fixed aggregate does not cover every Agent trace; not every context compressor will fail like the raw tail; and the paper does not establish transfer across vendors, externally authored tasks, multi-agent or multi-session runs, adversarial tool output, or production SLAs. |
| **Bloss0m engineering judgment** | The portable contract is `source identity + coverage + validity + aggregate + replay`, not the paper's worker prompt or $K=5$ curator cadence copied unchanged into production. |

## Artifacts and reproducibility: public is not one-click rerunnable

As of **2026-09-07**, I checked the paper, the official GitHub repository, and the Hugging Face dataset page independently:

- **Official code: accessible and well documented.** [`SalesforceAIResearch/tracelab`](https://github.com/SalesforceAIResearch/tracelab) is public. Its README lists `src/tracelab/`, four benchmark harnesses, 99 regression and property tests under `tests/`, `tools/recount_oracle.py`, `bench/scoreboard.json`, `bench/spend.json`, and the synthetic CONTINUE traces. The repository is BSD-3-Clause licensed, and the README provides `uv sync --extra dev`, `uv run pytest -q`, and the recount-oracle entry point.
- **Synthetic corpus: named in the paper, but the page has an availability problem.** The [Hugging Face dataset card](https://huggingface.co/datasets/Salesforce/tracelab-comprehend) shows arXiv 2609.01466, CC-BY-4.0, a train split, and `n<1K`. At the time of checking, the Dataset Viewer could not load the split; it reported `StreamingRowsError` and a 401 / repository-not-found error for a revision file request. I therefore do not describe this as “downloaded from HF and rerun.” The seeded generator in the repository README is the more reliable reproduction path.
- **Real transcripts: explicitly withheld.** The paper and README state that COMPREHEND's 12 real sessions contain personal working sessions and are not released. The harness can run on a reader's own local Claude Code transcripts. Consequently, the strongest real-corpus observer result cannot be recalculated externally on the identical data.
- **LLM-backed reruns: environment-dependent.** The README says the benchmarks call Anthropic models on Vertex AI and require `ANTHROPIC_VERTEX_PROJECT_ID` and `CLOUD_ML_REGION`. Endpoint availability, pricing, and cache behavior affect rescoring. The released CONTINUE code and synthetic traces are useful to start with, but cloning the repository is not the same as reproducing every paper number.

The smallest meaningful reproduction path is to run the repository's CONTINUE 120-link final-protocol cell, compare curated, full, and scratchpad arms, run `tools/recount_oracle.py`, and inspect the coverage-stamp and parser regression tests. That validates the fold, accounting, and shipped traces. It does not replace the withheld real corpus or establish external validity across vendors.

## Engineering decision: adopt a trace contract, not another summary prompt

For a long-horizon coding, browser, or enterprise workflow Agent, I would extract the following minimum contract from the paper:

1. Every event needs a stable ID, source reference, schema version, timestamp or turn, payload fingerprint, and ingest status.
2. Every fact needs source-scoped identity, occurrence identity, validity, and extraction provenance. Unknown, malformed, refused, and superseded records must not disappear silently.
3. Every aggregate needs an explicit computation rule, count or sum coverage, last included source, and a status that can become invalid under eviction or schema change.
4. Worker and observer views can differ, but they must be generated from the same replayable state. Any LLM extractor needs fallback behavior, verbatim validation, refusal-rate measurement, and cost accounting.
5. Before removing a raw event, ask whether the task needs order, pairing, median, negative evidence, or another property that the current aggregate cannot reconstruct.

This design is a good fit when:

- a long run needs whole-run counts, accumulation, a completed or pending frontier, and provenance drill-down;
- the observer and worker must share the same factual substrate so that the dashboard and next prompt do not disagree;
- incident review requires parser replay, staleness diagnosis, or proof of which source a value covered.

It should not be applied directly when:

- the task depends on traversal order, cross-event relationships, or an unknown statistic while the fold stores only simple aggregates;
- tool output may contain prompt injection, secrets, or tenant-sensitive data without a separation between data and instruction planes or a policy gate;
- multi-agent, multi-session, and rapidly evolving schemas have not been tested for identity isolation, migration, and stale propagation;
- the only goal is reducing prompt tokens and there is no observer, audit, or replay requirement. In that case, cached scratchpad or provider-side caching may be cheaper, and the paper itself does not prove that the fold is the least expensive choice.

The connection to existing Bloss0m readings is also precise. [ADIAS](/en/paper-reading/20-adias-issue-centric-agent-optimization/) turns self-improvement into an issue lifecycle across optimization rounds. [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/) moves tool-use grounding and execution into mid-training. [Indirect Prompt Injection](/en/paper-reading/42-indirect-prompt-injection/) warns that retrieved or tool content can enter the instruction channel. Parsing the Stream supplies a different control point between them: **while a run is live, which trace facts can be read by whom, and with what coverage can they be fed into the next step?**

## Three things to remember

1. **Technical idea:** Fold a long trace into typed, replayable `RunState`, then compile different views for the observer and worker. Do not give two consumers unrelated opaque summary prompts.
2. **Strongest evidence:** On 12 real sessions, compiled-view observer accuracy is 0.850–0.871 versus 0.476–0.479 for raw tails. On the clean 120-link protocol, curated fold and scratchpad are both 30/30, but the fold adds deterministic provenance and one shared state for both consumers.
3. **Adoption boundary:** An aggregate is reliable only when its preserved statistic matches the task operation. Order-sensitive chains, untrusted tool output, multi-agent ledgers, schema evolution, and transfer to independent real corpora still require external validation.

## Primary sources

- [Parsing the Stream: A Live Trace Model for Long-Horizon Agents and Their Observers (arXiv:2609.01466 v1)](https://arxiv.org/abs/2609.01466)
- [Full arXiv HTML text with Figures 1–4, Tables 1–5, and Appendices A–E](https://arxiv.org/html/2609.01466v1)
- [SalesforceAIResearch/tracelab official repository](https://github.com/SalesforceAIResearch/tracelab)
- [Salesforce/tracelab-comprehend dataset card](https://huggingface.co/datasets/Salesforce/tracelab-comprehend)
