---
title: "AlexNet（下）：把可訓練化配方拆成可驗證的設計"
description: "從 Figure 1–3、Sections 3–6 重讀 ReLU、多 GPU、overlapping pooling、資料增強與 dropout 的證據。"
pubDate: 2026-03-19
updatedDate: 2026-08-24
tldr:
  - "AlexNet 的貢獻是架構與訓練系統的組合：ReLU、兩 GPU 切分、augmentation、dropout 與手動 learning-rate schedule。"
  - "論文有元件比較，但沒有完整 factorial ablation；不要把所有設計都當作今日預設。"
audience:
  - "想將經典 CNN 訓練細節轉為可測試工程假設的實作者。"
  - "需要辨識歷史硬體限制與一般性原理差異的讀者。"
tags: ["深度學習", "AlexNet", "ImageNet", "卷積神經網路", "論文精讀", "Computer Vision"]
image: "/paperReading/01-alexnet-paper-reading-part-1/paper-title.webp"
showToc: true
topics:
  - computer-vision-foundations
field: "CV"
difficulty: "intermediate"
paper:
  title: "ImageNet Classification with Deep Convolutional Neural Networks"
  authors:
    - "Alex Krizhevsky"
    - "Ilya Sutskever"
    - "Geoffrey E. Hinton"
  year: 2012
  venue: "NeurIPS 2012"
  links:
    pdf: "https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf"
    code: "https://github.com/BVLC/caffe/tree/master/models/bvlc_alexnet"
series:
  id: "alexnet"
  title: "AlexNet 精讀"
  part: 2
  totalParts: 2
---

## 90 秒地圖 / The paper in 90 seconds

- **問題**：60M-parameter CNN 即使有 1.2M images 仍會過擬合；也需要把訓練 recipe 與 competition result 分開解讀。
- **核心想法**：以 random crop/flip、RGB PCA lighting jitter 與 dropout 擴增或正規化有效訓練分布，再用 SGD、momentum、weight decay 和 learning-rate schedule 讓 Part 1 的架構收斂。
- **最強證據**：color augmentation 讓 top-1 error 降超過 1%，overlapping pooling 降 0.4/0.3 points；最終 ILSVRC-2010 37.5/17.0，2012 top-5 15.3（Section 4–6、Table 1）。
- **邊界**：這些 ablation 多在當年的 architecture/data/compute 組合；不代表每個 modern vision model 都需要 ten-crop、LRN 或相同 learning-rate heuristic。

## 先前方法為何不足 / Why the previous approach is insufficient

Part 1 的容量若只擬合固定中心裁切，很容易記住訓練影像；純 ensemble 又太昂貴。dropout 提供共享權重的近似 ensemble，而 augmentation 將 label-preserving 變換帶進訓練；這篇聚焦泛化與 optimization recipe，不重複介紹卷積架構（Section 4–5）。

## 核心直覺 / Core intuition and method

random 224×224 crop 與 horizontal flip 改變物體位置；PCA color jitter 改變照明但保留類別；dropout 以 0.5 機率關閉 hidden unit，使它們不能固定共適應。SGD update 將 loss gradient、0.9 momentum 與 $5\times10^{-4}$ weight decay 合併；當 validation error 停滯，learning rate 除以 10（Section 4.1–5）。

![AlexNet Figure 1：ReLU 與 tanh 在四層 CIFAR-10 CNN 的 training-error 曲線。](/paperReading/02-alexnet-paper-reading-part-2/fig1-relu-vs-tanh.webp)

*Figure 1，論文 Section 3.1 的 optimization diagnostic：ReLU 曲線較快到達 25% training error，但這是特定四層 CIFAR-10 network 的訓練速度證據，不是 ImageNet accuracy 的直接 ablation。[原始 Figure 1 來源](https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf#page=4)。這張圖取自 NeurIPS 2012 proceedings；版權仍屬作者／出版方，本文保留來源，作學術評論用途，未主張其為 CC BY 授權。*

## 逐步例子 / Worked example

同一張狗的訓練圖，這一輪可能取左上 224×224 crop 並翻轉，下一輪取不同 crop 與 RGB jitter；網路須學到兩者仍是狗。fully connected hidden unit 在某輪被 dropout，迫使其他 feature 也能支援分類。推論時十個 crop 的 softmax 平均，交換推論成本換取較穩定預測；若物體只在被裁掉的位置，這些 augmentation 仍可能失敗。此為 Section 4 的機制例子。

## 如何讀實驗 / Evidence, controls, and limits

**Section 4.1** 的 2048 倍是變換組合數，非獨立新樣本數。**Section 3.4、4.1 與 Figure 1** 的個別差異回答不同問題：pooling、nonlinearity、color jitter 不能加總成最終 error improvement。**Table 1 / Section 6** 對比 ILSVRC-2010 的整體結果；2012 test labels 不公開且 competition setting 不同，15.3% 不是同一張表的直接 ablation。

## Artifact 與採用判斷 / Artifacts and engineering decision

截至 **2026-08-09**，原 cuda-convnet endpoint 不可作為可跑 artifact；可核讀的 primary source 是 NeurIPS PDF。可移植的是「以 validation 驅動 schedule、先量泛化落差、將每項 regularization 與 compute 成本獨立評估」；不適合把年代特定 hyperparameter 或十裁切原封不動移到現代 pipeline。

## 三個記憶點 / Three things to remember

1. Part 2 的問題是讓大模型泛化並收斂，不是再增加架構深度。
2. augmentation、dropout 與 training schedule 是相互作用的 recipe，個別 ablation 不可直接相加。
3. AlexNet 的勝利是完整系統成績；現代採用應重新量測成本與資料條件。

## 讀者問題與結論

如果要從 AlexNet 借一件事來做工程，是哪一件？答案不是複製 11×11 convolution 或 LRN；而是把「能否訓練、能否容納、能否抗 overfitting」分成可量測的假設。本文接續[上篇](/paper-reading/01-alexnet-paper-reading-part-1/)，完整講方法與訓練，但仍以原論文的證據範圍為限。

## Evidence Map：哪些設計有什麼證據

- **論文直接支持**：Section 3.1、Figure 1 支持 ReLU 在特定四層 CIFAR-10 network 加速收斂；Section 3.2–3.4 報告多 GPU、LRN、overlapping pooling 的個別誤差差值。
- **作者主張**：Figure 2 的八個有權重 layer 與 Section 4–5 的 augmentation/dropout/SGD 配方，使大型模型可訓練。
- **未證明**：元件數字不是全 factorial ablation；也未比較 BatchNorm、Adam、mixed precision 或現代資料增強。
- **Bloss0m engineering judgment**：把每個 historical trick 做成有 baseline、固定 budget 的實驗，才比照抄更可靠。

## 方法骨架

1. 將 256 縮放影像隨機裁成 224×224，水平翻轉並加 RGB PCA colour perturbation（Section 4.1）。
2. 用五個 convolution、三個 fully connected layer 與 1000-way softmax；每個 learned layer 後用 ReLU（Figure 2、Section 3.5）。
3. 以兩張 GPU 分攤 kernels，只在指定 layer 交換資料（Section 3.2）。
4. 對前兩個 fully connected layer 用 dropout，訓練以 mini-batch SGD 更新（Section 4.2、Section 5）。

## 架構與訓練細節

Figure 2 的第一層是 96 個 11×11×3 kernel、stride 4；第二至五層與兩個 4096-unit fully connected layer 的連接細節在 Section 3.5。這不是單一 GPU 的抽象「AlexNet」：第二、四、五個 convolution layer 有局部 GPU 連接，反映記憶體與溝通折衷。

Section 5 的 **compute/training** 設定是 batch size 128、momentum 0.9、weight decay 0.0005、初始 learning rate 0.01；validation error 停止改善時將 learning rate 除以十，總約 90 epochs。兩張 GTX 580 3GB 訓練約 5–6 天。這些是可重跑的起點，不是硬體與資料都變了之後的最優 hyperparameter。

## 實驗、消融與失敗訊號

論文的 diagnostic evidence 比常被引用的架構更有用：

- **Figure 1 / Section 3.1**：ReLU 到 25% training error 快 tanh 六倍，卻只在 CIFAR-10 四層網路測試；不可直接換算 ImageNet accuracy gain。
- **Section 3.2**：兩 GPU 模式相對較小的單 GPU network，top-1/top-5 error 降 1.7/1.2 points；腳註承認比較對單 GPU 有利，因其最後 conv/FC 並未完全減半。
- **Section 3.3–3.4**：LRN 報告降 1.4/1.2 points；overlapping pooling 報告降 0.4/0.3 points。這是 component ablation，不是獨立、可加總的因果效果。
- **Section 4.1–4.2**：colour PCA 讓 top-1 error 降逾 1%，而沒有 dropout 則出現 substantial overfitting；dropout 大約使收斂 iterations 加倍。這正是 accuracy、regularization 與訓練成本的 trade-off。

Table 1、Table 2 的 benchmark 結果見上篇；本篇要避免把 training loss 改善誤讀成所有下游 metric 的改善。

## 逐層讀 Figure 2：形狀、連接與歷史包袱

Figure 2 與 Section 3.5 讓讀者可從輸入到分類逐層核對：224×224×3 先經 96 個 11×11、stride 4 filter；第二層是 256 個 5×5×48；第三層 384 個 3×3×256；第四、五層各有 384/256 個 3×3×192 filter，最後接兩層各 4,096 units 的 fully connected layer 與 1,000-way softmax。圖中還列出各層 neuron counts（從 253,440 到 1,000），這是理解 activation memory 而非只背「60M parameters」的入口。

第二、四、五層只連到同 GPU 的前層 feature maps，第三層與 fully connected layer 則跨兩 GPU 連接。這個 pattern 不應被神化成表示學習原理：Section 3.2 明確將其動機放在 GTX 580 的 3GB memory 與跨 GPU communication。今天用 data parallel 或不同 accelerator 時，可先測全連接與切分各自的 memory、throughput、accuracy；不存在由 2012 圖直接推出的通用最佳 split。

LRN 的參數也不應只稱「normalization」。Section 3.3 使用 k=2、n=5、α=10^-4、β=0.75，在 ReLU 後的指定層操作；它更接近 brightness normalization，作者沒有減去 mean activity。這一點使它與現代 batch/layer normalization 的目的與統計行為不可互換。若現代實驗移除 LRN，應報告是否換成其他 normalization，而非將差異都歸因於模型年代。

## 訓練與 regularization 的交互

Section 4.1 的 random 224 crop 加 mirror 理論上為每張 256×256 訓練影像產生 2,048 個位置/鏡像組合，但這些樣本高度相依，不能當成 2,048 倍獨立資料。測試時四角加中心、各自鏡像的十個 crop average，改善 prediction 的代價是十次前向傳播。色彩 PCA 每次對同一影像的所有 pixel 共用一次抽樣 α，目的在近似 illumination invariance；它不是任意 pixel noise。

dropout 以 0.5 機率將 hidden neuron output 設零，test 時使用所有 neuron 並將 output 乘 0.5。Section 4.2 把它描述為昂貴 ensemble 的近似，並說沒有它會 substantial overfitting、迭代數約加倍。與 weight decay 的關係也值得保留：Section 5 說 0.0005 weight decay 不只 regularize，還降低 training error。這是作者在此 setup 的 observation，不等於所有 optimizer 下都會有相同 interaction。

## 從原配方到現代重現：哪些要固定、哪些要重新選

要測試論文主張，第一輪應固定與原文最相關的比較單位：同一資料切分、224 crop、top-1/top-5 metric、SGD family、明確的 train/test crop policy，並記錄每個 epoch 的 validation error。第二輪才改一個因素，例如 ReLU 對 tanh、dropout on/off、overlap 與 non-overlap pooling、或 single/ten crop。每輪同時報 accuracy、wall-clock、peak memory、每張 image latency；只報最佳 accuracy 無法回答原論文「使大網路可實驗」的工程問題。

不應把原文的每個數字硬移植。兩 GPU 切分的目標是 memory feasibility；在單張現代 GPU 裝得下時，保留它可能只增加 implementation complexity。十 crop 的目標是 test-time ensemble；在服務路徑，它的十倍 inference work 可能違反 latency budget。LRN 的小幅 error gain也要與它的 kernel、記憶體存取、替代 normalization 一起評估。相反地，ReLU、資料增強與正規化的核心問題仍可保留：在固定資料與 budget 下，它們是否改善 optimization 或 generalization？

reproduction report 應區分三個層級。**功能重建**指 layers 能跑、輸出 shape 符合 Figure 2；**協定重建**指資料切分、crop、metric、epoch schedule 一致；**數值重建**才是接近 Table 1/2 error。前兩者通常可以完成，第三者因原 CUDA code、資料版本、硬體非決定性和未公開 test labels 而有缺口。將這些層級寫清楚，比宣告「重現 AlexNet」更誠實也更可用。

還有一個常被忽略的時間尺度：CPU 在 GPU 訓練前一個 batch 時產生 augmentation，作者因此稱兩種 augmentation 實際上幾乎不額外花 compute（Section 4.1）。這是 pipeline overlap 的觀察，不是 augmentation 免費的普遍定理；I/O、decoder、worker 數、GPU utilization 與新硬體都會改變瓶頸。現代重現至少要分開記錄 data-loader wait、forward/backward、validation ten-crop 和 checkpoint I/O，否則「五到六天」只會成為無法比較的歷史數字。

最後，作者的結果包含 model selection 的風險：learning rate 由 validation error 手動調整，LRN constants 也由 validation set 決定。任何現代 benchmark 若用同一 validation 集反覆挑 architecture、augmentation、seed 和 crop，卻只報一次 test result，會有 selection bias。實務上應事先固定 search budget、保留 test set、並報多 seed 或 confidence interval；這些是原論文年代未完整要求、但不應被今天忽略的工程改善。

把 Part 2 收束成一句話：AlexNet 的可遷移貢獻不是一份不能改的 layer list，而是一種實驗態度——每個能讓模型變大、變快或較不 overfit 的選擇，都要連回明確資料、固定 baseline、量化 metric 與實際 compute。當這四項被記錄，現代工程師才可以安全地替換過時元件，而不失去原論文的問題意識。

若只需要一個小型教學 baseline，甚至可刻意省略 LRN、雙 GPU 與十 crop，但必須在實驗紀錄寫明差異；這不是背離原文，而是把原文的硬體限制與今日目標區分開。可比性來自透明的協定，而不是相同的模型名稱。

同理，任何替代元件都應有自己的 ablation 與失敗樣本紀錄。

這是可維護實驗的最小條件。

## 限制與證據邊界

LRN、跨 GPU group connection 與 10-crop inference 都有強烈時代性；論文未提供現代 normalisation、optimizer、資料增強的 head-to-head **baseline**。固定 validation-guided schedule 也可能在不同 seed、資料版本或 distributed training 下失效。沒有完整 code、seed、checkpoint 與原 preprocessing artifact 時，逐位數對齊是不支持的解讀。

## Artifact 與可重現性（截至 2026-08-09）

可存取的 [BVLC Caffe AlexNet definition](https://github.com/BVLC/caffe/tree/master/models/bvlc_alexnet) 有模型設定與後續權重工作流，屬 **usable partial artifact**；它不是原作者 CUDA-convnet 的完整 release。原論文腳註的 Google Code repository 不提供可驗證的完整訓練 release；ImageNet 授權資料與 ILSVRC test labels 亦非開放附檔。故「官方完整可復現」狀態是 **missing/unavailable**。

實作時可先以現代 framework 重建 Figure 2 等效層序，再分別開關 augmentation、dropout 與 crop policy，報告 target dataset 的 accuracy、latency、memory 與 seed variance；不要將 Caffe checkpoint 直接當成原始實驗的證明。

## 工程判斷：何時使用、何時不用

適合在受限 GPU memory、需要建立 CNN training baseline 時，將此配方拆成逐項 ablation。**不適用**於把 LRN、雙 GPU 分組或 10-crop 直接帶入 production；如果記憶體、延遲或能源是約束，先比較當代 backbone 與訓練/serve cost。

## Primary Sources

- [AlexNet 完整論文](https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf)：Figure 1–3，Sections 3–6，Table 1–2。
- [BVLC Caffe AlexNet model definition](https://github.com/BVLC/caffe/tree/master/models/bvlc_alexnet)：可存取但非原始完整 artifact。
