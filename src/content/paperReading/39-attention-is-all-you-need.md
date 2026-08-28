---
title: "Transformer：用 self-attention 拿掉 recurrence，但不能把 WMT 2017 BLEU 當成後來 LLM 的產品契約"
description: "精讀 Vaswani et al. NeurIPS 2017／arXiv:1706.03762：用 stacked encoder–decoder、multi-head self-attention 與 positional encoding 取代 RNN/CNN 做機器翻譯。WMT 2014 上 big 模型 EN-DE 28.4 BLEU、EN-FR 41.8 BLEU；這是 2017 序列轉換證據，不是 BERT、GPT-3 或 ViT 契約。"
pubDate: 2026-08-28
updatedDate: 2026-08-28
tldr:
  - "Transformer 改的控制點是：用可並行的 global self-attention 取代 encoder–decoder 裡的 recurrence／convolution，讓每個位置在常數步內與全序列互動；positional encoding 補回順序資訊。"
  - "Base 設定 N=6、d_model=512、h=8 heads、d_ff=2048；8×P100 上 base 訓練約 12 小時（100K steps）。Table 2：Transformer (big) WMT 2014 newstest2014 EN-DE 28.4 BLEU、EN-FR 41.8 BLEU，訓練 FLOPs 低於 GNMT／ConvS2S ensemble。"
  - "這是 MT encoder–decoder，不是預訓練 LM、不是 BERT 雙向編碼、不是 decoder-only GPT、不是 ViT。Bahdanau 等 seq2seq+attention 是先前對照；BERT／GPT-2/3／T5／LLaMA 數字不屬本 PDF。"
audience:
  - "讀完 AlexNet、ResNet、YOLO 後，要把 CV 骨幹與序列轉換控制點分開的 ML 實作者。"
  - "需要判斷 WMT-era BLEU／訓練成本能否外推到 2026 LLM 產品 SLA 的技術負責人。"
tags: ["Paper Reading", "Transformer", "Attention", "Machine Translation", "NLP", "Deep Learning"]
image: "/paperReading/39-attention-is-all-you-need/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - sequence-modeling-foundations
paper:
  title: "Attention Is All You Need"
  authors:
    - "Ashish Vaswani"
    - "Noam Shazeer"
    - "Niki Parmar"
    - "Jakob Uszkoreit"
    - "Llion Jones"
    - "Aidan N. Gomez"
    - "Łukasz Kaiser"
    - "Illia Polosukhin"
  year: 2017
  venue: "NeurIPS 2017（arXiv 1706.03762 v7）"
  links:
    pdf: "https://arxiv.org/pdf/1706.03762v7"
    arxiv: "https://arxiv.org/abs/1706.03762"
    doi: "https://doi.org/10.48550/arXiv.1706.03762"
    code: "https://github.com/tensorflow/tensor2tensor"
    project: "https://arxiv.org/abs/1706.03762"
series:
  id: "attention-is-all-you-need"
  title: "Transformer 原始論文精讀"
  part: 1
  totalParts: 1
---

讀法可搭配 [三遍掃描法](/blog/08-efficient-paper-reading-three-pass/)。本篇接在 [AlexNet（上）](/paper-reading/01-alexnet-paper-reading-part-1/)／[（下）](/paper-reading/02-alexnet-paper-reading-part-2/)、[ResNet](/paper-reading/37-resnet-deep-residual-learning/) 與 [YOLO](/paper-reading/38-yolo-you-only-look-once/) 之後，是 **foundations 脊椎的第五節**：前三節教 CV 分類與偵測的控制點；Transformer 則把 **序列轉換（machine translation）** 改成「只靠 attention、不靠 recurrence」，並把 **並行度與 WMT BLEU** 寫進 headline 證據。

## 90 秒掌握論文 / The paper in 90 seconds

- **問題**：2017 年前 SOTA 序列轉換（seq2seq）多靠 RNN/LSTM/GRU encoder–decoder，計算沿時間步序列展開，難以在長序列上充分並行；Bahdanau 等雖已把 attention 接到 RNN 上，但 recurrence 仍是骨幹（Section 1–2）。
- **核心洞見**：提出 **Transformer**：encoder 與 decoder 皆由 **multi-head self-attention** 與 **position-wise FFN** 堆疊而成，以 **sinusoidal positional encoding** 注入順序，完全拿掉 recurrence 與 convolution。控制點是 **可並行的 global attention** 對 **循序 hidden state**；路徑長度對遠距依賴為 $O(1)$（Table 1）。
- **最強證據**：WMT 2014 newstest2014（Table 2）：**Transformer (big) EN-DE 28.4 BLEU**（超越先前含 ensemble 的最佳結果）、**EN-FR 41.8 BLEU**；big 在 8×P100 上訓練 **3.5 天**（300K steps）。Base 模型 EN-DE **27.3 BLEU**，訓練 FLOPs **$3.3\times10^{18}$**，低於 GNMT+RL 的 **$2.3\times10^{19}$**。硬體段落：base **12 小時**／100K steps、每 step **0.4 秒**（Section 5.2）。
- **主要邊界**：任務是 **監督式 MT encoder–decoder**，不是預訓練語言模型、不是 BERT 雙向編碼、不是 decoder-only GPT、不是 ViT。**BERT／GPT-2/3／T5／LLaMA／ChatGPT 的 benchmark 不屬本 PDF**；YOLO VOC mAP、ResNet ImageNet 4.49% 亦不是 MT 契約。

我的 bounded verdict 是：**Transformer 值得保留的是「attention 成為新的序列 inductive bias、訓練可並行」這份 2017 控制點；不值得保留的是把 WMT 28.4／41.8 BLEU 或 12 小時／3.5 天訓練時間當成 2026 LLM 產品 SLA。**

> **花花的一句話**
>
> RNN 一步一步傳 hidden state；Transformer 讓每個 token 用 attention 直接看全句——但 Table 2 的 BLEU 是翻譯競賽分數，不是 ChatGPT 的使用者契約。

## 版本與閱讀範圍 / Version and reading scope

本文讀的是 [Vaswani et al., NeurIPS 2017](https://papers.nips.cc/paper/7181-attention-is-all-you-need) 對應的 [arXiv:1706.03762 v7](https://arxiv.org/abs/1706.03762)（2017-12-06 修訂）。PDF 與 [arXiv HTML](https://arxiv.org/html/1706.03762v7) 標示 [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/)；Google 另授權在學術評論中重製圖表。作者順序以 v7 為準（**隨機排列、同等貢獻**）：**Ashish Vaswani、Noam Shazeer、Niki Parmar、Jakob Uszkoreit、Llion Jones、Aidan N. Gomez、Łukasz Kaiser、Illia Polosukhin**。

除摘要外，本文核對 Section 3 架構與 attention、Section 4 與 RNN/CNN 複雜度對照（Table 1）、Section 5 訓練、Section 6 結果（Table 2–4、Figure 3–5 附錄視覺化），以及截至 **2026-08-28** 的 `tensorflow/tensor2tensor` 連結。BERT、GPT-2/3、T5、ViT、LLaMA 數字，**都不**回填。

## 讀者真正要回答的問題

當你要做 **序列到序列** 轉換（本篇是英德／英法翻譯）時，該繼續用 RNN encoder–decoder + Bahdanau attention，還是把 recurrence 整段換成 self-attention？Vaswani et al. 選後者，並用 WMT BLEU **與** 訓練 FLOPs／牆鐘時間同時報告取捨。

比較精確的讀法不是「Transformer 是不是 2026 最強 LLM」。真正的問題是：**global parallel attention 如何改寫 seq2seq 的資料流與訓練成本、WMT-era 數字支持什麼、以及哪些後來預訓練 LM 數字不能寫回這篇。**

## 證據地圖 / Evidence map

| 層次 | 本文採用的說法 |
| --- | --- |
| **論文直接支持** | Figure 1 encoder–decoder 堆疊；Figure 2 scaled dot-product 與 multi-head attention；Equation (1) attention、Equation (2) FFN；Table 1 路徑長度與並行度；Table 2 WMT BLEU 與訓練 FLOPs；Table 3 base/big 消融；Table 4 句法分析 F1；附錄 Figure 3–5 attention 視覺化。 |
| **作者主張** | 完全依賴 attention 的 transduction 模型品質更好、可並行化、訓練更快；self-attention 路徑短，利於長距依賴；可泛化到 constituency parsing。 |
| **論文未證明** | 雙向預訓練 LM（BERT）；decoder-only 生成式預訓練（GPT）；視覺 Transformer（ViT）；instruction tuning／RLHF；任意長度推理的產品 SLA。 |
| **Bloss0m 工程判斷** | 把本篇當 **foundations 脊椎第五節**（序列轉換控制點），接在 YOLO 之後。CV 起點讀 [AlexNet](/paper-reading/01-alexnet-paper-reading-part-1/)／[ResNet](/paper-reading/37-resnet-deep-residual-learning/)／[YOLO](/paper-reading/38-yolo-you-only-look-once/)。不要把 BERT GLUE、GPT-3 少樣本或 ViT ImageNet 混進 Transformer 表。 |

## 先前方法為何不足 / Why the previous approach is insufficient

Section 1–2 把脈絡寫清楚。**RNN/LSTM/GRU seq2seq**（Sutskever et al.、Cho et al.）沿時間步更新 $h_t=f(h_{t-1},x_t)$，本質上 **序列計算**，長序列時 batch 內並行受限。**Bahdanau et al.** 在 encoder–decoder 上加 **additive attention**，讓 decoder 對 encoder 全位置加權，但 **recurrence 仍是骨幹**。**ConvS2S、ByteNet** 用卷積並行，但遠距依賴需堆疊多層或 dilated conv，路徑長度仍隨距離成長（Table 1）。

[YOLO](/paper-reading/38-yolo-you-only-look-once/) 解的是 **整圖偵測一次迴歸**；[ResNet](/paper-reading/37-resnet-deep-residual-learning/) 解的是 **ImageNet 分類深度**——它們都沒處理 **可變長符號序列的 transduction 與 MT BLEU**。

> **花花的工程提醒**
>
> 「有 attention」不等於「沒有 recurrence」。Bahdanau 的 attention 是掛在 RNN 上；Transformer 是把 **self-attention 當唯一混訊機制**——但 WMT BLEU 仍是翻譯任務分數，不是 GLUE 或 MMLU。

## 核心直覺 / Core intuition

先不要背公式。想像英→德翻譯一句話：**RNN encoder** 從左到右讀完英文，壓成一條 hidden 鏈；**RNN decoder** 再一步一步生成德文，並可用 attention 回頭看 encoder 各位置。**Transformer** 則讓 encoder 每一層裡 **每個英文 subword 直接 attend 到所有英文位置**（self-attention），decoder 則 **masked self-attention**（只看已生成左側）加上 **encoder–decoder attention**（看全部英文），全程 **無 $h_{t-1}$ 遞推**。

對照三種容易混在一起的下一步：

- **Bahdanau seq2seq + attention**：attention 連接 encoder/decoder，但兩側仍是 RNN。
- **Transformer（本篇）**：encoder/decoder 堆疊 **self-attention + FFN**；順序靠 **positional encoding**。
- **後來的葉子**：BERT 雙向 MLM、GPT decoder-only 預訓練、T5 text-to-text、ViT patch attention——**數字與任務都不屬 2017 PDF**。

## 用一個例子走完整個方法 / Walk one example through the method

以下用簡化英→德片段走 **推論** 一步（Bloss0m 教學例，非論文表格編號）。

1. **Input**：英文子詞序列，例如 `The / cat / sat`（實際為 BPE，約 37K 詞表，Section 5.1）。
2. **Intermediate representation**：每個 token embedding（$d_{\text{model}}=512$）加上 positional encoding → 進入 **6 層 encoder**；每層先 **8-head self-attention**（每頭 $d_k=d_v=64$），再 **FFN（512→2048→512）**，殘差 + LayerNorm（Section 3.1–3.3）。
3. **Model or system decision**：decoder 已生成 `Die / Katze`；下一步對 **masked self-attention**（只看左側已生成）與 **encoder–decoder attention**（對全部英文）輸出下一 token 分布；beam search（beam=4，$\alpha=0.6$，Section 6.1）選擇下一子詞。
4. **Output**：完整德文假設 `Die Katze saß`（對應英文 sat）。
5. **Likely failure point**：**長距依賴** 在極長句上 self-attention 為 $O(n^2)$ 記憶體；**copy 行為** 若訓練資料偏向逐字對齊，attention 可能學會複製源句片段（附錄 Figure 3–5 顯示 head 分工，但不保證推理正確）。**OOV／罕見 BPE** 仍靠子詞切分，不是 LLM 式世界知識。

## 技術機制 / Technical mechanism

### Encoder–decoder 堆疊（Figure 1、Section 3.1）

- **Encoder**：$N=6$ 層；每層 = multi-head self-attention + FFN；殘差 + LayerNorm；輸出維度 $d_{\text{model}}=512$。
- **Decoder**：$N=6$ 層；每層 = masked self-attention + encoder–decoder attention + FFN。
- **Big 模型**（Table 3 末行）：$d_{\text{model}}=1024$、$d_{ff}=4096$、$h=16$、300K steps、$P_{drop}=0.3$（EN-FR）。

### Scaled dot-product attention（Equation 1、Figure 2）

$$
\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V
$$

$Q,K,V$ 來自線性投影；除以 $\sqrt{d_k}$ 避免大 $d_k$ 時 softmax 飽和。增大某 key 與 query 的相容性 → 該 value 權重升高 → 輸出更偏向該位置的表示。

### Multi-head attention（Section 3.2.2）

$h=8$ 頭，$d_k=d_v=64$；各頭學不同子空間的依賴（附錄視覺化顯示句法／指代等分工）。**Encoder–decoder attention** 讓 decoder 位置查詢 encoder 全序列。

### Positional encoding（Section 3.5）

正弦／餘弦函數注入位置；因 **無 recurrence**，順序資訊必須顯式加入。Table 3 row (E)：學習式位置 embedding 與 sin 版 **幾乎相同** BLEU。

![Transformer 論文 Figure 1：encoder–decoder 堆疊，含 multi-head attention 與 FFN。](/paperReading/39-attention-is-all-you-need/paper/figure-1-transformer-architecture.webp)

*Figure 1，論文 Section 3：Transformer 架構。原圖見 [arXiv PDF Figure 1](https://arxiv.org/pdf/1706.03762v7#page=3)。圖檔自 NeurIPS 2017 camera-ready PDF 擷取；Google 授權學術重製，見 [arXiv HTML 頁首](https://arxiv.org/html/1706.03762v7)。本頁擷取含周邊正文，細節以 PDF 為準。*

![Transformer 論文 Figure 2：scaled dot-product attention 與 multi-head attention。](/paperReading/39-attention-is-all-you-need/paper/figure-2-attention.webp)

*Figure 2，論文 Section 3.2：attention 機制。原圖見 [arXiv PDF Figure 2](https://arxiv.org/pdf/1706.03762v7#page=4)。擷取與授權說明同 Figure 1。*

## 實驗如何讀 / How to read the evidence

### Table 2：BLEU 與訓練成本（Section 6.1）

**問題**：能否在 **更低訓練 FLOPs** 下超越 GNMT／ConvS2S（含 ensemble）？**控制**：WMT 2014 **newstest2014**；beam=4、length penalty 0.6；big 平均最後 20 checkpoints。**觀察**：Transformer (big) **EN-DE 28.4**、**EN-FR 41.8** BLEU；訓練 FLOPs big EN-DE **$2.3\times10^{19}$**，低於 GNMT+RL ensemble 的 **$1.8\times10^{20}$**。**邊界**：這是 **2014 MT test set**，不是 MMLU／HumanEval；**41.8** 來自 Table 2 欄位（與 abstract 一致）。

### Table 1：為何敢拿掉 RNN（Section 4）

**問題**：self-attention 在 **並行度與路徑長度** 上相對 RNN/CNN 的代價？**觀察**：self-attention 每層 **$O(1)$ sequential ops**、最大路徑 **$O(1)$**；RNN 為 **$O(n)$**。**邊界**：每層複雜度 **$O(n^2 d)$**——長序列仍貴，論文計畫未來做 restricted attention（Section 4 末段）。

### Table 3：消融（Section 6.2）

**問題**：heads、層數、$d_{\text{model}}$ 誰在動 BLEU？**觀察**：base（6 層、8 頭）dev newstest2013 **25.8 BLEU**；單頭 **24.9**；$N=2$ 僅 **23.7**；$d_{\text{model}}=1024$ 升至 **26.0**。**邊界**：全在 **EN-DE dev**，不是 EN-FR test。

### 附錄 Figure 3–5：attention 視覺化（Section 4 末、Appendix）

**問題**：head 是否學到可解釋結構？**觀察**：encoder layer 5 對 **making…difficult** 長距依賴；部分 head 處理 **指代**。**邊界**：視覺化是 **定性** 支持，不是額外 BLEU 增益。

![Transformer 論文附錄 Figure 3：encoder self-attention 長距依賴範例。](/paperReading/39-attention-is-all-you-need/paper/figure-3-attention-visualization.webp)

*Figure 3，論文 Appendix：attention 視覺化（layer 5 of 6）。原圖見 [arXiv PDF 附錄](https://arxiv.org/pdf/1706.03762v7#page=15)。擷取含頁面其他內容；顏色區分不同 head，以 PDF 為準。擷取與授權說明同 Figure 1。*

### Table 4：句法分析轉移（Section 6.3）

4-layer Transformer 在 WSJ **91.3 F1**（僅 WSJ 訓練），semi-supervised **92.7**——顯示架構可轉移，但 **超參數仍沿用 MT base**，不是 parsing 專用 SOTA 產品。

## 消融與設計選擇 / Ablations

- **Head 數**（Table 3A）：8 頭最佳；太少或太多都降 BLEU。
- **$d_k$ 縮小**（Table 3B）：dot-product 相容性變難。
- **層數 $N$**（Table 3C）：6 層優於 2／4 層。
- **Dropout／label smoothing**（Table 3D）：$P_{drop}=0.1$、$\epsilon_{ls}=0.1$ 為 base 預設。
- **Checkpoint averaging**：base 平均最後 5 個、big 最後 20 個（Section 6.1）。

## 限制、威脅與不該過度推導的話 / Limitations and threats to validity

1. **任務邊界**：監督式 **MT**；不是 zero-shot LLM、不是檢索增強生成。
2. **$O(n^2)$ attention**：長文／高解析度輸入需別的近似（論文自述 future work）。
3. **硬體年代**：8×**P100**、12 小時／3.5 天——今日需重測你的叢集與模型規模。
4. **不要回填**：BERT、GPT-2/3、T5、ViT、LLaMA、ChatGPT 的 benchmark **不屬本 PDF**。
5. **與 CV foundations 分開記**：ResNet/YOLO 的 ImageNet／VOC 數字 **不能** 寫進 MT 證據表。

## 工程判斷與不適用條件 / Engineering decision and when not to use it

**何時借用本篇？** 當系統需要 **序列元素之間的全域依賴**、且能接受 $O(n^2)$ attention 成本時，encoder–decoder Transformer 仍是教科書級起點。實作上先量 **單層 attention 的記憶體與延遲**，再談 BLEU 或下游分數。

**何時不要照搬？**

- 需要 **雙向上下文預訓練**（BERT 路線）或 **純 decoder 生成式預訓練**（GPT 路線）——任務與目標函數不同。
- 需要 **影像 patch 序列**（ViT）——模態與 inductive bias 不同。
- 把 **28.4 EN-DE BLEU** 寫進 2026 chat 產品 SLA。
- 混淆 **tensor2tensor 歷史倉庫** 與 **2017 論文實驗契約**。

> **花花的判斷**
>
> 從 YOLO 帶走「改寫控制點並把成本寫進表」；從 Transformer 多帶一條——**attention 是新的序列 inductive bias，但 WMT 2017 BLEU 是翻譯證據，不是後來 LLM 的產品契約。**

## Artifact 與可重現性 / Artifacts and reproducibility

截至 **2026-08-28**：

- **論文**：[arXiv abs](https://arxiv.org/abs/1706.03762)、[PDF v7](https://arxiv.org/pdf/1706.03762v7)、[NeurIPS 2017 頁面](https://papers.nips.cc/paper/7181-attention-is-all-you-need) 可讀。
- **程式**：論文稱訓練／評估碼在 [tensorflow/tensor2tensor](https://github.com/tensorflow/tensor2tensor)（Section 7）。此環境未逐項驗證能否 **一鍵復現 Table 2**；現代 PyTorch/JAX 實作為 downstream ports。
- **資料**：WMT 2014 EN-DE（約 4.5M 句對）、EN-FR（36M 句）；需自行申請／下載當年預處理管線。

最小有用 reproduction：在 **tiny 平行句對** 上跑通 encoder–decoder forward + 一步 masked attention，對照 **每層 attention map 是否非退化**——驗證機制，不是復現 28.4 BLEU。

## 三個記憶點 / Three things to remember

1. **技術想法**：seq2seq transduction 用 **stacked self-attention + FFN** 取代 recurrence；positional encoding 補順序；控制點是 **並行 global attention**。
2. **證據**：Table 2——Transformer (big) **EN-DE 28.4**、**EN-FR 41.8 BLEU**；base **12 小時**／big **3.5 天**（8×P100）；訓練 FLOPs 低於多數 RNN/CNN SOTA。
3. **邊界**：**MT encoder–decoder**，不是 BERT／GPT／ViT；AlexNet→ResNet→YOLO→Transformer 是 foundations 脊椎：CV 可訓→殘差→即時偵測→**序列轉換**。

## 延伸閱讀

若尚未讀過 CV 起點，回到 [AlexNet（上）](/paper-reading/01-alexnet-paper-reading-part-1/)、[（下）](/paper-reading/02-alexnet-paper-reading-part-2/)、[ResNet](/paper-reading/37-resnet-deep-residual-learning/) 與 [YOLO](/paper-reading/38-yolo-you-only-look-once/)。讀法見 [三遍掃描法](/blog/08-efficient-paper-reading-three-pass/)。本篇是 **原始 Transformer**；下一節 foundations 脊椎是 [InstructGPT](/paper-reading/40-instructgpt-human-feedback/)（預訓練後人類回饋對齊，不是新架構）。BERT、GPT、T5、ViT 等葉子刻意不展開。

## Primary sources

- [Vaswani et al., “Attention Is All You Need,” NeurIPS 2017 / arXiv:1706.03762 v7](https://arxiv.org/abs/1706.03762)
- [NeurIPS 2017 proceedings entry](https://papers.nips.cc/paper/7181-attention-is-all-you-need)
- [DOI 10.48550/arXiv.1706.03762](https://doi.org/10.48550/arXiv.1706.03762)
- [tensor2tensor repository](https://github.com/tensorflow/tensor2tensor)
