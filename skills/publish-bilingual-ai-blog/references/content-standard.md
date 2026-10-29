# Bloss0m bilingual content standard

## Output locations

- Traditional Chinese: `src/content/blog/<number>-<slug>.md`
- English: `src/content/blog/en/<number>-<slug>.md`
- Shared cover: `public/blog/<number>-<slug>/title_image.webp`

Use the same basename for both Markdown files. Inspect existing files before choosing the next number.

## Frontmatter

Use this shape. For publication-ready Bloss0m blog posts, `tldr` and `audience` are required even though the Astro schema keeps them optional for legacy content:

```yaml
---
title: "Search-oriented title"
description: "One precise sentence describing the problem, method, and value."
pubDate: YYYY-MM-DD
updatedDate: YYYY-MM-DD
tldr:
  - "Concrete takeaway"
  - "Concrete trade-off or decision"
audience:
  - "Primary technical audience"
  - "Secondary decision-making audience"
category: "AI Engineering"
tags: ["AI Agent", "Enterprise AI", "Evaluation"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 3
kind: "article"
showToc: true
image: "/blog/<number>-<slug>/title_image.webp"
---
```

Valid categories are `Enterprise AI`, `AI Engineering`, `Cloud & Platform`, `Industry Pulse`, `Creator Tools`, `Startup`, and `Practice Notes`.

- Valid topic clusters are `ai-agent`, `enterprise-rag`, and `ai-platform-governance`.
- Use `clusterRole: pillar` for the durable core guide, `support` for related engineering coverage, `case` for implementation evidence, and `signal` for a time-sensitive update that materially belongs in the path.
- Omit all cluster fields when the relationship is weak. Keep `clusterOrder` stable and aligned across languages.
- Use `kind: guide` only for durable hub-style coverage; otherwise use `article`.
- Write 2–4 concise `tldr` items and 1–3 `audience` items. Match their meaning across languages.
- Prefer 3–5 existing tags. Chinese and English display labels must resolve to the same canonical ASCII slugs.
- Do not introduce a singleton tag casually. Follow the repository taxonomy and validator.
- Keep `pubDate`, `updatedDate`, category, kind, image path, and canonical tag meaning aligned across languages.

## Question-led prose

Name one reader and one author question. Choose a concrete surprise, scene or contradiction, explain the mechanism needed to understand it, use only the evidence necessary to answer it, then offer bounded author judgment and a useful next step. Creative observation and tool exploration need no invented enterprise-deployment payoff. A technical article may use more detail; a short observation need not grow eight standard sections.

Frontmatter TL;DR gives concise takeaways; the opening develops the question rather than repeats them. Natural Chinese headings need no parallel English translation. Keep searchable method names and necessary terms. Huahua is optional and must add a distinct interpretation; avoid a second abstract or generic final recap. Clearly distinguish source-reported findings, untested illustrative examples and actual hands-on observations. Never invent the author's personal use of a tool.

Use informative headings rather than “Introduction”, “Part One”, or “Conclusion”. Avoid decorative rules and emoji headings.

## Rendering stability contract

- Use Markdown images with local `/blog/...` asset paths. The site adds intrinsic dimensions and lazy-loading hints during Markdown rendering.
- Do not repeat the frontmatter cover in the article body.
- Do not use raw `<img>`, inline `style`, or arbitrary width percentages.
- Keep raw HTML limited to supported PDF and YouTube facade embeds.
- Do not use body-level `---`; H2 headings provide section rhythm.
- Keep punctuation outside strong emphasis when prose continues immediately. Write `**問題**：說明` and `「**核心概念**」`, not `**問題：**說明` or `**「核心概念」**`; CommonMark can render the latter forms as literal `**` beside CJK text.
- Use ordinary `>` blockquotes for quotations. Only the exact Huahua labels below may produce branded callout cards.
- Never use Obsidian `[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!CAUTION]`, or `[!IMPORTANT]` syntax.
- Treat Mermaid as a concise technical diagram, not a replacement for every visual. Keep `flowchart LR` to four or five nodes; for longer linear flows, use `flowchart TB`, stage subgraphs, or separate diagrams.
- Design Mermaid for a 390px-wide reading column: keep node labels to one or two short lines, preserve the same stages and relationships in both language versions, and verify the rendered SVG is readable without shrinking text. Wide diagrams may scroll inside their own container, but do not rely on scrolling for a simple linear pipeline.

## Editorial quality gate

- The article must add synthesis, architecture, limitations, or practical decisions beyond the source summary.
- Attribute claims close to their supporting links. Use official documentation, papers, specifications, repositories, or first-party announcements for technical facts.
- Never invent quotes, adoption numbers, release dates, benchmarks, code, or product availability.
- Treat vendor performance claims as vendor claims unless independently reproduced.
- Keep direct quotations brief and necessary. Paraphrase copyrighted source material.
- Explain acronyms at first use and keep terminology consistent.
- Use tables only when comparing at least three meaningful dimensions.
- Ensure code is valid and sourced or clearly labeled as illustrative.

## Huahua callouts

Use only when helpful; never exceed three. Do not add a callout merely to pass a check.

```markdown
> **花花的一句話**
>
> 用一句話說清楚核心概念。

> **花花的工程提醒**
>
> 指出成本、限制、風險或正式環境條件。

> **花花的判斷**
>
> 將趨勢轉化成對工程與企業的具體意義。
```

English labels are `Huahua in one sentence`, `Huahua's engineering note`, and `Huahua's take`. Match the callout variants and claims across both versions.

Put the label in its own quoted paragraph, followed by one blank quoted line. Do not append callout prose to the bold label line.

## Internal linking

- Link to the AI Agent guide when the post depends on agent architecture: `/blog/64-ai-agent-guide/`.
- Link to the Enterprise RAG guide when the post depends on retrieval architecture: `/blog/65-enterprise-rag-guide/`.
- Inspect actual Blog, Paper Reading and Projects entries for useful continuation; zero related links is preferable to unrelated links.
- Use verified `/blog/.../`, `/paper-reading/.../` or `/projects/.../` routes in Traditional Chinese and the corresponding `/en/` routes in English.
- Do not link merely to increase count; every link should form a useful reading path.
