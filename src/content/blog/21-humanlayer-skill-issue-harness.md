---
title: "HumanLayer：Coding Agent 的 Skill Issue——五類 Harness 設定面實戰"
description: "深讀 HumanLayer 長文：失敗常是配置而非模型；釐清 AGENTS.md、MCP、Skills、Sub-agents、Hooks 與 back-pressure，並回應 ETH 研究與 post-training 過擬合爭論。"
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "深讀 HumanLayer 長文：失敗常是配置而非模型；釐清 AGENTS.md、MCP、Skills、Sub-agents、Hooks 與 back-pressure，並回應 ETH 研究與 post-training 過擬合爭論"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["AI Agent","Enterprise AI","Harness Engineering","Codex","Claude"]
image: "/blog/21-humanlayer-skill-issue-harness/title_image.webp"
---
HumanLayer 團隊在大量 **企業級 brownfield** 專案裡反覆看到同一模式：Agent 忽略指令、未經確認跑危險命令、簡單任務打轉——第一反應總是「等 GPT-6」。他們的結論與 [Hashimoto 16](/blog/16-mitchell-hashimoto-harness-origin/) 一致：**多半是配置（Harness）問題，不是模型智商問題**——所謂 **Skill Issue**（技能／設定問題，而非模型不夠聰明）。

```
coding agent = AI model(s) + harness
```

Skills、MCP、子 Agent、Memory、AGENTS.md 表面分散，實為同一 **配置面（configuration surface）**——Agent 的 runtime／周邊設備。本文為 [閱讀地圖 13](/blog/13-harness-engineering-reading-map/) Phase 2 收尾（清單 **#10**），把 [Playbook 20](/blog/20-ignorance-ai-harness-playbook/) 的戰略收斂落到 **可操作的五類旋鈕**。

---

原文出處：  
**HumanLayer. Skill Issue: Harness Engineering for Coding Agents.**  
網址：<https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents>

---

### 背景：為什麼「換模型」常治標不治本

企業 repo 的典型痛點：

| 症狀 | 常被誤判為 | 更常是 |
|------|------------|--------|
| 不跑測試就宣稱完成 | 模型懶 | 無 back-pressure／hook |
| 亂用危險 shell | 模型魯莽 | 無 Stop hook／權限邊界 |
| 找不到正確 API | 模型笨 | AGENTS 過長或過時；MCP 塞爆 context |
| 簡單 grep 任務打轉 | 需要更強推理 | context 已進 dumb zone |

HumanLayer 把 **Harness Engineering** 定義為：利用這些配置點，系統性提升 **產出品質與可靠性**。它是 **Context Engineering**（Dex Horthy「12-factor agents」）的子集——後者涵蓋更廣的 agent 可靠度；Harness 專注 **coding agent 的 context 窗管理**。

核心問題五連問（原文）：

1. 如何加能力？  
2. 如何教訓練資料沒有的 repo 知識？  
3. 如何在 `CRITICAL: always…` 之外加 **確定性**？  
4. 如何適配自家 codebase？  
5. 如何避免 context 被垃圾塞滿？

下文依 **AGENTS → MCP → Skills → Sub-agents → Hooks → back-pressure** 展開。

---

### 核心概念 0：Post-training 綁定 Harness 還是客製 Harness？

Frontier coding 模型常在 **特定 Harness** 上 post-train：

- Claude ↔ Claude Code 生態  
- GPT-5 Codex ↔ Codex harness（如 `apply_patch` 緊耦合；OpenCode 需相容層）

有人推論「最好用原廠 Harness」。HumanLayer 認為 **兩面**：

| 論點 | 內容 |
|------|------|
| 順原廠 | 模型在「訓練見過的介面」上可能更順 |
| 過擬合風險 | [Terminal Bench](/blog/15-langchain-agent-harness-anatomy/)：Opus 4.6 在 Claude Code 約 **#33**，換 Harness 約 **#5**（Schmid／LangChain 亦引述） |

**結論**：仍值得為 **你的 repo** 工程化 Harness，而非全用預設——尤其 brownfield、內部工具、合規邊界。與 [Schmid 18](/blog/18-phil-schmid-agent-harness-2026/)「build to delete」並行：客製的是 **規則與回饋**，不是永恆的厚重編排。

---

### 核心概念 1：CLAUDE.md／AGENTS.md——先寫，但要寫對

這些檔會 **確定性注入** system prompt。HumanLayer 與 Matt Pocock 等強調：**簡短、普遍適用、漸進揭露（progressive disclosure）**。

#### ETH Zurich 研究（138 個 agentfile）常被引用來說「沒用」

HumanLayer 的解讀是：**研究對象與最佳實踐不一致**，不是「永遠別寫」：

| 研究發現 | HumanLayer 既有建議 |
|----------|----------------------|
| LLM **生成**的 agentfile 有害、token **+20%** | 不要自動生成；人工精煉 |
| 人寫的僅 **~4%** 有幫助 | **少而精**；他們自家 **<60 行** |
| 目錄概覽無幫助 | 少放 Agent 可自行 `ls`／探索的廢話 |
| 太多條件規則 | 保持 **普遍適用**；特例進 skill 或 docs |

與 [OpenAI 11](/blog/11-harness-engineering/)「AGENTS 當目錄」、[Playbook 20](/blog/20-ignorance-ai-harness-playbook/)「錯一次改一次」、[Hashimoto 16](/blog/16-mitchell-hashimoto-harness-origin/)「每行對應一次失敗」**不矛盾**——差在 **質、長度、更新節奏**。

#### 實務建議

- 根目錄 AGENTS：**build、test、不可做之事、指向深層 docs 的連結**  
- 具體 API 範例、Linear/Jira 用法 → **Skills 或子目錄 md**，按需載入  
- Agent 犯錯 → **改 AGENTS 或加 hook**，不要只罵模型

---

### 核心概念 2：MCP——給工具，但別塞爆 context

MCP 主要用於 **擴工具**；代價是 **tool 描述進 system prompt**。

| 風險 | 說明 |
|------|------|
| Prompt injection 面 | 不信任的 MCP = 惡意描述／指令 |
| 本機 `npx`／`uvx` 伺服器 | 可能執行任意程式碼 |
| **太多工具** | context 被描述塞滿 → 更快進入 **dumb zone**（Chroma context rot 研究） |

Anthropic 方向：**MCP tool search**——漸進揭露工具，而非一次全灌。

**重複 CLI 能力**：GitHub、Docker、DB 等若已有成熟 CLI，常 **直接在 AGENTS 寫六條範例** + 讓 Agent 用 `grep`/`jq`，比巨型 MCP schema 省 token。

#### HumanLayer 案例：Linear MCP → 薄 CLI

- 移除臃腫 Linear MCP  
- 提供 **薄 CLI** + CLAUDE.md **六條** 用法範例  
- 省掉大量 tool 定義與冗長 API 回應 token  

這是 **「工具存在 ≠ 必須 MCP」** 的具體決策樹。

---

### 核心概念 3：Skills——可重用知識（漸進揭露）

**Skills** = 按需載入的 `SKILL.md`（可 bundling CLI、模板、子 md）。

解決什麼：

- 全塞 system prompt → **instruction budget** 爆掉  
- 同一 repo 多領域（payments、auth、deploy）→ 分 skill，主 Agent 決定何時讀

注意：

- **Skill registry 曾出現惡意 skill**——審核像審 `npm install`  
- 可 bundling 多個 md，由主 SKILL 指引何時讀取  
- 工具需以 **CLI／可執行檔** 分發；不能直接把 MCP 打包進 skill 檔內

與 [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/) 前饋 guides：Skills 是 **延遲載入的 guides**。

---

### 核心概念 4：Sub-agents——為 context 隔離，不是角色扮演

「前端／後端子 Agent **人設**」在 HumanLayer 經驗裡 **不好用**。好用的是 **context firewall**：

```text
父 Agent（規劃、整合）
    │
    ├─► 子 session：大量 grep、讀檔、中間 tool 輸出
    │
    └─► 父只收：精簡結論 + filepath:line 或 URL（漸進揭露）
```

呼應 **context rot**：context 越長表現越差；無關 tool 輸出是干擾。**加長 context 窗口** 常只是加大草堆。

| 維度 | 建議 |
|------|------|
| 成本 | 父 Opus 規劃，子 Sonnet／Haiku 執行重 grep |
| 無原生 sub-agent 的 harness | MCP 啟動子 session；防「子生子」與 timeout |

與 [Carlini 17](/blog/17-anthropic-parallel-c-compiler-agents/) **16 容器搶 repo** 不同：sub-agent 是 **單流程內隔離**，不是多寫手並行編譯器。

---

### 核心概念 5：Hooks——確定性控制流

Claude Code **hooks**、OpenCode **plugins**（Codex 尚無完全對等）類似 **git hooks**：

| 時機 | 可做 |
|------|------|
| 事件 | 自動跑腳本、通知 |
| Tool 呼叫前後 | 附加 context、拒絕危險 `Bash` |
| **Stop** | 跑 typecheck／build；失敗 stderr 餵回 Agent |

**Stop hook 範例（精神）**：

- 跑 biome + turbo typecheck  
- **成功完全靜默**（不把 4000 行 pass log 灌進 context）  
- **失敗才冗長 stderr**；exit code 讓 harness 繼續迴圈  

與 [Carlini 17](/blog/17-anthropic-parallel-c-compiler-agents/) 測試 log 設計、[Fowler 14](/blog/14-martin-fowler-harness-engineering-review/) sensors 同族。

其他用途：危險 migration 自動拒絕、Slack／PR／預覽環境整合。

---

### 核心概念 6：Back-pressure——自驗勝過祈禱

成功機率與 **Agent 能否驗證自己工作** 強相關：

| 機制 | 作用 |
|------|------|
| typecheck／build | 強型別語言特別有效 |
| unit／integration test | 行為正確性 |
| coverage 門檻 | Stop hook 可要求補測 |
| Playwright／agent-browser | UI／E2E |

**關鍵**：驗證輸出也要 **context-efficient**——早期全量測試 pass 灌爆 context → Agent **幻覺自己已修好**。現在最佳實踐：**成功靜默、失敗才說話**。

對照 [Playbook 20](/blog/20-ignorance-ai-harness-playbook/) 的 slop 門檻：back-pressure 是 **自動化的 bullshit detection 第一層**；人審是第二層。

---

### 什麼沒用、什麼有用（誠實清單）

**少用／避免：**

| 反模式 | 為何 |
|--------|------|
| 沒遇過真失敗就設計「完美 Harness」 | 無回饋來源 |
| 預裝一堆 skill／MCP「以防萬一」 | dumb zone、攻擊面 |
| 每 session 跑 5+ 分鐘全測 | context 與成本 |
| 過度微調子 Agent 權限 | tool thrash |

**有用：**

| 做法 | 為何 |
|------|------|
| **失敗後再加**配置 | 對齊 Hashimoto Step 5 |
| hook **設計—測試—丟棄大多數** | 只留高信噪比 |
| repo 級設定 **團隊共用** | 複利 |

與 [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/)：**偏向出貨，而非 Harness 收藏癖**。

---

### 與本系列全文對照（PRD-001 終態）

| Phase | 文章 | 本篇 21 的關係 |
|-------|------|----------------|
| 索引 | [13 閱讀地圖](/blog/13-harness-engineering-reading-map/) | #10 深讀 |
| Phase 1 | [10](/blog/10-effective-harnesses-for-long-running-agents/)、[11](/blog/11-harness-engineering/)、[14–16](/blog/14-martin-fowler-harness-engineering-review/) | 理論與組織案例 |
| Phase 2 | [17–20](/blog/17-anthropic-parallel-c-compiler-agents/) | 壓測、戰略、科普、playbook |
| **Phase 2 收尾** | **本篇 21** | **開箱即用的配置面手冊** |

站內 #1（OpenAI 敘事）、#4（Anthropic 長任務）已分別由 11、10 覆蓋；外部十篇深讀在 13 中可標 **已齊**。

---

### 啟示與建議（團隊落地順序）

1. **量 baseline**：同一任務、同一模型，只改 harness，看成功率與 token（呼應 15、18）。  
2. **AGENTS <60 行** + 錯誤驅動更新；深文放 `docs/`。  
3. **審 MCP 清單**：能 CLI 就不 MCP；必要時 tool search／薄 wrapper。  
4. **Skills 按領域拆**，禁止未審核的第三方 skill。  
5. **Stop hook + 靜默成功** 先於「再加一個 QA 子 Agent」。  
6. **Sub-agent 只為隔離 context**，不為職稱 cosplay。  
7. **指定 harness owner**（呼應 20）維護上述旋鈕。

---

### 小結

HumanLayer 的 **Skill Issue** 標題是雙關：不是侮辱模型，而是提醒 **技能樹點在配置面**。五類旋鈕 + back-pressure，把 [Ignorance Playbook](/blog/20-ignorance-ai-harness-playbook/) 的「建環境」拆成 **明天就能改的 repo 檔案與 hook**。若你只能讀 Phase 2 的一篇當手冊，**21 最貼近 daily driver**；若你要戰略與行業收斂，先 [18](/blog/18-phil-schmid-agent-harness-2026/) 與 [20](/blog/20-ignorance-ai-harness-playbook/)。

---

### 系列導讀

- [閱讀地圖 13](/blog/13-harness-engineering-reading-map/)  
- [20 Ignorance Playbook](/blog/20-ignorance-ai-harness-playbook/) · [19 Parallel.ai 科普](/blog/19-parallel-ai-what-is-agent-harness/)

---

原文出處：  
**HumanLayer. Skill Issue: Harness Engineering for Coding Agents.**  
網址：<https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents>
