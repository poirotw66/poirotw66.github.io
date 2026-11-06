# Blog Radar standard

Use Blog Radar to find recent external technology developments that can support original, durable Bloss0m articles. The existing site is checked only after discovery for duplication and internal linking.

## Search scope

Search all four exploration lanes without requiring each to yield a daily card:

1. **New mechanisms and counterintuitive results:** model architectures, inference, memory, retrieval, multimodal representations, unexpected benchmark or cost reversals.
2. **Tools and works worth understanding or playing with:** inspectable repositories, document/PDF/OCR tools, creative AI, interactive research demos and small systems. A demo need not prove broad business impact to be an exploration lead.
3. **Cross-domain discoveries:** AI plus design, science, art, language, education, accessibility or other fields, when an explicit mechanism or reader question connects them. Do not force every topic into enterprise IT.
4. **Failures and work impact:** real incidents, controlled failure analysis, adoption, economics and changing tasks with adequate evidence. This is one lane, not a gate for the other three.

For news use 24–72 hours and up to seven-day backfill. Also explore unfamiliar works from 30–90 days and label them newly discovered, not newly released. General IT without a direct AI consequence remains out of scope. Seek varied creators and mechanisms without padding quotas.

Use multiple query shapes: mechanism + ablation / architecture / implementation; PDF/OCR or multimodal + representation / evaluation / repository; creative AI + interactive demo / project page / technical breakdown; named research area + failure / counterexample; AI workload + cost / latency / adoption / incident. Search official proceedings, author project pages, repositories and datasets as well as model labs, engineering blogs and source-backed reporting. Community work and demos are legitimate discovery channels; return to actual artifacts for evidence. No vendor whitelist is required.

## Evidence ladder

Prefer sources in this order:

1. official documentation, release notes, standards, advisories, repositories, papers, or first-party engineering reports;
2. independent technical analysis or reporting that adds verification or context;
3. newsletters, aggregators, community posts, and social media for discovery only.

Open every source used in a brief. Record the canonical URL and verified publication or update date. A result is not “new” merely because a search engine surfaced it recently.

For a blog-writing candidate, require one primary source plus supporting technical material appropriate to the claim. A second independent source is strongly preferred for disputed, quantitative, security-sensitive, or high-impact claims.

## Identity and deduplication

- In the independent inbox use paper stable IDs when known (DOI, OpenReview, versionless arXiv), otherwise canonical URL. For the existing Blog ledger import format, retain `url:<canonical-url>` and resolve aliases against inbox history.
- Remove tracking parameters, fragments, duplicate announcement URLs, and mirrors.
- Update an existing record when the primary source changes; preserve the first-seen date and append a concise history event.
- After verification, search both language archives and aliases only to detect duplicate coverage and identify optional internal links.
- Do not turn “already covered” into a site-audit task. Record the duplicate and return to external discovery.

## Scorecard

Score each dimension from 0 to 5, maximum 25. New or materially updated candidates use the v2 rubric below:

| Dimension | 0 | 3 | 5 |
| --- | --- | --- | --- |
| AI topic relevance | No direct AI consequence | Adjacent AI implication | Directly advances one or more editorial lanes |
| Durability | Short-lived promotion | Useful for a quarter | Architecture or practice likely useful for a year |
| Evidence quality | Unsupported claim | Inspectable primary detail | Reproducible evidence or corroborated primary artifacts |
| Engineering value | No practical or explanatory consequence | Useful design or learning trade-off | Changes system design, creative workflow, understanding, evaluation, cost, or operations |
| Reader interest / story hook | No clear reader question, tension, or reason to care | Understandable hook, concrete artifact, or useful surprise | Counterintuitive finding, consequential failure/incident, runnable demo, benchmark reversal, meaningful cost/performance trade-off, or governance shift with strong narrative tension |

The AI topic relevance and reader-interest scores are gates: topic relevance below 3 or reader interest below 4 blocks formal admission regardless of total score; it does not prohibit saving an honest exploration lead. A v2 candidate must name its story hook explicitly and connect it to a reader question. A routine version bump, API rename, or vendor announcement does not earn reader-interest points merely because it is new. For enterprise cases and cost claims, reduce evidence quality when the source omits the workload, baseline, measurement window, architecture, or pricing assumptions needed to interpret the result.

Existing records with `archiveFit` are legacy v1 scores kept for historical deduplication and human decisions. Do not silently relabel them as reader interest. When a source is newly admitted or materially updated, score it with `readerInterest` and preserve the old record history.

## Decisions

- **23–25 — formal writing candidate:** admit a v2 candidate and prepare a brief; evidence quality and reader interest must each be at least 3 and 4 respectively.
- **0–22 — not formally admitted:** may remain an explicitly labeled exploration lead in the independent inbox; omit from formal writing recommendations. Existing records may remain for historical deduplication; preserve human decisions and published content.

Formal eligibility is not human approval. Map formal Blog candidates to `durable-post-candidate` only during an explicitly approved import. Use `rejected` for a newly assessed below-threshold lead when a deduplication record is needed. Do not inflate scores to reach the gate; record an evidence rationale for each dimension.

## Brief and writing handoff

The brief must state:

- search window and discovery queries;
- verified source dates and canonical URLs;
- claim-to-source mapping;
- measured evidence, vendor claims, conflicts, and unknowns;
- the reader question and focused blog angle;
- the story hook and why it is more than a routine announcement;
- why the topic matters now and remains useful after the news cycle;
- whether the evidence is sufficient for `$publish-bilingual-ai-blog`.

When the user requests writing, pass the brief and complete verified source set to `$publish-bilingual-ai-blog`. Do not ask that skill to rediscover the topic from a title alone.

## Exploration versus readiness and card shape

An exploration lead needs a real source, a concrete surprise or question and explicit unknowns, not a qualifying total. It can be shown as a lead and saved in the independent inbox, never described as write-now. A formal candidate requires inspected primary evidence, claim-level provenance and supporting material appropriate to the central claim; unverified numerical claims block promotion. A demo supports only its demonstrated scope. Evidence/source rules remain unchanged by novelty.

Use [candidate-inbox.md](candidate-inbox.md) for cards, seven-day material deduplication, topic fatigue and explicit feedback. Lead with surprise, unresolved question, why explore, how to understand or optionally try it, writing angle, confirmed facts and unknowns. Do not require experiments for conceptual or creative topics. Existing already-covered sources may supply context, not a fresh standalone recommendation.
