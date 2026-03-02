---
title: "BloomRender"
description: "以 Google Gemini API 驅動的 AI 照片編輯與生成工作室：修圖、濾鏡、證件照、形象照、旅遊照、主題寫真、團體照與虛擬試穿。"
pubDate: 2026-03-01
subtitle: "讓創意綻放。· Gemini API · React 19 · 多語系"
repoUrl: "https://github.com/poirotw66/bloom-render"
metrics:
  - "Gemini API"
  - "React 19"
  - "EN · 繁中"
---

## 概述

**BloomRender** 是 AI 驅動的照片編輯與生成工作室，以 **Google Gemini API** 提供修圖、風格濾鏡、證件照、專業形象照、旅遊照、主題寫真、團體照與 AI 虛擬試穿，全部在一個網頁應用中完成。

## 功能

- **上傳與編輯** — 拖放或選擇圖片後，使用內建編輯器：局部修圖（描述要改的內容）、濾鏡（Synthwave、Anime、Lomo 或自訂）、整體調整（背景模糊、細節增強、光線等）、裁切（自由或證件規格）。支援復原、重做、與原圖比較、重置與下載。
- **文字生圖** — 輸入描述、選擇長寬比與張數，由 AI 生成圖片後可進入編輯器。
- **AI 證件照** — 選擇證件類型、修圖等級、輸出規格與服裝（可自訂描述與參考圖），上傳人像後生成符合規格的證件照。
- **AI 形象照** — 選擇類型與輸出規格，上傳人像後生成專業形象照。
- **AI 旅遊照** — 選擇輸出尺寸、長寬比與場景（世界地圖／台灣地圖／國際景點／自訂描述與參考圖），上傳人像後生成旅遊照。
- **AI 主題寫真** — 選擇主題類型、輸出尺寸與長寬比，上傳人像後生成主題寫真。
- **AI 團體照** — 上傳 2 張（雙人）或 3～6 張（團體）人像，選擇風格後生成合照。
- **AI 虛擬試穿** — 上傳人物照與多張服裝照，生成試穿效果。
- **設定** — 在應用內設定 Google GenAI API 金鑰與模型（如 Gemini 2.5 Flash／Gemini 3 Pro）；金鑰僅儲存於本機瀏覽器。
- **多語系** — 英文與繁體中文。
- **主題** — 內建繁花、深夜、新年等主題。
- **生成歷史** — 檢視、篩選與下載過往生成結果。

## 技術棧

- **執行環境** — React 19、TypeScript、Vite 6
- **路由** — React Router 7
- **編輯** — react-image-crop
- **AI** — @google/genai（Gemini API）
- **樣式** — Tailwind CSS（CDN）、自訂 CSS
- **開發** — ESLint、Prettier、Vitest、Husky、lint-staged

## 部署

應用建置為靜態資源，可部署至任意靜態託管。**GitHub Pages** 以 `base: /bloom-render/` 設定；推送到 `main` 後由 workflow 建置並部署。

## 授權

**CC BY-NC-SA 4.0**（姓名標示─非商業性─相同方式分享）。商業使用請聯絡作者。條款見 repo 內 [LICENSE.txt](https://github.com/poirotw66/bloom-render/blob/main/LICENSE.txt)。
