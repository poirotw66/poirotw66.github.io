---
title: "RAG without Forgetting：把成功的 Query Expansion 寫回索引，但不要把錯誤也寫進去"
description: "以論文證據檢視 ERM 的 correctness gate、選擇性歸因、有界 key update、BEIR/BRIGHT 結果與未釋出 artifact。"
pubDate: 2026-03-23
updatedDate: 2026-08-24
tldr:
  - "ERM 是 training-free 的 index adaptation：只保存通過 correctness gate 的 expansion signal，並寫入確實受益的 document key。"
  - "論文的 benchmark 改善很廣，但 mutable index 是否安全仍取決於 verifier、重複流量、provenance 與 rollback。"
audience:
  - "想降低 high-QPS RAG query-time expansion 工作的搜尋工程師。"
  - "需要治理 feedback contamination、index drift 與 online memory 的 ML 團隊。"
tags: ["Paper Reading", "RAG", "Retrieval", "Query Expansion", "Continual Learning", "Vector Index"]
image: "/paperReading/05-RAG-without-Forgetting/image_1.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
  - agent-memory-adaptation
paper:
  title: "RAG without Forgetting: Continual Query-Infused Key Memory"
  authors:
    - "Yuntong Hu"
    - "Sha Li"
    - "Naren Ramakrishnan"
    - "Liang Zhao"
  year: 2026
  venue: "arXiv 2602.05152 v1 (preprint)"
  links:
    pdf: "https://arxiv.org/pdf/2602.05152.pdf"
    arxiv: "https://arxiv.org/abs/2602.05152"
series:
  id: "rag-without-forgetting"
  title: "RAG without Forgetting 深度精讀"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文 / The paper in 90 seconds

- **問題**：查詢擴展（Query Expansion, QE）能縮短 query 與 document 的表徵落差（representation gap），但每次在線請求都需調用大型語言模型（LLM）重新生成，在檢索完成後隨即拋棄，無法累積學習成果且在高併發（High-QPS）下帶來高昂延遲與推論成本；既有的離線鍵值擴展（Key Expansion, KE）雖具持久性，卻常在離線時對整個語料庫做啟發式更新，無法感知下游任務是否真正受益，極易造成語意漂移（semantic drift）與雜訊累積；直接持續微調檢索器參數又會引發災難性遺忘（catastrophic forgetting）。
- **核心洞見**：Evolving Retrieval Memory（ERM）提出免訓練（training-free）的索引適應架構：只接受通過正確性閘門（correctness gate）的擴展訊號；計算邊際相似度增益，僅將擴展單元選擇性歸因（selective attribution）給確實受益的文件鍵值（document keys）；最後透過有界更新（norm-bounded update）漸進演化索引，將在線查詢擴展成果持久化為儲存鍵值，使後續重複查詢能以原生檢索速度獲得增強效果。
- **最強證據**：在 13 個涵蓋 BEIR 與 BRIGHT 的領域中，ERM 顯著提升檢索品質（Table 1：BM25 平均 nDCG@1 由 26.3 升至 38.5 [+46%]；BGE-Large 由 48.6 升至 55.7 [+15%]；GTE-Base 由 49.9 升至 56.4 [+13%]；Cohere 與 Voyage 亦提升 11–13%），並在 StackExchange 問答生成維持品質增益（Table 2：BM25 平均回答品質提升 6%、BGE-Large 提升 4%）。推論延遲實測維持在 150–180 ms 的原生檢索水平，相較 HyDE 的 7–15 秒大幅降低（Figure 3）。
- **主要邊界**：論文假設查詢意圖分佈具備 Zipf 重複性且相似度函數具加法結構；如果正確性閘門出現誤判（false positive），錯誤關聯會被固化為持久向量狀態；離線評測無法等同於真實生產環境中文件動態變更、惡意提示注入（prompt injection）或隱私刪除要求下的長期穩定性；論文未公開官方實作程式碼、提示詞與檢查點（checkpoint）。

傳統檢索增強生成（RAG）架構長期受困於一項基本矛盾：在線查詢擴展雖然能大幅改善檢索召回率，卻是無狀態（stateless）且昂貴的暫態計算；離線鍵值擴展雖然持久，卻因為缺乏真實任務反饋而容易引入全域雜訊。Hu 等人轉向一個關鍵問題：能否將通過下游任務驗證的原子擴展單元，有選擇地編碼回向量索引本身的鍵值，而非反覆重算或重訓模型？透過檢驗 13 個基準資料集與多種檢索器家族，ERM 展示了將高成本查詢擴展攤提為常數檢索延遲的可行性。這項工作的重要意義，在於指出索引本身可以作為有邊界的、可驗證的持續學習載體，但也同時確立了嚴格依賴正確性閘門、資料溯源（provenance）與回滾（rollback）機制的工程底線。本文依據 2026-02-05 發布之 arXiv 2602.05152 v1 預印本進行分析。

## 理解前需要知道什麼 / What to know first

在深入探討 ERM 的運作機制前，必須先釐清既有檢索適應技術的基礎名詞與傳統方法的核心瓶頸：

1. **查詢擴展（Query Expansion, QE）與表徵落差（Representation Gap）**：
   使用者輸入的查詢通常簡短、模糊，與長篇專業文件在語彙與語意空間存在天然落差。現代 RAG 系統常透過 LLM 生成擴展詞（如 Pseudo-Relevance Feedback）、假想文件（如 HyDE 生成虛構答案）或多角度重寫（如 Diver、Facet），將原始查詢豐富化後再進行檢索。
2. **鍵值擴展（Key Expansion, KE）與向量索引**：
   在密集檢索器（Dense Retriever）中，文件庫 $D=\{d_i\}$ 被映射為向量鍵值集合 $K=\{k_i\}$。傳統 KE 嘗試在建立索引階段預先將生成的標題、摘要或關鍵字向量混入文件鍵值，使文件在向量空間覆蓋更廣泛的語意範圍。
3. **傳統方法為何不足（Why previous approaches fall short）**：
   - **傳統在線查詢擴展的無狀態瓶頸（Stateless Overhead）**：傳統 QE 將擴展成本全部推遲至查詢運行時（query-time）。每一次請求都必須等待 LLM 生成數百個 token，產生數秒的延遲（HyDE 通常需要 7–15 秒）。最致命的是，擴展結果在檢索後被立即丟棄，當下一位使用者發送意圖高度相同的查詢時，系統仍需全額支付相同的計算延遲與 API 費用。
   - **傳統離線鍵值擴展的任務脫節（Task-Agnostic Noise）**：傳統 KE 在離線階段批次生成，缺乏具體的查詢情境與下游生成反饋。這類啟發式修改並不知道擴展內容是否真正有助於下游問答，往往將通用的無關特徵強加於特定文件，造成嚴重的向量漂移與語料庫雜訊。
   - **傳統模型微調的災難性遺忘（Catastrophic Forgetting）**：試圖透過持續學習（Continual Learning）線上更新檢索器編碼器參數，不僅計算開銷巨大，且極易破壞模型對既有語料庫的泛化能力，引發嚴重的性能崩潰。

## 核心直覺 / Core intuition

ERM 的核心直覺在於：**不要重新訓練檢索器模型參數，而是將經過下游任務驗證的成功擴展經驗，作為有界的增量記憶，選擇性地沉澱到具體受益的文件鍵值中。**

這在決策邏輯上帶來了根本轉變：

- **舊在線決策規則**：
  $$q \xrightarrow{\text{LLM}} c(q) \xrightarrow{\text{Combine}} q_{\text{expanded}} \xrightarrow{\text{Search}} \text{Results} \xrightarrow{\text{Discard}} \emptyset$$
  每一次查詢均重新消耗昂貴推論資源，經驗隨請求結束而清空。
- **舊離線決策規則**：
  $$d_i \xrightarrow{\text{Heuristic}} d_i \oplus \text{Tags} \xrightarrow{\text{Embed}} k_i$$
  無差別修改全域鍵值，缺乏下游真實效果檢驗。
- **ERM 決策規則**：
  $$q \xrightarrow{\text{Expand}} c(q) \xrightarrow{\text{Correctness Gate}} \text{Valid Signals} \xrightarrow{\text{Marginal Gain}} \text{Attributed Keys} \xrightarrow{\text{Bounded Update}} k_i^*$$
  只有被下游驗證器證明「真正帶來正確解答」的擴展單元，且該單元能為特定文件帶來「正向邊際相似度增益」時，才會被寫入該文件的鍵值；其餘無關單元與未受益文件則完全不受影響。

藉由此機制，向量空間中的文件鍵值朝著被歷史證明有效的真實查詢意圖微幅靠攏。當未來出現類似意圖的請求時，系統無需再次調用 LLM 進行查詢擴展，直接發起原生檢索即可命中目標文件。

![ERM Figure 1：查詢擴展（QE）、鍵值擴展（KE）與演化檢索記憶（ERM）的機制對比。](/paperReading/05-RAG-without-Forgetting/image_1.webp)

*Figure 1，論文 Section 1 的方法論對比：左側 QE 在查詢時在線對齊但成本高且無狀態，中間 KE 在離線全域擴展但缺乏任務反饋，右側 ERM 將經過任務驗證的擴展單元選擇性沉澱至文件鍵值。[原始 Figure 1 anchor](https://arxiv.org/html/2602.05152v1#S1.F1)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2602.05152v1/figs/intro_fig.png)。arXiv source 標示 perpetual non-exclusive license；本文保留 attribution，依 [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) 使用。*

![ERM Figure 2：透過 correctness gate 與 selective attribution 將 query expansion 寫回 index 的流程。](/paperReading/05-RAG-without-Forgetting/image_2.webp)

*Figure 2，論文 Section 3 的 ERM 系統架構概觀：展示 query expansion、correctness gating、selective attribution 與 bounded key evolution 如何串接成可追蹤的 index adaptation 迴圈。見 [原始 Figure 2 anchor](https://arxiv.org/html/2602.05152v1#S3.F2) 與 [arXiv HTML figure endpoint](https://arxiv.org/html/2602.05152v1/figs/erm.png)。arXiv source 標示 perpetual non-exclusive license；本文保留完整 attribution，依 [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) 作學術引用。*

## 用一個例子走完整個方法 / Walk one example through the method

為了具體理解 ERM 的完整運作路徑，以下透過一個具體的企業技術客服查詢，走完整個端到端流程：

1. **輸入（Input）**：
   使用者提出查詢 $q = \text{「內部帳號安全金鑰無法完成認證」}$。在線模組調用擴展策略，生成候選原子擴展單元集合 $c(q) = \{e_1, e_2\}$：
   - $e_1 = \text{「硬體 Token 註冊逾時與憑證重設」}$
   - $e_2 = \text{「辦公室訪客無線網路連線問題」}$
2. **中間表徵（Intermediate representation）**：
   以擴展後查詢向語料庫發起初步檢索，召回兩篇候選文件：
   - 文件 $d_1$（原始鍵值 $k_1$）：《雙重驗證硬體金鑰障礙排除手冊》。
   - 文件 $d_2$（原始鍵值 $k_2$）：《公司內部網絡與訪客連線規範》。
   下游生成模型讀取召回內容後生成解答，輸出包含硬體憑證重設步驟的指導。
3. **決策或轉換（Decision or transformation）**：
   - **第一步：正確性閘門判定**。檢索驗證器確認 $d_1$ 落在前排高可信區間；生成驗證器檢視解答，確認成功解答了使用者問題，因此整個查詢通過正確性閘門，啟動寫入流程。
   - **第二步：選擇性邊際增益評估**。系統分別計算各擴展單元附加至各文件鍵值後的邊際相似度增益 $\Delta_{i,j}(q)$：
     - 對於 $d_1$（安全手冊），加入 $e_1$（憑證重設）能顯著提升與 $q$ 的語意重合度，計算得出 $\Delta_{1,1} = +0.34 > 0$；加入 $e_2$ 則無幫助，$\Delta_{1,2} = -0.05 \le 0$。
     - 對於 $d_2$（網絡規範），加入 $e_1$ 或 $e_2$ 均無法提升與硬體認證主題的相關性，$\Delta_{2,1} \le 0$ 且 $\Delta_{2,2} \le 0$。
   - **第三步：歸因決策**。系統僅保留組合 $(d_1, e_1)$，徹底過濾掉雜訊單元 $e_2$ 以及無關文件 $d_2$。
4. **輸出（Output）**：
   計算 $e_1$ 的向量表徵 $f(e_1)$，在範數約束與飽和規則下更新 $d_1$ 的鍵值：$k_1 \leftarrow k_1 + \eta \cdot f(e_1)$。索引庫中的 $k_1$ 向量朝硬體憑證故障意圖微幅位移。當下一次其他使用者提出「FIDO 安全金鑰驗證失敗」等同類問題時，系統不需啟動在線 LLM 擴展，以 150 ms 原生檢索即可直接命中 $d_1$。
5. **最可能的失效點（Likely failure point）**：
   若下游生成驗證器出現誤判（例如生成模型產生了言之鑿鑿的虛假解答，但 LLM 評判裁判判定其正確；或是使用者因標題吸引點擊了無效文件），錯誤的擴展單元 $e_2$ 或甚至攻擊者注入的指令將被持久寫入 $k_1$。這會導致未來正常的安全查詢被持續誤導，此即「閘門污染（Gate Contamination）」。

## 技術機制 / Technical mechanism

ERM 在系統架構上將語料庫形式化為文件集合 $D=\{d_i\}_{i=1}^N$ 與對應的檢索鍵值集合 $K=\{k_i\}_{i=1}^N \subset \mathbb{R}^d$。雙編碼器架構中的查詢編碼器記為 $f: \mathcal{X} \to \mathbb{R}^d$，查詢 $q$ 與鍵值 $k_i$ 透過相似度函數 $S(q, k_i) = \operatorname{sim}(f(q), k_i)$ 進行打分。針對查詢 $q$，擴展模組生成由原子語意單元組成的集合 $c(q) = \{e_1, e_2, \ldots, e_m\}$。

ERM 的技術核心由三大精確管線串接而成：

### 1. 正確性閘門反饋（Correctness-Gated Feedback，Section 4.1）

ERM 嚴格拒絕「無條件從所有在線查詢中學習」。系統定義了兩種相互獨立的驗證器：

- **檢索驗證器 $V_r(q, R_q)$**：在具備檢索標籤的情境下（如 BEIR 評測集），計算召回列表 $R_q$ 的相關性指標（例如 Recall@K 或 DPR 命中率）。
- **生成驗證器 $V_g(q, R_q, y)$**：在具備問答監督標籤的情境下（如 BRIGHT 評測集），評估生成答案 $y$ 的品質指標（如 ROUGE、答案正確性損失或 LLM-as-judge 評分）。

系統透過特定任務門檻值 $\tau_r$ 與 $\tau_g$，將驗證結果轉換為二元指示函數。整個查詢的寫入許可 $G(q)$ 採用邏輯 OR 運算：

$$
G(q) = \mathbb{I}[V_r(q, R_q) \ge \tau_r] \lor \mathbb{I}[V_g(q, R_q, y) \ge \tau_g]
$$

只有當 $G(q) = 1$ 時，查詢及其產生的擴展單元才會被送入後續記憶管線。這項設計使 ERM 能同時無縫銜接檢索導向與端到端問答導向的業務場景，但這也是系統抵禦污染的第一道生死線。

### 2. 選擇性擴展歸因（Selective Expansion Attribution，Section 4.2）

通過閘門的擴展單元不能全域廣播。若將通用的查詢片語附加至所有被召回的文件鍵值，將引發災難性的向量分佈崩塌。ERM 對每個被召回文件 $d_i$ 與候選擴展單元 $e_j$，計算邊際相似度增益（Marginal Similarity Gain）：

$$
\Delta_{i,j}(q) = \operatorname{sim}(f(q), k_i \oplus f(e_j)) - \operatorname{sim}(f(q), k_i)
$$

其中 $\oplus$ 代表特徵融合運算子（在無正規化加法模型中即為向量加法）。只有當 $\Delta_{i,j}(q) > 0$ 時，該單元才被視為對鍵值 $k_i$ 具有正向貢獻的候選記憶。

為了在同一查詢的多個有效單元間分配重要性，ERM 採用帶溫度參數 $\tau$ 的 Softmax 進行權重正規化：

$$
w_{i,j}(q) = \frac{\exp(\Delta_{i,j}(q) / \tau)}{\sum_{j': \Delta_{i,j'}(q) > 0} \exp(\Delta_{i,j'}(q) / \tau)}
$$

若某擴展單元對該文件的增益小於等於零，則其權重嚴格設為零。這種逐鍵值（per-key）的細粒度歸因，是阻斷不相關擴展詞污染無關文件的核心防護。

### 3. 漸進式鍵值演化（Progressive Key Evolution，Section 4.3）

在一個批次 $\mathcal{B}$ 的查詢流量中，ERM 累積各文件獲得的正向歸因權重，並過濾掉低頻或低增益的邊緣記憶：

$$
k_i^{(t+1)} = k_i^{(t)} + \eta \sum_{q \in \mathcal{B}} \sum_{j: \Delta_{i,j}(q) > 0} w_{i,j}(q) \cdot f(e_j)
$$

其中 $\eta$ 為學習率步長。為了避免鍵值向量在反覆累積後無限制膨脹，更新過程強制施加範數約束 $\|k_i^{(t+1)}\| \le B_k$。同時，演化迴圈配置了飽和終止規則（Saturation Stopping Rule）：當某一輪更新所帶來的邊際檢索提升低於預設閾值時，自動終止該鍵值的更新輪次。

全過程**完全不對檢索器編碼器 $f$ 進行梯度回傳或參數微調**。這消除了模型微調帶來的高昂算力負擔與災難性遺忘風險，但工程團隊必須清醒認識到：免訓練不等於免維護，向量庫中的動態鍵值、累積增量與驗證日誌已轉化為系統的核心運行狀態。

### 理論保證的真實適用邊界

論文在 Section 4 與 Appendix A 給出了數學證明，但工程讀者必須仔細檢驗其前提假設：

- **查詢擴展與鍵值擴展的等價性**：在加法內積相似度 $\operatorname{sim}(u, v) = u^T v$ 的條件下，將擴展向量加至查詢端所產生的內積增量，在數學上與將擴展向量預先加至鍵值端完全等價。
- **收斂性證明的範圍（Appendix A.3）**：收斂性定理在「採加法增量的無正規化密集檢索器（unnormalised dense retriever）」下嚴格成立；對於進行 L2 正規化（Cosine Similarity）的檢索器，僅在鍵值向量範數變化極其緩慢的局部區間內近似成立；**該證明完全不適用於稀疏檢索（BM25）或晚期交互檢索器（Late-interaction，如 ColBERT）**。
- **成本攤提的長尾意圖分佈（Appendix A.4）**：論文宣稱的「零推論負擔（Zero inference-time overhead）」是建立在查詢流量符合類 Zipf 長尾重複意圖的假設上。若真實業務場景的查詢均為突發單次（one-off）、高度分散或具備強烈時效性，離線適應的計算與儲存開銷將無法被後續重複請求有效攤銷。

## 實驗如何讀 / How to read the evidence

評估 ERM 的實驗結果時，必須同時審視其評測協定、指標分母以及特定領域的回退現象。

### 實驗協定與評測維度（Section 5 & Appendix B.1）

- **資料集覆蓋（Datasets）**：共評估 13 個公開資料集。
  - **BRIGHT 基準**：包含 7 個 StackExchange 問答領域（Biology、Earth Science、Economics、Psychology、Robotics、StackOverflow、Sustainable Living）以及 4 個複雜推理與編程領域（LeetCode、Pony、AoPS、TheoremQA-T）。BRIGHT 同時提供檢索相關性黃金標籤與問答生成標註。
  - **BEIR 基準**：包含 NFCorpus（323 筆醫學查詢、3.1K 篇文件）與 SciDocs（1,000 筆學術查詢、4K 篇文件），僅具備檢索標籤。
  - 語料規模具備顯著跨度：Pony 僅 7,894 篇文件，而 LeetCode 達到 413,932 篇。
- **檢索器與基線（Baselines）**：
  - 稀疏檢索：BM25。
  - 開源密集檢索器：BGE-Large、BGE-Base、BGE-M3-Dense、GTE-Base、MiniLM。
  - 商用閉源 API：Cohere 向量嵌入、Voyage 向量嵌入。
  - 對照方法：原生未適應檢索（Naive Retrieval）、在線假想文件擴展（HyDE）、多角度意圖擴展（Diver、Facet）。
- **文件表徵維度**：作者測試了全文（Full document）、標題（Title）、摘要（Abstract）與關鍵字（Keywords）四種索引鍵值型態。Appendix B 報告了多達 393 組原生檢索實驗，顯示最佳配置因領域而異（如 StackExchange 普遍適合標題索引，專業技術內容適合摘要與關鍵字）。
- **評測指標與算力開銷（Metrics & Compute）**：
  - 檢索指標以 nDCG@1 為主，輔以 nDCG@10 與 MRR。
  - 下游問答以 Claude-3.5-sonnet 同時負責生成回答與執行自動評分（LLM-as-judge）。
  - 推論延遲以單次查詢毫秒數（ms/query）計量。

### 檢索實驗解讀：先看絕對值，再看百分比（Table 1）

[Table 1](https://arxiv.org/html/2602.05152v1#S4.T1) 呈現了 13 個領域在 nDCG@1 上的表現。整體平均數值呈現顯著增長：

- BM25 平均分數由 **26.3** 升至 **38.5**（相對提升 +46%）
- BGE-Large 由 **48.6** 升至 **55.7**（+15%）
- GTE-Base 由 **49.9** 升至 **56.4**（+13%）
- Cohere 由 **48.7** 升至 **55.2**（+13%）
- Voyage 由 **50.8** 升至 **56.3**（+11%）

然而，解讀極端相對增長時必須檢視分母：

1. **弱基線的高倍率增長**：BM25 在 AoPS 數學競賽領域的 nDCG@1 由 0.9 暴增至 20.7（+2200%），在 TheoremQA-T 由 7.9 增至 37.8（+378%）。這項結果證明了在需要高度抽象推理的場景中，單純的詞彙檢索存在巨大的語意落差，擴展單元能帶來極具價值的詞彙補充；但這絕不代表系統整體準確率達到了 23 倍。
2. **強檢索器的局限與回退現象**：在部分原本表現已極為出色的領域，強密集模型在適應後反而出現回退。例如 BGE-Large 在 Biology 領域由 95.1 跌至 91.3、StackOverflow 由 43.4 跌至 40.4、Sustainable Living 由 79.1 跌至 75.9；GTE-Base 亦在數個領域微幅下滑。這說明當查詢與文件在原始向量空間已經高度對齊時，額外的鍵值演化反而容易導入雜訊，破壞原有的高精度邊界。

### 端到端生成實驗（Table 2）

[Table 2](https://arxiv.org/html/2602.05152v1#S5.T2) 在 7 個 StackExchange 領域將檢索串接至下游生成：

- BM25 平均回答品質評分由 72.6 提升至 76.6（+6%）
- BGE-Large 由 74.5 提升至 77.6（+4%）
- GTE-Base 由 77.4 提升至 79.0（+2%）
- Cohere 由 79.3 提升至 80.5（+2%）

雖然整體趨勢為正，但各領域表現不均（例如 GTE-Base 在 Earth Science、Cohere 在 Robotics 出現小幅負增長）。更關鍵的是，生成與評測均依賴 Claude-3.5-sonnet，存在同家族模型的評判偏差（model-family bias），缺乏獨立第三方的雙盲人工標註支撐。

### 延遲、預算與策略相容性診斷（Figures 3, 4, 6）

![ERM Figure 3：Native Retrieval、ERM 與 HyDE 在不同資料集上的推論延遲對比。](/paperReading/05-RAG-without-Forgetting/image_3.webp)

*Figure 3，論文 Section 5.1 的推論延遲基準診斷：Native 與 ERM 維持在 150–180 ms 的純向量檢索水平，而 HyDE 因在線調用 LLM 耗時達 7–15 秒，證實 ERM 成功將擴展成本轉移至離線適應階段。[原始 Figure 3 anchor](https://arxiv.org/html/2602.05152v1#S5.F3)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2602.05152v1/bar_aops.png)。arXiv source 標示 perpetual non-exclusive license；本文保留 attribution，依 [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) 使用。*

- **推論延遲（Figure 3）**：[Figure 3](https://arxiv.org/html/2602.05152v1#S5.F3) 對比了 Native Retrieval、ERM 與 HyDE。Native 與 ERM 檢索延遲穩定在 **150–180 ms**，而 HyDE 則高達 **7–15 秒**。這項對比直觀展示了 ERM 的工程吸引力：將高延遲的 LLM 擴展計算轉移至背景或離線階段，服務路徑（serving path）維持純向量檢索的速度。但必須指明，這並未消除總計算量，而是將算力前置至適應與驗證階段。
- **適應預算縮放（Figure 4）**：[Figure 4](https://arxiv.org/html/2602.05152v1#S5.F4) 將歷史適應資料比例從 0.3 提升至 0.8，在 AoPS、Psychology、TheoremQA-T 與 SciDocs 上，nDCG@10 呈現嚴格的單調上升。這支持了離線設定下「累積歷史經驗能提升檢索」的結論；但該實驗在每次劃分時重置了鍵值，不能證明連續數月的動態生產環境不會發生語意崩塌。
- **擴展策略多樣性（Appendix B.9 / Figure 6）**：[Figure 6](https://arxiv.org/html/2602.05152v1#A2.F6) 證實 ERM 能與多種 QE 策略良好結合（如 LeetCode 上 Facet+BM25 提升 12%，HyDE+BGE-Large 提升 58%）。但 Table 5 同時記錄了負增益（Biology −0.7%、Pony −0.4%），再次印證當查詢與文件原生對齊良好時，盲目擴展只會帶來有害雜訊。
- **無遺忘特性診斷（Section 5.2）**：論文檢驗了五個金標文件完全無交集的 BRIGHT 資料集。更新後，非目標文件鍵值的檢索性能波動保持在基準值的 ±3% 範圍內，初步證實局部鍵值更新不會破壞全域不相關文件的檢索。然而，該實驗未模擬真實環境下針對同一熱點文件的惡意高頻注入。

## 證據地圖 / Evidence map

為了讓工程團隊清晰區分實驗事實、作者主張與工程推論，以下將論文證據結構化拆解為四個嚴格層次：

### 1. 論文直接證據（Direct paper evidence）

- **架構定義與流程（Figures 1–2, Sections 4.1–4.3）**：確立了免訓練條件下，結合正確性閘門、邊際增益篩選與有界更新的索引適應架構。
- **檢索效能提升（Table 1）**：在 13 個領域中，BM25 平均 nDCG@1 提升 46%，密集檢索器平均提升 11–15%；但在 Biology、StackOverflow 與 Sustainable Living 等領域，強密集模型出現可量測的回退。
- **生成問答品質（Table 2）**：在 7 個 StackExchange 領域中，各檢索器推動下游回答品質平均提升 2–6%，但個別領域存在微幅下降。
- **服務延遲優勢（Figure 3）**：ERM 服務端延遲為 150–180 ms，維持在原生檢索水平，相較 HyDE 的 7–15 秒具備數量級優勢。
- **適應預算規律（Figure 4）**：離線協定下，nDCG@10 隨可用適應資料比例（0.3 到 0.8）單調增加。
- **跨領域無干擾測試（Section 5.2）**：在金標無交集的五個領域中，未更新文件的檢索波動被限制在 ±3% 內。

### 2. 作者因果解讀（Author causal claim）

- **數學等價性推論**：作者主張在標準加法內積相似度下，查詢端擴展與鍵值端擴展在理論上嚴格等價。
- **無遺忘與收斂保證**：作者認為透過範數約束與正向增益篩選，鍵值演化必然收斂且不會發生全域語意漂移。
- **長尾成本攤提論點**：作者依據 Zipf 分佈假設，推論真實業務流量中的重複查詢能完全吸收前期擴展與驗證成本，達成零推論額外負擔。

### 3. 論文未證明（Unsupported claims）

- **真實即時反饋下的閘門精度**：論文**尚未證明**在生產環境未標註的在線流量中，自動化驗證器（如 LLM judge）能具備足夠的精確度，防止錯誤或幻覺擴展悄然寫入索引。
- **動態文件的生命週期管理**：論文**尚未證明**當底層文件經歷改版、部分過期或徹底刪除時，已注入多輪擴展增量的鍵值應如何同步清理與精準回滾。
- **對抗攻擊與提示注入抵抗力**：論文**尚未證明**面對攻擊者故意構造的惡意查詢（Prompt Injection）或標題黨誘導點擊時，可變鍵值是否會成為持久化後門。
- **使用者隱私與資料合規**：論文**尚未證明**將使用者真實查詢片段編碼進長期儲存的向量鍵值後，如何滿足隱私洩漏防護與 GDPR「被遺忘權」的法規要求。

### 4. Bloss0m 工程化整理（Bloss0m engineering synthesis）

- **架構實質定位**：ERM 本質上是**驗證驅動的索引層級語意快取（Verification-gated Index Cache）**，其價值不在於通用的「自主終身學習」，而在於高信賴、高重複場景下的計算成本攤提。
- **工程解耦準則**：必須嚴格切分「在線服務證據」與「離線寫入證據」，未經多會話交叉驗證的訊號絕不能直接寫入核心向量庫。

## Artifact 與可重現性 / Artifacts and reproducibility

- **核對日期**：截至 **2026-08-09**。
- **可存取組件**：
  - [arXiv 預印本索引頁面](https://arxiv.org/abs/2602.05152) 與 [全文 HTML/PDF 格式](https://arxiv.org/html/2602.05152v1) 均可正常公開存取。
  - 評測所使用的標準基準 [BEIR repository](https://github.com/beir-cellar/beir) 與 [BRIGHT repository](https://github.com/SDU-NLP/BRIGHT) 可從第三方公開取得。
- **缺失與未釋出組件**：
  - 論文與預印本頁面均未提供官方開源實作倉儲（GitHub）、預訓練模型權重檢查點、在線展示（demo）或可一鍵運行的重現腳本（runnable harness）。
  - 各領域所使用的查詢擴展精確提示詞範本、驗證器判定門檻配置日誌、隨機種子設定、各批次的鍵值差異日誌（Delta logs）以及 Claude-3.5-sonnet 的評分裁判 prompt 均處於缺失狀態。
- **可重現性結論**：
  - 本文報導之實驗數據全數基於原論文作者報告之結果，未在本地環境進行全量獨立重跑（reproduction）。
  - 外部工程團隊無法透過單一指令完成一鍵重現，若要評估 ERM，必須自行依據論文公式實作驗證閘門、增益打分矩陣與範數裁剪邏輯。

## Bloss0m 工程判斷與不適用條件 / Bloss0m engineering judgment and when not to use it

基於對 ERM 機制邊界與風險的全面分析，Bloss0m 提出以下採用決策矩陣與架構防護規範：

### 工程決策矩陣

| 業務情境 | 採用決策 | 關鍵理由與技術考量 |
| --- | --- | --- |
| 具備明確成果標籤（如工單解決、測試通過）的高 QPS 內部知識庫 | **推薦**：先離線 Replay 驗證，再進行 Canary 灰度部署 | 最吻合論文的重複意圖與可信驗證假設，能切實降低在線 LLM 調用開銷。 |
| 具備高精準度獨立 Verifier 的企業問答檢索服務 | **可評估**：小規模試點具版本控管的鍵值記憶 | 適應後的查詢能直接享有 150–180 ms 原生檢索速度，顯著改善延遲 P99。 |
| 一次性突發、長尾冷門、強烈季節性或快速變動之查詢流量 | **不推薦**：維持無狀態在線 QE 或定期離線全量重建 | 缺乏足夠的重複流量來攤提擴展與驗證成本，反而造成無謂的儲存與維護開銷。 |
| 反饋訊號易受提示注入、使用者隨意點擊或不可信外掛影響之場景 | **嚴禁採用**：不可直接將互動訊號寫入向量鍵值 | 錯誤閘門會將惡意內容或幻覺永久編碼至向量庫中，引發「閘門污染」。 |
| 涉及個人隱私、多租戶隔離或嚴格法規監管之資料集 | **嚴禁採用**：直到建立完整的資料遮蔽與被遺忘語意 | 持久化擴展單元可能編碼使用者的敏感輸入，難以滿足個資刪除合規要求。 |
| 缺乏鍵值級別 Provenance、TTL 與秒級回滾機制之架構 | **嚴禁採用**：不可在無防禦架構下部署可變索引 | 一旦線上向量發生不可預測的語意漂移，若無增量日誌將無法實現逆向修復。 |

### 真正的核心風險：閘門污染（Gate Contamination）

ERM 論文標題強調「without forgetting」，但向量範數受限僅能保證數值不會溢位，絕不等於語意保持正確。

一旦正確性閘門判定失準（例如生成模型產生了似是而非的幻覺，但評判模型給出高分；或者點擊率被誤當成正確答案），錯誤的擴展語句就會被持久化賦予對應文件的鍵值。這帶來兩大系統性不對稱風險：

1. **熱門意圖的錯誤自我強化**：高頻熱門查詢雖然能迅速攤提成本，但也具備足夠的流量反覆強化早期的錯誤歸因；相反地，冷門長尾意圖往往難以累積足夠的驗證次數，在整體平均指標上升的同時，長尾體驗反而持續惡化。
2. **新舊詞彙的語意壓制**：累積了大量歷史擴展權重的既有鍵值，可能在向量空間形成過強的吸引子，壓制新發布產品或業務術語的正常召回。

### Bloss0m 落地防護架構規範

任何考慮引入 ERM 思路的生產系統，必須落實以下四項架構鐵律：

1. **服務證據與學習證據嚴格解耦**：單次問答允許使用的生成內容，絕不能自動取得寫入索引庫的權限。所有寫入候選單元必須暫存在獨立的緩衝佇列中。
2. **多會話獨立支持次數（Support Count $\ge K$）**：同一擴展單元必須在不同使用者、不同會話且彼此時間間隔的多次查詢中均通過高門檻驗證，方可觸發一次鍵值更新。
3. **不可變增量日誌（Immutable Delta Log）與 TTL**：向量底座必須以日誌結構保存每次鍵值變更：記錄時間戳、原始查詢雜湊、通過的驗證器版本、歸因權重與增量向量。所有增量設定生存週期（TTL），定期衰減。
4. **即時熔斷與版本化快照回滾（Kill Switch）**：回滾操作必須直接切換至歷史快照或剝離 Delta Log，**絕對不要試圖在線上運行的活躍向量上以反向向量相減進行修補**。

## 讀完後的三個記憶點 / Three things to remember

1. **技術本質**：ERM 是免訓練、驗證驅動的索引鍵值演化機制，而非檢索器參數的持續學習；它透過正確性閘門與選擇性邊際增益，將在線擴展經驗轉化為文件的持久特徵。
2. **實證表現**：在 13 個基準領域中，ERM 顯著縮窄檢索表徵落差（BM25 平均 nDCG@1 提升 46%、密集模型提升 11–15%），並維持 150–180 ms 的原生檢索低延遲。
3. **落地底線**：可變索引的核心威脅是「閘門污染」；缺乏獨立多輪驗證、不可變增量日誌與秒級快照回滾能力前，切勿將線上互動反饋直接開放寫入生產索引庫。

## Primary sources

- **論文全文與原始出處**：
  - [Hu et al., RAG without Forgetting: Continual Query-Infused Key Memory (arXiv:2602.05152 v1)](https://arxiv.org/abs/2602.05152) 與 [Full HTML/PDF 格式](https://arxiv.org/html/2602.05152v1)：涵蓋 Sections 3–5、Figures 1–4、Tables 1–2、Appendix A 與 Appendix B.1/B.7–B.9。
  - [BEIR benchmark repository](https://github.com/beir-cellar/beir)：獨立評測基準端點。
  - [BRIGHT benchmark repository](https://github.com/SDU-NLP/BRIGHT)：獨立評測基準端點。
- **延伸閱讀與架構對照**：
  - [RAG-MCP 深度精讀](/paper-reading/04-RAG-MCP/)：探討將外部請求安全路由至工具 Schema 的架構決策。兩篇論文在工程邊界上高度呼應：模型生成的暫態訊號在未經客觀錯誤率度量與安全閘門隔離前，絕不可直接昇格為系統的持久運行狀態。
