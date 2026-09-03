---
title: "What LLM Inference Costs: DeepSeek-R1 Benchmarks and GPU Rental Prices"
description: "Read public DeepSeek-R1 MLPerf logs for 8 B200 and B300 GPUs, then apply sourced GPU rental quotes while separating measured latency, arithmetic cost scenarios, and API prices."
pubDate: 2026-09-03
updatedDate: 2026-09-03
tldr:
  - "Public DeepSeek-R1 tests use 8 B200 or B300 GPUs, producing aggregate output throughput of 51,692.89 or 60,413.44 tokens/second"
  - "Both runs reach roughly 1-second P95 first-token latency, but average time per output token is about 70 milliseconds; aggregate throughput is not individual speed"
  - "B200 benchmark throughput paired with an external USD 53.52/hour instance quote conditionally yields about USD 0.288 per million output tokens—not a measured bill"
  - "Keep API prices, public benchmarks, and cost calculations separate; R1's 8-GPU configuration does not reveal GPT or Claude deployments"

audience:
  - "Engineers budgeting for Agent, RAG, and model API workloads"
  - "Architecture and platform teams evaluating managed APIs versus self-hosted inference"
category: "AI Engineering"
tags: ["AI Agent", "Enterprise AI", "Platform Engineering", "Evaluation"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 10
kind: article
showToc: true
wideHeader: true
image: "/blog/94-llm-api-pricing-inference-cost/title_image.webp"
---
How many GPUs sit behind a large language model that starts answering quickly? Instead of guessing GPT or Claude deployments from their prices, start with a model whose weights, system specifications, and raw test logs are public: **DeepSeek-R1**.

In Nebius's MLPerf Inference v6.0 submissions, **8 B200 and 8 B300 GPUs** each achieve approximately **1-second P95 time to first token**, with aggregate output throughput of **51,692.89 and 60,413.44 tokens/second**, respectively. These are public measurements, not our assumptions—and not tests we ran on rented hardware. [B200 raw log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt), [B300 raw log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)

There is an important distinction: **a system producing fifty or sixty thousand tokens per second does not stream your individual answer at that rate.** The same logs report average time per output token of roughly 70 milliseconds. First-token waiting, generation cadence, and aggregate throughput are different metrics.

We first interpret those measurements, then compare API rates, model capacity, and GPU rental quotes. Prices are **public snapshots checked on September 3, 2026**. Measurements, official quotes, and our arithmetic are labeled separately rather than presented as providers' internal costs.

## 1. Start with measured numbers: DeepSeek-R1 on 8 GPUs

### Which model and serving setup?

This is the full **DeepSeek-R1: 671B total parameters and 37B active per token**. It is not a smaller distilled model, R1-0528, or V4. We chose it for traceable model, system, and test evidence—not because it is the newest release. [Official DeepSeek model card](https://huggingface.co/deepseek-ai/DeepSeek-R1)

| Test condition | Scope used here | Evidence |
| --- | --- | --- |
| Submission and scenario | Nebius; MLPerf Inference v6.0; Server; both runs marked VALID | B200 and B300 raw logs above |
| Model and precision | Full R1; submission fields specify FP4 weights, quantization, and affine fusion | [B200 measurements](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/measurements.json), [B300 measurements](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/measurements.json) |
| Software and version | DeepSeek-R1 TensorRT-LLM execution path; system metadata lists branch feat/1.2-mlpinf and CUDA 13.1 | [Execution instructions](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/code/deepseek-r1/tensorrt/README.md), system files below |
| Workload | 4,388 evaluation samples covering mathematics, knowledge questions, and coding; not a fixed-length chat speed test | [MLCommons workload documentation](https://github.com/mlcommons/inference/blob/master/language/deepseek-r1/README.md) |

The execution instructions pin the original R1 weights to revision `56d4cbbb4d29f4355bab4b9a39ccb717a14ad5ad` and list NVIDIA FP4 checkpoint options. **The base model and FP4 precision are verifiable, but that README alone does not uniquely establish the quantized checkpoint revision used by each submission.** Likewise, `fp8_eval` in a dataset filename does not establish the serving weights' precision.

### Put hardware, throughput, and experience in one table

Latencies below are converted from nanoseconds in the raw logs and rounded to two decimal places. TTFT measures waiting for the first output token. TPOT is a time-per-output-token metric, not the longest individual pause.

| Metric | 8 × B200 | 8 × B300 |
| --- | ---: | ---: |
| Nodes / GPUs | 1 / 8 | 1 / 8 |
| Memory per GPU, submitted specification | 180 GB | 270 GB |
| Summed GPU memory | 1.44 TB | 2.16 TB |
| Aggregate output throughput, tokens/second | 51,692.89 | 60,413.44 |
| Completed samples/second | 13.81 | 16.05 |
| Mean TTFT, milliseconds | 629.79 | 616.63 |
| P95 TTFT, milliseconds | 959.56 | 996.55 |
| Mean TPOT, milliseconds | 71.86 | 69.31 |
| P95 TPOT, milliseconds | 75.48 | 78.83 |
| Median end-to-end request latency, seconds | 152.24 | 145.46 |

Hardware comes from the [B200 system file](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/systems/nebius_b200_n1.json) and [B300 system file](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/systems/nebius_b300_n1.json); performance comes from the [B200 log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt) and [B300 log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt). TB uses decimal addition, not a claim that all memory is one frictionless shared pool. B300's 270 GB follows the submitted specification rather than mixing in capacities from other product pages.

The configured TTFT/TPOT limits are **2 seconds / 80 milliseconds**. Those are acceptance conditions, not measured latency. The table separately reports achieved means and P95 values. Target arrival rates are **14 / 16.2 requests per second** for B200/B300, not fixed concurrent-user counts. These are individually tuned serving points, not a controlled experiment changing only the GPU model.

Quantization also needs a quality check. The submissions' separate accuracy runs report exact-match scores of **81.43% / 81.59%** on this benchmark dataset. These are neither general task success rates nor quality deltas against an unquantized baseline. [B200 accuracy](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/accuracy/accuracy.txt), [B300 accuracy](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/accuracy/accuracy.txt)

### What do the numbers actually mean?

**An 8-GPU system demonstrably starts output in approximately 1 second at P95 on this workload, while long reasoning answers can still take minutes.** Median end-to-end latency is roughly 2.5 minutes. “Fast first token” does not mean “complete answer in 1 second.” Nor does this establish 40 tokens/second for every stream.

Dividing 51,692.89 by a desired per-user rate cannot establish how many people can chat smoothly. Input/output lengths, queueing, caching, reasoning volume, and latency requirements all change capacity. We have not silently assigned zero to unverified batch, cache-hit, or speculative-decoding settings; reproduction and procurement still require the actual execution settings and tests with your own requests.

Finally, **8 GPUs is this test's configuration—not R1's minimum deployment count, not 8 GPUs dedicated to every user, and not GPT or Claude's actual configuration.** A multi-GPU replica can batch requests. Keeping a model resident also differs from starting an entire GPU group for every incoming message.

> **Huahua in one sentence**
>
> Read time to first token, time per output token, and aggregate throughput together. The largest throughput number alone is the easiest way to overestimate the speed you will experience.

## 2. Align the conditions before comparing nine model prices

This price table calculates a purchased API bill, not R1's cost or performance. In particular, DeepSeek V4 Pro and R1 are different models. All figures below are **USD per million tokens**, using standard online rates for text workloads. Batch discounts, negotiated contracts, and free allowances are excluded. Cached input means a cache read or hit; creation and storage charges are separate. Model names link to official sources.

| Model or service | Uncached input | Cached input | Output | Conditions used here |
| --- | ---: | ---: | ---: | --- |
| [GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol) | 4.00 | 0.40 | 20.00 | Input at most 272K; promotional pricing |
| [Claude Fable 5.1](https://platform.claude.com/docs/en/about-claude/pricing) | 10.00 | 0.25 | 50.00 | Standard rates |
| [Claude Opus 5](https://platform.claude.com/docs/en/about-claude/pricing) | 5.00 | 0.50 | 25.00 | Standard rates |
| [Gemini 3.1 Pro Preview](https://ai.google.dev/gemini-api/docs/pricing) | 2.00 | 0.20 | 12.00 | Prompt at most 200K |
| [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/pricing) | 0.75 | 0.075 | 3.75 | Rates through December 31, 2026 |
| [Grok 4.6](https://docs.x.ai/developers/pricing) | 2.00 | 0.50 | 6.00 | Prompt below 200K |
| [DeepSeek V4 Pro](https://api-docs.deepseek.com/quick_start/pricing/) | 1.32 | 0.044 | 3.96 | Peak hours; API alias maps to Pro-0813 |
| [Qwen3.8 Max](https://www.alibabacloud.com/help/en/model-studio/qwen3-8-max) | 1.65 | 0.206 | 4.951 | Beijing deployment; implicit cache |
| [Kimi K3](https://platform.kimi.ai/) | 3.00 | 0.30 | 15.00 | International platform's USD quote |

Dividing 50 by 3.75 gives approximately **13.3 times**. That is a ratio of output prices under the listed conditions—not a ratio of quality, speed, or hardware cost. These are not identical products: the table mixes Preview availability, promotions, and regional rates.

### Three qualifications that belong beside the price

**Effective dates.** GPT-5.6 Sol's page labels its current rates promotional through at least November 21, 2026. Gemini 3.8 Flash lists input/output rates of 1.50/7.50 beginning January 1, 2027. Annual budgets need a post-promotion scenario rather than twelve months at today's rate.

**Region and cache type.** Qwen3.8 Max costs 2.00/6.00 for input/output in Singapore. Beijing's explicit cache read is 0.137, distinct from the implicit rate in the table. For Kimi, we use its international USD quote directly rather than presenting a currency conversion as a universal price.

**Context capacity is not a billing threshold.** Above 272K input, GPT-5.6 Sol applies input/output multipliers of 2/1.5 to the whole request. Gemini 3.1 Pro moves to 4/18 above 200K; Grok 4.6 lists 4/12 starting at 200K. Do not calculate a request-level tier as if only the excess tokens incurred the higher rate. The [OpenAI model specification](https://developers.openai.com/api/docs/models/gpt-5.6-sol), [Google pricing page](https://ai.google.dev/gemini-api/docs/pricing), and [xAI pricing page](https://docs.x.ai/developers/pricing) define their respective boundaries.

By contrast, Claude Fable 5.1 and Opus 5 use standard rates across their full 1M context. Long-context support does not imply a universal surcharge structure. [Anthropic pricing documentation](https://platform.claude.com/docs/en/about-claude/pricing)

## 3. Calculate a request, not just its output price

Separate uncached input, cache reads, cache creation, and output into non-overlapping billed quantities. With prices quoted per million tokens, a basic model is:

$$
C_{request}=\frac{I_uP_u+I_rP_r+I_wP_w+OP_o}{10^6}+C_{extra}
$$

I represents each input category, O means **billable output**, and P is the corresponding price. Subscripts u, r, and w mean uncached, cache read, and cache write. Extras can include cache storage, search, code execution, or other tools. If a provider defines creation as an additional surcharge instead, adapt the categories rather than double-counting input.

### A reproducible request example

Assume a GPT-5.6 Sol request has 20,000 input tokens: 18,000 cache hits and 2,000 uncached tokens. It generates 2,000 billable output tokens, creates no cache in this request, uses no extra tools, and remains below the long-context tier.

$$
C_{request}=\frac{2{,}000\times4+18{,}000\times0.4+2{,}000\times20}{10^6}=0.0552
$$

That request costs **USD 0.0552**, versus **USD 0.12** with entirely uncached input. This is not the return on the full cache lifecycle: initial creation and later invalidation still matter. OpenAI lists short-context cache writes at 5.00, not the 0.40 read rate. [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)

A cache hit generally reuses processed prefix state and avoids some repeated prefill; it is not a free text-file read. **Prefill** processes the input and prepares state needed for generation. **Decode** progressively generates output. Their parallelism, memory access, and scheduling differ, so total input-plus-output token counts cannot normalize every workload. [AMD ATOM serving and cache configurations](https://rocm.docs.amd.com/projects/atom/en/main/model_run_guide.html)

Two further omissions are common. Billable output is not necessarily the visible answer: Google explicitly includes thinking tokens in output charges, and Gemini 3.1 Pro cache storage costs another 4.50 per million tokens per hour. Also, tokenizers differ across models: the same document need not have the same token count. [Google billing details](https://ai.google.dev/gemini-api/docs/pricing)

For an agent, sum model calls, tool-result inputs, and retries across the workflow. One chat request is rarely a sufficient accounting boundary for an entire task. The [AI Agent architecture guide](/en/blog/64-ai-agent-guide/) explains those workflow boundaries.

## 4. Total parameters and active parameters answer different questions

A mixture-of-experts, or **MoE**, model routes each token through only some experts. The other weights still need storage or movement. Total parameters help describe capacity; active parameters provide a compute clue, not a complete measure of FLOPs, latency, or electricity.

| Public model | Total parameters | Active per token | Disclosure and limits |
| --- | ---: | ---: | --- |
| [DeepSeek-R1](https://huggingface.co/deepseek-ai/DeepSeek-R1) | 671B | 37B | Model benchmarked above; submission uses FP4, not a BF16 baseline |
| [DeepSeek-V4-Pro](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro) | 1.6T | 49B | MoE; public weights use mixed precision rather than uniformly FP8 |
| [Qwen3.8-2.4T-A95B](https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B) | 2.4T | 95B | Open-model architecture reference, not a complete description of hosted Max serving |
| [Kimi-K3](https://huggingface.co/moonshotai/Kimi-K3) | 2.8T | 104B | Model card specifies MXFP4 weights and MXFP8 activations |

T means trillion and B means billion. Dividing the disclosed counts gives active shares of approximately 5.51%, 3.06%, 3.96%, and 3.71%, in table order. **Those are not energy-saving ratios against equally sized dense models.** Attention, shared components, routing, data movement, and inter-GPU communication remain.

For Kimi, use the model card's 104B figure. Multiplying total parameters by selected experts divided by all experts is not an equivalent calculation: shared and non-routed parameters do not follow that ratio. Expert counts alone cannot establish cost.

For GPT, Claude, Gemini, and Grok, the official API documentation reviewed here does not establish an equivalent parameter-and-deployment mapping. We therefore leave their parameter counts unspecified and do not assign a particular GPU or TPU based on price. Even public weights do not automatically describe the complete implementation currently serving a hosted API.

## 5. Fitting the weights is only the first hardware test

Start with an idealized weight-payload calculation:

$$
M_{weights}=P_{total}\times b
$$

Here b is bytes per parameter. Assuming one uniform precision, BF16 uses 2, FP8 uses 1, and FP4 uses 0.5. The resulting **arithmetic scenarios** use decimal TB, not TiB.

| Model size | Ideal BF16 payload | Ideal FP8 payload | Ideal FP4 payload |
| --- | ---: | ---: | ---: |
| 671B | 1.342 TB | 0.671 TB | 0.3355 TB |
| 1.6T | 3.2 TB | 1.6 TB | 0.8 TB |
| 2.4T | 4.8 TB | 2.4 TB | 1.2 TB |
| 2.8T | 5.6 TB | 2.8 TB | 1.4 TB |

R1's ideal FP4 payload is about 335.5 GB, but that does not mean 335.5 GB of memory can reproduce the measured performance above. This does not claim that every model has usable checkpoints at all three precisions. Quantization scales, mixed-precision layers, and runtime buffers are excluded.

An NVIDIA H200 has 141 GB of HBM. Capacity division alone rounds 1.6 TB divided by 141 GB up to 12 GPUs; 2.4 TB requires 18; 1.4 TB requires 10. [NVIDIA H200 specifications](https://www.nvidia.com/en-us/data-center/h200/)

**These are not deployment recommendations.** They are payload-capacity lower bounds under ideal partitioning with all weights resident in HBM. They do not establish valid parallel layouts, compatible quantization kernels, or usable performance. Dividing an MXFP4 payload by H200 memory capacity does not demonstrate native support for that checkpoint's optimal execution path.

A production service also needs room for KV cache—the attention key/value state—or recurrent state in hybrid architectures, activations, scratch space, and communication buffers. It needs capacity for long requests, concurrency, and failover. Uneven expert demand can also leave some MoE GPUs waiting on others.

Public serving recipes get closer to reality than capacity division. Separate AMD's two configurations from products whose deployments remain undisclosed:

| Reference configuration | GPU resources | What it establishes | Source |
| --- | --- | --- | --- |
| Kimi-K3 aggregated | 8 MI355X GPUs on one node | One GPU group processes input and generation; a concrete deployable configuration | [AMD Infera](https://rocm.docs.amd.com/projects/infera/en/latest/recipes/kimi-k3-optimized.html) |
| Kimi-K3 disaggregated | 8 prefill + 8 decode GPUs: 16 MI355X total | Separates the stages and transfers KV across nodes; communication and latency need validation | [AMD Infera](https://rocm.docs.amd.com/projects/infera/en/latest/recipes/kimi-k3-optimized.html) |
| GPT-5.6 Sol / Claude Fable 5.1 | Not disclosed in the documents reviewed | The counts above cannot be assigned to these products | [OpenAI](https://developers.openai.com/api/docs/models/gpt-5.6-sol) / [Anthropic](https://platform.claude.com/docs/en/models/fable-5-1/overview) |

The first two rows are **software/hardware reference configurations, not hosted providers' datacenter inventories**. Sixteen GPUs do not automatically deliver twice the throughput of eight: communication and workload matter. These numbers illustrate that a serving replica can span an accelerator group; they do not establish that every large model requires 8–16 GPUs.

> **Huahua's engineering note**
>
> A capacity lower bound asks whether weights could fit. A deployment test asks whether the model runs. Load tests meeting latency, throughput, and availability requirements determine whether it can serve your users.

## 6. Convert GPU hours into a range using effective throughput

More useful than GPU count alone is **how many output tokens the entire installation actually completes during the same billed interval**. Let N be the billed GPU count and T the installation's average output tokens per second:

$$
G_{hours/MTok}=\frac{10^6N}{3600T}
$$

With hourly rental price r per GPU, the allocated GPU rental cost is:

$$
C_{GPU/MTok}=\frac{10^6Nr}{3600T}
$$

MTok here means one million **output** tokens. The numerator includes GPU time serving the same workload, including its input processing. This allocates that time across output; it is not an isolated decode cost to which the same input-processing GPU time should be added again.

### GPU rental references: distinguish single-GPU and whole-instance rates

These quotes were **checked on September 3, 2026**, all in **USD/hour**. DigitalOcean supplies Dedicated Inference; Lambda supplies on-demand Instances. Their service scopes differ, so this is not a controlled performance ranking. The 8-GPU column uses that plan's rate rather than automatically multiplying the single-GPU price by eight.

| GPU / provider | Single GPU | 8-GPU total | Source |
| --- | ---: | ---: | --- |
| H100 / DigitalOcean | 4.41 | 30.32 | [Pricing](https://docs.digitalocean.com/products/inference/details/pricing/) |
| H200 / DigitalOcean | 4.47 | 35.78 | [Pricing](https://docs.digitalocean.com/products/inference/details/pricing/) |
| B300 / DigitalOcean | 10.39 | 83.10 | [Pricing](https://docs.digitalocean.com/products/inference/details/pricing/) |
| MI300X / DigitalOcean | 2.59 | 20.70 | [Pricing](https://docs.digitalocean.com/products/inference/details/pricing/) |
| MI325X / DigitalOcean | 2.98 | 23.82 | [Pricing](https://docs.digitalocean.com/products/inference/details/pricing/) |
| MI350X / DigitalOcean | 6.89 | Not listed | [Pricing](https://docs.digitalocean.com/products/inference/details/pricing/) |
| H100 SXM / Lambda | 4.29 | 31.92 (8 × 3.99) | [Pricing](https://lambda.ai/instances) |
| B200 SXM6 / Lambda | 6.99 | 53.52 (8 × 6.69) | [Pricing](https://lambda.ai/instances) |

Lambda's 8-GPU tab quotes an hourly rate **per GPU**, multiplied here to obtain the instance total. DigitalOcean's 8x entries already quote the group. Unlisted options are not invented as purchasable plans. MI350X is also not the MI355X used in the preceding deployment reference.

For example, keeping the listed 8-H200 plan rented for 24 hours costs **35.78 × 24 = USD 858.72**, not only when somebody asks a question. Check taxes, storage, networking, and commitment terms; Lambda explicitly excludes applicable taxes. Cheap GPU-hours need not mean cheap accepted tasks: compare capacity, interconnect, and measured throughput together, and never pair one GPU's benchmark with another GPU's rental price.

### Combine measured throughput and external rental quotes transparently

Instead of choosing an arbitrary 4,000 tokens/second or USD 4 per GPU-hour, use the R1 logs from Section 1 and the same GPU types' 8-GPU rental quotes above.

**The providers differ: Nebius supplied the measurements, while Lambda and DigitalOcean supply the quotes. The following is a cross-provider scenario conditional on a rented environment sustaining that throughput—not a measured bill or a performance guarantee for those platforms.** The same GPU type can come with different interconnects, power settings, CPUs, memory, and serving configurations. A procurement comparison requires remeasurement in the environment you would rent.

| External-rental calculation scenario | Aggregate output throughput, tokens/second | Whole-instance USD/hour | Calculated USD per million output tokens |
| --- | ---: | ---: | ---: |
| Nebius B200 measurement × Lambda 8-GPU quote | 51,692.89 | 53.52 | 0.288 |
| Nebius B300 measurement × DigitalOcean 8-GPU quote | 60,413.44 | 83.10 | 0.382 |

Throughput sources: [B200 log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt), [B300 log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt). Rental sources: [Lambda](https://lambda.ai/instances), [DigitalOcean](https://docs.digitalocean.com/products/inference/details/pricing/). The final column is our calculation, excluding charges outside the quoted plan.

For B200, substitute whole-instance rent directly for N × r:

$$
C_{GPU/MTok}=\frac{53.52\times10^6}{3600\times51{,}692.89}\approx0.288
$$

The low result depends not on a cheap individual GPU but on **the entire system continuously completing substantial output on that workload**. It cannot establish that R1 is necessarily cheaper than V4 Pro, GPT, or Claude: model quality, workloads, service scope, and billing denominators differ.

### Account for utilization exactly once

Assume the B200 scenario operates at reference throughput for only part of its billed time and is completely idle otherwise. The following linear sensitivity analysis contains **assumptions, not additional measurements**.

| Share of time operating at reference throughput | Calendar-average output throughput, tokens/second | Calculated USD per million output tokens |
| --- | ---: | ---: |
| 100% | 51,692.89 | 0.288 |
| 50% | 25,846.445 | 0.575 |
| 25% | 12,923.2225 | 1.150 |

Write this as T = u × T_ref, where u is an effective busy-time fraction, **not GPU-dashboard SM utilization**. If T already equals output across the entire billed interval divided by that interval's seconds, idle time is included; do not divide by utilization again. Real low traffic can also change batching efficiency, while bursts and queueing need not scale linearly. This table isolates idle-time allocation rather than predicting production traffic.

### Read the benchmark denominator before its brand name

A usable cost benchmark should specify the model and precision, GPU type and count, serving engine, input/output lengths, concurrency, cache-hit rate, speculative-decoding setup, and achieved latency conditions.

If “3,000 tokens/second” counts input plus output, it is not 3,000 output tokens per second. A single request's streaming speed is not cluster throughput either. Maximizing throughput by allowing long queues may violate your service requirements. AMD ATOM's test documentation explicitly lists input/output lengths and concurrency—the context needed to interpret a number. [AMD ATOM test configurations](https://rocm.docs.amd.com/projects/atom/en/main/model_run_guide.html)

A GPU rental estimate above the API price does not prove that the provider loses money: throughput assumptions, rental rates, or workloads may differ. Nor is API price minus GPU rental a gross-margin calculation. CPU, networking, storage, operations, redundancy, and other costs remain incompletely accounted for.

### What is missing before we can size a service for 100 users?

We no longer provide a GPU-per-user table without a corresponding load test. **The public 8-GPU result describes a particular operating point, not a concurrency ceiling for every workload.** Completed requests per second is a rate; requests generating simultaneously is concurrency. They are not interchangeable.

For your own website or agent platform, fix the model version and precision, sample real input/output lengths, caching, and tool round trips, then increase arrival rate progressively. At each load point, record P95 TTFT, TPOT, failure rate, and aggregate output throughput until the predefined quality or latency gate is reached. Only then add capacity for bursts and failover.

A target of 40 tokens/second per stream corresponds to about 25 milliseconds per token. That differs from the measured mean TPOT of roughly 70 milliseconds here. **You cannot reuse this aggregate throughput and declare that the same configuration meets the faster target**, nor assume additional replicas necessarily speed up an individual generation.

## 7. Discounts reveal service policy, not hardware secrets

**Same service, different hours.** DeepSeek V4 Pro off-peak input/cache/output prices are 0.66/0.022/1.98, half the listed peak rates. Peak means Monday through Friday, 01:00–04:00 and 06:00–10:00 UTC; the remaining hours are off-peak. [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/)

**Same model, different completion deadlines.** Claude Fable 5.1 and Opus 5 Batch input/output rates are half their standard rates. Batch suits work that can wait; its prices should not be substituted into an interactive-service budget. [Anthropic Batch rates](https://platform.claude.com/docs/en/about-claude/pricing)

Batch is not a universal model capability. Grok 4.6 explicitly does not support it. Kimi's Batch price page lists K2.6 and K2.5, so those discounts cannot automatically be applied to K3. Qwen support must also be checked against the actual region and model snapshot: a platform offering Batch does not mean every model supports it. [Grok model page](https://docs.x.ai/developers/models/grok-4.6), [Kimi Batch pricing](https://platform.kimi.ai/docs/pricing/batch), [Qwen model page](https://www.alibabacloud.com/help/en/model-studio/qwen3-8-max)

Together, off-peak prices, Batch, promotions, and context thresholds support a bounded conclusion: **service conditions and commercial policy affect prices, so prices are not simply physical-compute meters**. These are not controlled experiments proving that hardware, load, and underlying cost stayed unchanged across a discount.

The practical response is to move deferrable work out of the interactive path, stabilize reusable prefixes, and remove unhelpful context—then rerun quality and latency checks. For RAG, better retrieval and context selection often deserve attention before filling the entire window. See the [Enterprise RAG guide](/en/blog/65-enterprise-rag-guide/) for that architecture.

## 8. Compare cost per accepted task, not the cheapest token

Suppose two workflows process the same 100 tasks under identical acceptance criteria. A costs USD 8 and passes 80; B costs USD 12 and passes 96. Their costs per accepted task are **0.10 and 0.125**. Higher pass rate does not automatically make B cheaper, and lower price does not automatically make A deployable. If release requires at least 95 passes, A fails the gate.

This is an illustrative scenario, not a model ranking. A complete comparison includes retries, human review, and escalation for failed tasks in the numerator. Results under different safety, latency, or quality thresholds do not belong in one undifferentiated leaderboard.

$$
C_{accepted\ task}=\frac{C_{model}+C_{tools}+C_{infra}+C_{review}}{N_{accepted}}
$$

Before choosing a service, create a record that another engineer can rerun:

1. **Fix the service version and rates.** Record the date, region, model ID, context threshold, and discount expiry—not just the product nickname.
2. **Sample real tasks.** Capture input and billable-output lengths, cache hits and creation, tool calls, retries, and human handling. A greeting is not a representative workload.
3. **Set acceptance gates first.** Use the same evaluation set for correctness, safety, P95 latency, and completion rate before comparing cost.
4. **Model three load conditions.** Include sustained busy operation, normal traffic, and bursts. Self-hosted services must count billed idle and redundant capacity.
5. **Reconcile and regress continuously.** Compare estimates with invoices, and remeasure when rates, models, or routing change. Connect this to the [observability and evaluation workflow for a generative AI platform](/en/blog/38-financial-genai-platform-engineering/).

### A numerical answer, with explicit boundaries

**The evidence supports a concrete answer: this DeepSeek-R1 test uses a group of 8 B200 or B300 GPUs, achieving 51,692.89 / 60,413.44 output tokens per second, P95 TTFT of 959.56 / 996.55 milliseconds, and mean TPOT of 71.86 / 69.31 milliseconds.** That is a verifiable hardware-and-experience reference—not a GPU count inferred from API prices. [B200 log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt), [B300 log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)

In a separate cost scenario, if a rented B200 environment sustains the same throughput, an external whole-instance quote of **USD 53.52/hour** translates to about **USD 0.288 per million output tokens**, or **USD 0.575** when operating at that rate for half the billed time. This is neither Nebius's internal cost disclosure nor a Lambda performance measurement.

The useful takeaway is that **one publicly verifiable large reasoning-model serving example runs on a group of 8 high-end GPUs**. It does not mean 8 GPUs per person, a fixed 8-GPU GPT/Claude configuration, or a guaranteed count for 100 users. Procurement still requires your own workload, latency, quality, and cost-per-accepted-task evidence.

### Evidence and estimation boundaries

This article separates three evidence layers: Nebius submissions in the MLCommons repository are public measurements; model cards, deployment documentation, and price schedules are official disclosures; weight payloads, cross-provider rental calculations, and idle-time sensitivity are our derivations. Result links are pinned to commit `4d3916ac9cf474b679cdfcf492d43a0559418ad1` so later file changes do not obscure the evidence. We did not rerun the benchmarks and do not have providers' internal cost ledgers, complete production deployments, or controlled cross-model tests. We therefore do not report actual margins or GPT/Claude GPU counts. Recheck prices, complete the execution configuration, and benchmark before procurement or deployment.
