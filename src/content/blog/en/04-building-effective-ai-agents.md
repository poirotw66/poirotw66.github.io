---
title: "Building Effective AI Agents: An Overview of Architecture Patterns and Implementation Strategies"
description: "Adapted from Anthropic's 'Building Effective AI Agents': From single agents to multi-agent collaboration, common architectural patterns, workflow design, and how to choose the right architecture based on control requirements, problem complexity, and resources."
pubDate: 2025-03-16
updatedDate: 2025-03-16
tldr:
  - "Adapted from Anthropic's 'Building Effective AI Agents': From single agents to multi-agent collaboration, common architectural patterns, workflow design, and how to choose the…"
  - "Key sections: 1. Why Talk About Agents? · 2. Common Application Scenarios · 3. Architecture Design Principles"
audience:
  - "Enterprise AI / platform engineers and technical leads"
  - "Decision-makers who need deployable architecture, governance, and risk trade-offs"
category: "Enterprise AI"
tags: ["AI Agent","Enterprise AI","Architecture Patterns","Multi-Agent","Claude"]
image: "/blog/04-building-effective-ai-agents/title_image.webp"
showToc: true
---
AI Engineering can answer questions; **AI Agents can solve problems**. For enterprises, Agents bring scalable, open-ended problem solving, dynamic decision-making, and multi-step processes where the path cannot be hardcoded in advance. This article is based on Anthropic's **"Building Effective AI Agents"** documentation. The original text can be found on their official page: [Building Effective AI Agents](https://resources.anthropic.com/ty-building-effective-ai-agents). This article reorganizes the content from a practical implementation perspective for enterprises to reference when selecting and deploying architectures.

> **Huahua in one sentence**
>
> Workflows fit tasks with predictable paths; agents earn their complexity when the next action must be chosen from observed results.

<audio controls style="width: 100%; margin: 1.5rem 0;">
  <source src="https://github.com/poirotw66/Bloss0m-Audio/raw/main/%E6%89%93%E9%80%A0%E6%9C%89%E6%95%88%E7%9A%84%20AI%20Agent%EF%BC%9A%E6%9E%B6%E6%A7%8B%E6%A8%A1%E5%BC%8F%E8%88%87%E5%AF%A6%E4%BD%9C%E7%AD%96%E7%95%A5%E7%B8%BD%E8%A6%BD.m4a" type="audio/mpeg" />
  Your browser does not support the audio element. Please download it using the link below or open it in a new tab:
  <a href="https://github.com/poirotw66/Bloss0m-Audio/raw/main/%E6%89%93%E9%80%A0%E6%9C%89%E6%95%88%E7%9A%84%20AI%20Agent%EF%BC%9A%E6%9E%B6%E6%A7%8B%E6%A8%A1%E5%BC%8F%E8%88%87%E5%AF%A6%E4%BD%9C%E7%AD%96%E7%95%A5%E7%B8%BD%E8%A6%BD.m4a">Listen to the audio explanation</a>
</audio>

---

## 1. Why Talk About Agents?

### 1.1 Traditional Automation vs Agents

Traditional automation relies on **pre-written scripts**, where every step must be defined in advance. Agents are different: they evaluate tasks, choose tools, try approaches, and adjust strategies based on results, much like an experienced employee handling an unfamiliar project. For example, when processing customer service escalations, an Agent can read the issue, check account history, search the knowledge base, draft a reply, and route to a human specialist if necessary, all without human intervention.

The key lies in: **autonomous reasoning and tool selection**, coupled with the ability to **recover from errors** and **continuously progress towards a goal**. This makes Agents particularly suitable for scenarios where "steps cannot be entirely predetermined," such as incident response, data analysis, customer onboarding, or iterative problem-solving driven by automated test feedback during the development process.

### 1.2 Enterprise Use Cases

- **Coinbase**: A Claude-driven customer service Agent handles thousands of messages per hour with 99.99% availability, spawning 35–50 internal AI applications.
- **Tines**: Uses Agents to dynamically process workflow logic, consolidating multi-step security operations into single Agent actions, corresponding to an approximate **100x improvement in time-to-value**.
- **Gradient Labs**: A financial customer service Agent understands queries in context and executes standard operating procedures with an **80–90% resolution rate**, allowing human staff to focus on relationship building and strategic work.
- **Retail Bank**: A credit risk memo that previously required relationship managers to manually check over a dozen data sources and took weeks to complete was transformed by Agent assistance, resulting in a 20–60% productivity increase and a ~30% reduction in credit case turnaround time.

Adopting Agents still requires careful consideration of: **architecture patterns, cost control, and operational governance**.

---

## 2. Common Application Scenarios

### 2.1 Software Development

**Augment Code** (powered by Claude on Vertex AI) assists developers in navigating millions of lines of interdependent codebases. One enterprise customer completed a project originally estimated by their CTO to take 4–8 months in **just 2 weeks**, while developer onboarding time was reduced from weeks to **1–2 days**.

### 2.2 Data and Operations

**Grafana** uses a Claude-driven smart assistant that allows everyone from the CTO to junior engineers to query operational data using natural language (e.g., "What is the request latency for my checkout service?"), automatically assembling PromQL / LogQL queries.

### 2.3 Customer Service and Operations

- **Intercom Fin AI** (Claude): Achieves a **maximum resolution rate of ~86%** (default ~51%), reduces response times from ~30 minutes to seconds, and supports 45+ languages.
- **Assembled Assist** (Claude): Improves CSAT (Customer Satisfaction) by ~20%, reduces support costs, lowers escalation rates by over 50%, and increases the number of cases resolved per hour by over 30%, focusing on complex Tier 2+ cases.

### 2.4 Legal

- **Thomson Reuters CoCounsel** (Claude on Bedrock): Integrates over 3,000 experts and 150+ years of authoritative content to process contracts and tax documents; customer feedback indicates significant reductions in processing time.
- **Legora**: A Claude-driven legal platform that showed an ~18% performance improvement on its proprietary large legal benchmark, facilitating the construction of Agent workflows adaptable to different business and client needs.

### 2.5 Marketing and Finance

- **Advolve**: Uses Claude to coordinate digital customer acquisition, managing millions of ads across multiple platforms, real-time data validation, and dynamic budget allocation, leading to an **~90% reduction in operational hours** and an ~15% increase in Return on Ad Spend (ROAS).
- **Inscribe**: An AI risk Agent that cuts fraud review time from ~30 minutes to **~90 seconds** (an ~20x improvement), with output increasing up to ~70x in client cases, while supporting KYC/KYB, image and PDF fraud detection, and auditable risk reports.

---

## 3. Architecture Design Principles

### 3.1 Start Simple, Then Scale Based on Needs

It's recommended to start with a **single-purpose Agent that does one thing well**, then evolve into more complex systems as needs arise. Simple systems: have lower token and compute costs, are easier to debug, and their metrics are easier to tie back to business outcomes.

### 3.2 Choose the Right Model

Strike a balance between **capability, speed, and cost**. Complex multi-agent orchestration or financial analysis is suited for the most capable models; high-volume, well-defined customer service or form extraction can use lighter, faster models, as cost differences become highly significant at scale.

### 3.3 Modular Design

New capabilities and features iterate quickly, so architectures should support **modularity**, such as:

- **Prompt**: Centralized in configuration files or codebases
- **Tools**: Independent, reusable modules
- **Agent**: Assembled by task, mounting only the necessary tools and resources

This allows for the rapid definition of new Agents and naturally scales on frameworks like LangGraph or Mastra; new tools and prompting strategies can be rolled out centrally.

### 3.4 Agent Skills

**Agent Skills** provide a structured way to equip Agents with domain knowledge, workflows, and tool integrations without cramming everything into a prompt. Skills are composable: for instance, a compliance Skill can call a document analysis Skill, then use a specialized extraction Skill. Applicable scenarios include: domain expertise (finance, legal, research), internal organizational standard processes, specialized tool integrations (databases, APIs), and industry or compliance requirements. Both single Agent and multi-agent architectures can be paired with different Skills.

### 3.5 Observability

An Agent's reasoning process is opaque and non-deterministic. When debugging, you cannot just look at stack traces; you need to see the **prompt chain, model decision paths, retrieval context, token consumption, and the overall reasoning workflow**. In addition to logs, monitoring, and distributed tracing, you must be able to answer "why the model made this decision" and "how context flows across multiple steps" to effectively debug and optimize.

---

## 4. Single Agent Systems

A single Agent operates in a loop: **perceive environment → determine next step → execute**.

![Single Agent Architecture Diagram](/blog/04-building-effective-ai-agents/1_single-agent.webp)

1. User assigns a task
2. The Agent formulates a plan, calls tools, observes results, and adjusts based on feedback
3. Repeats until completion or a stopping condition is triggered (e.g., "pause for human review")

**Components**: A reasoning engine (the model), a prompt defining roles and capabilities, a **toolkit** for external interaction, and optional **Skills** to expand domain knowledge and processes.

**Applicability**: Open-ended problems where the path cannot be determined from the start.  
**Inapplicability**: If the requirement is "perfect on the first try, 100% accurate," consider multiple Agents or enhance the single Agent with Skills first, before assessing if multi-agent is truly needed.

**Example**: A research Agent paired with MCP to connect to content repositories, business tools, and development environments; the user asks to "research the adoption of remote work productivity tools in engineering teams and correlate it with our internal productivity metrics." The Agent can break this down into: external search, internal database queries, parallel execution, and finally correlation and summarization, using think / tool call iterations throughout the process to analyze and produce the output.

---

## 5. Multi-Agent Systems

Multi-agent architectures allow **multiple specialized Agents** to collaborate on complex problems that are difficult for a single general-purpose Agent to handle: tasks are broken down, distributed, executed by multiple Agents, and then synthesized into a cohesive output.

![Multi-Agent Architecture Overview](/blog/04-building-effective-ai-agents/2_muti-agent.webp)

Anthropic's internal research shows: for complex tasks requiring **simultaneous exploration in multiple independent directions**, multi-agent systems offer an **~90.2%** performance improvement over single Agents; multi-agent becomes an important way to "scale intelligence."

**Applicability**: (1) Open-ended, unpredictable steps that require pivoting or exploring branches at any time; (2) Requires multiple specialties, where a single Agent's performance noticeably drops across multiple domains; (3) Needs broad queries and parallel directions, where parallelism brings clear benefits.  
**Cost**: Token consumption is much higher than a single Agent, requiring assurance that business value justifies it; debugging and observability are also more critical, requiring the ability to track decision-making and interaction structures between Agents.

### 5.1 Centralized: Hierarchical / Supervisor Pattern

A **central supervisor** assigns tasks to specialized Agents and then synthesizes the results, establishing a clear chain of responsibility.

![Multi-Agent Hierarchical / Supervisor Workflow Diagram](/blog/04-building-effective-ai-agents/3_multi-agnet-hierarchical-workflow.webp)

- **Full Orchestration**: The supervisor completely controls interactions and execution
- **Routing Bias**: Primarily handles dispatching, potentially handing the conversation over to a specialized Agent
- **Hybrid**: Decides whether to engage the supervisor based on task complexity

**Challenges**: Context can become too large for a single Agent to manage effectively, leading to context overflow, degraded reasoning quality, and coordination failure. Implementation requires: context editing (cleaning up expired tool calls and results as the token limit approaches), memory/file-based tools to keep information outside the context, and tools that support pagination/filtering/truncation with reasonable limits (e.g., ~25,000 tokens).

**Example**: Marketing campaign development. A client submits a brief → Marketing Director Agent breaks it down and delegates → Market Research, Creative Design, Copywriting, and Media Planning Agents execute their respective tasks → Supervisor synthesizes the results and resolves conflicts → Produces a complete campaign strategy and assets.

### 5.2 Decentralized: Collaborative Pattern

Multiple Agents communicate **peer-to-peer** and dynamically negotiate roles to solve problems collectively using decentralized intelligence. Coordination comes from the interaction itself rather than central commands.

![Multi-Agent Collaborative Workflow Diagram](/blog/04-building-effective-ai-agents/4_Multi-agent collaborative workflow.webp)

Implementation forms include: **Group Chat** (multiple Agents collaborating in the same thread), **Event-Driven** (using events as a common language to pass states and tasks), and **Blackboard Architecture** (shared read/write access to a knowledge base).

**Challenges**: Communication is complex, emergent behavior is hard to predict, and tasks may bounce back and forth between Agents; this requires clear division of responsibilities, problem-solving methods, an "effort budget," and conflict resolution mechanisms.

**Example**: Competitive intelligence synthesis. Client requests intelligence → Pricing, Product, Marketing, Finance, Social, and Strategy Intelligence Agents establish channels and divide the work → Real-time cross-referencing, validation, and synthesis → Produces a cross-validated competitive landscape and strategic recommendations.

---

## 6. Agent Workflow Patterns

Workflows define **how Agents communicate, hand off tasks, and collaborate**, and are typically **pre-defined and relatively static**.

### 6.1 Sequential Workflow

Executes in a **predetermined order**, suitable for repeatable processes that require an audit trail (e.g., document review, compliance checks). Can be driven by software logic or **AI routing** (determining the next step based on intermediate results). Advantages are predictability, estimable costs, and stage-specific debugging; the downside is lower flexibility for exceptions or entirely new scenarios.

![Multi-Agent Sequential Workflow Diagram](/blog/04-building-effective-ai-agents/5_Multi-agent sequential workflow.webp)

**Applicability**: Can be broken down into fixed subtasks, stages have clear dependencies, cannot be parallelized, or requires progressive refinement like "draft → review → finalize."  
**Inapplicability**: Few stages where a single Agent suffices, requires Agent collaboration rather than simple handoffs, or the process requires backtracking and iteration.

**Example**: Automated data science insights. Request comes in → Scoping Agent determines the analysis type and data sources → Data Engineering Agent fetches, cleans, and engineers features → Analysis Agent executes statistics/modeling/visualization or hands off to a human → Review/Escalation → Produces report or dashboard.

### 6.2 Parallel Workflow

**Multiple Agents simultaneously** process independent subtasks, and the results are then merged or post-processed. Suitable for scenarios needing multiple perspectives or significant acceleration (similar to fan-out/fan-in).

![Multi-Agent Parallel Workflow Diagram](/blog/04-building-effective-ai-agents/6_Multi-agnet-parallel-workflow.webp)

**Applicability**: Subtasks can be parallelized, or multiple perspectives can increase confidence; for example, one prompt queries the model while another filters for inappropriate content; or multiple prompts vote on code vulnerabilities or content appropriateness.

**Inapplicability**: Tasks must accumulate context sequentially, require strict order or determinism, resources are constrained, or shared state and conflict resolution cannot be coordinated.

**Example**: Financial risk assessment. Application received → Data Aggregation Agent collects credit/market/operational/regulatory data → Credit Risk, Market Risk, Operational Risk, and Compliance Agents analyze in **parallel** → Risk Aggregation and Decision Engine weighs and synthesizes → Produces approval/rejection recommendations and a report.

### 6.3 Evaluator-Optimizer Workflow

One AI **generates**, another **evaluates and provides feedback**, iterating until the standard is met—similar to the collaboration between a writer and an editor.

![Multi-Agent Evaluator-Optimizer Workflow Diagram](/blog/04-building-effective-ai-agents/7_Multi-agent-evaluator-workflow.webp)

**Applicability**: Has clear evaluation criteria, iterative refinement brings measurable value, such as literary translation, code generation with strict safety requirements, external communications demanding a specific tone, or multi-step reasoning and verification.

**Inapplicability**: The first output is sufficient, criteria are subjective or unclear, time and cost do not permit it, real-time response is needed, simple classification, or token budgets are extremely tight.

**Example**: Automated API documentation generation. Code inputted → Generator Agent produces a draft document → Technical Evaluator Agent checks parameters, endpoints, and examples against the code → Generator Agent revises based on feedback, usually 2–4 rounds → Publishes to the developer portal.

---

## 7. Decision Framework: How to Choose an Architecture?

Choose based on **control requirements, problem complexity, resources**, and **domain depth**.

### 7.1 Control Requirements

- **High** (regulatory, finance, safety-critical) → Single Agent or Sequential Workflow; behavior is predictable and traceable.
- **Medium** (customer service, content, analysis) → Hierarchical Multi-Agent; balances flexibility and supervision.
- **Low** (research, brainstorming, complex analysis) → Collaborative Multi-Agent is viable; uncertainty is acceptable.

### 7.2 Problem Complexity

- **Single Domain** (product Q&A, returns, reporting) → Single Agent suffices.
- **Multiple Domains but Predictable** (onboarding, compliance processes, standard analysis) → Sequential or Parallel Workflow.
- **Complex, Open-ended** (strategic analysis, research, system troubleshooting) → Multi-Agent Architecture.

### 7.3 Resource Constraints

- **Tight Budget / Tokens** → Single Agent or streamlined Parallel Workflow (multi-agent uses ~10–15x more tokens).
- **Time-Sensitive** → Deploy a Single Agent first, then plan for evolution.
- **Long-term Strategy** → Design with modules and interfaces from the Single Agent stage to facilitate adding more Agents later.

### 7.4 Domain Depth

- **Single Domain, Mature Process** → Single Agent + specialized Skills.
- **Multiple Domains requiring Coordination** → Multi-Agent, each equipped with specific Skills (e.g., contract analysis, risk, and compliance handled separately, then collaborated on).

**Brief Comparison**: Single Agents are suitable for customer service, document processing, code review, and routine analysis; Sequential Workflows fit multi-stage reviews, content production pipelines, data transformation, and compliance; Parallel Workflows are for multi-perspective, parallelizable tasks prioritizing speed and multi-dimensional risk assessment; Multi-Agent systems are for complex problem-solving, research, cross-system dynamic interactions, and strategic support.

---

## 8. Hybrid Architectures and Evolution

In practice, **hybrid patterns** often emerge:

- **Hierarchical + Parallel**: A supervisor delegates to specialized Agents, which then run parallel workflows internally (e.g., credit/market/operational risk assessed in parallel during a risk evaluation).
- **Sequential + Dynamic Routing**: Switching between different Agents based on intermediate results in a linear process (e.g., customer service first categorizes, then routes to a simple resolution Agent or a complex research team).
- **Single Agent + Multi-Agent Escalation**: Daily tasks handled by a single Agent, with edge cases triggering a multi-agent system, balancing cost and capability.

The e-commerce evolution example in the documentation: Single customer service Agent → Routes by order status/product/complaint → Various specialized Agents + shared context → Inventory/Payment/Logistics multi-agent coordination → Evaluator Agents added for quality and continuous improvement. The key is: **Architectures evolve with needs. Start simple, be metrics-driven, and only add complexity when value can be proven.**

---

## 9. Summary and Next Steps

- **AI Engineering answers questions; Agents solve problems.** Enterprise examples show significant productivity and quality improvements in scenarios like customer service, risk control, marketing, legal, and development.
- **Architecture choices** should align with business value: Single Agent → Workflows → Multi-Agent, paired with Skills, observability, and modularity.
- **When making decisions**, clearly define: control requirements, problem complexity, resources, and domain depth, then map them to the applicable scenarios for Single / Sequential / Parallel / Multi-Agent systems.
- **Start with the simplest architecture that meets current needs**, preserving paths for future expansion; observability and business-aligned metrics must be incorporated from day one.

If you are implementing Agents using Claude, you can start with the API, documentation, and prompt engineering from the [Claude Developer Platform](https://www.claude.com/platform/api), and pair it with Agent Skills, multi-agent architecture guides, and the Anthropic Engineering Blog for advanced design and deployment. This article's content is adapted from Anthropic's "Building Effective AI Agents" document and serves as a reference for teams during selection and implementation.
