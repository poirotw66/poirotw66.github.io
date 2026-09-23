---
title: "RSIAgent：模型權重不變，Agent 真的能自我改進嗎？"
description: "拆解 RSIAgent 如何用 Curriculum、Actor、Verifier 與 broad-to-deep exploration 建立可重用的 frozen experience，並檢查其 benchmark 證據與重現限制。"
pubDate: 2026-09-22
updatedDate: 2026-09-22
tldr:
  - "RSIAgent 的 training-free self-improvement 不更新模型權重，而是把經驗、程序、失敗條件與因果線索寫入外部記憶。"
  - "Curriculum Agent 選題、Actor Agent 執行與整理、Verifier Agent 以環境證據獨立檢查，形成 broad-to-deep 的兩階段探索。"
  - "BRS 建立廣度，DRS 針對目標缺口與邊界條件加深；評測前記憶凍結，Curriculum 與寫入都停用。"
  - "論文的 aggregate 包含選定重試、不同預算與保留的 baseline，並非所有任務的 matched independent rerun；分數應視為系統報告而非普遍能力定律。"
audience:
  - "設計 Agent memory、multi-agent harness 與 computer-use 評測的工程師"
  - "需要判斷 training-free adaptation 是否能進入受控正式環境的技術主管"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Research", "架構模式"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 38
kind: "article"
showToc: true
image: "/blog/114-rsiagent-frozen-experience/title_image.webp"
---

如果 Agent 不更新模型權重，它還能「學會」新環境嗎？RSIAgent 的答案是：可以改善**之後的任務執行**，但學習發生在模型外部。系統讓固定參數的模型探索軟體環境，把經過驗證的程序、失敗條件與行動後果整理成持久記憶；最後凍結這份記憶，再交給同一套 Actor–Verifier harness 執行下游任務。

這個區分很重要。RSIAgent 不是聲稱模型本身已經完成 online training，也不是只把對話歷史塞進更長的 context。它把「探索、驗證、整理、重用」做成一條可觀察的 runtime lifecycle。本文以 [RSIAgent 官方 repository](https://github.com/AetherLabsAI/RSIAgent) 與 [arXiv 論文](https://arxiv.org/abs/2609.15364) 為基準，回答這個方法如何工作、證據能支持什麼，以及工程團隊不該從分數推導出什麼。

> **花花的一句話**
>
> 權重不變不代表系統不變：RSIAgent 把改善放在可驗證、可凍結、可重用的外部經驗上。

## Training-free 到底改變了什麼？

論文把問題定義成：給定一個模型參數固定的新環境，Agent 先自主探索並建立 persistent memory，再用這份記憶支援下游任務。這份 memory 不是單純的成功 trajectory 清單，而是試圖保留「在什麼條件下採取什麼行動、造成什麼結果」的環境特定知識；其中也可以包含失敗與修正後的規則。

因此，RSIAgent 的可變狀態至少有三層：

1. **探索決策**：Curriculum Agent 依目標、既有記憶與上一輪結果決定下一個練習題。
2. **執行經驗**：Actor Agent 透過可執行的 Python 或 Bash 程式與視覺觀察操作環境，產生程序與結果。
3. **持久記憶**：Actor 在 Verifier 回報後整理、修正或刪除舊建議，讓後續 Actor instance 可以重用。

Verifier Agent 是這個設計的關鍵邊界。它直接檢查執行結果、介面狀態與其他環境證據，並且不讀 Actor 的 private reasoning 或 memory。這不是完美的獨立評審，但比讓 Actor 自己宣布「我成功了」更接近可稽核的 feedback loop。

## 三個角色，三個不同責任

RSIAgent 將 recursive self-improvement 拆成一個多 Agent harness，而不是讓一個長對話無限自我反思：

- **Curriculum Agent**：找出值得探索的方向，包括 prerequisite skill、資訊不足的變體、失敗驅動的練習與 stress test。
- **Actor Agent**：執行任務、產生可重播的程式化行動，並將已被 grounded 的經驗整理回 memory。
- **Verifier Agent**：從環境回饋判斷要求是否真的滿足，提供 PASS、FAIL 或需要更多證據的訊號。

角色分離的工程價值在於，memory update 不應只依賴模型對自己 trajectory 的敘述。更完整的 Agent 架構還需要把狀態、工具、評測與失敗復原接起來；可先對照 [AI Agent 完整指南](/blog/64-ai-agent-guide/)，再判斷哪些邊界需要獨立 service 或權限。

## Broad-to-deep：先建立地圖，再追蹤裂縫

RSIAgent 的核心 curriculum 不是一直重做同一個 task，而是先廣後深。論文稱兩個探索階段為 Broad Recursive Self-exploration（BRS）與 Deep Recursive Self-exploration（DRS），之後才進入 frozen-memory evaluation。

### Phase 1：BRS 建立環境廣度

BRS 會同時提出多個不同方向的 exploration projects，Actor 與 Verifier 平行執行，等一整個 wave 完成後再依結果規劃下一波。官方 reference configuration 給的是 nominal eight-project budget，最多四個 project 並行；這個 budget 在完整 wave 後才檢查，因此實際數量可能超過名目值。

這個 wave barrier 不是單純為了加速。它讓本輪不同分支先共享結果，再由下一輪 curriculum 找出尚未覆蓋的環境結構、程序與 failure pattern。對工程團隊來說，BRS 比較像建立一張可搜尋的操作地圖，而不是追求一個漂亮的單次成功。

### Phase 2：DRS 對準難點與邊界

DRS 改成 sequential loop。Curriculum Agent 會根據 target attempt、Verifier feedback 與 Actor 的 learning diagnosis，挑選更可能暴露 hidden constraint、corner case 或錯誤解讀的練習。每次驗證後先更新 memory，再決定是否需要下一次 target attempt 或補充 project。

成功不會自動終止 DRS；系統要由 curriculum review 判斷是否還有值得學的內容。這使 DRS 能把「成功但不穩定」當成下一個問題，而不是把第一次 PASS 誤認成學習完成。

### Phase 3：凍結經驗，再做測試

探索結束後，memory 被 freeze，Curriculum Agent 與所有 memory update 都停用。Actor 只能取用既有的程序、條件與 failure lessons；Verifier 仍檢查最終執行是否滿足要求。官方 lifecycle 也會 reset environment，並把 benchmark evaluator 放在 Actor–Verifier loop 之外。

這個階段才是「frozen experience」的可測量版本：評測時不能偷偷把新成功寫回資料庫，否則你測到的是持續適應的系統，不是固定經驗能否泛化。

> **花花的工程提醒**
>
> 記憶凍結必須是可檢查的 lifecycle boundary：要保存 freeze 前後的版本、hash、寫入狀態與 evaluator 入口，否則「沒有更新」只是一句 prompt。

## Demos 與 benchmark pins：證據要分層看

官方 repository 展示 FreeCAD、OSWorld 與 Agents’ Last Exam（ALE）等整合與案例，並固定 OSWorld-V2 的 `v2026.08.08` release 與 ALE 的公開 commit。這些 pins 對重現環境很有幫助；repository 也提供 smoke checks，檢查 immutable memory、Verifier isolation、candidate replay 與 checkpoint rollback。但 smoke check 驗證的是 runtime 機械，不是完整 benchmark 分數。

論文報告的兩組 aggregate 如下。這裡只保留較能反映方法差異的 partial score 與 binary accuracy，並把 `w/o RSI` 和 RSIAgent 放在同一表中：

| Benchmark | 覆蓋範圍 | Partial：w/o RSI → RSI | Binary：w/o RSI → RSI |
| --- | --- | ---: | ---: |
| OSWorld 2.0 0808 offline | 82 tasks | 71.97 → 78.98 | 37.80 → 42.68 |
| ALE Near-term | 67 tasks | 83.75 → 84.82 | 49.25 → 50.75 |

這些數字支持一個比較窄的結論：在作者指定的 harness、探索設定與報告口徑下，外部記憶與兩階段探索帶來了系統層級的改善訊號。它們不支持「固定權重 Agent 普遍超越所有 frontier model」這種更大的結論。尤其 ALE 的 binary score 是 50.75，論文同表的 GPT-6 Astra 是 52.24；partial 與 binary 也不能互相代替。

## 為什麼 aggregate 不能當成 matched rerun？

這是閱讀 RSIAgent 時最容易被標題掩蓋的部分。論文附錄明確揭露了報告範圍：

- OSWorld 的 RSI aggregate 以 41 筆已記錄的 RSI 結果替換對應 baseline，其餘任務保留 baseline；ALE 則是 19 筆 RSI column 加上 48 筆 baseline。
- 額外探索優先分配給 baseline 尚未 full credit、且尚未有 RSI lineage 的任務；已經 full credit 的任務沒有被同樣地擴展探索。
- 記錄中包含 selected retries、不同 evaluation budget、local corrected grades 與 protocol variants。這不是每個 task 都用相同預算、獨立重跑，再對 matched pairs 取平均。
- 沒有新探索的任務仍留在 benchmark denominator，但保留的 baseline 不是獨立 RSI evaluation。OSWorld 的 T082 還因 setup failure 依報告規則被算成 zero。

因此，aggregate 的解讀應該是「這套報告流程在一組選定且部分補齊的任務上，呈現出改善」，而不是「RSI 對每個任務都造成同等改善」。如果要把結果拿來作為內部採購或模型選型證據，至少要另外保存 task cohort、是否真正執行 RSI、retry 次數、預算、grader 版本與 missingness。

> **花花的判斷**
>
> RSIAgent 最有價值的不是「不用 training 就贏過誰」，而是示範如何把探索成本轉成可審查的經驗資產；沒有 matched reruns 與第三方重跑，分數只能支持方法可行性，不能直接支持普遍優勢。

## 失敗分析比成功案例更接近工程真相

論文的 failure analysis 把限制拆成三類，且三者會互相放大：

1. **探索沒有打中弱點**：如果練習沒有挑戰真正負責失敗的判斷，memory 會看似成長，卻沒有修掉 target-specific weakness。
2. **Verifier 接受不完整成果**：Actor 產生了輸出，不等於所有 task requirement、欄位值與 artifact discrepancy 都被檢查。錯誤的 PASS 會把問題送進下一輪 learning。
3. **Memory consolidation 不可靠**：一個未充分驗證的解讀可能被整理成可重用規則，讓之後的 task 重複採用錯誤條件。

這三點也說明為什麼「多試幾次」不是充分的 self-improvement 策略。若 curriculum 選錯題、Verifier 看錯證據，retry 只會增加成本，甚至把錯誤寫得更牢。正式環境還要考慮 Agent 執行程式、存取軟體環境與保留資料時的未預期操作、未授權存取與隱私外洩風險。

## 給工程團隊的落地檢查表

如果要把這種 training-free adaptation 放進自己的 Agent runtime，可以先用以下順序驗證，而不是先追逐 benchmark：

1. **把 experience 當 artifact 管理**：每筆記憶附上環境版本、task、證據、Verifier verdict、產生時間與可撤銷的版本鏈。
2. **把 verifier 與 actor 隔離**：至少分開 context、資料讀權與 write scope；高風險系統再加 checkpoint-protected inspection 與人工 gate。
3. **把探索與評測分開**：探索可以寫入，sealed evaluation 不可寫入；比較時記錄真正執行的 task，而不是只看 aggregate denominator。
4. **用 failure-driven curriculum**：成功只證明某條路徑可行，還要測試替代條件、缺資料、延遲狀態與錯誤操作。
5. **先算 test-time 成本**：模型呼叫、工具操作、VM、驗證與重試的總成本，可能超過一次 fine-tuning；若環境常變，凍結 memory 也要有失效與重建政策。

這個設計脈絡可以和 [Anthropic Agent Memory 與 Dreaming](/blog/83-anthropic-memory-and-dreaming/) 對照：兩者都把改善放在模型外的記憶處理，但 RSIAgent 更強調探索期的 curriculum、Verifier 與 freeze boundary。若關心 Agent 如何在評測或追分時偏離目標，也可延伸閱讀 [Ornith 1.0 的 Self-Scaffolding 與評測邊界](/blog/69-ornith-1-0-self-scaffolding-llm/) 與 [Automated Alignment Researchers 的 integrity gates](/blog/98-automated-alignment-researchers/)。

## 來源與下一步

- [RSIAgent 官方 repository](https://github.com/AetherLabsAI/RSIAgent)：架構說明、benchmark pins、demos、runtime checks 與 setup。
- [RSIAgent: Autonomous Exploration for Recursive Self-improvement in New Environments](https://arxiv.org/abs/2609.15364)：v2 論文、方法、主表、failure analysis 與 reporting appendix。

下一步若要實作類似 harness，先建立一個可凍結、可 hash、可獨立驗證的 memory artifact，再用小型任務 cohort 測試「探索是否命中弱點」與「Verifier 是否真的看完整證據」。模型權重是否更新，反而是這條控制鏈裡最容易檢查的一項。
