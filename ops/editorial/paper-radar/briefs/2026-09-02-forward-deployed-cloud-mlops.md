---
stableId: "arxiv:2608.29615"
sourceVersion: "v1"
status: "shortlist"
firstSeenAt: 2026-09-02
lastVerifiedAt: 2026-09-02
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 3
  reproducibility: 2
  engineeringValue: 5
  seriesValue: 5
  total: 25
decision: "shortlist"
---

# Forward-Deployed Full-Stack Engineering for Autonomous Cloud MLOps

## Identity

- Canonical URL: https://arxiv.org/abs/2608.29615
- Authors: Sagar Srinivas Sakhinana, Venkataramana Runkana, Tata Research Development and Design Centre.
- Venue or review status: arXiv preprint, v1 submitted 2026-08-30.
- DOI / OpenReview / arXiv aliases: arXiv:2608.29615; DOI https://doi.org/10.48550/arXiv.2608.29615.
- Code / model / data: No public implementation was identified from the paper page. The HTML paper is licensed CC BY-NC-SA 4.0 and describes a Google Cloud realization.

## Editorial fit

- Reader question: How can an agent be prevented from declaring an MLOps deployment complete before repository, supply-chain, cloud, and runtime evidence actually exists?
- Why this belongs in the selected track: It treats long-horizon cloud engineering as a stateful graph with evidence predicates, retry budgets, bounded repair, and terminal failure.
- Gap it fills: Tool-use reliability—making consequential transitions depend on verifiable system state rather than agent-reported completion.
- Why now: Agent-generated repositories and cloud operations fail at handoffs, stale state, policy violations, and deployment drift; this paper gives those failure paths an explicit runtime shape.

## Claim map

- Problem: A complete MLOps lifecycle spans code, data, infrastructure, security, release, monitoring, retraining, recovery, and rollback, so local task success does not establish operational success.
- Main claim: An evidence-gated multi-agent framework can drive each run toward either a verified deployment or an auditable terminal failure.
- Method: A Graph Orchestrator coordinates generation, review, execution, verification, release, monitoring, reflection, and repair agents. Verification predicates gate forward transitions; failed checks consume bounded retry budgets and re-enter correction or terminate.
- What is genuinely new: The paper combines graph engineering, loop engineering, and agent-harness engineering into a cloud lifecycle where MCP, A2A, sandbox isolation, IAM, policy, provenance, and runtime telemetry are part of the agent boundary.

## Evidence audit

- Datasets: A 100-task cloud MLOps benchmark spanning common datasets and applications such as MNIST, CIFAR-10, MovieLens, SMD, and forecasting or anomaly-detection workloads.
- Benchmarks and metrics: Repository Completeness Score, Repository Acceptance Rate, controlled artifact execution, evidence-gated progression, cloud release/promotion, and bounded recovery/termination.
- Baselines: Multiple model configurations are reported, including GPT-5.6 Sol, Gemini 2.5 Pro, Gemini 2.5 Flash, and Gemini 2.5 Flash-Lite. The core comparisons are framework variants and induced verification perturbations rather than independent agent systems.
- Ablations: Evidence-Gate Bypass, Zero Retry Budget, and retry-budget sensitivity over 1, 3, 5, 10, and 20 attempts.
- Statistical uncertainty: The paper presents controlled scenario rates and tables but does not establish independent confidence intervals or production causal effects in the available source.
- Threats to validity: One cloud realization, synthetic or standard benchmark applications, vendor-specific infrastructure, no public code, and strong dependence on the authors’ verification predicates.

## Reproducibility

- Available artifacts and licenses: Paper and HTML are available; no runnable public repository or dataset package was confirmed.
- Environment or compute requirements: GCP, GKE Sandbox with gVisor, Cloud Build, Artifact Registry, Argo CD, OPA/Gatekeeper, Binary Authorization, observability services, and multiple agent tools are described.
- Smallest useful reproduction: Implement a local state graph with repository, test, release, and runtime predicates; inject a failed verification; verify that the system repairs, re-verifies, and stops after a bounded budget.
- Blocking unknowns: Prompt and tool implementations, cloud cost, exact benchmark task inputs, pass/fail predicate definitions, deployment credentials, and whether the reported Google integrations are reproducible outside the authors’ environment.

## Critical reading

- Strongest result: The paper makes “auditable terminal failure” a first-class success condition and tests bypass, zero-retry, and recovery semantics explicitly.
- Weakest assumption: The predicates and generated artifacts are sufficiently complete and correct to represent operational safety.
- Stated limitations: The paper’s evidence is a controlled realization rather than independent production adoption or a cross-cloud evaluation.
- Claims not supported by the evidence: The experiments do not show that the system is safe for arbitrary production workloads, reduces operator time, or generalizes beyond the chosen GCP stack.

## Bloss0m connection

- Related Traditional Chinese routes: Existing AgentCore, enterprise RAG, governance, provenance, and agent-runtime routes after archive-aware lookup.
- Related English routes: Existing Agent Systems and cloud-platform entries after archive-aware lookup.
- Duplication risk: Medium; keep it as a shortlist companion to contract-centered runtimes and avoid repeating generic “agents build infrastructure” claims.
- Suggested internal links: Compare its evidence gates with MCP/A2A boundaries and the repository-generation risk surface.

## Recommendation

- Output level: Shortlist.
- Score rationale: 5/5 topic relevance, 5/5 novelty, 3/5 evidence quality, 2/5 reproducibility, 5/5 engineering value, 5/5 series value. The architecture is highly relevant, but public artifacts and independent validation are missing.
- Open questions requiring human approval: Are the 100 tasks and predicates available? What is the failure cost and latency of each repair loop? How often does a verified deployment still fail after promotion? Can the evidence contract be cloud-neutral?
