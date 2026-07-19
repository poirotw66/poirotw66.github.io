---
title: "RAG-MCP: Combating Prompt Bloat in the Sea of MCP Tools Using Semantic Retrieval (Detailed Notes)"
description: "Interpreting the RAG-MCP three-stage pipeline, the 11,100 tool stress test, MCPBench control experiments, and engineering trade-offs based on arXiv:2505.03275."
pubDate: 2026-03-23
updatedDate: 2026-03-23
tldr:
  - "Interpreting the RAG-MCP three-stage pipeline, the 11,100 tool stress test, MCPBench control experiments, and engineering trade-offs based on arXiv:2505"
audience:
  - "AI/ML practitioners and researchers who want method, evidence, and engineering implications before a full paper read."
  - "Engineers deciding whether a paper’s ideas are worth implementing or citing."
tags: ["Paper Reading", "RAG", "MCP", "Tool Selection", "LLM Function Calling", "Prompt Bloat"]
image: "/paperReading/04-RAG-MCP/image_1.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
paper:
  title: "RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation"
  authors:
    - "Tiantian Gan"
    - "Qiyao Sun"
  year: 2025
  venue: "arXiv 2505.03275"
  links:
    pdf: "https://arxiv.org/pdf/2505.03275.pdf"
series:
  id: "rag-mcp"
  title: "RAG-MCP Deep Dive"
  part: 1
  totalParts: 1
---

MCP (Model Context Protocol) allows an assistant to attach thousands of external tools, but **prompt bloat** quickly becomes a hard limit: if you stuff all MCP schemas into the context, the model will either select the wrong API or hallucinate nonexistent ones. The core of Gan & Sun's **RAG-MCP** (arXiv:2505.03275) is very simple: **tool discovery = retrieving sub-problems**. The generation LLM only looks at the top-k (often **1** in experiments) most relevant MCPs.

---

> **Huahua in one sentence**
>
> More tools do not make a model more useful; retrieve a small relevant tool set before reasoning to control both context cost and selection quality.

### §1 The Problem: Tool Scale vs. Context Window

**§1.1 Background:**

- Tool use in LLMs already has paths like Toolformer, ReAct, WebGPT, and Gorilla.
- After the standardization of MCP, there are **4,400+ servers on mcp.so** (as of §2.3, 2025/4) — the toolset will continue to expand.
- **Prompt bloat:** Full-set schemas → context saturation → decreased distinguishability (§3.1).

**Needle-in-a-Haystack Analogy (§3.1):** The authors designed an **MCP stress test** — hiding 1 ground-truth MCP among N MCPs, measuring the degradation of selection capability as N increases.

---

### §2–3 Methodology: The RAG-MCP Three-Stage Pipeline (Figure 2, §3.2–3.3)

```
User Task → (1) Retrieval → (2) Validation → (3) LLM + Single MCP Execution
```

| Stage | What it does | Details (§3.2) |
|------|--------|--------------|
| **Retrieval** | Vector index searches MCP metadata | Experiments use **Qwen-max** to encode queries; semantic top-k. |
| **Validation** | Optional few-shot probing | Tests compatibility by making synthetic queries against candidate MCPs. |
| **Invocation** | **Injects only the best MCP** schema | The LLM focuses on planning and parameter filling, no longer doing discovery. |

**Advantages over Blank Conditioning (§3.2 bullet list):**

- **Reduced prompt size** — Avoids full-set loading.
- **Lower cognitive load** — Fewer distractors.
- **Resource efficiency** — Only starts the selected MCP server, not instantiating all of them.
- **Multi-turn robustness** — Each turn retrieves tools anew via the retriever, eliminating the need to stuff the entire list again.

---

### §3.1 MCP Stress Test Design

- **N:** 1 → **11,100**, across 26 intervals (§3.1, §4.1).
- Per trial: **1 ground-truth + (N−1) distractors**, registry from **4,400+ public servers**.
- **20 web-search tasks** / configuration; the model needs to (a) select the correct MCP, (b) issue a valid query, and (c) return the result.
- **Figure 3:** The horizontal axis is MCP position 1–11,100, yellow = success, purple = failure.

**§5 Observed Patterns:**

| Range | Phenomenon |
|------|------|
| position &lt; 30 | Success rate **>90%** (small pool). |
| 31–70 | MCPs with semantic overlap increase, failure clusters. |
| **≳100** | Purple dominates — **retrieval precision** becomes the bottleneck. |
| Sporadic yellow dots at high positions | A few MCPs still highly align with specific queries. |

> **Anchor:** This indicates that RAG-MCP **mitigates bloat ≠ infinite scaling**; a registry in the tens of thousands requires hierarchical / adaptive retrieval (Conclusions §5).

---

### §4.2 MCPBench Main Experiment (Table 1)

**Setup (§4.2):**

- Data: **MCPBench web search subset**.
- Base LLM: **qwen-max-0125**; evaluated by **Deepseek-v3**; answer validation via **Llama-as-Judge**.
- **20 trials** per baseline; up to **10 turns** of MCP interaction per trial.
- Success definition: **>10 times correct** out of 20.

**Three Baselines (§4.2):**

1. **Blank Conditioning** — All N MCP descriptions are put into the prompt.
2. **Actual Match** — Keyword pre-filtering before prompting.
3. **RAG-MCP** — Vector retrieval, **only top-1 MCP injected**.

**Table 1 Results:**

| Method | Accuracy | Avg Prompt Tokens | Avg Completion Tokens |
|------|----------|-------------------|------------------------|
| **RAG-MCP** | **43.13%** | **1,084** | 78.14 |
| Actual Match | 18.20% | 1,646 | 23.60 |
| Blank | 13.62% | 2,133.84 | 162.25 |

**How to Read:**

- Accuracy: **43.13 vs 13.62** ≈ **3.17×** (Abstract states "more than triples").
- Prompt tokens: **1,084 vs 2,133.84** ≈ **49% reduction** ("over 50%").
- Completion tokens increase, but authors believe this trades off for higher task success (§4.2, §5.1).

**§5.1 Attribution:**

- Focused context filtering.
- Prompt efficiency → larger window for reasoning.
- Balanced generation → slightly longer completions correspond to more thorough validation.

---

### Analogy to Standard RAG (§1, §2.2)

| RAG QA | RAG-MCP |
|--------|---------|
| Index Wikipedia paragraphs | Index MCP schemas + usages |
| Retrieve top articles | Retrieve top tools |
| Feed LLM to generate answer | Feed LLM for **function calls** |

**Extensibility (§1.2):** New MCPs **only require updating the external index**, with no need to retrain the LLM — critical for a rapidly iterating tool ecosystem.

---

### Limitations & Editor's Judgment

1. **43% is still not high** — web search subset + many distractors; still needs reranking, hierarchical indexing, and tool domain partitioning before being "production-ready."
2. **Top-1 Injection** — A retrieval miss means total failure; the paper doesn't delve deeply into the trade-off of top-k > 1.
3. **Validation Cost** — Synthetic probes increase latency (§3.2 step 2).
4. **Domain Extrapolation** — The experiment focuses on WebSearch; MCPs like DB, Git, and Slack have closer semantics, and their failure modes might differ.

**Overall Assessment:** This is one of the clearest papers applying **RAG's "narrow down the evidence set first"** principle to tool routing. In engineering, one should default to **"if registry >50, you should have a retriever,"** instead of continuously piling on to AGENTS.md.

---

### 3rd Pass Extensions

- [ ] Plot the **N–accuracy** curve with our own MCP list to find the knee point.
- [ ] Try **top-3 injection + LLM reranking** vs. top-1.
- [ ] Measure the latency difference between **retrieval-only vs. retrieval+validation**.

---

### Original Source

- Gan, Sun. *RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation*. arXiv:2505.03275 (2025). [PDF](https://arxiv.org/pdf/2505.03275.pdf)
