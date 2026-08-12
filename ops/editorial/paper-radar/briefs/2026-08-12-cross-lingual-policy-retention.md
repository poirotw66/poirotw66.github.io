---
stableId: "arxiv:2608.11110"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-12
lastVerifiedAt: 2026-08-12
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 2
  engineeringValue: 5
  seriesValue: 5
  total: 26
decision: "deep-read-candidate"
---

# Actions Speak Louder than Words: Measuring Cross-Lingual Policy Retention in Tool-Using Agents

## Identity

- Stable ID: `arxiv:2608.11110`.
- Canonical URL: https://arxiv.org/abs/2608.11110
- Authors: Sourabrata Mukherjee, Kalika Bali, and Sunayana Sitaram.
- Venue or review status: arXiv v1, submitted 2026-08-11; accepted in COLM 26.
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI link; no separate artifact identity identified.
- Code / model / data: The paper exposes the measurement definitions and reports 2.38M rollouts, but no paper-specific code or dataset repository was identified during this run.

## Editorial fit

- Reader question: When the same tool-using task is expressed in another language, does the agent preserve the same action policy—or only the final answer?
- Why this belongs in the selected track: It evaluates auditable actions, parsing validity, reproducibility ceilings, and tool trajectories rather than treating final-answer accuracy as the whole agent behavior.
- Gap it fills: `agent-systems` / `agent-evaluation`, with a secondary connection to multilingual reliability and harness observability.
- Why now: The fresh COLM-accepted study spans eight models, six parallel benchmarks, 41 languages, and 2.38M rollouts while explicitly testing measurement confounds that can reverse conclusions.

## Claim map

- Problem: Raw trace similarity can reward short or empty traces, confuse chance agreement with policy retention, and conflate cross-language differences with a model's own reproducibility or parser failures.
- Main claim: After correcting five confounds, four frontier models retain about 71–73% of their action policy across languages under greedy decoding; below roughly 10B parameters the pattern breaks down in the tested setup.
- Method: Measure action traces across languages, normalize by same-language reproducibility, use permutation-based chance floors, test greedy and temperature conditions, and run a preregistered English-pivot intervention.
- What is genuinely new: The paper makes action policy—not just outcome correctness—the evaluation object and shows that trace extraction and parser legibility can manufacture apparent multilingual failure.

## Evidence audit

- Datasets: Six parallel benchmarks across 41 languages, with 2.38M total rollouts; four benchmarks include gold answers for separate outcome analysis.
- Benchmarks and metrics: Cross-language action-policy invariance, same-language reproducibility, parse-failure rate, chance-floor permutation tests, and final-answer accuracy where gold labels exist.
- Baselines: Same-language replicates establish the reproducibility ceiling; permutation baselines test chance agreement; cross-language comparisons cover eight models.
- Ablations: Temperature changes, trace-length manipulation, language-of-thought instructions, exemplars, and self-consistency voting are used to distinguish structural effects from protocol artifacts.
- Statistical uncertainty: The study reports confidence intervals and preregistered predictions, but the framework/model coverage and parser design still limit generalization.
- Threats to validity: Tool traces are scaffold-dependent, language coverage is uneven, some models emit unparseable outputs, and observed English advantages may mix model, benchmark, and harness effects.

## Reproducibility

- Available artifacts and licenses: The arXiv paper and its detailed measurement description are available; no paper-specific code/data package was located.
- Environment or compute requirements: Access to the evaluated model families, multilingual benchmark prompts, deterministic and sampled decoding, a trace parser, and enough inference capacity for large rollout counts.
- Smallest useful reproduction: Re-run one parallel benchmark across a high-resource and low-resource language with same-language replicates, permutation baselines, parse-failure reporting, and separate action invariance and answer accuracy metrics.
- Blocking unknowns: Exact benchmark prompts, trace extraction implementation, model checkpoints/API versions, full per-cell results, and cost/latency traces need verification before a deep read is drafted.

## Critical reading

- Strongest result: The parser-artifact analysis demonstrates that a headline multilingual agent score can change dramatically without changing readable-output accuracy, making observability itself part of evaluation validity.
- Weakest assumption: The selected tool scaffolds and trace format may not represent production agents whose actions include retries, permissions, stateful tools, or hidden framework steps.
- Stated limitations: The paper distinguishes action invariance from correctness, documents empty traces and low-resource failures, and does not claim that invariance is a proxy for task success.
- Claims not supported by the evidence: The results do not prove universal language parity, that English reasoning is always harmful, or that the reported retention rates transfer to all agent frameworks or real-world tools.

## Bloss0m connection

- Related Traditional Chinese routes: `08-osreward-agent-evaluation`; `15-langchain-agent-harness-anatomy`; `19-parallel-ai-what-is-agent-harness`; `43-enterprise-ai-agent-security`.
- Related English routes: the paired English routes for the same entries.
- Duplication risk: Low to medium. Existing evaluation coverage discusses agent scoring and harnesses, but not cross-lingual action-policy retention or parser-induced false findings.
- Suggested internal links: trace schemas, parse-failure budgets, multilingual QA, reproducibility ceilings, and outcome-versus-action evaluation.

## Recommendation

- Output level: Deep Read
- Score rationale: The paper closes an agent-evaluation gap with unusually large rollout coverage, explicit confound corrections, and a direct engineering warning about trace legibility. Reproducibility is heavily discounted because the paper-specific artifact was not identified.
- Open questions requiring human approval: Require the exact benchmark/parser artifacts and per-cell tables before drafting; preserve the paper's separation between action policy, parse validity, and final-answer correctness.
