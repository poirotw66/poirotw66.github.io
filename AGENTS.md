# Bloss0m (poirotw66.github.io)

Personal site: Astro static blog, paper reading, projects. Content in Traditional Chinese.

### Design foundation (PRD-003)

- **Default theme:** warm (cream / copper); **alt:** dark (navy / blue accent)
- **Fonts:** Archivo (headings), Space Grotesk (body), JetBrains Mono (code)
- **Depth:** surface tint + 1px border; light card hover shadow only
- **Phase 1 priority:** mobile long-form reading (16px body, 1.7+ leading) → nav slim to 5 items
- **Full spec:** `docs/guideline/ui/ui-guideline.md`

### Tech stack

- Language: TypeScript (minimal), JavaScript
- Framework: Astro 7, static output
- Content: Markdown in `src/content/blog`, `src/content/paperReading`, `src/content/projects`
- Assets: `public/`, Git LFS for PDFs
- Hosting: GitHub Pages (Actions → `dist/`)

### Project commands

- Dev: `npm run dev`
- Build: `npm run build` (content checks, Astro build, CSS minification, asset budgets)
- Preview: `npm run preview`
- Content validation: `npm run check:content`
- Tag validation: `npm run check:tags`
- i18n pairing: `npm run check:i18n`
- CSS analysis: `npm run analyze:css`
- Lighthouse / Core Web Vitals budget: `npm run test:performance` (run after build)
- PDF compress: `npm run compress:pdf -- <path.pdf>`

### Test strategy

- `npm run test:tags` — tag slug unit tests
- `npm run test:reading-quality` — reading-quality unit tests
- `npm run test:i18n` — bilingual pairing unit tests
- `npm run build` — primary gate before deploy
- Manual: spot-check blog routes and embeds (PDF viewer, YouTube audio facade)
- PR CI: `.github/workflows/pr-check.yml` runs unit tests, build budgets, and Lighthouse on pull requests

### Git conventions

- Do not change git config
- Commit only when the user asks
- Use HEREDOC for commit messages
- Blog assets: prefer WebP covers; PDFs via Git LFS (`*.pdf` in `.gitattributes`)

### Guideline mapping

- content-reading → docs/guideline/content-reading-quality.md
- ui → docs/guideline/ui/ui-guideline.md
- ui-spec → docs/guideline/ui/

### Templates

<!-- Monorepo paths relative to repo root -->
<!-- - prd → docs/templates/prd-template.md -->
