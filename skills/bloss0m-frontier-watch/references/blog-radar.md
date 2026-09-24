# Blog Radar standard

Use Blog Radar to find recent external technology developments that can support original, durable Bloss0m articles. The existing site is checked only after discovery for duplication and internal linking.

## Search scope

Search the live web in a defined time window. Cover all four Bloss0m editorial lanes in every broad explore or weekly run:

1. **AI systems:** new foundation or reasoning models, multimodal systems, agents, RAG, MCP, evaluation, inference, memory, orchestration, and AI safety.
2. **Enterprise and cloud AI:** production AI platforms, reference architectures, governance, data integration, observability, deployment patterns, and named customer implementations with inspectable technical detail.
3. **AI economics and adoption:** pricing, inference or training cost, capacity, procurement, ROI, market adoption, business models, and credible industry shifts with engineering or operating consequences.
4. **Research and open-source architecture:** recent papers, repositories, benchmarks, standards, datasets, and novel system designs that expose methods, code, measurements, or reproducible artifacts.

Treat general IT as out of scope by default. Do not shortlist a generic runtime release, vulnerability, Kubernetes feature, database update, or developer-tool announcement merely because it is current. It must directly affect an AI workload, AI architecture, AI development workflow, enterprise AI decision, or AI cost model.

For broad scans, seek at least one credible candidate from each lane before ranking. Do not fill a missing lane with weak evidence; report the coverage gap instead. Avoid allowing multiple minor announcements from one vendor to crowd out the other lanes.

Use several query shapes rather than one generic news search:

- topic + release notes / changelog / documentation;
- topic + engineering blog / architecture / benchmark / incident;
- named enterprise + AI platform + architecture / case study / production / scale;
- model or platform + pricing / token cost / inference economics / TCO / ROI;
- paper or repository + benchmark / method / code / evaluation;
- site-restricted searches for relevant vendors, standards bodies, repositories, and research labs;
- date-bounded searches for the requested daily, weekly, or monthly window.

Prioritize sources such as model-provider research and system cards, cloud AI product and architecture pages, first-party customer engineering reports, official pricing and financial disclosures, arXiv or conference papers, and maintained source repositories. Vendor case studies are leads, not independent proof: label their numbers as vendor-reported unless the underlying method and data are inspectable.

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

Score each dimension from 0 to 5, maximum 25. New or materially updated candidates use the v2 rubric below:

| Dimension | 0 | 3 | 5 |
| --- | --- | --- | --- |
| AI topic relevance | No direct AI consequence | Adjacent AI implication | Directly advances one or more editorial lanes |
| Durability | Short-lived promotion | Useful for a quarter | Architecture or practice likely useful for a year |
| Evidence quality | Unsupported claim | Inspectable primary detail | Reproducible evidence or corroborated primary artifacts |
| Engineering value | No actionable consequence | Useful trade-off | Changes architecture, evaluation, security, cost, or operations |
| Reader interest / story hook | No clear reader question, tension, or reason to care | Understandable hook, concrete artifact, or useful surprise | Counterintuitive finding, consequential failure/incident, runnable demo, benchmark reversal, meaningful cost/performance trade-off, or governance shift with strong narrative tension |

The AI topic relevance and reader-interest scores are gates: either score below 3 is `reject` regardless of total score. A v2 candidate must name its story hook explicitly and connect it to a reader question. A routine version bump, API rename, or vendor announcement does not earn reader-interest points merely because it is new. For enterprise cases and cost claims, reduce evidence quality when the source omits the workload, baseline, measurement window, architecture, or pricing assumptions needed to interpret the result.

Existing records with `archiveFit` are legacy v1 scores kept for historical deduplication and human decisions. Do not silently relabel them as reader interest. When a source is newly admitted or materially updated, score it with `readerInterest` and preserve the old record history.

## Decisions

- **23–25 — write-now:** admit a v2 candidate and prepare a brief; evidence quality and reader interest must each be at least 3.
- **0–22 — not admitted:** omit from active candidates and recommendations. Existing records may remain for historical deduplication; preserve human decisions and published content.

Map `write-now` to `durable-post-candidate`. Use `rejected` for a newly assessed below-threshold lead when a deduplication record is needed. Do not inflate scores to reach the gate; record an evidence rationale for each dimension.

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
