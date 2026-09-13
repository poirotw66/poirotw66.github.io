---
title: "LINE Chatbot · n8n 工作流平台"
description: "基於 n8n 建構的 LINE Chatbot，以 Google Gemini 分析用戶輸入並智能路由至 19 個子流程，涵蓋 RAG、事實查證、新聞、圖像生成與網頁爬取。"
pubDate: 2025-01-01
updatedDate: 2026-07-27
tldr:
  - "以 n8n 建構的 LINE Chatbot 平台，透過 Gemini 語意路由分派多元 AI 任務"
  - "主流程專注於 Webhook 與意圖分流，19 個子流程各自獨立維護（RAG、查證、新聞、圖像等）"
  - "建立統一 Result Adapter 與長文分段機制，符合 LINE Messaging API 訊息契約"
audience:
  - "想了解真實專案架構、技術取捨與落地成效的工程師、技術主管與產品團隊。"
  - "需要具體成果數據與技術選型參考，而不只是概念 Demo 的讀者。"
tier: flagship
featuredOrder: 1
subtitle: "n8n · Google Gemini · LINE Messaging API · 多代理路由"
repoUrl: "https://github.com/poirotw66/n8n_workflow"
metrics:
  - "1 主流程 + 19 子流程"
  - "Google Gemini"
  - "RAG · FACT · 圖像 · 新聞"
impact: "1 個主流程模組化路由至 19 個獨立子流程（RAG、查證、圖像、新聞）"
image: "/projects/agentic-ai-platform/title_image.webp"

---


## Context（情境）

LINE 作為企業對外或內部溝通管道時，使用者會提出技術問題、新聞查詢、圖片生成等多元需求。情境需要**單一入口**接收訊息後，依內容類型自動分流至對應能力（RAG、事實查證、新聞、圖像、爬蟲等），並將回覆格式化送回 LINE。

## Challenge（痛點）

- 若每種需求各建一個 Bot，維護與體驗分散；若單一流程處理所有類型，邏輯龐大難以擴充。
- 需以 AI 辨識意圖並路由至正確子流程，且回覆需符合 LINE 顯示（長文分段最多 5 則等）。

## Solution（架構＋做法）

提供一個**智慧化 LINE 自動回覆機器人**：使用者傳送訊息後，由 **Google Gemini** 分析內容類型，並**模組化路由**到對應的子流程處理，涵蓋技術文件摘要、事實查證、RAG 知識檢索、新聞與股票、圖像生成、網頁爬取等，最後將回覆格式化並送回 LINE（支援長文自動分段，最多 5 則）。

### 架構概覽

**主流程 [MAIN] LINE CHATBOT**：接收 LINE Webhook → 呼叫 Gemini 分析訊息 → 依內容類型路由至子流程 → 彙整 AI 回應 → 分段發送回 LINE。

**19 個子流程模組** 分為：
- **AI 代理類**：1399 RAG、MCP RAG、RAG Pipeline、ITR、FACT、CB、DR
- **資訊處理類**：NEWS、News Agent Scrape、STOCK
- **圖像處理類**：IMAGE Generator、Food Image、Image Editing、Image Module
- **網頁處理類**：WEB、LINE CHATBOT Crawl
- **工具支援類**：SUBS Module、Database Query Tool、FACT linebot 流程

```text
LINE Webhook → [MAIN] LINE CHATBOT (Gemini 意圖分析) → 路由 dispatch
    ├── RAG (知識庫檢索)
    ├── FACT (事實查證)
    ├── NEWS / STOCK (即時資訊)
    ├── IMAGE (圖像生成與編輯)
    └── WEB / CRAWL (網頁萃取)
    → Result Adapter 正規化 → 長文分段 (≤ 5 則) → LINE Reply API
```

### 代表路徑分析：技術文件查詢 (RAG)

以使用者詢問「這份技術文件如何部署？」為例：
1. **Webhook 接收**：主流程接收 LINE POST 請求並抽取使用者文字與 `replyToken`。
2. **意圖判斷**：Gemini 分析文字語意，判定為 `TECH` / `RAG` 類別，回傳標準化 dispatch payload。
3. **子流程執行**：觸發 `1399 RAG` 子流程，向後端知識庫發送查詢並等待結果。
4. **結果轉接與分段**：透過 `Result Adapter` 將回傳文字格式化為繁體中文、500 字以內摘要，若文字過長自動切分為最多 5 則 LINE 訊息 Bubble，送出回覆。

### 異常處理邊界與個人職責

- **已實作之防護**：
  - 外部 API 呼叫逾時保護與降級文字回覆。
  - LINE Webhook Token 一次性校驗，避免重複處理。
  - 憑證管理：API tokens 全數移出程式碼並以環境變數注入。
- **待正式環境補足項目**：
  - 跨模組分散式 Tracing（目前依賴 n8n 內建 Execution log）。
  - 自動重試指數退避（Exponential Backoff）與熔斷器。
  - 人工客服接手流程（Human-in-the-loop fallback）。
- **職責邊界**：本人負責 n8n 工作流拓撲架構、意圖分流契約設計、子流程模組拆分與 LINE Messaging API 介面串接；所整合之 Google Gemini、Jina 等模型能力屬於第三方 API，非本人研發。

## 工作流示意（可搭配 n8n 課程流程圖）

以下為 n8n 工作流層級概念示意；實際主流程與子流程圖可於 [GitHub 展示站](https://poirotw66.github.io/n8n_workflow/) 查看。
### n8n 工作流 Level 1
![n8n 工作流 Level 1](/projects/n8n-course/n8n_lv1.webp)
### n8n 工作流 Level 2 範例 1
![n8n 工作流 Level 2 範例 1](/projects/n8n-course/n8n_lv2_workflow1.webp)
### n8n 工作流 Level 2 範例 2
![n8n 工作流 Level 2 範例 2](/projects/n8n-course/n8n_lv2_workflow2.webp)

## 技術棧與亮點

- **n8n** — 可視化工作流設計與執行
- **Google Gemini** — 訊息分析與回應生成
- **LINE Messaging API** — Webhook 接收與回覆
- **RAG / MCP RAG / FACT** — 知識檢索與事實查證
- **模組化** — 每項功能獨立子流程，易維護與擴充
- **GitHub Pages** — 工作流說明與流程圖展示站：[poirotw66.github.io/n8n_workflow](https://poirotw66.github.io/n8n_workflow/)

## Impact（架構成果與限制）

- **拓撲成果**：**1 主流程**（LINE Webhook → Gemini 意圖分析 → 路由）+ **19 個子流程**，將不同功能的開發與故障隔離，避免單一流程節點膨脹。
- **統一交付契約**：單一 LINE 對話窗口即可支援多種異質任務，透過 Result Adapter 維持一致的終端呈現。
- **限制說明**：本專案為工作流架構與分流能力展示，未具備正式生產環境之高併發監控與 SLA 紀錄，不宣稱營運穩定性保證。

## Extension（可延伸方向）

- 新增更多子流程（如訂單查詢、表單填寫、預約排程），持續擴充能力邊界。
- 將主流程意圖分析改為可訓練或可設定的規則，降低對單一模型的依賴。
- 串接內部 API 或 CRM，從對話到業務動作一站完成。

## 相關連結

- **Repository**：[github.com/poirotw66/n8n_workflow](https://github.com/poirotw66/n8n_workflow)
- **展示網站**（流程圖與說明）：[poirotw66.github.io/n8n_workflow](https://poirotw66.github.io/n8n_workflow/)
