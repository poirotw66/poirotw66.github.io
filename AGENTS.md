# Bloss0m (poirotw66.github.io)

Personal site: Astro static blog, paper reading, projects. Content in Traditional Chinese.

## AI-Driven Development Flow

This repo uses **vif** for planned content and feature work. Day-to-day blog drafts may still live under `docs/` until folded into a PRD/spec.

**Mode:** Solo (full automation)  
**Flow:** Product-first (content PRD → spec → implement via blog pipeline)

### flow_mode

- `normal` — advance phase by phase after Human approval gates

### Skills

| Category | Skill | Use on this repo |
|----------|-------|------------------|
| Architecture | `/vif-arch` | Site stack, conventions (optional refresh) |
| Requirements | `/vif-prd` | Content series PRDs (e.g. Harness) |
| Planning | `/vif-spec` | Per-article or per-feature technical plan |
| Develop | `/vif-develop` | When spec includes code (Astro, scripts) |
| Verify | `/vif-verify` | `npm run build`, content checks |
| Review | `/vif-review` | Pre-publish review |
| Close | `/vif-close` | Sync tracking docs |

Blog-specific: `.cursor/skills/write-blog-post`, `read-paper-three-pass` (outside vif spec path).

### Design foundation (PRD-003)

- **Default theme:** warm (cream / copper); **alt:** dark (navy / blue accent)
- **Fonts:** Archivo (headings), Space Grotesk (body), JetBrains Mono (code)
- **Depth:** surface tint + 1px border; light card hover shadow only
- **Phase 1 priority:** mobile long-form reading (16px body, 1.7+ leading) → nav slim to 5 items
- **Full spec:** `docs/guideline/ui/ui-guideline.md`

### Tech stack

- Language: TypeScript (minimal), JavaScript
- Framework: Astro 6, static output
- Content: Markdown in `src/content/blog`, `src/content/paperReading`, `src/content/projects`
- Assets: `public/`, Git LFS for PDFs
- Hosting: GitHub Pages (Actions → `dist/`)

### Project commands

- Dev: `npm run dev`
- Build: `npm run build` (includes `check:tags`, `check:content`, critical CSS extract)
- Preview: `npm run preview`
- Content validation: `npm run check:content`
- Tag validation: `npm run check:tags`
- PDF compress: `npm run compress:pdf -- <path.pdf>`

### Test strategy

- `npm run test:tags` — tag slug unit tests
- `npm run build` — primary gate before deploy
- Manual: spot-check blog routes and embeds (PDF viewer, YouTube audio facade)

### Git conventions

- Do not change git config
- Commit only when the user asks
- Use HEREDOC for commit messages
- Blog assets: prefer WebP covers; PDFs via Git LFS (`*.pdf` in `.gitattributes`)

### vif-verify

<!-- - Code Quality: true -->

### Guideline mapping

- content-reading → docs/guideline/content-reading-quality.md
- ui → docs/guideline/ui/ui-guideline.md
- ui-spec → docs/guideline/ui/
<!-- - blog-post → .cursor/skills/write-blog-post/SKILL.md -->

### Templates

<!-- Monorepo paths relative to repo root -->
<!-- - prd → docs/templates/prd-template.md -->
