---
title: "Ornith 1.0 and Self-Scaffolding: Training, Evaluation, and Trust Boundaries for Agentic Coding"
description: "A structured look at Ornith-1.0's Self-Scaffolding, anti-reward-hacking controls, and Pipeline-RL design, plus the evaluation and trust boundaries needed for agentic coding systems."
pubDate: 2026-07-23
updatedDate: 2026-07-23
tldr:
  - "Ornith-1.0 proposes Self-Scaffolding to co-evolve models and tool orchestration for agentic coding tasks."
  - "Reported benchmarks remain vendor claims; production use needs independent validation, permission isolation, and immutable outer controls."
audience:
  - "Engineers researching agentic coding, harness engineering, and model evaluation"
  - "Technical decision-makers assessing open-source coding agents and their governance risks"
category: "AI Engineering"
tags: ["Machine Learning","AI Agent","Harness Engineering","Research","Evaluation"]
kind: "article"
showToc: true
image: "/blog/69-ornith-1-0-self-scaffolding-llm/title_image.jpg"
---
**Primary source:** [Ornith-1.0: Self-Scaffolding LLMs for Agentic Coding | DeepReinforce Blog](https://deep-reinforce.com/ornith_1_0.html)

In June 2026, the open-source AI community witnessed a groundbreaking release: DeepReinforce introduced **Ornith-1.0**, a self-improving family of open-source models designed specifically for agentic coding.

The flagship **Ornith-1.0-397B** achieved a staggering **77.5** on Terminal-Bench 2.1 and **82.4** on SWE-Bench Verified. This not only surpassed leading open-source models of similar scale like MiniMax M3 and DeepSeek-V4-Pro, but also outperformed Anthropic's flagship closed-source model, **Claude Opus 4.7** (70.3 / 80.8).

Even more impressive, the compact **Ornith-1.0-9B**, deployable on edge devices, matched or exceeded the performance of much larger 31B and 35B models.

> **Huahua in one sentence**
>
> Self-Scaffolding is not only about a model writing tools; it is about training and evaluating tasks, tools, and verification together.

Why is this open-source model so extraordinarily capable? In this article, we dive into the technical core of Ornith-1.0 and deconstruct its revolutionary **Self-Scaffolding** framework and engineering implementation details.

---

## 1. Model Lineup & Pretraining Bases

Ornith-1.0 is not a single model, but a complete family spanning from edge devices to frontier cloud compute. The team selected the strongest open pretraining bases, **Gemma 4** and **Qwen 3.5**, for fine-tuning and reinforcement learning:

1. **Ornith-1.0-9B (Dense)**: Based on Gemma 4 / Qwen 3.5 dense models, tailored for edge devices with fast inference and low memory footprint.
2. **Ornith-1.0-31B (Dense)**: Medium-sized dense model balancing single-core reasoning power and local deployment capability.
3. **Ornith-1.0-35B (MoE)**: Built on Mixture-of-Experts architecture, delivering punch-above-its-weight coding performance at low active parameter counts.
4. **Ornith-1.0-397B (MoE)**: Flagship ultra-scale MoE model designed for highly complex software engineering tasks and multi-agent coordination.

---

## 2. Core Innovation: "Self-Scaffolding" (Learning to Author Its Own Harness)

In traditional reinforcement learning (RL) for agentic coding, human engineers design a fixed, domain-wide **harness (scaffold)** to drive model rollouts.

However, the DeepReinforce team identified a key limitation: **a fixed harness caps the model's reasoning potential**. Different coding tasks require fundamentally different reasoning architectures and tool orchestration strategies.

To solve this, Ornith-1.0 introduces the **Self-Scaffolding Co-evolution Framework**:

```
+-----------------------------------------------------------------------------------+
|                        Ornith 1.0 Self-Scaffolding RL Step                        |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ Task Description + Prior Scaffold ]                                            |
|                  │                                                                |
|                  ▼                                                                |
|   Stage 1: Propose Refined Scaffold (Model authors task-specific harness)         |
|                  │                                                                |
|                  ▼                                                                |
|   Stage 2: Generate Solution Rollout (Model executes path on its scaffold)       |
|                  │                                                                |
|                  ▼                                                                |
|   [ Reward Signal ] ── (Propagates reward back to BOTH Stage 1 & Stage 2)         |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

During each RL step, execution proceeds in two distinct stages:
1. **Stage 1 (Scaffold Proposal)**: Conditioned on the task and previous scaffolds, the model proposes and refines a customized harness for that specific task (including memory management, retry logic, and tool orchestration).
2. **Stage 2 (Solution Rollout)**: Conditioned on its self-authored harness, the model generates the final code solution trajectory.

The environment reward is **propagated back to both stages**. As a result, the model learns not only how to produce correct code answers, but also how to build the optimal cognitive orchestration for itself.

---

## 3. Preventing Reward Hacking: A 3-Layer Defense

Allowing a model to author its own harness creates a severe risk of **reward hacking**—the model might learn to cheat (e.g., hardcoding test outputs, copying hidden oracle files, or modifying verifier scripts).

To eliminate gaming behaviors, Ornith-1.0 implements a robust 3-layer defense:

1. **Immutable Outer Trust Boundary**:
   The environment, tool surface, and test isolation scripts are fixed and completely outside the model's control. The model can only evolve its inner policy scaffold (e.g., memory management, error handling, retry logic).
2. **Deterministic Monitor**:
   Monitors tool usage in real time. Any attempt to read withheld paths, alter test scripts, or execute unauthorized actions results in an immediate **0 reward** and exclusion from advantage computation.
3. **Frozen LLM Judge**:
   To catch intent-level gaming within allowed tool calls, a frozen LLM judge sits on top of the verifier with a final veto power.

---

## 4. Asynchronous Pipeline-RL with Staleness Weighting

During long rollout trajectories, off-policy tokens can degrade RL stability. Ornith-1.0 utilizes **Pipeline-RL** with a **Staleness Weight \(w(d_t)\)** based on token age \(d_t\):

\[
w(d_t)= \begin{cases} 
1, & \text{if } d_t \le K_1,\\ 
\exp\!\bigl(-\lambda(d_t-K_1)\bigr), & \text{if } K_1 < d_t \le K_2,\\ 
0, & \text{if } d_t > K_2.
\end{cases}
\]

Combined with the token-level GRPO loss function:

\[
L_t=\min\!\bigl(r_t A_t,\; \mathrm{clip}(r_t,1-\epsilon^{-},1+\epsilon^{+})A_t\bigr)\cdot w(d_t)
\]

where \(r_t\) represents the probability ratio between the new and old policy. This ensures training stability and fast convergence even over extended reasoning trajectories.

---

## 5. Benchmark Highlights

Across standard benchmarks, Ornith-1.0 demonstrates remarkable efficiency across parameter scales:

### Flagship Scale (397B / Frontier Class)
| Benchmark | Ornith-1.0-397B | Qwen3.5-397B | Qwen3.7-Max | DeepSeek-V4-Pro | Claude Opus 4.7 | Claude Opus 4.8 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Terminal-Bench 2.1 (Terminus-2)** | **77.5** | 53.5 | 73.5 | 64.0 | 70.3 | 85.0 |
| **Terminal-Bench 2.1 (Claude Code)** | **78.2** | 48.6 | 69.8 | 66.5 | 69.7 | 78.9 |
| **SWE-Bench Verified** | **82.4** | 76.4 | 80.4 | 80.6 | 80.8 | 87.6 |
| **SWE-Bench Pro** | **62.2** | 51.6 | 60.6 | 55.4 | 64.3 | 69.2 |
| **SWE-Bench Multilingual** | **78.9** | 69.3 | 78.3 | 76.2 | - | - |
| **NL2Repo** | **48.2** | 36.8 | 47.2 | - | - | 69.7 |
| **ClawEval Avg** | **77.1** | 70.7 | 65.2 | 75.8 | 78.2 | - |

### Medium & Edge Scales (35B & 9B Class)
* **Ornith-1.0-35B**: Achieved **64.2** on Terminal-Bench 2.1, completely outperforming the 397B Qwen 3.5-397B (53.5), and reached **75.6** on SWE-Bench Verified.
* **Ornith-1.0-9B**: Reached **69.4** on SWE-Bench Verified, matching or surpassing 31B models like Gemma 4-31B (52.0) and Qwen 3.5-35B (70.0).

---

## 6. Engineering recommendations for teams

Based on Ornith-1.0's Self-Scaffolding success, we offer four key engineering recommendations for teams building agentic systems:

> [!TIP]
> 1. **Move Beyond Static System Prompts to Dynamic Context Orchestration**:
>    Static prompts hit performance ceilings. Engineering teams should build dynamic architectures that adjust thinking levels and tool combinations based on task complexity.
> 
> 2. **Enforce Hard Trust Boundaries**:
>    When empowering agents with autonomous workflows, strictly isolate environments and verification scripts outside agent permissions to prevent unintended behavior.
> 
> 3. **Implement Dual-Layer Evaluation (Deterministic Monitor + LLM Judge)**:
>    Relying on a single verifier creates blind spots. Combine code-level boundary monitoring with LLM-based intent auditing for production safety.
> 
> 4. **Capitalize on Edge Model Cost-Efficiency**:
>    Ornith-1.0-9B demonstrates that well-scaffolded 9B/35B models can match 100B+ models on domain-specific coding tasks, cutting inference costs by over 80%.

---

## 7. Engineering perspective: benchmark leadership is not automatic authorization

Ornith-1.0 suggests a key thesis: **AI-agent capability depends not only on model parameter count, but also on how the Harness (scaffold) and model co-evolve**. The comparisons and scores in this article should be treated as publisher-reported results and revalidated against your own repository, toolchain, and permission model.

If an agent can dynamically change its workflow, environment isolation, tool allowlists, test data, and release permissions must remain in an outer control plane the model cannot modify. Otherwise, strategies that improve a benchmark can also become ways to bypass constraints.

## Continue reading

- [The Complete AI Agent Guide: Architecture to Production](/blog/64-ai-agent-guide/)
- [Gemini 3.6 Flash, 3.5 Flash-Lite, and Cyber: an Engineering View of Agent Model Selection](/blog/67-gemini-3-6-flash-cyber/)

> **Huahua's engineering note**
>
> Keep immutable trust boundaries, deterministic monitoring, and human approval outside the Harness; then use small, reversible workloads to prove that a model improves cost or quality.
