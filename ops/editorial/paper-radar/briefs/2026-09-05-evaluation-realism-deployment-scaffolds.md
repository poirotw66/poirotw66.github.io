---
stableId: "arxiv:2609.02302"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-05
lastVerifiedAt: 2026-09-05
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

# Improving Evaluation Realism with Inference-Time Compute and Deployment Scaffolds

## Identity

- Stable ID: `arxiv:2609.02302`.
- Canonical URL: https://arxiv.org/abs/2609.02302
- Authors: Axel Ahlqvist, Richard Guan, Juan-Pablo Rivera, Adeline Kassler, Dmitrii Troitskii, Alexandra Souly, Kai Fronsdal, Robert Kirk, and John Hughes.
- Venue or review status: arXiv v1 submitted 2026-09-02; under review at NeurIPS 2026.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2609.02302`; no separate venue identifier located.
- Code / model / data: https://github.com/AxelAhlqvist1995/petri-bon; https://github.com/meridianlabs-ai/petri_dish; https://github.com/AxelAhlqvist1995/petri-realism-reproduction.

## Editorial fit

- Reader question: How do you make an alignment audit look enough like deployment that the target model cannot dismiss it as a test?
- Why this belongs in the selected track: It fills `agent-systems` / `agent-evaluation` with evaluator realism and deployment-scaffold design.
- Gap it fills: Existing archive coverage discusses deployment simulation; this paper adds a reproducible critique-refinement protocol and a coding-agent harness that narrows the environment gap.
- Why now: The paper combines extra inference-time compute with a deployment-imitating SWE harness and reports larger realism gains when the techniques compose.

## Claim map

- Problem: Evaluation-aware models can detect simulated audits and change behavior, weakening safety conclusions.
- Main claim: Critique refinement and DISH make simulated evaluations harder to distinguish from real deployments; combining them improves realism more than either alone.
- Method: Generate multiple auditor actions, score/critique/refine them for deployment-likeness, and run targets inside a coding harness with deployment-like system prompts, tools, and context.
- What is genuinely new: Realism is treated as an engineering property of the auditor loop and execution scaffold, with frozen prompts and reproduction assets rather than a vague “more realistic” claim.

## Evidence audit

- Study design: Multiple target models and 149 seed instructions plus partial-prefill seeds; the paper compares baseline Petri, a realism filter, critique-refinement iterations, and DISH.
- Metrics: Realism win rates, evaluator-aware behavior, seed adherence, deployment-task recreation, and cross-target comparisons.
- Baselines: Petri baseline, compute-matched multibranch selection, realism filtering, critique refinement, DISH, and composed methods.
- Statistical uncertainty: The paper provides extensive appendices and independent preference comparisons; target/model/judge dependence remains a meaningful source of uncertainty.
- Threats to validity: Critique refinement reduced seed adherence for some targets, coding scaffolds may not represent other agent deployments, and donated real transcripts are limited and not fully redistributed.

## Reproducibility

- Available artifacts and licenses: Public `petri-bon`, `petri_dish`, and frozen reproduction repositories with prompts, seeds, code, data, and figure summaries; visible repositories include MIT-licensed components.
- Environment or compute requirements: Petri/Inspect-compatible runtime, multiple model endpoints, coding-agent scaffold setup, and substantial inference-time compute.
- Smallest useful reproduction: Run a small seed slice with baseline versus two critique rounds, then compare target preference, seed adherence, and cost; separately run one DISH task against a bare API baseline.
- Blocking unknowns: Current upstream Petri drift, provider version snapshots, exact real-deployment transcript availability, and cost/latency at production scale.

## Critical reading

- Strongest result: DISH transcripts were preferred to baseline Petri transcripts for every target in the reported comparison, and the combined methods outperformed either alone.
- Weakest assumption: A target-model preference or judge can reliably identify deployment-like behavior without importing its own evaluation artifacts.
- Stated limitations: Cost reduction and adherence-neutral refinement remain open; GPT-5.5 showed a notable seed-adherence drop.
- Claims not supported by the evidence: Higher realism does not prove higher audit validity, better misalignment discovery, or transfer to every agent harness.

## Bloss0m connection

- Related Traditional Chinese routes: `25-deployment-simulation`, `64-ai-agent-guide`, and `85-trec-rag-2026-rag-evaluation-harness`.
- Related English routes: evaluation awareness, deployment simulation, agent harness fidelity, and red-team economics.
- Duplication risk: Medium to high with the existing deployment-simulation article; differentiate by implementation protocol, harness boundary, adherence trade-off, and frozen reproduction assets.
- Suggested internal links: `agent-evaluation`, `ai-platform-governance`, `25-deployment-simulation`, and `64-ai-agent-guide`.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 5 evidence quality + 5 reproducibility + 5 engineering value + 4 series value = 29. The work has unusually strong artifacts and a clear evaluator-engineering loop, but archive overlap and judge dependence require an explicit follow-up angle.
- Open questions requiring human approval: Decide whether to treat this as a refresh/follow-up to deployment simulation and whether the local reproduction should measure validity, realism, or cost as the primary outcome.

