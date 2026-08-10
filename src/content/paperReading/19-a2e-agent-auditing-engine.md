---
title: "A²E：把 Agent 評測變成可追蹤、可重評的稽核引擎"
description: "精讀 A²E：以 ATP 統一 benchmark 與 agent harness，用 span-based trace 保存執行因果，再以 lifecycle-aligned metrics 分析正確性、工具行為、成本與安全。"
pubDate: 2026-08-11
updatedDate: 2026-08-11
tldr:
  - "A²E 的主張不是單一 agent framework 比另一個更強，而是同一個模型在不同 harness 上會產生不同的工具、狀態與成本行為，評測系統必須保存整條 trajectory。"
  - "它把 Task、Monitor、Evaluation 分成三層：ATP 對齊 benchmark 與 harness，OpenTelemetry-style spans 保存執行結構，資料庫則讓新 metric 或 judge version 重新評估既有 trace。"
  - "Table 1 的 1,035 次 scored runs 與 Table 2 的案例很有診斷價值，但 sample size、模型/endpoint、judge calibration 與表格內部矛盾都限制了跨 harness 的強結論。"
audience:
  - "負責 agent evaluation、observability、平台治理與 benchmark harness 的 AI 工程師"
  - "需要把 correctness、tool use、latency、token cost 與 safety 放入同一條可稽核軌跡的技術負責人"
tags: ["Paper Reading", "Agent Systems", "Evaluation", "Observability", "AI Engineering"]
image: "/paperReading/19-a2e-agent-auditing-engine/title_image.webp"
field: "AI Engineering"
difficulty: "intermediate"
showToc: true
paper:
  title: "An End-to-End Agent Auditing Engine"
  authors:
    - "Haoning Wang"
    - "Mingxun Zhang"
    - "Chenyue Yu"
    - "Yingjun Shang"
    - "Xia Hu"
    - "Guanchu Wang"
    - "Na Zou"
  year: 2026
  venue: "arXiv 2608.07346 v1 (2026-08-07; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.07346v1"
    arxiv: "https://arxiv.org/abs/2608.07346"
    code: "https://github.com/datamllab/A2E"
series:
  id: "agent-auditing"
  title: "Agent Auditing"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文 / The paper in 90 seconds

- **問題：** Agent 最後答對，不代表它走了可靠、便宜或安全的路徑；最後答錯，也不代表你知道問題出在 planning、tool use、memory、judge 或 runtime。若每個 harness 自己存一份文字 log，就很難跨 framework 比較，也很難在新 metric 出現時重評既有 trajectory。
- **核心想法：** A²E 將 Task、Monitor、Evaluation 分成三層。Agent Task Protocol（ATP）把 benchmark 的 task 與 harness 的執行介面分開；Monitor 將 model calls、tool calls、state 與錯誤組成有 parent-child 關係的 trace；Evaluation 用 lifecycle-aligned taxonomy 把 process、outcome 與 runtime 指標放在一起。
- **最重要證據：** 實驗涵蓋 23 個 benchmark、9 個 harness、每個 cell 5 個 task，共 1,035 次 scored runs；同一個 DeepSeek-V4-pro FP4 backbone、inference config、tool setup、step limit 與 timeout 被固定。Section 6.2/6.3 報告 harness 間的 success-rate gap 可達 GDPVal 0.20、MMLU-Pro 0.30、tau³-bench 0.66。
- **主要邊界：** 這是平台架構與診斷框架的 demonstration，不是對九個 harness 的普遍排名。Table 2 的 prose 與顯示的 `task_succeeded`/`correctness` 數值互相矛盾；paper commit、judge calibration、API 變動與 component-level ablation 也不足以支持強因果結論。

## 先知道什麼 / What to know first

Agent evaluation 至少有三個不同問題：

1. **Outcome：** 最終答案是否正確、task 是否完成。
2. **Process：** agent 如何規劃、呼叫工具、使用 memory，以及在哪一步偏離目標。
3. **Runtime：** 花了多少 token、時間與金錢，是否有安全或 prompt-injection 風險。

只記 final answer 會丟失 process 與 runtime；只記平坦 log 又會丟失因果關係。A²E 的設計選擇是把一次 run 保存成 TaskTrace，再用 span tree 描述 model call、tool invocation 與 workflow operation 的順序和父子關係。這個問題與 Bloss0m 的 [OSWorld-style agent evaluation 精讀](/paper-reading/08-osreward-agent-evaluation) 和 [Agent Trajectory Sentinel 精讀](/paper-reading/14-agent-trajectory-sentinel) 相鄰：前者提醒評測 protocol 會改變 agent 行為，後者則把 trajectory 變成 runtime failure detection 的觀測面。

## 既有方法為什麼不夠 / Why the previous approach is insufficient

只把一條 agent trajectory 壓成 final-answer score，會隱藏工具選擇、狀態累積、失敗位置與 runtime cost；把各 framework 的平坦文字 log 分開保存，又很難比較與重新評估。A²E 的 prior limitation 是觀測與評測沒有共同的 lifecycle-aligned schema，而不是單純缺少更多分數。

## 核心直覺 / Core intuition

傳統 benchmark 常把一個 agent run 壓成一個分數：成功是 1，失敗是 0。但在平台工程裡，兩個同分的 run 可能完全不同：一個三輪完成、四次 LLM call、三次 tool call；另一個反覆嘗試、耗掉十倍 token，最後仍沒有解決問題。A²E 的 mental model 是：

**Task 建立可比較的輸入 → Monitor 保存有因果的 trajectory → Evaluation 把同一條 trajectory 投影到不同 metric。**

最關鍵的分離是「重新評估不必重新執行 agent」。只要 TaskTrace 與 spans 被結構化保存，新加入的 metric、不同 judge model 或不同 aggregation policy 可以讀取既有資料庫紀錄。這會把昂貴的 agent execution 與較便宜的 metric iteration 解耦。

> **花花的工程提醒**
>
> trace 不是把所有文字塞進資料庫。要能回答「哪個 action、由哪次 model call 觸發、花了多久、結果如何、之後用哪個 metric 重評」。沒有 parent-child、version 與 run metadata，log 量再大也不等於可稽核。

## 走一個例子 / Worked example

先看 paper 的 tau³-bench case study，而不是把表格當成無瑕疵 ground truth。相同的 GLM-5.2 API model、相同 task 與初始環境，LangGraph 與 CrewAI 產生了兩條很不一樣的 trajectory：

1. **Input：** 相同的 customer-support task，要求 agent 找到 suspended-line 的根因並採取 recovery path。
2. **Trace：** LangGraph 路徑記錄 3 turns、4 LLM calls、3 tool calls、10,122 total tokens；CrewAI 記錄 5 turns、9 LLM calls、5 tool calls、96,704 total tokens。
3. **Decision path：** LangGraph 先檢查狀態、reseat SIM、再次確認 signal，然後轉向 account-level diagnosis；CrewAI 仍在 device-level recovery，依序嘗試 APN、reboot 與 airplane-mode 等操作。
4. **Evaluation projection：** 同一條 trace 可以被投影成 correctness、task completion、tool invocation、plan alignment、token usage、latency、hallucination、privacy leakage 與 harmful action 等不同維度。
5. **Failure point：** 這個案例的可教之處是 execution path 與 cost 的差異；但 Table 2 的展示同時在兩欄寫出 `task_succeeded=1.0, correctness=0.0`，與 prose 對 LangGraph correctness 1.0、CrewAI correctness 0.0 的描述衝突。因此應把它當作診斷示例，不能當成已清理的標準答案。

## 技術機制 / Technical mechanism

### 1. Task layer：ATP 對齊 benchmark 與 harness

Section 4.1 將 benchmark adapter 的責任與 agent harness 的責任隔開。adapter 建立 `TaskInput` 與 `AgentBinding`；前者保存 instruction、state、expected action/output、metadata 與 optional sandbox specification，後者提供 tool schema、tool execution 與 prompt construction。`AgentRunner` 接受 binding，執行 task，並回傳 `TaskTrace`。

Section 4.2 列出 23 個 benchmark，分成 coding、conversational、research、computer-use 四個 task area；registry 有 Agno、AutoGen AgentChat、CrewAI、Google ADK、LangGraph、LlamaIndex、OpenAI Agents SDK、Smolagents 與 Anthropic Python SDK 的 harness。作者也明說 registry support 不等於每一個 framework–benchmark pair 都通過 end-to-end validation。

### 2. Monitor layer：把事件變成有結構的 trace

Section 3.1–3.2 的 semantic、span、SDK 三層把 framework-specific call 對齊成可比較的操作。OpenTelemetry-style span 保存 start/end time、status、context、trace identity 與 parent-child relation；高層 agent span 可以包含 reasoning chain、model call 與 tool invocation。

`TaskTrace` 本身保存 run status、turn count、ordered tool calls、final answer、elapsed time 與 raw framework output。這個雙層設計很重要：normalized record 便於比較，span tree 則保留執行因果與定位延遲/失敗所需的細節。

### 3. Evaluation layer：按生命週期拆 metric

Section 5.1 把指標分為四個 stage：Reasoning（Task、Flow、Logical）、Action（Tool、Skill、Memory）、Final Answer（Answer Correctness、Task Completion）與 Runtime Quality（Efficiency、Safety）。Metric implementation 可以是 LLM judge、deterministic rule、environment verifier 或 aggregation function；「在哪個 stage 評估」與「怎麼計算」分離。

Section 5.2–5.3 的 database-backed design 是可操作的工程重點。Run、turn、tool call、error、resource usage 與 metric result 有結構化關係；新的 metric version 或 judge model 可以直接 query 已保存的 trace，不必重複 API call。這也讓 re-evaluation、aggregation、audit 與 experiment provenance 有共同基礎。

## 如何讀證據 / How to read the evidence

### Table 1：跨 harness 的 correctness 差異

**問題與控制：** Table 1 在 23 個 benchmark 上比較 9 個 harness，每個 harness–benchmark cell 取 5 個 task，共 1,035 scored runs；同一 DeepSeek-V4-pro FP4、inference configuration、tool setup、step limit 與 timeout 被固定，19 個 non-sandbox benchmark 的完整 trace 進一步用於 Figure 6。**觀察：** 各 harness 的平均 correctness 約落在 LangGraph .58、CrewAI .57、Google ADK .57、AutoGen .58、Smolagents .63、Agno .68、LlamaIndex .64、Claude AS .58、OpenAI Agents .58。**解釋：** 即使 model backend 固定，harness 的 prompt construction、state management 與 control loop 仍可能改變結果。**邊界：** 每格 5 個 task 太小，且 benchmark、provider、judge 與 framework version 的交互作用不能被平均分數消除；不要把平均值當成穩定排行榜。

### Figure 7 / Section 6：成功率與成本一起看

**問題與控制：** 作者用同一個 GLM-5.2 API model 比較九個 harness 在三個 benchmark 的 success rate 與 completion tokens。**觀察：** success-rate gap 在 GDPVal、MMLU-Pro、tau³-bench 分別達到 0.20、0.30、0.66，token consumption 也有明顯差異。**解釋：** harness 不只是 wrapper；tool interaction、prompt/state accumulation、termination policy 都可能把相同模型轉化成不同 agent。**邊界：** 這個對比不是對每個 harness component 的 ablation，也沒有證明某個 harness 在所有 task 上都更有效率。

### Table 2：診斷示例與資料矛盾

**問題：** 同一模型、task、environment 下，能否從 trace 看出「為何一條路徑成功而另一條失敗」？**觀察：** prose 與 Table 2 將 LangGraph 描述為找到 account-level cause、3 turns/4 calls/3 tools/10,122 tokens；CrewAI 則用了 5 turns/9 calls/5 tools/96,704 tokens，仍停在 device-level troubleshooting。**解釋：** 這很適合說明 execution-aware metrics 比 final answer 更能提供 repair signal。**邊界：** 表格同時列出兩欄 `task_succeeded=1.0, correctness=0.0`，與後文寫 LangGraph correctness 1.0、CrewAI 0.0 不一致。這個 inconsistency 應進入 reader 的 evidence ledger，不能被順手修成作者未明說的真相。

### Failure, calibration, and transfer questions

論文有 failure-oriented case study 與 cost/token analysis，但沒有完整的 component-level ablation、跨 model provider 的 calibration study、不同 judge version 的 agreement、subgroup fairness 或長期 transfer evaluation。它也提醒 sandbox benchmark 需要 container image、dataset 與 execution environment；因此從 19 個 non-sandbox 的 full traces 推到所有 23 個 benchmark，仍需保守。

### Limitations 與 unsupported interpretations

這些 limitations 要直接寫入 evaluation ledger：A²E v1 不能支持九個 harness 的普遍排名，不能把 taxonomy 當成 safety guarantee，也不能從單一案例推導 harness component 的因果效果。sample size、judge calibration、provider/version drift、sandbox coverage 與 Table 2 的數值矛盾，都需要在採用前獨立重跑或人工核對。

## 證據地圖 / Evidence map

- **論文直接支持：** Task/Monitor/Evaluation 三層架構、ATP 物件、span-based trace、lifecycle metric taxonomy、資料庫重評能力、23 benchmarks、9 harnesses、1,035 scored runs 與 Table 1/2/Sections 4–6 的數字。
- **作者的解讀：** 固定 model backend 後仍存在 harness-level effectiveness 與 efficiency 差異；execution-aligned evaluation 可幫助定位 planning、tool choice、resource usage 與 termination failure。
- **尚未建立：** 沒有足夠證據聲稱平均 correctness 是普遍排名；沒有獨立 judge calibration、完整 component ablation、跨 provider/版本的重現矩陣，也沒有把 platform metric 直接等同於安全或 production reliability。
- **Bloss0m 工程判斷：** A²E 最值得採用的是 trace/evaluator data model，而不是照抄表格中的平均分。先把 run identity、model endpoint、tool schema、prompt version、judge version 與 cost metadata 固定，再把 metric 結果當成可重算的 view。

## Artifact 與可重現性 / Artifacts and reproducibility

截至 **2026-08-11**，作者的 [A²E repository](https://github.com/datamllab/A2E) 可直接連線，包含 `task`、`monitor`、`eval`、`server`、`example`、`script`、`ui` 與文件。README 提供 local server、CLI experiment、dataset/harness/evaluator registry 與 OpenTelemetry/OpenInference trace 方向；可用於 source inspection 與 smoke setup。完整 paper experiment 仍是 conditional：需要 provider/API keys、相同 model endpoint 與 inference settings；sandbox dataset 需要 Docker 與 1–3 GB image，且 dataset version、judge prompt、paper commit 與成本狀態沒有在本次審核中被固定成可下載 release bundle。

因此重現紀錄至少要保存：repo commit、benchmark adapter version、sample seed、每 cell 的 task ids、harness/framework version、model endpoint、prompt/config、tool setup、step limit、timeout、sandbox image、judge version、raw trace 與 metric output。若只跑 README 的範例，不應稱為重現 Table 1。

## 工程判斷與不適用條件 / Engineering decision and when not to use it

**值得使用的情境：**

- 你需要跨 LangGraph、CrewAI、OpenAI Agents SDK 或自建 harness 比較同一 benchmark，且要保存 tool、turn、latency、token 與 error evidence。
- 你想把 correctness、task completion、tool recall、safety 與 cost 做成不同 evaluator，而不是把一切壓成單一 LLM judge 分數。
- 你希望新 metric 或新 judge 能重評既有 traces，避免每次改 rubric 都重新支付 agent execution cost。

**不要直接套用的情境：**

- 你只有 final answer，沒有 ordered tool calls、state、model call、version 與 timing；A²E 的診斷價值需要 trajectory evidence。
- 你要從 5-task cells 做 framework 的長期 production ranking；sample size、版本漂移與 task mix 不足以支撐這個推論。
- 你的 system 依賴安全或高風險決策，卻沒有 judge calibration、deterministic verifier、human review 與 failure escalation。taxonomy 本身不是安全保證。
- 你的 sandbox、dataset、API provider 或 model endpoint 不同於論文；此時應建立自己的 run manifest 與 transfer study，不要複製 Table 1 的平均數。

實作上，可以先建立不可變的 `RunManifest` 與 normalized `TaskTrace`，再把 evaluator 寫成讀 trace 的純函式或版本化 job。先驗證同一條 trace 在不同 metric version 下可得到可追溯差異，再擴充 benchmark registry；最後才做跨 harness 的比較儀表板。

## 三個要記住的點 / Three things to remember

1. **技術想法：** agent evaluation 應把 task input、execution trace 與 metric projection 分層，讓「重新評估」不必重新執行 agent。
2. **證據：** 固定 model backend 仍看得到 harness 對 success、tool path 與 token cost 的差異，但 Table 1/2 的 sample size 與資料矛盾要求保守解讀。
3. **邊界：** A²E 是一個可稽核的 evaluation architecture demonstration，不是九個 harness 的普遍排名，也不是 calibration、safety 或 production reliability 的充分條件。

## Primary sources

- [A²E arXiv abstract and v1 metadata](https://arxiv.org/abs/2608.07346)
- [A²E v1 HTML, Sections 2, 4, 5, and 6](https://arxiv.org/html/2608.07346v1)
- [A²E artifact repository](https://github.com/datamllab/A2E)
- [OSReward agent evaluation paper reading](/paper-reading/08-osreward-agent-evaluation)
- [Agent Trajectory Sentinel paper reading](/paper-reading/14-agent-trajectory-sentinel)
