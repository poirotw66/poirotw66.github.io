---
title: "DocMemo：讓長文件 RAG 在找錯證據後仍能回頭"
description: "深讀 DocMemo：用 document schema、page belief 與 question episodic memory 保存跨回合 retrieval state，再以 Bayesian update、Thompson sampling 與 adaptive granularity 找回遺漏證據。"
pubDate: 2026-08-12
updatedDate: 2026-08-12
tldr:
  - "DocMemo 把長文件 QA 從一次性的 top-k page selection 改成可回頭修正的 evidence exploration。"
  - "三層 memory、Bayesian page belief updating、Thompson sampling 與局部視覺 crop 共同支援跨回合 retrieval；三個 benchmark 的平均 accuracy 為 77.6。"
  - "證據最支持的是 long-document visual QA 中的 evidence recovery，不是任意 enterprise RAG 的可靠度或成本保證；repository 有程式與操作說明，但資料、模型、license 與完整成本仍需自行核對。"
audience:
  - "設計 long-context、multimodal RAG、retrieval evaluation 或 evidence lineage 的 AI 工程師"
  - "需要判斷 retrieval 是否漏掉關鍵頁面、表格或 unanswerable evidence 的平台團隊"
tags: ["Paper Reading", "RAG", "Retrieval", "Multimodal", "Evaluation", "AI Engineering"]
image: "/paperReading/21-docmemo-dynamic-evidence-discovery/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
paper:
  title: "DocMemo: Dynamic Evidence Discovery via Probabilistic Memory-Guided Retrieval for Multi-Modal Document Understanding"
  authors:
    - "Hanshu Yao"
    - "Jianfeng Zhong"
    - "Niu Lian"
    - "Jinpeng Wang"
  year: 2026
  venue: "arXiv 2608.07067 v1 (2026-08-07; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.07067v1"
    arxiv: "https://arxiv.org/abs/2608.07067"
    code: "https://github.com/Harrygof/DocMemo"
---

## 90 秒讀懂 / The paper in 90 seconds

- **問題**：長文件的答案可能分散在數十頁、表格、圖與跨頁線索中。static retrieval 一開始就固定 top-k pages；若第一輪漏掉 evidence，後續 reasoner 沒有狀態可以解釋「哪一頁可能有用、哪些頁面已被排除、還缺什麼」。
- **核心直覺**：把 retrieval 做成 dynamic evidence exploration。Document Schema Memory 保存文件結構，Page Belief Memory 更新頁面相關性信念，Question Episodic Memory 記住當前問題的發現與 query refinement。
- **最強證據**：在 MMLongBench-Doc、LongDocURL、PaperTab 三個 long-document DocVQA benchmark 上，DocMemo 的 accuracy 為 71.3、81.1、80.4，平均 77.6；Table 4 的 ablation 也顯示移除 memory 或 Bayesian update 會使 MMLongBench-Doc accuracy 從 71.3 降到 68.5 或 68.8。
- **主要邊界**：評估依賴 GPT-4.1 binary judge、PDF rendering、Qwen3.5-VL-9B、ColQwen2.5、MinerU 與三個 benchmark 的 annotation；它沒有證明任意企業 corpus 的 citation faithfulness、access-control correctness、freshness 或總成本。

這篇的 bounded verdict 是：**把跨回合的 retrieval feedback 寫回 page belief，確實能讓長文件 QA 找回更多 evidence；但它仍是一個受特定 visual QA stack 限制的 retrieval method，不是通用 RAG reliability layer。**

## 先建立地圖 / What to know first

把文件切 chunk 後一次取 top-k，優點是 latency 與流程簡單，缺點是早期 ranking error 會把後續 reasoning 鎖在錯誤 page pool。另一條路是 iterative retrieval，但若每一輪只重新搜尋，系統仍不知道先前看過什麼、哪些頁面被判斷為 irrelevant、哪些 query refinement 已經嘗試過。

DocMemo 的設計可以和 [RAG-ANYTHING 的 multimodal RAG path](/paper-reading/03-rag-anything/)、[GraphRAG vs. RAG 的 evaluation](/paper-reading/07-graphrag-vs-rag/)、[BM25 Wins at Scale](/paper-reading/13-bm25-wins-at-scale/) 與 [FinRank 的 evidence-grounded retrieval](/paper-reading/18-finrank-evidence-grounded-rag/) 對讀：前者提供表示與圖結構的背景，後兩者提醒我們要把 evidence coverage、negative cases 與 evaluation protocol 和答案分數分開看。

## 為什麼 static top-k 不夠 / Why the previous approach is insufficient

如果關鍵答案在第 37 頁與第 91 頁，但第一輪只取了第 4、8、12 頁，static retriever 可能讓 reasoner 在錯誤上下文中產生一個看似完整的回答。即使做第二輪，如果系統不保存「第 4 頁的線索提高了哪幾頁的可能性」與「第 8 頁已被判定為無關」，下一輪仍可能重複相同 search。

DocMemo 把這個缺口定義成 state propagation problem：不是只需要更多 retrieval rounds，而是需要能在 rounds 之間傳遞 document structure、page relevance 與 query-local discoveries 的 state。

## 核心直覺 / Core intuition

DocMemo 的 mental model 是：**第一次 retrieval 提供一個不完整的 hypothesis，reasoning feedback 再修改下一輪要探索的 page distribution**。

三層 memory 分工不同：

1. **Document Schema Memory**：offline 建立 document type、section layout 與 structural page prior；它與 query 無關。
2. **Page Belief Memory**：對目前 query 維護每一頁的 relevance belief，並在每輪接收 useful／irrelevant page feedback。
3. **Question Episodic Memory**：保存已經找到的 evidence、仍缺少的資訊與 refined query，避免 reasoning loop 忘記上一輪的發現。

![DocMemo Figure 2：tri-level memory 與 memory-guided dynamic retrieval pipeline。](/paperReading/21-docmemo-dynamic-evidence-discovery/figure-2-docmemo-overview.png)

*Figure 2（本文使用 paper Figure 2），論文 Section 3 的方法 overview：三層 document memory 透過 Bayesian update、Thompson sampling、LLM reranking 與 adaptive-granularity evidence access 支援 iterative QA。[原始 figure](https://arxiv.org/html/2608.07067v1#S3.F2)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2608.07067v1/x3.png)。DocMemo arXiv 頁面標示 CC BY 4.0；本文保留 attribution，並附上 [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/)。*

上面使用的是 paper Figure 2 的直接下載圖，檔名保留為 repository asset；它不是本文自行繪製的 Evidence Atlas cover。這個 distinction 很重要：cover 解釋文章的 bounded engineering conclusion，body figure 才是原論文的 evidence。

## 把一次漏頁走過一遍 / Walk one example through the method

以下是依 Figure 4 與方法段落整理的 faithful walkthrough；它是說明，不是 paper 之外的新 benchmark：

1. **Input**：使用者問一個跨頁的財務或學術文件問題，答案需要正文的一段定義與表格的一個數值。
2. **Intermediate representation**：Schema Memory 先提供文件 section 與 page layout；visual retriever 產生 page candidates；Question Episodic Memory 記下目前 query、已找到的定義與缺失的 table evidence。
3. **Decision**：reasoner 將看過的頁面分成 useful、irrelevant 或未判定。Page Belief Memory 以 Beta-Bernoulli update 提高 useful page 的 posterior mean，並把正向訊號以 spatial propagation 傳給鄰近頁面；Thompson sampling 保留探索不確定頁面的機會。
4. **Output**：下一輪以更新後的 page score 重新選頁、rerank，再對表格或圖所在頁面啟用 finer-grained crop，最後由 reasoning VLM 產生答案。
5. **Likely failure point**：若第一輪 reasoner 把真正相關頁面標成 irrelevant，belief state 會把錯誤往後傳；如果 OCR、visual embedding 或 page adjacency 對文件 layout 不適用，adaptive crop 也可能只是在錯誤頁面上增加解析度。

## 方法骨架 / Technical mechanism

### 1. Bayesian page belief update

對 page $p_i$ 維護 Beta prior $(\alpha_i,\beta_i)$。每輪得到 useful page set $U_t$ 與 irrelevant page set $V_t$ 後，更新：

$$\alpha_i\leftarrow\alpha_i+\mathbb{I}[i\in U_t],\qquad\beta_i\leftarrow\beta_i+\mathbb{I}[i\in V_t]$$

page posterior mean 為：

$$\mu_i=\frac{\alpha_i}{\alpha_i+\beta_i}$$

$\mu_i$ 是累積的 relevance confidence，不是「這頁一定包含答案」的 truth probability。正向 feedback 還會以 radius $r$ 與 decay $\gamma$ 傳給鄰近頁面，因為同一個 section 的 evidence 常集中在相鄰頁。

### 2. Thompson sampling：不要太早鎖死

如果只按照 posterior mean greedy ranking，第一輪偶然被選到的 page 可能一直佔據名額。Thompson sampling 從每頁的 Beta posterior 取樣，在 exploitation 與 exploration 之間保留不確定頁面的機會。論文 Appendix C.8 的替換實驗把 Thompson sampling 換成 greedy selection，整體 accuracy 從 71.28 降至 68.62。

### 3. Adaptive-granularity evidence access

Page-level retrieval 對整頁文字與版面有效，但表格、圖或局部 dense region 可能被整頁 representation 稀釋。DocMemo 在 reasoning 時對候選頁抽取局部 visual region；Implementation Details 與 Table 5 設定每 query 最多 5 個 table crops、image long side 1,500 px，並用 MinerU 取得 structure-aware table／figure crop。

### 4. 三回合的整體 loop

1. 用 offline page embeddings 與 schema summaries 建立初始候選。
2. 以 retrieval agent、Thompson sampling 與 LLM reranking 選出 pages。
3. reasoning VLM 讀取 page 與 local crop，輸出答案、useful pages、irrelevant pages、notes 與 refined query。
4. 將 feedback 寫回 Page Belief Memory 與 Question Episodic Memory。
5. evidence 不足時再進入下一輪，最多 $T=3$ 個 retrieval–reasoning cycles。

## 如何讀結果 / How to read the evidence

### Table 3：跨 benchmark 的 accuracy

DocMemo 在 MMLongBench-Doc、LongDocURL、PaperTab 的 accuracy 分別為 71.3、81.1、80.4，平均 77.6；SimpleDoc 為 60.6、72.3、65.4，平均 66.1。這個比較支持「stateful dynamic retrieval 在這三個 long-document DocVQA protocol 中帶來較高 answer accuracy」。它沒有單獨隔離所有外部因素，例如 preprocessing、visual embedding、prompt、model checkpoint 與 judge。

### Figure 3：找回 evidence 的行為

論文 Figure 3 把 evidence recall 與 all-hit rate 畫成 iterative retrieval 的曲線：brief 所記錄的結果是 evidence recall 從 round 1 的 28.32% 增至 round 3 的 69.56%，all-hit rate 從 12.90% 增至 58.05%。這比只報 final answer score 更能回答「系統是否真的找回遺漏頁面」；但 recall 仍是 benchmark annotation 上的 page-level coverage，不等於 answer correctness 或 citation faithfulness。

![DocMemo Figure 3：iterative evidence discovery 與 relative efficiency。](/paperReading/21-docmemo-dynamic-evidence-discovery/figure-3-evidence-recall-efficiency.png)

*Figure 3，論文 Section 4.4 的 central result：左側呈現 evidence recall／all-hit rate 隨 retrieval–reasoning rounds 上升，右側比較 relative efficiency。[原始 figure](https://arxiv.org/html/2608.07067v1#S4.F3)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2608.07067v1/x4.png)。DocMemo source 標示 CC BY 4.0；本文保留 attribution 並依 [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/) 使用。*

### Table 4：哪個 component 真的影響結果

MMLongBench-Doc 的 full model overall accuracy 是 71.28。移除 Document Schema Memory、Page Belief Memory、Question Episodic Memory、全部 memory、Bayesian updating、Thompson sampling、adaptive-granularity 後，overall 分別為 70.16、68.80、69.02、68.47、68.80、69.89、69.91。這個 pattern 讓 Page Belief、cross-round memory 與 adaptive crop 的作用變得可診斷，而不只是把所有 improvement 歸給「multimodal RAG」。

### Appendix：迭代效率與 judge verification

DocMemo 在 MMLongBench-Doc 平均每題 1.24 個 retrieval–reasoning iteration；SimpleDoc 固定三輪。按 LLM／VLM call 數量估計，DocMemo 的 relative computation cost 是 0.41、relative efficiency 是 2.40，這個 cost claim 是 paper-defined proxy，不是美元成本。評估主要使用 GPT-4.1 binary judge；Appendix C.6 對 300 題做人工核對，報告 96.7% agreement 與 Cohen’s kappa 0.92。這是有用的 calibration slice，但仍不是所有 benchmark、所有 evidence type 的獨立 human evaluation。

![DocMemo Figure 4：memory-guided iterative retrieval 的 qualitative example。](/paperReading/21-docmemo-dynamic-evidence-discovery/figure-4-qualitative-retrieval.png)

*Figure 4，論文 Section 4.5 的 qualitative analysis：展示 retrieval feedback、belief update、query refinement 與後續 evidence access 的關係。[原始 figure](https://arxiv.org/html/2608.07067v1#S4.F4)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2608.07067v1/x5.png)。DocMemo source 標示 CC BY 4.0；本文保留 attribution 並依 [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/) 使用。*

## 證據地圖 / Evidence map

- **Paper directly supports**：三個 benchmark 的 Table 3 accuracy、MMLongBench-Doc 的 Table 4 component ablation、Figure 3 的 iterative evidence recovery、Appendix C.5 的 call-based efficiency，以及 Appendix C.6 的 300 題 human verification。
- **Author interpretation**：三層 memory 與 Bayesian belief update 能讓 retrieval state 跨回合傳遞；adaptive granularity 對 table-intensive evidence 特別重要；on-demand iteration 可以比固定三輪更省 call。
- **Not established**：沒有任意 enterprise corpus 的 freshness、ACL／tenant isolation、citation faithfulness、美元成本或 production latency 保證；GPT-4.1 judge、Qwen3.5-VL-9B、MinerU 與 benchmark annotation 仍是主要外部效度限制。
- **Bloss0m engineering judgment**：最可移植的 pattern 是把 evidence coverage 與 retrieval state 做成可觀測資料，再用 unanswerable gate 與 citation check 阻止 reasoner 把「沒找到」誤寫成「不存在」。

## 限制、效度威脅與未支持的解讀 / Limitations and unsupported interpretations

本文的限制不是只有模型分數的高低。第一，所有 evidence feedback 都經過 reasoner 與 benchmark annotation；若 page relevance 判斷錯誤，Bayesian state 可能把早期錯誤放大。第二，三個 benchmark 都是 long-document visual QA，不能直接代表企業內部文件的 ACL、更新頻率、版面噪音與跨 tenant isolation。第三，GPT-4.1 judge 的 human verification 只抽查 MMLongBench 的 300 題，不能取代全量人工審核。最後，論文的 relative computation cost 以 LLM／VLM call proxy 計算，不能解讀成固定美元節省。

因此，DocMemo **尚未證明** 通用 RAG citation faithfulness、production latency、資料新鮮度或安全邊界會改善；這些都需要帶有版本、權限與成本記錄的外部評估。

## Artifact 狀態與可重現性 / Artifacts and reproducibility

截至 2026-08-12， [Harrygof/DocMemo repository](https://github.com/Harrygof/DocMemo) 是 public，包含 `agent`、`modules`、`pipeline`、`preprocess`、`prompts`、`scripts` 與 `utils`，README 提供 Python 3.11、requirements、embedding、vLLM、summary、document memory 與 QA commands。這代表 **code and documented pipeline are accessible**，但不代表完整 reproduction 已經完成。

README 要求使用者自行放入 dataset PDFs；paper 使用的 Qwen3.5-VL-9B、ColQwen2.5-v0.2、MinerU、vLLM、A100 hardware、checkpoint hashes、dataset license、exact commit、prompt／judge version 與完整 results archive 都需要另外核對。repository 根目錄未提供可確認的 LICENSE endpoint，因此本文把 artifact 狀態分成「程式與流程可讀」以及「資料、權利與完整重現未確認」。

最小可行 reproduction 是準備一個小型 MMLongBench subset，先跑三輪 retrieval–reasoning，對照 static retrieval 與 DocMemo，再重現 evidence recall、all-hit rate 與 Table 4 的關鍵 ablation。完整三 benchmark 需要 A100-class GPU、多階段 PDF preprocessing、offline embedding／summary 與 VLM service，不應把 README command list 當成低成本 replication。

## 工程決策與不該使用的地方 / Engineering decision and when not to use it

**適合使用**：文件長度與 evidence density 讓一次 top-k 不可靠，且團隊能保存 page-level retrieval feedback、query refinement、unanswerable decision 與 citation anchors 時。這時 Page Belief Memory 可以成為 retrieval observability layer，而不必把所有 memory 都塞進 prompt。

**不適合直接使用**：資料需要嚴格 ACL／tenant isolation、頁面經常更新但沒有 freshness invalidation、評估沒有 human spot check，或 retrieval feedback 本身可能被 prompt injection 污染時。先加上 access-control filtering、versioned index、evidence provenance、unanswerable threshold 與 cost budget，再考慮讓系統跨輪探索。

## 三個記憶點 / Three things to remember

1. **技術想法**：把每輪 reasoning feedback 寫回 page belief 與 episodic memory，讓下一輪能探索而不是重新猜測。
2. **證據**：三 benchmark accuracy、Table 4 ablation、Figure 3 evidence recovery 與 Appendix 的 efficiency／human verification 一起支持「stateful retrieval」這個較窄的 claim。
3. **邊界**：它改善的是特定 long-document visual QA 的 evidence discovery；enterprise RAG 的 freshness、權限、成本與 citation faithfulness 仍未被證明。

## Primary sources

- [DocMemo full arXiv HTML（v1，2026-08-07）](https://arxiv.org/html/2608.07067v1)
- [DocMemo arXiv abstract and version record](https://arxiv.org/abs/2608.07067)
- [DocMemo official repository](https://github.com/Harrygof/DocMemo)
- [DocMemo README and reproduction commands](https://raw.githubusercontent.com/Harrygof/DocMemo/master/README.md)
- [DocMemo requirements.txt](https://raw.githubusercontent.com/Harrygof/DocMemo/master/requirements.txt)
- [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/)
