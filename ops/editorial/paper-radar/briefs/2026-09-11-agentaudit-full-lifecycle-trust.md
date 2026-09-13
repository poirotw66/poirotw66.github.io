---
stableId: "arxiv:2609.09875"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-11
lastVerifiedAt: 2026-09-11
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

# AgentAudit：把 Agent 信任評估從結果分數拆到整條 lifecycle

## Identity

- Search window: strict 72-hour scan ending 2026-09-11; arXiv v1 was submitted on 2026-09-09.
- Canonical URL: https://arxiv.org/abs/2609.09875
- Authors: Shrey Nag, Sachita, Abhishek Kumar Singh, Lipi Goel, and Rajeshwar Singh Janwar.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-09; not peer-reviewed.
- DOI / OpenReview / arXiv aliases: https://doi.org/10.48550/arXiv.2609.09875
- Code / model / data: No public implementation or dataset repository was verified from the arXiv record; the paper evaluates GPT-5, Claude Sonnet 5, Sarvam 105B, Llama 3.3 70B, and Gemini 2.5 Flash.

## Editorial fit

- Reader question: When an agent fails or behaves unsafely, can an evaluator identify whether the cause was planning, memory, tool selection, tool invocation, grounding, alignment, or execution rather than returning one pass/fail score?
- Why this belongs in the selected track: AgentAudit frames trust as a trace-level, full-lifecycle measurement problem and attaches to the agent without requiring a particular internal framework.
- Gap it fills: Agent evaluation—failure attribution across planning, memory, tools, grounding, security, and execution integrity.
- Why now: Agent systems can achieve similar task-completion rates while differing sharply in unsafe compliance, tool faithfulness, or execution integrity. A single end-task metric hides the stage where a control failed.

## Claim map

- Problem: Existing benchmarks often test one slice of an agent, such as task completion or security robustness, and rarely attribute an observed failure to the responsible stage.
- Main claim: AgentAudit evaluates ten capability, grounding, security, and behavioral dimensions over recorded traces, then classifies behavior and attributes failures to a lifecycle stage.
- Method: Attach to an existing agent, read its execution trace without changing the agent’s internal implementation, score dimensions such as planner, memory, tool selection, tool correctness, alignment, tool faithfulness, security, and execution integrity, then combine the results into a Composite Trust Score and failure attribution.
- What is genuinely new: It proposes a common trace-level trust interface that can compare different agent implementations while preserving the distinction between inability, unsafe compliance, and execution failure.

## Evidence audit

- Datasets: Nine capability and adversarial tasks are reported across five language models.
- Benchmarks and metrics: The paper reports ten trust dimensions, behavioral classes, failure attribution, and Composite Trust Scores; Claude Sonnet 5 and GPT-5 are reported at 95.1 and 80.6, while Sarvam 105B, Llama 3.3 70B, and Gemini 2.5 Flash score 57.6, 45.7, and 22.6.
- Baselines: The framing contrasts full-lifecycle trace evaluation with task-completion and security-only evaluation families; exact baseline implementations and per-task tables require full-paper extraction.
- Ablations: The arXiv abstract does not expose a complete ablation matrix; inspect the full 23-page paper before treating dimension removal or judge alternatives as established evidence.
- Statistical uncertainty: All traces were scored by a single fixed judge model, and that judge was itself one of the evaluated models. No independent human calibration or cross-judge agreement is visible in the abstract-level evidence.
- Threats to validity: Trace completeness, evaluator prompt sensitivity, task selection, model/version drift, and the possibility that the fixed judge favors or penalizes certain model families can distort the composite score.

## Reproducibility

- Available artifacts and licenses: The paper itself is available under the arXiv record; no public code, trace corpus, or evaluator package was verified from the primary record.
- Environment or compute requirements: Access to the five evaluated model families or substitutes, compatible agent harnesses, nine capability/adversarial tasks, trace capture, and a fixed judge configuration.
- Smallest useful reproduction: Implement the ten-dimension trace schema on one agent, run matched benign and adversarial tasks, compare task completion with unsafe-compliance classification, and repeat scoring with two independent judges.
- Blocking unknowns: Exact prompts, task files, trace schema, aggregation weights, judge temperature/version, and whether a third party can reproduce the reported model ordering.

## Critical reading

- Strongest result: The paper highlights a practical failure class—similar completion behavior but sharply different safety/trust behavior—that ordinary pass/fail metrics can miss.
- Weakest assumption: A single fixed judge can reliably score all ten dimensions across heterogeneous models and tasks without introducing model-specific bias.
- Stated limitations: The abstract explicitly identifies single-judge scoring as a limitation; the full paper should be checked for more detail on task scope, trace assumptions, and evaluator calibration.
- Claims not supported by the evidence: The results do not prove that Composite Trust Score is a universal trust metric, that trace-only evaluation is sufficient for production, or that the reported ranking is stable across judge models and task distributions.

## Bloss0m connection

- Related Traditional Chinese routes: Agent evaluation, Parsing the Stream, deployment realism, provenance contracts, and agent safety.
- Related English routes: The paired agent-evaluation routes after archive-aware lookup.
- Duplication risk: Low to medium; it overlaps with existing evaluator candidates, but its lifecycle taxonomy and unsafe-compliance distinction are a separate framing.
- Suggested internal links: Pair with Parsing the Stream for trace representation, Clean Engineering Unstable Measurement for judge reliability, and CONTINUITY for security-context continuity.

## Recommendation

- Output level: Deep Read.
- Score rationale: 27/30: strong problem fit, a useful ten-dimension decomposition, cross-model comparison, and immediate consequences for agent evaluation dashboards. Evidence and reproducibility are discounted because the primary record exposes no public artifact and relies on a single judge model.
- Open questions requiring human approval: Can independent judges agree on the ten dimensions? How are weights chosen? Which trace fields are mandatory, and how does attribution behave when a failure has multiple interacting causes?
