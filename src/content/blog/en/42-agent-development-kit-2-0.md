---
title: "Google ADK 2.0: Workflow Graphs, Task Collaboration, and HITL Boundaries"
description: "A source-grounded analysis of how ADK 2.0 separates deterministic routing from LLM reasoning, with production boundaries for workflows, tasks, human approval, and durable state."
pubDate: 2026-07-09
updatedDate: 2026-08-09
tldr:
  - "ADK 2.0 moves deterministic routing, scheduling, and error handling out of the LLM loop and into a Workflow runtime."
  - "Workflows can mix tools, single-turn agents, branches, loops, and HITL, but a deterministic graph does not make node output correct."
  - "Python ADK is in the 2.x line while other language SDKs have different versions and maturity; adoption must pin runtime and deployment targets."
audience:
  - "AI engineers evaluating Google ADK and multi-agent workflows"
  - "Platform architects responsible for reliability, cost, approval, and recovery semantics"
category: "AI Engineering"
tags: ["AI Agent", "Multi-Agent", "Google Cloud", "Architecture Patterns"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 3
kind: "article"
showToc: true
image: "/blog/42-agent-development-kit-2-0/title_image.webp"
---

Google's July 2026 explanation, [Why we built ADK 2.0](https://developers.googleblog.com/en/why-we-built-adk-20/), starts with a production problem. Asking an LLM to handle routing, scheduling, and error handling adds token cost, latency, and execution variance to decisions that conventional code can make exactly. ADK 2.0 therefore adds a structured Workflow runtime and task-collaboration model so deterministic flow and open-ended reasoning can be composed.

That direction is useful, but a graph does not “perfectly contain hallucinations.” It controls which path runs next. An LLM node can still classify or extract incorrectly, and tools with side effects still require authorization, idempotency, and compensation.

> **Huahua in one sentence**
>
> Put known execution order in a workflow and reserve the LLM for steps that genuinely require semantic judgment.

> **Huahua's engineering note**
>
> Deterministic routing guarantees that routing rules execute; it does not guarantee the evidence behind a route is correct.

## The structural problem ADK 2.0 addresses

An autonomous refund agent might receive one system prompt telling it to fetch purchase history, interpret policy, issue a refund, send a message, and close the ticket. At each turn the model rereads context, selects a tool, and infers what comes next. Even a high success rate is unnecessary variance for a fixed business sequence.

ADK 2.0 separates execution routing from language processing:

- API, database, and deterministic functions become tool nodes.
- Ambiguous classification, summarization, and generation use single-turn agent nodes.
- Explicit edge conditions select branches.
- Human-in-the-loop becomes a workflow step rather than a sentence asking the model to remember approval.
- A task model supports decomposition and collaboration without one supervisor carrying every detail.

The design question is not “should everything be a DAG?” It is: if B must always follow A, why pay for the model to infer that transition again?

## Composing deterministic and agentic nodes

Google's refund example uses `Workflow`, `START`, Python functions, and `Agent(mode="single_turn")`. Its shape can be simplified as:

```python
workflow = Workflow(
    name="Refund_Workflow",
    edges=[
        (START, fetch_purchase_history, analyze_policy_agent),
        (analyze_policy_agent, route_decision,
         {True: issue_refund, False: close_ticket}),
        (issue_refund, draft_email_agent, close_ticket),
    ],
)
```

The useful property is responsibility separation. Purchase lookup and refund execution are deterministic tools. Policy exceptions and message drafting use an LLM. A routing function converts the agent result into a graph condition.

A production refund flow should not branch merely because a free-form string contains `true`. Add:

- a structured output schema that rejects invalid values;
- renewed validation of amount, account, and policy version;
- an idempotency key preventing duplicate refunds on retry;
- human approval above a risk threshold and a timeout policy;
- node-level traces, input hashes, results, and error categories.

## Task collaboration is not unlimited multi-agent delegation

The ADK 2.0 task model supports creating, assigning, tracking, and handing off work. It fits long-running or multi-specialty processes, but more agents are not a default optimization. Every delegation adds context-transfer, wait, retry, permission, and tracing cost.

Prefer a single workflow node unless a subtask has at least one clear reason to be separate:

- a different tool or permission scope;
- independent verification and retry;
- safe parallelism without conflicting shared state;
- a distinct model, cost, or latency profile;
- a separate owner or audit boundary.

Splitting one prompt into several personas often adds orchestration entropy without adding evidence.

## The real HITL responsibility boundary

Google describes human-in-the-loop as a deterministic step that can be composed with a Workflow. This is more reliable than asking the model to decide when a human is needed, but a framework primitive is not a complete approval system.

An enterprise still has to define:

1. Which action, amount, data class, or confidence triggers approval.
2. Who may approve and how role and identity are verified.
3. Which immutable action payload and version the approval binds to.
4. Where state persists while waiting, when it expires, and whether it survives deployment.
5. How rejection, timeout, duplicate callbacks, and changed source data behave.

An approval represented by a replayable boolean without actor, payload, and expiry binding is not an authorization control.

## Version and artifact status

As of August 9, 2026, Google's `adk-python` repository shows a stable 2.x release line and a frequent release cadence. Java, Go, TypeScript, and Kotlin use different version numbers and do not necessarily have feature parity. ADK is open source, code-first, and deployment-agnostic, although it integrates deeply with Gemini and Google Cloud.

Pin the following before adoption:

- language SDK and exact version;
- availability of Workflow, Task, HITL, evaluation, and deployment features in that version;
- dependencies on Vertex AI Agent Engine, Cloud Run, or self-managed runtime;
- storage implementations for sessions, artifacts, tasks, and traces;
- upgrade and rollback paths for preview or beta capabilities.

## When an ADK 2.0 Workflow fits

It fits a process with mandatory compliance steps, a limited number of semantic decisions, node-level retry and tracing needs, and a team willing to maintain the graph contract.

It may not fit a simple one-turn tool call, an exploration-heavy task, a team with an established workflow engine, or an environment unable to operate durable state and observability. Connecting agent nodes to an existing orchestrator may be safer than a wholesale migration.

## Adoption checklist

1. Classify every step as deterministic or probabilistic.
2. Define schema, failure taxonomy, and evaluation set for every agent node.
3. Add authorization, idempotency, and compensation to side-effecting tools.
4. Test branch, retry, timeout, cancel, resume, and human-rejection paths.
5. Measure node latency, tokens, task completion, human wait, and rework.
6. Roll out through shadow traffic or a low-risk workflow.

For the larger architecture and evaluation context, read the [AI Agent guide](/en/blog/64-ai-agent-guide/). The [enterprise AI agent security guide](/en/blog/43-enterprise-ai-agent-security/) covers the control plane, while [MCP 2026-07-28](/en/blog/34-model-context-protocol-mcp/) covers tool-protocol boundaries.

## Primary sources

- [Google Developers Blog: Why we built ADK 2.0](https://developers.googleblog.com/en/why-we-built-adk-20/)
- [Google ADK Python repository and releases](https://github.com/google/adk-python)
- [Google ADK documentation](https://google.github.io/adk-docs/)
- [Google Developers Blog: ADK multi-agent applications](https://developers.googleblog.com/agent-development-kit-easy-to-build-multi-agent-applications/)
