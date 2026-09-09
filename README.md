# Bloss0m — Personal Brand Site

個人品牌網站：AI Platform / Agentic AI Engineer。靜態站台，Markdown 驅動部落格，中英雙語（EN / 繁體中文）。

---

## 技術棧 (Tech Stack)

| 類別 | 技術 | 說明 |
|------|------|------|
| **SSG** | [Astro](https://astro.build) | 靜態站台產生器，`output: 'static'`，無伺服器端執行。 |
| **執行環境** | Node.js | `package.json` 要求 `>=22.12.0`；CI 使用 Node 22。 |
| **內容** | Content Collections + Markdown | 部落格文章放在 `src/content/blog/*.md`，以 frontmatter 定義標題、描述、日期、分類。 |
| **樣式** | 純 CSS | `public/css/*.css`，以 base/layout 與 page-scoped sheets 組成，無預處理器。 |
| **字型** | Google Fonts | Archivo（標題）、Space Grotesk（內文）。 |
| **語言切換** | Astro i18n Routing | 靜態路由輸出：中文版維持根路徑，英文版使用 `/en/` 前綴；每個 URL 生成獨立語言的 HTML，並輸出 `hreflang`。 |
| **SEO** | Meta + OG + Sitemap | 每頁 title/description、canonical、Open Graph、Twitter card；建置時由 `@astrojs/sitemap` 產生 sitemap，再由 `scripts/finalize-sitemap.mjs` 補上 `lastmod`／`hreflang` 並移除 `noindex` 頁面；`public/robots.txt`。 |
| **部署** | GitHub Actions + GitHub Pages | Push `main` 觸發建置，將 `dist/` 部署至 GitHub Pages。 |

### 目錄結構對應

- **頁面**：`src/pages/*.astro`（index、contact、blog、projects）
- **版型**：`src/layouts/Layout.astro`（導覽、footer、語言按鈕、`<head>` SEO）
- **內容 schema**：`src/content.config.ts`（Zod 驗證 blog、paper reading、projects、stickers、sticker tools）
- **靜態資源**：`public/`（CSS、JS、robots.txt）→ 建置後複製到 `dist/` 根目錄；sitemap 由 `@astrojs/sitemap` 在建置時產生

---

## 本地開發 (Development)

```bash
npm ci
npm run dev
```

瀏覽 http://localhost:4321

完整的開發、內容與 Analytics 操作說明見 [`docs/DEVELOPMENT-CONTENT-ANALYTICS.md`](docs/DEVELOPMENT-CONTENT-ANALYTICS.md)。

---

## 建置 (Build)

```bash
npm run build
```

輸出目錄：`dist/`（靜態 HTML、CSS、JS）。可用 `npm run preview` 在本機預覽建置結果。

---

## 部署 (Deploy to GitHub Pages)

1. **Repo → Settings → Pages**
   - **Build and deployment** → **Source** 選 **GitHub Actions**（不要選 "Deploy from a branch"）。

2. **Push 到 `main`**
   - 觸發 `.github/workflows/deploy.yml`：`npm ci` → `npm run build` → 上傳 `dist/` → 部署至 GitHub Pages。

3. **網站網址**
   - https://poirotw66.github.io

---

## Web Analytics（Cloudflare + GA4）

- **Cloudflare Web Analytics**：用於無 cookie 的站台流量與邊緣層概況。`bloss0m.com` 經 Cloudflare 代理並採 Automatic setup；它不是事件分析工具。
- **Google Analytics 4**：Measurement ID 為 `G-FKETRDJWMH`，由 `src/layouts/Layout.astro` 在首次互動或頁面載入 5 秒後延遲載入；事件定義與 DebugView 驗證流程見 [`docs/DEVELOPMENT-CONTENT-ANALYTICS.md`](docs/DEVELOPMENT-CONTENT-ANALYTICS.md)。
- `contact_intent` 只代表使用者點擊 `mailto:`（`contact_stage=click_only`），不代表信件已寄出或收到；靜態網站目前沒有表單提交或收件 webhook。

---

## Tag URL Policy (Blog)

- Blog tag routes are ASCII-only and canonical.
- Non-ASCII display tags are allowed in frontmatter, but each must be mapped in `src/utils/tag.ts` via `TAG_SLUG_MAP`.
- Run `npm run check:tags` before pushing content updates.
- Legacy non-ASCII or URL-encoded tag routes are intentionally not preserved.

### 30 秒內容編輯 SOP（tags）

1. 新增或修改文章 `tags`（可保留中文顯示）。
2. 在 push 前先跑：`npm run check:tags`
3. 若檢查失敗，先到 `src/utils/tag.ts` 補齊 `TAG_SLUG_MAP` 再重跑。
4. `check:tags` 通過後再 push。

---

## 未來新增文章的步驟 (Adding a New Blog Post)

### Step 1：新增 Markdown 檔案

在 **`src/content/blog/`** 底下新增一個 `.md` 檔，檔名即為網址的 slug（建議英文、小寫、連字號），例如：

- `src/content/blog/your-post-slug.md`

### Step 2：填寫 Frontmatter（必填）

每個部落格文章至少必須包含以下四個欄位；其他欄位依內容類型與 topic cluster 使用。實際欄位以 `src/content.config.ts` 為準：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `title` | string | 文章標題（若含冒號請用雙引號包住，例如 `"RAG: Best Practices"`） |
| `description` | string | 一兩句話描述，用於 SEO 與列表摘要 |
| `pubDate` | date | 發布日期，格式 `YYYY-MM-DD` 或 ISO 字串 |
| `category` | enum | 必須是 `Enterprise AI`、`AI Engineering`、`Cloud & Platform`、`Industry Pulse`、`Creator Tools`、`Startup`、`Practice Notes` 之一。 |

常用選填欄位：

| 欄位 | 型別 | 用途 |
|------|------|------|
| `updatedDate` | date | 技術內容重新驗證或實質修改日期。 |
| `tldr` | string[]（1–4） | 文章前的重點摘要。 |
| `audience` | string[]（1–4） | 目標讀者。 |
| `tags` | string[] | 顯示標籤；非 ASCII tag 需同步更新 `src/utils/tag.ts`。 |
| `cluster` / `clusterRole` / `clusterOrder` | enum / enum / integer | 放入 `ai-agent`、`enterprise-rag` 或 `ai-platform-governance` 主題路徑時使用。 |
| `kind` | `article` \| `guide` | 長篇指南使用 `guide`，預設為 `article`。 |
| `showToc` | boolean | 顯示由 Markdown headings 產生的目錄。 |
| `image` | string | 文章封面，例如 `/blog/your-post-slug/title_image.webp`。 |

### Step 3：撰寫內文

Frontmatter 下方用標準 Markdown 撰寫正文，支援標題、列表、連結、程式碼區塊等。

### 範例：完整文章檔案

```md
---
title: "Your Post Title: Subtitle Here"
description: "One or two sentences for SEO and blog listing."
pubDate: 2026-09-09
updatedDate: 2026-09-09
tldr:
  - "The first decision or takeaway a reader should remember."
  - "The second takeaway, including the main engineering trade-off."
audience:
  - "Engineers evaluating agent or RAG systems"
  - "Technical leads responsible for production delivery"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Architecture"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 99
kind: "article"
showToc: true
image: "/blog/your-post-slug/title_image.webp"
---

Here is the first paragraph.

## Section Heading

- List item one
- List item two
```

> 若標題、description 或其他 scalar 值含有冒號（`:`）或特殊符號，請用雙引號包住該欄位值，避免 YAML 解析錯誤。若文章有英文版本，建立相同檔名的 `src/content/blog/en/your-post-slug.md`，並讓雙語的結構欄位一致。

### Step 4：建置與預覽

```bash
npm run check:content
npm run check:tags
npm run check:i18n
npm run check:blog-format
npm run check:reading-quality
npm run build
npm run preview
```

確認首頁的「Latest from Blog」與 `/blog/` 列表都有新文章，且點入文章頁正常。

### Step 5：部署

將變更 push 到 `main`，GitHub Actions 會自動建置並部署，新文章會出現在：

- 首頁「Latest from Blog」（取最新 3 篇）
- https://poirotw66.github.io/blog/
- https://poirotw66.github.io/blog/your-post-slug/

---

## 新增專案 (Adding a Project)

專案改為 **Content Collection** 驅動：新增一則 `.md` 即會出現在首頁精選與 `/projects/` 列表，並有獨立詳情頁。

### Step 1：新增 Markdown 檔案

在 **`src/content/projects/`** 底下新增一個 `.md` 檔，檔名即為網址 slug（建議英文、小寫、連字號），例如：

- `src/content/projects/my-new-project.md`

### Step 2：填寫 Frontmatter

| 欄位 | 型別 | 說明 |
|------|------|------|
| `title` | string | 專案標題 |
| `description` | string | 一句話描述，用於卡片與 SEO |
| `pubDate` | date | 日期（YYYY-MM-DD），用於首頁與列表排序（新→舊） |
| `subtitle` | string（選填） | 詳情頁標題下方的副標 |
| `repoUrl` | string（選填） | 例如 GitHub 連結，詳情頁會顯示「View on GitHub」 |
| `metrics` | string[]（選填） | 標籤陣列，如 `["161 users", "AIGO Top 20"]`，顯示於卡片與詳情頁 |

### Step 3：撰寫內文

Frontmatter 下方用 Markdown 撰寫專案內容（例如 Business problem、Architecture、Technical highlight、Metrics & impact 等章節）。支援標題、列表、程式碼區塊。

### Step 4：建置與部署

`npm run build` 後，新專案會出現在：

- 首頁「Selected Projects / 精選專案」（取最新 4 筆）
- https://poirotw66.github.io/projects/
- https://poirotw66.github.io/projects/你的-slug/

---

## 新增一組 LINE 貼圖 (Adding a LINE Sticker Set)

每組貼圖對應**一個 slug**（檔名）與 **一個資源資料夾**，之後擴充多組貼圖時結構會保持清楚。

### Step 1：建立資源資料夾（與 slug 一致）

在 **`public/stickers/`** 底下新增一個資料夾，名稱即為該組貼圖的 **slug**（建議英文、小寫、連字號），例如：

- `public/stickers/my-new-set/`

將這組貼圖的圖片都放在此資料夾內，建議檔名：

- **預覽圖**：`preview.png`（或 `preview.svg`）
- **精靈圖／分鏡**（選填）：`sprite-1.png`、`sprite-2.png`、…（數量自訂）

### Step 2：新增 Markdown 檔案

在 **`src/content/stickers/`** 底下新增一個 `.md` 檔，**檔名請與 Step 1 的資料夾名稱相同**（即 slug），例如：

- `src/content/stickers/my-new-set.md`

### Step 3：填寫 Frontmatter

| 欄位 | 型別 | 說明 |
|------|------|------|
| `title` | string | 貼圖主題名稱 |
| `description` | string | 一句話介紹，用於卡片與 SEO |
| `lineStoreUrl` | string | LINE 貼圖小舖連結 |
| `image` | string（選填） | 預覽圖：填**檔名**（如 `preview.png`）會自動對應到 `/stickers/{slug}/preview.png`；若填絕對路徑（如 `/stickers/placeholder.svg`）則不變 |
| `spriteImages` | string[]（選填） | 精靈圖／分鏡檔名陣列，如 `["sprite-1.png", "sprite-2.png"]`，會顯示在詳情頁預覽區塊下方 |
| `pubDate` | date | 上架或更新日（YYYY-MM-DD），用於排序「最新先」 |

Frontmatter 下方可寫 Markdown，作為詳情頁的「創作秘辛」或發想概念。

### Step 4：建置與部署

`npm run build` 後，新貼圖會出現在：

- 首頁「LINE Stickers / LINE 貼圖」區（取最新 3 組）
- https://poirotw66.github.io/stickers/

Push 到 `main` 即由 GitHub Actions 部署。

---

## 專案結構 (Project Structure)

```
├── .github/workflows/deploy.yml   # GitHub Actions 部署流程
├── public/
│   ├── css/*.css                   # base/layout 與 page-scoped 樣式
│   ├── stickers/                  # 每組貼圖一資料夾，如 stickers/{slug}/preview.png、sprite-1.png
│   └── robots.txt                 # Sitemap 指向建置產生的 sitemap-index.xml
├── src/
│   ├── content.config.ts          # blog + paperReading + projects + stickers schema (Zod)
│   ├── content/
│   │   ├── blog/                  # 部落格 Markdown 文章
│   │   ├── paperReading/          # 雙語 Paper Reading 文章
│   │   ├── projects/              # 專案 Markdown（標題、描述、內文）
│   │   ├── stickers/              # LINE 貼圖清單（Markdown）
│   │   └── stickerTools/          # 貼圖工具清單（Markdown）
│   ├── layouts/
│   │   ├── Layout.astro           # 共用版型、nav、footer、SEO、GA4 loader
│   │   └── ...
│   ├── scripts/
│   │   └── siteAnalytics.ts       # GA4 自訂事件與 Web Vitals
│   └── pages/
│       ├── index.astro            # 首頁
│       ├── contact.astro          # 關於 / 聯絡
│       ├── en/                    # 英文路由（/en/*）
│       ├── stickers/
│       │   └── index.astro        # LINE 貼圖專區
│       ├── blog/
│       │   ├── index.astro        # 文章列表
│       │   └── [...slug].astro    # 單篇文章（由 MD 產生）
│       └── projects/
│           ├── index.astro        # 專案列表
│           └── [slug].astro       # 單一專案（由 MD 產生）
├── astro.config.mjs
├── package.json
└── README.md
```

效能與資源腳本的細節見 [`scripts/README.md`](scripts/README.md)；`npm run analyze:css` 是 CSS 靜態分析，不是 GA4 分析。

---

## 舊版靜態 HTML (Legacy Static HTML)

專案中仍保留舊的靜態 HTML（根目錄 `index.html`、`contact.html`、`blog/`、`projects/` 等）。目前部署來源為 **GitHub Actions 建置的 `dist/`**，因此線上站台為 Astro 版。舊檔可保留作參考或日後刪除，不影響現有部署。

---

## 授權條款 (License)

本專案採用 **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** 授權。

- **完整條款**：請見根目錄的 `LICENSE.txt`
- **官方說明**：`https://creativecommons.org/licenses/by-nc-sa/4.0/`
