# 開發、內容與 Analytics 操作說明

這份文件是 Bloss0m 日常維護的可執行基準。若 README、舊文章範例或其他筆記與 repository 的 `package.json`、`src/content.config.ts`、`.github/workflows/`、`src/layouts/Layout.astro` 不一致，以後者為準。

## 1. 開發環境

### 需求

- Node.js `>=22.12.0`，來源是 `package.json.engines.node`。
- npm lockfile 是 `package-lock.json`，乾淨安裝使用 `npm ci`。
- GitHub Actions 目前使用 Node 22；本機不可用 Node 18 或 20 取代目前建置環境。

### 常用流程

```bash
npm ci
npm run dev
```

開發伺服器預設為 `http://localhost:4321`。`npm run dev` 會先執行 `generate:covers`，所以第一次啟動可能會先生成封面衍生圖。

提交前至少執行：

```bash
npm run check:content
npm run check:tags
npm run check:i18n
npm run check:blog-format
npm run check:reading-quality
npm run build
```

`npm run build` 是部署前的主要 gate，會再執行 paper publication、英文內容、skills、editorial radar、Astro build、sitemap、CSS 與資源預算檢查。建置成功後可用：

```bash
npm run preview
```

`npm run analyze:css` 只分析 CSS 大小、選擇器與主題設定；它不是 Analytics／GA4 報表命令。

## 2. 新增雙語文章

### 檔案位置與配對

- 繁體中文：`src/content/blog/<slug>.md`
- 英文：`src/content/blog/en/<slug>.md`
- slug 使用現有數字前綴、英文小寫與連字號；中文與英文檔名必須相同。

### Frontmatter

必要欄位：`title`、`description`、`pubDate`、`category`。

`category` 只能使用 `src/data/blogTaxonomy.mjs` 中的值：

- `Enterprise AI`
- `AI Engineering`
- `Cloud & Platform`
- `Industry Pulse`
- `Creator Tools`
- `Startup`
- `Practice Notes`

目前內容流程常用 `updatedDate`、`tldr`、`audience`、`tags`、`cluster`、`clusterRole`、`clusterOrder`、`kind`、`showToc`、`image`。其中 `tldr` 與 `audience` 各為 1–4 項；`kind` 為 `article` 或 `guide`；topic cluster 使用時要讓 `cluster`、`clusterRole`、`clusterOrder` 共同描述同一條閱讀路徑。

`src/content.config.ts` 是 schema 真正來源；`scripts/validate-content.mjs` 另外檢查必要欄位、分類、圖片與本地連結；`scripts/validate-i18n.mjs` 檢查中英文檔案與共享結構欄位一致。

推薦的最小可用範例：

```md
---
title: "Your Post Title: Subtitle Here"
description: "One or two sentences for SEO and blog listing."
pubDate: 2026-09-09
updatedDate: 2026-09-09
tldr:
  - "The central decision or takeaway."
audience:
  - "Engineers evaluating production AI systems"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 99
kind: "article"
showToc: true
image: "/blog/your-post-slug/title_image.webp"
---

第一段要直接說明問題、範圍與主要判斷。

## Section heading

正文、證據與限制。
```

### 內容檢查順序

1. 新增或修改中英文檔案與封面。
2. `npm run check:content`：schema 前的檔案、分類、圖片與連結檢查。
3. `npm run check:tags`：確保 tag route 有 ASCII slug；需要時修改 `src/utils/tag.ts`。
4. `npm run check:i18n`：確認雙語配對及共享 metadata。
5. `npm run check:blog-format`、`npm run check:reading-quality`。
6. `npm run build`，再用 `npm run preview` spot-check `/blog/`、文章頁、圖片與內部連結。

## 3. Analytics 架構

本站有兩套用途不同的分析：

| 工具 | 用途 | 程式事件 |
| --- | --- | --- |
| Cloudflare Web Analytics | 無 cookie 的站台流量、來源與邊緣層概況；由 Cloudflare Automatic setup 收集。 | 不提供本 repository 的自訂事件 taxonomy。 |
| Google Analytics 4 | 頁面、互動、閱讀深度、Web Vitals 與內容路徑分析。 | Measurement ID `G-FKETRDJWMH`，定義在 `src/layouts/Layout.astro` 與 `src/scripts/siteAnalytics.ts`。 |

GA4 script 為效能考量，在首次 pointer/keyboard 互動或 `load` 後 5 秒才載入。事件會先進入 `dataLayer`；因此短暫停留且沒有互動、也沒有等到 5 秒的頁面，不能視為 GA4 已收到 page view。這是目前延遲載入策略的已知限制。

### 目前事件定義

| 事件 | 觸發條件 | 重要參數 | 可以回答什麼 | 不可以推論什麼 |
| --- | --- | --- | --- | --- |
| `article_read_75` | 文章閱讀區達到約 75% | `article_title`, `page_path` | 是否到達長文深度門檻 | 不代表完整讀完或理解內容 |
| `project_click` | 點擊站內 `/projects/` 連結 | `link_url`, `link_text` | 專案詳情入口被點擊 | 不代表看完專案或使用 repo |
| `paper_reading_path_click` | 點擊 Paper Reading 路徑 | `path_id` | 引導式閱讀是否被採用 | 不代表完成路徑 |
| `paper_reading_next_click` | 點擊 Paper Reading 下一步 | `next_kind`, `path_id` | 是否繼續閱讀 | 不代表下一頁成功載入 |
| `paper_essence_open` | 開啟 90 秒摘要 | `paper_slug` | 摘要是否被使用 | 不代表讀完摘要 |
| `rss_follow` | 點擊 RSS feed 連結 | `link_url`, `link_text` | RSS 訂閱意圖 | 不代表 RSS reader 已成功訂閱 |
| `contact_intent` | 點擊非 newsletter 的 `mailto:` | `contact_context`, `contact_channel=email`, `contact_action=mailto_click`, `contact_stage=click_only` | 使用者點擊寄出邀請的入口 | 不代表 Email client 開啟、信件寄出、邀請收到或被接受 |
| `newsletter_intent` | 點擊 newsletter `mailto:` | 同上，`contact_context=newsletter_pilot` | 電子報測試名單意圖 | 不代表加入名單或收到電子報 |
| `outbound_click` | 點擊站外 HTTP(S) 連結 | `link_url`, `link_text` | 外部資源出口被點擊 | 不代表外站載入成功 |
| `web_vital` | CLS、INP、LCP 回報 | `metric_name`, `metric_value`, `metric_rating` | 實際瀏覽器的 Core Web Vitals 訊號 | 不能取代 Lighthouse lab data |

`language_switch`、`related_article_click`、`article_internal_click`、`topic_path_click` 也會記錄，但目前主要用於導航與內容路徑診斷。`page_view` 則由 GA4 config 自動處理，受延遲載入策略影響。

事件參數送達後不會自動全部成為 GA4 報表維度。需要在 GA4 的 Custom definitions 建立 event-scoped custom dimensions 時，優先註冊 `contact_stage`、`contact_context`、`path_id`、`next_kind`、`paper_slug`、`metric_name`、`metric_rating`；`link_url`、`link_text`、`article_title` 可能是高基數值，先留在 DebugView／探索報表，不要一律註冊成正式維度。

### 聯絡事件的正確解讀

靜態 GitHub Pages 沒有表單後端、寄信 API 或收件 webhook。因此網站最多只能知道：

```text
contact_intent  = 使用者在網站上點了 mailto 連結
contact_received = 必須由信箱、郵件服務或 CRM 的外部紀錄確認
```

不要把 `contact_intent` 解讀成「收到邀請」，也不要在 `mailto` click 時送出虛構的 received event。若未來加入表單，只有在伺服器成功回傳並顯示成功狀態後，才新增獨立的 `contact_lead_submitted`；實際收件仍應以信箱／CRM 為準。

### 逐項驗證 GA4 送達與分類

1. 部署後開啟要測的頁面，網址加上 `?analytics_debug=1`（例如 `https://www.bloss0m.com/contact/?analytics_debug=1`）。此參數只在明確測試時開啟 GA4 `debug_mode`。
2. GA4 → Admin → DebugView，確認測試瀏覽器出現，並逐項執行下表互動。
3. 同時在瀏覽器 DevTools → Network 搜尋 `collect` 或 `google-analytics.com`，確認事件請求有送出；不要只看頁面上的 click 行為。
4. 在 DebugView 檢查事件名稱與參數值，特別是 `contact_stage=click_only`、`contact_context`、`next_kind`、`path_id`、`paper_slug`。
5. 再到 GA4 Realtime／Events 檢查事件是否進入一般報表；一般報表不是即時送達的第一個驗證位置。
6. Cloudflare Web Analytics 另開 dashboard 驗證流量，不要用它判斷 GA4 自訂事件是否送達。

建議的 smoke test：

| 頁面 | 操作 | 預期事件 |
| --- | --- | --- |
| `/blog/<slug>/` | 滾動到文章約 75% | `article_read_75` 一次 |
| `/paper-reading/` | 點一條 reading path | `paper_reading_path_click`，有 `path_id` |
| Paper Reading 文章 | 開啟 90 秒摘要，再按下一步 | `paper_essence_open`、`paper_reading_next_click` |
| `/projects/` | 點專案詳情 | `project_click` |
| `/now/` | 點 RSS | `rss_follow` |
| `/contact/` | 點任一邀請 Email CTA | `contact_intent`，`contact_stage=click_only`，`contact_context=speaking_invitation` |
| `/now/` | 點 Email 測試名單 | `newsletter_intent`，`contact_context=newsletter_pilot` |

如果事件沒有出現，依序檢查：是否使用正式部署網址、是否真的帶 `analytics_debug=1`、是否等到 GA script 載入、Network 是否被 ad blocker 擋下、事件元素是否仍符合 `siteAnalytics.ts` 的 selector，以及 GA4 property 是否就是 `G-FKETRDJWMH`。

## 4. 變更後的最小交付檢查

```bash
npm run check:content
npm run check:tags
npm run check:i18n
npm run check:blog-format
npm run check:reading-quality
npm run build
```

若有改動 `src/layouts/Layout.astro`、`src/components/`、`src/pages/` 或 `src/scripts/siteAnalytics.ts`，除了 build，也要依上面的 smoke test 重新驗證 GA4 事件；若只改 Cloudflare dashboard 設定，則要另外記錄 dashboard、日期範圍與驗證結果，因為那不會被 Git 追蹤。
