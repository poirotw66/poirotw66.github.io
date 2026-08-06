---
name: bloss0m-project-cover
description: Create, replace, or audit 16:10 Working Artifact cover images for Bloss0m project pages. Use when Codex needs a new cover for `src/content/projects`, must turn real project evidence, screenshots, outputs, or architecture into a project visual, or needs to verify that a new Projects cover follows the non-mascot engineering portfolio standard.
---

# Bloss0m Project Cover

Create a project cover that proves what was built. Prefer real artifacts and truthful architecture over generic AI imagery.

## Required context

- In a Bloss0m checkout, read `AGENTS.md`, `src/content.config.ts`, the exact project write-up, and [references/cover-art.md](references/cover-art.md).
- Inspect `git status` and preserve unrelated work.
- Inspect the project repository, screenshots, outputs, architecture diagrams, and existing assets that the user placed in scope.
- Use this Skill only for a new cover or an explicitly requested replacement. Do not modernize legacy covers during unrelated project work.

## Modes

- **new:** create the first cover for a project page.
- **replace:** replace a named cover after the user requests a new direction.
- **audit:** report whether a cover follows the Working Artifact standard; do not edit.

## Workflow

1. Resolve the exact project slug, both language routes when present, current `image` paths, and target `public/projects/<slug>/title_image.webp`.
2. Write a one-sentence artifact claim: what concrete system, workflow, or outcome should the cover prove?
3. Choose the strongest truthful source in this order: real result or product capture; real document/data/output; verified architecture; original Working Artifact illustration. Do not invent a UI because source material is weak.
4. Select the case-study, prototype, or creative-experiment composition from `cover-art.md`.
5. Inspect every local image used as input. When generating or editing, use the available image-generation tool and pass the minimum necessary local reference images. Do not use Huahua or `public/brand/bloom-hero.webp`.
6. Generate or compose one 1200 × 750 cover. Keep real screenshots unaltered when their details matter; use framing and background treatment instead of hallucinating replacement controls or data.
7. Inspect the result at full size and card size. Reject fake text, fake dashboards, misleading outputs, malformed UI, generic glowing-brain imagery, or a cover whose main artifact is not legible.
8. Save or convert the approved asset to `public/projects/<slug>/title_image.webp`. Update paired frontmatter only after the local file exists and only when the task authorizes that content change.
9. Run `npm run check:content`, `npm run check:i18n`, and `npm run build` when frontmatter or a tracked project asset changes.

## Guardrails

- Do not place Huahua, another mascot, or an unrelated character on Projects covers.
- Do not fabricate a product interface, metric, customer, architecture component, or production claim.
- Do not add readable titles, code, dashboard labels, logos, or watermarks through image generation.
- Preserve existing covers unless the user explicitly requests replacement; this standard applies prospectively.
- Do not commit, push, publish, or merge unless the user explicitly asks.
