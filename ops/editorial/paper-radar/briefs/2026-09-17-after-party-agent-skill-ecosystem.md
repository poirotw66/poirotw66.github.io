---
stableId: "arxiv:2609.17274"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-17
lastVerifiedAt: 2026-09-17
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "deep-read-candidate"
---

# After the Party: Governing What a Viral Agent-Skill Ecosystem Left Behind

## Identity

- Search window: strict 72-hour scan ending 2026-09-17; arXiv v1 was submitted on 2026-09-15.
- Canonical URL: https://arxiv.org/abs/2609.17274
- Full paper: https://arxiv.org/html/2609.17274
- Venue or review status: The arXiv record says accepted at APSEC 2026; it is not yet treated as a camera-ready published version here.
- System studied: OpenClaw and the ClawHub agent-skill registry, using OpenClaw git history, GitHub issues/PRs, and three ClawHub snapshots.
- Public artifact: Zenodo package https://doi.org/10.5281/zenodo.21469516, plus the OpenClaw repositories referenced by the paper. The package contains anonymous scripts/data for the study, not a complete runtime safety oracle.

## Editorial fit

- Reader question: What happens after an agent-skill ecosystem grows faster than its feedback, review, and security controls?
- Why this belongs in the selected track: It measures the governance backlog of a live skill registry—growth, concentration, feedback scarcity, privilege signals, and scanner disagreement—instead of treating “open ecosystem” as a binary risk label.
- Gap it fills: `agent-systems / tool-use-reliability`, with direct consequences for skill registries, MCP servers, package review, provenance, and permission policy.
- Why now: Skill and tool ecosystems can accumulate thousands of reusable capabilities before maintainers know which artifacts are trusted, popular, stale, or privileged. The study offers numbers for that lifecycle and shows why download counts and static scanners are not enough.

## Claim map

- Dataset and time window: Three ClawHub snapshots are joined with OpenClaw history and public GitHub issue/PR information. The registry stock grows from 33,399 to 65,175 listings over 91.11 days.
- Adoption concentration: The top 10% of listings account for 46.93% of downloads; the reported total is 62,342,228 downloads with a median of 515.
- Feedback scarcity: 77.86% of listings have zero stars or comments. The paper reports that a simple metadata feature is not stable after cohort and age adjustment; the apparent download association reverses, and none of seven full-cohort associations survives the pre-cutoff cohort analysis.
- Privilege exposure: 85.06% of evaluable artifacts have evidence of privilege. Among zero-feedback evaluable listings, the proportion is 84.34%.
- Scanner disagreement: Three scanners cover 61,990 listings and disagree on 23,702. In a reference pool of 276 and a seed-42 sample of 180, adjudication yields 69 flags and 111 do-not-flag cases. Weighted sensitivity ranges from 21.67% for the static scanner to 61.06% for the LLM scanner; VirusTotal precision is reported at 50.74%.
- What is genuinely new: The paper links ecosystem growth and governance observability to measurable lifecycle signals. It also treats scanner disagreement as data about the limits of automated review, not simply as a reason to pick the majority vote.

## Evidence audit

- Primary measurements: Registry snapshots, listing metadata, download distributions, feedback fields, privilege-evidence labels, scanner outputs, and adjudication results are analyzed together.
- Ground-truth boundary: The reference pool and adjudication provide a useful evaluation slice, but there is no perfect ground truth for all listings. Scanner disagreement, sensitivity, and precision therefore describe the tested labels and reference procedure, not the true maliciousness rate of the registry.
- Source and cohort limits: The work is bounded to one registry and a short, rapid-growth window. Some source data were withdrawn, and age/cohort effects are central to the result; cross-registry generalization is not established.
- Semantic limit: “Privilege evidence” is textual or static evidence in an artifact. It is not proof that a skill executed the privilege at runtime, nor a complete exploitability or impact assessment.
- Vendor or author claims requiring qualification: The reported growth and scanner metrics are empirical study results, but proposed governance implications remain recommendations until tested against additional registries and runtime traces.

## Reproducibility

- Available artifacts and license/access: Public anonymous scripts and data are available through Zenodo, and the paper links the OpenClaw code context. Reproduction still depends on the bounded snapshots and the study’s adjudication procedure.
- Smallest useful reproduction: Load one snapshot, reproduce stock and feedback distributions, rerun the age/cohort analysis, then compare the three scanner outputs on the paper’s reference pool. Keep static privilege evidence separate from sandboxed runtime observations.
- Blocking unknowns: Withdrawn source records, unavailable historical registry state, scanner version drift, adjudicator calibration, and runtime behavior of skills can change the result. The artifact does not turn a text classifier into a security oracle.

## Critical reading

- Strongest result: The combination of rapid stock growth, highly concentrated downloads, widespread zero-feedback listings, and 23,702 scanner disagreements makes a concrete governance case: ecosystems need lifecycle and provenance signals before popularity can be treated as trust.
- Weakest assumption: Static or textual privilege evidence is a practical screening signal, but its relationship to actual execution risk depends on runtime permissions, sandboxing, network access, secrets, and invocation context.
- Engineering consequence: A skill registry should expose versioned provenance, publisher identity, requested capabilities, review status, scanner versions, runtime sandbox policy, feedback age, and revocation state. Popularity should be a discovery signal, not an authorization decision.
- Claims not supported by the evidence: The paper does not establish that any particular scanner or majority vote is safe enough for autonomous installation, that flagged skills are malicious, or that its exact proportions generalize to MCP or other registries.

## Bloss0m connection

- Related Traditional Chinese routes: [When Tool Calls Succeed but Workflows Fail](/paper-reading/52-when-tool-calls-succeed-workflows-fail/), [Authorization Architectures for Tool-Using AI Agents](/paper-reading/53-authorization-architectures-tool-agents/), and [EvoOntology](/paper-reading/50-evoontology-self-evolving-ontology/).
- Related English routes: [When Tool Calls Succeed but Workflows Fail](/en/paper-reading/52-when-tool-calls-succeed-workflows-fail/), [Authorization Architectures for Tool-Using AI Agents](/en/paper-reading/53-authorization-architectures-tool-agents/), and [EvoOntology](/en/paper-reading/50-evoontology-self-evolving-ontology/).
- Suggested article angle: “Agent skill 生態系最危險的不是沒有工具，而是工具太多卻沒有可追溯的信任狀態。” Turn the paper’s numbers into a registry governance checklist and explicitly separate popularity, static evidence, and runtime behavior.
- Duplication risk: Low. Existing tool-boundary readings analyze individual calls and policies; this candidate analyzes the ecosystem and registry lifecycle around those tools.

## Recommendation

- Output level: Deep Read candidate; an excellent fit for a paper reading with an Evidence Atlas showing registry growth, feedback concentration, scanner disagreement, and the static-to-runtime evidence gap.
- Score rationale: 29/30: strong agent-ecosystem relevance, unusual empirical framing, primary data and public Zenodo scripts, direct governance consequences, and high series value. Reproducibility is 4 because the artifact is public but the historical registry window, withdrawn data, and runtime validation remain bounded.
- Open questions requiring human approval: How should a registry score trust without conflating popularity and safety? What runtime sandbox evidence should upgrade static privilege evidence? Can the same governance contract work for MCP servers, skills, and model tools across organizations?
