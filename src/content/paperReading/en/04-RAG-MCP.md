---
title: "RAG-MCP: Retrieve Tool Discovery, but Account for Routing Failure"
description: "A source-grounded reading of RAG-MCP's tool-routing pipeline, 11,100-tool stress test, MCPBench result, scale failure, and incomplete artifacts."
pubDate: 2026-03-23
updatedDate: 2026-08-24
tldr:
  - "RAG-MCP moves tool discovery to an external index, then gives the execution model only a selected schema."
  - "Its 43.13% result is a conditional top-1 selection result on a web-search slice—not a production reliability or security result."
audience:
  - "Engineers controlling schema context in MCP or function-calling systems."
  - "Researchers separating routing recall, invocation correctness, cost, and safety."
tags: ["Paper Reading", "RAG", "MCP", "Tool Selection", "LLM Function Calling", "Prompt Bloat"]
image: "/paperReading/04-RAG-MCP/image_1.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
  - tool-use-coding-agents
paper:
  title: "RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation"
  authors:
    - "Tiantian Gan"
    - "Qiyao Sun"
  year: 2025
  venue: "arXiv 2505.03275 v1（preprint）"
  links:
    pdf: "https://arxiv.org/pdf/2505.03275.pdf"
    arxiv: "https://arxiv.org/abs/2505.03275"
series:
  id: "rag-mcp"
  title: "RAG-MCP Deep Dive"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Placing complete Model Context Protocol (MCP) tool schemas into a Large Language Model's (LLM) prompt leads to severe prompt bloat. It rapidly consumes the context window and introduces semantically adjacent distractors, causing models to misidentify tools or fail in complex downstream reasoning.
- **Core insight:** Decouple tool discovery from execution. Tool metadata is stored in an external vector index; upon receiving a query, a lightweight retriever fetches a compact candidate set, validates compatibility, and passes only the winning target schema to the execution model, allowing the LLM to focus entirely on argument generation and planning.
- **Strongest evidence:** On the MCPBench web-search benchmark, RAG-MCP achieves 43.13% ground-truth MCP top-1 selection accuracy while consuming an average of 1,084.00 prompt tokens—substantially outperforming keyword pre-filtering (18.20% accuracy, 1,646.00 tokens) and all-schema prompting (13.62% accuracy, 2,133.84 tokens) (Section 4.2; Table 1).
- **Main boundary:** The 43.13% figure reflects conditional top-1 routing accuracy on a single-tool web-search slice, not end-to-end task completion or production safety. In an 11,100-candidate needle-in-a-haystack stress test, retrieval precision deteriorates sharply once the registry exceeds roughly 100 tools (Section 4.1; Figure 3). Furthermore, the authors do not provide an end-to-end codebase, candidate snapshot, or permission framework.

As agent ecosystems expand, an autonomous agent may connect to dozens or hundreds of MCP tool servers. Shoveling every tool definition into the model prompt creates prohibitive context costs and leaves the agent vulnerable to distractors. RAG-MCP applies Retrieval-Augmented Generation to tool discovery. Yet this architectural shift does not eliminate failure; it moves the failure boundary upstream to the retriever. If the ground-truth tool is excluded from the retriever's top candidates, even the most capable execution model has no opportunity to recover.

## What to know first

Understanding the design and boundaries of RAG-MCP requires examining the runtime environment and prior baseline limitations:

- **Model Context Protocol (MCP):** An open standard protocol introduced by Anthropic that enables LLMs to communicate with external tools and context servers via a standardized JSON-RPC interface. Each MCP server exposes a registry of tools with names, descriptions, and JSON Schema parameter specifications.
- **Prompt Bloat and Context Starvation:** Existing function-calling pipelines routinely serialize every available tool schema into the system prompt. When registries grow past dozens of tools, schemas occupy thousands of tokens, directly crowding out the agent's working memory, scratchpads, and multi-step reasoning traces.
- **Limitations of prior approaches (why previous methods fail):**
  - *All-schema prompting (Blank Conditioning):* Relies on the model's raw attention mechanism to parse all schemas simultaneously. As the registry size $N$ scales, semantically overlapping tools act as distractors, creating needle-in-a-haystack confusion that drives selection accuracy down to 13.62%.
  - *Keyword pre-filtering (Actual Match):* Relies on literal string matching between task text and tool metadata. It fails completely on synonyms, indirect requests, and complex arguments, achieving only 18.20% accuracy while frequently filtering out essential tools.
- **Separation of architectural layers:** In production systems, tool discovery (locating candidate capabilities), schema validation (verifying argument structure), authorization (verifying permissions and tenant boundaries), and execution success (receiving correct API results) represent distinct lifecycle stages. RAG-MCP addresses candidate reduction; it is not a complete tool governance framework.

## Core intuition

Intuitively, traditional all-schema prompting is equivalent to forcing a technician to carry the complete operating manuals for every machine in an industrial plant. RAG-MCP instead places a specialized index at the library entrance: based on the user's issue, it retrieves only the single relevant page and hands it to the technician.

However, inserting a retrieval stage creates an interdependent, conjunctive probability chain. Let $M = \{m_1, m_2, \ldots, m_N\}$ denote the tool registry, and let $q$ represent the user task. RAG-MCP applies a routing policy $r(q, M)$ that forwards only the top-1 schema to the executor. Bloss0m formulates the end-to-end probability of a useful outcome as follows:

$$
P(\text{useful result}) = P(\text{correct tool retrieved}) \times P(\text{schema/call valid} \mid \text{retrieved}) \times P(\text{tool execution succeeds}) \times P(\text{task answer correct})
$$

This formulation reveals the fundamental risk: **top-1 retrieval recall serves as an inescapable upper ceiling for the entire system**. If the retriever ranks the correct server second, downstream execution failure is guaranteed, regardless of model capability.

Equally important is the engineering intuition that **semantic similarity is not authorization**. Measuring vector proximity between user text and tool descriptions identifies candidate relevance; it provides zero guarantee that the action is authorized, policy-compliant, or safe to execute on external systems.

## Walk one example through the method

To see how RAG-MCP operates end-to-end, consider a multi-capability request:

1. **Input:**
   The user issues a request: "Check tomorrow's weather in Taipei and reserve a downtown meeting room with the lowest chance of rain." The global registry contains 5,000 MCP tools, spanning weather forecasts, traffic monitoring, geocoding, room booking, calendar management, and corporate expense payment.
2. **Intermediate representation and vector retrieval:**
   A lightweight retriever (such as a Qwen-based embedding model) encodes the task query into a dense vector, performs approximate nearest-neighbor search across the external index of 5,000 tool records, and returns top candidates: `taipei_weather_service`, `meeting_room_booking`, and `geocoding_api`.
3. **Decision and sanity validation:**
   The pipeline evaluates the highest-ranked candidate `taipei_weather_service`. It generates synthetic parameter instances to verify that required fields (`location: "Taipei"`, `date: "2026-09-28"`) align with user constraints and confirm that the schema is callable.
4. **Output and invocation:**
   The system injects only the verified schema of `taipei_weather_service` into the execution LLM's prompt. The executor extracts arguments cleanly, emits a valid function call (`taipei_weather_service(location="Taipei", date="2026-09-28")`), and the MCP client dispatches the request to obtain forecast data.
5. **Likely failure points:**
   - *Semantic collision:* If an archive tool `historical_climate_archive` contains verbose descriptions matching weather terms and achieves a higher cosine score than the live forecast tool, the executor receives the wrong schema and returns historical records.
   - *Schema drift:* If the weather server updated parameter `location` to `city_name` while the vector index remains unrefreshed, the validation check fails or the execution model emits an incompatible call.
   - *Side-effect hazards:* If synthetic test queries are executed against non-idempotent tools like `meeting_room_booking`, test executions may create phantom reservations or trigger state mutations in production environments.

## Technical mechanism

According to Section 3.2 of the paper, RAG-MCP operates across three sequential stages:

```
[User Query q]
      │
      ▼
┌────────────────────────────────────────┐
│ Stage 1: External Metadata Indexing    │
│ - Embed MCP server and tool metadata   │
└────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│ Stage 2: Query Encoding & Validation   │
│ - Semantic vector search for top-k     │
│ - Synthetic few-shot sanity checks     │
└────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│ Stage 3: LLM Execution & Invocation    │
│ - Inject only top-1 selected schema    │
│ - Generate arguments and execute tool  │
└────────────────────────────────────────┘
```

### 1. External metadata vector indexing
Static tool descriptions and interfaces across MCP servers are parsed and transformed into vector representations. The authors use a lightweight LLM retriever (citing Qwen as an implementation example). However, the paper leaves critical specifications undocumented: it does not specify which exact fields are indexed (server names, tool identifiers, natural language descriptions, parameter JSON schemas, usage examples, or security scopes), nor does it state the embedding model version, chunking rules, distance metrics (cosine versus inner product), or index refresh workflows. In production, description engineering directly governs retrieval recall.

### 2. Query encoding, semantic retrieval, and candidate validation
When a query $q$ arrives, the retriever maps it into embedding space and retrieves the top-$k$ nearest MCP candidate schemas.
The paper introduces an optional validation concept: candidate tools can receive an auto-generated few-shot test query, and their responses are evaluated as a compatibility sanity check. While conceptually appealing, the paper provides no quantitative data on validation pass rates, false acceptances, or false rejections. Nor does it report the latency and token overhead of generating synthetic validation queries, or explain how destructive side-effects are prevented during dynamic testing.

### 3. Execution model injection and tool invocation
Once a candidate is validated, RAG-MCP injects only that single selected MCP description and its parameter specification into the execution model's context or function-calling schema array.
This step delivers the primary token-saving benefit: the executor is freed from full-catalog discovery and focuses entirely on parameter extraction and argument planning. However, the reported setup does not address complex MCP protocol primitives, such as capability negotiation handshakes, pagination, multi-step authorization, or error retries.

> **Huahua's engineering note**
>
> Treat the retriever as an untrusted candidate generator. After candidate schemas are retrieved, the system must still verify immutable schema versions and authorization policies before the model is permitted to construct a call; semantic relevance is never an authorization decision.

## How to read the evidence

The paper presents two empirical investigations: a scale stress test sweeping registry sizes (Section 4.1), and a controlled benchmark comparison on MCPBench (Section 4.2).

### 1. Scale stress test: needles, haystacks, and breakdown regimes (Section 4.1)
The authors construct a diagnostic needle-in-a-haystack experiment: exactly one ground-truth WebSearch MCP is submerged in $N-1$ distractors sampled from more than 4,400 publicly cataloged MCP servers. The total candidate pool size $N$ scales from 1 to 11,100 across 26 discrete intervals, evaluated over 20 search tasks per configuration.

![RAG-MCP Figure 3: retrieval-success heatmap as MCP schema count and distractor position change.](/paperReading/04-RAG-MCP/image_3.webp)

*Figure 3, the paper's Section 4.1 scale experiment: the heatmap shows how MCP schema count and distractor position affect retrieval success, making the boundary between candidate generation and final task success visible. See the [original Figure 3 anchor](https://arxiv.org/html/2505.03275v1#S4.F3) and [arXiv HTML figure endpoint](https://arxiv.org/html/2505.03275v1/heat_map.png). The arXiv source states a perpetual non-exclusive license; this article preserves attribution and follows the [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

Figure 3's heatmap demonstrates three distinct operational regimes:
- **Low-candidate stability ($N \le 30$):** High success rates predominate across positions, indicating reliable semantic isolation when distractor counts remain modest.
- **Intermittent failure transition ($31 \le N \le 100$):** Inconsistent purple failure bands emerge as semantically proximate distractors compete for vector rank.
- **Large-scale breakdown ($N > 100$):** The right half of the heatmap is dominated by pervasive failure, punctuated by occasional isolated islands of success.

The authors attribute this degradation to increased semantic overlap and declining retrieval precision. This negative finding is the paper's most actionable result: **it decisively refutes the premise that vector retrieval enables unbounded tool scaling**. In registries of thousands of tools, descriptions of read versus write operations, production versus sandbox endpoints, and tenant-specific tools collide in embedding space, overwhelming pure vector search.

### 2. MCPBench controlled benchmark evaluation (Section 4.2 and Table 1)
Section 4.2 evaluates performance on the web-search subset of MCPBench using `qwen-max-0125` as the base model. Each baseline undergoes 20 independent trials, allowing up to 10 interaction rounds per trial. Three selection regimes are compared:
- **Blank Conditioning (all-schema prompting):** All candidate tool descriptions and schemas are placed directly into the prompt.
- **Actual Match (keyword pre-filtering):** Lexical keyword matching filters candidate tools prior to prompting.
- **RAG-MCP:** Vector search ranks candidates semantically, injecting only the top-1 winning schema into the executor.

The paper reports the core results in [Table 1](https://arxiv.org/html/2505.03275v1#S4.T1):

| Condition | Selection Accuracy | Avg. Prompt Tokens | Avg. Completion Tokens |
| :--- | :---: | :---: | :---: |
| **RAG-MCP** | **43.13%** | **1,084.00** | **78.14** |
| Actual Match (keyword match) | 18.20% | 1,646.00 | 23.60 |
| Blank (all-schema) | 13.62% | 2,133.84 | 162.25 |

### Critical analysis of evidence and experimental boundaries
A rigorous reading of Table 1 reveals several vital constraints:
1. **Scope of accuracy:** The 43.13% figure measures only the percentage of trials where the ground-truth MCP tool was successfully selected (Selection Accuracy). It does not represent end-to-end task completion, factual correctness, or production reliability.
2. **Accounting for token savings:** Prompt tokens decrease by approximately 49.2% relative to Blank (from 2,133.84 to 1,084.00), meaning the abstract's "over 50%" phrasing is an approximation rather than an exact Table 1 calculation. Crucially, RAG-MCP's completion tokens (78.14) are substantially higher than Actual Match (23.60). Any total cost evaluation must also incorporate external vector database lookups, embedding inference compute, and synthetic validation roundtrips.
3. **Omission of latency profiles:** Table 1 reports token counts while omitting vector query latency, network overhead, and P95/P99 latency tails.
4. **Evaluation ambiguity:** The setup section cites `DeepSeek-V3` as the automated evaluator, whereas the metrics section describes a `Llama`-based judge. This documentation inconsistency represents a material reproducibility gap.
5. **The top-1 fragility ceiling:** Because the experiment injects only the top-1 schema, it provides no data on Recall@k or learned second-stage rerankers. A tool ranked second is functionally invisible to the agent.

## Evidence map

To separate established facts from interpretations, Bloss0m organizes the paper's findings into four distinct tiers:

- **Direct paper evidence:**
  - Section 3.2 defines the Retrieve $\rightarrow$ Validate $\rightarrow$ Invoke pipeline; Figure 2 illustrates the three stages.
  - Section 4.1 and Figure 3 demonstrate that scaling candidate tools from 1 to 11,100 causes severe non-linear retrieval degradation, failing predominantly beyond 100 tools.
  - Section 4.2 and Table 1 report 43.13% tool selection accuracy and 1,084.00 average prompt tokens on the MCPBench web-search slice, outperforming all-schema prompting at 13.62%.
- **Author causal claims:**
  - Decoupling tool discovery into an external vector index mitigates prompt bloat and allows dynamic registration of new tools without model retraining.
  - Retrieval degradation at scale is caused by semantic overlap in natural language descriptions and retriever precision loss, motivating future work in hierarchical or adaptive retrieval.
- **Unsupported claims:**
  - The paper **does not demonstrate** efficacy in multi-tool chained workflows; tests are strictly single-tool web searches.
  - The paper **does not establish** security against adversarial schemas, prompt injection embedded in tool descriptions, or parameter pollution.
  - The paper **does not evaluate** write-side effects, idempotency, or transaction rollbacks, operating on a controlled network that eliminates timeouts and rate limits.
  - The paper **does not release** an end-to-end runnable codebase, candidate dataset snapshot, or specific Qwen retriever configurations.
- **Bloss0m engineering synthesis:**
  - Tool execution requires a four-tier funnel: Retrieval Recall $\rightarrow$ Schema Compatibility $\rightarrow$ Authorization $\rightarrow$ Invocation Success. Vector similarity cannot establish security or permission boundaries.
  - Hard top-1 routing is an unhedged operational risk; production architectures require multi-candidate evaluation paired with explicit abstention capabilities.

## Artifacts and reproducibility

A systematic inspection of source availability and artifact status indicates the following (as of **2026-08-24**):

- **Preprint availability:** The arXiv v1 preprint ([arXiv:2505.03275](https://arxiv.org/abs/2505.03275)) and official HTML version are publicly accessible.
- **Code and dataset absence:** The paper contains no official GitHub repository, downloadable model weights, pinned candidate pool snapshots, or executable benchmark scripts. Acknowledgements cite an earlier MCP evaluation report ([arXiv:2504.11094](https://arxiv.org/abs/2504.11094)), but that report is not a version-locked RAG-MCP reproduction package.
- **Reproducibility boundary:** Without candidate server snapshots, candidate ordering scripts, retriever hyperparameters, or exact judge prompts, independent researchers cannot perform a one-command reproduction of the experimental results. The figures analyzed here reflect author-reported outcomes under specialized test conditions.

## Bloss0m engineering judgment and when not to use it

Based on architectural mechanisms and empirical constraints, Bloss0m outlines the following engineering recommendations for system design:

### Engineering decision matrix

| Scenario | Recommended Architectural Decision | Core Rationale |
| :--- | :--- | :--- |
| **Dozens of stable, read-only tools with costly prompt schemas** | **Pilot retrieved discovery in shadow mode** | Closely matches the paper's validated regime; evaluate retrieval recall without endangering live workflows. |
| **Multi-tenant platforms with strict data segregation** | **Filter deterministically before semantic retrieval** | Vector similarity must never be permitted to bridge authorization or tenant boundaries. |
| **High-consequence write operations (payments, deletions, config)** | **Do not rely on top-1 RAG routing as the sole gate** | The paper provides zero side-effect safety evidence; explicit approval gates are mandatory. |
| **Small toolset (<30 tools) with distinct boundaries** | **Retain direct prompt injection or static code routes** | Introducing vector search adds network latency and failure modes with zero measurable gain. |
| **Rapidly mutating schemas with decentralized ownership** | **Establish schema versioning and contract tests first** | Semantic drift between the vector store and live servers causes silent downstream breakage. |
| **Ambiguous or underspecified user queries** | **Request user clarification or abstain gracefully** | Forced top-1 selection converts user uncertainty into erroneous, irreversible tool calls. |

### Bloss0m's recommended multi-stage routing funnel

Production agent gateways should avoid brittle "vector top-1 directly into execution" designs and instead implement a four-stage defensive funnel:

1. **Stage 1: Deterministic Eligibility Filtering**
   Filter tools rigidly by caller identity, tenant ID, runtime environment (production versus staging), data classification, and read/write scopes, eliminating all unauthorized tools upfront.
2. **Stage 2: Semantic Candidate Generation**
   Execute vector search across the compliant subset to retrieve a top-$k$ candidate pool ($k = 5 \sim 10$), rather than banking on top-1.
3. **Stage 3: Deterministic Contract Validation**
   Verify immutable schema hashes, validate required parameters, and filter out deprecated or drifted server endpoints.
4. **Stage 4: Model Planning and Explicit Abstention**
   Present verified candidate schemas to the execution model. Crucially, provide an explicit abstention option ("no suitable tool found"), instructing the model to ask the user for clarification when evidence is insufficient.

## Three things to remember

1. **Technical core:** RAG-MCP decouples tool discovery from execution to mitigate prompt bloat, but it operates as a candidate filter rather than a full tool governance framework.
2. **Empirical boundary:** While Table 1 shows clear gains over all-schema prompting (43.13% versus 13.62%), Figure 3 demonstrates that retrieval precision breaks down severely when candidate registries exceed roughly 100 tools.
3. **Production reality:** Vector similarity is not authorization. Top-1 semantic routing without deterministic security filters, contract validation, and abstention branches creates an unrecoverable single point of failure.

## Next reading

For foundational work on catalog-scale API retrieval and model fine-tuning, consult the deep dive on the APIBench pioneer:
- [Gorilla Deep Dive](/en/paper-reading/35-gorilla-llm-connected-with-massive-apis/): How retriever-aware training integrates documentation into both pre-training and inference for massive API catalogs.

To examine how dynamic retrieval indices can be updated continuously without catastrophic interference, continue to:
- [RAG without Forgetting Deep Dive](/en/paper-reading/05-RAG-without-Forgetting/): Architectural techniques for updating external knowledge stores while preserving existing retrieval boundaries.

## Primary sources

- **Primary paper preprint:** Gan, T., & Sun, Q. (2025). *RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation*. arXiv preprint [arXiv:2505.03275v1](https://arxiv.org/abs/2505.03275); HTML available at [arXiv HTML interface](https://arxiv.org/html/2505.03275v1).
- **Predecessor report reference:** *Evaluation Report on MCP Servers*. arXiv preprint [arXiv:2504.11094](https://arxiv.org/abs/2504.11094) (cited in RAG-MCP acknowledgements).
- **Industry protocol standard:** Anthropic. *Model Context Protocol Specification*. [modelcontextprotocol.io](https://modelcontextprotocol.io/specification/2025-06-18) (separately consulted specification authority).
