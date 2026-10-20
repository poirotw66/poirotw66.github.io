---
title: "TruthInsightBench 精讀：如何評估 AI 是否真的在做科學發現"
description: "TruthInsightBench 把評估焦點從重現預設答案，移到 Agent 自行提出的主張是否有可追查、穩健、受控制且可被推翻的證據。本文拆解盲測任務、29 項評分與四種 coding-agent scaffold 的結果，也檢視單一 frozen model、單次執行和 LLM judge 校準的邊界。"
pubDate: 2026-10-20
updatedDate: 2026-10-20
tldr:
  - "TruthInsightBench 不要求 Agent 找回一個指定論文結論，而是讓它面對中立研究目標與凍結資料，自行提出主張，再依主張背後實際執行的分析和 artifacts 評估證據成熟度。"
  - "40 個盲測任務涵蓋 10 個科學領域；四個 coding-agent scaffold 共用 DeepSeek-V4-Flash，在 58.40–60.27 分形成沒有可靠差異的窄平台。"
  - "可追查性與新穎性較強，控制測試、穩健性、跨資料集驗證與可證偽性偏弱；分數揭露的是執行與判斷間的落差，不是科學發現已自動化。"
audience:
  - "設計或採購 AI scientist、coding agent 與研究自動化系統的研究者"
  - "建立 Agent benchmark、模型評估與人工審查流程的工程師"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "AI Research"]
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
field: "AI Systems"
difficulty: "advanced"
showToc: true
image: "/paperReading/101-truthinsightbench-evidence-grounded-discovery/title_image.webp"
paper:
  title: "TruthInsightBench: An Evidence-Grounded Benchmark for Automated Evaluation of Open-Ended Scientific Discovery Agents"
  authors:
    - "Zhibo Yang"
    - "Chen Zhang"
    - "Yuewei Zhang"
    - "Hao Wang"
  year: 2026
  venue: "arXiv:2609.05079 v1 (2026-09-04; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.05079v1"
    arxiv: "https://arxiv.org/abs/2609.05079"
    code: "https://github.com/TruthInsight-stack/TruthInsightBench"
series:
  id: "scientific-discovery-agent-evaluation"
  title: "Agent 評測與可觀測性"
  part: 1
  totalParts: 1
---

<!-- paper-reading-no-body-figures: No material original figures were licensed for reuse as of 2026-10-20. -->

## 90 秒掌握論文

- **問題**：很多 scientific-agent benchmark 把任務、資料和評分規準都圍繞一篇已知研究設計，因此量到的通常是 Agent 能否重現指定分析或找回目標結果。這對複現研究很重要，卻回答不了另一個問題：Agent 能不能從資料自己形成一個有根據、可檢驗的主張？
- **核心洞見**：TruthInsightBench 將論文身份、來源結論、預期數值、分析路徑與評分資產留在 Agent 執行環境之外。Agent 只看到中立目標、凍結資料和必要 metadata；評分時才把它實際執行的程式、結果與報告交給固定 judge，檢查主張的證據成熟度。
- **最強證據**：40 個任務、10 個領域、四個 coding-agent scaffold、同一個凍結基礎模型；系統平均分落在 58.40–60.27/100，六組成對比較未顯示可靠排名。維度分數則呈現明顯落差：evidence auditability 約 78–81%，novelty 約 83–87%，而 control testing 約 11–16%、robustness 約 9–14%、cross-dataset generalization 幾乎為零（Sections 4.2–4.3; Figures 2–3; Tables 4–6）。
- **主要邊界**：這是回溯式 dry-lab benchmark，不等於真正的新科學發現；每個 system-task 組合只跑一次，而且四種 scaffold 全部共用單一 frozen model。單一 GLM-5.1 judge 的人類校準與第二 judge 敏感度分析仍待進行，分數可自動重算不等於其效度已獲獨立證明（Sections 6.1、6.3）。

本文解讀 arXiv v1（2026 年 9 月 4 日提交），目前按預印本看待，沒有把它當成已通過同儕審查的定論。論文的主角不只是四個 Agent 的分數，而是評估對象如何改變：從「答案和既有研究有多像」改成「Agent 的主張有沒有從可追查的分析中長出來」。作者的 benchmark 讓這種差異可以被執行和檢查；同一批結果也顯示，能產出程式、圖表和看似合理報告的系統，仍經常沒做足控制、穩健性與外部驗證。值得追問的是：自動評分器能否成為可信的研究訓練訊號，以及目前看到的弱點究竟代表 Agent 不會做，還是任務與單階段 protocol 尚未充分提供它們做的機會？

## 從重現答案到判斷證據：論文試圖補哪個缺口

回顧式評測有明確優點。若研究問題是「Agent 能否依照論文方法重建程式和數值」，提供目標研究和預期結果，才能驗證重現品質。然而，當任務和評分表都由已知論文導出，Agent 可以朝著預設 endpoint 前進；它不必自行決定哪些資料模式值得提出為發現，也不一定要比較替代解釋。作者因此把評測問題拆成兩個能力：**執行已指定的分析**，以及**在沒有指定答案時做研究判斷**。後者包括選擇值得主張的現象、檢查數值或模型 artifacts、比較解釋、設定對照、評估穩健性、確認外部資料是否支持，以及縮小結論適用範圍（Section 1）。

這不是說 reproduction benchmark 沒價值，也不是把「沒有標準答案」視為更高級的唯一評測方式。作者把 TruthInsightBench 定位為互補的探索性嘗試：前者回答「能否重現一項指定研究」，本 benchmark 問「能否從資料提出有證據的 claim」。若讀者把兩種評測的分數混在一起，會把能力維度不同的工具硬排成一張榜單。

論文所謂 discovery 也有窄而明確的定義：由任務資料形成、可被獨立測試，並對研究對象間的關係、機制、量化特徵或適用邊界增加判斷的科學主張。它不要求主張一定是正向新效應；null result、反例、方法造成的假象或可適用範圍，都可能是有效成果，條件是證據鏈可檢查（Section 3）。這個定義把「新奇」和「可信」分開：聲稱以前沒有人說過，不能代替支持它的資料和分析。

## 核心直覺：先切開研究材料與評分答案

### 盲測任務的可見邊界

作者以一個任務 tuple 描述這道邊界：

$$
\tau = (g, D, M, T_0 \mid p^*, F^*, A^*)
$$

其中 Agent 能看見中立研究目標 $g$、凍結資料 $D$、metadata $M$（變數、單位、實驗條件、獨立觀測單位）與文獻截止時間 $T_0$。豎線右側的 $p^*$ 是來源研究，$F^*$ 是非窮盡的參考發現，$A^*$ 是驗證腳本、容忍度、評分權重與 audit trail；這些都留在評估端，直到 Agent 交出凍結的執行輸出才使用。執行輸出 $y=(\pi,o,r)$ 分別代表程式與分析過程、產出的中間結果和 artifacts、最終研究報告（Equation 1; Figure 1）。

所謂 blind 是 protocol-level blindness：benchmark 可證明 source conclusions 和評分資產沒有被放進 task workspace，但無法證明 DeepSeek-V4-Flash 的預訓練資料未接觸過相關論文。作者用每項任務早於來源研究日期的 $T_0$，並按 cutoff 前文獻評 novelty，減輕污染疑慮，卻沒有聲稱完全排除它（Sections 3.1、6.1）。這條限制很重要：任務資訊隔離與模型記憶是不同風險來源。

### 任務怎麼被挑選和製作

40 項任務各自來自一篇 2018–2024 年的同儕審查研究。研究團隊先依三條件挑選：資料保留能解釋變數、單位和實驗情境的結構；只用將提供給 Agent 的資料，就能重導出至少兩個主要結果；資料內有真實重複、條件變異、控制或替代分析，讓 robustness 與 competing-explanation test 有實際空間。建構者每項任務會重導出兩項主要結果，並各做樣本、方法和 measurement definition 三種擾動；所以每項 8 次建構期驗證、40 項共 320 次（Section 3.2）。

這是有目的的資料集策展，不是由所有科學領域隨機抽樣。40 項來自 Astronomy 3、Chemistry 3、Computational Mathematics 4、Earth Science 4、Energy 4、Information Science 4、Life Science 5、Materials Science 4、Neuroscience 4 和 Physics 5；資料形式則包括表格、時間序列、結構陣列、網路、分子或粒子座標及科學影像（Table 2）。這樣的跨度有利於測試 Agent 會不會隨資料型態選分析方法，但每一領域仍只有 3–5 個任務，不能當作領域能力排名。

### 六個維度不是六種模型能力

29 個 rubric item 把「主張與證據的關係」分成六種可評價屬性。維度是 benchmark 的測量架構，不應誤讀成一套保證科學發現的程序：

| 維度 | 權重 | 它檢查什麼 |
| --- | ---: | --- |
| Evidence auditability | 45 | 資料來源、研究對象、分析過程、結果與 claim 是否形成可追查且互相一致的證據鏈。 |
| Robustness | 15 | 在隨機重跑、樣本更動、方法或門檻更動下，結論是否穩定，並說清適用邊界。 |
| Control testing | 15 | 是否比較簡單 baseline、無訊號對照、競爭解釋、confound/artifact，或用不同誤差來源的方法交叉檢驗。 |
| Cross-dataset generalization | 10 | 是否在獨立資料、時間段或研究對象上，依預先決定的分析和準則再次測試。 |
| Novelty | 10 | 相對 $T_0$ 前文獻，claim 是否增加新的對象、關係、量化結果或適用邊界。 |
| Falsifiability | 5 | 是否提出能區分競爭假設的未來觀測，以及明確可執行的更新規則。 |

每個 item 可得 0、0.5 或 1；不是提出「未來應做某個實驗」就拿分，而要有已執行分析和可定位結果。Evidence auditability 權重最高，原因是首先要確認當前資料確實支撐 claim，但作者也刻意讓 robustness、controls 和外部確認占有分數，避免可重現的程式輸出直接等同可信 discovery（Sections 3.5–3.6; Table 3; Appendix B）。

### 評分機制：從主張分數聚合成任務分數

Judge 先對一項 claim 的 29 個 item 計算加權品質 $Q(d)$，再依同一 system-task 報告中的研究對象、範圍、關係方向與關鍵證據作語義去重。最好的兩項不同 claim 分別成為 $S_1$ 和 $S_2$，任務分數為：

$$
R_{a,t}=\mathrm{clamp}(0.60S_1+0.20S_2+B_{yield}+B_{target}-P_{false}, 0, 100)
$$

前兩項的 evidence-quality 主體最多 80 分；如果額外提出品質至少 40 分的不同發現，最多加 10 分（依序 4、2、2、2）；兩個隱藏參考發現的 coverage 最多加 10 分。若報告宣稱為真、但程式結果或重導出明確反向，去重後每項扣 5 分，最多扣 10。接著把 40 個 task score 等權平均為 system score（Equations 2–4; Section 3.6）。

這個設計把 breadth 控制在有限 bonus，讓主要分數由最強與第二強主張的證據品質決定。$B_{target}$ 的確讓隱藏來源研究在事後評分時提供最多 10 分 reference coverage；但它不是主要答案鍵，80 分主體仍由 Agent 自己的 claim 與 artifacts 評分，作者也報告移除兩項 bonus 的 main-body-only ablation 仍重現相同系統排序。讀者應理解這是作者採取的設計取捨，而不是「完全不用參考答案」；它避免將 benchmark 偷換成只找回論文結論，卻仍讓 source finding 對總分有有限影響（Section 3.6）。

## 用化學任務走完整個方法：一步步檢驗研究主張

Chemistry_07 的 photoionization delay 曲線裡有很尖的局部 spike。若 Agent 只看圖形並挑一種 interpolation method，它可以很快把尖峰寫成新的物理 resonance，程式也可能成功跑完。但同一波形也可能由高階插值造成的數值假象產生。真正重要的下一步是比較不同插值方法，並擾動節點位置，看尖峰是否仍存在（Section 5）。

用 benchmark 的視角把步驟拆開：

1. **輸入**：只給科學目標、凍結資料、變數語意和實驗資訊，不告訴 Agent 原論文身份或它的結論。
2. **提出觀察**：Agent 發現 photoionization delay 曲線在某段有異常 spike，提出這可能是 resonance 的 claim，並保存產生圖形的分析程式和數值。
3. **辨別解釋**：Agent 比較不同插值器、移動採樣節點並檢查負對照或替代假設。如果尖峰隨方法改變而移動或消失，應降低物理解釋的信心；若在合理擾動下穩定，仍需界定其適用範圍。
4. **提供可核對證據**：Judge 不只讀報告句子，而對照已執行的 code、輸出結果、關鍵數字和 claim。只承諾「之後會做穩健性測試」不算真的做過。
5. **指出可推翻條件**：成熟的報告應說明什麼新測量會支持、收窄或推翻這個物理解釋，且把測量和判定條件寫到能執行的程度。

這是依論文 Chemistry_07 案例整理的教學路徑，不是作者公開的某個 Agent 完整執行 trace。作者報告四個系統在此 task 得分介於 50.9–59.9；較低成績來自表面規律與數值 artifacts 之間需要分辨，而不是任務用反直覺陷阱刁難模型。類似地，Physics_05 要檢查 synthetic model 的 temporal-delay transition 是否能外推到 real network；報告出現明顯趨勢不能替代真正的跨資料驗證（Sections 4.4–5; Table 7）。

> **花花的工程提醒**
>
> 能把程式跑完，只代表你走到了一個可報告的結果。先問哪個簡單替代解釋也能產生同一張圖，再問什麼觀察會讓自己撤回結論；這兩步常比多寫一段機制敘事更有用。

## 實驗如何讀：窄平台不是 Agent 排名

### 評測設定

作者測 Claude Code 2.1.220、OpenScience 2.0.1、Codex CLI 0.149.0、DeepSeek Harness 0.1.0rc7；四個 scaffold 都使用同一個 frozen DeepSeek-V4-Flash，並關閉 thinking，以盡量把差異隔離在 tool use、state management、task decomposition 和 workflow。每個 system 在 40 個 task 各跑一次，合計 160 個 system-task runs。Judge 固定使用 thinking 關閉的 GLM-5.1，4-bit weights／8-bit activations（W4A8）；研究合計評了 724 個 reported discoveries，語義去重後 630 個（Section 4.1）。

固定 base model 是有意義的控制，但它只讓本文回答「在這個模型快照下，這四種 scaffold 怎麼不同」。它不是覆蓋四個 scaffold 與多個 base model 的完整 factorial design，也沒有估每個 system 同一 task 重跑時 claim selection 的變異。實驗設定對效度有幫助，卻同時限定結果外推範圍。

### 整體分數：均值差距很小，不能宣稱勝負

| System | 平均 task score / 100 | 95% CI of mean | 每 task 範圍 |
| --- | ---: | ---: | ---: |
| Claude Code | 60.27 | 58.36–62.18 | 44.3–72.9 |
| OpenScience | 59.03 | 57.08–60.97 | 36.2–67.4 |
| Codex CLI | 58.81 | 57.25–60.36 | 46.8–70.8 |
| DeepSeek Harness | 58.40 | 56.31–60.49 | 43.8–72.2 |

四個均值全距 1.87 分，95% CI 重疊。作者對 40 個 task 的配對差做 Wilcoxon signed-rank，最小 $p=0.118$，其餘 $p\ge 0.14$；Holm 校正後結論不變。用事先指定 ±4 分做 TOST，六組也都落在該實務等價範圍。這些結果不支持說 Claude Code「第一」或某個 harness「比其他的更會做科學」。但它們也不表示 benchmark 沒有分辨力：單項 task 的系統間差異最高 25.5 分，且各系統都在相近數量的 tasks 拿到第一（8–13 個）。整體均值相近，是不同任務上的領先與落後互相抵消（Section 4.2; Figure 2; Tables 4、7）。

### 維度診斷：能執行、能留下線索，不等於懂得檢驗

更醒目的發現不是 58 分的總分，而是不同維度間約 38–40 個百分點的強弱落差。作者按所有 reported discoveries 正規化維度分數：evidence auditability 約 78–81%，novelty 83–87%；control testing 11–16%、robustness 9–14%、falsifiability 29–33%，cross-dataset generalization 僅 0.00–0.41%。因此「novelty 高」不能被理解成新主張已正確：這個指標主要表示 claim 從 task data 自行形成且相對文獻 cutoff 有新增判斷；缺少控制時，新主張依然可能是 artifacts（Section 4.3; Table 6; Figure 3）。

Cross-dataset 幾乎為零並非單一原因。部分 tasks 根本沒有自然可分的第二份資料；某些 task 即使有重複或條件變異，Agent 仍很少保留 held-out data、預先鎖定標準或執行 out-of-sample validation；而單階段工作流也難以證明先定標準、後看驗證資料。作者因此把近零結果主要解讀成 Agent 少有自發採用外部驗證，同時承認現有 tasks 對此維度量得不夠完整，將 task-level feasibility label 和兩階段資料釋出留待未來（Section 4.3）。

### 任務難度與系統差異是另一層訊號

Figure 5 將 task mean 與系統間分歧放在一起：四系統平均低於 55 的 9 項 tasks 多涉及需要分辨 artifacts、外推邊界或 governing form 的難題；有些項目在系統間又有大分歧。作者報告 task mean 和 disagreement 的 Pearson $r=-0.31, p=0.049$、Spearman $\rho=-0.23, p=0.15$，並提醒這是描述性關聯：Spearman 不顯著，mean 與 range 又共享同一批四個分數，存在數學耦合。不要把它簡化成「難題一定讓 Agent 表現更不穩」（Section 4.4; Figure 5; Table 7）。

## 證據地圖：哪些結論成立，哪些還只是作者解釋

| 層次 | 論文提供的內容 | 合理判讀與邊界 |
| --- | --- | --- |
| Benchmark 設計 | 40 項經策展 task、盲化流程、29 item 的 artifact-grounded rubric，以及隱藏來源／驗證資產（Sections 3.1–3.6; Figure 1; Appendix B） | 提供一個把開放式 claim 品質操作化並可自動評分的方案；不表示 task sampling 已代表所有科研活動。 |
| 平均表現 | 四 scaffold 共用一個 DeepSeek-V4-Flash snapshot，平均 58.40–60.27，配對檢定沒有可靠差異（Section 4.2; Table 4） | 在指定 benchmark 和單一模型下沒有穩定 scaffold 勝者；不能推成不同 base model 也相同。 |
| 發現／執行落差 | 四個系統都在 traceability、novelty 取得較多分，控制、穩健性、外部驗證和可證偽性低（Section 4.3; Table 6; Figure 3） | 支持「跑分析與留下 artifacts 比檢驗 claim 容易」這個 benchmark 內診斷；不證明 Agent 在現實實驗室必然不會做這些事。 |
| 具體失敗切片 | Chemistry_07 的插值 spike、Physics_05 的 synthetic-to-real network 外推風險（Section 5） | 兩例展示視覺上有說服力的趨勢仍需識別 artifacts 和驗證外推；它們不是所有 task 的代表樣本。 |
| Judge 有效性 | 固定量化 GLM-5.1、自動 artifact grounding、deterministic aggregation；人類校準與第二 judge 敏感度分析尚待完成（Sections 4.1、6.3） | 固定可提高同一流程重跑的一致性；在與專家或另一 judge 對照前，不能等同於已校準的科學評審。 |

作者把瓶頸稱為 scientific judgment rather than coding。結果確實顯示，在本 benchmark 裡，工具可以產生程式、執行分析並輸出可追查 artifacts；可是支撐解釋的控制測試、樣本／方法擾動和驗證資料使用很稀少。這個「判斷」指 rubric 中能否選擇鑑別性測試、比較替代解釋並把結論限定清楚，不是由實驗直接觀察到模型內部心理狀態。更精確的說法是：評估到的系統輸出呈現一個很大的 execution-discovery gap，而作者對其成因的概括仍待更廣泛測試。

## 限制、校準問題與不能支持的推論

### 單一 frozen base model 與四種 scaffold

四種 Agent 共用 DeepSeek-V4-Flash，這能減少比較中基礎模型差異造成的混淆，也使研究得以看 scaffold 的 tool calling、state management 和 workflow。然而它只回答該模型條件下的 scaffold 差異。論文自己把它稱為初步 baseline，沒有多 base-model 或多 seed 結果。因此，既不能說四個產品普遍同分，也不能說這種 execution-versus-discovery 差距已跨所有 frontier models 成立。所有 system-task 組合僅一次 run；平均的 95% CI 估的是跨 task 均值的不確定度，不是同一 task 重跑的 selection variance（Sections 4.2、6.1、6.3）。

### 固定 LLM judge 未完成效度校準

每一 claim 由一個固定 GLM-5.1 W4A8、thinking-disabled judge 依 29 項 rubric 評分。固定 judge、三階 item decisions、artifact-grounded evidence 和 deterministic score aggregation 有助於重現評分程序；人類不必逐筆介入，也能減少依報告文筆印象給分的空間。但「可重跑」和「評得對」不是同一性質：同一 judge 可穩定地重複一種偏差。論文說明小規模、非量化且啟用 thinking 的 judge-consistency audit，以及 human-expert calibration 和 second-judge sensitivity analysis 尚待完成（Sections 4.1、6.3）。因此目前只能稱為可自動化且有 artifact grounding 的評估器，不能稱為已經和專家一致或跨 judge 校準的量尺。

### rubric 和資料集本身也有選擇

45 分押在 auditability，另把 15 分給 robustness、15 分給 control testing，代表 benchmark 內建了作者對「可信 discovery」的操作定義。這種明確定義是長處，也意味著總分會反映 rubric 的價值選擇。40 個 task 有針對性地要求足夠資料結構、可重導結果和可測空間；它們是能支援評估的真實科學資料，不是按領域總量等比例抽樣的自然母體。結果來自 retrospective computational dry-lab，對濕實驗、受限資料、長期研究循環或真正新資料發現的外部效度仍未知（Sections 3.2–3.4、6.1、6.3）。

### 盲化、reference bonus 和任務分數

來源結論不進 Agent workspace，但模型預訓練可能已見相關文獻。$T_0$ 的 novel-literature comparison 有助降低記憶答案的得分，不能把污染風險降成零。另一方面，task score 仍包含最多 10 分 hidden-reference coverage bonus，因此它是以 claim evidence quality 為主、帶有限 reference coverage 的混合指標，並非完全脫離 source findings 的純發現分數。獎勵滿 40 分的不同 claim 也可能鼓勵產量；設計以 top-two 的 80 分主體和最低品質門檻限制這種效果，仍值得在後續分析中觀察 claim 數量與質量的互動（Section 3.6）。

## Artifacts 與可重現性

截至 2026 年 10 月 20 日，作者的 [TruthInsightBench repository](https://github.com/TruthInsight-stack/TruthInsightBench) 可公開存取，README 標示 V1.0、40 項 task 資料、四種 Agent harness adapter、run-freezing 與 evaluation/scoring 程式；程式、benchmark-authored 文件及評估資產標示 Apache-2.0。第三方科學資料仍依其 upstream 條款，部分只允許非商業研究使用；應先看 repository 的 [third-party notices](https://github.com/TruthInsight-stack/TruthInsightBench/blob/main/provenance/THIRD_PARTY_NOTICES.md) 和 [source attribution](https://github.com/TruthInsight-stack/TruthInsightBench/tree/main/provenance)。跑實驗需要 Python 3.11、Node.js 20、Docker，Agent model endpoint 與 Judge endpoint/key 由使用者設定，相關模型推論成本並未包含在程式碼授權內。

Repo 提供重新建立 run workspace 和對 frozen run 打分所需的主要程式與任務資料，但不隨附論文四系統的 run artifacts，也沒有把作者當次 prompts、decoding/resource/network/failure-handling policy 全部公開。本文沒有安裝環境或重跑完整 benchmark；四系統分數採作者報告，公開 artifact 的可用性不等於本文已完成獨立複現。外部研究者可按 README 執行已公開任務並使用符合條款的資料；若要比對原研究結果，需自行固定模型與 harness 設定、提供相容 endpoints、保存輸出，並注意作者原本未公開的內部執行設定可能導致不可完全逐項對齊（Section 4.1; repository README）。

## Bloss0m 工程判斷：把評估目標拆成兩層

**Bloss0m 工程化整理**：建置 AI research workflow 時，可把 acceptance 分成兩層：第一層檢查「任務是否執行完成、程式與數字可追查」；第二層檢查「claim 是否經對照、擾動、外部資料和可推翻條件支持」。這個兩層整理是我方從 TruthInsightBench 六維 rubric 讀出的工程建議，不是作者正式提出的額外方法，也不應取代領域專家審查。

若任務目的是忠實重做某篇論文，應使用包含目標值和方法細節的 reproduction benchmark；若目的是找新現象，則要保留答案盲化，並把失敗、負結果和適用邊界納入評分。這兩種評估可以同時存在，但回答不同問題。部署前也要單獨確認 judge 是否對你的領域、數據型態和倫理後果校準；若只有自動分數，不能把「通過評分」當作新發現已獲同行驗證。

對 Agent team 的改善，論文結果支持一個可測方向：要求每個結論附上可定位到 code/output 的 evidence chain；把簡單 baseline、no-signal control、競爭解釋與方法敏感度做成任務層的要求；把 holdout 資料和預先訂定規則安排在 discovery 之後，避免同一階段看過資料再回頭宣稱預先驗證。這是根據 rubric 中 control、robustness、cross-dataset 和 falsifiability 的缺口延伸出的工程實驗建議，不是論文已證實能提升真實科研產出的 intervention。

不適用的情境也很清楚：若你想證明真實世界首次發現，40 項 retrospective task 不夠；若要排出不同基礎模型的綜合名次，這篇的單一 frozen model 設計不夠；若要把自動分數當正式 scientific peer review，單一 judge 尚未完成專家校準也不夠。它適合作為一個研究輸出質檢方向與評估設計參考，不是可單獨採用的研究能力認證。

## 讀完後的三個記憶點

1. **評估對象**：重現已知結論測量的是執行與復現；從盲化資料提出自選 claim、並證明 claim 站得住，才是 TruthInsightBench 試圖量的 open-ended discovery。
2. **主要結果**：四個 scaffold 在單一 frozen DeepSeek-V4-Flash 下形成 58.40–60.27 的窄平台；共同弱點集中於控制測試、穩健性、跨資料集驗證和可證偽性，而不是系統間可靠勝負。
3. **可信邊界**：judge 可固定、結果可自動重算，不代表 judge 已對專家校準；同樣地，一次回溯式 dry-lab benchmark 分數，也不能代替跨模型、多 seed、真實新資料與獨立研究團隊驗證。

接續閱讀：[Sol-Pi 的 auto-research harness 評估](/paper-reading/92-sol-pi-auto-research-harness/)、[Raven 可組合 Agent harnesses](/paper-reading/81-raven-composable-agent-harnesses/)、[Trace-accountable agentic retrieval](/paper-reading/93-trace-accountable-agentic-retrieval-archives/)；分別補上研究循環、harness 組成與執行證據可追查性的觀點。

## Primary sources

- Yang, Zhibo; Zhang, Chen; Zhang, Yuewei; Wang, Hao. [TruthInsightBench: An Evidence-Grounded Benchmark for Automated Evaluation of Open-Ended Scientific Discovery Agents](https://arxiv.org/abs/2609.05079), arXiv:2609.05079 v1, submitted 2026-09-04. 本文按 v1 的 Sections 1–6、Figures 1–5、Tables 2–7 與 Appendices B–C 定位。
- [arXiv HTML v1](https://arxiv.org/html/2609.05079v1) · [arXiv PDF v1](https://arxiv.org/pdf/2609.05079v1).
- 作者的 [TruthInsightBench repository](https://github.com/TruthInsight-stack/TruthInsightBench) · [README](https://github.com/TruthInsight-stack/TruthInsightBench/blob/main/README.md) · [third-party notices](https://github.com/TruthInsight-stack/TruthInsightBench/blob/main/provenance/THIRD_PARTY_NOTICES.md).
