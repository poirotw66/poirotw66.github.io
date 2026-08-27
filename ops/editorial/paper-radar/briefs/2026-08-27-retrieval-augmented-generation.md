---
stableId: "arxiv:2005.11401"
sourceVersion: "v4"
status: "published"
firstSeenAt: 2026-08-27
lastVerifiedAt: 2026-08-27
primaryTrack: "retrieval-systems"
primaryGap: "classic-rag-foundation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "published"
---

# Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks

## Identity

- Stable ID: `arxiv:2005.11401`.
- Canonical URL: https://arxiv.org/abs/2005.11401
- Authors (v4 PDF / NeurIPS 2020 camera-ready): Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, Sebastian Riedel, and Douwe Kiela.
- Venue or review status: NeurIPS 2020; arXiv v4 PDF and HTML (last revised 2021-04-12). arXiv.org perpetual non-exclusive license; NeurIPS camera-ready additionally under conference copyright.
- DOI / aliases: arXiv-issued DOI `10.48550/arXiv.2005.11401`; NeurIPS hash `6b493230205f780e1bc26945df7481e5`.
- Code / model / data: Historical Transformers example at https://github.com/huggingface/transformers/tree/v4.21.3/examples/research_projects/rag (HTTP 200). Path `examples/rag/` on current `main` is 404. Model cards facebook/rag-sequence-nq and facebook/rag-token-nq return 200. Dataset facebook/wiki_dpr returns 200; short name datasets/wiki_dpr returns 404. Docs https://huggingface.co/docs/transformers/model_doc/rag return 200.

## Editorial fit

- Reader question: When generation must use knowledge a parametric model cannot hold or revise, is the missing control point whether retrieved Wikipedia passages may condition a seq2seq generator — and where does that stop being a production RAG platform?
- Why this belongs in the selected track: 2020 RAG is the classic ancestor of the retrieval-systems path. Later leaves (RAG-Anything, RAG-MCP, GraphRAG, DocMemo, BM25-at-scale, Before Reasoning Can Fail, FinRank) already assume “RAG” exists; this note teaches the BART + dense Wikipedia memory contract those leaves inherit.
- Gap it fills: Classic-foundation before production RAG: generation conditioned on latent documents, not hybrid stacks, tool routing, graphs, or agentic search/read/final.
- Why now: The retrieval path opened at RAG-Anything. This pair places the 2020 ancestor at the start of that path, parallel to the Agent map that filled CoT/WebGPT→ReAct, without inventing a full RAG reading-map blog.

## Claim map

- Problem: Parametric LMs lag on knowledge-intensive tasks; memory is hard to update or attribute; differentiable retrievers had been shown mainly for extractive QA.
- Main claim: Finetune a pretrained seq2seq generator with a pretrained dense retriever over Wikipedia; RAG-Sequence shares one document per sequence, RAG-Token may switch per token. SOTA on NQ, WebQ, CuratedTrec (TriviaQA only on the T5 Wiki split).
- Method: DPR bi-encoder + BART-large; marginalize latent $z$; freeze document encoder/index; finetune query encoder and generator; FAISS HNSW over 21M 100-word chunks from December 2018 Wikipedia.
- What is genuinely new: A general-purpose generative fine-tuning recipe that attaches non-parametric Wikipedia memory to seq2seq, rather than extractive readers or closed-book T5.

## Evidence audit

- Datasets: NQ, TriviaQA, WebQuestions, CuratedTrec, Open MS-MARCO NLG v2.1, SearchQA Jeopardy splits, FEVER 3-way and 2-way.
- Benchmarks and metrics: Exact Match; Bleu-1 / Q-BLEU-1 / Rouge-L; FEVER label accuracy; distinct trigram ratio; 452-pair human factuality/specificity; 82-leader index hot-swap.
- Baselines: T5-11B / T5-11B+SSM; REALM; DPR retrieve-and-extract; BART-large; gold-context MS-MARCO and FEVER-2 SOTA rows (starred).
- Ablations: Table 6 BM25 vs frozen vs learned retriever; Figure 3 test-time $k$; Appendix F null document (omitted); Appendix H retrieval collapse.
- Statistical uncertainty: Main tables are point estimates; Jeopardy human eval reports majority categories including No majority.
- Threats to validity: TriviaQA two test sets; Table 4 prose 17% vs Both good 11.7%; specificity column sums to 93%; Wikipedia dump mismatch blocks FEVER evidence-sentence subtask; Transformers example path gone from current main.

## Reproducibility

- Available artifacts and licenses: arXiv v4 HTML / PDF under arXiv perpetual non-exclusive license; NeurIPS 2020 PDF; historical Transformers RAG example; HF model cards; facebook/wiki_dpr.
- Environment or compute requirements: eight 32GB V100 GPUs, ~100GB CPU for the uncompressed FAISS index (36GB compressed); single-GPU training/inference claimed.
- Smallest useful reproduction: greedy decode facebook/rag-sequence-nq on a handful of NQ items and confirm retrieved Wikipedia chunks condition generated text. Do not claim Table 1 44.5.
- Blocking unknowns: original Fairseq training run; the live Wikipedia 2018 index snapshot used for Table 1; current-main Transformers example path.

## Critical reading

- Strongest result: Table 1 NQ RAG-Seq 44.5 vs DPR 41.5 / T5-11B+SSM 36.6, plus Table 2 MS-MARCO +2.6 vs BART and FEVER-3 72.5 without retrieval supervision, plus Table 6 showing learned retrieval on QA and BM25 winning FEVER.
- Weakest assumption: That a single public Wikipedia dump plus dense MIPS is a sufficient non-parametric memory for “knowledge-intensive NLP,” including private corpora.
- Stated limitations: Wikipedia bias; possible misuse as a language model; retrieval collapse on some generation tasks; no FEVER evidence-sentence subtask.
- Claims not supported by the evidence: production hybrid RAG, citation-faithfulness products, agentic search/read/final, Self-RAG, or later leaf numbers on this site.

## Bloss0m connection

- Related Traditional Chinese routes: `03-RAG-ANYTHING`; `04-RAG-MCP`; `07-GraphRAG-vs-RAG`; `13-bm25-wins-at-scale`; `15-before-reasoning-fails`; `18-finrank-evidence-grounded-rag`; `21-docmemo-dynamic-evidence-discovery`; blog `08-efficient-paper-reading-three-pass`.
- Related English routes: paired English routes for the same entries.
- Duplication risk: Low. Existing RAG notes are 2025–26 leaves. No prior Bloss0m paper-reading teaches Lewis et al. 2020.
- Suggested internal links: the retrieval leaves listed above; three-pass method. Do not rewrite blog 91.

## Recommendation

- Output level: Deep Read.
- Score rationale: Landmark method, multi-task evidence with honest TriviaQA and FEVER/BM25 negatives, and still-reachable HF checkpoints justify publication; missing current-main example path keeps reproducibility at 4 rather than 5.
- Open questions requiring human approval: none for this approved publication request; keep TriviaQA 56.8 vs DPR 57.9 explicit; do not back-port later leaf or agentic RAG numbers.
