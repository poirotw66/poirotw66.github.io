---
stableId: "arxiv:2609.08887"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-11
lastVerifiedAt: 2026-09-11
primaryTrack: "retrieval-systems"
primaryGap: "rag-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# Q2D-Web：把 Agentic RAG 的第一階段檢索拉到 production scale

## Identity

- Search window: strict 72-hour scan ending 2026-09-11; arXiv v1 was submitted on 2026-09-08.
- Canonical URL: https://arxiv.org/abs/2609.08887
- Authors: Maximilian Schall, Sedigheh Eslami, Markus Krimmel, Antoine Chaffin, Louis Milliken, Bo Wang, and Denis Bykov.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-08; not peer-reviewed.
- DOI / OpenReview / arXiv aliases: https://doi.org/10.48550/arXiv.2609.08887
- Code / model / data: Public leaderboard https://huggingface.co/spaces/perplexity-ai/q2d-web-leaderboard; full corpus and query release status require verification, and no public code repository was identified from the primary record.

## Editorial fit

- Reader question: How should we evaluate a first-stage retriever when the production query is rewritten by an agent, the corpus has hundreds of millions of documents, and one relevance label is not enough?
- Why this belongs in the selected track: Q2D-Web directly targets the retrieval-evaluation gap between small academic benchmarks and the scale, language mix, and machine-reformulated queries of deployed agentic search.
- Gap it fills: RAG evaluation—separating corpus reachability, first-stage ranking, evidence-label quality, and downstream agent behavior under a fixed evaluation budget.
- Why now: An agent can only cite what the first-stage retriever makes available. A benchmark that ranks retrievers on human-written queries and small corpora can miss failures caused by agent reformulation, multilingual distribution, or plausible web distractors.

## Claim map

- Problem: Existing benchmarks often trade corpus scale for query count, or use human-written queries rather than the machine-reformulated queries served by agentic RAG systems.
- Main claim: A benchmark with approximately 190M web documents, approximately 70k agent-reformulated queries in ten languages, and multiple relevance-judgment sources can reveal retriever differences that smaller or single-label evaluations hide.
- Method: Build a production-sampled, PII-free corpus and query set; construct judgment sets from agent citations, production rankings, and LLM judgments of pooled candidates; compare lexical, dense, and late-interaction retrievers; then test whether a smaller RRF-selected subcorpus preserves system ordering.
- What is genuinely new: It treats benchmark scale, machine-written query distribution, and label-source disagreement as one evaluation design problem, and reports a practical subcorpus approximation instead of assuming a full web corpus is always required.

## Evidence audit

- Datasets: Approximately 190M web documents and approximately 70k agentic search queries in ten languages sampled from nine months of PII-free production traffic.
- Benchmarks and metrics: Thirteen retrievers are evaluated with Recall@1000 and nDCG@10 under agent-citation, production-ranking, and combined relevance judgments; the paper also analyzes primary versus supporting queries and topical/language/query-type differences.
- Baselines: Lexical, dense, and late-interaction retrieval architectures are included; exact model configurations and all comparison tables require full-paper extraction.
- Ablations: The paper compares judgment sets, retriever families, query types, and subcorpus sizes. A third of the corpus selected by reciprocal rank fusion preserves full-corpus model ordering under the combined labels while changing absolute Recall@1000 by 3–7 points.
- Statistical uncertainty: The abstract and HTML record expose rankings and aggregate comparisons, but independent replication, confidence intervals for every headline result, and sensitivity to LLM-label noise require deeper audit.
- Threats to validity: Production sampling may not transfer to other search products; agent citations and production rankings are imperfect relevance signals; LLM labels can introduce judge bias; the full web corpus and query privacy boundary may limit external reproduction.

## Reproducibility

- Available artifacts and licenses: ArXiv HTML/PDF and a public Hugging Face leaderboard are available. The full 190M-document corpus, query set, judgments, and runnable evaluation code were not verified as publicly downloadable from the primary record.
- Environment or compute requirements: Large-scale indexing or retrieval evaluation, multilingual query processing, substantial storage, and access to the benchmark’s data or a licensed substitute.
- Smallest useful reproduction: Use a released or synthetic subset with the same three judgment-source distinction, compare BM25/dense/late-interaction retrieval, and test whether RRF-selected subcorpus ordering matches full-corpus ordering.
- Blocking unknowns: Exact data access, deduplication and crawl policy, query-release granularity, judgment sampling, random seeds, licensing, and the cost of reproducing all 13 retriever runs.

## Critical reading

- Strongest result: It makes first-stage retrieval evaluation look like a production systems problem rather than a small QA leaderboard, and it reports a potentially useful speed/scale trade-off without claiming absolute recall is unchanged.
- Weakest assumption: Agent citations and production ranking behavior are sufficiently informative to construct reusable relevance judgments, even though they reflect existing system biases.
- Stated limitations: The benchmark’s production origin, label construction, and subcorpus approximation define a specific evaluation population; preserving model order does not mean preserving every absolute metric or downstream answer.
- Claims not supported by the evidence: The paper does not establish that the benchmark predicts every enterprise RAG workload, that the top retriever is universally best, or that an RRF-selected third is safe for all ranking decisions.

## Bloss0m connection

- Related Traditional Chinese routes: RAG evaluation, GraphRAG, production RAG, selective context trust, and agentic search.
- Related English routes: The paired retrieval-system routes after archive-aware lookup.
- Duplication risk: Low; it adds production-scale agent-reformulated retrieval evaluation rather than another reranker or GraphRAG architecture.
- Suggested internal links: Pair with PAGE-RAG for fixed-budget evidence selection, SCOPE for selective trust, and existing RAG-MCP coverage for tool-mediated retrieval.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: exceptional scale, a clear priority gap, multiple judgment sources, a practical sampling result, and direct consequences for how teams choose and evaluate retrievers. Reproducibility is capped because the full data/code release and the privacy/licensing boundary are not yet verified.
- Open questions requiring human approval: Can an external team reproduce the retriever ordering on an accessible slice? How much do production query reformulations, multilingual mix, and citation behavior change the leaderboard? Does preserving retriever order preserve downstream answer quality and citation trust?
