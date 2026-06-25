---
title: "Bloom Picker · 雅色"
description: "Bloom Picker 把東亞傳統色與現代工作流程接軌：250 款具文化脈絡的色名與色碼、WCAG 2.1 對比度、繁體在地化色名、推薦色票與調色盤匯出。"
pubDate: 2025-03-01
tier: lab
subtitle: "美觀介面 · Pantone · React · TypeScript · WCAG 2.1 無障礙合規"
repoUrl: "https://github.com/poirotw66/bloom-picker"

metrics:
  - "React · TypeScript · Vite"
  - "WCAG 2.1 對比度"
  - "250 款傳統色"
impact: "Pantone · WCAG 2.1 對比度一鍵檢查"
image: "https://github.com/poirotw66/bloom-picker/raw/main/image/gunjyo.png"
---

**Bloom Picker · 雅色** 不只是一個色碼查詢工具，而是把「東亞傳統色」與「現代工作流程」接軌的橋樑。它提供了 250 款具文化脈絡的色名與色碼，方便品牌、視覺與 UI 設計師快速取用，並可輕鬆匯出至設計系統。

色名以「傳統色名 · 台灣口語 · 高貴優雅」為原則，沿用東亞傳統色名並統一為台灣慣用繁體中文（如 桜→櫻、黒→黑），保留傳統色感同時提升在地辨識度。

👉 **線上 Demo：** [www.bloss0m.com/bloom-picker/](http://www.bloss0m.com/bloom-picker/)

---

## 1. 核心特色與應用場景

- **設計與品牌應用**：提供 CMYK / RGB / HSL / HEX 完整色碼，點擊 HEX 即可複製。支援收藏喜愛色、拖拉排序，並匯出為 CSS 變數或 JSON。
- **無障礙設計合規**：內建 WCAG 2.1 對比度計算，自動評估與黑／白文字的對比比率，顯示 AA / AAA 狀態，幫助在美觀與可讀性間取得平衡。
- **靈感探索與推薦**：內建「今日之色」與「隨機一色」功能。系統會依據色距與色相演算法推薦搭配色票，降低配色門檻。

---

## 2. 介面與預覽

專案採用全螢幕色塊體驗：點選側邊色名即可切換整頁背景色，過場平滑且無按鈕閃爍感；搭配 Hash 路由（如 `#color-name`），可直接連到指定色，方便跨分頁操作。

### 2.1 主畫面視覺

| 初櫻 | 群青 | 若竹 |
|------|------|------|
| ![初櫻 主](https://github.com/poirotw66/bloom-picker/raw/main/image/ikkonome.png) | ![群青 主](https://github.com/poirotw66/bloom-picker/raw/main/image/gunjyo.png) | ![若竹 主](https://github.com/poirotw66/bloom-picker/raw/main/image/wakatake.png) |

### 2.2 推薦色票與概念

| 創意配色 | 蒼穹萬里 | 新綠萌芽 |
|----------|----------|----------|
| ![創意配色](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E5%89%B5%E6%84%8F%E9%85%8D%E8%89%B2.png) | ![蒼穹萬里](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E8%92%BC%E7%A9%B9%E8%90%AC%E9%87%8C.png) | ![新綠萌芽](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E6%96%B0%E7%B6%A0%E8%90%8C%E8%8A%BD.png) |
| ![創意配色 概念](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E5%89%B5%E6%84%8F%E9%85%8D%E8%89%B2-img.png) | ![蒼穹萬里 概念](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E8%92%BC%E7%A9%B9%E8%90%AC%E9%87%8C-img.png) | ![新綠萌芽 概念](https://github.com/poirotw66/bloom-picker/raw/main/image/bloom-picker-%E6%96%B0%E7%B6%A0%E8%90%8C%E8%8A%BD-img.png) |

---

## 3. 架構與技術棧

專案以 React 與 TypeScript 打造，確保型別安全與元件可重用性。

- **框架與建置**：React + TypeScript + Vite
- **動畫與互動**：Framer Motion 處理平滑換色過場
- **圖示**：Lucide React
- **色彩邏輯**：自訂色距與推薦演算法、WCAG 2.1 對比度計算模組

專案結構劃分清晰：
```text
src/
  ├── components/    # 側邊欄、細節頁、推薦色板、收藏清單
  ├── data/          # 250 色與推薦色票靜態資料
  └── utils/         # 色彩轉換、WCAG 計算、匯出工具
```

---

## 4. 開發與授權說明

- **本地開發**：執行 `npm install` 與 `npm run dev` 即可啟動開發伺服器。
- **部署方式**：建置後的 `dist` 可輕鬆部署至 GitHub Pages（透過 Settings → Pages 設定分支路徑）。
- **授權規範**：本專案採用 Apache License 2.0。網頁結構與程式為專案原創；色碼資料改寫自公開之日本傳統色資料，僅作轉寫與在地化，非商業用途。
