---
stableId: "arxiv:2609.04852"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-08
lastVerifiedAt: 2026-09-08
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 27
decision: "deep-read-candidate"
---

# KVMem：把超過 context window 的 Agent workspace 變成可分頁的 KV memory

## Identity

- Search window: strict 72-hour scan from 2026-09-05 00:31Z to 2026-09-08 00:31Z found no newer sufficiently evidenced paper with a stronger systems fit; this candidate is a 7-day backfill from 2026-09-04.
- Canonical URL: https://arxiv.org/abs/2609.04852
- Authors: Di Chai, Leye Wang, Zeshen Su, Zhiguo Xia, and Zhihang Yu.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-04; full HTML paper is available.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.04852
- Code and artifact: No public code link was verified from the arXiv record; treat the measurements as author-reported until an artifact is released.

## Editorial fit

- Reader question: When a long-running agent’s history is too large for GPU memory and the model’s native context, should we summarize it, retrieve it as text, or page the model’s already-computed KV state?
- Why this belongs in the selected track: KVMem moves agent memory management below the text layer. It treats old context as addressable execution state that can live across GPU memory, host memory, and NVMe, then materializes only a bounded view for the next step.
- Gap it fills: Tool-use reliability—preserving fine-grained execution evidence across long agent sessions without repeatedly prefilling or aggressively summarizing history.
- Why now: Long-horizon agents increasingly need persistent workspaces, but context compaction can erase tool-call details and repeated prefill can dominate latency and cost.

## Claim map

- Problem: Summary-only compaction loses detail; text retrieval requires the model to re-encode history; GPU KV capacity and native context windows impose hard limits.
- Main claim: Model-native attention-space indexes and paged KV state can virtualize a workspace up to 1M tokens while keeping each execution view within the model’s native window.
- Method: Keep overflowed KV blocks across memory tiers, index them in attention space, select relevant historical blocks for a query, and materialize a query-dependent execution view.
- What is genuinely new: The paper frames context management as virtual memory for execution state rather than as an application-level document retrieval problem.

## Evidence audit

- Main results: Across LongMemEval, MemoryAgentBench, and AgentLongBench, the paper reports higher task utility and inference efficiency than compaction baselines. On a DeepSWE test with Qwen3.8-27B, success rises from 43.8% compaction-only to 48.4% with KVMem.
- Deployment result: On a 24 GB RTX 5090 Laptop GPU, the authors report Qwen3.6/3.8-27B NVFP4 with MTP serving workspaces up to 1M tokens—four times the stated native 256K context—and about 50 tokens/s in a single-session local setup.
- Baseline or comparison: Compaction-only context management is the direct baseline; the abstract also claims efficiency gains across multiple long-context agent benchmarks.
- Statistical uncertainty: The abstract does not expose confidence intervals, full per-benchmark tables, or independent replication. The central scaling and latency claims remain author-reported.
- Threats to validity: Query-dependent KV selection may fail when relevance is distributed across many distant steps; hardware, model architecture, quantization, MTP, and workload shape all affect the result.

## Reproducibility

- Available artifacts: Full arXiv record and HTML paper; no public implementation or checkpoint was verified from the primary record.
- Environment or compute requirements: 24 GB RTX 5090 Laptop GPU for the reported local deployment; Qwen3.6/3.8-27B NVFP4, MTP, GPU/host/NVMe tiering, and long-context agent benchmarks.
- Smallest useful reproduction: Compare compaction-only, text retrieval, and KV paging on one fixed tool trajectory while measuring success, prefill time, GPU/host/NVMe traffic, and the fraction of recalled blocks that materially affect the answer.
- Blocking unknowns: Index build cost, page fault latency, write amplification, KV compatibility across model revisions, and performance under concurrent sessions.

## Critical reading

- Strongest result: It connects a systems mechanism to agent utility and gives a concrete consumer-GPU operating point, making context overflow an engineering budget question rather than an abstract context-length race.
- Weakest assumption: Attention-space similarity is sufficient to decide which historical execution blocks deserve to be re-materialized for the next action.
- Unsupported leap: A 1M-token addressable workspace is not equivalent to reliable 1M-token reasoning. The agent can still omit a crucial block, and local single-session throughput does not establish production economics.

## Bloss0m connection

- Related routes: local/open-weight inference, agent memory, long-context evaluation, KV cache systems, and tool-use reliability.
- Duplication risk: Medium with the existing Funes memory article and llama.cpp runtime candidate; differentiate by focusing on KV-level virtualization and measurement, not generic persistent memory.
- Suggested internal links: Pair with Funes for application-level memory and with llama.cpp for model/runtime constraints.

## Recommendation

- Output level: Deep Read.
- Score rationale: 27/30: unusually direct engineering consequence and multiple benchmark families, offset by no verified public artifact and limited visible uncertainty reporting.
- Open questions requiring human approval: When does KV paging beat a carefully designed summary/retrieval policy? How should correctness be tested when a recalled block changes a later tool call rather than the final prose?
