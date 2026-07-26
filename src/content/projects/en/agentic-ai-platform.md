---
title: "LINE Chatbot · n8n Workflow Platform"
description: "A LINE Chatbot built on n8n that uses Google Gemini to analyze user input and intelligently route it to 19 sub-workflows, covering RAG, fact-checking, news, image generation, and web scraping."
pubDate: 2025-01-01
updatedDate: 2026-07-27
tldr:
  - "A LINE Chatbot built on n8n that uses Google Gemini to analyze user input and intelligently route it to 19 sub-workflows, covering RAG, fact-checking, news, image generation, and…"
  - "n8n · Google Gemini · LINE Messaging API · Multi-agent Routing"
  - "1 main flow routes intelligently to 19 subflows (RAG, fact-checking, images, news, and more)"
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
impact: "1 main flow routes intelligently to 19 subflows (RAG, fact-checking, images, news, and more)"
image : "/projects/agentic-ai-platform/title_image.webp"

---

## Context

When LINE is used as a corporate external or internal communication channel, users may raise diverse needs such as technical questions, news inquiries, or image generation. The scenario requires a **single entry point** to receive messages, automatically route them to the corresponding capability (RAG, fact-checking, news, image, scraping, etc.) based on the content type, and format the responses to be sent back to LINE.

## Challenge

- If a separate Bot is built for each type of need, maintenance and user experience become fragmented; if a single workflow handles all types, the logic becomes too massive and difficult to scale.
- AI is needed to identify intent and route it to the correct sub-workflow, and the response must conform to LINE's display constraints (e.g., automatically segmenting long text into a maximum of 5 messages).

## Solution

Provide a **smart LINE auto-reply bot**: After a user sends a message, **Google Gemini** analyzes the content type and **intelligently routes** it to the corresponding sub-workflow for processing, covering technical document summarization, fact-checking, RAG knowledge retrieval, news and stocks, image generation, web scraping, etc. Finally, it formats the response and sends it back to LINE (supports automatic segmentation of long text, up to 5 messages).

### Architecture Overview

**Main Workflow [MAIN] LINE CHATBOT**: Receives LINE Webhook → Calls Gemini to analyze the message → Routes to sub-workflows based on content type → Aggregates AI responses → Sends segmented messages back to LINE.

The **19 Sub-Workflow Modules** are divided into: AI Agents (1399 RAG, MCP RAG, RAG Pipeline, ITR, FACT, CB, DR), Information Processing (NEWS, News Agent Scrape, STOCK), Image Processing (IMAGE Generator, Food Image, Image Editing, Image Module), Web Processing (WEB, LINE CHATBOT Crawl), Tools (SUBS Module, Database Query Tool), and FACT linebot workflow.

```
LINE Webhook → [MAIN] LINE CHATBOT (Gemini Analysis) → Sub-workflow Routing
    → RAG / FACT / NEWS / IMAGE / WEB / … (19 Sub-workflows)
    → Response Formatting and Segmentation → LINE Reply API
```

## Technical Content Processing

- **Technical Related**: Identifies technical documents, meeting minutes, and professional discussions; can be combined with URL scraping (HTTP Request / Jina AI) and YouTube transcripts; output can optionally be a "Standard Template" or a "Detailed Report" in Traditional Chinese, under 500 words, optimized for LINE display.
- **Non-Technical Content**: Routes to personalized conversations and corresponding sub-workflows (such as FACT, NEWS, IMAGE, etc.).
- **Security**: API tokens are managed via environment variables and are not hard-coded; Git history has been sanitized of sensitive information.

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

## Impact

- **Architecture**: **1 Main Workflow** (LINE Webhook → Gemini Intent Analysis → Routing) + **19 Sub-Workflows**, covering RAG, MCP RAG, FACT, NEWS, STOCK, IMAGE, WEB, scraping, etc., modularized for easy maintenance and expansion.
- **Experience**: A single LINE entry point can trigger technical summaries, fact-checking, news, images, scraping, etc., with responses automatically segmented to fit LINE's display.

## Extension

- Add more sub-workflows (e.g., order tracking, form filling, appointment scheduling) to continuously expand capability boundaries.
- Change the main workflow's intent analysis to trainable or configurable rules, reducing reliance on a single model.
- Integrate internal APIs or CRM to complete business actions directly from conversations in one stop.

## Related Links

- **Repository**: [github.com/poirotw66/n8n_workflow](https://github.com/poirotw66/n8n_workflow)
- **Showcase Site** (Flowcharts and documentation): [poirotw66.github.io/n8n_workflow](https://poirotw66.github.io/n8n_workflow/)
