---
title: "VikingRAG: Fewer Retrieval Rounds, Less Context Waste for Structured-Document RAG"
description: "A deep reading of VikingRAG: hierarchy-preserving URI-addressable storage, Search/List/Grep/Read tools, reusable experience edges, and adaptive escalation for reducing repeated retrieval tokens and latency."
pubDate: 2026-09-15
updatedDate: 2026-09-15
tldr:
  - "VikingRAG is not simply another vector index. Chunks, section abstracts, and directory nodes share a hierarchy-preserving URI namespace: Search finds a semantic entry point, then List, Grep, and Read gather evidence inside a scoped subtree."
  - "VikingRAG-E materializes successful multi-round retrieval traces as query-conditioned experience edges. VikingRAG-E+ starts with one-round experience-enhanced retrieval and escalates to agentic retrieval only when an evidence-sufficiency checker finds the context inadequate."
  - "Across six structured-document datasets, the authors report 11.6%–51.9% of the tokens used by high-accuracy baselines for base VikingRAG, falling to 5.1%–32.5% with both optimizations; this is not a universal total-cost guarantee for production RAG."
  - "The largest adoption risk is false-no-escalation: even the structured checker remains above 5% on several datasets, while warm-up and evaluation questions are independently derived from the same document corpus."
audience:
  - "AI engineers building large-document knowledge bases, agentic RAG, or multi-round evidence retrieval"
  - "RAG platform owners who must govern tokens, latency, index updates, retrieval traces, and evidence sufficiency together"
tags: ["Paper Reading", "RAG", "Retrieval", "Agent Systems", "AI Engineering", "Evaluation"]
image: "/paperReading/48-vikingrag-structured-document-retrieval/title_image.webp"
field: "Information Retrieval"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
  - agent-memory-adaptation
paper:
  title: "VikingRAG: Accurate and Token-efficient Retrieval-augmented Generation over Structured Documents"
  authors:
    - "Peiyuan Gao"
    - "Gaoyuan Zhang"
    - "Haojie Qin"
    - "Yahui Sun"
    - "Qianyi Zhang"
    - "Yunhao Zhang"
    - "Zeyu Wang"
    - "Wei Lu"
  year: 2026
  venue: "arXiv 2609.11390 v1（2026-09-10；未同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2609.11390v1"
    arxiv: "https://arxiv.org/abs/2609.11390"
    doi: "https://doi.org/10.48550/arXiv.2609.11390"
    code: "https://github.com/rucdatascience/VikingRAG"
    project: "https://arxiv.org/html/2609.11390"
series:
  id: "vikingrag-structured-document-retrieval"
  title: "Structured Retrieval for Production RAG"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Enterprise manuals, syllabi, papers, contracts, and financial reports are not bags of unrelated chunks. An answer may require finding the right document, then following chapter, section, or subsection structure to collect facts that are far apart. Serializing every directory into the prompt makes structural context expensive; doing only one flat top-k retrieval can miss cross-section dependencies on the first pass.
- **Core insight:** Move the hierarchy from the prompt into queryable external semantic storage. Every directory node, chunk, and multi-level abstract receives a URI whose prefix preserves ancestor–descendant relations. A vector result is therefore not only text; it is a navigation handle that can drive scoped List, Grep, and Read operations (Sections 2.2 and 3.1).
- **Strongest evidence:** The evaluation covers six structured-document datasets and eight baselines, with default settings K=10, L=1,000, and B=15. End-to-end accuracy, latency, LLM tokens, ingestion, and deletion are measured. Figure 3 and Table 3 report 11.6%–51.9% token ratios for VikingRAG and 5.1%–32.5% for VikingRAG-E+; Figure 7 repeats the central comparison with GPT-5.5, Seed-2.0, and GLM-4.7 on VersionQA.
- **Main boundary:** Accuracy is an LLM-as-a-judge semantic-consistency proxy with expert verification, not a direct retrieval-recall or independently replicated correctness proof. Experience edges are warmed with 1,000 synthetic historical questions generated from the same document corpus; false-no-escalation is still 14.4% on QASPER and 6.7% on FinanceBench (Table 7).

My bounded verdict is: **VikingRAG connects document hierarchy, agent navigation, historical retrieval reuse, and conditional escalation into a serving architecture worth testing. It fits knowledge bases with native structure, repeated queries, and cross-section evidence dependencies. It is not a guarantee that arbitrary documents become reliable evidence, and a token ratio is not the same thing as total cost of ownership or end-user latency.**

> **Huahua's engineering note**
>
> An experience edge does not mean that two URIs are permanently related. It means that, under one historical question and tool trace, moving from one source to another once led to useful evidence. Document updates, ACL changes, intent drift, or an incorrect historical answer can turn that shortcut into a contamination source. Production systems need versioning, permission checks, TTLs, and revalidation around the edge store.

## Version, sources, and the reader question

This article reads [VikingRAG](https://arxiv.org/abs/2609.11390) v1, submitted to arXiv on 2026-09-10 by Peiyuan Gao, Gaoyuan Zhang, Haojie Qin, Yahui Sun, Qianyi Zhang, Yunhao Zhang, Zeyu Wang, and Wei Lu. It is an arXiv preprint, not a peer-reviewed conference or journal result. I checked the [full arXiv HTML](https://arxiv.org/html/2609.11390), the [PDF](https://arxiv.org/pdf/2609.11390v1), all seven figures, Tables 1–7, Algorithms 1–3, Sections 3–6, and the authors' [VikingRAG repository](https://github.com/rucdatascience/VikingRAG).

The reader question is: **How can a structured-document RAG agent keep the benefits of multi-round evidence gathering without placing every directory, tool call, and previous answer into an ever-growing prompt?** This is a useful follow-up to [RAG-MCP's tool interface and routing](/en/paper-reading/04-rag-mcp/), [DocMemo's dynamic evidence discovery](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/), and [BM25 at scale's cost curves](/en/paper-reading/13-bm25-wins-at-scale/). VikingRAG does not merely swap a retriever; it changes how storage, the tool loop, trace reuse, and escalation interact.

## Evidence map: Paper, evidence, and judgment

| Layer | What this reading says |
| --- | --- |
| **Directly supported by the Paper** | Prompt-decoupled hierarchy-preserving semantic storage; URI namespace and subtree scope; Search, List, Grep, and Read; evidence-gap-driven multi-round retrieval; query-conditioned experience edges; adaptive retrieval escalation; and six-dataset measurements of accuracy, latency, tokens, ingestion, deletion, and parameter sensitivity. |
| **Author claims** | VikingRAG retains high structure-aware RAG accuracy while reducing structural-context tokens through selective directory exposure; VikingRAG-E and E+ reuse successful paths and remove unnecessary agentic rounds. |
| **Not established by the evidence** | A total-cost advantage for every enterprise workload; safety of experience edges after document or ACL changes; a correctness guarantee for the evidence checker; a latency SLO under a real provider queue; or end-to-end citation faithfulness. |
| **Bloss0m engineering judgment** | Treat the URI as a control-plane primitive joining the semantic index, structural navigator, and permission/version boundaries. Treat edges and escalation as observable cache and policy layers, not as memories that can be trusted unconditionally. |

### Paper Essence Contract

1. **What problem does it solve?** It addresses the accuracy/context-cost tension in structured-document RAG: flat chunks discard hierarchy cues, while complete directory prompts and multi-round history expand.
2. **Why are previous approaches insufficient?** MoDora, BookRAG, and KohakuRAG use hierarchy but do not necessarily turn an arbitrary semantic hit into a locally addressable navigation path; DeepRead can gather evidence over multiple rounds but exposes complete directories and interaction history to the LLM, making structural cost grow with candidate documents and rounds (Sections 1.1 and 2.3).
3. **What is the core technical idea?** A semantic lookup returns a URI, and that URI scopes later structural and lexical operations. A successful multi-round path is then materialized as a directed edge with query context, and a sufficiency check decides whether a full agentic path is needed.
4. **How does one input move through the method?** `question → Search for a semantic entry point → Read/List/Grep within the URI subtree → add tool rounds only if a gap remains → sufficient evidence → answer`; the warm E+ path is `question → vector plus edge augmentation → constraint-aware sufficiency check → answer or escalation`.
5. **Which evidence supports the headline claim?** Figure 3 and Table 3 test end-to-end accuracy, latency, and token ratios; Figure 4 tests insert, delete, and internal/external updates; Figure 5 tests M, γ, K, L, and B trade-offs; Table 7 directly measures false-no-escalation.
6. **Where does the claim stop?** It stops at the selected six datasets, LLM judge, synthetic warm-up, 24-hour ingestion budget, and provider APIs. The engineering consequence is to run a canary with your own workload, freshness model, ACLs, edge invalidation, and checker calibration rather than copying the defaults.

## Why the obvious approaches are insufficient

“Structure-aware” is not one method. Table 1 separates three capabilities: considering directories, performing evidence-gap-driven multi-round directory retrieval, and exposing only the directory segments that are needed.

### Flat chunks lose where evidence lives

NaiveRAG chunks, embeds, retrieves top-k passages, and generates an answer. This is direct for a local fact, but it does not guarantee that the chunk's native section, chapter, or sibling context remains available. Two passages may mention the same entity while the actual answer is determined by a policy, date range, or exception in only one of them. Graph RAG can connect entities or passages, but the paper's comparison emphasizes that these edges are generally content-derived relations extracted from the corpus, not the document's containment hierarchy and not necessarily the retrieval path discovered for a particular query.

### Structure-aware systems still pay for access and feedback

MoDora performs root-first, top-down traversal over a document tree; BookRAG joins an entity graph with a structure-aware tree; KohakuRAG chunks along hierarchy boundaries and builds multi-level embeddings. These designs exploit more context than flat chunks, but the paper's claimed gap is that they do not necessarily diagnose which entity, time condition, or scope remains unsupported after the initial retrieval, then formulate the next targeted retrieval action.

DeepRead is closer to this need: an agent can continue searching after inspecting intermediate evidence. The paper argues that DeepRead serializes complete candidate directories as plain-text prompt metadata and appends reasoning, directory views, and retrieved content to the interaction history each round. The trade-off is explicit: multi-round retrieval can recover scattered evidence, but every candidate document and every extra tool interaction also grows the LLM's structural and historical context.

VikingRAG does not say “avoid multi-round retrieval.” It moves the state required for navigation from a complete prompt to an external URI namespace that can be exposed on demand. This becomes important for experience edges: **the reusable residue of one exploration is not the whole prompt, but a conditionally activated path hint.**

## Core intuition: make the hierarchy an addressable external state

Imagine a document called `Home Cooking` with a `Pasta` chapter and a `Carbonara` subsection. VikingRAG stores more than a list of chunks: it materializes directory nodes, an abstract for each node, and the evidence chunks, then gives them URIs that express containment:

```text
viking://home_cooking/Pasta/Carbonara/
viking://home_cooking/Pasta/Carbonara/.abstract.md
viking://home_cooking/Pasta/Carbonara/Carbonara_1.md
```

The point is not that these strings look like file paths. Their prefixes carry scope semantics. Section 3.1 writes $u\preceq_{\mathcal{U}}u'$ when $u$ is a component-wise path prefix of $u'$; an operation scoped to `Pasta/Carbonara/` should therefore see only that subtree. Each chunk or abstract in the vector index also stores its embedding, URI, type, hierarchy depth, and preview. Vector retrieval returns “similar object plus an address that can continue navigation,” rather than text detached from its source structure.

![VikingRAG Figure 1: overview of hierarchy-preserving semantic storage, the URI namespace, and the agent retrieval path.](/paperReading/48-vikingrag-structured-document-retrieval/paper/figure-1-overview.svg)

*Figure 1, paper Sections 2.2 and 3.1: the overview connects the hierarchy, multi-granular abstracts, URI-addressable objects, semantic index, and retrieval tools. [Original Figure 1](https://arxiv.org/html/2609.11390#S2.F1) · [Original SVG endpoint](https://arxiv.org/html/2609.11390/graph1.danlan.v2.svg). Taken from the arXiv HTML v1; that page states an arXiv.org perpetual non-exclusive license. This article preserves attribution and uses a local SVG mirror; reuse remains subject to the original license and copyright restrictions.*

### How the three object layers fit together

The first insertion step is hierarchy extraction and structure-aware segmentation. Markdown can expose headings directly; PDF and DOCX inputs are converted to Markdown before headings, paragraphs, and sentences are used to split regions under a chunk-size upper bound $L$. Every chunk $c_i$ retains its finest owner node $\rho_D(c_i)$, so evidence can later be placed back into section context.

The second step is bottom-up abstraction. A leaf abstract summarizes its owned chunks, while an internal abstract summarizes the abstracts of its children. Abstracts are compact navigation representations; the original chunks remain the primary evidence for answering. Both granularities are indexed, but the whole tree does not have to be sent to the prompt.

The third step is shared URI materialization. The paper represents stored document state as:

$$\mathcal{S}[D]=\langle\mathcal{H}_{D},\phi_D,\mathcal{I}_D\rangle$$

Here $\mathcal{H}_D$ is the materialized hierarchy containing nodes, chunks, and abstracts; $\phi_D$ maps objects to URIs; and $\mathcal{I}_D$ is the vector index over chunks and abstracts. Operationally, this means that deletion can remove materialized objects and vector records under a URI namespace, while a query can resolve a semantic result back into its hierarchy without traversing from the root again.

### Search, List, Grep, and Read have different jobs

- `Search(q, u, K)`: vector search under optional URI scope $u$, returning top-$K$ chunks or abstracts with URI, score, and metadata preview. It performs coarse semantic localization.
- `List(u)`: returns the immediate children of a directory URI. It reveals the local map after an anchor has been found, rather than injecting the entire corpus directory into the prompt.
- `Grep(p, u)`: performs lexical pattern matching inside the subtree rooted at $u$. It is useful for exact keywords, version numbers, policy terms, and field names, complementing embeddings on rare strings and negations.
- `Read(u)`: loads the chunk or abstract at URI $u$. It is the evidence-acquisition step that moves from “possibly related” to “source text that can be checked.”

Together, these form a compact reader loop: Search finds a handle, List checks the local map, Grep finds exact clues, and Read obtains the full evidence. Because URI carries the scope, semantic retrieval and structural navigation share one address space.

## Walk one syllabus question through the method

The following restates the `cs466_syllabus` case study from Section 3.2, Algorithm 1, and Figure 2. It is the retrieval trace supplied by the paper, not an additional experiment invented here.

The question is: “Based on `cs466_syllabus`, am I required to purchase a textbook for this course?” The correct answer is No, but the first semantic hit is only a syllabus header containing the course title, term, instructor, schedule, and teaching assistants; it does not contain the textbook policy.

1. **Input:** The user question $Q$ and retrieval prompt $M_0$. The system exposes `Search`, `List`, `Grep`, and `Read`, with $K=10$ and a bounded round budget $B$.
2. **URI-level intermediate representation:** The first `Search` returns a chunk under `cs466_syllabus`. It is not yet the answer, but it turns corpus-level uncertainty into a concrete URI handle. This is the key difference from “take the top hit and generate.”
3. **Evidence-gap decision:** After `Read` reveals a header, the agent identifies the remaining gap: it has found the right syllabus but still needs to verify the textbook policy inside it. `List` exposes neighboring chunks in that syllabus rather than resending every document directory to the LLM.
4. **Scoped exact lookup:** Within the `cs466_syllabus` scope, the agent calls `Grep` for `textbook`, `book`, `required`, and `purchase`. It finds a candidate chunk mentioning an “optional accompanying textbook”; the scope prevents a corpus-wide keyword scan.
5. **Verification and output:** The final `Read` loads the matched chunk and confirms that the textbook is optional, after which the system generates No. A high-scoring vector hit or an isolated keyword would not establish that distinction.
6. **Likely failure point:** If chunking separates the policy's negation, the Grep pattern misses a synonym, or the agent declares sufficiency before the final `Read`, the answer can still fail. If $B$ is exhausted, Algorithm 1 finalizes from accumulated $M^{(B)}$; the paper explicitly does not equate that with complete evidence.

![VikingRAG Figure 2: the syllabus example's Search, Read, List, Grep, and Read evidence-gap-driven retrieval trace.](/paperReading/48-vikingrag-structured-document-retrieval/paper/figure-2-retrieval-trace.svg)

*Figure 2, paper Section 3.2: the `cs466_syllabus` example first finds a URI anchor with Search, then uses List, Grep, and Read to locate and verify the optional textbook policy. [Original Figure 2](https://arxiv.org/html/2609.11390#S3.F2) · [Original SVG endpoint](https://arxiv.org/html/2609.11390/graph4.v2.svg). Taken from the arXiv HTML v1; that page states an arXiv.org perpetual non-exclusive license. This article preserves attribution and uses a local SVG mirror; reuse remains subject to the original license and copyright restrictions.*

## Multi-round retrieval: token cost and stopping conditions

The context visible after round $t$ in Algorithm 1 is:

$$M^{(t)}=M^{(0)}\oplus[(R_1,\mathcal{F}_1,\mathcal{O}_1),\ldots,(R_t,\mathcal{F}_t,\mathcal{O}_t)]$$

Here $R_t$ is the model's retrieval response, $\mathcal{F}_t$ is the parsed set of function calls, $\mathcal{O}_t$ is the set of tool outputs, and $\oplus$ appends the interactions to the message context. This expression explains how later actions depend on earlier findings, but also exposes the cost: each round can carry prior reasoning, calls, and results forward. The loop stops when the model returns without more function calls or when the hard round budget $B$ is reached. At the budget boundary, the system finalizes from accumulated context, and the paper cautions that this does not prove evidence completeness.

This is the trade-off hidden by a headline token ratio. VikingRAG moves directory metadata out of the prompt, but it does not make agentic history free. Every `Search`, `List`, `Grep`, and `Read` output that enters the next round can still expand context. The proposed system answers with two serving-time optimizations rather than claiming that multi-round retrieval has no cost.

## Experience edges: turn successful traces into query-conditioned shortcuts

### Not an ordinary knowledge-graph edge

VikingRAG-E edges are usage-derived, not entity relations extracted from the corpus during ingestion. Suppose a historical question first reaches source URI $v$ through `Search`, then discovers answer-supporting target URI $u$ through `Grep` or `Read`. The trace is summarized as:

$$\varepsilon_{v\rightarrow u}=(v,u,r_\varepsilon),\qquad r_\varepsilon=(\operatorname{Embed}(Q),H)$$

Here $Q$ is the historical question and $H$ is a compact summary of the tool-call trace. The direction $v\rightarrow u$ means that once a similar query reaches $v$, $u$ may be a useful next evidence location. It does not claim that $v$ and $u$ are related for every task. The paper's person–university example makes this concrete: a relation useful for graduate-study questions may be irrelevant to a hometown question.

### Edge construction depends on a judgment step

From a trace $\tau=\langle(f_i,\theta_i,o_i)\rangle$, URIs returned by Search form the source set; URIs returned by Grep and URIs passed to Read form candidates; an evidence-selection judgment keeps the targets that support $Q$ and $A$. A URI reached through an existing edge is excluded, preventing every reuse from reconstructing the same relation. This has two engineering consequences:

1. Edge construction is not merely deterministic log compaction. It uses an LLM-powered evidence-selection judgment, so a wrong answer or a missed selection can materialize a wrong path.
2. Edges are directed and the implementation stores reverse records so incoming edges can be removed when a URI node is deleted. That demonstrates an explicit maintenance path, but it does not prove complete governance under document revisions, ACL changes, embedding revisions, or multi-tenant isolation.

### Query-time activation

For a new question $Q'$, ordinary top-$K$ vector search produces seed URIs. The edge index expands outward from each seed only when:

$$\operatorname{sim}(\mathbf{z}_{Q'},r_\varepsilon.\mathbf{z}_Q)\geq\gamma$$

Here $\mathbf{z}_{Q'}$ is the new-question embedding, $r_\varepsilon.\mathbf{z}_Q$ is the historical-question embedding saved in the edge, and $\gamma\in[0,1]$ is the activation threshold. A low $\gamma$ activates weakly related edges, polluting evidence and increasing tokens and latency; a high $\gamma$ makes useful shortcuts hard to activate. The paper uses $\gamma=0.8$ for its default operating point in Figure 5, not as a universally calibrated constant.

The Supplement's case study compresses a five-round exploration into two rounds with experience edges. Tables 4–6 report that, after warming each dataset with $M=1,000$ historical questions, edge counts range from 14,371 on VersionQA to 38,540 on FinanceBench; construction takes 1.5–3.7 seconds per question; and the proportion of test questions semantically similar to at least one historical question ranges from 26.48% to 60%. These numbers support the idea that repeated queries can benefit, not that every new query can use a shortcut.

## Adaptive escalation: verify cheaply, then decide whether to invoke the agent

VikingRAG-E+ places E's edge-augmented search behind a policy gate:

```text
one-round vector + experience-edge retrieval
        ↓
candidate answer + evidence-sufficiency check
        ├─ sufficient → generate answer
        └─ incomplete / ambiguous → VikingRAG multi-round retrieval
```

The checker does not simply ask whether the context looks relevant. Section 5 says it first asks the LLM to enumerate constraints that the answer must satisfy, such as entity, time, and scope; it then selects direct evidence and judges whether that evidence is sufficient. The intuition is to separate semantic relatedness from answer sufficiency: a passage about the same company but a different reporting year should not pass the no-escalation gate merely because it is similar.

The changed control point is **whether to pay for the full agentic retrieval path**, not a claim that the checker is a correctness oracle. Table 7 defines `false-NoEscalation` as the percentage of questions where one-round evidence is insufficient but the system incorrectly decides not to escalate. The structured checker versus a naive prompt is: VersionQA 5% vs 13%, SyllabusQA 8.3% vs 24.3%, QASPER 14.4% vs 29.7%, HotpotQA 3% vs 8%, LegalBench-cuad 7.5% vs 20.7%, and FinanceBench 6.7% vs 22.7%. The checker reduces the error substantially, but QASPER, LegalBench-cuad, and FinanceBench remain material risks.

The interpretation is more subtle than “every missed escalation becomes an accuracy error.” The paper explains that some one-round-insufficient questions remain difficult even after multi-round retrieval; skipping escalation therefore does not change their already-wrong outcome. That is plausible, but it is not a safety argument. If a question would have been answered correctly after escalation, a false no-escalation decision does reduce accuracy. A production system should log the checker verdict, enumerated constraints, selected evidence, escalation decision, final judge or human review, and sampled reruns for disagreement.

## Original-paper evidence: accuracy, cost, storage, and sensitivity

### End-to-end results: fewer tokens, but not an unconditional baseline victory

![VikingRAG Figure 3: end-to-end accuracy, latency, and LLM token consumption across six datasets.](/paperReading/48-vikingrag-structured-document-retrieval/paper/figure-3-performance.svg)

*Figure 3, paper Section 6.2: end-to-end RAG performance compares VikingRAG, VikingRAG-E, VikingRAG-E+, and eight representative baselines on accuracy, latency, and token consumption. [Original Figure 3](https://arxiv.org/html/2609.11390#S6.F3) · [Original SVG endpoint](https://arxiv.org/html/2609.11390/retrieval_performance_deeepseekv4.svg). Taken from the arXiv HTML v1; that page states an arXiv.org perpetual non-exclusive license. This article preserves attribution and uses a local SVG mirror; reuse remains subject to the original license and copyright restrictions.*

The first readable conclusion from Figure 3 and Table 3 is that VikingRAG uses 11.6%–51.9% of the tokens used by the highest- and second-highest-accuracy baselines; VikingRAG-E uses 10.2%–40.2%; and VikingRAG-E+ reaches 5.1%–32.5%. These are relative ratios, not a fixed number of tokens saved per question and not a direct dollar bill. For example, Table 3 puts E+ at 12.3% of the gold baseline and 5.1% of the silver baseline on HotpotQA, but at 7.9% and 10% on FinanceBench. The denominators differ, so the interval should not be read as a universal uplift.

The comparison protocol also has conditions. Every method first ingests the full collection and then answers QA pairs sequentially; each dataset-method has a 24-hour ingestion budget; VikingRAG(-E+) uses K=10, L=1,000, and B=15 by default. HippoRAG-2, LightRAG, and BookRAG are N/A on some datasets because they fail to ingest within the budget, while the authors use the high-accuracy baselines that complete as the main comparison set. This supports “a better accuracy-token operating point under this budget,” not “every N/A method would be worse with unlimited compute.”

Accuracy is computed with the same answer-generation prompt and an LLM judge that sees the question, gold answer, and system answer, then decides semantic consistency; experts verify inconsistent or ambiguous cases. This improves comparability, but the result can still depend on the judge model, prompt, gold-answer wording, and retrieval-induced answer style. The paper uses the end-to-end score as a proxy for evidence quality; it does not directly report Recall@k, citation precision, or claim-level support coverage.

### Storage trade-off: move some query cost into ingestion

![VikingRAG Figure 4: document insertion, deletion, and internal/external update performance.](/paperReading/48-vikingrag-structured-document-retrieval/paper/figure-4-storage.svg)

*Figure 4, paper Section 6.3: document storage performance compares insertion, deletion, and internal/external updates on three representative datasets; the paper explains the ingestion trade-offs from LLM previews and graph extraction. [Original Figure 4](https://arxiv.org/html/2609.11390#S6.F4) · [Original SVG endpoint](https://arxiv.org/html/2609.11390/storage_update_performance_log_insert_deeepseekv4.svg). Taken from the arXiv HTML v1; that page states an arXiv.org perpetual non-exclusive license. This article preserves attribution and uses a local SVG mirror; reuse remains subject to the original license and copyright restrictions.*

The hierarchy, abstracts, embeddings, previews, and vector index are not free. Section 3.1 gives insertion-space complexity as $O(N+N_A+|V_D|+|\mathcal{X}_D|\cdot d+S_{idx})$: $N$ is document size in tokens, $N_A$ is the total abstract size, $|V_D|$ is the number of structural nodes, $|\mathcal{X}_D|$ is the number of indexed chunks and abstracts, $d$ is the embedding dimension, and $S_{idx}$ is auxiliary index storage. This makes the build-side cost of embedding and previewing every indexed object explicit.

The authors find VikingRAG(-E+) has insertion latency comparable to DeepRead and MoDora, and is faster than knowledge-graph baselines in their setting. It consumes more insertion tokens than directory-based baselines, primarily because it creates a preview for each vector-indexed object. The authors consider that acceptable when ingestion is relatively infrequent and retrieval repeats often. This is a workload-dependent inference, not a measured break-even total-cost curve.

For deletion, VikingRAG removes materialized objects and then vector records whose URIs fall under the document namespace; like most baselines, it incurs no LLM-token cost for deletion. Figure 4 also includes the storage effect of adding edges, which the paper describes as acceptable because each edge stores URI endpoints and a compact summary. A real deployment still needs version and permission indexes: deleting a document means removing outgoing and incoming experience edges plus caches, previews, and ACL-filtered index records that refer to it.

### Parameters: K, L, B, M, and γ all change the evidence path

![VikingRAG Figure 5: the effects of historical questions, similarity threshold, K, L, and B on VikingRAG-E+.](/paperReading/48-vikingrag-structured-document-retrieval/paper/figure-5-parameters.svg)

*Figure 5, paper Section 6.6: the five rows vary warm-up count $M$, edge activation threshold $\gamma$, per-Search result count $K$, chunk bound $L$, and round budget $B$, showing their effects on accuracy, latency, and tokens. [Original Figure 5](https://arxiv.org/html/2609.11390#S6.F5) · [Original SVG endpoint](https://arxiv.org/html/2609.11390/impact_viking_params_deeepseekv4.svg). Taken from the arXiv HTML v1; that page states an arXiv.org perpetual non-exclusive license. This article preserves attribution and uses a local SVG mirror; reuse remains subject to the original license and copyright restrictions.*

- **$M$: warm-up coverage.** More historical questions increase the chance that a test question resembles at least one historical question, so E+ token use and latency tend to fall while accuracy remains stable. The cost of generating and answering those warm-up questions is not counted as query-time cost; live query history may also be noisier than synthetic questions.
- **$\gamma$: shortcut precision–recall.** A low threshold admits weakly related edges and irrelevant evidence; a high threshold makes useful experience difficult to reuse. $\gamma=0.8$ is a trade-off for this experiment, not a fixed global default.
- **$K$: evidence breadth per round.** $K=1$ can trigger more rounds because the evidence is insufficient, making it more expensive than $K=10$; $K=100$ puts many chunks into the context and raises tokens and latency. The non-monotonic curve is a reminder that “retrieve less per round” is not automatically cheaper.
- **$L$: chunk granularity.** A small $L$ fragments evidence and creates extra rounds; a large $L$ mixes in more irrelevant text. The authors use $L=1,000$, but language, table density, and section length can shift the operating point.
- **$B$: recovery budget.** A small $B$ prevents hard questions from recovering enough facts; a large $B$ lets a few difficult questions pull up average token cost without a proportional accuracy gain. $B=15$ is a bounded retrieval budget, not a promise that fifteen rounds find all evidence.

## Robustness, scale, and negative signals

The authors also vary the number of stored documents on HotpotQA and change the backbone LLM on VersionQA. Figure 6 shows that, from “only related” to 50% and 100% of documents, DeepRead accuracy falls while tokens and latency rise; VikingRAG(-E+) is generally more stable. “Only related” uses documents known to contain gold answers, so it is not a natural unknown-corpus condition. Figure 7 repeats the comparison with GPT-5.5, Seed-2.0, and GLM-4.7 in addition to DeepSeek-V4-Pro Preview; the reported accuracy/token conclusion remains consistent. This is evidence of backbone robustness, not a transfer proof for every embedding model, judge, or provider.

The datasets are meaningfully heterogeneous: VersionQA covers software documentation, SyllabusQA course syllabi, QASPER scientific papers, HotpotQA Wikipedia pages, LegalBench-cuad commercial contracts, and FinanceBench financial reports. Collection sizes range from 0.24M to 8.78M tokens, with PDF, Markdown, DOCX, and TXT inputs. This supports more than a single-format claim, but the QA pairs are tied to textual content; images, visual table layout, ACLs, document revisions, and multi-tenant noise are not evaluated.

The most important negative signal is ingestion feasibility. The paper reports that LightRAG and HippoRAG-2 cannot complete FinanceBench ingestion within 24 hours, while BookRAG completes within the budget only for VersionQA and SyllabusQA. That gives the practical-storage claim real relevance, but it also means N/A values reflect budget, implementation, and provider together. The other negative signal is the checker: the structured prompt reduces false-no-escalation but does not remove it. Hard questions can remain wrong after escalation, which explains why E+ and E have similar end-to-end accuracy; it does not make escalation irrelevant.

## Limitations, threats to validity, and overclaims to avoid

### The evidence-sufficiency checker is still a probabilistic policy gate

The checker asks an LLM to list constraints, select direct evidence, and judge sufficiency. This is more structured than a naive prompt, but it is not a deterministic verifier. Failure can come from omitting a constraint, resolving an entity incorrectly, ignoring a date range, treating a negation as support, or stopping because an abstract looks related. For high-risk finance, legal, or compliance questions, false-no-escalation cannot be explained away by average accuracy.

### Experience edges turn historical errors into durable state

Edge construction depends on a historical final answer and an LLM evidence-selection judgment. If the document was stale, the historical answer was wrong, or the next user has different permissions, the shortcut may copy an error or cross a boundary. The paper provides directed edges, reverse deletion records, and a similarity threshold, but no experiment of document updates, ACL changes, tenant isolation, poisoned traces, edge TTLs, or rollback. It is therefore too strong to say that experience edges have solved long-term RAG memory safely.

### Warm-up and evaluation can share document topics

The authors prevent the historical-question generator from seeing evaluation questions, gold answers, metadata, or paraphrases, and finalize all edges before testing. However, historical and evaluation questions are independently derived from the same corpus, so they can naturally share entities or topics. That is not direct leakage, but it is closer to recurring queries over a fixed knowledge base than to a wholly new production distribution. Similarity rates range from 26.48% on SyllabusQA to 60% on VersionQA; E+ benefit cannot be read from the headline range alone.

### Token, latency, and storage have different denominators

Query token ratios exclude the cost of generating and answering 1,000 historical questions, and are not the provider's dollar price. Latency reflects the same LLM API service condition and sequential evaluation. Storage depends on embedding dimension, index implementation, preview length, and edge payload. The paper reports practical insertion, deletion, and update behavior, but not a long-run break-even curve for each workload. Before adoption, replay your traffic and measure cold queries, warm queries, edge construction, re-indexing, permission filtering, cache misses, and escalation tail latency together.

### LLM-as-a-judge is not an independent correctness proof

Using the same judge and answer prompt for all methods helps relative comparison, and expert verification catches some disagreement. The judge can still prefer semantic similarity while overlooking citation provenance, numeric precision, or one decisive qualifier. The paper does not provide conventional confidence intervals for every headline comparison, nor replace aggregate judge accuracy with independent human labels, claim-level evidence recall, or calibrated abstention. This reading therefore calls the metric an end-to-end semantic-answer proxy, not a production truthfulness rate.

## Artifact availability and a smallest useful reproduction

As of **September 15, 2026**, the authors' [VikingRAG GitHub repository](https://github.com/rucdatascience/VikingRAG) is reachable at the `main` HEAD verified in this reading (`365d2adc00c8f42517aaef1dd037e0d6f9b58263`); its [LICENSE](https://github.com/rucdatascience/VikingRAG/blob/main/LICENSE) is AGPL-3.0. This is more than paper pseudocode: the README, [compose.yaml](https://github.com/rucdatascience/VikingRAG/blob/main/compose.yaml), Dockerfile, `benchmark/RAG` runner, six dataset adapters, YAML configurations, `generated_questions/`, checkpoint/output mounts, and [Supplement.pdf](https://github.com/rucdatascience/VikingRAG/blob/main/Supplement.pdf) are accessible. I classify it as a **usable source artifact with external dependencies**, not as an independently completed reproduction.

Data status must be separated. The repository's [DATA_LICENSE.md](https://github.com/rucdatascience/VikingRAG/blob/main/DATA_LICENSE.md) says that it does not redistribute FinanceBench, QASPER, SyllabusQA, LegalBench-CUAD, HotpotQA, or VersionQA upstream data. Its dataset service downloads pinned revisions from official hosts, while the user remains responsible for each upstream license. Models are not bundled either: the README's default configuration requires provider credentials for services such as Volcano Engine or OpenAI, plus VLM and embedding models. The experiment reports two Intel Xeon 6342 CPUs and two NVIDIA L20 GPUs. The artifact status is therefore: **code, configs, and supplement accessible; datasets obtained separately from official sources; checkpoints and provider access not fully bundled; end-to-end reproduction not independently verified here.**

The smallest useful reproduction should not begin by chasing every number in every table:

1. Install Docker and Compose, run `docker compose config --quiet`, and create `benchmark/RAG/.env` with local secrets that are never committed.
2. Download and verify VersionQA using the repository's pinned source and manifest. A successful download does not settle the upstream data license for your deployment.
3. Run one dataset through `import → VikingRAG`, then compare NaiveRAG, DeepRead, and VikingRAG. Save accuracy proxy, input/output tokens per question, round count, tool calls, latency, ingestion time, and storage.
4. Use a fixed, controlled historical-question set on that corpus to build edges, then run VikingRAG-E and E+. Preserve edge count, similarity rate, checker constraints, false-no-escalation, escalation rate, and final answers.
5. Add a human-reviewed hard-case shadow verifier covering cross-document dependencies, date conditions, negation, ACL changes, post-update URIs, and unanswerable questions. Enable E+ on low-risk traffic only after its skip decisions have independent checks.

The goal is not to claim that Table 3 has been reproduced. It is to answer your own break-even questions: when does historical trace cost pay back edge construction? Which objects must be rebuilt after a document update? Is one checker error more expensive than another retrieval round? If the answers are unknown, keep E+ in shadow mode: let it produce a verdict and suggested path while the full agentic route remains authoritative.

## Engineering transfer: when to use it and when not to

### Good fits

- **Stable native hierarchy:** chapters, clauses, appendices, course units, product versions, or financial-report sections are useful query-navigation signals.
- **Repeated queries with cross-section dependencies:** the same knowledge base receives recurring questions while answers are distributed across documents or distant sections, allowing edge construction to amortize.
- **Retrieval cost is a first-order bottleneck:** you have a token/latency budget and are willing to move some cost into ingestion, previews, embeddings, and edge maintenance.
- **A governed evidence gate is possible:** checker inputs, constraints, evidence, and verdicts can be logged, with forced escalation or human review for high-risk domains.

### Do not apply it directly when

- Documents change frequently, ACLs change often, or tenant isolation is strict but there is no URI versioning, edge invalidation, or permission-aware retrieval.
- Queries are mostly open-ended, historical traffic is sparse, and every intent is different; experience edges may add index size and noise without reuse.
- The real requirement is a deterministic database query, exact numerical computation, schema validation, or transaction semantics. LLM-guided retrieval does not replace those controls.
- You cannot sample and audit false-no-escalation but plan to let E+ skip deep retrieval for legal, financial, medical, or compliance decisions.
- You measure only query token ratio and omit ingestion, rebuild, storage, provider queueing, tail latency, judge disagreement, and human correction. That turns a serving trade-off into a misleading product ROI claim.

I would adopt the layers in this order: URI storage and scoped tools first; full VikingRAG multi-round retrieval second; experience edges in shadow traffic third; adaptive escalation as a reversible policy gate last. Keep a full-agent fallback at every layer, and trace both `Search → List/Grep → Read → answer` and `one-round → checker → escalation` in observability. That makes it possible to identify whether a quality change came from the index, edge, checker, or answer judge instead of opening every optimization at once.

## Three things to remember

1. **Technical idea:** VikingRAG's core is a shared URI address space. The hierarchy need not stay in the prompt, but every semantic hit can resolve to a scoped structural object; Search, List, Grep, and Read become evidence navigation rather than four isolated APIs.
2. **Strongest evidence:** Across six heterogeneous structured-document datasets and multiple backbones, the authors report comparable results to high-accuracy baselines while reducing token ratios to 11.6%–51.9%, with E+ reaching 5.1%–32.5%. Figure 3, Table 3, Figure 4, and Figure 5 show that this is a system trade-off across accuracy, history, ingestion, storage, and parameters.
3. **Adoption boundary:** Experience edges are query-conditioned historical shortcuts, and E+'s no-escalation decision is an LLM checker policy. The checker remains above 5% error on several datasets, while the artifact requires external data and model providers. Only after edge governance, ACLs, freshness, checker calibration, and a full-path fallback are in place should the token savings enter production.

## Primary sources

- [VikingRAG arXiv abstract and metadata](https://arxiv.org/abs/2609.11390) — v1 submitted 2026-09-10, preprint status.
- [VikingRAG full paper HTML](https://arxiv.org/html/2609.11390) — Sections 2–6, Figures 1–7, Tables 1–7, and Algorithms 1–3.
- [VikingRAG GitHub artifact](https://github.com/rucdatascience/VikingRAG) — AGPL-3.0 code, Docker workflow, benchmark adapters, configurations, and Supplement.pdf.
- [VikingRAG DATA_LICENSE.md](https://github.com/rucdatascience/VikingRAG/blob/main/DATA_LICENSE.md) — upstream dataset download and licensing responsibilities.

The Paper Radar ledger was not modified; artifact status in this article reflects independent endpoint checks performed on 2026-09-15.
