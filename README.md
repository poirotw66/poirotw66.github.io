# AI Platform Engineer — Personal Brand Site

Static site built with [Astro](https://astro.build). Content: Markdown-driven blog, bilingual (EN / 繁體中文) homepage and contact.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:4321

## Build

```bash
npm run build
```

Output: `dist/` (static HTML, CSS, JS).

## Deploy to GitHub Pages

1. **Repo Settings → Pages**
   - **Source**: choose **GitHub Actions** (not “Deploy from a branch”).

2. **Push to `main`**
   - The workflow `.github/workflows/deploy.yml` runs on push to `main`, builds the Astro site, and deploys the `dist/` folder to GitHub Pages.

3. **URL**
   - https://poirotw66.github.io

## Project structure

- `src/pages/` — Astro pages (index, contact, blog, projects).
- `src/layouts/Layout.astro` — Shared layout, nav, footer, language switcher, SEO meta.
- `src/content/blog/` — Blog posts as Markdown (frontmatter: title, description, pubDate, category).
- `public/` — Static assets (CSS, JS, robots.txt, sitemap.xml).

## Adding a blog post

Create a new `.md` file in `src/content/blog/`, for example:

```md
---
title: "Your Post Title"
description: Short description for SEO.
pubDate: 2025-02-01
category: "Generative AI · Topic"
---

Your content here…
```

Build and deploy as above; the new post will appear on `/blog/` and at `/blog/your-filename/`.

## Legacy static HTML

The original static HTML/CSS/JS (e.g. root `index.html`, `contact.html`, `blog/*.html`, `projects/*.html`) remain in the repo. When deploying via **GitHub Actions**, only the built `dist/` output is published, so the live site is the Astro version. You can keep or remove the legacy files as you prefer.
