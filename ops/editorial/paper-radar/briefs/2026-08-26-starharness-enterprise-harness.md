---
stableId: "arxiv:2608.24804"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-26
lastVerifiedAt: 2026-08-26
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

# StarHarness: Evolving Harnesses with Stratified Search for Enterprise Environments

## Identity

- Stable ID: `arxiv:2608.24804`.
- Canonical URL: https://arxiv.org/abs/2608.24804
- Authors: arXiv author list; use the canonical record for the authoritative spelling.
- Venue or review status: arXiv v1, submitted 2026-08-25; no separate review record identified.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2608.24804`; no separate identifier identified.
- Code / model / data: No paper-specific public code repository was located in the abstract or full HTML during this scan. The paper describes enterprise benchmark environments, task splits, harness configurations, and cost assumptions, but those artifacts need separate verification.

## Editorial fit

- Reader question: If model weights stay fixed, can systematic search over prompts, tools, skills, MCP servers, subagents, and loops repair an enterprise agent's environment-specific failures?
- Why this belongs in the selected track: StarHarness treats the harness as the optimization target and evaluates transfer and held-out generalization across IT, ITSM, and finance workflows. It fills `agent-systems` / `agent-evaluation`.
- Gap it fills: It makes the interface around a model—the harness, tool contract, and operational conventions—the object of evaluation instead of treating the model score as the whole system.
- Why now: The paper reports +20–35 percentage-point improvements after 4–12 accepted changes and compares against prompt/harness optimizers in enterprise-style environments.

## Claim map

- Problem: Enterprise agents fail for environment-specific reasons that may be repairable through interface and workflow changes without retraining the model.
- Main claim: Stratified search over harness changes can discover targeted repairs that improve baseline-failure tasks and transfer to held-out tasks.
- Method: Tasks are stratified by baseline failure; a proposer sees search feedback, while hidden selection and held-out evaluation reduce direct overfitting. The search space includes prompts, task framing, tools, skills, MCP, subagents, and loop structure.
- Reported result: Across ITBench SRE, EnterpriseOps-Gym ITSM, and AutomationBench Finance, the paper reports gains over the compared harness baselines and lower turns, tool calls, and cost in some configurations.
- What is genuinely new: The paper frames harness evolution as a constrained, environment-specific search problem with hidden selection and transfer checks, rather than a single prompt optimization run.

## Evidence audit

- Datasets: ITBench includes 40 Kubernetes root-cause tasks; EnterpriseOps-Gym includes 103 ITSM tasks against a ServiceNow MCP with SQL verifiers; the paper's AutomationBench Finance evaluation uses 100 workflows across 47 simulated SaaS systems and programmatic assertions.
- Benchmarks and metrics: The paper reports success, turns, tool calls, and cost. Its Finance-100 setup and harness differ from benchmark defaults, so the scores are not directly comparable to every prior AutomationBench report.
- Baselines: The full HTML compares against default Stirrup and harness optimizers including Pi, Codex, and GEPA; proposer and evolution runs use GPT-5.4 in the reported setup.
- Ablations: Stratification, hidden selection, held-out transfer, and environment-specific versus transferred harnesses are central checks. The strongest reported deltas are descriptive system comparisons, not a universal ranking.
- Statistical uncertainty: The paper provides task-level results and cost calculations, but the small ITBench set and configuration-dependent search make variance and repeated-seed uncertainty important.
- Threats to validity: Benchmark modifications, simulated enterprise systems, model/provider dependence, harness search budget, and possible leakage through environment conventions constrain generalization.

## Reproducibility

- Available artifacts and licenses: No paper-specific code or released harness artifact was located during this scan; benchmark access and any private configuration dependencies are unknown.
- Environment or compute requirements: Multiple enterprise simulators or SaaS environments, tool/MCP integrations, model API calls, and search iterations. Reported cost reductions use published model rates.
- Smallest useful reproduction: Recreate one benchmark with a fixed model and explicit default harness, run the stratified proposer/selector with a held-out task split, and log every accepted change, tool contract, cost, and failure category.
- Blocking unknowns: Public implementation status, exact prompts and harness artifacts, seed variance, and whether the benchmark environments can be reproduced outside the authors' setup.

## Critical reading

- Strongest result: The task-stratified and held-out design addresses a real deployment question: whether harness changes repair environment-specific failures without changing model weights.
- Weakest assumption: A search-selected harness that transfers on the reported held-out split will remain robust under new tools, policies, data, and operational conventions.
- Stated limitations: The paper flags system-dependent comparisons and benchmark-specific evaluation boundaries; the custom Finance-100 configuration is especially important for interpreting cross-paper comparisons.
- Claims not supported by the evidence: The results do not establish that harness evolution replaces training, works for arbitrary enterprise environments, or has the same gains with open-weight or independently reproduced models.

## Bloss0m connection

- Related Traditional Chinese routes: No exact published route was added in the current archive scan; place in the agent-systems reading series after artifact verification.
- Related English routes: No exact published route was added in the current archive scan; connect to the existing self-improving harness and enterprise-agent evaluation candidates.
- Duplication risk: High with Recuris and Prime Agent, but StarHarness is distinct in its enterprise environment, stratified search, and held-out transfer framing.
- Suggested internal links: `agent-systems`, `agent-evaluation`, `enterprise-rag` only if a retrieval/tool-boundary section is retained.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 4 evidence quality + 2 reproducibility + 5 engineering value + 5 series value = 26. The enterprise evaluation design is valuable, but the missing public artifact and non-comparable benchmark variants require a demanding audit.
- Open questions requiring human approval: Locate or request the exact harness artifacts, verify benchmark modifications, and decide whether the results support a general method claim or only a strong enterprise case study.

