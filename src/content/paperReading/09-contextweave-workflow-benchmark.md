---
title: "ContextWeave 論文精讀：記憶真的讓 Agent 更會做事嗎？"
description: "拆解 ContextWeave 如何把多月工作流重建成可執行 benchmark，並檢驗記憶對工作區結果、偏好一致性、連續性與誤導風險的真實影響。"
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "ContextWeave 不把記憶當成 recall accuracy 問題，而是比較有記憶與無記憶時，Agent 是否真的能把下一個工作做對。"
  - "14 位參與者、1,005 個可執行任務中，568 個核心任務形成 8,084 條前後工作關聯；最強記憶組件的 Workspace Score 從 68.08 提升到 78.20。"
  - "記憶也會帶來誤導：最強組件的 memory-induced task rate 是 7.39%，所以更豐富的 recall 不是無條件的 production win。"
  - "真正可落地的評測應同時量測工作區結果、使用者偏好、執行連續性與錯誤 recall，而不是只測能否找回一段文字。"
audience:
  - "正在設計 enterprise agent memory、workspace agent 或長期任務 benchmark 的 AI 工程師。"
  - "需要判斷 recall pipeline 是否改善實際工作結果，而不只是提高檢索分數的技術負責人。"
tags: ["Paper Reading", "AI Agent", "Agent Memory", "Evaluation", "Enterprise AI", "Long-Horizon Task"]
image: "/paperReading/09-contextweave-workflow-benchmark/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
paper:
  title: "ContextWeave: A Real-World Workflow Benchmark for Long-Running Agents"
  authors:
    - "Bo Wang"
    - "Yuqian Yao"
    - "Enxi Wang"
    - "Luozhijie Jin"
    - "Yang Liu"
    - "Yiran Suo"
    - "Yuxuan Cai"
    - "Enyu Zhou"
    - "Yufei Gao"
    - "Honglin Guo"
    - "Tianyu Huai"
    - "Li Ji"
    - "Zhikai Lei"
    - "Bufan Li"
    - "Lizhi Lin"
    - "Jinxiu Liu"
    - "Jie Yang"
    - "Jiazheng Zhou"
    - "Maosen Zhou"
    - "Pengfang Qian"
    - "Shichun Liu"
    - "Guanshan Liu"
    - "Hao Zheng"
    - "Yunhao Yu"
    - "Hang Yan"
    - "Jihua Kang"
    - "Xinchi Chen"
    - "Xipeng Qiu"
  year: 2026
  venue: "arXiv cs.AI preprint, v1 (2026-08-05)"
  links:
    pdf: "https://arxiv.org/pdf/2608.04830v1"
    arxiv: "https://arxiv.org/abs/2608.04830"
    project: "https://github.com/OpenMOSS/ContextWeave"
series:
  id: "agent-evaluation"
  title: "Agent 評測"
  part: 2
  totalParts: 4
---

## 90 秒地圖 / The paper in 90 seconds

- **問題**：記憶 benchmark 常把「找得到歷史」當成成功，卻沒有測試它是否讓下一個可執行工作真的做得更好。
- **核心想法**：把多月工作流重建成固定、可執行的任務串，對同一 target task 只切換是否提供過去軌跡；用結果品質與偏好遵循，而非 retrieval hit，量出記憶造成的差值。
- **最強證據**：在 14 位參與者、1,005 個重建任務（568 個核心評測任務）的設定中，作者報告最強 memory component 將 Workspace Score 由 68.08 提升至 78.20、Preference Score 由 41.50 提升至 70.60（Section 5.2、Table 2）。
- **邊界**：重建的 Docker/模擬 API 與 LLM 型評分器使結果可比較，卻不能直接代表真實企業資料、真實工具漂移或所有 memory 實作的 production uplift。

## 先前方法為何不足 / Why the previous approach is insufficient

歷史 QA、retrieval recall 與獨立 agent task 各量到記憶的一部分，卻無法在固定後續工作中隔離跨 episode 記憶的作用；重播完整任務串還會累積環境漂移（Section 2、Section 3.2）。

## 核心直覺與方法 / Core intuition and method

前一類長歷史 QA 或 recall 指標回答的是「模型有沒有拿到片段」；ContextWeave 要回答的是「片段有沒有改變後續工作」。其介入量是 $\Delta R_M(T_i)=R_M(T_i)-R(T_i)$：固定任務 $T_i$、模型與評分規則，只有歷史經驗形成的記憶 $M$ 可以改變。正的差值才是有用記憶的候選證據；它仍要搭配誤導 recall 診斷，否則「更常帶入舊資料」也可能是假進步（Section 3.1、Section 4.5）。

## 逐步例子 / Worked example

假設一位使用者先前已把產品週報放在固定目錄，且習慣以特定欄位排序；下一個 task 是更新同一份週報。無 recall 的 agent 可能重新搜尋檔案、做出看似完整但不符工作區狀態的版本。with-recall 條件則將先前軌跡交給 memory component，agent 先定位既有檔案與偏好，再修改、執行檢查並留下結果。Workspace Score 檢查最後 Docker workspace 是否完成任務；Preference Score 檢查是否保留使用者慣例。若 recalled 內容其實屬於相似但不同專案，這正是 memory-induced error，而不是成功（Figure 1、Section 4.4–4.5）。這是解釋性例子，不是論文的單一案例結果。

## 如何讀實驗 / Evidence, controls, and limits

**Table 2 / Section 5.2** 問的是六種 memory component 在固定 agent 下是否改變下游結果；控制項是相同 target task 與 without-recall 對照，改變的是提供的歷史表示。**Figure 3 與 Section 5.2.3** 把「結果變好」拆成 in-context experience、summary 與診斷行為；它支持較可操作的經驗記憶可能少走探索路徑，卻不證明任何 summary 都較差。**Section 5.3.5** 的 misleading-recall 切面同樣重要：最強組件的 memory-induced task rate 為 7.39%，所以分數增益不是把 recall 放寬的授權。

## Artifact 與採用判斷 / Artifacts and engineering decision

截至 **2026-08-09**，論文連結的 [官方 repository](https://github.com/OpenMOSS/ContextWeave) 可存取；文章僅將其視為作者公告的 benchmark 入口，實際採用前仍應以本地 clone、容器、資料卡與可跑的 evaluation command 驗證。適合用來設計「有／無記憶」的受控評測與 workspace-level rubric；不適合直接拿 78.20 當作你的 memory ROI，或把含敏感歷史的 production trace 無條件集中保存。先做最小 canary：固定一組後續任務、保留 no-recall 對照、紀錄 provenance 與 rollback，並另外量測誤導率。

## 三個記憶點 / Three things to remember

1. 記憶的目標是讓後續可執行工作變好，不是提高 retrieval 指標。
2. 成對的 with/without-recall 及 workspace 結果，是此文最有用的因果近似；診斷指標解釋它為何成功或傷害。
3. 記憶系統必須同時量測好處與誤導、資料治理與回復能力；此 benchmark 不是 production 成效保證。

一個 Agent 回答「我記得你上次怎麼做」，並不代表它這次真的能把工作接下去。它可能找回了正確的偏好，卻改錯檔案；也可能引用了舊狀態，讓後續動作看起來合理、實際上卻已經偏離工作區。**ContextWeave** 的價值，在於它把「記憶有沒有用」從 retrieval 問題改寫成可執行的工作流問題：有記憶時，Agent 是否更能完成下一個任務、遵守使用者習慣，並且少做重複探索？

這篇論文截至 2026-08-07 是 **arXiv v1 預印本**，沒有找到獨立的期刊、會議或 OpenReview 紀錄。作者提供了 [官方 repository](https://github.com/OpenMOSS/ContextWeave)，包含 runner、Docker 工作流、記憶組件介面、指標與資料封存；但完整重跑的成本、資料封存版本與授權仍應在使用前自行核對。

> **花花的工程提醒**
>
> 記憶系統的 offline recall 分數不是產品指標。若 recall 沒有改善 workspace state、偏好遵循或下一步的可解性，就只是讓 Agent 更會引用過去，而不是更會完成工作。

## 先回答讀者問題：記憶改善的是「工作結果」，但代價是錯誤 recall

作者固定 Agent harness、模型與工具權限，只改變是否提供記憶，再比較六種 memory component。最強結果的 Workspace Score 從無 recall 的 **68.08** 提升到 **78.20**，Preference Score 則從 **41.50** 提升到 **70.60**。這說明當任務真的需要延續先前工作時，recall 不只是節省 token，也可能改變最終工作區狀態與使用者可感知的符合度。

但論文同時報告了另一半：最強組件的 memory-induced task rate 是 **7.39%**，solvability rate 是 **7.07%**。換句話說，記憶會讓一部分任務變得更難解，甚至把錯誤的歷史帶進當前決策。我的結論是：**ContextWeave 支持「記憶值得被當作 agent intervention 評測」，不支持「記憶越豐富越好」或「某個組件普遍最佳」。**

## 論文身份、問題與評測單位

ContextWeave 的研究問題不是「模型能不能回答關於過去的問題」，而是：

1. 工作流中的前置任務與歷史訊息，是否能改善下一個可執行任務？
2. 記憶是否維持使用者偏好與工作連續性，而不是只提高表面完成率？
3. 當 recall 不完整、過時或誤導時，Agent 是否能察覺並恢復？

作者把參與者的多月工作流重建成 task stream $D=(T_1,\ldots,T_n)$。對每個任務 $T_i$，無記憶執行的結果是 $R(T_i)$，有記憶執行的結果是 $R_M(T_i)$，記憶帶來的變化可寫成：

$$
\Delta R_M(T_i)=R_M(T_i)-R(T_i).
$$

這個定義很重要，因為它把 memory evaluation 的最小單位從「一筆回憶」換成「在相同工作上下文中，下一個 action 的結果」。

## Figure 1：資料不是聊天紀錄，而是可重建的工作狀態

論文 **Figure 1** 展示 benchmark construction pipeline：作者先從 14 位參與者的隱私保護標註、差異與資源中抽取任務，再產生指令、local artifacts 與 control APIs，最後放入隔離 Docker，經過人工 review 與 state alignment 才形成可執行 benchmark。

![ContextWeave Figure 1：從隱私保護工作流到隔離可執行 benchmark 的建構流程](https://arxiv.org/html/2608.04830v1/x1.png)

*圖 1｜ContextWeave benchmark 建構流程。論文 Section 4。來源：[Wang 等人，ContextWeave Figure 1](https://arxiv.org/html/2608.04830v1#S4.F1)；論文頁標示依 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 使用。*

這個設計避開了兩個常見陷阱。第一，若只用人工撰寫的 QA，記憶只需找回事實，不必改動工作區。第二，若只 replay 一條完整 trajectory，無法知道 Agent 是真的利用了歷史，還是恰好走到正確答案。ContextWeave 讓任務帶有檔案、訊息、偏好、工具和前後狀態，因而能觀察 recall 對後續工作的因果方向——至少在這個受控 harness 裡如此。

## 資料規模：568 個核心任務中，541 個真的依賴前置工作

整體資料包含 **1,005 個 executable tasks**，其中 **568 個 core evaluation tasks** 由人工標註。核心任務裡有 **541 個**依賴先前任務，形成 **8,084 條 relevant links**；最長的訊息紀錄達 **212.3K tokens**，平均約 **36.3K tokens**。這使它與一般「把長對話截斷後測 QA」的 benchmark 有本質差異：此處的歷史不是裝飾，而是當前任務的前置條件。

作者也以 Figure 2 分析任務多樣性與 temporal relevance。時間相近不一定代表依賴關係強；真正有用的 signal 可能是某個檔案、決策、慣例或未完成狀態。對 enterprise agent 而言，這提醒我們不要只用 timestamp 做 memory ranking，應把 artifact dependency、task lineage 與未完成工作納入索引。

![ContextWeave Figure 2：核心任務的類型分布與時間相關性](https://arxiv.org/html/2608.04830v1/x2.png)

*圖 2｜任務多樣性與 temporal relevance。論文 Section 4。來源：[Wang 等人，ContextWeave Figure 2](https://arxiv.org/html/2608.04830v1#S4.F2)；依 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 使用。*

## 評測協議：固定模型，替換記憶層

主實驗使用固定的 Codex harness、GPT-5.5 xhigh、相同 workspace、任務與工具權限，對照 no recall 與 recall。記憶部分包含六個組件：mem0、memos、Supermemory、MemoryBank、LangMem 與 A-Mem。作者先在固定模型下比較組件，再用 mem0 檢查五個 base model，避免把「模型更強」誤認成「記憶更有用」。

論文的評分不只是一個 aggregate score：

- **Workspace Score**：任務完成後，工作區是否達到 rubric 定義的目標狀態。
- **Preference Score**：是否遵循工作流中可觀察的使用者偏好與慣例。
- **Relevance / continuity**：回憶是否與當前任務相關，是否能接續既有工作。
- **Solvability**：加入記憶後，任務是否變得難以完成。
- **Memory-induced task rate**：錯誤 recall 是否直接造成任務失敗或錯誤方向。

這組指標把「有幫助」與「有風險」放在同一張成績單上。它也使作者可以區分兩種看似相反的結果：某個 memory component 可能讓 Agent 少探索、更多執行，但同時更容易相信過時的歷史。

## Table 1：A-Mem 最強，但不要把它讀成普遍勝者

論文 **Table 1** 在固定 GPT-5.5/xhigh 條件下的核心結果如下。分數是作者報告的 aggregate score；不同工作流與 rubric 的組成不應被解讀成通用百分比。

| 設定 | Workspace | Preference | Win rate | Memory-induced task rate |
| --- | ---: | ---: | ---: | ---: |
| No recall | 68.08 | 41.50 | — | — |
| mem0 | 72.48 | 49.73 | 50.70% | 0.35% |
| memos | 70.01 | 46.38 | 53.30% | 0.35% |
| Supermemory | 70.57 | 48.04 | 55.60% | 0.70% |
| MemoryBank | 73.24 | 55.40 | 65.08% | 1.23% |
| LangMem | 75.29 | 57.37 | 62.79% | 5.11% |
| A-Mem | **78.20** | **70.60** | **72.70%** | **7.39%** |

A-Mem 的提升很大，尤其是 Preference Score；但它也有最高的 memory-induced task rate。這不是單純的 precision–recall trade-off，而是「更願意把經驗帶進當前工作」同時提高了可用性與污染面。當 production 任務的錯誤成本高於重複探索成本時，MemoryBank 或較保守的摘要策略可能比最高平均分更合理。

行為診斷也支持這個解釋：A-Mem 的 exploration rate 下降 **7.06 個百分點**，execution rate 上升 **6.63 個百分點**。這看起來像效率改善，但只有在被召回的前提可靠時才成立；若 recall 過時，少探索會變成少驗證。

## Table 2：記憶增益跨五個 base model，但幅度不同

作者再固定 mem0、改換五個 base model。Workspace Score 的增益分別為 DeepSeek-V4-Pro **+5.61**、GPT-5.5 **+4.95**、GLM-5.1 **+2.19**、Kimi-K2.6 **+2.99**、Qwen3.7-Max **+3.06**；Preference Score 增益則為 **+9.61、+7.66、+5.83、+8.37、+5.55**。方向一致，但大小不一致，表示 memory layer 的價值與模型的 instruction following、context use 和錯誤修正能力有交互作用。

這個 ablation 足以支持「recall 對多個模型有用」的局部結論，卻不能支持「任何 model + memory 都會按比例提升」。五個模型仍共享同一個 harness、同一組重建任務與同一套 rubric；跨供應商、不同工具協議與不同工作區的外部效度尚未建立。

## 作者真正證明了什麼？

### 論文證據

論文證明在固定 harness 下，工作流級 benchmark 能測出 memory component 之間的差異；記憶在 Workspace、Preference、continuity 等結果上通常有正向效果；經驗豐富的 recall 能減少重複探索、增加延續工作，但也會提高 misleading recall 的風險。

### Vendor 或作者主張

把 ContextWeave 稱為「real-world」應理解為重建自真實工作流，而不是直接在參與者的真實帳號或未抽象化企業系統上測試。官方 repository 的可用性也不等於 full benchmark 已經容易、便宜且逐位元可重現。

### 我的推論

ContextWeave 最適合被當成 memory subsystem 的 regression harness：每次調整 extraction、ranking、compression 或 write policy，都應測 $ΔR_M$、偏好遵循與 memory-induced error，而不是只看 recall hit rate。它還不能單獨決定 production memory 的 TTL、權限或保留政策，因為這些需要真實資料治理與人類責任邊界。

## 限制與不能越過的結論

第一，rubric calibration 與 human validation 仍在進行，論文沒有提供每個 aggregate score 的完整信賴區間或獨立複驗。第二，工作流由真實資料隱私保護重建，resource 與 simulated API 不一定保留原始企業依賴。第三，主要 grading 依賴 GPT-5.5，可能將某種模型偏好當作使用者偏好。第四，完整配置約需 **200 美元**，成本會限制大規模 ablation。

因此不能從本文推出：A-Mem 在所有企業工作流都最佳、豐富 recall 一定降低成本、或記憶帶來的分數提升會在任意 agent harness 持續。尤其是「memory-induced task rate」顯示，越有效的記憶越需要權限、過時檢測與 conflict handling。

## 工程落地：把 ContextWeave 變成自己的測試矩陣

如果正在做 enterprise agent，我會把最小測試拆成四組：

1. **Outcome**：同一任務在 no-recall、summary、structured memory 與 full trace 下的 workspace diff。
2. **Continuity**：下一個任務是否重做已完成工作，是否正確沿用命名、格式與決策。
3. **Robustness**：刻意插入過時、矛盾或權限不符的 memory，觀察 Agent 是否先驗證。
4. **Cost**：比較 recall token、工具呼叫、探索步數與人工 recovery，而不是只比較 latency。

記憶寫入也應保留 provenance、source task、有效期限、confidence 與 conflict status。對高風險操作，memory 只能提供候選 context，不能直接覆蓋 deterministic state；對低風險、重複性高的工作，才可以讓較積極的 recall 換取較少探索。

## Artifact 與最小重現

截至 2026-08-07，官方 [ContextWeave repository](https://github.com/OpenMOSS/ContextWeave) 可找到 runner、Docker manifests、memory interface、metric implementation 與 benchmark archive。可重現性仍有幾個未知：資料 archive 的精確版本、每個 component 的授權、Docker image digest、目前 endpoint 的 full-run 成本，以及 rubric 對人類判斷的校準程度。

最小有價值的重現不是一次跑完 568 個 core tasks，而是選一位參與者、一條有明確前置依賴的短工作流，分別執行 no recall 與一個 released memory component，記錄 workspace diff、preference rubric、探索步數與錯誤 recall。若這個小矩陣都無法區分兩者，先不要把 full benchmark 分數當成部署證據。

## 結語：記憶是 intervention，不是資料庫功能

ContextWeave 把 agent memory 的問題拉回工程現場：記憶是否讓下一個任務更可解、工作區更正確、偏好更一致？它給出一個有用但不舒服的答案：通常有幫助，而且改善可以很大；同時，越積極的 recall 也越可能把錯誤歷史變成錯誤 action。

所以 production memory 的成功標準不應是「找回最多」，而應是「在可追溯、可驗證、可撤回的條件下，讓正確的下一步更容易發生」。這也正好接上 [OSReward 的 Agent 評測讀法](/paperReading/08-osreward-agent-evaluation)：前者測記憶如何改變工作流，後者提醒我們不要把 model-generated verdict 當成唯一證據。

## Primary sources

- [ContextWeave arXiv record](https://arxiv.org/abs/2608.04830)：版本、作者與摘要。
- [ContextWeave full paper](https://arxiv.org/html/2608.04830v1)：Figure 1–2、§4–§5、Table 1–2 與限制。
- [ContextWeave official repository](https://github.com/OpenMOSS/ContextWeave)：runner、資料、Docker 與重現說明。
- [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)：論文圖表使用的授權聲明。
