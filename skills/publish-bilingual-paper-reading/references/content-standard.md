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

1. Ninety-second map: problem, core insight, strongest evidence, and main boundary
2. Paper identity, status, problem definition, and the prior approach's limitation
3. Core intuition before implementation detail or notation
4. One faithful end-to-end worked example with a likely failure point
5. Method skeleton and architecture or mechanism explanation
6. Experimental setup: datasets, baselines, metrics, and compute when material
7. Results tied to at least three locatable Figure/Table/section anchors and interpreted as question, controls, observation, explanation, and boundary
8. Ablations and what actually drives the result
9. Limitations, threats to validity, and unsupported interpretations
10. Engineering implications and when not to use the method
11. Artifact status, reproducibility notes, and next reading
12. Three durable memory points and primary sources

The article must satisfy the six-question Paper Essence Contract in `docs/guideline/content/content-reading-quality.md`. Use `article-template.md` when drafting or substantially rewriting a pair.

Use an ordinary Markdown blockquote with a repository-supported bold Huahua label, copied exactly from a validated existing post. For example, use `> **花花的工程提醒**` in Traditional Chinese and `> **Huahua's engineering note**` in English. Never use Obsidian-style `> [!HUaHUA_*]` syntax. Use no more than three callouts, match their intent across languages, and keep ordinary quotations as ordinary blockquotes.

For inline labels followed by CJK prose, keep punctuation outside the strong span: use `**問題**：說明` and `「**核心洞見**」`, not `**問題：**說明` or `**「核心洞見」**`. CommonMark may otherwise leave the `**` visible in rendered prose. Run the repository emphasis validator before handoff.

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

## Enforced quality gate

Before handing off a new or repaired pair, run the pair auditor with `--strict`. Both languages must independently include:

- a visible evidence map or equivalent separation of paper evidence, author claims, and Bloss0m judgment;
- experimental context covering at least two of datasets, baselines, metrics, and compute;
- at least three locatable Figure, Table, section, or appendix anchors;
- limitations or unsupported interpretations;
- an artifact and reproducibility section with an as-of availability status;
- engineering implications, including when not to use the method;
- an ablation, failure-mode, cost, calibration, subgroup, or transfer analysis;
- a primary-sources section.

Also run the comprehension auditor with `--strict`. Both languages must independently provide a ninety-second map, explicit core intuition, an end-to-end worked example, result interpretation, and an exit recap. These structural checks are only a proxy; complete the semantic teach-back described in the project guideline before publication.

The repository-wide validator reports legacy depth gaps without blocking the whole site. The strict pair audit treats those coverage warnings as publication blockers. Body length and cross-language density remain advisories: use 6,500 Traditional-Chinese characters and 9,000 English characters as review heuristics, not quotas. Resolve material bilingual differences in coverage, evidence anchors, headings, sources, and information density before publication.

## Images and diagrams

- For every new paper-reading pair, create a 1200 × 750 Evidence Atlas WebP cover using `cover-art.md`. Existing covers are grandfathered and remain unchanged during audit, repair, or localization unless replacement is explicitly requested.
- Do not use Huahua or another mascot on Paper Reading covers. Communicate the paper's evidence structure rather than its title or a generic AI motif.
- Prefer original explanatory diagrams over copied paper figures.
- If reusing a paper figure, verify its license, attribute it in the caption, and link the source.
- Give each reused figure a distinct evidentiary purpose. If a subgroup or failure-mode figure changes the interpretation of the headline metric, include or summarize it before adding decorative method diagrams.
- Use repository-supported Markdown image syntax without inline styles.
- Do not repeat the cover at the start of the article body.
