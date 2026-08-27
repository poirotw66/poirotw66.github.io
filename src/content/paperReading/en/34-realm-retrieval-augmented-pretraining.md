---
title: "REALM: Wire Retrieval into LM Pre-Training, but Do Not Treat Joint Training as a Ready-Made RAG Stack"
description: "A source-grounded reading of Guu et al., ICML 2020: a differentiable knowledge retriever is pre-trained with an MLM signal, an asynchronously refreshed MIPS index, and Open-QA fine-tuning. With CC-News / Wikipedia, NQ Exact Match is 40.4, above ORQA and T5-11B. This is the expensive retrieval-augmented pre-training ancestor—not Lewis RAG generation and not DPR’s cheaper dual-encoder recipe."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "REALM changes the pre-training control point: a large textual corpus such as Wikipedia becomes a retrievable latent knowledge source, MLM loss backpropagates through retrieval, and a MIPS index is refreshed asynchronously."
  - "ICML camera-ready Table 1: with X=CC-News and Z=Wikipedia, NQ / WQ / CT Exact Match are 40.4 / 40.7 / 42.9 at 330M parameters, above ORQA 33.3 / 36.4 / 30.1 and T5-11B’s NQ 34.5. Table 2 shows stale MIPS and random masking hurt."
  - "This is 2020 retrieval-augmented pre-training plus extractive Open-QA—not production RAG, not Lewis RAG’s generative marginalization, and not the cheaper dual-encoder path DPR later argues you can take without ICT / joint index refresh."
audience:
  - "AI engineers who need to separate joint retrieval-during-pretraining from later DPR, Lewis RAG, and Self-RAG control points."
  - "Technical leads who must treat Wikipedia memory, asynchronous index refresh, and extractive answers as adoption boundaries."
tags: ["Paper Reading", "RAG", "Retrieval", "Information Retrieval"]
image: "/paperReading/34-realm-retrieval-augmented-pretraining/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
paper:
  title: "REALM: Retrieval-Augmented Language Model Pre-Training"
  authors:
    - "Kelvin Guu"
    - "Kenton Lee"
    - "Zora Tung"
    - "Panupong Pasupat"
    - "Ming-Wei Chang"
  year: 2020
  venue: "ICML 2020 (PMLR 119:3929-3938; arXiv 2002.08909 v1)"
  links:
    pdf: "https://proceedings.mlr.press/v119/guu20a/guu20a.pdf"
    arxiv: "https://arxiv.org/abs/2002.08909"
    doi: "https://proceedings.mlr.press/v119/guu20a.html"
    code: "https://github.com/google-research/language/tree/master/language/realm"
    project: "https://huggingface.co/google/realm-cc-news-pretrained-embedder"
series:
  id: "realm-retrieval-augmented-pretraining"
  title: "REALM deep reading"
  part: 1
  totalParts: 1
---

For the reading method itself, pair this with the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). This note is the **expensive joint-pretraining** ancestor on the retrieval spine, immediately before [DPR](/en/paper-reading/32-dense-passage-retrieval/): world knowledge can live in a retrievable corpus during pre-training, but joint training and index refresh are the costly control point DPR later refuses. Next read DPR’s cheaper dual encoder, then [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/) for generation conditioned on retrieved $z$. For the spine map, see the [RAG foundations reading map](/en/blog/92-rag-method-foundation-reading-map/).

## The paper in 90 seconds

- **Problem:** Pre-trained LMs store world knowledge in parameters; covering more facts pushes networks ever larger, and the stored knowledge is hard to locate or update.
- **Core insight:** During pre-training, add a learnable knowledge retriever that fetches documents $z$ from a corpus such as Wikipedia, backpropagate an MLM signal through retrieval (treating $z$ as a latent variable), and use asynchronous MIPS refreshes so the index can keep up with changing document embeddings.
- **Strongest evidence:** ICML Table 1 Open-QA Exact Match—REALM with $X$=CC-News and $Z$=Wikipedia reaches NQ 40.4, WQ 40.7, CT 42.9; same-scale ORQA scores 33.3 / 36.4 / 30.1; T5-11B (~11318M) reaches only 34.5 on NQ. Table 2: 30× stale MIPS drops NQ-dev Exact Match to 28.7.
- **Main boundary:** Memory is the 20 Dec 2018 English Wikipedia dump (just over 13 million chunks of up to 288 wordpieces); evaluation is English Open-QA with extractive spans; training needs 64-TPU pre-training and periodic index rebuilds; this is not production RAG, not generative RAG, and not when-to-retrieve.

My bounded verdict: **Keep REALM as the control point that wires retrieval into LM pre-training and makes backpropagation feasible via asynchronous index refresh. Do not read it as a ready-made RAG stack, and do not write DPR’s top-20 78.4, Lewis RAG’s NQ 44.5, or Self-RAG’s PopQA 54.9 back into this table.**

> **Huahua's one-liner**
>
> BERT hides knowledge in the weights. REALM flips through Wikipedia during pre-training and reindexes while it learns. DPR later argues open-domain QA may not need to pay that joint-training bill.

## Version and reading scope

Numbers in this note follow the [Guu et al., ICML 2020](https://proceedings.mlr.press/v119/guu20a.html) camera-ready PDF (PMLR 119:3929-3938), cross-checked against [arXiv:2002.08909 v1](https://arxiv.org/abs/2002.08909) (first posted 10 Feb 2020; as of 2026-08-27 arXiv still lists only v1). arXiv marks the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/). Author order follows the PDF: Kelvin Guu, Kenton Lee, Zora Tung, Panupong Pasupat, Ming-Wei Chang (Guu and Lee are joint first authors; Google Research). The camera-ready Table 1 adds an “ORQA (more fine-tune epochs)” row; Table 2 lists REALM ($X$=CC-News) at the top of the ablation table—those rows are taken from the ICML PDF.

Beyond the abstract, this note checks Sections 3–4, Tables 1–3, Figures 1–3, the supplement, and artifacts as of **2026-08-27**. Internal links go only to notes that already exist: [DPR](/en/paper-reading/32-dense-passage-retrieval/), [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/), [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/), and [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/). ORQA (Lee et al., arXiv:1911.03868) is related prior/parallel work only—**no** fake ORQA deep read. DPR Table 2 top-20 78.4, Lewis RAG-Sequence NQ 44.5, and Self-RAG PopQA 54.9 are **not** imported.

This is a published ICML paper; the arXiv snapshot used for HTML figure anchors is v1.

## The reader question that matters

When world knowledge is locked inside LM parameters, should engineering keep scaling the network, or should a large textual knowledge base become differentiable retrieval **during pre-training**? Guu et al. answer: pre-train the retriever with an MLM signal, marginalize retrieved $z$ as a latent variable, and use asynchronous MIPS refreshes so backpropagation over millions of documents is feasible; then fine-tune on Open-QA.

The precise question is not “is REALM today’s enterprise RAG?” It is: **after retrieval enters the pre-training objective, on which Open-QA settings does Exact Match actually move, and where do Wikipedia memory, index-refresh cost, and the extractive answer contract put the claim out of bounds?**

## Evidence map

| Layer | How this note uses it |
| --- | --- |
| **Paper directly supports** | Figures 1–2 describe retrieval-augmented pre-training and fine-tuning; Figure 3 describes asynchronous MIPS refresh; Eq. 1 treats $z$ as latent; Table 1 reports NQ / WQ / CT Exact Match; Table 2 reports NQ-dev ablations (stale MIPS, masking, retriever/encoder swaps); Table 3 gives the Fermat qualitative example; pre-training runs 200k steps on 64 TPUs over about 13 million candidates. |
| **Author claims** | This is the first unsupervised MLM pre-training of a knowledge retriever with backpropagation through millions of documents; relative to implicit parameter memory and prior Open-QA systems, Exact Match rises at a smaller parameter count, with interpretability and modularity benefits. |
| **Not established** | Private corpora and ACL; production hybrid / reranker stacks; generative answers or citation products; agentic when-to-retrieve; that joint pre-training works equally well without async refresh; back-porting later DPR / RAG / Self-RAG numbers. |
| **Bloss0m engineering judgment** | Read this note as the expensive ancestor: the control point is joint retrieval plus index refresh during pre-training. Next, [DPR](/en/paper-reading/32-dense-passage-retrieval/) argues QA pairs plus in-batch negatives can train a dense retriever without that bill. [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/) changes generation; [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/) changes when to retrieve. Keep the numbers apart. |

Later sections keep measurements, author claims, and engineering judgment separate. “SOTA” means the best row inside the paper’s tables at writing time, not a 2026 leaderboard.

## Why the previous approach is insufficient

Section 1 draws two 2020-era lines.

**Implicit parameter memory:** BERT / RoBERTa / T5-style models compress world knowledge into weights. That supports some closed-book facts, but knowledge is hard to audit or patch locally, and “store more facts” mostly means “train a bigger network”—the contrast the authors later draw against T5-11B.

**Retrieval exists, but pre-training does not train retrieval as a latent end-to-end:** Open-QA already used sparse retrieval plus a reader. ORQA (Lee et al., 2019) already used dense retrieval and marginal likelihood, with Inverse Cloze Task (ICT) initialization, but REALM stresses an additional **language-model pre-training step** that backpropagates into a MIPS index that goes stale, rather than freezing the index during that pre-training. Sparse first stages remain stuck on lexical overlap.

So the prior limitation is not “nobody thought of retrieval.” The control point was stuck on parameter memory or a fixed index: knowledge was not modular, or dense retrieval was not yet pre-trained unsupervised with an MLM signal over millions of documents. REALM changes the pre-training objective itself.

## Core intuition

Ignore the tables for a moment. Imagine two ways to memorize an encyclopedia. BERT compresses Wikipedia into weight wrinkles—capacity is expensive and editing one page is hard. REALM allows open-book exams and, crucially, **practices flipping pages from the mock exam (MLM pre-training) onward**: pages that help fill the masked span are upweighted; useless pages are downweighted. Because the book has tens of millions of pages, you cannot rebind the whole catalog after every gradient step, so a second “index builder” job re-embeds the corpus with a slightly stale parameter snapshot while the main trainer keeps computing gradients with fresh parameters—that is asynchronous MIPS refresh.

Contrast three next steps that are easy to conflate:

- **REALM (this note):** During pre-training, retrieve then predict, backpropagate through $z$, and refresh the index; after fine-tuning, answers remain extractive spans.
- **DPR (note 32):** Train a dual encoder directly on question–passage pairs; the authors argue you need not pay for ICT-style extra pretraining or complex joint index updates. Do not write DPR’s NQ top-20 78.4 into this note.
- **Lewis RAG (note 31):** Attach a dense retriever to seq2seq generation—the control point that changes is **generation**. Do not write RAG-Sequence NQ 44.5 into REALM’s tables.

> **Huahua's engineering note**
>
> Do not read “the model retrieves during pre-training” as “the system already has production RAG.” There is no reranker product contract, no ACL, and after Open-QA fine-tuning the answer contract is still extractive.

## Walk one example through the method

The following walk-through uses the paper’s Figure 1 / Table 3 teaching examples. It is not an independent experimental result.

1. **Input:** A masked sentence from the unlabeled pre-training corpus $\mathcal{X}$, with a salient span that needs world knowledge blanked out (named entities / dates via the paper’s tagger; Figure 1’s schematic is “The [MASK] at the top of the pyramid”). No private PDFs, no agent tools.
2. **Intermediate representation:** The input encoder embeds $x$; MIPS over just over 13 million Wikipedia chunks returns top-$k$ (about eight candidates during pre-training marginalization, including the empty null document $\emptyset$). Suppose a retrieved chunk $z$ discusses a pyramidion or a Fermat prime.
3. **Model or system decision:** Concatenate $x$ with $z_{\mathrm{body}}$, feed the knowledge-augmented encoder, and predict each [MASK] token. Training maximizes $\log p(y\mid x)$ after marginalizing $z$ (Eq. 1). The retriever gradient raises the score of documents that improve $p(y\mid z,x)$ relative to the expected document under $p(z\mid x)$.
4. **Output:** During pre-training, the output is the filled token string. During Open-QA fine-tuning, the output is an answer span inside a retrieved document (Exact Match). Table 3: for “Fermat,” BERT without retrieval assigns a tiny probability; conditioning on a useful $z$ can reach 1.0, and the marginalized probability is about 0.129.
5. **Likely failure point:** If the MIPS index lags far behind the current `Embeddoc` (Table 2’s 30× stale setting), retrieval collapses and Exact Match falls to 28.7. If the mask does not need world knowledge, or the null document is mishandled, the retrieval signal becomes noisy. If fine-tuning still uses the 2018 Wikipedia snapshot, 2026 facts will not appear magically.

This example teaches the **mechanism**. For the three-benchmark Exact Match numbers, return to Table 1; for whether refresh and masking are load-bearing, return to Table 2.

## Technical mechanism

REALM models $p(y\mid x)$ for both pre-training and fine-tuning and treats the retrieved document $z$ as a latent variable:

$$
p(y\mid x)=\sum_{z\in\mathcal{Z}} p(y\mid z,x)\,p(z\mid x).
$$

In practice the sum is over the top-$k$ documents under $p(z\mid x)$. The retriever is a dense inner-product model:

$$
p(z\mid x)\propto\exp\bigl(\mathrm{Embed}_{\mathrm{input}}(x)^{\top}\mathrm{Embed}_{\mathrm{doc}}(z)\bigr),
$$

where both embeddings are BERT-style Transformer [CLS] vectors followed by a linear projection. `Embeddoc` encodes title plus body. The knowledge-augmented encoder is a separate Transformer that cross-attends $(x,z)$ and then predicts: MLM heads during pre-training; extractive span start/end heads during fine-tuning (the answer is assumed to be a contiguous span in some $z$).

**Computational control point—asynchronous MIPS refresh:** MIPS requires precomputed `Embeddoc(z)` for every $z$. Each update to $\theta$ makes that index stale. The authors re-embed and rebuild about every 500 steps in a background job using a parameter snapshot $\theta'$; the trainer continues and recomputes $p(z\mid x)$ and gradients for the retrieved top-$k$ with fresh $\theta$. Figure 3: index builder (stale $\theta'$) ↔ MLM trainer (fresh $\theta$). Fine-tuning experiments usually build the index once for simplicity while still fine-tuning `Embedinput`.

**Inductive biases:** salient-span masking (entities / dates) makes the learning signal depend more on world knowledge; the null document $\emptyset$ absorbs cases where retrieval is unnecessary; retrieving the same document that already contains the answer from the pre-training corpus is prohibited to block shortcuts. The retriever is initialized with ICT (same starting point as ORQA); the knowledge-augmented encoder starts from BERT-base uncased.

Operational constraints:

- **Memory $\mathcal{Z}$:** 20 Dec 2018 English Wikipedia, greedily split into chunks of up to 288 BERT wordpieces, just over **13 million** retrieval candidates.
- **Pre-training corpus $\mathcal{X}$:** Wikipedia (same as $\mathcal{Z}$) or CC-News (separate from $\mathcal{Z}$).
- **Compute:** 200k steps, 64 Cloud TPUs, batch size 512, learning rate $3\times10^{-5}$; document embedding parallelized over 16 TPUs; eight candidates marginalized per example including $\emptyset$. After fine-tuning, inference uses top-5 and can run on a single 12GB GPU.
- **Parameter count:** Table 1 lists REALM / ORQA at 330M versus T5-11B at 11318M.

![REALM paper Figure 1: a masked sentence retrieves a document through the knowledge retriever; the knowledge-augmented encoder predicts the mask; gradients flow end-to-end into the retriever.](/paperReading/34-realm-retrieval-augmented-pretraining/paper/figure-1-overview.webp)

*Original Figure 1, Introduction / Section 3: schematic of retrieval-augmented MLM with end-to-end backpropagation. Locatable on [arXiv HTML Figure 1](https://ar5iv.labs.arxiv.org/html/2002.08909#S1.F1) (asset [intro_end_to_end.png](https://ar5iv.labs.arxiv.org/html/2002.08909/assets/intro_end_to_end.png)). Taken from the paper’s figure sources; the arXiv page marks the perpetual non-exclusive license. This note cites it under [arXiv reuse terms](https://info.arxiv.org/help/license/index.html); the ICML camera-ready is additionally under conference / PMLR publication terms.*

![REALM paper Figure 2: left, unsupervised pre-training (MLM plus retrieval); right, supervised fine-tuning (Open-QA); retriever $\theta$ and encoder $\phi$ share one framework.](/paperReading/34-realm-retrieval-augmented-pretraining/paper/figure-2-framework.webp)

*Original Figure 2, Section 3: pre-training versus fine-tuning overview. Locatable on [arXiv HTML Figure 2](https://ar5iv.labs.arxiv.org/html/2002.08909#S3.F2) (asset [pretrain_finetune.png](https://ar5iv.labs.arxiv.org/html/2002.08909/assets/pretrain_finetune.png)). License notes match Figure 1.*

![REALM paper Figure 3: asynchronous MIPS index refresh loop between the index builder (stale $\theta'$) and the MLM trainer (fresh $\theta$).](/paperReading/34-realm-retrieval-augmented-pretraining/paper/figure-3-async-mips.webp)

*Original Figure 3, Section 3.3: asynchronous MIPS refreshes. Cropped from the [ICML camera-ready PDF](https://proceedings.mlr.press/v119/guu20a/guu20a.pdf); the diagram matches arXiv v1. If a crop edge picks up an adjacent heading, trust the prose interpretation. License as for Figure 1 (arXiv perpetual non-exclusive; ICML / PMLR camera-ready under conference publication terms).*

## How to read the evidence

The evaluation task is Open-QA: given question $x$, predict answer string $y$, scored by Exact Match against any reference. Datasets are Natural Questions Open (79k / 4k), WebQuestions (3k / 2k), and CuratedTREC (1k / 1k). The knowledge corpus stays the same 2018 Wikipedia chunking. Fine-tuning follows the ORQA setup, but the camera-ready increases epochs (4 / 60 / 80 for NQ / WQ / CT) and reports a matched “ORQA more fine-tune epochs” row.

### Table 1: the win is Open-QA Exact Match, not later retrieval top-20 or generative EM

This table asks how REALM’s Exact Match compares with sparse retrieve-and-read systems, ORQA, and parameter-memory T5 under the stated Open-QA protocols. Held roughly constant: the Wikipedia knowledge corpus and each system’s answer contract. Changed: whether pre-training wires retrieval into the LM.

| Name | Pre-training | NQ | WQ | CT | # params |
| --- | --- | ---: | ---: | ---: | ---: |
| BERT-Baseline | BERT | 26.5 | 17.7 | 21.3 | 110m |
| T5 (11b) | T5 (Multitask) | 34.5 | 37.4 | — | 11318m |
| ORQA | ICT + BERT | 33.3 | 36.4 | 30.1 | 330m |
| ORQA (more FT epochs) | ICT + BERT | 34.8 | 35.4 | 28.7 | 330m |
| REALM ($X$=Wiki, $Z$=Wiki) | REALM | 39.2 | 40.2 | **46.8** | 330m |
| REALM ($X$=CC-News, $Z$=Wiki) | REALM | **40.4** | **40.7** | 42.9 | 330m |

Observation: the abstract’s 4–16% absolute gain is the magnitude versus prior Open-QA systems; against the closest sibling ORQA, the CC-News setting moves NQ from 33.3 to 40.4. T5-11B is about 30× larger in parameters and still trails REALM’s NQ 40.4; the authors note T5 also saw SQuAD reading-comprehension data during pre-training, which REALM did not use. At inference REALM retrieves only five documents, fewer than many systems that pull 20–80.

The table **supports** “retrieval-augmented pre-training lifts Exact Match on these three English Open-QA benchmarks.” It does **not** support reading the score as production RAG, and it must **not** absorb DPR’s retrieval top-20 or Lewis RAG’s generative EM.

![REALM paper Table 1: Exact Match and parameter counts for BERT / T5 / ORQA / REALM on NQ, WQ, and CT.](/paperReading/34-realm-retrieval-augmented-pretraining/paper/table-1-open-qa.webp)

*Original Table 1, Section 4.4 Main results: Open-QA Exact Match. Cropped from the [ICML camera-ready PDF](https://proceedings.mlr.press/v119/guu20a/guu20a.pdf). Numbers follow that PDF, including the ORQA more-fine-tune-epochs row. License notes match Figure 1 / PMLR camera-ready teaching citation.*

### Table 2: what drives the result is retriever pre-training, salient spans, and a fresh enough MIPS index

On the NQ development set, the ablations ask what happens if you swap the retriever or encoder, change the masking scheme, or slow index refresh—reporting both Exact Match and zero-shot Recall@5.

| Ablation | Exact Match | Zero-shot Recall@5 |
| --- | ---: | ---: |
| REALM ($X$=CC-News) | 38.5 | **52.0** |
| REALM | 38.2 | 38.5 |
| REALM retriever + Baseline encoder | 37.4 | 38.5 |
| Baseline retriever + REALM encoder | 35.3 | 13.9 |
| Baseline (ORQA) | 31.3 | 13.9 |
| random uniform masks | 32.3 | 24.2 |
| random span masks | 35.3 | 26.1 |
| 30× stale MIPS | 28.7 | 15.1 |

Observation: swapping in either the REALM retriever or the REALM encoder helps, but both together work best. Salient-span masking clearly beats random-token or random-span masking—the authors argue latent-variable learning needs a stable “retrieval is useful” signal. 30× stale MIPS nearly collapses to (or below) the ORQA baseline, so asynchronous refresh is not an implementation footnote; it is a condition for the method to work. CC-News pre-training is especially strong on zero-shot Recall@5 (52.0).

This **supports** “joint pre-training improves the retriever, and the index must stay fresh enough.” It does **not** support claiming the same REALM recipe while ignoring refresh cost.

![REALM paper Table 2: NQ development ablations, including stale MIPS and masking schemes.](/paperReading/34-realm-retrieval-augmented-pretraining/paper/table-2-ablation.webp)

*Original Table 2, Section 4.5 Analysis. Cropped from the [ICML camera-ready PDF](https://proceedings.mlr.press/v119/guu20a/guu20a.pdf). License as for Figure 1 / Table 1.*

### Table 3: a qualitative example of how retrieved documents change MLM

Table 3 is not a benchmark score. It shows that a relevant document can raise the conditional probability of “Fermat” to 1.0, with a marginalized probability still far above BERT without retrieval. Treat it as a teaching trace, not independent SOTA evidence.

## Limitations and threats to validity

1. **Wikipedia chunks as memory.** The 20 Dec 2018 dump yields just over 13 million candidates. Private corpora, ACL, multilingual settings, and fresh facts are outside the tables.
2. **Joint pre-training / async refresh are expensive.** 64 TPUs, 200k steps, and background re-embedding of the whole corpus—the exact bill [DPR](/en/paper-reading/32-dense-passage-retrieval/) later refuses as the default.
3. **The answer contract is extractive Open-QA.** Spans must appear in retrieved documents; this is not a citation product and not [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/) generative marginalization.
4. **Not when-to-retrieve.** Pre-training and fine-tuning still center on retrieval (plus a null document); this is not [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/) reflection tokens.
5. **ORQA is related prior work, not an on-site deep read.** Link [arXiv:1911.03868](https://arxiv.org/abs/1911.03868); do not expect a 2026-format note.
6. **The T5 comparison has protocol differences.** Generative answers, parameter scale, and extra RC data; the authors already flag this—do not reduce the result to “smaller model, higher score.”
7. **Do not back-fill later papers.** DPR top-20, RAG-Sequence EM, Self-RAG PopQA, BM25-at-scale, and FinRank do not belong in these tables.

## Engineering decision and when not to use it

When is this paper worth borrowing? When you need to understand how “retrieval augmentation” first entered the **pre-training objective**, or when you must decide whether differentiable retrieval is worth index-refresh and large-scale pre-training cost. In practice, log retrieved $z$, whether the null document was selected, the refresh interval, and Open-QA Exact Match separately—do not ship a single end-to-end score as the whole story.

When not to treat this paper as a construction blueprint:

- If you only need a dense first stage for open-domain / knowledge-base QA and want to avoid the ICT / joint-refresh bill, read [DPR](/en/paper-reading/32-dense-passage-retrieval/).
- If generation must condition on retrieved passages, read [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/).
- If the model should decide when to retrieve, read [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/).
- If corpus scale makes lexical overlap economical again, read [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/).

> **Huahua's judgment**
>
> Leave 2020 REALM in the section titled “joint retrieval plus async indexing during pre-training.” DPR is the cheaper retriever next step; RAG attaches generation; Self-RAG attaches when-to-retrieve. Do not mistake the joint-training receipt for a production RAG parts list.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** [arXiv abs](https://arxiv.org/abs/2002.08909), [v1 PDF](https://arxiv.org/pdf/2002.08909v1), and [ar5iv HTML](https://ar5iv.labs.arxiv.org/html/2002.08909) are readable under the [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/). The [ICML / PMLR camera-ready PDF](https://proceedings.mlr.press/v119/guu20a/guu20a.pdf) and [supplement PDF](https://proceedings.mlr.press/v119/guu20a/guu20a-supp.pdf) return HTTP 200.
- **Code (usable):** The [google-research/language `language/realm`](https://github.com/google-research/language/tree/master/language/realm) tree opens (including `train_realm.py`, `refresh_doc_embeds.py`, and a README). A usable source tree is not the same as “one-click reproduction of Table 1’s 40.4.”
- **Model cards (usable):** Hugging Face endpoints such as `google/realm-cc-news-pretrained-embedder`, `google/realm-cc-news-pretrained-encoder`, and `google/realm-cc-news-pretrained-openqa` return 200. Public weights support inference experiments; full table reproduction still depends on the paper’s corpus splits and TPU training setup.
- **Training environment (author-stated):** Pre-training on 64 TPUs for 200k steps; document embedding on 16 TPUs; post-fine-tuning inference on a single 12GB GPU. The main experiment is not “download a notebook and reproduce NQ 40.4.”

The smallest useful reproduction is: run a public REALM OpenQA checkpoint on a handful of Natural Questions items, confirm Wikipedia chunks are retrieved, and confirm answers are extractive spans. Do not claim that reproduces Table 1’s 40.4.

## Three things to remember

1. **Technical idea:** REALM wires retrieval into LM pre-training: an MLM signal backpropagates through latent documents $z$, and asynchronous MIPS refresh keeps the index usable.
2. **Evidence:** On ICML Table 1, REALM (CC-News) reaches NQ Exact Match 40.4, above ORQA and much larger T5-11B; Table 2 shows stale MIPS and non-salient masking break the result.
3. **Boundary:** This is the expensive retrieval-augmented pre-training ancestor plus extractive Open-QA. It is not production RAG, not DPR’s cheaper dual-encoder recipe, and not generative RAG or Self-RAG when-to-retrieve.

## Further reading

REALM asks whether pre-training should jointly retrieve and refresh an index. For a cheaper dense retriever, read [DPR](/en/paper-reading/32-dense-passage-retrieval/); for generation conditioned on $z$, read [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/); for when to retrieve, read [Self-RAG](/en/paper-reading/33-self-rag-retrieve-generate-critique/); for lexical overlap at scale, read [BM25 at scale](/en/paper-reading/13-bm25-wins-at-scale/). ORQA remains arXiv-only: [arXiv:1911.03868](https://arxiv.org/abs/1911.03868). For the reading method, see the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/).

## Primary sources

- [Guu et al., “REALM: Retrieval-Augmented Language Model Pre-Training,” ICML 2020 / PMLR 119:3929-3938](https://proceedings.mlr.press/v119/guu20a.html)
- [arXiv:2002.08909 v1](https://arxiv.org/abs/2002.08909)
- [ICML camera-ready PDF](https://proceedings.mlr.press/v119/guu20a/guu20a.pdf)
- [google-research/language `language/realm`](https://github.com/google-research/language/tree/master/language/realm)
- [google/realm-cc-news-pretrained-embedder](https://huggingface.co/google/realm-cc-news-pretrained-embedder)
- [ORQA (Lee et al., 2019) arXiv:1911.03868 — context only](https://arxiv.org/abs/1911.03868)
