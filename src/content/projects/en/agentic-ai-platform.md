---
title: "LINE Chatbot · n8n Workflow Platform"
description: "A LINE Chatbot built on n8n that uses Google Gemini to analyze user input and intelligently route it to 19 sub-workflows, covering RAG, fact-checking, news, image generation, and web scraping."
pubDate: 2025-01-01
updatedDate: 2026-07-27
tldr:
  - "LINE Chatbot platform built on n8n, using Gemini semantic routing to dispatch across AI tasks"
  - "Main workflow manages Webhook and intent dispatch; 19 subflows are maintained independently"
  - "Unified Result Adapter and message segmentation comply with LINE Messaging API contracts"
audience:
  - "Engineers, technical leads, and product teams evaluating real project architecture, trade-offs, and delivery results."
  - "Readers who want concrete outcomes and stack choices, not just a concept demo."
tier: flagship
featuredOrder: 1
subtitle: "n8n · Google Gemini · LINE Messaging API · Multi-agent Routing"
repoUrl: "https://github.com/poirotw66/n8n_workflow"
metrics:
  - "1 main flow + 19 subflows"
  - "Google Gemini"
  - "RAG · FACT · Images · News"
impact: "1 main workflow routes modularly across 19 subflows (RAG, fact-check, image, news)"
image: "/projects/agentic-ai-platform/title_image.webp"

---

## Context

When LINE is used as a corporate external or internal communication channel, users may raise diverse needs such as technical questions, news inquiries, or image generation. The scenario requires a **single entry point** to receive messages, automatically route them to the corresponding capability (RAG, fact-checking, news, image, scraping, etc.) based on the content type, and format the responses to be sent back to LINE.

## Challenge

- If a separate Bot is built for each type of need, maintenance and user experience become fragmented; if a single workflow handles all types, the logic becomes too massive and difficult to scale.
- AI is needed to identify intent and route it to the correct sub-workflow, and the response must conform to LINE's display constraints (e.g., automatically segmenting long text into a maximum of 5 messages).

## Solution

Provide a **smart LINE auto-reply bot**: After a user sends a message, **Google Gemini** analyzes the content type and **modularly routes** it to the corresponding sub-workflow for processing, covering technical document summarization, fact-checking, RAG knowledge retrieval, news and stocks, image generation, web scraping, etc. Finally, it formats the response and sends it back to LINE (supports automatic segmentation of long text, up to 5 messages).

### Architecture Overview

**Main Workflow [MAIN] LINE CHATBOT**: Receives LINE Webhook → Calls Gemini to analyze the message → Routes to sub-workflows based on content type → Aggregates AI responses → Sends segmented messages back to LINE.

The **19 Sub-Workflow Modules** are divided into:
- **AI Agents**: 1399 RAG, MCP RAG, RAG Pipeline, ITR, FACT, CB, DR
- **Information Processing**: NEWS, News Agent Scrape, STOCK
- **Image Processing**: IMAGE Generator, Food Image, Image Editing, Image Module
- **Web Processing**: WEB, LINE CHATBOT Crawl
- **Tool Support**: SUBS Module, Database Query Tool, FACT linebot workflow

```text
LINE Webhook → [MAIN] LINE CHATBOT (Gemini Intent Analysis) → Route Dispatch
    ├── RAG (Knowledge base retrieval)
    ├── FACT (Fact checking)
    ├── NEWS / STOCK (Real-time data)
    ├── IMAGE (Image generation & editing)
    └── WEB / CRAWL (Web scraping)
    → Result Adapter Normalization → Segmentation (≤ 5 messages) → LINE Reply API
```

### Representative Path: Technical Document Q&A (RAG)

Tracing a user prompt such as "How do I deploy this documentation?":
1. **Webhook Ingestion**: The main flow parses the incoming LINE POST request, extracting message text and `replyToken`.
2. **Intent Classification**: Gemini performs semantic classification, outputting a `TECH` / `RAG` dispatch payload.
3. **Subflow Execution**: The `1399 RAG` subflow queries the backend knowledge base and receives grounded context.
4. **Adapter Normalization**: The `Result Adapter` converts raw answers into formatted Traditional Chinese under 500 words, chunked into up to 5 LINE chat bubbles.

### Error Handling Boundaries and Author Responsibility

- **Implemented Safeguards**:
  - External API timeout guards and fallback messages.
  - One-time verification of LINE Webhook tokens to avoid duplicate processing.
  - Credential isolation: All API keys and secrets are injected via environment variables.
- **Production Enhancements Required**:
  - Cross-module distributed tracing (currently reliant on n8n execution history).
  - Automated exponential backoff and circuit breaking.
  - Human-in-the-loop escalation handoff.
- **Responsibility Limits**: I was responsible for the n8n topology, intent dispatch contracts, modular subflow boundaries, and LINE Messaging API integration. The underlying foundation models (Gemini, Jina, etc.) are consumed as third-party APIs.

## Workflow Diagram (Can be paired with n8n course flowchart)

The following illustrates the conceptual levels of the n8n workflow; the actual main and sub-workflow diagrams can be viewed on the [GitHub Showcase Site](https://poirotw66.github.io/n8n_workflow/).
### n8n Workflow Level 1
![n8n Workflow Level 1](/projects/n8n-course/n8n_lv1.webp)
### n8n Workflow Level 2 Example 1
![n8n Workflow Level 2 Example 1](/projects/n8n-course/n8n_lv2_workflow1.webp)
### n8n Workflow Level 2 Example 2
![n8n Workflow Level 2 Example 2](/projects/n8n-course/n8n_lv2_workflow2.webp)

## Tech Stack & Highlights

- **n8n** — Visual workflow design and execution
- **Google Gemini** — Message analysis and response generation
- **LINE Messaging API** — Webhook receiving and replying
- **RAG / MCP RAG / FACT** — Knowledge retrieval and fact-checking
- **Modularization** — Each function has an independent sub-workflow, making it easy to maintain and expand
- **GitHub Pages** — Workflow documentation and flowchart showcase site: [poirotw66.github.io/n8n_workflow](https://poirotw66.github.io/n8n_workflow/)

## Impact and Boundary Notes

- **Topology Metric**: **1 Main Workflow** (LINE Webhook → Gemini Intent Analysis → Routing) + **19 Sub-Workflows**, isolating failures across disparate AI capabilities.
- **Unified Delivery Contract**: A single conversation interface serves multiple specialized tasks through a shared Result Adapter.
- **Operational Boundary**: This project validates architectural modularity and routing logic; it does not claim enterprise uptime SLA or high-concurrency production load figures.

## Extension

- Add more sub-workflows (e.g., order tracking, form filling, appointment scheduling) to continuously expand capability boundaries.
- Change the main workflow's intent analysis to trainable or configurable rules, reducing reliance on a single model.
- Integrate internal APIs or CRM to complete business actions directly from conversations in one stop.

## Related Links

- **Repository**: [github.com/poirotw66/n8n_workflow](https://github.com/poirotw66/n8n_workflow)
- **Showcase Site** (Flowcharts and documentation): [poirotw66.github.io/n8n_workflow](https://poirotw66.github.io/n8n_workflow/)
