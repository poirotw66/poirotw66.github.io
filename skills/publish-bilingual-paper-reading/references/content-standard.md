# Bloss0m paper-reading standard

## Frontmatter

Use the same basename and shared structural metadata in both languages.

```yaml
---
title: "Localized title"
description: "Localized standalone description"
pubDate: YYYY-MM-DD
updatedDate: YYYY-MM-DD
tldr:
  - "One to four localized takeaways"
audience:
  - "One to four localized reader groups"
tags: ["canonical", "tag", "slugs"]
image: "/paperReading/<basename>/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
paper:
  title: "Exact paper title"
  authors:
    - "Author One"
  year: 2026
  venue: "arXiv 2607.00000 v1"
  links:
    pdf: "https://arxiv.org/pdf/2607.00000v1"
    arxiv: "https://arxiv.org/abs/2607.00000"
    code: "https://github.com/owner/repository"
    project: "https://example.org/project"
series:
  id: "stable-series-id"
  title: "Localized series title"
  part: 1
  totalParts: 1
---
```

Required pair parity:

- `pubDate`, `updatedDate`, `image`, `field`, `difficulty`, and `showToc`
- exact paper `title`, ordered `authors`, `year`, `venue`, and links
- exact series `id`, `part`, and `totalParts`; localize only `series.title`
- aligned `tldr`, `audience`, claims, limitations, source anchors, and callout variants

Use canonical project tag slugs. Never use translated tag slugs merely to make the arrays visually identical.

## Article structure

Adapt headings naturally, but cover this evidence sequence:

1. Reader question and concise verdict
2. Paper identity, status, and problem definition
3. Method skeleton with numbered or arrow-based steps
4. Architecture or mechanism explanation
5. Experimental setup: datasets, baselines, metrics, and compute when material
6. Results tied to at least three locatable Figure/Table/section anchors
7. Ablations and what actually drives the result
8. Limitations, threats to validity, and unsupported interpretations
9. Engineering implications and when not to use the method
10. Reproducibility notes and next reading
11. Primary sources

Use an ordinary Markdown blockquote with a repository-supported bold Huahua label, copied exactly from a validated existing post. For example, use `> **花花的工程提醒**` in Traditional Chinese and `> **Huahua's engineering note**` in English. Never use Obsidian-style `> [!HUaHUA_*]` syntax. Use no more than three callouts, match their intent across languages, and keep ordinary quotations as ordinary blockquotes.

## Evidence rules

- Cite the paper close to the claim with a descriptive link and name the relevant `Figure N`, `Table N`, section, or appendix.
- Label preprint, workshop, under-review, and accepted status precisely.
- Report author-stated numbers exactly and preserve denominators, evaluation setting, model version, and metric direction.
- Treat comparisons to closed systems or different tool budgets as qualified evidence.
- Explain negative results and failure cases, not only the best row in a table.
- Cover diagnostic dimensions that materially qualify the headline result, such as platform, subgroup, failure type, calibration, cost, and transfer. Prefer one compact diagnostic figure or table over several redundant overview visuals.
- Verify direct artifact endpoints separately from author release claims. Classify code, data, checkpoints, and demos as usable, empty, gated, missing, or announced, and add an as-of date whenever availability is incomplete.
- Make reproduction instructions conditional when required files are not actually accessible. Do not use “released,” “open,” or “reproducible” as synonyms.
- Separate these voices explicitly when ambiguity is possible: Paper, Evidence, and Bloss0m judgment.

## Images and diagrams

- Use a topic-specific 16:10 WebP cover without text, logo, or watermark.
- Prefer original explanatory diagrams over copied paper figures.
- If reusing a paper figure, verify its license, attribute it in the caption, and link the source.
- Give each reused figure a distinct evidentiary purpose. If a subgroup or failure-mode figure changes the interpretation of the headline metric, include or summarize it before adding decorative method diagrams.
- Use repository-supported Markdown image syntax without inline styles.
- Do not repeat the cover at the start of the article body.
