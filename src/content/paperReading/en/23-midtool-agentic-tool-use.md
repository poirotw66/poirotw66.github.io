---
title: "MidTool: Does Teaching Tool Use During Mid-Training Make Agents More Reliable?"
description: "A deep reading of MidTool, which moves schema grounding, workflow composition, and recovery under incomplete information into a 20.3B-token mid-training mixture—while web search remains at 0%."
pubDate: 2026-08-24
updatedDate: 2026-08-24
tldr:
  - "MidTool-Mix combines web, PDF, code, and API/MCP trajectories into a 20.3B-token, 11.22M-sample mid-training mixture, with separate synthesis branches for grounding and execution."
  - "Under the paper's fixed Qwen3-4B + SFT setting, MidTool-Mix raises BFCLv3 overall from 39.73% to 50.25%, \\tau^{2}-Bench Pass@4 from 20.50% to 28.06%, and MCP-Universe pass from 1.68% to 5.03%."
  - "This is not 'tool use solved': the MCP-Universe web-search subset remains at 0.00%, and the dataset and checkpoints are gated by access conditions and upstream terms."
audience:
  - "AI engineers designing tool-use mid-training, function calling, MCP agents, or long-horizon interactive evaluation"
  - "Researchers and engineering teams deciding whether an agent learned tool affordances and workflows or only memorized formats for fixed tools and short traces"
tags: ["Paper Reading", "Agent Systems", "Tool Use", "MCP", "Training"]
image: "/paperReading/23-midtool-agentic-tool-use/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - tool-use-coding-agents
paper:
  title: "MidTool: Mid-training Data Synthesis for Agentic Tool Use"
  authors:
    - "Fengqing Jiang"
    - "Yite Wang"
    - "Boyi Liu"
    - "Zhaoyang Wang"
    - "Canwen Xu"
    - "Zhewei Yao"
    - "Radha Poovendran"
    - "Yuxiong He"
  year: 2026
  venue: "arXiv 2608.20314 v1 (2026-08-20)"
  links:
    pdf: "https://arxiv.org/pdf/2608.20314v1"
    arxiv: "https://arxiv.org/abs/2608.20314"
    project: "https://huggingface.co/datasets/MidTool/MidTool-Mix"
---

## The paper in 90 seconds

- **Problem:** Tool use is not merely about outputting syntactically valid function names and JSON arguments. An agent must recognize tool affordances from documentation, schemas, code, and incomplete dialogue; decide when to invoke tools; compose multiple steps; and clarify missing information or recover from failures. MidTool asks whether these capabilities can be instilled into base models earlier, via dedicated mid-training, rather than being left almost entirely to post-training.
- **Core insight:** Deconstruct transferable tool-use priors into two distinct, complementary dimensions: "grounding" (identifying tool affordances and boundaries from unstructured developer material) and "execution" (orchestrating multi-turn interactive calls on structured interfaces). By creating MidTool-Mix (20.3B tokens, 11.22M samples), the authors provide balanced supervision through context-grounded trajectory augmentation and native agentic synthesis.
- **Strongest evidence:** Under controlled experiments with Qwen3-4B-Base and a fixed 100K TOUCAN SFT recipe, MidTool-Mix increases BFCLv3 overall from 39.73% to 50.25% (+10.52 pp), $\tau^2$-Bench Pass@4 from 20.50% to 28.06% (+7.56 pp), and MCP-Universe pass from 1.68% to 5.03% (+3.35 pp). Qwen3-8B and RL stages demonstrate consistent positive gains. Table 6 ablations confirm that both synthesis branches are necessary.
- **Main boundary:** The MCP-Universe web-search slice remains at 0.00% across score and pass rate; a visual tool-use pilot shows tool execution success without corresponding gains in final-answer grounding; and substantial training compute (32 H200s and 8 B200s) alongside unverified synthetic data define clear reproduction limits.

Traditional tool use assumes that base models already possess adequate background knowledge, leaving downstream supervised fine-tuning (SFT) on tens of thousands of demonstration traces to handle API formatting. However, when faced with unfamiliar tools, omitted parameters, or long-horizon dialogues, models frequently hallucinate or fail to recover from errors. MidTool challenges this post-hoc paradigm by introducing a dedicated mid-training phase between general pre-training and post-training. The central contribution is not another benchmark record, but a quantitative demonstration that injecting tool priors early accelerates downstream adaptation and enhances cross-domain transfer.

The bounded verdict is: **MidTool's primary value lies in formalizing transferable tool priors into complementary grounding and execution problems, proving through ablation that both are required; yet it establishes an equally important boundary: general tool mid-training does not spontaneously produce deep-search agents capable of iterative evidence synthesis and hypothesis testing.**

This reading follows [arXiv:2608.20314 v1](https://arxiv.org/abs/2608.20314), submitted on 2026-08-20 (not peer-reviewed). The scope covers the [arXiv HTML version](https://arxiv.org/html/2608.20314v1), Tables 2–6, Appendices A–D, the visual tool pilot, and limitations.

> **Huahua's engineering note**
>
> If your agent successfully executes tool calls but frequently misrepresents the returned results in its final answer, merely adding more function-calling demonstrations will rarely fix the issue. MidTool suggests a valuable hypothesis: teach the model to comprehend tools and workflows during mid-training, and reserve post-training for aligning product behavior. Crucially, always evaluate tool execution success and final-answer grounding separately.

![MidTool Figure 1: an overview of the data sources, training pipeline, and MCP-Universe result.](/paperReading/23-midtool-agentic-tool-use/paper/figure-1-teaser.webp)

*Figure 1, the paper teaser: web, PDF, tool, code, and agentic trajectories on the left; base model → mid-training → tool-use SFT → agentic RL in the middle; and the paper's MCP-Universe transfer illustration on the right. This is an author overview, not an independent benchmark; locate the original at [Figure 1](https://arxiv.org/html/2608.20314v1#S0.F1). Image from the arXiv HTML page, marked CC BY 4.0.*

## What to know first

Before examining the pipeline details, several foundational concepts and existing limitations warrant clarification:

### What is Mid-training

Mid-training is a dedicated training phase situated between large-scale general pre-training and post-training alignment (SFT / RL). It maintains the autoregressive language modeling objective of pre-training but trains on a highly filtered, domain-focused corpus. Rather than locking in output formats or conversational personae, it reshapes the internal representation and prior distribution of the base model for a specific capability domain.

### Grounding vs. Execution: The Dual Facets of Tool Use

The paper partitions agentic tool use into two interdependent capabilities:

1. **Grounding:** Detecting tool existence, boundaries, required fields, parameter types, and workflow dependencies from unstructured developer documentation, SDK codebases, and manuals.
2. **Execution:** Scheduling sequential invocations, identifying missing inputs, prompting for clarification, interpreting structured tool outputs, and revising execution plans when errors arise.

### Why Existing Post-training Approaches Fall Short

Prior methods typically take a pre-trained base model and apply SFT using thousands of demonstration dialogues. This approach suffers from a fundamental bottleneck: narrow demonstration sets teach the model the superficial formatting of tool calls (valid JSON syntax), but fail to impart broad background knowledge regarding API architectures, interface conventions, and system dependencies.

When encountering unfamiliar MCP tools or complex schemas, models without deep tool-use priors struggle to infer affordances, hallucinate parameter values, and fail to recover when tools return unexpected states. Trying to teach both foundational domain knowledge and conversational behavior simultaneously during SFT overloads post-training.

### The Core Question for the Reader

The essential question is not whether training on more tool trajectories improves benchmark scores. Rather, it is: **under strictly fixed downstream SFT and RL recipes, does shifting general tool-use data into a dedicated mid-training phase instill transferable priors that help small base models (4B/8B) generalize to unfamiliar tools, long-horizon workflows, and schema grounding?**

## Core intuition

MidTool approaches model development much like onboarding an engineer: before assigning live customer tasks, an engineer should first read API manuals, SDK codebases, and architectural references to build a mental map of system affordances. Downstream training then focuses purely on organizational policies, security rules, and user interaction styles.

If formatting is forced only at the very end of training, the model resembles an untrained operator attempting tasks without documentation: it may output valid syntax, yet fail to understand when to invoke an endpoint, what questions to ask when parameters are missing, or how intermediate results should govern subsequent actions.

This intuition underpins the two distinct synthesis branches:
- **Context-grounded branch:** Teaches the model to comprehend tools from messy, descriptive technical texts.
- **Native agentic branch:** Teaches the model to execute workflows accurately across structured, callable interfaces.

Combining both branches establishes an effective foundation for general tool agency.

## Walk one example through the method

To trace the pipeline from Section 2.2 to Section 2.3 end-to-end, consider the following representative trace:

1. **Raw Input:** An e-commerce developer guide states: "Invoke `search_orders` with a customer ID to list past transactions. Retrieve `order_id` and call `refund_order` to process a refund. If the user does not specify a refund date, prompt the user for clarification before proceeding."
2. **Filtering and Affordance Extraction:** The document passes fastText and heuristic quality filters. A teacher model (Qwen3-235B-A22B-Instruct-2507) processes the text, identifying tool boundaries, mandatory parameters (`order_id`, `amount`, `refund_date`), and sequential workflow dependencies.
3. **Planning and Trajectory Synthesis:** A rule-based planner scores the document's information density and assigns a generation budget. The teacher model generates two samples: a single-step parameter extraction exercise and a multi-turn dialogue where the agent asks the user to clarify the missing date, then issues `search_orders` followed by `refund_order`.
4. **Validation and Consistency Check:** If routed to the native branch, the sample undergoes strict static checks: verifying turn ordering, ensuring all required schema parameters are populated, verifying mock response formats, and testing whether subsequent steps logically align with previous tool outputs. Generations failing validation are retried with diagnostic feedback; persistent failures are discarded.
5. **Mid-training and Downstream Transfer:** Approved samples are integrated into the 20.3B-token MidTool-Mix for 1-epoch mid-training. The model then undergoes the fixed TOUCAN SFT recipe. When evaluated on an unseen travel-refund MCP server, the model naturally identifies prerequisite search steps and proactively asks for missing booking references.
6. **Likely Failure Point:** If the mock API returns an error such as `{"status": "failed", "reason": "order_locked"}`, but the model ignores the response payload and outputs a generic confirmation claiming successful refund, it demonstrates an ungrounded final-answer failure mode.

## Technical mechanism

MidTool's data construction integrates four complementary sources, source-specific filtering and deduplication, and two distinct synthesis branches.

### Stage 1: Collecting Complementary Raw Sources

MidTool deliberately draws upon four varied media types:

- **Web Data:** Processed Common Crawl dumps from FineWeb (2020–2025), selecting API references, developer manuals, troubleshooting wikis, tutorials, and CLI command documentation.
- **PDF Documents:** The English subset of FinePDFs, extracting enterprise software manuals, architectural handbooks, and comprehensive procedural guides.
- **Source Code:** Public GitHub repositories identified via event data, preserving libraries, SDK implementations, examples, and documentation directories while filtering out benchmark suites to prevent contamination.
- **Structured Tool Artifacts:** OpenAPI specifications, REST definitions, and Model Context Protocol (MCP) skills, providing executable schemas, typing constraints, and explicit interface boundaries.

### Stage 2: Source-Specific Filtering and Deduplication

Each raw stream passes through specialized preprocessing:

- **Code Stream:** Low-signal files (binaries, compiled artifacts, model checkpoints, logs) are stripped. The pipeline applies line count, average line length, and character-ratio heuristics, followed by exact SHA-256 and MinHash LSH deduplication. High-quality repositories prioritize `docs`, `examples`, `tutorials`, `guides`, `samples`, and `cookbook` directories.
- **Web and PDF Stream:** Filtered via a four-stage process: keyword and URL prescreening, a fastText classifier trained on LLM-annotated seeds, document-level quality scoring, and MinHash LSH deduplication. This ensures technical relevance without relying on opaque manual selection.

### Stage 3: Two Complementary Synthesis Branches

The filtered corpus feeds into two distinct augmentation pipelines:

#### Context-Grounded Trajectory Augmentation

Starting from unstructured web, PDF, and code texts, Qwen3-235B-A22B-Instruct-2507 assesses document utility and generates an affordance profile. A rule-based planner allocates generation quotas based on document quality, prompting the teacher model to synthesize QA pairs and dialogues covering tool selection, schema-grounded extraction, format-constrained calling, workflow recognition, parallel tool usage, clarification, and long-context reasoning. All outputs must satisfy semantic and syntactic parsing checks.

#### Native Agentic Trajectory Synthesis

Starting from structured REST and MCP definitions, this branch indexes available tools and normalizes schemas into canonical formats. The planner allocates budgets across single-call, multi-tool parallel, and missing-parameter clarification trajectories.

Synthesized dialogues undergo rigorous static verification: validating turn ordering, schema compliance, required argument coverage, and tool-response consistency. Samples failing checks are retried with error logs, and persistent failures are dropped. This branch also incorporates AWM environment rollouts and filtered Nemotron Agentic trajectories.

![MidTool Figure 2: the pipeline from four data families through preprocessing to two agentic trajectory synthesis branches.](/paperReading/23-midtool-agentic-tool-use/paper/figure-2-pipeline.webp)

*Figure 2, the complete pipeline in paper Section 2. Stage 3 does not turn every document directly into a successful demonstration: the context-grounded branch builds profiles and plans, while the native branch normalizes executable schemas before checking structure and response consistency. Locate the original at [Figure 2](https://arxiv.org/html/2608.20314v1#S2.F2). Image from the arXiv HTML page, marked CC BY 4.0.*

### Core Architectural Layers of the Pipeline

Figure 2 highlights how MidTool modularizes data production into auditable layers:
1. **Source Layer:** Governs whether the model encounters unstructured descriptive prose, code idioms, or machine-readable schemas.
2. **Quality Layer:** Combines fastText classification, heuristic filters, and deduplication to maintain high signal density across different modalities.
3. **Planning Layer:** Establishes affordance profiles and bounds trajectory budgets by source complexity, preventing an overrepresentation of trivial single-turn traces.
4. **Validation Layer:** Enforces syntactic and causal invariants prior to ingestion, guaranteeing that multi-turn supervision remains internally consistent.

### Composition of the 20.3B-Token Mixture

Table 2 outlines the quantitative token and sample distribution of MidTool-Mix:

| Subset | Tokens (Source / Augmented) | Samples | Share |
| --- | ---: | ---: | ---: |
| Web | 4.4B / 4.1B | 6.86M | 42% |
| PDF | 2.6B / 2.1B | 1.34M | 23% |
| Code | 3.8B / 1.5B | 2.60M | 26% |
| Native agentic trajectory | 1.8B | 0.42M | 9% |
| **Total** | **20.3B** | **11.22M** | **100%** |

Although native trajectories account for only 9% of the token volume, subsequent ablations demonstrate that they provide essential execution stability. The corpus captures approximately 2.60M unique tool identifiers and spans a 37.2% domain long tail, broadening the model's semantic exposure.

![MidTool Figure 3: the t-SNE distribution of MidTool-Mix, FineWeb, and Dolmino.](/paperReading/23-midtool-agentic-tool-use/paper/figure-3-tsne.webp)

*Figure 3, the t-SNE visualization in paper Appendix A.4: MidTool-Mix partly overlaps with FineWeb and Dolmino while also forming distinct regions. This is a qualitative embedding-space view, not causal evidence of capability improvement; locate the original at [Figure 3](https://arxiv.org/html/2608.20314v1#S2.F3). Image from the arXiv HTML page, marked CC BY 4.0.*

In Figure 3, t-SNE dimensionality reduction using Arctic-Embed-2.0-L shows that MidTool-Mix maintains overlap with standard pre-training corpora while separating into distinct clusters corresponding to workflow-intensive documentation and tool execution traces.

## How to read the evidence

### Experimental Setup and Controls

To isolate the specific impact of mid-training, the experimental design strictly standardizes downstream conditions:
- **Base Models:** Qwen3-4B-Base and Qwen3-8B-Base.
- **Infrastructure:** ArcticTraining on 32 H200 GPUs for mid-training and SFT. Mid-training runs for 1 epoch with a maximum sequence length of 8,192 and a 4M-token global batch size.
- **Fixed Downstream Recipe:** SFT uses a 100K subset of TOUCAN (sequence length 32,768); optional RL uses 8 B200 GPUs across 526 synthetic AWM environments (64 steps, 16 rollouts per step, 20-turn horizon).
- **Benchmarks:**
  - **BFCLv3:** Evaluates single-turn, multi-turn, schema extraction, and hallucination avoidance.
  - **$\tau^2$-Bench:** Evaluates multi-step goal completion and error recovery across airline, retail, and telecom scenarios.
  - **MCP-Universe:** Tests zero-shot transfer across live MCP servers (browser automation, finance, location, web search).

Native thinking modes are disabled across all models to ensure that evaluation reflects standard inference capabilities without confounders.

### Primary Benchmark Results

Under the primary comparison setting (Qwen3-4B-Base + SFT), Tables 3–5 report clear improvements:

| Benchmark | No Mid-training | + MidTool-Mix | Delta |
| --- | ---: | ---: | ---: |
| BFCLv3 overall | 39.73% | 50.25% | +10.52 pp |
| $\tau^2$-Bench overall Pass@4 | 20.50% | 28.06% | +7.56 pp |
| MCP-Universe overall pass | 1.68% | 5.03% | +3.35 pp |

The largest relative gains appear in multi-turn interactions: BFCL multi-turn accuracy increases from 15.50% to 26.63%, indicating enhanced robustness when handling missing arguments or extended multi-step dialogues.

Evaluating performance across both 4B and 8B scales illustrates broader trends:

| Base Model | Downstream Recipe | BFCLv3 overall | $\tau^2$-Bench Pass@4 | MCP-Universe pass |
| --- | --- | ---: | ---: | ---: |
| Qwen3-4B-Base | SFT | 39.73% | 20.50% | 1.68% |
| Qwen3-4B-Base + MidTool-Mix | SFT | **50.25%** | **28.06%** | **5.03%** |
| Qwen3-4B-Base | SFT + RL | 39.51% | 25.54% | 2.23% |
| Qwen3-4B-Base + MidTool-Mix | SFT + RL | **54.18%** | **38.49%** | **10.06%** |
| Qwen3-8B-Base | SFT | 47.62% | 28.06% | 3.35% |
| Qwen3-8B-Base + MidTool-Mix | SFT | **51.12%** | **34.89%** | **3.91%** |
| Qwen3-8B-Base | SFT + RL | 45.79% | 38.13% | 5.03% |
| Qwen3-8B-Base + MidTool-Mix | SFT + RL | **55.12%** | **39.57%** | **9.50%** |

These results indicate that while 4B models benefit across all metrics directly after SFT, the 8B model exhibits smaller initial gains on MCP-Universe (3.35% → 3.91%), with larger divergences manifesting primarily after RL training. This confirms that scaling preserves positive trends, though sensitivity varies across benchmark formats.

![MidTool Figure 4: SFT loss convergence on the same downstream tool-use corpus.](/paperReading/23-midtool-agentic-tool-use/paper/figure-4-sft-loss.webp)

*Figure 4, paper Appendix C.1: Qwen3-4B-Base + MidTool-Mix starts with lower SFT loss, converges faster early, and maintains lower loss through most training steps; this is an optimization-efficiency signal, not a direct agent-success metric. Locate the original at [Figure 4](https://arxiv.org/html/2608.20314v1#A3.F4). Image from the arXiv HTML page, marked CC BY 4.0.*

![MidTool Figure 5: average RL reward for the 4B model.](/paperReading/23-midtool-agentic-tool-use/paper/figure-5-rl-reward-4b.webp)

![MidTool Figure 5: average RL reward for the 8B model.](/paperReading/23-midtool-agentic-tool-use/paper/figure-5-rl-reward-8b.webp)

*Figure 5, paper Appendix C.2: MidTool-Mix initialization starts with higher RL reward and rises faster early, while the non-mid-trained baseline gradually catches up later in the same environment. This is closer to “adapts faster” than “stays higher forever”; locate the original at [Figure 5](https://arxiv.org/html/2608.20314v1#A3.F5). Image from the arXiv HTML page, marked CC BY 4.0.*

Figures 4 and 5 illustrate the underlying mechanism: mid-training improves downstream **optimization efficiency**, providing a lower initial loss surface during SFT and accelerating early reward acquisition during RL.

### Critical Failure Mode: 0.00% on Web Search

Across MCP-Universe evaluations, while browser automation, finance, and location tools demonstrated clear gains, the **web-search subset recorded 0.00% across both overall score and pass rate**.

This failure marks the primary empirical boundary of the paper: general tool use does not encompass deep-search agency. Deep search requires continuous evidence gathering, query reformulation, assessing informational sufficiency, resolving contradictory sources, and synthesizing facts into a cohesive conclusion. Training a model on schema extraction and sequential calling does not instantiate this autonomous investigative loop.

### Branch Ablation: Evidence of Complementarity

Table 6 evaluates individual corpus components against the matched-budget Dolmino-20BT baseline (using Qwen3-4B-Base + SFT):

| Configuration | BFCL non-live | BFCL live | BFCL multi-turn | BFCL overall | $\tau^2$ Pass@1 | $\tau^2$ Pass@4 | MCP score | MCP pass |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| No Mid-training | 59.94% | 43.75% | 15.50% | 39.73% | 8.54% | 20.50% | 13.20 | 1.68% |
| Dolmino-20BT | 61.44% | 51.74% | 16.13% | 43.10% | 7.37% | 21.22% | 5.41 | 0.00% |
| Processed Raw Only | 60.40% | 52.60% | 13.90% | 42.30% | 7.30% | 21.90% | 12.20 | 3.03% |
| + Native Trajectories | 68.21% | 55.81% | 18.75% | 47.59% | 4.23% | 12.95% | 6.80 | 1.12% |
| + Context Trajectories | 62.73% | 50.26% | 21.00% | 44.66% | 8.99% | 21.94% | 8.46 | 1.12% |
| **Full MidTool-Mix** | **66.38%** | **57.74%** | **26.63%** | **50.25%** | **12.23%** | **28.06%** | **18.66** | **5.03%** |

The ablation reveals an instructive tension: adding only Native Trajectories drives BFCL non-live to 68.21% (surpassing the full mixture's 66.38%), but causes performance on multi-turn $\tau^2$-Bench Pass@4 (12.95%) and MCP-Universe (1.12%) to drop substantially.

This demonstrates that optimizing solely for executable traces risks overfitting to surface-level parameter filling at the cost of broader contextual resilience. Only the combined mixture maintains both syntax precision and contextual generalization.

### Additional Verifications and Empirical Disconnects

- **DeCon Contamination Check:** The authors conducted n-gram overlap audits, identifying fewer than 20 candidate matches that manual review confirmed were standard API documentation headers rather than benchmark test leaks. However, this verifies lexical absence rather than eliminating latent semantic overlap.
- **VisualToolBench Pilot:** Appendix C.3 presents a small-scale visual tool pilot. While tool execution success rose from 0.5863 to 0.7231, the overall evaluation rubric improved only marginally from 0.0567 to 0.0661. This discrepancy highlights a critical evaluation principle: **successful tool execution does not ensure a grounded final answer**.

## Evidence map

To maintain clear boundaries between empirical findings and downstream engineering synthesis, this section categorizes the paper's claims across four distinct layers:

| Layer | Scope and Core Claims | Supporting Anchors and Boundaries |
| --- | --- | --- |
| **Direct paper evidence** | 4B/8B models show gains on BFCL, $\tau^2$-Bench, and MCP-Universe under fixed recipes; ablations verify branch complementarity. | Tables 3–6, Figures 4–5, Appendices A–D. |
| **Author causal claims** | Tool knowledge constitutes a foundational prior best instilled during mid-training; dual branches separately address grounding and execution. | Paper Sections 1–2 motivation and framing. |
| **Unsupported claims** | Generalization across non-Qwen architectures, autonomous emergence of deep search, and production ROI compared to runtime fixes. | MCP web search at 0.00%, lack of cross-seed distributions. |
| **Bloss0m engineering synthesis** | Mandatory decoupling of execution success from final-answer grounding; adoption via an incremental four-stage evaluation ladder. | Independent systems and data engineering framework. |

### Direct paper evidence

1. **Benchmark Improvements:** Under Qwen3-4B-Base + SFT, MidTool-Mix achieves 50.25% on BFCLv3 overall (vs. 39.73%), 28.06% on $\tau^2$-Bench Pass@4 (vs. 20.50%), and 5.03% on MCP-Universe pass (vs. 1.68%) (Tables 3–5).
2. **Multi-Turn Robustness:** BFCL multi-turn accuracy increases from 15.50% to 26.63%, driven primarily by missing-argument and extended-dialogue slices (Table 3).
3. **Optimization Efficiency:** Models initialized with MidTool-Mix begin downstream SFT with lower loss (Figure 4) and exhibit accelerated reward acquisition during early RL steps (Figure 5).
4. **Branch Ablation:** Table 6 establishes that using processed raw data alone (BFCL 42.30%), native trajectories alone (BFCL 47.59%, $\tau^2$ Pass@4 12.95%), or context trajectories alone (BFCL 44.66%, $\tau^2$ Pass@4 21.94%) underperforms the full mixture (50.25% and 28.06%).
5. **Visual Disconnect:** Appendix C.3 demonstrates a 13.68 pp gain in tool call success alongside a modest 0.94 pp improvement in the overall rubric score.

### Author causal claims

1. **Prior Placement:** The authors argue that schema grounding and workflow planning represent fundamental world knowledge that belongs in mid-training rather than being treated merely as conversational style alignment during post-training.
2. **Functional Division:** Context-grounded augmentation is claimed to teach models to discern tool boundaries in unstructured texts, while native trajectory synthesis establishes interface calling precision.
3. **Search Failure Diagnosis:** The authors attribute the 0.00% web-search performance to the structural gap between general tool invocation and iterative, exploratory deep-search control loops.

### Unsupported claims

1. **Cross-Architecture Generalization:** Experiments are restricted to Qwen3-4B and 8B. Generalization to Llama, Mistral, or MoE architectures remains unverified, and optimal mixture ratios under equalized compute budgets have not been determined.
2. **Emergence of Search Capabilities:** MidTool does not demonstrate the spontaneous emergence of deep-search agency (web search remains at 0.00%).
3. **Statistical Confidence Intervals:** The reported results rely primarily on single point estimates without cross-seed variance or bootstrap confidence intervals.
4. **Production Economic Return:** The study does not establish whether allocating 32 H200 GPUs to mid-training yields higher production ROI than investing in runtime retry policies, dynamic schema pruning, or refined prompt engineering.

### Bloss0m engineering synthesis

1. **Dual Metric Decoupling:** Production monitoring must decouple syntactic tool call success from final-answer grounding faithfulness, preventing false confidence derived from error-free API responses.
2. **Data Asset Partitioning:** Industrial pipelines should maintain clear separation among raw technical corpora, context-grounded augmentations, and native executable traces, enforcing static schema verification on all synthetic inputs.

## Artifacts and reproducibility

The availability of project artifacts as of 2026-08-24 is summarized below:

- **Paper and Preprints:** The [arXiv abstract](https://arxiv.org/abs/2608.20314), [arXiv full HTML](https://arxiv.org/html/2608.20314v1), and [PDF v1](https://arxiv.org/pdf/2608.20314v1) are accessible. The arXiv HTML version indicates CC BY 4.0 licensing.
- **Dataset:** The Hugging Face repository exposes [MidTool/MidTool-Mix](https://huggingface.co/datasets/MidTool/MidTool-Mix) (approx. 42.7 GB), containing Web, PDF, Code, and Native-agent-traj subsets. Access requires agreeing to the MidTool-Mix License and upstream terms.
- **Model Checkpoints:** [Arctic-MidTool-MT-4B](https://huggingface.co/MidTool/Arctic-MidTool-MT-4B), [Arctic-MidTool-MT-8B](https://huggingface.co/MidTool/Arctic-MidTool-MT-8B), and corresponding RL checkpoints are published. The model cards specify that these checkpoints serve as base models for subsequent SFT/RL rather than ready-to-deploy assistants, governed by Apache-2.0 and dataset terms.
- **Pipeline Components:** FastText classification models for web and PDF filtering are public but subject to gated access.
- **Reproduction Boundaries:** This review reports experimental results published by the authors; full benchmark suites were not rerun locally. Independent end-to-end reproduction requires access to gated assets, a distributed cluster of 32 H200 GPUs running ArcticTraining, AWM simulation environments, and benchmark harnesses.

## Bloss0m engineering judgment and when not to use it

### A Phased Implementation Roadmap for Engineering Teams

Teams evaluating whether to adopt MidTool's techniques should consider an incremental four-stage validation ladder rather than immediately committing extensive compute to 20.3B tokens:

1. **Establish a Tool-Use Data Contract:** Tag every training trace with API version, required parameters, environment responses, security permissions, and metadata indicating whether it is human-authored or synthetic.
2. **Enforce Clean Asset Separation:** Maintain strict boundaries between raw reference documentation, context-grounded synthetic dialogues, and executable interaction traces, preventing unverified samples from polluting the mixture.
3. **Conduct Controlled Ablation on Fixed SFT Baselines:** Before scaling compute, construct a compact million-token test set and compare five controlled conditions (no-mid, raw-only, context-only, native-only, full-mix) to evaluate whether domain-specific tool understanding improves.
4. **Decouple Grounding from Call Success:** Measure whether the agent's final output accurately reflects tool responses, and track multi-turn exploratory workflows as separate evaluation slices.

### When Not to Invest in Mid-training

Mid-training is often counterproductive under the following conditions:

- **Runtime and Plumbing Bottlenecks:** When production errors stem from incorrect permissions, brittle timeout configurations, unmanaged context expansion, or poor telemetry, addressing runtime infrastructure yields substantially faster returns.
- **Low-Quality Post-Training Data:** If the downstream SFT dataset contains inconsistent schemas or contradictory demonstration labels, improving data quality is more impactful than pre-training intervention.
- **Deep-Search Dependencies:** Given the 0.00% result on web search, teams requiring autonomous investigative agents should design targeted retrieval-reasoning architectures rather than expecting general tool mid-training to resolve exploratory tasks.

## Three things to remember

1. **Prior Placement Matters:** MidTool demonstrates that tool affordance understanding and execution planning can be established during mid-training, framing tool use as a foundational cognitive capability rather than superficial post-training formatting.
2. **Complementary Data Branches Are Critical:** Context-grounded augmentation provides textual understanding, while native trajectory synthesis ensures execution precision; neither branch alone matches the performance of the integrated mixture.
3. **Recognize Structural Limits:** Successful tool calling does not guarantee grounded final answers, and general tool-use priors fail to support deep exploratory search (0.00% on web search).

### The one-line takeaway

**Tool use is an intrinsic cognitive prior best introduced during mid-training rather than a cosmetic formatting layer added during post-training; however, mastering API calls does not equate to autonomous deep-search intelligence.**

For complementary perspectives, see [Gorilla](/en/paper-reading/35-gorilla-llm-connected-with-massive-apis/) on catalog-scale retrieval and calling, alongside Bloss0m's [RAG-MCP: reducing prompt bloat in tool selection](/en/paper-reading/04-rag-mcp/) and the [MCP roadmap](/en/blog/mcp-roadmap/) for runtime context governance.

## Primary sources

- [Jiang et al., “MidTool: Mid-training Data Synthesis for Agentic Tool Use,” arXiv:2608.20314 v1](https://arxiv.org/abs/2608.20314)
- [MidTool full paper in arXiv HTML](https://arxiv.org/html/2608.20314v1)
- [MidTool-Mix dataset card and license on Hugging Face](https://huggingface.co/datasets/MidTool/MidTool-Mix)
- [Arctic-MidTool-MT-8B model card on Hugging Face](https://huggingface.co/MidTool/Arctic-MidTool-MT-8B)
