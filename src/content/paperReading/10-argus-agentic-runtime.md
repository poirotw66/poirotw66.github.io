---
title: "Argus 論文精讀：長期 Agent 需要的是 Runtime，不是更長的 Prompt"
description: "拆解 Argus 的 Manager–Planner–Engineer–Reviewer runtime、持久狀態、驗證式演化與 rollback，並區分 benchmark 結果、作者自營案例與尚未證明的自我學習主張。"
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "Argus 把長期 Agent 的核心問題定義成控制平面：如何保留意圖、修訂操作目標、驗證結果，並在失敗後回滾。"
  - "它以 Manager、Planner、Engineer、Reviewer 四種角色管理 durable project state；記憶、技能、程序與 routing 只有通過 role-owned review 才能持久化。"
  - "七個 GPT-5.5 arena 的報告結果包含 SWE-Bench Pro 約 78% 對 Direct Copilot 59%，但主要 runtime、prompt、trace 與 benchmark package 尚未公開。"
  - "最值得移植的是 authority、provenance、verifier 與 rollback 邊界，不是直接照抄四個 agent prompt。"
audience:
  - "正在設計 long-running agent、multi-agent orchestration 或可審計 harness 的 AI 工程師。"
  - "需要把任務分工、持久狀態與驗證閘門接到 enterprise AI platform 的技術負責人。"
tags: ["Paper Reading", "AI Agent", "Multi-Agent Systems", "Agent Runtime", "Evaluation", "Governance"]
image: "/paperReading/10-argus-agentic-runtime/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
  - tool-use-coding-agents
paper:
  title: "Argus: A General-Purpose Agentic Runtime for Long-Horizon Reasoning"
  authors:
    - "Boxiu Li"
    - "Zimo Wen"
    - "Yijia Fan"
    - "Junxiang Lei"
    - "Sufeng Guo"
    - "Jiaao Wu"
    - "Ruize Tang"
    - "Mukai Li"
    - "Yifei Shen"
    - "Xiaoyu Chen"
    - "Wanbo Zhang"
    - "Runjing Gu"
    - "Yifei Gao"
    - "Yuheng Wu"
    - "Xuyao Huang"
    - "Zelong Zhao"
    - "Jiachen Zhang"
    - "Shibo Hu"
    - "Hangxi Guo"
    - "Yilin Chen"
    - "Yuzhe Zhang"
    - "Fan Yang"
    - "Chuan Wen"
    - "Xian Zhang"
    - "Xuanhe Zhou"
    - "Zhijie Deng"
  year: 2026
  venue: "arXiv cs.AI technical report, v1 (2026-08-05)"
  links:
    pdf: "https://arxiv.org/pdf/2608.05144v1"
    arxiv: "https://arxiv.org/abs/2608.05144"
series:
  id: "multi-agent-coordination"
  title: "Multi-Agent Coordination"
  part: 1
  totalParts: 1
---

## 90 秒地圖 / The paper in 90 seconds

- **問題**：長時程 agent 失敗時，單一長 prompt 沒有清楚的任務 authority、可稽核狀態、驗證關卡或可回復邊界。
- **核心想法**：Argus 以 Manager、Planner、Engineer、Reviewer 在 durable project state 上循環；只有經 role-owned review 的 memory、skill、routing 與 procedure 才能成為下一輪狀態。
- **最強證據**：報告在七個 task-native arena 中展示廣度，並在 SWE-Bench Pro 報告 GPT-5.5 條件下 Argus 78% 對 Direct Copilot 59%、約 1.41 倍 aggregate tokens（Figure 1、Section 5）。
- **邊界**：這是 arXiv v1 technical report；實作、prompt、trace、checkpoint 與完整 benchmark package 尚未公開，不能把結果當成可重現的 runtime 採用證明。

## 先前方法為何不足 / Why the previous approach is insufficient

只有 prompt history 的協作沒有明確 authority、artifact provenance、verifier 或 rollback，因此很難分辨已驗證的狀態改進與下一輪的上下文污染。

## 核心直覺與方法 / Core intuition and method

Argus 改的不是「多叫幾個模型」，而是控制點：目標、約束與 verification criteria 先成為可持久的 project state，角色只能對自己擁有的轉換負責。Manager 分派有界 mission，Planner 形成計畫，Engineer 產出 artifact，Reviewer 對 artifact、test 與 verifier output 做 gate；失敗則保留 provenance 並 rollback（Figure 1、Figure 2、Section 2）。這將 agentic runtime 視為控制平面，而非對話紀錄的延長。

## 逐步例子 / Worked example

以「修正一個 failing test 並更新 release note」為例：Manager 將 scope、budget 與完成條件寫入 state；Planner 產生可驗證的子任務；Engineer 修改程式並留下 diff 和測試輸出；Reviewer 比對 acceptance rule。若 test 失敗或 release note 不符版本，Reviewer 不把 procedure 推入長期 memory，而是將 rejected route 與原因交給下一輪並回退 artifact。這是依 Figure 1–2 的解釋性流程，不是該論文報告的單一 benchmark trace。

## 如何讀實驗 / Evidence, controls, and limits

**Figure 1** 的七個卡片是不同 arena 的 breadth evidence，使用各自尺度，不能平均成單一 leaderboard。**Section 5 的 SWE-Bench Pro 比較** 控制的是報告內的 arena 與 back-end 設定，改變的是 Argus runtime 對 Direct Copilot 的組織方式；78% 對 59% 支持該設定中的結果，卻不分離模型、prompt、測試預算與 runtime 的各自貢獻。**Figure 2** 解釋 recurrent role loop 與 session reset；它是機制圖，不是性能消融。論文缺少可檢查的 ablation trace，因此不能主張四角色本身是增益來源。

## Artifact 與採用判斷 / Artifacts and engineering decision

截至 **2026-08-09**，arXiv 文本可讀，但論文未提供官方 Argus code、可下載 checkpoint、完整 task package 或 trace archive；文中提及的 flash-linear-attention PR 不是 Argus artifact。可採用的是 authority、provenance、verifier、rollback 的架構原則；不適合直接複刻角色 prompt、以未公開的 78% 作採購依據，或讓自我修改狀態跳過 reviewer。先以一條有 deterministic test 的內部工作流建立最小實驗，量測完成率、回退率與人為核准負擔。

## 三個記憶點 / Three things to remember

1. 長時程 agent 的可移植洞見是受權限與驗證保護的狀態轉換，不是四個 persona。
2. 報告的 arena 成績描述特定未公開 runtime 設定；沒有 artifact 就沒有獨立重現。
3. 先做可回滾、可追溯、可測試的 control loop，再談 self-evolution。

長期 Agent 最容易壞掉的地方，通常不是「不會呼叫工具」，而是任務做久之後開始失去邊界：原本的使用者意圖被新的局部目標取代，Agent 把自己的草稿當成完成，或把一次失敗路徑寫成下次要遵循的技能。**Argus** 的主張是，這些問題不能只靠更長的 context 或更好的 prompt 解決；需要一個管理 durable state、權限、驗證與 rollback 的 runtime。

截至 2026-08-07，這是 **arXiv v1 technical report**，沒有找到獨立 venue 或 OpenReview 紀錄。報告描述了完整 runtime 與多個 evaluation trace，但沒有公開 Argus implementation、checkpoint、benchmark package 或完整 trace archive。文中提到的 [flash-linear-attention PR #1045](https://github.com/fla-org/flash-linear-attention/pull/1045) 是可驗證的下游 kernel 採用案例，不是 Argus runtime 的重現。

> **花花的工程提醒**
>
> 長期 Agent 的「自我演化」首先應該是可審計的 state transition，而不是自由生成的 prompt。每一次新技能、記憶、routing 或目標修訂，都要知道誰批准、依據什麼證據、何時可以撤回。

## 先回答讀者問題：Argus 提供的是控制平面抽象

Argus 把使用者的 standing intent 與每一輪 operational objective、constraints、verification criteria 分開，讓 runtime 可以在不悄悄改變原始意圖的前提下修訂工作契約。Manager 管理階段與權限；Planner 把目標拆成 bounded missions；Engineer 執行；Reviewer 以任務原生 verifier 或證據檢查結果。

報告的中心命題是：固定模型權重的 Agent，也能透過持久化的 runtime state 與 control policy，在長任務中累積可用的記憶、技能、程序、verifier、routing 決策與 rejected routes。但這個命題要拆開讀：報告確實展示了跨任務的狀態與 recovery trace；它沒有證明這些狀態在獨立 operator、不同模型或不同 domain 上必然帶來泛化能力。

## Figure 1：四個角色共享的是 project state，不是彼此的聊天

論文 **Figure 1** 把 Argus 畫成一個 runtime：Manager 具有 authority，Planner、Engineer、Reviewer 圍繞 shared workspace 執行；workspace 內包含 knowledge、event log、artifacts、backlog、budget、daemon 與 memory。外層則放入七個 task-native evaluation arena，而不是把所有能力壓成一個總分。

![Argus Figure 1：Manager、Planner、Engineer、Reviewer 與 durable project state](https://arxiv.org/html/2608.05144v1/x1.png)

*圖 1｜Argus runtime 與評測範圍。論文 Section 2。來源：[Li 等人，Argus Figure 1](https://arxiv.org/html/2608.05144v1#S2.F1)；依論文標示的 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

這個架構比「四個 persona 輪流聊天」更有工程意義，因為共享物件是可序列化的狀態與事件，而不是只有 prompt history。若 Planner 說任務完成，Reviewer 應能從 artifact、test、verifier output 與 event log 重新檢查，而不必相信 Planner 的敘述。

## Figure 2：runtime 的演化是有閘門的狀態更新

**Figure 2** 對照一次性 session reset 與 recurrent role loop。每輪 Manager 會經過八個 stage，包含任務契約、資源與路徑管理、結果檢查、失敗處理與狀態更新。通過 review 的 memory、skill、tool、verifier、routing 或 procedure 才能寫入持久狀態；rejected route 也保留下來，避免下一輪重蹈覆轍。

![Argus Figure 2：從 session reset 到 recurrent role loop 的 runtime self-evolution](https://arxiv.org/html/2608.05144v1/x2.png)

*圖 2｜Argus 的 recurrent role loop 與 review-gated state update。論文 Section 3。來源：[Li 等人，Argus Figure 2](https://arxiv.org/html/2608.05144v1#S3.F2)；依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

報告也提到未來可以把持久狀態轉成 SFT 或 RL 資料，但那是後續假設，不是本文已測得的 learning result。當前證據比較接近「runtime state 能改善下一輪的控制與恢復」，而不是「Agent 已經從經驗更新模型能力」。

## 評測不是單一 leaderboard：七個 arena、各自的 verifier

Argus 使用七個 task-native arena，涵蓋 SWE-Bench Pro、GPU kernel optimization、nanochat training、nanoGPT speedrun、AARRI-Bench、數學資料合成與 paper production。這些任務的成功定義不同，報告因此保留各自的原生指標，而沒有硬做一個平均分。

最完整的對照是 **731-task SWE-Bench Pro** trajectory：Argus 報告約 **78%**，Direct Copilot 約 **59%**，aggregate tokens 是後者的 **1.41 倍**。成熟 wave 相較早期 wave，solve-input tokens 少 **21%**、active workflow time 少 **15%**。這些數字有工程訊息，但它們比較的是完整 runtime 與 baseline workflow，不是單一 role、memory 或 reviewer 的乾淨因果 ablation。

其他 trace 包含 AARRI-Bench **76.8%**、一個數學資料 campaign 的 **28-point gap**，以及六個 paper pipeline 共 **254 missions**、**16 次 stage rollback**。這些案例能展示控制流程與 failure handling，不能被濃縮成「通用 autonomous agent score」。

## Figure 3：Reviewer 是成本，也是真正的 recovery boundary

報告將 731 個 SWE-Bench 任務的 review routing 拆開：**466** 個由獨立 Reviewer 審查，**265** 個由 Engineer self-review。被 routing 的任務使用約 **2.75 倍 solve-input tokens** 與 **1.80 倍 active time**；但 reviewer 不只是額外成本：**388** 個第一次 review 直接接受，**43** 個要求修改，其中 **34** 個後來通過官方 verifier，另有 **22** 個屬於 strict review-loop rescue。

![Argus Figure 3：review routing、revision 與 verifier recovery](https://arxiv.org/html/2608.05144v1/x3.png)

*圖 3｜Reviewer routing 與 recovery 結果。論文 Section 4。來源：[Li 等人，Argus Figure 3](https://arxiv.org/html/2608.05144v1#S4.F3)；依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

這組數字最適合用來設計 policy：不是每個任務都要多一個模型，但高風險、低可逆性或 verifier 不完整的任務，需要把 self-review 升級成獨立 reviewer。反過來，若 reviewer 沒有獨立證據，只是另一個 prompt 重新複述同一個 patch，2.75 倍 token 可能只買到更昂貴的共識。

## Figure 4：成熟度提升的可能來源，不等於模型學會了

**Figure 4** 展示 SWE-Bench 的 longitudinal profile：早期 W1–6 到成熟 W19–22，輸入 token 與 active time 下降，並且保留 reviewer、verifier、rollback 等 workflow trace。這很像 runtime state 累積帶來的 operational learning，但報告也承認兩個限制：有兩個不完整 wave 被省略，Copilot 沒有保留 per-wave trace，因此缺少 controlled replay 來確認下降是否由 Argus state、任務組成或 operator 熟悉度造成。

所以更穩妥的說法是：Argus 展示了「持久狀態與有界任務流程可以伴隨長期效率改善」，而不是「固定模型已完成自我學習」。

![Argus Figure 4：SWE-Bench Pro 的結果、review 與 longitudinal efficiency](https://arxiv.org/html/2608.05144v1/x4.png)

*圖 4｜731-task SWE-Bench Pro 的任務結果、review 與 wave-level efficiency。論文 Section 5。來源：[Li 等人，Argus Figure 4](https://arxiv.org/html/2608.05144v1#S5.F4)；依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

## 紙本 production trace：有價值，但不應偽裝成 benchmark

報告的數學與 paper-production campaigns 更接近 operational case study。數學 campaign 保留了七次更新，包括一條被 falsify 的路徑；內部 review 不是 peer review。六個 paper campaigns 總計 **640 campaign hours、576 Engineer rounds、286 Reviewer revisions、89 session rolls、16 stage rollbacks**。其中一條 **163.6-hour** trajectory 做了七次 early no-go decision，從正向 method claim pivot 成 audit，最後還有兩次 late rollback。

這些資料的價值，在於它們展示長期工作真正需要的東西：拒絕一條路徑、保留反例、改寫 scope、把「不能證明」當作合法結果。它們不能證明 Argus 在外部研究團隊、陌生 domain 或不同 evaluator 上也會產生同樣的科學品質。

## 證據地圖：把結果、案例與推論分開

### 論文與報告直接支持的事

Argus 提供一個明確的 runtime vocabulary：intent、objective、constraints、verification criteria、bounded mission、role-owned review、persistent state、rollback。它也報告了 SWE-Bench 對照、review recovery 與 longitudinal efficiency，並把部分錯誤保留下來供審計。

### 仍屬作者主張或受限的事

「general-purpose」是架構 ambition，不是已完成的外部泛化測試。七個 arena 的任務、verifier、operator 與資料來源不相同；作者自營 paper campaign 的結果也不能與公開 benchmark 的分數等量齊觀。

### 我的工程推論

真正值得移植的不是四個角色的命名，而是四條 interface：`Intent → Contract`、`Mission → Artifact`、`Artifact → Verification`、`Verification → State admission`。只要這些 transition 有權限、證據、版本與 rollback，角色可以由同一模型、不同模型或人類服務承擔。

## 限制：Verifier 不是魔法安全邊界

報告明確指出，user-guided pivot 尚未被 prospective、公開地評估；contract refinement 可能失敗；Manager 或 operator 可能批准錯誤 trade-off；verifier 只對它能觀察到的 evidence boundary 有效，而且 verifier 本身可能錯。另有 attribution、task ordering、跨模型與跨 domain generalization 等未解問題。

最重要的限制是可重現性。現階段沒有找到公開 Argus code、checkpoint、完整 benchmark bundle、prompt/policy package、state serialization、role routing、full trace 或 token accounting。下游 [RWKV6 kernel PR #1045](https://github.com/fla-org/flash-linear-attention/pull/1045) 有具體測試：H100 NVL 上 forward 約 **0.199 → 0.168 ms**、forward+backward 約 **0.900 → 0.747 ms**，且 backend 預設關閉；這證明某個 downstream artifact 被採用，不等於 runtime 可以重現。

## 工程落地：先做一個可審計的 bounded-mission harness

若要採用 Argus 的想法，我會先做小而可驗證的版本：

1. 將使用者意圖、當前 objective、constraints、verification criteria 分欄保存，不讓模型用一段自由文字覆蓋它們。
2. 每個 mission 都要有輸入 snapshot、產出 artifact、verifier 結果、token/time budget 與 event log。
3. 將 memory、skill、procedure、tool route 與 rejected route 視為候選變更，只有通過指定 reviewer 才能 admission。
4. 讓 rollback 回到上一個已驗證 state，而不是重新請模型「想起剛才發生什麼」。
5. 把 reviewer routing 變成 risk policy：不可逆、外部副作用大、或 verifier 覆蓋不足的任務，才升級獨立審查。

最小 baseline 是同一個 repository task 的 reset-session agent。比較它與 bounded-mission runtime 的成功率、recovery rate、token、active time、錯誤 state admission 與人工介入次數。若沒有這些 event-level 指標，看到更高的 end-task score 也很難知道改善來自哪一個 control boundary。

## 結語：把「自我演化」改寫成可撤回的控制流程

Argus 最有價值的地方，不是宣稱一個固定模型已成為通用自主研究員，而是把長期 Agent 的模糊問題拆成可管理的狀態轉移：誰可以改目標、什麼算完成、哪一種證據足夠、哪些經驗可以留下、失敗後回到哪裡。

這個抽象與 [ContextWeave 的工作流記憶評測](/paperReading/09-contextweave-workflow-benchmark) 可以互相補足：ContextWeave 告訴我們 recall 會同時提高工作結果與誤導風險；Argus 則提供一個可能的控制面，讓 recall、skill 與 routing 的寫入必須經過驗證、授權與 rollback；[Indirect Prompt Injection（2023）](/paper-reading/42-indirect-prompt-injection/) 則把「retrieved 內容 = 可能的 instruction」寫成更早的控制面警告。兩者都提醒我們，Agent platform 的核心資產不是更長的 prompt，而是可觀察、可審計、可恢復的 state machine。

## Primary sources

- [Argus arXiv record](https://arxiv.org/abs/2608.05144)：版本、作者與摘要。
- [Argus full report](https://arxiv.org/html/2608.05144v1)：Figures 1–7、SWE-Bench、paper campaigns 與 limitations。
- [flash-linear-attention PR #1045](https://github.com/fla-org/flash-linear-attention/pull/1045)：報告提到的下游 RWKV6 kernel artifact。
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)：論文圖表使用的授權聲明。
