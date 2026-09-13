---
stableId: "arxiv:2608.25920"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-28
lastVerifiedAt: 2026-08-28
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

# Repair or Resample? Rethinking Failure Debugging in LLM Multi-Agent Systems

## Identity

- Stable ID: `arxiv:2608.25920`.
- Canonical URL: https://arxiv.org/abs/2608.25920
- Authors: Use the canonical arXiv record for the authoritative author list; the paper is a multi-author study of multi-agent failure debugging.
- Venue or review status: arXiv v1 submitted 2026-08-26; no separate review record located.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2608.25920`; no separate identifier located.
- Code / model / data: No paper-specific public implementation repository was located during this scan. The paper exposes its benchmark and annotation design in the full HTML.

## Editorial fit

- Reader question: When a multi-agent run fails, should the system repair the suspected component or resample the trajectory from an earlier point?
- Why this belongs in the selected track: The paper turns failure debugging into selective replay, symptom localization, and intervention choice, directly filling `agent-systems` / `agent-evaluation`.
- Gap it fills: Existing harness and failure-attribution candidates often identify where a run failed; this work evaluates whether a localized intervention can actually repair the run.
- Why now: Across three mainstream multi-agent frameworks, the paper compares unguided reruns with symptom-driven interventions and releases a human-annotated failure trajectory framing.

## Claim map

- Problem: Unguided reruns often reproduce or obscure failures, while full replay is expensive and does not identify the repairable component.
- Main claim: Symptom-driven selective intervention can improve failure repair over unguided resampling by targeting a recorded prefix and a likely failure location.
- Method: SymTrace reconstructs only the prefix before an intervention anchor; SymFail annotates 536 failure trajectories with graph-linked locations, categories, and trace evidence; a repairability score ranks candidate interventions.
- Reported result: The abstract reports 67.97% failure reproduction and 6.90% repair for unguided reruns, versus 20.15% repair for symptom-driven intervention, described as a 191.89% improvement over the comparison.
- What is genuinely new: The paper evaluates debugging as an intervention problem with selective replay, rather than treating a rerun's pass/fail outcome as sufficient diagnosis.

## Evidence audit

- Datasets and benchmarks: SymFail is grounded in WebArena-Verified Hard and AssistantBench-style tasks; the paper evaluates three mainstream multi-agent frameworks.
- Benchmarks and metrics: Failure reproduction rate and repair rate, with matched-case effect sizes and 95% Wilson intervals; paired bootstrap procedures are documented in the appendix.
- Baselines: Unguided rerun/resampling is the key comparison; the paper also distinguishes symptom-driven interventions and repairability ranking.
- Ablations: Intervention anchors, failure categories, and local evidence are used to analyze which nodes are more repairable.
- Statistical uncertainty: The matched-case design and confidence intervals help, but no independent replication or broad framework sweep was located.
- Threats to validity: Benchmark tasks may not represent deployed agent diversity; annotation quality, framework-specific traces, and the gap between a repairable symptom and a causal defect remain important limits.

## Reproducibility

- Available artifacts and licenses: No paper-specific repository or public benchmark package was located in this scan; unknown is preserved.
- Environment or compute requirements: Reproduction would require the three framework configurations, benchmark access, trace capture, and the authors' annotation protocol.
- Smallest useful reproduction: Capture matched failed runs, compare an unguided rerun with one symptom-selected intervention, and report reproduction, repair, cost, and intervention side effects per case.
- Blocking unknowns: Dataset release, annotation files, exact framework versions, model prompts, and intervention implementation are not yet verified.

## Critical reading

- Strongest result: The paper separates “can reproduce the failure” from “can repair the failure,” a distinction that makes agent debugging outcomes more honest.
- Weakest assumption: The observable symptom and local trace evidence identify a repairable node well enough to outperform resampling across changing tasks.
- Stated limitations: The full paper notes benchmark diversity and systematic component optimization as open limitations; absent artifacts further constrain independent reproduction.
- Claims not supported by the evidence: The reported improvement does not prove causal fault localization, lower production cost, or framework-independent repair success.

## Bloss0m connection

- Related Traditional Chinese routes: Existing agent-harness, failure-attribution, and long-horizon evaluation candidates; no duplicate published route was found.
- Related English routes: Connect to `agent-evaluation`, multi-agent coordination, and harness observability.
- Duplication risk: Medium with existing harness and failure-attribution candidates; the repair-versus-resample outcome is the differentiator.
- Suggested internal links: `agent-evaluation`, `agent-systems`, and the existing RAG failure-attribution candidate.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 4 evidence quality + 2 reproducibility + 5 engineering value + 5 series value = 26. The evaluation question is highly useful and the statistical framing is concrete, but the missing artifact prevents a stronger reproducibility score.
- Open questions requiring human approval: Locate or request the annotation and trace artifacts, verify framework versions, and decide whether the article should emphasize debugging methodology or the narrower selective-replay result.

