---
title: "TRACE: Accountable Source Discovery in Digital Archives"
description: "TRACE turns retrieval over OCR-degraded French archives into an inspectable agent workflow: corpus-targeted decomposition, fused search, deferred relevance decisions, and cross-question reranking. Read its results on 1,752 questions alongside the limits of the public data version, internal deployment claims, and cost estimate."
pubDate: 2026-10-07
updatedDate: 2026-10-07
tldr:
  - "TRACE evaluates source discovery: it returns ranked document IDs and retains the sub-question, search action, and acceptance rationale. It does not guarantee answer correctness or citation faithfulness."
  - "On the author-reported 1,752-question HistoriQA-ThirdRepublic benchmark, the DeepSeek-V4-Flash configuration reaches R@10 0.856 and MRR 0.653. The scope of the corpus and the comparison protocol matter when reading those numbers."
  - "In the cumulative ablation, decomposition adds 8.9 percentage points, the fused warm start adds 5.0, and hold-then-re-evaluation adds 0.5. These are sequential increments, not independent causal effects."
  - "The code and HistoriQA data are public, but the current dataset lists 1,782 questions rather than the 1,752 reported in TRACE v1. The paper’s claims of 24 researchers across six institutions and an estimated $0.02 per benchmark question were not independently verified here."
audience:
  - "Engineers and researchers building RAG over digital archives or historical collections"
  - "Digital humanities practitioners who need inspectable retrieval paths and cross-document discovery"
tags: ["Paper Reading", "RAG", "Agentic RAG", "Retrieval", "Evaluation", "Digital Humanities"]
topics:
  - retrieval-rag
  - agent-evaluation-observability
image: "/paperReading/93-trace-accountable-agentic-retrieval-archives/title_image.webp"
field: "AI Systems"
difficulty: "advanced"
showToc: true
paper:
  title: "TRACE: Accountable Agentic Retrieval for Source Discovery in Digital Archives"
  authors:
    - "Donghan Bian"
    - "Marie Puren"
    - "Florian Cafiero"
  year: 2026
  venue: "arXiv:2609.19897 v1 (2026-09-17; v1 states accepted at CIKM '26)"
  links:
    pdf: "https://arxiv.org/pdf/2609.19897v1"
    arxiv: "https://arxiv.org/abs/2609.19897"
    code: "https://github.com/Kepler1908/TRACE"
    project: "https://anr.fr/Projet-ANR-25-CE38-4063"
series:
  id: "archival-retrieval-accountability"
  title: "Archive Retrieval and Source Accountability"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Historical archive OCR can be noisy, and parliamentary records, newspapers, and other sub-corpora differ in format and vocabulary. A question may require evidence across documents and collections. Answer-generation scores alone do not reveal whether relevant sources were found, which documents were missed, or which retrieval decisions merit human review.
- **Core insight:** Treat the task as source discovery rather than only answer generation. TRACE decomposes a query by target sub-corpus, combines BM25, semantic, and date search, records chunk-level accept/reject/hold decisions, revisits uncertain material after more context arrives, and ranks documents by confirmation across separate sub-questions.
- **Strongest evidence:** On the author-reported 1,752-question HistoriQA-ThirdRepublic benchmark, the DeepSeek-V4-Flash configuration reaches R@10 0.856 and MRR 0.653. Table 2 compares BM25, dense retrieval, HippoRAG 2, LinearRAG, A-RAG, and MA-RAG. Table 3’s cumulative ablation shows decomposition and the warm start as the largest incremental gains.
- **Main boundary:** The evaluation covers one year, one language, and three types of French historical material from 1887. It measures document recall and ranking, not factual correctness of generated answers, increased expert trust, or lower research time. Public code and data also do not yet establish an identical frozen version of the paper’s 1,752-question run.

TRACE starts from a premise specific to historical research: retrieval is itself scholarly work. Researchers need to locate documents, inspect why they appeared, and follow the search path back to a source. The authors first split cross-corpus questions into search directions, then retrieve, judge, and replan within each direction before allowing confirmations across paths to influence the final ranking. The benchmark results support evaluating corpus-aware retrieval orchestration on this archive. The scores do not establish that TRACE’s explanations improve historians’ trust or workflow efficiency.

This reading follows [arXiv v1](https://arxiv.org/abs/2609.19897), submitted on 17 September 2026. Its version note says the definitive version was accepted to CIKM ’26; that publication-status statement comes from the paper. The experimental metrics below are author-reported and are discussed separately from the current public code, dataset version, and the authors’ description of internal DECIDON use.

> **Huahua's engineering note**: Finding a source document does not show that every claim in a generated answer is supported by it. Turning traceable retrieval into checkable answers still requires claim-to-passage links, the original image or page, document versions, and a record of human edits.

## Why the previous approach is insufficient for historical archives

Many RAG systems treat retrieval as an internal step before answering: retrieve a few passages, give them to a generator, and judge the result with Exact Match, F1, or an LLM evaluator. TRACE considers a narrower setting. If a question spans a parliamentary speech and newspapers with different political positions, a researcher may want to know which sources trace the circulation of an argument, not just receive a compact answer. OCR can corrupt proper names and rare words, defeating exact lexical matching. A question may also require finding a person in the parliamentary record and then following a claim into the press; one top-k list can cover only one side.

The authors therefore formulate the task as returning a ranked list of document IDs over a heterogeneous archive. Let the corpus be $\mathcal{D}=\mathcal{D}_1\cup\cdots\cup\mathcal{D}_K$, where each $\mathcal{D}_i$ is a sub-corpus. For question $q$, the gold set $G_q$ may span several sub-corpora, and the complete path is not necessarily apparent from the surface wording. Recall@k is the primary measure because the task is to return useful sources to a researcher, rather than to produce a fluent summary (§3.1, §4.2).

This also addresses two limits in prior approaches. Many agentic RAG systems are evaluated with answer-generation scores, which can conflate a model’s parametric knowledge with evidence retrieved from the collection. Graph-based RAG first extracts entities and builds relations, but OCR errors can corrupt entity extraction, and graph construction may compress source documents into a lossy intermediate representation. The authors therefore argue for retrieval-first source discovery over noisy text and a separate measure of retrieval quality (§2.1). This also bounds what “accountable” means in TRACE. Each accepted document can be traced to the sub-question that sought it, the search action that surfaced it, and a short rationale recorded when the agent accepted it. That exposes more of the retrieval process than adding a citation after generation. It is not a full provenance policy: the paper does not map each answer claim to a citeable source passage, nor evaluate whether a citation preserves context or supports an interpretation. The contribution is an inspectable retrieval path, not a completed source verification of the answer.

## Core intuition: defer a decision until later context can inform it

Hybrid retrieval can combine BM25 and vector search with reciprocal-rank fusion (RRF), avoiding direct comparison between channels with different score scales. But a fused list is usually just the initial candidate pool. If each passage is then immediately classified as relevant or irrelevant, an early local judgment can determine a document’s fate. Historical queries are especially vulnerable: a newspaper item may look unimportant in isolation, then become useful after the researcher sees a debate record or another newspaper’s account.

TRACE preserves three states during review. **Accept** means a chunk provides evidence toward the original question; the system records a rationale of at most 120 characters and accepts the parent document. **Reject** excludes only that chunk, leaving sibling chunks in the same long document available. **Hold** means the current context is insufficient, so the chunk enters a bounded pool for later review. Search and review strictly alternate, allowing newly found material to shape the next search (§3.4–§3.5).

This does not mean every uncertain result is retained forever. The held pool is bounded, the agent has a step budget, and one final pass revisits held chunks after the evidence has accumulated. This makes temporary uncertainty explicit while balancing search cost, candidate noise, and premature evidence loss. The hold-and-re-evaluation component adds only 0.5 percentage points in aggregate in the cumulative ablation, but it is intended to recover a smaller set of boundary cases whose relevance becomes clear later. The mean alone does not capture that design purpose (Table 3, §5.3).

## Walk one question through the system

The following is a schematic example that follows the paper’s method; it is not a HistoriQA question or a reported benchmark outcome. A researcher asks how a claim from an 1887 parliamentary debate appeared in two Paris newspapers with different political positions. A single document may not cover the question, and OCR can introduce variant spellings of names or places.

1. **Decompose the question.** One planner call creates sub-questions that jointly cover the original intent, such as finding the issue and speaker in the parliamentary record, then searching each newspaper for its account. Each sub-question targets one sub-corpus. Entity names remain in their original form to avoid introducing a new string mismatch through translation. Targeting routes the initial candidates; it does not prevent the later agent from searching across corpus boundaries (§3.2).
2. **Build an initial candidate pool.** For each direction, BM25, dense semantic search, and date search when a date is explicit produce candidates, then RRF combines their rankings. Each channel first pools chunk scores by parent document so a long item cannot fill the list merely because it has more chunks. Corpus targeting also makes the candidate cap apply within the selected sub-corpus, reducing the chance that a larger collection crowds out a smaller source (§3.3).
3. **Alternate search and review.** The agent sees both the original question and the current sub-question, reviews candidate chunks, and accepts, rejects, or holds them. A newspaper result may reveal a date, speaker, or concept that guides a later query. Rejection applies to the chunk, so another passage from the same document may still be found.
4. **Revisit and replan.** At the end of a sub-question, a second LLM call reviews the accepted set, stage memory, and held chunks. The resulting briefing contains a narrative summary, confirmed facts, dates, entities, remaining gaps, and search hints. Before the next sub-question begins, a replanner may adjust the remaining questions or add an uncovered direction, subject to a fixed maximum (§3.5).
5. **Merge and rank.** After all sub-questions finish, the system counts how many separate paths accepted each document. It orders count groups from high to low. Within a group, an LLM uses the agent’s short acceptance rationales to break ties; singleton groups require no extra ranking call (§3.6).

The same document accepted along multiple sub-question paths is an operational convergence signal in the authors’ design. Since the sub-questions do not share their accepted sets, repeated acceptance is less likely to be a consequence of a shared list. It still does not mean the document has been independently corroborated as historical evidence. If the planner decomposes the query incorrectly, two sub-questions depend on the same OCR error, or two newspapers copy from one source, confirmation count does not identify the bias. It ranks retrieval leads; it does not determine the historical reliability of a source.

![Original paper Figure 1: TRACE’s six-stage source-discovery pipeline.](/paperReading/93-trace-accountable-agentic-retrieval-archives/figure-1.png)

*Original paper Figure 1, §§3.1–3.6. It shows question decomposition, fused warm start, the agent search/review loop, held-item re-evaluation and briefing, replanning from the briefing, and final merge and ranking. The image is from [arXiv v1 Figure 1](https://arxiv.org/html/2609.19897v1#S3.F1). The page marks this authors’ version for personal and non-commercial use; this reproduction follows that restriction and preserves attribution. The robot illustration is part of the paper figure and does not depict the publication cover or a TRACE product interface.*

## Method: how retrieval becomes a traceable process

### 1. Corpus-targeted decomposition

The planner converts original question $q$ into at most $M_{\max}$ sub-questions $s_i=(\text{text}_i,c_i,\text{entities}_i)$. The constraints require the sub-questions to preserve the original meaning jointly, assign each one target sub-corpus, and preserve entity names in their original-language spelling. Targeting influences initial candidate allocation; it is not a permanent restriction. The agent may cross a corpus boundary if retrieved evidence suggests a connection (§3.2).

### 2. Fused warm start

Phase 1 builds an initial candidate set for each sub-question with BM25, dense semantic embeddings, and a temporal channel when a date can be resolved. BM25 can match proper nouns and domain terms that survived OCR; dense search can recover paraphrases; temporal scoring helps when the query provides an explicit date. The paper uses RRF with $k=60$, and aggregates each document by its best chunk score so passage count does not determine its share of the result list.

When the authors replayed executed sub-questions, the mean Jaccard overlap between BM25 and dense top-20 pools was only 0.19. Fusion recovered 78.9% of gold documents, compared with 70.1% for the better single channel. This analysis supports channel complementarity on this corpus. It does not imply the same overlap or gain on every OCR-degraded archive (§3.3).

### 3. Accept, reject, hold, and bounded memory

Phase 2 alternates retrieval and review rather than letting the agent issue a series of searches without processing their results. The agent sees the original question alongside its current sub-question: the latter focuses exploration, while the former remains the basis for judging relevance. That reduces the risk of losing cross-cutting evidence through an overly narrow decomposition. Five memory fields retain prior findings, question analysis, gathered evidence, remaining gaps, and next steps. At every step the memory is replaced with an update rather than growing into an accumulated conversation. An effective-step counter skips duplicate queries, parse failures, and empty results; two identical searches in a row trigger termination (§3.4).

Temporal search has one special rule. The system silently expands the agent’s date window by one day on each boundary. It does not show the expansion to the agent, since doing so might anchor later temporal reasoning to an artificially widened range. Results from the expanded boundary are automatically held for later review. This is a conservative response to date ambiguity, not a general guarantee of temporal calibration or archival normalization (§3.4).

### 4. Briefing, replanning, and count-grouped reranking

After a sub-question ends, its briefing is the only information passed to the next sub-question. It carries a narrative summary, confirmed facts, dates and entities, gaps, and search hints. Before a later sub-question begins, a replanner can revise the remaining plan or create another question if the briefing exposed an uncovered direction; a maximum number of sub-questions bounds cost. At the end, accepted sets from separate paths are merged. The count $\mathrm{cnt}(d)$ records how many sub-questions accepted document $d$; groups are ranked by decreasing count. Only documents tied within a group require an LLM call using the agents’ short rationales. Singleton groups pass through unchanged, so this stage does not re-read the full text of every candidate (§3.5–§3.6).

This gives a reader a path for asking why a document is ranked highly: which sub-question sought it, which search returned it, what rationale the agent recorded, and how many paths accepted it. The rationale is still a short LLM-authored text, not a verified description of the historical source. A deployment requiring auditability would also need to retain stable archive IDs, image/page references, OCR version, search configuration, model and prompt version, human corrections, and rights status.

## Experimental design: one year, several question types, shared data conversion

In TRACE v1, HistoriQA-ThirdRepublic contains 3,386 French documents from 1887: parliamentary debate transcripts and two Parisian newspapers, *Le Gaulois* and *L’Intransigeant*. The texts derive from digitized collections held by the Bibliothèque nationale de France (BnF) and include OCR errors, irregular layouts, and genre-specific vocabulary. The authors split them into 5,664 sentence-boundary chunks, with a maximum of 1,000 whitespace tokens and no overlap. The evaluation has 1,752 questions: 889 single-hop, 529 multi-hop generic, 142 bridge-entity, and 192 comparative. A domain historian collaborated in validating factual and contextual coherence (§4.1).

The baselines include basic retrieval (BM25 and dense retrieval), graph-based RAG (HippoRAG 2 and LinearRAG), and agentic RAG (A-RAG and MA-RAG). The authors adapted them to French, translating prompts and extraction templates and replacing the spaCy pipeline for graph entity extraction with its French equivalent. Systems use the same corpus conversion, chunking, document IDs, shared embedding and LLM backbone when applicable, and fixed retrieval depth. These controls aim to reduce differences caused by changing the data or model; they cannot erase every adaptation difference between system interfaces (§4.2).

R@k is the fraction of gold documents found among the top k results. The paper’s multi-gold MRR takes the reciprocal rank of each gold document and averages over the gold set. This penalizes a system that ranks only the easiest gold document near the top while leaving other required sources much lower. For agentic systems, the authors also report precision and recall on the accepted set, separating the agent’s accept/reject decisions from the final ranking (§4.2).

## Result 1: the main configurations and baseline table answer different questions

Table 1 compares DeepSeek-V3.2 and DeepSeek-V4-Flash. V4-Flash reaches overall R@10 0.856 and MRR 0.653, with accepted-set precision 0.393, accepted-set recall 0.879, and a mean of 7.0 accepted documents. V3.2 has higher R@10 (0.884) and accepted-set recall (0.915), but its precision falls to 0.238 and its mean accepted set grows to 10.4 documents. This is not a simple finding that a newer backbone wins on every metric. V4-Flash is more selective in this run: it returns a more precise accepted set, while recovering slightly fewer gold documents. A shorter review queue may be desirable in one workflow; avoiding missed sources may matter more in another. Precision and recall must be interpreted together.

Difficulty also varies by question type. V4-Flash reaches R@10 0.893 for single-hop questions, and 0.889 for generic multi-hop questions, though the latter’s MRR is 0.560. Bridge-entity questions reach 0.750 / 0.472 and comparative questions 0.674 / 0.396. Recovering at least some source material and placing several distributed sources near the top are different challenges. Table 1’s accepted-set recall tracks R@10 closely, suggesting that most loss occurs in the agent loop rather than in final tie-breaking (§5.1).

Table 2 compares TRACE in its V4-Flash configuration with six baselines. Overall R@10 / MRR are 0.643 / 0.467 for BM25, 0.734 / 0.535 for dense retrieval, 0.737 / 0.453 for HippoRAG 2, 0.727 / 0.513 for LinearRAG, 0.385 / 0.211 for A-RAG, 0.586 / 0.356 for MA-RAG, and 0.856 / 0.653 for TRACE. The gap is more visible on comparative multi-hop questions: TRACE reaches 0.674 / 0.396, versus 0.302 / 0.129 for dense retrieval. This supports better recovery and ranking of cross-source documents in this French historical benchmark. It does not establish that TRACE will outperform other RAG systems in general.

The agentic baseline comparison has an asymmetric ranking protocol. A-RAG and MA-RAG generate an answer from a retrieval trajectory rather than a deliberately ranked document list. The authors rank documents by discovery order and credit any relevant document encountered anywhere in the trajectory. This favors the baselines by counting a useful document even if it never informed the answer. It may disadvantage them because discovery order is not a relevance ranking, while TRACE explicitly re-ranks. Table 2 therefore provides a useful system comparison, but R@10 must be read with this output difference in mind. Panel (b), which reports precision and recall over accepted sets, offers another view that does not rely on the ranking order (§5.2).

## Result 2: decomposition gives the largest cumulative ablation increment

Table 3 uses a cumulative ablation. Starting with an agent-only baseline, the authors add decomposition, memory and replanning, the Phase 1 warm start, and finally hold-and-re-evaluation. Overall R@10 rises from 0.688 to 0.777 (+8.9 percentage points), 0.801 (+2.4), 0.851 (+5.0), and 0.856 (+0.5). Decomposition mainly improves multi-hop question types; memory and replanning help bridge-entity questions; the warm start raises the quality of initial candidates across types; the final hold pass adds a small aggregate gain while preserving evidence that may only become interpretable later.

The word “cumulative” matters. Components are added in one chosen order, and later increments build on earlier components that interact with them. This is not a leave-one-out experiment that removes each component while holding all others fixed. The +8.9 and +5.0 values describe changes along this path, not independent causal effects that can be carried to other systems. An engineering interpretation is that corpus-aware decomposition and a strong initial candidate pool are worth testing early, not that the table supplies a universal contribution estimate for each component.

Error attribution also points to the retrieval loop as the main bottleneck. In the V4-Flash run, the authors attribute every missed gold document: 82.6% of misses occur within the loop, while 17.4% were accepted but ranked below position ten. Within the loop, 36.8% of misses had been surfaced but judged irrelevant, 36.5% were never retrieved by any channel, and another 9.3% were held but never promoted. Improving only the final ranker cannot fix the largest category; assuming that better search coverage alone will fix judgment errors would also be incomplete (§5.1).

## Cost, latency, and researcher use are three kinds of evidence

The authors estimate costs using the hosted-inference API prices in effect for their experiment. DeepSeek-V4-Flash consumed 177.6 million input tokens and 39.7 million output tokens, for a total of about $36; V3.2 cost about $93. Dividing by 1,752 questions gives roughly $0.02 per question for V4-Flash. This is an author estimate for benchmark evaluation, not an audited cost of the DECIDON internal service. It excludes expert reading time, data preparation, maintenance, price changes, and institutional deployment costs (§5.1).

Latency has a separate denominator. In a timed sample of 200 questions, TRACE averaged 33.8 LLM calls and 169 seconds of model time per question. The authors estimate 97.8% of per-question wall-clock time was spent waiting for the hosted model, with about four seconds in framework computation. With eight questions running concurrently, the same workload completed in about 22 seconds per question. This shows that response time depends heavily on the serving backend and concurrency; it is not a fixed 22-second service-level guarantee. Both cost and latency depend on the model, tokens, prices, and execution pattern (§5.1).

The paper separately describes an internal DECIDON prototype available since March 2026 to 24 researchers from six partner institutions, with several hundred exploratory queries. The authors call it an early research service, not a public-facing BnF service, and defer systematic evaluation of adoption, workflow impact, and expert reading burden (§6). These are author-reported deployment details. Independently available evidence does not confirm account counts, query volume, or researcher time, so the claims do not establish externally verified adoption outcomes.

## Evidence map: measured results, author claims, and open questions

| Question | Evidence reported by the paper | What it supports | What remains unanswered |
| --- | --- | --- | --- |
| How well does the system find sources? | 1,752 HistoriQA questions; Tables 1 and 2 report R@10, MRR, and accepted-set P/R | On these materials and settings, TRACE returns and ranks more gold documents than the listed baselines | Whether each source is summarized correctly, answer claims remain citation-faithful, or results transfer to other years and languages |
| Which mechanisms add value? | Table 3 cumulative ablation | Decomposition and warm start have larger increments along the reported stack | Independent causal contributions with interacting components, a different order, or another corpus |
| Why are sources missed? | §5.1 partitions missed documents into loop errors, ranking below top ten, never retrieved, rejected, or unpromoted from hold | Judgment and candidate exploration merit attention before only tuning the final reranker | Whether generated rationales faithfully describe source text and the cost of fixing each error class |
| What value does the system bring to researchers? | §6 describes internal DECIDON use and several hundred exploratory queries | A prototype is connected to a real research context | Whether it increases expert trust, reduces reading time, improves findings, or is in production |
| What does each question cost? | §5.1 estimates $36 total API cost, about $0.02 per question, and reports a separate latency sample | A cost estimate under the model and prices used by the authors | Other price conditions, total internal service cost, expert labor, or an operational service level |

These are different forms of evidence. Benchmark tables support comparisons of retrieval quality; the ablation table supports incremental observations under one cumulative order; error breakdowns and cases suggest mechanisms; the deployment section is an author description of use. Combining them into “TRACE has proven that archive agents are reliable, cheap, and adopted by researchers” would collapse different evidence strengths and denominators.

## Boundaries and when not to generalize

First, the corpus covers one year of French Third Republic parliamentary debate and two Paris newspapers. OCR errors, source types, event relationships, and preservation of named entities are specific to this material. Other languages, centuries, manuscripts, metadata schemas, journals, or layouts may require different indexes and planner prompts. The authors also state that step and sub-question budgets, memory size, and date expansion were fixed during development on this corpus, and their best values may change with another collection (§6).

Second, a planner decomposition error can be consequential. The authors report that about 98% of multi-hop questions receive two or more sub-questions, but 18 questions collapse to one; 13 of those fail, a 72% failure rate against a 20% base rate. Even if this case is uncommon, once a query collapses into one sub-question, replanning may have no chance to create the missing path. Deployments should inspect whether sub-questions cover the original query and whether each target corpus is available, instead of judging only the final ranked list (§6).

Third, retrieval ranking is not historical verification. Two sub-questions can accept the same source because their search views overlap; this does not establish truth or independent corroboration. Two archives may reproduce the same underlying source. OCR correction, document provenance, edition, contextual completeness, and historian judgment remain separate tasks. A citeable research result also needs to connect retrieved IDs to stable collection identifiers, scans, pages, and rights information.

Fourth, the paper does not measure downstream value from “accountability.” It proposes a traceable path for each returned document, but evaluates retrieval effectiveness. Whether experts confirm sources faster, catch more agent errors, trust explanations more, or face a heavier reading burden remains open pending the planned user study. The system can provide inspectable leads; the paper does not demonstrate increased expert trust or reduced verification work (§6).

Fifth, baseline interfaces still differ. The authors adapted prompts and extraction tools for French, and shared corpus conversion and model settings where applicable. Yet A-RAG and MA-RAG had discovery order turned into a ranked list while TRACE supplied its own ranking. This signals that a shared metric does not eliminate output-form differences. Read the system’s native interface and adaptation protocol alongside the aggregate ranking (§4.2, §5.2).

## Artifacts and reproducibility: public code and corpus, but no exact evaluation snapshot

As of 7 October 2026, the [TRACE GitHub repository](https://github.com/Kepler1908/TRACE) is public and marked MIT. Its main HEAD is `295d99c`, dated 24 May 2026, before the 17 September arXiv v1. The repository contains planner, agent, retrieval, and metrics code, but the README asks users to provide corpus and question JSONL files using fields such as `doc_id` and `text_original`. The visible main tree does not include the benchmark input files or a pinned provider/model/prompt configuration for the paper’s experiments.

The [public HistoriQA-ThirdRepublic repository](https://github.com/atomegoyan/historiqa-thirdrepublic) provides corpus and question JSONL and states a CC BY 4.0 license in its README. However, its current README lists 1,782 questions (897 single-hop, 541 generic, 152 bridge-entity, and 192 comparative), while TRACE v1 reports 1,752 (889, 529, 142, and 192). The current TRACE README expects fields such as `doc_id` and `text_original`; the dataset repository currently shows fields such as `collection`, `id`, and `document`, so conversion is needed. The paper says conversion and adaptation scripts are released with the system, but the current public main does not expose the dedicated data-conversion script described in the paper. The core workflow is inspectable; that does not establish a frozen data slice and configuration identical to the reported tables.

No full benchmark rerun is available for this reading. All scores, the approximately $0.02 cost estimate, and the claim of 24 researchers across six institutions are author-reported, not independent rerun results or a live deployment check. Public code and data lower the inspection barrier, but exact reproduction still requires resolving the question-count difference, obtaining the same 1,752-question slice, confirming conversion, pinning prompts and model versions, and rerunning with the reported metrics.

## Bloss0m engineering judgment: include the retrieval trace in acceptance criteria

The following is **Bloss0m engineering synthesis**, not a deployment specification validated by the authors. For archive search, decide what every returned result must let a reviewer answer: which original question and sub-question triggered it, which retrieval channel was used, which source document and page matched, what OCR/index version was active, why the agent accepted or held it, and who reviewed it later. This extends TRACE’s trace path into the actual collection instead of stopping at an LLM-authored rationale.

Second, evaluate recall, ranking, and decision quality together. For multi-gold questions, retain the gold document set per item, report R@k and multi-gold MRR by question type, and inspect accepted-set precision and recall. For comparative and bridge questions, verify that both sides of the source chain were returned. Alongside averages, preserve miss categories: never searched, surfaced then rejected, held but not promoted, or accepted but ranked below top-k. Those distinctions can guide whether to improve the index, planner, review prompt, or reranker.

Third, make planner coverage, source version, and data conversion part of the fixed benchmark. Check that the sub-questions jointly cover the original query, each targets an available corpus, and important names are not translated or normalized into a mismatch. Version the corpus schema, source IDs, chunking, OCR, embedding model, and prompts before deployment. When the dataset changes, recompute denominators and subgroup results rather than continuing to quote the paper’s score.

Fourth, expose a limit and human handling path for the hold pool. Too many held chunks move noise downstream; premature rejection can discard passages that become relevant after later context. Use human-labeled boundary cases to adjust the candidate count, reevaluation conditions, and pool size, and record which chunks were promoted or discarded. The paper’s +0.5 percentage-point aggregate increment comes from one cumulative ablation and does not determine the right hold policy for another archive.

Finally, if the product needs to answer research questions, place claim-to-source mapping and human or rule-based checking after TRACE-style discovery. Attach a source document, page, context passage, and evidence status to every statement. Preserve uncertainty when sources conflict, OCR confidence is low, or only one source is available. This is a system design recommendation derived from the retrieval idea, not an answer-quality feature tested by the paper.

For another approach to long-document evidence, see [DocMemo’s memory-guided retrieval](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/), which studies state carried between rounds to recover evidence from document pages. [Causal failure attribution in agentic RAG](/en/paper-reading/57-agentic-rag-causal-failure-attribution/) offers a different lens for locating retrieval and generation failures. Their tasks and data differ; they do not fill TRACE’s missing benchmark or user-study evidence.

## Three things to remember

1. **Make retrieval the object of study:** TRACE measures whether source documents are found and ranked. Traceable search leads help inspection, but do not prove answer claims from historical evidence.
2. **Decomposition and fusion provide the largest increments; hold preserves uncertain leads:** Table 3 reports increments along a cumulative order, not independent causal estimates for each component.
3. **Separate versions and deployment statements:** The paper reports 1,752 questions while the public dataset README lists 1,782. The 24-researcher, six-institution usage and per-question cost are author-reported internal-use and benchmark estimates, distinct from the independently visible code and data repositories.

## Primary sources

- Bian, Donghan, Marie Puren, and Florian Cafiero. [TRACE: Accountable Agentic Retrieval for Source Discovery in Digital Archives](https://arxiv.org/abs/2609.19897), arXiv:2609.19897v1, 17 September 2026. Main anchors: Figure 1, Tables 1–3, §§3–6.
- [TRACE source repository](https://github.com/Kepler1908/TRACE), MIT license; public retrieval pipeline code.
- [HistoriQA-ThirdRepublic dataset repository](https://github.com/atomegoyan/historiqa-thirdrepublic), CC BY 4.0 as stated in its README; current public dataset README reports 1,782 questions.
- Pellet, Aurélien, Julien Perez, and Marie Puren. [HistoriQA-ThirdRepublic: Multi-Hop Question Answering Corpus for Historical Research](https://arxiv.org/abs/2606.31325), 2026.
