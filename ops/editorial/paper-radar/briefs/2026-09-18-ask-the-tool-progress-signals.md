---
stableId: "arxiv:2609.18849"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-18
lastVerifiedAt: 2026-09-18
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# Ask the Tool, Don't Guess: Agent Tool Calls Hold Their Progress, and the Serving System Should Read It

## Identity

- Search window: Strict 72-hour scan ending 2026-09-18; arXiv v1 was submitted on 2026-09-16 at 15:54 UTC.
- Canonical URL: https://arxiv.org/abs/2609.18849
- Full paper: https://arxiv.org/html/2609.18849v1
- Authors: Yipeng Liu, Yingqiang Zhang, Feifei Li, and Huanchen Zhang.
- Venue or review status: arXiv preprint in cs.DC, cs.AI, and cs.OS; no peer-review status was assumed.
- Code / model / data: The paper does not link a paper-specific author repository in its primary record. It evaluates a vLLM engine patch on four H100 GPUs and studies traces from public agent corpora.

## Editorial fit

- Reader question: Why should a serving system guess how long a tool call will run when the tool already knows how much work remains?
- Why this belongs in the selected track: It connects the tool boundary to KV-cache residency, scheduling, host-memory offload, and post-tool latency, making tool progress a runtime contract rather than a UI status line.
- Gap it fills: agent-systems / tool-use-reliability, especially progress semantics, long-running tools, cache policy, and observability side channels.
- Why now: Long tool calls keep an agent's KV cache resident while the serving system waits. A progress event can change whether the cache stays on GPU, moves to DRAM, or is released and reloaded.

## Claim map

- Problem: Tool duration depends on load, neighbors, and remote APIs, so tool names, histories, declared durations, and occupancy estimates cannot reliably rank calls or predict completion.
- Main claim: A progress stream emitted while a tool runs is more informative and more robust than pre-call duration predictors, and a few serving-layer hints can improve post-tool TTFT.
- Method: Recover progress through parser, environment-trace, and agent-instrumentation layers; expose call ID, work-done/total when known, phase, and timestamps; let the serving controller refresh, release, or reload KV caches according to the signal.
- What is genuinely new: The paper treats tool execution as a co-designed protocol between the tool, agent harness, and serving engine. It also models untrusted or lying progress through credit ledgers rather than assuming every report is honest.

## Evidence audit

- Datasets: A census covers four public agent corpora, including mini-SWE-agent, OpenHands, Terminal-Bench, and OpenTelemetry traces. The paper analyzes which tool time has recoverable progress signals.
- Benchmarks and metrics: The harness compares progress-derived estimates with published predictors at KV-cache decision points, tests agent score and behavior preservation, and evaluates a production-engine integration on four H100 GPUs.
- Baselines: The serving comparison is against LRU cache handling and an oracle-like decision boundary. The paper also compares strong and weak progress signals with pre-call predictors.
- Ablations: Parser, environment-trace, and agent-instrumentation layers expose progressively more signals; the paper reports realistic calls with less than 1% harness overhead and a preliminary lying simulation where credit recovery limits memory retention.
- Statistical uncertainty: The headline result is p90 post-tool time to first token lower by 20.7% with HBM-only handling and 20.8% with HBM plus DRAM versus LRU, close to the oracle. The paper does not present a broad provider or workload confidence analysis.
- Threats to validity: Remote APIs and waits before first byte may reveal no progress; unknown formats and scripts remain opaque; instrumentation or dry runs can alter behavior; tenant-controlled progress reveals workload structure and may be sensitive.

## Reproducibility

- Available artifacts and licenses: The paper gives detailed event semantics and implementation changes, but no paper-specific author code, trace bundle, or vLLM patch repository was verified from the primary record. Public agent projects and vLLM provide context, not a reproduction package.
- Environment or compute requirements: Reproduction needs tool traces, parsers or instrumentation, a serving engine with KV-cache controls, and multi-GPU hardware or a faithful simulator.
- Smallest useful reproduction: Instrument one long-running local tool with a monotonic progress counter and end marker, compare a duration predictor with progress-based scheduling, and measure cache residency and post-tool TTFT under a small synthetic load.
- Blocking unknowns: The exact production-engine patch, corpus preprocessing, workload mix, and oracle controller details are not packaged as a clean public artifact.

## Critical reading

- Strongest result: A runtime-facing progress contract produces a measurable serving outcome without changing the agent's observed behavior in the tested harness.
- Weakest assumption: Tools can expose progress that is both meaningful and safe. Many real tools have dynamic work, remote waits, opaque scripts, or no trustworthy total, and a false signal can cause an expensive cache decision.
- Stated limitations: The paper calls out remote API opacity, instrumentation behavior changes, privacy/side-channel risk, and tenant-controlled reports.
- Claims not supported by the evidence: The results do not establish a universal progress schema, production savings for all agent workloads, or safety against malicious progress reports.

## Bloss0m connection

- Related Traditional Chinese routes: [When Tool Calls Succeed but Workflows Fail](/paper-reading/49-when-tool-calls-succeed-workflows-fail/), [Predicting Partial Answer Quality and Utility in Agentic RAG](/paper-reading/53-agentic-rag-partial-answer-prediction/), and [Parsing the Stream](/paper-reading/54-parsing-the-stream-live-trace-model/).
- Related English routes: [When Tool Calls Succeed but Workflows Fail](/en/paper-reading/49-when-tool-calls-succeed-workflows-fail/), [Predicting Partial Answer Quality and Utility in Agentic RAG](/en/paper-reading/53-agentic-rag-partial-answer-prediction/), and [Parsing the Stream](/en/paper-reading/54-parsing-the-stream-live-trace-model/).
- Duplication risk: Low-medium. Existing readings cover tool success semantics and live traces; this candidate adds serving-level cache control and progress honesty.
- Suggested internal links: Tool event schemas, cache economics, long-running workflow observability, and MCP progress notifications.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: unusually direct systems relevance, a clear protocol-level novelty, multi-corpus evidence plus a serving experiment, and high engineering value. Reproducibility is 3 because the paper-specific patch and traces were not publicly verified, despite the detailed method.
- Open questions requiring human approval: What is the minimum interoperable progress event? How should a tool report uncertainty or retract a bad counter? Which trace fields can be exposed without leaking sensitive workload structure?
