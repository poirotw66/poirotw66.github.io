# Homepage First-Visit Onboarding Spec

> **Status:** Approved — A+C combination  
> **Created:** 2026-07-12  
> **Goal:** Help first-time visitors choose a clear reading or evaluation path without weakening existing hero CTAs.

---

## 1. Problem

First-time visitors land on the homepage but lack an explicit answer to 「從哪開始讀／看」. The Writing section defaults to the engineering lane; the hero jump nav lists sections but not visitor intent.

---

## 2. Approved Solution (A + C)

### A — Hero「從這裡開始」path cards

Insert a compact strip in the hero copy column **between primary CTAs and the proof list**.

| # | zh label | en label | Target |
|---|----------|----------|--------|
| 1 | 評估能力 → 看專案案例 | Evaluate fit → Case studies | `#showcase` |
| 2 | 開始閱讀 → 精選入門 | Start reading → Curated picks | `#writing-starter` |
| 3 | 洽談合作 → 聯絡 | Discuss a project → Contact | `#cta` |

- Section title: **第一次來？從這裡開始** / **New here? Start here**
- Visual: dashed accent border, 3-column card grid (stacks on narrow viewports)
- `HomeSectionNav` unchanged

### C — Writing defaults to starter + guide banner

- Tab order: **精選入門 → 工程實作 → 產業脈動** (starter first)
- Default active tab: `starter` (SSR + JS)
- Banner above tab list: **不確定從哪讀？先從「精選入門」開始** / **Not sure where to begin? Start with curated picks.**

Path card ② uses `#writing-starter`, reusing existing lane hash protocol in `home-writing-tabs.js`.

---

## 3. Out of Scope

- Changing hero primary/secondary CTAs or spotlight card
- Reworking `HomeSectionNav` labels (方案 B)
- New blog content or lane mapping changes
- Persisting “first visit” in localStorage

---

## 4. Files

| File | Change |
|------|--------|
| `src/components/HomeStartHere.astro` | **New** — hero path strip |
| `src/components/pages/HomePageContent.astro` | Wire component; reorder lanes; guide banner; copy |
| `public/js/home-writing-tabs.js` | Default lane `starter` |
| `public/js/home-scroll-hash.js` | Treat `#writing-*` as `#writing` for section highlight |
| `public/css/style.css` | `.home-start-here*`, `.home-writing-guide` |

---

## 5. Acceptance Criteria

1. Hero shows three path cards with zh/en copy on `/` and `/en/`.
2. Clicking path ② scrolls to Writing and activates the starter tab.
3. Writing section loads with starter tab active when no lane hash is present.
4. Guide banner visible above writing tabs in both languages.
5. `npm run build` passes.

---

## 6. Testing

- Manual: load `/`, confirm starter tab + banner; click each path card.
- Manual: load `/#writing-starter`, confirm starter tab active.
- Build: `npm run build`
