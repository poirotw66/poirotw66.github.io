---
title: "深度解讀 Ornith 1.0：為何這個開源模型能擊敗 Claude Opus 4.7？「Self-Scaffolding 自我建構」技術全解析"
description: "深度剖析 DeepReinforce 發布的開源 Agentic Coding 模型 Ornith-1.0。從「Self-Scaffolding」協同演化機制、三層抗 Reward Hacking 防禦，到非同步 Pipeline-RL 衰減權重，全面拆解其跨級擊敗 Claude Opus 4.7 與 DeepSeek-V4-Pro 的技術底層。"
pubDate: 2026-07-23
updatedDate: 2026-07-23
category: "Industry Pulse"
tags: ["Machine Learning","AI Agent","Harness Engineering","Research","Evaluation"]
kind: "article"
showToc: true
image: "/blog/69-ornith-1-0-self-scaffolding-llm/title_image.jpg"
---
> [!NOTE]
> **官方原文出處**：[Ornith-1.0: Self-Scaffolding LLMs for Agentic Coding | DeepReinforce Blog](https://deep-reinforce.com/ornith_1_0.html)

2026 年 6 月，AI 開發者社群迎來了一項令人矚目的開源突破——DeepReinforce 團隊正式發布了專為 Agentic Coding（代理編程）打造的開源模型家族 **Ornith-1.0**。

令人震驚的是，旗艦款 **Ornith-1.0-397B** 在 Terminal-Bench 2.1 達到了 **77.5** 分、SWE-Bench Verified 達到了 **82.4** 分，不僅超越了同規模的開源巨擘 MiniMax M3 與 DeepSeek-V4-Pro，更一舉超越了 Anthropic 的頂級閉源模型 **Claude Opus 4.7**（70.3 / 80.8）。

更誇張的是，連可以在終端裝置（Edge Device）上部署的輕量版 **Ornith-1.0-9B**，其表現甚至能碾壓許多 31B 甚至 35B 規模的中型模型。

> 🐾 **花花（Bloom）的一句話總結**：
> 「最好的工匠不是拿著現成工具死板工作的人，而是能根據任務需要，隨手打造出最適合當前工況的專屬工具！Agent 的進化終點，是讓 AI 學會為自己寫腳手架 (Harness)！」

究竟這款開源模型為什麼這麼強？本文將深度解讀 Ornith-1.0 的核心技術白皮書，拆解其背後革命性的 **Self-Scaffolding（自我腳手架建構）** 訓練機制與工程實現細節。

---

## 1. 模型陣容與預訓練基底

Ornith-1.0 並非單一模型，而是一整套涵蓋從端側輕量化到雲端頂峰算力的完整模型家族。團隊選擇了市場上最強大的預訓練基底 **Gemma 4** 與 **Qwen 3.5** 進行二次微調與強化學習：

1. **Ornith-1.0-9B (Dense)**：基於 Gemma 4 / Qwen 3.5 密集模型微調，專為邊緣裝置 (Edge Devices) 與端側開發打造，具備極高的推理速度與低記憶體佔用。
2. **Ornith-1.0-31B (Dense)**：中型密集模型，兼具強悍的單核推理能力與靈活的本地部署潛力。
3. **Ornith-1.0-35B (MoE)**：採用混合專家 (Mixture-of-Experts) 架構，以極低的啟用參數數實現越級的程式開發表現。
4. **Ornith-1.0-397B (MoE)**：旗艦級超大規模 MoE 模型，專為極致的複雜軟體工程任務與多步驟 Agent 協同設計。

---

## 2. 核心突破：「Self-Scaffolding」讓模型自己寫腳手架 (Harness)

在傳統的強化學習 (RL) 代理編程訓練中，工程師通常會設計一套固定、通用的 **Harness（測試腳手架 / 框架）**，來導引模型在環境中進行探索與生成解答 (Rollout)。

然而，Ornith-1.0 團隊提出了一個核心洞察：**固定的 Harness 限制了模型的推理上限**。不同類型的寫程式任務，最佳的思考架構與工具調用策略應該是完全不同的。

因此，Ornith-1.0 引入了 **Self-Scaffolding 協同演化訓練框架**：

```
+-----------------------------------------------------------------------------------+
|                        Ornith 1.0 Self-Scaffolding RL Step                        |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ Task Description + Prior Scaffold ]                                            |
|                  │                                                                |
|                  ▼                                                                |
|   Stage 1: Propose Refined Scaffold (模型自發修訂任務專屬 Harness)                 |
|                  │                                                                |
|                  ▼                                                                |
|   Stage 2: Generate Solution Rollout (基於新 Harness 執行解題軌跡)                 |
|                  │                                                                |
|                  ▼                                                                |
|   [ Reward Signal ] ── (反向傳播獎勵至 Stage 1 與 Stage 2)                         |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

在每一個 RL 訓練步驟中，模型會分成兩個階段：
1. **Stage 1（腳手架提案）**：給定任務描述與過往使用的 Harness，模型先自主提案並修訂出一套專屬於該任務的內建 Harness（包含記憶管理、重試機制與工具調用順序）。
2. **Stage 2（解答執行）**：基於剛剛自己寫出的 Harness，模型生成最終的程式碼解答軌跡 (Rollout)。

最終的環境獎勵 (Reward) 會**同時回傳給這兩個階段**！這意味著，模型不僅在學習「如何寫出對的程式碼」，更在學習「如何為自己打造最順手的思維框架與編排邏輯 (Orchestration)」。經過無數次迭代，各種針對特定任務類別的代理策略便會自動湧現 (Emerge)。

---

## 3. 解決 Reward Hacking：三層嚴密防線

讓模型自己修改控制自己的 Harness，最致命的風險就是 **Reward Hacking（獎勵作弊）**——模型會學會「偷看測試答案」、「硬編碼輸出結果」或「直接複製環境中的隱藏驗證檔」，從而在不真正解決問題的情況下取得滿分。

為了封殺作弊行為，Ornith-1.0 構建了三層防禦體系：

1. **不可變的外層信任邊界 (Immutable Outer Trust Boundary)**：
   環境隔離、工具介面與測試驗證腳本放在模型的權限之外。模型**只能演化內部的 Policy Scaffold**（如長效記憶處理、錯誤重試機制、自我檢測邏輯），無法動到外部環境。
2. **決定性即時監控器 (Deterministic Monitor)**：
   在工具層進行嚴格監控。一旦偵測到模型企圖讀取保密路徑、修改驗證腳本或調用未授權工具，該次探索軌跡會直接判定為 **0 分**，並從 Advantage 計算中排除。
3. **凍結的 LLM 裁判 (Frozen LLM Judge)**：
   為防範模型在合規工具內進行意圖層面的作弊，在傳統 Verifier 之上設有一關由獨立 LLM 擔任的裁判，擁有最終一票否決權。

---

## 4. 非同步 Pipeline-RL 與 Token 衰減權重

在長軌跡的 Agent 訓練中，傳統 RL 容易面臨舊 Policy (Off-policy) 資料失效的問題。Ornith-1.0 採用了 **Pipeline-RL** 架構，並引入了 **Staleness Weight（過期度權重 \(w(d_t)\)）**。

根據 Token 的「年齡」\(d_t\)，透過以下分段函數對 Token 進行降權，超過門檻直接捨棄：

\[
w(d_t)= \begin{cases} 
1, & \text{if } d_t \le K_1,\\ 
\exp\!\bigl(-\lambda(d_t-K_1)\bigr), & \text{if } K_1 < d_t \le K_2,\\ 
0, & \text{if } d_t > K_2.
\end{cases}
\]

結合 Token-level GRPO 損失函數：

\[
L_t=\min\!\bigl(r_t A_t,\; \mathrm{clip}(r_t,1-\epsilon^{-},1+\epsilon^{+})A_t\bigr)\cdot w(d_t)
\]

其中比例 \(r_t\) 表示新舊 Policy 的概率比。這確保了模型在極長推理軌跡下訓練的穩定性與收斂速度。

---

## 5. 戰績榜：全方位評測數據對比

Ornith-1.0 在各項權威榜單上展現了恐怖的越級挑戰能力：

### 旗艦級模型對比 (397B / Frontier Class)
| 評測基準 (Benchmark) | Ornith-1.0-397B | Qwen3.5-397B | Qwen3.7-Max | DeepSeek-V4-Pro | Claude Opus 4.7 | Claude Opus 4.8 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Terminal-Bench 2.1 (Terminus-2)** | **77.5** | 53.5 | 73.5 | 64.0 | 70.3 | 85.0 |
| **Terminal-Bench 2.1 (Claude Code)** | **78.2** | 48.6 | 69.8 | 66.5 | 69.7 | 78.9 |
| **SWE-Bench Verified** | **82.4** | 76.4 | 80.4 | 80.6 | 80.8 | 87.6 |
| **SWE-Bench Pro** | **62.2** | 51.6 | 60.6 | 55.4 | 64.3 | 69.2 |
| **SWE-Bench Multilingual** | **78.9** | 69.3 | 78.3 | 76.2 | - | - |
| **NL2Repo** | **48.2** | 36.8 | 47.2 | - | - | 69.7 |
| **ClawEval Avg** | **77.1** | 70.7 | 65.2 | 75.8 | 78.2 | - |

### 中型與端側模型對比 (35B & 9B Class)
* **Ornith-1.0-35B**：在 Terminal-Bench 2.1 取得 **64.2** 分，直接碾壓了 397B 參數的 Qwen 3.5-397B（53.5 分），並在 SWE-Bench Verified 達到 **75.6**。
* **Ornith-1.0-9B**：在 SWE-Bench Verified 取得 **69.4** 分，性能追平甚至超越了 31B 規模的 Gemma 4-31B（52.0 分）與 Qwen 3.5-35B（70.0 分）。

---

## 6. 💡 給企業與開發者的工程建議

基於 Ornith-1.0 的 Self-Scaffolding 成功實踐，我們為建置 Agentic 系統的團隊提出以下四大工程建議：

> [!TIP]
> 1. **別再寫死固定的 Prompt 框架，轉向動態 Context 編排**：
>    傳統固定式提示詞容易遇到瓶頸。開發團隊應設計能夠根據任務複雜度自動切換思考層級 (Thinking Levels) 與工具組合的動態架構。
> 
> 2. **嚴格劃分「內外信任邊界 (Trust Boundaries)」**：
>    當賦予 Agent 更多自主權（如自訂工作流）時，必須將「環境隔離、操作權限、測試腳本」硬性置於 Agent 權限之外，防止模型在生產環境中出現意圖偏差或繞過行為。
> 
> 3. **採納「確定性監控 + LLM 裁判」雙重防線**：
>    僅靠單一評測工具容易產生死角。建議以確定性代碼監控邊界行為，同時輔以獨立 LLM 進行意圖稽核。
> 
> 4. **重視端側模型 (Edge Models) 的 CP 值紅利**：
>    Ornith-1.0-9B 的優異表現證明：經過良好腳手架優化的 9B/35B 模型，在專用 Coding 任務上完全能媲美舊世代的百億甚至千億模型，能為企業節省 80% 以上的推論算力成本！

---

## 7. 結論

Ornith-1.0 的成功證明了一件事：**AI Agent 的未來，不只在於模型本體 (Model) 的參數規模，更在於 Harness（腳手架）與 Model 的共同演化**。

透過 Self-Scaffolding，DeepReinforce 展示了如何讓模型在訓練過程中自主學會「最佳工程實踐」與「架構編排」。這項開源成果無疑為 2026 年的 Agentic AI 開發劃下了里程碑式的筆觸！
