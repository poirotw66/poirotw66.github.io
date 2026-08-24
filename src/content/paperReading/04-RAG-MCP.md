---
title: "RAG-MCP：用檢索縮小工具發現，但不能忽略路由失敗"
description: "以論文證據檢視 RAG-MCP 的工具路由流程、11,100 候選壓力測試、MCPBench 結果、規模退化與未釋出 artifact。"
pubDate: 2026-03-23
updatedDate: 2026-08-24
tldr:
  - "RAG-MCP 把工具發現移至外部索引，只將被選中的 schema 交給執行模型。"
  - "43.13% 是 web-search 子集上的條件式 top-1 選擇結果，不是正式環境可靠性或安全性的證明。"
audience:
  - "需要控制 MCP 或 function-calling schema context 的工程師。"
  - "希望分開衡量路由召回、呼叫正確性、成本與安全性的研究者。"
tags: ["Paper Reading", "RAG", "MCP", "Tool Selection", "LLM Function Calling", "Prompt Bloat"]
image: "/paperReading/04-RAG-MCP/image_1.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
paper:
  title: "RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation"
  authors:
    - "Tiantian Gan"
    - "Qiyao Sun"
  year: 2025
  venue: "arXiv 2505.03275 v1（preprint）"
  links:
    pdf: "https://arxiv.org/pdf/2505.03275.pdf"
    arxiv: "https://arxiv.org/abs/2505.03275"
series:
  id: "rag-mcp"
  title: "RAG-MCP 深度精讀"
  part: 1
  totalParts: 1
---

## 90 秒地圖 / The paper in 90 seconds

- **問題**：把大量 MCP tool schema 全塞進 prompt，會增加 token、distractor 與錯誤選 tool 的機會。
- **核心想法**：先將 MCP metadata 建索引，query 時 retrieve top-k candidate schema，再讓 executor 在小候選集內 validate 與 invoke；retrieval 是 candidate generation，不是授權決策。
- **最強證據**：MCPBench web-search 設定中，論文報告 RAG-MCP 的 ground-truth MCP top-1 accuracy 43.13%，對 keyword pre-filter 18.20%、all-schema prompting 13.62%（Section 4.2、Table 1）。
- **邊界**：v1 的 retriever metadata、embedding/version、schema drift、permission、p95 latency 與真實 invocation success 未完整公開；top-1 route 不是 task success。

## 先前方法為何不足 / Why the previous approach is insufficient

all-schema prompting 假設更多 schema 一定有助模型，但 registry 變大時相關 tool 反而被 distractor 淹沒；keyword pre-filter 又不懂語義與 parameter compatibility。RAG-MCP 只縮小候選集合，沒有取代 capability negotiation、auth 或 execution-side validation（Section 3.1–3.2）。

## 核心直覺 / Core intuition and method

對 query $q$ 與 registry $M$，retriever 產生 $r(q,M)$ 的 top-k schema；executor 再檢查 required parameters、version、permission 與回覆。成功機率是「取對工具 × schema/call 相容 × invocation 成功 × task 正確」的連乘概念，所以把第一項做高不能證明最後一項（Figure 2、Section 3.2）。

![RAG-MCP Figure 3：MCP schema 數量與位置變化下的 retrieval success heatmap。](/paperReading/04-RAG-MCP/image_3.webp)

*Figure 3，論文 Section 4.1 的 scale experiment：熱圖顯示 MCP schema 數量與 distractor 位置如何影響 retrieval success，正好把「候選生成」與「最終 task success」分開。見 [原始 Figure 3 anchor](https://arxiv.org/html/2505.03275v1#S4.F3) 與 [arXiv HTML figure endpoint](https://arxiv.org/html/2505.03275v1/heat_map.png)。arXiv source 標示 perpetual non-exclusive license；本文保留 attribution，依 [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) 使用。*

## 逐步例子 / Worked example

使用者問「找出台北明日天氣」。registry 同時有 weather search、地理編碼、歷史氣候與付款工具。retriever 先給 weather/search 的少量 metadata；executor 發現需要 location/date，補齊參數並依 permission policy 呼叫。若 retrieved schema 是舊版或無權限，應 abstain/fallback，而非硬叫工具。這是機制示例，不是 MCPBench case。

## 如何讀實驗 / Evidence, controls, and limits

**Figure 3 / Section 4.1** 檢查隨 registry/distractor 變大時的 retrieval 行為。**Table 1 / Section 4.2** 固定 MCPBench web-search 與 benchmark target，改變 route policy；43.13% 是 ground-truth MCP selection，不是端到端 answer quality。論文沒有 production traffic、版本漂移或 latency SLA 消融，因此不能從表格推論大規模 MCP gateway 已可靠。

## Artifact 與採用判斷 / Artifacts and engineering decision

截至 **2026-08-09**，arXiv v1 可讀；論文 frontmatter 未提供官方 code、MCPBench download 或可直接執行 endpoint，artifact 狀態為 **missing / unverified**。適合先以 versioned registry snapshot、retrieval recall、schema compatibility、false accept/reject 與 invocation success 建 canary；不適合把 vector top-1 直接接到有副作用的 tool。

## 三個記憶點 / Three things to remember

1. RAG-MCP 解的是 prompt bloat 的候選縮減，不是完整 tool governance。
2. tool selection、schema validation、權限與 task success 是不同測量層。
3. registry 漂移與副作用工具需要 deterministic guardrail，而非只提高 top-k。

## 讀者問題與結論

當 agent 面對數百個 MCP server，是否應把所有 schema 都塞進 prompt，再讓模型自行挑選？RAG-MCP 的回答是否定的：先以檢索做**工具發現**，對候選做驗證，再只把一個 schema 交給執行模型。這個拆分確實能減少 context 壓力；但它不是消除失敗，而是把失敗邊界前移。正確 server 若沒進 retriever 的 top-k，或過期描述被排第一，再強的 executor 也看不到正確工具。

這篇 2025-05-06 發布的 arXiv v1 是 preprint，不是 MCP 規格，也不是 production study。它最有力的證據是受控 web-search 實驗：Table 1 的 RAG-MCP 選到 ground-truth MCP 的 accuracy 為 43.13%，高於 keyword pre-filter 的 18.20% 與把所有 schema 放入 prompt 的 13.62%。更值得工程團隊讀的是反面結果：Figure 3 顯示候選池變大後，retrieval precision 會退化。因此，這篇論文支持「prompt bloat 可量測、路由必須被量測」；它不支持「top-1 semantic routing 已足以安全處理重要工具」。

## Evidence Map

- **論文直接支持的證據**：Section 3.2 定義 retrieve → validate → invoke；Figure 2 畫出流程；Section 4.1 與 Figure 3 將一個真實工具置於最多 11,100 個候選中做壓力測試；Section 4.2 與 Table 1 在 MCPBench web-search 子集比較三種選擇策略。
- **作者主張**：外部索引可降低 context 負載；新 MCP 可透過建立 metadata 索引加入，無須重訓模型；相較於 all-schema prompting，選擇表現可改善。
- **論文未證明**：沒有公開的端到端程式、精確 registry snapshot、多工具規劃、權限機制、惡意 metadata、寫入副作用、真實網路可用性、P95/P99 latency 或 SLA 評估。
- **Bloss0m 工程判斷**：模型的「選對工具」需拆成 retrieval recall、schema compatibility、授權、invocation success 與 task success。top-1 不是純粹的向量搜尋參數，而是一項風險政策。

## 論文到底在解什麼問題？

令工具 registry 為 $M=\{m_1,\ldots,m_N\}$，使用者任務為 $q$。傳統 all-tools client 將許多、甚至所有 $m_i$ 的描述放入 executor prompt；模型必須同時找工具、理解 schema、產生正確呼叫。$N$ 增加時，token 變多，語意相近的工具描述也變成 distractor。Section 3.1 以 needle-in-a-haystack 式設計描述此問題：一個能完成 WebSearch 任務的 ground-truth MCP，加上 $N-1$ 個干擾項。

RAG-MCP 改以外部索引上的路由函數 $r(q,M)$ 做選擇，且在報告的執行條件下最後只注入 top-1 schema。若把端到端成功拆開，工程上可寫成：

$$
P(\text{有用結果})=P(\text{取回正確工具})\times P(\text{schema/call 有效}\mid\text{已取回})\times P(\text{工具成功})\times P(\text{答案正確}).
$$

這不是論文已量測出的等式，而是理解風險的分解：第一段的 top-1 recall 成為後續所有階段的上限。它也點出論文未處理的 abstention：系統應可在證據不足時拒絕路由、要求釐清或 fallback，而非硬把每個 query 指派給一個 server。

## 機制：索引、query 與執行如何相接

Section 3.2 有三步。第一步，將 MCP metadata 建成外部 vector index。論文稱 retriever 為 lightweight LLM-based，並以 Qwen 為例；但它沒有文件化 metadata 包含哪些欄位、embedding model/version、chunking、similarity function、index 類型、更新策略，或報告條件的 top-k。這些不是小細節：server 名稱、自然語言描述、tool 名稱、參數 schema、範例與 permission 對檢索的意義並不相同。

第二步，編碼使用者任務，從索引取 semantic top-k MCP。論文說每個候選**可以**生成 few-shot test query，並測試回應作為 compatibility sanity check。這是值得保留的分層想法，但文中沒有 validation pass rate、false accept/false reject、驗證成本，也未說明 synthetic test 如何避免呼叫有副作用的工具。Figure 2 是流程圖，不是一份可直接上線的 operational contract。

第三步，只把選定 MCP 的描述與 tool-use parameters 放進 LLM prompt 或 function-calling API，模型再規劃與執行。這正是節省 context 的核心：讓 executor 不必做全域 discovery。但它沒有證明模型能處理 required/optional 欄位、authentication、capability negotiation、pagination、retry、schema version 或 server deprecation。整合時應以 [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18) 為準；論文不是協定規格。

> **花花的工程筆記**
>
> 把 retriever 當作不可信任的 candidate generator。取回後，仍要先核對不可變的 schema version 與 permission policy，才讓模型形成呼叫；「描述很相關」不等於「被授權可呼叫」。

## 實驗協定：哪些細節有用，哪些仍缺

Section 4.1 是壓力診斷，不是自然發生的 agent 流量樣本。每個點有一個 ground-truth MCP，和從超過 4,400 個公開列出的 server 抽出的 $N-1$ distractor；$N$ 由 1 至 11,100，共 26 個 interval。候選數高於文中 registry 數量這件事需謹慎解讀：論文描述了 candidate-pool construction，但沒有公開精確清單、重複/位置安排方式或 server snapshot。每種設定以 20 個 web-search task 要求系統選工具、送出 valid query 或 answer，再回傳最終結果（Section 4.1）。

Section 4.2 指定 MCPBench 的 web-search subset 為 held-out testbed。每個 baseline 跑 20 個 independent trial；多於 10 個正確答案才視為 baseline 成功；每個 trial 最多與 MCP server 互動 10 round。base LLM 是 qwen-max-0125。設定段落寫 DeepSeek-V3 為自動 evaluator，但 metrics 段落又說 final answer 由 Llama-based judge 判定。這種紀錄不一致本身就是 reproducibility gap：judge model、prompt、threshold 與輸出格式都會改變結果。

三個 baseline 的比較範圍很清楚。**Blank Conditioning** 將所有 $N$ 個描述放入 prompt。**Actual Match** 先以 task 與 metadata 的簡單 keyword matching 縮小池，再交模型。**RAG-MCP** 對所有 $N$ 個候選做 semantic ranking，只注入 top candidate schema。報告的 metric 僅有：(1) 取到 ground-truth MCP 的 accuracy、(2) 含 metadata 的平均 prompt token、(3) 平均 completion token。沒有價格、retrieval/validation latency、server latency 分布、confidence calibration、top-k recall 或 tool-execution error rate。

## Table 1 支持什麼，又沒有支持什麼

[Table 1](https://arxiv.org/html/2505.03275v1#S4.T1) 的數字如下：

| 條件 | Accuracy | 平均 prompt token | 平均 completion token |
| --- | ---: | ---: | ---: |
| RAG-MCP | 43.13% | 1,084.00 | 78.14 |
| Actual Match | 18.20% | 1,646.00 | 23.60 |
| Blank | 13.62% | 2,133.84 | 162.25 |

在這個 web-search 協定中，該 semantic top-1 routing 確實勝過兩個比較條件。相對 Blank，prompt token 約少 49%，因此摘要中「over 50%」不應被當作 Table 1 的精確算式。RAG-MCP 的 completion token 又**高於** Actual Match；少 prompt token 不等於總 token 較少，更不等於端到端延遲較低。query embedding、vector search、可選 validation 和 server execution 都不在兩欄 generation token 裡。

更關鍵的是 top-1 的天花板：正確 server 若排第二，executor 不會有機會修正。真正能支援選型的報告應分別給 recall@k、second-stage ranker 的 accuracy，以及增加 k 是否值得多出 schema/context 和安全檢查成本。Table 1 無法回答這個問題。

## 規模退化，是最可採取行動的結果

[Figure 3 與 Section 5](https://arxiv.org/html/2505.03275v1#S5) 依 MCP position 畫出成功與失敗。作者描述 position 小於 30 時大多成功；31–100 開始間歇性失敗；約 100 之後紫色失敗區主導，但大池仍偶有成功島。作者把模式歸因於 semantic overlap 增加、retrieval precision 與 throughput 在數千工具時降低，並提出 hierarchical/adaptive retrieval 作為未來方向。

這不是有 confidence interval 的平滑曲線，也沒有隔離失敗到底來自 index、embedding、query wording、candidate placement、metadata 品質或 executor。但它已足以否定「用了 retrieval 就能無限擴大工具池」的閱讀。數千候選中，最容易混淆的往往是最重要的差別：read vs. write、production vs. sandbox、相同 API 的不同 tenant，或同能力的不同版本。

實務上可做 routing funnel：先以 tenant、capability、data class、allowed side effect 做 lexical/structured eligibility filter；再 semantic candidate generation；接著 deterministic schema/version filter；最後才讓模型或 learned ranker 在已授權候選內排序。先量 eligible ground truth 的 recall，再評估 generation。這是 Bloss0m 的工程建議，非 RAG-MCP 已測試組件。

## 失敗、成本與外推限制

Section 4.2 明說 controlled network 會避免連線失敗。這讓策略比較較乾淨，卻排除了 production 中常見的問題：expired credential、rate limit、server unavailable、timeout、protocol version 不相容、schema 已變，或只回傳 partial result。論文測的是偏 read-only 的 web search，未建立多工具工作流；一個早期錯誤 read 如何污染後續 write，並不在證據範圍。

metadata 也是未量測的品質與攻擊面。惡意或過度冗長描述可能在 semantic search 中勝出；良性但描述不足的 server 可能落榜。文中沒有 adversarial schema、prompt injection、duplicate server、permission confusion 或 cross-tenant 測試，亦沒有 calibration：43.13% accuracy 不表示系統知道自己何時錯。

成本應以每次決策拆帳：embedding/query encoding + vector search + 可選 validation call + executor input/output + tool call + retry/fallback。延遲也要看分段與 tail；median vector search 很快，不能抵銷 slow validator 或 server cold start。Table 1 可說明 token 壓力，不能拿來做 capacity plan。

## Artifact 與可重現狀態（核對日期：2026-08-09）

[arXiv record](https://arxiv.org/abs/2505.03275) 與 [HTML/PDF 全文](https://arxiv.org/html/2505.03275v1) 為 **accessible**。record/paper 未提供第一方 GitHub、model checkpoint、直接資料下載、registry snapshot 或可執行 RAG-MCP endpoint。因此，作者 implementation、11,100 候選建構、retriever 設定、prompts、validator/judge 設定和完整 benchmark harness，在此日期均標為 **missing/unavailable**。

Acknowledgements 提到早期的「Evaluation Report on MCP Servers」提供公開 framework 與 WebSearch data，但這不是 version-pinned 的 RAG-MCP artifact。引用的報告為 [arXiv:2504.11094](https://arxiv.org/abs/2504.11094)。公開 MCP directory 可以協助建立**新的**實驗，卻無法重建作者的 server snapshot、controlled network、candidate ordering 或 prompts；把本文稱為 one-command reproducible 並不準確。

## 工程採用決策表

| 情境 | 建議決策 | 原因 |
| --- | --- | --- |
| 數十個穩定、read-only 工具，schema context 已昂貴 | 以 shadow mode 試行 retrieved discovery | 最接近論文情境，且可與既有路由對照。 |
| 大 registry 但有 tenant、capability、permission 約束 | 先 deterministic filter，再 semantic retrieval | similarity 不應跨越授權邊界。 |
| 金流、刪除、系統管理等高風險 write | 不可讓 top-1 RAG routing 當唯一 gate | 論文沒有副作用或安全證據。 |
| 工具少且差異清楚 | 保留 explicit/deterministic routing | 多一段檢索失敗，未必有收益。 |
| schema 快速變動、ownership 薄弱 | 先建立 versioning 與 contract test | 文中未評估 schema drift。 |
| 使用者意圖不明 | 釐清或 abstain/fallback | 強制 top-1 會把不確定性變成呼叫。 |

若要 pilot，index record 至少帶 tool name、description、input/output schema、server identity、capability tag、permission class、deprecation state 和 schema hash。log candidate ID/score、eligible ground-truth rank、validation result、授權拒絕、呼叫結果、token、retrieval/validation/execution latency 及可人工稽核的 failure label。先做可逆 read-only 流量；只有在 top-k recall、calibration 和 tail behavior 都達預先設定門檻後才擴大，不要只看 final-answer accuracy。

## 延伸閱讀

RAG-MCP 處理 agent 的**工具發現**。若你關心另一種持久化問題——如何將成功的 retrieval 經驗寫回 index——可接著讀 [RAG without Forgetting](/paper-reading/05-RAG-without-Forgetting/)。兩篇共同的教訓是：retrieved candidate 不是系統的最終決策；routing 與 memory update 都需要可觀測 gate 與 rollback boundary。

## Primary Sources

- [Gan & Sun 的 RAG-MCP arXiv record](https://arxiv.org/abs/2505.03275) 與 [全文](https://arxiv.org/html/2505.03275v1)：Sections 3–5、Figure 2、Figure 3、Table 1；本文為 2025 arXiv v1 preprint。
- [Evaluation Report on MCP Servers](https://arxiv.org/abs/2504.11094)：RAG-MCP acknowledgements 引用的前作，不等同作者的 release。
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2025-06-18)：獨立核對的現行整合與安全參考。
