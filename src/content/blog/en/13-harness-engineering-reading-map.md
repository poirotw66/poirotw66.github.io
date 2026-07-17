---
title: "Harness Engineering Guide"
description: "The starting point for the Harness Engineering section on this site: concepts, a full series article index, and reading paths based on roles and scenarios."
pubDate: 2026-05-29
category: "Enterprise AI"
tags: ["Harness Engineering", "AI Agent", "Codex", "Anthropic", "Claude"]
image: "/blog/13-harness-engineering-reading-map/title_image.webp"
subtitle: "從這一頁進入 Bloss0m 的 Harness 專區——不必從部落格列表逐篇翻找。"
kind: guide
showToc: true
---
**Bookmark this page.** Later, when reading any Harness-related articles on Bloss0m, you can always return here to find links and the reading order.

---

## Build a Mental Model First

**Harness** = The execution environment wrapping everything outside the model: tools, memory, planning, validation, state handover, repository conventions, and feedback loops.  
**Harness Engineering** = Deliberately designing and maintaining this environment so that an Agent's failures become "repairable and preventable," rather than gambling on the next model version.

> **Agent = Model + Harness**  
> The model determines the upper limit of capabilities; the Harness determines **whether it can deliver stably** during long-running tasks, multi-turn interactions, and team collaboration.

In 2025, people often asked, "Are Agents usable?"; in 2026, the question is more often, "**Can you prove the system will finish running?**" All articles in this section answer the latter.

---

## Project Status

**All deep-dive articles for PRD-001 have been completed** (Updated 2026-06-03). The index article (this page) plus spec-002~009, totaling **8 deep-dive articles**, are all online; Phase 2 (blogs **17–21**), consisting of five articles, has also been published.

| Phase | Spec | Corresponding Blog | Status |
|------|------|-----------|------|
| Index | spec-001 | **13** This page | ✔️ Published |
| Phase 1 | spec-002~004 | **16** Hashimoto, **14** Fowler, **15** LangChain | ✔️ Published |
| Phase 2 | spec-005~009 | **17** Anthropic Parallel, **18** Phil Schmid, **19** Parallel.ai, **20** Ignorance.ai, **21** HumanLayer | ✔️ Published |

In addition, three **early Harness deep dives** (blogs **09–11**) were published prior to the PRD planning, are still listed in the index below, and are cross-linked with this series.

---

## Full Series Article Index (This Site)

Below is the **complete list for the Harness section** on Bloss0m (grouped by topic). Each article provides an interpretation in Traditional Chinese, with links to official or original sources at the end.

### Guide and Extensions

| Number | Article | Description |
|------|------|------|
| **13** | **This Page** — Harness Engineering Guide | The starting point of the section (you are here) |
| 09 | [Harness Design for Long-Running AI Engineering](/blog/09-harness-design-long-running-apps/) | Long-running **apps**: generation/evaluation division, QA contracts |

### Practical Application and Long Tasks (OpenAI · Anthropic)

| Number | Article |
|------|------|
| 11 | [Harness Engineering: Making Codex Observable and Transferable](/blog/11-harness-engineering/) |
| 10 | [Harnesses for Long-Running Agents: Stable Delivery Across Contexts](/blog/10-effective-harnesses-for-long-running-agents/) |
| 17 | [16 Parallel Claudes Building a C Compiler](/blog/17-anthropic-parallel-c-compiler-agents/) |

### Concepts, Reviews, and Frameworks

| Number | Article |
|------|------|
| 16 | [Mitchell Hashimoto: The Origins and Six Stages of the Harness](/blog/16-mitchell-hashimoto-harness-origin/) |
| 14 | [Martin Fowler: Control Loops and Trust](/blog/14-martin-fowler-harness-engineering-review/) |
| 15 | [LangChain: Anatomy of an Agent Harness](/blog/15-langchain-agent-harness-anatomy/) |
| 18 | [Phil Schmid: 2026 and Durability](/blog/18-phil-schmid-agent-harness-2026/) |
| 19 | [Parallel.ai: What is an Agent Harness](/blog/19-parallel-ai-what-is-agent-harness/) |

### Industry Convergence and Toolchain Implementation

| Number | Article |
|------|------|
| 20 | [Ignorance.ai: The Emerging Playbook](/blog/20-ignorance-ai-harness-playbook/) |
| 21 | [HumanLayer: Practical Configuration for Skill Issues](/blog/21-humanlayer-skill-issue-harness/) |

---

## Entry by Scenario (How to Choose Your First Article)

| Your Scenario | Suggested Starting Point |
|----------|----------------|
| Hearing about Harness for the first time, need to explain it to colleagues | [19 Intro](/blog/19-parallel-ai-what-is-agent-harness/) → Index below |
| Managing Codex / Claude Code, need to govern the repo | [11 OpenAI](/blog/11-harness-engineering/) → [21 HumanLayer](/blog/21-humanlayer-skill-issue-harness/) |
| Building long-running coding agents, cross-session | [10 Long Tasks](/blog/10-effective-harnesses-for-long-running-agents/) → [17 Parallel Stress Test](/blog/17-anthropic-parallel-c-compiler-agents/) |
| Looking for methodology, trust, and review logic | [16 Hashimoto](/blog/16-mitchell-hashimoto-harness-origin/) → [14 Fowler](/blog/14-martin-fowler-harness-engineering-review/) |
| Want to compare OpenAI / Stripe / individual extreme practices | [20 Playbook](/blog/20-ignorance-ai-harness-playbook/) |
| Long-running **products**, not just a single repo | Add [09 Long-Running Apps](/blog/09-harness-design-long-running-apps/) |

---

## Recommended Reading Paths (Three Options)

### Path A · The Fastest (2–3 Articles)

1. This guide page  
2. [11](/blog/11-harness-engineering/) or [19](/blog/19-parallel-ai-what-is-agent-harness/)  
3. To modify a repo immediately: [21](/blog/21-humanlayer-skill-issue-harness/)

### Path B · Systematic Engineering (Recommended)

[16](/blog/16-mitchell-hashimoto-harness-origin/) → [14](/blog/14-martin-fowler-harness-engineering-review/) → [10](/blog/10-effective-harnesses-for-long-running-agents/) + [15](/blog/15-langchain-agent-harness-anatomy/) → [20](/blog/20-ignorance-ai-harness-playbook/) → [21](/blog/21-humanlayer-skill-issue-harness/) → [17](/blog/17-anthropic-parallel-c-compiler-agents/), [18](/blog/18-phil-schmid-agent-harness-2026/) as needed

### Path C · Including Long-Running Apps

Path B plus [09](/blog/09-harness-design-long-running-apps/)

---

## Division of Labor with Similar Concepts

| Concept | In One Sentence |
|------|--------|
| Prompt engineering | How to give instructions in a single turn |
| Context engineering | How to construct, compress, and inject context |
| **Harness engineering** | The entire execution environment: tools, state, validation, handover, governance |
| Eval / benchmark | Proving how good it is; Harness makes every eval comparable and cumulative |

---

## How to Use This Guide

- **Entering from the blog list**: Open this page first, then follow the index to the deep dives.  
- **Entering from a specific deep dive**: If the article links to a "Guide," it refers to [this page](/blog/13-harness-engineering-reading-map/).  
- **To read the original English articles**: Please use the "Original Source" links at the end of each deep dive.  

**All eight deep-dive articles for PRD-001 (spec-002~009) have been completed**; if official sources publish important new articles, this guide's index will be updated, and individual deep dives will be revised accordingly.

---

## References

- Other topics on this site: [2026 New Rules for Startups and AI-Native Execution](/blog/12-the-founders-playbook/)  
- Site-wide search: [Search Page](/search/) (Can filter by Blog and the keyword `Harness`)
