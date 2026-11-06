# Independent candidate inbox (schema version 1)

Daily runs save research outside the website at:

`/Users/cfh00896102/.codex/automations/bloss0m-daily-frontier-watch/candidate-inbox/`

Use `python3 skills/bloss0m-frontier-watch/scripts/candidate-inbox.py validate INPUT.json`, then `preview`, then `save`. INPUT.json must itself be a unique staging file under this inbox (for example `.input-<uuid>.json`, exclusively created); remove only that run's own staging file after success. The helper atomically creates `runs/<runId>.json` with exclusive creation, never replaces files and never writes to the website. It requires Python's standard library only. Do not call `feedback` during research. `--test-root` is exclusively for synthetic data in the OS temp directory, not a production location override.

## Research input schema

Required top-level keys: `schemaVersion: 1`, a unique safe `runId` (UTC date plus UUID recommended; letters/digits/hyphen/underscore), `createdAt` (UTC ISO timestamp ending Z), and `candidates` (ordered array; empty allowed). The saved record adds `presentedIds` (at most three), `suppressed` with reasons and `feedbackRefs`; callers must not supply these computed keys.

Each candidate requires:

- `title`, `canonicalUrl` (HTTPS, keep functional query parameters; remove only tracking and fragments), `stableId` (DOI, versionless arXiv, OpenReview forum or canonical URL identity). Reuse the same stable identity across Blog/Paper and URL aliases; DOI takes precedence when known. The helper normalizes arXiv versions and known DOI/OpenReview URLs; provide aliases during research and check them against prior runs to prevent cross-identifier duplicates. Do not change identity merely because a second URL appeared.
- `lane`: mechanisms / playable-works / cross-domain / failures-work; `topicKey`: a stable lowercase mechanism-or-reader-question key. Similar questions share a key even with different titles/sources. Do not assign arbitrary new keys to evade fatigue.
- `kind`: blog / paper; `stage`: lead / formal. A lead is worth exploring, not eligible for writing. Unknown and unverified discoveries may be saved as leads.
- `discoveryLabel`: recent-news / newly-discovered / date-unknown. All source `publishedAt` fields may be null, but then the label must be date-unknown. Research must check the stated news/discovery window, never infer a date from search ranking.
- `card`: nonempty surprise, unresolvedQuestion, whyExplore, approach, angle. approach may be a conceptual explanation or playing with an existing artifact; an experiment is optional. State cost/requirements only when known. These are questions/proposals, not a place to hide unchecked factual numbers.
- `sources`: nonempty array of objects with url, role (primary/supporting/discovery), inspected (boolean), publishedAt (YYYY-MM-DD or null). Listing a source is not inspecting it.
- `claims`: array of objects with text, kind (qualitative/quantitative), verification (unchecked/primary-inspected/independent-verified), sourceUrls. All factual claims and numbers used in the card belong here. Only inspected supported claims may be presented as confirmed. primary-inspected numbers remain **author-reported**, not independently reproduced; independent-verified needs independent provenance, not merely two URLs. The helper checks links and flags, not scientific truth.
- `unknowns`: string array; make missing evidence explicit, including unchecked claims.
- `sourceSnapshot`: sha256 of the relevant primary-source content/version when inspected (or discovery-source content for an unverified lead), verified (boolean). Use a real content digest, never hash the run timestamp/title to invent updates. A changed digest alone is insufficient to re-recommend: `materialUpdate` must explain a substantive factual change with inspected sourceUrls. No update is needed for first discovery.

Formal candidates additionally require `coverageChecked: true`, `alreadyCovered: false`, `rubricVersion: 2`, verified primary snapshot, inspected primary source, no unchecked claims, scoreRationale and score with integer dimensions 0..5 plus correct total. Blog dimensions: topicRelevance/durability/evidenceQuality/engineeringValue/readerInterest, total >=23, evidence >=3, interest >=4. Paper dimensions: topicRelevance/novelty/evidenceQuality/reproducibility/engineeringValue/readerInterest, total >=28, evidence >=3. No seriesValue bonus. Full formal brief evidence requirements still apply before import; schema validity alone does not prove readiness.

## Suppression and feedback

Save every honest research observation, but report only the helper's presentedIds. Within seven days, the same source cannot be re-presented without a changed fingerprint AND an explained verified material update. Already-covered work is suppressed. Compare semantic aliases manually as well. If the previous three presented cards all use the same topicKey, prefer other questions and allow fewer cards. This is a fatigue signal, not a permanent topic ban or inferred user preference.

Explicit human feedback is a separate immutable `feedback/<eventId>.json`: schemaVersion 1, unique eventId, createdAt UTC, stableId, decision (want-write/want-play/collect/tired/import), origin explicit-user, the actual quote and conversationRef. An import decision also needs target blog-radar/paper-radar. Never invent quotes, silently translate collect into write/import, or infer interest from silence. Repeated event IDs fail instead of overwriting. Latest explicit feedback wins for display suppression; past events remain intact. Feedback may be recorded only while handling that actual user instruction, not by the unattended research run.

Daily research cannot import or publish. A named explicit import decision is necessary but not sufficient: a later interactive operation must recheck evidence, aliases, both language drafts, existing manual changes and Git state, run Radar checks, then merge carefully. Dirty unrelated website paths still block import. No auto-import command is provided. Writing, commit/push and publication are separate authorized actions.

## Failure and concurrency

Use UUID run IDs and one immutable file per run. The helper has no shared mutable ledger, lock file or decision rewrite. Two files may be researched concurrently; do not deliberately start overlapping jobs. Concurrent runs can each preview against the same old history, so presentation dedup is best effort under overlap; report overlap and let the existing single scheduler remain the writer. Exclusive final creation prevents clobbering. Invalid batches, symlink paths or duplicate run IDs fail without replacing history. Report save failures; do not claim persistence merely because a report was printed.
