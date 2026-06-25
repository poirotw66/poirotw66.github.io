---
title: "Square Couplets Master"
description: "使用 Google Gemini AI 將願望關鍵字轉為傳統春聯斗方藝術作品，支援參考圖片風格、多種解析度（1K/2K/4K）與三種模型（Gemini 2.5 Flash / Gemini 3.1 Flash / Gemini 3 Pro），並提供設定面板與結果預覽介面。"
pubDate: 2025-02-25
tier: lab
subtitle: "Gemini · 春聯斗方 · 書法藝術 · React · Vite"
repoUrl: "https://github.com/poirotw66/Square_Couplets_Master"
metrics:
  - "Gemini 2.5 Flash"
  - "Gemini 3.1 Flash"
  - "Gemini 3 Pro"
  - "React · TypeScript"
impact: "關鍵字 → 春聯斗方藝術圖（1K/2K/4K）"
image: "/projects/square_couplets_master/gemini3-1-flash-萬馬奔騰.webp"
---

**春聯斗方大師 (Square Couplets Master)** 為使用 Google Gemini AI 生成傳統春聯斗方藝術作品的應用。輸入關鍵字（如財富、健康、萬馬奔騰等），可選上傳參考圖片以引導風格，由 AI 產出菱形斗方書法藝術圖。

本系統支援 1K、2K、4K 解析度與多模型選擇，並在 Web 介面中提供模型與解析度設定、結果預覽與下載，適合農曆新年春聯、斗方佈置、賀卡、禮品或將祝福語轉為可列印藝術圖的個人創作。

---

## 1. 核心功能與特色

- **AI 生成春聯斗方**：輸入關鍵字即可自動生成傳統風格春聯斗方藝術圖。
- **參考圖片支援**：可上傳參考圖片，AI 會參考其風格生成作品。
- **多種解析度**：支援 1K、2K、4K 輸出；2K/4K 需使用較新的影像模型。
- **多模型選擇**：可切換 Gemini 2.5 Flash（快速）、Gemini 3.1 Flash（畫質平衡）、Gemini 3 Pro（最高畫質），依預算與品質需求選擇。
- **互動式設定與預覽**：透過設定面板調整模型與解析度，並在結果頁即時預覽與下載作品。

---

## 2. 模型與解析度選擇

專案前端針對三種模型做了清楚分工，使用者可依據需求選擇：

| 模型 | 解析度支援 | 特點 | 建議用途 |
|------|------------|------|----------|
| **Gemini 2.5 Flash** | 1K | 成本低、生成最快 | 草稿、快速測試、多輪迭代 |
| **Gemini 3.1 Flash** | 1K / 2K / 4K | 畫質明顯優於 2.5、支援高解析度 | 需要較好畫質但仍在意成本與速度時 |
| **Gemini 3 Pro** | 1K / 2K / 4K | 細節最豐富、風格理解最佳 | 最終成品、列印輸出、正式對外發佈 |

> **提示**：若 API Key 尚未啟用付費計費，建議先從 Gemini 2.5 Flash 或 Gemini 3.1 Flash 開始測試；追求最高品質時再切換至 Gemini 3 Pro。

---

## 3. 範例作品與介面操作

以下為使用關鍵字「萬馬奔騰」的多組生成結果與 UI 介面示意。

### 3.1 萬馬奔騰生成對比

- **Gemini 2.5 Flash (1K)**：快速生成，品質良好，適合快速測試與迭代。
  ![Gemini 2.5 Flash 萬馬奔騰](/projects/square_couplets_master/gemini2-5-萬馬奔騰.webp)

- **Gemini 3.1 Flash (2K/4K)**：在成本與速度之間取得平衡，畫質明顯提升，適合大部分實務情境。
  ![Gemini 3.1 Flash 萬馬奔騰](/projects/square_couplets_master/gemini3-1-flash-萬馬奔騰.webp)

- **Gemini 3 Pro (2K/4K)**：生成時間較長，但細節更豐富、風格理解更準確，適合最終列印作品。
  ![Gemini 3 Pro 萬馬奔騰](/projects/square_couplets_master/gemin3-萬馬奔騰.webp)

### 3.2 系統設定與操作

- **設定面板**：在設定面板中可選擇使用的模型與輸出解析度，並管理 Gemini API Key 等配置。
  ![設定面板](/projects/square_couplets_master/setting.webp)

- **結果預覽**：生成完成後，可在結果頁預覽斗方作品，確認後下載高解析度圖片。
  ![生成結果預覽](/projects/square_couplets_master/result.webp)

---

## 4. NPM 套件與 CLI 工具

專案同時提供 NPM 版的 **Square Couplets Master Skills** 以及對應的 CLI：

- 全域安裝：`npm install -g @justin_666/square-couplets-master-skills`
- 初始化到專案中：`doufang init --ai cursor`（或 windsurf / antigravity / claude）
- 常用指令：
  - `doufang-prompt`：依關鍵字生成春聯斗方 prompt
  - `doufang-image`：呼叫 Gemini 影像模型生成斗方圖片（支援 1K/2K/4K）
  - `doufang-optimize`：優化 prompt，減少過多留白、提升構圖

這些 Skills 可在 Cursor 等 IDE 以 slash command 或 CLI 方式使用，並支援進度提示、版本查詢與 DEBUG 模式，方便在 AI 開發流程中快速疊代與產生視覺素材。

---

## 5. 技術棧與部署

- **前端框架**：React 19、TypeScript、Tailwind CSS、Vite。
- **AI 整合**：Google Gemini 2.5 Flash、Gemini 3.1 Flash、Gemini 3 Pro 影像模型。
- **部署方式**：專案已配置 GitHub Actions，推送到 `main` 後會自動建置並部署到 GitHub Pages。
