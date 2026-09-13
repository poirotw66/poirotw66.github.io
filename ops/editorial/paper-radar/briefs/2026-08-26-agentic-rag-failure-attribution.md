---
stableId: "arxiv:2608.20627"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-26
lastVerifiedAt: 2026-08-26
primaryTrack: "retrieval-systems"
primaryGap: "rag-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "deep-read-candidate"
---

# When failures propagate: causal failure attribution in agentic RAG

## Identity

- Stable ID: `arxiv:2608.20627`.
- Canonical URL: https://arxiv.org/abs/2608.20627
- Authors: Lauren Pothuru.
- Venue or review status: arXiv v1, submitted 2026-08-20; no separate review record identified.
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI `10.48550/arXiv.2608.20627`; no separate identifier identified.
- Code / model / data: https://github.com/anote-ai/Research-AgenticRAG. The repository includes paper/results, injection scripts, diagnosers, metrics, datasets, tests, mock mode, and resumable real-model commands.

## Editorial fit

- Reader question: When a multi-hop RAG answer fails, can an evaluation distinguish the first causal retrieval failure from downstream symptoms?
- Why this belongs in the selected track: It introduces interventional, hop-level diagnosis and fills `retrieval-systems` / `rag-evaluation`.
- Why now: The paper pairs a narrow but reproducible benchmark with a public repository that exposes fault injection and cost-aware diagnosis.

## Claim map

- Problem: In agentic RAG, a wrong early retrieval can propagate through later hops, so final-answer correctness alone cannot attribute the failure.
- Main claim: Injecting a certified fault, re-executing downstream hops, and comparing counterfactual traces can identify the causal hop.
- Reported evidence: On 80 three-hop MuSiQue questions with Claude Haiku 4.5, the strict diagnosis coverage is .91 at hop 1 (n=43), .00 at hop 2 (n=36), and .00 at hop 3 (n=21). Exploratory content-corruption results are small and descriptive.
- Inference boundary: These results show a difficult benchmark behavior, not a general diagnosis capability; the paper explicitly calls for broader backbones and benchmarks.

## Evidence audit

- Faults and evaluation: The repository documents empty, irrelevant, query-drift, false-premise, stale-evidence, and early-termination injections, plus HotpotQA, MuSiQue, FRAMES, and CRAG paths.
- Reproducibility: Mock and real-provider modes, strict depth buckets, caching, tests, and cost-per-correct-diagnosis metrics make the experiment inspectable.
- Limitations: The strict result is one model and one small three-hop slice; depth-3 exploratory cases are n=3 and frozen-hop counterfactual analysis covers only 18 failures.

## Critical reading

- Strongest result: The benchmark operationalizes causal attribution instead of hiding retrieval failures behind an end-answer score.
- Weakest assumption: A certified injected fault and a re-executed counterfactual are a sufficiently faithful proxy for naturally occurring agentic failures.
- Human review focus: Re-run strict depth buckets, inspect false attribution costs, and decide whether the metric belongs in a production RAG evaluation gate.

## Recommendation

- Output level: Deep Read.
- Series fit: `retrieval-systems` / `rag-evaluation`; it is a direct evaluation-method candidate for agentic retrieval reliability.
- Suggested internal framing: “A failed answer is not a root cause: testing causal attribution in multi-hop RAG.”
