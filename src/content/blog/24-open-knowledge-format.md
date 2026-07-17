---
title: "Google Cloud 推出 Open Knowledge Format (OKF)：讓 AI Agent 讀懂企業知識的開放標準"
description: "深度解讀 Google Cloud 提出的 Open Knowledge Format (OKF) 規範。剖析如何將傳統 LLM-wiki 模式標準化，透過簡潔的 Markdown、YAML 前置屬性與互聯結構，打破企業知識孤島，為 AI Agent 提供可攜式、高互操作性的知識底座。"
pubDate: 2026-06-16
updatedDate: 2026-06-16
tldr:
  - "深度解讀 Google Cloud 提出的 Open Knowledge Format (OKF) 規範"
  - "剖析如何將傳統 LLM-wiki 模式標準化，透過簡潔的 Markdown、YAML 前置屬性與互聯結構，打破企業知識孤島，為 AI Agent 提供可攜式、高互操作性的知識底座"
  - "將企業內部中斷的 中繼資料 與 Runbook，轉化為人機共讀的 Lingua Franca"
audience:
  - "追蹤 AI 產品與產業動態的工程師與產品人"
  - "需要快速掌握重點再決定是否深挖的讀者"
category: "Technology"
tags: ["Google Cloud", "Open Knowledge Format", "AI Agent", "RAG", "中繼資料"]
image: "/blog/24-open-knowledge-format/title_image.webp"
subtitle: "將企業內部中斷的 中繼資料 與 Runbook，轉化為人機共讀的 Lingua Franca"
kind: guide
showToc: true
---

![Open Knowledge Format（OKF）— 讓 AI Agent 讀懂企業知識的開放標準](/blog/24-open-knowledge-format/title_image.webp)

隨著大語言模型（LLM）與 AI Agent 的快速演進，限制模型能力的往往不再是參數規模，而是**「缺乏相關的 Context（上下文環境）」**。雖然 LLM 在編寫程式碼、總結文檔或分析資料方面表現出色，但如果沒有正確、即時的背景資訊，它們就無法產生精確且可落地的答案。

在多數企業中，這些背景資訊通常是高度碎片化且被鎖死在各個系統中的：
- 資料庫的 Schema（綱要）和表結構。
- 企業內特定指標（Metrics）的商業定義。
- 系統故障的運行手冊（Runbook）或排障流程。
- 資料系統之間的關聯路徑。
- 舊 API 的棄用通知。

為了打破這些知識孤島，Google Cloud 資料團隊於 2026 年 6 月 12 日正式推出了一項名為 **Open Knowledge Format (OKF)** 的開放規範（相關程式碼已於 GitHub 開源）。OKF 旨在將近來流行的 **「LLM-Wiki」** 模式正式化，提供一個廠商中立、對 AI Agent 和人類都極其友善的知識表示標準。

以下為您深度解讀這一全新規範的核心內涵、工作原理與設計哲學。

---

### §1 什麼是 Open Knowledge Format (OKF)？

**「OKF 不是一個新的資料服務，也不是另一個 SaaS 平台，它只是一種『知識表示格式』。」**

OKF 的核心結構非常簡單，本質上就是**一個包含 Markdown 文件與 YAML Frontmatter（前置屬性）的目錄結構**。它具備以下三個「僅有」的特點：

1. **僅有 Markdown**：可在任何編輯器中閱讀，能在 GitHub 上渲染，並能被任何搜尋引擎直接索引。
2. **僅有檔案（Files）**：可以打包成 tar 包，託管在任何 Git 儲存庫中，或掛載到任何檔案系統中。
3. **僅有 YAML Frontmatter**：用於定義少數需要被結構化查詢的關鍵欄位：
   - `type`：（唯一強制要求的欄位，例如 table、metric、playbook）
   - `title`：（概念名稱）
   - `description`：（概念的簡要描述）
   - `resource`：（關聯的底層資源標識）
   - `tags`：（分類標籤）
   - `timestamp`：（時間戳）

如果您使用過 Obsidian、Notion、Hugo，或者熟悉近一年來興起的 `CLAUDE.md` / `AGENTS.md` 等 Agent 約定檔案，您會對 OKF 的形態感到非常熟悉。OKF 正是將這些實踐經驗提煉為一套標準的互操作規範。

---

### §2 碎片化的 Context 景觀與 Living Wiki 模式

當 AI Agent 被問到：*「如何從事件流中計算我們的每週活躍用戶（WAU）？」* 時，它必須從中繼資料目錄、程式碼註釋、內部 Wiki 甚至是資深工程師的腦海中拼湊答案。現有的解決方案往往被各家目錄廠商的 SDK 或知識圖譜 Schema 所綁定，無法在不同產品或組織之間移植。

這導致每個 Agent 開發者都在重複造輪子，企業知識也被牢牢鎖死在創建它的工具中。

#### 2.1 知識作為 Living Wiki（動態維基）
開發團隊正在改變建構 AI Agent 的方式：不再讓模型反覆搜尋相同的文檔，而是為 Agent 提供一個**共享的 Markdown 知識庫**。
AI 領域的知名學者 Andrej Karpathy 在其熱門的 [LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) 中指出：**「LLM 不會感到無聊，不會忘記更新交叉引用，並且可以一次性修改 15 個檔案。」** 人類因為嫌繁瑣而容易放棄維護個人 Wiki，而這種枯燥的「簿記與更新工作」恰恰是 LLM 最擅長的。

OKF 便是這一背景下的產物。它統一了資料夾內檔案的命名規則、交叉鏈接方式，讓分散的 Wiki 能夠真正合作，共同為 AI Agent 提供精確的 Context 支撐。

---

### §3 OKF 的三大設計原則

OKF 的規格極其精簡，其 v0.1 規範只佔用了一個單頁，背後貫徹了三大設計哲學：

#### 1. 極簡主義（Minimally opinionated）
OKF 對每個概念檔案僅強制要求一個 `type` 欄位，其餘的屬性（包含具體有哪些類型、正文結構、附加欄位）完全交由知識的生產者決定。規範定義的是**互操作性的邊界**，而非具體的內容模型。

#### 2. 生產者與消費者解耦（Producer/Consumer Independence）
OKF 乾淨地分離了「誰編寫知識」與「誰使用知識」。
- 一個由**人類手寫**的 Markdown 知識庫，可以被 AI Agent 直接讀取。
- 一個由**中繼資料匯出管線自動生成**的知識束（Bundle），可以直接在視覺化工具中渲染。
- 一個由 **LLM A 生成**的知識庫，可以被 **LLM B** 進行查詢。
格式是唯一契約，兩端的工具均可獨立替換。

#### 3. 是格式，而非平台（Format, not platform）
OKF 不與任何雲端廠商、資料庫、模型提供商或 Agent 框架綁定，閱讀和寫入它不需要任何專有帳號或 SDK。Google 資料團隊表示，開放標準的價值來自於有多少人使用它，而非誰擁有它。

---

### §4 開源生態系與工具鏈

為了加速 OKF 的落地，Google 團隊在發布規範的同時也開源了以下實用的生態工具：

- **自動化資料增強 Agent (Enrichment Agent)**：一個可以掃描 BigQuery 資料集的參考實現。它會為每個表和視圖草擬 OKF 概念檔案，再通過第二階段的 LLM 爬取權威文檔，將引用來源、Schema 和 Join 路徑增強至檔案中。
- **無後端視覺化工具 (Visualizer)**：能將任何 OKF Bundle 轉換為一個交互式關係圖的單個 HTML 檔案。無需安裝，無後端，且任何資料都不會離開瀏覽器頁面。
- **現成樣例束 (Sample Bundles)**：GitHub 儲存庫中提供了 GA4 電商資料集、Stack Overflow 以及比特幣公共資料集的標準 OKF 樣例，可供開發者直接查閱。

此外，Google Cloud 自身的 **Knowledge Catalog（知識目錄）** 也已完成升級，原生支援匯入 OKF 格式的知識束並將其服務給內置的 AI Agent。

---

### §5 總結：未來的 Lingua Franca

Open Knowledge Format (OKF) 是一次將「人機共讀知識庫」標準化的重要嘗試。在 RAG 和 AI Agent 走向深入的今天，擺脫複雜且容易出錯的 PDF/HTML 解析，將企業知識沉澱為一套基於 Git 版本管理、人機通行的 Markdown-wiki，正在成為大勢所趨。

無論您是建構中繼資料目錄、自動化資料增強管線，還是專為 AI Agent 設計的企業 Wiki，OKF 都提供了最佳的通用語言（Lingua Franca）。

> **瞭解更多**：
> - Google 官方部落格原文：[How the Open Knowledge Format can improve data sharing](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing/)
> - 完整規範與開源工具鏈：[GitHub - GoogleCloudPlatform/knowledge-catalog (OKF)](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf)
