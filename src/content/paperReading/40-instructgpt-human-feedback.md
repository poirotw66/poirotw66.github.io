---
title: "InstructGPT：用人類回饋對齊指令，但不能把 2022 偏好勝率當成後來 ChatGPT 的產品契約"
description: "精讀 Ouyang et al. NeurIPS 2022／arXiv:2203.02155：沿用 GPT-3 架構，以 SFT 示範、reward model 與 PPO（PPO-ptx）三階段繼續調整權重，使預訓練 LM 更符合人類偏好。175B InstructGPT 相對 175B GPT-3 偏好勝率 85±3%；這是 2022 API 標註分佈證據，不是 ChatGPT 產品 SLA、GPT-4 或 DPO 契約。"
pubDate: 2026-08-28
updatedDate: 2026-08-28
tldr:
  - "InstructGPT 改的控制點是：next-token 預訓練之後，用 labeler 示範做 SFT、用人類比較訓練 6B reward model、再以 PPO（預設 PPO-ptx）優化政策；架構仍是 GPT-3 family，不是新 Transformer。"
  - "Figure 1／Section 4.1：175B InstructGPT（PPO-ptx）相對 175B GPT-3 偏好勝率 85±3%，相對 few-shot GPT-3 71±4%；1.3B InstructGPT 仍優於 175B GPT-3。SFT 單獨是重要基線，PPO 在 SFT 之上再拉一截。"
  - "這是 2022 封閉模型上的 RLHF 流程證據，不是 ChatGPT 上線 MAU、GPT-4 eval、DPO（Rafailov）、Llama-2-chat 或 Constitutional AI。BERT NLU、YOLO mAP、Transformer WMT BLEU 數字不屬本 PDF。"
audience:
  - "讀完 Transformer 後，要把「序列轉換架構」與「預訓練 LM 對齊控制點」分開的 ML 實作者。"
  - "需要判斷 2022 labeler 偏好勝率能否外推到 2026 chat 產品 SLA 的技術負責人。"
tags: ["Paper Reading", "InstructGPT", "RLHF", "Alignment", "Instruction Following", "NLP"]
image: "/paperReading/40-instructgpt-human-feedback/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - sequence-modeling-foundations
paper:
  title: "Training language models to follow instructions with human feedback"
  authors:
    - "Long Ouyang"
    - "Jeff Wu"
    - "Xu Jiang"
    - "Diogo Almeida"
    - "Carroll L. Wainwright"
    - "Pamela Mishkin"
    - "Chong Zhang"
    - "Sandhini Agarwal"
    - "Katarina Slama"
    - "Alex Ray"
    - "John Schulman"
    - "Jacob Hilton"
    - "Fraser Kelton"
    - "Luke Miller"
    - "Maddie Simens"
    - "Amanda Askell"
    - "Peter Welinder"
    - "Paul Christiano"
    - "Jan Leike"
    - "Ryan Lowe"
  year: 2022
  venue: "NeurIPS 2022（arXiv 2203.02155 v1）"
  links:
    pdf: "https://arxiv.org/pdf/2203.02155v1"
    arxiv: "https://arxiv.org/abs/2203.02155"
    doi: "https://doi.org/10.48550/arXiv.2203.02155"
    code: "https://github.com/openai/following-instructions-human-feedback"
    project: "https://arxiv.org/abs/2203.02155"
series:
  id: "instructgpt-human-feedback"
  title: "InstructGPT 原始論文精讀"
  part: 1
  totalParts: 1
---

讀法可搭配 [三遍掃描法](/blog/08-efficient-paper-reading-three-pass/)。本篇接在 [AlexNet（上）](/paper-reading/01-alexnet-paper-reading-part-1/)／[（下）](/paper-reading/02-alexnet-paper-reading-part-2/)、[ResNet](/paper-reading/37-resnet-deep-residual-learning/)、[YOLO](/paper-reading/38-yolo-you-only-look-once/) 與 [Transformer](/paper-reading/39-attention-is-all-you-need/) 之後，是 **foundations 脊椎的第六節**：Transformer 教序列轉換架構；InstructGPT 則在 **同一 GPT-3 架構** 上，把控制點改到 **預訓練之後的人類回饋對齊（SFT → RM → PPO）**，並把 **labeler 偏好勝率** 寫進 headline 證據表。

## 90 秒掌握論文 / The paper in 90 seconds

- **問題**：更大的 LM 不會自動更聽話；GPT-3 類模型在 next-token 預訓練目標下常產生不真實、有毒或不依指令的輸出（Section 1）。語言建模目標與「依使用者意圖、安全地回應」並不對齊。
- **核心洞見**：沿用 **GPT-3 模型架構**，但繼續更新模型參數，依序完成三個階段：**(1) SFT**——用約 40 位 contractor 的示範微調；(2) **RM**——用 6B reward model 擬合人類排序；(3) **PPO**——以 RM 分數為獎勵，並加上相對 SFT policy 的 KL 懲罰；預設 **PPO-ptx** 還混入預訓練目標，以減輕 public NLP 任務退步（Figure 2、Equation 2、Section 3.5）。改變的是 **人類偏好對齊程序**，不是 attention 架構。
- **最強證據**：API prompt 分佈上，labeler 偏好評估（Figure 1、Section 4.1）：**175B InstructGPT 相對 175B GPT-3 勝率 85±3%**；相對 few-shot GPT-3 **71±4%**；**1.3B InstructGPT 仍優於 175B GPT-3**（>100× 參數差距）。相對 175B SFT 基線，InstructGPT 勝率 **73.4±2%**，優於 FLAN／T0 微調（26.8±2%、29.8±2%）。
- **主要邊界**：**2022 封閉 GPT-3 family**；偏好來自特定 labeler 與 API Playground 分佈（Section 5.2–5.3）。**ChatGPT 產品指標、GPT-4、DPO、Llama-2-chat、Constitutional AI 不屬本 PDF**；YOLO mAP、Transformer WMT BLEU 亦不是對齊契約。

我的 bounded verdict 是：**InstructGPT 值得保留的是「預訓練後用 SFT+RM+PPO 改寫控制點」這份 2022 工程路線；不值得保留的是把 85±3% 偏好勝率當成 2026 chat 產品 SLA。**

> **花花的一句話**
>
> 架構還是 GPT-3；變的是訓練管線——先模仿 labeler 示範，再讓 reward model 學會比較回答，最後用 PPO 提高偏好分數。Figure 1 的勝率是 2022 標註者偏好，不是 ChatGPT 的產品成效指標。

## 版本與閱讀範圍 / Version and reading scope

本文讀的是 [Ouyang et al., NeurIPS 2022](https://arxiv.org/abs/2203.02155) 對應的 [arXiv:2203.02155 v1](https://arxiv.org/abs/2203.02155)（2022-03-04）。PDF 標示 [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/)。作者順序以 v1 為準（標註 * 為同等貢獻）：**Long Ouyang、Jeff Wu、Xu Jiang、Diogo Almeida、Carroll L. Wainwright、Pamela Mishkin、Chong Zhang、Sandhini Agarwal、Katarina Slama、Alex Ray、John Schulman、Jacob Hilton、Fraser Kelton、Luke Miller、Maddie Simens、Amanda Askell、Peter Welinder、Paul Christiano、Jan Leike、Ryan Lowe**。

除摘要外，本文核對 Section 3 方法（Figure 2、Equation 1–2）、Section 4 結果（Figure 1、3–7）、Section 5 討論與限制，以及截至 **2026-08-28** 的 `openai/following-instructions-human-feedback` 連結。ChatGPT、GPT-4、DPO、Llama-2-chat 數字，**都不**回填。

## 讀者真正要回答的問題

當你已有 **預訓練 GPT-3 類 LM**，要讓它 **依自然語言指令** 在開放任務上表現更好，該只靠更大模型與 prompt engineering，還是沿用同一架構、透過 SFT、reward model 與 PPO 繼續調整權重？Ouyang et al. 選後者，並用 **labeler 偏好勝率** 與 TruthfulQA／毒性等輔助指標同時報告取捨。

比較精確的讀法不是「InstructGPT 是不是 2026 最強 chat」。真正的問題是：**三階段 RLHF 如何改寫 post-pretraining 資料流、偏好勝率支持什麼、以及哪些後來產品數字不能寫回這篇。**

## 證據地圖 / Evidence map

| 層次 | 本文採用的說法 |
| --- | --- |
| **論文直接支持** | Figure 1 偏好評估；Figure 2 三階段管線；Figure 3 held-out labeler 勝率；Figure 4 metadata；Equation (1) RM loss、Equation (2) PPO-ptx 目標；Table 1 API 用例分佈；Section 3.2 資料規模（SFT ~13k、RM ~33k、PPO ~31k prompts）。 |
| **作者主張** | 人類回饋微調能對齊廣泛指令任務；偏好勝率顯著優於 GPT-3 與 SFT-only；PPO-ptx 可減輕 alignment tax；成本遠低於重訓 GPT-3。 |
| **論文未證明** | ChatGPT 產品表現；GPT-4／Claude 等後續系統；DPO 等無 RL 替代；跨文化／跨用戶群的普遍偏好；開源可完全復現 175B 管線。 |
| **Bloss0m 工程判斷** | 把本篇當 **foundations 脊椎第六節**（instruction alignment 控制點），接在 [Transformer](/paper-reading/39-attention-is-all-you-need/) 之後。不要把 BERT GLUE、YOLO VOC、WMT BLEU 混進 RLHF 表；不要把 85±3% 寫成 ChatGPT SLA。 |

## 先前方法為何不足 / Why the previous approach is insufficient

Section 1–2 把脈絡寫清楚。**純預訓練 LM**（GPT-3）優化 next-token 預測，與「依指令、誠實、無害」的使用意圖錯位。**Prompt engineering／few-shot prefix**（GPT-3 prompted）可小幅改善，但 Figure 1 顯示仍遠低於 SFT 與 PPO。**僅 SFT** 能學會模仿示範，卻缺少對「哪個輸出更好」的偏好排序信號。**FLAN／T0** 在 public NLP 任務上微調，在 API 分佈上不如 SFT，更不如 InstructGPT（Section 4.1、Figure 5）。

[Transformer](/paper-reading/39-attention-is-all-you-need/) 解的是 **encoder–decoder 序列轉換與 WMT BLEU**；[YOLO](/paper-reading/38-yolo-you-only-look-once/) 解的是 **整圖偵測**——它們都沒處理 **post-pretraining 人類偏好對齊**。

> **花花的工程提醒**
>
> 「會寫程式」的 LM 不等於「會聽話」的 LM。InstructGPT 的證據是 **labeler 在 API prompt 上更偏好哪個輸出**——不是 MMLU 分數，也不是 ChatGPT 上線後的留存率。

## 核心直覺 / Core intuition

先不要背 PPO 公式。想像一個已預訓練的 **175B GPT-3**：給它「列出五個重燃職涯熱情的方法」，它可能續寫網頁文風、答非所問或過度發揮。**SFT** 讓它先看數萬條 **labeler 寫好的理想回答** 並模仿。**RM** 再學「在 A/B/C/D 四個候選裡人類最愛哪個」。**PPO** 則讓模型 **自己生成**，用 RM 打分當獎勵，但每個 token 都被 **KL 懲罰** 拉著，別漂離 SFT 太遠。

對照三種容易混在一起的下一步：

- **GPT-3 base + prompt**：不改權重，只改輸入；便宜但天花板低（Figure 1）。
- **InstructGPT（本篇）**：SFT → 6B RM → PPO（預設 PPO-ptx）；架構仍是 GPT-3。
- **後來的葉子**：ChatGPT 產品、GPT-4、DPO 直接優化偏好、Constitutional AI——**數字與系統邊界都不屬 2022 PDF**。

## 用一個例子走完整個方法 / Walk one example through the method

以下用一個簡化 API prompt，先交代三階段訓練留下了什麼，再走一次部署時的推論（Bloss0m 教學例，非論文表格編號）。

1. **Input**：prompt「用兩段以內解釋什麼是梯度消失。」（API 分佈中常見的 generation／QA 混合任務，Table 1）。
2. **Intermediate representation**：tokenizer 後的 token 序列進入 **同一套 GPT-3 transformer 堆疊**。在先前訓練中，SFT policy 學過示範；RM 則學過人類如何比較「簡潔、冗長、錯誤」等不同回答。
3. **Model or system decision**：部署推論時，完成 PPO 訓練的 policy 直接自回歸生成回答，**不再呼叫 RM**。只有在 PPO 訓練時，整段 completion 才會得到 RM 的標量獎勵 $r_\theta(x,y)$，並扣除相對 SFT policy 的 log-probability ratio；PPO-ptx 另混入預訓練目標（$\gamma$ 控制強度，Appendix C 寫 $\gamma=27.8$）。
4. **Output**：兩段內、較貼指令的解釋（理想情況）。
5. **Likely failure point**：**錯誤前提**——若 prompt 假設不成立，模型可能照單全收（Figure 9）；**過度 hedging**——簡單問題卻列多種可能；**reward hacking**——若 RM 有盲點，PPO 可能討好 RM 而失真；**封閉 labeler 分佈**——偏好未必代表你的終端用戶（Section 5.2）。

## 技術機制 / Technical mechanism

### 三階段管線（Figure 2、Section 3.1）

- **Step 1 SFT**：labeler 在 API／自寫 prompt 上提供示範；微調 GPT-3。**~13k** 訓練 prompts；訓練 **16 epochs**（Section 3.5）。
- **Step 2 RM**：labeler 對 $K=4$–$9$ 個候選 **排序**；訓練 **6B** reward model（論文稱 175B RM 不穩定，Appendix C）。**~33k** 訓練 prompts。
- **Step 3 PPO**：以 RM 為獎勵 fine-tune SFT 政策；**per-token KL** 懲罰相對 SFT；預設 **PPO-ptx** 混入預訓練梯度。**~31k** PPO prompts（無人類標註，僅作輸入）。

模型規模：**1.3B、6B、175B**，皆為 **GPT-3 架構**（Section 3.5）。

### Reward model loss（Equation 1、Section 3.5）

$$
\operatorname{loss}(\theta)=-\frac{1}{\binom{K}{2}} E_{(x,y_w,y_l)\sim D}\left[\log\left(\sigma\left(r_\theta(x,y_w)-r_\theta(x,y_l)\right)\right)\right]
$$

$r_\theta(x,y)$ 是 prompt $x$ 與 completion $y$ 的標量獎勵；$y_w$ 是人類更偏好的那一側。增大 $r_\theta(x,y_w)-r_\theta(x,y_l)$ → 損失下降 → RM 更符合排序。

### PPO-ptx 目標（Equation 2、Section 3.5）

$$
\operatorname{objective}(\phi)=E_{(x,y)\sim D_{\pi_\phi^{\mathrm{RL}}}}\left[r_\theta(x,y)-\beta\log\frac{\pi_\phi^{\mathrm{RL}}(y\mid x)}{\pi^{\mathrm{SFT}}(y\mid x)}\right]+\gamma E_{x\sim D_{\mathrm{pretrain}}}\left[\log\pi_\phi^{\mathrm{RL}}(x)\right]
$$

$\beta$ 控制 KL 懲罰強度；$\gamma$ 控制預訓練混合（PPO 版設 $\gamma=0$）。**除非另述，文中 InstructGPT 指 PPO-ptx**。

![InstructGPT 論文 Figure 1：各模型相對 175B SFT 的偏好評估。](/paperReading/40-instructgpt-human-feedback/paper/figure-1-preference-eval.webp)

*Figure 1，論文 Section 1／4.1：API prompt 分佈上，InstructGPT（PPO-ptx）相對 175B SFT 的偏好評估；1.3B PPO-ptx 優於 175B GPT-3。原圖見 [arXiv PDF Figure 1](https://arxiv.org/pdf/2203.02155v1#page=1)。圖檔自 NeurIPS 2022 camera-ready PDF 擷取；[arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/)。本頁擷取含周邊正文，細節以 PDF 為準。*

![InstructGPT 論文 Figure 2：SFT、RM 訓練與 PPO 三階段。](/paperReading/40-instructgpt-human-feedback/paper/figure-2-rlhf-pipeline.webp)

*Figure 2，論文 Section 3.1：三階段方法示意——示範資料訓練 SFT、排序資料訓練 RM、PPO 優化政策。原圖見 [arXiv PDF Figure 2](https://arxiv.org/pdf/2203.02155v1#page=3)。擷取與授權說明同 Figure 1。*

## 實驗如何讀 / How to read the evidence

### Figure 1／Section 4.1：偏好勝率（headline）

**問題**：相對 **175B SFT 基線** 與 **175B GPT-3**，InstructGPT 有多少 labeler 偏好優勢？**控制**：held-out API test prompts；三位 labeler 評估；95% 信賴區間。**觀察**：階梯為 GPT-3 < GPT-3 prompted < SFT < PPO < PPO-ptx；**175B vs GPT-3 直接比較 85±3%**；**vs few-shot GPT-3 71±4%**；**1.3B PPO-ptx 仍勝 175B GPT-3**。**邊界**：這是 **2022 contractor 偏好**，不是產品 NPS；prompt 分佈偏 API Playground。

### Figure 3：held-out labeler 與 GPT-3 API prompts

**問題**：是否只 overfit 訓練 labeler？在 **提交給 GPT-3 的 API prompts** 上是否仍成立？**觀察**：held-out labeler 排序與訓練 labeler 相近；GPT-3 prompts 上結論大致不變（Section 4.1）。**邊界**：仍限 **英語為主、特定承包商** 群體。

![InstructGPT 論文 Figure 3：相對 175B SFT 的勝率，含 held-out labeler 與不同 API prompt 來源。](/paperReading/40-instructgpt-human-feedback/paper/figure-3-winrate-panels.webp)

*Figure 3，論文 Section 4.1：勝率相對 175B SFT；左為 GPT API prompts、右為 InstructGPT API prompts；上為 held-out labeler、下為訓練 labeler。原圖見 [arXiv PDF Figure 3](https://arxiv.org/pdf/2203.02155v1#page=8)。擷取含頁面其他內容；以 PDF 為準。擷取與授權說明同 Figure 1。*

### Figure 4／輔助指標：TruthfulQA、毒性、幻覺

**問題**：偏好勝率之外，真實性／毒性／幻覺是否改善？**觀察**：TruthfulQA 上 **真實且資訊性回答約為 GPT-3 兩倍**（Figure 6、Section 4.2）；closed-domain 幻覺 **21% vs 41%**（Section 1）；respectful prompt 下毒性約 **少 25%**（Section 4.2）。**邊界**：**偏見**（Winogender、CrowS-Pairs）**未顯著改善**；public NLP（SQuAD、DROP 等）有 **alignment tax**，PPO-ptx 可緩解但未完全消除（Section 4.2）。

![InstructGPT 論文 Figure 4：API 分佈上的 metadata 評分（適切性、依指令、幻覺等）。](/paperReading/40-instructgpt-human-feedback/paper/figure-4-metadata.webp)

*Figure 4，論文 Section 4.1：相對 GPT-3，PPO 模型在 customer-assistant 適切性、遵守約束、減少幻覺等 metadata 上更佳。原圖見 [arXiv PDF Figure 4](https://arxiv.org/pdf/2203.02155v1#page=9)。擷取與授權說明同 Figure 1。*

### 成本（Section 5.1）

**175B SFT** 約 **4.9 petaflops/s-days**；**175B PPO-ptx** 約 **60**；對照 **GPT-3 預訓練 3640**（Brown et al., 2020）。作者主張：對齊投資相對預訓練 **便宜得多**，且 1.3B 對齊可勝過 175B base。

## 消融與設計選擇 / Ablations

- **SFT-only vs +PPO**（Figure 1）：SFT 已帶來大幅改善，加入 PPO 後再提升；解讀結果時要把 **SFT 的增益** 與 **PPO 在 SFT 之上的增益** 分開。
- **PPO vs PPO-ptx**：偏好分數差異不大；PPO-ptx 顯著減輕 public NLP 回歸（Section 4.2、Figure 29）。
- **KL vs 預訓練混合**（Figure 33–34）：加大 KL 係數會傷驗證獎勵；**ptx 混合** 較能恢復 SQuAD／DROP。
- **RM 規模**：實務選 **6B RM** 而非 175B（不穩定）。
- **FLAN／T0 對照**（Figure 5）：public 指令微調 **不如** API 偏好 RLHF；head-to-head **78±4%**（vs FLAN）、**79±4%**（vs T0）。

## 限制、威脅與不該過度推導的話 / Limitations and threats to validity

1. **對齊對象**：約 **40 位** contractor，**~73%** 標註一致率（Section 3.4、5.2）——**不是全人類價值**。
2. **任務邊界**：API Playground prompt；**96%+ 英語**；非 production API 全量。
3. **安全缺口**：仍會有毒、偏見、捏造；**依有害指令時可能更毒**（Section 4.2、5.3）。
4. **不要回填**：ChatGPT 上線數據、GPT-4、Claude、DPO、Llama-2-chat、o1。
5. **與其他 foundations 節點分開**：WMT BLEU、YOLO mAP、ImageNet top-5 **不能** 寫進 RLHF 證據表。

## 工程判斷與不適用條件 / Engineering decision and when not to use it

**何時借用本篇？** 當你已有 **夠大的 base LM**，產品痛點是 **不聽指令／風格不對／偏好不符**，且能負擔 **示範收集 + 排序 + RL 訓練** 時，三階段 RLHF 仍是教科書級起點。先量 **標註者一致率與 RM 校準品質**，再談偏好勝率。

**何時不要照搬？**

- 需要 **開源可復現 175B 全鏈**——本篇模型與資料 **未完整開放**。
- 只有 **少量 SFT 資料** 卻期待 ChatGPT 級體驗——RM+PPO 成本與資料品質門檻仍在。
- 把 **85±3%** 寫進 2026 產品 SLA，或混淆 **InstructGPT 論文** 與 **ChatGPT 產品**。
- 以為 **DPO／RL-free 偏好優化** 已在本文證明——那是後來工作。

> **花花的判斷**
>
> 從 Transformer 帶走「控制點與證據要同年代」；從 InstructGPT 多帶一條——**對齊是 post-pretraining 訓練程序，2022 偏好勝率是研究契約，不是 chat 產品保固書。**

## Artifact 與可重現性 / Artifacts and reproducibility

截至 2026-08-28 的 artifact 狀態：

- **論文**：[arXiv abs](https://arxiv.org/abs/2203.02155)、[PDF v1](https://arxiv.org/pdf/2203.02155v1) 可讀。
- **樣本**：[openai/following-instructions-human-feedback](https://github.com/openai/following-instructions-human-feedback) 釋出部分 NLP 任務取樣；**不等於** 可重訓 175B 全管線。
- **模型權重**：**未公開** 175B InstructGPT checkpoint；復現需自有 base LM 與標註預算。

最小有用 reproduction：在 **小模型** 上跑通 SFT → RM → PPO 迴圈，並記錄 **KL 與獎勵曲線**——驗證機制，不是復現 85±3%。

## 三個記憶點 / Three things to remember

1. **技術想法**：沿用 GPT-3 架構並繼續調整權重；**SFT 示範 → 6B RM 排序 → PPO（+KL，預設 PPO-ptx）**；改變的是 **人類偏好對齊程序**，不是新的 Transformer 架構。
2. **證據**：Figure 1——**175B InstructGPT vs GPT-3 85±3%**、vs few-shot **71±4%**；**1.3B 勝 175B GPT-3**；輔以 TruthfulQA／毒性／幻覺率。
3. **邊界**：**2022 封閉 API labeler 偏好**；不是 ChatGPT／GPT-4／DPO；AlexNet→…→Transformer→**InstructGPT** 是 foundations 脊椎：CV→序列轉換→**指令對齊**。

## 延伸閱讀

若尚未讀過序列起點，回到 [Transformer](/paper-reading/39-attention-is-all-you-need/)。讀法見 [三遍掃描法](/blog/08-efficient-paper-reading-three-pass/)。foundations 脊椎下一節是 [Speculative Decoding](/paper-reading/41-speculative-decoding/)（凍結權重下的無損推論加速，不是新架構）。若要對照 **prompt 內推理** 與 **瀏覽器輔助 QA** 的不同控制點，可讀 [CoT](/paper-reading/29-chain-of-thought-prompting/) 與 [WebGPT](/paper-reading/30-webgpt-browser-assisted-qa/)——它們 **不改 post-training 偏好管線**，與本篇互補。BERT、GPT-2/3 預訓練、ChatGPT 產品、DPO 葉子刻意不展開。

## Primary sources

- [Ouyang et al., “Training language models to follow instructions with human feedback,” NeurIPS 2022 / arXiv:2203.02155 v1](https://arxiv.org/abs/2203.02155)
- [DOI 10.48550/arXiv.2203.02155](https://doi.org/10.48550/arXiv.2203.02155)
- [Sample outputs repository](https://github.com/openai/following-instructions-human-feedback)
