---
title: "Clubhouse Games"
description: "俱樂部遊戲網頁實作合集：收錄各款遊戲規格與玩法說明，實作置於 Games/ 下，可透過遊戲總覽選單進入。含二十一點、俄羅斯方塊、黑白棋、坦克對決等，單一服務、GitHub Pages 部署。"
pubDate: 2025-03-16
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

## 概述

本專案收錄各款 **Clubhouse Games** 的規格與玩法說明文件，供後續開發使用；遊戲實作置於 `Games/` 下，可透過 **遊戲總覽選單** 進入各遊戲並部署於 GitHub Pages。

- **遊戲總覽選單**：`index.html`（站台首頁，可選取遊戲進入）
- **架構與部署**：`docs/PROJECT-STRUCTURE.md`（文件架構、Games 放置約定）
- **GitHub Pages 建置與部署**：`docs/DEPLOYMENT.md`（建置流程、CI、本地 build:pages）
- **已實作範例**：二十一點 → Games/Blackjack-main/；連環新接龍（FreeCell）→ Games/FreeCell/；最後一張牌（Last Card）→ Games/Last-Card/；接龍（Klondike）→ Games/Klondike/；羽毛球接殺訓練（Block the Smash）→ Games/Block-the-smash/；武士反應訓練（Instant Flash）→ Games/Instant-Flash/；神秘液體排序 → Games/Mystery-Liquid-Sort/

## 本地啟動（單一服務）

只會啟動 **一個** 開發伺服器，選單與所有已建置的遊戲都由同一個 port 提供。

1. **安裝依賴**（專案根目錄；子專案需各自安裝）：
   ```bash
   npm install
   cd Games/Blackjack-main && npm install && cd ../..
   cd Games/Mystery-Liquid-Sort && npm install && cd ../..
   ```
2. **建置要玩的遊戲**（例如二十一點或神秘液體排序）：
   ```bash
   npm run build:game Blackjack-main
   # 或
   npm run build:game Mystery-Liquid-Sort
   ```
3. **啟動**：
   ```bash
   npm run dev
   ```
4. 開啟 **http://localhost:3000**：總覽選單；點「進入遊戲」可進入已建置的遊戲（如二十一點）。

之後新增的遊戲也是先 `npm run build:game <資料夾名>` 再從選單進入，不會變成多個服務。

## 目錄結構

| 類別 | 資料夾 | 遊戲數 |
|------|--------|--------|
| 紙牌類型 | 01-cards/ | 4 |
| 棋盤類型 | 02-board/ | 3 |
| 牌張類型 | 03-tiles-dice/ | 2 |
| 運動機檯類型 | 04-sports-arcade/ | 5 |
| 串聯拼砌類型 | 05-puzzle/ | 3 |
| 迷你遊戲類型 | 06-minigames/ | 5 |

## 遊戲主控台
![遊戲主控台](https://github.com/poirotw66/Clubhouse-Games/raw/main/title-image.png)

## 遊戲一覽

- **01 紙牌**：二十一點、連環新接龍（FreeCell）、克朗代克接龍、最後一張牌
- **02 棋盤**：黑白棋、西洋跳棋、四子棋
- **03 牌塊與骰子**：西洋骨牌、快艇骰子
- **04 運動與街機**：玩具網球／足球／拳擊／棒球、羽毛球接殺訓練
- **05 益智**：神秘液體排序、章魚燒、俄羅斯方塊
- **06 迷你遊戲**：彈戲、軌道車、猜顏色、坦克對決、武士反應訓練

詳見 [GitHub 倉庫](https://github.com/poirotw66/Clubhouse-Games) 與倉庫內各規格文件。
