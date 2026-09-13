---
stableId: "url:https://aws.amazon.com/security/security-bulletins/2026-111-aws/"
status: "durable-post-candidate"
firstSeenAt: 2026-09-12
lastVerifiedAt: 2026-09-12
primaryCategory: "Enterprise AI"
primaryCluster: "ai-platform-governance"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 5
  engineeringValue: 5
  archiveFit: 4
  total: 24
decision: "durable-post-candidate"
---

# Kiro CVE-2026-89332: a coding agent can cross the approval boundary before approval

## Identity

- Search window: 2026-09-11 18:00–2026-09-12 18:00 Asia/Taipei; seven-day backfill from 2026-09-05 18:00.
- Discovery queries: `AWS security bulletin Kiro IDE CVE-2026-89332`; `Kiro agent workspace configuration sensitive data exfiltration September 2026`.
- Canonical URL: https://aws.amazon.com/security/security-bulletins/2026-111-aws/
- Publisher or author: AWS Security.
- Published or updated date: 2026-09-11.
- Source type: first-party important security bulletin.
- Direct supporting sources: CVE-2026-89332; AWS's Kiro/agent security guidance.

## Editorial fit

- Why now: AWS reports that Kiro could write an untrusted workspace setting before the user answered the approval prompt, allowing a crafted repository to redirect the Powers registry request to an external endpoint.
- Reader question: What does human approval mean if the agent has already persisted the dangerous configuration before the prompt is answered?
- Category and topic cluster: Enterprise AI; `ai-platform-governance`.
- Existing coverage and duplication risk: The archive covers GitSpawn's repository Git-config execution and prompt-injection/control-plane risks. Duplication risk is medium; the distinct lesson is transactional approval semantics and the danger of pre-approval side effects in IDE state.
- Why this remains useful after the current news cycle: Any agentic IDE or plugin system that writes workspace configuration must define when a proposed change becomes externally observable.

## Claim map

- Primary claim: In Kiro IDE versions before 0.8.135, an agent could modify workspace settings in an untrusted workspace; opening the Powers panel before responding to the prompt could send sensitive workspace data to the configured external endpoint.
- Measured evidence: AWS identifies the affected version range, describes the write-before-approval sequence, recommends upgrading to 0.8.135 or later, and advises rotating credentials opened in older versions.
- Vendor or author claims requiring qualification: The bulletin is AWS's coordinated disclosure and does not provide independent prevalence, exploit telemetry, or a complete impact inventory for every workspace type.
- Bloss0m engineering consequence: Approval gates must be transactional: stage proposed state, prevent observers from consuming it, and make every side effect—including plugin/registry fetches—occur only after approval.

## Evidence audit

- Primary evidence inspected: AWS Security Bulletin 2026-111, published September 11, 2026.
- Baseline or comparison: The intended baseline is human-in-the-loop approval before the workspace setting becomes actionable; the vulnerability breaks that temporal assumption.
- Missing evidence: Exploitability in default configurations, affected data types, telemetry, patch adoption, and whether other extension surfaces share the same state transition.
- Conflicts or uncertainty: AWS lists no workaround; impact assessment depends on whether an affected version opened a workspace and the Powers panel before upgrade.

## Recommended treatment

- Output level: Durable-post-candidate.
- Proposed angle: “A prompt is not an approval boundary if the side effect already happened.”
- Internal routes: `43-enterprise-ai-agent-security`, `89-ai-powered-software-development-environments`, `87-github-mcp-enterprise-controls`, and `ai-platform-governance`.
- Human decision required: Decide whether to publish as a compact incident/architecture note; independently confirm the CVE record and keep the remediation advice tied to AWS's bulletin rather than generalizing beyond the affected Kiro version.

