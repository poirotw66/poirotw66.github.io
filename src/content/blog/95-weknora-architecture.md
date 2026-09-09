---
title: "WeKnora 架構解析：從文件入庫到可治理的 Agent 知識平台"
description: "拆解 Tencent WeKnora 的三進程核心、文件解析與檢索資料流，並說明 Agent、MCP、sandbox、memory 與企業治理如何接在同一個控制面。"
pubDate: 2026-09-08
updatedDate: 2026-09-08
tldr:
  - "WeKnora 不只是向量搜尋加 LLM，而是把文件處理、Hybrid Retrieval、Agent 執行與治理放進同一個可自架平台。"
  - "核心是 Go app、Vue3 frontend、Python docreader 三進程，加上 PostgreSQL／ParadeDB 與 Redis；圖譜、獨立向量庫、Web Search 與 Langfuse 可按 profile 啟用。"
  - "文件入庫走 202 + Asynq + gRPC 的非同步管線，回答走 query understanding → parallel retrieval → rerank → SSE；兩條路徑的失敗與 SLO 不能混在一起看。"
  - "Agent 的價值不只在 ReAct：MCP OAuth、沙盒 Skills、長期記憶、RBAC、audit 與 worker governance 才決定它能不能進企業環境。"
audience:
  - "評估自架 RAG／Agent 知識平台的架構與平台工程師"
  - "需要把 MCP、文件解析、權限與觀測接進企業 AI 的技術負責人"
category: "AI Engineering"
tags: ["RAG", "AI Agent", "MCP", "Platform Engineering", "Enterprise AI"]
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 20
kind: guide
showToc: true
wideHeader: true
guideVersion: "2026.09"
image: "/blog/95-weknora-architecture/title_image.webp"
---
如果把企業 AI 想成一間知識工廠，最難的通常不是把 LLM 接上聊天窗，而是讓文件進得來、證據找得到、工具叫得動，還要知道每次回答為什麼這樣走。**WeKnora** 值得拆解的地方，正是它沒有把自己停在一個 RAG demo：官方定位是開源的 LLM knowledge platform，往上支援 RAG、自治推理 Agent、可維護 Wiki 與 MCP，往下則把解析、切塊、索引、佇列、權限與觀測做成一個可以自架的系統。

本文以 Tencent/WeKnora 官方 repository、官方架構文件與 `v0.8.0` changelog 為基準，整理截至 **2026-09-08** 可核對的架構。這不是對原始碼每一行的 code review；我會先說明官方明確寫出的事實，再標出從元件邊界推導出的工程判斷。若你要先補 RAG 的基本詞彙，可搭配閱讀 [Enterprise RAG 完整指南](/blog/65-enterprise-rag-guide/)；若要先建立 Agent 控制面語言，則看 [AI Agent 完整指南](/blog/64-ai-agent-guide/)。

> **花花的一句話**
>
> WeKnora 的核心不是「哪個模型回答最好」，而是把知識生命週期與 Agent 行動生命週期接到同一個可追蹤控制面。

![WeKnora 的元件與端到端資料流：文件經解析、切塊與索引後，進入可治理的 RAG／Agent／MCP 執行路徑。](/blog/95-weknora-architecture/weknora-architecture.svg)

## 九十秒看懂這個系統

先把官方架構濃縮成一張表。這裡的「核心」指標準 Docker Compose 預設會啟動的路徑；知識圖譜、獨立向量庫、聯網搜尋、物件儲存與 Langfuse 是可選能力，不應一開始就當成所有部署都必須存在。

| 層 | 官方元件 | 在系統裡負責什麼 | 不能偷換成什麼 |
| --- | --- | --- | --- |
| 入口 | Vue3 Web、CLI／Go SDK、MCP client、IM／Embed | 把使用者、整合程式與訊息渠道送進平台 | 不是每個 client 都直接碰資料庫 |
| 核心控制面 | Go `app`、Gin REST、SSE、Agent engine、Asynq worker | 驗證、路由、聊天、工作排程與模型／工具協調 | 不是單一 prompt 包辦全部決策 |
| 文件邊界 | Python `docreader`、gRPC、25+ parser | 把 PDF、DOCX、Excel、EPUB、網頁等轉成可處理內容與頁面圖片 | 不是把檔案直接丟進 embedding |
| 證據層 | PostgreSQL／ParadeDB、BM25、pgvector、reranker | 儲存知識、混合檢索、上下文與引用 | 不是 top-k 越大就越可靠 |
| 執行層 | ReAct Agent、MCP、Web Search、sandbox Skills、memory | 在證據與政策邊界內採取多步行動 | 不是把每一個 API 都給模型自由呼叫 |
| 控制與觀測 | JWT／API key／OIDC、RBAC、audit、Redis、OpenTelemetry／Langfuse | 管理身分、任務、流式回應、限制與回放 | 不是事後看最終答案才算可觀測 |

這個切法揭示一個重要設計：**WeKnora 同時有一條資料面（knowledge data plane）與一條行動面（agent action plane），但兩者共享 Go app 的控制面。** 文件解析和 Agent 執行不必是同一種工作負載，卻可以共用租戶、權限、模型設定與追蹤語境。

## 一、核心拓樸：三個進程，一個控制面

官方架構文件把預設部署描述成「主服務 + 前端 + 文件解析微服務」三進程，再加 PostgreSQL 與 Redis。這個選擇看起來樸素，卻很有工程意味：先讓最常變動、依賴最雜的解析器與主服務分離；資料與佇列則以穩定的基礎設施提供共享狀態。

### `frontend`：入口與反向代理

Vue3 前端由 NGINX 提供靜態檔案，並把 `/api` 反向代理到 `app`。瀏覽器聊天走 HTTP／SSE，前端不需要知道 Agent 引擎、PostgreSQL 或 docreader 的內部位置。官方文件也指出 `APP_HOST`、`APP_BACKEND_PORT` 與 `APP_SCHEME` 可讓前端把 API 指向遠端後端，這讓 UI 與核心服務可以分開部署。

### `app`：真正的主控制面

Go `app` 在預設架構中承擔 REST API、RAG 檢索、Agent engine、異步 task worker，以及 IM／Embed 渠道接入。這不是「只有 API 的薄殼」：驗證、RBAC、知識服務、聊天 pipeline、SSE stream manager、MCP／sandbox 與任務協調都在這個邊界內。

把它稱為 Go monolith 不等於負面評價。對自架平台而言，一個有清楚 internal package 邊界的核心服務，可以避免早期把每個領域拆成需要獨立部署、版本與觀測的微服務；真正關鍵是能不能把 handler、service、repository、agent、mcp、sandbox、stream 與 middleware 分開測試和替換。

### `docreader`：把解析依賴隔離出去

Python docreader 以 gRPC 提供解析服務，官方架構頁列出 PDF、DOCX、Excel、EPUB、網頁等 25+ 格式與頁面渲染能力。`app` 透過 `ReadStream` 傳遞檔案位元組或 URL，解析結果回到 worker；圖片與解析產物還可透過 `docreader-tmp` 共享卷交換。

這個邊界處理的是一個常見的現實：文件解析會牽涉 OCR、office parser、網頁處理與原生函式庫，依賴風險和主服務的 API／權限邏輯不同。把它隔離，並不會自動讓解析正確，但至少能把 parser crash、資源限制與版本升級放在更容易治理的故障域。

### PostgreSQL／ParadeDB 與 Redis：不是「附屬服務」

預設資料庫使用 ParadeDB PostgreSQL，官方文件特別指出它同時提供 BM25 全文檢索與 pgvector 向量能力，因此 `RETRIEVE_DRIVER=postgres` 時不必另外啟動一個向量資料庫。Redis 則不只做 cache：它承擔 Asynq 任務佇列、跨實例 SSE stream 管理、system settings Pub/Sub、限流與 per-model concurrency gate。

換句話說，Redis 的故障可能同時影響「文件是否繼續處理」與「聊天串流能否續傳」；這兩種 SLO 應在正式部署中分開監控。資料庫也不只存最後答案，而是存知識、chunk、摘要、問題、實體與各階段狀態。

> **花花的工程提醒**
>
> 「單一核心服務」不代表「單一故障模式」。WeKnora 把解析、查詢、佇列、流管理與工具執行放在同一個產品裡，部署時要按工作負載拆 CPU、記憶體、重試與告警，而不是只看容器數量。

## 二、文件入庫：從 `202` 到可引用證據

WeKnora 最值得看的不是「支援多少格式」，而是它把上傳視為一筆有生命週期的知識工作，而不是一次同步函式呼叫。官方架構文件提供了一條相當具體的 upload flow：

1. **入口驗證。** 瀏覽器對 `/api/v1/knowledge-bases/:id/knowledge/file` 發出請求；請求先經 Request ID、Auth、API key gate 與 RBAC，確認呼叫者可操作該 Knowledge Base。
2. **先寫入 pending。** `KnowledgeService` 建立 knowledge row，把檔案落到本地或物件儲存，狀態標為 `parse_status=pending`。
3. **立即回應工作 ID。** API 回 `202` 與 `knowledge_id`，前端以輪詢或進度訂閱取得狀態。這是非同步契約：上傳成功不等於文件已可搜尋。
4. **排入 Asynq。** `TypeDocumentProcess` 進入 Redis 佇列，由 app 內的 core worker pool 消費。重試、並行數與佇列隔離因此比「一個 request 開一個 goroutine」更容易治理。
5. **gRPC 解析。** worker 透過 gRPC `ReadStream` 把檔案位元組或 URL 送給 docreader，拿回 Markdown、圖片、OCR 與頁面渲染結果。
6. **建立 chunk。** worker 按 parent-child 或 heading 策略分塊，保留標題、頁面、來源與結構 metadata。這一步決定後面引用能不能回到原件語境。
7. **批次 embedding 與雙索引。** BatchEmbedder 受 per-model concurrency gate 約束，產生向量後寫入向量索引，同時建立 BM25 關鍵字索引；兩者不是互斥的產品選項，而是同一條 Hybrid Retrieval 的不同訊號。
8. **富化與完成。** 摘要、問題與 graph 等 enrichment 子任務再入佇列；worker 回寫摘要／問題／實體，待 `PendingSubtasksCount` 歸零後才把 `parse_status` 更新為 `completed`。

這條管線把「文件已上傳」「已解析」「已建立索引」「已完成富化」拆成不同狀態。對使用者來說，這可能多一點等待；對平台來說，卻能回答「到底卡在 parser、embedding、索引還是 enrichment？」

| 失敗位置 | 看得到的症狀 | 第一個該查的證據 | 不要先做的事 |
| --- | --- | --- | --- |
| 身分／Knowledge Base 權限 | 上傳被拒絕或跨租戶看不到 | auth、RBAC 與 resource ownership trace | 不要把 ACL 關掉重試 |
| 解析器 | `pending` 長時間不動、缺頁面或圖片 | docreader gRPC log、格式與檔案大小 | 不要先調大 LLM context |
| 任務佇列 | API 回 202 但 worker 沒消費 | Asynq queue、重試次數、worker health | 不要重複上傳同一份文件 |
| 索引 | 解析完成但搜尋不到 | chunk、embedding、BM25／vector index | 不要先換更大的生成模型 |
| 富化 | 基本檢索可用但 Wiki／graph 欠資料 | enrichment 子任務與 pending count | 不要把未完成欄位當成完整知識 |

這也呼應 [Enterprise RAG 完整指南](/blog/65-enterprise-rag-guide/) 的基本原則：檢索品質的問題，必須先定位在擷取、解析、索引、重排、上下文或生成哪一層。WeKnora 的狀態與佇列設計，至少為這種分層診斷留下了可操作的接口。

## 三、回答資料流：Hybrid Retrieval 加上 SSE

文件入庫是非同步；對話回答則是同步的流式路徑。官方架構文件將 `knowledge-chat`／agent-chat 描述成：Handler → `SessionService` → `chat_pipeline`，依序完成 query 理解、平行檢索、rerank、合併、Prompt 組裝與 LLM streaming，再由 Stream Manager 將 token 推回 client。

可以把一個問句拆成這七步：

1. **確認 session 與身分。** 先取得租戶、使用者、Knowledge Base 與可用工具範圍，避免把「能問」誤當成「能看所有來源」。
2. **理解 query。** 處理語言、縮寫、時間條件與可能的查詢改寫；Agent 模式還可能把問題分成子任務。
3. **平行檢索。** 在權限 filter 下執行 BM25、向量或外部 retrieve driver；若啟用 GraphRAG、Web Search 或其他 provider，這些是額外證據來源，不是預設必有的黑盒。
4. **rerank 與合併。** 把不同 retriever 的候選放進同一個排序與去重階段，控制上下文 token budget，留下可引用的 chunk metadata。
5. **決定回答路徑。** 快速 Q&A 可以直接根據證據生成；Agent 模式則可能再呼叫 MCP、Web Search 或 sandbox Skill；Wiki 模式把結果組織成帶 revision history 的 Markdown。
6. **生成與政策檢查。** Prompt 組裝不只是把文字拼起來，還要帶入證據、來源、角色限制與拒答條件。證據不足時，正確動作可能是澄清、改寫、再查或拒答。
7. **SSE 回傳與留痕。** LLM token 透過 Stream Manager 回到瀏覽器、Embed 或 IM channel；同時保留 session、工具、證據、延遲與錯誤的 trace，才能在回答結束後回放。

### 三種模式，不要混成「Agent 有沒有開」

| 模式 | 主要路徑 | 最適合 | 主要控制點 |
| --- | --- | --- | --- |
| Quick Q&A | retrieve → rerank → prompt → answer | 單一知識庫、一次查找、低延遲問題 | ACL、證據充分性、引用覆蓋、P95 latency |
| Agent | plan／ReAct → knowledge／MCP／web／Skill → observe → answer | 需要分解、跨來源或執行動作的工作 | tool scope、OAuth、sandbox、最大步數、人工升級 |
| Wiki | agent 產生結構化 Markdown → graph／revision | 要把一次探索沉澱成可維護知識 | revision、來源、作者、rollback、staleness |

「Agent」不是一個更大的聊天按鈕，而是允許系統跨越更多狀態與副作用。它的好處是能處理動態問題；代價是每一步都可能改變延遲、成本、權限與可重現性。這就是為什麼 [Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/) 要把 Evidence、Policy、Judge、Trace 一起看，而不是只報一個答案正確率。

## 四、Agent、MCP、Skill 與 memory：行動面怎麼被關住

WeKnora 的 Agent 能力不是單一框架抽象，而是數個可分辨的邊界。

### ReAct 是 orchestration，不是權限系統

官方 README 將 ReACT multi-step reasoning 描述為能協調知識檢索、MCP、Skill sandbox 與 Web Search。這解決的是「下一步要不要找資料、叫工具或繼續推理」；它沒有替平台決定使用者是否有權限，也沒有保證工具輸入安全。

因此一個合理的 Agent path 應該長這樣：

`intent → allowed sources/tools → retrieve or call → observe result → evidence/policy check → next step or final answer`

其中 `allowed sources/tools` 和 `evidence/policy check` 不能被 prompt 省略。模型可以提議呼叫一個工具，但由 app 的身份、工具註冊、參數驗證與副作用政策決定是否真的執行。

### MCP 是整合邊界，OAuth 才是接入條件

Repository 內有 Python `mcp-server/`，把 WeKnora API 暴露給 Claude 等 MCP client；`v0.8.0` changelog 進一步記錄 MCP Server 1.1.x、stateless HTTP 與 SSE 相容模式，以及 29 個工具。這讓知識庫可以被外部 Agent 使用，也讓 WeKnora 自己的 Agent 可以接企業工具。

但 MCP 只標準化資源、tool schema 與傳輸互動，不會自動帶來最小權限。正式使用至少要問：誰建立 session、哪個 tenant、哪一個 Knowledge Base、OAuth token 能做什麼、工具錯誤是否重試、mutation 是否需要人工確認。把「能被 MCP 呼叫」寫成「安全可被任意 Agent 呼叫」，是架構上最危險的跳步。

### Skill sandbox 是 execution boundary

`v0.8.0` 的 release notes 把 Skills 執行移向 session-persistent sandbox runtime，支援 Docker、E2B 與 Cube；三種後端共享 `RemoteSandboxClient` 介面，workspace 可設定 image、CPU、memory、TTL、DNS、template 與 snapshot。網路策略預設 deny，並能以 allow／deny list 管理；本機 host-process backend 已移除。

這些設計把「模型想執行程式碼」和「程式碼直接跑在 app 主機」拆開。release notes 也提醒 Docker backend 需要注意 mounted `docker.sock` 可能帶來 root-level 風險，所以 Docker opt-in 不是裝飾性的開關，而是部署者要明確承擔的權限選擇。

### Long-term memory 是可搜尋狀態，不是免費上下文

同一版 changelog 加入 cross-session long-term memory，包含 profile、preference、fact、task、interest 等類型，支援自動擷取、使用者確認與 `search_memory`。這讓 Agent 能跨 session 保留偏好與任務狀態，但也引入新問題：資料是否過期、誰可以刪除、不同 workspace 是否隔離、memory injection 如何被追蹤、刪除後快取與索引是否同步。

記憶體要被當成另一種資料來源來治理，而不是默默拼進 prompt。它需要 owner、scope、timestamp、confidence、retention 與 provenance；否則「個人化」很快會變成無法解釋的舊資訊污染。

## 五、控制面：企業採用真正會卡在哪裡

WeKnora 的企業特性不是把 RBAC 當成一個 settings checkbox。官方 README 與架構文件列出的控制面，至少包括：

- **多租戶與多 Knowledge Base**：資料、成員與資源的邊界必須在每個 request、cache、index 與引用連結中維持。
- **身份與 API 邊界**：JWT Bearer、X-API-Key 與 OIDC 三種認證狀態，並有 scoped API key／principal 的方向，讓整合程式不必共用真人帳號。
- **RBAC 與 resource ownership**：四級 RBAC、資源擁有者與管理者路徑，將「能登入」與「能操作某個 KB」拆開。
- **任務控制**：Redis／Asynq 的 worker pool、每模型的併發閘門、重試與 dashboard，讓文件處理和模型供應商限額可以被觀測。
- **工具授權**：MCP OAuth、每個 tool 的 scope、sandbox 網路政策與人工確認，組成 Agent 的副作用邊界。
- **稽核與 trace**：request ID、OpenTelemetry／Langfuse LLM trace、工具呼叫、引用與拒答原因，才能回答「誰在什麼條件下讓系統做了什麼」。

這個列表的重點在於它們互相依賴。只在資料庫加一個 `tenant_id`，卻不把它放進 cache key、SSE stream、memory search 與引用 URL，仍可能越權。只記錄最終答案，卻沒有保留 query rewrite、候選 chunk、tool input 與 policy decision，仍無法稽核。

### 一次請求的責任地圖

| 問題 | 應由哪一層回答 | 可觀測證據 |
| --- | --- | --- |
| 使用者能不能問這個 KB？ | auth、API key gate、RBAC、ownership | principal、tenant、resource decision |
| 哪些內容能進 context？ | source ACL、metadata filter、retrieval layer | candidate IDs、版本、權限範圍 |
| 為什麼要叫這個 MCP tool？ | Agent policy、tool scope、OAuth | tool name、schema、token scope、approval |
| 為什麼沒有直接回答？ | evidence sufficiency、拒答／澄清政策 | missing evidence、policy branch、reason |
| 為什麼這次很慢？ | parser／queue／retrieval／LLM／stream | stage latency、queue wait、retry、provider |

如果你正要把 Agent 平台從 PoC 推向正式環境，建議把上表直接轉成評審欄位；不要等事故後才從 application log 裡猜責任。這也是本站 [Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/) 的核心：Evidence、Policy、Judge、Trace 缺一項，runtime 能跑也還不代表能上線。

## 六、原始碼與部署形態：它不是只能用 Compose

官方 repository 的目錄結構本身就是一份架構說明：

| 路徑 | 對應責任 | 讀它時要問的問題 |
| --- | --- | --- |
| `internal/` | Go handler、service、repository、agent、mcp、sandbox、stream、middleware | 控制面邊界是否真的存在，還是只有文件上的分層？ |
| `frontend/` | Vue3、TypeScript、Vite、TDesign、Pinia | SSE、權限與進度狀態如何映射到使用者介面？ |
| `docreader/` | Python gRPC、parser、splitter、proto | 哪些格式會丟失版面、圖片、表格或 metadata？ |
| `config/` | models、agents、prompt templates 與 runtime config | 能否以聲明式設定替換 provider 和 Agent preset？ |
| `mcp-server/`、`cli/`、`client/` | MCP、Agent-first CLI、Go SDK | 外部整合是穩定 contract 還是只適合 demo？ |
| `migrations/`、`helm/`、`deploy/` | DB schema、Kubernetes、systemd | 狀態升級、回滾與多副本如何處理？ |

除了標準 Docker Compose，官方架構文件也列出幾種部署形態：

- **Lite**：SQLite + sqlite-vec，不配置 Redis 時由 process-internal `SyncTaskExecutor` 退化執行，前端資源可由 Go 內嵌提供。適合個人或小型單機，但不要把它誤當成多副本佇列方案。
- **Desktop**：`cmd/desktop` 以 Wails v2 打包，適合把平台當作本地工具交付。
- **Kubernetes**：`helm/` Chart 可讓 app、docreader、Redis、資料庫與可選元件接上既有平台治理。
- **裸機／macOS**：`deploy/` systemd 單元與 Homebrew Formula 支援不經完整 Compose 的安裝路徑。

可選 profile 的存在也說明 WeKnora 的取捨：你可以使用 ParadeDB 內建 BM25 + pgvector 的簡化路徑，也可以依需求切換 Qdrant、Milvus、Weaviate、Doris 或外部 Elasticsearch／OpenSearch；可以啟用 Neo4j GraphRAG、SearXNG Web Search、MinIO 與 Langfuse，但每多一個服務，就多一個版本、網路、備份、權限與告警責任。

## 七、完整走一筆：企業政策問答如何穿過系統

假設使用者問：「新進工程師如何申請 production read-only 權限？」這不是只要返回一段文字；平台要證明它用了正確版本的政策，而且沒有把申請動作誤做成自動變更。

1. 使用者從 Web、CLI 或企業 IM 進入，app 先辨識 principal、tenant 與目前 Knowledge Base。
2. 查詢語意被整理成「新進工程師」「production」「read-only」「申請流程」等條件；原始問句保留在 trace。
3. BM25 找到精確的 role 名稱與 policy code，向量檢索補上「新人 onboarding」「權限申請」的語意變體。
4. reranker 依文件版本、權限與查詢相關性排序；過期草稿或其他部門政策不能因為相似度高就進 context。
5. Quick Q&A 只回傳申請步驟、必要審批者與來源；如果缺少部門資訊，應先澄清，不應猜一個預設部門。
6. 若使用者進一步問「幫我建立申請單」，Agent 可以提出呼叫 MCP tool，但必須先核對 OAuth scope、欄位與 mutation policy；沒有 approval 就只能產生草稿。
7. 若需要把 CSV 的 team roster 與政策比對，Skill 可在隔離 sandbox 執行；網路預設拒絕，輸入檔與輸出 artifact 都要有 workspace scope。
8. 最終 SSE 回傳答案與引用，trace 留下檢索候選、rerank、tool decision、sandbox 執行、延遲與拒答／升級原因。

這個例子顯示 WeKnora 的價值並不是某一個元件特別新，而是它允許把「找證據」「做行動」「留下責任」放在同一筆 session 內。真正要驗證的也不是 demo 能不能回答，而是每個分支在無答案、權限不足、工具失敗、文件過期與模型超時時是否有安全的 fallback。

## 八、我認為它最強與最需要小心的地方

### 最強：把 RAG 產品化的邊界攤在檯面上

WeKnora 把多格式文件解析、Hybrid Retrieval、Agent、Wiki、MCP、sandbox、memory、CLI 與企業控制面放在同一個 repository。對要研究「知識平台下一步如何變成 Agent runtime」的人，這比只看一個 SDK 更有價值，因為你能沿著真實的 queue、DB、gRPC、SSE、auth 與 deployment 介面追問。

### 最強：預設路徑可以簡化，能力又能外掛

ParadeDB 同時承擔 BM25 與 pgvector，能讓小型部署先少維護一個服務；需要時再切到獨立向量庫、圖譜、Web Search 或物件儲存。這是一個很務實的 adoption path：先跑通證據管線，再以可量測瓶頸決定是否增加元件。

### 需要小心：可配置不等於已驗證

官方 README 與 changelog 能證明某些能力已存在於 repository 或 release 說明，但不等於你的語料、語言、ACL、模型 provider、網路策略與流量都已達 production SLO。尤其是：

- 文件解析的「支援格式」不等於你的掃描件、表格與版面能被正確引用。
- Hybrid Retrieval 有 BM25 + vector，不等於對你的 query 分布已勝過單一路徑。
- Agent 有 MCP、Skill 與 memory，不等於副作用、刪除、重試與成本已被完整治理。
- Docker／E2B／Cube 有 sandbox adapter，不等於你已設好 image provenance、網路 allowlist、resource quota 與 artifact retention。
- 有 Langfuse／OpenTelemetry hook，不等於 trace 已包含能定位錯誤的證據、政策與工具欄位。

這些不是對 WeKnora 的負面結論，而是從「功能存在」走到「系統可承諾」時必須補做的驗證。

> **花花的判斷**
>
> WeKnora 最值得學的不是把所有 AI 能力塞在一起，而是讓文件、檢索與行動共享同一個租戶／權限／trace 語境；下一步要看的，是這些 contract 在真實資料與失敗路徑上能否被測量。

## 九、採用前的工程檢查表

如果你要把 WeKnora 放進 PoC，不妨先回答這八題：

1. **來源**：要接的 PDF、office、網頁、IM 與雲端來源，是否都有 owner、版本與刪除事件？
2. **解析**：抽樣文件的標題、表格、圖片、OCR、頁碼與程式碼，能否回指原始位置？
3. **索引**：你的 query 是否同時需要精確字串與語意相似？BM25、vector、rerank 的 offline baseline 是多少？
4. **權限**：ACL 在 ingest、index、cache、memory、SSE 與引用頁面是否一致？
5. **Agent**：哪些工具是 read-only，哪些會 mutation？每個 tool 的 OAuth scope、參數驗證與人工 gate 在哪裡？
6. **Sandbox**：Docker socket、網路、DNS、CPU／記憶體、TTL、檔案與 artifact retention 是否有明確上限？
7. **評測**：是否有涵蓋無答案、過期版本、跨租戶、工具失敗、重試與 prompt injection 的 frozen set？
8. **觀測**：能否從一個 request ID 回放 query、候選證據、rerank、tool、policy、model、queue wait、成本與最終答案？

缺任何一項都不代表不能試；它代表你應該把那一項列為 PoC 的驗收條件，而不是把它藏在「之後再補治理」的待辦事項裡。

## 結論：它更像一個可拆解的知識作業系統

讀完 WeKnora，我不會把它簡化成「Tencent 的另一個 RAG project」。更準確的讀法是：它以 Go app 作為控制面，把多格式文件處理、Hybrid Retrieval、Wiki、ReAct Agent、MCP、sandbox、long-term memory 與企業治理接成一條可以自架、替換與觀測的工作流。

它的優勢是工程邊界完整、預設部署可以從小開始、可選元件也有明確插槽；它的挑戰則是每個插槽都會把真正的責任交給採用者：資料新鮮度、ACL、provider 失敗、工具副作用、沙盒風險、評測與成本，沒有一項會因為「Agent mode」而自動消失。

若你想再往下讀，建議先看 [LangChain OpenWiki：從開放知識建立檢索系統](/blog/63-langchain-openwiki/) 的知識沉澱角度，再回到 [Enterprise RAG 完整指南](/blog/65-enterprise-rag-guide/) 對照資料與評測層；最後用 [Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/) 檢查 WeKnora 的 Evidence、Policy、Judge、Trace 是否真的接到你的上線流程。

## 方法與來源

- [Tencent/WeKnora repository](https://github.com/Tencent/WeKnora)：官方 README、能力範圍、目錄結構與部署入口。
- [官方架構總覽](https://github.com/Tencent/WeKnora/blob/main/website-docs/02-architecture/01-overview.md)：三進程核心、技術棧、通訊方式、文件上傳 sequence 與聊天 pipeline。
- [官方文件 README](https://github.com/Tencent/WeKnora/blob/main/website-docs/README.md)：文件導覽、架構閱讀路徑與功能頁面索引。
- [CHANGELOG.md](https://github.com/Tencent/WeKnora/blob/main/CHANGELOG.md)：`v0.8.0` 的 sandbox、Skills catalog、memory、MCP、CLI 與安全／營運更新。

本文的元件關係圖是依上述官方架構文件重新繪製的 Bloss0m 原創 SVG；沒有把官方文件中的 Mermaid 圖直接當成文章圖片，也沒有把 release note 的功能宣稱改寫成未驗證的 production 成效。
