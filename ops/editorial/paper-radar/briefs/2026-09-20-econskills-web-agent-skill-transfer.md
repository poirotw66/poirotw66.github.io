---
stableId: "arxiv:2609.19523"
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
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 4
  total: 28
decision: "deep-read-candidate"
---

# EconSkills: Studying Skill Transfer and Retrieval for Web Agents on Live Economic Data

## Identity

- Search window: Seven-day backfill ending 2026-09-20; arXiv v1 was submitted 2026-09-17.
- Canonical URL: https://arxiv.org/abs/2609.19523
- Full paper: https://arxiv.org/html/2609.19523v1
- Authors: Yinzhu Quan (Georgia Institute of Technology) and Zefang Liu (Capital One).
- Source type: arXiv preprint with full HTML and reproduction details.
- Supporting artifacts: EconWebArena, BrowserGym/AgentLab ecosystem references, 50 extracted skills, 360 live tasks, and an appendix describing corrections and aggregation.

## Editorial fit

- Reader question: Does an agent skill library transfer a verified web procedure, or does it merely replay a lucky trajectory?
- Track and gap: agent-systems / agent-evaluation.
- Why now: The paper makes skill reuse measurable by separating matched-skill transfer from library-scale retrieval and by recording verification/recovery steps in each SOP.

## Claim map

- Method: Solve seed tasks on live economic portals, distill successful trajectories into parameterized standard operating procedures, retrieve skills, and evaluate held-out variants.
- Evaluation: 50 skills from 50 solved seed tasks, 100 matched held-out variants with three runs per condition, and 360 deployment tasks across 37 authoritative websites.
- Main result: Matched skills improve success and reduce steps on paired successes; at library scale, gains are strongest for directly covered tasks and approximate matches can offset the benefit.

## Evidence audit

- Primary evidence inspected: arXiv v1 abstract, full HTML, experimental setup, and reproduction appendix.
- Strength: The study fixes model, browser environment, observations, and action budget, and uses an automatic check requiring both the value and an authoritative landing URL.
- Limitations: The source describes a concrete evaluation ecosystem but does not provide an independently verified full rerun in this audit; coverage gaps and live-site drift materially affect outcomes.

## Critical reading

- Strongest insight: A reusable skill must include scope, verification, and recovery—not just a trajectory or a prompt snippet.
- Main risk: Approximate skill matches can hurt uncovered tasks, so retrieval coverage and abstention are part of the product contract.
- Suggested article focus: explain the two experiments separately and show why a library's overall average can hide high gains on covered tasks and regressions elsewhere.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: live-web agent problem, explicit skill schema, controlled transfer/deployment split, and concrete scale; long-term portal drift and a complete independent rerun remain limitations.
