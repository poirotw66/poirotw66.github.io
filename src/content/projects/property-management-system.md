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
image: "/projects/pms-react/0_homepage.webp"
---

**綜合物業管理系統** 是一個全面的物業管理應用，協助你管理名下或代管物件、承租人、合約、報修與資產資訊。系統支援單機 LocalStorage 與 Google Sheets 雲端同步兩種模式，目標是簡化日常管理流程、提高資訊透明度，並確保所有事件都有紀錄可查。

此系統適用於個人房東、中小型物業管理公司或代租代管業者，作為集中管理承租人、合約與報修事務的輕量級工具。

---

## 1. 主要模組與功能

- **首頁儀表板**：集中顯示即將到期合約、應收租金等重點資訊。
- **承租人與客戶管理**：管理現有承租人資料與緊急聯絡人，並可記錄潛在客戶的需求與追蹤狀態。
- **物件與資產管理**：管理每一處物件的基本資訊、資產明細（設備／家具／生活機能）、維修記錄，並追蹤高價資產的購買日期、價格與保固。
- **合約與租金管理**：支援月繳、季繳、半年繳與年繳，提供多期合併付款、補繳與金額比對。
- **報修追蹤系統**：處理承租人報修請求，追蹤處理進度與結案狀態。

---

## 2. 系統介面與操作

### 2.1 首頁儀表板

![首頁儀表板](/projects/pms-react/0_homepage.webp)

登入後首頁會顯示即將到期合約、待收款提醒與主要導覽入口，讓管理者一眼掌握當下需處理的急迫事項。

### 2.2 承租人與物件管理

![承租人管理設定](/projects/pms-react/1_custom.webp)
![物件與資產管理](/projects/pms-react/2_item.webp)

在承租人與物件管理中，可以詳細設定與勾選物件包含的設備、家具與生活機能，並將特定承租人綁定至物件。

### 2.3 合約管理與每期狀態

![合約管理與每期租金狀態](/projects/pms-react/3_contract.webp)

系統自動產生每期租金區間與應收金額，並以「未到時間 / 待收款 / 已繳交 / 款項異常 / 已到期」等狀態標示每一期。

### 2.4 系統設定與雲端同步

![系統設定與雲端同步](/projects/pms-react/4_setting.webp)

可隨時切換本機 LocalStorage 與 Google Sheets 雲端同步模式，並設定對應的 Apps Script Web App URL。

---

## 3. 架構與技術棧

### 3.1 前端架構

- **框架與樣式**：React 18 + TypeScript，搭配 Vite 開發。Tailwind CSS 透過 CDN 載入並於 `index.html` 設定主題色。
- **狀態管理**：使用 React Context（`DataContext`）集中管理 tenants、properties、contracts 等資料來源與同步模式。

### 3.2 資料儲存策略（雙模式）

1. **LocalStorage（單機模式）**：預設儲存方式，適合單機快速使用與輕量級 Demo。
2. **Google Sheets（雲端同步）**：透過 `googleSheets` service 與 Google Apps Script Web App 溝通，同步多個工作表，讓多人協作成為可能。

---

## 4. 專案開發與部署

專案結構劃分清晰，便於後續擴充：

```text
components/                 # React UI 元件（首頁、合約管理、物件管理等）
hooks/useLocalStorage.ts    # LocalStorage 持久化 Hook
contexts/DataContext.tsx    # 全域資料 Context，封裝切換邏輯
services/googleSheets.ts    # 與 Apps Script 溝通的 API
google-apps-script/         # 後端 GAS 程式碼與 SETUP 說明
```

- **本地開發**：`npm install` 後執行 `npx vite` 即可啟動。
- **部署**：專案配置有 GitHub Actions，推送到 `main` 分支後會自動建置並部署至 GitHub Pages。
