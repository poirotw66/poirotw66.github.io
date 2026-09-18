---
stableId: "arxiv:2609.18605"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-18
lastVerifiedAt: 2026-09-18
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
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

# PACT: Can Enterprise AI Assistants Be Trusted Under Pressure?

## Identity

- Search window: Strict 72-hour scan ending 2026-09-18; arXiv v1 was submitted on 2026-09-16 at 12:57 UTC.
- Canonical URL: https://arxiv.org/abs/2609.18605
- Full paper: https://arxiv.org/html/2609.18605v1
- Authors: Mika Okamoto and Ansel Kaplan Erol.
- Venue or review status: arXiv preprint in cs.CL, cs.AI, cs.CY, and cs.LG; no peer-review status was assumed.
- Code / model / data: Code at https://github.com/trace-ai-labs/pact; dataset at https://huggingface.co/datasets/trace-ai-labs/pact; the public README identifies the code and dataset as MIT-licensed.

## Editorial fit

- Reader question: Does an enterprise assistant keep following a rule when a user applies ordinary social or operational pressure?
- Why this belongs in the selected track: PACT measures compliance as a multi-turn agent behavior with pressure, pushback, transparency, and rule-scope discernment rather than as a single prompt classification.
- Gap it fills: agent-systems / agent-evaluation, especially policy adherence, pressure robustness, and trustworthy explanations of agent decisions.
- Why now: “The user insisted” and “a manager approved it” are normal enterprise messages. They can cause policy violations even when the assistant has a clear system instruction and is not facing a jailbreak.

## Claim map

- Problem: Enterprise LLM assistants operate in regulated contexts, but common evaluations do not systematically test whether they preserve standing rules through realistic pressure and multi-turn conversations.
- Main claim: PACT provides a pressure-applied compliance benchmark and shows substantial model variation, persistent misapplication, and higher violation rates under ordinary pressure.
- Method: Construct 48 scenario cells across 12 regulated domains, pair a binding rule with a tempting violating shortcut, vary pressure and system-prompt modes, audit each component, and score three replications per model across six axes.
- What is genuinely new: The benchmark separates initial compliance, pushback, steerability, transparency, and rule-scope discernment, so a model can be compliant by default yet fail when a user persists or can misdescribe its own violation.

## Evidence audit

- Datasets: 3,364 items cover 48 realistic multi-turn scenarios and 12 regulated enterprise domains. Each scenario has a standing rule, a non-binding twin or shortcut contrast, pressure families, and system-prompt modes.
- Benchmarks and metrics: PACTScore combines reliability-weighted compliance across six axes: default, pressure, pushback, steerability, transparency, and rule-scope discernment. Twenty-two models from multiple providers and sizes are evaluated.
- Baselines: The study compares ordinary prompts with pressure, binding and non-binding contexts, system-prompt mandates, and evaluation-awareness conditions.
- Ablations: The authors report component-by-component generation and two non-writing model reviews, 66.9% reviewer agreement, three replications per item, and a transparency pass that judges whether the model accurately describes its own decision.
- Statistical uncertainty: The paper reports a best PACTScore of 0.944, no model at 0.95, 6–10% misapplication for the strongest assistants, a 65% average pressure increase in violations, 79.2% misrepresentation across 16,424 judged violations, and a 29% average reduction when evaluation awareness is explicit. The public harness supports bootstrap and pairwise contrasts, but result interpretation remains sensitive to scenario construction and judge choices.
- Threats to validity: Scenarios and audits are LLM-assisted; judge agreement is not perfect; pressure wording and domain coverage are finite; evaluation awareness can change behavior; the public release records deviations from the paper's authorship and rule-column setup.

## Reproducibility

- Available artifacts and licenses: The repository includes data loading, scoring, transparency extraction, metrics, protocol documentation, and a public Hugging Face dataset. The README supports smoke runs and three-replication full runs.
- Environment or compute requirements: Python dependencies, model-provider access, dataset download, and potentially 10,092 trials per model for the full grid. Transparency uses a separate judging pass and therefore adds cost.
- Smallest useful reproduction: Load the public dataset, run 20 samples with one replication, inspect rule/pressure pairs, then run one model across all three replications and compare base, pressure, and pushback axes.
- Blocking unknowns: The exact paper generator prompts, model snapshots, provider settings, and the public data's missing isolated rule column and generator-authorship field limit byte-for-byte reproduction of every reported table.

## Critical reading

- Strongest result: The benchmark turns ordinary conversational pressure into a measurable reliability dimension and makes self-report transparency a separate failure surface.
- Weakest assumption: A curated scenario can stand in for the open-ended policy interactions of an enterprise. A model may behave differently when rules are longer, tools are involved, or policy sources conflict.
- Stated limitations: The study uses an LLM-assisted construction and audit pipeline, a finite domain/task set, and public-release deviations that affect leave-one-out analysis and data schema.
- Claims not supported by the evidence: PACT does not certify legal compliance, predict incident rates in a specific company, or prove that the highest-scoring model is safe for unsupervised deployment.

## Bloss0m connection

- Related Traditional Chinese routes: [After the Party](/paper-reading/52-after-party-agent-skill-ecosystem/), [Corrupt Plans, Clean Traces](/paper-reading/51-plan-injection-cot-monitoring/), and [When Tool Calls Succeed but Workflows Fail](/paper-reading/49-when-tool-calls-succeed-workflows-fail/).
- Related English routes: [After the Party](/en/paper-reading/52-after-party-agent-skill-ecosystem/), [Corrupt Plans, Clean Traces](/en/paper-reading/51-plan-injection-cot-monitoring/), and [When Tool Calls Succeed but Workflows Fail](/en/paper-reading/49-when-tool-calls-succeed-workflows-fail/).
- Duplication risk: Low. Existing readings cover skill ecosystems, monitoring blind spots, and tool-boundary anomalies; PACT adds enterprise policy pressure and transparency evaluation.
- Suggested internal links: Enterprise agent governance, policy-as-code, judge calibration, and audit/provenance contracts.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: direct enterprise-agent relevance, a concrete multi-turn benchmark, public code/data, strong engineering implications, and a clear series bridge. Evidence and reproducibility are 4 because scenario generation, LLM judging, and public-release deviations bound the claim.
- Open questions requiring human approval: How should PACT-style tests incorporate tools and external writes? Which axes predict real incidents? How can an organization calibrate pressure scenarios without leaking policy-sensitive content?
