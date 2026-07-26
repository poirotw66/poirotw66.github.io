---
title: "Agentic RAG System"
description: "A controlled Agentic RAG built on LangGraph to address enterprise internal knowledge base Q&A challenges. Features rule-first routing, hybrid retrieval, context validation, and self-retry mechanisms — meeting enterprise-grade standards of measurability, observability, and deployability."
pubDate: 2025-01-05
updatedDate: 2026-07-27
tldr:
  - "A controlled Agentic RAG built on LangGraph to address enterprise internal knowledge base Q&A challenges"
  - "Features rule-first routing, hybrid retrieval, context validation, and self-retry mechanisms — meeting enterprise-grade standards of measurability, observability, and deployability"
  - "From 'a chatbot that can retrieve' to a measurable, deployable, and controllable enterprise knowledge base agent"
  - "Weighted accuracy 98.0% | Average latency reduced to 2.6s"
audience:
  - "Engineers, technical leads, and product teams evaluating real project architecture, trade-offs, and delivery results."
  - "Readers who want concrete outcomes and stack choices, not just a concept demo."
tier: flagship
featuredOrder: 2
subtitle: "From 'a chatbot that can retrieve' to a measurable, deployable, and controllable enterprise knowledge base agent"
metrics:
  - "LangGraph"
  - "Gemini 2.0 Flash"
  - "Hybrid Retrieval"
  - "FastMCP"
impact: "Weighted accuracy 98.0% | Average latency reduced to 2.6s"
image: "/projects/agentic-rag/title_image.webp"
---

## Summary

This project began as a solution to the classic enterprise internal knowledge base Q&A problem: numerous documents, complex PDF formats, inconsistent user queries, and answers that must be traceable to their sources. The early version resembled a standard RAG pipeline: parse PDFs, chunk text, perform vector retrieval, then hand results to an LLM for answer generation.

The real difficulty turned out not to be "making RAG work," but making it stable on a real-world question set: synonyms, colloquial or dialectal phrasing, confused system names, FAQ tables, permission and security boundaries, conflicting sources, and answers that seem reasonable but actually miss critical steps. These challenges drove the system to evolve into a controlled Agentic RAG built on LangGraph: the front stage uses rule-first, LLM-fallback for query analysis and strategy routing; the middle stage uses hybrid retrieval, document scoring, and context validation to control retrieval quality; the back stage uses answer evaluation and a rewrite loop to decide whether to retry.

> The current version's focus is no longer just "multi-agent RAG" but rather a **measurable, observable, deployable, and controllable** enterprise RAG system.

---

## Context: Why Can't We Just Do Traditional RAG?

Enterprise internal knowledge base documents are usually not clean Markdown. They might be PDFs, slides, table screenshots, scanned pages, flowcharts, or even the same term spelled differently across documents. User queries also won't always precisely match document titles — more often they look like:

- "The financial platform is stuck, who can help me unlock it?"
- "OTP keeps popping up — is the system broken?"
- "Is a locked boot account the same as employee portal lockout?"
- "Password reset keeps failing — where in UHD can I check the reason?"
- "What's the external visitor Wi-Fi SSID and password?"

These queries present several challenges for traditional RAG:

1. Query text and document text may not match; vector retrieval might miss the exact FAQ.
2. Many enterprise FAQ answers depend on specific systems, devices, or permission levels — you can't just grab the most similar paragraph and answer.
3. Some questions require clarification, some can be answered directly, and some must be refused.
4. Missing a key step in the answer is more dangerous than "not found."
5. The system must be deployable to APIs, MCP, n8n, and other workflows — not just run in a notebook.

So this version's core goal became: **Make every step of RAG controllable, observable, and measurable, while maintaining high accuracy at acceptable latency.**

---

## System Overview

The new architecture can be divided into five layers:

- **Interface Layer**: FastAPI REST API, Swagger UI, FastMCP Streamable HTTP, n8n MCP Client.
- **Workflow Layer**: LangGraph state machine handling query routing, strategy selection, retrieval planning, rewrite loop, and answer evaluation.
- **Retrieval Layer**: ChromaDB vector retrieval, BM25 keyword retrieval, RRF fusion, document scoring, lightweight rerank.
- **Ingestion Layer**: PyMuPDF + Gemini Vision hybrid PDF parsing, Markdown export, LLM-based semantic chunking, MinHash deduplication.
- **Operations Layer**: Cloud Run, Docker, Prometheus metrics, health checks, API key / JWT, PII filter, retry / circuit breaker.

### System Architecture Diagram

![System Architecture Diagram](/projects/agentic-rag/sys-arch.svg)

---

## 1. Query Pre-processing: Rule-First — Not Every Question Goes to the LLM

The early approach was natural: use the LLM to analyze query intent first, then decide how to retrieve. But after real-world testing, we found that many enterprise FAQ questions can be determined with high-confidence rules — there's no need for an extra LLM latency hit on every question.

The current `route_query` uses a **rule-first, LLM-fallback** approach:

1. First, perform query normalization — convert colloquialisms, typos, dialect, and abbreviations into retrievable terms.
2. Use deterministic rules to decide whether clarification, refusal, direct answer, or retrieval is needed.
3. Only when rules aren't sufficient for a high-confidence decision does it call the LLM for `analyze_query()`.
4. Metadata records `query_analysis_source = rule | llm` for downstream benchmarking and error analysis.

The benefit of this design: **Common high-frequency FAQs take the fast path; complex or unknown queries retain LLM flexibility.**

For example, the system normalizes colloquial queries like:
- "Financial platform stuck, can't get in" → `financial platform lockout, forgot password function`
- "portal" (typo) → `portal`
- "pasword," "passwrd" → `password`
- "team+" → `C_Team`
- "w3" → `employee portal`

It also handles security boundaries up front:
- External visitors requesting internal company Wi-Fi hidden SSID or passwords: **Refuse.**
- Queries for customer IDs, policy details, or employee personal data: **Refuse.**
- Attempts to bypass maximum privileges, firewall exceptions, or VDI file export approvals: **Refuse.**
- Requests for admin account password lists or shared account passwords: **Refuse.**

The key here isn't removing the LLM, but keeping "things that can be reliably handled by rules" in the rule layer and letting the LLM handle cases that truly need semantic judgment.

---

## 2. Explicit Strategy Routing: clarify / direct_answer / refuse / retrieve

The new workflow separates strategy selection into a standalone `select_strategy` step — no longer cramming every scenario into the retrieval node.

### LangGraph State Machine

![LangGraph State Machine](/projects/agentic-rag/langgraph-state-machine.svg)

This routing makes the system behave more like a controllable agent rather than a fixed pipeline:

- **clarify**: The question lacks system scope — for example, only saying "account locked" without specifying whether it's the financial platform, local network, VPN, or another system.
- **direct_answer**: Rules can already determine the answer — for example, when sources conflict, the system directly reminds the user to verify with the responsible department.
- **refuse**: When encountering sensitive information, audit bypass attempts, or credential requests, the system refuses immediately without entering retrieval.
- **retrieve**: The system enters retrieval planning only when document lookup is needed.

This design fixes a common RAG problem: not every question should trigger retrieval. Retrieving on questions that need clarification often pulls in wrong context; retrieving on questions that should be refused may leak information that shouldn't be provided.

---

## 3. Retrieval Planning: Separating Retrieval Planning from Retrieval

Before entering retrieval, `plan_query` generates an explicit query plan. It analyzes:

- `recommended_method`: embedding / bm25 / hybrid.
- `keyword_density`: whether the query leans toward keywords or semantics.
- `semantic_complexity`: whether semantic understanding is required.
- `has_domain_lexical_terms`: whether it contains high-signal enterprise-internal terms like OTP, local network account, employee portal, Outbound.
- `has_specific_terms`: whether it contains proper nouns or explicit system names.

This query plan is written into the state and metadata, visible to subsequent retrieval, debugging, and benchmarking.

Simply put, the workflow no longer just "takes the query and searches" — it first asks: **Which retrieval strategy should be used for this question?**

---

## 4. Hybrid Retrieval: Embedding + BM25 + RRF

The system uses both ChromaDB vector retrieval and BM25 keyword retrieval simultaneously, fusing results with RRF (Reciprocal Rank Fusion).

### Query Data Flow

![Query Data Flow](/projects/agentic-rag/data-flow.svg)

**Why not just use embeddings?**
Enterprise FAQs often contain precise terms: `RCM`, `C_Team`, `PORTALOTP`, `Outbound`, `Sourcetree`, `Bitbucket`, `cxldom00`. These terms are BM25-friendly, but vector retrieval may rank semantically similar but system-different passages too high.

**Why not just use BM25?**
Users employ colloquial or incomplete descriptions, like "financial platform stuck, can't get in," "my computer is locked up," or "Edge shows IP in the US causing OTP." These queries require semantic retrieval and query normalization.

So the new approach is:
- Embedding and BM25 execute in parallel, reducing total retrieval time.
- Default RRF fusion with `hybrid_rrf_k = 20`, emphasizing top results.
- For domain-specific term queries, BM25 participation is boosted to prevent exact matches from being diluted by embeddings.
- BM25 results fetch text/metadata back from ChromaDB before participating in fusion.
- `filter_metadata` cleans out common FastAPI docs placeholders like `additionalProp1` to prevent BM25 from being erroneously filtered.

A practical lesson learned here: empty filter metadata generated by Swagger UI once caused BM25 results to be incorrectly filtered, meaning hybrid retrieval wasn't actually functioning properly. After fixing the `filter_metadata` normalization step, BM25 could finally participate stably in fusion.

---

## 5. Document Scoring and Context Validation: Don't Feed Retrieval Results Directly to the Generator

After retrieval, the system enters `grade_documents`. The default is a heuristic grader, with an option to switch to an LLM grader.

It evaluates based on:
- Query term overlap
- Domain anchor hits
- Operational query signals
- FAQ source bonus
- Top score / enhanced score

to determine whether each retrieval result is genuinely relevant. Only results that pass scoring enter the context.

Then `validate_context` checks:
- Whether there are enough relevant documents.
- Whether the top score meets the threshold.
- Whether process-oriented questions need more supporting documents.
- Whether low-confidence results are allowed for direct generation.

If the context quality is insufficient, the system doesn't force an answer — it enters `rewrite_query` instead. Only after reaching the maximum iteration count does it fall back to a low-confidence refusal.

> This design makes "nothing found" and "should not answer" explicit states, rather than letting the LLM guess on its own.

---

## 6. Answer Generation: The LLM Isn't the Only Safety Net — There Are Also FAQ Guardrails

`GeneratorAgent` uses Gemini Flash series models to generate Traditional Chinese answers, complete with source citations and page numbers.

But in enterprise FAQ scenarios, relying solely on LLM generation still encounters several issues:
- Answers too brief — providing direction but missing critical steps.
- Mixing in procedures from similar but different systems.
- Unstable page number citations.
- Imprecise extraction of FAQ table answers.
- LLM copying prompt instructions or formatting requirements.

Therefore, several layers of protection were added:
- For high-confidence FAQ blocks, answers are directly extracted and formatted.
- Fallback responses for common high-risk question types — such as OTP, account lockout, VPN password expiry, e-attendance device change, Edge secure network, etc.
- Before generation, a `focus_context` is built, placing the most critical FAQ lines or table rows at the front of the context.
- After generation, prompt echoes, cross-topic lines, empty answers, and overly short answers are cleaned up.
- Metadata page numbers are used preferentially; content header or footer page numbers are parsed only when necessary.

These aren't meant to turn the system into massive hard-coding. It's because in real enterprise knowledge bases, some FAQs are high-frequency and high-risk. For these questions, stability matters more than "letting the LLM generate freely every time."

---

## 7. Answer Evaluation: Deciding Whether to Finish After Generation

After `generate_response`, the workflow doesn't necessarily end immediately. It first enters `mark_evaluator_gate`:

- If it's a clarification, refusal, or no retrieval results, it ends directly.
- If it's a high-confidence FAQ with top score, document grade, context length, and response length all meeting criteria, it can skip the evaluator.
- Other cases proceed to `evaluate_answer`.

`AnswerEvaluator` can operate in heuristic or LLM mode. It determines:
- Whether the answer is adequate.
- Whether it is grounded in retrieved context.
- Whether a retry is needed.

If the answer is insufficient and the iteration limit hasn't been reached, the workflow adds evaluator feedback to the rewrite context and rewrites the query for another retrieval attempt.

This is what makes this version more "agentic": it's not just pre-retrieval query rewriting — it can also evaluate its own answer and decide whether to retry.

---

## 8. PDF Ingestion: PyMuPDF Fast Path + Gemini Vision Fallback

The document ingestion stage uses a hybrid PDF parser:

1. First, extract text quickly with PyMuPDF.
2. Calculate text density.
3. If text density is too low, the page appears to be a table, or extracted text is too short, switch to Gemini Vision.
4. PDF-to-image conversion uses multiprocessing.
5. Gemini Vision API calls use multithreading + rate limiting.
6. Each page's result is written to a PDF cache, supporting interrupted runs to resume later.
7. Parsed results are exported as Markdown for manual inspection and subsequent index rebuilding.

This design is a cost-quality trade-off:
- High text density PDFs use PyMuPDF — fast and no API cost.
- Scanned documents, charts, slides, and table pages go to Gemini Vision, preserving multimodal parsing capability.
- Page-level caching avoids wasted time and tokens when reprocessing large files.

---

## 9. Semantic Chunking: Cutting Chunks at Semantic Boundaries

Traditional fixed-length chunking easily splits procedures, tables, or FAQ answers mid-sentence. LLM-based semantic chunking was later introduced:

- Uses Gemini 2.0 Flash to identify paragraph endings, topic transitions, scenario changes, and other boundaries.
- Default window size of 8,000 characters.
- Chunk overlap of 200 characters.
- Text that's too short goes directly through heuristic chunking.
- If LLM fails, it falls back to the traditional chunker.

The implementation deliberately uses `gemini-2.0-flash` rather than a thinking model, which can produce unstable long Chinese outputs due to thinking tokens. This was a crucial insight from later performance tuning: a stronger model isn't necessarily better for every subtask — chunk boundary detection needs to be stable, cheap, and fast.

---

## 10. Multi-Database and Access Control

The system later added two databases — internal and public:

- Internal workflow: can query all documents.
- Public workflow: queries only public documents.

Both the REST API and MCP tool support an `is_internal` parameter. The default is public, preventing external clients from accidentally accessing internal data.

The data layer is correspondingly separated:
- `chroma_db`
- `chroma_db_public`
- `bm25_index.pkl`
- `bm25_index_public.pkl`

This allows MCP or n8n-style external integrations to use more conservative default permissions, while internal tools explicitly carry internal access flags.

---

## 11. API, MCP, and n8n Integration

The external interface comes in two main forms:

### REST API

Key endpoints:
- `POST /api/v1/query`
- `POST /api/v1/ingest`
- `POST /api/v1/ingest/path`
- `GET /api/v1/documents`
- `DELETE /api/v1/documents/{doc_id}`
- `GET /api/v1/health`
- `GET /api/v1/ready`
- `GET /metrics`

The query API executes the synchronous workflow in a thread pool to avoid blocking the FastAPI event loop, also supporting concurrent queries.

### MCP Server

MCP uses FastMCP Streamable HTTP, mounted at `/mcp`. The current tool is `query_rag`, with inputs including:
- `query`
- `max_results`
- `filter_metadata`
- `is_internal`

The MCP tool returns a simplified structure:
- `response`
- `token_usage`
- `retrieval_time_ms`

This lets n8n MCP Clients, IDE MCP Clients, or other agent workflows call the RAG system as a tool, rather than just treating it as a REST API.

---

## 12. Security and Operations Mechanisms

Later versions also added more complete production-facing mechanisms.

### Authentication
- `X-API-Key` header.
- Optional JWT Bearer token.
- API key usage tracking — view key usage counts and last used timestamps.

### Input Validation
- Query length limits.
- SQL injection pattern detection.
- XSS pattern detection.
- Uploaded filename path traversal protection.

### PII Filter
The system detects and filters:
- Email addresses
- Phone numbers
- Credit card numbers
- Taiwan national ID numbers

In non-strict mode, credit card and national ID numbers are blocked outright; lower-risk information undergoes redaction.

### Retry / Circuit Breaker
Gemini text generation, query analysis, embedding, and Vision parsing all have retry / circuit breaker / graceful degradation:
- Exponential backoff
- Jitter
- Failure threshold
- Recovery timeout
- On API failure, return an understandable degraded message rather than crashing the entire service

### Observability
Prometheus metrics include:
- Query count / latency
- Retrieval latency
- Generation latency
- Cache hit / miss / hit rate
- Query iterations
- Indexed documents
- Active queries
- Dependency health
- API request latency
- Error count

`/health` serves as the liveness probe; `/ready` checks dependencies including ChromaDB, Gemini API, Embedding API, and Cache.

---

## 13. Deployment: Docker + Cloud Run

Deployment primarily uses Docker and Google Cloud Run.

A practical trade-off was made during later deployment: ChromaDB can be bundled directly into the Docker image, so Cloud Run doesn't need to download the database from GCS on every startup. This makes startup faster and deployment simpler.

For larger or frequently updated databases, ChromaDB can also be downloaded from Cloud Storage via `GCS_CHROMADB_BUCKET`.

Cloud Run-related handling includes:
- Using the `PORT` environment variable.
- Proxy headers middleware for handling HTTPS behind a proxy.
- `host="0.0.0.0"` to avoid Cloud Run Host header issues.
- Secret Manager for managing Google API keys.
- `/metrics` for Prometheus scraping.

---

## 14. Evaluation and Convergence: From Usable to Freezable

A large portion of late-stage project work wasn't about adding features — it was evaluation, error decomposition, and convergence.

The benchmark used includes a financial industry AI RAG 100-question test set, combined with batch queries, direct workflow benchmarks, manual/rule-based scoring, and error decomposition.

### v22 Convergence Results

In the `v22` convergence report, the system achieved:

| Metric | Result |
|---|---:|
| Weighted Accuracy | 98.0% |
| Strict Accuracy | 96.0% |
| Relaxed Hit Rate | 100.0% |
| Correct Questions | 96 / 100 |
| Partially Correct | 4 / 100 |
| Incorrect / Unsafe | 0 |
| Average Latency | 3.55s |
| P50 Latency | 3.77s |
| P95 Latency | 5.83s |

`v21` was already the freezable baseline; `v22` primarily addressed edge cases like "maximum privileges + USB permissions," pushing weighted accuracy from 97.5% to 98.0% without introducing errors, increasing security risks, or degrading latency.

More importantly, the remaining partial scores are answer completeness issues — not directional knowledge errors or unsafe answers. Therefore, `v22` is suitable as a regression baseline for subsequent iterations.

### Latest Rule-First Latency Benchmark

The subsequent rule-first, LLM-fallback routing version achieved the following in the direct workflow 100-question benchmark:

| Metric | v23 Baseline | Rule-First Version | Improvement |
|---|---:|---:|---:|
| Average Latency | 3.63s | 2.606s | -1.024s |
| P95 Latency | 6.28s | 5.636s | -0.644s |

This improvement mainly comes from front-end routing: high-confidence rule paths no longer call the LLM every time, while still preserving the agentic core processes of `select_strategy`, `plan_query`, `rewrite_query`, and `evaluate_answer`.

In other words, it doesn't sacrifice the agentic loop for speed — it moves unnecessary LLM calls out of the fast path.

---

## 15. Lessons Learned from Implementation

### 1. Agentic Doesn't Mean Using the LLM at Every Step
A truly stable agentic workflow should be controllable. High-confidence rules, explicit refusals, and direct FAQ extraction are all more stable than "letting the LLM decide everything."

### 2. RAG Errors Often Aren't Generation Errors — They're Retrieval Context Errors
If similar-but-different-system documents enter the context, the LLM easily generates answers that seem reasonable but are wrong. Document scoring, focus context, and cross-topic trimming all address this problem.

### 3. Evaluation Matters More Than a Single Demo
Getting one question right doesn't mean the system is good. A 100-question benchmark, error decomposition, and version comparison are what enable later modifications to determine whether they're improvements or regressions.

### 4. Enterprise FAQs Need Security Routing
Some questions aren't unanswerable — they shouldn't be answered. Placing security refusals before retrieval reduces the probability of accidental information leakage.

### 5. Speed Isn't Just Model Selection — It's Process Design
Switching from a thinking model to Flash, reducing retrieval candidates, RRF parameter tuning, parallel retrieval, and rule-first routing — these combined efforts are what gradually brought latency down.

---

## 16. Tech Stack

- **Workflow**: LangGraph
- **LLM / Vision**: Gemini Pro / Gemini Flash / Gemini Vision
- **Embedding**: Gemini Embedding
- **Vector DB**: ChromaDB
- **Keyword Search**: BM25 + jieba
- **API**: FastAPI
- **MCP**: FastMCP Streamable HTTP
- **PDF**: PyMuPDF, pdf2image, Pillow, Gemini Vision
- **Chunking**: LLM-based semantic chunking + heuristic fallback
- **Observability**: loguru, Prometheus
- **Security**: API key, JWT, PII filter, input validation
- **Deployment**: Docker, Google Cloud Run, Secret Manager, optional GCS ChromaDB sync

---

## 17. In Closing: What This Project Actually Accomplished

If you only look at the feature list, this is a LangGraph + Gemini + ChromaDB + BM25 + MCP Agentic RAG system.

But from an engineering perspective, what it actually accomplished is the journey of an enterprise knowledge base Q&A system from demo to deliverable:

- It can handle PDFs and multimodal pages.
- It maintains retrieval stability despite colloquial language, typos, and confused system names.
- It distinguishes between clarification, refusal, direct answers, and retrieval.
- It performs quality control on both retrieval results and generated answers.
- It has benchmarks, error decomposition, and regression baselines.
- It integrates with external workflows through REST, MCP, and n8n.
- It has deployment, monitoring, authentication, health checks, and degradation mechanisms.

> This is also my evolved understanding of Agentic RAG: it's not about letting the LLM freely "figure out how to answer," but about breaking query, retrieval, validation, generation, and evaluation into explicit nodes — so that each step can be observed, tested, and replaced — and only then can it operate stably in a real enterprise knowledge base.

---

## Key Reference Files

- `README.md`
- `docs/ARCHITECTURE_EVOLUTION.md`
- `docs/v21_vs_v22_摘要_20260511.md`
- `docs/v22_收斂結論_20260511.md`
- `docs/agenticrag.md`
- `src/graph/workflow.py`
- `src/agents/query_router.py`
- `src/agents/retrieval.py`
- `src/agents/generator.py`
- `src/agents/answer_evaluator.py`
- `src/utils/hybrid_search.py`
- `src/utils/vector_store.py`
- `src/utils/pdf_parser.py`
- `src/utils/semantic_chunking.py`
- `src/mcp/server.py`
- `app/api/routes.py`
- `app/main.py`
- `app/config.py`
