---
stableId: "arxiv:2609.29921"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-28
lastVerifiedAt: 2026-09-28
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# Who Holds the Pen? Let Specifications, Not Agents, Sign Off

## Identity

- Search window: Seven-day backfill ending 2026-09-28; arXiv v1 was submitted 2026-09-24.
- Canonical URL: https://arxiv.org/abs/2609.29921
- Full paper: https://arxiv.org/html/2609.29921
- Authors: Haiqing Li, Xin Ma, Yinhao Wu, Wenliang Zhong, Feng Jiang, Thao M. Dang, Xiao Hu, Hehuan Ma, Yuzhi Guo, and Junzhou Huang.
- Venue or review status: arXiv preprint; peer-review status not established by the source.
- DOI / OpenReview / arXiv aliases: arXiv:2609.29921v1; DOI 10.48550/arXiv.2609.29921.
- Code / model / data: The paper evaluates SkillsBench and GuideBench materials and names SpecHarness, but no official SpecHarness repository or released implementation was found in the paper or project links during this scan. Dataset access/license and independent reproduction remain unverified.

## Editorial fit

- Reader question: If an agent says a task is complete, what independent evidence gives the system authority to accept that claim?
- Why this belongs in the selected track: The work measures completion and specification-following failures, then proposes a runtime that separates agent proposals from authoritative state transitions.
- Gap it fills: agent-systems / agent-evaluation.
- Why now: Agent skills, instructions, and acceptance criteria often live in the same context as the agent that executes and self-certifies them; the paper quantifies this authority gap rather than treating it as a prompt-quality issue.

## Claim map

- Problem: An agent may understand a requirement without satisfying it, and its self-reported completion does not prove that the required state exists.
- Main claim: The authors identify an understanding–execution gap and a state–authority gap, then use SpecHarness to compile source-grounded requirements into versioned obligations whose state is committed only from qualified evidence.
- Method: On 87 SkillsBench tasks, the authors extract 509 source-grounded task directions from agent-visible prompts, workspace material, and skills. They evaluate seven models, compare raw execution with several specification-governance paradigms, and run a separate guideline-following evaluation on GuideBench.
- What is genuinely new: Specifications are not only behavioral context or a post-hoc checklist; they define which evidence providers may establish state and which conditions permit finalization.

## Evidence audit

- Datasets: SkillsBench tasks and a separate GuideBench guideline-following benchmark; the paper reports 509 measured task directions and 5,817 rule-local obligation instances for category analyses.
- Benchmarks and metrics: Across seven models, only 79.6–86.4% of extracted directions are satisfied, while agent completion-claim rates exceed official evaluator pass rates by 28.7–37.9 percentage points. On SkillsBench, macro pass rises from 61.1% to 73.1%; U–E falls from 17.4% to 9.3%; S–A falls from 32.8% to 12.8%.
- Baselines: Ungated raw agent execution, rubric-based condition, verifier gating, and an AgentSpec-style mediated condition; seven model families are evaluated.
- Ablations: The paper reports runtime architecture ablations and compares execution mediation, validator feedback, state commitment, and finalization boundaries.
- Statistical uncertainty: The macro pass comparison reports a paired task-bootstrap 95% interval excluding zero; per-model exact McNemar tests remain significant after Holm correction.
- Threats to validity: The direction index measures visible source-grounded requirements, not complete recovery of evaluator semantics. The paper explicitly states the full-runtime comparison includes online validation, feedback, and repair, so it does not isolate the causal effect of authoritative commitment alone. Results are author-reported and have not been independently reproduced.

## Reproducibility

- Available artifacts and licenses: Full arXiv v1 paper and its detailed methods, tables, appendices, and replay examples are public. No official SpecHarness code release or complete experiment package was located; licenses/access conditions for all task materials were not verified.
- Environment or compute requirements: Not fully specified for an independent full rerun; seven-model evaluation implies access to the evaluated systems and task harnesses.
- Smallest useful reproduction: Reimplement one SkillsBench task with source-linked obligations and a qualified validator; compare ungated completion claims with fail-closed evidence-backed finalization, preserving the same task and evaluator.
- Blocking unknowns: Official implementation, exact runnable configs, full task-material availability, cross-model inference cost, and external reproduction.

## Critical reading

- Strongest result: A strikingly large gap between agent completion claims and official pass rates appears across seven models, and the paper reports improvements under multiple paired comparisons.
- Weakest assumption: The extracted obligations and qualified evidence providers may not cover all relevant requirements or production state transitions; a more governed loop can also increase calls and runtime cost.
- Stated limitations: The paper distinguishes visible requirement coverage from complete evaluator reconstruction and acknowledges that the full-runtime result does not isolate state commitment from validation, feedback, and repair.
- Claims not supported by the evidence: The reported improvement is not evidence that adding a ledger or commit primitive alone yields the same gains, nor that every subjective specification can be made into a safe hard gate.

## Bloss0m connection

- Related Traditional Chinese routes: #75 Agent Skills version-specific plugin migration; #49 When Tool Calls Succeed but Workflows Fail; agent approval and evidence-backed completion.
- Related English routes: The paired #75 and #49 readings, plus agent evaluation and runtime governance coverage.
- Duplication risk: Adjacent to skill-compliance and workflow-reliability studies, but distinct in its explicit proposal-versus-authority boundary and measured completion overclaim. Compare rather than repeat the surrounding findings.
- Suggested internal links: Relate version-specific skill execution to source-grounded obligations, then connect successful tool calls to evidence required before finalization.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30 (5/5/5/3/5/5). The paper provides multi-model comparisons, paired statistical tests, architecture ablations, and unusually explicit limits. Reproducibility is 3 because method detail is substantial but no official implementation or full rerun package was found.
- Open questions requiring human approval: Keep the headline completion-claim/pass gap tied to the paper's exact benchmark; do not claim the authority-commit component alone caused the full gain; explain that subjective requirements remain advisory.
