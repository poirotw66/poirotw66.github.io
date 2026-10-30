# CI validation scope and cost

## Observed cost

The completed [54a19fc deployment run](https://github.com/poirotw66/poirotw66.github.io/actions/runs/40924170018) spent 8 seconds on unit tests, 130 seconds building, 47 seconds on discovery/analytics/mobile browser checks, and 196 seconds on Lighthouse. The following [74b4c0c run](https://github.com/poirotw66/poirotw66.github.io/actions/runs/40925754480) took 14 seconds for units and 210 seconds building when inspected. These are individual observations, not performance guarantees.

A sequential local comparison before adding the release verifier took 24.47 seconds for the previous 33 npm commands and 6.51 seconds for the consolidated entry. This was one local sample on the same machine; it does not predict GitHub runner timing. The consolidated run also included the previously omitted topic, internal-link and pagination fixtures.

## Decisions

- Keep negative and edge-case fixtures. A build against valid content cannot prove a broken validator still rejects missing links, unknown topics or invalid page sizes.
- Run fixture units through `npm run test:unit`. `scripts/test-ci-unit.mjs` lists files explicitly and caps concurrency at two, retaining Node's per-file isolation without 33 npm wrappers. Individual feature commands remain available locally.
- Run the live-corpus reading-path completeness check once, inside `check:site` during build. It is deliberately absent from the unit runner.
- Include the existing topic, internal-link and pagination fixtures in the consolidated entry. Remove the pagination case that merely fixes the page-size constant at 24; retain actual partitioning, empty input and invalid-size behavior.
- Include four release readback cases because successful HTTP alone cannot distinguish stale/mixed deployments, malformed payloads and missing assets.
- Keep build/link/image/content gates and browser behavior checks. Do not infer that different layers are redundant merely because they read the same content.
- Keep the three-sample Lighthouse policy and all route budgets. The content-aware trigger below skips only bounded existing prose edits; it does not shorten an executed audit.

The shared validation job has a 20-minute timeout. The deploy/readback job has a 15-minute timeout, allowing the Pages deployment timeout and bounded propagation retries. A readback failure marks the workflow failed after publication; it does not automatically roll back an already published site.

## Maintaining coverage

Add meaningful fixture files to the explicit unit list; avoid broad globbing that could run Chrome/dist-dependent tests before build. Browser suites still run after build. The release manifest is produced only after final optimization and validation, before uploading the Pages artifact. Production readback then checks the expected commit and a bounded output sample; see [deployment verification](./DEPLOYMENT-VERIFICATION.md).

## Content-aware Lighthouse trigger

`Classify changed paths` uses `scripts/classify-site-changes.mjs` against the supplied Git commits, ignoring uncommitted files. Existing Markdown under the three content collections can skip Lighthouse only when the complete frontmatter is unchanged, the line/block skeleton is unchanged, and only plain prose lines change. A line containing inline formatting is protected in full: even editing its ordinary words runs Lighthouse. Absolute body-size differences exceeding 512 bytes or 10% of the previous body size, whichever is larger, also run the audit.

Metadata changes, including `updatedDate`, still run Lighthouse. So do new/deleted/renamed files, headings, tables, code/math changes, images, link destinations, runtime source, assets and unknown paths. Raw HTML, alternate math delimiters and setext-style headings deliberately retain the audit rather than guessing their effects. Existing fenced code/math and Markdown links may remain in a prose-edited article only when those protected lines stay identical. Documentation and editorial records do not require the optional performance audit.

Missing or zero refs, unavailable Git objects and failed comparisons enable both optional performance and homepage checks. Homepage source changes retain their existing render-matrix trigger. Every change still runs the consolidated units, full build/content/link/image budgets, browser recovery, search/analytics/mobile checks and deployment integrity gates; the weekly desktop/mobile Lighthouse audit is unchanged. A prose-only skip is a cost policy, not evidence that a changed page received a new Lighthouse measurement.

## Image derivative cache

Cover variants and oversized body-image derivatives share `.cache/image-derivatives/`, which is ignored by Git and never copied to `dist/`. Each replaceable slot corresponds to one public output path. Its validation key includes the original image bytes, complete transform recipe, generator/cache implementation hashes, Node version, platform/architecture and Sharp/libvips versions. Replacing a source or changing encoding settings therefore invalidates the entry even when modification times are unchanged. Updating checkout timestamps alone does not force encoding.

The [official cache action](https://github.com/actions/cache) restores this directory using an OS/architecture prefix and a commit-specific save key. A restore is only a candidate cache: every entry must match its content/recipe key, payload checksum and WebP metadata before use. Missing, stale or damaged entries regenerate from the original. Valid entries also repair missing or damaged public derivatives; byte-identical output files are left untouched. Atomic writes keep partial outputs from becoming valid entries. Cache storage errors warn and fall back to generated outputs; source or transform failures still fail the build. Originals, image dimensions, paths, encoding settings and all delivered-image/content/build gates remain in place.

The initial run is a cold build. Later CI timing depends on cache availability, runner load and image changes; local warm-cache measurements do not establish a GitHub Actions speedup. The targeted cache tests use temporary directories and cover fresh-checkout restoration, source/recipe/tool changes, damaged entries/outputs and unavailable storage.

A single local full-build comparison on 2026-10-30 took 88.53 seconds cold (804 cover variants encoded) and 24.75 seconds warm (zero cover encodes; 804 restored/current). Both full builds passed, and all 2,991 delivered files had identical hashes. These are sequential observations on one machine, not repeated trials or remote CI measurements. The consolidated suite passed 245 tests after adding two cache groups and four numerical-signal groups; the existing body-image group now also checks settings and source invalidation.
