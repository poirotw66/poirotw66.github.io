# Paper Radar standard

Use this reference for Paper Radar scans, scoring, briefs, and weekly curation.

## Source policy

Use primary sources for evidence:

1. Official conference proceedings, journal pages, DOI records, OpenReview, or arXiv.
2. Official project pages, author repositories, released code, models, and datasets.
3. Author or research-lab announcements only for release context.

Use discovery services, newsletters, social posts, search snippets, and community discussion only to locate candidates. Do not cite them as proof of a paper's results.

Record the stable paper ID, current version, first-seen date, last-seen date, and canonical URL. Normalize arXiv IDs by removing the `vN` suffix for deduplication, but retain `vN` in `source_version`. Prefer DOI over OpenReview ID and OpenReview ID over arXiv ID when multiple identifiers describe the same work.

## Paper scorecard

Score each dimension from 0 to 5 for a maximum of 30.

| Dimension | 0 | 3 | 5 |
| --- | --- | --- | --- |
| Topic relevance | Outside Bloss0m scope | Adjacent to a current path | Directly advances Agent, retrieval, or a named series gap |
| Novelty | Repackaging or unclear | Useful combination or measured insight | Clearly new method, evidence, or framing |
| Evidence quality | Unsupported | Reasonable experiments with caveats | Strong baselines, controls, ablations, and transparent limits |
| Reproducibility | No usable detail | Sufficient method detail or partial assets | Maintained code plus accessible model/data/configuration |
| Engineering value | No actionable consequence | Useful design consideration | Changes architecture, evaluation, or operating decisions |
| Series value | Isolated topic | Supports an existing path | Closes a high-priority gap or enables a coherent sequence |

Do not hide a zero in evidence quality with a high total. A Deep Read candidate requires evidence quality of at least 3.

## Decision thresholds

- **24–30 — deep-read candidate:** create a complete brief and request editorial approval.
- **19–23 — shortlist:** retain for the weekly list; create a brief only if it fills a priority gap.
- **14–18 — watch:** keep in the ledger and revisit after revision, code release, or independent evidence.
- **0–13 — record only:** preserve the deduplication record with a rejection reason.

Use `withdrawn` regardless of score when the source is withdrawn. Use `deferred` when the paper cannot yet be responsibly evaluated.

## Required brief evidence

Complete these sections before recommending Deep Read:

- Identity: stable ID, version, dates, venue/status, canonical links.
- Editorial fit: reader question, series track, named gap, and why now.
- Claim map: problem, main claim, method, and what is genuinely new.
- Evidence audit: datasets, benchmarks, baselines, ablations, uncertainty, and threats to validity.
- Reproducibility: code, model, data, license, setup obstacles, and estimated reproduction scope.
- Critical reading: strongest result, weakest assumption, limitations, and claims the evidence does not support.
- Bloss0m connection: existing paired routes to link and duplication risk.
- Recommendation: output level, score, rationale, and open questions for human approval.

Use `unknown` or an explicit unchecked box when evidence is unavailable. Never infer missing experimental details.

## Output levels and cadence

- **Radar:** ledger only.
- **Shortlist:** weekly editorial candidate, not a publication promise.
- **Deep Read:** full bilingual paper-reading candidate after approval.
- **Reproduction:** Deep Read plus an engineering experiment when code, compute, and scope are practical.

Scan daily. Recommend no more than 5–10 papers weekly, no more than 2 Deep Reads per weekly review, and target one finished Deep Read every one or two weeks. This cadence is a quality ceiling, not a quota.

## Publication handoff gate

An approved Deep Read remains a draft until all of the following pass:

1. The Traditional Chinese and English pair passes `npm run audit:paper-pair -- --strict <basename>`.
2. Both languages pass `npm run audit:paper-comprehension -- --strict <basename>` with every Paper Essence Contract signal present.
3. A semantic teach-back can answer, from the article itself: the problem, why the prior approach is insufficient, the core intuition, the method flow, what the strongest evidence establishes, and when the method should not be used. Each answer must point to a named article section and at least one primary-source evidence anchor where applicable.
4. Bilingual answers are materially equivalent; neither language may depend on claims or caveats absent from the other.

If any item fails or remains unclear, record `needs-revision` in the handoff notes. Do not create a publication PR and do not mark the Paper Radar ledger item as published. A structural 100% score is necessary but not sufficient; the semantic teach-back is the final editorial judgment.

## Version handling

When a known paper changes version:

1. Update `source_version` and `last_seen_at`.
2. Review the revision notes or compare the affected sections.
3. Record whether results, claims, limitations, authorship, or publication status changed.
4. Re-score only affected dimensions and preserve a concise note in `history`.
5. Flag any published Bloss0m reading whose interpretation may now be stale.
