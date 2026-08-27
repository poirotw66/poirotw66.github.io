---
title: "MemGPT: Treat Context as Paged Memory — Do Not Mistake the OS Metaphor for Enterprise Memory"
description: "A deep read of Packer et al., arXiv:2310.08560 v2: finite context as RAM, OS-like tiers, and function-mediated paging. DMR moves GPT-4 from 32.1% to 92.5%; nested KV shows multi-hop lookup—not ACL memory governance."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "MemGPT’s control point is virtual context management: main context (system instructions, working context, FIFO) pages against external recall/archival stores via self-directed function calls, instead of stuffing a longer transcript into a bigger window."
  - "Deep Memory Retrieval (Table 2): GPT-4 fixed-context 32.1% → +MemGPT 92.5%; GPT-4 Turbo 35.3% → 93.4%. That is an MSC multi-session consistency setup, not “the same model with a longer prompt.”"
  - "Nested KV (Figure 7): fixed-context models collapse to 0% at deeper nesting; MemGPT+GPT-4 can chain lookups. The boundary is tool-call fidelity and wrong evictions—not enterprise ACL memory."
audience:
  - "Engineers who are about to solve “long-term memory” by lengthening the system prompt or keeping an unbounded transcript, and need a paged working-set design instead."
  - "Leads who must place MemGPT, Reflexion, xMemory, and Argus as context paging, across-trial verbal reflection, hierarchical retrieval construction, and durable runtime governance."
tags: ["Paper Reading", "Agent Systems", "Agent Memory", "Context Management", "Tool Use"]
image: "/paperReading/28-memgpt-context-as-memory-paging/title_image.webp"
field: "AI Engineering"
difficulty: "intermediate"
showToc: true
topics:
  - agent-memory-adaptation
  - tool-use-coding-agents
paper:
  title: "MemGPT: Towards LLMs as Operating Systems"
  authors:
    - "Charles Packer"
    - "Sarah Wooders"
    - "Kevin Lin"
    - "Vivian Fang"
    - "Shishir G. Patil"
    - "Ion Stoica"
    - "Joseph E. Gonzalez"
  year: 2023
  venue: "arXiv / CoRR preprint (2310.08560 v2)"
  links:
    pdf: "https://arxiv.org/pdf/2310.08560v2"
    arxiv: "https://arxiv.org/abs/2310.08560"
    doi: "https://doi.org/10.48550/arXiv.2310.08560"
    code: "https://github.com/letta-ai/letta"
    project: "https://research.memgpt.ai"
series:
  id: "memgpt-context-as-memory-paging"
  title: "MemGPT deep reading"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Fixed-length context windows break long conversations and long-document analysis; naively lengthening transformer context raises quadratic cost, and long windows still may use middle tokens poorly.
- **Core insight:** Do not start by buying a bigger RAM stick. Treat the LLM’s prompt tokens as **main context (RAM)**, keep chat history and document stores in **external context (disk)**, and let function calls decide what to write out, retrieve, and evict—like OS virtual-memory paging.
- **Strongest evidence:** On Deep Memory Retrieval (Table 2), GPT-4 fixed-context accuracy is **32.1%** versus **92.5%** with MemGPT; GPT-4 Turbo moves **35.3% → 93.4%**. On Nested KV (Figure 7), fixed-context models fall to 0% at deeper nesting while MemGPT+GPT-4 keeps multi-hop lookup alive.
- **Main boundary:** The system depends on tool/function-call fidelity; the paging policy is itself an agent decision that can store or drop the wrong facts; the evidence is dialogue consistency plus sampled/synthetic document tasks—not ACL, audit, or rollback memory governance. Later Letta productization is not this paper’s experiment artifact.

Bounded verdict: **Keep MemGPT as “memory is a control plane over a fixed context window.” Do not read the OS metaphor as a shippable enterprise memory layer, and do not back-fill later product numbers into Table 2 / Figure 7.**

> **Huahua's take**
>
> Reflexion writes a lesson after failure and starts the next trial. MemGPT pages facts in and out of a fixed window inside a long interaction. Both touch “memory,” but they are not the same control point.

## Version and reading scope

This note reads [Packer et al., arXiv:2310.08560 v2](https://arxiv.org/abs/2310.08560) (first posted 2023-10-12; revised 2024-02-12). The PDF and [arXiv HTML](https://arxiv.org/html/2310.08560v2) are marked CC BY 4.0. Author order follows the arXiv abs page: Charles Packer, Sarah Wooders, Kevin Lin, Vivian Fang, Shishir G. Patil, Ion Stoica, and Joseph E. Gonzalez. Beyond the abstract, this article checks Section 2’s main/external context and function executor, Section 3’s MSC / DMR / opener / DocQA / Nested KV setups, Tables 1–3, Figures 3 / 5 / 7, and artifact endpoints as of **2026-08-27**.

This is an **arXiv / CoRR preprint**, not a confirmed peer-reviewed proceedings version. The source TeX ships ICLR 2024 style files; this note does **not** treat that as conference acceptance. The release page is [research.memgpt.ai](https://research.memgpt.ai). As of 2026-08-27, `github.com/cpacker/MemGPT` redirects to [letta-ai/letta](https://github.com/letta-ai/letta) (Apache-2.0); `memgpt.ai` redirects to the Letta product site. This note does **not** back-fill later Letta product metrics, LoCoMo, or other memory-benchmark numbers into these tables.

## The reader question

When a task already exceeds the model window, should engineering keep lengthening the prompt—or change **who decides what enters the window**? MemGPT’s answer is to treat finite context as a working set and let the model page through an OS-like hierarchy with tools.

The precise reading is not “is MemGPT infinite context?” The real question is: **which decision does the paging control plane change, and on which tasks does the method fail because tool calls are unreliable, nested lookups stop early, or external retrieval misses?**

## Evidence map

| Layer | How this note uses it |
| --- | --- |
| **Paper directly supports** | Figure 3 defines system instructions / working context / FIFO plus recall / archival; Table 2 reports DMR accuracy and ROUGE-L (R); Figure 5 shows DocQA where MemGPT is less dominated by fixed-window truncation / retriever caps; Figure 7 shows Nested KV where fixed-context models collapse at deeper nesting while MemGPT+GPT-4 continues. |
| **Author claims** | Virtual context management can create the illusion of longer context without changing the underlying finite window; function chaining (`request_heartbeat`) enables multi-step retrieval; OS paging and interrupt ideas transfer to LLM agents. |
| **Not established** | Enterprise permissions, retention, audit, and rollback; correctness guarantees for paging decisions; matched open-weight numbers; product runtime SLAs. |
| **Bloss0m engineering judgment** | Implement MemGPT as a **context working-set control plane**. For across-trial verbal reflection, read [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/). For hierarchical memory construction and retrieval, read [xMemory](/en/paper-reading/06-Beyond-RAG-for-Agent/). For durable permissions and rollback, read [Argus](/en/paper-reading/10-argus-agentic-runtime/). |

Later sections keep numbers, author claims, and engineering judgment separate. “Improvement” means the paper’s reported setups only.

## Why the previous approach is insufficient

Section 1 states the gap cleanly. Long chats and long documents hit fixed windows first. Stretching transformer context directly pays quadratic compute and memory, and prior work cited in the paper (Lost in the Middle) shows longer windows still may fail to use middle tokens well.

By contrast, recursive summarization or truncation to “fake” longer history loses precise back-references—the fixed-context DMR baselines literally see lossy summaries of the past five sessions. On documents, stuffing a single top-$K$ list into a reader roughly caps accuracy at the retriever: a missed gold document never enters the window.

So the prior approaches are insufficient not because “the model cannot talk,” but because the **control point is wrong**: either pay for a longer context, or gamble on lossy compression / one-shot retrieval. MemGPT changes who manages the working set.

## Core intuition

Ignore the tables for a moment. A laptop with 8GB of RAM does not load an entire disk into memory to edit a large project. The OS keeps the active pages in RAM, leaves the rest on disk, and faults pages in when needed.

MemGPT ports that division of labor into an LLM stack:

1. **Main context ≈ RAM:** the current prompt tokens in three blocks—read-only system instructions, writable working context, and a FIFO message queue.
2. **External context ≈ disk:** recall storage (full message DB) and archival storage (arbitrary-length text / documents).
3. **Function executor:** parses model outputs into memory reads/writes/searches; `request_heartbeat=true` returns control immediately so the model can chain multi-step queries.
4. **Memory pressure:** when the queue nears a warning threshold (the paper’s example is about 70%), a system warning pushes the model to write out important facts; past the flush threshold, messages are evicted and recursively summarized.

Contrast with [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/): Reflexion changes **how failures become verbal experience across trials**; MemGPT changes **how a finite window keeps serving seemingly unbounded history and documents inside a long interaction**. It is also not [Argus](/en/paper-reading/10-argus-agentic-runtime/)’s durable runtime with authority and rollback—Argus is governance of a control plane; MemGPT is paging of a context window.

> **Huahua's engineering note**
>
> When marketing says “infinite context,” ask whether main context still has a hard cap. MemGPT never deletes the window limit; it turns the limit into a managed working set.

![MemGPT paper Figure 3: a fixed-context LLM processor augmented with hierarchical memory and a function executor / queue manager.](/paperReading/28-memgpt-context-as-memory-paging/paper/figure-3-architecture.webp)

*Figure 3, paper Sections 1–2: prompt tokens split into system instructions, working context, and a FIFO queue; functions move data between main context and archival/recall stores; `request_heartbeat` enables function chaining. Locatable at [Figure 3](https://arxiv.org/html/2310.08560v2#S1.F3); SVG endpoint [memgpt_system_flow_2.svg](https://arxiv.org/html/2310.08560v2/memgpt_system_flow_2.svg). From arXiv HTML / matching assets; page marked CC BY 4.0.*

## Walk one example through the method

The following follows the paper’s Nested KV and DocQA narratives as one teachable path. Nested KV is an author-designed synthetic multi-hop task; the step list is a mechanism walkthrough, not an independent score.

1. **Input:** The user supplies a UUID key. Storage holds 140 key–value pairs (~8k tokens, matched to the GPT-4 baseline window), and values may themselves be keys (nesting levels 0–4).
2. **Intermediate representation:** MemGPT does not dump the whole table into the prompt. The model issues storage query functions, pages results into main context, and checks whether the returned value is also a key.
3. **Model or system decision:** If it is still a key, set `request_heartbeat=true` and continue until a terminal value is confirmed. That is function chaining, not one-shot retrieval.
4. **Output:** Return the final UUID value.
5. **Likely failure point:** The model stops searching early, function arguments fail validation, or—like the GPT-3.5 fixed-context baseline—it returns the first-level value as the answer. The paper reports fixed-context GPT-3.5 at 0% by one nesting level; GPT-4 / GPT-4 Turbo at 0% by three levels; MemGPT+GPT-4 continues across depths, while MemGPT+GPT-3.5 / Turbo can still drop after about two levels when they fail to issue enough lookups.

The everyday dialogue failure mode is similar: a memory-pressure warning arrives, the model never writes “boyfriend named James” into working context, the FIFO flushes, and only a lossy summary remains—exactly where DMR baselines lose.

## Technical mechanism

### Three main-context blocks

| Block | Access | Role |
| --- | --- | --- |
| System instructions | Read-only | Control flow, memory-tier usage, function usage |
| Working context | Writable via functions | Fixed-size unstructured essentials (preferences, persona, key facts) |
| FIFO queue | Written by queue manager | Recent messages, system warnings, function I/O; eviction + summary on overflow |

### Two external stores

- **Recall storage:** full message database; searchable and re-insertable into the FIFO.
- **Archival storage:** arbitrary-length objects / documents; the paper’s default uses PostgreSQL + pgvector with `text-embedding-ada-002`, plus pagination so a single retrieval cannot overflow the window.

### Control flow

Events (user messages, capacity warnings, upload completion, schedules) → parsed into text on main context → LLM completion → function executor validates and runs → results written back. With the heartbeat flag, inference resumes immediately; otherwise the system yields until the next external event.

Operationally: more aggressive warning/flush thresholds force earlier memory writes; looser thresholds behave more like “fill then truncate.” Either way, **window size remains a hard cap**—what changes is who performs replacement inside that cap.

## How to read the evidence

Implementation details (Section 3): unless noted otherwise, `GPT-4 Turbo` = `gpt-4-1106-preview` (128k), `GPT-4` = `gpt-4-0613` (8,192), and `GPT-3.5 Turbo` = `gpt-3.5-turbo-1106` (16,385). MemGPT and baselines run on all three backbones to expose how tool-calling ability affects the system.

### DMR: cross-session consistency

**Question:** After five MSC sessions, for a narrow question that must back-reference prior dialogue, does self-directed paging beat a lossy-summary baseline?

**Controls:** Same MSC personas; baselines see lossy summaries of the past five sessions; MemGPT may search the full history via pagination but must load hits into main context; scoring uses an LLM judge for accuracy plus ROUGE-L recall (model answers are typically more verbose than gold).

**Observation (Table 2):**

| Model | Accuracy ↑ | ROUGE-L (R) ↑ |
| --- | ---: | ---: |
| GPT-3.5 Turbo | 38.7% | 0.394 |
| + MemGPT | 66.9% | 0.629 |
| GPT-4 | 32.1% | 0.296 |
| + MemGPT | 92.5% | 0.814 |
| GPT-4 Turbo | 35.3% | 0.359 |
| + MemGPT | **93.4%** | **0.827** |

**Explanation:** The lift comes from “full history is searchable + the model chooses what to load,” not from a longer single prompt. Fixed-context baselines still fail precise back-reference even with summaries.

**Boundary:** LLM judge; generated QA pairs; not open-domain chit-chat. Do not read this as “GPT-4 became sixty points stronger in one sample”—the denominator is an agent setup with memory tools.

### Conversation opener: engagement

**Question:** Can a new-session opener spontaneously use accumulated persona knowledge?

**Controls:** Compare against gold personas and the human opener; Table 3 reports SIM-1 / SIM-3 / SIM-H. Per the paper body, these rows are **MemGPT with different base models**, not the Table 2-style ±MemGPT contrast columns.

**Observation (Table 3):** Human SIM-1 / SIM-3 = 0.800; MemGPT+GPT-4 reaches 0.868 / 0.843; MemGPT+GPT-3.5’s SIM-H 0.817 beats the GPT-4 / Turbo variants’ SIM-H. The authors also state that storing information in working context is key for engaging openers.

**Boundary:** Similarity is not a user study; the table does not list paired no-MemGPT numbers, so do not over-claim.

### Document QA: retriever caps vs multi-round fetch

**Question:** When the reader window is limited, can multi-round archival queries beat a single top-$K$ fill?

**Controls:** Shared retriever (`text-embedding-ada-002`) for MemGPT and fixed-context baselines; late-2018 Wikipedia dump in the NaturalQuestions-Open line; 50 sampled questions; MemGPT loads the corpus into archival storage and searches with pagination.

**Observation (Figure 5):** Fixed-context curves are roughly capped by the retriever / how many documents fit; truncating documents to force more of them into the window hurts accuracy. The paper emphasizes that MemGPT is not dominated by that truncation path, and that MemGPT with GPT-4 and GPT-4 Turbo are equivalent on this task.

**Explanation:** Multi-round retrieval makes “effective context” no longer equal to “how many passages fit in one prompt.”

**Boundary:** 50-question sample; LLM judge; the figure is the primary evidence and the prose does not publish a single copy-friendly percentage table—this note does not invent numbers off the plot.

![MemGPT paper Figure 5: Document QA performance for fixed-context baselines versus MemGPT as document count / truncation changes.](/paperReading/28-memgpt-context-as-memory-paging/paper/figure-5-docqa.webp)

*Figure 5, paper Section 3: fixed-context readers are constrained by retrieval and truncation; MemGPT expands effective context via multi-round archival queries. Locatable at [Figure 5](https://arxiv.org/html/2310.08560v2#S3.F5). From arXiv v2 assets / HTML; page marked CC BY 4.0.*

### Nested KV: multi-hop stress test

**Question:** When the answer requires chaining UUID lookups, can function chaining finish the hops instead of stuffing the table into an 8k window?

**Controls:** 140 pairs, nesting levels 0–4, 30 orderings; baselines place (possibly truncated) documents in a fixed window.

**Observation (Figure 7 and prose):** GPT-3.5 hits 0% at one nesting level; GPT-4 / GPT-4 Turbo hit 0% by three levels. MemGPT+GPT-4 is unaffected by nesting depth and keeps querying; MemGPT+Turbo / 3.5 beat their baselines but can still drop after about two levels when they under-query. The prose also notes GPT-4 Turbo is stronger as a raw baseline, yet MemGPT+Turbo underperforms MemGPT+GPT-4.

**Explanation:** This measures control flow plus tool fidelity, not embedding retrieval quality alone.

**Boundary:** Synthetic UUIDs without linguistic ambiguity; success is tightly bound to whether the model keeps issuing correct queries.

![MemGPT paper Figure 7: Nested KV accuracy versus nesting depth; MemGPT+GPT-4 remains viable at deeper levels.](/paperReading/28-memgpt-context-as-memory-paging/paper/figure-7-nested-kv.webp)

*Figure 7, paper Section 3: fixed-context models collapse at deeper nesting; MemGPT+GPT-4 sustains multi-step function queries. Locatable at [Figure 7](https://arxiv.org/html/2310.08560v2#S3.F7). From arXiv v2 assets / HTML; page marked CC BY 4.0.*

## Limitations and threats to validity

The conclusion is forward-looking; engineering boundaries need an explicit list:

1. **Tool-call fidelity is a single point of failure.** MemGPT is markedly weaker on GPT-3.5; early stop on Nested KV is the canonical failure.
2. **Paging policy can drop the wrong facts.** A bad working-context write under memory pressure poisons later conditioning.
3. **Primary evidence is dialogue consistency plus sampled/synthetic document tasks.** Not production permission boundaries or side-effect tests.
4. **Not enterprise memory governance.** No ACL, retention, audit, or rollback—read [Argus](/en/paper-reading/10-argus-agentic-runtime/) for that layer.
5. **Do not back-fill later memory benchmarks or Letta product numbers.** This paper’s tasks are DMR / opener / DocQA / Nested KV.
6. **Preprint status.** Cite the mechanism and tables carefully; do not narrate it as a confirmed conference best paper.

## Engineering decision and when not to use it

When is MemGPT worth borrowing? When the pain is “the window cannot hold what the task must back-reference or multi-hop,” the base model’s function calling is stable enough, and you are willing to treat working/archival schemas plus pressure warnings as an auditable protocol.

When not to treat it as a construction blueprint:

- For across-trial verbal lessons after failure, read [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/). MemGPT does not replace that contract.
- For within-trial thought–action interleaving, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/).
- For how hierarchical memory is built and retrieved top-down, read [xMemory](/en/paper-reading/06-Beyond-RAG-for-Agent/).
- For workflow / long-horizon evaluation substrates, read [ContextWeave](/en/paper-reading/09-contextweave-workflow-benchmark/); for dynamic evidence discovery, read [DocMemo](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/).
- For durable runtime permissions, verification, and rollback, read [Argus](/en/paper-reading/10-argus-agentic-runtime/). Neither a longer prompt nor one more vector store solves that control problem.
- If the base model barely emits stable function calls, or you cannot accept “the model decides what to delete,” do not ship it. Nested KV and the GPT-3.5 slice are the warnings.

> **Huahua's judgment**
>
> Treat MemGPT as an auditable context pager, not as a purchased enterprise memory platform. Wrong pages make the model confidently wrong for longer.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** [arXiv abs](https://arxiv.org/abs/2310.08560), [v2 PDF](https://arxiv.org/pdf/2310.08560v2), and [HTML](https://arxiv.org/html/2310.08560v2) are readable under CC BY 4.0.
- **Project page:** [research.memgpt.ai](https://research.memgpt.ai) opens and links paper, Discord, GitHub, and Hugging Face.
- **Code:** The printed `github.com/cpacker/MemGPT` currently **301 →** [letta-ai/letta](https://github.com/letta-ai/letta) (Apache-2.0). That is a usable successor repository, **not** a frozen 2023 one-click replay bundle; the README is productized around Letta / stateful agents.
- **Data:** The paper claims release of augmented MSC, Nested KV, and ~20M Wikipedia embeddings; the HF org [huggingface.co/MemGPT](https://huggingface.co/MemGPT) opens. Which snapshot mirrors Table 2 still needs a per-card check—do not equate “org page exists” with “Table 2 is one-click reproducible.”
- **Product site:** `memgpt.ai` → [letta.com](https://www.letta.com). Product features and pricing are **not** this paper’s evidence.
- **Smallest useful reproduction:** Run one Nested KV item through query → still-a-key check → heartbeat requery while inspecting the function trace; or one DMR question checking whether recall search loaded the right session span. That validates mechanism direction only—not 93.4%.
- **Safety note:** Self-directed memory writes may retain sensitive user content; production needs retention and access policy the paper does not supply.

## Three things to remember

1. **Technical idea:** MemGPT treats finite context as RAM and uses hierarchical memory plus function-mediated paging/interrupts so the model manages its own working set.
2. **Evidence:** DMR Table 2 shows GPT-4 32.1%→92.5% and Turbo 35.3%→93.4%; Nested KV Figure 7 shows fixed-context collapse at depth while MemGPT+GPT-4 continues multi-hop lookup.
3. **Boundary:** Depends on tool-call fidelity; paging can drop the wrong facts; this is a context control plane—not enterprise memory governance and not the later Letta product scorecard.

## Further reading

MemGPT addresses how to page when the window cannot hold everything. If the next question is how failures become verbal lessons across trials, read [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/); if it is how thought and action interleave inside one trial, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/); if it is how hierarchical memory is constructed, read [xMemory](/en/paper-reading/06-Beyond-RAG-for-Agent/); if it is durable runtime permissions and rollback, read [Argus](/en/paper-reading/10-argus-agentic-runtime/); if it is workflow evaluation or dynamic evidence discovery, read [ContextWeave](/en/paper-reading/09-contextweave-workflow-benchmark/) and [DocMemo](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/).

## Primary sources

- [Packer et al., “MemGPT: Towards LLMs as Operating Systems,” arXiv:2310.08560 v2](https://arxiv.org/abs/2310.08560)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2310.08560v2)
- [Project page](https://research.memgpt.ai)
- [Code lineage endpoint (Apache-2.0; redirects from cpacker/MemGPT as of 2026-08-27)](https://github.com/letta-ai/letta)
