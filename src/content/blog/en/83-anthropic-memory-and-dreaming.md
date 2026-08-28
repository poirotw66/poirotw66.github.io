---
title: "What Is Anthropic Agent Memory: Cross-Session Memory vs Dreaming"
description: "Untangle Anthropic Agent Memory vs Dreaming: which handles cross-session recall, which runs overnight batches—and do not treat them as the same thing."
pubDate: 2026-08-05
updatedDate: 2026-08-28
tldr:
  - "The Memory API allows agents to manage, store, and update memory autonomously as a file system, improving long-horizon task performance."
  - "Dreaming is an asynchronous background process that analyzes recent agent transcripts, identifies common mistakes and strategies, and updates the knowledge base."
  - "Optimistic concurrency and permission scopes ensure safe memory writes and enterprise-grade control when hundreds of agents run in parallel."
audience:
  - "Developers and architects focused on AI agent underlying architectures"
  - "Enterprise engineering teams seeking best practices for multi-agent collaboration"
category: "AI Engineering"
tags: ["AI Agent", "Enterprise AI", "Evaluation"]
cluster: "ai-agent"
clusterRole: "case"
clusterOrder: 6
kind: "article"
showToc: true
image: "/blog/83-anthropic-memory-and-dreaming/title_image.webp"
---

The capabilities of Large Language Models (LLMs) have improved rapidly over the past few years, and AI agents are now capable of executing complex tasks that run for hours or even days. We have witnessed the birth of the Model Context Protocol (MCP), tool-calling capabilities, and various Agent SDKs. However, as pointed out by Mahesh, a product manager on Anthropic's platform team, during a [recent presentation](https://www.anthropic.com/news), the next indispensable underlying primitives to move agent systems toward true "continuous self-learning" and long-horizon context management are **Memory** and the **Dreaming** mechanism.

When developers begin deploying thousands of parallel agents within enterprise environments, they face the same bottleneck: each agent acts as a one-off computational node, unable to learn from its peers' mistakes or effectively accumulate knowledge about the project environment beyond a single session. With the newly launched Memory API and the Dreaming feature (in research preview), Anthropic proposes a systematic solution to this pain point.

<div
  data-youtube-facade
  data-mode="video"
  data-video-id="RtywqDFBYnQ"
  data-title="Memory and dreaming for self-learning agents"
  data-poster="/blog/83-anthropic-memory-and-dreaming/title_image.webp"
  data-play-label="Play Video"
></div>

> **Huahua's take**
>
> As AI agents shift from lone-wolf operations to large-scale concurrent collaboration, memory stores are no longer simple text memos but rather enterprise-grade "dynamic knowledge graphs". The Dreaming mechanism shifts the token-heavy "synchronous learning" to an asynchronous "overnight curation", marking a critical milestone for scaling agent architectures more efficiently and stably.

## Why Do We Need a Robust Memory Mechanism?

For continuously running agents, memory is the key to their evolution. Through memory, agents can understand task success criteria, record common mistakes, and evaluate the effectiveness of different strategies. Simultaneously, they can learn about their environments, such as the codebase they interact with, file states, and various dependencies.

More importantly, it enables **cross-agent learning**: agents can share their experiences within the same environment. For example, Rakuten reported a 90% drop in "first pass mistakes" among their internal knowledge agents after deploying this memory system, as agents could catch and share error information with the next iteration of agents. This not only improved intelligence but also significantly reduced token consumption and system latency.

## Three Design Principles of the Frontier Memory System

To support the scaling of multi-agent systems, Anthropic adhered to three core design principles when designing the Memory API for Claude Managed Agents:

### 1. Maximize Intelligence by Default
Early agent memory (such as Claude.md from a year and a half ago) was often constrained by rigid tool calls or manual user annotations. However, the latest models (like Claude Opus 4.7) possess outstanding "file system-based memory" capabilities. Anthropic chose to delegate control by modeling memory as a virtual file system, allowing Claude to use its most proficient `bash` and `grep` tools to autonomously decide what content is worth recording, how to split files, and how to organize directory structures.

### 2. Scale with Multi-Agent Systems
Enterprise environments typically have hundreds of agents running concurrently and accessing shared states. This system introduces two critical properties:
- **Permission Scopes**: Agents can be given read-only access to an "organization-wide knowledge base" (like SOPs or best practices) and read-write access to a "task-specific workspace", preventing core knowledge from being accidentally overwritten.
- **Optimistic Concurrency**: Using a content hash, an agent checks whether the state has been modified by other agents before updating memory, avoiding data conflicts.

### 3. Enterprise Control & Standalone API
To meet production environment standards, developers must have complete control. The API provides a detailed **Version History** and attribution metadata (recording which agent, in which session, and at what time the memory was modified). Furthermore, a standalone API design ensures enterprises can intervene outside the Managed Agents system—for instance, to perform PII (Personally Identifiable Information) scanning or to clone memory into external governance pipelines.

## What is the Dreaming Mechanism?

Although the synchronous Memory API solves memory access for individual agents, Anthropic found efficiency bottlenecks in large-scale multi-agent systems: individual agents are often restricted by their own task perspectives, struggling to notice macro patterns across the system, and prone to creating redundant records.

To address this, Anthropic introduced the **Dreaming** process. This is a batch asynchronous process. You can configure Dreaming to trigger at specific times (e.g., via cron) or after tasks finish. It comprehensively reviews transcripts from recent agent sessions, identifies common mistakes and successful strategies, and automatically cleans, deduplicates, and verifies knowledge in the memory store.

> **Huahua's engineering note**
>
> Introducing Dreaming means you transfer the computational cost of memory maintenance to an "out-of-band" path. Similar to the indexing process of a search engine, investing more compute upfront to organize the knowledge base can significantly amortize the retrieval and learning costs for all downstream agents executing tasks.

### The Real-World Benefits and Operation of Dreaming

In a legal scenario test by Harvey, deploying the Dreaming mechanism increased the task completion rate by 6 times. In an SRE (Site Reliability Engineering) automated debugging scenario, the power of Dreaming is even more evident:

When a system triggers consecutive CPU load alerts, different SRE agents investigate and record their findings separately. The overnight Dreaming job analyzes the logs from the past 7 days and discovers that multiple agents encountered a "60-second retry latency pattern following an upstream CPU spike". Since a single agent only observes its own delay, it cannot deduce the 60-second rule; however, Dreaming can consolidate these cross-session patterns and automatically write a verified system debugging guide. The next day, when a new agent encounters the same alert, it can directly read this conclusion, avoiding repeated investigations.

## Practical Recommendations for Engineering and Enterprises

1. **Separate Task and Memory Objectives**: Utilizing out-of-band mechanisms like Dreaming allows task-executing agents to focus on solving problems, delegating the objective of Memory Quality to background processes, and preventing prompt interference.
2. **Scaling with Compute**: Just as test-time compute improves reasoning quality, Dreaming allows agents to trade additional tokens for a stable, long-term cognitive foundation for the entire system. This is a necessary investment for large-scale enterprise agents.
3. **Transition from Storage to Knowledge Networks**: As systems run, the Memory Store should be viewed as a dynamically updating knowledge base rather than a static workspace buffer. Well-designed version control and attribution mechanisms will be your final defense when debugging agent behavior.

## Related Reading

- [AI Agent Development Guide](/en/blog/64-ai-agent-guide/)
- [Enterprise RAG Practice Guide](/en/blog/65-enterprise-rag-guide/)
- [Enterprise Agentic AI Governance Strategy](/en/blog/39-enterprise-agentic-ai-governance/)
