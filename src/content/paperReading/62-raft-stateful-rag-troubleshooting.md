---
title: "RAFT：讓 Troubleshooting RAG 找到導向修復的狀態，而不只是一段相似文字"
description: "深讀 RAFT：A Stateful Retrieval-Augmented Framework for Troubleshooting Agents（arXiv:2609.20754）：把封閉支援案例整理成狀態轉移軌跡，在 entry level 檢索中間狀態，再回傳完整 parent case。"
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "RAFT 把 troubleshooting 的檢索單位從孤立 chunk 改成案例內有順序的 timeline entry；目前狀態命中哪個 entry，就把該 entry 的 parent trajectory 一起交給 Agent。"
  - "合成 Windows Server benchmark 中，RAFT 的 Case Hit 在 0%、30%、60% 進度分別為 0.842、0.871、0.888；相同設定下 vanilla RAG 為 0.673、0.719、0.769。"
  - "Apache Jira 的 30 個人工稽核 duplicate groups 與 570 個 distractors 提供方向性的 transfer evidence，但沒有 confidence intervals，也沒有 gold root-cause／resolution coverage 標註。"
  - "這不是已證明能提高最終修復率的 troubleshooting agent；它是可獨立評測的 retrieval layer，真正部署仍要處理抽取品質、隱私、索引更新與案例不完整。"
audience:
  - "設計 production RAG、support agent 或 incident-response memory 的平台與搜尋工程師"
  - "需要判斷何時保留案例軌跡、何時只回傳片段，以及如何評估 state-aware retrieval 的研究者"
tags: ["Paper Reading", "RAG", "Agent Systems", "Agent Evaluation", "Enterprise AI"]
image: "/paperReading/raft-stateful-rag-troubleshooting/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-memory-adaptation
  - agent-evaluation-observability
paper:
  title: "RAFT: A Stateful Retrieval-Augmented Framework for Troubleshooting Agents"
  authors:
    - "Mingxuan Zhang"
    - "Xiaowen Wang"
    - "Anupma Sharan"
    - "Zhengyi Chen"
    - "Chenyu Diana Zhang"
    - "Shanshan Yang"
    - "Chittababu Pacharu"
  year: 2026
  venue: "arXiv 2609.20754 v1（2026-09-17）；accepted to EMNLP 2026 Industry Track"
  links:
    pdf: "https://arxiv.org/pdf/2609.20754v1"
    arxiv: "https://arxiv.org/abs/2609.20754"
    code: "https://github.com/microsoft/RAFT"
series:
  id: "stateful-troubleshooting-rag"
  title: "Stateful Troubleshooting RAG"
  part: 1
  totalParts: 1
---

本文讀的是 [RAFT: A Stateful Retrieval-Augmented Framework for Troubleshooting Agents](https://arxiv.org/abs/2609.20754) 的 arXiv v1。論文於 2026-09-17 提交，並註明已接受 EMNLP 2026 Industry Track；本文核對了 [arXiv HTML／PDF](https://arxiv.org/html/2609.20754v1) 的 Sections 1–6、Tables 1–9、Figures 1–2、Appendices A–D，以及 Microsoft 的 [RAFT artifact repository](https://github.com/microsoft/RAFT)。原論文頁面標示 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；下方原圖與證據頁面的來源和定位都保留在圖說中。

這篇 paper 問的不是「把 support case 丟進 embedding model 會不會找到相似句子」，而是更貼近現場的問題：**當一個 ticket 從症狀、假設、檢查一路走到 root cause 與修復時，檢索器能不能找到曾經走過相似中間狀態、而且真的留下可行動證據的完整案例？** RAFT 的回答是：先把 closed case 抽成由 meaningful state transitions 串成的 directed timeline，再對每個 entry 做 hybrid retrieval；命中 entry 後回升到 parent case，讓 Agent 同時看到「哪個狀態相似」和「那個案例最後怎麼走到解法」。

## 90 秒掌握論文

- **問題**：傳統 RAG 把長而雜的 support history 切成 chunks，容易只抓到症狀、客服禮貌文字或單一 log，卻遺失診斷順序與修復脈絡。
- **核心洞見**：troubleshooting 的檢索單位不應只是文件或 chunk，而是案例內「目前理解如何改變」的 timeline entry；查詢也不是一次性的，而是 active case 每得到新證據就更新一次。
- **最強證據**：在 826 個由 Microsoft Learn Windows Server 文件生成的合成案例上，RAFT 比 vanilla RAG、HippoRAG2 與 Fast-GraphRAG 在三個 progress points 的三項指標都高；Case Hit 0%／30%／60% 為 0.842／0.871／0.888，且相對 vanilla RAG 的 Case Hit 差異都有 issue-group clustered bootstrap 的統計支持（[Section 5.4、Table 2](https://arxiv.org/html/2609.20754v1#S5.T2)、[Appendix C.3、Table 5](https://arxiv.org/html/2609.20754v1#A3.T5)）。
- **主要邊界**：Apache Jira 的 30 組 duplicate cases 與 570 個 distractors 只提供方向性的 transfer evidence；論文評估的是 retrieval layer，不是最終 diagnosis、resolution success、工程師生產力或 production incident。

我的 bounded verdict 是：**RAFT 最有價值的改變，是把「哪個案例相似」改寫成「目前這個 investigation state 對上哪個歷史 state」，再用 parent trajectory 保留因果脈絡。它讓 retrieval 更像 stateful memory，但沒有因此自動得到正確診斷；抽取錯誤、過時修復、資料隱私與案例缺漏仍會沿著整條 trajectory 被帶進 context。**

> **花花的工程提醒**
>
> 把歷史 ticket 變成 timeline 不是單純的 chunking upgrade。production index 應同時保存原始 evidence、state 的版本與 reviewer decision，並讓 Agent 看見 matched anchor；否則你只是在把一個不可追溯的摘要，包裝成看似更有結構的記憶。

## 既有方法為什麼不夠：症狀相似，不等於現在的狀態相似

企業 support case 通常不是一問一答。初始 ticket 可能只有 error code 和一句「登入失敗」；接著工程師查看 log、提出多個 hypothesis、排除其中一些，再確認 root cause，最後驗證 mitigation。不同案例可能在 opening symptom 很像，但在第二個檢查後走向完全不同；也可能症狀不同，卻在中段暴露出同一個 root cause 或相同的 remediation。

Vanilla RAG 直接對原始 emails、notes、logs 做 chunk-level embedding。它遇到四個問題（[Section 3](https://arxiv.org/html/2609.20754v1#S3)）：

1. **訊號散落且混有噪音**：有用的技術細節跨越多個 turns，非技術內容卻可能在 lexical 或 semantic score 中搶到位置。
2. **命中後缺乏 coherent case**：即使一個 chunk 來自正確案例，Agent 仍不知道它前後發生了什麼；把多個 chunks 拼回完整 history 又很浪費 token budget。
3. **closed 不代表 actionable**：有些 ticket 因為客戶不再回覆或行政流程而結案，沒有可重用的診斷或修復證據。
4. **privacy 不是 retrieval 後才處理的附加功能**：企業資料含有 PII，必須在抽取與索引邊界先做 abstraction、redaction 或 deployment-specific filtering。

這也說明 RAFT 為何沒有把全部 higher-order reasoning 固定在 offline graph 裡。作者把 retrieval scope 限定在「找相似案例與診斷／行動所需證據」，至於案例之間如何形成更高階的 issue family，仍交給 online Agent 根據 active case 判斷（[Problem Statement](https://arxiv.org/html/2609.20754v1#S3)）。

## 核心直覺：先找 matched state，再把它放回完整 trajectory

![RAFT 原論文 Figure 1：offline case indexing、entry-level state-aware retrieval 與 optional case graph](/paperReading/raft-stateful-rag-troubleshooting/paper/figure-1-raft-overview.webp)

*圖 1（原論文 Figure 1，Section 4）：左側是 historical case 的 extraction 與 actionability filtering，中間是每個 meaningful state transition 的 directed timeline 與 optional case-level graph，右側是 active case 隨狀態更新而重新 query，最後回傳 parent case 加 matched anchor entry。原圖來源：[arXiv Figure 1 anchor](https://arxiv.org/html/2609.20754v1#S4.F1)／[arXiv PDF](https://arxiv.org/pdf/2609.20754v1)。原論文頁面標示 CC BY 4.0；本文為本地鏡像，重用時請遵守原授權。*

把 RAFT 和 vanilla RAG 放在同一個問題上比較：

| 檢索設計 | 它實際在找什麼 | Agent 收到什麼 | 主要風險 |
| --- | --- | --- | --- |
| Vanilla RAG | 原始 case 裡排名高的 chunks | 可能互不相鄰的片段，再由 Agent 自己拼接 | 命中症狀但遺失中間推理，或把行政內容當證據 |
| RAFT entry-level retrieval | 所有 timeline entries 中與當前 query 最像的 state | distinct parent cases、完整 structured representation，以及觸發命中的 anchor entry | 抽取錯誤會把錯誤 state 與錯誤 trajectory 一起放大 |
| RAFT + graph expansion | seed cases 之外，和設定中的 root cause／resolution view 相近的鄰居 | 額外的 case-level related evidence | graph view、k、edge threshold 與維護成本會影響噪音 |

所以 RAFT 的 central control point 不是「用了 graph」；Figure 1 裡 graph 甚至是 optional。主要改變是：**把每個案例切成語義上的狀態轉移，對 entry 做排名，然後把 entry 的命中結果 promotion 回 parent case。** 這保留了局部相似度，也保留了完整處理路徑。

## 用一個例子走完整個方法：同一個案例如何從 symptom 走到 resolution

下面的例子取自論文 Appendix A 的合成案例風格，但為了說明流程而縮寫，**不是額外的實驗 trace，也不是 RAFT 對這個案例的獨立結果**。原案例是 Windows Server 的 logonHours auditing 問題；本文只保留它的狀態轉移。

1. **Input：初始狀態。** Active case 只有「想限制 service account 的登入時段，並記錄誰修改了 `logonHours`」。這時 Agent 的 query 仍是模糊 symptom，應優先找歷史案例的 opening entries。
2. **Intermediate representation：案例抽取。** RAFT 的 extraction workflow 讀取有順序的 artifacts，輸出 entities、timeline、root cause、resolution steps；timeline 不是每一個 message 一節，而是在 framing 或 current understanding 發生有意義變化時才開新 entry（[Section 4.1](https://arxiv.org/html/2609.20754v1#S4.SS1)）。
3. **Decision：state-aware match。** active case 得到新證據後，query 更新成「需要只針對 `logonHours` property write 的狹窄 SACL，而不是所有 attribute」。這個 query 可能命中歷史案例的 hypothesis 或 finding entry，而不是第一個症狀 entry。
4. **Output：parent trajectory 加 anchor。** 混合 semantic similarity 與 BM25 的 RRF score 對全部 entries 排名；再依 context budget 貪婪地挑選最多 n 個 distinct parent cases。每個被選中的 case 同時回傳完整 `h̃_i` 與最高分的 `k*` anchor，讓 Agent 知道「為什麼這個案例被叫回來」。
5. **Likely failure point：state extraction 或 evidence drift。** 如果抽取器把「廣泛 SACL」誤記成已確認解法，後續查詢可能命中一條看似相似、其實不適用的 trajectory。若歷史 resolution 已被新版本取代，完整回傳 trajectory 也不會自動判斷它過時。

這個例子裡最重要的不是最後那個 SACL 設定，而是 query 在調查過程中會改變。0% progress 的 query 與 60% progress 的 query，不應被當成同一個 static lookup；它們應該對應歷史案例內不同深度的 states。

## 技術機制：兩層 representation，而不是一張萬能 knowledge graph

### Offline indexing：從 raw history 到 structured case

論文把 historical corpus 寫成 `H = {h_i}`。每個 raw case 有 unique id `u_i`、metadata `m_i`，以及按時間排列的 turns `x_1 ... x_T`。抽取後的 structured representation 可概括成：

```text
h_i → h̃_i = (reviewer assessment ρ_i,
              timeline {φ₁ … φ_K},
              root cause r_i,
              resolution / mitigation a_i,
              entities e_i)
```

這個表示式的 operational meaning 是：`φ_k` 對應一段連續 artifacts 所代表的 meaningful state；`r_i` 與 `a_i` 是在案例中有明確證據時才保留的 diagnosis 與 action；`e_i` 和 metadata 可以支援產品、error code、版本或時間篩選；`ρ_i` 則是 application-defined 的 reviewer assessment，不等於「只要結案就可用」。

抽取流程用 bounded batches 讓長 history 超過單次 context window 時仍能處理：worker 每次拿下一批 artifacts、metadata 與累積 state，透過 targeted JSON Patch 加入、修改或刪除狀態；reviewer 最後檢查完整 state、source evidence 與 revision history，再產生 assessment（[Appendix B.2](https://arxiv.org/html/2609.20754v1#A2.SS2)、[Figure 2](https://arxiv.org/html/2609.20754v1#A2.F2)）。注意 processing batch 和 semantic timeline segment 不是同一件事：一個 batch 可以產生多個 entries，一個 entry 也可以跨 batch。

![RAFT 原論文 Figure 2：bounded worker batches、evolving case state 與 final reviewer](/paperReading/raft-stateful-rag-troubleshooting/paper/figure-2-case-extraction.webp)

*圖 2（原論文 Figure 2，Appendix B.2）：worker 逐批讀取 ordered artifacts，將 state、handoff notes 與 targeted edits 帶到下一次 pass；reviewer 再用 source evidence 與 revision history audit、修正並輸出 assessment。原圖來源：[arXiv Figure 2 anchor](https://arxiv.org/html/2609.20754v1#A2.F2)／[arXiv PDF](https://arxiv.org/pdf/2609.20754v1)。原論文頁面標示 CC BY 4.0；本文為本地鏡像，重用時請遵守原授權。*

### Timeline entry：state transition，不是任意摘要段落

每個 `φ_k` 是 contiguous segment，代表 investigation 的一個有意義階段。作者舉出的 transition 包括 opening symptom、加入／排除／確認 hypothesis、確認 root cause，以及提出並驗證 resolution。沒有新 insight 的 acknowledgement 或小更新會併回目前 entry，所以目標是讓 `K_i << T_i`，但每個 entry 仍有 action、investigated hypotheses 與 current understanding。

這個定義保留了三個容易在文章中被壓平的區分：

- **timeline entry 不是 capability**：它是被抽取、被 embedding、被搜尋的 state representation。
- **case-level graph 不是 timeline**：graph 的 vertex 是整個 structured case，edge 由可配置的 similarity view 產生。
- **actionability assessment 不是 theorem 或 universal filter**：作者提供 schema 與 flag 的位置，但哪些 cases 要排除仍是 deployment-specific policy。

### Online retrieval：hybrid score、case promotion、optional expansion

在線 query `q` 到來時，系統先依 user-specified filter 限縮 parent cases，再對符合範圍的 timeline entries 計算 semantic 與 lexical score，透過 Reciprocal Rank Fusion（RRF）合併。演算法不是單純取 top chunks：它沿著 entry ranking 走，第一次遇到某個 parent case 才把該 case 放入 `C`，並把完整 case size 累加到 context budget `B`；當達到 `n` 個 distinct cases 或預算無法容納下一 case 時停止。回傳的是：

```text
R = {(full structured case h̃_c, matched entry k*_c) : c in selected cases}
```

`k*_c` 是該 parent case 中最高分 entry 的 index。這個 anchor 是重要的 provenance：Agent 不只知道「case c 很像」，還知道「它是在 hypothesis、finding 還是 resolution state 被叫回來」。

Graph `G=(V,E)` 位於第二層。實驗以 root-cause text 加 resolution text，對 case pairs 做 semantic + BM25 的 RRF，取 top-k neighbor、去掉低於固定 embedding threshold 的 link，再 symmetrize。graph expansion 的角色是把與 seed case 有同一 underlying cause 或 remediation strategy、但 entry-level symptom 不相似的 sibling 拉進來；它不是 RAFT 主收益的必要條件。

## 實驗如何讀：證據支持的是 retrieval quality，不是 repair success

![RAFT 原論文 Table 2／Table 3 evidence page：synthetic benchmark 的三項 metrics 與 matched-entry depth 結果](/paperReading/raft-stateful-rag-troubleshooting/paper/table-2-results-page.webp)

*圖 3（原論文 Table 2 與 Table 3 的原文 evidence panel，Section 5.4）：Table 2 比較三個 progress points 的 Case Hit、Root Cause Coverage 與 Resolution Steps Coverage；Table 3 檢查命中位置是否隨 active case 進度往 trajectory 深處移動。原文定位：[Table 2 anchor](https://arxiv.org/html/2609.20754v1#S5.T2)／[Table 3 anchor](https://arxiv.org/html/2609.20754v1#S5.T3)／[arXiv PDF](https://arxiv.org/pdf/2609.20754v1)。這是原論文頁面中的表格證據，不是本文重新繪製的 benchmark 圖；原論文頁面標示 CC BY 4.0，本文為本地鏡像。*

### 研究問題、控制條件與 headline result

作者先用 Microsoft Learn Windows Server troubleshooting documentation 建立 structured wiki，再由每個 root cause 生成 2–4 個 cases；最後得到 826 個合成 support cases，分布在 Active Directory、Windows Security、Remote Desktop、Group Policy、Licensing and Activation、Networking、Backup and Storage 七類（[Section 5.1、Table 1](https://arxiv.org/html/2609.20754v1#S5.T1)、[Appendix A](https://arxiv.org/html/2609.20754v1#A1)）。每個 root-cause group 留一個 case 作 test query，其餘進 index。

比較方法包括 vanilla RAG、HippoRAG2、Fast-GraphRAG 與 RAFT。所有方法共用 `text-embedding-3-large`、`gpt-5.2` 作 indexing，以及 `gpt-5.4` 作 evaluation；沒有 metadata filtering，且 context budget 是 6,000 tokens。RAFT、vanilla RAG 與 HippoRAG2 最多回傳 5 個 distinct cases；Fast-GraphRAG 依其 entity／relation／chunk budget 配置（[Section 5.2](https://arxiv.org/html/2609.20754v1#S5.SS2)）。這些控制使比較主要聚焦在 retrieval mechanism，但也代表合成 cases 平均 2,767 tokens，遠短於作者所說 production cases 可能達到的數萬 tokens。

三個 progress points 以 test case 的 turns prefix 建立 query：0% 只有 initial symptom，30% 與 60% 暴露更多 investigation context。三個 metrics 的問題不同：

- **Case Hit**：至少一個 retrieved case 是否與 query 共用 root cause 與 resolution。
- **Root Cause Coverage**：retrieved context 是否蘊含 gold root-cause explanation 被 atomize 後的 claims，由 LLM judge 判定。
- **Resolution Steps Coverage**：retrieved context 是否支持 gold remediation procedure 的 claims。

因此 Case Hit 高，表示找到了同一 issue group 的案例；不等於 Agent 已完成正確診斷，更不等於實際修復成功。

### Synthetic result：RAFT 的優勢和它的解釋

Table 2 的 Case Hit 是：

| 方法 | 0% | 30% | 60% |
| --- | ---: | ---: | ---: |
| Vanilla RAG | 0.673 | 0.719 | 0.769 |
| HippoRAG2 | 0.650 | 0.688 | 0.711 |
| Fast-GraphRAG | 0.421 | 0.442 | 0.583 |
| RAFT | **0.842** | **0.871** | **0.888** |

對照答案是：RAFT 在三個 stage 都更常找回同一 root-cause／resolution group，且不是只在後期 context 比較完整時才有效。Authors 對 RAFT 和 vanilla RAG 在相同 held-out groups、progress points、context budgets 的 paired results 做 issue-group clustered bootstrap；Table 5 的 Case Hit differences 為 0% `+16.79 pp [13.91, 19.78]`、30% `+14.79 pp [12.02, 17.73]`、60% `+12.19 pp [9.75, 14.68]`。

機制上的佐證來自 matched-entry depth：命中 entry 的平均深度從 0% query 的 9.1%，移到 30% 的 20.0%，再到 60% 的 54.0%（Table 3）。這與 state-aware hypothesis 一致：早期症狀會對上早期 entry；active case 得到更多診斷證據後，query 會對上歷史案例更深的中間狀態，而不是永遠重新命中 opening symptom。

但這不能解讀成「GraphRAG 一律不適合 support」。在這個 setting，HippoRAG2 與 Fast-GraphRAG 的 entity-centric graph 沒有超過 vanilla RAG；作者的合理解釋是，這個 task 優先需要 coherent similar cases 與 actionable guidance，而不是跨文件的抽象 relation inference。它不會證明所有 production GraphRAG 都會退步。

### Coverage、noise 與 ablation：哪些現象值得保留

RAFT 不只在 Case Hit 高，Table 2 也在 Root Cause Coverage 與 Resolution Steps Coverage 的九個欄位都取得最高 point estimate。不過 Appendix C.3 對 confidence intervals 的解讀更保守：early-stage coverage gains 和 30% root-cause gain 有統計支持，60% root-cause 的 interval 跨過 0，30% resolution gain 接近 interval boundary，60% resolution gain 沒有可支持的差異 claim。這是很重要的 claim-strength 邊界：表格的最佳數字不自動等於每一格都已被證明優勢。

Appendix C.4 做 paired query robustness：加入 typo、刪掉 40% updates，或插入 unrelated turn。typos 與 dropout 的兩方法差異沒有被統計解決；插入 unrelated turn 時，RAFT 的 Case Hit 下降幅度小於 vanilla RAG，尤其 60% progress 的 paired difference favor RAFT `+39.94 pp [35.73, 44.10]`。但作者明說這是 controlled query-robustness 與 benchmark evidence，不是 noisy corpus robustness、production-scale behavior 或 cross-domain generalization。

Graph contribution 也應該讀成有限的 engineering option。以 k=3 的 budget-matched graph expansion，full-sibling recovery 在 0% 與 30% 稍有改善，60% 幾乎不變；overall Case Hit change 只有 `+0.22`、`−0.28`、`−0.06 pp`。因此 graph 是 evidence-diversification mechanism，而非 RAFT 主要 retrieval gain 的來源。Indexing-model ablation 則顯示 gpt-5.4-mini 與 low-reasoning 只有 modest drops，gpt-5.4-nano 退步較明顯；這支持「抽取品質重要，但較小模型可能可用」的 cost trade-off，不支持任意便宜模型都安全。

## Apache Jira transfer：更接近真實，但樣本仍小

Apache Jira evaluation set 來自 Cassandra、Hadoop、HBase、Spark 的 public issue histories。後來的 duplicate report 作 held-out query，較早且在 query 開啟前已 `Fixed` 的 issue 作 exact target；其他 570 個 Fixed issues 是 distractors，不被視為 certified semantic negatives，因為 Jira links 可能不完整。最終是 30 個人工稽核 duplicate groups、600 cases 的 corpus；所有 30 組可評估 0%／30%，60% 只剩 19 組有足夠 pre-disclosure history（[Appendix D](https://arxiv.org/html/2609.20754v1#A4)）。

RAFT 沿用 synthetic 實驗的 extraction prompt、schema、models 與 retrieval procedure，只把 context cap 改成 5,000 tokens。Jira 沒有 gold root-cause 或 resolution-step annotations，因此只報 Case Hit：vanilla RAG 在 0%／30%／60% 為 0.667／0.667／0.789，RAFT 為 0.833／0.840／0.895。這是 +16.7、+17.3、+10.5 percentage points 的方向性 evidence，但作者不提供 confidence intervals，也不把它包裝成 production validation。

這個 transfer test 的價值在於：它沒有把合成 Windows Server 的 group label 當成唯一世界，且直接使用 contributor-written、unredacted issue histories。然而它同時有三個限制：樣本是 30 組、60% progress 的有效組數更少、Jira duplicate link 不是完整負例標註。更重要的是，它仍只驗證「找回被標記 duplicate 的 case」，不是用 RAFT 修完 Cassandra 或 Spark issue 後能否真的通過測試。

## 限制與不該過度解讀

RAFT 的限制不是附錄裡可以略過的 housekeeping，而是決定這個 retrieval layer 能不能安全轉移到 production 的條件：合成資料規模仍中等，Apache Jira transfer sample 很小，且論文沒有評估 end-to-end troubleshooting outcome。更不能把較高 Case Hit 解讀成「一定找到正確修復」；抽取、freshness、privacy 與 incomplete history 都可能讓整條 trajectory 帶入錯誤。

## Evidence map：Paper、Evidence 與 Bloss0m judgment 要分開

### Paper 直接提出的內容

- closed case 的 structured representation，包含 reviewer assessment、timeline、root cause、resolution、entities 與 metadata；
- entry-level hybrid retrieval、greedy promotion to parent cases、matched anchor entry；
- 可配置、optional 的 case-level graph；
- synthetic Microsoft Learn benchmark、Apache Jira transfer set，以及 Case Hit、Root Cause Coverage、Resolution Steps Coverage 三項 retrieval metrics。

### Evidence 實際支持的內容

- 在作者設定的合成 benchmark 中，RAFT 在三個 progress points 的三項主 metrics point estimate 都較高，Case Hit 相對 vanilla RAG 的三個差異有 clustered bootstrap 支持；
- matched-entry depth 隨 query progress 往 trajectory 深處移動，與 state-aware retrieval 的機制預期一致；
- Apache Jira 的小型人工稽核 transfer set 顯示方向一致的 Case Hit 優勢；
- graph expansion 在這個 benchmark 只帶來很小、依 progress 改變的 sibling recovery 影響。

### 尚未建立的事情

- 沒有證明 RAFT 會提高 final diagnosis、resolution success、engineer productivity 或 end-to-end agent reward；
- 沒有證明較長、持續變動、含大量 PII 的 production cases 會保有同樣的 gain；
- 沒有把 extraction cost、index latency、embedding storage、revision／deletion policy 量化成完整的 deployment TCO；
- 沒有證明 current repository 中可直接重跑 paper 全部合成 benchmark 的資料與腳本都已經公開。

### Bloss0m 工程化整理

本文把 adoption 判斷整理成三個 deployment gates，這是 **Bloss0m 工程化整理，不是論文提出的三階段框架**：

1. **State gate**：若團隊無法定義什麼叫 meaningful state transition，先不要上 RAFT；timeline 會變成任意摘要，entry-level score 也失去意義。
2. **Evidence gate**：每個 entry 要能回到原始 artifacts、revision history 與 reviewer decision；只保存 LLM 摘要會讓 error propagation 難以稽核。
3. **Outcome gate**：在線上除了 Case Hit，還要量 final diagnosis correctness、resolution verification、stale-action rate、privacy leakage、latency、token cost，以及 failure cases。

## Artifact 與可重現性：實作可用，release 目前是 partial

截至 **2026-09-21**，我獨立檢查了 Microsoft 的 [RAFT repository](https://github.com/microsoft/RAFT)：

| Artifact | 狀態 | 我核對到的內容 | 仍要保留的 caveat |
| --- | --- | --- | --- |
| implementation | 可取得 | public GitHub、MIT License、Python 3.11+ package；包含 extraction、retrieval、graph、LocalPipeline 與 tests | 需要外部 model credentials；版本與 provider 設定會影響重跑 |
| Apache Jira corpus / queries | 可取得 | `datasets/Apache_Jira/corpus.jsonl`（600 cases）與 `queries.jsonl`（30 held-out queries），並附 README 的欄位與評估規則 | Jira source histories 會隨時間變動；要固定 commit／snapshot 才能做可比重跑 |
| synthetic Windows Server benchmark | repository tree 未找到 | README 與 paper 仍描述它是 released benchmark，但我檢查目前 public tree 的 `datasets/` 僅看到 Apache_Jira | 不能把 paper 的 release claim 寫成目前已核實可下載；需要作者補充 direct endpoint 或 commit |
| full paper rerun | 部分可行 | Apache Jira Case Hit 可依 README 的 `corpus.jsonl`、`queries.jsonl`、valid progress flags、target key 重建 | synthetic table、五次 split、model endpoint、judge prompts 與 exact generation snapshot 仍需完整固定 |

README 提供的 quickstart 需要 `git clone`、Python 3.11+、`pip install -e .` 與 provider credentials；`LocalPipeline` 適合 quick local experiments，production usage 還需要自行準備 case source、persistent vector／hybrid index 與 retry queue。這是「實作可讀、部分資料可取」而不是「任何人不需額外資料即可重現所有結果」。

## 工程判斷與不適用條件：何時保留 trajectory，何時不要用 RAFT

### 可能值得採用的條件

- support／incident records 有清楚的時間順序，並且「現在的假設」會隨 logs、工具結果或人員介入而改變；
- 團隊需要在多次 query 中追蹤同一類 investigation，而不是只回答一次 FAQ；
- 原始 cases 太長，讓 Agent 每次重讀全文的 token cost 高於一次 offline extraction 的成本；
- 能建立 artifact-level provenance、review policy、PII redaction 與 stale-case invalidation。

### 不應直接套用的條件

- corpus 主要是靜態規格、FAQ 或短文件，沒有 state transition；在這裡 timeline extraction 可能只增加 cost；
- case history 不完整、沒有可信的時間順序，或解法常常是一次性的未驗證猜測；回傳 parent trajectory 會製造假連續性；
- 類別的 remediation 會快速過期，但沒有 version／validity metadata；
- 團隊沒有能力 audit extraction，卻想把 `root_cause` 與 `resolution_steps` 當成 ground truth；
- success metric 只有 Case Hit，沒有 downstream diagnosis、safety 或 outcome check。

比較務實的 rollout 是先把 RAFT 當 retrieval component，而不是 autonomous troubleshooter：離線抽取與 reviewer audit → versioned index → online query／matched anchor → Agent 自己判斷是否採用 → action 前再做 current-state verification。這個 sequence 是 **工程解讀**，不是作者聲稱的 production protocol；它只是把論文的 retrieval boundary 和 artifact caveat 翻成較安全的導入方式。

## 讀完後的三個記憶點

1. **Technical idea**：RAFT 的核心是「entry-level state match + parent trajectory return」；optional graph 只是第二層的 related-case expansion，不是主要 insight。
2. **Evidence**：合成 Windows Server benchmark 與小型 Apache Jira audit 都支持較高 Case Hit；matched-entry depth 也隨 progress 變深，但 coverage、graph contribution 與 transfer 都有更細的統計邊界。
3. **Boundary**：它證明的是 retrieval layer 在特定 protocol 下更會找相似案例，不是證明 Agent 已經會正確診斷、修復 production ticket，或能免除 extraction、privacy、freshness 與 index maintenance。

## 延伸閱讀

- 如果你想先理解一般 RAG 如何把 evidence 帶進生成，可讀 [RAG 與證據基礎](/paper-reading/53-agentic-rag-partial-answer-prediction/)。
- 如果你關心 Agent 如何保存與更新長期狀態，可接著讀 [Agent 記憶與適應](/paper-reading/60-self-improvement-fast-tree-search/)。
- 如果你要把 retrieval quality 與 final agent outcome 分開評估，可讀 [Agent 評測與可觀測性](/paper-reading/57-agentic-rag-causal-failure-attribution/)。

## Primary sources

- [Zhang et al., “RAFT: A Stateful Retrieval-Augmented Framework for Troubleshooting Agents,” arXiv:2609.20754v1](https://arxiv.org/abs/2609.20754)（paper identity、Sections 3–5、Appendices A–D、CC BY 4.0）。
- [arXiv HTML full text](https://arxiv.org/html/2609.20754v1)（Figures 1–2、Tables 1–9、locatable section anchors）。
- [Microsoft RAFT repository](https://github.com/microsoft/RAFT)（implementation、MIT License、Apache Jira artifact 與 quickstart；截至 2026-09-21 核對）。
