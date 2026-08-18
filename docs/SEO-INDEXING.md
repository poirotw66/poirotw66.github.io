# Search Console 索引診斷與修復（bloss0m.com）

依據 2026-08-14 Search Console「網頁索引」匯出（`所有已知的頁面`）：

| 項目 | 網頁數 |
|------|--------|
| 已建立索引 | 691 |
| 未建立索引 | 1,783 |
| 已檢索 - 目前尚未建立索引 | 1,016 |
| 已找到 - 目前尚未建立索引 | 295 |
| 找不到網頁 (404) | 244 |
| 頁面會重新導向 | 111 |
| 替代頁面（有適當的標準標記） | 111 |
| 遭到「noindex」標記排除 | 4 |
| 轉址式 404（soft 404） | 2 |

建置實際只產出 **405 個可索引 URL**（`npm run build` 後的 `dist/sitemap-0.xml`），Search Console 卻認得 2,474 個。差距代表大量 URL 不是目前站台的正式網址，Google 仍在花費檢索預算重複造訪。

## 一、已在程式碼修掉的部分

| 問題 | 修法 |
|------|------|
| `/en/404/` 以 HTTP 200 回應（soft 404），而且被送進 sitemap | `NotFoundContent.astro` 加上 `noindex`，並由 sitemap 收尾腳本移除 |
| `/search/`、`/en/search/` 站內搜尋頁進入索引（Google 明確不建議索引站內搜尋結果） | `SearchContent.astro` 加上 `noindex` 並移出 sitemap |
| 稀薄的標籤 / 系列頁灌爆「已檢索 - 目前尚未建立索引」，且標籤一旦從最後一篇文章移除就會變成 404 | 少於 `MIN_INDEXABLE_TAG_POSTS`（3 篇）的標籤頁、少於 `MIN_INDEXABLE_SERIES_ENTRIES`（2 篇）的系列頁改為 `noindex, follow`（見 `src/utils/seo.ts`），共 47 個 URL 退出 sitemap |
| sitemap 沒有 `lastmod`，Google 無從判斷該重新檢索誰 | `scripts/finalize-sitemap.mjs` 由每頁 JSON-LD 的 `dateModified`/`datePublished` 補上；hub 頁沿用底下最新的日期 |
| sitemap 沒有 hreflang，中英雙語版本容易被判為重複 | 同一支腳本補上 `xhtml:link`（`zh-Hant` / `en` / `x-default`） |
| 文章重新命名 `81-cloudflare-open-agentic-internet` → `86-…` 沒有留轉址，舊網址直接 404 | 補進 `src/data/legacyRedirects.mjs`（由 `astro.config.mjs` 載入） |
| Open Graph 用了錯誤的 `og:article:*` 前綴 | 改為標準的 `article:published_time` / `article:modified_time` / `article:author` |
| GitHub Pages 大小寫敏感：檔名 `04-RAG-MCP.md` 的公開網址是小寫 `/paper-reading/04-rag-mcp/`，舊的大小寫網址 404 | `legacyRedirects.mjs` 依檔名自動產生大小寫轉址（中英各一份） |
| 標籤從中文改成 ASCII slug 後，`/blog/tag/論文閱讀/` 這類舊網址 404 | 依 `TAG_SLUG_MAP` 產生標籤轉址 |
| 論文檔名曾用底線／空白、部落格曾用短 slug 或未編號檔名 | 補進 `CONTENT_MOVES`（含 AlexNet 從 `/blog/` 搬到 `/paper-reading/`） |
| 站內連結寫成 `poirotw66.github.io/...` 或缺 trailing slash、打成 `07-graph-rag-vs-rag` | 改成站內相對路徑，並為錯誤 slug 留轉址 |
| `/blog/foo/index.html` 與 `/blog/foo/` 內容重複（canonical 正確，但仍佔檢索預算） | `robots.txt` 禁止 `/*index.html$`；sitemap 也剔除 `.json` / `.xml` / `index.html` |

結果：sitemap 從 405 → **358 個 URL**，其中 344 個帶 `lastmod`、358 個帶 hreflang。被拿掉的頁面仍然存在、仍可被檢索，只是不再主動送給搜尋引擎。舊網址改為 Astro 靜態轉址頁（HTTP 200 + `noindex` + canonical；GitHub Pages 無法發真正的 301）。

## 二、需要在 Search Console / DNS 手動確認的部分

程式碼看不到線上實際回應，以下請自行核對：

1. **確認資源類型。** 若 GSC 是「網域資源」（Domain property），`bloss0m.com`、`www.bloss0m.com`、`http://`、`https://` 會一起計入。111 筆「頁面會重新導向」很可能就是 apex → www 的轉址，屬正常，不需處理。
2. **確認 apex 網域有正確轉址到 `www`。** 參考 `docs/CUSTOM-DOMAIN-DNS.md`。若 apex 沒設定，Google 會持續累積無法解析的 URL。
3. **匯出 404 清單逐一分類。** GSC →「網頁索引」→「找不到網頁 (404)」→ 匯出。
   - 舊文章網址 → 補進 `src/data/legacyRedirects.mjs` 的 `CONTENT_MOVES`（會自動加上 `/en/` 配對）。
   - 已刪除、沒有後繼內容的網址（例如拿掉的草稿）→ 讓它 404 即可。
   - 已遷移的中文標籤 → 已由 `TAG_SLUG_MAP` 轉址；真正空掉的標籤頁維持 404。
   - 完全陌生的網址 → 通常是外部亂連，忽略。
4. **檢查「已檢索 - 目前尚未建立索引」的樣本。** 若大量是 `/en/` 頁面，代表 Google 認為英文版價值不足；優先強化英文版標題／描述的差異化與內外部連結，而不是再增加頁數。
5. **重新提交 sitemap。** 部署後在 GSC 重新提交 `https://www.bloss0m.com/sitemap-index.xml`，並對幾個重點頁面用「網址審查 → 要求建立索引」。

## 三、避免問題重現

- 重新命名文章檔名時，**必須**同步在 `src/data/legacyRedirects.mjs` 的 `CONTENT_MOVES` 補上中文路徑；英文 `/en/` 會自動配對。
- 論文 Markdown 若使用大小寫檔名，不必手寫轉址，建置時會從檔名產生。
- 調整 frontmatter `tags` 時要留意：把某個標籤從最後一篇文章移除，就等於刪掉一個曾被檢索的 `/blog/tag/<slug>/` 網址。標籤請沿用既有詞彙，別為單篇文章發明新標籤。
- 新增「不該被索引」的頁面時，在 `<Layout>` 上加 `noindex` 即可；`scripts/finalize-sitemap.mjs` 會自動讓 sitemap 與頁面宣告保持一致。
- 站內互連請用相對路徑（`/paper-reading/.../`），不要寫 `https://poirotw66.github.io/...`。
