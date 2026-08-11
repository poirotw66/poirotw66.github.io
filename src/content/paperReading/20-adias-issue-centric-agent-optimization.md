---
title: "ADIAS：把 Agent 自我改良改寫成可追蹤的問題修復"
description: "深讀 ADIAS：以持續的 issue state 組織跨回合失敗證據，讓 full-code agent optimization 能記住修過什麼、哪些介入失效，以及何時真的修好。"
pubDate: 2026-08-12
updatedDate: 2026-08-12
tldr:
  - "ADIAS 的核心不是再產生一個更好的 agent candidate，而是讓每個待修問題擁有穩定 ID、生命週期、證據與介入結果。"
  - "在五個互動式 benchmark、四個 backbone 與相同十回合預算下，ADIAS 的平均分數為 78.4，對最強 baseline DGM-H 的 62.6 高 25.2%；但這是論文內受控評估，不是 production superiority。"
  - "最重要的邊界是診斷與 issue association 沒有被獨立驗證，官方 repository 截至 2026-08-12 仍標示 Coming Soon，不能把論文的 code claim 當成可重現 artifact。"
audience:
  - "想設計 agent harness、自動修復或 regression-aware evaluation 的 AI 工程師"
  - "需要把 trajectory、介入結果與 rollback decision 串成可審計修復流程的技術主管"
tags: ["Paper Reading", "Agent Systems", "Evaluation", "AI Engineering", "Self-Improvement"]
image: "/paperReading/20-adias-issue-centric-agent-optimization/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
paper:
  title: "ADIAS: Automated Design of Interactive Agentic Systems"
  authors:
    - "Lekang Jiang"
    - "Bohan Tang"
    - "Stephan Goetz"
    - "Yiwen Guo"
  year: 2026
  venue: "arXiv 2608.06410 v1 (2026-08-03; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.06410v1"
    arxiv: "https://arxiv.org/abs/2608.06410"
    code: "https://github.com/scylj1/adias"
---

## 90 秒讀懂 / The paper in 90 seconds

- **問題**：自動化 agent design 通常以 candidate 為中心保存歷史。每一回合都重新閱讀候選程式、分數與 trajectory，卻沒有明確記住「同一個失敗是否已經修過、哪個介入有效、哪個改動造成 regression」。
- **核心直覺**：把被修復的 issue，而不是 candidate agent，變成跨回合的控制狀態。每個 issue 擁有穩定身份、priority、supporting evidence、lifecycle status 與 intervention-outcome history。
- **最強證據**：論文在 Tau-Bench、ALFWorld、TextCraft、WebShop、ScienceWorld 五個互動式環境比較 ADIAS 與五種 baseline；Table 1 的平均分數為 78.4，最強 baseline DGM-H 為 62.6。這些方法共用 task split、wrapper、action interface、scoring script、十回合 optimization budget 與每回合 15 個 training episodes（論文 Section 4、Table 1）。
- **主要邊界**：論文把 trajectory diagnosis 與 issue association 固定下來，沒有獨立測量診斷正確率；評估也限於文字型互動 benchmark。GitHub repository 的 README 仍是 Coming Soon，因此本文不把「paper 說有 code」等同於「讀者現在可重現」。

這篇的 bounded verdict 是：**持續的 repair state 是一個有用的 agent optimization control plane，但它把診斷錯誤與成本問題往系統外推，尚未證明可以安全地自動修改 production agent。**

## 先建立地圖 / What to know first

這裡的 agent harness 是包住 backbone model 的可執行系統：它決定如何讀 observation、規劃、呼叫工具、保留 memory、處理錯誤與結束任務。自動化設計則把 harness 當成可修改的 artifact，反覆執行「修改 → 評估 → 診斷 → 再修改」。

候選式方法的歷史 $H_t$ 可以包含每一代 agent、trajectory、分數與 diagnostic report，但仍以 candidate 為索引。ADIAS 額外維護 issue state $E_t$：它不是刪掉 archive，而是在 archive 上加一層以問題為索引的 repair ledger。這個區分也讓它和 [OSReward 的 agent evaluation protocol](/paper-reading/08-osreward-agent-evaluation)、[Agent Trajectory Sentinel 的 runtime repair](/paper-reading/14-agent-trajectory-sentinel) 形成互補：前兩者主要回答如何量測與偵測，ADIAS 問的是如何讓修復跨回合累積。

## 為什麼只保存 candidate 不夠 / Why the previous approach is insufficient

假設第 2 代 candidate 修好了 tool selection，卻讓 observation parsing 退步；第 6 代又修好 parsing，但沒有保留第 2 代的有效介入。若資料只按 candidate 排列，下一個 optimizer 得從一堆整體分數與長 trajectory 中猜出哪些局部變更值得保留。這會造成三個問題：

1. **repair targeting 低效**：仍然 active 的 issue、需要修改的部位與已嘗試過的方向散落在候選紀錄中。
2. **部分進展難以合併**：一個 candidate 同時影響多個 issue，單一介入的結果很難歸因。
3. **失效介入容易被帶回來**：optimizer 可能從最新或最高分 candidate 繼續，重複同一個錯誤方向。

這不是「歷史資料太少」的問題，而是 repair objective 沒有成為一級狀態。ADIAS 的 claim 是把這個狀態顯式化，能讓下一回合知道要修誰、從哪個 parent 繼續，以及哪些方向暫時不要再試。

## 核心直覺 / Core intuition

候選式流程的心智模型是：**從目前 archive 產生下一個整體更高分的 candidate**。ADIAS 改成：**從未解 issue 的狀態產生下一個更有可能推進修復的 candidate**。

每個 issue record 可寫成：

$$e_i^t=(id_i,q_i^t,s_i^t,\mathcal{B}_i^t,\mathcal{U}_i^t)$$

其中 $id_i$ 是跨 candidate 的穩定身份，$q_i^t$ 是 priority，$s_i^t$ 是 lifecycle status，$\mathcal{B}_i^t$ 是 trajectory 與診斷證據，$\mathcal{U}_i^t$ 是介入與結果的歷史。這個結構的 operational effect 是把「修復進度」從自然語言摘要變成下一個 decision 可以讀取的狀態。

![ADIAS Figure 2：初始化與 iterative optimization 的兩階段流程。](/paperReading/20-adias-issue-centric-agent-optimization/figure-2-adias-overview.png)

*Figure 2，論文 Section 3.3 的 ADIAS overview：外部 task prior 與初始 trajectory 先建立 issue state，再以 propose → modify → evaluate → diagnose → update 的 loop 迭代。[原始 figure](https://arxiv.org/html/2608.06410v1#S3.F2)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2608.06410v1/x2.png)。ADIAS 版本標示 arXiv.org perpetual non-exclusive license，未另外授予明確的再利用條款；本文保留 attribution，轉載前仍需確認 reuse permission。*

## 把一個失敗走過一遍 / Walk one example through the method

以下是論文 Figure 4 的 TextCraft 代表性 repair pattern；它是 paper evidence 的簡化說明，不是額外實驗：

1. **Input**：agent 收到一個需要取得指定數量資源的 crafting task，例如必須取得一單位 quartz。
2. **Intermediate representation**：執行 trajectory 顯示 agent 反覆選擇 `get quartz`，但環境需要的是帶數量的 `get 1 quartz`。Issue Manager 將這個 failure 與既有的 command-selection issue 關聯，而不是只把它記成某一代 candidate 的低分。
3. **Decision**：issue state 優先處理這個 active issue，並把過去嘗試過的 prompt restructuring、command matching 與 parent generation 一起交給 issue-guided planner。
4. **Output**：code optimizer 產生 focused full-code patch；下一輪重新執行環境，診斷結果與介入 outcome 回寫到同一個 issue。
5. **Likely failure point**：如果 diagnosis 把數量錯誤誤判成另一個 planning issue，stable identity 會讓錯誤被跨回合累積；這正是論文沒有獨立評估的風險。

## 方法骨架 / Technical mechanism

### 1. 初始化：prior 不是事實

ADIAS 先對 task-level public information 做一次外部搜尋，得到可能的 task requirement 與 failure mode prior $P_0$。再執行初始 agent $A_0$，取得 trajectory $\mathcal{T}_0$ 與 performance $M_0$。diagnostic agent 依觀察到的行為產生 $D_0$，Issue Manager 將 $P_0$ 與 $D_0$ 對齊，只有被行為證據支持的假設才應成為 confirmed issue。

這個設計很重要：外部 prior 是降低 cold-start uncertainty 的候選假設，不是把網路上看見的 failure 直接寫進控制狀態。

### 2. 生命週期：暫時消失不等於修好

新 issue 或重新出現的 issue 是 `active`；一個原本存在但本輪沒有觀察到的 issue 可以進入 `tentatively-fixed`；連續至少 $\alpha_{min}=2$ 次 evaluation 都沒有再出現，才進入 `confirmed-fixed`；若已修好的 issue 再出現，狀態回到 `regressed`。這讓「某一輪沒看到」和「可靠消失」分開。

### 3. 每回合的控制 loop

1. 從 $E_{t-1}$ 挑出 severe、repeated、active 或 recently regressed issue。
2. 同時選 parent agent $A_{p_t}$ 與 revision plan $R_t$。
3. 對 parent 做 focused full-code modification，仍允許改 prompt、memory、planning、tool policy、control flow、verification 或 recovery。
4. 執行 $A_t$，取得 trajectory 與 metric。
5. 由 diagnostic process 產生 $D_t$，更新 issue identity、lifecycle 與 intervention outcome。

其抽象決策可寫成：

$$A_{t+1}=\arg\max_{A\in\operatorname{Propose}(H_t,E_t)}J_{issue}(A;E_t)$$

與 candidate-centric 的差別不在於是否保留 archive，而在於 objective 是否顯式衡量 unresolved issue 的 repair progress。

## 如何讀結果 / How to read the evidence

### 主要比較：跨環境的平均提升

Table 1 以 DeepSeek-V4-Flash 為預設 backbone；所有自動化方法共用 benchmark wrapper、task split、action interface、scoring script 與十回合預算。ADIAS 的 native task score 在五個 benchmark 都是最高：Tau-Bench 81.3、ALFWorld 94.0、TextCraft 91.0、WebShop 69.4、ScienceWorld 56.3，未加權平均 78.4；DGM-H 為 62.6。這支持「在這組受控環境中，issue-centric control 與較高 task score 同時出現」，不支持「所有 agent 自動改良都會得到同樣提升」。

### Cross-model：不是只對一個 backbone 有效

Table 2 在 Tau-Bench 固定 task protocol，換用 DeepSeek-V4-Flash、GLM-5.2、Hy3-Preview、GPT-5.4 四個 backbone；ADIAS 的 score 分別為 81.3、90.6、84.4、87.5，論文報告在四個模型都最高。這是跨模型的 robustness slice，但只在 Tau-Bench，不是五個 benchmark 的全面 cross-model 結論。

### Ablation：真正有用的是三件事的組合

Table 3 把 persistent issue state 拆成 evidence、representation 與 optimization control 三個角色：

| 設定 | Tau-Bench | ALFWorld | TextCraft | 三者平均 |
| --- | ---: | ---: | ---: | ---: |
| ADIAS full | 81.3 | 94.0 | 91.0 | 88.8 |
| w/o external prior | 75.0 | 82.8 | 61.0 | 72.9 |
| w/o round-level diagnosis | 78.1 | 63.4 | 76.0 | 72.5 |
| archive-wide synthesis | 65.6 | 60.4 | 32.0 | 52.7 |
| best-candidate revision | 71.9 | 75.4 | 74.0 | 73.8 |
| latest-candidate continuation | 62.5 | 41.0 | 60.0 | 54.5 |

論文的解釋是：外部 prior 幫助 cold start，round-level diagnosis 提供行為證據，persistent issue state 則讓它們跨回合成為 control signal。這裡的 causal claim 仍要保守：各 ablation 都是整個方法的替代配置，不能從單一分數推導出每個模組在 production 中的獨立 ROI。

![ADIAS Figure 4：TextCraft 中不同 parent-selection policy 的 optimization process。](/paperReading/20-adias-issue-centric-agent-optimization/figure-4-textcraft-optimization.png)

*Figure 4，論文 Section 5.3 的 TextCraft qualitative analysis：archive-wide、best-candidate、latest-candidate 與 ADIAS 的 parent lineage 如何導向不同 repair trajectory。[原始 figure](https://arxiv.org/html/2608.06410v1#S5.F4)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2608.06410v1/x4.png)。ADIAS figure 使用 arXiv.org perpetual non-exclusive license；reuse permission 未在 source 中另外說明，本文保留來源與限制註記。*

## 證據地圖 / Evidence map

- **Paper directly supports**：五個互動式 benchmark 的 Table 1 分數、四個 backbone 的 Tau-Bench Table 2、Table 3 ablation，以及 Figure 4 對 parent lineage 與 issue-specific repair 的 qualitative comparison。
- **Author interpretation**：issue-centric state 能讓 repair progress 累積、避免失效介入反覆出現，並提升 full-code optimization 的效率與穩定性。
- **Not established**：沒有獨立的 diagnosis accuracy、issue association accuracy、confidence interval 或 multi-seed uncertainty；沒有 multimodal、長期線上、對抗性或 production cost evidence；也沒有證明 regression 不會在未測試 task 上出現。
- **Bloss0m engineering judgment**：ADIAS 最值得採用的不是「讓 agent 自己改所有 code」，而是把 issue lifecycle、介入 provenance 與 rollback gate 做成可審計的 control plane，再把 code generation 限在受保護的 sandbox 與 validation pipeline 內。

## Artifact 狀態與可重現性 / Artifacts and reproducibility

截至 2026-08-12，論文連到 [scylj1/adias repository](https://github.com/scylj1/adias)，但 repository README 只有 `Coming Soon`，`Code`、`Documentation`、`Usage examples` 都未勾選；頁面也未提供可用的 license、commit-pinned release、benchmark wrapper 或 config。分類應是 **announced / not currently usable**，不是 released 或 reproducible。

若未來 repository 完整公開，最小重現路徑應是固定一個 benchmark、backbone、wrapper 與十回合預算，對照 full ADIAS、archive-wide synthesis 與 latest-candidate continuation，並保存每一個 issue 的 identity、lifecycle transition、介入 patch 與 held-out score。現階段無法誠實地估算 API cost、seed variance、benchmark license 或 end-to-end reproduction time。

## 工程決策與不該使用的地方 / Engineering decision and when not to use it

**適合使用**：當 agent harness 已有可保存的 trajectory、明確的 validation split，以及能把 intervention 與 outcome 對上的 sandbox 時，issue-centric ledger 可以幫助團隊避免重複修同一個 failure，並把 partial repair 與 regression 變成可查詢狀態。

**不適合直接使用**：沒有可靠 evaluator、沒有 rollback、diagnostic agent 的 label 未經抽樣審核，或修復會直接觸碰 production credentials、side effects 與安全政策時，不應讓 ADIAS 類 full-code optimizer 自動合併 patch。先採用 issue ledger、human review、shadow evaluation 與 independent safety gate，再逐步放寬修復範圍。

## 三個記憶點 / Three things to remember

1. **技術想法**：把 repair issue 變成跨 candidate 的 persistent state，讓下一輪知道要修什麼、從哪裡繼續、哪些介入曾經失效。
2. **證據**：五個 benchmark 的受控比較與 Table 3 顯示，外部 prior、round-level diagnosis、issue representation 與 optimization control 的組合比 raw archive 更強。
3. **邊界**：issue state 的品質取決於 diagnosis 與 association；官方 code 尚未可用，論文結果不能直接等同於 production 自動修復保證。

## Primary sources

- [ADIAS arXiv full HTML（v1，2026-08-03）](https://arxiv.org/html/2608.06410v1)
- [ADIAS arXiv abstract and version record](https://arxiv.org/abs/2608.06410)
- [ADIAS official repository](https://github.com/scylj1/adias)
- [ADIAS repository README，artifact status](https://raw.githubusercontent.com/scylj1/adias/main/README.md)
