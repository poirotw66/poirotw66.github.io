---
title: "走入 Agent 時代：拆解 Cursor / Claude Code / Codex 的四大核心基石"
description: "深度解析現代 AI 編輯器的四大核心機制——Skills、Subagents、Commands 與 Hooks。從職場比喻到底層邏輯，再到真實設定檔（Code Snippets），帶你全方位理解如何從「提示詞工程」進化成「AI 工作流架構師」。"
pubDate: 2026-06-24
category: "Technology"
tags: ["AI Agent", "Cursor", "Claude Code", "Codex", "Skills", "Subagents", "Commands", "Hooks", "工作流", "MCP"]
subtitle: "Skills、Subagents、Commands、Hooks——四個概念如何把「只會打字的 AI」變成「能獨當一面的高階工程師」"
kind: guide
showToc: true
---

## 前言：從「提示詞工程」到「Agent 生態系」

進入 2026 年，如果你對 AI 輔助開發的印象還停留在「在對話框裡輸入 Prompt，然後複製貼上程式碼」，那你就太低估現代工具的演進了。

從大家熟知的 **Cursor（Composer 模式）**，到終端機原生神兵 **Claude Code** 與各類 **Codex / MCP（Model Context Protocol）** 生態系，現代 AI 編輯器已經從單純的「語意續寫工具」，正式演變成**「具備自主執行能力的 Agent（智慧代理）生態系」**。

在研究這些先進工具的專案設定檔（例如 `.cursor/`、`.claude/` 或 `config.json`）時，你一定會頻繁遇到四個核心名詞：**Skills**、**Subagents**、**Commands** 和 **Hooks**。

這四個概念到底是什麼？它們如何各司其職，把一個「只會打字的 AI」變成「能獨當一面的高階工程師」？本文將從**職場比喻**、**底層邏輯**到**真實程式碼結構**，帶你全方位速通這四大 AI 核心觀念。

---

## 核心總覽：如果 AI 是一個「剛入職的實習生」

在深入細節前，我們可以把 AI 工具想像成一個剛進公司的實習生。為了讓他能順利工作、不闖禍、還能高效產出，我們會準備 SOP、配置外包團隊、給他快捷鍵，並裝上安全監控。

| 核心概念 | 職場比喻 | 技術本質 | 一句話看懂 |
| :--- | :--- | :--- | :--- |
| **Skills（技能）** | 標準作業程序（SOP） | 動態上下文注入（Dynamic Context） | 告訴 AI「特定工作該**怎麼做**」的知識指南 |
| **Subagents（子代理）** | 外包專案小組 | 任務並行與上下文隔離（Isolation） | 讓 AI 主管分支出去、**獨立運作**的專案分身 |
| **Commands（斜線指令）** | 快捷鍵 / 召喚術 | 提示詞宏（Prompt Macros） | 使用者用 `/` 直接觸發 AI 的**特定功能或操作** |
| **Hooks（鉤子）** | 辦公室自動化規則 | 事件驅動攔截器（Event Interceptors） | 綁定特定事件（如寫完程式碼），**時間到就自動觸發** |

接下來，我們逐一拆解這四大金剛。

---

## 深入四大概念：從比喻到真實架構

### 1. Skills（技能）—— AI 的隨身工作手冊

**職場比喻：** 它是公司的 **SOP 知識庫**。新來的實習生不可能知道你們公司的架構規範或特殊的部署指令。有了這本手冊，他遇到特定任務時翻開照做就行。

**底層邏輯：** 傳統的 System Prompt 是把所有規則一口氣塞給 AI，導致 Token 浪費且 AI 容易混淆（Needle in a Haystack 問題）。`Skills` 則是 **"On-Demand Context Injection"（按需注入）**。它通常以 Markdown 或 JSON 格式存在，當編輯器偵測到使用者提出了特定領域的要求，或是專案內包含了特定標籤，系統才會把這個「技能包」動態加入到當前的 Context 中。

#### 真實設定檔長怎樣？（以 `.cursor/skills/` 為例）

你可以在專案中建立一個 `deploy-standard.md`：

```yaml
---
name: "production-deploy"
description: "當使用者要求將專案部署、上線或打包時觸發"
triggers: ["deploy", "build:prod", "上線"]
dependencies: ["npm", "aws-cli"]
---

# 專案生產環境部署標準 SOP

當執行部署任務時，AI 必須嚴格遵守以下步驟：
1. 必須先執行 `npm run lint` 與 `npm run test`，若有任何錯誤立即停止。
2. 檢查 `.env.production` 檔案是否存在。
3. 只能使用 `npm run build` 進行打包。
4. 部署完成後，自動執行 `/smoke-test` 檢查站點狀態。
```

這個設計的精妙之處在於：只有在「部署」情境被觸發時，這份 SOP 才會進入 AI 的上下文，避免不必要的 Token 消耗，同時讓 AI 在該情境下擁有完整的作業指引。

---

### 2. Subagents（子代理）—— 把任務發包出去的分身

**職場比喻：** 它是**專案經理（PM）分發出去的外包團隊**。當主線任務太龐大（例如：重構整個專案的 API），主 AI 一個人（單一執行緒）會做不來，它就會生出好幾個「工具人分身」，做完再回報。

**底層邏輯：** AI 的大腦（Context Window）是有限的，當對話太長，AI 就會開始「健忘」並產生幻覺。`Subagents` 機制實現了 **"Context Isolation"（上下文隔離）**。主 Agent 負責解析大任務並進行調度，它會衍生出獨立的子執行緒（Sub-agents），每個子代理只帶走「跟它任務相關的程式碼片段」，各自向 LLM 發起請求。

#### Subagents 的分工示意

```
[使用者請求] ──> [主 Agent（PM）]
                    │
                    ├──> [Subagent A] ──> 負責讀取 DB Schema
                    ├──> [Subagent B] ──> 負責編寫 API Route
                    └──> [Subagent C] ──> 負責撰寫 Unit Test
                    │
[最終成果呈現] <── [結果彙總]
```

這個架構有三個核心優勢：

1. **並行效率**：三個子代理同時工作，速度是序列執行的數倍。
2. **上下文乾淨**：每個子代理只看到與自己任務相關的程式碼，不受其他資訊干擾。
3. **錯誤隔離**：某個子代理失敗，不影響其他子代理的進度。

**真實應用場景：** 當你在 Cursor 中使用 Multi-file Edit（多檔案編輯）或在 Claude Code 中執行複雜重構時，你會看到終端機畫面上出現複數個進度條，那正是 `Subagents` 在幕後並行運作的痕跡。

---

### 3. Commands（斜線指令）—— 精準控制 AI 的傳送門

**職場比喻：** 它是辦公室裡的**專用黑話或快捷鍵**。你不需要跟主管解釋「請幫我把這份文件影印三份、裝訂好、送到總經理辦公室」，你只需要說「老規矩，送總經理」，這就是指令。

**底層邏輯：** 它是**封裝好的提示詞宏（Prompt Macros）與工具映射（Tool Mapping）**。它繞過了模糊的自然語言理解，直接給予 AI 確定的「行為意圖（Intent）」與「輸入範圍（Scope）」。

#### 真實設定檔長怎樣？（以自訂擴充指令為例）

在自訂 AI 設定中，你可以將常用的長 Prompt 封裝成一個 Command：

```json
{
  "commands": {
    "/review": {
      "description": "嚴格審查當前選取程式碼的效能與資安漏洞",
      "prompt": "請扮演資深架構師，針對以下程式碼進行 Code Review。請特別關注：1. 時間複雜度是否能優化？ 2. 是否存在 SQL Injection 或 XSS 漏洞？ 3. 是否符合 Clean Code 規範？"
    },
    "/explain": {
      "description": "用最簡單、連實習生都聽得懂的話解釋這段代碼",
      "prompt": "請用白話文、並使用一行摘要與列點方式，解釋這段程式碼的商業邏輯與核心運作機制。"
    }
  }
}
```

Commands 的價值在於**可重複性**與**團隊對齊**。當整個工程團隊都使用同一套 `/review` 指令，你們就對「什麼叫做好的 Code Review」達成了共識，並把這份共識固化在工具層面，而非依賴每個人的個人習慣。

---

### 4. Hooks（鉤子）—— 默默守護的自動化安全網

**職場比喻：** 它是公司的**自動化行政規則與保全系統**。例如「每天下班前冷氣自動關閉」或是「出入大門必須刷卡，否則警報會響」。它不依賴 AI 自律，而是系統強制執行的安全網。

**底層邏輯：** 這是標準的**事件驅動架構（Event-Driven Architecture）**。工具在特定的生命週期節點（Lifecycle Hooks）留下了監聽接口。不論 AI 做了什麼，只要觸發了該事件，綁定的腳本就必須執行。

#### 常見的 Lifecycle Hooks 節點

**`onSessionStart`（會話開始時）**

預先加載特定的環境變數或專案結構索引，讓 AI 從一開始就擁有完整的作業環境。

**`preToolUse` / `preCommand`（執行工具 / 命令前）**

這是**最重要的安全閥門**。當 AI 試圖執行終端機指令（如 `rm -rf` 或 `npm install`）時，Hook 會攔截並強制要求使用者確認（Human-in-the-loop），確保人類始終掌握最終決策權。

**`postEdit`（檔案修改後）**

當 AI 寫完程式碼，自動觸發 Hook 去執行 `Prettier`（格式化）或 `ESLint`（語法檢查），確保程式碼品質——無論 AI 多有自信，都必須通過這道關卡。

#### 一個 Hooks 設定範例（以 Claude Code 為例）

```json
{
  "hooks": {
    "preToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo '即將執行 Shell 指令，請確認是否授權。'"
          }
        ]
      }
    ],
    "postEdit": [
      {
        "matcher": "**/*.{ts,tsx,js,jsx}",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $FILE && npx eslint --fix $FILE"
          }
        ]
      }
    ]
  }
}
```

---

## 總結：四大機制如何串聯成「完美的 AI 工作流」？

未來的 AI 輔助開發，絕對不是單純的「一問一答」，而是一個精密的自動化工廠。當你在現代 AI 編輯器中敲下鍵盤，背後的協同運作流程其實是這樣的：

```
[你輸入 /review 指令]                   ← Commands
        │
        ▼
[主 AI 翻開專案的 Code Style Guide 手冊] ← Skills
        │
        ▼
[主 AI 發現要審查 50 個檔案，
 決定發包給 3 個分身同時掃描]            ← Subagents
        │
        ▼
[分身改完程式碼，在寫入磁碟的前一秒，
 自動觸發資安掃描與格式化]               ← Hooks
```

這四個機制並非獨立存在，而是相互協作、形成閉環：

- **Skills** 確保 AI「懂規矩」
- **Subagents** 確保 AI「做得快」
- **Commands** 確保 AI「聽得懂」
- **Hooks** 確保 AI「不闖禍」

---

## 給開發者的行動指南

理解了這四個通識觀念後，你就不再只是被動接受 AI 產出的「碼農」，而是升級成能夠設計、優化自動化開發流程的 **「AI 工作流架構師（AI Workflow Architect）」**。

以下是三個立即可以動手的方向：

1. **寫你的第一個 Skill**：把你們團隊的 Code Review 標準或部署 SOP，寫成一份觸發式的 Markdown 技能包。
2. **封裝你最常用的 Prompt**：把你每次都要重新打的長 Prompt，封裝成一個 `/` 斜線指令。
3. **設置一個 `postEdit` Hook**：讓 AI 每次修改程式碼後，自動執行格式化，從此告別「AI 寫的 Code 格式一團糟」的噩夢。

AI 不只是工具，它是你的協作夥伴——而一個好的架構師，懂得怎麼讓夥伴發揮最大效能。

---

> **延伸閱讀：**
> - [Anthropic 官方文件：Claude Code Hooks 設定指南](https://docs.anthropic.com/en/docs/claude-code/hooks)
> - [Cursor 官方文件：Rules for AI](https://docs.cursor.com/context/rules-for-ai)
> - [Model Context Protocol（MCP）規範](https://modelcontextprotocol.io/)
