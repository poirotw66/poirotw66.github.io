---
title: "RAG: Attach Retrieval to Generation, but Do Not Treat 2020 RAG as a Production RAG Platform"
description: "A source-grounded reading of Lewis et al., NeurIPS 2020: BART is paired with a dense retriever over Wikipedia, and RAG-Sequence / RAG-Token condition generation on retrieved passages. RAG-Seq reaches 44.5 Exact Match on NQ; this is a 2020 method paper, not a 2025 production RAG platform and not an agent loop."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "RAG changes whether generation may condition on Wikipedia passages from a dense retriever rather than on parametric memory alone; the document encoder and index stay frozen, and the query encoder can be updated."
  - "RAG-Sequence shares one document across the whole output; RAG-Token may switch documents per token. On NQ test Exact Match, RAG-Seq is 44.5 and RAG-Token 44.1, above DPR extractive 41.5 and T5-11B+SSM 36.6 (Table 1)."
  - "This is seq2seq RAG over Wikipedia, not a production hybrid stack, a citation-faithfulness product, or a search / read / final agent loop. Later methods such as RAG-Anything, RAG-MCP, GraphRAG, DocMemo, and BM25-at-scale address different questions; their numbers do not belong in this paper."
audience:
  - "AI engineers who need to pull 2020 RAG out of later production RAG platforms and keep “retrieval conditions generation” as its own contract."
  - "Technical leads who must treat Wikipedia-as-memory, dense-only retrieval, and generated answers as adoption boundaries."
tags: ["Paper Reading", "RAG", "Retrieval", "Information Retrieval"]
image: "/paperReading/31-retrieval-augmented-generation/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
  - sequence-modeling-foundations
paper:
  title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"
  authors:
    - "Patrick Lewis"
    - "Ethan Perez"
    - "Aleksandra Piktus"
    - "Fabio Petroni"
    - "Vladimir Karpukhin"
    - "Naman Goyal"
    - "Heinrich Küttler"
    - "Mike Lewis"
    - "Wen-tau Yih"
    - "Tim Rocktäschel"
    - "Sebastian Riedel"
    - "Douwe Kiela"
  year: 2020
  venue: "NeurIPS 2020（arXiv 2005.11401 v4）"
  links:
    pdf: "https://arxiv.org/pdf/2005.11401v4"
    arxiv: "https://arxiv.org/abs/2005.11401"
    doi: "https://doi.org/10.48550/arXiv.2005.11401"
    code: "https://github.com/huggingface/transformers/tree/v4.21.3/examples/research_projects/rag"
    project: "https://huggingface.co/docs/transformers/model_doc/rag"
series:
  id: "retrieval-augmented-generation"
  title: "RAG deep reading"
  part: 1
  totalParts: 1
---

For the reading method itself, pair this with the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). This paper is a foundational retrieval-augmented generation method, not an agent loop. For the retriever it uses, see [DPR](/en/paper-reading/32-dense-passage-retrieval/); for the full relationship among these methods, see the [RAG foundations reading map](/en/blog/92-rag-method-foundation-reading-map/).

## The paper in 90 seconds

- **Problem:** Large pretrained models store facts in their parameters, yet still lag task-specific architectures on knowledge-intensive work; parametric memory is hard to update, hard to inspect, and prone to hallucination.
- **Core insight:** Pair a pretrained seq2seq generator (BART) with a pretrained dense retriever (initialized from DPR) over a Wikipedia index. The decision point moves from “answer from parameters only” to “retrieve passages, then condition generation.” RAG-Sequence shares one document across the sequence; RAG-Token may switch documents per token.
- **Strongest evidence:** Table 1 open-domain QA: on NQ, RAG-Seq 44.5 and RAG-Token 44.1 beat DPR 41.5, REALM 40.4, and T5-11B+SSM 36.6. Table 2 generation and classification: on Open MS-MARCO, RAG-Seq is +2.6 Bleu and +2.6 Rouge-L versus BART; on FEVER-3, 72.5 sits 4.3 points below the then pipeline SOTA of 76.8, with no intermediate retrieval supervision.
- **Main boundary:** The memory is the December 2018 Wikipedia dump split into 21M 100-word chunks, not a private corpus; retrieval is dense MIPS, not a production hybrid; there is no agentic search / read / final loop, and no 2026 enterprise sense of citation faithfulness.

My conclusion: **RAG's most useful contribution is attaching retrievable non-parametric memory to a generator. This paper does not define a complete production RAG platform, a tool router, or an agent required to read evidence before answering.**

> **Huahua in one sentence**
>
> Facts the parameters cannot hold or revise come from a Wikipedia index. The generator is still BART. The world has not become a browser, and it has not become MCP.

## Version and reading scope

This note reads [Lewis et al., NeurIPS 2020](https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html) against [arXiv:2005.11401 v4](https://arxiv.org/abs/2005.11401), first posted on 2020-05-22 and last revised on 2021-04-12. The PDF and [arXiv HTML](https://arxiv.org/html/2005.11401v4) are marked with the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/); the NeurIPS camera-ready is additionally under conference copyright.

Author order follows the v4 PDF: Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, Sebastian Riedel, and Douwe Kiela. Lewis and Perez lead the author list; Ethan Perez is marked NYU, while the others are affiliated with FAIR and UCL.

Beyond the abstract, the note checks Section 2’s RAG-Sequence / RAG-Token, Section 3’s task setup, Tables 1–6, Figures 1–3, Appendices A–I, and artifact endpoints as of **2026-08-27**.

DPR (Karpukhin et al.) appears here only as the retriever RAG uses. Unless the RAG paper reports them, DPR-only numbers are not included; neither are Self-RAG results, agentic RAG leaderboards, or other later methods.

This is a published NeurIPS paper, not a preprint.

## The question the reader actually needs

When a model must do knowledge-intensive generation, should engineering keep stuffing the world into parameters, or give it a replaceable non-parametric memory and let retrieved documents enter the generation condition? Lewis et al. answer: use pretrained BART as parametric memory, a DPR-initialized dense retriever over Wikipedia as non-parametric memory, and finetune end-to-end so $z$ is a latent variable for $y$.

The precise reading is not “is RAG today’s enterprise search product?” The real question is: **does attaching retrieval to generation move the score, on which tasks, and where does it fail because the memory is Wikipedia, the retriever is dense-only, or the answer need not be a citation?**

## Evidence map

| Layer | How this article uses it |
| --- | --- |
| **Paper directly supports** | Figure 1 wires retriever and generator end-to-end; Table 1 gives Exact Match on NQ / TriviaQA / WebQ / CuratedTrec; Table 2 covers Jeopardy, Open MS-MARCO, and FEVER; Table 4 is a 452-pair Jeopardy human comparison; Table 6 ablates BM25 and a frozen retriever; Figure 2 shows RAG-Token switching documents per token; Figure 3 shows test-time $k$; index hot-swap uses 82 world leaders. |
| **Author claims** | Hybrid parametric / non-parametric memory can do knowledge-intensive generation; strong results do not require salient-span pretraining; unconstrained generation can beat extractive readers; the index can be hot-swapped to update world knowledge. |
| **Not established** | RAG on a private corpus; a production BM25+dense hybrid; rerankers / ACL / permission filters; a citation-faithfulness product that binds answers to spans; an agentic search / read / final loop; Self-RAG or 2025–26 agentic RAG leaderboards. |
| **Bloss0m engineering judgment** | This paper defines how dense retrieval conditions generation. For multimodal documents see [RAG-Anything](/en/paper-reading/03-rag-anything/), for tool routing [RAG-MCP](/en/paper-reading/04-rag-mcp/), for graphs [GraphRAG vs RAG](/en/paper-reading/07-graphrag-vs-rag/), for lexical scaling [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/), for read-before-final [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/), for dynamic evidence [DocMemo](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/), and for evidence grounding [FinRank](/en/paper-reading/18-finrank-evidence-grounded-rag/). Their problem settings and evidence are not interchangeable. |

Later sections keep numbers, author claims, and engineering judgment apart. “SOTA” means the row in the paper’s tables at writing time, not a 2026 leaderboard.

## Why the previous approach is insufficient

Section 1 draws two 2020-era lines.

**Parametric memory only.** Pretrained language models can store facts in weights (the paper cites Petroni et al. and Roberts et al. on closed-book QA). The downsides are stated as design facts: the memory is hard to expand, hard to revise, hard to attribute, and can hallucinate.

**Differentiable retrieval that stops at extraction.** REALM and ORQA attach a masked LM to a differentiable retriever with promising results, but the downstream tasks remain open-domain **extractive** QA. The seq2seq workhorse of NLP had not yet been given non-parametric memory.

So the prior approach is insufficient not because “nobody thought of retrieval,” but because **the control point was split**: either generate from parameters alone and leave world updates to retraining, or retrieve only to support span extraction. RAG changes the generator’s condition: $y$ must be marginalized over latent documents $z$.

## Core intuition

Ignore the tables first. Closed-book is an exam with no notes: the whole of Wikipedia is compressed into BART’s weights. Open-book puts relevant passages on the desk before the answer is written. RAG is the second exam — and the passages arrive by dense nearest-neighbor search, not by browser clicks and not by few-shot prompting.

Contrast three next steps that later writing often collapses:

- **Closed-book seq2seq** (BART / T5): the next tokens are $y$, with no $z$ in the condition.
- **RAG (this paper):** the next tokens are still generated $y$, but $p(y|x)$ is marginalized over retrieved Wikipedia passages. There is no thought channel and no environment observation.
- **Later methods:** multimodal parsing, tool-schema retrieval, graphs, dynamic evidence, and read-before-final address different problems. Their scores do not belong in the 2020 tables.

> **Huahua's engineering note**
>
> Do not read “the model retrieved Wikipedia” as “the system already is production RAG.” This paper does not define reranker inputs, outputs, or evaluation, and it has no ACL, private-corpus governance, or requirement to read evidence before the final answer.

## Walk one example through the method

The walkthrough uses Figure 2’s Jeopardy teaching example for RAG-Token. It is not an independent experimental result. The input entity is Hemingway.

1. **Input:** only the answer entity `Hemingway`. No Bing, no MCP, no private PDF. There is no few-shot prompt; this is a finetuned seq2seq model.
2. **Intermediate representation:** the query encoder $\mathrm{BERT}_q$ maps the input to $\mathbf{q}(x)$ and runs MIPS over 21M 100-word Wikipedia chunks, returning top-$k$ (here $k=5$). Document 2 mentions *The Sun Also Rises*; Document 1 mentions *A Farewell to Arms*. The document encoder $\mathrm{BERT}_d$ and the index stay **fixed**.
3. **Model or system decision:** BART sees the concatenation of $x$ and some $z$. RAG-Token marginalizes over the $k$ documents at each token, so the posterior on Document 2 rises when generating “Sun,” and Document 1 rises for “A Farewell to Arms.” RAG-Sequence would keep one $z$ for the **entire** $y$, which makes it harder to join two books in one sentence.
4. **Output:** Figure 2’s posterior path corresponds to a Jeopardy clue that places both novels under one author. Table 3 gives a paper example: for input `The Divine Comedy`, RAG-S writes the three-part Inferno / Purgatorio / Paradiso split; BART writes Purgatorio twice.
5. **Likely failure point:** if the task does not need facts (story generation in Appendix H), the retriever can collapse, fetching the same documents regardless of input; the generator learns to ignore $z$ and the model becomes BART. If the index is stale, leader questions drop from about 70% to 12% / 4% (Section 4.5). An extractive system scores 0% when the answer string is in none of the retrieved documents; RAG is still 11.8% correct on those NQ cases — that is parametric memory filling a hole, not a citation guarantee.

The Hemingway item teaches **how the mechanism completes**. For open-domain QA scores, go to Table 1; for whether learned retrieval is load-bearing, go to Table 6.

## Technical mechanism

There are two blocks, matching Figure 1.

The retriever $p_{\eta}(z|x)$ is DPR’s bi-encoder:

$$
p_{\eta}(z|x)\propto\exp\bigl(\mathbf{d}(z)^{\top}\mathbf{q}(x)\bigr),\quad \mathbf{d}(z)=\mathrm{BERT}_{d}(z),\;\mathbf{q}(x)=\mathrm{BERT}_{q}(x).
$$

A larger inner product between $\mathbf{d}(z)$ and $\mathbf{q}(x)$ makes that passage more likely to enter the top-$k$. Raising $k$ lets more passages into the marginal; Figure 3 shows this helps RAG-Sequence on NQ monotonically, while RAG-Token peaks around 10 documents. Training uses $k\in\{5,10\}$.

The generator $p_{\theta}(y_i|x,z,y_{1:i-1})$ is BART-large (400M in the methods text; Appendix G counts 406M, plus two BERT-base 110M encoders, for 626M trainable parameters). The input is the concatenation of $x$ and $z$. Those $\theta$ are the parametric memory.

The two marginals change **how long one document is allowed to govern**:

**RAG-Sequence** assumes one $z$ generates the whole $y$:

$$
p_{\text{RAG-Sequence}}(y|x)\approx\sum_{z\in\text{top-}k}p_{\eta}(z|x)\prod_{i=1}^{N}p_{\theta}(y_{i}|x,z,y_{1:i-1}).
$$

Raising some $p_{\eta}(z|x)$ bets the entire answer on that one document. Decoding cannot be a single beam: run beam search per $z$ (Thorough Decoding also scores hypotheses that did not appear in that document’s beam); for long outputs, Fast Decoding approximates $p_{\theta}(y|x,z_i)\approx 0$ when $y$ was never generated from that $z_i$.

**RAG-Token** may draw a different document per token:

$$
p_{\text{RAG-Token}}(y|x)\approx\prod_{i=1}^{N}\sum_{z\in\text{top-}k}p_{\eta}(z|x)\,p_{\theta}(y_{i}|x,z,y_{1:i-1}).
$$

What increases here is the chance that the next word comes from another passage, and therefore the chance of sewing two evidence fragments into one sentence. For classification, the label is a length-one sequence, so the two RAG models coincide.

Training minimizes $-\log p(y|x)$ with Adam. The document encoder and index are not updated — the authors do not find REALM-style periodic re-indexing necessary. Only $\mathrm{BERT}_q$ and BART are finetuned. There is no direct supervision on which document should be retrieved.

Operating constraints:

- **Memory:** December 2018 Wikipedia, disjoint 100-word chunks, 21M documents; FAISS HNSW. Appendix G writes the index as 21M vectors of dimension 728, 15.3B values (the paper’s own arithmetic).
- **Decoding (Appendix A):** open-domain QA uses greedy search; RAG-Token is tested with 15 documents, RAG-Sequence with 50 and Thorough Decoding. MS-MARCO / Jeopardy use 10 documents, beam size 4, Fast Decoding.
- **Small datasets:** CuratedTrec and WebQuestions initialize from the NQ RAG checkpoint, following the DPR paper’s practice as **reported in this RAG PDF**.
- **Null document (Appendix F):** adding an empty-document mechanism did not help and is omitted from the main experiments.

![RAG paper Figure 1: a query enters the retriever, Wikipedia passages are returned, and BART generates after marginalizing over documents.](/paperReading/31-retrieval-augmented-generation/paper/figure-1-architecture.webp)

*Figure 1, paper Introduction / Section 2: the left side shows QA / fact verification / Jeopardy inputs $x$; the middle is the non-parametric retriever (Query Encoder + Document Index); the right is the parametric generator and the marginalized $y$. The original figure is at [Figure 1](https://arxiv.org/html/2005.11401v4#S1.F1); the SVG endpoint is [RAG-Architecture.svg](https://arxiv.org/html/2005.11401v4/2005.11401v4/RAG-Architecture.svg). Taken from the arXiv v4 HTML / matching asset. The page marks the arXiv.org perpetual non-exclusive license; the NeurIPS 2020 camera-ready is additionally under conference copyright. Used here under [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) with attribution.*

## How to read the evidence

Open-domain QA, abstractive generation, Jeopardy question generation, and FEVER classification do not test the same claim. QA scores short-answer Exact Match; MS-MARCO scores whether a reference sentence can be written **without gold passages**; Jeopardy scores factuality and specificity; FEVER scores label accuracy without evidence supervision. The index is the same Wikipedia dump throughout.

### Table 1: NQ 44.5 is generative RAG, not extractive DPR

This table asks: under the same knowledge-intensive QA setup, how does Exact Match move among closed-book generation, extractive open-book, and RAG generation? Held constant are the 2018 Wikipedia dump and the prior train / dev / test splits; what changes is whether retrieval happens, and whether retrieval is followed by span extraction or generation.

| Model | NQ | TQA (open-domain / Wiki) | WQ | CT |
| --- | ---: | ---: | ---: | ---: |
| T5-11B | 34.5 | — / 50.1 | 37.4 | — |
| T5-11B+SSM | 36.6 | — / 60.5 | 44.7 | — |
| REALM | 40.4 | — / — | 40.7 | 46.8 |
| DPR | 41.5 | **57.9** / — | 41.1 | 50.6 |
| RAG-Token | 44.1 | 55.2 / 66.1 | **45.5** | 50.0 |
| RAG-Seq. | **44.5** | 56.8 / **68.0** | 45.2 | **52.2** |

Observation: on NQ, RAG-Seq 44.5 beats DPR 41.5 and REALM 40.4 without salient-span masking. WebQ and CuratedTrec are also table-best under RAG. TriviaQA must be split: on the customary open-domain test (left), DPR 57.9 still beats RAG-Seq 56.8; the authors’ “SOTA on four tasks” for TriviaQA holds **only** on the T5-comparable Wiki test (right, 68.0). Appendix D explains the two splits; do not write 68.0 as the open-domain convention score.

The authors’ account of why generation can beat extraction: documents that lack a verbatim span can still contribute; when the answer is in none of the retrieved documents, RAG is still 11.8% correct on NQ and an extractive model would score 0%. That **supports** “generation can patch holes with parametric memory.” It **does not support** “every answer has a provenance span.”

The table **cannot** support a 2026 open-domain QA leaderboard, and it **cannot** be read as if DPR’s left-column 57.9 were absent. DPR is the retrieve-and-extract baseline in this table, not the paper this note is teaching.

### Table 2 / Table 4: generation is more specific than BART, but does not beat gold-context SOTA

Table 2 asks: without gold passages, how do RAG generation and classification compare with BART-only and then-current SOTA?

| Model | Jeopardy B-1 | QB-1 | MS-MARCO R-L | B-1 | FEVER-3 | FEVER-2 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| SotA | — | — | 49.8* | 49.9* | **76.8** | 92.2* |
| BART | 15.1 | 19.7 | 38.2 | 41.6 | 64.0 | 81.1 |
| RAG-Tok. | **17.3** | **22.2** | 40.1 | 41.5 | 72.5 | 89.5 |
| RAG-Seq. | 14.7 | 21.4 | **40.8** | **44.2** | 72.5 | 89.5 |

Starred rows use gold context / evidence. On Open MS-MARCO, RAG-Seq is +2.6 Rouge-L and +2.6 Bleu-1 versus BART (40.8−38.2, 44.2−41.6), still below gold-access 49.8* / 49.9*. The paper’s own example is “What is the weather in Volcano, CA?”: without gold passages the reference cannot be matched, and some items are unanswerable from Wikipedia at all.

On Jeopardy, RAG-Token’s Q-BLEU-1 of 22.2 beats RAG-Seq 21.4 and BART 19.7; RAG-Seq BLEU-1 of 14.7 is **below** BART 15.1. The authors tie Token’s edge to clues that contain two facts and can draw on two documents. Table 4 covers 452 BART vs RAG-Token pairs: on factuality, RAG better 42.7%, BART better 7.1%, Both good 11.7%, Both poor 17.7%, No majority 20.8%. The prose also says both were factual in a further 17%, which does not match Both good 11.7%; this note treats Table 4 as canonical and the 17% as author summary. The specificity column sums to 93.0%; the table does not explain the missing 7 points.

FEVER-3 72.5 is 4.3 points below Zhong et al. 76.8, and RAG uses **no** evidence-sentence supervision. FEVER-2 89.5 is 2.7 below a RoBERTa that sees the gold sentence (92.2*). Retrieved titles overlap gold articles in 71% of top-1 and 90% of top-10 cases. Appendix E states that FEVER’s second subtask (extracting evidence sentences) was not attempted because the Wikipedia dump differs.

This suite **supports** “on generation, RAG is more specific than same-size BART, and on FEVER it approaches supervised pipelines.” It **does not support** “already beating gold-context systems” or “citation faithfulness.”

### Table 6 / Figure 3: learned retrieval helps, but BM25 wins on FEVER

The ablation asks two questions: should the query encoder be learned? Does dense retrieval beat BM25 everywhere?

Dev Exact Match (Table 6): on NQ, RAG-Seq 44.0, frozen retriever 41.2, BM25 31.8. On WebQ, Token 46.5 vs frozen 37.1 vs BM25 32.1. Learned retrieval is load-bearing for QA. FEVER reverses the ranking: BM25 scores FVR-3 75.1 and FVR-2 91.6, above dense RAG 74.5 / 90.6. The authors attribute this to entity-centric claims that suit word overlap. That points in the same engineering direction as later [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/), but that paper’s 10-million-token crossover is **not** a number in this table.

Figure 3 left: retrieving more documents at test time improves NQ monotonically for RAG-Sequence, while RAG-Token peaks at 10. Center: learned RAG’s NQ answer recall sits above Fixed DPR and BM25. Right: more documents raise RAG-Token Rouge-L on MS-MARCO and lower Bleu-1. Appendix A’s test-time $k$ is chosen on dev, not as a production SLA.

Index hot-swap: 2016 vs 2018 dumps, 82 leaders who changed office, template “Who is \{position\}?”. Matched indices: 70% / 68%. Mismatched: 12% / 4%. That **supports** “replacing non-parametric memory can change answers.” It **does not support** a crawler or an ACL.

![RAG paper Figure 2: when generating a Hemingway Jeopardy clue, Document 2’s posterior rises at The Sun Also Rises and Document 1’s rises at A Farewell to Arms.](/paperReading/31-retrieval-augmented-generation/paper/figure-2-posterior.webp)

*Figure 2, paper Section 4.3: RAG-Token document posterior $p(z_i|x,y_i,y_{-i})$ at each generated token for $k=5$. The original figure is at [Figure 2](https://arxiv.org/html/2005.11401v4#S4.F2); the PNG endpoint is [posterior_plot.png](https://arxiv.org/html/2005.11401v4/2005.11401v4/posterior_plot.png). Taken from the arXiv v4 HTML / matching asset; license as for Figure 1.*

![RAG paper Figure 3: left, NQ Exact Match versus number of retrieved documents; center, NQ answer recall; right, MS-MARCO Bleu-1 / Rouge-L.](/paperReading/31-retrieval-augmented-generation/paper/figure-3-retrieval-k.webp)

*Figure 3, paper Section 4.5: three plots of test-time $k$. The original figure is at [Figure 3](https://arxiv.org/html/2005.11401v4#S4.F3); the SVG endpoint is [retrieval_plots_flat.svg](https://arxiv.org/html/2005.11401v4/2005.11401v4/retrieval_plots_flat.svg). Taken from the arXiv v4 HTML / matching asset; license as for Figure 1.*

## Limitations and threats to validity

The Broader Impact section already notes that Wikipedia is not unbiased and that the model could be used to generate misleading content. Reading the tables still requires these boundaries:

1. **Wikipedia as memory.** 21M 100-word chunks from a December 2018 dump. Private corpora, permissions, and freshness SLAs are not in the table. Hot-swap shows that swapping the index changes answers, not that a production freshness pipeline exists.
2. **Dense-only.** The main system is FAISS MIPS. BM25 appears only as an ablation, and it wins on FEVER. This paper is not a hybrid-stack blueprint.
3. **Not an agent loop.** No thought, browser actions, or “read before final” gate. [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/) and later agent methods address a different problem.
4. **Not a citation product.** The answer can be right while the documents are wrong; 11.8% of NQ successes occur when the answer string is missing from retrieved text. FEVER reports label accuracy; the evidence-sentence subtask was not run.
5. **TriviaQA SOTA is conditional.** The left column still has DPR ahead; 68.0 is the Wiki test.
6. **Human evaluation is messy.** Table 4 disagrees with the prose 17%; the specificity column does not sum to 100%.
7. **Keep later evidence separate.** Self-RAG, RAG-Anything, RAG-MCP, GraphRAG, DocMemo, FinRank, and 2025–26 agentic RAG leaderboards do not belong in these tables.
8. **Retrieval can collapse.** Appendix H: on story generation and similar tasks the retriever becomes independent of the input and the model equals BART.

## Engineering decision and when not to use it

When is this paper worth borrowing? When the task is knowledge-intensive generation or short-answer QA, you **will** maintain a replaceable document index, and you accept that answers are generated rather than guaranteed extractive spans. In that case, log retrieved $z$, generated $y$, and whether $y$ can actually be aligned to $z$ as separate fields. The query encoder may be learned; the document encoder and index may stay frozen and then be hot-swapped.

When should this paper not be used as a construction drawing?

- If the files are scans, tables, or formulas that must dereference to the original artifact, read [RAG-Anything](/en/paper-reading/03-rag-anything/). This paper assumes text chunks.
- If the problem is selecting one schema among many tools, read [RAG-MCP](/en/paper-reading/04-rag-mcp/). That is tool routing, not Wikipedia QA.
- If you need graph multi-hop rather than dense top-$k$, read [GraphRAG vs RAG](/en/paper-reading/07-graphrag-vs-rag/).
- If the corpus is large enough that lexical overlap starts to pay, read [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/). This table already shows BM25 winning on entity-centric FEVER.
- If the failure mode is “searched but answered without reading,” read [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/). 2020 RAG has no such gate.
- If long documents must revise evidence across turns, read [DocMemo](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/).
- If answers must bind to auditable evidence, read [FinRank](/en/paper-reading/18-finrank-evidence-grounded-rag/).

> **Huahua's take**
>
> The 2020 RAG paper concerns conditioning generation on latent retrieved documents. Later methods separately change parsing, routing, graphs, procedural controls, or scale; they are not an in-place upgrade of this BART-plus-Wikipedia system.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** the [arXiv abs](https://arxiv.org/abs/2005.11401), [v4 PDF](https://arxiv.org/pdf/2005.11401v4), and [HTML](https://arxiv.org/html/2005.11401v4) are readable under the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/). The [NeurIPS 2020 abstract page](https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html) and [camera-ready PDF](https://proceedings.neurips.cc/paper/2020/file/6b493230205f780e1bc26945df7481e5-Paper.pdf) open.
- **Code:** the paper points at Hugging Face Transformers `examples/rag/`. That path is **404** on current `main`. The historical tag [v4.21.3 research_projects/rag](https://github.com/huggingface/transformers/tree/v4.21.3/examples/research_projects/rag) is reachable (HTTP 200). The [model docs](https://huggingface.co/docs/transformers/model_doc/rag) remain. This is not a frozen official runtime.
- **Model cards (usable):** [facebook/rag-sequence-nq](https://huggingface.co/facebook/rag-sequence-nq), [facebook/rag-token-nq](https://huggingface.co/facebook/rag-token-nq), and `rag-sequence-base` / `rag-token-base` return 200. The paper’s interactive demo URL `https://huggingface.co/rag` redirects to `rag-token-nq`.
- **Index / data:** [facebook/wiki_dpr](https://huggingface.co/datasets/facebook/wiki_dpr) opens; the short name `datasets/wiki_dpr` returns 404. The DPR document encoder [facebook/dpr-ctx_encoder-single-nq-base](https://huggingface.co/facebook/dpr-ctx_encoder-single-nq-base) opens. These are related artifacts, not a private release unique to this paper.
- **Training environment (as stated):** Fairseq, eight 32GB V100 GPUs, mixed precision; FAISS on CPU, about 100GB for the full index and 36GB after compression. Training and inference can run on one GPU. The main tables are not “download one notebook and reproduce 44.5.”

The smallest useful reproduction is: run public `facebook/rag-sequence-nq` greedily on a handful of Natural Questions items and confirm that the output is generated text conditioned on retrieved Wikipedia chunks. Do not claim that this reproduces Table 1’s 44.5.

## Three things to remember

1. **Technical idea:** RAG rewrites $p(y|x)$ as a marginal over densely retrieved Wikipedia passages $z$; RAG-Sequence shares one document for the whole sequence, RAG-Token may switch per token.
2. **Evidence:** on NQ, RAG-Seq 44.5 beats DPR 41.5 and T5-11B+SSM 36.6; MS-MARCO is +2.6 versus BART; FEVER-3 72.5 sits 4.3 from a supervised pipeline. Learning the query encoder helps QA; BM25 wins on FEVER.
3. **Boundary:** this is 2020 Wikipedia seq2seq RAG. It is not a hybrid production platform, an agent loop, or a citation product; later methods should be evaluated separately.

## Further reading

RAG asks whether generation should be conditioned on retrieved passages. Continue according to the question:

- For deciding when to retrieve and self-critique, read [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/).
- For multimodal originals, read [RAG-Anything](/en/paper-reading/03-rag-anything/).
- For tool-schema routing, read [RAG-MCP](/en/paper-reading/04-rag-mcp/).
- For graphs or lexical scaling, read [GraphRAG vs RAG](/en/paper-reading/07-graphrag-vs-rag/) and [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/).
- For read-before-final, dynamic evidence, or evidence grounding, read [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/), [DocMemo](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/), and [FinRank](/en/paper-reading/18-finrank-evidence-grounded-rag/).

For the reading method itself, see the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/).

## Primary sources

- [Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,” NeurIPS 2020 / arXiv:2005.11401 v4](https://arxiv.org/abs/2005.11401)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2005.11401v4)
- [NeurIPS 2020 abstract page](https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html)
- [Historical Hugging Face Transformers RAG example (v4.21.3; not on current main)](https://github.com/huggingface/transformers/tree/v4.21.3/examples/research_projects/rag)
- [facebook/rag-sequence-nq model card](https://huggingface.co/facebook/rag-sequence-nq)
