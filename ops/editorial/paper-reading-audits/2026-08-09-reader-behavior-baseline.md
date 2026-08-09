# Paper Reading reader-behavior baseline

Date: 2026-08-09  
Observation window: 2–4 weeks after release  
Decision owner: human editorial review

## Why this exists

The Paper Reading hub now offers three bounded reading paths, expandable 90-second summaries, explicit difficulty labels, and a next-read action. Keep the article table of contents, current reading-progress treatment, and evidence navigation unchanged during the observation window. This isolates whether readers first need better orientation, rather than more controls inside every article.

## GA4 events to review

| Question | Event or signal | Useful breakdown |
| --- | --- | --- |
| Do readers use a guided starting point? | `paper_reading_path_click` | `path_id`, language, device |
| Do readers inspect the 90-second summary? | `paper_essence_open` | `paper_slug`, language, device |
| Does the summary lead to the full article? | `paper_reading_next_click` where `next_kind=essence` | `paper_slug`, landing article |
| Do readers continue after a deep read? | `paper_reading_next_click` where `next_kind=path` | `path_id`, current article |
| Do readers reach substantial depth? | existing `article_read_75` | Paper Reading routes, language, device |

Use event counts and rates together. Low volume is inconclusive; do not turn a few sessions into a product decision.

## Decision rules after the observation window

- Consider a collapsed table of contents only if mobile readers enter articles but show weak depth while desktop depth remains materially healthier.
- Consider a more prominent reading-progress control only if readers start and continue paths but frequently fail to reach `article_read_75` across both languages.
- Consider evidence navigation only if deep-reading completion is healthy but readers rarely continue, or qualitative feedback specifically reports difficulty locating figures, tables, or claim boundaries.
- Keep the current interface if path starts, 90-second summary use, and article depth improve without introducing extra controls.

Record the GA4 date range, sample size, device and language split, observed rates, and the chosen decision in a follow-up audit. Do not change all three features at once.
