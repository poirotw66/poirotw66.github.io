---
title: "Jev 實戰架構：把 Confidence-Gated Routing 放進 Agent Runtime"
description: "不再重述 Jev 的基本介紹，改從 confidence-gated routing、speculative fan-out、composite scoring 與社群實驗，拆解如何把 AI 判斷放在 Agent、工具與人工審查之間。"
pubDate: 2026-09-18
updatedDate: 2026-09-18
tldr:
  - "Jev 真正適合放進 Agent runtime 的位置，不是取代 planner，而是成為一個可被程式碼消費的 micro-decision layer。"
  - "Confidence-gated routing 把「模型選了哪條路」和「模型有多確定」分成兩個訊號，讓低信心結果可以轉人工或升級更強的模型。"
  - "Speculative fan-out 與 composite scoring 能減少逐題往返，但只有在問題彼此獨立、rubric 穩定且可以被離線評估時才值得採用。"
  - "社群的 Home Assistant、MCP connector 與 OpenJev 專案很適合當架構探針；它們不是 TypeSafe 官方保證，也不能直接當成生產可靠性證據。"
audience:
  - "設計 agent harness、工具路由、審核閘門或企業自動化 workflow 的工程師"
  - "需要在速度、成本、可觀測性與人工升級之間做取捨的 AI platform 團隊"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Platform Engineering", "Enterprise AI", "MCP"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 36
kind: "article"
showToc: true
wideHeader: true
image: "/blog/108-jev-confidence-gated-agent-runtime/title_image.webp"
---

上一篇 [TypeSafe AI 與 Jev 的拆解](/blog/107-typesafe-ai-jev-system-one/)已經處理了 System One、Choice、Score、Noul，以及官方 workflow evals 的測量邊界。這一篇不再從「Jev 是什麼」開始，而是追問一個更接近實作的問題：

> 如果 Agent 已經能規劃、呼叫工具、讀取結果，Jev 應該被放在什麼位置，才能真的降低錯誤與成本？

我的答案是：不要把它當成另一個會聊天的 agent，也不要讓它接管整個 workflow。比較有價值的定位，是把它放在 Agent runtime 的決策邊界，負責回答幾個可校準、可審查、可被程式碼組合的微型問題。Planner、工具執行與副作用仍由既有 harness 掌握；Jev 提供的是 route、score、gate 與 escalation signal。

這個差異很重要，因為「模型可以輸出 typed value」只是介面能力；真正的工程工作是決定什麼時候相信它、什麼時候停下來，以及怎麼證明這個閘門沒有把風險藏起來。

> **花花的判斷**
>
> Jev 最值得試的地方不是「讓 Agent 更自主」，而是讓 Agent 在做出副作用前，多一個可以量測、回放與校準的 decision boundary。

## 先畫出 Agent runtime 的責任邊界

一個實用的 Agent runtime 可以先拆成五個角色：

| 層 | 責任 | 適合交給誰 |
| --- | --- | --- |
| Planner | 理解目標、提出步驟、處理開放式問題 | Frontier LLM 或既有 Agent |
| Decision layer | 判斷意圖、風險、是否足夠確定、下一個 route | Jev 或其他 typed classifier |
| Tool broker | 檢查權限、schema、timeout、idempotency 與 retry | 程式碼 |
| Side-effect executor | 寫入資料、發送訊息、部署或刪除資源 | 程式碼加政策 |
| Review boundary | 低信心、衝突或高風險結果的人工升級 | 人與 workflow |

這個分工延續了 Agent harness 的基本原則：模型可以提出意圖，但不能單憑自然語言決定不可逆的動作。Jev 的 typed decision 讓這個原則更具體，因為 runtime 可以把「模型選了什麼」和「模型有多確定」記成結構化事件，而不是只保留一段最後的文字。

它也和 [Agent 的狀態、工具與權限契約](/blog/93-agentic-ai-platform-contract/)相容：decision layer 是契約中的判斷節點，不是權限系統本身。即使 Jev 回答高信心，tool broker 仍然要重新驗證 actor、scope、資源狀態與重試語意。

## Pattern 1：Confidence-Gated Routing

TypeSafe 官方的 [Confidence-Gated Routing pattern](https://docs.typesafe.ai/patterns)指出，workflow 不必只看分類答案，也可以把 confidence 當成第二個控制軸。這是 Jev 放進 runtime 最直接的入口。

以客服 Agent 為例，不要只寫：

| 判斷 | route |
| --- | --- |
| intent = billing | billing handler |

更安全的版本會把 decision 拆成兩個訊號：

| intent | confidence | 建議處理 |
| --- | --- | --- |
| billing | 高 | 進入唯讀的帳務查詢 |
| billing | 中 | 先產生草稿，等待人工確認 |
| billing | 低 | 升級 frontier LLM 或人工，不做外部寫入 |
| 其他 | 任意 | 回到通用 triage，不要猜測專屬工具 |

這裡的「高、中、低」不是 TypeSafe 官方替你決定的固定數字，而是應由團隊用 golden set 與風險成本校準的政策。可以把 threshold 和動作風險綁在一起：

1. **可逆、唯讀動作**：允許較低的 confidence，但仍要記錄輸入、問題版本與結果。
2. **可回復的外部動作**：要求較高 confidence，並先經過 schema、權限與 idempotency 檢查。
3. **不可逆或敏感動作**：confidence 只能當必要條件，不能當充分條件；仍需要人工批准或更嚴格的 policy gate。

這種設計的重點不是把一個數字當成真理，而是讓系統能回答：「這次為什麼自動化？這次為什麼升級？」若 audit log 只保存最後的 route，日後仍然無法區分模型不確定、資料缺失、選項設計不良或工具本身失敗。

## Pattern 2：Speculative Fan-Out 把 sequential latency 改成一次判斷

很多 Agent workflow 的慢，不是每個判斷本身很複雜，而是每一題都要等上一題完成。TypeSafe 的 [Speculative Fan-Out pattern](https://docs.typesafe.ai/patterns)提供另一種思路：把一批「可能用得到」的 atomic questions 一次送出，再由程式碼忽略目前不需要的答案。

假設 incoming request 可能屬於五種 intent，還可能需要判斷 urgency、sentiment 與是否包含敏感資料。傳統寫法可能是：

1. 先判斷 intent。
2. 根據 intent 再問 urgency。
3. 再問是否需要人工。
4. 最後決定 handler。

Fan-out 寫法則是先問一組彼此獨立的問題，再由 policy composition 選擇後續路徑。它可能少掉幾次 round trip，也讓觀測資料更完整；代價是你會支付不一定會用到的判斷，並且要確保每一題都使用同一份 state snapshot。

因此，fan-out 不是「永遠平行化」的口號，至少有三個前提：

- 問題的輸入狀態相同，且彼此不需要前一題的答案。
- 每一題的選項與 rubric 已經足夠穩定，能離線檢查品質。
- 被忽略的答案不會被誤解成已經驗證過；log 要保留它是 unused、rejected 還是 policy conflict。

如果問題有真正的 dependency，例如只有先知道租戶與資產範圍，才知道哪些工具可見，那就不能為了速度硬做 fan-out。這類依賴應留在 code-owned state machine 裡，或拆成兩個明確的 phase。

> **花花的工程提醒**
>
> Fan-out 降低的是等待時間，不是決策風險。一次拿到十個 typed answers，並不代表十個答案都已經通過資料新鮮度、權限與副作用檢查。

## Pattern 3：Composite Scoring 不是把一切變成一個總分

官方文件也列出 [Composite Scoring](https://docs.typesafe.ai/patterns)：把多個 dimensions 組合成一個 workflow 可用的評估。這對 triage、reranking、候選工具選擇很有吸引力，因為 runtime 可以用一致的尺度排出優先順序。

但 composite score 最容易被濫用。以下三種分數在語意上完全不同：

| 分數 | 真正代表的問題 | 風險 |
| --- | --- | --- |
| 相關性 | 這個候選和需求有多匹配？ | 可能沒有回答可執行性 |
| 風險 | 這個行動有多危險？ | 低風險不等於正確 |
| 綜合優先級 | 現在是否值得先處理？ | 權重變動可能改寫業務政策 |

因此，實作時不要只保留最後的 composite score。至少要同時保存原始 dimensions、權重版本、question schema 與最後的 route。若只留下 0.82，後續無法知道它是高相關低風險，還是低相關但因為業務加權而排到前面。

另一個邊界是選項數。TypeSafe 的官方 launch material 說明，Wikiracing 類型的選項數超過 255 時，需要先做兩階段 scoring，再做明確 choice；這會改變延遲與實作方式。這不是一個可以被「把 cardinality 再加大」掩蓋的細節，而是提醒我們：問題設計本身就是系統容量的一部分。

## 把 decision layer 接進 Agent harness

一個可落地的 loop 可以長這樣：

1. Agent 先提出 plan，但不直接執行外部副作用。
2. Runtime 建立不可變的 state envelope，包含使用者請求、目前步驟、工具候選與權限上下文。
3. Decision layer 同時評估 intent、risk、confidence、是否需要 review。
4. Policy engine 根據答案與風險等級，選擇唯讀工具、草稿模式、人工審核或拒絕。
5. Tool broker 再做一次 schema、scope、idempotency、timeout 與資源狀態驗證。
6. 執行結果、decision input、question version 與 policy version 一起寫入 trace。

這個位置有一個很實際的優點：Jev 不必知道完整的工具 API，也不必被授予所有工具權限。它只需回答少數由 runtime 定義好的問題；真正的工具選擇與權限仍由 code-owned policy 控制。

如果 Agent 需要開放式推理，可以把 frontier LLM 留在 planner；如果需要快速、反覆且可回放的判斷，再讓 Jev 處理 micro-decision。這比較接近「兩種模型各自做擅長的事」，而不是宣稱某一個模型要取代整個 Agent stack。

## 生態實驗：把 repo 當成架構探針，不是可靠性證明

TypeSafe 官方 launch post 展示了 Doom 與 Wikiracing 這類互動 demo；它們適合說明 typed decisions 能進入連續互動 loop，但 demo 成功不等於企業 workflow 已經被驗證。

在官方 SDK 之外，也可以看到幾種社群方向：

- [HA-Jev](https://github.com/AboveColin/HA-Jev) 把 Jev 類決策接到 Home Assistant，讓智慧家庭成為一個低風險的 entity／automation 實驗場。
- [typesafe-mcp](https://github.com/itsmostafa/typesafe-mcp) 嘗試以 MCP connector 的形式把 decision service 放進工具生態。
- [OpenJev](https://github.com/daseinlabs/open-jev) 則以獨立 open-model research baseline 探索 typed option scoring 與互動 demo。

這些 repo 的價值在於暴露 integration surface：state 要怎麼包、結果怎麼轉成 entity 或 tool、什麼地方需要 fallback，以及使用者如何檢查模型的不確定性。但它們是獨立社群專案，不能被寫成 TypeSafe 官方支援，也不能從 repo 存在推導出 uptime、校準品質或安全保證。導入前要逐一檢查維護者、版本、API key handling、失敗行為與權限邊界。

## 一個比 demo 更有用的 PoC：先做 IT intent router

如果團隊想驗證 Jev 是否真的值得放進 runtime，我會先做一個小而完整的 A/B，而不是直接接 production agent。可以使用官方的 [System One Adapter](https://github.com/typesafe-ai/system-one-adapter-python)讓同一個 decision interface 對比不同 provider，再固定以下條件：

| 實驗設計 | 必須固定 |
| --- | --- |
| Dataset | 具備人工 label、難例、ambiguous case 與不可路由樣本 |
| Questions | 相同的 intent options、risk rubric 與 review question |
| Policy | 相同的 threshold、fallback 與 tool permission |
| Replay | 相同的 state snapshot，不把外部即時變化混進比較 |
| Metrics | route accuracy、coverage、calibration、p95 latency、cost、escalation rate |

最重要的不是只看 accuracy，而是畫出 coverage–risk curve：當你把自動化 coverage 提高時，錯誤的外部動作、人工升級率與延遲如何變化？如果 Jev 的優勢只在「把所有不確定的 case 都送給人工」，那它可能只是更保守，不代表 decision layer 本身更有辨識力。

也要記錄四種 failure class：

1. **Schema failure**：輸出形狀不符合契約。
2. **Semantic failure**：格式正確，但 intent 或 risk 判斷錯。
3. **Calibration failure**：confidence 很高，實際卻常錯。
4. **Policy failure**：模型答案合理，但程式碼把它組合成不安全的動作。

這四類問題不能都靠換模型解決。尤其第四類屬於 runtime 設計錯誤；使用更快的 typed model，只會更快地執行錯誤政策。

## 三個不要急著自動化的地方

### 不要把 confidence 當成 permission

Confidence 是模型對判斷的訊號，不是 actor 擁有權限的證明。身份、租戶、資源 scope 與 approval 都必須由 runtime 驗證。

### 不要把 type safety 當成 semantic safety

一個結果可以完全符合 Choice 或 Score schema，卻仍然誤判文件、忽略新的上下文，或對罕見 case 過度自信。這也是為什麼 benchmark 需要保留 ambiguous、out-of-distribution 與 abstention case。

### 不要把沒有答案誤解成低分答案

當候選選項沒有涵蓋真實意圖時，模型被迫在錯的 choices 中選一個，後面的 confidence gate 也救不了 ontology。Agent runtime 應該提供 **unknown**、**needs_more_context** 或人工升級的路徑，而不是只增加選項數。

## 結語：把 Jev 當成一個可測量的邊界

Jev 目前最有趣的工程位置，是 Agent 與工具之間那個常被一段 prompt 或一個 parser 草草帶過的狹窄邊界。Confidence-gated routing 讓升級條件可觀測；speculative fan-out 讓獨立判斷不必逐題等待；composite scoring 則提供一種把多個 dimensions 暴露給 policy engine 的方法。

但這些 pattern 的價值，取決於團隊是否願意把 question schema、threshold、權重、fallback、review 與 trace 都當成正式的 runtime contract。若只把 Jev 接到 agent 後面，然後把一個高 confidence 數字當成「可以執行」，系統只會更快地掩蓋錯誤。

對實作者來說，下一步可以很小：

1. 先從一個唯讀、可回放的 intent router 開始。
2. 為每個 decision 保存 state snapshot、question version、confidence 與 policy version。
3. 以人工 label 和 risk-weighted metrics 校準 threshold，而不是照抄範例數字。
4. 把 tool broker 和 side-effect gate 留在程式碼，不把權限交給模型。
5. 等 failure taxonomy 穩定後，再評估是否需要接入 MCP、Home Assistant 或更長的 Agent loop。

如果你還沒看過基本介面，先讀[TypeSafe AI 與 Jev 的決策元件拆解](/blog/107-typesafe-ai-jev-system-one/)；若要把它放進更完整的 agent contract，可接著看[Agentic AI platform contract](/blog/93-agentic-ai-platform-contract/)。最後，任何 latency 或成本比較都應回到[LLM inference cost 的測量方法](/blog/94-llm-api-pricing-inference-cost/)檢查，不要只看產品頁上的單一倍數。

## 來源與延伸閱讀

- [TypeSafe AI：Introducing System One Models and Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) — 官方 launch post，包含模型定位、互動 demo、workflow eval 與 cardinality 說明。
- [TypeSafe Docs：Introduction](https://docs.typesafe.ai/introduction) — Jev 的 state、typed questions 與 Choice／Score／Noul 基本契約。
- [TypeSafe Docs：Patterns](https://docs.typesafe.ai/patterns) — Confidence-Gated Routing、Speculative Fan-Out、Composite Scoring 與 Intent Routing。
- [TypeSafe Evals](https://evals.typesafe.ai/) — 官方 workflow eval harness 與四種 workflow 的測量說明。
- [System One Adapter for Python](https://github.com/typesafe-ai/system-one-adapter-python) — 官方 SDK repository，用於比較不同 System One provider。
- [HA-Jev](https://github.com/AboveColin/HA-Jev)、[typesafe-mcp](https://github.com/itsmostafa/typesafe-mcp)、[OpenJev](https://github.com/daseinlabs/open-jev) — 獨立社群／研究實驗；不代表 TypeSafe 官方支援或生產可靠性保證。
