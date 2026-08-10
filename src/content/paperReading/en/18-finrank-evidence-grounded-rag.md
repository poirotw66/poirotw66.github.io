---
title: "FinRank: Hard-Negative Retrieval Evaluation for Financial-Document RAG"
description: "A deep reading of FinRank: how company, year, and disclosure boundaries create deceptively plausible evidence, and why pooled retrieval, hard negatives, and metadata filters must be evaluated together."
pubDate: 2026-08-11
updatedDate: 2026-08-11
tldr:
  - "FinRank's contribution is not another embedding model. It makes financial retrieval errors more realistic: the wrong passage may come from a different company, filing year, or disclosure note while sharing the same vocabulary."
  - "On the paper's pooled corpus, e5-mistral-7b-instruct reaches 44.8 Recall@10 and BM25 reaches 32.1; metadata-filtered BM25 reaches 55.0 but can exclude the gold passage before ranking."
  - "The benchmark supports decisions about evidence recall and hard-negative discrimination. It does not evaluate answer generation, citation correctness, faithfulness, or production safety."
audience:
  - "AI and data engineers building enterprise search, financial RAG, or document question-answering systems"
  - "Technical leads who need to evaluate Recall, metadata policy, hard negatives, and split risk together"
tags: ["Paper Reading", "RAG", "Information Retrieval", "Enterprise AI", "Benchmark"]
image: "/paperReading/18-finrank-evidence-grounded-rag/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
paper:
  title: "FinRank: A Financial Document Retrieval Benchmark for Evaluating Embedding and Reranking Models"
  authors:
    - "Sasan Mansouri"
    - "Daniel Saad"
    - "Mark Wahrenburg"
    - "Manu Weissel"
    - "Fabian Woebbeking"
  year: 2026
  venue: "arXiv 2608.07400 v1 (2026-08-07; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.07400v1"
    arxiv: "https://arxiv.org/abs/2608.07400"
    code: "https://github.com/datanxt/FinRank"
series:
  id: "finrank"
  title: "Financial Retrieval Evaluation"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Financial-document QA fails for more than one reason. The same term can appear in different companies, filing years, and notes, while a metadata filter can remove the true supporting passage. FinRank asks whether a retriever can preserve the right evidence among these plausible but wrong alternatives.
- **Core insight:** The authors build 1,185 human-authored financial QA records, a 5,230-passage pooled corpus, and 6,021 curated hard negatives, then test generalization across multiple splits, query rewrites, and provenance boundaries.
- **Strongest evidence:** On the pooled corpus, the reported Recall@10 is 44.8 for e5-mistral-7b-instruct and 32.1 for BM25. Metadata-filtered BM25 reaches 55.0, but Section 7.1 notes that first-occurrence metadata can exclude the gold passage. In Section 7.3, curated hard negatives lower pairwise accuracy by 13.0–20.5 percentage points versus random negatives.
- **Main boundary:** The paper does not measure answer generation, citation correctness, or faithfulness. The data is concentrated in U.S. 10-K/10-Q filings from 2024–2025, with annotation and distribution caveats. This is a strong retrieval-evaluation starting point, not proof of safe financial RAG deployment.

## What to know first

The paper separates retrieval from generation. Each question has a supporting passage; the retriever ranks candidate passages. Recall@10 asks whether the gold passage appears in the top ten, not whether a model wrote the right answer. Pairwise accuracy asks whether the model ranks a supporting passage above a hard negative.

There are three useful data views:

1. **In-record candidates:** Candidates from the same filing record, closer to “find the answer inside the right document.”
2. **Pooled corpus:** Passages from different companies and records are mixed, testing cross-document candidate discovery and entity/year boundaries.
3. **Hard negatives:** Passages that are strongly related on the surface but are not the supporting evidence. They approximate production mistakes better than random negatives.

This connects to Bloss0m's [BM25 scaling deep read](/en/paper-reading/13-bm25-wins-at-scale) and [RubricRanker deep read](/en/paper-reading/17-rubric-ranker-deep-research): the former asks how access layers change with corpus scale; the latter asks how a rubric changes document ranking; FinRank makes “why is the wrong evidence hard?” a data and split question.

## Why the previous retrieval approach is insufficient

Random negatives or one small document collection can make a retriever look competent without testing near-miss evidence across companies, filing years, and notes. A single pooled score also mixes candidate recall, metadata exclusion, and hard-negative discrimination. FinRank addresses this evaluation gap; it does not claim to solve generation or safety evaluation.

## Core intuition

The ordinary similarity-retrieval rule is simple: the more similar a passage is to the query, the more likely it is to answer the question. FinRank pushes that rule toward its failure boundary:

- **Company boundary:** “operating segments” may appear in many 10-Ks, but a JNJ question is not answered by an LLY passage.
- **Time boundary:** Two years of the same company's financial numbers can both look plausible, while only one matches the question.
- **Disclosure boundary:** Notes, risk factors, and management discussion may share vocabulary; only one passage carries the requested evidence.
- **Query boundary:** 69% of the records include a query rewrite. Rewriting can clarify a conversational question, but it can also alter the entity, year, or field semantics.

The engineering decision rule is therefore not “dense always beats BM25.” First ask whether the candidate pool contains the right evidence; then ask whether the ranker places it near the top; only then ask whether a generator can use it faithfully. FinRank mainly covers the first two questions.

> **Huahua's engineering note**
>
> A hard negative is not an unrelated paragraph. It is an opponent that can make a finance-aware retriever fail. Without entity, year, document, and passage provenance, a good Recall@10 number may mostly reflect the dataset distribution.

## Walk one example through the method

Appendix E includes a sanitized JNJ example. The question asks about J&J's segments in FY2024. The supporting passage comes from JNJ's company overview, while the hard negative comes from LLY Note 19. The point is not to memorize the filing; it is to follow the decision path:

1. **Input:** Send the question, company intent, and year intent to the retriever. If a query rewrite is used, it must preserve JNJ and FY2024.
2. **Candidate pool:** The pooled corpus contains both the JNJ passage and the LLY passage. They may share “segments,” year, or business vocabulary.
3. **Ranking decision:** The model must use more than semantic similarity: entity, period, and disclosure provenance should influence ranking. If a metadata filter removes candidates using a first-occurrence rule, the correct JNJ passage may disappear before ranking.
4. **Output:** The supporting passage should appear in the top ten and, ideally, outrank the LLY hard negative. That is the two-layer distinction between Recall@10 and pairwise accuracy.
5. **Failure point:** A model that recognizes only “segments” may select LLY. A filter that trusts only early metadata may produce a cleaner but incorrect candidate set.

This is also why FinRank is not an answer benchmark. It can test which evidence was retrieved; it does not test whether a generator cites the right passage, preserves numbers, resolves conflicts, or abstains.

## Technical mechanism

FinRank's data and evaluation flow can be read as four steps:

1. **Question and passage construction:** The authors build 1,185 QA records from 2024–2025 10-K/10-Q filings across 22 U.S. companies in pharmaceuticals, oil/gas, and automotive. The release includes 6,021 curated hard negatives and a supporting passage for each record.
2. **Corpus pooling:** In-record candidates are retained, then 5,230 unique passages are pooled. This creates separate tests for searching within the right record and discovering evidence across companies and documents.
3. **Retriever comparison:** Section 6.1 compares TF-IDF, BM25, all-mpnet-base-v2, a cross-encoder, bge-large, a finance-adapted embedder, and e5-mistral-7b-instruct. The paper also fixes 512-token truncation so models do not see different input lengths.
4. **Splits and contrasts:** Five generalization splits, query-rewrite comparisons, metadata-filtered BM25, and hard-versus-random negative contrasts isolate distribution shift, filtering, and negative-example difficulty.

There is no need to mystify this as a new loss function. The value is decomposition: how the data is built, how candidates are mixed, whether negatives are genuinely difficult, and whether a metadata policy changes the task before ranking.

## How to read the evidence

### Pooled retrieval: what does Recall@10 answer?

**Question and control:** Section 3.6 pools passages from different records; the questions, supporting passages, and candidate construction make model comparisons more controlled. **Observation:** Section 7 / Figure 3 / Table 4 report 44.8 Recall@10 for e5-mistral-7b-instruct and 32.1 for BM25. **Interpretation:** Under this pool and truncation setting, the stronger semantic model brings more gold passages into the top ten. **Boundary:** This does not establish correct answers, and it does not establish the same gap under a different company mix, language, or chunking policy.

![FinRank Figure 3: executed retrieval baselines and hard-negative comparison](/paperReading/18-finrank-evidence-grounded-rag/figure-3-executed-baselines.png)

*Figure | Paper Figure 3 (Section 7): pooled retrieval Recall@k appears above, followed by pairwise accuracy against curated hard negatives versus random negatives. Source: [FinRank v1 Figure 3](https://arxiv.org/html/2608.07400v1#S7.F3); the paper identifies the work as [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).*

### Metadata filtering: when can a higher score be a risk signal?

**Question and control:** Section 7.1 compares ordinary BM25 with metadata-filtered BM25. **Observation:** The filtered version reports 55.0 Recall@10. **Interpretation:** If metadata removes many unlikely passages in advance, the ranker sees an easier problem. **Boundary:** The paper warns that a first-occurrence metadata rule can remove a gold passage. The 55.0 score is therefore not free accuracy; it must be paired with metadata coverage and a false-exclusion rate. This is the classic case of an offline score improving while the task boundary changes.

### Hard negatives: a production-like pressure test

**Question and control:** Section 7.3 / Table 5 compares curated hard negatives with random negatives. **Observation:** Hard-negative conditions reduce pairwise accuracy by 13.0–20.5 percentage points. **Interpretation:** A model may learn “keyword overlap means relevance” on ordinary data while still failing to handle entity, year, and disclosure provenance. **Boundary:** The gap is not a production failure rate; it shows that negative design materially changes task difficulty.

### Generalization and data quality

Appendix A, Sections 3.2–3.5 describe construction and annotation. The paper body and artifact summary differ slightly on the share of 10-K records, approximately 87% versus 88%; I preserve that as a version question rather than choosing a falsely precise number. About 75% of the data is from 2025, qualitative questions make up roughly three quarters, and the records are single-annotated without formal inter-annotator agreement. The release also reports 442 hard negatives, about 7.3%, that are byte-equal to another record's supporting passage. These details affect how to interpret leakage, independence, and difficulty.

## Evidence map

- **Paper directly supports:** The dataset scale, pooled corpus, baseline list, Recall@10, pairwise accuracy, five splits, and hard-negative comparison. The locatable anchors are Sections 3.6, 6.1, 7, 7.1, 7.3, and Appendix A.
- **Author interpretation:** Curated hard negatives expose financial-retrieval ranking weaknesses more effectively than random negatives; metadata-aware retrieval can improve recall but introduces exclusion risk.
- **Not established:** There are no answer-generation, citation-correctness, faithfulness, human-preference, online-latency, or financial-decision-risk results. These retrieval numbers cannot prove that a model is safest in production.
- **Bloss0m engineering judgment:** The durable takeaway is an evaluation contract. Every Recall report should preserve entity/year/document provenance, candidate-pool version, hard-negative taxonomy, and a filter false-exclusion audit. That is an engineering inference, not a paper result.

### Limitations and unsupported interpretations

These limitations are part of the conclusion, not footnotes. The FinRank preprint does not support the claim that one retriever is better on every financial corpus, that a metadata filter cannot lose an answer, or that retrieval scores establish generation faithfulness or financial-decision safety. The 10-K share, single-annotator quality, hard-negative byte equality, and missing formal IAA should all be rechecked before adoption.

## Artifacts and reproducibility

As of **2026-08-11**, the author's [FinRank repository](https://github.com/datanxt/FinRank) is directly reachable. It contains `FinRank.jsonl`, `baselines/`, split files, validation scripts, a repair log, a hard-negative taxonomy, and a summary. The README describes a CC BY-NC 4.0 dataset release and does not redistribute complete SEC filings. The repository is therefore useful for schema inspection, smoke-level validation, and understanding reported results; it is not an unconditional reproduction bundle containing every external source document.

A serious rerun should pin the repository commit, `FinRank.jsonl` version, five splits, model checkpoints, 512-token truncation, query-rewrite state, metadata rules, and the raw-filing acquisition path. If the SEC documents, model weights, or preprocessing are not identical, report a partial reproduction rather than “reproduced.”

## Engineering decision and when not to use it

**Use it when:**

- You are building financial, legal, or compliance RAG and need separate gates for candidate recall and answer correctness.
- Your corpus contains multiple companies, years, and document versions, and you need to test whether metadata policy deletes gold evidence.
- You want a retriever/reranker regression set based on hard negatives instead of random negatives.

**Do not apply it directly when:**

- You need to validate generated answers, numeric reasoning, citation boundaries, or abstention; FinRank does not report these.
- Your data is multilingual, live-market, or rich in tables and figures. The paper converts table and figure content to text and does not establish visual-evidence coverage.
- Your system depends on strict metadata filters without a false-exclusion audit. The filtered 55.0 result should trigger a risk review, not automatic adoption.
- You need production latency, API cost, or financial safety evidence. This v1 preprint does not provide a complete operational study.

A practical rollout is to adapt the FinRank schema to your document provenance, add a company/year/document-type hard-negative matrix, and then send top-k evidence into an answer-and-citation audit. Do not tune only on final-answer scores while ignoring candidate-pool coverage.

## Three things to remember

1. **Technical idea:** Financial retrieval is hard because similar language crosses the wrong company, year, and disclosure boundary.
2. **Evidence:** Pooled Recall@10 and the hard-negative drop show that candidate construction and negative design materially change ranking conclusions; a higher metadata-filter score needs an exclusion audit.
3. **Boundary:** FinRank is a retrieval benchmark, not a complete test of generation, faithfulness, latency, or financial safety. The artifact is inspectable, but full reproduction still depends on external documents and pinned versions.

## Primary sources

- [FinRank arXiv abstract and v1 metadata](https://arxiv.org/abs/2608.07400)
- [FinRank v1 HTML, Sections 3.6, 6.1, 7, and Appendix A](https://arxiv.org/html/2608.07400v1)
- [FinRank artifact repository](https://github.com/datanxt/FinRank)
- [BM25 Wins at Scale paper reading](/en/paper-reading/13-bm25-wins-at-scale)
- [RubricRanker paper reading](/en/paper-reading/17-rubric-ranker-deep-research)
