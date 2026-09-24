---
stableId: "url:https://aws.amazon.com/blogs/machine-learning/introducing-amazon-sagemaker-hyperpod-inference-gateway/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-20
lastVerifiedAt: 2026-09-20
primaryCategory: "Cloud & Platform"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 5
  total: 25
decision: "write-now"
---

# Amazon SageMaker HyperPod Inference Gateway：把 GPU-aware routing 放進 Kubernetes

## Identity

- Search window: Strict 72-hour scan ending 2026-09-20; AWS published the engineering post on 2026-09-18.
- Canonical URL: https://aws.amazon.com/blogs/machine-learning/introducing-amazon-sagemaker-hyperpod-inference-gateway/
- Publisher or author: AWS Machine Learning Blog.
- Source type: Official engineering blog.
- Supporting evidence: Kubernetes-native architecture, EKS add-on install commands, declarative CRD, failure behavior, and benchmark setup/results in the source.

## Editorial fit

- Reader question: Why does ordinary round-robin routing waste GPU capacity for LLM inference?
- Why now: The gateway exposes routing decisions based on KV-cache utilization, queue depth, prefix-cache affinity, LoRA residency, and running requests without changing model servers or client code.
- Engineering angle: Explain the two-tier design: a per-cluster gateway today, with a global inference router planned later, and show where the routing signal enters the serving path.
- Archive fit: Extends the site's inference-cost and agent-runtime coverage with a concrete scheduling/control-plane layer rather than another model launch.

## Claim map

- Primary claim: The EKS-managed gateway can reduce time-to-first-token and uneven GPU utilization by selecting model-serving pods with live inference signals.
- Inspectable evidence: Body-Based Router, Endpoint Picker, weighted scorer list, `InferenceGatewayConfig`, OpenAI-compatible endpoint, graceful failure table, and benchmark conditions are described in the post.
- Vendor claim: AWS reports up to 82% first-token latency reduction and throughput gains across four models and three production-like scenarios.
- Engineering consequence: A production inference platform should treat KV cache, prefix locality, adapter residency, queue depth, and admission behavior as routing inputs, not opaque server internals.

## Evidence audit

- Primary evidence inspected: AWS post dated 2026-09-18, including architecture, install steps, benchmark methodology, and result table.
- Missing evidence: No independent rerun, public benchmark harness, cost-per-token curve, or production workload traces were verified.
- Uncertainty: The global router, canary splitting, and priority bands are future work; only the per-cluster tier is available in the inspected announcement.

## Recommended treatment

- Output level: Durable post candidate.
- Proposed angle: “LLM serving的下一個瓶頸不是模型，而是路由：拆解 GPU-aware inference gateway 如何讀懂 KV cache。”
- Artifact: Inspectable EKS add-on, CRD, CLI commands, and OpenAI-compatible request path; benchmark figures are first-party.
- Human decision required: Keep AWS performance numbers explicitly labeled as vendor-run, and separate the reproducible configuration from the unverified headline improvement.
