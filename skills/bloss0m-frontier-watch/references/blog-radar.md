# Blog Radar standard

Use this reference for durable AI engineering news, release, architecture, and practice-note triage. Blog Radar is not a feed of everything new.

## Identity and deduplication

- Prefer the canonical primary-source URL as the identity and store it as `url:<canonical-url>`.
- Normalize tracking parameters, fragments, duplicate announcement URLs, and mirrored copies before inserting.
- Update an existing record when its source changes; preserve first-seen date and append a concise history event.
- Check both language archives and aliases before proposing new coverage.

## Source policy

Use official documentation, release notes, engineering blogs, repositories, standards, and first-party research-lab posts as evidence. Use newsletters, social posts, aggregators, search snippets, and community discussion only for discovery.

Separate vendor claims, measured evidence, and Bloss0m judgment. A launch announcement without inspectable technical evidence can remain Radar or Watch, but cannot become a durable-post candidate.

## Scorecard

Score each dimension from 0 to 5, maximum 25:

| Dimension | 0 | 3 | 5 |
| --- | --- | --- | --- |
| Topic relevance | Outside scope | Adjacent | Directly advances Agent, RAG, or AI Platform coverage |
| Durability | Short-lived promotion | Useful for a quarter | Architecture or practice likely useful for a year |
| Evidence quality | Unsupported claim | Inspectable first-party detail | Reproducible measurements or multiple primary artifacts |
| Engineering value | No actionable consequence | Useful trade-off | Changes architecture, evaluation, security, or operations |
| Archive fit | Duplicate or isolated | Supports a category | Fills a cluster gap and links to existing guides or cases |

## Decisions

- **20–25 — durable-post-candidate:** create a brief and request editorial approval.
- **15–19 — shortlist:** retain for weekly review.
- **10–14 — watch:** revisit after stronger evidence or a meaningful update.
- **0–9 — record-only:** retain only for deduplication with a rejection reason.

Use `published` only when a verified Traditional Chinese and English pair exists. Use `deferred` for unresolved access, identity, or evidence. A durable-post candidate requires evidence quality of at least 3.

## Weekly review contract

Combine qualified Blog Radar and Paper Radar entries into `ops/editorial/editorial-reviews/YYYY-Www.md`.

- Prefer 5–10 total candidates; never exceed 10.
- Recommend no more than two paper Deep Reads.
- Recommend at most 2–4 total publication slots, and leave slots unused when evidence is weak.
- If fewer than five candidates qualify, set the review status to `insufficient-signal` instead of padding the list.
- Record source snapshot dates so a repeated run on unchanged ledgers is idempotent.
- Require explicit human approval before either publishing Skill runs.
