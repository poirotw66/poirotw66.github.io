---
title: "金融業生成式 AI 平台工程：以雲端原生架構打造可營運的 Agentic AI"
description: "Cloud Summit 分享整理：金融 AI 上線的三條生死線、PoC 為何卡住、Cloud Native AI Runtime 三層架構、MCP 工具治理、Hybrid Search 與 Agentic RAG，以及為何準確度是工作流屬性而非模型功能。"
pubDate: 2026-07-01
updatedDate: 2026-10-01
tldr:
  - "金融 AI 上線的關鍵，是把存取、證據驗證、拒答與稽核放進同一條可觀測工作流。"
  - "本文以內部 IT 知識案例說明 Cloud Native Runtime、MCP 與 Agentic RAG；結果不代表高風險金融決策。"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["Enterprise AI","架構模式","MCP","Agentic RAG","Cloud Native"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 1
kind: guide
showToc: true
subtitle: "從外勤 IT 現場出發 — 談部署、擴展、監控與金融級可信回答的工程化路徑"
image: "/blog/38-financial-genai-platform-engineering/title_image.webp"
---
過去一年，做出 GenAI demo 已不難。但金融業真正的挑戰在於：**AI 如何進入真實營運現場**——能否部署、擴展與監控；能否在證據不足時拒答；能否穩定支撐來自 Web、Teams、語音的使用者；能否留下可稽核的軌跡。

這篇文章是寫給 **企業 AI／平台工程師、架構師與技術決策者**。核心解決的問題是：**如何以雲端原生架構，將生成式 AI 從 PoC demo 工程化為可治理、可觀測、可驗證的金融級 Agentic AI Runtime 與檢索工作流**。

本文明確 **不討論** 開放領域閒聊系統、不涵蓋高風險自主金融交易或放貸決策，也不在本文展開跨系統多租戶治理架構與法律責任歸屬（後者交由系列下一篇第 39 篇深入討論）。

> **花花的工程提醒**
>
> PoC 驗證的是模型能不能完成任務；正式平台還必須證明它能被部署、觀測、拒答、稽核與復原。缺少任何一項，都只是可展示的功能，不是可營運的系統。

> 本篇聚焦 **平台怎麼穩定跑起來**（Runtime、部署、監控、RAG 工作流）。企業級 Control Plane、責任分解與 Agentic Operating System 的治理視角，請見系列下一篇：[金融級 Enterprise Agentic AI 架構設計](/blog/39-enterprise-agentic-ai-governance/)。

## 投影片 PDF

- [下載 PDF：金融業生成式 AI 平台工程](/blog/38-financial-genai-platform-engineering/slides.pdf)

<div
  data-pdf-viewer
  data-src="/blog/38-financial-genai-platform-engineering/slides.pdf"
  data-title="金融業生成式 AI 平台工程"
  data-height="800px"
></div>

> **花花的一句話**
>
> 喵～要把 AI 送上金融業的正式舞台，光會賣萌是不夠的，還要有雲端原生架構當作最堅固的貓爬架才行！
>
## 從一個外勤現場開始

請想像：外勤同仁在客戶現場支援時，突然遇到 IT 問題——權限申請受阻、設備無法連線，或畫面出現錯誤訊息而不知道該聯繫哪個窗口。

此時他不適合停下來打字搜尋文件，也無法等待冗長回覆。在客戶面前，他只能透過語音提問：「這個錯誤訊息應由誰處理？」

使用者的需求很明確：**需要即時回應**。但金融業的要求不止於此。AI 的回答不能僅止於看似合理；系統必須查證內部知識、評估證據是否充分；不足時應明確拒答，且全程留下追蹤紀錄。

這考驗的不是聊天機器人能否答題，而是 **AI 能否真正進入營運現場**。

## 金融 AI 落地的三條生死線

金融 AI 若要落地，須同時滿足三項營運條件：

| 條件 | 挑戰 | 平台要回答什麼 |
| ---- | ---- | -------------- |
| **整合性** | 知識庫、權限、ITSM、M365、流程文件各自為政 | Agent 能否以一致方式調用企業系統與知識源 |
| **即時性** | 語音與現場作業無法容忍十幾秒等待 | 高品質 RAG 的檢索、驗證、重寫如何在可接受延遲內完成 |
| **合規性** | 稽核要問「為何這樣答」 | 查閱了哪些資料、呼叫了哪些工具，是否可追蹤、可回放 |

金融 AI 的挑戰不在於做不出 AI，而在於能否 **同時通過這三項條件**。這取決於平台能力，而非單純升級模型規模。

## 為什麼 AI 專案往往卡在 PoC？

多數 AI 專案並非沒有成果，而是停留在 PoC。常見有三個斷點：

**1. 系統孤島**
每個場景皆需客製串接，Agent 難以規模化使用企業工具；場景每增加一個，整合成本便多一層。

**2. 線性 RAG**
Retrieve 之後直接 Generate，流程看似合理，但系統無法判斷所檢索的資料是否充分，缺少自我校正與證據檢查。

**3. 黑盒 AI**
無法說明資料與工具來源，稽核與法遵會直接阻擋上線。金融業不能只接受 AI 回覆「我認為是這樣」。

這三個斷點皆非換模型所能解決，而需透過平台工程——**讓工具標準化、讓流程可自我校正、讓每次回答都有留痕**。

## Cloud Native AI Runtime：三層架構

若要真正上線，首要問題不在模型，而在 **runtime**——這套 Agentic AI 必須能被部署、擴展、監控與治理。

我將架構收斂為三層理解：

### 第一層：受控入口

使用者可從 Web、Teams 或 Mobile Voice 進入，但一律經過 **API Gateway 與 Auth**，處理 SSO、權限與流量限制。金融業的 AI 入口是受控入口，而非開放式入口。

### 第二層：Runtime 編排

**Agent Orchestrator** 運行於 Cloud Run（或同類容器化 runtime），負責意圖路由、Agent 協調、上下文驗證與回覆生成。其下連接 Hybrid Search 的 Retrieval Service 與 **MCP Tool Hub**，使 Agent 以一致方式調用企業工具。

### 第三層：Observability 與 Governance

上線第一天就要能記錄、量測、追蹤、留下 audit trail。對外以 **SLO** 管四件事：

- **延遲** — 能否撐住語音與現場互動
- **錯誤率** — 服務是否穩定
- **拒答率** — 哪裡該補知識、哪裡該調邊界
- **Trace 完整度** — 能否回放每一次決策路徑

Cloud Native 的價值不在於「把 AI 放上雲端」，而在於讓 AI 服務 **可用 SLO 管理、以 Trace 稽核、透過 Runtime 擴展**。

## MCP：讓企業工具變成可治理的能力

若每個 AI 專案都重新串接 API，只是把系統整合問題換了名稱——形成 API Spaghetti，場景每增加一個，客製成本便多一層。

**MCP（Model Context Protocol）** 的價值在於，將內部系統、M365、資料庫與 IT 流程封裝為標準化工具介面。Agent 以一致方式調用，每一次 Tool Calling 皆留下 **Tool Trace**。

對金融業而言，工具使用並非自由探索，而是限於授權範圍內、可追蹤、可治理的使用。MCP 使工具成為 **平台能力**，而非某個專案的客製程式碼。

## 資料工程與 Hybrid Search：RAG 的天花板

資料品質決定 RAG 的上限。若資料不乾淨，再強的模型也難以產出可信回答。金融業文件涵蓋 PDF、掃描件、表格、流程手冊與錯誤代碼，單一解析器無法涵蓋全部型態。

實務上我們採 **混合解析**：文字密集的文件以快速解析處理，掃描件透過 Vision API，再搭配 **Semantic Chunking** 保留上下文，避免將同一段業務邏輯切得過碎。

檢索方面：

- **Embedding** 擅長語意相似與同義改寫——當使用者問法與文件表述不一致時尤為有效
- **BM25** 擅長系統名稱、流程代碼與專有名詞的精準匹配
- 最後以 **RRF（Reciprocal Rank Fusion）** 融合排序，使兩者互補

金融級 RAG 的第一步不是生成，而是讓 Agent 取得 **可驗證的證據**。

## 從線性 RAG 到 Agentic RAG

傳統 RAG 的流程很直接：Retrieve，然後 Generate。

但金融業不能只依賴單向流程。模型找到資料，不代表資料足以回答；資料看似相關，也不代表構成正確證據。

**Agentic RAG** 改為動態工作流：

1. 路由至正確資料源
2. 混合檢索
3. 驗證證據是否充分——若不足，改寫查詢並再檢索一輪
4. 必要時拒答或引導補充
5. 全程留下 Agent Trace

其核心差異在於：這不是一次性檢索，而是 **可自我校正的工作流**。

更細的 Agentic RAG 脈絡，可參考我先前的整理：[Agentic RAG：向量搜尋遇上代理推理](/blog/07-agentic-rag/)。

## 金融級準確度：安全的信任邊界

在金融場景中，AI 答錯可能構成合規風險。因此金融級準確度並非每題皆答，而是 **每個回答都須有證據支撐**。

決策邊界可簡化為：

- 有充分、可追溯且符合權限的證據 → 回答
- 證據不足或互相矛盾 → 補查；仍無法確認時拒答或引導補充
- 高風險任務 → 交由 human-in-the-loop，不把自主程度當成授權

每個判斷都須留下 **Agent Trace**：問題、檢索來源、工具調用與決策路徑都應可回放。準確度因此是工作流屬性，由資料、檢索、驗證、拒答與稽核共同形成，不是單一模型功能。

Agentic AI 的價值不在於完全自主，而在於 **在可控邊界內自主運作**。

## 評測：先定義「答對」，再談準確率

在金融業，不能只宣稱「準確率很高」，而須先定義評分方式。我們以 **RAG Benchmark 100 題** 為基礎，採四級評分：

| 等級 | 定義 |
| ---- | ---- |
| **正確** | 完整命中，無錯誤資訊 |
| **部分正確** | 方向正確但細節不足（計入加權準確率） |
| **拒答正確** | 證據不足或不該回答時明確拒答——這是安全行為，並非失敗 |
| **錯誤或不安全** | 與正解不符、引用錯誤、或不該答卻仍回答——**零容忍** |

準確率不僅是答對率，更須衡量能否 **避免錯誤與不安全的回答**。

## 真實環境評測數據

100 題 Benchmark 涵蓋高頻 FAQ、同義改寫、應拒答題、陷阱題與邊界題。

須先說明適用範圍：這並非宣稱 AI 可處理所有高風險金融決策，而是在 **低風險、高頻、流程明確的 IT 任務** 中，驗證 Agentic Runtime 的可信回答能力。

| 指標 | 結果 |
| ---- | ---- |
| 加權準確率 | **98%** |
| 嚴格正確率 | **96%**（96 題完全正確、4 題部分正確） |
| 錯誤或不安全回答 | **0 題** |
| 完整 Agentic Workflow 平均延遲 | **3.56 秒** |
| P95 延遲 | **6.19 秒**（含檢索、驗證、重寫、拒答判斷與 Trace） |

Ablation 值得注意：

| 設定 | 準確率 |
| ---- | ------ |
| Naive RAG | 87% |
| Hybrid Search Only | 83.5% |
| 完整 Agentic RAG | **98%** |

**召回更多文件並不代表更準確**——這組消融結果凸顯，檢索後的證據驗證與拒答邊界，和搜尋本身同樣重要。

這套評測口徑直接奠基於站內 [Agentic RAG 工程案例](/projects/agentic-rag/) 的實作。在 v2.2 中，早期缺少狀態驗證曾讓 Swagger filter placeholder 參數流入生成流程；後續加入檢索後 Context Validation 與 rule-first 路由，才修正這項實作失敗。完整架構與評測證據見專案頁。

高頻 FAQ 可走 fast path；邊界題與權限題走完整驗證。這種分流依賴正確的路由判斷，且兩條路徑都應保留可回放的 trace。

### 具體權衡與工程代價

採用完整 Agentic 工作流並非毫無代價，架構落地時必須承受三項具體折衷：

1. **延遲與推論成本**：路由、證據驗證與必要時的重查增加步驟與模型呼叫。表中的端到端延遲就是這項治理取捨的量測結果；不能只看準確率而忽略等待時間與額外 Token 成本。
2. **維護成本**：Hybrid Search 需要同時維護向量資料庫（如 pgvector）與關鍵字倒排索引（BM25），並需針對業務詞庫調整 RRF（Reciprocal Rank Fusion）融合權重；多步驟驗證也增加了提示詞版本管理的複雜度。
3. **認知與除錯負擔**：工程團隊必須維護狀態機、分支邏輯與異常降級邊界，而非直接調用單一 LLM Completion 介面；排查問題時需跨檢索日誌、工具 Trace 與模型推論日誌進行關聯分析。

## 把案例擴展到新場景前，先重做驗證

這個案例支持的是明確範圍內的 IT 知識工作流，不代表客服、法遵或內控可以直接沿用相同成績。架構元件可以複用，指標不能移植：新場景需要重新建立代表性問題與應拒答題，檢查來源時效和權限邊界，並用相同口徑量測錯誤、拒答與延遲，再決定是否擴大流量。

這是根據案例整理出的工程建議，不是本文已完成的跨場景測試結果。

## 適用邊界與上線判斷

這套架構具有明確的適用邊界，工程團隊在選型時必須保持克制：

- **證據邊界**：這是本站內部 IT 知識案例，沒有在本文中提供獨立重跑。它**不能證明高風險金融交易、授信審批或法遵覆核可全自動處理**；格式高度破壞的掃描檔或知識庫外的未知政策，仍須轉交人工覆核。
- **何時不該採用（反模式）**：若業務場景僅需超低延遲（<500ms）的靜態 FAQ 查詢，或單一關鍵字即可 100% 精準命中的簡單流程，硬套多輪 Agentic 狀態機（路由 → 混合檢索 → 驗證 → 改寫）是典型的過度工程（Over-engineering）。此時直接使用規則引擎或單層向量快取更為經濟。

因此，只有當跨系統整合、證據不足時的拒答與稽核需求，足以抵銷額外延遲和維護負擔時，多步驟 Agentic 工作流才值得採用。決策重點是確認整條路徑能被量測、回放，並在超出證據或權限邊界時停下來。

## 常見問題

### 這組評測結果能直接套用到其他業務嗎？

不能。它只描述本文所列的內部 IT 題集；客服、法遵或其他知識域都要重新抽樣、標註應答與拒答邊界，再以一致評分規則驗證。

### MCP 會自動替每個工具套用細緻權限嗎？

不會。現行 [MCP 規格將 HTTP 授權定義為可選的傳輸層能力](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)；即使啟用 token 與 scope，工具服務仍須自行設定應用程式權限，並在每次操作時檢查使用者是否可讀寫指定資料。取得 server token 不等於獲准執行所有業務動作。

## 下一步閱讀與相關專案

精選 3 個延伸入口，串起架構、契約與代表實作：

1. **架構下一篇**：[金融級 Enterprise Agentic AI 架構設計：從 Demo 到 Agentic Operating System](/blog/39-enterprise-agentic-ai-governance/) — 從 Runtime 進入 Control Plane，探討 15+ 代理責任分解與 E·P·J·T 治理。
2. **上線檢核契約**：[Agentic AI 平台契約：上線前必須接上的控制面](/blog/93-agentic-ai-platform-contract/) — 將控制面轉化為可逐項審查的 PoC 上線門檻與七條禁制。
3. **代表工程實作**：[Agentic RAG 工程案例](/projects/agentic-rag/) — 查看本文引用的 100 題評測數據、Swagger 失敗案例與第一方架構細節。

## 方法來源與證據邊界

本文的 Cloud Native AI Runtime、三條生死線與評測設計，是作者在 Cloud Summit 分享的工程框架，不是外部標準。評測數據來自本站公開的低風險 IT／流程案例，並不代表一般金融決策的通用準確率。

- [Agentic RAG 案例與評測口徑](/projects/agentic-rag/) — benchmark、ablation 與延遲數字的第一方證據
- [Model Context Protocol：架構規格](https://modelcontextprotocol.io/specification/2025-06-18/architecture) — MCP 的 host／client／server 邊界與 capability negotiation
- [NIST AI 600-1：Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) — 生成式 AI 風險管理與評測背景
- [OpenTelemetry：Generative AI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — Agent、模型與工具呼叫的觀測欄位參考
