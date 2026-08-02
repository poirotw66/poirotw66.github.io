---
title: "OSReward 論文精讀：為什麼 Agent 的成功不能只交給另一個模型判斷？"
description: "精讀 OSReward 的跨平台 Computer-Use Agent 評測、VLM judge 寬鬆偏誤與 OS-Shepherd，並延伸成 deterministic verifier 與 model judge 的混合評測架構。"
pubDate: 2026-08-02
updatedDate: 2026-08-02
tldr:
  - "OSReward 顯示，主流 VLM judges 很容易把未完成任務判成成功；困難集上最強模型的正確率也只有約 70%。"
  - "Agent 評測應優先驗證環境狀態，再用 model judge 處理語意品質，最後把衝突案例送交人工或更強驗證器。"
audience:
  - "正在建立 Agent evaluation harness、computer-use agent 或 reward pipeline 的 AI 工程師。"
  - "需要判斷 LLM-as-a-Judge 能否進入正式品質門檻的技術負責人。"
tags: ["Paper Reading", "AI Agent", "Evaluation", "Computer Use", "LLM-as-a-Judge", "Reward Model"]
image: "/paperReading/08-osreward-agent-evaluation/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
paper:
  title: "OSReward: Instituting Standardized Evaluation for Cross-Platform Computer-Use Reward Models"
  authors:
    - "Qiushi Sun"
    - "Kanzhi Cheng"
    - "Yian Wang"
    - "Bowen Yang"
    - "Hang Yan"
    - "Liheng Chen"
    - "Fangzhi Xu"
    - "Zichen Ding"
    - "Nuo Chen"
    - "Jialin Cao"
    - "Xingdong Gong"
    - "Zehao Li"
    - "Kaiming Jin"
    - "Xinfeng Yuan"
    - "Zhoumianze Liu"
    - "Jingyang Gong"
    - "Zhangyue Yin"
    - "Jiahui Gao"
    - "Zhiyong Wu"
    - "Tianbao Xie"
    - "Jianbing Zhang"
    - "Ben Kao"
    - "Lingpeng Kong"
  year: 2026
  venue: "arXiv 2607.28609 v1 (work in progress)"
  links:
    pdf: "https://arxiv.org/pdf/2607.28609v1"
    arxiv: "https://arxiv.org/abs/2607.28609"
    project: "https://os-copilot.github.io/OSReward-Home/"
series:
  id: "agent-evaluation"
  title: "Agent 評測"
  part: 1
  totalParts: 1
---

當 Agent 回答「任務已完成」，我們究竟相信什麼？是相信它寫下的完成敘述、最後一張螢幕截圖，還是環境裡真的出現了預期狀態？在一般文字問答中，LLM-as-a-Judge 已很常見；但 Computer-Use Agent 的輸出不是一段文字，而是包含畫面、動作、推理與外部副作用的長軌跡。這使「讓另一個模型判斷成功」成為一個方便、可擴張，卻可能把錯誤重新包裝成 reward 的設計。

[OSReward](https://arxiv.org/abs/2607.28609) 正面測量這個問題。作者建立跨 Web、Mobile、Windows、Ubuntu 的人工 gold benchmark，評估 27 個 VLM judges，再訓練專門辨識失敗的 OS-Shepherd。它最重要的工程訊息不是「換成某個更強 judge」，而是：**成功判定必須建立證據層級，模型判斷只能是其中一層。**

> **花花的工程提醒**
>
> Agent 說「完成」只是觀測，不是證明。能用資料庫狀態、檔案內容、測試結果或 API 回傳驗證的事情，應先交給 deterministic verifier；model judge 應處理剩下的語意與品質問題。

### 論文狀態與研究問題

這篇文章截至 2026-08-02 是 **arXiv v1，且作者標示 work in progress**，不能視為已完成同儕審查。它問的是：當 CUA 軌跡由 VLM judge 判斷成功或失敗時，這個 reward signal 是否可靠、偏誤集中在哪裡，以及能否用開放資料與專用 reward model 改善成本與準確率。

論文方法可拆成四步：

1. 建立包含真實應用程式、網站、檔案與干擾內容的跨平台環境。
2. 讓不同 Agent 家族執行經人工篩選的任務，取得真實成功與失敗軌跡。
3. 以三位標註者獨立判定，分歧案例再交由兩位資深 reviewer 共同 meta-review。
4. 用 gold verdict 評估 27 個 judges，找出失敗模式，再建立 OS-Shepherd-100K 與 9B／35B reward models。

這裡的 gold rule 很嚴格：若 Agent 沒有透過環境取得或驗證答案，即使碰巧答對，也算失敗。這比「最後答案看起來合理」更接近可部署 Agent 的責任邊界。

### Figure 3、Figure 4：Gold label 為何值得信任？

根據論文 **Figure 3** 與 §3.3，每條通過前處理的軌跡都由三人獨立標註；只有全數同意才直接定案，分歧案例不採簡單多數決，而是進入資深 reviewer 的共同審查。整體標註、重審與 hard-set verification 約耗費 800 human-hours。

**Figure 4** 顯示完整 OSReward 有 1,019 條軌跡，橫跨四個平台，成功／失敗比例約為 43%／57%，最長可到 100 steps。失敗案例中，86% 至少帶有 reasoning-and-planning error；失敗軌跡也明顯更長，因此 judge 面對的不是單張圖片分類，而是長序列證據整合。

OSReward-Hard 再從中挑出 284 條真正容易混淆的軌跡，成功／失敗比例約為 30%／70%。這些案例多半曾讓人工標註者產生分歧：有些失敗軌跡看起來非常像完成，有些成功軌跡則繞了不尋常的路徑。

### Table 1：完整集接近 90%，困難集卻掉到約 70%

論文 **Table 1** 的完整集結果看似樂觀：Claude-Opus-4-8 為 89.7%，GPT-5.5 與 Claude-Opus-4-6 都是 89.5%。但換到 OSReward-Hard，三者分別降到 69.7%、67.3%、67.3%。作者因此把 hard set 當成主要診斷面，而不是只報告較容易的平均分數。

更值得注意的是 success recall 與 failure recall。部分模型非常願意說「成功」：例如 Qwen3-VL-8B 在完整集的 success recall 是 99.8%，failure recall 卻只有 59.9%；到了 hard set，failure recall 只剩 8.2%。如果這類 judge 被用作 reinforcement learning 的 reward，它可能不是偶爾漏掉失敗，而是系統性獎勵 false success。

這是 OSReward 的核心發現：judge 的共同偏誤是 **leniency bias**。Agent 的文字軌跡宣稱完成時，judge 容易跟著敘事走，而沒有充分確認畫面或最終環境狀態。

### Figure 8：Judge 看的是畫面，還是 Agent 的故事？

§5 的 ablation 讓這個問題更具體。調整最後截圖的數量或移除 click marker，整體 accuracy 的變化通常不到 0.5 percentage point；但單一軌跡仍有 5–7% verdict 被翻轉，說明 reward label 本身存在不小噪音。

相較之下，**Figure 8** 顯示移除每一步 thought 與 action text，平均 accuracy 下降 7.2 pp，並翻轉 22.7% verdict。只移除 chain-of-thought、保留 actions，降幅較小：1.8 pp，翻轉 11.6%。證據表示文字 action history 確實提供重要訊號，但也形成風險：judge 可能過度依賴 Agent 描述自己做了什麼，而不是檢查環境是否真的改變。

### Table 2：成功與否都難判，品質分級更難

OSReward-Multi 對 440 條成功軌跡加入 alignment 與 efficiency 評分。**Table 2** 顯示，即使最好的 GPT-5.5，Multi macro-recall 也只有 63.5%；Claude-Opus-4-8 是 60.8%。模型對品質排序的 AUC 優於直接輸出的等級，意味著模型可能知道 A 比 B 好，卻沒有校準好「究竟該給哪一級」。

所以 binary success、alignment、efficiency 不應混成一個模糊總分。正式 evaluation harness 至少要分開記錄：是否完成、是否遵守意圖、路徑是否有效率，以及副作用是否可接受。

### Table 4：OS-Shepherd 改善了什麼？

作者建立約 100K 筆 reasoning-annotated judgments，先用 96.6K agreement-filtered samples 做 SFT，再用 GRPO 集中修正 false-success。**Table 4** 顯示 OS-Shepherd-9B 在完整集從 base model 的 76.7% 提升到 86.1%；hard set 從 39.4% 提升到 60.2%，failure recall 從 14.1% 提升到 57.6%。35B 在 hard set為 62.7%，只比 9B 高 2.5 pp 左右。

這支持「針對偏誤訓練」比單純增加模型尺寸更有價值，但不能解讀成 learned judge 已經等同 ground truth。即使 OS-Shepherd 改善 false success，hard-set accuracy 仍遠低於可靠的 production gate。

### Bloss0m 延伸：混合 verifier 架構

以下不是論文原始架構，而是根據證據整理出的工程建議：

```text
Agent trajectory
  → 1. deterministic verifier：狀態、檔案、資料庫、API、測試、權限
  → 2. model judge：語意完成度、意圖一致性、品質與效率
  → 3. disagreement router：兩層衝突、低信心、高風險 → 人工／專用 verifier
  → 4. telemetry：保留證據、judge 版本、成本、失敗類型與覆核結果
```

第一層只判斷能客觀驗證的 invariant。例如「會議是否真的建立」「檔案是否存在且內容通過 schema」「測試是否成功」「資料庫 state diff 是否符合預期」。第二層才判斷文案品質、操作是否符合模糊意圖、步驟是否浪費。兩層結果衝突時，不能平均成一個分數；應視任務風險選擇 fail closed、重新執行或人工覆核。

這也能接回 [RAG-MCP 的工具選擇問題](/paper-reading/04-rag-mcp/) 與 [Beyond RAG 的 Agent memory](/paper-reading/06-beyond-rag-for-agent/)：工具選得對、記憶取得好，不代表外部狀態真的正確。若要把它落在實際系統，可以參考 [Agentic AI Platform 專案](/projects/agentic-ai-platform/) 的 harness 邊界，為每種 tool action 定義可驗證效果。

### 限制與不該過度解讀的地方

1. 目前只是 arXiv v1／work in progress，資料、模型與數字仍可能修訂。
2. Benchmark 涵蓋四個平台，但仍受選定應用程式、任務分布與 Agent family 限制。
3. Figure 10 對既有 benchmark 的比較是「與原 verifier 的 agreement」，而那些 verifier 本身也可能有 false positive／negative，不能直接當成新 ground truth。
4. OS-Shepherd 的大型訓練使用 32 張 NVIDIA H200；開放 artifact 不代表完整訓練能低成本重現。
5. Model judge 適合補足難以手寫的語意判斷，不能取代本來就能精確實作的 deterministic check。

### 工程結論

OSReward 最值得保存的結論是：**Agent evaluation 不是選一個 judge model，而是設計一條證據鏈。** 完成宣告、文字軌跡與截圖都只是證據；真正的成功應優先由環境狀態證明。Model judge 的價值在覆蓋 open-ended quality，而不是把所有可驗證條件重新變成機率判斷。

對正式系統而言，下一步不是追求單一 judge 的 leaderboard 第一名，而是量測 false-success rate、failure recall、judge disagreement、覆核成本與狀態 verifier 覆蓋率。這些指標才會告訴你，Agent 究竟是真的完成，還是只把失敗說得很像成功。

### 原始來源

- [OSReward arXiv abstract and version history](https://arxiv.org/abs/2607.28609)
- [OSReward full HTML paper](https://arxiv.org/html/2607.28609v1)
- [OSReward project, code, benchmark, data, and models](https://os-copilot.github.io/OSReward-Home/)
