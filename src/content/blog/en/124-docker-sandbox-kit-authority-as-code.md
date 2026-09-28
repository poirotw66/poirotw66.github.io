---
title: "Docker Sandbox Kit: Versioning Agent Authority Requests with Software"
description: "A close look at how Docker Sandbox Kit v3 places agent network, credential, and mixin declarations in an OCI artifact—and why a descriptor remains a request whose enforcement depends on the runtime."
pubDate: 2026-09-28
updatedDate: 2026-09-28
tldr:
  - "A Dockerfile describes how software is built and started; Kit v3 aims to place requests for the surrounding execution authority in the same digest-pinned OCI image."
  - "A descriptor is a request, not a grant. Only a runtime that implements the relevant capability can enforce network, credential, and other restrictions."
  - "The resolver, deny-overrides, credential proxy, and two conformance suites define inspectable contracts, but an experimental spec and one conforming runtime do not establish cross-runtime security guarantees."
audience:
  - "Engineers building coding agents, sandbox runtimes, and developer platforms"
  - "Platform and security teams reviewing agent authority, software supply chains, and execution environments"
category: "Cloud & Platform"
tags: ["AI Agent", "Enterprise AI", "Governance", "Platform Engineering"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 42
kind: "article"
showToc: true
image: "/blog/124-docker-sandbox-kit-authority-as-code/title_image.webp"
---

A Dockerfile can make an application's contents and startup behavior reproducible. Yet what an agent can actually do may still be scattered across `docker run` flags, Compose, CI settings, token injection, and runbooks. Docker Sandbox Kit v3 tries to put those surrounding authority requirements into an inspectable, pinnable OCI artifact. Its engineering thesis is concise: **Dockerfiles fix the software; Kits try to version the requested execution authority with it.**

The word *request* matters. A Kit descriptor describes the capabilities a workload needs; it does not authorize them by itself. The runtime must recognize and enforce each capability. Docker calls Docker Sandboxes the first conforming runtime, while the specification explicitly remains experimental. An inspectable specification is therefore not the same thing as a security guarantee verified across runtimes.

> **Huahua in one sentence**
>
> A Kit puts authority requests into an artifact for review and pinning; the runtime still controls authorization and enforcement.

## The half a Dockerfile does not describe

An image can already package a root filesystem, entrypoint, command, environment, and user. At runtime, an agent also needs external resources: network destinations, persistent volumes, CLI tools, MCP servers, skills, credentials, and startup hooks. If these settings are split across deployment files and manual steps, it is difficult to see whether an agent image update also expands its effective authority.

On September 24, 2026, Docker published [Sandbox Kit Specification v3](https://www.docker.com/blog/docker-sandbox-kit-spec/). A Kit uses an OCI image: the manifest annotation `vnd.docker.sandbox.kit.descriptor` carries the descriptor, and image layers carry the content. There is no new media type or sidecar, so existing registries, scanners, signers, and ordinary OCI tooling can still handle the image. The descriptor and content can also be pinned together by digest. This gives authority changes a chance to enter the usual image review and release workflow, but it does not define an approval policy for an organization.

There are two kinds of Kit in v3. A `workload` supplies the root filesystem to run; a `mixin` overlays a tool, network rule, credential binding, or agent context. A composition must contain exactly one workload and may include multiple mixins. A `kind: set` can be published as another ordinary Kit, retaining its composition sources so a team can distribute an environment as one reference.

## The descriptor requests; the runtime grants and enforces

A v3 descriptor uses `schemaVersion: "3"` and lists typed, independently versioned requests under `capabilities`, such as `com.docker.sandbox/network-policy@2` or `com.docker.sandbox/credential@1`. The [v3 grammar](https://github.com/docker/sandbox-kit-spec/blob/main/docs/spec/SPEC-v3.md) and JSON Schema help validate descriptor shape; the repository identifies its Go validator as the grammar validator. Unknown fields produce an error, so a typo cannot be silently ignored and remove a policy declaration.

This remains the description layer. A Kit can request a network policy or credential capability, but YAML cannot block packets or obtain a secret on its own. The runtime must understand the capability's normative behavior, choose whether to provide it, and enforce it at execution time. If a required request cannot be satisfied, launch should fail instead of silently dropping the setting and continuing. Optional capabilities can be marked explicitly, but their effects are still defined by the runtime contract.

Two relationships are easy to conflate. Kits describe dependencies on one another with `provides`, `requires`, `integrates`, and `conflicts`; `capabilities` are requests that a Kit makes of the host runtime. The resolver checks whether the former composition is coherent. The runtime decides whether it can grant and enforce the latter.

## The resolver makes mixin composition predictable

The Kit resolver orders mixins by their dependency graph rather than by command-line flag order. Composition is a closed set: a missing provider for `requires`, a declared conflict, or multiple Kits providing the same normalized name must fail. A composition must also contain exactly one workload. These failures happen during resolution; the resolver does not fetch unknown Kits to fill a gap or silently let one contribution shadow another.

A `kind: set` runs the same coherence rules while it is built or published. After publication, the `set` authoring form becomes an ordinary `workload` or `mixin`, while the source references and digests remain recorded in the resulting descriptor. A team can pass around an environment as one artifact after checking its composition. That only establishes that the set resolves; it does not establish that every runtime will execute it identically.

Network policy shows why capability composition matters for security. Docker's GitHub CLI example allows access to `api.github.com` but explicitly denies `DELETE /repos/**`; where allow and deny rules coexist, deny overrides allow. A reviewer should not stop at the summary “GitHub is allowed.” They should check methods, hosts, paths, the merged result across mixins, and whether an upgrade removes an existing deny rule.

## A credential proxy keeps the secret outside the sandbox

In the example, the credential capability marks an API key as `proxyManaged: true` and specifies that an authorization header is injected only for a named domain. The secret stays in a host- or runtime-managed source. A conforming runtime proxies matching requests, while the sandbox sees a sentinel instead of the actual token. This can reduce the agent's direct access to a long-lived secret and bind credential use to a service endpoint.

The proxy does not narrow the token's permissions at the service, or prove that there are no other credential exfiltration paths. A deployment still needs to verify secret lifecycle and revocation, domain and header matching, redirect and error handling, blocked alternative egress, and logs that do not capture secrets. A capability name and descriptor express a contract; they do not replace these runtime tests.

## Conformance tests judge two different things

The public repository provides two suites. `kit-tck` checks whether a published artifact conforms to the Kit format. The runtime TCK uses an adapter to check whether runtime behavior follows the capability specifications. The BuildKit frontend also validates Kits during build. These checks cannot substitute for each other: a valid descriptor does not prove that a runtime blocks disallowed egress, and a runtime passing one suite does not establish that an organization's network topology, credential provider, or threat model has been tested.

The [conformance document](https://github.com/docker/sandbox-kit-spec/blob/main/docs/spec/conformance.md) explains the two suites. The repository provides tools and test rules that runtime authors can run; that is a starting point for repeatable verification, not evidence that multiple implementations already pass. Docker says Docker Sandboxes is the first conforming runtime. Docker also maintains this experimental specification, with a final version targeted for Q4 2026 after community feedback. Cross-runtime interoperability and enforcement results still need independent implementations and testing.

## A practical adoption sequence

A useful pilot can keep “valid format,” “acceptable authority change,” and “enforced by the runtime” as separate gates:

1. **Create a workload and mixins.** Start with the agent's root filesystem as the workload. Separate the CLI, network policy, credential binding, and context into mixins with clear responsibilities. Validate `schemaVersion`, capability configuration, and spelling with the schema and validator.
2. **Pin the composition inputs.** Pin every Kit registry reference by digest. Check that `provides` and `requires` resolve, and let missing providers, conflicts, duplicate providers, and multiple workloads fail closed. Avoid mutable tags as production inputs.
3. **Build and inspect the final artifact.** Build with the BuildKit frontend, then inspect the published manifest annotation, layers, and digest. Run the Kit TCK against the final registry artifact. If a `set` produced it, verify the merged descriptor too.
4. **Review the authority diff.** Treat normalized authority as a review item. Call out new hosts, methods, volumes, credentials, devices, and persistent paths; treat removing a deny rule as an authority expansion. Require a named reviewer and traceable approval rather than allowing access to widen automatically with a software update.
5. **Test enforcement in the target runtime.** Confirm which capabilities the runtime claims to support, run the runtime TCK, and add organization-specific negative tests: an unlisted host cannot connect, an unsatisfied required capability prevents launch, credentials travel only through the proxy to the named endpoint, and volumes expose only necessary paths. Block deployment when these tests fail.
6. **Deploy and retain evidence.** Deploy the image digest rather than a mutable tag. Record the Kit digest, runtime version, effective authority set, approver, and TCK results. Rerun the same tests and compare results after runtime updates or authority changes.

For teams today, the most practical value of a Kit is that scattered permission settings can become inputs that are reviewed, signed, scanned, and pinned alongside an image. That improves supply-chain and change-review visibility. The security boundary still depends on runtime isolation, capability implementation, host authorization policy, and end-to-end testing.

> **Huahua's engineering note**
>
> A digest fixes what a Kit says; it cannot guarantee that a runtime enforces it. Without conformance and negative tests on the target runtime, the descriptor remains a readable request.

## Further reading and sources

- For sandbox runtime and multi-tenant isolation trade-offs, see Bloss0m's [EKS multi-tenant AI agent sandbox](/en/blog/54-eks-multitenant-ai-agent-sandbox-bitoclaw/).
- For reviewing permissions alongside tool supply chains, versions, and provenance, continue with [AIPOCH Open Science's governed agent workbench](/en/blog/90-aipoch-open-science-workbench/) and [release provenance for the self-modifying Ouroboros agent](/en/blog/113-ouroboros-self-modifying-agent-provenance/).
- Primary sources: [Docker's engineering post](https://www.docker.com/blog/docker-sandbox-kit-spec/) and the [Docker Sandbox Kit Specification repository](https://github.com/docker/sandbox-kit-spec). Both are first-party material; this article does not treat them as independent security evaluations.
