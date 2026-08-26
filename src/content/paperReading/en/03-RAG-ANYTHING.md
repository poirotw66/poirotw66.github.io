---
title: "RAG-Anything: Multimodal Document Retrieval Is Not Just Text Conversion"
description: "A source-grounded reading of RAG-Anything's dual graph, experimental evidence, failure cases, artifact status, and engineering adoption boundary."
pubDate: 2026-03-23
updatedDate: 2026-08-24
tldr:
  - "RAG-Anything keeps tables, figures, and equations as retrievable, dereferenceable units, then fuses a cross-modal graph with a text graph. It is not caption-to-text RAG."
  - "It leads the listed baselines overall on two multimodal long-document benchmarks, while unanswerable questions, irregular layouts, and system cost remain open risks."
audience:
  - "RAG engineers working with PDFs, reports, papers, and chart/table questions."
  - "Researchers deciding whether multimodal GraphRAG belongs in a product proof of concept."
tags: ["Paper Reading", "RAG", "Multimodal", "Knowledge Graph", "Retrieval-Augmented Generation", "Long Context"]
image: "/paperReading/03-RAG-ANYTHING/image_1.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
paper:
  title: "RAG-ANYTHING: ALL-IN-ONE RAG FRAMEWORK"
  authors:
    - "Zirui Guo"
    - "Xubin Ren"
    - "Lingrui Xu"
    - "Jiahao Zhang"
    - "Chao Huang"
  year: 2025
  venue: "arXiv 2510.12323"
  links:
    pdf: "https://arxiv.org/pdf/2510.12323.pdf"
    arxiv: "https://arxiv.org/abs/2510.12323"
    code: "https://github.com/HKUDS/RAG-Anything"
series:
  id: "rag-anything"
  title: "RAG-Anything Deep Dive"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

The answer in a financial report may be at the intersection of the `2020` column and the `Wages and salaries` row. The answer in a paper may be in only one panel of a four-panel figure. OCR followed by replacing every image with one caption makes everything indexable, but it frequently removes the row/column, panel/axis, and equation/variable-definition relations that determine the answer. RAG-Anything argues that non-text content must remain a first-class, retrievable knowledge unit with a route back to its original artifact, rather than an annotation offered to the generator.

The evidence supports a narrower conclusion. On the two multimodal long-document QA benchmarks used by the authors, the full system—dual-graph indexing plus hybrid retrieval—outperforms the listed baselines overall, and its advantage grows for longer documents. [Section 3.2, Tables 2–3, and Figure 2](https://arxiv.org/html/2510.12323v1) support that claim. This is still an arXiv technical report. It does not report end-to-end SLAs, per-page VLM tokens, index size, independent human correctness, or a parser/VLM cost comparison. Benchmark accuracy therefore does not establish that every enterprise RAG system should become GraphRAG.

- **Problem:** Traditional approaches often collapse figures and tables into captions, losing cells, panels, axes, and cross-page relationships.
- **Core insight:** Use textual proxies for retrieval while preserving dereferenceable raw artifacts; combine explicit graph relations with dense similarity to find evidence.
- **Strongest evidence:** Tables 2–4 and Figure 2 show an overall lead, attribute most of the gain to graph construction, and show a larger gap on long-document slices.
- **Main boundary:** Abstention, parser errors, entity alignment, cost, and latency are not solved by aggregate accuracy.

> **Huahua in one sentence**
>
> The adoption question is not “does the corpus contain images?”; it is “how often do valuable questions require the correct table coordinate, spatial relation in a figure, or cross-page text–image link?” Measure that rate before paying to build a graph.

## Evidence Map

- **Direct paper evidence:** Sections 2.2–2.4 define atomic units, the dual graph, dense index, and VLM synthesis; Section 3.1 defines data, baselines, shared settings, and GPT-4o-mini evaluation; Tables 2–4 and Figure 2 report outcomes; Appendix A.2–A.5 supplies cases, prompts, and failure patterns.
- **Authors’ interpretation:** the authors attribute the largest gain to graph construction and describe reranking as a smaller but useful refinement. That is an interpretation of a bundled ablation, not an independently controlled universal causal law.
- **Not demonstrated:** production latency/throughput/cloud spend, data-egress risk, human correctness, and sensitivity to OCR quality, parser choice, or VLM choice. GPT-4o-mini is also the accuracy evaluator.
- **Bloss0m engineering judgment:** retaining raw figures/tables/equations plus source-page IDs is a durable interface idea. Entity-name alignment, parser confidence, and prompt versions must nevertheless be observable and reversible product components.

## Method skeleton (Section 2)

1. **Parse and split:** decompose a source into text, figure, table, and equation atomic units with type, page, and local context.
2. **Build and fuse two graphs:** preserve non-text structure through multimodal anchors and `belongs_to` edges; build a separate text entity–relation graph, align entities, and create the dense table.
3. **Retrieve by two paths:** expand entities/relations in the graph and search semantic neighbors in embeddings; fuse and rerank the candidates.
4. **Recover raw evidence, then answer:** use textual proxies for ranking, dereference selected visual artifacts, and give both artifacts and textual context to the VLM.

![RAG-Anything Figure 1: the end-to-end framework from heterogeneous document parsing and dual-graph construction to hybrid retrieval and answer generation.](/paperReading/03-RAG-ANYTHING/image_1.webp)

*Figure 1, the framework overview in Section 2: it shows why figures, tables, and equations remain retrievable artifacts rather than being reduced to captions. See the [original Figure 1 anchor](https://arxiv.org/html/2510.12323v1#S2.F1) and [arXiv HTML figure endpoint](https://arxiv.org/html/2510.12323v1/framework.png). The arXiv source states a perpetual non-exclusive license; this article preserves attribution and follows the [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

## Core intuition: retrieval proxies and answer evidence need different jobs

Traditional multimodal RAG often combines “make the image searchable” and “let the model understand the image” into one step: generate a caption and then treat that caption as the image. A caption can be useful for semantic search, but it is not a reliable substitute for table coordinates or spatial relationships. RAG-Anything changes that control point by separating the jobs: textual proxies help locate candidates, while the answer stage returns to the original table or figure.

The dual graph does not mean that every signal should become an edge. Explicit relations answer which elements are connected; the dense index recovers semantically close material without a graph edge. The useful mental model is: **the graph preserves navigable structure, embeddings recover semantic neighbors, and raw artifacts preserve the detail needed for final interpretation.**

## Walk one example through the method: retrieve 2020 wages from a report

Take the question “What were Wages and salaries in 2020?” from the qualitative case in Figure 4:

1. **Input:** The parser separates prose and a table while preserving the page, headers, row labels, cells, and original table image.
2. **Intermediate representation:** A VLM creates a searchable description; the graph retains clues connecting `Wages and salaries`, `2020`, and the value, with an anchor back to the raw table.
3. **Retrieval decision:** The dense path finds the table through salary semantics; the structural path follows row and column relations toward a candidate cell; fusion and reranking select the artifact.
4. **Output:** Instead of answering from the caption alone, the system dereferences the table and lets the VLM read **26,778 million** at the intersection.
5. **Likely failure:** A wrongly split merged cell, a misaligned `2020` column, or faulty entity alignment can make the graph confidently navigate the wrong structure—the boundary illustrated by Appendix A.5.

This is not a new experiment. It is a teaching trace derived from the paper's Figure 4 qualitative case.

## From a document to an index: more than multimodal embeddings

### 1. Modality-specific parsing: define the data unit before the model

Section 2.2 decomposes a source $k_i$ into $c_j=(t_j,x_j)$, where $t_j$ is a type such as text, image, table, or equation, and $x_j$ is its corresponding raw content. That notation establishes a data contract. Paragraphs should retain paragraph/list boundaries; figures should retain captions, cross-references, and nearby context; tables should retain headers, cells, and values; an equation should be a symbolic expression tied to surrounding variable definitions, not a noisy OCR string. [Section 2.2 and Equation (1)](https://arxiv.org/html/2510.12323v1) are the first important evidence anchor.

The paper describes high-fidelity extraction with specialized parsers and uses MinerU for text, images, tables, and equations in its shared experimental setting (Section 3.1). As of 2026-08-09, the official repository exposes MinerU, Docling, and PaddleOCR parser options and permits insertion of a pre-parsed `content_list`. Those are implementation capabilities, not evidence that the paper evaluated every parser. The distinction matters because a table error compounds downstream: if merged cells are split incorrectly, no later graph traversal can recover the correct row–column relation.

For each non-text unit, context-aware VLM prompts produce two textual proxies: a longer $d_j^{chunk}$ for cross-modal retrieval and a shorter $e_j^{entity}$ with entity name, type, and description for graph construction. The prompt sees a local neighborhood $C_j=\{c_k\mid |k-j|\leq\delta\}$. A figure is therefore not described from pixels alone; its caption and neighboring prose constrain its role in that document. [Section 2.2.1, Equation (2)](https://arxiv.org/html/2510.12323v1) and the vision/table/equation prompts in Appendix A.3 directly support this detail. It also creates a cost and reliability boundary: a hallucinated description can turn into a navigable graph relationship, rather than remaining a single noisy chunk.

### 2. Dual graph: retain two different signals

The first graph is a cross-modal knowledge graph. Every non-text unit has a multimodal anchor $v_j^{mm}$; fine-grained entities and relations extracted from its description connect back to that anchor through `belongs_to` edges (Equations (3)–(4) in Section 2.2.1). “Blue line in the legend,” “2020,” and “wages” can thus lead to a particular figure or table, rather than merely occurring in a caption. The paper’s Figure 3 multi-panel t-SNE example uses panel $\leftrightarrow$ caption $\leftrightarrow$ axis relations to avoid confusing the neighboring content-space panel with the style-space panel. Figure 4 uses row $\leftrightarrow$ column $\leftrightarrow$ unit relations to target a particular cell. This is a data-model promise, not visual understanding that a VLM automatically guarantees.

The second graph is text-based. For chunks where $t_j=\text{text}$, RAG-Anything performs named-entity and relation extraction in the style of text-centric LightRAG/GraphRAG pipelines (Section 2.2.1). The authors intentionally do not replace the text graph with VLM context: ordinary text has its own dense semantic and relational signal. That separation matters. A single monolithic graph can let an image description overwrite source prose, or demote a table’s cell structure to mere entity names.

The graphs are aligned primarily by entity name and fused into $\mathcal{G}=(\mathcal{V},\mathcal{E})$. Entities, relations, and atomic chunks across modalities are embedded into table $\mathcal{T}$; the full retrieval index is $(\mathcal{G},\mathcal{T})$. [Section 2.2.2 and Equation (5)](https://arxiv.org/html/2510.12323v1) make clear that this is not simply two vector stores: the graph represents explicit relations, while the embedding table can surface semantic neighbors without a graph edge. Name-based alignment also leaves an unquantified risk. The paper provides no error rate or ablation for homonyms, abbreviations, cross-lingual aliases, or parser noise during fusion.

### 3. Retrieval and storage mechanics: two recall paths, then raw evidence

For a query $q$, the system first looks for modality cues such as “table,” “figure,” “chart,” or “equation,” then creates a text query embedding $\mathbf e_q$ consistent with index embeddings. Structural navigation starts from exact entity matches and keyword/entity recognition, expands a chosen-hop neighborhood, and returns $\mathcal C_{stru}(q)$. Semantic matching searches the entity, relation, and chunk representations in $\mathcal T$ by cosine similarity and returns top-$k$ $\mathcal C_{seman}(q)$. [Section 2.3](https://arxiv.org/html/2510.12323v1) describes them as complementary: the first follows explicit cross-modal, multi-hop structure; the second finds semantically related material with no topological path.

The candidate sets are unioned, then ranked by a multi-signal fusion of graph structural importance, dense similarity, and query-inferred modality preference before reranking. The paper does not disclose weights, top-$k$, or per-stage latency, so “hybrid retrieval” should not be presented as a copied ranking formula. At synthesis, the system concatenates entity summaries, relation descriptions, and chunks with modality/source delimiters. In parallel it dereferences selected multimodal chunks back to raw visual artifacts $\mathcal V^*(q)$ and gives both text and visuals to a VLM: $\text{Response}=\text{VLM}(q,\mathcal P(q),\mathcal V^*(q))$ (Section 2.4, Equation (6)). That division—text proxies for retrieval, raw visual evidence for answering—is the paper’s most transferable architectural idea.

## Read the evaluation rules before reading the score

Section 3.1 evaluates on DocBench (229 documents, five document domains, 1,102 expert-crafted QA pairs; 66 pages and about 46,377 tokens on average) and MMLongBench (135 documents, seven types, 1,082 questions; 47.5 pages and about 21,214 tokens on average). [Table 1](https://arxiv.org/html/2510.12323v1) and Appendix A.1 Tables 5–6 show that length is not uniform: DocBench financial reports average 192 pages while News averages one page; MMLongBench guidebooks average about 78 pages and financial reports 87. Claims about “long-document” gain should therefore be read by length slice, not as a single abstract property of all domains.

Baselines are direct-document GPT-4o-mini, text-graph LightRAG, and multimodal MMGraphRAG. All baseline implementations use GPT-4o-mini as the backbone LLM, MinerU parsing, 3,072-dimensional `text-embedding-3-large`, and `bge-reranker-v2-m3`. Graph methods have a combined entity/relation limit of 20k tokens and a chunk limit of 12k tokens; answers are constrained to one sentence. Direct GPT-4o-mini receives document pages rendered as images at 144 dpi, capped at 50 pages. GPT-4o-mini then assigns binary accuracy to every answer (Section 3.1 and Appendix A.4). The common configuration is useful control, but it also means evaluator commonality, a 50-page baseline cap, and one-sentence scoring cannot measure citation completeness or calibrated refusal.

## Table 2: first overall is not first on every safety slice

On DocBench, Table 2 reports **63.4%** overall accuracy for RAG-Anything, compared with 61.0 for MMGraphRAG, 58.4 for LightRAG, and 51.2 for GPT-4o-mini. That is a 12.2-point lead over the direct model and a 2.4-point lead over the strongest listed RAG baseline. Domain slices are not uniform: RAG-Anything leads Finance at 67.0 and News at 66.3, but scores 61.4 in Academia versus MMGraphRAG’s 64.3, and 61.5 in Government versus 64.9. The table therefore does not justify “dual graphs are uniformly superior for every document.”

The type slices explain its likely fit. Text-only accuracy is 85.0, tied with LightRAG; multimodal accuracy is 76.3, above MMGraphRAG’s 66.0 and LightRAG’s 59.7. This is consistent with the structural-preservation hypothesis. The unanswerable slice is **46.0**, below LightRAG’s 46.8 and far below MMGraphRAG’s 60.5. A product requiring safe abstention cannot treat 63.4 overall as calibrated confidence. It needs separate no-answer, provenance, and negation tests. Table 2 already gives the warning: a retriever that finds multimodal evidence well need not recognize that no evidence exists.

## Table 3 and Figure 2: the long-context gain is a quality/cost trade-off

On MMLongBench, Table 3 gives RAG-Anything **42.8%** overall, versus LightRAG 38.9, MMGraphRAG 37.7, and GPT-4o-mini 33.5. It leads Research reports (46.6), Academic papers (38.7), Guidebooks (43.9), and Financial reports (43.6), but not every type: GPT-4o-mini reaches 44.0 on Tutorials versus 43.5, and MMGraphRAG reaches 46.9 on Administration versus 45.7. The system is not an all-layout winner; it improves the aggregate across several, not all, domains.

For DocBench, Figure 2 reports the gap to MMGraphRAG above 100 pages: **68.2 vs. 54.6** for 101–200 pages and **68.8 vs. 55.0** for 200+ pages—both gaps exceed 13 points. The methods are more comparable on short documents. The MMLongBench length buckets report gains of 3.4, 9.3, and 7.9 points for 11–50, 51–100, and 101–200 pages. This supports the qualified statement that structural retrieval becomes more valuable when evidence is dispersed across pages and modalities. It does not report ingestion latency or index footprint, and therefore does not answer what those 13 points cost in parsing, VLM description, embeddings, graph updates, and query reranking. A production adoption chart should put local cost per page, p95 latency, and index bytes/page beside Figure 2.

## Table 4, cases, and Appendix A.5: wrong structure can mislead it too

In Table 4, Chunk-only scores 60.0, the graph architecture without the reranker scores 62.4, and the full system scores 63.4. Relative to chunk-only, graph construction adds 2.4 points; the reranker adds another 1.0. This agrees with the authors’ statement that graph construction accounts for the primary gain and reranking is a marginal refinement. There are qualifications even here: full RAG-Anything scores 60.2 on Legal, below Chunk-only’s 60.7; its 46.0 unanswerable score is only slightly above the no-reranker variant’s 45.4. Table 4 is two bundle-level ablations, not a causal proof for each edge type, entity alignment decision, or VLM prompt.

Figures 3 and 4 make the intended benefit concrete. The first asks the system to identify a pattern from a style-space t-SNE panel without being distracted by a neighboring content-space panel. The second asks for the `Wages and salaries` × `2020` cell in a financial table: **26,778 million**. These are not generic “the model sees pictures” examples; they are localization tasks requiring panel–caption–axis or row–column–unit structure. Appendix A.2 adds a bar-chart case that identifies `-S-A` as the lowest-accuracy configuration and a multi-dataset table case identifying maximum AUPRC 0.506. They make the mechanism plausible, but do not replace a per-question error distribution.

Appendix A.5 constrains the optimistic story. Failure class one is **text-centric retrieval bias**: even when a question explicitly names a figure, a system can retrieve keyword-rich text at the wrong granularity. Figure 11 is a cross-modal-noise case in which every evaluated method misses information in the specified image. Failure class two is **document-structure processing challenge**: systems use rigid top-to-bottom, left-to-right scanning and fail on tables that require column-wise reading or diagrams with non-linear flows. In Figure 12, the GEM row has no dedicated cell boundary and the `Joint` and `Slot` columns merge; all methods extract the data incorrectly. This is a useful failure taxonomy—retrieval bias, spatial/layout bias, and parser ambiguity from irregular structure—not a problem that an additional reranker automatically solves.

## Limitations and unsupported interpretations

The evidence does not isolate the value of entity alignment, graph-edge types, VLM descriptions, fusion weights, or each parser. It also cannot establish production superiority: there is no measured index footprint, end-to-end latency, token spend, human assessment, privacy study, or controlled comparison across VLM and parser versions. The direct GPT-4o-mini baseline is capped at 50 rendered pages, and the same GPT-4o-mini family is used both as a backbone and binary accuracy evaluator. These conditions make the reported numbers useful benchmark evidence, not a deployment guarantee or a calibrated safety result.

## Artifact and reproducibility status (as of 2026-08-09)

The official [GitHub repository](https://github.com/HKUDS/RAG-Anything) is public and cloneable, under an MIT licence, with PyPI/`uv sync` installation instructions, examples, tests, and a `reproduce/` directory. **Code status: usable.** The README demonstrates `rag.process_document_complete(...)` and `aquery(..., mode="hybrid")`, and documents `mineru`, `docling`, and `paddleocr` parser choices. This is enough for a functional proof of concept; it is not automatically a reproduction of the paper’s numbers.

Execution still requires user-provided LLM, embedding, and vision endpoints/API keys. MinerU downloads models; Office conversion requires LibreOffice; PaddleOCR has a platform-specific `paddlepaddle` dependency. **Data/checkpoint/demo status: no single author-provided, fixed-version benchmark artifact was found that one-command verifies Tables 2–4; do not claim numerical reproducibility.** A replication should pin paper v1, repository commit, parser/model versions, the 144-dpi/50-page direct-baseline rule, prompts, token limits, and evaluator; it must independently check how DocBench and MMLongBench source data are licensed and acquired. If data are gated or API model behavior has changed, report a partial reproduction rather than a binary success/failure.

## Engineering decision matrix: when to use it, when to stay simple

| Workload condition | Recommendation | First measurement to validate |
| --- | --- | --- |
| Valuable questions routinely require table cells, figure panels/axes, formula definitions, and 100+ page documents | Run a RAG-Anything PoC | Evidence-retrieval recall, exact cell/panel match, length-sliced accuracy, p95 latency |
| Mostly text FAQs, short policy documents, or clean structured databases | Use chunking + metadata + reranking | Whether the dual graph’s quality delta exceeds operations cost |
| Sensitive data cannot leave the boundary for VLM/embedding endpoints | Stop or use auditable in-network models | Data egress, cache retention, page/image access logs |
| Parser error is high on scans, merged cells, or two-column layouts | Repair ingestion QA before graphing | Page parse success, cell-boundary error, manual samples |
| Abstention and trustworthy citation are hard requirements | Add independent abstention/provenance gates | Unanswerable precision/recall, citation-to-page correctness |

In implementation, store `document_id`, page, bounding box/raw path, parser version, and caption/context prompt hash with every atomic unit. Record the source and confidence of every graph edge. Query logs should retain structural and semantic candidates, fusion scores, reranker order, and raw artifacts sent to the VLM. Then the Table 4 graph gain can be diagnosed on local data: is failure in parsing, fusion alignment, visual retrieval, or visual synthesis?

**Do not use this architecture** for text-only, latency- or cost-critical services; when raw page images cannot be retained or external VLM access is prohibited; when the corpus changes too quickly for controlled incremental graph updates; when no labeled table/panel questions exist; or when the team cannot inspect why a `belongs_to` edge was created. In those conditions, strong chunk metadata, document structure, reranking, and citation UI are usually more controllable than an opaque dual graph.

## Three things to remember

1. **Technical idea:** Do not treat a caption as the artifact; use proxies for retrieval and raw visuals for answering.
2. **Evidence:** The dual-graph system leads overall on the authors' long-document benchmarks, but Table 4 attributes more of the gain to graph construction than reranking and not every domain improves.
3. **Boundary:** The added complexity is justified only when valuable questions depend on cells, panels, axes, or cross-page relations and the team can monitor parsing, alignment, abstention, and cost.

## Next step and Primary Sources

If your corpus truly has figure/table-dependent questions, label a first 100-question slice: answer page, modality (text/table/figure/equation), whether a spatial relation is needed, and whether the correct outcome is abstention. Run chunk and dual-graph systems against those slices together. Only that establishes whether Figure 2’s long-document advantage transfers to your own documents.

- [RAG-Anything arXiv record](https://arxiv.org/abs/2510.12323) (v1, 2025-10-14; a preprint/technical report) and [full paper HTML](https://arxiv.org/html/2510.12323v1): Sections 2–3, Figures 2–4, Tables 1–4, Appendix A.1–A.5.
- [Full paper PDF](https://arxiv.org/pdf/2510.12323.pdf): canonical page layout and Appendix Figures 5–12.
- [Official RAG-Anything repository](https://github.com/HKUDS/RAG-Anything): code availability, installation, parsers, and runtime dependencies, checked 2026-08-09.
