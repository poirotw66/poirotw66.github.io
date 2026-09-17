---
title: "Redpanda Agentic Data Plane v0.2.61：把憑證、Context 與寫入權限推到 Agent 邊界"
description: "整理 Redpanda Agentic Data Plane v0.2.61／v0.2.60 的 credential passthrough、context estimate、activity filtering 與 Pylon capability gates，並回看 v0.2.58 的 audit semantics。"
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "v0.2.60 讓 OpenAI 與相容 provider 使用 caller-supplied Authorization passthrough，ADP 不保存 caller API key；這仍不是對所有 log、proxy、provider 或 client path 的秘密外洩保證。"
  - "Agent inspector 把 context usage 標成 estimate，另外顯示 model input／output limits；estimate、reported token 與 cost sorting 的資料範圍不能混成一個數字。"
  - "v0.2.61 將 Pylon ticket update 的 allow_writes，和 customer reply 所需的 allow_writes + allow_customer_replies 拆開，形成更清楚的 capability gate。"
  - "activity filtering／sorting 擴大到所有符合條件的 requests，但 cost sorting 仍只涵蓋已載入的 requests；v0.2.58 audit semantics 也要分開理解 policy decision、MCP session 與實際 call。"
audience:
  - "負責 agent runtime、data plane、MCP tool governance 或 model gateway 的平台工程師"
  - "需要把 credential custody、context accounting、external writes 與 audit trail 寫成 policy contract 的 SRE 與安全團隊"
category: "Cloud & Platform"
tags: ["AI Agent", "Enterprise AI", "Platform Engineering", "Governance", "Cloud Native"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 14
kind: "article"
showToc: true
image: "/blog/105-redpanda-agentic-data-plane-v0261/title_image.webp"
---

Agent data plane 的風險，常常不在模型回答本身，而在「誰的 credential 被帶進哪個 provider」、「context 數字到底是估算還是 billing fact」、「哪一種 tool call 可以改動外部世界」，以及 incident review 時 audit log 到底記了什麼。Redpanda Agentic Data Plane（ADP）在 2026-09-15 的 v0.2.60 與 2026-09-16 的 v0.2.61 release notes，剛好把這四個邊界一起推到產品表面。

這次更新值得讀，不是因為 release note 已經證明所有 control 都安全，而是因為它把幾個容易被混稱的概念拆開：caller credential passthrough 不等於 ADP 代管 API key；context estimate 不等於 provider 回報的 token count；Pylon 的 write capability 不等於 read permission；activity filtering 覆蓋 all requests 不等於 cost sorting 已經涵蓋全歷史。若把它們混成一個「Agent observability」指標，平台會在最需要回答問題時失去語意。

> **花花的判斷**
>
> Agent data plane 的成熟度，不是看 dashboard 有多少圖，而是看 credential、context、capability 與 audit event 能不能各自說清楚 owner、scope、source、time range 與 failure semantics。

## 先看版本差異

| 版本 | Release-note 變更 | 工程上要重新確認的邊界 |
| --- | --- | --- |
| v0.2.61（2026-09-16） | Pylon filters／date／team／states／tags／get_custom_fields；ticket update 需要 allow_writes；customer reply 需要 allow_writes 與 allow_customer_replies；connection errors 說明 missing／disabled；issue pagination／date interval ≤365 天／attachments；model selector 加入 GPT-6 Astra；cost comparison UI | tool capability 是否真的進入 policy／audit；reply 是否和 ticket update 分離；filter、pagination 與 cost view 是否擁有相同資料範圍 |
| v0.2.60（2026-09-15） | OpenAI 與 compatible provider 的 Authorization passthrough；caller 可帶 credentials，ADP 不保存 API key；agent inspector 顯示 context estimate 與 model input／output limits；activity filtering／sorting 擴大到所有 requests | caller credential 的 redaction、proxy、trace、retry、provider retention；estimate 與 reported tokens 的分界；cost sorting 仍只涵蓋 loaded requests |
| v0.2.59（2026-09-14） | Release page 的前一個版本 context | 不要把 v0.2.61 的 capability gate 反推到較舊 build，需固定實際 deployment version |
| v0.2.58（2026-09-07） | audit semantics：policy 依 eval order 列出，outcome 分為 Denied／Masked／Allowed；MCP session 的 opening／keeping 除非被拒絕，否則不另作拒絕事件；calls made 仍記錄 | session lifecycle、policy outcome、tool／LLM／agent call 要分欄；不同版本的歷史紀錄不要直接當成同一種 event |

這張表的第一個提醒是版本語意。v0.2.61 的 Pylon capability 不是單純 UI checkbox，而是與外部副作用直接相關的 policy input；v0.2.60 的 passthrough 也不是「所有 provider secret 都不會落地」的廣泛保證。部署前要把 release-note statement、實際 build、配置、proxy path 與 log sink 對在一起。

## Credential passthrough：caller 帶來的 secret，責任沒有消失

v0.2.60 的核心變更是 OpenAI 與相容 provider 可以使用 Authorization passthrough。caller 提供 credential，ADP 不保存 caller 的 API key。這個 boundary 比「平台集中保存所有 provider key」更清楚，但它不自動回答以下問題：

- credential 從 client 到 ADP、model provider、retry queue、trace exporter 與 error response 經過哪些 hop？
- ADP 是否在 request object、debug log、HTTP header capture、span attribute、support bundle 或 cache 中保留原始 Authorization？
- passthrough credential 是否會因為 retry、stream reconnect、fallback provider 或 async job 被複製？
- provider 是否會保存 request header、prompt、metadata 或 usage record？caller 是否知道 retention？
- policy 如何區分「這個 caller 有權使用某一顆 key」和「這個 agent task 可以把 key 帶到這個 provider」？

所以「ADP 不保存 API key」應該被記成一條 scope 明確的 product fact：**在 ADP 宣稱的 storage boundary 內，caller-supplied API key 不被保存。** 它不是對 client、network、provider、observability pipeline 或第三方 integration 的全面 non-retention guarantee。平台仍要做 header redaction、structured logging review、trace sampling policy、error scrubbing、secret rotation 與 negative test。

我會把 passthrough request 的最小 audit record 寫成：

| 欄位 | 應記什麼 | 不應記什麼 |
| --- | --- | --- |
| caller identity | tenant、workload、request principal、credential owner type | raw API key |
| provider routing | provider、model、endpoint class、policy decision | Authorization header |
| credential provenance | caller-supplied、vault reference、short-lived token、expiry class | secret material |
| execution | request ID、retry count、fallback、latency、response status | 未清洗的 provider error body |
| retention | trace／log TTL、redaction version、deletion state | 用「未保存」掩蓋下游 retention |

這個 schema 是工程建議，不是 Redpanda release note 宣稱的完整 audit format。它的作用是保留 product fact 與 local control 的邊界，避免日後把「ADP 不存」誤寫成「整條呼叫鏈不存」。

## Context accounting：estimate、reported tokens 與 limits 是三種數字

v0.2.60 的 agent inspector 顯示 context estimates，並另外呈現 model input／output limits。這個設計很有用，因為 agent runtime 常在 request 送出前只能知道「大約會佔多少 context」，而 provider 回來的 usage 才是另一個事實來源。

至少要分成三種欄位：

1. **Estimated context**：由 ADP 依目前可見的 message、tool schema、retrieved data 或 payload 估算；它可能受 tokenizer、hidden prompt、serialization 與 provider 差異影響。
2. **Reported input／output tokens**：provider response 或 usage event 回傳的實際計費／統計數字；它不一定涵蓋 ADP 在 request assembly 前後的所有 bytes。
3. **Model limits**：provider 或 model metadata 宣告的 input／output capacity；它是 constraint，不是本次 request 已使用量。

若 dashboard 把三者合成一個 context bar，operator 會無法回答「為什麼 estimate 沒超過 limit 卻被 provider 拒絕」或「為什麼 reported tokens 和 internal payload 不一致」。正確的 UI 應該標示 source、timestamp、model version、tokenizer／estimator version、request scope 與 confidence／unknown state。

### Context estimate 的 failure modes

- tool schema 在 runtime 才展開，estimate 沒包含完整 schema；
- retrieval result 在最後一刻被 rerank、截斷或壓縮；
- provider 使用不同 tokenizer，internal estimate 與 reported token 不可直接相減；
- hidden system instruction、safety wrapper 或 gateway metadata 沒有進入 caller-visible payload；
- streaming、retry、fallback 把一次 user request 拆成多個 provider request；
- model input／output limits 更新，但 inspector cache 尚未更新。

因此，estimate 適合做 preflight、warning、route 或 budget hint；不應被當成 billing source、compliance evidence 或「一定能成功」的決策依據。若要以 context limit 擋住 request，policy 應保存 limit source、evaluation time 與 override reason。

## Activity filtering：看得到全部 request，不等於成本已涵蓋全部

v0.2.60 改善 activity filter 與 sorting，涵蓋所有 requests，而不只目前 UI loaded 的那一頁。這對 incident response 很重要：operator 可以依 status、time、tokens、latency 等條件查完整 request population，不會因為 virtualized table 尚未載入某一頁而把它當成不存在。

但 release notes 同時保留一個關鍵限制：**cost sorting 仍只涵蓋 loaded requests。** 這意味著 filter／sort 的資料範圍不是一致的：

| View | 資料範圍 | 適合的問題 | 不適合的問題 |
| --- | --- | --- | --- |
| Status／time／tokens／latency activity filter | 所有符合條件的 requests | 找到某段時間的 timeout、high latency、token outlier | 直接當成完整 cost ranking |
| Cost sorting | 已載入 requests | 目前 loaded result 的成本比較 | 宣稱全歷史最貴 request |
| Context estimate | 估算輸入／輸出邊界 | preflight、容量警告、debug | 取代 provider usage 或 invoice |
| Provider reported usage | provider 回報的 request usage | billing／usage reconciliation | 推論 ADP 內部所有 bytes |

這個差異也會影響產品文件。若 UI label 只寫「sort by cost」，使用者很容易以為它會掃過所有 requests；更準確的命名應該揭露 loaded scope、query window、pagination 與 data freshness。若產品日後把 cost sorting 擴到全量，仍要保留從 estimate、reported usage 到 cost calculation 的 lineage。

## Pylon capability gates：讀、改 ticket、回覆 customer 不是同一個權限

v0.2.61 對 Pylon integration 的重要變更，是把外部寫入動作拆成明確 flags：

- ticket updates 需要 allow_writes；
- customer replies 需要 allow_writes 加上 allow_customer_replies；
- connection errors 會說明 credential missing 或 connection disabled；
- filtering 可以依 date、team、states、tags 與 get_custom_fields；
- issue pagination、date interval 最長 365 天、attachments 等操作語意更明確。

這個設計值得採用的地方，是它沒有把「可以讀 Pylon」和「可以對 customer 發言」放在一個 all-or-nothing permission 裡。Customer reply 是更強的 external side effect：它可能觸發通知、承諾 SLA、造成法律／合約語意或留下不可逆的對外溝通紀錄。即使 agent 有 ticket update 權限，也不應默認擁有 reply 權限。

我會把 Pylon policy 寫成 capability matrix：

| Action | Read connection | allow_writes | allow_customer_replies | 建議的額外控制 |
| --- | --- | --- | --- | --- |
| List／search tickets | 需要 | 不需要 | 不需要 | tenant／team／field scope |
| Update internal ticket field | 需要 | 需要 | 不需要 | field allow-list、before／after diff |
| Add internal note | 需要 | 需要 | 不需要 | author identity、redaction、idempotency |
| Reply to customer | 需要 | 需要 | 需要 | human approval、message preview、send audit |
| Bulk update | 需要 | 需要 | 不需要 | max batch、dry run、rollback／rate limit |

這張 matrix 是 Bloss0m 的工程化整理，不是 release note 的完整 policy specification。重點是每個 action 都要把 caller、agent、tenant、target ticket、requested capability、policy result、approval、before／after、provider response 與 retry state 寫進 audit event。單一 allow_writes flag 如果沒有 target scope 與 payload diff，仍可能太粗。

## Audit semantics：policy decision、session 與 call 要分開

既有 brief 指向同一頁 release notes 的 v0.2.58 audit semantics，這段不能被 v0.2.61 的 UI update 蓋過去。v0.2.58 的描述重點包括：

1. policy 會依 evaluation order 列出每一條被評估的 policy；
2. 每個結果以 Denied、Masked 或 Allowed 表示；
3. opening 或 keeping an MCP session，除非該動作被拒絕，否則不會被當成獨立的拒絕事件；
4. log reads calls made，讓 operator 看到實際發出的 MCP／LLM／agent calls。

這裡有一個很容易踩到的語意陷阱：session 建立成功，不代表所有後續 tool call 都 Allowed；policy decision 出現，也不代表 external effect 一定發生。至少要將 event type 分成：

| Event layer | 例子 | 可以回答什麼 |
| --- | --- | --- |
| Session lifecycle | MCP session opened、kept alive、refused | channel 是否建立、是否被 policy 阻擋 |
| Policy evaluation | policy name、order、Denied／Masked／Allowed | 哪條規則對哪個 input 做了什麼 |
| Call execution | MCP／LLM／agent call、latency、response | 哪一個 call 真的送出、回傳什麼 |
| External effect | Pylon update、customer reply、provider side effect | 世界狀態是否真的改變 |

若把這四層壓成一個「request succeeded」，incident responder 會分不出 Masked input、Denied call、Allowed but provider failure、Allowed and external write，以及 session keepalive。反過來，若只記 policy decision、不記 calls made，也無法確認哪一個 allowed request 實際造成後續 action。

### 版本差異與歷史 audit

release notes 中較早的 v0.2.56 語意可作為歷史背景：每一個 MCP、LLM、agent call 的紀錄範圍、denied calls、search、CSV／JSONL export 與不 backfill 的行為，不能直接與 v0.2.58 的 session／policy semantics 混為一談。做 migration 時要先對照實際 build 的 event schema、retention、query scope 與 backfill policy，再談跨版本的 trend line。

## 四個 boundary 串起來：一個 request 應該怎麼被解釋？

假設一個 agent 收到「讀取 Pylon ticket，更新內部 priority，並回覆 customer」：

1. **Credential boundary**：caller 以 passthrough credential 呼叫 provider；ADP 不保存 API key，但 log／trace／provider retention 仍要獨立檢查。
2. **Context boundary**：agent inspector 估算目前 prompt、tool schema 與 ticket payload；它顯示 estimate，不冒充 provider reported tokens。
3. **Capability boundary**：read ticket 不需要 writes；更新 priority 需要 allow_writes；customer reply 再需要 allow_customer_replies。
4. **Audit boundary**：policy event 先記 evaluation order 與 outcome；call event 記實際 request；external-effect event 記 Pylon 的 before／after 或 provider reference。
5. **Recovery boundary**：若 reply 失敗但 update 成功，retry 不能假設兩者是 atomic；要依 idempotency、effect reference 與 operator policy 做 compensation 或人工處理。

這個 example 的核心，是不要把四種「成功」混成一種：credential accepted、context within limit、policy Allowed、provider call returned 200、external state committed，分別是不同 fact。ADP release notes 提供了幾個產品控制點，但企業仍需把它們接成自己的 data contract。

## 什麼是 release note 明確說的，什麼還沒有被證明？

| 類別 | 官方 release notes 支持的說法 | 本文不會過度延伸的地方 |
| --- | --- | --- |
| Credential | v0.2.60 支援 OpenAI／compatible provider Authorization passthrough，caller API key 不由 ADP 保存 | 不宣稱 client、proxy、provider、trace、error path 都不保存或不洩漏 |
| Context | inspector 顯示 estimate，並分開呈現 model input／output limits | 不把 estimate 當 billing truth、完整 byte count 或成功保證 |
| Activity | filter／sort 涵蓋所有 requests 的狀態、時間、tokens、latency；cost sorting 仍針對 loaded requests | 不宣稱 cost view 已涵蓋全歷史或所有 pagination |
| Pylon | ticket update 需要 allow_writes；customer reply 需要兩個 flags | 不宣稱 flags 本身已完成 tenant scope、approval、rollback 或 payload redaction |
| Audit | v0.2.58 有 policy evaluation order、Denied／Masked／Allowed 與 calls-made semantics | 不宣稱跨版本 event 可直接比較、所有 effect 都可由單一 event 重建 |

Vendor release notes 是很好的 implementation source，但不是獨立 assurance report。採用前仍要做 secret redaction test、credential replay test、permission bypass test、context estimate calibration、full-history query test、Pylon negative test、audit export／retention test 與 incident drill。

## 與 Bloss0m 既有文章的連結

想先建立 agent permission 的基本 vocabulary，可以讀[AI agent guide](/blog/64-ai-agent-guide/)。[GitHub MCP enterprise controls](/blog/87-github-mcp-enterprise-controls/) 適合對照 tool permission、credential boundary 與 audit。若你在設計一個跨 provider 的平台 contract，[Agentic AI platform contract](/blog/93-agentic-ai-platform-contract/) 會把 schema、policy 與 observability 再往上抽象；[Unified Knowledge Graph RAG](/blog/101-unified-knowledge-graph-rag/) 則提供另一個 context lineage 與 evidence accounting 的比較面。

## 原文出處與核對範圍

- [Redpanda Agentic Data Plane release notes](https://docs.redpanda.com/agentic-data-plane/reference/release-notes/)

我以 2026-09-17 為核對日，閱讀 canonical release-notes page 上的 v0.2.61、v0.2.60、v0.2.59 與 v0.2.58 entries，並把 v0.2.56 只當作歷史 audit context。本文保留版本、scope 與 loaded／all requests 的資料範圍，不把 vendor-authored release note 改寫成獨立的 security、accuracy、latency、retention 或 production-reliability 證明。
