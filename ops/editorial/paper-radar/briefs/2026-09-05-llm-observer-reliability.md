---
stableId: "arxiv:2609.04198"
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
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# Clean Engineering, Unstable Measurement：LLM Judge 的工程正確，不代表量測可靠

## Identity

- Search window: strict 72-hour scan from 2026-09-02 00:31Z to 2026-09-05 00:31Z.
- Canonical URL: https://arxiv.org/abs/2609.04198
- Authors: Haoyuan Zhu and Jie Zhang; University of Sheffield, Ranplan Wireless Network Design, and Cambridge AI+.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-03; full HTML and preregistration-oriented audit details available.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.04198
- Artifacts: The paper describes a tiered reproduction package and append-only audit chain; no complete public executable repository was verified.

## Editorial fit

- Reader question: Before using an LLM judge to freeze a training or evaluation gate, how do we prove that the judge itself is stable enough to measure the target?
- Why this belongs in the selected track: It treats the judge as a measurement instrument and makes instrument validation a preregistered gate rather than an informal reliability statistic.
- Gap it fills: Agent evaluation—reproducible, snapshot-aware evaluation for model judges, ranking readouts, and automated gates.
- Why now: Current agent evaluations increasingly use model judges to score traces, safety, and progress. This paper shows why exact prompts, temperature, and execution logs are insufficient when a shared endpoint can drift behind a stable model name.

## Claim map

- Problem: A black-box LLM observer may return different rankings for identical requests, making a frozen threshold test the serving system’s noise rather than the evaluated behavior.
- Main claim: Two preregistered campaigns fail their instrument gates despite ceiling-level engineering integrity, and the failure can be decomposed into label bias, near-degenerate score gaps, and platform or batch nondeterminism.
- Method: Freeze request plans, hashes, thresholds, and audit rules; collect repeated rankings and byte-identical replays; compare the observed stability to preregistered gates; then run cross-day, cross-provider, self-hosted, and constructed-error supplements.
- What is genuinely new: It gives the judge the authority to terminate a research program if its own stability gate fails, and converts the negative result into a snapshot-identity ladder and reporting checklist.

## Evidence audit

- Scale and gates: 52,988 audited request attempts are logged, with analyses over 31 valid task groups, 100 replay pairs, ten supplementary windows, and 3,060 constructed-error judgments. Same-window ranking agreement is Spearman 0.400 against a required 0.90; next-day byte-identical replay agreement is 0.78 against a required 0.99.
- Failure mechanisms: Label-to-meaning mapping bias can match the signal’s strength, candidate gaps can sit seven orders of magnitude below the instrument noise floor, and exact-permutation readouts amplify one-token instability into ranking changes.
- Controls: A 748,000-call simulated design passed 0 of 500 times under the tested grid; waiting did not help, four providers showed medians from 0.74 to 0.88, and self-hosting helped only while the server was quiet before concurrent load raised disagreement 8.4-fold.
- Engineering output: The paper proposes snapshot identity levels, eight design rules, fail-closed parsing, append-only hashes, excluded-data registers, cost ledgers, and explicit provenance status for every run.
- Statistical uncertainty: The work is carefully preregistered and reports uncertainty, but the task family and measured instrument are author-designed; audit volume is not equivalent to independent sample size.
- Threats to validity: Results are external measurements on shared serving infrastructure, not claims about model internals or any provider’s overall service quality. Constructed errors may overstate the worst-case instability, while self-hosted results may not transfer to all inference stacks.

## Reproducibility

- Available artifacts: Full HTML paper, frozen configuration description, request-attempt ledger schema, audit-chain fields, reporting checklist, and a described tiered reproduction package.
- Environment or compute requirements: Access to multiple model providers or a controllable self-hosted inference stack, repeatable request scheduling, exact response capture, hash validation, and enough calls to estimate the noise floor before freezing a gate.
- Smallest useful reproduction: Select one ranking judge, preregister a stability threshold, repeat identical candidate pairs within a window and across days, record raw responses and metadata, and compare the judge’s noise floor with the candidate gap distribution.
- Blocking unknowns: Public executable package completeness, provider-specific version behavior, current endpoint drift, and whether the same failure boundaries hold for scalar judges or tool-trace evaluators outside the tested design.

## Critical reading

- Strongest result: The study separates execution integrity from scientific validity and demonstrates that perfect delivery, schema, and hashing can coexist with a failed measurement instrument.
- Weakest assumption: The selected ranking task and observer design are representative enough to expose a general evaluation hazard; the authors explicitly scope their conclusion to tested configurations.
- Unsupported leap: The paper does not show that all LLM judges are unusable, nor that self-hosting always solves the problem. Its transferable result is the instrument-first validation discipline.

## Bloss0m connection

- Related routes: agent evaluation, provenance contracts, trace observability, deployment realism, and safety monitoring.
- Duplication risk: Low; existing candidates study what agents do, while this paper asks whether the evaluator can support a scientific gate.
- Suggested internal links: Pair with Parsing the Stream for observer state, Improving Evaluation Realism for deployment-like transcripts, and READY for held-out deployment qualification.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: unusually strong negative evidence, preregistration, large request audit, mechanism decomposition, and directly reusable evaluation rules. Reproducibility is capped because a complete executable artifact was not verified and the central task family is author-designed.
- Open questions requiring human approval: What snapshot identity can a hosted model API actually guarantee? Which judge tasks have enough separation to justify a hard gate, and when should a noisy judge fail closed?

