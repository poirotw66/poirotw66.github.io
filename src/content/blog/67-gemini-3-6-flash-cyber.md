---
title: "Gemini 3.6 Flash、3.5 Flash-Lite 與 Flash Cyber：定位、價格與採用邊界"
description: "整理 Gemini 3.6 Flash、3.5 Flash-Lite 與 3.5 Flash Cyber 的官方定位、目前價格、發布方評測與可用性，並提出 Agent 模型路由與資安權限的驗證重點。"
pubDate: 2026-07-22
updatedDate: 2026-08-29
tldr:
  - "本文整理三個 Gemini 型號在低延遲、批量工作流與資安防禦上的定位差異。"
  - "模型速度、成本與評測分數應視為發布方宣稱；採用前仍要以實際工作負載驗證。"
audience:
  - "正在設計 Agent 工作流、模型路由或成本治理機制的工程團隊"
  - "需要評估生成式 AI 與資安自動化風險的技術決策者"
category: "Industry Pulse"
tags: ["Google","Gemini","AI Agent","AI 安全"]
kind: "article"
showToc: true
image: "/blog/67-gemini-3-6-flash-cyber/title_image.webp"
---
隨著生成式 AI 跨入「代理 (Agentic)」時代，開發者與企業在建置正式環境的 AI Agent 時，越來越看重三個關鍵指標：**更高的 Token 效率、更低的延遲 (Latency)，以及更穩定的任務執行表現**。

Google 在 2026 年 7 月的[官方發布文](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)中推出三款模型：**Gemini 3.6 Flash**、**Gemini 3.5 Flash-Lite**，以及專精資安領域的 **Gemini 3.5 Flash Cyber**。官方同時表示 Gemini 4 的預訓練已經展開。

以下把三者視為不同工作負載的候選模型，而不是同一條由弱到強的排行榜。速度、token 效率與 benchmark 均為 Google 或其引用測試的發布數字，採用前仍要用自己的任務重跑。

> **花花的一句話**
>
> 選模型不是只看排行榜：把快模型、深度推理模型與安全檢查放在不同關卡，才能同時兼顧成本、延遲與風險。

## 1. Gemini 3.6 Flash：更高效率、更高品質的工作馬模型

Gemini 3.6 Flash 延續 Flash 系列的通用主力定位。Google 將它描述為比 3.5 Flash 更適合程式開發、知識工作與多模態任務，並強調較少的輸出 token、推理步驟與工具呼叫。

### 核心升級亮點
* **發布方的 Token 效率數字**：Google 引用 Artificial Analysis Index，表示 3.6 Flash 比 3.5 Flash 少用 **17%** 輸出 token；在 Datacurve DeepSWE 上則觀察到最高 **65%**。不同 harness、停止條件與工具設計會改變結果，不能直接外推到每個 Agent 工作流。
* **發布價與目前價格不同**：發布文列出每百萬輸入／輸出 token **\$1.50／\$7.50 美元**；[Gemini API 現行價格頁](https://ai.google.dev/gemini-api/docs/pricing)則顯示 2026 年 12 月 31 日前暫時為 **\$0.75／\$3.75 美元**，2027 年起回到前述價格。估算 TCO 時應鎖定日期與帳戶方案。
* **評測成績大幅提升**：
  * **程式開發**：在 DeepSWE 測試中展現出更高的精準度（49% vs. 37%），大幅減少了不必要的程式碼修改與無限迴圈。
  * **電腦操作 (Computer Use)**：在 OSWorld-Verified 評測中達到 83.0%（前代為 78.4%）。現在，Computer Use 已成為 Gemini API 與 Gemini Enterprise 內建的客戶端工具。
  * **機器學習研究**：在 MLE Bench 中達到了 63.9%（前代 49.7%）。
  * **知識工作**：在 GDPval-AA v2 評測中得分 1421（前代 1349）。包含 Hebbia 與 Harvey 等客戶表示，該模型在文件解析、圖表分析與報告起草等多模態任務上表現格外優異。
* **強化安全防禦**：3.6 Flash 搭載了升級版的「前沿安全 (Frontier Safety)」防護機制，大幅增強了抵禦越獄 (Jailbreak) 的能力，特別是在化學、生物、放射性與核能 (CBRN) 及網路攻擊領域，同時也確保模型不會過度拒絕正常有益的請求。

## 2. Gemini 3.5 Flash-Lite：專為大規模 Agentic 工作流打造

對於需要處理海量吞吐量 (High Throughput) 與極低延遲的開發場景（例如：Agentic 搜尋、大規模文件處理），Google 推出了 3.5 系列中最快的模型：**Gemini 3.5 Flash-Lite**。

### 核心升級亮點
* **發布方速度與價格**：Google 引用 Artificial Analysis 的 **每秒 350 個輸出 token**；官方定價為每百萬輸入／輸出 token **\$0.30／\$2.50 美元**。這些數字適合建立候選清單，不等於你的端到端任務延遲或完成成本。
* **彈性的思考層級 (Thinking Levels)**：開發者可以根據工作負載動態配置模型。對於大量且單純的任務，可設定為低延遲的基礎思考模式；對於多步驟的子代理 (Subagent) 任務，則可切換至更高的思考層級，並同樣支援內建的 Computer Use 工具。
* **發布方 benchmark**：Google 報告它在 SWE-Bench Pro（54.2% vs. 49.6%）與 OSWorld-Verified（74.0% vs. 65.1%）高於 Gemini 3 Flash。這支持「值得做遷移測試」，但不代表現有 2.5／3 Flash 工作負載可無條件替換。

## 3. Gemini 3.5 Flash Cyber：內建於 CodeMender 的資安防禦專家

隨著 AI 模型越來越擅長發掘資安漏洞，防禦方的修補速度也必須跟上。Google 此次發布的 **Gemini 3.5 Flash Cyber** 是基於 3.5 Flash 進行深度微調的專用模型，旨在以更低的成本實現大規模的漏洞檢測、驗證與修補。

### 核心升級亮點
* **多 Agent 協作架構**：Google 在 [Flash Cyber 技術說明](https://deepmind.google/blog/introducing-gemini-3-5-flash-cyber/)中表示，CodeMender 會多次呼叫模型，讓子 Agent 探索不同程式路徑後合併報告；CyberGym 結果因此是整個 agent system 的表現，不是裸模型分數。
* **有限的試點計畫**：考量「雙用途 (Dual-use)」風險，3.5 Flash Cyber 預計先透過 CodeMender 限量提供給政府與受信任夥伴。一般開發者不能把它視為 Gemini API 中可直接選用的常規模型。

## 工程判讀：先用工作負載驗證，再決定模型路由

文中的速度、定價、可用性與評測結果屬於產品發布時的資訊，實際使用前應以官方文件、區域供應狀態與帳戶方案為準。對於 Agent 工作流，建議以代表性任務建立延遲、成功率、工具呼叫次數與每任務成本的基準，再決定哪些步驟使用快速模型、哪些步驟需要較高推理能力。

資安相關能力也不應直接取得生產環境的修補權限。先以最小權限、隔離測試環境與可稽核的人工核准流程驗證輸出，再逐步擴大自動化範圍。

## 延伸閱讀

- [AI Agent 完整指南：從架構到生產環境](/blog/64-ai-agent-guide/)
- [Agent 寫程式的 Self-Scaffolding：Ornith 1.0 的訓練與評測邊界](/blog/69-ornith-1-0-self-scaffolding-llm/)

## 一手來源

- [Google：Gemini 3.6 Flash、3.5 Flash-Lite 與 3.5 Flash Cyber 發布文](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)
- [Google AI for Developers：Gemini API 定價](https://ai.google.dev/gemini-api/docs/pricing)
- [Google DeepMind：Gemini 3.5 Flash Cyber 與 CodeMender](https://deepmind.google/blog/introducing-gemini-3-5-flash-cyber/)

> **花花的工程提醒**
>
> 把模型選型、工具權限與安全審核做成獨立的控制面；快速模型可以處理大量低風險工作，但高風險動作必須維持可驗證與可回退。
