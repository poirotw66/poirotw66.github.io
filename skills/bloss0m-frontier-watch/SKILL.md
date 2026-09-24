---
name: bloss0m-frontier-watch
description: Search recent AI models, agents, RAG, MCP, enterprise and cloud AI, AI economics, papers, and open-source architectures; verify primary sources, deduplicate and score Blog Radar and Paper Radar candidates, and hand approved topics to bilingual publishing skills. Use for AI frontier discovery and editorial curation, not unrelated general IT news or archive audits.
---

# Bloss0m Frontier Watch

Discover useful technology developments outside the site, verify them, and turn the strongest findings into original Bloss0m writing. Treat the existing archive as a deduplication aid, not the research source.

## Required context

- In a Bloss0m checkout, read `AGENTS.md` and inspect `git status` before editing.
- For Blog Radar, read [references/blog-radar.md](references/blog-radar.md), `ops/editorial/blog-radar/ledger.json`, and `ops/editorial/blog-radar/brief-template.md`.
- For Paper Radar, read [references/paper-radar.md](references/paper-radar.md), `ops/editorial/paper-radar/series-map.yaml`, and `ops/editorial/paper-radar/ledger.json`.
- For weekly review, read both ledgers and `ops/editorial/editorial-reviews/review-template.md`.
- Read `specs/taxonomy.md` only when classifying a verified candidate or preparing a blog draft.
- Read `$publish-bilingual-ai-blog` before writing article files.

## Modes

- **explore:** default for requests such as “探索最新技術”. Search the live web, verify dates and sources, rank findings, and report what is worth collecting.
- **collect:** update the ledger and create a source-backed brief for qualified candidates.
- **write-blog:** when the user explicitly asks to write a blog or approves a candidate, complete its brief and invoke `$publish-bilingual-ai-blog` to create the Traditional Chinese and English draft pair.
- **paper:** search recent papers, deduplicate by stable paper identity, score them, and prepare a Paper Radar brief. Admit only papers scoring 28–30/30; papers scoring 0–27 are not Paper Radar candidates.
- **write-paper:** after explicit approval, invoke `$publish-bilingual-paper-reading` with the verified Paper Radar brief. Approval is available only for a paper that passes the 28–30/30 admission gate. The draft is not publication-ready until both the Paper Essence and teach-back gates pass.
- **weekly:** search the live web first, then combine qualified Blog Radar and Paper Radar findings into a bounded editorial shortlist.

## Daily automation efficiency

For scheduled daily runs, `ops/editorial/automation-contract.md` defines freshness, write boundaries, score floors, and the five-section report. Blog admission is 23–25/25; new or materially updated Blog candidates also require `readerInterest >= 3/5` in the v2 rubric, while legacy `archiveFit` records are not silently re-scored. Paper admission is 28–30/30. Both require evidence quality of at least 3/5. Score honestly before applying these gates; missing evidence can mean zero qualified candidates.

Perform a lightweight stable-ID/URL lookup before expensive verification, then confirm archive/contentEntries coverage before admission. Skip unchanged known sources; review changed versions and artifacts only where they affect claims. Existing drafts count as covered even when the ledger still says candidate. Batch independent source reads and validate editorial state before and after the entire write batch, not after each brief. No-change and read-only runs need only one validation. Daily runs never install dependencies, generate covers, or build the site.

## External-first workflow

1. Determine the requested topic and freshness window. Default to the last 7 days; daily scans use 24–72 hours with a seven-day backfill ceiling. Extend to 30 days only for an explicitly broader interactive research request.
2. Browse the live web on every explore, collect, paper, or weekly run. Never substitute model memory or the existing Bloss0m archive for current web research.
3. Keep a direct AI consequence as the relevance gate and cover the four editorial lanes in `references/blog-radar.md`. Search across relevant external channels: official release notes and documentation, vendor or engineering blogs, repositories, standards bodies, security advisories, first-party research labs, and academic indexes. Use reputable reporting, newsletters, social posts, and aggregators only to discover leads.
4. Open the actual source. Record its canonical URL, publisher or author, publication or update date, source type, central claim, technical evidence, limitations, and why it matters to practitioners.
5. Follow supporting artifacts when claims depend on a paper, benchmark, specification, repository, changelog, incident report, or security advisory. Separate first-party claims, measured results, independent reporting, and Bloss0m inference.
6. Reject stale reposts, undated pages presented as news, inaccessible primary sources, SEO summaries without evidence, and announcements whose key claim cannot be verified.
7. Normalize the canonical URL and check the appropriate ledger for duplicates. Only after a candidate is verified, inspect the site archive to avoid rewriting an already-covered topic and to find optional internal links.
8. Score the candidate with the relevant rubric. Recency is a filter, not proof of editorial value. For Blog Radar, name the reader question and story hook before scoring reader interest; prefer counterintuitive findings, consequential failures, runnable artifacts, benchmark reversals, meaningful cost/performance trade-offs, and governance shifts over routine release notes.
9. In collect mode, update the existing stable record or create one brief from the template. Preserve first-seen dates and human decisions; never create duplicate records for the same source.
10. In write-blog mode, require at least one primary source and enough corroborating technical material to support the proposed angle. Then use `$publish-bilingual-ai-blog` in Create mode, passing the brief and all verified source URLs. Let that skill handle archive-aware internal links, bilingual files, Huahua callouts, cover work, and content validation.
11. In paper and write-paper modes, follow `paper-radar.md` for stable identifiers, version handling, series fit, score thresholds, and publication handoff. Apply the hard admission gate after scoring: only totals from 28–30/30, with evidence quality at least 3/5, may receive a new brief, candidate status, weekly recommendation, or writing handoff. Scores from 0–27 are rejected or omitted from candidate output; existing lower-scored ledger records may remain only as historical deduplication records unless they are explicitly re-scored above the gate. For write-paper, run `npm run audit:paper-pair -- --strict <basename>` and `npm run audit:paper-comprehension -- --strict <basename>` after drafting both languages. Then answer the six teach-back questions from the finished article with explicit section or evidence anchors. Any missing, ambiguous, or unsupported answer leaves the candidate at `needs-revision`; do not create a publication PR or mark the ledger item as published.
12. In weekly mode, include 5–10 qualified findings when available, recommend no more than two paper Deep Reads and 2–4 total publication slots, and use `insufficient-signal` instead of padding a weak week.
13. Run `npm run check:editorial-radar` after changing a ledger, brief, or weekly review. Run the publishing skill’s required checks after writing article files.

## Output contract

For an explore response, include:

- the search window and query scope;
- 5–10 ranked findings when evidence permits;
- publication date, primary source, and one-line technical consequence for each finding;
- the story hook or reader question that makes each Blog finding worth opening;
- a clear decision: write now, collect for later, watch, or reject;
- the strongest proposed blog angle and the source set needed to write it.

Use `insufficient-signal` instead of padding the result. Do not present a candidate as “latest” without a verified publication or update date.

## Guardrails

- Do not start by reviewing the site archive. Search external sources first.
- Do not write from search snippets, a single unverified post, or a press release alone when the central claim needs technical evidence.
- Do not auto-publish, commit, push, merge, or deploy. Writing a blog means creating validated local drafts unless the user separately requests GitHub publication.
- Never treat a passing structural audit alone as proof of comprehension. A paper draft must satisfy the Paper Essence Contract in both languages and support a semantic teach-back review before publication handoff.
- Do not invent facts, benchmarks, dates, quotes, sources, or internal routes. Preserve uncertainty in the brief and article.
- Keep Traditional Chinese and English article paths paired.
- Preserve unrelated local work. For unattended Radar automation, write only under `ops/editorial/blog-radar`, `ops/editorial/paper-radar`, or `ops/editorial/editorial-reviews` as allowed by the specific schedule; use a read-only run if other dirty paths exist.
- For an interactive write-blog request, article and cover paths are allowed only after the user has requested or approved that topic. Never overwrite an existing post.
