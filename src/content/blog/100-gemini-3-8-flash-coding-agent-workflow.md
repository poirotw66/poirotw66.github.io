---
title: "Gemini 3.8 Flash 開發心得：GPT-6 Astra 規劃、Flash High 執行的 Coding Agent 工作流"
displayTitle: "Gemini 3.8 Flash 開發心得"
subtitle: "GPT-6 Astra 規劃，Flash High 執行的 Coding Agent 工作流"
description: "記錄我如何把 GPT-6 Astra 與 Gemini 3.8 Flash High 拆成規劃、執行與審查三個角色，並用 DeepSWE 的成本與完成率資料檢查這種分工的邊界。"
pubDate: 2026-09-15
updatedDate: 2026-09-16
tldr:
  - "Astra 定義問題：釐清限制、SPEC、驗收條件與升級時機。"
  - "Flash 執行測試迴圈：讀碼、修改、測試並記錄未解問題。"
  - "人類審查交付：檢查 diff、測試證據與剩餘風險。"
  - "DeepSWE v1.1 的 113 個任務中，兩者完成率同為 74%；成本與步數不同，但榜單不能證明通用優劣。實際比較仍須計入人工審查、重試與回滾。"
audience:
  - "正在設計 AI coding agent、模型路由或 Harness 的工程師"
  - "需要在模型品質、使用額度與開發速度之間做取捨的技術決策者"
category: "AI Engineering"
tags: ["AI Agent", "OpenAI", "Gemini", "Evaluation", "Agentic Coding"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 33
kind: "article"
showToc: true
readingStyle: focused
tocLabels:
  "先說結論模型不是上下級而是不同的工作站": "不同模型，不同工作站"
  "我的-gpt-6-astra--gemini-flash-工作流": "Astra → Flash 工作流"
  "為什麼這種拆分可能划算": "分工為何可能划算"
  "官方模型定位與-deepswe-榜單告訴了什麼": "官方定位與 DeepSWE"
  "這個工作流在哪些任務上比較適合": "適用的任務"
  "我會怎麼驗證而不是只憑體感": "如何驗證"
  "把模型路由寫進工程契約": "模型路由的工程契約"
  "最後的判斷": "最後的判斷"
wideHeader: true
image: "/blog/100-gemini-3-8-flash-coding-agent-workflow/title_image.webp"
---

我最近把 coding agent 的工作流拆成兩個很不對稱的角色：**GPT-6 Astra 負責把問題想清楚，Gemini 3.8 Flash High 負責把事情做完。** 這不是因為我已經證明 Flash 在所有任務都比 Astra 強，而是因為在實際開發裡，規劃、讀 repository、寫程式、跑測試、修錯誤的成本結構並不相同。

我的起點很具體：我使用的是每月 20 美元的 [ChatGPT Plus](https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus) 方案；在我用 Work／Codex 執行 GPT-6 Astra 的情境裡，使用量受兩個固定的時間窗口管理：五小時窗口與每週窗口。固定的是窗口結構，不是固定訊息數；實際 allowance 仍會依方案、模型、任務與設定變動。[OpenAI 官方使用說明](https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex)也指出，五小時限制可能在五小時結束前先達到。這讓我開始思考：**是不是每一輪都需要最昂貴、最深的模型？**

本文是這個分工的工程筆記。個人使用經驗、供應商官方定位、DeepSWE 公開榜單與本文的推論會分開標示；榜單上的平均成本也不是我的帳單，更不能拿來推算我的訂閱費用。

> **花花的一句話**
>
> 最強模型負責縮小問題空間，足夠強又更划算的模型負責把剩下的路走完。

## 先說結論：模型不是上下級，而是不同的工作站

把兩個模型放在同一個「誰比較強」的排序裡，容易漏掉真正有用的設計問題：**哪一種不確定性應該由哪個模型承擔？**

| 工作站 | 主要責任 | 我期待的輸出 | 不能直接假設的事 |
| --- | --- | --- | --- |
| GPT-6 Astra | 問題定義（framing）、架構取捨、SPEC（specification，工作規格）、風險與升級判斷 | 可檢查的任務邊界、變更面、驗收條件與測試計畫 | 產出的 SPEC 一定正確，或因此不需要人類審查 |
| Gemini 3.8 Flash High | 讀碼、實作、測試、根據錯誤訊息迭代 | 可執行的 diff、測試紀錄、剩餘疑問與阻塞點 | 只要 token 便宜，就能安全處理所有架構與權限決策 |
| 人類工程師 | 確認意圖、審查 diff、接受風險、決定是否交付 | 可追溯的變更與明確的交付決定 | 測試全綠就代表沒有相容性、資安或營運風險 |

因此，我不把 Flash 當成「低階版 Astra」，也不把 Astra 當成「永遠不寫 code 的顧問」。兩者都可以讀碼和產生修改；差別在於我把較昂貴的判斷集中到高不確定性的關卡，把可重複、可驗證的長迴圈交給成本更低的執行者。

## 我的 GPT-6 Astra → Gemini Flash 工作流

這個流程不是把一份模糊需求丟給兩個模型輪流聊天，而是先建立一個能夠被執行和反駁的工作契約。

### 1. 先定義問題，不急著寫實作

我會先讓 Astra 回答幾個問題：

* 真正要改變的行為是什麼？
* 哪些行為明確不在這次範圍內？
* repository 中有哪些現有約束、相依模組與相容性風險？
* 哪些設計決定會影響後續資料、權限、效能或部署？
* 完成的最低驗收條件是什麼？哪些測試能證明它？

這一步的成果不是一篇漂亮的說明文，而是一份短 SPEC：目標、非目標、相關檔案或模組、建議變更面、驗收條件、測試計畫，以及遇到什麼情況必須停止並升級回 Astra 或人類。

如果需求本身還有兩三種互相衝突的解釋，就不應該急著把它交給 Flash。便宜地把錯的問題做得很完整，仍然是浪費。

### 2. 讓 Flash High 接手有邊界的實作迴圈

SPEC 足夠清楚後，我讓 Gemini 3.8 Flash High 重新讀取與任務相關的 repository 區域，確認現況，再進行：

1. 找出實際的入口、資料流與測試位置。
2. 先做最小必要修改，不順手重構無關模組。
3. 執行既有測試，再依失敗訊息做局部修正。
4. 對每一輪修改保留 diff、測試結果與未解問題。
5. 在達到驗收條件，或觸發升級條件時停止。

這裡的重點是「有邊界」。Flash 可以自行處理多次編譯、測試、修正，但不應在測試失敗後無限擴張變更面，也不應自行改寫原本沒有授權的架構、權限或外部介面。

### 3. 在真正需要時才回到 Astra

以下情況會讓我把結果送回 Astra，或直接請人類工程師判斷：

* 測試失敗，但錯誤訊息不足以判斷根因。
* 實作開始跨越原本 SPEC 沒有涵蓋的模組或資料邊界。
* 出現身份驗證、secret、資料遷移、公開 API 或向後相容性問題。
* Flash 提出互相矛盾的修復方式，或多輪修復後仍在同一個錯誤迴圈。
* diff 看起來能通過測試，但改變了重要的業務語意。

Astra 在這裡不是「再寫一次 code」，而是重新壓縮問題空間：確認原本的假設、更新 SPEC、選擇保守的下一步，或明確宣布這不是適合自動執行的任務。

### 4. 人類看 diff，而不是只看最後一句成功

最後仍由人類檢查 diff、測試輸出、例外處理、權限範圍與回滾方式。Agent 說「tests passed」只是一項證據，不是交付授權。這也是 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 裡反覆強調的原則：可驗證的控制迴圈比單次回答更重要。

## 為什麼這種拆分可能划算？

### Frontier model 的價值是 uncertainty compression

「高階模型」的價值不只在於它能多寫幾行 code，而在於它能把模糊需求轉成較少的可行分支。當問題涉及架構、責任邊界、資料生命週期或安全條件時，先少走幾條錯路，往往比後面多產生幾萬個 token 更有價值。

這是本文的工程推論，不是某一家模型的官方定義。我把它稱為 **uncertainty compression**：先用較強的模型把「不知道要改什麼」變成「知道要驗證什麼」，再讓執行模型承擔可重複的操作。

### Executor 的價值是把長迴圈做得夠穩

coding agent 的實作階段常常不是一個漂亮的一次性回答，而是讀檔、修改、編譯、看錯誤、重試、跑測試、再修改。只要任務邊界清楚、工具環境穩定、測試訊號可靠，executor（執行模型）即使需要更多步驟，也可能換來更低的單任務成本與較少的高階模型額度消耗。

但「更多步驟」不是免費的。它會消耗時間、工具呼叫、token、review 注意力與失敗風險。所以我不把「Flash 更便宜」當成結論，只把它當成要用每個任務的完成結果驗證的假設。

### 額度與 API 成本不是同一件事

OpenAI 的 Astra 使用窗口屬於 Work／Codex 產品使用規則；Google Gemini API 價格則是另一種計費面向。Google 目前的[官方價格頁](https://ai.google.dev/gemini-api/docs/pricing?hl=en)列出 Gemini 3.8 Flash standard paid tier 的輸入價格為每百萬 token 0.75 美元、輸出（含 thinking token）3.75 美元，至 2026 年 12 月 31 日；2027 年 1 月 1 日起分別為 1.50 與 7.50 美元。這些是 API token 價格，不是 Gemini 訂閱方案的月費，也不是我個人的實際帳單。

若要估算總成本，還要把重試、工具結果回填、快取、審查時間與失敗任務算進去；[LLM 推論成本怎麼算](/blog/94-llm-api-pricing-inference-cost/) 已整理過為什麼 API 價格、公開 benchmark 與成本推導不能混成同一個數字。

## 官方模型定位與 DeepSWE 榜單告訴了什麼？

Google 將 Gemini 3.8 Flash 描述為面向長程 software engineering、自主 Agent 與複雜企業工作流的 Flash 模型。[Gemini API 文件](https://ai.google.dev/gemini-api/docs/latest-model)列出 1M token context、64K 最大輸出，以及 low／medium／high 的 thinking level；[Google DeepMind 官方模型卡](https://deepmind.google/models/model-cards/gemini-3-8-flash/)也列出 hallucination、偶發延遲或 timeout，以及較高 thinking effort 可能消耗更多 token 等限制。這些資料支持它成為「執行工作馬」的候選，但不等於它在每個 repository、每種語言或每種產品決策上都可靠。

另一個容易被誤讀的訊號是 DeepSWE v1.1 leaderboard。該榜單在 2026 年 9 月 3 日更新，使用 113 個任務；目前列出的幾個結果如下：

*手機可左右滑動，查看完整數值表。*

| 模型設定 | 完成率 | 平均任務成本 | 輸出 token | 步數 |
| --- | ---: | ---: | ---: | ---: |
| GPT-6 Astra [xhigh] | 74% ± 3% | USD 6.52 | 30K | 29 |
| Gemini 3.8 Flash [high] | 74% ± 1% | USD 2.36 | 143K | 166 |
| Claude Opus 5 [max] | 74% ± 4% | USD 11.84 | 118K | 99 |
| GPT-5.6 Sol [max] | 73% ± 3% | USD 6.46 | 60K | 61 |

資料來自 [DeepSWE v1.1 leaderboard](https://deepswe.datacurve.ai/)，各模型在該頁面所列的設定下執行，並使用 mini-swe-agent。它可以提供一個很有用、但很有限的觀察：在這組任務與 agent harness（代理執行框架）裡，Flash High 的完成率點估計與 Astra 相同，平均任務成本較低，但用了更多輸出 token 和步數。這正好符合「較便宜的執行者可以用更多迴圈完成工作」的工作流假設。

它不能支持以下結論：

* Flash High 已經全面勝過 Astra。
* 74% 等於一般專案的成功率；它也代表約四分之一任務沒有被解決。
* 平均任務成本就是所有團隊的真實成本。
* 166 步一定比 29 步差，或一定更可靠。

更重要的是，[DeepSWE 論文](https://arxiv.org/abs/2607.07946)本身提醒，SWE-bench 衍生評測有資料分布、解題記憶與 verifier 是否正確判定替代解法等問題。benchmark 可以幫我們形成假設，不能取代自己的任務集、工具環境與人工審查。

> **花花的工程提醒**
>
> SPEC 是壓縮不確定性，不是把 executor 變成無人監督的部署按鈕。應該追蹤的是「測試與審查都通過的完成任務」，不是漂亮的榜單分數。

## 這個工作流在哪些任務上比較適合？

我會優先把它用在以下類型：

* 有清楚驗收條件的 bug fix、測試補強、局部重構與文件同步。
* repository 結構相對穩定，執行模型可以從現有 code 和 tests 得到足夠訊號。
* 需要多輪讀碼、修改和測試，但單一任務的權限與外部副作用可以被限制。
* 規劃階段能明確列出非目標，避免 executor 把「順便改善」變成大規模改寫。

這些條件與 [AI 軟體開發環境選型](/blog/89-ai-powered-software-development-environments/) 的方向一致：Vibe Coding 的問題不只是模型會不會寫 code，而是工作流能否把 context、工具、驗收與恢復路徑組成一個可觀測的 harness。

反過來，以下任務不應只因為 Flash 成本低就放寬門檻：

| 風險訊號 | 可能發生的事 | 我的處理方式 |
| --- | --- | --- |
| SPEC 過早固定錯誤假設 | executor 高效率地完成了錯的設計 | 回到 Astra 或人類重新 framing |
| 測試覆蓋不足 | 綠燈只代表舊測試沒被破壞 | 增加驗收測試，人工檢查業務語意 |
| 跨服務、資料遷移或權限變更 | 小 diff 也可能有大範圍副作用 | 提高審查層級，禁止無人批准交付 |
| 多輪修復仍無法收斂 | token、時間與 diff 迅速膨脹 | 設定步數／時間／變更面上限並升級 |
| benchmark 與實際工作不同 | 榜單結果無法預測團隊的成功率 | 用自己的代表性任務集重跑 |

## 我會怎麼驗證，而不是只憑體感？

目前沒有把自己的使用帳單或任務成功率視為可泛化的實驗結果。因此，如果要把這個工作流推廣到團隊，我會先建立一個小型、可重複的基準：

1. 挑選一組代表性任務，包含小修、小功能、跨模組變更與刻意的高風險案例。
2. 固定 repository 版本、工具權限、測試命令、timeout、上下文提供方式與人工介入規則。
3. 分別記錄 Astra-only、Flash-only，以及 Astra planning → Flash execution 的結果。
4. 以「首次通過」、「修復後通過」、「人工審查分鐘數」、「總 token／步數」、「重試與回滾」和「逃逸缺陷」作為指標。
5. 額外記錄被升級的原因，因為升級本身就是路由設計的資料，不是單純失敗。
6. 先用 canary 任務觀察，再決定是否擴大 Flash 的自主執行範圍。

這樣才能回答真正的問題：**同一個團隊在相同的品質門檻下，是否因為把高階模型放在規劃關卡，而降低每個已完成任務的總成本與等待時間？**

## 把模型路由寫進工程契約

如果只把這件事理解成「Astra 寫 SPEC、Flash 寫 code」，很快就會遇到新的模糊地帶。可交付的路由契約至少要說清楚：

* 什麼叫做「規劃完成」：是否有非目標、驗收條件、測試與 rollback？
* 什麼叫做「執行完成」：是產生 diff，還是測試和人工 review 都通過？
* 哪些資料和工具可以交給 executor？
* 哪些操作需要 human approval？
* 何時以步數、時間、token 或變更面積觸發 escalation？
* Astra 審查的是原始需求、SPEC、diff，還是測試結果？
* 每次模型升級後，哪些代表性任務必須重跑？

這也是為什麼我會把它視為 Agent harness 的問題，而不只是模型選擇。已有的 [GPT-5.6 架構與效率整理](/blog/79-openai-gpt-5-6-frontier-intelligence-efficiency/)提供了另一個角度：模型的能力、每 token 產出與推論成本要放回整個執行系統裡看。模型路由最終服務的是交付結果，不是讓排行榜看起來更漂亮。

## 最後的判斷

Gemini 3.8 Flash High 沒有「取代」GPT-6 Astra；它讓我可以重新安排兩者的工作位置。Astra 用在高不確定性的 framing、架構和風險決策，Flash 用在可界定、可測試、可以容許多輪迭代的實作迴圈。DeepSWE 的公開資料讓這個想法有一個可討論的成本／完成率基線，但還不足以替任何團隊宣布通用勝利。

對我來說，最有價值的變化不是某一個模型的分數，而是開始把「模型能力」和「任務路由」分開思考：**先決定哪一種判斷值得花高階模型的額度，再決定哪一種執行可以交給更有效率的工作馬。**

這個工作流成立的前提仍然很嚴格：SPEC 要能被檢查，executor 要有權限邊界，測試要有訊號，人類要保留交付決定，而且每個任務的成本與結果都要被記錄。少了其中任何一項，模型分工就可能只是把錯誤更快、更便宜地放大。
