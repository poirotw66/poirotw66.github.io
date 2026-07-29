---
name: bloss0m-content-refresh
description: Audit and prioritize the existing Bloss0m bilingual content archive for refresh, internal linking, consolidation, cluster placement, correction, or retirement. Use when Codex needs to review content health, turn Search Console or analytics signals into an editorial backlog, reduce orphan articles, maintain evergreen guides, or plan a focused refresh sprint without drafting unrelated new posts.
---

# Bloss0m Content Refresh

Turn archive evidence into a small, ranked maintenance backlog. Prefer improving useful existing work over publishing for artificial freshness.

## Required context

- In a Bloss0m checkout, read `AGENTS.md`, `specs/taxonomy.md`, `src/data/blogTaxonomy.mjs`, and `src/utils/topicClusters.ts`.
- Read [references/scoring.md](references/scoring.md) before ranking work.
- Inspect `git status` before any edit and preserve unrelated changes.

## Workflow

1. Select **audit**, **plan**, or **repair** mode. Audit and plan are read-only; repair requires an explicit user request to edit.
2. Run `node skills/bloss0m-content-refresh/scripts/audit-archive.mjs` for the baseline archive report.
3. When Search Console or analytics exports are supplied, use them as prioritization evidence. Do not infer traffic, conversion, or ranking from repository data.
4. Rank pages by reader value and opportunity, not age alone:
   - protect pages with impressions, backlinks, conversions, or first-hand evidence;
   - prioritize pages with strong demand but weak clicks, shallow reading paths, or stale technical claims;
   - consolidate overlapping pages only when one destination can preserve distinct value and redirects are planned.
5. For each recommended action, state the evidence, action, destination or links, expected reader outcome, and validation needed.
6. In repair mode, keep routes stable unless the user authorizes migration. Update both language files together and change `updatedDate` only for substantive work.
7. Validate repaired pairs with the publisher skill's `--mode=legacy`, then run the repository content, tag, i18n, and build checks.

## Guardrails

- Never delete or redirect a page from repository-only signals.
- Never change dates solely to appear fresh.
- Treat zero internal links as a routing problem, not proof that the article lacks value.
- Separate factual staleness, editorial weakness, discoverability, and conversion weakness.
- Produce no more than 15 top-priority actions per sprint.

