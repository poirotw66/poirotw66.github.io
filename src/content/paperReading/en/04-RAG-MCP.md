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
  venue: "arXiv 2505.03275 v1 (preprint)"
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

- **Problem:** placing every MCP tool schema in a prompt increases tokens, distractors, and wrong-tool selection.
- **Core insight:** index MCP metadata, retrieve a small top-k schema set, then validate and invoke inside that set. Retrieval generates candidates; it does not authorize a decision.
- **Strongest evidence:** on MCPBench web search, RAG-MCP reports 43.13% ground-truth MCP top-1 accuracy versus 18.20% for keyword pre-filter and 13.62% for all-schema prompting (Section 4.2; Table 1).
- **Main boundary:** v1 does not fully expose retriever metadata, embedding/version, schema drift, permission, p95 latency, or real invocation success; top-1 routing is not task success.

## Why the previous approach is insufficient

All-schema prompting assumes more schemas help, but a large registry can bury the relevant tool in distractors; keyword filtering lacks semantic and parameter compatibility. RAG-MCP only narrows candidates and does not replace capability negotiation, authentication, or execution validation (Sections 3.1–3.2).

## Core intuition and method

For query $q$ and registry $M$, a retriever emits top-k schemas $r(q,M)$; an executor checks required parameters, version, permission, and response. Success is conceptually route correctness × schema/call compatibility × invocation success × task correctness. Improving the first factor cannot establish the last (Figure 2; Section 3.2).

![RAG-MCP Figure 3: retrieval-success heatmap as MCP schema count and distractor position change.](/paperReading/04-RAG-MCP/image_3.webp)

*Figure 3, the paper's Section 4.1 scale experiment: the heatmap shows how MCP schema count and distractor position affect retrieval success, making the boundary between candidate generation and final task success visible. See the [original Figure 3 anchor](https://arxiv.org/html/2505.03275v1#S4.F3) and [arXiv HTML figure endpoint](https://arxiv.org/html/2505.03275v1/heat_map.png). The arXiv source states a perpetual non-exclusive license; this article preserves attribution and follows the [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

## Worked example: routing a weather request

For “find tomorrow's Taipei weather,” a registry contains weather search, geocoding, historical climate, and payment tools. Retrieval returns weather/search metadata; the executor fills location/date and invokes under a permission policy. If the retrieved schema is obsolete or unauthorized, it should abstain or fall back rather than force a call. This is a mechanism example, not a MCPBench case.

## How to read the evidence

**Figure 3 / Section 4.1** examines retrieval behavior as registry/distractors grow. **Table 1 / Section 4.2** fixes MCPBench web search and target while changing routing policy; 43.13% is ground-truth MCP selection, not end-to-end answer quality. There is no production-traffic, version-drift, or latency-SLA ablation, so the table does not establish a reliable large MCP gateway.

## Artifacts and engineering decision

As of **2026-08-09**, arXiv v1 is accessible, but the paper frontmatter gives no official code, MCPBench download, or runnable endpoint: artifact status is **missing / unverified**. Start a canary with a versioned registry snapshot and measure retrieval recall, schema compatibility, false accepts/rejects, and invocation success. Do not connect vector top-1 directly to side-effecting tools.

## Three things to remember

1. RAG-MCP reduces prompt-bloat candidates; it is not complete tool governance.
2. Tool selection, schema validation, permission, and task success are different measurement layers.
3. Registry drift and side-effecting tools need deterministic guardrails, not only better top-k.

## Reader question and verdict

When an agent has hundreds of MCP servers, should it put every schema in the model prompt and hope the model picks one? RAG-MCP says no: use retrieval for **discovery**, validate candidates, and pass the executor only a chosen schema. That separation is useful, but it changes the failure boundary rather than removing it. If the correct server is absent from the retriever's top-k—or a stale description wins—an otherwise capable execution model has no chance to recover.

The paper is an arXiv v1 preprint, posted 2025-05-06, not a protocol specification or a production evaluation. Its strongest evidence is a controlled web-search result: Table 1 reports 43.13% ground-truth MCP selection accuracy for its RAG-MCP condition, against 18.20% for keyword pre-filtering and 13.62% for a prompt containing every candidate. Its most useful negative result is Figure 3: performance is good early in the registry sweep, but retrieval precision deteriorates as the registry becomes very large. Read this as evidence that prompt bloat is measurable and routing should be instrumented—not as evidence that top-1 semantic routing is ready for consequential tools.

## Evidence Map

- **Paper evidence:** Section 3.2 defines retrieve → validate → invoke; Figure 2 depicts that pipeline; Section 4.1 and Figure 3 sweep one true tool among up to 11,100 candidates; Section 4.2 and Table 1 compare three selection strategies on MCPBench's web-search subset.
- **What the authors claim:** an external index reduces context load, permits new MCP metadata to be indexed without retraining, and restores selection performance relative to all-schema prompting.
- **What the evidence does not establish:** a public end-to-end implementation, exact registry snapshot, multi-tool planning, permissions, adversarial metadata, write-side effects, real-network availability, P95/P99 latency, or an SLA.
- **Bloss0m judgment:** model selection accuracy must be decomposed into retrieval recall, schema compatibility, authorization, invocation success, and task success. A top-1 route is a policy decision, not merely a vector-search parameter.

## What problem is being formulated?

Let a registry contain server descriptions and schemas $M = \{m_1,\ldots,m_N\}$, and let $q$ be a task. An all-tools client places a representation of many or all $m_i$ in the executor prompt. The model must both identify the relevant tool and form a valid call. As $N$ grows, the context grows and semantically adjacent descriptions become distractors. Section 3.1 motivates its stress test with this “needle in a haystack” version of tool selection: one ground-truth WebSearch MCP and $N-1$ distractors.

RAG-MCP replaces this with a routing function $r(q, M)$ over an external index. Its reported execution condition ultimately injects only the top candidate's schema. This makes the end-to-end probability structurally conjunctive:

$$
P(\text{useful result}) = P(\text{correct tool is retrieved}) \times P(\text{schema/call is valid}\mid\text{retrieved}) \times P(\text{tool succeeds}) \times P(\text{answer is correct}).
$$

The equation is an engineering decomposition, not a measurement supplied by the paper. It explains why a headline selection score is incomplete: top-1 retrieval recall becomes an upper ceiling for every later stage. It also exposes a missing abstention branch. A safe production router needs a way to say “no sufficiently supported candidate” rather than force every request into one server.

## Mechanism: index construction, query construction, and execution

Section 3.2 specifies three stages. First, tool/MCP metadata is represented in an external vector index. The paper calls the retriever lightweight and gives Qwen as an example; it does **not** document the metadata fields, embedding model/version, chunking rule, similarity function, index type, update procedure, or top-k value used in the reported condition. Those omissions matter because a server name, free-text description, tool name, parameter schema, examples, and permissions have very different retrieval value.

Second, the user task is encoded and used to semantically retrieve top-k MCP candidates. The text says candidates *can* receive a generated few-shot example query and a test response as a compatibility sanity check. That is promising as a separate validation stage, but the paper does not give a validation pass rate, a false-accept/false-reject analysis, validation cost, or an explanation of how a synthetic test avoids invoking a side-effecting tool. Figure 2 is therefore a pipeline sketch, not a complete operational contract.

Third, only the selected MCP description and its tool-use parameters go to the LLM/function-calling interface. The model then plans and invokes. This is the central context-saving move: discovery is outside the executor prompt. It does not prove that the executor handles required versus optional fields, authentication, server capability negotiation, pagination, retries, or schema versions. The current [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18) should remain the integration authority; this paper is not a substitute for it.

> **Huahua's engineering note**
>
> Treat the retriever as an untrusted *candidate generator*. Validate an immutable schema version and permission policy after retrieval, before the model is allowed to form a call. “Relevant description” is not an authorization decision.

## Experimental protocol: useful details and important gaps

Section 4.1 is a stress diagnostic, not an ecological sample of agent traffic. For each point, it supplies one ground-truth MCP and $N-1$ distractors, drawn from a registry of more than 4,400 publicly listed servers, and varies $N$ from 1 to 11,100 across 26 intervals. The apparent tension—11,100 candidates versus a 4,400-plus server directory—deserves care: the paper describes a candidate-pool construction but does not publish the exact list, duplication/placement procedure, or server snapshot. Each configuration uses 20 web-search tasks and asks the system to choose the correct MCP, issue a valid query or answer, and return a result (Section 4.1).

Section 4.2 calls the held-out testbed the web-search subset of MCPBench. It runs 20 independent trials per baseline and considers a baseline successful after more than 10 correct answers of 20; individual trials may have up to 10 MCP interaction rounds. qwen-max-0125 is the base LLM. The setup text names DeepSeek-V3 as an automated evaluator, while the metrics paragraph describes a Llama-based judge for final-answer comparison. This documentation ambiguity is itself a reproducibility gap: a verifier model, prompt, threshold, and exact response format are part of the experiment.

The three baselines are precise enough to compare the narrow question. **Blank Conditioning** puts all $N$ descriptions in the prompt. **Actual Match** first keyword-matches task text against MCP metadata and then prompts on that reduced set. **RAG-MCP** semantically ranks all $N$ candidates and injects the top candidate schema. The reported metrics are (1) percentage selecting the ground-truth MCP, (2) mean prompt tokens including metadata, and (3) mean completion tokens. No cost price, retrieval latency, validation latency, server latency distribution, confidence calibration, top-k recall, or tool-execution error rate is reported.

## What Table 1 does—and does not—show

On that MCPBench web-search setup, [Table 1 of the paper](https://arxiv.org/html/2505.03275v1#S4.T1) reports:

| Condition | Accuracy | Avg. prompt tokens | Avg. completion tokens |
| --- | ---: | ---: | ---: |
| RAG-MCP | 43.13% | 1,084.00 | 78.14 |
| Actual Match | 18.20% | 1,646.00 | 23.60 |
| Blank | 13.62% | 2,133.84 | 162.25 |

The accuracy comparison supports the narrow conclusion that this semantic top-1 routing setup beat both all-schema prompting and the chosen keyword pre-filter on this slice. The prompt-token reduction versus Blank is about 49%, so the abstract's “over 50%” wording should not be read as an exact Table 1 calculation. RAG-MCP also uses **more** completion tokens than Actual Match. Consequently, “fewer prompt tokens” is not “lower total bill” and is certainly not “lower end-to-end latency.” A retriever, optional validator, and server execution introduce work not represented by these two generation-token columns.

There is a second ceiling hidden in the comparison. Because the RAG-MCP baseline sends only top-1 onward, a correct server placed second cannot be repaired by executor reasoning. A practical evaluation should therefore report recall@k and the accuracy of a second-stage ranker separately, then evaluate whether a larger k improves success enough to justify extra schemas and safety checks. Table 1 cannot answer that question.

## Scale degradation is the paper's most actionable result

[Figure 3 and Section 5](https://arxiv.org/html/2505.03275v1#S5) plot success by MCP position as the pool expands. The authors characterize positions below 30 as predominantly successful, intermittent failures around positions 31–100, and mainly failures beyond roughly 100, with occasional success islands at larger positions. They attribute the pattern to growing semantic overlap and diminished retrieval precision/throughput, and propose hierarchical or adaptive retrieval as future work.

This is not a smooth benchmark curve with confidence intervals, nor does it isolate whether failure comes from indexing, embedding, query wording, candidate placement, server metadata quality, or the executor. Still, it directly contradicts the tempting interpretation that retrieval makes tool registries arbitrarily scalable. At thousands of candidates, tool descriptions may be close semantic neighbors precisely where an agent needs a distinction: read versus write, production versus sandbox, same API with different tenant, or different version of the same capability.

The operational response is a routing funnel: lexical/structured filters for tenant, capability, data class, and allowed side effects; semantic candidate generation; deterministic schema/version filtering; then a model or learned ranker only among authorized candidates. Measure recall of the eligible ground truth before evaluating generation. This is a Bloss0m design recommendation, not a component tested in RAG-MCP.

## Failure modes, costs, and threats to validity

The controlled network is explicitly designed to prevent connectivity failures (Section 4.2). That makes the method comparison cleaner, but excludes common production causes of apparent routing failure: expired credentials, rate limits, unavailable servers, response timeouts, incompatible protocol versions, changed schemas, or partial tool results. The paper also evaluates web search, which is typically read-only and single-purpose. It does not establish correctness for chained tools where an early wrong read poisons a later write.

Metadata is another unmeasured attack and quality surface. A malicious or merely verbose description can win a semantic retrieval query; a benign but underspecified description can lose. The work has no adversarial-schema, prompt-injection, duplicate-server, permission-confusion, or cross-tenant evaluation. Nor does it assess calibration: 43.13% selection accuracy says nothing about whether the system knows when it is wrong.

Cost should be modeled per decision, not per prompt alone: embedding/query encoding + vector search + optional validation calls + executor input/output + tool calls + retry/fallback. Latency likewise needs stages and tails. A low median vector-search latency cannot compensate for a slow validation query or a server cold start. Table 1 is useful for token pressure; it is insufficient for a capacity plan.

## Artifact and reproducibility status (checked 2026-08-09)

The [arXiv record](https://arxiv.org/abs/2505.03275) and [full HTML/PDF](https://arxiv.org/html/2505.03275v1) are **accessible**. The record/paper does not provide a first-party GitHub, model checkpoint, direct dataset download, registry snapshot, or runnable RAG-MCP endpoint. I therefore classify author implementation, exact 11,100-candidate construction, retriever configuration, prompts, validator/judge configuration, and full benchmark harness as **missing/unavailable** as of this date.

The acknowledgements say that an earlier “Evaluation Report on MCP Servers” supplied a publicly released framework and WebSearch data, but that acknowledgement is not a direct, version-pinned RAG-MCP artifact. Its cited report is [arXiv:2504.11094](https://arxiv.org/abs/2504.11094). Public MCP directories may help build a *new* experiment, but cannot recreate the authors' server snapshot, controlled network, candidate ordering, or model prompts. It would be inaccurate to call this paper one-command reproducible.

## Engineering decision matrix

| Situation | Recommended decision | Why |
| --- | --- | --- |
| Dozens of stable, read-only tools and schema context is already costly | Pilot retrieved discovery in shadow mode | The paper's core setting is most relevant; compare against current routing. |
| Large registry with tenant, capability, or permission constraints | Filter deterministically before semantic retrieval | Similarity should not cross an authorization boundary. |
| High-risk writes, money movement, destructive administration | Do not use top-1 RAG routing as the sole gate | The study has no side-effect or safety evidence. |
| Small, clearly distinct toolset | Keep explicit/deterministic routing | Retrieval introduces another failure stage without proven benefit. |
| Rapid schema churn or weak ownership | First establish versioning and contract tests | The paper does not evaluate schema drift. |
| Ambiguous user requests | Offer clarification or abstain/fallback | Forced top-1 selection turns uncertainty into a call. |

For a pilot, build a versioned index record containing tool name, description, input/output schema, server identity, capability tags, permission class, and deprecation state. Log candidate IDs and scores, eligible ground-truth rank, validation result, schema hash, authorization denial, call result, token counts, retrieval/validation/execution latency, and a human-auditable failure label. Start with reversible read-only traffic; promote only after top-k routing recall, calibration, and tail behavior—not just final-answer accuracy—meet a predeclared bar.

## Next reading

RAG-MCP is about the **tool-discovery** leg of an agent. For a different persistence problem—letting successful retrieval experience modify an index—read [RAG without Forgetting](/en/paper-reading/05-RAG-without-Forgetting/). The shared lesson is that a retrieved candidate is not the final system decision: both routing and memory updates need observable gates and rollback boundaries.

## Primary Sources

- [Gan & Sun, RAG-MCP arXiv record](https://arxiv.org/abs/2505.03275) and [full paper](https://arxiv.org/html/2505.03275v1): Sections 3–5, Figure 2, Figure 3, and Table 1. The paper is a 2025 arXiv v1 preprint.
- [Evaluation Report on MCP Servers](https://arxiv.org/abs/2504.11094): the predecessor report cited in RAG-MCP's acknowledgements; it is not a substitute for an author release.
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2025-06-18): current integration/security reference, consulted separately from the research paper.
