---
title: "Learning When to Trust：用選擇性 Context Preference Optimization 測量與訓練 selective trust"
description: "深讀 Learning When to Trust via Selective Context Preference Optimization：MIST 把同一題拆成 clean、misleading、correct-context 與 irrelevant-context 四個 matched conditions，SC2W 量測誤導訊號造成的 clean-correct 翻錯，SCOPE 再以平衡的 DPO preference pairs 降低 susceptibility；同時保留 text-only、contamination 與 deployment-prevalence 邊界。"
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "這篇論文不是把所有外部 context 都當敵人，而是把問題改寫成 selective trust：拒絕 plausible but wrong signal、保留正確 context 的幫助、忽略無關 context。"
  - "MIST-1000 對每個 reasoning item 固定問題、答案空間與 gold answer，只改變外加訊號；SC2W = 在 clean 答對的題目中，被 misleading context 翻成錯誤的比例。"
  - "SCOPE 不改 DPO loss，而是挖出 clean-correct/misleading-wrong failure，將同一組 truth-consistent／signal-following response pair 均衡放進四種 condition；Qwen3-4B 的 SC2W 由 35.0 降至 16.3，Overall Acc. 為 92.0。"
  - "這是 controlled、text-only 的 susceptibility benchmark，不是 production prompt-injection 防護證明；公共資料、有限模型家族、可能的 benchmark contamination 與 deployment prevalence 都仍是邊界。"
audience:
  - "設計 RAG、retrieval context、agent evaluation 或外部 evidence gate 的 AI 工程師"
  - "需要區分 resistance、context usefulness 與 selective trust 的模型訓練與可靠性研究者"
tags: ["Paper Reading", "RAG", "Retrieval", "Agent Evaluation", "AI Safety", "AI Engineering", "Evaluation"]
image: "/paperReading/selective-context-preference-trust/title_image.webp"
field: "NLP"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
  - agent-safety-governance
paper:
  title: "Learning When to Trust via Selective Context Preference Optimization"
  authors:
    - "Xian Sun"
    - "Wei Chow"
    - "Yingshuo Wang"
    - "Junhao Liu"
    - "Wei Gao"
    - "Qing Wu"
    - "Lingdong Kong"
  year: 2026
  venue: "arXiv 2608.06377 v1（submitted 2026-08-06；未同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2608.06377v1"
    arxiv: "https://arxiv.org/abs/2608.06377"
    doi: "https://doi.org/10.48550/arXiv.2608.06377"
    code: "https://github.com/worldbench/SCOPE"
    project: "https://worldbench.github.io/scope"
series:
  id: "selective-context-trust"
  title: "Selective Context Trust 深度精讀"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文

- **問題**：一般 reasoning 或 RAG 評測常只在一個 context 下問「模型會不會答？」；但同一模型可能在沒有外加訊號時答對，遇到一段看似權威、其實錯誤的 hint 就改成錯答案。若只測 resistance，模型把所有 context 都忽略，也可能被誤判為 robust。
- **核心洞見**：把問題變成 **selective trust**。值得信任的 context 應該幫助模型，無關 context 不應改變答案，misleading context 則應被拒絕。MIST 以同一個 item 的四個 matched conditions 同時測這三種能力；SC2W 只在 clean 答對的 item 上計算 misleading signal 造成的 correct-to-wrong flip。
- **最強證據**：論文在 23 個 frontier 與 open-weight model 上報告，單一 misleading signal 平均造成 17.1 個百分點的 accuracy drop（Figure 1、Conclusion）。在訓練比較中，Qwen3-4B 的 SC2W 由 base 的 35.0 降到 SCOPE 的 16.3，且 clean、correct-context、irrelevant-context accuracy 分別為 95.0、98.1、94.3（Table 1）。
- **主要邊界**：SCOPE 的數字來自 1,000 個 text-only item、固定解碼與兩個可訓練 model family；它測的是受控 benchmark 的 susceptibility，不是自然環境 incident frequency，也不等於已經防住任意 RAG poisoning、indirect prompt injection 或 agent action error。

我的 bounded verdict 是：**這篇工作的真正貢獻，是把「不要盲信外部訊號」改成可反駁的 matched counterfactual evaluation，再把同一個 control problem 放進 preference data；若你的系統只追求 misleading-context resistance 而不測 correct-context preservation，仍可能訓練出一個什麼都不信的模型。**

> **花花的工程提醒**
>
> SCOPE 讓模型比較像「判斷 context 的角色」，不只是「看到 context 就拒絕」。但 MIST 的 SC2W 是診斷訊號，不是 production prevalence；在真實 RAG 或 agent 中，仍要保留 provenance、權限、freshness、獨立驗證與人工升級路徑。

## 版本、來源與讀者問題

本文讀的是 [arXiv v1 的 paper page](https://arxiv.org/abs/2608.06377v1) 與 [v1 full HTML](https://arxiv.org/html/2608.06377v1)，PDF 標示提交日期 2026-08-06，作者為 Xian Sun、Wei Chow、Yingshuo Wang、Junhao Liu、Wei Gao、Qing Wu、Lingdong Kong。這個版本是 arXiv preprint；截至本文查核日沒有已確認的 peer-reviewed venue，因此文中不使用「已證實的 production method」或「已發表結果」來描述它。

讀者問題是：**當外部 context 有時是證據、有時是誤導、有時只是噪音，模型能不能在同一個 reasoning task 上分辨「該信多少」，而不是學會全面拒絕？** 這個問題接在 [RAGSieve 的 retrieval integrity](/paper-reading/55-ragsieve-rag-poison-detection/) 與 [Indirect Prompt Injection 的資料平面風險](/paper-reading/42-indirect-prompt-injection/) 之後：前者偵測可疑的 retrieval promotion，後者說明未受信內容進入 prompt 可能改變控制流程；本篇則將「context 應否改變答案」做成 matched benchmark 與訓練目標。若想接著看 evaluation 的 early stopping，可讀 [Agentic RAG partial-answer prediction](/paper-reading/53-agentic-rag-partial-answer-prediction/)。

## 證據地圖：Paper、Evidence 與 Bloss0m judgment

| 層次 | 本文採用的說法 |
| --- | --- |
| **論文直接支持** | MIST 的四個 matched conditions、SC2W 的 clean-correct conditioning、SCOPE 的 matched preference quartet、standard sigmoid DPO、兩個 trainable model family 的 MIST results、zero-shot external transfer、construction ablation、slice analysis 與 human scoring audit。 |
| **Evidence 顯示** | misleading signal 對 23 個受測 model 都造成 drop；在 Qwen3-4B 與 Llama-3.2-3B 上，SCOPE 降低 SC2W 並大致保留 controls；unseen external benchmark 的結果與 MIST 方向一致，但外部 suite 的 metric 與 MIST 不同。 |
| **作者主張** | selective trust 比單獨追求 resistance 更值得作為 reasoning model 的訓練與評測目標；SCOPE 透過 matched、balanced pairs 學習這個目標。 |
| **證據沒有建立** | 沒有證明 SCOPE 可防住任意 prompt injection、會提升 arbitrary enterprise RAG factuality、能處理多模態或 tool/action context、已消除 contamination，或 SC2W 可以直接當作真實部署事故率。 |
| **Bloss0m engineering judgment** | 若把方法接到 production，應將四種 condition 當成 regression matrix，並把 SC2W 與 context usefulness、provenance、ACL、freshness、answer verification、side-effect approval 分開追蹤。這是工程化整理，不是作者提出的額外 guarantee。 |

Paper Essence Contract 的短答案如下：問題是 context-induced answer flip；既有單一 context accuracy 無法把「本來不會答」和「被訊號改錯」分開；核心 idea 是 matched counterfactual benchmark 加上 balanced preference construction；input 會通過四種 context、模型回答與 type-aware parser，最後形成 per-condition accuracy 與 SC2W；Table 1、Figure 1、Figure 5、Figure 7、Figure 8 與 human audit 支撐主要觀察；結論停在 controlled text-only susceptibility，而不是 production safety guarantee。

## 既有評測為什麼不夠：robustness 不等於 selective trust

傳統 benchmark 的基本單位通常是 `question → answer`。它可以回答模型在某一種 prompt 下是否答對，卻不能回答：**如果問題完全不變，只把一段 context 加進去，答案的變化是否由這段 context 造成？** 兩個不同 item set 的 accuracy 差異同時混有題目難度、答案格式、知識分布與 context 的影響。

作者在 Section 1–2 將這個缺口與幾種常見直覺分開。第一種直覺是訓練 model resistance：在 prompt 中警告「不要相信外部訊號」，或用 misleading-only data 教模型拒絕。這可能提高 misleading accuracy，但若沒有 correct-context control，模型也可能失去使用真正有用 context 的能力。第二種是只看 clean accuracy：clean 很高並不代表模型能保持答案，因為 misleading context 可能悄悄把 clean-correct answer 翻錯。第三種是把本篇當成 security benchmark；論文明確說 target 不是 refusal，而是 misleading 與 non-misleading context 下的 correctness，因此它與完整 prompt-injection threat model 不同。

這個差異可以用四個問題檢查：

1. **Clean**：沒有外加 context 時，模型能不能完成原問題？
2. **Misleading**：context 指向 plausible wrong answer 時，模型能不能保留 truth-consistent answer？
3. **Correct-context**：context 支持 gold answer 時，模型能不能受益而不退化？
4. **Irrelevant**：context 有自然語氣、但不含 answer-bearing information 時，模型能不能不被帶偏？

只有四個 condition 一起看，才有機會把「拒絕錯訊號」和「拒絕一切訊號」區分開來。

## 核心直覺：先把同一題的 counterfactual 放在一起

MIST-1000 包含 1,000 個 source item：800 個改編自既有 QA、math、reasoning benchmark，200 個由 annotator 撰寫的較長 scenario。每個 item 展開成 4 rows，共 4,000 個 matched condition rows。題目、answer space、answer type、gold answer 與 plausible wrong answer 固定，只有包在問題周圍的 context 改變。Figure 2 的 pipeline 顯示這不是只把字串自動拼接：source pool 先經過 manual screening，再由 STEM-trained annotators 產生四個版本，最後做獨立 review、provenance logging 與 freeze。

![MIST benchmark 的 construction pipeline](/paperReading/selective-context-preference-trust/paper/figure-2-mist-pipeline.webp)

*圖 1（原論文 Figure 2，Section 3.1）：讀者應注意四個 condition 不是四組不相干的題目，而是同一 item 在 source pooling、screening、annotation 與 review 後的 matched variants；這是後續 SC2W 能做 counterfactual 比較的前提。原始 Figure 2 anchor：[Section 3.1 / Figure 2](https://arxiv.org/html/2608.06377v1#S3.F2)；原始 image endpoint：[fig2.png](https://arxiv.org/html/2608.06377v1/2608.06377v1/fig2.png)。本文使用 arXiv v1 原圖轉 WebP；paper page 標示 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，保留來源與授權，沒有把此圖重繪成新的實驗結果。*

![MIST-1000 的 coverage 分布](/paperReading/selective-context-preference-trust/paper/figure-3-scope-framework.webp)

*圖 2（原論文 Figure 3，Section 4）：這張原圖實際展示 SCOPE framework，而不是 MIST coverage；它的教學用途是先把四種 condition 的 preference pair 放在同一個 training scaffold。讀者應注意 quartet 的 shared response pair 與四條 context path，而不是把四種 condition 誤看成四個獨立 algorithm。原始 Figure 3 anchor：[Section 4 / Figure 3](https://arxiv.org/html/2608.06377v1#S4.F3)；原始 image endpoint：[framework.png](https://arxiv.org/html/2608.06377v1/2608.06377v1/figures/framework.png)。本文使用 arXiv v1 原圖轉 WebP；paper page 標示 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，保留來源與授權。*

Figure 4 則把 MIST coverage 拆成 topics、signal channels、source types 與 wrong-answer plausibility。作者報告 topic 包含 math、general knowledge、science、commonsense、academic、consumer finance 與 workplace policy；misleading signal 來自九類 channel，wrong answer 分成七種 plausibility class。這些分布讓 misleading 不只是單一固定模板，但不代表它已涵蓋真實企業 corpus 的文件格式、語言與 multi-hop tool trace。

## 用一個 item 走完整個方法：從 clean answer 到 SC2W

下面的 walkthrough 是忠實抽象，不是我重新執行的實驗。假設一個 item 問一個多步數學問題，gold answer 是 `48`，而一段看似 official 的 calculator note 寫成 `24`。這類「合理但錯」的 answer-like signal 正是 paper 想測的 failure，不是隨機亂碼。

1. **Input**：同一個 question 與 answer format 被複製成 `clean`、`misleading`、`correct`、`irrelevant` 四個 prompt。clean 沒有 context；misleading 放入 `24` 的 note；correct-context 放入支持 `48` 的 matched hint；irrelevant 放入自然但不提供答案的文字。
2. **Intermediate representation**：每個 row 保留 item ID、condition、source、source ID、topic、answer type、gold string、wrong value 與完整 prompt。四個 row 的 question 與 gold answer 相同，condition-specific 的 context 才不同。
3. **Model decision**：模型在每個 prompt 生成 completion。公開 evaluator 以 multiple-choice、numeric、boolean 的 type-aware parser 取出 final answer；它不把自由形式 prose 的相似度直接當成 correctness。
4. **Output**：若 clean 答 `48` 而 misleading 答 `24`，這個 item 進入 SC2W 的 numerator；若 clean 本來就錯，則不進 numerator 或 denominator，避免把原本的能力不足誤算成 signal-induced failure。
5. **Likely failure point**：模型可能在 reasoning 中算出 `48`，卻在最後採用 note 的 `24`；也可能在 clean 與 misleading 都錯。前者是 selective-trust failure，後者不能由 SC2W 單獨解釋。

這個例子也說明為什麼 correct-context 與 irrelevant-context 是控制條件。若只把 clean 與 misleading 對比，模型把所有外部文字丟掉，可能同樣降低 SC2W；只有 correct-context accuracy 與 irrelevant-context accuracy 一起保留，才看得到「會拒絕錯訊號、也會接受對訊號」的差別。

## MIST 的 metric：SC2W 量的是哪一種錯

令 $x_i^r$ 為 item $i$ 在 condition $r\in\{clean, mis, cor, irr\}$ 下的 prompt，$y_i$ 為 gold answer。經過 type-aware final-answer parsing 後，$a_i^r=\mathbb{1}[\hat y_i^r=y_i]$，每種 condition 的 accuracy 是：

$$
\mathrm{Acc}_r=\frac{1}{N}\sum_{i=1}^{N} a_i^r.
$$

四個 condition 的平均是：

$$
\mathrm{Overall\ Acc}=\frac{1}{4}\sum_{r}\mathrm{Acc}_r.
$$

核心 metric 是：

$$
\mathrm{SC2W}=\frac{\sum_i\mathbb{1}[a_i^{clean}=1\land a_i^{mis}=0]}{\sum_i\mathbb{1}[a_i^{clean}=1]}.
$$

它的 operational role 很窄也很有用：分母只留下模型在 clean 已答對的 item，numerator 再數其中有多少被 misleading condition 翻錯。因此 SC2W 低，代表較少發生 signal-induced clean-to-wrong flip；它不是整體 answer quality，也不是 context relevance score，更不是 production incident probability。

論文主表同時報告 Clean Acc.、Misleading Acc.、Correct-Context Acc.、Irrelevant Acc.、Overall Acc. 與 SC2W。所有 accuracy 越高越好，SC2W 越低越好。這個方向差異很重要：只看 misleading accuracy 會看不到 correct-context damage；只看 SC2W 又看不到模型是否原本就不會做題。

## SCOPE 的技術機制：改 preference data，不改 DPO loss

### 1. Mining：鎖定真正要修的 failure

SCOPE 的 training data 不是任意四條 prompt-response row。對每個保留 item，作者找出一組 response pair：$r_i^+$ 是 truth-consistent 的完整 completion，$r_i^-$ 是 base model 在 misleading context 下自然產生的 signal-following wrong completion。優先使用同一 base model 的 clean-correct response；必要時才用同一 frozen base checkpoint 加 private diagnostic note 取得 fallback completion。那個 note 只用來 elicitation，不會放進 DPO prompt；含 privileged-note provenance 或 answer-key wording 的 fallback 也會被過濾。

### 2. Match：把一組 response pair 放到四個 context

對 $b\in B=\{mis, clean, cor, irr\}$，建立 $D_b=\{(z_i^b,r_i^+,r_i^-)\}_{i=1}^{N_b}$。每個 condition 都偏好同一個 truth-consistent response，拒絕同一個 signal-following response。這個設計的關鍵不是四個 loss 各自有新演算法，而是 response pair、problem、answer type 與 format 盡量固定，讓 preference signal 對準 context role，而不是對準 topic、length 或 template。

![SCOPE 的 matched preference framework](/paperReading/selective-context-preference-trust/paper/figure-3-scope-framework.webp)

*圖 3（原論文 Figure 3，Section 4）：讀者應注意 matched preference construction 同時涵蓋 misleading、clean、correct-context 與 irrelevant-context；SCOPE 的新意在資料進入標準 DPO 前的 quartet balance，不是發明一個取代 DPO 的新 optimizer。原始 Figure 3 anchor：[Section 4 / Figure 3](https://arxiv.org/html/2608.06377v1#S4.F3)；原始 image endpoint：[framework.png](https://arxiv.org/html/2608.06377v1/2608.06377v1/figures/framework.png)。本文使用 arXiv v1 原圖轉 WebP；paper page 標示 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，保留來源與授權。*

### 3. Balanced DPO：四個 behavior 是一個 objective 的 components

對 trainable policy $\pi_\theta$ 與 frozen reference policy $\pi_{ref}$，paper 定義 relative score：

$$
s_\theta(z,r)=\beta\log\frac{\pi_\theta(r\mid z)}{\pi_{ref}(r\mid z)}.
$$

對 pair $p=(z,r^+,r^-)$，$\Delta_\theta(p)=s_\theta(z,r^+)-s_\theta(z,r^-)$，condition-specific DPO loss 是：

$$
\mathcal{L}_b(\theta)=-\mathbb{E}_{p\sim D_b}[\log\sigma(\Delta_\theta(p))].
$$

correct-context 與 irrelevant-context 合併成 $\mathcal{L}_{nonadv}=\rho\mathcal{L}_{cor}+(1-\rho)\mathcal{L}_{irr}$，整體 SCOPE objective 是：

$$
\mathcal{L}_{SCOPE}=\lambda_m\mathcal{L}_{mis}+\lambda_c\mathcal{L}_{clean}+\lambda_p\mathcal{L}_{nonadv},
$$

其中 $\lambda_m+\lambda_c+\lambda_p=1$。headline run 使用 $(\lambda_m,\lambda_c,\lambda_p,\rho)=(0.25,0.25,0.50,0.50)$，因此四個 condition 各取得 25% sampling mass。增加某個 $\lambda$，就是提高該 condition preference pair 在 training signal 中的比重；它不是宣稱該 condition 在真實流量中佔同樣比例。

實作上是 full-completion sigmoid DPO 加 LoRA。GitHub README 的 default recipe 是 DPO beta 0.1、learning rate $5\times10^{-6}$、cosine schedule、10% warmup、300 steps、maximum length 4096、batch size 4、gradient accumulation 8、bf16、LoRA rank 64、alpha 128，seed 0。這些設定使 reproduction 具體，但仍不等於任何硬體都能同成本完成：訓練與 vLLM evaluation 需要 CUDA-capable GPU，base checkpoint、GPU memory、driver 與 dependency version 都會影響時間與結果。

## 論文圖像如何讀：不要把 cover 當 evidence

本篇的 Evidence Atlas cover 是依據「一題、四個 context path、一次 selective decision」重新生成的概念視覺，不能當成 paper figure。下面的 body figures 才是 v1 原圖轉換後的 evidence；每一張都在兩種語言中以同一 local asset、同一 source anchor 與同一 CC BY 4.0 provenance 出現。

![MIST 的 misleading-signal effect](/paperReading/selective-context-preference-trust/paper/figure-1-misleading-signal-drop.webp)

*圖 4（原論文 Figure 1，Section 1）：這是現象層的主證據：把 clean context 換成 plausible misleading signal，所有受測 model 都出現 accuracy drop，包含 frontier proprietary models。讀者應注意它支持「普遍 susceptibility」的 benchmark observation，不支持「每個 production model 必然同幅度退化」。原始 Figure 1 anchor：[Section 1 / Figure 1](https://arxiv.org/html/2608.06377v1#S1.F1)；原始 image endpoint：[fig1.png](https://arxiv.org/html/2608.06377v1/2608.06377v1/fig1.png)。本文使用 arXiv v1 原圖轉 WebP；paper page 標示 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，保留來源與授權。*

## 實驗如何讀：setup、controls 與主要結果

### Setup：datasets、baselines、metrics、compute

**Datasets 與 split**：MIST-1000 的 source pool 有 1,000 items、4,000 matched rows；訓練 pool 與 MIST evaluation items 不重疊。外部 transfer 使用 GSM-IC、GSM-Plus 與 Sharma-style sycophancy suites，每個 dataset 取 300 items；作者指出訓練沒有使用這些 target datasets 的 external examples、model selection 或 hyperparameter tuning。

**Baselines**：主表先放 23 個 reference/off-the-shelf model，涵蓋 API reference 與 open-weight models；可訓練比較在 Qwen3-4B 與 Llama-3.2-3B 上對照 Prompt-Defense、SFT、Standard-DPO、OPSD 與 SCOPE。這些 baseline 不應被簡化成同一類：Prompt-Defense 是 inference-time warning，SFT 使用 chosen responses 而不使用 rejected responses，Standard-DPO 只用 misleading-only pairs，OPSD 是 current policy generations 的 on-policy self-distillation。

**Metrics**：四個 condition accuracy、Overall Acc.、SC2W 是 deterministic exact match；multiple-choice、numeric、boolean 各使用 type-aware final-answer parsing。Table 1 的不確定性是 paired item-level bootstrap 或 auxiliary proxy estimate，不是 training-seed variance。外部 GSM-IC／GSM-Plus 使用 deterministic numeric exact match，Sharma 使用固定 Qwen2.5-14B judge 的 correctness 與 bias-following，不能把所有分數當成同一 metric。

**Compute 與 protocol**：paper 以 single fixed decoding seed 評估，repository 用 vLLM、temperature 0、type-aware parser 與 paired item-level bootstrap；SCOPE 使用標準 DPO、LoRA、bf16、固定 training budget。這些 control 讓比較更可讀，但沒有建立跨 seed、跨 provider、跨 hardware 或 live traffic 的 uncertainty。

### Main result：resistance 和 controls 要一起讀

Figure 1 先回答「misleading signal 是否真的能改變答案？」答案是 yes：跨 23 個 models，作者在 Conclusion 報告平均 17.1-point loss。這是一個 across-model phenomenon 的 observation；它不是自然流量的事故率，也沒有告訴我們哪種企業資料最常觸發。

Table 1 再回答「訓練能否降低這個 flip，同時維持其他 condition？」Qwen3-4B base 的 Clean / Misleading / Correct-context / Irrelevant / Overall / SC2W 為 94.5 / 62.5 / 98.1 / 92.6 / 86.9 / 35.0；SCOPE 為 95.0 / 80.7 / 98.1 / 94.3 / 92.0 / 16.3。Llama-3.2-3B base 為 69.5 / 54.4 / 78.5 / 69.3 / 67.9 / 31.5；SCOPE 為 72.0 / 63.1 / 80.0 / 71.6 / 71.7 / 20.6。

這些數字支持三個較窄的說法：SCOPE 在這兩個 trainable family 上降低 MIST susceptibility；Qwen3-4B 的 control accuracy 沒有因改善 misleading condition 而下降；Llama-3.2-3B 的 controls 也比 base 高或相近。它們不支持「SCOPE 在所有 model scale 都優於所有 baseline」，因為實驗只在兩個可訓練 family 做 intervention，且 auxiliary rows 的 proxy uncertainty 要按 Appendix I 解讀。

![SCOPE 的 MIST balance 與 external transfer](/paperReading/selective-context-preference-trust/paper/figure-7-mechanism-diagnostics.webp)

*圖 5（原論文 Figure 7，Appendix D）：這是 mechanism/training diagnostics，不是另一個主 benchmark。讀者應看四個 panel 的互補用途：misleading failures 的 repair count、control accuracy preservation、later checkpoint 的 held-out SC2W，以及 construction ablation 的 robustness–control trade-off。Figure 7(a) 報告 SCOPE 修復 Qwen3-4B 被 misleading context 觸發的 331 個 failures 中 188 個，net repairs 為 182；這支持「多數但不是全部 failure 被修補」的解讀。原始 Figure 7 anchor：[Appendix D / Figure 7](https://arxiv.org/html/2608.06377v1#A4.F7)；原始 image endpoint：[fig5_mechanism.svg](https://arxiv.org/html/2608.06377v1/2608.06377v1/fig5_mechanism.svg)。本文使用 arXiv v1 原圖轉 WebP；paper page 標示 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，保留來源與授權。*

### External transfer：有方向一致，沒有 scope-free generalization

Figure 5 的右半部與 Appendix Table 2 檢查 SCOPE 是否只學會 MIST 的 prompt template。模型只在 item-disjoint matched pool 上訓練，再 zero-shot 評估 GSM-IC、GSM-Plus 與 Sharma。Qwen3-4B + SCOPE 報告 GSM-IC 90.7、GSM-Plus 66.0；Llama-3.2-3B + SCOPE 報告 Sharma accuracy 53.3、Sharma bias-following 44.0，作者將其描述為四個 external higher-is-better metrics 上 best or tied 的 transfer pattern。這是有用的 out-of-distribution check，但 target suite 的 task、metric、judge 與 MIST 四-condition protocol 不同，所以不能把它寫成「已證明 production RAG 泛化」。

### Human audit：支持 scoring protocol，不是 reasoning quality ceiling

Appendix G 的 reference-assisted human scoring audit 讓 annotators 看到 task、reference answer 與兩個匿名 response，不看到 model name 或 automatic score。Figure 6 對六個主 metric 的 human win ratio 與 automatic win ratio 做對照，five metrics 的 Spearman $\rho$ 至少 0.97，SC2W 為 $\rho=0.821$。這支持 deterministic scoring 在此 audit scope 內與 reference-assisted semantic correctness 有一致方向；作者同時明說它不是完整的人類 reasoning-quality evaluation。human audit 每個 pair 一個 annotation，不能解讀成 full inter-annotator agreement 或 domain-expert correctness ceiling。

## Ablation、slice 與 failure mode：真正的 load-bearing choice 是 matched balance

Appendix Table 3 的 Qwen3-4B construction ablation 提供比 headline 更重要的因果線索。完整 SCOPE 為 Clean 95.0、Misleading 80.7、Correct 98.1、Irrelevant 94.3、Overall 92.0、SC2W 16.3。把 pairs 做成 unmatched/random 後，結果變成 92.4、72.7、97.7、92.8、88.9、23.6；只訓 misleading-only pairs 則 91.7、80.5、95.4、92.5、90.0、19.1。後者的 misleading accuracy 看似接近 full SCOPE，但 controls 與 Overall 較差，正好說明 resistance alone 不是 selective trust。

移除 control pairs 的結果也不是「少一個就一定全部壞掉」的簡單故事：without correct pairs 的 Overall 90.6、SC2W 15.7；without irrelevant pairs 的 Overall 90.9、SC2W 16.6；without clean pairs 的 Overall 90.7、SC2W 17.0。SC2W 某些 variants 可能略低，卻同時犧牲其他 controls。因此正確解讀是：**matched construction 與四 condition balance 讓整體 trade-off 更穩定**，不是每個 control 都單獨提供一個必要 theorem。

![MIST slice diagnostics](/paperReading/selective-context-preference-trust/paper/figure-8-slice-diagnostics.webp)

*圖 6（原論文 Figure 8，Appendix F）：slice analysis 將 held-out SC2W 拆成 provenance、answer format 與 misleading-signal source；讀者應注意作者用它檢查改善是否只集中在某一種 artifact，而不是把每個 cell 當成獨立 leaderboard。Appendix Table 4 顯示 authoritative-looking answer key、retrieved document、lecture note 等來源在 base 上可能較易觸發 susceptibility，SCOPE 多數 slice 變 lighter，但仍有 nonzero SC2W。原始 Figure 8 anchor：[Appendix F / Figure 8](https://arxiv.org/html/2608.06377v1#A6.F8)；原始 image endpoint：[fig6b_slice.svg](https://arxiv.org/html/2608.06377v1/2608.06377v1/fig6b_slice.svg)。本文使用 arXiv v1 原圖轉 WebP；paper page 標示 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，保留來源與授權。*

Qualitative examples in Appendix J 讓 failure 變得具體：SCOPE 能修補 answer key、round-trip fuel calculation、quorum boolean conflict 等案例，但仍有一個 plausible search snippet 把錯誤的 `25.68` 留在 base 與 SCOPE 的答案中。這個 remaining failure 很重要，因為它避免把「188/331 repairs」誤寫成「全部修好」；也提醒我們 answer-like retrieved text 可能比明顯的 answer key 更難分辨。

## 證據邊界：contamination、deployment prevalence 與未建立的 claim

第一，**controlled rates 不是 deployment prevalence**。MIST 會刻意嵌入 misleading signals，目的就是壓力測試；因此 SC2W 不能讀成「真實企業 RAG 有 16.3% 事故」。真實流量要再估 signal prevalence、retriever exposure、user workflow、document provenance 與 human escalation。

第二，**contamination 不能完全排除**。800 個 item 改編自 public benchmark，base model 可能見過 clean question。作者指出 matched design 仍可測「模型已經會答的答案是否在 misleading signal 下翻錯」，而 SC2W conditioning 讓單純 memorization 不會自動得到 misleading condition 的正確答案；但這是降低混淆，不是證明 zero contamination。

第三，**scope 是 text-only 且 model scale 有限**。論文的 intervention 主要在 Qwen3-4B 與 Llama-3.2-3B；更大的 architecture、multimodal evidence、long-context retrieval、tool output、browser action、agent memory、非英文 context 與多輪 negotiation 尚未被這組 evidence 覆蓋。

第四，**reasoning faithfulness 不在此 benchmark 的保證內**。模型可能在內部或可見 reasoning 中寫出正確 calculation，最後卻採用錯 signal；也可能 final answer 對了，但 explanation 不 faithful。MIST 的 deterministic parser 主要判 final answer，human audit 只是在限定 scope 內檢查 scoring alignment，不是 chain-of-thought verifier。

第五，**SCOPE 不是 prompt-injection prevention architecture**。論文 Related Work 說 target 不是 refusal；它沒有建立 instruction/data channel separation、least privilege、tool authorization、side-effect confirmation、provenance graph 或 rollback。把 SCOPE 直接宣稱成 injection defense，會把 benchmark 的 context-selection problem 和系統安全控制混在一起。

## 工程判斷與不適用條件

以下是 **Bloss0m 工程化整理**，不是論文提出的官方 framework。我會把 paper 的 insight 轉成四個在 RAG／agent regression suite 中可操作的檢查點：

1. **同題四變體**：對高風險 query 保存 clean、misleading、correct-context、irrelevant-context 的固定 fixture；每次換 retriever、reranker、model、prompt 或 parser 都重跑，而不是只追一個 clean accuracy。
2. **分開記錄五種結果**：保存 clean accuracy、misleading accuracy、correct-context accuracy、irrelevant accuracy 與 SC2W；不要用一個 aggregate score 掩蓋「resistance 上升、context usefulness 下降」的 trade-off。
3. **把 context role 連到 provenance**：MIST 只告訴你一個 model 是否容易被 answer-like text 改變；production 仍需要 source version、retrieval rank、document ACL、freshness、signal type、answer verification 與 action approval，才知道該不該採用該 context。
4. **對 failure 做人工 triage**：把 answer key、retrieved document、search snippet、calculator note 等 misleading source 分 slice；若某一類 source 的 SC2W 長期高，先修 retrieval／rendering／provenance，再決定是否擴大 preference training。

### 什麼時候值得用

這個 evaluation framing 適合用於：RAG context integration、retrieval reranking regression、agent evidence selection、外部 tool output 的 answer-preservation 測試、以及 preference-training data 的 failure mining。它尤其適合回答「這次改動是不是讓 model 更不會被一段 plausible wrong context 帶走？」

### 什麼時候不要單獨用

不要把 MIST 或 SCOPE 單獨用於 clinical decision、financial execution、safety-critical control、即時法規解讀、會造成 side effect 的 tool call、或需要最新 world state 的 autonomous workflow。這些場合至少要加入 domain expert review、source authorization、freshness policy、independent verifier、uncertainty threshold、action sandbox 與 rollback。更不要把 SC2W 低解讀成「context 已經可信」：它只表示在這個 benchmark protocol 中，clean-correct → misleading-wrong 的 flip 較少。

## Artifact 與可重現性（截至 2026-09-21）

我獨立檢查了 paper 連結的 [SCOPE project page](https://worldbench.github.io/scope)、[worldbench/SCOPE GitHub repository](https://github.com/worldbench/SCOPE)、[MIST-Train dataset](https://huggingface.co/datasets/worldbench/MIST-Train) 與 [MIST-Bench dataset](https://huggingface.co/datasets/worldbench/MIST-Bench)。狀態要分開寫：

| Artifact | 查核結果 | 可重現性判斷 |
| --- | --- | --- |
| Project page | 可存取，展示四 condition、leaderboard、SCOPE steps 與 qualitative cases。 | 適合作為作者的導覽頁，不是 training checkpoint 或完整 run log。 |
| GitHub code | public、README、`scope/`、`mist/`、`scripts/`、tests 與 requirements 可讀；repository API 的 `license` 欄位為 null。 | code pipeline 可讀且有 unit tests、schema validation、vLLM evaluator、paired bootstrap；仍需自行取得 model checkpoints、CUDA GPU 與環境版本。 |
| `worldbench/MIST-Train` | public、非 gated；`train.jsonl` 可下載，HF API 顯示 9,440 rows，README 說明 2,360 quartets。 | training data endpoint 可用；dataset card 內仍有舊的 `worldbench/SCOPE-Train` load snippet，應以目前 repo 與 dataset ID 為準。 |
| `worldbench/MIST-Bench` | public、非 gated；`mist_1000.jsonl` 可下載，HF API 顯示 test split、4,000 condition rows。 | benchmark 可下載；dataset card 的 `worldbench/MIST` load snippet 目前無法作為有效 endpoint，不能照抄為 reproduction command。 |
| Checkpoints / full paper run | 本次查核未發現作者另行公開 paper-specific merged checkpoints、完整 raw generation outputs 或每個 model 的 hash/cost log。 | 可以先跑 repository unit tests 與 10-item smoke evaluation，再做單一 released model 的四-condition scoring；不能稱為一鍵重現全文所有結果。 |

最小可行 reproduction path 是：clone repository；建立 Python 3.10 environment；安裝 requirements；跑 `python -m unittest discover -s tests -v`；下載目前有效的 `worldbench/MIST-Train` 與 `worldbench/MIST-Bench`；使用一個可取得的 base model 跑 `--max_items 8 --selftest` 或 evaluator 的 `--smoke_items 10`；確認 output 產生 `metrics.json`、`item_scores.jsonl` 與四 condition 的 SC2W。完整 training 仍需要 CUDA、LoRA/DPO stack、GPU memory 與 checkpoint license；external transfer 的 judge 與資料也要依各自 license 與 provider availability 另外處理。

## 讀完後的三個記憶點

1. **Technical idea**：MIST 把一個 reasoning item 做成四個 matched context counterfactual；SCOPE 再把同一個 truth-consistent／signal-following preference pair 均衡放到四種 condition，改的是 data construction，不是 DPO loss。
2. **Evidence**：23 個 model 都在 Figure 1 的 benchmark 中受 misleading signal 影響；SCOPE 在 Qwen3-4B 與 Llama-3.2-3B 降低 SC2W 並保留 controls，且 ablation 顯示 unmatched 或 misleading-only training 的 balance 較差。
3. **Boundary**：SC2W 是 controlled susceptibility metric，不是 deployment prevalence、truth certificate 或 prompt-injection defense；contamination、text-only scope、有限 model family 與 artifact documentation mismatch 都要在採用前保留。

## Primary sources

- [Sun et al., “Learning When to Trust via Selective Context Preference Optimization,” arXiv:2608.06377 v1](https://arxiv.org/abs/2608.06377v1)；[v1 PDF](https://arxiv.org/pdf/2608.06377v1)；[v1 HTML](https://arxiv.org/html/2608.06377v1)。
- [Official SCOPE project page](https://worldbench.github.io/scope)。
- [Official SCOPE code and evaluation pipeline](https://github.com/worldbench/SCOPE)。
- [MIST-Train on Hugging Face](https://huggingface.co/datasets/worldbench/MIST-Train)；[MIST-Bench on Hugging Face](https://huggingface.co/datasets/worldbench/MIST-Bench)。
