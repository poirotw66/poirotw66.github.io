---
stableId: "url:https://openai.com/index/jalapeno-first-results/"
status: "durable-post-candidate"
firstSeenAt: 2026-08-26
lastVerifiedAt: 2026-08-26
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 4
  total: 22
decision: "durable-post-candidate"
---

# Jalapeño: reading OpenAI's first full-stack inference-chip results

## Identity

- Search window: 2026-08-25 00:12–2026-08-26 00:12 Asia/Taipei; seven-day backfill from 2026-08-19.
- Canonical URL: https://openai.com/index/jalapeno-first-results/
- Publisher or author: OpenAI.
- Published or updated date: 2026-08-25.
- Source type: first-party hardware and systems results.
- Direct supporting sources: https://openai.com/index/openai-broadcom-jalapeno-inference-chip/; https://github.com/SemiAnalysisAI/InferenceX/blob/main/README.md; https://inferencex.semianalysis.com/about.

## Editorial fit

- Why now: OpenAI reports first results for Jalapeño across GPT-OSS 120B, DeepSeek R1, and Kimi K2.5, making the inference-stack boundary—from silicon and memory to compiler/runtime and serving—a concrete engineering topic.
- Reader question: How should engineers read full-stack inference efficiency claims when the benchmark, power envelope, comparison systems, and independent auditability matter as much as the headline speedup?
- Category and topic cluster: Cloud & Platform; `ai-platform-governance`.
- Existing coverage and duplication risk: Related archive coverage includes Inferentia and model-efficiency architecture, but no Jalapeño record was found. Duplication risk is medium because the story overlaps hardware-efficiency coverage; the distinct angle is reproducible benchmark interpretation and stack ownership.
- Why this remains useful after the current news cycle: Model serving cost, latency, power envelopes, and benchmark comparability remain infrastructure choices as model sizes and workloads change.

## Claim map

- Primary claim: OpenAI reports 1.5–1.9x more AI work per watt at peak and 1.7–3.6x lower end-to-end latency than the named comparison systems, with higher performance on interactive workloads.
- Measured or inspectable evidence: The appendix states the tested 700W Jalapeño envelope and compares it with 1200W GB200 or 1400W GB300 systems for the listed workloads; the public InferenceX artifact provides benchmark automation and raw-data/dashboard access.
- Vendor claims requiring qualification: These are OpenAI's first-party chip/system results under selected model, batch, precision, and power conditions. They are not independent fleet TCO, availability, or production incident evidence.
- Bloss0m engineering consequence: Require a benchmark ledger with model revision, prompt mix, concurrency, output length, power boundary, latency percentile, and cost assumptions before translating throughput-per-watt into a platform decision.

## Evidence audit

- Primary evidence inspected: OpenAI's detailed Jalapeño results and chip announcement; SemiAnalysisAI's InferenceX repository and data description.
- Baseline or comparison: OpenAI compares Jalapeño against GB200 and GB300 configurations; the exact result is workload- and condition-specific.
- Missing evidence: Independent reproduction, full system bills of materials, sustained fleet efficiency, software-portability cost, failure behavior, and deployment availability.
- Conflicts or uncertainty: InferenceX describes an auditable data surface, but the existence of a public benchmark tool does not independently validate OpenAI's first-party numbers.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “The benchmark is part of the chip: how to audit OpenAI's full-stack inference-efficiency claim.”
- Internal routes: `59-aws-inferentia-tomofun-furbo`; `79-openai-gpt-5-6-frontier-intelligence-efficiency`; `ai-platform-governance` cluster.
- Human decision required: Decide whether to publish a benchmark-reading guide now or defer until external results and a stable Jalapeño availability/price envelope exist.
