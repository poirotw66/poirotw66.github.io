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

## Recommended structure

1. Direct opening: subject, problem, and why it matters.
2. Huahua summary or judgment.
3. Context and verified facts.
4. Architecture or method breakdown.
5. Evidence, case, or benchmark interpretation.
6. Limitations, risks, and operational trade-offs.
7. What this means for engineers or enterprises.
8. Related Bloss0m reading and primary sources.

Use informative headings rather than “Introduction”, “Part One”, or “Conclusion”. Avoid emoji headings unless the existing series consistently uses them.
Do not use horizontal rules as routine section separators. Let headings establish hierarchy.

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

Use one or two; never exceed three.

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

## Internal linking

- Link to the AI Agent guide when the post depends on agent architecture: `/blog/64-ai-agent-guide/`.
- Link to the Enterprise RAG guide when the post depends on retrieval architecture: `/blog/65-enterprise-rag-guide/`.
- Inspect the repository for another 1–3 closely related posts or cases.
- Use `/blog/.../` in Traditional Chinese and `/en/blog/.../` in English unless the repository routing proves otherwise.
- Do not link merely to increase count; every link should form a useful reading path.
