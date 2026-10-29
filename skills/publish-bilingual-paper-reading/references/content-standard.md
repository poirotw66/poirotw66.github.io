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
topics:
  - "retrieval-rag"
  - "agent-evaluation-observability"
image: "/paperReading/<basename>/title_image.webp"
field: "NLP"
difficulty: "intermediate"
paperType: "empirical" # optional; systems / theoretical / conceptual / mixed also supported
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

- `pubDate`, `updatedDate`, `image`, `field`, `difficulty`, `paperType` when present, and `showToc`
- one to three stable `topics` IDs in the same order
- exact paper `title`, ordered `authors`, `year`, and links; new drafts use the same canonical venue/version/status string; localize descriptive status explanations in prose. Legacy locale-only venue differences are review advisories, not proof of equivalence
- exact series `id`, `part`, and `totalParts`; localize only `series.title`
- aligned `tldr`, `audience`, claims, limitations, source anchors, and callout variants

Use canonical project tag slugs. Never use translated tag slugs merely to make the arrays visually identical.

## Article structure

### Traditional Chinese titles and original paper names

- Put a short, complete original paper name directly in the article `title`, followed by a concise Traditional Chinese topic. For example: `Attention Is All You Need 精讀：Transformer 與自注意力機制`.
- When the complete original name would crowd out the Chinese topic, use the recognizable method name and Chinese subject in `title`, such as `RAG 論文精讀：檢索增強生成的架構與運作原理`. If the paper has no named method, use its specific research subject instead of inventing an acronym.
- Keep the exact, complete source title in `paper.title`. The Chinese article masthead displays it as an original-name subtitle whenever `title` does not already contain it. Do not duplicate this subtitle in frontmatter or the Markdown body. Preserve the existing paper metadata card.
- Judge short versus long by the combined title's readability, not a purported Google character limit. Keep Chinese topic words visible, preserve distinguishing part labels, and move general caveats into the description or body unless essential to an accurate headline.
- Title-only repairs preserve slugs, canonical paper metadata, dates, body claims, and English article titles. Review the new heading against the description and body; do not add claims for search appeal.

Use the compact teaching outline in `article-template.md`: question and changed idea; faithful example and intuition; mechanism/argument; supporting evidence; bounded interpretation and next questions. Merge functions naturally. Do not require a separate ninety-second map, paper story and exit recap on top of the frontmatter TL;DR. Chinese body headings are localized rather than bilingual labels.

Explain the mechanism before loading the reader with tables or incidental benchmark numbers. Preserve a condition beside a number whenever omission would mislead; a useful surprise may legitimately include the key comparison in the opening. Move repeated general caveats and artifact details after the explanation unless they change its meaning.

The article must satisfy the canonical seven-question [Paper Essence Contract](paper-essence-contract.md), including the formal/conceptual scaffold. Use `article-template.md` when drafting or substantially rewriting a pair, and `reader-facing-editing.md` for the publication voice pass.

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

Before handing off a new or repaired pair, run the pair auditor with `--strict --new`. This scoped new-publication gate blocks unconditioned performance claims and missing bilingual quantities. Archive-only `--strict` retains compatibility and reports those numerical anomalies as advisories; it must not replace `--strict --new` for a new or substantially rewritten pair. Both languages must independently include:

- a visible evidence map or equivalent separation of paper evidence, author claims, and Bloss0m judgment;
- type-appropriate support: empirical/systems/mixed work needs measured context and meaningful comparison; theoretical work needs explicit assumptions and reasoning; conceptual/design work needs definitions, relations and grounded examples/evidence;
- at least three locatable source anchors: Figure, Table, section, appendix, equation, theorem or definition as appropriate;
- limitations or unsupported interpretations;
- an artifact and reproducibility section with a concise as-of availability status and the scope of independent reproduction; tool logs and inspection inventories are not required;
- engineering implications, including when not to use the method;
- meaningful diagnostics actually present: empirical failure/cost/ablation/transfer analysis, or theoretical/conceptual premise sensitivity, counterexample or boundary reasoning;
- a primary-sources section.

Also run the comprehension auditor with `--strict`. Both languages must independently explain the problem, intuition, representative example, mechanism/argument, evidence and adoption boundary. Fixed heading wording and a separate recap are unnecessary. These content heuristics are only a proxy; complete the semantic teach-back in `paper-essence-contract.md` and the required reader-facing publication gate in `SKILL.md` before publication. Task-execution commentary that fails that gate is a publication blocker even when automated checks pass. Preserve meaningful sections and source anchors without adding completion-report prose to satisfy a checker.

Missing substantive coverage and bilingual teaching omissions remain blockers. The historical 6,500/9,000 character baselines, 1.1–2.6 length ratio and structural density are anomaly advisories requiring review, not evidence of semantic completeness or automatic failure. Do not pad prose to meet a character count. Quantitative claims still need source-supported denominators, settings and comparison conditions; automatic checks only catch obvious missing context and cannot verify scientific truth. Compare actual claims, examples and uncertainty in both languages during the required semantic pass.

## Images and diagrams

- For every new paper-reading pair, create a 1200 × 750 Evidence Atlas WebP cover using `cover-art.md`. Existing covers are grandfathered and remain unchanged during audit, repair, or localization unless replacement is explicitly requested.
- Do not use Huahua or another mascot on Paper Reading covers. Communicate the paper's evidence structure rather than its title or a generic AI motif.
- Original explanatory diagrams may supplement the original-paper evidence; they do not replace required body figures or count toward the original-figure gate.
- If reusing a paper figure, verify its license, attribute it in the caption, and link the source.
- Give each reused figure a distinct evidentiary purpose. For new or substantially repaired papers with three or more reusable figures, embed at least three material figures in each language body; otherwise include every material reusable figure. If a subgroup or failure-mode figure changes the interpretation of the headline metric, include or summarize it before adding decorative method diagrams.
- Use repository-supported Markdown image syntax without inline styles.
- Do not repeat the cover at the start of the article body.
