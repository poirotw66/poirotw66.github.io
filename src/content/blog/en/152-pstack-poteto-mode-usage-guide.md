---
title: "How to Use pstack: poteto-mode, Workflow Basics, and Six Practical Examples"
displayTitle: "Using pstack: Six Practical Workflows"
description: "A source-grounded pstack guide covering poteto-mode, model setup, and six prompts for debugging, features, refactoring, investigation, review, and design, with Cursor, Claude Code, and Codex boundaries."
pubDate: 2026-11-06
updatedDate: 2026-11-06
tldr:
  - "Start with poteto-mode, a goal, a completion check, and the evidence you need; most tasks do not need a hand-written chain of skills."
  - "Skills define working methods, playbooks sequence tasks, and principles guide engineering decisions; installation does not activate every workflow."
  - "Cursor is the primary environment and Claude Code has an official adapter; loading a skill in Codex does not establish identical orchestration or model settings."
audience:
  - "Developers who have installed pstack and want to assign a real task"
  - "Developers collaborating with AI in Cursor, Claude Code, or Codex"
category: "AI Engineering"
tags: ["AI Agent", "Harness Engineering", "Software Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 54
kind: "article"
showToc: true
readingStyle: focused
image: "/blog/152-pstack-poteto-mode-usage-guide/title_image.webp"
imageAlt: "Huahua operates a copper track switch, routing a cart with a blank task sheet toward an inspection arch to represent workflow selection and evidence."
---

After installing pstack, the list of names can turn your first question into an orchestration problem. Should you run `/how`, then `/architect`, then `/arena`, then `/interrogate`? The [official help guide](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-help/SKILL.md) offers a simpler entry point: describe the task to `/poteto-mode`, let it select a workflow, and name another skill directly when you need a particular output.

This guide is for developers who have installed pstack but have not yet used it for a concrete task. The question is **how to replace “make this good” with work an agent can execute and you can accept based on evidence**. pstack supplies methods for routing, delegation, and verification. You still define what completion means.

Sources were checked on November 6, 2026, using [commit `c742dd6`](https://github.com/cursor/plugins/tree/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack) of the pstack directory in `cursor/plugins`. The prompts below are illustrative adaptations of the documentation. **We did not execute each development task, and this article reports no measured performance or success-rate results.** Examples use Cursor syntax; differences in other hosts appear later.

## Skills, playbooks, and principles do different jobs

pstack encodes engineering practices in instructions, references, and workflows that an agent can read. Its [README](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/README.md) emphasizes code quality and verifiable work. That is the author's stated design goal, not independent evidence that installing it necessarily improves outcomes.

Three layers are useful to understand:

- A **skill** handles a kind of work. `/how` explains a system; `/interrogate` looks for demonstrable failures.
- A **playbook** sequences a task category, such as Bug fix, Feature, Refactoring, or Investigation. These live inside `poteto-mode` and do not each have a slash command.
- A **principle** guides an engineering decision, such as checking actual behavior after a change or using an experiment to answer an observable question.

According to the [poteto-mode instructions](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/SKILL.md), the entry point matches the request to a playbook, reads its steps, copies them into a task list, and invokes other skills as needed. Skipped steps should retain a reason. This gives you a way to inspect the chosen process and its omissions alongside the final result.

> **Huahua in one sentence**
>
> The first thing to give pstack is a task whose completion can be judged from evidence. Learning every skill name can wait.

## What to do after installation

In Cursor, the official [setup guide](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/01-setup.md) starts with `/setup-pstack`: choose a reasoning budget and models for the different roles, then start a new chat to use the settings. If you have not installed the plugin, the guide provides `/add-plugin pstack` as the installation entry point.

Setup writes `~/.cursor/rules/pstack-models.mdc`. This is a Cursor role configuration file. It does not purchase model access or establish that another tool reads the same path. The documented budgets include `small`, `medium`, `large`, and `unlimited`, but these configure reasoning levels. **They are not fixed prices or token caps.** A role set to `auto` or `inherit-parent` uses the parent chat model under the documented rules. The number of entries in a review panel also affects the number of subagents launched.

Next, select `/poteto-mode` in Cursor chat and describe the task. To keep the skill active across turns, [Cursor's Custom Mode documentation](https://cursor.com/docs/skills#using-a-skill-as-a-custom-mode) describes selecting it with Option+Enter on Mac or Alt+Enter on Windows. Attaching a skill to one message does not establish that it remains active throughout the conversation. Explicitly naming `/poteto-mode` for each new task is another straightforward starting point.

Choose a small real task with a clear result for your first run. “Optimize the whole project” makes a poor first acceptance check.

## How much should a prompt specify?

The official [prompting guidance](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-help/references/prompting.md) centers on intent, completion checks, evidence, known context, and constraints. You can express these as five questions:

1. Which behavior is wrong, or what should be added?
2. What observable result would count as complete?
3. Do you need command output, a screenshot, stored values, or a before-and-after comparison?
4. What reproduction steps, files, or errors do you already know?
5. What may change, and which actions should remain yours?

You do not need to answer every question every time. Nor do you need to prescribe `/how → /architect → /arena → /interrogate`. The workflow selects methods for the situation. A long manual skill sequence can shift attention toward completing a ceremony while leaving the actual deliverable vague.

The following six prompts describe **illustrative tasks**. Substitute real paths, commands, and fixtures from your project. Their evidence requirements describe what to request from an agent; they are not results obtained for this article.

## Example 1: Fix mobile article overflow

Use this when the visual defect is known but its cause is not yet established.

```text
/poteto-mode Long URLs make the article page wider than the mobile viewport.
Reproduce it first, then make the smallest fix.
Done means no document-level horizontal scrolling at 375px and 390px,
while long URLs, code blocks, and tables remain readable.
Show browser checks and screenshots before and after the change.
Preserve unrelated edits. Do not commit or deploy.
```

The prompt turns “looks fine” into observable behavior. Acceptance should examine the page width, content readability, and scope of changes. A successful build establishes only some construction conditions. If a code block needs its own horizontal scrolling, check that it does not widen the entire document. These are acceptance criteria proposed here for this example.

## Example 2: Add an output format while preserving a CLI contract

Specify both the new behavior and the old behavior that must survive.

```text
/poteto-mode Add a --json output option to this CLI.
JSON must include id, status, and message.
Without --json, existing text output must stay byte-identical.
Done means success and failure outputs both parse as JSON,
and existing exit codes stay unchanged.
Show verification commands and representative output. Do not commit.
```

This fits the Feature workflow. Alongside testing the new option, compare existing text output and exit codes. Valid JSON does not establish that its fields have the right meaning, so inspect success and failure contents too. If the project has no JSON schema yet, first settle field types and the failure format.

## Example 3: Anchor a refactor to comparable behavior

“Clean up this code” can easily turn into an incidental feature change. A comparable external result makes acceptance easier.

```text
/poteto-mode Consolidate duplicated article reading-time calculations
into one module. This is a refactor only: keep the algorithm and display format.
Record current outputs for Traditional Chinese and English fixtures first.
Done means identical fixture results and all callers using one implementation.
Report the comparison method, results, and cases not covered. Do not commit.
```

This follows the documented [Refactoring intent](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/SKILL.md): change structure while preserving behavior. For this example, we recommend fixtures covering empty content, Chinese, English, and code blocks. Matching fixtures supports a claim about those cases; it does not prove equivalence for every possible input.

## Example 4: Investigate before making a change

When you have not located the cause, explicitly request a read-only investigation.

```text
/poteto-mode new task. Investigate why users can still see cached content
from the previous account after logout. Do not modify any files yet.
Trace logout, cache invalidation, and UI updates with source locations.
Use reproducible steps to separate confirmed behavior from hypotheses.
List what cannot be confirmed if the environment or data is unavailable.
```

`new task` signals a fresh task rather than a continuation of the preceding workflow. “Do not modify” defines the deliverable as an investigation report. The official [routing guide](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/02-poteto-mode.md) places read-only questions in Investigation. Expect a traced flow, supporting evidence, reproduction results, and unknowns before considering a patch.

## Example 5: Ask reviewers to demonstrate a failure

When a diff already exists and you want actual bugs or regressions, invoke `/interrogate` directly.

```text
/interrogate Review this branch against main, including uncommitted changes.
Do not modify the production implementation or commit anything.
Focus on incorrect behavior and compatibility regressions.
Each retained finding needs an executable reproduction,
the actual output, and the expected output.
List unverifiable concerns as limitations, not confirmed bugs.
```

The [interrogate instructions](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/interrogate/SKILL.md) ask adversaries to demonstrate failures by running code, then require the coordinating process to rerun and filter the findings. Its output is a report rather than automatically applied fixes. A review with no verified findings is valid; it should not invent risks to fill a quota.

If your question is what a small change might break outside its diff, [blast-radius](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/blast-radius/SKILL.md) is a closer fit. It follows dependencies, data formats, and callers, then tries to execute code to establish the key safety assumption. These skills answer different questions, so running both need not be automatic.

## Example 6: Inspect the design before implementation

Use `/architect` when module boundaries are unsettled. It normally continues into implementation, so explicitly request a checkpoint if you want to review the design first.

```text
/architect with checkpoint
Design a replaceable index-reading interface for article search.
It must support today's static JSON and a future remote source.
Inspect the existing search flow and compare at least two
structurally different approaches.
Explain the public interface, error handling, and impact on existing callers.
Stop at the design checkpoint for my review before filling in implementation.
Do not commit.
```

The official [architect skill](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/architect/SKILL.md) covers grounding in the existing system, comparing sketches, synthesizing a design, and implementation. Human review is an opt-in checkpoint. This example assumes the remote source is an established requirement. If it is merely a vague possibility, our recommendation is to assess whether the abstraction earns its place first.

## When should you name another skill directly?

When the desired output is already specific, naming a skill can keep scope clearer than initiating a full development workflow. The following map follows the [official skill guide](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-help/SKILL.md). These are separate use cases, not a checklist to run on every task.

| Your current question | Skill | Main output | What to specify |
| --- | --- | --- | --- |
| How does this code work now? | `/how` | Architecture and execution flow | A module or feature scope |
| Why was it designed this way? | `/why` | Sourced rationale and unknowns | Missing history must not become invented intent |
| Help me understand this change | `/teach` | Mechanics and rationale explained together | Reader background and the point of confusion |
| The request is still vague | `/sharpen` | A deeper, verifiable prompt | It rewrites the task rather than executing it |
| Compare multiple approaches | `/arena` | A synthesis of multiple candidates | The same brief, rather than partitioned work |
| Check several scopes in parallel | `/swarm` | One consolidated report | Scope, completion conditions, and isolation |
| What happened in this chat? | `/ketchup` | Progress and pending decisions | This is not a reconstruction of all past chats |
| Which skill should I use? | `/poteto-help` | Usage guidance and a suggested prompt | Ask about the method you need |

## Keep Cursor, Claude Code, and Codex distinct

Different tools can read a skill document while differing in tool names, model roles, rule paths, and long-running execution. The pstack [help guide](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-help/SKILL.md) explicitly flags these portability limits.

| Host | Task entry point | Model settings and orchestration | Boundary to check |
| --- | --- | --- | --- |
| Cursor | `/poteto-mode` | `/setup-pstack` writes a Cursor rule | Actual availability of Custom Modes, subagents, and `/loop` |
| Claude Code | `/pstack:poteto-mode` | The official adapter maps rules to `~/.claude/rules/pstack-models.md` | Fallbacks or skips for non-Claude models and Cursor-only features |
| Codex | Explicitly name an installed skill, such as `$poteto-mode` | Execution uses the tools and models the current host provides | Loading a skill does not prove the Cursor orchestration was fully ported |

The official [Claude Code adapter](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/harness/claude-code.md) maps command prefixes, tools, and rule paths. It also documents model fallback for non-Claude choices and skipped Cursor-only capabilities. A model name in a configuration file therefore does not establish that the model actually participated in a review.

The [official OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills#how-chatgpt-and-codex-use-skills) describes explicit selection with `/skills` or `$` in Codex CLI and the IDE extension. If these skills are installed in Codex, you can name `$poteto-mode` with the same goals and acceptance criteria. This article does not establish cross-platform orchestration through testing or promise identical Cursor Custom Modes, model routing, or `/loop` behavior. `/loop` is itself a Cursor built-in, not a pstack skill.

## How to judge whether a run was useful

Inspect the deliverable before adding more agents. In the examples above, useful evidence means the actual page, parseable output, a before-and-after comparison, a traceable execution flow, a repeatable failure, or a design with explicit trade-offs. Ask which checks were omitted and why; that tells you more than another unqualified completion claim.

Cost depends on the work. The [setup guide](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/01-setup.md#keep-the-cost-in-check) identifies subagents, review panels, and higher reasoning levels as sources of token consumption. Smaller panels and lower budgets are available controls, not promises of a fixed saving. `auto` does not mean free.

For simultaneous changes, the [routing guide](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/02-poteto-mode.md#give-parallel-work-its-own-machine) recommends isolating working environments. Local worktrees isolate files, but ports and shared build outputs still need attention. Parallel work needs more structure than placing every agent in the same directory.

> **Huahua's engineering note**
>
> Another reviewer adds inspectable information when they can access the necessary environment, execute independently, and return evidence. Additional assurances cannot replace a missing check.

For a first run, choose a small problem you already need to solve today. Describe the goal, a pass-or-fail completion check, and the evidence you want, then give it to `poteto-mode`. After delivery, compare the checks actually run with the remaining limitations to decide whether this workflow suits that task. For more on how agent tools, state, and evaluation fit together, continue with the [AI Agent engineering guide](/en/blog/64-ai-agent-guide/).

## Sources and reading version

- [pstack help guide](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-help/SKILL.md): the official entry point and skill map, maintained by poteto; operational documentation rather than an effectiveness evaluation.
- [pstack README at the pinned version](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/README.md): the snapshot used here. The latest commit affecting the pstack path was dated October 27, 2026 UTC; that is not a product release date.
- [Setup](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/01-setup.md), [routing](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/02-poteto-mode.md), and [prompting](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-help/references/prompting.md): the main references for configuration, task framing, and acceptance design.
- [Claude Code adapter](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/harness/claude-code.md), [Cursor Skills](https://cursor.com/docs/skills), and [OpenAI Skills](https://learn.chatgpt.com/docs/build-skills): platform differences. Live documentation may change; checked November 6, 2026.
