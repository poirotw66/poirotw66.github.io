---
title: "HumanLayer: The Skill Issue of Coding Agents—Practical Implementation of Five Types of Harness Configurations"
description: "In-depth read of HumanLayer's long article: Failure is often a configuration issue, not a model one. Clarifying AGENTS.md, MCP, Skills, Sub-agents, Hooks, and back-pressure, and responding to ETH research and post-training overfitting debates."
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "In-depth read of HumanLayer's long article: Failure is often a configuration issue, not a model one"
  - "Clarifying AGENTS"
  - "md, MCP, Skills, Sub-agents, Hooks, and back-pressure, and responding to ETH research and post-training overfitting debates"
audience:
  - "Enterprise AI / platform engineers and technical leads"
  - "Decision-makers who need deployable architecture, governance, and risk trade-offs"
category: "Enterprise AI"
tags: ["AI Agent","Enterprise AI","Harness Engineering","Codex","Claude"]

image: "/blog/21-humanlayer-skill-issue-harness/title_image.webp"
showToc: true
---
The HumanLayer team has repeatedly seen the same pattern in a large number of **enterprise-grade brownfield** projects: Agents ignoring instructions, running dangerous commands without confirmation, getting stuck on simple tasks—and the first reaction is always "wait for GPT-6". Their conclusion aligns with [Hashimoto 16](/en/blog/16-mitchell-hashimoto-harness-origin/): **It's mostly a configuration (Harness) issue, not a model intelligence issue**—the so-called **Skill Issue** (a problem with skills/configuration, not that the model isn't smart enough).

```
coding agent = AI model(s) + harness
```

Skills, MCP, Sub-agents, Memory, and AGENTS.md seem scattered on the surface, but they are actually the same **configuration surface**—the runtime/peripheral equipment of the Agent. This article wraps up Phase 2 of the [Reading Map 13](/en/blog/13-harness-engineering-reading-map/) (list **#10**), narrowing down the strategy of [Playbook 20](/en/blog/20-ignorance-ai-harness-playbook/) into **five actionable knobs**.

> **Huahua in one sentence**
>
> Sometimes when an agent is stupid, it's not because it's not smart, but because you didn't set the environment properly! By adjusting the five setting knobs, you can cure its "skill problem"~🐈‍⬛🔧
>
> **Huahua's engineering note**
>
> When the Agent frequently fails or ignores instructions, please first check the system configurations such as Skills, MCP, and Back-pressure, and consider whether the problem is caused by the Harness configuration rather than directly blaming it on the model capability.

Original Source:
**HumanLayer. Skill Issue: Harness Engineering for Coding Agents.**
URL: <https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents>

### Background: Why "Changing the Model" Often Treats Symptoms, Not Causes

Typical pain points in enterprise repos:

| Symptom | Often Misjudged As | More Often Is |
|------|------------|--------|
| Claiming completion without running tests | Model is lazy | No back-pressure/hook |
| Recklessly using dangerous shell commands | Model is reckless | No Stop hook/permission boundaries |
| Cannot find the correct API | Model is dumb | AGENTS is too long or outdated; MCP clutters context |
| Stuck on simple grep tasks | Needs stronger reasoning | Context has entered the dumb zone |

HumanLayer defines **Harness Engineering** as: Systematically improving **output quality and reliability** by leveraging these configuration points. It is a subset of **Context Engineering** (Dex Horthy's "12-factor agents")—the latter covers broader agent reliability; Harness focuses on **managing the context window of coding agents**.

The core five questions (from the original text):

1. How to add capabilities?
2. How to teach repo knowledge not present in training data?
3. How to add **determinism** beyond `CRITICAL: always…`?
4. How to adapt to one's own codebase?
5. How to prevent the context from being cluttered with garbage?

The following expands based on **AGENTS → MCP → Skills → Sub-agents → Hooks → back-pressure**.

### Core Concept 0: Post-training Bound Harness or Custom Harness?

Frontier coding models often post-train on a **specific Harness**:

- Claude ↔ Claude Code ecosystem
- GPT-5 Codex ↔ Codex harness (e.g., tight coupling with `apply_patch`; OpenCode needs a compatibility layer)

Some deduce "it's best to use the original factory Harness." HumanLayer sees **both sides**:

| Argument | Details |
|------|------|
| Go with original | The model might run smoother on the "interface seen during training" |
| Risk of overfitting | [Terminal Bench](/en/blog/15-langchain-agent-harness-anatomy/): Opus 4.6 is around **#33** in Claude Code, but jumps to around **#5** when changing Harness (also cited by Schmid/LangChain) |

**Conclusion**: It is still worth engineering a Harness for **your repo**, rather than relying entirely on defaults—especially for brownfield, internal tools, and compliance boundaries. Parallel to [Schmid 18](/en/blog/18-phil-schmid-agent-harness-2026/)'s "build to delete": What you customize are **rules and feedback**, not eternal, heavy orchestration.

### Core Concept 1: CLAUDE.md/AGENTS.md — Write It First, But Write It Right

These files **deterministically inject** into the system prompt. HumanLayer, Matt Pocock, and others emphasize: **Brief, universally applicable, and progressive disclosure**.

#### The ETH Zurich Study (138 agentfiles) is often cited to say "it's useless"

HumanLayer's interpretation is: **The study subjects are inconsistent with best practices**, it's not "never write them":

| Research Findings | Existing HumanLayer Advice |
|----------|----------------------|
| LLM-**generated** agentfiles are harmful, token **+20%** | Do not auto-generate; refine manually |
| Only **~4%** written by humans are helpful | **Less is more**; their own is **<60 lines** |
| Directory overviews are not helpful | Minimize fluff that the Agent can `ls`/explore on its own |
| Too many conditional rules | Keep it **universally applicable**; put edge cases in skills or docs |

This **does not contradict** [OpenAI 11](/en/blog/11-harness-engineering/)'s "AGENTS as an index", [Playbook 20](/en/blog/20-ignorance-ai-harness-playbook/)'s "update after every mistake", or [Hashimoto 16](/en/blog/16-mitchell-hashimoto-harness-origin/)'s "every line corresponds to a failure"—the difference lies in **quality, length, and update cadence**.

#### Practical Advice

- Root directory AGENTS: **build, test, things not to do, links to deeper docs**
- Specific API examples, Linear/Jira usage → **Skills or subdirectory md files**, loaded on demand
- When the Agent makes a mistake → **update AGENTS or add a hook**, don't just blame the model

### Core Concept 2: MCP — Give Tools, But Don't Clutter Context

MCP is mainly used to **expand tools**; the cost is that **tool descriptions go into the system prompt**.

| Risk | Description |
|------|------|
| Prompt injection surface | Untrusted MCP = malicious descriptions/instructions |
| Local `npx`/`uvx` servers | Could execute arbitrary code |
| **Too many tools** | Context gets stuffed with descriptions → enters the **dumb zone** faster (Chroma context rot study) |

Anthropic's direction: **MCP tool search**—progressively disclose tools, rather than dumping them all at once.

**Overlapping CLI capabilities**: If GitHub, Docker, DB, etc. already have mature CLIs, it's often better to **just write six examples in AGENTS** + let the Agent use `grep`/`jq`, which saves tokens compared to giant MCP schemas.

#### HumanLayer Case: Linear MCP → Thin CLI

- Removed bloated Linear MCP
- Provided **thin CLI** + **six** usage examples in CLAUDE.md
- Saved a massive amount of tool definition and verbose API response tokens

This is a specific decision tree for **"the existence of a tool ≠ must use MCP"**.

### Core Concept 3: Skills — Reusable Knowledge (Progressive Disclosure)

**Skills** = `SKILL.md` loaded on demand (can bundle CLIs, templates, sub-md files).

What it solves:

- Stuffing everything into the system prompt → blows up the **instruction budget**
- Multiple domains in the same repo (payments, auth, deploy) → split into skills, main Agent decides when to read

Note:

- **Malicious skills have appeared in the Skill registry**—audit them like `npm install`
- Can bundle multiple md files, guided by the main SKILL on when to read them
- Tools need to be distributed as **CLIs/executables**; you can't just package MCP directly inside a skill file

Related to [Fowler 14](/en/blog/14-martin-fowler-harness-engineering-review/)'s feedforward guides: Skills are **lazy-loaded guides**.

### Core Concept 4: Sub-agents — For Context Isolation, Not Roleplay

"Frontend/Backend Sub-agent **personas**" are **not useful** in HumanLayer's experience. What is useful is a **context firewall**:

```text
Parent Agent (Planning, Integration)
    │
    ├─► Sub-session: Heavy grep, file reading, intermediate tool output
    │
    └─► Parent only receives: Concise conclusions + filepath:line or URLs (progressive disclosure)
```

Echoing **context rot**: The longer the context, the worse the performance; irrelevant tool outputs are noise. **Lengthening the context window** often just enlarges the haystack.

| Dimension | Advice |
|------|------|
| Cost | Parent Opus plans, child Sonnet/Haiku executes heavy greps |
| Harness without native sub-agents | MCP spawns sub-sessions; prevent "children spawning children" and timeouts |

Unlike [Carlini 17](/en/blog/17-anthropic-parallel-c-compiler-agents/)'s **16 containers fighting over the repo**: Sub-agents are **isolated within a single flow**, not parallel compilers with multiple writers.

### Core Concept 5: Hooks — Deterministic Control Flow

Claude Code **hooks** and OpenCode **plugins** (Codex doesn't have an exact equivalent yet) are similar to **git hooks**:

| Timing | What Can Be Done |
|------|------|
| Events | Auto-run scripts, notifications |
| Before/After Tool call | Append context, reject dangerous `Bash` |
| **Stop** | Run typecheck/build; feed failed stderr back to the Agent |

**Stop hook example (spirit)**:

- Run biome + turbo typecheck
- **If successful, remain completely silent** (do not dump 4000 lines of pass logs into the context)
- **Only be verbose with stderr on failure**; exit code allows the harness to continue the loop

This is in the same family as [Carlini 17](/en/blog/17-anthropic-parallel-c-compiler-agents/)'s test log design and [Fowler 14](/en/blog/14-martin-fowler-harness-engineering-review/)'s sensors.

Other uses: Automatically rejecting dangerous migrations, Slack/PR/preview environment integration.

### Core Concept 6: Back-pressure — Self-verification Beats Praying

The probability of success strongly correlates with **whether the Agent can verify its own work**:

| Mechanism | Function |
|------|------|
| typecheck/build | Especially effective in strongly-typed languages |
| unit/integration test | Behavioral correctness |
| coverage threshold | Stop hook can mandate adding tests |
| Playwright/agent-browser | UI/E2E |

**Key**: Verifying output also needs to be **context-efficient**—in the early days, full test passes were dumped into context → the Agent **hallucinated that it had fixed the issue**. Current best practice: **Silent on success, only speak on failure**.

Compared to [Playbook 20](/en/blog/20-ignorance-ai-harness-playbook/)'s slop threshold: back-pressure is **the first layer of automated bullshit detection**; human review is the second layer.

### What Doesn't Work, What Works (An Honest List)

**Use Less / Avoid:**

| Anti-pattern | Why |
|--------|------|
| Designing the "perfect Harness" without experiencing real failures | No source of feedback |
| Pre-installing a bunch of skills/MCP "just in case" | Dumb zone, attack surface |
| Running full 5+ minute tests per session | Context and cost |
| Over-tuning sub-agent permissions | Tool thrash |

**Works:**

| Practice | Why |
|------|------|
| Add configuration **after a failure** | Aligns with Hashimoto Step 5 |
| Hook **design—test—discard most** | Keep only high signal-to-noise ratio |
| Repo-level configurations **shared across the team** | Compound interest |

With [Fowler 14](/en/blog/14-martin-fowler-harness-engineering-review/): **Bias towards shipping, rather than Harness hoarding**.

### Cross-reference with the Entire Series (PRD-001 End State)

| Phase | Article | Relation to This Piece (21) |
|-------|------|----------------|
| Index | [13 Reading Map](/en/blog/13-harness-engineering-reading-map/) | #10 In-depth read |
| Phase 1 | [10](/en/blog/10-effective-harnesses-for-long-running-agents/), [11](/en/blog/11-harness-engineering/), [14–16](/en/blog/14-martin-fowler-harness-engineering-review/) | Theory and organizational cases |
| Phase 2 | [17–20](/en/blog/17-anthropic-parallel-c-compiler-agents/) | Stress testing, strategy, popularization, playbook |
| **Phase 2 Wrap-up** | **This Piece (21)** | **Out-of-the-box configuration manual** |

Internal site #1 (OpenAI narrative) and #4 (Anthropic long tasks) are already covered by 11 and 10 respectively; the ten external in-depth reads in 13 can be marked as **completed**.

### Takeaways and Recommendations (Team Implementation Sequence)

1. **Measure baseline**: Same task, same model, only change the harness, observe success rate and tokens (echoing 15, 18).
2. **AGENTS <60 lines** + error-driven updates; deep articles go in `docs/`.
3. **Audit MCP list**: If a CLI works, don't use MCP; use tool search/thin wrappers when necessary.
4. **Split Skills by domain**, prohibit unvetted third-party skills.
5. **Stop hook + silent success** comes before "adding another QA Sub-agent".
6. **Sub-agents are only for isolating context**, not for job title cosplay.
7. **Assign a harness owner** (echoing 20) to maintain the aforementioned knobs.

### Conclusion

HumanLayer's title **Skill Issue** is a pun: it's not an insult to the model, but a reminder that **the skill tree points belong in the configuration surface**. Five types of knobs + back-pressure break down the "building environments" from the [Ignorance Playbook](/en/blog/20-ignorance-ai-harness-playbook/) into **repo files and hooks you can change tomorrow**. If you can only read one article from Phase 2 as a manual, **21 is the closest to a daily driver**; if you want strategy and industry convergence, start with [18](/en/blog/18-phil-schmid-agent-harness-2026/) and [20](/en/blog/20-ignorance-ai-harness-playbook/).

### Series Guide

- [Reading Map 13](/en/blog/13-harness-engineering-reading-map/)
- [20 Ignorance Playbook](/en/blog/20-ignorance-ai-harness-playbook/) · [19 Parallel.ai Explained](/en/blog/19-parallel-ai-what-is-agent-harness/)

Original Source:
**HumanLayer. Skill Issue: Harness Engineering for Coding Agents.**
URL: <https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents>
