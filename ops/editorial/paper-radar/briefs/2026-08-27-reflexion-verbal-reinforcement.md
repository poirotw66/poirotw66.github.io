---
stableId: "arxiv:2303.11366"
sourceVersion: "v4"
status: "published"
firstSeenAt: 2026-08-27
lastVerifiedAt: 2026-08-27
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "published"
---

# Reflexion: Language Agents with Verbal Reinforcement Learning

## Identity

- Stable ID: `arxiv:2303.11366`.
- Canonical URL: https://arxiv.org/abs/2303.11366
- Authors: Noah Shinn, Federico Cassano, Edward Berman, Ashwin Gopinath, Karthik Narasimhan, and Shunyu Yao.
- Venue or review status: NeurIPS 2023; arXiv v4 PDF and HTML (first posted 2023-03-20; v4 updated 2023-10-10; comments note additional experiments).
- DOI / proceedings / arXiv aliases: arXiv-issued DOI `10.48550/arXiv.2303.11366`; NeurIPS 2023 hash `1b44b878bb782e6954cd888628510e90`.
- Code / model / data: Paper prints `github.com/noahshinn024/reflexion` (404 as of 2026-08-27). Usable MIT repo is https://github.com/noahshinn/reflexion. LeetcodeHardGym linked from README to GammaTauAI/leetcode-hard-gym. Needs OpenAI API keys for notebook runs.

## Editorial fit

- Reader question: After agents can act with frozen LLMs, can linguistic feedback stored in episodic memory replace weight updates for across-trial improvement—and where does that stop?
- Why this belongs in the selected track: Reflexion is the Agent-systems foundation note after ReAct (within-trial acting), Toolformer (training-side tool filter), and SWE-bench (evaluation substrate). It fills memory / adaptation by changing across-trial credit assignment without gradients.
- Gap it fills: Verbal reinforcement with an explicit Actor / Evaluator / Self-Reflection loop, bounded memory, and task-specific feedback (heuristic, EM, self-tests).
- Why now: 24–26 establish acting, tool learning, and issue evaluation. Reflexion is the next foundation note: how failures become text that conditions the next trial.

## Claim map

- Problem: Language agents lack cheap trial-and-error learning without fine-tuning.
- Main claim: Verbal reflections in episodic memory improve sequential decision-making, reasoning, and coding under frozen weights; HumanEval (PY) reaches 91.0 pass@1 versus GPT-4 single-sample 80.1.
- Method: Actor generates a trajectory; Evaluator scores it; Self-Reflection writes `sr_t` into `mem`; next trial conditions on `mem` with capacity Ω≈1–3.
- What is genuinely new: Across-trial verbal credit assignment as the policy’s memory encoding, not a new within-trial action grammar.

## Evidence audit

- Datasets: ALFWorld 134 tasks; HotPotQA 100-question samples; HumanEval / MBPP Python and Rust; LeetcodeHardGym 40 hard problems post GPT-4 cutoff.
- Benchmarks and metrics: Success rate / EM / pass@1; learning curves over trials; test TP/FN/FP/TN; backbone slices in Appendix Tables 4–5.
- Baselines: ReAct-only, CoT-only, CoT (GT), GPT-4 single sample, CodeT-era prior SOTA rows.
- Ablations: Heuristic vs GPT evaluation triggers; EPM vs EPM+Reflect (+8%); test-generation and reflection omissions on HumanEval Rust (Table 3); WebShop negative result (Figure 6).
- Statistical uncertainty: Point estimates; 100-question HotPotQA slices; programming multi-trial compute not cost-normalized.
- Threats to validity: Needs usable feedback; wrong reflections; sliding-window memory; WebShop local minima; MBPP false positives; printed GitHub path stale; not enterprise memory governance.

## Reproducibility

- Available artifacts and licenses: arXiv v4 under CC BY 4.0; usable MIT code at noahshinn/reflexion; NeurIPS proceedings page reachable.
- Environment or compute requirements: OpenAI API access; ALFWorld / HotPotQA / coding toolchains; isolated execution advised for autonomous code.
- Smallest useful reproduction: One HotPotQA notebook setting or one HumanEval generate→self-test→reflect loop inspecting `mem`.
- Blocking unknowns: Exact 100-question indices, original API snapshots, and offline replay of Table 1 without paid model access.

## Critical reading

- Strongest result: HumanEval (PY) 91.0 with documented self-tests plus ALFWorld 130/134 and the Rust ablation showing both tests and reflection are required.
- Weakest assumption: That a usable Evaluator and helpful self-reflection are available whenever retries are allowed.
- Stated limitations: Local minima; sliding-window memory; fragile test-driven assumptions for impure or concurrent code.
- Claims not supported by the evidence: 91.0 as single-sample GPT-4 improvement; retries as parameter learning; WebShop success; enterprise memory governance.

## Bloss0m connection

- Related Traditional Chinese routes: `24-react-interleaved-reasoning-acting`; `25-toolformer-self-supervised-api-calls`; `26-swe-bench-github-issue-evaluation`; `20-adias-issue-centric-agent-optimization`; `16-past-bench-recursive-self-improvement`; `10-argus-agentic-runtime`.
- Related English routes: paired English routes for the same entries.
- Duplication risk: Low. ReAct is within-trial; Reflexion is across-trial verbal memory. ADIAS and PAST-Bench are later issue-ledger and persistence-evaluation lenses.
- Suggested internal links: within-trial contract (ReAct), training-side tool filter (Toolformer), issue evaluation substrate (SWE-bench), issue repair ledger (ADIAS), retained-experience tests (PAST-Bench).

## Recommendation

- Output level: Deep Read.
- Score rationale: Landmark verbal RL framing, honest WebShop/MBPP negatives, clear ablations. Reproducibility is 3 rather than 5 because Table 1 needs closed models and the printed GitHub path is stale.
- Open questions requiring human approval: none for this approved publication request; keep HumanEval 91.0 labeled as multi-trial self-test programming; do not back-port SWE-bench or ProMax numbers.
