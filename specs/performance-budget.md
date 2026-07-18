# Performance Budget

Updated: 2026-07-18

## Build artifact budgets

`npm run build` minifies generated CSS and fails when any of these uncompressed artifact limits are exceeded:

| Asset | Limit |
| :--- | ---: |
| Homepage CSS (`base` + `layout` + `home`) | 86 KB |
| Hub CSS (`base` + `layout` + `hub`) | 51 KB |
| Article CSS (`base` + `layout` + `article`) | 55 KB |
| Chinese / English homepage HTML | 48 KB each |
| Chinese / English Blog index HTML | 115 KB / 120 KB |
| Chinese / English Blog index JSON | 80 KB / 90 KB |

The limits are defined in `scripts/check-performance-assets.mjs`. Run `npm run analyze:css` to compare readable source sizes with minified production sizes.

## Lighthouse and Core Web Vitals budgets

`npm run test:performance` runs Lighthouse CI twice against the homepage and Chinese Blog index. The median run must meet:

| Metric | Limit |
| :--- | ---: |
| Performance score | at least 0.90 |
| First Contentful Paint | at most 1.8 s |
| Largest Contentful Paint | at most 2.5 s |
| Cumulative Layout Shift | at most 0.10 |
| Total Blocking Time | at most 200 ms |
| Speed Index | at most 3.4 s |
| Stylesheet transfer | at most 90 KB |
| Main document transfer | at most 130 KB |

Lighthouse supplies lab LCP and CLS. TBT is the lab responsiveness proxy; production Interaction to Next Paint must also be monitored with PageSpeed Insights or Search Console and remain at or below 200 ms at the 75th percentile.

The pull-request workflow runs the build artifact gate first and Lighthouse after a successful build.
