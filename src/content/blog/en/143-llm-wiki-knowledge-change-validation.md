---
title: "LLM Wiki Knowledge Updates: Turning Agent Proposals into Verifiable Knowledge Change PRs"
description: "A synthetic enterprise knowledge update exercise shows how to combine source tracking, impact analysis, answer regression, and human approval into a governed knowledge change lifecycle."
pubDate: 2026-10-14
updatedDate: 2026-10-15
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

Turning the rule into testable conditions gives us several paths:

| Scenario | Expected handling | Knowledge to verify |
| --- | --- | --- |
| On or after March 1, 2030, a full-time employee uses a managed laptop, has a confirmed account lock, and is enrolled in self-service recovery | Try self-service recovery first | The answer includes the effective date and all eligibility conditions |
| The event is before the effective date, or the person is ineligible | Keep the previous ExampleDesk route | The new rule has not erased the old process for everyone |
| Employee status, device management, or enrollment is unknown | Ask for the missing information | Do not guess which side of the eligibility boundary applies |
| Self-service recovery fails or its result is unclear | Escalate to ExampleDesk | Preserve an actionable fallback |

This table translates the synthetic policy into regression cases; it does not mean the original exercise tested every combination. In a real deployment, a content owner must decide which conditions belong in every answer and which can come from approved identity or device data.

This is **conditional, partial replacement**, not a newest-document-wins rule. An eligible new case may change its first step while historical and ineligible paths must be preserved and regression-tested.

This is also a version and applicability problem discussed in the [Enterprise RAG guide](/en/blog/65-enterprise-rag-guide/): retrieving relevant evidence completes only part of the task. The system must also decide whether that evidence applies to the situation at hand.

## Why move from RAG toward Knowledge Compilation?

Organizations already use Wikis for procedures, FAQs, and technical documentation. The difficult work begins when a source changes: someone must organize the new information, find stale pages, and resolve rules that conflict. LLMs and Agents can automate parts of that maintenance, but generating pages faster does not ensure completeness, correct applicability, or safe coexistence between old and new versions.

A typical RAG pipeline chunks documents and builds an index ahead of time. When a question arrives, it retrieves and may rerank relevant passages before a model drafts an answer. RAG can answer directly from sources, but when old and new rules coexist, the system still needs to resolve version, conditions, and exceptions. If it performs that synthesis anew for every question, the interpretation work happens on demand each time.

Knowledge Compilation moves some reusable organization to the source-update stage: establish effective dates, eligibility, exceptions, and retained legacy paths, then store reviewed, traceable knowledge. It can work alongside RAG. This exercise did not compare accuracy, cost, or latency, and does not prove compiled knowledge is inherently better. The distinction is where responsibility sits: which judgments happen during updates and which remain at query time.

## Organize knowledge updates as Compile, Validate, and Review

I divide the knowledge lifecycle into three stages so a team can inspect ownership and responsibility.

**Compile** organizes sources, scope, and knowledge artifacts. In the exercise, Raw preserves source evidence, Wiki holds reusable rules and questions, and Ops records the knowledge scope and pending review. Linking sources, summaries, concepts, and queries makes it possible to trace an answer back to the document that supports it.

These layers represent **dependencies rather than folder labels**: a Raw-source change may update Wiki's Concepts and Queries and may also invalidate Ops scope and review ownership.

**Validate** assesses the change’s impact and measures answer behavior. A proposal should list not only pages to edit, but also files, questions, and source summaries that must remain unchanged. More importantly, it must test the answer shown to a user, not just a retrieval result or citation excerpt.

**Review** determines approval and release. An Agent can propose edits, check structure, and run regression tests, but a passing test does not replace review by the content owner. This follows the same control, evaluation, and human-governance principles in the [AI Agent guide](/en/blog/64-ai-agent-guide/): delegate verifiable work to the Agent and keep approval with an accountable owner.

## Impact analysis must find what changes and what stays

For the new policy, the Agent proposed editing four existing pages and adding one source summary. Five unrelated questions and six existing source summaries were designated as unchanged. That made “content that should not change” an explicit part of the check.

Yet finding the directly related pages was not enough. The Agent initially marked `ops/purpose.md` as retain. It preserved the old scope description but missed that the new knowledge scope had grown from six sources to seven. A maintenance Agent later found and corrected the mismatch. This shows why file-level change lists need review: governance settings can sit outside the obvious content-page dependencies.

Another lesson: an unchanged file does not guarantee an unchanged model answer. Regression testing must check both expected changes and preserved paths, not just the Git diff.

This is the change's **blast radius**: one new source can affect several direct pages and also the source count, scope, and review responsibilities recorded in Ops. A practical proposal can ask the Agent for two lists: an **expected-change list**, with why each page is affected and which source passage supports it; and an **expected-retain list**, naming pages that should stay unchanged and the regression questions that cover them. A maintainer should review both before answer testing. This workflow is an inference from the exercise, not evidence that the exercise found every dependency.

## The first regression failed even though the first step was right

### A timeline for four measurements, not one rising score

| Run | Result | What it supports | What it cannot establish |
| --- | --- | --- | --- |
| v1 Baseline | 8/10 on ten v1 questions | Initial snapshot on the original contract | Direct comparison with v2 |
| v2 Baseline | 10/11 on eleven v2 questions | Baseline on the revised set | Single-variable comparison with Updated |
| v2 Updated | 9/11 on eleven v2 questions | Two updated answers missed required criteria | A model or architecture regression |
| v2 Revised | 11/11 on the same v2 questions | Same-question retest after revision | Holdout generalization, production readiness or approval |

**The v1 and v2 contracts differ.** Even within v2, Baseline and Updated change both the knowledge snapshot and scenario date; these numbers are not one continuous accuracy curve.

The exercise began with six source documents, which produced eighteen draft Wiki pages and seventeen source-grounded claims. The team then froze ten questions as the v1 evaluation set. The v1 Baseline passed 8/10. That score describes one knowledge snapshot against those ten questions; it is not “the accuracy of LLM Wiki,” and it cannot be compared directly with the later v2 score because v2 used eleven different questions.

For the account-lock question, the updated model chose the right first action—try self-service recovery—but omitted the full eligibility conditions and effective date from the answer. Another question followed the expected password-reset path yet left out the fallback of contacting the service desk when the corporate network was unavailable. Impact analysis, structural checks, and Agent review had passed, but answer regression failed. The draft therefore stopped before human review and was not published.

Adding another prompt rule was not the only issue. The evaluation itself needed governance: one v1 question demanded more than the user had asked, and the Model Judge once treated a source excerpt as if it appeared in the answer. The team opened a separate v2 question set and preserved the v1 result instead of rewriting the old score. **A frozen test set keeps measurements traceable; when the test or judge is flawed, create a new version and explain the difference.**

More specifically, a v1 question asked about a subsidiary accessing a resource over VPN, while the judging criteria also required the headquarters flow. That could mark an answer incomplete even when it addressed the user's question. In another case, the Judge treated a retrieved source excerpt as if it were part of the user-visible answer, giving credit for content the model never actually said. These failures need different fixes: tighten the question's evaluation scope, and make the Judge score only the final answer while requiring evidence locations for each required condition.

The evaluation suite also needs version history: preserve the questions, expected answer points, Judge instructions and version, knowledge snapshot, and scenario date. If any of these change, document the difference rather than applying revised rules retroactively to old results. An automated Judge can help triage, but when its evidence source or scoring logic is in doubt, humans still need to sample results and inspect traceable rationales.

On the same v2 question set, Baseline scored 10/11 and the first Updated candidate scored 9/11. Both the knowledge snapshot and scenario date changed, so this was not a single-variable comparison and cannot show that the architecture made answers better or worse. After revising a general answer rule, the team reran the original v2 questions and scored 11/11. That was a same-question repair retest, not an independent holdout evaluation; the content owner still needed to decide whether eligibility details must appear in every answer.

Failure analysis must return to the answer itself. SYN-01 chose the right first action but omitted the effective date and full eligibility criteria. SYN-06 followed the main password-reset path but omitted the service-desk fallback when the corporate network was unavailable. These differ from a wholly incorrect answer: the main action was right, but missing conditions or exceptions could still prevent safe task completion. Regression specs should therefore define required conditions, prohibited assumptions, and fallback paths for each question, rather than checking only a keyword or first step.

> **Huahua's engineering note**
>
> 11/11 means that this synthetic question set passed on that retest. It does not prove safe automatic release for a real knowledge base or show that the system is more accurate than ordinary RAG.

## Bring Knowledge Change PRs to an existing system

### A concrete Knowledge Change PR example

This is an **editorial template based on the existing synthetic exercise**, not a new experiment or a published release.

| Review field | What this case should record |
| --- | --- |
| Source | SRC-07, effective 2030-03-01, with cited passage and earlier version |
| Proposed change | Eligible account-lock cases start with self-service recovery |
| Applicability | Full-time employee, managed laptop, confirmed lock, enrolled self-service, applicable date |
| Must retain | Pre-effective-date and ineligible paths use ExampleDesk; missing facts trigger clarification; failures have a fallback |
| Impact | Four edited pages, one added source summary, and recheck of ops/purpose.md |
| Regression | SYN-01 for new conditions/date; SYN-04 for historical path; SYN-06 for fallback after network failure |
| Release gate | Save the user-visible answer, rubric and versions; do not publish without content-owner approval |

SYN-04 identifies the existing historical-preservation test's role; this template does not invent a new case score or claim a production release.

I call this approach a **Knowledge Change PR**:

1. **Compile**: list the sources, versions, applicability conditions, and affected knowledge.
2. **Validate**: check the intended edits, required preservation, and user-visible answers; review the questions and judge as well.
3. **Review**: require approval from the content owner and define what blocks release.

You do not need to adopt a new Wiki platform first. Start with a Knowledge Change PR template that requires each update to record:

- **Source and version**: source identifier, version or commit, effective date, cited passage, and accountable owner.
- **Applicability**: eligibility conditions, exceptions, what to ask when information is missing, and how to return to the previous process after failure.
- **Impact list**: nodes to add or change, supporting sources, and pages that must remain unchanged with the reason.
- **Regression evidence**: test-set version, knowledge snapshot, scenario date, user-visible answer, required-condition checks, and failure analysis.
- **Release approval**: content owner, release-blocking criteria, version to publish, and rollback path.

Keep these records alongside the draft and test output so reviewers can inspect the source-to-answer chain and revert when needed, instead of judging only how many files the Agent generated. If you are exploring Agent architecture, the [WeKnora architecture review](/en/blog/95-weknora-architecture/) shows how knowledge, retrieval, and Agent execution connect in a platform.

## Repositories to explore

- [`poirotw66/llm-wiki-example`](https://github.com/poirotw66/llm-wiki-example): a starter template for teams building a department-specific Wiki, with source archiving, knowledge structure, and governance workflows. Wiki content is intentionally blank by default; curate and admit data according to your own policies.
- [`Tencent/WeKnora`](https://github.com/Tencent/WeKnora): an open-source knowledge platform that brings document understanding, RAG, Agents, and a Wiki together on shared knowledge bases, useful for studying platform-level implementation and self-hosting options.

The first starts with a knowledge-base template that a team governs itself; the second offers a broader platform. Before choosing either, check that data permissions, source updates, answer evaluation, human approval, and operations fit your environment.

### Sources

- [Hello World Dev Conference 2026 session](https://hwdc.ithome.com.tw/2026/session/5018)
- [LLM Wiki example repository](https://github.com/poirotw66/llm-wiki-example)
- [Tencent WeKnora repository](https://github.com/Tencent/WeKnora)
