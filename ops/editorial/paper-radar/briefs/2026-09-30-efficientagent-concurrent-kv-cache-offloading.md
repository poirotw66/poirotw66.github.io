---
stableId: "arxiv:2609.33762"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-30
lastVerifiedAt: 2026-09-30
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 4
  total: 28
decision: "deep-read-candidate"
---

# EfficientAgent: What Makes KV Cache Offloading Work for Concurrent Agents?

## Identity

- Search window: 2026-09-27 through 2026-09-30; arXiv v1 submitted 2026-09-27.
- Discovery queries: `arXiv concurrent agents KV cache offloading September 2026`; `agent serving reuse working set host memory KV cache`; `SWE-bench agent inference cache admission replay code`.
- Canonical URL: https://arxiv.org/abs/2609.33762
- Full paper: https://arxiv.org/html/2609.33762v1
- Authors: Kunming Shao, Jierun Chen, Jiangnan Yu, Xiao-Hui Li, Chaofan Tao, Yanli Wang, Huanxin Lin, Kwang-Ting Cheng, Chi Ying Tsui, and Haoli Bai.
- Venue or review status: arXiv preprint. The public repository describes it as an ICLR 2027 submission; acceptance is not established by the inspected sources.
- DOI / OpenReview / arXiv aliases: arXiv:2609.33762v1; DOI 10.48550/arXiv.2609.33762.
- Code / model / data: [Apache-2.0 implementation and replay tools](https://github.com/KunmingSHAO/efficientagent_release). The README documents input traces and a synthetic-trace path; the original paper traces were not confirmed as bundled.

## Editorial fit

- Reader question: When does copying an agent’s KV cache from GPU memory to host memory actually save time—and when does it just create eviction traffic?
- Why this belongs in the selected track: It studies a serving decision caused by concurrent agent loops, where a context is reused only after that agent returns from tool execution while other agents have consumed the shared cache tier.
- Gap it fills: agent-systems / agent-evaluation, by making serving latency and recomputation costs measurable under a controlled agent workload.
- Why now: Long-running agents resubmit growing contexts across repeated model turns; inference cost and cache capacity are becoming system-level constraints, not isolated prompt-optimization details.

## Claim map

- Problem: KV offloading can be faster, slower, or neutral across deployments because a cache entry must survive the intervening work of the entire concurrent agent pool before it can be reused.
- Main claim: The relevant capacity target is the reuse working set between uses, not the size of one request. A stack-distance estimator predicts that capacity; under pressure, a write-admission policy declines large refills likely to be evicted before reuse.
- Method: The authors profile recorded agent histories, estimate reuse distance/working-set size, then evaluate offloading and conditioned write admission through dependency-preserving replay. Replay holds token sequences fixed so serving configurations process comparable model work while wall-clock timing changes.
- What is genuinely new: The paper turns a qualitative “host RAM may help KV cache” rule into a capacity threshold based on concurrent agent interleavings and a runtime admission rule that changes behavior when the tier is under pressure.

## Evidence audit

- Datasets: SWE-bench Verified coding-agent histories; the paper also varies model and hardware configurations. The public repository documents how to construct a trace from agent logs but does not confirm that the authors’ original raw traces are included.
- Benchmarks and metrics: Recomputed prompt tokens, end-to-end replay time, host-tier traffic, hit/reuse behavior, and capacity sensitivity.
- Baselines: No host tier, offload without admission, fixed write admission, and capacity-conditioned admission; multiple host capacities and hardware configurations.
- Ablations: Admission thresholds and policies, tier size, reuse working-set predictions, and runs across three GPU types and two models.
- Statistical uncertainty: The paper reports workload measurements and sensitivity analyses; no independent reproduction or population-level confidence claim was found in the inspected material.
- Threats to validity: Main evidence is a coding-agent workload, not diverse agent domains. Fixed-token replay isolates serving effects but does not establish that a live agent’s task success or behavior improves. GPU, model, vLLM, and LMCache versions constrain transferability.

## Reproducibility

- Available artifacts and licenses: Apache-2.0 repository with a vLLM/LMCache connector, trace/replay framework, CPU-only analyses, tests, and synthetic traces. Exact paper traces are not confirmed as public.
- Environment or compute requirements: Python 3.10+, vLLM 0.13.0, LMCache 0.3.12, and supported NVIDIA GPUs for full serving runs. The paper uses Qwen3-Coder-30B-A3B-Instruct with tensor parallelism 8. CPU tests and synthetic analysis can run without the full serving stack.
- Smallest useful reproduction: Run the CPU tests and capacity analysis on a synthetic or locally recorded multi-agent trace; then compare no offload, ordinary offload, and conditioned admission with the same token trace on one GPU server.
- Blocking unknowns: Availability/licensing of the original traces, full multi-GPU reproduction cost, and generalization beyond the evaluated coding-agent workload.

## Critical reading

- Strongest result: Capacity-conditioned admission reportedly cuts recomputed prompt tokens by 93% and end-to-end replay time by 39% on the tested SWE-bench workload; the broader comparisons show that offloading helps only when the host tier can retain the reuse working set and the GPU/host-bandwidth ratio makes transfer worthwhile.
- Weakest assumption: A replay with fixed prompts and forced outputs is useful to isolate serving effects, but it cannot show that a changed serving system improves autonomous task completion or remains behaviorally equivalent in live runs.
- Stated limitations: Results depend on the agent-history reuse pattern, host capacity, GPU compute-to-bandwidth ratio, and tested serving stack.
- Claims not supported by the evidence: The paper does not show that host-memory offloading always accelerates agents, that the reported 39% transfers to unrelated workloads, or that agent quality/success improves.

## Bloss0m connection

- Related Traditional Chinese routes: #22 SWE-Bench ProMax; #67 Trajectory-Aware Benchmark Subset Selection.
- Related English routes: The paired #22 and #67 readings.
- Duplication risk: These readings cover benchmark realism and evaluation cost; EfficientAgent is distinct in its inference-serving cache-capacity model and host-tier write admission.
- Suggested internal links: Connect to agent evaluation-cost work, while distinguishing fewer recomputed tokens and faster replay from higher task success.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30 (topic 5, novelty 5, evidence 5, reproducibility 4, engineering 5, series 4). The paper offers a new, testable working-set explanation with multi-GPU/model comparisons and detailed baselines; the Apache-2.0 implementation is substantial. Reproducibility is reduced because the original traces are not confirmed as bundled and the full experiment has significant GPU requirements; series value is strong but the main result is about serving performance rather than agent task quality.
- Open questions requiring human approval: Keep all speed/token claims limited to the tested replay workload; clarify that the repository calls the work an ICLR 2027 submission, not an accepted paper; verify original trace availability before promising exact reproduction.
