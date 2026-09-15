---
title: "REVA：把 RAG 壓縮搬到可重用的 evidence view，而不是每次請求重新付費"
description: "精讀 Nguyen 等人的 REVA（arXiv 2609.11209 v1）：用 generator attention 的歷史軌跡建立 document-keyed score store，在離線評分與線上渲染之間切開 RAG 壓縮成本，並檢查 unseen-document fallback、local/global budget、品質與延遲邊界。"
pubDate: 2026-09-15
updatedDate: 2026-09-15
tldr:
  - "REVA 將歷史 query–document–generator interaction 變成 document-keyed、budget-agnostic 的 word-unit score store；線上只查分數、分配 quota、按原文順序渲染 plain text。"
  - "它的真正工程問題不是『attention 能否選到最重要的 token』，而是哪些 scoring 工作可以離開 request path、哪些相容性條件必須命中，以及 store 沒看過文件時如何安全退回 prefix truncation。"
  - "在四個 QA benchmark、三個 generator、固定 top-10 retrieval cache 的實驗中，B=512 的 full-split REVA-local 為 37.83 F1、26.98 EM、27.5 ms online overhead；all-seen budget grid 的 REVA-global 平均 43.72 F1、32.75 EM、49 ms，但 all-seen 只是診斷切片。"
  - "attention 是 evidence importance 的 proxy，不是 citation faithfulness 證明；離線 store 建置、更新、資料新鮮度、coverage 與相容性 key 管理，仍是採用成本。"
audience:
  - "設計 context compression、RAG serving、KV-cache 與 token-cost 控制面的 ML／搜尋工程師"
  - "需要把離線 evidence mining、線上 latency、資料版本與 unseen-document fallback 接成正式 RAG 契約的技術負責人"
tags: ["Paper Reading", "RAG", "Retrieval", "Information Retrieval"]
image: "/paperReading/47-reva-reusable-evidence-views/title_image.webp"
field: "NLP"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
paper:
  title: "REVA: Reusable Evidence View Aggregation for Context-Efficient RAG Serving"
  authors:
    - "Tuan Nguyen"
    - "Qiran Hu"
    - "Banruo Liu"
    - "Khoa D. Doan"
    - "Kok-Seng Wong"
    - "Fan Lai"
  year: 2026
  venue: "arXiv 2609.11209 v1 (2026-09-10; accepted for IEEE ICDM 2026; author's accepted manuscript)"
  links:
    pdf: "https://arxiv.org/pdf/2609.11209v1"
    arxiv: "https://arxiv.org/abs/2609.11209"
    doi: "https://doi.org/10.48550/arXiv.2609.11209"
    code: "https://github.com/UIUC-MLSys/REVA"
    project: "https://arxiv.org/html/2609.11209v1"
series:
  id: "retrieval-systems-production-rag"
  title: "檢索系統：從證據到 Production RAG"
  part: 1
  totalParts: 1
---

本篇讀的是 [REVA: Reusable Evidence View Aggregation for Context-Efficient RAG Serving](https://arxiv.org/abs/2609.11209) v1（2026-09-10）。arXiv HTML 把它標成作者接受稿，接受刊登於 IEEE ICDM 2026；截至本篇撰寫時，讀到的是 arXiv v1 與作者提供的 artifact，不把它寫成已可在正式 proceedings 取得的版本。閱讀範圍包括 [完整 paper HTML](https://arxiv.org/html/2609.11209v1) 的 Sections I–VI、Figures 1–4、Tables I–VI，以及 [REVA GitHub artifact](https://github.com/UIUC-MLSys/REVA) 的 README、`src/reva.py`、`pyproject.toml`、`uv.lock` 與暫存資料下載入口。

如果你已讀過 [RAG 基礎](/paper-reading/31-retrieval-augmented-generation/) 或 [Self-RAG](/paper-reading/33-self-rag-retrieve-generate-critique/)，這篇不是再問「要不要檢索」。它問的是下一個 serving 問題：**同一批文件會被許多相近 query 重複取回，為什麼每次都要重新做 context importance scoring？如果某份文件從未被歷史 store 看過，系統要怎麼在不改 generator 介面的前提下繼續服務？**

## 90 秒掌握論文

- **問題**：post-retrieval compressor 如果在每個 request 上另外呼叫 model、做 token scoring 或生成式 rewriting，縮短 context 的收益可能被 compression latency 抵消；model-agnostic 的 selector 也可能保留模型本來就知道的內容，反而刪掉真正需要的 evidence。
- **核心直覺**：歷史 RAG request 已經留下 generator 如何使用文件的訊號。把 query 與可用的 answer／response 對文件 token 的 attention 映射到可讀的 word units，再跨重複 document access 平均，就能得到一份可重用的 evidence prior。它不是 query-specific answer，而是文件層級的 retention tendency。
- **最強證據**：在固定 top-10 retrieval cache、四個 QA benchmark 與三個 generator 上，B=512 full-split Table I 的 REVA-local 在 NQ、TriviaQA、HotpotQA、2Wiki 都比 Trunc-local 高；Table II 的 12 個 generator–dataset 設定平均為 37.83 F1、26.98 EM、27.5 ms online overhead。all-seen Table III 的 120 個 budget cells 則讓 REVA-global 達 43.72 F1、32.75 EM、49 ms。
- **主要邊界**：all-seen 只保留所有 top-K 文件都有分數的 held-out query，不能代表正式環境 coverage；full-split 才含 prefix fallback。attention 也只是 evidence importance proxy，不是 citation correctness 的驗證器；報告的 online overhead 排除 score-store 建置與更新。

我的 bounded verdict 是：**REVA 最有價值的改變，是把 compression 的 control point 從「每個 query 都重新判斷」搬到「歷史 interaction 產生可版本化的 document view，再在 request path 輕量 materialize」。** 如果你的 RAG workload 有高文件重複率、generator 相對固定、可以治理 corpus／tokenizer／template／scoring mode 的相容性，這是一個務實的 serving layer。若語料高速變動、query 分布漂移、文件 coverage 很低，或產品要求的是可證明的 citation chain，它仍不能取代 freshness、provenance 與 faithfulness 控制。

> **花花的工程提醒**
>
> 不要把「online 只有 27.5 ms」讀成「整套壓縮只要 27.5 ms」。REVA 把 attention scoring 移到離線或非同步路徑，這是很有用的邊界搬移；但真正的成本帳還要加入歷史 prompt 的 forward pass、store update、版本失配造成的 fallback，以及 coverage 監控。

## 論文身分、閱讀問題與證據地圖

論文作者是 Tuan Nguyen、Qiran Hu、Banruo Liu、Khoa D. Doan、Kok-Seng Wong、Fan Lai。arXiv record 的 v1 日期是 2026-09-10；HTML 頁首同時載明「accepted for publication in the 2026 IEEE International Conference on Data Mining (ICDM)」與 © 2026 IEEE 的 accepted-manuscript reuse restriction。這兩件事要分開：接受刊登是 paper status，並不等於本篇已引用正式會議版；圖像再利用也不等於自由授權。

本篇選的讀者問題是：**歷史 query–document–model trace 能否被壓成一份可重用、可讀、budget-agnostic 的文件 view，讓線上 RAG 只付 materialization 成本？** 它位於檢索系統主線的 production-rag gap：不像 [DPR](/paper-reading/32-dense-passage-retrieval/) 改第一階段的召回，也不像 Self-RAG 改「何時呼叫檢索」，REVA 改的是 retrieval 與 generation 之間的 post-retrieval evidence serving。

先把本文的三種聲音分開：

| 層次 | 本篇採用的說法 |
| --- | --- |
| **Paper 直接支持** | Section III 的 overhead、model-agnostic 與 repeated-access motivation；Section IV 的 attention mining、word-unit materialization、document-keyed store、local/global allocation 與 fallback；Tables I–VI、Figures 1–4 的品質、延遲、coverage 與消融。 |
| **作者主張** | 歷史 generator attention 可以形成 reusable evidence view，在四個 benchmark 與三個 generator 上取得接近或超過多個 compressor 的 quality–overhead frontier。 |
| **證據沒有支持** | attention 分數本身不是 citation faithfulness；重複取回率不保證跨時間分布穩定；all-seen 結果不是全量部署結果；online overhead 不包含 offline build／update，也沒有直接轉換成某家雲端帳單。 |
| **Bloss0m 工程判斷** | 把 REVA 當成有明確 compatibility key、coverage SLO、fallback、staleness policy 的 serving artifact，而不是一個只要接上就能安全壓縮所有 RAG context 的通用 compressor。 |

## 前一種作法為什麼不夠：短 context 不等於低總成本

傳統 post-retrieval compression 的資料流通常是：

`query → retrieve top-K → request-time compressor → compressed context → generator`

它的直覺很合理：先取多一點 evidence，再在送給 generator 前刪掉不重要的 token 或句子。但這條路有兩個 operational 問題。

第一，selector、scorer 或 rewriter 常常跟目前 query、文件集合與文件排列綁在一起，所以每次 request 都重新做工作。論文 Section III 與 Figure 1(a) 把這件事畫成 overhead：代表性的 request-time compressor 可能多出數百毫秒，這與 sub-200 ms time-to-first-token 的 serving 目標不容易同時成立。第二，model-agnostic 的重要性判斷不知道目標 generator 已經知道什麼、又會依賴哪些 evidence。Figure 1(b) 因而提醒讀者：在相同 budget 下，先進 compressor 不一定穩定勝過很簡單的 global prefix truncation。

REVA 的切入點不是宣稱 prefix truncation 沒用，而是問是否能把昂貴判斷做一次、重複使用很多次。Figure 1(c) 在作者的設定裡顯示 85–92% 的 held-out query，其 top-10 retrieval 至少含有一份 training prefix 曾存取過的文件。這個比例不是所有 production corpus 的定律，但它提供一個值得測量的條件：若 document recurrence 高，歷史 trace 就可能有 amortization value。

![REVA 論文 Figure 1：動機中的 compression overhead、matched-budget quality 與 seen-query rate。](/paperReading/47-reva-reusable-evidence-views/paper-fig-1-motivation.png)

*圖 1：論文 Figure 1，定位在 [Section I Introduction 的 Figure 1 anchor](https://arxiv.org/html/2609.11209v1#S1.F1)，並在 Section III 解讀。它支持「online compressor 的成本與收益必須同時量測」和「文件重複使用提供可挖掘訊號」，不代表每個工作負載都會有 85–92% coverage。圖檔是依 arXiv HTML 的原始 endpoint 保存；頁面標示作者 accepted IEEE manuscript © 2026 IEEE，personal use permitted，其他重印、再發布或重用需取得 IEEE permission；此處的版權／reuse restriction 仍然有效。*

## 核心直覺：把文件的過去使用痕跡變成 evidence prior

先不用公式，可以把 REVA 想成一個「文件級 evidence notebook」。某份文件第一次被 query A 取回時，目標 generator 在 forward pass 中已經產生 attention trace；如果 query B、C 之後也取回同一份文件，就繼續累積哪些 word units 被模型反覆看重。到下一個 query D 時，系統不必先用另一個 compressor 重新讀完全文，而是查這份 notebook，選高分單位，再把它們按照原文順序拼回普通文字。

這個直覺有三個刻意的取捨：

1. **model-aware，但不是 query-bound**：分數來自目標 generator，會保留該模型實際使用 evidence 的傾向；但分數不是對某一個新 query 的保證，因此需要 coverage 與 drift 監控。
2. **budget-agnostic，但不是 text-cache per budget**：store 不保存 B=256、B=512、B=1024 三份壓縮文字，而保存 word-unit score、sum、count 與原文邊界。改 budget 時重新 materialize，不需重跑 attention scoring。
3. **plain-text，但不是 token bag**：保留文字介面，不要求 generator 支援 KV-cache API 或 latent memory；同時先以 word unit 選擇、再按原始位置輸出，避免留下破碎數字或錯亂句序。

論文 Section IV-B 用 co-retrieval 做一個有條件的幾何動機。令 $e(\cdot)$ 是 unit-norm retrieval embedding，歷史 query 為 $q_A$、未來 query 為 $q_B$、共同取回文件為 $d$，並令 $r_A=e(q_A)^\top e(d)$、$r_B=e(q_B)^\top e(d)$。若兩者都至少為 $\rho>0$，論文給出：

$$e(q_A)^\top e(q_B) \ge r_A r_B-\sqrt{(1-r_A^2)(1-r_B^2)}\ge 2\rho^2-1.$$

這個式子只說 retrieval space 裡的 query 相似度在額外條件成立時有下界；它不是 attention similarity 的 theorem，也不是 top-K retrieval 自動保證的條件。作者自己在 Section IV-B 說明這點，所以本文不把「共同取回」誇大成「相同 evidence need」。

## 方法流程：offline score store 與 online rendering 的邊界

![REVA 論文 Figure 2：從歷史 interaction 建 store，再在線上依 budget 渲染可重用文字 view。](/paperReading/47-reva-reusable-evidence-views/paper-fig-2-pipeline.svg)

*圖 2：論文 Figure 2，定位在 [Section IV-A Design Overview 的 Figure 2 anchor](https://arxiv.org/html/2609.11209v1#S4.F2)。它是本文理解 offline／online boundary 的核心圖：歷史或非同步 access 產生 score，線上只 lookup、allocate、render，未命中文件走 prefix fallback。圖檔保留自 arXiv 的原始 SVG endpoint；原頁標示 © 2026 IEEE accepted manuscript，personal use permitted，其他 reuse 需 IEEE permission，故此處保留 attribution 與 restriction note。*

可以把 Algorithm 1 重新寫成下列四段：

1. **收集歷史 interaction**：對每筆歷史 `(q, D(q), a)`，用目標 generator $f$ 的 attention-enabled forward pass，來源可以只有 query，也可以包含已有的 answer／response。這裡的 `a` 是離線訊號，不是把未來 test answer 偷塞進同一筆 served context。
2. **把 token trace 變成可讀單位**：對每個 document-body token $p$，把來源 token 集合 $T$ 對它的 attention 做 head average、source-position sum：

   $$S_q(p)=\sum_{r\in T}\frac{1}{H}\sum_{h=1}^{H}A^{(h)}_{r,p}.$$

   $A^{(h)}_{r,p}$ 是 head $h$ 中來源 token $r$ 指向文件 token $p$ 的權重，$H$ 是 head 數。分數越高表示在這份離線 forward trace 中，更多來源位置把權重放到這個文件位置；它不是「這個 token 必然是真實引用」的標籤。相鄰 tokenizer pieces 以 whitespace-start boundary 組成 word unit，日期、百分比、逗號分隔數字、hyphenated word、capitalized multiword name 等短結構做 protection；一個 unit 的分數取成成員 token 的 max。
3. **按文件累積**：對文件或 chunk 的每個 unit $u$，累積 $M_{k(d)}(u)\leftarrow M_{k(d)}(u)+S_q(u)$ 與 $C_{k(d)}(u)\leftarrow C_{k(d)}(u)+1$，最後使用：

   $$\bar S_{k(d)}(u)=\frac{M_{k(d)}(u)}{C_{k(d)}(u)}.$$

   $k(d)$ 是 compatibility key，至少要綁定文字／文件身份、generator $f$、tokenizer $\tau$、scoring template $\pi$、scoring mode $m$ 與 corpus／chunk version $\nu$。平均的 operational meaning 是降低一次 access 的 noise；在論文的理想獨立 noise 假設下，$n$ 次平均的 variance 上界從 $\sigma^2$ 降到 $\sigma^2/n$。實際上若 query distribution 漂移，作者建議 refresh 或 exponential decay，而不是無限相信舊樣本。
4. **線上 materialize**：新 query 仍照平常 retrieval 取回 top-K，先依內容 key 去重，再分配 token quota。命中相容分數的文件按 $\bar S$ 選 unit，最後按原文件順序輸出；沒有相容分數的文件則使用 fallback。輸出合併後再做 final budget repair，交給沒有改過的 generator。

這個 boundary 是 REVA 的主張，也是它的責任轉移：online latency 降低，是因為 attention scoring 被放到 offline／async；它並沒有讓 scoring 消失。若團隊沒有歷史 log、無法重跑目標 generator、或 corpus 很少重複，REVA 的 amortization 前提就不足。

## 用一個文件走一遍：從 unseen fallback 到可重用 view

以下是依 Section IV 與 Algorithm 1 組合出的 faithful explanatory example，不是論文額外報告的單筆案例：

1. **Input**：一個新的 query 取回十個文件，其中 `d7` 是 FAQ 內容，過去 40 次 request 都曾取回；`d9` 是剛上線的新 chunk，score store 完全沒有它的 compatible row。服務 budget 設為 $B=512$。
2. **Offline intermediate representation**：對 `d7` 的歷史 access，系統以同一 generator、tokenizer、template 與 scoring mode 取得 token attention，把「2024-09-18」、「$12,400」等不應被切碎的 pieces 保護成 word units；每一單位保存原文 offset、token boundary、score sum 與 count。`d7` 的 key 也記住 corpus version。`d9` 沒有這條兼容 key。
3. **Online decision**：REVA-local 先給每份 deduplicated document 約 $\lfloor B/K'\rfloor$ 的 quota；`d7` 在自己的 quota 內依平均分數挑 unit，`d9` 則對同一 quota 做 prefix truncation。REVA-global 若啟用，會用高分 unit 的 bounded utility，在保護高排名文件與 per-document cap 下重新分配剩餘 budget；它不會因為 `d9` 沒有 score 就假裝知道 `d9` 的 salience。
4. **Output**：`d7` 的高分 units 可能分散在原文中，但 renderer 依原始 order 合併回可讀片段；十份結果依 retrieval order 合成 plain-text context，generator 仍收到原本格式的文字。沒有 KV tensor、沒有新的 latent interface。
5. **Likely failure point**：如果 `d7` 的文字被 corpus update 改過、tokenizer 或 template 換過，key 不應命中舊分數；若錯誤地只用 document ID 而忽略 version，過期 score 可能把新 evidence 選錯。若 `d9` 在真正 workload 中占大多數，fallback 會讓 REVA 的實際品質靠近 truncation，而不是 all-seen 曲線。這也是為什麼 coverage 應是 dashboard、SLO 與 cache invalidation policy 的一部分。

## Compatibility key：可重用的前提不是「同一個 doc_id」

REVA 的 reusable artifact 不是任意一段文字上的全域 salience。Section IV-C 的 composite key 是：

$$k(d)=(k_{text}(d),f,\tau,\pi,m,\nu).$$

`k_text(d)` 可以由 document ID 與 chunk ID 組成；若沒有穩定 ID，則需要 text fingerprint。其餘欄位分別是 generator、tokenizer、scoring template、scoring mode 與 corpus／chunk version。這幾個欄位並非 metadata 裝飾，而是「這份 score 能否安全重用」的 compatibility contract：

- **generator** 改變，模型的 knowledge gap 與 attention 使用方式可能改變；
- **tokenizer** 改變，word-unit 邊界、token count 與 budget accounting 可能改變；
- **template** 改變，query、答案、文件在 prompt 的位置與來源 token 集合可能改變；
- **scoring mode** 從 Q 改成 Q+A，分數的語義就從 query lexical signal 變成加入 response trajectory 的 signal；
- **version** 改變，舊 offset、舊 word unit 與新文件內容不能直接疊加。

真正落地時，我會把 compatibility miss 當成一個可觀測事件，而非靜默 fallback：記錄命中／未命中原因、store version、document version、generator hash、tokenizer hash、fallback token 比例與 answer quality。這段是 Bloss0m 的工程建議，論文只直接要求相容 key 與 fallback semantics，不是已完成的 production telemetry specification。

值得注意的是 artifact 與 paper claim 要分開讀。paper Section IV 描述包含 generator、tokenizer、template、mode、version 的 composite key；我核對的 GitHub `main` 版本則以 `doc_key`（`doc_id` 與 optional `chunk_id`）查 store，並在 score row 的 metadata 保存 `scoring_model_name`、word-unit type、training hits、raw token 等欄位；`validate_score_doc` 會檢查 doc/chunk identity 與 raw text。這個公開實作足以教你資料結構與 fallback 介面，但不能把它說成已完整實作 paper 文字中的所有 deployment-level compatibility dimensions。部署者仍需自己把其餘欄位納入 namespace 或 wrapper。

## Local 與 Global budget：coverage 與 salience 的政策選擇

給定 total context budget $B$ 與 deduplicated retrieved documents $K'$，**REVA-local** 的基本 quota 是：

$$b_i=\min(m_i,\lfloor B/K'\rfloor),$$

其中 $m_i$ 是文件 $d_i$ 的原始 token length。每份文件獨立挑高分 units，所以一份很有 salience 的文件不能吃掉全部 budget；同一份文件換了鄰居，也可以重用自己的 view。這是較容易預測、也較容易維持 evidence coverage 的 policy。

**REVA-global** 使用同一套 unit score 與 within-document selection，但允許文件之間重新分配剩餘 budget。作者在 Section V-A 固定的設定中，以每份文件最高分 10% units（數量限制 1–32）估計 historical utility，再除以未壓縮 token length 的平方根；top $L=\min(5,K')$ 文件先拿 protected quota，每份 document cap 為 $b_i^{max}=\min(m_i,\lceil0.25B\rceil)$，剩餘 budget 依 utility 分配，超過 cap 或文件長度就回收。若 utility 全為零，則對 eligible documents 均分。

這裡的設計訊息比「global 比 local 好」更細：global 必須保留 floor、cap 與 coverage repair，否則 naive global 只把所有 units 丟到一個大 pool，可能把某份文件的幾個高分片段全部塞滿，品質與 latency 都變差。若任何 document 沒有 compatible score，論文的 online policy 退回 equal document quotas；covered 文件 score-guided，uncovered 文件 prefix fallback。

Table V 把這個取捨拆開：在 HotpotQA，global 的 F1 是 43.25，比 Trunc-local 高 5.16，也比 RECOMP-e 高 1.67，且 30 個 cells 中有 26 個至少達到 RECOMP-e；TriviaQA 的 global dataset-slice F1 是 68.74，略低於 local 的 68.86；2Wiki 也幾乎相同。最穩妥的解讀是：當 decisive evidence 在文件間分布不均，protected global allocation 有機會把 budget 放到更有用的文件；當 workload 沒有這種不均，local 的較低 overhead 與 coverage guarantee 可能更適合作為預設。

## 實驗設計：先確認比較的分母

論文 Section V-A 把 retrieval variance 固定住：四個 open-domain QA benchmark 是 Natural Questions、TriviaQA、HotpotQA、2WikiMultihopQA；generator family 是 Llama-3.1-8B-Instruct、Qwen3.5-9B、Gemma-4-E4B-it；所有方法共享預先建立的 top-$K=10$ retrieval cache，retriever 是 `intfloat/e5-base-v2` mean pooling、maximum encoder length 512、FAISS flat inner-product search。實驗在 four-H100 server 上進行。

主要 metrics 是 token-level F1、exact match（EM）、ROUGE-L、emitted context tokens 與 online overhead（OO）。OO 是 request-time compression／materialization wall-clock latency，排除 retrieval、offline score-store construction、answer generation 與 asynchronous update。這個定義對讀表很重要：短 context 與低 OO 仍可能伴隨高離線建置成本；而 generator 最後的 generation time 也不是 OO 本身。

作者用三個 evaluation regime 把 transfer 與 coverage 分開：

- **Full-split strict reuse**：score store 只由 training split 建立並 freeze；held-out query 的 top-K 可混有 covered 與 uncovered documents，後者走 prefix fallback。這是最接近部署的主結果。
- **All-seen strict reuse**：只保留所有 retrieved documents 都有 stored score 的 held-out query，測的是「coverage 已存在時，歷史 score 能否 transfer」。它是 diagnostic subset，不是 deployment distribution。
- **Component ablation**：沿用 strict reuse 規則，改變 Q vs Q+A scoring、local vs global allocation、word-unit materialization 與 rendering order。

Baselines 涵蓋 Trunc-local／Trunc-global、Selective Context、LLMLingua-2、RECOMP-e、LongLLM、EXIT 與 FaviComp。比較時不能把所有列當成 matched-budget：EXIT 很短但它的 B 是 post-selection guard，FaviComp 把 B 當 maximum decoding length，可能提早停止。作者也明確把它們視為 inference-time stress tests。

## 證據一：partial coverage 仍能提升，但 coverage 不是免費的

Table I 是 full-split、B=512、三個 generator 平均的 any-seen coverage 與 quality。NQ 的 any-seen 是 87.9%，Trunc-local F1/EM 是 33.68/22.56，REVA-local 是 38.12/25.23；TriviaQA 為 87.1% 與 53.70/42.64 對 58.18/47.57；HotpotQA 為 91.6% 與 27.48/16.99 對 31.03/20.79；2Wiki 為 85.2% 與 21.60/12.87 對 23.99/14.90。

這支持一個窄而有用的結論：**只要 query 的 top-10 裡至少有一份文件命中 store，score-guided view 加上 fallback 可以在這四個 benchmark 的 full split 中比 document-local prefix truncation 好。** 它不支持「所有文件都已被重用」；any-seen 是 query-level 至少命中一份，很多個別文件仍 uncovered。工程上因此要同時記錄 query-level any-seen 與 document-level coverage，否則 87–92% 容易掩蓋大量 fallback。

## 證據二：品質與線上成本的 trade-off

Table II 在同一個 B=512 比較 12 個 generator–dataset settings 的平均。Trunc-local 是 34.11 F1、24.10 EM、30.43 ROUGE-L、512.0 context tokens、17.0 ms OO；REVA-local 是 37.83、26.98、33.65、502.3 tokens、27.5 ms。REVA-local 相對 Trunc-local 提升 3.72 F1、2.88 EM、3.22 ROUGE-L，而 OO 多 10.5 ms。這個多出來的 materialization cost 與 request-time compressor 的尺度不同：SelCtx-local 822.6 ms、LLM-L2-local 343.0 ms、RECOMP-e 120.0 ms、LongLLM 598.9 ms。

REVA-local 的 F1 距離 LLM-L2 variants 與 LongLLM 約 0.44–0.81 points，但距離 RECOMP-e 仍有 2.36 points；所以作者的「near-frontier」比「uniformly best」準確。若你的 KPI 是每毫秒多拿到的 answer quality，REVA 的主張很強；若只挑最高 F1，Table II 的 RECOMP-e 仍是較高的一列，但付出更高 OO。

all-seen Table III 進一步把 120 個 cells（3 generators × 4 datasets × 10 budgets）聚合。REVA-local 的 mean F1/EM/OO 是 43.34/32.73/31 ms；REVA-global 是 43.72/32.75/49 ms；RECOMP-e 是 43.66/32.69/155 ms。換句話說，在這個診斷分母內，global 的 F1 略高於 RECOMP-e，local 只差 0.32 F1，兩者 OO 都遠低於 RECOMP-e。可是這個比較不能抹掉 all-seen filter；正式環境需把 fallback 後的 full-split 數字和 coverage 一起看。

![REVA 論文 Figure 3：不同 budget 下 representative generator–dataset pair 的 quality 曲線。](/paperReading/47-reva-reusable-evidence-views/paper-fig-3-budget-curves.svg)

*圖 3：論文 Figure 3，定位在 [Section V-B Main Results 的 Figure 3 anchor](https://arxiv.org/html/2609.11209v1#S5.F3)。它的教學用途是看跨 budget 的 frontier 是否穩定：REVA-local／global 多數設定接近或超過 inference-time compressor，但不是每一條曲線都 uniformly dominant。原始 SVG 來自 arXiv endpoint；© 2026 IEEE accepted manuscript 的 personal-use-only 與其他 reuse 需 IEEE permission restriction 同樣適用。*

Figure 3 對採用決策的價值，在於它迫使我們不要只記 B=512 的單點。budget 變小時，word-unit 完整性與文件 coverage 的代價可能更明顯；budget 變大時，prefix truncation 也可能追回部分差距。作者的結論是 near-frontier across budgets，而不是一個所有 workload、所有 budget 都勝出的單調 theorem。

## 證據三：Q+A scoring、global allocation 與 word order 各自做什麼

Table IV 是最值得讀的 component ablation。以 all-seen grid 平均：Trunc-local 是 38.75 F1、28.81 EM、15.6 ms；REVA-local + query-only（Q）是 42.29/31.85/28.5；REVA-local + query-plus-answer／response（Q+A）是 43.34/32.73/31.5；REVA-global + Q+A 是 43.72/32.75/48.7。這支持作者的解釋：response trajectory 暴露 answer-bearing spans，Q+A 因而比 Q 更強；但它也表示離線 scoring 需要已完成 response，資料 pipeline 不能只靠 query log。

Naive global + Q 的 41.76 F1、92.9 ms，Naive global + Q+A 的 42.04、105.8 ms，都低於相應的 protected REVA policy，雖然它們都把全體候選放進大 pool。這個反例很有工程含義：global allocation 不是「全域排序」四個字，而是「在 per-document floor、cap、coverage repair 下重新分配剩餘 budget」。

作者也在 Table V 把 generator 與 dataset 拆出來。REVA-global 對三個 generator average 都比 REVA-local 高一點，但 dataset pattern 不一致：HotpotQA 的 global uplift 最清楚，TriviaQA 與 2Wiki 的 local/global 差異混合。這讓「local 是安全 default、global 是對 evidence uneven distribution 的選項」比「global 永遠比較好」更可信。

最後是 Figure 4 的 materialization ablation。以 Qwen3.5-9B、B=512 為例，移除 word-unit materialization，F1 從 53.52 降到 52.23、EM 從 46.13 降到 44.47、ROUGE-L 從 47.22 降到 45.95；將同一批 selected units 依 score order 輸出，F1 為 50.61、EM 42.85、ROUGE-L 44.02，而原始 order 的 context 約 488.3 tokens，score-order 約 487.3。分數選得對不代表排列可以亂掉：可讀性與原文結構本身是 evidence interface 的一部分。

![REVA 論文 Figure 4：word-unit materialization 與 original-order rendering 的消融。](/paperReading/47-reva-reusable-evidence-views/paper-fig-4-materialization-ablation.svg)

*圖 4：論文 Figure 4，定位在 [Section V-C Performance Breakdown and Ablation Studies 的 Figure 4 anchor](https://arxiv.org/html/2609.11209v1#S5.F4)。它支持兩個不同機制：word-unit 把 token selection 變成完整可讀單位，original order 保留文件結構；它不是額外的 benchmark overview。原始 SVG endpoint 依 accepted IEEE manuscript 保存；arXiv 頁面准許 personal use，但其他重印／再發布／重用需 IEEE permission，故此處保留來源與版權／restriction note。*

Table VI 的 EXIT／FaviComp stress test 也值得保留：EXIT 平均 107.5 context tokens，卻有 3,858.2 ms OO；FaviComp 234.6 tokens、12,837.7 ms OO；REVA-local／global 分別 491.5／491.9 tokens、26.2／40.6 ms。這不是 matched-budget 的公平勝負表，因為三者的 B semantics 不同；它比較像提醒：極短 context 可能換來更大的 request-time compression bill。

## Attention 的證據邊界：有用的 proxy，不是 faithfulness proof

REVA 把 attention 當成「模型在 forward trajectory 中如何分配權重」的低成本 trace。這個訊號很適合做 ranking prior，因為它來自目標 generator 自己，且 query token 與 generated response token 的重複關注能累積 recurring spans。但從「模型注意到某段」到「某段足以支持正確、完整、可引用的答案」中間，仍有多個未驗證跳躍：

- attention 可能同時反映 lexical match、位置偏好、prompt template 與模型內部既有知識，不等於 causal evidence use；
- Q+A scoring 要依賴歷史 answer／response，若歷史答案錯，store 可能把錯誤的 span 變成高分 prior；
- max over member tokens 的 word-unit score 會保留一個高分 piece，這提升完整性，但不保證保留跨句 bridge evidence；
- 平均降低的是 access-specific noise，不是 distribution shift、corpus edit 或 answer policy shift；
- 文章報 F1、EM、ROUGE-L 與 latency，沒有用 citation-level evaluator 證明 retained span 對每個答案都是真正支持。

因此，REVA view 應與原文 offset、document version、score provenance 一起保存，讓除錯者可以問「哪一段被選了、為何被選、依據哪些歷史 hits、當時 generator／template 是什麼」。產品若要求 citation faithfulness，仍需另外保留 citation verifier、support entailment、missing-evidence abstention 或 human escalation；不能把 attention score 當作它們的替代品。

## All-seen 是診斷 subset，不是 deployment shortcut

all-seen 讀法很容易被誤解。它並不是把 test query 的 answer 放進 store：論文說 held-out query 與 answer 不會用來建構它自己被服務的 context；這點是嚴格 reuse 的好處。但 all-seen 會先篩掉任何含有未命中文件的 query，因此它回答的是「在 coverage 已經完整時，歷史分數 transfer 得如何」，不是「真實流量有多少 request 能完整享受 view」。

full-split 的 Table I 才讓 unseen-document fallback 出現在端到端分母；其 any-seen 85.2–91.6% 仍是至少一個文件命中的 query rate，不是 top-10 每份文件都 covered。這兩種分母不能混成一個 headline。我的建議是部署前至少畫四條曲線：query any-seen、document coverage、fallback token share、quality by coverage bucket。若 all-seen F1 很高但 fallback token share 也很高，系統的實際收益仍會被 truncation 拉回。

## Artifact、環境與可重現性：可檢查，不等於一鍵重現

截至 **2026-09-15**，我核對到的 artifact 狀態如下：

| Artifact | 狀態與可用性 | 對重現的意義 |
| --- | --- | --- |
| GitHub repository、`src/reva.py`、`src/cli.py`、metrics、runner、README | **accessible／usable for inspection**；公開 repository 有 `uv.lock`、quick start、JSONL schema 與 figures | 可以讀 implementation、建立小型 score store、用 prebuilt store 跑 `reva`；不等於已在本站獨立重跑 paper benchmark。 |
| Python environment | README 要求 `uv sync --locked`；Python `>=3.10,<3.13`；依賴 pinned Transformers commit、Torch `>=2.11,<2.12`、Accelerate、Safetensors、SentencePiece；retrieval extra 是 FAISS、Hugging Face Hub、NumPy | 需要可用的 attention-enabled generator、fast tokenizer、模型權重與可能的 GPU memory；paper evaluation 使用 four-H100 server。 |
| Retrieval top-20 artifact | README 提供 temporary [Google Drive endpoint](https://drive.google.com/file/d/1buhg89g4n5j4tGiDj_94K1F0bflNzhFb/view?usp=sharing)，直接頁面在核查日可到達；README 說 Zenodo DOI 尚未就緒 | 不能把暫存 Drive link 當成永久 archival DOI；下載後仍要核對資料內容與 checksum／manifest。 |
| Compact REVA score cache | README 提供 temporary [Google Drive endpoint](https://drive.google.com/file/d/1vO7EmnzyV2-Fqg8KudX-oT2haiwY8uPe/view?usp=sharing)，直接頁面在核查日可到達 | 包含 manifest、verify TSV、SHA-256 checksums 與六組 generator／scoring-mode 檔名；尚未驗證下載內容是否能完整重建所有 paper table。 |
| Paper global allocator | Paper Sections IV-D／V-A、Tables III–V 有定義與數字； inspected `main` 的 `select()` 仍路由到 document-wise selection，quick start 只展示 `--method reva` | global 是 paper evidence，但不是我能從目前公開 quick start 直接確認的一鍵 reproducer；要重建需先核對 artifact 版本或自行實作 allocator。 |

README 的最小可行流程是：用 JSONL 的 `question`、`answers`、`contexts[{doc_id,title,text,chunk_id}]` 準備 training examples；執行 `PYTHONPATH=src uv run python -m cli build-store --input data/train.jsonl --model meta-llama/Llama-3.1-8B-Instruct --option max_scoring_tokens=8192 --output outputs/reva_store`；再以 `--method reva --budget 512 --option score_store_path=outputs/reva_store/score_store.jsonl` 跑 test input。若只是理解 rendering，README 也提供 `Doc: "Paris is the capital of France."` 的 word-unit score example：先以分數挑 `Paris, France, capital`，最後按原文順序渲染成 `Paris capital France`。這個例子是介面示意，不是 paper benchmark。

最小而有意義的 reproduction plan 不是直接重跑四個 benchmark，而是先做三個 controlled cases：

1. **Seen**：以少量 historical JSONL 建 store，固定 generator／tokenizer／template，確認高分 unit 在原文順序輸出。
2. **Unseen**：拿一份未出現在 store 的 document，確認 prefix fallback、quota、fallback count 與 final budget repair 都可觀測。
3. **Mismatch**：改變 raw text、chunk ID、generator metadata 或 template namespace，確認不會靜默重用舊 score；若 artifact 的當前 key 只涵蓋 doc/chunk，則在 wrapper 層補足 compatibility key。

只有完成這三件事，才值得把模型下載、四個 dataset 與多 budget grid 的結果拿來對照。完整重現仍受 temporary data、model weights、four-H100 scale、pinned nightly-ish Transformers commit 與 baseline extras 影響；本文沒有聲稱已完成 independent full benchmark run。

## 工程決策：什麼時候值得用，什麼時候不要用

**適合先做 PoC 的條件**：文件有高 recurrence；retriever cache 可記錄穩定 document／chunk identity；目標 generator、tokenizer 與 prompt template 相對固定；團隊能在 offline／async pipeline 使用 attention-enabled forward；產品願意接受 score-guided view 是 evidence prior，不是 citation proof。先量測 document coverage、any-seen、fallback token share、store bytes、建置 throughput、update lag、p50／p95／p99 OO 與不同 budget 的 F1／EM。

**不要直接採用的條件**：每個 query 幾乎都取回新文件；corpus 內容頻繁編輯但沒有 versioned invalidation；generator 常切換且沒有 namespace；歷史回答品質不穩或包含敏感內容，卻沒有 provenance／retention policy；產品需要逐句 citation correctness、法律可稽核性或拒答保證；線上 context 生成還有未被 `reva` 覆蓋的 alternate path。此時簡單 truncation、sentence-level selector 或 citation verifier 可能仍要存在，REVA 只能是分層中的一部分。

採用時我會把它拆成四個 operational contract：

| Contract | 必須觀察的量 | 失效時的動作 |
| --- | --- | --- |
| **Compatibility** | key 欄位、model／tokenizer／template／corpus version、raw-text digest | miss 時 fail safe 到 fallback；禁止以 doc ID 靜默重用不相容分數。 |
| **Coverage** | query any-seen、document hit rate、fallback documents、fallback token share | 低 coverage 時回退基線，並把收益歸因到 covered bucket，而非全流量平均。 |
| **Freshness** | store age、update lag、score decay、corpus edit rate | 版本變更或 drift 超過門檻時 invalidation／rebuild；不要只累加歷史 counts。 |
| **Evidence quality** | answer F1／EM 之外的 citation support、missing bridge span、human audit | attention 只能排名，faithfulness 需另一條 verifier 與 escalation path。 |

這份矩陣是 Bloss0m 的工程轉譯，不是 paper 已測試的 production control plane。論文證明的是在它的固定 cache、模型、資料集、budget 與 strict reuse protocol 下，這種 artifact 可以產生有競爭力的 quality–OO 曲線。

## 三個記憶點

1. **技術想法**：REVA 把歷史 generator attention 映射成 document-keyed word-unit average，將同一份文件的 evidence selection 從每次 query 的現場工作，變成可跨 budget 重用的 score store。
2. **最強證據**：full-split partial coverage 在四個 benchmark 都勝過 Trunc-local；all-seen budget grid 的 REVA-global 43.72 F1／32.75 EM／49 ms、REVA-local 43.34／32.73／31 ms，說明 reusable view 能靠近 frontier 且顯著減少 request-time compression overhead；但分母不同，不能混讀。
3. **採用邊界**：attention 是 proxy，all-seen 是 diagnostic，online OO 排除 offline build／update。真正的 production readiness 取決於 compatibility key、coverage、freshness、fallback 與 citation verifier 是否被治理。

## 下一步閱讀與原始出處

- 如果你要先理解 RAG 如何把檢索結果接給 generator，讀 [RAG：把檢索接上生成](/paper-reading/31-retrieval-augmented-generation/)。
- 如果你要理解 dense retriever 如何建立第一段候選，讀 [DPR](/paper-reading/32-dense-passage-retrieval/)。
- 如果你要比較「模型何時檢索」與「檢索後如何壓縮」，讀 [Self-RAG](/paper-reading/33-self-rag-retrieve-generate-critique/)。

### 原始出處

- Nguyen, Hu, Liu, Doan, Wong, and Lai, [REVA arXiv record](https://arxiv.org/abs/2609.11209), v1 submitted 2026-09-10; author accepted manuscript, accepted for IEEE ICDM 2026.
- [REVA full paper HTML](https://arxiv.org/html/2609.11209v1)：Sections III–V、Algorithm 1、Figures 1–4、Tables I–VI。
- [Official REVA artifact repository](https://github.com/UIUC-MLSys/REVA)：README、`src/reva.py`、`src/cli.py`、`pyproject.toml`、`uv.lock` 與 temporary data links；狀態於 2026-09-15 核查。
- [Retrieval top-20 temporary data link](https://drive.google.com/file/d/1buhg89g4n5j4tGiDj_94K1F0bflNzhFb/view?usp=sharing)；[compact score-cache temporary data link](https://drive.google.com/file/d/1vO7EmnzyV2-Fqg8KudX-oT2haiwY8uPe/view?usp=sharing)。兩者均是 README 指向的暫存 endpoint，Zenodo DOI 在核查時尚未就緒。
