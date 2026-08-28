---
title: "多 Agent 怎麼協調：TAKT 的 YAML 工作流"
description: "TAKT 用 YAML 工作流 topology 排多個 coding agent。這篇講協調控制點，不是又一篇「深度剖析」。"
pubDate: 2026-07-24
updatedDate: 2026-08-28
tldr:
  - "TAKT 以外部 YAML 拓撲替代單一 Prompt 指引，強行約束 AI Agent 在 Plan-Implement-Review-Fix 迴圈中的角色權限與切換邏輯。"
  - "支援異質模型分層調度（Model Tiering）：由高階推理模型負責規劃與審查，低成本模型負責搬磚實作，達成顯著的 Token 成本最佳化。"
audience:
  - "AI 系統架構師與 Platform Engineer"
  - "專注於 Agentic Coding 與 SDLC 自動化的開發團隊"
category: "AI Engineering"
tags: ["AI Agent", "Agentic Coding", "Developer Tools", "Harness Engineering"]
kind: "article"
showToc: true
image: "/blog/70-takt-agent-coordination-topology/title_image.webp"
---
在當前的 AI Agent 開發浪潮中，開發者常面臨一個既真實又痛苦的現象：**「Agent 陪跑負擔（AI Babysitting）」**。隨著 Prompt 長度與對話輪次增加，模型容易遺忘先前設定的規範、產生上下文污染（Context Pollution），甚至在未經嚴格驗證的情況下直接將代碼寫入主分支。即使在 `CLAUDE.md` 或系統提示中加入無數條約束，模型的遵從度依然取決於模型自身的隨機性。

近期開源的工具 **TAKT（TAKT Agent Koordination Topology）** 提供了一個全新的解題思路：**將過程控制權從 Prompt 抽離，完全交由外部的 YAML 工作流拓撲接管**。TAKT 名稱取自德文「Takt」（意指指揮家的拍節），其核心目標是透過聲明式架構統籌多個 AI Agent 的角色分工、評測迴圈（Review Loops）與人類干預點。

> **花花的判斷**
>
> 靠 prompt 約束 Agent 的自我規律是有極限的。將工作流（Workflow）、角色（Persona）與審查規則（Review Loops）宣告在程式碼倉庫的外部拓撲中，才是讓 Agentic Coding 走向可重現（Reproducible）與可稽核（Auditable）工程化的必然方向。

## 為什麼傳統單一 Agent 模式在複雜開發中會失效？

在常規的 AI 輔助開發流程中，開發者習慣將所有需求、編碼規範與評測指令打包進單一 Prompt，期待模型能一口氣完成「分析 -> 設計 -> 寫 code -> 自自我審查 -> 修正」。然而，這種模式在正式團隊與長流程任務中存在三大瓶頸：

1. **Context 膨脹與記憶衰減**：當一個 Agent 同時承載架構設計、寫代碼與 Unit Test 時，歷史對話累積過多無關細節，導致後期的程式碼質量顯著下降。
2. **審查職責模糊（Self-Review Softness）**：要求同一個模型既當實作者又當審查者，模型傾向於「寬容」自己的變更，容易跳過邊界條件的檢驗。
3. **高昂的 Token 盲目消耗**：若全程使用頂級高價模型（如 Claude 3.7 Sonnet 或 OpenAI o3-mini），讓昂貴模型花費數十輪對話去撰寫基礎的樣板代碼（Boilerplate Code），經濟效益極低。

TAKT 的核心主張是：**AI Agent 不應被盲目信任，而必須接受外部系統的結構化調度。**

## TAKT 的核心架構：以 YAML 定義 Agent 協調拓撲

TAKT 透過 `.takt/` 目錄下的 YAML 檔案來聲明完整開發流程。一個 Workflow 由多個獨立的 `step` 組成，每個 Step 只獲取該步驟所需的最小上下文。

### Step 的五大核心要素

在 TAKT 中，每一個步驟都被明確賦予以下屬性：

* **Persona（角色身份）**：定義該步驟的 AI 視角與專業，例如「資深系統架構師」、「嚴格的 Security Reviewer」或「Frontend 實作員」。
* **Policy（權限與政策）**：限定該步驟可調用的工具、檔案存取邊界與變更權限。
* **Knowledge（領域知識）**：僅注入該步驟所需的上下文文檔，避免無關細節干擾模型決策。
* **Instruction（任務指令）**：具體的 Task 要求與驗證標準。
* **Output Contract（輸出合約）**：規範輸出的格式（例如 JSON 報告、結構化評測結果），作為觸發下一步驟轉移（Transition）的判斷依據。

```yaml
# 簡化的 TAKT 步驟定義概念
initial_step: plan
max_steps: 10
steps:
  plan:
    provider: claude
    model: claude-3-7-sonnet
    persona: "Architect"
    instruction: "分析需求並產出設計規格"
    transitions:
      - to: implement
  implement:
    provider: opencode
    model: deepseek-coder
    persona: "Developer"
    instruction: "根據規格實作功能代碼"
    transitions:
      - to: review
  review:
    provider: claude
    model: claude-3-7-sonnet
    persona: "Code Reviewer"
    instruction: "審查實作代碼與測試涵蓋率"
    transitions:
      - if: "has_issues"
        to: fix
      - if: "approved"
        to: complete
  fix:
    provider: opencode
    model: deepseek-coder
    persona: "Developer"
    instruction: "修正 Reviewer 指出的問題"
    transitions:
      - to: review
```

透過這種設計，`review` 步驟只會看到實作結果與測試報告，而不會被實作過程中產生的龐大思維鏈（CoT）噪訊影響判斷。

## 深層技術解析：異質模型分層調度與成本最佳化（Model Tiering）

開發者常提出一個非常核心的疑問：**「使用 TAKT 是否意味著能讓昂貴模型做規劃、便宜模型去搬磚，從而大幅降低 Agent 的訂閱與 API 成本？」**

答案是：**完全正確，這正是 TAKT 在工程落地時最關鍵的經濟效益所在！**

### 1. 「高階指揮、便宜搬磚」的兩階段架構

在無調度的單一 Agent 模式下，開發者使用 Claude Code 或 Cursor 等高階工具時，無論是設計 API 規格還是寫 500 行簡單的 CRUD 程式碼，都是以相同的昂貴模型 Token 計費。若跑 20 輪對話，累積的 Input/Output Token 成本極為可觀。

TAKT 透過步驟級別的 Provider 與 Model 指定，實現了**分層模型策略（Model Tiering）**：

* **規劃與設計階段（Plan Phase）**：調用高推理能力的高價模型（例如 Claude 3.7 Sonnet, OpenAI o3-mini）。昂貴模型在此階段僅消耗少量 Token 產出精確的架構規格（Architecture Spec）與介面合約。
* **代碼實作階段（Implement Phase）**：將產出的 Spec 餵給低成本、高吞吐的模型（例如 DeepSeek V3/R1, Claude Haiku 或開放權重模型）。便宜模型負責「搬磚」寫出大量程式碼與測試案例。
* **評測與開閘階段（Review Phase）**：重新召回高階評測模型檢查程式碼品質與安全性。若發現瑕疵，將評測報告 JSON 丟回給便宜模型執行修正（Fix）。

### 2. Context Scoping：讓便宜模型 Prompt 保持極簡

便宜模型在進行複雜任務時容易出錯，很大程度上是因為 Prompt 太長包含太多雜訊。TAKT 透過 **Step-level Context Isolation** 解決了這個問題：

- 搬磚模型在 `implement` 步驟時，**不需要讀取整個專案歷史或昂貴模型的思考過程（CoT）**。
- 它只接受上一步 `plan` 所輸出的結構化 **Output Contract**（規格與 Task 目標）。
- 輸入上下文極短（Short Context Window），使得便宜模型不僅出錯率大幅降低，Token 消耗量更降低了 60% 至 80%。

## 執行引擎：Git Worktree 隔離與多模型 Provider

除了 YAML 拓撲外，TAKT 在執行層面也做了防護設計：

### 1. 預設 Git Worktree 沙盒隔離

當開發者執行 `takt run` 時，TAKT 不會直接在當前工作分支修改代碼，而是在背景建立獨立的 **Git Worktree**。所有的 Agent 修改、測試與 Fix 迴圈都在沙盒中完成。

任務完成後，開發者可透過 `takt list` 檢視所有分支變更、查看自動產生的 PR 報告，並決定是否 Merge、Requeue 或刪除該分支，完全不影響當前的開發步調。

### 2. 靈活的模型 Provider 架構

TAKT 支援多種底層引擎，並區分為 SDK 模式與 CLI 模式：

| Provider 類型 | 支援引擎 / 工具 | 特性與適用場景 |
| :--- | :--- | :--- |
| **SDK 模式**（純 Node.js） | `claude-sdk`, `codex`, `opencode` | 僅需 API Key，環境輕量，適合 CI/CD 與無頭自動化 |
| **CLI 模式**（需外部工具） | `claude` (Claude Code), `cursor`, `copilot`, `kiro` | 整合既有 CLI 工具生態與本地授權環境 |

## TAKT 的技術局限性與落地挑戰（Limitations & Trade-offs）

儘管 TAKT 的聲明式拓撲設計帶來了極高的控制力與成本優勢，GitHub 官方文件與專案規範中也明確揭露了目前版本的技術局限與運營權衡：

### 1. 強依賴 Git 倉庫狀態與初始化 Commit
TAKT 的沙盒隔離機制完全建立在 **Git Worktree** 之上。這意味著：
* TAKT 必須運行在已初始化的 Git 倉庫內，且**必須至少包含一個初始 Commit**。
* 無法直接在非 Git 資料夾或全新的空白空目錄中運行 `takt run`。

### 2. CLI 模式下的外部環境與依賴門檻
雖然 SDK 模式（如 `claude-sdk`, `opencode`）僅需 Node.js 與 API Key，但若選擇 CLI Provider 模式（如 `claude`, `cursor`, `copilot`）：
* 本地環境必須預先安裝且通過認證該 CLI 工具。
* 例如使用 `claude-terminal` 模式時，本地系統甚至必須額外安裝 `tmux`。
* 整合 GitHub (`gh`) 或 GitLab (`glab`) 觸發 Issue/MR 任務時，也需仰賴本地 CLI 工具鏈的整合。

### 3. 沙盒隔離與網路存取（Network Access）的衝突
預設情況下，TAKT 的步驟沙盒（例如 macOS Seatbelt 或 Linux bubblewrap）會對 Agent 施加嚴格的檔案與網路限制：
* 預設會封鎖外部網路連線，防止 Agent 擅自向外部發送敏感數據。
* **副作用**：若搬磚模型在實作或測試過程中需要執行 `npm install`、`pip install` 或下載外部套件，會直接遭沙盒阻擋而失敗，必須手動開啟網路存取或放寬至 `full` 模式，這同時也削弱了安全邊界。

### 4. 檔案大小與 Package 規模限制
為了防止 Agent 在掃描專案時 Prompt 瞬間暴增或系統死鎖，TAKT 對輸入資產設有硬性邊界：
* 圖片檔案上限為 **10 MiB**。
* 單一檔案文字大於 **1 MB** 會自動跳過不進行讀取。
* 包含超過 **500 個檔案** 的大型 Package 或路徑拒絕直接載入。

### 5. Review-Fix 死迴圈與 Token 振盪風險
若 YAML 拓撲中的 `review` 條件（Output Contract）定義過於模糊，或是搬磚模型的編碼能力與 Reviewer 要求的標準相差過大：
* 流程可能在 `implement -> review -> fix -> review` 之間產生振盪（Oscillating Fix Loop）。
* **工程應對措施**：必須強制設定 `max_steps` 上限，並在連續修復失敗時觸發 Human Checkpoint，交由工程師接管，否則自動化仍有浪費 Token 的風險。

## Plain AI Agent vs. TAKT 架構對比

| 比較維度 | 傳統單一 AI Agent | TAKT Agent Coordination Topology |
| :--- | :--- | :--- |
| **流程控制** | 依賴 Prompt 提示詞引導，Agent 自行決定下一步 | 外部 YAML Workflow 強制約束 Step 轉移條件 |
| **審查機制** | 容易被 Agent 自行跳過或敷衍審查 | 顯式（Explicit）Plan-Implement-Review-Fix 迴圈 |
| **Context 管理** | 對話輪次增加導致 Context 膨脹與記憶喪失 | 每個 Step 擁有獨立 Persona、Knowledge 與最小上下文 |
| **模型成本最佳化** | 全程使用同一高價模型，Token 費用居高不下 | 高價模型規劃/審查 + 低成本模型搬磚 (Model Tiering) |
| **變更安全性** | 直接寫入當前 Working Tree，易污染本地環境 | 預設以獨立 Git Worktree 執行，提供完整 Audit Log |
| **系統限制與邊界** | 無硬性沙盒邊界，易直接改壞全域環境 | 強依賴 Git Commit、預設封鎖網路存取、設有檔案規模上限 |
| **可重用性** | 依賴個人 Prompt 記憶與習慣 | 流程可版本控管（Versionable）並在團隊間分享 |

> **花花的工程提醒**
>
> 在引進 TAKT 建立自動化迴圈時，務必設定合理的 `max_steps` 上限，並在關鍵狀態變化處插入 Human Checkpoint。自動化的 Review-Fix 迴圈若缺乏收斂條件，可能會引發模型間的無限爭執與 Token 浪費。

## 總結與工程啟示

TAKT 的出現代表了 AI 輔助開發（Agentic Coding）正在從「個人 Prompt 技巧」走向「聲明式架構工程（Declarative Infrastructure for Agents）」。它告訴我們：**好的 AI 開發流程，重點不在於找到一個完美無瑕的提示詞，而是在於設計一套健全的協調拓撲與約束機制。**

對於正在規劃 Enterprise 級別 AI 輔助開發體系的團隊來說，TAKT 的設計理念提供了極具價值的借鑑：
1. **將審查（Review）與實作（Implementation）解耦**。
2. **實施 Model Tiering 策略，讓昂貴模型規劃、便宜模型實作**。
3. **評估沙盒與網路套件下載（npm/pip）的權衡**。
4. **將工作流範本化並納入版本控制**。
5. **利用 Git Worktree 保障環境隔離與可追溯性**。

### 相關閱讀與參考來源

- [Bloss0m AI Agent 架構指南](/blog/64-ai-agent-guide/)
- [Harness Engineering 深度解析](/blog/11-harness-engineering/)
- [Agent 時代的技能、子 Agent 與 Hook 設計](/blog/29-agent-era-skills-subagents-commands-hooks/)
- [TAKT GitHub 官方倉庫（nrslib/takt）](https://github.com/nrslib/takt)
