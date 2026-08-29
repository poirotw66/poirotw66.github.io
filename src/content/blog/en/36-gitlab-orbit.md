---
title: "GitLab Orbit: Querying Code and SDLC Relationships for AI Agents"
description: "GitLab Orbit builds a queryable graph from code and software-lifecycle data; this article clarifies Remote, Local, MCP, and the current Beta and Experiment boundaries."
pubDate: 2026-07-02
updatedDate: 2026-08-29
tldr:
  - "Orbit Remote combines code and SDLC data across GitLab projects, while Orbit Local indexes a working tree into local DuckDB; they are not one deployment mode with interchangeable databases."
  - "Remote uses GitLab's graph query format, while Local supports read-only SQL; Local MCP remains an Experiment and should not be treated as a production-grade dependency by default."
audience:
  - "Engineering teams evaluating code knowledge graphs and AI coding-agent context"
  - "Platform owners deciding whether Orbit's maturity, permissions, and scope fit production needs"
category: "AI Engineering"
tags: ["AI Agent", "MCP", "Knowledge Graph", "Enterprise AI"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 20
kind: "article"
showToc: true
image: "/blog/36-gitlab-orbit/title_image.webp"
---
The context for a large software system lives beyond code. It is spread across merge requests, pipelines, deployments, issues, and security findings. An AI coding agent limited to text search will struggle with cross-entity questions such as which change caused a failure, who approved it, and what services it affected.

[GitLab Orbit](https://docs.gitlab.com/orbit/) aims to turn code structure and software development lifecycle (SDLC) data into a queryable knowledge graph. It is also evolving quickly: GitLab describes Remote as public beta, while parts of the CLI and Local MCP documentation still carry Experiment labels. Architecture potential and production commitments must therefore be evaluated separately.

> **Huahua in one sentence**
>
> Orbit's value is not feeding an agent more text; it is letting the agent narrow its search through indexed code and SDLC relationships.

## Remote and Local are distinct product paths

| Dimension | Orbit Remote | Orbit Local |
| --- | --- | --- |
| Data scope | GitLab groups, projects, and SDLC data | Repositories in a local working tree |
| Storage and query | GitLab's service builds the graph in ClickHouse and exposes graph queries, REST, CLI, and integrations | Local DuckDB with SQL, CLI, and Local MCP |
| Best fit | Cross-project dependencies, incident work, organization-wide context | Local code exploration, offline use, and low-latency queries |
| Maturity note | Remote capabilities retain beta and feature-flag boundaries | Local MCP documentation is marked Experiment |

According to [GitLab's launch article](https://about.gitlab.com/blog/introducing-gitlab-orbit/), Remote sends SDLC data to ClickHouse through change-data-capture, parses multiple programming languages, and exposes a Cypher-like DSL, MCP, REST, and CLI. "Cypher-like" does not mean clients can submit arbitrary standard Cypher to Remote.

Local instead stores its graph in DuckDB and supports `orbit schema` and `orbit sql`, as shown in the [official CLI documentation](https://docs.gitlab.com/orbit/local/access/cli/). ClickHouse and DuckDB are therefore product boundaries between Remote and Local, not interchangeable storage choices in one deployment wizard.

## Do not invent the schema

Orbit's published indexed-data and schema documentation will continue to change. Implementations should inspect current tables, fields, and relationships through the CLI or MCP schema tools instead of assuming fixed entities such as `CodeNode`, `ActionNode`, or `IdentityNode`.

A defensible query workflow is:

1. Confirm Local or Remote and which repositories and branches are indexed.
2. Inspect the schema or Remote query documentation.
3. Test a narrow question whose answer can be verified.
4. Check the returned commits, merge requests, and pipeline states against the original GitLab objects.

A graph can improve candidate retrieval and relationship traversal, but it does not make the data "irrefutable." Index lag, permissions, omitted branches, and incorrect relationships can still affect an answer.

## Connect Cursor through MCP

The [Orbit Local MCP documentation](https://docs.gitlab.com/orbit/local/access/mcp/) uses stdio for Cursor; it does not require an invented remote URL:

```json
{
  "mcpServers": {
    "orbit-local": {
      "type": "stdio",
      "command": "orbit",
      "args": ["mcp", "serve"]
    }
  }
}
```

Once connected, an agent can discover tools such as `index`, `get_graph_schema`, and `run_sql`. `run_sql` is read-only and has response-size limits. Production evaluation should still restrict indexable directories, review tool permissions, and treat graph results as investigation leads rather than final truth.

> **Huahua's engineering note**
>
> Local MCP is currently an Experiment. Validate the version, index scope, permission behavior, update lag, and recovery path before adoption, and never let graph access replace checking the original records.

## Adoption judgment

The best early Orbit pilots are tasks whose answers can be verified in GitLab but are expensive to assemble manually, such as incident triage, change-impact analysis, and large-repository navigation. Workflows requiring a strong SLA, complete cross-branch coverage, or a stable long-term API should first verify that the current release and deployment option meet those requirements.

For the broader tool-selection and control-loop model, read the [AI Agent practical guide](/en/blog/64-ai-agent-guide/). For protocol boundaries, continue with [MCP architecture and security](/en/blog/34-model-context-protocol-mcp/).

## Primary sources

- [GitLab: Introducing GitLab Orbit](https://about.gitlab.com/blog/introducing-gitlab-orbit/)
- [GitLab Docs: Orbit indexed data](https://docs.gitlab.com/orbit/indexed-data/)
- [GitLab Docs: Orbit Local CLI](https://docs.gitlab.com/orbit/local/access/cli/)
- [GitLab Docs: Orbit Local MCP](https://docs.gitlab.com/orbit/local/access/mcp/)
