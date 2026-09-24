---
title: "How Benchling Isolates Multi-Tenant Code Execution with AgentCore, STS, and DNS Firewall"
description: "A layered design for running AI-generated code in a separate AWS account, with per-job credentials, S3 endpoint policies, DNS allow-listing, and continuous exfiltration tests."
pubDate: 2026-09-24
updatedDate: 2026-09-24
tldr:
  - "Benchling places untrusted execution in a separate AWS account and uses per-job STS credentials to narrow access to one tenant's data."
  - "DNS Firewall, S3 VPC endpoint policies, routes, NACLs, and security groups constrain different paths; the design depends on their combined effect."
  - "The scale and zero-incident figures are customer-reported, and the public article does not provide a runnable Benchling sample."
audience:
  - "Engineers building multi-tenant AI agents, scientific computing, or code sandboxes"
  - "Cloud security, IAM, and platform reliability architects"
category: "Cloud & Platform"
tags: ["AI Agent", "Enterprise AI", "AWS", "Platform Engineering", "Governance"]
cluster: "ai-platform-governance"
clusterRole: "case"
clusterOrder: 18
kind: "article"
showToc: true
image: "/blog/117-benchling-agentcore-multitenant-code-execution/title_image.webp"
---

When a multi-tenant product lets an AI agent run user-generated code, container isolation is only one part of the security question. The code must not see another tenant's data or send results out through the network. In a case study published on September 21, 2026, Benchling and AWS describe placing AgentCore Code Interpreter in a separate account for untrusted execution, then combining per-job temporary credentials, S3 VPC endpoint policies, DNS Firewall, and network-layer controls. It is a defense-in-depth pattern to evaluate, not proof that one DNS rule makes every possible exfiltration path impossible.

> **Huahua in one sentence**
>
> A multi-tenant code sandbox must answer both “whose data can this job read?” and “where can this job send data?”

## What the case study establishes

The AWS Machine Learning Blog post is co-authored by Jeremy Stashewsky, Application Security Engineer at Benchling; Meghana Sreenivas, Solutions Architect at AWS; and Anil Gurrala, Senior Solutions Architect at AWS. It is dated September 21, 2026. The post describes a requirement to run agent-generated scientific code across thousands of life-sciences tenants without cross-tenant visibility, unauthorized network connections, or a separate IAM role for every tenant.

Architecture details, validation methods, and operating figures below come from this AWS/Benchling customer case. AWS's [AgentCore Code Interpreter documentation](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-tool.html) and [VPC configuration guide for AgentCore Runtime and tools](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-vpc.html) document product and VPC capabilities. The [Route 53 Resolver DNS Firewall rule actions](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-rule-actions.html), [VPC endpoint policy documentation](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-access.html), and [STS AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html) explain the AWS control semantics. Those AWS references establish how the services work; they do not independently validate Benchling's deployment or test results.

The public post does not include a Benchling repository, complete policies, deployment templates, or CI test suite that readers can run. I did not find a verifiable public runnable sample. Reproduction therefore requires implementation and testing against the team's own data model, account structure, and threat model.

## The path from dispatch to data return

The case describes a five-step data path:

1. **The production account defines the job's scope.** Benchling's production environment selects the tenant data required by a job. It does not hand its main customer data store or production credentials directly to untrusted code.
2. **STS issues temporary, per-job permissions.** At dispatch, scoped credentials are created and injected into that execution. A session policy restricts S3 access to the tenant's path prefix within the authorized bucket. AWS documents that an `AssumeRole` session policy intersects with the role's identity policy, further limiting existing permissions rather than expanding them.
3. **Code Interpreter starts in another AWS account.** AgentCore Code Interpreter (ACCI) runs in a dedicated Untrusted Code Account. That account has its own ACCI execution role, separate from production roles, and each job runs in an isolated, short-lived environment.
4. **Data uses approved S3 endpoints.** In-region S3 access goes through a Gateway endpoint; cross-region S3 access uses an Interface endpoint. Endpoint policies list the permitted buckets and combine with IAM and S3 resource policies to constrain requests. AWS explicitly describes endpoint policies as an additional access boundary, not a replacement for IAM or bucket policies.
5. **Results return along an approved path.** A job can read the data needed within its tenant scope and return results to its caller; it has no default route to the public internet. This is the control objective described in the case, not a claim that account-side paths, credential exposure, or application-layer transfer risks disappear automatically.

The account boundary separates the untrusted execution environment from primary production resources. Per-job credentials answer “what may this identity do?” Endpoint policies further constrain “which S3 buckets can this network exit reach?” With broad role credentials, an isolated container could still have a credential path to another tenant's data. With endpoint policies alone, IAM and bucket policies still need to be configured correctly.

## Distinct jobs for DNS, routes, and packet controls

The case's VPC has no Internet Gateway or NAT Gateway. Route 53 Resolver DNS Firewall evaluates rules in ascending numeric priority, so the post describes three tiers:

- **Priority 10:** Explicitly deny known malicious domains first, providing a threat-intelligence fast path and observable denials.
- **Priority 100:** Allow only S3 endpoint domains and other explicitly approved domains needed by the job.
- **Priority 200:** Apply a catch-all block to other queries, returning NODATA. AWS defines NODATA as a successful query for which no response data is available; it is not a general statement that packets cannot leave the VPC.

When a program's DNS query goes through the VPC's Route 53 Resolver, names outside the allow-list are denied at resolution time. That can interrupt common exfiltration attempts that encode data in DNS subdomains. The control covers DNS queries evaluated by that resolver and rule group. DNS Firewall alone cannot establish universal protection against direct IP connections, alternate resolution paths, application-layer channels, or configuration errors. The case therefore describes additional packet-path restrictions:

- The ACCI security group permits only the necessary outbound TCP port 443 and has no default fallback rules.
- Prefix-list routing limits reachable paths to VPC endpoints; there is no default internet route through an IGW or NAT.
- NACLs restrict allowed traffic to port 443 and ephemeral return ports.
- VPC endpoint policies constrain which S3 buckets can be reached through those exits, alongside per-job STS permissions.

DNS denial is one link in a larger chain. If code tries to connect directly to an IP instead of resolving a name, routes, NACLs, the security group, and endpoint boundaries must still constrain what it can reach. Conversely, an overly broad rule at any layer changes the actual protection. A deployment should map every possible exit path rather than treat a DNS Firewall NODATA response as synonymous with complete network isolation.

## Continuous testing is stronger evidence than a one-time setup

The Benchling post says its Product Security team tested each layer in a proof-of-concept VPC, then added exfiltration simulations to CI. The described cases include encoded-subdomain DNS tunneling, direct connections to unauthorized endpoints, and attempts to access S3 buckets outside endpoint-policy scope. According to the post, the pipeline fails and blocks a release if a test resolves a disallowed domain, reaches an external endpoint, or moves data outside approved buckets.

This treats network configuration as a changing software boundary: adding endpoints, updating IAM policies, or changing a VPC can accidentally expand reachability. Teams can adopt the same principle by recording the DNS resolver, route, role session, endpoint policy, and expected denial for each negative test. The case does not publish Benchling's test code or coverage, and no independent third-party rerun is provided. The validation process is customer-reported, not an external security certification.

## Reported scale and operating costs

AWS and Benchling report that since deployment in early April 2026, the architecture has handled more than 600 code-execution sessions per day across more than 250 distinct tenants per week, with zero reported security incidents and zero cross-tenant data leaks. These figures come from the customer case; it provides no incident definitions, audit data, or independent verification. They should not be treated as a capacity guarantee or proof of zero risk for another organization.

This isolation model carries ongoing operating costs. Multiple accounts and two types of S3 endpoint require coordinated account governance, routing, DNS lists, role policies, and logs. Cross-region Interface endpoints, continuous testing, denial investigations, and onboarding new services add cost or delivery time. A narrow allow-list reduces egress but means legitimate new requirements need security review and regression tests. AgentCore-managed sandbox lifecycle can save teams from maintaining their own execution environment, but customers still own the VPC, data scope, policies, and validation suite.

> **Huahua's engineering note**
>
> Adding a test suite to CI is not a permanent security guarantee. Tests need to traverse the same DNS, routes, NACLs, security groups, endpoint policies, and temporary-credential path as production; otherwise they only validate the test environment.

## Questions to answer before adopting the pattern

Turn these questions into negative tests before relying on a similar design:

- If a job is dispatched for the wrong tenant, how does production prevent issuing or injecting credentials with the wrong scope?
- Do STS session duration, S3 prefixes, and maximum role permissions all follow least privilege?
- Are Gateway and Interface endpoint policies, IAM policies, and bucket policies consistent?
- At which layer are unapproved domains, arbitrary IPs, cross-region destinations, and non-S3 AWS endpoints rejected?
- Do VPC or IAM changes trigger the same exfiltration simulations, and do failures block release?
- Can the team distinguish expected denials from suspicious attempts using DNS Firewall, VPC Flow Logs, and AWS API audit logs?

For agent permissions and execution layers, continue with the [AI Agent Guide](/en/blog/64-ai-agent-guide/). For AgentCore control boundaries, see the [AWS AgentCore documentation drift case](/en/blog/111-aws-documentation-drift-agentcore/). The [GitHub MCP enterprise controls case](/en/blog/87-github-mcp-enterprise-controls/) covers MCP tool permissions, while [Agentic CI runtime contracts](/en/blog/116-github-agentic-workflows-runtime-contract/) explores how to make authorization, observability, evaluation, and recovery inspectable.

## Sources

- Jeremy Stashewsky, Meghana Sreenivas, and Anil Gurrala, AWS Machine Learning Blog, 2026-09-21: [How Benchling secured multi-tenant AI agents with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/machine-learning/how-benchling-secured-multi-tenant-ai-agents-with-amazon-bedrock-agentcore/).
- AWS: [AgentCore Code Interpreter](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-tool.html) and [AgentCore VPC configuration](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-vpc.html).
- AWS: [Route 53 Resolver DNS Firewall rule actions](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-rule-actions.html), [VPC endpoint policies](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-access.html), and [STS AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html).

The case study provides one concrete isolation design and a validation approach. A security boundary is dependable only when the deploying team continuously tests it against its own data, network, and credential paths.
