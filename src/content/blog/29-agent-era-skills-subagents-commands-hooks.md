---
title: "走入 Agent 時代：拆解 Cursor / Claude Code / Codex 的四大核心基石"
description: "深度解析現代 AI 編輯器的四大 Harness 機制——Skills、Subagents、Commands 與 Hooks。釐清各平台實際設定格式、觸發時機與協作關係，從「提示詞工程」進化到「AI 工作流架構師」。"
pubDate: 2026-06-24
category: "Technology"
image: "/blog/29-agent-era-skills-subagents-commands-hooks/title_image.webp"
tags: ["AI Agent", "Cursor", "Claude Code", "Codex", "Skills", "Subagents", "Commands", "Hooks", "Harness Engineering", "MCP"]
subtitle: "Skills、Subagents、Commands、Hooks——四個機制如何把「只會打字的 AI」變成「能獨當一面的高階工程師」"
kind: guide
showToc: true
---
## 前言：從「提示詞工程」到「Agent 生態系」

進入 2026 年，若你對 AI 輔助開發的印象仍停留在「在對話框輸入 Prompt，然後複製貼上程式碼」，那就低估了現代工具的演進幅度。

從 **Cursor**（Agent / Composer 模式）、終端機原生的 **Claude Code**，到 OpenAI 的 **Codex** 與各類 **MCP（Model Context Protocol）** 工具生態，現代 AI 編輯器已從「語意續寫工具」，演變成具備**自主規劃、工具呼叫、回饋迴圈**的 Agent 系統。

用 [LangChain 的定義](/blog/15-langchain-agent-harness-anatomy/)來說：**Agent = Model + Harness**。模型負責推理；Harness 是模型之外的一切——prompt、工具、編排、安全閥、專案知識。你在 `.cursor/`、`.claude/` 等目錄裡設定的，本質上都是在工程化這層 Harness。

研究這些設定檔時，你會反覆遇到四個核心名詞：**Skills**、**Subagents**、**Commands**、**Hooks**。它們不是四個獨立功能，而是同一套 **Harness 配置面（configuration surface）** 上的四種旋鈕——各自解決不同問題，又能串成閉環。

本文從**職場比喻**、**底層邏輯**到**各平台真實設定格式**，逐一拆解這四大機制，並釐清常見誤解。

---

## 四大機制在 Harness 裡各自解決什麼？

在深入細節前，先用一張表建立心智模型。想像 AI 是剛入職的資深實習生：你需要 SOP 手冊、外包小組、快捷指令，以及自動化安全網。

| 核心概念 | 職場比喻 | 技術本質 | 解決的核心問題 |
| :--- | :--- | :--- | :--- |
| **Skills（技能）** | 按需翻閱的 SOP 手冊 | 漸進式上下文注入（Progressive Context） | AI 在特定任務上**缺知識、缺流程** |
| **Subagents（子代理）** | 外包調查小組 | 上下文隔離（Context Isolation） | 主對話**被大量中間輸出塞爆** |
| **Commands（斜線指令）** | 一鍵觸發的標準工單 | 使用者明確觸發的 Prompt 範本 | 團隊需要**可重複、可版本控管**的工作流入口 |
| **Hooks（鉤子）** | 門禁與自動化流水線 | 事件驅動攔截器（Event Interceptors） | 需要**確定性**的放行、拒絕或後處理 |

> **重要澄清：** 這四者與 **MCP**、**Rules / AGENTS.md** 並列，但職責不同。MCP 主要擴充**外部工具**；Rules / AGENTS.md 是**永遠或條件性注入**的全域指引。Skills 則是**按需載入**的領域知識——四者互補，不是互相取代。

---

## 1. Skills（技能）—— 按需載入的工作手冊

### 職場比喻

公司的 SOP 知識庫不會在員工入職第一天全部塞進腦袋。實習生遇到「部署」「寫 PR」「跑安全審查」等特定任務時，才翻開對應章節照做。Skills 就是這本**分章節、按需查閱**的手冊。

### 底層邏輯

傳統做法是把所有規則塞進 System Prompt 或 AGENTS.md，帶來兩個問題：

1. **Instruction budget 爆炸**：context 被大量文字佔滿，真正重要的訊息被稀釋（Needle in a Haystack）。
2. **更新成本高**：一個領域的 SOP 變動，可能影響整份全域 prompt。

Skills 採 **Progressive Disclosure（漸進揭露）**：

- 平時只保留 `name` + `description`（精簡 metadata）供 Agent 判斷「要不要讀這份 skill」。
- 判定相關後，才把完整 `SKILL.md` 正文（以及可選的 `reference.md`、`scripts/`）注入 context。
- Agent 還可進一步按需讀取 skill 目錄下的附檔，而非一次全灌。

這與 [HumanLayer 的 Harness 分析](/blog/21-humanlayer-skill-issue-harness/)一致：**Skills 是可重用、延遲載入的 guides**，不是另一份臃腫的 AGENTS.md。

### 真實設定格式（以 Cursor 為例）

Skills 以**目錄**存放，核心檔案為 `SKILL.md`：

```
.cursor/skills/
└── production-deploy/
    ├── SKILL.md          # 必要：主指令
    ├── reference.md      # 可選：詳細參考
    └── scripts/
        └── smoke-test.sh # 可選：可執行腳本
```

`SKILL.md` 的 frontmatter **只有** `name` 與 `description` 是必要欄位（另有 `disable-model-invocation` 等可選欄位）：

```markdown
---
name: production-deploy
description: >-
  Deploy this project to production following team SOP. Use when the user
  asks to deploy, release, ship, or go live.
---

# Production Deploy SOP

When executing a deploy task, follow these steps strictly:

1. Run `npm run lint` and `npm run test`. Stop immediately on any failure.
2. Verify `.env.production` exists and required secrets are documented.
3. Build with `npm run build` only — do not use ad-hoc bundler flags.
4. After deploy, run the smoke test script in `scripts/smoke-test.sh`.
```

**常見誤解修正：**

| 誤解 | 實際情況 |
|------|----------|
| Skill 用 `triggers: ["deploy"]` 關鍵字陣列觸發 | Cursor Skills **沒有**獨立的 triggers 欄位；觸發靠 `description` 語意 + Agent 判斷 |
| Skill 是單一 `.md` 檔 | 標準格式是 **`skill-name/SKILL.md` 目錄結構** |
| Skill 等於 Slash Command | Skill 可被 Agent **自動選用**；Command 是使用者 **手動 `/` 觸發**（見下文） |

### 存放位置

| 層級 | 路徑 | 作用範圍 |
|------|------|----------|
| 專案 | `.cursor/skills/` | 隨 repo 版本控管，團隊共享 |
| 個人 | `~/.cursor/skills/` | 跨所有專案可用 |

Claude Code 也有類似的 skill 機制（常見於 `~/.claude/skills/` 或 plugin 生態）；Codex 的 skill 支援則依產品版本而異，但「按需載入領域知識」的設計精神相同。

---

## 2. Subagents（子代理）—— 上下文防火牆，不是角色扮演

### 職場比喻

PM 接到「調查整個 codebase 的 API 使用狀況」這種大任務，不會自己逐檔翻遍——而是派一組調查員出去 grep、讀檔、整理，最後只回報**結論與檔案位置**。PM 的桌面保持乾淨，才能做下一步決策。

### 底層邏輯

Context window 有限，且研究顯示 context 越長，模型在關鍵資訊上的表現越容易下降（**context rot**）。當 Agent 需要：

- 大量 `grep` / 讀檔 / 探索未知 codebase
- 產生冗長的中間 tool 輸出

若全部留在主對話，主 Agent 的「有效注意力」會被淹沒。

Subagents 的核心價值是 **Context Isolation（上下文隔離）**：

```
[使用者請求]
      │
      ▼
[主 Agent — 規劃、委派、整合]
      │
      ├──► [Subagent A: explore]  ──► 在隔離 session 中探索 codebase
      ├──► [Subagent B: shell]    ──► 在隔離 session 中跑診斷指令
      └──► [Subagent C: generalPurpose] ──► 撰寫獨立子任務
      │
      ▼
[主 Agent 只收到各子代理的精簡摘要]
      │
      ▼
[最終成果呈現給使用者]
```

在 Cursor 中，Subagents 透過 **Task 工具**啟動，並指定 `subagent_type`（例如 `explore`、`shell`、`generalPurpose`）。主 Agent 撰寫明確的子任務 prompt；子代理在**獨立 context** 中執行；完成後將摘要回傳父 Agent。

### 三個實際優勢

1. **Context 乾淨**：父 Agent 不必吞下 50 個檔案的 grep 結果，只收「在第 X 檔第 Y 行發現問題」。
2. **可並行**：互不依賴的子任務可同時派出（例如一個查 schema、一個查測試覆蓋率）。
3. **成本分級**：父 Agent 可用較強模型做規劃，子 Agent 用較輕量模型做大量探索（依平台支援而定）。

### 常見誤解修正

| 誤解 | 實際情況 |
|------|----------|
| Subagent = 「前端 Agent」「後端 Agent」人設分工 | [HumanLayer 實務經驗](/blog/21-humanlayer-skill-issue-harness/)：**角色扮演式子 Agent 效果差**；好用的是 **context firewall** |
| Subagent = Cursor Multi-file Edit | Multi-file Edit 是同一 Agent 批次改檔；Subagent 是**獨立 session + 隔離 context** |
| Subagent 一定比單 Agent 快 | 有委派 overhead；適合**探索量大、中間輸出冗長**的任務，不適合每個小修改 |

Claude Code 同樣支援子 Agent 模式；各平台的子 Agent 類型名稱與啟動方式略有差異，但「父規劃、子執行、摘要回傳」的架構一致。

---

## 3. Commands（斜線指令）—— 使用者明確觸發的工作流入口

### 職場比喻

與其每次口頭解釋「請依我們團隊標準做 Code Review，重點看 X、Y、Z」，不如在辦公室裡約定一句暗號：「**老規矩，review**」。聽到暗號，對方就知道要跑哪套流程。

### 底層邏輯

Commands 是**由使用者主動觸發**的 Prompt 範本。在 Cursor 輸入 `/` 時，IDE 列出可用指令；選取後，該 Markdown 檔的全文成為本輪 prompt，並帶入當前專案 context（含 `@` 引用的檔案）。

與 Skills 的關鍵差異：

| 維度 | Commands | Skills |
|------|----------|--------|
| 觸發者 | **使用者** 手動選 `/command` | **Agent** 依 description 自動判斷是否載入 |
| 檔案格式 | 純 Markdown，通常無 frontmatter | `SKILL.md` + YAML frontmatter |
| 典型用途 | 固定工作流入口（review、commit、寫 PR） | 領域知識與 SOP（deploy、安全規範） |

### 真實設定格式（以 Cursor 為例）

Commands 是 **Markdown 檔**，放在：

| 層級 | 路徑 |
|------|------|
| 專案 | `.cursor/commands/` |
| 個人 | `~/.cursor/commands/` |

**檔名（不含 `.md`）即指令名稱。** 例如 `.cursor/commands/review-code.md` 對應 `/review-code`：

```markdown
# Code Review

Review the selected code as a senior architect. Focus on:

1. Time/space complexity — can it be optimized?
2. Security — SQL injection, XSS, auth bypass risks
3. Clean Code — naming, single responsibility, error handling

Output format:
- **Summary** (one line)
- **Critical issues** (must fix)
- **Suggestions** (nice to have)
```

Commands **不是** JSON 設定檔。若你看到 `"commands": { "/review": { "prompt": "..." } }` 這類格式，那是其他工具或舊版文件的寫法，不是 Cursor 現行的 slash command 機制。

Cursor 也支援將 Commands **遷移為 Skills**（加上 `disable-model-invocation: true`，防止 Agent 自動呼叫，保留「僅使用者觸發」語意）。

Claude Code 有自己的 slash command 生態（常透過 plugin 或 `~/.claude/commands/` 類似路徑）；Codex CLI 的 `/commands` 則是另一套介面——**概念相同（可重用 prompt 入口），路徑與格式因平台而異。**

### 為什麼 Commands 對團隊有價值

- **可版本控管**：`.cursor/commands/` 進 git，新人 clone 即有相同工作流。
- **降低表達成本**：不用每次從零描述「我們的 review 標準是什麼」。
- **可組合**：Command 內可 `@` 引用專案檔案（如 `@docs/code-style.md`），確保 prompt 與 repo 同步。

---

## 4. Hooks（鉤子）—— 確定性的安全網與後處理

### 職場比喻

公司不會只靠員工自律記得「下班關冷氣」——系統在 18:00 自動關閉。AI Agent 也一樣：不能指望它「記得跑 lint」，要在**事件發生時**由系統強制介入。

### 底層邏輯

Hooks 是 **Event-Driven Architecture（事件驅動架構）** 在 Agent loop 上的實作。在特定生命週期節點，系統 spawn 一個程序（或 LLM prompt hook），透過 **JSON stdin/stdout** 與 Agent 交換資料，可以：

- **觀察（observe）**：記錄 analytics、審計 log
- **放行 / 拒絕（allow / deny）**：攔截危險 shell 指令、阻擋 subagent 啟動
- **修改（modify）**：改寫 tool 輸入、注入額外 context
- **後處理（post-process）**：檔案寫入後自動格式化

這是 Harness 裡最接近 **「確定性控制流」** 的機制——彌補 LLM 本身無法保證行為一致性的缺口。

### 常見 Hook 事件（Cursor）

Cursor 的 hooks 分三類 surface：**Agent hooks**、**Tab hooks**（inline completion）、**App lifecycle hooks**。開發者最常用的是 Agent hooks：

| 事件 | 觸發時機 | 典型用途 |
|------|----------|----------|
| `sessionStart` / `sessionEnd` | Agent 會話開始 / 結束 | 注入專案索引、清理暫存 |
| `beforeShellExecution` | 執行 shell 指令**前** | 攔截 `rm -rf`、網路請求、危險 migration |
| `afterShellExecution` | shell 指令**後** | 審計輸出、擷取 artifact |
| `preToolUse` / `postToolUse` | 任意 tool 呼叫前 / 後 | 通用攔截、改寫 tool 輸入、注入 context |
| `beforeReadFile` / `afterFileEdit` | 讀檔前 / 寫檔後 | 存取控制、自動 Prettier / ESLint |
| `subagentStart` / `subagentStop` | 子代理啟動 / 完成 | 管控 subagent 類型、鏈式 follow-up |
| `beforeSubmitPrompt` | 使用者送出 prompt 前 | 掃描 PII、secrets、政策違規 |
| `stop` | Agent 宣稱完成時 | 跑 typecheck / test；**失敗才餵 stderr 回 Agent** |

> **命名注意：** Cursor 使用 camelCase 事件名（如 `afterFileEdit`、`sessionStart`），不是 `postEdit` 或 `onSessionStart`。Claude Code 的 hook 事件名稱類似但不完全相同；Cursor 支援載入部分第三方 hook 格式。

### 真實設定格式

`hooks.json` 需包含 `"version": 1`：

```json
{
  "version": 1,
  "hooks": {
    "beforeShellExecution": [
      {
        "command": ".cursor/hooks/approve-network.sh",
        "matcher": "curl|wget|nc ",
        "failClosed": true
      }
    ],
    "afterFileEdit": [
      {
        "command": ".cursor/hooks/format.sh"
      }
    ]
  }
}
```

Hook 腳本從 stdin 讀 JSON，向 stdout 寫 JSON 回應。以 `beforeShellExecution` 為例，腳本可回傳：

```json
{
  "permission": "ask",
  "user_message": "This command may access the network. Please review.",
  "agent_message": "A hook flagged this as a possible network call."
}
```

**關鍵行為：**

- Exit code `0`：成功，採用 stdout JSON
- Exit code `2`：阻擋動作（等同 `permission: "deny"`）
- 其他非零 exit code：預設 **fail-open**（動作繼續）；設 `failClosed: true` 則改為 fail-closed

Hook 分 **command-based**（shell 腳本，確定性）與 **prompt-based**（LLM 評估，適合難以腳本化的政策）。危險操作放行這類需要可審計行為的場景，優先用 command hook。

### Stop Hook 與 Back-pressure

[HumanLayer](/blog/21-humanlayer-skill-issue-harness/) 特別強調 **Stop hook** 的價值：Agent 宣稱「做完了」時，hook 自動跑 `typecheck` + `test`：

- **成功 → 完全靜默**（不要把 4000 行 pass log 灌進 context）
- **失敗 → 冗長 stderr 餵回 Agent**，驅動下一輪修復

這叫做 **back-pressure（回壓）**：讓 Agent 能**自我驗證**，而非只靠「我覺得好了」。與單純在 AGENTS.md 寫 `CRITICAL: always run tests` 相比，hook 是**確定性**的。

---

## 四者如何串聯？一條完整工作流

這四個機制不是四選一，而是同一條 Agent loop 上的不同關卡：

```
[使用者輸入 /review-code]              ← Commands（明確觸發）
        │
        ▼
[Agent 判斷需載入 code-review Skill]   ← Skills（按需注入 review 標準）
        │
        ▼
[主 Agent 發現需掃描 40 個模組，
 派出 explore 子代理分批調查]           ← Subagents（隔離大量探索輸出）
        │
        ▼
[子代理改完檔案 → afterFileEdit hook
 自動跑 Prettier + ESLint]             ← Hooks（確定性後處理）
        │
        ▼
[Agent 宣稱完成 → stop hook 跑 test
 失敗則 stderr 回灌，驅動下一輪]       ← Hooks（back-pressure）
        │
        ▼
[Review 報告呈現給使用者]
```

四者分工：

- **Commands** — 確保「**誰、在什麼時候、要做哪件事**」由使用者明確啟動
- **Skills** — 確保 AI「**懂規矩、知道怎麼做**」
- **Subagents** — 確保 AI「**探索時不會被垃圾 context 淹沒**」
- **Hooks** — 確保 AI「**不能跳過安全檢查與品質關卡**」

---

## 與 Rules、AGENTS.md、MCP 的關係

這四者常與其他 Harness 元件混淆，用一張表釐清：

| 機制 | 載入時機 | 主要內容 | 適合放什麼 |
|------|----------|----------|------------|
| **AGENTS.md / Rules** | 每次（或條件性）注入 system prompt | 全域、簡短、普遍適用 | build/test 指令、不可做之事、目錄導覽 |
| **Skills** | Agent 按需載入 | 領域 SOP、流程、範本 | 部署流程、PR 規範、領域 API 用法 |
| **Commands** | 使用者 `/` 觸發 | 完整工作流 prompt | code review、寫 commit message、產 PR |
| **MCP** | 註冊為 tool，描述進 prompt | 外部 API / 服務 | GitHub、Linear、資料庫查詢 |
| **Hooks** | 事件觸發，非 prompt | 腳本 / 政策 | lint、secrets 掃描、危險指令攔截 |

實務原則（呼應 [HumanLayer](/blog/21-humanlayer-skill-issue-harness/) 與 [OpenAI Harness Engineering](/blog/11-harness-engineering/)）：

- AGENTS.md **保持精簡**（<60 行是常見目標）；細節下沉到 Skills
- MCP **不是萬能**：若已有成熟 CLI，在 AGENTS 寫六條範例常比巨型 MCP schema 省 token
- Agent 犯錯 → **改 AGENTS、加 Skill、或加 Hook**，不要只換模型

---

## 各平台支援速查

| 機制 | Cursor | Claude Code | Codex |
|------|--------|-------------|-------|
| Skills | `.cursor/skills/*/SKILL.md` | `~/.claude/skills/` 等 | 依版本；概念相同 |
| Subagents | Task 工具 + `subagent_type` | 內建 sub-agent | 有限支援 |
| Commands | `.cursor/commands/*.md` | plugin / commands 目錄 | CLI `/commands` |
| Hooks | `.cursor/hooks.json` | `.claude/settings` hooks | 尚無完全對等（OpenCode plugins 類似） |

Cursor 特別支援**載入 Claude Code 格式的第三方 hooks**，降低跨工具遷移成本。Cloud Agent（遠端執行）會讀取 repo 內的 `.cursor/hooks.json`，但不讀 `~/.cursor/` 個人層設定。

---

## 給開發者的行動指南

理解這四個概念後，你就不再只是被動接受 AI 產出的使用者，而是能設計、迭代 Harness 的 **AI 工作流架構師**。以下是三個可立即動手的起點：

### 1. 寫你的第一個 Skill

選一個重複性高、步驟明確的任務（部署、PR 流程、安全審查清單），建立：

```
.cursor/skills/your-skill-name/SKILL.md
```

`description` 寫清楚 **做什麼（WHAT）** 與 **何時用（WHEN）**——這是 Agent 能否正確選用的關鍵。

### 2. 封裝你最常用的 Prompt 為 Command

把每次都要重打的長 prompt 存成 `.cursor/commands/your-command.md`，進 git 讓團隊共享。檔名即指令名，輸入 `/` 即可選用。

### 3. 設一個 `afterFileEdit` 或 `stop` Hook

- `afterFileEdit`：每次 AI 改檔後自動 Prettier / ESLint，告別格式混亂。
- `stop`：Agent 宣稱完成時跑 test；**成功靜默、失敗才回報**——這是最有效的 back-pressure 起點。

---

## 小結

Skills、Subagents、Commands、Hooks 不是四個 trendy 名詞，而是 **Harness Engineering** 的四根支柱：

- 用 **Skills** 管理「知識與流程」的漸進揭露
- 用 **Subagents** 管理「context 預算」的隔離與回收
- 用 **Commands** 管理「人機介面」的可重複入口
- 用 **Hooks** 管理「確定性」的放行、攔截與驗證

AI 不只是工具，它是你的協作夥伴——而好的架構師，懂得在 Model 之外工程化這層 Harness，讓夥伴在正確的時機、用正確的知識、經過正確的關卡，交付可驗證的結果。

---

> **延伸閱讀：**
> - [HumanLayer：Coding Agent 的 Skill Issue](/blog/21-humanlayer-skill-issue-harness/) — Harness 五類旋鈕的實戰分析
> - [LangChain 解剖 Agent Harness](/blog/15-langchain-agent-harness-anatomy/) — Agent = Model + Harness 的元件地圖
> - [Cursor 官方文件：Agent Hooks](https://cursor.com/docs/agent/hooks)
> - [Anthropic 官方文件：Claude Code Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)
> - [Model Context Protocol（MCP）規範](https://modelcontextprotocol.io/)
