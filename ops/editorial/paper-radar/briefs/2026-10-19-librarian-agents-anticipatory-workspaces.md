---
stableId: "arxiv:2610.22273"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-10-19
lastVerifiedAt: 2026-11-06
primaryTrack: "retrieval-systems"
primaryGap: "rag-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# Librarian Agents: Training LLMs to Curate Long-Context Workspaces that Anticipate Future Queries

## Identity

- Canonical URL: https://arxiv.org/abs/2610.22273
- Authors: Anikait Singh, Teresa Zhang, Yoonho Lee, Roshen Sanjay Nair, Aviral Kumar, and Chelsea Finn (Stanford University and Carnegie Mellon University).
- Venue or review status: arXiv v1, submitted 2026-10-15; no peer-reviewed venue verified.
- DOI / OpenReview / arXiv aliases: arXiv:2610.22273v1; no other canonical identifier verified.
- Code / model / data: [MIT repository](https://github.com/teresaz05/librarian-agents) contains environment, training/retrieval code, configs, scripts, compact result records, tests, and reproduction guidance. Paper-reported synthetic artifacts/results are CC BY 4.0; datasets retain upstream terms. Training uses Tinker and Modal; model/API terms vary.

## Editorial fit

- Reader question: Can an agent improve long-document reasoning by organizing a corpus before it knows the questions, and when does the upfront cost pay back?
- Why this belongs in the selected track: The method is an agentic retrieval architecture that learns a reusable workspace, with direct comparisons against retrieval and precomputation baselines.
- Gap it fills: `retrieval-systems` / `rag-evaluation`; adds a measurable comparison of accuracy, construction cost, answer-time tokens, and reuse rather than evaluating retrieval quality in isolation.
- Why now: The Oct 15 paper offers a new, artifact-backed result challenging reactive retrieval for repeated long-context queries.

## Claim map

- Problem: Reactive retrieval makes an agent rediscover cross-document structure at query time; rigid precomputed indices may not capture useful task-oriented organization.
- Main claim: A builder agent trained by reinforcement learning can create a hierarchical filesystem of synthetic summaries and links to original documents before query disclosure, improving a separate frozen answerer's performance.
- Method: Formulate workspace creation as an MDP with create, merge, delete, and stop actions; optimize a Qwen3.5-4B builder using downstream answerability and correctness rewards, then evaluate frozen answerers against retrieval and memory baselines.
- What is genuinely new: The workspace is an agent-created, navigable file system optimized by downstream task success, not a query-time retrieval pipeline or a structure judged only by summary quality.

## Evidence audit

- Datasets: BrowseComp-Plus (680 training corpus-level tasks and 50 randomly sampled held-out tasks); an expanded synthetic reuse set with 443 questions across 50 corpora; BRIGHT-derived questions across nine reported domains.
- Benchmarks and metrics: Accuracy, construction and answer-time token cost, tokens per expected correct answer, corpus-reuse break-even analysis, and filesystem hierarchy ablations.
- Baselines: Embedding and reranker retrieval, GraphRAG, AutoCompaction, a builder without RL fine-tuning, and base-versus-RL comparisons. Frozen Qwen3.5-4B and Gemini 3.1 Flash Lite answerers are used in reported comparisons.
- Ablations: No-RL builder; additional retrieval/precomputation systems; flattened and shuffled workspace comparisons on 49 corpora and 435 questions; transfer to BRIGHT.
- Statistical uncertainty: Paper reports standard errors and paired corpus-bootstrap confidence intervals for reuse curves. The main held-out BrowseComp-Plus test is 50 corpus-level tasks; the expanded 443-query reuse set is synthetic, not 443 independent real-world corpora.
- Threats to validity: Author-run preprint results only; no independent rerun. The dramatic gains are benchmark- and configuration-specific. The learned workspace consumes substantial upfront tokens and more answer-time tokens. Reuse, cost weighting, generated query mix, fixed model providers, dataset licenses, and freshness of prepared workspaces affect operational value.

## Reproducibility

- Available artifacts and licenses: Public MIT code, configs, tests, experiment scripts, compact result records, and metric-recomputation scripts. Paper states synthesized artifacts/logs/results are CC BY 4.0. BrowseComp-Plus, BRIGHT, and DeepDive remain under their creators' respective terms; models and APIs have separate terms.
- Environment or compute requirements: Python 3.11+; package setup; training/reproduction uses Tinker and Modal with external API credentials, and some baseline runs require CUDA. Recomputing selected metrics from bundled compact records is a lighter check, not a complete retraining or end-to-end independent replication.
- Smallest useful reproduction: Run the repository's compact-record metric reproduction, then replicate one held-out corpus against the public retrieval and learned-workspace procedures with fixed model versions and full token accounting.
- Blocking unknowns: Independent results and variance across seeds/providers; complete benchmark redistribution rights; cost and quality under changing corpora and query distributions; production-safe refresh/invalidation policy.

## Critical reading

- Strongest result: Consistent author-reported improvements across two frozen answerer models, retrieval and precomputation baselines, and out-of-domain BRIGHT tasks, accompanied by released code and compact records.
- Weakest assumption: Performance on a 50-corpus held-out benchmark and a synthetic 443-question reuse extension generalizes to real enterprise collections with evolving documents and skewed query distributions.
- Stated limitations: The paper's construction/query trade-off depends on workload reuse and token assumptions; it is a benchmark study rather than a production deployment or independent validation.
- Claims not supported by the evidence: That anticipatory curation universally replaces RAG, improves arbitrary live enterprise corpora, or provides a measured production cost/quality gain.

## Bloss0m connection

- Related Traditional Chinese routes: Existing RAG and agent-memory readings; verify route names when drafting.
- Related English routes: Paired RAG and agent-memory readings; verify route names when drafting.
- Duplication risk: Adjacent subject matter only. No matching arXiv ID, title, canonical URL, bilingual article, draft, or content entry found in this scan.
- Suggested internal links: RAG fundamentals, retrieval-system evaluation, and agent memory / filesystem navigation readings.

## Recommendation

- Output level: Deep Read candidate.
- Score rationale: Topic relevance 5 (priority retrieval/agentic-RAG path); novelty 5 (RL-trained anticipatory workspace); evidence quality 4 (multiple controlled comparisons, uncertainty analysis, and limits, but author-run only with a small main held-out set); reproducibility 4 (public MIT code and records, but full training needs hosted services and API access); engineering value 5 (clear accuracy, token, reuse, and freshness trade-offs); series value 5 (strong fit for retrieval evaluation and agent memory). Total 28/30; evidence quality clears the minimum 3/5.
- Open questions requiring human approval: Should the Deep Read focus on benchmark mechanics or operational reuse economics? Which archived RAG/agent-memory papers should frame the comparison? Do dataset terms permit the proposed reproduction scope?

## Source and coverage review (2026-11-06)

Rechecked arXiv v1 benchmark/reuse/ablation sections and the public artifact. Keep the 50 held-out corpus tasks separate from 443 synthetic reuse questions and the 49-corpus/435-question hierarchy ablation. Paired Paper Reading #100 already covers this source; do not present it as an unwritten discovery or duplicate writing handoff.

The discovery window, original score and decision rationale above are historical. This review checks cited first-party evidence, not a new independent reproduction search or a re-scoring/admission decision. Existing coverage takes precedence over the original no-duplicate snapshot.
