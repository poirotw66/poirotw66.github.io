---
title: "BM25 在大規模語料中勝出：RAG 範式的擴展研究"
description: "深讀 Wang 等人的 arXiv v3 研究：在固定問題、證據與對抗文件的 28 層企業型語料梯度上，BM25 如何跨過約 1,000 萬語料 token 的交叉點，以及為什麼 agent 應該接在全域候選排序之後。"
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "這不是 BM25 在所有場景都贏，而是研究中的準確率—成本曲線在約 1,000 萬語料 token 之後轉向 BM25。"
  - "在完整 511,959 份文件的配對重掃中，Agent+BM25 得分 69.4，原始檔案 agent 得分 36.9；前者每題約 101K token，後者約 895K。"
  - "圖索引的未完成 tier 不等於答案失敗；這篇論文最可用的工程結論是先做全域候選發現，再把 agentic reasoning 用在縮小後的證據集合。"
audience:
  - "正在設計企業搜尋、RAG 或知識助理的 AI／平台工程師"
  - "需要同時評估檢索品質、延遲、token 成本與索引建置成本的技術負責人"
tags: ["Paper Reading", "RAG", "Information Retrieval", "Enterprise AI", "Benchmark"]
image: "/paperReading/13-bm25-wins-at-scale/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
paper:
  title: "BM25 Wins at Scale: A Scaling Study of Retrieval-Augmented Generation Paradigms"
  authors:
    - "Pengyu Wang"
    - "Benfeng Xu"
    - "Shaohan Wang"
    - "Mingxuan Du"
    - "Xin Zeng"
    - "Huarui Wu"
    - "Lei Zhang"
    - "Licheng Zhang"
  year: 2026
  venue: "arXiv 2607.26497 v3 (revised 2026-07-31; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2607.26497v3"
    arxiv: "https://arxiv.org/abs/2607.26497"
series:
  id: "retrieval-systems"
  title: "Retrieval Systems 精讀"
  part: 2
  totalParts: 3
---

## 90 秒地圖 / The paper in 90 seconds

- **問題**：RAG paradigm 常只在單一 corpus size 比較，無法看見 accuracy、construction cost、query cost 與 latency 如何一起隨資料量變化。
- **核心想法**：以 28 個 nested corpus tiers（1,144 到 511,959 documents）固定 reader/judge 與 adversarial bedrock，比較 lexical、dense、graph、file-system agency；再以 retrieval-swap control 隔離 access substrate。
- **最強證據**：在 shared large tiers，作者報告 BM25 約在 10M corpus tokens 超過 raw file-system agency；matched 150-question resweep 中 Agent+BM25 69.4、raw-file agency 36.9（Section 5.1、Figure 4、Table 4）。
- **邊界**：EnterpriseRAG-Bench 是 fictional enterprise-shaped corpus、500 questions 和一個主 reader/judge；公開 executable benchmark/data artifact 未確認，不能轉寫成普遍「BM25 永遠贏」。

## 先前方法為何不足 / Why the previous approach is insufficient

固定小規模 benchmark 會掩蓋不同 paradigm 的 build/query cost curve；file browsing 也可能在小資料量看似合理，卻在 candidate discovery 上不隨 corpus 線性擴張。本文不是推翻 dense/graph，而是要求在同一 ladder 和同一 agent harness 上測 access layer（Section 1、Section 3）。

## 核心直覺 / Core intuition and method

BM25 用詞彙訊號快速做 global candidate discovery；agentic reasoning 應在已排序的少量證據上花 token，而不是替代第一層索引。retrieval-swap control 將同一 harness 接到不同 substrate，若分數改變才可較合理歸因給 access layer；仍無法把 fictional corpus 外推到你的 vocabulary 或 access policy（Figure 2、Section 4）。

## 逐步例子 / Worked example

客服要在 500K 份內部文件找一個版本化 policy。raw-file agent 從目錄探索、讀多個誘餌檔後才遇到答案；BM25 先依 policy 名稱、版本與例外語句取回候選，再讓同一 reader 檢查矛盾與回答。若問題用詞完全與文件不同或關係鏈跨多個實體，lexical candidate discovery 也可能失敗，需要 dense/graph 或 hybrid。此為工程解釋，不是 paper query。

## 如何讀實驗 / Evidence, controls, and limits

**Figure 4 / Section 4.4** 的 tier 曲線回答成本如何隨 corpus scale 變化，不是單一資料量的 ranking。**Section 5.1 / Table 4** 的 69.4 對 36.9 是 matched 150-question resweep，控制同一 harness、改變 retrieval substrate；它支持 access-layer swap，不是所有 agent loop 的無條件優勢。**Section 4.4、Appendix cost fits** 將 graph construction/query tokens/latency 加回決策；外推 cost 和 close-pair rank 都受 confidence bands、judge、fictional corpus 限制。

## Artifact 與採用判斷 / Artifacts and engineering decision

截至 **2026-08-09**，arXiv v3 與 TeX source 可讀；未發現可直接下載的 official executable benchmark、data 或 code endpoint，artifact 狀態為 **unknown/missing**。適合把 BM25 當成可量測的 large-corpus baseline，先與 dense/graph hybrid 作 query-slice canary；不適合在未量詞彙落差、index refresh、ACL filtering、p95 latency 前，宣稱它取代所有 retrieval。

## 三個記憶點 / Three things to remember

1. 本文的貢獻是 scale-and-cost control，而不是「BM25 神奇勝過一切」。
2. 全域候選發現與 agentic reasoning 是可分層的工作。
3. 資料量、詞彙、存取控制與 SLA 決定你該選 lexical、dense、graph 或 hybrid。

這篇文章只回答一個讀者問題：**當企業語料從幾千份文件長到幾十萬份時，誰應該負責全域候選發現，而 agentic reasoning 應該從哪裡開始？**

先給結論：在這個固定問題、固定證據與固定對抗文件的合成企業型語料上，沒有一個不受規模影響的絕對贏家。File-System Agent 在最小 tier 的點估計領先；約 1,000 萬語料 token 時，BM25 趕上並在後續已測量 tier 都領先。到完整 600.8M token 語料時，BM25 的 official combined score 是 50.5，File-System Agent 是 30.7，DenseRAG 是 29.9。這支持「先用全域排名找到候選，再讓 agent 閱讀與推理」的架構判斷，但不支持「BM25 永遠是最佳 retriever」。

> **花花的一句話**
>
> 大語料的第一個瓶頸不是 agent 會不會推理，而是它能不能先碰到正確的文件；把 agent 接到 BM25 的全域候選排序後面，通常比讓它在檔案樹裡逐步摸索更可控。

## 論文身分與閱讀範圍

Wang 等人的 **BM25 Wins at Scale: A Scaling Study of Retrieval-Augmented Generation Paradigms** 是 `arXiv:2607.26497v3`，v1 於 2026-07-29 提交，v3 於 2026-07-31 修訂。它是 arXiv preprint，沒有同儕審查或正式會議接受狀態；本文不把它寫成已接受的研究。主論文、HTML、PDF、TeX source 與 appendix 均可從 [arXiv record](https://arxiv.org/abs/2607.26497) 的 [HTML 版](https://arxiv.org/html/2607.26497v3)、[PDF](https://arxiv.org/pdf/2607.26497v3) 與 [TeX source archive](https://arxiv.org/src/2607.26497v3) 取得。

本文逐段閱讀了 Introduction、Related Work、Method、Experiment、Discussion、Conclusion，以及 Appendix B 的 corpus ladder、Appendix C 的 prompt／工具／共享設定、Appendix D/F 的圖表與完整 tier、Appendix G 的 matched controls、Appendix H 的 robustness、Appendix I 的失敗與停止條件、Appendix K 的 bootstrap intervals、Appendix L/M 的 artifact-to-claim map 與 artifact contents。

## 證據地圖：論文直接支持、作者宣稱與 Bloss0m 的工程推論

| 聲音 | 證據邊界 | 本文如何使用 |
| --- | --- | --- |
| **論文直接支持** | 28 個巢狀 EnterpriseRAG-Bench tiers、固定 bedrock、shared reader/judge、成本計量與 matched retrieval controls，產生文中報告的交叉點與分數。 | 把結果視為受該 corpus、workload、harness 與 budget 限定的證據；每一個量化主張都要回到對應 table 或 appendix。 |
| **作者／benchmark 維護者的宣稱** | 論文 Appendix L 列出看似內部的 `results/`、`scripts/` 路徑；EnterpriseRAG-Bench 另外說明公開資料與 evaluation tooling。 | 不把這些敘述延伸成 exact study run、prompt、deployment image 或全部輸出都可公開重現。 |
| **Bloss0m 的工程推論** | 「先全域排名，再讓 agent 在縮小的 evidence 上推理」是對 matched controls 的解讀，不是任何情境下都贏的定理。 | 把它當成待驗證假說，仍要在目標系統測 ACL filter、更新模式、題型、latency 與營運成本。 |

這個區分是刻意的：**論文直接支持**的是量測結果；**作者宣稱**的是 release 或詮釋；**Bloss0m 的工程推論**是仍須在本地驗證的決策規則。

## Method：把規模變成可比較的變因

這篇研究的關鍵不是再放一個固定大小的 RAG leaderboard，而是讓 corpus size 變動、其餘重要條件盡量固定。方法骨架可以寫成五步：

1. **建立固定 bedrock**：EnterpriseRAG-Bench 有 500 個問題、722 份 gold documents、326 個 traps、99 個 lures，另含兩個組織概覽 scaffold；去掉五個跨類別重複後，最小 tier 為 1,144 份文件。
2. **沿著 nested ladder 加背景文件**：同一個 source／noise-stratified 順序產生 28 個嚴格巢狀 tier，約每一階乘以 1.25，從 1,144 份、1.7M token 到 511,959 份、600.8M token。問題、相關文件與對抗文件留在 bedrock，只增加背景 corpus。
3. **比較七個 native pipeline**：BM25、DenseRAG、HippoRAG 2、MS-GraphRAG、LightRAG、LinearRAG，以及不建索引、在原始檔案樹中搜尋的 File-System Agent。這涵蓋 lexical、dense、graph-based 與 agentic retrieval 四個方向。
4. **固定 reader、切分與成本計量**：共享 reader 是 Qwen3.6-27B，temperature 0、thinking disabled，經 vLLM serving；共享 embedding model 是 Qwen3-Embedding-0.6B。適用時使用 1,200 tokenizer-token chunk、100-token overlap、top-5 chunks；File-System Agent 每題最多 80 次 LLM calls。建置 token、查詢 token、calls 與 idle server 上的 single-stream latency 分開計量。
5. **把 agency 與 substrate 拆開**：在相同 150 題的 bedrock／full-scale 配對重掃中，以 Agent+BM25 取代原始檔案搜尋工具，固定 model、harness、prompt、judge 與 80-call budget；第一次 BM25 search 由程式強制使用原問題，以確保回傳的 top-5 和 native BM25 相同。這讓 retrieval primitive 的變化可與 agent policy 分開觀察。

## 評測設定：分數到底在量什麼？

官方 combined score 先用 LLM judge 檢查回答是否與 gold answer 對齊，再逐一檢查 atomic answer facts 的 completeness；如果整體答案不正確，completeness 不會把它救回來。另有 answerable questions 的 document recall，以 retrieved document IDs 與 gold IDs 的 exact set overlap 計算。每個 method／question／tier 只跑一次，信賴區間以問題為單位做 10,000 次 bootstrap；建置與查詢 token、LLM calls、latency 則是成本軸。

這個設計仍依賴 judge，但論文做了兩個重要檢查：binary protocol 在九個共同尺度保留所有 family ranking；獨立 official judge 對 pooled alignment verdict 的 agreement 是 96.2%，各 cell 為 94.4–98.0%。因此接近的 pair 仍可能移動幾分，較大的 family separation 才是比較穩的訊號。

## Results：交叉點比「誰永遠最好」更重要

### 1. Main ladder：BM25 在約 10M token 後接手

[Table 1 的官方主結果](https://arxiv.org/html/2607.26497v3#S4.T1) 顯示，bedrock 的 File-System Agent 為 77.4，BM25 為 74.7，兩者 95% interval 分別為 73.9–80.8 與 71.4–77.9，重疊。這支持「最小規模沒有立即的 BM25 勝利」。但在約 10M corpus token 附近，兩條曲線交叉；完整 tier 上，BM25 50.5 對 File-System Agent 30.7、DenseRAG 29.9。圖方法的結果只列出實際完成的 tier：HippoRAG 2 到 131,876 份文件得分 41.0，MS-GraphRAG 到 8,750 份得分 38.4，LightRAG 到 2,254 份得分 42.5；破折號是未建成或未評估，不是零分。

![Figure 3：nested corpus ladder 上的 official combined score](https://arxiv.org/html/2607.26497v3/x3.png)

*圖 1（原文 Figure 3，§4.2）：官方 combined score 與 95% confidence bands；曲線在約 10M token 附近交叉，圖方法在各自最大可行 tier 結束。來源：[arXiv HTML Figure 3](https://arxiv.org/html/2607.26497v3#S4.F3)，圖像依 [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) 提供，保留作者與來源標示。*

這裡的「約 10M」要精確理解：Appendix D 說它是相鄰已測量 tier 的點估計排序改變後所做的 rounded regime marker，不是 fitted threshold，也不是統計顯著性邊界。這個措辭是論文證據的一部分，不能把它改寫成所有企業系統都應在 1,000 萬 token 切換的硬閾值。

### 2. Build cost：圖索引的問題先發生在部署之前

[Table 2 與 Figure 4](https://arxiv.org/html/2607.26497v3#S4.F4) 把建置成本和 corpus token 的 power-law fit 分開呈現。HippoRAG 2 以約線性的 (b=1.01) 外推到完整 corpus 約 2.9B generative tokens、約三個 single-instance days；MS-GraphRAG 外推約 7.9B token、約 50 instance-days；LightRAG 的 (b=1.36) 外推約 102B token、約四個 instance-years。這些是 fit 到 600.8M-token full corpus 的建置成本投影，不是完整實測的 wall-clock，也不是美元報價。

![Figure 4 左圖：construction token scaling](https://arxiv.org/html/2607.26497v3/x4.png)

*圖 2（原文 Figure 4 左圖，§4.4）：建置 token 與 fitted power laws；embedding-only builder 的 hollow marker 不應被讀成零 CPU 或零儲存成本。來源：[arXiv HTML Figure 4](https://arxiv.org/html/2607.26497v3#S4.F4)，圖像依 [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) 提供，保留作者與來源標示。*

論文也刻意保留 LinearRAG 這個對照：它沒有 generative build calls，卻仍需 local NER 與 embeddings；DenseRAG 完整 corpus 的 embedding token 是 659.4M。因此「build = 0」在本文語境只代表零 model-token 的生成式建置，不代表零計算、零儲存或零 indexing work。

### 3. Query cost：全域排名比逐步摸索更接近固定成本

BM25、DenseRAG、HippoRAG 2 的每題 query token 約為 5.8K、4.9K、6.5K，主要由共享 reader prompt 主導。File-System Agent 則從 bedrock 的 226K 增至 (N=21{,}614) 的 343K，分別約為 BM25 的 39 倍與 60 倍；在 (N=42{,}587) 時 median LLM calls 從 5 增到 8，budget exhaustion 到 (N=131{,}876) 是 15%，full scale 是 31%。作者另外指出，即使只看沒有耗盡 budget 的問題，準確率仍下滑，所以 collapse 不能只歸因於截斷。

這是「scale」對 agentic retrieval 的實質壓力：它的每次探索是 sequential policy，前幾步走錯就會讓後面的工具呼叫都在錯的局部目錄裡累積成本。BM25 的 inverted index 先完成 corpus-wide candidate ranking，再把固定大小的 evidence set 交給 reader；這是對機制的解釋，不是說 BM25 能解決所有 evidence synthesis。

### 4. Question type：BM25 的 headline 不應抹掉它的反例

[Figure 5](https://arxiv.org/html/2607.26497v3#S4.F5) 的右側在 (N=42{,}587) 展示 question-type slice。File-System Agent 在 intra-document、project-related、completeness 與 conflicting-information 題型領先 BM25；其中 completeness 是 56 對 27。BM25 在另外五種題型最佳或並列最佳，而 graph system 只在 miscellaneous 領先。not-found 的高分主要量到 abstention：one-shot reader 沒有支持證據時會拒答，iterative exploration 則可能做出無證據承諾。

![Figure 5 右圖：依問題類型的 official combined score](https://arxiv.org/html/2607.26497v3/x7.png)

*圖 3（原文 Figure 5 右圖，§4.5）：(N=42{,}587) 的 question-type slice；圖中標出各題型題數，且 MS-GraphRAG／LightRAG 在此 tier 無法完成建置。來源：[arXiv HTML Figure 5](https://arxiv.org/html/2607.26497v3#S4.F5)，圖像依 [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) 提供，保留作者與來源標示。*

這個 slice 很重要，因為它把「BM25 在大語料中領先」限制在 candidate discovery 與這個 benchmark 的題型分布。它沒有證明 lexical ranking 會取代需要多份文件整合、關係走訪或長距離結構化推理的所有方法。

## Matched controls：真正改善的是 discovery 還是 agent？

[Table 4](https://arxiv.org/html/2607.26497v3#S5.T4) 是全篇最值得帶回工程團隊的 control。它在同一批 150 題、bedrock 與 full corpus 兩個尺度上，把 raw file-tree search 換成 BM25 top-5 tool。full-scale 的同一個 rejudge 結果如下：

| access layer | bedrock score | full-scale score | full-scale document recall | calls / 題 | token / 題 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Native BM25 | 81.3 | 54.8 | 65.6 | 1.00 | 5.8K |
| File-System Agent | 87.1 | 36.9 | 36.8 | 36.12 | 895K |
| Agent+BM25 | 90.1 | **69.4** | **72.4** | 5.79 | **101K** |

在「至少找到一份 gold document」的 selection-conditioned slice，File-System Agent 的得分反而是 85.9，高於 BM25 的 73.8；但它的 any-gold hit rate 在 full scale 掉到 39.0%，BM25 是 71.6%。這把失敗定位得很清楚：raw-file agent 一旦拿到正確文件，synthesis 不一定差；它更常敗在沒有先發現正確候選。

**Paper evidence** 是 Agent+BM25 full-scale 69.4 對 raw-file 36.9，且 query token 約少九倍。**Bloss0m inference** 是把系統拆成兩層：global candidate discovery 應有可量測、可快取、可控成本的 index；agent 應該在候選集合已縮小後處理改寫查詢、閱讀上下文、衝突整理與 completeness，而不是被期待同時完成全域搜尋與推理。

## Ablations 與 robustness：哪些結論比較站得住？

這篇論文沒有把所有結果都叫作 ablation，但 Appendix G/H、Table 5/6/13/14 提供了幾組實質控制：

- **Judge protocol**：binary re-scoring 保留九個共同尺度的 family ranking；independent judge agreement 是 96.2%。因此大方向較穩，接近的 pair 仍要保留不確定性。
- **Question wording**：在小 tier 的 paraphrase control，BM25、File-System Agent、DenseRAG 都會下降，但 BM25 仍高於 DenseRAG；作者沒有把這個小規模 control 擴大宣稱成所有語言或所有 paraphrase 的結果。
- **Retrieval depth**：在可比的 top-10 cells，BM25 在 (N=1{,}144) 得分 83.0、DenseRAG 70.0；在 (N=2{,}254)，BM25 81.9、DenseRAG 66.5、HippoRAG 2 73.0。這表示 top-5 選擇不是唯一解釋，但 control 仍是小尺度、可用方法受限的比較。
- **Proposal sensitivity**：對 90 題做 direct full-corpus DenseRAG top-10 audit，與歷史 BM25-prefiltered dense candidates 平均重疊 1.2 份文件，找回 431 個 confirmed items 中的 57 個，並辨識出 115 個 traps 與 100 個 not-found lures。這降低了「所有 adversarial candidates 都只因 BM25 prefilter 才被看見」的疑慮。
- **Harness control**：同一 bedrock、150 題、policy model、raw corpus 與 judge 下，作者的 File-System harness 得分 86.3，Pi-Agent 82.3，Codex harness 43.9，native BM25 82.1。這個結果提醒我們：agent harness 自己也會影響分數，不能把所有差異都歸咎於 retrieval substrate。

## Limitations、threats to validity 與不被證據支持的說法

### 論文證據的邊界

1. **一個合成、虛構但 enterprise-shaped 的 corpus**：資料涵蓋 wiki、chat、ticket、email、meeting transcript、CRM 與 code review，也有 misfiled、near-duplicate 與錯誤版本；但它不是實際企業的 ACL、更新流程、跨租戶隔離或真實使用者流量。
2. **固定 bedrock 與固定 workload**：問題、gold documents、traps、lures 會從最小 tier 起保持不變，只增加依固定順序加入的背景文件。這讓 scaling 可解讀，卻不代表真實知識庫會以相同順序成長、刪除、去重或改版。
3. **未完成的 graph tier 有 coverage bias**：主要曲線只畫已建成的 cell；Figure 5 左側的 coverage-adjusted summary 才把未完成 graph tier 設為零。因此不能把 MS-GraphRAG、LightRAG 的 missing cells 當成它們的已觀測答案準確率。
4. **建置成本包含外推**：Table 2 的 (C(x)=ax^b) fit 對 full corpus 的數字，是把已完成尺度外推到 600.8M token；硬體 throughput、平行化與失敗重試可能改變 calendar time，但不會自動讓 extrapolation 變成實測。
5. **一個 reader、一個主要 judge、一次執行**：Qwen3.6-27B、80-call budget、temperature 0 的控制提高可比性，但不能代表其他 reader、tool policy、retrieval depth、context window 或 concurrency。作者已做 independent judge 與 binary protocol，仍明確承認 close pair 可能變動。
6. **這個 benchmark 讓 lexical anchors 有利**：enterprise questions 裡有精確詞彙，而 traps 是語意相似但事實錯誤的文件，所以 exact matching 可能特別有利。paraphrase control 只在小 tier 提供部分補充，不能替代跨語言、拼寫變化或真正語意搜尋的評測。

### 論文沒有證明的事

- BM25 是每一種企業 corpus、每一種語言、每一種 relational workload 的最佳 retriever。
- GraphRAG 在 production 中永遠不值得建，或所有 graph index 都會遇到同樣的 construction wall。
- Agentic retrieval 沒有價值；相反地，Agent+BM25 的結果顯示 agent 在 ranked discovery 之後仍能增加分數。
- 這組 score 就等於真實使用者滿意度、權限正確性、SLA、美元成本或整體 production superiority。

> **花花的工程提醒**
>
> 把「可完成性」與「已答錯」分開記錄。圖索引沒有建完，是 deployment coverage 問題；找到證據卻答錯，是 synthesis 或 judge 問題。兩者混成一個 0 分，會讓架構決策失真。

## Engineering implications：如何把結果轉成可驗證的架構決策

以下是 **Bloss0m inference**，不是論文直接驗證的 production recipe：

1. **先建立可量測的 lexical baseline**：以 BM25 或等價的稀疏檢索作 global candidate discovery，記錄 answerable-question 的 any-gold hit rate、document recall、query token、latency 與 ACL／版本過濾後的有效候選數。不要只看最後的 LLM answer score。
2. **讓 agent 接在候選排序後**：把 top-k evidence、來源路徑、版本與權限訊息交給 agent，讓它做 query reformulation、局部閱讀、衝突整理與 completeness。需要 agent 不代表要讓它從空白檔案樹開始找遍全域。
3. **以題型決定升級條件**：若 production traffic 主要是精確 lookup，BM25 可能是低成本 default；若是跨文件 completeness、project aggregation、semantic paraphrase 或關係查詢，應在固定 workload 上比較 hybrid、dense、reranker 或 graph substrate，而不是直接套用 10M token 的交叉點。
4. **把 graph 當成有條件的投資**：只有在關係型問題確實佔比高、結構抽取品質可驗證、增量更新與 build budget 可接受時，才為 graph construction 付費。對所有未完成 tier 報告 coverage，對已完成 tier 報告 build tokens、索引新鮮度與 query latency。
5. **複製論文的評測形狀**：至少做 nested corpus tiers、固定 gold／adversarial set、shared reader／judge、建置與查詢成本分帳、question bootstrap，以及一個只換 retrieval primitive 的 matched control。這比在單一 corpus size 上宣布「GraphRAG 勝出」更能回答 production 問題。

## Reproducibility 與 artifact status（截至 2026-08-09）

這裡把「作者說有」和「我能直接取得」分開：

| artifact | 獨立端點檢查 | 狀態與含義 |
| --- | --- | --- |
| 論文 PDF／HTML／TeX source | [PDF](https://arxiv.org/pdf/2607.26497v3)、[HTML](https://arxiv.org/html/2607.26497v3)、[source archive](https://arxiv.org/src/2607.26497v3) 均回應 200；source archive 可列出 `main.tex`、`appendix.tex`、PDF 與七張 figure | **可取得**。source archive 只驗證了論文與 figure 材料；它沒有 `scripts/`、`results/` 或 benchmark data 的完整實驗包。 |
| EnterpriseRAG-Bench code／questions／methodology | [GitHub repository](https://github.com/onyx-dot-app/EnterpriseRAG-Bench) 回應 200，公開 README、`src/`、`questions.jsonl`、quickstart、MIT license 與 release／下載說明 | **可取得，但不是本文 exact run 的研究程式碼包**。它是本文使用的 benchmark 的公開 release；論文宣稱的 `results/...` 與 `scripts/...` 仍未在本文的 arXiv source archive 中出現。 |
| EnterpriseRAG-Bench data | [Hugging Face dataset page](https://huggingface.co/datasets/onyx-dot-app/EnterpriseRAG-Bench) 可存取，能看到 dataset card、files 區與部分 document preview；2026-08-09 檢查時 full viewer 回報 API/server error，而 [GitHub README](https://github.com/onyx-dot-app/EnterpriseRAG-Bench) 仍列出 release／zip 與 Hugging Face 的下載路徑。 | **公開下載路徑、目前 viewer 不穩定**。頁面或 preview 可見，不等於已下載完整資料，更不等於本文 exact run 已被重現。 |
| exact study outputs／model weights／deployment config | 論文 Appendix L/M 只列出 `results/`、`figures/`、`scripts/` 的相對路徑與 README 說明；沒有獨立的 paper-specific code、checkpoint 或 demo URL | **未知／未獨立取得**。Qwen3.6-27B 與 Qwen3-Embedding-0.6B 是論文報告的實驗設定，不等於作者提供了 exact serving image、weights、prompts 的執行包。 |

最小的可行重現方式是：先從 benchmark 的 GitHub release 或 Hugging Face 取得資料，依論文 §3 與 Appendix B 生成幾個 nested tiers，固定 bedrock、reader、judge 與 token metering，再比較 BM25、dense、graph 與 raw-file／Agent+BM25。這是**建議的 reproduction experiment**，不是本文聲稱已完成的重現；沒有 study-specific `results/`、完整 runner 與環境設定前，不應把它標為 exact reproduction。

## 下一步閱讀與 Primary sources

若要把這篇研究放回 Bloss0m 的既有脈絡，可以先讀 [RAG vs. GraphRAG 的系統性評估](/paper-reading/07-GraphRAG-vs-RAG/)，再回到 [Enterprise RAG 實作指南](/blog/65-enterprise-rag-guide/) 看權限、版本、評測與營運面；若關心 agent 如何進入 RAG pipeline，可接著讀 [Agentic RAG](/blog/07-agentic-rag/)。這些是已存在且路由可驗證的相關文章，不是本文結果的證據來源。

Primary sources：

- [Wang et al., BM25 Wins at Scale, arXiv record](https://arxiv.org/abs/2607.26497)；[full HTML](https://arxiv.org/html/2607.26497v3)；[PDF v3](https://arxiv.org/pdf/2607.26497v3)。
- [arXiv v3 TeX source archive](https://arxiv.org/src/2607.26497v3) 與 [arXiv distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html)。
- [EnterpriseRAG-Bench official GitHub repository](https://github.com/onyx-dot-app/EnterpriseRAG-Bench)。
- [EnterpriseRAG-Bench Hugging Face dataset endpoint](https://huggingface.co/datasets/onyx-dot-app/EnterpriseRAG-Bench)。
