---
title: "RubricRanker 論文精讀：RAG 需要的不是最相關文件，而是對的文件集合"
description: "拆解 RubricRanker 如何用 query-specific search rubrics、SFT 與 GRPO 訓練文件 reranker，並檢查它在 deep research 與 RAG benchmark 上真正改善了什麼。"
pubDate: 2026-08-07
updatedDate: 2026-08-07
tldr:
  - "RubricRanker 把 reranking 目標從單一文件 relevance 改成文件集合的 coverage、conciseness、consistency、authority 與 timeliness。"
  - "在四個抽樣的 deep-research benchmark 上，平均分數 60.1，較第二名 Rank4Gen 高 2.6 分；五個 RAG benchmark 的平均 exact match 為 40.0。"
  - "冷啟動 SFT 比後續 RL 更關鍵：移除 SFT 後三組資料平均由 52.5 降至 48.3；移除 rubric-guided labels 則降至 49.2。"
  - "這篇論文支持把 reranker 當成 evidence-set selector，但仍受 GPT-5.1 reward、抽樣 benchmark 與 downstream LLM judge 依賴限制。"
audience:
  - "正在設計 deep-research agent、RAG retrieval stack 或 evidence-set reranker 的 AI 工程師。"
  - "需要判斷 set-level retrieval 是否值得引入訓練與推理成本的技術負責人。"
tags: ["Paper Reading", "RAG", "Deep Research", "Reranking", "Information Retrieval", "Evaluation"]
field: "Retrieval Systems"
difficulty: "advanced"
showToc: true
paper:
  title: "Training Documents Reranker with Search Rubrics for Deep Research Agent"
  authors:
    - "Wenhan Liu"
    - "Yu Lu"
    - "Qiaolin Xia"
    - "Hui Xu"
    - "Tong Zhao"
    - "Jian Xi"
    - "Yutao Zhu"
    - "Haijin Liang"
    - "Haibo Shi"
    - "Hao Wang"
    - "Zhicheng Dou"
  year: 2026
  venue: "arXiv cs.IR preprint, v1 (2026-08-04)"
  links:
    pdf: "https://arxiv.org/pdf/2608.03527v1"
    arxiv: "https://arxiv.org/abs/2608.03527"
    code: "https://github.com/8421BCD/RubricRanker"
series:
  id: "retrieval-systems"
  title: "檢索系統"
  part: 1
  totalParts: 1
---

RAG 系統最常見的錯覺是：只要把每一份文件按照 query relevance 排好，再取 top-k，就會得到好的 evidence。對簡單問答，這個近似常常夠用；對 deep-research agent，它卻可能同時漏掉一個重要面向、塞進重複內容，還把不權威的來源送進 context。**RubricRanker** 的問題意識很清楚：Agent 需要的不是「每份文件各自相關」，而是「這一組文件合在一起，是否足以支撐這次回答」。

截至 2026-08-07，這篇是 **arXiv v1 預印本**，沒有找到獨立 venue 或 OpenReview 紀錄。作者公開了 [GitHub code](https://github.com/8421BCD/RubricRanker)，以及 README 連結的 ModelScope model、SFT data 與 RL data；但完整重現仍需要多個模型服務、Serper API、OpenAI API、GPU 與外部資料檔案，不應把「repository 可見」等同於「一鍵可重現」。

> **花花的工程提醒**
>
> Reranker 的輸出不是排行榜，而是給下一個模型看的 evidence budget。評估它時要問：這組文件覆蓋了什麼、重複了什麼、互相矛盾了什麼，以及誰有資格成為來源，而不只是第一名文件的 relevance 分數。

## 先回答讀者問題：它改善了 evidence set，但沒有取代答案驗證

RubricRanker 的核心結果是：在四個抽樣的 deep-research benchmark 上，平均分數 **60.1**，比第二名 Rank4Gen 的 **57.5** 高 **2.6** 分；在五個 closed-form RAG benchmark 上，平均 exact match **40.0**，比 Rank4Gen **38.2** 高約 1.8 分。它也讓 Dr-Tulu agent 的 search calls 減少：HealthBench 從 RankT5 的 3.2、Rank4Gen 的 3.4 降至 **2.9**；ResearchQA 從 3.2 與 3.5 降至 **2.9**。

我的結論是：**論文支持 set-level reranking 是一個值得測的控制點，不支持它已經證明了通用的 evidence quality 或 production research reliability。** 分數最後仍由下游 Agent 與 LLM judge 產生，reranker 選到好文件不等於 Agent 會正確讀取、引用或推理。

## 論文身份與它修正的 retrieval 假設

傳統 reranker 對 query–document pair 打分，再返回 top-k。RubricRanker 把候選文件記為 $\mathcal{D}_t=\{d_1,\ldots,d_n\}$，輸出一個子集合 $\mathcal{S}_t\subseteq\mathcal{D}_t$。這個差異看似只是排序介面，實際上改變了 supervision：模型不必把所有文件排成全序，而要選出對回答最有用的一組。

作者設計兩層 search rubrics：

- **Set-level**：relevance（覆蓋關鍵資訊與不同面向）、conciseness（避免冗餘與無關內容）、consistency（文件間的事實與結論不互相衝突）。
- **Document-level**：authority（來源是否可靠）與 timeliness（是否符合時間需求）。不相關的文件不會因為來源權威就自動通過 authority。

這裡最重要的是「集合」與「單份文件」不能混為一談。十份都談 depression 的文件，可能仍漏掉 self-regulation、重複 psychotherapy，並混入非權威來源；Figure 1 以這個例子說明 relevance-only selection 為什麼不夠。

![RubricRanker Figure 1：單一文件 relevance 無法保證 evidence set 的 coverage、conciseness 與 authority](https://arxiv.org/html/2608.03527v1/x1.png)

*圖 1｜論文用 depression treatment 的例子展示文件集合缺口。來源：[Liu 等人，RubricRanker Figure 1](https://arxiv.org/html/2608.03527v1#S1.F1)；原始頁面標示 arXiv.org perpetual non-exclusive license，本文保留來源與連結；若要在站外重新散布圖檔，應另行確認授權。*

## Figure 2：先寫出「什麼叫好」，再訓練模型挑文件

RubricRanker 的 pipeline 分成 rubric construction 與 reranker training。作者先建立固定的 meta-rubrics，再從 OpenScholar、SearchArena、GlaiveAI-Reasoning-v1-20M、WebWalker-Silver 等 deep-research 資料取問題，讓 Dr-Tulu-8B 跑完整 trajectory，抽出 agent sub-query。RAG 部分則取 HotpotQA、NQ 等 user question。

對 deep-research sub-query，GPT-5.1 先用 web search 合成 reference answer，讓系統看到回答需要涵蓋的 aspects、facts 與 constraints；再由 GPT-5.1 把 meta-rubrics 展開成 query-specific rubrics，每條帶 1–5 的重要性權重。RAG 問題則直接使用原始 gold answer。

![RubricRanker Figure 2：query-specific search rubrics 與兩階段 reranker training](https://arxiv.org/html/2608.03527v1/x2.png)

*圖 2｜從 reference answer 生成 query-specific rubrics，再以 SFT 與 rubric-based RL 訓練。來源：[Liu 等人，RubricRanker Figure 2](https://arxiv.org/html/2608.03527v1#S4.F2)；同上，保留 arXiv 來源與授權注意事項。*

這個設計同時是優點與風險。優點是「coverage」不再是抽象口號，而是對某一題具體寫出要支持的 claim。風險是 rubric generator 與 reference answer 的錯誤會變成 training target；系統並沒有在 inference 時重新提供 rubric 讓模型逐條驗證，而是希望 Qwen3-8B 把這些要求內化。

## 訓練：SFT 提供穩定起點，RL 用 rubric reward 微調集合選擇

在 cold-start SFT，候選列表長度隨機取 10–40；GPT-5.1 讀 query、前置 reasoning、query-specific rubrics 與候選文件，輸出 selected document IDs，作為 silver labels。Student 只看到 query 和候選文件，不看 rubrics，對齊最終推理介面。

在第二階段，模型輸出文件集合 $D$，由 GPT-5.1 judge 對 set-level 與 document-level rubrics 評分。作者將它們以權重聚合：

$$
P^r(D)=\frac{\sum_i sw_i S(sr_i,D)+\sum_j dw_j F(dr_j,D)}{\sum_i sw_i+\sum_j dw_j},
$$

其中 $S$ 是集合層評分，$F$ 是文件層平均分數，$sw_i$ 與 $dw_j$ 是 rubric weights。若輸出格式不是 `[1] [3] [2]` 這種可解析的 document IDs，最終 reward 直接設為 **-1**。之後用 GRPO 更新 Qwen3-8B。

訓練資料總計 **24,467 queries**：SFT 9,843、RL 14,624。RL 以 8 張 NVIDIA H20、150 steps、每個 sample 8 rollouts 執行；rubric reward 在 rollout 中呼叫 GPT-5.1。這個成本與 judge dependency 是 production 團隊不能跳過的設計條件。

## Table 1：deep research 平均提升 2.6 分，但評估本身仍是 LLM judge

四個 deep-research benchmark 的結果如下。HealthBench、WebWalkerQA、DeepResearchBench、ResearchQA 分別抽樣 100、200、100、100 題；所有 reranker 都對 Google Search API 的 top 30 文件做 selection，最後由各 benchmark protocol 的 LLM judge 評估答案。

| 方法 | WebWalkerQA | HealthBench | DRB | ResearchQA | Avg. |
| --- | ---: | ---: | ---: | ---: | ---: |
| Initial retrieval | 44.5 | 55.2 | 45.3 | 71.1 | 54.0 |
| BGE-Reranker-Large | 52.0 | 58.7 | 46.5 | 71.2 | 57.1 |
| RankT5 | 53.0 | 57.0 | 46.6 | 72.8 | 57.4 |
| SetR | 49.0 | 58.7 | 44.8 | 73.3 | 56.5 |
| Rank4Gen | 52.0 | 59.2 | 46.6 | 72.0 | 57.5 |
| RubricRanker | **58.0** | **61.5** | **46.8** | **74.2** | **60.1** |

RubricRanker 在四個 benchmark 都是表中最高，但要精確理解「2.6 分」：這是相對 Rank4Gen 的平均 benchmark score，不是 2.6 個百分點的 production success，也不是同一批題目的 deterministic ground truth accuracy。DeepResearchBench 使用 Gemini 2.5 Flash judge，ResearchQA 使用 GPT-4.1-mini judge；不同 benchmark 的分數不宜當作同一量尺。

## Table 2：RAG 泛化方向一致，幅度仍依資料集而變

RAG 實驗使用 BGE 對 December 2018 Wikipedia dump 取 top 30，Qwen3-8B 生成答案，exact match 作為指標。

| 方法 | HotpotQA | Bamboogle | NQ | PopQA | TriviaQA | Avg. EM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial retrieval | 29.8 | 15.2 | 31.0 | 37.2 | 58.4 | 34.3 |
| BGE-Reranker-Large | 35.3 | 17.6 | 28.0 | 40.4 | 60.8 | 36.4 |
| Rank4Gen | 35.1 | 20.0 | 33.2 | 41.0 | 61.7 | 38.2 |
| RubricRanker | **38.0** | **23.2** | **34.0** | **42.2** | **62.4** | **40.0** |

這裡支持「同一個 set-level selector 可以從 deep research 延伸到 closed-form RAG」，但不能反推它在企業內部 corpus、時效性資料、中文混合語料或高風險 domain 也會有同樣增益。資料分布、retriever、generator 與 evaluation metric 都改變了。

## Table 3：最關鍵的不是 RL，而是冷啟動與標籤設計

作者在 WebWalkerQA、HealthBench、HotpotQA 上做 ablation，完整 RubricRanker 的三組平均是 **52.5**：

| 變體 | WebWalkerQA | HealthBench | HotpotQA | Avg. |
| --- | ---: | ---: | ---: | ---: |
| RubricRanker | 58.0 | 61.5 | 38.0 | **52.5** |
| w/o RL | 55.0 | 61.0 | 37.2 | 51.1 |
| w/o SFT | 48.0 | 61.0 | 35.8 | 48.3 |
| w/o rubrics | 51.5 | 60.0 | 36.0 | 49.2 |
| Relevance Ranking labels | 50.0 | 59.2 | 35.0 | 48.1 |

移除 RL 只降 **1.4** 分，但移除 SFT 降 **4.2** 分；移除 query-specific rubrics 降 **3.3** 分；把 labels 改成一般 relevance ranking 則降 **4.4** 分。這個結果把論文的主要貢獻定位得更準：不是「RL 神奇地讓 reranker 會挑文件」，而是 set-level label 與穩定 cold start 共同把訓練目標從排序改成選集合。

## Figure 3、Figure 4：文件更多不一定更好，search call 也不是完整成本

作者把 rerank input 從 top 10、20、30、40、50 做 sweep。WebWalkerQA 約在 30 之後飽和，HotpotQA 約在 40 之後可能下降；候選太少會漏掉低排名的相關文件，候選太多則拉長 reranker context，讓模型本身退化。這不是一個固定 top-k 的 universal rule，而是需要在自己的 corpus 上重新校準。

Figure 4 的 search-call analysis 顯示 RubricRanker 讓 Dr-Tulu 提早得到足夠證據，但 search calls 下降不等於總成本一定下降：每次 rerank 的 token、candidate context、GPT-5.1 training cost、GPU inference latency 與 downstream answer length 都還要計入。

![RubricRanker Figure 3：不同 rerank candidate 數量對 WebWalkerQA 與 HotpotQA 的影響](https://arxiv.org/html/2608.03527v1/x3.png)

*圖 3｜候選數量的效能 trade-off。來源：[Liu 等人，RubricRanker Figure 3](https://arxiv.org/html/2608.03527v1#S5.F3)；保留 arXiv 來源與授權注意事項。*

![RubricRanker Figure 4：不同 reranker 下 Dr-Tulu 的 search calls](https://arxiv.org/html/2608.03527v1/x4.png)

*圖 4｜search-call reduction。來源：[Liu 等人，RubricRanker Figure 4](https://arxiv.org/html/2608.03527v1#S5.F4)；保留 arXiv 來源與授權注意事項。*

## 證據、主張與我的推論

### 論文直接支持的事

在作者選定的 benchmark、retriever、generator、candidate size 與 judge protocol 下，RubricRanker 的 downstream score 高於列出的 baseline；ablation 顯示 query-specific rubric labels 與 SFT 都有貢獻；search-call trace 顯示它能讓特定 deep-research agent 少發出幾次 search。

### 作者仍未證明的事

論文沒有證明 rubric judge 比人工標註更接近真正 user information need，也沒有證明少 search call 一定代表更低總成本或更高 evidence reliability。作者自己也指出，evaluation 仍依賴 final generation quality，無法直接衡量 selected document set 的客觀品質。

### 我的工程推論

RubricRanker 最適合放在「retriever 已經找回一批候選，但 context budget 不夠全部送入 Agent」的中間層。它不應取代 query expansion、source policy、citation verification 或 answer-side evidence check。尤其是高風險問題，authority 與 timeliness 應由可解釋的 policy verifier 另外檢查，而不是只依賴 learned reranker 的隱性偏好。

## Artifact 與可重現性：公開不等於低成本

截至 2026-08-07，官方 [GitHub repository](https://github.com/8421BCD/RubricRanker) 可存取，README 列出 MIT license、evaluation command、LLaMA-Factory SFT 與 VERL GRPO training。README 也連到 [ModelScope checkpoint](https://modelscope.cn/models/lwhlwh/rubricranker_sft_rl)、[SFT data](https://modelscope.cn/datasets/lwhlwh/rubricranker_sft_data) 與 [RL data](https://modelscope.cn/datasets/lwhlwh/rubricranker_rl_data)；這些頁面可解析到，但需另外確認下載權限、檔案版本與大檔是否完整可取。

最小重現可以先不跑 RL：使用 repo 的 evaluation path，固定 Qwen3-8B generator、BGE retriever、top-30 candidate 與一個小型 HotpotQA slice，比較 BGE-Reranker-Large、Rank4Gen 與 RubricRanker 的 selected set、EM、context token 與 end-to-end latency。要重現論文 training，還需 Serper API、GPT-5.1 reward calls、8 張 H20 的 RL 設定、模型服務與外部資料檔案。

## 什麼時候值得用，什麼時候不要用

值得試用的條件是：問題需要多面向 evidence、候選文件有重複與權威差異、下游 Agent 的 context budget 有明確上限，並且團隊能保留 selected-set trace 供人工檢查。

暫時不要引入的條件是：corpus 很小且規則能直接寫出、retriever 本身已能返回短且完整的 evidence set、延遲比回答品質更重要，或 query 的 authority／freshness 需要硬性合規保證。此時一個可解釋的 metadata filter 加傳統 reranker，可能比 8B generative selector 更可控。

## 結語：把 retrieval 的輸出從排名改成可審計的 evidence budget

RubricRanker 的真正訊息不是「請把 reranker 換成一個 8B model」，而是：deep research 的 retrieval output 應該是能共同支撐回答的 evidence set。Set-level rubrics、query-specific claims 與 selected-set trace，讓工程團隊可以問「漏了哪個面向、重複了哪一段、來源是否夠權威」，而不是只看一個 relevance score。

但這個新介面也引入新責任：rubric generator 會不會漏寫需求？GPT-5.1 judge 是否把自己的偏好當成 authority？候選數量的最佳點是否隨 corpus 改變？如果沒有對這些問題做 calibration 與 held-out evaluation，RubricRanker 只是在用另一個更複雜的模型，把 retrieval bias 藏得更深。

這篇文章可與 [RAG-MCP 的 prompt bloat 讀法](/paper-reading/04-rag-mcp/) 及 [GraphRAG 與 RAG 的系統評測](/paper-reading/07-graphrag-vs-rag/) 一起閱讀：前者處理工具選擇的 context budget，後者提醒我們要用實驗而不是架構名稱判斷 retrieval system。

## Primary sources

- [RubricRanker arXiv record](https://arxiv.org/abs/2608.03527)：版本、作者與摘要。
- [RubricRanker full paper](https://arxiv.org/html/2608.03527v1)：Figures 1–4、Tables 1–4、Appendix C 與 limitations。
- [RubricRanker official repository](https://github.com/8421BCD/RubricRanker)：code、MIT license、evaluation／training instructions。
- [ModelScope model](https://modelscope.cn/models/lwhlwh/rubricranker_sft_rl)、[SFT data](https://modelscope.cn/datasets/lwhlwh/rubricranker_sft_data)、[RL data](https://modelscope.cn/datasets/lwhlwh/rubricranker_rl_data)：作者 README 連結的 artifact endpoints。
