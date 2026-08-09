---
title: "Grok 4.5 是什麼？SpaceXAI 程式開發模型的能力、評測與導入判斷"
description: "根據 SpaceXAI 官方發布與模型文件，釐清 Grok 4.5 的 API 規格、程式開發評測、可用管道，以及團隊導入前應自行驗證的限制。"
pubDate: 2026-07-10
updatedDate: 2026-08-09
tldr:
  - "Grok 4.5 是已正式發布的程式開發與 Agentic 工作模型，官方 API 提供 500K context、可調 reasoning effort、工具呼叫與結構化輸出。"
  - "xAI 公布的 benchmark 與 token 效率是供應商測量；採用決策應以自己的 repo、harness、權限邊界與總任務成本重跑。"
audience:
  - "評估 Coding Agent 模型的軟體工程師與平台團隊"
  - "負責模型選型、成本與風險治理的技術主管"
category: "Industry Pulse"
tags: ["AI Agent", "Machine Learning", "Cursor", "Developer Tools"]
kind: "article"
showToc: true
image: "/blog/47-spacexai-grok-4-5/title_image.jpg"
---

截至 2026 年 8 月 9 日，**Grok 4.5 是 SpaceXAI 已正式發布的模型**，不是未證實的預覽名稱。[官方發布](https://x.ai/news/grok-4-5)把它定位在 coding、agentic tasks 與 knowledge work；[開發者文件](https://docs.x.ai/developers/grok-4-5)則確認 API model ID 為 `grok-4.5`，可透過 Responses API 與 Chat Completions 使用。

真正值得工程團隊問的不是「它是不是最強」，而是：公開證據支持哪些能力、哪些數字仍只是供應商評測，以及放進自己的 Coding Agent harness 後，品質、延遲、成本與風險是否真的更好。

> **花花的一句話**
>
> Grok 4.5 的產品與 API 身份已獲官方文件確認；benchmark 可以用來決定測試順序，不能代替團隊自己的採購驗收。

## 已確認的產品身份與可用範圍

SpaceXAI 公開文件給出的可操作資訊如下：

| 面向 | 截至 2026-08-09 的官方資訊 | 導入時的意義 |
| --- | --- | --- |
| API | model ID `grok-4.5`；Responses API、Chat Completions | 可先用既有 OpenAI-compatible client 做受控試驗 |
| 輸入與輸出 | 文字與圖片輸入、文字輸出；500K context window | 大 repo 仍需做 context selection，不能把容量當成檢索品質 |
| 推理與工具 | low／medium／high reasoning；function calling、web search、X search、code execution | 工具權限與 sandbox 會直接影響成敗與風險 |
| 知識與即時性 | knowledge cutoff 為 2026-02-01；即時資訊需啟用 search tool | 不應把模型記憶當作最新套件或安全公告來源 |
| 價格 | 每百萬 input tokens US$2、cached input US$0.30、output US$6 | 應計算完整任務的重試、工具結果與 compaction 成本 |
| 產品介面 | xAI API、Grok Build、Cursor 全方案與 Office add-ins | 介面可用不代表各管道的權限、資料政策與 latency 相同 |

官方發布寫的是 Grok 4.5 was **“trained alongside Cursor”**，但沒有進一步說明資料交換、訓練責任或共同開發範圍。因此，把這句延伸成「由 SpaceXAI 與 Cursor 共同訓練」會超出目前公開證據。

## 公開的訓練方法，不等於完整模型架構

xAI 揭露 Grok 4.5 使用數萬張 NVIDIA GB300 GPU 訓練，資料涵蓋 coding、science、engineering 與 math，並經過去重、品質評分與領域篩選。強化學習階段包含數十萬個多步驟軟體工程與技術任務，以自動與模型評分器給予回饋；非同步訓練堆疊讓長時間 agent rollout 與其他學習工作並行。

這些資訊能支持一個較保守的架構理解：Grok 4.5 的工程能力來自**模型訓練、推理預算、工具介面與執行 harness 的組合**。它不能支持更細的參數量、network topology、完整訓練資料配比或安全訓練機制推論，因為上述公開頁面沒有提供這些內容。

對長任務而言，模型文件另外建議使用 `prompt_cache_key` 讓同一對話較穩定地命中快取，並對長 agent loop 使用 context compaction。這也呼應 Bloss0m 的[長任務 Harness 設計](/blog/10-effective-harnesses-for-long-running-agents/)：context window 再大，若交接狀態、測試與恢復點沒有設計，任務仍會漂移。

## Benchmark 顯示什麼，又沒有顯示什麼

xAI 發布頁列出五組程式工程評測：

| 評測 | Grok 4.5 官方公布結果 | 應如何解讀 |
| --- | ---: | --- |
| DeepSWE 1.0 | 62.0% | 各模型採各自 provider harness，不是完全相同執行環境 |
| DeepSWE 1.1 | 53% | 由 Datacurve 以 mini-swe-agent harness 執行 |
| SWE Marathon | 29.0% pass@1 | 適合觀察較長任務，但仍不是你的 codebase |
| Terminal Bench 2.1 | 83.3% | 測的是受控終端任務，不等於 production 操作安全 |
| SWE Bench Pro | 64.7% resolve rate | 可作相對訊號，不能直接外推到所有語言與 repo |

同一發布還宣稱服務速度約 80 tokens/s，並在 SWE Bench Pro 上平均使用 15,954 output tokens，約為 Opus 4.8（max）67,020 的 4.2 分之一。這是值得驗證的成本假設，但仍是 xAI 自己的比較：不同模型的 reasoning setting、harness、重試策略、快取與工具輸出都可能改變總成本。

更重要的是，這張榜單並沒有顯示 Grok 4.5 在所有欄位領先。例如 xAI 自己的圖表中，DeepSWE 1.0、DeepSWE 1.1、Terminal Bench 2.1 與 SWE Bench Pro 都有其他模型分數更高。把選定 benchmark 寫成「全面碾壓」會誤導讀者。

> **花花的工程提醒**
>
> 把 model、reasoning effort、harness、工具權限與重試上限一起鎖定後再比較；只看成功率或每 token 價格，都會漏掉真實的端到端任務成本。

## 導入前應做的四個工程決策

### 1. 用自己的工作負載建立驗收集

至少涵蓋 bug fix、跨檔案修改、測試補齊、dependency migration 與失敗復原。除了 pass rate，也記錄不必要 diff、測試可信度、人工修正時間與 rollback 次數。可搭配[Agentic Coding 的訓練與評測邊界](/blog/69-ornith-1-0-self-scaffolding-llm/)建立可重播的比較方式。

### 2. 分開量測模型成本與 Agent 成本

記錄 input、cached input、output、search／code tool 使用量、wall-clock latency 與重試。500K context 不代表每回合都應塞滿；若 prefix 穩定，才有機會從 prompt caching 得到實際收益。

### 3. 先設工具權限，再追求成功率

程式模型能呼叫 shell、search 與外部系統時，應預設最小權限、隔離 secrets、限制網路與檔案範圍，並把高風險指令放入 human approval。完整控制面可接著閱讀 [AI Agent 架構、評測與企業落地指南](/blog/64-ai-agent-guide/)。

### 4. 決定版本與變更政策

`grok-4.5-latest` 適合接受持續更新的探索環境；需要可重播結果的 CI 或受管制流程，應向供應商確認可固定的 dated version、退役政策與 fallback。模型名稱相同也不保證後端行為永遠不變。

## 實務判斷

Grok 4.5 已有正式 API、清楚定價、長 context 與多組工程 benchmark，足以進入候選清單；但公開資訊仍不足以把它描述成已被獨立證實的「最強程式模型」。最穩健的下一步是做一個固定 harness 的小型 bake-off：同一批 issue、同一權限、同一測試與成本計量，確認它是否真的降低團隊的完成時間與人工修正量。

## 主要來源

- [SpaceXAI：Introducing Grok 4.5](https://x.ai/news/grok-4-5)
- [SpaceXAI 開發者文件：Grok 4.5](https://docs.x.ai/developers/grok-4.5)
- [SpaceXAI model detail：`grok-4.5`](https://docs.x.ai/developers/models/grok-4.5)
- [SpaceXAI 官方 Grok Build repository](https://github.com/xai-org/grok-build)
