---
title: "TrendScope 會議趨勢平台"
description: "以 Gemini、BigQuery 與 FastAPI 打造的會議內容處理與報告生成平台，從逐字稿、簡報與爬蟲結果自動整理出結構化趨勢報告。"
pubDate: 2025-03-01
tier: main
subtitle: "Gemini · BigQuery · FastAPI · Web Scraper · 報告自動化"
repoUrl: "https://github.com/poirotw66/TrendScope"
metrics:
  - "Gemini AI 摘要"
  - "BigQuery 數據管理"
  - "FastAPI · 前後端分離"
impact: "手動整理會議重點 → 一鍵產出結構化報告"
---

## 概述

**TrendScope** 是一套專為技術研討會與大型活動設計的**會議趨勢分析平台**。它能批次處理逐字稿、簡報與爬蟲取得的網頁內容，透過 Google Gemini 產生結構化摘要，並將結果寫入 BigQuery，再由後端 API 與前端介面生成 Markdown / HTML 報告，協助團隊快速掌握會議重點與技術趨勢。

[報告展示頁面](https://poirotw66.github.io/TrendScope/)
## 功能重點

- **批次處理與 AI 摘要** — 以腳本批次讀取會議逐字稿與簡報內容，呼叫 Gemini API 產生多層級摘要（場次摘要、主題分類、整體趨勢）。
- **主題與類別整理** — 依技術主題（例如 LLM、MCP、MLOps、Data）整理場次內容，產生可瀏覽的分類頁面。
- **Web 爬蟲整合** — 內建多個研討會網站爬蟲模組，統一抽取議程資訊與描述文字，寫入 BigQuery 後再交由 AI 整理。
- **BigQuery 數據管理** — 以 BigQuery 作為會議資料中樞，方便查詢場次、講者與主題統計，支援後續儀表板或 BI 報表整合。
- **報告自動生成** — 由腳本與 FastAPI 後端自動生成 Markdown / HTML 報告，包括首頁總覽、類別頁與場次細節，對應到 GitHub Pages 示範網站。

## 架構與模組

專案核心結構如下（節錄）：

```text
TrendScope/
├── base/              # 後端 API 與核心模組
│   ├── api/           # FastAPI 應用與路由
│   ├── bigquery/      # BigQuery 客戶端與模式定義
│   ├── scrapers/      # 研討會爬蟲與解析器
│   ├── gcs/           # Google Cloud Storage 相關工具
│   └── utils/         # 共用工具（記錄、錯誤處理等）
├── config/            # 設定與 Pydantic-based 設定管理
├── scripts/           # 批次處理腳本（摘要、類別頁、首頁等）
├── frontend/          # React 前端（報告瀏覽介面）
└── data/output/logs   # 輸入資料、輸出報告與記錄
```

- **FastAPI Backend** — 提供 PPT/PDF 上傳、爬蟲管理、BigQuery 查詢與報告生成 API，並有 `/docs` Swagger 文件與健康檢查端點。
- **Gemini Summary Pipeline** — 由 `01_batch_summarize_process.py` 等腳本觸發，將原始文字轉為結構化摘要，並寫入 BigQuery 或輸出為 Markdown。
- **Scraper 模組** — 對不同研討會網站實作 parser 與抽取邏輯，統一輸出為標準 schema，便於後續處理。

## 介面與操作流程

以下截圖示範 TrendScope 的端到端操作流程（來自示範站 `poirotw66.github.io/TrendScope/`）。

### 1. 首頁儀表板

集中入口，可快速瀏覽目前支援的研討會、報告入口與處理狀態。

![TrendScope 首頁](/projects/trendscope/0-home.png)

### 2. BigQuery 與資料設定

顯示與設定 BigQuery 專案、資料集與表格，並可檢視原始與處理後的會議資料，作為之後報告生成的來源。

![BigQuery 與資料設定](/projects/trendscope/1-db.png)

### 3. PPT / PDF 上傳與處理

上傳會議簡報（PPT/PDF），啟動 Gemini 摘要流程，將簡報內容轉為可搜尋與可分析的文字與摘要資料。

![PPT / PDF 上傳](/projects/trendscope/2-ppt.png)

### 4. 批次報告生成頁面

設定要處理的研討會、資料來源與輸出路徑，一鍵觸發批次報告生成，產出多份 Markdown / HTML 報告。

![批次報告生成頁面](/projects/trendscope/3-report.png)

### 5. 產生的報告檢視

瀏覽已產生的 Markdown / HTML 報告，包含議程列表、每場摘要與整體趨勢分析，可直接發佈到 GitHub Pages 或內部入口。

![報告瀏覽頁面](/projects/trendscope/4-reportm.png)

### 6. 爬蟲管理

集中管理與啟動爬蟲任務，包含選擇研討會來源、是否使用 Headless 模式等，並將結果寫入 BigQuery 或輸出至檔案。

![爬蟲管理介面](/projects/trendscope/5-scraper.png)

## 撰寫動機與應用情境

TrendScope 來源於實際整理大型研討會（例如 Google I/O、Google Next、QCon 等）內容的需求——
內部團隊需要在短時間內掌握多場技術演講的重點、分類與趨勢走向，同時保留可查詢的結構化資料。

透過這個平台，可以：

- 將**大量逐字稿與簡報**轉為可搜尋的結構化資料與摘要。
- 為**內部分享或部門簡報**自動生成議程總覽與重點報告。
- 作為後續**儀表板、知識庫或 RAG 系統**的資料來源。

更多細節與程式碼可於 GitHub 專案與示範網站中查看。
