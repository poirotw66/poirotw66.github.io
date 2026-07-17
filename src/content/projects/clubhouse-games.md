---
title: "Clubhouse Games"
description: "俱樂部遊戲網頁實作合集：收錄各款遊戲規格與玩法說明，實作置於 Games/ 下，可透過遊戲總覽選單進入。含二十一點、俄羅斯方塊、黑白棋、坦克對決等，單一服務、GitHub Pages 部署。"
pubDate: 2025-03-16
updatedDate: 2025-03-16
tldr:
  - "俱樂部遊戲網頁實作合集：收錄各款遊戲規格與玩法說明，實作置於 Games/ 下，可透過遊戲總覽選單進入"
  - "含二十一點、俄羅斯方塊、黑白棋、坦克對決等，單一服務、GitHub Pages 部署"
  - "遊戲規格總覽 · 單一選單 · GitHub Pages · TypeScript"
  - "多款 Clubhouse Games 網頁實作，統一選單與部署"
audience:
  - "想了解真實專案架構、技術取捨與落地成效的工程師、技術主管與產品團隊。"
  - "需要具體成果數據與技術選型參考，而不只是概念 Demo 的讀者。"
tier: lab
subtitle: "遊戲規格總覽 · 單一選單 · GitHub Pages · TypeScript"
repoUrl: "https://github.com/poirotw66/Clubhouse-Games"
metrics:
  - "TypeScript · HTML"
  - "單一開發伺服器"
  - "22 款遊戲規格"
impact: "多款 Clubhouse Games 網頁實作，統一選單與部署"
image: "https://github.com/poirotw66/Clubhouse-Games/raw/main/title-image.png"
---


本專案收錄多款 **Clubhouse Games（世界遊戲大全）** 的規格與網頁版實作。我們將各類別的經典遊戲規格化並實作為獨立網頁，透過一個統一的「遊戲總覽選單」進行入口整合，讓使用者能在瀏覽器中直接體驗多款小遊戲。

專案包含從紙牌、棋盤到益智與運動等共計 20 餘款遊戲的規格說明，並已實作包含二十一點、黑白棋、接龍等經典作品。

---

## 1. 遊戲一覽與分類結構

為了利於管理，遊戲被劃分為多個類別，其原始碼與規格文件也依此結構擺放：

- **01 紙牌 (4款)**：二十一點、連環新接龍（FreeCell）、克朗代克接龍、最後一張牌
- **02 棋盤 (3款)**：黑白棋、西洋跳棋、四子棋
- **03 牌塊與骰子 (2款)**：西洋骨牌、快艇骰子
- **04 運動與街機 (5款)**：玩具網球／足球／拳擊／棒球、羽毛球接殺訓練
- **05 益智 (3款)**：神秘液體排序、章魚燒、俄羅斯方塊
- **06 迷你遊戲 (5款)**：彈戲、軌道車、猜顏色、坦克對決、武士反應訓練

*(詳細規格請見 [GitHub 倉庫](https://github.com/poirotw66/Clubhouse-Games) 內各分類資料夾下的規格文件)*

---

## 2. 系統架構與總覽選單

本專案的核心架構是透過單一的 `index.html` 站台首頁作為「總覽選單」，所有的遊戲實作則獨立置於 `Games/` 目錄之下。

![遊戲主控台](https://github.com/poirotw66/Clubhouse-Games/raw/main/title-image.png)

- **總覽選單**：負責遊戲列表呈現與入口跳轉。
- **子遊戲實作**：各遊戲獨立開發與打包，例如 `Games/Blackjack-main/`。
- **單一開發伺服器**：在本地開發時，只需啟動一個 dev server，選單與所有建置好的遊戲都會在同一個 Port 提供服務，免去管理多個微服務的麻煩。

---

## 3. 已實作遊戲範例

目前已完成建置並整合進系統的遊戲範例包含：

- **二十一點** (`Games/Blackjack-main/`)
- **連環新接龍 (FreeCell)** (`Games/FreeCell/`)
- **最後一張牌 (Last Card)** (`Games/Last-Card/`)
- **接龍 (Klondike)** (`Games/Klondike/`)
- **羽毛球接殺訓練** (`Games/Block-the-smash/`)
- **武士反應訓練** (`Games/Instant-Flash/`)
- **神秘液體排序** (`Games/Mystery-Liquid-Sort/`)

---

## 4. 本地開發與啟動流程

專案採用 TypeScript 等前端技術，且各遊戲可獨立建置：

1. **安裝根目錄依賴**：
   ```bash
   npm install
   ```
2. **安裝子專案依賴**（若有新增遊戲）：
   ```bash
   cd Games/Blackjack-main && npm install && cd ../..
   ```
3. **建置指定的遊戲**（將子遊戲編譯產出準備就緒）：
   ```bash
   npm run build:game Blackjack-main
   ```
4. **啟動統一開發伺服器**：
   ```bash
   npm run dev
   ```
5. 開啟 `http://localhost:3000` 即可看到總覽選單，點擊「進入遊戲」即可無縫切換到已建置的子遊戲。

---

## 5. 部署到 GitHub Pages

專案支援將選單與所有建置完成的子遊戲打包並發佈至 GitHub Pages。相關的建置流程、CI 腳本與本地 `build:pages` 任務皆記錄於 `docs/DEPLOYMENT.md` 中，確保自動化部署的一致性與便利性。
