---
title: "深入解析 Gemini 3.6 Flash、3.5 Flash-Lite 與 3.5 Flash Cyber：為 Agentic 應用打造的全新模型架構"
description: "Google 推出全新 Gemini 模型陣容，包含在效能與效率全面進化的 3.6 Flash、專為高吞吐量打造的 3.5 Flash-Lite，以及專攻資安漏洞防禦的 3.5 Flash Cyber，全面迎戰 AI Agent 大規模應用時代。"
pubDate: 2026-07-22
updatedDate: 2026-07-22
category: "Industry Pulse"
tags: ["Google","Gemini","AI Agent","AI 安全"]
kind: "article"
showToc: true
image: "/blog/67-gemini-3-6-flash-cyber/title_image.jpg"
---
隨著生成式 AI 跨入「代理 (Agentic)」時代，開發者與企業在建置正式環境的 AI Agent 時，越來越看重三個關鍵指標：**更高的 Token 效率、更低的延遲 (Latency)，以及更穩定的任務執行表現**。

為了解決大規模 Agentic 工作流的痛點，Google 官方部落格於稍早正式宣布推出三款全新的 Gemini 模型：**Gemini 3.6 Flash**、**Gemini 3.5 Flash-Lite** 以及專精資安領域的 **Gemini 3.5 Flash Cyber**。此外，官方也透露了 Gemini 4 的預訓練計畫已經展開。

以下我們將深入拆解這三款新模型帶來的架構升級與實務優勢。

---

## 1. Gemini 3.6 Flash：更高效率、更高品質的工作馬模型

Gemini 3.6 Flash 延續了 Flash 系列作為「主力工作馬」的定位，不僅在程式開發 (Coding) 與知識工作 (Knowledge Work) 上有顯著的品質躍升，更在 **Token 效率** 上達到了全新高度。

### 核心升級亮點
* **極致的 Token 效率**：根據 Artificial Analysis Index 的數據，3.6 Flash 在執行相同任務時，輸出的 Token 數量比 3.5 Flash **減少了 17%**。在 Datacurve 的 DeepSWE 基準測試中，甚至觀察到高達 **65%** 的 Token 節省。它能以更少的「推理步驟 (Reasoning steps)」與「工具調用 (Tool calls)」完成多步驟工作流，這對於降低 Agentic 應用的成本至關重要。
* **價格更親民**：3.6 Flash 的定價為 **每百萬輸入 Token $1.50 美元**、**每百萬輸出 Token $7.50 美元**，比前代 3.5 Flash 更低。
* **評測成績大幅提升**：
  * **程式開發**：在 DeepSWE 測試中展現出更高的精準度（49% vs. 37%），大幅減少了不必要的程式碼修改與無限迴圈。
  * **電腦操作 (Computer Use)**：在 OSWorld-Verified 評測中達到 83.0%（前代為 78.4%）。現在，Computer Use 已成為 Gemini API 與 Gemini Enterprise 內建的客戶端工具。
  * **機器學習研究**：在 MLE Bench 中達到了 63.9%（前代 49.7%）。
  * **知識工作**：在 GDPval-AA v2 評測中得分 1421（前代 1349）。包含 Hebbia 與 Harvey 等客戶表示，該模型在文件解析、圖表分析與報告起草等多模態任務上表現格外優異。
* **強化安全防禦**：3.6 Flash 搭載了升級版的「前沿安全 (Frontier Safety)」防護機制，大幅增強了抵禦越獄 (Jailbreak) 的能力，特別是在化學、生物、放射性與核能 (CBRN) 及網路攻擊領域，同時也確保模型不會過度拒絕正常有益的請求。

---

## 2. Gemini 3.5 Flash-Lite：專為大規模 Agentic 工作流打造

對於需要處理海量吞吐量 (High Throughput) 與極低延遲的開發場景（例如：Agentic 搜尋、大規模文件處理），Google 推出了 3.5 系列中最快的模型：**Gemini 3.5 Flash-Lite**。

### 核心升級亮點
* **極限速度與性價比**：3.5 Flash-Lite 的生成速度高達 **每秒 350 個輸出 Tokens**。定價極度激進，**每百萬輸入 Token 僅 $0.3 美元**、**每百萬輸出 Token 僅 $2.5 美元**，提供了無與倫比的性價比。
* **彈性的思考層級 (Thinking Levels)**：開發者可以根據工作負載動態配置模型。對於大量且單純的任務，可設定為低延遲的基礎思考模式；對於多步驟的子代理 (Subagent) 任務，則可切換至更高的思考層級，並同樣支援內建的 Computer Use 工具。
* **效能越級挑戰**：3.5 Flash-Lite 不僅遠勝先前的 3.1 Flash-Lite，在許多 Agent 與程式開發評測中，**甚至超越了規模更大的 Gemini 3.0 Flash**。例如：SWE-Bench Pro (54.2% vs. 49.6%) 以及 OSWorld-Verified (74.0% vs. 65.1%)。這使其成為替代 2.5 Flash 或 3.0 Flash 工作負載的更佳選擇。

---

## 3. Gemini 3.5 Flash Cyber：內建於 CodeMender 的資安防禦專家

隨著 AI 模型越來越擅長發掘資安漏洞，防禦方的修補速度也必須跟上。Google 此次發布的 **Gemini 3.5 Flash Cyber** 是基於 3.5 Flash 進行深度微調的專用模型，旨在以更低的成本實現大規模的漏洞檢測、驗證與修補。

### 核心升級亮點
* **多 Agent 協作架構**：3.5 Flash Cyber 將與 Google 內部的程式碼安全代理 **CodeMender** 結合。透過多個 Cyber Agent 協同工作並產出綜合報告，該模型在業界知名的 CyberGym 評測中達到了前沿 (Frontier) 水準的競爭力。
* **有限的試點計畫**：考量到資安模型的「雙用途 (Dual-use)」敏感特性，3.5 Flash Cyber 目前將採用「限制性釋出」。該模型將優先透過 CodeMender 提供給各國政府與受信任的合作夥伴，確保第一線防禦者能在漏洞被惡意利用前搶先修補。

---

## 總結與未來展望：Gemini 4 即將到來

Gemini 3.6 Flash 與 3.5 Flash-Lite 即日起已正式透過 Google AI Studio、Android Studio (Gemini API) 以及 Google Cloud 等平台上線，開發者可立即體驗其帶來的效能與成本紅利。

此外，Google 也預告了 **Gemini 3.5 Pro** 目前正與合作夥伴進行最終測試，很快就會正式推出。最令人振奮的是，官方透露團隊已經啟動了 **Gemini 4** 的預訓練計畫，這將是 Google 迄今為止最具野心的一次模型訓練，未來的 AI 發展令人拭目以待！

> **花花的一句話**：喵！新的 Gemini 3.6 Flash 與 3.5 Flash-Lite 簡直是速度與 CP 值的雙重暴擊，加上會自動抓漏洞的 3.5 Flash Cyber，就像給 AI 裝上了貓咪般敏捷的大腦與防禦盾牌喵！
>
> **花花的工程提醒**：在正式環境部署 Agent 時，應優先選擇兼具低延遲與高 Token 效率的模型（如 3.5 Flash-Lite），並在關鍵安全節點導入專用安全代理（如 CodeMender 結合 3.5 Flash Cyber），在控制算力成本的同時確保資安防線零死角。
