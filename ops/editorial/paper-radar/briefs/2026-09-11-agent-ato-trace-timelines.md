---
stableId: "arxiv:2609.08301"
sourceVersion: "v1"
status: "shortlist"
firstSeenAt: 2026-09-11
lastVerifiedAt: 2026-09-11
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 4
  evidenceQuality: 3
  reproducibility: 2
  engineeringValue: 5
  seriesValue: 4
  total: 23
decision: "collect"
---

# Agent ATO：把 coding agent 的 console log 變成可比較的 interaction timeline

## Identity

- Search window: strict 72-hour scan ending 2026-09-11; arXiv v1 was submitted on 2026-09-08.
- Canonical URL: https://arxiv.org/abs/2609.08301
- Authors: Takuto Kawamoto, Yoshiki Higo, and Raula Gaikovina Kula.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-08; not peer-reviewed.
- DOI / OpenReview / arXiv aliases: https://doi.org/10.48550/arXiv.2609.08301
- Code / model / data: The prototype is implemented for the Pi coding agent; the primary record links Pi as a reference but no Agent ATO repository or released dataset was verified.

## Editorial fit

- Reader question: How can a developer see whether a coding agent searched, read, edited, and validated in a sensible order without manually reading a long raw log?
- Why this belongs in the selected track: Agent ATO is a concrete observability surface for the agent-evaluation gap, with filtered views that retain temporal context rather than reducing a run to its final patch.
- Gap it fills: Agent evaluation—human-inspectable trajectory visualization and token-use attribution.
- Why now: Final code changes conceal missing validation loops, repeated exploration, and whether token spikes came from model output or oversized tool results.

## Claim map

- Problem: Console logs preserve agent actions but are difficult to scan for process-level cues such as edit-without-test or repeated reconsideration.
- Main claim: Reconstructing logs into an all-interaction timeline plus Discovery, Reading, Writing, and Execution views helps developers compare trajectories and identify process differences.
- Method: Parse LLM messages, tool calls, shell commands, tool results, token usage, and timestamps; classify interactions; render full and filtered timelines while preserving drill-down context.
- What is genuinely new: The prototype treats coding-agent behavior as an observable interaction trajectory and adds token-source visualization, not hidden-intent inference or automated failure diagnosis.

## Evidence audit

- Datasets: Selected runs from two repair tasks, with repeated executions under the same prompt and environment.
- Benchmarks and metrics: No broad benchmark; the paper presents qualitative case studies comparing validation behavior and token-usage causes.
- Baselines: Raw console-log inspection and repeated runs of the same coding task serve as practical comparison conditions.
- Ablations: No formal ablation or tagging-accuracy evaluation is reported in the current paper; future work explicitly lists comparison with raw-log inspection.
- Statistical uncertainty: The evidence is illustrative and case-study based, not a statistical estimate of developer productivity or trajectory quality.
- Threats to validity: One agent, two tasks, selected runs, and unvalidated rule-based tags limit generalization; a clearer visualization may still fail to produce better interventions.

## Reproducibility

- Available artifacts and licenses: The arXiv paper and the referenced Pi agent are available; a public Agent ATO implementation and logs were not verified.
- Environment or compute requirements: A Pi event-log format or compatible adapter, log parsing, classification rules, and a visualization layer.
- Smallest useful reproduction: Capture ten repeated runs of one repair task, reconstruct Discovery/Reading/Writing/Execution events, and compare the timeline with raw-log inspection for missed validation loops and token-source attribution.
- Blocking unknowns: Parser implementation, event schema, tagging rules, UI code, data release, and whether the prototype handles other agents or log formats.

## Critical reading

- Strongest result: The two cases make a useful distinction between “many tokens” caused by long model output and “many tokens” caused by large tool results, and between edits followed by tests and edits without validation.
- Weakest assumption: Rule-based interaction tags and a timeline are sufficient to expose actionable process signals across coding agents.
- Stated limitations: The paper itself limits evidence to one agent, two tasks, selected runs, and unvalidated tags, and leaves tagging accuracy and intervention effectiveness for future work.
- Claims not supported by the evidence: The work does not show reduced debugging time, improved agent success, or reliable automatic diagnosis.

## Bloss0m connection

- Related Traditional Chinese routes: Parsing the Stream, agent observability, coding-agent evaluation, and long-horizon trace design.
- Related English routes: The paired agent-evaluation routes after archive-aware lookup.
- Duplication risk: Medium with Parsing the Stream; differentiate by focusing on a lightweight human-facing visualization prototype and token-source debugging rather than a typed live-state model with benchmark controls.
- Suggested internal links: Pair with Parsing the Stream for the data-model question and with AgentAudit for lifecycle-level scoring.

## Recommendation

- Output level: Shortlist.
- Score rationale: 23/30: timely and immediately understandable engineering idea, but the evidence is two case studies with no public implementation or formal intervention metric.
- Open questions requiring human approval: Is the parser available? Can independent developers reproduce the tags? Does the visualization actually change prompts, test discipline, or agent-harness design?
