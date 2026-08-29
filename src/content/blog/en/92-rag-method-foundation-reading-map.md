---
title: "How to Read RAG Papers: From Dense Retrieval (DPR) to Lewis RAG"
description: "One diagram shows how DPR and Lewis RAG connect to the retrieval papers already on this site."
pubDate: 2026-08-27
updatedDate: 2026-08-28
tldr:
  - "Sparse BM25 is the default first stage DPR has to beat; DPR changes that stage to a dense dual encoder, and Lewis RAG conditions generation on retrieved passages."
  - "The 2025–26 notes on this site extend the classics into multimodal retrieval, tool routing, graphs, memory adaptation, evidence discovery, reranking, and read-before-final."
  - "Do not mix the two 2020 tables or add later numbers to them; 2020 RAG is not a production RAG platform and not an agent loop."
audience:
  - "Readers who just finished DPR and Lewis RAG and need a map to the retrieval notes already on this site"
  - "Engineers choosing the next deep read by job: scale/hybrid, multimodal, tools, graphs, evidence, or read-before-final"
category: "AI Engineering"
tags: ["RAG","Evaluation","Research","Architecture Patterns"]
image: "/blog/92-rag-method-foundation-reading-map/title_image.webp"
subtitle: "See how the 2020 classics connect to later retrieval work, then pick the next link."
kind: guide
showToc: true
---
**Bookmark this page.** The [paper-reading hub](/en/paper-reading/) already has three reading paths. If you have just finished [DPR](/en/paper-reading/32-dense-passage-retrieval/) and [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/), this page shows how those 2020 classics connect and which note to open next.

This is not a new paper note, and it does not replace the six Paper Essence questions in each linked article. It only answers how the nodes connect, which control point changed, and which link to open next. The sibling orientation page is the [How to Read AI Agent Papers: From CoT and WebGPT to ReAct](/en/blog/91-agent-method-foundation-reading-map/) (Agent vs Retrieval).

> **Huahua in one sentence**
>
> DPR changes how passages are found. Lewis RAG changes how generation uses what was found. Later methods extend those decisions rather than replacing the 2020 foundations.

> **Huahua's engineering note**
>
> Do not mix the two tables, and do not write later leaderboards back into 2020. DPR’s NQ top-20 78.4 is not RAG-Seq’s 44.5. BM25-at-scale is about corpus size, not the 2020 ODQA protocol.

## Ninety-second mental model

1. **Sparse first-stage retrieval** (BM25 / TF-IDF) is the default DPR has to beat. The later [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/) note studies accuracy–cost curves as corpora grow, not the 2020 open-domain QA protocol.
2. **DPR** (Karpukhin et al., 2020) changes the first stage to a dense dual encoder (NQ top-20 78.4 vs BM25 59.1; extractive Exact Match 41.5). **Lewis RAG** (Lewis et al., 2020) changes generation to condition on retrieved Wikipedia passages $z$ (NQ RAG-Seq Exact Match 44.5). Do not mix those two tables.
3. The 2025–26 notes extend the sequence into multimodal retrieval, tool routing, graphs, memory adaptation, evidence discovery, financial hard negatives, set-wise reranking, and read-before-final. They use different tasks and evaluations, so their numbers do not belong in 2020 tables.
4. **2020 RAG is not a production RAG platform and not an agent loop.** It has no enterprise ACL, hybrid stack, citation-service specification, or search / read / final agent cycle.

REALM’s expensive joint-pretraining control point now has a deep read: [REALM](/en/paper-reading/34-realm-retrieval-augmented-pretraining/). ORQA remains arXiv-only ([arXiv:1911.03868](https://arxiv.org/abs/1911.03868)); do not invent a fake note. Self-RAG’s when-to-retrieve control point has a deep read: [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/).

## The method map

In the diagram, “on this site” means that a full note is available here. REALM now has an on-site deep read, ORQA remains arXiv-only related work, and Self-RAG covers when to retrieve.

```mermaid
flowchart TB
  Sparse["sparse retrieval BM25 / TF-IDF"]
  REALM["on this site: REALM 2020<br/>expensive joint pre-training"]
  Sparse --> DPR["DPR 2020<br/>dense dual-encoder passage retrieval"]
  REALM --> DPR
  DPR --> RAG["Lewis RAG 2020<br/>retrieval conditions generation"]
  Sparse --> BM25leaf["on this site: BM25 at scale"]
  RAG --> Anything["on this site: RAG-Anything"]
  RAG --> RAGMCP["on this site: RAG-MCP"]
  RAG --> Graph["on this site: GraphRAG vs RAG"]
  RAG --> ERM["on this site: RAG without Forgetting"]
  RAG --> DocMemo["on this site: DocMemo"]
  RAG --> FinRank["on this site: FinRank"]
  RAG --> Rubric["on this site: RubricRanker"]
  RAG --> ReadGate["on this site: before reasoning fails"]
  RAG --> SelfRAG["on this site: Self-RAG<br/>when to retrieve"]
```

## How to walk the map

### Path A · Fastest: DPR, then Lewis RAG

1. [DPR](/en/paper-reading/32-dense-passage-retrieval/): lock the dense dual-encoder contract that replaces sparse first-stage retrieval.
2. [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/): see how retrieved $z$ conditions generation (RAG-Sequence / RAG-Token).
3. Stop. Read later work only when you need the question it addresses.

### Path B · Full classic sequence: sparse opponent → REALM → DPR → RAG; ORQA stays arXiv-only

Follow [REALM](/en/paper-reading/34-realm-retrieval-augmented-pretraining/) → the [sparse BM25 comparison inside the DPR note](/en/paper-reading/32-dense-passage-retrieval/) → [DPR](/en/paper-reading/32-dense-passage-retrieval/) → [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/). ORQA remains related prior work only: [ORQA arXiv:1911.03868](https://arxiv.org/abs/1911.03868). This sequence establishes the method foundations; the hub's [retrieval-systems path](/en/paper-reading/#reading-paths) then adds multimodal, tool, graph, and runtime work.

### Path C · Pick the next paper from the job

| Where the work is stuck | Start with this paper | Core question it extends |
| --- | --- | --- |
| Growing corpora, hybrid / scale cost | [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/) | Sparse accuracy–cost at scale, not the 2020 ODQA protocol |
| PDFs, figures, multimodal documents | [RAG-Anything](/en/paper-reading/03-rag-anything/) | Retrieval targets become referable multimodal nodes, not text-only passages |
| Too many tool schemas; retrieve then call | [RAG-MCP](/en/paper-reading/04-rag-mcp/) | Retrieval used for tool-description routing, not authorization |
| Whether a knowledge graph is worth it | [GraphRAG vs RAG](/en/paper-reading/07-graphrag-vs-rag/) | Whether graph indexing is a necessary upgrade for this problem class |
| Whether successful expansions can write back | [RAG without Forgetting](/en/paper-reading/05-rag-without-forgetting/) | Memory write-back behind a correctness gate |
| Evidence needs dynamic discovery, not one top-$k$ | [DocMemo](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/) | The evidence-discovery process |
| Finance / hard negatives, evidence grounding | [FinRank](/en/paper-reading/18-finrank-evidence-grounded-rag/) | Ranking and hard negatives |
| Set-wise rerank for deep research | [RubricRanker](/en/paper-reading/17-rubric-ranker-deep-research/) | The reranking contract |
| The system searched but answered before reading evidence | [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/) | Read-before-final; Read-Gate is not a substitute for retrieval quality |
| Whether the model should decide when to retrieve | [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/) | when-to-retrieve; reflection tokens, not Read-Gate |

## Node table: control point, one sentence, do-not-misread

| Node | Control point changed | One sentence | Link | Do not misread |
| --- | --- | --- | --- | --- |
| Sparse BM25 / TF-IDF | Whether the first stage is lexical inverted index | The default sparse retrieval DPR must beat | See [contrast inside the DPR note](/en/paper-reading/32-dense-passage-retrieval/) | Opponent baseline, not the on-site BM25-at-scale leaf |
| REALM | Whether pre-training jointly retrieves and asynchronously refreshes an index | Costly retrieval-augmented pre-training; DPR argues you need not pay that bill | [Already on this site](/en/paper-reading/34-realm-retrieval-augmented-pretraining/) | Early method; not production RAG and not the Lewis RAG generation table |
| ORQA | Latent dense retrieval + ICT (related prior) | One direct comparison starting point for REALM; no on-site deep read | [arXiv:1911.03868](https://arxiv.org/abs/1911.03868) | arXiv-only; do not expect a 2026-format note |
| DPR | Whether the first stage becomes a dense dual encoder | Two BERTs, dot-product MIPS; NQ top-20 78.4 vs 59.1; extractive EM 41.5 | [Already on this site](/en/paper-reading/32-dense-passage-retrieval/) | The retrieval table is not Lewis RAG’s generation table |
| Lewis RAG | Whether generation conditions on retrieved $z$ | BART plus a DPR-initialized retriever; NQ RAG-Seq 44.5 | [Already on this site](/en/paper-reading/31-retrieval-augmented-generation/) | 2020 method paper ≠ production RAG platform ≠ agent loop |
| BM25 at scale | How accuracy–cost bends as corpora grow | Large-corpus sparse retrieval and agent cost | [Already on this site](/en/paper-reading/13-bm25-wins-at-scale/) | Later scale study; not the 2020 ODQA protocol |
| RAG-Anything | Whether document nodes keep multimodal structure | Tables / figures / formulas stay referable; not caption-only | [Already on this site](/en/paper-reading/03-rag-anything/) | Later multimodal method; its numbers do not belong in 2020 |
| RAG-MCP | How to choose among too many tool schemas | Retrieve candidate schemas, then let the executor call | [Already on this site](/en/paper-reading/04-rag-mcp/) | Later routing method; retrieval is not authorization |
| GraphRAG vs RAG | Whether multi-hop / structural work needs a graph | Systematic comparison of graph vs vector adoption boundaries | [Already on this site](/en/paper-reading/07-graphrag-vs-rag/) | Later comparison; not a drop-in replacement for Lewis RAG |
| RAG without Forgetting | Where successful expansions are written back | Index adaptation behind a correctness gate | [Already on this site](/en/paper-reading/05-rag-without-forgetting/) | Later adaptation method; write-back is not unconditional memory |
| DocMemo | Whether evidence is fetched once or discovered dynamically | Dynamic evidence discovery, not a fixed top-$k$ | [Already on this site](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/) | Later evidence method; not xMemory, which is agent memory |
| FinRank | How evidence is ranked under financial hard negatives | Evidence-grounded ranking | [Already on this site](/en/paper-reading/18-finrank-evidence-grounded-rag/) | Later ranking method; its numbers do not belong in 2020 |
| RubricRanker | How deep research does set-wise rerank | Set-wise reranking with rubrics | [Already on this site](/en/paper-reading/17-rubric-ranker-deep-research/) | Later reranker; not first-stage retrieval |
| Before reasoning can fail | Whether a read happens after search and before final | A pre-evidence procedural failure, not a wrong answer after reading gold | [Already on this site](/en/paper-reading/15-before-reasoning-fails/) | Later procedural study; Read-Gate is not a substitute for retrieval quality |
| Self-RAG | Whether / when to call retrieval | Self-reflection decides retrieve / critique | [Already on this site](/en/paper-reading/33-self-rag-retrieve-generate-critique/) | when-to-retrieve; not Read-Gate and not a production RAG gate |

## What this page is not

- **It does not replace the six Paper Essence questions.** Each linked note still has to carry: the problem, why the prior approach was insufficient, the core idea, how one input moves through the method, which evidence supports the headline, and where the claim stops. This page only orients.
- **It does not invent an ORQA note.** ORQA stays arXiv-only. REALM and Self-RAG now have on-site deep reads ([REALM](/en/paper-reading/34-realm-retrieval-augmented-pretraining/), [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/)); this page only orients and does not rewrite the six Paper Essence questions.
- **It does not rewrite the hub's retrieval-systems path narrative.** That path starts at REALM → DPR → RAG → Self-RAG and then adds multimodal, tool, graph, and runtime work. This page remains an orientation guide, not a fourth path type.
- **It does not back-fill later numbers into classics, and it does not mix the DPR and Lewis RAG tables.** Evidence, author claims, and Bloss0m judgment stay in the individual notes.
- **It does not force xMemory or AskChem into this sequence.** xMemory is agent memory, while AskChem is claim-centered synthesis; neither belongs on this RAG method path.

If the reading method itself is still unfamiliar, pair this map with [Efficient Academic Paper Reading: The Three-Pass Approach](/en/blog/08-efficient-paper-reading-three-pass/). If you want product architecture rather than a paper family, start from the [Enterprise RAG guide](/en/blog/65-enterprise-rag-guide/). For the Agent-family sibling map, see the [How to Read AI Agent Papers: From CoT and WebGPT to ReAct](/en/blog/91-agent-method-foundation-reading-map/).

## How to use this guide

- **Entering from the paper-reading hub:** the three PATHS remain; if you need the DPR / Lewis RAG method map, stop here and follow a link. Retrieval-systems path: [#reading-paths](/en/paper-reading/#reading-paths).
- **Entering from a classic note:** if the article links to a “reading map,” it means [this page](/en/blog/92-rag-method-foundation-reading-map/).
- **Traditional Chinese edition:** use the language toggle on this page.

## References

- [Paper-reading hub](/en/paper-reading/) (three PATHS; retrieval-systems path at [#reading-paths](/en/paper-reading/#reading-paths))
- [Karpukhin et al., 2020, Dense Passage Retrieval](https://arxiv.org/abs/2004.04906)
- [Lewis et al., 2020, Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
- [Guu et al., 2020, REALM — on-site note](/en/paper-reading/34-realm-retrieval-augmented-pretraining/)
- [Guu et al., 2020, REALM arXiv](https://arxiv.org/abs/2002.08909)
- [Lee et al., 2019, ORQA](https://arxiv.org/abs/1911.03868)
- [Asai et al., 2023, Self-RAG](https://arxiv.org/abs/2310.11511)
- Method post on this site: [Three-pass reading](/en/blog/08-efficient-paper-reading-three-pass/)
- Sibling orientation page (Agent family): [How to Read AI Agent Papers: From CoT and WebGPT to ReAct](/en/blog/91-agent-method-foundation-reading-map/)
- A different map (Harness blogs, not this paper family): [How to Read Harness Engineering: Setup and Verification for Long-Running Agents](/en/blog/13-harness-engineering-reading-map/)
