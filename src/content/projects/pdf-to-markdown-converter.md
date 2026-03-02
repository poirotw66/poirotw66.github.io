---
title: "PDF to Markdown Converter"
description: "將 PDF 轉換為 Markdown 的 CLI 或工具，便於文檔結構化、版本控制與後續 RAG／檢索流程使用。"
pubDate: 2025-02-01
subtitle: "PDF · Markdown · 文檔轉換 · CLI"
repoUrl: "https://github.com/poirotw66/pdf-to-markdown-converter"
metrics:
  - "PDF"
  - "Markdown"
  - "CLI"
---

## 概述

本專案提供 **PDF 轉 Markdown** 的轉換能力，產出的 Markdown 可作為文檔結構化儲存、版本控制與後續 RAG／檢索管線的輸入來源，方便與 Agentic RAG、知識庫索引等流程整合。

## 功能重點

- **PDF → Markdown** — 將 PDF 頁面或全文轉為 Markdown 格式，保留標題、段落與列表等結構。
- **可程式化使用** — 以 CLI 或程式介面呼叫，適合批次轉檔與自動化管線。
- **輸出友善** — Markdown 易於編輯、diff 與納入向量檢索前的分塊流程。

## 轉換範例

以下為簡報 PDF 經轉換後的範例：原始頁面擷圖與對應的 Markdown 輸出（保留頁碼、標題、列表與架構說明）。

**轉換結果預覽**

![PDF 轉 Markdown 範例](/projects/pdf-to-markdown/example.png)

**輸出 Markdown 片段**（保留標題階層、列表與連結）

```markdown
## Page 1

**Method:** gemini_vision

# Step 2 - Spring Modulith Hazelcast 快取整合

https://github.com/philipz/spring-modular-monolith

1.  **提供實作參考**
    - 由 Claude/ChatGPT 提供 Spring Modulith with Hazelcast 完整實作指南 markdown 文件。

2.  **Spec-workflow 產生 Spec**
    - `/spec-streering-setup` 生成專案 product.md/ tech.md/ structure.md，接著分析目前 Spring Modulith 結構。
    - `/spec-create` 參考實作文件建立 requirement.md。

## 架構圖分析

### BookStore Modulith 內部結構

此架構圖展示了 BookStore Modulith 的內部模組及其互動關係。
- **主要模組**: Catalog, Orders, Notifications, Inventory
- **資料與事件**: 各模組均與中央資料庫和事件佇列互動。
- **外部整合**: BookStore Modulith 透過中介層與外部 "Other Apps" 通訊。

### 系統流程架構

此流程圖展示從使用者到後端服務的請求與資料流。
1.  流程始於 **Browser**（瀏覽器）。
2.  請求進入核心應用程式（Thymeleaf、Spring Modulith BookStore、Hazelcast）。
3.  資料持久化於 **PostgreSQL**；並與 RabbitMQ、Zipkin、Hazelcast-mgmt 整合。
```

## 技術棧

依 repo 實作為準；常見做法為 PDF 解析庫（如 PyMuPDF、pdfplumber）搭配文字與版面分析，輸出標準 Markdown。

## 應用情境

適用於需將大量 PDF 文檔轉為可索引文字的情境：企業知識庫建置、RAG 文檔攝取前處理、技術手冊或合約的結構化存檔與搜尋。
