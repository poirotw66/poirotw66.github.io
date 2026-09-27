---
title: "RAG vs GraphRAG: A Systematic Evaluation and Hybrid Strategies (Detailed Notes)"
description: "Interpreting the unified evaluation protocol, four types of GraphRAG, figures in Tables 1-5, efficiency trade-offs, and Selection/Integration hybrid strategies based on arXiv:2502.11371."
pubDate: 2026-03-24
updatedDate: 2026-08-24
tldr:
  - "Interpreting the unified evaluation protocol, four types of GraphRAG, figures in Tables 1-5, efficiency trade-offs, and Selection/Integration hybrid strategies based on arXiv:2502.11371"
audience:
  - "AI/ML practitioners and researchers who want method, evidence, and engineering implications before a full paper read."
  - "Engineers deciding whether a paper’s ideas are worth implementing or citing."
tags: ["Paper Reading", "RAG", "GraphRAG", "Benchmark", "Multi-hop Reasoning", "Hybrid Retrieval"]
image: "/paperReading/07-GraphRAG-vs-RAG/image_3.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
paper:
  title: "RAG vs. GraphRAG: A Systematic Evaluation and Key Insights"
  authors:
    - "Haoyu Han"
    - "Li Ma"
    - "Yu Wang"
    - "Harry Shomer"
    - "Yongjia Lei"
    - "Zhisheng Qi"
    - "Kai Guo"
    - "Zhigang Hua"
    - "Bo Long"
    - "Hui Liu"
    - "Charu C. Aggarwal"
    - "Jiliang Tang"
  year: 2025
  venue: "arXiv 2502.11371"
  links:
    pdf: "https://arxiv.org/pdf/2502.11371.pdf"
    arxiv: "https://arxiv.org/abs/2502.11371"
    code: "https://github.com/haoyuhan1/RAGvsGraphRAG"
series:
  id: "graphrag-vs-rag"
  title: "GraphRAG vs RAG Deep Dive"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** A surge of GraphRAG systems claim decisive superiority over standard vector RAG on complex multi-hop reasoning and corpus-level summarization. However, individual studies simultaneously vary their graph construction pipelines, retrieval granularities, context token budgets, and generation prompts. This confounding makes it impossible for practitioners to determine when graph structures genuinely provide an advantage and when they merely introduce costly latency and overhead.
- **Core insight:** Under a strictly controlled evaluation benchmark that unifies preprocessing, context budgets, and generation scripts, standard vector RAG and GraphRAG occupy distinct, complementary sweet spots. Standard dense RAG remains the most accurate, cost-effective, and robust choice for single-hop factual queries and unanswerable questions (Null abstention). GraphRAG's value is governed by a query's "evidence topology": graph-guided retrieval only excels when answering requires traversing entity paths, tracking timelines, or aggregating corpus-level summaries. Hybrid strategies like dynamic routing (Selection) and multi-path concatenation (Integration) effectively synthesize both strengths.
- **Strongest evidence:** Evaluated across QA benchmarks (NQ, HotpotQA, MultiHop-RAG, NovelQA) and query-based summarization (SQuALITY, QMSum, ODSum), traditional vector RAG dominates single-hop NQ with 64.78% F1. On the comprehensive MultiHop-RAG benchmark, the text-centric graph-guided approach HippoRAG2 achieves the highest overall accuracy at 70.27%. Community-Global achieves 53.34% accuracy on Temporal queries (versus 30.70% for RAG), but collapses to 19.27% on unanswerable Null queries where RAG achieves 96.01%. Furthermore, graph construction requires 41x to 57x longer than standard RAG indexing (Table 4).
- **Main boundary:** Conclusions are primarily established using Llama-3.1-8B-Instruct (with supplementary 70B validation) on static public academic benchmarks. Graph construction is evaluated as a one-time static batch without testing incremental updates. Efficiency analyses measure standalone benchmark execution time rather than enterprise production realities such as API retries, ACL permission filtering, caching, and maintenance overhead.

*Source note: This reading follows the baseline findings of arXiv:2502.11371 (v1) by Han et al. (Michigan State University, Meta, IBM, etc.), referencing author-reported metrics under the controlled benchmark.*

## What to know first

To understand the architectural trade-offs, we must clearly define traditional vector RAG, its fundamental failure modes, and the four distinct GraphRAG paradigms categorized in the paper (Table 1, §3.2):

1. **Standard Flat Dense RAG:**  
   The corpus is partitioned into fixed-length text chunks. A pretrained dense embedding model maps each chunk into a vector space. At query time, the system computes the cosine similarity between the query embedding and chunk embeddings, retrieving the Top-$k$ chunks directly into the prompt of a large language model (LLM).
2. **Why traditional RAG is insufficient:**  
   - **Isolated chunk blind spots:** Standard RAG assumes chunks are mutually independent. When the evidence required to answer a question is distributed across multiple documents or chapters, semantic similarity retrieves chunks matching query keywords but misses intermediate connecting chunks.
   - **Multi-hop reasoning disconnect:** For queries requiring relational chaining ($A \to B \to C$), standard dense retrieval lacks explicit structural awareness to follow entity hops, frequently retrieving noisy or irrelevant passages.
   - **Global synthesis failure:** For corpus-wide questions such as "What are the overarching themes discussed across these hundreds of documents?", dense retrieval cannot assemble a comprehensive thematic view within a constrained context window.
3. **Flaws in prior evaluation protocols:**  
   Earlier publications supporting GraphRAG often expanded context budgets, utilized different chunk sizes, or engineered complex prompts, conflating the intrinsic value of graph structures with extraneous pipeline advantages.
4. **Four distinct GraphRAG paradigms:**  
   - **KG-based GraphRAG (e.g., LlamaIndex KG-GraphRAG):** Uses an LLM to extract entity-relation-entity triplets $(Subject, Predicate, Object)$ to construct an explicit knowledge graph. Retrieval traverses $k$-hop subgraphs starting from entities identified in the query. The paper evaluates both pure triplets ("Triplets only") and triplets augmented with original text passages ("Triplets+Text").
   - **Community-based GraphRAG (e.g., Microsoft GraphRAG):** Extracts an entity graph, partitions it into hierarchical clusters using the Leiden community detection algorithm, and pre-generates hierarchical summary reports with an LLM. It supports "Local" search (retrieving entity neighborhoods and fine-grained community reports) and "Global" search (retrieving high-level community summaries for broad corpus synthesis).
   - **Text-centric Graph-guided RAG (e.g., HippoRAG2):** Constructs an entity co-occurrence graph solely as an indexing and traversal guide. It runs Personalized PageRank to spread activation across entities, but the retrieved units returned to the LLM remain coherent original text chunks.
   - **Hierarchical Summary RAG (e.g., RAPTOR):** Constructs a recursive tree of text clusters and summaries without explicit entity extraction, retrieving nodes across multiple tree levels.

## Core intuition

The fundamental mental shift demonstrated by the paper is that system selection must be governed by the query's **evidence topology**, rather than assuming one architecture universally dominates:

- **Local evidence topology:** The required answer resides within a single self-contained statement or a localized paragraph (such as factual definitions, pricing tables, or specific dates). Raw text chunks retain maximum semantic fidelity with zero extraction loss. Standard dense RAG is the fastest, most accurate, and most economical solution.
- **Relational / multi-hop evidence topology:** The answer requires connecting disparate entities across different sections. Graph edges provide explicit navigation bridges across the semantic gaps of vector space.
- **Global corpus-level evidence topology:** The query demands a holistic synthesis, thematic aggregation, or trend comparison across the entire collection. Hierarchical community summaries pre-compress the corpus, providing macro-level context within token budgets.

However, graphs are not a free performance upgrade. Information is inevitably lost during automated triplet extraction; queries without explicit entity anchors can cause graph traversals to drift; high-level community summaries induce severe hallucinations on unanswerable queries; and offline graph construction and multi-step retrieval introduce orders-of-magnitude higher computational costs and latency.

![RAG vs GraphRAG Figure 3(a): QA performance of four retrieval strategies in the Llama 3.1 8B setting.](/paperReading/07-GraphRAG-vs-RAG/image_3.webp)

*Figure 3(a), the paper's Section 4.4 QA comparison: RAG, GraphRAG, Selection, and Integration differ across NQ, HotpotQA, MultiHop-RAG, and NovelQA, bringing the “is graph worth it?” question back to query type and evidence topology. See the [original Figure 3 anchor](https://arxiv.org/html/2502.11371v1#S4.F3) and [Figure 3(a) source endpoint](https://arxiv.org/html/2502.11371v1/qa_improvement_8B.svg). The arXiv source states a perpetual non-exclusive license; this article preserves attribution and follows the [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

## Walk one example through the method

To illustrate how evidence topology dictates outcomes, we trace three representative queries through the end-to-end pipeline:

1. **Input queries:**  
   - *Query A (Relational multi-hop):* "Who served as the lead director for the cloud migration initiative launched after Company Alpha acquired Beta Corp last year?"  
   - *Query B (Localized factual):* "What is the standard monthly enterprise license fee for Service Gamma?"  
   - *Query C (Unanswerable Null question):* "Which manager did Company Alpha appoint in 1995 to lead Project Delta?" (Company Alpha was founded in 2005; Project Delta does not exist).
2. **Intermediate representations and traversal:**  
   - *Standard RAG:* Computes dense embedding $q \in \mathbb{R}^d$ and retrieves Top-$k$ chunks via cosine similarity. For Query B, it directly matches the pricing table. For Query A, "Acquisition News" and "Project Personnel Rosters" reside in different documents with weak mutual similarity, causing RAG to retrieve the acquisition notice while missing the personnel assignment.
   - *KG-GraphRAG:* Extracts entities "Company Alpha", "Beta Corp", and "cloud migration", traversing triplets $(Company Alpha, acquired, Beta Corp)$ and $(Beta Corp, executed, cloud migration)$.
   - *Community-GraphRAG:* Identifies the Leiden community corresponding to the post-merger integration. For Query A, Local search extracts the integration community report. For Query C, Global search pulls high-level corporate history summaries.
   - *HippoRAG2:* Seeds the extracted query entities on the co-occurrence graph, propagates weights via Personalized PageRank, and maps the accumulated activation scores back to candidate raw text chunks.
3. **Decision and transformation (Selection & Integration):**  
   - *Selection router (Appendix G):* A lightweight LLM classifier evaluates query intent. Query B is classified as Fact-based and routed to standard RAG; Query A is classified as Reasoning-based and routed to GraphRAG.
   - *Integration merger (Appendix H):* Executes both retrievers and concatenates the resulting contexts into $[C_{\text{RAG}}; C_{\text{Graph}}]$.
4. **Output generation:**  
   - *Query A:* Graph-guided retrieval (HippoRAG2) successfully retrieves the bridging chunk connecting the merger to the migration team, allowing Llama-3.1 8B to generate the correct director name. Standard RAG fails due to the missing link.
   - *Query B:* Standard RAG instantly returns the exact dollar amount. GraphRAG performs multiple extraction steps and graph traversals, arriving at the identical answer while incurring 8x the latency and higher token costs.
5. **Likely failure points:**  
   - *Triplet extraction loss:* If the LLM misses the acquisition relation during indexing, KG-GraphRAG traversal breaks entirely, yielding zero recall.
   - *Severe Null hallucination:* On Query C, Community-Global retrieves broad corporate background summaries. Because the high-level summary contains plausible thematic prose without explicit boundaries, the LLM hallucinates a fictitious manager rather than abstaining.

## Technical mechanism

The benchmark enforces strict experimental controls to eliminate confounding variables (Section 3):

### 1. Unified evaluation protocol

- **Decoupling retrieval and generation:**  
  Retrieved contexts from all candidate methods are persisted to disk beforehand. Generation is executed using an identical script, fixed zero temperature ($T=0$), and standardized prompts with Llama-3.1-8B-Instruct (and 70B for selected tests), eliminating prompt engineering bias.
- **Strict budget alignment:**  
  Context length sent to the generator is matched across methods (e.g., matching the token budget of standard RAG's Top-$k=5$ chunks, approximately 1500–2000 tokens), preventing systems from winning simply by ingesting longer contexts.

### 2. Formalization of retrieval mechanisms

- **Standard Dense RAG:**  
  Given query $q$ and chunk corpus $\mathcal{C}$, the retriever uses embedding model $E(\cdot)$ to compute:
  $$s_{\text{dense}}(q, c) = \frac{E(q) \cdot E(c)}{\|E(q)\| \|E(c)\|}, \quad c \in \mathcal{C}$$
  and selects the Top-$k$ scoring chunks.
- **HippoRAG2 (Text-centric Graph-guided):**  
  Constructs entity graph $\mathcal{G} = (\mathcal{V}, \mathcal{E})$. Extracts seed entities $\mathcal{V}_q \subset \mathcal{V}$ from query $q$. Defines teleport vector $\mathbf{p}_0$ uniformly distributed over $\mathcal{V}_q$. The stationary Personalized PageRank vector $\mathbf{p}$ satisfies:
  $$\mathbf{p} = \alpha \mathbf{W} \mathbf{p} + (1 - \alpha) \mathbf{p}_0$$
  where $\mathbf{W}$ is the column-normalized adjacency transition matrix and $\alpha$ is the damping factor. Each chunk $c \in \mathcal{C}$ is scored by summing the stationary probabilities of its constituent entities:
  $$S_{\text{Hippo}}(c) = \sum_{v \in \mathcal{V}_c} \mathbf{p}(v)$$
  Top-$k$ scoring text chunks are passed to the generator, preserving complete passage syntax.
- **Community-based GraphRAG:**  
  Partitions the entity graph into hierarchical clusters $\mathcal{P} = \{C_1, C_2, \dots, C_m\}$ via the Leiden algorithm. Pre-generates summary reports $R(C_i)$ for each cluster.
  - *Local Search:* Retrieves entity subgraphs and localized cluster reports.
  - *Global Search:* Computes embedding similarity against high-level community reports $R(C_i)$ and applies map-reduce summarization.

### 3. Hybrid strategies

- **Selection routing (Appendix G):**  
  Classifies input query $q$ using an LLM router:
  $$\text{Strategy}(q) = \begin{cases} \text{Dense RAG}, & \text{if } q \text{ is fact-based or localized lookup} \\ \text{GraphRAG}, & \text{if } q \text{ requires multi-hop relational or global reasoning} \end{cases}$$
- **Integration concatenation (Appendix H):**  
  Concurrently retrieves chunk set $\mathcal{C}_{\text{RAG}}$ and graph evidence $\mathcal{C}_{\text{Graph}}$, merging them into an integrated context:
  $$\text{Context}_{\text{joint}} = \mathcal{C}_{\text{RAG}} \oplus \mathcal{C}_{\text{Graph}}$$
  ranked and truncated to the target token budget.

## How to read the evidence

The paper evaluates models across multiple benchmarks to establish rigorous empirical baselines:

### 1. QA performance: NQ and HotpotQA (Table 1)

Table 1 presents F1 scores (%) using Llama-3.1-8B-Instruct on single-hop NQ and multi-hop HotpotQA:

| Retrieval Method | NQ F1 (Single-hop) | HotpotQA F1 (Multi-hop) |
| :--- | :--- | :--- |
| **Standard Dense RAG** | **64.78** | 60.04 |
| RaptorRAG (Hierarchical summary) | 60.04 | 61.31 |
| KG-GraphRAG (Triplets only) | 34.28 | 25.02 |
| KG-GraphRAG (Triplets+Text) | 50.27 | 42.60 |
| Community-GraphRAG (Local) | 63.01 | 61.66 |
| Community-GraphRAG (Global) | 54.48 | 45.16 |
| **HippoRAG2 (Text-centric graph-guided)** | 61.03 | **63.01** |

**Key observations:**
- **Standard RAG leads on single-hop:** Standard RAG achieves 64.78% F1 on NQ, outperforming every graph variant. Pure triplets collapse to 34.28%.
- **Knowledge graph coverage bottleneck (Appendix C):** Across the constructed graphs, only **65.8%** of answer entities in HotpotQA and **65.5%** in NQ were successfully captured during extraction. Information loss during relation extraction creates a hard ceiling for pure KG methods.
- **Text-centric graph excels on multi-hop:** HippoRAG2 achieves 63.01% F1 on HotpotQA, outperforming RAG (60.04%) and Community-Global (45.16%) because it routes via graph topology but feeds unfragmented text chunks to the LLM.

### 2. MultiHop-RAG fine-grained breakdown (Table 2)

Table 2 evaluates accuracy (%) across four distinct query slices in MultiHop-RAG:

| Retrieval Method | Inference | Comparison | Null (Abstain) | Temporal | **Overall** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Standard Dense RAG | **92.16** | 57.59 | 96.01 | 30.70 | 67.02 |
| RaptorRAG | 91.91 | 55.26 | 90.03 | 45.28 | 68.78 |
| KG-GraphRAG (Triplets) | 55.76 | 22.55 | **98.67** | 18.70 | 41.24 |
| KG-GraphRAG (Triplets+Text) | 67.40 | 34.70 | 97.34 | 17.15 | 48.51 |
| Community-GraphRAG (Local) | 86.89 | 60.63 | 80.07 | 50.60 | 69.01 |
| Community-GraphRAG (Global) | 89.34 | **64.02** | 19.27 | **53.34** | 64.40 |
| **HippoRAG2** | 91.54 | 58.41 | 85.71 | 49.91 | **70.27** |

**Critical findings:**
- **HippoRAG2 takes highest overall:** Achieves 70.27% overall accuracy, maintaining robust performance across both factual inference and relational hops.
- **Temporal queries benefit from community summaries:** Community-Global (53.34%) and Community-Local (50.60%) dramatically outperform standard RAG (30.70%). Aggregated community reports preserve timeline narratives distributed across documents.
- **Catastrophic Null degradation:** On unanswerable queries where the model should abstain, standard RAG achieves 96.01% accuracy, while Community-Global plummets to **19.27%**. Generalized community summaries mislead the generator into hallucinations.

### 3. NovelQA fine-grained slices (Table 3 excerpt)

In the complex narrative benchmark NovelQA, standard RAG maintains a clear lead on single-hop queries (`sh`, 68.73% avg) and detail lookups (`dtl`, 55.28% avg). Graph methods only become competitive on multi-hop questions (`mh`, 57–60% avg).

### 4. Orthogonal inference enhancements (Section 4.3, Figure 1)

Section 4.3 and Figure 1 demonstrate that adding rerankers (BGE-Reranker-Large) or iterative retrieval (IRCoT) improves performance across all architectures. Crucially, however:
- Relative rankings remain identical: RAG remains superior for single-hop, while graph approaches remain superior for multi-hop.
- Community-Local + IRCoT still fails to repair Null query performance.
- Inference-time enhancements are orthogonal tools; they do not compensate for an ill-suited retrieval topology.

### 5. Impact of the graph construction LLM (Table 5)

Using Llama-3.1-70B on MultiHop-RAG, the authors evaluate how construction LLM capability affects downstream quality:

| Construction Model | Inference | Comparison | Temporal | **Overall** |
| :--- | :--- | :--- | :--- | :--- |
| None (Standard RAG) | **94.85** | 56.31 | 25.73 | 65.77 |
| GPT-4o-mini | 92.03 | 60.16 | 49.06 | 71.17 |
| **GPT-4o** | 93.63 | **66.59** | **58.49** | **75.08** |

Temporal accuracy surges from 25.73% (no graph) to 49.06% (GPT-4o-mini) and 58.49% (GPT-4o). GraphRAG's reasoning ceiling is strictly bounded by the capability of the construction model. Building a graph with weak models introduces corrupted relations that degrade retrieval.

### 6. Efficiency and cost trade-offs (Section 4.6, Table 4)

Resource consumption measured on the MultiHop-RAG dataset:

| Method | Construction Time (s) | Retrieval Time (s) | Storage Footprint (MB) |
| :--- | :--- | :--- | :--- |
| **Standard Dense RAG** | **135** | 1,724 | 127 |
| KG-GraphRAG | 7,702 (57×) | **14,434** (8.3×) | **117** |
| Community-GraphRAG | 5,560 (41×) | **1,249** | 165 |

- **Construction is expensive:** Building graph indexes takes 41x to 57x longer than embedding chunks for vector RAG.
- **KG retrieval latency is prohibitive:** KG-GraphRAG requires 8.3x longer to query than standard RAG due to iterative LLM entity extraction and multi-hop expansion.
- **Community retrieval efficiency:** Community-GraphRAG retrieval is faster than standard RAG (1,249s vs 1,724s) because matching high-level summaries sharply restricts candidate evaluation.

### 7. Query-based summarization and evaluation bias (Section 5, Figure 4)

On SQuALITY and QMSum, methods returning raw text chunks (RAG, RAPTOR, HippoRAG2) outperform Community-Global, as human reference summaries rely on specific textual details lost in high-level summaries.

Furthermore, Section 5.3 and Figure 4 test the LLM-as-a-judge protocol used in earlier GraphRAG literature. Swapping the presentation order of candidate summaries (Order 1 vs. Order 2):
- **Comprehensiveness:** Order 1 heavily favors RAG; Order 2 drastically flips to favor Community-Local.
- **Diversity:** Inverting presentation order reverses win rates similarly.
- This demonstrates that earlier claims of GraphRAG's decisive summarization superiority were significantly distorted by position bias in judge LLMs.

## Evidence map

To ensure production decisions rest on validated facts, we separate direct evidence from causal interpretations, unverified scopes, and engineering conclusions:

### Direct paper evidence

- **Topology-dependent performance under controlled budgets:** Section 3 and Tables 1–3 prove that under matched token budgets, no single architecture dominates. Standard RAG leads on single-hop NQ (64.78% F1) and factual inference; HippoRAG2 achieves the highest multi-hop overall accuracy (70.27%); Community-Global leads on temporal queries (53.34%).
- **KG entity extraction loss:** Appendix C confirms that automated KG extraction only captures ~65.5%–65.8% of ground-truth entities, capping the ceiling of pure triplet retrieval.
- **Severe Null degradation:** Table 2 demonstrates that Community-Global collapses to 19.27% accuracy on unanswerable queries (compared to 96.01% for RAG).
- **Substantial construction and latency overhead:** Table 4 shows graph indexing requires 41x to 57x more time than standard RAG, while KG query latency is 8.3x higher.
- **Evaluation position bias:** Figure 4 establishes that LLM-as-a-judge evaluations of summarization flip dramatically when swapping presentation order.

### Author causal claim

- The authors contend that RAG and GraphRAG are fundamentally complementary rather than adversarial.
- Graph structures introduce inductive biases for relational paths and global summaries that dense vector spaces cannot provide.
- Hybrid Selection routing and Integration concatenation enable practitioners to combine the localized precision of RAG with the relational depth of graphs.
- Downstream graph retrieval quality is primarily determined by the extraction accuracy of the graph-building LLM.

### Unsupported claims

- **Incremental maintenance:** All experiments evaluated one-time offline batch indexing. Real-time document insertion, updates, and deletions remain unmeasured.
- **Enterprise operational constraints:** The study does not evaluate access control lists (ACLs), multi-tenancy, cross-lingual retrieval, or live SLA constraints.
- **Total cost of ownership (TCO):** Table 4 reports execution seconds, omitting API billing, extraction retries, database hosting, observability, and human pipeline maintenance costs.
- **Cross-model generalizability:** Findings are centered on Llama-3.1-8B-Instruct. Generalizability across proprietary frontier models (e.g., GPT-4o, Claude 3.5 Sonnet) or specialized small language models remains unverified.

### Bloss0m engineering synthesis

Based on these empirical findings, Bloss0m establishes three architectural rules:
1. **Reject blanket migration:** Never replace an existing vector RAG pipeline solely based on aggregate benchmark improvements.
2. **Implement slice-based evaluation:** Segment production query logs into single-hop lookups, multi-hop relational questions, global aggregations, and unanswerable/out-of-domain queries to evaluate actual traffic distribution.
3. **Prioritize text-centric graph architectures:** When relational capabilities are required, favor architectures like HippoRAG2 that use graphs for routing while passing raw text passages to the generator.

## Artifacts and reproducibility

- **Accessibility status:** As of the checked date in 2026, the official benchmark repository [github.com/haoyuhan1/RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG) is public and accessible. The paper is available on arXiv (arXiv:2502.11371) in PDF and HTML formats.
- **Reproducibility limitations:**  
  - The repository contains a single initial commit, and GitHub Releases is empty. No pre-built graph caches, model checkpoints, or deterministic environment containers are provided.
  - The implementation depends on multiple external libraries (LlamaIndex, vLLM, HippoRAG, RAPTOR, Microsoft GraphRAG, and OpenAI APIs). Upstream package changes and API endpoint shifts may cause experimental drift.
  - **Verification boundary:** Metrics cited in this article are author-reported results under their controlled protocol, not an independent re-execution. The codebase is sufficient for proof-of-concept development, but full bit-level replication requires pinning environments and API versions.

## Bloss0m engineering judgment and when not to use it

We summarize the adoption criteria and negative indicators into an actionable decision matrix:

| Use Case & Query Characteristics | Architectural Decision | Key Evidence & Rationale |
| :--- | :--- | :--- |
| **FAQ, definition lookups, and specific fact retrieval** | **Maintain Standard Dense RAG** | Table 1 proves RAG leads on single-hop NQ (64.78% F1); building graphs introduces 40x indexing overhead without performance gain. |
| **Strict hallucination prevention / unanswerable query safety** | **Prohibit Community-Global** | Table 2 shows Community-Global drops to 19.27% accuracy on Null questions (RAG: 96.01%), introducing unacceptable compliance risk. |
| **High-frequency updates (Freshness < 1 hour)** | **Defer Full GraphRAG** | Re-indexing graphs requires hours (Table 4); reliable enterprise incremental community update pipelines remain immature. |
| **Dense cross-document entity relationships (fraud, medical)** | **Adopt HippoRAG2 (Text-centric Graph)** | Table 2 shows 70.27% overall accuracy, combining graph path discovery with unfragmented raw passage context. |
| **Corpus-wide macro summarization (market analysis)** | **Evaluate Community-Global with safeguards** | Strong signal on temporal (53.34%) and comparison (64.02%) queries; requires post-retrieval verification to guard against hallucinations. |
| **Heterogeneous mixed traffic** | **Deploy Selection Router** | Route queries dynamically using a lightweight classifier, directing factual lookups to dense RAG and relational queries to GraphRAG. |

### When not to use GraphRAG

1. **No relational query requirements:** If over 80% of user queries can be resolved within 1–2 passages, graph construction is pure overhead.
2. **Sub-300ms p95 latency requirements:** Multi-step graph traversals and entity extractions cannot meet real-time interactive SLAs.
3. **No dedicated data curation team:** Graph extraction is highly sensitive to schema drift; without ongoing governance, graph quality decays rapidly.
4. **Direct concatenation (Integration) on small models (8B):** Concatenating heterogeneous graph summaries and text passages dilutes generator focus and degrades abstention accuracy.

## Three things to remember

1. **Technical essence:** GraphRAG represents four distinct architectural families (KG-based, Community-based, Text-centric, and Hierarchical), not a single monolithic baseline. Its value lies in providing structural relational priors, not obsoleting vector search.
2. **Central evidence:** In fair, budget-aligned comparisons, standard vector RAG leads on single-hop facts (NQ F1 64.78%) and Null abstention (96.01%); HippoRAG2 achieves the best overall multi-hop accuracy (70.27%); Community-Global excels at temporal queries (53.34%) but collapses on unanswerable queries (19.27%), with indexing costs 41x to 57x higher than RAG.
3. **Engineering boundary:** Never adopt GraphRAG based on an aggregate benchmark score. Segment workloads by evidence topology and deploy a Selection router to keep simple queries on fast, inexpensive vector RAG while reserving graph traversal for complex multi-hop reasoning.

## Primary sources

- **Primary paper:** Haoyu Han, Li Ma, Yu Wang, Harry Shomer, Yongjia Lei, Zhisheng Qi, Kai Guo, Zhigang Hua, Bo Long, Hui Liu, Charu C. Aggarwal, Jiliang Tang. *RAG vs. GraphRAG: A Systematic Evaluation and Key Insights*. arXiv:2502.11371 [cs.CL], 2025. [arXiv Page](https://arxiv.org/abs/2502.11371) | [PDF Link](https://arxiv.org/pdf/2502.11371.pdf)
- **Official repository:** [haoyuhan1/RAGvsGraphRAG](https://github.com/haoyuhan1/RAGvsGraphRAG) (implementations of RAG, KG-GraphRAG, Microsoft GraphRAG, HippoRAG2, and evaluation scripts).
- **Foundational related works:**
  - Edge et al. *From Local to Global: A Graph RAG Approach to Query-Focused Summarization*. arXiv:2404.16130, 2024.
  - Soman et al. *HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models*. NeurIPS 2024.
  - Sarthi et al. *RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval*. ICLR 2024.
