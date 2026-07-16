---
title: "Phil Schmid：2026 年 Agent Harness 為何比模型排行榜更重要"
description: "深讀 2026 年 1 月長文：durability、OS 類比、系統評測缺口、Bitter Lesson 下的輕量 Harness，以及 hill climbing 與訓練—推理收斂。"
pubDate: 2026-05-29
category: "Enterprise AI"
tags: ["Harness Engineering", "AI Agent", "OpenAI", "Evaluation", "Enterprise AI"]
image: "/blog/18-phil-schmid-agent-harness-2026/title_image.webp"
---
多年來，AI 產業的敘事幾乎等於 **「哪個模型更聰明」**：排行榜、基準分數、單輪答題對決。Phil Schmid 在 2026 年 1 月的文章提出轉折：**頂尖模型在靜態榜單上的差距在縮小，但這可能是錯覺**——真正拉開差距的，往往是任務變長、tool call 變多之後，模型是否還能 **遵守最初指令、維持中間推理**（他稱 **durability，耐久性**）。

若 2025 年的問題是「Agent 能不能用」，2026 年更尖銳的問題是：**我們能否證明系統能可靠跑完多日工作流？** 他的答案之一，是投資 **Agent Harness**——不是再調一版 prompt，而是建 **作業系統級** 的包裹層。本文為 [閱讀地圖 13](/blog/13-harness-engineering-reading-map/) Phase 2（清單 **#7**）。

---

原文出處：  
**Phil Schmid（2026）. The importance of Agent Harness in 2026.**  
網址：<https://www.philschmid.de/agent-harness-2026>

---

### 背景：排行榜 的 1% 測不到什麼

Schmid 的論證很具體：

- 靜態 benchmark 上，第一梯隊模型分差可能只有 **1%** 量級。  
- 但任務一長，**第 50、100 次 tool call** 之後，模型可能已經 **drift**——偏離初始約束、忘記中間結論、重複錯誤路徑。  
- **1% 的榜單差距**，無法反映「跑一小時後是否仍可靠」。

因此我們需要新的能力展示方式：**不是單輪輸出分數，而是系統（模型 + harness）能否完成長鏈、多步、可驗證的工作流**。這與 [LangChain 15](/blog/15-langchain-agent-harness-anatomy/) 強調的 Terminal Bench「換 harness 排名劇變」、[Carlini 17](/blog/17-anthropic-parallel-c-compiler-agents/) 兩千次 session 實驗，是同一問題的不同尺度。

---

### 核心概念 1：Agent Harness 是什麼（與 framework 差在哪）

**定義**：Agent Harness = 圍繞 AI 模型、管理 **長時間任務** 的基礎設施。  
**不是** Agent 本身；而是讓 Agent **可靠（reliable）、可引導（steerable）、有效率** 的系統。

#### 電腦類比（原文核心比喻）

| 元件 | 類比 | 職責 |
|------|------|------|
| Model | CPU | 原始算力 |
| Context Window | RAM | 有限、易失的工作記憶 |
| **Harness** | **Operating System** | 策展 context、boot 序列（prompt/hook）、標準驅動（tool 處理） |
| Agent（你的邏輯） | Application | 跑在 OS 上的應用 |

Harness 實作 **Context Engineering** 策略：compaction、狀態卸載到儲存、子 Agent 隔離任務——讓開發者專注「應用邏輯」，少重造 OS。

#### 高於 framework

- **Framework**（LangChain 等）：提供積木——tool 抽象、agent loop、chain。  
- **Harness**：**含電池**的預設——prompt 預設、tool 處理慣例、生命週期 hook、規劃、檔案系統、子 Agent 管理。

通用 Harness 仍稀少；**Claude Code**、**Claude Agent SDK**、**LangChain DeepAgents** 被視為萌芽。也可說 **Coding CLI** 都是垂直 Harness。

---

### 核心概念 2：Benchmark 典範在變，但仍測不夠長

趨勢：從「單輪模型輸出」→「**系統評測**」（模型 + 工具 + 環境），例如 AIMO、SWE-Bench。

**缺口**：仍少測 **第 N 次 tool call 之後** 的行為。典型失敗模式：

- 單次難題：模型 **一兩次** 就做對。  
- 長工作流：跑 **一小時** 後不再遵守初始指令，或中間步驟推理錯亂。  

Schmid 認為 **標準 benchmark 難以捕捉長工作流需要的 durability**。

#### Harness 對生態的三個作用

1. **驗證真實進展（Validating Real-World Progress）**  
   Benchmark 常與**使用者真實需求**錯位；新模型兩週一發。Harness 讓大家用**同一套系統結構**，在自己的場景與約束下比較新模型——對齊「用戶體驗」而非「榜單」。

2. **釋放模型潛力（Empowering User Experience）**  
   沒有合適 Harness，產品體驗可能**遠低於**模型裸能力。釋出 Harness = 讓開發者用**已驗證的最佳實踐**組 Agent，使用者接觸到的是「完整系統」。

3. **Hill climbing（靠真實回饋爬坡）**  
   共享、穩定的 Harness 環境產生可 **log、可評分** 的 trajectory。  
   Schmid 引用 Sutton 系思想：**改進系統的能力，與你能多容易驗證輸出，成正比**。  
   Harness 把模糊的多步工作流變成**結構化資料**，才能有效迭代 benchmark 與產品。

---

### 核心概念 3：Bitter Lesson——Harness 要能拆掉

Rich Sutton **Bitter Lesson**：依賴 **通用方法 + 算力** 的系統，長期勝過堆砌人類專家知識。Agent 基建正在重演：

| 案例（原文） | 含義 |
|--------------|------|
| **Manus** | 六個月內 **重構 harness 五次**，移除僵化假設 |
| **LangChain Open Deep Research** | 一年內架構改 **三次** |
| **Vercel** | 砍掉 **80%** agent tools → 步驟更少、token 更少、更快 |

**啟示**：

- 2024 需要複雜 hand-coded pipeline 的能力，2026 可能 **一個長 context prompt** 就夠。  
- Harness **必須輕量、模組化**；否則下一次模型更新會**打壞**你的控制流。  
- 與 [Hashimoto 16](/blog/16-mitchell-hashimoto-harness-origin/)「逐行 AGENTS.md」並不衝突：外顯規則可以累積，**重型編排**要準備刪。

---

### 核心概念 4：訓練與推理環境正在收斂

Schmid 預測方向：

- 新瓶頸：**context durability**（長窗內品質維持）  
- Harness 成為偵測 **model drift** 的主戰場——例如第 100 步後何時不跟指令  
- 這些 **trajectory** 回饋 **訓練**，做出「長任務不會累」的下一代模型  

對 **builder** 的三條建議（原文）：

1. **Start simple**  
   別建巨大控制流；提供**健壯的原子工具**；讓模型做計畫；用 guardrail、retry、驗證兜底。

2. **Build to delete**  
   架構模組化；新模型會**取代**你昨天寫的「聰明邏輯」；要能**撕掉**程式碼。

3. **The harness is the dataset**  
   競爭優勢越來越不是 secret prompt，而是 Harness 捕捉的**失敗軌跡**——尤其 workflow **晚期**不跟指令的 case，是下一輪訓練與產品迭代的金礦。

---

### 與本系列其他文的對照

| 文章 | Schmid 18 補上的視角 |
|------|---------------------|
| [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/) | 為何要 sensors；durability 是長鏈上的 sensor 問題 |
| [LangChain 15](/blog/15-langchain-agent-harness-anatomy/) | Harness 元件地圖；Schmid 解釋為何要投資 OS 層 |
| [OpenAI 11](/blog/11-harness-engineering/) | 組織級 harness；Schmid 談評測與產品化 |
| [HumanLayer 21](/blog/21-humanlayer-skill-issue-harness/) | 配置面戰術；Schmid 談戰略與模型世代 |

---

### 啟示與建議

1. **選模型**：除榜單外，跑一條 **50+ tool call** 的真實工作流，看是否 drift。  
2. **建產品**：把 trajectory logging、grading 做進 Harness，讓每次失敗可分析、可回歸。  
3. **維護 Harness**：每季審計——哪些 pipeline 只因舊模型笨而存在？刪。  
4. **別與 Bitter Lesson 對抗**：保留「可刪性」比保留「當初很聰明的編排」更重要。

---

### 小結

Schmid 的文章短，但定位清晰：**2026 的競爭力 increasingly 在 Harness，不在多 1% 的 MMLU**。durability、OS 類比、hill climbing 與 build-to-delete，給技術負責人一個檢查清單——你的系統是在「比模型」，還是在「比誰更會包一層可驗證的 OS」？

---

### 系列導讀

- [閱讀地圖 13](/blog/13-harness-engineering-reading-map/)  
- [17 平行 Agent 編譯器](/blog/17-anthropic-parallel-c-compiler-agents/) · [19 Parallel.ai 科普](/blog/19-parallel-ai-what-is-agent-harness/)

---

原文出處：  
**Phil Schmid（2026）. The importance of Agent Harness in 2026.**  
網址：<https://www.philschmid.de/agent-harness-2026>
