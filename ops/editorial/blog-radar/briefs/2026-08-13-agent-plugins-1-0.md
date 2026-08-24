---
stableId: "url:https://github.blog/changelog/2026-08-12-agent-plugins-1-0-in-vs-code-copilot-cli-and-the-copilot-app"
status: "durable-post-candidate"
firstSeenAt: 2026-08-13
lastVerifiedAt: 2026-08-13
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

# Agent Plugins 1.0：把 skills 與 MCP server 打包成可治理的跨工具套件

## Identity

- Search window: 2026-08-12 08:30–2026-08-13 08:30 Asia/Taipei; daily 24-hour scan.
- Discovery queries: Agent Plugins 1.0 specification; portable agent skills MCP servers; GitHub Copilot plugin governance; enterprise managed settings.
- Canonical URL: https://github.blog/changelog/2026-08-12-agent-plugins-1-0-in-vs-code-copilot-cli-and-the-copilot-app
- Publisher or author: GitHub Changelog / GitHub Copilot.
- Published or updated date: 2026-08-12.
- Source type: release-notes / open specification announcement.
- Direct supporting sources: https://agent-plugins.org/plugin-authors; https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md; https://github.com/agentplugins/agent-plugins-example; https://docs.github.com/copilot/concepts/agents/about-plugins.

## Editorial fit

- Why now: GitHub documents general availability across VS Code, Copilot CLI, the Copilot SDK, and the Copilot app, after the 1.0 specification was published with AWS, Anysphere, Microsoft, OpenAI, and Vercel; Google is named as a core maintainer.
- Reader question: How should a team package one agent capability once, then install, port, and govern it consistently across clients without maintaining vendor-specific layouts?
- Category and topic cluster: Enterprise AI; `ai-platform-governance`.
- Existing coverage and duplication risk: Follow-up to `43-enterprise-ai-agent-security` and the existing GitHub MCP allowlist candidate. Duplication risk is medium: the distinct angle is portable packaging plus policy composition, not MCP server allowlisting alone.
- Why this remains useful after the current news cycle: A manifest boundary, skills directory, MCP configuration, namespaced client extensions, marketplace policy, and managed-settings precedence are durable engineering details even if client support changes.

## Claim map

- Primary claim: Agent Plugins 1.0 defines a portable package that can bundle skills and MCP server configuration and be consumed by multiple compatible agent clients.
- Measured evidence: The GitHub release states support in VS Code, Copilot CLI, the Copilot SDK, and the Copilot app; the author guide and specification define `plugin.json`, `skills/`, `mcp.json`, and the `com.github.copilot/` namespace. GitHub documents `enabledPlugins`, marketplace restrictions, and pairing with MCP allowlists for enterprise governance.
- Vendor or author claims requiring qualification: “Open standard,” general availability, and compatibility are product/specification claims; the sources provide no independent adoption, interoperability, supply-chain, or security-bypass measurements.
- Bloss0m engineering consequence: Treat a plugin as a versioned deployable unit with a manifest, tool-server identity, client-specific extension namespace, marketplace provenance, and an explicit policy decision. Test additive overrides and MCP allowlist precedence before rollout.

## Evidence audit

- Primary evidence inspected: GitHub Changelog release; Agent Plugins author guide; published 1.0 specification; example plugin repository; GitHub Copilot plugin documentation.
- Baseline or comparison: Previously, the same skill and server could be reused conceptually but client-specific packaging and manifests created duplication. The release claims existing non-1.0 Copilot plugins remain supported.
- Missing evidence: Interoperability tests across every compatible client, version negotiation, plugin signature/provenance requirements, marketplace review quality, policy propagation latency, and independent security evaluation.
- Conflicts or uncertainty: The release names multiple maintainers and clients, but the practical support matrix and behavior outside GitHub clients must be checked against each client's current implementation. Do not infer that packaging portability implies tool safety.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “Agent plugins become a packaging and policy boundary: one skill/MCP bundle, many clients, one governance problem.”
- Internal routes: `43-enterprise-ai-agent-security`; `39-enterprise-agentic-ai-governance`; `ai-platform-governance` cluster.
- Human decision required: Decide whether to lead with the open specification or with the enterprise control-plane implications. Keep the spec's portability claim separate from unverified interoperability and security outcomes.
