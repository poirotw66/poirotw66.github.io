---
stableId: "arxiv:2609.01437"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-06
lastVerifiedAt: 2026-09-06
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

# HarnessDev: can LLMs create and evolve their own agent harness?

## Identity

- Stable ID: `arxiv:2609.01437`.
- Canonical URL: https://arxiv.org/abs/2609.01437
- Authors: Yuhao Wu et al.; see the arXiv record for the complete author list.
- Venue or review status: arXiv v1 submitted 2026-09-01; subjects cs.AI and cs.SE.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2609.01437`; no separate venue record located.
- Code / model / data: Paper HTML is available at https://arxiv.org/html/2609.01437v1 and the project page is https://self-developing-agents.github.io/. A separate public code repository was not verified during this scan; the paper provides an interface specification and appendix code, but reproduction depends on model/runtime/task configurations.

## Editorial fit

- Reader question: If the harness—not the model weights—is the unit of agent capability, can an LLM build and improve that infrastructure from only weak development cases and downstream feedback?
- Why this belongs in the selected track: It fills `agent-systems` / `agent-evaluation` with a benchmark for harness creation, evolution, transfer, regression, and executor dependence.
- Gap it fills: Existing harness work explains architecture or optimizes trajectories; HarnessDev evaluates whether a creator can produce runnable execution logic that generalizes to hidden tasks.
- Why now: The benchmark covers six creator LLMs, four domains, five downstream benchmarks, and 2,207 unique instances, with hidden evaluation tasks and explicit creation/evolution separation.

## Claim map

- Problem: Standard agent benchmarks hold the harness fixed and therefore miss the capability of designing tool policy, state, verification, recovery, and stopping logic.
- Main claim: LLMs can create useful harnesses from weak seeds, but evolution from downstream feedback is unstable, transfer is partial, and executor choice strongly affects results.
- Method: Generate a runnable harness from 1–3 development cases, freeze it, evaluate it with a separate executor on held-out tasks, then optionally revise it from downstream feedback.
- What is genuinely new: The benchmark changes the evaluation unit from task output to a harness artifact with capability and efficiency metrics.

## Evidence audit

- Dataset and construction: Six creator models, four domains, five downstream benchmarks, 2,207 unique instances, weak seeds without an execution loop/tool policy/state/verifier/retry/recovery/stopping rule, and hidden evaluation tasks.
- Metrics: Held-out success, executor-token efficiency, creation versus evolution gain, transfer, regression, and executor dependence.
- Project-page evidence: Reported results include 53.1% direction agreement for evolution and only 2 of 9 declared final versions holding the held-out best score; these are project/paper claims and require careful table-level verification before publication.
- Evidence limitation: There is no verified standalone code release, and creator/executor model configurations, budgets, prompts, and benchmark implementations govern the result.

## Reproducibility

- Available artifacts and licenses: Paper, project page, interface description, and appendix code are available; no pinned runnable repository was located.
- Environment or compute requirements: Multiple creator and executor models, domain-specific tools, hidden-task evaluation, and repeated evolution runs.
- Smallest useful reproduction: Implement the interface on one domain with a weak seed, compare a created harness against a fixed reference on held-out tasks, and report regression plus executor-token cost.
- Blocking unknowns: Exact model prompts and budgets, hidden-task leakage controls, artifact versioning, harness sandbox policy, and whether gains survive a different executor family.

## Critical reading

- Strongest result: Separating creator, harness, executor, and task exposes executor dependence and regression—two failure modes hidden by a single end-task score.
- Weakest assumption: A harness that improves on a benchmark's hidden tasks represents general infrastructure capability rather than benchmark-specific adaptation.
- Claims not supported by the evidence: The work does not show autonomous production-ready harness maintenance, durable cross-domain transfer, or safety under arbitrary generated tool logic.

## Bloss0m connection

- Related series areas: agent harnesses, evaluation realism, self-improving agents, and tool-use reliability.
- Related candidates: Prime Agent, SkillZip, TRACE, Terminal-Universe, and EarlyEval.
- Duplication risk: Medium; differentiate by treating the harness as the benchmark artifact and by foregrounding executor dependence and evolution instability.
- Suggested internal links: `15-langchain-agent-harness-anatomy`, `10-effective-harnesses-for-long-running-agents`, `18-phil-schmid-agent-harness-2026`, and `agent-evaluation`.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 4 evidence quality + 3 reproducibility + 5 engineering value + 5 series value = 27. The benchmark design is high-value and distinct, while the missing pinned artifact and model/runtime dependence limit reproduction.
- Open questions requiring human approval: Require the full held-out tables and a precise creator/executor matrix before publication; decide whether to position this as an evaluation paper or a future agent-infrastructure design pattern.

