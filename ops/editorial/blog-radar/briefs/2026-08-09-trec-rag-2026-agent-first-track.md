---
stableId: "url:https://trec-rag.github.io/"
status: "durable-post-candidate"
firstSeenAt: 2026-08-09
lastVerifiedAt: 2026-08-09
primaryCategory: "AI Engineering"
primaryCluster: "enterprise-rag"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 5
  total: 24
decision: "durable-post-candidate"
---

# TREC RAG 2026: an agent-first evaluation track

## Identity

- Search window: 2026-08-08 08:58–2026-08-09 08:58 Asia/Taipei; seven-day backfill from 2026-08-02.
- Discovery queries: TREC RAG 2026 agent-first track; RAGDoll evaluation toolkit; ClimbMix-400b retrieval corpus; current AI engineering benchmark releases.
- Canonical URL: https://trec-rag.github.io/
- Publisher or author: TREC RAG organizers; NIST TREC evaluation track.
- Published or updated date: The homepage has no article publication date. The official site repository records updates on 2026-08-08 23:33–23:44 UTC, including the retrieval-task description and deadline notice: https://github.com/TREC-RAG/trec-rag.github.io/commits/main.
- Source type: standard
- Direct supporting sources: https://github.com/castorini/RAGDoll; https://github.com/TREC-RAG/trec-rag-skills; https://trec-rag.github.io/.

## Editorial fit

- Why now: The 2026 run deadline was 2026-08-08, and the official track now frames RAG evaluation around agent-first retrieval and generation tasks, with a public toolkit and corpus transition.
- Reader question: What should a production RAG evaluation measure when retrieval, evidence selection, and answer generation are one agent workflow?
- Category and topic cluster: AI Engineering; enterprise-rag.
- Existing coverage and duplication risk: No exact TREC RAG 2026 coverage was found. It complements existing RAG architecture, BM25-at-scale, and agent-evaluation coverage rather than replacing them.
- Why this remains useful after the current news cycle: The task definitions, corpus, run format, and evaluation toolkit are reusable infrastructure for comparing retrieval and grounded-answer systems after the deadline.

## Claim map

- Primary claim: TREC RAG 2026 is an agent-first evaluation track with separate Retrieval and Retrieval-Augmented Generation tasks, official test topics, a new ClimbMix-400b corpus, and the RAGDoll evaluation workflow.
- Measured evidence: The official page defines the tasks and submission timeline; RAGDoll exposes local commands for materializing prompts, judging relevance, generating nuggets, resolving citations, and computing support metrics.
- Vendor or author claims requiring qualification: The organizers describe the track as a unified benchmark and RAGDoll as an end-to-end workflow; this does not establish that any one metric or corpus is sufficient for production quality.
- Bloss0m engineering consequence: Treat retrieval recall, evidence support, citation resolution, answer quality, and agent trajectory as separate observable stages; preserve the exact run, prompt, corpus, and judge versions when comparing systems.

## Evidence audit

- Primary evidence inspected: Official TREC RAG homepage and timeline; official TREC-RAG skills repository; official Castorini RAGDoll repository.
- Baseline or comparison: The 2026 track separates retrieval-only output from grounded answer generation and replaces MS MARCO v2.1 with NVIDIA ClimbMix-400b; RAGDoll documents UMBRELA-style relevance, Nuggetizer-style rubric generation, and citation support scoring.
- Missing evidence: 2026 results, manual judgments, inter-rater agreement, corpus license details, and independent validation of the RAGDoll prompts are not yet available.
- Conflicts or uncertainty: The homepage is continuously updated and does not expose a publication timestamp; the current state is anchored to official repository commits and must not be described as a dated announcement beyond those commits.

## Recommended treatment

- Output level: durable-post-candidate
- Proposed angle: “RAG evaluation is becoming an agent workflow: what TREC RAG 2026 makes observable, and what it still leaves unknown.”
- Internal routes: `03-RAG-ANYTHING`; `04-RAG-MCP`; `13-bm25-wins-at-scale`; `08-osreward-agent-evaluation`; the `enterprise-rag` cluster.
- Human decision required: Decide whether to write a benchmark/infrastructure explainer before results arrive or wait for TREC judgments; verify corpus licensing and the final scoring protocol before publication.
