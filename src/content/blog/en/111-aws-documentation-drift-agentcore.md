---
title: "AWS Bedrock AgentCore and Documentation Drift: Code as Authority, MCP at the Write Boundary"
description: "A source-grounded analysis of AWS and Corley’s Eutelsat case: use code as the source of truth, RAG for domain context, and human-reviewed MCP writes for governed documentation publishing."
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "The important design decision is not letting an agent write to Confluence; it is separating authority: code defines implementation facts, RAG supplies domain context, the documentation system holds the publication artifact, and humans own release decisions."
  - "AWS’s nine-step flow separates knowledge-base maintenance with S3, EventBridge, Lambda, and S3 Vectors from operational synchronization with AgentCore Runtime, Gateway, and GitLab/Atlassian MCP."
  - "The 15–20 minute execution time, few-dollar per-repository cost, more-than-90% time-saving estimate, and 30-repository result are first-party AWS/Corley/Eutelsat case claims, not independent benchmarks."
  - "Adoption should start with reviewable diffs, minimal MCP scopes, versioned sources, and recovery paths before attempting automatic cross-repository publishing."
audience:
  - "Platform engineers building enterprise documentation systems, RAG pipelines, or coding agents"
  - "Architects and engineering leaders defining source-of-truth, MCP permissions, and human-in-the-loop publication controls"
category: "Cloud & Platform"
tags: ["AI Agent", "Enterprise AI", "RAG", "Governance", "AWS"]
cluster: "ai-platform-governance"
clusterRole: "case"
clusterOrder: 15
kind: "article"
showToc: true
image: "/blog/aws-documentation-drift-agentcore/title_image.webp"
---

Documentation drift is usually not a matter of nobody caring about documentation. Code changes, documentation review, and domain knowledge are owned by different teams and move at different speeds. On September 20, 2026, the AWS Public Sector Blog described a solution that AWS Advanced Partner Corley built for Eutelsat: an agent reads source code from GitLab repositories, retrieves aerospace and satellite terminology from a domain knowledge base, and creates or updates project documentation in Atlassian Confluence.

The interesting part is not that an agent can write documentation. It is the separation of four kinds of authority: **code is the source of truth for implementation facts; the RAG knowledge base supplies domain context; Confluence holds the publication artifact; and a human remains responsible for release and exceptions.** Without that separation in tool contracts, review flows, and audit traces, automatic synchronization can simply copy stale content into another system faster.

> **Huahua in one sentence**
>
> A reliable documentation agent knows which source can decide what, which tools it may only read, and who has the authority to publish.

## Separate the four authorities first

The AWS post explicitly distinguishes the domain knowledge base from the project documentation maintained by the agent. That distinction is the foundation of a governable design:

| Layer | What it may decide | What it must not overrule |
| --- | --- | --- |
| Source code repository | APIs, modules, dependencies, flows, and implemented behavior | The complete explanation of domain terminology or undocumented operating policy |
| Domain knowledge base | Aerospace or satellite terminology, standards, system context, and relationships | Interfaces, behaviors, or version facts contradicted by the code |
| Existing project documentation | Page structure, reader context, history, and text to compare | The code when the two sources disagree |
| Human reviewer | Whether to accept differences, resolve uncertainty, approve publication, and recover | Treating unverified agent output as engineering evidence |

This is not merely a prompt-engineering preference. It is a division of data and side-effect responsibility. If the agent sees a polished but stale Confluence description, it should treat it as an input to compare. If retrieval returns a domain handbook, it may help the agent use the right terms, but semantic similarity cannot invent functionality that the repository does not show.

## The AWS case has two loops

AWS’s first figure gives a high-level view of the domain expert, user, agent, knowledge base, source-code repositories, and project documentation. The important arrow is not simply “agent to documentation.” Source code and domain context enter the generation flow together, and the agent produces a documentation change that still needs review.

![AWS official high-level architecture showing the domain expert, user, agent, knowledge base, source code, and project documentation](/blog/aws-documentation-drift-agentcore/aws-figure-1-high-level-architecture.png)

*Figure: Figure 1 from the AWS Public Sector Blog. It is an official high-level architecture diagram; the reference architecture is not a production guarantee for every organization.*

The second figure breaks the implementation into nine interactions. The first four are a relatively low-frequency knowledge-base maintenance loop; the last five are the operational flow for each synchronization request.

![AWS official implementation architecture showing S3, EventBridge, Lambda, S3 Vectors, AgentCore, and MCP across the nine-step flow](/blog/aws-documentation-drift-agentcore/aws-figure-2-implementation-architecture.png)

*Figure: Figure 2 from the AWS Public Sector Blog. The numbering matches the nine steps below; the boundary and risk analysis is Bloss0m’s synthesis.*

### Knowledge-base maintenance: steps 1–4

1. **A domain expert uploads Markdown to S3.** These documents describe infrastructure and industry context. Their purpose is to teach the agent domain language, not to become a repository’s project documentation directly.
2. **EventBridge Scheduler invokes Lambda on a schedule.** AWS says this case normally runs daily because the domain documentation changes infrequently. That is a case-specific scheduling choice, not a universal freshness SLA.
3. **Lambda triggers ingestion through the Bedrock agent API.** This connects the schedule to index maintenance and makes ingestion failure an observable pipeline event instead of a surprise when the agent answers a request.
4. **Bedrock ingests the S3 documents into Amazon S3 Vectors.** Once ingestion completes, the knowledge base is ready for the documentation synchronization agent. AWS’s S3 Vectors documentation positions it as AI-ready vector storage and query infrastructure, not as an authority policy.

The completion condition for this first loop should be more than “the index job returned success.” A production system should be able to identify the S3 version included in the snapshot, documents deleted or replaced, changes to chunking or embedding configuration, and the knowledge-base snapshot used by each agent run.

### Documentation synchronization: steps 5–9

5. **A user submits one or more repository URLs through a chat web application.** This is the task boundary where tenant, project, branch or tag, and dry-run options should be established. A URL should not be treated as an unstructured prompt string.
6. **On the first invocation, AgentCore Runtime pulls the Docker image from ECR and launches the agent.** The case uses the Strands Agents framework. Runtime hosts agent execution and related observability; it does not automatically define repository or Confluence business permissions for you.
7. **The agent reads source code through the GitLab MCP server.** AgentCore Gateway exposes the MCP server, which the AWS post says is provisioned using ECR. GitLab’s official documentation describes an MCP server as an interface that lets external AI tools access GitLab projects, issues, merge requests, and other data. Project allow-lists and read-only policy still belong in your platform configuration.
8. **The agent retrieves relevant domain documentation from the Bedrock knowledge base based on the source code.** The AWS case uses the Retrieve API. That API returns retrieval results, scores, metadata, and locations, and it can also fail with access denied, throttling, or dependency errors. RAG supplies language and relationship context here; it does not use similarity to vote on which code is true.
9. **Through AgentCore Gateway and a managed Atlassian MCP server, the agent reads existing Confluence documentation and uses the source code as the single source of truth to create or update the project documentation.** This combines reading and writing and is therefore the point that needs the clearest write boundary. Being able to call Confluence does not mean being allowed to publish anything without conditions.

The split also shows why Runtime and Gateway should not be treated as one component. AgentCore Runtime hosts agent execution; Gateway provides a unified entry point for tools and resources, MCP translation, authentication, and credential exchange. AWS’s Gateway documentation says it can combine APIs, Lambda functions, agents, and model providers behind one endpoint. That convenience does not provide least privilege, failure recovery, or documentation publication policy for an enterprise.

## RAG is domain context, not a second source of truth

It is easy to reduce this case to “put project documents in a vector store and ask a model to write a page.” A more accurate model has three inputs:

- **Code facts:** modules, endpoints, configuration, call relationships, and data flows found in the repository.
- **Domain context:** terminology, standards, system background, and cross-system relationships retrieved from S3 Vectors.
- **Publication context:** current Confluence page structure, historical descriptions, links, and sections to repair.

All three may appear in the prompt, but they cannot have equal priority. The agent contract should state that:

1. The agent builds a code-fact inventory before using domain context to explain its meaning.
2. When domain context conflicts with code, the code description remains the implementation fact and the conflict becomes a review item.
3. When the code does not provide enough evidence, the agent must not present a feature as deployed, supported, or policy-compliant merely because retrieval suggests it.
4. Important statements retain the repository path, commit or branch, knowledge-document version, and Confluence page version.

This separation also lets the team distinguish retrieval failures from generation failures. A Retrieve score is a relevance signal, not proof of correctness. Low-score, contradictory, or single-source results should enter human review rather than being hidden by more confident model wording.

> **Huahua's engineering note**
>
> If Confluence, RAG, and code are all readable by the agent, the trace must retain each source’s version and role; without source, snapshot, scope, and diff, an incident review cannot answer where a sentence came from.

## The real MCP boundary is the write operation

MCP standardizes tool and data connections. It does not make “read a repository” and “publish to Confluence” the same risk. This case has at least three distinct authority paths:

| Tool path | Least-privilege starting point | What must be verified separately |
| --- | --- | --- |
| GitLab MCP → source code | Specific project, specific branch or tag, read-only | Whether the agent can reach forks, private projects, or repositories outside the task |
| Retrieve API → domain KB | Specific knowledge base, metadata filters, controlled queries | Whether another tenant, stale documents, or sensitive content enters the prompt |
| Atlassian MCP → Confluence | Specific space or page tree, draft or restricted write | Whether human edits are overwritten, the wrong production space is used, or approval is bypassed |

In practice, split writing into four explicit stages: **read → plan → diff → publish**. During read, the agent gathers evidence. During plan, it lists additions, modifications, retained sections, and unknowns. During diff, it produces reviewable Markdown or HTML differences with citations. Only publish may call a Confluence write tool, and that call should carry the reviewer, source commit, knowledge snapshot, target page version, and an idempotency key.

When AgentCore Gateway exposes multiple MCP servers behind one endpoint, the platform still needs to verify at the Gateway, provider, and application layers: principal, tool scope, target resource, environment, and whether writes are allowed. A managed gateway reduces integration code; it does not make a tool description a security policy.

## Human review is the control plane, not decoration

The Eutelsat/Corley results reported by AWS are: approximately 15–20 minutes of agent execution per repository; about 1–2 hours of human review for documentation generated from scratch; roughly one calendar week for 30 repositories; a few dollars of AWS cost per repository; and an estimated time saving of more than 90% versus a fully manual approach. The post also estimates one to three senior-engineer person-days for a medium-complexity repository, or 30–90 person-days across the estate.

These figures need to be read precisely:

- They are first-party reporting in an AWS Public Sector Blog case involving AWS partner and customer claims, not an independently reproduced benchmark.
- “More than 90% saved” includes the case’s execution and review assumptions. It does not mean documentation can be published without review.
- “A few dollars” does not disclose the full model, token, Gateway, MCP, storage, network, and human-cost breakdown, and should not be treated as a quote for another repository.
- The sample is 30 repositories with no documentation in an Eutelsat team. Repository complexity, languages, permissions, and Confluence structure will change the result.

The better adoption target is not to remove the 1–2 hours of review. It is to make that time about uncertainty and ownership: which code facts are certain, which domain inferences are defensible, which cross-repository relationships need an owner’s confirmation, and which pages should wait before publication.

## Failure modes that documentation automation can hide

### An unstable repository source

If the user supplies only a repository URL, the agent may read the default branch, an unmerged branch, or the wrong commit. The task manifest should pin the branch, tag, or commit and record submodules, generated code, and uncommitted-change policy. The published page should retain the source revision.

### Retrieval returns context, not evidence

A highly similar domain document may describe another version of the system. Stale documents, bad metadata, or chunk boundaries can cause the agent to turn a possible relationship into an implemented fact. Test retrieval for freshness, coverage, contradiction, and permissions instead of only judging whether the prose reads well.

### Existing documentation contaminates the source of truth

If the prompt ranks Confluence above code, the agent can preserve an incorrect API, an old architecture, or a service that no longer exists. Existing documentation should be explicitly marked as input for comparison, and the diff should show which claims changed because of a code contradiction.

### An MCP write creates the wrong side effect

The tool can connect successfully while the scope, space, page ID, or token points to the wrong environment. Start with a draft or restricted space, use page-version optimistic concurrency, and make every publish idempotent. If an update fails, retain the diff instead of guessing another page.

### Cross-repository relationships are overstated

AWS says the case can create an estate-wide cross-linked view from documentation and code analysis. That is a useful discovery result, but it does not mean every relationship is a verified runtime dependency. Label inferred relationships separately from code-confirmed dependencies and send them to service owners.

### The run succeeds but cannot be reconstructed

Each publication should retain the source revision, knowledge snapshot, retrieved document IDs, model and prompt version, tool calls, Confluence page version, reviewer, and result. AgentCore Runtime tracing can help expose reasoning steps, tool invocations, and model interactions, but retention, redaction, tenant boundaries, and incident access still need enterprise policy.

## A minimum adoption checklist

1. **Define an authority contract:** identify which fields may only be decided by code, which terminology comes from the knowledge base, and which sections require a service owner.
2. **Pin every source to a version:** repository, branch or tag, commit, S3 object version, index snapshot, and Confluence page version should be traceable.
3. **Start with a read-only dry run:** emit an inventory, citations, and diff before enabling Confluence writes.
4. **Build negative RAG tests:** include stale documents, similar-but-different systems, contradictions, no-answer cases, and denied permissions.
5. **Write a scope for every MCP tool:** project, space, page tree, environment, operation type, and acceptable side effects must be explicit.
6. **Make publication a human decision:** automate low-risk formatting fixes; route interface, permission, data-flow, and cross-service changes to review.
7. **Measure adoption separately:** track retrieval coverage, factual error rate, review time, rollback rate, cost per repository, and documentation freshness.

If you are building the broader agent platform, start with the [AI Agent guide](/en/blog/64-ai-agent-guide/) for the layers of runtime, tools, state, and evaluation. The [Enterprise RAG guide](/en/blog/65-enterprise-rag-guide/) covers data, permissions, and evaluation. For MCP tool controls, see [GitHub MCP enterprise controls](/en/blog/87-github-mcp-enterprise-controls/). If your AgentCore design also involves OAuth and token boundaries, the [Consent Portal analysis](/en/blog/104-aws-agentcore-consent-portal/) covers the identity path.

## Sources and evidence boundaries

- [AWS Public Sector Blog: Reducing documentation drift with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/publicsector/reducing-documentation-drift-with-amazon-bedrock-agentcore/) — nine-step flow, architecture figures, Eutelsat/Corley case results, and customer perspective.
- [Amazon Bedrock AgentCore Runtime documentation](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html) — Runtime’s agent-hosting, tracing, and tool-integration role.
- [Amazon Bedrock AgentCore Gateway documentation](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html) — MCP translation, tool composition, authentication, and credential exchange.
- [Amazon S3 Vectors documentation](https://aws.amazon.com/s3/features/vectors/) — vector storage, query, and Bedrock Knowledge Bases integration.
- [Amazon Bedrock Retrieve API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_Retrieve.html) — retrieval results, metadata, scores, and error semantics.
- [Strands Agents](https://strandsagents.com/) — the agent framework used in the AWS case and its MCP/human-approval capabilities.
- [GitLab Model Context Protocol documentation](https://docs.gitlab.com/user/gitlab_duo/model_context_protocol/) — GitLab MCP’s data and tool connection model.

AWS product documentation can establish how these services and interfaces are designed. It cannot, by itself, establish the cost, accuracy, permission isolation, documentation quality, or production SLA of an organization outside the reported Eutelsat case. Those are the evaluation and governance tasks that adoption still has to supply.
