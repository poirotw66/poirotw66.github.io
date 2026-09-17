---
title: "BTS-AgentBench：把只讀遙測編譯成可重播的 Agent 評測回合"
description: "精讀 Jeong-Yoon Kim 的 BTS-AgentBench（arXiv:2608.27334 v1）：從 BTS 建築遙測建立只讀工具、可執行任務、有限互動契約與證據化評測；精確重播很強，但不等於生產安全或任意領域的可攜性。"
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "論文的主要貢獻不是宣稱某個模型最強，而是把固定的建築遙測與 metadata 編譯成可執行、可重播、帶證據的多回合 Agent benchmark。"
  - "核心分層是 read-only tool store → static executable task → typed interaction contract → operator-facing episode → deterministic verifier；每次加入澄清、修訂、時間政策或品質判斷，都要重新執行來源計算。"
  - "532 筆 BTS release 通過 0 findings 的 contract preflight，兩次獨立 raw-to-episode build 對上 11 個 logical tool-store exports 與 356/87/89 split；三個模型的一次性 test run 則為 GPT-5.5 79/89、Gemini 71/89、Claude Opus 58/89。"
  - "最重要的邊界是只讀、離線、有限回合的建築遙測；它沒有評估寫入控制、安全關鍵致動、維護規劃或長程 troubleshooting，也不能把 benchmark 分數當成 production safety。"
audience:
  - "設計 Agent benchmark、tool-use harness、資料代理或企業評測流程的 AI 工程師"
  - "需要把來源資料、互動契約、證據、replay 與失敗診斷接成可稽核 pipeline 的技術負責人"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Agent Evaluation", "Benchmark", "Observability", "AI Engineering"]
image: "/paperReading/56-bts-agentbench-replayable-telemetry/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "BTS-AgentBench: A Deterministic, Replayable Pipeline from Read-Only Telemetry Logs to Agent Benchmarks"
  authors:
    - "Jeong-Yoon Kim"
  year: 2026
  venue: "arXiv 2608.27334 v1 (submitted 2026-08-27; preprint)"
  links:
    pdf: "https://arxiv.org/pdf/2608.27334v1"
    arxiv: "https://arxiv.org/abs/2608.27334"
    code: "https://github.com/kjy7567/BTS-AgentBench"
series:
  id: "telemetry-agent-evaluation"
  title: "遙測資料到 Agent 評測"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文 / The paper in 90 seconds

- **問題**：建築現場累積了多年 sensor 與 equipment 的只讀遙測，但 raw history 不是可直接交給 Agent 的多回合任務。若逐筆手寫任務，既難保留站點的本地名稱與關係，也難維護來源答案、split 與 evidence 的一致性。
- **核心洞見**：把 benchmark construction 當成一條可重播的編譯鏈：先將 metadata 與歷史資料放進只讀 tool store，再由固定規則建立 static task，最後把原本的計算包進 typed、有限的互動契約。互動表面可以增加澄清、目標修訂、nearest timestamp、品質決策與證據追問，但來源計算與 gold 必須一起重新執行。
- **最強證據**：兩次獨立的 raw-to-episode build 對上 11 個 logical tool-store exports，也逐筆重現 BTS 的 356/87/89 train/dev/test release；公開的 532 筆 episode 通過 coded contract preflight。這是 construction consistency 的證據，不是 operator realism 或生產部署的證據（論文 Table 7、Appendix A.3）。
- **主要邊界**：BTS-AgentBench 是只讀、離線、有限回合的 building-telemetry benchmark。它的零 controller success 是 construction-exclusion 條件，不是任務難度的獨立估計；XAI4HEAT 的 41/41 也只說明第二個遙測 corpus 上的執行可行性，不能外推到任意 event log 或物理控制。

我的 bounded verdict 是：**這篇工作的價值在於把「任務答案從哪裡來、互動需要什麼、評分如何重播」寫成同一份可執行契約。它適合用來建造和審核受限的 read-only telemetry 評測集；若問題已經變成寫入設備、授權操作或真實現場安全，論文沒有提供足夠證據。**

> **花花的工程提醒**
>
> 如果你只看到「兩次重建完全相同」就把它解讀成「Agent 在現場可靠」，中間少了好幾層。BTS-AgentBench 證明的是固定來源、固定選擇契約與固定執行環境可以產生相同 benchmark；它沒有證明來源資料本身代表所有站點，也沒有讓只讀查詢自動變成可授權的設備控制。

## 這篇論文究竟提出什麼 / Paper identity and scope

本文閱讀的是 [arXiv 2608.27334 v1 的完整 HTML](https://arxiv.org/html/2608.27334v1) 與 [v1 PDF](https://arxiv.org/pdf/2608.27334v1)，版本提交日為 2026-08-27，作者為 Jeong-Yoon Kim。arXiv 頁面標示這是 preprint，不應寫成已通過同儕審查的研究。論文分類上同時接近 **dataset／evaluation paper** 與 **systems paper**：它提出一套從來源遙測建立 benchmark 的 construction method，並釋出一個名為 BTS-AgentBench 的實例；後者不是另一個獨立的模型方法。

讀者問題可以定成：**如何把一個已收集、站點特定的遙測 corpus，轉成可以執行、驗證、重播，且有多回合操作語境的 Agent benchmark？** 這個問題需要分開四個常被混在一起的物件：

1. **來源 corpus** 是 BTS 的 metadata 與 timestamp/value histories；它保留站點、equipment、zone、point class 與 stream identifier。
2. **Static task** 是由只讀 runtime 計算出的固定查詢、gold、evidence、verifier 與 split。
3. **Episode** 是把 static task 放入有限的 user simulator，加入可追蹤的 clarification、revision、policy、commitment 或 evidence phases。
4. **Model trace** 是評測時才產生的 Agent tool calls 與回答；它不參與 task retention，也不會回頭修補 benchmark。

論文把來源 task 記作 $r$，把改變 Agent-facing interface、但保留 computation 與 target 的 episode 記作 $r^{\star}$。這個星號不是「更真實的對話」保證，而是提醒我們：surface 變了，來源計算不應被悄悄換掉。每個 episode 都有 deterministic user simulator、read-only tools、Agent trace 與 programmatic evaluator；成功要同時滿足 telemetry target 與 interaction obligations，且沒有 mutable final database state（論文 Section 3.1）。

## 既有做法為什麼不夠 / Why the obvious alternatives are insufficient

### Raw telemetry 很豐富，卻不是可執行任務

BTS 的原始資料含有長時間序列與標準化 Brick metadata，但「有資料」不等於「有一個可問、可答、可評分的操作 episode」。一個 Agent 若要回答站點內的 point lookup、日平均、跨視窗比較或品質決策，至少需要穩定的 stream binding、工具參數、時間政策、可接受的答案形式，以及指出 contributing stream 的 evidence。

手工把這些內容寫成對話會遇到兩個縮放問題。第一，固定站點的本地詞彙很難靠通用 Agent data 補足；第二，若每一列都獨立撰寫，新增一個澄清或修訂 turn 可能讓 user prompt、tool call、gold、evidence 與 verifier 互相漂移。論文的解法不是讓模型替每列生成更漂亮的對話，而是把這些欄位放進可重播的 construction contract。

### 候選空間很大，保留規則必須先固定

在論文 Table 1，BTS metadata 有 19,665 個 stream，其中 14,422 個與 raw history 對上並成為 tool-ready points。不同 family 的候選空間包含 2,193,431 個 day mean、315,929 個 window mean、5,989,083 個 window pairwise compare，但最終每個 family 只保留有限的 diversity-capped rows：point disambiguation、day mean、relative 24h mean、window pairwise compare、window rank、timestamp value、timestamp nearest 各 60；window mean 53；quality gate 59，共 532 筆。

這些 candidate counts 是由 tool-store 與 task generator 誘發的搜尋空間，不是 BTS 原始資料 release 的 task count。BTS_C 被保留為 test site；其他候選在 point class 與 calendar quarter 等條件下做 diversity cap，並以固定排序將每第五個非 held-out candidate 放入 dev。model output 與 descriptive difficulty proxy 都不參與 retention 或 split assignment（論文 Section 3.2、Table 1）。這個細節很重要：如果先看模型答案再調整 split，就不能再把結果說成對固定 benchmark 的盲測。

## 核心直覺：先編譯契約，再讓 Agent 互動 / Core intuition

最容易誤解的地方，是把這篇論文想成「一個用 template 產生合成對話的工具」。比較準確的心智模型是：

```text
BTS metadata + raw histories
  → normalized read-only tool store
  → static executable task
  → typed interaction contract
  → deterministic operator surface
  → programmatic verifier and replay report
```

這裡的 control point 是 **interaction contract 與來源計算之間的邊界**。surface renderer 可以把 exact timestamp 隱藏成需要澄清的 slot，或把查詢延伸成「請用最近觀測並說明品質」；但只要新增的 turn 會引入 telemetry operation，就必須對同一個 read-only store 重跑 operation，並一併更新 phase gold、final target、evidence 與 verifier。也就是說，語言是在契約上呈現，不是用來替代計算。

Episode contract 在論文 Section 4.2 寫成：

$$C=(Q,\Phi,A,E,V), \qquad \phi_i=(f_i,g_i,R_i)$$

其中 $Q$ 儲存 interaction mode、missing slots 與 operator turns；$\Phi=(\phi_1,\ldots,\phi_n)$ 是 phase sequence；$f_i$ 是 phase type；$g_i$ 是該 phase 的 structured gold map；$R_i$ 是 scoring 所需欄位；$A$ 是 canonical 與 acceptable read-only calls；$E$ 指出 contributing streams；$V$ 則包含 milestones、tolerances 與 protocol conditions。這個式子的實際作用不是增加形式感，而是讓「一個 turn 說了什麼」與「評分器要驗什麼」保持同一個物件。

契約轉換可簡化成：

$$T_k(C;D)=
\begin{cases}
\bigl(U_k(C,z_k),P_k(C)=1\bigr), & z_k=\operatorname{Exec}_D(a_k(C))\\
C, & P_k(C)=0
\end{cases}$$

$D$ 是 normalized read-only store，$P_k$ 是只看 typed fields 的 eligibility predicate，$a_k$ 從現有 contract 建構工具參數，$\operatorname{Exec}_D$ 執行來源 operation，$U_k$ 將受影響的 turns、calls、golds、evidence 與 verifiers 一起更新。predicate 不讀自由文字來猜標籤；false 時記錄 no-op，true 時才套用固定順序的 stage。這裡的 deterministic 是指固定 inputs、rules、runtime 與 environment 下的 construction/scoring 可重現，不是指日後呼叫 hosted model 的新輸出會相同。

### Figure provenance

本 v1 full text 只有一個 material raster figure endpoint；Tables 1–12 是排版表格而非另外可下載的 figure images。因此本文與英文 counterpart 都嵌入同一個 Figure 1，而不假造三張不存在的 original paper figures。

![BTS-AgentBench 論文 Figure 1：由建築 time-series data 經只讀工具、static task 與互動契約，編譯成帶 evidence 的多回合 Agent benchmark episode。](/paperReading/56-bts-agentbench-replayable-telemetry/paper/figure-1-pipeline.webp)

*Figure 1，原論文 Section 2 的「Building telemetry data and metadata」段落，並在 Section 3 作為整體 pipeline overview：讀者應注意左側 source telemetry 如何經 read-only tools 與 contract stages 連到右側的 nearest-lookup episode 與 evidence-backed answer。見 [原始 Figure 1 anchor](https://arxiv.org/html/2608.27334v1#S2.F1) 與 [原始圖片端點](https://arxiv.org/html/2608.27334v1/figure1.png)。arXiv HTML 頁面標示論文為 CC BY 4.0；本地 PNG 轉為 WebP，保留原始 attribution，未將圖改畫成新的 evidence。*

## 用一筆 released row 走完整個方法 / Walk one representative input through the method

下面不是我另造的 toy benchmark，而是 repository 的 `test_timestamp_value_lookup_00051` worked row；它用來說明資料如何流過各層，不能當成額外的統計樣本。完整的 [construction walkthrough](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/CONSTRUCTION_WALKTHROUGH.md) 與 [replay trace](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/examples/REPLAY_TRACE.md) 都保留了這列的 lineage。

1. **Input：固定來源紀錄。** `Site_Caa.zip` 的 `Site_Caa/2254.pickle` 有 stream `c24589e8_a1f3_4529_b409_5a56761c9d20` 的 194,563 筆 observations。它被 metadata 綁到 `BTS_C Zone 005` 的 `Air_Differential_Pressure_Sensor`；2022-02-03 07:03:23.640 UTC 的 value 是 `12.9457`。
2. **Intermediate representation：只讀 runtime。** preprocessing 將 CSV/Brick mapping 與 raw member join 起來，建立 `resolve_point`、exact/nearest `lookup_observation`、`aggregate_window`、`compare_window`、`rank_window` 與 `inspect_quality_window` 等工具。工具回傳值直接來自 DuckDB-backed store 或其 raw lineage，沒有由自然語言猜一個 label。
3. **Static contract：先完成原始查詢。** static row 的第一段呼叫是 `resolve_point(BTS_C, Air_Differential_Pressure_Sensor, BTS_C Zone 005)`，接著 exact lookup 在完整 timestamp 找到 `12.9457`。它同時保存 stream evidence、gold timestamp、gold value、acceptable calls 與 verifier。
4. **Interaction composition：有意識地遮蔽欄位。** episode renderer 把 timestamp 先變成 missing `time_reference` slot，讓初始 operator request 只問「Zone 005 的壓力讀數是多少」。Agent 若提出澄清，simulator 只釋出原本已存在的 `07:03:23.64 UTC on February 3, 2022`，不創造新資料。
5. **Revision and policy：重新執行而非複製舊 gold。** Agent 先完成 exact lookup；後續 request 將公開時間縮成 07:03，runtime 先試 exact，再用 nearest mode 找到同一筆 23.64 秒後的 observation。接著 `inspect_quality_window` 查 2022-01-31 至 2022-02-07 的 week，得到 `observed_fraction=1.0`、`gap_ratio=1.0563` 與 `decision=answer`。最後的 reporting policy 產生 `commitment_action=answer`、`reason=nearest_but_acceptable`，並要求 evidence follow-up 回傳原始 stream。
6. **Output 與可能失敗點。** 正確答案必須說清楚它是 nearest reading，不是 07:03:00 的 exact observation，並附上 stream evidence。若 renderer 沒保留 exact/nearest distinction、window 與 quality phase 沒一起更新，或 Agent 忘了最後的 evidence request，final value 可能看似正確，整列仍會因 contract 或 protocol 不完整而失分。

這個例子把「可重播」拆成三個可檢查的邊界：來源值能否由 raw member 重建、互動的每一個 phase 是否由 typed fields 產生、以及同一套 scorer 是否能對 model trace 給出相同 component scores。它沒有把人工寫作變成安全保證。

## 方法骨架：從遙測到 episode

### 1. Raw-to-static：建立只讀 tool store

BTS 涵蓋三棟建築、約三年資料；paper 將 metadata、raw stream archives 與 Brick graph 對齊，正規化 site、point、equipment、location 欄位，再只提升能對到 raw history 的 points。DuckDB-backed store 物化 raw stream index、每 stream quality statistics、daily/weekly/monthly aggregates、calendar profiles 與 stream previews。缺失 observation 不會被補值；它會影響 coverage 與 quality policy。

候選 builder 以固定 eligibility predicates 建立九個 task families：point disambiguation、day mean lookup、relative 24h mean lookup、window mean lookup、window pairwise compare、window rank、timestamp value lookup、timestamp nearest lookup、quality gate。aggregate 候選低於 corpus 10th-percentile coverage floor，或高於 site/class 99.5th-percentile absolute-mean cap，就被移除；pairwise 與 rank 需要正 margin，nearest lookup 在 offset 相等時固定選較早 observation。這些是 task construction rules，不是 BTS 原始資料本身定義的 task。

| 靜態任務 family（Table 1） | 候選空間 | Retained |
| --- | ---: | ---: |
| Point lookup / disambiguation | 4,263 | 60 |
| Day mean lookup | 2,193,431 | 60 |
| Relative 24h mean lookup | 2,193,431 | 60 |
| Window mean lookup | 315,929 | 53 |
| Window pairwise compare | 5,989,083 | 60 |
| Window rank | 1,084 | 60 |
| Timestamp value / nearest lookup | 2,123 / 2,123 | 60 / 60 |
| Quality-aware reporting | 315 | 59 |
| **Total** | — | **532** |

### 2. Static task 到 episode：計算、契約、surface 三層分離

每列 static task 已經固定 source operation、arguments、tool-derived result、contributing streams、acceptable alternatives 與 gold contract。episode compiler 再從 finite interaction grammar 選出適用的 phases。Table 3 的 phase vocabulary 包含：

| Phase | 評測要驗什麼 |
| --- | --- |
| Clarification | 是否在查詢前取得缺少的 site 或 time context |
| Initial answer | 是否以只讀工具執行來源 telemetry task |
| Goal revision | 是否在新目標中重用已解析的 state |
| Timestamp policy | 是否區分 exact、nearest 或時間不夠精確 |
| Quality commitment | 是否依 coverage/gap evidence answer 或 abstain |
| Rationale follow-up | 是否解釋品質或 reportability 決定 |
| Evidence follow-up | 是否回傳支持答案的 stream、point、timestamp 或 aggregate |

compiler 可以從固定欄位產生「同一 signal」「下一天」「第二個月的 winner」等 bounded references；沒有 language model 在 construction 階段選 mode、改寫 prompt 或填 missing value。simulator 的 state 包含 pending clarification slots、initial-answer flag、revision index 與 post-answer index；tool-call messages 不會自行推進 user state，只有 matching clarification 才會釋出被遮蔽的 typed value。

### 3. Coupled update：修補互動契約，但不覆寫來源

論文對每個 typed stage 要求三件事同時成立：

- **Source preservation**：未受影響的 static phases、stream bindings 與 split 必須維持。
- **Execution grounding**：新增的 value、timestamp、aggregate 或 quality statistic 必須等於 `$z_k` 或明確的 deterministic policy function。
- **Discourse alignment**：rendered turn、prior state、tool path、gold fields、evidence 與 verifier 描述同一個 operation。

因此，一個 surface-only wording normalization 可以只動文字；但若 timestamp 或 window 改變，舊的 gold 不能直接複製，必須重新執行 runtime。每個 stage 會留下 before/after contract summary、status 與 ordered history，讓 replay report 能指出哪一層改了什麼。

### 4. Controller-aware acceptance：用 shortcut 找 construction 漏洞

release 前有兩個不同性質的檢查。第一是 contract preflight：檢查 phase/turn cardinality、final-phase linkage、required verifier fields、rendered gold 是否被 scorer 接受、timestamp/quality-window 與 runtime 是否一致、derived commitment、evidence identifier 與 prompt-phase alignment。BTS 的 532 筆都得到 0 findings；這只表示 declared executable contract 通過。

第二是 construction-exclusion controller。它是 bounded parser 加 explicit site/stream state 的 rule-based controller，會真的呼叫 model-facing read-only tools，再用同一個 evaluator 評分；沒有 learned parser 或 LLM。release 條件要求它不能完成任何 row，所以 BTS 是 0/532（test 0/89），XAI4HEAT 是 0/41。報告的 first blocking layers 是 353 筆 parse/binding failure、127 筆 phase-completion failure、52 筆 required-tool process failure；這些數字應讀成 controller audit 的診斷，不是「資料集有多難」的 ground truth。

## Replay 到底保證了什麼？ / What the replay claim means

Paper 的 strongest construction evidence 在 Appendix A 與 Table 7。兩個獨立 preprocessing execution 都由 checksummed BTS raw archives、保留的 normalized catalog 與 532-entry selection contract 開始；11 個 sorted logical tool-store exports 全部相同。接著兩次完整 episode build（另加從獨立 store 的 build）逐筆重現 356/87/89 rows，涵蓋 turns、calls、phase/final golds、evidence、verifiers、generation history、provenance、row order 與 serialization。

這個 guarantee 的 scope 是固定 inputs 與 pinned environment。DuckDB container bytes 不一定要一樣，因為物理布局不是 canonical serialization；paper 比較的是 logical exports 與最終 JSONL bytes。Hosted provider 的新呼叫不在 replay boundary 內，因為 provider service、prompt route、output cap 或 model behavior 都可能改變。Repository 另保存 267 筆 BTS retained traces，可 deterministic rescore，但這不是 repeated-call variance 的估計。

## 評測如何讀：資料、對照、指標與模型

### 評測設定

主要 BTS test split 有 89 rows，來自 9 個 families；三個 frontier LLM 各對每列呼叫一次：GPT-5.5 透過 OpenAI direct、Gemini 3.1 Pro 與 Claude Opus 4.7 透過 OpenRouter。三者共用 released rows、deterministic user simulator、read-only tools、one-tool-per-turn loop、stopping protocol 與 scorer，但 provider route、output cap、seed support 與 family guidance 有差異。實驗 environment 記錄 Python 3.11.11、DuckDB 1.5.0、NumPy 1.26.4、pandas 3.0.1、PyArrow 23.0.1 與 RDFLib 7.6.0；raw replay 約需 19 GB compressed archives 及額外 tool-store 空間。

對照不只有三個模型。construction-time controller 是排除 shortcut 的 audit；model trace 的 deterministic scorer 則拆出 final、evidence、phase、task 與 protocol。`accomplished` 需要 `task_ok AND protocol_ok`，所以一個初始 telemetry value 對了，仍可能因 clarification、goal revision、品質承諾或 evidence follow-up 缺失而不是完成。

### Table 5：family 結果不是一張模型排行榜

| Family | Rows | GPT-5.5 | Gemini 3.1 Pro | Claude Opus 4.7 |
| --- | ---: | ---: | ---: | ---: |
| Point disambiguation | 10 | 8/10 | 5/10 | 6/10 |
| Day mean lookup | 10 | 10/10 | 8/10 | 7/10 |
| Relative 24h mean lookup | 10 | 10/10 | 9/10 | 9/10 |
| Window mean lookup | 10 | 9/10 | 10/10 | 7/10 |
| Window pairwise compare | 10 | 6/10 | 5/10 | 5/10 |
| Window rank | 10 | 8/10 | 5/10 | 4/10 |
| Timestamp value lookup | 10 | 9/10 | 10/10 | 5/10 |
| Timestamp nearest lookup | 10 | 10/10 | 10/10 | 7/10 |
| Quality gate | 9 | 9/9 | 9/9 | 8/9 |
| **Overall** | **89** | **79/89 (88.8%)** | **71/89 (79.8%)** | **58/89 (65.2%)** |

**這個實驗問什麼？** 在固定 release 與 simulator 下，Agent 是否能完成來源查詢與所有 interaction obligations？**控制了什麼？** rows、工具、simulator、one-tool-per-turn、stopping protocol 與 scorer；變的是 model route、prompt profile 與 model output。**觀察到什麼？** 直接 lookup 與 aggregation 的 cells 多在 90–100%，pairwise、rank、point disambiguation 明顯較低。**可能的解釋？** 後三者需要跨回合 state、比較／排序欄位與 evidence closure，而不是只抄回一個 value。**不能推出什麼？** 每個 model 只有一次 retained execution，未測 repeated-call variance；不同 provider 的 configuration 也不適合當成完全同質的 head-to-head leaderboard。這些解讀對應論文 Section 6.3、Section 7.1、Table 5。

### Table 6：為什麼 final score 不夠

| Model | Final | Evidence | Phase | Task | Protocol |
| --- | ---: | ---: | ---: | ---: | ---: |
| GPT-5.5 | 0.978 | 0.955 | 0.949 | 0.965 | 86/89 |
| Gemini 3.1 Pro | 0.921 | 0.955 | 0.939 | 0.957 | 81/89 |
| Claude Opus 4.7 | 0.903 | 0.933 | 0.875 | 0.927 | 81/89 |

Final 是 final-phase fields 的 row-level macro-average；Evidence 是 89 個 evidence-bearing rows 的 required-stream coverage；Phase 是 ordered phases 的通過比例；Task 綜合 core answer、grounding、temporal 與 phase；Protocol 則檢查 clarification、revision、rationale/evidence、tool error、empty message、nontermination 等互動問題。這個拆分讓 benchmark 能定位「答案字串對了，但 evidence 沒關閉」的 near-success，而不是將所有錯誤壓成一個最後分數（論文 Section 7.2、Table 6）。

論文 Appendix B 的四個 retained cases 具體展示這件事：`QG-00051` 是三個模型都完成的 quality-gate consensus success；`PD-00003` 中 GPT-5.5 完成，但 Gemini 少了早期 stream grounding、Opus 少了後段 phase decision；`WR-00009` 三個模型都產生 abstain，卻在 evidence follow-up 或 quality commitment 上失敗；`WP-00044` 三者都做出高層次 abstain，但各自漏掉 comparison fields 或 cue。這些是固定 trace 的 failure localization，不是模型能力的普遍定理。

## XAI4HEAT portability：重用的是 downstream path，不是萬用轉接器

XAI4HEAT 是第二個連續遙測 corpus，但 source boundary 不同：它提供 row-oriented SCADA tables、heating-area metadata 與七個 channel columns，而 BTS 是 per-stream ZIP histories 加上 graph-derived metadata。repository 的 `xai4heat.py` 只負責 corpus-specific mapping，把 `t_amb`、`t_ref`、`t_sup_prim`、`t_ret_prim`、`t_sup_sec`、`t_ret_sec`、`delta_e` 映射成 common `site_id / stream_id / point_class / equipment / timestamp / value` fields。

在這個 mapping 之後，作者重用同一套 tool-store construction、五個適用的 single-stream temporal families、clarification、episode lifting、contract preflight、controller audit、runner protocol 與 scorer。point disambiguation、pairwise、rank、standalone quality-gate 沒有被悄悄宣稱支援，因為 XAI4HEAT 的 schema 沒有 BTS 同樣的 ambiguity 與 candidate-group 結構。最終得到 204 rows，split 是 132/31/41；held-out `XAI4HEAT_L17` 的 controller 為 0/41，而 retained GPT-5.5 為 41/41（論文 Section 7.3、Appendix D、Table 12）。

**這個實驗問什麼？** corpus-specific adapter 是否能讓同一個 downstream construction/evaluation topology 在第二個連續 telemetry schema 上執行？**控制了什麼？** shared tools、phases、scorer 與 held-out-site protocol；改變的是 adapter、source identifiers、domain wording、values 與 supported family subset。**觀察到什麼？** 204 筆可以建立，41 筆 held-out test trace 全部由 retained GPT-5.5 完成。**合理解釋？** shared contract topology 確實能在兩個被測的 telemetry corpora 間重用。**不能推出什麼？** 不能推出 arbitrary event logs、incident narratives、manufacturing state transitions 或 write-side tools 只要換一個 mapping 就能套用。

## 證據地圖：Paper、Evidence 與 Bloss0m judgment

### Paper directly supports

- 作者提出從 normalized raw telemetry 到 static tasks、typed interaction contracts、operator-facing episodes 與 evidence-grounded verifiers 的 deterministic construction method（Sections 3–4）。
- BTS release 有 532 rows、九個 families、356/87/89 split；contract preflight 為 0 findings，兩次獨立 build 對上 11 個 logical exports 與 release bytes（Table 7、Appendix A）。
- construction-exclusion controller 在 BTS 0/532、XAI4HEAT test 0/41；三個 BTS model runs 與一個 XAI4HEAT GPT-5.5 retained run 的數字如 Table 5、Table 12 所示。

### Author interpretation

- Real telemetry 可作為 raw-to-static task compilation 與 multi-turn benchmark construction 的 substrate。
- XAI4HEAT 結果支持的是在兩個 evaluated telemetry corpora 間的 downstream reuse；結構不同的 event/state-transition logs 需要新的 tools、families 與 evaluators。
- controller-aware acceptance 是 construction hardening signal；zero controller accomplishment 只表示 declared exclusion criterion 被滿足。

### Not established

- 沒有證明 benchmark task construction 能預測 production operator behavior、deployment safety 或 physical-control correctness。
- 沒有證明 GPT-5.5 在所有 telemetry 或 Agent tasks 都優於其他 model；89 rows、一次呼叫、provider configurations 不同。
- 沒有證明「deterministic」包含 hosted model generation，也沒有證明兩個 corpus 以外的資料具有相同 transfer property。

### Bloss0m 工程化整理

以下四條是我根據 paper 的 boundary 整理出的工程讀法，不是作者另提出的 production framework：**(1)** 先把來源 operation 與 evidence 寫成可重跑的 contract，**(2)** 把 interaction surface 當成 typed transformation 而非自由生成對話，**(3)** 對每一個新增 phase 做 runtime re-execution 與 coupled update，**(4)** 將 controller 當成 construction audit 而不是 difficulty oracle。這個整理可以幫助設計離線 benchmark，但不應被讀成可直接授權現場操作的安全規格。

## 限制、失敗模式與不支持的解讀 / Limitations and failure modes

論文自己把範圍收得很窄，這反而使結果比較誠實：

- **只讀 scope**：評估的是 building-telemetry search、aggregation、comparison、ranking、timestamp reportability 與 quality-aware reporting；不包含 write-side control、安全關鍵致動、maintenance planning 或 long-horizon troubleshooting（論文 Section 8、Limitations、Ethical Considerations）。
- **有限互動**：deterministic user turns 與 bounded episodes 有助於自動評分與 trace analysis，但降低了語言多樣性與真實 operator conversation 的 messy state。
- **資料與外部效度**：目前只用了 BTS 與 XAI4HEAT 兩個 continuous telemetry corpora，且 final release 沒有 systematic domain-expert audit；不能把 candidate pool 或 model counts 解讀成產業 prevalence。
- **模型證據有限**：每個 model-row 只 retained 一次 provider invocation；temperature、output cap、seed support、prompt profile 與 route 存在 provider-compatible 差異，沒有 repeated-call variance、成本敏感度或更大模型族群的統計區間。
- **controller 不是 oracle**：0/532 的條件刻意要求 controller 不完成 row；failure analysis 仍顯示 parser/binding、phase completion 與 tool process 等不同 blocking layers。把它說成「任務不可能被規則方法完成」會超出證據。
- **可攜性需要 adapter**：XAI4HEAT 只重用五個 family；event causality、incident narrative、action side effects 或 manufacturing state transitions 會需要新的工具、契約與 evaluator，不是 configuration-only portability。

因此，不應把 Table 5 的較高 accomplished rate 寫成 production superiority，也不應把 exact replay 寫成 source data validity。它們各自回答的是：固定 release 是否被完成、以及 construction 是否可重建。

## Artifact 與可重現性 / Artifacts and reproducibility

以下是截至 **2026-09-17** 的獨立 endpoint 檢查與 repository artifact 讀取結果：

| Artifact | 狀態與可用範圍 |
| --- | --- |
| [官方 BTS-AgentBench repository](https://github.com/kjy7567/BTS-AgentBench) | 可存取；目前 shallow clone 的 release commit 是 `ecc80721f3da941cda611bab041a054cfa8d79e6`（2026-08-27）。Repository 含 construction code、static tasks、532 episodes、204 XAI4HEAT episodes、retained traces、replay reports 與 runners。 |
| [`dist/source.zip`](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/dist/source.zip) / [`dist/dataset.zip`](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/dist/dataset.zip) | 可下載；repository 的 `verify_packaged_release.py --dist-dir dist --require-bundles` 實際通過，核對 532 BTS rows、204 XAI4HEAT rows、267 BTS model traces、41 XAI4HEAT traces 與 bundle checksums。這是 packaged-release verification，不是 raw-to-episode full replay。 |
| [BTS Figshare article](https://doi.org/10.6084/m9.figshare.28705559.v3) | 可存取；三個 raw ZIP 的 direct Figshare download endpoints 可回應 redirect，總 compressed size 約 19 GB。Repository 不重新散布 raw archives，所以沒有下載這些檔案就不能從 clone 單獨完成 full replay。 |
| BTS metadata 與 normalized catalog | Repository 內的 CSV、Brick TTL 與 checksummed Parquet 可讀；raw payload 與 catalog mapping 仍受上游 attribution 與 license 約束。 |
| Code / documentation / benchmark artifacts | Repository `LICENSE` 將 source code、scripts、runners 放在 MIT；benchmark artifacts、reports、provenance 與 documentation 依檔案說明採 CC BY 4.0。Raw BTS data 仍以 Figshare 的 upstream CC BY 4.0 為準；redistribution 前必須保留 attribution。 |

可行的最小 reproduction 是：先取得三個正確檔名的 BTS archives，驗證 `DATA_SOURCES.md` 的 SHA-256，再安裝 Python 3.11.11 與 pinned dependencies，執行 `make replay RAW_DIR=/absolute/path/to/BTS_RAW_ARCHIVES`，最後比對 11 個 logical exports、fixed selection identities、static/episode split hashes 與 controller audit。若沒有 raw archives，仍可以執行 package verifier、閱讀 release rows、重算 retained model traces（需相容 tool store），但不能把這條路徑稱為從來源到 release 的完整再現。

## 工程判斷與不適用條件 / Engineering decision and when not to use it

### 什麼時候值得採用

對於 **離線、只讀、資料來源固定、答案可以由 deterministic runtime 重算** 的 telemetry benchmark，這個 construction pattern 有三個實際優點：

1. source computation、interaction obligations 與 evidence IDs 有明確邊界，變更 prompt surface 時比較容易知道哪裡需要重新執行。
2. split、selection identity、tool outputs 與 phase gold 可在 release 前做 preflight 和 replay，而不是等模型結果出現才猜資料是否漂移。
3. final score 之外還保留 phase、evidence、task 與 protocol failure，能區分「值查對了」和「整個操作契約完成了」。

這裡的建議是 **Bloss0m engineering interpretation**，不是 paper 宣稱的 universal recipe。若採用，應把 read-only scope、corpus-specific family subset、artifact version、source-data license、runtime version 與 replay boundary 寫進自己的 release contract。

### 什麼時候不要用這篇結果做決策

不要用 BTS-AgentBench 直接替寫入設備、physical actuation、maintenance scheduling、incident response 或 safety-critical authorization 做 sign-off。它沒有測工具副作用、權限、rollback、human escalation、設備狀態轉移或長時間操作；「benchmark 有 evidence follow-up」也不等於現場 action 可被授權。

也不要把它當成任意資料型態的轉換器。若來源是 incident event log、需要跨事件因果、會改變外部 state，或 operator 語境本身沒有 bounded contract，就要另建工具、phase vocabulary、evaluator 與 domain audit。最後，若真正目標只是比較模型的 final answer，應先確認是否願意承擔 interaction-contract construction、replay storage 與 source-license 維護成本；這篇 paper 的額外價值正是那些不在 final answer 裡的層次。

## 讀完後的三個記憶點 / Three things to remember

1. **技術想法**：BTS-AgentBench 把 read-only telemetry 編譯成 static executable task，再用 typed contract 增加有限互動；surface 改變不應偷換 source computation。
2. **最強證據**：兩次獨立 raw-to-episode build 對上 11 個 logical exports 與 356/87/89 release，並通過 0-findings preflight；這支持 construction replay，不支持 production safety。
3. **採用邊界**：兩個 continuous telemetry corpora 的結果不能代表 arbitrary logs、寫入控制或物理現場；模型結果是固定 89-row、一次呼叫的 benchmark traces，必須保留 uncertainty。

## 下一步閱讀 / Next reading

若你要把「benchmark 怎麼建」接到「Agent 怎麼被觀察與審核」，可以接著讀 [Parsing the Stream：長程 Agent 不只需要記憶，還需要一個可審計的 live state](/paper-reading/43-parsing-the-stream-live-trace/)，理解 typed trace 如何服務 worker 與 observer；再讀 [Real-Time Detection and Repair of LLM Agent Failures](/paper-reading/14-agent-trajectory-sentinel/) 看另一條 runtime failure-detection 路徑。若你的焦點是 operational tool-use 與 task evaluation，則可對照 [ContextWeave：長程 Agent 的真實工作流評測](/paper-reading/09-contextweave-workflow-benchmark/)；這些內部連結是概念延伸，不是把不同 scope 的結果合併成同一個 benchmark。

## Primary sources

- [BTS-AgentBench arXiv v1 full text](https://arxiv.org/html/2608.27334v1) · [arXiv record](https://arxiv.org/abs/2608.27334) · [v1 PDF](https://arxiv.org/pdf/2608.27334v1)。arXiv HTML 標示本文為 CC BY 4.0；本文只重用其唯一 material Figure 1，並保留 attribution。
- [BTS-AgentBench official repository at the inspected release commit](https://github.com/kjy7567/BTS-AgentBench/tree/ecc80721f3da941cda611bab041a054cfa8d79e6) · [replay report](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/replay/release_replay_report.json) · [artifact map](https://github.com/kjy7567/BTS-AgentBench/blob/ecc80721f3da941cda611bab041a054cfa8d79e6/ARTIFACTS.md)。
- [BTS: Building Timeseries Dataset: Raw, Figshare v3](https://doi.org/10.6084/m9.figshare.28705559.v3) · [upstream DIEF_BTS repository](https://github.com/cruiseresearchgroup/DIEF_BTS) · [CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/)。
- [XAI4HEAT source publication](https://doi.org/10.1016/j.dib.2025.111320)，作為論文 Appendix D 的第二個 telemetry corpus 背景；本閱讀不把它的資料條款改寫成 BTS-AgentBench repository 的 redistribution permission。
