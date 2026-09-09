---
title: "WeKnora Architecture: From Document Ingestion to a Governed Agent Knowledge Platform"
description: "A systems reading of Tencent WeKnora: its three-process core, ingestion and retrieval flows, and how Agents, MCP, sandboxed Skills, memory, and governance share one control plane."
pubDate: 2026-09-08
updatedDate: 2026-09-08
tldr:
  - "WeKnora is more than vector search plus an LLM: it puts document processing, hybrid retrieval, agent execution, and governance into one self-hostable platform."
  - "The core is a Go app, Vue3 frontend, and Python docreader backed by PostgreSQL/ParadeDB and Redis; graphs, external vector stores, web search, and Langfuse can be enabled by profile."
  - "Ingestion uses a 202 + Asynq + gRPC asynchronous pipeline, while answers use query understanding → parallel retrieval → rerank → SSE; their failures and SLOs should be measured separately."
  - "An Agent becomes enterprise-ready through more than ReAct: MCP OAuth, sandboxed Skills, long-term memory, RBAC, audit, and worker governance define the real boundary."
audience:
  - "Architects and platform engineers evaluating self-hosted RAG or Agent knowledge platforms"
  - "Technical owners connecting MCP, document parsing, permissions, and observability to enterprise AI"
category: "AI Engineering"
tags: ["RAG", "AI Agent", "MCP", "Platform Engineering", "Enterprise AI"]
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 20
kind: guide
showToc: true
wideHeader: true
guideVersion: "2026.09"
image: "/blog/95-weknora-architecture/title_image.webp"
---
If enterprise AI were a knowledge factory, the hard part would rarely be connecting an LLM to a chat window. The hard part is getting documents in, finding defensible evidence, invoking tools safely, and explaining why each answer took its path. **WeKnora** is worth studying because it does not stop at a RAG demo: Tencent positions it as an open-source LLM knowledge platform that supports RAG, autonomous reasoning Agents, a self-maintaining Wiki, and MCP while turning parsing, chunking, indexing, queues, permissions, and observability into a self-hostable system.

This article uses Tencent/WeKnora’s official repository, architecture documentation, and `v0.8.0` changelog as its baseline, checked on **September 8, 2026**. It is not a line-by-line code review. I first state what the official sources explicitly establish, then label the engineering conclusions that follow from those boundaries. For the RAG vocabulary, start with [Enterprise RAG: A Complete Guide](/en/blog/65-enterprise-rag-guide/); for the Agent control-plane language, see [The Complete Guide to AI Agents](/en/blog/64-ai-agent-guide/).

> **Huahua in one sentence**
>
> WeKnora’s core is not “which model answers best,” but connecting knowledge lifecycle and Agent action lifecycle to one traceable control plane.

![WeKnora components and end-to-end data flow: documents are parsed, chunked, and indexed before entering a governed RAG, Agent, and MCP execution path.](/blog/95-weknora-architecture/weknora-architecture.svg)

## The ninety-second map

First compress the official architecture into one table. “Core” means the path started by the default Docker Compose setup; knowledge graphs, external vector stores, web search, object storage, and Langfuse are optional capabilities, not requirements for every deployment.

| Layer | Official components | Responsibility | What not to mistake it for |
| --- | --- | --- | --- |
| Entry | Vue3 Web, CLI/Go SDK, MCP client, IM/Embed | Bring users, integrations, and message channels into the platform | Clients do not directly touch the database |
| Control plane | Go `app`, Gin REST, SSE, Agent engine, Asynq worker | Authentication, routing, chat, scheduling, and model/tool coordination | Not one prompt that owns every decision |
| Document boundary | Python `docreader`, gRPC, 25+ parsers | Turn PDF, DOCX, Excel, EPUB, web pages, and more into processable content and page images | Not a direct file-to-embedding call |
| Evidence plane | PostgreSQL/ParadeDB, BM25, pgvector, reranker | Store knowledge, hybrid retrieval, context, and citations | A larger top-k is not automatically more reliable |
| Execution plane | ReAct Agent, MCP, Web Search, sandbox Skills, memory | Take multi-step actions within evidence and policy boundaries | Not free-form API access for the model |
| Control and observation | JWT/API key/OIDC, RBAC, audit, Redis, OpenTelemetry/Langfuse | Identity, tasks, streams, limits, and replay | Observability is not merely inspecting the final answer |

This view reveals an important design choice: **WeKnora has both a knowledge data plane and an Agent action plane, but they share the Go app’s control plane.** Document parsing and Agent execution need not be the same workload, yet they can share tenant, permission, model, and trace context.

## 1. Core topology: three processes, one control plane

The official architecture describes a three-process core—main service, frontend, and document parsing microservice—plus PostgreSQL and Redis. It looks simple, but the split is meaningful: parser dependencies are isolated from the main service, while data and queues provide shared state through stable infrastructure.

### `frontend`: entry and reverse proxy

The Vue3 frontend is served as static assets by NGINX, which reverse-proxies `/api` to `app`. Browser chat uses HTTP/SSE; the UI does not need to know where the Agent engine, PostgreSQL, or docreader runs. The official document also notes that `APP_HOST`, `APP_BACKEND_PORT`, and `APP_SCHEME` can point the frontend at a remote backend, allowing the UI and core service to be deployed separately.

### `app`: the actual main control plane

The Go `app` owns REST APIs, RAG retrieval, the Agent engine, asynchronous task workers, and IM/Embed channel integration in the default architecture. It is not merely a thin API shell: authentication, RBAC, knowledge services, chat pipelines, SSE stream management, MCP/sandbox integration, and task coordination live within this boundary.

Calling it a Go monolith is not automatically a criticism. For a self-hosted platform, one core service with clear internal package boundaries can avoid prematurely turning every domain into its own deployable, versioned, and observable microservice. The real question is whether handlers, services, repositories, agents, MCP, sandbox, streams, and middleware can be tested and replaced as distinct boundaries.

### `docreader`: isolate parsing dependencies

The Python docreader exposes a gRPC parsing service; the official architecture page lists 25+ formats including PDF, DOCX, Excel, EPUB, and web pages, along with page rendering. `app` sends file bytes or URLs through gRPC `ReadStream`, and the worker receives Markdown, images, OCR, and rendered pages. Parsed images can also move through the shared `docreader-tmp` volume.

This boundary addresses a practical reality: document parsing involves OCR, office parsers, web processing, and native libraries, with a different dependency and failure profile from API and permission logic. Isolation does not make parsing correct, but it creates a more manageable fault domain for parser crashes, resource limits, and upgrades.

### PostgreSQL/ParadeDB and Redis are not sidecars

The default database is ParadeDB PostgreSQL. The official document emphasizes that it provides both BM25 full-text search and pgvector, so `RETRIEVE_DRIVER=postgres` does not require a separate vector database. Redis is more than a cache: it handles Asynq jobs, cross-instance SSE stream management, system-settings Pub/Sub, rate limiting, and per-model concurrency gates.

This means a Redis failure can affect both “does document processing continue?” and “can a chat stream resume?” Those SLOs should be monitored separately in production. The database also stores more than final answers: it holds knowledge, chunks, summaries, questions, entities, and stage status.

> **Huahua's engineering note**
>
> “One core service” does not mean “one failure mode.” WeKnora puts parsing, querying, queues, streams, and tool execution in one product, so deployment still needs separate resource budgets, retries, and alerts for each workload.

## 2. Document ingestion: from `202` to citable evidence

The most interesting part of WeKnora is not the number of supported formats, but treating an upload as a knowledge job with a lifecycle instead of a synchronous function call. The official architecture document gives a concrete upload flow:

1. **Authenticate at the edge.** The browser sends `/api/v1/knowledge-bases/:id/knowledge/file`; the request passes Request ID, auth, API-key gating, and RBAC before the caller can operate on that Knowledge Base.
2. **Write pending state first.** `KnowledgeService` creates a knowledge row, stores the file locally or in object storage, and marks it `parse_status=pending`.
3. **Return the job handle.** The API returns `202` and a `knowledge_id`; the frontend polls or subscribes to progress. Upload success does not mean the document is searchable.
4. **Enqueue Asynq.** `TypeDocumentProcess` enters Redis and is consumed by the app’s core worker pool. Retries, concurrency, and queue separation are therefore explicit governance points rather than an ad hoc goroutine per request.
5. **Parse over gRPC.** The worker sends file bytes or a URL through gRPC `ReadStream` to docreader and receives Markdown, images, OCR, and rendered pages.
6. **Build chunks.** The worker splits content using parent-child or heading strategies while retaining title, page, source, and structural metadata. This determines whether a later citation can return to the original context.
7. **Batch embeddings and dual indexing.** BatchEmbedder runs behind a per-model concurrency gate, writes vector indexes, and builds BM25 keyword indexes. The signals are not mutually exclusive product choices; they are two inputs to hybrid retrieval.
8. **Enrich and complete.** Summary, question, and graph enrichment subtasks are queued; workers write summaries, questions, and entities. Only when `PendingSubtasksCount` reaches zero does `parse_status` become `completed`.

This pipeline separates “uploaded,” “parsed,” “indexed,” and “enriched.” It may add visible waiting, but it lets the platform answer whether a job is stuck in the parser, embedding, index, or enrichment stage.

| Failure location | Observable symptom | First evidence to inspect | What not to do first |
| --- | --- | --- | --- |
| Identity/Knowledge Base permission | Upload rejected or cross-tenant data missing | Auth, RBAC, and resource-ownership trace | Do not disable ACL and retry |
| Parser | `pending` stalls, pages or images are missing | docreader gRPC logs, format, and file size | Do not increase the LLM context first |
| Queue | API returns 202 but no worker consumes it | Asynq queue, retry count, and worker health | Do not upload the same file repeatedly |
| Index | Parsing completes but search returns nothing | Chunks, embeddings, and BM25/vector indexes | Do not switch to a larger generation model first |
| Enrichment | Basic retrieval works but Wiki/graph fields are absent | Enrichment jobs and pending count | Do not treat incomplete enrichment as complete knowledge |

This follows the same diagnostic rule as [Enterprise RAG: A Complete Guide](/en/blog/65-enterprise-rag-guide/): locate the failure in ingestion, parsing, indexing, reranking, context, or generation before changing the model. WeKnora’s status and queue design provide operational seams for that diagnosis.

## 3. Answer flow: hybrid retrieval with SSE

Ingestion is asynchronous; conversational answers take a synchronous streaming path. The official architecture describes `knowledge-chat` and agent-chat as Handler → `SessionService` → `chat_pipeline`: query understanding, parallel retrieval, reranking, merging, prompt assembly, and LLM streaming, followed by token delivery through the Stream Manager.

An answer can be read as seven stages:

1. **Resolve session and identity.** Establish tenant, user, Knowledge Base, and available tools before treating “can ask” as “can see every source.”
2. **Understand the query.** Process language, abbreviations, time conditions, and possible rewrites; Agent mode may also decompose the question into subtasks.
3. **Retrieve in parallel.** Run BM25, vector, or external retrieval drivers under permission filters. GraphRAG, Web Search, and other providers add evidence sources; they are not an invisible default.
4. **Rerank and merge.** Bring candidates from different retrievers into deduplication and ranking, control the context budget, and retain citation metadata.
5. **Select the answer path.** Quick Q&A can generate from evidence; Agent mode may call MCP, Web Search, or a sandbox Skill; Wiki mode organizes the result as revisioned Markdown.
6. **Generate under policy.** Prompt assembly includes evidence, sources, role limits, and refusal rules. If evidence is insufficient, clarify, rewrite, retrieve again, or refuse rather than guess.
7. **Stream and record.** The Stream Manager sends tokens to browser, Embed, or IM channels while session, tool, evidence, latency, and error context remain available for replay.

### Three modes, not one “Agent on/off” switch

| Mode | Main path | Best fit | Main controls |
| --- | --- | --- | --- |
| Quick Q&A | retrieve → rerank → prompt → answer | One knowledge base, one lookup, low-latency questions | ACL, evidence sufficiency, citation coverage, P95 latency |
| Agent | plan/ReAct → knowledge/MCP/web/Skill → observe → answer | Decomposition, cross-source work, or actions | Tool scope, OAuth, sandbox, max steps, human escalation |
| Wiki | Agent creates structured Markdown → graph/revision | Turning exploration into maintainable knowledge | Revision, source, author, rollback, staleness |

“Agent” is not a larger chat button. It allows more states and side effects to cross the boundary. That helps with dynamic tasks, but changes latency, cost, permissions, and reproducibility at every step. This is why [Agentic AI Platform Contract](/en/blog/93-agentic-ai-platform-contract/) treats Evidence, Policy, Judge, and Trace as one surface instead of reporting only answer accuracy.

## 4. Agent, MCP, Skills, and memory: closing the action plane

WeKnora’s Agent capabilities are several distinct boundaries rather than one framework abstraction.

### ReAct is orchestration, not an authorization system

The official README describes ReACT multi-step reasoning as coordinating knowledge retrieval, MCP, Skill sandboxes, and Web Search. That answers “should the next step retrieve, call a tool, or continue reasoning?” It does not determine whether the user is authorized, nor does it guarantee safe tool inputs.

A defensible Agent path therefore looks like:

`intent → allowed sources/tools → retrieve or call → observe result → evidence/policy check → next step or final answer`

The `allowed sources/tools` and `evidence/policy check` stages cannot be removed by prompt. The model may propose a tool call, but the app’s identity, registration, parameter validation, and side-effect policy decide whether it executes.

### MCP is an integration boundary; OAuth is an admission condition

The repository contains a Python `mcp-server/` that exposes WeKnora APIs to MCP clients such as Claude. The `v0.8.0` changelog additionally records MCP Server 1.1.x, stateless HTTP and SSE compatibility, and 29 tools. This lets an external Agent use the knowledge base, and lets a WeKnora Agent connect to enterprise tools.

MCP standardizes resources, tool schemas, and interaction transport; it does not provide least privilege by itself. Production questions include: who creates the session, which tenant and Knowledge Base are in scope, what the OAuth token can do, whether tool failures are retried, and whether mutations need human confirmation. “MCP-callable” must not become “safe for any Agent to call.”

### A Skill sandbox is an execution boundary

The `v0.8.0` release notes move Skill execution toward a session-persistent sandbox runtime with Docker, E2B, and Cube. The backends share a `RemoteSandboxClient` interface, and workspaces can configure images, CPU, memory, TTL, DNS, templates, and snapshots. Network access defaults to deny with allow/deny lists; the local host-process backend was removed.

This separates “the model wants to run code” from “that code runs on the app host.” The release notes also warn that a Docker backend with a mounted `docker.sock` can carry root-level risk. Docker opt-in is therefore a deployment decision about authority, not a cosmetic toggle.

### Long-term memory is searchable state, not free context

The same changelog adds cross-session long-term memory with profile, preference, fact, task, and interest types, plus automatic extraction, user confirmation, and `search_memory`. This enables persistent preferences and tasks, but also raises questions about staleness, deletion, workspace isolation, memory injection, and index/cache synchronization.

Memory should be governed as another evidence source rather than silently concatenated into a prompt. It needs an owner, scope, timestamp, confidence, retention, and provenance; otherwise personalization becomes unexplained contamination by old state.

## 5. The control plane: where enterprise adoption really sticks

WeKnora’s enterprise story is not merely an RBAC checkbox. The official README and architecture documentation describe a control plane that includes at least:

- **Multi-tenancy and multiple Knowledge Bases:** data, members, and resources must remain separated in every request, cache, index, and citation link.
- **Identity and API boundaries:** JWT Bearer, X-API-Key, and OIDC modes, plus scoped API-key/principal patterns, keep integrations from sharing human credentials.
- **RBAC and resource ownership:** four-level RBAC and owner/admin paths separate “can sign in” from “can operate this KB.”
- **Task control:** Redis/Asynq worker pools, per-model concurrency gates, retries, and dashboards make document load and provider limits observable.
- **Tool authorization:** MCP OAuth, tool scopes, sandbox network policy, and human confirmation define Agent side effects.
- **Audit and traces:** request IDs, OpenTelemetry/Langfuse LLM traces, tool calls, citations, and refusal reasons let the system answer who did what under which conditions.

The important point is their dependency. Adding `tenant_id` in the database while omitting it from cache keys, streams, memory search, or citation URLs can still leak data. Storing only the final answer while losing query rewrites, candidate chunks, tool inputs, and policy decisions still prevents an audit.

### A responsibility map for one request

| Question | Responsible layer | Observable evidence |
| --- | --- | --- |
| Can this user ask this KB? | Auth, API-key gate, RBAC, ownership | Principal, tenant, and resource decision |
| Which content may enter context? | Source ACL, metadata filter, retrieval layer | Candidate IDs, versions, and permission scope |
| Why call this MCP tool? | Agent policy, tool scope, OAuth | Tool name, schema, token scope, approval |
| Why did the system not answer? | Evidence sufficiency, refusal/clarification policy | Missing evidence, policy branch, reason |
| Why was this slow? | Parser, queue, retrieval, LLM, stream | Stage latency, queue wait, retry, provider |

If you are moving an Agent platform from PoC to production, turn this table into review fields instead of reconstructing responsibility from application logs after an incident. That is also the point of [Agentic AI Platform Contract](/en/blog/93-agentic-ai-platform-contract/): a runtime that runs is not ready to launch if Evidence, Policy, Judge, or Trace is missing.

## 6. Repository and deployment shape: it is not Compose-only

The official repository layout is itself an architecture guide:

| Path | Responsibility | Question to ask while reading |
| --- | --- | --- |
| `internal/` | Go handlers, services, repositories, agents, MCP, sandbox, streams, middleware | Do control-plane boundaries exist in code, not only in docs? |
| `frontend/` | Vue3, TypeScript, Vite, TDesign, Pinia | How do SSE, permissions, and progress state reach the UI? |
| `docreader/` | Python gRPC, parsers, splitter, proto | Which layouts, images, tables, or metadata may be lost? |
| `config/` | Models, agents, prompt templates, runtime config | Can providers and Agent presets be replaced declaratively? |
| `mcp-server/`, `cli/`, `client/` | MCP, Agent-first CLI, Go SDK | Is the integration contract stable beyond a demo? |
| `migrations/`, `helm/`, `deploy/` | Database schema, Kubernetes, systemd | How are state upgrades and rollbacks handled? |

Beyond standard Docker Compose, the official architecture document lists several deployment forms:

- **Lite:** SQLite + sqlite-vec; without Redis, an in-process `SyncTaskExecutor` runs tasks, and embedded frontend assets can be served by Go. Useful for personal or small single-node use, but not a multi-replica queue design.
- **Desktop:** `cmd/desktop` packages the system with Wails v2 for a local application.
- **Kubernetes:** the `helm/` chart connects app, docreader, Redis, database, and optional components to existing platform governance.
- **Bare metal/macOS:** systemd units and a Homebrew Formula provide installation paths outside full Compose.

Optional profiles show the same trade-off. You can begin with ParadeDB’s built-in BM25 + pgvector path, then switch to Qdrant, Milvus, Weaviate, Doris, or external Elasticsearch/OpenSearch. You can enable Neo4j GraphRAG, SearXNG Web Search, MinIO, and Langfuse, but every added service creates another version, network, backup, permission, and alerting responsibility.

## 7. One complete walk: an enterprise policy question

Suppose someone asks, “How does a new engineer request production read-only access?” This is not just a text-generation problem; the platform must prove it used the right policy version without turning a request into an automatic permission mutation.

1. The user enters from Web, CLI, or enterprise IM; the app identifies principal, tenant, and Knowledge Base.
2. Query understanding extracts “new engineer,” “production,” “read-only,” and “request process”; the original query remains in the trace.
3. BM25 finds the exact role name and policy code; vector retrieval adds semantic variants such as onboarding and access request.
4. Reranking uses document version, permission, and relevance; an old draft or another department’s policy cannot enter context just because it is similar.
5. Quick Q&A returns steps, approvers, and citations. If department context is missing, it asks rather than inventing a default.
6. If the user asks, “Create the request for me,” the Agent can propose an MCP call, but it must check OAuth scope, fields, and mutation policy; without approval it can only prepare a draft.
7. If a CSV roster must be compared with the policy, a Skill can run in an isolated sandbox. Network access is denied by default, and input/output artifacts need workspace scope.
8. The final answer and citations stream over SSE, while the trace records retrieval candidates, reranking, tool decisions, sandbox execution, latency, and refusal or escalation reasons.

The value is not that one component is novel. It is that knowledge, action, and responsibility can live inside the same session. The real test is how every branch behaves when there is no answer, insufficient permission, a failed tool, a stale document, or a model timeout.

## 8. What I find strongest—and what deserves caution

### Strong: the boundaries of a productized RAG system are visible

WeKnora places multi-format parsing, hybrid retrieval, Agent, Wiki, MCP, sandbox, memory, CLI, and enterprise controls in one repository. For anyone studying how a knowledge platform becomes an Agent runtime, this is more useful than a single SDK because the questions lead through real queues, databases, gRPC, SSE, auth, and deployment interfaces.

### Strong: a simple default path with extension points

ParadeDB can provide BM25 and pgvector together, reducing service count for a small deployment; external vector stores, graphs, web search, or object storage can be added when needed. That is a pragmatic adoption path: establish an evidence pipeline first, then add components only when measured failures justify them.

### Caution: configurable does not mean verified

An official README or changelog can establish that a capability exists in the repository or release notes. It does not establish that your corpus, language, ACLs, model provider, network policy, and traffic meet production SLOs. In particular:

- “Supported format” does not mean your scans, tables, and layouts will cite correctly.
- BM25 + vector does not prove hybrid retrieval beats a single path for your query distribution.
- MCP, Skills, and memory do not prove side effects, deletion, retries, and costs are fully governed.
- A Docker/E2B/Cube adapter does not mean image provenance, network allowlists, quotas, and artifact retention are configured.
- An OpenTelemetry/Langfuse hook does not mean traces contain the evidence, policy, and tool fields needed to locate failures.

These are not negative conclusions about WeKnora. They are the validation work required to move from “the feature exists” to “the system can make a production promise.”

> **Huahua's take**
>
> WeKnora’s most instructive choice is not putting every AI capability in one box; it is giving documents, retrieval, and actions one tenant/permission/trace context. The next question is whether those contracts remain measurable on real data and failure paths.

## 9. Engineering checklist before adoption

If you are putting WeKnora into a PoC, answer these eight questions first:

1. **Sources:** Do the PDFs, office files, web pages, IM channels, and cloud sources have owners, versions, and deletion events?
2. **Parsing:** Can sampled titles, tables, images, OCR, page numbers, and code return to their original locations?
3. **Indexing:** Do your queries need both exact strings and semantic similarity? What are the offline baselines for BM25, vector, and rerank?
4. **Permissions:** Are ACLs consistent across ingestion, indexes, caches, memory, SSE, and citation pages?
5. **Agents:** Which tools are read-only and which mutate state? Where are OAuth scopes, parameter validation, and human gates defined?
6. **Sandbox:** Are Docker socket, network, DNS, CPU/memory, TTL, files, and artifact retention bounded explicitly?
7. **Evaluation:** Is there a frozen set covering no-answer cases, stale versions, cross-tenant isolation, tool failures, retries, and prompt injection?
8. **Observation:** Can one request ID replay query, candidates, rerank, tools, policy, model, queue wait, cost, and final answer?

Missing one item does not mean you cannot experiment. It means that item belongs in the PoC acceptance criteria rather than a “governance later” backlog.

## Conclusion: a decomposable knowledge operating system

After reading WeKnora, I would not reduce it to “another Tencent RAG project.” A more accurate reading is a Go control plane connecting multi-format document processing, hybrid retrieval, Wiki, ReAct Agents, MCP, sandboxed Skills, long-term memory, and enterprise governance into a self-hostable, replaceable, observable workflow.

Its strengths are complete engineering boundaries, a small default deployment path, and explicit extension points. Its challenge is that every extension point transfers responsibility to the adopter: freshness, ACLs, provider failures, tool side effects, sandbox risk, evaluation, and cost do not disappear because Agent mode is enabled.

For a next read, start with [LangChain OpenWiki: Building Retrieval from Open Knowledge](/en/blog/63-langchain-openwiki/) for knowledge maintenance, compare the data and evaluation layer with [Enterprise RAG: A Complete Guide](/en/blog/65-enterprise-rag-guide/), then use [Agentic AI Platform Contract](/en/blog/93-agentic-ai-platform-contract/) to test whether Evidence, Policy, Judge, and Trace actually connect to your launch process.

## Method and sources

- [Tencent/WeKnora repository](https://github.com/Tencent/WeKnora): official README, capability scope, repository layout, and deployment entry points.
- [Official architecture overview](https://github.com/Tencent/WeKnora/blob/main/website-docs/02-architecture/01-overview.md): three-process core, technology stack, protocols, upload sequence, and chat pipeline.
- [Official documentation README](https://github.com/Tencent/WeKnora/blob/main/website-docs/README.md): documentation map, architecture reading path, and feature index.
- [CHANGELOG.md](https://github.com/Tencent/WeKnora/blob/main/CHANGELOG.md): `v0.8.0` sandbox, Skills catalog, memory, MCP, CLI, security, and operational updates.

The component diagram is an original Bloss0m SVG redrawn from the official architecture documentation. It does not copy the source Mermaid graphic, and it does not turn release-note feature claims into unverified production outcomes.
