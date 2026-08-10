---
stableId: "arxiv:2608.06790"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-10
lastVerifiedAt: 2026-08-10
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 2
  engineeringValue: 5
  seriesValue: 4
  total: 25
decision: "deep-read-candidate"
---

# AgentChaos: Chaos Engineering for Agent Systems via Programmatic Fault Injection

## Identity

- Stable ID: `arxiv:2608.06790`.
- Current version: arXiv v1, submitted 2026-08-07; accepted at the 41st IEEE/ACM International Conference on Automated Software Engineering (ASE 2026).
- Canonical URL: https://arxiv.org/abs/2608.06790
- Full paper: https://arxiv.org/html/2608.06790v1
- Venue record: https://conf.researchr.org/track/ase-2026/ase-2026-research-track
- DOI / aliases: Related DOI `10.1145/3832783.3837437` is listed by arXiv; no public author repository was identified in the paper page during this scan.

## Editorial fit

- Reader question: How can an agent team test behavior when the model API returns crashes, omissions, truncations, or malformed tool-call values without modifying the agent source code?
- Series track / gap: `agent-systems` / `agent-evaluation`, with a secondary connection to runtime reliability and operations.
- Why now: The 2026-08-07 ASE paper moves agent testing from happy-path benchmark runs to runtime fault injection at the shared HTTP boundary.
- Existing coverage and duplication risk: It complements `08-osreward-agent-evaluation` and the published trajectory-monitoring paper `arxiv:2608.02464`; those evaluate outcomes or repair, while AgentChaos stresses the system before deployment. Duplication risk is medium.

## Claim map

- Problem: LLM API faults can propagate across downstream agents, but existing injection methods may be offline, require source changes, or fail to target specific response fields.
- Main claim: AgentChaos injects crash, omission, and value faults at runtime across content and tool-call fields and reports up to a 50-point pass@1 drop under 65 fault configurations.
- Method: Intercept the shared HTTP interface, mutate selected response fields, verify that each fault actually triggered, and compare degradation and diagnosis across systems, benchmarks, and backbone models.
- What is genuinely new: A non-intrusive fault taxonomy and trigger verification make agent-specific chaos experiments executable without changing the tested source.

## Evidence audit

- Fault coverage: Crash, omission, and value faults over content and tool-call fields, with 65 configurations.
- Evaluation: Multiple agent systems, benchmarks, and backbone LLMs; pass@1, fault-type diagnosis accuracy, and fault-step diagnosis accuracy are reported in the primary abstract and paper.
- Main reported results: All tested systems degrade; pass@1 falls by up to 50 percentage points. Diagnosis accuracy remains below 53% for fault type and below 56% for fault step in the reported baselines.
- Controls and limits: Trigger verification filters untriggered tasks; the paper is accepted at ASE 2026, but a public executable artifact, exact model/version matrix, and full cost trace are unknown.
- Threats to validity: HTTP-level mutations are not the same as provider incidents, network partitions, tool-side corruption, authorization failures, or semantic data drift; pass@1 is not a production SLO.

## Reproducibility

- Available artifacts and licenses: arXiv PDF/HTML/TeX and an ASE venue record are available. No paper-specific public repository or license was identified during this scan.
- Environment or compute requirements: A controllable LLM API proxy, agent systems with HTTP-based model access, benchmark tasks, fault schedules, and trigger-validation instrumentation.
- Smallest useful reproduction: Wrap one agent stack with a local proxy, inject deterministic crash/omission/value faults into one content field and one tool-call field, and compare clean versus faulted pass@1 with trigger counts.
- Blocking unknowns: Source code, fault schedule files, exact model and benchmark versions, random seeds, and full diagnostic baselines remain unknown.

## Critical reading

- Strongest result: The work turns API failure semantics into a test matrix and explicitly prevents false conclusions from faults that never triggered.
- Weakest assumption: A shared HTTP boundary is convenient and broad, but systems with provider SDK retries, streaming transports, caches, or local models may expose different fault surfaces.
- Claims not supported by the evidence: The reported degradation does not prove that every model is equally fragile, that the taxonomy covers all agent failures, or that fault injection predicts real incident frequency.

## Bloss0m connection

- Related Traditional Chinese routes: `08-osreward-agent-evaluation`; `39-enterprise-agentic-ai-governance`; `43-enterprise-ai-agent-security`.
- Related English routes: paired English routes for the same entries.
- Suggested angle: “Agent 的 chaos test 要注入語意故障” — map fault classes to retry, validation, circuit-breaker, and human-escalation gates.

## Recommendation

- Output level: Deep Read.
- Score rationale: 25/30. The paper has a direct reliability consequence, accepted venue status, and a concrete runtime testing method; reproducibility is discounted for the missing public artifact and unknown full configuration.
- Human approval questions: Verify whether an official code release exists before drafting; decide whether to pair the reading with runtime repair/monitoring coverage; keep the HTTP-boundary scope explicit.

