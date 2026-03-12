---
title: "LINE Chatbot · n8n 工作流平台"
description: "基於 n8n 建構的 LINE Chatbot，以 Google Gemini 分析用戶輸入並智能路由至 19 個子流程，涵蓋 RAG、事實查證、新聞、圖像生成與網頁爬取。"
pubDate: 2025-01-01
subtitle: "n8n · Google Gemini · LINE Messaging API · 多代理路由"
repoUrl: "https://github.com/poirotw66/n8n_workflow"
metrics:
  - "1 主流程 + 19 子流程"
  - "Google Gemini"
  - "RAG · FACT · 圖像 · 新聞"
impact: "1 主流程智能路由至 19 個子流程（RAG、事實查證、圖像、新聞等）"
---

## 專案目標

提供一個**智慧化 LINE 自動回覆機器人**：使用者傳送訊息後，由 AI 語言模型（Google Gemini）分析內容類型，並**智能路由**到對應的子流程處理，涵蓋技術文件摘要、事實查證、RAG 知識檢索、新聞與股票、圖像生成、網頁爬取等，最後將回覆格式化並送回 LINE（支援長文自動分段，最多 5 則）。

## 架構概覽

**主流程 [MAIN] LINE CHATBOT**：接收 LINE Webhook → 呼叫 Gemini 分析訊息 → 依內容類型路由至子流程 → 彙整 AI 回應 → 分段發送回 LINE。

**19 個子流程模組** 分為：AI 代理（1399 RAG、MCP RAG、RAG Pipeline、ITR、FACT、CB、DR）、資訊處理（NEWS、News Agent Scrape、STOCK）、圖像處理（IMAGE Generator、Food Image、Image Editing、Image Module）、網頁處理（WEB、LINE CHATBOT Crawl）、工具（SUBS Module、Database Query Tool），以及 FACT linebot 工作流。

```
LINE Webhook → [MAIN] LINE CHATBOT (Gemini 分析) → 子流程路由
    → RAG / FACT / NEWS / IMAGE / WEB / … (19 子流程)
    → 回應格式化與分段 → LINE Reply API
```

## 技術內容處理

- **技術相關**：辨識技術文件、會議記錄、專業討論；可搭配網址爬取（HTTP Request / Jina AI）、YouTube 逐字稿；輸出可選「標準模板」或「詳細報告」，繁體中文、500 字以內、適配 LINE 顯示。
- **非技術內容**：走個性化對話與對應子流程（如 FACT、NEWS、IMAGE 等）。
- **安全**：API tokens 以環境變數管理，不硬編碼；Git 歷史已清理敏感資訊。

## 工作流示意（可搭配 n8n 課程流程圖）

以下為 n8n 工作流層級概念示意；實際主流程與子流程圖可於 [GitHub 展示站](https://poirotw66.github.io/n8n_workflow/) 查看。
### n8n 工作流 Level 1
![n8n 工作流 Level 1](/projects/n8n-course/n8n_lv1.png)
### n8n 工作流 Level 2 範例 1
![n8n 工作流 Level 2 範例 1](/projects/n8n-course/n8n_lv2_workflow1.png)
### n8n 工作流 Level 2 範例 2
![n8n 工作流 Level 2 範例 2](/projects/n8n-course/n8n_lv2_workflow2.png)


## 技術棧與亮點

- **n8n** — 可視化工作流設計與執行
- **Google Gemini** — 訊息分析與回應生成
- **LINE Messaging API** — Webhook 接收與回覆
- **RAG / MCP RAG / FACT** — 知識檢索與事實查證
- **模組化** — 每項功能獨立子流程，易維護與擴充
- **GitHub Pages** — 工作流說明與流程圖展示站：[poirotw66.github.io/n8n_workflow](https://poirotw66.github.io/n8n_workflow/)

## 相關連結

- **Repository**：[github.com/poirotw66/n8n_workflow](https://github.com/poirotw66/n8n_workflow)
- **展示網站**（流程圖與說明）：[poirotw66.github.io/n8n_workflow](https://poirotw66.github.io/n8n_workflow/)
