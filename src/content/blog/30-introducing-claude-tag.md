---
title: "Anthropic 推出 Claude Tag：讓 Claude 成為團隊的常駐 AI 隊友"
description: "Anthropic 發布了專為團隊協作打造的 Claude Tag。透過在 Slack 中標註 @Claude，讓 AI 成為能主動參與討論、執行非同步任務並不斷學習的虛擬隊友。本文將詳細介紹其核心功能、使用方式、目標受眾及計費模式。"
pubDate: 2026-06-29
category: "Product Updates"
tags: ["Anthropic", "Claude", "AI Agents", "Collaboration", "Slack"]
kind: "article"
showToc: true
image: "/blog/30-introducing-claude-tag/title_image.webp"
---
## 摘要

Anthropic 於 2026 年 6 月正式發表了全新的團隊協作功能 **Claude Tag**。這標誌著 Claude 從單一使用者的對話式 AI，正式演進為能無縫融入團隊工作流程的「虛擬隊友」。團隊可以直接在 Slack 頻道中標註 `@Claude`，指派任務、授權工具存取，並讓 Claude 自主規劃與執行跨系統的專案工作。

本文將帶您深入了解 Claude Tag 的核心優勢，並統整了其**目標受眾**、**使用方式**以及企業最關心的**收費模式**。

---

## 什麼是 Claude Tag？

過去我們習慣透過一對一的聊天視窗與 AI 互動，但真實的工作往往是高度協作的。Claude Tag 是一種全新的協作模式：**讓 Claude 直接以團隊成員的身分加入 Slack 頻道。**

只要授予 Claude 進入特定頻道、存取工具、數據庫甚至程式碼庫的權限，頻道內的任何人都可以直接 tag `@Claude` 來交辦任務。它能夠記住頻道內的討論脈絡，自主規劃並執行任務，讓人類成員可以專注於其他更高價值的工作。

根據 Anthropic 官方透露，這項功能已經是他們內部最主要的協作方式，目前 Anthropic 產品團隊高達 65% 的程式碼都是由內部版本的 Claude Tag 所產出；這股趨勢也正蔓延至客服工單處理、產品數據追蹤以及系統 Bug 根因分析等各種情境。

---

## 核心優勢

與過去的「Claude in Slack」機器人不同，Claude Tag 被賦予了更強大的 Agentic（代理）能力，具備以下四大特性：

1. **多人協作體驗 (Multiplayer)**
   在同一個 Slack 頻道中，所有人面對的是「同一個擁有共同記憶的 Claude」。團隊成員可以看見 Claude 正在處理的任務，甚至可以隨時接手前一位同事與 Claude 的對話，這讓 AI 不再是一座資訊孤島，而是真正的團隊協作中心。
2. **隨時間持續學習 (Learns over time)**
   隨著 Claude 持續待在頻道中，它會自動建立對專案脈絡的理解。使用者不需要每次都從頭解釋背景知識。在管理員授權下，Claude 甚至能從其他 Slack 頻道與資料源學習隱性知識（Tacit knowledge），給出更符合公司現況的產出。
3. **具備主動性 (Takes initiative)**
   若開啟「環境模式（Ambient behavior）」，Claude 會主動為團隊提供更新。它可以跨頻道整合關聯資訊，甚至主動追蹤那些已經安靜下來、尚未解決的討論串或任務。
4. **非同步工作 (Works asynchronously)**
   交辦任務給 Claude 後，您可以直接轉身處理其他工作。Claude 能夠為自己排定時程表，在接下來的數小時或數天內自主推進專案，並在完成或遇到阻礙時於 Slack 討論串中回報。

---

## 目標受眾與適用對象

目前 Claude Tag 專注於服務**企業與團隊客戶**，個人方案使用者暫時無法使用。

- **支援的方案：** 專屬於 **Claude Team** 以及 **Claude Enterprise** 方案的客戶。
- **不支援的方案：** 目前尚未開放給 Free、Pro 或 Max 等個人訂閱方案。

對於那些已經將大量日常溝通、營運討論、程式碼審查與支援工單集中在 Slack 上的企業組織來說，Claude Tag 將能發揮最大的價值。

---

## 使用方式與設定流程

Claude Tag 替換了舊版的 `Claude in Slack` 應用程式。為了確保企業資料安全，Claude 的身分和存取權限可以被嚴格限縮。例如：您可以為「業務團隊」跟「工程團隊」建立不同權限的 Claude，業務頻道的 Claude 無法存取工程程式碼，反之亦然。

### 導入與設定步驟

系統管理員可以透過 Claude Console (`claude.ai/admin-settings/claude-tag`) 進行以下四個步驟的設定：

1. **連結 Workspace：** 將 Claude Tag 應用程式綁定至公司的 Slack Workspace。
2. **授權工具存取：** 根據不同頻道或團隊的需求，授予 Claude 存取內部 API、資料庫或其他 SaaS 工具的權限。
3. **設定預算上限：** 為了避免超額花費，管理員必須設定組織整體的月度支出上限（Spend Limit）。
4. **沙盒測試：** 在開放給全公司之前，先於私人頻道中測試 Claude 的運作狀態。

設定完成後，員工只需在授權的 Slack 頻道中輸入 `@Claude` 加上指令，即可啟動自動化工作流程。若透過 Direct Message（私訊）與 Claude 互動，則會預設使用員工個人的工具設定。

---

## 收費方式與成本控管

因為 Claude Tag 具備 Agentic 工作流能力（需要反覆思考、呼叫工具、讀取長篇歷史訊息），其 Token 消耗量通常會高於傳統的對話式問答。因此，Anthropic 在計費上採用了更靈活的機制：

1. **無額外訂閱費，採「用量計費 (Consumption-Based)」**
   只要您是 Team 或 Enterprise 客戶，即可免費啟用 Claude Tag 功能，沒有額外的「功能買斷費」或「座位費」。所有的花費完全基於 Claude 實際執行任務時**消耗的 API Token 數量**來計費。
2. **組織與頻道級別的預算控制**
   為了防止 AI 在執行自主任務（如開啟 Ambient Mode 主動監聽頻道）時產生預期外的天價帳單，Anthropic 強制要求管理員必須設定**月度支出上限（Spend Caps）**。管理員甚至可以為個別頻道設定獨立的 Token 消耗限制。
3. **計費歸屬**
   - **公共/共享頻道：** 團隊在 Slack 頻道中 `@Claude` 產生的費用，會統一計入組織層級的帳單。
   - **私訊 (DMs)：** 透過私訊或是個人 Assistant Panel 與 Claude 的互動，通常受制於個人帳號的配額或額外的 API 計費規則。
4. **早鳥試用額度 (Launch Credit)**
   為了鼓勵企業客戶無痛轉移與測試，Anthropic 針對符合資格的 Enterprise 與 Team 組織提供了初期的 Launch Credit（試用額度），讓全公司都能在不擔心帳單的情況下體驗這項新功能。

---

## 結語

Claude Tag 的推出，正式宣告了「多代理人（Multi-agent）與人類共工」時代的到來。它不再只是一個被動回答問題的工具，而是能夠理解組織上下文、主動推進專案的得力助手。透過與 Slack 的深度整合、清晰的權限劃分與基於用量的收費機制，Claude Tag 有望成為未來企業生產力升級的核心引擎。

> **延伸閱讀**
> 詳細的文件與設定指南，請參考 Anthropic 官方的 [Claude Tag 文件](https://www.claude.com/docs/claude-tag/overview) 與 [產品專頁](https://www.claude.com/product/tag)。
