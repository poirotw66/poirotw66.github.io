---
stableId: "url:https://github.com/razzant/ouroboros/releases/tag/v7.4.4"
status: "durable-post-candidate"
firstSeenAt: 2026-09-22
lastVerifiedAt: 2026-09-22
primaryCategory: "AI Engineering"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 24
decision: "write-now"
---

# Ouroboros v7.4.4：一個會改寫自己的 Agent，先把發行 provenance 做到可驗證

## Identity

- Search window: Strict 72-hour scan ending 2026-09-22; v7.4.4 was released on 2026-09-21.
- Discovery queries: `Ouroboros v7.4.4 self-modifying AI agent`; `AI agent release evidence SBOM provenance`; `durable identity memory self-modifying agent GitHub`.
- Canonical URL: https://github.com/razzant/ouroboros/releases/tag/v7.4.4
- Publisher or author: Ouroboros maintainers.
- Published or updated date: 2026-09-21.
- Source type: release-notes.
- Direct supporting sources:
  - Repository and architecture: https://github.com/razzant/ouroboros
  - Release evidence, SBOMs, smoke receipts, and provenance attestations linked from v7.4.4.

## Editorial fit

- Why now: A self-modifying agent is a provocative system design, but the more interesting engineering question is how such a project proves what binary, source commit, SBOM, and smoke tests users actually received.
- Reader question: If an agent can change its own code, prompts, tools, and dependencies, what must be proven before we run the resulting artifact?
- Category and topic cluster: AI Engineering / ai-platform-governance.
- Existing coverage and duplication risk: No Ouroboros article exists in the archive or Radar ledger. Avoid treating the project philosophy as scientific evidence; center the release contract and its disclosed limitations.
- Why this remains useful after the current news cycle: Build provenance, SBOM binding, and release receipts are durable controls for any agent that can evolve or manage subagents.

## Claim map

- Primary claim: v7.4.4 couples a high-agency agent runtime with a detailed artifact-integrity trail.
- Measured evidence: The release provides platform installers, SHA256 sums, `release-evidence.json`, CycloneDX SBOM attestations, GitHub build-provenance verification commands, full test-matrix/UI/Docker/skill/package smoke claims, and explicit notes about Android limitations.
- Vendor or author claims requiring qualification: The project's self-creating/self-modifying architecture is a maintainer description, and passing release checks does not prove the agent is safe, reliable, or secure under arbitrary self-modification.
- Bloss0m engineering consequence: Separate runtime agency from artifact trust. Pin source ref, build digest, SBOM, smoke receipt, and known unsupported platforms before allowing an evolving agent into a workflow.

## Evidence audit

- Primary evidence inspected: Official v7.4.4 release page, repository README/architecture references, asset checksums, release evidence, SBOM, and attestation instructions.
- Baseline or comparison: Earlier Ouroboros releases and the v7.4.4 changes to subagent controls, recovery, notifications, and packaging proof.
- Missing evidence: Independent security review, behavioral evaluation of self-modification, reproducible third-party installation, and resource/latency measurements for the packaged runtime.
- Conflicts or uncertainty: Large desktop artifacts and experimental Android support create operational risk; the release itself discloses that CI artifact checks do not certify every host or hardware path.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: 「會自我修改的 Agent 先別急著信任：Ouroboros 如何把 source、SBOM、attestation 與 smoke receipt 綁成發行證據」。
- Internal routes: Link to agent governance, supply-chain security, provenance contracts, and self-hosted agent runtimes.
- Human decision required: Show the verification commands and clearly separate artifact provenance from behavioral safety.
