---
title: "推理之前就可能失敗：Agentic RAG 的證據前程序性失敗"
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
image: "/paperReading/15-before-reasoning-fails/title_image.png"
field: "Retrieval Systems"
difficulty: "advanced"
showToc: true
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

## 90 秒地圖 / The paper in 90 seconds

- **問題**：agentic RAG 可 search 到 snippets 卻在 read 前 final；這是 evidence-conditioned reasoning 開始前的程序失敗，不應與讀過 gold evidence 後仍答錯混為一談。
- **核心想法**：以 saved tool traces、retrieved/read passages 和 final answer 定義 discipline 與 post-gold-read failure；Read-Gate 強制「search 後、final 前至少 read 一段」，不改模型、retriever 或 reasoning budget。
- **最強證據**：12,000 個 paired trajectories 跨 HotpotQA、2WikiMultiHopQA、MuSiQue；zero-read subset forced reading 的 LLM-Acc 增加 14.9–19.9 points，完整 minimal-reasoning cells 增加 3.2–9.4（Table 1、Section 5.2）。
- **邊界**：適用於可觀察 search/read/final action 的 multi-hop QA；read 不保證已讀對或推理正確，MuSiQue 缺完整 gold chunk annotation 也限制 post-gold-read 分析。

## 先前方法為何不足 / Why the previous approach is insufficient

final answer accuracy 或更大 hidden thinking budget 看不出 agent 是否真的檢查證據；只要 retrieve 了 snippet，模型仍可能憑片段/先驗直接作答。policy learning 改變偏好，但不保證 runtime 當下遵守 read-before-final 的可檢查 invariant（Section 2、Section 3）。

## 核心直覺 / Core intuition and method

錯誤軌跡依 priority accounting 分為 discipline、post-gold-read、retrieval、ambiguity；multi-label 指標另檢查它們是否同時發生。Read-Gate 的 predicate 很窄：若 search 後 `read_count=0` 就拒絕 final 並回傳 corrective observation。它不是把更多 context 注入 prompt，而是要求 agent 執行 evidence-inspection action（Figure 2、Section 3.1–3.4）。

## 逐步例子 / Worked example

多跳問題先 search 得到兩段 snippet。voluntary agent 在未開全文時直接 final，且答錯，會被標成 no-read discipline failure。Read-Gate 攔下 final、要求 read 一個候選 chunk；若仍答錯，可能轉成 post-gold-read、retrieval 或 ambiguity 問題。若只把同一段文字塞進 context 而不用 read action，正是 ctx-inject control 要區分的機制。這是依 Figure 1–2 的說明例子。

## 如何讀實驗 / Evidence, controls, and limits

**Figure 3 / Table 1** 將 zero-read rescue subset 與 population effect 分開；14.9–19.9 points 是自選的 zero-read subset，不能當所有 query 的 marginal effect。**Table 2 / Section 5.4** 比較 no-gate、Read-Gate、ctx-inject，回答提升是否只因額外 context。**Section 5.5–5.6、Appendix C–D** 以 reasoning-level、extractor、threshold、paired McNemar/bootstraps 檢查穩健性；更大 hidden thinking 不保證 read，卻不表示所有 gate 都無成本或所有 failure 可修。

## Artifact 與採用判斷 / Artifacts and engineering decision

截至 **2026-08-09**，論文的 [official repository](https://github.com/Noverse0/before-reasoning-fails) 可達；primary paper 宣告完整 agent loop、reproduction scripts、33,950 raw trajectories（49 files）與 cached analysis outputs。仍需 clone 後核對 license、資料處理、OpenAI API/模型版本與 costs 才可稱完整重現。適合在高風險 evidence workflow 加上最小 read invariant 與 trace；不適合對隱式 retrieval、無 read action 邊界的系統硬套，或將「讀過」當 grounding 保證。

## 三個記憶點 / Three things to remember

1. 有 search 不等於有 evidence inspection；程序失敗可在 reasoning 前發生。
2. Read-Gate 是 runtime action constraint，不是更強模型或多一段 context 的同義詞。
3. 部署需同時量 read quality、retrieval coverage、latency 與不能自動回復的 post-read error。

一個 Agent 搜尋到看似相關的 snippet，卻沒有讀取完整 passage 就送出答案。這個答案可能偶然正確，也可能看起來像有 reasoning，實際上從未進入 evidence-conditioned reasoning。Roh 與 Han 的 **Before Reasoning Can Fail** 問的不是「模型會不會思考」，而是「模型是否真的執行了回答前必須完成的證據檢查程序」。

> **花花的工程提醒**
>
> 如果 trace 只記 final answer，不記 search、read、讀了哪個 chunk，以及何時被允許 finalize，就無法知道錯誤發生在 retrieval、evidence inspection，還是讀完之後的回答推理。

## 先回答讀者問題：能。Agent 可能在 reasoning 被測試前就先失敗

**讀者問題：Can a RAG agent be wrong because it never inspected retrieved evidence, even when its answer-side reasoning looks substantial?**

答案是可以，但要精確限定：這篇論文只在有離散 `search`、`read`、`final` action 的 agentic RAG 介面上，透過已保存的軌跡定義一種程序性失敗。它沒有證明所有錯誤都源自「懶得讀」，也沒有證明 Read-Gate 能讓一般企業 RAG 變成可靠系統。

在 12,000 條配對軌跡裡，作者將錯誤拆成四個互斥 accounting bucket：discipline、post-gold-read、retrieval 與 residual ambiguity。多標籤版本則允許 discipline 和 post-gold-read 同時觸發；兩者在 regex 與 spaCy entity extractor 下的 both-trigger rate 是 **11.2%–13.1%**。這是「兩種失敗不是同一件事」的證據，不是對所有錯誤比例的通用估計（[摘要與 §3.1–§3.4](https://arxiv.org/html/2608.02011v1#S3)）。

## 論文身份、版本與問題邊界

本文按 Paper Radar 指派閱讀 **arXiv v1**，提交日為 **2026-08-03**，作者為 Daeyoung Roh 與 Donghee Han；它是 cs.AI 預印本，不是已接受的會議或期刊論文。需要留意版本狀態：截至 2026-08-07，arXiv record 已顯示 2026-08-04 的 v2，但以下數字、圖與引用錨點固定對應指派的 [v1 HTML](https://arxiv.org/html/2608.02011v1) 與 [v1 PDF](https://arxiv.org/pdf/2608.02011v1)。因此不應把本文解讀成 v2 的結果摘要。

論文研究的是 Wikipedia-style English multi-hop QA。它的觀察單位不是單一答案，而是一條包含 tool calls、retrieved snippets、read passages、gold evidence 與 final answer 的 trajectory。對錯誤軌跡集合，作者用下列優先順序做互斥計數：

$$
\mathcal{E}_{wrong}=\mathcal{E}_{disc}\;\dot{\cup}\;\mathcal{E}_{post}\;\dot{\cup}\;\mathcal{E}_{retr}\;\dot{\cup}\;\mathcal{E}_{amb}.
$$

這裡的 $\mathcal{E}_{disc}$ 是沒有遵守 evidence-inspection protocol 的錯誤；$\mathcal{E}_{post}$ 是讀到至少一個 gold-supporting chunk 後仍答錯；$\mathcal{E}_{retr}$ 是 gold evidence 沒出現在 top-$k$ 結果；$\mathcal{E}_{amb}$ 是剩餘、無法乾淨歸類的錯誤。論文特別強調，這些 label 是對保存軌跡的 deterministic measurement，不是對模型 latent cognition 的心理推論（[§3 Framework](https://arxiv.org/html/2608.02011v1#S3)）。

## Method skeleton：把「讀證據」變成可檢查的 runtime invariant

作者的實驗流程可以壓成四步：

1. **保存軌跡**：記錄 `search` 回傳的 top-5 chunk IDs 與 snippets、`read` 的完整 chunk、read count、gold evidence 與 final answer。
2. **標註錯誤軸**：先檢查 no-read final、snippet-only final、low-evidence final；再檢查是否讀到 gold-supporting chunk，最後才分到 retrieval 或 ambiguity。
3. **加上 Read-Gate**：如果模型在 `read_count=0` 時發出 final，環境拒絕這個 action，回傳 corrective observation，要求它先對有希望的 chunk 呼叫 `read`。Read-Gate 不改模型權重、retriever、index、judge、temperature 或 reasoning budget（[§3.2–§3.3](https://arxiv.org/html/2608.02011v1#S3.SS2)）。
4. **做配對比較**：以相同 question ID 比較 no-gate、不同 reasoning effort 與 Read-Gate，並用 accuracy、錯誤率、paired tests 和成本／迴圈開銷看 intervention 的邊界。

Read-Gate 的 invariant 是「search 之後，final 之前至少發生一次 read」，不是「讀到正確 chunk」或「答案已被驗證」。這個區分是整篇文章最重要的工程邊界。

## Experimental setup：資料、控制器、baseline 與 metrics

### Datasets 與樣本配置

主實驗使用三個 Wikipedia-style multi-hop QA dataset：**HotpotQA、2WikiMultiHopQA、MuSiQue**。每個 dataset × condition cell 使用 $n=1{,}000$ 個依 question ID 配對的例子；四個 OpenAI controller condition 是：

1. `gpt-4o-mini`；
2. `gpt-5-mini` minimal reasoning；
3. `gpt-5-mini` medium reasoning；
4. `gpt-5-mini` minimal reasoning + Read-Gate。

三個 dataset × 四個 condition × 1,000 題形成 **12,000 條 OpenAI-family paired trajectories**。Medium reasoning 的 boundary ablation 與 gate-family probe 使用 matched $n=100$，不應和完整 $n=1,000$ cell 混讀。MuSiQue 的 processed export 沒有完整 per-chunk gold-evidence fields，因此它可用於 aggregate accuracy、discipline failure 與 Read-Gate effect，但需要 gold chunk 的 $\mathcal{E}_{post}$ 分析主要限於 HotpotQA 與 2WikiMultiHopQA（[§4.1](https://arxiv.org/html/2608.02011v1#S4.SS1)）。

### Agent interface、retrieval 與 judge

兩個工具是 hybrid `search` 與 full-chunk `read`。Search 用 BM25 加 Qwen3-Embedding-0.6B dense retriever，以 reciprocal-rank fusion 的 $k=60$ 合併，交給 agent top-$k=5$ 個 chunk IDs 與短 snippets；read 依 ID 展開完整 chunk，跨 search call 的重複 chunk 不重複計 evidence。主 loop 上限是 10，token budget 是 128k，temperature 是 0.0。

主指標是 **LLM-Acc**：固定的 gpt-5-mini judge 只看 question、gold answer 與 prediction，回傳 semantic-equivalence binary label；**Contain-Acc** 是 short-form gold 可用時的 string-containment secondary metric。作者也報告 discipline／post-gold-read rate、odds ratio、exact McNemar test、question-clustered logistic model、paired bootstrap 95% CI，以及 within-cell stratified label permutation。Gemini 2.5 Flash 只做 hidden thinking-budget external diagnostic，Gemini 2.5 Pro 對 $n=450$ 分層樣本做 cross-judge robustness，不是主 controller。

## Figure 2：錯誤不是一條線，而是四個可操作的分支

![Figure 2：trajectory-level error decomposition](https://arxiv.org/html/2608.02011v1/x2.png)

*圖 1｜論文 Figure 2 將錯誤軌跡依 priority 分到 discipline、post-gold-read、retrieval 與 ambiguity；Read-Gate 只直接阻擋 discipline branch。來源：[Figure 2，§3](https://arxiv.org/html/2608.02011v1#S3.F2)。圖版作者為 Daeyoung Roh、Donghee Han，依 [arXiv non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) 標示來源；該頁不是 CC BY 聲明。*

三個 discipline subtype 的含義不同：

- **No-read final**：錯誤答案在 `read_count=0` 時送出；這是最不依賴 entity matching heuristic 的主 signal。
- **Snippet-only final**：答案 entity 只在搜尋 snippet 出現，沒有出現在 read chunk。
- **Low-evidence final**：問題中的 named entities 在 read chunks 的 coverage 低於 80%。

因此「有 read action」也不等於「證據已足夠」。Appendix H 的 pooled breakdown 顯示，1,725 個 discipline failures 中 **56.8%** 是 strict no-read、**9.3%** 是 snippet-only、**33.9%** 是 low-evidence；另有 **43.2%** 的 discipline failures 已有至少一次 read，這正是 Read-Gate 不能保證充分 evidence inspection 的限制（[Appendix H，Table 15](https://arxiv.org/html/2608.02011v1#A8.T15)）。

## Results：Read-Gate 什麼時候有效？

### 1. 兩種錯誤軸確實不等價

12,000 條 OpenAI trajectories 中有 **3,807** 個 wrong cases。多標籤重分類的 discipline-only / post-only / both / neither 依 extractor 分別是：

| Entity extractor | discipline-only | post-only | both | neither |
| --- | ---: | ---: | ---: | ---: |
| regex | 46.5% | 21.4% | 11.2% | 20.9% |
| spaCy `en_core_web_sm` | 50.2% | 19.5% | 13.1% | 17.2% |

兩個 extractor 的 discipline indicator agreement 是 Cohen’s $\kappa=0.628$。Figure 3 也顯示 discipline failure 在 gpt-5-mini minimal 達高點，而 post-gold-read error 隨 reasoning effort 呈現不同曲線；作者因此把兩者視為不同 control axis，而不是同一個「模型不會推理」分數（[Figure 3，§5.1](https://arxiv.org/html/2608.02011v1#S5.F3)）。

![Figure 3：error indicators across agent regimes](https://arxiv.org/html/2608.02011v1/x3.png)

*圖 2｜論文 Figure 3 的 x 軸是 regime-level，不是 model scaling curve；它支援「discipline 與 post-read 的變化方向不同」，不支援更大模型必然改善所有錯誤。來源：[Figure 3，§5.1](https://arxiv.org/html/2608.02011v1#S5.F3)；作者與授權標示同上。*

### 2. 在 agent 原本會跳過 read 的題目上，forced reading 有救援效果

[Table 1](https://arxiv.org/html/2608.02011v1#S5.T1) 先挑出 voluntary minimal-reasoning policy 下會 zero-read finalize 的題目，再用相同 question rerun forced read。LLM-Acc 由 HotpotQA **58.1 → 73.0（+14.9）**、2Wiki **42.1 → 62.1（+19.9）**、MuSiQue **22.5 → 37.4（+14.9）**，三者 paired McNemar $p<10^{-4}$。

但這是 **self-selected zero-read subset 的 rescue effect**，不是整個 population 的 marginal effect。把它寫成「Read-Gate 普遍提升 14.9–19.9 點」會過度解讀；完整 minimal cell 的結果要看下一個控制實驗。

### 3. 完整 minimal cells 的 gain 是 3.2–9.4 點，而且與 residual discipline error 同向

[Table 3](https://arxiv.org/html/2608.02011v1#S5.T3) 的完整 minimal cell 是：HotpotQA LLM-Acc **79.6 → 82.8（+3.2）**，2Wiki **64.4 → 69.7（+5.3）**，MuSiQue **34.2 → 43.6（+9.4）**。對應 no-gate discipline failure 為 **13.3%、22.1%、57.0%**；residual discipline error 越高，gate headroom 越大。

同一張表的 medium boundary rows 反而是 HotpotQA **+0.0**、2Wiki **−7.0**、MuSiQue **−4.0**，而且是 $n=100$ matched ablation。這不是 Read-Gate 與主結果矛盾，而是它沒有在 agent 已經可靠 read 時提供 headroom；強制 intervention 可能只增加阻擋與 loop 成本。Appendix B.4 的 Figure 5 把這個條件性關係畫得更清楚（[Figure 5，Appendix B.4](https://arxiv.org/html/2608.02011v1#A2.F5)）。

### 4. 「把同一段文字塞回 context」不足以解釋 gain

三臂 mechanism ablation 的結果如下（[Table 2，§5.4](https://arxiv.org/html/2608.02011v1#S5.T2)）：

| Dataset | No Read-Gate | Read-Gate | Context injection |
| --- | ---: | ---: | ---: |
| HotpotQA | 79.6 | **82.8 (+3.2)** | 79.5 (−0.1) |
| 2WikiMultiHopQA | 64.4 | **69.7 (+5.3)** | 57.0 (−7.4) |
| MuSiQue | 34.2 | **43.6 (+9.4)** | 38.1 (+3.9) |

Context-inject 是偵測到同一 trigger 後，把 rank-1 chunk text 靜默附加成 user-role observation，但不產生 read tool call。它在 2Wiki 甚至 net-negative；所以作者最支持的解釋是「self-issued read action 的 action commitment」而不是單純 context 多了一段。不過這仍是 controls 支持的 interpretation，不是已完全隔離的 causal mechanism。MuSiQue 的四臂 probe（$n=500$）也只提供局部支持：user-role +4.4、tool-role +5.2、Read-Gate +8.2，Read-Gate 相對 tool-role 再多 **+3.0**（[Appendix C.1，Table 10](https://arxiv.org/html/2608.02011v1#A3.T10)）。

### 5. Read-Gate 與 reasoning effort 改變的是不同地方

若直接看 marginal $P_{post}$，Read-Gate 的 OR 是 1.46；但作者指出這是 reclassification：原本 no-read 的錯誤被 gate 轉成「有 read 但仍錯」，因此才有資格進入 post-gold-read label。控制 read exposure 後，$n=1,863$ 的 within-strata $P_{post}$ OR 是 **1.00 [0.84, 1.19]**，HotpotQA + 2Wiki 的 stricter gold-read-both stratum 也為 **1.00 [0.83, 1.20]**。相較之下，gpt-5-mini medium vs minimal 將 $P_{disc}$ OR 降為 **0.22 [0.20, 0.26]**，$P_{post}$ OR 降為 **0.51 [0.43, 0.61]**。這是 [Table 4，§5.5](https://arxiv.org/html/2608.02011v1#S5.T4) 對「runtime constraint 不是更長 reasoning 的同義詞」最直接的證據。

![Figure 7：Read-Gate 與 reasoning effort 在 failure plane 上的不同方向](https://arxiv.org/html/2608.02011v1/x6.png)

*圖 3｜論文 Figure 7 將 $P_{disc}$ 與 $P_{post}$ 放在同一個平面：Read-Gate 主要往下壓 pre-evidence failure，medium reasoning 則同時改變兩個軸。MuSiQue 沒有 gold evidence，因此 $P_{post}=0$。來源：[Figure 7，Appendix J](https://arxiv.org/html/2608.02011v1#A10.F7)；作者與 [arXiv non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) 標示同上。*

## Ablations 與 diagnostic slices：哪些結果不能忽略

- **Hidden thinking budget**：Gemini 2.5 Flash 在 no-gate 下把 thinking budget 從 0 增到 1,024，zero-read finalization 在 HotpotQA、2Wiki、MuSiQue 分別上升 **+5.7、+24.8、+42.6 pp**；paired correctness 的 Net Δ 分別是 **−44、−67、−73**（[Table 5，§5.6](https://arxiv.org/html/2608.02011v1#S5.T5)）。這只是一個 external diagnostic，不能推成所有 hidden reasoning 都有害，但足以否定「花更多內部 token 就自然會讀 evidence」。
- **Prompt-only control**：Appendix K 的 strict prompt 把 zero-read 降到 HotpotQA 12.4%、2Wiki 20.7%、MuSiQue 48.1%，但 LLM-Acc 仍是 79.6、61.6、37.4，沒有重現 Read-Gate 的 82.8、69.7、43.6（[Table 17，Appendix K](https://arxiv.org/html/2608.02011v1#A11.T17)）。文字規則可改變表面行為，不能直接等同 execution-level enforcement。
- **Broader gate family**：Appendix F 的 `+snippet`、`+lowev`、`full` gate 在 $n=100$ probe 上可能帶來局部 gain，但 low-evidence 與 full 的 corrections/Q 超過 2，且 dataset-sensitive。作者因此選最弱、最可解釋的 read-before-final invariant 作主 intervention，而不是把 heuristic coverage gate 全部打開（[Figure 6，Appendix F](https://arxiv.org/html/2608.02011v1#A6.F6)）。
- **Cross-family transfer**：Qwen2.5 的 $n=200$ per-cell check 方向不穩定：MuSiQue 3B 是 **+6.0 [1.0, 11.5]，$p=0.043$**，但 HotpotQA 3B 是 −2.0、2Wiki 7B 是 −2.0，其餘多數 CI 跨 0。這支持「框架可測」而非「gate 在不同 backbone 一定有效」（[Appendix D.1，Table 12](https://arxiv.org/html/2608.02011v1#A4.T12)）。
- **Judge robustness**：固定 gpt-5-mini judge 與 Gemini 2.5 Pro 對 $n=450$ 分層 triples 的 pooled $\kappa=0.924$，各 cell 的 reweighted gap 約在 −3.7 到 +1.3 pp；這降低 judge 單一模型造成的疑慮，但沒有把 LLM judge 變成 ground truth（[Appendix L，Table 18](https://arxiv.org/html/2608.02011v1#A12.T18)）。

## 證據地圖：Paper、作者／vendor claim 與 Bloss0m 判斷

### Paper evidence

論文本身支持三個窄結論：第一，discipline 與 post-gold-read 是可由 trace 分開觀測、且大量不重疊的錯誤軸；第二，Read-Gate 在 residual discipline error 高的 minimal cells 可救回一部分 zero-read failures；第三，更多 hidden thinking 不保證 external evidence inspection。這些結論都綁定 English Wikipedia-style multi-hop QA、兩工具 action boundary 與本文 controller family。

### Author / vendor claims

論文 §4.4 寫明作者釋出完整 agent loop、Read-Gate implementation、重現 table／figure 的 scripts，以及 33,950 條 raw trajectories，其中包含 12,000 條 paired corpus。這是 **paper 的 release claim**；但我在 2026-08-07 直接開啟論文腳註所指的 [official code URL](https://github.com/Noverse0/before-reasoning-fails) 得到 **HTTP 404**，所以不能把該 claim 改寫成「code 可下載、完整可重現」。

同樣地，作者使用 OpenAI API、Google Gemini API 與 Qwen3-Embedding-0.6B，這些是實驗依賴，不是 paper 自己控制的 artifact。模型版本漂移、API policy、token pricing 與 judge 行為都可能改變重跑結果；這是 vendor-dependent constraint，不應混成 Read-Gate 的效果。

### Bloss0m inference

我的工程判斷是：若 production logs 顯示 agent 經常 `search → final` 且 `read_count=0`，Read-Gate 是值得做 shadow test 的低侵入候選；但 gate 只修程序，不修 retrieval miss、錯誤 chunk、權限洩漏或答案驗證。若系統已經穩定讀取，或根本沒有離散 read boundary，全球開啟 gate 可能只增加 latency、loop 與 token 成本。

## Limitations、threats to validity 與 unsupported claims

論文自己的限制需要保留，而不是用 headline gain 蓋過：

1. **Domain narrowness**：三個 dataset 都是 English Wikipedia-style multi-hop QA；其他企業文件、私有知識庫、非英文與多模態 RAG 的 snippet semantics 不同。
2. **Interface assumption**：框架假設 search/read/final 是可觀測的 discrete actions；固定 context RAG、隱式 interleaved retrieval-generation 或沒有 read action 的 agent 無法直接套用。
3. **Retrieval is out of scope**：Read-Gate 假設 search 有一定機率回傳有用 candidates。若 gold evidence 根本不在 top-5，強制 read 只會讓 agent 讀錯資料；正式環境仍需 retrieval-quality monitoring、filtering 與 answer-side verification（[Limitations](https://arxiv.org/html/2608.02011v1#Sx1.SS0.SSS0.Px1)）。
4. **Gold evidence caveat**：MuSiQue 缺少完整 per-chunk gold fields，因此 post-gold-read 分析不能和另外兩個 dataset 等量齊觀。
5. **Heuristic labels**：snippet-only 與 low-evidence 依賴 entity matching；作者以 strict no-read lower bound、threshold sweep、bootstrap、permutation 與 hand-labeled matcher check 做 robustness，但這些仍不是人工重新標註所有軌跡。
6. **Intervention downside**：當 agent 已經可靠 read 時，medium rows 的 Read-Gate gain 為 0 或負值；Appendix B.5 也顯示 reads、loops、corrections 與 retrieved tokens 上升。Gate 是診斷 intervention，不是 universally optimal policy。
7. **Unsupported claims**：證據不支持「Read-Gate 取代更強 reasoning」、「Read-Gate 解決 retrieval quality」、「讀一次就代表 evidence 足夠」、「hidden thinking 對 production RAG 有害」，也不支持把 14.9–19.9 點 rescue effect 當成所有流量的提升。

## 工程落地：先做可觀測的 invariant，再決定是否攔截

若要把這篇論文轉成 production experiment，我會按下列順序做：

1. **先記錄，不先攔截**：對每個 request 記 `search_count`、`read_count`、read chunk IDs、top-k rank、final timing、retrieved tokens、loop turns、答案與 verifier 結果；先建立 no-read rate 與 low-evidence proxy。
2. **做 risk-gated shadow test**：只在 zero-read finalization 高、回答風險高且 read API 可重試的流量開啟 gate；以 matched questions 或 traffic slice 比較 accuracy、unsupported answer、latency、cost 與 abstention，不要只看 LLM judge。
3. **保持三條責任鏈分開**：retrieval quality 量 recall／coverage，Read-Gate 量程序遵守，answer verification 量最終正確性。三者不能用一個 overall accuracy 互相遮蔽。
4. **把 gate 當 feature flag**：設定 max corrections、loop cap、fallback 與 kill switch；若 candidate evidence 不相關，應導向 retry／clarify／abstain，而不是無限要求「再讀一段」。
5. **不適用時不要硬套**：固定 context RAG、沒有可觀測 read action 的 controller、或 read 本身會暴露高敏感文件的流程，都需要另外的 policy 與 provenance 設計。

這個讀法也能接上本網站的 [OSReward Agent 評測讀法](/paper-reading/08-osreward-agent-evaluation/)：OSReward 提醒我們評測必須拆 failure recall、verifier coverage 與 false success；本篇則補上 RAG trajectory 在 finalization 前是否真的檢查 evidence。若想先看工具路由的前置控制，可讀 [RAG-MCP](/paper-reading/04-RAG-MCP/)；若要比較 memory／workflow 級的 agent 評測，可讀 [ContextWeave](/paper-reading/09-contextweave-workflow-benchmark/)。

## Artifact status as of 2026-08-07

| Artifact | 直接驗證結果 | 對重現的意義 |
| --- | --- | --- |
| [Paper v1 HTML](https://arxiv.org/html/2608.02011v1) / [PDF](https://arxiv.org/pdf/2608.02011v1) | 可讀；Figure 1–7、Table 1–19、Appendix A–M 可定位 | 論文證據可核對；目前 arXiv record 另有 v2，本文固定 v1 |
| [作者 code URL](https://github.com/Noverse0/before-reasoning-fails) | HTTP 404；論文聲稱 release，但 endpoint 不可用 | 無法宣稱 12,000 trajectories 或 table scripts 可直接重跑 |
| [HotpotQA official page](https://hotpotqa.github.io/) / [repository](https://github.com/hotpotqa/hotpot) | 官方頁與 repository 可用；頁面列出下載連結與 CC BY-SA 4.0 | dataset 可取得，但不足以重建作者 preprocessing 與 API traces |
| [2WikiMultiHopQA repository](https://github.com/Alab-NII/2wikimultihop) | repository 可用；README 連到 dataset 與 Apache-2.0 repository license | data endpoint 仍需依 README 的外部下載；不能假設 paper 的 processed export 完全相同 |
| [MuSiQue repository](https://github.com/StonyBrookNLP/musique) | repository、download script 與 CC BY 4.0 data 說明可用 | dataset 可取得，但 paper 的 processed MuSiQue export 仍有 per-chunk gold caveat |
| [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) | Hugging Face model page 可用，標示 Apache-2.0 | retriever artifact 可取得；仍需匹配版本、index 與 RRF 設定 |

因此，最小有價值的重現不是宣稱完整 reproduction，而是等作者 code endpoint 恢復後，或自行重建 protocol：用同一批 question IDs、相同 hybrid top-5／RRF、10-loop cap、temperature 0，先跑 no-gate 與 Read-Gate，記錄 zero-read rate、LLM-Acc、Contain-Acc、reads/Q、corrections/Q 與 retrieved tokens。若只使用公開 dataset 與自己的 controller，結果只能叫 protocol replication，不能叫 paper reproduction。

## 結語：先問「證據有沒有被讀」，再問模型想得夠不夠深

Before Reasoning Can Fail 的貢獻不在於提出一個複雜的新 retriever，而是把容易被 overall accuracy 蓋掉的程序邊界變成可測試變數：agent 是否搜尋、是否讀取、讀了什麼、何時 finalize，以及錯誤是在讀之前還是讀之後發生。

Read-Gate 的最佳解讀是 **diagnostic runtime invariant**。當 zero-read rate 高，它可以用小幅度的 execution constraint 換取 3.2–9.4 個百分點的 minimal-cell gain；當 agent 已經會讀，或 retrieval 品質不足，它不會自動產生正確性，也可能增加成本。對 production RAG，值得帶走的不是「強制每題讀一次」，而是把 evidence inspection、retrieval coverage、answer verification 與 cost 一起放進 trajectory-level observability。

## Primary sources

- Roh, Daeyoung; Han, Donghee. [Before Reasoning Can Fail arXiv record](https://arxiv.org/abs/2608.02011)（版本、作者與摘要；截至 2026-08-07 已列 v2）。
- Roh, Daeyoung; Han, Donghee. [Before Reasoning Can Fail v1 full HTML](https://arxiv.org/html/2608.02011v1)；[v1 PDF](https://arxiv.org/pdf/2608.02011v1)。
- [Paper-linked code endpoint](https://github.com/Noverse0/before-reasoning-fails)（as of 2026-08-07：HTTP 404）。
- [HotpotQA official dataset page](https://hotpotqa.github.io/)。
- [2WikiMultiHopQA official repository](https://github.com/Alab-NII/2wikimultihop)。
- [MuSiQue official repository](https://github.com/StonyBrookNLP/musique)。
- [Qwen3-Embedding-0.6B model card](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)。
