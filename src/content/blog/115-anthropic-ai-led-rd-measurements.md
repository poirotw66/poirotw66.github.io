---
title: "AI 開始做 AI 研究後，要量測什麼？Anthropic 的三個研發儀表板"
description: "拆解 Anthropic 用來觀察 AI-led R&D 的三組量測：AI 自動化程度、Agent oversight 與 safety compute，並把內部自報、方法邊界與跨實驗室不可比性放回工程決策。"
pubDate: 2026-09-22
updatedDate: 2026-09-22
tldr:
  - "AI 做 AI 的進度不能只看模型能力；至少要分開量測 AI-led R&D、Agent oversight 與 safety compute。"
  - "Anthropic 以 2026 年 8 月的內部快照回報：Claude 在測量到的 AI 研發工作中領導 26%，高於或等於 AI collaborates 的工作超過 90%；但這是自家任務樹、模型判斷與內部資料的結果。"
  - "Agent coverage、review latency、escalation rate 與 safety-compute share 可以形成營運儀表板，但一週快照、best-effort labels、不同分類定義與缺少第三方重現，都使跨實驗室比較尚未成立。"
audience:
  - "設計 AI research agent、agent runtime 與 oversight pipeline 的工程師"
  - "需要判斷 frontier AI 進展、透明度與治理指標的技術主管與政策團隊"
category: "Industry Pulse"
tags: ["Anthropic", "AI Agent", "Evaluation", "Governance", "Research"]
cluster: "ai-platform-governance"
clusterRole: "signal"
clusterOrder: 33
kind: "article"
showToc: true
wideHeader: true
image: "/blog/115-anthropic-ai-led-rd-measurements/title_image.webp"
---

當 AI 不只協助人類寫程式、跑實驗，而開始參與建造下一代 AI，真正困難的問題就不再只是「模型有多強」。我們還需要知道：有多少 AI 研發工作已由 AI 主導？Agent 的行動有沒有被看見、被審查、被攔截？實驗室把多少 AI 研發算力放在安全工作上？

Anthropic 在 [Measurements for understanding the pace of AI development inside frontier labs](https://www.anthropic.com/institute/measuring-pace-of-ai-development) 提出三組量測，並公開一份自家內部快照。這不是一個把 frontier progress 壓成單一分數的 benchmark，也不是跨實驗室已完成的比較研究；它更像是把「AI 正在加速 AI」拆成可以定義分母、記錄證據、接受外部檢查的儀表板。

> **花花的一句話**
>
> AI-led R&D 要變成可治理的工程現象，必須同時量測自動化了多少工作、行動是否受監督，以及算力如何分配。

## 三組量測各自回答什麼問題

| 量測面向 | Anthropic 想知道什麼 | 目前公開快照與不能直接推出的結論 |
| --- | --- | --- |
| AI-led R&D | AI 在 AI 研發任務中做到哪個自動化層級 | Claude 在測量到的 AI 研發工作中「leads」26%，超過 90% 達到或高於「collaborates」；不代表 26% 的模型能力提升，也不代表已達到 recursive self-improvement。 |
| Agent oversight | Agent 行動有多少被監測、多久被審查、多少被攔截或升級 | 內部最常用平台約有 30,000 個 Agent；線上與離線監測的 coverage 都是 100%；不代表監測已捕捉所有未知行為，也不代表不同平台的 coverage 可直接比較。 |
| Safety compute | AI 研發算力中有多少被分類為 safety work | 受檢查的一週中，AI 研發算力約 6% 用於 safety，AI-driven AI R&D 算力約 12%；不代表安全工作的總投入，也不是長期趨勢或品質分數。 |

這三個分母不能互相替代。自動化指標回答「誰在做工作」；oversight 指標回答「行動有沒有進入控制迴路」；compute 指標回答「資源被分到哪裡」。把它們混成一個「AI 進步率」，反而會遮掉最需要工程判斷的地方。

## 1. AI-led R&D：先量測工作被自動化到哪一層

Anthropic 建立了一個 prototype 的 **Anthropic R&D Automation Index**。做法不是只統計某個工具用了幾次，而是先盤點公司內各種 AI R&D 工作，為每種工作評定自動化程度，再依工作重要性加權後聚合成指標。

它採用 Epoch AI 提出的 Automation Level（AL）尺度：AL0 是沒有 AI 參與，AL5 是 AI 在沒有 human in the loop 的情況下完全自主。AL3 的「collaborates」代表 AI 在人類密切指示下完成大段工作；AL4 的「leads」則是 AI 能從 high-level prompt 出發完成大部分工作，由人類監督。這個差異很重要：從「協作」到「主導」是監督節奏與責任分配的改變，不只是多產生一些 tokens。

截至 2026 年 8 月，Anthropic 回報三件事：Claude 在任何一個測量到的 AI R&D 子集合中都還沒有完全自主運作；Claude 「leads」Anthropic AI R&D 工作的 26%；達到或高於「AI collaborates」的工作比例超過 90%。這些數字是 Anthropic 的內部、自我回報測量，代表該公司以這套方法觀察到的工作分布，不能當成整個 frontier 產業的比例。

### 這個指標怎麼做出來

附錄揭露的方法很值得工程團隊注意。Anthropic 從 Slack 與各種內部文件的工作紀錄 bottom-up 建立任務清單；對 2026 年 7 月模型研發迴圈中的各部門，每週隨機抽取 20% 員工，再由 Claude research agent 讀取每人的該週工作，整理出約 15,000 個細粒度模型研發任務。這些任務再被 Claude 組織成一棵有 542 個節點、378 個 leaf 的階層樹，並把這棵樹凍結，讓後續數字對著同一籃工作計算。

每個節點的自動化程度由另一個 Claude judge 根據證據評定。權重則用 person-time 作為粗略代理：一個人一週的工作量平均分給他做過的任務。Anthropic 也找負責相關領域的員工獨立評分；model 與 human 的 exact agreement 是 59%，human 與 human 的 exact agreement 是 35%，而 model 與 human 有 97% 的評分相差不超過一級。

這些數字既是方法透明度的一部分，也是限制。Judge model 與被評估的 Claude 屬於同一模型家族，可能犯相似的錯；Anthropic 自己也指出「AI collaborates」與「AI leads」的邊界仍有爭議。凍結的任務籃子能提供時間序列的固定基線，但如果工作本身出現新種類，單看指標上升並不能說明人類已把新工作也交給 AI。Anthropic 用 2026 年 1 月的另一棵 frozen tree 檢查新任務，表示在它的分析粒度下，1 月到 7 月沒有看到 novel tasks 數量上升；同時也計畫定期重建並重新版本化任務籃子。

因此，這個指標最有價值的不是 26% 這個孤立數字，而是它迫使團隊先寫清楚三件事：任務邊界是什麼、automation level 的判準是什麼、工作重要性用什麼分母加權。沒有這三層，跨季度或跨實驗室的百分比很容易只是不同分類器的產物。

## 2. Agent oversight：coverage 不是有效監督的同義詞

第二組量測處理的是半自主 Agent 長時間工作時的可見性。Anthropic 說，2026 年 8 月其最常用的內部平台上，任何時刻約有 30,000 個 Agent 做研究與工程工作；但這組數字只涵蓋該平台，不是 Anthropic 所有 Agent 的全公司總數。

它把 oversight 拆成三個可操作的指標：

- **Coverage**：Agent 行動有多少比例在執行前或執行後通過 monitor。
- **Review latency**：行動發生到 automated monitor、再到 human review 之間花多久。
- **Escalation rate**：線上 monitor 阻擋或重新導向的比例，或離線 monitor 將活動標記給後續審查的比例。

這裡又分成兩種 monitor。Online monitor 在行動前即時檢查，適合處理迅速且不可逆的危險行動，例如從系統複製 model weights；offline monitor 在事後讀取活動，適合處理發展較慢、仍可逆的危險行為，例如可能的 model misalignment 跡象。

Anthropic 公開的內部快照是：兩種 monitor 對該平台 Agent 的 coverage 都是 100%。Online monitor 在 Agent 行動前檢查，通常在幾秒內完成；被阻擋的行動由人類在一週內審查。Offline monitor 每週標記約 100,000 份 transcripts，先經多個 classifier 處理 false positives 與初步 oversight review，最高優先級約每週 50 份再升級到人類審查。

在 2026 年 8 月分析的超過十億個 research and engineering Agent decisions 中，online monitor 阻擋了 0.002%，約每 47,000 個決策 1 個。Offline monitor 則把每千份 Agent 活動中的約 1 到 2 份標記給後續 review。這些是 Anthropic 對自家平台與自家監測流程的報告，不是一般 Agent 的失誤率、危害率或漏報率。

更重要的是，100% coverage 只表示行動進入 monitor，不表示 monitor 一定能理解行動、抓到所有問題，或人類能及時處理所有升級。Anthropic 的 scaffold 以個別 identity 綁定 Agent 與其產生的資料，並讓 Agent 透過公開、可交叉引用的 messaging system 溝通；這有助於沿著 identity 與 transcript 追蹤行為。但附錄也承認，這類 monitoring 目前做了幾個月而不是幾年，難以確定已涵蓋所有行為，也難以保證模式對人類足夠可讀。

> **花花的工程提醒**
>
> Coverage 是入口條件，不是監督品質的結論；正式環境還要把 review latency、escalation 的處置結果與已知 misbehavior 的獨立測試一起記錄。

對採用 research Agent 的團隊而言，這組指標提供一個比「我們有 logging」更可執行的契約：哪一些 action 必須在執行前攔截？事後事件多久必須進入 review？什麼事件會升級給人？Anthropic 主張其他 AI developer 也能公開相同指標，並提到第三方可以驗證監測；這正是從自家控制面走向可比較制度時必須補上的一步。

## 3. Safety compute：量測投入，但不要把它當成安全成果

第三組量測把視線從行動與任務移到資源。Anthropic 檢查 2026 年 7 月 13 日到 7 月 20 日的一週，把所有 compute workload 分類，再估算進入 AI R&D 的算力中，有多少用於 safety work。

在這個快照中，約 6% 的 AI R&D compute 分配給 safety；若只看 AI-driven AI R&D，約 12% compute 分配給 safety。Anthropic 明確說這是刻意保守的估計：如果某個 token 同時對 capability 與 safety 有同等貢獻，就不算進 safety；此外，為 safeguards classifiers 使用的另一批可比算力也沒有算入。

這個指標很容易被誤讀成「安全做得有幾分」。但 safety research 常由研究者設計實驗，執行本身不一定耗用大量 compute，因此 compute share 是不完整的 proxy。更高效率的 safety classifier 可能讓 safety compute share 下降，卻不代表安全工作變少；反過來，production inference 變得更有效率，也可能讓 classifier 的相對占比上升。這也是為什麼 Anthropic 說它的價值比較接近「用同一口徑看同類對象與時間變化」，而不是解釋絕對投入。

### 分類邊界就是這個指標的核心風險

Anthropic 使用既有 capacity-planning monitoring 工具，串起 accelerator usage、workload metadata 與第三方 cloud provider 回報，再用 Claude classifier 判斷 workload 的主要目的是否是讓 AI 更安全、更可理解或更安全地運作。其他內容，包括 capability research、production model training、product development 與 developer tooling，都歸在 AI R&D。研究 training 與 evaluation runs 近一週約 10,000 次，取其中約 14% 做抽樣，並提高高算力 runs 的權重，讓結果更接近算力流向而不是 run 的數量。

這裡的 labels 多半由自動規則或使用者提供，屬於 best effort 而非逐筆驗證；部分 Agent transcript 因 compartmentalization 無法取得時，會改用 user team 分類，或保守地歸到 AI R&D。Anthropic 表示，清楚寫出定義與 boundary cases 後，classifier 與 human reviewer 的差異可以控制在一到兩個 percentage points，但仍有幾種案例即使人類花數小時也難以判定。另一個實際邊界是：這只是一週，足以展示可以量測，不足以建立有意義的長期趨勢。

因此，若企業要採用 safety-compute share，必須把分類定義、灰區、取樣、權重、標籤來源與重新抽查寫進 measurement contract。數字本身不是安全保證；可重跑的分類流程與能被質疑的證據鏈，才是這個指標真正的工程產物。

## 這三個儀表板能不能跨實驗室比較？目前不能直接說可以

Anthropic 表示，任何 frontier developer 都可以用公開方法定期發布這些數字，讓結果隨時間比較，並有機會跨實驗室比較。但同一頁也列出現階段的兩個主要障礙：沒有共同方法；而 AI developer 正用自己的模型評估自己的系統，judge 可能犯和被檢查模型相同的錯。

所以目前最準確的讀法是：這些是 **Anthropic 內部、自我回報、方法已揭露但尚未由跨實驗室共同協議驗證的 measurement prototypes**。它們比沒有數字更有資訊量，卻還不是外部已重現的 benchmark。跨實驗室比較至少需要共同的任務分類與 Automation Level 定義、明確的 oversight 事件與分母、可對照的 safety-work boundary cases，以及第三方或其他開發者模型的檢查。即使有了這些，也仍要把平台範圍、時間窗與資料可得性放在數字旁邊。

這個限制不是附帶小字，而是設計本身的一部分。當我們看到 26%、100%、0.002%、6% 或 12%，第一個問題應該是「分母、觀測窗與分類器是什麼」，而不是把不同實驗室的百分比排成排行榜。

## 給工程團隊的實作順序

Anthropic 這篇文章對企業最實用的啟示，是把「AI 會不會做更多工作」改寫成一組可稽核的控制迴路：

1. **先固定 measurement unit。** 明確區分 task、agent action、transcript、decision、workload 與 compute；不同單位不能在同一個百分比裡混算。
2. **再固定分母與時間窗。** 說清楚是所有 AI R&D、AI-driven AI R&D、某一平台，還是某一週的 snapshot；快照不能包裝成趨勢。
3. **把分類與判斷證據留下來。** Automation level、monitor escalation 與 safety-work label 都要能回到原始紀錄、規則、抽樣與 reviewer。
4. **最後才談跨組織比較。** 先公開定義、boundary cases 與 known limitations，再讓第三方或其他模型檢查；沒有共同方法時，保持「同一組織內的時間序列」比虛假的排名更誠實。

這個順序也說明為什麼 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 所談的 state、tool、evaluation、observability 與 failure recovery，不只是產品架構元件：它們是未來要回答「Agent 做了什麼、誰看過、哪裡被攔下」時的證據來源。若要進一步處理 Agent 的威脅邊界，可以對照 [企業 AI Agent 安全架構](/blog/43-enterprise-ai-agent-security/)；若團隊正在把這些控制面整理成上線門檻，[Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/)提供了另一個工程化閱讀路徑。至於 compute 與成本的分母，則可延伸閱讀 [LLM 推論成本怎麼算](/blog/94-llm-api-pricing-inference-cost/)。

> **花花的判斷**
>
> 當 AI 開始參與 AI 研發，透明度的最小單位不該是「模型多強」，而該是可重跑的任務定義、可追蹤的 Agent 行動與可解釋的資源分類。

## 來源

- [Anthropic：Measurements for understanding the pace of AI development inside frontier labs](https://www.anthropic.com/institute/measuring-pace-of-ai-development) — 三組 measurement、2026 年 8 月內部快照與方法附錄。
