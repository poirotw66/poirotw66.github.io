---
title: "Amazon SageMaker HyperPod Inference Gateway: Where GPU-Aware Routing Helps"
description: "An engineering analysis of how Amazon SageMaker HyperPod Inference Gateway uses KV cache, queue depth, LoRA, and prefix-cache signals, with the EKS add-on, CRD, failure, benchmark, and vendor-claim boundaries made explicit."
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "HyperPod Inference Gateway combines a Body-Based Router and an Endpoint Picker in an EKS add-on, routing requests by model, GPU load, KV cache, LoRA adapter residency, and prefix-cache signals."
  - "The delivery model is Kubernetes-native: install the add-on and apply an InferenceGatewayConfig CRD while keeping an existing OpenAI-compatible client unchanged. Model-server versions, TLS, IAM, JWT, and observability remain platform responsibilities."
  - "AWS reports TTFT P95/P99 improvements for mixed GPUs, bursty traffic, and shared prompt prefixes. Those are vendor measurements for specific hardware, models, and a round-robin baseline—not a universal 82% guarantee."
  - "The currently described Tier 1 is per-cluster intelligent routing. Cross-cluster and cross-region failover belongs to AWS’s described Global Inference Router (Tier 2) and should not be treated as an available per-cluster feature."
audience:
  - "Platform engineers responsible for LLM serving, Kubernetes GPU fleets, or EKS inference"
  - "AI architects and engineering leaders balancing latency, GPU utilization, availability, and operational complexity"
category: "Cloud & Platform"
tags: ["AWS", "Kubernetes", "Platform Engineering", "Evaluation", "Cloud Native"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 16
kind: "article"
showToc: true
wideHeader: true
image: "/blog/112-sagemaker-hyperpod-inference-gateway/title_image.webp"
---

Once a large language model (LLM) is deployed across a GPU fleet, request routing is no longer just a matter of spreading connections across replicas. One pod may be processing a long context, have a nearly full KV cache, or already hold the requested LoRA adapter in GPU memory. Another apparently idle pod may first need to load the adapter or recompute a prompt prefix. Round-robin and least-connections routing cannot see that inference state.

On September 18, 2026, AWS introduced [Amazon SageMaker HyperPod Inference Gateway](https://aws.amazon.com/blogs/machine-learning/introducing-amazon-sagemaker-hyperpod-inference-gateway/), which puts LLM-aware routing into existing HyperPod on Amazon EKS infrastructure. The useful question is not whether “an add-on makes inference 82% faster.” It is what changes when a router can read GPU and model-serving state, which workloads benefit, and which responsibilities stay with the platform team.

> **Huahua in one sentence**
>
> GPU-aware routing is not a more complicated load balancer; it is a decision about which pod is best prepared for this request, instead of which pod happens to be next.

## Separate AWS’s claims into three layers

The announcement combines a current product capability, benchmark numbers, and a future roadmap. They should not be read as one headline:

| Layer | What AWS makes public | How to interpret it |
| --- | --- | --- |
| Current Tier 1 | A per-cluster Kubernetes-native gateway with BBR, EPP, and `InferenceGatewayConfig` | Intelligent routing inside one cluster, not automatic multi-region traffic management |
| Vendor benchmark | Four 8B–235B models on p5.48xlarge (H100) and g5 (A10G), across three scenarios, compared with round-robin | A source for load-test hypotheses—not a direct prediction of your models, traffic, GPU cost, or SLO |
| Future Tier 2 | Global Inference Router (GIR) for cross-cluster/region failover, rate limiting, and cost-aware traffic shaping | Described by AWS as coming soon; not an existing Tier 1 guarantee |

The [HyperPod Inference documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-inference-gateway.html) adds an important deployment detail: the gateway is part of the HyperPod Inference Amazon EKS add-on rather than a separately installed platform. The current guide lists `v2.0.0-eksbuild.2` as the version where the gateway is available. The `v2.0.0-eksbuild.1` command in the AWS blog should therefore be read in the context of that announcement; installation should follow the current guide, regional availability, and release notes.

## Two tiers: find the model, then select the pod

Tier 1 can be reduced to this request path:

```text
OpenAI-compatible request
        ↓
Body-Based Router → model pool / HTTPRoute
        ↓
Endpoint Picker → model-serving pod
```

The separation matters. BBR decides how the `model` field in the request body maps to the correct model pool. EPP decides which endpoint inside that pool is best suited for the next request. Calling both “the gateway automatically optimizes GPUs” hides where configuration and failure actually occur.

### Body-Based Router: model-level dispatch first

BBR reads the `model` field from an OpenAI-compatible request body and sends the request to the corresponding scheduler. Multiple models can share one gateway endpoint, so an application does not need to maintain its own model-to-service routing table. LoRA requests can also be mapped from an adapter to its base model before entering the correct pool.

This is a request-contract responsibility, not a model-quality guarantee. If a client sends an unknown `modelName`, an adapter mapping is incomplete, or an `InferenceGatewayConfig` selector matches no serving pod, BBR will not repair the metadata. Those configuration failures should be visible through gateway conditions and external alerts.

### Endpoint Picker: score serving state

EPP reads Prometheus metrics exposed by model-serving pods and scores candidate endpoints. The AWS announcement lists these signals:

- **KV cache utilization:** avoid pods whose key-value memory is close to full, reducing long-context contention.
- **Queue depth:** avoid pods with a deeper backlog.
- **LoRA adapter residency:** prefer pods that already have the requested adapter in GPU memory, reducing adapter swaps.
- **Prefix cache hit rate:** for repeated conversation or document-Q&A prefixes, prefer pods likely to retain the prefix.
- **Running requests:** balance active work across healthy endpoints.

These signals can point in different directions. A pod with a useful cache hit may also have a longer queue; a pod with the shortest queue may not have the requested adapter. Configurable weights let a team turn the scorers into workload policy: interactive chat may favor TTFT and cache locality, while offline batches may favor throughput and even utilization. Routing weights therefore belong in versioned, load-tested, rollback-friendly production configuration. They are not magic constants.

### Kubernetes-native delivery

The gateway is delivered through the HyperPod Inference add-on and builds on Kubernetes primitives including Gateway API, HTTPRoute, InferencePool, and the Endpoint Picker. The configuration entry point is the `inference.sagemaker.aws.amazon.com/v1alpha1` `InferenceGatewayConfig`; HyperPod Inference Operator model resources use `v1`. The API versions differ even though they share an API group.

The official documentation separates the responsibilities of the Operator and the Gateway. The Operator owns model deployment, orchestration, and attaching a model to the gateway. The Gateway owns BBR, HTTPRoute, InferencePool, and EPP request routing. A team can author `InferenceGatewayConfig` directly, or set `spec.inferenceGateway.enabled: true` on an `InferenceEndpointConfig` or `JumpStartModel` and let the Operator maintain the scheduler entry.

The benefit is a stable OpenAI-compatible `/v1/chat/completions` endpoint: existing clients do not need a new SDK or SigV4 signing for inference traffic. The cost is a larger platform responsibility: controller and CRD lifecycle, model-server metrics, label selectors, TLS, IAM, and gateway health all need clear owners.

## Installation is more than one `aws eks create-addon`

The AWS blog describes a convenient four-step path: install the add-on, label model pods, apply `InferenceGatewayConfig`, and send an OpenAI-compatible request. That is a useful mental model, but production deployment needs a fuller checklist:

1. **Confirm the add-on version and dependencies.** The current Developer Guide lists `v2.0.0-eksbuild.2` as the gateway starting point. An Application Load Balancer endpoint requires the AWS Load Balancer Controller; automatic TLS issuance requires cert-manager and the relevant ACM import permissions.
2. **Confirm model-server metrics.** The guide lists vLLM v0.9.2 or later and SGLang v0.3.5.post1 or later. Older vLLM versions may still route using other signals while ignoring KV cache utilization; older SGLang versions may fail to start without `--enable-metrics`.
3. **Configure request authentication first.** The guide explicitly warns that if `spec.auth.jwt` is absent, the endpoint has no request-level authentication by default and is restricted only by VPC and network controls. “Private endpoint” and “authorized caller” are not the same property.
4. **Check the add-on, CRD, and controller health.** At minimum, verify `inferencegatewayconfigs.inference.sagemaker.aws.amazon.com`, the `GatewayClass`, the `inference-gateway-controller` rollout, and add-on health before shifting production traffic.

A minimal configuration looks like this; production TLS, JWT, IAM, namespace, scheduler, and model selectors must be completed for the target environment:

```yaml
apiVersion: inference.sagemaker.aws.amazon.com/v1alpha1
kind: InferenceGatewayConfig
metadata:
  name: my-gateway
spec:
  tls: {}
  bbr:
    enabled: true
  schedulers:
    - name: llama-70b
      modelName: llama-3.1-70b
      modelSelector:
        matchLabels:
          app: vllm-llama
      targetPort: 8000
      scheduler: llm-d
```

This YAML expresses routing topology, not a complete production security manifest. Automatic certificate issuance through `tls: {}`, JWT issuer/JWKS, ACM, IRSA, and ALB permissions should each be reviewed in GitOps rather than hidden inside a quick-start command.

## What happens during failure? Start with scope

The AWS blog describes graceful degradation from pod to region, but the cluster and regional portions depend on the roadmap GIR. A more precise reading is:

| Failure scope | Reasonable Tier 1 expectation | What still needs verification or belongs to later capability |
| --- | --- | --- |
| Pod failure / stale metrics | EPP excludes endpoints without fresh metrics and routes to healthy candidates | Freshness thresholds, scrape outages, and false-health alerting |
| Pool exhaustion | Admission failure can return HTTP 429 with `Retry-After`; autoscaling or capacity changes restore service | Whether clients honor retry, whether retries cause a thundering herd, and KEDA scale-up time |
| Gateway / controller failure | Kubernetes deployment, CRD status, and downstream resources can be monitored and reconciled | Controller rollout, CRD finalizers, and add-on upgrade recovery runbooks |
| Cluster / regional failure | Do not interpret Tier 1 as automatic cross-cluster traffic shifting | AWS describes GIR, heartbeat, and cross-region routing as Tier 2; formal availability and chaos testing are still required |

The official troubleshooting guide highlights a lifecycle risk that is easy to miss: delete every `InferenceGatewayConfig` before uninstalling or upgrading the add-on. If the controller disappears while CRD finalizers remain, resources can get stuck in `Terminating`. “The add-on supports rollback” does not mean every downstream routing resource will automatically return to a clean state; upgrade, uninstall, and rollback need an inventory and verification sequence.

> **Huahua's engineering note**
>
> Self-healing repairs failures the system can observe. It does not define a 429 retry policy, validate JWTs, clean up CRD finalizers, or turn an unavailable cross-region router into a disaster-recovery plan.

## The benchmark says value appears when the fleet is uneven

The AWS test design is more informative than the headline. AWS says it used four models from 8B to 235B parameters on p5.48xlarge (H100) and g5 (A10G) instances, with traffic through internal Application Load Balancers. A dedicated client node group and a separate model-server node group avoided resource contention at high concurrency. The comparison used the same model replicas and a Kubernetes round-robin baseline; the gateway used its default routing configuration without per-workload weight tuning.

The tested conditions were the ones where intelligent routing should have the most state to exploit: mixed GPU generations, bursty traffic, and shared prompt prefixes. AWS reported these summary results:

| Condition | Model | AWS-reported TTFT P95 | TTFT P99 | Throughput |
| --- | --- | ---: | ---: | ---: |
| Mixed GPU generations | Llama 3.1 8B | –97% | –97% | +8% |
| Mixed GPU generations | Qwen3 32B | –98% | –97% | +50% |
| Bursty traffic | Llama 3.1 70B | –94% | –98% | +12% |
| Bursty traffic | Qwen3 235B | Comparable | –89% | Comparable |
| Shared prompt prefix | Llama 3.1 8B | –26% | –43% | Comparable |
| Uniform fleet, steady traffic | Qwen3 235B | Comparable | Comparable | Comparable |

In the AWS post, “Comparable” means the difference fell within run-to-run variance. It does not mean the gateway has no operational cost or added complexity. The defensible conclusion is narrower: when a fleet is heterogeneous, traffic is bursty, or cache locality matters, GPU-aware routing has useful state to exploit; on a uniform fleet under steady traffic, the benefit may be small.

These remain AWS vendor measurements. The post does not provide a complete workload trace, every scorer weight and version, gateway overhead, GPU cost, injected-failure results, or an independent reproduction across serving stacks. The `82%` first-token headline should therefore not be written as a universal product guarantee. Before adoption, rerun the baseline with your models, context distribution, LoRA share, burst pattern, autoscaling policy, and client retry behavior.

## Adoption decision: measure routing state before claiming GPU savings

HyperPod Inference Gateway is a good candidate for teams already facing several of these conditions:

- One model pool spans different GPU generations or memory profiles.
- Interactive requests are TTFT-sensitive and long contexts create meaningful KV-cache differences.
- Multiple LoRA adapters share a base model and adapter-loading latency is material.
- Multi-turn conversation or document Q&A has stable shared prefixes worth caching.
- The team is prepared to own routing policy, metrics schemas, 429 retry behavior, CRD lifecycle, and gateway security.

For a homogeneous, lightly loaded fleet, the cost of another controller, Gateway API resource set, TLS/JWT configuration, Prometheus signal, and upgrade runbook may outweigh the routing benefit. The TCO model should include gateway overhead, observability storage, ALB and network costs, GPU idle capacity, autoscaling reaction time, and incident complexity. That is different from treating token throughput as the bill, as the [LLM inference cost guide](/en/blog/94-llm-api-pricing-inference-cost/) explains.

In practice, start with shadow or small-percentage traffic and compare four cases: round-robin, gateway defaults, tuned gateway weights, and gateway behavior under stale metrics, 429s, and pod drains. At minimum, record TTFT P50/P95/P99, inter-token latency, queue depth, KV cache, prefix hits, adapter loads, 429 rate, GPU utilization, and request retries. For a related view of hardware/model co-optimization and vendor-claim boundaries, see [Inferentia and inference-cost optimization](/en/blog/59-aws-inferentia-tomofun-furbo/).

AWS packages this capability as an EKS add-on, which reduces migration friction between client and model server. “No application changes” does not mean “no platform changes.” A successful rollout should make routing decisions explainable through metrics, give each failure scope an explicit fallback, and give every endpoint a clear identity boundary—not merely add a fast-looking percentage to a dashboard.

## Further reading and sources

- [AWS announcement: Amazon SageMaker HyperPod Inference Gateway](https://aws.amazon.com/blogs/machine-learning/introducing-amazon-sagemaker-hyperpod-inference-gateway/): product architecture, benchmark results, and the Tier 2 roadmap.
- [Inference Gateway for Amazon SageMaker HyperPod Inference](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-inference-gateway.html): add-on, CRD, model-server versions, JWT, and deployment prerequisites.
- [Inference Gateway troubleshooting guide](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-ts-inference-gateway.html): controller, EPP, cleanup, and add-on lifecycle troubleshooting.
- [Secure multi-tenant AI Agents on AWS EKS](/en/blog/54-eks-multitenant-ai-agent-sandbox-bitoclaw/): related reading on EKS isolation, permissions, and platform operations.
