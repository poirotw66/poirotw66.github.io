---
title: "Text2Podcast"
description: "從文字內容自動生成專業 Podcast 音訊，以 AI 將文字轉為雙講者對話稿，搭配 Google Cloud TTS 合成自然語音，支援多種長度模式與即時進度追蹤。"
pubDate: 2025-02-20
tier: main
subtitle: "OpenAI · Google TTS · 雙講者 · FastAPI · React"
repoUrl: "https://github.com/poirotw66/Text2Podcast"
metrics:
  - "OpenAI API"
  - "Google Cloud TTS"
  - "FastAPI · React"
impact: "文字 → 雙講者 Podcast 音訊一鍵產出"
image: "/projects/text2podcast/01-update.webp"

---

## 概述

**Text2Podcast** 為全端 Podcast 生成應用，可從文字內容自動產出專業 Podcast 音訊。使用 AI 將文字轉為自然流暢的雙講者對話稿，經優化與 Google Cloud TTS（Gemini 2.5 Flash）合成後，輸出合併 MP3 與轉錄稿（PDF），適合將文章、講稿或筆記快速轉成可收聽的節目。

## 功能重點

- **智能轉錄生成** — 以 AI 將輸入文字轉為雙講者對話稿，支援 SHORT（約 7 分鐘）、MEDIUM（約 15 分鐘）、LONG（約 30 分鐘）三種長度模式。
- **檢視與編輯** — 可檢視、編輯 AI 生成的轉錄稿，或重新生成一版，確認後進入優化與語音設定。
- **雙講者 TTS** — 使用 Google Cloud TTS 合成自然語音，可為 Speaker 1、Speaker 2 分別選擇音色並試聽，預設為 Kore、Charon。
- **即時進度與下載** — 透過 SSE 即時顯示合成進度；完成後可試聽、下載合併 MP3 及轉錄稿 PDF。

## 系統介面與流程

以下依操作流程對應各畫面擷圖。

### 步驟 1：上傳內容

輸入或貼上欲轉成 Podcast 的文字，選擇長度模式（SHORT / MEDIUM / LONG），點擊「開始生成」後由後端產生初始轉錄稿並跳轉至步驟 2。

![上傳內容](/projects/text2podcast/01-update.png)

### 步驟 2：檢視與編輯轉錄稿

檢視 AI 生成的雙講者對話稿，可直接編輯文字或點擊「重新生成」再產生一版；確認後進入步驟 3 進行優化。

![編輯轉錄稿](/projects/text2podcast/02-edit.png)

### 步驟 3：確認腳本與語音

檢視優化後的逐句腳本（Speaker 1 / Speaker 2），可單句編輯、刪除或插入新句；確認語音設定後點擊「開始生成音訊」進入步驟 4。

![確認腳本與語音](/projects/text2podcast/03-confirm.png)

### 步驟 4：生成與下載

透過 SSE 即時顯示合成進度；完成後可試聽、下載合併後的 MP3 及轉錄稿（PDF），或「建立新 Podcast」回到步驟 1。

![生成與下載](/projects/text2podcast/04-result.png)

### 設定頁：語音選擇

為 Speaker 1、Speaker 2 選擇 TTS 語音，可試聽（Preview）、重置為預設、返回首頁。

![語音設定](/projects/text2podcast/05-setting.png)

## 技術棧

- **後端** — FastAPI、OpenAI API（轉錄生成）、Google Cloud TTS（Gemini 2.5 Flash）、Pydub（音訊處理）、SSE-Starlette（即時進度）。
- **前端** — React 18、TypeScript、Vite、React Router、Axios。

## 應用情境

適用於將長文、講稿、筆記或腳本快速轉為可收聽 Podcast 的情境：知識型節目、有聲書預覽、內部培訓或內容再利用，無需自行錄音即可產出雙人對話式音訊。
