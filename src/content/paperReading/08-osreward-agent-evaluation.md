---
title: "OSReward 論文精讀：為什麼 Agent 的成功不能只交給另一個模型判斷？"
description: "完整拆解 OSReward 的資料建構、27 個 VLM judges、Hard／Multi 子集、錯誤與成本分析、OS-Shepherd-100K 訓練，並延伸成可部署的混合驗證架構。"
pubDate: 2026-08-02
updatedDate: 2026-08-09
tldr:
  - "OSReward 顯示，主流 VLM judges 很容易把未完成任務判成成功；困難集上最強模型的正確率也只有約 70%。"
  - "1,019 條 gold trajectories 經過三人獨立標註、分歧 meta-review 與 Hard-set 再驗證；資料品質本身是這篇論文最重要的貢獻之一。"
  - "增加思考、抽樣或多 judge 投票只能小幅改善；可靠 frontier judge 在大規模 RL 中又過於昂貴。"
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
  totalParts: 4
---

## 90 秒掌握論文

當 Agent 回答「任務已完成」，我們究竟相信什麼？是相信它寫下的完成敘述、最後一張螢幕截圖，還是環境裡真的出現了預期狀態？在一般文字問答中，LLM-as-a-Judge 已很常見；但 Computer-Use Agent 的輸出不是一段文字，而是包含畫面、動作、推理與外部副作用的長軌跡。這使「讓另一個模型判斷成功」成為一個方便、可擴張，卻可能把錯誤重新包裝成 reward 的設計。

[OSReward](https://arxiv.org/abs/2607.28609) 正面測量這個問題。作者建立跨 Web、Mobile、Windows、Ubuntu 的人工 gold benchmark，評估 27 個 VLM judges，再訓練專門辨識失敗的 OS-Shepherd。它最重要的工程訊息不是「換成某個更強 judge」，而是：**成功判定必須建立證據層級，模型判斷只能是其中一層。**- **舊方法的限制**：傳統 model judge 只能根據壓縮後的畫面與文字軌跡猜測成功，容易相信 Agent 的完成敘事。
- **核心洞見**：先用人工 gold benchmark 拆出 false-success 偏誤，再把可驗證狀態、model judge 與人工仲裁放進不同證據層。
- **最強證據**：Table 1 與 Figure 5--7 顯示完整集接近 90% 的 judge 到 Hard set 只剩約 70%，錯誤集中在 failure recall 與跨平台失敗類型。
- **主要邊界**：OS-Shepherd 改善成本與部分準確率，但資料標籤仍來自 strong-judge agreement，完整 artifact 與 production verifier 都未齊備。

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

### 核心直覺：Judge 看見的是代理敘事，不是世界狀態

model judge 的根本限制不是模型「不夠聰明」，而是觀測介面不同。它看到最後幾張 screenshots、reasoning 與 actions，只能推斷任務是否完成；資料庫、檔案系統、API 或應用程式內部狀態才是任務真正發生的地方。當畫面看似成功、Agent 又寫出自信理由時，judge 很容易把一致的故事誤認成成功證據。

因此 OSReward 最值得帶走的心智模型是：**verdict quality 受限於 evidence quality。** 更大的 VLM 可以改善推斷，但不能補回輸入中不存在的 live state。可靠架構應先問「這個條件能否被 deterministic verifier 直接證明」，再把無法形式化的語意品質交給 model judge。

### 從 1,500 個指令到 1,019 條 gold trajectories

OSReward 不是把既有 benchmark 的 rollout 重新丟給模型評分，而是重做環境、任務、執行與標註。根據 **§3.1–§3.3、Appendix A 與 Appendix B.2**，四個平台的資料基礎並不相同：Web 使用隔離的 Chromium sessions 與部分自架 mirror sites；Windows 準備約 20 個日常與專業應用；Ubuntu 有約 30 個應用及約 20 種真實檔案；Android emulator 則植入帳號、紀錄、照片與干擾內容。這讓成功必須反映真實 state change，而不是只輸出一段看似合理的答案。

資料漏斗如下：

1. 標註者先撰寫約 1,500 個 grounded instructions，交叉檢查後約 800 個進入 collection。
2. 每個指令由一到三個 Agent 執行，backbone 橫跨 Claude、Gemini、Kimi、Qwen；環境故障、持續 anti-bot block 與 frozen run 先由自動 pre-filter 排除。
3. 剩下 1,128 條 trajectories 進入三人獨立標註；75% 三人一致，pairwise agreement 為 83.3%，Krippendorff's $\alpha=0.797$。
4. 282 條分歧案例進入兩位 senior reviewers 的共同 meta-review；另有 109 條因殘留品質問題被丟棄，而不是硬塞一個 label。
5. 最後得到 1,019 條 gold trajectories：440 success、579 fail。Hard-set 再審 373 個候選後保留 284 條，過程中還修正了 18 條原本錯誤的 success／fail label。

這個漏斗很關鍵：論文不是假設 human label 完美，而是把 disagreement 當成要被處理、甚至能用來構造 challenge set 的訊號。OSReward-Hard 因而不是任意抽出的「較難題」，而是曾讓受訓人類產生分歧、又經額外重審的案例。

![OSReward Figure 3：從 raw trajectories、三人標註與 meta-review 到 OSReward、Hard 與 Multi 子集](/paperReading/08-osreward-agent-evaluation/figure-3-annotation-pipeline.png)

*圖 3｜OSReward 的標註與再審流程。來源：[Sun 等人，OSReward Figure 3](https://arxiv.org/html/2607.28609v1#S3.F3)，依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

### Judge 實際看見什麼？先釐清評測協議

根據 **§4.1 與 Appendix C.2**，27 個 judge 都在同一協議下執行：輸入 task instruction、最後 $N=5$ 個 states（screenshots），以及對應的 reasoning 與 action text；使用 greedy decoding，沒有 task-specific tool、live environment access、step-level supervision 或 deterministic verifier。模型要輸出簡短理由與 success／fail；OSReward-Multi 才額外輸出 alignment 與 efficiency。

因此 Table 1 測量的是「從壓縮後的 trajectory record 推斷結果」，不是讓 judge 重新操作環境或直接讀取檔案內容。這個設定符合離線 trajectory curation 的需求，卻也限定了論文能回答的問題：它證明 VLM autorater 不可靠，不能直接證明 live-state verifier 同樣不可靠。

主要指標也必須拆開讀：

- **Accuracy**：整體 verdict 正確率。
- **success recall（sRec）**：真正成功的軌跡有多少被接受；太低代表 judge 過嚴。
- **fail recall（fRec）**：真正失敗的軌跡有多少被抓到；太低代表 judge 過度寬鬆。
- **balanced accuracy**：$(\mathrm{sRec}+\mathrm{fRec})/2$，避免 43／57 或 Hard set 的 30／70 類別比例掩蓋偏誤。

只看 accuracy 會把「總是猜 fail」在 Hard set 上得到約 70% 的 trivial baseline 誤認成能力；所以 OSReward 真正的診斷重點是 recall 的方向與錯誤組成。

### 用一個例子走完整個方法：Agent 說檔案已儲存

用一個解釋性情境理解評測流程：任務要求 Agent 修改文件並存到指定位置。這不是額外 benchmark case，而是把 §4.1 的協議與 Appendix F 的 false-success 類型串成一條資料流。

1. **Agent 執行**：Agent 操作應用程式，最後回報「已完成」，軌跡包含 screenshots、reasoning 與 actions。
2. **Gold label**：人工標註者依嚴格規則檢查任務是否真的透過環境完成；三人分歧時進入 senior meta-review。
3. **Judge 輸入**：VLM 只看到 instruction、最後五個 states 與文字歷史，沒有直接讀取目標檔案或 live environment。
4. **錯誤形成**：若最後畫面像是已儲存、reasoning 也聲稱成功，但檔案實際在錯誤路徑，judge 可能產生 false success。
5. **混合驗證**：production harness 應先用檔案存在性、內容 hash 或應用程式 API 驗證狀態；只有格式品質或語意符合度再交給 model judge。

這個 walkthrough 說明為何「換更強 judge」不是完整答案：只要驗證器仍看不到決定成功的狀態，能力提升就受觀測上限限制。

### Figure 3、Figure 4：Gold label 為何值得信任？

根據論文 **Figure 3** 與 §3.3，每條通過前處理的軌跡都由三人獨立標註；只有全數同意才直接定案，分歧案例不採簡單多數決，而是進入資深 reviewer 的共同審查。整體標註、重審與 hard-set verification 約耗費 800 human-hours。

**Figure 4** 顯示完整 OSReward 有 1,019 條軌跡，橫跨四個平台，成功／失敗比例約為 43%／57%，最長可到 100 steps。失敗案例中，86% 至少帶有 reasoning-and-planning error；失敗軌跡也明顯更長，因此 judge 面對的不是單張圖片分類，而是長序列證據整合。

OSReward-Hard 再從中挑出 284 條真正容易混淆的軌跡，成功／失敗比例約為 30%／70%。這些案例多半曾讓人工標註者產生分歧：有些失敗軌跡看起來非常像完成，有些成功軌跡則繞了不尋常的路徑。

### Table 1：完整集接近 90%，困難集卻掉到約 70%

論文 **Table 1** 的完整集結果看似樂觀：Claude-Opus-4-8 為 89.7%，GPT-5.5 與 Claude-Opus-4-6 都是 89.5%。但換到 OSReward-Hard，三者分別降到 69.7%、67.3%、67.3%。作者因此把 hard set 當成主要診斷面，而不是只報告較容易的平均分數。

更值得注意的是 success recall 與 failure recall。部分模型非常願意說「成功」：例如 Qwen3-VL-8B 在完整集的 success recall 是 99.8%，failure recall 卻只有 59.9%；到了 hard set，failure recall 只剩 8.2%。如果這類 judge 被用作 reinforcement learning 的 reward，它可能不是偶爾漏掉失敗，而是系統性獎勵 false success。

這是 OSReward 的核心發現：judge 的共同偏誤是 **leniency bias**。Agent 的文字軌跡宣稱完成時，judge 容易跟著敘事走，而沒有充分確認畫面或最終環境狀態。

### Figure 5、Figure 6：錯誤不是隨機，而是集中在 false success

**Figure 5** 把每個 judge 畫在 $(\mathrm{fRec},\mathrm{sRec})$ 平面上。多數模型落在高 sRec、低 fRec 的寬鬆區；GPT-5.2、Claude-Haiku 等少數模型較嚴格，但代價是拒絕更多真正成功的軌跡。最好的模型靠近對角線，顯示「平衡」比單一 accuracy 排名更重要。

![OSReward Figure 5：完整集與 Hard set 上各 judge 的 success recall 與 fail recall](/paperReading/08-osreward-agent-evaluation/figure-5-judge-bias.png)

*圖 5｜Judge 在 strict–lenient plane 上的分布；多數模型在 Hard set 進一步偏向寬鬆。來源：[Sun 等人，OSReward Figure 5](https://arxiv.org/html/2607.28609v1#S4.F5)，依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

作者再用強 VLM 分類並人工複核所有錯誤，得到 **Figure 6** 的六類 taxonomy：

| 方向 | 錯誤類型 | Judge 漏看了什麼？ |
| --- | --- | --- |
| Over-accept | task incomplete | Agent 停在目標前，卻用完成敘述收尾 |
| Over-accept | wrong action | 操作對象或操作內容錯誤，但過程看起來合理 |
| Over-accept | error suppressed | 中途錯誤沒有留在最後畫面或結尾敘事裡 |
| Over-reject | strict on path | 用非預期路徑完成，卻被當成失敗 |
| Over-reject | strict on deviation | 繞路或多餘步驟被誤判為沒完成 |
| Over-reject | ambiguous completion | 成功狀態沒有清楚出現在最後證據裡 |

其中「接受未完成任務」占所有錯誤約三分之二，且在每一個 judge family 都是最大宗，至少占各模型錯誤的 48%。整體 over-accept 約是 over-reject 的三倍；即使最強模型也仍約為二比一。這表示 failure recall 不是次要 metric，而是 reward safety 的核心：false success 會直接把錯誤行為當成正向訓練訊號。

### Figure 7：跨平台與失敗類型，困難並不平均

**Figure 7** 把 OSReward-Hard 上各 judge 的 binary accuracy 先按平台、再按失敗類型取平均。平台差距很明顯：Mobile 為 58.3%（$n=63$）、Ubuntu 52.1%（$n=132$）、Web 51.9%（$n=60$），Windows 只有 42.4%（$n=29$）。這不是「所有 desktop 任務必然較難」的普遍定律，而是指出這批 Hard trajectories 中，Windows 的應用狀態與較長操作鏈對 judge 最不友善。

![OSReward Figure 7：OSReward-Hard 按平台與失敗類型計算的平均 judge accuracy](/paperReading/08-osreward-agent-evaluation/figure-7-platform-failure-analysis.png)

*圖 7｜OSReward-Hard 的平均 judge binary accuracy，左圖按平台、右圖按失敗類型。失敗類型是 multi-label，因此樣本數加總會超過失敗軌跡數。來源：[Sun 等人，OSReward Figure 7](https://arxiv.org/html/2607.28609v1#S4.F7)，依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

失敗類型也呈現相同結構：Memory 49.5%（$n=20$）、Planning 49.0%（$n=187$）、Action 43.5%（$n=62$）、Perception 41.6%（$n=51$）。需要直接讀取畫面證據的 perception／action failure 最難抓；planning failure 雖然在資料中最多，卻較容易從 thought 與 action text 找到線索。這也解釋了為什麼「保留文字歷史」能提高總體 accuracy，卻不代表 judge 已學會驗證環境狀態。

### Figure 8：Judge 看的是畫面，還是 Agent 的故事？

§5 的 ablation 讓這個問題更具體。調整最後截圖的數量或移除 click marker，整體 accuracy 的變化通常不到 0.5 percentage point；但單一軌跡仍有 5–7% verdict 被翻轉，說明 reward label 本身存在不小噪音。

相較之下，**Figure 8** 顯示移除每一步 thought 與 action text，平均 accuracy 下降 7.2 pp，並翻轉 22.7% verdict。只移除 chain-of-thought、保留 actions，降幅較小：1.8 pp，翻轉 11.6%。證據表示文字 action history 確實提供重要訊號，但也形成風險：judge 可能過度依賴 Agent 描述自己做了什麼，而不是檢查環境是否真的改變。

### §5.3–§5.4：多想一點、多投幾票，為何仍不夠？

論文也測試了常見的 inference-time 補救方法：

- **提高 reasoning effort**：弱 judge 可增加數個百分點，但越靠近 frontier 收益越小；GPT-5.5 的提升也只有單調但有限的幅度。
- **改用 sampling／self-consistency**：同一 judge、同一輸入在 $T=0.7$ 重跑，就會翻轉 6–9% verdict。平均 accuracy 看似穩定，單一 reward label 卻不穩定。
- **多 judge majority vote**：top judges 的 pairwise Cohen's $\kappa\approx0.71$，代表它們常在同一批 hard cases 一起犯錯。Top-3 投票只比最佳單一模型高約 1 pp，成本卻乘上數倍。
- **Oracle pool**：如果事後總能挑到 pool 中正確的 verdict，可達 99.2%；但現實中不知道哪個 judge 在哪條 trajectory 正確。這支持未來研究 soft label 或 confidence routing，不能拿 oracle 當可部署結果。

成本讓問題更尖銳。依 **Figure 1、§5.4 與 Appendix Table 14**，判完整 1,019 條資料，Claude-Opus-4-8 約需 86 美元、GPT-5.5 約 45 美元；最佳 sub-$3 judge 在 Hard set 只到約 57%。完整集上看似只犧牲約 3 pp 就能降價 42 倍，但 Hard set 上便宜模型的 failure-catching 能力明顯崩潰。對需要數萬到數百萬次 reward calls 的 RL，這不是 API 單價問題，而是訓練方法是否可行的約束。

### Table 2：成功與否都難判，品質分級更難

OSReward-Multi 對 440 條成功軌跡加入 alignment 與 efficiency 評分。**Table 2** 顯示，即使最好的 GPT-5.5，Multi macro-recall 也只有 63.5%；Claude-Opus-4-8 是 60.8%。模型對品質排序的 AUC 優於直接輸出的等級，意味著模型可能知道 A 比 B 好，卻沒有校準好「究竟該給哪一級」。

所以 binary success、alignment、efficiency 不應混成一個模糊總分。正式 evaluation harness 至少要分開記錄：是否完成、是否遵守意圖、路徑是否有效率，以及副作用是否可接受。

### Figure 9、Table 3：OS-Shepherd-100K 不是人工 gold 的放大版

Benchmark 的 1,019 條是人工 gold，但 training corpus 不是。根據 **§6.1、Figure 9、Table 3 與 Appendix D.1**，作者先對 82K trajectories 建立 321,631 個 judge instances，再用多個強 judge、不同 screenshot settings 的高一致性結果篩選資料；約 85% trajectories 通過 agreement filter。關鍵做法是 **用 agreement 做 selection，而不是 majority vote 強迫替模糊案例定案**。

![OSReward Figure 9：從約十萬個原始指令到 OS-Shepherd-100K 的篩選與 ensemble judging 流程](/paperReading/08-osreward-agent-evaluation/figure-9-training-pipeline.png)

*圖 9｜OS-Shepherd-100K 的資料漏斗；band width 對應 trajectory 數量。來源：[Sun 等人，OSReward Figure 9](https://arxiv.org/html/2607.28609v1#S6.F9)，依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

原始 judge-instance pool 的平台分布為 Web 37%、Windows 19%、macOS 14%、Ubuntu GUI 11%、Ubuntu GUI+CLI 9%、Mobile 10%。保留後得到 69,663 條 unique trajectories、96,621 個 SFT samples，橫跨超過 335K screenshots；trajectory 中位數 12 steps、p90 為 25、最長 131。每條最多產生兩個 samples，分別對應 binary-only 與含 alignment／efficiency rubric 的輸出格式。

Label provenance 有三個值得注意的限制：

1. 訓練 label 來自 strong-judge agreement，不是新增的 human annotation；共同偏誤可能在「高一致」資料中被保留。
2. Corpus 混合自建與 OpenCUA、OpenMobile、ScaleCUA 等來源；其中 macOS 只出現在 training corpus，並不在 OSReward benchmark。
3. 約 25% 的 Ubuntu／Windows training instructions 與約 10% Web instructions 使用 reverse task synthesis，規模換來的是較弱的人工作業保證。

作者有做 contamination check：training trajectories 不來自 benchmark runs，且所有 training instructions 與 OSReward instructions 做 embedding cosine similarity $>0.8$ 的重疊篩查，沒有找到 overlap。這降低直接洩漏風險，但不等於排除語意相近任務或同一模型家族帶來的分布捷徑。

### Table 4：OS-Shepherd 改善了什麼？

作者建立約 100K 筆 reasoning-annotated judgments，先用 96.6K agreement-filtered samples 做 SFT，再用 GRPO 集中修正 false-success。**Table 4** 顯示 OS-Shepherd-9B 在完整集從 base model 的 76.7% 提升到 86.1%；hard set 從 39.4% 提升到 60.2%，failure recall 從 14.1% 提升到 57.6%。35B 在 hard set為 62.7%，只比 9B 高 2.5 pp 左右。

這支持「針對偏誤訓練」比單純增加模型尺寸更有價值，但不能解讀成 learned judge 已經等同 ground truth。即使 OS-Shepherd 改善 false success，hard-set accuracy 仍遠低於可靠的 production gate。

兩階段訓練的分工也比「SFT＋RL」四個字更具體：

- **SFT**：使用 96.6K agreement-filtered samples。作者訓練三個 epochs，但一個 epoch 後已 plateau，因此保留 one-epoch checkpoint；主要效果是把 Qwen3.5 base 從幾乎總是寬鬆的位置拉回較平衡區域。
- **GRPO**：從 SFT 模型「greedy 判錯、sampling 有時判對」的 recoverable errors 中挖約 3.1K 條，主要是 false success；其中約 2.9K train、0.2K validation，每例 8 rollouts，約 150 steps。
- **Reward**：格式正確且 verdict 正確為 1.0、格式正確但 verdict 錯誤為 0.1、格式錯誤為 0；只更新 language backbone，vision tower 在 RL 全程 frozen。
- **Compute**：兩個尺寸都使用 32 張 NVIDIA H200（4 nodes × 8），prompt 上限 24,576 tokens、response 512 tokens。

![OSReward Figure 13：Base、SFT 與 SFT 加 RL 逐步移向 balanced diagonal](/paperReading/08-osreward-agent-evaluation/figure-13-debiasing-trajectory.png)

*圖 13｜OS-Shepherd-9B 的去偏誤路徑；SFT 與 RL 逐步提高 fail recall，使模型離開 lenient corner。來源：[Sun 等人，OSReward Figure 13](https://arxiv.org/html/2607.28609v1#A4.F13)，依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

**Figure 13** 顯示 RL 的主要作用不是再大幅提高整體 discrimination，而是移動 operating point：犧牲部分 success recall，換取更高 fail recall。換句話說，SFT 做大部分 accuracy 工作，RL 負責矯正「錯在哪一邊」。這是很重要的 reward-model 設計洞見：當錯誤成本不對稱時，balanced accuracy 相近的兩個模型，在 production risk 上可能完全不同。

成本面，OS-Shepherd-9B 判完整集的 API-equivalent 約 1.36 美元。論文用 200 updates × batch 16 × 16 rollouts 的小型 online RL 估算 51,200 次 judge calls：Claude-Opus-4-8 約 4,000 美元、GPT-5.5 約 2,300 美元、OS-Shepherd-9B 約 68 美元，即約 30–60 倍差距；若 self-host，邊際成本則轉成自己的 GPU time。這是論文的 cost claim，不是「精確便宜 30–60%」。

### Figure 10：跨 benchmark 泛化，應讀成 agreement 而非 accuracy

作者把相同 judges 放到 AndroidWorld、WebArena、OSWorld，和各 benchmark 的 hand-written verifier 比較。**Figure 10** 顯示 agreement 主要受 platform 影響：mobile 最接近約 90% 的替代門檻，Web 約低 6 pp，desktop 明顯更差；各 judge 的平台排序相似。OS-Shepherd 在 OSWorld 與 AndroidWorld 是最佳 open judge，在 WebArena 進入 frontier cluster，且 failure-catching 的改善能跨資料集保留。

但這裡不能說「OS-Shepherd 在三個 benchmark 的真實 accuracy 已被證明」。原 verifier 本身可能有 false positive／negative，Figure 10 測的是 agreement；論文也沒有人工重標這三個 external sets。此外，這些結果評估的是完整 SFT＋RL recipe，不能單獨歸因於 GRPO。比較合理的結論是：**去寬鬆化的 operating point 有 transfer evidence，但離可替代 ground truth 仍有距離。**

### Appendix F：五種會騙過 judge 的具體案例

案例研究讓 leniency bias 不再只是統計名詞：

- **Figure 20**：文件明示日期是 2017，Agent 卻把它包裝成近期熱門內容，judge 沒有核對 recency evidence。
- **Figure 21**：Agent 宣稱完成 git 檢查，但 required `git status` 從未出現，也沒有 terminal output。
- **Figure 22**：到達正確的 Yahoo Finance 頁面，卻讀錯 Beta 的時間窗和值。
- **Figure 23**：Audacity 的操作與 export 敘事完整，judge 卻沒驗證前十秒 waveform 是否真的 Fade Out。
- **Figure 24**：LibreCAD 長軌跡最後成功存檔，掩蓋前面反覆插圖錯誤；「有 artifact」不等於 artifact 正確。

這些例子共同指向一個模式：最後一步的成功跡象容易蓋過早期錯誤，而長軌跡又讓完整因果追蹤更難。只提供最後幾張 screenshot 的 judge 特別容易把「已保存」「已匯出」「已回答」當成任務內容也正確。

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

實務上可把每個任務拆成一份 evaluation contract：

| 層級 | 應記錄的證據 | 建議 verdict 行為 |
| --- | --- | --- |
| State correctness | before／after state、API response、file hash、test result | 任一必要 invariant 失敗就 fail closed |
| Semantic quality | 使用者意圖、內容完整性、可讀性、alignment | Model judge 輸出 rubric 與 confidence，不覆蓋 state failure |
| Process quality | steps、重試、權限、成本、不可逆 side effects | 獨立計分，避免「成功」掩蓋危險路徑 |
| Conflict handling | verifier 與 judge disagreement、低信心、OOD signal | retry、專用 verifier 或人工覆核 |

至少追蹤五個 production metrics：false-success rate、fail recall、deterministic-verifier coverage、judge flip／disagreement rate、每個 confirmed verdict 的成本。Accuracy 仍可保留，但不能成為唯一 gate。

### 證據地圖（Evidence Map）

| 層次 | 可定位證據 | 文章可支持的結論 | 不能推出的結論 |
| --- | --- | --- | --- |
| gold benchmark | [Section 3.3、Figure 3、Appendix B.2](https://arxiv.org/html/2607.28609v1#S3.SS3) 的 1,019 條人工 gold trajectories 與 multi-stage annotation | 可以用來檢查 trajectory judge 對此資料分布的判定品質 | 不能把 Hard set 當成 production 成功／失敗的 base rate |
| judge failure | [Table 1、Figures 5–7、Section 4.3–4.4](https://arxiv.org/html/2607.28609v1#S4) 的 hard-case、false-success 與平台／失敗類型切片 | 受測 VLM judge 有系統性 leniency，且困難案例顯著改變解讀 | 不能據此宣稱某個 judge 或平台在所有工作流都不可靠 |
| training and transfer | [Table 4、Figure 9、Section 6–7](https://arxiv.org/html/2607.28609v1#S6) 的 OS-Shepherd recipe 與 external-benchmark agreement | SFT+RL recipe 在本文設定下改善 hard-set failure recall，並有 transfer evidence | 不足以證明 OS-Shepherd 取代 deterministic verifier 或擁有外部 benchmark 的新 ground truth |
| Bloss0m 工程判斷 | 上述證據加上 artifact audit | 將 deterministic state checks、model judge 與 disagreement routing 分層，比單一 judge gate 更合理 | 這是工程推論，不是作者做過的 production intervention |

### Artifact status：截至 2026-08-09

論文的 v2 已在 2026-08-06 修訂；本文的數字與圖表錨點仍明確指向原先深讀的 v1。直接逐一檢查官方 endpoints 後，artifact 狀態已與 2026-08-02 不同：不要再把「on their way」當成所有資源都尚未可用。

| Artifact | 2026-08-09 直接狀態 | 對重現的意義 |
| --- | --- | --- |
| [GitHub code](https://github.com/OS-Copilot/OSReward) | **部分可用**：repository 可開啟；web／Windows／Android collection 與 OOD judge analysis 已在樹狀目錄，OSReward evaluation harness、Ubuntu collection、100K construction、training/inference 仍標為 on the way | 可審計並使用已公開子模組，不能重跑完整 leaderboard 或端到端訓練 |
| [OSReward benchmark](https://huggingface.co/datasets/OS-Copilot/OSReward) | **可用**：public dataset card 與 viewer 顯示 1.02k test rows、trajectory／screenshot 欄位 | 可下載／抽樣重跑 judge；仍需用官方 harness 與版本化環境才能比對 paper leaderboard |
| [OS-Shepherd-100K](https://huggingface.co/datasets/OS-Copilot/OS-Shepherd-100K) | **gated**：有 dataset card、117 GB layout、SFT/GRPO schema 與 checksum，但需登入並同意分享聯絡資訊才可取檔 | 可評估格式與取得條件；未接受 gate 時，不能宣稱已可公開無條件重訓 |
| [OS-Shepherd-9B](https://huggingface.co/OS-Copilot/OS-Shepherd-9B) | **可用**：官方 Apache-2.0 model card、safetensors 與 Transformers/vLLM/SGLang 使用說明可見 | 可自架 inference；它仍需 canonical prompt/trajectory format，且 model card 明示 hard visual failures 仍可能漏判 |
| 35B checkpoint | **未在官方 collection 列出**；本次可直接核對的 official collection 只列 9B | 不把第三方量化頁面當成官方 35B release；35B 仍是 recheck trigger |

### 可重現性：可以從哪一層開始？

截至 2026-08-09，最小可行重現已不必等所有 artifact：可從公開 OSReward benchmark 抽樣、搭配 9B 或其他 judge 做 audit；但完整 leaderboard 的 harness、Ubuntu collection、100K construction pipeline、training/inference code 與可確認的官方 35B checkpoint 仍未齊備。OS-Shepherd-100K 也仍須先接受 Hugging Face gate 才能拿到檔案。因此，下面是「分層且可立即開始」的路徑，不是宣稱今天可以端到端重跑所有論文數字。

完整重訓需要 32 張 H200，不是一般團隊的合理起點；在 artifact 可用後，可採分層重現路徑：

1. **低成本 audit**：從已公開的 OSReward 各抽 success、false-success、long-horizon cases，重跑現有 judge，報 sRec、fRec、balanced accuracy 與 flip rate。
2. **Protocol reproduction**：固定 last-5 screenshots＋full action history＋greedy decoding，再分別移除 text、marker 或改 screenshot count，重現 Figure 8 的方向。
3. **Harness experiment**：對同一批任務同時跑 deterministic verifier 與 model judge，量測 disagreement；這最接近 production，而不是追求論文 leaderboard。
4. **Training study**：先只做小模型 SFT，觀察 operating point 是否從 lenient corner 移動；只有在 false-success 仍集中且可被 repeated sampling 找回時，才值得投入 targeted RL。

這個順序能把「重現論文數字」轉成「驗證自己的風險假設」，也避免一開始就複製昂貴訓練。

### 限制與不該過度解讀的地方

1. 截至 2026-08-09 已有 arXiv v2，且仍標為 work in progress；本文數字錨定 v1，後續版本可能改變資料、模型或數字。
2. Benchmark 涵蓋四個平台，但仍受選定應用程式、任務分布與 Agent family 限制。
3. Hard set 來自人類分歧案例且刻意提高 fail 比例，適合診斷，不代表真實 production traffic 的 base rate。
4. 主設定只看最後五個 screenshots 加全文字歷史；對需要早期畫面或 live state 的任務，輸入本身已遺失證據。
5. OS-Shepherd-100K 的 label 來自 strong-judge agreement；篩掉模糊案例提高乾淨度，也可能讓模型學不到真正需要仲裁的邊界。
6. Figure 10 對既有 benchmark 的比較是「與原 verifier 的 agreement」，而那些 verifier 本身也可能有 false positive／negative，不能直接當成新 ground truth。
7. 成本依 2026 年 5 月官方 list price 或同尺寸 market rate 估算；部署地區、batching、量化與自架硬體都會改變 frontier。
8. 截至 2026-08-09，官方資源已部分可用但仍不完整：公開 benchmark 與 9B 不代表完整 harness、100K 的無條件下載、training recipe 或 35B 都已可端到端驗證；paper claim 不等於每一層 artifact 都可重現。
9. OS-Shepherd 的大型訓練使用 32 張 NVIDIA H200；即使 artifact 完整公開，也不代表完整訓練能低成本重現。
10. Model judge 適合補足難以手寫的語意判斷，不能取代本來就能精確實作的 deterministic check。

### 工程結論

OSReward 最值得保存的結論是：**Agent evaluation 不是選一個 judge model，而是設計一條證據鏈。** 完成宣告、文字軌跡與截圖都只是證據；真正的成功應優先由環境狀態證明。Model judge 的價值在覆蓋 open-ended quality，而不是把所有可驗證條件重新變成機率判斷。

對正式系統而言，下一步不是追求單一 judge 的 leaderboard 第一名，而是量測 false-success rate、failure recall、judge disagreement、覆核成本與狀態 verifier 覆蓋率。這些指標才會告訴你，Agent 究竟是真的完成，還是只把失敗說得很像成功。

### 讀完後的三個記憶點

1. **技術精髓**：Agent 的完成宣告與最後畫面只是觀測；成功應盡量由環境狀態證明。
2. **證據精髓**：OSReward-Hard 揭露完整集平均數掩蓋的 false-success 問題，failure recall 比單一 accuracy 更能看出 reward 風險。
3. **採用邊界**：OS-Shepherd 是成本較低的語意 judge，不是 deterministic verifier；正式系統仍需要狀態檢查、衝突仲裁與人工抽查。

### 原始來源

- [OSReward arXiv abstract and version history](https://arxiv.org/abs/2607.28609)
- [OSReward full HTML paper](https://arxiv.org/html/2607.28609v1)
- [OSReward official project and artifact status](https://os-copilot.github.io/OSReward-Home/)
- [OSReward dataset repository](https://huggingface.co/datasets/OS-Copilot/OSReward)
- [OS-Shepherd-100K dataset repository](https://huggingface.co/datasets/OS-Copilot/OS-Shepherd-100K)
- [OS-Shepherd-9B official model card](https://huggingface.co/OS-Copilot/OS-Shepherd-9B)
