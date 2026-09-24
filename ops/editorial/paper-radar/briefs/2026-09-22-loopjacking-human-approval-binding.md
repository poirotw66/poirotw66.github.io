---
stableId: "arxiv:2609.21081"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-22
lastVerifiedAt: 2026-09-22
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
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

# Loopjacking: When Human Approval Does Not Bind the Operation

## Identity

- Search window: Seven-day backfill ending 2026-09-22; arXiv v1 was submitted 2026-09-17.
- Canonical URL: https://arxiv.org/abs/2609.21081
- Full paper: https://arxiv.org/html/2609.21081v1
- Authors: Adithyan Akhil, et al.; author list should be verified from the paper metadata before publication.
- Venue or review status: arXiv preprint; review status not verified.
- DOI / OpenReview / arXiv aliases: arXiv:2609.21081v1.
- Code / model / data:
  - Evidence archive and verifier: https://github.com/adithyan-ak/loopjacking
  - The archive uses deterministic local models, synthetic principals, loopback services, and harmless recording sinks.

## Editorial fit

- Reader question: When a human approves an agent action, what proves that the action reviewed is the one eventually executed?
- Why this belongs in the selected track: It isolates a failure at the approval-to-execution boundary, a core reliability problem for tool-using agents with mutable state and encoded representations.
- Gap it fills: agent-systems / tool-use-reliability.
- Why now: Human-in-the-loop is often presented as a security solution; this paper gives two concrete ways that approval can become detached from execution.

## Claim map

- Problem: Approval only helps if the reviewed operation and executed operation are equivalent and remain bound across the final execution step.
- Main claim: Loopjacking can arise through representation mismatch or post-approval state substitution, allowing an operation B to execute after a human approved A.
- Method: Comparative testing across Agno AgentOS releases through 3.0.9, conditional in-memory LangGraph Agent Server versions through 0.14.0, and OpenClaw 2026.2.23/2026.2.24, with OpenAI Agents SDK negative controls.
- What is genuinely new: The paper names and separates two approval-binding failures instead of treating “human approval” as a single binary safeguard.

## Evidence audit

- Datasets: Constructed local scenarios and synthetic principals; no production user data.
- Benchmarks and metrics: Framework/version matrix, reproduced vulnerable and rejecting configurations, and an evidence archive that records the observed operation path.
- Baselines: Different agent-server/framework versions and an OpenAI Agents SDK negative control.
- Ablations: Representation mismatch versus post-approval substitution, plus framework/version comparisons.
- Statistical uncertainty: This is a purposive comparative archive rather than a prevalence survey; no population rate should be inferred.
- Threats to validity: In-memory LangGraph findings are composition-dependent; the evidence cutoff and version churn can change affected behavior.

## Reproducibility

- Available artifacts and licenses: Public archive with `python3 verify_archive.py` read-only verification, loopback services, deterministic local models, and harmless recording sinks.
- Environment or compute requirements: Local Python environment, framework/version fixtures, synthetic principals, and no production provider credentials.
- Smallest useful reproduction: Re-run one representation-mismatch fixture and one post-approval substitution fixture, then inspect the approved and executed operation records.
- Blocking unknowns: Exact dependency lockfile, cross-platform behavior, current framework versions beyond the evidence cutoff, and independent reproduction status.

## Critical reading

- Strongest result: The failure is easy to explain operationally: an approval record is not enough unless it cryptographically or semantically binds the final action and relevant state.
- Weakest assumption: The selected framework configurations and local fixtures cover the ways production systems compose approval, serialization, and mutable state.
- Stated limitations: Purposive sampling, a single-researcher study, framework-specific conditions, and no universal CWE/CVSS or affected-version claim.
- Claims not supported by the evidence: The paper does not establish prevalence across all agent frameworks or imply that every human approval flow is vulnerable.

## Bloss0m connection

- Related Traditional Chinese routes: Agent approval, OAuth consent, tool-use reliability, and provenance contracts.
- Related English routes: Human-in-the-loop security, action binding, mutable tool state, and agent guardrails.
- Duplication risk: Adjacent to pre-action authorization papers; contrast the semantic binding failure with a policy gate that executes immediately before the side effect.
- Suggested internal links: Link to agent permission and workflow failure articles, with a diagram showing approved A → mutable state → executed B.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: highly relevant and novel with an executable public archive and direct engineering consequences; evidence and reproducibility lose points because the study is purposive, single-researcher, and not independently rerun.
- Open questions requiring human approval: Keep the scope narrow, show the two variants with harmless fixtures, and never present the paper as a prevalence estimate.
