# Bloss0m editorial automation contract

## Active schedules

- **Bloss0m Daily Frontier Watch** — every day at 08:30 local time.
- **Bloss0m Weekly Editorial Review** — documented cadence: Friday at 16:00 local time; no matching local automation was found during the 2026-09-18 configuration audit. Do not report it as active without verifying its installation.

Both jobs run against the saved `poirotw66.github.io` local project. They may accumulate validated editorial state, but they may not write articles, commit, push, create pull requests, publish, or merge.

## Daily write boundary

The daily job may update only:

- `ops/editorial/blog-radar/ledger.json`
- `ops/editorial/blog-radar/briefs/`
- `ops/editorial/paper-radar/ledger.json`
- `ops/editorial/paper-radar/briefs/`

It deduplicates Blog sources by normalized canonical URL and papers by DOI, OpenReview forum ID, or versionless arXiv ID. A repeated source updates its existing record and must not append duplicate history for an unchanged source snapshot.

## Daily research and reporting

- Use the last 24–72 hours; extend only to seven days when needed and label backfill by the source's actual publication/update date. Keep older backlog recommendations separate.
- Search open-source artifacts, models/inference, MCP/agent runtimes, enterprise/cloud AI, and independent research. Aim for at least three organizations and at most two candidates per organization; report missing evidence rather than fill quotas.
- Screen titles, stable IDs, and canonical URLs against the ledgers before expensive artifact inspection. Before admission, also check both language archives and contentEntries; an existing article or draft is already covered regardless of ledger status.
- Admit Blog candidates at 23–25/25 and Paper candidates at 28–30/30, with evidence quality at least 3/5. Keep lower scores out of active recommendations; historical records remain available for deduplication.
- Score each dimension against its rubric before totaling. Give each score a brief evidence rationale; do not raise scores to satisfy admission thresholds. Public repository availability is not independent reproduction or proof that data/checkpoints are complete.
- Inspect promising primary sources in parallel where independent. Reuse verified facts within the run. Create briefs only after qualification; unchanged sources do not need rewritten briefs, timestamps, or duplicate history.
- Run `npm run check:editorial-radar` once before writing and once after the complete batch of changes. For read-only or no-change runs, run it once and report the result; do not install dependencies, generate covers, or build the site for Radar.
- Check git status again immediately before writing. Preserve all existing edits, including human notes inside the allowed directories. If a run is already active, report the overlap and skip a second writer.

Return these five sections in Traditional Chinese:
1. Radar overview: separate new/updated Blog and Paper titles, primary source links, verified dates, scores, and states; summarize coverage and missing source types.
2. Paper ranking: descending x/30, tie-break by engineering value and evidence quality; include track, gap, 2–3 sentence summary, recommendation reason, and evidence limits. When no papers changed, show up to five eligible, unwritten backlog items explicitly labeled review recommendations.
3. Blog ranking: descending x/25 with dates, 2–3 sentence summaries, proposed angles, write-now decisions, and inspectable artifact status.
4. Editorial judgment: name the strongest Blog and Paper when evidence supports them; summarize rejected leads and reasons. Zero qualifying candidates is a valid result.
5. Validation and blockers: report deduplication, changed paths, check results, read-only/overlap conditions, and confirmation that no article or Git publication actions occurred.

## Weekly write boundary

The weekly job may create or update only `ops/editorial/editorial-reviews/YYYY-Www.md`. It preserves human decisions, uses both ledger snapshot dates, recommends at most ten candidates and two Paper Deep Reads, and leaves publication slots unused when evidence is weak.

## Dirty-worktree policy

Pending changes entirely inside the three editorial state directories may be continued only when `npm run check:editorial-radar` passes before writing. Any dirty path outside those directories forces a read-only run. The automation must never stash, reset, clean, overwrite, or commit user work.

## Human approval boundary

Radar status and weekly recommendations are research state, not publication authorization. Only an explicit human approval can hand a named candidate to `$publish-bilingual-ai-blog` or `$publish-bilingual-paper-reading`. Publishing remains a separate bilingual drafting, validation, Draft PR, review, and manual merge workflow.

For a paper handoff, both strict publication audits and the semantic six-question teach-back defined in `skills/bloss0m-frontier-watch/references/paper-radar.md` must pass before a publication PR can be created or the ledger can be marked published. A failed gate keeps the draft at `needs-revision`.

## Failure behavior

- Inaccessible or conflicting primary sources: preserve `unknown` or defer the candidate.
- Validation failure: stop writes and report the exact failing command and paths.
- Unrelated dirty worktree: perform read-only research and report the blocker.
- Low-signal week: use `insufficient-signal`; never pad the shortlist.
