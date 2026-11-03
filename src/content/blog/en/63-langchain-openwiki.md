---
title: "LangChain OpenWiki: Does a Completed Update Mean Current Repository Knowledge?"
description: "Use Grounded Claims, page checkpoints and source drift to define a reviewable acceptance contract for repository knowledge."
pubDate: 2026-07-09
updatedDate: 2026-11-03
tldr:
  - "Claims track evidence changes; they do not independently establish semantic correctness."
  - "Saving a page, finishing a run and covering current code are different acceptance conditions."
  - "Exercise synthetic drift, interruption and contract changes before deciding on adoption."
audience:
  - "Architects maintaining cross-module repository knowledge and coding-agent workflows"
  - "Platform engineers designing documentation updates, source coverage and acceptance criteria"
category: "AI Engineering"
tags: ["AI Agent","LangChain","RAG","Knowledge Graph","Enterprise AI"]
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 5
kind: "article"
showToc: true
image: "/blog/63-langchain-openwiki/title_image.webp"
---

A coding agent changes an orders API using the wiki as its guide. The page calls the response field `status`; the code now calls it `state`. The team has just run its documentation update. Why can the answer still be stale?

“Complete” may describe a page being saved, evidence remaining resolvable, a run being finalized, or knowledge matching the code revision about to be changed. **One green indicator cannot stand in for all of them.**

[LangChain OpenWiki](https://github.com/langchain-ai/openwiki) organizes repository context into searchable Markdown and tracks factual statements through versioned Grounded Claims. Its useful contribution is durable state for deciding what needs another look. That does not certify every inference, cross-service contract or deployed revision.

This analysis is scoped to official main [`c5deb62`](https://github.com/langchain-ai/openwiki/tree/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19), available on November 3, 2026. It draws on documentation and implementation, not an OpenWiki/model run or an executed acceptance scenario. It is an architecture analysis, not a report of a deployment experience.

## Changed evidence and an incorrect statement are different problems

An OpenWiki Claim is a factual proposition with supporting evidence, such as “this endpoint returns `status`.” Statements, evidence and versions live in JSON sidecars under `openwiki/.claims/`, separately from the readable Markdown. The [official Claims documentation](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/openwiki/concepts/grounded-claims.md) limits this model to repository code wikis and repository evidence, not arbitrary connector-derived facts.

Before an update, evidence is resolved again. Existing evidence with a different version becomes `stale`; evidence that cannot resolve becomes `unresolved`. The [preflight implementation](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/src/claims/brains/code/preflight.ts#L40-L111) makes that distinction explicit. Both require reconsidering the current source, not automatically deleting the Claim.

In the API example, actually renaming `status` to `state` calls for revising the statement and page. Moving unchanged code may not. The [evidence resolver](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/src/claims/evidence/repository/resolver.ts) uses content and relocation information for line ranges; an unreliable resolution should remain work to address rather than a guessed nearby location.

A hash can establish that cited content remains the same. It cannot establish that the statement interpreted it correctly. If an earlier page confused a timeout with a retry count, unchanged source can preserve the same mistake. My engineering conclusion is to **evaluate evidence freshness and semantic correctness separately**.

## Pages in the same wiki can retain different source checkpoints

Consider an illustrative scenario, not a recorded test: an update starts at commit B. The agent completes the API page, then a developer creates commit C changing a consumer's field mapping. Saving that API page does not establish that the whole wiki understands C.

OpenWiki treats pages as recoverable work units and records run and coverage state through `.run.json` and `.page-manifest.json`. The [generation workflow](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/openwiki/workflows/repository-generation.md) distinguishes completed, pending and skipped jobs.

The finish path deserves particular attention. After its durability proof, [`finishRepositoryRun`](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/src/generation/repository-run.ts#L1690-L1759) checks for source drift. It can return `status: "complete"` together with `sourceChanged: true`, while recording `interrupted` in last-update metadata so a subsequent update can reconcile. This is an internal completion result; it is not a claim that this article verified the CLI exit code for every such case.

The implementation also retains the prior source checkpoints of pages not regenerated in that run, rather than stamping every page as covering the latest HEAD. A wiki-wide generation time is therefore insufficient: inspect the source coverage of the page you intend to use. This is a trade-off that distinguishes partial progress from complete freshness, not inherently a product failure. The [finalization documentation](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/openwiki/workflows/wiki-finalization.md) provides the broader sequence.

## Treat the wiki as replaceable derived knowledge

My adoption rule is to use the wiki to find entry points, narrow reading and propose impact hypotheses. Return to current code, types and tests for the contract being changed. Avoid creating a second specification whose authoritative revision people must guess. Replaceable generated pages do not make human instructions, review decisions or version evidence disposable; retain those recoverably.

`AGENTS.md` suits testing instructions, change boundaries and contribution rules. The wiki suits on-demand module context. Source code and contract tests establish executable behavior. Search and read tools can supply relevant sections; a search hit is neither permission to modify a system nor a compatibility test.

For a synthetic orders API, first record a manually checked expectation of which producers, consumers and tests a `status` → `state` change should affect. Compare the wiki's proposed update against that expectation. If another repository participates, explicitly include its source revision. A workspace search scope is not proof that a cross-repository contract was validated.

The cost is another traceable knowledge artifact and an acceptance process. In a small codebase with recurring, fixed questions, improving the README and tests may be the better first investment. OpenWiki is worth a bounded trial when cross-module exploration recurs, documentation has an owner and the team will retain evidence and revisions. Token savings, latency improvements and coding-task success require comparisons using the same tasks and models; this article supplies no such measurements.

## A documentation PR does not prove a successful update

The official [basic GitHub Actions example](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/examples/openwiki-update.yml) checks out full history and runs `openwiki code --update --print`. Its generation step uses `continue-on-error`: a failed run may still open a PR preserving completed pages, then propagate failure to the workflow. **A PR means changes exist to review, not that the knowledge update succeeded.**

That example removes transient `.run.json` state. Local recovery and resuming on an ephemeral CI runner are consequently different promises; the [CI scheduling documentation](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/openwiki/operations/ci-scheduling.md) discusses that boundary. Inspect retained artifacts, control state and the next run's baseline instead of merely increasing retry counts.

Do not conflate the official [auto-merge example](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/examples/openwiki-update-auto-merge.yml) with the basic example: the basic candidate paths include the workflow; the auto-merge variant restores and excludes it. The latter also pins `openwiki@0.5.0`, while this source snapshot's [package.json](https://github.com/langchain-ai/openwiki/blob/c5deb62e5bbf06c83a4530cefc82547fa3b3cc19/package.json) declares `0.7.3`. This is not a compatibility combination verified by this article. My recommendation is to align versions, retain required checks and review, then decide allowed paths. A “docs-only” label is not evidence that the allowlist matches your policy. Auto-merge is repository release infrastructure, not a model declaring knowledge trustworthy.

## Start a bounded trial by exercising failure cases

The following is a proposed acceptance design, not a test performed for this article. Use a small public or synthetic repository without secrets. Fix a source commit and manually checked answers before introducing each change. Retain page diffs, Claims, source checkpoints, run outcomes and the human acceptance decision.

| Synthetic change | What to inspect | What it does not establish |
|---|---|---|
| Rename an API field | Corrected documentation and separate producer/consumer contract-test results | A documentation edit proves compatibility |
| Delete a cited file | Unresolved evidence and a reconsidered or retracted Claim | Every deletion requires removing the whole page |
| Interrupt after some pages complete | Retained page/Claim state and actual alignment after a rerun | An existing PR proves run success |
| Change source again during an update | Drift/interrupted signals and traceable page checkpoints | Finish complete means coverage of latest HEAD |

In an isolated trial environment with installation, model access and repository access already approved, begin with the documented CLI path:

```bash
# Read-only trial baseline; these commands do not replace content review
git rev-parse HEAD
git status --short

# May use the configured model and write the wiki; check data/cost boundaries first
openwiki code --update --print

# Inspect prose, Claims and managed instructions; status includes untracked output
git status --short
git diff --stat
git diff -- openwiki/ AGENTS.md CLAUDE.md
```

Do not reflexively rerun `--init` to troubleshoot: the README describes reinitialization as replacing the existing generated wiki and Claims, a different operation from incremental update. Nor should `.openwikiignore` stand in for a complete organizational data-egress policy. Source selection, the host's available tools and the model service's data boundary need separate decisions before the trial, rather than inferred safety from attractive output.

> **Huahua's engineering note**
>
> Preserve more than “documentation was produced”: record which source state each page covers, which statements still need confirmation and who accepted the update.

OpenWiki, [Enterprise RAG](/en/blog/65-enterprise-rag-guide/) and [LLM Wiki knowledge-change validation](/en/blog/143-llm-wiki-knowledge-change-validation/) can serve different roles in one architecture: repository context for coding agents, evidence retrieval, and acceptance/regression control. Before selecting a tool, decide whether you are accepting a useful reading entry point or versioned knowledge suitable for a change decision. The latter needs a more explicit acceptance contract.
