---
title: "綜合物業管理系統"
description: "以 React + TypeScript + Tailwind CSS 打造的單機／雲端雙模式物業管理系統，涵蓋承租人、物件、合約、報修、資產與潛在客戶管理，支援 LocalStorage 與 Google Sheets 同步。"
pubDate: 2025-02-28
tier: lab
subtitle: "React · TypeScript · Tailwind · Vite · Google Sheets"
repoUrl: "https://github.com/poirotw66/pms_react"
metrics:
  - "React 18"
  - "TypeScript"
  - "Tailwind CSS"
  - "Google Sheets Sync"
impact: "單機與雲端雙模式 · Google Sheets 同步"
image: "/projects/pms-react/0_homepage.png"
---

## 概述

**綜合物業管理系統** 是一個全面的物業管理應用，協助你管理名下或代管物件、承租人、合約、報修與資產資訊。系統支援單機 LocalStorage 與 Google Sheets 雲端同步兩種模式，目標是簡化日常管理流程、提高資訊透明度，並確保所有事件都有紀錄可查。

## 系統介面

### 首頁儀表板與導覽

顯示即將到期合約、待收款提醒與主要導覽入口。

![首頁儀表板](/projects/pms-react/0_homepage.png)

### 承租人管理設定

設定承租人管理資訊。

![承租人管理設定](/projects/pms-react/1_custom.png)

### 物件與資產管理

管理物件基本資訊與資產明細，包括設備、家具與生活機能勾選，以及維修紀錄等。

![物件與資產管理](/projects/pms-react/2_item.png)

### 合約管理與每期租金狀態

支援月繳、季繳、半年繳與年繳，系統自動產生每期租金區間與應收金額，並以「未到時間 / 待收款 / 已繳交 / 款項異常 / 已到期」標示每一期狀態。

![合約管理與每期租金狀態](/projects/pms-react/3_contract.png)

### 系統設定與雲端同步

切換本機 LocalStorage 與 Google Sheets 雲端同步模式，並設定對應的 Apps Script Web App URL 與試算表欄位對應。

![系統設定與雲端同步](/projects/pms-react/4_setting.png)

## 主要功能模組

- **首頁 (Home)** — 儀表板視圖，集中顯示即將到期合約、應收租金等重點資訊。
- **承租人管理** — 管理承租人資料與緊急聯絡人。
- **物件管理** — 管理每一處物件的基本資訊、資產明細（設備／家具／生活機能）與維修記錄。
- **合約管理** — 支援月繳、季繳、半年繳與年繳，提供多期合併付款、補繳與金額比對。
- **報修管理** — 處理承租人報修請求，追蹤處理進度與結案狀態。
- **高價資產管理** — 追蹤家電等高價資產的購買日期、價格、保固與廠商。
- **潛在客戶管理** — 記錄有意承租者的需求與追蹤狀態。

## 技術棧與架構

- **前端框架** — React 18 + TypeScript，搭配 Vite 作為開發與建置工具。
- **樣式** — Tailwind CSS 透過 CDN 載入，並在 `index.html` 內設定主題色（primary / secondary / sidebar / background 等）。
- **狀態與資料流** — 使用 React Context（`DataContext`）集中管理 tenants、properties、contracts 等資料來源與同步模式。
- **資料儲存**：
  - 預設為瀏覽器 LocalStorage，適合單機快速使用與 Demo。
  - 可切換為 Google Sheets 雲端模式，透過 `googleSheets` service 與 Apps Script Web App 溝通，同步多個工作表（tenants / properties / contracts / repairRequests / individualAssets / potentialTenants）。

### 專案結構概覽

```text
components/                 # React UI 元件（首頁、合約管理、物件管理、報修、資產、潛在客戶等）
  common/                   # 通用元件（表單控制項、Modal 等）
hooks/
  useLocalStorage.ts        # LocalStorage 持久化 Hook
contexts/
  DataContext.tsx           # 全域資料 Context，封裝 LocalStorage / Google Sheets 切換
services/
  googleSheets.ts           # 與 Google Apps Script Web App 溝通的 API 包裝
google-apps-script/         # 後端 GAS 程式碼與 SETUP 說明
index.html                  # HTML 入口，載入 Tailwind CDN 與主題設定
index.tsx                   # React 入口
App.tsx                     # 版面配置與路由
constants.tsx               # 導覽項目、SVG 圖示與預設常數
types.ts                    # TypeScript 型別定義
metadata.json               # 應用名稱與描述
```

## 開發與部署

- **系統需求** — Node.js（建議 LTS）與現代瀏覽器。
- **本地開發**：
  ```bash
  npm install
  npx vite
  ```
  於瀏覽器開啟 `http://localhost:5173` 查看介面。
- **部署到 GitHub Pages**：專案已配置 GitHub Actions，選擇 Pages Source 為 GitHub Actions 後，推送到 `main` 即會自動建置並部署到 `https://poirotw66.github.io/pms_react`。

## 應用情境與未來方向

適用於個人房東、中小型物業管理公司或代租代管業者，作為集中管理承租人、合約與報修事務的輕量級工具。未來可進一步擴充身份驗證、多使用者權限、後端資料庫整合、PWA 與更完整的報表分析等能力。

