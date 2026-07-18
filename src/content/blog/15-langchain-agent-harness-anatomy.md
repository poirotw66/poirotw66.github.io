---
title: "LangChain 解剖 Agent Harness：從模型能力到可交付的工作引擎"
description: "深讀 LangChain 長文：Harness 的正式定義、由期望行為反推的元件鏈（檔案、Bash、沙箱、記憶、Context Rot、Ralph Loop），以及模型–Harness 共訓與 Terminal Bench 的啟示。"
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "深讀 LangChain 長文：Harness 的正式定義、由期望行為反推的元件鏈（檔案、Bash、沙箱、記憶、Context Rot、Ralph Loop），以及模型–Harness 共訓與 Terminal Bench 的啟示"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["AI Agent","Enterprise AI","Harness Engineering","Multi-Agent","LangChain"]

image: "/blog/15-langchain-agent-harness-anatomy/title_image.webp"
showToc: true
---
**Agent = Model + Harness。** 若你不是模型，你就是 Harness——LangChain 的 Vivek Trivedy 用這句話開場，但重點不在標語，而在**推導方法**：從「我們希望 Agent 能做什麼」往回推，每一項能力對應 Harness 裡的一塊工程。

本文對照 [Martin Fowler 的控制迴路](/blog/14-martin-fowler-harness-engineering-review/)（guides／sensors）與 [OpenAI repo 治理](/blog/11-harness-engineering/)（規模與架構），補上**框架與產品視角**的元件地圖。建議先讀 [閱讀地圖 13](/blog/13-harness-engineering-reading-map/)。

---

### Harness 的邊界：什麼算、什麼不算

**Harness** = 模型之外的一切：程式碼、設定、執行邏輯。  
**裸模型不是 Agent**；加上狀態、工具執行、回饋迴路、可強制約束，才成為工作引擎。

具體可包括（原文列舉）：

- System prompts  
- Tools、Skills、MCP 及其描述  
- 內建基礎設施（檔案系統、沙箱、瀏覽器）  
- 編排邏輯（子 Agent、handoff、模型路由）  
- Hooks／Middleware（compaction、continuation、lint）

邊界可以爭論，但 Trivedy 選這個切法的原因很實用：**逼我們圍繞模型智慧設計系統**，而不是把 Agent 當成「會聊天的 API」。

---

### 起點：模型原生做不了的事

模型（多數情況）輸入文字／多模態，輸出文字。開箱即用**不能**：

| 缺口 | 為何需要 Harness |
|------|------------------|
| 跨互動持久狀態 | 否則每次對話失憶 |
| 執行程式 | 否則無法改世界 |
| 即時知識 | 否則停在訓練截止日 |
| 準備執行環境 | 否則無法安裝依賴、跑測試 |

**聊天 UI** 是最早的 Harness：while 迴圈把歷史訊息 append 進 context——你已經用過，只是沒叫它 Harness。

LangChain 的推導模板：

> **想要的行為（或想修的壞行為）→ 為此設計的 Harness**

這與 Fowler 的 steering loop 一致：看見問題 → 改 guide 或 sensor（在 LangChain 語境裡常是加 tool、hook、Skill、腳本）。

---

### 檔案系統：最基礎的 primitive

**期望行為**：Agent 能碰真實資料、把塞不進 context 的內容卸載、跨 session 延續工作。

**Harness 設計**：提供檔案系統抽象與 fs 操作工具。世界本來就用檔案幹活，模型也在海量「如何用檔案」的 token 上訓練過，因此這幾乎是自然解。

解鎖的能力：

1. **工作區**：讀程式、文件、規格。  
2. **增量與卸載**：中間結果寫檔，不必全塞進 context。  
3. **協作表面**：人與多 Agent 透過共享檔案協調（Agent Teams 類架構依賴此點）。

**Git** 在檔案系統上再加版本：追蹤、回滾、分支。後文的 plan 檔、Ralph Loop、長程任務都假設「真相在 repo 裡」。

---

### Bash + 程式碼：通用工具，而非無限預置工具

**期望行為**：自主解題，不必人類為每種動作預寫工具。

**Harness 設計**：ReAct 迴圈 + **Bash／程式執行**。模型可當場寫腳本、呼叫 CLI——比固定工具集更接近「給它一台電腦」。

Harness 仍可提供專用工具（瀏覽器、DB），但**預設解題路徑**已是 code execution：模型可**動態發明工具**，而非被工具列表鎖死。

與 [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/) 對照：Bash 輸出 + 測試 runner 是 **computational sensors** 的載體。

---

### 沙箱與環境：在哪裡跑、看見什麼

**期望行為**：安全執行、可觀察結果、能裝依賴。

**Harness 設計**：

- **沙箱**：隔離執行、按需建立／銷毀、allow-list 指令、網路隔離（企業常要）。  
- **預設工具鏈**：語言 runtime、套件、git、測試 CLI、瀏覽器——**模型不會自己裝好 Node 或 Playwright**，這全是 Harness 責任。

**自驗迴路**：瀏覽器、log、截圖、測試 runner → Agent 寫 app → 跑測試 → 看 log → 修。  
「在哪跑、能用什么、如何驗證」都是 Harness 級設計決策，不是 prompt 能替代的。

這與 [Anthropic 長任務文 10](/blog/10-effective-harnesses-for-long-running-agents/) 強調 Puppeteer MCP、先跑通 dev server 再 E2E 是同一條「行為可見」路線。

---

### 記憶與搜尋：權重之外的知识

**期望行為**：記住見過的、存取訓練後的新知識。

**Harness 設計**：

| 機制 | 做法 |
|------|------|
| 跨 session 記憶 | AGENTS.md 等標準；Agent 編輯 → 下次啟動注入 context（簡化版 continual learning） |
| 知識截止 | Web Search、MCP（如 Context7）查新版本 API、即時資料 |

無法在執行時改權重時，**context 注入**是唯一正規管道——這也是為什麼 [OpenAI 11](/blog/11-harness-engineering/) 把知識做成 repo 工件。

---

### Context Rot：Harness 即 context 配送系統

**期望行為**：工作變長時，推理品質不要崩。

**Context Rot**：context 越滿，推理與任務完成度越差。Harness 必須管理這 scarce resource。

| Primitive | 解決什麼 |
|-----------|----------|
| **Compaction** | 視窗將滿時摘要／卸載；否則 API 直接爆錯——Harness **必須**有策略，不能丟給使用者 |
| **Tool output offloading** | 巨大 tool 輸出：保留頭尾 token 進 context，全文落檔，需要時再讀 |
| **Skills（漸進揭露）** | 避免啟動時塞滿所有 MCP／工具說明；模型沒選擇「一開始就載入」，是 Harness 保護模型 |

這與 [blog 10](/blog/10-effective-harnesses-for-long-running-agents/) 的 compaction 討論互補：Anthropic 說 compaction  alone 不夠；LangChain 說 compaction 是 Harness 必備之一，還要搭配檔案、plan、git。

---

### 長程自治：primitive 如何疊加

**期望行為**：複雜工作、長時間、正確、自主。

現有模型的痛點（原文）：

- **過早停止**（early stopping）  
- **分解能力差**  
- **跨多個 context window 不連貫**

**複合解法**（缺一不可）：

1. **檔案 + Git**  
   長任務可產生百萬 token 級中間產物；檔案持久化進度；git 讓新 Agent 快速讀歷史；多 Agent 共用「工作帳本」。

2. **Ralph Loop（Harness 模式）**  
   - Hook **攔截**模型「想結束」的嘗試。  
   - 在**乾淨 context** 重注入原始目標。  
   - 從檔案讀上一輪狀態，強迫繼續直到達成 completion goal。  
   沒有檔案系統就無法「新一輪讀舊狀態」。

3. **Planning + 自驗**  
   - 目標分解寫進 plan 檔（filesystem）。  
   - Prompt 提醒如何用 plan。  
   - 每步完成後：跑測試 suite（hook 餵錯誤）或 prompt 自評。  
   驗證把解法錨定在測試，形成自我改進信號。

這裡能看到 [blog 10](/blog/10-effective-harnesses-for-long-running-agents/) 的 initializer／coding agent、feature list 與 LangChain 產品 primitive 的**概念對齊**：都是把「交接與完成定義」外部化。

---

### 模型訓練與 Harness 共演化

Claude Code、Codex 等常 **post-train 時把 Harness 一併納入**：

```
有用 primitive → 進 Harness → 下一代模型更擅長在該 Harness 內行動
```

**副作用（過擬合）**：換工具實作可能變差。Codex 5.3 prompting guide 提到 `apply_patch` 格式——理論上聰明模型應能換 patch 法，但共訓會綁定特定 Harness。

**Terminal Bench 2.0 啟示**（原文強調）：

- 同一 **Opus 4.6**，在 Claude Code  harness 分數遠低於其他 harness。  
- LangChain 先前文章：只改 harness，編碼 Agent 從 Top 30 → **Top 5**。

**實務結論**：選模型要看「在你的任務、你的 harness 上」的表現，不是只看 leaderboard。投資 harness 的 ROI 可能大於換模型。

---

### Harness 會變少嗎？為什麼仍要學 Harness Engineering

模型可能內建更多規劃、自驗、長程一致性 → 部分 context 注入減少。  
但 LangChain 認為 **Harness Engineering 會像 Prompt Engineering 一樣長期存在**：

- 環境、工具、狀態、驗證迴路讓**任何**模型更有效率。  
- 今日 Harness 常「補模型不足」，但也**圍繞模型智慧做系統設計**。

**deepagents 研究方向**（原文）：

- 上百 Agent 並行同一 codebase 的編排  
- Agent 分析自己的 trace，修 harness 級失敗模式  
- **Just-in-time** 組裝工具與 context，而非全預配置

---

### 與 Fowler、OpenAI、Anthropic 的對照表

| 主題 | LangChain 15 | Fowler 14 | OpenAI 11 | Anthropic 10 |
|------|--------------|-----------|-----------|--------------|
| 定義 Harness | 模型外一切 | outer harness | 知識地圖+邊界+觀測 | initializer+coding |
| 狀態 | 檔案、git、AGENTS.md | — | docs/、AGENTS.md | progress、feature list |
| 驗證 | 沙箱內測試、瀏覽器 | sensors | E2E、UI、指標 | Puppeteer E2E |
| 長程 | Ralph、compaction | 生命週期鋪感測器 | GC 漂移 | 漸進特徵 |

---

### 啟示與建議：從元件清單到實作順序

若你要自建或評估一個 Coding Agent 產品，可依賴程度排序檢查：

1. **檔案 + git** 是否一等公民？  
2. **Bash／code exec** 是否預設可用且安全（沙箱）？  
3. **Compaction + tool offload** 是否在長任務預設開啟？  
4. **AGENTS.md／記憶檔** 是否有明確生命週期？  
5. **Plan + 測試 hook** 是否定義「完成」？  
6. 是否誤以為 **更長 system prompt** 可取代以上任一項？

團隊討論時，用 LangChain 的詞彙（filesystem、Ralph、Skills）對 Fowler 的詞彙（guide、sensor），可以避免「我們已經有 linter 了」其實只覆蓋了 sensor 的一小角。

---

### 小結

LangChain 這篇文章的價值是把 Harness **零件化與推導鏈寫清楚**：每一項能力都回答「模型原生缺什麼 → Harness 補什麼」。實作時仍要回到 Fowler：**哪些是 computational、哪些是 inferential**，以及 **behaviour harness** 是否只靠 AI 測試在撐。

---

原文出處：  
**Vivek Trivedy. The Anatomy of an Agent Harness.**  
網址：<https://blog.langchain.com/the-anatomy-of-an-agent-harness/>
