---
title: "Before Reasoning Can Fail 論文精讀：Agentic RAG 的證據取得失敗"
description: "精讀 Before Reasoning Can Fail 如何把『搜尋後沒有讀證據就回答』拆成可觀測的軌跡失敗，並檢驗 Read-Gate 是否真的改善多跳問答。"
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "這篇 arXiv v1 預印本把 RAG 錯誤分成證據前的 discipline failure 與讀過 gold evidence 後的 post-gold-read failure。"
  - "在 HotpotQA、2WikiMultiHopQA 與 MuSiQue 的 12,000 條配對軌跡中，兩種失敗的同時觸發率只有 11.2%–13.1%，不應被當成同一種 reasoning error。"
  - "Read-Gate 在 gpt-5-mini minimal 的完整 cell 將 LLM-Acc 提高 3.2–9.4 個百分點，但 medium reasoning 的小樣本檢查出現 0 或負增益。"
  - "可移植的工程結論是先觀測 search → read → final 的程序邊界，再決定是否加 gate；它不是 retrieval quality 或 answer verification 的替代品。"
audience:
  - "設計 Agentic RAG 控制器、trace logging 或 evidence provenance 的 AI 工程師。"
  - "需要把 RAG 錯誤拆成檢索、讀證據、生成與驗證責任的技術負責人。"
tags: ["Paper Reading", "RAG", "Agentic RAG", "Retrieval", "Evaluation", "Observability"]
image: "/paperReading/15-before-reasoning-fails/title_image.webp"
field: "Retrieval Systems"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
paper:
  title: "Before Reasoning Can Fail: Pre-Evidence Procedural Failures in Agentic RAG"
  authors:
    - "Daeyoung Roh"
    - "Donghee Han"
  year: 2026
  venue: "arXiv cs.AI preprint, v1 (submitted 2026-08-03)"
  links:
    pdf: "https://arxiv.org/pdf/2608.02011v1"
    arxiv: "https://arxiv.org/abs/2608.02011"
    doi: "https://doi.org/10.48550/arXiv.2608.02011"
    code: "https://github.com/Noverse0/before-reasoning-fails"
series:
  id: "production-rag-controls"
  title: "Production RAG 控制"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文 / The paper in 90 seconds

- **問題**：在具備工具呼叫的 Agentic RAG 中，模型常在 `search` 取得候選摘要（snippets）後，未呼叫 `read` 檢驗完整文章就直接送出 `final` 答案。這種「跳過證據檢驗」的程序性失敗（discipline failure），發生在以證據為前提的推理（evidence-conditioned reasoning）被測試之前，過去常被籠統歸類為「模型推理能力不足」。
- **核心洞見**：藉由保存包含工具呼叫、檢索段落與最終答案的完整軌跡（trajectories），將錯誤嚴格拆分為程序性失敗與讀過黃金證據後的推理失敗。Read-Gate 提出一項極簡的執行期不變量（runtime invariant）：在檢索之後、送出答案之前，強制至少執行一次全文讀取動作，不更動模型權重、檢索器或推理解碼預算。
- **最強證據**：在 HotpotQA、2WikiMultiHopQA 與 MuSiQue 三個多跳問答資料集上共 12,000 條配對軌跡中，原本會跳過讀取的零讀取子集（zero-read subset）經強制讀取後，LLM 評測準確率提升 14.9–19.9 個百分點；在完整的 minimal-reasoning 設定下，準確率提升 3.2–9.4 個百分點（[Table 1 與 Table 3](https://arxiv.org/html/2608.02011v1#S5)）。
- **主要邊界**：本方法依賴可明確觀測 `search`、`read` 與 `final` 的離散動作介面；讀取動作僅保證程序履行，無法保證檢索召回正確段落或推論無誤。當模型已具備充足推理能力且自主讀取證據時，額外閘門無法帶來增益，甚至可能增加無效重試與延遲成本。

*版本說明：本文依據 Daeyoung Roh 與 Donghee Han 於 2026-08-03 提交之 [arXiv v1 預印本（arXiv:2608.02011v1）](https://arxiv.org/abs/2608.02011)。*

## 理解前需要知道什麼 / What to know first

在深入探討本篇論文的具體機制前，需要釐清以下三項核心背景與既有方法的限制：

1. **Agentic RAG 的離散動作介面**：傳統 RAG 通常是一次性將檢索到的 top-$k$ 文本直接拼接進 prompt 中；而 Agentic RAG 則賦予模型多步工具呼叫能力，典型介面包含 `search`（返回 chunk IDs 與短摘要）、`read`（展開特定 ID 的完整全文段落）以及 `final`（終止搜尋並產出最終答案）。這種分離式設計旨在降低 context 膨脹並節省運算成本。
2. **既有評測與過去方法的盲點：為什麼只看最終答案不夠**：傳統問答評測僅比對最終答案的正確性（如 Exact Match 或 LLM 裁判分數），或者寄望於擴大內部思考預算（hidden thinking budget / reasoning tokens）與偏好學習（RL alignment）。然而，這些既有方法完全無法觀測模型究竟是依據檢索到的外部證據作答，還是僅憑訓練先驗與片段摘要胡亂猜測。當模型搜尋到看似相關的 snippet 便急於送出答案時，即使表面給出看似嚴密的推論鏈，實際上從未進行過實質的證據核對。
3. **兩大本質相異的失敗軸向**：
   - **證據前程序性失敗（Pre-evidence discipline failure）**：模型未遵守「讀取完整證據」的動作規範，在未接觸充分證據前就提前 finalize。
   - **讀取黃金證據後的推理失敗（Post-gold-read reasoning failure）**：模型確實已檢索並完整讀取包含解答依據的黃金段落（gold evidence），但仍在隨後的邏輯整合與多跳關聯中推論出錯誤答案。

## 核心直覺 / Core intuition

傳統決策規則將何時終止搜尋交由模型自主決定（voluntary termination policy），但在多跳複雜問題中，模型極易產生過度自信，將簡短 snippet 誤認成完整事實。新決策規則將「檢驗證據」提升為環境端的硬性約束：若系統偵測到搜尋後發生零讀取（`read_count == 0`），環境直接否決 `final` 請求，並回傳明確的反饋要求模型先對候選段落呼叫 `read`。

錯誤不再是一個不可解釋的單一純量，而是軌跡層級的優先級分支：

![Figure 2：trajectory-level error decomposition](https://arxiv.org/html/2608.02011v1/x2.png)

*圖 1｜論文 Figure 2 將錯誤軌跡依 priority 分到 discipline、post-gold-read、retrieval 與 ambiguity；Read-Gate 只直接阻擋 discipline branch。來源：[Figure 2，§3](https://arxiv.org/html/2608.02011v1#S3.F2)。圖版作者為 Daeyoung Roh、Donghee Han，依 [arXiv non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) 標示來源；該頁不是 CC BY 聲明。*

在程序性失敗中，作者進一步細分三種可操作的子型態：
- **No-read final**：在 `read_count = 0` 時直接答錯，屬於最客觀、不依賴實體抽樣啟發式的核心指標。
- **Snippet-only final**：答案實體僅在搜尋 snippet 出現，從未存在於任何已讀取全文中。
- **Low-evidence final**：問題中出現的命名實體在已讀取段落中的覆蓋率低於 80%。

> **花花的工程提醒**
>
> 如果 trace 只記錄 final answer，不記錄 search、read、讀取了哪個 chunk ID，以及何時被允許 finalize，就無法區分錯誤究竟源自檢索未召回、模型跳過證據檢查，還是讀完黃金段落後的推論崩潰。

## 用一個例子走完整個方法 / Walk one example through the method

以一道具備兩跳關聯的多跳問答為例，檢視無閘門與 Read-Gate 控制下的差異：

1. **輸入問題（Input）**：「執導《全面啟動》（Inception）的導演，其出生城市在哪一年主辦了夏季奧運會？」
2. **檢索與中間表示（Search & Intermediate representation）**：Agent 發出 `search("Inception director birth city Summer Olympics")`，混合檢索器回傳 top-5 摘要，包含 Christopher Nolan 的生平簡述 snippet 與倫敦主辦奧運的歷史摘要 snippet。
3. **自主決策下的潛在失敗點（Likely failure point）**：在無閘門控制下，模型看見摘要中出現「Christopher Nolan」與「London」，便憑藉內部先驗直接判定答案，送出 `final("1948")`，跳過對完整文本的檢驗。若實際問題指向特定歷史年份，或先驗產生幻覺，便形成典型的零讀取程序性失敗（No-read discipline failure）。
4. **Read-Gate 介入與決策轉換（Decision transformation）**：環境端攔截 `final` 動作，檢查內部計數器發現 `search_count > 0` 且 `read_count == 0`，立即駁回動作，並注入回饋觀察：`[Action Rejected: You have searched candidate snippets but executed 0 read actions. You must call read on at least one promising chunk before finalizing.]`。
5. **強制讀取與最終輸出（Output）**：Agent 被迫發出 `read(chunk_id=1042)` 取得倫敦三次主辦奧運的完整歷史段落，確認確切年份與語境後，重新呼叫 `final("1908, 1948, 2012")`。此時若答案依然錯誤，錯誤屬性將被乾淨移轉至讀後推理或檢索涵蓋率問題。
6. **與單純上下文注入的區別（Contrast with context injection）**：若環境只是默默將 rank-1 的文字拼進提示詞（ctx-inject），模型並未形成主動調用工具的行為承諾（action commitment），實驗顯示這種被動注入甚至可能在部分資料集導致負增益。

## 技術機制 / Technical mechanism

論文將 Agentic RAG 的互動過程形式化為離散軌跡 $\tau = (a_1, o_1, a_2, o_2, \dots, a_T, o_T, y)$。環境提供兩個核心工具：
- `search(q)`：結合 BM25 稀疏檢索與 Qwen3-Embedding-0.6B 稠密檢索，透過倒數排名融合（Reciprocal Rank Fusion, $k=60$）合併，向模型輸出 top-$k=5$ 的候選區塊識別碼與預覽摘要。
- `read(chunk_id)`：依 ID 取出完整的文章段落，若跨搜尋輪次重複讀取相同 ID，不重複計入新的有效證據量。

整體執行上限設定為 10 輪對話上限、128k 權杖容量限制與溫度係數 0.0。

對所有產生錯誤答案的軌跡集合 $\mathcal{E}_{wrong}$，作者設計了嚴格的互斥優先級計數架構：

$$
\mathcal{E}_{wrong} = \mathcal{E}_{disc} \;\dot{\cup}\; \mathcal{E}_{post} \;\dot{\cup}\; \mathcal{E}_{retr} \;\dot{\cup}\; \mathcal{E}_{amb}.
$$

符號定義如下：
- $\mathcal{E}_{disc}$（Discipline failure）：未遵守證據檢驗協議即作答之錯誤。
- $\mathcal{E}_{post}$（Post-gold-read failure）：軌跡中至少讀取過一個黃金佐證段落（gold-supporting chunk），但最終答案依然錯誤。
- $\mathcal{E}_{retr}$（Retrieval failure）：黃金佐證段落未出現在任何一次搜尋的 top-$k$ 候選清單中。
- $\mathcal{E}_{amb}$（Residual ambiguity）：其餘無法歸入上述三類的不明確錯誤。

Read-Gate 的邏輯極為精確：僅當 $a_t = \text{final}$ 且滿足 $\text{search\_count} > 0$ 與 $\text{read\_count} = 0$ 時觸發攔截。它不修改模型參數、不更動檢索索引、不重寫使用者提問，純粹作為環境端執行的狀態機不變量。

## 實驗如何讀 / How to read the evidence

實驗設定涵蓋三個標準維基多跳問答資料集：**HotpotQA**、**2WikiMultiHopQA** 與 **MuSiQue**。每個資料集在各條件下配置 $n=1{,}000$ 條嚴格依問題 ID 配對的軌跡。四大核心評測控制器為：
1. `gpt-4o-mini`
2. `gpt-5-mini` minimal reasoning
3. `gpt-5-mini` medium reasoning
4. `gpt-5-mini` minimal reasoning + Read-Gate

總計構成 **12,000 條 OpenAI 家族配對軌跡**。評測指標以固定 `gpt-5-mini` 裁判模型判斷語意等價性的 **LLM-Acc** 為主，輔以字串包含指標 **Contain-Acc**。

### 1. 兩種錯誤指標確實正交且非同一概念

在 12,000 條軌跡產生的 3,807 個錯誤案例中，多標籤重分類檢驗兩種失敗是否同時發生：

| 實體抽取工具 (Entity extractor) | 僅程序失敗 (Discipline-only) | 僅讀後推理失敗 (Post-only) | 兩者皆發生 (Both) | 兩者皆無 (Neither) |
| --- | ---: | ---: | ---: | ---: |
| regex | 46.5% | 21.4% | 11.2% | 20.9% |
| spaCy `en_core_web_sm` | 50.2% | 19.5% | 13.1% | 17.2% |

兩種標註器對程序性失敗的一致性達 Cohen’s $\kappa = 0.628$。兩者同時觸發率僅 11.2%–13.1%，證實程序性失敗與推理性失敗在真實系統中主要獨立發生（[§5.1](https://arxiv.org/html/2608.02011v1#S5.SS1)）。

![Figure 3：error indicators across agent regimes](https://arxiv.org/html/2608.02011v1/x3.png)

*圖 2｜論文 Figure 3 的 x 軸是 regime-level，不是 model scaling curve；它支援「discipline 與 post-read 的變化方向不同」，不支援更大模型必然改善所有錯誤。來源：[Figure 3，§5.1](https://arxiv.org/html/2608.02011v1#S5.F3)；作者與授權標示同上。*

### 2. 自選零讀取子集上的救援效果不等於整體效益

在原本自主策略下跳過讀取的題目子集上（[Table 1](https://arxiv.org/html/2608.02011v1#S5.T1)），強制讀取帶來顯著救援效應：
- HotpotQA：LLM-Acc 由 58.1 提升至 73.0（+14.9 點，McNemar $p < 10^{-4}$）
- 2WikiMultiHopQA：42.1 提升至 62.1（+19.9 點，McNemar $p < 10^{-4}$）
- MuSiQue：22.5 提升至 37.4（+14.9 點，McNemar $p < 10^{-4}$）

必須注意，這是針對「原先零讀取題」的局部救援增益，不能推論為整個問答母體的平均改善。

### 3. 完整母體的穩定淨增益落在 3.2–9.4 點

在未經篩選的完整 $n=1{,}000$ minimal-reasoning cell 中（[Table 3](https://arxiv.org/html/2608.02011v1#S5.T3)）：
- HotpotQA：79.6 → 82.8（+3.2 點，baseline 錯誤率 13.3%）
- 2WikiMultiHopQA：64.4 → 69.7（+5.3 點，baseline 錯誤率 22.1%）
- MuSiQue：34.2 → 43.6（+9.4 點，baseline 錯誤率 57.0%）

增益幅度與基準環境中存在的程序性錯誤比例高度正相關。然而在 medium reasoning 的 $n=100$ 配對消融檢查中，變動幅度分別為 +0.0、−7.0 與 −4.0 點。這意味著當模型已具備足夠的自主檢驗傾向時，外加閘門已無改善空間，反而帶來額外阻礙。

### 4. 機制消融：被動注入上下文無法重現動作閘門的效果

為檢驗增益是否僅因 prompt 變長，論文設計 Context injection 對照組（[Table 2](https://arxiv.org/html/2608.02011v1#S5.T2)）：

| 資料集 (Dataset) | 無閘門基準 (No Read-Gate) | 完整 Read-Gate | 靜默注入上下文 (Context injection) |
| --- | ---: | ---: | ---: |
| HotpotQA | 79.6 | **82.8 (+3.2)** | 79.5 (−0.1) |
| 2WikiMultiHopQA | 64.4 | **69.7 (+5.3)** | 57.0 (−7.4) |
| MuSiQue | 34.2 | **43.6 (+9.4)** | 38.1 (+3.9) |

在 2WikiMultiHopQA 上，單純注入上下文甚至導致 7.4 個百分點的負衰退；在 MuSiQue 上 Read-Gate 亦顯著優於上下文注入。這支持了「要求模型主動發出 read 動作形成承諾」是關鍵機制，而非被動接收更多 token。

### 5. 失敗平面上的不同演化路徑

若直接計算邊際 post-gold-read 比例，Read-Gate 看似會使勝算比（Odds Ratio）上升至 1.46，但論文證明這純粹是標籤重新歸類（原本零讀取的錯誤被救至具備讀取紀錄，從而具備計入 post-read 的資格）。在控制讀取暴露的層別分析中（$n=1,863$），Read-Gate 的 post-gold-read OR 恰為 1.00 [0.84, 1.19]（[Table 4](https://arxiv.org/html/2608.02011v1#S5.T4)）。

![Figure 7：Read-Gate 與 reasoning effort 在 failure plane 上的不同方向](https://arxiv.org/html/2608.02011v1/x6.png)

*圖 3｜論文 Figure 7 將 $P_{disc}$ 與 $P_{post}$ 放在同一個平面：Read-Gate 主要往下壓 pre-evidence failure，medium reasoning 則同時改變兩個軸。MuSiQue 沒有 gold evidence，因此 $P_{post}=0$。來源：[Figure 7，Appendix J](https://arxiv.org/html/2608.02011v1#A10.F7)；作者與 [arXiv non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) 標示同上。*

### 6. 深入診斷與消融切片

- **內部思考預算並非外部檢驗的保證（Table 5，§5.6）**：Gemini 2.5 Flash 在未加閘門下，將思考預算由 0 提升至 1,024 tokens，在三個資料集的零讀取率分別上升 +5.7、+24.8 與 +42.6 個百分點，答對淨勝場差（Net $\Delta$）反而呈現 −44、−67 與 −73。更多內部 reasoning tokens 反而促使模型更依賴先驗幻覺。
- **純提示詞引導無法替代執行期約束（Appendix K，Table 17）**：嚴格的系統提示詞雖能將零讀取率降低，但在三個資料集上的準確率僅為 79.6、61.6 與 37.4，完全無法重現 Read-Gate 的 82.8、69.7 與 43.6。
- **廣義閘門家族的邊界（Appendix F，Figure 6）**：嘗試強制低實體覆蓋率重讀的 `+lowev` 與 `full` 閘門，平均每題干預次數超過 2 次，帶來劇烈的迴圈負擔且跨資料集表現不穩定。
- **跨模型轉移的敏感性（Appendix D.1，Table 12）**：在 Qwen2.5 3B/7B 上，MuSiQue 3B 獲得 +6.0 增益（$p=0.043$），但在 HotpotQA 與 2Wiki 出現 −2.0 浮動，多數信賴區間跨越 0，表明閘門的有效性取決於基底模型的指令遵循與工具反應模式。
- **裁判模型穩健性（Appendix L，Table 18）**：Gemini 2.5 Pro 與 gpt-5-mini 裁判在 $n=450$ 分層樣本上的整體一致性達 $\kappa = 0.924$，加權後分數差異僅在 −3.7 至 +1.3 百分點之間。

## 證據地圖 / Evidence map

### 論文直接證據

1. 在 12,000 條配對軌跡中，程序性失敗（Discipline failure）與黃金證據讀後推理失敗（Post-gold-read failure）的高度重疊率僅 11.2%–13.1%，可透過軌跡紀錄有效拆解為不同治理目標。
2. 在模型存在大量跳過讀取行為的 minimal-reasoning 設定下，Read-Gate 在三個多跳基準上穩定帶來 3.2–9.4 個百分點的準確率淨增益（Table 3）。
3. 增加模型的內部隱藏思考預算（thinking tokens）並不會促成主動調用工具讀取證據，在 Gemini 2.5 Flash 上甚至顯著惡化零讀取率（Table 5）。

### 作者因果解讀

作者主張 Read-Gate 的效益並非來自額外上下文的表面資訊補充，而是源於「強制模型自主發出讀取動作（Action commitment）」所建立的狀態鎖定效應；並認為將程序約束外置於環境層，比起微調或內部推理解碼，更具備確定性與可控性。

### 論文未證明

1. **領域泛化未經檢驗**：研究僅評測維基百科風格的英文多跳問答，未能證明結論適用於企業私有知識庫、長篇合約、非結構化代碼庫或非英文多模態場景。
2. **無法取代檢索品質**：若檢索器未能在 top-$k$ 中召回黃金依據，強制讀取僅會迫使模型檢驗無關資訊，無法提升正確率。
3. **無動作邊界的架構不適用**：固定 context RAG、隱式生成檢索（interleaved retrieval）或單純生成模型無法套用此機制。
4. **MuSiQue 黃金段落標註不完整**：MuSiQue 資料集缺少逐塊（per-chunk）的黃金依據欄位，其讀後推論分析受到資料結構限制。
5. **對高階模型可能帶來反效果**：在已具備高檢驗傾向的模型（如 medium reasoning）中，外加硬性閘門無法帶來增益，反而提升延遲與重試負擔。
6. **不代表解決幻覺與推論錯誤**：讀取完整文章不代表模型「理解正確」，更不等於免除後續事實查核與答案驗證。

### Bloss0m 工程化整理

在生產級 Agentic RAG 系統中，應將整體品質指標解耦為三條各自獨立的觀測責任鏈：
1. **檢索責任鏈（Retrieval coverage）**：監控 top-$k$ 是否涵蓋充足上下文與召回率。
2. **程序遵循責任鏈（Procedural compliance）**：透過日誌監控 `search → read → final` 的狀態轉移與零讀取率，此處正是 Read-Gate 的介入範疇。
3. **推論驗證責任鏈（Answer verification）**：針對已檢驗之證據，由 Verifier 模型評估推論邏輯與事實驗證。
混淆這三者會導致工程團隊在面對問答失敗時，盲目投入微調或換用更貴的模型，卻忽視了最基本的動作合規性漏洞。

## Artifact 與可重現性 / Artifacts and reproducibility

截至 **2026-08-09**，論文之[官方儲存庫（Official repository）](https://github.com/Noverse0/before-reasoning-fails)已可公開存取，提供完整的 Agent 迴圈實作、Read-Gate 控制模組、論文圖表重現腳本，以及包含 12,000 條配對樣本在內的 33,950 條原始軌跡資料（共 49 個 JSON 檔案）。

外部公開依賴項目狀態：
- [HotpotQA 官方頁面](https://hotpotqa.github.io/)：資料集公開可下載，採 CC BY-SA 4.0 授權。
- [2WikiMultiHopQA 儲存庫](https://github.com/Alab-NII/2wikimultihop)：儲存庫可存取，依 README 提供外部下載鏈接，採 Apache-2.0 授權。
- [MuSiQue 儲存庫](https://github.com/StonyBrookNLP/musique)：資料與下載腳本完整可用，採 CC BY 4.0 授權。
- [Qwen3-Embedding-0.6B 模型卡](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)：模型權重開源，採 Apache-2.0 授權。

可重現性界限說明：本文所引述之各項基準數據均採用原論文作者報告之實驗結果。獨立重現除取得上述公開資源外，仍須自行配置對應之商業 API 存取權限（OpenAI 及 Google Gemini）、指定對應的模型快照版本、建立向量索引並承擔推理解碼產生的算力費用。若僅以自身開發之控制器在公開資料集上複刻此流程，應界定為協定複現（Protocol replication）而非完全重現。

## Bloss0m 工程判斷與不適用條件 / Bloss0m engineering judgment and when not to use it

以下為 Bloss0m 基於工程落地實務提出的架構判斷與不適用原則：

### 建議導入場景

1. **日誌觀測發現嚴重的零讀取傾向**：當既有 Agentic RAG 系統的 trace analysis 顯示模型常在呼叫搜尋後直接回傳答案，且存在高比例的推論幻覺時。
2. **高風險決策與證據鏈審計需求**：金融合規、醫療指引或法律問答等必須提供完整引文出處與讀取證明的場景。

### 漸進式導入步驟

1. **先記錄指標，切勿貿然攔截**：在日誌中埋入 `search_count`、`read_count`、閱讀區塊識別碼與停留輪次，建立 baseline 的零讀取率與推論失敗分布。
2. **以 Shadow Testing 進行風險控管測試**：僅針對 zero-read 高發的特定流量進行影子測試，並比對延遲、呼叫成本與拒答率（Abstention rate），勿單信單一評測模型。
3. **配置完善的熔斷與容錯機制**：將 Read-Gate 視為具備 Feature Flag 的中介軟體，設定最大修正次數（建議上限 2 次）與迴圈跳出保護；若檢索結果本身品質低劣，應引導模型主動向使用者澄清或宣布無法回答，而非無限強制重讀。

### 明確不適用條件（什麼時候不要使用）

1. **固定 Context 或無離散動作介面的 RAG**：若架構僅是一次性將文件塞入 Prompt，強行引入虛擬動作閘門只會破壞對話結構。
2. **高階推理模型已具備穩定讀取習慣**：如實驗所示，在具備中高階 reasoning 傾向的模型上，Read-Gate 毫無改善空間，強加干預只會白白浪費 API 成本並拉長回應時間。
3. **檢索召回精確率極低的場景**：當搜尋系統時常返回無關雜訊時，強制模型閱讀只會引入更多誤導性干擾。
4. **涉及高敏感權限隔離的系統**：若呼叫 `read` 動作需要消耗高額代價或可能觸發資料外洩風險，必須在安全層次重新評估。

相關延伸閱讀：
- 關於評測責任鏈與失敗召回率的設計思維，參見 [OSReward 評測讀法](/paper-reading/08-osreward-agent-evaluation/)。
- 關於工具路由前置控制，參見 [RAG-MCP 架構解析](/paper-reading/04-RAG-MCP/)。
- 關於長程工作流與記憶評測，參見 [ContextWeave 評測基準](/paper-reading/09-contextweave-workflow-benchmark/)。
- 關於模型自主產生反思 token 決定何時檢索而非由外部硬性攔截的架構對比，參見 [Self-RAG 深入剖析](/paper-reading/33-self-rag-retrieve-generate-critique/)。

## 讀完後的三個記憶點 / Three things to remember

1. **技術想法（Technical idea）**：有檢索不等於有實質的證據檢查；在具備工具介面的 Agent 中，將「檢索後必須讀取」實作為執行期的動作不變量，能從根本防範尚未進入推理前的程序性跳步。
2. **實驗證據（Evidence）**：在 12,000 條多跳軌跡中，程序性失敗與讀後推理失敗的重疊率僅 11.2%–13.1%；Read-Gate 在未經篩選的 minimal-reasoning 母體上能帶來 3.2–9.4 個百分點的穩定淨增益，但在成熟模型上增益趨近於零。
3. **工程邊界（Boundary）**：Read-Gate 是低侵入性的程序約束，絕非檢索品質或答案驗證的萬靈丹；生產部署必須同時衡量檢索召回、動作合規、推論驗證以及額外帶來的延遲與重試成本。

## Primary sources

- Roh, Daeyoung; Han, Donghee. [Before Reasoning Can Fail arXiv record](https://arxiv.org/abs/2608.02011)（arXiv cs.AI 預印本資料與摘要說明）。
- Roh, Daeyoung; Han, Donghee. [Before Reasoning Can Fail v1 full HTML](https://arxiv.org/html/2608.02011v1)；[v1 PDF](https://arxiv.org/pdf/2608.02011v1)。
- [官方程式碼儲存庫](https://github.com/Noverse0/before-reasoning-fails)（提供 agent loop、重現腳本與原始軌跡）。
- [HotpotQA 官方資料集頁面](https://hotpotqa.github.io/)。
- [2WikiMultiHopQA 官方儲存庫](https://github.com/Alab-NII/2wikimultihop)。
- [MuSiQue 官方儲存庫](https://github.com/StonyBrookNLP/musique)。
- [Qwen3-Embedding-0.6B 模型卡](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)。
