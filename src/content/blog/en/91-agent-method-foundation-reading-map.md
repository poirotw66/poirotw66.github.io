---
title: "Agent Foundations Reading Map: From CoT and WebGPT to ReAct and the Notes Already on This Site"
description: "A spine map of how CoT and WebGPT merge into ReAct, then connect to the tool, memory, evaluation, and runtime notes already on this site. Orientation, not a new experiment."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "CoT reasons without acting; WebGPT acts with little explicit reasoning; ReAct stitches thought–action–observation into one trajectory."
  - "From ReAct the control point splits four ways: how tools are learned, how experience is written across trials, how real-repo success is scored, and how context is paged."
  - "The 2025–26 notes on this site are leaves, not replacements; later leaderboard numbers must not be written back into the 2023/2024 classics."
audience:
  - "Readers who just finished ReAct → Toolformer → SWE-bench → Reflexion → MemGPT and need a spine"
  - "Engineers choosing the next deep read by job: tools, memory, evaluation, runtime, or evidence-before-reason"
category: "AI Engineering"
tags: ["AI Agent","Evaluation","Research","Architecture Patterns"]
image: "/blog/91-agent-method-foundation-reading-map/title_image.webp"
subtitle: "See how the classics connect to notes already on this site, then pick the next link."
kind: guide
showToc: true
---
**Bookmark this page.** The [paper-reading hub](/en/paper-reading/) already has three PATHS: foundations, retrieval systems, and agent systems. The third starts at OSReward and is a mixed advanced list. If you have just finished the ReAct family, you still need a **spine** that says how those classics connect to the 2025–26 notes on this site. That is this page.

This is not a new paper-reading note, and it does not replace the six Paper Essence questions in each linked article. It only answers how the nodes connect, which control point changed, and which link to open next.

> **Huahua in one sentence**
>
> ReAct does not make the model smarter. It sews “only think” and “only act” into one trajectory. The later leaves still grow from that seam; they do not unpick it and start over.

> **Huahua's engineering note**
>
> Do not write later leaderboard numbers back into the 2023/2024 classics. A few-shot ReAct loop is not an Argus runtime; Toolformer’s next-token API is not MidTool; SWE-bench’s 1.96% is a protocol, not a ceiling.

## Ninety-second mental model

1. **CoT** (Wei et al., 2022) = reason without touching an environment. **WebGPT** (Nakano et al., 2021) = act with little explicit verbal reasoning. **ReAct is the merge**: thought, action, and observation interleave in one trajectory.
2. From ReAct the control point splits: **how tools are learned** (Toolformer), **how experience is written across trials** (Reflexion), **how success is scored on real repos** (SWE-bench), **how a finite context window is paged** (MemGPT).
3. The 2025–26 notes on this site are **leaves**. They inherit one of those control points; they do not retire the classics. SWE-Bench ProMax’s 41.2% and later Letta product metrics must not be back-filled into 2023/2024 tables.
4. Sharing a family name is not the same contract: few-shot ReAct ≠ Argus runtime; Toolformer’s single API insert ≠ MidTool mid-training; SWE-bench 1.96% is a protocol, not a model-ability ceiling.

CoT and WebGPT both now have notes on this site; this page only links them and does not rewrite the spine.

## The spine

In the diagram, “on this site” is the English for the author’s original sketch label. The body reads it as “already given a deep read here.” MemGPT is the one extra ReAct child added after the original sketch: it is the **memory-control-plane / context-paging** line, and it was not in the first drawing.

```mermaid
flowchart TB
  CoT["on this site: Wei 2022 CoT<br/>reason, no acting"]
  WebGPT["on this site: Nakano 2021 WebGPT<br/>act, little reasoning"]
  CoT --> ReAct["ReAct 2022/23<br/>thought–act–obs loop"]
  WebGPT --> ReAct
  ReAct --> Toolformer["Toolformer 2023<br/>self-supervised API calls"]
  ReAct --> Reflexion["Reflexion 2023<br/>verbal feedback into memory"]
  ReAct --> SWEb["SWE-bench 2024<br/>real GitHub issue eval"]
  ReAct --> MemGPT["on this site: MemGPT<br/>context paging"]
  ReAct --> GenAgents["on this site: Generative Agents<br/>sandbox observe–reflect–plan"]
  Toolformer --> Gorilla["on this site: Gorilla<br/>catalog retrieve+call"]
  Gorilla --> MidTool["on this site: MidTool"]
  Gorilla --> RAGMCP["on this site: RAG-MCP"]
  Reflexion --> ADIAS["on this site: ADIAS"]
  Reflexion --> PAST["on this site: PAST-Bench"]
  SWEb --> ProMax["on this site: SWE-Bench ProMax"]
  ReAct --> ReadGate["on this site: before reasoning fails"]
  ReAct --> Argus["on this site: Argus runtime"]
```

## How to walk the map

### Path A · Fastest: ReAct, then one child

1. [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/): lock the thought–action–observation contract first.
2. Pick **one** child for the place you are actually stuck: tools → [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/); across-trial memory → [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/); real-issue evaluation → [SWE-bench](/en/paper-reading/26-swe-bench-github-issue-evaluation/); context paging → [MemGPT](/en/paper-reading/28-memgpt-context-as-memory-paging/).
3. Stop. Read a leaf only when you need that control point.

### Path B · Full classic spine: 24 → 25 → 26 → 27 → 28

Follow the note numbers: [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/) → [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/) → [SWE-bench](/en/paper-reading/26-swe-bench-github-issue-evaluation/) → [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/) → [MemGPT](/en/paper-reading/28-memgpt-context-as-memory-paging/). This builds the method foundation. It does not replace the hub’s [agent-systems path](/en/paper-reading/#reading-paths), which still starts at OSReward and mixes runtime, safety, and evaluation.

### Path C · Pick a leaf from the job

| Where the work is stuck | Start with this leaf | Control point it inherits |
| --- | --- | --- |
| Teaching tools, or too many schemas | [Gorilla](/en/paper-reading/35-gorilla-llm-connected-with-massive-apis/) (catalog-scale ancestor) → [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/), [RAG-MCP](/en/paper-reading/04-rag-mcp/) | Toolformer → Gorilla: tool use on the training / retrieve-and-call / routing side |
| Remembering after failure, or whether a score gain is retained experience | [ADIAS](/en/paper-reading/20-adias-issue-centric-agent-optimization/), [PAST-Bench](/en/paper-reading/16-past-bench-recursive-self-improvement/) | Reflexion: how experience is written across trials |
| How memory supports planning and social behavior in a multi-agent sandbox | [Generative Agents](/en/paper-reading/36-generative-agents-interactive-simulacra/) (memory-line ancestor) vs [MemGPT](/en/paper-reading/28-memgpt-context-as-memory-paging/) | Observe-reflect-plan memory stream ≠ single-agent OS paging |
| Whether large, multilingual refactors still count as success | [SWE-Bench ProMax](/en/paper-reading/22-swe-bench-promax/) | SWE-bench: what counts as coding success |
| Long-horizon runtime, authority, and rollback | [Argus](/en/paper-reading/10-argus-agentic-runtime/) | A ReAct loop is not a deployable control plane |
| The system searched but answered before reading evidence | [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/) | ReAct can search; it does not guarantee read-before-final |

## Node table: control point, one sentence, do-not-misread

| Node | Control point changed | One sentence | Link | Do not misread |
| --- | --- | --- | --- | --- |
| CoT | Whether the prompt writes intermediate reasoning | Reason without touching an environment | [Already on this site](/en/paper-reading/29-chain-of-thought-prompting/) | Ancestor; a frozen prompt, not an agent that moves |
| WebGPT | Whether browser actions are used to answer | Act with little explicit verbal reasoning | [Already on this site](/en/paper-reading/30-webgpt-browser-assisted-qa/) | Ancestor; browsing commands are not ReAct thoughts |
| ReAct | Whether the next move is a sentence to oneself or a touch of the world | Add thought to the action space and interleave with observation | [Already on this site](/en/paper-reading/24-react-interleaved-reasoning-acting/) | A few-shot loop is not an agent runtime |
| Toolformer | Whether a training string should insert one API call | Filter self-supervised tool use with future-token loss | [Already on this site](/en/paper-reading/25-toolformer-self-supervised-api-calls/) | Next-token API ≠ MidTool mid-training |
| Gorilla | How to retrieve and call over a huge API catalog | APIBench + RAT put document retrieval into finetuning and cut hallucination | [Already on this site](/en/paper-reading/35-gorilla-llm-connected-with-massive-apis/) | Catalog retrieve+call ≠ MCP product contract; also ≠ MidTool |
| Reflexion | Where verbal experience is written after failure | Freeze weights; write verbal feedback into a short buffer; start the next trial | [Already on this site](/en/paper-reading/27-reflexion-verbal-reinforcement/) | Extra retries are not parameter learning |
| SWE-bench | What counts as coding success | A real GitHub issue plus passing tests is resolve | [Already on this site](/en/paper-reading/26-swe-bench-github-issue-evaluation/) | 1.96% is a protocol, not a ceiling |
| MemGPT | Who decides what pages in and out of a finite context | Treat the prompt as RAM and external memory as disk; page with functions | [Already on this site](/en/paper-reading/28-memgpt-context-as-memory-paging/) | Extra node, not in the original sketch; not enterprise ACL memory, and not Letta product metrics |
| Generative Agents | How memory supports planning among many agents in a sandbox | Observations to memory stream, periodic reflection, retrieval-conditioned planning; 25 agents in Smallville | [Already on this site](/en/paper-reading/36-generative-agents-interactive-simulacra/) | Memory-line ancestor; not MemGPT single-agent paging, and not production runtime |
| MidTool | When tool affordances are taught | Move grounding and execution earlier into mid-training | [Already on this site](/en/paper-reading/23-midtool-agentic-tool-use/) | A leaf, not Toolformer’s same loss filter |
| RAG-MCP | How to choose among too many tool schemas | Retrieve candidate schemas, then let the executor call | [Already on this site](/en/paper-reading/04-rag-mcp/) | A leaf; retrieval is not authorization |
| ADIAS | What indexes repair progress | An issue ledger remembers what was tried and which intervention failed | [Already on this site](/en/paper-reading/20-adias-issue-centric-agent-optimization/) | A leaf; not Reflexion’s short buffer |
| PAST-Bench | Whether a better score came from retained experience | Pair persistence on/off; separate task score from mechanism evidence | [Already on this site](/en/paper-reading/16-past-bench-recursive-self-improvement/) | A leaf; the paper is an evaluation device, not a new memory-algorithm SOTA |
| SWE-Bench ProMax | The denominator for large multilingual refactors | A later evaluation substrate, not “models improved 41 points on the same 2,294 instances” | [Already on this site](/en/paper-reading/22-swe-bench-promax/) | A leaf; 41.2% must not be written back into original SWE-bench tables |
| Before reasoning can fail | Whether a read happens after search and before final | A pre-evidence procedural failure, not a wrong answer after reading gold | [Already on this site](/en/paper-reading/15-before-reasoning-fails/) | A leaf; Read-Gate is not a substitute for retrieval quality |
| Argus | The control plane for long-horizon work | Authority, verifier, rollback—not a longer prompt | [Already on this site](/en/paper-reading/10-argus-agentic-runtime/) | A leaf; a ReAct loop is not this runtime |

## What this page is not

- **It does not replace the six Paper Essence questions.** Each linked note still has to carry: the problem, why the prior approach was insufficient, the core idea, how one input moves through the method, which evidence supports the headline, and where the claim stops. This page only orients.
- **It does not rewrite the spine.** The 2026 CoT and WebGPT notes are now linked in the table and nodes. This page still only orients.
- **It does not rewrite the hub’s agent-systems path.** That path still starts at OSReward and mixes runtime, safety, and evaluation. This page is the method-foundation spine, not a fourth path type.
- **It does not back-fill later numbers into classics.** Evidence, author claims, and Bloss0m judgment stay in the individual notes.

If the reading method itself is still unfamiliar, pair this map with [Efficient Academic Paper Reading: The Three-Pass Approach](/en/blog/08-efficient-paper-reading-three-pass/). If you want product architecture rather than a paper family, start from the [AI Agent guide](/en/blog/64-ai-agent-guide/).

## How to use this guide

- **Entering from the paper-reading hub:** the three PATHS remain; if you need the ReAct family spine onto the leaves, stop here and follow a link.
- **Entering from a classic note:** if the article links to a “reading map,” it means [this page](/en/blog/91-agent-method-foundation-reading-map/).
- **Traditional Chinese edition:** use the language toggle on this page.

## References

- [Paper-reading hub](/en/paper-reading/) (three PATHS; agent-systems path at [#reading-paths](/en/paper-reading/#reading-paths))
- [Wei et al., 2022, Chain-of-Thought Prompting](https://arxiv.org/abs/2201.11903)
- [Nakano et al., 2021, WebGPT](https://arxiv.org/abs/2112.09332)
- Method post on this site: [Three-pass reading](/en/blog/08-efficient-paper-reading-three-pass/)
- A different map (Harness blogs, not this paper family): [Harness Engineering Guide](/en/blog/13-harness-engineering-reading-map/)
