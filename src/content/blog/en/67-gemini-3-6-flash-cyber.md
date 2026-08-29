---
title: "Gemini 3.6 Flash, 3.5 Flash-Lite, and Flash Cyber: Roles, Pricing, and Adoption Boundaries"
description: "A grounded comparison of the official positioning, current pricing, vendor benchmarks, and availability of Gemini 3.6 Flash, 3.5 Flash-Lite, and 3.5 Flash Cyber, with adoption checks for model routing and cyber permissions."
pubDate: 2026-07-22
updatedDate: 2026-08-29
tldr:
  - "This post distinguishes the three Gemini models by low-latency work, high-volume workflows, and cybersecurity defense."
  - "Speed, price, and benchmark figures are launch claims; validate them against your own workload before adoption."
audience:
  - "Engineering teams designing agent workflows, model routing, or cost controls"
  - "Technical decision-makers evaluating generative AI and security-automation risk"
category: "Industry Pulse"
tags: ["Google","Gemini","AI Agent","AI 安全"]
kind: "article"
showToc: true
image: "/blog/67-gemini-3-6-flash-cyber/title_image.webp"
---
As generative AI steps into the "Agentic" era, developers and enterprises are increasingly focusing on three key metrics when building AI Agents for production environments: **higher token efficiency, lower latency, and more reliable task execution performance**.

In its [July 2026 announcement](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/), Google introduced **Gemini 3.6 Flash**, **Gemini 3.5 Flash-Lite**, and the cybersecurity-specialized **Gemini 3.5 Flash Cyber**. It also said pre-training for Gemini 4 had begun.

The useful comparison is across workloads, not a single weakest-to-strongest leaderboard. Speed, token-efficiency, and benchmark figures below are Google launch claims or third-party figures it cites; rerun them on your own tasks before adoption.

> **Huahua in one sentence**
>
> Model selection is not a leaderboard exercise: place fast models, deeper reasoning, and security checks at different gates to balance cost, latency, and risk.

## 1. Gemini 3.6 Flash: A Higher Efficiency, Higher Quality Workhorse Model

Gemini 3.6 Flash keeps the general-purpose workhorse role of the Flash family. Google positions it above 3.5 Flash for coding, knowledge work, and multimodal tasks, with fewer output tokens, reasoning steps, and tool calls.

### Core Upgrade Highlights
* **Vendor-reported token efficiency**: Google cites the Artificial Analysis Index for **17%** fewer output tokens than 3.5 Flash and Datacurve DeepSWE for savings of up to **65%**. Harness design, stopping conditions, and tools can materially change those results.
* **Launch price versus current price**: The launch post lists **\$1.50／\$7.50 per 1M input／output tokens**. The current [Gemini API pricing page](https://ai.google.dev/gemini-api/docs/pricing) shows a temporary **\$0.75／\$3.75** rate through December 31, 2026, returning to the launch rates in 2027. Date and account plan belong in any TCO estimate.
* **Massive Benchmark Improvements**:
  * **Coding**: Shows higher precision in the DeepSWE test (49% vs. 37%), significantly reducing unwanted code edits and execution loops.
  * **Computer Use**: Achieves 83.0% in the OSWorld-Verified benchmark (up from 78.4%). Computer Use is now a built-in client-side tool via the Gemini API and Gemini Enterprise.
  * **ML Research**: Reached 63.9% in MLE Bench (up from 49.7%).
  * **Knowledge Work**: Scored 1421 in the GDPval-AA v2 benchmark (up from 1349). Customers like Hebbia and Harvey note its exceptional performance in multimodal tasks like document parsing, chart analysis, and report drafting.
* **Enhanced Safety Defenses**: 3.6 Flash ships with upgraded "Frontier Safety" safeguards, making the model substantially more resistant to jailbreaks, especially in Chemical, Biological, Radiological, and Nuclear (CBRN) domains and cyber offense misuses, while ensuring it doesn't overly refuse beneficial requests.

## 2. Gemini 3.5 Flash-Lite: Built for Large-Scale Agentic Workflows

For development scenarios that require massive high throughput and extremely low latency (e.g., agentic search, large-scale document processing), Google launched the fastest model in the 3.5 series: **Gemini 3.5 Flash-Lite**.

### Core Upgrade Highlights
* **Vendor-reported speed and price**: Google cites Artificial Analysis for **350 output tokens per second** and lists **\$0.30／\$2.50 per 1M input／output tokens**. These figures qualify the model for testing; they are not your end-to-end task latency or completion cost.
* **Flexible Thinking Levels**: Developers can dynamically configure the model based on the workload. For high-volume, simple tasks, it can be set to a low-latency baseline thinking mode; for multi-step subagent tasks, it can engage higher thinking levels, while also supporting the built-in Computer Use tool.
* **Vendor-reported benchmarks**: Google reports higher scores than Gemini 3 Flash on SWE-Bench Pro (54.2% vs. 49.6%) and OSWorld-Verified (74.0% vs. 65.1%). That supports a migration test, not unconditional replacement of existing 2.5 or 3 Flash workloads.

## 3. Gemini 3.5 Flash Cyber: The Cybersecurity Expert Built into CodeMender

As AI models become increasingly adept at finding security vulnerabilities, the speed of patching by defenders must also keep pace. **Gemini 3.5 Flash Cyber**, announced today, is a specialized model fine-tuned on top of 3.5 Flash, designed to achieve large-scale vulnerability detection, validation, and patching at a lower cost.

### Core Upgrade Highlights
* **Multi-agent orchestration**: Google's [Flash Cyber technical post](https://deepmind.google/blog/introducing-gemini-3-5-flash-cyber/) says CodeMender invokes the model multiple times so subagents can explore different code paths before combining a report. CyberGym therefore measures the agent system, not a bare-model score.
* **Limited pilot**: Because of dual-use risk, Flash Cyber is planned first as limited CodeMender access for governments and trusted partners. General developers should not treat it as a regular model selectable in the Gemini API.

## Engineering perspective: validate workloads before choosing a routing strategy

The speed, pricing, availability, and benchmark results in this article are product-release information. Confirm the official documentation, regional availability, and your account plan before implementation. For agent workflows, establish a baseline with representative tasks—latency, success rate, tool-call count, and cost per completed task—before assigning fast or deeper-reasoning models to each step.

Cybersecurity capabilities should not receive production remediation privileges by default. Start with least privilege, isolated test environments, and auditable human approval, then expand automation only after the output is proven reliable.

## Continue reading

- [The Complete AI Agent Guide: Architecture to Production](/en/blog/64-ai-agent-guide/)
- [Self-Scaffolding for Agentic Coding: Ornith 1.0 Training and Evaluation Limits](/en/blog/69-ornith-1-0-self-scaffolding-llm/)

## Primary sources

- [Google: Gemini 3.6 Flash, 3.5 Flash-Lite, and 3.5 Flash Cyber launch](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)
- [Google AI for Developers: Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google DeepMind: Gemini 3.5 Flash Cyber and CodeMender](https://deepmind.google/blog/introducing-gemini-3-5-flash-cyber/)

> **Huahua's engineering note**
>
> Keep model selection, tool permissions, and security review as separate control planes. Fast models can handle high-volume, low-risk work, while high-impact actions remain verifiable and reversible.
