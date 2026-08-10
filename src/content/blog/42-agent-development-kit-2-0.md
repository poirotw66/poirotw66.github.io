---
title: "Google ADK 2.0：Workflow Graph、Task Collaboration 與 HITL 邊界"
description: "根據 Google 官方發布與 ADK repository，解析 ADK 2.0 如何分離 deterministic routing 與 LLM reasoning，並評估 workflow、task、HITL 與 production runtime 的責任邊界。"
pubDate: 2026-07-09
updatedDate: 2026-08-09
tldr:
  - "ADK 2.0 的核心是把可確定的 routing、scheduling 與 error handling 從 LLM loop 移到 Workflow runtime。"
  - "Workflow 可以混合 tool、single-turn agent、branch、loop 與 HITL，但 deterministic graph 不會自動使節點輸出正確。"
  - "Python ADK 已進入 2.x，其他語言版本與功能成熟度不同；導入前需鎖定 runtime、版本與部署目標。"
audience:
  - "評估 Google ADK 與多 Agent workflow 的 AI 工程師"
  - "需要控制流程可靠度、成本、審批與恢復語意的平台架構師"
category: "AI Engineering"
tags: ["AI Agent", "Multi-Agent", "Google Cloud", "架構模式"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 3
kind: "article"
showToc: true
image: "/blog/42-agent-development-kit-2-0/title_image.webp"
---

Google 在 2026 年 7 月正式說明 [Why we built ADK 2.0](https://developers.googleblog.com/en/why-we-built-adk-20/)：Agent 進入 production 後，讓 LLM 同時負責 routing、scheduling 與 error handling，會帶來不必要的 token、latency 與執行變異。ADK 2.0 因此加入 structured Workflow runtime 與 task-collaboration model，讓確定性流程和開放式推理可以組合，而不是二選一。

這個方向合理，但不能把「graph」誤解成「hallucination 被完美隔離」。Graph 只決定下一步如何走；LLM node 的分類、抽取與判斷仍可能錯，tool side effect 仍需要 authorization、idempotency 與補償流程。

> **花花的一句話**
>
> 能用程式確定的順序交給 Workflow，真正需要語意判斷的節點才交給 LLM。

> **花花的工程提醒**
>
> Deterministic routing 保證路徑規則被執行，不保證路由依據正確；LLM 輸出仍需 schema、confidence、測試與人工 gate。

## ADK 2.0 解決的結構問題

傳統 autonomous agent 常把「先查購買紀錄、再判斷政策、核准後退款、最後通知」全部寫進 system prompt。模型每一步都要重新讀脈絡、選工具並決定路徑。即使成功率很高，固定業務流程也不應為每個 transition 付出推理成本與變異。

ADK 2.0 Workflow 把 execution routing 與 language processing 分開：

- API、database 或 deterministic function 成為 tool node。
- 模糊分類、摘要與文字生成交給 single-turn Agent node。
- Edge 以明確條件決定分支。
- HITL 作為 workflow step，而不是 prompt 裡一句「重要時請詢問」。
- Task model 管理工作分解與 collaboration，而不必讓一個 supervisor 持有所有細節。

設計原則不是「全部改成 DAG」，而是先問：如果 A 之後必然是 B，為什麼還要讓模型重新猜一次？

## Workflow Graph 如何組合 deterministic 與 agentic node

官方 refund 範例使用 `Workflow`、`START`、Python function 與 `Agent(mode="single_turn")` 組成 graph。概念上可簡化為：

```python
workflow = Workflow(
    name="Refund_Workflow",
    edges=[
        (START, fetch_purchase_history, analyze_policy_agent),
        (analyze_policy_agent, route_decision,
         {True: issue_refund, False: close_ticket}),
        (issue_refund, draft_email_agent, close_ticket),
    ],
)
```

這段示意的價值在責任分離：購買查詢與退款是 deterministic tools；政策例外與信件草稿使用 LLM；branch function 把 Agent 輸出轉成 graph 能執行的條件。

Production 版本不能只用字串中是否出現 `true` 來做退款。至少應加入：

- 結構化輸出 schema 與拒絕不合法值。
- 退款金額、帳號與 policy version 的重新驗證。
- Idempotency key，避免 retry 重複退款。
- 超過門檻的人工審批與 timeout policy。
- 每個 node 的 trace、input hash、result 與 error category。

## Task collaboration 不等於無限制多 Agent

ADK 2.0 的 task model 讓工作可以被建立、分配、追蹤與交接。它適合長時間或多專業角色的流程，但「更多 Agent」不是預設優化。每次 delegation 都引入 context transfer、等待、重試、權限與追蹤成本。

應優先使用單一 workflow node，除非子工作至少符合一項條件：

- 需要不同工具或權限範圍。
- 可以獨立驗證與重試。
- 能並行且不共享容易衝突的 state。
- 需要不同模型、成本或 latency profile。
- 需要清楚 owner 與 audit boundary。

若只是把同一段 prompt 拆成多個人格，通常只增加 orchestration entropy。

## HITL 的真正責任邊界

官方把 Human-in-the-Loop 描述為可與 Workflow 組合的 deterministic step。這比讓模型自己判斷「何時詢問人」更可靠，但 framework primitive 不等於完整審批系統。

企業應另外定義：

1. 哪種 action、金額、資料分類或 confidence 觸發審批。
2. 誰能批准，身份與角色如何驗證。
3. Approval 綁定哪個 immutable action payload 與版本。
4. 等待期間 state 放在哪裡、多久過期、部署後能否 resume。
5. 拒絕、timeout、重複 callback 與已變更資料如何處理。

若 approval 只是一個可重播的 boolean，而沒有綁定 actor、payload 與 expiry，就不是真正的 authorization control。

## 版本與 artifact 狀態

截至 2026-08-09，Google 官方 `adk-python` repository 顯示 2.x stable release，並保留頻繁發布節奏；Java、Go、TypeScript、Kotlin 的版本號與 feature parity 不同。ADK 是開源、code-first、deployment-agnostic 的 framework，雖然對 Gemini 與 Google Cloud 整合較深，也支援其他模型與部署環境。

導入前應固定：

- 使用的語言 SDK 與精確版本。
- Workflow、Task、HITL、evaluation 與 deployment 功能是否在該版本可用。
- 對 Vertex AI Agent Engine、Cloud Run 或自管 runtime 的相依。
- Session、artifact、task 與 trace 的 storage implementation。
- Preview 或 beta feature 的升級與回退方案。

## 何時適合 ADK 2.0 Workflow

適合：流程有固定合規步驟、同時包含少量語意判斷、需要 node-level retry／trace，且團隊願意維護 graph contract。

不一定適合：簡單單輪工具呼叫、主要價值來自自由探索、已有成熟 workflow engine，或團隊無法營運 durable state 與 observability。此時把既有 orchestrator 接到 Agent node，可能比全面搬遷更安全。

## 導入驗收清單

1. 把 deterministic 與 probabilistic step 明確分類。
2. 為每個 Agent node 定義 schema、failure taxonomy 與 evaluation set。
3. 為 side effect tool 加入 authorization、idempotency 與 compensation。
4. 測試 branch、retry、timeout、cancel、resume 與人工拒絕路徑。
5. 量測 node latency、token、task completion、human wait 與重工率。
6. 以 shadow traffic 或低風險流程逐步上線。

完整 Agent 架構與評測脈絡可讀 [AI Agent 實戰指南](/blog/64-ai-agent-guide/)；安全控制面見 [企業 AI Agent 安全架構](/blog/43-enterprise-ai-agent-security/)；若要比較工具與跨 Agent protocol，可接著讀 [MCP 2026-07-28 規格](/blog/34-model-context-protocol-mcp/)。

## Primary sources

- [Google Developers Blog：Why we built ADK 2.0](https://developers.googleblog.com/en/why-we-built-adk-20/)
- [Google ADK Python repository and releases](https://github.com/google/adk-python)
- [Google ADK documentation](https://google.github.io/adk-docs/)
- [Google Developers Blog：ADK multi-agent applications](https://developers.googleblog.com/agent-development-kit-easy-to-build-multi-agent-applications/)
