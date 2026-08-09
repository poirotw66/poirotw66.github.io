---
title: "長時間 Agent Harness：跨 Context 交接、驗證與恢復設計"
description: "根據 Anthropic 的長時間 Agent 實驗，拆解 initializer、進度檔、feature inventory、Git 與端到端驗證如何讓工作跨 context 穩定延續。"
pubDate: 2026-03-30
updatedDate: 2026-08-09
tldr:
  - "長任務的核心問題不是 context window 大小，而是新 session 能否從可信狀態接手。"
  - "Initializer、可驗證的 feature inventory、Git checkpoint 與端到端測試共同構成交接協定。"
  - "Anthropic 的結果來自 full-stack web app 實驗，不能直接推廣成所有長時間任務的最佳架構。"
audience:
  - "設計 Coding Agent、研究 Agent 或自動化工作流的工程師"
  - "需要評估長時間 Agent 可靠度與人工作業邊界的技術負責人"
category: "AI Engineering"
tags: ["AI Agent", "Harness Engineering", "Claude", "架構模式"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 5
kind: "article"
showToc: true
image: "/blog/10-effective-harnesses-for-long-running-agents/title_image.webp"
---

當 Agent 的工作從幾分鐘拉長到數小時或數天，失敗通常不是「模型突然不會寫程式」，而是下一個 session 不知道上一個 session 做過什麼、哪些結果可信，以及該從哪個可恢復點繼續。Anthropic 在 [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 中，把這個問題比喻成沒有共同記憶的工程師輪班，並提出一套可實作的交接 Harness。

本文不把這套做法包裝成通用定律。它是針對 full-stack web app 實驗得到的工程模式；真正值得保存的是背後的設計原則：**把進度、完成條件、啟動方式與驗證證據搬出模型記憶，變成下一個 session 可以讀取與檢查的 artifacts。**

> **花花的一句話**
>
> 長時間 Agent 不是一直記得，而是每次忘記之後都能從可信 checkpoint 正確接手。

> **花花的工程提醒**
>
> Progress file 只能陳述「上次說自己做了什麼」；Git diff、測試結果與可重現的操作流程，才是能驗證交接內容的證據。

## 為什麼 compaction 不足以解決長任務

Context compaction 可以把舊對話壓縮成摘要，卻不保證摘要完整、狀態乾淨或完成條件沒有漂移。Anthropic 觀察到兩種反覆出現的失敗：

1. **一次做太多。** Agent 企圖一次完成整個應用，context 用盡時留下半成品；下一輪必須先猜測哪些程式碼可用。
2. **過早宣布完成。** 新 session 看見大量既有檔案，便把「已有進度」誤判為「需求已完成」。

這兩種失敗都不是多寫一句「請小心」就能解決。第一種缺少可恢復的工作粒度，第二種缺少外部化的 definition of done。因此 Harness 必須同時管理「如何開始」「一次做多少」「如何證明完成」與「如何交班」。

## 兩種角色，其實是一套交接協定

Anthropic 使用兩種 prompt 角色，但註腳特別說明：它們的 system prompt、工具與整體 Harness 相同，差別主要在初始任務。

### Initializer agent：建立可工作的起點

第一個 session 不急著完成所有功能，而是建立後續工作所需的共同介面：

- `init.sh`：用一致方式啟動開發環境，避免每輪重新探索指令。
- `claude-progress.txt`：留下已完成、下一步與已知問題的交接摘要。
- 初始 Git commit：提供可追蹤、可回復的基線。
- Feature inventory：把需求拆成可個別驗證的功能，初始狀態設為 failing。

Initializer 的價值不是「先寫更多文件」，而是降低下一輪重新建立世界模型的成本。Artifact 必須短、結構清楚且能被工具驗證；否則只是把 context debt 從對話搬到 repository。

### Coding agent：小步前進並留下乾淨狀態

後續 session 先讀進度與 Git history、啟動應用並跑基本 smoke test，再挑選一小組尚未完成的功能。完成後必須：

- 以實際使用者流程驗證，而不只看程式碼或單元測試。
- 只有在驗證成功後，才把 feature 從 failing 改成 passing。
- 提交可理解的 checkpoint，更新進度與殘留問題。
- 避免在 session 結束時留下無法啟動或需要下一輪先清理的狀態。

這使每一輪都像可 review 的小型變更，而不是把半完成工作丟給下一個 context。

## 四層 Artifact：從敘述進度到可驗證證據

| Artifact | 回答的問題 | 主要風險 |
| --- | --- | --- |
| 啟動腳本 | 如何重建環境？ | 相依版本或外部服務仍可能漂移 |
| Progress file | 上一輪認為發生了什麼？ | 可能過時或自我美化 |
| Feature inventory | 哪些需求仍未完成？ | 驗證條件若太模糊，passing 沒有意義 |
| Git 與測試證據 | 哪些改動可重現、可回復？ | 測試覆蓋不到真實行為 |

因此交接順序應是：先讀摘要，再用 repository 與 runtime 驗證摘要。不要讓文字紀錄凌駕可執行證據。

## 為什麼端到端驗證不可省略

Anthropic 的 web app 實驗提供瀏覽器自動化工具，讓 Agent 能啟動應用、操作 UI 並檢查主要流程。原因很直接：單元測試通過或 `curl` 回傳 200，不代表互動真的可用。

不過瀏覽器自動化也不是萬靈丹。視覺判斷、原生 modal、第三方登入、非確定性資料與 flaky tests 都可能製造假陽性或假陰性。實務上應把驗證分層：

1. 靜態檢查與型別檢查，快速擋掉明確錯誤。
2. 單元與整合測試，驗證資料契約及邏輯。
3. 端到端 smoke test，確認關鍵使用者旅程。
4. 對高風險操作保留人工 review 或不可繞過的 policy gate。

這與 [AI Agent 實戰指南](/blog/64-ai-agent-guide/) 的評測觀點一致：model judgment 可補充模糊品質，但 deterministic verifier 應負責可以明確判定的條件。

## 不應直接照搬的地方

這篇一手來源沒有提供跨領域 benchmark，也沒有證明 initializer/coding 兩角色優於所有替代方案。它仍有三個外部效度限制：

- 實驗集中在 full-stack web app，科學研究、資料管線與長時間營運任務的狀態模型不同。
- Feature list 適合可離散驗證的需求，對探索型任務可能過早鎖定錯誤問題。
- 多 Agent、專責 QA Agent 或單一通用 Agent 哪一種更好，Anthropic 明確列為未解問題。

因此導入時應先測量 handoff failure rate、重工時間、測試假陽性與每個 checkpoint 的恢復成本，而不是只統計完成多少功能。

## 最小可行導入清單

若要在既有專案採用，可從下列最小版本開始：

1. 提供一條能重建並啟動環境的命令。
2. 建立不可由 Agent 任意改寫驗收意義的需求清單。
3. 每輪開始先讀狀態、檢查 Git、跑 smoke test。
4. 每輪只完成一個可獨立驗證的增量。
5. 把測試輸出與 diff 當證據，文字摘要只作索引。
6. 失敗時記錄原因，將重複失敗轉為 linter、測試或 policy。

若要再往組織層級延伸，下一篇可讀 [Harness Engineering：讓 Codex 的 Repository 可讀、可驗證、可治理](/blog/11-harness-engineering/)；若想比較另一套長時間開發架構，可接著看 [Harness Design for Long-Running Apps](/blog/09-harness-design-long-running-apps/)。

## Primary sources

- [Anthropic：Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Anthropic quickstart repository](https://github.com/anthropics/claude-quickstarts/tree/main/autonomous-coding)
