# Blog Radar standard

Use Blog Radar to find recent external technology developments that can support original, durable Bloss0m articles. The existing site is checked only after discovery for duplication and internal linking.

## Search scope

Search the live web in a defined time window. Cover the parts of information technology most relevant to Bloss0m:

- AI engineering: agents, RAG, model systems, evaluation, inference, safety, and developer tooling;
- cloud and platform engineering: Kubernetes, infrastructure, data platforms, observability, and production operations;
- enterprise technology: governance, security, architecture, adoption, and cost;
- meaningful developer-tool, open-source, standards, and cybersecurity developments.

Use several query shapes rather than one generic news search:

- topic + release notes / changelog / documentation;
- topic + engineering blog / architecture / benchmark / incident;
- site-restricted searches for relevant vendors, standards bodies, repositories, and research labs;
- date-bounded searches for the requested daily, weekly, or monthly window.

## Evidence ladder

Prefer sources in this order:

1. official documentation, release notes, standards, advisories, repositories, papers, or first-party engineering reports;
2. independent technical analysis or reporting that adds verification or context;
3. newsletters, aggregators, community posts, and social media for discovery only.

Open every source used in a brief. Record the canonical URL and verified publication or update date. A result is not “new” merely because a search engine surfaced it recently.

For a blog-writing candidate, require one primary source plus supporting technical material appropriate to the claim. A second independent source is strongly preferred for disputed, quantitative, security-sensitive, or high-impact claims.

## Identity and deduplication

- Use the canonical primary-source URL as the identity: `url:<canonical-url>`.
- Remove tracking parameters, fragments, duplicate announcement URLs, and mirrors.
- Update an existing record when the primary source changes; preserve the first-seen date and append a concise history event.
- After verification, search both language archives and aliases only to detect duplicate coverage and identify optional internal links.
- Do not turn “already covered” into a site-audit task. Record the duplicate and return to external discovery.

## Scorecard

Score each dimension from 0 to 5, maximum 25:

| Dimension | 0 | 3 | 5 |
| --- | --- | --- | --- |
| Topic relevance | Outside scope | Adjacent | Directly advances useful technology coverage |
| Durability | Short-lived promotion | Useful for a quarter | Architecture or practice likely useful for a year |
| Evidence quality | Unsupported claim | Inspectable primary detail | Reproducible evidence or corroborated primary artifacts |
| Engineering value | No actionable consequence | Useful trade-off | Changes architecture, evaluation, security, cost, or operations |
| Archive fit | Exact duplicate | Distinct update or useful category fit | Strong new angle with useful internal reading paths |

## Decisions

- **20–25 — write-now:** prepare a brief and recommend a blog draft; evidence quality must be at least 3.
- **15–19 — collect:** retain for a weekly shortlist or wait for stronger evidence.
- **10–14 — watch:** revisit after a meaningful update.
- **0–9 — reject:** retain only for deduplication with a reason.

Map `write-now` to ledger status `durable-post-candidate`, `collect` to `shortlist`, `watch` to `watch`, and `reject` to `rejected`.

## Brief and writing handoff

The brief must state:

- search window and discovery queries;
- verified source dates and canonical URLs;
- claim-to-source mapping;
- measured evidence, vendor claims, conflicts, and unknowns;
- the reader question and focused blog angle;
- why the topic matters now and remains useful after the news cycle;
- whether the evidence is sufficient for `$publish-bilingual-ai-blog`.

When the user requests writing, pass the brief and complete verified source set to `$publish-bilingual-ai-blog`. Do not ask that skill to rediscover the topic from a title alone.
