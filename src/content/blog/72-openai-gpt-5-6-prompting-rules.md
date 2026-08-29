---
title: "GPT-5.6 Prompting 規則清單：從精簡提示到工具編排"
description: "把 GPT-5.6 官方 prompting 收成可勾選規則：精簡、工具編排、何時不要把政策寫進 prompt。這篇是清單，不是 15% 那篇導讀。"
pubDate: 2026-07-27
updatedDate: 2026-08-28
tldr:
  - "OpenAI 官方指南證實：在 GPT-5.6 刪除重複規則與範例能使評測分數提升 10-15%，Token 消耗降低 41-66%，成本下降 33-67%。"
  - "掌握四大實戰技巧：精簡提示詞、明確劃分自主權與授權邊界、運用 API 級 text.verbosity 控制長度、以及使用工具編排標籤。"
  - "剖析 Programmatic Tool Calling (PTC)、Multi-agent (Beta) 與 Pro Mode (reasoning.mode: pro) 的最佳架構配置。"
audience:
  - "開發 AI Agent、Prompt 與系統架構的軟體工程師與 AI 架構師"
  - "使用 OpenAI API 或建立企業級 AI 應用與自動化工作流的技術團隊"
category: "AI Engineering"
tags: ["AI Agent", "OpenAI", "Harness Engineering", "Evaluation"]
cluster: "ai-agent"
clusterRole: "signal"
clusterOrder: 27
kind: "article"
showToc: true
image: "/blog/72-openai-gpt-5-6-prompting-rules/title_image.webp"
---
隨著 OpenAI 正式推出最新的 **GPT-5.6** 模型家族（包含旗艦級 `gpt-5.6-sol`、平衡型 `gpt-5.6-terra` 與高吞吐量 `gpt-5.6-luna`），官方開發者文件同步更新了 [GPT-5.6 Model Guidance & Prompting Best Practices](https://developers.openai.com/api/docs/guides/latest-model)。這份指南不僅揭示了 GPT-5.6 在推理、意圖理解與前端視覺設計上的突破，更為 AI 工程師帶來了全新的 Prompt 書寫法則。

過往在 GPT-4 時代被奉為圭臬的「塞滿 Few-shot 範例」、「反覆強調狂寫 ALWAYS/NEVER」以及「一步步思考」等提示詞密技，在 GPT-5.6 上不僅失去了效益，反而成為降低模型表現的干擾源。

本文依 OpenAI 官方指南整理 GPT-5.6 的 Prompt 瘦身原則、自主權邊界劃分、`text.verbosity` 長度控制、Pro Mode 以及程式化工具呼叫（Programmatic Tool Calling, PTC）的架構實踐。

> **花花的判斷**
>
> GPT-5.6 的 Programmatic Tool Calling (PTC) 與 Pro Mode 代表了 AI Agent 執行的分流轉折點。對於工具密集、多步驟資料處理，採用程式碼託管呼叫能大幅削減 RTT 延遲；而對於高價值的複雜架構審查，則應開啟 Pro Mode 與適當的推理努力程度（Reasoning Effort）。

## 1. 核心實證：Less is More（Prompt 瘦身帶來 15% 效能提升）

過去開發者習慣在 System Prompt 堆疊大量細節規章與重複的注意事項。然而，OpenAI 官方在內部 Coding Agent 評測中發現了一個震撼的數據：

> **將 System Prompt 與 Tool Description 精簡化，在相同的評測集上使任務評估分數（Evaluation Scores）提升了約 10%–15%，同時總 Token 消耗減少了 41%–66%，API 成本大幅下降 33%–67%。**

### 為什麼精簡 Prompt 表現更好？
GPT-5.6 具備強大的 System 2 推理能力與意圖推斷能力。過於繁複的提示詞與重複的約束會造成「指令碰撞（Intent Collision）」，強迫模型在多個微觀規則之間反覆權衡，進而浪費思考 Token 並干擾核心邏輯。

### 官方推薦的 Prompt 瘦身清單
- **規則一律只說一次**：同一個限制不要在 System Prompt、User Prompt 與 Tool Description 中重複出現。
- **清理無效的 Few-shot 範例**：除非範例是用於編碼產品專屬的硬性格式，否則過多範例會把模型的探索鎖死在狹窄示範中。
- **精簡 Tool Descriptions**：僅暴露當前任務百分之百會用到的工具，並維持工具描述簡潔精準。
- **移除模型本能指示**：毋須教模型「請一步步思考」、「請仔細檢查」，這些已是模型內建的推理本能。

## 2. 明確劃分自主權與授權邊界 (Autonomy & Approval Boundaries)

GPT-5.6 具備極強的主動性（Proactive）與長任務持續執行能力。若未給予清晰的授權邊界，模型可能因顧忌而頻繁停頓詢問，或是做出越權的修改。

官方建議在 Prompt 中加入**輕量化的授權邊界政策（Compact Policy）**：

```text
對於「回答、解釋、審查、診斷或規劃」請求：請檢查相關材料並回報結果。除非請求明確包含修改需求，否則請勿動手修改代碼。

對於「修改、構建或修復」請求：請直接在授權範圍內進行本地修改，並自動執行非破壞性驗證（如單元測試），無須事前詢問。

對於「外部寫入、破壞性操作、付費或擴大範疇」：必須強制向使用者確認後方可執行。
```

避免在提示詞中反覆警示「無授權不可動手」、「請先請示」，這會導致模型連讀取日誌或執行安全單元測試時都向用戶發起不必要的詢問。

## 3. 精準控制長度與語氣 (Length & Style Control)

GPT-5.6 預設的回應風格比 GPT-5.5 **更加精練**。過去常用的「Be concise」提示詞在 GPT-5.6 上可能導致輸出過於短少。

### 採用 API 級別控制 `text.verbosity`
OpenAI 建議透過 API 參數 `text.verbosity`（設定 `low` / `medium` / `high`）來掌控回答詳細度，將長度管理從自然語言 Prompt 中解耦。

### 指定短回答的「保留與刪減」順序
當任務需要精簡回答時，應告訴模型「什麼必須保留」與「什麼優先刪除」：

```text
結論先行。優先保留導出結論所需的關鍵證據、重大限制與下一步行動。
優先刪除引言開場白、重複性說明、通用安撫詞與非必要的背景補充。
```

### 具體化語氣規定
避開「請保持同理心」等模糊形容詞，直接說明寫作行為：

```text
請直接給出答案。若使用者回報問題，先簡要確認具體問題點再提供步驟。僅在相關時給予安撫，省略通用的讚美與無意義的結尾問候。
```

> **花花的工程提醒**
>
> 升級至 GPT-5.6 時，工程團隊應優先清理 System Prompt 中的重複提示與少量範例。資料顯示，極簡提示詞能降低最多 67% 的 API 費用，並使任務成功率提升 10%–15%。長度調控應優先使用 `text.verbosity` 參數而非模糊文字描述。

## 4. Pro Mode 與推理設定最佳實踐 (`reasoning.mode: "pro"`)

在 Responses API 中，GPT-5.6 支援啟用 Pro Mode（`reasoning.mode: "pro"`）。Pro Mode 會讓模型投入顯著更多的推理探索，並輸出單一高精確度的結果。

- **毋須 Meta-Prompts**：啟用 Pro Mode 時，Prompt **不需要**寫「請深度思考」或「請產生多個候選答案再比較」。
- **推理努力程度（`reasoning.effort`）**：GPT-5.6 支援 `none`、`low`、`medium`、`high`、`xhigh` 與 `max`。從舊版遷移時，先保持原有 effort 作為基準，再嘗試**調低一個等級**（如從 high 試降至 medium），觀察是否能在 Token 費用與延遲下降的同時維持品質。
- **推理上下文保存（`reasoning.context`）**：在多輪對話中，設定 `all_turns` 並配合 `previous_response_id` 可延續思考脈絡並享受快取折扣；若話題轉折則設為 `current_turn`。

## 5. 程式化工具呼叫編排（Programmatic Tool Calling, PTC）

GPT-5.6 引進了全新的 **Programmatic Tool Calling (PTC)**。模型能撰寫 JavaScript 在託管沙箱中一次執行多個工具呼叫、傳遞中間輸出並進行數據聚合，解決了傳統多輪工具呼叫帶來的 RTT 延遲與 Token 膨脹。

![Programmatic Tool Calling (PTC) 託管執行架構圖](/blog/72-openai-gpt-5-6-prompting-rules/programmatic_tool_calling.webp)

在編排工具呼叫時，建議使用 `<tool_orchestration>` 標籤規範：

```xml
<tool_orchestration>
針對 [限定階段]，使用 Programmatic Tool Calling 呼叫 [指定工具]。
在安全前提下並行執行獨立呼叫，並僅使用工具文檔中定義的欄位。

在執行環境中處理並精簡中間結果，最終僅輸出 [指定 Schema]，包含最終答案所需的證據。

當滿足 [終止條件] 時停止。遇到瞬時錯誤最多重試 [N] 次。
請勿重複執行已完成的呼叫，亦勿執行有副作用的操作。若缺乏關鍵結果，返回明確的結構化失敗訊息。

對於 [語意判斷、人工審批或最終驗證]，請維持使用 Direct Tool Calls。
</tool_orchestration>
```

對於單次呼叫即可完成、或每次結果都會改變下一步決策的任務，應維持使用 Direct Tool Calls。

## 總結：GPT-5.6 提示詞工程觀念轉變

| 範疇 | 舊時代 Prompting (GPT-4 / 5.4) | GPT-5.6 新法則 |
| :--- | :--- | :--- |
| **System Prompt** | 堆疊幾十條注意事項與防禦規則 | 極簡化，僅保留核心目標與權限 |
| **範例（Few-shot）** | 提供大量對話與工具呼叫範例 | 減少範例，著重於工具介面型別設計 |
| **長度控制** | Prompt 中狂寫 "Be concise" | 採用 API 參數 `text.verbosity` |
| **工具執行** | 多輪模型與 API 之間的往返 | 採用 Programmatic Tool Calling 託管編排 |
| **推理模式** | 寫 "think step by step" 提示詞 | API 設定 `reasoning.mode: "pro"` 與 effort |

透過掌握極簡提示詞、明確授權邊界、API 級別長度調控與 PTC 工具編排，開發者將能完全釋放 GPT-5.6 的真實實力，打造出更為高效、成本更低且品質卓越的 AI Agent 系統。

## 延伸閱讀與參考來源

- 官方文件：[OpenAI Developers: Model guidance for GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model)
- 本站導讀：[Claude 5 世代的 Context Engineering 新法則：刪除 80% System Prompt 後的 AI Agent 設計學](/blog/71-context-engineering-claude-5/)
- 本站導讀：[GPT-5.6 Sol 提示詞指引：為什麼精簡 prompt 反而比較準](/blog/52-openai-prompting-guidance-gpt-5-6-sol/)
- 本站導讀：[GPT-5.6 Sol 是什麼：路由、價格與評測](/blog/48-openai-previewing-gpt-5-6-sol/)
- 本站導讀：[AI Agent 完整指南：架構、工具、評測與企業落地](/blog/64-ai-agent-guide/)
