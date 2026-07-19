---
name: publish-bilingual-ai-blog
description: Turn a supplied article, webpage, announcement, paper, or pasted source into a publication-ready Bloss0m blog post in Traditional Chinese and English, with verified claims, SEO metadata, bilingual tag parity, internal links, Huahua callouts, and a topic-specific Huahua cover image. Use when the user asks to analyze source content and create, rewrite, translate, or publish a bilingual Bloss0m article and matching mascot artwork.
---

# Publish Bilingual AI Blog

Create an original, evidence-backed bilingual article from a supplied source and produce a matching Huahua cover. Treat the source as research material, not copy to translate.

## Required references

- Read [references/content-standard.md](references/content-standard.md) before drafting or writing files.
- Read [references/cover-art.md](references/cover-art.md) before generating the cover.
- In a Bloss0m checkout, also read the active `AGENTS.md`, `src/content.config.ts`, `specs/taxonomy.md`, and `docs/guideline/content/huahua-callouts.md` when present. Project instructions override this skill.

## Workflow

### 1. Acquire and audit the source

- If given a URL, open the actual page. Do not write from a search snippet.
- Record the publisher, author when available, publication and update dates, document type, central claim, supporting evidence, and important limitations.
- Follow referenced primary material when a claim depends on a paper, official release, specification, benchmark, or repository.
- Verify unstable, surprising, security-sensitive, or quantitative claims with primary sources. Clearly label inference and unresolved uncertainty.
- Paraphrase the source. Never reproduce a full article, lengthy passages, or more quoted text than copyright limits allow.
- Stop and explain the gap if the page is inaccessible or does not contain enough evidence for a responsible article. Never fill gaps with invented facts.

### 2. Choose the editorial angle

- Classify the post as engineering guidance, enterprise case analysis, industry pulse, or a long-form guide.
- Answer three questions before drafting: What changed or was learned? Why does it matter? What should an engineer or enterprise team do differently?
- Prefer a focused problem-and-decision angle over a chronological summary.
- Use calm, precise titles. Put the searchable technical subject first; avoid hype such as “震撼”, “最強”, “顛覆”, or “必讀” unless directly quoted and necessary.

### 3. Plan the bilingual pair

- Discover the next unused numeric prefix and a stable lowercase ASCII slug. Never overwrite an existing post.
- Use one slug, date, category, canonical tag slugs, cover, and information structure for both languages.
- Draft the Traditional Chinese article first. Write for readers in Taiwan using natural Traditional Chinese and retain established technical terms in English where clearer.
- Create the English article as an editorial localization, not a sentence-by-sentence translation. Preserve claims, evidence, links, heading intent, and Huahua callout variants.
- Re-check every number, date, product name, benchmark, and link after localization.

### 4. Write the article

- Follow the frontmatter and article structures in `content-standard.md`.
- Make the opening self-contained: state the subject, the real engineering question, and the article's conclusion or scope.
- Explain architecture and trade-offs before implementation detail. Include limitations, failure modes, and operational implications.
- Add descriptive inline links at the claims they support, then include a compact sources section when useful. Never cite a search-results page.
- Add 2–4 verified internal links to relevant Bloss0m guides, cases, or next reading. Do not invent routes.
- Add 1–2 Huahua callouts. Use “花花的判斷” for trends, “花花的工程提醒” for risks, and “花花的一句話” for a core definition. Match the variants in English.
- End with practical takeaways or a next-reading path, not a generic conclusion.

### 5. Generate the Huahua cover

- Inspect `public/brand/bloom-hero.webp` before image generation and use it as the character reference when present.
- Build a topic-specific prompt using `cover-art.md`; keep the article concept recognizable at card size.
- Use the available image-generation tool. Generate one 16:10 cover with no text, logo, or watermark.
- Save or convert the approved asset to `public/blog/<slug>/title_image.webp` at 1200 × 750 when the tool returns a local artifact. If the tool can only return a conversation image, return it with the exact target path and do not claim it was written to the repository.
- Add the same `image` path to both language frontmatters only after the local asset exists.

### 6. Validate and hand off

- Check that the bilingual filenames pair, metadata agrees, tag slugs align, all external and internal links are valid, callouts are at most three per article, and the cover is not missing.
- In Bloss0m, run `npm run check:content`, `npm run check:tags`, `npm run check:i18n`, and `npm run build`. Fix failures caused by the new post.
- Report the created article paths, source set, cover path or pending image handoff, and validation results.
- Do not commit, push, or publish unless the user explicitly asks.

## Decision rules

- Prefer primary sources for technical facts. Use secondary reporting only for context or independent interpretation.
- Do not turn a press release into endorsement. Separate vendor claims, measured evidence, and Bloss0m judgment.
- Do not create an English page with reduced substance. Both versions must stand alone.
- Do not generate a cover before the editorial angle is stable.
- Do not place readable article titles inside generated images; the site supplies its own overlays.
