---
name: publish-bilingual-ai-blog
description: Create, audit, repair, normalize, rewrite, localize, or publish Bloss0m AI blog posts as a publication-ready Traditional Chinese and English pair. Use for supplied sources, new drafts, legacy or formatting repairs, bilingual parity, source verification, SEO structure, topic-cluster placement, internal links, Huahua callouts, rendering stability, validation, or an optional topic-specific cover.
---

# Publish Bilingual AI Blog

Create or repair an original, evidence-backed bilingual article pair. Treat sources as research material, not copy to translate. Preserve sound existing content when the request is limited to formatting or metadata.

## Required references

- Read [references/content-standard.md](references/content-standard.md) before drafting or writing files.
- Read [references/cover-art.md](references/cover-art.md) only when creating or replacing a cover.
- In a Bloss0m checkout, also read the active `AGENTS.md`, `src/content.config.ts`, `specs/taxonomy.md`, and `docs/guideline/content/huahua-callouts.md` when present. Project instructions override this skill.

## Workflow

### 1. Select the task mode and scope

- **Create:** produce a new bilingual article pair from supplied sources.
- **Repair:** normalize metadata and article structure without silently changing factual claims.
- **Rewrite:** improve the editorial angle or technical substance; re-verify every materially changed claim.
- **Localize:** create or repair one language from its paired article while preserving information parity.
- **Audit:** report actionable gaps; do not edit unless the user also requests changes.
- Inspect `git status`, existing filenames, and both language files before editing. Preserve unrelated local work.
- In a Bloss0m checkout, run `npm run check:blog-format` before a corpus-wide repair so the scope is measurable.
- Resolve the exact requested post IDs from the filesystem. Never assume that a numeric sequence exists; report missing IDs explicitly.
- Keep changes proportional to the request. Formatting work does not authorize new claims, invented sources, or replacement artwork.

### 2. Acquire and audit sources

- If given a URL, open the actual page. Do not write from a search snippet.
- Record the publisher, author when available, publication and update dates, document type, central claim, supporting evidence, and important limitations.
- Follow referenced primary material when a claim depends on a paper, official release, specification, benchmark, or repository.
- Verify unstable, surprising, security-sensitive, or quantitative claims with primary sources. Clearly label inference and unresolved uncertainty.
- Paraphrase the source. Never reproduce a full article, lengthy passages, or more quoted text than copyright limits allow.
- Stop and explain the gap if the page is inaccessible or does not contain enough evidence for a responsible article. Never fill gaps with invented facts.
- For formatting-only repairs, retain existing claims and links unless clearly broken. Add a verification caveat instead of fabricating a missing citation.

### 3. Choose the editorial angle

- Classify the post as engineering guidance, enterprise case analysis, industry pulse, or a long-form guide.
- Answer three questions before drafting: What changed or was learned? Why does it matter? What should an engineer or enterprise team do differently?
- Prefer a focused problem-and-decision angle over a chronological summary.
- Use calm, precise titles. Put the searchable technical subject first; avoid hype such as “震撼”, “最強”, “顛覆”, or “必讀” unless directly quoted and necessary.

### 4. Plan the bilingual pair

- For new posts, discover the next unused numeric prefix and a stable lowercase ASCII slug. Never overwrite an existing post.
- For repairs, keep the basename and public route stable unless the user explicitly requests a migration.
- Use one slug, date, category, canonical tag slugs, cover, and information structure for both languages.
- Assign a `cluster`, `clusterRole`, and `clusterOrder` when the article belongs to an established topic path. Do not force unrelated posts into a cluster.
- Draft the Traditional Chinese article first. Write for readers in Taiwan using natural Traditional Chinese and retain established technical terms in English where clearer.
- Create the English article as an editorial localization, not a sentence-by-sentence translation. Preserve claims, evidence, links, heading intent, and Huahua callout variants.
- Re-check every number, date, product name, benchmark, and link after localization.
- Use `/blog/.../` for Traditional Chinese internal links and `/en/blog/.../` for English internal links unless current routing proves otherwise.

### 5. Write or repair the article

- Follow the frontmatter and article structures in `content-standard.md`.
- Require `tldr` and `audience` for both languages. Keep each list concise and aligned in meaning.
- Make the opening self-contained: state the subject, the real engineering question, and the article's conclusion or scope.
- Explain architecture and trade-offs before implementation detail. Include limitations, failure modes, and operational implications.
- Add descriptive inline links at the claims they support, then include a compact sources section when useful. Never cite a search-results page.
- Add 2–4 verified internal links to relevant Bloss0m guides, cases, or next reading. Do not invent routes.
- Add 1–2 Huahua callouts. Use “花花的判斷” for trends, “花花的工程提醒” for risks, and “花花的一句話” for a core definition. Match the variants in English.
- End with practical takeaways or a next-reading path, not a generic conclusion.
- Use only the exact Huahua labels and Markdown structure in `content-standard.md`. Keep ordinary quotations as ordinary blockquotes; never imitate a callout with arbitrary bold text.
- Avoid decorative horizontal rules, emoji headings, raw Obsidian callouts, press-release superlatives, and duplicate Huahua summaries.
- Use local Markdown image syntax for body images. Do not repeat the cover at the start of the body, write raw `<img>` elements, or add inline image styles.
- Keep raw HTML limited to repository-supported embeds such as `data-pdf-viewer` and `data-youtube-facade`.
- Change `updatedDate` when technical substance or reader guidance changes; a purely mechanical whitespace fix does not require a new date.

### Format-only corpus repair

- Preserve claims, headings, links to sources, filenames, and publication dates.
- In this repository, use `npm run normalize:blog-format` only when the user authorized a corpus-wide normalization. Review its diff before continuing.
- Treat formatting as a deterministic migration: normalize callout labels, remove decorative rules, localize English article links, and replace styled raw images with Markdown.
- Do not use the normalizer as a substitute for editorial review or source verification.

### 6. Generate the Huahua cover when requested or missing

- Inspect `public/brand/bloom-hero.webp` before image generation and use it as the character reference when present.
- Build a topic-specific prompt using `cover-art.md`; keep the article concept recognizable at card size.
- Use the available image-generation tool. Generate one 16:10 cover with no text, logo, or watermark.
- Save or convert the approved asset to `public/blog/<slug>/title_image.webp` at 1200 × 750 when the tool returns a local artifact. If the tool can only return a conversation image, return it with the exact target path and do not claim it was written to the repository.
- Add the same `image` path to both language frontmatters only after the local asset exists.

### 7. Validate and hand off

- For new or substantially rewritten posts, run `node skills/publish-bilingual-ai-blog/scripts/audit-blog-pair.mjs --mode=new <post-id-or-basename>...`.
- For mechanical legacy repairs, use `--mode=legacy`; for a read-only corpus report, use `--mode=audit` with no post ids. Never weaken new-post validation merely to silence legacy debt.
- Run `npm run check:blog-format`. It is the rendering-stability gate for horizontal rules, callout syntax, styled raw images, and localized English article links.
- Check that the bilingual filenames pair, metadata agrees, tag slugs align, all external and internal links are valid, callouts are at most three per article, and referenced covers exist.
- In Bloss0m, run `npm run check:content`, `npm run check:blog-format`, `npm run check:tags`, `npm run check:i18n`, and `npm run build`. Fix failures caused by the new post.
- Report the created or modified article paths, missing requested IDs, source set, cover status, and validation results.
- Do not commit, push, or publish unless the user explicitly asks.

## Decision rules

- Prefer primary sources for technical facts. Use secondary reporting only for context or independent interpretation.
- Do not turn a press release into endorsement. Separate vendor claims, measured evidence, and Bloss0m judgment.
- Do not create an English page with reduced substance. Both versions must stand alone.
- Do not generate a cover before the editorial angle is stable.
- Do not place readable article titles inside generated images; the site supplies its own overlays.
- Do not convert a formatting request into an unrequested factual rewrite.
