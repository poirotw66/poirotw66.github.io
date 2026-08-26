---
title: "DocMemo: Letting Long-Document RAG Recover from a Bad First Retrieval"
description: "A deep reading of DocMemo: document schema, page belief, and question episodic memory preserve retrieval state across rounds, while Bayesian updates, Thompson sampling, and adaptive granularity recover missed evidence."
pubDate: 2026-08-12
updatedDate: 2026-08-12
tldr:
  - "DocMemo reframes long-document QA from one-shot top-k page selection into evidence exploration that can revise its search trajectory."
  - "Tri-level memory, Bayesian page-belief updating, Thompson sampling, and local visual crops work together for cross-round retrieval; the paper reports 77.6 average accuracy across three benchmarks."
  - "The evidence supports evidence recovery in long-document visual QA, not arbitrary enterprise-RAG reliability or cost guarantees. The repository exposes code and commands, while data, model, license, and full cost remain to be verified."
audience:
  - "AI engineers working on long-context, multimodal RAG, retrieval evaluation, or evidence lineage"
  - "Platform teams that need to know whether retrieval missed a key page, table, figure, or unanswerable case"
tags: ["Paper Reading", "RAG", "Retrieval", "Multimodal", "Evaluation", "AI Engineering"]
image: "/paperReading/21-docmemo-dynamic-evidence-discovery/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
  - agent-memory-adaptation
paper:
  title: "DocMemo: Dynamic Evidence Discovery via Probabilistic Memory-Guided Retrieval for Multi-Modal Document Understanding"
  authors:
    - "Hanshu Yao"
    - "Jianfeng Zhong"
    - "Niu Lian"
    - "Jinpeng Wang"
  year: 2026
  venue: "arXiv 2608.07067 v1 (2026-08-07; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.07067v1"
    arxiv: "https://arxiv.org/abs/2608.07067"
    code: "https://github.com/Harrygof/DocMemo"
---

## The paper in 90 seconds

- **Problem:** Evidence in long documents can be spread across dozens of pages, tables, figures, and cross-page clues. Static retrieval fixes a top-k page pool at the start; if the first pass misses evidence, the reasoner has no state that explains which pages may still help, which were ruled out, or what remains missing.
- **Core insight:** Turn retrieval into dynamic evidence exploration. Document Schema Memory stores document structure, Page Belief Memory updates page relevance beliefs, and Question Episodic Memory records discoveries and query refinement for the current question.
- **Strongest evidence:** On MMLongBench-Doc, LongDocURL, and PaperTab, DocMemo reports accuracy of 71.3, 81.1, and 80.4, for a 77.6 average. Table 4 also shows MMLongBench-Doc accuracy falling from 71.3 to 68.5 or 68.8 when memory or Bayesian updating is removed.
- **Main boundary:** Evaluation depends on a GPT-4.1 binary judge, PDF rendering, Qwen3.5-VL-9B, ColQwen2.5, MinerU, and annotations from three benchmarks. It does not establish citation faithfulness, access-control correctness, freshness, or total cost on arbitrary enterprise corpora.

The bounded verdict is: **writing retrieval feedback back into page belief can recover more evidence in long-document QA, but this remains a retrieval method bounded by a particular visual-QA stack, not a universal RAG reliability layer.**

## What to know first

Retrieving top-k chunks after splitting a document is simple and often fast, but an early ranking error can lock reasoning onto the wrong page pool. Iterative retrieval is more flexible, yet if each round starts from scratch it still does not know what was seen, which pages were judged irrelevant, or which query refinement already failed.

DocMemo defines the missing piece as state propagation. The system needs to carry document structure, page relevance, and question-local discoveries between rounds instead of merely adding more retrieval calls.

This makes the paper a useful companion to Bloss0m's [RAG-ANYTHING multimodal RAG reading](/en/paper-reading/03-rag-anything/), [GraphRAG vs. RAG evaluation](/en/paper-reading/07-graphrag-vs-rag/), [BM25 Wins at Scale](/en/paper-reading/13-bm25-wins-at-scale/), and [FinRank evidence-grounded retrieval](/en/paper-reading/18-finrank-evidence-grounded-rag/): the earlier readings cover representation and retrieval choices, while the latter two emphasize evidence coverage, negative cases, and evaluation protocol rather than answer score alone.

## Why static top-k is insufficient

Suppose the answer is distributed across page 37 and page 91, but the first pass retrieves pages 4, 8, and 12. A static retriever can leave the reasoner with a plausible answer built from the wrong context. Even with a second pass, a system that does not retain which clues increased the probability of nearby pages, which pages were ruled out, and what the query still lacks can repeat the same search.

DocMemo frames this as a state-propagation problem: more retrieval rounds are not enough. The system needs a state that carries document structure, page relevance, and question-local findings across rounds.

## Core intuition

DocMemo's mental model is: **the first retrieval is an incomplete hypothesis, and reasoning feedback changes the page distribution explored next**.

The three memory levels have different jobs:

1. **Document Schema Memory:** offline document type, section layout, and structural page priors; query-independent.
2. **Page Belief Memory:** relevance beliefs for pages under the current query, updated with useful and irrelevant feedback.
3. **Question Episodic Memory:** evidence already found, information still missing, and refined queries, so the reasoning loop does not forget its discoveries.

![DocMemo Figure 2: tri-level memory and the memory-guided dynamic retrieval pipeline.](/paperReading/21-docmemo-dynamic-evidence-discovery/figure-2-docmemo-overview.png)

*Figure 2 (the paper's Figure 2 used here), the method overview in paper Section 3: the three memory levels feed Bayesian updating, Thompson sampling, LLM reranking, and adaptive-granularity evidence access. [Original figure](https://arxiv.org/html/2608.07067v1#S3.F2); image from the [arXiv HTML figure endpoint](https://arxiv.org/html/2608.07067v1/x3.png). The DocMemo arXiv page marks the work CC BY 4.0; attribution is preserved here under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).*

The image above is the paper's direct Figure 2 download, preserved as a repository asset; it is not the original Evidence Atlas cover used by the article. That distinction matters: the cover communicates the bounded engineering conclusion, while body figures provide paper evidence.

## Walk one example through the method

The following faithful walkthrough is derived from Figure 4 and the method sections; it is explanatory, not a new benchmark:

1. **Input:** A user asks a cross-page question about a financial or scientific document. The answer requires a definition in the prose and a value in a table.
2. **Intermediate representation:** Schema Memory supplies section and page layout; a visual retriever creates page candidates; Question Episodic Memory records the query, the definition already found, and the missing table evidence.
3. **Decision:** The reasoner labels pages as useful, irrelevant, or unclassified. Page Belief Memory applies a Beta-Bernoulli update, raises the posterior mean for useful pages, propagates positive feedback to nearby pages, and uses Thompson sampling to preserve exploration of uncertain pages.
4. **Output:** The next round reselects and reranks pages using the updated beliefs, then requests finer-grained crops around the table or figure before the reasoning VLM answers.
5. **Likely failure point:** If the first reasoner labels a relevant page irrelevant, the belief state can propagate the mistake. If OCR, visual embeddings, or page adjacency do not fit the document layout, adaptive crops may only increase resolution on the wrong page.

## Technical mechanism

### 1. Bayesian page-belief updating

DocMemo maintains a Beta prior $(\alpha_i,\beta_i)$ for page $p_i$. After each round produces useful pages $U_t$ and irrelevant pages $V_t$, it updates:

$$\alpha_i\leftarrow\alpha_i+\mathbb{I}[i\in U_t],\qquad\beta_i\leftarrow\beta_i+\mathbb{I}[i\in V_t]$$

The page posterior mean is:

$$\mu_i=\frac{\alpha_i}{\alpha_i+\beta_i}$$

$\mu_i$ is accumulated relevance confidence, not the truth probability that a page contains the answer. Positive feedback is also propagated to neighboring pages using a radius $r$ and decay $\gamma$, because evidence from one section often clusters on adjacent pages.

### 2. Thompson sampling: do not lock too early

Greedy ranking by posterior mean can let pages chosen by chance in round one occupy the budget forever. Thompson sampling samples from each page's Beta posterior, preserving exploration while exploiting accumulated evidence. In Appendix C.8, replacing Thompson sampling with greedy selection reduces overall accuracy from 71.28 to 68.62.

### 3. Adaptive-granularity evidence access

Page-level retrieval works for whole-page text and layout, but tables, figures, or dense local regions can be diluted by a full-page representation. DocMemo extracts local visual regions for candidate pages during reasoning. The implementation details and Table 5 specify up to five table crops per query, a 1,500-pixel maximum image long side, and MinerU for structure-aware table and figure crops.

### 4. The three-round loop

1. Build initial candidates from offline page embeddings and schema summaries.
2. Select pages with the retrieval agent, Thompson sampling, and LLM reranking.
3. The reasoning VLM reads pages and local crops, then emits an answer, useful pages, irrelevant pages, notes, and a refined query.
4. Write feedback into Page Belief Memory and Question Episodic Memory.
5. If evidence is insufficient, enter another round, up to $T=3$ retrieval-reasoning cycles.

## How to read the evidence

### Table 3: accuracy across benchmarks

DocMemo reports accuracy of 71.3 on MMLongBench-Doc, 81.1 on LongDocURL, and 80.4 on PaperTab, for a 77.6 average. SimpleDoc reports 60.6, 72.3, and 65.4, for a 66.1 average. This supports the narrower claim that stateful dynamic retrieval achieves higher answer accuracy under these three long-document DocVQA protocols. It does not isolate every external factor, including preprocessing, visual embedding, prompts, checkpoint, and judge.

### Figure 3: evidence recovery as behavior

Figure 3 plots evidence recall and all-hit rate over iterative retrieval. The brief's verified record reports evidence recall increasing from 28.32% after round one to 69.56% after round three, and all-hit rate increasing from 12.90% to 58.05%. These curves answer “did the system recover missed pages?” more directly than a final answer score alone. Recall is still page-level coverage over benchmark annotations; it is not answer correctness or citation faithfulness.

![DocMemo Figure 3: iterative evidence discovery and relative efficiency.](/paperReading/21-docmemo-dynamic-evidence-discovery/figure-3-evidence-recall-efficiency.png)

*Figure 3, the central result in paper Section 4.4: the left side shows evidence recall and all-hit rate across retrieval-reasoning rounds, while the right side compares relative efficiency. [Original figure](https://arxiv.org/html/2608.07067v1#S4.F3); image from the [arXiv HTML figure endpoint](https://arxiv.org/html/2608.07067v1/x4.png). The DocMemo source is marked CC BY 4.0; attribution is preserved under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).*

### Table 4: which components change the result

On MMLongBench-Doc, the full model's overall accuracy is 71.28. Removing Document Schema Memory, Page Belief Memory, Question Episodic Memory, all memory, Bayesian updating, Thompson sampling, or adaptive granularity yields 70.16, 68.80, 69.02, 68.47, 68.80, 69.89, and 69.91. The pattern makes the roles of Page Belief, cross-round memory, and local visual access more diagnosable than attributing every gain to “multimodal RAG.”

### Appendix: iteration efficiency and judge verification

On MMLongBench-Doc, DocMemo averages 1.24 retrieval-reasoning iterations per question, while SimpleDoc always uses three. Under the paper's call-count proxy, DocMemo has 0.41 relative computation cost and 2.40 relative efficiency. That is not a dollar-cost measurement. The main evaluation uses GPT-4.1 as a binary judge; Appendix C.6 manually checks 300 questions and reports 96.7% agreement with Cohen's kappa of 0.92. This is a useful calibration slice, not independent human evaluation of every benchmark and evidence type.

![DocMemo Figure 4: a qualitative example of memory-guided iterative retrieval.](/paperReading/21-docmemo-dynamic-evidence-discovery/figure-4-qualitative-retrieval.png)

*Figure 4, the qualitative analysis in paper Section 4.5: retrieval feedback, belief updating, query refinement, and subsequent evidence access. [Original figure](https://arxiv.org/html/2608.07067v1#S4.F4); image from the [arXiv HTML figure endpoint](https://arxiv.org/html/2608.07067v1/x5.png). The DocMemo source is marked CC BY 4.0; attribution is preserved under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).*

## Evidence map

- **Paper directly supports:** Table 3 accuracy across three benchmarks, Table 4 component ablations on MMLongBench-Doc, Figure 3 iterative evidence recovery, Appendix C.5 call-based efficiency, and Appendix C.6's 300-question human verification.
- **Author interpretation:** tri-level memory and Bayesian belief updating propagate retrieval state across rounds; adaptive granularity matters especially for table-dense evidence; on-demand iteration can use fewer calls than a fixed three-round baseline.
- **Not established:** freshness, ACL or tenant isolation, citation faithfulness, dollar cost, and production latency on arbitrary enterprise corpora; GPT-4.1 judging, Qwen3.5-VL-9B, MinerU, and benchmark annotations remain major external-validity constraints.
- **Bloss0m engineering judgment:** the most portable pattern is to make evidence coverage and retrieval state observable, then add an unanswerable gate and citation checks so “not found yet” is not rewritten as “does not exist.”

## Limitations and unsupported interpretations

The limitations are not only about the size of the reported score. First, every evidence label comes through the reasoner and benchmark annotations; if page relevance is misclassified, the Bayesian state can amplify an early mistake. Second, the three benchmarks are long-document visual QA tasks and do not directly represent enterprise ACLs, update frequency, layout noise, or cross-tenant isolation. Third, the human verification checks only 300 MMLongBench questions, so it is not a full manual audit. Finally, relative computation cost is estimated from LLM/VLM call counts, not from a fixed dollar-cost measurement.

DocMemo **has not established** better general RAG citation faithfulness, production latency, data freshness, or security boundaries. Those claims require external evaluation with versioned corpora, access policies, and cost records.

## Artifacts and reproducibility

As of 2026-08-12, the [Harrygof/DocMemo repository](https://github.com/Harrygof/DocMemo) is public and exposes `agent`, `modules`, `pipeline`, `preprocess`, `prompts`, `scripts`, and `utils`. Its README documents Python 3.11, requirements, embedding, vLLM, summary, document-memory, and QA commands. This means **the code and documented pipeline are accessible**, not that full reproduction is complete.

The README asks users to supply the dataset PDFs. The Qwen3.5-VL-9B and ColQwen2.5-v0.2 weights, MinerU, vLLM, A100 hardware, checkpoint hashes, dataset license, exact commit, prompt and judge versions, and complete result archive still require separate verification. The repository root does not expose a confirmed LICENSE endpoint in the inspected source, so this article distinguishes “code and workflow readable” from “data, rights, and full reproduction verified.”

The smallest useful reproduction is a small MMLongBench subset with three retrieval-reasoning rounds, comparing static retrieval with DocMemo and reproducing evidence recall, all-hit rate, and the key Table 4 ablations. Full three-benchmark reproduction requires A100-class GPUs, multi-stage PDF preprocessing, offline embeddings and summaries, and a VLM service; a list of README commands is not a low-cost replication.

## Engineering decision and when not to use it

**Use it when:** document length and evidence density make one-shot top-k unreliable, and the team can retain page-level retrieval feedback, query refinement, unanswerable decisions, and citation anchors. Page Belief Memory can then become a retrieval observability layer rather than placing every memory in the prompt.

**Do not use it directly when:** the corpus requires strict ACL or tenant isolation, pages change without freshness invalidation, evaluation lacks human spot checks, or retrieval feedback can be poisoned by prompt injection. Add access-control filtering, versioned indexes, evidence provenance, unanswerable thresholds, and a cost budget before allowing cross-round exploration.

## Three things to remember

1. **Technical idea:** write reasoning feedback into page belief and episodic memory so the next round explores instead of guessing from scratch.
2. **Evidence:** benchmark accuracy, Table 4 ablations, Figure 3 evidence recovery, and appendix efficiency and human verification jointly support the narrower stateful-retrieval claim.
3. **Boundary:** the method improves evidence discovery in a particular long-document visual-QA setting; freshness, permissions, cost, and citation faithfulness for enterprise RAG remain unproven.

## Primary sources

- [DocMemo full arXiv HTML (v1, 2026-08-07)](https://arxiv.org/html/2608.07067v1)
- [DocMemo arXiv abstract and version record](https://arxiv.org/abs/2608.07067)
- [DocMemo official repository](https://github.com/Harrygof/DocMemo)
- [DocMemo README and reproduction commands](https://raw.githubusercontent.com/Harrygof/DocMemo/master/README.md)
- [DocMemo requirements.txt](https://raw.githubusercontent.com/Harrygof/DocMemo/master/requirements.txt)
- [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/)
