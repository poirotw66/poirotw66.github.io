---
title: "PAST-Bench：Persistent Agent 真的從過去學會了什麼嗎？"
description: "深讀 PAST-Bench 如何用 fresh-session task families、matched persistence controls 與 trace-level mechanism evidence，分辨 Agent 變好是因為保留經驗，還是只是分數變高。"
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "PAST-Bench 把『持久 Agent 是否會進步』改寫成可歸因的 longitudinal evaluation：26 個 task families、204 個 episodes，分成 Memory、Procedural Reuse、Information Gathering、Update 四種能力。"
  - "Persistence-on 與 persistence-off 在 fresh session、相同 prompt、grader、工具與 seed 下配對；因此 self-evolution gap Δ 比單次 task score 更接近保留狀態的效果，但仍不是因果證明。"
  - "Hermes+ 在 MiniMax-M2.7 上把平均 Δ 從 +0.13 提到 +0.15、Mech 從 0.64 提到 0.73；這個 +0.02 小於三次 run 的變異，最清楚的增益在 Update。"
  - "這篇論文證明的是『跨 session 的行為改進可以被測量與診斷』，不是已經證明 recursive self-improvement、企業 Agent 泛化，或某個 memory architecture 必然更好。"
audience:
  - "正在設計 persistent agent、memory、skill 或 workspace state 的 AI 工程師。"
  - "需要建立 longitudinal evaluation harness，並想把 task score 與機制證據分開的研究與平台團隊。"
tags: ["Paper Reading", "AI Agent", "Evaluation", "Agent Memory", "Benchmark", "Self-Improvement"]
image: "/paperReading/16-past-bench-recursive-self-improvement/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-memory-adaptation
paper:
  title: "PAST-Bench: Benchmarking the Foundations of Recursive Self-Improvement in Personal Agents"
  authors:
    - "Shuhan Xue"
    - "Zixin Ding"
    - "Yichen Shen"
    - "Yinjie Wang"
    - "Zhenfei Yin"
    - "Yingcheng Wu"
    - "Yuxin Chen"
    - "Mengdi Wang"
    - "Ling Yang"
  year: 2026
  venue: "arXiv 2608.04003 v1 (cs.CL preprint)"
  links:
    pdf: "https://arxiv.org/pdf/2608.04003v1"
    arxiv: "https://arxiv.org/abs/2608.04003"
    code: "https://github.com/Gen-Verse/PAST-Bench"
series:
  id: "agent-evaluation"
  title: "Agent 評測"
  part: 4
  totalParts: 4
---

## 90 秒掌握論文 / The paper in 90 seconds

- **問題 / Problem：** 當持久化 Agent 在後續任務得分提高時，工程師很難分辨進步是來自真正保留與取用先前的經驗，還是來自基礎模型本身的通用能力、Prompt 提示詞線索、不可逆的殘留上下文、任務難度波動或評分噪音。
- **核心洞見 / Core insight：** PAST-Bench 把跨 session 自我進化轉化為嚴格受控的歸因實驗：在完全清空 volatile context 的全新 session 中，固定 prompt、grader、工具鏈與隨機 seed，僅切換 persistence-on 與 persistence-off 存取權限，同時度量行為層級的分數差（$\Delta$）與 trace 級機制一致性證據（Mech）。
- **最強證據 / Strongest evidence：** 在 26 個 task families、204 個 synthetic episodes 與 7 個主流基礎模型評測中，persistence-on 普遍取得正向平均分數差（$\Delta$ 介於 +0.13 至 +0.24）；但在相同模型與相同 $\Delta = +0.13$ 下，nanobot 與 Hermes 的機制證據分（Mech）分別為 0.57 與 0.64，證明高分不等於正確遵循記憶機制（Table 2、Table 3、Figure 10）。
- **主要邊界 / Main boundary：** benchmark 中的任務全由研究團隊人工合成，不代表真實使用者的長程工作分佈；以診斷為導向的 Hermes+ 總分提升僅 +0.02（從 +0.13 到 +0.15），小於 run-to-run 隨機變異，且在不同機制組合間存在負向干擾。

本文依據 Shuhan Xue 等人於 2026-08-04 提交之 arXiv v1 preprint（[arXiv:2608.04003v1](https://arxiv.org/abs/2608.04003)）；文中正文、圖表與數據均依據該版本。作者探討的「在線自我進化（online self-evolution）」是指 Agent 跨 session 保存偏好、程序或修改規則，並在後續任務中取用，這比完整遞迴自我改進（recursive self-improvement, RSI）窄了一層，但更切合當前 personal agent 的工程落地層次。

## 理解前需要知道什麼 / What to know first

在評估自主代理人（AI Agent）是否能夠從長期經驗中學習時，必須先釐清持久化狀態的定義與評測中的混淆變因。

### 1. 持久化 Agent 與無狀態 Agent

傳統無狀態 Agent 在每一次對話結束後便重置所有狀態。持久化 Agent（Persistent Agent）則不依賴微調模型權重，也不靠將無上限的歷史對話塞入超長 Prompt，而是將使用者偏好（preferences）、標準作業程序（SOP / skills）、環境配置或權威規則寫入外部持久化基質（persistence substrate，例如鍵值存儲、向量資料庫、結構化檔案或技能庫）。在未來的會話中，Agent 需自主檢索並套用這些狀態。

### 2. 歸因困境（The Attribution Problem）

如果一個 Agent 在第二天的任務中表現得比第一天更好，這份進步究竟來自哪裡？在多會話（multi-session）評測中，至少存在四種混淆來源：
1. **基礎模型能力（Base Model Prior）：** 模型自身擁有的世界知識或零樣本推理能力足以解決問題，無需依賴記憶。
2. **提示詞引導（Prompt Leakage / Trigger Overlap）：** 評測 Prompt 不自覺給出了過多線索，使 Agent 不需要回查歷史也能命中答案。
3. **揮發性上下文洩漏（Volatile Context Leakage）：** 系統若未在跨 session 時徹底清空對話緩衝區，Agent 只是在做標準的上下文學習（in-context learning），而非跨會話檢索。
4. **評測波動與評審器偏置（Grader Noise）：** 單次任務得分的起伏可能僅是 LLM judge 的隨機波動。

### 3. 既有方法為何不足（Why previous approaches are insufficient）

過去的評測方法難以提供可靠的歸因支持：
- **傳統單次基準測試（如 SWE-bench、GAIA）：** 專注於單一封閉 episode 的任務執行，根本沒有跨 session 的時間維度，無法測試經驗的累積與修改。
- **傳統記憶檢索基準測試（如 Needle-in-a-Haystack、長文本 QA）：** 僅測量靜態文本召回率（retrieval accuracy），脫離了真實 Agent 的行動迴圈，無法回答 Agent 是否會在正確時機觸發檢索、能否抵抗過期資訊干擾，以及能否將取回的狀態落實為工具調用。
- **未受控的跨輪次對話測試：** 往往缺乏嚴格的消融對照組（matched ablation control），直接將最終得分當作自我改進的證據，把「結果變好」與「因持久化狀態而變好」混為一談。

## 核心直覺 / Core intuition

評估 Agent 是否真正自我進化，需要從根本上翻轉決策準則。

過去的方法採用單純的結果比對準則：**「如果 Agent 在第 $N$ 次會話的得分高於第 1 次，就宣稱 Agent 透過記憶自我提升。」** 這個推論忽略了所有上述混淆變因。

PAST-Bench 提出的全新決策準則是嚴格的**雙軌歸因控制**：
1. **控制組隔離度量（$\Delta$）：** 測試必須在完全清空 volatile context 的全新 session（fresh session）中進行。在相同 prompt、相同工具、相同 grader 與相同隨機 seed 下，平行執行兩條分支：允許讀取歷史狀態的 **persistence-on**，以及被遮蔽存取的 **persistence-off**。兩者的得分差距記為持久化差距 $\Delta_f$。
2. **執行軌跡合約檢驗（Mech）：** 僅有正向 $\Delta_f$ 仍不夠。系統還必須檢查 Agent 的執行軌跡（trace），檢驗其是否真的遵照合約在正確時機寫入目標 substrate、在行動前發起檢索、正確套用最新規則並排除過期舊規則。

只有當「外部任務得分提升（$\Delta_f > 0$）」與「內部機制合約吻合（高 Mech）」同時成立時，才能確立該項進步是由持久化經驗驅動。

> **花花的工程提醒**
>
> 把「下一個 session 得分更高」和「因為讀了昨天寫入的狀態而得分更高」拆開量。前者是結果，後者才接近可歸因的改進。

## 用一個例子走完整個方法 / Walk one example through the method

我們以 PAST-Bench 中的典型任務家族 —— **規則更新任務家族（Update Task Family）** 為例，逐步走完整個方法流程（對應論文 Figure 4–8 與 Appendix A.3 結構）：

1. **輸入與冷啟動（Cold episode）：**
   - *場景：* Personal Agent 協助使用者處理日常報表匯出。
   - *執行：* 在完全沒有任何歷史記錄的情況下，系統發布基準任務。Agent 依賴底座模型的預設行為執行，確立該任務家族的冷啟動校準基準（calibration score）。
2. **學習寫入（Learn episode）：**
   - *場景：* 使用者向 Agent 表明：「從今天起，所有財務數據匯出請使用格式規範 v1，並發送至內部 API 端點 `/v1/reports`。」
   - *中間表示：* Agent 調用記憶寫入工具，在 persistent memory 中生成鍵值條目 `export_format: v1, target_endpoint: /v1/reports`。
3. **授權更新（Update episode）：**
   - *場景：* 數個會話之後，系統發布權威變更通知：「內部系統已遷移，即日起全面廢棄端點 `/v1/reports`，改為使用 `/v2/analytics`，且匯出格式統一調整為 Parquet。」
   - *決策轉換：* Agent 必須辨識出這是針對舊規則的權威覆蓋，並在持久化基質中執行覆寫操作，將舊端點標註為過期（stale），並寫入新規格。
4. **全新測試與決策轉換（Fresh evaluation episode）：**
   - *執行環境：* 徹底清除對話記憶體，啟動一個全新獨立的 session。評測 Prompt 故意抽離了具體的規格提示（例如只發出弱提示：「請為我匯出昨天的財務報表」）。
   - *分支對照：*
     - **Persistence-on 分支：** Agent 自主判斷需要外部上下文，向持久化基質發起查詢，成功檢索出 `/v2/analytics` 與 Parquet 規格，主動拒絕過期的 `/v1/reports`，調用工具完成請求。
     - **Persistence-off 分支：** 系統攔截該家族的持久化基質存取，Agent 無法檢索先前經驗，只能退回零樣本推斷或要求使用者提供格式。
5. **輸出與失敗模式診斷（Likely failure points）：**
   - *評分計算：* 雙方在相同評審器（MiniMax-M2.7）下計算任務得分 $s_e$。
   - *軌跡診斷：* 檢查 trace 記錄。常見的失敗模式包括：Agent 拿了高分但根本沒觸發檢索（評審器寬容或基礎知識命中）；或者檢索到了新規則，但舊的過期端點仍然混在生成的 Payload 中（污染率 pollution rate 升高）。Mech 指標會立刻抓出此類偽成功。

## 技術機制 / Technical mechanism

PAST-Bench 的技術核心由四大能力維度、嚴密的任務家族時序架構，以及數值化評估指標所構成。

### 1. 四種能力維度與套件劃分（4 Capabilities, 26 Families, 204 Episodes）

評測套件將持久化自主進化拆解為四項關鍵跨 session 能力，涵蓋 26 個合成任務家族、共 204 個 episodes（數據源自 Appendix A.1 Table 7，分佈可見 Figure 2）：

| 能力類別 (Capability) | 家族數 (Families) | 集數 (Episodes) | 核心評測問題 |
| :--- | :---: | :---: | :--- |
| **Memory** | 5 | 41 | 能否在弱提示下保存並精準喚起使用者的偏好、約束、歷史案例與特例？ |
| **Procedural reuse** | 8 | 64 | 能否將 SOP、多步驟工作流程或腳本轉化為未來可重新執行的自定義技能？ |
| **Information gathering** | 6 | 48 | 在採取不可逆行動前，能否主動查找已儲存但未出現在當前 Prompt 的證據？ |
| **Update** | 7 | 51 | 當權威新規則到達時，能否正確覆寫舊資訊並防止過期狀態（stale state）洩漏？ |

![PAST-Bench Figure 2：四種能力與 26 個 task families、204 個 episodes 的分配](https://arxiv.org/html/2608.04003v1/assets/figure2_suite_distribution.png)

*Figure 2。這張圖用能力與子 family 的比例呈現 benchmark coverage。Source: Xue et al., PAST-Bench, §3 / Figure 2（[figure anchor](https://arxiv.org/html/2608.04003v1#S3.F2)）；直接重用 arXiv HTML 圖片，依 arXiv.org perpetual non-exclusive license 標示來源。*

這種拆分的工程價值在於：Update 不只看 Agent 是否讀到了新規則，還嚴格審查產物中是否殘留舊值；Information Gathering 則獨立診斷「未經核實即盲目行動」的過度自信失誤。

### 2. 任務家族的時序生命週期

每個任務家族內部具備嚴謹的時序結構：
- **Cold：** 初始接觸，量測零先驗基準，建立 calibration 與 headroom。
- **Learn：** 暴露目標知識條款、操作流程或事實線索，寫入評測管線管理的持久化 substrate。
- **Update：** （僅在 Update 家族）提供具備更高權威的二次寫入，檢驗覆蓋能力。
- **Evaluation：** 清空 volatile context，在新 session 中移除強觸發引導詞，要求 Agent 自主找回並應用狀態。
- **Controls：** 注入無保留（no-retention）、干擾項（distractor）、過期項（stale）以及錯誤基質（wrong-mechanism）等對照組，檢驗 Agent 是否僅是靠表層捷徑獲利。

### 3. 度量指標與數學公式

#### 持久化分數差（Persistence Gap）
對特定任務家族 $f$，持久化分數差定義為：

$$
\Delta_f = S_f^{\mathrm{w/}} - S_f^{\mathrm{w/o}}
$$

其中 $S_f^{\mathrm{w/}}$ 與 $S_f^{\mathrm{w/o}}$ 分別代表 persistence-on 與 persistence-off 條件下 evaluation episodes 的平均任務得分。能力層級先對所屬家族進行宏平均（macro-average），總分 Overall $\Delta$ 再對四項能力取算術平均。

#### 單集任務得分（Episode Task Score）
每個 episode 的得分計算如下：

$$
s_e = \sigma_e \times (0.80c_e + 0.20r_e)
$$

其中 $c_e \in [0, 1]$ 為任務完成度（completion），$r_e \in [0, 1]$ 為工具調用錯誤恢復率（recovery rate），而 $\sigma_e \in \{0, 1\}$ 為安全守門機制（safety gate）。若 Agent 觸犯安全禁忌，該集總分將被一票否決歸零。每個 episode 重複執行三次獨立 trial，當機或缺失記錄均按 0 分計（[Appendix B.1](https://arxiv.org/html/2608.04003v1#A2.SS1)）。

#### 機制證據評分（Mechanism-evidence Score, Mech）
為了度量 Agent 是否真實經由預期路徑獲利，論文定義了綜合遙測指標 Mech：

$$
\mathrm{Mech}_f = \frac{1}{5}(\mathrm{wp} + \mathrm{ra} + \mathrm{uc} + \mathrm{rh} + (1 - \mathrm{pr}))
$$

各成分分別對應：寫入精確率（write precision, $\mathrm{wp}$）、檢索取回率（recall accuracy, $\mathrm{ra}$）、更新正確率（update correctness, $\mathrm{uc}$）、保留跨度（retention horizon, $\mathrm{rh}$）以及產物污染率（pollution rate, $\mathrm{pr}$）。Mech 評分介於 0 到 1 之間，反映執行軌跡與預期合約的一致程度（[Appendix B.3](https://arxiv.org/html/2608.04003v1#A2.SS3)）。

### 4. 實驗環境與基準設定

- **基礎模型：** 涵蓋 7 款主流大模型：GLM-5.1、Kimi K2.6、DeepSeek-V4-Pro、MiniMax-M2.7、GPT-5.4、Claude Sonnet 4.6 與 Claude Opus 4.6。
- **Agent 框架：** 固定以 MiniMax-M2.7 作為基線模型，橫向對比 nanobot、ZeroClaw、Agent-Zero、Hermes，以及作者提出整合五大執行環節修補的 Hermes+。
- **評審器校準：** 主要評審器採用 MiniMax-M2.7（temperature 0，最大輸出 8,192 tokens）。作者透過 48 個盲測樣本（四項能力各 12 個）與人類專家比對：人類之間完全一致率為 83.3%，評審器與人類均值差距在 $\pm 0.25$ 以內達 68.8%、在 $\pm 0.5$ 以內達 91.7%（[Appendix B.4](https://arxiv.org/html/2608.04003v1#A2.SS4)）。
- **推論算力與成本開銷：** 依據 Table 12 報告之每集平均數據，Base Hermes 搭配 MiniMax-M2.7 消耗 12,615 tokens、耗時 70.5 秒；Hermes+ 消耗 31,859 tokens、耗時 77.4 秒。額外的保護與路由機制使 token 消耗上升至約 2.5×，但端到端 wall-clock 僅增加約 1.10×（[Appendix D.6](https://arxiv.org/html/2608.04003v1#A4.SS6)）。

## 實驗如何讀 / How to read the evidence

解讀 PAST-Bench 的實驗結果時，必須同時檢驗外部任務增益與內部機制證據，並嚴肅看待不同能力間的不均勻性與隨機變異。

### 1. 持久化狀態普遍帶來增益，但能力分佈高度不均勻（Table 2）

- **核心問題：** 賦予持久化狀態是否能全面、穩定地提升各類大模型的跨 session 表現？
- **實驗控制：** 固定 Hermes 框架，在 7 個主流大模型上分別執行 persistence-on 與 persistence-off 評測。
- **實驗觀察：** Table 2 顯示，所有 7 款模型的 Overall $\Delta$ 均為正值，範圍介於 +0.13 至 +0.24。GPT-5.4 達到最高增益（Overall $\Delta = +0.24$），GLM-5.1 達到 +0.20，MiniMax-M2.7 為 +0.13。然而，深入檢視四項能力會發現增益分佈截然不同：GPT-5.4 的優勢高度集中在 Memory（+0.37）與 Update（+0.34）；GLM-5.1 的突破主要在 Update（+0.36）；Kimi K2.6 的表現則集中在 Memory（+0.33）。
- **解釋與邊界：** 宏觀總分會掩蓋模型本質特性的差異。某些模型擅長精準覆寫舊知識，某些模型擅長在弱提示下捕捉記憶，盲目追求單一總分無法真實反映技術適配度。

### 2. 歸因前沿：相同分數差背後可能隱藏完全不同的機制完整度（Table 3、Figure 10）

- **核心問題：** 不同的 Agent 框架獲得相同的任務分數提升，是否代表它們都遵循了預期的持久化機制？
- **實驗控制：** 固定基礎模型為 MiniMax-M2.7，在相同評測套件下比對 nanobot、ZeroClaw、Agent-Zero、Hermes 與 Hermes+。
- **實驗觀察：** Table 3 呈現了劇烈的歸因分歧：

| 框架 (Framework) | 總體分數差 (Overall $\Delta$) | 機制證據分 (Mech) | 關鍵現象解讀 |
| :--- | :---: | :---: | :--- |
| **nanobot** | +0.13 | 0.57 | 總增益與 Hermes 完全相同，但機制一致性明顯較弱，且 Procedural reuse 退步（-0.06）。 |
| **ZeroClaw** | +0.12 | 0.55 | 增益主要集中於 Memory（+0.29），在 Procedural reuse 上出現倒退（-0.04）。 |
| **Agent-Zero** | -0.08 | 0.39 | 引入持久化反而出現負效果，Memory、Info、Update 全面退步，顯示不良機制會劣化行為。 |
| **Hermes** | +0.13 | 0.64 | 四項能力均呈正向，機制分數與行為提升維持合理對齊。 |
| **Hermes+** | +0.15 | 0.73 | 平均差距與機制證據均最高，但在 Procedural reuse 上輕微倒退（-0.02）。 |

![PAST-Bench Figure 10：固定 MiniMax-M2.7 時的 agent attribution frontier](https://arxiv.org/html/2608.04003v1/assets/figure_agent_attribution_frontier.png)

*Figure 10。x 軸是 Overall persistence gap，y 軸是 mechanism evidence；同樣的 $\Delta$ 可以對應不同的機制證據。Source: Xue et al., Appendix D.3（§A4）/ Figure 10（[figure anchor](https://arxiv.org/html/2608.04003v1#A4.F10)）；直接重用 arXiv HTML 圖片，依 arXiv.org perpetual non-exclusive license 標示來源。*

- **解釋與邊界：** 如 Figure 10 所示，nanobot 與 Hermes 位於相同的 x 軸位置（$\Delta = +0.13$），但 y 軸的 Mech 評分卻存在實質差距。這說明單憑任務成功率無法排除 Agent 是靠投機捷徑或評審器漏洞獲利。

### 3. Hermes+ 診斷修補：Update 顯著改善，但面臨負向干擾與隨機變異挑戰（Table 4、Table 5、Figure 9、Table 11）

- **核心問題：** 針對執行軌跡中的具體失敗模式設計專屬修補機制，能否實現能力的線性疊加？
- **介入機制設計：** 作者提出五項針對性介入（E1 Plan：規劃前檢查狀態；E2 Render：結構化綁定當前有效值；E3 Route：技能排序與熱修復；E4 Gate：行動前強制檢索；E5 Close：會話結束時同步抽取與落盤）。
- **實驗觀察：**
  - **單機制消融（Table 4 與 Figure 9）：** 各機制在對應維度展現明確針對性，E3 帶來 Procedural $\Delta = +0.10$、E4 帶來 Info Gathering $\Delta = +0.17$、E5 帶來 Update $\Delta = +0.16$。
  - **完整組合的代價：** 當五項機制組合成 Hermes+ 時，Update 展現了最強增益（$\Delta$ 達 +0.24），但在 Procedural reuse 上卻反而退步至 $\Delta = -0.02$。
  - **機制互動干擾（Table 5）：** 針對 Procedural 的消融分析顯示，Base Hermes 的分數差為 +0.087，Hermes+ 為 +0.085；但當移除 E2 Render 時，分數差反而上升至 +0.108。這證實了強加的結構化渲染機制會干擾技能路由的執行彈性。

![PAST-Bench Figure 9：單一機制與完整 Hermes+ 的 capability-level persistence gap ablation](https://arxiv.org/html/2608.04003v1/assets/figure_ablation_heatmap.png)

*Figure 9。E3、E4、E5 分別在 Procedural、Information Gathering、Update 上有較明顯的 single-mechanism gap；full Hermes+ 在 Update 最突出。Source: Xue et al., Appendix D.1（§A4）/ Figure 9（[figure anchor](https://arxiv.org/html/2608.04003v1#A4.F9)）；直接重用 arXiv HTML 圖片，依 arXiv.org perpetual non-exclusive license 標示來源。*

- **隨機變異反證（Appendix D.5 / Table 11）：**
  最關鍵的反面證據來自重複運行的統計變異：Hermes 的整體分數差為 $0.13 \pm 0.04$，Hermes+ 為 $0.15 \pm 0.06$。兩者之間 +0.02 的總分提升完全小於三次運行的隨機變異範圍！此外，在 Update 能力上，雖然平均增益由 0.12 翻倍至 0.24，但標準差也從 0.01 激增至 0.09。因此，不能將 Hermes+ 宣稱為具備統計顯著優勢的通用架構。

> **花花的工程提醒**
>
> Mech 比較像「路徑有沒有留下證據」的 telemetry 指標，不是因果估計。要問必要性，還得刪除、替換或污染候選 artifact，再測行為是否隨之改變。

## 證據地圖 / Evidence map

為了確保學術主張與工程實踐的界線清晰，我們將論文的論證拆解為四個嚴格分離的層次：

### 論文直接證據 / Direct paper evidence

- 在作者設計的 26 個合成任務家族與 204 個 episodes 評測中，persistence-on 與 persistence-off 的配對比較在 7 個主流大模型上均量測到正向的 Overall $\Delta$（介於 +0.13 至 +0.24 之間，[§4.1–§4.2](https://arxiv.org/html/2608.04003v1#S4)）。
- 相同的任務分數提升可能對應不同的內部機制保真度：nanobot 與 Hermes 達到相同的 $\Delta = +0.13$，但 Mech 分別為 0.57 與 0.64，且 nanobot 在程序重用能力上為負向（[Table 3](https://arxiv.org/html/2608.04003v1#S4.T3)）。
- Hermes+ 的 Plan、Render、Route、Gate、Close 五項介入在單機制消融中確實對應到特定能力的改善，組合後在 Update 維度取得最大正向增益（$\Delta = +0.24$，[Table 4、Figure 9](https://arxiv.org/html/2608.04003v1#S4.SS3)）。
- 運行變異測試顯示，Hermes+ 相較於 Hermes 的總分提升（+0.02）小於三次獨立 trial 的標準差（Hermes $0.13 \pm 0.04$ vs Hermes+ $0.15 \pm 0.06$，[Appendix D.5 / Table 11](https://arxiv.org/html/2608.04003v1#A4.T11)）。

### 作者因果解讀 / Author causal claims

- 作者認為 PAST-Bench 與 Hermes+ 提供了研究個人 Agent 從單純「保留經驗」走向「系統性在線自我進化」的基礎設施（foundation）。
- 作者主張藉由 trace 級機制評分，開發團隊可以準確定位 Agent 究竟是在規劃、檢索、更新還是結束清理階段出現問題。
- *解讀保留：* 這裡的 foundation 應被嚴格限制在「評測與診斷工具」範疇，不代表論文證明了 Agent 已經掌握一般性的自我提升演算法；Hermes+ 亦是特化於該基準測試的診斷架構，而非通用最優解。

### 論文未證明 / Unsupported claims

- **未證明遞迴自我改進（RSI）：** 論文沒有證明 Agent 具備自我修改模型底層程式碼、自我優化訓練演算法或無限遞迴自我提升的能力。
- **未證明真實使用者分佈泛化：** 所有 26 個任務家族均為人工編造的合成場景，論文未包含任何真實企業或消費級使用者的長程行為資料（Appendix A.2 明確標註）。
- **未證明 $\Delta$ 為純粹因果效應：** 儘管設計了嚴格的配對消融，作者自身明確將其定性為「強設計控制（strong design control）」，而非嚴格的因果推斷（causal proof）。
- **未證明 Hermes+ 在生產環境全面領先：** 各框架適配器保留了各自原生 context 截斷與管理策略，且 Hermes+ 帶來了 2.5× 的 token 成本開銷與未經統計檢驗的邊際收益。
- **未證明黑盒系統可完整計算 Mech：** Appendix C.3 指出，若外部 Agent 無法輸出標準化的持久化事件與產物日誌，評測管線將無法生成 Mech 分數。

### Bloss0m 工程化整理 / Bloss0m engineering synthesis

- **生產級記憶評測合約：** 在企業 Agent 系統中驗證記憶模組時，單純統計對話滿意度是無效的；必須落地「同一任務的 on/off 平行測試、持久化檔案前後 diff、檢索調用 telemetry、外部真實執行結果」四大觀測點。
- **反事實干擾測試（Counterfactual Checks）：** 要證明 Agent 是「因為記憶而變好」，必須主動執行干擾實驗——在記憶庫中注入陳舊資料或替換目標檔案，觀察 Agent 是否相應產生預期的錯誤。

## Artifact 與可重現性 / Artifacts and reproducibility

截至 **2026-08-09**，官方 [Gen-Verse/PAST-Bench repository](https://github.com/Gen-Verse/PAST-Bench) 於 GitHub 公開可存取，依據 Apache-2.0 授權條款開源，倉庫內包含核心評測代碼 `src/past_bench`、任務資料集 `self-evolve-tasks-v2`、環境設定、模擬外部服務以及單元測試套件。

但在重現性層面存在明確的外部相依性與限制：
1. **無開箱即用之 Checkpoint 或資料集頁面：** 倉庫未發布預打包的 Release 資產或 Hugging Face 資料集卡片，亦未提供離線預載權重。
2. **外部商業 API 依賴：** 評測框架依賴外部 LLM 提供商（包括 MiniMax、Zhipu、Kimi、DeepSeek 與 OpenAI）。完整重現實驗需要配置各家 API 憑證，並承擔對應的計費成本。
3. **執行環境要求：** 需要配置 Python 3.11+、`uv` 套件管理工具，並啟動 Docker 守護進程以構建各類工具與模擬沙盒映像檔。

**最小條件式重現建議：**
讀者若欲驗證評測機制的有效性，無須耗費鉅資重跑全量 204 個 episodes。可依照官方 README 搭建基礎環境，選取單一任務家族（例如偏好採納任務 `SM01_preference_adoption`），搭配 MiniMax-M2.7 執行命令並開啟 `--compare-no-persistence` 參數。評測完成後檢查輸出的 `sequence_results.json` 與 `sequence_comparison.json`，核對 persistence-on/off 的得分差與 trace 記錄。

本文未重跑完整基準測試，文中所引用的所有量化實驗數據均為原作者在論文中所報告之結果。

## Bloss0m 工程判斷與不適用條件 / Bloss0m engineering judgment and when not to use it

本節提出原創之工程架構總結與落地方案，並明確定義此評測範式的邊界。

### 最小可行歸因評測架構（Attribution Harness）

如果團隊正試圖為內部的 Agent 系統建構經驗累積評測，可參考下列精簡的受控架構：

```text
Task Family: Learn -> Fresh Session Evaluation -> Control Episodes
                 |                             |
          Persistence-on                Persistence-off
                 |                             |
        Artifact + Trace Events       Clean Baseline Run
                 \________ Paired Delta (Δ) _______/
```

在工程落地時，應按以下順序推進：
1. 先確保 session 邊界能徹底清空對話緩衝區，杜絕 in-context prompt propagation。
2. 實現持久化基質的開關隔離（persistence feature toggle）。
3. 建立檔案 diff 與工具調用 telemetry，度量寫入與檢索的吻合度。
4. 導入過期資訊（stale fixture）與干擾項，驗證 Agent 的更新與抗噪能力。

### 適合採用的情境

- **具備清晰會話邊界的 Agent 系統：** 每次任務重置上下文，依賴結構化記憶或外部文檔庫維持跨天工作。
- **需要排查記憶生命週期失誤的研發團隊：** 能清楚界定問題是發生在「未寫入」、「未取回」、「取回未套用」還是「未覆蓋舊資訊」。
- **具備完整可觀測性架構的平台：** 能精準記錄 Agent 的工具調用軌跡、檢索事件與檔案變更歷程。

### 不適用條件（什麼時候不要用）

- **缺乏乾淨會話隔離的持續長對話系統：** 若前一輪對話內容隨意流向後續輪次，$\Delta$ 將無法與上下文記憶區分，評測失去歸因意義。
- **單次封閉的確定性任務：** 若系統僅處理單次 SQL 查詢或代碼修復，且能由單元測試直接判定勝負，引入複雜的 Mech 評審器只會徒增成本與噪音。
- **企圖以合成評測外推至生產可用性：** PAST-Bench 的 26 個任務高度規範化，無法反映真實業務中模糊不清的意圖表達、多使用者並發修改衝突，以及數月尺度的概念漂移。
- **將 Overall $\Delta$ 當作單一上線指標：** 如實驗所示，總分的提升極易掩蓋關鍵維度（如 Procedural reuse）的嚴重退步，亦可能被特定模型的片面優勢所扭曲。

### 延伸閱讀路徑

讀者若欲將本文的評測視角與其他架構串聯，建議參考以下閱讀路徑：
- 探討持久化基質架構與超越單純向量 RAG 的實作：閱讀 [Beyond RAG for Agent Memory](/paper-reading/06-beyond-rag-for-agent/)。
- 探討如何防範評審器偏置與結果看似成功但實質違規的問題：閱讀 [OSReward](/paper-reading/08-osreward-agent-evaluation/)。
- 探討更逼近真實工程工作流的長程任務基準：閱讀 [ContextWeave](/paper-reading/09-contextweave-workflow-benchmark/)。
- 探討跨 trial 言語回饋與自我修正記憶機制：閱讀 [Reflexion](/paper-reading/27-reflexion-verbal-reinforcement/)。

## 讀完後的三個記憶點 / Three things to remember

1. **技術思想：** 後續任務得分提高不等於自我進化；必須結合清空 volatile context 的 matched persistence-off 控制組與 trace 級機制證據，才能判定進步是否真正來自保留經驗。
2. **實驗證據：** 跨 session 的能力改進極度不均勻；Hermes+ 的總分提升（+0.02）完全落在隨機變異範圍內，主要突破在 Update，且機制疊加時存在相互干擾。
3. **工程邊界：** PAST-Bench 證明的是「跨 session 的行為改善可以被精準診斷與量測」，而非「Agent 已具備遞迴自我改進」；評測基於人工合成環境，生產環境必須搭配反事實測試與真實成效檢驗。

## Primary sources

- [PAST-Bench arXiv abstract and version history](https://arxiv.org/abs/2608.04003)
- [PAST-Bench full HTML paper, v1](https://arxiv.org/html/2608.04003v1)
- [PAST-Bench PDF, v1](https://arxiv.org/pdf/2608.04003v1)
- [PAST-Bench official repository](https://github.com/Gen-Verse/PAST-Bench)
- [PAST-Bench Apache-2.0 license](https://raw.githubusercontent.com/Gen-Verse/PAST-Bench/main/LICENSE)
