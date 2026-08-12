---
stableId: "arxiv:2608.11166"
sourceVersion: "v1"
status: "published"
firstSeenAt: 2026-08-12
lastVerifiedAt: 2026-08-12
primaryTrack: "agent-systems"
primaryGap: "agent-security"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "published"
---

# Agentic Configuration Management (ACM): A Reference Configuration Model for Governed Agentic Systems

## Identity

- Stable ID: `arxiv:2608.11166`.
- Canonical URL: https://arxiv.org/abs/2608.11166
- Authors: Audrey Quessada-Vial.
- Venue or review status: arXiv v1, submitted 2026-08-11; no venue or review record identified.
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI link; no separate DOI identified.
- Code / model / data: Python reference implementation and evaluation artifacts linked from the paper; GitHub repository https://github.com/audreyqvial/ACM. Framework adapters are described for LangGraph, CrewAI, and the OpenAI Agents SDK.

## Editorial fit

- Reader question: How can a team govern and reproduce an agent system when prompts, tools, skills, policies, workflows, models, and runtime traces are split across frameworks?
- Why this belongs in the selected track: It treats agent configuration as a governed software artifact and explicitly connects configuration revisions to runtime provenance and impact analysis.
- Gap it fills: `agent-systems` / `agent-security`, especially configuration governance, provenance, change impact, and auditability.
- Why now: The paper is a fresh framework-independent proposal with a reference implementation spanning three agent frameworks, rather than another framework-specific orchestration feature.

## Claim map

- Problem: Existing LLMOps and AgentOps tools provide orchestration and observability but do not offer a common configuration-governance model for heterogeneous agentic systems.
- Main claim: Typed, independently versioned Agentic Configuration Items, immutable baselines, configuration-runtime separation, dependency-aware propagation, and runtime provenance can normalize heterogeneous agent configurations into governance-equivalent representations within the evaluated scope.
- Method: Define a canonical Configuration Graph, project native framework configurations into it, apply deterministic governance semantics, and evaluate qualitative governance scenarios plus quantitative impact propagation.
- What is genuinely new: The combination of SCM-style immutable baselines and typed configuration items with framework-independent semantic projection and formal impact propagation; the paper does not claim each component is individually novel.

## Evidence audit

- Datasets: 27 governance scenarios and nine quantitative impact-propagation cases across constructed configurations; no external production dataset.
- Benchmarks and metrics: Governance scenario coverage, semantic preservation, deterministic outcomes, cross-framework projection, and residual configuration inspection scope.
- Baselines: Native configurations from LangGraph, CrewAI, and the OpenAI Agents SDK are projected into the common ACM representation; the paper does not present a broad competitive benchmark against governance products.
- Ablations: Framework and introspection-regime differences are central to the cross-framework evaluation; the full reading should verify the scenario matrix and quantitative case construction.
- Statistical uncertainty: The evidence is mainly conformance and deterministic behavior within the proposed model, not a population estimate; no claim of production-scale effectiveness follows from the reported cases.
- Threats to validity: Framework coverage is narrow, projections may omit governance-relevant semantics, and the current model explicitly leaves distributed execution, multi-agent planning, learning, and autonomous reasoning outside scope.

## Reproducibility

- Available artifacts and licenses: The paper links a Python reference implementation and evaluation artifacts; repository license, release completeness, and executable setup require direct repository verification before drafting.
- Environment or compute requirements: Python, the three framework adapters, configuration fixtures, and the dependencies required to run projection, validation, replay, and governance evaluation.
- Smallest useful reproduction: Project one equivalent agent configuration from each supported framework, validate the resulting configuration graph, change one prompt/tool/model dependency, and verify deterministic impact propagation and provenance reconstruction.
- Blocking unknowns: Artifact version pins, test coverage, runtime cost, unsupported framework semantics, and whether the repository reproduces every paper table remain to be checked.

## Recheck triggers

Re-audit the article pair and artifact claims when arXiv publishes v2 or later; the official repository adds a declared license or release; framework adapter dependencies or test instructions change; or the paper publishes an independent deployment evaluation. Until then, keep the artifact status dated and conditional.

## Critical reading

- Strongest result: It gives agent configuration a stable, auditable identity separate from one runtime execution, which makes change impact and reproducibility explicit engineering objects.
- Weakest assumption: Governance-equivalence after projection may hold for the selected fixtures while failing for framework features or runtime state not represented by the canonical model.
- Stated limitations: Distributed execution, planning strategies, learning/adaptation, autonomous reasoning policies, and broader framework validation are deferred.
- Claims not supported by the evidence: The paper does not prove reduced incidents, lower operational cost, universal interoperability, or compliance with any particular regulation.

## Bloss0m connection

- Related Traditional Chinese routes: `39-enterprise-agentic-ai-governance`; `43-enterprise-ai-agent-security`; `56-aws-hoyabit-bedrock-agentcore`.
- Related English routes: the paired English routes for the same entries.
- Duplication risk: Medium. Existing coverage discusses governance and runtime controls, but not a framework-independent configuration graph with formal impact propagation.
- Suggested internal links: configuration baselines, provenance, dependency graphs, change control, runtime replay, and AgentOps observability.

## Recommendation

- Output level: Deep Read
- Score rationale: The paper directly fills an agent-security governance gap, offers a concrete reference implementation, formal semantics, and cross-framework evidence. Reproducibility is discounted until the repository and artifact completeness are checked; the scope is not production-scale.
- Open questions requiring human approval: Verify the GitHub artifact, licenses, test/reproduction path, and exact evaluation fixtures before drafting; frame ACM as a reference model, not a standard or compliance certification.
- Publication state: The Traditional Chinese and English pair is published as `18-agentic-configuration-management`, with the 2026-08-12 artifact check, evidence map, limitations, fixed-point mechanism, cross-framework slices, and conditional reproduction path incorporated.
