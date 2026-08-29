---
title: "Generative Agents: Observe–Reflect–Plan in a Multi-Agent Sandbox — Do Not Mistake Sandbox Memory for MemGPT OS Paging"
description: "A deep read of Park et al., UIST 2023 / arXiv:2304.03442 v2: 25 agents in Smallville use a memory stream, periodic reflection, and retrieval-based planning. Interview ablations hit TrueSkill μ 29.89 vs 21.21 fully ablated; two-day sandbox diffusion and party coordination are qualitative evidence, not production runtime."
pubDate: 2026-08-28
updatedDate: 2026-08-28
tldr:
  - "The control point is language memory inside a multi-agent sandbox: observations append to a memory stream, periodic reflection synthesizes higher-level inferences, and relevance/recency/importance retrieval conditions planning—not MemGPT-style function paging for one agent's main/external context."
  - "Interview ablations (Figure 8): full architecture TrueSkill μ=29.89; no reflection 26.88; no reflection or planning 25.64; crowdworker baseline 22.95; no memory/reflection/planning 21.21. One hundred rankers, five interview categories; Kruskal-Wallis H(4)=150.29, p<0.001."
  - "Two-day open Smallville run: mayor info 4%→32%, party info 4%→52%; network density 0.167→0.74; 12 invited, 5 attended. Boundaries are sandbox cost, retrieval misses, and overly polite speech—not enterprise ACL memory or later Letta/xMemory numbers."
audience:
  - "Engineers building long-horizon memory as a vector store or OS paging who need the multi-agent observe-reflect-plan sandbox architecture."
  - "Leads who must place Generative Agents, MemGPT, Reflexion, and xMemory as social-simulacra memory stream vs single-agent context paging vs across-trial verbal reflection vs hierarchical retrieval construction."
tags: ["Paper Reading", "Agent Systems", "Agent Memory", "Multi-Agent", "Simulation"]
image: "/paperReading/36-generative-agents-interactive-simulacra/title_image.webp"
field: "AI Engineering"
difficulty: "intermediate"
showToc: true
topics:
  - agent-memory-adaptation
  - agent-evaluation-observability
paper:
  title: "Generative Agents: Interactive Simulacra of Human Behavior"
  authors:
    - "Joon Sung Park"
    - "Joseph C. O'Brien"
    - "Carrie J. Cai"
    - "Meredith Ringel Morris"
    - "Percy Liang"
    - "Michael S. Bernstein"
  year: 2023
  venue: "UIST 2023 (arXiv 2304.03442 v2)"
  links:
    pdf: "https://arxiv.org/pdf/2304.03442v2"
    arxiv: "https://arxiv.org/abs/2304.03442"
    doi: "https://doi.org/10.1145/3586183.3606763"
    code: "https://github.com/joonspk-research/generative_agents"
    project: "https://reverie.herokuapp.com/UIST_Demo/"
series:
  id: "generative-agents-interactive-simulacra"
  title: "Generative Agents deep reading"
  part: 1
  totalParts: 1
---

For the broader relationship among these methods, start from the [Agent foundations reading map](/en/blog/91-agent-method-foundation-reading-map/).

## The paper in 90 seconds

- **Problem:** Large language models can mimic human behavior at a single time point, but believable agents over long horizons need growing memories, multi-agent social dynamics, and planning grounded in past experience—neither a longer prompt nor one-shot generation is enough.
- **Core insight:** Store each agent's full experience in natural language in a **memory stream**, run periodic **reflection** to synthesize higher-level inferences, and **retrieve** with relevance, recency, and importance to **plan** and react. Twenty-five agents interact in the Smallville sandbox; the memory control plane is social-simulacra observe-reflect-plan, not [MemGPT](/en/paper-reading/28-memgpt-context-as-memory-paging/) OS-style context paging for **one** agent.
- **Strongest evidence:** Interview ablations (Figure 8): full architecture TrueSkill μ **29.89** (σ=0.72), beating no reflection (**26.88**), no reflection or planning (**25.64**), crowdworker baseline (**22.95**), and full ablation (**21.21**). Two-day open simulation (Section 7.1): mayor info holders **4%→32%**, party info **4%→52%**; relationship network density **0.167→0.74**; party **12 invited, 5 attended**.
- **Main boundary:** Sandbox plus ChatGPT; the authors report thousands of dollars in token cost and multi-day runs for 25 agents over two game days (Section 8.2). Common failures are missed retrieval, fabricated embellishments, and overly formal speech from instruction tuning. This is not production ACL memory, not [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/) across-trial verbal credit assignment, and not later Letta or xMemory product metrics.

My conclusion: **Generative Agents' most useful contribution is showing how a memory stream, reflection, and retrieval-based planning can support believable behavior in a multi-agent sandbox. Its interview scores and party narrative do not establish a production enterprise memory layer, and they should not be compared directly with MemGPT's DMR 92.5%.**

> **Huahua's take**
>
> MemGPT asks who pages a single agent's finite window. Generative Agents ask how many agents in a town turn observations into reflections and then into tomorrow's plan. Both say "memory," but the control point is different.

## Version and reading scope

This note reads [Park et al., UIST 2023](https://doi.org/10.1145/3586183.3606763) via [arXiv:2304.03442 v2](https://arxiv.org/abs/2304.03442), first posted on 2023-04-07 and revised on 2023-08-06. Author order follows the PDF: Joon Sung Park, Joseph C. O'Brien, Carrie J. Cai, Meredith Ringel Morris, Percy Liang, and Michael S. Bernstein.

Beyond the abstract, this article checks Sections 3-4 on Smallville and the architecture, Section 6 on interview ablations, Section 7 on the two-day open simulation, Figures 2 / 4 / 5-8, and artifact endpoints as of **2026-08-28**.

This is a **UIST 2023 proceedings paper** (ACM), not an arXiv-only preprint story. The underlying LLM is **ChatGPT** (paper cites OpenAI 2022). This note does **not** back-fill later Letta metrics, LoCoMo, xMemory, or MemGPT DMR 92.5% into these tables.

## The reader question

When the goal is believable multi-agent social behavior—not a one-line chatbot reply—what should the memory architecture look like? Park et al. answer: each agent keeps a growing language memory stream, reflects periodically, retrieves, and plans while interacting with other agents in a sandbox.

The precise reading is not "is Smallville AGI?" The real questions are: **under what evidence does observe-reflect-plan raise believability, and where does it fail on retrieval misses, fabrication, or unclear sandbox norms?** And how does that differ from MemGPT's single-agent OS paging layer?

## Evidence map

| Layer | How this note uses it |
| --- | --- |
| **Paper directly supports** | Figure 5 defines the memory-stream / retrieval / reflection / planning loop; Figures 6-7 explain retrieval factors and reflection trees; Figure 8 reports interview ablation TrueSkill; Section 7.1 reports two-day diffusion, density, and party attendance; Figure 4 qualitatively shows the Valentine's party chain. |
| **Author claims** | Observation, planning, and reflection are all critical to believability; LLMs plus the right architecture can produce individual and emergent social behavior; the stack supports role-play and social prototyping. |
| **Not established** | Production SLAs, enterprise permissions and audit; stability far beyond two days; open-weight reproduction; robustness to prompt or memory hacking; crowdworker baseline as expert gold. |
| **Bloss0m engineering judgment** | This paper concerns language memory in a multi-agent sandbox. For single-agent context paging, read [MemGPT](/en/paper-reading/28-memgpt-context-as-memory-paging/); for across-trial verbal reflection, read [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/); for hierarchical memory construction, read [xMemory](/en/paper-reading/06-Beyond-RAG-for-Agent/). Their problem settings and evidence are not interchangeable. |

Later sections keep numbers, author claims, and engineering judgment separate.

## Why the previous approach is insufficient

Sections 1-2 state the gap on two levels.

**Single-time-point LLM behavior:** Models can sound human in one shot, but without growing memory and cross-time planning, agents are believable in the moment and unbelievable over time—e.g., eating lunch at 12:00, 12:30, and 13:00 (Section 4.3).

**Architectures without social dynamics:** Believable-agent literature long pursued NPCs and social simulation, but multi-agent settings need retrieval over long observations, synthesized reflection, and writing conclusions back into the stream—not just stuffing a transcript into a window.

By contrast, [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/) changes **across-trial** verbal credit assignment; [MemGPT](/en/paper-reading/28-memgpt-context-as-memory-paging/) changes how **one** agent pages finite context against external recall/archival stores. Generative Agents change how **many agents sharing one sandbox timeline** use a natural-language memory stream to support believable observation, reflection, and planning.

## Core intuition

Ignore TrueSkill for a moment. Imagine 25 people in a small town, each keeping a private diary (memory stream): who they met today, a burning stove, rumors about a mayoral run—all in sentences.

When deciding what to do now, they do not read the whole diary. They pick pages by **relevance** (similar to the current situation), **recency** (what just happened), and **importance** (an LLM integer score 1-10). When accumulated importance crosses **150**, they **reflect**: synthesize higher-level thoughts about themselves or others and write them back. **Planning** drafts a day outline, then recursively refines executable actions—plans also enter the diary for later retrieval.

Contrast with MemGPT:

| Dimension | Generative Agents | MemGPT |
| --- | --- | --- |
| Agent count | 25 agents in Smallville | Architecture targets one LLM processor |
| Memory unit | Natural-language observations / reflections / plans | Main context vs external recall / archival |
| Control mechanism | Retrieval scoring + periodic reflection + hierarchical planning | Function-mediated paging, `request_heartbeat` chains |
| Evidence type | Interview believability, two-day social simulation | DMR accuracy, Nested KV multi-hop lookup |

> **Huahua's engineering note**
>
> When someone says "the agent has memory," ask whether it is **one** window pager or **many** diaries plus social interaction. This paper is the latter; MemGPT is the former. A product may stack both; the papers' evidence is not interchangeable.

![Generative Agents paper Figure 5: perceptions write to the memory stream; retrieval conditions actions; reflection and plans write back.](/paperReading/36-generative-agents-interactive-simulacra/paper/figure_architecture2.webp)

*Figure 5, paper Section 4: agents perceive the environment; all perceptions land in the memory stream; retrieved memories condition actions and produce reflections and plans. Locatable at [Figure 5](https://arxiv.org/html/2304.03442v2#S4.F5); asset [figure_architecture2.png](https://arxiv.org/html/2304.03442v2/figures/figure_architecture2.png). From arXiv HTML; page marked [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/).*

## Walk one example through the method

The following follows the Valentine's party narrative (Figure 4, Section 3.4) as one teachable path. Numbers come from the two-day simulation in Section 7.1, not an independent benchmark.

1. **Input:** The user only tells Isabella she wants a Valentine's Day party; another seed memory sets Maria's crush on Klaus. Smallville has 25 agents and locations such as Hobbs Cafe (Figure 2).
2. **Intermediate representation:** Isabella's plans, invitations, decorating, and help requests become observations in her stream; conversants write "there is a party" into their own streams. Information diffuses through dialogue—after two days, agents who know about the party rise from **1 (4%) to 13 (52%)**, with authors checking the memory stream to rule out pure fabrication.
3. **Model or system decision:** Invited agents must hear, decide to attend, and arrive at the right place and time. Twelve were invited; **five attended**; interviews with no-shows cite schedule conflicts or interest without a concrete plan.
4. **Output:** At 5 p.m. on February 14, five agents appear at Hobbs Cafe (including Klaus and Maria); invitations and flirtation were architecture-initiated, not hand-scripted.
5. **Likely failure point:** Missing invitation memories, wrong locations, or instruction-tuning politeness that over-accepts others' suggestions (Section 7.2)—the party still happens, but attendance and tone are boundary signals.

![Generative Agents paper Figure 4: from one seed intent to throw a Valentine's party, agents invite, decorate, and gather.](/paperReading/36-generative-agents-interactive-simulacra/paper/figure_valentine3.webp)

*Figure 4, paper Section 3.4: one agent starts with a party intent; despite many failure points, a party occurs with multiple interactions. Original at [Figure 4](https://arxiv.org/html/2304.03442v2#S3.F4). From arXiv HTML; [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

## Technical mechanism

### Memory stream and retrieval

All observations live as natural-language objects in the stream. Retrieval scores candidates with:

$$\text{score} = \alpha_{\text{recency}} \cdot \text{recency} + \alpha_{\text{importance}} \cdot \text{importance} + \alpha_{\text{relevance}} \cdot \text{relevance}$$

Implementation notes (Section 4.2):

- **Recency:** exponential decay over sandbox game hours since last retrieval; decay factor **0.995**.
- **Importance:** LLM integer 1-10 when the memory is created (e.g., tidying a room **2**, asking a crush out **8**).
- **Relevance:** cosine similarity between query and candidate embeddings.
- All three are **min-max normalized to [0,1]**; paper uses **α = 1** for each; top memories fill the context window.

![Generative Agents paper Figure 6: the memory stream and the retrieved subset that conditions behavior.](/paperReading/36-generative-agents-interactive-simulacra/paper/figure_retrieval2.webp)

*Figure 6, paper Section 4.2: many observations on the left; retrieval ranks party-related memories for a question on the right. Original at [Figure 6](https://arxiv.org/html/2304.03442v2#S4.F6). From arXiv HTML; [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

### Reflection

When the sum of importance scores for recent perceptions exceeds **150** (roughly **two to three times per day**), the agent reflects: the LLM proposes questions, then synthesizes higher-level statements written back to the stream (Figure 7). Reflections are retrievable like any observation.

![Generative Agents paper Figure 7: Klaus's reflection tree; leaf observations synthesize upward into self- and other-inferences.](/paperReading/36-generative-agents-interactive-simulacra/paper/figure_reflection6.webp)

*Figure 7, paper Section 4.2: leaf observations synthesize into inferences such as Klaus being highly dedicated to research. Original at [Figure 7](https://arxiv.org/html/2304.03442v2#S4.F7). From arXiv HTML; [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

### Planning

The agent first drafts **five to eight** coarse day chunks, then recursively refines location-timed entries (Section 4.3). Plans enter the stream and participate in retrieval so behavior stays coherent across hours; the agent can replan when the environment changes.

### Smallville implementation

Twenty-five agents each get a one-paragraph persona as seed memory (Section 3.1); the world is a tree of areas and objects (Figure 2). Users can rewrite object state in natural language (e.g., a burning stove); agents perceive and react on the next tick.

## How to read the evidence

### Interview ablations: are components necessary?

**Question:** Do observation, reflection, and planning raise in-character believability?

**Controls:** After two simulated days, natural-language "interviews" probe five areas (self-knowledge, memory, planning, reacting, reflecting) with five questions each. One hundred participants watch a replay plus the memory stream and rank five conditions: full architecture, no reflection, no reflection or planning, crowdworker-authored, and no memory/reflection/planning (prior LLM-only baselines such as Park et al. 2022).

**Observation (Figure 8):** TrueSkill μ full **29.89** > no reflection **26.88** > no reflection/planning **25.64** > crowdworker **22.95** > full ablation **21.21**. Versus full ablation, Cohen's **d = 8.16**. Kruskal-Wallis **H(4) = 150.29, p < 0.001**; Dunn post-hoc tests show most pairwise gaps are significant; **crowdworker vs full ablation** is not.

**Explanation:** Removing each memory-control layer lowers ranked believability—supporting causal contribution of the architecture, not just a bigger model.

**Boundary:** Crowdworkers are not expert gold; interviews isolate single agents, not production multi-tenant load.

![Generative Agents paper Figure 8: full architecture beats ablations and the crowdworker baseline on TrueSkill μ.](/paperReading/36-generative-agents-interactive-simulacra/paper/figure_rank_score_comparison4.webp)

*Figure 8, paper Section 6.5: conditions on the horizontal axis, TrueSkill μ on the vertical axis. Original at [Figure 8](https://arxiv.org/html/2304.03442v2#S6.F8). From arXiv HTML; [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

### Two-day open simulation: emergent social behavior

**Question:** Over two continuous game days, do diffusion, relationships, and coordination appear?

**Controls:** Only **one** agent initially knows the mayoral run (Sam) and **one** knows the party (Isabella); end-of-run interviews with all 25 agents, cross-checked against memory streams.

**Observation (Section 7.1.2):**

| Measure | Result |
| --- | --- |
| Know mayoral candidacy | **4% → 32%** (1→8 agents) |
| Know Valentine's party | **4% → 52%** (1→13 agents) |
| Mutual-knowledge network density η | **0.167 → 0.74** |
| Relationship hallucination rate | **1.3%** (6/453) |
| Party attendance | 12 invited, **5 attended** |

**Explanation:** Qualitative traces plus interview labels support "information spreads, ties form, some coordination happens"; the Valentine's chain quantifies Figure 4.

**Boundary:** Two days, 25 agents, one map; attendance is far below 100%; the paper reports high simulation cost.

## Limitations and threats to validity

1. **Retrieval is a single point of failure:** missed relevant memories and fabricated embellishments dominate errors (Sections 6 and 7.2).
2. **Sandbox norms are hard to specify in natural language:** single-occupancy bathrooms treated as shared, entering stores after 5 p.m. closing (Section 7.2).
3. **Instruction-tuning side effects:** overly formal, overly agreeable dialogue (Section 7.2).
4. **Cost and scale:** 25 agents for two days costs "thousands of dollars" in tokens and "multiple days" (Section 8.2)—not a real-time product backend as-is.
5. **Not MemGPT / Letta:** no main/external function-paging evidence; **do not** import DMR 92.5% or product SLAs.
6. **Not Reflexion:** reflection happens inside one simulation timeline's stream, not across trial resets with a short buffer.
7. **Robustness under-tested:** prompt and memory hacking are discussed in Section 8.2, not empirically cleared.

## Engineering decision and when not to use it

When is this paper worth borrowing? Social prototyping, game NPC crowds, or multi-agent simulation where agents must remember interaction, reflect, and plan under retrieval—and you accept LLM cost and believability evaluation instead of a single accuracy metric.

When should you not treat it as a blueprint?

- Single-agent long chat or documents that overflow the window → read [MemGPT](/en/paper-reading/28-memgpt-context-as-memory-paging/), not this note.
- Learning from failure across episodes → read [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/).
- Thought-action-observation inside one trial → read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/).
- Hierarchical memory construction → read the later [xMemory](/en/paper-reading/06-Beyond-RAG-for-Agent/).
- Durable runtime with permissions and rollback → read [Argus](/en/paper-reading/10-argus-agentic-runtime/).

> **Huahua's judgment**
>
> Treat Generative Agents as the sandbox believability memory-stream textbook—not a validated enterprise multi-tenant memory platform. Bad retrieval makes the whole town confidently wrong together.

## Artifacts and reproducibility

Direct endpoint status as of 2026-08-28:

- **Paper:** [arXiv abs](https://arxiv.org/abs/2304.03442), [v2 PDF](https://arxiv.org/pdf/2304.03442v2), and [HTML](https://arxiv.org/html/2304.03442v2) are readable; UIST DOI [10.1145/3586183.3606763](https://doi.org/10.1145/3586183.3606763).
- **Demo:** [reverie.herokuapp.com/UIST_Demo/](https://reverie.herokuapp.com/UIST_Demo/) as linked in the paper; **verify in a browser** (Heroku free tier may sleep).
- **Code:** [github.com/joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents) is public; reproducing 25×2-day simulation needs ChatGPT API spend at paper scale—not a lightweight one-click rerun.
- **Minimal useful reproduction:** feed one agent a few observations, manually rank by recency/importance/relevance, and check whether top-k includes the expected party or name; or run one interview question with vs without reflection. That validates mechanism direction only—not μ=29.89.

## Three things to remember

1. **Technical idea:** Multi-agent sandbox believability uses a memory stream plus periodic reflection and retrieval-conditioned planning—not single-agent OS context paging.
2. **Evidence:** Figure 8 ablation ladder μ 29.89→21.21; two-day run 4%→52% party diffusion, density 0.167→0.74, 5/12 attendance.
3. **Boundary:** Sandbox plus costly LLM; retrieval and fabrication are main failures; do not mix MemGPT DMR or Letta/xMemory numbers into these tables.

## Next reading

This note covers how memory supports planning and social behavior among many agents in a sandbox. For single-agent window paging, read [MemGPT](/en/paper-reading/28-memgpt-context-as-memory-paging/); for across-trial verbal reflection, read [Reflexion](/en/paper-reading/27-reflexion-verbal-reinforcement/); for thought-action interleaving, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). The [reading map](/en/blog/91-agent-method-foundation-reading-map/) shows the full relationship among these methods.

## Primary sources

- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior," UIST 2023](https://doi.org/10.1145/3586183.3606763)
- [arXiv:2304.03442 v2](https://arxiv.org/abs/2304.03442)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2304.03442v2)
- [Public simulation repository](https://github.com/joonspk-research/generative_agents)
- [UIST demo link (as stated in paper)](https://reverie.herokuapp.com/UIST_Demo/)
