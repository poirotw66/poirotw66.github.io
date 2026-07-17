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

## Tags

- Prefer **3–5 tags** per post.
- Chinese and English labels may differ; they must share one ASCII slug via `TAG_SLUG_MAP` / ASCII normalization.
- Avoid one-off product nouns as tags; keep them in the body or SEO description.
- After migration (2026-07): unique tag slugs ≈ 139, singleton tags = 0 (non-core singletons dropped).
- zh/en display labels may differ; ASCII-normalize (or `TAG_SLUG_MAP`) must yield the **same** slug. Prefer EN labels that already normalize to the canonical form (e.g. `Startup` not `Startups`).

## Related code

- [`src/utils/tag.ts`](../src/utils/tag.ts) — slug map + helpers
- [`src/utils/blogLanes.ts`](../src/utils/blogLanes.ts) — home / hub lanes from categories

## CSS loading (perf)

Page-scoped sheets under `public/css/`: `base.css` + `layout.css` + (`home` | `hub` | `article`). `style.css` remains an `@import` aggregator for legacy references.
