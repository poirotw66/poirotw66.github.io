---
title: "Financial AI Engineering Platform Engineering: Building Operational Agentic AI with Cloud-Native Architecture"
description: "Summary of my Cloud Summit sharing: Three lifelines for financial AI deployment, why PoCs get stuck, the three-tier architecture of Cloud Native AI Runtime, MCP tool governance, Hybrid Search and Agentic RAG, and why accuracy is a workflow property rather than a model feature."
pubDate: 2026-07-01
updatedDate: 2026-07-01
tldr:
  - "Summary of my Cloud Summit sharing: Three lifelines for financial AI deployment, why PoCs get stuck, the three-tier architecture of Cloud Native AI Runtime, MCP tool governance,…"
  - "From field IT reality — an engineering path for deployment, scaling, monitoring, and finance-grade trustworthy answers"
audience:
  - "Enterprise AI / platform engineers and technical leads"
  - "Decision-makers who need deployable architecture, governance, and risk trade-offs"
category: "Enterprise AI"
tags: ["Enterprise AI","Architecture Patterns","MCP","Agentic RAG","Cloud Native"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 1
kind: guide
showToc: true
subtitle: "From field IT reality — an engineering path for deployment, scaling, monitoring, and finance-grade trustworthy answers"
image: "/blog/38-financial-genai-platform-engineering/title_image.jpg"
---
![Financial AI Engineering Platform Engineering](/blog/38-financial-genai-platform-engineering/title_image.jpg)

Over the past year, creating GenAI demos has become relatively easy. But the real challenge for the financial industry lies in: **how AI enters the actual operational environment**—can it be deployed, scaled, and monitored; can it refuse to answer when there is insufficient evidence; can it stably support users from Web, Teams, and voice; can it leave an auditable trail?

These questions cannot be answered by a single model, but are questions that **platform engineering** must answer. This article summarizes my sharing at Cloud Summit: **how to use a cloud-native architecture to engineer generative AI into a governable, observable, and verifiable financial-grade Agentic AI platform**.

> **Huahua's engineering note**
>
> A PoC proves that a model can complete a task. A production platform must also prove it can be deployed, observed, stopped, audited, and recovered. Without those properties, it is a demo—not an operable system.

> This article focuses on **how to keep the platform running stably** (Runtime, deployment, monitoring, RAG workflow). For the governance perspective of enterprise-level Control Plane, responsibility decomposition, and Agentic Operating System, please refer to the next article in the series: [Financial-Grade Enterprise Agentic AI Architecture Design](/blog/39-enterprise-agentic-ai-governance/).

## Slide PDF

- [Download PDF: Financial AI Engineering Platform Engineering](/blog/38-financial-genai-platform-engineering/slides.pdf)

<div
  data-pdf-viewer
  data-src="/blog/38-financial-genai-platform-engineering/slides.pdf"
  data-title="Financial AI Engineering Platform Engineering"
  data-height="800px"
></div>

---

> **花花的一句話**：喵～要把 AI 送上金融業的正式舞台，光會賣萌是不夠的，還要有雲端原生架構當作最堅固的貓爬架才行！
>
> **花花的工程提醒**：PoC 只能證明模型能力，企業級平台必須將重點放在部署、擴展、監控以及拒答機制的工程化落地上，才能真正上線營運。

## Starting from a Field Operation Scene

Imagine this: a field colleague is providing on-site support at a client's location when they suddenly encounter an IT issue—permission request blocked, device unable to connect, or an error message pops up on the screen and they don't know who to contact.

At this moment, it is not suitable for them to stop and type to search for documents, nor can they wait for lengthy replies. In front of the client, they can only ask a question via voice: "Who should handle this error message?"

The user's need is very clear: **immediate response is required**. But the financial industry's requirements go beyond this. The AI's answer cannot stop at just seeming reasonable; the system must verify internal knowledge, assess whether the evidence is sufficient; clearly refuse to answer when insufficient, and leave a tracing record throughout the entire process.

This tests not whether a chatbot can answer questions, but whether **AI can truly enter the operational environment**.

---

## Three Lifelines for Financial AI Deployment

For financial AI to be deployed, it must simultaneously meet three operational conditions:

| Condition | Challenge | What the platform needs to answer |
| ---- | ---- | -------------- |
| **Integration** | Knowledge bases, permissions, ITSM, M365, and process documents are siloed | Can the Agent call enterprise systems and knowledge sources in a consistent manner? |
| **Real-time Performance** | Voice and field operations cannot tolerate a wait of over ten seconds | How can retrieval, validation, and rewriting in high-quality RAG be completed within acceptable latency? |
| **Compliance** | Auditing asks "why did it answer this way?" | What data was checked, what tools were called, and is it trackable and replayable? |

The challenge of financial AI does not lie in the inability to build AI, but in whether it can **simultaneously pass these three conditions**. This depends on platform capabilities, rather than simply upgrading model scale.

---

## Why Do AI Projects Often Get Stuck at PoC?

Most AI projects are not fruitless, but they remain at the PoC stage. There are three common breakpoints:

**1. System Silos**  
Each scenario requires custom integration, making it difficult for Agents to use enterprise tools at scale; with every additional scenario, integration costs increase by another layer.

**2. Linear RAG**  
Generating directly after Retrieving may seem reasonable in process, but the system cannot judge whether the retrieved data is sufficient, lacking self-correction and evidence checking.

**3. Black Box AI**  
Unable to explain data and tool sources, auditing and compliance will directly block the launch. The financial industry cannot just accept AI answering "I think so".

These three breakpoints cannot be solved by changing models, but require platform engineering—**standardizing tools, making processes self-correcting, and leaving a trail for every answer**.

---

## Cloud Native AI Runtime: Three-Tier Architecture

To truly launch, the primary issue is not the model, but the **runtime**—this Agentic AI must be able to be deployed, scaled, monitored, and governed.

I consolidate the architecture into a three-tier understanding:

### Tier 1: Controlled Entry

Users can enter from Web, Teams, or Mobile Voice, but all must go through the **API Gateway and Auth**, handling SSO, permissions, and rate limiting. The AI entry point for the financial industry is a controlled entry, not an open entry.

### Tier 2: Runtime Orchestration

The **Agent Orchestrator** runs on Cloud Run (or a similar containerized runtime) and is responsible for intent routing, Agent coordination, context validation, and response generation. Underneath it connects to the Retrieval Service of Hybrid Search and the **MCP Tool Hub**, enabling the Agent to call enterprise tools in a consistent manner.

### Tier 3: Observability and Governance

From day one of launch, it must be able to log, measure, trace, and leave an audit trail. Externally, it manages four things with **SLO**:

- **Latency** — Can it sustain voice and on-site interactions?
- **Error Rate** — Is the service stable?
- **Refusal Rate** — Where should knowledge be supplemented, where should boundaries be adjusted?
- **Trace Completeness** — Can every decision path be replayed?

The value of Cloud Native is not in "putting AI on the cloud", but in allowing AI services to be **managed with SLOs, audited with Traces, and scaled through Runtime**.

---

## MCP: Turning Enterprise Tools into Governable Capabilities

If every AI project re-integrates APIs, it's just renaming the system integration problem—forming API Spaghetti, where every additional scenario adds a layer of custom costs.

The value of **MCP (Model Context Protocol)** lies in encapsulating internal systems, M365, databases, and IT processes into standardized tool interfaces. The Agent calls them in a consistent manner, and every Tool Calling leaves a **Tool Trace**.

For the financial industry, tool usage is not free exploration, but tracked, governable usage limited within authorized scopes. MCP makes tools a **platform capability**, rather than custom code for a specific project.

---

## Data Engineering and Hybrid Search: The Ceiling of RAG

Data quality determines the ceiling of RAG. If the data is not clean, even the most powerful model will struggle to produce credible answers. Financial industry documents cover PDFs, scanned copies, tables, process manuals, and error codes; a single parser cannot cover all formats.

In practice, we adopt **hybrid parsing**: text-heavy documents are processed with fast parsing, scanned copies through Vision APIs, paired with **Semantic Chunking** to preserve context, avoiding cutting the same segment of business logic too finely.

For retrieval:

- **Embedding** excels at semantic similarity and synonymous rewriting—especially effective when user queries differ from document phrasing.
- **BM25** excels at precise matching of system names, process codes, and proper nouns.
- Finally, use **RRF (Reciprocal Rank Fusion)** for rank fusion, making the two complement each other.

The first step of financial-grade RAG is not generation, but enabling the Agent to obtain **verifiable evidence**.

---

## From Linear RAG to Agentic RAG

The traditional RAG process is straightforward: Retrieve, then Generate.

But the financial industry cannot just rely on a unidirectional process. The model finding data does not mean the data is sufficient to answer; data seeming relevant does not mean it constitutes correct evidence.

**Agentic RAG** changes to a dynamic workflow:

1. Route to the correct data source.  
2. Hybrid search.  
3. Validate if evidence is sufficient—if not, rewrite the query and retrieve another round.  
4. Refuse to answer or guide to supplement when necessary.  
5. Leave an Agent Trace throughout the entire process.  

Its core difference lies in: this is not a one-time retrieval, but a **self-correcting workflow**.

For more detailed context on Agentic RAG, you can refer to my previous summary: [Agentic RAG: Vector Search Meets Agentic Reasoning](/blog/07-agentic-rag/).

---

## Financial-Grade Accuracy: A Safe Trust Boundary

In financial scenarios, AI answering incorrectly can constitute compliance risks. Therefore, financial-grade accuracy does not mean answering every question, but **every answer must be supported by evidence**.

The decision logic can be simplified as:

- Evidence sufficient → Answer  
- Insufficient → Rewrite query and re-retrieve  
- Still insufficient after multiple rounds → Refuse to answer or guide to supplement  
- High-risk task → Enter human-in-the-loop  

Every judgment must leave an **Agent Trace**—not just the final answer; the question, retrieval sources, tool calls, and decision path should all be replayable.

The value of Agentic AI is not in complete autonomy, but in **operating autonomously within controllable boundaries**.

---

## Golden Quote: Accuracy is a Workflow Property, Not a Model Feature

> **Accuracy is not a model feature. It is a workflow property.**

Accuracy cannot be solved solely by upgrading the model scale. Each workflow node eliminates a source of error:

| Node | Risk Mitigated |
| ---- | ---------- |
| Route | Finding the wrong data source |
| Hybrid Search | Missing evidence retrieval |
| Validate | Hallucination and overconfidence |
| Rewrite | Failure of first-round retrieval |
| Trace | Unauditable |

Financial-grade AI's accuracy does not rely on the model producing a perfect answer in one go, but on a **verifiable, observable, trackable, and improvable workflow**. For a Cloud Native AI platform, AI quality must be continuously monitored, regressed, and improved on the platform.

---

## Evaluation: Define "Correctness" First, Then Talk About Accuracy Rate

In the financial industry, one cannot simply claim "high accuracy rate"; the scoring method must first be defined. We base it on a **100-question RAG Benchmark**, adopting a four-level scoring system:

| Level | Definition |
| ---- | ---- |
| **Correct** | Complete hit, no incorrect information |
| **Partially Correct** | Direction is correct but details are insufficient (counted in weighted accuracy rate) |
| **Correctly Refused** | Clearly refused when evidence is insufficient or it should not answer—this is safe behavior, not a failure |
| **Incorrect or Unsafe** | Inconsistent with correct answers, misquoted, or answered when it shouldn't have—**zero tolerance** |

The accuracy rate is not just the correct answer rate, but must measure whether it can **avoid incorrect and unsafe answers**.

---

## Real-Environment Evaluation Data

The 100-question Benchmark covers high-frequency FAQs, synonymous rewriting, questions that should be refused, trap questions, and boundary questions.

The scope of application must be stated first: this is not claiming AI can handle all high-risk financial decisions, but rather verifying the credible answering capability of Agentic Runtime in **low-risk, high-frequency, clearly processed IT tasks**.

| Metric | Result |
| ---- | ---- |
| Weighted Accuracy Rate | **98%** |
| Strict Correctness Rate | **96%** (96 completely correct, 4 partially correct) |
| Incorrect or Unsafe Answers | **0 questions** |
| Complete Agentic Workflow Avg Latency | **3.56 seconds** |
| P95 Latency | **6.19 seconds** (including retrieval, validation, rewriting, refusal judgment, and Trace) |

Ablation is worth noting:

| Setup | Accuracy Rate |
| ---- | ------ |
| Naive RAG | 87% |
| Hybrid Search Only | 83.5% |
| Complete Agentic RAG | **98%** |

**Recalling more documents does not mean higher accuracy**—the key is the validate and refusal after retrieval, not the search itself. This echoes what was mentioned earlier: accuracy is a workflow property, not a model feature.

High-frequency FAQs can take the fast path; boundary questions and permission questions go through the complete validation process. The P95 6.19 seconds is an operational figure **preserving governance mechanisms**, not an ideal value after removing safety checks.

---

## Practical Verification: Moving Towards Real-Time Voice Support

Back to the opening field scenario—unable to type, unable to wait long, needing voice guidance.

We chose **IT Information Services** as the first landing scenario, not because it is simple, but because it simultaneously covers: cross-system querying, permission control, real-time response, standard processes, and safe refusal—the typical challenges of financial-grade AI deployment are all within it.

P95 6.19 seconds and zero unsafe answers mean this set of capabilities has been embedded into the runtime, completed latency measurement, left traces, and started entering an **operational state**. It is not just a single-point IT bot, but a **platform capability verification** that can be extended to customer service, compliance, internal control, and operational knowledge querying.

---

## Conclusion: From AI Demo to Operational AI Capability

A demo shows model capability; production requires platform capability—**able to integrate, sufficiently accurate, controllable, and visible**.

- **Speed** is an experience issue.  
- **Accuracy** is a trust issue.  
- **Able to refuse, trackable, and auditable** are the real issues of financial AI deployment.

In the next stage of financial industry AI, the competition is not about whose demo is more dazzling, but who can engineer it into an operational **Operational AI Capability**.

---

## Frequently Asked Questions

### Why choose IT support instead of directly choosing a financial business scenario?

IT support covers the typical challenges of financial-grade AI deployment: cross-system querying, permission control, standard processes, real-time response, safe refusal, and Agent Trace. Once these capabilities are platformized, they can be reused for customer service, compliance, internal control, wealth manager support, and operational knowledge querying.

### Is P95 6.19 seconds too slow for voice interaction?

This figure must be understood under the complete Agentic RAG workflow—including route, hybrid search, validate, necessary rewrite, safe refusal, and trace. In practice, not every question goes through the full process; high-frequency FAQs go through cache or fast path, while only boundary questions go through full validation.

### Why is Hybrid Search Only lower than Naive RAG?

Hybrid Search increases the recall rate, but recalling more does not mean higher accuracy. In questions that should be refused or boundary questions, content with similar keywords but irrelevant contexts may cause the model to mistakenly judge that the evidence is sufficient. The key is the validate, rewrite, refusal, and boundary routing **after** the search.

### What is the greatest value of MCP in the financial industry?

Standardizing, governing, and making enterprise internal tools trackable. The Agent must use tools within the authorized scope, and every tool calling must leave a trace.

---

## Next in the Series

This article discusses **how the platform runs stably**. If you care about how an enterprise governs the same set of capabilities into an auditable **Agentic Operating System** (Control Plane, responsibility decomposition, E·P·J·T framework) that can be reused across scenarios, please continue reading the next article in the series:

→ **[Financial-Grade Enterprise Agentic AI Architecture Design: From Demo to Agentic Operating System](/blog/39-enterprise-agentic-ai-governance/)**

---

## Extended Reading

- [Agentic RAG: Vector Search Meets Agentic Reasoning](/blog/07-agentic-rag/)
- [OpenAI Deployment Simulation: The Gap Between Offline Evaluation and Real Deployment](/blog/25-deployment-simulation/)
- [Model Context Protocol (MCP)](/blog/34-model-context-protocol-mcp/)
- Related projects on this site: [Agentic RAG](/projects/agentic-rag/) · [Realtime Voice AI](/projects/realtime-voice-ai-project/)
