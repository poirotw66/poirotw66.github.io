---
title: "Martin Fowler 談 Harness：如何用控制迴路建立對 Coding Agent 的信任"
description: "深讀 Thoughtworks 評析文：guides／sensors、computational／inferential、三類 regulation 與行為 harness 缺口，並對照 OpenAI 實戰與常見 Agent 失敗模式，整理可落地的 Harness 盤點表。"
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "深讀 Thoughtworks 評析文：guides／sensors、computational／inferential、三類 regulation 與行為 harness 缺口，並對照 OpenAI 實戰與常見 Agent 失敗模式，整理可落地的 Harness 盤點表"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["Harness Engineering", "AI Agent", "Anthropic", "Architecture Patterns", "Enterprise AI"]
image: "/blog/14-martin-fowler-harness-engineering-review/title_image.webp"
---

若你已讀過 OpenAI 的 [Harness Engineering 實戰敘事](/blog/11-harness-engineering/)，可能會問：百萬行程式碼與 AGENTS.md 之外，**一般團隊怎麼系統化地「相信」Coding Agent 的產出？** Martin Fowler 在 Thoughtworks 的長文（2026 年 4 月完整版，取代早先的 memo）把 Harness 收斂到 **Coding Agent 使用情境**，用控制論語彙回答：**信任不是感覺，而是可設計的前饋與回饋。**

本文是 [Harness 閱讀地圖](/blog/13-harness-engineering-reading-map/) Phase 1 的第二篇深讀，建議與 [LangChain 元件地圖](/blog/15-langchain-agent-harness-anatomy/) 對讀：Fowler 講「控制邏輯」，LangChain 講「產品 primitive」。

> **邊界**：業界常把「Harness」寬義成「Agent 裡除了模型以外的一切」。Fowler 刻意聚焦 **outer harness**——產品內建 system prompt、檢索、編排之外，**你為自己的系統加上的**程式碼、設定與執行邏輯。

---

### 背景：為什麼工程師天然不信任 AI 產碼

LLM **非決定**、**不知你的脈絡**、也**不以人類意義上的「理解程式」運作**（Fowler 用 token 思維描述）。在這種前提下，外層 Harness 要同時做到：

1. **提高第一次就做對的機率**——少浪費 token、少返工。  
2. **在人眼審查前盡量自我修正**——降低 review toil、提升系統品質。

這與 OpenAI 的「可觀測、可驗證、可強制架構邊界」同向；差別在 Fowler 提供**分類法**，讓你可以盤點「我們已經有哪些控制、缺哪一類」。

---

### 核心框架一：Guides（前饋）與 Sensors（回饋）

Harness 同時需要**預防**與**偵測修正**：

| 類型 | 英文 | 時機 | 目的 |
|------|------|------|------|
| 指南 | Guides | Agent **行動前** | 預期不想要的輸出，引導行為 |
| 感測器 | Sensors | Agent **行動後** | 觀測結果，觸發自我修正 |

**只有回饋**的典型症狀：Agent 反覆犯同一類錯——每次 linter 都紅，卻沒有被「教會」規則。  
**只有前饋**的典型症狀：AGENTS.md 很長，但從不驗證 Agent 是否遵守，規則變成祈禱文。

成熟做法是兩者並用，且回饋訊號最好**為 LLM 消費而設計**：例如 linter 輸出內嵌「請依專案 X 慣例修正 Y」——Fowler 稱這是一種正向的 prompt 注入，讓修正迴路**可機讀、可自動迭代**。

#### 原文中的對照範例

| 方向 | 計算／推論 | 實作範例 |
|------|------------|----------|
| 編碼慣例 | 前饋 · 推論 | AGENTS.md、Skills |
| 新專案啟動 | 前饋 · 兩者 | Skill 說明 + bootstrap script |
| 程式碼修改 | 前饋 · 計算 | OpenRewrite 等 code mod 工具 |
| 模組邊界 | 回饋 · 計算 | pre-commit / hook 跑 ArchUnit |
| 審查方式 | 回饋 · 推論 | 「如何 review」類 Skill |

---

### 核心框架二：Computational 與 Inferential

| 執行類型 | 特性 | 典型工具 |
|----------|------|----------|
| **Computational** | 決定性、快、CPU | 測試、linter、型別檢查、結構分析 |
| **Inferential** | 語意、慢、貴、非決定 | AI code review、LLM-as-judge |

- **前饋**可混搭：Skill 寫慣例（推論）+ 一鍵 bootstrap（計算）。  
- **回饋**上：計算式適合**每次變更**都跑；推論式適合任務清楚、且你願意接受機率性結果時補語意判斷。

Fowler 引用 **Ashby 必要多樣性定律**的直覺：控制器的複雜度必須匹配被控系統；對 Agent 而言，意味著不能只用一種感測器打天下。

---

### 轉向迴路（Steering loop）：人的工作是改 Harness

當同一問題**反覆出現**，工程反應應是：

- 加強 **guide**（讓它下次別再那樣做），或  
- 加強 **sensor**（讓它做錯後立刻被糾正），或兩者都做。

Coding Agent 也降低了「寫 Harness」的成本：用 Agent 生成結構測試、從觀察到的模式起草規則、從 codebase 考古寫 how-to——這與 OpenAI 用 Agent 做「垃圾回收式」漂移清理是同一 spirit，但 Fowler 把它寫成**任何規模團隊**都能採用的習慣。

---

### 品質左移：在生命週期上鋪感測器

持續整合的老問題在 Agent 時代被放大：**檢查要放在時間軸哪一段？**

**變更生命週期內（feedforward + feedback on change）**

- 整合前、甚至 commit 前：夠快就左移——linter、快測、輕量 review agent。  
- 整合後 pipeline：較貴的再跑一遍——mutation testing、需要全局視角的 code review。

**持續漂移與健康感測（continuous sensors）**

- 漸進累積的問題：死碼、覆蓋率品質、依賴漏洞掃描。  
- 執行時回饋：SLO 退化、log 異常、AI judge 抽樣回應品質等。

Inferential 感測器**不能全部堆在 PR 門禁**——成本與延遲會拖垮吞吐；要按**臨界性**分配，這點與 OpenAI 縮短 PR 生命週期、減少阻擋式 gate 的敘事可以並置思考：不是不檢查，而是**檢查重新配置**。

---

### 三類 Regulation：維護性、架構適配、行為

Fowler 用「調節目標」切 Harness，避免「Harness」一詞過空。

#### 1. Maintainability harness（目前最成熟）

本文多數例子都屬這類：內部品質、可維護性、風格、結構。既有工具鏈可直接接上。

他把**常見 Coding Agent 失敗模式**對照到這類 Harness 的覆蓋力（摘要如下）：

| 失敗模式 | Computational 感測器 | Inferential 感測器 | 備註 |
|----------|---------------------|-------------------|------|
| 重複碼、高複雜度、缺測試、架構漂移、風格違規 | 可靠捕捉 | — | 便宜、成熟 |
| 語意重複、冗餘測試、暴力修補、過度工程 | 部分 | 可部分、貴且不穩 | 不適合每次 commit 都跑 |
| 誤診問題、過度功能、誤解需求 | — | 偶爾 | **若人類沒定義清楚要什麼，無法保證正確性** |

最後一列很重要：Harness 不能取代**需求與意圖**；它只能讓「已定義的好」被維持。

#### 2. Architecture fitness harness

對應 **Fitness Functions**（演化式架構語彙）：

- 前饋：Skill 寫效能目標、可觀測性慣例（logging 標準）。  
- 回饋：效能測試、要求 Agent 反思「手邊 log 是否足夠除錯」。

這橋接了「程式寫得漂亮」與「系統在生產環境表現可接受」。

#### 3. Behaviour harness（大象在房間裡）

**功能行為是否符合需求？** 多數高自主團隊現狀是：

- **前饋**：功能規格（從一句話到多檔描述）。  
- **回饋**：AI 生成的測試全綠、覆蓋率、有人再加 mutation、最後人工測。

Fowler 認為**過度信任 AI 自生成測試**仍不足以降低監督。Thoughtworks 內部有 **approved fixtures** 模式見效，但**無法一體適用所有領域**——不是 wholesale 解法。

這直接補上 [OpenAI 11](/blog/11-harness-engineering/) 與 [Anthropic 長任務 10](/blog/10-effective-harnesses-for-long-running-agents/) 之間的缺口：前者強調 repo 與 E2E 可重現，後者強調 feature list 與瀏覽器自動化，但**「行為 harness 的通解」**仍待業界共識。

---

### Harnessability：Greenfield vs Legacy

不是每個 codebase 都同樣好「套繩」：

- 強型別 → 型別檢查天然是 sensor。  
- 清楚模組邊界 → ArchUnit 類規則可寫。  
- Spring 等框架 → 抽象掉 Agent 不必碰的細節，**隱性提高成功率**。

**Greenfield** 可從第一天選技術棧與架構，決定未來可治理性。  
**Legacy、技術債重**的系統往往**最需要 Harness、也最難建**——這是投資順序上的現實。

**Harness templates**（對應企業常見 service template）：為 API 服務、事件處理、儀表板等拓撲打包 guides + sensors。風險與 template 相同：實例化後與上游脫節；非決定性的 guide 更難做版本與回歸測試。

---

### 人的角色：隱性 Harness 無法完全外顯

人類工程師自帶：

- 從痛苦中學來的慣例與對複雜度的厭惡；  
- commit 署名帶來的社會問責；  
- 組織對技術債的容忍、對「我們這裡不這樣做」的直覺；  
- 小步前進留出的思考空間。

Agent **沒有**對 300 行函式的審美厭惡、分不清慣例是承重牆還是習慣、也不知道業務上此刻該容忍什麼債。

Harness 試圖**外顯**經驗，但 Fowler 明確說：目標不是消滅人類輸入，而是把輸入導向**意圖、取捨與例外**——與 [閱讀地圖 13](/blog/13-harness-engineering-reading-map/) 中 Harness vs Prompt / Context 的區分一致。

---

### 業界動態（原文引用的實務信號）

文章末尾列舉「已在發生」的 Harness 工程，便於你對照自家實踐：

- **OpenAI 團隊**：分層架構 + 自訂 linter／結構測試 + 定期 GC 掃漂移，結論是難點在「環境、回饋迴路、控制系統」——與 [blog 11](/blog/11-harness-engineering/) 呼應。  
- **Stripe minions**：pre-push 依 heuristic 跑相關 linter、強調 shift feedback left、blueprints 把感測器嵌進 workflow。  
- **Mutation / 結構測試**：過去 underused 的 computational feedback，在 Agent 時代復甦。  
- **LSP / code intelligence**：computational 前饋 guide 的討論升溫。  
- **Thoughtworks 專案**：API 品質（Agent + 自訂 linter）、「janitor army」提升程式品質等。

這些不是讓你抄清單，而是說明：**Harness engineering 已是進行式工程實踐**，不是一次性設定檔。

---

### 與 OpenAI、LangChain 如何並讀

| 維度 | OpenAI 11 | Fowler 14 | LangChain 15 |
|------|-----------|-----------|--------------|
| 問句 | 百萬行 agentic repo 怎麼治理？ | 如何設計信任與控制？ | Harness 由哪些 primitive 組成？ |
| 關鍵詞 | AGENTS.md、分層、GC、merge 文化 | guides、sensors、regulation 類型 | 檔案、bash、沙箱、compaction |
| 誠實缺口 | 人類注意力 | behaviour harness、harness 品質度量 | 行為驗證仍靠測試堆疊 |

---

### 仍待釐清的問題（研究與工具機會）

Fowler 刻意留開放問題，供團隊與工具商對齊：

1. Harness 變大後，guides 與 sensors **如何不一致、不互相打架**？  
2. 感測器**從不觸發**——代表品質好，還是偵測不足？  
3. Agent 在指令與回饋衝突時如何做**權衡**？  
4. 能否像 coverage / mutation 一樣，評估 **harness 本身的覆蓋與品質**？  
5. 前饋與回饋散落在 IDE、pre-commit、CI、執行時——是否需要**統一配置與推理**的平台？

---

### 啟示與建議：團隊可用的盤點步驟

若你本週只能做一件事，建議做 **Harness 盤點表**（不必一次做完）：

1. 列出最近 10 次 Agent **重複犯的同類錯誤** → 每項對應要加 guide 還是 sensor。  
2. 標記每個控制是 **computational** 還是 **inferential** → 推論類禁止預設「每 commit 必跑」。  
3. 把感測器畫在**時間軸**上：pre-commit、CI、夜間、生產監控。  
4. 單獨開一欄 **behaviour**：目前「完成定義」與「驗證」是什麼？是否過度依賴 AI 自寫測試？  
5. 每季度問：我們是在 **steering** Harness，還是只在 steering prompt？

---

### 小結

Fowler 把 Harness Engineering 從流行語收斂成：**在 Coding Agent 邊界內，用前饋引導與回饋感測器組成的控制系統**，並用三類 regulation 標出**行為驗證**仍是弱點。與 OpenAI 的規模敘事、LangChain 的元件地圖搭配，你會得到較完整的「理論 + 產品 + 組織實戰」三角。

---

### 系列導讀

- [Harness Engineering 閱讀地圖](/blog/13-harness-engineering-reading-map/)  
- [LangChain Harness 解剖](/blog/15-langchain-agent-harness-anatomy/) · [Hashimoto 六階段](/blog/16-mitchell-hashimoto-harness-origin/)

---

原文出處：  
**Martin Fowler（2026）. Harness engineering for coding agent users.**  
網址：<https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html>
