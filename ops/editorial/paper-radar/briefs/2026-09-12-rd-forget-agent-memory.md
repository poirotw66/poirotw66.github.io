---
stableId: "arxiv:2609.10263"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-12
lastVerifiedAt: 2026-09-12
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 27
decision: "deep-read-candidate"
---

# RD-Forget：Agent 不必刪掉記憶，只要控制哪些記憶能影響答案

## Identity

- Search window: strict 72-hour scan ending 2026-09-12; arXiv v1 was submitted on 2026-09-09.
- Canonical URL: https://arxiv.org/abs/2609.10263
- Authors: Yuhang Li and Yuchen Li.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-09; the primary record lists an 8-page paper with 3 figures and 3 tables.
- DOI / OpenReview / arXiv aliases: https://doi.org/10.48550/arXiv.2609.10263
- Code / model / data: The primary paper exposes arXiv HTML/PDF and describes evaluations over AgentMemoryBench/LoCoMo, LongMemEval, MemoryAgentBench, BEAM, and PersonaMem. No runnable project repository or complete released artifact was verified from the primary record.

## Editorial fit

- Reader question: When a user asks about the present, how can an agent suppress an obsolete fact without destroying the same fact needed for a historical question?
- Why this belongs in the selected track: RD-Forget turns agent memory from a single delete-or-keep store into a separation between retained observations and query-time evidence, with explicit supersession links and a budgeted selection algorithm.
- Gap it fills: Agent evaluation—how to test evolving memory under contradictory updates, historical intent, relation chains, and finite answer-time budgets instead of only testing static recall.
- Why now: Long-lived agents increasingly accumulate user preferences and changing facts. Silent deletion is irreversible, while always surfacing every version makes current answers wrong; the paper makes that trade-off a measurable policy decision.

## Claim map

- Problem: A superseded fact may mislead a current-state answer while remaining essential for a historical query. Conventional memory policies conflate what is stored with what is allowed to influence the current response.
- Main claim: A retained source archive plus a query-conditioned memory view improves evolving-memory and intent-aware QA over ACE and ReasoningBank across four evaluated model families, while component ablations show that forgetting and query conditioning are both necessary.
- Method: A frozen language-model curator extracts evidence, groups facts into semantic slots, preserves relation chains, marks same-slot replacements as superseded, reactivates earlier evidence for historical intent, and greedily packs selected entries under a 2,048-token memory budget.
- What is genuinely new: “Forget” is reframed as answer-time eligibility rather than physical deletion. The design keeps source observations, attaches supersession and relation metadata, and uses intent-aware rescue so current and historical answers can select different views over the same archive.

## Evidence audit

- Datasets: The main evaluation uses 86 AMB-Text questions from a LoCoMo conversation, 78 LongMemEval knowledge-update questions, and 100 MemoryAgentBench fact-consolidation questions. The intent extension adds 150 BEAM questions and 579 PersonaMem questions per method.
- Benchmarks and metrics: Four backbones—Qwen3.5-flash, GPT-5.6-Luna, MiniMax-M2.5, and Kimi-K2.5—are evaluated with binary semantic judgments for AMB-Text/LME-KU, normalized substring accuracy for MAB-FC, rubric averages for BEAM, and official single-option accuracy for PersonaMem.
- Baselines: ACE and ReasoningBank are compared under a shared answering pipeline. The same model family is used for curation, selection, answering, and model-based evaluation within each run.
- Ablations: The matched Luna protocol removes FORGET, RESCUE, SLOT, CLOSURE, and query conditioning. Full scores are 91.86/93.59/74.00 on AMB-Text/LME-KU/MAB-FC; removing FORGET falls to 68.60/60.26/51.00, while removing query conditioning falls to 77.91/82.05/56.00.
- Statistical uncertainty: The results show repeated gains across models and suites, but the primary paper does not expose an independent judge, confidence intervals for every comparison, or a complete cost/latency accounting for curator and selection calls.
- Threats to validity: The task subsets are bounded and source-order selected; some scores use rule-based matching or model-based semantic judgments. The large gains demonstrate the internal ablation story, but do not yet establish behavior on multimodal memory, very large archives, noisy user data, or independently collected production traces.

## Reproducibility

- Available artifacts and licenses: The source paper and named public benchmark datasets are available, but no complete RD-Forget implementation, configuration bundle, or released memory archive was verified from the primary record.
- Environment or compute requirements: The method is training-free but still depends on model calls for curation, selection, answering, and evaluation. Reproduction also requires the exact benchmark subsets, prompts, model snapshots, and token caps.
- Smallest useful reproduction: Build a tiny versioned fact archive with current and historical values, implement same-slot supersession plus historical rescue, and compare four policies—full history, deletion, no-forget, and query-conditioned view—under a fixed token budget. Evaluate both “what is true now?” and “what was true then?” queries.
- Blocking unknowns: Exact prompts, randomization, source-release details, model pricing/latency, and a runnable artifact are not fully verifiable from the primary record. The results should be treated as a strong method and ablation signal, not an immediately deployable library.

## Critical reading

- Strongest result: The design expresses a real product requirement cleanly: current answers should prefer the newest compatible fact, while historical questions should regain older evidence. The matched Luna ablations make the policy contribution visible because removing FORGET produces the largest deficit across all three main suites.
- Weakest assumption: A frozen language-model curator can reliably identify semantic slots, relation closure, and supersession without introducing its own extraction errors. Since the same model family participates in several stages, a failure can be repeated rather than independently detected.
- Stated limitations: The evaluation is bounded to selected textual memory suites, and the authors’ primary evidence is benchmark accuracy plus component ablations. The paper does not yet provide a broad external artifact or production-scale memory-maintenance study.
- Claims not supported by the evidence: The paper does not establish that retaining all history is always safe, that the policy prevents privacy leakage, that query-conditioned rescue never reintroduces harmful obsolete data, or that the reported accuracy gains survive an independent evaluator.

## Bloss0m connection

- Related Traditional Chinese routes: agent memory, continual retrieval, conflict resolution, and agent evaluation.
- Related English routes: Agent Systems, long-term memory, and reliability under changing facts.
- Duplication risk: Medium; existing memory articles cover paging and retrieval decoupling, but this paper’s retained-archive/query-view distinction and supersession semantics are a different axis.
- Suggested internal links: Pair with RAG without Forgetting for continual retrieval, Beyond RAG for Agent for memory architecture, and AgentAudit for lifecycle trust evaluation.

## Recommendation

- Output level: Deep Read.
- Score rationale: 27/30: unusually clear conceptual framing, multi-suite evaluation across four model families, and informative component ablations. Evidence quality and reproducibility are capped because several stages share model families and no complete runnable artifact or independent judge was verified.
- Open questions requiring human approval: How should supersession be audited when facts conflict across sources? What is the curator cost at million-entry scale? Can a policy preserve historical usefulness while enforcing deletion, retention, and privacy requirements?
