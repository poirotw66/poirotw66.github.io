---
stableId: "arxiv:2609.19391"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-20
lastVerifiedAt: 2026-09-20
primaryTrack: "agent-systems"
primaryGap: "agent-security"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# MAGS: Multi-agent Auto-formalization Guarantees Safety for Agentic Outputs

## Identity

- Search window: Seven-day backfill ending 2026-09-20; arXiv v1 was submitted 2026-09-16.
- Canonical URL: https://arxiv.org/abs/2609.19391
- Full paper: https://arxiv.org/html/2609.19391v1
- Authors: Albert Wu, Nicholas Roberts, Tzu-Heng Huang, Haoran Lin, Gil Friedman, Sungjun Cho, Gabriel Orlanski, and Frederic Sala.
- Source type: arXiv preprint with full HTML.

## Editorial fit

- Reader question: Can a coding agent produce executable code while preserving machine-checkable safety properties?
- Track and gap: agent-systems / agent-security.
- Why now: MAGS inserts Dafny as a verification-aware intermediate representation and treats human-audited APIs and safety requirements as frozen contracts.

## Claim map

- Method: Multi-agent semantic generation, autoformalization, proof planning/repair, verifier feedback, and compilation back to the source language.
- Evaluation: 100 CUDA kernels, 100 terminal scripts, and 20 robotic-arm tasks; all 220 examples reportedly produced programs satisfying the frozen specifications.
- Critical result: Independent safety and functional evaluations are reported as strong, but they also expose failures when autoformalized semantics do not capture target behavior.

## Evidence audit

- Primary evidence inspected: arXiv abstract and HTML framework/experiment sections.
- Evidence strength: The domains and sample counts are concrete, and the paper explicitly reports semantic-mismatch failures rather than claiming universal safety.
- Missing evidence: No separate code repository or exact rerun package was verified in the primary record; external replication and broader specification families remain open.

## Critical reading

- Strongest insight: Formal verification can move the safety boundary into the agent's output pipeline, but only the audited specification—not the real world by default—is guaranteed.
- Main risk: A 100% success rate against frozen specs can conceal specification gaps, translation errors, or unsafe assumptions in the formalized API model.
- Suggested article focus: contrast “proof of the encoded contract” with “proof of intended behavior,” using the semantic mismatch failures as the central teach-back.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: concrete agent-to-verifier architecture, multi-domain evaluation, and a valuable specification-limit caveat; public rerun artifacts and independent reproduction remain incomplete.
