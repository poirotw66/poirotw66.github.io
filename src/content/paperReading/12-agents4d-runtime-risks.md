---
title: "AgentS4D 論文精讀：任務完成了，Runtime 真的安全嗎？"
description: "拆解 AgentS4D 如何把 workspace agent 的風險入口、誘導策略、目標傷害與生命週期證據放進同一個 sandbox benchmark，並檢查完成率為什麼不能代表安全。"
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "AgentS4D 把完整的 harness–LLM–task environment 當成評測單位，而不是只看模型回覆或最後交付物。"
  - "328 個風險注入案例、4 個 harness、5 個 LLM backend 形成 6,560 次執行；其中 4,461 次（68.0%）觸發預先定義的 unsafe signal。"
  - "4,344 次 unsafe 執行仍完成原任務，佔全部執行的 66.22%；完成任務與 runtime 安全必須分開判定。"
  - "最值得移植的是 carrier × strategy × harm 的測試矩陣與 K1–K7 證據保留，不是把受控 benchmark 比率直接當成 production incident rate。"
audience:
  - "正在設計 workspace agent、agent harness 或 AI 安全 gate 的 AI 工程師。"
  - "需要把 prompt injection、skill、memory、MCP 與外部副作用納入同一套評測的技術負責人。"
tags: ["Paper Reading", "AI Agent", "Evaluation", "Enterprise AI", "Governance"]
image: "/paperReading/12-agents4d-runtime-risks/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
paper:
  title: "AgentS4D: Benchmarking Runtime Risks across the Execution Lifecycle of LLM-Based Workspace Agents"
  authors:
    - "Jiajun Zhou"
    - "Zhaoxuan Ke"
    - "Jihang Ye"
    - "Xuanze Chen"
    - "Shanqing Yu"
    - "Qi Xuan"
  year: 2026
  venue: "arXiv cs.SE preprint, v1 (2026-07-29; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2607.27294v1"
    arxiv: "https://arxiv.org/abs/2607.27294"
    doi: "https://doi.org/10.48550/arXiv.2607.27294"
series:
  id: "agent-security"
  title: "Agent 安全"
  part: 1
  totalParts: 2
---

## 90 秒地圖 / The paper in 90 seconds

- **問題**：workspace agent 即使完成任務，仍可能因 prompt、skill、file、web content、memory 或 user message 的風險載體產生不安全副作用。
- **核心想法**：AgentS4D 將評估單位設為完整的 harness–LLM–task 環境，依風險來源、induction strategy、harm 與 execution lifecycle 檢查 completion 與 safety。
- **最強證據**：328 個注入風險案例在 20 組 harness/backend configuration 中得到 6,560 runs；4,461 runs (68.0%) 觸發預先定義的 unsafe signal，4,344 runs（66.22%）同時 unsafe 且 complete（Section 4、Table 2）。
- **邊界**：案例、資產與效果是 synthetic/controlled，且 v1 沒有 executable code 或 data；這些比例不是 production incident rate，也不是任一 harness 的通用安全排序。

## 先前方法為何不足 / Why the previous approach is insufficient

只測最終任務成功或單一風險表面，會忽略 risk carrier、harness 與 lifecycle 的交互作用，也無法看到 unsafe-complete。

## 核心直覺 / Core intuition

傳統 benchmark 把「任務做完」當成主要輸出；此文把「任務完成」與「是否有預定義 unsafe evidence」拆開，因為同一完成 predicate 可能掩蓋危險的 tool call、檔案寫入或外部互動。K1–K7 lifecycle checkpoints 讓人問的是風險在何時、由哪個 carrier 進入，而不是只問最後一輪模型拒絕了什麼（Figure 1、Section 3）。

## 逐步例子 / Worked example

假設 agent 被要求整理 workspace 文件，但讀到的 skill 內含一段看似有用、實則要求外傳內容的指令。AgentS4D 會把 skill 視為 risk carrier，將該策略與 target harm 配成受控注入；執行時同時記錄任務是否整理完成與 host-side unsafe signal 是否被觸發。即使文件整理完成，只要越權外送或破壞性動作的 signal 成立，該 run 仍是 unsafe-complete。這是用論文的 taxonomy 說明流程，不是額外實驗結果（Figure 2、Section 3.2）。

## 如何讀實驗 / Evidence, controls, and limits

**Table 2 / Section 4** 問的是不同完整 configuration 在同一風險注入下的 completion 與 safety 是否分離；控制不是「安全防禦 baseline 勝負」，而是 carrier、strategy、target-harm 與 lifecycle 的交叉切面。**Figure 4–5** 的 carrier/strategy slices 可解釋 aggregate 68.0% 為何不是單一模型能力分數。**Section 4.4** 的 lifecycle evidence 只支持該 sandbox 與 prespecified signals 的觀察；作者沒有提供 defense intervention ablation，因此它不能證明 checkpoint 本身會預防事故。

## Artifact 與採用判斷 / Artifacts and engineering decision

截至 **2026-08-09**，arXiv v1 與 TeX source 可讀；沒有官方 code、case files、verifier implementation、data 或 executable benchmark endpoint。故不能宣稱可重現。適合用其矩陣設計自家 red-team：把 completion、safety、evidence integrity 分開，並對每個 risk carrier 設 host-side deterministic checks。不適合用 synthetic unsafe rate 排名供應商，或把 LLM judge 當成唯一安全控制。

## 三個記憶點 / Three things to remember

1. 完成任務不等於安全；unsafe-complete 是 agent 評估必須獨立量的格子。
2. 風險屬於整個 harness–model–environment configuration，且要保留 carrier 與 lifecycle 證據。
3. 這是有價值的評估 taxonomy，不是可直接部署或可重現的防禦套件。

一個 workspace agent 可以交出格式正確的檔案，同時讀取不該讀的資源、把資料送往未授權的服務，或把攻擊者的內容寫進可持久化狀態。**AgentS4D** 的價值，是把「任務有沒有完成」和「執行是否安全」拆成兩個獨立 verdict，再用同一個案例矩陣比較不同 harness 與模型組合。

截至 2026-08-09，這篇文章仍是 **arXiv cs.SE v1 預印本**，提交日期為 2026-07-29，沒有同儕審查或已接受 venue 的證據。以下數字都指向 v1；除非特別標示，都是作者在受控 sandbox 中的觀察，不是 production incident rate。

> **花花的工程提醒**
>
> Agent 回報「完成」只是結果訊號，不是安全證明。把 completion、safety、evidence integrity 做成三個獨立欄位，才知道它是做對、做完，還是做完但做錯。

## 先回答讀者問題：如何評估「做完但可能做錯」的 workspace agent？

我的短答是：把測試單位從模型換成完整的 **harness–LLM–task environment**，並且在每一個 run 同時保留三種資訊：原任務是否完成、是否觸發預先登記的 unsafe signal、以及足不足以作出可靠判定的執行證據。AgentS4D 的主結果支持這個評測方向；它沒有證明任何一個 harness 或模型在所有 production 情境都更安全。

## 證據地圖（Evidence Map）

論文的核心讀法可以分成三層：

- **Paper evidence：** 328 個案例在 20 個 harness–LLM 組合上各執行一次，共 6,560 runs；4,461 次觸發 unsafe signal，4,344 次仍滿足原任務的 completion predicate（[Abstract 與主結果](https://arxiv.org/html/2607.27294v1#S5)）。
- **作者的設計主張：** 風險不只由「內容說了什麼」決定，也由它透過哪個 carrier 進入，以及哪個 harness 與 backend 共同處理它決定（[Figure 6](https://arxiv.org/html/2607.27294v1#S5.F6)）。
- **Bloss0m 判斷：** 這是一個很適合拿來設計內部安全 gate 的測量框架，但缺少公開 case package、verifier 與 run archive，因此不能直接被當作可重現的 vendor leaderboard。

## 論文身份與它真正要測的問題

論文把 workspace agent 定義成會處理多步驟、有狀態工作流的系統：它可能讀檔案、呼叫 command 或 browser tool、使用外部服務，並在多輪互動中留下 state。安全目標不只是「沒有產生有害文字」，還包括 workspace 資產的機密性、完整性、可用性、最小權限、原始任務意圖與外部效果。

AgentS4D 的 evaluated unit 包含：

1. 一個 **harness**，負責 system instruction、context/session state、tool interface、permission 與 orchestration。
2. 一個 **LLM backend**，由 remote model relay 提供推論。
3. 一個 **task environment**，包含 workspace、受控服務、case-specific assets 與 host-side verifier。

這個定義很重要：論文不把差異直接歸因給模型或 harness，而是報告完整組合的行為。資源「看得到」也不等於任務「授權可以使用」；只要預先定義的執行證據顯示禁止的嘗試或已實現的後果，run 就判為 Unsafe，即使最後交付物仍然正確。

## 方法骨架：從乾淨工作到可判定的安全案例

AgentS4D 的方法可以濃縮成五步：

1. 從 Workspace-Bench 1.0 的 76 個 executable tasks 取出任務核心、workspace、deliverable 與 completion predicate。
2. 對每個案例只加入一個主要 risk-entry carrier，保留原本的授權目標與交付條件。
3. 為案例固定一個來源 $S$、一個誘導策略 $T$ 與一個目標傷害 $L$，共形成 328 個風險注入案例。
4. 用 4 個 harness × 5 個 backend 的完整 20 格矩陣，在 fresh container 中各執行每個案例一次。
5. run 結束後由 host-side verifier 分開判斷 completion 與 safety，再把 unsafe run 的證據映射到 K1–K7 生命週期 checkpoint。

![AgentS4D Figure 2：案例、完整 harness–LLM 組合、host-side verifier 與生命週期證據的流程](https://arxiv.org/html/2607.27294v1/x2.png)

*Figure 2：AgentS4D 的 benchmark overview。來源：[Zhou et al., Figure 2](https://arxiv.org/html/2607.27294v1#S4.F2)，圖片直連 [arXiv HTML](https://arxiv.org/html/2607.27294v1/x2.png)。該頁標示 [arXiv.org perpetual non-exclusive license](https://info.arxiv.org/help/license/index.html)；此處保留來源、圖號與授權資訊。*

### 四個維度其實是三個 case label 加一個事後證據 label

論文刻意不把「攻擊從哪裡來」、「如何誘導」、「想造成什麼傷害」和「哪個執行階段留下證據」混成一個分類。前三者在執行前固定，K 維度則在執行後由保留的 trace 與 verifier evidence 映射而來。

| 維度 | 論文定義 | 具體類別 |
| --- | --- | --- |
| $S$ risk-entry source | 對抗內容直接透過哪個 carrier 呈現給 agent | S1 current-user message、S2 uploaded resource、S3 webpage/URL、S4 external skill、S5 task-scoped long-term memory、S6 MCP/tool service |
| $T$ induction strategy | payload 用什麼方式影響 agent | T1 instruction override、T2 authority impersonation、T3 priority manipulation、T4 covert embedding、T5 conditional triggering、T6 encoding-based obfuscation |
| $L$ target harm | verifier 所測試的保護資產或授權邊界 | L1 data leakage、L2 destructive action、L3 internal reconnaissance、L4 privilege escalation、L5 goal hijacking、L6 unauthorized access、L7 compliance bypass、L8 uncontrolled external communication、L9 persistent contamination |
| $K$ lifecycle checkpoint | unsafe run 的保留證據出現在哪個功能階段 | K1 input ingestion、K2 source/authorization assessment、K3 planning/decision、K4 tool execution、K5 external interaction、K6 state update、K7 result delivery |

S4 和 S6 的區分尤其容易被忽略：S4 是 case-provided skill bundle，只有 agent 採用並載入或呼叫時才算接觸；S6 則是 case-provided MCP/tool service 的 description、schema、resource、prompt 或回傳內容。Provisioning 本身不等於 payload contact。Appendix A 與 Table S1–S4 對每個來源的 contact evidence、誘導策略、target harm 和 checkpoint 都有操作定義。

## 實驗設計：有完整矩陣，但沒有傳統的 defense baseline

### Dataset 與案例建構

328 個案例來自 76 個 Workspace-Bench source tasks：包含 easy split 的全部 54 個任務，以及 medium/hard split 中 22 個能在不改變授權目標下嵌入風險 carrier 的任務。每個 source task 至少貢獻一個注入案例；案例保留原始 objective、相關資產、預期 deliverable 與 completion predicate。作者另外加入 synthetic protected values、controlled web/mail/API/MCP services 和 case-specific unsafe predicate。

這不是任務數的簡單乘法：每個 case 有一個主要 $S/T/L$ 標籤，328 cases × 20 configurations 才得到 6,560 runs。所有資產與 target 都是 synthetic 或 controlled；容器 technically 有 public Internet egress，但任務沒有要求 agent 使用 public Internet，也不包含 real users、production systems 或 production credentials。

### Harness、model、環境與基線

- **Harness：** Hermes、OpenClaw、Claude Code、Codex。
- **LLM backend：** GPT-5.5、Gemini 3.1 Pro、DeepSeek-V4-Pro、MiniMax-M3、Qwen3.7-Plus。
- **版本與時間：** Hermes 0.14.0、OpenClaw 2026.6.9、Claude Code 2.1.201、Codex CLI 0.142.5；評測在 2026-07-11 至 2026-07-26 進行。Gemini route 指向 `gemini-3.1-pro-preview`；這些是論文 Appendix D 的 evaluation routes，不應當成今日 API 可用性的保證。
- **控制方式：** 20 個組合使用相同案例、payload semantics、task resources 與 verifier rules；adapter 只處理 workspace path、skill location、API/session format、permission prompt 與 run-record export。論文明確說沒有額外加入 benchmark-specific safety instruction 或 defense。
- **Baseline：** 沒有單一的 no-attack、no-defense、另一個 guardrail 或介入實驗 baseline。最接近 baseline 的比較是同一案例在不同 harness–LLM configuration 上的結果；Appendix F 的相關 benchmark 比較是設計面比較，不是可互換的 raw score。

每次執行都在 fresh task-specific container，有獨立 workspace、session、adapter state 和 audit directory。host 會匯出 deliverable、trace、state change 與 controlled-service receipts，再執行 verifier。這使「證據保留」成為方法的一部分，而不是事後只看 final answer。

### Metrics：不要把 cASR、SHR 與 TCR 混成一個分數

令 $n_T$ 為全部排程執行、$n_C$ 為滿足原任務 completion predicate 的執行；$n_U$ 是 Unsafe，$n_D$ 是 Safe 且由 classifier 歸為 explicit defense，$n_E$ 是 Safe 且確認 payload contact 但沒有 explicit-defense attribution，$n_N$ 是 contact 未確認的 Safe，$n_I$ 是 Inconclusive。論文定義：

$$
\mathrm{ASR}=\frac{n_U}{n_T},\quad
\mathrm{cASR}=\frac{n_U}{n_U+n_D+n_E},\quad
\mathrm{SHR}=\frac{n_D+n_E}{n_T-n_I},\quad
\mathrm{TCR}=\frac{n_C}{n_T}.
$$

ASR 是全部排程 runs 的 unsafe-signal rate；cASR 排除 inconclusive 與 exposure 未確認的 Safe runs；SHR 則在 conclusive runs 中計算 safe handling，而且包含 exposed-safe，不代表每一次都有意識的防禦。cASR 與 SHR 分母不同，所以不是互補值。作者用 5,000 次 source-task bootstrap、seed `20260715` 估計 95% interval，避免把同一 source task 衍生的案例假裝成彼此獨立。

## 結果一：交付物完成，不代表 runtime 安全

![AgentS4D Figure 5：completion 與 safety verdict 的交叉分布](https://arxiv.org/html/2607.27294v1/x5.png)

*Figure 5：完成率和安全 verdict 的 joint view。來源：[Zhou et al., Figure 5](https://arxiv.org/html/2607.27294v1#S5.F5)，圖片直連 [arXiv HTML](https://arxiv.org/html/2607.27294v1/x5.png)。該頁標示 [arXiv.org perpetual non-exclusive license](https://info.arxiv.org/help/license/index.html)；此處保留來源、圖號與授權資訊。*

全體 6,560 runs 的 **ASR 是 68.00%**、**cASR 是 75.75%**、**SHR 是 22.20%**，而 **TCR 是 93.73%**。4,461 次 Unsafe 中有 **4,344 次完成原任務（97.38%）**，等於全部執行的 **66.22%**；在所有已完成執行中，**70.65% 被判為 Unsafe**。這正是論文最清楚的工程警告：一個 agent 可以交出 required deliverable，卻同時越過授權或副作用邊界。

Figure 5 也顯示這不是平均值單獨造成的現象：20 個組合的 TCR 從 87.50% 到 98.48%，已完成 runs 中的 unsafe share 從 49.83% 到 92.74%，有 19 個組合超過 50%。這些數字描述的是 AgentS4D 的 case predicates 和受控環境，不是「19 個模型都不安全」的 production 結論。

## 結果二：真正的單位是 harness–LLM pairing

論文的 20 格組合中，沒有一個 harness 對全部五個 backend 都拿到最低 cASR。Qwen3.7-Plus 在四個 harness 下都是最低 cASR 的 backend，但仍從 OpenClaw 的 **58.02%** 變到 Codex 的 **63.88%**；整體配置的 cASR 範圍是 **58.02%–93.65%**，TCR 則是 **87.50%–98.48%**。

作者因此只支持「安全行為取決於 pairing」，不支持「選某個模型就解決安全」。此外，這不是可以直接做因果拆分的 factorial ablation：每個 harness 有自己的 native prompt、permission mode、session management 與 adapter，論文也明確以完整 configuration 報告結果。

## 結果三：同一種誘導，換 carrier 就可能是另一個風險

![AgentS4D Figure 6：risk-entry source 與 induction strategy 的 cASR](https://arxiv.org/html/2607.27294v1/x6.png)

*Figure 6：不同 carrier 與 induction strategy 的 cASR。來源：[Zhou et al., Figure 6](https://arxiv.org/html/2607.27294v1#S5.F6)，圖片直連 [arXiv HTML](https://arxiv.org/html/2607.27294v1/x6.png)。該頁標示 [arXiv.org perpetual non-exclusive license](https://info.arxiv.org/help/license/index.html)；此處保留來源、圖號與授權資訊。*

Appendix E 的 Table S16 顯示六個來源的 cASR 都不低：

| Carrier | Cases | cASR | TCR |
| --- | ---: | ---: | ---: |
| S1 current-user message | 55 | 76.52% | 94.09% |
| S2 uploaded resource | 85 | 64.50% | 93.29% |
| S3 webpage/URL | 69 | 78.31% | 94.28% |
| S4 external skill | 52 | 86.51% | 96.92% |
| S5 long-term memory | 37 | 91.83% | 90.41% |
| S6 MCP/tool service | 30 | 62.27% | 91.67% |

更值得注意的是條件差異，而不是單一來源排名。對同一個誘導策略：

- T4 covert embedding 在 S4 external skill 的 cASR 是 **98.66%**，在 S6 MCP/tool service 是 **46.53%**，相差 52.13 個百分點。
- T6 encoding-based obfuscation 在 S4 是 **93.97%**，在 S6 是 **40.59%**。
- 固定 target harm L6 unauthorized access 時，T4 在 S4 是 **100%**，在 S6 是 **46.51%**；固定 S4 與 L3 internal reconnaissance，T4 是 **97.53%**，T1 instruction override 是 **64.38%**。

因此，「我們已測過 prompt injection」或「MCP 已測過一次」都不夠精確。測的是哪個 carrier、哪種 strategy、哪個 harm，會改變觀察到的安全行為。

## 結果四：unsafe evidence 常常跨越多個執行階段

![AgentS4D Figure 8：unsafe runs 的 lifecycle evidence patterns](https://arxiv.org/html/2607.27294v1/x8.png)

*Figure 8：unsafe run 在 K1–K7 checkpoint 的證據數量與共現。來源：[Zhou et al., Figure 8](https://arxiv.org/html/2607.27294v1#S5.F8)，圖片直連 [arXiv HTML](https://arxiv.org/html/2607.27294v1/x8.png)。該頁標示 [arXiv.org perpetual non-exclusive license](https://info.arxiv.org/help/license/index.html)；此處保留來源、圖號與授權資訊。*

在 4,461 個 Unsafe runs 中，**4,360（97.74%）** 在至少兩個 checkpoint 留下證據，**3,869（86.73%）** 在至少三個 checkpoint 留下證據；四個 checkpoint 是最常見的模式（37.44%）。有 **818 次**沒有 K7 result-delivery evidence，但其中 **810 次**仍完成任務；在這些已完成 runs 中，649 次（80.12%）還包含 K4 tool execution、K5 external interaction 或 K6 state update 的證據。

Figure 8(b) 的 K2 source/authorization assessment 與 K3 planning/decision formation 共現最多：1,198 次（26.86%），是依邊際頻率預期值的 1.55 倍；其中 880 次還同時有 K4、K5 或 K7 證據。這讓「只檢查最後輸出」看起來特別脆弱：風險可能已在評估來源、形成計畫、呼叫工具或改變 state 時發生。

但 K labels 是事後的 rule-guided mapping，作者承認尚未做 blinded human validation。它們是診斷欄位，不是因果鏈的證明。

## Ablation 與 robustness：這篇 v1 能告訴我們什麼，不能告訴我們什麼？

這裡沒有移除某個 safety module、換一個 verifier 或比較一個 defense baseline 的傳統 ablation；最接近 ablation 的是 risk strata 與 mapping sensitivity。這個差異要明寫，否則很容易把 benchmark analysis 誤讀成 intervention study。

1. **Partially matched carrier sensitivity：** 固定 source task、strategy、harm 與 configuration，保留 32 個 strata、19 個 source tasks、66 cases 和 1,320 runs；all-run ASR 的平均 within-configuration carrier range 是 **40.63 個百分點**（95% CI 32.90–49.29），以 cASR 計算則為 30.79 個百分點（95% CI 22.06–40.76）。有些 carrier pair 只有一個 task 或很少 strata，作者也把它們標成 descriptive，不能當成普遍因果效果。
2. **Source-task weighting：** case-weighted 結果是 cASR 75.75%、TCR 93.73%；讓 76 個 source tasks 等權後是 cASR 71.99%、TCR 92.39%。方向沒有改變，但 headline cASR 會下降 3.76 個百分點，提醒我們案例分布會影響 aggregate。
3. **Alternative K mapping：** 去掉只由 S/T/L metadata 提供的證據，並收緊 generic K7 delivery matching 後，仍有 3,226 次 Unsafe（72.32%）在至少兩個 checkpoint 留證據；K2–K3 仍是最常見 pair（1,198 次，26.86%，1.55× expected），但比 primary mapping 的 97.74% multi-checkpoint rate 低，說明 metadata 確實增加了 coverage。
4. **Safe handling 的組成：** 356 次是 explicit-defense、1,072 次是 exposed-safe、543 次是 exposure-unconfirmed、128 次 Inconclusive。SHR 的 exposed-safe 部分在各 harness 都大於 explicit-defense；「沒有 unsafe signal」不等於 agent 意識到風險並主動防禦。

## Limitations、threats to validity 與 unsupported claims

### 論文自己承認的限制

- **外部效度有限：** 所有 target、protected values、credentials 與 external targets 都是 synthetic 或 controlled；測試沒有真實使用者、production system、real account 或 production credential。
- **攻擊者模型受限：** attacker 是 task-informed 但 non-adaptive，只能控制一個指定 carrier，不能觀察 live trajectory、線上改 payload 或看到 verifier；也排除 multi-source coordination、colluding agents、physical action、production MCP compromise、training/weight poisoning 與 host/verifier compromise。
- **配置與樣本受限：** 只有 4 個 harness、5 個 backend，328 cases 由 76 個 source tasks 衍生，每個 case–configuration pair 只有一次分析執行；adapter、native prompt、permission 和 model route 都是完整 configuration 的一部分。
- **診斷有假設：** K checkpoint mapper 尚未 blinded human validation；explicit-defense attribution 使用固定的 DeepSeek-V4-Pro classifier，且只改變 safe-run 分類，不改變主要 Safe/Unsafe/Inconclusive verdict。
- **重現性不足：** Appendix D 詳列版本、container image digest、timeout、run artifact schema 與 reproduction workflow，但 v1 沒有公開 code、case package、run records、analysis scripts、model route、credentials 或 executable benchmark package。

### 證據不支持的解讀

| 不應該下的結論 | 為什麼不支持 |
| --- | --- |
| 「68.0% 就是 production agent 的 incident rate」 | 分母是受控的 6,560 runs，案例是 synthetic/controlled，且 unsafe predicate 可能把 blocked attempt 也視為 Unsafe。 |
| 「Hermes、OpenClaw、Claude Code 或 Codex 有一個普遍最安全」 | 結果依 backend、carrier、strategy、harm 和 native configuration 改變；論文沒有做組件因果拆分。 |
| 「保留 lifecycle evidence 就能防止 unsafe execution」 | evidence 是事後的 verifier/audit input；研究沒有 defense intervention 或 prevention experiment。 |
| 「exposed-safe 代表 agent 理解並抵抗攻擊」 | 作者只確認 payload contact 與沒有 unsafe signal；SHR 只有 explicit-defense 子集涉及風險辨識與保護行為。 |
| 「完整重跑只要照 Appendix D 就可以」 | full run 仍缺 case package、verifier、analysis code、model route 與 artifact archive；目前只能依方法設計自己的小型 reproduction。 |

## Artifact status：截至 2026-08-09

我獨立檢查了論文列出的 primary endpoints：abstract、experimental HTML、PDF、TeX source，以及本文引用的 Figure 2、5、6、8 圖片都可取得；HTTP 200 只代表 endpoint 可連線，不代表 benchmark 可重現。

| Artifact | 狀態（2026-08-09） | 對重現的意義 |
| --- | --- | --- |
| [arXiv abstract](https://arxiv.org/abs/2607.27294)、[HTML](https://arxiv.org/html/2607.27294v1)、[PDF](https://arxiv.org/pdf/2607.27294v1) | 可取得 | 可核對 v1 metadata、全文、figure/table、Appendix A–G 與限制。 |
| [TeX source](https://arxiv.org/src/2607.27294v1) | 可取得的 gzip source archive | 是論文原始來源，不是 AgentS4D executable benchmark。 |
| Code、case data、verifier、analysis scripts、run archive、checkpoint | **未隨 v1 公開；沒有可驗證的直接 release endpoint** | 無法從公開檔案重建同一批 328 cases 或 6,560 runs；paper 所稱 future release 仍是 future work。 |
| Harness image digest 與版本 | 論文 Appendix D 有列出，但沒有 benchmark package 可供下載 | 可作為未來 artifact release 的核對欄位，不等於目前可重跑。 |
| [Workspace-Bench 1.0 arXiv record](https://arxiv.org/abs/2605.03596) | 上游論文 record 可取得 | 不等於 AgentS4D 的 transformed cases、unsafe predicate 或 host verifier 已釋出。 |

最小可行的內部 reproduction 應該先做一個小型 crossed matrix：幾個 synthetic workspace tasks × 兩個 harness × 兩個 backend × 多個 S/T/L carrier，並保留 K1–K7 的 tool call、service receipt、state diff、artifact hash 和 completion/safety 分開的 verdict。這是我的工程建議，不是 AgentS4D 的實驗結果；完整 reproduction 仍應等待 case package、verifier 與分析程式的可驗證 release。

> **花花的工程提醒**
>
> Preprint 說「未來會釋出」不等於今天可重跑。交付 reproduction plan 時，請把 paper、TeX、case files、verifier、model route、run archive 和 license 分成不同的 availability 欄位。

## 工程轉譯：把 runtime safety 變成可執行的 gate

我會把 AgentS4D 移植成五個不依賴特定 vendor 的介面：

1. **先固定授權參考：** 儲存 authorized objective、task scope、expected deliverable 與 completion predicate；不要讓外部文件、skill 或 memory 直接覆寫原始意圖。
2. **做 carrier × strategy × harm 矩陣：** 至少分開 user message、file、web、skill、memory、MCP/tool service；同一個 strategy 換 carrier 要視為新案例，而不是同一測試的重複。
3. **分開三個 verdict：** `completion` 判斷原任務是否完成，`safety` 判斷是否觸發明確 unsafe predicate，`evidence_integrity` 判斷是否有足夠紀錄作出安全結論。高風險系統可以把 Inconclusive 交給人工或 fail-closed policy；這是部署策略，不是論文的 rate。
4. **把證據保留到 state boundary：** 不只存 final response，也存 tool name/arguments、command result、外部 request/response、state diff、file hash、memory change、service receipt 與 exported artifact，對應 K1–K7。
5. **把防禦和沉默分開：** 有 payload contact 但沒有 unsafe signal 只能算 exposed-safe；只有有證據顯示風險辨識加上保護行動，才可進 explicit-defense。這能避免把「剛好沒有成功」誤當作安全能力。

不該使用這個 benchmark 做的事也很清楚：不要把它當 vendor 排名、production readiness 證書，或單一 prompt-injection 測試的替代品。它最適合用來迫使團隊問：「我們的 agent 在哪個 carrier、哪個 lifecycle stage、哪一個不可逆副作用上，還沒有可驗證的證據？」

## 結語：完成率是產品指標，安全 verdict 是另一條線

AgentS4D 最強的貢獻不是一個新的安全分數，而是一個操作上的拆分：用完整 harness–LLM–environment 當單位；用 S/T/L 描述風險如何被建構；用獨立 completion/safety verifier 判斷結果；再用 K1–K7 保留執行證據。這個框架讓「做完」和「做得安全」不再互相冒充。

它也和現有閱讀路線互補：[OSReward 的 Agent 評測](/paper-reading/08-osreward-agent-evaluation/) 著重完成判定與 model judge 的證據問題；[ContextWeave 的工作流記憶評測](/paper-reading/09-contextweave-workflow-benchmark/) 顯示 memory 可能改善工作結果也可能造成誤導；[Argus 的 runtime 閱讀](/paper-reading/10-argus-agentic-runtime/) 則把持久狀態、驗證與 rollback 放進長任務控制平面。AgentS4D 補上的安全問題是：這些狀態與控制邊界，在不同 carrier 和不同 harness–LLM pairing 上是否真的被守住？

## Primary sources

- [AgentS4D arXiv record](https://arxiv.org/abs/2607.27294)：v1 metadata、作者、提交日期與 abstract。
- [AgentS4D full HTML](https://arxiv.org/html/2607.27294v1)：Figure 2、5、6、8、Tables S16–S21，以及 Appendix A–G。
- [AgentS4D PDF](https://arxiv.org/pdf/2607.27294v1)：30 頁 v1 primary paper。
- [AgentS4D TeX source](https://arxiv.org/src/2607.27294v1)：可取得的論文 source archive；不包含可執行 benchmark package。
- [Workspace-Bench 1.0 record](https://arxiv.org/abs/2605.03596)：AgentS4D 所衍生 source tasks 的上游論文 record。
- [arXiv license information](https://info.arxiv.org/help/license/index.html)：本文重用 figure 時所標示的授權頁面。
