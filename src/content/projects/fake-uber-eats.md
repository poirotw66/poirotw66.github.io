---
title: "Uber Eats Not!!：看起來能點，實際上不能"
description: "高仿 Uber Eats 靜態惡搞站，361 家真實餐廳資料、完整地圖追蹤、假結帳假收餐，GitHub Pages 免費部署。"
pubDate: 2024-05-01
updatedDate: 2024-05-01
tldr:
  - "高仿 Uber Eats 靜態惡搞站，361 家真實餐廳資料、完整地圖追蹤、假結帳假收餐，GitHub Pages 免費部署"
  - "純前端 · GitHub Pages · Playwright 爬蟲 · OSRM"
  - "All the appetite, none of the delivery"
audience:
  - "想了解真實專案架構、技術取捨與落地成效的工程師、技術主管與產品團隊。"
  - "需要具體成果數據與技術選型參考，而不只是概念 Demo 的讀者。"
tier: lab
subtitle: "純前端 · GitHub Pages · Playwright 爬蟲 · OSRM"
repoUrl: "https://github.com/poirotw66/fake-uber-eats"
metrics:
  - "361 家餐廳索引"
  - "16 種惡搞載具"
  - "0 框架純前端"
impact: "All the appetite, none of the delivery."
image: "/projects/fake-uber-eats/og-cover.webp"
---


**Uber Eats Not!!** 是一個高仿 Uber Eats 的靜態惡搞示範站，目標是提供一個「只有衝動、沒有代價」的外送點餐體驗：餐點不會到、錢不會少、多巴胺會到。如果你半夜滑手機、肚子餓、又不想真的花錢點餐，這裡將提供你滿滿的情緒價值。

👉 **線上體驗：** [www.bloss0m.com/fake-uber-eats/](http://www.bloss0m.com/fake-uber-eats/)

---

## 1. 專案背景與痛點

外送平台把「點餐衝動」封裝得太完美，有時候我們只是想體驗「逛菜單、加購物車、等待送達」的過程，卻不想產生真實的交易與熱量。如何只保留其 UX 而不引發真實交易？

這項專案面臨的挑戰在於：需要盡量貼近 Uber Eats 台灣版的視覺與互動；餐廳與菜單資料必須來自真實列表；但同時它只能是一個靜態網站，不能有後端伺服器負擔（零後端、零金流）。此外，還需要在地圖上實作真實的外送追蹤路線，讓「假裝送餐」的儀式感做足。

---

## 2. 核心概念與解法

**Uber Eats Not!!** 是一個純前端部署在 GitHub Pages 的靜態網站。透過 Playwright 事先爬取真實 Uber Eats 列表資料，並將菜單轉為靜態 JSON 檔與 WebP 圖片。使用者能完整走過「選店 → 菜單 → 購物車 → 結帳 → 外送追蹤 → 慶祝收餐」的流程。

- **視覺與互動還原**：首頁 Feed 支援搜尋、分類、排序，並實作無限捲動增量渲染；購物車支援小費、假結帳金額計算。
- **資料爬蟲管線**：使用 Python (Playwright) 預先匯出真實資料，圖片轉檔優化，讓網頁只載入靜態檔案即可運作。
- **多樣化惡搞載具**：支援 16 種外送交通工具（包含直升機、潛水艇、UFO 等），依據載具切換不同的移動模式與路線算法。

---

## 3. 介面與操作體驗

### 3.1 首頁 Feed

![首頁 Feed](/projects/fake-uber-eats/01-home-feed.webp)

預設地址為台北 101 一帶，提供 361 家餐廳索引。支援依距離、評分、送達時間等進行排序。

### 3.2 餐廳與菜單

![餐廳菜單](/projects/fake-uber-eats/02-restaurant-menu.webp)

點進任一餐廳後，按需載入該店家的靜態 JSON 菜單，支援品項搜尋，圖片經過 WebP 壓縮與縮圖優化。

### 3.3 購物車與結帳

![結帳流程](/projects/fake-uber-eats/03-checkout.webp)

可調整數量、選擇小費、點選純 UI 的付款方式。送出訂單後不會有任何真實扣款。

### 3.4 惡搞外送追蹤

![外送追蹤](/projects/fake-uber-eats/04-tracking-map.webp)

地圖顯示店家、外送員與目的地。你可以選擇「潛水艇」走地底直穿，或是「UFO」空中飛行，外送員會沿著算出的路線與動畫模式移動。

### 3.5 收餐慶祝

![收餐慶祝](/projects/fake-uber-eats/05-meet-driver-reveal.webp)

送達後提供全螢幕慶祝動畫（紙花、emoji 雨）、手機震動回饋，並可給予「假外送員」五星評分。

---

## 4. 技術架構解析

系統分為資料管線與純前端網頁兩部分：

1. **Python 爬蟲資料管線**：Playwright 爬蟲 → 圖片轉 WebP 與產生縮圖 → 建立 JSON Feed 索引。
2. **前端執行**：Vite 打包，純 HTML/CSS/JavaScript，零 React/Vue 框架，使用 ESM 模組化拆分。
3. **地圖與路由**：使用 Leaflet + OpenStreetMap 圖磚，搭配 OSRM (Open Source Routing Machine) 進行真實道路的外送路線規劃。

透過純靜態站架構，將原本超過 300 MB 的圖片大幅壓縮至約 86 MB，核心 JS bundle 僅約 64 KB (gzip ~20 KB)，能順暢運行於 GitHub Pages。

---

## 5. 結語與免責聲明

**Uber Eats Not!!** 成功還原「All the appetite, none of the delivery」的設計初衷，提供情緒價值拉滿的點餐流程，並展示了爬蟲、前端效能調校、地圖動畫與模組化開發的技術整合。

- 本專案與 Uber Eats 及 Uber 無任何關聯，純屬 parody / 教育與娛樂用途。
- 餐廳名稱、菜單、圖片可能來自公開列表之爬蟲匯出，請勿用於商業訂餐、冒充官方或任何違反服務條款之行為。
- 不涉及真實付款、真實外送、使用者帳號系統。
