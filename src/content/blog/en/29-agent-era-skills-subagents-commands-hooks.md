---
title: "Step into the Agent Era: Deconstructing the Four Core Pillars of Cursor / Claude Code / Codex"
description: "An in-depth analysis of the four Harness mechanisms of modern AI editors—Skills, Subagents, Commands, and Hooks. Clarify the actual configuration formats, trigger timings, and collaborative relationships of each platform, evolving from 'prompt engineering' to 'AI workflow architect'."
pubDate: 2026-06-24
category: "Technology"
image: "/blog/29-agent-era-skills-subagents-commands-hooks/title_image.webp"
tags: ["AI Agent", "Cursor", "Claude Code", "Codex", "Skills", "Subagents", "Commands", "Hooks", "Harness Engineering", "MCP"]
subtitle: "Skills、Subagents、Commands、Hooks——四個機制如何把「只會打字的 AI」變成「能獨當一面的高階工程師」"
kind: guide
showToc: true
---
## Introduction: From "Prompt Engineering" to the "Agent Ecosystem"

Entering 2026, if your impression of AI-assisted development is still stuck at "typing a Prompt in the dialog box, then copy-pasting the code," then you have underestimated the evolution of modern tools.

From **Cursor** (Agent / Composer mode), the terminal-native **Claude Code**, to OpenAI's **Codex** and various **MCP (Model Context Protocol)** tool ecosystems, modern AI editors have evolved from "semantic auto-completion tools" into Agent systems equipped with **autonomous planning, tool calling, and feedback loops**.

Using [LangChain's definition](/blog/15-langchain-agent-harness-anatomy/): **Agent = Model + Harness**. The model is responsible for reasoning; Harness is everything outside the model—prompts, tools, orchestration, safety valves, and project knowledge. What you configure in directories like `.cursor/`, `.claude/`, etc., is essentially engineering this Harness layer.

When studying these configuration files, you will repeatedly encounter four core terms: **Skills**, **Subagents**, **Commands**, and **Hooks**. They are not four independent features, but rather four knobs on the same **Harness configuration surface**—each solving a different problem, yet capable of linking together into a closed loop.

This article deconstructs these four major mechanisms one by one, from **workplace analogies**, **underlying logic**, to the **actual configuration formats of each platform**, and clarifies common misconceptions.

---

## What do the Four Mechanisms Solve in the Harness?

Before diving into the details, let's build a mental model with a table. Imagine AI is a newly onboarded senior intern: you need an SOP manual, an outsourced task force, shortcut commands, and an automated safety net.

| Core Concept | Workplace Analogy | Technical Essence | Core Problem Solved |
| :--- | :--- | :--- | :--- |
| **Skills** | An SOP manual consulted on-demand | Progressive Context injection | AI **lacks knowledge and process** for specific tasks |
| **Subagents** | Outsourced investigation task force | Context Isolation | The main conversation is **clogged with massive intermediate outputs** |
| **Commands** | One-click standard work orders | User-triggered Prompt templates | The team needs **repeatable, version-controlled** workflow entry points |
| **Hooks** | Access control and automated pipelines | Event Interceptors | Needs **deterministic** allowance, rejection, or post-processing |

> **Important Clarification:** These four are juxtaposed with **MCP** and **Rules / AGENTS.md**, but their responsibilities differ. MCP mainly extends **external tools**; Rules / AGENTS.md are global guidelines injected **permanently or conditionally**. Skills are domain knowledge loaded **on-demand**—the four complement each other, rather than replace one another.

---

## 1. Skills — The On-Demand Work Manual

### Workplace Analogy

A company's SOP knowledge base won't be crammed into an employee's head entirely on their first day. When the intern encounters specific tasks like "deployment," "writing PRs," or "running security reviews," they flip to the corresponding chapter to follow along. Skills are exactly this **chapter-divided, on-demand** manual.

### Underlying Logic

The traditional approach is to stuff all rules into the System Prompt or AGENTS.md, bringing two problems:

1. **Instruction budget explosion**: The context is filled with massive amounts of text, diluting the truly important information (Needle in a Haystack).
2. **High update costs**: Changes to SOPs in one domain might affect the entire global prompt.

Skills adopt **Progressive Disclosure**:

- Normally, only the `name` + `description` (minimal metadata) are kept for the Agent to judge "whether to read this skill".
- Only after determining relevance is the full `SKILL.md` body (and optionally `reference.md`, `scripts/`) injected into the context.
- The Agent can further read the attached files under the skill directory on-demand, rather than dumping everything at once.

This is consistent with [HumanLayer's Harness analysis](/blog/21-humanlayer-skill-issue-harness/): **Skills are reusable, lazy-loaded guides**, not another bloated AGENTS.md.

### Actual Configuration Format (Using Cursor as an Example)

Skills are stored in **directories**, with the core file being `SKILL.md`:

```
.cursor/skills/
└── production-deploy/
    ├── SKILL.md          # Required: Main instruction
    ├── reference.md      # Optional: Detailed reference
    └── scripts/
        └── smoke-test.sh # Optional: Executable script
```

In the frontmatter of `SKILL.md`, **only** `name` and `description` are required fields (there are also optional fields like `disable-model-invocation`):

```markdown
---
name: production-deploy
description: >-
  Deploy this project to production following team SOP. Use when the user
  asks to deploy, release, ship, or go live.
---

# Production Deploy SOP

When executing a deploy task, follow these steps strictly:

1. Run `npm run lint` and `npm run test`. Stop immediately on any failure.
2. Verify `.env.production` exists and required secrets are documented.
3. Build with `npm run build` only — do not use ad-hoc bundler flags.
4. After deploy, run the smoke test script in `scripts/smoke-test.sh`.
```

**Common Misconceptions Corrected:**

| Misconception | Actual Situation |
|------|----------|
| Skills are triggered by an array of keywords like `triggers: ["deploy"]` | Cursor Skills **do not** have an independent triggers field; triggering relies on `description` semantics + Agent judgment |
| A Skill is a single `.md` file | The standard format is the **`skill-name/SKILL.md` directory structure** |
| Skill equals Slash Command | Skills can be **automatically selected** by the Agent; Commands are **manually triggered by the user with `/`** (see below) |

### Storage Location

| Level | Path | Scope |
|------|------|----------|
| Project | `.cursor/skills/` | Version-controlled with repo, shared by the team |
| Personal | `~/.cursor/skills/` | Available across all projects |

Claude Code also has a similar skill mechanism (commonly found in `~/.claude/skills/` or plugin ecosystems); Codex's skill support varies by product version, but the design ethos of "on-demand loading of domain knowledge" is the same.

---

## 2. Subagents — Context Firewalls, Not Role-Playing

### Workplace Analogy

When a PM receives a massive task like "investigate the API usage across the entire codebase," they won't flip through every file themselves—instead, they dispatch a team of investigators to grep, read files, and organize, ultimately reporting back only the **conclusions and file locations**. The PM's desk remains clean to make the next decision.

### Underlying Logic

The Context window is limited, and research shows that the longer the context, the more likely the model's performance on critical information drops (**context rot**). When the Agent needs to:

- Extensively `grep` / read files / explore an unknown codebase
- Generate lengthy intermediate tool outputs

If all this remains in the main conversation, the main Agent's "effective attention" will be overwhelmed.

The core value of Subagents is **Context Isolation**:

```
[User Request]
      │
      ▼
[Main Agent — Plan, Delegate, Integrate]
      │
      ├──► [Subagent A: explore]  ──► Explore codebase in an isolated session
      ├──► [Subagent B: shell]    ──► Run diagnostic commands in an isolated session
      └──► [Subagent C: generalPurpose] ──► Write independent subtasks
      │
      ▼
[Main Agent only receives concise summaries from each subagent]
      │
      ▼
[Final result presented to the user]
```

In Cursor, Subagents are initiated via the **Task tool**, specifying the `subagent_type` (e.g., `explore`, `shell`, `generalPurpose`). The main Agent writes clear subtask prompts; the subagent executes in an **independent context**; upon completion, it returns a summary to the parent Agent.

### Three Practical Advantages

1. **Clean Context**: The parent Agent doesn't have to swallow the grep results of 50 files; it only receives "issue found in file X, line Y."
2. **Parallelizable**: Independent subtasks can be dispatched simultaneously (e.g., one checking the schema, another checking test coverage).
3. **Cost Tiering**: The parent Agent can use a stronger model for planning, while subagents use lighter models for extensive exploration (depending on platform support).

### Common Misconceptions Corrected

| Misconception | Actual Situation |
|------|----------|
| Subagent = Persona division like "Frontend Agent", "Backend Agent" | [HumanLayer practical experience](/blog/21-humanlayer-skill-issue-harness/): **Role-playing subagents perform poorly**; what works is the **context firewall** |
| Subagent = Cursor Multi-file Edit | Multi-file Edit is a batch file modification by the same Agent; Subagent is an **independent session + isolated context** |
| Subagents are always faster than a single Agent | There is delegation overhead; suitable for tasks with **massive exploration and lengthy intermediate outputs**, not for every minor modification |

Claude Code similarly supports the subagent mode; the names of subagent types and initiation methods vary slightly across platforms, but the architecture of "parent plans, child executes, summary returned" is consistent.

---

## 3. Commands — User-Triggered Workflow Entry Points

### Workplace Analogy

Instead of verbally explaining every time, "Please do a Code Review according to our team standards, focusing on X, Y, Z," it's better to agree on a secret signal in the office: "**The usual, review.**" Upon hearing the signal, the other party knows which process to run.

### Underlying Logic

Commands are Prompt templates **proactively triggered by the user**. When typing `/` in Cursor, the IDE lists the available commands; once selected, the entire text of that Markdown file becomes the prompt for the current turn, bringing in the current project context (including `@` referenced files).

Key differences from Skills:

| Dimension | Commands | Skills |
|------|----------|--------|
| Triggered by | **User** manually selects `/command` | **Agent** automatically judges whether to load based on description |
| File Format | Pure Markdown, usually without frontmatter | `SKILL.md` + YAML frontmatter |
| Typical Use | Fixed workflow entry points (review, commit, write PR) | Domain knowledge and SOPs (deploy, security standards) |

### Actual Configuration Format (Using Cursor as an Example)

Commands are **Markdown files**, placed in:

| Level | Path |
|------|------|
| Project | `.cursor/commands/` |
| Personal | `~/.cursor/commands/` |

**The file name (excluding `.md`) is the command name.** For example, `.cursor/commands/review-code.md` corresponds to `/review-code`:

```markdown
# Code Review

Review the selected code as a senior architect. Focus on:

1. Time/space complexity — can it be optimized?
2. Security — SQL injection, XSS, auth bypass risks
3. Clean Code — naming, single responsibility, error handling

Output format:
- **Summary** (one line)
- **Critical issues** (must fix)
- **Suggestions** (nice to have)
```

Commands are **not** JSON configuration files. If you see formats like `"commands": { "/review": { "prompt": "..." } }`, that is the syntax of other tools or outdated documentation, not Cursor's current slash command mechanism.

Cursor also supports migrating Commands into **Skills** (by adding `disable-model-invocation: true` to prevent the Agent from auto-calling, preserving the "user-triggered only" semantics).

Claude Code has its own slash command ecosystem (often via plugins or paths like `~/.claude/commands/`); Codex CLI's `/commands` is another interface—**the concept is the same (reusable prompt entry points), but paths and formats vary by platform.**

### Why Commands are Valuable to Teams

- **Version Controllable**: `.cursor/commands/` is committed to git; newcomers get the same workflows upon cloning.
- **Lower Expression Cost**: No need to describe "what our review standards are" from scratch every time.
- **Composable**: You can use `@` to reference project files within a Command (e.g., `@docs/code-style.md`), ensuring the prompt stays synced with the repo.

---

## 4. Hooks — Deterministic Safety Nets and Post-Processing

### Workplace Analogy

A company wouldn't just rely on employees' self-discipline to remember to "turn off the AC after work"—the system automatically shuts it down at 18:00. The same goes for AI Agents: you can't count on them to "remember to run lint"; the system must forcefully intervene **when events occur**.

### Underlying Logic

Hooks are implementations of **Event-Driven Architecture** in the Agent loop. At specific lifecycle nodes, the system spawns a process (or an LLM prompt hook) to exchange data with the Agent via **JSON stdin/stdout**, which can:

- **Observe**: Record analytics, audit logs
- **Allow / Deny**: Intercept dangerous shell commands, block subagent initiation
- **Modify**: Rewrite tool inputs, inject extra context
- **Post-process**: Automatically format after a file is written

This is the mechanism closest to **"deterministic control flow"** in the Harness—bridging the gap where LLMs inherently cannot guarantee behavioral consistency.

### Common Hook Events (Cursor)

Cursor's hooks are divided into three surfaces: **Agent hooks**, **Tab hooks** (inline completion), and **App lifecycle hooks**. Developers most commonly use Agent hooks:

| Event | Trigger Timing | Typical Use |
|------|----------|----------|
| `sessionStart` / `sessionEnd` | Agent session starts / ends | Inject project index, clear cache |
| `beforeShellExecution` | **Before** executing a shell command | Intercept `rm -rf`, network requests, dangerous migrations |
| `afterShellExecution` | **After** a shell command | Audit outputs, capture artifacts |
| `preToolUse` / `postToolUse` | Before / after any tool call | General interception, rewrite tool input, inject context |
| `beforeReadFile` / `afterFileEdit` | Before reading / after writing a file | Access control, automatic Prettier / ESLint |
| `subagentStart` / `subagentStop` | Subagent starts / completes | Manage subagent types, chained follow-ups |
| `beforeSubmitPrompt` | Before the user submits a prompt | Scan for PII, secrets, policy violations |
| `stop` | When the Agent claims completion | Run typecheck / test; **feed stderr back to Agent only if failed** |

> **Naming Note:** Cursor uses camelCase event names (e.g., `afterFileEdit`, `sessionStart`), not `postEdit` or `onSessionStart`. Claude Code's hook event names are similar but not exactly identical; Cursor supports loading some third-party hook formats.

### Actual Configuration Format

`hooks.json` must include `"version": 1`:

```json
{
  "version": 1,
  "hooks": {
    "beforeShellExecution": [
      {
        "command": ".cursor/hooks/approve-network.sh",
        "matcher": "curl|wget|nc ",
        "failClosed": true
      }
    ],
    "afterFileEdit": [
      {
        "command": ".cursor/hooks/format.sh"
      }
    ]
  }
}
```

Hook scripts read JSON from stdin and write JSON responses to stdout. Taking `beforeShellExecution` as an example, the script could return:

```json
{
  "permission": "ask",
  "user_message": "This command may access the network. Please review.",
  "agent_message": "A hook flagged this as a possible network call."
}
```

**Key Behaviors:**

- Exit code `0`: Success, stdout JSON is adopted
- Exit code `2`: Blocks the action (equivalent to `permission: "deny"`)
- Other non-zero exit codes: Defaults to **fail-open** (action continues); if `failClosed: true` is set, it becomes fail-closed

Hooks are divided into **command-based** (shell scripts, deterministic) and **prompt-based** (LLM evaluation, suitable for policies hard to script). For scenarios requiring auditable behaviors, like approving dangerous operations, prioritize using command hooks.

### Stop Hook and Back-pressure

[HumanLayer](/blog/21-humanlayer-skill-issue-harness/) specifically emphasizes the value of the **Stop hook**: When the Agent claims "it's done," the hook automatically runs `typecheck` + `test`:

- **Success → completely silent** (do not dump 4000 lines of pass logs into the context)
- **Failure → lengthy stderr is fed back to the Agent**, driving the next round of fixes

This is called **back-pressure**: allowing the Agent to **self-verify** instead of just relying on "I think it's good." Compared to simply writing `CRITICAL: always run tests` in AGENTS.md, hooks are **deterministic**.

---

## How Do the Four Connect? A Complete Workflow

These four mechanisms are not a multiple-choice selection, but different checkpoints on the same Agent loop:

```
[User inputs /review-code]             ← Commands (Explicit trigger)
        │
        ▼
[Agent judges the need to load 
 code-review Skill]                    ← Skills (On-demand review standards injection)
        │
        ▼
[Main Agent finds 40 modules to scan,
 dispatches explore subagents in 
 batches to investigate]               ← Subagents (Isolate massive exploration outputs)
        │
        ▼
[Subagents modify files → afterFileEdit hook
 automatically runs Prettier + ESLint] ← Hooks (Deterministic post-processing)
        │
        ▼
[Agent claims completion → stop hook runs test
 If failed, stderr flows back to drive 
 the next round]                       ← Hooks (Back-pressure)
        │
        ▼
[Review report is presented to the user]
```

Division of labor:

- **Commands** — Ensures "**who, when, and what to do**" is explicitly initiated by the user
- **Skills** — Ensures AI "**knows the rules and how to do it**"
- **Subagents** — Ensures AI "**won't drown in garbage context during exploration**"
- **Hooks** — Ensures AI "**cannot bypass safety checks and quality gates**"

---

## Relationship with Rules, AGENTS.md, and MCP

These four are often confused with other Harness components. Let's clarify with a table:

| Mechanism | Loading Timing | Main Content | Suitable For |
|------|----------|----------|------------|
| **AGENTS.md / Rules** | Injected into system prompt every time (or conditionally) | Global, concise, universally applicable | Build/test commands, things not to do, directory navigation |
| **Skills** | Loaded on-demand by Agent | Domain SOPs, processes, templates | Deployment processes, PR guidelines, domain API usage |
| **Commands** | Triggered by user via `/` | Complete workflow prompts | Code review, writing commit messages, generating PRs |
| **MCP** | Registered as tools, described in prompt | External APIs / services | GitHub, Linear, database queries |
| **Hooks** | Event triggered, non-prompt | Scripts / policies | Lint, secrets scanning, blocking dangerous commands |

Practical principles (echoing [HumanLayer](/blog/21-humanlayer-skill-issue-harness/) and [OpenAI Harness Engineering](/blog/11-harness-engineering/)):

- Keep AGENTS.md **concise** (<60 lines is a common goal); push details down to Skills
- MCP is **not a silver bullet**: If a mature CLI already exists, writing six examples in AGENTS often saves more tokens than a massive MCP schema
- When the Agent makes a mistake → **Update AGENTS, add a Skill, or add a Hook**, don't just swap the model

---

## Quick Reference by Platform

| Mechanism | Cursor | Claude Code | Codex |
|------|--------|-------------|-------|
| Skills | `.cursor/skills/*/SKILL.md` | `~/.claude/skills/` etc. | Depends on version; same concept |
| Subagents | Task tool + `subagent_type` | Built-in sub-agent | Limited support |
| Commands | `.cursor/commands/*.md` | plugin / commands directory | CLI `/commands` |
| Hooks | `.cursor/hooks.json` | `.claude/settings` hooks | No exact equivalent yet (OpenCode plugins are similar) |

Cursor specifically supports **loading third-party hooks in Claude Code's format**, reducing cross-tool migration costs. Cloud Agent (remote execution) will read `.cursor/hooks.json` within the repo but won't read `~/.cursor/` personal-level settings.

---

## Action Guide for Developers

After understanding these four concepts, you are no longer just a passive user accepting AI outputs, but an **AI workflow architect** capable of designing and iterating on the Harness. Here are three starting points you can tackle immediately:

### 1. Write Your First Skill

Pick a highly repetitive task with clear steps (deployment, PR process, security review checklist) and create:

```
.cursor/skills/your-skill-name/SKILL.md
```

Clearly write **what to do (WHAT)** and **when to use it (WHEN)** in the `description`—this is the key to whether the Agent can correctly choose to use it.

### 2. Encapsulate Your Most-Used Prompts as Commands

Save long prompts that you retype every time as `.cursor/commands/your-command.md` and commit them to git for your team to share. The filename becomes the command name, available by typing `/`.

### 3. Set up an `afterFileEdit` or `stop` Hook

- `afterFileEdit`: Automatically run Prettier / ESLint after every AI file edit, bidding farewell to format chaos.
- `stop`: Run tests when the Agent claims to be done; **silent on success, report only on failure**—this is the most effective starting point for back-pressure.

---

## Conclusion

Skills, Subagents, Commands, and Hooks are not just four trendy terms, but the four pillars of **Harness Engineering**:

- Use **Skills** to manage progressive disclosure of "knowledge and process"
- Use **Subagents** to manage isolation and recovery of the "context budget"
- Use **Commands** to manage repeatable entry points of the "human-machine interface"
- Use **Hooks** to manage deterministic allowance, interception, and validation

AI is not just a tool, it's your collaborative partner—and a good architect knows how to engineer this Harness layer outside the Model, allowing the partner to deliver verifiable results at the right time, with the right knowledge, and through the right gates.

---

> **Further Reading:**
> - [HumanLayer: The Skill Issue of Coding Agents](/blog/21-humanlayer-skill-issue-harness/) — Practical analysis of five types of Harness knobs
> - [LangChain's Anatomy of an Agent Harness](/blog/15-langchain-agent-harness-anatomy/) — The component map of Agent = Model + Harness
> - [Cursor Official Docs: Agent Hooks](https://cursor.com/docs/agent/hooks)
> - [Anthropic Official Docs: Claude Code Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)
> - [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/)
