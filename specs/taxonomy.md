# Blog taxonomy (categories & tags)

Stable exploration vocabulary for Bloss0m blog posts (zh + en).

## Categories (7)

| Category | Use for |
|----------|---------|
| Enterprise AI | Enterprise delivery, governance, security, banking / ops AI |
| AI Engineering | Agents, RAG, harnesses, IDE / vibe coding, ML systems |
| Cloud & Platform | AWS / GCP / Kubernetes / platform engineering write-ups |
| Industry Pulse | Product launches, industry signals, skimmable notes |
| Creator Tools | LINE stickers and creator tooling |
| Startup | Founder / MVP / GTM notes |
| Practice Notes | Personal practice, sports & science, non-core essays |

Legacy category names were folded into these seven during the 2026-07 taxonomy pass.

The executable source of truth is `src/data/blogTaxonomy.mjs`. Astro schemas,
lane routing, repository validators, and publishing-skill audits must consume
that module instead of maintaining independent category lists.

## Topic clusters

Core engineering coverage can join one of three maintained reading paths:

- `ai-agent`
- `enterprise-rag`
- `ai-platform-governance`

Use `clusterRole` (`pillar`, `support`, `case`, or `signal`) and `clusterOrder`
in both language files. Leave cluster fields absent when the relationship is weak.

## Tags

- Prefer **3–5 tags** per post; two are acceptable for narrow, non-core notes.
- Chinese and English labels may differ, but both must resolve to the same ASCII slug through `TAG_SLUG_MAP` or ASCII normalization.
- New ASCII tags do not require registration in an allowlist.
- Avoid one-off product nouns as tags; keep them in the body or SEO description.
- A canonical tag slug must appear on at least two Chinese posts.
- Necessary singleton exceptions must be documented in `SINGLETON_TAG_SLUG_EXCEPTIONS` with a reason.
- Stale singleton exceptions fail validation and must be removed.
- After the second migration (2026-07): 40 canonical tag slugs, singleton tags = 0.

## Related code

- [`src/utils/tag.ts`](../src/utils/tag.ts) — slug mapping and helpers.
- [`src/utils/blogLanes.ts`](../src/utils/blogLanes.ts) — home and hub lanes derived from categories.
- [`scripts/validate-tags.mjs`](../scripts/validate-tags.mjs) — bilingual slug parity and singleton governance.

## CSS loading (performance)

Page-scoped sheets live under `public/css/`: `base.css` + `layout.css` + (`home` | `hub` | `article`). `style.css` remains an `@import` aggregator for legacy references.
