---
title: "Claude Dreaming：Agent 如何在離線階段整理長期記憶"
description: "釐清 Anthropic Dreaming 的產品範圍，並拆解非同步記憶整理能解決什麼、不能解決什麼，以及如何設計可審核的本地 Dream Gate。"
pubDate: 2026-08-05
updatedDate: 2026-08-29
tldr:
  - "Anthropic 在 Claude Managed Agents 推出 Dreaming：排程回顧過去會話、找出模式並整理記憶；它不能直接等同於 Claude Code 的通用內建功能。"
  - "把記憶維護移出任務執行路徑，可減少注意力競爭，並讓系統從跨會話證據處理重複、衝突與過時資訊。"
  - "Dreaming 更新的是外部持久記憶，不是模型權重；高影響變更仍需來源、衝突檢查、保留期限與人工核准。"
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

Anthropic 在 2026 年 Code w/ Claude 發布 **Dreaming**：一個排程執行的背景程序，會回顧過去的 Agent 會話、找出模式，並整理持久記憶。這個方向呼應 Andrej Karpathy 常用的比喻——人類會在睡眠中整合白天經驗，而 Agent 若只依賴當前 Context Window，每次新會話都得重新建立背景。

先釐清產品邊界：Anthropic 的官方發布把 Dreaming 列為 **Claude Managed Agents** 的能力，官方議程也以「self-learning agents」的記憶架構介紹它；這不等於所有 Claude Code 使用者都已有相同的通用內建功能。本文後半的 `Dream Gate` 是可自行實作的架構模式，不是 Anthropic 官方操作指南。

> **花花的判斷**
>
> Dreaming 值得關注的不是擬人化名稱，而是把「完成任務」與「整理記憶」拆成兩條生命週期：前者追求正確執行，後者負責跨會話比較、去重、衝突處理與保留期限。

> **花花的工程提醒**
>
> 記憶整理不會改寫模型權重。它更新的是 Agent 下次可讀取的外部狀態；若記憶內容錯了，系統反而可能更穩定地重複錯誤。

## 1. 為什麼不該只靠同步記憶

常見做法是維護 `MEMORY.md`，並要求 Agent 在完成任務時順便寫入偏好或規則。這種 in-band memory 很直覺，但有三個結構性問題：

1. **注意力競爭**：Agent 同時要完成任務、判斷何者值得保留，還要編輯記憶；任務與反思共用同一段 Context 與失敗預算。
2. **只看單一會話**：某次對話中的決定可能只是例外。若未比較多個會話，很難判斷它是長期規則、暫時 workaround，還是已被推翻的舊結論。
3. **重複、衝突與過時**：不同會話可能對同一主題寫入不一致規則；若沒有來源、日期與淘汰機制，記憶檔會逐漸變成無法稽核的提示詞堆積。

非同步整理的價值，是讓系統在更完整的證據範圍內處理這三類問題，而不是宣稱 Agent 因此「自我進化」。

## 2. Dreaming 真正做的是什麼

依 Anthropic 的官方發布，Dreaming 是排程程序：回顧過去 Agent Sessions、浮現重複模式並整理記憶。官方會議場次則把重點放在 Dreaming 如何驗證與豐富跨會話記憶。

工程上可把流程拆成四步：

1. **蒐集**：讀取允許納入的近期會話與既有記憶。
2. **歸納**：提出可能值得保留的偏好、慣例、失敗模式與未決事項。
3. **核對**：檢查來源、時間、衝突與適用範圍，避免把一次性狀況升格為永久規則。
4. **寫入或提案**：低風險項目更新持久記憶；高影響項目送人工審核。

這種流程改善的是 **下次執行時可取得的上下文**。它沒有對基礎模型做持續訓練，也不能保證整理後的內容正確、完整或永不過時。

## 3. 自建可審核的 Dream Gate

若工具尚未提供相同能力，可以用夜間或低流量排程實作一個保守版本。不要直接覆寫 `MEMORY.md`；先輸出 `DREAM_REPORT.md`，把每項建議當成可審查的變更：

1. 讀取明確授權且在保留期限內的會話紀錄。
2. 將候選記憶與現有規則比較，標示新增、修改、合併與刪除。
3. 每項候選都附來源會話、日期、適用專案與信心說明。
4. 對矛盾內容保留雙方證據，不讓模型自行選一方覆蓋。
5. 只有錯字或確定重複等可逆變更可自動套用；架構決策、權限、偏好與刪除一律等待核准。

最低限度還應具備：敏感資訊遮罩、資料保留期限、刪除請求、版本控制、回滾，以及「哪些會話不得進入記憶」的明確政策。

## 4. 如何判斷它是否真的有幫助

不要以「記憶檔變長」作為成功指標。可建立一組跨會話任務，觀察：

- 正確喚回率：該取用的記憶是否被取用
- 錯誤套用率：過時或跨專案規則是否被誤用
- 衝突發現率：新舊決策矛盾是否被標示
- 人工接受率：Dream Report 的提案有多少值得採用
- 復原能力：錯誤寫入後是否能追到來源並回滾

若錯誤套用率上升，更多記憶不代表更好的 Agent。批次整理的真正門檻，是把記憶視為需要治理的資料產品，而不是無限增長的提示詞。

## 結語

Dreaming 提供了一個重要的架構訊號：長時間運作的 Agent 需要獨立的記憶維護週期。它能把跨會話整理從臨時提示詞提升為正式系統能力，但不能取代驗證、權限、人工責任與淘汰機制。

最精確的說法不是「Agent 把經驗寫進自己的神經元」，而是：**系統把可追溯的會話證據整理成下次可用、可撤回的外部記憶。**

## 來源與延伸閱讀

- [Anthropic：Code w/ Claude SF 2026 發布整理](https://claude.com/blog/code-w-claude-sf-2026-sf) — Dreaming 的正式發布範圍與功能摘要
- [Anthropic：Memory and dreaming for self-learning agents](https://claude.com/code-with-claude/session/sf-memory-and-dreaming-for-self-learning-agents) — 官方會議場次與記憶架構說明
- [MemGPT：Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) — 以分層記憶管理延伸有限 Context 的研究背景
- [從 Vibe Coding 走向 Harness Engineering](/blog/49-the-new-sdlc-with-vibe-coding/)
- [Anthropic 談 Agentic Coding 的工程專業與護欄](/blog/26-anthropic-agentic-coding-expertise/)
- [AI Agent 系統架構與設計指南](/blog/64-ai-agent-guide/)
