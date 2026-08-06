---
title: "AskChem：把文獻檢索單位改成帶來源的 claim"
description: "精讀 AskChem 如何以帶有 DOI、原文引句與 evidence locator 的 atomic claim 取代 paper／chunk 作為檢索單位，並檢查它在 30 題 AskChem-Bench 上改善了什麼、沒有證明什麼。"
pubDate: 2026-08-07
updatedDate: 2026-08-07
tldr:
  - "AskChem 把 claim、來源 DOI、原文引句或 evidence locator 綁成可重用的檢索物件，再用 faceted taxonomy 與 evidence graph 組織跨論文搜尋。"
  - "AskChem-Bench 的 30 題中，AskChem-grounded GPT-5.5 的 DOI existence 是 100%，LLM-only 是 88.3%；但 Edison Scientific 提供更多帶數值的 grounded detail，且 on-topic 略高。"
  - "這篇論文證明的是可追溯的檢索與介面設計，不是 claim extraction 一定正確，也不是 provenance 已經等於科學事實。"
  - "截至 2026-08-07，原始碼、API、benchmark JSON 與資料集頁面可存取；完整資料庫很大，且尚未建立可重現公開服務的成本、延遲與更新基線。"
audience:
  - "設計 production RAG、科學搜尋或 agent-facing knowledge service 的 AI 工程師。"
  - "需要把 citation、provenance、跨文件關係與檢索評估拆開閱讀的研究者與技術主管。"
tags: ["Paper Reading", "RAG", "Claim-Centered Retrieval", "Chemistry", "Evidence Graph", "Benchmark"]
field: "NLP"
difficulty: "advanced"
showToc: true
paper:
  title: "AskChem: Claim-Centered Infrastructure for Chemistry Literature Synthesis"
  authors:
    - "Bing Yan"
    - "Gregory Wolfe"
    - "Stefano Martiniani"
    - "Kyunghyun Cho"
  year: 2026
  venue: "arXiv cs.CL preprint, v1 (2026-07-30)"
  links:
    pdf: "https://arxiv.org/pdf/2607.28618v1"
    arxiv: "https://arxiv.org/abs/2607.28618"
    code: "https://github.com/bingyan4science/askchem"
    project: "https://askchem.org"
series:
  id: "retrieval-systems"
  title: "檢索系統"
  part: 1
  totalParts: 1
---

如果一個研究問題的答案分散在數十篇論文裡，搜尋結果只給 paper title 或 chunk，接下來的定位、核對與跨文獻整理仍然由人或 agent 自己完成。AskChem 的問題意識是：**能不能把「帶有來源的科學 claim」本身變成可搜尋、可瀏覽、可連結、可交給 agent 重用的基礎物件？**

> **花花的工程提醒**
>
> Provenance 先把「這句話從哪裡來」固定下來；它不會自動回答「這句話是否正確」。在任何科學工作流裡，來源可追溯與語義正確都要各自驗證。

## 先回答讀者問題：把 retrieval unit 改成 claim，究竟改了什麼？

**讀者問題：What changes when a retrieval system indexes provenance-carrying claims instead of documents or chunks?**

我的短答是：它把 retrieval 的輸出從「可能相關的上下文片段」改成「可直接檢查的證據候選」。AskChem 的 claim 是一個 atomic、typed assertion；每個 claim 連到來源 DOI、verbatim quote，或在全文中不能以連續句子表示時使用的 `evidence_locator`。同一個 claim identity 再被放進穩定的 faceted taxonomy、跨論文 evidence graph，以及較具探索性的 Living Taxonomy。

這個轉換的工程價值，不在於 claim 這個詞本身，而在於它把 provenance、結構化欄位、分類路徑與關係邊一起保存。搜尋、瀏覽、API、SDK 與 MCP 都可以回傳同一個 claim object。可是論文的實驗只直接支持「較容易追溯與組裝」；它沒有證明 extraction 的語義一定正確，也沒有把 taxonomy、vector retrieval、paper recall 與生成器逐一做乾淨的因果拆解。

## Paper identity、狀態與問題定義

AskChem 是 Bing Yan、Gregory Wolfe、Stefano Martiniani 與 Kyunghyun Cho 的 **arXiv cs.CL v1 preprint**，2026-07-30 提交；截至本文日期沒有把它當成已接受的 conference paper。完整原文可讀 [arXiv HTML 版本](https://arxiv.org/html/2607.28618v1) 與 [PDF](https://arxiv.org/pdf/2607.28618v1)。

論文的問題不是再做一個 paper-ranking UI，而是處理 cross-paper synthesis 的中間層：研究者想要的通常是「哪些材料在什麼條件下得到什麼結果、這些結果如何隨時間變化、哪些 claim 互相支持或矛盾」。傳統 document retrieval 將這些操作留給讀者；AskChem 將它們前移到 index 與資料模型。

在 [§1 Introduction](https://arxiv.org/html/2607.28618v1#S1) 與 [§2 Claim-Centered Representation](https://arxiv.org/html/2607.28618v1#S2) 中，論文將 claim 定義成「從 paper 萃取的 atomic、typed scientific assertion」，並記錄 source DOI、引句、結構化欄位與 extraction confidence。這裡要分清三種聲音：

- **Paper evidence：** 目前 live index 被論文描述為 2.4M claims、147K papers、307K taxonomy nodes 與 171,342 typed evidence edges。
- **作者／系統主張：** 這些 claim 可以支援人與 agent 的 search、browse、REST、SDK 與 MCP 工作流，並改善 cross-paper synthesis 的 citation groundedness。
- **Bloss0m 判讀：** 這是一個 evidence-oriented retrieval substrate；它仍需要下游 verifier 或人檢查 claim 的語義、單位、條件、實驗設計與是否適用於目前問題。

## 方法骨架：從全文到可重用的 claim object

把論文的方法縮成一條可實作的 pipeline，大致是：

1. **抽取：** 高吞吐 pipeline 讀 title／abstract；較深的 pipeline 讀 full-text PDF。Appendix B 說明 abstract extractor 使用 GPT-5-mini，deep extractor 使用 Gemini 3.1 Pro 的 native-PDF input 與 Vertex AI batch；早期 legacy slice 還有 GPT-4o／GPT-4o-mini。
2. **驗證格式：** 每次抽取輸出 JSON object，以 claim schema、必要 provenance 欄位、numeric range 與 chemistry-specific 欄位做 validation；invalid JSON 或 schema-invalid output 會 retry。這些 gate 確保欄位存在，不等於確保科學解讀正確。
3. **建立同一個 claim identity 的多個視圖：** Source 保存 DOI、venue、year、citation count 與 OpenAlex 對齊的作者；TreeNode 保存 taxonomy path；Edge 保存 claim-to-claim 的 typed relation。
4. **組織與檢索：** 穩定化的 faceted taxonomy 讓 claim 依 reaction、substance、application、technique、mechanism、claim type、data、time 與 author 等 view 分類；hybrid `/search` 把 FTS5 claim-text、paper-level recall、taxonomy-node recall 與 dense-vector recall 以 reciprocal rank fusion 合併。
5. **跨論文連結與介面：** 第二輪 relation extraction 產生 `supports`、`contradicts`、`extends`、`derives_from` 與 `cites_as_evidence` 邊；同一批 claim objects 再由 web UI、REST、Python SDK 與 MCP 提供給人和 agent。

## Figure 2：真正被保存的是 claim identity，不只是 prompt context

![AskChem Figure 2：claim-centered retrieval 與三種互補結構](https://arxiv.org/html/2607.28618v1/x1.png)

*Figure 2 顯示 claim 作為 retrieval unit，並連到 faceted taxonomy、evidence graph 與 Living Taxonomy。來源：[AskChem Figure 2](https://arxiv.org/html/2607.28618v1#S1.F2)，Bing Yan et al.；依論文頁標示的 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用，檢視日期 2026-08-07。*

這張圖最值得帶走的不是三個漂亮的 UI 名稱，而是 **同一個 claim identity 被不同結構重用**。如果搜尋先找到一個「某催化劑在某條件下有某 Faradaic efficiency」的 claim，接下來可以沿 taxonomy 追同類 claim、沿 evidence graph 找支持或矛盾，並保留 DOI 與原文證據。這比讓 generator 在每次回答時臨時從 chunk 猜出 citation，更容易在回答後做 audit。

Appendix B 給了一個具體 claim record：`claim_id` 為 `7c92fcacd8cb64d4`，來源 DOI 是 `10.1002/anie.201914977`，結構化結果包含 Ni SA-N2-C、CO₂ reduction、98% CO Faradaic efficiency 與 1622 h⁻¹ turnover frequency，並附上 verbatim quote。這是資料模型的示例，不是 AskChem 自己做的化學實驗結果；數值仍必須回到來源 paper 核對。

## Faceted taxonomy、evidence graph 與 Living Taxonomy 的分工

### Faceted taxonomy：讓「同一問題的不同切法」可操作

AskChem 不是把所有 claim 壓成單一的 chemistry ontology。論文 §4 說明，分類路徑是在消化 papers 與 claims 時誘導，再透過 canonical top-level routing、synonym normalization 與 fuzzy clustering 穩定成 persistent L1/L2/L3 paths。比如 `coupling/cross_coupling/suzuki` 同時是瀏覽位置與 taxonomy recall signal。

![AskChem Figure 4：同一主題在多個 operational views 中展開](https://arxiv.org/html/2607.28618v1/x3.png)

*Figure 4 顯示 CO₂ reduction claims 在 reaction、substance、application、technique、mechanism、data、claim type、time、author 與 network 等視圖中的不同切面。來源：[AskChem Figure 4](https://arxiv.org/html/2607.28618v1#S1.F4)，Bing Yan et al.；依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用，檢視日期 2026-08-07。*

這裡的工程含義是：taxonomy 不是只有前端 filter，它會改變 candidate recall 與結果分組。但論文沒有提供 taxonomy-based recall 的獨立 ablation，也沒有報告專家逐筆驗證 taxonomy placement 的結果。因此「路徑穩定」可理解為 operational property，不可直接寫成「分類已經是正確的科學本體」。

### Evidence graph：讓跨 paper 的關係成為可查詢資料

論文 §3 報告 171,342 條 typed edges。作者對分層抽樣的 148 條 edge 做 domain-expert audit，排除 2 條無法判定後，143／146 條 relation type 正確，得到 97.9% edge-type precision。這是 relation label 的小樣本 precision，不是整個圖的 recall，也不是 claim content 的 factual accuracy。

![AskChem Figure 3：corpus-scale provenance 與自動品質檢查](https://arxiv.org/html/2607.28618v1/x2.png)

*Figure 3 概括 deployed index 的 corpus coverage 與 automatic quality checks；原圖自己也提醒，這些統計不能取代專家對 claim semantics 或 taxonomy placement 的判斷。來源：[AskChem Figure 3](https://arxiv.org/html/2607.28618v1#S1.F3)，Bing Yan et al.；依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用，檢視日期 2026-08-07。*

最重要的限制已經寫在論文裡：100% source-grounded 代表 claim 有 claim type、source DOI 與 verbatim quote；它不代表 LLM 沒有誤讀原句。對 production RAG 而言，這是把「沒有 citation」提升成「有 citation、但仍須檢查語義」；不是把 verification boundary 消除了。

### Living Taxonomy：探索性地回答「這個貢獻受什麼原理支配」

Living Taxonomy 與 faceted taxonomy 的問題不同：前者把 paper-grounded leaves 放到 principles、theories、models、mechanisms 與 phenomena 的階層，後者服務日常搜尋與瀏覽。論文 §5 與 Appendix B Table 3 報告 4,931 個節點、約 1.1M claims 與 360,546 個 paper placements，其中 663 個是 open proposed branches。

![AskChem Figure 5：以原理為中心的 Living Taxonomy](https://arxiv.org/html/2607.28618v1/figures/screenshot_taxonomy.png)

*Figure 5 是 principle-centered Living Taxonomy 的介面截圖。來源：[AskChem Figure 5](https://arxiv.org/html/2607.28618v1#S3.F5)，Bing Yan et al.；依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用，檢視日期 2026-08-07。*

作者明確把它定位成 exploratory overview，不是 fully validated scientific ontology。Appendix B 也承認 nearest-neighbor placement 可能把低 margin case force-fit 到不合適的 host；因此它適合產生閱讀路徑或提出 taxonomy gap，不適合直接作為無人監督的科學分類裁決。

## 實驗設計：AskChem-Bench 測的是 grounded synthesis 的哪些面向？

### 任務與資料

AskChem-Bench v1.1 有 **30 題**，平均分成三種 cross-paper 任務，每種 10 題：

| 任務 | 問題型態 | 它試圖觀察什麼 |
|---|---|---|
| CA：Cross-Paper Condition Aggregation | 整合多篇 paper 的 catalyst、條件與 performance metric | 能否把分散的定量 claim 組裝起來 |
| TC：Temporal Claim Tracking | 追蹤一個科學主題如何隨時間演變 | 是否保留年份與演化脈絡 |
| CS：Contradiction Surfacing | 找出互相矛盾或競爭的 claim | evidence graph 與 claim-level synthesis 是否能把衝突浮出來 |

這個 benchmark 的 coverage 很窄但問題很對焦：它測的是跨 paper 搜尋與 citation groundedness，不是完整 chemistry reasoning、實驗設計品質、使用者效用或真實研究決策。

### Baselines、預算與評分

五個 setting 都用 GPT-5.5 reader：

1. **LLM only：** 沒有 AskChem retrieval 的 reader。
2. **+AskChem：** 同一 reader 由 AskChem claim retrieval grounding。
3. **+Paperclip：** 使用 Paperclip 的 paper-level retrieval。
4. **Edison Scientific：** 封閉的 PaperQA-family agent。
5. **NotebookLM Deep Research：** Google NotebookLM 的 Deep Research setting。

Appendix A 說明，AskChem 將每題改寫成 3–4 個 keyword subquery，對 hybrid search 做 fan-out，再把合併後的 evidence diversify 到最多 40 claims。Paperclip 沿用相同的 rewriter 與 synthesizer，但基礎檢索對象是 paper；Edison 與 NotebookLM 由各自系統執行。這不是完全同質的 model、tool budget 與 retrieval setting，尤其 Edison 是封閉系統，所以表格比較應讀成 profile comparison，不是 production superiority proof。

論文的 metrics 定義如下：

- **DOI existence：** 引用 DOI 有多少能在 CrossRef resolve。
- **Citation density：** 每個回答的 distinct verified DOI 數量。
- **Grounded specificity：** 與 citation marker 位於同一句的 quantitative token。
- **Recent high-impact：** 最近五年且 citation count ≥ 50 的被引用 paper 比例。
- **Paper relevance：** Gemini 3.1 Pro judge 的 0–3 分，3 是 direct、2 是 on-topic、1 是 loose、0 是 irrelevant。

Gemini judge 用 100 個 domain-expert labels 做 calibration，論文報告 93% agreement、κ = 0.914。這能說明 judge 與校準標註的一致程度，不等於 30 題都由專家逐一評分。

## Results：citation resolvability 提升，但不是每個 quality axis 都贏

下表重現論文 Table 1；指標方向與分母保持原設定，數字是 30 題 overall 結果。

| Metric | LLM only | +AskChem | +Paperclip | Edison Scientific | NotebookLM |
|---|---:|---:|---:|---:|---:|
| DOI existence (%) | 88.3 | **100** | **100** | 99.1 | 93.7 |
| Citation density (/answer) | 9.6 | **18.1** | 7.5 | 10.7 | 7.9 |
| Grounded specificity | **8.1** | 5.9 | 0.5 | **29.2** | 0.1 |
| Recent high-impact (%) | 0.6 | **18.5** | 6.1 | 11.3 | 12.1 |
| Paper relevance (0–3) | 1.66 | **2.15** | 1.72 | 2.07 | 1.84 |
| On-topic ≥ 2 (%) | 65.8 | 86.6 | 57.8 | **89.7** | 78.9 |

### 三個定位清楚的證據錨點

1. **DOI resolvability：** [§7 RQ3 與 Table 1](https://arxiv.org/html/2607.28618v1#S7) 顯示 +AskChem 從 LLM-only 的 88.3% 提升到 100%；citation density 也從 9.6 增至 18.1。這直接支持「claim-centered grounding 能減少 benchmark 中不可解析 citation」的命題。
2. **Grounded quantitative detail：** 同一 Table 1 中，+AskChem 的 grounded specificity 是 5.9，而 Edison 是 29.2。作者承認 Edison 產生 substantially more citation-linked quantitative detail；因此 AskChem 的優勢不是所有 groundedness 指標都最大。
3. **Topic relevance：** +AskChem 的 mean relevance 是 2.15、on-topic ≥ 2 是 86.6%；Edison 分別是 2.07 與 89.7%。AskChem mean score 較高，但 Edison on-topic rate 略高；不能把「平均 relevance 最佳」改寫成「所有問題最相關」。
4. **Representative failure case：** [Figure 6／§7](https://arxiv.org/html/2607.28618v1#S7.T1) 的 ca04 例子中，論文描述 GPT-5.5 alone 產生 14 個 DOI，其中 6 個在 CrossRef 不可解析；AskChem-grounded answer 的 22 個 citation DOI 全部可解析。這支持 citation auditability 的改善，但仍只是一個 representative case，不是全 benchmark 的 factual accuracy。

作者的 claim 是「AskChem-grounded GPT-5.5 取得 100% resolvable DOI、最高 citation density、最佳 mean relevance 與最高 recent high-impact coverage」。Paper evidence 確實支持這些 Table 1 row-level numbers；**Bloss0m 的結論則更窄：它證明了 citation plumbing 與 retrieval object 的價值，尚未證明答案中的每個化學敘述都正確或足以支援實驗決策。**

## Evidence map：什麼是證據，什麼是推論？

| 層次 | 本文可安全說的事 | 不應該延伸成的事 |
|---|---|---|
| Paper evidence | claim 帶 DOI 與 quote／locator；hybrid search 整合 FTS5、paper、taxonomy 與 dense-vector recall；30 題上 +AskChem 的 DOI existence 為 100%。 | 每個 claim 都語義正確；retrieval gain 已被單獨量出。 |
| 作者／vendor claim | live index、Web／REST／SDK／MCP 與公開資料集支援 agent-native access；系統適合 interactive browsing。 | 已經具備可預測的 production latency、低成本或跨領域泛化。 |
| Bloss0m inference | claim 是比 chunk 更容易攜帶 provenance 與 downstream audit 的介面；claim identity 可以成為 RAG platform 的 durable record。 | 把 AskChem 的 chemistry index 直接當作通用 domain-agnostic memory；把 provenance 當成 truth。 |

## 消融與歸因：結果能說明什麼，不能說明什麼？

這篇 paper **沒有一個乾淨的 retrieval ablation**，例如固定 reader 與 evidence budget，只移除 taxonomy recall、evidence graph、dense-vector channel 或 RRF，再觀察各自的變化。Table 1 比較的是不同整體 setting；它很適合回答「這套 claim-centered infrastructure 的端到端 profile 如何」，不適合回答「哪個 component 造成了多少 gain」。

論文中的 97.9% edge-type precision 是 evidence graph 的小樣本結構 audit，不是移除 graph 後的 answer ablation。Appendix B 的 schema validation、數值檢查與 JSON retry 是 extraction pipeline 的 validation gates，也不是 claim semantic accuracy 的 gold evaluation。Living Taxonomy 的 open proposed branches 與 placement caveat 更直接說明：探索性分類仍需要人或後續 evaluation。

因此，最合理的歸因順序是：

1. **已證實：** 帶來源的 claim retrieval 可讓 benchmark reader 更容易產生可解析 citation，並提高 citation density。
2. **合理但未隔離：** claim-level structure、subquery fan-out、diversification 與 prompt grounding 共同造成結果；各自貢獻未知。
3. **尚未證實：** provenance-carrying claim 會在真實研究工作中帶來更高 factual accuracy、更少錯誤實驗決策或更低總成本。

## Limitations、threats to validity 與 unsupported interpretations

論文的 limitations 很重要，因為它們正好界定「claim-centered」的邊界：

- **語料覆蓋：** corpus 只涵蓋 chemistry 的一部分；abstract extraction 比 full-text extraction 淺。即使 index 顯示 147K papers，也不能把它等同於完整 chemistry literature。
- **抽取與關係可能錯：** LLM 產生的 claims、relations 與 taxonomy placements 都可能錯。quote 讓人能回查，但不會阻止模型把條件、數值、否定或因果關係讀錯。
- **評估規模與目標：** 只有 30 題，直接測 groundedness、relevance、citation density 等 proxy；沒有充分測 factual accuracy、研究者 utility、human time saved 或實驗結果品質。
- **retrieval gain 未隔離：** taxonomy-based recall、paper-level recall、dense retrieval、RRF、rewriter 與 generator 的交互作用沒有被 component-wise ablation 拆開。
- **比較不完全對稱：** Edison 是封閉 agentic system；不同系統的 tool、prompt、retrieval、更新頻率與 reader policy 可能不同。這些結果不應寫成「AskChem 擊敗所有研究 assistant」。
- **分類驗證不足：** Living Taxonomy 是 exploratory，faceted taxonomy 也沒有 expert validation of placement。這在 contradiction surfacing 或時間追蹤時尤其重要，因為錯誤歸類會改變你看到的候選 evidence。
- **production unknowns：** 論文與公開端點沒有給出完整 corpus 更新 latency、索引成本、每 query latency、吞吐、embedding／LLM 費用或長期維運負擔。公開 README 也提醒，自行部署的服務不會重現 askchem.org 的 private operational configuration。

所以有三個 unsupported interpretations 必須刪掉：**「100% DOI = 100% factual」不成立；「open source + dataset = production 可重現」不成立；「claim unit = domain-agnostic memory」也尚未由這篇 chemistry paper 證明。**

## 工程含義：如果要把它帶進 production RAG

AskChem 最值得移植的是資料邊界，而不是完整 chemistry pipeline。對一般 RAG／agent 平台，我會先做一個受限版本：

1. 把 `Claim` 設成一級資料物件：`claim_id`、來源文件、locator／quote、claim type、抽取模型與版本、confidence、時間、條件與數值欄位分開保存。
2. 把 `Source`、`TaxonomyPath` 與 `EvidenceEdge` 做成可追溯關聯，不把每次回答生成出的 citation 只留在 message log 裡。
3. 將 `supports`、`contradicts`、`extends` 與 `derived_from` 當作需要 provenance 的 typed edge，而不是任意的相似度連線；edge type 與 semantic correctness 仍要分開評估。
4. 讓 retriever 回傳 evidence bundle：claim、quote、locator、source metadata、view paths 與鄰域關係，讓 generator 不必自己從長 chunk 推測 citation。
5. 為 query type 設計不同的 evaluator：citation resolution、condition aggregation、temporal consistency、contradiction recall、factual verification、cost 與 latency 不應混成一個分數。
6. 把 claim extraction、taxonomy placement 與 edge admission 設成可重跑、可版本化、可回溯的 pipeline。遇到低 confidence 或 taxonomy abstention 時，讓系統標記「待人工確認」，不要 force-fit。

這也說明它和既有閱讀路徑的差異：[RAG vs GraphRAG](/paper-reading/07-GraphRAG-vs-RAG/) 比較的是 chunk、graph 與 hybrid retrieval 在任務上的取捨；AskChem 把關注點再往前移，問「graph 或 vector 要檢索什麼資料單位」。如果你的 agent 還要把檢索結果交給工具路由，則可再對照 [RAG-MCP](/paper-reading/04-RAG-MCP/) 的 schema retrieval 與 prompt bloat 問題。

## Reproducibility 與 artifact status（截至 2026-08-07）

我把 paper 的 release claim 與直接 endpoint 的檢查分開記錄：

| Artifact | 直接檢查結果 | 可重現性判讀 |
|---|---|---|
| Live system | [askchem.org](https://askchem.org) 可開啟；首頁與 API docs 顯示 Web、REST 與 agent workflows。 | **Usable for inspection／query；**未據此推論 production SLA。 |
| MIT source | [GitHub repository](https://github.com/bingyan4science/askchem) 公開，能看到 `src/`、`sdk/`、`mcp_server.py`、tests、Docker 與 docs；repository 顯示 MIT license。 | **Usable source；**README 明確說自行部署不重現 askchem.org 的 private operational configuration，也沒有 pinned paper release。 |
| Index snapshot | [Hugging Face dataset page](https://huggingface.co/datasets/bing-yan/askchem) 可開啟，列出 `claims.jsonl`、`sources.jsonl`、hierarchy、metadata 與約 25.44 GB 的 `askchem.db`；頁面總檔案量約 40.9 GB。 | **Partially usable；**下載門檻很高，資料 viewer 檢視時回報 schema-casting error；我沒有把整個 snapshot 下載或宣稱已完成本地重建。 |
| AskChem-Bench | [公開 benchmark endpoint](https://askchem.org/api/benchmark) 直接回傳 JSON，`version` 1.1、30 題、CA／TC／CS、methodology、results 與 reproducibility 欄位可讀。 | **Usable JSON artifact；**可重跑的 prompt／環境仍需依 repo 與 endpoint 的當前版本自行核對。 |
| REST／OpenAPI | [API docs](https://askchem.org/api/docs) 回傳 200；search、claim、neighborhood、source 與 stats endpoint 實際回傳 JSON。 | **Usable for bounded reproduction；**匿名 rate limit、當前資料版本與 API `/api/`／`/v1/` 差異需固定。 |
| SDK／MCP | repo 的 `sdk/` 目錄、PyPI 的 [askchem package page](https://pypi.org/project/askchem/) 與 [MCP client](https://askchem.org/static/askchem_mcp.py) 皆可存取。 | **Announced and inspectable；**本文沒有安裝 package、執行 MCP server 或驗證長期相容性。 |
| Demo | [YouTube screencast](https://youtu.be/SOjueOlPS-8) URL 可開啟。 | **Reachable landing page；**未把影片內容當成方法證據。 |

另外，直接查詢 live API 的 `/api/stats` 在本文日期回傳 2,442,810 claims、146,627 sources、7 views 與 10,327 nodes；這與 paper narrative 的 2.4M／147K／307K nodes 不是同一組精確統計。這可能反映 index snapshot、統計口徑或版本差異；在沒有 release manifest 前，不把兩者硬合併。

最小的 bounded reproduction 是：用公開 benchmark JSON 取 30 題與 protocol，固定 AskChem index snapshot，抽樣呼叫 search／claim／source endpoint，檢查 quote 與 DOI，然後以同一 reader 重跑 LLM-only 與 AskChem-grounded setting。要宣稱完整 reproduction，還需要固定 prompt、model version、retrieval budget、API snapshot、CrossRef 查詢時間、token／cost 與評分腳本。

## 結論與下一步閱讀

AskChem 最強的貢獻是把「檢索到的證據」做成可重用的 infrastructure object：claim 帶著 DOI 與 quote，taxonomy 提供多種瀏覽 lens，evidence graph 保存跨 paper 關係，API 與 MCP 讓同一 object 可被人和 agent 使用。AskChem-Bench 的結果支持 citation resolvability 與 citation density 的改善，但 Edison 的 grounded specificity 與 on-topic rate 提醒我們：有更多可解析 citation，不等於答案在所有 quality axis 都更好。

把它放回 Bloss0m 的 retrieval-systems 路徑，AskChem 是從 document／chunk retrieval 走向 **provenance-carrying claim retrieval** 的一個 production-oriented case。下一個合理的實作題不是複製 chemistry taxonomy，而是建立一個小型 domain index，做 component ablation、factual verification、更新延遲與總成本測量，並把「不確定」保留成一種可查詢的結果。

## Primary sources

- [AskChem arXiv record](https://arxiv.org/abs/2607.28618)：標題、作者、版本與摘要。
- [AskChem full paper in arXiv HTML](https://arxiv.org/html/2607.28618v1)：§2–§7、Figure 2–6、Appendix A–B、limitations 與 availability。
- [AskChem PDF](https://arxiv.org/pdf/2607.28618v1)：完整 10 頁 preprint，含表格與附錄。
- [AskChem source repository](https://github.com/bingyan4science/askchem)：MIT-licensed source、SDK、MCP server、benchmark／deployment material。
- [AskChem index snapshot](https://huggingface.co/datasets/bing-yan/askchem)：CC-BY dataset page 與檔案清單。
- [AskChem-Bench JSON](https://askchem.org/api/benchmark) 與 [OpenAPI docs](https://askchem.org/api/docs)：公開 questions、methodology、results、API schemas 與 bounded reproduction 入口。
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)：本文重用 arXiv Figures 2–5 的授權與 attribution 依據。
