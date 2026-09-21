---
title: "BioPhys-Bridge：讓科學 RAG 沿著證據、物理模型與機制走到下一個決策"
description: "深讀 BioPhys-Bridge（arXiv:2609.19180 v1）：把 evidence ID、數值與單位、物理方程、假設、生物機制與下一步實驗放進同一個 benchmark case，並拆開 attribution 分數與真正的 scientific correctness。"
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "BioPhys-Bridge 將一個 biophysics case 建模為 evidence → quantitative value → physical model → mechanism → next decision；500 cases、1,517 tasks 跨六個生物領域與九個 physics model families。"
  - "release gates 報告 schema、evidence integrity、quantitative grounding、license、unit 與 duplicate checks 全部通過，但只有 81/500 cases 有 expert annotation；manual_review_status 不是全量專家審查。"
  - "154-task held-out test 中，candidate generator 找到 234/267 gold evidence IDs（recall 0.876；127/154 tasks 全部命中），DeepSeek v4 Flash 的 evidence-ID F1 為 0.360；這量到的是 attribution 與 reranking，不是完整 scientific correctness。"
  - "論文 v1 寫 public release 將在 peer review 後提供，但截至 2026-09-21 GitHub 與 Hugging Face 已可見；完整 JSONL 只在 HF，raw PDFs、MinerU payloads 與 LLM responses 不公開。"
audience:
  - "設計 scientific RAG、paper agents 或 AI-for-Science benchmark 的研究與平台工程師"
  - "需要區分 evidence attribution、數值一致性、機制正確性與下一步實驗可行性的評測團隊"
tags: ["Paper Reading", "Retrieval", "RAG", "Scientific AI", "Benchmark", "Agent Evaluation", "Biophysics"]
image: "/paper-reading/biophys-bridge-scientific-grounding/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
paper:
  title: "BioPhys-Bridge: A Benchmark for Interdisciplinary Scientific Reasoning in Physics-Grounded Biological Research"
  authors:
    - "Qingyang Xu"
  year: 2026
  venue: "arXiv 2609.19180 v1（2026-09-15；workshop version）"
  links:
    pdf: "https://arxiv.org/pdf/2609.19180v1"
    arxiv: "https://arxiv.org/abs/2609.19180"
    doi: "https://doi.org/10.48550/arXiv.2609.19180"
    code: "https://github.com/qyxu1994/BioPhys-Bridge"
    project: "https://huggingface.co/datasets/qyxu1994/BioPhys-Bridge"
series:
  id: "scientific-grounded-rag"
  title: "Scientific Grounded RAG"
  part: 1
  totalParts: 1
---

本文讀的是 [BioPhys-Bridge: A Benchmark for Interdisciplinary Scientific Reasoning in Physics-Grounded Biological Research](https://arxiv.org/abs/2609.19180) 的 arXiv v1。record 顯示它在 2026-09-15 提交，是作者自己稱為 workshop version 的研究；這不是已完成 peer review 的正式期刊或會議定稿。我讀過完整 HTML／PDF、Sections 1–10、Tables 1–9、Figures 1–3、Appendices A–C、quality-control 說明與 limitations，並獨立查看了作者的 [GitHub repository](https://github.com/qyxu1994/BioPhys-Bridge) 與 [Hugging Face dataset endpoint](https://huggingface.co/datasets/qyxu1994/BioPhys-Bridge)。

這篇 paper 真正要解的不是「模型能不能從論文找一段相似文字」，而是：**一個可用於生物研究的回答，能否沿著可定位的 source evidence，正確帶出數值與單位、物理模型及其假設、生物機制，最後提出可被檢驗的下一個實驗或計算？**

## 90 秒掌握論文

- **問題**：傳統 scientific QA／RAG 多把 passage 或 paper-level citation 當作 grounding 單位；但 biophysics 的可信回答還要守住數值、單位、方程、模型適用條件與機制的跨領域鏈條。
- **核心洞見**：BioPhys-Bridge 不把 case 壓成單一 question-answer，而是明確保存 `evidence[]`、`quantitative_evidence[]`、`biophysical_model`、`physical_interpretation`、`biological_mechanism`、`sci_evo_trajectory[]` 與 `agent_tasks[]`。評測輸出同時要有 answer 和 supporting evidence IDs。
- **最強證據**：500 cases、1,517 tasks，分成 400/50/50 且 train、validation、test 不共享 source paper；在 154 個 held-out tasks 上，DeepSeek v4 Flash evidence-ID F1=0.360，優於 lexical retrieval 的 0.188。
- **主要邊界**：candidate generator 先從每 case 中位數 206 個 evidence blocks 篩成 48 個，僅包含 267 個 gold IDs 中的 234 個，recall=0.876；因此結果是「在 lexical candidate set 中把證據重新找對」的 attribution evidence，不是 unconstrained retrieval，也不是 physical model 或 biological mechanism 的完整 correctness。

我的 bounded verdict 是：**這份 benchmark 最有價值的不是 0.360 這個單點分數，而是把 scientific grounding 拆成一條可以逐段稽核的 evidence-to-decision object。它適合用來找出 RAG 是否漏掉證據 ID、混淆單位、跳過物理假設或把 plausibility 當成機制；但目前的 protocol 尚不足以宣稱模型真的理解科學，尤其沒有 full rubric-based expert scoring。**

> **花花的工程提醒**
>
> citation 可以告訴你「答案指向了哪一塊 evidence」，不能單獨證明方程代入正確、方向性沒有反轉、機制沒有過度推論，或下一個實驗真的可行。Production scientific RAG 應把 attribution、數值一致性、模型適用性、機制合理性與決策可行性分成不同檢查。

## 論文身分、證據地圖與問題邊界

這是一篇 **dataset + evaluation benchmark paper**，不是提出新物理模型，也不是提出一個可直接部署的 scientific agent。作者的研究問題可拆成兩層：第一，能不能把 open-access biophysical literature 結構化成跨 evidence、equation、mechanism 和 decision 的 case；第二，模型在不看 gold answer、gold evidence IDs、expert annotation 的情況下，能不能對候選 evidence 產生可歸因的回答。

先把三種聲音分開：

| 層次 | 本文採用的說法 |
| --- | --- |
| **Paper 直接支持** | 500 cases、1,517 tasks、六個 biological domains、九個 physical model families、deterministic 400/50/50 split、81 expert-annotation cases、schema／evidence／quantitative／license／unit／duplicate gates、154-task no-scaffold evaluation，以及 evidence-ID F1。 |
| **作者解讀** | evidence blocks 與結構化 fields 能讓 attribution 超越 passage retrieval；benchmark 可研究 faithfulness、hallucination reduction 與 experiment design。 |
| **Evidence 尚未建立** | evidence-ID F1 等於 scientific correctness、所有 500 cases 都被專家完整審查、模型能可靠做新物理推導、或 benchmark 結果會轉移到真實實驗室。 |
| **Bloss0m 工程化整理** | 將回答管線拆成 evidence → quantitative value → physical model → mechanism → next decision 五個可留存的 audit checkpoints；這是工程解讀，不是論文宣稱的額外 guarantee。 |

### Paper Essence Contract：六個問題的短答案

1. **它解決什麼問題？** 它要評估 RAG／LM 是否能把文獻中的 source evidence 連到數值與單位、物理模型、模型假設、生物機制與下一步決策，而不只生成一段貌似相關的文字。
2. **為什麼既有方法不夠？** PaperQA、LitQA 或一般 scientific QA 常以 passage、paper citation 或 answer 作為主要單位；它們不一定把 equation、unit、assumption、mechanism link 和 decision 一起變成可評估欄位。
3. **核心技術想法是什麼？** 把一個研究 case 做成有穩定 evidence IDs 的結構化物件，讓每個 quantitative record 引用 evidence，讓 task 同時要求答案與 supporting IDs，再用 de-leaked prompt 和 scorer 分開量 attribution。
4. **一個 input 怎麼走？** source paper → MinerU parse → normalized evidence blocks → regex-first numeric／equation candidates → evidence-only structuring → schema／integrity／unit／license／duplicate／content gates → task prompt + 48 candidates → model JSON answer + IDs → scorer。
5. **什麼 evidence 支持 headline？** Release tables 支持資料規模與 gate 結果；Appendix B 支持 500→400/50/50 的 release funnel；Table 7–8 支持 held-out evidence-ID F1 和 task-type diagnostics。這些 evidence 支持 attribution benchmark 的可用性，不直接支持 mechanism correctness。
6. **claim 在哪裡停止？** 停在 public-query、lexically pre-filtered、154-task、temperature-0、JSON-mode 的初步 baseline；它沒有 human ceiling、hidden test server、repeated stochastic runs 或 full expert rubric scoring，且 release timing 仍有正文與現況不一致。

## 先理解五個物件：證據不是一段文字而已

一般 RAG 可以簡化成 `query → retrieved chunks → answer`。BioPhys-Bridge 把中間的科學語意拆開：`evidence block` 是可定位的 citation atomic unit；`quantitative_evidence` 記錄 metric、value、unit 和引用 IDs；`biophysical_model` 記錄 model family、equation、variables、assumptions、validity conditions；`physical_interpretation` 說 derived quantity、directionality、caveats；`biological_mechanism` 才是把物理結果連回 biology 的解釋；`sci_evo_trajectory` 則保存從 research question 到 observation、interpretation 和 next step 的階段。

![BioPhys-Bridge 論文 Figure 1：case 的 evidence-to-decision 結構](https://arxiv.org/html/2609.19180v1/figure1_case_structure.png)

*圖 1（原論文 Figure 1，Section 3.1）：讀者應注意箭頭不是「retrieved text 直接變答案」，而是 evidence 先落到 quantitative value，再受 physical model 與 assumptions 約束，才進入 mechanism 與 next decision。[原始 Figure 1 anchor](https://arxiv.org/html/2609.19180v1#S3.F1) · [原始 image endpoint](https://arxiv.org/html/2609.19180v1/figure1_case_structure.png)。arXiv v1 頁面標示 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；本文下載 v1 原圖轉 WebP，保留來源與授權，並非重新繪製的實驗結果。*

這個拆分也讓「正確」不再只有一種意思。例如模型引用了正確的 evidence ID，但把 `k_off` 的方向讀反，attribution 可能算對而 physics interpretation 算錯；又或者它引用了 binding assay 的段落，卻從中推導出未被該 paper 測試的 cellular mechanism。這正是 paper 在 Section 7 與 Section 9 要求讀者不要把 evidence-ID F1 當成 scientific correctness 的原因。

## 核心直覺：把跨領域推理變成可逐站檢查的橋

以前的 pipeline 可能只問：「哪幾段文字支持這個答案？」BioPhys-Bridge 改問五個連續問題：

```text
source evidence
      ↓
quantitative value + unit
      ↓
physical model + assumptions
      ↓
biological mechanism + caveat
      ↓
next experiment or computation
```

每一站都可以有不同 failure。retriever 可能漏掉 evidence；parser 可能把單位弄壞；model step 可能把相關式子套在 validity condition 之外；mechanism step 可能把 correlation 寫成 causation；next decision 可能沒有控制變因。作者把這些中間欄位做成 schema，不代表每個欄位都已經有同等強度的 ground truth，而是提供了將來可以加專家 rubric 的接口。

這個 conceptual move 和 [RAGSieve 的 retrieval integrity](/paper-reading/55-ragsieve-rag-poison-detection/) 不同：RAGSieve 更關注 context 是否被污染或扭曲；BioPhys-Bridge 把「找到什麼」往後延伸到「數值如何被物理模型解讀」與「是否導出下一步」。它也可以和 [Agentic RAG partial-answer prediction](/paper-reading/53-agentic-rag-partial-answer-prediction/) 接在一起讀：partial answer detector 可以在 evidence chain 尚未閉合時先阻止 agent 產生過度完整的結論。

## 用一個 gold case 走完整個方法

Appendix A 的 Figure 3 是作者提供的真實 case schematic；它把 source provenance、evidence-linked measurements、physical model、mechanism、caveat 與 task 放在一起，而不是只留一個 QA pair。

![BioPhys-Bridge 論文 Figure 3：gold case 的完整結構](https://arxiv.org/html/2609.19180v1/figure2_golden_case.png)

*圖 2（原論文 Figure 3，Appendix A）：這個 case 的教學重點是欄位之間的 provenance chain，而不是某個特定生物結論；source、evidence IDs、量化數值、模型、mechanism 與 caveat 都必須能互相指回。[原始 Figure 3 anchor](https://arxiv.org/html/2609.19180v1#A1.F3) · [原始 image endpoint](https://arxiv.org/html/2609.19180v1/figure2_golden_case.png)。原文標示 CC BY 4.0；本文使用 v1 原圖作教學引用，沒有把 schematic 當作獨立驗證。*

用 paper 的欄位順序描述一個 input：

1. **Input**：agent 收到 task type、research question、domain 與一組 ranked candidate evidence blocks；gold answer、gold IDs、expert annotation 和 structured equation fields 被藏起來。
2. **Intermediate representation**：每個 evidence block 有 stable ID 和 source location；quantitative record 保存 value／unit；model record 保存方程、變數、假設與 validity；trajectory 把 observation 與 next step 分開。
3. **Decision**：模型必須判斷哪些 candidate IDs 真正支持答案，並以 JSON 回傳 `answer` 和 `supporting_evidence_ids`。它可引用 evidence，但不能把未在 candidate set 裡的 ID 憑空產生。
4. **Output**：scorer 以 gold supporting IDs 計算 evidence-ID precision、recall 和 F1，另以 token overlap 計算 answer token F1。這兩個分數是在不同層次回答不同問題。
5. **Likely failure point**：若 lexical candidate stage 先漏掉關鍵 ID，後面的 LLM 不可能從 48 個候選中引用它；若候選命中但 model 只寫 plausible prose、不輸出可解析 IDs，則 attribution score 仍會接近零。

這個例子是對 benchmark protocol 的忠實簡化，不是我重新執行的生物推理。它故意把「輸入給模型的 evidence」和「評分器事後使用的 gold labels」分開。

## 技術機制：curation、schema 與 de-leaked evaluation

### 1. Curation pipeline 把 paper 變成可追蹤的 record

作者從有 DOI／PMCID provenance 和 release-compatible license 的 open-access papers 開始，批次追蹤 domain 與 model-family coverage。MinerU 解析 PDF，保留 text、table、formula、figure/caption 等 evidence modalities；raw PDFs 和 MinerU intermediate payloads 不放進 public release。regex-first pass 先抓 numeric values、equations、units、model keywords，再由 evidence-only LLM（shipped release 使用 gpt-4o）結構化 quantitative evidence、interpretation、mechanism 和 agent tasks。prompt 要求只能使用 supplied evidence，不支援的欄位留空，fabricated IDs 由 validator 移除。

![BioPhys-Bridge 論文 Figure 2：curation pipeline 與 release gates](https://arxiv.org/html/2609.19180v1/figure3_pipeline.png)

*圖 3（原論文 Figure 2，Section 4）：主線是 open-access source → MinerU → evidence blocks → structured case → validation／quality gates → release；任何中間步驟都不是「LLM 生成了就自動是真實」。[原始 Figure 2 anchor](https://arxiv.org/html/2609.19180v1#S4.F2) · [原始 image endpoint](https://arxiv.org/html/2609.19180v1/figure3_pipeline.png)。原文標示 CC BY 4.0；本文下載 v1 原圖轉 WebP，保留 attribution。*

### 2. Quality gates 是 release integrity，不是全量科學驗證

500/500 通過 Pydantic／JSON Schema；evidence-ID referential integrity、quantitative grounding、source-license coverage、unit normalization、duplicate check 和 content gate 都報告 100% 或 0 duplicates。490 cases 使用 CC-BY-4.0，10 cases 使用 CC0-1.0。這些 gate 很適合回答「資料能不能被程式讀、ID 是否存在、數值是否在引用文字中出現、license 是否記錄」；但它們不等同於「物理方程用對了」或「生物機制由專家確認」。

尤其 `quality.manual_review_status = reviewed` 是 release-gate status，不是 500 cases 全部經過 physics 和 biology experts 的完整審查。獨立的 expert_annotation 只有 81 cases：50 個 held-out test、10 個 contest gold、30 個 extended gold、1 個 legacy reviewed record。500 與 81 是兩個不同 coverage denominator，不能在文章或 dashboard 裡合併成「500 cases 已 expert-validated」。

### 3. Evaluation 量的是 attribution 與 output compliance

每個 test task 顯示 48 個 candidate evidence blocks；候選排序只看 task type、task question、research question、domain 和 source evidence text，不看 gold supporting IDs、equation、directionality、mechanism 或 quantitative records。gold labels 只在 scorer 階段出現。LLM 使用 temperature 0 與 JSON mode，confidence interval 是 task-level nonparametric bootstrap 95% CI。

這裡有三個重要的數學讀法：

- **Candidate recall**：test set 267 個 gold supporting IDs 中，lexical candidate generator 包含 234 個，recall=`234/267=0.876`；154 tasks 中只有 127 tasks 的所有 gold IDs 都在 candidate set。這是 retrieval ceiling 的一部分，不是 model 的 final score。
- **Evidence-ID F1**：在 candidate set 已給定的條件下，計算預測 IDs 與 gold IDs 的 overlap。它能抓出 attribution 是否對，但不能檢查引用段落中的方程代入、單位轉換、因果機制與實驗設計是否科學上成立。
- **Answer token F1**：與 gold answer 的 token overlap 只被作者稱為 rough sanity check。它可以因措辭相似而上升，也可以因 open-ended 的正確 paraphrase 而下降；它不是 scientific quality 分數。

作者還計算 `overall_score = 0.7 × answer token F1 + 0.3 × evidence-ID F1` 作診斷，但沒有把它當 main paper metric，因為 token F1 對 open-ended scientific answers 太弱。這個取捨是對的：把兩個弱訊號線性相加不會自動產生 correctness。

## Release statistics 與內部不一致：四個數字要放回上下文

### 500 cases、1,517 tasks、81 annotations

Table 3 的 release headline 是 500 cases、1,517 agent tasks、400/50/50 split；Table 4 的 domain counts 188+126+91+52+22+21=500，Table 5 的 task counts 480+403+355+279=1,517。這部分內部一致。81 則是「有 expert annotation 的 cases」，不是 annotation 過的 task labels 數，也不是全量 manual review。另有 107 cases 有 explicit failure/revision stage，這是第三個互不相同的 coverage 欄位。

### 154-task held-out set 與 50 test cases

資料 split 是 50 test **cases**；這 50 cases 展開後有 154 個 agent-facing **tasks**。因此 Table 7 的 n=154 不是和 50 矛盾，而是 case-level split 在 task-level evaluation 展開後的 denominator。文章若只寫「50-task test」會錯；若只寫「50 test cases」又會漏掉 model score 的實際樣本數。

### Candidate recall 與「最高可達 F1」

234/267 gold IDs 的 0.876 recall，和 mean maximum achievable evidence-ID F1=0.916，是兩個不同的 summary。前者是 ID-level coverage；後者先在每個 task 考慮 candidate set 對 F1 的上限，再取 mean，因此不會簡單等於 0.876。127/154 tasks 全部命中也不能保證其他 27 tasks 的 score 為零，因為它們可能仍有部分 gold IDs。

### Evidence-ID F1 與 release timing

論文 abstract／Conclusion 說 public code and data are available，正文 Section 8 又寫「public dataset and code repository will be released after peer review」。這在 v1 的敘事上是不一致的。到 2026-09-21，作者 GitHub repository 已是 public，Hugging Face 也能看到 train／validation／test viewer；但完整 500-case JSONL 不在 GitHub，而是由 HF endpoint 提供。最精確的寫法是：**以本文查核日為準，public artifacts 已可訪問，但正文的 release-timing wording 應視為尚未更新的 pre-release 描述，不能把它改寫成「peer-reviewed release」或推定所有 supplementary files 都已公開。**

## Results 如何讀：同一個分數不能承擔五種 claim

Table 7 問的是：「在固定 154 tasks、固定 48-candidate lexical pre-filter、no-scaffold prompt 下，模型能否選出和 gold overlap 的 evidence IDs？」controls 是相同 test tasks、相同 candidate generator、temperature 0 和 JSON output；observation 是 lexical 0.188、DeepSeek v4 Flash 0.360、Qwen 0.316、GPT-4o-mini 0.294。這支持「某些 LLM 在 attribution／reranking 上高於 lexical floor」，而不是「DeepSeek 已經懂物理」。

DeepSeek v4 Flash 的 95% CI 是 [0.309, 0.412]，Qwen 是 [0.273, 0.359]，GPT-4o-mini 是 [0.251, 0.339]。相對 lexical 的 paired bootstrap delta 分別是 +0.172、+0.127、+0.106，且 CI 都高於 0。Claude Opus 的增益較小（+0.050，CI [0.005, 0.094]），Claude Sonnet 的 CI 跨 0（+0.035，[-0.010, 0.081]）。這些 intervals 說明同一 test set 的 paired uncertainty，但不替代跨 seed、跨 corpus 或 expert judgement。

Table 8 再把 39 derivation、31 discrepancy、46 mechanism、38 next-experiment tasks 拆開。Flash 在 derivation=0.475、discrepancy=0.404、mechanism=0.352，但 next experiment=0.216；後者比較像 open-ended decision task，分數下降並不等於「模型不知道生物學」，也可能反映 gold evidence set 與 task formulation 對新決策的限制。每個 cell 僅 31–46 tasks，應讀成 diagnostic slice，不是穩定排名。

最值得保留的 negative result 是 Gemini 2.5 Pro：answer token F1=0.099，但 154 tasks 中 151 個輸出沒有可解析的 evidence IDs，evidence-ID F1 只有 0.010。這證明 plausible prose 與 usable attribution 可以分離；同時也提醒我們，evidence-ID F1 受 output-format compliance 影響。模型可能寫出部分合理內容卻因 schema omission 被重罰，也可能輸出完美 IDs 卻用錯物理機制；兩種 failure 都需要額外 rubric。

### 作者主張、證據、尚未證明

| 問題 | 論文 evidence 支持什麼 | 仍不能推出什麼 |
| --- | --- | --- |
| 能否引用對的來源？ | Evidence-ID F1 與 candidate coverage 可量 attribution。 | 不等於引用內容已被正確解釋。 |
| 能否產生像樣的答案？ | Answer token F1 是粗略 overlap sanity check。 | 不等於 numerical／mechanistic correctness。 |
| 能否做物理推導？ | derivation slice 提供較具體的 diagnostic。 | 沒有 full expert rubric 驗證每一步方程。 |
| 能否設計下一個實驗？ | next_experiment task 有 403 tasks，且 score 最高也只有 0.216（Flash）。 | 沒有證明設計真的可執行、控制混雜或值得做。 |
| release 是否可靠？ | schema、ID、unit、license 與 duplicate gates 全量通過。 | 不等於 500 cases 全部 expert-checked，亦不等於無 OCR／parser artifacts。 |

## Limitations、failure modes 與 artifact status

第一個限制是 **grounding ontology 的 correctness 尚未完整落地**。81 cases 有 expert annotations，但 50 test cases 的 notes 不是 independent parallel task-level labels，因此作者不報 supporting-ID 的 inter-annotator agreement；也沒有 full rubric-based scoring 物理模型使用、數值一致性、mechanism correctness、uncertainty handling 或 experimental feasibility。這是為什麼 evidence-ID F1 必須被稱為 attribution metric。

第二個限制是 **retrieval ceiling 與 contamination**。candidate generator 只看 lexical inputs，48 candidates 來自每 case 中位數 206 blocks；它不是完整 corpus retrieval。test set 又是 public，長期容易被 benchmark contamination 影響；未來應有 hidden test 或 contamination-aware protocol。

第三個限制是 **data and source bias**。source pool 只收 open-access、release-compatible papers，六個 domain 是 weighted coverage 而不是 balanced sampling；最後三個 physical families 各只有 6、2、2 cases，作者明說它們是 future expansion coverage，不適合獨立評測。

第四個限制是 **pipeline provenance 與 parser artifacts**。OCR 或 table parsing 錯誤可能留在 evidence text 裡，因為作者優先保 traceability；raw PDF、MinerU payload、LLM responses 不公開，讀者不能完整重建每一個 extraction decision。release audit 也從 reviewed candidate set 開始，沒有完整 exploratory source pool 或 parser-failure counts，因此 Appendix B 是 shipped funnel，不是全體 rejection funnel。

Artifact 方面，GitHub code／schema／tests／sample cases／aggregate reports 可瀏覽；Hugging Face dataset page 可看到三個 splits 與公開 viewer，完整 release JSONL 依 README 位於 HF 而非 GitHub。可重現性仍有條件：讀者需要自己安裝 Python package、取得 dataset、依 `PYTHONPATH=src` 跑 validation／pytest，若要重跑模型 baseline 還需要 provider credentials。這不是「一鍵重現所有 paper 結果」。本文的 availability 判定以 2026-09-21 為準。

## 工程判斷：把五段鏈條變成 production contract

以下是 **Bloss0m 工程化整理**，不是作者宣稱的官方 framework。若要把 BioPhys-Bridge 的精神帶進 scientific RAG，我會要求每個 answer trace 至少保存五個 checkpoint：

1. **Evidence**：原始 paper version、evidence ID、source location 和 license。
2. **Quantitative value**：raw value、normalized value、unit、conversion rule，以及引用是否真的包含該數字。
3. **Physical model**：equation、variables、assumptions、validity conditions 和 directionality；若沒有這些欄位，讓 model 明確回答「unknown」，不要補一個看似合理的 model。
4. **Mechanism**：把物理量連到生物機制時，分開 measured、derived、hypothesized；禁止把 citation presence 當因果證明。
5. **Next decision**：下一個 experiment／computation 的 independent variable、control、expected observation、failure interpretation 和 feasibility。

這五站的好處不是保證正確，而是讓 reviewer 能說清楚錯在哪一站。Evidence-ID F1 可以放在第一站；數值 parser、unit checker、symbolic relation checker 放第二與第三站；domain expert rubric 放第四與第五站。只用一個 aggregate score 會把這些 failure 混在一起。

### 什麼時候適合用、什麼時候不要用

適合用在需要 paper provenance、跨 evidence modalities、且可以保存 intermediate fields 的 literature QA、hypothesis triage、benchmark development 或 research-assistant prototype。不要直接用在 clinical decision、wet-lab protocol、safety-critical engineering 或需要即時最新 evidence 的流程，除非另有 domain expert sign-off、source version pinning、freshness policy 和 independent correctness checks。

也不要把它當成通用 physics solver benchmark：它的 equation 與 mechanism 來自 curated literature case，並非 controlled simulation ground truth。若產品問題是「哪個模型最準確預測分子動力」，PDEBench 或實驗測量比較更直接；若問題是「回答是否真的引用到正確 paper evidence，並保留假設與下一步」，BioPhys-Bridge 的 schema 才比較對位。

## Artifact 與可重現性

截至 **2026-09-21**：

- **Paper**：arXiv v1 的 HTML、PDF、figures 與 CC BY 4.0 attribution 可直接取得。
- **Code**：[GitHub repository](https://github.com/qyxu1994/BioPhys-Bridge) public；包含 schema、validator、evaluation code、tests、small samples 與 aggregate reports。完整 release JSONL 不在 GitHub。
- **Data**：[Hugging Face dataset](https://huggingface.co/datasets/qyxu1994/BioPhys-Bridge) public，頁面顯示 train/validation/test viewer；完整 JSONL release 由 HF 提供，需依 repo 說明載入。
- **Missing inputs**：raw PDFs、raw MinerU payloads、LLM responses、完整 exploratory rejection history 不公開；模型 baseline 仍需要各 provider 的 credentials。
- **Status caveat**：paper Section 8 的「after peer review」與目前 public endpoints 不一致；這裡報告的是查核日的可存取狀態，不把它升格成 peer-reviewed reproducible release。

## 讀完後的三個記憶點

1. **技術想法**：BioPhys-Bridge 把 case 做成 evidence → quantitative value → physical model → mechanism → next decision 的結構化橋，讓中間推理欄位可以被保存與稽核。
2. **最強證據**：在 154-task、48-candidate 的 held-out protocol 中，部分 LLM 提高 evidence-ID F1；但這首先是 attribution／format-compliance 結果，不是 scientific correctness benchmark 的終點。
3. **採用邊界**：500 cases 的 release gates 很強地說明資料結構與 provenance integrity，81 expert-annotation cases 卻提醒我們全量科學正確性尚未被驗證；下一步必須是 expert rubric、independent labels、hidden evaluation 與數值／機制 consistency checks。

## Primary sources

- [BioPhys-Bridge arXiv v1 full HTML](https://arxiv.org/html/2609.19180v1)
- [BioPhys-Bridge arXiv record](https://arxiv.org/abs/2609.19180)
- [Author GitHub repository](https://github.com/qyxu1994/BioPhys-Bridge)
- [Hugging Face dataset endpoint](https://huggingface.co/datasets/qyxu1994/BioPhys-Bridge)
