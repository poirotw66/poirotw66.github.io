---
title: "金融業生成式 AI 平台工程：以雲端原生架構打造可營運的 Agentic AI"
description: "Cloud Summit 分享整理：金融 AI 上線的三條生死線、PoC 為何卡住、Cloud Native AI Runtime 三層架構、MCP 工具治理、Hybrid Search 與 Agentic RAG，以及為何準確度是工作流屬性而非模型功能。"
pubDate: 2026-07-01
updatedDate: 2026-07-01
tldr:
  - "Cloud Summit 分享整理：金融 AI 上線的三條生死線、PoC 為何卡住、Cloud Native AI Runtime 三層架構、MCP 工具治理、Hybrid Search 與 Agentic RAG，以及為何準確度是工作流屬性而非模型功能"
  - "從外勤 IT 現場出發 — 談部署、擴展、監控與金融級可信回答的工程化路徑"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["Enterprise AI","架構模式","MCP","Agentic RAG","Cloud Native"]
kind: guide
showToc: true
subtitle: "從外勤 IT 現場出發 — 談部署、擴展、監控與金融級可信回答的工程化路徑"
image: "/blog/38-financial-genai-platform-engineering/title_image.webp"
---
![金融業生成式 AI 平台工程](/blog/38-financial-genai-platform-engineering/title_image.webp)

過去一年，做出 GenAI demo 已不難。但金融業真正的挑戰在於：**AI 如何進入真實營運現場**——能否部署、擴展與監控；能否在證據不足時拒答；能否穩定支撐來自 Web、Teams、語音的使用者；能否留下可稽核的軌跡。

這些問題不是單一模型可以回答的，而是 **平台工程** 必須回答的。本文整理我在 Cloud Summit 的分享：**如何以雲端原生架構，將生成式 AI 工程化為可治理、可觀測、可驗證的金融級 Agentic AI 平台**。

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

---

> **花花的一句話**：喵～要把 AI 送上金融業的正式舞台，光會賣萌是不夠的，還要有雲端原生架構當作最堅固的貓爬架才行！
>
## 從一個外勤現場開始

請想像：外勤同仁在客戶現場支援時，突然遇到 IT 問題——權限申請受阻、設備無法連線，或畫面出現錯誤訊息而不知道該聯繫哪個窗口。

此時他不適合停下來打字搜尋文件，也無法等待冗長回覆。在客戶面前，他只能透過語音提問：「這個錯誤訊息應由誰處理？」

使用者的需求很明確：**需要即時回應**。但金融業的要求不止於此。AI 的回答不能僅止於看似合理；系統必須查證內部知識、評估證據是否充分；不足時應明確拒答，且全程留下追蹤紀錄。

這考驗的不是聊天機器人能否答題，而是 **AI 能否真正進入營運現場**。

---

## 金融 AI 落地的三條生死線

金融 AI 若要落地，須同時滿足三項營運條件：

| 條件 | 挑戰 | 平台要回答什麼 |
| ---- | ---- | -------------- |
| **整合性** | 知識庫、權限、ITSM、M365、流程文件各自為政 | Agent 能否以一致方式調用企業系統與知識源 |
| **即時性** | 語音與現場作業無法容忍十幾秒等待 | 高品質 RAG 的檢索、驗證、重寫如何在可接受延遲內完成 |
| **合規性** | 稽核要問「為何這樣答」 | 查閱了哪些資料、呼叫了哪些工具，是否可追蹤、可回放 |

金融 AI 的挑戰不在於做不出 AI，而在於能否 **同時通過這三項條件**。這取決於平台能力，而非單純升級模型規模。

---

## 為什麼 AI 專案往往卡在 PoC？

多數 AI 專案並非沒有成果，而是停留在 PoC。常見有三個斷點：

**1. 系統孤島**  
每個場景皆需客製串接，Agent 難以規模化使用企業工具；場景每增加一個，整合成本便多一層。

**2. 線性 RAG**  
Retrieve 之後直接 Generate，流程看似合理，但系統無法判斷所檢索的資料是否充分，缺少自我校正與證據檢查。

**3. 黑盒 AI**  
無法說明資料與工具來源，稽核與法遵會直接阻擋上線。金融業不能只接受 AI 回覆「我認為是這樣」。

這三個斷點皆非換模型所能解決，而需透過平台工程——**讓工具標準化、讓流程可自我校正、讓每次回答都有留痕**。

---

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

---

## MCP：讓企業工具變成可治理的能力

若每個 AI 專案都重新串接 API，只是把系統整合問題換了名稱——形成 API Spaghetti，場景每增加一個，客製成本便多一層。

**MCP（Model Context Protocol）** 的價值在於，將內部系統、M365、資料庫與 IT 流程封裝為標準化工具介面。Agent 以一致方式調用，每一次 Tool Calling 皆留下 **Tool Trace**。

對金融業而言，工具使用並非自由探索，而是限於授權範圍內、可追蹤、可治理的使用。MCP 使工具成為 **平台能力**，而非某個專案的客製程式碼。

---

## 資料工程與 Hybrid Search：RAG 的天花板

資料品質決定 RAG 的上限。若資料不乾淨，再強的模型也難以產出可信回答。金融業文件涵蓋 PDF、掃描件、表格、流程手冊與錯誤代碼，單一解析器無法涵蓋全部型態。

實務上我們採 **混合解析**：文字密集的文件以快速解析處理，掃描件透過 Vision API，再搭配 **Semantic Chunking** 保留上下文，避免將同一段業務邏輯切得過碎。

檢索方面：

- **Embedding** 擅長語意相似與同義改寫——當使用者問法與文件表述不一致時尤為有效
- **BM25** 擅長系統名稱、流程代碼與專有名詞的精準匹配
- 最後以 **RRF（Reciprocal Rank Fusion）** 融合排序，使兩者互補

金融級 RAG 的第一步不是生成，而是讓 Agent 取得 **可驗證的證據**。

---

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

---

## 金融級準確度：安全的信任邊界

在金融場景中，AI 答錯可能構成合規風險。因此金融級準確度並非每題皆答，而是 **每個回答都須有證據支撐**。

決策邏輯可簡化為：

- 證據充分 → 回答  
- 不足 → 改寫查詢後重檢  
- 多輪後仍不足 → 拒答或引導補充  
- 高風險任務 → 進入 human-in-the-loop  

每個判斷皆須留下 **Agent Trace**——不僅是最終答案；問題、檢索來源、工具調用與決策路徑都應可回放。

Agentic AI 的價值不在於完全自主，而在於 **在可控邊界內自主運作**。

---

## 金句：準確度是工作流屬性，不是模型功能

> **Accuracy is not a model feature. It is a workflow property.**

準確度無法靠升級模型規模單獨解決。每個工作流節點都在消除一種錯誤來源：

| 節點 | 降低的風險 |
| ---- | ---------- |
| Route | 找錯資料源 |
| Hybrid Search | 漏檢證據 |
| Validate | 幻覺與過度自信 |
| Rewrite | 首輪檢索失敗 |
| Trace | 不可稽核 |

金融級 AI 的準確度，不靠模型一次產出完美回答，而靠 **可驗證、可觀測、可追蹤、可改善的工作流**。對 Cloud Native AI 平台而言，AI 品質必須能在平台上被持續監控、回歸與改善。

---

## 評測：先定義「答對」，再談準確率

在金融業，不能只宣稱「準確率很高」，而須先定義評分方式。我們以 **RAG Benchmark 100 題** 為基礎，採四級評分：

| 等級 | 定義 |
| ---- | ---- |
| **正確** | 完整命中，無錯誤資訊 |
| **部分正確** | 方向正確但細節不足（計入加權準確率） |
| **拒答正確** | 證據不足或不該回答時明確拒答——這是安全行為，並非失敗 |
| **錯誤或不安全** | 與正解不符、引用錯誤、或不該答卻仍回答——**零容忍** |

準確率不僅是答對率，更須衡量能否 **避免錯誤與不安全的回答**。

---

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

**召回更多文件並不代表更準確**——關鍵在檢索之後的 validate 與 refusal，而非 search 本身。這也呼應前述：準確度是工作流屬性，不是模型功能。

高頻 FAQ 可走 fast path；邊界題與權限題才走完整驗證流程。P95 6.19 秒是在 **保留治理機制** 下的營運數字，並非移除安全檢查後的理想值。

---

## 實戰驗證：走向即時語音支援

回到開場的外勤情境——無法打字、無法久等、需要語音指引。

我們選擇 **IT 資訊服務** 作為首個落地場景，並非因其簡單，而是因為它同時涵蓋：跨系統查詢、權限控管、即時回應、標準流程與安全拒答——金融級 AI 上線的典型挑戰皆在其中。

P95 6.19 秒、零不安全回答，代表這套能力已嵌入 runtime、完成延遲量測、並留下 trace，開始進入 **可營運狀態**。它不僅是單點 IT bot，更是可擴展至客服、法遵、內控與營運知識查詢的 **平台能力驗證**。

---

## 收束：From AI Demo to Operational AI Capability

Demo 展示的是模型能力；production 要求的是平台能力——**能整合、夠準確、管得住、看得見**。

- **快**，是體驗問題。  
- **準**，是信任問題。  
- **可拒答、可追蹤、可稽核**，才是金融業 AI 上線問題。

金融業 AI 的下一階段，比拼的不是誰 demo 更亮眼，而是誰能將它工程化為可營運的 **Operational AI Capability**。

---

## 常見問題

### 為什麼選 IT 支援，不是直接選金融業務場景？

IT 支援涵蓋金融級 AI 上線的典型挑戰：跨系統查詢、權限控管、標準流程、即時回應、安全拒答與 Agent Trace。這些能力一旦平台化，便可複用至客服、法遵、內控、理專支援與營運知識查詢。

### P95 6.19 秒對語音互動是否偏慢？

此數字須放在完整 Agentic RAG 流程下理解——包含 route、hybrid search、validate、必要時的 rewrite、安全拒答與 trace。實務上並非每題都走完整流程；高頻 FAQ 走 cache 或 fast path，邊界題才走完整驗證。

### 為什麼 Hybrid Search Only 比 Naive RAG 還低？

Hybrid Search 提高召回率，但召回更多並不代表更準確。在應拒答題或邊界題中，關鍵字相近但不相關的內容，可能使模型誤判證據已充分。關鍵在 search **之後** 的 validate、rewrite、refusal 與 boundary routing。

### MCP 在金融業最大價值是什麼？

將企業內部工具標準化、治理化、可追蹤化。Agent 必須在授權範圍內使用工具，且每次 tool calling 都須留下 trace。

---

## 系列下一篇

本篇談的是 **平台如何穩定運行**。若你關心企業如何把同一套能力治理成可跨場景複用、可稽核的 **Agentic Operating System**（Control Plane、責任分解、E·P·J·T 框架），請繼續閱讀系列下一篇：

→ **[金融級 Enterprise Agentic AI 架構設計：從 Demo 到 Agentic Operating System](/blog/39-enterprise-agentic-ai-governance/)**

---

## 延伸閱讀

- [Agentic RAG：向量搜尋遇上代理推理](/blog/07-agentic-rag/)
- [OpenAI 部署模擬：離線評估與真實部署的落差](/blog/25-deployment-simulation/)
- [Model Context Protocol（MCP）](/blog/34-model-context-protocol-mcp/)
- 站內相關專案：[Agentic RAG](/projects/agentic-rag/) · [Realtime Voice AI](/projects/realtime-voice-ai-project/)
