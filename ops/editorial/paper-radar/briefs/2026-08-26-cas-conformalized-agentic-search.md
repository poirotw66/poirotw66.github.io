---
stableId: "arxiv:2608.20771"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-26
lastVerifiedAt: 2026-08-26
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
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

# CAS: conformalized agentic search via adaptive retrieval and policy weighting

## Identity

- Stable ID: `arxiv:2608.20771`.
- Canonical URL: https://arxiv.org/abs/2608.20771
- Authors: Zixi Zhu, Jiayuan Su, Jian Zhang, Yu Lin, and Hongwei Wang.
- Venue or review status: arXiv v1, submitted 2026-08-21; no separate review record identified.
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI `10.48550/arXiv.2608.20771`; no separate identifier identified.
- Code / model / data: https://github.com/S1llyBird/CAS; Apache-2.0. The repository documents separate training/retrieval environments, VERL/Ferret dependencies, multi-GPU training, and a quickstart; exact reproduction cost remains to be audited.

## Editorial fit

- Reader question: Can conformal uncertainty control both what an agent retrieves and how its search policy is optimized?
- Why this belongs in the selected track: CAS joins agentic search, uncertainty, and RL policy shaping, directly filling `agent-systems` / `agent-evaluation`.
- Why now: The paper is recent, evaluates seven QA datasets, and exposes a runnable artifact rather than only a prompting recipe.

## Claim map

- Problem: Agentic search can spend retrieval actions on low-confidence trajectories, while ordinary conformal prediction does not directly control adaptive multi-step search.
- Main claim: Adaptive Prediction Sets (APS) can guide retrieval selection and Adaptive Conformal Inference (ACI) can weight or penalize trajectories inside GRPO.
- Reported evidence: On Qwen2.5-3B and Qwen3-8B across NQ, TriviaQA, PopQA, HotpotQA, 2WikiMultiHopQA, MuSiQue, and Bamboogle, the paper reports Qwen3-8B overall EM 0.464 versus 0.446 for Search-R2 and 0.400 for Search-R1, with larger gains on some multi-hop settings.
- Inference boundary: These are the paper's benchmark results under a fixed Wikipedia/retriever/rollout setup; they do not establish conditional coverage or production reliability.

## Evidence audit

- Benchmarks and setup: E5 retriever, 2018 Wikipedia, Qwen2.5-3B/Qwen3-8B, group rollout G=5, maximum four assistant-search rounds, and exact match evaluation.
- Artifacts: Public Apache-2.0 code and documented CUDA/Python environments provide a concrete reproduction path.
- Limitations and unknowns: The paper notes that conformal coverage is marginal rather than conditional, i.i.d. assumptions are strained by evolving RL policies, professional domains are untested, and calibration relies on a DeepSeek-V3.2 teacher. No process-level reliability guarantee is shown.

## Critical reading

- Strongest result: The method turns uncertainty into both retrieval-set control and a training signal, with multi-dataset comparisons and public code.
- Weakest assumption: Calibration and coverage behavior will remain useful as the policy, domain, retriever, and corpus distribution shift together.
- Human review focus: Verify table-level gains, calibration overhead, and whether the public training path reproduces the reported policy behavior.

## Recommendation

- Output level: Deep Read.
- Series fit: `agent-systems` / `agent-evaluation`; it offers a technical bridge between agent search behavior and measurable uncertainty rather than a general agent benchmark.
- Suggested internal framing: Compare calibration, search-budget policy, and failure diagnosis against existing agent-evaluation work; do not call the method a general safety guarantee.
