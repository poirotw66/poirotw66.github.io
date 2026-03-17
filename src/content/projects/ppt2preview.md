---
title: "PPT2Preview"
description: "將投影片與 Markdown 大綱自動轉為帶 AI 語音解說的專業影片，支援 PDF/PPTX 上傳、Gemini 腳本生成、多音色 TTS 與一鍵合成下載。"
pubDate: 2025-02-15
tier: aigc
featuredOrder: 4
subtitle: "Gemini · TTS · 投影片轉影片 · FastAPI · React"
repoUrl: "https://github.com/poirotw66/ppt2preview"
metrics:
  - "Gemini 2.0 Flash"
  - "Google Cloud TTS"
  - "FastAPI · React"
impact: "投影片 + 大綱 → 帶 AI 語音的專業影片"
image: "/projects/ppt2preview/1_home.png"

---

## 概述

**PPT2Preview** 為一現代化 SaaS 服務，將投影片與大綱自動轉換為帶有 AI 語音解說的專業影片。上傳 PDF/PPTX 與 Markdown 大綱後，由 Google Gemini 2.0 Flash 生成逐頁解說腳本，經優化與 TTS 合成後產出 MP4 影片，適合簡報錄製、教學與產品介紹。

## 功能重點

- **上傳與專案** — 支援 PDF/PPTX 投影片與 Markdown 大綱同時上傳，可自訂專案名稱並於歷史專案中再次開啟。
- **AI 腳本生成** — 一鍵以 Gemini 2.0 Flash 依投影片內容與大綱產生解說腳本，支援短／中／長模式優化與手動編輯。
- **多音色 TTS** — 30 種 Google Cloud TTS 音色（14 女性、16 男性），支援繁體中文，可於設定頁試聽並選擇。
- **影片合成與下載** — 逐頁同步語音與投影片，透過 WebSocket 即時顯示進度，完成後可預覽並下載 MP4。

## 系統介面與流程

以下依操作流程對應各畫面擷圖。

### 首頁

從首頁可快速了解產品價值與四大步驟，並一鍵開始新專案。

![PPT2Preview 首頁](/projects/ppt2preview/1_home.png)

### 步驟 1：上傳檔案

上傳 Markdown 大綱與 PDF/PPTX 投影片，系統會建立專案並進入後續流程；上傳完成後可於頁面上編輯專案名稱。

![上傳完成](/projects/ppt2preview/2_update.png)

### 步驟 2：生成腳本

以 Gemini 2.0 Flash 根據投影片與大綱一鍵生成解說腳本，每段腳本對應單一投影片頁。

![生成腳本](/projects/ppt2preview/3_script.png)

![腳本生成後](/projects/ppt2preview/4_scipt_after.png)

### 步驟 3：優化腳本

可選擇短／中／長模式重新優化，或於編輯器中手動修改任一頁文案，儲存後供 TTS 與影片合成使用。

![優化腳本](/projects/ppt2preview/5_optimize.png)

### 步驟 4：生成影片與下載

選擇 TTS 音色與影片參數後一鍵合成，透過 WebSocket 即時查看進度；完成後可預覽並下載 MP4。

![生成影片](/projects/ppt2preview/6_video.png)

![下載影片](/projects/ppt2preview/7_download.png)

### 設定與歷史專案

在設定頁可試聽並選擇 30 種 TTS 音色；歷史專案頁可查看過往專案並重新開啟，依當前狀態進入對應步驟。

![音色選擇](/projects/ppt2preview/8_voice.png)

![歷史專案](/projects/ppt2preview/9_history.png)

## 技術棧

- **後端** — FastAPI、Google Gemini 2.0 Flash（腳本生成與優化）、Google Cloud TTS（Gemini 2.5 Flash TTS）、MoviePy（影片合成）、pdf2image / python-pptx（投影片處理）、WebSocket 即時進度。
- **前端** — React 18、TypeScript、Vite、Zustand、Glassmorphism UI、響應式設計。

## 應用情境

適用於需將簡報或教學投影片快速轉為帶解說影片的情境：線上課程、產品介紹、內部培訓或遠端分享，無需手動錄音即可產出一致品質的影片。
