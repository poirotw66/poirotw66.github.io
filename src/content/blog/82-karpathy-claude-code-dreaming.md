---
title: "Andrej Karpathy 解決了 Claude Code 的最大弱點：讓 AI 學會「作夢」(Dreaming)"
description: "Anthropic 正式推出 Claude Code 的 Dreaming 功能，解決 AI 代理在「同步寫入記憶」時遭遇的上下文斷層與注意力分散問題，讓 AI 代理能夠像人類大腦一樣在夜間自動梳理、沉澱與進化。"
pubDate: 2026-08-05
updatedDate: 2026-08-05
tldr:
  - "人類大腦會在睡眠時沉澱白天的上下文並更新神經元權重，而過去的 LLM 每次啟動都是「零上下文」的全新狀態。"
  - "讓 Agent 在執行任務時同步寫入記憶（In-band memory）會導致三大問題：注意力分散、遺漏跨會話模式、以及記憶檔案過時或衝突。"
  - "Anthropic 推出 Dreaming 機制：透過夜間批次讀取 24 小時內的會話日誌，AI 能夠跨會話找出模式、更新偏好、刪除冗餘，達到真正的持續學習與自我進化。"
audience:
  - "使用 Claude Code 或 Cursor 等 Agent 工具的軟體工程師"
  - "關注 AI Agent 記憶機制與底層架構設計的開發者"
category: "AI Engineering"
tags: ["AI Agent", "Software Engineering", "Vibe Coding"]
cluster: "ai-agent"
clusterRole: "signal"
clusterOrder: 5
kind: "article"
showToc: true
image: "/blog/82-karpathy-claude-code-dreaming/title_image.webp"
---

被譽為 AI 領域最聰明大腦之一的 **Andrej Karpathy**（現已回歸 Anthropic），在九個月前的一場訪談中，點出了當前所有大型語言模型（LLM）與 AI Agent 的最大弱點：

> 「當我清醒時，我不斷在累積一整天的『上下文視窗 (Context Window)』；但當我入睡時，某種神奇的過程發生了，這些上下文被蒸餾、壓縮，並寫入了我大腦的神經元權重中。**但現在的 LLM 缺乏『睡眠』的機制。每次啟動時，它們的上下文視窗都是 0，永遠都在從頭開始。**」

為了解決這個問題，Anthropic 在 Claude Code 中正式引入了名為 **Dreaming（作夢）** 的全域記憶整理機制。這項機制的出現，不僅徹底改變了 Agent 學習與記憶的方式，更在企業級應用（如 Harvey 與 Rakuten）中帶來了高達 6 倍的任務完成率提升。

> **花花的判斷**
>
> Agent 系統的進化方向，正在從「單次任務的推理能力」轉移到「跨會話的長期記憶整合」。未來的 AI 開發不僅僅是下 Prompt，而是設計這套幫助 Agent 沉澱經驗的「睡眠循環」。
>
> **花花的工程提醒**
>
> 讓 Agent 在執行任務時同步更新記憶檔案（In-band memory），就像讓主廚一邊高壓出餐一邊寫食譜一樣，不僅效率低下，更容易產生幻覺與衝突。將「執行」與「反思」解耦，是 Agent 架構設計的黃金法則。

## 1. 傳統「同步記憶 (In-band Memory)」的三大致命傷

在 Dreaming 功能出現之前，開發者通常會使用一個 `MEMORY.md` 檔案，並在系統提示詞中要求 Claude Code：「在完成任務時，請順便把你學到的新偏好或規則寫入 `MEMORY.md` 中。」

Anthropic 團隊指出，這種「同步記憶 (In-band Memory)」的做法存在三個無法忽視的嚴重缺陷：

1.  **注意力分散 (Split Focus)**：Agent 的注意力被強行一分為二。它既要專注於幫你修復複雜的 Bug，又要分心去維護與更新記憶檔案。這消耗了大量的 Context 運算能力。
2.  **遺漏全域模式 (Patterns Obfuscated)**：每次執行任務的 Agent 都只看到當下這個 Session 的上下文。這就像一個 NBA 教練，只看了一場 84 場例行賽中的「單場比賽」，就試圖重新安排整個球隊的先發陣容。因為缺乏跨會話 (Cross-session) 的全局視角，Agent 無法發現深層次的開發模式。
3.  **記憶過時與衝突 (Memories Go Stale)**：由於每個 Agent 都在獨立寫入記憶，你的 `MEMORY.md` 很快就會充滿互相衝突的冗餘規則；或者保留了 6 個月前早已廢棄的舊架構設定。這就像 Google Maps 堅定自信地用「10 年前的道路圖」為你導航一樣災難。

## 2. 什麼是 Dreaming（作夢）機制？

Anthropic 給出的解決方案，就是 Karpathy 所構想的 **Dreaming**。

這是一個非同步的背景運作過程。它會**跨越所有近期的 Agent 會話與日誌 (Transcripts)**，尋找重複出現的模式與錯誤，並自動產出有條理、最新且無衝突的記憶內容。

Dreaming 的終極目標是達到「持續的自我學習與自我進化 (Continuous self-learning and self-improvement)」：讓明天的 Agent，能基於昨天的教訓自動變得更聰明。

## 3. 實戰：如何為你的 Claude Code 打造「夢境閘門 (Dream Gate)」

雖然官方的 Dreaming 功能目前針對企業客戶開放，並會在背景持續消耗 API 額度，但我們完全可以使用一套 **Dream Routine (作夢排程)**，在本地環境完美復刻這套邏輯。

你可以透過建立一個自動化排程（例如每天凌晨 3:00 運行），讓 Claude Code 執行以下流程：

### 核心運作邏輯：Foresight Dream
1.  **讀取日誌 (Read Transcripts)**：讀取過去 24 小時內所有不同會話的日誌紀錄。
2.  **對比記憶 (Compare & Reconcile)**：將這些日誌與現有的 `MEMORY.md` 進行全局比對。
3.  **提取與清理 (Extract & Clean)**：
    *   找出值得保留的新事實、新偏好與開發習慣。
    *   找出已經過時、陳舊或錯誤的記憶並標記刪除。
    *   合併重複的規則。
4.  **產出報告 (Generate Report)**：產生一份標註編號的變更提案列表（附帶日誌中的引用片段作為證據），並寫入 `DREAM_REPORT.md`。
5.  **安全自動套用 (Auto-apply safe fixes)**：對於極度安全的修改（如錯字修復），可以直接寫入；但對於核心架構與偏好的改動，留給開發者在隔天早上喝咖啡時，進行手動審批（Approve / Reject）。

這套機制被稱為 **Dream Gate**。它讓你感覺身邊真的有一位共同創辦人，每天晚上幫你覆盤所有的對話細節，並不斷優化團隊的協作默契。

當 Agent 擁有了將短期上下文轉化為長期穩定權重（記憶）的能力，我們才真正踏入了具備時間連續性的 AI Engineering 新紀元。

## 延伸閱讀與參考資源

*   [/blog/49-the-new-sdlc-with-vibe-coding/](/blog/49-the-new-sdlc-with-vibe-coding/)：從 Vibe Coding 走向 Harness Engineering：Google SDLC 白皮書導讀
*   [/blog/26-anthropic-agentic-coding-expertise/](/blog/26-anthropic-agentic-coding-expertise/)：Anthropic 談 Agentic Coding 時代下的工程專業與護欄設計
*   [/blog/64-ai-agent-guide/](/blog/64-ai-agent-guide/)：Bloss0m AI Agent 系統架構與設計指南
