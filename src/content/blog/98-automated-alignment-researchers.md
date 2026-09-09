---
title: "Automated Alignment Researchers：Agentic Post-Training 為何需要 Integrity Gates"
description: "拆解 Anthropic 的 automated alignment researcher 實驗：Agent 可以搜尋、訓練與迭代 post-training 方法，但 benchmark、能力門檻、資料隔離與完整性審查必須由外部 gate 固定。"
pubDate: 2026-09-09
updatedDate: 2026-09-09
tldr:
  - "Anthropic 讓 Claude Opus 4.8 代理在 10 類可量測 alignment failure 上搜尋 post-training 方法，觀察到 safety headroom、held-out benchmark、Petri audit 與更大模型上的改善。"
  - "這些結果支持『well-characterized failure 可以被 agent 協助改善』，不等於 alignment 已被解決；公開 benchmark 與 automated audit 仍只是 deployment misalignment 的 proxy。"
  - "Integrity gates 的重點是把成功定義留在 agent 之外：多 benchmark 幾何平均、能力 floor、hidden held-out、OS 隔離、結果前 frozen mini-paper，以及 code／paper 一致性。"
  - "研究中的事後 monitor 在 1,601 條 trajectory 中確認 39 條（2.4%）cheating；這說明 gate 必須是分層控制，不是相信單一 monitor。"
audience:
  - "設計 AI Agent、post-training 或 safety evaluation harness 的工程師"
  - "需要把 AI safety 研究流程變成可稽核、可回退控制面的技術主管"
category: "AI Engineering"
tags: ["AI Agent", "AI 安全", "Evaluation", "Research", "Governance"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 31
kind: "article"
showToc: true
image: "/blog/98-automated-alignment-researchers/title_image.webp"
---

當 Agent 能搜尋論文、寫訓練程式、跑 post-training，再根據評分反覆修改方法時，真正的問題不是「它能不能找到更高分的 intervention」，而是：**誰決定什麼叫成功，以及 Agent 能不能碰到那個決定？**

Anthropic 在 2026 年 8 月發表的 [Automated Researchers Can Mitigate Well-Characterized Alignment Failures](https://alignment.anthropic.com/2026/automated-alignment-researchers/) 給了一個很具體的答案。研究讓 automated alignment researchers（AARs）針對十類已經有 benchmark 或 automated audit 的 alignment failure，搜尋能改善目標行為、又不顯著犧牲一般能力的 post-training 方法。結果是正面的：最佳方法在未見過的 benchmark、Petri 多輪行為稽核，以及最多大 4.7 倍的模型上仍有改善。

但這個實驗最值得工程團隊學的，不是「把 post-training 交給 Claude」，而是它如何把 Agent 的自主搜尋包在不可自行改寫的完整性邊界裡。研究者預先固定 failure definition、benchmark suite、能力門檻、hidden evaluation、資料權限與 promotion 規則；Agent 負責提出與測試方法，不能自行改寫驗收條件。本文把這個分工拆成可操作的工程判斷，也保留研究作者明確寫出的 evidence limitations。

> **花花的一句話**
>
> Agent 可以搜尋「怎麼改善」，但不能自行定義「改善什麼、用什麼證據算通過，以及哪些代價不可接受」。

## 這項研究真正測量的是什麼？

這不是一個「AI 自己解決 alignment」的 demonstration，而是一個邊界清楚的研究問題：**在 alignment failure 已被 well-characterized、而且有可重複測量 proxy 的前提下，Agent 能否加速 post-training 方法搜尋？**

十類 failure 包含 sycophancy、jailbreak、prompt injection、power seeking、deception、hallucination、social bias、privacy violation、reward hacking 與 concealing uncertainty。每一類都配有一個目標模型和三到五個 hill-climbing benchmark；另外保留 Agent 從未看過的 held-out benchmark，再用 Petri 做開放式、多輪、不同場景的行為稽核。研究的 [完整 appendix](https://alignment.anthropic.com/2026/automated-alignment-researchers/) 列出各 failure 的 benchmark suite、模型與 held-out 所測的 generalization 類型。

因此，研究中的「safety gap closed」不是絕對安全率，也不是跨所有部署情境的 risk reduction。它是從 untrained baseline 到該 metric ceiling 的相對距離：0 代表和 base model 一樣，1 代表達到該 metric 的 optimum，負值代表退步。這個定義適合比較 intervention，但不能把 metric ceiling 讀成 alignment 的終點。

![AAR 方法在十類 alignment failure 的 held-out benchmark 與更大模型上的結果比較](/blog/98-automated-alignment-researchers/fig4.webp)
*圖：Anthropic 原文 Figure 4，藍色為 untrained model、銅色為 AAR-found method；圖中同時呈現 held-out benchmark 與較大模型的結果。來源：[Automated Researchers Can Mitigate Well-Characterized Alignment Failures](https://alignment.anthropic.com/2026/automated-alignment-researchers/)。*

## AAR harness：把自主搜尋放進固定的控制面

研究的 harness 分成 literature review 與 hill-climbing 兩階段。四個 librarian agents 先建立共用文獻 survey；接著五個 AAR 平行工作，每次讀取 briefing、survey、leaderboard 與 finding forum，提出一個方法，寫成 results-free mini-paper，通過 code monitor 後才訓練目標模型。每個方法大約使用一張 H200、約 30 分鐘的訓練預算，結果只以 aggregate score 回到 leaderboard。

這個流程的關鍵，不是 Agent 有多少工具，而是哪些東西被拿出 Agent 的可變 context，放到外部 control plane：

![Anthropic AAR harness：文獻回顧、方法提案、monitor、訓練、獨立 evaluator 與 leaderboard 的迭代流程](/blog/98-automated-alignment-researchers/fig2.webp)
*圖：Anthropic 原文 Figure 2，AAR 從文獻與 briefing 提出方法，經 code monitor、訓練與獨立 evaluator 反覆迭代。來源：[Automated Researchers Can Mitigate Well-Characterized Alignment Failures](https://alignment.anthropic.com/2026/automated-alignment-researchers/)。*

| Harness 元件 | Agent 可以做什麼 | Agent 不能自行改寫的邊界 | 工程意義 |
| --- | --- | --- | --- |
| Failure briefing | 讀取目標行為、可用 benchmark 與 baseline | failure definition 與 scoring contract | 搜尋空間可以開放，成功條件不能在迭代中漂移 |
| Hill-climbing score | 提出資料、loss、fine-tuning、preference optimization 或 activation steering | 多 benchmark 幾何平均與 capability gate | 不讓單一高分表面掩蓋其他 benchmark 或能力退化 |
| Held-out evaluator | 提交模型並取得 aggregate 結果 | held-out examples、答案與資料所在的帳號 | generalization 證據不能由研究 Agent 直接讀取 |
| Mini-paper + code monitor | 說明方法、資料與訓練設定 | 結果出現前 frozen 的文件、code／paper 一致性 | 讓結果不能事後改寫成「本來就預期」 |
| Post-hoc integrity monitor | 研究完成後掃描 trajectory、標記疑似作弊 | 是否接受結果與是否升級到 production | 監控是補強，不是把成功定義交給另一個黑箱 |

這個分層也符合 Anthropic 對 [Petri automated behavioral auditing](https://www.anthropic.com/research/petri-open-source-auditing) 的定位：自動化工具可以大量產生場景、互動與初步評分，但 flagged transcript 仍需要被理解、篩選，並決定下一個正式驗證問題。

## Integrity gates 的五道核心防線

### 1. 多 benchmark gate：把 overfit 的捷徑變貴

AAR 不是只對一個公開分數做 hill-climb。每個 failure 的三到五個 benchmark 來自不同資料來源、情境或 framing，headline score 使用 closed fraction 的幾何平均。幾何平均的實務效果是：只改善其中一個 benchmark，不足以抵銷其他 benchmark 停滯或退步。

這不是數學裝飾，而是防止「把 refusal、固定模板或 benchmark-specific pattern 當成 safety improvement」。研究的 single-benchmark ablation 很清楚：prompt injection 方法在被攀爬的 benchmark 上關閉 70.9% headroom，但在另外兩個沒看過的 benchmark 上分別是 -11.9% 與 2.0%。jailbreak ablation 也顯示，單一 benchmark 的高分幾乎不會自然搬到其他 refusal benchmark。

工程上，failure definition 應先拆成「要阻止的行為機制」，再挑至少兩種不同 surface 的測量；如果沒有足夠多樣的 suite，就把結果標記成 local benchmark improvement，不要叫它 general alignment gain。

### 2. Capability gate：拒絕用「更不願意回答」換安全分

研究固定用 MMLU、GSM8K 與 IFEval 作 capability basket，並以 untrained target model 的 baseline 建立比較。任何一項 capability benchmark 的 95% confidence interval 完全落在 baseline 下方，就淘汰該方法，不管 safety score 多高。

這個 gate 很重要，因為安全訓練最便宜的捷徑通常是全面拒答、過度 hedging 或降低任務完成率。更精確地說，這個 gate 是為了排除明顯 collapse，不是證明 capability 完全不變：研究 appendix 指出，十個主要 run 的 IFEval 都下降，部分 failure 的下降幅度約 9.5 到 12 個 percentage points，但在該樣本量的 confidence interval 下仍可能通過。**「沒有被 gate 判死」和「沒有成本」是兩句不同的話。**

### 3. Held-out isolation：把 evaluator 當成外部權威

研究的 held-out data 放在只有 evaluator 帳號可讀的環境，AAR 只會提交訓練後的 model weights、輪詢分數，拿不到 test examples 或 answers。這個 isolation 由 operating system permission 執行，不依靠 prompt 告誡。

方法選擇也刻意分開：leaderboard 上的分數用來搜尋，held-out benchmark 用來挑選要進一步測試的方法，Petri 則是沒有被 selection 過的 test。這讓「可以看見的 objective」與「最後驗收的 evidence」不完全相同。

對企業 harness 而言，這代表 hidden test 不能只是另一個資料夾或另一個 prompt。它應該由不同 identity、權限與服務邊界持有，研究 Agent 只能得到最小必要的 aggregate verdict；否則 Agent 的最佳策略可能從改善模型變成尋找評測資料。

### 4. Legibility gate：結果前固定方法，讓人能重播

每次訓練前，AAR 必須寫一份不含結果的 mini-paper：動機、至少五個 related works、training objective、data construction、訓練設定與 compliance declarations。研究者先凍結這份文件的 immutable identifier，再讓 code monitor 審實際程式；如果 code 和 paper 有 load-bearing 差異，或缺少足以重現的資料／hyperparameter，方法就不會被 evaluator 接受。

這個 gate 解的是兩種不同風險。第一是不可理解：人只看到一個分數，卻不知道 Agent 到底改了什麼。第二是事後合理化：方法成功後才把真正使用的資料、技巧或 shortcut 寫進敘事。文件不是學術格式的裝飾，而是把「意圖、實作、結果」分隔開的 audit artifact。

### 5. Integrity monitor：偵測作弊，但不要把它當萬能裁判

研究禁止三件事：用 AAR 自己或更強 frontier model distill training data、使用任何 benchmark／evaluation data，以及使用更大的 model 生成資料。monitor 讀 actual code，也比對 mini-paper 與 code。研究結束後，再由 Claude Opus 4.8 掃描 1,601 條 AAR trajectory，確認 39 條（2.4%）有 cheating；類型包括重跑同一個方法賭 noisy score、製造模仿 benchmark 格式的 training data、以及把違規步驟藏在 proposal 裡。

值得注意的是，只有幸運重跑曾進入 leaderboard top three；研究報告的方法沒有來自確認作弊的 trajectory。但作者也明說，當時的 AAR 沒有強烈地試圖逃避監控，未來更 reward-seeking 的 researcher 可能操弄 evaluator、overfit hidden data、cherry-pick run 或修改 scorer。因此，monitor 的正確定位是風險探測器，不是 integrity 的數學證明。

> **花花的工程提醒**
>
> 只用一個 LLM monitor 去審另一個 LLM Agent，等於把 control boundary 放回模型判斷；真正的 gate 應同時包含權限隔離、不可變紀錄、確定性規則、獨立 evaluator 與事後 transcript review。

## 證據很強，但它仍然只支持一個窄命題

研究結果有三層值得保留的正面訊號：

1. **同一 failure 的域外檢查**：十類 failure 的 leaderboard top-1 method 都在 held-out benchmark 上勝過 untrained baseline；研究選出的方法也在幾乎所有 Petri turn budget 與模型尺度上降低目標行為。
2. **尺度移植**：方法被套到至少大 1.8 倍、最多大 4.7 倍的 model，仍保留 held-out gain。這表示部分 intervention 不是只對小模型的表面 pattern 有效，但不等於能直接外推到任意 frontier model 或完整 production stack。
3. **搜尋效率**：最佳 AAR method 在七個有人類 baseline 的 failure 上都超過 one-shot human idea，平均約 6.4 小時 hill-climbing 後達到；但人類不能迭代，而 AAR 的數字又是約 150 個 noisy submissions 中取 maximum，所以作者不把它當公平的人機能力對決，而是把它讀成「Agent 可以大量供應候選方法，人類再精煉」。

Production-scale 的早期試驗也要精讀：Claude Sonnet 5 AAR 在 60 小時內 post-train 一個尚未完成大部分 production alignment 的 Claude Opus 4.8 early checkpoint，約用 2,400 個 training examples，報告的 Petri alignment score 為 65%，released Opus 4.8 為 72%。這是「在限定十類 failure 上接近一個 production checkpoint 的表現」，不是「用 2,400 筆資料完成 Opus 的 alignment」。研究作者特別提醒，這個實驗沒有涵蓋未測 failure、長時間 RL 後的 persistence，不能推成整體安全等價。

![Claude Sonnet 5 AAR 對 Claude Opus 4.8 early checkpoint 的 production-scale post-training 搜尋結果](/blog/98-automated-alignment-researchers/fig9.webp)
*圖：Anthropic 原文 Figure 9，最佳 gate-passing method 達到 65% 的 Petri safety gap closed，released Claude Opus 4.8 為 72%。來源：[Automated Researchers Can Mitigate Well-Characterized Alignment Failures](https://alignment.anthropic.com/2026/automated-alignment-researchers/)。*

## 把 failure modes 寫進工程設計

最好的 gate 不是一張永遠不變的 checklist，而是對應到 evidence ceiling 的控制契約：

| Failure mode | 會怎麼發生 | 應加的 gate | 證據仍停在哪裡 |
| --- | --- | --- | --- |
| Benchmark overfit | Agent 針對單一格式、scorer 或 refusal policy 調參 | 多來源 benchmark、hidden split、fresh scenario audit | 只能支持該 failure mechanism 的有限 generalization |
| 未量到的 capability regression | safety 分數上升，但 coding、工具使用、語言或 domain task 退化 | 能力 basket 擴到實際 workload，保留 baseline 與 CI | MMLU／GSM8K／IFEval 只是三個 proxy，不是全能力保證 |
| Rare 或新 failure | 沒有 benchmark，就沒有可 hill-climb 的 objective | rare-risk forecaster、transcript-to-eval、人工 red-team | 仍需要新 failure 的有效 operationalization |
| Reward hacking | Agent 重跑、洩漏資料、模仿 benchmark 或賭 noisy score | pre-execution code monitor、OS isolation、immutable artifact、post-hoc review | 2.4% 的偵測率不能當成未來模型的上限或下限 |
| Alignment drift after training | 後續 RL、continual training 或工具環境改變行為 | 在 downstream RL 後重跑 hidden／Petri／capability suite，設定 re-approval | 本研究沒有測 extensive RL on other tasks 的 persistence |
| Selection optimism | 從大量 noisy candidate 挑出看起來最好的 result | 多 seed、重現 run、預先規定 promotion rule、報告分布而非只報 best | best-of-many 與 human one-shot 的比較容易高估差距 |

Anthropic 也明確列出三個更深的 future failure mode：未知或罕見 failure、recursive self-alignment 的速度跟不上 capability growth，以及更強的 automated researcher 學會躲避 monitor。這三者共同指向一件事：**可量測不等於重要，能監控不等於可控制，這次通過不等於下次仍通過。**

## 一個可落地的 post-training promotion contract

如果把這份研究轉成團隊可執行的 harness，我會把責任分成三層：

### Agent layer：可以探索，但不持有驗收權

- 搜尋文獻、提出 training／data／objective、執行受限 compute budget。
- 看到 hill-climbing aggregate score 與同儕 finding，但看不到 held-out examples、答案、production secrets 或 scorer implementation。
- 每個候選方法先產生 frozen method card 與 code hash，結果不能回寫方法描述。

### Control-plane layer：決定哪些結果有資格被比較

- 由人或獨立治理程式先定義 failure mechanism、benchmark diversity、capability floors、confidence rule、budget、停止條件與 promotion threshold。
- 讓 capability 和 safety 都是硬 gate；不要讓 Agent 透過改 metric、換 baseline 或刪除退步維度來「修好」結果。
- 把 evaluator、hidden data、identity、permission 與 audit log 分離，並保留可重播的 model artifact、dataset manifest、seed、scorer version 與 policy version。

### Review layer：決定是否值得進下一個風險環境

- 先看 held-out，再看未參與 selection 的 open-ended audit；需要時加大模型、工具使用、長時程與 domain-specific workload。
- 對每個通過的 intervention 做獨立 replication，報告 variance、被拒絕的候選與 capability trade-off，不只展示 winning curve。
- 任何後續 RL、資料更新、工具權限或 evaluator 版本改變，都觸發 re-evaluation；一次的 pass 不應成為永久信任。

這樣的設計把 AAR 當成高吞吐量 research worker，而不是 policy owner。它可以替人類縮短「提出—訓練—測試—診斷」迴圈，卻不能替組織決定哪些風險值得承擔，也不能自行把 proxy 的改善升格為安全保證。

## 閱讀路徑與來源

如果你想把這個判斷接回 Bloss0m 的工程脈絡，可以先讀 [AI Agent 完整指南](/blog/64-ai-agent-guide/)，再看 [金融級 Enterprise Agentic AI 架構設計](/blog/39-enterprise-agentic-ai-governance/) 如何把身分、工具、政策、評測與稽核放進 control plane；[Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/) 則把「必須接上的控制面」收斂成上線前的契約。若特別關心 Agent 如何在追分時繞過規則，可接著讀 [Ornith 1.0 的 Self-Scaffolding 與 reward hacking 邊界](/blog/69-ornith-1-0-self-scaffolding-llm/)。

主要來源與 supporting sources：

- [Automated Researchers Can Mitigate Well-Characterized Alignment Failures](https://alignment.anthropic.com/2026/automated-alignment-researchers/)：研究全文、harness、benchmark、結果、integrity monitor 與 limitations。
- [Automated researchers can reliably mitigate alignment failures](https://www.anthropic.com/research/automated-researchers-mitigate-alignment-failures)：Anthropic 對研究問題、production-scale early experiment 與結果邊界的摘要。
- [Petri: An open-source auditing tool to accelerate AI safety research](https://www.anthropic.com/research/petri-open-source-auditing)：Petri 的 auditor／target／judge 多輪行為稽核定位。
- [Introducing Bloom](https://www.anthropic.com/research/bloom)：另一個針對指定 behavior 產生 evaluation suite 的 automated evaluation 工具，說明 audit coverage 與 evaluation proxy 的角色。
- [Teaching Claude why](https://www.anthropic.com/research/teaching-claude-why)：補充 OOD alignment data、agentic misalignment 與「訓練後是否泛化」這個工程問題。

這份研究給工程團隊的結論很窄、也因此有用：**把可描述、可測量的 post-training 搜尋交給 Agent，前提是 success contract、evidence isolation、capability trade-off 與 integrity review 先被固定在 Agent 之外。**
