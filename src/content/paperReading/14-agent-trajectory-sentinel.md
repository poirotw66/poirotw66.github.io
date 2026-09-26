---
title: "Real-Time Detection and Repair of LLM Agent Failures：Agent 失敗的即時偵測與修復"
description: "精讀 AgentTrajectorySentinel 如何用健康軌跡訓練的低成本時間監控器、決定性驗證與 rollback-and-retry，在不逐步呼叫 LLM judge 的情況下提早攔截失敗；同時拆開它的校準依賴、內容盲點、修復實驗與可重現性邊界。"
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "論文把 agent reliability 寫成 runtime control loop：先從 step telemetry 偵測行為偏移，再用 deterministic checks 驗證工具結果，最後 rollback 到已知狀態並重試。"
  - "在 2,823 個跨 25 個 corpus 的 episode 上，主要 ESN-CUSUM monitor 在 5% false-alarm budget 下回報 0.707 detection、AUROC 0.872；但跨 deployment 未重新校準時 AUROC 只有 0.527。"
  - "決定性驗證在同一批標註 episode 上以 0/63 false positives 捕捉 60% 失敗，加入 coverage check 後為 96%；repair study 的 located policy 將整體成功率從 52% 提升到 73%。"
  - "最可靠的工程結論不是『零誤報的通用監控器』，而是讓行為監控、合約驗證、judge escalation 與可回滾修復各自處理它們看得見的失敗。"
audience:
  - "正在設計 Agent observability、runtime guard 或 evaluation harness 的 AI 工程師。"
  - "需要把工具合約、失敗隔離、重試成本與校準流程接到 production agent platform 的技術負責人。"
tags: ["Paper Reading", "AI Agent", "Evaluation", "Agent Runtime", "Observability", "Governance"]
image: "/paperReading/14-agent-trajectory-sentinel/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
paper:
  title: "Real-Time Detection and Repair of LLM Agent Failures"
  authors:
    - "Sunny Dubey"
  year: 2026
  venue: "arXiv cs.AI/cs.LG/cs.SE preprint, v1 (submitted 2026-08-03)"
  links:
    pdf: "https://arxiv.org/pdf/2608.02464v1"
    arxiv: "https://arxiv.org/abs/2608.02464"
    doi: "https://doi.org/10.48550/arXiv.2608.02464"
    code: "https://github.com/sunnydubey1111/agent-trajectory-sentinel"
series:
  id: "agent-evaluation"
  title: "Agent 評測"
  part: 3
  totalParts: 4
---

## 90 秒掌握論文 / The paper in 90 seconds

- **問題 / Problem：** LLM Agent 的失敗往往在最終輸出前數步就已萌生（例如死迴圈、工具錯誤連鎖、偏離目標），但若在每一步都呼叫一個 LLM judge 進行逐步審計，延遲過高且推理成本翻倍，難以在生產環境實現即時防護（Section 1–3）。
- **核心洞見 / Core insight：** 系統可靠性來自「運行時控制迴路（runtime control loop）的分層防禦」：先用只在健康軌跡上訓練的低成本時間監控器（ESN-CUSUM）捕捉行為統計偏移，再由零誤報的決定性驗證器（deterministic verifiers）檢查工具合約與數值一致性；一旦確認異常，系統立即回滾（rollback）至最近的可信狀態檢查點，並執行帶有失敗條件說明的定向重試（located repair）（Section 3, 10）。
- **最強證據 / Strongest evidence：** 在跨越 25 個語料庫的 2,823 個 episode 上，主要 ESN-CUSUM 監控器在 5% 誤報預算下達到 0.707 偵測率與 0.872 AUROC，平均提前 4.6 步發出告警（Section 5, Table 1）；在修復研究中，僅指出未滿足條件的 `located` 修復策略將整體任務成功率從 52% 提升至 73%（Table 4）。
- **主要邊界 / Main boundary：** 行為監控器高度依賴精確匹配的健康基準分布校準，未校準的跨模型轉移 AUROC 暴跌至 0.527；統計遙測對看似合理但內容錯誤的文字幻覺（plausible hallucinations）存在原理性盲點，且不可逆的外部操作無法依賴回滾恢復（Section 5.4, 8, 11）。

這篇 16 頁的 arXiv 預印本由 Sunny Dubey 於 2026-08-03 提交（arXiv:2608.02464v1）。如果 Agent 在執行到第 4 步時已經陷入死迴圈、工具連鎖報錯，或把被竄改的偽造數據當成真理，我們能否在它交付最終錯誤答案之前攔截並修復？而且不必承受每一步都呼叫第二個 LLM judge 的巨大成本？

AgentTrajectorySentinel 給出的解答不是一個零誤報的通用監控器，而是一個將行為偵測、合約驗證、狀態回滾與定向修復緊密閉環的運行時架構。

> **花花的工程提醒**
>
> 把健康軌跡當成 null distribution 之前，先把部署的 model、temperature、tool roster、telemetry schema 與 acceptance gate 固定下來。這個 monitor 的「便宜」成立在它不需要第二個模型，但它不是免費的：每個 deployment 都要付校準與維護成本。

## 理解前需要知道什麼 / What to know first

在深入探討架構細節之前，必須釐清既有方法為什麼不夠，以及支撐本論文的關鍵先備機制：

1. **既有方法為什麼不夠：**
   - **事後結果評判（Post-hoc outcome evaluation）：** 傳統評測（如 OSReward）只能在任務完全終止後判定成敗，無法在執行過程中阻止連鎖錯誤擴散或攔截潛在的有害外部操作。
   - **逐步模型審計（Step-level LLM auditor）：** 在每一步呼叫 7B 或更大規模的模型評估當前行為，每步延遲動輒增加數百毫秒至數秒，且 API 成本直接翻倍，缺乏即時生產可用性。
   - **無記憶異常偵測（Memoryless anomaly detection）：** 傳統異常偵測（如單步 Mahalanobis 距離）僅評估孤立步的特徵偏離，無法捕捉跨步驟展開的時間動態異常（例如緩慢的目標偏離或漸進式重試雪崩），在相同誤報率下偵測率僅約 0.374。

2. **核心先備概念：**
   - **Echo State Network (ESN)：** 儲層計算（Reservoir Computing）架構的一種，內部維持一個權重隨機固定且具備時間記憶的稀疏動態儲層，僅透過線性 Ridge 回歸訓練輸出的 readout 矩陣，推理速度極快（單步約 200 微秒）。
   - **CUSUM (Cumulative Sum Control Chart)：** 一種順序統計過程控制演算法，專門用於累積小幅度但持續的方向性殘差；一旦殘差累積超過預設門檻，即判定製程發生結構性偏移。
   - **健康分布校準（Healthy-only Null Distribution）：** 監控器訓練時不需要標註故障樣本，僅需在確定執行成功的「健康軌跡」上學習基線動態，並利用驗證集分位數設定告警門檻 $\theta$。
   - **決定性驗證（Deterministic Verification）：** 採用純程式邏輯（如 JSON schema 檢查、工具調用次數統計、重算加總）的硬性防線，具備 0 誤報率與極高的執行速度。

## 核心直覺 / Core intuition

過去的 Agent 防護思維往往試圖用一個「更聰明、參數更大」的全知模型，在每一步去讀取自然語言並猜測意圖是否正常。這種方式成本極高，且難以擺脫語言模型固有的幻覺問題。

AgentTrajectorySentinel 的核心直覺是**將「行為動態」與「資料語義」拆解到不同的抽象層次，並將偵測與修復閉環相連**：

- **時間動力學可低成本捕捉行為偏移：** 一個健康的 Agent 在理解任務、查詢工具、消化回傳資訊時，其輸出長度、延遲、token 預測不確定性與字元分佈在時間序列上具有特定的動態節奏。陷入迴圈（looping）或遭遇工具報錯連鎖時，即使個別步驟的單詞看起來合法，時間殘差也會在 CUSUM 中迅速累積。
- **資料合約應交由決定性邏輯守門：** 工具回傳的形狀是否合法、關鍵步驟是否被遺漏、數值計算是否與工具結果吻合，本質上是可形式化的數學與工程規格，不需要動用機率模型。決定性檢查能以 0 誤報率捕捉絕大多數嚴重的工具使用故障。
- **介入點應是受控回滾而非盲目重試：** 一旦偵測到故障，系統不應從頭重新生成，也不應讓 Agent 在已被污染的上下文中繼續硬撐；正確做法是回滾到最後一個可信的數據獲取檢查點（checkpoint），並以精確的錯誤提示告訴模型「哪個驗證條件未滿足」，引導模型自主演繹出修復路徑。

## 用一個例子走完整個方法 / Walk one example through the method

以一個典型的「多來源財務資料收集與季度彙總報表生成」任務為例，走完整個防護迴路：

1. **任務輸入（Input）：** 使用者要求 Agent「調用 3 家區域分行的 API 取得第 2 季營收，計算總金額並在 Markdown 報表中列出各分行佔比」。
2. **中間表示與遙測（Intermediate representation）：**
   - Step 1：Agent 調用 Branch 1 API，收到 `{"revenue": 1200000}`。適配器抽取字元 3-gram 雜湊、延遲（115ms）與 token 平均熵，組成 60 維遙測向量 $x_1$。ESN 儲層更新狀態，單側 CUSUM 分數保持在低位。
   - Step 2：Agent 調用 Branch 2 API，但端點發生暫態錯誤回傳 `500 Internal Error`。Agent 未能正確處理，開始以相同參數連續重試，陷入工具呼叫迴圈。
3. **異常偵測與驗證判定（Decision or transformation）：**
   - Step 3–4：ESN 預測的下一步狀態與實際遙測（重複的錯誤碼與高 token surprisal）產生持續殘差。CUSUM 最大值 $s_t$ 超過健康校準門檻 $\theta$（Threshold alarm）。
   - 告警立即觸發 Deterministic Verifier Suite 進行硬性診斷：
     - `tool_contract`：檢查發現 Branch 2 的回傳內容違反資料庫 schema。
     - `required_coverage`：檢查發現 3 個分行中只有 1 個成功完成調用，未達任務規定的 100% 覆蓋。
     - `total_consistency`：尚未取得足夠數值，總金額計算處於未滿足狀態。
4. **輸出與修復（Output & Repair）：**
   - 系統阻斷當前執行，將 Agent 環境狀態回滾（rollback）到 Step 1 完成後的 checkpoint（保留 Branch 1 的成功結果與有效上下文）。
   - 啟動 `located` 修復策略：向 Agent 注入定向提示詞「驗證失敗：Branch 2 呼叫回傳格式錯誤，且尚未取得 Branch 2 與 Branch 3 之營收數據；請調整請求參數或調用備用端點」。
   - Agent 依據定向提示切換至備用端點取得 Branch 2 與 3 的數據，完成數值重算，各項決定性檢查全數通過，輸出最終審計報表。
5. **潛在失敗點（Likely failure point）：** 若 Branch 2 API 正常回傳了一個格式完美但數值虛假的偽造數字（例如將 1,200,000 寫成 120,000），且系統沒有外部獨立對帳來源，則 ESN 行為監控器與 schema 驗證器均會判定其為正常通過。這種「內容層面的合理幻覺」是該機制無法單獨解決的本質盲點。

## 技術機制 / Technical mechanism

AgentTrajectorySentinel 包含四個緊密相扣的子系統（Section 3–4）：

### 1. 逐步可觀測遙測（Observable Telemetry Vector $x_t$）

在 Agent 執行的每個步驟 $t=1,\ldots,T$，遙測適配器將執行上下文壓縮為一個固定維度的可觀測特徵向量 $x_t = [e_t; u_t; m_t]$（Section 4, Table 1）：
- $e_t$：輸出文字的決定性字元 3-gram 雜湊嵌入（deterministic char-3-gram hash embedding），捕捉輸出的淺層語法與結構分佈。
- $u_t$：Token 層級的不確定性統計量（包含 average entropy、top-1 probability、surprisal aggregates）。
- $m_t$：動作與系統元數據（包括 action type one-hot、執行延遲 latency、輸出字元長度、tool error flag）。

特徵空間隨研究版本演進：基礎遙測為 43 維；加入行為特徵後升至 51 維；v4 版本進一步整合 9 個內容基礎特徵（content-grounding features，包括 query-result dissimilarity、result self-consistency、JSON prefix validity、lexical relevance flag 等）擴充至 60 維。

### 2. 健康軌跡時間監控器（Healthy-only Temporal Monitor）

對每個特徵通道 $c \in \{1,\ldots,D\}$，系統維護一個獨立的 Echo State Network（ESN）。其內部狀態 $r_{t,c} \in \mathbb{R}^{N_r}$（儲層維度 $N_r=100$）隨時間推進：
$$r_{t,c} = (1 - \alpha) r_{t-1,c} + \alpha \tanh(W_{in} x_{t,c} + W_{res} r_{t-1,c})$$
其中輸入矩陣 $W_{in}$ 與稀疏儲層矩陣 $W_{res}$ 在初始化時固定，不參與訓練；$\alpha$ 為洩漏率（leaking rate）。

系統僅在健康的驗證軌跡上透過 Ridge 回歸訓練線性輸出層 $W_{out,c}$，用以預測下一步數值 $\hat{x}_{t+1,c} = W_{out,c} r_{t,c}$。定義單步標準化殘差 $z_{t,c} = (\epsilon_{t,c} - \mu_c) / \sigma_c$，並以單側 CUSUM 累積統計量追蹤異常偏移：
$$C_{t,c}^+ = \max(0, C_{t-1,c}^+ + z_{t,c} - k)$$
其中 $k$ 為寬容係數（slack allowance）。整體監控器告警分數取所有通道的最大值：
$$s_t = \max_{c} C_{t,c}^+$$
當 $s_t > \theta$ 時觸發告警，門檻 $\theta$ 嚴格依據健康驗證集在指定誤報預算（如 5%）下的最高分位數確定。這種因果評分（causal scoring）確保第 $t$ 步無法看見未來資訊，且完全不需任何故障標籤。

![Real agent traces：監控器在注入失敗與 grounding blind spot 的 step-level 行為](https://arxiv.org/html/2608.02464v1/fig1_score_traces_real.png)

*Figure 1：真實工具軌跡上的 CUSUM 分數。注入的 context corruption、goal drift、looping、tool cascade 在驗證 onset 後被告警，而 grounding loss 的行為 channel 可以保持平坦；該類由 deterministic grounding verifier 處理。來源：[Dubey, Figure 1／§5](https://arxiv.org/html/2608.02464v1#S5.F1)，依原論文 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 授權使用。*

### 3. 決定性驗證套件（Deterministic Verifier Suite）

驗證套件由三個完全不需統計校準的純程式檢查構成：
- `total_consistency`：從 Agent 實際收到的工具回傳原始文字中重新剖析並重算目標數值，與 Agent 聲稱的計算結果核對。
- `required_coverage`：對照任務需求契約，檢驗所有必備工具是否皆已被成功執行。
- `tool_contract`：在工具結果返回的第一時間，以事先定義的 JSON schema 驗證其資料結構是否合規。

### 4. 混合邏輯融合（Hybrid Logistic Fusion）

論文在 Section 7 提出了結合無記憶 Mahalanobis 距離與 ESN-CUSUM 時間分數的混合邏輯回歸模型：
$$P(\text{failure} \mid x_t) = \sigma(\beta_0 + \beta_1 d_{Mahal}(x_t) + \beta_2 s_t)$$

![Hybrid logistic fusion：不同 deployment 的 Mahalanobis／ESN 決策邊界](https://arxiv.org/html/2608.02464v1/hybrid_explain.png)

*Figure 5：混合邏輯融合（Hybrid logistic fusion）在不同部署環境學到的決策邊界；短 horizon 的 real-agent data 更依賴 Mahalanobis 距離，長 horizon 的模擬器更依賴 ESN。來源：[Dubey, Figure 5／§7](https://arxiv.org/html/2608.02464v1#S7.F5)，依原論文 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 授權使用。*

## 實驗如何讀 / How to read the evidence

要正確理解論文的實證宣稱，必須深入剖析其評測配置、對照基準與核心數據：

### 1. 實驗設置、語料與計算成本

- **語料規模（Datasets & Corpora）：** 論文及其開源 artifact 涵蓋 25 個語料庫、共 2,823 個 episode。其中 770 個為執行真實工具的 real-tool 軌跡，其餘為受控模擬工具套件（deterministic mock-tool suite）。
- **模型分佈（Models）：** qwen2.5:7b（1,890 個 episode）、llama3.1:8b（433 個）、qwen2.5:3b（357 個）、gemini-2.5-flash（143 個）。
- **代理框架（Frameworks）：** 包括原生 Ollama 迴圈、LangGraph 與 AutoGen。
- **對照基準（Baselines）：** 無記憶 Mahalanobis 與 $\Delta$-Mahalanobis、cosine/self-drift、rolling entropy、線性 VAR-ridge、GRU、LSTM、TCN，以及 ESN-Mahalanobis 混合模型。
- **評測指標（Metrics）：** AUROC、固定 5% 誤報率下的偵測率（detection @ 5% FPR）、平均提前步數（mean lead steps）、誤報數（false positives）、修復率（recovery rate）與任務最終成功率（task success）。
- **計算成本與延遲（Compute & Latency）：** 離線評測主要在 CPU 上運行（基準環境為 24 邏輯核心）；ESN-CUSUM 單步評分耗時約 200 微秒，加上完整 v4 遙測適配器之中位數延遲為 674 微秒/步，遠低於逐步呼叫 7B 模型審計（通常需數百毫秒）。

### 2. 結果一：時間累積效應（Horizon Diagnosis）

在合成測試集的 5 個隨機種子中，主要 `esn_cusum_max` 在 5% 誤報預算下取得 $0.707 \pm 0.068$ 偵測率，AUROC 達 $0.872 \pm 0.015$，平均提前 4.6 步發出預警；而表現最佳的無記憶基準 $\Delta$-Mahalanobis 偵測率僅為 $0.374 \pm 0.03$。

然而，在 1,002 個注入失敗 episode 的時間跨度分析揭示了關鍵的邊界條件：
- 當 post-onset horizon $\le 3$ 步時，ESN 相對 Mahalanobis 的偵測率優勢僅為 +0.09；
- 當 horizon 為 4–8 步時，優勢擴大至 +0.14；
- 當 horizon $\ge 9$ 步時，優勢顯著攀升至 +0.40。

這表明時間監控器必須在「故障已發生、但任務尚未終結」的窗口內累積足夠的時間殘差；如果錯誤發生距任務結束只有一兩步，無記憶距離反而相當具備競爭力。

### 3. 結果二：跨類別覆蓋率與轉移脆弱性

![Real deployments：不同 failure class 的 monitor coverage](https://arxiv.org/html/2608.02464v1/fig3_class_coverage_real.png)

*Figure 2：九個真實語料庫（real corpora）上的主監控器偵測率。空白表示該語料庫不含該失敗類別。looping 偵測率約 0.48–1.00，tool cascade 約 0.17–1.00，goal drift 在出現的四個語料庫中為 0.66–0.86；明顯弱點為 wrong_document（0.00–0.20）與 malformed_json（0.05–0.50）。來源：[Dubey, Figure 2／§5](https://arxiv.org/html/2608.02464v1#S5.F2)，依原論文 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 授權使用。*

Figure 2 清晰展現了行為監控器的能力與邊界：它能高度靈敏地捕捉改變動態行為的錯誤（looping 偵測率 0.48–1.00，tool cascade 0.17–1.00，goal drift 0.66–0.86）；但對於未改變系統動態的靜態內容錯誤（如 wrong_document 僅 0.00–0.20，malformed_json 僅 0.05–0.50）幾乎完全失效。

更嚴重的邊界在於**未校準的跨模型轉移**：在 qwen2.5:7b 上校準的監控器直接部署至任務相同的 llama3.1:8b 時，AUROC 暴跌至 0.527（接近隨機猜測），健康軌跡誤報率高達 75%；唯有在目標模型上重新收集健康軌跡並校準後，AUROC 才回升至 0.885。

### 4. 結果三：決定性驗證與修復實驗

決定性驗證與修復策略（Section 10, Table 3–4）構成了全篇論文最具生產價值的成果：
- **驗證器表現（Table 3）：** 在相同標註 episode（$T=0.2$）上，決定性檢查捕捉到 60% 失敗，加入 coverage 檢查後捕捉率飆升至 96%（監控器僅為 54%）；更重要的是，決定性檢查的誤報率為 0/63（0%），而統計監控器為 11/63（17%）。在 120-episode 的 holdout 集合上，檢查 totals 捕捉 54%，加入 coverage 達 93%，誤報維持 0/64。
- **修復策略比較（Table 4）：** 在 55 個真實錯誤 episode 上，純粹重新採樣（plain resampling）僅有 16% 恢復率；僅指出失敗檢查項目而不給予答案的 `located` 策略恢復率達 45%（$p=0.0005$，每次修復平均耗費 6.4 次模型調用）；通用提示 `generic` 與具體提示 `specific` 均為 36%。經 Bonferroni 校正（$\alpha=0.01$）後，唯有 `located` 策略顯著成立。
- **整體淨效益：** 在全部 120 個 episode 的端到端核算中，`located` 修復將任務最終成功率從 52% 提升至 73%，成功挽救 25 個故障且未破壞任何原本正確的執行。

### 5. 結果四：有機非注入幻覺的負面結果

在 30 個高溫且非人工注入的自然執行中，產生了 11 個有機故障（7 個無預警中斷、3 個虛構計數、1 個錯誤檢索）。直接套用部署校準的行為監控器在有機故障上的 AUROC 僅有 0.31–0.42（顯著低於隨機），健康誤報率高達 36%。作者進一步進行的 55-episode 預註冊重複實驗僅觀測到 2 個幻覺樣本，因樣本數不足而**明確放棄提出任何通用文字幻覺偵測主張**。

相對地，決定性 completion check 精確捕捉了 7/7 個無預警中斷（0 誤報）；數值基礎驗證器在誘發語料庫中對 11 個未對齊輸入的偽造達到 0.55 偵測率。這證明了內容與事實錯誤必須交由專門的驗證機制，而非寄望於通用行為監控器。

## 證據地圖 / Evidence map

為了防止技術宣稱被過度泛化，我們將論文的各項結論劃分為四個明確的證據層級：

| 分類層級 / Dimension | 具體項目與證據錨點 | 工程涵義與詮釋邊界 |
| --- | --- | --- |
| **論文直接證據** / **Direct paper evidence** | Table 1 (遙測特徵 43→51→60 維)、Table 3 (決定性驗證 60%~96% 覆蓋, 0/63 誤報)、Table 4 (`located` 修復使成功率 52%→73%)、Figure 1 (CUSUM 殘差軌跡)、Figure 2 (類別覆蓋率)、Figure 5 (混合決策邊界)。 | 在受控 mock 與 real 工具任務下，分層控制迴路有效；時間監控對 looping 與 cascade 靈敏，決定性檢查對合約與數值具備極高可靠度。 |
| **作者因果解讀** / **Author causal claim** | 認為 ESN 儲層動力學能有效沉積跨步時間關聯；認為 `located` 策略透過告知失敗約束而非直接灌輸答案，保留了模型的自主推理空間。 | 解讀合乎理論預期；但消融實驗顯示將相同通道最大包裝給予 GRU 亦可達 0.873 AUC，顯示增益多數來自通道獨立池化與校準門檻，而非 ESN 本身全面超越其他序列模型。 |
| **論文未證明** / **Unsupported claims** | 未證明可跨部署通用免校準監控（未校準轉移 AUC 跌至 0.527）；未證明能可靠捕捉所有文字與事實幻覺（有機故障 AUC 僅 0.31-0.42）；未證明工具本身徹底損毀或不可逆外部操作可由 rollback 修復。 | 生產環境切勿宣稱「零誤報的通用 Agent 防護網」；無健康軌跡校準時不可上線；不可逆外部副作用（如已發送郵件或扣款）無法回滾。 |
| **Bloss0m 工程化整理** / **Bloss0m engineering synthesis** | 將論文抽象為四層運行時控制面：(1) 遙測格式版本化 (2) 部署專屬健康校準 (3) 決定性合約硬性阻斷 (4) 帶狀態快照的定向回滾修復。 | 與 OSReward（事後評測）形成互補；在實務上應將行為監控視為低優先級分流訊號（triage），決定性驗證視為硬性阻斷門檻，LLM 審計視為高成本升級路徑（escalation）。 |

## Artifact 與可重現性 / Artifacts and reproducibility

截至 **2026-08-07**，作者提供的公開資源與驗證狀態如下：

- [GitHub 官方程式庫](https://github.com/sunnydubey1111/agent-trajectory-sentinel)：程式庫公開可存取，內含 `README.md`、鎖定的依賴配置檔、完整源碼、軌跡數據、`DATA_CARD.md`、`REPRODUCE.md`、主張帳本（Claims ledger）與各項復現腳本，採用開放的 MIT 授權條款。
- [Hugging Face 語料數據集](https://huggingface.co/datasets/sunnydubey1111/agent-trajectory-sentinel)：端點在檢驗時運作正常，提供 Parquet 格式的 2,823-episode 完整語料庫，授權標註為 `mixed-see-licensing`。其包含的模型輸出、維基百科與氣象資料受各自上游授權約制。
- [Hugging Face Spaces 互動展示](https://huggingface.co/spaces/sunnydubey1111/agent-trajectory-sentinel-demo)：端點在檢驗時標記為 `Running`，展示介面正常在線；這代表展示服務端點可存取，並非獨立全量重現實驗。
- [示範影片 Walkthrough](https://youtu.be/a05n_000klE)：YouTube 簡報與操作影片，屬於輔助說明材料。

**可重現性範圍與限制：**
本文未重跑完整 live benchmark，實驗數據採用作者報告結果。最小的離線可重現範圍是在固定的 CPU 環境下運行合成實驗、驗證研究與修復策略重新分析，並將結果表格對照回 `CLAIMS.md`。涉及本機 Ollama（Qwen/Llama）或 Gemini API 的即時呼叫屬於條件式重現，依賴外部模型權限與環境算力。

此外，Data card 記錄在 2,056 次收集嘗試中有 512 次被 acceptance gate 丟棄（總淘汰率達 24.9%），顯示生產部署時資料清洗與採樣門檻對重現性至關重要；外部 AFTraj-2K 與 ATBench 僅為下載評測使用，並未重新散布。

## Bloss0m 工程判斷與不適用條件 / Bloss0m engineering judgment and when not to use it

基於對論文數據與限制邊界的深入分析，我們提出以下工程落地判斷：

### 推薦採用場景（Recommended adoption）

1. **在高風險工具旁部署決定性合約守門（Deterministic Invariants）：**
   針對具有明確格式或數值關係的工具調用（如金融交易、數據庫更新、報表彙整），直接部署 `tool_contract` 與 `total_consistency` 檢查。這類檢查具備 0 誤報率與極低開銷，應作為第一道不可妥協的硬性防線。
2. **長步驟 Agent 的行為異常分流（Telemetry Triage）：**
   在步驟較長（$\ge 5$ 步）的複雜工作流中，以 ESN-CUSUM 作為毫秒級監控哨兵，及早捕捉死迴圈、重試雪崩或目標偏離，僅在異常累積時才啟動高階審計或人工介入，避免每步呼叫 LLM judge 的巨大浪費。
3. **具備明確事務快照能力的沙盒環境：**
   工作流具備乾淨的資料獲取檢查點（fact-gathering checkpoint），在發生工具報錯或 schema 違規時，可乾淨回滾局部上下文。
4. **定向約束提示修復（Located Prompt Repair）：**
   告警後切忌盲目重複採樣，亦不宜直接將標準答案塞入 prompt；應採用 `located` 策略，具體指出「哪一項合約未滿足」，讓模型保有上下文自主演繹修復路徑。

### 嚴格不適用條件與禁忌（When NOT to use it）

1. **未建立基準健康軌跡的新環境（Cold start）：**
   跨模型或未校準環境下的誤報率高達 75%（AUROC 0.527），在未收集目標環境充足健康軌跡前，絕對不可直接啟用統計監控器。
2. **不可逆外部副作用（Irreversible external actions）：**
   涉及發送外部郵件、發起真實扣款、刪除外部資源等不可逆操作，無法透過 rollback 撤銷。此類操作必須依賴事前人工確認（Human-in-the-loop），而非事後回滾。
3. **單純依賴監控器捕捉文字事實幻覺：**
   若模型生成了看似合邏輯但數值完全偽造的內容，只要行為動態未顯著改變，行為監控器在原理上完全不可見；必須仰賴外部事實查核（fact-checking）或檢索對齊機制。
4. **極短軌跡任務（$\le 3$ 步）：**
   ESN 儲層無法在極短步驟內累積足夠的時間殘差，此時時間監控器相比簡單的單步距離度量毫無優勢。

本架構與 [OSReward 的跨平台 agent outcome evaluation](/paper-reading/08-osreward-agent-evaluation/) 形成互補：OSReward 聚焦於任務結束後「如何評估整個 trajectory 是否合格」，而本文聚焦於執行中「如何及早發現 trajectory 正在崩潰並局部修復」。若要進一步將防護面延伸至對抗惡意指令注入，可參考 [Indirect Prompt Injection（2023）](/paper-reading/42-indirect-prompt-injection/)；若需融入企業級生產治理架構，請參閱 [Enterprise Agentic AI Governance](/blog/39-enterprise-agentic-ai-governance/) 與 [Enterprise AI Agent Security](/blog/43-enterprise-ai-agent-security/)。

## 讀完後的三個記憶點 / Three things to remember

1. **技術思想（Technical idea）：** Agent 的可靠性來自運行時分層控制迴路——輕量時間監控器負責捕捉動態行為偏移，決定性驗證器負責嚴格守護資料合約，狀態檢查點與定向提示則實現低成本的高效修復。
2. **核心證據（Evidence）：** 在 2,823 個 episode 上，ESN-CUSUM 在 5% 誤報預算下達到 0.707 偵測率與 0.872 AUROC；決定性檢查以 0/63 誤報捕獲高達 96% 失敗；`located` 修復策略顯著將端到端任務成功率從 52% 提升至 73%（Table 3, 4）。
3. **實踐邊界（Boundary）：** 行為監控器無法跨部署免校準轉移（未校準 AUC 僅 0.527），且對內容層面的合理幻覺存在本質盲點；絕不能將其誤當成零誤報的萬能安全防護網。

## Primary sources

- [arXiv record：Real-Time Detection and Repair of LLM Agent Failures](https://arxiv.org/abs/2608.02464)：版本、作者、摘要與提交詮釋資料。
- [arXiv HTML full paper v1](https://arxiv.org/html/2608.02464v1)：§3–§11、Figures 1–5、Tables 1–5、限制與附錄。
- [arXiv PDF v1](https://arxiv.org/pdf/2608.02464v1)：完整 16 頁預印本。
- [Official artifact repository](https://github.com/sunnydubey1111/agent-trajectory-sentinel)：程式碼、軌跡數據、評測結果、Data card、重現記錄與主張證據帳本（Claims ledger）。
- [Dataset](https://huggingface.co/datasets/sunnydubey1111/agent-trajectory-sentinel) · [Live demo](https://huggingface.co/spaces/sunnydubey1111/agent-trajectory-sentinel-demo) · [Walkthrough](https://youtu.be/a05n_000klE)：作者列出的主要 Artifact 端點。
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)：本文引用之 arXiv 圖表授權條款；儲存庫程式碼依 MIT 授權，第三方資料依各自條款約束。
