---
stableId: "url:https://aws.amazon.com/security/security-bulletins/2026-105-aws/"
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

# AWS Security Agent CVEs: an AI scan can fail at the storage ownership boundary

## Identity

- Search window: 2026-09-11 18:00–2026-09-12 18:00 Asia/Taipei; seven-day backfill from 2026-09-05 18:00.
- Discovery queries: `AWS security bulletin CVE-2026-87912 CVE-2026-87913 Security Agent MCP S3`; `AWS agent security scan bucket ownership verification September 2026`.
- Canonical URL: https://aws.amazon.com/security/security-bulletins/2026-105-aws/
- Publisher or author: AWS Security.
- Published or updated date: 2026-09-10.
- Source type: first-party important security bulletin.
- Direct supporting sources: https://docs.aws.amazon.com/securityagent/latest/userguide/code-review-ide-integration.html; CVE-2026-87912; CVE-2026-87913.

## Editorial fit

- Why now: AWS reports that missing S3 bucket ownership verification in the Security Agent plugin and MCP server could expose a private source archive through a predictable scan-input bucket name.
- Reader question: Which cloud data-plane assumptions must an agent security scanner verify before uploading private source code?
- Category and topic cluster: Enterprise AI; `ai-platform-governance`.
- Existing coverage and duplication risk: The archive covers GitSpawn, tool-boundary guardrails, and IDE security-agent integrations. Duplication risk is medium; the distinct angle is storage ownership and predictable-resource collision at the scanner data plane.
- Why this remains useful after the current news cycle: Agent security tools routinely move source archives through cloud storage, so bucket ownership, naming, least privilege, and derivative-code patching are reusable controls.

## Claim map

- Primary claim: AWS says affected versions of the Security Agent plugin and MCP server did not verify S3 bucket ownership, allowing a remote attacker to obtain a private scanned-workspace archive when a predictable bucket name was pre-registered.
- Measured evidence: The bulletin names CVE-2026-87912 and CVE-2026-87913, affected version ranges, the 0.2.0 resolution, the predictable bucket pattern, and the recommendation to verify or pre-create the bucket.
- Vendor or author claims requiring qualification: The bulletin describes a potential exposure path and does not establish exploitation in the wild, actual customer impact, or the prevalence of credentials in uploaded archives.
- Bloss0m engineering consequence: Treat agent-upload storage as part of the trust boundary: prove resource ownership, avoid predictable first-use names, scope IAM, minimize archive contents, and patch forks/derivatives rather than trusting an application-level promise.

## Evidence audit

- Primary evidence inspected: AWS Security Bulletin 2026-105, published September 10, 2026, plus the official Security Agent IDE integration guide.
- Baseline or comparison: The intended baseline is an AWS-owned scan-input bucket; the vulnerability concerns the absence of an ownership check before sensitive archive delivery.
- Missing evidence: Exploit attempts, exact archive retention/deletion behavior, presigned-URL lifetime, customer notification scope, and whether all integrations shared the same storage path.
- Conflicts or uncertainty: The bulletin lists separate package/version ranges for the plugin and MCP server; publication should preserve that distinction and verify the exact upgrade commands for each distribution.

## Recommended treatment

- Output level: Durable-post-candidate.
- Proposed angle: “The scanner is part of the attack surface once it uploads your source.”
- Internal routes: `43-enterprise-ai-agent-security`, `56-aws-hoyabit-bedrock-agentcore`, `89-ai-powered-software-development-environments`, and `ai-platform-governance`.
- Human decision required: Decide whether to publish as an agent-security storage-boundary case study or pair it with the Kiro bulletin as a short “agent tools fail outside the model” series; keep CVE facts, AWS recommendations, and engineering inference separate.

