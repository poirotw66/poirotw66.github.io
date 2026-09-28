---
stableId: "url:https://www.docker.com/blog/docker-sandbox-kit-spec/"
status: "candidate"
firstSeenAt: 2026-09-28
lastVerifiedAt: 2026-09-28
primaryCategory: "Cloud & Platform"
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

# From Dockerfile to Kit: the Docker Sandboxes Kit Specification

## Identity

- Search window: Seven-day backfill ending 2026-09-28 (Asia/Taipei); the source is dated 2026-09-24, outside the strict 72-hour window.
- Discovery queries: `AI agent sandbox authority OCI artifact specification`; `Docker Sandbox Kit v3 capabilities conformance`; `agent network credential policy digest-pinned sandbox`.
- Canonical URL: https://www.docker.com/blog/docker-sandbox-kit-spec/
- Publisher or author: Docker; engineering post by Christian Dupuis.
- Published or updated date: 2026-09-24.
- Source type: First-party engineering blog and open specification.
- Direct supporting sources:
  - Apache-2.0 specification, implementation, examples, and conformance suites: https://github.com/docker/sandbox-kit-spec
  - CNCF collaboration announcement: https://www.docker.com/blog/docker-sandbox-kit-spec-cncf/

## Editorial fit

- Why now: Kit v3 moves agent permissions from remembered launch flags into the artifact that describes the workload, making authority review part of the build and update path.
- Reader question: Can an agent's filesystem, network, tools, and credentials be reviewed and versioned alongside the agent image?
- Story hook: The permission package is an ordinary OCI image pinned by digest, but it asks for authority rather than granting it; a runtime must implement the contract before the declarations enforce anything.
- Category and topic cluster: Cloud & Platform / `ai-platform-governance`.
- Existing coverage and duplication risk: Distinct from generic sandbox or prompt-injection coverage because the focus is a portable authority descriptor with resolver rules and conformance tests. Avoid presenting Docker's runtime as evidence that the format is already vendor-neutral in practice.
- Why this remains useful after the current news cycle: Digest-pinned permissions, fail-closed composition, capability negotiation, and reviewable authority changes apply to any long-lived agent execution environment.

## Claim map

- Primary claim: A Kit packages a workload and optional mixins, including network rules, credential bindings, tools, skills, and persistent volumes, as a digest-pinned OCI artifact.
- Measured evidence: The public repository exposes descriptor grammar, capability documentation, a BuildKit frontend, example Kits, and separate conformance suites for artifacts and runtimes. The post demonstrates deny-overrides-allow network policy and proxy-managed credentials. Required capabilities that a host cannot satisfy cause launch failure; incompatible composition fails rather than silently selecting one grant.
- Vendor or author claims requiring qualification: Docker says its Sandboxes product is the first conforming runtime. The spec is explicitly experimental, Docker maintains it today, and a final version is only targeted for Q4 2026 after feedback.
- Bloss0m engineering consequence: Treat a change in requested authority as a security-sensitive release diff; pin the descriptor and image digest; require runtime conformance before claiming enforcement; gate authority widening and removals of deny rules.

## Evidence audit

- Primary evidence inspected: Docker's dated engineering post, the public `docker/sandbox-kit-spec` repository, its README/spec tree, examples, and conformance-test structure.
- Baseline or comparison: Existing Dockerfile/OCI artifact packaging compared with a Kit that also records the surrounding execution authority; no security benchmark or cross-runtime comparison is reported.
- Missing evidence: Independent conforming runtimes, external conformance results, deployment measurements, and evidence that digest or approval workflows prevent misconfiguration in production.
- Conflicts or uncertainty: This is an experimental specification, not a finalized standard. Capability declarations are inert on a runtime that does not enforce them. The repository and post are first-party sources, not independent validation.

## Recommended treatment

- Output level: write-now; durable-post-candidate, not a publication promise.
- Proposed angle: “Dockerfiles made software reproducible; Kits try to make agent authority reproducible.” Explain the OCI annotation, workload/mixin resolution, credential proxy, fail-closed rules, and the crucial request-versus-grant boundary.
- Internal routes: Agent sandboxing, supply-chain provenance, MCP tool permissions, and runtime governance.
- Human decision required: Approve before writing; describe the spec as experimental and distinguish artifact conformance from runtime enforcement.
