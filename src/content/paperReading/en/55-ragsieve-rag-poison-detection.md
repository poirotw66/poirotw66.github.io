---
title: "RAGSieve: Detecting RAG Knowledge-Poisoning Promotion with Self-Referenced Local Contrast"
description: "A deep read of RAGSieve: query-local and corpus-local references expose suspicious retrieval promotion without a trusted clean corpus, while the paper's boundary remains essential—promotion detection is not truth verification."
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "RAGSieve does not assume a separate clean reference. RSQ contrasts the top five documents with ranks 6–20 from the same query, while RSG contrasts each corpus document with its own semantic–lexical neighborhood."
  - "RSQ combines answer-anchor concentration, script integrity, local surprisal, and query-alignment transitions; RSG combines locally calibrated graph density with a token-level integrity predicate."
  - "Across three QA datasets, three dense retrievers, and six poisoning constructions, the authors report 95.2% RSQ AUROC and 82.2% poison detection at a 5% clean-removal budget; RSG reaches 93.3% and 79.8%."
  - "The key semantic boundary is that the score detects suspicious retrieval-promotion patterns, not factual truth. Joint deployment lowers ASR from 67.4% to 14.0% in the paper's protocol, but it is not a production truth verifier or a proof of complete removal."
audience:
  - "AI engineers designing RAG ingestion, retrieval filtering, or knowledge-base auditing"
  - "RAG platform owners evaluating retrieval security, collateral-removal cost, and reproducibility boundaries"
tags: ["Paper Reading", "RAG", "Retrieval", "Security", "AI Engineering", "Evaluation"]
image: "/paperReading/55-ragsieve-rag-poison-detection/title_image.webp"
field: "Information Retrieval"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-safety-governance
  - agent-evaluation-observability
paper:
  title: "RAGSieve: Self-Referenced Local Contrast for Knowledge-Poison Detection in Retrieval-Augmented Generation"
  authors:
    - "Xinlong Xu"
    - "Yoshua Y. Li"
  year: 2026
  venue: "arXiv 2608.13010 v1 (submitted 2026-08-13; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.13010v1"
    arxiv: "https://arxiv.org/abs/2608.13010"
    doi: "https://doi.org/10.48550/arXiv.2608.13010"
    code: "https://github.com/XrazyMee/RAGSieve"
    project: "https://arxiv.org/html/2608.13010v1"
series:
  id: "rag-retrieval-integrity"
  title: "RAG Retrieval Integrity & Governance"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem**: RAG places external corpus content inside the evidence used for generation. An attacker who can get a small number of documents ingested through a public page, shared store, or connector may promote a chosen false answer into the top five for a target query. The hard part is that the attacked corpus is not a trusted reference, and natural semantic density varies by topic.
- **Core insight**: Do not assume a separately clean dataset, and do not apply one global threshold across the corpus. RSQ performs query-local contrast between the top five and ranks 6–20 for the same query; RSG performs corpus-local contrast between each document's semantic neighbors and its own local floor. Both let the inspected system supply its own matched control.
- **Strongest evidence**: Across nine dataset–retriever systems and six attacks, RSQ reaches 95.2% macro AUROC and detects 82.2% of poison at an operating point allowing at most 5% clean-document removal. RSG reaches 93.3% and 79.8%. Serial RSG plus RSQ lowers ASR from 67.4% to 14.0% while unpoisoned-retrieval F1 changes from 42.1% to 41.3% (Tables 1, 5, and 9).
- **Main boundary**: These are results on synthetic attacks, three QA corpora, three dense retrievers, and a fixed evaluation protocol. They support the claim that suspicious promotion patterns can be exposed by local contrast; they do not support the claim that a flagged document is false, that a retrieved claim has been truth-verified, or that production-scale multi-tenant latency and zero-poison guarantees follow.

My bounded verdict is: **RAGSieve's most valuable design choice is putting the detection reference back at the actual retrieval control point, then combining an offline corpus gate with an online query gate. It is a retrieval-integrity signal layer; treating it as a fact checker, content moderator, or complete remediation system would add guarantees that the paper does not establish.**

> **Huahua's engineering note**
>
> RAGSieve asks whether a document exhibits an unusual promotion pattern, not whether its sentence is true. A flagged document still needs provenance, ACL, human or rule-based review, or independent claim verification; an unflagged document is not thereby trustworthy.

## Version, sources, and reader question

This article reads [RAGSieve v1 on arXiv](https://arxiv.org/abs/2608.13010v1), submitted on 2026-08-13 by Xinlong Xu and Yoshua Y. Li. It was an arXiv preprint with no peer-review venue identified at that version. arXiv has a v2 dated 2026-09-08, but this article does not mix v2 sections, figures, or numbers into the v1 account. I cross-checked the body, appendices, Tables 1–9, Appendix Tables A1–A4, and Figures 1–8 against the [v1 full HTML](https://arxiv.org/html/2608.13010v1) and [v1 PDF](https://arxiv.org/pdf/2608.13010v1); the image assets below also come from v1 endpoints.

The reader question is: **without a trusted clean corpus, poison labels, or a global threshold that works across topics, can a RAG system still expose suspicious ranking promotion at ingestion time and query time?** This question follows naturally from [RAG evidence grounding](/en/paper-reading/31-retrieval-augmented-generation/), [DocMemo's dynamic evidence discovery](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/), and [the external-content risk in indirect prompt injection](/en/paper-reading/42-indirect-prompt-injection/). RAGSieve does not redefine the generator; it moves the control point toward the integrity of the evidence entering retrieval and generation.

I also checked the authors' [MIT RAGSieve repository](https://github.com/XrazyMee/RAGSieve) independently. As of September 17, 2026, `main` points to `2be192e` (September 8, 2026, `Implement serial RSG-to-RSQ deployment`); the repository, README, MIT license, demo fixtures, three text corpora, and detector source are reachable. This artifact state must be kept separate from the paper's v1 source version: the current README's figure mapping follows newer preprint naming, while the evidence in this article remains anchored to v1.

## Evidence map: Paper, Evidence, and Bloss0m judgment

| Layer | What this article says |
| --- | --- |
| **Directly supported by the Paper** | Self-referenced local contrast; the RSQ query-local retrieval-tail reference; the RSG corpus-local graph, lexical-diversity filter, and per-document floor; three datasets, three retrievers, six attacks; document-level, QA, ablation, injection-volume, and cost results. |
| **What the Evidence shows** | At the paper's fixed 5% clean-removal operating point, RSQ and RSG separate poison better than their principal comparators; their control points are complementary, and serial deployment lowers ASR in this synthetic attack suite while changing unpoisoned QA F1 only modestly. |
| **Author claim** | RAGSieve can provide self-referenced detection for query-time promotion and corpus-time coordination without poison labels or a trusted corpus. |
| **Not established by the evidence** | The method does not prove that a retrieved claim is true, that every flagged document is malicious, that poison has been completely removed, that the measured latency transfers to production, or that an adaptive attacker cannot evade both local references. |
| **Bloss0m engineering judgment** | Treat RSG as an ingestion or audit gate and RSQ as a request-level residual signal, then connect both to provenance, ACL, review queues, rollback, and independent truth verification. This is an engineering synthesis, not a third framework proposed by the paper. |

### Paper Essence Contract

1. **What problem does it solve?** It addresses retrieval-integrity detection after a small number of corpus documents can promote an attacker-selected answer into generation evidence, when the defender lacks a trustworthy reference (Sections 1–3).
2. **Why are previous approaches insufficient?** Online methods rely on different attack artifacts, model access, or external calibration; offline methods such as CleanBase use a global graph threshold over heterogeneous corpora. Neither assumption necessarily covers query-local promotion, corpus-local coordination, and changing topical density together (Sections 1 and 2).
3. **What is the core technical idea?** Construct a matched control from the inspected environment itself: RSQ compares the active retrieval candidates with that query's tail, while RSG compares each document with its local semantic–lexical graph. This is a reference-construction principle, not a factuality model.
4. **How does one representative input move through the method?** A query produces a top-20 ranking; RSQ scores ranks 1–5 with four local evidence terms, removes flagged candidates, and refills from the original ranking. Before a query arrives, RSG builds a graph from the complete corpus embeddings, scores documents, and may quarantine them. The two stages can run serially (Sections 4 and 8).
5. **Which evidence supports the headline claim?** Table 1 and Figure 3 support RSQ detection under the 5% clean-removal budget; Table 5 supports the RSG comparison with CleanBase; Tables 4 and 8 and Figure 5 expose component contributions; Table 9 and Figure 7 support the serial security–utility result under the paper's protocol.
6. **What assumptions does adoption require?** RSQ needs a retrieval tail that remains mostly clean and representative of the query-local background. RSG needs coordinated injection to leave a density signal among semantically close but lexically distinct neighbors, and it needs the victim retriever's complete corpus embeddings (Sections 4 and 10).
7. **Where does the adoption boundary lie?** The result stops at three benchmarks, six synthetic constructions, fixed models and hardware, and selected thresholds. In engineering use, the score should be a triage signal; each deployment must measure its own false-positive cost, freshness, ACL behavior, corpus drift, and adaptive attacks rather than promoting it to a truth certificate.

## Why previous approaches are insufficient

### Poisoning attacks the evidence path, not necessarily model parameters

A RAG system embeds queries and documents, ranks them by similarity, and passes the top-$k$ documents to a generator. The external evidence plane can therefore change without retraining the model. In the paper's Threat Model, the attacker is a content contributor who can cause a small number of documents to be ingested through a legitimate or compromised source. Examples include editing a public page, publishing content that will later be crawled, uploading to a shared collection, or writing through a third-party connector. The defender controls the query, retriever, generator, index, and filtering pipeline, but does not know the attacked query, target answer, attack method, or poison labels.

The success condition is not simply that a document looks strange. For each target query, the attacker chooses an incorrect target answer. The paper counts an attack as successful only when injected evidence is retrieved, the generated answer supports the target, and it does not support the reference answer. PR-B is natural-language black-box PoisonedRAG; PR-W applies HotFlip prefix optimization per retriever; CEM-C and CEM-D use contiguous and dispersed embedding triggers; CPA-RAG jointly optimizes retrieval and answer generation; CamoDocs uses corpus-aware camouflage over benign carriers (Section 5 and Appendix B). Poisoning therefore cannot be reduced to low fluency, duplicate text, a global outlier, or an inevitable multi-document clique.

### Every detector carries a different reference assumption

Online RAGuard, GMTP, EcoSafeRAG, TrustRAG, and the other comparison methods read different signals: perplexity, retriever gradients, masked-token probabilities, context diversity, clusters, or answer assessment. Some need clean passages, calibration pairs, particular attack artifacts, victim-model access, or an external signal. Offline AHD, Isolation Forest, kNN, LOF, and CleanBase do not have the current query; CleanBase in particular uses one graph threshold derived from the corpus-wide distribution and a clique rule. These methods are not all trying to do the same job. Their reference, control point, and interface assumptions differ, so a score from one method cannot automatically be interpreted as the same capability as a score from another.

RAGSieve reframes the question: **when there is no oracle, can the ordinary relevance structure near the inspected event act as a matched control?** Normal top-ranked documents for a query should be semantically related, yet they can use different words. Conversely, an attack payload may be concentrated among promoted candidates or may make several corpus documents unusually close in local embedding geometry. The point is not to find a guaranteed-clean set; it is to hold the query, retriever, corpus snapshot, or topical region fixed while comparing foreground evidence with its local background.

## Core intuition: compare with the same local environment, not a clean truth set

Think of RAGSieve as a position-sensitive contrast operation. If a document is promoted into generation candidates because it carries target-supporting content, it is not only an absolute anomaly; relative to documents that almost entered generation in the same retrieval, it may show concentration, transition, or script patterns. If several poison documents create density in the corpus, they may look unusually connected relative to their own topical neighborhood floor.

![RAGSieve Figure 1: the two RAGSieve control points on the RAG evidence path, corpus-time RSG and query-time RSQ.](/paperReading/55-ragsieve-rag-poison-detection/paper/figure-1-overview.svg)

*Figure 1 (original paper Figure 1, Section 1 overview): the left side shows corpus poisoning entering the indexed evidence path; RSG checks each document's corpus-local graph before retrieval, while RSQ contrasts the top five with the retrieval tail for the same query before generation. See the [original Figure 1 anchor](https://arxiv.org/html/2608.13010v1#S1.F1) and [original SVG endpoint](https://arxiv.org/html/2608.13010v1/fig_intro_single_column.svg). The paper page marks the work [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); attribution is retained, the v1 original is used directly, and reuse remains subject to the original license and copyright restrictions.*

This view keeps three layers separate:

1. **Paper mechanism**: use a local reference to contrast suspicious promotion patterns.
2. **Paper evidence**: measure document detection, downstream answer quality, clean removal, and cost on the synthetic attack suite and fixed QA protocol.
3. **Bloss0m engineering interpretation**: treat a flag as a signal for routing into provenance, ACL, review, rollback, and factuality controls.

“No trusted clean corpus” therefore does not mean “no validation is needed.” It means that the RSQ and RSG local scores do not require a separately pre-labelled clean corpus. Whether the operator should trust, isolate, or delete the document remains a larger governance decision.

## Worked example: one NQ attack through the method

Appendix B's representative attack sample uses the same NQ target: `where is hallmark channel home and family filmed`, with attacker-chosen answer `Vancouver, British Columbia`. This is an attack sample supplied by the paper to show how a carrier and injected claim coexist; it is not a new production incident from Bloss0m and should not be read as a natural-poison prevalence estimate.

1. **Input**: The system receives query $q$, and the complete retriever ranking yields $D_q=(d_1,\ldots,d_{20})$. The first five documents are generation candidates; ranks 6–20 form the retrieval tail.
2. **Intermediate representation**: PR-B can place the query and a natural-language passage in the same document. PR-W, CEM-C, CEM-D, and CamoDocs may add non-Latin optimized tokens, contiguous triggers, or dispersed carriers before or around the claim. All of these remain document text when local features are computed.
3. **Local decision**: RSQ asks whether target vocabulary is concentrated among the top-five candidates, whether a candidate has a script mismatch relative to the tail, whether it contains a local NLL burst or change point, or whether its query-alignment trace jumps. The four evidence values are added into $S_{\mathrm{RSQ}}(d,q)$ for each candidate.
4. **Output**: If $S_{\mathrm{RSQ}}(d,q)\geq\eta_Q$ (the paper default is 1), the candidate is removed and the system walks down the original ranking to refill a five-document generation context. The intervention aims to reduce target evidence entering generation; it does not decide whether the claim is true.
5. **Likely failure point**: CPA-RAG can keep its carriers fluent, making surprisal less distinctive. If many poison documents reach ranks 6–20, the tail itself becomes contaminated and query-local contrast loses a clean background. This is the boundary that RSG's corpus-time signal and serial deployment are intended to complement.

The example also shows why “the answer says Vancouver, so mark it false” is not the method. RAGSieve only observes the shape of candidate evidence relative to a local reference. Verifying Vancouver requires trusted provenance, source permissions, independent evidence, version validity, and a citation policy at the answer layer.

## Technical mechanism: two control points and four signals

### Keep the two local scopes distinct

![RAGSieve Figure 2: evidence flow from the query-local retrieval tail and corpus-local graph at two control points.](/paperReading/55-ragsieve-rag-poison-detection/paper/figure-2-method.svg)

*Figure 2 (original paper Figure 2, Section 4): RSQ contrasts the top-five generation candidates with ranks 6–20 for the query; RSG builds a corpus graph from exact neighbors, applies a lexical-diversity filter, and compares density with each document's neighborhood floor. See the [original Figure 2 anchor](https://arxiv.org/html/2608.13010v1#S4.F2) and [original SVG endpoint](https://arxiv.org/html/2608.13010v1/fig_methodology_double_column.svg). The paper page marks the work [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); the v1 original is used with attribution, and reuse remains subject to the original license and copyright restrictions.*

RSQ and RSG share the principle of contrasting against the same local environment, but they are not one score and are not interchangeable classifiers. RSQ sees the active query but only a short retrieval tail; RSG sees the complete corpus and its embeddings but does not know the next query.

### RSQ: ranks 6–20 as a query-local reference

Let $D_q=(d_1,\ldots,d_n)$ be the ordered retrieval for query $q$, $C_q=\{d_1,\ldots,d_k\}$ the documents passed to the generator, and $R_q=\{d_{k+1},\ldots,d_n\}$ the retrieval tail. In v1, $k=5$ and $n=20$, so every decision uses 15 reference documents from the same retriever, corpus snapshot, and query.

**Answer-anchor concentration** starts with lowercased alphanumeric tokens that are not in the query. Tokens must usually be at least three characters long, with a numeric exception, and a type must appear in at least two candidates. If token $t$ appears $K_t$ times in all of $D_q$ and $x_t$ times among the candidates, the paper uses a rank-exchangeability hypergeometric reference:

$$
X_t\sim\operatorname{Hypergeom}(n,K_t,k),\qquad p_t=\Pr[X_t\geq x_t].
$$

Simes aggregation combines the token p-values inside candidate $d$ into $p_a(d)$, then the normalized evidence is

$$
E_a(d)=\frac{-\log_{10}p_a(d)}{\log_{10}{n\choose k}}.
$$

A high value means that answer-bearing vocabulary is concentrated among the generation candidates. It is not a probability that the answer is correct.

**Script integrity** maps alphabetic Unicode characters to coarse scripts. Let $v(d)$ be the fraction outside the document's dominant script; candidate $v(d)$ is compared with the tail using a finite-sample mid-rank to produce $E_i(d)$. **Surprisal** uses Qwen3-0.6B-Base token NLL over rolling windows $w\in\{8,16\}$, looking for a local burst $B_w$ and a left–right change point $C_w$. With reference scale $w_0=16$ and information gate $\tau_0=5\ln2$, the threshold scales as $\tau_w=\tau_0\sqrt{w_0/w}$. Only an excursion beyond the gate contributes $E_p(d)$, preventing tiny ubiquitous fluency differences from accumulating into an alert.

**Query alignment** splits each document into overlapping windows and computes BERTScore F1 against the query with layer 9 of `bert-base-uncased`. If the trace is $f_1,\ldots,f_h$, the maximum jump is

$$
J(d,q)=\max_{1\leq j<h}|f_{j+1}-f_j|.
$$

As with integrity, RSQ converts the tail's finite upper-tail probability $p_s(d)$ into evidence only beyond $\alpha_s=0.05$. The four terms are added:

$$
S_{\mathrm{RSQ}}(d,q)=E_a(d)+E_i(d)+E_p(d)+E_s(d),\qquad
\text{flag if }S_{\mathrm{RSQ}}(d,q)\geq\eta_Q=1.
$$

Operationally, this means that four relative evidence channels jointly cross a decision gate; they are not four independent truth votes. Flagged top-five documents are removed, the original rank order supplies replacements, and replacements are not rescored.

### RSG: each document's graph floor as a corpus-local reference

RSG runs during ingestion or a periodic index audit. For every corpus document $d_i$, it takes the normalized victim-retriever embedding $e_i$ and finds exact $k_G=16$ nearest neighbors. A directed neighbor enters density estimation only when

$$
\langle e_i,e_j\rangle\geq\tau_e=0.85,\qquad
\operatorname{Jaccard}(d_i,d_j)\leq\tau_l=0.60.
$$

The lexical condition prevents duplicates and near-duplicates from naturally inflating the graph density.

Let $N_i$ be the retained neighbors, $b_i$ the cosine similarity of the original $k_G$th neighbor, $H_i$ the strongest $h_G=4$ retained neighbors, and $\mu_i$ their mean similarity. With support scale $c_G=2$, the paper defines

$$
D_i=\min(1,|N_i|/c_G)\operatorname{clip}_{[0,1]}
\left(\frac{\mu_i-b_i}{1-b_i}\right).
$$

$D_i$ is not an absolute density score: it compares the strongest retained neighbors with that document's own local floor, while the support factor downweights an isolated pair. RSG turns it into an empirical upper-tail probability $p_{\mathrm{RSG}}(i)$ over the current corpus snapshot $V$, then allocates the topology branch a corpus alert budget $\alpha_G=0.05$. A second integrity predicate $I_i$ fires when one token contains adjacent alphabetic characters from different scripts or when the document contains at least three alphabetic scripts. The final score is the maximum of topology and integrity signals, with paper threshold $\eta_G=0.5$.

RSG therefore depends especially on coordinated injection. If multiple documents share a payload and form a semantically close but lexically distinct local structure, they may raise $D_i$ together. A single fluent isolated poison need not leave enough graph evidence. That is an assumption and recall boundary, not an implementation defect.

## How to read the experiments: data, attacks, baselines, and metrics

### Evaluation matrix

The authors sample 1,000 queries from each of Natural Questions, HotpotQA, and MS MARCO with seed 42, then choose 100 attack targets with seed 2026. The resulting knowledge bases contain 128,044 NQ documents, 9,961 HotpotQA documents, and 8,239 MS MARCO passages. Every query searches the complete constructed corpus rather than only its originally associated documents.

| Dimension | Paper v1 protocol |
| --- | --- |
| Datasets | NQ (single-hop Wikipedia), HotpotQA (multi-hop Wikipedia), and MS MARCO (web-passage retrieval) |
| Target retrievers | BGE-M3, E5-large-v2, and all-MiniLM-L6-v2; nine dataset–retriever systems |
| Attacks | PR-B, PR-W, CEM-C, CEM-D, CPA-RAG, and CamoDocs; up to five poison documents per target |
| Retrieval | Documents truncated to 512 model tokens; normalized vectors; exact cosine; top 100 retained and top 5 sent to the generator |
| Generation and judge | `deepseek-v4-flash` at temperature 0; the same endpoint generates answers and makes the semantic ASR judgment |
| Hardware | Ubuntu 22.04, two Intel Xeon Gold 6530 processors, 503 GiB RAM, and an NVIDIA RTX 5090 with 32 GB |

The three attacker knowledge levels are represented. A black-box attacker can know the query without access to the victim retriever; a gray-box attacker can query an embedding API or read public corpus content; a white-box attacker can inspect the victim embedding model and gradients. PR-B, PR-W, CEM, and CamoDocs mostly use five target-payload passages with different carriers; CPA-RAG jointly writes up to five natural documents. This matrix tests cross-dataset, cross-retriever, and attack diversity, but it is not an estimate of natural-poison prevalence.

The online document-level comparators are RAGuard, GMTP, and EcoSafeRAG; TrustRAG is added at the end-to-end QA level. Offline comparators are CleanBase, AHD, Isolation Forest, cosine kNN distance, and cosine LOF. The paper separates methods with a per-document score from TrustRAG, which changes context consumption and is compared at the QA layer. EcoSafeRAG is a best-effort reproduction because its code, complete bait construction, and some parameters are not fully released; it should not be described as equally reproducible.

### Ask what is being protected before reading a metric

Document detection reports AUROC and poison detection when at most 5% of clean documents may be removed. The QA filter additionally reports poison and clean document removal; clean-index utility is Recall@5. End-to-end evaluation reports token F1 and exact match (EM) for poisoned and unpoisoned retrieval, plus ASR. The judge counts an attack only when the answer supports the adversarial target and does not support the reference answer. This definition matters: ASR alone would reward a filter that deletes most clean context, so F1, EM, and clean removal must be read alongside it.

## Result 1: RSQ exposes query-local promotion

### Document-level separation

![RAGSieve Figure 3: RSQ versus GMTP and RSG versus CleanBase under the same 5% clean-removal constraint, split by attack.](/paperReading/55-ragsieve-rag-poison-detection/paper/figure-3-detection-by-attack.svg)

*Figure 3 (original paper Figure 3, Section 6.1): filled markers denote RAGSieve and open markers the comparator; panel (a) compares RSQ with GMTP, while panel (b) compares RSG with CleanBase. All values are macro-averaged over the nine target systems. See the [original Figure 3 anchor](https://arxiv.org/html/2608.13010v1#S6.F3) and [original SVG endpoint](https://arxiv.org/html/2608.13010v1/fig_detection_by_attack.svg). The paper page marks [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); attribution is retained and the v1 original is used, subject to the original license and copyright restrictions.*

Read Figure 3 through five questions:

1. **Question**: Can the score separate poison from clean evidence when collateral removal is bounded?
2. **Controls**: Each attack row macro-averages the same three datasets and three retrievers; the clean-removal ceiling is 5%.
3. **Observation**: RSQ reaches 95.2% overall AUROC and 82.2% budgeted poison detection, while GMTP reaches 81.1% and 52.5%. RSG reaches 93.3% AUROC and 79.8% budgeted detection, while CleanBase reaches 79.4% and 37.6%.
4. **Mechanistic interpretation**: RSQ has an easier local signal on CEM-C, CEM-D, and CamoDocs, where embedding-optimized triggers or shared target vocabulary create local differences. CPA-RAG keeps its carriers fluent; RSQ still reaches 86.8% AUROC there, but its residual online ASR is the highest later. RSG's local floor and lexical-diversity rule are especially consequential for CamoDocs: CleanBase reaches 37.5% AUROC and 1.4% budgeted detection, while RSG reaches 89.0% and 79.6%.
5. **Boundary**: This is ranking separation on a fixed synthetic suite, not recall for every natural poison. The 5% clean-removal point is a shared operating point, not a universally appropriate quarantine tolerance.

RSQ's QA filtering point shows selectivity more directly: it removes 73.9% of poison and 2.2% of clean documents; GMTP removes 69.5% of poison and 22.3% of clean documents. RAGuard removes every scored document, and TrustRAG removes 85.8% poison but also 44.0% clean. These numbers do not make RSQ “best at everything”; they show why collateral removal belongs in the security interpretation.

### End-to-end: security is not just ASR

![RAGSieve Figure 4: the RSQ online-filtering security–utility trade-off.](/paperReading/55-ragsieve-rag-poison-detection/paper/figure-4-psq-tradeoff.svg)

*Figure 4 (original paper Figure 4, Section 6.2): the plot puts ASR and unpoisoned-retrieval F1 for online filtering on one security–utility plane; lower ASR and higher F1 are preferred, No defense is the unfiltered reference, and values are macro-averaged over six attacks and nine target systems. See the [original Figure 4 anchor](https://arxiv.org/html/2608.13010v1#S6.F4) and [original SVG endpoint](https://arxiv.org/html/2608.13010v1/fig_psq_tradeoff.svg). The paper page marks the work [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); attribution is retained, the v1 original is used directly, and reuse remains subject to the original license and copyright restrictions.*

On poisoned retrieval, the no-defense ASR is 67.4% and F1 is 26.5%; after RSQ, ASR is 27.6%, F1 is 36.9%, and EM is 13.9%. On unpoisoned retrieval, F1 changes from 42.1% to 41.6% and EM from 18.1% to 17.8%. TrustRAG has lower ASR at 22.2%, but removes 44.0% of clean documents and retains 37.9% unpoisoned F1; RAGuard reaches 6.3% ASR while retaining only 14.6% unpoisoned F1. A lower ASR therefore cannot be read as proof that retrieval integrity has been solved.

The attack breakdown retains a useful failure slice. RSQ reduces ASR by 63.1, 63.4, and 41.6 percentage points on PR-W, CEM-C, and CEM-D. On CPA-RAG it reduces ASR by only 13.4 points; residual ASR remains 72.3% and poisoned F1 improves by only 1.9 points. The overall 27.6% would hide this fluent joint-optimization case if read alone.

## Result 2: RSG moves inspection to corpus time

RSG does not observe the next query. It processes 54 poisoned corpus snapshots: three datasets × three retrievers × six attacks, with up to five documents injected for each of 100 target queries. This makes pre-retrieval quarantine possible, but it also makes false positives more persistent: quarantining one clean document can affect many later requests that have not yet arrived.

![RAGSieve Figure A1: detection heatmaps for the nine dataset–retriever target systems.](/paperReading/55-ragsieve-rag-poison-detection/paper/figure-a1-system-heatmaps.png)

*Figure A1 (original paper Figure A1, Appendix A): the heatmap expands the 3×3 matrix of three datasets and three dense retrievers; each value averages six attacks, Poison Detected uses the 5% clean-removal budget, color is normalized separately per metric, and exact percentages are printed in the cells. See the [original Figure A1 anchor](https://arxiv.org/html/2608.13010v1#A1.F1) and [original PNG endpoint](https://arxiv.org/html/2608.13010v1/fig_system_heatmaps.png). The paper page marks the work [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); the v1 original is used with attribution, and reuse remains subject to the original license and copyright restrictions.*

This appendix view adds heterogeneity hidden by macro averages: the two Wikipedia corpora are generally higher, MS MARCO is particularly weaker with MiniLM, HotpotQA with E5 is especially high for RSG, and RSQ varies less across retrievers. Adoption therefore needs dataset–retriever slice calibration rather than treating a pooled headline as every system's expected recall.

In end-to-end QA, CleanBase lowers ASR from 67.4% to 47.5% and raises poisoned F1 from 26.5% to 33.6%. RSG lowers ASR to 23.3% and raises poisoned F1 to 39.6%, while unpoisoned F1 remains 41.5%. The CamoDocs slice best exposes the mechanism: CleanBase changes ASR from 37.2% to 36.2% without improving F1, whereas RSG lowers ASR to 14.7% and restores 6.8 F1 points. This is consistent with RSG retaining semantically close but lexically distinct neighbors, but it is not a causal proof for every attack family.

Cross-system weakness also matters. On NQ and HotpotQA, and on every BGE-M3 system, budgeted detection is 73.6–96.3%; it falls to 59.2% on MS MARCO with E5-large-v2 and 43.4% on MS MARCO with MiniLM-L6-v2. The authors offer one possible factor: short, topically repetitive web passages may raise each document's local floor and reduce density contrast. That is a useful diagnostic hypothesis, not a conclusion established by a separate intervention.

## Ablations and injection volume: which signals actually matter

![RAGSieve Figure 5: component ablation for the four RSQ branches and the two RSG branches.](/paperReading/55-ragsieve-rag-poison-detection/paper/figure-5-component-ablation.svg)

*Figure 5 (original paper Figure 5, Sections 6.3 and 7.3): panel (a) removes one RSQ branch at a time and reports poison removed by the QA filter; panel (b) isolates RSG corpus-local contrast and script integrity under the 5% clean-removal budget. See the [original Figure 5 anchor](https://arxiv.org/html/2608.13010v1#S6.F5) and [original SVG endpoint](https://arxiv.org/html/2608.13010v1/fig_component_ablation.svg). The paper page marks [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); the v1 original is used with attribution and remains subject to the original license and copyright restrictions.*

The full RSQ QA filter removes 73.9% poison and 2.2% clean. Removing answer-anchor concentration drops poison removed to 47.6% and AUROC to 87.9%; removing surprisal yields 56.4% and 92.0% AUROC; removing query alignment yields 65.4% and 94.8% AUROC. Script integrity is a useful counterpoint: removing it leaves AUROC almost unchanged at 95.5%, but poison removed falls to 54.1% and clean removed to 0.1%. Ranking quality and a fixed-threshold intervention are therefore different objects; integrity can change the remove-or-keep decision more than aggregate ranking quality.

RSG also does not rely on graph evidence alone. On BGE-M3, the combined configuration reaches 94.3% AUROC, 86.2% budgeted detection, and 4.3% clean removal. Corpus-local contrast alone reaches 82.1%, 60.0%, and 4.2%; script integrity alone reaches 79.8%, 60.4%, and 0.7%. The combined gain exceeds 25 points, but that does not prove the two signals are statistically independent or that the same complementarity will hold on natural corpora.

![RAGSieve Figure 6: RSQ and RSG detection as the number of injected documents changes under the 5% clean-removal budget.](/paperReading/55-ragsieve-rag-poison-detection/paper/figure-6-injection-volume.svg)

*Figure 6 (original paper Figure 6, Section 7.3): on BGE-M3, macro-averaged over three datasets and six attacks, the figure compares one, three, five, and ten injected documents per target for both scopes; both curves use the 5% clean-removal budget. See the [original Figure 6 anchor](https://arxiv.org/html/2608.13010v1#S7.F6) and [original SVG endpoint](https://arxiv.org/html/2608.13010v1/fig_injection_volume.svg). The paper page marks [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); attribution is retained, the v1 original is used, and reuse remains subject to the original license and copyright restrictions.*

Figure 6 is best read as reference contamination. RSG moves from 61.8% detection with one document to 84.2% with three, then remains around 86.1–86.2% from five to ten; more coordinated documents give corpus-local graph evidence more support. RSQ rises from one to five documents, but drops from 84.2% to 63.9% at ten because a fixed top-20 window may place poison into ranks 6–20 and contaminate the query-local reference. This does not mean that RSG is always stronger than RSQ; it means their failure modes differ as injection volume changes.

The parameter sweeps make the policy cost visible. Lowering the RSQ information gate from five bits to four raises maximum clean removal from 4.0% to 7.0%; raising it to six keeps maximum clean removal at 4.0% but lowers poison removal to 70.5%. Raising the query-tail level from $\alpha=0.05$ to 0.10 raises maximum clean removal to 11.0%; lowering it to 0.025 lowers poison removal to 65.4%. Changing the RSG graph neighborhood from 16 to 8 or 32 changes detection by less than one point; raising the alert budget from 2.5% to 10% raises poison removal from 76.3% to 88.3%, while clean removal reaches 7.6% at the 10% budget. The threshold is a security–utility policy, not a decorative hyperparameter.

## Result 3: serial deployment and cost

### The union of two scopes

The serial RSG + RSQ path first quarantines corpus documents with RSG, then sends the surviving ranking through RSQ, and finally refills five context documents from the saved ranking. The two filters do not perform the same job at the same time: RSG handles persistent corpus state before a request exists; RSQ handles residual evidence for the active query.

![RAGSieve Figure 7: security–utility results for RSG quarantine followed by RSQ filtering.](/paperReading/55-ragsieve-rag-poison-detection/paper/figure-7-joint-qa.svg)

*Figure 7 (original paper Figure 7, Section 8): panel (a) compares ASR with unpoisoned-retrieval F1, while panel (b) breaks ASR down by the six attacks; values are macro-averaged over the nine target systems. See the [original Figure 7 anchor](https://arxiv.org/html/2608.13010v1#S8.F7) and [original SVG endpoint](https://arxiv.org/html/2608.13010v1/fig_joint_qa.svg). The paper page marks [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); attribution is retained and the v1 original is used subject to the original license and copyright restrictions.*

At the document level, the union detects 84.8% of injected documents while removing 4.7% of clean corpus documents; within the original top-five generation candidates, the corresponding values are 89.8% and 6.5%. At the QA layer, no defense, RSQ, RSG, and RSG + RSQ have ASR of 67.4%, 27.6%, 23.3%, and 14.0%; poisoned-retrieval F1 of 26.5%, 36.9%, 39.6%, and 40.5%; and unpoisoned F1 of 42.1%, 41.6%, 41.5%, and 41.3%. CPA-RAG remains the hardest attack slice: serial deployment leaves 34.0% residual ASR, below RSQ's 72.3% and RSG's 40.0%, but not zero.

The results support complementary coverage from two control points, not the claim that every claim will be verified after serial filtering. Serial deployment can still quarantine a true but rare document, or miss a single fluent poison that forms neither a local graph signal nor an unusual query-local pattern. Persistent RSG false positives deserve review, rollback, and index versioning because their effect can outlast one request.

### Cost is a control-point trade-off

![RAGSieve Figure 8: RSQ online latency and RSG offline corpus-scan cost.](/paperReading/55-ragsieve-rag-poison-detection/paper/figure-8-detection-cost.svg)

*Figure 8 (original paper Figure 8, Section 9): the upper panel compares post-retrieval mean latency on three BGE-M3 systems; the lower panel compares one scan of a 128,544-document NQ PR-W BGE-M3 snapshot. The axes are logarithmic, and the two workloads are not one common latency metric. See the [original Figure 8 anchor](https://arxiv.org/html/2608.13010v1#S9.F8) and [original SVG endpoint](https://arxiv.org/html/2608.13010v1/fig_detection_cost.svg). The paper page marks [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); attribution is retained, the v1 original is used, and reuse remains subject to the original license and copyright restrictions.*

With models resident and retrieval and loading excluded, RSQ averages 447.3 ms/query, has a 542.4 ms P95, and uses 3.87 GiB. It is slightly below GMTP's 491.3 ms mean, slower than TrustRAG's 70.8 ms, and faster than RAGuard's 747.5 ms and EcoSafeRAG's 943.3 ms. RSG scans a 128,544-document NQ PR-W BGE-M3 snapshot (128,044 clean and 500 injected) in 46.540 s, or 0.3621 ms/document at 2,762 documents/s and 1.01 GiB peak memory. Generic outlier methods take 1.04–2.28 s, CleanBase 262.107 s, and AHD 1,024.072 s. RSG is 20–45× slower than generic outlier scoring, but 5.6× faster than CleanBase and 22× faster than AHD.

Cost must be interpreted by workload. RSG can be amortized across ingestion batches or periodic audits and does not add query-path latency; RSQ charges active requests a subsecond post-retrieval cost. The measurements exclude model and index construction, document encoding, retrieval, QA, warm-up, and provider queues, so they do not directly establish a production SLA or total cost of ownership.

## Limitations, threats, and unsupported interpretations

### Promotion detection is not truth verification

This is the most important semantic boundary. RAGSieve's $E_a$ measures answer-anchor concentration, $E_p$ measures a local NLL transition, and $D_i$ measures semantic–lexical graph density. These are evidence patterns associated with promotion. A legitimate, correct, highly repetitive result set can score high if the retrieval tail does not contain the same answer vocabulary. Conversely, a false but fluent, isolated document without a script mismatch may lack enough signal. The detection score is not a claim posterior and is not a factuality verdict.

### A local reference can be removed or exploited

RSQ depends on a predominantly clean retrieval tail. When many poison documents reach ranks 6–20, the reference is contaminated; the ten-document injection result already shows separation falling. RSG depends on sparse, coordinated injection leaving graph structure; a single fluent poison, low inter-poison similarity, or wholesale index compromise may violate its signal model. The authors note that their attacks do not jointly optimize against RSG's semantic-closeness and lexical-diversity constraints, so detector-aware graph dispersion remains open.

Surprisal is evidence rather than a necessary condition: the fluent CPA-RAG attack produces the highest residual online ASR. Query alignment also cannot alone trigger a reliable decision because 15 tail documents give coarse probability resolution. A larger retrieval window may improve resolution, but it also changes contamination risk and runtime.

### Evaluation and external validity

The paper uses synthetic payloads, sampled corpora from three benchmarks, 100 attack targets, a fixed `deepseek-v4-flash` judge, and selected thresholds. It does not report confidence intervals, seed variance, natural-poison prevalence, or multi-tenant authorization interactions in this version. RSG's 43.4% budgeted detection on MS MARCO + MiniLM also shows that retriever choice, document length, and corpus topology affect the signal. A shared 5% clean-removal point is useful for comparison, but offline quarantine can affect many future requests and should not be treated as the same risk as one request-level removal.

### What must happen after an alert

The paper's protection targets are the evidence selected for generation and the answer produced from it. RAGSieve is not an access-control system, provenance store, human moderation queue, citation validator, or data-deletion protocol. A real deployment should retain the alert score, original rank, document and index version, tenant scope, source identity, decision reason, and rollback path. Without those records, a persistent RSG quarantine can turn a relative statistical signal into an untraceable deletion.

## Engineering judgment: when to use it and when not to

The following is a **Bloss0m engineering synthesis**, not a third method claimed by the paper. It places the paper's two control points inside a broader governance loop:

1. **Ingestion and audit gate (RSG)**: For every new batch, compute corpus-local graph and script-integrity signals. Route alerts to review, then use provenance, ACL, source trust, document version, and risk tier to decide quarantine. Do not equate `flagged=true` with deletion.
2. **Request gate (RSQ)**: For an active query, preserve the top-20 ranking, score components, and original ranks. If top-five candidates are flagged, refill from the saved ranking and record clean utility, answer citations, and fallback rate.
3. **Claim verification**: For high-risk answers, independently check source authorization, cross-source agreement, time validity, or human review. This layer answers whether a claim is trustworthy; local contrast does not replace it.
4. **Calibration loop**: Build dataset–retriever–tenant slices from benign traffic and replay attacks. Measure false-positive cost, tail contamination, RSG persistence, latency P95, and drift. A threshold is a policy choice and should not be copied unchanged from the paper.
5. **Incident response**: Keep alert evidence, document hash, embedding and index version, query context, decision timestamp, and rollback. If promotion is visible but truth is unresolved, isolate the evidence path and track truth verification separately from content remediation.

### Good adoption conditions

- The corpus is continuously updated by external contributors, crawlers, shared storage, or connectors, and the operator can access document text and retriever embeddings.
- The query path can retrieve at least the top 20 and refill from the original ranking.
- The team treats detection as triage and has separate provenance, ACL, review, and factuality controls.
- The team can accept that an offline false positive may persist across requests and can calibrate each retriever and corpus slice.

### Conditions for not adopting it directly

- Only the top five are available, the retrieval tail is inaccessible, or replacements are rescored in a way that changes the paper's protocol.
- The corpus is already broadly or synchronously compromised, so the local reference no longer represents background.
- The system needs a legal, medical, or financial truth/provenance guarantee but has no independent verification source.
- Ingestion has no versioned rollback and cannot absorb the cost of persistently quarantining a clean document.
- The requirement is a provable worst-case adaptive-robustness guarantee, cross-provider SLA, or natural-poison prevalence estimate that the paper does not supply.

## Artifact status and reproducibility

### Independent checks as of September 17, 2026

| Artifact | Direct endpoint and status | What it enables | What it does not establish |
| --- | --- | --- | --- |
| arXiv v1 paper | [v1 abstract](https://arxiv.org/abs/2608.13010v1), [v1 HTML](https://arxiv.org/html/2608.13010v1), [v1 PDF](https://arxiv.org/pdf/2608.13010v1), and [TeX source](https://arxiv.org/src/2608.13010v1) are reachable; the page marks CC BY-NC-SA 4.0. | Read the full body and appendices, retrieve v1 figures, and check tables and equations. | It is not peer reviewed; arXiv v2 exists, so the latest version cannot silently replace the v1 evidence used here. |
| MIT repository | The [GitHub repository](https://github.com/XrazyMee/RAGSieve) and [README](https://raw.githubusercontent.com/XrazyMee/RAGSieve/main/README.md) are reachable; `main` HEAD is `2be192e`, MIT licensed, with no GitHub release, tag, or bundled checkpoint. | Inspect `src/ragsieve/` for RSQ, RSG, retrieval, filtering, and metrics; inspect the demo, artifact guide, and data schemas. | It is not a sealed environment that reproduces every paper table with one command; the current README follows newer preprint figure naming and is not a v1 reproduction manifest by itself. |
| Released datasets | `data/datasets/` includes sampled queries, corpora, qrels, targets, counterfactuals, and 100-query subsets for NQ, HotpotQA, and MS MARCO. `data/demo/` includes four NQ targets, 20 poison fixtures, contexts, labels, and a 520-document RSG snapshot. | Read the released text corpus without downloading dataset preprocessors; build local embeddings from the README instructions and run the curated demo. | Dense vectors are not in the repository; the underlying datasets retain their original licenses and are not covered by the repository's MIT license. |
| Models and indices | The README and `pyproject.toml` require Python 3.11–3.12, `uv`, PyTorch, and Transformers. BGE-M3, E5, MiniLM, Qwen3, and BERT weights download on first use; CUDA is recommended. `data/indices/`, `models/`, and `.env` are gitignored. | With a GPU, model downloads, and storage, build indices and run the RSQ/RSG detectors; QA additionally needs an OpenAI-compatible endpoint. | No prebuilt embeddings, model checkpoints, complete optimization traces, or paper-scale generated outputs are bundled; without GPU and provider credentials, full QA reproduction is not available. |
| Attack and anonymous artifacts | The MIT repository supplies demo attack fixtures, evaluation commands, and filtering. Its README says complete attack-generation implementations are not included. The v1 paper's anonymous Open Science URL currently returns HTTP 401, so it is a gated or unavailable direct endpoint for anonymous reproduction. | Inspect the detector, demo attack data, and metrics schema; replay conditional attack files of your own. | It is not justified to claim that every attack generator, optimization trace, or original v1 experiment output is fully public. |

I therefore classify the release as **accessible code and data, inspectable demo, conditionally feasible paper-scale reproduction, and no complete sealed v1 reproduction**. The smallest useful reproduction is to install the environment, build a BGE-M3 index for one released dataset or the demo, run RSQ and RSG, compare detection and clean utility before and after filtering, and then test false positives in a provenance and truth-review queue. That is a Bloss0m recommendation, not a production recipe completed by the paper.

## Related reading and what to read next

For the basic path from external retrieval to an answer, read [Retrieval-Augmented Generation](/en/paper-reading/31-retrieval-augmented-generation/). For query-local evidence discovery, continue with [DocMemo](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/); for how external content can cross an agent boundary, read [Indirect Prompt Injection](/en/paper-reading/42-indirect-prompt-injection/). RAGSieve adds a retrieval-supply-chain integrity angle: after asking whether evidence can be found, it asks whether the evidence was promoted in a suspicious way, while leaving source authorization and truth validation as separate controls.

## Three things to remember

1. **Technical idea**: RAGSieve contrasts against the inspected system's own local background—RSQ uses the query tail and RSG the corpus graph. Their references and failure modes differ.
2. **Evidence**: Under the v1 three-dataset, three-retriever, six-attack protocol, RSQ and RSG reach 82.2% and 79.8% budgeted detection; serial deployment reaches 14.0% ASR, but clean utility and attack slices must be read with it.
3. **Adoption boundary**: The score detects promotion patterns, not truth. It needs a retrieval tail or neighborhood, versioned actions, independent provenance and claim checks, and recalibration on the deployment's workload.

## Primary sources

- [RAGSieve arXiv v1 abstract and metadata](https://arxiv.org/abs/2608.13010v1)
- [RAGSieve arXiv v1 full HTML](https://arxiv.org/html/2608.13010v1)
- [RAGSieve arXiv v1 PDF](https://arxiv.org/pdf/2608.13010v1)
- [RAGSieve arXiv v1 TeX source](https://arxiv.org/src/2608.13010v1)
- [RAGSieve MIT repository](https://github.com/XrazyMee/RAGSieve)
- [RAGSieve artifact guide](https://github.com/XrazyMee/RAGSieve/blob/main/docs/ARTIFACT.md)
- [CC BY-NC-SA 4.0 license](https://creativecommons.org/licenses/by-nc-sa/4.0/)
