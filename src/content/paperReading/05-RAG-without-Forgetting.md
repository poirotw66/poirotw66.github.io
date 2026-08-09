---
title: "RAG without Forgetting：把成功的 Query Expansion 寫回索引，但不要把錯誤也寫進去"
description: "以論文證據檢視 ERM 的 correctness gate、選擇性歸因、有界 key update、BEIR/BRIGHT 結果與未釋出 artifact。"
pubDate: 2026-03-23
updatedDate: 2026-08-09
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
paper:
  title: "RAG without Forgetting: Continual Query-Infused Key Memory"
  authors:
    - "Yuntong Hu"
    - "Sha Li"
    - "Naren Ramakrishnan"
    - "Liang Zhao"
  year: 2026
  venue: "arXiv 2602.05152 v1（preprint）"
  links:
    pdf: "https://arxiv.org/pdf/2602.05152.pdf"
    arxiv: "https://arxiv.org/abs/2602.05152"
series:
  id: "rag-without-forgetting"
  title: "RAG without Forgetting 深度精讀"
  part: 1
  totalParts: 1
---

## 讀者問題與結論

Query expansion（QE）能縮短 query 與 document 的表徵落差，但下一次相似請求通常仍得重新生成；key expansion（KE）則能持久化，卻常在離線時對整個 corpus 做 heuristic 更新，未必知道下游任務是否真的答對。*RAG without Forgetting* 提出 Evolving Retrieval Memory（ERM）：把 query 產生的 expansion units 先交給 correctness gate；只接受通過驗證的 signal；再只歸因給其確實提高 similarity 的 document key；最後用受限更新累積在 index-side memory。

這比「讓 retriever 持續學習」精確得多。ERM 不訓練 retriever parameter，它修改的是儲存的 key；它有沒有實務價值，取決於成功 query 是否真的會重複，以及 gate 是否真的代表可信的成功。本文是 2026-02-05 發布的 arXiv v1 preprint，在 13 個 BEIR/BRIGHT domain 提供了不少 benchmark 證據；但它沒有公開 implementation、長期 production A/B、攻擊評估、使用者資料治理或 rollback incident study。比較恰當的用法是：把它當成受治理 offline/canary adaptation 的設計起點，而不是允許 index 從每一次互動自行學習的授權。

## Evidence Map

- **論文直接支持的證據：**Figure 1 比較 QE、KE、ERM；Figure 2 與 Sections 4.1–4.3 定義 gated feedback、selective attribution、progressive key evolution；Table 1 是 retrieval；Table 2 是 StackExchange generation；Figures 3–4 與 Appendix B.9/Figure 6 提供 latency、adaptation budget、transfer 與 QE 選擇診斷。
- **作者主張：**在指定 similarity 假設下 query/key expansion 等價；bounded selective update 會收斂；累積有用 expansion 能攤銷 query-time 工作並以 native retrieval latency 服務。
- **未被建立的證據：**live feedback 下 verifier precision、被持久化互動資料的隱私、adversarial/prompt-injected query、operational rollback、index serving consistency、金錢成本，或真實變動 corpus 的長期穩定性。
- **Bloss0m 工程判斷：**ERM 最適合有獨立可信訊號、能 gate 可歸因 delta log 的情境。它的價值不是抽象的「記憶」，而是把重複且已驗證的 query pattern 受控制地攤銷。

## 一個公式與三個階段：ERM 怎麼做

論文 Section 3 將 corpus 表示為 documents $D=\{d_i\}$ 與 retriever keys $K=\{k_i\}$，用 similarity function $S(q,k_i)$ 來打分 query $q$ 與 key。某個 expansion method 對 query 產生 $c(q)=\{e_1,\ldots,e_m\}$。ERM 真正問的不是「expanded query 是否比較好」，而是「一個 expansion unit 是否應成為某個特定 key 的持久增量」。

**1. Correctness-gated feedback（Section 4.1；Figure 2a）。**論文定義 retrieval verifier $V_r$（例如 recall@K 或 DPR match）和 generation verifier $V_g$（例如 ROUGE、task loss、LLM-as-judge），並透過 task-specific threshold 將各自映成 binary indicator。只要 retrieval 或 generation correctness 成立，就接受 expanded query。這個 OR 規則可讓只有 retrieval label 的 BEIR 與有 answer-level ground truth 的 BRIGHT 共用框架；同時它也是 contamination boundary：弱 answer judge、click bias、leaked answer 或不當 threshold 都可能把錯誤關聯寫入 index。

**2. Selective expansion attribution（Section 4.2；Figure 2b）。**對每個被取回 document 與 expansion unit，作者計算把 unit 加到該 key 後的 marginal similarity gain。簡化為：

$$
\Delta_{i,j}(q)=\operatorname{sim}(f(q),k_i\oplus f(e_j))-\operatorname{sim}(f(q),k_i).
$$

只有帶來正增益的 document–unit 關係才是該 document memory 的候選。這是方法最重要的區別：全域有用的 expansion 不會被複製到每個 top-k 結果，降低 generic query phrase 導致大面積 key drift 的風險。

**3. Progressive key evolution（Section 4.3；Figure 2c）。**每個 query 的 attribution weight 在其 units 中 softmax-normalize；gain 在 batch 內累積；低分 memory 被丟棄，留下的 unit 用來 augment document key。更新有 norm bound；當 marginal benefit 下降時由 saturation rule 停止一輪。作者強調不訓練 retriever parameter；但「training-free」不等於「不需要治理」：index state、vector norm、cached expansion 與 verifier 都成為會累積的 operational state。

Figure 1 的價值在於比較，不是普遍優越性的證明。QE 每次 query 做 inference 再丟掉；KE 付出持久 corpus-side 成本但未必與 task 對齊；ERM 試圖只保存 task-validated 的 local experience。它能不能攤銷，仍取決於作者的 long-tail 假設：少數重複 intent 集中大部分 query traffic。

## 理論主張的適用範圍，比標題窄

Sections 4 與 Appendix A 在 standard/additive similarity structure 下討論 query/key expansion 的等價，並證明 bounded selective update 收斂。Appendix A.3 很清楚地收窄範圍：consistency 結果對採 additive augmentation 的 unnormalised dense retriever 可精確成立；對 key norm 變動緩慢的 cosine model 只約略成立；它**不**延伸為 sparse 或 late-interaction retriever 的 global optimality guarantee。這一點尤其重要，因為 Table 1 同時列出了 BM25 與 dense model。

Appendix A.4 在 Zipf-like repeated-intent 模型下給出 amortized-cost 論證：若每個 distinct intent 最多做一次 expansion，distinct adapted intent 數在所述條件下的成長相對於每次 query 都做 QE 更慢。這是 traffic model，不是企業工作負載一定遵守的事實；incident-driven、multi-lingual、seasonal 或一次性 query 都可能不同。「zero inference-time overhead」較準確的讀法是：某 query pattern 的 key 更新後，後續 serving path 不必再生成 QE；它沒有消掉 storage、background evolution、cache 或 monitoring 成本。

## 實驗協定：覆蓋廣，但可比性有邊界

Section 5 與 Appendix B.1 評估 13 個資料集。BRIGHT 包含七個 StackExchange Q&A domain：Biology、Earth Science、Economics、Psychology、Robotics、StackOverflow、Sustainable Living；另有四個 coding/math domain：LeetCode、Pony、AoPS、TheoremQA-T。BRIGHT 有 retrieval relevance 與 generation ground truth。BEIR 提供 NFCorpus（323 個 medical query、3.1K documents）與 SciDocs（1,000 個 query、4K documents），只有 retrieval label。Table 3 顯示 LeetCode 有 413,932 documents、Pony 有 7,894；這是有意義的多樣性，但不是 multilingual/private-enterprise/live conversational benchmark。

retrieval table 涵蓋 sparse BM25、開源 dense 的 BGE-Large/BGE-Base/BGE-M3-Dense/GTE-Base/MiniLM，以及商用 Cohere、Voyage embedding。Appendix B.2 說共評估九個 retrieval model；Table 1 顯示代表性 family 及其 ERM 對照。作者也比較 full document、title、abstract、keywords 四種 index representation；Appendix B 報告 393 個 naive retrieval experiment。這代表每個 dataset 的最佳設定不是固定單一配置下的 apples-to-apples；Appendix B.7 指出 GTE-base 在 13 個 naive configuration 中勝出八個，而 index representation 高度依 domain：許多 StackExchange 適合 title，部分技術內容較適合 abstract/keywords。

Table 1 的主 metric 是 nDCG@1；Section 5 也討論 nDCG@10、MRR，Figure 3/4 使用 nDCG@10。Table 2 以 Claude-3.5-sonnet 同時產生與評估 StackExchange QA。這比單一 retriever 的證據更廣，但未報 GPU/CPU hours、vector-index bytes、update I/O、background compaction、verifier API 價格與精確 judge prompt。Section 5 說作者結合多種 QE strategy、random seed 並 aggregate configuration；沒有 runnable harness/raw log，外部讀者無法獨立檢查 variance 與 selection sensitivity。

## 結果：先看絕對值，再看百分比

[Table 1](https://arxiv.org/html/2602.05152v1#S4.T1) 報告 13 domain 的 nDCG@1。其整體訊號在協定內成立：BM25 average 由 **26.3** 升至 **38.5**（+46%）；BGE-Large 由 **48.6** 至 **55.7**（+15%）；GTE-Base 49.9 至 56.4（+13%）；Cohere 48.7 至 55.2（+13%）；Voyage 50.8 至 56.3（+11%）。但它不是逐格保證：BGE-Large 在 Biology 95.1→91.3、StackOverflow 43.4→40.4、Sustainable Living 79.1→75.9 都下降；GTE-Base 也有幾個小回退。因此論文的「consistent」應讀成廣泛 aggregate benefit，而不是每個 retriever–domain pair 都會提升。

很大的 relative number 需要看分母。BM25 在 AoPS 從 0.9 到 20.7（+2200%），在 TheoremQA 從 7.9 到 37.8（+378%）。這說明 reasoning-heavy retrieval 的表徵落差可能很大；不代表 deployed system 會變成二十三倍正確。反過來，有些起點已高、可提升空間很小。作者自己的 Table 1 顯示較完整的結論：弱或不匹配 baseline 的收益可能更大；強 retriever 仍可能在特定 domain 失分。

[Table 2](https://arxiv.org/html/2602.05152v1#S5.T2) 在七個 StackExchange domain 將 retrieval 連到 downstream QA。BM25 answer quality average 72.6→76.6（+6%）；BGE-Large 74.5→77.6（+4%）；GTE-Base 77.4→79.0（+2%）；Cohere 79.3→80.5（+2%）。也有 per-domain 下降，例如 GTE-Base 的 Earth Science、Cohere 的 Earth Science 與 Robotics。又因 Claude-3.5-sonnet 同時 generation/evaluation，model-family judge 可作務實 metric，卻不是獨立的人類驗證。

## Latency、adaptation budget 與 transfer 診斷

[Figure 3](https://arxiv.org/html/2602.05152v1#S5.F3) 用 GTE-base、title index、0.5 split 比較 naive retrieval、ERM、HyDE。正文報 native retrieval/ERM 約 150–180 ms/query，HyDE 約 7–15 秒，且 retrieval 表現相近或更好。這個結果對**serving path** 很有吸引力，但不是 total-system cost：ERM 將工作移到較早的 expansion、verification、key evolution，以換取後面重複 query 的快取式收益。圖中沒有 production tail distribution，也沒有這些背景工作的成本帳。

[Figure 4](https://arxiv.org/html/2602.05152v1#S5.F4) 用 disjoint adaptation/held-out query、每個 split reset key，將 adaptation fraction 從 0.3 拉到 0.8。圖示的 AoPS、Psychology、TheoremQA-T、SciDocs nDCG@10 隨可用歷史 adaptation data 單調上升。這支持離線協定下「更多過去資料有助」的窄結論；它不是反駁 temporal drift 的證明。離線切分、reset、已知 benchmark label 與數月 live feedback、文件不斷變動是不同問題。

Appendix B.9 有兩個很有價值的 transfer/failure 訊號。[Figure 6](https://arxiv.org/html/2602.05152v1#A2.F6) 報告 LeetCode 上不同 QE/retriever 組合的 gain：Facet+BM25 為 +12%，HyDE+BGE-Large 為 +58%。這說 ERM 可以在該資料集與多種 QE 互補，不能推出其他 domain 可盲選 QE。Table 5 顯示 HyDE 常在 BEIR/technical content 領先，Diver 在若干 StackExchange domain 較好；它也記錄 Biology −0.7%、Pony −0.4% 的負 delta。appendix 的解釋是 query/document 原本就對齊時，額外 expansion 反而帶入雜訊。

Section 5.2 還看了五個 gold-document overlap 為零的 BRIGHT StackExchange dataset。文中報 BM25 +6–47%、dense retriever 在 baseline 的 ±3% 內。這是有意義的 anti-forgetting 診斷：在該構造下，更新沒有明顯壓垮不相關的 retrieval。但它沒有測 poison persistence、熱門/罕見 intent 的公平性，也沒測 false gate 反覆更新同一熱門 document 時會如何。

## Gate contamination，才是真正的 forgetting 風險

ERM 名稱說「without forgetting」，但 vector magnitude 有 bound 不代表語意一定正確。false-positive correctness gate 可以把 hallucination、poisoned document、leaked answer text、biased click 或不安全使用者指令產生的 expansion 寫進可重用 key。selective attribution 相比把內容複製到所有 retrieved document，確實縮小 blast radius；但它沒有證明被選 document 是對的，也沒有證明未來 query 會安全地解讀該訊號。

這帶來兩個不對稱風險。熱門 intent 有足夠 repetition 攤銷 QE，卻也有足夠流量強化早期錯誤關聯；罕見 long-tail intent 無法攤銷第一次 expansion，可能永遠累積不到足夠可信證據，即使 aggregate average 上升仍品質落後。mutable index 也可能讓歷史流量壓過新產品詞彙。作者在 Section 5.3 承認 positive-feedback bias，建議更大 batch 與更耐心的 stopping 來增加探索；這是合理方向，還不是 operational governance policy。

部署時應分開「可供本次服務的證據」與「可讓系統學習的證據」。某次 retrieval/answer 足以服務，不代表足以把 expansion 持久化。持久化至少要有 provenance、versioned verifier、來自獨立 session 的最低 support count、holdout check、expiry/TTL 與可逆 delta。不要直接從不可信 tool output、原始 click-through 或可能含 instruction 的 prompt 學習。這些是 Bloss0m 的 safeguard，不是論文已控制的實驗變數。

## 限制與不支持的解讀

本文的收斂與成本論證依賴 additive similarity、bounded update 和重複 intent 的假設；它們不證明 live corpus 的語意、安全性或隱私會自動穩定。受控 benchmark 的正向平均值也不能外推成每個 user cohort、每個語言、每個文件版本都會受益。尤其是 verifier 的 false positive、資料刪除要求、文件過期與回滾時序，均未由 Tables 1–2 或 Figures 1–6 建立。任何將 ERM 解讀為「無監督地從使用者互動安全學習」的說法，都超出論文證據。

## Artifact 與可重現狀態（核對日期：2026-08-09）

[arXiv record](https://arxiv.org/abs/2602.05152) 與 [HTML/PDF 全文](https://arxiv.org/html/2602.05152v1) 為 **accessible**。paper/record 沒有連結第一方 GitHub、checkpoint、demo、直接 ERM dataset package、index snapshot 或 runnable harness；截至 2026-08-09 也找不到官方 code endpoint。因此 ERM code、QE prompt、correctness threshold、seed/order configuration、key-delta log、index representation、judge prompt 與完整 result log 均為 **missing/unavailable**。

[BEIR](https://github.com/beir-cellar/beir) 與 [BRIGHT](https://github.com/SDU-NLP/BRIGHT) 是獨立 benchmark endpoint，不是 ERM release。取得它們仍不能重建論文的 expansion method、model/API version、document representation、adaptation split、gate、batch schedule 或 aggregate configuration selection。本文可檢閱，但不是 one-command reproducible。

## 工程採用、試點與不適用條件

| 情境 | 決策 | 原因 |
| --- | --- | --- |
| 可標註 outcome 的重複、read-heavy 內部 intent | 先 offline replay，再 canary ERM | 最接近論文的 amortization 前提，且可稽核。 |
| high-QPS retrieval 且有可信的獨立 verifier | 可考慮 versioned key-memory pilot | 已驗證 adaptation 後，serving latency 可能變快。 |
| 一次性、long-tail、seasonal 或快速變動 query | 用 stateless QE 或人工審查 offline refresh | repetition 與穩定 feedback 假設較弱。 |
| feedback 會受 prompt injection、click 或不可信 tool 影響 | 不可直接寫入 key | gate contamination 會變成持久 retrieval contamination。 |
| 受管制或私密的 interaction data | 未設計 retention/consent/deletion 前不要做 | persisted expansion 可能編碼使用者衍生資訊。 |
| 沒有 key-level provenance、TTL、rollback | 不要部署 mutable memory | 沒有 delta 時，有界 vector 仍很難調查。 |

內部重現應先 freeze corpus、retriever/index version；只 replay 有 label 的歷史 request；記下每個 candidate expansion、gate result、attributed document、key delta、schema/model version；再以 time-separated holdout 評估。delta 先走 shadow retrieval，接著小型 canary。監控 label 可得時的 nDCG/answer correctness、各 query cohort coverage、key norm/memory size、retrieval latency、storage/compaction、false-gate rate 與 rollback success。kill switch 應回到已知的 index generation，不要試圖在 live vector 上猜測反向更新。

## 延伸閱讀

ERM 將 retrieval 經驗持久化；[RAG-MCP](/paper-reading/04-RAG-MCP/) 則將 request 路由到 tool schema。兩者的工程邊界相同：model 產生的訊號不能只因看似合理就變成 durable system state。前者的 state 是 augmented key，後者是被選 capability；都必須有可觀測 error rate 的 gate。

## Primary Sources

- [Hu et al. 的 RAG without Forgetting arXiv record](https://arxiv.org/abs/2602.05152) 與 [全文](https://arxiv.org/html/2602.05152v1)：Sections 3–5、Figures 1–4、Tables 1–2、Appendix A、Appendix B.1/B.7–B.9。
- [BEIR benchmark repository](https://github.com/beir-cellar/beir) 與 [BRIGHT benchmark repository](https://github.com/SDU-NLP/BRIGHT)：獨立核對的 benchmark endpoint，不等同缺失的 ERM artifact。
