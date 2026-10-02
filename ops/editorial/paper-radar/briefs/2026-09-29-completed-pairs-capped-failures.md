---
stableId: "arxiv:2609.31381"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-29
lastVerifiedAt: 2026-09-29
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

# Completed Pairs Hide Capped Failures: A ReVerPi Case Study of Selective Context Projection

## Identity

- Search window: Seven-day backfill ending 2026-09-29; arXiv v1 submitted 2026-09-25.
- Canonical URL: https://arxiv.org/abs/2609.31381
- Full paper: https://arxiv.org/html/2609.31381v1
- Author: Guangzhe Zhang, listed as an independent AI researcher.
- Venue or review status: arXiv preprint; peer-review status not established by the source.
- DOI / OpenReview / arXiv aliases: arXiv:2609.31381v1; DOI 10.48550/arXiv.2609.31381.
- Code / model / data: https://github.com/timwhitez/ReVer_Pi (MIT). The arXiv source archive includes analysis data, scripts, and the displayed observation. Repository smoke checks run without API credentials; raw provider exchanges, private settings, local session/ledger databases, and invoices are not distributed.

## Editorial fit

- Reader question: If one arm hits a budget cap and the runner never executes its paired arm, can “completed pairs only” still support a fair comparison?
- Why this belongs in the selected track: It makes stopping rules and censored outcomes part of the measured agent protocol rather than incidental infrastructure.
- Gap it fills: agent-systems / agent-evaluation.
- Why now: Benchmarks increasingly compare cost-saving context, memory, and harness interventions. If a first-arm failure suppresses its paired run, evaluation can hide the failures that matter operationally.

## Claim map

- Problem: Selective context projection may save repeated input but add evidence-retrieval turns; evaluation can bias the comparison if paired runs stop asymmetrically.
- Main claim: In this recorded campaign, completed pairs alone make full and projected context look equal, while capped and unexecuted boundary runs widen the possible success difference and change the cost interpretation.
- Method: The author studies a Pi extension with matched full/projected continuations, reconstructs the runner's stopping process, and applies finite-frame bounds and stratified token/request accounting.
- What is genuinely new: It exposes how “run both arms only if the first finishes” creates missing counterfactual outcomes, and distinguishes a known cap failure from an unexecuted arm with unknown outcome.

## Evidence audit

- Datasets: An 86-run source-reading campaign with 641 model requests; the paper separately identifies 76 paired-or-capture submissions and ten single-arm integration runs.
- Benchmarks and metrics: Among 15 completed pairs, both arms succeed in 12/15. Twelve additional boundary runs stop, and the runner suppresses the companion after first-arm non-completion. Restoring 27 boundary runs bounds projected-minus-full success between -9 and +1 tasks. Among eleven jointly correct pairs, projection reduces aggregate logical tokens by 25% while the median pair uses 29% more; suffix requests rise from 35 to 55.
- Baselines: Matched full-observation versus projected continuations, selector-fitting versus non-fitting cases, and request-level resource accounting.
- Ablations: Selector sensitivity, fitting versus non-fitting examples, the selected capped continuation, and separate accounting of known failures and unknown unexecuted outcomes.
- Statistical uncertainty: The paper uses finite-frame bounds rather than claiming population superiority/noninferiority. Its strongest cost result is restricted to a fully observed success stratum.
- Threats to validity: One adaptive campaign in one Pi/ReVerPi setup, not a population estimate. The author is also the project developer; raw provider logs/private settings are not released, and no independent rerun was found.

## Reproducibility

- Available artifacts and licenses: MIT repository with code, tests, pinned requirements, a source auditor, and an offline end-to-end smoke path; arXiv source archive includes analysis data and reproduction scripts. Complete raw provider exchanges, private settings, local databases, and invoices are withheld.
- Environment or compute requirements: Python 3.11+, Node.js 22.19+, and the pinned Pi release for the extension; offline smoke uses a protocol-only mock. Real provider reruns require separately configured paid APIs.
- Smallest useful reproduction: Run the offline smoke, then create a toy paired-evaluation runner in which one capped arm cannot suppress its already-allocated companion; compare complete-pair-only summaries with explicit boundary accounting.
- Blocking unknowns: Independent reproduction with real providers, raw call-level traces, and generalization beyond this single agent/context-projection campaign.

## Critical reading

- Strongest result: The stopping path shows how complete-pair filtering can conceal bounded failures and how aggregate token savings can coexist with higher median-pair cost and more requests.
- Weakest assumption: This is a case study; finite-frame bounds do not establish how often the bias occurs across other benchmark harnesses.
- Stated limitations: No population superiority/noninferiority claim; non-executed companions remain unknown; complete raw provider records and private configuration are unavailable.
- Claims not supported by the evidence: The paper does not show that context projection is generally worse or that these cost/success patterns transfer to other agents, tasks, models, or production workloads.

## Bloss0m connection

- Related Traditional Chinese routes: #22 SWE-Bench ProMax; #49 When Tool Calls Succeed but Workflows Fail; #54 SilentProbe.
- Related English routes: The paired #22, #49, and #54 readings.
- Duplication risk: Adjacent to benchmark-cost and tool-failure work, but distinct in the evaluator's stopping mechanism and the difference between censored pairs, known cap failures, and unknown missing arms.
- Suggested internal links: Pair with #22 trajectory/cost analysis and #49 workflow boundary failures; emphasize that evaluation orchestration itself can create bias.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30 (5/5/4/4/5/5). The stopping path, partial-identification bounds, cost accounting, and runnable project are teachable; evidence and reproducibility are reduced because this is a single-author campaign and the raw provider archive is incomplete.
- Open questions requiring human approval: Keep all numeric claims scoped to this recorded campaign; do not generalize the case into a claim that paired agent benchmarks are inherently invalid.
