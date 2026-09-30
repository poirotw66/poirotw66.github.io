---
title: "EfficientAgent Reading: KV-Cache Offloading for Concurrent Agents"
description: "EfficientAgent asks when moving a KV cache from GPU memory to host memory actually pays off. The answer depends not on one request alone, but on the reuse working set created by concurrent agents between uses. This reading examines capacity prediction, write admission, SWE-bench replay, and hardware boundaries."
pubDate: 2026-09-30
updatedDate: 2026-09-30
tldr:
  - "Agents often resubmit long conversations. KV caching avoids recomputation, but host offloading helps only when cached state survives until reuse and transfer is cheaper than recomputation."
  - "EfficientAgent estimates a concurrent-agent reuse working set, then declines large refills only when capacity is insufficient and the tier is actively evicting; it does not simply write less all the time."
  - "In the authors' fixed-token SWE-bench Verified replay, increasing the H20 host tier from 5 to 20 GiB per rank reduced computed prefill by 93.1% and makespan by 38.7%; this is not an agent-success improvement."
  - "The same admission policy helps avoid thrashing at 5 GiB but raises computed prefill 4.3-fold at 40 GiB. Outcomes depend on concurrency, working-set size, and the GPU-to-host-link cost ratio."
audience:
  - "Engineers building concurrent coding agents, LLM inference, or KV-cache serving stacks"
  - "Researchers evaluating host-memory offloading, prefix caching, and agent-serving costs"
tags: ["Paper Reading", "Agent Systems", "Inference", "KV Cache", "Systems Research", "Performance"]
image: "/paperReading/80-efficientagent-concurrent-kv-cache-offloading/title_image.webp"
field: "AI Systems"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "EfficientAgent: What Makes KV Cache Offloading Work for Concurrent Agents?"
  authors:
    - "Kunming Shao"
    - "Jierun Chen"
    - "Jiangnan Yu"
    - "Xiao-Hui Li"
    - "Chaofan Tao"
    - "Yanli Wang"
    - "Huanxin Lin"
    - "Kwang-Ting Cheng"
    - "Chi Ying Tsui"
    - "Haoli Bai"
  year: 2026
  venue: "arXiv 2609.33762 v1 (2026-09-27; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.33762v1"
    arxiv: "https://arxiv.org/abs/2609.33762"
    doi: "https://doi.org/10.48550/arXiv.2609.33762"
    code: "https://github.com/KunmingSHAO/efficientagent_release"
    project: "https://arxiv.org/html/2609.33762v1"
series:
  id: "agent-serving-memory-systems"
  title: "Agent Serving and Memory Systems"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** After a tool action, an agent often resubmits conversation context the model has already processed. When GPU KV memory cannot hold every concurrent task, host-memory offloading can preserve state—but while one agent waits for a tool, the server processes other agents, and they may evict that state before it is reused.
- **Core insight:** Cache utility depends on how many other KV blocks are referenced between uses, not just on one request's size. The paper calls the resulting capacity demand the reuse working set and predicts it with stack distance. At runtime, it declines large refills only when the estimated working set exceeds the host tier and the tier is actively full and evicting.
- **Strongest evidence:** On an OpenHands/Qwen3-Coder SWE-bench Verified workload, a fixed replay of 4,427 model calls and outputs reduced computed prefill from 76.7M to 5.3M tokens (93.1%) and makespan from 209 to 128 minutes (38.7%) as the H20 host tier increased from 5 to 20 GiB per rank. Figure 2, Table 3, and Sections 5.2–5.7 show that capacity, concurrency, write policy, and GPU type change the outcome.
- **Main boundary:** This measures serving behavior on fixed recorded trajectories, not whether a live agent solves tasks better. At 5 GiB, writing less can avoid repeatedly storing data that will be evicted; at 40 GiB, the same unconditional filter raises computed prefill 4.3-fold. The paper does not show that offloading is always faster.

The paper starts with an intuitive trap: if restoring a KV prefix from CPU memory is cheaper than recomputing it, why can offloading make an agent slower? The authors separate two necessary conditions. First, the hardware cost ratio must make restoration worthwhile. Second, the state must still be in the host tier when the agent returns. In a concurrent server, the latter cannot be inferred from one request: while an agent waits for a tool, other requests keep consuming capacity, so its old prefix competes with the entire active pool. EfficientAgent therefore estimates the reuse working set created by concurrent work, then combines that estimate with capacity and eviction telemetry to decide whether to admit writes. It changes serving policies on a fixed set of replayed trajectories and exposes capacity transitions and hardware sensitivity; it does not establish higher task success or universal transfer. This reading follows arXiv v1, submitted on 2026-09-27. It is a preprint whose peer-review status is not established by the source.

> **Huahua's engineering note**
>
> Do not ask only whether there is enough RAM or whether PCIe is faster than recomputation. The key question is whether a prefix you offload will be read again before competing agents evict it. Capacity and admission belong together: writing less may reduce thrashing when the tier is too small, but it can discard useful reuse when capacity is already sufficient.

## Why the prior approach is insufficient: a cheaper restore can still lose

During decoder-only inference, a model retains key/value (KV) state for processed tokens. If a later request begins with exactly the same token prefix, the server can reuse matching KV rather than run prefill over that prefix again. Prefix reuse has a strict condition: cache keys depend on the complete preceding context. If early history changes, later text may no longer use the same state even if that text itself is unchanged. Section 2.2 calls the prefix that remains identical the cache-stable prompt length; Appendix G explains why context folding or summarization can reduce submitted tokens while also reducing prefix hits.

GPU HBM is fast but limited. KV offloading stores some state in CPU host memory and later transfers it back across the CPU–GPU link. Looking only at per-token cost, if loading is cheaper than recomputing, it seems best to preserve as much as possible. But a host write does not guarantee a future host hit: if other agents evict that state first, the server still recomputes it and has also paid the write cost. Coding agents make the issue concrete because each model call resubmits a long task history. In the analyzed SWE-bench traces, the paper reports that 98.1% of prompt tokens had already been processed earlier in the same task, and most newly computed KV reappeared in the next call. “Repeated before,” however, does not mean “retained by the host tier.”

The paper begins by showing that the same agent workload can speed up, slow down, or remain unchanged on RTX 3090, H20, and H800 deployments. Figure 1 contrasts two factors: on the left, one agent's tool wait is filled with work from other agents; on the right, KV moves between GPU HBM and the CPU host tier. The GPU determines how valuable a host hit is; competing requests determine whether the hit occurs at all. This is the paper's most important modeling choice: favorable transfer economics are necessary, not sufficient.

## Core intuition: while each agent waits, the whole pool uses the cache

Imagine sixteen agent tasks taking turns. Agent A sends a model request, receives a response, and launches tests. While tests run, A sends no new model call. The other fifteen tasks continue issuing requests, so their prompts change the host tier's LRU order and may evict older KV. When the test finishes and A submits its long context again, only matching prefix chunks still present in some cache tier can be reused.

The authors call the data demand created by this competition the **reuse working set**. In a simplified backlogged-pool model, with active-pool size $A$, mean prompt length $\bar N$, and per-token KV footprint per GPU rank $\beta_{rank}$, its scale is:

$$
\widehat{C}_{reuse} \approx (A-1)\bar{N}\beta_{rank}.
$$

This is a capacity-scale estimate, not an exact law for every deployment. It assumes every agent has a call in flight and prompt lengths are comparable; the paper's trace-based stack-distance model retains actual reference order, lengths, and sharing. Intuitively, increasing A or context length means A's state must survive more competing work before reuse, so the host tier needs more capacity. In the paper's H20 setting, sixteen active tasks imply an estimated 11.4 GiB per rank; reducing the active pool to eight lowers the scale to 5.3 GiB per rank, and the observed capacity transition moves down as well (Section 5.3, Table 3).

Another ratio is $\gamma_H=\widehat{C}_{reuse}/C_H$, where $C_H$ is host-tier capacity. A value above one means the estimated working set exceeds the tier, increasing thrashing risk; below one means the estimate fits, but does not guarantee hits for every workload. The GPU-side opportunity is represented by $\gamma_G=A\bar N/K_G$, where $K_G$ is GPU KV capacity. Host recovery becomes useful when the GPU cannot retain the active pool; then host capacity relative to the reuse working set determines whether the opportunity becomes an actual hit (Section 3.2, Equations 4–5).

![Bloss0m-created explanatory diagram of tool waits creating a shared host-tier reuse working set.](/paperReading/80-efficientagent-concurrent-kv-cache-offloading/figures/concurrent-working-set.svg)

*Bloss0m-created illustration with no paper measurements. It explains [the paper's Figure 1 and Sections 2–3](https://arxiv.org/html/2609.33762v1#S2); while one agent waits for a tool, other agents' requests increase its prefix's reuse distance. Reuse/license status: original explanatory diagram; no paper artwork is reproduced.*

## Walk one trace through the method: from a repeated prefix to an admission decision

The following is a teaching trace assembled from the paper's mechanism. Its capacity and token counts are illustrative, not a new measured experiment. Suppose Agent A first submits a 20,000-token prompt. The GPU cache retains recent KV; when GPU space runs short, the server writes some of A's KV chunks to the CPU host tier. A's model response triggers a test tool. Agents B, C, D, and others then submit distinct long prompts, changing the host tier's LRU order. When testing ends and A resubmits its context, only prefix chunks still resident can be restored from a cache tier.

1. **Inputs and state:** The server reads the request's prefix-match length, recent active-pool size and prompt lengths, and whether the host tier is full and evicting. KV is handled in fixed-size chunks; the main replay uses 1,024-token chunks.
2. **Offline capacity location:** For each chunk, stack distance $D(k)$ counts distinct chunks referenced between two uses. In a fully associative LRU model, capacity holds approximately $K_H=\lfloor C_H/(b\beta_{rank})\rfloor$ chunks; if $D(k)<K_H$, that chunk can survive in the model. The trace estimates where the capacity curve transitions before the capacity experiment (Section 3.2, Equation 4; Section 5.4, Tables 4–5).
3. **New data in this request:** For a prompt of $n$ tokens, with the first $h$ tokens already matched in the host tier and chunk size $b$, the number of new full chunks is $u=\lfloor n/b\rfloor-\lfloor h/b\rfloor$. A small u often extends a prefix that is already resident; a large u is a large refill after much of the prefix was evicted.
4. **Pressure condition:** Let $p_t$ denote pressure. With fresh telemetry, it is true only when the working-set estimate exceeds host capacity and the tier is full and actively evicting. If telemetry is missing or stale, the runtime falls back to the estimate alone. This keeps decisions flowing, but removes the live eviction-state confirmation. The repository sets the maximum age of a fresh report to five seconds (Appendix D; [repository runtime parameters](https://github.com/KunmingSHAO/efficientagent_release#requirements)).
5. **Admission:** If pressure is true and $u>\kappa$, the runtime declines to write this request's new KV to the host; already matched host prefixes remain, and the decision holds for the rest of the request. Otherwise it writes normally. The paper's main setting uses a chunk threshold $\kappa=8$, with sensitivity analyses in Appendix D.
6. **On the next return:** If the rejected refill would have been evicted before reuse, declining it leaves room for prefixes that will be read again. If the tier already fits the working set, declining the refill may remove state that could have survived and cause more recomputation. That is why the policy uses both an estimate and pressure telemetry.

![Bloss0m-created explanatory diagram of admission changing around working-set capacity.](/paperReading/80-efficientagent-concurrent-kv-cache-offloading/figures/capacity-admission.svg)

*Bloss0m-created illustration. It summarizes [the paper's Figures 2–4 and Sections 5.2–5.5](https://arxiv.org/html/2609.33762v1#S5): fixed write filtering can help below the working set, yet hurt when capacity can already hold it. Reuse/license status: original explanatory diagram; no paper artwork is reproduced.*

## Technical mechanism: value, survival, and write control are different questions

### First estimate the value of a host hit

The paper defines the Offload Benefit Ratio (OBR) to estimate how much time restoring a prefix of length $n$ saves relative to recomputation. If effective prefill time is $T_{rec}(n)=n t_{pf}$, and host restoration takes $T_{load}(n)=n\beta_{rank}/B_{H2D}^{eff}+\tau_{load}$, then:

$$
OBR(n)=1-\frac{T_{load}(n)}{T_{rec}(n)}.
$$

$t_{pf}$ changes with model, context length, batching, and operating point; $B_{H2D}^{eff}$ is effective host-to-GPU restore bandwidth; $\tau_{load}$ is fixed load overhead; and $\beta_{rank}$ is KV bytes per token per rank. Long prefixes amortize fixed overhead. But OBR answers whether a *usable* host hit is worthwhile, not whether the host still contains it. If OBR is positive but the entry is evicted before reuse, the nominal transfer advantage is never realized (Section 3.1, Equation 2; Appendix C).

A broader serving-time approximation puts saved prefill, restore traffic, and other costs together:

$$
\Delta T_{serve}\approx -(U_0-U_1)t_{pf}+R\beta_{rank}/B_{H2D}^{eff}+\Delta T_{other}.
$$

Here $U_0$ and $U_1$ are recomputed prefill tokens with the host tier off and on, and $R$ is the number of tokens actually restored. The first, negative term is saved computation; the transfer term is positive; and $\Delta T_{other}$ includes writes, restore setup, exposed scheduling, and delays that cannot be overlapped. This explains why “restore is faster per token than prefill” is not sufficient: if few restores succeed, or writes, evictions, and queue delay are high, overall makespan may not fall (Section 3.1, Equation 3).

### Then estimate whether capacity lets a hit survive

Stack distance is an offline quantity in a fully associative LRU reference model. For a KV chunk $k$, count distinct chunks referenced between its previous and next use. If the host tier has $K_H$ chunk slots, the chunk survives in that model when its reuse distance is below $K_H$; at or above capacity, other distinct chunks push it out. This is not a perfect runtime oracle for future requests. It estimates the capacity transition from a trace. The paper uses it to locate that transition before the experiments, reporting close predictions and measured computed-prefill values at 20 and 80 GiB (Section 5.4, Tables 4–5).

Prefix caching adds a **contiguous coverage** constraint. Even if a later chunk remains in the host tier, a missing earlier chunk may prevent restoring the prefix from that point. The paper therefore derives host prefix coverage from chunk survival and subtracts what remains resident on the GPU to estimate useful restoration. This prevents equating “chunk hit rate” with “how many tokens of the prompt can actually be reused” (Section 3.2, Appendix C).

### Finally decide whether to write

The authors call the runtime strategy capacity-conditioned write admission. It combines feedforward and feedback: recent active-pool and prompt-length observations estimate the working set; when telemetry is fresh, the host tier reports whether it is full and evicting. With a fresh report, both estimated capacity overflow and active eviction establish pressure; if telemetry is missing or stale, the estimate alone is the fallback pressure signal. The request must also add more than $\kappa$ new chunks before its host writes are declined. A fixed write filter ignores capacity: it can avoid waste when the tier is too small, but miss reusable refills when capacity is sufficient (Section 4, Appendix D; [repository admission description](https://github.com/KunmingSHAO/efficientagent_release#efficientagent)).

Proposition 1 gives a conditional LRU result: for a fixed reference stream and an LRU tier, declining only miss insertions whose next use is beyond tier capacity—or that are never used again—does not remove hits that full admission would have produced. This is not proof that an actual estimator can always identify those chunks. The runtime rule approximates the choice through an estimate and telemetry. It performs a constant-time check per request rather than a complicated calculation per token. Its actual benefit still depends on estimation quality, chunking, runtime telemetry, and how closely the serving cache follows the LRU assumptions (Section 4, Proposition 1; Appendix D).

## How to read the evaluation: identical work, different serving policies

The main live workload uses OpenHands CodeActAgent with Qwen3-Coder-30B-A3B-Instruct in BF16, vLLM 0.13.0, and LMCache 0.3.12. The core H20 configuration has eight H20 GPUs with tensor parallelism 8, up to sixteen simultaneous requests, fixed GPU KV capacity, and 1,024-token host chunks. The experiments vary active tasks from eight to sixteen and host capacity from 3 to 80 GiB per rank. Cross-hardware tests use 8×RTX 3090, 2×H800, and 8×H800; some also use dense Qwen2.5-Coder-32B-Instruct (Sections 5.1, Appendix A).

The central replay takes a live SWE-bench Verified run with no host tier: 4,427 model calls and 147.1M prompt tokens. Each policy replays the recorded prompt and reproduces every output token exactly. Task dependencies remain: a task's next call waits for its previous response and recorded agent/tool elapsed time. Serving decisions can therefore change queueing, interleaving, and makespan while the token work stays fixed. This isolates serving effects, but it prevents the agent from changing its decisions in response to different latency or state. It answers how a serving system handles a fixed workload—not whether a live agent finds a correct patch sooner (Section 5.1, Appendix B).

The authors compare recomputation without a host tier, offloading without admission, fixed write filtering, and capacity-conditioned admission. They measure computed prefill, host writes/restores, preemptions, prefix reuse, and makespan. With sixteen active tasks on H20, increasing host capacity from 5 to 20 GiB per rank reduces prefill from 76.74M to 5.28M tokens and makespan from 208.91 to 128.05 minutes. At 20 to 80 GiB, prefill stays around 5.27–5.29M, so capacity gains flatten for this workload. The 5 GiB tier writes 81.69M tokens for only 12.57M restored and still takes about 209 minutes: a negative example of having a host cache without useful recovery (Figure 2, Table 3, Section 5.2).

Figure 2 and Table 3 support the capacity and time results. The active-pool comparison in Section 5.3 shows that reducing active tasks from sixteen to eight lowers estimated working-set scale from 11.4 to 5.3 GiB per rank; no-offload makespan falls from about 212 to 159 minutes, and the capacity transition shifts down. Section 5.4 and Tables 4–5 check stack-distance predictions; Section 5.7 and Table 1 compare GPU ratios. These are multiple views from one systems study, not independent external replications.

![Bloss0m-created explanatory diagram showing separate hardware and working-set gates.](/paperReading/80-efficientagent-concurrent-kv-cache-offloading/figures/hardware-boundary.svg)

*Bloss0m-created illustration. It is an explanatory contrast informed by [paper Figure 7 and Section 5.7 / Table 1](https://arxiv.org/html/2609.33762v1#S5.SS7); use the paper for measured values. RTX 3090/H20 and H800 have different outcomes at different peak-compute-to-host-link ratios. Reuse/license status: original explanatory diagram; no paper artwork is reproduced.*

## A critical negative result: fixed write filtering reverses when capacity is sufficient

The most useful result is not just the 93.1%/38.7% headline; the same admission decision reverses direction across capacities. At 5 GiB per rank, the estimated working set is about 11.4 GiB, so $\gamma_H>1$. Fixed write admission reduces H20 computed prefill from 76.7M to 48.9M tokens and makespan from 209 to 186 minutes; the capacity-conditioned policy yields 49.7M and 187 minutes. It sharply reduces host writes while allowing surviving prefixes to be restored more often.

At 40 GiB, however, the tier can hold the estimated working set. Keeping the fixed filter raises computed prefill from 5.3M to 22.8M tokens, about 4.3-fold, and makespan from 124 to 162 minutes. The capacity-conditioned policy sees that the estimated set does not exceed the tier and stops rejecting writes, approximately matching ordinary offloading. Sections 5.5, Figures 3–4, and Appendix D explain the reversal: at 5 GiB, most declined chunks are reused beyond capacity or never used again; at 40 GiB, fixed admission rejects chunks that could have survived.

Hardware adds a separate constraint. Table 1 / Section 5.7 reports peak dense BF16 FLOP per host-link byte of about 2.2K and 2.3K for RTX 3090 and H20; with sufficient capacity, offload makespan ratios are about 0.91 and 0.60 (below one means faster). H800 is about 15.5K, and measured ratios range from 1.08 to 1.87—slower in every tested configuration. This does not mean H800 is categorically unsuitable for KV caching. It means the measured restore path is less attractive relative to GPU compute. Effective prefill, GPU-memory pressure, PCIe/NVLink path, batching, and overlap all affect the decision; peak specifications alone do not predict a deployment.

The paper also reports that on RTX 3090, increasing the engine's GPU-memory share raises the prefix-hit rate from 44.6% to 98.1% and cuts wall clock from 407 to 73 minutes (Section 5.2). GPU-side residency matters too; host memory is not the only lever. External validity remains bounded by one main coding-agent trace, particular model/runtime versions, hardware, and replay control. Repeats in the paper are independent experimental runs, not an independent team's replication.

## Evidence map: capacity conditions, not agent quality

| Layer | What can be said | What it should not become |
| --- | --- | --- |
| **Directly measured** | On the specified OpenHands/SWE-bench Verified trace, model, serving stack, and hardware, cache policy changes computed prefill, traffic, preemptions, and replay makespan; the working-set estimate locates some capacity transitions. | Every agent, prompt, model, or cloud deployment will see the same speedup. |
| **Authors' systems claim** | Concurrent agent interleavings enlarge the reuse working set; capacity estimates and pressure-conditioned admission can avoid thrashing in a small tier without always discarding reusable state when the tier is sufficient. | The policy has the same guarantee on every cache backend or a non-LRU structure. |
| **Evidence suggests** | Concurrency, prefix rewrites, GPU/host-link ratio, and tier capacity belong in deployment sizing; single-request KV size does not predict benefit on its own. | Stack-distance estimates solve every dynamic workload or eliminate the need for online validation. |
| **Bloss0m engineering interpretation** | A capacity sweep followed by traffic/hit/latency comparison may reveal the bottleneck more reliably than buying more RAM by intuition. | This is a universal deployment standard proposed or validated across platforms by the authors. |

Fixed-token replay is both a strength and a boundary. It makes each policy face the same 4,427 prompts and recorded outputs, helping isolate serving changes. Task dependencies remain: one call waits for its previous response and tool time, so a policy can change other tasks' interleaving. Makespan is therefore not just offline token count multiplied by average throughput. But fixed outputs sever the loop “serving speed changes → agent behavior changes → prompt/tool trajectory changes.” The study does not measure completion rate, solution quality, tool errors, or live task outcomes under the changed policy.

The denominator matters. The 93.1% is the relative change in computed prefill from 76.74M to 5.28M tokens for the H20, sixteen-task replay under a particular host-capacity intervention. The 38.7% is makespan falling from 208.91 to 128.05 minutes in that comparison. It is not 93.1% latency savings or 38.7% fewer tokens. Live agent runs supplied the traces; the headline serving comparison replays them. The two evaluation modes should not be conflated.

## Artifacts and reproducibility: usable tools do not confirm the original traces are public

As of 2026-09-30, the authors' [efficientagent_release repository](https://github.com/KunmingSHAO/efficientagent_release) is publicly browsable and identifies an Apache-2.0 license. It contains a vLLM/LMCache admission connector, dependency-preserving replay framework, stack-distance/capacity analyses, examples, and tests. The README describes how to provide agent traces and includes a synthetic-trace path; the original SWE-bench trajectories used in the paper are not confirmed as bundled. Readers can inspect the implementation, run CPU-only tests, or analyze synthetic/self-collected traces, but that is not the same as regenerating the paper's numbers exactly. The README also specifies that fresh telemetry combines estimated capacity overflow with a full-and-evicting tier; when no telemetry file is configured or no fresh report is available, the estimate alone is the fallback, with a five-second default maximum report age.

Full serving requires Linux and NVIDIA GPUs. The paper setup uses vLLM 0.13.0, LMCache 0.3.12, and, for the main H20 configuration, eight GPUs with TP8 and Qwen3-Coder-30B-A3B-Instruct. Model weights, GPU access, OpenHands/SWE-bench data, and long trajectories affect reproduction cost. The repository specifies Python 3.10+ and dependencies. CPU analyses and synthetic traces can validate code paths for the capacity model, but cannot substitute for GPU serving or end-to-end replay. This reading did not independently rerun the headline experiment; numerical results are author-reported and the reproduction scope is limited to what the paper and repository document. The arXiv v1 page lists a non-exclusive distribution license but no explicit reuse license for the paper's figures. The article therefore reproduces no original paper artwork and instead uses three linked, clearly labeled original Bloss0m explanatory diagrams; they are not paper figures or result plots.

## Bloss0m engineering judgment: measure the reuse boundary before buying capacity or changing admission

The following is **Bloss0m engineering judgment**, not a procurement rule validated across deployments by the authors. If your serving workload has long contexts, multi-turn tool waits, a concurrent pool, and GPU KV pressure, begin with an observable trace and a capacity sweep. Record per-task prompts, prefix matches, GPU/host hits, evictions, restore/write bytes, queueing, preemptions, active-pool size, and wall clock. Compare no offload, ordinary offload, and capacity-aware admission. Sweep capacity from low to high; check whether prefill and makespan transition near the estimated working set; then verify whether declined writes truly would not have been reused within the tier's reach.

Do not directly apply the policy when the workload has almost no stable prefixes; when early history is frequently summarized or rewritten; when active-pool size or prompt lengths shift faster than the recent window can track; when host access is remote network storage rather than the tested CPU tier; when cache eviction is not LRU-like; or when GPU prefill is very fast and the host link is slow, making OBR near or below zero. In those cases, improving context identity, GPU residency, or serving schedules may be more appropriate than adding CPU RAM. Measure on your own traces and hardware rather than projecting H20's 39% result into a cost estimate.

A deployment trial should keep a safety path: estimate admission decisions in shadow/replay mode, record decline rate, subsequent misses, and latency, and re-estimate when active pool, context length, model, or GPU SKU changes. Roll back if the working set drifts quickly or read/write behavior worsens. Parameter sensitivity in one workload is not a production stability guarantee. A working-set estimate is an input to capacity planning and policy—not a promise about the next hit for each individual chunk.

## Three things to remember

1. **Technical idea:** Agent KV offloading is not only about whether one request fits. The concurrent agents' reuse working set must survive the work between turns.
2. **Evidence:** Fixed-output SWE-bench Verified replay shows a capacity and admission transition: fixed filtering helps in a small tier, while filtering at sufficient capacity can raise computed prefill 4.3-fold.
3. **Boundary:** The 93.1% prefill and 38.7% makespan changes are results from a specified H20 serving replay. They do not show higher agent success and do not guarantee transfer to other hardware, runtimes, or tasks.

## Further reading

- [Trajectory-Aware Benchmark Subset Selection for Cost-Efficient Software Engineering Agent Regression Testing](/en/paper-reading/67-trajectory-aware-benchmark-subset-selection/): reducing agent regression-evaluation costs, a different layer from the inference-serving cost studied here.
- [Completed Pairs Hide Capped Failures](/en/paper-reading/79-completed-pairs-capped-failures/): how evaluation-runner stopping rules shape observed results, complementing this paper's fixed-replay evidence boundary.

## Primary sources

- Shao et al., [EfficientAgent: What Makes KV Cache Offloading Work for Concurrent Agents? (arXiv v1)](https://arxiv.org/html/2609.33762v1), submitted 2026-09-27. Claims link to locatable figures, tables, sections, and appendices as identified in the text; no original paper figure is reproduced.
- [EfficientAgent release repository](https://github.com/KunmingSHAO/efficientagent_release) (Apache-2.0; code and selected analysis tools; original paper traces not confirmed bundled).
