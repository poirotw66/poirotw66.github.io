---
title: "ACE: Let a Canvas Agent Understand Structure Before It Corrects Itself"
description: "A deep reading of ACE (arXiv:2608.24103 v1): hierarchical scene graphs, CARE routing, and an instruction-following judge turn multi-slide editing into a scoped, diffable, rollback-aware loop, with explicit limits around benchmarks, human raters, mock mode, and live reproduction."
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "ACE replaces flat absolute-positioned documents with a hierarchical scene graph and exposes 98 specialized presentation-editing tools. CARE routes Micro-Spatial, Macro-Programmatic, and Systemic-Token context, with reported average input-token reductions of about 86.6%–95.7%."
  - "It compares original→prediction with JsonDiff and uses an instruction-following judge for up to three correction rounds without a ground-truth deck. On the 53-task Claude + self-correction subset, IF rises from 4.04 to 4.45; strict-peak rollback retains the best observed iteration."
  - "On the full 94-task automatically evaluable benchmark, ACE reports IF 4.23 versus 3.81 for the HTML baseline (paired p=.010), but VQ 3.66 versus 3.57 with no significant difference. Twenty-six blind raters give ACE a 58.7% decisive overall win rate."
  - "The evidence supports a structured-canvas workflow and a diagnosable closed loop on this benchmark. It does not establish universal creative-editing improvement or that a judge replaces human review; the public mock runs, while a full live reproduction still needs user-owned Figma decks, services, and API credentials."
audience:
  - "AI engineers building presentation, whiteboard, or graphic-canvas agents that need replayable and correctable multi-step tool use"
  - "Evaluation, platform, and product teams that need to separate instruction following, visual quality, human preference, and agent cost"
tags: ["Paper Reading", "Agent Systems", "Agent Evaluation", "Tool Use", "Multimodal", "Benchmark"]
image: "/paperReading/58-ace-self-correcting-canvas/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
  - tool-use-coding-agents
paper:
  title: "ACE: A Self-Correcting Agentic Canvas Editor for Multi-Slide Presentation Automation"
  authors:
    - "JooYoung Jang"
    - "Taegyeong Lee"
    - "Jihyeon Park"
    - "Nojun Kwak"
  year: 2026
  venue: "EMNLP 2026 Industry Track (Main；acceptance stated by the paper and repository)；arXiv 2608.24103 v1（2026-08-25）"
  links:
    pdf: "https://arxiv.org/pdf/2608.24103v1"
    arxiv: "https://arxiv.org/abs/2608.24103"
    doi: "https://doi.org/10.48550/arXiv.2608.24103"
    code: "https://github.com/BloomBerry/agentic-canvas-editor"
    project: "https://huggingface.co/datasets/BloomBerry/figma-slide-benchmark"
series:
  id: "agentic-canvas-editing"
  title: "Agent Canvas Editing and Evaluation"
  part: 1
  totalParts: 1
---

This article reads [ACE: A Self-Correcting Agentic Canvas Editor for Multi-Slide Presentation Automation](https://arxiv.org/abs/2608.24103), arXiv v1. The paper was submitted on 2026-08-25; both the arXiv record and the authors’ [GitHub repository](https://github.com/BloomBerry/agentic-canvas-editor) state acceptance to the EMNLP 2026 Industry Track (Main). I keep every number tied to the v1 preprint, the public repository, and the benchmark card rather than turning that status into a claim that the system has been validated in every deployment environment.

I read the full paper HTML, PDF, and source: Sections 1–6, every table, Figures 1–7, Appendices A–Q, limitations, and ethics. I also inspected the repository orchestrator, CARE router, self-correction runner, evaluator, public execution logs, and the [Hugging Face Figma Slide Editing Benchmark](https://huggingface.co/datasets/BloomBerry/figma-slide-benchmark) card. I ran the repository’s mock path, so this reading separates direct paper and artifact evidence, author interpretation, and **Bloss0m synthesis**.

The useful question is not simply “can an LLM draw slides?” It is: **when an edit has no unique ground-truth deck, how can an agent understand structure, select the right context, know whether an edit is complete, and return to a better state when the next attempt gets worse?**

## The paper in 90 seconds

- **Problem:** PowerPoint- and HTML-like flat, absolute-positioned documents encode objects as many coordinates. Adding one element can force an agent to recompute other positions, while a valid alternative design can be penalized by reference-diff metrics.
- **Core insight:** ACE uses a hierarchical scene graph with parent–child relations, relative transforms, and auto-layout, then maps intent to structured operations through 98 specialized tools. CARE exposes only a relevant slide, node structure, or design token. After an edit, JsonDiff compares the original and current state, and a ground-truth-free instruction-following judge supplies the next critique.
- **Strongest evidence:** On the full 94-task benchmark, GPT IF is 4.23 for ACE versus 3.81 for the HTML baseline, with paired p=.010; reported speed is about 1.75x and cost about 44% lower. On that same full set, VQ is 3.66 versus 3.57 with p=.56, so the headline is not universal visual-quality improvement.
- **Main boundary:** Twenty-six blind raters give ACE versus HTML a 58.7% decisive overall win rate; self-corrected output versus single-pass is 81.5%. The panel is small, ties are common, agreement is low to moderate, and judge circularity remains. The paper does not show universal creative-editing improvement or that a judge can replace a designer.

My bounded verdict is: **ACE’s most credible contribution is moving the canvas agent’s control unit from “generate a flat document” to “perform local, diffable, rollback-aware operations on a structured scene graph.”** That workflow is worth borrowing for structured, observable, multi-slide Figma tasks. For brand art direction, open-ended composition, or another canvas platform, ACE remains a research system that needs human review and fresh calibration.

> **Huahua's engineering note**
>
> A judge saying “IF=4” does not make a canvas correct. It is a next-step signal under a particular diff, prompt, threshold, and judge family; production still needs the render, origin state, current state, tool result, and human override.

## Paper identity, reader question, and evidence map

The authors are JooYoung Jang, Taegyeong Lee, Jihyeon Park, and Nojun Kwak. This reading fixes the source version at arXiv 2608.24103 v1 (2026-08-25); the repository’s 2026-09-04 public commit updates its citation and labels the paper accepted to the EMNLP 2026 Industry Track (Main). Acceptance is paper and repository metadata; the reproducibility judgment below comes from code, data endpoints, logs, and an actual mock execution, not from the venue label.

The paper fits between several existing Bloss0m threads: [Parsing the Stream’s live traces](/en/paper-reading/43-parsing-the-stream-live-trace/) ask how to preserve replayable execution events; [DRACO’s dynamic rubrics](/en/paper-reading/44-draco-dynamic-rubrics/) asks how evaluation can adapt to the task; [A²E’s auditing engine](/en/paper-reading/19-a2e-agent-auditing-engine/) asks how an agent behavior becomes an evidence chain; and [CONTINUITY Security’s context contract](/en/paper-reading/45-continuity-security-context-contracts/) asks how state boundaries survive across turns. ACE brings the same questions to an editable multi-page canvas: representation, context routing, judge, and rollback must agree inside one trace.

Here are the three voices separately:

| Layer | What this reading says |
| --- | --- |
| **Directly supported by the Paper** | Hierarchical scene graph, 98 tools, three CARE modes, reference-free IF evaluator, up to three correction rounds, 94-task results, the 53-task head-to-head, 26 blind raters, out-of-loop judges, strict-peak rollback, and component ablations. |
| **Author interpretation** | Structured representation, relevant context, specialized tools, and judge-guided correction jointly let ACE lead HTML and OpenXML on this benchmark; self-correction can repair some failures without a ground-truth deck. |
| **Not established by the Evidence** | Universal creative-editing improvement, transfer to every style or platform, judge replacement of a human designer, complete paper-metric reproduction from the public logs, or any production cost or quality guarantee. |
| **Bloss0m engineering synthesis** | If you borrow ACE, write scene graph, context scope, origin→current diff, IF/VQ/human review, rollback policy, and artifact version into a replayable workflow contract. |

### Paper Essence Contract

1. **What problem does it solve?** Flat canvas representations make local edits propagate through many coordinates, while reference-free tasks have no unique correct deck. ACE proposes a structured, self-correcting path for multi-slide editing.
2. **Why are previous approaches insufficient?** HTML and OpenXML agents can produce pages but lack scene-level semantics, local context routing, and diff-driven feedback; screenshot-only evaluation cannot distinguish a reasonable structural change from a missing edit.
3. **What is the core technical idea?** Represent relations with a scene graph, select scope with CARE, execute semantic tools, and use JsonDiff plus an instruction-following judge for critique; strict-peak keeps the best observed iteration.
4. **How does one input flow?** User task → Micro, Macro, or Systemic routing → selected slide, cross-slide skeleton, or tokens → scene-graph tool calls → Figma state and render → diff evaluator and judge → critique for another round when needed → best state as output.
5. **What evidence supports the headline?** Full 94-task paired IF statistics, 53-task baseline comparisons, blind human study, two out-of-loop judge families, self-correction ablation, and rollback sensitivity together. No single score supports every claim.
6. **Where does the claim stop?** It stops at a Figma-centered benchmark with 85 adapted PPTArena tasks and 12 additions, fixed models, fixed judges, and a structured task distribution. Nothing here automatically transfers to all creative work, canvas platforms, providers, or designer workflows.

## What to know first: flat files, structured canvases, and no unique answer

### Why flat coordinates amplify a local edit

In a traditional presentation file, an object is often represented by a page, x/y position, width, height, and style properties. Adding a fifth card to an already arranged panel may require an agent to create the card and recompute existing card positions, sizes, and connectors. If it merely generates a new HTML or OOXML tree, semantic relationships disappear inside coordinate strings. ACE’s scene graph gives nodes parents, children, relative transforms, and auto-layout behaviors such as fill, hug, and fixed. This does not guarantee a beautiful layout; it gives the agent an operational model of which node is affected by which relation.

### IF and VQ answer different questions

ACE uses two complementary signals:

- **Instruction Following (IF)** reads the focused diff from original state to prediction state and checks whether the requested elements, text, position, or structure were completed. It does not require a ground-truth deck.
- **Visual Quality (VQ)** compares rendered screenshots of the reference and prediction and evaluates salient visible changes. The paper reports that VQ means are not significantly different from the HTML baseline.

So “IF increased” means that the edit contract was more often satisfied. It does not mean every layout, style, brand voice, or visual preference improved. That distinction is necessary for every result below.

## Core intuition: show the agent only the needed structure, then give it a replayable critique

Think of ACE as a five-stage controller:

```text
task intent
   ↓
CARE scope → scene-graph state → semantic tool calls → render + JsonDiff
                                                        ↓
                                  IF judge critique ← current/origin state
                                                        ↓
                                  next turn or strict-peak rollback
```

The flat workflow serializes a whole document and asks the agent to infer relations from coordinates and style properties. ACE puts relations into the representation, constrains the prompt scope, and sends evaluation back to the same state. This moves the control point in two useful ways: irrelevant context is reduced, and correction has an object that a diff, log, and rollback pointer can identify.

It also creates dependencies. The scene-graph schema must be stable, the router must not omit required nodes, tool execution must truly write the state, and the judge must not be dominated by prompt or family bias. ACE’s evidence shows these components working together within its benchmark; it does not isolate one component as the source of all gains.

## Walk two examples through the method

### Example A: Case 112 and an auto-layout change

The paper uses Case 112 to explain the difference between a scene graph and flat OOXML:

1. **Input:** The task asks the agent to add two children to an auto-layout parent that already has five.
2. **Intermediate representation:** The scene graph preserves the parent, children, relative relations, and layout mode; flat OOXML stores each shape as an absolute EMU coordinate.
3. **Decision:** The agent calls semantic add or layout tools, allowing the parent to reflow according to fill, hug, and fixed rules instead of manually solving every card coordinate.
4. **Output:** The new children appear and existing children are rearranged by the parent layout. This illustrates an operational representation, not a guarantee that every design will look optimal.
5. **Likely failure point:** If the router gives only the target node and omits a required parent constraint, or if the tool fails to write layout state correctly, the local edit can still misalign the page.

That is why Figure 3(c) matters: the claim is not that JSON is shorter than XML. The claim is that hierarchical relations change the action available to the agent.

![ACE Figure 3(c): flat OOXML and hierarchical scene graph](/paperReading/58-ace-self-correcting-canvas/paper/figure-3-scene-graph.webp)

*Figure 3(c), original paper Section 3.1 representation comparison: [Original Figure 3](https://arxiv.org/html/2608.24103v1#S3.F3). The flat OOXML `p:spTree` carries shapes through absolute EMU positions, while the Scene Graph shows parent–child and relational layout. The original arXiv HTML/source marks the paper CC BY 4.0; this author-provided PNG is transcoded to WebP and reused here under that license for teaching.*

### Example B: Case 54 and self-correction

Case 54 is the paper’s example of judge-guided iteration:

1. **Input:** The agent executes one edit round on a Figma canvas from the task instruction.
2. **State comparison:** The evaluator preserves an origin snapshot and builds JsonDiff from origin to current state. The judge sees the actual edit, the needed render, and the instruction—not a ground-truth deck.
3. **Decision:** Iteration one receives IF=3, below the `τ=4` stopping threshold. The judge emits a natural-language critique, and the next agent turn reads that critique.
4. **Output:** Iteration two receives IF=4 and reaches the stopping condition. If a later score declines, strict-peak returns the best recorded version.
5. **Likely failure point:** Judge score and critique can depend on model family, diff normalization, render quality, and task wording. “Correction succeeded” should therefore be read with human and out-of-loop evidence.

![ACE Figure 6: the final Case 54 self-correction panel](/paperReading/58-ace-self-correcting-canvas/paper/figure-6-self-correction.webp)

*Figure 6, original paper Section 3.3, Case 54 final panel; the original caption describes the IF=3 critique at iteration one and the IF=4 result at iteration two: [Original Figure 6](https://arxiv.org/html/2608.24103v1#S3.F6). The original arXiv HTML/source marks the paper CC BY 4.0; this author-provided panel is transcoded to WebP and reused under that license for teaching. It is the paper’s example, not a live output reproduced by me.*

## Technical mechanism: Scene Graph, CARE, and self-correction

### 1. The scene graph becomes the action surface

ACE’s core state is a hierarchical scene graph. Nodes carry parent and child links, stable source IDs, relative positions, and auto-layout constraints such as fill, hug, and fixed. The render engine is Figma. Instead of returning only a new HTML file, the agent uses MCP tools to inspect and change addressable canvas state.

The paper lists 98 tools across 11 modules: contentTools 56, slideTools 13, chartTools 7, dataChartTools 4, smartArtTools 4, tableTools 4, connectionTools 3, importExport 3, Unsplash 2, batch 1, and math 1. The benchmark invokes 66 of the 98 tools (67%); each backbone uses roughly 46–57. “98 tools” therefore does not mean that every task receives the full action space.

Semantic tools are the other half of the representation. Appendix O compares 22 `create_graphics` operations with 66 primitive operations on active tasks. For chart, SmartArt, and table-to-graphic tasks, a higher-level operation can reduce assembly steps; this comparison does not mean specialized tools are better for every task.

![ACE Figure 2: the closed-loop architecture](/paperReading/58-ace-self-correcting-canvas/paper/figure-2-architecture.webp)

*Figure 2, original paper Section 3, ACE closed-loop architecture: [Original Figure 2](https://arxiv.org/html/2608.24103v1#S3.F2). The diagram connects user intent, CARE Router, ACE Agent, MCP, the Figma scene graph, and a ground-truth-free IF judge. The original arXiv HTML/source marks the paper CC BY 4.0; this author-provided PNG is transcoded to WebP and reused here under that license for teaching.*

### 2. CARE makes context scope a diagnosable route

CARE (Context-Aware Routing and Extraction) has three modes:

| Mode | Context sent to the agent | Typical request | Reported average input-token reduction |
| --- | --- | --- | --- |
| **Micro-Spatial** | Full JSON and required render for the target slide | “Move this slide’s legend to the right” | 50 tasks, 86.6% (70.1%–99.9%) |
| **Macro-Programmatic** | Cross-slide skeleton, node IDs, and text | “Unify title styling across the deck” | 37 tasks, 90.9% (73.3%–98.8%) |
| **Systemic-Token** | Design tokens, style IDs, and global rules | “Replace the brand color token set” | 7 tasks, 95.7% (90.7%–99.4%) |

These reductions are task-level averages relative to full-deck context, not a fixed 89% saving for every request. The router starts with deterministic heuristics and can use a lightweight LLM fallback for ambiguous queries; when scope is uncertain, it can return to a more conservative context. In the 16-task CARE quality ablation, full context lowers Claude IF by 0.75, GPT by 0.38, and Gemini by 0.00. The routing audit reports 52/53 mode matches, one under-scoped case, and no over-scoped case.

![ACE Figure 4: the three CARE context-routing pathways](/paperReading/58-ace-self-correcting-canvas/paper/figure-4-care-routing.webp)

*Figure 4, original paper Section 3.2, CARE workflow: [Original Figure 4](https://arxiv.org/html/2608.24103v1#S3.F4). The three pathways correspond to local slide context, cross-slide programmatic context, and systemic design tokens. The original arXiv HTML/source marks the paper CC BY 4.0; this author-provided PNG is transcoded to WebP and reused here under that license for teaching. The figure describes the routing design, not perfect classification for every query.*

### 3. Judge-guided correction and strict-peak

Each Agent run is capped at 35 turns and up to three correction rounds; the paper uses `τ=4` as the IF stopping threshold. The evaluator keeps a per-slide origin snapshot and builds JsonDiff over text, typography, bounding box, rotation, opacity, fills, strokes, effects, and children, with numeric and color tolerances. A rendered image is attached when visual changes require it. The judge therefore answers whether the requested change appears in the current state, not whether the state is pixel-identical to a unique answer image.

The minimal loop is:

1. The agent executes an edit and records the state.
2. The evaluator builds focused evidence from the origin→current diff; the IF judge returns a score and natural-language critique.
3. If IF is below threshold and the iteration budget remains, the critique enters the next round; state accumulates rather than rebuilding the blank canvas.
4. If the trajectory score declines, strict-peak returns the historical best version, separating “last iteration” from “best observed state.”

On the Claude 53-task self-correction analysis, 35/53 cases (66%) stop after iteration one. Eighteen enter the loop; 13 improve by an average +0.94 IF and +0.78 VQ, two are unchanged, and three regress by no more than one point. With strict-peak, IF rises from 4.45 to 4.49 and VQ from 4.02 to 4.06; the paper reports that all four observed regressions are removed without a harmed case. This is a safeguard result in that configuration, not proof that rollback makes the judge reliable.

## Experimental setup: tasks, baselines, metrics, and cost

### Benchmark and comparison targets

Figma Slide Editing Benchmark v1 contains 97 human-authored tasks. Ninety-four have an origin deck and are automatically evaluable; three (Cases 102–104) require template retrieval outside the deck-given scope and are excluded from automatic evaluation. The set combines 85 PPTArena-adapted tasks—41 verbatim, 12 minor variants, and 32 rewritten—with 12 novel tasks. Nine of the novel tasks have no PowerPoint analogue. This makes the benchmark closer to an edit workflow than pure slide generation, while also making its structured-canvas distribution important to every conclusion.

The main 53-task head-to-head subset converts ACE outputs to PPTX for comparison with a Claude-Skill HTML agentic baseline and PPTArena. It is not a novel-only subset. Backbones are Claude Sonnet 4.6, GPT-5.5, and Gemini 3.5 Flash; the in-loop IF/VQ judge is GPT-5.5, and Claude and Gemini families are used out of loop. Temperature is 0; most max output tokens are 16,384, Gemini uses 32,768; the agent is capped at 35 turns and self-correction at three rounds.

### IF, VQ, and human preference answer different questions

IF comes from a structured original→prediction diff and asks whether the instruction was completed. VQ compares rendered reference and prediction screenshots and evaluates salient visible changes. The authors caution that ACE and PPTArena absolute scores are not interchangeable with original PPTArena reports: judge family, protocol, absence of a style target, and the Figma environment differ.

The human study has 26 non-expert blind raters and, after two exclusions, 935 judgments: 51 ACE-vs-HTML comparisons and 17 self-correction comparisons. The imperceptible transition in Case 37 and font adjustment in Case 67 are excluded. Fleiss κ is about 0.20–0.29 and raw agreement about 65%–67%. Among decisive cases, judge–human agreement is 80% for IF (n=41), 76% for VQ (n=37), and 78% for Overall (n=50); these checks do not remove small-sample and tie-heavy uncertainty.

## How to read the evidence: headline result and three diagnostics

### 1. Full-benchmark IF gain is not a universal visual win

The first question is: “On the same 94 automatically evaluable tasks and protocol, does ACE satisfy the requested edit more often?” The main observations are:

| Setting | ACE | HTML baseline | How to read it |
| --- | ---: | ---: | --- |
| Full 94-task GPT IF | 4.23 | 3.81 | Paired p=.010; ACE is higher on instruction following |
| Full 94-task Gemini IF | 4.62 | 4.21 | Paired p=.022; same direction |
| Full 94-task GPT VQ | 3.66 | 3.57 | p=.56; no significant difference |
| Full 94-task Gemini VQ | 3.93 | 3.78 | p=.57; no significant difference |

The authors also report about 1.75x speed and 44% lower cost; cost accounting includes judge and router paths, while baseline logging coverage and provider prices affect the comparison. The safest interpretation is an instruction-level advantage within this protocol with similar visual-quality means. It is not evidence for universal creative-editing improvement.

### 2. Human and out-of-loop checks are useful, not independent truth

For ACE versus HTML, the 26-rater decisive win rates are 59.6% for IF, 57.1% for VQ, and 58.7% for Overall. For self-corrected versus single-pass outputs they are 80.9% for IF, 83.5% for VQ, and 81.5% for Overall, based on only 17 cases. The 58.7% Overall result is best read as a small-panel preference on these examples, not a broad market preference or a substitute for designer testing.

Two out-of-loop judge families rescore identical outputs; the ranking remains ACE > HTML > PPTArena. The self-correction IF delta falls from +.94 in loop to +.61 with Claude and +.56 with Gemini, retaining about two thirds of the gain. That reduces concern about a single judge’s circularity but does not remove it: the in-loop judge still drives the loop, and external judges share model and protocol assumptions with the metric. Human agreement and κ also show that “which visual is better?” is not a deterministic label.

### 3. Self-correction gains come from a minority of cases; rollback is a safety net

On the Claude 53-task ablation, no self-correction gives IF 4.04 and VQ 3.75; the loop gives IF 4.45 and VQ 4.02. Thirty-five cases stop in the first round and 18 enter the loop, so the headline delta does not mean every request needs three rounds. Sensitivity analysis moves external IF from 4.04 to 4.26 to 4.38 as maximum K changes from 1 to 2 to 3; thresholds 2, 3, and 3.5/4 also change the result.

Representation ablation shows scene graph→OOXML changes of about −.64/−.62 IF/VQ for Claude, −.78/−.63 for Gemini, and −.69/−.45 for GPT. Specialized tools→primitives also loses quality on the three backbones. CARE full-context ablation on 16 multi-slide tasks yields Claude −.75, GPT −.38, and Gemini 0. These are component-isolation observations, not an additive causal decomposition and not proof that every module helps another task distribution.

The novel-task aggregate is also important: nine novel editing tasks score 3.78/3.22 IF/VQ with ACE self-correction, below 4.23/3.66 for all 94 tasks. Case 101’s layered-image task is 2/1 and Case 109’s LaTex-to-SVG task is 0/0. These failures are evidence about coverage, not disposable noise: the representation and tool space remain weak for some asset-heavy or creative operations.

## Limitations, validity threats, and interpretations the paper does not support

### Judge circularity and metric asymmetry

The central fairness concern is that only ACE puts an IF judge into the correction loop. HTML and PPTArena are multi-turn agentic baselines but do not receive the same closed-loop critique. The authors quantify circularity and add out-of-loop families and a human study, but do not claim it is fully removed. VQ is not a stopping signal, and its full-benchmark means do not significantly differ from HTML; that is why IF alone is insufficient.

### Human sample and subjective prompts

Twenty-six non-expert blind raters, 935 judgments, and 17 self-correction cases provide a directional check, not an estimate of a broad design market. Fleiss κ of 0.20–0.29 indicates disagreement. Excluding imperceptible cases preserves visible comparisons but changes the sample composition. Brand, composition, and typography prompts can produce a different ranking.

### Benchmark distribution and platform transfer

Eighty-five of 97 tasks are adapted from PPTArena; only 12 are new, nine lack a PowerPoint analogue, and three tasks are excluded from automatic evaluation. The 53-task head-to-head has no novel-only slice. ACE is centered on a Figma scene graph, plugin, and MCP surface; moving to PowerPoint or Google Slides requires rebinding tool semantics, layout, rendering, and export. Paper numbers cannot be transferred directly.

### Three statements not justified by this paper

- “ACE is better for all creative editing”: not established; the evidence covers a selected task distribution and VQ means are not significantly different.
- “The judge replaces a human designer”: not established; judge–human agreement is imperfect and the judge sees a restricted diff, render, and prompt.
- “The mock run reproduces the paper”: not established; mock mode does not call the model, Figma, or the complete benchmark, while live mode requires credentials, services, and user-owned decks.

## Artifacts and reproducibility: mock runnable does not mean live reproduction

This is the public artifact status I observed as of 2026-09-17:

| Artifact | Endpoint observation | What it supports | What remains missing |
| --- | --- | --- | --- |
| GitHub code | Public, Apache-2.0; inspected commit `5c222201dc42290b291ab82a9c65263125f35754` | Inspectable orchestrator, CARE, tools, evaluator, mock, and run instructions | Live path needs a Figma plugin/server, user-owned decks, tokens, and model API keys |
| HF benchmark card | Public, CC BY 4.0; card describes 94 task pairs／188 decks; API metadata is reachable; page reports about 5.53 GB | TestA/GroundTruthA deck JSON, frames, index, and `meta.json` can be located; Case 108 metadata endpoint is readable | I did not download the 5.53 GB dataset, and I do not treat the viewer as a paper rerun |
| Execution logs | README and paper say 94; independent enumeration of `execution_logs/` finds 93 case directories, with 93 history files and 93 self-correction histories | Public turns, IF trajectories, feedback, and cost fields can be inspected | Heavy provider payloads, complete PNG renders, and some raw structures are omitted; the 93/94 discrepancy needs author clarification |
| Mock path | `python3 main.py --mock` succeeds; it simulates Case 108, Micro-Spatial routing, iteration-one IF=3, and iteration-two IF=4 | Dry-run execution and basic data flow are verifiable | No API, Figma, or benchmark deck is called; sample output is not live evidence |

The mock output has six steps: load the benchmark, list modules, skip unavailable decks, simulate Micro-Spatial context, simulate iteration-one IF=3 critique, and simulate iteration-two IF=4 stopping. It is useful for environment and data-flow checks, but not a reproduction of Case 108’s actual evaluation.

The full live path needs a Socket Server (`ws://localhost:3055`), an MCP Server, an HTTP MCP client (`localhost:3001`), and the Figma desktop plugin, plus a Figma access token, model API keys, and an IF-judge key. It uses the operator’s own Figma files. The defensible artifact conclusion is therefore: **the code is readable, the mock is runnable, and public artifacts are inspectable; full paper reproduction remains a conditional setup path, not an independent live rerun completed in this reading.** The log-count discrepancy is recorded as a blocker/risk rather than silently inventing a missing case.

## Engineering decision and when not to use it

The following is **Bloss0m engineering synthesis**, not a new experiment by the paper’s authors.

### A workflow contract worth borrowing

1. **Choose the representation first.** If a task touches parent, layout, group, chart, or cross-slide relations, retain an addressable scene graph instead of flattening everything into absolute coordinates.
2. **Make scope part of the trace.** Record router mode, selected slide/node/token, fallback reason, and context size; an under-scoped decision should be a diagnosable event rather than a silent token saving.
3. **Separate quality signals.** Preserve IF, VQ, render health, tool success, human preference, and cost. No single judge score should stand for creative quality.
4. **Make the diff replayable.** Keep origin snapshot, current state, stable node ID, normalization tolerance, critique, and judge version so a correction can be inspected.
5. **Treat rollback as a guardrail.** With strict-peak, retain both best state and last state and monitor judge drift. Keeping only the highest score can still carry an unobserved visual regression into production.
6. **Keep people at the boundary.** Brand-sensitive work, irreversible exports, external assets, legal or data correctness, and large composition changes need human approval or a policy gate.

### When an ACE-style loop is the wrong default

- The task is primarily open-ended art direction, brand taste, or “make it feel more premium,” with no stable observable diff; IF is not a sufficient stop signal.
- The canvas backend is not Figma and has no equivalent hierarchy, layout, render, and tool semantics; copying a 98-tool schema creates false portability.
- Correctness depends on external facts, trademarks, image licenses, or exact values; scene graphs and judges do not vouch for provenance or domain validation.
- The product needs one small, low-latency, low-permission edit; three agent rounds plus routing and judging may cost more than a human or deterministic tool.
- The team does not preserve origin/current state, judge prompt, model version, and rollback event; a higher score then cannot support incident review.

ACE’s engineering value should therefore be described as “an observable closed-loop design for a structured canvas agent,” not “a universal creative-editing gain.”

## Three things to remember

1. **Technical idea:** The scene graph turns parent–child relations, relative transforms, auto-layout, and semantic tools into an agent action surface; CARE then limits context to what the task needs.
2. **Evidence:** IF gains on the full 94-task benchmark point in the same direction as out-of-loop and human checks, and self-correction helps the minority of cases that enter the loop. VQ means are not significantly different, the human sample is small, and judge circularity remains.
3. **Boundary:** The public mock proves a dry-run path; repository enumeration finds 93 log cases while the paper and README say 94; live reproduction needs private decks, Figma/MCP services, and API credentials. The paper does not support universal creative-editing improvement or judge replacement of humans.

## Primary sources

- [ACE arXiv abstract and v1 record](https://arxiv.org/abs/2608.24103)
- [ACE v1 full HTML](https://arxiv.org/html/2608.24103v1)
- [ACE v1 PDF](https://arxiv.org/pdf/2608.24103v1)
- [Official GitHub repository](https://github.com/BloomBerry/agentic-canvas-editor)
- [Figma Slide Editing Benchmark card](https://huggingface.co/datasets/BloomBerry/figma-slide-benchmark)
- [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/)

The interpretation and artifact-status notes are **Bloss0m synthesis**: paper, repository, and benchmark-card sources anchor the numbers, methods, and limitations; the engineering recommendations and explicit non-transfer claims are reasoned conclusions from placing that evidence inside an agent workflow.
