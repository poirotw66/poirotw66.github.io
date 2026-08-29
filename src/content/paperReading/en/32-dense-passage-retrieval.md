---
title: "DPR: Turn Open-Domain QA into Dense Passage Retrieval, but Do Not Treat the Dual Encoder as Production RAG"
description: "A source-grounded reading of Karpukhin et al., EMNLP 2020: a BERT dual encoder trained with question–passage pairs and in-batch negatives replaces BM25 over Wikipedia passages via MIPS. On NQ, top-20 retrieval is 78.4% vs BM25 59.1%; end-to-end Exact Match is 41.5. This is the retriever RAG uses, not a generation platform."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "DPR changes the first stage of open-domain QA: a learnable dense dual encoder (question encoder + passage encoder) replaces sparse BM25 / TF-IDF and retrieves Wikipedia passages with MIPS."
  - "Training uses gold question–passage pairs and in-batch negatives (plus BM25 hard negatives). On NQ test, top-20 retrieval is 78.4% vs BM25 59.1%; with an extractive reader, Exact Match is 41.5 (Tables 2 and 4)."
  - "This is a 2020 Wikipedia dense retriever plus an extractive reader—not a production hybrid stack, a citation product, or Lewis RAG’s generative marginalization. Later methods such as BM25-at-scale, FinRank, and RAG-Anything address different questions; their numbers do not belong in this paper."
audience:
  - "AI engineers who need to pull “the retriever RAG uses” out of later production RAG platforms and keep the dense dual-encoder contract distinct."
  - "Technical leads who must treat Wikipedia passages, dual encoders without late interaction, and extractive answers as adoption boundaries."
tags: ["Paper Reading", "RAG", "Retrieval", "Information Retrieval"]
image: "/paperReading/32-dense-passage-retrieval/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
paper:
  title: "Dense Passage Retrieval for Open-Domain Question Answering"
  authors:
    - "Vladimir Karpukhin"
    - "Barlas Oğuz"
    - "Sewon Min"
    - "Patrick Lewis"
    - "Ledell Wu"
    - "Sergey Edunov"
    - "Danqi Chen"
    - "Wen-tau Yih"
  year: 2020
  venue: "EMNLP 2020（arXiv 2004.04906 v3）"
  links:
    pdf: "https://arxiv.org/pdf/2004.04906v3"
    arxiv: "https://arxiv.org/abs/2004.04906"
    doi: "https://doi.org/10.18653/v1/2020.emnlp-main.550"
    code: "https://github.com/facebookresearch/DPR"
    project: "https://huggingface.co/facebook/dpr-ctx_encoder-single-nq-base"
series:
  id: "dense-passage-retrieval"
  title: "DPR deep reading"
  part: 1
  totalParts: 1
---

For the reading method itself, pair this with the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). This is the foundational retriever used by [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/), not a generation paper or an agent loop. For the expensive joint-pretraining contrast, see [REALM](/en/paper-reading/34-realm-retrieval-augmented-pretraining/); for the full relationship among these methods, see the [RAG foundations reading map](/en/blog/92-rag-method-foundation-reading-map/).

## The paper in 90 seconds

- **Problem:** Open-domain QA depends on efficient passage retrieval; in practice the first stage is almost always sparse TF-IDF or BM25. Sparse matching struggles with synonyms and paraphrases, and it cannot learn a task-specific space from question–passage pairs.
- **Core insight:** Replace that first stage with two independent BERT-base encoders: a passage encoder embeds Wikipedia passages offline into 768-d vectors and builds a FAISS index; a question encoder embeds the query online and retrieves with maximum inner product search (MIPS). Training uses gold positives plus in-batch negatives (and BM25 hard negatives), without ORQA/REALM-style expensive extra pretraining or periodic index rebuilds.
- **Strongest evidence:** Table 2 top-20 / top-100 retrieval accuracy—on NQ, Single DPR reaches 78.4% / 85.4% versus BM25 59.1% / 73.7% (about +19.3 points at top-20); the abstract states a 9%–19% absolute gain. Table 4 end-to-end Exact Match: DPR 41.5 on NQ, above ORQA 33.3 and REALMNews 40.4. Figure 1: DPR trained on only 1,000 examples already beats BM25.
- **Main boundary:** Memory is the 20 Dec 2018 English Wikipedia dump split into about 21.015 million 100-word passages; evaluation is English open-domain / extractive QA; similarity is dual-encoder dot product without late interaction; this is not a production hybrid, not citation faithfulness, and not agentic search / read / final.

My conclusion: **DPR's most useful contribution is replacing sparse first-stage retrieval with a learnable dense dual encoder. It does not define a production RAG platform or generative answers, and it should not be compared directly with later embedding leaderboards.**

> **Huahua's one-liner**
>
> BM25 finds passages by token overlap; DPR drops questions and passages into one vector space with two BERTs and runs MIPS. The reader still extracts a span. The world did not become BART, and it did not become a browser.

## Version and reading scope

This note reads [Karpukhin et al., EMNLP 2020](https://aclanthology.org/2020.emnlp-main.550/) via [arXiv:2004.04906 v3](https://arxiv.org/abs/2004.04906), first posted on 2020-04-10 and last revised on 2020-09-30. The PDF and [arXiv HTML](https://arxiv.org/html/2004.04906v3) carry the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/); the ACL Anthology camera-ready is additionally under ACL terms.

Author order follows the v3 PDF / HTML and Anthology: Vladimir Karpukhin, Barlas Oğuz, Sewon Min, Patrick Lewis, Ledell Wu, Sergey Edunov, Danqi Chen, and Wen-tau Yih. Karpukhin and Oğuz are joint first authors; Min is at the University of Washington, Chen at Princeton, and the remaining authors at Facebook AI.

Beyond the abstract, this note checks Sections 2–6, Tables 1–4, Figure 1, Appendices A–D (including Tables 5–7), and artifacts as of **2026-08-27**. Lewis et al.’s RAG (site note 31) attaches a dense retriever of this family to BART generation; this note does not include RAG-Sequence / RAG-Token Exact Match numbers in DPR’s tables.

ColBERT late interaction, E5 / GTE, 2025–26 embedding leaderboards, and results from [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/), [FinRank](/en/paper-reading/18-finrank-evidence-grounded-rag/), and [RAG-Anything](/en/paper-reading/03-rag-anything/) are also outside this paper's evidence.

This is a published EMNLP paper, not a preprint.

## The question a reader should actually answer

When open-domain QA’s first stage is still BM25, should engineering keep keyword inverted indexes, or learn MIPS-ready dense encoders from question–passage pairs? Karpukhin et al. answer: two independent BERTs, dot-product similarity, in-batch negatives—raise top-$k$ retrieval first, then hand passages to an extractive reader.

A more precise reading is not “whether dense embeddings always beat BM25.” The real question is: **Where does swapping the sparse first stage for a dual-encoder dense retriever move top-$k$ and Exact Match, and where does the claim stop because of high lexical overlap (SQuAD), no late interaction, or a Wikipedia-only corpus?**

## Evidence map

| Layer | How this note uses it |
| --- | --- |
| **Paper directly supports** | Table 2 reports top-20 / top-100 retrieval accuracy on five datasets (BM25, Single/Multi DPR, BM25+DPR); Figure 1 shows training-size effects on NQ dev top-$k$; Table 3 ablates negatives / in-batch / BM25 hard negatives; Table 4 reports end-to-end Exact Match; Appendix Tables 5–6 cover distant supervision and similarity/loss; Table 7 gives BM25 vs DPR qualitative examples; efficiency: 995.0 qps (DPR/FAISS top-100) vs 23.7 qps per CPU thread (BM25). |
| **Author claims** | Dense representations alone can be practical; strong open-domain QA is possible without ICT-style extra pretraining or complex joint training; the dual-encoder training recipe (especially in-batch + hard negatives) is the decisive ingredient. |
| **Not established** | Dense retrieval on private corpora; a production hybrid of BM25 + dense + reranker + ACL; late interaction (ColBERT appears only as related work); generative answers or citation faithfulness; agentic multi-step search / read / final; 2025–26 embedding leaderboards. |
| **Bloss0m engineering judgment** | This paper concerns dense first-stage retrieval; then read [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/) for generation conditioned on retrieved $z$. For lexical overlap at scale see [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/), for evidence grounding [FinRank](/en/paper-reading/18-finrank-evidence-grounded-rag/), and for multimodal source documents [RAG-Anything](/en/paper-reading/03-rag-anything/). Their problem settings and evidence are not interchangeable. |

Later sections keep numbers, author claims, and engineering judgment separate. “SOTA” means the row inside the paper’s tables at publication time, not a 2026 leaderboard.

## Why the previous approach is insufficient

Section 1 draws two 2020-era lines.

**Sparse retrieval as the first stage:** After open-domain QA simplified to retriever → reader, the first stage was almost always TF-IDF or BM25. Inverted indexes are fast and token-overlap is interpretable; synonyms, paraphrases, and low-overlap questions still miss—e.g., “Who is the bad guy in lord of the rings?” versus “Sala Baker … portraying the villain Sauron …,” which share almost no tokens.

**Differentiable / pretrained dense retrieval that is still heavy:** ORQA uses ICT pretraining and joint training; REALM asynchronously updates the passage encoder and rebuilds the index. The paper grants that these lines showed dense retrieval can beat BM25, but they are computationally expensive, and it is unclear whether ordinary sentences are good question surrogates; a passage encoder not fine-tuned on QA pairs may also be suboptimal.

So the gap is not “nobody thought of dense retrieval.” The **control point was stuck**: either the first stage stayed sparse, or the dense path was tied to expensive pretraining / joint indexing. DPR changes that by learning a decomposable dual encoder directly from available QA question–passage pairs.

## Core intuition

Ignore the tables for a moment. Picture two ways to search a library. BM25 is card-catalog keyword matching: shared tokens raise the score. DPR embeds every passage as a coordinate offline, embeds the question the same way, and returns nearest neighbors with MIPS. The encoders are two independent BERTs—not a single cross-encoder over question and passage—because cross-attention cannot pre-index all of Wikipedia.

Contrast three next steps that are easy to conflate:

- **BM25 / Lucene:** The next step is sparse ranking; updating the world means changing the inverted index, not retraining a network.
- **DPR (this paper):** The next step is still passage retrieval, but the score is $\mathrm{sim}(q,p)=E_Q(q)^{\top}E_P(p)$; a reader then extracts a span. There is no generative marginalization of $y$ over $z$.
- **Lewis RAG (note 31):** Attaches a dense retriever of this family to BART and changes the **generation** control point. Do not write RAG’s NQ 44.5 into this paper’s Table 4.

> **Huahua's engineering note**
>
> Do not read “the model has a dense index” as “the system is already production RAG.” This paper does not define reranker inputs, outputs, or evaluation, and it has no ACL or private-corpus governance; the answer remains an extractive span.

## Walk one example through the method

The following walk-through uses the Appendix C / Table 7 qualitative example. It is not an independent experimental result. Question: `What is the body of water between England and Ireland?`

1. **Input:** Only that English question. No Bing, no MCP, no private PDF. The corpus is pre-split Wikipedia passages (title + `[SEP]` + 100-word block).
2. **Intermediate representation:** The passage encoder $E_P$ has already embedded about 21.015 million passages into 768-d vectors and written a FAISS HNSW index. The question encoder $E_Q$ embeds the query as $v_q$. Similarity is the dot product.
3. **Model or system decision:** MIPS returns top-$k$ (main retrieval results use 20 / 100; reader training samples 24 passages from the top 100). BM25’s top hit may be “British Cycling”—selective tokens like England / Ireland appear often, but the content is irrelevant. DPR returns “Irish Sea”—the paper’s reading is that “body of water” lands near sea / channel even with almost no lexical overlap.
4. **Output:** An extractive reader (another BERT) predicts span start/end and a passage-selection score over retrieved passages; the final answer is the highest-scoring span (e.g., an Irish Sea string). The headline metric is Exact Match, not a generated sentence.
5. **Likely failure point:** If the key is a rare proper name (Table 7’s second example, “Thoros of Myr”), BM25 can be stabler because a dual encoder has limited capacity for highly selective phrases. If questions come from SQuAD-style “write the question after seeing the paragraph” high-overlap settings, Table 2 shows BM25 top-20 (68.8%) above Single DPR (63.2%). If the index is still 2018 Wikipedia, 2026 facts do not appear by magic.

The Irish Sea item teaches **how the mechanism runs**. For systematic top-$k$ gaps, return to Table 2; for the negatives recipe, Table 3; for end-to-end EM, Table 4.

## Technical mechanism

The system has two pieces: a dense retriever and a pluggable extractive reader.

Retriever similarity (Eq. 1) is a decomposable dot product:

$$
\mathrm{sim}(q, p) = E_Q(q)^{\top} E_P(p),\quad E_Q, E_P:\ \text{BERT-base uncased},\ [CLS]\in\mathbb{R}^{768}.
$$

Larger $\mathrm{sim}$ makes a passage more likely to enter top-$k$. Decomposability is required so every $E_P(p)$ can be computed offline; even a strong cross-encoder cannot scan 21 million passages at query time. At inference, $E_P$ and the FAISS index stay fixed; online work is $E_Q$ plus MIPS.

Training casts metric learning as negative log-likelihood of the positive (Eq. 2):

$$
L(q_i, p_i^{+}, p_{i,1}^{-},\ldots,p_{i,n}^{-})
= -\log\frac{e^{\mathrm{sim}(q_i,p_i^{+})}}{e^{\mathrm{sim}(q_i,p_i^{+})}+\sum_{j=1}^{n}e^{\mathrm{sim}(q_i,p_{i,j}^{-})}}.
$$

Raising positive similarity and lowering negative similarity pulls related pairs together and pushes unrelated pairs apart. Negatives come in three types: Random, BM25 (high token overlap but no answer string), and Gold (positives from other questions in the batch). **In-batch negatives:** with $B$ questions and $B$ positive passages, form a $B\times B$ similarity matrix so each question treats the other $B-1$ passages as negatives—$B^2$ pairings per batch. The main setup adds one BM25 hard negative; batch size is 128.

The reader (Section 6) uses BERT for span start/end and passage selection; training samples 1 positive and 23 negatives ($\tilde{m}=24$) from the retriever’s top 100. This is extractive, not seq2seq generation.

Operating constraints:

- **Memory:** 20 Dec 2018 English Wikipedia; after DrQA cleaning, disjoint 100-word blocks yield 21,015,324 passages with titles prepended.
- **Index:** FAISS HNSW (CPU; 512 neighbors; construction depth 200; search depth 128). Encoding 21M vectors takes about 8.8 hours on 8 GPUs; building FAISS about 8.5 hours; a Lucene inverted index about 30 minutes. Query: DPR 995.0 questions/sec (top-100); BM25 23.7/sec per thread.
- **Training:** Adam at $10^{-5}$; up to 40 epochs on large datasets and 100 on small ones; dropout 0.1. The Multi setting pools training data from all datasets except SQuAD.
- **Hybrid ablation:** BM25+DPR unions each side’s top-2000 and reranks with $\mathrm{BM25}+\lambda\cdot\mathrm{sim}$ ($\lambda=1.1$)—a linear fusion inside the paper, not a production hybrid playbook.

![DPR paper Figure 1: on the NQ development set, dense-retriever top-k accuracy for different training sizes versus BM25; 1,000 examples already beat BM25.](/paperReading/32-dense-passage-retrieval/paper/figure-1-sample-efficiency.webp)

*Original Figure 1, paper Sections 5.1 / 5.2 Sample efficiency: x-axis is retrieved count $k$, y-axis is top-$k$ accuracy; curves are DPR trained on 1k / 10k / … / 59k examples versus BM25. Locatable at [Figure 1](https://arxiv.org/html/2004.04906v3#S5.F1); SVG endpoint [ir_training_examples_fig.svg](https://arxiv.org/html/2004.04906v3/ir_training_examples_fig.svg). From arXiv v3 HTML / paper source figures; page marks the arXiv.org perpetual non-exclusive license; the EMNLP 2020 camera-ready is additionally under ACL terms. Cited here for teaching under [arXiv reuse terms](https://info.arxiv.org/help/license/index.html).*

## How to read the evidence

Retrieval accuracy and end-to-end Exact Match are different questions. The first asks whether any top-$k$ passage contains the answer string; the second also requires the reader to extract the right span. The corpus is always the same Wikipedia passage collection. Under the open-domain setup, SQuAD is a stress test for high lexical overlap and article-subset bias—not DPR’s home turf.

### Table 2: Win top-20 / 100 retrieval, not generative EM

This table asks: on the same Wikipedia passages, how do BM25, DPR, and linear fusion compare on top-20 / top-100 answer hit rate? Held fixed: the 2018 Wikipedia split and the established train/dev/test cuts. Changed: the retriever and whether training is multi-dataset.

| Training | Retriever | NQ@20 | TriviaQA@20 | WQ@20 | TREC@20 | SQuAD@20 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| None | BM25 | 59.1 | 66.9 | 55.0 | 70.9 | **68.8** |
| Single | DPR | 78.4 | 79.4 | 73.2 | 79.8 | 63.2 |
| Single | BM25+DPR | 76.6 | 79.8 | 71.0 | 85.2 | 71.5 |
| Multi | DPR | **79.4** | 78.8 | **75.0** | **89.1** | 51.6 |
| Multi | BM25+DPR | 78.0 | **79.9** | 74.7 | 88.5 | 66.2 |

Top-100 (same table): on NQ, BM25 73.7, Single DPR 85.4, Multi DPR **86.0**. Observation: except on SQuAD, DPR beats BM25 throughout; the Single NQ top-20 gap is 78.4−59.1＝19.3 points, matching the abstract’s “9%–19% absolute.” Multi helps the small TREC set most (70.9→89.1@20); TriviaQA Multi is slightly below Single. On SQuAD, BM25 stays strong—the authors cite high lexical overlap from writing questions after seeing the passage, plus bias from only 500+ articles.

This table **supports** “a dense dual encoder can replace the sparse first stage on open-domain Wikipedia QA.” It **does not** support “dense always beats BM25,” and it **does not** turn the hybrid row into a shipped production stack.

![DPR paper Table 2: Top-20 and Top-100 retrieval accuracy for BM25 / DPR / BM25+DPR on five QA datasets.](/paperReading/32-dense-passage-retrieval/paper/table-2-retrieval.webp)

*Original Table 2, paper Section 5.1 Main Results: Top-20 / Top-100 retrieval accuracy (whether a retrieved passage contains the answer string). Locatable in the [arXiv HTML body](https://arxiv.org/html/2004.04906v3); cropped from the [v3 PDF](https://arxiv.org/pdf/2004.04906v3). License as for Figure 1 (arXiv perpetual non-exclusive; EMNLP camera-ready under ACL terms).*

### Table 3 / Figure 1: In-batch and hard negatives are the recipe, not a fancier similarity

The ablation asks: how should negatives be chosen? Is in-batch required? Do BM25 hard negatives help? How many labeled pairs are enough?

Table 3 (NQ dev): under standard 1-of-N with 7 negatives, Random / BM25 / Gold top-20 scores sit around 63–64%. In-batch Gold reaches 69.1 top-20 (#N=7) and 73.0 (#N=127). Adding one BM25 hard negative (G.+BM25(1), 127+128) reaches **78.0** top-20 and **84.9** top-100. Two BM25 negatives are not better. The main text also reports that L2 matches dot product and both beat cosine; triplet loss brings no clear gain over NLL (details in Appendix Table 6).

Figure 1: DPR with 1,000 training examples already beats BM25; accuracy keeps rising from 1k to 59k. That **supports** “with a pretrained LM, a small number of question–passage pairs can beat BM25.” It **does not** support “no labeled pairs are needed.”

Cross-dataset: train on NQ only and evaluate on WQ / TREC without fine-tuning; top-20 / 100 remain far above BM25 but about 3–5 points below dataset-specific fine-tuning (paper prose).

### Table 4: End-to-end 41.5 is extractive DPR, not RAG generation

This table asks whether higher retrieval accuracy becomes higher Exact Match. Held fixed: the same reader plugged into different retrievers, plus published ORQA / REALM numbers for context.

| Training | Model | NQ | TriviaQA | WQ | TREC | SQuAD |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Single | ORQA | 33.3 | 45.0 | 36.4 | 30.1 | 20.2 |
| Single | REALMNews | 40.4 | — | 40.7 | 42.9 | — |
| Single | BM25 (this paper’s reader) | 32.6 | 52.4 | 29.9 | 24.9 | **38.1** |
| Single | DPR | **41.5** | 56.8 | 34.6 | 25.9 | 29.8 |
| Multi | DPR | **41.5** | 56.8 | **42.4** | 49.4 | 24.1 |
| Multi | BM25+DPR | 38.8 | **57.9** | 41.1 | **50.6** | 35.8 |

Observation: on NQ, DPR 41.5 exceeds ORQA 33.3 and REALMNews 40.4, and the authors stress that extra pretraining and joint training are unnecessary—the Appendix joint scheme scores only 39.8 EM on NQ dev, below the separately trained reader. Small WQ / TREC jump under Multi (WQ 34.6→42.4; TREC 25.9→49.4). On SQuAD, the BM25 reader stays higher. Hybrid wins TriviaQA / TREC under Multi, but pure DPR wins NQ—do not read “fusion sometimes helps” as “you must ship a hybrid platform.”

The reader can consume 100 passages in one batch on a single 32GB GPU at about 20ms latency; $k=50$ is best for NQ, and $k=10$ yields 40.8 vs 41.5 EM.

This table **supports** “stronger retrieval usually lifts extractive open-domain QA.” It **does not** support generative RAG Exact Match, and it **must not** import Lewis et al. Table 1’s RAG-Seq 44.5—that is another paper and another answer contract.

![DPR paper Table 4: end-to-end QA Exact Match, including ORQA / REALM and Single / Multi DPR.](/paperReading/32-dense-passage-retrieval/paper/table-4-end-to-end-qa.webp)

*Original Table 4, paper Section 6 End-to-end QA Results: Exact Match. Locatable in the [arXiv HTML](https://arxiv.org/html/2004.04906v3); cropped from the [v3 PDF](https://arxiv.org/pdf/2004.04906v3). License as for Figure 1. This table is extractive QA, not RAG-Sequence / Token generative EM.*

## Limitations and threats to validity

The paper concludes that dense retrieval can outperform and potentially replace the traditional sparse first stage, while leaving these boundaries:

1. **Wikipedia passages as memory.** 20 Dec 2018 dump; 21,015,324 100-word blocks. Private corpora, permissions, multilingual text, and tables/lists (removed in preprocessing) are out of scope.
2. **Dual encoder, no late interaction.** Related work mentions ColBERT; the evidence here is dot-product dual encoding. Do not write late-interaction scores back.
3. **SQuAD / high-overlap counterexample.** Tables 2 and 4 both show BM25 remaining strong in that setting. Dense is not a universal replacement.
4. **Extractive answer contract.** The span must appear in a passage; this is not a citation product and not [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/) generative marginalization.
5. **Not an agent loop.** No thought channel, no browser actions, no read-before-final procedural gate.
6. **Qualitative failure modes.** Table 7: DPR is strong on semantics and weaker on highly selective proper names; BM25 is the reverse.
7. **Index cost.** Queries are fast (995 qps), but building a dense index is far costlier than Lucene (hours vs about 30 minutes).
8. **Do not back-port later papers.** RAG generative EM, BM25-at-scale crossover points, FinRank, RAG-Anything, and E5 / GTE leaderboards do not belong in these tables.

## Engineering decision and when not to use it

When is this paper worth borrowing? When the task is English open-domain / knowledge-base QA, you **will** maintain an offline-encodable passage index, and you accept a dual-encoder MIPS first stage with answers that may still be extractive spans. Log retrieved passages, the reader’s chosen span, top-$k$ hit rate, and end-to-end EM separately. The negatives recipe (in-batch plus a modest BM25 hard negative) matters more than swapping in a fancier similarity function.

When not to treat this paper as a construction drawing:

- If generation must condition on retrieved passages and answers may be abstractive sentences, read [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/). It extends the system by changing how answers are generated.
- If the corpus is large enough that lexical overlap becomes attractive, or entity-heavy questions dominate, read [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/). This paper’s SQuAD rows and qualitative examples already mark sparse territory.
- If answers must bind to auditable evidence, read [FinRank](/en/paper-reading/18-finrank-evidence-grounded-rag/).
- If documents are scans, tables, or formulas that must point back to source layout, read [RAG-Anything](/en/paper-reading/03-rag-anything/). This paper assumes clean text blocks.

> **Huahua's judgment**
>
> The 2020 DPR paper concerns moving first-stage retrieval from sparse matching to a learnable dense dual encoder. RAG later attaches generation; other methods separately change scale, evidence grounding, or parsing and are not an in-place upgrade of this BERT-plus-Wikipedia MIPS system.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** [arXiv abs](https://arxiv.org/abs/2004.04906), [v3 PDF](https://arxiv.org/pdf/2004.04906v3), and [HTML](https://arxiv.org/html/2004.04906v3) are readable under the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/). [ACL Anthology 2020.emnlp-main.550](https://aclanthology.org/2020.emnlp-main.550/) opens.
- **Code (usable):** [facebookresearch/DPR](https://github.com/facebookresearch/DPR) returns HTTP 200. The paper footnote points here.
- **Model cards (usable):** [facebook/dpr-question_encoder-single-nq-base](https://huggingface.co/facebook/dpr-question_encoder-single-nq-base) and [facebook/dpr-ctx_encoder-single-nq-base](https://huggingface.co/facebook/dpr-ctx_encoder-single-nq-base) return 200.
- **Index / data (usable):** [facebook/wiki_dpr](https://huggingface.co/datasets/facebook/wiki_dpr) opens. These are related public artifacts; full reproduction of Tables 2 / 4 still depends on the paper’s splits and training setup.
- **Training environment (author-stated):** Retriever and reader experiments use eight 32GB GPUs; FAISS queries can run on CPU HNSW. Encoding 21M passages takes about 8.8 hours on 8 GPUs; index construction about 8.5 hours. The main experiments are not “download one notebook and reproduce Table 4’s 41.5.”

A minimal useful reproduction: run the public DPR question / context encoders on a handful of Natural Questions items, confirm retrieved units are Wikipedia passages, and confirm scores come from dual-encoder dot products. Do not claim this reproduces Table 2’s 78.4 or Table 4’s 41.5.

## Three things to remember

1. **Technical idea:** DPR uses two BERT dual encoders and dot-product MIPS to replace BM25 as the first stage of open-domain QA; the training key is in-batch negatives plus BM25 hard negatives.
2. **Evidence:** NQ top-20 retrieval 78.4% vs BM25 59.1%; end-to-end Exact Match 41.5, above ORQA / REALMNews. 1,000 examples already beat BM25; on high-overlap SQuAD, BM25 can still win.
3. **Boundary:** This is a 2020 Wikipedia dense retriever plus an extractive reader. It is not a production RAG platform, generative RAG, or an agent loop. Read Lewis RAG for how generation attaches to retrieval; evaluate other later methods separately.

## Further reading

DPR asks whether the first retrieval stage should become a dense dual encoder. Continue according to the question:

- For generation conditioned on retrieved passages, read [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/).
- For lexical overlap at scale, read [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/).
- For evidence grounding, read [FinRank](/en/paper-reading/18-finrank-evidence-grounded-rag/).
- For multimodal source documents, read [RAG-Anything](/en/paper-reading/03-rag-anything/).

For the reading method, see the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/).

## Primary sources

- [Karpukhin et al., “Dense Passage Retrieval for Open-Domain Question Answering,” EMNLP 2020 / arXiv:2004.04906 v3](https://arxiv.org/abs/2004.04906)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2004.04906v3)
- [ACL Anthology page](https://aclanthology.org/2020.emnlp-main.550/)
- [facebookresearch/DPR](https://github.com/facebookresearch/DPR)
- [facebook/dpr-ctx_encoder-single-nq-base](https://huggingface.co/facebook/dpr-ctx_encoder-single-nq-base)
