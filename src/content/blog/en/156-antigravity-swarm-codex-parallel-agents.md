---
title: "How Antigravity Swarm Works—and What Codex Can Do"
description: "Break down Antigravity Swarm’s coordinator, shared board, and verifier, then compare them with Codex subagents, custom agents, and worktrees."
pubDate: 2026-11-19
updatedDate: 2026-11-19
tldr:
  - "Swarm makes parallel work observable: a coordinator splits tasks, workers report on a shared board, and a verifier checks the results."
  - "Codex already supports subagents, specialized roles, and agent threads; worktrees isolate file changes across separate Codex chats."
  - "The products do not share the same interface: Codex has no Swarm-style live board for every member, so the main agent still has to synthesize results and assign verification."
  - "A practical Codex starting point is parallel read-only investigation. Parallelize writes only when the work can be divided into non-overlapping pieces."
audience:
  - "Engineers using Codex or Antigravity for software development"
  - "Technical leads designing multi-agent workflows, code review, and verification steps"
category: "AI Engineering"
tags: ["AI Agent", "Codex", "Harness Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 57
kind: "article"
showToc: true
image: "/blog/156-antigravity-swarm-codex-parallel-agents/title_image.webp"
imageAlt: "Huahua guides three parallel work paths toward one review checkpoint, showing why delegated agents still need shared verification."
---

Antigravity’s `/swarm` turns multi-agent work into a visible team: a coordinator divides the work, workers execute their assignments, everyone posts tasks and results to a shared board, and a verifier checks the changes. That naturally raises a question: can Codex subagents work the same way?

**The working method can transfer, but the product interfaces and coordination mechanisms differ.** Codex already has parallel subagents, custom roles, and agent threads. In the Codex app, worktrees can isolate the working directories of separate chats. But Codex does not have Swarm’s live board where every member posts to a shared feed. Recreating reliable collaboration in Codex depends on task boundaries, reporting formats, file ownership, and verification responsibility—not simply adding more agents.

> **Huahua in one sentence**
>
> Multi-agent work helps when tasks are independent and handoffs are checkable; the number of agents alone does not guarantee quality.

## Swarm is built around explicit handoffs

According to [the official Antigravity Swarm documentation](https://antigravity.google/docs/swarm/), the user describes a goal and how to verify it. A coordinator then splits the work into non-overlapping areas and writes a public brief for each worker: what it owns, what it must not touch, and what counts as done. Workers use their own conversation and context, then post progress, questions, and results to a board visible to the whole team.

Alongside the workers, the coordinator typically adds a verifier to inspect diffs, run tests, and send problems back for fixes. The documentation gives one verifier for every two to four workers as a typical ratio. The coordinator assigns, judges, and reports work rather than doing the technical implementation itself. It also adds a monitor that speaks up only if the team goes quiet. Idle members can wait on the board without continuing to use tokens. A worker that runs out of quota pauses; it does not automatically retry when quota becomes available again.

This design puts four things in one collaboration path: delegation, visible handoffs, independent checks, and stalled-work recovery. The Swarm guide recommends it for broad tasks that split across different files, packages, or investigation tracks. Tightly coupled hard problems fit an iterative reasoning and correction process better, while long-running multi-stage projects have a separate Teamwork workflow.

## What Codex already has—and what differs

[The Codex Subagents documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) explains that the main agent can delegate independent work to subagents with their own contexts, then collect and synthesize their results. You can explicitly ask for one agent per question, specify that Codex should wait for every result, and define custom agents such as `explorer` or `reviewer` with role instructions, models, and reasoning effort. Subagent activity is visible in the app, CLI, and IDE extension; the CLI uses `/subagents` to switch between agent threads.

For multiple full Codex chats working in parallel, [worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees) give each chat a separate checkout of the same Git project, reducing the chance of overwriting one another’s files. That is **isolation between chats and working directories**, not the same as Swarm workers posting to one coordinator’s shared board. Subagents still use the environment and permissions of the Codex session; writing “do not edit files” in a role prompt does not create a read-only sandbox. When supported by the client and account, you can also select a model and reasoning effort for a subagent. That configures the role; it does not automatically create a cross-model verifier.

| Dimension | Antigravity Swarm | Codex approach |
| --- | --- | --- |
| Delegation and roles | A coordinator assigns named workers with public briefs | The main agent starts subagents from a prompt; custom agents can define reusable role instructions |
| Communication | The whole team posts to a shared board using mentions | The main agent assigns, follows up, and synthesizes; each subagent has its own thread, with no equivalent shared board |
| Workspace | Shared by default, with separate working copies available | Subagents use the session environment; separate Codex chats can use worktrees for isolated checkouts |
| Verification | A dedicated verifier reviews diffs and runs tests | Assign a reviewer subagent or ask the main agent to verify; specify acceptance criteria in the task |
| Observability | Swarm pane or CLI board shows posts, member states, and relationships | Inspect subagent threads, status, and returned summaries; presentation varies by client |

This comparison describes the workflows in the products’ documentation. Manually coordinating Codex agents does not provide all of Swarm’s status tracking, and a Swarm verifier cannot guarantee that every defect will be found.

## Apply the Swarm pattern in Codex

Codex’s guidance is to start with read-heavy work: code exploration, test triage, log analysis, and summarization are good candidates when they can be split into independent questions. Parallel writes need more care because shared files and dependent steps can conflict. Here is a prompt you can adapt:

```text
Use subagents to investigate this bug in parallel. Do not modify any files yet.

Assignments:
1. explorer: trace the relevant code paths and likely root causes, with file paths and line numbers.
2. tests: inspect how current tests cover this behavior and identify missing cases.
3. reviewer: independently challenge the first two agents' reasoning and identify contrary evidence or unverified assumptions.

Each agent should report its conclusion, evidence, and open questions. Wait for all results, then synthesize a root-cause assessment and a minimal verification plan. Do not present a hypothesis as a confirmed fact.
```

This lets several agents investigate different angles at once. The main agent acts as coordinator, combines the findings, and makes the decision. Start implementation only after the root cause has evidence behind it. If the change can be divided into non-overlapping files, give each area a single owner and have another agent review the integrated result. For multiple independent changes, separate Codex chats in separate worktrees are easier to reconcile than several writers changing the same checkout.

To make reports easier to inspect, include a return format in every brief: owned scope, files changed, verification commands and results, and unresolved issues. Then ask the main agent to wait for all work and compare each report with the actual diff and test output. This is a workflow convention created by the prompt, not an additional product guarantee.

## A verifier must do more than ask another agent

A reviewer that sees only the implementer’s summary can inherit the same mistaken assumption. For important changes, the verifier should inspect the actual diff, relevant context, and test output, and have enough of the original requirements to judge the result independently. You can assign a different model or review focus when useful, but a different model does not make the result automatically correct.

Permissions also need care. Codex subagents inherit the parent session’s sandbox and approval settings. Adding `Do not edit files` to a reviewer’s instructions is a behavioral request; it does not make the tool permissions read-only. To enforce read-only access through the sandbox, change the parent session’s permissions first. [The official permissions guide](https://learn.chatgpt.com/docs/agent-configuration/subagents#approvals-and-sandbox-controls) explains this inheritance.

Subagents each perform their own model and tool work, so they typically use more tokens than a single-agent run. If a task has one clear answer, must proceed in a strict sequence, or requires several agents to edit the same state, extra agents can add handoff cost without helping. [Codex’s documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents#why-subagent-workflows-help) also recommends starting with read-heavy parallel work.

> **Huahua's engineering note**
>
> An independent reviewer needs access to the underlying evidence. A read-only reviewer needs supporting permission settings. Role names and prompts cannot replace either condition.

## Which work belongs in a small team?

Ask three questions: Can the work split into independent subproblems? Can each result be checked against files, tests, or cited evidence? Is the cost of integration lower than the time and attention needed to do the work in sequence? If the answers are mostly yes, start with two or three read-heavy subagents. Otherwise, a single main agent is usually more direct.

Codex can adopt Swarm’s most useful engineering principles today: clear ownership, limited overlap, defined reporting, waiting for results, and independent verification. Its collaboration centers on a main agent and agent threads; it is not a copy of Antigravity Swarm’s board. For Codex’s `/review`, subagents, and review boundaries, continue with [A Second Opinion in Codex](/en/blog/134-codex-second-opinion-review-workflows/). For other components of an agent harness, see [Harness Engineering](/en/blog/11-harness-engineering/).

## Sources

- Google Antigravity, [official Swarm (`/swarm`) documentation](https://antigravity.google/docs/swarm/)
- OpenAI, [Codex Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- OpenAI, [Codex Worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees)
