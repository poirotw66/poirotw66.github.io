---
stableId: "arxiv:2608.24876"
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

# Recursive Experiential–Working Memory Evolution for Long-Horizon Agent Harnesses

## Identity

- Stable ID: `arxiv:2608.24876`.
- Canonical URL: https://arxiv.org/abs/2608.24876
- Authors: arXiv author list; use the canonical record for the authoritative spelling.
- Venue or review status: arXiv v1, submitted 2026-08-25; no separate review record identified.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2608.24876`; no separate identifier identified.
- Code / model / data: https://github.com/Gen-Verse/Recuris; Apache-2.0 repository with code, configurations, scripts, skill memories, and splits. The README documents Python 3.12, Docker for some environments, and OpenAI-compatible model endpoints.

## Editorial fit

- Reader question: Can an agent improve across long-horizon tasks by changing its memory and skills while keeping the base model and outer harness fixed?
- Why this belongs in the selected track: Recuris couples task-state Working Memory with Experiential Memory for skill selection, then uses structured execution evidence to drive localized memory updates. It directly fills `agent-systems` / `agent-evaluation`.
- Gap it fills: Existing memory discussions often report aggregate gains without showing how failures become bounded, validation-gated updates. This paper makes the memory-evolution loop and its evaluation boundary explicit.
- Why now: The paper reports evaluation across four long-horizon benchmarks and ten models, while the public repository provides a concrete harness and benchmark splits for inspection.

## Claim map

- Problem: Long-horizon agents accumulate failures, but global prompt or model updates can make it unclear which skill or memory caused a later change.
- Main claim: A fixed meta-agent can use structured execution traces to localize a failure, update Skill Memory, and pass a held-out validation gate before retaining the update.
- Method: Working Memory tracks task state; Experiential Memory stores reusable skill experience; a recursive loop selects skills, executes, diagnoses, proposes a localized update, and validates it on held-out tasks.
- Reported result: The paper reports success improvements across four long-horizon benchmarks, including +17.8 points for GPT-5.6 Sol and +15.6 for Claude Opus 5 on tau2-Bench, and up to +32.2 points at the longest horizon. These are paper/repository results, not independent replications.
- What is genuinely new: The combination of trace-localized skill updates and a validation gate is a harness-level adaptation mechanism rather than a claim that the base model itself has learned new weights.

## Evidence audit

- Datasets and benchmarks: Four long-horizon benchmarks, ten models, and benchmark-specific task splits documented in the paper and repository.
- Benchmarks and metrics: Success rate is the headline metric; the paper also reports horizon-specific improvements and failure reductions. The repository contains evaluation configuration and execution scripts.
- Baselines: The repository describes frozen-agent, memory, and test-time adaptation comparisons. The test-time adaptation comparison is small and the reported difference is not presented as statistically significant.
- Ablations: Transfer versus model-specific memories and validation-gated updates are important checks; model-specific memory can outperform transfer in the repository's reported results.
- Statistical uncertainty: Confidence intervals, model variance, and cost-normalized uncertainty are not yet sufficient to treat the headline gains as general guarantees.
- Threats to validity: Benchmark-specific skills, model-specific memory, task distribution, and the distinction between failure localization and true causal identification all limit external validity. The full HTML explicitly describes the diagnosis as a repair decision rather than causal identification.

## Reproducibility

- Available artifacts and licenses: Public Apache-2.0 code, configurations, splits, scripts, and skill memories in the Recuris repository.
- Environment or compute requirements: Python 3.12; Docker for SkillFlow or TerminalBench-style environments; model endpoints and benchmark-specific dependencies. The tau2 setup uses an LLM user simulator and assertion judge.
- Smallest useful reproduction: Run one fixed base model and one benchmark with the provided frozen harness, compare no-update versus validation-gated memory evolution, and retain trace, proposed update, validation result, and cost for every attempt.
- Blocking unknowns: Exact API cost, wall-clock budget, failed-run handling, and whether a clean third-party environment reproduces each table remain to be audited.

## Critical reading

- Strongest result: The repository exposes a clear engineering decomposition—trace, targeted memory update, deterministic validation gate, and fixed base agent—that can be tested independently.
- Weakest assumption: Structured traces and a fixed diagnosis procedure are sufficient to localize the skill responsible for a failure across changing tasks and environments.
- Stated limitations: The paper and repository leave benchmark and model dependence, adaptation cost, and transfer behavior as important boundaries; the repository also cautions that the test-time adaptation difference is not significant.
- Claims not supported by the evidence: The results do not prove general continual learning, causal failure attribution, or safe autonomous self-modification in arbitrary tool ecosystems.

## Bloss0m connection

- Related Traditional Chinese routes: No exact published route was added in the current archive scan; place in the agent-systems reading series after human approval.
- Related English routes: No exact published route was added in the current archive scan; connect to the agent evaluation and tool-use reliability clusters during drafting.
- Duplication risk: Medium with existing agent harness, memory, and failure-attribution candidates; the validation-gated localized update loop is the differentiator.
- Suggested internal links: `agent-systems`, `agent-evaluation`, and the existing long-horizon memory/failure-attribution Radar candidates.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 4 evidence quality + 5 reproducibility + 5 engineering value + 5 series value = 29. Public code and evaluation structure are strong; benchmark dependence and non-causal diagnosis reduce evidence confidence.
- Open questions requiring human approval: Reproduce at least one benchmark, inspect trace-to-update examples, and decide whether the strongest article claim is “validated memory evolution” rather than “self-improving agent” broadly.

