---
title: "LLM Wiki Knowledge Updates: Turning Agent Proposals into Verifiable Knowledge Change PRs"
description: "A synthetic enterprise knowledge update exercise shows how to combine source tracking, impact analysis, answer regression, and human approval into a governed knowledge change lifecycle."
pubDate: 2026-10-14
updatedDate: 2026-10-14
tldr:
  - "A new document does not invalidate every old rule; updates must account for effective dates, eligibility, exceptions, and fallback paths."
  - "After an Agent identifies pages to edit, teams still need to verify what should remain unchanged and test the answer users actually see."
  - "A same-question repair retest rising from 9/11 to 11/11 describes one synthetic test set, not production impact or generalization."
audience:
  - "Engineers and architects building enterprise RAG, Agents, or knowledge systems"
  - "Technical leaders responsible for knowledge governance, review, and AI releases"
category: "Enterprise AI"
tags: ["RAG", "Enterprise AI", "AI Agent", "Evaluation", "Architecture Patterns"]
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 21
kind: "article"
showToc: true
image: "/blog/143-llm-wiki-knowledge-change-validation/title_image.webp"
---

On October 14, I spoke at [Hello World Dev Conference 2026 about the evolution of an LLM Wiki](https://hwdc.ithome.com.tw/2026/session/5018). Looking back at the talk, the idea I most want to preserve is not that an Agent can write Wiki pages. The harder engineering question is this: **when a source changes, what knowledge should change, what must remain, and how can we show that the new answer did not omit an important condition?**

I used a synthetic enterprise support scenario to walk through source and scope management, change impact analysis, answer regression, and human review. The exercise used no live enterprise data and did not publish a Wiki. It demonstrates a change-validation method that teams can adapt to their existing Agent or RAG projects.

## Talk Slides PDF

- [Download PDF: LLM Wiki — The Evolution of an Enterprise Knowledge Q&A System](/blog/143-llm-wiki-knowledge-change-validation/slides.pdf)

<div
  data-pdf-viewer
  data-src="/blog/143-llm-wiki-knowledge-change-validation/slides.pdf"
  data-title="LLM Wiki: The Evolution of an Enterprise Knowledge Q&A System"
  data-height="800px"
></div>

> **Huahua in one sentence**
>
> A knowledge update should test not only which files an Agent changed, but also which answers changed and which should have stayed the same.

## A new policy does not erase every old rule

The example was an employee account-recovery policy. The old policy sent people to an ExampleDesk service desk first. A new rule allowed eligible employees to try self-service recovery first, but only after its effective date and only when the employee, managed laptop, confirmed account lock, and enrollment conditions were met.

Events before the effective date or people outside the eligibility scope still followed the previous route. Missing information called for a follow-up question; failed or inconclusive self-service recovery needed a service-desk fallback. This is a problem of **conditional, partial replacement**. If a system retrieves the newest document and overwrites the old answer wholesale, it may give the wrong instructions to people outside the new rule’s scope.

This is also a version and applicability problem discussed in the [Enterprise RAG guide](/en/blog/65-enterprise-rag-guide/): retrieving relevant evidence completes only part of the task. The system must also decide whether that evidence applies to the situation at hand.

## Organize knowledge updates as Compile, Validate, and Review

I divide the knowledge lifecycle into three stages so a team can inspect ownership and responsibility.

**Compile** organizes sources, scope, and knowledge artifacts. In the exercise, Raw preserves source evidence, Wiki holds reusable rules and questions, and Ops records the knowledge scope and pending review. Linking sources, summaries, concepts, and queries makes it possible to trace an answer back to the document that supports it.

**Validate** assesses the change’s impact and measures answer behavior. A proposal should list not only pages to edit, but also files, questions, and source summaries that must remain unchanged. More importantly, it must test the answer shown to a user, not just a retrieval result or citation excerpt.

**Review** determines approval and release. An Agent can propose edits, check structure, and run regression tests, but a passing test does not replace review by the content owner. This follows the same control, evaluation, and human-governance principles in the [AI Agent guide](/en/blog/64-ai-agent-guide/): delegate verifiable work to the Agent and keep approval with an accountable owner.

## Impact analysis must find what changes and what stays

For the new policy, the Agent proposed editing four existing pages and adding one source summary. Five unrelated questions and six existing source summaries were designated as unchanged. That made “content that should not change” an explicit part of the check.

Yet finding the directly related pages was not enough. The Agent initially marked `ops/purpose.md` as retain. It preserved the old scope description but missed that the new knowledge scope had grown from six sources to seven. A maintenance Agent later found and corrected the mismatch. This shows why file-level change lists need review: governance settings can sit outside the obvious content-page dependencies.

Another lesson: an unchanged file does not guarantee an unchanged model answer. Regression testing must check both expected changes and preserved paths, not just the Git diff.

## The first regression failed even though the first step was right

For the account-lock question, the updated model chose the right first action—try self-service recovery—but omitted the full eligibility conditions and effective date from the answer. Another question followed the expected password-reset path yet left out the fallback of contacting the service desk when the corporate network was unavailable. Impact analysis, structural checks, and Agent review had passed, but answer regression failed. The draft therefore stopped before human review and was not published.

Adding another prompt rule was not the only issue. The evaluation itself needed governance: one v1 question demanded more than the user had asked, and the Model Judge once treated a source excerpt as if it appeared in the answer. The team opened a separate v2 question set and preserved the v1 result instead of rewriting the old score. **A frozen test set keeps measurements traceable; when the test or judge is flawed, create a new version and explain the difference.**

On the same v2 question set, Baseline scored 10/11 and the first Updated candidate scored 9/11. Both the knowledge snapshot and scenario date changed, so this was not a single-variable comparison and cannot show that the architecture made answers better or worse. After revising a general answer rule, the team reran the original v2 questions and scored 11/11. That was a same-question repair retest, not an independent holdout evaluation; the content owner still needed to decide whether eligibility details must appear in every answer.

> **Huahua's engineering note**
>
> 11/11 means that this synthetic question set passed on that retest. It does not prove safe automatic release for a real knowledge base or show that the system is more accurate than ordinary RAG.

## Bring Knowledge Change PRs to an existing system

I call this approach a **Knowledge Change PR**:

1. **Compile**: list the sources, versions, applicability conditions, and affected knowledge.
2. **Validate**: check the intended edits, required preservation, and user-visible answers; review the questions and judge as well.
3. **Review**: require approval from the content owner and define what blocks release.

You do not need to adopt a new Wiki platform first. Start with a knowledge-change checklist that records evidence, affected pages, regression questions, failure reasons, and the approval owner. If you are exploring Agent architecture, the [WeKnora architecture review](/en/blog/95-weknora-architecture/) shows how knowledge, retrieval, and Agent execution connect in a platform.

## Repositories to explore

- [`poirotw66/llm-wiki-example`](https://github.com/poirotw66/llm-wiki-example): a starter template for teams building a department-specific Wiki, with source archiving, knowledge structure, and governance workflows. Wiki content is intentionally blank by default; curate and admit data according to your own policies.
- [`Tencent/WeKnora`](https://github.com/Tencent/WeKnora): an open-source knowledge platform that brings document understanding, RAG, Agents, and a Wiki together on shared knowledge bases, useful for studying platform-level implementation and self-hosting options.

The first starts with a knowledge-base template that a team governs itself; the second offers a broader platform. Before choosing either, check that data permissions, source updates, answer evaluation, human approval, and operations fit your environment.

### Sources

- [Hello World Dev Conference 2026 session](https://hwdc.ithome.com.tw/2026/session/5018)
- [LLM Wiki example repository](https://github.com/poirotw66/llm-wiki-example)
- [Tencent WeKnora repository](https://github.com/Tencent/WeKnora)
