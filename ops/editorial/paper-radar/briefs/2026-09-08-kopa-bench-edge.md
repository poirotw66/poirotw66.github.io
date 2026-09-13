---
stableId: "arxiv:2609.05395"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-08
lastVerifiedAt: 2026-09-08
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

# KOPA-Bench and EDGE: execution-grounded tool calling over live public APIs

## Identity

- Stable ID: `arxiv:2609.05395`.
- Canonical URL: https://arxiv.org/abs/2609.05395
- Authors: Dain Kim, Eungi Cho, Kyumin Kim, Shinyeong Noh, and Kyuseong Lim.
- Venue or review status: arXiv v1 submitted 2026-09-04; accepted to EMNLP 2026 Industry Track according to the arXiv record.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2609.05395`; no separate venue record located.
- Code / model / data: Paper HTML is available at https://arxiv.org/html/2609.05395v1. The companion repository is https://github.com/dneirfi/EDGE-KOPA, but its README says code, benchmark, and checkpoints are still being prepared; do not treat the placeholder repository as a released reproduction package.

## Editorial fit

- Reader question: How should an agent learn tool dependencies when API links, authentication lookups, pagination, and response cardinality only become real after execution?
- Why this belongs in the selected track: It fills `agent-systems` / `tool-use-reliability` with a live-API benchmark and a data-synthesis loop grounded in execution evidence.
- Gap it fills: Existing tool-calling benchmarks often use simulated or frozen services and mostly one-record handoffs; KOPA-Bench measures dependent calls across live public APIs with high-cardinality outputs.
- Why now: The paper defines 145 tasks over 2,318 typed tools across six domains and reports +10/+13 percentage-point pass@1 gains for fine-tuned 9B/4B models, with transfer to BFCL.

## Claim map

- Problem: Small open models skip prerequisite lookups, answer from the first page of a paginated response, and mis-handle one-to-many tool dependencies.
- Main claim: EDGE can refine a tool-dependency graph by live execution and synthesize trajectories that preserve cardinality-aware handoffs; GRPO on those trajectories improves multi-step tool calling.
- Method: Build candidate edges from typed signatures, probe them against live endpoints with posterior updates and pruning, then synthesize sequential, fan-out, reduction, parallel, comparison, and conditional trajectories.
- What is genuinely new: Execution is used to decide which tool edges survive and how output cardinality should become a trajectory type, instead of trusting schema similarity or an LLM plan alone.

## Evidence audit

- Dataset and construction: 145 expert-authored tasks across 10 platforms and six domains, 2,318 live tools, average 4.92 tool calls, and up to 224,958 returned records at a junction.
- Metrics: RESPONSE, ENVIRONMENT, and ACTION axes; pass@1/pass@4; tool-call correctness and efficiency; eight-seed confidence intervals; held-out-platform and contamination audits.
- Baselines: Claude Sonnet 4.6, GPT-5.1, several open models, and Qwen3.5-4B/9B before and after EDGE+GRPO.
- Strongest reported result: Qwen3.5-9B pass@1 rises from 0.3275 to 0.4310 and Qwen3.5-4B from 0.1758 to 0.3094 on KOPA-Bench; withheld-platform gains and BFCL transfer are also reported.
- Threats to validity: Live endpoints drift and rate-limit; proprietary models are used for verification; the public repository is a release placeholder; Korean public-API/domain transfer, training cost, and long-term benchmark maintenance remain unknown.

## Reproducibility

- Available artifacts and licenses: Full paper/appendix and a public repository skeleton are available; the paper states code and data availability, while the repository explicitly says the release is not public yet. Benchmark/source licensing follows KOGL and platform attribution requirements.
- Environment or compute requirements: Live API keys, MCP servers, endpoint reachability, 8×H100 training, verl/vLLM, and reproducible snapshots of mutable public APIs.
- Smallest useful reproduction: Recreate a small typed API graph with recorded responses, compare schema-only versus execution-pruned edges, and evaluate cardinality-aware trajectories on held-out tasks.
- Blocking unknowns: Release date and versioning, snapshot strategy, endpoint drift protocol, full task/data license package, and whether the public artifact includes trained checkpoints and exact prompts.

## Critical reading

- Strongest result: The evaluation separates final response, resulting environment state, and the action path, making a tool-calling success less likely to hide an invalid or wasteful trajectory.
- Weakest assumption: Execution success on today's live public APIs is a stable proxy for a tool dependency that will remain valid as endpoints, schemas, and policies change.
- Claims not supported by the evidence: The reported gains do not establish reliable tool use across private enterprise APIs, write-capable tools, or languages/domains outside this benchmark.

## Bloss0m connection

- Related series areas: `tool-use-reliability`, agent evaluation, MCP integration, and production retrieval/tool operations.
- Related candidates: SilentProbe, DRACO, SARA, The Bitter Lesson of Tool Calling, and existing MCP/AgentCore coverage.
- Duplication risk: Medium; differentiate by centering live dependency discovery and cardinality-aware trajectory synthesis rather than another generic function-calling benchmark.
- Suggested internal links: `34-model-context-protocol-mcp`, `64-ai-agent-guide`, `85-trec-rag-2026-rag-evaluation-harness`, and `tool-use-reliability`.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 5 evidence quality + 3 reproducibility + 5 engineering value + 5 series value = 28. The benchmark, controls, ablations, and live-execution framing are strong; the missing release artifact and endpoint drift require explicit critical treatment.
- Open questions requiring human approval: Wait for the promised repository release or clearly scope the reading as a paper-method critique; verify the exact license and snapshot/reproduction protocol before publication.

