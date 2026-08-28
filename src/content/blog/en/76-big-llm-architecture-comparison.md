---
title: "2025/2026 Modern Large Language Model Architecture Deep Dive: From DeepSeek V3 to Llama 4"
description: "Exploring the key architectural innovations behind DeepSeek V3, Llama 4, Gemma 3, and Kimi K2, including MLA, MoE, and sliding window attention engineering practices."
pubDate: 2026-07-29
updatedDate: 2026-07-29
category: "AI Engineering"
tags: ["架構模式", "AI"]
kind: "article"
showToc: true
image: "/blog/76-big-llm-architecture-comparison/title_image.webp"
tldr:
  - "DeepSeek V3 and Llama 4 prove that Mixture-of-Experts (MoE) is essential for scaling inference efficiency."
  - "Multi-Head Latent Attention (MLA) and Sliding Window Attention have emerged as leading techniques to replace standard MHA and save KV Cache."
  - "The width vs. depth trade-off: Qwen3 favors deeper networks, while gpt-oss leans towards a wider architecture with fewer, larger experts."
audience:
  - "AI engineers looking to understand the fundamental architectural differences among state-of-the-art LLMs."
  - "Tech leads planning infrastructure for hosting or fine-tuning models."
---
While it has been several years since the original GPT architecture was introduced, the core of contemporary models might look superficially similar. However, if we closely examine the flagship models released in 2025 and 2026 (such as [DeepSeek V3](https://arxiv.org/abs/2412.19437), Llama 4, Gemma 3, and Kimi K2), we find that underlying architectures have undergone subtle yet critical evolutions.

Adapted from Sebastian Raschka's comprehensive analysis ([original article](https://magazine.sebastianraschka.com/p/the-big-llm-architecture-comparison)), this article breaks down the engineering choices behind today's leading open-weight models. Why do some models rely heavily on Mixture-of-Experts (MoE)? Why are others redesigning their attention mechanisms and normalization layouts? Let’s dive in.

> **Huahua in one sentence**
>
> The core of modern LLM architecture innovation is no longer just a "parameter scale race." It is fundamentally about **"how to pack the most efficient caching and routing strategies into limited inference memory bandwidth."**

## 1. DeepSeek V3's Efficiency Double-Edged Sword: MLA and MoE

DeepSeek V3 (and its subsequent reasoning offshoot, DeepSeek R1) made waves in the open-source ecosystem largely due to its remarkable computational efficiency. This efficiency is driven by two core techniques: **Multi-Head Latent Attention (MLA)** and **Mixture-of-Experts (MoE)**.

### 1.1 Multi-Head Latent Attention (MLA)

Traditional Multi-Head Attention (MHA) consumes an enormous amount of memory for KV Caching during inference. Historically, Grouped-Query Attention (GQA) mitigated this by having multiple query heads share the same KV heads (e.g., grouping 4 attention heads to share 2 KV groups) to reduce memory bandwidth usage.

![MLA vs MHA Architecture](/blog/76-big-llm-architecture-comparison/fig_mla_vs_mha.webp)

DeepSeek V3, however, discarded GQA in favor of their proprietary MLA. Instead of a "sharing" strategy, MLA **compresses Key and Value tensors into a lower-dimensional latent space**, stores them in the KV cache, and only projects them back to their original dimensions during inference. Studies show this not only saves memory but can even slightly outperform standard MHA and GQA in ablation benchmarks.

### 1.2 Mixture-of-Experts (MoE) and the Shared Expert

DeepSeek V3 boasts a massive 671 billion parameters, but only activates around 37 billion parameters during inference. It achieves this by replacing the standard FeedForward module with a vast network of experts.

![DeepSeek MoE Module](/blog/76-big-llm-architecture-comparison/fig_deepseek_moe.webp)

Each of its MoE modules contains 256 experts, routing tokens to just 8 experts at a time, plus **1 permanently active Shared Expert**. The Shared Expert absorbs general syntax and foundational logic, leaving the remaining 256 routed experts with more capacity to learn highly specialized, domain-specific knowledge without redundancy.

## 2. A Compact Engineering Masterclass: OLMo 2 and Gemma 3

While OLMo 2 and Gemma 3 do not boast the staggering parameter counts of DeepSeek, their architectural refinements are textbook examples of efficient design.

### 2.1 OLMo 2's QK-Norm and Post-Norm

To stabilize training, OLMo 2 adopted a variation of Post-Norm (Post-LN). While the original GPT and Llama families popularized Pre-Norm to ensure stable gradients at initialization, Pre-Norm can suffer from performance degradation in extremely deep networks.

![OLMo 2 Post-Norm Architecture](/blog/76-big-llm-architecture-comparison/fig_olmo_norm.webp)

OLMo 2 placed the RMSNorm layers *after* the Attention and FeedForward modules (though still within the residual connections). Furthermore, they introduced a **QK-Norm** before the Query and Key dot product. Together, these tweaks effectively smooth out gradients and heavily reduce the risk of training collapse during long-horizon optimization.

### 2.2 Gemma 3's Sliding Window Attention
Instead of reducing active parameters like MoE, Gemma 3 solves the computational explosion associated with long-context attention. Gemma 3 mixes Global Attention with Local Attention at a 1:5 ratio. This means only 1 out of 6 layers uses global attention, while the other 5 use a **sliding window attention** restricted to a 1024-token context. Experiments prove this dramatically cuts down KV Cache usage with minimal impact on generation quality.

> **Huahua's engineering note**
>
> Many engineering teams stumble when fine-tuning these newer architectures. The unique normalization layouts in Gemma 3 and its sliding window attention mean that you cannot blindly reuse Llama 3 fine-tuning or inference scripts. Always verify that your serving framework (e.g., vLLM) or training library (e.g., TRL) natively supports these specific architectural modules.

## 3. The Design Philosophies at the Trillion-Parameter Scale

When evaluating even larger models like Qwen3, gpt-oss, Kimi K2, and GLM-4.5, we see clear architectural divergence, particularly around the trade-offs between **depth vs. width** and **expert count vs. expert size**.

### 3.1 Width (gpt-oss) or Depth (Qwen3)?

![gpt-oss vs Qwen3 Architecture](/blog/76-big-llm-architecture-comparison/fig_gptoss_vs_qwen3.webp)

- **Qwen3 (30B/235B)** leans towards a **deeper architecture** (e.g., using 48 Transformer blocks). Deeper architectures often yield more complex logical compositions but can suffer from unstable gradients and optimization difficulties during training.
- **gpt-oss (20B/120B)** opted for a **wider architecture**. It features only 24 Transformer layers but dramatically increased its embedding dimension to 2880, while also widening the intermediate projection layers. Wider models are generally easier to parallelize across hardware during inference, leading to a much higher `tokens/sec` generation throughput. Furthermore, gpt-oss resurrected the GPT-2 era **Attention Bias** and introduced "**Implicit Attention Sinks**." Instead of prepending actual dummy tokens to absorb useless attention scores, gpt-oss adds a learnable per-head bias logit directly into the attention mechanism to stabilize long-context processing.

### 3.2 Expert Configurations: Few and Large vs. Many and Small

- Qwen3 and DeepSeek V3 favor **a massive number of small experts** (e.g., 128 or 256).
- gpt-oss and Grok 2.5 lean toward **a handful of massive experts** (e.g., just 8 or 32). In gpt-oss, only 4 massive experts are activated during inference, compared to Qwen 3's 8 active experts. This design is explicitly meant to squeeze maximum utilization out of GPU memory bandwidth constraints.

### 3.3 GLM-4.5's Pre-MoE Dense Layers

GLM-4.5 is another trillion-parameter contender whose design philosophy strongly echoes DeepSeek V3 (employing both MLA and MoE). However, it made a very specific tweak in the early stages of the network.

![GLM-4.5 vs Qwen3 Architecture](/blog/76-big-llm-architecture-comparison/fig_glm_vs_qwen3.webp)

Before routing tokens into the MoE sparse blocks, GLM-4.5 **deliberately retains 3 traditional Dense layers**. The engineering rationale here is that massive MoE systems often suffer from unstable feature extraction early in training due to the randomness of sparse routing. By keeping the initial layers dense, the model forms a solid foundation for syntactic and semantic feature extraction before handing off high-level logic to the MoE routing mechanism.

### 3.4 Mistral Small 3.1's Latency Trade-offs

![Mistral Small 3.1 vs Gemma 3 Architecture](/blog/76-big-llm-architecture-comparison/fig_mistral_vs_gemma.webp)

If Gemma 3 chose to push memory compression to its limits via a 1:5 "sliding window attention" ratio, Mistral Small 3.1 walked the opposite path, obsessively optimizing for low latency. Mistral entirely abandoned its previously championed sliding window attention, reverting to standard Grouped-Query Attention (GQA). While this theoretically increases KV cache memory overhead, reducing the layer count and relying heavily on highly optimized, native backend kernels (like FlashAttention) allows Mistral to achieve significantly faster generation speeds than Gemma 3.

> **Huahua's take**
>
> In the short term, **MLA combined with highly granular, small-expert MoE** (the path taken by DeepSeek and Kimi K2) represents the optimal solution for balancing training throughput and inference cost at the hundred-billion parameter scale. However, for on-device small models (like Gemma 3n), pushing the limits of memory compression via **sliding window attention** and **Per-Layer Embedding (PLE)** remains the key battlefield.

## 4. SmolLM3 and the Surprise of No Positional Embeddings (NoPE)

Although SmolLM3 is a relatively compact 3-billion-parameter model, its architectural experiments are highly instructive. The most striking design choice is its partial abandonment of traditional positional encodings (like RoPE) in favor of **NoPE (No Positional Embeddings)**.

Historically, Transformers required absolute or relative positional encodings to understand word order. However, NoPE proves that by relying solely on the Causal Attention Mask, the model can implicitly learn sequence directionality. More importantly, NoPE has been shown to significantly improve "Length Generalization"—meaning its performance degrades much slower when confronted with inference sequences longer than its training context. SmolLM3 applies NoPE in every 4th layer, paving a new path for long-context processing in lightweight models.

## 5. Kimi K2: The Trillion-Parameter Behemoth and Muon Optimizer

Scaling back up to massive models, Kimi K2 stunned the community with its **1-Trillion parameter** scale. Its foundational architecture is essentially a scaled-up version of DeepSeek V3 (employing both MLA and MoE), but it features a major breakthrough in training engineering: ditching the industry-standard AdamW for the **Muon optimizer**.

This marks the first time Muon has been proven to stabilize convergence at the hundred-billion or trillion scale (it was previously only verified up to 16B). Muon yielded an exceptionally smooth and rapidly decaying training loss curve, which is the underlying reason Kimi K2 is able to rival proprietary models like GPT-4 and Claude 3.5 in modern benchmarks.

## Conclusion and Future Outlook

Looking at the leap from 2025 to 2026, LLM architectures have shifted from a blind pursuit of "parameter stacking" to a highly compromised yet perfectly optimized art form tailored for hardware and memory bandwidth. Novel experiments like NoPE (No Positional Embeddings) on SmolLM3, and the revival of Attention Bias and Attention Sinks in gpt-oss, prove that architectural evolution is still full of surprises.

In the short term, we will likely continue to see a polarization between "massive behemoth models" (like Kimi K2) and "on-device micro models" (like Gemma 3n). Will we soon see a new foundational design that completely upends the rules of the game like the Transformer did? We will just have to wait and see.

## References / Source Article

- **Original Analysis**: Sebastian Raschka. "The Big LLM Architecture Comparison." *Ahead of AI*. [https://magazine.sebastianraschka.com/p/the-big-llm-architecture-comparison](https://magazine.sebastianraschka.com/p/the-big-llm-architecture-comparison)

If you are building Agent infrastructure within an enterprise, your base model selection should look beyond simple leaderboards and heavily factor in the architecture itself: **Does it use MoE? Does it employ sliding window attention? This will directly dictate how many GPUs you need to provision for high-concurrency production workloads.**

To understand the limitations of long-horizon reasoning that these models face, refer to our [What Is AgentEscapeBench: Measuring Out-of-Domain Tool Reasoning](/en/blog/74-agentescapebench-ood-tool-reasoning).

*(Insights and architectural benchmarks synthesized from Sebastian Raschka's deep dive.)*
