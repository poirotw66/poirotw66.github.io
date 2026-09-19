---
stableId: "arxiv:2609.20804"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-19
lastVerifiedAt: 2026-09-19
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
decision: "deep-read-candidate"
---

# An Empirical Study of Harness Design for Coding Agents

## Identity

- Search window: Strict 72-hour scan ending 2026-09-19; arXiv v1 was submitted on 2026-09-17.
- Canonical URL: https://arxiv.org/abs/2609.20804
- Full paper: https://arxiv.org/html/2609.20804v1
- Venue or review status: arXiv preprint; no peer-review status was assumed.
- Artifacts: The paper exposes detailed configurations, task settings, harness description, and TeX sources; no dedicated paper-specific public code repository was verified.

## Editorial fit

- Reader question: Which parts of a coding-agent harness actually matter: planning, tools, context management, or window size?
- Track and gap: agent-systems / agent-evaluation.
- Why now: Agent performance is often attributed to the model, while this study holds the model and task loop fixed and varies harness components.

## Claim map

- Method: A fixed execution loop varies planning, action space, context-management strategy, and context-window budget across 176 matched settings.
- Evaluation: Four models are tested on SWE-Bench Verified and Terminal-Bench 2.1 with 32k/64k/96k/128k windows.
- Findings: Context management matters more under tight windows and mainly prevents overflow; staged rule-based elision before LLM summarization is the strongest efficiency strategy. Planning helps weaker models and saves cost for stronger ones; predefined tools help bash-weak models while bash-capable models can be cheaper with bash only.
- Engineering consequence: Harness budgets should be tuned by model capability and workload, not copied as a universal recipe.

## Evidence audit

- Benchmarks: SWE-Bench Verified and Terminal-Bench 2.1; three Nemotron-3 sizes plus Mistral.
- Controls: Fixed safety, post-edit diagnostics, stuck detection, tool descriptions, and execution loop provide a matched comparison boundary.
- Analysis: The paper reports paired comparisons and multiple context tiers, but the evidence remains benchmark-bound and model/version-bound.
- Limitations: No independent rerun, no dedicated released harness repository found, and no long-horizon non-coding workload.

## Reproducibility

- The configuration and harness details are sufficiently explicit for a careful lab reproduction, but it requires local model serving, benchmark access, and the exact task/tool prompts.
- A smallest useful rerun is one model on one benchmark comparing staged elision, summarization, and no context management at two window budgets.
- Unknowns include implementation drift, inference cost accounting, and whether the result survives a different agent framework.

## Critical reading

- Strongest insight: Context management is primarily an overflow-control mechanism, not automatically an accuracy booster.
- Main risk: Matched settings improve attribution, but they may underrepresent the integration failures and latency trade-offs of production harnesses.
- Evidence limit: Strong controlled coverage, yet the lack of a paper-specific artifact limits independent verification.

## Bloss0m connection

- Suggested links: long-horizon agent traces, tool-call reliability, and agent harness governance.
- Article focus: build a decision table mapping model strength and context pressure to planning, tool, and compaction choices.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30: unusually clean component study, high engineering value, and broad benchmark coverage; reproducibility is one point below full because no dedicated public code artifact was verified.
- Open questions: What is the real cost/latency frontier when context compaction runs online under production traffic?
