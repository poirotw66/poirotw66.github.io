# Bloss0m editorial automation contract

## Active schedules

- **Bloss0m Daily Frontier Watch** — every day at 08:30 local time.
- **Bloss0m Weekly Editorial Review** — every Friday at 16:00 local time.

Both jobs run against the saved `poirotw66.github.io` local project. They may accumulate validated editorial state, but they may not write articles, commit, push, create pull requests, publish, or merge.

## Daily write boundary

The daily job may update only:

- `ops/editorial/blog-radar/ledger.json`
- `ops/editorial/blog-radar/briefs/`
- `ops/editorial/paper-radar/ledger.json`
- `ops/editorial/paper-radar/briefs/`

It deduplicates Blog sources by normalized canonical URL and papers by DOI, OpenReview forum ID, or versionless arXiv ID. A repeated source updates its existing record and must not append duplicate history for an unchanged source snapshot.

## Weekly write boundary

The weekly job may create or update only `ops/editorial/editorial-reviews/YYYY-Www.md`. It preserves human decisions, uses both ledger snapshot dates, recommends at most ten candidates and two Paper Deep Reads, and leaves publication slots unused when evidence is weak.

## Dirty-worktree policy

Pending changes entirely inside the three editorial state directories may be continued only when `npm run check:editorial-radar` passes before writing. Any dirty path outside those directories forces a read-only run. The automation must never stash, reset, clean, overwrite, or commit user work.

## Human approval boundary

Radar status and weekly recommendations are research state, not publication authorization. Only an explicit human approval can hand a named candidate to `$publish-bilingual-ai-blog` or `$publish-bilingual-paper-reading`. Publishing remains a separate bilingual drafting, validation, Draft PR, review, and manual merge workflow.

## Failure behavior

- Inaccessible or conflicting primary sources: preserve `unknown` or defer the candidate.
- Validation failure: stop writes and report the exact failing command and paths.
- Unrelated dirty worktree: perform read-only research and report the blocker.
- Low-signal week: use `insufficient-signal`; never pad the shortlist.
