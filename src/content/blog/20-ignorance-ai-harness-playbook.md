---
title: "Ignorance.ai Playbook：OpenAI、Stripe、OpenClaw 收斂的 Harness 實踐"
description: "深讀 2026 年 2 月橫向整理：工程師工作分裂為「建環境」與「管 Agent」、架構當護欄、工具即回饋、AGENTS.md 當系統紀錄，以及規劃與執行分離。"
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "深讀 2026 年 2 月橫向整理：工程師工作分裂為「建環境」與「管 Agent」、架構當護欄、工具即回饋、AGENTS.md 當系統紀錄，以及規劃與執行分離"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["AI Agent","Enterprise AI","Harness Engineering","架構模式","Codex"]
image: "/blog/20-ignorance-ai-harness-playbook/title_image.webp"
---
2026 年 2 月，**Ignorance.ai**（Charlie Guo）發表了一篇橫向整理：**OpenAI 內部重組、Peter Steinberger（OpenClaw）、Stripe Minions** 規模與風險容忍度完全不同，卻在 **Harness Engineering** 上高度收斂。這不是單一公司的工程 memo，而是把「Agent 艦隊」時代 **工程師工作如何分裂、環境如何設計、管理如何演進** 寫成可對照的 playbook。

若 [OpenAI 11](/blog/11-harness-engineering/) 是深度案例、[Hashimoto 16](/blog/16-mitchell-hashimoto-harness-origin/) 是命名與逐行 AGENTS，本篇適合讀完 Phase 1 後問：**業界共同語言長什麼樣？** 本文為 [閱讀地圖 13](/blog/13-harness-engineering-reading-map/) Phase 2（清單 **#9**）。

---

原文出處：  
**Ignorance.ai（2026）. The Emerging "Harness Engineering" Playbook.**  
網址：<https://www.ignorance.ai/p/the-emerging-harness-engineering>

---

### 背景：從 Demo 到生產級 Agent Fleet

作者先前描述過工具演進：**Copilot → 聊天 → Agent → 背景 Agent → Agent 艦隊**，每一步都比上一步快。近月的質變在於：**整隊重組圍繞 Agent**，而不只是個人試新工具。

Greg Brockman（2026）轉述：OpenAI 內部已有工程師表示，自某時點起工作 **本質改變**——此前 Codex 多寫單元測試；如今 **幾乎所有程式與大量維運／除錯** 由 Agent 完成。尚未跟上者，瓶頸常在 **環境與流程**，而非模型能力天花板。

#### 三個錨點（校準量級，非精確審計）

| 主體 | 現象（原文） | 解讀 |
|------|----------------|------|
| **Peter Steinberger / OpenClaw** | 單月 **6600+ commits**；常同時 **5–10** 個 Agent；程式可 **不必逐行讀完就 ship** | 極端個人實踐；架構由人當「善意獨裁者」 |
| **OpenAI 小隊** | **3** 位工程師、**5** 個月、約 **百萬行**、刻意 **零手寫碼**；人均 **~3.5 PR/天** 且隨人數仍增 | 內部產品；harness 從零長出 |
| **Stripe Minions** | 每週 **1000+** 已合併 PR；Slack 丟任務 → Agent 寫碼、過 CI、開 PR | 企業級 brownfield + 重型工具鏈 |

**共同結論**：瓶頸常不是「模型會不會寫碼」，而是 **結構、工具、回饋**——與 OpenAI 11 一致。三案例風險容忍不同（開源實驗 vs 內部工具 vs 支付級 production），收斂相同，**信號更強**。

---

### 核心概念 1：工程師工作分裂成兩半（且同時進行）

呼應「從 maker schedule 到 manager schedule」，但更細：

#### 一半 A：建環境（Building the harness）

OpenAI 團隊表述：Codex 卡住時，問的不是「再試一次 prompt」，而是：

> **環境缺什麼能力／結構／回饋，才讓 Agent 能可靠繼續？**

包含：架構邊界、linter、CI、文件系統、可觀測工具——即 [Hashimoto 16](/blog/16-mitchell-hashimoto-harness-origin/) 的 **「Agent 犯錯 → 工程化讓它不再犯」**。

#### 一半 B：管工作（Managing the work）

- Steinberger：**大量規劃後再執行**；OpenClaw 上當架構閘門，Discord 只談架構不談逐行 code。  
- Brockman：每隊設 **agents captain**，思考 Agent 如何嵌入工作流。  
- 作者自身：Codex App 改變節奏後，時間從 **實作** 轉向 **範圍、指揮、審查**。

#### 兩半的耦合

**不是**「先建好 harness 再管 Agent」。兩者 **同時進行**：

- Agent 失敗 → 暴露環境缺口 → 補 harness  
- Harness 越好 → 管理摩擦越低 → 可並行更多 session  

對照 [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/)：guides（前饋）與 sensors（回饋）要並用，不能只寫 AGENTS 不驗證。

---

### 核心概念 2：建 Harness——四個反覆出現的實踐

#### 2.1 架構當護欄（Architecture as guardrails）

**OpenAI**（Harness Engineering 文，Playbook 引用）：

- 嚴格 **分層領域模型**；依賴方向與邊由 **Codex 生成的 linter + 結構測試** 機械執行。  
- 在人類流程裡「囉嗦」的規則，在 Agent 世界變 **乘數**——編一次，到處適用。

**Birgitta Böckeler**（Fowler 站）：提高對 AI 產碼的信任，可能要 **縮小解空間** 而非擴大 prompt——未來可能選 **最好 harness 化** 的技術棧，而非最靈活。

**Stripe**：

- **預熱 devbox**——與人類相同的開發環境，但與 production／外網隔離。  
- **400+** 內部工具經 **Toolshed（MCP）**——Agent 需要 **與人類相同的上下文與工具面**，不是事後補一條 API。

| 組織 | 護欄型態 |
|------|----------|
| OpenAI 小隊 | 分層 + 機械 linter |
| Stripe | 同構 devbox + 工具同權 |
| 一般團隊 | ArchUnit、模組邊界、禁止跨層 import |

#### 2.2 工具是基礎也是回饋（Tools）

Brockman 建議：

> 維護團隊依賴的 **工具清單**，並指定負責人讓 Agent 能存取（CLI／MCP）。

工具 **不只擴能力**——有 linter、測試、瀏覽器自動化，人對 **每一個 diff** 才有信心。作者親身：明確指示 Codex 跑哪些 linter／測試再 commit，信心顯著上升。

**OpenAI 進階做法（Playbook 稱最聰明點之一）**：

- **Linter 錯誤訊息 = 修復指引**——違反架構時，訊息不只 flag，還 **教 Agent 怎麼改**。  
- 工具在 **工作過程中教 Agent**（Fowler 的 sensor 訊號為 LLM 設計）。

Brockman 同場加料：**快測試 + 高品質元件介面**——讓 Agent 能在邊界內組裝，而非亂接線。

#### 2.3 文件是系統紀錄（Documentation）

**AGENTS.md**（agents.md 共識）：給 Agent 的 README——build、test、慣例、架構、坑。Claude Code 預設仍用 `CLAUDE.md`，生態有輕微摩擦。

**關鍵用法**（Brockman + Hashimoto）：

- **每次 Agent 做錯就更新**——不是寫一次腐爛。  
- Hashimoto Ghostty 例：**每一行對應一個曾發生的 agent 失敗**，現在已被防止。

**OpenAI 延伸**：

- 短 **AGENTS.md 指向** `docs/` 深層真相（設計、架構圖、執行計畫、品質分級）。  
- **背景 Agent 做 doc gardening**——文件由 Agent 維護、PR 清理過時內容（與 11 一致）。

**Anthropic 長任務**（Playbook 從另一方向呼應 [10](/blog/10-effective-harnesses-for-long-running-agents/)）：

- Progress 檔、feature list；甚至 **JSON 追蹤** 比 Markdown 不易被 Agent 亂改——像 **從未見過面的工程師交班**。

#### 2.4 規劃是新版的「寫程式」（Planning）

業界共識：**先書面計畫、人審後才執行**。多數 coding 工具已有 **Plan mode**。

**Cloudflare Boris Tane**（Playbook 引用）：

> 規劃與執行分離是我做的 **單一最重要** 的事——省 token、保住架構決策權、減少廢工。

**Anthropic initializer**（[10](/blog/10-effective-harnesses-for-long-running-agents/)）：

- 從高層 prompt 產 **200+** 條 feature，每條含測試步驟，初始全標 **failing**——防止 one-shot 或過早宣稱完成。

作者體感：Codex App 顛覆日常後，**最重要工作在寫任何 code 之前**。

---

### 核心概念 3：成為 AI 管理者——三項日常技能

#### 3.1 Say no to slop

Brockman 第 5 點：

> 合併的 code 仍要有人類負責；審查標準 **至少** 與人寫 code 相同。

Agent PR 比審查快時，誘惑是 **降低門檻**——各來源都反對。

Steinberger 雖不逐行讀，但 ** deeply care 架構與可擴展性**——是 OpenClaw 的架構閘門；與貢獻者 Discord 只談大決策。Playbook 用 **資深木工／學徒** 類比：你雇的是 **成品與品味**，不一定是他親手鋸木。

作者稱之 **bullshit detection**——產出量越大越需要：是否過 clever、六個月後難維護、抽象層級是否對。

#### 3.2 編排，不只是委派（Orchestration）

| 模式 | 誰在做 | 特點 |
|------|--------|------|
| **Attended 並行** | Steinberger、作者 | 5–10 或 3–4 session；人持續 redirect |
| **Unattended 並行** | Stripe Minions | Slack 丟任務即走；人只在 review 介入 |

Unattended 需要 **更重的 harness**（Toolshed、devbox、CI）——多數團隊尚未到那裡。中間態：**複雜任務 attended，範圍清楚任務 unattended**。

對照 [Carlini 17](/blog/17-anthropic-parallel-c-compiler-agents/)：16 平行 container 是極端 attended + 鎖任務設計；Stripe 是產品化 unattended。

---

### 核心概念 4：仍困難的四個開放問題

Playbook 誠實列出 **尚無說服力共識** 之處：

1. **功能正確但難維護的 code（entropy）**  
   Brockman 收尾問：如何防止 slop 以不同形式滲透？OpenAI 開始用 **GC agent** 掃不一致——仍新興。

2. **行為驗證缺口**  
   Böckeler 批 Harness 文：缺 **功能／行為** 驗證。Anthropic 長任務研究：Agent 常 **標完成但未 E2E 測**；瀏覽器自動化有 **jagged frontier**（例如 Puppeteer 看不到 native alert）。

3. **Brownfield 翻新**  
   成功案例多為 **綠地** 或從零建 harness。十年老 codebase、無架構、測試稀疏——像第一次跑 static analysis **警報洪水**。如何 harness 化 brownfield，仍開放。

4. **文化採納**  
   不會自動發生——需要有人建 harness、定流程、迭代。**好消息**：投資會複利——每條 AGENTS 更新、每條 linter 教學、每個 MCP 工具都加速後續任務。

---

### 與 Phase 1／Phase 2 系列對照

| 文章 | Playbook 中的位置 |
|------|-------------------|
| [OpenAI 11](/blog/11-harness-engineering/) | 百萬行、AGENTS 當目錄、GC、分層 |
| [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/) | 約束解空間、guides/sensors |
| [LangChain 15](/blog/15-langchain-agent-harness-anatomy/) | 元件地圖、Terminal Bench |
| [Hashimoto 16](/blog/16-mitchell-hashimoto-harness-origin/) | Harness 命名、錯誤驅動 AGENTS |
| [Schmid 18](/blog/18-phil-schmid-agent-harness-2026/) | 2026 戰略、build-to-delete |
| [Parallel 19](/blog/19-parallel-ai-what-is-agent-harness/) | 定義與五步迴圈 |
| [HumanLayer 21](/blog/21-humanlayer-skill-issue-harness/) | 配置面戰術清單 |

Playbook 的獨特價值：**把案例合成 checklist**，方便自評「缺建環境、缺管工作、還是缺驗證」。

---

### 啟示與建議（可執行）

1. **角色**：指定 **harness owner** 或 **agents captain**；否則模型升級紅利被環境債吃掉。  
2. **Linter**：錯誤訊息要 **會教 Agent 修**，不只是擋 CI。  
3. **AGENTS.md**：短、活、指向深層 `docs/`；錯一次改一次。  
4. **Plan mode**：設為團隊預設，尤其架構與跨模組變更。  
5. **並行策略**：先強化 harness 再推 unattended；複雜任務保持 attended。  
6. **審查**：維持 slop 門檻；練 **高抽象審查**（架構、可維護性），不是逐行拼字。

---

### 小結

Ignorance.ai Playbook 記錄的是 **學科正在成形**：軟體架構、團隊管理、context engineering 交織。Steinberger 觀察：愛演算法謎題的人較難 agent-native；愛 **ship 產品** 的人適應快——「放手親手寫每一行」本身也是一種情感成本。

對讀者而言，本篇最實用的 takeaway 是 **兩半工作 + 四項建環境實踐 + 三項管理技能 + 四個開放問題**——可用一張表對照自家組織，再決定下一季投資 linter、Toolshed 類整合，還是 Plan／AGENTS 紀律。

---

### 系列導讀

- [閱讀地圖 13](/blog/13-harness-engineering-reading-map/)  
- [21 HumanLayer Skill Issue](/blog/21-humanlayer-skill-issue-harness/) · [19 Parallel.ai 科普](/blog/19-parallel-ai-what-is-agent-harness/)

---

原文出處：  
**Ignorance.ai（2026）. The Emerging "Harness Engineering" Playbook.**  
網址：<https://www.ignorance.ai/p/the-emerging-harness-engineering>
