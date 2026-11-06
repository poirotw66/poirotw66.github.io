# Paper Radar standard

Use this reference for Paper Radar scans, scoring, briefs, and weekly curation.

## Source policy

Use primary sources for evidence:

1. Official conference proceedings, journal pages, DOI records, OpenReview, or arXiv.
2. Official project pages, author repositories, released code, models, and datasets.
3. Author project pages, interactive research works and research-lab announcements for method discovery and release context; inspect the actual paper and artifacts before formal admission.

Use discovery services, newsletters, social posts, search snippets, and community discussion only to locate candidates. Do not cite them as proof of a paper's results.

Record the stable paper ID, current version, first-seen date, last-seen date, and canonical URL. Normalize arXiv IDs by removing the `vN` suffix for deduplication, but retain `vN` in `source_version`. Prefer DOI over OpenReview ID and OpenReview ID over arXiv ID when multiple identifiers describe the same work.

## Paper scorecard

For new or materially re-evaluated candidates use **rubricVersion 2**: score each dimension from 0 to 5 for a maximum of 30. Store `readerInterest` instead of `seriesValue`. Series/track fit is unscored context, never a second relevance bonus. Preserve legacy scores and decisions; never silently relabel seriesValue as interest.

| Dimension | 0 | 3 | 5 |
| --- | --- | --- | --- |
| Topic relevance | No direct AI connection | Clear AI-adjacent question | Direct AI mechanism/application, including cross-domain and creative work; existing series membership is unnecessary |
| Novelty | Repackaging or unclear | Useful combination or measured insight | Clearly new method, evidence, or framing |
| Evidence quality | Unsupported | Reasonable experiments with caveats | Strong baselines, controls, ablations, and transparent limits |
| Reproducibility | No usable detail | Sufficient method detail or partial assets | Maintained code plus accessible model/data/configuration |
| Engineering value | No practical or explanatory consequence | Useful design or learning consideration | Changes architecture, creative workflow, evaluation, understanding, or operating decisions |
| Reader interest | No concrete question | Clear puzzle or unfamiliar mechanism | Compelling surprising mechanism, cross-domain insight or result worth understanding; an experiment is optional |

Do not hide a zero in evidence quality with a high total. A Deep Read candidate requires evidence quality of at least 3.

Paper Radar admission gate: only a total score from 28–30/30 is eligible for candidate status. A paper scoring 0–27 is not a formal Paper Radar candidate, regardless of its individual dimensions. It may remain an explicitly labeled exploration lead in the independent inbox, with unknowns; never label it Deep Read-ready. Existing lower-scored records may remain in the ledger for deduplication and history, but must not appear in candidate, shortlist, weekly recommendation, or writing-handoff output unless explicitly re-scored above the gate.

## Decision thresholds

- **28–30 — deep-read candidate:** create a complete brief and request editorial approval.
- **0–27 — not admitted:** do not create or retain a candidate brief/status, and do not include the paper in a formal writing shortlist or writing handoff. An explicitly labeled exploration lead may be shown among the daily cards without being called a formal recommendation. Preserve only a deduplication record and rejection reason when needed.

Use `withdrawn` regardless of score when the source is withdrawn. Use `deferred` when the paper cannot yet be responsibly evaluated.

## Required brief evidence

Complete these sections before recommending Deep Read:

- Identity: stable ID, version, dates, venue/status, canonical links.
- Editorial fit: reader question, optional series track/gap, and publication versus discovery dates. Use cross-domain and no existing gap when appropriate; do not invent a gap to earn points.
- Claim map: problem, main claim, method, and what is genuinely new.
- Evidence audit: datasets, benchmarks, baselines, ablations, uncertainty, and threats to validity.
- Reproducibility: code, model, data, license, setup obstacles, and estimated reproduction scope.
- Critical reading: strongest result, weakest assumption, limitations, and claims the evidence does not support.
- Bloss0m connection: existing paired routes to link and duplication risk.
- Recommendation: output level, score, rationale, and open questions for human approval.

Use `unknown` or an explicit unchecked box when evidence is unavailable. Never infer missing experimental details.

## Output levels and cadence

- **Exploration lead:** independent inbox, no formal readiness claim.
- **Radar:** formal ledger after explicit import approval.
- **Shortlist:** weekly editorial candidate, not a publication promise.
- **Deep Read:** full bilingual paper-reading candidate after approval.
- **Reproduction:** Deep Read plus an engineering experiment when code, compute, and scope are practical.

Daily research saves outside the worktree via [candidate-inbox.md](candidate-inbox.md), never directly into formal Radar. Import requires an explicit human decision and safe revalidation. Scan daily. Recommend no more than 5–10 papers weekly, no more than 2 Deep Reads per weekly review, and target one finished Deep Read every one or two weeks. This cadence is a quality ceiling, not a quota.

## Publication handoff gate

An approved Deep Read remains a draft until all of the following pass:

1. The Traditional Chinese and English pair passes `npm run audit:paper-pair -- --strict <basename>`.
2. Both languages pass `npm run audit:paper-comprehension -- --strict <basename>` with every Paper Essence Contract signal present.
3. Both languages pass the seven-question semantic teach-back in the canonical [Paper Essence Contract](../../publish-bilingual-paper-reading/references/paper-essence-contract.md), including the formal/conceptual scaffold. Use only the saved articles and cite their sections and source anchors.
4. Bilingual answers are materially equivalent; neither language may depend on claims or caveats absent from the other.

If any item fails or remains unclear, record `needs-revision` in the handoff notes. Do not create a publication PR and do not mark the Paper Radar ledger item as published. A structural 100% score is necessary but not sufficient; the semantic teach-back is the final editorial judgment.

## Version handling

When a known paper changes version:

1. Update `source_version` and `last_seen_at`.
2. Review the revision notes or compare the affected sections.
3. Record whether results, claims, limitations, authorship, or publication status changed.
4. Re-score only affected dimensions and preserve a concise note in `history`.
5. Flag any published Bloss0m reading whose interpretation may now be stale.

## Exploration and variety

Follow all four discovery lanes in [blog-radar.md](blog-radar.md), including unfamiliar 30–90-day works with honest date labels. Keep theoretical insight, representation, PDF/OCR, multimodal and creative applications eligible without insisting on a workplace outcome or runnable experiment. Unknown code or unchecked numbers remain explicit gaps, never inferred evidence. Use curiosity and meaningful differences to order at most three daily cards, with score rationale behind them. Apply same-material suppression and mechanism-level fatigue rules from the inbox contract.
