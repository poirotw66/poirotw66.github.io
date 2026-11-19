---
title: "Antigravity Swarm 如何協作？Codex 能組出相似流程嗎？"
description: "拆解 Antigravity Swarm 的協調者、共享 board 與 verifier，再對照 Codex subagents、custom agents 和 worktrees，整理可直接採用的平行工作模式。"
pubDate: 2026-11-19
updatedDate: 2026-11-19
tldr:
  - "Swarm 把平行工作做成一個可觀察的團隊流程：協調者切任務、worker 在共享 board 回報、verifier 檢查成果。"
  - "Codex 已支援 subagents、專門角色與多個 agent thread；用 worktree 可隔離不同 Codex 對話的檔案變更。"
  - "兩者不是同一套介面：Codex 沒有 Swarm 那種所有成員共用的即時訊息 board，仍要由主 Agent 綜整結果並明確安排驗證。"
  - "最實用的 Codex 起手式是並行唯讀調查，再由主 Agent 定案；只有在工作可切成不重疊區塊時才平行寫檔。"
audience:
  - "使用 Codex 或 Antigravity 處理程式開發的工程師"
  - "設計多 Agent 工作流程、程式碼審查與驗證步驟的技術負責人"
category: "AI Engineering"
tags: ["AI Agent", "Codex", "Harness Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 57
kind: "article"
showToc: true
image: "/blog/156-antigravity-swarm-codex-parallel-agents/title_image.webp"
imageAlt: "花花把三條平行工作路徑引向同一個審查關卡，象徵多個 Agent 分工後仍需集中驗證。"
---

Antigravity 的 `/swarm` 把多 Agent 協作包裝成一個看得見的團隊：一位 coordinator 拆分工作、worker 各自執行、大家在共用 board 留下任務與結果，verifier 再檢查變更。這讓人自然會問：Codex 的 subagents 能不能也這樣用？

答案是**工作方法可以借鑑，產品介面與協作機制並不相同**。Codex 已有平行 subagents、自訂角色和 agent threads；Codex app 也能用 worktrees 隔離不同對話的工作目錄。但它沒有 Swarm 那種全員共享、以貼文串起來的 live board。要在 Codex 重現可靠的協作，關鍵在任務切分、回報格式、檔案所有權與驗證責任，而不是只增加 Agent 數量。

> **花花的一句話**
>
> 多 Agent 的價值來自可獨立的工作與可檢查的交接；平行數量本身不是品質保證。

## Swarm 的核心是明確交接

依 [Antigravity Swarm 官方文件](https://antigravity.google/docs/swarm/)，使用者描述目標與驗收方式後，coordinator 會把工作拆成互不碰撞的範圍，為每位 worker 寫出公開 brief：負責什麼、不該碰什麼、做到什麼算完成。worker 在自己的對話與上下文中工作，並把進度、問題和結果貼到全隊可見的 board。

除了執行工作的 worker，coordinator 通常會安排 verifier 檢查 diff、執行測試並把問題退回修正；文件舉的比例是每兩到四位 worker 配一位 verifier。Coordinator 的主要工作是分配、判斷與回報，不親自做技術執行。另有 monitor 在團隊停滯時才出聲。閒置成員可以在 board 等待，不會持續消耗 token；如果 worker 用量配額耗盡，它會暫停，不會在配額恢復後自行重試。

這個設計把四件事放在同一條協作路徑：分工、公開交接、獨立檢查、停滯處理。Swarm 文件也提醒，它適合能拆成不同檔案、套件或調查路線的廣泛任務；相依緊密的困難問題比較適合反覆推理與修正的流程，而長期多階段專案另有 Teamwork。

## Codex 已有什麼，差別在哪裡

[Codex Subagents 文件](https://learn.chatgpt.com/docs/agent-configuration/subagents)說明，Codex 可讓主 Agent 把獨立工作交給有各自上下文的 subagents，再收集和彙整結果。你可以明確要求「每個問題一個 agent」、指定完成後要等所有回覆，也可以定義 `explorer`、`reviewer` 等 custom agents，設定角色指示、模型與推理程度。App、CLI 和 IDE extension 都能查看 subagent 活動；CLI 可用 `/subagents` 切換 agent thread。

若要平行開多個完整 Codex 對話，[worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees) 可讓它們在同一個 Git 專案的不同 checkout 工作，減少互相覆寫檔案的機會。這是**對話／工作目錄隔離**，和 Swarm worker 在同一個 coordinator board 發文不是一回事。Subagent 的檔案與權限仍依 Codex 工作階段設定；角色文字寫著「不要改檔」不會自行建立唯讀 sandbox。若目前用戶端和帳戶支援，也可以為特定 subagent 選擇模型與推理程度；這是調整角色配置，不代表自動建立跨模型 verifier。

| 面向 | Antigravity Swarm | Codex 可用做法 |
| --- | --- | --- |
| 拆分與角色 | Coordinator 指派命名 worker，發出公開 brief | 主 Agent 依提示建立 subagents；可用 custom agents 固定角色指示 |
| 成員溝通 | 全隊共用 board，成員用 mention 發文 | 主 Agent 負責交辦、追問與彙整；每位 subagent 有自己的 thread，沒有同款共用 board |
| 工作區 | 預設共用 workspace，也可給 worker 獨立 working copy | Subagents 使用工作階段環境；Codex app 的獨立對話可用 worktree 隔離 checkout |
| 驗證 | 文件明確建議安排 verifier，審查 diff 並跑測試 | 指派 reviewer subagent 或要求主 Agent 執行驗證；需在任務規格寫清楚驗收條件 |
| 可觀察性 | Swarm pane / CLI board 顯示貼文、成員狀態與關係 | 查看 subagent threads、狀態和回傳摘要；呈現方式依用戶端而異 |

表格反映的是兩套產品文件描述的工作流程。它不代表在 Codex 手動分工就能得到 Swarm 的所有狀態追蹤，也不表示 Antigravity 的 verifier 一定能抓到所有錯誤。

## 在 Codex 裡用 Swarm 的思路

Codex 的官方建議是從讀取型工作開始：程式碼探索、測試分流、log 分析與摘要，適合切成彼此獨立的問題；平行寫檔則要小心，因為共享檔案或相依步驟容易造成衝突。以下是一個可直接改寫的提示：

```text
請用 subagents 平行調查這個 bug，先不要修改任何檔案。

分工：
1. explorer：追查相關程式路徑與可能根因，附檔案和行號。
2. tests：檢查現有測試如何涵蓋此行為，找出缺少的案例。
3. reviewer：獨立檢查前兩者的推論，指出相反證據或尚未驗證的假設。

每位 agent 回報：結論、證據、仍待確認事項。等全部完成後，由你整合成一份根因判斷和最小驗證方案。不要把推測寫成已證實的事實。
```

這種安排讓多位 agent 同時讀不同面向，最後由主 Agent 擔任 coordinator，整合並做決定。等根因有證據後，再開第二階段實作。若變更範圍能切成互不重疊的檔案，可以為每個區塊定義唯一負責者，之後讓另一個 agent 審查整合結果；若需要平行進行多個完整改動，使用不同 worktree 的 Codex 對話會比讓多位寫作者同時改同一 checkout 更容易整理。

想讓回報像 board 一樣容易檢查，就把輸出格式也寫進 brief：每人回報負責範圍、已改檔案、驗證命令與結果、未解問題。接著要求主 Agent 等所有工作完成，再逐項對照 diff 和測試輸出。這是提示所建立的流程約定，不是額外的產品保證。

## verifier 不能只是「再問一個 Agent」

審查者若只看到實作者整理的摘要，很容易沿用同一個錯誤假設。對重要修改，verifier 應直接檢查實際 diff、相關上下文和測試輸出，並取得足以獨立判斷的任務規格。必要時可指定不同模型或不同審查焦點，但模型不同不等於結果必然正確。

權限也要分清楚。Codex subagents 會繼承主工作階段的 sandbox 和 approval 設定。把 `Do not edit files` 寫進 reviewer 指示，是行為要求，不會把工具權限切成唯讀；要由 sandbox 保證唯讀，應先調整主工作階段的權限。[官方權限說明](https://learn.chatgpt.com/docs/agent-configuration/subagents#approvals-and-sandbox-controls)

成本方面，每個 subagent 都會執行自己的模型與工具工作，通常比單一 Agent 消耗更多 token。若工作只有一個明確答案、步驟必須串行，或多位 Agent 會改同一份狀態，增加人數可能只增加交接成本。[Codex 文件](https://learn.chatgpt.com/docs/agent-configuration/subagents#why-subagent-workflows-help)也建議先從讀取型工作嘗試平行化。

> **花花的工程提醒**
>
> 「獨立 reviewer」必須能看見原始證據；「唯讀 reviewer」則需要權限設定支撐。角色名稱和提示詞不能代替這兩項條件。

## 哪些工作值得組成小隊

可以先問三個問題：工作能否分成互相獨立的子問題？每個結果是否能用檔案、測試或引用證據檢查？整合成本是否低於序列執行的時間與注意力成本？若三題多半答「是」，可以先用兩三個讀取型 subagents；若答案是否，主 Agent 單線處理通常更直接。

Codex 現階段足以採用 Swarm 最重要的工程原則：清楚分工、限制重疊、指定回報格式、等待結果、獨立驗證。它提供的是以主 Agent 和 agent threads 為中心的協作，不是 Antigravity Swarm 的 board 複製品。想了解 Codex 的 `/review`、Subagents 和不同審查層次，可接著看[Codex 的第二意見工作流](/blog/134-codex-second-opinion-review-workflows/)；Agent harness 的其他元件可參考 [Harness Engineering 指南](/blog/11-harness-engineering/)。

## 來源

- Google Antigravity, [Swarm (`/swarm`) 官方文件](https://antigravity.google/docs/swarm/)
- OpenAI, [Codex Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- OpenAI, [Codex Worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees)
