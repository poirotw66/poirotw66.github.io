---
title: "AI 軟體開發環境選型：從 Vibe Coding 到可驗證的 Agent Workflow"
description: "InfoWorld 盤點 GitHub Copilot、Google Antigravity、JetBrains Air、Kiro、Zed 與 Zenflow；本文進一步用自主權、上下文、隔離與驗證四個控制面整理 AI 開發環境的選型方法。"
pubDate: 2026-08-12
updatedDate: 2026-08-12
tldr:
  - "AI 開發環境的差異已不只在模型，而在於它如何管理 agent 的權限、上下文、工具、隔離、恢復與驗證。"
  - "Vibe coding 適合快速原型；規格、行為、可執行事實與 intent-based workflow 則是控制複雜度的不同方法，沒有一種流程適合所有任務。"
  - "GitHub Copilot、Antigravity、JetBrains Air、Kiro、Zed 與 Zenflow 的選擇，應由任務風險與回復成本決定，而不是由支援模型數量決定。"
audience:
  - "評估 AI coding IDE、agent harness 與開發者平台的工程師"
  - "需要把 AI 輔助開發導入團隊流程的技術主管與平台團隊"
category: "AI Engineering"
tags: ["AI Agent", "Software Engineering", "Vibe Coding", "Developer Tools", "Harness Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 8
kind: "article"
showToc: true
image: "/blog/89-ai-powered-software-development-environments/title_image.webp"
---

AI coding 工具的競爭，已經從「誰能補全一行程式」移到「誰能在一個真實 repository 裡理解上下文、規劃變更、呼叫工具、執行測試，並在出錯後繼續修正」。InfoWorld 的 Martin Heller 在 2026 年 8 月的 [AI-powered software development environments 導覽](https://www.infoworld.com/article/4206868/a-brief-guide-to-ai-powered-software-development-environments.html) 中，快速比較了 GitHub Copilot、Google Antigravity、JetBrains Air、Kiro、Zed 與 Zenflow。

這篇文章最值得保留的不是六個產品的排名，而是它指出了一個工程轉折：**開發環境正在變成指揮 coding model、協調 agent 與驗證變更的 workflow surface。** 因此選型問題也要改寫成：這個環境能否把任務風險控制在可接受範圍內，並在 agent 做錯時讓團隊看得見、停得下來、恢復得了？

> **花花的一句話**
>
> AI 開發環境不是「更會寫程式的編輯器」，而是替 agent 安排上下文、權限、隔離與驗證的執行面。

## 從補全程式碼到委派軟體工作

過去的開發工具依序把協助範圍從字詞補全、程式行補全、函式補全推進到整段程式生成。當模型接上 agent harness 或 IDE 之後，它還能讀取 repository、提出修改、編譯、執行測試，再依結果迭代。

這讓工程師的工作重心從「親手寫出每一行」移向「定義問題、審查變更、驗證結果與承擔決策」。這不代表 coding 不重要，而是品質控制的位置往上移了：如果開發者不檢查、不測試，也不理解 agent 做了什麼，那就只是把生成速度換成技術債。

這也是 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 和 [Harness Engineering 的 repository 設計](/blog/11-harness-engineering/) 一直強調的共同原則：模型可以提出與執行步驟，但狀態、工具、權限、測試與停止條件仍然需要被工程化。

## Vibe coding 與結構化開發不是二選一

InfoWorld 文章把目前的拉扯描述得很準：vibe coding 很快，但缺少對最終結果的控制；specification-driven development（SDD）提供單一真實來源，卻可能對小任務過重。這不是要在兩者之間選一個永遠正確的答案，而是要依任務的失敗成本選擇足夠的結構。

| 工作方式 | 主要優勢 | 常見風險 | 適合的任務 |
| --- | --- | --- | --- |
| Vibe coding | 啟動快、探索成本低 | 需求漂移、不可追溯、技術債累積 | 一次性 prototype、低風險 spike |
| Specification-driven development | 需求、設計與任務可追蹤 | 文件成本高，規格也可能過時 | 跨模組功能、多人協作、需要驗收的工作 |
| Behavior／facts first | 讓行為或 executable invariant 成為檢查點 | 測試覆蓋不足時會產生虛假的安全感 | 可明確定義輸入、輸出與不變條件的功能 |
| Intent-driven workflow | 保留意圖、上下文與期待，減少完整規格負擔 | 方法仍在演進，團隊語意不一定一致 | 需要人機共同釐清、但不想先寫完整設計的任務 |

文章提到的 behavior-driven development、facts first 與 intent-driven software development（IDSD）比較適合被看成設計空間，而不是已經有統一標準的產品功能。工程團隊可以借用它們的思想，但仍要自己定義產物、審查點與成功條件。

> **花花的工程提醒**
>
> 「有規格」不等於「有控制」；規格若沒有對應的測試、review 與可回復執行環境，只是另一份 agent 可能誤讀的上下文。

## 六種 AI 開發環境，其實在解不同的問題

以下整理以 InfoWorld 的 2026 年 8 月產品 snapshot 為起點，並把產品描述轉成平台工程的比較語言。版本、價格、模型清單與可用功能會變動，正式選型仍應以各產品當下文件與自己的試跑結果為準。

| 環境 | 核心定位 | 主要控制面 | 選型時要驗證什麼 |
| --- | --- | --- | --- |
| [GitHub Copilot](https://github.com/features/copilot) | 跨 IDE、CLI 與 GitHub 的成熟 coding assistant／agent surface | Plan、Ask、Agent 模式；模型、MCP 與 plugin 生態 | 工具與權限是否可治理、token 用量如何追蹤、不同 client 是否一致 |
| [Google Antigravity](https://antigravity.google/product/antigravity-2) | agent-first desktop、IDE、CLI 與 SDK 生態 | agent manager、browser subagent、skills 與 terminal／browser action | 長任務權限、瀏覽器副作用、session 可觀測性與模型成本 |
| [JetBrains Air](https://air.dev/) | 可選 agent provider 的任務執行環境 | Local Workspace、Git Worktree、Docker、Cloud 與 plan／permission mode | 隔離是否真的生效、provider／model 能否替換、cloud task 的資料邊界 |
| [Kiro](https://kiro.dev/ide/) | 以 specs、steering 與 hooks 建立結構化 agentic development | requirements、design、tasks、EARS 與 property-based tests | 規格產出是否降低返工、steering 是否可維護、規格與實作是否同步 |
| [Zed](https://zed.dev/) | 速度快、可 BYOK 的編輯器與 agentic editing surface | inline edit、code review skill、模型 provider、collaboration、remote development | 延遲、模型成本、review gate 與本地／遠端 workspace 的差異 |
| [Zenflow](https://zencoder.ai/zenflow) | 以 workflow orchestration 協調多個 coding agent | Quick Change、Fix Bug、Spec and Build、Full SDD、平行 worktree | 任務分解、重試、測試閘門、cross-agent review 與失敗恢復 |

### GitHub Copilot：廣度與整合，不等於治理完成

Copilot 的優勢是進入點多：VS Code、Visual Studio、Vim、Neovim、JetBrains IDE、CLI 與 GitHub 網站都能使用不同形式的 coding assistance。官方文件也持續擴充支援模型；在 VS Code 內，還可以透過 AI Toolkit 或本地 Ollama 接上額外模型。

更重要的是它把 agent 工作拆成 Plan、Ask 與 Agent 等模式：先研究和規劃、只對話不修改，或直接在 workspace 編輯檔案。接上 MCP server 與 plugin 後，工具數量會快速增加，便利性也同時帶來 permission surface。

因此 Copilot 的評估重點不是「支援幾個模型」，而是企業能否回答：哪個 agent 可以使用哪些工具？政策在哪一層生效？token 或 request 的成本如何觀察？[GitHub 的 agent mode 與 MCP 文件](https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp) 已說明能力與政策入口，但團隊仍需在自己的 client matrix 上測試 enforcement。

### Google Antigravity：把 agent manager 推到桌面、CLI 與瀏覽器

Antigravity 2.0、Antigravity IDE、CLI 與 SDK 把 agent-first 開發拆成多個互相連接的 surface。InfoWorld 文章特別提到 browser subagent：它可以點擊、捲動、輸入、讀取 console log、擷取 DOM、截圖與錄影。這讓它更接近「替你操作環境的 agent」，而不只是編輯器內的對話框。

這種能力適合需要端到端檢查、瀏覽器操作或長任務協調的工作，但風險也更直接：瀏覽器 session、帳號權限、外部網站狀態與 terminal command 都可能產生真實副作用。選型時要先問清楚哪些動作需要 approval、哪些結果能被 replay，以及 agent 在長時間執行時如何被停止。

### JetBrains Air：把 agent 與執行環境分開選

Air 的特色不是單一模型或單一 IDE，而是讓你把 provider、permission mode 與 task run environment 組合起來。任務可以在目前 workspace 執行，也可以放到 Git worktree、Docker 或 cloud environment；官方文件把這些模式的隔離差異列得很清楚。

這對平台團隊很有價值，因為「agent 做得好不好」和「agent 在哪裡改檔案」可以分別測量。不過隔離名稱不等於隔離證據：要驗證 secrets、網路、檔案系統、Git branch、artifact 與 cloud logs 的實際邊界，並為每一種 environment 建立清除與回復流程。

### Kiro：用 spec artifact 對抗上下文漂移

Kiro IDE 把 spec-driven development 變成明確的檔案流程：`requirements.md` 描述使用者故事與 acceptance criteria，`design.md` 描述架構與實作考量，`tasks.md` 把工作拆成可追蹤項目。Kiro 的官方文件也以 EARS 形式整理可測試的需求，並支援由需求產生 property-based tests。

這種設計很適合跨模組功能與需要多人對齊的工作，因為 agent 不只得到一段 prompt，而是得到可以 review、修改與保存的中間產物。代價是文件維護本身成為工作：若 requirements、design 與 tasks 已經與 repository 不一致，spec 就會從單一真實來源變成錯誤的導航。

### Zed：速度與模型自由，仍要補上 review loop

Zed 以 Rust 寫成、主打速度與多模型整合，並採用相當程度的 bring-your-own-key 模式。它也支援 agentic editing、code review skill、協作與 remote development。這使它很適合熟悉 repository 的工程師，在低摩擦環境裡快速完成小型變更或審查。

但速度不是驗證。InfoWorld 的測試流程是先讓 Zed review 一個 C++ π 計算程式，再由人審查建議、准許修改，最後要求它執行驗證。這個流程本身比「讓 agent 自己改完就算完成」更值得複製：人仍保留批准點，測試結果才是變更是否落地的依據。

### Zenflow：把規格、平行任務與驗證串成 orchestration

Zenflow 把自己定位為協調 AI agent 的 workflow platform，提供從 Quick Change、Fix Bug、Spec and Build 到 Full SDD 的不同結構層級。任務可以拆成 subtasks，在各自隔離的 Git worktree 平行執行，並由自動化測試與 cross-agent code review 作為驗證閘門。

它適合需要同時推進多個變更、又不想讓 agent 直接互相污染 workspace 的團隊。不過 orchestration 也會放大管理複雜度：任務如何分解、失敗如何重試、不同 agent 的 review 是否真的獨立、parallel worktree 的成本如何控制，都要用實際專案測試，而不是只看 workflow 圖示。

## 比模型清單更重要的四個控制面

把六個產品放在一起看，可以得到一個比產品比較表更長壽的框架。AI 開發環境至少要從以下四個面向評估：

### 1. 自主權與權限

Agent 能讀哪些檔案、寫哪些檔案、呼叫哪些工具、是否能上網、是否能操作瀏覽器、是否能執行 shell command？Plan、Ask、Agent 或 full access 只是介面名稱，團隊要把它們映射到實際 capability。

### 2. 上下文與工具供應鏈

模型看見的是哪些 repository、spec、skill、MCP server、plugin、branch 與歷史決策？上下文越豐富，agent 可能越有用，也越需要記錄來源、版本與權限。把一堆工具接上去，不等於 agent 真的更可靠。

### 3. 隔離與恢復

任務是在目前工作樹、Git worktree、Docker、遠端 container 還是 cloud 執行？失敗時能否丟棄整個環境、回復 branch、保留 log 與重跑同一個任務？隔離是降低 blast radius 的手段，不是對輸出品質的保證。

### 4. 驗證與人類閘門

環境是否自動編譯、測試、lint、做 code review 或要求人工批准？驗證應在 agent 產生 side effect 之前和之後都存在：先限制它能做什麼，再檢查它做了什麼。

這四個面向也和 [從 Vibe Coding 走向 Harness Engineering](/blog/49-the-new-sdlc-with-vibe-coding/) 的觀點相連：真正的 productivity 不是讓 agent 更自由，而是讓自由行動落在可觀測、可驗證、可回復的邊界內。

## 一個務實的選型決策樹

不需要先辦一場「哪個 IDE 最強」的投票。可以先把任務按失敗成本分層：

1. **低風險、可丟棄的探索**：選擇啟動快、摩擦低的編輯器或 coding assistant，例如 Zed 或 Copilot 的 Ask／Agent 入口；要求最基本的 diff review 與測試即可。
2. **跨檔案、需要明確驗收的功能**：優先使用帶有 plan 或 spec artifact 的流程，例如 Kiro、Air 的 plan mode，或在現有 IDE 內自行建立 requirements、design、tasks。
3. **需要瀏覽器、外部工具或長時間執行的任務**：先盤點 credentials、network、browser session 與停止條件，再評估 Antigravity 等 agent-first surface；不要從「它能不能自動操作」直接跳到「它可以無人監督」。
4. **可平行拆解、需要隔離與多次驗證的工作**：評估 Zenflow 或 Air 的 worktree／Docker／cloud 模式，同時測量 task fan-out、retry、review 與清理成本。
5. **企業級導入**：先統一 repository contract、tool registry、policy、cost telemetry、test gate 與 human handoff，再決定要批准哪個產品。否則只是把不同 agent 接到一個沒有共同標準的工具箱。

## 團隊導入時不要漏掉的五個實驗

正式採用前，可以用同一個小型 repository 和同一組任務做比較：

1. **任務完成率**：不只看是否產生 diff，也看測試、lint、review 與需求驗收是否都通過。
2. **人工接管率**：記錄 agent 卡住、要求權限、產生錯誤方向或需要重做的次數。
3. **變更可追溯性**：確認每次修改都能對回 prompt、spec、tool call、model、branch 與 test result。
4. **失敗恢復時間**：故意讓依賴、測試或外部服務失敗，測量能否安全停止、回復並重跑。
5. **總成本**：把 token、訂閱、GPU、container、cloud、外部 API、review 與返工時間放在同一張帳上。

這樣測到的是整個 development environment，而不是單一模型在一個 demo prompt 上的漂亮輸出。若只比較生成速度，很容易選中一個讓 prototype 很快、卻讓維護和事故處理更慢的工具。

## 文章 snapshot 的限制

這篇 InfoWorld 文章是第一人稱的產品導覽與實作觀察，不是同一任務、同一模型、同一成本條件下的標準化 benchmark。因此，以下邊界應該保留：

- 「Zed 很快」、「某個工具很成熟」屬作者的使用觀察，不是跨工具的獨立效能排名。
- 模型數量、方案價格、token billing、預設模式與版本號都會快速變動，不應寫死在企業架構決策裡。
- 文件可以證明某個功能存在，不能單獨證明 agent 產出的品質、測試完整度或 production readiness。
- 隔離 worktree、Docker 或 cloud environment 能降低檔案污染和副作用的範圍，但不會自動修正錯誤需求或錯誤程式碼。
- 「沒有單一贏家」不是含糊的結論，而是因為不同工具優化的是不同控制面：速度、模型自由、規格、隔離、協調或瀏覽器操作。

## 工程團隊可以先記住的三件事

1. 先分類任務的失敗成本，再選擇 agent 的自主權；不要讓所有工作都使用同一種 full-access 模式。
2. 把 repository context、skills、MCP、branch、model、tool call 與 test result 留成可回放證據，讓 agent 的能力不依賴一次性的聊天記憶。
3. 把測試、code review、權限批准與失敗恢復當成開發環境的一部分；真正成熟的 AI coding workflow 是「生成 + 控制 + 驗證」的整體。

如果要繼續往下讀，可以先看 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 建立架構地圖，再讀 [Harness Engineering](/blog/11-harness-engineering/) 理解 repository 如何成為 agent 的工作環境，最後用 [Takt 的多模型協調拓撲](/blog/70-takt-agent-coordination-topology/) 思考平行 coding agent 的責任邊界。

## Primary sources

- [A brief guide to AI-powered software development environments — InfoWorld](https://www.infoworld.com/article/4206868/a-brief-guide-to-ai-powered-software-development-environments.html)
- [GitHub Copilot agent mode and MCP](https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp)
- [Google Antigravity 2.0](https://antigravity.google/product/antigravity-2)
- [JetBrains Air: task run environments](https://www.jetbrains.com/help/air/execution-environments.html)
- [Kiro feature specs](https://kiro.dev/docs/specs/feature-specs/)
- [Kiro steering](https://kiro.dev/docs/steering/)
- [Zed editing code](https://zed.dev/docs/editing-code)
- [Zencoder Zenflow](https://zencoder.ai/zenflow)
