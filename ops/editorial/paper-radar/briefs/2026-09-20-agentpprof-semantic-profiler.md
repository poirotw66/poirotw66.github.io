---
stableId: "arxiv:2609.20301"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-20
lastVerifiedAt: 2026-09-20
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 4
  total: 29
decision: "deep-read-candidate"
---

# AgentPProf: Semantic Profiler for Long Horizon AI Agents

## Identity

- Search window: Seven-day backfill ending 2026-09-20; arXiv v1 was submitted 2026-09-14.
- Canonical URL: https://arxiv.org/abs/2609.20301
- Full paper: https://arxiv.org/html/2609.20301v1
- Authors: Yusheng Zheng, Chaokun Chang, Yu Mao, Tianyuan Wu, Yuxi Huang, Tao Ma, Wenan Mao, Shuyi Cheng, Andi Quinn, and Wei Wang.
- Source type: arXiv preprint with a public implementation.
- Artifact: [AgentSight](https://github.com/eunomia-bpf/agentsight), which contains the system-level capture, agent-native session paths, pprof-compatible views, and example commands.

## Editorial fit

- Reader question: How do you profile an agent across many runs when the expensive unit is a task intent, not a function call?
- Track and gap: agent-systems / agent-evaluation.
- Why now: AgentPProf turns semantic operation stacks into pprof-compatible profiles and flame graphs, connecting task/subtask attribution with token, resource, and failure analysis.

## Claim map

- Problem: Existing traces debug individual executions but do not aggregate long-horizon behavior into stable, comparable hotspots.
- Method: Uniform operations, semantic operation stacks, recursive trajectory segmentation, and profile aggregation for flame-graph analysis.
- Main result: The paper reports 0.764 B3 F1 against human annotations on CodeTraceBench and up to 56% MAP improvement on three problem-localization benchmarks.
- Inspectable artifact: AgentSight exposes local capture, prompts/model/tool/process/file/network views, pprof outputs, and an explicit warning that captured data can be sensitive.

## Evidence audit

- Primary evidence inspected: arXiv abstract/full record and the linked AgentSight repository README/usage documentation.
- Strength: The paper's evaluation claims are paired with an executable system that covers both agent-native session files and system-level observation.
- Limitations: Independent benchmark reproduction, cross-platform eBPF parity, profiling overhead beyond the repository's own report, and semantic segmentation quality under novel agent families remain unverified.

## Critical reading

- Strongest insight: Long-horizon agent observability needs an aggregation key for intent and subtasks, not just another span ID.
- Main risk: A flame graph can make attribution look precise even when semantic segmentation is uncertain; profile width is not causal proof.
- Suggested article focus: compare application-level tracing with system-level observation, then make the privacy boundary explicit because prompts, headers, paths, and network targets may be captured.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30: strong observability problem fit, public runnable artifact, measurable benchmark claims, and direct engineering consequences; independent rerun and cross-platform validation are still missing.
