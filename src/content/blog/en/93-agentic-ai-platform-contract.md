---
title: "Agentic AI Platform Contract: The Control Plane You Must Wire Before Production"
description: "A copyable Agentic platform contract: what the platform provides, what projects must wire (E·P·J·T), seven non-bypass rules, and where the IT 100-question evidence stops."
pubDate: 2026-08-27
updatedDate: 2026-08-29
tldr:
  - "A platform contract is not a legal document; it is the interface projects use for the control plane—offers, obligations, prohibitions, and production gates on one page"
  - "Four capabilities must all be wired: Evidence, Policy, Judge, Trace; missing any one still means demo"
  - "Walk the published IT case through an E·P·J·T production review—not a hypothetical path"
  - "Public numbers only support runtime credibility on low-risk IT/process tasks—not that wealth advice or credit decisions can be fully automated"
audience:
  - "Platform and application teams shipping Agents / RAG"
  - "Architecture decision-makers who need a PoC gate, not another governance lecture"
category: "Enterprise AI"
tags: ["Enterprise AI", "Architecture Patterns", "Governance", "MCP", "RAG"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 2
kind: guide
showToc: true
subtitle: "After runtime runs and the control plane is explained — can this project actually go to production?"
image: "/blog/93-agentic-ai-platform-contract/title_image.webp"
---
If you have read the [platform engineering chapter](/en/blog/38-financial-genai-platform-engineering/) and the [governance chapter](/en/blog/39-enterprise-agentic-ai-governance/), one page is still missing: **when another team walks in with a PoC, what does the platform actually look at?**

038 answers how the runtime runs stably. 039 answers how the control plane governs, reuses, and audits. This article does not retell the six modules. It delivers a copyable **platform contract**: what is provided, what must be wired, what must not be bypassed, and where the numbers stop.

> **Huahua in one sentence**
>
> A platform contract is the control plane's user interface. Review a PoC by whether the contract is satisfied—not by how pretty the demo looks.

## Ninety-Second Map

| | |
| --- | --- |
| **Problem** | Governance ideas make sense, but projects still treat "ask a few live questions" as the production bar |
| **Core approach** | Collapse E·P·J·T into one page of contract: platform offers, project duties, prohibitions, and evaluation protocol |
| **Hardest evidence** | Same Agentic RAG stack, 100 IT/process tasks: weighted 98%, strict 96%, incorrect or unsafe 0, full-flow P95 6.19s (see 038 and the [case](/projects/agentic-rag/)) |
| **Where claims stop** | These numbers are runtime credibility on low-risk, high-frequency, well-defined process tasks. They are not wealth advice, credit, or compliance already safe to fully automate |

Accuracy is a property of the whole workflow, not a model feature. A larger model cannot offset missing evidence, policy, evaluation, or trace.

## Why a "Contract", Not Another Architecture Essay

Picture this scene—not the wealth manager asking about a fund.

Another team finishes a RAG demo and asks: "Can we go to production?" The answers sound reasonable; a manager nods. If the platform only hands them 039's module diagram, they will say "we already wired an LLM and search." You cannot stop them.

PoC stalls at three breakpoints 038 already named: system silos, linear RAG, black-box AI. The contract's job is to turn those breakpoints into **checklist conditions for a production review**.

So this document's reader is not "someone who wants to understand an Agentic OS," but "someone who must decide this sprint whether an Agent enters a real environment."

> **Huahua's engineering note**
>
> Keep claim, evidence, and inference apart. 98% is a measurement on an IT question bank; "therefore every financial firm should adopt this contract" is an inference. The latter can be debated; the former can only be checked against the bank and scoring protocol.

## What the Platform Provides—and Deliberately Does Not

| You get | You do not get |
| --- | --- |
| Controlled entry: Web / Teams / voice all pass Gateway and Auth first | A model chat window with no identity |
| Runtime: state-machine orchestration, branching, retries, failure handling | A single prompt owning routing, retrieval, and refusal |
| Knowledge layer: permission-scoped, citable, verifiable evidence | "If search finds it, treat it as evidence" |
| MCP tool bus: enterprise tools within authorized scope, every call leaving a Tool Trace | Every project wiring its own pile of APIs |
| Evaluation and regression: frozen question bank, four-level scoring, Judge aligned to human standards | A few live questions as acceptance |
| Trace: intent, path, evidence, tools, policy, score, latency, and refusal reason replayable | Storage of final answers only |

Scenes can change: IT support, ops knowledge, wealth-manager evidence assembly. What changes is task decomposition—not a brand-new bot. What actually reuses is the four capabilities in the next section, same as 039; the contract only makes them a must-wire interface.

## Projects Must Wire: E·P·J·T

Any Agent going to production must wire all four to the platform. Retrieval alone, or Trace alone, is still a demo.

**E — Evidence.** Answers may only cite evidence issued by the knowledge layer: source, permission scope, and credibility. Parse errors, chunking errors, and retrieval errors count as platform failures even if the model is strong—they must not be waved away as "model hallucination." If evidence is insufficient, rewrite and search again; if still insufficient, refuse or clarify. Answering because something "looks related" is forbidden.

**P — Policy.** Role permissions, PII filtering, refusal, and human escalation take effect before retrieval and generation. All three boundaries must be explicit: evidence, policy, human. In high-risk scenes (compliance, credit, internal control, complaints, sales suitability), AI may assemble evidence; it must not be the final decision-maker. Questions that should be refused must not enter retrieval; questions that need clarification must not force a search.

**J — Judge.** Pass frozen-bank regression before production. The Judge must align with human standards. Model swaps, routing changes, retrieval changes, and prompt edits all regress against the same bank. No regression means the change is not finished.

**T — Trace.** Every answer must leave at least intent, path, cited evidence, tool calls, policy judgment, quality score, latency, and refusal or escalation reason. When audit asks "why this answer," the system can replay—not reconstruct a story afterward.

What you govern is a responsibility map, not Agent count. Intent classification, query routing, evidence validation, and policy gates must be separately testable, replaceable, and observable. That need not equal N microservices, but boundaries must be clear. When an answer is wrong, you must be able to point to the wrong document, a rule that failed to block, answering despite weak evidence, or a Judge miss—not only say "the model is inaccurate."

## Seven Non-Bypass Rules

These seven rules are the contract's teeth. Break any one and the PoC does not enter production review.

1. Do not customize a one-off retrieval / tool / permission stack for a single scene to bypass MCP and the knowledge layer.
2. Do not ship linear RAG: Retrieve then Generate with no "is evidence sufficient?" step in between.
3. Do not ship a black box: no sources, no tool records, no replay.
4. Do not replace frozen-bank regression with a demo that "got it right" or "a larger model."
5. Do not fully automate high-risk decisions. Zero unsafe on the IT bank only means that bank had no incorrect or unsafe answers.
6. Do not call an LLM at every step. High-frequency FAQs, clear refusals, and rule-decidable routing use a deterministic fast path. Agentic value is controllable decisions—not a model at every node.
7. Do not let unauthorized clients hit the internal knowledge base by default. Default to public; internal requires explicit authorization.

## How One PoC Walks Through the Contract

What follows is not a hypothetical path. It is a **production review** of the **published [Agentic RAG IT case](/projects/agentic-rag/)**. Numbers, failure modes, and ablation match [038](/en/blog/38-financial-genai-platform-engineering/) and the case page—not a new experiment. Organization and internal system names are redacted or omitted.

### 1. Who Walks In, What They Want to Ship

An application team brings an "internal IT / process knowledge Q&A" PoC to review: OTP anomalies, account lockout (group vs LAN mix-ups), Wi-Fi SSID, portal vs VPN, and similar question types listed on the case page. Entry may be via REST, MCP, or n8n workflows, deployed on Cloud Run—interfaces already public on the case page. The PoC goal is colloquial process questions with sourced steps—not suitability, credit, or compliance decisions.

### 2. What the Platform Looks at Through the Contract

Review does not count how many of ten live questions were correct, and does not score demo polish. It checks whether E·P·J·T are all wired, whether any of the seven prohibitions were bypassed, and whether a frozen bank plus Judge calibration records can be submitted. The contract separates "can answer" from "can go to production."

> **Huahua's engineering note**
>
> Ten live questions are demo acceptance. A frozen 100-question regression is contract acceptance. They are not interchangeable.

### 3. How the Four Gates Pass

#### E — Evidence

After hybrid retrieval (vector + BM25 + RRF), document grading and context validation run before generation. Insufficient evidence triggers a query rewrite or refusal.

One failure mixed “group account lock” and “LAN account lock” into the same context. The response looked plausible while pointing to the wrong system. The contract classifies this as an **Evidence failure**, not a generic “model hallucination”; fixes include document grading, focus context, and cross-topic trimming.

#### P — Policy

Routing is rule-first: high-confidence FAQs can be answered directly, refusal cases never enter retrieval, and missing system scope triggers clarification. For example, “account locked” must be narrowed to group, LAN, or VPN.

The 100-question bank covers low-risk IT and process work, **not** high-risk decisions. P shows that refusal and routing worked in this case; it does not prove that wealth advice or credit decisions can be automated.

#### J — Judge

The case uses a frozen 100-question bank, four-level scoring, and a human-calibrated Judge. v22 reports 98.0% weighted accuracy, 96.0% strict accuracy, and zero incorrect or unsafe answers: 96 fully correct and four partially correct.

Ablation results are 87% for Naive RAG, 83.5% for Hybrid-only, and 98% for the full Agentic workflow. The evidence here is **regression, ablation, and zero unsafe results**, not live-demo impressions; the next section defines the detailed production gate.

#### T — Trace

The public case shows a LangGraph state machine, `query_analysis_source = rule | llm`, Prometheus metrics, and a full-flow P95 of 6.19 seconds with governance intact. These support an observable design.

The public pages do not publish Trace field dumps or sample logs, so they do not establish that every required field is complete. A real production review must still sample replay records for intent, path, evidence, tools, policy, score, latency, and refusal reason.

### 4. What Deliverables Get Blocked

Mapped to the seven prohibitions, this PoC would not enter production review if changed to any of the following:

- **Linear RAG** (Retrieve → Generate with no "is evidence sufficient?" step)—rule 2; ablation already shows Naive 87%, Hybrid-only 83.5%, below full Agentic 98%
- **Demo ten questions only**, no frozen bank or refusal items—rule 4
- **An LLM at every step**, no rule-first fast path—rule 6; the case's later rule-first path averaged 2.606s with P95 5.636s, showing not every node needs a model
- **Trace storing final answers only**, no path or evidence replay—rule 3

### 5. What This PoC Proves—and Does Not

It proves **runtime credibility on low-risk, high-frequency, well-defined IT tasks**—with E·P·J·T intact, accuracy can move from 87% to 98% with 0 incorrect or unsafe answers.

It does **not** prove suitability, credit, KYC, or compliance can be fully automated. Those scenes still need human boundaries; pasting 98% into a high-risk launch report itself violates the contract.

## Production Gate: The Public Evaluation Protocol

The following comes from a frozen bank of **100 low-risk IT/process tasks**, already written in 038 and the case page. This is not a company-wide SLA. New scenes must bring an equivalent bank, or expand the platform bank first.

Four-level scoring: correct / partially correct / correct refusal (safe behavior, not a failure) / incorrect or unsafe (zero tolerance).

| Gate | Public measurement | How the contract uses it |
| --- | --- | --- |
| Incorrect or unsafe | 0 questions | New scenes must also be 0 |
| Weighted accuracy | 98.0% (v22) | Do not count partial as "fully correct"; disclose question-type mix |
| Strict accuracy | 96.0% | Disclose separately |
| Full-flow P95 | 6.19s (including retrieval, validation, rewrite, refusal, Trace) | Measure with governance intact; do not strip validation for speed |
| Ablation | Naive RAG 87%; Hybrid Search only 83.5%; full Agentic 98% | Explain that quality comes from validation and refusal, not recall alone |
| Judge | All 100 questions human-calibrated | Calibrate a new Judge before it becomes a gate |

A later rule-first path in the case moved high-confidence FAQs out of LLM analysis, bringing average latency to 2.606s and P95 to 5.636s. That shows rule 6—"do not use a model at every step"—is not a slogan; latency and governance can hold together.

After operational launch, SLOs must at least cover quality, performance, governance, cost, plus Trace completeness. Missing a class means not operational.

## How Scenes Enter the Platform

| Stage | Allowed | Not yet allowed |
| --- | --- | --- |
| Validated: IT/process Q&A | Baseline for runtime credibility; reuse E·P·J·T | Paste 98% into a high-risk business launch report |
| Extendable: support knowledge, ops queries | Swap knowledge scope and policy tables on the same control plane | Spin up a separate RAG stack |
| Needs human boundary: suitability, KYC, compliance, internal control, credit | AI verifies, organizes constraints, escalates to humans | Model issues investment advice or approvals directly |

Production applications submit: a responsibility map (per-step inputs/outputs/failure definitions), knowledge scope and permissions, policy tables, frozen bank and Judge calibration records, Trace sample replay, and SLO commitments.

## Fields Others Must Fill to Copy This Contract

A public article cannot name each company's people or systems. If you hang this contract on your own platform, these fields must have Owners—blank is not allowed:

- Platform Owner and backup
- Who may approve exemptions to the "seven non-bypass" rules
- Data classification and matching knowledge bases (at least internal / public)
- Production SLOs (written separately from benchmarks)
- The current authoritative MCP tool list and Agent Registry entry point
- Named human roles for high-risk scenes
- Question-bank custody location and change rules (who may edit questions; which version must be re-frozen after edits)

These fields are conditions for executing the contract, not optional appendix.

## Close

Remember three things.

Technical idea: the platform contract is the control plane's user interface; E·P·J·T must all be wired.

Hardest evidence: the same workflow on 100 IT/process tasks hit weighted 98% with 0 incorrect or unsafe; strip validation and refusal and accuracy falls back to 87% or 83.5%.

Adoption boundary: this contract can stop a "demo that answers"; it cannot authorize fully automated high-risk financial decisions. Zero unsafe is not complete safety.

| Layer | 038 Runtime | 039 Control Plane | This contract |
| --- | --- | --- | --- |
| Core question | How to run stably | How to govern, reuse, audit | Can this PoC go to production |
| Deliverable | Operational AI Capability | Agentic Operating System | One page of checkable interface |

- Fast is an experience problem.
- Accurate is a trust problem.
- Refusable, traceable, and auditable is the financial AI production problem.
- **Checkable** is the problem of how the platform speaks clearly to other teams.

## FAQ

### How is this different from 039?

039 explains what the control plane is and why responsibilities are split. This piece collapses the same thing into an interface project teams must obey. Read 039 to agree on architecture; read this to decide whether this week's gate passes.

### Why are the evaluation numbers still those 100 questions?

Because that is the currently public evidence with a clear protocol, ablation, and human calibration. If the contract reported a separate "business accuracy" without protocol, it would mix claim and evidence. High-risk question types should expand the bank—not reuse 98% as a passport.

### Can a small team use this without an Agent Registry?

Yes. Start with the four capabilities and seven prohibitions. A Registry can be a table; it need not be microservices first. Form can be flexible; boundaries must be clear.

### Is this leaked internal policy?

No. The article names no organization, system inventory, or unpublished SLO. Numbers and failure modes already appear in 038, 039, and the case page. Each company still must fill the Owner fields in the previous section to land the contract.

### Is this PoC walkthrough real?

Yes. The walkthrough in the previous section uses the published IT case—not a new experiment. Numbers and failure modes match 038 and the [Agentic RAG case page](/projects/agentic-rag/).

## Series Reading

- **Runtime**: [Financial GenAI Platform Engineering](/en/blog/38-financial-genai-platform-engineering/)
- **Control Plane**: [Financial-Grade Enterprise Agentic AI Architecture Design](/en/blog/39-enterprise-agentic-ai-governance/)
- Related on this site: [Agentic RAG Project](/en/projects/agentic-rag/) · [Agentic AI Platform](/en/projects/agentic-ai-platform/) · [Realtime Voice AI](/en/projects/realtime-voice-ai-project/)

## Contract Sources and Usage Boundary

E·P·J·T and the seven non-bypass rules are a Bloss0m production interface derived from public standards and this site's case evidence; they are not a compliance standard issued by an external body. Adopters must still complete formal review for their jurisdiction, data classification, and risk ownership.

- [NIST AI 600-1: Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) — generative-AI risk and governance context
- [Model Context Protocol architecture](https://modelcontextprotocol.io/specification/2025-06-18/architecture) — protocol context for MCP authorization, isolation, and capability negotiation
- [OpenTelemetry: Generative AI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — interoperability reference for Trace field design
- [Agentic RAG case](/en/projects/agentic-rag/) — first-party evidence for the E·P·J·T walkthrough figures and failure modes
