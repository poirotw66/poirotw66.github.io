---
stableId: "arxiv:2310.06770"
sourceVersion: "v3"
status: "published"
firstSeenAt: 2026-08-27
lastVerifiedAt: 2026-08-27
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
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

# SWE-bench: Can Language Models Resolve Real-World GitHub Issues?

## Identity

- Stable ID: `arxiv:2310.06770`.
- Canonical URL: https://arxiv.org/abs/2310.06770
- Authors: Carlos E. Jimenez, John Yang, Alexander Wettig, Shunyu Yao, Kexin Pei, Ofir Press, and Karthik Narasimhan. Jimenez and Yang are equal contribution.
- Venue or review status: ICLR 2024 Oral; arXiv v3 PDF and HTML (first posted 2023-10-10; v3 updated 2024-11-11).
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI `10.48550/arXiv.2310.06770`; OpenReview forum `VTF8yNQM66`.
- Code / model / data: https://www.swebench.com/ and https://github.com/SWE-bench/SWE-bench are reachable as of 2026-08-27 (MIT). `princeton-nlp/SWE-bench` redirects to that org repo. Hugging Face dataset `princeton-nlp/SWE-bench` and SWE-Llama 7b/13b checkpoints load. README now defaults to Docker evaluation (report dated 2024-06-27); the paper's Appendix A.3 describes per-version conda.

## Editorial fit

- Reader question: After models already write functions on HumanEval, what should count as success on real GitHub issues, and how much of a headline resolve rate is the model versus retrieval versus the test suite?
- Why this belongs in the selected track: SWE-bench is the evaluation substrate for later coding agents. It fills the `agent-systems` / `agent-evaluation` gap by changing the success definition, not by proposing a new agent loop.
- Gap it fills: Execution-based, repository-scale issue resolution with an explicit retrieval confound (BM25 versus oracle) and a binary fail-to-pass / pass-to-pass judge.
- Why now: ReAct and Toolformer have just been published as Agent-foundation notes on acting and self-supervised tool use. SWE-bench is the third note: the protocol those agents later get scored on. ProMax already exists on the site as a later change of the denominator.

## Claim map

- Problem: Function-level coding benchmarks saturate and do not capture multi-file GitHub issue resolution.
- Main claim: Under a BM25 retrieve-then-generate protocol, even Claude 2 resolves only 1.96% of 2,294 Python issues; oracle retrieval and collapsed context raise the number without turning it into a model ranking.
- Method: Filter merged, issue-resolving, test-editing PRs from 12 repositories down to 2,294 executable tasks; retrieve files; generate one greedy patch; resolve iff all FAIL_TO_PASS and PASS_TO_PASS tests pass.
- What is genuinely new: The evaluation unit (real issue + full repo + tests), not a new agent architecture.

## Evidence audit

- Datasets: 2,294 test instances from 12 Python repos; 225-instance development set from 6 other repos; SWE-bench-train ~19k pairs from 37 disjoint repos, ~10k after the 30k-token filter; Lite 300-instance subset in v3.
- Benchmarks and metrics: Binary resolve; % Apply; BM25 at 13k/27k/50k; oracle; oracle-collapsed ±15 lines. Greedy Pass@1.
- Baselines: ChatGPT-3.5, GPT-4 (25% subset for some cells), Claude 2, Claude 3 Opus and GPT-4-turbo in v3 Table 5, SWE-Llama 7b/13b.
- Ablations: context length, BM25 versus oracle versus oracle-collapsed, patch versus whole-file generation, before/after 2023, per-repository slices, F2P/P2P outcome taxonomy.
- Statistical uncertainty: Point estimates; GPT-4 budget subset; Django 850/2294 concentration.
- Threats to validity: Python-only; binary tests ignore maintainability; BM25 retrieval confound; conda versus later Docker; later leaderboards must not be mixed in.

## Reproducibility

- Available artifacts and licenses: arXiv v3 HTML/PDF under CC BY 4.0; MIT evaluation repo; public Hugging Face dataset and SWE-Llama weights. Project page is usable but now hosts later leaderboards.
- Environment or compute requirements: Per-version Python/conda in the paper; current official harness is Docker. Closed-model API access for Table 2.
- Smallest useful reproduction: Load one instance, apply the gold patch, confirm fail-to-pass tests. This does not reproduce 1.96%.
- Blocking unknowns: Original BM25 caches, exact closed-model snapshots, and the 2023 conda images as a one-command Table 2 reproduction.

## Critical reading

- Strongest result: BM25 13k Claude 2 at 1.96% with apply rates far above resolve, plus the oracle lift to 4.80% showing retrieval as a separate confound.
- Weakest assumption: One-shot retrieved-file patch generation is informative enough to stand in for software-engineering ability.
- Stated limitations: Python only; simplest baselines; execution tests insufficient for readability/completeness.
- Claims not supported by the evidence: 1.96% as a model ceiling; oracle as a realistic prior; later SWE-agent / Verified / ProMax numbers as this paper's results.

## Bloss0m connection

- Related Traditional Chinese routes: `24-react-interleaved-reasoning-acting`; `25-toolformer-self-supervised-api-calls`; `22-swe-bench-promax`; `19-a2e-agent-auditing-engine`; `23-midtool-agentic-tool-use`.
- Related English routes: paired English routes for the same entries.
- Duplication risk: Low. ProMax is the 2026 descendant that changes the denominator; this note teaches the original 2024 protocol and does not rewrite ProMax.
- Suggested internal links: acting contract (ReAct), training-side tool filter (Toolformer), later refactor slice (ProMax), rescorable traces (A²E).

## Recommendation

- Output level: Deep Read.
- Score rationale: Landmark evaluation paper, honest low resolve rates, explicit retrieval confound, public dataset and code. Reproducibility is 4 rather than 5 because Table 2 needs closed models and the current Docker harness is later than the paper.
- Open questions requiring human approval: none for this approved publication request; keep BM25 1.96% and oracle 4.80% in separate labeled sentences; do not back-port later leaderboard numbers.
