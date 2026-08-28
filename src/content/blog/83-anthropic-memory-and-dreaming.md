---
title: "Anthropic Agent Memory 是什麼：跨會話記憶與 Dreaming"
description: "拆 Anthropic 的 Agent Memory 與 Dreaming：哪個管跨會話記憶、哪個是夜間批次，兩者不要當成同一件事。"
pubDate: 2026-08-05
updatedDate: 2026-08-28
tldr:
  - "Memory API 讓 Agent 可以像操作檔案系統一樣自主管理、儲存與更新記憶，提升長期任務表現。"
  - "Dreaming 是一種非同步的背景處理機制，負責分析近期多個 Agent 的對話日誌，找出共同錯誤與有效策略並更新知識庫。"
  - "樂觀並發與權限控制確保了在數百個 Agent 並行運作時的記憶寫入安全與企業級可控性。"
audience:
  - "關注 AI Agent 底層架構設計的開發者與架構師"
  - "尋求多代理協作最佳實踐的企業工程團隊"
category: "AI Engineering"
tags: ["AI Agent", "Enterprise AI", "Evaluation"]
cluster: "ai-agent"
clusterRole: "case"
clusterOrder: 6
kind: "article"
showToc: true
image: "/blog/83-anthropic-memory-and-dreaming/title_image.webp"
---

大型語言模型（LLM）的能力在過去幾年飛速提升，AI 代理（Agent）如今已經能夠執行長達數小時甚至數天的複雜任務。我們見證了 MCP (Model Context Protocol)、工具呼叫能力以及各種 Agent SDK 的誕生。然而，Anthropic 平台團隊產品經理 Mahesh 在[近期的發表](https://www.anthropic.com/news)中指出，要讓代理系統邁向真正的「持續自我學習（Continuous Self-learning）」與長週期的上下文管理，下一個不可或缺的底層元件是**記憶**（Memory）與**作夢**（Dreaming）機制。

當開發者開始在企業環境內部署數以千計的並行代理時，他們面臨了同樣的瓶頸：各個 Agent 就像是一次性運作的運算節點，無法從同伴的錯誤中學習，也無法在單次會話（Session）之外有效累積對專案環境的認知。Anthropic 透過新推出的 Memory API 以及研究預覽階段的 Dreaming 功能，為這個痛點提出了系統性的解決方案。

<div
  data-youtube-facade
  data-mode="video"
  data-video-id="RtywqDFBYnQ"
  data-title="Memory and dreaming for self-learning agents"
  data-poster="/blog/83-anthropic-memory-and-dreaming/title_image.webp"
  data-play-label="播放演講影片"
></div>

> **花花的判斷**
>
> 隨著 AI Agent 從單兵作戰走向大規模併發協作，記憶庫已不再是簡單的文字備忘錄，而是企業級的「動態知識圖譜」。Dreaming 機制將原本需要耗費大量 Token 的「同步學習」轉移至非同步的「夜間沉澱」，這是 Agent 架構往更高效率與更穩定擴展的重要分水嶺。

## 為什麼我們需要強大的記憶機制？

對於持續運行的 Agent 而言，Memory 是讓它們能夠進化的關鍵。透過記憶，Agent 能夠了解任務的成功標準、記錄常犯錯誤，並評估不同策略的有效性。同時，它們可以學習其所處的環境，例如持續互動的程式碼庫（Codebase）、文件狀態以及各種依賴項。

更重要的是**跨代理（Cross-agent）學習**：在同一個環境中，代理能夠共享彼此的經驗。例如，Rakuten 在導入這套記憶系統後，由於 Agent 能夠捕捉並分享錯誤資訊給下一代 Agent，使得內部知識代理的「首次執行錯誤率」大幅下降了 90%。這不僅提高了智能表現，也顯著節省了 Token 消耗與系統延遲。

## Frontier Memory System 的三大設計要求

為了支援多代理系統的擴展，Anthropic 在設計 Claude Managed Agents 的 Memory API 時，遵循了三個核心設計原則：

### 1. 預設最大化智能（Maximize Intelligence by Default）
早期的代理記憶往往受限於僵化的工具呼叫或使用者手動註記。然而最新模型（例如 Claude Opus 4.7）已具備卓越的「基於檔案系統的記憶」能力。Anthropic 選擇放權，將記憶抽象化為一個虛擬檔案系統，讓 Claude 能夠透過其最擅長的 `bash` 與 `grep` 工具，自主決定哪些內容值得記錄、該如何拆分檔案以及如何組織目錄結構。

### 2. 支援大規模多代理並行（Scale with Multi-Agent Systems）
企業環境中通常有數百個 Agent 同時運作並存取共享狀態。此系統導入了兩個關鍵屬性：
- **權限範圍（Permission Scopes）**：代理可以對「組織級知識庫」（如 SOP 或最佳實踐）設定為唯讀，而對「特定任務的工作區」設定為可讀寫，藉此避免核心知識被意外覆蓋。
- **樂觀並發控制（Optimistic Concurrency）**：利用內容雜湊（Content Hash），代理在更新記憶前會先檢查狀態是否已被其他代理修改，以避免資料衝突。

### 3. 企業級控制力與獨立 API（Enterprise Control & Standalone API）
為了達到正式環境的標準，開發者必須具備完整的控制力。這套 API 提供了詳盡的**版本歷史紀錄**（Version History）與歸屬中介資料（紀錄哪個 Agent、在哪個 Session、什麼時間修改了記憶）。此外，獨立的 API 設計確保企業能在 Managed Agents 系統外介入處理，例如進行 PII（個人識別資訊）掃描過濾，或是將記憶匯出至外部的治理管線中。

## 什麼是 Dreaming（作夢）機制？

儘管同步操作的 Memory API 解決了單一代理的記憶存取問題，但在大規模多代理系統中，Anthropic 發現仍然存在效率瓶頸：個別 Agent 往往受限於自身的任務視角，難以察覺整個系統中的宏觀模式，也容易出現冗餘記錄。

為此，Anthropic 引入了 **Dreaming（作夢）** 過程。這是一個非同步的背景批次處理機制（Batch Asynchronous Process）。你可以設定在特定時間或在任務結束後觸發 Dreaming。它會全面檢視近期多個 Agent Session 的對話日誌（Transcripts），找出共同的錯誤與有效的策略，自動對記憶庫進行清理、去重與知識驗證。

> **花花的工程提醒**
>
> 導入 Dreaming 意味著你將記憶維護的運算成本轉移到了「非關鍵路徑」上。這與搜尋引擎的 Indexing 過程類似，前期投入更多運算資源來梳理知識庫，可以大幅攤提（Amortize）所有下游 Agent 在執行任務時的檢索與學習成本。

### Dreaming 的實際效益與運作模式

在一項由 Harvey 進行的法律場景測試中，部署 Dreaming 機制讓該場景的任務完成率躍升了 6 倍。在 SRE（網站可靠性工程）的自動化除錯情境中，Dreaming 的威力更加明顯：

當系統連續數次觸發 CPU 負載警報時，不同的 SRE Agent 分別進行調查並記錄結果。夜間的 Dreaming 工作會分析這 7 天來的日誌，發現多個 Agent 都在遭遇「上游 CPU 突增後 60 秒的重試延遲模式」。由於單個 Agent 只看到自己那一次的延遲，無法歸納出 60 秒的規律；而 Dreaming 能夠統整這些跨 Session 的模式，自動寫入一則經過驗證的系統除錯指南。隔天新的 Agent 遇到相同警報時，就能直接讀取此結論，避免重複調查。

## 對工程與企業的實務建議

1. **分離任務與記憶目標**：利用 Dreaming 這類「帶外（Out-of-band）」機制，可以讓執行具體任務的 Agent 專心解題，將維護記憶品質（Memory Quality）的目標交由背景程序處理，避免兩者的 Prompt 互相干擾。
2. **利用運算資源換取智能（Scaling with Compute）**：如同測試時運算（Test-time Compute）能提升推論品質，Dreaming 也讓 Agent 透過消耗額外的 Token 來換取整個系統長期穩定的認知基礎。這在大規模企業代理中是必要的投資。
3. **從儲存走向知識網絡**：隨著系統運行，Memory Store 應該被視為一個動態更新的知識庫，而非靜態的工作狀態暫存區。設計良好的版本控制與歸屬機制將會是你除錯代理行為的最後防線。

## 延伸閱讀

- [AI Agent 開發指南](/blog/64-ai-agent-guide/)
- [企業級 RAG 實踐指南](/blog/65-enterprise-rag-guide/)
- [企業級 AI 代理治理策略](/blog/39-enterprise-agentic-ai-governance/)
