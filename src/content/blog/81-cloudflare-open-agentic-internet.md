---
title: "Cloudflare 發布 Open Agentic Internet 藍圖：可讀、可搜尋、可呼叫、可付費的 Agent Web 架構"
description: "深度剖析 Cloudflare 提出的 Agentic Internet 基礎架構。從 Web Bot Auth 身份驗證、Markdown for Agents、WebMCP 前端工具暴露到 x402 微支付協定，全方位解析網頁如何從人類 UI 轉型為 AI Agent 友善的開放網路。"
pubDate: 2026-08-07
updatedDate: 2026-08-07
tldr:
  - "解讀 Cloudflare 針對 AI Agent 新型訪客提出的開放網路架構：Readable、Discoverable、Callable、Payable。"
  - "剖析 WebMCP 讓網站直接暴露 JavaScript 工具鏈，以及 x402 協定打造無摩擦微支付的運作機制。"
audience:
  - "關注 AI Agent 基礎架構、MCP 協定發展與邊緣運算架構的 AI 工程師與產品團隊。"
  - "思考 AI 流量變現、Bot 治理與 Web 轉型的企業技術決策者。"
category: "Cloud & Platform"
tags: ["AI Agent", "MCP", "Platform Engineering", "Enterprise AI", "架構模式"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 4
kind: "article"
showToc: true
image: "/blog/81-cloudflare-open-agentic-internet/title_image.webp"
---

網頁瀏覽器的 `User-Agent` 請求標頭自網際網路誕生以來就一直存在，但直到 AI Agent 爆發的今天，這個詞才真正回歸字面含義：**一個代表人類使用者在網頁上自主執行任務的代理程式（User's Agent）**。

根據 Cloudflare 的網路流量監測資料，目前網路上有數以億計的自動化 Request 來自合規的 AI Bot，但高達數十億次的請求只是在重複抓取根本沒有更新的網頁。這種「用人類網頁介面接待 AI 訪客」的模式，造成了龐大的 Token 浪費與無效益的邊緣運算成本。

為了打破 AI 抓取者與網站出版商之間的對立，Cloudflare 於近期提出了 **Open Agentic Internet（開放 Agent 網際網路）** 藍圖。本文將從系統架構、開放標準與商業模式的角度，深度解析 Cloudflare 如何推動網頁走向「可讀、可搜尋、可呼叫、可付費」的四維轉型。

> **花花的判斷**
>
> 傳統 Web 流量以「廣告與點擊 (Ads & Impressions)」為核心商業模式，但在 AI Agent 時代，Agent 讀取網頁不看廣告也不渲染 CSS。如果網路不提供「可呼叫 (Callable)」與「可付費 (Payable)」的原生協定，網站主只能選擇全面封鎖 AI，最終導致網際網路分裂為牆內的封閉平台。Open Agentic Internet 是讓開放網路保持存活的關鍵技術轉型。

> **花花的工程提醒**
>
> 前端與平台工程團隊應密切關注 WebMCP 的發展。過去 Agent 透過 DOM 爬取與 UI 模擬（如 Puppeteer）操作網頁非常脆弱且耗費 Token。WebMCP 讓前端可以在 `document.modelContext` 直接註冊 JSON-Schema 導向的 Tool 介面，讓 Agent 直接呼叫原生 JS 函數，大幅降低錯誤率與 Context 負擔。

## 核心痛點：當新型訪客踏入人類的 Web 空間

AI Agent 是一種全新形態的網站訪客。它們不渲染 CSS、不載入廣告指令碼、也不會在 Hero Header 停留。然而，每一個 Agent 請求背後都有一個正在付費的人類使用者或企業。

如果網站直接封鎖 Agent，等於將潛在客戶拒之門外；但如果將 Agent 視為普通爬蟲，網站主將承受高昂的頻寬與 Compute 成本，卻無法透過傳統廣告或訂閱模式獲得補償。

Cloudflare 提出的 Open Agentic Internet 旨在透過開放協定建立生態共識，將網際網路轉型為具備四大特性的 Agent 生態系：

1. **Readable（可讀性）**：讓 Agent 以最低 Token 成本與最乾淨的形式獲取內容。
2. **Discoverable（可發現性）**：讓 Agent 能結構化地搜尋資源並評估網站的可信度與能力。
3. **Callable（可呼叫性）**：讓網站將互動功能直接暴露為結構化 Tool API，不再依賴脆弱的 DOM 解析。
4. **Payable（可付費性）**：提供微支付（Micro-payments）機制，讓內容與 API 的使用能獲得即時補償。

## Open Agentic Internet 的四大技術柱石

### 1. Readable：伺服器與用戶端的文字優化

在傳統網頁中，HTML 標籤、CSS 樣式與追蹤碼佔據了回應體積的大部分。當 AI Agent 讀取這些網頁時，無效資訊會急遽污染 LLM 的 Context Window。

* **Markdown for Agents**：伺服器端可根據 Agent 請求自動回傳結構化的 Markdown 內容，省去解析 HTML 的 Token 開銷。
* **Kitesurf**：Cloudflare 推出專為 Agent 設計的極輕量無頭瀏覽器，可直接運行在 Cloudflare Workers 邊緣節點上，按需啟動並在任務結束後立即銷毀，去除任何人類 UI 的贅餘開銷。

### 2. Discoverable：Agent 搜尋與 AEO 可見度

Agent 的探索不依賴人類點擊關鍵字與瀏覽搜尋結果頁。

* **AI Search**：允許公共網站直接開放讓 Agent 進行結構化檢索的 API 介面。
* **Agent Engine Optimization (AEO)**：類似傳統的 SEO，AEO 用於量測品牌或內容在各大 AI 模型與 Agent 中的可見度與推薦權重。若網站無法被 Agent 結構化索引，在 Agentic Web 中將形同離線。

### 3. Callable：WebMCP 與 Code Mode 工具暴露

過去 Agent 要在網頁上執行動作（如加入購物車或預訂餐廳），必須依賴電腦視覺或爬蟲解析 DOM。一旦網站更新 HTML 類別名稱，Agent 便會崩潰。

Cloudflare 推出的 **WebMCP** 讓網站可以直接透過 JavaScript 在瀏覽器情境中註冊 MCP 工具：

```javascript
document.modelContext.registerTool({
  name: "add-todo",
  description: "Add a new item to the user's active todo list",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "The todo item text" }
    },
    required: ["text"]
  },
  async execute({ text }) {
    await addTodoItemToCollection(text);
    return { content: [{ type: "text", text: `Added: "${text}"` }] };
  }
});
```

當 Agent 造訪該網頁時，可以直接讀取 `document.modelContext` 所提供的 Tool 清單，並在使用者目前的 Session 授權下精準執行函數。此外，**Code Mode** 允許 Agent 直接撰寫小段程式碼來批次呼叫 Endpoint，比起自然語言 Prose 工具呼叫具備更高的執行效率與精準度。

### 4. Payable：x402 協定與微支付網關

廣告模式在 Agent Web 中失效，而按月訂閱（Seat-based model）對機器訪客而言過於僵硬。Open Agentic Internet 引入了以 **x402** 為基礎的開放微支付標準。

Agent 攜帶使用者授權的數位錢包（Wallets）與預算上限造訪網站。當讀取付費文章或呼叫高價值 API 時，伺服器可透過 **Monetization Gateway** 發出 HTTP 402 Payment Required 狀態碼，Agent 即時完成微厘等級（Fraction of a cent）的代幣交易並取得訪問權限。

| 維度 | 傳統 Human Web | Open Agentic Internet |
| :--- | :--- | :--- |
| **主要訪客** | 人類（使用瀏覽器點擊 UI） | AI Agent（自動化執行任務） |
| **內容呈現 (Readable)** | HTML / CSS / JS 渲染頁面 | Markdown for Agents / Kitesurf 邊緣擷取 |
| **互動方式 (Callable)** | 表單提交 / 點擊 DOM 按鈕 | WebMCP / Code Mode 原生 Tool 呼叫 |
| **身份認證 (Identity)** | Cookie / OAuth 帳號登入 | Web Bot Auth 簽名 / PACT 匿名無痕憑證 |
| **商業模式 (Payable)** | 蓋版廣告 / 訂閱制 / 人頭授權 | x402 微支付網關 / 按次付費代幣 |

## 身份、信任與安全治理：Web Bot Auth 與 PACT

在開放網路中，如何區分「善意授權的 Agent」與「惡意抓取的 Scraper」是安全治理的核心。Cloudflare 聯合業界標準推動兩大信任機制：

1. **Web Bot Auth**：允許 Bot 在發起 HTTP 請求時進行密碼學數位簽名，驗證其身份與所屬機構，徹底杜絕 User-Agent 偽造問題。
2. **PACT (Private Access Control Tokens)**：Cloudflare 與 Mozilla、Google、Microsoft 及 Shopify 合作開發的隱私優先協定。當使用者在某一信任網站登入後，網站可簽發 PACT 憑證，讓 Agent 能夠在保護使用者個人隱私的前提下，向第三方網站證明其合規身份。

## 架構實施與營運建議

對於正在進行 AI 轉型與邊緣架構規劃的團隊，建議採取以下三階段推進：

1. **短中期：開放 Markdown 存取與 AEO 檢測**
   評估重要 API 與文件頁面是否具備簡潔的 Markdown 輸出能力，並透過 AEO 工具檢視品牌在 LLM 索引中的呈現狀況。
2. **中期：試行 WebMCP 前端介面**
   針對高頻互動的 Web 應用（如 SaaS 控制台或電商購物車），嘗試使用 WebMCP 規範將核心表單邏輯封裝為標準 Tool，減少 Agent 抓取的錯誤率。
3. **長期：規劃 x402 微支付與 Bot Auth 整合**
   追蹤 x402 與 Web Bot Auth 的標準演進，逐步將被動的 WAF 阻擋策略升級為「授權付費通行」彈性控制。

## 延伸閱讀與參考資源

* [AI Agent 架構設計指南](/blog/64-ai-agent-guide/)：全面解析 Agentic 系統的控制迴圈與工具調用架構
* [Model Context Protocol (MCP) 技術演進](/blog/34-model-context-protocol-mcp/)：深入了解 MCP 協定的無狀態核心與擴充設計
* [Google Agentic Resource Discovery (ARD) 規範](/blog/28-google-agentic-resource-discovery/)：檢視分散式多 Agent 發現與連線標準
* 原文參考：Cloudflare 官方部落格 [Building an open Agentic Internet](https://blog.cloudflare.com/the-agentic-internet/)
* 支付標準：[x402 Protocol Specification](https://x402.org/)
