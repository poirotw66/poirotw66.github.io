---
stableId: "url:https://aws.amazon.com/blogs/opensource/unified-knowledge-graph-rag-on-aws-graphrag-and-lightrag-on-one-stack/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-15
lastVerifiedAt: 2026-09-15
primaryCategory: "AI Engineering"
primaryCluster: "enterprise-rag"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 5
  total: 24
decision: "write-now"
---

# Unified Knowledge Graph RAG on AWS: GraphRAG and LightRAG on One Stack

## Identity

- Search window: strict 72-hour scan ending 2026-09-15 00:31 UTC; the post was published 2026-09-14.
- Discovery queries: `AWS GraphRAG LightRAG unified knowledge graph RAG`, `Neptune OpenSearch GraphRAG LightRAG`, `knowledge graph RAG cost latency benchmark`.
- Canonical URL: https://aws.amazon.com/blogs/opensource/unified-knowledge-graph-rag-on-aws-graphrag-and-lightrag-on-one-stack/
- Publisher or author: AWS Open Source Blog.
- Published or updated date: 2026-09-14.
- Source type: engineering-blog.
- Direct supporting sources: https://github.com/awslabs/unified-kg-rag-on-aws

## Editorial fit

- Why now: The reference stack makes GraphRAG and LightRAG query strategies switchable over shared ingestion, lineage, storage, and retrieval infrastructure instead of forcing one graph strategy into every question.
- Reader question: When should an enterprise RAG system pay for global graph summarization, and when is dual-level keyword retrieval enough?
- Category and topic cluster: AI Engineering / enterprise RAG.
- Existing coverage and duplication risk: Medium-low. Existing RAG coverage discusses retrieval quality and multimodal indexing; this candidate adds a runnable AWS stack with strategy-level cost, latency, and quality trade-offs.
- Why this remains useful after the current news cycle: The split between ingestion lineage, query routing, retrieval strategy, and answer synthesis is reusable for any graph-backed RAG deployment.

## Claim map

- Primary claim: A shared AWS stack can host clean-room implementations of GraphRAG and LightRAG and select a strategy per query while preserving incremental indexing and document lineage.
- Measured evidence: The official post reports MuSiQue and 2Wiki token-F1, latency, and estimated cost per 1,000 queries. In the supplied runs, hybrid and mix strategies trade quality, latency, and cost differently; the post also states that results under roughly 0.05 difference across three runs should be treated as noise.
- Vendor or author claims requiring qualification: The measurements use Claude Sonnet 4.5 and Titan Text Embeddings V2 in us-west-2, with AWS-selected implementation and pricing assumptions; they are not independent production benchmarks.
- Bloss0m engineering consequence: RAG teams should expose retrieval strategy as a measurable policy decision and record document hashes, lineage, model versions, query class, token cost, latency, and answer quality together.

## Evidence audit

- Primary evidence inspected: AWS Open Source Blog and the public `awslabs/unified-kg-rag-on-aws` repository, including CDK deployment, quickstart, programmatic usage, and benchmark table.
- Baseline or comparison: Hybrid GraphRAG/LightRAG modes are compared with local/global GraphRAG variants on MuSiQue and 2Wiki; the post includes measured token-F1, latency, and cost estimates.
- Missing evidence: No independent rerun, multi-region comparison, ingestion-cost curve, concurrency/load test, or production governance/security assessment.
- Conflicts or uncertainty: The reported costs depend on model prices, tokenization, cache behavior, graph construction, and query mix. The repository is a reference/sample and explicitly requires review before production use.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “GraphRAG 不是開關，而是 query policy：把品質、延遲、成本與 lineage 放到同一張決策表。” Include the architecture, strategy-selection path, benchmark table, and an incremental-index provenance contract.
- Internal routes: Link to production RAG, retrieval evaluation, QPP/RAG sufficiency, and RAGFlow release coverage.
- Human decision required: Label all benchmark and cost numbers as AWS-run measurements, and distinguish the open-source reference implementation from production readiness.
