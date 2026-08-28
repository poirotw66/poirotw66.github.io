---
title: "Speculative Decoding：用小模型打草稿、大模型一次驗，但不能把 T5 加速比當成後來推論堆疊的產品契約"
description: "精讀 Leviathan et al. ICML 2023／arXiv:2211.17192：用小模型 M_q 自迴歸打草稿、目標模型 M_p 平行驗證並以 rejection sampling 保證輸出分佈與單獨解碼相同。T5-XXL 11B 在 T5X 上 2.3X–3.4X 牆鐘加速；這是 2023 無損推論演算法證據，不是 GPTQ、FlashAttention、vLLM、Medusa 或 EAGLE 契約。"
pubDate: 2026-08-28
updatedDate: 2026-08-28
tldr:
  - "Speculative Decoding 改的控制點是：用便宜的 M_q 先猜 γ 個 token，再讓 M_p 一次平行算出 γ+1 步分佈，以 speculative sampling（rejection sampling）決定接受幾個草稿；輸出分佈與只用 M_p 相同，不是蒸餾、不是量化。"
  - "Algorithm 1 + Theorem 3.8：接受率 α 與草稿長度 γ 決定每輪目標模型呼叫產出幾個 token。Table 2：T5-XXL 11B + T5-small 77M，WMT EnDe 3.4X（temp=0）／2.6X（temp=1）；CNN/DM 3.1X／2.3X；batch=1、單顆 TPU-v4、對 T5X baseline。"
  - "這是推論演算法，不是新架構、不是對齊、不是權重量化。需要可用的 draft model 與額外並行算力；記憶體頻寬常是瓶頸時才有意義。vLLM tokens/s、GPTQ perplexity、Medusa/EAGLE 數字不屬本 PDF。"
audience:
  - "讀完 InstructGPT 後，要把「訓練對齊」與「無損推論加速」控制點分開的 ML 實作者。"
  - "需要判斷 T5-era 2X–3X 牆鐘能否外推到 2026 serving stack SLA 的技術負責人。"
tags: ["Paper Reading", "Speculative Decoding", "Inference", "Transformer", "NLP", "Deep Learning"]
image: "/paperReading/41-speculative-decoding/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - sequence-modeling-foundations
paper:
  title: "Fast Inference from Transformers via Speculative Decoding"
  authors:
    - "Yaniv Leviathan"
    - "Matan Kalman"
    - "Yossi Matias"
  year: 2023
  venue: "ICML 2023（arXiv 2211.17192 v2）"
  links:
    pdf: "https://arxiv.org/pdf/2211.17192"
    arxiv: "https://arxiv.org/abs/2211.17192"
    doi: "https://doi.org/10.48550/arXiv.2211.17192"
    project: "https://arxiv.org/abs/2211.17192"
series:
  id: "speculative-decoding"
  title: "Speculative Decoding 原始論文精讀"
  part: 1
  totalParts: 1
---

讀法可搭配 [三遍掃描法](/blog/08-efficient-paper-reading-three-pass/)。本篇接在 [AlexNet（上）](/paper-reading/01-alexnet-paper-reading-part-1/)／[（下）](/paper-reading/02-alexnet-paper-reading-part-2/)、[ResNet](/paper-reading/37-resnet-deep-residual-learning/)、[YOLO](/paper-reading/38-yolo-you-only-look-once/)、[Transformer](/paper-reading/39-attention-is-all-you-need/) 與 [InstructGPT](/paper-reading/40-instructgpt-human-feedback/) 之後，是 **foundations 脊椎的第七節**：InstructGPT 教 **post-pretraining 對齊程序**；Speculative Decoding 則在 **凍結目標模型權重** 的前提下，把控制點改到 **無損推論加速（草稿 + 平行驗證）**，並把 **牆鐘 speedup 與接受率 $\alpha$** 寫進 headline 證據表——教學類比可對照 [YOLO](/paper-reading/38-yolo-you-only-look-once/) 把 **延遲當一等指標**，但本篇證據是 T5-XXL 解碼，不是 VOC mAP。

## 90 秒掌握論文 / The paper in 90 seconds

- **問題**：大型自迴歸 Transformer 解碼 $K$ 個 token 需要 $K$ 次 **序列** 前向；每步常受 **記憶體頻寬** 限制而非純算力飽和，額外並行資源閒置（Section 1）。
- **核心洞見**：**Speculative Decoding**——小模型 $M_q$ 先自迴歸產生 $\gamma$ 個草稿 token，目標模型 $M_p$ **一次平行** 計算 prefix 到各草稿位置的分佈 $p_1,\ldots,p_{\gamma+1}$，再用 **speculative sampling**（rejection sampling + 調整分佈）決定接受幾個草稿並補一個保證來自 $M_p$ 的 token。控制點是 **無損平行驗證** 對 **逐步單模型解碼**；輸出分佈與只用 $M_p$ **完全相同**（Algorithm 1、Appendix A.1）。
- **最強證據**：T5-XXL **11B** 作 $M_p$，現成 T5-small **77M** 作 $M_q$，對 T5X baseline、**batch=1**、**單顆 TPU-v4**（Table 2）：WMT EnDe **3.4X**（temp=0，$\gamma=7$，$\alpha=0.75$）／**2.6X**（temp=1，$\alpha=0.62$）；CNN/DM **3.1X**／**2.3X**。摘要與 Section 4 亦報告相對 T5X 的 **2X–3X** 區間。
- **主要邊界**：需要 **對齊任務的 draft model** 與 **可承載 $\gamma+1$ 並行的算力**；總 **算術操作數可能上升**（Section 3.4、6）。這是 **2023 Google T5X 實作契約**，不是 vLLM／TensorRT-LLM 產品 SLA、不是 GPTQ bitwidth、不是 Medusa/EAGLE 額外 head。InstructGPT 85±3% 勝率、Transformer WMT BLEU、YOLO mAP **不屬本 PDF**。

我的 bounded verdict 是：**Speculative Decoding 值得保留的是「不改目標分佈、用草稿換牆鐘」這份 2023 推論控制點；不值得保留的是把 Table 2 的 3.4X 當成 2026 任意 LLM serving 堆疊的產品保固書。**

> **花花的一句話**
>
> 小模型先猜、大模型一次驗——猜對就多吐幾個 token，猜錯就用 rejection sampling 補回正確分佈；但 Table 2 的 3.4X 是 T5X + TPU-v4 的實驗，不是 vLLM 儀表板上的 tokens/s。

## 版本與閱讀範圍 / Version and reading scope

本文讀的是 [Leviathan et al., ICML 2023](https://proceedings.mlr.press/v202/leviathan23a.html) 對應的 [arXiv:2211.17192 v2](https://arxiv.org/abs/2211.17192)（2023-05-18 修訂）。PDF 標示 [arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/)。作者順序以 v2 為準：**Yaniv Leviathan、Matan Kalman、Yossi Matias**（**Leviathan 與 Kalman 同等貢獻**）。

除摘要外，本文核對 Section 2 演算法與 speculative sampling、Section 3 接受率／牆鐘分析（Theorem 3.8、Figure 2–5、Table 1）、Section 4 T5-XXL 實驗（Table 2–3）、Section 6 限制，以及截至 **2026-08-28** 的論文 PDF 可讀性。GPTQ／AWQ、FlashAttention TFLOPS、vLLM、Medusa、EAGLE、Lookahead 數字，**都不**回填。

## 讀者真正要回答的問題

當你已有一個訓練好的大型自迴歸模型 $M_p$，解碼延遲是產品瓶頸時，該繼續 **逐步用 $M_p$ 取樣**，還是用 **較小 $M_q$ 打草稿再讓 $M_p$ 平行驗證**？Leviathan et al. 選後者，並用 **分佈等價證明** 與 **T5-XXL 牆鐘表** 同時報告取捨。

比較精確的讀法不是「這是不是 2026 最快的 LLM 推論」。真正的問題是：**rejection sampling 如何保證無損、$\alpha$ 與 $\gamma$ 如何換算成每輪產出幾個 token、Table 2 支持什麼硬體契約、以及哪些後來 serving／量化／draft-head 數字不能寫回這篇。**

## 證據地圖 / Evidence map

| 層次 | 本文採用的說法 |
| --- | --- |
| **論文直接支持** | Figure 1 無條件生成示意（綠=接受草稿、紅=拒絕、藍=修正）；Algorithm 1；Equation (1) 期望產出 token 數；Theorem 3.5 $\beta=1-D_{LK}(p,q)$、Corollary 3.6 $\alpha=E(\min(p,q))$；Theorem 3.8 牆鐘加速公式；Table 1 理論 speed/ops；Table 2 T5-XXL 實測；Table 3 多任務 $\alpha$；Figure 5 encoder-decoder trace。 |
| **作者主張** | 大模型解碼可透過 speculative execution 加速且 **不改輸出分佈**；記憶體頻寬瓶頸下額外並行划算；現成小 Transformer 作 $M_q$ 即可 2X–3X；n-gram 等 negligible-cost draft 仍有非零 $\alpha$。 |
| **論文未證明** | 任意硬體上的 vLLM／TensorRT-LLM SLA；GPTQ／AWQ 量化品質；Medusa／EAGLE 學習式 draft head；FlashAttention 核心優化；需重訓或改架構的 adaptive computation 在 **相同分佈** 下的優勢。 |
| **Bloss0m 工程判斷** | 把本篇當 **foundations 脊椎第七節**（無損推論效率），接在 InstructGPT 之後。延遲類比讀 [YOLO](/paper-reading/38-yolo-you-only-look-once/)；程序-on-凍結架構類比讀 [InstructGPT](/paper-reading/40-instructgpt-human-feedback/)。不要把 GPTQ WikiText、vLLM tokens/s、Medusa 接受率混進 Table 2。 |

## 先前方法為何不足 / Why the previous approach is insufficient

Section 1 與 Section 5 把脈絡寫清楚。**標準自迴歸解碼** 每產生一個 token 就呼叫一次 $M_p$，$K$ token 需要 $K$ 次序列前向——即使每步 FLOPs 不大，**權重與 KV cache 的記憶體讀取** 常主導延遲。

常見加速路線與本篇差異：

- **蒸餾／量化／改架構**（Hinton et al.、Hubara et al.、So et al.）：通常 **改模型或重訓**，輸出分佈 **不保證** 與原 $M_p$ 相同。
- **Adaptive computation / early exit**（Han et al.、Schwartz et al.）：用啟發式跳步，**不保證** 與 $M_p$ 相同分佈。
- **Blockwise Parallel Decoding、SAD**（Stern et al.、Sun et al.）：需 **額外訓練** 或限制於 greedy／複製輸入，非一般 stochastic 無損設定。
- **只用 $M_p$ 的 greedy／nucleus 解碼**：分佈正確但 **無法** 把多 token 驗證併到一次 $M_p$ 呼叫。

[InstructGPT](/paper-reading/40-instructgpt-human-feedback/) 解的是 **對齊訓練**；[Transformer](/paper-reading/39-attention-is-all-you-need/) 解的是 **序列轉換架構**——它們都沒處理 **不改權重的解碼牆鐘**。

> **花花的工程提醒**
>
> 「用小模型幫忙」若走蒸餾，你得到的是 **另一個分佈**；Speculative Decoding 的賣點是 **rejection sampling 把分佈拉回 $M_p$**——但 Table 2 仍是 T5 任務，不是 ChatGPT 產品延遲。

## 核心直覺 / Core intuition

先不要背 Algorithm 1。想像目標模型 $M_p$ 正在續寫一段英文摘要：

**標準解碼**：$M_p$ 算一步 → 取樣 token $t_1$ → 再算一步 → $t_2$ → … 每步都要等 $M_p$ 完整前向。

**Speculative Decoding**：便宜得多的 $M_q$（例如 T5-small）先 **連猜** $\gamma$ 個 token $x_1,\ldots,x_\gamma$；$M_p$ **同時** 對 prefix、prefix+$x_1$、…、prefix+$x_1..x_\gamma$ 做前向，得到 $p_1,\ldots,p_{\gamma+1}$。接著對每個 $x_i$ 做 rejection test：以機率 $\min(1, p_i(x_i)/q_i(x_i))$ 接受；第一個被拒的 $i$ 處，從調整分佈 $p'=\mathrm{norm}(\max(0,p-q))$ 再抽一個 **保證來自 $M_p$** 的 token。全接受則再從 $p_{\gamma+1}$ 抽一個額外 token。

對照三種容易混在一起的下一步：

- **只用 $M_p$ 逐步解碼（baseline）**：分佈正確，牆鐘 = $K$ 次序列 $M_p$。
- **Speculative Decoding（本篇）**：分佈仍正確（Appendix A.1），牆鐘取決於每輪 **接受幾個草稿**。
- **蒸餾成小模型單獨部署**：可能更快，但 **不再是 $M_p$ 的分佈**；與本篇問題定義不同。

## 用一個例子走完整個方法 / Walk one example through the method

以下用簡化 **T5 英→德翻譯** 走 **Algorithm 1 一輪**（Bloss0m 教學例，非 Table 2 列號）。

1. **Input**：encoder 已編碼英文句；decoder prefix 為 `<s> Die`（已生成部分德文）。
2. **Intermediate representation**：$M_q$=T5-small 自迴歸產生 $\gamma=3$ 個草稿，例如 `Katze / schläft / gut`；同時準備好各步 $q_i$。
3. **Model or system decision**：$M_p$=T5-XXL **平行** 計算 $p_1,p_2,p_3,p_4$。假設 `Katze`、`schläft` 通過 rejection test（$r_i \le p_i(x_i)/q_i(x_i)$），第三個 `gut` 被拒；從 $p'=\mathrm{norm}(\max(0,p_3-q_3))$ 抽得修正 token `friedlich`。
4. **Output**：新 prefix `<s> Die Katze schläft friedlich`（本輪 **2 個接受的草稿 + 1 個修正 token**）。
5. **Likely failure point**：若 $M_q$ 與 $M_p$ 分佈差太遠（$\alpha$ 低），幾乎每輪只產 **1 個** token，還要付 $M_q$ 的 $\gamma$ 次成本——**比 baseline 更慢**（Corollary 3.9：需 $\alpha>c$ 才有淨加速）。draft 與 target **任務／tokenizer 不對齊** 也會壓低 $\alpha$。

## 技術機制 / Technical mechanism

### Speculative sampling（Section 2.3）

要從 $p(x)$ 取樣，改從 $q(x)$ 提案 $x$：若 $q(x)\le p(x)$ 則接受；若 $q(x)>p(x)$ 則以機率 $1-p(x)/q(x)$ 拒絕，並從 $p'(x)=\mathrm{norm}(\max(0,p(x)-q(x)))$ 重抽。Appendix A.1 證明邊際分佈仍為 $p(x)$。

### Algorithm 1：一輪解碼（Section 2.1–2.3）

- 輸入：$M_p, M_q, prefix$。
- $M_q$ 自迴歸產生 $x_{1..\gamma}$ 與 $q_i$。
- $M_p$ **平行** 計算 $p_1,\ldots,p_{\gamma+1}$。
- $n \leftarrow$ 第一個未通過 rejection 的索引 $-1$（全過則 $n=\gamma$）。
- 若 $n<\gamma$，從調整後的 $p_{n+1}$ 抽修正 token $t$；否則從 $p_{\gamma+1}$ 抽 $t$。
- 輸出：prefix + 接受的 $x_{1..n}$ + $t$（至少 **1** 個來自 $M_p$ 鏈上的新 token）。

### 接受率與期望產出（Section 3.1–3.2）

接受率 $\beta_{x_{<t}} = \Pr[\text{接受 } x_t \sim q]$；$\alpha = E(\beta)$。在 i.i.d. 簡化下，每輪期望產出 token 數：

$$
E(\#\ \text{generated tokens}) = \frac{1-\alpha^{\gamma+1}}{1-\alpha}
$$

Theorem 3.5：$\beta = 1 - D_{LK}(p,q)$，其中 $D_{LK}$ 是對稱散度。Corollary 3.6：$\alpha = E(\min(p,q))$——**$M_q$ 越貼近 $M_p$，$\alpha$ 越高**。

### 牆鐘加速（Theorem 3.8，Section 3.3）

設 $c$ = 單次 $M_q$ 步驟時間／單次 $M_p$ 步驟時間。每輪 Algorithm 1 成本 $\approx T(c\gamma + 1)$，期望產出上式 token 數，得牆鐘改善因子：

$$
\frac{1-\alpha^{\gamma+1}}{(1-\alpha)(\gamma c + 1)}
$$

論文實驗中 $M_q$ 常比 $M_p$ 小 **兩個數量級**，$c < 0.05$ 且常接近 0（Section 3.3）。

![Speculative Decoding 論文 Figure 1：無條件語言模型生成示意，綠色為 $M_q$ 被 $M_p$ 接受的草稿。](/paperReading/41-speculative-decoding/paper/figure-1-speculative-illustration.webp)

*Figure 1，論文 Section 1：speculative decoding 示意（綠=接受、紅=拒絕、藍=修正）。原圖見 [arXiv PDF Figure 1](https://arxiv.org/pdf/2211.17192#page=1)。圖檔自 ICML 2023 camera-ready PDF 擷取；[arXiv.org perpetual non-exclusive license](http://arxiv.org/licenses/nonexclusive-distrib/1.0/)。本頁擷取含周邊正文，細節以 PDF 為準。*

![Speculative Decoding 論文 Figure 2：Algorithm 1 期望產出 token 數隨 $\alpha$ 與 $\gamma$ 變化。](/paperReading/41-speculative-decoding/paper/figure-2-expected-tokens-vs-alpha.webp)

*Figure 2，論文 Section 3.1：$E(\#\ \text{tokens})$ vs $\alpha$（Equation 1）。原圖見 [arXiv PDF Figure 2](https://arxiv.org/pdf/2211.17192#page=3)。擷取與授權說明同 Figure 1。*

## 實驗如何讀 / How to read the evidence

### Table 2：T5-XXL 牆鐘（Section 4.1）

**問題**：相對 **T5X baseline**，現成小 T5 作 $M_q$ 能否 **2X–3X** 加速且輸出相同？**控制**：$M_p$=T5-XXL **11B**；任務 WMT EnDe 與 CNN/DM 摘要；**batch=1**；**單顆 TPU-v4**；既有 checkpoint；argmax（temp=0）與標準取樣（temp=1）。**觀察**：T5-small（77M）整體最佳——EnDe **3.4X**（$\gamma=7,\alpha=0.75$）／**2.6X**（$\gamma=7,\alpha=0.62$）；CNNDM **3.1X**（$\gamma=5,\alpha=0.65$）／**2.3X**（$\gamma=5,\alpha=0.53$）。T5-large $\alpha$ 更高但 $c$ 更大，speedup 反而較低（**1.4X–1.7X**）。**邊界**：**Google 內部 T5X 實作**；不是開源 vLLM 預設；LaMDA 137B 僅報 $\alpha$（Table 3），非 Table 2 牆鐘。

![Speculative Decoding 論文 Table 2：T5-XXL 11B 實測加速（節錄）。](/paperReading/41-speculative-decoding/paper/table-2-t5-xxl-speedups.webp)

*Table 2，論文 Section 4.1：T5-XXL empirical walltime。原表見 [arXiv PDF Table 2](https://arxiv.org/pdf/2211.17192#page=6)。擷取含表頭與部分列；完整數字以 PDF 為準。授權說明同 Figure 1。*

### Table 3 與 Figure 1 小模型實驗

**問題**：$\alpha$ 如何隨 $M_q$ 大小與取樣溫度變化？**觀察**：GPT-like **97M** $M_p$ + **6M** $M_q$ 在 lm1b 上 $\alpha \approx 0.88$–**0.89**（Table 3）；Figure 1 例句 **38 token** 僅 **9** 次 $M_p$ 序列呼叫。**邊界**：lm1b 無條件生成 **不等於** 生產對話 SLA。

### Figure 5：encoder-decoder trace（Section 3.5）

**問題**：$\gamma$ 如何改寫 **牆鐘結構**？**觀察**：相對標準解碼（整段紫色 $M_p$），$\gamma=3$／$7$ 以多段藍色 $M_q$ 換較少的紫色 $M_p$ 區塊。**邊界**：示意圖，不是 benchmark 表。

![Speculative Decoding 論文 Figure 5：encoder-decoder 堆疊的簡化 trace（$\gamma=3$ vs $7$ vs baseline）。](/paperReading/41-speculative-decoding/paper/figure-5-trace-diagram.webp)

*Figure 5，論文 Section 3.5：簡化 trace diagram。原圖見 [arXiv PDF Figure 5](https://arxiv.org/pdf/2211.17192#page=5)。擷取含周邊說明文字。授權說明同 Figure 1。*

### Table 1：理論 speed vs ops（Section 3.5）

**問題**：高 $\alpha$ 與大 $\gamma$ 的 **代價**？**觀察**：例如 $\alpha=0.9,\gamma=10$ 理論 speed **6.86X** 但 ops **1.60X**。**邊界**：假設 $c=\hat{c}=0$；實機需代入 Theorem 3.8。

## 消融與設計選擇 / Ablations

- **$M_q$ 大小**（Table 2–3）：$\alpha$ 隨 $M_q$ 變大而升，但 $c$ 亦升；T5-small 在 T5-XXL 上 **balance 最佳**。
- **$\gamma$**（Figure 3、Section 3.5）：依 $\alpha,c$ 數值最佳化；$\alpha$ 高時可用更大 $\gamma$。
- **取樣溫度**（Table 2）：**temp=0（argmax）** 的 $\alpha$ 與 speedup **高於** temp=1——分佈越尖銳，草稿越易與 $M_p$ 一致。
- **Negligible-cost draft**（Section 3.6）：EnDe bigram $M_q$ 仍有 $\alpha \approx 0.2$，理論 **1.25X**（$\gamma=3$）——低但 **非零**。

## 限制、威脅與不該過度推導的話 / Limitations and threats to validity

1. **算力前提**：需能 **平行** 跑 $\gamma+1$ 次 $M_p$ 前向；若已算力飽和，方法 **無幫助**（Section 6）。
2. **總操作數**：低 $\alpha$ 時 **浪費** $M_p$ 平行計算與 $M_q$ 草稿（Theorem 3.11）。
3. **Draft 品質**：$M_q$ 需與 $M_p$ **同架構族、同 tokenizer、同任務分佈**；跨模態或跨任務未驗證。
4. **硬體年代**：**單顆 TPU-v4**、T5X——2026 GPU 叢集需重測。
5. **不要回填**：vLLM、TensorRT-LLM、GPTQ、Medusa、EAGLE、FlashAttention 的 benchmark **不屬本 PDF**。
6. **與對齊／CV 分開**：InstructGPT 勝率、WMT BLEU（Transformer）、YOLO mAP **不能** 寫進 Table 2。

## 工程判斷與不適用條件 / Engineering decision and when not to use it

**何時借用本篇？** 當 **(a)** 你必須保留 $M_p$ 的 **確切取樣分佈**，**(b)** 解碼受 **記憶體頻寬** 限制而算力有餘，**(c)** 有 **同族小 checkpoint** 可作 $M_q$，且延遲是產品指標（呼應 [YOLO](/paper-reading/38-yolo-you-only-look-once/) 把成本放上表）。

**何時不要照搬？**

- 可以接受 **近似分佈**（蒸餾、量化）且更在意 **記憶體佔用**——走不同路線。
- **沒有合適 $M_q$** 或 $\alpha$ 估計過低。
- GPU **已滿載**，無法平行多路 $M_p$。
- 把 **3.4X EnDe** 寫進 2026 任意 LLM API 的 p99 延遲 SLA。
- 混淆 **Medusa/EAGLE 學習式 draft** 與本篇 **rejection-sampling 無損契約**。

> **花花的判斷**
>
> 從 YOLO 帶走「延遲是一等指標」；從 InstructGPT 帶走「程序加在凍結架構上」；從 Speculative Decoding 多帶一條——**無損是 rejection sampling 換來的，T5X 2X–3X 是 2023 實驗契約，不是 2026 serving 產品保固書。**

## Artifact 與可重現性 / Artifacts and reproducibility

截至 2026-08-28：

- **論文**：[arXiv abs](https://arxiv.org/abs/2211.17192)、[PDF v2](https://arxiv.org/pdf/2211.17192)、[ICML 2023 proceedings](https://proceedings.mlr.press/v202/leviathan23a.html) 可讀。
- **程式**：論文實作於 **Google T5X 內部管線**（Section 4.1）；**未**釋出獨立開源 repo 一鍵復現 Table 2。後續社群實作（如 2023 獨立 speculative sampling 工作）為 downstream ports。
- **模型**：T5 v1.1 checkpoint 可從公開 T5 生態取得；T5-XXL 11B 需相應資源。

最小有用 reproduction：在 **小 GPT/T5** 上實作 Algorithm 1 一輪，量測 **接受長度 $n$ 的分佈** 與 **單步 $M_p$ 平行 forward 是否可行**——驗證機制，不是復現 3.4X。

## 三個記憶點 / Three things to remember

1. **技術想法**：$M_q$ 打草稿、$M_p$ 平行驗證、**speculative sampling** 保證 **與 $M_p$ 相同分佈**；控制點是 **無損推論加速**，不是新架構。
2. **證據**：Table 2——T5-XXL + T5-small，EnDe **3.4X/2.6X**、CNNDM **3.1X/2.3X**；Figure 2 與 Theorem 3.8 解釋 $\alpha,\gamma,c$ 權衡。
3. **邊界**：需 draft + 並行算力；**不是** GPTQ/vLLM/Medusa；AlexNet→…→InstructGPT→**Speculative Decoding** 是 foundations 脊椎：CV→序列轉換→對齊→**推論效率**。

## 延伸閱讀

若尚未讀過對齊節點，回到 [Transformer](/paper-reading/39-attention-is-all-you-need/) 與 [InstructGPT](/paper-reading/40-instructgpt-human-feedback/)。讀法見 [三遍掃描法](/blog/08-efficient-paper-reading-three-pass/)。若要對照 **把延遲寫進證據表** 的 CV 類比，讀 [YOLO](/paper-reading/38-yolo-you-only-look-once/)。GPTQ、FlashAttention、vLLM、Medusa、EAGLE 葉子刻意不展開。

## Primary sources

- [Leviathan et al., “Fast Inference from Transformers via Speculative Decoding,” ICML 2023 / arXiv:2211.17192 v2](https://arxiv.org/abs/2211.17192)
- [ICML 2023 proceedings entry](https://proceedings.mlr.press/v202/leviathan23a.html)
- [DOI 10.48550/arXiv.2211.17192](https://doi.org/10.48550/arXiv.2211.17192)
