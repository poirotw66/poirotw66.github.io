# Bloss0m project knowledge

Personal Astro 7 static site (GitHub Pages). Primary content language: Traditional Chinese.

## Stack and layout

- Framework: Astro 7, static output, TypeScript minimal
- Content collections: `src/content/blog`, `src/content/paperReading`, `src/content/projects`
- Assets in `public/`; PDFs via Git LFS
- Design system: `docs/guideline/ui/ui-guideline.md` (warm default theme; dark alt)
- Fonts: Archivo (headings), Space Grotesk (body), JetBrains Mono (code)

## Quality gates before claiming done

Run from repo root:

1. `npm run check:tags`
2. `npm run check:content`
3. `npm run check:reading-quality`
4. `npm run check:i18n`
5. `npm run check:english-purity`
6. Prefer `npm run build` as the primary gate

Unit checks: `npm run test:tags`, `npm run test:reading-quality`, `npm run test:i18n`.

## Content and UI rules

- User-facing Chinese must be Traditional Chinese only (never Simplified)
- Bilingual blog posts keep tag/slug/date/cover parity across zh-TW and en
- Prefer WebP covers; do not invent routes or taxonomy tags
- Preserve existing visual language; do not introduce generic AI purple/glow aesthetics
- Commit only when the human asks; never change git config

## Recommended TAKT workflows for this repo

- Feature / UI work: `frontend-mini` (or `frontend` for stricter review)
- Content-only / small fixes: `default-mini`
- Maintenance with tighter gates: `frontend-maintenance`
