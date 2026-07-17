---
title: "Google Cloud Launches Open Knowledge Format (OKF): An Open Standard for AI Agents to Understand Enterprise Knowledge"
description: "An in-depth analysis of the Open Knowledge Format (OKF) specification introduced by Google Cloud. Exploring how it standardizes the traditional LLM-wiki model, breaks down enterprise knowledge silos through concise Markdown, YAML frontmatter, and interconnected structures, and provides a portable, highly interoperable knowledge foundation for AI Agents."
pubDate: 2026-06-16
updatedDate: 2026-06-16
tldr:
  - "An in-depth analysis of the Open Knowledge Format (OKF) specification introduced by Google Cloud"
  - "Exploring how it standardizes the traditional LLM-wiki model, breaks down enterprise knowledge silos through concise Markdown, YAML frontmatter, and interconnected structures, and…"
  - "Turn fragmented internal metadata and runbooks into a human–machine lingua franca"
audience:
  - "Engineers and PMs tracking AI product and industry signals"
  - "Readers who want a fast brief before deciding whether to go deeper"
category: "Technology"
tags: ["Google Cloud", "Open Knowledge Format", "AI Agent", "RAG", "Metadata"]
image: "/blog/24-open-knowledge-format/title_image.webp"
subtitle: "Turn fragmented internal metadata and runbooks into a human–machine lingua franca"
kind: guide
showToc: true
---

![Open Knowledge Format (OKF) — An open standard for AI Agents to understand enterprise knowledge](/blog/24-open-knowledge-format/title_image.webp)

As Large Language Models (LLMs) and AI Agents rapidly evolve, what limits a model's capabilities is often no longer the parameter scale, but **"the lack of relevant Context"**. Although LLMs excel at writing code, summarizing documents, or analyzing data, they cannot generate accurate and actionable answers without correct, real-time background information.

In most enterprises, this background information is usually highly fragmented and locked within various systems:
- Database schemas and table structures.
- Business definitions of enterprise-specific Metrics.
- Runbooks or troubleshooting processes for system failures.
- Connection paths between data systems.
- Deprecation notices for old APIs.

To break down these knowledge silos, the Google Cloud data team officially launched an open specification called **Open Knowledge Format (OKF)** on June 12, 2026 (the related code is open-sourced on GitHub). OKF aims to formalize the recently popular **"LLM-Wiki"** model, providing a vendor-neutral knowledge representation standard that is extremely friendly to both AI Agents and humans.

Below is an in-depth analysis of the core connotations, working principles, and design philosophy of this brand-new specification.

---

### §1 What is the Open Knowledge Format (OKF)?

**"OKF is not a new data service, nor is it another SaaS platform; it is simply a 'knowledge representation format'."**

The core structure of OKF is very simple; essentially, it is **a directory structure containing Markdown files and YAML Frontmatter**. It features the following three "only" characteristics:

1. **Markdown Only**: Can be read in any editor, rendered on GitHub, and directly indexed by any search engine.
2. **Files Only**: Can be packaged into a tar archive, hosted in any Git repository, or mounted on any file system.
3. **YAML Frontmatter Only**: Used to define a small number of key fields that require structured querying:
   - `type`: (The only mandatory field, e.g., table, metric, playbook)
   - `title`: (The name of the concept)
   - `description`: (A brief description of the concept)
   - `resource`: (The underlying resource identifier associated with it)
   - `tags`: (Classification tags)
   - `timestamp`: (Timestamp)

If you have used Obsidian, Notion, Hugo, or are familiar with Agent convention files like `CLAUDE.md` / `AGENTS.md` that have emerged in the past year, you will find the form of OKF very familiar. OKF exactly distills these practical experiences into a standard set of interoperability specifications.

---

### §2 Fragmented Context Landscape and the Living Wiki Model

When an AI Agent is asked: *"How do we calculate our Weekly Active Users (WAU) from the event stream?"* it must piece together the answer from metadata catalogs, code comments, internal Wikis, and even the minds of senior engineers. Existing solutions are often tied to the SDKs or knowledge graph schemas of various catalog vendors, making them impossible to port across different products or organizations.

This causes every Agent developer to reinvent the wheel, and enterprise knowledge remains firmly locked within the tools that created it.

#### 2.1 Knowledge as a Living Wiki
Development teams are changing the way they build AI Agents: instead of making models repeatedly search the same documents, they provide Agents with a **shared Markdown knowledge base**.
Renowned AI scholar Andrej Karpathy pointed out in his popular [LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): **"An LLM doesn’t get bored, it doesn't forget to update cross-references, and it can touch 15 files at once."** Humans easily give up maintaining personal Wikis because they find it tedious, and this boring "bookkeeping and updating work" is exactly what LLMs excel at.

OKF is a product of this background. It unifies the naming conventions and cross-linking methods of files within folders, allowing scattered Wikis to truly collaborate and jointly provide accurate Context support for AI Agents.

---

### §3 The Three Major Design Principles of OKF

The OKF specification is extremely concise, with its v0.1 spec taking up only a single page, embodying three major design philosophies:

#### 1. Minimally opinionated
OKF only strictly requires a `type` field for each concept file; all other properties (including specific types, body structure, and additional fields) are entirely up to the knowledge producers to decide. The specification defines the **boundaries of interoperability**, rather than a concrete content model.

#### 2. Producer/Consumer Independence
OKF cleanly separates "who writes the knowledge" and "who consumes the knowledge."
- A Markdown knowledge base **handwritten by humans** can be directly read by AI Agents.
- A knowledge Bundle **automatically generated by metadata export pipelines** can be directly rendered in visualization tools.
- A knowledge base **generated by LLM A** can be queried by **LLM B**.
The format is the only contract, and the tools on both ends can be independently replaced.

#### 3. Format, not platform
OKF is not tied to any cloud vendor, database, model provider, or Agent framework; reading and writing it does not require any proprietary accounts or SDKs. The Google Data team stated that the value of an open standard comes from how many people use it, not who owns it.

---

### §4 Open Source Ecosystem and Toolchain

To accelerate the adoption of OKF, the Google team also open-sourced the following practical ecological tools alongside the specification release:

- **Enrichment Agent**: A reference implementation that can scan BigQuery datasets. It drafts OKF concept files for each table and view, and then uses a second-stage LLM to crawl authoritative documentation, enriching the files with reference sources, schemas, and Join paths.
- **Backendless Visualizer**: Can convert any OKF Bundle into a single HTML file with an interactive relationship graph. No installation, no backend, and no data ever leaves the browser page.
- **Sample Bundles**: The GitHub repository provides standard OKF samples for GA4 e-commerce datasets, Stack Overflow, and Bitcoin public datasets, ready for developers to explore.

Furthermore, Google Cloud's own **Knowledge Catalog** has also been upgraded to natively support importing OKF-formatted knowledge bundles and serving them to built-in AI Agents.

---

### §5 Conclusion: The Lingua Franca of the Future

The Open Knowledge Format (OKF) is an important attempt to standardize a "human-machine readable knowledge base". Today, as RAG and AI Agents deepen, moving away from complex and error-prone PDF/HTML parsing and settling enterprise knowledge into a set of Git version-managed, human-machine accessible Markdown-wikis is becoming the prevailing trend.

Whether you are building metadata catalogs, automated data enrichment pipelines, or enterprise Wikis specifically designed for AI Agents, OKF provides the best universal language (Lingua Franca).

> **Learn more**:
> - Original Google Official Blog: [How the Open Knowledge Format can improve data sharing](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing/)
> - Full specification and open-source toolchain: [GitHub - GoogleCloudPlatform/knowledge-catalog (OKF)](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf)
