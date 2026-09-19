---
stableId: "arxiv:2609.20754"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-19
lastVerifiedAt: 2026-09-19
primaryTrack: "retrieval-systems"
primaryGap: "production-rag"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 5
  total: 30
decision: "deep-read-candidate"
---

# RAFT: A Stateful Retrieval-Augmented Framework for Troubleshooting Agents

## Identity

- Search window: Strict 72-hour scan ending 2026-09-19; arXiv v1 was submitted on 2026-09-17.
- Canonical URL: https://arxiv.org/abs/2609.20754
- Full paper: https://arxiv.org/html/2609.20754v1
- Venue or review status: EMNLP 2026 Industry Track; the arXiv version remains the inspected source.
- Code and data: https://github.com/microsoft/RAFT; the paper releases the synthetic benchmark, implementation, and Apache Jira evaluation setup.

## Editorial fit

- Reader question: How should a troubleshooting RAG system retrieve the state that led to a fix, instead of only matching the final text?
- Track and gap: retrieval-systems / production-rag.
- Why now: Operational support cases are trajectories. A current symptom can require an earlier state, intervention, and outcome from the same historical case.

## Claim map

- Problem: Vanilla document retrieval breaks the temporal and causal structure of closed support cases.
- Method: RAFT represents each case as a directed chain of timeline entries, retrieves matching intermediate states, and returns the parent trajectory; an optional graph links case-level relations.
- Main result: Case Hit improves over vanilla RAG and GraphRAG at every progress stage on the synthetic Windows Server benchmark, with statistical significance.
- Transfer check: On 30 audited Apache Jira duplicate groups with 570 distractors, RAFT beats vanilla retrieval, but the result is directional rather than a production claim.

## Evidence audit

- Datasets and benchmarks: Synthetic Microsoft Learn Windows Server troubleshooting cases plus real Apache Jira duplicate labels.
- Metrics and comparisons: Case Hit across 0/30/60% progress, vanilla RAG and GraphRAG baselines, and a human-audited Jira transfer set.
- Reported values: Synthetic RAFT 0.842/0.871/0.888 versus vanilla 0.673/0.719/0.769; Jira RAFT 0.833/0.840/0.895 versus vanilla 0.667/0.667/0.789.
- Limitations: Synthetic cases are moderate in scale; the Jira audit covers only 30 groups and reports no confidence intervals or production-scale deployment.

## Reproducibility

- The public Microsoft repository and benchmark make the retrieval layer inspectable.
- A useful first rerun is to reproduce the synthetic Case Hit table, then replay the 30-group Jira audit with its distractor construction.
- Remaining unknowns include corpus drift, annotation cost, index maintenance, and whether parent-trajectory retrieval remains useful when cases are incomplete.

## Critical reading

- Strongest insight: In troubleshooting, the unit of retrieval is not a paragraph but a state transition inside a case.
- Main risk: A trajectory can also import irrelevant or stale interventions if state matching is weak; higher Case Hit does not by itself prove better resolution outcomes.
- Evidence limit: The authors provide an unusually concrete artifact, but all reported gains are author-run and the external transfer sample is small.

## Bloss0m connection

- Related routes: agentic RAG, partial-answer quality, and trace/provenance articles.
- Suggested article focus: draw the data model first, then compare paragraph retrieval with state-plus-parent retrieval and show where production drift enters.

## Recommendation

- Output level: Deep Read.
- Score rationale: 30/30: direct production-RAG problem, strong novelty, public implementation/benchmark, paired real-world audit, and high engineering value.
- Open questions: How should a live case be appended, corrected, or marked incomplete without corrupting future retrieval?
