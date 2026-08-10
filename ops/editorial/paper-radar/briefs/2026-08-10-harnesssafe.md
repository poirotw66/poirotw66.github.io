---
stableId: "arxiv:2608.06984"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-10
lastVerifiedAt: 2026-08-10
primaryTrack: "agent-systems"
primaryGap: "agent-security"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 27
decision: "deep-read-candidate"
---

# HarnessSafe: Evaluating Safety Across Persistent Carriers in Agent Harnesses

## Identity

- Stable ID: `arxiv:2608.06984`.
- Current version: arXiv v1, submitted 2026-08-07; no venue or OpenReview record identified.
- Canonical URL: https://arxiv.org/abs/2608.06984
- Full paper: https://arxiv.org/html/2608.06984v1
- DOI / aliases: arXiv-issued DOI `10.48550/arXiv.2608.06984`; no separate DOI or public author repository identified during this scan.
- Artifact status: The paper describes an anonymized supplementary artifact with manifests, case metadata, result inventories, and selected trace/oracle evidence. A stable public download URL and a complete all-harness case binding ledger are unknown.

## Editorial fit

- Reader question: How can an agent security test show where attacker influence is stopped across memory, skills, tools, sessions, subagents, and shared artifacts—not only whether the final attack succeeded?
- Series track / gap: `agent-systems` / `agent-security`.
- Why now: The 2026-08-07 preprint evaluates persistent-risk chains across seven native harnesses and makes carrier boundaries and trace checkpoints part of the security measurement.
- Existing coverage and duplication risk: It extends `43-enterprise-ai-agent-security`, `39-enterprise-agentic-ai-governance`, `AgentS4D`, and the MAFIA shortlist. Those cover broader runtime risks or memory poisoning; HarnessSafe’s distinct contribution is cross-carrier lifecycle accounting and harness/backend interaction. Duplication risk is medium.

## Claim map

- Problem: Attacker-influenced content can persist in one carrier, cross a boundary, and trigger a later benign request; endpoint attack-success rates hide where the chain was contained.
- Main claim: HarnessSafe defines 328 executable cases across seven persistent-carrier families and uses an N0–N5b trace progression plus coverage-aware metrics to compare containment.
- Method: Preserve a Persistent-Risk Lifecycle with entry, carrier path, persistence boundary, benign trigger, and violation criterion; map native traces to the furthest evidence-supported stage; separate unsupported mappings and workflow noncompletion from safe outcomes.
- What is genuinely new: A portable cross-harness benchmark that evaluates memory, skills, Tool/MCP state, memory-to-skill transformation, subagent delegation, session summaries, and shared artifacts in one lifecycle model.

## Evidence audit

- Benchmark: 328 unique case paths across F1 Memory, F2 Skill, F3 Tool/MCP, T2 Memory→Skill, T3-S Subagent, T3-C Summary, and T3-A Artifact families.
- Main experiment: Seven harness configurations; reported standardized containment scores range from 43.3 to 62.3, with attack-success rates from 1.27% to 13.41% on configuration-eligible rows. Kimi Code has only 61.59% coverage and must not be read as a safe zero for excluded cases.
- Controls: With GPT-5.6-Sol fixed, Codex CLI CSS is 62.3 versus 39.4 under Claude Code; with Claude Code fixed, backend CSS spans 22.7–58.7. Matched interventions remove lifecycle elements and reduce attack success from 25.8% to at most 2.5% in the reported arm.
- Evidence handling: Formal results retain case identity, eligibility, exclusion reason, checkpoint, N5a/N5b indicator, and run identifier; unsupported harness mappings are not imputed as safety.
- Threats to validity: T3-A contains six cases; support varies by harness; some configurations have representative rather than exhaustive traces; claims about production safety are not established.

## Reproducibility

- Available artifacts and licenses: The paper documents `runs/manifest.json`, active case metadata, canonical results, binding inventories, and selected trace/oracle evidence in an anonymized supplementary artifact. Public availability, license, setup scripts, and complete case-level cross-harness bindings are unknown.
- Environment or compute requirements: Native execution of seven agent harnesses, model/provider access, isolated homes, permission profiles, callbacks/honeypots, oracles, and configuration-specific trace collection.
- Smallest useful reproduction: Recreate a small subset of one carrier family with explicit lifecycle checkpoints and eligibility accounting; compare one fixed harness across two backends before attempting the full cross-harness matrix.
- Blocking unknowns: Artifact URL, full prompt/case inventory, harness version pinning, model access dates, and whether all trace evidence is downloadable remain to be verified.

## Critical reading

- Strongest result: The study shows that similar endpoint attack rates can correspond to different stopping stages, and that harness and backend effects are of comparable scale.
- Weakest assumption: Native-harness adaptations are only comparable when their bindings satisfy the paper’s evidence contract; partial support can still constrain cross-system conclusions.
- Claims not supported by the evidence: The scores do not rank products universally, prove that a low ASR is safe under unsupported cases, or predict enterprise incident rates.

## Bloss0m connection

- Related Traditional Chinese routes: `43-enterprise-ai-agent-security`; `39-enterprise-agentic-ai-governance`; `12-agents4d-runtime-risks`.
- Related English routes: paired English routes for the same entries.
- Suggested angle: “Agent 安全測試要量測風險走到哪裡” — build a lifecycle scoreboard that distinguishes blocked, unsupported, incomplete, and violated states.

## Recommendation

- Output level: Deep Read.
- Score rationale: 27/30. It directly fills the agent-security gap with an unusually concrete carrier/boundary model and detailed accounting; reproducibility is discounted because the public artifact endpoint and full binding inventory are unknown.
- Human approval questions: Require artifact and license verification; decide whether the piece should compare carrier boundaries or focus on the harness/backend interaction; preserve all coverage and non-safety caveats.

