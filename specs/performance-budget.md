# Performance Budget

Updated: 2026-07-25

## Build artifact budgets

`npm run build` minifies generated CSS and fails when any of these uncompressed artifact limits are exceeded:

| Asset | Limit |
| :--- | ---: |
| Deferred self-hosted font CSS | 4 KB |
| Homepage CSS (`base` + `layout` + `home`) | 86 KB |
| Hub CSS (`base` + `layout` + `preview` + `hub`) | 51 KB |
| Article CSS (`base` + `layout` + `article`) | 55 KB |
| Chinese / English homepage HTML | 48 KB each |
| Chinese / English Blog index HTML | 115 KB / 120 KB |
| Chinese / English Blog index JSON | 82 KB / 90 KB |

The listed values are hard limits. CSS bundles also have a target with 10% reserved headroom: below the target is `PASS`, between the target and hard limit is `WARN`, and only exceeding the hard limit is `FAIL`. This keeps the reported limit truthful while still surfacing budget pressure before CI must block a build.

| CSS bundle | Target (10% reserved) | Hard limit |
| :--- | ---: | ---: |
| Homepage | 77.4 KB | 86 KB |
| Hub | 45.9 KB | 51 KB |
| Article | 49.5 KB | 55 KB |

The limits are defined in `scripts/check-performance-assets.mjs`. Run `npm run analyze:css` to compare readable source sizes with minified production sizes.

## Lighthouse and Core Web Vitals budgets

`npm run test:performance` runs desktop and mobile Lighthouse CI against the homepage, Blog index, representative article and project pages, search, and the 404 page. Every mobile route has a strict 3.0-second LCP ceiling.

| Metric | Limit |
| :--- | ---: |
| Performance score | at least 0.90 |
| First Contentful Paint | at most 1.8 s |
| Largest Contentful Paint | at most 3.0 s on mobile |
| Cumulative Layout Shift | at most 0.10 |
| Total Blocking Time | at most 200 ms |
| Speed Index | at most 3.4 s |
| Stylesheet transfer | at most 90 KB |
| Main document transfer | at most 130 KB |

Lighthouse supplies lab LCP and CLS. TBT is the lab responsiveness proxy; production Interaction to Next Paint must also be monitored with PageSpeed Insights or Search Console and remain at or below 200 ms at the 75th percentile.

Fonts are self-hosted and loaded from a non-render-blocking stylesheet with fallback-first rendering. Analytics waits for the first interaction or five seconds after `load`, keeping it off the initial rendering path. Featured above-the-fold covers are eager-loaded; other images remain lazy.

The pull-request workflow runs the build artifact gate first and Lighthouse after a successful build.

## Responsive cover generation

`npm run generate:covers` creates WebP derivatives beside each local content cover:

| Variant | Dimensions | Intended use |
| :--- | :---: | :--- |
| `-thumb.webp` | 200 × 125 | compact lists |
| `-card.webp` | 480 × 300 | cards and hubs |
| `-hero.webp` | 1200 × 750 | article hero / LCP image |

The generator runs before local development and production builds. Generated derivatives are ignored by Git and recreated from their source images, so content authors only maintain the original cover.
