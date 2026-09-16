---
title: "Tool Call 成功，Workflow 仍失敗：Agent–Tool Boundary 的外部效應異常"
description: "深讀 Agent–Tool Boundary 的 effect-history 模型：為什麼單次 tool call 回傳成功，仍不足以保證長流程的外部世界狀態一致，以及 MCP annotation 與交易式工具契約究竟填補了哪些空白。"
pubDate: 2026-09-16
updatedDate: 2026-09-16
tldr:
  - "這篇論文把 agent 的 runtime observation 與外部世界真正發生的 effect 分開，整理出八種在 retry、speculation、concurrency 與 partial failure 下反覆出現的 effect anomalies。"
  - "A1–A8 不是八個 API error code，而是一組 workflow-level external-effect anomaly vocabulary；作者再依它們組成四種 safety guarantee profiles。這八種 duplicated、missing、orphaned、residue、premature、contaminated、conflicting 與 phantom effect，各自需要不同的 outcome、compensation、dependency、coordination 或 visibility 能力。"
  - "作者對 2026-07-27 的官方 MCP registry snapshot 做 census：可匿名查詢的 remote subset 中有 98,291 個 tools；74.0% 至少序列化一個標準 annotation，但四個 advisory hints 仍沒有表達 idempotency key、status、prepare/commit 或 compensation 的能力。"
  - "最重要的工程結論是：black-box call 若沒有 authoritative one-outcome primitive，就不能在不增加額外協定的情況下保證 unknown-safe 與 compensation-safe；tool call success 不是 workflow commit。"
audience:
  - "設計長流程 agent、工具平台、MCP server 或外部副作用治理的 AI 工程師"
  - "需要把 retry、審計、補償、併發控制與安全 profile 接在一起的 platform owner"
tags: ["Paper Reading", "Agent Systems", "Tool Use", "AI Engineering", "Evaluation", "Safety"]
image: "/paperReading/49-tool-calls-workflows-fail/title_image.webp"
field: "AI Systems"
difficulty: "advanced"
showToc: true
topics:
  - agent-safety-governance
  - tool-use-coding-agents
  - agent-evaluation-observability
paper:
  title: "When Tool Calls Succeed but Workflows Fail: Anomalies at the Agent–Tool Boundary"
  authors:
    - "Artem Trofimov"
    - "Boris Novikov"
  year: 2026
  venue: "arXiv 2609.15397 v1（2026-09-14；未同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2609.15397v1"
    arxiv: "https://arxiv.org/abs/2609.15397"
    doi: "https://doi.org/10.48550/arXiv.2609.15397"
    code: "https://github.com/flame-stream/mcp-annotation-census"
    project: "https://arxiv.org/html/2609.15397"
series:
  id: "agent-tool-boundary-reliability"
  title: "Agent 工具邊界與效應可靠性"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文

- **問題**：一個 agent workflow 可能先建立訂位、再扣款、再寄送確認信。每一個 tool 都可能回傳成功、失敗或 timeout，但 workflow 真正關心的是外部世界發生了哪些不可逆 effect，以及這些 effect 是否仍然存活。若 runtime 只看最後一個 response，retry、speculation、併發與 crash 都會讓「call 成功」和「事情完成」脫鉤。
- **核心洞見**：把 external effect history 與 runtime observation 分成兩層。一次 attempt 可能得到 unknown，而 externalize 可能已經發生；反過來，runtime 也可能看見成功，但之後的 commit、abort 或 compensation 沒有形成預期的世界狀態。workflow safety 要談的是 effect history，而不是單次 API response。
- **最強證據**：Section 3 的 Table 2 將八種 anomaly 對到所需 boundary capabilities；Section 5 對 2026-07-27 MCP registry snapshot 做 98,291-tool census。74.0% 的 tool 至少有一個標準 annotation，61.7% 同時有四個，但 Table 4 顯示這些 hints 對 A2–A8 都沒有提供足夠的 transactional guarantee。
- **主要邊界**：這是 effect-history vocabulary、coverage conjecture 與 runtime-contract 分析，不是八種 anomaly 已在所有 production agent 中測出的 prevalence study。對 ACRFence、RAC、Atomix、Cordon、CoAgent 與 Shepherd 的 coverage 是作者整理的 partial/stated comparison，不等於形式證明。

我的 bounded verdict 是：**這篇論文最有價值的產物不是「再做一層 retry wrapper」，而是一個能迫使團隊把 outcome uncertainty、補償、相依、共用資源與外部可見性寫進 tool contract 的檢查表。若工具邊界沒有 authoritative outcome 或 prepare/commit，系統就應該誠實地暴露 unknown，而不是把一個漂亮的 success response 當成 exactly-once。**

> **花花的工程提醒**
>
> 對外部副作用而言，success 是一次觀測，不一定是事實。訂位、付款、寄信或刪除資料都應有可查詢的 logical-operation identity、狀態 endpoint 與明確的未知狀態；否則 retry policy 很容易把網路不確定性轉成重複扣款、孤兒補償或無法撤回的外部反應。

## 版本、來源與讀者問題

本文讀的是 [When Tool Calls Succeed but Workflows Fail](https://arxiv.org/abs/2609.15397) v1，arXiv 顯示於 2026-09-14 提交，作者為 Artem Trofimov 與 Boris Novikov。它是 arXiv preprint，未經同儕審查；本文不把作者提出的 capability mapping 或 runtime comparison 寫成已證明的 production guarantee。我核對了[完整 arXiv HTML](https://arxiv.org/html/2609.15397)、[PDF](https://arxiv.org/pdf/2609.15397v1)、Tables 1–4、Sections 2–6、Appendix 的 open-world interaction 說明，以及作者提供的 [MCP annotation census repository](https://github.com/flame-stream/mcp-annotation-census)。

這篇文章的讀者問題是：**當一個長流程 agent 要對外部世界做不可逆操作時，tool boundary 必須宣告什麼，runtime 才能知道何時可 retry、何時必須等待、何時能 compensation，以及何時只能把結果標成 unknown？** 這個問題接在 [K-Bench 的 agent-level leakage evaluation](/paper-reading/46-k-bench-agentic-unlearning/)、[ReAct trace 的即時解析](/paper-reading/43-parsing-the-stream-live-trace/) 與 [evaluation/observability 的 evidence view](/paper-reading/47-reva-reusable-evidence-views/) 後面讀很合適：既有文章談 agent 如何被治理、觀測與評估，本篇則追問 boundary contract 是否足以支撐那些控制。

## 證據地圖：Paper、Evidence 與 Bloss0m judgment

| 層次 | 本文採用的說法 |
| --- | --- |
| **Paper 直接支持** | Effect history 與 observation 的分離；八種 anomaly 的定義；四種 safety guarantee profiles；契約 family；MCP 2025-03-26 的四個 advisory annotations；registry census 的抽樣流程、數量與 annotation 分布；四個 black-box guarantee boundaries；研究範圍與明確排除項目。 |
| **作者主張** | A1–A8 是可重複辨認的 agent–tool boundary anomaly vocabulary；現行 runtime 多半只做 partial coverage；標準 MCP hints 能表達 call-level intent，卻不足以表達完整 transactional capability。 |
| **Evidence 沒有建立** | 八種 anomaly 在真實服務的發生率、任何特定 runtime 的完整安全證明、所有 MCP server 的 annotation 品質、不同產業對 compensation 的語義正確性，以及某一個 contract family 能普遍消除 workflow failure。 |
| **Bloss0m 工程判斷** | 將 tool schema 視為 effect protocol 的最小入口，而不是完整交易協定；把 unknown、reconcile、compensation 與 mediation 當作一等 observability state，並以 workflow-level invariant 驗證，而不是只測 tool-level success rate。 |

### Paper Essence Contract

1. **它解決什麼問題？** 解決 agent 以多個外部 tool 執行長流程時，單次 call 的 response 與外部 effect history 不一致所造成的可靠性盲點。
2. **為什麼既有做法不夠？** 只靠 timeout、retry、idempotent hint 或事後 compensation，無法同時處理 unknown outcome、跨 tool atomicity、非交換 effect 與 open-world reaction；每一種手段都只覆蓋部分 anomaly。
3. **核心技術想法是什麼？** 以 effect history 描述 attempt、externalize、commit、abort、compensation、dependency、commutativity 與 observation，再用 capability contract 與 safety profile 推導哪些 boundary protocol 仍缺失。
4. **一個 input 怎麼走？** workflow intent → tool attempt → external observation → resolve / retry / commit / compensate → verify surviving effects；若 observation 是 unknown，runtime 不應直接跳到下一步不可逆操作。
5. **什麼證據支持 headline claim？** Table 2 的 anomaly-to-capability mapping、Table 3 的 runtime coverage comparison、Table 4 的 MCP capability matrix，以及 Section 5 對 98,291 tools 的 annotation census。
6. **claim 在哪裡停止？** 論文沒有執行這些 runtime 的共同 benchmark，也沒有證明任一 annotation 被 server 作者正確實作；它提供分析框架與 boundary argument，不提供 production SLA 或 exactly-once implementation。

## 既有方法為什麼不夠

傳統方法通常把可靠性縮成三個局部旋鈕：遇到 timeout 就 retry、在 schema 上加一個 idempotent hint，或在後續步驟失敗時呼叫 rollback。這些旋鈕各自合理，卻沒有回答「原始 effect 到底有沒有發生」以及「rollback 是否真的中和了它」。如果沒有 authoritative outcome，retry 可能複製 effect；如果沒有 precise target，rollback 可能補償錯對象；如果 effect 已經被外部看見，任何內部 rollback 都不能保證撤回 reaction。論文的 prior-approach limitation 正在這裡：單次 call 的語義與 workflow 的世界狀態不是同一層。

## 核心直覺：先看 boundary，不急著 retry

把每個外部操作想成穿過一扇門。門內的 runtime 能看到 request、timeout 與 response；門外的世界可能已經建立訂位、扣款或觸發 webhook。若門只回傳 success/failed，agent 其實缺少「這一次 logical operation 的 authoritative history」。安全的第一反應不是猜一個布林值，而是保留 unknown，尋找 status 或 reconcile path，再決定是否 retry、commit 或 compensation。這個 mental model 也能解釋為什麼一個看似成功的 local trace，仍可能對應到多個不同的外部世界。

## Bloss0m 工程化：把論文轉成一條 runtime checklist

### 方法步驟：從 intent 到 reconciliation

以下不是作者提出的 runtime algorithm，而是我根據 effect-history 與 contract requirements 整理出的工程實作順序。論文實際做的是：定義 effect-history model、建立 anomaly catalog、對應 required capabilities、組成 contract families、推導 black-box guarantee boundaries，再用 MCP census 檢查現有 interface 能表達多少。下面五步是工程 synthesis，不要把它誤讀成作者的演算法：

1. **Declare**：把 workflow intent 拆成 logical operations、required effects、dependencies、shared-resource scope 與 visibility boundary。
2. **Attempt**：送出 tool call，並把 attempt identity、參數、時間與 observation 分開記錄。
3. **Resolve**：對 confirmed、failed、unknown 走不同 protocol；unknown 必須先查 authoritative status 或進入 reconciliation。
4. **Release**：只有 required outcomes resolved，且 dependency、commutativity、compensation 或 mediation 條件滿足，才 commit 或 externalize。
5. **Verify**：在 abort 或 compensation 後檢查 survives/effect residue，並把 downstream reaction 留在 audit trail。

這個流程不要求所有 tool 都支援完整交易；它要求 runtime 把缺失能力顯式標出，讓產品能選擇安全降級、人工確認或拒絕執行。

## 為什麼 Tool Boundary 是相對的？

原論文的 transaction reasoning 不是只有一層，而是採用 multilevel transaction management 的觀點：L0 是 agent 看到的 atomic tool operation；L1 是由多個 L0 組成的 workflow；更上一層還可能把整個 L1 workflow 當成一個 operation。`book_flight()` 對 agent 看似一次 atomic call，對 provider 內部卻可能仍是一段看不見的 workflow。於是，每一層 composition 的 correctness，都依賴下一層 boundary 暴露出來的 outcome、ordering 與 effect semantics；上層不能憑空推導下層沒有宣告的 guarantee。

```text
L2   Travel Agent
     │
     ▼
L1   BookTrip workflow
     ├─ book_flight()
     ├─ reserve_hotel()
     └─ charge_card()
             │
             ▼
L0   External Tool Boundary
             │
             ▼
     Provider's hidden workflow
```

這張圖是 Bloss0m 根據 Section 2 的 multilevel transaction 觀點整理的 explanatory diagram，不是論文原圖或額外實驗。`book_flight()` 若沒有提供可查詢的 logical operation、狀態解析與 externalization semantics，L1 即使完整記錄自己的 trace，也不能證明 provider 內部 workflow 只發生一次。

## 具體例子（worked example）：一次訂位流程怎麼壞掉

假設 agent 收到「替兩位客人訂下週五晚上的座位，成功後寄 confirmation」這個 request。它依序呼叫 reserve_table、charge_card 與 send_email。第一個呼叫送出後，client 等不到 response；runtime 看到的是 unknown。如果它立刻 retry，餐廳可能已經建立了第一筆訂位，於是第二次又建立一筆相同訂位。這是 A1 duplicated effect，不是普通的 HTTP retry bug，因為世界狀態可能已經有兩個 reservation。

更直接的 A3 可以用付款表示：

```text
pay_invoice()
↓ timeout / unknown
↓ 不知道付款到底有沒有成功
↓ 直接 refund
↓ 但原付款可能根本沒發生
```

A3 的核心不是「補償可能碰到另一個 reservation」，而是在原始 outcome 尚未解析時就採取 compensation；Table 2 因此要求先 resolve outcome，再做有條件、能精確綁定 target 的 compensation。訂位例子保留給 A1 的 duplicate effect；A8 的外部反應則放到後面單獨拆解。

這個例子有三個需要分開的問題：

- **Outcome**：reserve_table 到底成功、失敗，還是只是不知道？
- **Lifecycle**：一次 effect 是否 staged、committed、aborted、compensated，compensation 是否真的 neutralize？
- **Coordination**：另一個 concurrent workflow 是否同時操作相同座位、同一張卡或同一個 notification channel？

沒有這三層，agent 能記錄完整 trace，仍不代表它能從 trace 推回真實 world state。

## Effect history 模型：把 observation 與世界事件拆開

Section 2 的 vocabulary 不假裝 runtime 能直接看到所有真實事件。對一個 workflow w，可以先把 attempt 記為 attempt(a, ℓ)，代表 logical operation ℓ 的一次執行嘗試；把對外部世界產生的 effect 記為 externalize(q, e)，把 runtime 得到的結果記為 observe(a, s)，其中 s 可以是 confirmed、failed 或 unknown。這個分離很重要：observe(a, unknown) 並不蘊含 not externalize(e)。

論文還把幾個容易被混在一起的關係分開：

- cmp(c, a) 表示 compensation c 是針對 attempt a；
- neutralizes(c, e) 表示 compensation 是否真的中和 effect e；
- dep(e2 ← e1) 表示 effect e2 依賴 e1；
- commute(e1, e2) 表示兩個 effect 的順序是否可交換；
- commit(w) 與 abort(w) 是 workflow-level release decision；
- Req(w) 是 workflow 需要的 effect 集合，resolved(w) 表示 required outcomes 已被解析；
- survives(e) 表示 effect 在 abort 或 compensation 後仍留在外部世界。

這套符號的用途不是讓每個產品都實作 theorem prover，而是強迫設計者問：「我現在處理的是一次 response，還是已知的 external outcome？」例如 idempotentHint=true 最多描述作者對某個 call 的意圖，並不自動提供 logical-operation ID、重試時的原始 outcome，或跨 tool 的 atomic commit。

## L0 operation 的五個維度

Section 2 進一步把每個 L0 operation 的契約問題拆成五個維度。它們不能被壓縮成一條「可逆／不可逆」的軸，因為 operation pair 的 commutativity 與單一 operation 的 idempotence 可能各自不同：

- **Idempotence**：同一個 logical operation 被重送時，是否會產生額外 effect，或能回傳原本的 outcome。
- **Invertibility**：是否存在真正能中和 effect 的 inverse；「有一個看起來像 cancel 的 API」不等於一定能 neutralize 原 effect。
- **Externalization timing/control**：effect 何時穿過 boundary 被外部看見，以及能否先 quote、dry-run、hold 或延後 release。
- **Determinism**：相同 logical input 是否會得到可預期的決策與 effect。這對 black-box、LLM-backed tool 特別重要：同一個 request 在 retry 時可能產生不同 decision 或 effect。
- **Commutativity**：兩個 operation 在共享 resource 上交換順序是否仍得到等價結果；它是 operation pair 的關係，而且可能依 state 而變化。

最後兩點很容易被一般 retry 設計忽略：determinism 讓 replay comparison 有意義，但本身不會讓 retry 安全；commutativity 則不能只寫在單一 tool 的 metadata 裡。上述是論文的 framework concern，不是本文對 LLM retry 行為做出的測量結果。

## 八種 effect anomalies 與需要的 boundary 能力

下表是 Table 2 的可操作版本。左側是 anomaly 的最小形狀，中間是為什麼一般 retry/rollback 不足，右側是 boundary 至少要能提供的能力。能力本身也不是自動保證；runtime 還需要用正確 protocol 使用它。

| ID | 外部效應異常 | 典型形狀 | 需要的 capability |
| --- | --- | --- | --- |
| A1 | **Duplicated effect** | 一個 logical operation 在 unknown 後被 externalize 兩次。 | Authoritative convergence、logical-operation ID、idempotent re-issue 與 original outcome lookup。 |
| A2 | **Missing committed effect** | workflow 被 commit，但 required effect 並未發生或未完成。 | Authoritative outcome 加上 atomic multi-effect participation；例如 status endpoint 或 prepare/commit。 |
| A3 | **Orphaned compensation** | outcome unknown 時先做 compensation，結果 compensation 沒有對到原始 effect。 | 先 resolve outcome，再做 conditioned compensation；需要 outcome query 與可精確綁定的 compensation。 |
| A4 | **Uncompensated residue** | abort 之後外部 effect 仍然存活。 | Residue prevention 或可驗證的 safe neutralization；通常需要 staging 或可靠 compensation。 |
| A5 | **Premature externalization** | effect 在 workflow outcome 尚未確定前已被外部觀察，之後可能不存活。 | Pre-externalization control，例如 quote、dry-run、expiring hold 或可延期 release。 |
| A6 | **Contaminated speculation** | 最終 commit 的 effect 依賴一個後來不存活的 speculative effect。 | Dependency observability、stable resource/effect identity 與 commit gating。 |
| A7 | **Conflicting externalization** | 兩個獨立 workflow 對共享資源產生非交換、無序的 effects。 | Shared-resource coordination、scope、commutativity declaration、mediator 或 ordered release。 |
| A8 | **Phantom compensation** | 被 compensation 的 effect 已引發 exogenous reaction，反應本身仍存活。 | 控制 external observability，或以 mediated observation 限制不可撤回的外部反應。 |

### Safety profiles 不是 all-or-nothing label

論文將 guarantee profile 分成四層，這比宣稱「transaction-safe」更精確：

1. **Unknown-safe**：A1–A3 的核心是遇到 unknown 時不重複、不漏 commit、不先補償錯對象。
2. **Compensation-safe**：A4 需要 compensation 正確、可成功執行，且 residue 能被驗證清除。
3. **Speculation-safe**：A5–A6 需要在外部化前控制 release，並能觀測依賴與 speculative state。
4. **Externally-mediated**：A7–A8 需要外部 mediator 或足夠的 visibility control；不是把黑盒工具包在 agent loop 裡就能取得。

A3 是 action-time anomaly；A5 與 A7 則是 profile-relative 的 preventive patterns。不是所有 workflow 都需要禁止 early externalization 或 unmediated concurrency，取決於系統宣告的 safety profile；一個 read-only lookup 可能不需要同一種 safety，一次付款或公開發信則需要更嚴格的 outcome 與 visibility contract。

## 四個黑盒邊界：為什麼「在上面再包一層」仍不夠

### 1. 沒有 authoritative one-outcome primitive，就沒有普遍 exactly-once barrier

如果 unreliable channel 讓 runtime 不知道 attempt a 是否已 externalize，而 tool 又沒有以 logical-operation ID 查詢 authoritative outcome 的方法，retry 可能造成 A1，commit 可能造成 A2，compensate 可能造成 A3，直接 abort 又可能留下 A4。等待也只是在延後放棄，不會把 unknown 變成 resolved。這不是 prompt engineering 能修好的問題。

### 2. 沒有 mediation，就無法對非交換且不可逆 effects 提供一般性的 conflict repair

若兩個 workflow 分別對共享帳戶、庫存或門票做不可逆的非交換操作，事後才發現 ordering conflict 時，在沒有 operation-specific reconciliation 的前提下，agent 沒有一般性的 repair。常見解法是事前 coordination、資源 scope、鎖定、序列化 release，或把 effect 交給能裁決順序的 mediator；但不是每個案例都必須使用 mediator，若 resource 自己能排序或 operation 有可靠的 reconciliation，保證邊界就不同。

### 3. open-world reaction 不一定能被 compensation 撤回

刪除一筆內部資料與撤回一個已被 webhook、使用者、搜尋引擎或第三方讀到的反應是不同問題。A8 更精確的 effect sequence 是：`offer sent → supplier sees it → supplier acts → offer withdrawn successfully`。原始 offer effect 確實成功被 neutralize，但 supplier reaction 已經是新的 effect，仍然存活。這不是 compensation API 只改了內部 state，而是 compensation 即使 100% 成功，也不能讓世界回到事情從未發生。

### 4. 多工具的 irreversible effects 不能在 tool layer 之上假裝 atomic

若付款、出貨與發信分屬不同工具，agent orchestration layer 無法僅靠順序呼叫把三者變成一個 atomic release。crash 可能留下部分 externalization；此時 A2（少了一個 required effect）與 A4（留下不該存活的 residue）是同一個部分提交問題的兩面。prepare/commit、staging 或可補償的 saga contract 必須在 boundary 內被支援。

## MCP annotation census：有 intent hint，不等於有 transaction capability

Section 5 的 census 使用官方 MCP registry 在 2026-07-27 的 snapshot：registry 有 59,625 entries、18,688 個 distinct servers；9,234 個 remote targets 被匿名查詢，4,838 個回傳至少一個 tool，4,318 個連線失敗，74 個 timeout，4 個沒有 tools，最後取得 98,291 個 tools。這個方法只代表可匿名 reach 的 remote subset，不代表所有 registry server，也不代表作者意圖在 production 中正確。

在 98,291 個 tools 中：

- 74.0% 至少序列化一個標準 annotation；
- 61.7% 同時序列化 readOnlyHint、destructiveHint、idempotentHint 與 openWorldHint 四個欄位；
- 最常見的四欄 signature 佔 39.9%，沒有 annotation 的佔 26.0%，前三個 signature 合計 75.8%；
- destructiveHint 出現在 65.8% 的所有 tools，但在研究者認為可能適用的 non-read-only subset 只覆蓋 12.9%；實際被歸類為 destructive 的 tools 只有 3.1%；
- 只有 66/81 種 signature 被觀察到，且同一 server 使用多種 signature 時，主導 signature 的 median share 是 79.4%。

這些數字支持「annotations 被廣泛使用但仍很粗」的主張，卻不支持「annotation 能保證安全」。MCP 2025-03-26 的四個欄位主要是 advisory boolean hints：read-only、destructive、idempotent、open-world。它們沒有標準化 logical-operation key、authoritative status、compensation target、staging/prepare/commit、dependency graph、commutativity pair/resource 或 external visibility policy。

因此 Table 4 的 capability matrix 很保守：A1 最多得到有限的 idempotence hint；A2–A8 都是 No。這個 No 不表示任何 server 私下沒有能力，而是表示四個標準 annotation 沒有把能力完整、可機器驗證地表達出來。對 platform 團隊來說，這是 schema design gap，不是把欄位名稱換得更漂亮就能解決的 documentation gap。

## Runtime coverage：partial 不是安全證書

Table 3 對 ACRFence、RAC、Atomix、Cordon、CoAgent 與 Shepherd 的整理顯示，現有 runtime 各自覆蓋不同切片：

- ACRFence 對 A1 是 partial；
- RAC 對 A4 是 partial；
- Atomix 涵蓋 A1/A3、A4、A5/A6，並在 assumptions 下 partial 涉及 A7；
- Cordon 對 A1/A3/A4/A5 是 partial；
- CoAgent 對 A7 是 partial；
- Shepherd 以 per-effect reversibility tiers 觀測 A7；
- 沒有列出的 runtime 完整覆蓋全部 A1–A8，也沒有 runtime 控制 A8。

作者明確把這個 mapping 稱為 conjectural scope/coverage，而不是 theorem。外部效應模型也排除 semantic planning error（例如把「台北」規劃成「東京」）、read-side anomalies、security/policy violations、contract misclassification、除 A7 外的 intra-execution ordering，以及 liveness。這些限制很重要：即使 boundary contract 完整，agent 仍可能做出錯的商業決策，或把一個合法但不該做的操作送出去。

## Artifact audit：#49 能重現什麼，不能重現什麼

截至 2026-09-16，我直接檢查了作者的 [mcp-annotation-census repository](https://github.com/flame-stream/mcp-annotation-census)。repository 公開、MIT license、未 archived；主分支目前可取得，最新可核對的 commit 為 5c24643d447402fc7bf8096555f72859b2c126cb。README 說明它是一個單檔 Python tool，要求 Python 3.10+ 與 mcp>=1.25,<2，只呼叫 remote MCP 的 tools/list，不會呼叫或執行任何 tool。

artifact 狀態分成四類：

1. **Code：可取得**。census script 與執行說明在 GitHub repository，適合檢查方法、欄位解析與離線統計。
2. **Data：部分可取得**。repository 的 output_full2/registry_snapshot.json 是約 90 MB、標示 2026-07-27 snapshot 的 shipped snapshot；我也核對了 raw snapshot 與 tools.csv endpoint 可回應 range request。這讓離線重算成為可能，但不等於 registry 永遠不變。
3. **Model/checkpoint：不適用／未提供**。本研究不是訓練模型或比較 checkpoint 的 paper，沒有 model weights、inference endpoint 或 model benchmark。
4. **Demo：未提供 interactive demo**。repository 是分析工具；沒有把它包成可操作的 web demo。artifact 入口與 LICENSE 仍應按照 MIT 與 GitHub repository 的條款使用。

所以可重現的是 snapshot 上的 annotation census pipeline，不是「任何時間從 registry 得到相同 98,291」的保證。要重做完整數字，仍要鎖定 snapshot、MCP client version、匿名連線時刻、timeout/retry policy 與 registry 的可達性；不要把 remote reachability failure 直接當成 server 沒有 tool。

## 設計決策：什麼時候該採用哪一種 contract

如果 tool 只讀取公開資料，unknown 的成本可能主要是 stale answer；仍要有 timeout、trace 與 freshness。但如果 tool 會扣款、改庫存、發信、刪檔或觸發 webhook，最小設計不應只有 idempotentHint：

- 為每個 logical operation 提供 client-supplied id、可重複查詢的 status/outcome endpoint，以及原始 outcome 的保留時間；
- 將「預覽／報價／dry-run」與「真正 externalize」分開，讓 agent 能先建立 quote 或 expiring hold；
- 對 compensation 宣告 target identity、前置條件、是否可重試，以及如何驗證 neutralization；
- 對跨 tool 流程使用 prepare/commit、staging 或 saga step，並把 partial commit、residue、reconciliation 納入 state machine；
- 對共享資源宣告 scope、版本、commutativity 或 mediator ownership，而不是只在 prompt 裡要求「小心競態」；
- 對已經可被外部 actor 看見的 effect，記錄 observation boundary 與 downstream reaction，讓 A8 成為顯式風險。

**何時不要使用這套 vocabulary 當成充分解法？** 如果問題是錯誤的目的地、錯誤的 SQL、權限濫用、提示注入或服務本身 liveness，A1–A8 不能取代 policy validation、semantic evaluation、authorization 與 availability engineering。它是一個 boundary lens，不是整個 agent safety program。

## 限制與下一步閱讀

**對論文的限制**：anomaly catalog 的 coverage 是分析性與 conjectural；沒有共同 runtime benchmark、production frequency measurement 或跨產業 trace。MCP census 只覆蓋能匿名連線的 remote subset，annotation value 也沒有被逐一人工驗證。A8 依賴外部可見性與 open-world actor；若實際系統沒有 visibility control，形式化的 repair 仍受限。另有幾個明確的 out-of-scope：semantic planning error、read-side anomaly、policy violation、錯誤契約分類、liveness 與一般 ordering。

**對採用者的限制**：不要先問「哪個 runtime 支援最多 anomaly」，而要先定義自己的 effect invariant。對付款系統，可能要求「每個 customer intent 最多一筆 settled charge」；對寄信系統，可能只能保證「最多一次送入 provider queue」，而不能保證收件人只看見一次。只有把 invariant 寫成可查詢狀態，才有辦法選 status、compensation 或 mediator。

下一步可讀 [Continuity Security 的 context contract](/paper-reading/45-continuity-security-context-contracts/)，看 agent memory 如何處理跨回合的 security state；再讀 [ReVA 的 reusable evidence views](/paper-reading/47-reva-reusable-evidence-views/)，把本篇的 effect history 對接到可審計的 evaluation view；若要回到更低層的 trace observation，讀 [Parsing the Stream](/paper-reading/43-parsing-the-stream-live-trace/)。

## 三個記憶點：離開前請帶走

1. **Tool response 不是 world state**：success、failed、unknown 是 observation；externalize、commit、abort 與 survives 才描述 workflow 對外部世界留下什麼。
2. **八種 anomaly 需要不同能力**：idempotency 只能碰到 A1 的一部分；A2–A8 還需要 outcome resolution、compensation、staging、dependency、coordination 或 visibility control。
3. **沒有 boundary protocol 就不能假裝 exactly-once**：MCP advisory annotations 能表達意圖，但不能單獨保證 logical operation identity、atomic release、可驗證補償或外部反應可撤回。

## 原始來源與延伸資料

- [arXiv abstract and metadata](https://arxiv.org/abs/2609.15397)
- [Full arXiv HTML, including Tables 1–4](https://arxiv.org/html/2609.15397)
- [Versioned PDF](https://arxiv.org/pdf/2609.15397v1)
- [MCP annotation census code and snapshot](https://github.com/flame-stream/mcp-annotation-census)
- [MCP specification revision 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26)

### 圖像說明

<!-- paper-reading-no-body-figures: arXiv:2609.15397v1 exposes no material figure assets; evidence is presented in Tables 1–4 only. -->

原論文 v1 的 HTML 沒有 figure 元素，也沒有 material figure asset；論文把主要 evidence 放在 Tables 1–4 與正文的 effect-history 定義、census 方法與 capability argument。依此使用明確的 no-body-figure exception：本文不把 Evidence Atlas cover 當正文 figure，也不把不存在的 figure 以裝飾圖補足。這個例外只適用於原文沒有足夠 figures 的 #49，不代表其他 paper 可以跳過原始圖檔與 caption provenance。
