---
title: "失敗一旦傳播，還能找出起點嗎？Agentic RAG 的因果失敗歸因"
description: "深讀 When Failures Propagate：用介入式 benchmark、三跳 MuSiQue 與 certified content corruption，拆開 Agentic RAG 的失敗偵測、因果歸因、傳播與恢復。"
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "這篇論文不把錯誤答案直接當成根因，而是先在指定 hop 注入可認證的 fault，再讓 Agent 真實重跑後綴，測試診斷器能否找回注入起點。"
  - "在 80 題、三跳、MuSiQue、Claude Haiku 4.5、dense retrieval 的 strict sweep 中，coverage-based attribution 在 hop 1 是 0.91，在 hop 2 與 hop 3 都是 0.00；這是傳播後 post-hoc signal loss 的證據，不是所有 Agentic RAG 都不可能歸因。"
  - "content-corruption arm 保持文件主題相關，只改 answer fact 或 bridge entity；hop 2 的 coverage 是 0.00，frozen-hop counterfactual 是 0.67，但 pooled denominator 只有 18 個失敗案例，屬 exploratory comparison。"
  - "工程上應把 causal attribution 與一般 failure diagnosis 分開：前者需要 intervention label、hop-level trace 與可重播的 counterfactual；後者只回答哪一類訊號看起來有問題。"
audience:
  - "設計 Agentic RAG、multi-hop retrieval 或 trajectory evaluation 的 AI 工程師"
  - "需要追蹤檢索失敗、後綴傳播、恢復與 diagnosis cost 的 RAG 平台團隊"
tags: ["Paper Reading", "RAG", "Agentic RAG", "Retrieval", "Evaluation", "Observability"]
image: "/paperReading/agentic-rag-causal-failure-attribution/title_image.webp"
field: "Retrieval Systems"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
paper:
  title: "When Failures Propagate: Causal Failure Attribution in Agentic Retrieval-Augmented Generation"
  authors:
    - "Lauren Pothuru"
  year: 2026
  venue: "arXiv 2608.20627 v1（2026-08-20；未同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2608.20627v1"
    arxiv: "https://arxiv.org/abs/2608.20627"
    doi: "https://doi.org/10.48550/arXiv.2608.20627"
    code: "https://github.com/anote-ai/Research-AgenticRAG"
    project: "https://arxiv.org/html/2608.20627v1"
series:
  id: "agentic-rag-causal-failure-attribution"
  title: "Agentic RAG 失敗診斷與歸因"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文

- **問題**：Agentic RAG 把 retrieval、reasoning 與回答拆成多個 hop。早期拿到錯誤 evidence，可能在後面變成 query drift、錯誤 bridge 或 wrong answer；但後續 retrieval 也可能把它修回來。只看 final answer 或最後一個 trace，無法直接知道最早哪一跳造成失敗。
- **核心洞見**：AgenticRAG-FP 在指定 hop $h$ 先注入一個可認證的 fault，再從被改過的 prefix 重新執行 suffix。診斷器不是對一條靜態錯誤 trace 猜原因，而是拿預先知道的 `injected_at_hop` 檢驗 exact-hop attribution。
- **最強證據**：strict dense Claude Haiku 4.5 sweep 取 80 題三跳 MuSiQue；在仍然失敗的案例中，coverage-based diagnosis 的 exact-hop accuracy 為 hop 1：0.91 [0.81, 0.98]、hop 2：0.00 [0.00, 0.00]、hop 3：0.00 [0.00, 0.00]，分母分別是 43、36、21（[Table 2，Section 7.1](https://arxiv.org/html/2608.20627v1#S7.T2)）。
- **主要邊界**：這個結果支持「在這組 strict intervention 與後綴重跑裡，coverage 的 hop-level signal 會在較深 hop 消失」，不支持「所有自然發生的 Agentic RAG 失敗都不可歸因」。content study 的 hop 2 只有 18 個 failed cases，hop 3 只有 3 個，因此 method ranking 不能外推。

我的 bounded verdict 是：**這篇工作的真正貢獻，是把「答案錯了」改寫成一個可介入、可標記、可按 propagation depth 評估的 causal attribution 問題。它最硬的訊號是 coverage 在 strict MuSiQue 的深度崩落；Propagation-Aware 與 Suf-Regen 的比較則是在小樣本中說明 counterfactual scope，不是一個已經勝出的通用診斷器。**

> **花花的工程提醒**
>
> 一個能指出 failure stage 的 dashboard，不等於能證明 root cause。若 trace 沒有保存 hop、query、document version、介入位置與重播條件，事後看到的低 coverage 可能只是早期 fault 的後果；不要把一般 diagnosis score 寫成 causal RCA guarantee。

## 版本、來源與讀者問題

本文讀的是 [When Failures Propagate: Causal Failure Attribution in Agentic Retrieval-Augmented Generation](https://arxiv.org/abs/2608.20627) 的 arXiv v1。arXiv 記錄作者 Lauren Pothuru，提交日期為 2026-08-20；它是 preprint，本文不把它寫成已通過 peer review 的 conference 或 journal result。我核對了 [完整 HTML](https://arxiv.org/html/2608.20627v1)、[PDF](https://arxiv.org/pdf/2608.20627v1)、TeX source、Section 3–10、Appendix A–C、Tables 1–5，以及作者的 [Research-AgenticRAG repository](https://github.com/anote-ai/Research-AgenticRAG)。arXiv HTML 頁面標示 paper 為 CC BY 4.0；repository 的 `paper/figures/` 另保留數個 evaluation plots，但沒有獨立 license file，因此本文在每個 figure caption 都保留原始來源與版權／重用限制。

這篇文章的讀者問題是：**一個三跳 RAG 答錯時，我們能否分辨「哪一跳最早造成可傳播的 fault」與「哪一跳最後看起來最可疑」？** 它接在 [Before Reasoning Can Fail](/paper-reading/15-before-reasoning-fails/)、[REVA 的 reusable evidence views](/paper-reading/47-reva-reusable-evidence-views/) 與 [Predicting Partial Answer Quality](/paper-reading/53-agentic-rag-partial-answer-prediction/) 後面讀很自然：前者拆 evidence discipline，REVA 談可重用的證據視圖，本篇則把 root-cause attribution 本身變成 interventional evaluation。

## 證據地圖：Paper、Evidence 與 Bloss0m judgment

| 層次 | 本文採用的說法 |
| --- | --- |
| **Paper 直接支持** | AgenticRAG-FP 的 trace model、七類 live intervention、certified content corruption、exact-hop／stage／recovery／cost 指標、strict dense Claude Haiku 4.5 MuSiQue 表現，以及 content-fault 的 pooled 結果與限制。 |
| **作者主張** | 介入後重跑 suffix 可以把 propagation depth 變成診斷評估軸；post-hoc coverage signal 可能在深 hop 消失；frozen-hop repair 與 suffix regeneration 針對不同 downstream dependence。 |
| **Evidence 尚未建立** | 自然 production fault 的普遍 root cause、跨 backbone／dataset 的通用排序、完整 factorial coverage、persistent corpus corruption 的恢復行為，以及任何「所有 Agentic RAG 都不可能歸因」的 impossibility theorem。 |
| **Bloss0m engineering judgment** | 將 causal attribution 做成可重播的 evidence contract：保存 intervention label、原始與被注入 prefix、每一 hop 的 query／doc ID／版本、suffix policy、final outcome 與 diagnosis cost，並把 uncertainty 與一般 failure class 分欄。 |

### Paper Essence Contract

1. **它解決什麼問題？** 它要回答：在多 hop Agentic RAG 裡，早期 retrieval fault 經過 suffix propagation 或 recovery 後，診斷器還能不能找回被注入的 hop，而不是只說 final answer wrong。
2. **為什麼既有方法不夠？** Final-answer accuracy、retrieval recall 或一條已完成的 trace，都把 injected fault、downstream consequence 與 recovery 混在一起；沒有 intervention label，就無法把 late symptom 和 earliest cause 分開。
3. **核心技術想法是什麼？** 在指定 hop 介入 evidence、query 或 termination decision，保留 certified target，讓 Agent 從 corrupted prefix 重跑 suffix，再用 exact-hop attribution 檢查診斷器是否找回介入位置。
4. **一個 input 怎麼走？** `question → base trace → inject at hop h → resume_from_hops(h+1) → changed suffix → final answer → failed-only attribution or recovered outcome`。content corruption 另外記錄原 span 與替換 span，讓 absorbed／resisted／derailed 可不靠 LLM judge 判定。
5. **什麼證據支持 headline claim？** [Section 7.1 的 Table 2](https://arxiv.org/html/2608.20627v1#S7.T2) 是最強 evidence：strict dense Claude Haiku 4.5、三跳 MuSiQue 的 coverage accuracy 從 hop 1 的 0.91 掉到 hop 2／3 的 0.00；[Table 3](https://arxiv.org/html/2608.20627v1#S7.T3) 則把 content-fault 的小樣本 counterfactual scope 分開。
6. **claim 在哪裡停止？** 結論停在作者選定的 benchmark、模型、retriever、介入家族與 failed-case denominator。它指出一種 post-hoc identifiability limitation，沒有證明自然 fault 的不可歸因性，也沒有給出 production diagnosis SLO。

## 為什麼既有方法不夠：錯誤答案不是根因標籤

標準 RAG 評測通常問「答案對不對」、retrieval 評測問「支援文件找到了嗎」。這些指標很重要，卻沒有回答 Agentic RAG 的時間順序：哪一 hop 看到什麼、下一個 sub-query 是由哪個 context 形成、後來的 evidence 是修復還是延續原本的錯誤？在一條三跳 trajectory 裡，hop 1 的空 evidence 可以讓 hop 2 形成 drifted query，hop 3 再拿到看似有關但基於錯誤 premise 的文件。final trace 裡的 low coverage 可能落在 hop 2 或 hop 3，但那是觀察到的症狀，不是已被證明的 cause。

反過來，後續 retrieval 可能找到乾淨的 supporting document，使 Agent 重新答對。若 evaluator 只把「沒有 final failure」記成 pass，就看不見 injected fault 曾經被 Agent 吸收或修回；若把這題硬算成某個 diagnoser 的錯，也會把 recovery 和 attribution 混為一談。論文因此把兩個問題分開：

- **一般 failure diagnosis**：這條 trace 看起來是 retrieval、tool 還是 answer generation 出錯？
- **因果失敗歸因**：在已知 fault 被注入、且 Agent 已經反應之後，診斷器是否找回 exact injected hop？

第二個問題需要 intervention。沒有事先固定的 fault 與 hop，任何 late low-coverage hop 都可能是 cause、effect 或 benign consequence；事後只看 trace，這些可能性在觀察上相似（[Task and Trace Model，Section 3](https://arxiv.org/html/2608.20627v1#S3)）。

## 核心直覺：同一條 trace 同時有「系統需要」與「診斷器需要」的資訊

先想像一個最小的三跳流程：每一 hop 先發一個 sub-query，retriever 回傳文件，Agent 決定繼續查還是回答。對 Agent 而言，最需要的是足以產生答案的 evidence；對 RCA diagnoser 而言，還需要知道哪個 evidence 是由 fault 造成、哪個是後續重新搜尋的結果。這兩種資訊不是同一件事。補償 evidence 可能讓答案恢復，卻不會把被 suffix 改寫掉的 injection signature 自動放回 trace。

論文用下列 trace 物件把這個邊界說清楚（[Section 3](https://arxiv.org/html/2608.20627v1#S3)）：

$$
\tau=\bigl(q,\{(q_h,D_h)\}_{h=1}^{H},A,y,c\bigr).
$$

其中 $q$ 是原始問題，$q_h$ 是第 $h$ 跳的 sub-query，$D_h$ 是該 hop 從 corpus $\mathcal{C}$ 找到的 evidence，$A$ 是 final answer，$y$ 是 reference answer，$c$ 是總 token cost。這個 notation 的 operational role 是：要重播 suffix，不能只存最後一個 $A$；至少要保留每個 hop 的 query 與 docs，才能從 prefix 重新執行。

每個 hop 又有 stage $s\in\{\mathrm{retrieval},\mathrm{tool},\mathrm{answer},\mathrm{none}\}$。診斷器回傳的是預測 stage $\hat{s}$ 與 hop $\hat{h}$；**identifiable at depth $h$** 則要求 exact-hop $\hat{h}=h$。所以「判斷出 retrieval 失敗」與「找對造成失敗的 hop」是兩個不同難度的 target。

## 用一個逐步例子走完整個方法

以下是沿著論文 Introduction 的三跳情境做的教學化簡化，不是作者列出的某一道 MuSiQue 題，也不是新的實驗證據。它只用來說明為什麼 live intervention 和靜態 trace edit 不一樣。

1. **Input**：問題是「找出同時滿足三段關係的答案」。乾淨 Agent 先以原問題建立 hop 1 sub-query。
2. **Intermediate representation**：hop 1 得到文件 $D_1$；Agent 從 $D_1$ 抽取一個 entity，形成 hop 2 query $q_2$，再從 $D_2$ 抽取 bridge，形成 hop 3 query $q_3$。
3. **Intervention**：實驗在指定的 hop 1 將 $D_1$ 置換成 empty 或 irrelevant evidence，並保留 `injected_at_hop=1`。這是 certified root label，不是診斷器事後猜的標籤。
4. **Changed suffix**：Agent 從 hop 2 開始重跑。它可能因為空 evidence 形成 drifted $q_2$，也可能在後面重新找到 supporting document；這個 suffix 是 Agent 對 corrupted context 的真實反應，而不是把舊 trace 的文字剪貼過來。
5. **Output**：若 final answer 錯，diagnoser 看到的是一條傳播後的 failed trace；若 final answer 對，這是 recovery outcome，不能因為沒有失敗就假裝 exact-hop attribution 已成功。
6. **Likely failure point**：若 coverage-based diagnoser 找到 hop 3 最早低 coverage，它回答的是「hop 3 最像症狀位置」；在 intervention ground truth 下，真正的 causal attribution 仍應是 hop 1。只有拿 `\hat{h}` 和 certified `h` 比較，才知道它是否真的做了 RCA。

這個例子同時展示兩種容易混淆的成功：Agent 成功答對，不代表 diagnoser 已辨識 injection；diagnoser 找到某個 low-support hop，也不代表它找到 earliest cause。論文的 benchmark 把兩者拆開，正是為了不讓 end-answer score 代替 causal evidence。

## 方法機制：介入、重跑與兩種 counterfactual scope

### Live intervention 如何保留因果標籤

AgenticRAG-FP 的 live path 先取得已執行的 prefix，在指定 hop 對 evidence、sub-query 或 termination decision 做改動，再呼叫可 resume 的 Agent 執行後綴。Structural intervention 包括 empty retrieval、irrelevant documents、query drift、false premise、stale evidence 與 early termination（[Table 1，Section 4](https://arxiv.org/html/2608.20627v1#S4.T1)）。它們分別覆蓋 missing evidence、misleading evidence 與 altered decision；可見性不同，正好能測試 post-hoc signal 是看到了 local symptom，還是抓到介入造成的 causal position。

`resume_from_hops` 的關鍵不是 API 名稱，而是執行語義：在 hop $h$ 之前已完成的 prefix 保持為實驗指定的狀態，Agent 從 $h+1$ 重新決定 query、retrieve、reason 或 answer。若只是對原本完成的 trace 把某段文件換成空字串，後面 query 並不會反映 Agent 真實反應；那只能測靜態編輯，不能測 propagation。

### Content corruption：文件仍相關，但事實被改掉

Structural fault 常常很容易被 coverage 看見：空文件或 off-topic 文件自然會降低 answer overlap。論文另外加入較難的 content corruption：保留文件的 topical relevance，只改其中一個可認證 span。選擇順序是：

- **answer fact**：若 gold answer 出現在該 hop evidence，就改成另一個可認證的錯值。
- **bridge entity**：若 entity 同時出現在該 hop 文件與後續 query、但不在原始問題，就改動這個被 Agent 帶往後的鏈結。
- **salient entity 或 number**：前兩者不成立時使用 fallback；數字以 deterministic perturbation 改寫，entity 從不與原 span token overlap 的 in-domain distractor 取代。

每次 corruption 都記錄 original span、corrupted span、strategy 與 replacement kind；沒有可認證 span 的樣本直接 skip 並計數。更重要的是，這個 arm 改的是 trajectory copy，corpus 本身保持乾淨，所以後續 re-retrieval 可能把 fault 修回來。這是研究限制的一部分，不是 persistent stale-index experiment（[Section 4，Certified content corruption](https://arxiv.org/html/2608.20627v1#S4)）。

### Diagnoser 問的不是同一個問題

| 診斷器 | 看見或執行什麼 | 它主要回答的問題 |
| --- | --- | --- |
| Rule-based | final trace 的空 retrieval、tool call、answer 與 grounding overlap | 哪個可見 stage 像是失敗？ |
| Doctor-RAG / coverage | 每 hop 對 gold answer 的 token coverage，取最早低於 threshold 的 hop | 哪裡最早看起來缺少 answer support？ |
| LLM-Judge | 讀完整 hop-level trace，預測 stage 與 hop | 語義上哪一 hop 最可疑？ |
| Propagation-Aware | 逐 hop 重取 clean evidence，其他 hops 固定，force answer 做 frozen-hop repair | 修好哪個單點會讓答案翻回正確？ |
| Suf-Regen | 修好候選 hop 後，從下一 hop 重建 suffix | 修好哪個 prefix 能讓 Agent 走出新的 downstream path？ |

這張表是對論文實作的讀者版整理，不是另立一個作者 taxonomy。兩個 active probe 的差別在於 downstream evidence：Propagation-Aware 固定其他 hops（包括後面的 corrupted docs），Suf-Regen 允許後綴重生。前者可能保留被測 content fault，後者比較能處理 bridge entity 已經改變後的 query dependence；但後者也可能重新取回乾淨文件，意外消除正在測的深層 fault。

## 指標與實驗設定：先固定 denominator，再讀曲線

### Exact-hop attribution 與 recovery 是兩個分數

對仍然答錯的 injected trace，論文以 failed set $\mathcal{F}_h$ 計算：

$$
\mathrm{Acc}_d(h)=\frac{1}{|\mathcal{F}_h|}\sum_{\tau_i\in\mathcal{F}_h}1[\hat{h}_{d,i}=h_i].
$$

$d$ 是 diagnoser，$h_i$ 是已知 intervention hop，$\hat{h}_{d,i}$ 是預測。這個 denominator **只包括 live suffix 重跑後仍失敗的案例**；recovered trajectories 不會被當成 diagnoser 的錯，因為 recovery 另有意義。每個 cell 也報告 bootstrap 95% interval（$B=1{,}000$）；少於 10 個 failed traces 的 cell 只做 descriptive estimate，不拿來做穩健排名。

Recovery 則問 intervention 是否真的傳到答案：

$$
\mathrm{Recovery}(h)=\Pr\bigl[\mathrm{correct}(A,y)\mid do(f,h)\bigr].
$$

它高時表示 Agent 有機會用後續 evidence 自我修復，不表示 diagnoser 能找回 root cause。Stage accuracy、hop-tolerance、ancestor-hit 與 mean absolute hop error 是補充診斷；主張核心仍是 exact-hop。

### 實驗如何對齊

1. **Strict structural arm**：80 題、三跳 MuSiQue；Claude Haiku 4.5；dense retrieval；四個 propagation-aware probes；每個 requested depth 只收實際到達該 depth、且 clean base answer 正確的案例。strict 結果不是完整的 backbone × dataset × retriever factorial grid。
2. **Content-corruption arm**：GPT-4o-mini 與 Claude Haiku 4.5，HotpotQA 與 MuSiQue，各 condition 取 $n=40$ base examples，BM25，深度 1–3；五種 diagnosers 都跑，且由另一個 model family 做 cross-family judge。 pooled failed cases 是 hop 1：44、hop 2：18、hop 3：3。
3. **其他 substrate**：repository 也有 FRAMES、CRAG、BM25、dense、local model 與多種 script；但 FRAMES 的 link-only fallback 不等於 fetched passage corpus，CRAG 在這版以 single-turn 正規化，因此不把它們混入 strict MuSiQue headline。
4. **Cost**：Provider 回傳 input/output token，Agent 累積到 trace；LLM-Judge 與 active probes 有額外 token 或 re-execution cost。論文沒有提供一個可直接轉成 production billing 的 latency／TCO 保證。

## Results：coverage 的深度崩落不等於 diagnosis 全部失效

### Strict structural result：Table 2 的主張很窄但很清楚

| Injection depth | Doctor-RAG coverage | LLM-Judge | Propagation-Aware | failed $n$ |
| --- | ---: | ---: | ---: | ---: |
| Hop 1 | 0.91 [0.81, 0.98] | 0.26 [0.12, 0.40] | 0.51 [0.37, 0.67] | 43 |
| Hop 2 | 0.00 [0.00, 0.00] | 0.25 [0.11, 0.42] | 0.25 [0.11, 0.39] | 36 |
| Hop 3 | 0.00 [0.00, 0.00] | 0.43 [0.24, 0.67] | 0.48 [0.29, 0.67] | 21 |

讀法是「question → controls → observation → explanation → boundary」：

- **Question**：在 suffix 被重新生成後，原本低 answer coverage 的 injection hop 還留在 final trace 嗎？
- **Controls**：同一 strict dense Claude Haiku 4.5、同一三跳 MuSiQue、同一 requested depth；比較 coverage、LLM-Judge 與 frozen-hop Propagation-Aware。
- **Observation**：hop 1 的 coverage 0.91 反映 structural fault 仍很可見；hop 2、3 皆 0.00，而 judge 與 frozen probe 仍有部分、且 intervals 重疊的 signal。
- **Explanation**：suffix 可以因為 corrupted context 產生新 query，也可以拿到補償 evidence；這會覆寫原 injection hop 的 local coverage signature。active probe 多花 token，可能還能從 repair outcome 取得資訊，但不是因此證明它普遍優於 post-hoc。
- **Boundary**：這是 observed post-hoc signal loss，不能改寫成 all-system impossibility；也不能把 0.00 解釋成 Agent 在 hop 2／3 必然失敗。

![Repository retained structural curve：Claude Haiku 4.5 on FRAMES across injection depth。](/paperReading/agentic-rag-causal-failure-attribution/paper/figure-repo-frames-structural.webp)

*圖 1：repository 保留的 FRAMES structural attribution curve；它展示同一個 propagation-depth 軸與 coverage／active-probe 曲線，但不是 arXiv v1 的 80 題 strict dense MuSiQue headline，圖中 n_failed 與 recovery 也屬該 retained run。來源：[repository figure file](https://github.com/anote-ai/Research-AgenticRAG/blob/982b73dc4b8ed7442f044ccc0947f248e3b63d09/paper/figures/identifiability_curve_claude_claude-haiku-4-5_frames.pdf)；可對照論文 [Section 7.1](https://arxiv.org/html/2608.20627v1#S7.SS1)。arXiv paper 頁面標示 CC BY 4.0；repository 沒有獨立 license，重用仍受原作者版權與授權限制。*

### Repository retained plot：用來看 transfer，不拿來替代 headline

![Repository retained structural curve：GPT-4o-mini on MuSiQue across injection depth。](/paperReading/agentic-rag-causal-failure-attribution/paper/figure-repo-gpt4o-mini-musique-structural.webp)

*圖 2：repository 保留的 GPT-4o-mini MuSiQue structural curve；它是公開 artifact 中的另一個 model／condition 視角，能提醒讀者曲線形狀會受 backbone、retriever 與 run condition 影響，不應與 Table 2 的 Claude Haiku 4.5 dense 結果混成同一 denominator。來源：[repository figure file](https://github.com/anote-ai/Research-AgenticRAG/blob/982b73dc4b8ed7442f044ccc0947f248e3b63d09/paper/figures/identifiability_curve_openai_gpt-4o-mini_musique.pdf)；可對照論文 [Section 6 的設定邊界](https://arxiv.org/html/2608.20627v1#S6)。arXiv paper 頁面標示 CC BY 4.0；repository 沒有獨立 license，重用仍受原作者版權與授權限制。*

這兩張 retained plots 的教學價值是提醒 transfer boundary，而不是把 repository 的 broader runs 偷換成論文的主結果。尤其 FRAMES 的 passage corpus 若只是 link title，retrieval fidelity 已經不同；任何跨 condition 的視覺趨勢都要留在 artifact context 裡讀。

### Content fault：topically relevant 不代表 causal signal 還在

| Diagnoser | Hop 1（$n=44$） | Hop 2（$n=18$） |
| --- | ---: | ---: |
| Doctor-RAG（coverage） | 1.00 [1.00, 1.00] | 0.00 [0.00, 0.00] |
| LLM-Judge（cross-family） | 0.59 [0.43, 0.73] | 0.89 [0.72, 1.00]† |
| Propagation-Aware（frozen-hop） | 0.89 [0.80, 0.98] | 0.67 [0.44, 0.89] |
| Suf-Regen | 0.91 [0.82, 0.98] | 0.11 [0.00, 0.28] |

這是 [Table 3，Section 7.2](https://arxiv.org/html/2608.20627v1#S7.T3) 的 pooled comparison。閱讀它要先看 denominator：hop 2 只有 18 個 failed cases，interval 是這個 pooled sample 內的不確定性，不是 definitive head-to-head significance。coverage 在 hop 2 的 0.00 說明「文件仍相關、但事實已被改寫」時，answer coverage 不再是一個可靠 root-cause locator。frozen-hop 的 0.67 則表示固定其他 hop、只修一個候選 hop 的 probe 能在部分案例取得額外資訊；它不是 67% 的 production RCA guarantee。

† LLM-Judge 的 hop 2 estimate 還受到 positional prior 影響：作者指出預測分布高度偏向中間 hop，所以 cross-family 並不自動等於 unbiased semantic localization。

![Figure 1 left panel：GPT-4o-mini agent judged by Claude Haiku 4.5 on HotpotQA content corruption。](/paperReading/agentic-rag-causal-failure-attribution/paper/figure-1-gpt4o-mini-hotpotqa-corruption.webp)

*圖 3：論文 Figure 1 左 panel，HotpotQA、BM25、GPT-4o-mini agent 由 Claude Haiku 4.5 judge 的 content-corruption curve；讀者應注意它是另一個 model／dataset condition，不是 Table 2 的 strict dense Claude-MuSiQue 結果。來源：[Figure 1，Appendix C / A3.F1](https://arxiv.org/html/2608.20627v1#A3.F1)；原圖取自 arXiv source／作者 repository 的對應 PDF。arXiv HTML 標示 CC BY 4.0；本地 WebP 是保留原圖內容的格式轉換，重用仍受原授權與版權限制。*

![Figure 1 right panel：Claude Haiku 4.5 agent judged by GPT-4o-mini on HotpotQA content corruption。](/paperReading/agentic-rag-causal-failure-attribution/paper/figure-1-claude-haiku-hotpotqa-corruption.webp)

*圖 4：論文 Figure 1 右 panel，HotpotQA、BM25、Claude Haiku 4.5 agent 由 GPT-4o-mini judge 的 content-corruption curve；讀者應注意 Suf-Regen 在 hop 2 會因重新取回 clean corpus evidence 而下滑，這正是 frozen-hop 與 suffix-regeneration scope 不同的可視化線索。來源：[Figure 1，Appendix C / A3.F1](https://arxiv.org/html/2608.20627v1#A3.F1)；原圖取自 arXiv source／作者 repository 的對應 PDF。arXiv HTML 標示 CC BY 4.0；本地 WebP 是保留原圖內容的格式轉換，重用仍受原授權與版權限制。*

### Answer outcomes：恢復、吸收與歪掉要分開

Content corruption 還能利用 certified span 做 deterministic answer-level evaluation，不需再叫一個 judge 判斷 Agent 是否「抄到」錯值：

| Depth | Absorbed | Resisted | Derailed | all injected $n$ |
| --- | ---: | ---: | ---: | ---: |
| Hop 1 | 0.15 | 0.58 | 0.26 | 106 |
| Hop 2 | 0.09 | 0.74 | 0.18 | 68 |
| Hop 3 | 0.00 | 0.85 | 0.15 | 20 |

這是 [Table 4，Section 7.3](https://arxiv.org/html/2608.20627v1#S7.T4) 的 all-injected denominator，與前面的 failed-only attribution 不同。`absorbed` 表示答案含 corrupted-span tokens；`resisted` 優先表示 answer 正確；其餘是 `derailed`。hop 1 的 106 個案例中，0.15 被吸收、0.58 resisted、0.26 derailed。總共 22 個 absorbed cases 裡有 20 個是 answer-fact corruption；salient-entity corruption 在 40 個案例中 0 個被吸收。query contamination 只有 3/129，說明錯誤內容多半影響中間 reasoning／answer，而不是直接複製進下一個 query。這個結果支持監測 query text alone 會漏掉部分 content propagation，但不代表三跳以外也一定如此。

## Ablation 與 failure-mode：兩種 repair 不是同一種方法

### Frozen-hop repair 與 suffix regeneration 的因果問題不同

Propagation-Aware 修候選 hop $h$、固定其他 hops，再用 force-answer 測答案是否翻正。它問的是：「在觀察到的 downstream evidence 不變時，改這一個 local input 會不會改變 outcome？」優點是保持其他 corruption，缺點是後續 hop 可能早已依賴 corrupted prefix；修好早期根因，仍可能被晚期錯誤蓋掉。

Suf-Regen 則修好候選 hop 後，讓 Agent 從下一跳重新 query 與 retrieve。它問的是：「乾淨 prefix 能否引導出一條不同的 downstream trajectory？」這對 bridge entity 很有用；但在 answer fact corruption 上，乾淨 corpus 會讓後綴重新抓回原始事實，測試中的深層 fault 因此被消除了。論文報告 hop 2 的 Suf-Regen 0.11 對 frozen-hop 0.67；bridge-entity 小 slice 則是 Suf-Regen 1.00 對 Propagation-Aware 0.73（$n=11$）。這支持「scope 互補」的 mechanism interpretation，卻不是普遍 method ranking（[Section 7.2](https://arxiv.org/html/2608.20627v1#S7.SS2)）。

### Coverage 的 0.00 不是一個 universal theorem

作者在 Discussion 明確把 observed collapse 稱為 coverage signal 的 identifiability limitation：如果 regenerated suffix 已經覆寫了 injection point 的 local signature，再調 threshold 也不會憑空恢復遺失的資訊。這是一個對當前 intervention、trace representation 與 post-hoc signal 的限制描述；它不是「所有 Agentic RAG 都沒有一般解」的 impossibility proof。未來若保存版本化的 prefix、query decision、retriever candidate list 或多重 counterfactual lineage，可能會得到不同可辨識性；本文沒有測試這些變體（[Discussion，Section 8](https://arxiv.org/html/2608.20627v1#S8)）。

## Bloss0m 工程化整理：把 causal RCA 做成可重播的 trace contract

以下不是論文提出的 production architecture，而是根據 paper evidence 與其 failure boundary 做出的 **Bloss0m engineering synthesis**。第一次介紹時特別標示，避免讀者把它誤認成作者的五步 framework。

1. **先分欄**：trace 同時保存 `failure_detected`、`failure_stage`、`injected_at_hop`、`predicted_hop` 與 `confidence`；不要用一個 `root_cause` 欄位同時承擔 observation 與 causation。
2. **保存可重播 prefix**：每 hop 記錄 query、retriever、candidate／selected document IDs、corpus version、evidence text hash、decision 與 token cost。沒有 prefix，就無法在相同條件下重跑 suffix。
3. **明確 intervention semantics**：區分 empty／irrelevant／query drift／false premise／stale／content corruption／early termination；content arm 要記 original span、replacement span 與 selection strategy。
4. **選對 counterfactual scope**：bridge dependency 可以需要 suffix regeneration；深層 answer-fact fault 可能更適合 frozen-hop；若兩者答案不同，輸出 uncertainty，不要挑一個看起來較高的分數。
5. **把 recovery 獨立成 outcome**：`recovered_after_intervention` 不等於 `attributed_correctly`。dashboard 應同時展示 failed-only exact-hop、all-injected recovery、stage accuracy 與 diagnosis token cost。
6. **先離線再設 gate**：先在固定 benchmark 與自然失敗樣本上估計 false attribution、skip、成本與 judge prior，再決定是否把 causal probe 放進線上 incident workflow。本文沒有提供 production threshold。

這個 synthesis 的工程含義是：若平台只保存 final answer、最後一輪 top-k 與一個 error label，就只能做一般 diagnosis；要宣稱 causal RCA，必須能回答「我改了哪裡、後綴怎麼重跑、其他 evidence 哪些固定、答案是否恢復、這個 probe 花了多少成本」。

### 何時值得使用？

- 需要比較 retrieval／agent routing 改版是否改變 root cause distribution，而非只比較 end-answer accuracy。
- 多跳工作流有可保存的 hop-level trace、穩定的 corpus snapshot 與可重跑的 retriever／provider。
- 失敗回放成本可接受，且團隊願意把 recovered、failed、uncertain 分開報告。

### 何時不要直接使用？

- Agent 沒有離散 hop、沒有可重播 prefix，或 downstream tool 有不可逆 side effect；此時 paper 的 resume semantics 不成立。
- 線上 corpus 持續變動、ACL／document version 無法固定；counterfactual repair 可能只是讀到了不同世界。
- 只有少量自然失敗，卻想把 18 個 hop-2 content failures 或 3 個 hop-3 failures 寫成穩健 ranking。
- 把 coverage、LLM-Judge 或一個 counterfactual flip 當作已證明的 causal guarantee；它們最多是這個 benchmark 下的 evidence。

## 限制、威脅與未支持的解讀

1. **模型與 benchmark 邊界**：headline strict result 是單一 Claude Haiku 4.5、單一 dense retriever、80 題三跳 MuSiQue。論文沒有完整涵蓋 backbone × dataset × retriever × depth 的 factorial design。
2. **介入不等於自然 fault**：certified fault 讓 ground truth 可評估，但「一個人工可注入的 fault 是否代表 production 的 upstream extraction、stale index 或 model-induced query drift」仍是 external-validity 問題。
3. **content arm 的 corpus 是乾淨的**：改 trajectory copy 後重新 retrieval 可能吸收原始正確 evidence，所以 recovery 可能來自 clean corpus，而不是真正修復 persistent stale index。論文把 persistent corpus corruption 留給 future work。
4. **樣本數不對稱**：content pooled hop 1、2、3 的 failed $n$ 是 44、18、3；hop 2 只可做 exploratory mechanism reading，hop 3 只做 descriptive estimate，不能做 method ranking。
5. **LLM-Judge 不是 ground truth**：cross-family 減少 self-recognition，但 hop 2 的 0.89 帶有 mid-trace positional prior；較高 judge score 不等於較好的 causal localization。
6. **stage 與 hop 是不同粒度**：診斷器可以正確辨認 retrieval stage，卻猜錯 exact injected hop；把 stage accuracy 寫成 RCA accuracy 會弱化 paper 的核心問題。
7. **沒有 impossibility claim**：coverage 在 hop 2／3 的 0.00 是此 evaluation boundary 下的 observed signal loss，不能推成所有 Agentic RAG、所有 trace representation 或所有 diagnoser 都不可能成功。

## Artifact 與可重現性（截至 2026-09-21）

| Endpoint | 狀態 | 可做什麼，還缺什麼 |
| --- | --- | --- |
| [arXiv v1 HTML / PDF / TeX](https://arxiv.org/abs/2608.20627) | 可讀；HTML 具 Section、Table、Appendix anchor；頁面標示 CC BY 4.0 | 可核對 paper claim 與 figure provenance；版本固定為 v1，不混入未知後續 revision。 |
| [Research-AgenticRAG repository](https://github.com/anote-ai/Research-AgenticRAG) | public；本次檢查 HEAD `982b73dc4b8ed7442f044ccc0947f248e3b63d09` | `src/agenticrag/`、scripts、tests、paper source、results JSON 與 plots 可讀；repository 沒有獨立 license file。 |
| MockProvider／offline path | 可用，不需要 API key | 可執行 framework、injection、diagnoser 的 smoke／unit path；mock 是 token-overlap stand-in，不是 paper 的 LLM evidence。 |
| MuSiQue／HotpotQA dataset adapters | code 可讀，但 benchmark payload 未隨 repository 完整打包 | 真實 strict run 需要 Hugging Face dataset access、Python dependencies 與固定資料版本；small fallback 不足以重現 80 題結果。 |
| Claude／OpenAI real-provider path | code 與 resumable command 可讀；需要 provider API key | 需要 `ANTHROPIC_API_KEY`／`OPENAI_API_KEY`、model endpoint、retriever dependencies 與費用；本文未用私密 key 重跑 strict sweep。 |

最小的本地檢查是 clone repository 後執行 `PYTHONPATH=src python -m pytest -q`；本次在隔離環境得到 **304 passed**。我也用 MockProvider 跑了 synthetic content-corruption 與 frozen／suffix probe path，確認 injection 會記錄 certified span、suffix 可重跑、diagnoser 會產生 cost；以 repository 的 FRAMES fallback 執行 strict depth runner 時只載入 3 個 link-only samples，沒有 eligible strict cells，因此那個 smoke output 不能被當成 paper 結果。要重跑作者的 strict structural sweep，可依 repository `scripts/run_submission_dense_claude.sh` 的固定命令，並提供 API key、MuSiQue dataset、dense dependencies 與相同 model version；要重跑 content arm，則使用 `scripts/run_final_corruption_claude.sh`／`run_final_corruption_openai.sh` 的 cross-family judge 設定。這些是條件式 reproduction path，不是宣稱 clone 後即能無條件重現。

## 三個記憶點

1. **技術想法**：先在指定 hop 注入 certified fault，再讓 Agent 重跑 suffix；只有把 intervention label 與 changed trajectory 保留下來，才有機會測 exact-hop causal attribution。
2. **最強證據**：80 題三跳 MuSiQue 的 strict dense Claude Haiku 4.5 sweep 中，coverage attribution 從 hop 1 的 0.91 掉到 hop 2、3 的 0.00；這是 propagation 後 post-hoc signal loss 的窄而清楚證據。
3. **採用邊界**：frozen-hop 與 suffix-regeneration 是互補 counterfactual，不是萬用診斷器；content hop 2／3 的小分母、clean corpus recovery、單一模型與人工 injection，都要求把這項 benchmark 當成研究用 attribution instrument，而非 production RCA guarantee。

## 原始出處

- [When Failures Propagate: Causal Failure Attribution in Agentic Retrieval-Augmented Generation，arXiv v1](https://arxiv.org/abs/2608.20627)；[full HTML](https://arxiv.org/html/2608.20627v1)；[PDF](https://arxiv.org/pdf/2608.20627v1)。本文的主要定義、表格數字、介入語義、限制與圖 3–4 均以此版本為準。
- [Research-AgenticRAG official repository](https://github.com/anote-ai/Research-AgenticRAG)，以及固定 commit 的 [paper figures directory](https://github.com/anote-ai/Research-AgenticRAG/tree/982b73dc4b8ed7442f044ccc0947f248e3b63d09/paper/figures)。圖 1–2 是 repository retained plots，明確不取代 v1 headline。
- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)、[ReAct](https://arxiv.org/abs/2210.03629)、[Doctor-RAG](https://arxiv.org/abs/2604.00865)、[HotpotQA](https://arxiv.org/abs/1809.09600)、[MuSiQue](https://arxiv.org/abs/2108.00573)、[FRAMES](https://arxiv.org/abs/2409.12941)、[CRAG](https://arxiv.org/abs/2406.04744) 與 Pearl 的 [Causality](https://doi.org/10.1017/CBO9780511803161) 是論文 Related Work 與方法脈絡中的原始來源，不是本篇 strict 結果的替代 evidence。
