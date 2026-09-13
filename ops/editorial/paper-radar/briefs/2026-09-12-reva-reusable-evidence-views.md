---
stableId: "arxiv:2609.11209"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-12
lastVerifiedAt: 2026-09-12
primaryTrack: "retrieval-systems"
primaryGap: "production-rag"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "deep-read-candidate"
---

# REVA：把 RAG 壓縮從每次請求的即時成本，搬到可重用的證據快取

## Identity

- Search window: strict 72-hour scan ending 2026-09-12; arXiv v1 was submitted on 2026-09-10.
- Canonical URL: https://arxiv.org/abs/2609.11209
- Authors: Tuan Nguyen, Qiran Hu, Banruo Liu, Khoa D. Doan, Kok-Seng Wong, and Fan Lai.
- Venue or review status: Author’s accepted manuscript; accepted for IEEE ICDM 2026 according to the arXiv record.
- DOI / OpenReview / arXiv aliases: https://doi.org/10.48550/arXiv.2609.11209
- Code / model / data: Public artifact repository https://github.com/UIUC-MLSys/REVA with implementation, figures, locked environment, quick-start commands, and temporary Google Drive links for retrieval and score-cache artifacts. The Zenodo DOI is not yet available in the repository README.

## Editorial fit

- Reader question: If the same documents are retrieved repeatedly, why recompute context importance for every request, and what does the system lose when a reusable view has never seen a document before?
- Why this belongs in the selected track: REVA is a serving-oriented RAG compression design with explicit offline/online boundaries, fallback behavior, token budgets, latency measurements, and public runnable code.
- Gap it fills: Production RAG—how to turn historical query–document–model interactions into a cacheable evidence artifact without changing the generator interface.
- Why now: Context compression is often evaluated as an isolated quality trick, while deployed RAG also pays latency, KV-cache, and online model-call costs. REVA makes the operational trade-off visible: spend work when history is available, then render ordinary text cheaply at request time.

## Claim map

- Problem: Request-time compressors can add more latency than they save, rely on auxiliary models, or destabilize quality across queries. A compressor that works only once per query leaves repeated document accesses unused.
- Main claim: Historical attention traces can be aggregated into document-keyed word-unit scores. REVA then produces budgeted plain-text views that improve generation quality by 1.0–5.8 points over prior advances while reducing compression overhead by 5.3–15.6× and adding less than 40 ms in the reported settings.
- Method: Offline, score historical RAG accesses with the target generator, map token-level attention to readable word units, and aggregate scores under compatibility keys containing document text, generator, tokenizer, template, scoring mode, and corpus version. Online, retrieve top-K documents, allocate quotas, reuse scores when present, fall back for unseen documents, and render selected units in original order.
- What is genuinely new: The reusable artifact is not a model-specific latent cache or a rewritten answer; it is a document-keyed, budget-agnostic score store that preserves the standard RAG text interface. The paper also separates local per-document quotas from global budget allocation, making coverage versus salience an explicit serving policy.

## Evidence audit

- Datasets: Four QA benchmarks—Natural Questions, TriviaQA, HotpotQA, and 2WikiMultihopQA—are evaluated with three generator families: Llama-3.1-8B Instruct, Qwen3.5-9B, and Gemma-4-E4B-it. The online-serving experiments run on a four-H100 server.
- Benchmarks and metrics: The paper reports F1, exact match, ROUGE-L, emitted context tokens, and online overhead across multiple budgets and generator–dataset settings. At B=512, REVA-local reports 37.83 F1, 26.98 EM, and 27.5 ms overhead in the full-split table, compared with 34.11/24.10 and 17.0 ms for local truncation.
- Baselines: Truncation, SelCtx, LLM-L2, RECOMP-e, LongLLM, EXIT, and FaviComp cover low-cost truncation, learned request-time compression, and generative rewriting. The comparison makes clear when baselines are not matched-budget alternatives.
- Ablations: Query-only versus query-plus-answer scoring, local versus global allocation, word-unit materialization, score coverage, budgets, generators, and datasets are varied. REVA-global reaches 43.72 mean F1 and 32.75 mean EM with 49 ms overhead in the budget-robust summary, while REVA-local remains cheaper at 31 ms.
- Statistical uncertainty: The primary paper reports aggregate benchmark averages and a coverage analysis, but no independent deployment trace or confidence-interval treatment is exposed for every slice. The attention score is a proxy for evidence importance, not a direct citation-faithfulness proof.
- Threats to validity: The all-seen subset is explicitly diagnostic rather than deployment-representative. Full-split performance relies on prefix fallback for uncovered documents, and the store is compatible only when document text, generator, tokenizer, template, scoring mode, and corpus version match.

## Reproducibility

- Available artifacts and licenses: `UIUC-MLSys/REVA` is a public research artifact with `src/reva.py`, locked setup instructions, JSONL input format, build/run commands, figures, checksums, and temporary Drive downloads for retrieval and score-cache data. The repository says a Zenodo DOI is pending.
- Environment or compute requirements: Python/uv, a compatible attention-enabled generator for score-store construction, optional FAISS/E5 retrieval dependencies, model weights or access, and potentially substantial GPU memory. The paper’s evaluation used four H100 GPUs.
- Smallest useful reproduction: Use the public JSONL interface, build a score store from a small historical set, run REVA and prefix truncation at B=512, and compare F1/EM plus online materialization time for seen and unseen documents. Include the compatibility-key mismatch case to test fallback behavior.
- Blocking unknowns: Temporary data links may change before the Zenodo release; rebuilding attention scores is model- and hardware-dependent; the repository’s quick start is inspectable but an independent full benchmark run was not performed in this scan.

## Critical reading

- Strongest result: REVA turns a familiar offline/online systems idea—materialize reusable views—into a concrete RAG artifact and measures the cost boundary. In the reported full-split table, the reusable policy improves over truncation while staying near 27.5 ms overhead, far below the request-time compressor baselines.
- Weakest assumption: Historical attention patterns are stable enough across future queries to identify answer-bearing word units. The method mitigates this with compatibility keys and fallback, but coverage and distribution shift remain first-class deployment concerns.
- Stated limitations: The paper does not claim uniform dominance; it notes that reusable views are near-frontier rather than always best, and distinguishes all-seen diagnostic results from the mixed deployment regime. Offline store construction and updates are excluded from online overhead.
- Claims not supported by the evidence: The experiments do not prove that attention-derived scores improve factual citation correctness, that every workload has sufficient repeated document access, or that the reported latency translates directly to a specific cloud serving bill.

## Bloss0m connection

- Related Traditional Chinese routes: production RAG, context compression, KV-cache economics, and retrieval observability.
- Related English routes: Retrieval Systems, serving optimization, and evidence selection.
- Duplication risk: Low; this is a reusable serving artifact and cost model, distinct from Q2D-Web’s retrieval benchmark and VikingRAG’s structured navigation.
- Suggested internal links: Pair with Q2D-Web for first-stage retrieval evaluation, VikingRAG for structure-aware evidence acquisition, and existing selective-context coverage for compression trade-offs.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30: clear offline/online contract, public code and data path, multiple generators and benchmarks, explicit fallback and compatibility semantics, and strong latency/quality evidence. Reproducibility is capped at 4 because the data artifacts are temporary and the attention-store build requires model/hardware access.
- Open questions requiring human approval: How quickly does the score store become stale under corpus edits? How should teams monitor coverage and invalidate views? Can a citation-level evaluator detect cases where readable word-unit selection preserves fluency but removes the actual evidence chain?
