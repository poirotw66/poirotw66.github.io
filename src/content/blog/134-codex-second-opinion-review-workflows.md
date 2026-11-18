---
title: "Codex 的第二意見：從 `/review`、Subagents 到 Auto-review"
description: "在原版 Codex 安裝 `$advisor` skill，或下載自訂 CLI 使用原生 `/advisor`。文章也說明如何用 `/review` 審查程式差異，以及 reviewer 和 Auto-review 各自的權限。"
pubDate: 2026-10-04
updatedDate: 2026-11-18
tldr:
  - "原版 Codex 可以安裝 `$advisor` skill 按需諮詢。自訂的 Apple Silicon CLI 提供原生 `/advisor`，讓主 Agent 自行選擇諮詢時機。"
  - "Codex `/review` 可針對本地差異產生唯讀審查，並以 `review_model` 指定不同於目前工作階段的模型。"
  - "想在計畫、重複失敗或交付前取得第二意見，可指定自訂 reviewer subagent 的模型。需要強制唯讀時，請設定主對話的 sandbox。"
  - "Auto-review 審的是需要越過 sandbox 邊界的具體操作，不是程式設計判斷；Agents SDK 則能自行組裝真正的 manager–advisor 流程。"
audience:
  - "使用 Codex app、CLI 或 IDE extension 的工程師"
  - "設計多模型 Agent、程式碼審查與高風險操作護欄的技術負責人"
category: "AI Engineering"
tags: ["AI Agent", "Codex", "Harness Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 46
kind: "article"
showToc: true
image: "/blog/134-codex-second-opinion-review-workflows/title_image.webp"
---

上一篇拆解 [Claude Code Advisor](/blog/133-claude-code-advisor-decision-points/)：讓主要模型在任務中途請另一個模型看一眼。那麼 GPT／Codex 有沒有相同做法？截至 2026 年 11 月 18 日，OpenAI 發行的 Codex 內建指令沒有 `/advisor`。要請第二個模型看計畫，可以在原版裝 `$advisor` skill，也可以下載我以 Codex CLI 0.169.0 為基底製作的自訂版，使用原生 `/advisor`。`/review` 用來審查程式差異，Auto-review 則評估需要審批的操作。若要把顧問模型嵌進自己的 Agent 流程，Agents SDK 也提供讓 manager 呼叫 specialist 的方式。[Codex 官方指令表](https://learn.chatgpt.com/docs/developer-commands)

這個差異很重要。**「第二個模型給建議」、「另一個 Agent 審查 diff」和「審核一次權限請求」不是同一種工作**。選錯機制，可能以為程式已獲第二模型把關，實際上只是在確認某個 shell 命令是否能越過 sandbox。

> **花花的判斷**
>
> Codex 的第二意見不是單一按鈕，而是一套依審查對象分層的工具；先說清楚「要檢查什麼」，再選 reviewer。

## 安裝與使用 Advisor

### 在原版 Codex 加裝 `$advisor` skill

如果你只想在重要決策前問一次第二意見，直接在 Codex 對話輸入這段安裝指示。這個方式沿用現有的 Codex 安裝。[Advisor skill 原始碼](https://github.com/poirotw66/codex-advisor/blob/advisor-v0.1.0/skills/advisor/SKILL.md)

```text
$skill-installer Install the advisor skill from https://github.com/poirotw66/codex-advisor/tree/advisor-v0.1.0/skills/advisor
```

我實際在 Codex 呼叫過 `$advisor`，skill 可以正常使用。另外也驗證了首次安裝流程。我們用上面的公開 GitHub 連結，在未使用 GitHub 憑證的情況下安裝到空白測試目錄，再確認原版 Codex 把新安裝的 skill 列為已啟用。

安裝後開新對話，用 `$advisor` 加上你想讓另一個模型檢查的決策。

```text
$advisor 請另一個模型找出這份方案最可能出錯的假設，提出一個驗證方法。等建議回來再實作。
```

在原版 Codex 裡，skill 會請主 Agent 整理一份精簡的決策摘要，再交給新的 subagent。跨模型諮詢需要用戶端支援為 subagent 選模型，且帳戶有另一個可用的模型。Skill 會指示 subagent 避免呼叫工具或改檔。實際的 sandbox 與審批權限仍由主對話繼承，需由 sandbox 限制寫入時，請先把主對話切到唯讀。[官方 Subagents 權限說明](https://learn.chatgpt.com/docs/agent-configuration/subagents#approvals-and-sandbox-controls)

#### 指定這次諮詢的模型

在原版 Codex，把模型 ID 寫在同一則 `$advisor` 訊息裡。以下以主模型為 GPT-6 Luna、顧問為 GPT-6.2 Sol 為例。[官方 Subagents 模型設定](https://learn.chatgpt.com/docs/agent-configuration/subagents#choosing-models-and-reasoning)

```text
$advisor 請用 gpt-6.2-sol 審查這份計畫，指出最可能出錯的假設，並提出一個驗證方法。若此模型不可用，請直接告訴我。
```

可選模型取決於你的用戶端、帳戶與供應商。要取得跨模型第二意見，請選與主模型不同且可用的 ID。沒指定時，skill 會優先考慮 GPT-6.2 Sol，前提是它可用且與主模型不同。自訂 CLI 啟用原生工具時，skill 會優先使用該工具，顧問模型由 `/advisor <model-id>` 設定。

### 安裝自訂 CLI 的原生 `/advisor`

如果你希望主 Agent 在遇到高影響決策、重複失敗或準備交付時自行判斷是否諮詢，可以使用自訂版。v0.1.0 基於 OpenAI Codex CLI 0.169.0。下方指令會下載 macOS Apple Silicon（arm64）安裝檔，核對 SHA-256，再安裝獨立的 `codex-advisor` 啟動器。我在 macOS 27.0.1 上驗證了解壓與啟動。執行檔尚未經 Apple 公證。[GitHub Release v0.1.0](https://github.com/poirotw66/codex-advisor/releases/tag/advisor-v0.1.0)

```sh
(
  set -eu
  release_url=https://github.com/poirotw66/codex-advisor/releases/download/advisor-v0.1.0
  archive=codex-advisor-aarch64-apple-darwin.tar.gz
  download_dir=$(mktemp -d)
  cd "$download_dir"
  trap 'rm -f "$archive" "$archive.sha256"; rmdir "$download_dir"' EXIT
  curl -fLO "$release_url/$archive"
  curl -fLO "$release_url/$archive.sha256"
  shasum -a 256 -c "$archive.sha256"
  mkdir -p "$HOME/.local"
  tar -xzf "$archive" -C "$HOME/.local"
)

"$HOME/.local/bin/codex-advisor"
```

進入自訂 CLI 後，選擇主模型和另一個可用的顧問模型。GPT-6 Luna 和 GPT-6.2 Sol 是一組設定範例，能否使用取決於目前供應商與帳戶。

```text
/model gpt-6-luna
/advisor gpt-6.2-sol
```

`/advisor` 可查看設定，`/advisor off` 可關閉。啟用後，主 Agent 可以自行決定何時呼叫顧問，你也可以在任務中明確要求它先徵詢。顧問請求只包含主 Agent 整理的決策摘要，顧問沒有工具可呼叫。主 Agent 收到建議後仍負責取捨、實作和驗證。[自訂 CLI 指令說明](https://github.com/poirotw66/codex-advisor/blob/advisor-v0.1.0/docs/slash_commands.md#advisor)

## 先校正答案：Codex 確實能用不同模型做 `/review`

查核目前的 [Codex 官方 Code Review 文件](https://learn.chatgpt.com/docs/code-review)後，可以確認：Codex 的 `/review` 會啟動專用 reviewer，針對 Git checkout 中的未提交變更、指定 commit 或與 base branch 的差異，回報依優先度整理的發現，而且不會改動工作樹。文件也說明，可以在 `config.toml` 設定 `review_model`，讓這次審查使用不同於目前工作階段的模型。

這比「把同一段問題再問一次」更接近一個正式 review 入口，但它的觸發點仍是**明確開始審查**，範圍是選定的程式差異。它不等於主要 Agent 在任何任務中途自動覺得困難，就自行呼叫顧問；那種任務階段的第二意見，可以用自訂 subagent 或自行編排的 SDK 流程補上。

| 機制 | 審查對象與觸發點 | 最適合回答 | 不代表什麼 |
| --- | --- | --- | --- |
| Codex `/review` + `review_model` | 人啟動對本地 diff、commit 或 branch 的審查 | 這個改動有沒有明顯的 correctness、security 或測試風險？ | 不會自動在每個中途決策點啟動，也不是合併批准 |
| 自訂 reviewer subagent | 主 Agent 委派計畫、失敗原因或變更內容 | 有沒有被原執行者忽略的替代方案、假設或風險？ | 建議不是測試結果；subagent 不應替代 CI |
| Auto-review | 操作需要跨出既有 sandbox／approval 邊界時 | 這個特定動作依政策是否應被放行？ | 不是架構或程式品質審查，也不會擴大權限 |
| Agents SDK 的 advisor tool | 由應用程式定義呼叫時機 | 如何把第二意見納入自己的 Agent 產品流程？ | 不是 API 自動附帶的 Codex Auto-review |

把流程畫成一條線會更清楚：Codex 的主 Agent 繼續負責工作，reviewer 回傳發現；Auto-review 則只在權限升級時檢查那個具體操作，最後仍要靠測試或人工 gate 驗證結果。

```mermaid
flowchart LR
  T[Task and acceptance criteria] --> E[Codex executor]
  E -->|Plan or difficult checkpoint| S[Reviewer subagent]
  S -->|Findings, not verdict| E
  E -->|Verified change| V[Tests, CI, or human gate]
```

## 用自訂 reviewer subagent，在重要節點請第二個模型看計畫

如果你要在動手前、同一個錯誤反覆出現時，或準備交付前取得另一個角度，Codex subagent 更適合。官方說明支援在 Codex 中使用平行 subagent，也可以把自訂 agent 放在個人 `~/.codex/agents/` 或專案 `.codex/agents/`。每個 agent 可以指定自己的模型、推理程度和任務指示。若未指定模型與推理程度，也沒有在委派時指定或設定 `[agents]` 預設值，subagent 會沿用主 Agent 的模型與推理程度。[官方 Subagents 指南](https://learn.chatgpt.com/docs/agent-configuration/subagents)

可以在 `.codex/agents/reviewer.toml` 定義一個專門審查計畫與變更的 reviewer。

```toml
name = "reviewer"
description = "Second opinion on plans and code changes."
model = "gpt-6.2-sol"
model_reasoning_effort = "medium"
developer_instructions = """
Review the supplied goal, plan, evidence, or diff independently.
Prioritize correctness, security, behavior regressions, and missing tests.
Return concrete findings with evidence and a recommended verification step.
Do not edit files or claim that an unrun test passed.
"""
```

範例採用官方 reviewer 範例的 GPT-6.2 Sol 與 `medium` 推理程度。若主 Agent 也使用 GPT-6.2 Sol，reviewer 仍會在獨立的 subagent 對話中審查。若要比較不同模型的判斷，請在目前帳戶和用戶端可用的模型中，為主 Agent 和 reviewer 選不同的模型 ID。[官方 reviewer 範例](https://learn.chatgpt.com/docs/agent-configuration/subagents#example-1-pr-review)

**唯讀權限由主對話設定。** Subagent 繼承主對話當下的 sandbox 與審批設定。在 `reviewer.toml` 加上 `sandbox_mode = "read-only"` 不會覆寫這些設定。`Do not edit files.` 是給模型的行為指示。若需要由 sandbox 限制檔案寫入，請先在桌面版選擇唯讀權限模式，或在 CLI 用 `/permissions` 選 **Read Only**，再委派。這也會限制主 Agent，所以審查與實作可以分成兩輪，審查完成後再切回可寫模式。[Subagent 權限與 sandbox](https://learn.chatgpt.com/docs/agent-configuration/subagents#approvals-and-sandbox-controls) · [CLI 權限選項](https://learn.chatgpt.com/docs/developer-commands#update-permissions-with-permissions)

實作前可以在主對話貼上這段指示。

```text
先整理目標、驗收條件和方案。委派 reviewer 檢查計畫，請它指出最可能出錯的假設、權限風險和一個替代方案。等 reviewer 回覆後，說明你採納哪些建議及依據，然後停在計畫階段。
```

可以在每次需要時點名 reviewer，也可以在適用的 `AGENTS.md` 或 skill 裡寫明何時委派、要等什麼結果。[Subagents 文件](https://learn.chatgpt.com/docs/agent-configuration/subagents)

## 用 `/review` 審 diff，別把它當成合併按鈕

Codex `/review` 的優勢是範圍具體。你可以選擇對照 base branch、檢查未提交變更或檢查指定 commit；reviewer 會回報優先處理的發現，但不會改動工作樹。這很適合在實作後做獨立 diff review，尤其能讓審查者只聚焦改了什麼，而不必重讀整段任務歷史。[Codex Code Review 文件](https://learn.chatgpt.com/docs/code-review)

若希望審查模型不同於正在工作的模型，可在 `config.toml` 設定 `review_model`：

```toml
review_model = "YOUR_SUPPORTED_REVIEW_MODEL"
```

把 placeholder 換成目前 Codex 版本與帳戶支援的模型 ID。Code Review 也能用自訂指示設定全域審查重點與回報格式；例如優先找行為回歸、資料遺失和缺少邊界測試。若 review 結果需要在獨立對話處理，官方文件另列 `chatgpt.reviewDelivery = "detached"` 設定。這些是審查工作流的控制，不代表 reviewer 的結論已經被測試證實。

如果同一種判斷常常靠資深工程師口耳相傳，可以把可持續的規則放進 repo 的 `AGENTS.md`，並用 `## Code Review Rules` 標記，像是向後相容要求、不可跨越的資料界線、哪些例外可接受。OpenAI 的 Code Review 規則文章示範了規則如何貼近受影響程式碼、在 finding 裡指出對應規則；文中 98% 對 58.3% 的數字來自 OpenAI 自己設計的測試套件，應視為廠商內部評測，不是外部團隊的實際命中率。[Custom Code Review rules for Codex](https://developers.openai.com/blog/custom-code-review-rules-for-codex)・[AGENTS.md 官方指南](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

## Auto-review 審權限邊界，不審你的設計品味

Codex 的 Auto-review 是最像「第二個 Agent 替某個決策把關」的正式功能，但它檢查的決策很特定：主 Agent 要執行一個本來需要 approval 的操作時，Codex 把請求交給另一個 reviewer agent，回傳放行或拒絕及理由。觸發情境包含 sandbox 外的命令、受阻的網路請求、允許根目錄之外的檔案修改，以及部分需要 approval 的 MCP／app tool call。[Auto-review 文件](https://learn.chatgpt.com/docs/sandboxing/auto-review)

互動式 approval 下，設定概念如下：

```toml
approval_policy = "on-request"
approvals_reviewer = "auto_review"
```

重點不是這兩行會讓 Codex「更有權限」。官方明確說 Auto-review 是 reviewer 替換人工處理 eligible approval 的方式，**不會擴大 sandbox、開啟額外網路或放寬檔案邊界**；一般已在 sandbox 允許範圍內的操作也不會逐一被它 review。它的 reviewer 評估的是具體準備執行的操作與政策，不是「這個重構是不是好設計」或「回答是不是正確」。而且它不是確定性的安全保證，不能取代合理的 sandbox、監控和組織政策。

因此，不要用 Auto-review 代替 `/review` 或程式測試。前者看權限升級的動作；`/review` 看程式差異；測試與 CI 才能對可機械驗證的條件提供穩定 gate。需要不可跳過的審查，應由 branch protection、CI 或人工批准實作，而不是只靠模型自行決定要不要再問一位 reviewer。

## 自己做 Agent 產品：把 advisor 做成 manager 可呼叫的工具

若你不是只在 Codex 裡用，而是在開發自己的 GPT Agent，OpenAI Agents SDK 提供更直接的架構：建立一個 specialist agent，讓主 Agent 把它作為 tool 呼叫。只要兩個 agent 分別設定 `model`，就能用一個較快的 executor 搭配另一個模型作 bounded consultation；manager 仍負責最終回答。官方把這種模式稱為「agents as tools」，與 handoff（把對話控制權交給專家）區分開來。[模型設定](https://developers.openai.com/api/docs/guides/agents/models)・[Orchestration and handoffs](https://developers.openai.com/api/docs/guides/agents/orchestration)

概念程式如下，模型 ID 請換成部署環境實際支援的選項：

```ts
import { Agent } from "@openai/agents";

const advisor = new Agent({
  name: "Advisor",
  model: "gpt-6.1-sol",
  instructions: "Review the supplied plan or evidence. Return risks, alternatives, and checks; do not execute tools.",
});

const executor = new Agent({
  name: "Executor",
  model: "gpt-6-luna",
  tools: [
    advisor.asTool({
      toolName: "consult_advisor",
      toolDescription: "Request a bounded second opinion on a consequential decision.",
    }),
  ],
});
```

這段程式只建立路由能力，**不保證** executor 一定會在每一個指定節點呼叫顧問。若某種操作必須先審查，應由你的應用程式在流程層建立不可跳過的 checkpoint；若是工具副作用，則在 tool boundary 執行 policy／approval。OpenAI 也明確提醒，Responses API 與 Agents SDK 專案不會自動繼承 Codex Auto-review；自建 harness 必須自己加入 review 與 enforcement。[Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)

## OpenAI 自己的案例，能證明什麼、不能證明什麼

OpenAI 描述 DevDay 2025 的交付時，提到工程師用 Codex 熟悉 Guardrails SDK codebase、定位問題，透過 CLI／IDE extension 修正，再用 Codex code review 找出尚未處理的 bug，也用同一套工作流整理 ChatKit sample apps。[Codex at DevDay](https://developers.openai.com/blog/codex-at-devday) 這是第一方工程案例，說明探索、實作、審查可以放在同一條交付路徑；它不是對照實驗，不能單憑這個案例推論 Codex review 的缺陷召回率或生產力提升幅度。

這些工具最有用的共同點不是「多一個模型就更可靠」，而是把 review 對象切得夠清楚：計畫、diff、權限請求分別交給適合的機制。想理解 subagent 如何成為更廣泛的 harness 元件，可接著看[Skills、Subagents、Commands 與 Hooks](/blog/29-agent-era-skills-subagents-commands-hooks/)；若要從 repo 規範、測試與可觀測性設計 Codex 工作環境，可讀[Harness Engineering：讓 Codex Repository 可讀、可驗證、可治理](/blog/11-harness-engineering/)；更完整的 Agent runtime 基礎則見[AI Agent 實戰指南](/blog/64-ai-agent-guide/)。

## 導入時，用自己的任務比較三個條件

不要把「reviewer 說沒問題」當作成功指標。挑一組有清楚驗收條件的真實任務，至少比較主模型單獨工作、主模型加 reviewer，以及較強主模型單獨工作。記錄：

1. 最終測試與人工驗收是否通過，而不是 Agent 是否宣稱完成。
2. reviewer 找出的真實缺陷數、誤報數，以及執行者採納後是否真的修正問題。
3. 顧問呼叫、`/review`、Auto-review 各自的次數與觸發原因，不把三種審查混成一個數字。
4. 每個任務總 token／費用、延遲、返工，以及 reviewer 模型不可用或超時時的處理方式。
5. 誰有權做最後決定；對部署、刪除、外部寫入或敏感資料，是否仍有 CI、sandbox 或人工 gate。

> **花花的工程提醒**
>
> 不同模型可以減少部分同源偏誤，卻不會自動提供獨立真相。審查結果要能指向 diff、測試或政策證據；無法驗證的建議就保留為待查，而不是當成通過章。

對一般 Codex 專案，一個務實的起點是三步：計畫或反覆失敗時，委派 reviewer subagent，需要強制唯讀時先設定主對話的權限；patch 完成後跑指定 `review_model` 的 `/review`；跨 sandbox 的操作交給 Auto-review 判斷。最後仍以測試、CI 和人工責任收尾。如果你在打造自己的 Agent 產品，再用 Agents SDK 的 manager-as-tool 把顧問呼叫納入可觀測、可評測的流程。

## 來源與延伸閱讀

- [Codex Advisor v0.1.0](https://github.com/poirotw66/codex-advisor/releases/tag/advisor-v0.1.0) — 自訂 CLI 的 Apple Silicon 安裝檔與 SHA-256 校驗檔。
- OpenAI, [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) — Codex 自訂 subagent、模型設定、權限繼承與 reviewer 範例。
- OpenAI, [Code review](https://learn.chatgpt.com/docs/code-review) — `/review` 的範圍、唯讀結果、`review_model` 與審查工作流。
- OpenAI, [Auto-review](https://learn.chatgpt.com/docs/sandboxing/auto-review) — reviewer 如何審查 sandbox 邊界升級請求，以及權限與安全限制。
- OpenAI, [Custom Code Review rules for Codex](https://developers.openai.com/blog/custom-code-review-rules-for-codex) — 以 `AGENTS.md` 提供有範圍的審查慣例及廠商自評結果。
- OpenAI, [Orchestration and handoffs](https://developers.openai.com/api/docs/guides/agents/orchestration) 與 [Models and providers](https://developers.openai.com/api/docs/guides/agents/models) — Agents SDK 的 manager/specialist 模式和 per-agent model 設定。
- OpenAI, [Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals) — 自建 API／SDK Agent 必須自行實作的審查與 enforcement 邊界。
- OpenAI, [How Codex ran OpenAI DevDay 2025](https://developers.openai.com/blog/codex-at-devday) — Codex 在 SDK 除錯、修補與 code review 的第一方工程案例。
