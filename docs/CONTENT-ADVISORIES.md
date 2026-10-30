# Content advisory triage

The advisory report compares the existing reading-quality and strict paper-pair validators with a committed baseline. It does not replace either validator, approve articles, or change publication requirements. New advisories are informational; validator errors and strict warnings still fail the report command.

## Commands

```sh
node scripts/content-advisory-report.mjs
node scripts/content-advisory-report.mjs --format=json
node scripts/content-advisory-report.mjs --output=artifacts/content-advisories.json
node scripts/content-advisory-report.mjs --source-ref=HEAD
```

The default source is the working tree, including uncommitted content edits. `--source-ref=HEAD` audits committed content and committed validator code in a temporary export. That export includes empty files for committed public asset paths because these two validators only check cover existence; it does not validate image pixels, figure rights or asset delivery.

Each finding has a portable SHA-256 ID derived from its complete normalized diagnostic. Checkout prefixes are removed and the pair ID's `.md` suffix is normalized. Identical diagnostics shared by both validators become one finding with two validator names. Chinese and English file findings stay separate. A changed measurement, claim or diagnostic receives a new ID, so an earlier exception cannot hide it.

## Review states

- **New:** absent from the baseline, or a previously resolved finding has returned.
- **Existing:** recorded in the baseline and still pending manual review.
- **Resolved:** no longer emitted by the validators. This means the automated finding disappeared, not that a person verified the article's facts.
- **Exception:** a reviewer recorded `status: "exception"`, a nonempty `rationale`, and `reviewedAt` in `YYYY-MM-DD` format for that exact diagnostic.
- **Unknown:** a baseline finding is absent but a validator failed or did not complete. It cannot be considered resolved until all validators succeed. Capture/count-integrity failures abort the report rather than emitting a misleading delta.

The initial baseline contains pending findings from committed `HEAD`; it does not treat them as approved. Review source evidence and the complete bilingual passage before recording an exception. Repair content in a separately scoped change, then inspect the delta. JSON reports retain full messages, validator names, counts and failure diagnostics for CI artifacts.

## Explicit baseline refresh

```sh
node scripts/content-advisory-report.mjs --refresh-baseline
```

Refresh reads committed `HEAD`, excludes uncommitted edits, preserves explicit exceptions for unchanged diagnostics, records absent old entries as resolved and marks current unexcepted findings pending. It refuses to write when either validator fails. Use `--source-ref=<commit>` only when deliberately choosing another committed baseline. Review the baseline diff before committing it; routine CI never refreshes it.

An exception does not suppress strict errors or warnings. Existing `check:reading-quality` and `audit:paper-pair -- --strict --all` commands remain unchanged. Repository-only diagnostics do not establish factual freshness or replace manual reading.

## Numerical-signal scope

Only the exact navigation headings `90 秒掌握論文`, `90 秒地圖`, `Paper in 90 seconds`, `The paper in 90 seconds`, and their paired heading form are masked when comparing experimental quantities. Other headings, including a latency or accuracy claim containing 90, remain audited. Body measurements and repeated results are retained.

Explicit metric associations use the number's sentence/list item and comma/semicolon clause, preserving decimal points and numeric thousands separators. A separate problem statement's word “throughput” cannot relabel a later speedup result. Model associations retain their existing paragraph scope. When all occurrences of a repeated value have explicit metric labels, label multiplicities must agree. When labels are only partial, the checker reports disjoint explicit metrics rather than assuming which repeated number an omitted label belongs to. Unclear associations still require semantic review. Real value/unit/sign differences, explicit metric/model contradictions and missing experimental conditions remain checked.

Rule changes can move old findings to `resolved` without an article edit. Review that diagnostic delta separately from factual repairs; do not automatically refresh the baseline, approve unrelated articles or convert these disappearances into new manual exceptions.
