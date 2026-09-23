---
title: "GitHub Agentic Workflows：把可執行的 Agent CI 寫成 Runtime 契約"
description: "從 gh-aw v0.89.17 與其官方變更紀錄拆解：日誌稽核、MCP Gateway／防火牆、grading、模型成本訊號與 incident loop 如何把 Agentic CI 從 demo 推向可營運的契約。"
pubDate: 2026-09-22
updatedDate: 2026-09-22
tldr:
  - "Agentic CI 的 production contract 不只是 workflow 能跑，而是每次執行都能留下可稽核證據、受邊界保護、被一致評分，並能在失敗後回到 incident loop。"
  - "gh-aw v0.89.17 把 cached logs、multi-target fairness、MCP Gateway／AWF 版本、native tool-call grading 與 AIC accounting 放在同一個 runtime hardening 故事裡。"
  - "模型 alias 與 pricing catalog 是成本控制的輸入訊號，不是成本保證；模型價格、實際 token、重試與工具流量仍要分開觀測。"
  - "本文核對的是 GitHub 專案自己的 release、PR、workflow 與 incident issue；沒有把這些 first-party evidence 誇大成獨立可靠性 benchmark。"
audience:
  - "設計 Agentic CI、AI workflow runtime 與 MCP 平台的工程師"
  - "需要把 Agent demo 接上稽核、成本、評測與 on-call 流程的平台與 SRE 團隊"
category: "Cloud & Platform"
tags: ["AI Agent", "Platform Engineering", "MCP", "Evaluation", "Governance"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 17
kind: "article"
showToc: true
image: "/blog/116-github-agentic-workflows-runtime-contract/title_image.webp"
---

Agentic CI 最容易被誤判的時刻，是第一次成功跑完的時候。Workflow 能收事件、叫模型、呼叫工具、開 issue，看起來已經是一個產品；但正式環境真正需要的不是「它會不會跑」，而是每次跑完能不能說清楚發生了什麼、為什麼被允許、如何被評分、花了多少資源，以及失敗後誰接手。

GitHub Agentic Workflows（`gh-aw`）在 [2026 年 9 月 21 日的 weekly update](https://github.github.com/gh-aw/blog/2026-09-21-weekly-update/) 裡，將 v0.89.17 描述成一次 reliability hardening：改進 logs auditing、更新 model catalog、升級 MCP Gateway 與 `gh-aw-firewall`，並讓 automatic grader 看見 native Copilot tool calls。這些變更很適合當成一張 runtime 契約的切面來讀，而不是一串孤立的 release notes。

> **花花的一句話**
>
> Agentic CI 的契約不是「模型成功回答」，而是每次執行都能被授權、觀察、評分、計費與復原。

本文聚焦五個互相咬合的控制面：日誌稽核、MCP gateway／firewall 邊界、grading、模型與成本訊號，以及 incident-monitoring loop。先說清楚證據界線：weekly update 與 [v0.89.17 release](https://github.com/github/gh-aw/releases/tag/v0.89.17) 是專案自己的報告；我另外核對了它連到的 PR、workflow 定義與 incident issue，確認變更描述和可見的實作／交付物相互一致。但這仍是同一個 GitHub 專案內的 first-party verification，不是外部團隊重跑後的獨立可靠性研究。

## 從「可跑」到「可營運」少了哪些欄位？

一個可營運的 agentic workflow 至少要能回答下面五個問題：

| 契約問題 | Runtime 必須提供的證據 | 沒有時的風險 |
| --- | --- | --- |
| 這次到底執行了什麼？ | run、tool、輸出與下載統計的可回放紀錄 | 失敗只能靠猜，稽核無法重建上下文 |
| Agent 為何能碰到這個工具？ | MCP gateway、網路 allow-list、firewall 與權限邊界 | prompt injection 或誤用工具直接擴大 blast radius |
| 這次算成功嗎？ | 包含 native tool calls 的 trace 與可重現 grading | 只評最終文字，忽略危險或無效的中間行動 |
| 成本是否可解釋？ | model alias、pricing mirror、AIC／token／重試等訊號 | 模型換名或 catalog 漂移後，帳務仍看似正常 |
| 出事後誰接手？ | deployment event、去重 issue、root-cause evidence | 同一個根因製造大量重複告警，沒有人知道狀態 |

這張表的重點是「契約欄位」而不是「元件清單」。加一個模型或一個 MCP server，不會自動補上證據、授權、判定與復原。

## 1. Logs audit：不是把 log 存起來，而是保留可比較的證據

v0.89.17 的 logs 變更有三個層次。第一，`logs --cached-jsonl --audit` 不再繞過本地已有的 run data、重新下載 artifacts；[PR #61871](https://github.com/github/gh-aw/pull/61871) 的描述指出，audit mode 會盡力重用 matching usage-only cache，並在資料不完整時產生 partial audit。第二，[PR #61027](https://github.com/github/gh-aw/pull/61027) 把 multi-target logs 查詢改成 round-based scheduling：每個 active target 每輪先取得一次機會，再進下一輪，保留全域 count、storage、rate-limit、timeout 與 cancellation 控制。第三，weekly update 提到 per-run download duration／size 會進入 end-of-run stats summary；對應的 [PR #60951](https://github.com/github/gh-aw/pull/60951) 是官方連結的變更來源。

這些修改共同回答一個常被忽略的問題：**稽核本身會不會改變被稽核的系統？** 如果每次查詢都重新抓取 artifacts，成本、延遲與 API 壓力會污染操作；如果多個 target 由先完成者一直消耗批次，某些 repository 的證據又會被排在後面。Cache reuse、fair scheduling 與下載統計讓 logs audit 比較接近可重複的觀測流程。

但「cache hit」不等於「證據完整」。PR #61871 的公開 review 也留下了重要限制：不完整的 cached run evidence 可能讓 comparison delta 不準。因此 runtime 契約應把 `cache source`、資料完整度、是否 partial、run status 與 audit timestamp 一起記錄；不能把一張 audit JSON 當成天然真相。

> **花花的工程提醒**
>
> Audit cache 是成本與重播能力的最佳化，不是完整性保證。當資料只剩 usage record 或 partial detail，系統應標記不確定性，而不是把缺失欄位補成「沒有問題」。

## 2. MCP Gateway 與 firewall：把工具能力收在可檢查的邊界

Agentic CI 的工具不是普通 library call。它可能讀 repository、查 deployment、寫 issue、下載 image，還可能透過 MCP 連到 workflow 之外的服務；所以「模型被允許呼叫」與「網路真的能抵達」必須是兩層可觀測的決策。

這次 release 將 MCP Gateway 更新到 v0.4.25，`gh-aw-firewall` 更新到 v0.28.20 與 v0.28.17。以 [PR #61661](https://github.com/github/gh-aw/pull/61661) 為例，變更不只是 tag：它更新 version constant、immutable container digest，並重新編譯 299 個 workflow lock files；該 PR 也說明既有 minimum-version gates 沒有因這次 bump 增加新能力。這是供應鏈與執行契約的一部分：runtime 需要知道自己到底跑哪個映像，而不是只知道一個可變 tag。

Gateway 與 firewall 也不能被誤讀成「安全已完成」。PR 的 workflow execution 仍可能因 `github.com` 等 domain 沒有列入 `network.allowed` 而被擋；這個拒絕本身是有價值的 runtime evidence，因為它把「工具需要外連」變成明確的 policy mismatch，而不是在模型內靜默失敗。release 同時修正 `safeoutputs` CLI transport，讓錯誤明確浮出，而不是 silent fail-open；對 agentic CI 而言，**拒絕與失敗都應是可被追蹤的結果**。

實務上，我會把每次工具執行的邊界拆成四個欄位：呼叫者與 workflow identity、MCP tool／resource、network destination、結果與 denial reason。少了其中一層，事後很難分辨是 Agent 選錯工具、gateway 不允許、firewall 擋住，還是下游服務失敗。這和站內 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 對工具、權限、評測與失敗復原的分層觀念一致；若需要更具體的 MCP 控制面案例，也可接著讀 [GitHub MCP 的企業控制](/blog/87-github-mcp-enterprise-controls/)。

## 3. Grading：把中間行動納入「成功」的定義

在 agentic workflow 裡，最終 issue 或 comment 看起來正確，不代表執行安全。Agent 可能先讀錯資料、呼叫不必要的 tool、被拒絕多次，最後才生成一段看似合理的摘要。若 grader 只吃文字輸出，這些中間行動就會消失。

[PR #61426](https://github.com/github/gh-aw/pull/61426) 將 native Copilot tool calls 納入 automatic grader trace payload。PR 公開的變更摘要指出，grader 會發現、關聯並合併 native tool events 與 gateway records，並涵蓋 failed、incomplete、id-less correlation、orphan completion 與 dedupe 等測試情境。這個方向很重要：trace 不再只是一段模型訊息，而是一次 workflow 的行動紀錄。

對平台團隊來說，grading contract 至少要區分三件事：

1. **Outcome**：最終輸出是否達成任務。
2. **Action trace**：工具選擇、參數、拒絕、重試與順序是否符合 policy。
3. **Evidence quality**：輸出引用的證據是否真的來自允許的 run、repository 或 deployment。

這不表示自動 grader 已經等同人工審查。它只表示評估的輸入變完整了；評分規則、golden cases、對失敗與 partial run 的處理，仍要由團隊定義並持續校準。**更完整的 trace 可以讓錯誤被看見，但不會自動讓判定變正確。**

## 4. Model catalog 與 AIC：成本訊號要能對上實際執行

模型成本控制常被縮成「選便宜模型」。這次 release 顯示比較成熟的做法是先維護一份可被 runtime 使用的 model inventory：新增 `gemini-3.8-flash` alias、加入 `claude-fable-5.1`，並修正 `gpt-6-astra` 與 `gpt-5.6-sol` 的 pricing mirror。依 [PR #61234](https://github.com/github/gh-aw/pull/61234) 的說明，`gpt-6-astra` 的 input／output 估值曾高兩個數量級，從約每百萬 token $1000／$5000 修正為約 $10／$50；`gpt-5.6-sol` 則由約 $2／$10 修正為約 $4／$20。這些是 catalog correction，不是任何 workflow 的實際帳單。

更值得注意的是 release 同時修復多個 daily AIC（AI Credits）accounting gap：legacy runs、pre-harness failures、unassigned jobs，以及 missing evals 被跳過的情況。這說明成本契約不能只在「模型呼叫成功」時計費；啟動失敗、尚未進入 harness 的 run、沒有成功綁定 job 的執行，也可能需要被歸因，否則 dashboard 會低估真正的運行成本。

一個可用的成本觀測最少要把 catalog price、實際 input／output token、tool／gateway 呼叫、retry、cache hit，以及 AIC allocation 分開。模型 alias 是 lookup key；它不是供應商永遠不變的價格，也不能代替按 run 的 usage evidence。這也是 [LLM API pricing 與 inference cost](/blog/94-llm-api-pricing-inference-cost/) 所提醒的：單價只是成本模型的一個變數，流量、上下文、重試與路由才會決定實際支出。

> **花花的判斷**
>
> Model catalog 的價值不是幫團隊挑一個「最便宜」的模型，而是讓模型、價格、使用量與 workflow outcome 能在同一張 run 帳上對得起來。

## 5. Incident monitor：把一次失敗接回下一次改進

runtime 契約最後要閉合的是 incident loop。`deployment-incident-monitor` 的 workflow 定義使用 `deployment_status` event，在 error／failure 時建立以 deployment failure label 去重的 incident issue，並要求 Agent 做 root-cause analysis；它的 permissions、`max-tool-denials: 3`、MCP imports 與 detection feature 都寫在公開的 [workflow definition](https://github.com/github/gh-aw/blob/main/.github/workflows/deployment-incident-monitor.md) 裡。

weekly update 報告這個 monitor 在該週觸發 19 次，並描述一個 `Smoke Copilot - AOAI (Entra)` 因 Azure OpenAI 要求 organization verification 而回傳 400 的案例。公開的 [issue #61892](https://github.com/github/gh-aw/issues/61892) 進一步列出 failing run、deployment、commit、job 與 exit code。這是一個很好的 evidence chain：event → failing run → deployment context → root-cause issue，而不是只貼一個「部署壞了」的通知。

同時要保留語氣邊界：19 次是專案 weekly update 的運行報告，不是可靠性分母；一次 issue 能追到 commit，也不代表 Agent 的 root-cause analysis 永遠正確。`close-older-issues` 與 `skip-if-match` 能減少同一根因的 issue flood，卻不能取代人工確認或 post-incident review。真正的 loop 應該把 incident 的分類、修正、回歸測試與新的 grader／policy case 連回 runtime，而不只是把 issue 關掉。

## 這份 release 對工程團隊的可複製檢查表

若要把 agentic CI 從 demo 帶到受控環境，可以先要求每個 workflow 交出以下契約，而不是先增加更多 autonomous steps：

- **Run evidence**：run identity、版本、cache source、完整／partial 狀態、下載時間與大小可回放。
- **Boundary evidence**：workflow identity、MCP tool scope、network allow-list、denial reason 與 safe-output failure 都能查。
- **Evaluation evidence**：grader 同時看到 outcome、native／gateway tool calls、失敗事件與必要的 correlation metadata。
- **Cost evidence**：model alias 解析到版本化 catalog，並能與 token、重試、AIC／credits 和工具流量對帳。
- **Incident evidence**：deployment failure 能連到 run、commit、環境與去重後的 issue，且修正能回到回歸測試。

這份清單不保證 Agent 可靠；它只讓「可靠」不再是一個沒有 owner 的形容詞。每個欄位都還需要資料保留期限、權限、抽樣規則與人工責任人。缺少這些營運決策時，最精密的 trace 也可能只是無人閱讀的 log archive。

## 結語：Operational contract 比 runnable demo 多一個閉環

GitHub Agentic Workflows 這次更新的價值，不在於某一項修補單獨有多耀眼，而在於它把 agent runtime 的幾個常被分開管理的面向接在一起：logs audit 讓觀測可比較，Gateway／firewall 讓能力有邊界，grading 讓中間行動進入評估，model catalog 與 AIC 讓成本可歸因，incident monitor 則把失敗送回維運與工程流程。

這些官方 artifact 支持一個工程結論：**Agentic CI 變成 operational contract 的關鍵，不是增加自主性，而是把每次自主行動放進可授權、可觀察、可評分、可計費、可復原的閉環。** 但證據的範圍也要說清楚：本文核對到的是 GitHub 自己的 release、PR、workflow 與 issue，沒有獨立重跑其 fleet，也沒有從這些材料推導可靠性百分比或 SLA。真正導入時，仍要用自己的 deployment、權限、模型帳務與 incident data 做外部驗證。

若要繼續建立閱讀路徑，可先讀 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 理解 runtime 的構成，再讀 [Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/) 把 Evidence、Policy、Judge、Trace 接到上線評審；若你的瓶頸在長時間執行與交接，則接著看 [長時間 Agent Harness](/blog/10-effective-harnesses-for-long-running-agents/)。

## 來源與驗證界線

- [GitHub Agentic Workflows：Weekly Update – September 21, 2026](https://github.github.com/gh-aw/blog/2026-09-21-weekly-update/)：專案對 v0.89.17 與 `deployment-incident-monitor` 的總結。
- [gh-aw v0.89.17 release](https://github.com/github/gh-aw/releases/tag/v0.89.17)：release highlights、AIC accounting、AWF evidence 與 safe-outputs 修正。
- [PR #61871：Avoid redownloading cached runs during logs audit](https://github.com/github/gh-aw/pull/61871)：cached audit reuse 與 partial audit 行為。
- [PR #61027：Distribute multi-target logs queries fairly](https://github.com/github/gh-aw/pull/61027)：round-based scheduling 與 shared controls。
- [PR #61234：Model aliases and pricing catalog](https://github.com/github/gh-aw/pull/61234)：alias、pricing correction 與 regression tests。
- [PR #61661：Bump MCP Gateway to v0.4.25](https://github.com/github/gh-aw/pull/61661)：immutable image pin 與 workflow lock regeneration。
- [PR #61426：Include native Copilot tool calls in grader traces](https://github.com/github/gh-aw/pull/61426)：native event correlation、dedupe 與測試範圍。
- [`deployment-incident-monitor` workflow](https://github.com/github/gh-aw/blob/main/.github/workflows/deployment-incident-monitor.md) 與 [issue #61892](https://github.com/github/gh-aw/issues/61892)：公開的 incident trigger、權限與 evidence chain。

上述內容是對同一專案 first-party material 的交叉核對，不是獨立第三方 benchmark；文中沒有據此宣稱可靠性數字或 production SLA。
