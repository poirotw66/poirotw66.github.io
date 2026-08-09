---
title: "AlexNet（上）：先用證據讀懂它為何改變 ImageNet"
description: "以論文可定位證據重讀 AlexNet 的問題、評測與歷史性結果：它證明了什麼，也沒有證明什麼。"
pubDate: 2026-03-18
updatedDate: 2026-08-09
tldr:
  - "AlexNet 在 ILSVRC-2010 報告 37.5% top-1、17.0% top-5 error；2012 競賽版本的 top-5 error 為 15.3%。"
  - "這篇先讀問題、資料、比較與證據邊界；下篇才拆可訓練化設計與訓練配方。"
audience:
  - "想以原始證據理解 CNN 歷史轉折的 ML 實作者。"
  - "需要判斷舊論文結果能否外推到現代系統的工程師。"
tags: ["深度學習", "AlexNet", "ImageNet", "卷積神經網路", "論文精讀", "Computer Vision"]
image: "/paperReading/01-alexnet-paper-reading-part-1/paper-title.webp"
showToc: true
field: "CV"
difficulty: "intro"
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
series:
  id: "alexnet"
  title: "AlexNet 精讀"
  part: 1
  totalParts: 2
---

## 讀者問題與結論

AlexNet 真正改變了什麼？不是「CNN 從此必勝」，而是在大型標註資料與 GPU 可用的條件下，一個可端到端訓練的大型 CNN 能把 ImageNet 分類誤差明顯壓過當時的手工特徵系統。論文是 NeurIPS 2012 正式發表，不是今天的模型卡或可直接部署的規格書。

本篇保留 legacy Part 1 路由，負責問題、評測與結果；[下篇](/paper-reading/02-alexnet-paper-reading-part-2/) 負責架構、正規化、資料增強與可重現邊界。

## Evidence Map：證據、主張與推論分開

- **論文直接支持**：Section 2 定義 ILSVRC 資料切分與 top-1/top-5 error；Table 1、Table 2 是與當時方法的受控比較；Figure 1 是 ReLU 訓練速度的小型診斷。
- **作者主張**：摘要稱結果遠優於先前 state of the art，並把可擴張的資料、GPU 與深網路列為關鍵。
- **未被證明**：Table 1 並沒有比較現代 transformer、現代 augmentation 或跨資料集遷移；它也不能單獨證明「深度」是唯一原因。
- **Bloss0m engineering judgment**：把 AlexNet 當成「系統配方」而不是孤立架構，才是可遷移的讀法。

## 問題、資料與評測協定

閱讀這篇的最小方法骨架是：

1. 以固定 ILSVRC split 將影像送進大型 CNN，取得類別機率。
2. 以 top-1/top-5 error 對照同一測試集上的既有方法，再把訓練可行性拆到下篇檢查。

Section 2 說明 ImageNet 全集有逾 1,500 萬張高解析影像與約 22,000 類；本文實驗使用 ILSVRC 子集：1,000 類、約 120 萬訓練、50,000 validation、150,000 test 影像。輸入先把短邊縮至 256，再使用 224×224 crop，並只做每像素 training-set mean subtraction（Section 2）。

**metric** 是 error rate：正解不在最高機率類別即 top-1 error；不在前五類即 top-5 error。這個定義很重要：它衡量單張封閉集合分類，不衡量開放世界辨識、校準、延遲或安全性。

> **花花的一句話**
>
> 經典成績要先問「在哪個資料切分、用什麼指標」，再談模型是否偉大。

## 實驗結果：巨大差距，但要保留比較條件

Table 1 在 ILSVRC-2010 test set 比較三種方法：稀疏編碼為 47.1%/28.2%，SIFT + Fisher Vectors 為 45.7%/25.7%，CNN 為 **37.5%/17.0%**（top-1/top-5 error）。這是同一 benchmark 與 metric 下的主要證據。

Table 2 報告 ILSVRC-2012 competition：提交的 variant 得到 **15.3% top-5 error**，次名為 26.2%。不要把 15.3% 與 Table 1 的 17.0% 混成同一次固定設定：論文本身明說兩者對應不同競賽版本與評測情境。

結果的 **baseline** 是當年特徵工程與集成方法，而非「沒有模型」。因此合理結論是「此配方在該基準大幅領先當時公開方法」，不是「任何 CNN 在任何影像任務都更好」。

## 診斷與失敗訊號

Figure 1 的 ablation-like 診斷在 CIFAR-10 上：四層 ReLU CNN 到 25% training error 比同等 tanh CNN 快六倍；作者也限定效果量會隨架構而變。Section 1 另稱移除任一 convolution layer 會變差，但沒有完整控制深度、寬度、參數量與訓練預算，故這不是「只要更深一定更準」的因果證明。

Figure 2 展示兩張 GTX 580 的切分；它是當時 3GB GPU memory 的工程限制。Section 1 報告訓練需 5–6 天、兩張 GTX 580 3GB，這是必須寫進實驗設定的 **compute**，也提醒讀者今日重跑不會得到相同 throughput 或數值。

## 從比較表讀出什麼、讀不出什麼

Table 1 的三列都是 test error，不是 validation error；在同一 2010 test split 下，CNN 相對 SIFT+FVs 的 top-1 絕對少 8.2 points、top-5 少 8.7 points。這是比單看「相對百分比」更穩妥的讀法。該表也只列兩個當時公開比較方法，沒有 error bar、seed variation、訓練時間或每張圖的推理成本；因此不能由表推算統計顯著性，也不能推算一個現代服務的成本。

Section 2 的 150,000 test labels只在 ILSVRC-2010 可取得，作者說多數實驗放在這一版；2012 test labels 不可取得，competition 結果屬提交系統的外部評測。這就是 Table 1 與 Table 2 必須分開讀的原因：前者允許作者完整分析與比較，後者是競賽 score，不是可自行重算的 test set。若文章、簡報只引 15.3%，卻不交代它是 2012 submission 的 top-5，就混掉了分母與 protocol。

資料預處理的樸素也有邊界。短邊 256、central crop 的記述描述一般輸入準備；訓練時的 random crop/flip 與測試十個 crop 在 Section 4.1。把所有數字都寫成「256 input」或「224 input」都不完整：256 是 resize canvas，224 是模型實際 crop。這種 shape distinction 看似瑣碎，卻會改變 receptive field、預處理成本與 reproduction script 的結果。

## Part 1 的工程檢查清單

把這個歷史結果搬進新專案前，先回答四個可驗證問題：

1. **資料分母**：目標是固定 1,000 類 closed-set classification，還是有未知類/多標籤/長尾？後三者不由 ILSVRC error 支持。
2. **評測**：top-1、top-5、single crop、ten crop 各自要報告；不要以 ten-crop 成績冒充低延遲 single-image path。
3. **比較**：與可用的當代 baseline 在相同資料、augmentation、pretraining 與 compute budget 下比較，而非重複 2012 表格。
4. **失敗樣本**：補上易混類、低品質影像、罕見類與 confidence 分布；原論文的分類 score 沒有這些診斷。

## 將 2012 的敘事校正為今日可用的結論

作者在 Section 1 的論點有三層，容易在回顧時被混成一句口號。第一層是資料：1.2M labels 足以訓練當時大到單卡裝不下的模型；第二層是算力：高度最佳化的 2D convolution 與 GPU 讓試驗週期可接受；第三層才是模型：CNN 的 local connectivity、weight sharing 對自然影像提供了有用的 inductive bias。這三者是聯合條件。只保留第三層會誤以為換一個小資料集也會重演表格差距；只保留前兩層又會忽略 CNN 的結構先驗。

同樣地，abstract 的 60 million parameters 與 650,000 neurons 是規模描述，並非 capacity 的唯一尺度。parameter 多半在第一個 fully connected layer，Section 3.2 的腳註正因此說明一 GPU 對照組的最後 convolution/fully connected layer 沒有完全縮小。這也解釋為何「兩 GPU 比一 GPU」不是純 hardware speed comparison，而混進了可容納的模型尺寸與 connectivity pattern。Part 2 會保留這個對照偏差，避免把 1.7/1.2 point 當作平行化本身的因果效果。

Section 1 說移掉任一 convolution layer 會變差，並說 network size 主要受 GPU memory 與可忍受 training time 限制。這是合理的設計壓力敘述，卻不是 scaling law。論文沒有掃過資料量、width、depth、optimizer 或預訓練的交互；也沒有測「同參數量但不同深度」的組。因此可以保留的現代原則是：當 capacity 擴大時，資料、regularization、memory 與實驗週期必須一起評估；不能保留的結論是「較深永遠較好」。

最後，ImageNet label space 本身是評測裝置。top-5 把五個候選都視為正確候選集合，適合競賽分類，但不告訴我們模型在類外影像上是否會自信地誤判，也不告訴我們哪些視覺 shortcut 造成成功。原文的 qualitative top-5 與 nearest-neighbour visualizations 可以啟發 representation 的問題，但不是對因果語義理解的測試。今日若引用 AlexNet 的「representation learning」影響，應把這段歷史影響與論文可量化的 classification evidence 分開。

## 建議的重讀順序

第一次重讀不必先背 layer size。先看 abstract，確認任務、60M parameters、37.5/17.0 與 15.3/26.2 這兩組不能混用的數字；再讀 Section 2，把資料切分、固定 256 resize 與 top-k 定義寫進筆記。接著直接核對 Table 1、Table 2：每一個百分比都要有 dataset version、test/competition、top-1 或 top-5 的標籤。這一步能避免歷史論文最常見的「只剩一個漂亮數字」問題。

第二次才讀 Section 1 的 contribution list 和 Figure 1–2，將「可訓練」拆成非飽和 activation、GPU 實作、regularization、資料增強、模型容量等候選原因。不要在此就替它們排序；論文有些提供數字，有些只提供作者觀察，且設計並非完全控制。最後回到 Section 6 Discussion：作者預期更快 GPU、更大資料和更長訓練會改進結果，也提到 video 的 temporal information；這是當時研究方向的陳述，不是已完成的實驗。

這個順序也讓兩篇系列互補而非重複：本篇產出一張「聲稱了什麼、在哪個分母、可否外推」的 evidence ledger；下篇產出「哪個元件、什麼設定、何種成本/偏差」的 implementation ledger。兩張表都完成後，讀者才有足夠資料決定是否進入自己的 reproduction，而不是把經典地位當作工程需求。

也要保留作者對 benchmark 的謙抑訊號。Section 1 說 CNN 的局部結構對影像的 stationarity 與 pixel locality 作了強、且「mostly correct」的假設；這既是效率來源，也是外推條件。若目標影像來自醫療、遙測、壓縮串流或合成介面，統計結構、label 定義與錯誤代價可能與 ImageNet 相差很大。把 AlexNet 的結果視為一個有界的實證案例，正比把它視為不變定律更能尊重這段歷史。

因此，本篇最終 verdict 不是要讀者選擇「崇拜或否定」AlexNet，而是保留一條可稽核鏈：資料切分 → 模型輸出 → top-k 指標 → 同期 baseline → 計算條件 → 外推限制。這條鏈若在自己的專案仍成立，才值得把下一篇的實作配方拿來測；若任一環不同，經典論文仍能提供假設，卻不能代替新的實驗。

這也是為何讀筆記時應保留論文版本與日期：我們此處引用的是 NeurIPS 2012 定稿的文字與表格，而非後來 framework 對「AlexNet」名稱所做的簡化實作。來源身份清楚，讀者才能辨認哪些是原作者證據、哪些是後續社群慣例。

在引用時，也應同時附上原表或本篇的 anchor，而不是只複製分數。

這樣才能讓後續的審核者重新走回相同的證據鏈，核對結論是否仍然成立。

可追溯。

## 限制與證據邊界

- 論文沒有報告跨域 transfer、長尾類別公平性、機率 calibration、碳成本或實際服務 latency。
- ImageNet 的網路蒐集與 crowdsourcing label 是資料集條件；結果不能消除資料偏差。
- top-5 error 的改善不等於下游偵測、分割或人機決策的改善。

## Artifact 與可重現性（截至 2026-08-09）

論文腳註指向 `cuda-convnet`，但原 Google Code 專案不是可用的完整重現端點；不可把它稱為可下載的官方 release。可存取的 [BVLC Caffe AlexNet model definition](https://github.com/BVLC/caffe/tree/master/models/bvlc_alexnet) 是後來實作，含模型設定，**不是**論文兩 GPU 訓練程式、原始資料處理與全部 artifact。ImageNet/ILSVRC 資料與競賽 test labels 也不是隨文附帶的公開資料包。

若要復現，先固定一個現代 framework、已授權 ImageNet split、metric 與多 crop inference，再把結果標成「AlexNet-like reproduction」；不要宣稱重現 2012 submission。

## 工程判斷：何時使用、何時不用

適合用這篇做容量、資料與硬體共同決定可行性的教材，或用作小型 CNN baseline 的歷史座標。**不適用**於要選擇現代視覺 backbone、比較效能/成本、或需要強 robustness 與 calibration 的決策；那些情況應直接用目標資料與當代模型做驗證。

## Primary Sources

- [Krizhevsky、Sutskever、Hinton，完整論文（NeurIPS 2012）](https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf)：Section 1–2、Figure 1–2、Table 1–2。
- [BVLC Caffe AlexNet model definition](https://github.com/BVLC/caffe/tree/master/models/bvlc_alexnet)：後續可存取 artifact 的範圍。
