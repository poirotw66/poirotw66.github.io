---
title: "GraphRAG: Relationship Retrieval, Multi-Hop Queries, and Evidence Boundaries"
description: "A grounded guide to QCon AI GraphRAG: graph traversal, community summaries, Cypher, provenance, graph ETL costs, and controlled evaluation."
pubDate: 2026-07-02
updatedDate: 2026-10-19
tldr:
  - "Explicit graph relationships can help multi-hop search, but deterministic traversal does not guarantee accurate source facts."
  - "Benchmark simpler hybrid retrieval and query decomposition before adding graph extraction and maintenance."
audience:
  - "Engineers and product teams interested in AI Engineering, implementation patterns, and technical trade-offs."
  - "Readers who want actionable notes rather than marketing summaries."
category: "AI Engineering"
tags: ["RAG","Knowledge Graph","Enterprise AI","AI"]
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 4
kind: "article"
showToc: true
image: "/blog/35-graph-rag-llm/title_image.webp"
---

A user asks: "Which products owned by this supplier's parent company are covered by the same contract?" A retriever that selects five semantically similar chunks might find the supplier but miss ownership and product relationships scattered across documents.

In her [QCon AI talk on GraphRAG](https://www.infoq.com/presentations/graph-rag-llm/), Cassie Shum discusses the data foundations needed to make complex enterprise context usable. A graph can make relationships **explicit and queryable** instead of burying them inside prose. But it is not a certificate of factual accuracy, and Cypher does not make hallucinations impossible.

> **Huahua in one sentence**
>
> GraphRAG is useful when the answer lives in relationships. First establish that relationship retrieval is the bottleneck, then decide whether graph construction is worth the cost.

## 1. What retrieval problem are we solving?

| Question type | Risk with small top-k retrieval | Extra structure a graph may provide |
| --- | --- | --- |
| Global synthesis | Miss themes distributed throughout the corpus | Communities, hierarchical indexes, summaries |
| Multi-hop relations | A→B and B→C live in separate sources | Explicit entity and edge paths |
| Evidence tracing | Unclear which passage supports a relation | Source IDs and versions attached to nodes and edges |

These tasks are not impossible without a graph. Hierarchical retrieval, query decomposition, reranking, and carefully grounded citations can also help. GraphRAG adds **another representation and query strategy**, with extraction and lifecycle costs.

## 2. Two different graph retrieval patterns

"GraphRAG" does not name a single immutable architecture. Distinguish at least:

1. **Local relationship traversal:** Query a modeled graph to follow company, product, or contract relations across hops.
2. **Community-based global synthesis:** Cluster entities and relations, summarize communities, and answer broader corpus-wide questions. Microsoft's GraphRAG is a well-known implementation of this direction.

The first emphasizes explicit relational constraints; the second emphasizes synthesis across a corpus. Their indexes, operating costs, and evaluation objectives differ. They should not be presented as one measured improvement.

## 3. Cypher: deterministic traversal is not factual certainty

The following is **an illustrative graph query**, assuming the database already has valid `SUBSIDIARY_OF` and `OWNS_PRODUCT` relationships:

```cypher
MATCH (supplier:Company {name: 'Acme Corp'})
      -[:SUBSIDIARY_OF]->(parent:Company)
MATCH (parent)-[:OWNS_PRODUCT]->(product:Product)
RETURN parent.name AS ParentCompany,
       collect(DISTINCT product.name) AS Products
```

The query traverses **stored** relations predictably. It does not establish:

- Whether `Acme Corp` was resolved to the correct legal entity.
- Whether the ownership relationship is still effective.
- Whether `OWNS_PRODUCT` came from verified records, old documents, or a guessed extraction.
- Whether missing edges caused an incomplete product list.

**Execution determinism is not source correctness.** Graph traversal can reduce some open-ended reasoning steps but cannot provide "100% accurate context" or eliminate hallucinations.

## 4. The hard part is knowledge ETL, not drawing a network

Turning documents into a usable graph requires several distinct controls:

1. **Source ingestion and authorization:** Preserve document IDs, versions, effective dates, and ACLs.
2. **Entity extraction:** Identify organizations, products, contracts, and conditions with evidence spans.
3. **Entity resolution:** Reconcile aliases and prevent false merges of different entities with the same name.
4. **Relation validation:** Attach edge types, source evidence, time boundaries, confidence signals, and review status.
5. **Indexing and retrieval:** Choose local traversal, hybrid retrieval, community summaries, or a combination.
6. **Change and deletion:** Update affected nodes, edges, and caches when a source is withdrawn, revoked, or superseded.

LLMs can propose entities and relations; they do not automatically produce an authoritative knowledge graph. High-impact edges benefit from sampled human review, rule checks, and verifiable provenance.

### What does meaningful provenance look like?

Store fields such as `source_document_id`, `source_span`, `source_version`, `valid_from`, and `valid_to` at the relation level where appropriate. A consequential answer should link its claims back to **actual source passages**.

An `extraction_confidence` score is a signal, not a proof. Auditability still requires identity, access control, approved edits, and query traces.

## 5. Decide with a controlled benchmark

Before investing in graph construction, compare these approaches on **the same frozen task set**:

| Candidate | Key hypothesis | Extra cost |
| --- | --- | --- |
| Hybrid RAG + reranker | Is ordinary retrieval sufficient to find all evidence? | Indexing, ranking, labeling |
| Hybrid + query decomposition | Are failures caused by an unsplit multi-hop question? | Additional queries and synthesis latency |
| GraphRAG | Does explicit modeling produce a material improvement? | Ontology, extraction, resolution, freshness, graph serving |

Include cases with same-name companies, two/three-hop questions, historical ownership, conflicting sources, no answer, denied access, and corpus-wide summaries. Track **answer correctness, citation coverage, relation precision, permission leaks, P95 latency, and update cost**, not just a compelling graph visualization.

### A subtle example of graph drift

A historical source states "A used to be owned by B." If the ETL permanently materializes `SUBSIDIARY_OF` without dates, a perfectly executed query can still deliver an **outdated** answer. This is a time-validity and knowledge-lifecycle problem, not something a graph database fixes by default.

## 6. Conclusion: a relationship index, not a safety certificate

GraphRAG's value is making entities, connections, and context across documents **explicitly queryable**, not guaranteeing better results than every other RAG design. Its success depends on both the task and the maintenance quality of the underlying data.

If a simpler hybrid retriever passes the same evaluation, avoid adding graph infrastructure for its own sake. If the task repeatedly fails on cross-document relations, global summaries, or temporal constraints, a controlled graph PoC can establish whether the benefit justifies the cost.

## Sources and further reading

- [Cassie Shum at QCon AI: Graph RAG: Building Smarter Retrieval Workflows](https://www.infoq.com/presentations/graph-rag-llm/): enterprise knowledge graph and data-foundation context.
- [Microsoft GraphRAG](https://github.com/microsoft/graphrag): a reference implementation for community-based global retrieval.
- [Enterprise RAG guide](/en/blog/65-enterprise-rag-guide/): retrieval, authorization, and evaluation.
- [Open Knowledge Format](/en/blog/24-open-knowledge-format/): portable knowledge and provenance.
- [PixelRAG](/en/blog/23-pixelrag/): visual structure is a different retrieval problem.
