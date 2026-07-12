# Blog Editorial Revision Spec

> **Status:** Implemented — see PR `cursor/blog-editorial-revision-impl`  
> **Created:** 2026-07-12  
> **Reference:** [penchan.co](https://penchan.co/) (editorial guidance & content lanes)  
> **Goal:** Keep Bloss0m blog engineering strengths; add Penchan-style discovery and visual hierarchy.

---

## 1. Summary

Bloss0m's blog excels at **deep reading** (TOC, audio, Mermaid, tags, filters) but is weaker at **content discovery** (single flat list, no reading paths, uniform card hierarchy). This spec defines a revision that preserves existing advantages while borrowing Penchan's editorial patterns: content lanes, section intros, dual CTAs, and featured/compact list hierarchy.

**Positioning:** Not a tutorial magazine clone — remain an **engineer's technical publication with magazine-style wayfinding**.

---

## 2. Design Principles

| Keep (Bloss0m strengths) | Borrow (Penchan strengths) |
|--------------------------|----------------------------|
| Article TOC, audio, Mermaid | Multiple content lanes |
| `/blog` search / category / tag filters | Section lead copy + arrow CTAs |
| Thumbnails, descriptions, tag pills | Featured card + compact list |
| Engineer / enterprise AI positioning | Editorial hub page header |
| Dual theme, `surface-*` visual system | Category as visual "column brand" |

---

## 3. Current State

| Area | Status |
|------|--------|
| Posts | 51 articles in `src/content/blog/` |
| Categories | 15+ distinct `category` values; `Enterprise AI` is largest (~18 posts) |
| Homepage `#writing` | 6 identical `BlogPreviewItem` cards, date-sorted |
| `BlogPreviewItem` | No `description`, no featured/compact variants |
| `/blog` index | Strong filters; weak editorial framing |
| Article schema | `kind`, `showToc`, `guideVersion` already exist — article pages need minimal change |

### Key files (today)

- `src/components/pages/HomePageContent.astro` — homepage `#writing` section
- `src/components/pages/BlogIndexContent.astro` — blog index + filters
- `src/components/BlogPreviewItem.astro` — preview cards
- `src/components/SectionHeading.astro` — kicker + title
- `src/content.config.ts` — blog collection schema
- `public/css/style.css` — global styles

---

## 4. Target Information Architecture

```
Homepage
└── #writing (parent anchor: 觀點 · Writing)
    ├── Lane A: Engineering (Harness / RAG / Agent)
    ├── Lane B: Industry Pulse (AI news / product updates)
    └── Lane C: Start Here (curated picks, manual)

/blog index
├── Editorial Header (kicker + lead + CTA)
├── Lane previews (1 featured + 2–3 compact per lane)
└── Full list + filters (existing, preserved)
```

---

## 5. Content Lanes

Do **not** force rewriting 51 frontmatter files in phase 1. Use a **mapping layer** in code; optional `lane` frontmatter override later.

| Lane ID | zh title | en title | Inclusion rules |
|---------|----------|----------|-----------------|
| `engineering` | 工程實作 | Engineering | Categories: `Enterprise AI`, `AI & Development`, `AI & Data Engineering`, `AI & Data Science`; OR tags containing Harness / RAG / Agent |
| `pulse` | 產業脈動 | Industry Pulse | Categories: `AI & Tech`, `Product Updates`, `AI & Innovation` |
| `starter` | 精選入門 | Start Here | **Manual curation** — fixed post IDs, not date-sorted |

Posts outside these lanes (e.g. `Sports & Science`, `Creator Tools · LINE Stickers`) remain in the full `/blog` list only; not forced into homepage lanes.

### Starter picks (initial)

```ts
export const STARTER_PICKS = [
  '13-harness-engineering-reading-map',
  '04-building-effective-ai-agents',
  '07-agentic-rag',
] as const;
```

### Optional schema extension (phase 2+)

```ts
lane: z.enum(['engineering', 'pulse', 'starter']).optional(),
featured: z.boolean().optional(), // hub/section spotlight override
```

---

## 6. Components

### 6.1 New components

| Component | Responsibility |
|-----------|----------------|
| `SectionIntro.astro` | Lead paragraph under section heading |
| `SectionCta.astro` | Arrow link, e.g. `進部落格 →`; `position: 'top' \| 'bottom'` |
| `EditorialSection.astro` | Composes `SectionHeading` + `SectionIntro` + slot + `SectionCta` |
| `CategoryBadge.astro` | Lane/category pill with lane-specific color |

### 6.2 Extended components

**`BlogPreviewItem.astro`** — add `variant` prop:

| Variant | Shows | Use case |
|---------|-------|----------|
| `card` | image, title, date, category, tags (current) | Homepage grids, paper preview reuse |
| `featured` | image, title, **description** (2–3 lines), badge, date | Lane hero item |
| `compact` | title, badge, date only | Scan-friendly list below featured |

---

## 7. Page Changes

### 7.1 Homepage `#writing`

**Before:** one `SectionHeading` + 6 uniform cards + single "view all" button.

**After:**

```astro
<section id="writing">
  <SectionHeading kicker="觀點 · Writing" title="工程觀點與實作筆記" />
  <SectionIntro lead="從 Harness、RAG、Agent 到上線維運——..." />
  <SectionCta href="/blog/" position="top" />

  <EditorialSection id="writing-engineering" lane="engineering">
    <!-- featured × 1 + compact × 2 -->
    <SectionCta href="/blog/?lane=engineering" position="bottom" />
  </EditorialSection>

  <EditorialSection id="writing-pulse" lane="pulse">
    <!-- featured × 1 + compact × 2 -->
  </EditorialSection>

  <EditorialSection id="writing-starter" lane="starter">
    <!-- compact × 3, curated -->
    <SectionIntro lead="第一次接觸 Agent 或 Harness？從這幾篇建立共同語言。" />
  </EditorialSection>
</section>
```

`HomeSectionNav`: keep `#writing` as parent anchor; optionally add sub-items (工程 / 脈動 / 入門).

### 7.2 `/blog` index hub

**Preserve:** keyword search, category/tag selects, result count, thumbnail list items.

**Add (top):**

```
KICKER: WRITING
H1: 工程觀點與實作筆記
Lead: 分享 Generative AI、企業 AI 的設計、評估與工程落地。
CTA: 從精選入門開始 →
```

**Layout:**

```
┌─ Editorial Header ─────────────────┐
├─ Lane previews (engineering / pulse / starter) ─┤  NEW
├─ Filters (existing; optional collapsible) ──────┤  KEEP
└─ Full blog-list ─────────────────────────────────┘  KEEP
```

When filters are active, hide lane previews and show filtered results only.

Optional: URL query `?lane=engineering` syncs with lane filter.

### 7.3 Article pages

**No layout overhaul.** Optional: render `CategoryBadge` in article meta line.

**Do not change:** `ArticleToc`, audio embeds, Mermaid, tag pills, `guideVersion`.

---

## 8. Copy Guidelines (draft)

| Lane | zh lead |
|------|---------|
| Engineering | Harness、RAG、多 Agent 協作——把 PoC 推成可維運的企業系統。 |
| Pulse | 模型發布、產品更新與產業訊號，整理成能快速掃過、需要時再深入的筆記。 |
| Starter | 第一次接觸 Agent 或 Harness？從這幾篇建立共同語言。 |

Tone: **guide the reader without dumbing down** — engineer audience, not beginner magazine.

---

## 9. Styles (`public/css/style.css`)

Add classes; do not replace existing design system:

```css
.section-lead { }              /* intro paragraph */
.section-cta { }               /* arrow link, hover shift */
.editorial-lane { }            /* lane sub-section spacing */
.blog-preview--featured { }   /* horizontal / full-width hero card */
.blog-preview--compact { }     /* minimal list row */
.category-badge { }            /* lane pill base */
.category-badge--engineering { }
.category-badge--pulse { }
.category-badge--starter { }
```

Reuse existing tokens: `--accent`, `--gold`, `surface-raised`, `surface-inset`, `--shadow-card-hover`.

---

## 10. i18n

Add strings for zh / en:

- Lane titles, leads, CTAs
- Hub header copy
- Starter onboarding line

Location: inline in page content objects (current pattern) or `src/i18n/ui` if centralized.

---

## 11. File Change List

| File | Action |
|------|--------|
| `specs/blog-editorial-revision.md` | **This document** |
| `src/utils/blogLanes.ts` | **Create** — lane defs, category mapping, starter IDs |
| `src/components/SectionIntro.astro` | **Create** |
| `src/components/SectionCta.astro` | **Create** |
| `src/components/EditorialSection.astro` | **Create** |
| `src/components/CategoryBadge.astro` | **Create** |
| `src/components/BlogPreviewItem.astro` | **Extend** — `variant` prop |
| `src/components/pages/HomePageContent.astro` | **Refactor** — `#writing` lanes |
| `src/components/pages/BlogIndexContent.astro` | **Refactor** — hub header + lane previews |
| `src/components/HomeSectionNav.astro` | **Minor** — optional sub-nav |
| `public/css/style.css` | **Add** editorial lane styles |
| `src/content.config.ts` | **Optional** — `lane`, `featured` fields |
| `src/components/pages/BlogPostContent.astro` | **Unchanged** (or badge only) |

---

## 12. Implementation Phases

| Phase | Scope | Est. |
|-------|-------|------|
| **1** | `blogLanes.ts`, `CategoryBadge`, `BlogPreviewItem` variants | 0.5 d |
| **2** | `SectionIntro`, `SectionCta`, `EditorialSection` | 0.5 d |
| **3** | Homepage `#writing` three lanes | 0.5 d |
| **4** | `/blog` hub header + lane previews + `?lane=` | 0.5 d |
| **5** | CSS polish, i18n, mobile QA | 0.5 d |

**Suggested PRs:**

- **PR A:** Components + homepage lanes (fastest visible impact)
- **PR B:** Blog index hub + query sync

**Total estimate:** 2–3 days.

---

## 13. Acceptance Criteria

- [ ] Homepage blog has **≥2 lanes**, each with lead + CTA
- [ ] Each lane has **≥1 featured + ≥2 compact** items with clear visual hierarchy
- [ ] `/blog` filter functionality fully preserved
- [ ] Article pages: TOC, tags, audio — **zero regression**
- [ ] zh / en pages in sync
- [ ] `starter` picks are **manually curated**, stable across deploys
- [ ] Mobile: featured cards readable in single-column layout

---

## 14. Explicitly Out of Scope

| Item | Reason |
|------|--------|
| Collapse 15+ categories into 4 Penchan-style columns | Content breadth; mapping layer is enough |
| Remove `/blog` filters | Utility is a competitive advantage |
| Rewrite copy to beginner-magazine tone | Conflicts with enterprise AI engineering brand |
| Newsletter section | Unless subscription product is planned |
| Article page layout redesign | Article experience is already strong |

---

## 15. Open Questions (for implementation PR)

1. **Lane count on homepage:** 2 lanes (engineering + pulse) or 3 (+ starter)?
2. **Starter curation:** Confirm final 3–4 post IDs with author.
3. **Blog index:** Lane previews above filters always visible, or collapsed by default on mobile?
4. **Category badge on article page:** Add in PR A or defer?

---

## 16. References

- Penchan homepage sections: AI LAB, RECENT PROJECTS, AI BEGINNER, AI RESEARCH & ANALYSIS
- Penchan `/blog` (AI 脈動): editorial header + featured/compact list rhythm
- Bloss0m comparison notes: session 2026-07-12 (discovery vs depth tradeoff analysis)
