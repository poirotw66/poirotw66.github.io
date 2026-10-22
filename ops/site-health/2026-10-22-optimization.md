# Website health optimization — 2026-10-22

Source: the local `website-health-audit/report.md` dated 2026-10-22. Status: implementation validated locally; scoped commit and push authorized in a follow-up. Deployment acceptance remains separate. Existing Radar edits and untracked editorial drafts were preserved.

## Completed engineering work

- [x] Paper archive: failed HTTP responses and malformed pages remain failures; successful pages are retained, ordered and deduplicated. Counts reflect actual loaded notes. Partial results and retries remain visible until every page succeeds. Rapid filtering shares in-flight requests and does not repeatedly retry failed pages on every keystroke.
- [x] Paper essence: expand a note to request its own JSON. Failed summary requests can be retried by closing and reopening the disclosure.
- [x] Search: category, tag and date dictionaries reduce repeated data while preserving all reader-visible fields and ordering. Failed requests remain retryable.
- [x] Capacity gates: 10% warning headroom for active search and per-note essence. Former aggregate endpoints remain compatible, with warning-only size baselines; active endpoints retain hard limits.
- [x] Images: scan delivered HTML references, responsive candidates and missing files across WebP/AVIF/PNG/JPEG/SVG/GIF. Prepare bounded body/sticker previews; retain originals and link large Markdown illustrations to the originals. Lab and project cards use cover derivatives.
- [x] Dimensions: cache 54 verified remote image sizes, add lazy loading/async decoding, and size the remaining raw HTML/sticker illustrations. The old Clubhouse Games `.png` returned 404; the repository contains `title-image.jpg`, now verified and used in both languages.
- [x] Reader guidance: distinguish total/loaded/matching counts, correct the topic section direction, provide three linked starter notes and estimated reading time per path, and label remaining notes optional. Starter links and estimates remain visible on mobile.
- [x] Homepage: describe the old roadmap item as a long-term research direction and label its recorded date. No fabricated freshness date.
- [x] Review inventory: cover seven additional workspace pairs: five tracked pairs bring the committed inventory to 263 pairs / 526 language files, with two untracked draft pairs recorded separately (265 pairs / 530 files locally). Untracked drafts have no committed source links; no manual completion checkboxes were invented.
- [x] Archive audit: include repository/paper metadata sources and optional built `<main>` article links; distinguish inbound article links from navigation/hub entrances. Recognize maintained cluster membership. Synchronize the changed content-refresh skill with its installed copy.
- [x] Performance maintenance: update the budget specification and regular Lighthouse matrix with bilingual paper hubs and PAST-Bench. The new desktop sample exposed undersized TOC disclosure targets; their common target height is now at least 44px.

## Measured payloads

These baseline measurements include the original local editorial drafts. The scoped delivery validation below excludes those drafts.

Uncompressed KiB (1024 bytes). The old aggregate endpoints still exist; the UI requests the new endpoints.

| Payload | Previous UI request | New UI request |
| --- | ---: | ---: |
| Chinese search index | 127.7 | 92.8 (27.3% smaller) |
| English search index | 140.3 | 105.1 (25.1% smaller) |
| Chinese essence | 129.8 for all notes | largest individual note 2.1 |
| English essence | 142.7 for all notes | largest individual note 2.2 |
| A2E system figure | 1785.7 | 178.8 preview |
| XYEval figure 2 | 656.2 | 426.6 preview |

Current search capacity headroom: 29.7% Chinese and 27.5% English. Largest per-note essence headroom: 74.0% / 72.3% against the 8 KiB hard limit. Compressed search bodies are 41,482 / 40,574 bytes using gzip; reduction in compressed bytes is approximately 4%, rather than the uncompressed 25–27%.

The browser recovery harness serves real gzip responses and opens isolated browser contexts for cold searches. Its recorded local cold search samples were 42ms / 57ms, with 41,782 / 40,874 transferred bytes including the browser's header estimate. These are single localhost samples, including typing, not a production latency benchmark. Deployment response encoding and visitor latency still need read-back.

## Verification

- `npm run build`: passed, including type/content/paired publication checks, 996 HTML route/anchor checks and active payload/image budgets. Astro check: 0 errors and 0 warnings; existing hints remain.
- Delivered image scan: 1,047 local referenced assets; 0 over budget, 0 missing files, 0 image occurrences without width/height. SVG uses a gzip estimate budget; no claim that every original is under 500 KiB.
- 32 relevant unit/regression tests: passed, including 404, 500, disconnect, malformed data, duplicate/truncated pages, request concurrency, codec parity, image derivatives, graph/source counting, archive navigation, homepage and TOC behavior.
- `npm run test:mobile-layout`: passed at 390px in both languages.
- `npm run test:discovery:browser`: passed in both languages, including partial-page counts, successful-page retention, explicit retry, complete empty results, summary retry, search retry and cold compressed search requests.
- Lighthouse: the initial six-route desktop matrix found PAST-Bench accessibility 97 due to TOC target size. After repair, affected desktop routes passed; the full nine-route mobile matrix passed. Both paper hubs were rechecked after final module formatting. Unchanged routes reuse their preceding passing samples. Raw reports and logs are retained beside the original local audit.
- Checklist validation: all 526 tracked source links exist and occur once; four untracked draft paths are recorded separately; manual completion markers remain unchanged.
- `git diff --check`: passed. No dependency changes.

## Explicit follow-up

- [ ] Manually reread repaired articles and record per-language acceptance before marking checklist entries complete.
- [ ] Use actual Search Console / GA4 exports to rank traffic, conversion and reading-path work; repository candidates are not measured visitor defects.
- [ ] After a separately authorized deployment, verify production compression, retry behavior and real device/field measurements.

Existing workspace exceptions remain visible: `test:paper-paths` fails because the original untracked Paper 100 draft has no assigned path. The same unchanged test passes against the 102 tracked filenames. `check:skills-sync` still reports two pre-existing installed/repository differences in the unrelated paper-reading skill; this task did not overwrite them. The content-refresh skill changed here is synchronized.

The calibrated built archive audit covers all 530 language files with no missing rendered pages or language counterparts. It reports 58 low-outgoing-link candidates, 38 pages without incoming article links (all still discoverable from navigation/hubs), two source-link candidates and 38 cluster-metadata candidates. These are review signals, not authorization to delete, redirect or reclassify content.

## Scoped delivery verification

The follow-up commit includes 49 optimization files and excludes the pre-existing Radar ledgers, briefs, Blog 144 and Paper 100 drafts/assets. The committed review checklist links only to 263 tracked pairs / 526 language files; the two local draft pairs remain a separate inventory note.

An isolated archive of the staged code and content passed all 29 PR unit-test command groups, `npm run build`, `npm run test:mobile-layout`, `npm run test:discovery:browser` and `npm run check:editorial`. The tracked-tree paper-path test passes. This validation built 988 HTML files and checked 1,039 referenced local images with no oversized assets, missing files or missing dimensions. Compact search is 92.0 / 104.2 KiB (Chinese / English), with gzip bodies of 41,162 / 40,258 bytes. These are the deliverable-tree figures; earlier numbers remain the original full-workspace baseline.
