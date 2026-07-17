---
title: "Ignorance.ai Playbook: The Converging Harness Practices of OpenAI, Stripe, and OpenClaw"
description: "An in-depth review of the February 2026 horizontal roundup: an engineer's work splitting into 'building the environment' and 'managing Agents', architecture as guardrails, tools as feedback, AGENTS.md as system records, and the separation of planning and execution."
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "An in-depth review of the February 2026 horizontal roundup: an engineer's work splitting into 'building the environment' and 'managing Agents', architecture as guardrails, tools…"
  - "md as system records, and the separation of planning and execution"
audience:
  - "Enterprise AI / platform engineers and technical leads"
  - "Decision-makers who need deployable architecture, governance, and risk trade-offs"
category: "Enterprise AI"
tags: ["AI Agent","Enterprise AI","Harness Engineering","Architecture Patterns","Codex"]
image: "/blog/20-ignorance-ai-harness-playbook/title_image.webp"
---
In February 2026, **Ignorance.ai** (Charlie Guo) published a horizontal roundup: despite **the OpenAI internal restructuring, Peter Steinberger (OpenClaw), and Stripe Minions** having completely different scales and risk tolerances, they have highly converged on **Harness Engineering**. This is not a single company's engineering memo, but rather a playbook that can be cross-referenced, documenting **how an engineer's work splits, how environments are designed, and how management evolves** in the era of the "Agent Fleet."

If [OpenAI 11](/blog/11-harness-engineering/) is a deep-dive case study, and [Hashimoto 16](/blog/16-mitchell-hashimoto-harness-origin/) is about naming and line-by-line AGENTS, this article is for those who, after finishing Phase 1, ask: **What does the industry's common language look like?** This article is Phase 2 (List **#9**) of the [Reading Map 13](/blog/13-harness-engineering-reading-map/).

---

Original Source:  
**Ignorance.ai (2026). The Emerging "Harness Engineering" Playbook.**  
URL: <https://www.ignorance.ai/p/the-emerging-harness-engineering>

---

### Background: From Demo to Production-Grade Agent Fleet

The author previously described the evolution of tools: **Copilot → Chat → Agent → Background Agent → Agent Fleet**, with each step faster than the last. The qualitative change in recent months is that **entire teams are restructuring around Agents**, rather than just individuals trying new tools.

Greg Brockman (2026) relayed: Engineers inside OpenAI have stated that, since a certain point, the **nature of their work has changed**—previously, Codex mostly wrote unit tests; today, **almost all coding and a massive amount of operations/debugging** is done by Agents. For those who haven't caught up, the bottleneck is often the **environment and processes**, not the ceiling of model capabilities.

#### Three Anchor Points (For calibrating magnitude, not exact audits)

| Entity | Phenomenon (Original Text) | Interpretation |
|------|----------------|------|
| **Peter Steinberger / OpenClaw** | Over **6600+ commits** per month; often **5–10** Agents running simultaneously; code can be **shipped without reading line-by-line** | Extreme individual practice; humans act as "benevolent dictators" for architecture |
| **OpenAI Squad** | **3** engineers, **5** months, ~**1 million lines**, intentionally **zero hand-written code**; ~**3.5 PRs/day** per person and still growing with headcount | Internal product; harness built from scratch |
| **Stripe Minions** | **1000+** merged PRs per week; drop a task in Slack → Agent writes code, passes CI, opens PR | Enterprise-grade brownfield + heavy toolchain |

**Common Conclusion**: The bottleneck is usually not "can the model write code?", but rather **structure, tools, and feedback**—consistent with OpenAI 11. Although the three cases have different risk tolerances (open-source experiment vs. internal tool vs. payment-grade production), they converge on the same points, making the **signal even stronger**.

---

### Core Concept 1: The Engineer's Work Splits in Half (and happens concurrently)

Echoing the shift "from maker schedule to manager schedule," but more granularly:

#### Half A: Building the environment (Building the harness)

The OpenAI team expressed: When Codex gets stuck, the question isn't "try tweaking the prompt again," but rather:

> **What capability/structure/feedback is the environment missing that would allow the Agent to reliably proceed?**

This includes: architectural boundaries, linters, CI, file systems, and observability tools—which is exactly [Hashimoto 16](/blog/16-mitchell-hashimoto-harness-origin/)'s **"Agent makes a mistake → engineer it so it doesn't happen again."**

#### Half B: Managing the work

- Steinberger: **Extensive planning followed by execution**; acts as an architectural gatekeeper on OpenClaw, discussing only architecture in Discord, not line-by-line code.  
- Brockman: Each team appoints an **agents captain** to think about how Agents fit into workflows.  
- The author himself: After Codex App changed his rhythm, his time shifted from **implementation** to **scoping, directing, and reviewing**.

#### Coupling of the Two Halves

It is **not** "build the harness first, then manage the Agents." Both happen **simultaneously**:

- Agent fails → exposes an environment gap → patch the harness  
- The better the harness → the lower the management friction → the more parallel sessions can run  

Cross-referencing [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/): guides (feedforward) and sensors (feedback) must be used together; you can't just write AGENTS without validation.

---

### Core Concept 2: Building the Harness—Four Recurring Practices

#### 2.1 Architecture as guardrails

**OpenAI** (From the Harness Engineering post, cited by Playbook):

- Strict **layered domain models**; dependency directions and edges are mechanically enforced by **Codex-generated linters + structural tests**.  
- Rules that are "nagging" in human processes become a **multiplier** in the Agent world—code it once, apply it everywhere.

**Birgitta Böckeler** (Fowler's site): To increase trust in AI-generated code, we might need to **narrow the solution space** rather than expand the prompt—in the future, we may choose tech stacks that are **best suited for harnessing**, rather than the most flexible ones.

**Stripe**:

- **Pre-warmed devbox**—a development environment identical to human setups, but isolated from production/the external internet.  
- **400+** internal tools accessed via **Toolshed (MCP)**—Agents need **the same context and tool surface as humans**, not an API patched on as an afterthought.

| Organization | Form of Guardrails |
|------|----------|
| OpenAI Squad | Layering + mechanical linters |
| Stripe | Isomorphic devbox + tool parity |
| General Teams | ArchUnit, module boundaries, prohibiting cross-layer imports |

#### 2.2 Tools are both foundation and feedback (Tools)

Brockman suggests:

> Maintain a **list of tools** the team relies on, and assign an owner so Agents can access them (CLI/MCP).

Tools **don't just expand capabilities**—with linters, tests, and browser automation, humans gain confidence in **every diff**. The author experienced this firsthand: explicitly instructing Codex to run certain linters/tests before committing significantly increased confidence.

**OpenAI's Advanced Approach (Called one of the smartest points by Playbook)**:

- **Linter error messages = fix guidelines**—when an architectural rule is violated, the message doesn't just flag it; it **teaches the Agent how to fix it**.  
- Tools **teach the Agent during the work process** (Fowler's sensor signals designed for LLMs).

Brockman added: **Fast tests + high-quality component interfaces**—letting the Agent assemble within boundaries, rather than wiring things haphazardly.

#### 2.3 Documentation is the system record (Documentation)

**AGENTS.md** (The agents.md consensus): A README for the Agent—build, test, conventions, architecture, and gotchas. Claude Code still defaults to `CLAUDE.md`, causing slight friction in the ecosystem.

**Key Usage** (Brockman + Hashimoto):

- **Update it every time an Agent makes a mistake**—don't write it once and let it rot.  
- Hashimoto's Ghostty example: **Every line corresponds to a past agent failure** that is now prevented.

**OpenAI's Extension**:

- A short **AGENTS.md points to** a deep source of truth in `docs/` (design, architecture diagrams, execution plans, quality grading).  
- **Background Agents do doc gardening**—documentation is maintained by Agents, opening PRs to clean up outdated content (consistent with 11).

**Anthropic's Long Tasks** (Playbook echoing [10](/blog/10-effective-harnesses-for-long-running-agents/) from another angle):

- Progress files, feature lists; even **JSON tracking**, which is harder for Agents to mess up compared to Markdown—like **a handover between engineers who have never met**.

#### 2.4 Planning is the new "writing code" (Planning)

Industry consensus: **Written plans first, reviewed by a human, before execution**. Most coding tools already have a **Plan mode**.

**Cloudflare's Boris Tane** (Cited by Playbook):

> Separating planning from execution is the **single most important** thing I did—it saves tokens, preserves architectural decision power, and reduces wasted effort.

**Anthropic initializer** ([10](/blog/10-effective-harnesses-for-long-running-agents/)):

- Generates **200+** features from a high-level prompt, each containing test steps, initially all marked as **failing**—preventing one-shot attempts or premature claims of completion.

The author's feeling: After Codex App upended his daily routine, **the most important work happens before any code is written**.

---

### Core Concept 3: Becoming an AI Manager—Three Daily Skills

#### 3.1 Say no to slop

Brockman's 5th point:

> Merged code still needs a human owner; the review standard should be **at least** identical to human-written code.

When Agents open PRs faster than you can review them, the temptation is to **lower the bar**—sources unanimously oppose this.

Although Steinberger doesn't read line-by-line, he **deeply cares about architecture and scalability**—acting as OpenClaw's architectural gatekeeper, and only discussing major decisions on Discord with contributors. The Playbook uses a **master carpenter/apprentice** analogy: you are hiring for the **finished product and taste**, not necessarily for them to manually saw the wood.

The author calls this **bullshit detection**—the higher the output volume, the more it is needed: is it too clever? will it be hard to maintain in six months? is the abstraction level correct?

#### 3.2 Orchestration, not just delegation

| Mode | Who is doing it | Characteristics |
|------|--------|------|
| **Attended concurrency** | Steinberger, the author | 5–10 or 3–4 sessions; human continuously redirects |
| **Unattended concurrency** | Stripe Minions | Drop task in Slack and leave; human only intervenes at review |

Unattended mode requires a **much heavier harness** (Toolshed, devbox, CI)—most teams aren't there yet. The intermediate state: **attended for complex tasks, unattended for clearly scoped tasks**.

Cross-referencing [Carlini 17](/blog/17-anthropic-parallel-c-compiler-agents/): 16 parallel containers is an extreme attended + locked-task design; Stripe is productized unattended.

---

### Core Concept 4: Four Open Questions That Remain Difficult

The Playbook honestly lists areas where there is **no convincing consensus yet**:

1. **Functionally correct but hard-to-maintain code (entropy)**  
   Brockman's closing question: How do we prevent slop from seeping in through different forms? OpenAI started using **GC agents** to sweep for inconsistencies—still emerging.

2. **Behavioral validation gaps**  
   Böckeler critiques Harness articles: they lack **functional/behavioral** validation. Anthropic's long-task research: Agents often **mark tasks as complete without E2E testing**; browser automation has a **jagged frontier** (e.g., Puppeteer cannot see native alerts).

3. **Brownfield retrofitting**  
   Most success stories are **greenfield** or built with a harness from scratch. A ten-year-old codebase, lacking architecture, with sparse tests—is like running static analysis for the first time: a **flood of alarms**. How to harness a brownfield remains open.

4. **Cultural adoption**  
   It won't happen automatically—it requires someone to build the harness, define processes, and iterate. **The good news**: The investment compounds—every AGENTS update, every linter tutorial, and every MCP tool accelerates subsequent tasks.

---

### Comparison with Phase 1 / Phase 2 Series

| Article | Position in the Playbook |
|------|-------------------|
| [OpenAI 11](/blog/11-harness-engineering/) | Million lines, AGENTS as directory, GC, layering |
| [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/) | Constraining the solution space, guides/sensors |
| [LangChain 15](/blog/15-langchain-agent-harness-anatomy/) | Component map, Terminal Bench |
| [Hashimoto 16](/blog/16-mitchell-hashimoto-harness-origin/) | Harness naming, error-driven AGENTS |
| [Schmid 18](/blog/18-phil-schmid-agent-harness-2026/) | 2026 Strategy, build-to-delete |
| [Parallel 19](/blog/19-parallel-ai-what-is-agent-harness/) | Definition and the five-step loop |
| [HumanLayer 21](/blog/21-humanlayer-skill-issue-harness/) | Tactical checklist for configuration |

The unique value of the Playbook: **Synthesizing cases into a checklist**, making it easy to self-assess "are we missing environment building, work management, or validation?"

---

### Takeaways and Recommendations (Actionable)

1. **Roles**: Appoint a **harness owner** or **agents captain**; otherwise, the dividends of model upgrades will be consumed by environment debt.  
2. **Linters**: Error messages must **teach the Agent how to fix**, not just block CI.  
3. **AGENTS.md**: Keep it short, alive, and point to a deeper `docs/`; update it every time a mistake is made.  
4. **Plan mode**: Make it the team default, especially for architectural and cross-module changes.  
5. **Concurrency Strategy**: Strengthen the harness first before pushing for unattended; keep complex tasks attended.  
6. **Review**: Maintain the bar for slop; practice **high-abstraction reviews** (architecture, maintainability), not line-by-line spell checking.

---

### Summary

The Ignorance.ai Playbook documents a **discipline in the making**: an intertwining of software architecture, team management, and context engineering. Steinberger observed: People who love algorithmic puzzles have a harder time being agent-native; those who love **shipping products** adapt faster—"letting go of writing every line by hand" is itself an emotional cost.

For readers, the most practical takeaway from this article is **the two halves of work + four environment-building practices + three management skills + four open questions**—you can use a single table to cross-reference your own organization, and then decide whether next quarter's investment should be in linters, Toolshed-like integrations, or Plan/AGENTS discipline.

---

### Series Guide

- [Reading Map 13](/blog/13-harness-engineering-reading-map/)  
- [21 HumanLayer Skill Issue](/blog/21-humanlayer-skill-issue-harness/) · [19 Parallel.ai Explained](/blog/19-parallel-ai-what-is-agent-harness/)

---

Original Source:  
**Ignorance.ai (2026). The Emerging "Harness Engineering" Playbook.**  
URL: <https://www.ignorance.ai/p/the-emerging-harness-engineering>
