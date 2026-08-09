---
title: "Harness Engineering：讓 Codex Repository 可讀、可驗證、可治理"
description: "解讀 OpenAI agent-first 工程實驗：如何用 repository knowledge、可觀測環境、架構 invariants 與持續清理，將人類注意力轉成可複利的控制系統。"
pubDate: 2026-03-30
updatedDate: 2026-08-09
tldr:
  - "Agent-first 團隊的稀缺資源是人類注意力；Harness 必須讓 Agent 自己取得脈絡、執行驗證並回報證據。"
  - "Repository 應提供導航地圖而非巨型說明書，並以 linter、結構測試和權限邊界執行規則。"
  - "OpenAI 的百萬行與高 PR 產出是單一內部案例，不等於其他團隊可直接複製的 benchmark。"
audience:
  - "導入 Codex 或其他 Coding Agent 的平台與開發效率團隊"
  - "負責 Agent 治理、架構一致性與軟體交付風險的技術主管"
category: "AI Engineering"
tags: ["Harness Engineering", "Codex", "Agentic Coding", "Developer Tools"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 6
kind: "article"
showToc: true
image: "/blog/11-harness-engineering/title_image.webp"
---

OpenAI 在 [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/) 描述一項刻意激進的內部實驗：小型團隊讓 Codex 產生應用、測試、CI、文件與可觀測工具，人類主要負責描述意圖、設計環境與調整控制系統。官方案例自報約百萬行程式碼、約 1,500 個 PR，以及相對傳統估算約十分之一的開發時間。

這些數字不能當成一般企業的產能承諾。真正值得解讀的，是團隊遇到失敗時沒有只要求模型「再試一次」，而是問：**Agent 缺少哪個可讀能力、回饋迴圈或不可繞過的邊界？如何把這次人類判斷寫回 repository，讓後續任務重複受益？**

> **花花的一句話**
>
> Harness Engineering 是把人類經驗寫成 Agent 能讀、能執行、也無法輕易繞過的環境規則。

> **花花的工程提醒**
>
> 文件告訴 Agent 應該怎麼做；linter、測試、權限與觀測證據則決定它是否真的照做。兩者不能互相替代。

## 案例到底證明了什麼

OpenAI 的結論不是「不再需要工程師」，而是工程工作的槓桿點改變了。當 Agent 可以大量產生程式碼，人類逐行輸入不再是主要瓶頸；規格是否清楚、環境是否可重現、錯誤是否可被 Agent 看見，以及架構是否能機械化執行，才決定產出能否維持。

官方也清楚列出未知數：這套方法目前只在特定內部產品、工具與團隊文化下運作，尚不知道多年後的架構一致性會如何演化，也不知道哪些判斷長期仍必須由人類掌握。因此應把它視為 field report，而不是受控實驗。

## 第一層：給 Agent 地圖，不是千頁手冊

OpenAI 曾嘗試把大量規則塞進單一 `AGENTS.md`，結果遇到四個問題：它占用 context、所有事項同時重要等於沒有優先順序、內容快速腐化，而且難以做 freshness 與 ownership 檢查。

較好的 repository knowledge 結構是：

- 根目錄 `AGENTS.md` 只保留工作方式、常用命令、禁止事項與文件入口。
- `docs/` 保存架構、產品規格、設計決策與執行計畫，並標明 owner 與狀態。
- 距離程式碼較近的局部規則，放在對應目錄而不是全域灌入。
- 對關鍵規則建立可執行 validator，讓過時連結、遺漏 metadata 或越界依賴在 CI 失敗。

Repository 成為 system of record 的前提，是 Agent 能搜尋、驗證並修改它；單純增加文件數量，只會增加另一種維護負擔。

## 第二層：讓應用與營運訊號對 Agent 可讀

如果 Coding Agent 只能看 source code，它只能猜 runtime 發生什麼。OpenAI 的團隊讓每個 worktree 能啟動隔離應用，並把 DOM、截圖、導覽、logs、metrics 與 traces 暴露給 Codex。如此一來，「重現 UI bug」「啟動低於 800ms」「關鍵旅程 span 不超過兩秒」才成為 Agent 可以執行的任務。

可讀性不等於把 production 權限全部交出去。實務上需要分層：

1. 每個任務使用隔離環境與最小必要資料。
2. Logs 與 traces 先做秘密資訊及個資清理。
3. Read-only 診斷與可變更 production 的能力分開授權。
4. 驗證輸出連同版本、環境與命令保存，避免只回報「已測試」。

這也是 [企業 AI Agent 安全架構](/blog/43-enterprise-ai-agent-security/) 強調 control plane 的原因：Agent 看得見系統，不代表它應能任意改變系統。

## 第三層：執行 invariants，而不是微管實作

高產出會放大 repository 既有模式。好抽象會快速複製，壞抽象也會。OpenAI 因此使用固定 domain layers、受限的 dependency directions、單一 cross-cutting provider 入口，以及 custom linters 與 structural tests 來執行架構規則。

這裡的設計判斷很重要：規則應限制風險與一致性，不應把每個實作細節寫死。例如可以要求資料形狀在 boundary 解析、禁止未結構化 logging、限制檔案大小，卻不一定指定每個 domain 必須使用同一個 library。

可執行規則最好包含：

- 依賴方向與模組邊界。
- Schema、型別與外部輸入驗證。
- 權限、secret 與 production operation 限制。
- 測試、效能、accessibility 與內容格式門檻。
- 例外流程、owner 與到期日。

若例外只能靠繞過 CI 才能完成，團隊會失去稽核線索；若規則永遠不可更新，Harness 又會變成阻礙。因此規則本身也需要版本化與 review。

## 第四層：把熵視為持續性營運成本

Agent 會模仿 repository 中既有做法。當 throughput 上升，重複 helper、過時規則與局部 workaround 也會更快累積。OpenAI 起初每週花固定時間人工清理，之後改為定義「golden principles」，讓背景任務掃描偏差、更新品質分數並提出小型 refactor PR。

這個 garbage collection 模式的重點不是自動 merge 所有清理，而是縮短壞模式存在的時間：

- 將人類 review 意見分類，找出重複發生的原因。
- 能以 formatter、linter 或測試判定者，轉成 deterministic check。
- 只能靠判斷的問題，保存好壞案例與 review rubric。
- 每次只處理有邊界的小型偏差，保留可回復性。
- 追蹤 false positive、修復時間與規則維護成本。

這正是 Harness 的複利來源：一次判斷不只修一個 PR，而是改變所有後續工作。

## 與長時間 Agent 交接模式的差異

[Anthropic 的長時間 Harness](/blog/10-effective-harnesses-for-long-running-agents/) 聚焦單一任務跨 context 的 initializer、progress artifact 與 feature verification。本篇則聚焦 repository 和團隊層級的能力：知識導航、runtime observability、架構 enforcement 與持續清理。

兩者可以組合成三個時間尺度：

| 尺度 | 需要保存的狀態 | 主要控制 |
| --- | --- | --- |
| Session 內 | 當前計畫與工具結果 | context、tool contract、即時 verifier |
| Session 之間 | checkpoint、未完成項與測試證據 | Git、progress artifact、acceptance inventory |
| 專案生命週期 | 架構規則、知識與品質趨勢 | Docs、linters、CI、observability、cleanup cadence |

## 導入時該量測什麼

不要只量 PR 數或生成行數。較能反映 Harness 是否有效的指標包括：

- Agent 第一次可重現問題所需時間。
- 不需要人類補充 context 即完成的任務比例。
- CI 首次通過率與人工 review 後返工率。
- 同類錯誤在規則化後的復發率。
- 回滾、incident 與權限越界次數。
- 文件 freshness、owner 覆蓋率與無效指令比例。

如果 throughput 上升，但 production incident、review backlog 與架構例外同步增加，那只是更快製造待處理工作，不是工程槓桿。

## 實作順序

1. 選一個低風險 repository，建立最短可用的 `AGENTS.md` 與命令地圖。
2. 讓 Agent 能在隔離環境重現、測試並留下證據。
3. 把最高頻的 review 意見轉成 validator。
4. 為高風險操作建立權限與人工 gate。
5. 每週檢查重複失敗與規則誤報，逐步更新 Harness。

完整能力地圖可接著看 [Harness Engineering 導覽](/blog/13-harness-engineering-reading-map/)；如果要把這套模式延伸到 Skills、subagents、commands 與 hooks，可讀 [Agent 時代的四種擴充能力](/blog/29-agent-era-skills-subagents-commands-hooks/)。

## Primary sources

- [OpenAI：Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
- [OpenAI：Unlocking the Codex harness](https://openai.com/index/unlocking-the-codex-harness/)
- [OpenAI：Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)
