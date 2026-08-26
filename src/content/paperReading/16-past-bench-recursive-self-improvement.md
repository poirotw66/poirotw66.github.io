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

## 90 秒地圖 / The paper in 90 seconds

- **問題**：持久 agent 後續得分提高，可能來自模型、prompt、任務難度或殘留 context，而不是正確使用先前經驗。
- **核心想法**：PAST-Bench 在 fresh-session task families 中，固定 prompt、grader、tool stack，只切換 persistence-on/off；同時量 task-score gap 與 write/read/artifact 的 mechanism evidence。
- **最強證據**：26 個 scenario、204 個 episode、四種能力、七個模型與四個框架；Hermes+ 報告 overall gap 從 +0.13 到 +0.15、Mech 從 0.64 到 0.73（Table 2、Section 4.3）。
- **邊界**：overall gap 差異小於 run-to-run variation，任務由提案團隊設計，matched ablation 是強控制而不是完整因果證明。

## 先前方法為何不足 / Why the previous approach is insufficient

一次性 benchmark 或只量 memory retrieval，把 base model、runtime、prompt 與 persistence 混成一個分數。跨 session 若未清除 volatile context 也可能只是 prompt propagation。PAST-Bench 的關鍵是 evaluation episode 不可從前一輪 context 偷渡（Section 2、Section 3.2）。

## 核心直覺 / Core intuition

family 有 cold、learn/update、evaluation、control episode；evaluation 使用 fresh session。$\Delta_f=S_f^{w/ evolve}-S_f^{w/o\ evolve}$ 只改變對 family state 的存取，而 mechanism evidence 檢查 agent 是否真的 write、read、update 目標 substrate。兩者同時為正才接近經驗造成的改善（Figure 1、Section 3.2、Appendix B）。

## 逐步例子 / Worked example

Update family 先寫入舊規則，再以授權新規則更新；後續 evaluation 不重述規則。persistence-on 應讀新版本並拒絕 stale value，persistence-off 不可讀 family state。若前者得分較高但 trace 沒有正確 read/update evidence，或用了錯誤 substrate，不能解讀為可信 self-evolution。此為 Figure 4–8 / Appendix A.3 的簡化說明。

## 如何讀實驗 / Evidence, controls, and limits

**Table 2** 固定 family、grader、工具與 seed，改變 persistence access；三次平均 $\Delta$ 是 behavior evidence。**Section 4.3 / Table 4** 對 Plan、Render、Route、Gate、Close intervention 做消融，最清楚的 Update 改善不等於全能力普遍增益。**Appendix D.5** 是必要反證：+0.13 到 +0.15 小於 run variance，不能單獨宣稱 Hermes+ 更好。

## Artifact 與採用判斷 / Artifacts and engineering decision

截至 **2026-08-09**，官方 [PAST-Bench repository](https://github.com/Gen-Verse/PAST-Bench) 可存取，宣告 Apache-2.0 與 benchmark、runner、adapter、tests；完整 reproduction 仍需 clone、釘選 revision、模型/API credential 與上游 framework license。適合把持久層做成可切換、可留 trace 的實驗表面；不適合用單一 $\Delta$ 宣稱 RSI，或未測 stale/distractor control 就讓 agent 自動寫入長期規則。

## 三個記憶點 / Three things to remember

1. 後續得分提高不等於 self-improvement；要有 matched persistence-off 與 trace evidence。
2. 拆開結果變好和經由預期機制變好，是 PAST-Bench 最重要的貢獻。
3. 小 aggregate gain、變異與 framework 差異，要求先受控實驗，再做 RSI 宣稱。

## 先回答一個問題：Agent 隔天變強，怎麼知道是昨天的經驗幫了它？

我的讀法是：**PAST-Bench 最重要的貢獻不是宣稱 Agent 已經會 recursive self-improvement，而是把「跨 session 變好」從一個模糊的 demo，拆成可以控制、量測、回看 trace 的 attribution 問題。**

一個 later-task score 變高，可能來自 base model、prompt overlap、runtime 行為、任務難度、工具結果或評分噪音。PAST-Bench 用 fresh-session task families、persistence-on/off matched controls，以及 saved artifact 與 runtime telemetry，檢查這個增益是否真的經過預期的 write → retrieve → apply/update 路徑（[論文 §1、§3](https://arxiv.org/html/2608.04003v1#S3)）。

結果是「有改進，但不平均，也不能只看一個總分」：七個 base models 都有正的平均 gap，但不同模型把增益集中在不同能力；固定 MiniMax-M2.7 時，nanobot 和 Hermes 都是 $\Delta=+0.13$，Mech 卻是 0.57 與 0.64（[Table 2、Table 3](https://arxiv.org/html/2608.04003v1#S4)）。所以這篇讀完，我會把「Agent 自我進化」改寫成三個分開的問題：**它有沒有變好？變好的差異是否真的來自持久狀態？trace 是否支持它走了預期機制？**

> **花花的工程提醒**
>
> 把「下一個 session 得分更高」和「因為讀了昨天寫入的狀態而得分更高」拆開量。前者是結果，後者才接近可歸因的改進。

## 論文身份與範圍：這裡的 self-evolution 比 RSI 小一層

PAST-Bench 是 Shuhan Xue、Zixin Ding、Yichen Shen、Yinjie Wang、Zhenfei Yin、Yingcheng Wu、Yuxin Chen、Mengdi Wang、Ling Yang 的 **arXiv cs.CL v1 preprint**，2026-08-04 提交。它沒有列出期刊、會議或 OpenReview 審查紀錄；因此本文把它當作 preprint 讀，不把結果寫成已完成 peer review 的結論（[arXiv metadata](https://arxiv.org/abs/2608.04003)）。

作者把研究對象稱為 **online self-evolution**：Agent 不重新訓練 model parameters、不做 prompt optimization，也不靠把前一輪對話原封不動塞進長 context，而是跨 session 保存 preference、task history、tool routine、skill 或修改後的規則，再在後續任務中使用它。這是比完整 recursive self-improvement 更窄、但更能在今天的 personal agent 中操作的行為層。換句話說，論文測的是「持久狀態是否讓下一次工作更好」，不是「Agent 能否改寫自己、遞迴提升整個學習演算法」。

## 證據地圖：論文直接支持、作者主張與 Bloss0m 的工程推論

| 聲音 | 證據邊界 | 本文如何使用 |
| --- | --- | --- |
| **論文直接支持** | 在作者設計的 synthetic 26-family／204-episode suite 中，fresh session、persistence-on/off control、score definition 與 trace contract 產生文中報告的 $\Delta$ 與 Mech。 | 把正的 paired gap 視為這個 suite 中的證據，不延伸成一般因果效果或已部署 Agent 的結果。 |
| **作者主張** | 作者把 PAST-Bench 與 Hermes+ 定位成研究 systematic improvement 的 foundation，並報告機制對應的診斷。 | 把 foundation 保留在 evaluation 與 diagnosis 層次，不升格成已證明完整 recursive self-improvement。 |
| **Bloss0m 的工程推論** | artifact diff、retrieval event 與 paired control 是 memory claim 有用的可觀測性要求。 | 在把 trace 當成 production Agent「學會了」的證據之前，仍需加上 counterfactual check 與 external outcome。 |

這個區分很重要：**論文直接支持**的是 harness 下的量測行為；**作者主張**給出作者的詮釋；**Bloss0m 的工程推論**是論文本身沒有驗證的部署建議。

## PAST-Bench 的方法骨架

### 1. 先把能力拆成四種跨 session 依賴

套件包含 26 個 task families、204 個 synthetic episodes，所有任務都不是從真實使用者資料而來。四個 capability 的分配如下；數量來自 Appendix A.1 的 Table 7，比例也能在 Figure 2 直接看見：

| Capability | Families | Episodes | 它在問什麼 |
| --- | ---: | ---: | --- |
| Memory | 5 | 41 | 能不能保存 preference、constraint、prior case 或 exception，之後在弱提示下找回？ |
| Procedural reuse | 8 | 64 | 能不能把 SOP、playbook 或 multi-step workflow 變成可重新執行的 skill？ |
| Information gathering | 6 | 48 | 在採取行動前，能不能主動查找已存在、但沒有出現在當前 prompt 的證據？ |
| Update | 7 | 51 | 新規則能不能覆蓋舊規則，並避免 stale state 洩漏到下一個 session？ |

這個拆法很關鍵：一般 memory benchmark 可能只問「記不記得」，但這裡同時問 **寫入、找回、套用、更新**。例如 Update 不只看 Agent 是否讀到新值，也看舊值是否仍然混在 artifact 或回答裡。Information Gathering 則把「明明應該查，但 Agent 沒查就採取不可逆行動」獨立出來。這使得後面的診斷不會把所有持久化失敗都叫做 memory failure。

![PAST-Bench Figure 2：四種能力與 26 個 task families、204 個 episodes 的分配](https://arxiv.org/html/2608.04003v1/assets/figure2_suite_distribution.png)

*Figure 2。這張圖用能力與子 family 的比例呈現 benchmark coverage。Source: Xue et al., PAST-Bench, §3 / Figure 2（[figure anchor](https://arxiv.org/html/2608.04003v1#S3.F2)）；直接重用 arXiv HTML 圖片，依 arXiv.org perpetual non-exclusive license 標示來源。*

### 2. 每個 family 是 cold → learn/update → evaluation，再加 control

每個 task family 是有順序的 episodes，而不是 204 個互不相干的問題：

1. **Cold**：先量第一次接觸的行為，建立 calibration 與 headroom；它不是 persistence-off baseline。
2. **Learn**：讓 Agent 接觸應保存的 clause、procedure 或 evidence，寫進 benchmark 管理的 persistence substrate。
3. **Update**：在 Update families 中提供 authoritative second write，測試新狀態是否取代舊狀態。
4. **Evaluation**：清掉 volatile context，在新 session 中移除關鍵 trigger wording，要求 Agent 自己找回並套用之前的狀態。
5. **Control**：加入 no-retention、distractor、stale、wrong-mechanism 等控制，檢查增益是否只是 prompt shortcut、表面記憶、錯誤重用或寫進錯的 substrate。

這裡的 persistence 包括 memory records、skills、profile entries、session-history indices、saved artifacts 與 home-state fixtures。每個 evaluation episode 都有一個 matched pair：**persistence-off** 不准 runtime 讀取該 family 產生的狀態，**persistence-on** 則允許讀取。兩邊固定 prompt、grader、tool stack 與 seed；volatile session context 仍然清除。作者明確把這視為「強設計控制」而非 causal proof（[§3.2](https://arxiv.org/html/2608.04003v1#S3.SS2)）。

### 3. 分數與機制證據分開算

對 family $f$，論文定義 persistence gap：

$$
\Delta_f = S_f^{\mathrm{w/}} - S_f^{\mathrm{w/o}}
$$

其中 $S_f^p$ 是 persistence condition $p$ 下，evaluation episodes 的平均 task score；capability 層級先對 families 做 macro-average，Overall 再對四個 capabilities 做平均。因此 $\Delta$ 不是把所有 episode 混成一個 micro-average。

每個 episode 的 task score 是：

$$
s_e = \sigma_e \times (0.80c_e + 0.20r_e)
$$

$c_e$ 是 completion，$r_e$ 是對 tool-call error 的 recovery rate，$\sigma_e$ 是 safety gate；安全違規會把整個 episode score 歸零。每個 episode 跑三個 independent trials，missing 或 crash 的 trial 得 0（[Appendix B.1](https://arxiv.org/html/2608.04003v1#A2.SS1)）。

但 $\Delta$ 只回答「結果有沒有變好」。為了回答「是不是走了預期路徑」，作者另外定義 **mechanism-evidence score（Mech）**。每個 family 的 expectation contract 指定 expected artifact type、keyword patterns、最低 write/read counts 與 retrieval signals；Mech 把 write precision、recall accuracy、update correctness、retention horizon 與 pollution rate 組合：

$$
\mathrm{Mech}_f = \frac{1}{5}(\mathrm{wp}+\mathrm{ra}+\mathrm{uc}+\mathrm{rh}+(1-\mathrm{pr}))
$$

直覺上，Mech=1 代表「有寫入正確狀態、後來真的取回、正確套用或更新」，Mech=0 代表預期路徑完全沒有出現。不過它仍是 **與 expectation contract 一致的 telemetry signal**，不是從反事實實驗得到的因果效果（[Appendix B.3](https://arxiv.org/html/2608.04003v1#A2.SS3)）。

## 實驗設定：模型、Agent framework、grader 與成本

主實驗有七個 base models：GLM-5.1、Kimi K2.6、DeepSeek-V4-Pro、MiniMax-M2.7、GPT-5.4、Claude Sonnet 4.6、Claude Opus 4.6。Framework comparison 固定 MiniMax-M2.7，包含 nanobot、ZeroClaw、Agent-Zero、Hermes，以及作者加上五個 runtime mechanisms 的 Hermes+。作者也在 Appendix C.2 以 Codex CLI 與 Claude Code 做 general-purpose agent 的 protocol check；那不是把兩者宣稱成 personal-agent framework，而是展示 matched protocol 可以在可切換 persistence access 的系統上運作（[Appendix C.1–C.3](https://arxiv.org/html/2608.04003v1#A3)）。

主要 grader 是 MiniMax-M2.7，temperature 0、最多 8,192 tokens。作者用 48 個 blinded samples 做 human validation，每個 capability 12 個；human-human exact agreement 是 83.3%，judge 與 human mean 在 ±0.25 內是 68.8%、±0.5 內是 91.7%。這表示 grader 可以做 scalable grading，但不能當成 human judgment 的替代品，而且研究沒有變換 judge model 或 prompt（[Appendix B.4](https://arxiv.org/html/2608.04003v1#A2.SS4)）。

成本也應一起讀：Table 12 的平均每 episode，Base Hermes + MiniMax-M2.7 是 12,615 tokens、70.5 秒；Hermes+ 是 31,859 tokens、77.4 秒。也就是約 2.5× tokens，但 wall-clock 約 1.10×；這是 runtime prompt/context 與少量額外決策換來的成本，不代表 full-suite 的總金額已被完整報告（[Appendix D.6](https://arxiv.org/html/2608.04003v1#A4.SS6)）。

## 結果一：Persistent state 確實帶來增益，但能力分布很不平均

Table 2 的 Hermes model comparison 中，七個 base models 的 Overall $\Delta$ 都是正的，範圍從 +0.13 到 +0.24：MiniMax-M2.7 是 +0.13，GLM-5.1 是 +0.20，GPT-5.4 是 +0.24。可是四種能力的貢獻不一樣：GPT-5.4 的增益大致分布在 Memory（+0.37）與 Update（+0.34），GLM-5.1 的 Update 是 +0.36，Kimi K2.6 的 Memory 是 +0.33。只報 Overall 會把「模型本來擅長什麼」和「哪一種持久化真的幫上忙」藏起來（[Table 2](https://arxiv.org/html/2608.04003v1#S4.T2)）。

固定 MiniMax-M2.7 的 Table 3 更直接展示 attribution 問題：

| Framework | Overall $\Delta$ | Mech | 讀法 |
| --- | ---: | ---: | --- |
| nanobot | +0.13 | 0.57 | 總增益與 Hermes 一樣，但路徑證據較弱，且 Procedural 是 -0.06。 |
| ZeroClaw | +0.12 | 0.55 | 增益主要集中在 Memory（+0.29），Procedural 反而 -0.04。 |
| Agent-Zero | -0.08 | 0.39 | Memory、Info、Update 都退步，並不是所有 persistent framework 都自然受益。 |
| Hermes | +0.13 | 0.64 | 四種能力都正向，基線中的路徑對齊較好。 |
| Hermes+ | +0.15 | 0.73 | 平均 gap 與 mechanism evidence 都最高，但 Procedural 是 -0.02。 |

這就是 Figure 10 所畫的兩個軸：x 軸是 Overall persistence gap，y 軸是 Mech。Hermes 與 nanobot 幾乎站在同一個 x 位置，卻有不同的 y；所以「變好多少」與「像不像是透過預期 persistent mechanism 變好」不能合成一個排行榜分數。

![PAST-Bench Figure 10：固定 MiniMax-M2.7 時的 agent attribution frontier](https://arxiv.org/html/2608.04003v1/assets/figure_agent_attribution_frontier.png)

*Figure 10。x 軸是 Overall persistence gap，y 軸是 mechanism evidence；同樣的 $\Delta$ 可以對應不同的機制證據。Source: Xue et al., Appendix D.3（§A4）/ Figure 10（[figure anchor](https://arxiv.org/html/2608.04003v1#A4.F10)）；直接重用 arXiv HTML 圖片，依 arXiv.org perpetual non-exclusive license 標示來源。*

## 結果二：Hermes+ 的五個修補，改善最大的是 Update，但不是穩定的全域勝利

Hermes+ 是 diagnosis-driven design，不是先做一套大型新架構再看 leaderboard。作者從 trace 裡的失敗對應到五個 loop stages：

| 機制 | 介入點 | 要修的 failure |
| --- | --- | --- |
| E1 Plan | 在 plan 前檢查 saved state | Agent 沒查就先做不可逆動作。 |
| E2 Render | 用 typed binding render current value | 新舊 memory 形式混在一起，下一個 session 不知道哪個有效。 |
| E3 Route | 建立、排序、patch 可執行 skills | SOP 只停留在 transcript 或重複 note，沒有可重新執行的 skill。 |
| E4 Gate | recall-dependent action 前強制 retrieval | Agent 在 noisy prompt 下直接回答或行動，跳過應查的 evidence。 |
| E5 Close | episode 結束時同步抽取與 flush | 修正後的 rule 沒有成為下一個 session 能讀到的 authoritative artifact。 |

Table 4 的 single-mechanism ablations 顯示，每個 mechanism 大致在它針對的能力上留下訊號：E3 的 Procedural $\Delta=+0.10$、E4 的 Information Gathering $\Delta=+0.17$、E5 的 Update $\Delta=+0.16$；完整 Hermes+ 的 Update $\Delta=+0.24$，但 Procedural $\Delta=-0.02$。這是「可診斷」而不是「每個零件效果可相加」的證據（[Table 4、Figure 9](https://arxiv.org/html/2608.04003v1#A4.SS1)）。

![PAST-Bench Figure 9：單一機制與完整 Hermes+ 的 capability-level persistence gap ablation](https://arxiv.org/html/2608.04003v1/assets/figure_ablation_heatmap.png)

*Figure 9。E3、E4、E5 分別在 Procedural、Information Gathering、Update 上有較明顯的 single-mechanism gap；full Hermes+ 在 Update 最突出。Source: Xue et al., Appendix D.1（§A4）/ Figure 9（[figure anchor](https://arxiv.org/html/2608.04003v1#A4.F9)）；直接重用 arXiv HTML 圖片，依 arXiv.org perpetual non-exclusive license 標示來源。*

作者還做了一個 focused Procedural interaction diagnosis：Base Hermes 的 gap 是 +0.087，full Hermes+ 是 +0.085；拿掉 E2 反而是 +0.108，拿掉 E3 是 +0.062，拿掉 E5 是 +0.042。這提醒我們：runtime mechanisms 可能互相干擾，single-mechanism row 不能被讀成完整系統的 additive contribution（[Table 5](https://arxiv.org/html/2608.04003v1#S4.T5)）。

跨 model 的結果也不是單向：Hermes+ 在 MiniMax-M2.7、Claude Sonnet 4.6、GPT-5.4 上至少持平或改善 Hermes，但 DeepSeek-V4-Pro 與 Claude Opus 4.6 有輕微回退。這是可轉移的診斷 scaffold，不是 universal improvement（[Table 6](https://arxiv.org/html/2608.04003v1#S4.T6)）。

更重要的是 run variance。Hermes 的 Overall $\Delta=0.13\pm0.04$，Hermes+ 是 $0.15\pm0.06$；所以 +0.02 小於 run-to-run variation。Update 的平均 gap 從 +0.12 到 +0.24 比較醒目，但它的標準差也從 0.01 增到 0.09。對一篇主張 attribution 的 benchmark，這個 caveat 不是附註，而是結果本身的一部分（[Appendix D.5 / Table 11](https://arxiv.org/html/2608.04003v1#A4.T11)）。

> **花花的工程提醒**
>
> Mech 比較像「路徑有沒有留下證據」的 telemetry 指標，不是因果估計。要問必要性，還得刪除、替換或污染候選 artifact，再測行為是否隨之改變。

## 這套證據支持什麼，不支持什麼？

### Paper evidence

- 在作者設計的、完全 synthetic 的 26 families / 204 episodes 上，matched persistence controls 能量出跨 session 的 positive gap；七個 base models 的 Hermes 組合都得到正的 Overall $\Delta$（[§4.1–§4.2](https://arxiv.org/html/2608.04003v1#S4)）。
- 同一個 task-score gap 可能有不同的 artifact / telemetry evidence：nanobot 與 Hermes 都是 +0.13，但 Mech 不同（[Table 3、Appendix D.3](https://arxiv.org/html/2608.04003v1#S4.T3)）。
- Hermes+ 的 target-specific ablations 與 trace case studies 顯示，Plan、Render、Route、Gate、Close 對應到可觀察的 failure stage；full composition 的清楚增益在 Update（[§4.3–§4.4、Appendix A.3](https://arxiv.org/html/2608.04003v1#S4.SS3)）。

### 作者的主張，我會保留語氣

作者稱 PAST-Bench 與 Hermes+ 提供研究 persistent agents 如何從「保留經驗」走向「系統性改進」的 foundation。但這裡的 foundation 是 evaluation / diagnosis foundation，不等於證明 Agent 具備完整 RSI。Hermes+ 也應被讀成針對該 benchmark trace 的 diagnostic scaffold，而非在所有 model、任務或部署環境都會提升的 runtime。

### Bloss0m 的 inference 與 unsupported claims

我的 inference 是：如果企業 Agent 要宣稱「memory 讓它變好」，最低限度要保存同一 task family 的 on/off paired runs、persistent artifact diff、retrieval event、最後的 external outcome；只看 final answer 或單次 success rate 不夠。這是工程推論，不是論文測試過的 enterprise result。

論文證據不支持以下說法：

1. PAST-Bench 已經證明 recursive self-improvement 或模型能自行改進學習演算法。
2. Synthetic、作者撰寫的 families 已代表真實使用者的長期分布；Appendix A.2 明確說沒有 real-user data。
3. Matched on/off 差異就是 causal effect；作者自己把它定義為 strong design control，且 Mech 是 expected pathway consistency。
4. Hermes+ 在 production 或 enterprise agent 上優於所有 memory architectures；framework adapters 保留 native context、compaction、truncation 等差異，跨系統 absolute score 不能直接當公平排名。
5. Mech 分數在不同 persistence interface 都可直接取得；Appendix C.3 說 black-box agent 可以算 Task Score 與 $\Delta$，但沒有 observable persistence events 就沒有 Mech。

## 工程上怎麼用：先做 attribution harness，再做 memory 優化

### 適合採用的情境

- 你有可切換的 persistence access，能在同一 model、prompt、tools、grader、seed 下跑 on/off。
- 你想知道失敗是在 write、read、apply、update、stale filtering 還是 retrieval timing，而不是只想要一個 memory leaderboard。
- 你的 Agent 可以輸出 artifact diff 與 persistence events；否則只能得到行為 gap，無法得到 Mech。

最小可行的 internal harness 可以是：

```text
family: learn -> fresh eval -> control
             |              |
      persistence-on   persistence-off
             |              |
       artifact + trace + external outcome
             \__________ paired delta _________/
```

先在一個 capability slice 上量四個東西：task score、$\Delta$、artifact correctness、retrieval/apply event。再按 failure type 做 counterfactual：刪掉候選 memory、換成 stale value、把 skill 放到錯的 namespace，檢查 Agent 是否真的受該狀態影響。這比先把所有 history 塞進 context 更能回答「哪個 persistence surface 在工作」。

### 不適合直接套用的情境

- Agent 沒有可控的 session boundary，前一輪 prompt 或 context 會滲入 evaluation；這會讓 persistence gain 與 in-context carry-over 混在一起。
- 系統只需要一次性、可由 deterministic verifier 完整判斷的任務；此時直接檢查 external state，比導入 Mech 或 LLM judge 更合理。
- 你需要把結果推廣到真實客戶、跨 domain transfer 或長期月尺度 drift；本 v1 的 synthetic isolated families 沒有提供這些證據。
- 你要用 Overall $\Delta$ 當 production gate；Agent-Zero 的負 gap、Hermes+ 的 Procedural regression，以及 run variance 都說明必須按 capability 與 risk 分層看。

## 可重現性與 artifact status（截至 2026-08-09）

這一節特別把「論文說有」和「endpoint 實際可用」分開：

| Artifact | 獨立驗證結果 | 判定 |
| --- | --- | --- |
| arXiv abstract、HTML、PDF v1 | `arxiv.org/abs/2608.04003`、`/html/2608.04003v1`、`/pdf/2608.04003v1` 都可存取。 | 可用；版本仍是 v1 preprint。 |
| 官方 PAST-Bench code | [Gen-Verse/PAST-Bench](https://github.com/Gen-Verse/PAST-Bench) public、main branch；`src/past_bench`、`self-evolve-tasks-v2`、configs、mock services、tests 都在 repo。 | 可用；原始 code 以 Apache-2.0 發布。 |
| Benchmark families / runner / tests | 直接開啟 repo 的 task、runner、test 路徑可見；README 提供 Python 3.11+、uv、Docker、API key 與 smoke-test commands。 | 可用但有外部依賴。 |
| Release / checkpoint / dataset page | 2026-08-09 可存取官方 GitHub repo 與其 API；releases 與 tags endpoints 都回傳空清單，README 也沒有另外列出 Hugging Face dataset、checkpoint 或 demo URL。 | **截至檢查日未找到**；不要寫成已提供 checkpoint、versioned bundle 或可離線重現。 |
| Models / APIs | README 的 profiles 需要 MiniMax、Zhipu、Kimi、DeepSeek 或 OpenAI 等外部 API keys；model weights 不在 PAST-Bench repo。 | 需另備 credentials / provider access。 |
| Third-party agents | repo 內有 Agent Zero、Hermes、nanobot、ZeroClaw 的 adapter / local component 與 upstream license；其 upstream repositories 也可存取，但各自 license 與 runtime 依賴仍有效。 | 部分可用；不等於所有環境 byte-for-byte 相同。 |

最小 reproduction 應該是 **條件式** 的：先依 README 建 Python 3.11、uv、Docker 與 model API environment，build sandbox image；只跑一個 family，例如 Hermes+ + MiniMax-M2.7 的 `SM01_preference_adoption`，開啟 `--compare-no-persistence`，保存 `sequence_results.json`、`sequence_summary.json`、`sequence_comparison.json`，再把一個 persistence-on/off paired gap 與 trace evidence 對照。完整 26-family、七模型、四 framework reproduction 需要外部服務與時間/成本測量；論文 Table 12 只給每 episode 的 token 與 wall-clock，不提供完整套件的總費用。

## 閱讀結論與下一步

PAST-Bench 值得放進 Agent evaluation 路徑，因為它把「memory 有沒有用」改成 **跨 session 的結果 + 控制差異 + 機制證據** 三件事一起看。它也很誠實地暴露出目前的邊界：task families 是 synthetic、framework comparison 不是單一架構的純因果比較、Mech 依賴可觀測事件與預先寫好的 expectation contract，且 Hermes+ 的 overall gain 小於 run variance。

如果你要把它接到現有的 Bloss0m 閱讀路徑，可以先看 [Beyond RAG for Agent Memory](/paper-reading/06-beyond-rag-for-agent/) 的 persistence substrate，再對照 [OSReward](/paper-reading/08-osreward-agent-evaluation/) 如何處理「結果看似成功但證據不足」的 judge failure；[ContextWeave](/paper-reading/09-contextweave-workflow-benchmark/) 則把問題推向更接近真實 workflow 的長期工作評測。這三篇合起來的工程問題不是「哪個 memory 最強」，而是：**一個 Agent 的下一次行為，能不能由可回看的狀態與外部結果共同證明它真的學到了？**

## Primary sources

- [PAST-Bench arXiv abstract and version history](https://arxiv.org/abs/2608.04003)
- [PAST-Bench full HTML paper, v1](https://arxiv.org/html/2608.04003v1)
- [PAST-Bench PDF, v1](https://arxiv.org/pdf/2608.04003v1)
- [PAST-Bench official repository](https://github.com/Gen-Verse/PAST-Bench)
- [PAST-Bench Apache-2.0 license](https://raw.githubusercontent.com/Gen-Verse/PAST-Bench/main/LICENSE)
