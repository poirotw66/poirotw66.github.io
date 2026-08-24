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

- **Problem:** Tool use is not only about filling a function name and JSON arguments. An agent must recognize tool affordances from documentation, schemas, code, and incomplete dialogue; decide when to call; compose multiple tools; and ask for missing information or recover. MidTool asks whether these capabilities can be established earlier, through dedicated mid-training, rather than being left almost entirely to post-training.
- **Data design:** The authors introduce a MidTool pipeline that collects web, PDF, code, and structured tool artifacts, producing MidTool-Mix: 20.3B tokens and 11.22M samples. Context-grounded trajectory augmentation targets grounding, while native agentic trajectory synthesis targets execution.
- **Main result:** With Qwen3-4B-Base and a fixed 100K TOUCAN SFT recipe, MidTool-Mix raises BFCLv3 overall to 50.25% from 39.73% without mid-training, `\\tau^{2}`-Bench Pass@4 to 28.06% from 20.50%, and MCP-Universe pass to 5.03% from 1.68%. Qwen3-8B shows the same direction.
- **Critical boundary:** The MCP-Universe web-search subset remains at 0.00%. Browser automation, finance, and location improve, but that does not mean the model has acquired deep-search behavior involving evidence gathering, iterative refinement, and long-horizon control.

My bounded verdict is: **MidTool's strongest contribution is not another agent benchmark score. It frames transferable tool-use priors as two data problems—grounding and execution—and shows through ablations that they are complementary. It does not show that general tool-use mid-training naturally becomes a search agent.**

> **Huahua's engineering note**
>
> If your agent calls a tool successfully but often misstates the result in its final answer, more function-calling examples may not be enough. MidTool suggests a useful hypothesis: teach the model to read tools and workflows during mid-training, then use post-training to align product behavior. Still evaluate call success and evidence-grounded final answers separately.

![MidTool Figure 1: an overview of the data sources, training pipeline, and MCP-Universe result.](/paperReading/23-midtool-agentic-tool-use/paper/figure-1-teaser.webp)

*Figure 1, the paper teaser: web, PDF, tool, code, and agentic trajectories on the left; base model → mid-training → tool-use SFT → agentic RL in the middle; and the paper's MCP-Universe transfer illustration on the right. This is an author overview, not an independent benchmark; locate the original at [Figure 1](https://arxiv.org/html/2608.20314v1#S0.F1). Image from the arXiv HTML page, marked CC BY 4.0.*

## Version and reading scope

This article reads [arXiv:2608.20314 v1](https://arxiv.org/abs/2608.20314), submitted on 2026-08-20, and does not treat it as a peer-reviewed conference paper. In addition to the abstract and PDF, I checked the [full arXiv HTML version](https://arxiv.org/html/2608.20314v1) section by section, including the data pipeline, Tables 2–6, Appendices A–D, the visual tool-use pilot, and the limitations.

As of 2026-08-24, the Data & Model link in the paper's abstract resolves to the [MidTool Hugging Face organization](https://huggingface.co/MidTool), which lists the [MidTool-Mix dataset](https://huggingface.co/datasets/MidTool/MidTool-Mix), 4B/8B mid-training checkpoints, and RL checkpoints. These resources are not synonymous with unconditional reproduction: the dataset requires accepting the MidTool-Mix License, and the model pages require accepting Apache-2.0 plus dataset terms. I therefore classify them as visible, requestable artifacts rather than claiming that I downloaded them and ran the full reproduction.

## The question a reader should actually answer

This paper is not merely asking whether adding more tool-call trajectories to training helps. If the only change were a larger post-training dataset, data volume, teacher model, and evaluation harness would be entangled.

The sharper question is: **with the downstream SFT/RL recipe held fixed, does moving general tool-use data into mid-training give small models a more transferable capability for unfamiliar tools, long-horizon interaction, and schema grounding?**

Here, mid-training is a stage between general pre-training and post-training. MidTool does not remove SFT, and it does not argue that RL is unnecessary. Its causal claim is narrower: change the base model with a dedicated tool-use mixture, then apply the same SFT/RL recipe and see whether the result improves over omitting that stage.

## Evidence map: reported evidence vs. interpretation

| Layer | Wording used in this article |
| --- | --- |
| **Paper directly supports** | Under the fixed downstream recipe, the 4B/8B experiments improve selected aggregate metrics on BFCLv3, `\\tau^{2}`-Bench, and MCP-Universe; Tables 2–6 and Appendices A–D provide the mixture, ablations, contamination audit, and visual pilot. |
| **The authors do not yet prove** | Whether general tool-use mid-training generalizes reliably across models, budgets, and benchmarks, or whether it naturally produces a deep-search agent. |
| **Our engineering judgment** | Keeping raw, context-grounded, and native-executable data separate—and evaluating final-answer grounding separately from tool-call success—is more useful for product decisions than tracking one MCP overall score. |

The rest of the article separates reported numbers, author claims, and Bloss0m's engineering judgment. “Improvement” refers only to the paper's setup; it is not a claim of production superiority.

## Core intuition

Think of MidTool as making the model read tool documentation, code, and executable interactions before it learns how to answer product requests. The model first builds an affordance map for tools, then uses post-training to learn the product's preferred tone, permissions, and task policy. If call format is taught only at the end, a model may fill valid JSON while still failing to know when to call, what to ask for when information is missing, or how a previous tool response should change the next step.

This is why the paper separates context-grounded and native-executable branches: the first supplies a prior for understanding tools in context, while the second supplies a prior for executing workflows through an interface.

## End-to-end worked example

Suppose an API document says: first call `search_orders` to obtain an order ID, then call `refund_order`; if the date is missing, ask the user to clarify it. In MidTool's pipeline, the document is first retained by the quality filters. Qwen3-235B-A22B-Instruct-2507 extracts tool boundaries, required arguments, and workflow affordances; the rule-based planner then allocates a single-step QA plus a trajectory that asks for the missing date and calls the two tools in order. If the sample enters the native branch, the generated trajectory must also pass checks for turn ordering, required arguments, and tool-response consistency.

This is not a private instance from the paper; it is a walkthrough of the mechanism in Sections 2.2–2.3. The model sees this grounding/execution pattern during mid-training, then learns to complete benchmark or product tasks through TOUCAN SFT and optional RL. Evaluation therefore checks more than valid JSON: it also probes multi-turn interaction and transfer to unfamiliar MCP servers.

## Why post-training may not be enough

The paper divides general tool use into two layers:

1. **Grounding:** infer tool boundaries, required fields, argument formats, and workflow structure from documentation, PDFs, code, and schemas.
2. **Execution:** plan and order calls across turns, ask for missing information, switch tools, and revise the next step from tool responses.

Previous approaches are insufficient when post-training asks a narrow demonstration set to teach all of these capabilities at once; MidTool's proposal is to shape a broader prior earlier in the lifecycle.

If a model sees only narrow demonstration traces during post-training, it may learn output that looks like a tool call without absorbing the background knowledge distributed across developer documentation, API references, manuals, code repositories, and structured tool definitions. MidTool's strategy is to build a broader agentic prior from these materials first, leaving product-specific behavior to downstream training.

This is a plausible but falsifiable hypothesis. The most important experiment is not one headline number; it is the no-mid-training control under the same SFT recipe, plus an ablation that separates raw data, the context branch, and the native branch.

## The MidTool pipeline: four sources, two synthesis branches

### Stage 1: collect complementary raw sources

MidTool does not collect only tool schemas. It deliberately puts four types of signal in one mixture:

- **Web:** processed Common Crawl dumps from FineWeb, spanning 2020–2025 API references, developer documentation, troubleshooting pages, tutorials, and CLI-style instructions.
- **PDF:** the English subset of FinePDFs, adding manuals, product handbooks, and longer procedural documentation.
- **Code:** agent/MCP repositories discovered from GitHub event data, plus high-quality public repositories with community signals. The pipeline retains libraries, SDKs, frameworks, examples, and documentation-like paths, while excluding benchmark/dataset repositories to reduce leakage risk.
- **Structured tool artifacts:** REST APIs and MCP skills, which expose executable schemas, parameter structures, and tool boundaries for native trajectory synthesis.

The sources provide different signals: web/PDF provide breadth and procedural context, code provides executable interface patterns, and tool artifacts provide the closest substrate to an actual call. They are not four mirrors of the same data.

### Stage 2: source-specific filtering and deduplication

The code pipeline excludes low-signal files such as binaries, model weights, and logs; applies line-count, average/max line-length, and alpha-ratio heuristics; and removes exact/near duplicates with SHA-256 and MinHash LSH. For high-quality repositories, it preferentially keeps documentation-like directories such as `docs`, `examples`, `tutorials`, `guides`, `samples`, and `cookbook`.

Web and PDF data use a four-stage process: high-recall keyword/URL prescreening, a fastText classifier trained on LLM-labeled seed data, document-level quality filtering, and MinHash LSH deduplication. This biases the mixture toward developer-facing technical material, while making it clear that quality depends on classifiers and heuristics rather than people reading every document.

### Stage 3: turn material into supervision

MidTool uses two complementary synthesis branches.

**Context-grounded trajectory augmentation** starts from web/PDF/code documents. Qwen3-235B-A22B-Instruct-2507 scores document quality and builds an affordance profile; a rule-based planner then allocates a bounded budget by document quality and produces QA/trajectories for tool selection, schema-grounded parameter extraction, format-constrained calls, workflow recognition, parallel use, clarification, and long-context reasoning. Only samples that pass parsing and semantic quality control enter the mixture.

**Native agentic trajectory synthesis** starts from executable REST API and MCP interfaces. It builds a tool inventory, parses definitions, and normalizes canonical schemas, then uses quality and feasibility profiles to allocate single-call, multiple/parallel-tool, and information-missing trajectories. Generated data is strictly checked for turn ordering, schema grounding, required arguments, and tool-response consistency; failed generations are retried with quality-control feedback and discarded if they remain invalid. This branch also mixes AWM rollouts and filtered Nemotron Agentic traces.

The distinction is useful to remember: **the context branch teaches the model to find tools in messy material; the native branch teaches it to use tools through executable interfaces.**

![MidTool Figure 2: the pipeline from four data families through preprocessing to two agentic trajectory synthesis branches.](/paperReading/23-midtool-agentic-tool-use/paper/figure-2-pipeline.webp)

*Figure 2, the complete pipeline in paper Section 2. Stage 3 does not turn every document directly into a successful demonstration: the context-grounded branch builds profiles and plans, while the native branch normalizes executable schemas before checking structure and response consistency. Locate the original at [Figure 2](https://arxiv.org/html/2608.20314v1#S2.F2). Image from the arXiv HTML page, marked CC BY 4.0.*

### What this pipeline actually adds

Expanded, Figure 2 shows that MidTool's novelty is not simply “use a large model to generate data.” It splits data construction into inspectable interfaces:

1. **The source layer** determines whether the model sees document context, code patterns, or directly parseable tool schemas.
2. **The quality layer** chains high-recall keyword/URL filtering, fastText, LLM annotation, deduplication, and source-specific filtering; the sources do not share one coarse filter.
3. **The planning layer** creates affordance profiles and trajectory plans before allocating samples according to document/tool quality, tool count, and argument structure, avoiding mass duplication of trivial single-call samples.
4. **The validation layer** checks turn order, required arguments, schema grounding, and tool-response consistency before samples enter the training mixture; invalid generations are retried and then discarded.

These layers make the pipeline more auditable than “prompt a teacher and save every output.” They also mean that reproduction needs filtering thresholds, planner policy, teacher prompts, and validation code—not only a dataset name.

## How the 20.3B tokens are composed

The mixture statistics in paper Table 2 are below. For web/PDF/code, the slash separates source-corpus tokens from context-grounded augmentation tokens:

| Subset | Tokens | Samples | Share |
| --- | ---: | ---: | ---: |
| Web | 4.4B / 4.1B | 6.86M | 42% |
| PDF | 2.6B / 2.1B | 1.34M | 23% |
| Code | 3.8B / 1.5B | 2.60M | 26% |
| Native agentic trajectory | 1.8B | 0.42M | 9% |
| **Total** | **20.3B** | **11.22M** | **100%** |

One easy-to-miss point is that native trajectories are only 9% of the mixture, but that does not make them unimportant. MidTool's design is that broad raw/context data supplies grounding, while a smaller amount of executable, validated native trajectories supplies execution; the branch ablation tests that division of labor.

The appendix's inventory analysis reports about 2.60M unique tool names and a 37.2% domain long tail under the paper's keyword categorization. This shows an attempt to expand the tool surface; it does not mean that every tool name maps to a downloadable, permanently callable production endpoint.

![MidTool Figure 3: the t-SNE distribution of MidTool-Mix, FineWeb, and Dolmino.](/paperReading/23-midtool-agentic-tool-use/paper/figure-3-tsne.webp)

*Figure 3, the t-SNE visualization in paper Appendix A.4: MidTool-Mix partly overlaps with FineWeb and Dolmino while also forming distinct regions. This is a qualitative embedding-space view, not causal evidence of capability improvement; locate the original at [Figure 3](https://arxiv.org/html/2608.20314v1#S2.F3). Image from the arXiv HTML page, marked CC BY 4.0.*

The correct reading of Figure 3 is not “the more separated the points, the stronger the model.” The authors sample 2K examples per dataset, embed them with Arctic-Embed-2.0-L, and place MidTool-Mix alongside FineWeb and Dolmino in the same t-SNE space. MidTool-Mix retains overlap with broad web data while occupying regions associated with documentation-heavy, workflow-oriented, and agentic tool-use content. This supports the distributional claim that it is not merely generic pre-training data under a new name, but it does not independently prove downstream transfer.

## How the experiments isolate mid-training

The authors use Qwen3-4B-Base and Qwen3-8B-Base, mid-train them on MidTool-Mix, and then apply the same downstream recipe. SFT uses a 100K tool-use subset of TOUCAN; mid-training and SFT run with ArcticTraining on 32 H200 GPUs. Optional RL uses 526 synthetic tool-use environments from AWM on 8 B200 GPUs.

The evaluation covers three different pressures:

- [BFCLv3](https://arxiv.org/html/2608.20314v1#S3): single-turn, multi-turn, schema/argument grounding, and hallucination.
- `\\tau^{2}`-Bench: interactive task completion, multi-step execution, and recovery across airline, retail, and telecom verticals.
- [MCP-Universe](https://arxiv.org/html/2608.20314v1#S3): transfer to unfamiliar tools through browser automation, finance, location, and web-search MCP servers.

The strength of this setup is that downstream SFT/RL recipes are fixed. The limitation is that the mid-training intervention still bundles data, teacher models, compute, and training choices; the difference cannot be reduced to “the model saw 20.3B more tokens.”

### Training details: “mid-train” is not a complete recipe

Appendix B makes the intervention concrete: mid-training uses one epoch, a maximum sequence length of 8,192, and a 4M global-token batch; SFT uses a maximum sequence length of 32,768. RL runs for 64 steps, with 16 rollouts per step and at most 20 turns. These details matter because context length, trajectory horizon, and rollout count change both tool-use difficulty and cost; a reproduction that changes them cannot be compared directly with Tables 3–6.

The authors also disable thinking to align the setting and apply the same downstream post-training recipe to the raw base and MidTool-Mix mid-trained base. This makes the comparison cleaner, but it does not answer whether longer mid-training is simply buying score with more compute or whether another model family needs a different mixture ratio.

## Results: the improvement is real, but capability matters

Start with the easiest comparison: Qwen3-4B-Base + SFT. The numbers below come from Tables 3–5 and compare the same base model with and without prior MidTool-Mix mid-training.

| Evaluation | No mid-training | + MidTool-Mix | Difference |
| --- | ---: | ---: | ---: |
| BFCLv3 overall | 39.73% | 50.25% | +10.52 pp |
| `\\tau^{2}`-Bench overall Pass@4 | 20.50% | 28.06% | +7.56 pp |
| MCP-Universe overall pass | 1.68% | 5.03% | +3.35 pp |

The BFCL gain is not only single-turn. The multi-turn average rises from 15.50% to 26.63%, suggesting that mid-training may supply capabilities that narrow SFT does not reliably induce for missing functions, missing parameters, and long-context cases. With RL added, 4B BFCL overall reaches 54.18%, but that is a “mid-training + RL” result; it should not be presented as an effect caused by mid-training alone.

The 8B model moves in the same direction: BFCL overall is 47.62% with SFT-only and 51.12% after MidTool-Mix + SFT; adding RL reaches 55.12%. This makes “not a 4B accident” a reasonable reading, while remaining within two base-model scales and a fixed recipe.

| Base model | Downstream recipe | BFCLv3 overall | `\\tau^{2}`-Bench Pass@4 | MCP-Universe pass |
| --- | --- | ---: | ---: | ---: |
| Qwen3-4B-Base | SFT | 39.73% | 20.50% | 1.68% |
| Qwen3-4B-Base + MidTool-Mix | SFT | **50.25%** | **28.06%** | **5.03%** |
| Qwen3-4B-Base | SFT + RL | 39.51% | 25.54% | 2.23% |
| Qwen3-4B-Base + MidTool-Mix | SFT + RL | **54.18%** | **38.49%** | **10.06%** |
| Qwen3-8B-Base | SFT | 47.62% | 28.06% | 3.35% |
| Qwen3-8B-Base + MidTool-Mix | SFT | **51.12%** | **34.89%** | **3.91%** |
| Qwen3-8B-Base | SFT + RL | 45.79% | 38.13% | 5.03% |
| Qwen3-8B-Base + MidTool-Mix | SFT + RL | **55.12%** | **39.57%** | **9.50%** |

This summary table puts two easy-to-confuse patterns together. MidTool-Mix gives a clear 4B gain on all three headline metrics, while the 8B MCP SFT gain is small (3.35% → 3.91%) and the larger gap appears after RL. “The 8B setting also benefits” is supported; “every benchmark and recipe benefits proportionally” is not.

![MidTool Figure 4: SFT loss convergence on the same downstream tool-use corpus.](/paperReading/23-midtool-agentic-tool-use/paper/figure-4-sft-loss.webp)

*Figure 4, paper Appendix C.1: Qwen3-4B-Base + MidTool-Mix starts with lower SFT loss, converges faster early, and maintains lower loss through most training steps; this is an optimization-efficiency signal, not a direct agent-success metric. Locate the original at [Figure 4](https://arxiv.org/html/2608.20314v1#A3.F4). Image from the arXiv HTML page, marked CC BY 4.0.*

![MidTool Figure 5: average RL reward for the 4B model.](/paperReading/23-midtool-agentic-tool-use/paper/figure-5-rl-reward-4b.webp)

![MidTool Figure 5: average RL reward for the 8B model.](/paperReading/23-midtool-agentic-tool-use/paper/figure-5-rl-reward-8b.webp)

*Figure 5, paper Appendix C.2: MidTool-Mix initialization starts with higher RL reward and rises faster early, while the non-mid-trained baseline gradually catches up later in the same environment. This is closer to “adapts faster” than “stays higher forever”; locate the original at [Figure 5](https://arxiv.org/html/2608.20314v1#A3.F5). Image from the arXiv HTML page, marked CC BY 4.0.*

MCP-Universe is especially informative. At 4B, overall score/pass rises from 13.20/1.68% to 18.66/5.03%; browser automation, finance, and location generally improve. This supports the idea that the model acquired some transferable schema/workflow prior for unfamiliar MCP tools.

But the same Table 5 says: **the web-search score and pass remain 0.00%.** This failure is one of the paper's most important results because it separates “general tool use” from “deep-search-style agency.” Search tasks require sustained evidence gathering, query iteration, sufficiency judgments, contradiction handling, and evidence-grounded synthesis. Teaching tool boundaries and general workflows does not automatically produce that control loop.

## Ablation: the two branches are not decorative substitutes

Table 6 fixes Qwen3-4B-Base + SFT, changes only the mid-training corpus, and compares against the matched-budget Dolmino-20BT baseline:

- **Processed raw data only:** BFCL overall is 42.30%, +2.6 points over no mid-training; MCP pass is 3.03%, +1.4 points. Documentation, code, and filtered raw sources are not zero-contribution.
- **Native agentic trajectories only:** BFCL overall is 47.59%, a stronger function-calling signal, but `\\tau^{2}`-Bench Pass@4 is 12.95% and MCP pass is 1.12%; it cannot replace the full mixture.
- **Context-grounded trajectories only:** BFCL overall is 44.66% and `\\tau^{2}`-Bench Pass@4 is 21.94%. It is steadier on transfer-oriented evaluation than native-only, but MCP pass is still only 1.12%.
- **Full MidTool-Mix:** BFCL overall is 50.25%, `\\tau^{2}`-Bench Pass@4 is 28.06%, and MCP pass is 5.03%. It is the only Table 6 configuration that improves over no mid-training on all eight main metrics.

| Mid-training data | BFCL non-live | BFCL live | BFCL multi-turn | BFCL overall | `\\tau^{2}` Pass@1 | `\\tau^{2}` Pass@4 | MCP score | MCP pass |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| No mid-training | 59.94% | 43.75% | 15.50% | 39.73% | 8.54% | 20.50% | 13.20 | 1.68% |
| Dolmino-20BT | 61.44% | 51.74% | 16.13% | 43.10% | 7.37% | 21.22% | 5.41 | 0.00% |
| Processed raw data only | 60.40% | 52.60% | 13.90% | 42.30% | 7.30% | 21.90% | 12.20 | 3.03% |
| + native trajectories | 68.21% | 55.81% | 18.75% | 47.59% | 4.23% | 12.95% | 6.80 | 1.12% |
| + context-grounded trajectories | 62.73% | 50.26% | 21.00% | 44.66% | 8.99% | 21.94% | 8.46 | 1.12% |
| **Full MidTool-Mix** | **66.38%** | **57.74%** | **26.63%** | **50.25%** | **12.23%** | **28.06%** | **18.66** | **5.03%** |

Table 6 also contains a counterintuitive detail: native-only reaches 68.21% on BFCL non-live, even above the full mixture's 66.38%, but is worse on `\\tau^{2}`-Bench Pass@4 and MCP-Universe. “Better at filling a function call” and “better at completing multi-turn tasks in an unfamiliar environment” are different objectives; the full mixture's value is cross-metric complementarity, not winning every individual cell.

This is a useful engineering checklist for data design: executable trajectories look more important for precise calling, while context-grounded supervision looks more important for reading documentation and transferring to unfamiliar environments. The stable recipe combines both rather than treating one synthetic trajectory type as a universal solution.

The authors also run a DeCon contamination audit. Fewer than 20 candidate n-gram overlaps were flagged; manual inspection classified them as false positives from generic API documentation, with no benchmark instance or reference-answer leakage found. This constrains surface n-gram overlap only; semantic or schema-level similarity is not ruled out.

## VisualToolBench: a small but important warning

Appendix C.3 reports a visual tool-use pilot. In that small transfer study, tool success rises from 0.5863 to 0.7231, while the overall rubric rises from 0.0567 to 0.0661. This is interesting but should not be read as a robust multimodal conclusion: the authors present it as a pilot, and the rubric increase is much smaller than the tool-success increase.

It exposes a common gap in agent evaluation: **a successful tool call does not mean that the final answer used the tool result correctly.** An evaluator that records only tool-call success may miss a model that retrieves the right image, data, or API response but drops the key evidence, misreads it, or claims something the tool did not support.

## Limitations: what the paper does not answer

### 1. 20.3B is not a cheap baseline

Mid-training/SFT on 32 H200s, RL on 8 B200s, multiple teacher models, and synthetic environments are far from the budget of a typical product team. The paper notes that it could not fully sweep mixture design under matched budgets, nor co-design every mid-training/post-training combination.

### 2. Most training data is not human-verified

The Hugging Face dataset card explicitly says that source documents were not manually reviewed, trajectories passed automatic validation but were not human-verified, and a large portion of the corpus is model-generated. This does not make the data unusable, but it puts licenses, upstream content, stale APIs, documentation errors, and synthetic-teacher bias inside the reproduction risk.

### 3. Public artifacts do not mean frictionless reproduction

The MidTool-Mix dataset is listed at 42.7 GB, and access is subject to the MidTool-Mix License and upstream terms. The 4B/8B checkpoints require accepting Apache-2.0 and the dataset terms. The model cards provide loading paths, which is much better than having only paper numbers, but end-to-end reproduction still requires access, license review, large downloads, and reconstruction of the authors' ArcticTraining, AWM, benchmark harness, and fixed post-training recipes.

### 4. Web-search at 0% is not a minor footnote

The authors interpret it as evidence that a general tool-use prior is insufficient for deep-search-style exploratory behavior. The explanation matches the slice results, but it remains evidence from one paper and one MCP-Universe split. It prevents us from turning improved MCP pass rates into “agent research solved.”

### 5. The metrics are point estimates, not a complete uncertainty analysis

The paper mainly reports single benchmark numbers, without a full confidence-interval or cross-seed distribution for each slice. When MCP-Universe pass rates remain low, a few percentage points deserve confirmation through more seeds, task-level bootstrap, and action-trace audits.

## Engineering implications and when not to use

To carry MidTool's idea into a model/agent pipeline, I would start with a small, traceable four-part experiment rather than copy 20.3B tokens:

1. **Create a tool-use data contract:** tag source, schema version, required arguments, tool response, permission risk, and whether the sample is human- or model-generated.
2. **Separate raw, grounded, and executable data:** do not collapse documentation QA, synthetic call traces, and real rollouts into one uninterpretable blob.
3. **Hold the post-training recipe constant:** at minimum compare no-mid, raw-only, context-only, native-only, and full-mixture conditions, or you will not know whether gains came from the data, teacher, or downstream recipe.
4. **Evaluate final-answer grounding:** in addition to tool-call validity, schema accuracy, and Pass@k, check whether the final answer is supported by the actual tool response and report web-search/long-horizon slices separately.

When should you not start with mid-training? If the bottleneck is tool permissions, retry policy, context windows, error observability, or post-training label quality, fixing runtime and data plumbing is often a better first move. MidTool supports the hypothesis that earlier shaping of a general tool-use prior is valuable; it does not say that every agent failure should be sent back to pre-training.

## Reproducibility and artifact status (as of 2026-08-24)

- **Paper:** [arXiv abstract](https://arxiv.org/abs/2608.20314), [full HTML](https://arxiv.org/html/2608.20314v1), and [PDF v1](https://arxiv.org/pdf/2608.20314v1). The arXiv HTML page marks the paper CC BY 4.0.
- **Dataset:** [MidTool/MidTool-Mix](https://huggingface.co/datasets/MidTool/MidTool-Mix) is visible and requestable, with web, PDF, code, and native-agent-traj subsets plus field documentation; this article does not download the dataset into the repository.
- **Models:** [Arctic-MidTool-MT-4B](https://huggingface.co/MidTool/Arctic-MidTool-MT-4B), [Arctic-MidTool-MT-8B](https://huggingface.co/MidTool/Arctic-MidTool-MT-8B), and corresponding RL checkpoints are visible; the model card describes a mid-training checkpoint as a base for further SFT/RL, not a ready-to-use assistant.
- **Quality classifiers:** web/PDF fastText classifiers are also listed, but their pages show gated access; they are pipeline artifacts rather than complete end-to-end reproduction.
- **Not verified here:** I do not claim to have downloaded the dataset, loaded a checkpoint, rerun BFCL/`\\tau^{2}`-Bench/MCP-Universe, or resolved the license of every upstream data source.

## Three things to remember

1. **The location of the prior matters:** MidTool moves tool knowledge, grounding, and execution into mid-training while preserving a role for SFT/RL.
2. **The data branches complement each other:** raw/context-grounded data supports understanding and transfer, while native executable trajectories support precise calls; the full mixture is the most stable main configuration.
3. **The boundary is part of the result:** MCP-Universe web search remains at 0.00%, and tool-call success is not the same as final-answer grounding.

## The one-line takeaway

MidTool's message is: **tool use is not just a post-training format-alignment problem; it needs knowledge, grounding, and execution priors shaped earlier in the model lifecycle. But “can use tools” and “can do deep search” remain different capabilities.**

For follow-up reading, see Bloss0m's [RAG-MCP: reducing prompt bloat in tool selection](/en/paper-reading/04-rag-mcp/) and the [MCP roadmap](/en/blog/mcp-roadmap/). Together they add runtime context on tool selection and the protocol ecosystem that MidTool does not fully cover.

## Primary sources

- [Jiang et al., “MidTool: Mid-training Data Synthesis for Agentic Tool Use,” arXiv:2608.20314 v1](https://arxiv.org/abs/2608.20314)
- [MidTool full paper in arXiv HTML](https://arxiv.org/html/2608.20314v1)
- [MidTool-Mix dataset card and license](https://huggingface.co/datasets/MidTool/MidTool-Mix)
- [Arctic-MidTool-MT-8B model card](https://huggingface.co/MidTool/Arctic-MidTool-MT-8B)
