# Performance Budget

Updated: 2026-10-22

## Build artifact budgets

`npm run build` minifies generated CSS and JavaScript, validates routes, audits delivered images, and checks the following **uncompressed KiB** limits (1024 bytes). The executable source of truth is `scripts/check-performance-assets.mjs`.

| Asset | Hard limit (KiB) |
| :--- | ---: |
| Deferred font CSS | 4 |
| Homepage CSS (`base` + `layout` + `home`) | 86 |
| Hub CSS (`base` + `layout` + `hub`) | 54 |
| Preview Hub CSS (Hub + `preview`) | 57 |
| Blog Hub CSS (Preview Hub + `blog-hub`) | 60 |
| Article CSS (`base` + `layout` + `article`) | 55 |
| Article CSS with code, Mermaid and math enhancements | 60 |
| Homepage HTML, each language | 48 |
| Blog index HTML, each language | 70 |
| Paper index HTML, each language | 105 |
| Blog index JavaScript | 18 |
| Navigation brand mark | 2 |
| Blog manifest / largest data page, Chinese / English | 20 / 22 |
| Largest paper index data page, each language | 40 |
| Largest per-note paper essence, each language | 8 |
| Compact search data, Chinese / English | 132 / 145 |

CSS bundles, Blog JavaScript, per-note essence and compact search reserve 10% headroom: below the target is `PASS`, between target and hard limit is `WARN`, exceeding the hard limit is `FAIL`.

The UI uses `/paper-reading/data/essence/{slug}.json` only when a note is expanded and `/search/data.json` for the complete compact search index. Search encoding preserves fields and order; shared category, tag and date dictionaries remove repetition. Failed requests remain retryable. Paper archive pages retain successful results, report actual loaded counts, and only claim complete results after every page succeeds. HTML archive links remain available without JavaScript.

Legacy aggregate `/paper-reading/data/essence.json` and `/search/index.json` endpoints remain available for compatibility. Their former 132 / 145 KiB limits are **warning-only baselines**, not active UI payload gates. This distinction prevents aggregate growth from negating per-note loading while retaining visibility. Compact search and individual essence budgets continue to fail builds on overflow.

The build prints gzip estimates for compact search. These are local compression estimates, not observed production wire sizes; confirm response encoding and transfer size after deployment. Use `npm run test:discovery` and `npm run test:discovery:browser` for failure, concurrency and retry coverage.

## Image delivery

`npm run check:image-budgets` retains the original PNG/JPEG source check at 500 KiB. `npm run check:delivered-images` scans built HTML `img` and `source` references, including responsive candidates, rather than assuming every public original is delivered.

| Delivered format | Limit |
| :--- | ---: |
| PNG, JPEG, WebP, AVIF | 500 KiB uncompressed |
| GIF animation | 1024 KiB uncompressed |
| SVG | 256 KiB gzip estimate |

Raster limits constrain download and decoding work. SVG uses a compressed budget because verbose vector markup compresses differently; it stays vector rather than being rasterized to satisfy the check. Missing local image files fail the build. Missing intrinsic dimensions are reported for follow-up and do not prove measured layout shift.

`npm run generate:body-images` prepares ignored `-body.webp` derivatives before dev/build. Large static Markdown illustrations and sticker previews use a maximum 2400px width, quality 82 and smaller widths when needed to reach 500 KiB. Originals remain intact; Markdown previews link to their original. Animated sources are preserved. Local Markdown dimensions are derived with Sharp; verified remote dimensions live in `src/data/remoteImageDimensions.json`. Both receive lazy loading and async decoding. Raw HTML illustrations need explicit dimensions.

Run `npm run refresh:remote-image-dimensions` explicitly when remote illustrations change. It reads bounded image headers from allowlisted hosts, follows checked redirects, reports failures and exits nonzero for incomplete coverage. Builds never fetch remote image metadata. The manifest hash invalidates cached Markdown when metadata changes; a failed remote URL must not receive invented dimensions.

## Lighthouse budgets

`npm run test:performance` runs desktop and mobile Lighthouse CI. The regular matrix includes both paper library languages and the older PAST-Bench article with remote illustrations, alongside the existing home, Blog, article, project, search and 404 samples. PR smoke coverage is defined separately in `lighthouserc.pr.cjs`.

| Metric | Desktop | Mobile |
| :--- | ---: | ---: |
| Performance score | ≥ 0.90 | ≥ 0.75 |
| Accessibility score | 1.00 | 1.00 |
| First Contentful Paint | ≤ 1.8 s | ≤ 3.0 s |
| Largest Contentful Paint | ≤ 2.5 s | ≤ 3.0 s |
| Cumulative Layout Shift | ≤ 0.10 | ≤ 0.10 |
| Total Blocking Time | ≤ 200 ms | ≤ 200 ms |
| Speed Index | ≤ 3.4 s | ≤ 4.0 s |

Mobile also requires best practices 1.00, SEO 1.00 for indexable samples, and no console errors. Route-specific total transfer caps are in `lighthouserc.mobile.cjs`. Search and 404 remain intentionally noindex. Desktop uses two runs and median metric assertions; mobile uses one run per route. These are lab samples, not real visitor p75 or proof that every article passes.

Production INP and real LCP/CLS require actual Search Console or analytics data. Repository checks cannot establish traffic, conversions or field CWV.

## Responsive covers

`npm run generate:covers` creates ignored WebP derivatives beside local covers before dev/build. Cards and Lab lists use available derivatives rather than full originals.

| Variant | Dimensions | Use |
| :--- | :---: | :--- |
| `-thumb.webp` | 200 × 125 | compact lists |
| `-card.webp` | 480 × 300 | cards and hubs |
| `-hero.webp` | 1200 × 750 | article hero |

Fonts remain self-hosted and fallback-first. Analytics waits for interaction or five seconds after load. Above-the-fold covers are eager-loaded; other illustrations remain lazy.
