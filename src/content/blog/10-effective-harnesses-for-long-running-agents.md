---
title: "長任務代理的 Harness：跨上下文穩定交付"
description: "根據 Anthropic《Effective harnesses for long-running agents》整理：用初始化代理（initializer）＋漸進式編碼代理（coding）＋特徵清單與端到端測試，讓代理能在多個 context window 間持續推進並保持乾淨狀態。"
pubDate: 2026-03-30
updatedDate: 2026-03-30
tldr:
  - "根據 Anthropic《Effective harnesses for long-running agents》整理：用初始化代理（initializer）＋漸進式編碼代理（coding）＋特徵清單與端到端測試，讓代理能在多個 context window 間持續推進並保持乾淨狀態"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["AI Agent","Harness Engineering","Claude","架構模式"]
image: "/blog/10-effective-harnesses-for-long-running-agents/title_image.webp"
---
原文出處：  
**Justin Young（2025）. Effective harnesses for long-running agents.**  
網址：<https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents>

長任務（long-running）代理的難題，常常不在「一次能不能做對」，而在「做錯後能不能回復」以及「下一輪接手時還能不能繼續往前」。當任務必須跨越多個 `context window` 分段執行，代理就像在值班輪替的軟體團隊：下一位成員沒有自然記憶前一班做了什麼，於是進度與品質都容易漂移。

Anthropic 在這篇工程文章裡，從人類工程師的工作方式出發，提出一套可落地的 harness 結構：把環境初始化、漸進交付、以及端到端測試，做成代理流程本身的工程化約束，而不是只靠提示詞祈禱模型「別壞掉」。

---
### 背景：為什麼跨 context window 仍然容易失穩

文章先點出一個常見誤解：既然 Claude Agent SDK 支援 compaction（就地摘要），理論上代理應該能在多個 window 中「無限期」工作。但實驗顯示，光靠 compaction 仍不夠。當模型被只給高階指令（例如「把 claude.ai clone 做出來」）並在循環中自我推進時，會出現兩種典型失敗型態。

第一種是「一次做太多」：代理嘗試 one-shot 把整個專案直接做完，卻在中途用到 context 時間耗盡，導致下一輪只能從「功能半成品且缺文件」重新猜起。這會讓後續輪次花大量時間把基本功能拉回能用的狀態，長任務成本也因此暴增。

第二種是「過早宣告完成」：專案後段時，新的代理實例讀到既有進展，就可能判斷「看起來差不多了」，於是把真正仍有缺口的功能草率放行。這不是單純的能力不足，而是缺少明確的「完成定義」與「驗證義務」。

---
### 核心概念：用 initializer＋coding，並外部化進度與完成標準

Anthropic 的解法其實很像真正的軟體團隊交接：第一輪先建立環境與可追蹤的需求清單，後續每輪只處理一小塊，並且在輪結束時留下乾淨可合併的狀態。

他們提出兩種主要代理角色（initial conversation 會用不同 prompt，其他條件相同）：

1. **Initializer agent**：負責第一次 session 建立環境，讓後續 coding agent 能快速上手。
2. **Coding agent**：每個後續 session 只做漸進式改動，並留下一致的工整狀態與進度紀錄。

> 長任務代理的核心不是更強的模型，而是更有效的交接：可讀的環境、可驗證的完成標準、以及能回到正軌的乾淨狀態。

---
#### 初始化環境：用 init.sh、progress 檔與初始 git 提交建立「可接手性」

Initializer agent 在第一次 session 會落地三件事，讓下一輪不必猜：

- `init.sh`：用來啟動開發伺服器與必要環境，減少「每輪都要摸索怎麼跑起來」的成本。
- `claude-progress.txt`：記錄代理在專案中的工作脈絡，讓 fresh context 能快速對齊「最近做了什麼、目前卡在哪裡」。
- 初始 git commit：把新增檔案納入版本歷史，讓後續輪次可以用 git 可靠回滾或追蹤變更。

這一組設計的價值在於：代理不再需要在每個 window 內重新理解整個系統是如何運作，而是能快速讀取狀態並選擇下一步。

---
#### Feature list：把「完成」具體化成可更新的清單

為了避免代理一次做太多或過早宣告勝利，Anthropic 讓 initializer 先寫出一份「特徵需求清單」（feature list）。在 claude.ai clone 的示例中，這個清單包含數百個 end-to-end 功能敘述，並用結構化 JSON 表達每項功能的狀態（例如從「failing」到「passing」）。

更關鍵的是：他們要求後續 coding agent 只在清單中更新狀態欄位，而不允許模型把測試或清單本身輕易改掉。這是一種非常有效的約束：它把「完成定義」從主觀判斷轉成可控、可稽核的流程。

---
#### 漸進交付與乾淨狀態：用 git commit 與摘要讓環境可回復

當 coding agent 具備初始化後的環境，下一步就要避免它在每輪重新推翻自己。文章指出，他們會要求 coding agent 在完成一個特徵改動後：

- 以描述性的 git commit message 提交變更。
- 在 progress 檔中寫下簡短的變更摘要。

這樣的組合帶來兩個直接好處。第一，若本輪改動留下錯誤，下一輪可以更快回滾到可工作的狀態，而不是從破碎狀況猜起。第二，代理不必在輪結束時用大量文字向自己解釋「我到底做了什麼」，因為變更已經被結構化地落在 git 歷史與 progress artifact 裡。

---
#### 測試：把「是否真的可用」交給端到端驗證工具

文章最後一個關鍵模組是測試（Testing）。他們觀察到：沒有明確提示時，代理往往會做了代碼變更與單元測試（或用 `curl` 測試開發伺服器），但卻未必能辨認「整體互動流程根本沒跑通」。

因此在 web app 的案例裡，他們強調提供瀏覽器自動化工具（例如 Puppeteer MCP），讓代理像人類使用者一樣：

- 啟動本地開發伺服器並先跑通基本流程。
- 使用瀏覽器自動化操作介面（例如新增對話、送出訊息、驗證回應）。
- 在 session 結束前，確保環境沒有留下未記錄的大 bug。

文章也坦承仍存在限制：像是模型視覺能力（vision）與瀏覽器自動化覆蓋範圍，仍會讓某些錯誤類型更難被察覺，例如瀏覽器原生 alert modals 透過該工具可能較難辨識。

---
### 數據／研究發現：常見失敗模式如何被 harness 針對性化解

文章用一張「問題—行為—解法」的對照表，歸納了幾個常見 failure modes，並指出 initializer 與 coding agent 各自應該做什麼。

一個核心訊號是：每種失敗型態都對應到 harness 的特定結構缺口。

例如當代理「過早宣告整個專案完成」，initializer 的回應不是加更多「請你謹慎」的提示詞，而是建立 feature list，讓後續 coding agent 必須從清單中選擇尚未完成的最高優先項並逐一驗證。

當代理留下「環境雜亂或未記錄的 bug」，initializer 會先建立 git 與 progress artifact，coding agent 則在新 session 開頭讀取這些狀態並跑基本端到端測試，最後以 git commit 與 progress 更新收束。

當代理把功能「視為 done 但其實沒測」，他們會要求只有在充分測試後才把狀態更新到通過（passing）。

---
### 啟示與建議：把 harness 當工程流程，而不是代理的臨時保護傘

把這篇文章濃縮成工程上的可操作原則，我會這樣理解：

1. 把「完成」外部化：用可更新清單（feature list）定義每個 end-to-end 行為，讓代理只能在被驗證的範圍內推進。
2. 把「接手」工程化：用 init.sh 與 progress 檔讓每個新 window 都能快速回到可工作的上下文起點。
3. 把「收束」做成規範：用 git commit 與摘要讓狀態可回復、可追溯，而不是靠模型口語描述。
4. 把「是否真的可用」交給端到端工具：尤其是互動式 web app，單元測試不足以替代瀏覽器級驗證。

這種做法的本質是把不確定性「搬出模型內部」，交給結構化流程控制。模型仍負責創造與修改，但 harness 負責讓修改可以被接續、被驗證、並在失敗時有可回到正軌的機制。

---
### 小結

Anthropic 的結論可以用一句話收束：長任務代理要穩，不靠運氣。要靠初始化、進度清單、乾淨狀態與端到端測試這四條工程支柱，讓每個 context window 都像是在已知狀態下接力，而不是在盲猜中復原。

---
原文出處：  
**Justin Young（2025）. Effective harnesses for long-running agents.**  
網址：<https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents>

