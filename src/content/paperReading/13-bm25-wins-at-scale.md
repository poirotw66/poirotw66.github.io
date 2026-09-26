---
title: "BM25 在大規模語料中勝出：RAG 範式的擴展研究"
description: "深讀 Wang 等人的 arXiv v3 研究：在固定問題、證據與對抗文件的 28 層企業型語料梯度上，BM25 如何跨過約 1,000 萬語料 token 的交叉點，以及為什麼 agent 應該接在全域候選排序之後。"
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "這不是 BM25 在所有場景都贏，而是研究中的準確率—成本曲線在約 1,000 萬語料 token 之後轉向 BM25。"
  - "在完整 511,959 份文件的配對重測中，Agent+BM25 得分 69.4，原始檔案 agent 僅得 36.9；前者每題約 101K token，後者約 895K。"
  - "圖索引的未完成 tier 不等於答案失敗；這篇論文最核心的工程結論是先做全域候選發現，再把 agentic reasoning 用在縮小後的證據集合。"
audience:
  - "正在設計企業搜尋、RAG 或知識助理的 AI／平台工程師"
  - "需要同時評估檢索品質、延遲、token 成本與索引建置成本的技術負責人"
tags: ["Paper Reading", "RAG", "Information Retrieval", "Enterprise AI", "Benchmark"]
image: "/paperReading/13-bm25-wins-at-scale/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
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

## 90 秒掌握論文 / The paper in 90 seconds

- **問題（Problem）**：檢索增強生成（RAG）的範式比較長期被限制在單一且偏小的語料規模下，掩蓋了準確率、索引建置開銷、查詢 token 消耗與推論延遲隨語料擴展時的非線性變化。
- **核心洞見（Core insight）**：在包含 28 個嚴格巢狀語料層級（1,144 到 511,959 份文件，即 1.7M 至 600.8M tokens）的 EnterpriseRAG-Bench 上，固定評測基準底座（bedrock）與 reader/judge；在約 1,000 萬語料 token 之前，無索引的 File-System Agent 略佔優勢，但在跨過約 10M token 交叉點後，傳統 BM25 展現了穩健的全域候選發現能力，準確率全面領先 DenseRAG 與 File-System Agent。
- **最強證據（Strongest evidence）**：在 511,959 份文件的完整語料配對重測（matched 150-question resweep）中，將檔案探索工具替換為 BM25 候選檢索的 Agent+BM25 得分達 69.4，而原始 File-System Agent 僅 36.9，且每題查詢 token 從 895K 驟降至 101K（約節省 9 倍）；原生 BM25 的全語料官方得分為 50.5，顯著高於 File-System Agent 的 30.7 與 DenseRAG 的 29.9（Section 4.2、Section 5.1、Figure 3、Table 1、Table 4）。
- **主要邊界（Main boundary）**：EnterpriseRAG-Bench 為合成且具企業特徵的語料（500 題與單一主 reader/judge）；問答包含精確命名實體與對抗性陷阱，天然有利於詞彙檢索；且截至查核日期未確認官方端對端執行環境與資料完整包，結果支持「全域檢索與 agent 推理分層」，而非「BM25 在所有語義任務中皆優於一切」。

當企業知識庫從幾千份文件擴展到數十萬份時，究竟誰該負責全域候選發現，而代理式推理（agentic reasoning）又該從哪裡介入？過去的架構直覺往往認為，隨著語言模型與工具調用能力的進步，讓 agent 在檔案樹中自主巡覽或直接構建知識圖譜是終極解法；然而，Wang 等人的這項擴展性研究表明，全域檢索的瓶頸往往不是推理，而是候選曝光。本文依據 arXiv:2607.26497v3（2026-07-29 提交，2026-07-31 修訂；為未經同儕審查的預印本）進行深入剖析。

> **花花的一句話**
>
> 大語料的第一個瓶頸不是 agent 會不會推理，而是它能不能先碰到正確的文件；把 agent 接在 BM25 的全域候選排序後面，通常比讓它在檔案樹裡逐步摸索更可控。

## 理解前需要知道什麼 / What to know first

在閱讀這項研究的實驗數據之前，必須先釐清本文涉及的評測維度、檢索基質與既有研究的限制：

1. **巢狀語料層級（Nested Corpus Ladder）**：評測基準並非隨機採樣不同規模，而是建立一個固定的「基準底座（bedrock）」，內含 500 個評測問題、722 份 gold documents、326 個 traps（語意相似但事實錯誤的干擾文檔）與 99 個 lures（無答案查詢的誘餌文檔），最小層級去重後為 1,144 份文件。在此之上，以約 1.25 倍幾何級數按固定來源與雜訊分層逐步注入背景干擾文件，形成 28 個嚴格巢狀層級，最高達 511,959 份文件（600.8M tokens）。
2. **四種核心檢索範式（Four Retrieval Paradigms）**：
   - **詞彙檢索（Lexical）**：以 BM25 倒排索引為代表，零生成式建置成本。
   - **密集檢索（Dense）**：以 DenseRAG 為代表，採用 Qwen3-Embedding-0.6B 將切塊（chunk）映射至向量空間進行最近鄰搜尋。
   - **圖檢索（Graph-based）**：包含 HippoRAG 2、MS-GraphRAG、LightRAG 與 LinearRAG，依賴 LLM 抽取實體與關係社群構建結構化索引。
   - **代理式檢索（Agentic / File-System Agent）**：不預先建立全域索引，由 LLM policy 透過 `ls`、`grep`、`view` 等檔案系統工具進行多輪互動式走訪。
3. **配對替換控制（Retrieval-Swap Control）**：為了驗證效能差異究竟來自「檢索基質（retrieval substrate）」還是「推理策略（agent policy）」，研究設計了對照實驗：保持完全相同的 agent harness、模型、系統提示詞與 80 次調用上限，僅將底層工具由原始檔案搜尋替換為 BM25 top-5 檢索工具（Agent+BM25）。

### 既有方法的評測盲點：為什麼單一規模的基準不夠

傳統 RAG benchmark（如早期的 BEIR、HotpotQA 或各類企業內部 POC）通常只在單一固定的語料庫大小（多半介於 1,000 到 10,000 份文件）上評估。這種做法存在顯著盲點：
- **掩蓋建置與維護成本的非線性爆炸**：在數千份文件時，GraphRAG 的實體抽取開銷尚在可承受範圍；但當語料擴大到數十萬份時，其生成式建置 token 與計算時間會迅速撞上指數級或高次冪的瓶頸。
- **美化循序探索政策（Sequential Policy）的表現**：在小型檔案目錄中，檔案系統 agent 憑藉少量 `ls` 與 `grep` 就能撞見目標文檔；然而在巨大語料庫中，目錄分支極度繁雜，任何一步路徑偏離都會導致 agent 在錯誤的子樹中徒耗預算。
- **忽視干擾噪聲對密集檢索的稀釋效應**：密集向量空間在高維度下隨著負樣本與對抗干擾文檔的大量注入，top-k 的語意辨識度會大幅下降。

因此，單一規模的測試無法回答真實系統架構中最關鍵的決策：隨著數據量增長，各範式的成本—準確率曲線何時會發生交叉？

## 核心直覺 / Core intuition

要理解這篇論文的發現，關鍵在於理解「全域候選發現（Global Candidate Discovery）」與「局部證據推理（Agentic Evidence Reasoning）」在計算複雜度上的根本差異。

在過去的架構直覺中，開發者常有一種技術偏好：認為既然前沿 LLM 具備極強的推理與規劃能力，那麼賦予它檔案瀏覽工具，它就能像資深維運工程師一樣自行尋找蛛絲馬跡；或是認為知識圖譜能夠捕捉複雜關係，因此必須將所有企業文檔轉化為圖結構。

然而，本文實驗揭示了真實世界的殘酷幾何規律：
1. **File-System Agent 本質上是在龐大決策樹上進行隨機與啟發式漫步**：在 511,959 份文件的檔案樹中，若沒有全域倒排索引，agent 必須面對成千上萬個目錄。一旦前兩步被檔名誤導進入了錯誤的子資料夾，後續耗費的 10 次、20 次工具調用都只是在局部無關空間中做無用功。這是一種嚴重的循序決策放大效應（error cascade）。
2. **BM25 倒排索引提供近乎無成本的全域空間剪枝**：倒排索引能在毫秒級時間內，利用詞頻（TF）與反向文件頻率（IDF），將整個 500,000 份文檔的搜尋空間瞬間縮小到最具可能性的 top-5 或 top-10 候選區間。它不需要理解語義，只要文檔中包含精確的名詞、專案代號或條款編號，它就能將候選文檔暴露在最前端。
3. **Agent 應該擔任「法官」而非「巡警」**：Agentic reasoning 真正的價值，是在已經被篩選出來的 5 到 10 份候選文檔中，比對不同版本的衝突、檢查細節條款的完整度、辨識陷阱文檔的虛假資訊。讓 agent 同時負擔全域搜尋與局部推理，是資源與能力的錯配。

簡言之，**不是 BM25 比 Agent 更聰明，而是 BM25 在大尺度下的全域候選發現效率完勝無索引的檔案瀏覽**；而當我們把兩者結合（Agent+BM25），系統便同時擁有了 BM25 的全域曝光能力與 Agent 的深度辨析能力。

## 用一個例子走完整個方法 / Walk one example through the method

為了具體展示這種機制差異，我們以一個典型的企業客服與政策查詢場景走完整個流程：

1. **輸入（Input）**：
   - 查詢問題：「在 Acme 企業內部規範中，2025 年第三季針對遠距辦公同仁的居家網路資安設備補貼，其申請例外流程與最高額度為何？」
   - 語料環境：511,959 份混合企業文檔（包含 Jira 工單、Slack 溝通紀錄、Wiki 頁面、已廢棄的 2024 年草案、惡意干擾的 trap 文檔以及真正的 2025 Q3 政策正式核定版）。
2. **中間表徵（Intermediate representation）**：
   - *BM25 檢索層*：將查詢分詞為「Acme」、「2025 Q3」、「遠距辦公」、「網路資安設備」、「補貼額度」、「例外流程」。在倒排索引中快速定位包含這些關鍵詞的文檔，藉由 IDF 權重壓低常見詞，拉高「2025 Q3」與「資安設備補貼」的權重，產生全域 top-5 候選片段。
   - *原始檔案系統層（對照組）*：文檔被組織在深層目錄結構中（例如 `/company/it/security/policies/2025/`、`/hr/benefits/remote/archive/` 等）。
3. **決策與轉換（Decision or transformation）**：
   - *原始 File-System Agent 的行為*：Agent 首先調用 `ls("/company/policies")`，看到多個資料夾；它猜測應屬於 HR 部門，因而調用 `cd("/hr/benefits")`；在其中發現了一份名為 `remote_stipend_guidelines.md` 的文件，但那是 2024 年的舊版；Agent 接著在該目錄下搜尋，被檔名類似的 decoy 吸引，耗費了 25 次 LLM 工具呼叫。在經歷多次 context 膨脹與局部探索後，因達到最大調用限制（80 次 calls）或被 trap 文檔誤導，做出截斷或錯誤結論。
   - *Agent+BM25 的行為*：Agent 的首次檢索工具調用被強制傳入原始查詢，BM25 直接自 511,959 份文件中精準撈回 5 份候選（包含 2025 Q3 正式核定版、一份相似但事實相反的 trap 文檔、以及相關申請表格）。Agent 接收到這 5 份候選後，利用其 reasoning 能力進行比對，迅速指出 trap 文檔上的簽署人未經授權，並從正式核定版中提取出「最高額度 1,500 美元」與「需由資安副總專案核可」的正確例外條款。
4. **輸出（Output）**：
   - 系統輸出格式完整且具備 atomic completeness 的答案，精確命中 gold answer 的所有事實，同時明確警示舊版與無效條款的差異。
5. **可能失敗點（Likely failure point）**：
   - *詞彙鴻溝（Vocabulary Mismatch）*：若使用者提問使用了完全不同的口語或同義詞（例如「在家上班 wifi 路由器報銷」），而企業內部正式文檔嚴格使用「遠端作業資訊通信硬體津貼」，BM25 的詞彙匹配可能在 top-5 中完全落空。此時若無語義擴展或 Dense/Hybrid 補足，後續的 Agent 將無從推理。

## 技術機制 / Technical mechanism

Wang 等人的研究在實驗設計上有極高的控制標準，其技術核心主要由以下四個模組組成：

### 1. 語料梯隊與巢狀階梯設計（Corpus Ladder Architecture）

評測基準 EnterpriseRAG-Bench 構建了一個可精確追蹤的合成企業語料庫：
- **Bedrock（基準底座）**：由 500 個評測問題、722 份 gold documents、326 個語意誘騙 traps、99 個 not-found lures 以及兩個組織架構概覽構成。在移除跨類別重複後，基底大小為 $N_0 = 1,144$ 份文檔（約 1.7M tokens）。
- **巢狀擴展階梯**：定義階梯集合 $\{T_i\}_{i=0}^{27}$，文檔數量按幾何級數遞增：
  $$ N_i \approx N_0 \times (1.25)^i $$
  從階梯 0 的 1,144 份文件擴展至階梯 27 的 511,959 份文件（600.8M tokens）。所有 500 個問題及其 gold/trap/lure 文檔在每一階梯中嚴格保持固定，僅依據預先定義的來源（wiki、email、ticket、chat、meeting 等）與噪聲分層注入背景干擾文檔。這種設計保證了跨階梯的準確率變化純粹反映「語料規模擴展帶來的干擾」，而非測試集內容的漂移。

### 2. BM25 評分機制與參數配置

BM25 在系統中作為稀疏檢索基線。對於查詢 $Q = \{q_1, q_2, \dots, q_m\}$ 與語料庫中的文檔 $D$，其相關性評分計算如下：

$$ \text{Score}(D, Q) = \sum_{i=1}^{m} \text{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)} $$

其中反向文件頻率採用標準形式：

$$ \text{IDF}(q_i) = \ln \left( \frac{N - n(q_i) + 0.5}{n(q_i) + 0.5} + 1 \right) $$

- $f(q_i, D)$ 為查詢詞 $q_i$ 在文檔 $D$ 中的出現頻率。
- $|D|$ 與 $\text{avgdl}$ 分別為文檔長度與語料庫平均文檔長度。
- 實驗中設定參數 $k_1 = 1.5, b = 0.75$。在 $N$ 增長至 50 萬時，非特異性通用詞的 IDF 被極度壓縮，而特定命名實體的權重優勢顯著擴大。

### 3. 七種原生檢索範式

論文橫跨四個技術方向部署了七種原生 pipeline：
- **BM25**：經典倒排索引，top-5 chunks 直接送入 reader。
- **DenseRAG**：採用 Qwen3-Embedding-0.6B，以 1,200 tokenizer-token 切塊、100 token 重疊進行向量檢索，取回 top-5 chunks。
- **HippoRAG 2**：結合神經網絡與海馬體記憶機制的圖檢索。
- **MS-GraphRAG**：微軟開源的圖檢索框架，使用 LLM 進行實體關係抽取與社群摘要。
- **LightRAG**：輕量化雙層圖檢索。
- **LinearRAG**：不調用生成式 LLM 進行建置，改採本機 NER 與 embeddings 構建圖結構。
- **File-System Agent**：以 Qwen3.6-27B 為 policy 模型，提供專屬 tools（`ls`、`grep`、`view`），每題給予最多 80 次 LLM 調用預算。

### 4. 共享評測 Harness 與計量標準

為了避免 reader 能力成為干擾變因，所有檢索範式（除 File-System Agent 需自主探索外）均接入同一個共享 Reader：
- **模型**：Qwen3.6-27B，透過 vLLM 部署，推論設定 temperature = 0，thinking disabled。
- **官方評測指標（Official Combined Score）**：由獨立的 LLM Judge 進行兩階段判定。第一階段驗證生成的答案是否與 gold answer 在語義上對齊（alignment）；若對齊，第二階段逐一檢驗原子事實的完整度（completeness）。若第一階段被判定不對齊，completeness 評分直接歸零。
- **Document Recall**：在可回答問題上，計算系統檢索出的文檔 ID 集合與 gold document IDs 的精確集合交集率。
- **成本與延遲計量**：將建置生成 tokens、建置 embedding tokens、查詢 tokens、LLM API 調用次數以及單執行緒在空載伺服器上的推論延遲（latency）全面分開記帳。

## 實驗如何讀 / How to read the evidence

解讀這篇論文的實驗數據，不能只看單一排名的勝負，而必須將準確率、階梯規模、建置代價與題型切片綜合觀察：

### 1. 主階梯準確率與交叉點（Section 4.2、Table 1、Figure 3）

在基準底座（$N_0 = 1,144$）上，File-System Agent 取得了 77.4 的點估計，高於 BM25 的 74.7；然而兩者的 95% 信賴區間分別為 73.9–80.8 與 71.4–77.9，彼此重疊，這證明在極小規模下 BM25 並沒有絕對優勢。

然而，隨著語料庫階梯上升，兩條曲線在約 1,000 萬語料 tokens（約 $N = 8,750$ 份文件）附近發生交叉。在完整 511,959 份文件的全語料尺度下，BM25 的官方得分維持在 50.5，而 File-System Agent 下跌至 30.7，DenseRAG 跌至 29.9。

![Figure 3：nested corpus ladder 上的 official combined score](https://arxiv.org/html/2607.26497v3/x3.png)

*圖 1（原文 Figure 3，§4.2）：官方 combined score 與 95% confidence bands；曲線在約 10M token 附近交叉，圖方法在各自最大可行 tier 結束。來源：[arXiv HTML Figure 3](https://arxiv.org/html/2607.26497v3#S4.F3)，圖像依 [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) 提供，保留作者與來源標示。*

解讀此圖時需注意：
- 「約 10M tokens」是 Appendix D 明確說明的整數化區間標記（rounded regime marker），代表相鄰已測量階梯的點估計排序改變，並非經過回歸擬合的剛性物理閾值。
- 圖方法的曲線提早中斷（HippoRAG 2 止於 131,876 文件，MS-GraphRAG 止於 8,750 文件，LightRAG 止於 2,254 文件）。表格中的破折號代表**未能完成索引建置或評測**，絕不應解讀為得分為零。

### 2. 索引建置成本的冪律壁壘（Section 4.4、Table 2、Figure 4）

圖檢索在大語料下的最大障礙不是檢索準確度，而是部署前的建置代價。論文利用冪律公式 $C(x) = a \cdot x^b$ 對已完成的階梯進行 token 消耗擬合：

![Figure 4 左圖：construction token scaling](https://arxiv.org/html/2607.26497v3/x4.png)

*圖 2（原文 Figure 4 左圖，§4.4）：建置 token 與 fitted power laws；embedding-only builder 的 hollow marker 不應被讀成零 CPU 或零儲存成本。來源：[arXiv HTML Figure 4](https://arxiv.org/html/2607.26497v3#S4.F4)，圖像依 [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) 提供，保留作者與來源標示。*

- HippoRAG 2 的建置成本近似線性（$b = 1.01$），外推至全語料需消耗約 2.9B 生成 tokens，約折合 3 個單實例天（single-instance days）。
- MS-GraphRAG 外推至全語料需約 7.9B 生成 tokens（約 50 個實例天）。
- LightRAG 由於其密集的兩層抽取（$b = 1.36$），外推至全語料將消耗驚人的 102B tokens，相當於 4 個實例年（instance-years）。
- 必須強調：LinearRAG 與 DenseRAG 在生成 tokens 上標記為空心點（0 token），但 DenseRAG 在全語料建置中仍消耗了 659.4M 的 embedding tokens。零生成 token 不等於零硬體運算、零儲存或零前處理開銷。

### 3. 查詢成本與調用耗盡分析（Section 4.4、Table 3）

在查詢階段，BM25、DenseRAG 與 HippoRAG 2 每題消耗的 query tokens 穩定維持在 5.8K、4.9K 與 6.5K 左右，主要由傳入 Qwen3.6-27B reader 的 top-5 chunks 上下文主導。

相反地，File-System Agent 的每題查詢 token 從基準底座的 226K 劇增至 $N=21,614$ 階梯的 343K（達 BM25 的 60 倍）。當語料擴大時，agent 的探索深度加劇，其預算耗盡率（達到 80 次調用上限）在 $N=131,876$ 時達到 15%，在全語料下高達 31%。更關鍵的是，作者在過濾掉所有耗盡預算的問題後進行單獨評估，發現 File-System Agent 的準確率依然明顯下降，證明其性能潰敗是搜尋空間過大導致的策略迷航，而不只是預算截斷所致。

### 4. 題型細分：BM25 不是萬能解（Section 4.5、Figure 5）

在 $N=42,587$ 階梯上針對 9 種問題類型的細分評測（Figure 5 右圖）提供了極具價值的反例：

![Figure 5 右圖：依問題類型的 official combined score](https://arxiv.org/html/2607.26497v3/x7.png)

*圖 3（原文 Figure 5 右圖，§4.5）：(N=42{,}587) 的 question-type slice；圖中標出各題型題數，且 MS-GraphRAG／LightRAG 在此 tier 無法完成建置。來源：[arXiv HTML Figure 5](https://arxiv.org/html/2607.26497v3#S4.F5)，圖像依 [arXiv perpetual, non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) 提供，保留作者與來源標示。*

- File-System Agent 在四種題型中依然顯著勝過 BM25：**文檔內整合（intra-document）**、**專案關聯（project-related）**、**事實完整度（completeness）** 與 **衝突資訊對比（conflicting-information）**。特別是在 completeness 題型上，Agent 得分 56，遠高於 BM25 的 27。
- BM25 則在單點事實查找、明確實體查詢等其餘 5 種題型中大幅勝出。
- 此外，BM25 在「查無此資訊（not-found）」題型上獲得高分，主要是因為 one-shot reader 在檢索證據不足時傾向於拒答（abstention）；而 agent 反覆探索時更容易做出未經證實的過度承諾。

### 5. 配對替換控制：隔離檢索基質與代理（Section 5.1、Table 4）

全篇論文最具工程指導價值的數據來自 Table 4 的配對替換實驗。在相同的 150 個問題上，研究者將 File-System Agent 的底層工具換成 BM25 top-5 檢索，其全語料尺度下的官方重測結果如下：

| 檢索基質與配置 | Bedrock 得分 | Full-scale 得分 | Full-scale 文件召回率 | 平均調用次數／題 | 平均 Token 消耗／題 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 原生 BM25（單次 Reader） | 81.3 | 54.8 | 65.6% | 1.00 | 5.8K |
| 原始 File-System Agent | 87.1 | 36.9 | 36.8% | 36.12 | 895K |
| **Agent + BM25 候選工具** | **90.1** | **69.4** | **72.4%** | **5.79** | **101K** |

這組數據揭示了極其深刻的事實：
- 當 File-System Agent 被賦予 BM25 作為候選檢索工具後，得分從 36.9 躍升至 69.4，文件召回率從 36.8% 倍增至 72.4%，而查詢 token 消耗減少了近 9 倍。
- 更具啟發性的是「條件命中分析」：在兩者「至少找到一份 gold document」的問題子集上，原始 File-System Agent 的答案得分為 85.9，甚至高於 BM25 的 73.8！然而在全語料下，File-System Agent 找到至少一份 gold document 的機率跌至 39.0%，而 BM25 依然高達 71.6%。
- 這證明了一件事：**Agent 的文本理解與衝突推理能力從未衰退，它在大語料下失敗的唯一原因，是它在第一步根本摸不到正確的文件。**

## 證據地圖 / Evidence map

為了避免將局部 benchmark 的結論過度外推，我們將本篇研究的論述嚴格拆解為四個邊界分明的部分：

### 論文直接證據 / Direct paper evidence

以下為論文實驗數據在特定條件下直接支持的事實：
1. 在 EnterpriseRAG-Bench 的 28 層巢狀語料梯隊中，BM25 與 File-System Agent 的官方得分曲線在約 1,000 萬語料 tokens 處發生交叉；大於此規模時，BM25 顯著優於 File-System Agent 與 DenseRAG（Section 4.2、Table 1、Figure 3）。
2. 在 511,959 份文件的全語料尺度下，將相同的 Agent harness 接入 BM25 候選檢索工具（Agent+BM25），其得分（69.4）與召回率（72.4%）大幅超越純檔案探索（36.9 與 36.8%），每題查詢 tokens 從 895K 降至 101K（Section 5.1、Table 4）。
3. 圖檢索系統（MS-GraphRAG、LightRAG）隨語料增長呈現嚴苛的生成式建置 token 冪律擴展，導致其在較大階梯上無法完成索引構建（Section 4.4、Table 2、Figure 4）。
4. 在 $N=42,587$ 階梯的細分題型中，File-System Agent 在 completeness、conflicting-information 與 intra-document 題型上得分超越 BM25（Section 4.5、Figure 5）。

### 作者因果解讀 / Author causal claims

以下為論文作者基於上述數據提出的解釋性觀點與機制假說：
1. 作者認為無索引的檔案探索之所以隨規模擴展而崩潰，主因是「循序決策政策（sequential policy）在龐大狀態空間中的誤差級聯」，且前置錯誤導致在無關局部樹中過度消耗 token。
2. 作者將 BM25 在大語料下的勝出，歸因於倒排索引提供了無狀態、可預測且計算開銷固定的全域候選發現能力。
3. 作者認為圖檢索在企業落地中的首要阻礙是「建置期可完成性（build feasibility）」，若無有效的分區或增量索引機制，其高階梯評估在工程上難以成立。

### 論文未證明 / Unsupported claims

以下為**本篇論文並未證明、且讀者不應過度腦補**的宣稱：
1. **未證明「BM25 在所有企業環境與所有查詢下皆勝過 Dense 或 Graph」**：EnterpriseRAG-Bench 題型包含高比例的精確命名實體，對抗樣本亦以事實性陷阱為主，這天然放大了詞彙檢索的優勢。論文並未證明在大量同義詞改寫、口語化模糊搜尋或多語言情境下 BM25 仍能勝出。
2. **未證明「GraphRAG 完全不具生產價值」**：圖方法在高階梯的缺失純粹是計算預算與單實例建置限制的結果；若企業具備充足離線算力或採用增量抽取架構，圖檢索在複雜實體關聯上的潛力並未被否定。
3. **未證明「Agentic 檢索方法應被廢棄」**：相反地，Agent+BM25 獲得了全篇最高分（69.4），證明了 Agent 在高品質全域候選之後的推理價值無可替代。
4. **未證明真實生產環境中的端對端表現**：基準測試採用合成企業文檔，未涵蓋真實系統中的即時動態更新、複雜 ACL 角色權限過濾、網路波動與多租戶併發隔離。

### Bloss0m 工程化整理 / Bloss0m engineering synthesis

基於上述證據邊界，Bloss0m 提出以下面向生產系統的架構整理：
- **職責分離原則**：將 RAG 系統劃分為「全域候選發現（Layer 1）」與「深度證據推理（Layer 2）」。Layer 1 應採用確定性高、開銷低、易於快取與水平擴展的索引（如 BM25 + 向量雙路檢索）；Layer 2 再調用具備 agentic loop 的模型進行衝突消除與事實綜合。
- **題型感知路由**：對於事實檢索與單點定義查詢，直接由 BM25 + Reader 提供低延遲服務；對於跨文檔聚合與衝突比對，觸發 Agentic 推理層。

## Artifact 與可重現性 / Artifacts and reproducibility

截至 **2026-08-09** 的公開端點查核狀態如下：
- **論文原始文檔**：arXiv v3 的 [PDF](https://arxiv.org/pdf/2607.26497v3)、[HTML](https://arxiv.org/html/2607.26497v3) 與 [TeX source archive](https://arxiv.org/src/2607.26497v3) 均可公開存取，包含完整的論文主體、附錄與七張原始圖表素材。
- **基準測試代碼與問題集**：EnterpriseRAG-Bench 的 [GitHub repository](https://github.com/onyx-dot-app/EnterpriseRAG-Bench) 公開可用（採用 MIT 授權），內含評測架構、`questions.jsonl`、快速上手指南與資料集下載說明。
- **語料數據端點**：EnterpriseRAG-Bench 在 [Hugging Face](https://huggingface.co/datasets/onyx-dot-app/EnterpriseRAG-Bench) 上託管了資料集；截至查核日期，檔案清單與部分文檔預覽可存取，但其網頁端預覽工具偶有伺服器不穩定情形，可透過官方腳本直接下載 zip/release 包。
- **論文專屬執行封裝**：作者在 Appendix L/M 中提及的特定內部實驗路徑（如 `results/...`、`scripts/...`）以及 exact serving images 未隨 arXiv 來源包完整釋出。
- **獨立重現範疇**：本文所引述之所有數值均為作者在 arXiv:2607.26497v3 中報告之數據，本文未在本地重跑完整 28 層階梯之 GPU 評測。工程團隊若欲在內部進行最小化驗證，建議自官方 GitHub 下載資料集後，抽取 3 到 4 個具代表性的階梯（如 1K、10K、50K 文件），固定模型與 reader 進行 BM25 與 Agent 的配對重測。

## Bloss0m 工程判斷與不適用條件 / Bloss0m engineering judgment and when not to use it

基於論文的嚴格控制與邊界分析，Bloss0m 提出以下工程落地判斷與防禦性決策規則：

### 1. 什麼時候應優先採用「BM25 候選發現 + 後置 Agent」架構？
- **語料特徵具有高密度命名實體**：例如企業內部的 API 文檔、故障排除工單、料號清單、法規政策條款。這些場景中精確的專有名詞是天然的定位錨點，BM25 能以極低成本在毫秒級內精準曝光候選。
- **嚴格限制營運成本與查詢延遲**：若系統 SLA 要求 p95 延遲低於 1.5 秒且查詢量龐大，純 Agent 檔案漫步的高昂 token 與多次迴圈完全不可行。先以 BM25 縮小至 top-5，再交給輕量 reader，能將推論成本鎖定在 6K tokens 以內。
- **需要精確的權限過濾（ACL Filtering）**：倒排索引在企業級搜尋引擎（如 Elasticsearch、OpenSearch）中能極其高效地與布林權限標籤結合，避免向量空間或自主探索中出現的越權洩露問題。

### 2. 不適用條件：什麼時候不要只依賴 BM25？
- **嚴重的詞彙鴻溝（Vocabulary Mismatch）**：使用者查詢充滿口語、同義改寫或跨語言提問（例如用中文查詢英文代碼庫），BM25 的召回率會急劇退化。此時必須部署 Dense 向量檢索或以 HyDE（Hypothetical Document Embeddings）進行前置查詢擴展。
- **複雜的多跳實體推理（Multi-hop Relational Reasoning）**：當問題的答案散落在不同系統的五份關注文檔中，且必須依循「A 的負責人是 B，B 參與了專案 C，C 依賴模組 D」此種關係鏈時，BM25 單純基於詞頻的排序無法將整條鏈路完整召回，此時應審慎評估圖檢索（GraphRAG）或結構化知識庫。
- **跨文檔事實完整度（Completeness）要求極高**：正如 Figure 5 所展示，在 completeness 題型上，純 BM25 表現落後於具備自主翻閱能力的 Agent。若任務需求是「匯整全公司所有關於某專案的開會結論」，系統必須引入多輪 agentic 閱讀或聚合查詢機制。

> **花花的工程提醒**
>
> 把「可完成性」與「已答錯」分開記錄。圖索引沒有建完，是 deployment coverage 問題；找到證據卻答錯，是 synthesis 或 judge 問題。兩者混成一個 0 分，會讓架構決策失真。

## 讀完後的三個記憶點 / Three things to remember

1. **技術思想（Technical idea）**：全域候選發現（Global Candidate Discovery）與證據推理（Agentic Evidence Reasoning）在工程上必須明確分層；切勿讓 LLM agent 在無索引的檔案樹中盲目巡邏，而應將 agent 部署於確定性檢索所縮小的高品質候選集之上。
2. **核心證據（Evidence）**：在 511,959 份文件的配對實驗中，Agent+BM25 取得了 69.4 分與 72.4% 召回率，每題消耗 101K tokens；相較之下，原始檔案 agent 僅得 36.9 分，每題消耗高達 895K tokens。兩者在約 1,000 萬語料 tokens 處形成關鍵的分水嶺交叉。
3. **適用邊界（Boundary）**：本研究的絕對分數受限於合成企業語料與特定實體題型分佈；圖索引的中斷反映了建置壁壘而非性能失效；在面對跨語言、口語化改寫與深層實體關聯時，依然需要混合檢索（Hybrid）與語義重排（Reranker）的協同支持。

## Primary sources

- **Wang et al., BM25 Wins at Scale: A Scaling Study of Retrieval-Augmented Generation Paradigms**：
  - [arXiv:2607.26497 record](https://arxiv.org/abs/2607.26497)
  - [arXiv:2607.26497v3 full HTML](https://arxiv.org/html/2607.26497v3)
  - [arXiv:2607.26497v3 PDF](https://arxiv.org/pdf/2607.26497v3)
  - [arXiv:2607.26497v3 TeX source archive](https://arxiv.org/src/2607.26497v3)
  - [arXiv non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html)
- **EnterpriseRAG-Bench 評測基準**：
  - [EnterpriseRAG-Bench GitHub Repository](https://github.com/onyx-dot-app/EnterpriseRAG-Bench)
  - [EnterpriseRAG-Bench Hugging Face Dataset](https://huggingface.co/datasets/onyx-dot-app/EnterpriseRAG-Bench)
- **Bloss0m 延伸閱讀**：
  - [RAG vs. GraphRAG 的系統性評估](/paper-reading/07-GraphRAG-vs-RAG/)
  - [Enterprise RAG 實作指南](/blog/65-enterprise-rag-guide/)
  - [Agentic RAG 架構實踐](/blog/07-agentic-rag/)
