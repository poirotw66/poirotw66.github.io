---
stableId: "url:https://labs.cloudsecurityalliance.org/research/csa-research-note-gitspawn-ai-coding-agent-rce-20260903-csa/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-06
lastVerifiedAt: 2026-09-06
primaryCategory: "Enterprise AI"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 5
  total: 25
decision: "durable-post-candidate"
---

# GitSpawn: repository Git config bypasses coding-agent trust boundaries

## Identity

- Search window: 2026-09-05 00:35–2026-09-06 00:35 Asia/Taipei; seven-day backfill from 2026-08-30 00:35.
- Canonical URL: https://labs.cloudsecurityalliance.org/research/csa-research-note-gitspawn-ai-coding-agent-rce-20260903-csa/
- Publisher or author: Cloud Security Alliance AI Safety Initiative.
- Published or updated date: 2026-09-03.
- Source type: first-party security research note with independent technical disclosure and vendor advisory support.
- Direct supporting sources: https://www.manifold.security/blog/ai-coding-agents-git-hijack; https://github.com/aaif-goose/goose/security/advisories/GHSA-r5pp-p5r8-466r.

## Editorial fit

- Reader question: What happens when a repository's metadata is executable authority before the agent's trust or approval boundary has been established?
- Category and topic cluster: Enterprise AI; `ai-platform-governance`.
- Existing coverage and duplication risk: The archive covers enterprise agent security, governance, managed-agent control planes, and a recent AI supply-chain incident, but no GitSpawn or repository-config trust-boundary case. Duplication risk is low to medium; distinguish this from generic prompt-injection coverage by centering Git's pre-prompt background execution path.
- Why now: The CSA note published a cross-agent finding on 2026-09-03, with a concrete patch matrix and a Goose CVE, while several tested agents were still described as unpatched at publication.
- Durable value: The incident turns configuration provenance, archive handling, sandbox scope, and least privilege into explicit controls for coding-agent deployment.

## Claim map

- Primary claim: A malicious `.git/config` can abuse Git's `core.fsmonitor` helper so an AI coding agent executes attacker-controlled host commands during background repository inspection.
- Inspectable evidence: CSA describes eight findings across seven agents and the pre-trust execution path; Manifold supplies the technical disclosure; the Goose advisory documents a patched instance (`<1.44.0` affected, `1.44.0` fixed, CVE-2026-72718).
- Observed boundary: The archive/shared-drive/USB delivery path preserves the malicious local `.git` directory, while ordinary clone/fetch/pull does not carry the local config in the same way.
- Engineering consequence: Treat repository configuration as untrusted executable input. Inspect or neutralize relevant Git config before opening a repository, isolate agent execution from the host, and keep credentials and filesystem privileges scoped to the task.
- Unknowns: Patch status can change after the 2026-09-01 matrix; the disclosures report no in-the-wild exploitation evidence; exact affected versions outside the tested agents, fix completeness, false-positive behavior, and enterprise rollout coverage need continued verification.

## Evidence audit

- Primary evidence inspected: CSA research note, Manifold Security disclosure, and the Goose GitHub security advisory.
- Corroboration: The technical mechanism, affected workflow, and mitigation logic are described by an independent security researcher and a vendor advisory rather than a single product announcement.
- Reproduction boundary: A safe lab reproduction would use a disposable repository and isolated host; reproducing the cross-agent matrix requires exact agent versions and must not run attacker-controlled helpers on a real workstation.
- Governance boundary: The most important lesson is architectural: model approval prompts and workspace trust do not protect a background process that executes repository-supplied configuration before those controls engage.

## Recommended treatment

- Output level: Durable post candidate.
- Proposed angle: “Your coding agent can trust the repo before it trusts you.”
- Internal routes: `43-enterprise-ai-agent-security`, `39-enterprise-agentic-ai-governance`, `88-claude-managed-agents-control-plane`, and `ai-platform-governance`.
- Human decision required: Keep the article scoped to the verified `core.fsmonitor` class, show the archive/provenance threat model, and label patch status and exploitation status as time-bounded rather than universal claims.

