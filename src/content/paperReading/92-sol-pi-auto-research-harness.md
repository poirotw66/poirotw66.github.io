---
title: "SoL-Pi 精讀：自動研究如何改良 Agent Harness"
description: "SoL-Pi 將 Harness 改良寫成一組帶有凍結指標、能力門檻與獨立驗證的自動研究迴圈，並在固定模型外組合四種減少重複工作的機制。本文拆解搜尋隔離、EdgeBench 證據、作者估算的 token 成本，以及跨模型與部署邊界。"
pubDate: 2026-10-07
updatedDate: 2026-10-07
tldr:
  - "SoL-Pi 搜尋的是模型外的 Harness 改動：先固定能力容忍值與效率指標，再讓多條獨立研究線提出、實作和淘汰候選。"
  - "四種保留機制分別改變工具呼叫、完成子任務後的壓縮、大型工具輸出，以及長 build/test log 的證據整理。"
  - "在 51 題 EdgeBench 上，作者報告完整效率組態相對 Pi 少 44.7–49.0% 記錄 token traffic、估算 API 費用約低三分之一；成本由記錄 token 流量與 2026-08-17 價格計算，不是即時帳單或獨立重跑。"
  - "GPT-5.6 Sol 搜尋出的機制直接套到 Opus 5；這提供有限的跨後端證據，不代表對其他模型、任務或價格都可轉移。"
audience:
  - "設計與評估長時間 coding agent 或工具型 agent 的工程師"
  - "研究 Harness 搜尋、代理效率與 held-out 評估的研究者"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "Research"]
topics:
  - agent-evaluation-observability
  - agent-systems
field: "AI Systems"
difficulty: "advanced"
showToc: true
image: "/paperReading/92-sol-pi-auto-research-harness/title_image.webp"
paper:
  title: "SoL-Pi: Recursively Scaling Auto-Research Loops for Efficient Agent Harness"
  authors:
    - "Haozhe Liu"
    - "Tian Ye"
    - "Sensen Gao"
    - "Qihang Cao"
    - "Yitong Li"
    - "Mingchen Zhuge"
    - "Duomin Wang"
    - "Ruihua Zhang"
    - "Ping Luo"
    - "Jiawang Bian"
    - "Lei Zhu"
    - "Ligeng Zhu"
    - "Enze Xie"
    - "Song Han"
  year: 2026
  venue: "arXiv:2609.20519 v1 (2026-09-17; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.20519v1"
    arxiv: "https://arxiv.org/abs/2609.20519"
    code: "https://github.com/NVlabs/SoL-Pi"
    project: "https://nvlabs.github.io/SoL-Pi/"
series:
  id: "agent-harness-efficiency"
  title: "Agent Harness 與效率"
  part: 1
  totalParts: 1
---

<!-- paper-reading-no-body-figures: The arXiv v1 paper does not state a permissive license for reusing its figures. The source figures remain linked in the text; no body image is republished without permission. -->

## 90 秒掌握論文

- **問題**：長時間 Agent 不只花 token 在模型回答，也會重播歷史、處理大型工具輸出、重複呼叫和閱讀冗長日誌。這些成本分散在 Harness 的多個環節，逐項手工修補很難知道改動是否在其他任務仍保留能力。
- **核心洞見**：把 Harness 改良視為一組可擴展的自動研究線。每條研究線從執行軌跡找出可避免的工作，提出候選改動，在開發環境中反覆實作與評估；候選必須通過預先凍結的能力門檻，並改善至少一個效率指標，才進入後續選擇。最終測試留在搜尋之外。
- **最強證據**：作者以約 150 個改良方向和 535 個可執行搜尋環境進行超過 3,000 次執行、累積超過 60,000 次 Agent–環境互動。四種保留機制在 51 題 EdgeBench 上組合後，GPT-5.6 Sol 的 Pi 基線平均分由 44.833 變為 42.003，記錄 token traffic 由 2.1538B 降到 1.0990B，作者按固定價格估算的 token cost 由 1,339 美元降到 894 美元（Sections 2–3、Tables 1–4）。
- **主要邊界**：EdgeBench 的 11 題用於凍結候選的一次性接受判斷，另 40 題保留作最終評估；結果不回流搜尋。主要效率比較是作者在其模型/API 設定下記錄與估算的結果，並非即時供應商帳單或本文獨立重跑。完整堆疊在 GPT-5.6 Sol 上保留 Pi 平均分的 93.7%，因此「效率較高」也不能脫離任務能力一起解讀。

SoL-Pi 把「自我改良」的目標放在模型外部：模型權重固定，研究者讓自動研究迴圈改寫工具流程、上下文管理和觀察處理方式。這個設定回應了兩個實際難題：Harness 的元件彼此牽動，局部省 token 可能把成本推到下游；而用搜尋軌跡反覆修改系統，也容易把開發任務的特徵誤認為可轉移規律。作者因此把候選開發和最終評估分開，先用不同可執行環境找機制，再把凍結的候選帶到不會回饋搜尋的 EdgeBench 切分。最後留下 Action Fusion、Online Context Compact、ObservationPack 和 Evidence-Preserving Reducer。這是一個以能力門檻限制效率搜尋的系統設計；目前證據支持它在選定工作負載上降低記錄流量與估算費用，還沒有建立「研究迴圈越大、效率必然持續提升」的縮放定律。本文依據 2026 年 9 月 17 日提交的 arXiv v1 預印本。

## 研究問題：怎麼讓搜尋變廣，又不讓測試集替候選指路？

Coding agent 的 Harness 包含模型周圍的執行政策：可用工具、工具輸出如何回到上下文、何時壓縮、失敗是否重試，以及任務如何結束。這些政策會改變每個任務的模型呼叫次數、重複傳入的文字和可保留的診斷證據。與降低 token 單價、改用小模型或壓縮模型權重相比，SoL-Pi 研究的是另一層：固定底層模型，改變它和環境互動的方式（Section 1）。

## 既有 Harness 改良為何仍需要 held-out 驗證

Harness 中的工具、上下文、驗證、委派、復原和停止規則彼此牽動，因此在一類開發任務上省下 token，不一定能保留其他工作的完成能力。既有方法若把同一批任務反覆交給候選，也可能讓搜尋針對這些任務痕跡修補；先前的 Harness 演化研究已指出，搜尋集上的進步可能在 held-out 任務只剩有限收益。人工閱讀長軌跡並逐一轉成程式改動，也難以涵蓋足夠多環境（Sections 1、4.2）。SoL-Pi 的回應不是假設搜尋器自然會泛化，而是安排多個開發環境，並把凍結後的一次性接受檢查和剩餘最終測試留在搜尋外。此隔離降低直接針對 held-out 結果修補的機會，但仍不能證明對所有未見任務都能轉移。

這裡的「遞迴」首先描述自動研究迴圈的組織方式：研究 AI 觀察基準 Harness 的軌跡，分析器整理重複呼叫、上下文增長、大型輸出與稀疏診斷訊號，再讓最佳化代理提案和修改 Harness。它不是模型權重自我訓練，也不等於已證明的無限自我改良。作者在限制中把「更省成本的 Harness 可支援下一輪更廣搜尋」明確稱為未來研究方向（Section 5.1）。

## 核心直覺：先鎖定「不能退步多少」，再追求「少做哪些重複工作」

若只用 token 最少作為目標，搜尋器可能透過少呼叫工具、過早結束或丟掉重要觀察來得到低流量。SoL-Pi 先固定能力指標和允許的退步範圍，再固定一組效率指標。每個候選要同時通過兩個條件：

1. 每個能力指標都在預先指定的容忍範圍內。
2. 至少一項已宣告的效率指標有所改善。

通過兩道門檻的候選，依已宣告指標保留非支配解。簡單說，不能有另一個合格候選在所有目標上都不差，且至少一項更好。接受條件由搜尋代理以外的設定控制，避免最佳化代理自行放寬成功標準。通過候選之後，整合不同機制仍須再調整實作與參數，並重新檢查能力（Section 2.1）。

**工程解讀**：這個設計把「保留能力」做成搜尋約束，而非在效率榜單外加一句提醒。但它能保證的範圍只有被明確量測的能力指標、容忍值和任務分布。它不會自動保證安全、延遲、服務穩定性、工具副作用或未量測的工作品質沒有退化。

## 方法怎麼跑：152 個方向、535 個搜尋環境與分離的評估池

外層搜尋先提出 152 個方向，分成 context、progress、tools、delegation、prompt/policy、improvement/evaluation 六類。這些類別描述想法來自哪裡，不限制最後要改哪一層：例如 ObservationPack 起於 context 假說，最後改的是觀察資料進入上下文的邊界。每個方向須指出具體浪費來源和可測試改動；探索彼此獨立，失敗候選可停止而不影響其他線（Section 2.2）。

內層研究線遵循「提案、實作、固定實驗、檢查結果、保留／修正／淘汰」循環，並加入完成條件和獨立程式碼審查。每次迭代可能產生多條執行軌跡；不同分析器各自找出重複動作、上下文成長、大型觀察或診斷訊號不足，再由 reducer 將發現整理成下一個候選方向。每條研究線複製共享技能範本、執行自己的參數和候選，保留證據而丟棄被修改的協調程式碼。作者報告整體搜尋涵蓋約 150 個方向、535 個環境、3,000 多次執行和 60,000 多次互動；這些數量描述研究規模，論文特別提醒它們本身不是縮放律（Section 2.2）。

搜尋環境有兩類，共 535 個：495 個從 GitHub issue／pull request 配對建立，使用修補前的 repository 狀態與離線依賴；已接受 patch 和回歸測試對 Agent 隱藏，且只保留「修補前測試失敗、修補後通過」的任務。另 40 個是 verifier-driven 合成任務：先建立可執行成功條件，再圍繞 verifier 建任務，允許多種解法，不要求追隨單一參考 patch（Section 2.3、Figure 3）。

EdgeBench 的 51 個公開任務則與搜尋池隔離。論文說其中 11 題用於凍結候選的一次性接受判斷，剩餘 40 題保留作最終泛化評估。候選和接受規則在評估前凍結；被拒絕的驗證結果不會帶回搜尋迴圈繼續針對該切分修補（Sections 2.1、2.5）。所以「held-out」不是 51 題完全同一種用途：讀者應將 11 題理解為一次性、單向的接受檢查，並將 40 題理解為剩餘的最終測試集。

### 用一個例子走完整個方法：Action Fusion 如何從觀察走到保留

作者用 Action Fusion 展示從觀察到保留機制的歷程。Oracle Analysis 從軌跡中發現，編輯檔案後緊接著執行測試或建置的相鄰動作很常見，估算若每次都可合併，token 可減少 11.5%，因此啟動專門的研究線。初版只靠 prompt 讓模型選擇合併動作時不夠穩定；研究線改成在工具 schema 中提供明確的合併動作，再於開發任務上迭代 prompt 和 schema。候選除了任務分數，也納入觸發率作為中間指標，最後凍結並接受 held-out 驗證（Section 3.5、Figure 8）。

此案例說明效率機制不一定只靠一條提示詞：工具介面本身可以揭露更明確的操作，而觸發率能協助研究線判斷模型是否真的使用該機制。11.5% 是從被觀察相鄰動作推估、假設完全觸發時的 token 減量，不能當作實際所有任務都省下 11.5%。

## 四種保留機制：改變資料流，而不替主模型做結論

四種機制分布在不同的 Agent–環境邊界。Figure 4 的原文圖示可在[原論文 v1](https://arxiv.org/html/2609.20519v1#S2.F4)查看；本篇不重刊圖像，因該版本未明示可重用圖表的授權。

### Action Fusion：把相鄰的修改與驗證合成一次工具請求

基準 Pi 常先編輯檔案，再單獨呼叫測試、建置或執行命令。Action Fusion 讓檔案修改工具帶一個可選的後續命令，並在同一工具請求中回傳兩者結果，減少中間一次模型往返。若後續命令需要先閱讀修改結果、根據它決定下一步，兩件事就不能安全合併，仍應分開（Section 2.4）。

### Online Context Compact：在完成子任務時檢查壓縮是否划算

這個機制不按固定 token 門檻一到就壓縮。Agent 完成 plan step 時，Harness 根據已完成步驟間觀察到的請求數和未完成步驟，估算剩餘模型請求；再受「目前上下文按觀察成長速率可容納多少請求」的上限約束。接著比較預期可省下的輸入 token 成本與重寫 prompt cache 的成本。後續壓縮也要計入尚未回收的重寫成本，因此須有更大節省空間才繼續。若接近 context window 上限且壓縮能縮短上下文，則仍可在壓力情境下呼叫 Pi 原生壓縮（Section 2.4）。

系統實作以 cache read/write 價格比估算重寫成本，但論文指出這個 gate 沒有另外計入摘要模型呼叫。它是對特定 cache 價格和使用模式的成本判斷，不是所有供應商與快取策略下都正確的通用公式。

### ObservationPack：保留大型輸出原文，避免一直重送全文

超過 10 KiB 的大型工具結果會先存入本地 archive。接下來兩次 provider request 仍完整送出；從第三次開始，模型收到穩定 handle、原始大小，以及由完整 head/tail 行組成、約 1 KiB 的短摘錄。模型需要精確內容時，可透過 handle 逐頁取回原始資料。小型輸出維持原樣（Section 2.4）。

這裡的關鍵是「上下文中的預覽」和「可取回的原件」分離。若 Agent 只靠預覽作決定，就仍可能看不到關鍵行；設計提供 exact recall 的路徑，但不保證模型知道何時需要取回。

### Evidence-Preserving Reducer：壓縮日誌，但以可核對的收據保留證據

Reducer 只處理預先列出的 build/test 命令中至少 4 KiB 的輸出；檔案讀取和搜尋結果不送進 reducer。Harness 將原始輸出存檔，並交給較低成本的 GPT-5.6 Luna（high）抽取簡短 evidence receipt。確定性 verifier 會檢查收據 schema、來源 hash、退出狀態、逐字引用是否存在，以及收據是否真的變短。若驗證失敗、疑似有憑證內容，或收據沒有縮短輸出，Harness 就回傳原始日誌。Reducer 的收據有標記，讓 ObservationPack 略過再次轉換，避免把已驗證證據丟掉（Section 2.4）。

此設計將兩個責任分開：輔助模型挑選可能有用的證據，主模型仍負責判斷與後續行動。決定性檢查能核對引用是否出自原文、退出狀態與格式是否正確，卻不能證明收據涵蓋了主模型之後診斷所需的所有資訊。因而 fallback 和原文存檔是安全網，不代表壓縮永遠無損。

## EdgeBench 結果：節省 token 與保留分數是兩個目標

EdgeBench 當時公開 134 題中的 51 題；本實驗以這 51 題比較多種 Harness。作者以 GPT-5.6 Sol 搜尋機制，並將同一完整效率組態直接套到 Opus 5，沒有再搜尋或調整。主要報告記錄 token traffic（分為一般 input、cache read、cache write、output）、以固定 API 單價換算的 token cost、平均得分，以及每分數單位的 cost。價格採論文註記的 2026 年 8 月 17 日 API 價格（Sections 3.1、Table 1）。

| EdgeBench 組態 | 平均分 | 記錄 token traffic | 作者估算 token cost | 每分成本 |
| --- | ---: | ---: | ---: | ---: |
| GPT-5.6 Sol + Pi | 44.833 | 2.1538B | $1,339 | $0.5855 |
| GPT-5.6 Sol + SoL-Pi Efficiency | 42.003 | 1.0990B | $894 | $0.4174 |
| Opus 5 + Pi | 44.756 | 2.3697B | $1,741 | $0.7625 |
| Opus 5 + SoL-Pi Efficiency | 42.224 | 1.3101B | $1,158 | $0.5376 |

表中的流量與美元數字是論文作者依實驗記錄和固定價格所報告、估算的結果。它們不是本文取得的供應商帳單，也不是用相同 API、價格快照和環境獨立重現的付款紀錄。GPT-5.6 Sol 下完整堆疊比 Pi 少 49.0% 記錄流量、token cost 約低 33.2%，平均分則保留 93.7%；Opus 5 下分別少 44.7% 流量、估算費用低 33.5%，平均分保留 94.3%（Table 2）。因此，效率堆疊是「在平均分略低下省資源」，不能簡化成「相同能力而且一定更便宜」。

作者另報一個單機制的 Performance 點：GPT-5.6 Sol 下只加 ObservationPack，平均分 47.208，比 Pi 高 5.3%，token traffic 少 6.1%，token efficiency 改善 9.8%；Opus 5 下最高分的單機制是 Action Fusion，平均分 50.482。這兩點是各 backend 的最高分單機制候選，不是同一個固定四機制堆疊，也不是兩種模型共用的單一設定。這個區分避免把「最佳分數候選」和「最低 traffic 候選」混成一個配置（Tables 1、2、4）。

從 GPT-5.6 Sol 到 Opus 5 的套用提供了跨後端測試，但兩者都只有論文中的測試設定。Figure 6 顯示機制在 Opus 5 上觸發比例和每個觸發任務的強度都較低；作者推測這可能與搜尋只看 GPT-5.6 Sol 軌跡有關。觸發時效率仍改善，但 aggregate score–efficiency 組合可能遮蔽哪些任務會啟用。這是兩種 backend 間的有限轉移證據，不代表跨模型家族或未測 Harness 已穩健轉移（Section 3.4、Figure 6）。

## 診斷資料：合併機制可能互補，單靠每機制比較仍不能隔離交互作用

Table 4 以「Pi 加上一種機制」比較各單機制組態，並和完整 SoL-Pi 堆疊比較。四個機制在 GPT-5.6 Sol 和 Opus 5 區塊中都降低了記錄 token traffic。完整堆疊在兩個 backend 都呈現最低總流量與最低作者估算 token cost。GPT-5.6 Sol 的 cache-read 流量由 Pi 的 2.1326B 降至 1.0605B，但 cache-write 流量由 0.0141B 升至 0.0316B；將快取重寫成本一起納入後，估算 token cost 仍由 1,339 美元降到 894 美元（Table 4、Section 3.4）。這解釋為何不能只看 cache hit 或 cache-read 的單一數字。

Figure 7 比較單機制與完整堆疊，作者觀察到每一機制在完整堆疊各自觸發任務子集上的 token-efficiency gain 較高，而 ObservationPack 在完整堆疊時更挑選性觸發。作者認為這和 Evidence-Preserving Reducer 在 observation-heavy 軌跡上的重疊相符，也指出整體型態與互補性一致。但各組態使用自己觸發的任務子集與對應停用基線，不是固定同一批任務的因子實驗，不能用來估計獨立交互作用或宣稱四機制彼此造成額外增益（Section 3.4、Figure 7）。

### 其他基準與有限的 swarm 結果

在 Terminal-Bench 4 的 63 個 CPU-only 任務上，Pi 與 Codex 各解出 18 題，SoL-Pi 解出 15 題。相對 Pi，SoL-Pi 的總模型費用由作者報告的 286.45 美元降為 211.12 美元，每道已解任務費用由 15.91 降為 14.07 美元。GPU 依賴任務因基礎設施限制未納入。這組結果清楚呈現效率與能力的取捨：總費用更低，解題數也更少，不能只引用每題費用（Section 3.2、Table 3）。

在 IMO 2026 六題、使用 GPT-5.6 Sol xhigh 並要求 Lean 4 驗證的測試中，SoL-Pi 通過 3 題，總模型費用 62.69 美元，每道通過題 20.90 美元；Pi 也通過 3 題，費用 75.95 美元，每題 25.32 美元；Codex 通過 5 題，費用 114.47 美元，每題 22.89 美元。每題最多 150 分鐘，成本包含該時限內的模型活動。只有六題時，成本／通過題可作本次量測的描述，不能估計一般數學任務的穩定成本（Section 3.2、Table 3）。

Kernel optimization swarm 的比較每個組態只跑一次兩小時：單一 Codex agent 以 39.20 美元得到 1,333 simulated cycles；Codex coordinator 加 20 個 Pi workers 以 82.12 美元得到 1,366 cycles；加 20 個 SoL-Pi workers 以 60.11 美元得到 1,127 cycles。所有最終候選都通過官方正確性檢查，Pi swarm 未跨過最後一個速度門檻，SoL-Pi swarm 和單 agent 通過八個門檻（Section 3.3、Figure 5）。這顯示單次預算下 SoL-Pi swarm 比 Pi swarm 少花費且找到較佳 cycle 數；它沒有顯示 SoL-Pi 比單 agent 便宜，也沒有重複試驗來量化波動。

## 證據地圖：哪些結論有測量，哪些仍是願景？

| 主張 | 主要證據 | 可支持的解讀 | 證據沒有回答的問題 |
| --- | --- | --- | --- |
| 自動搜尋留下四種可重用的 Harness 機制 | 152 個方向、535 個環境、超過 3,000 次執行與 60,000 次互動；Sections 2.2–2.4 | 研究流程在作者設定的開發環境和 gate 下產生這四種候選 | 同一投入是否必然找到四種；搜尋成本是否能跨方向、環境量化縮放 |
| 完整堆疊減少記錄流量 | EdgeBench 51 題的 Tables 1–2；GPT-5.6 Sol 與 Opus 5 | 本次固定設定中流量下降，且平均分接近 Pi 基線 | 重跑波動、其他模型或未公開任務的效果，與 latency、可靠性是否同步 |
| 機制組合可能互補 | Tables 4、Figures 6–7 | 本次觸發子集的描述結果與互補性一致 | 固定同一任務集的交互作用估計和因果歸屬 |
| 一次性基準結果外仍有其他任務證據 | Terminal-Bench 4、IMO 2026、kernel swarm；Section 3.2–3.3 | 多種任務上的作者報告結果支持進一步驗證 | 基準差異、模型預算與單次 swarm 試驗是否能代表部署 |
| 更省的 Harness 可以讓下一輪研究更廣 | Section 5.1 的 recursive efficient improvement | 這是作者提出的研究假說與未來計畫 | 本研究沒有觀察到成本節省反過來擴大搜尋並再次提升機制的多輪複利結果 |

閱讀這些數據時要分清三種語氣：作者報告的是表格中測得的分數、記錄流量和按固定價目換算的成本；資料支持的是這些特定測試條件下的觀察；「更有效的 auto-research 可遞迴降低下一輪搜尋成本」則是作者提出的方向，不是本次實驗證明的效果。

## 限制與不適用解讀

1. **搜尋與最終測試雖分開，驗證池仍有分工**：11 題一次性接受測試提供了對凍結候選的判斷，40 題才保留作最終評估。應保留這個分層，不能把 51 題描述為全都只在完全不接觸後評分。
2. **能力保留受指標定義限制**：候選 gate 只保護預先宣告的能力指標和容忍範圍。沒有被 gate 衡量的安全政策、外部副作用、延遲、成本尖峰或輸出品質，仍需另外驗收。
3. **跨模型只有一個搜尋與一個額外 backend**：機制以 GPT-5.6 Sol 軌跡搜尋，再套到 Opus 5。作者自己的觸發率分析顯示 backend 行為不同；兩種模型不足以證明跨模型普遍性。
4. **環境和搜尋預算的代表性有限**：495 個 repo-derived 和 40 個 verifier-driven task 支持可執行搜尋，但環境來源與任務類型仍是特定選擇。作者也承認完整研究迴圈昂貴，沒有做固定預算下搜尋廣度／深度的系統比較，因此 150 方向、535 環境不是縮放律證據。
5. **成本數字依流量記錄、模型和價格快照而定**：EdgeBench 的 API token cost 使用 2026 年 8 月 17 日價格，並以記錄 token 類別換算。這些 author-reported estimate 不是即時帳單、總營運成本，也不是本篇獨立重現的供應商扣款。延遲、硬體、環境準備和工程人力不等於 token cost。
6. **組合分析不能消除選擇偏差**：不同單機制和堆疊依自身觸發任務子集計算效率，觀察到的較大增益與互補性相符，卻不能分離任務組成和機制交互效果。
7. **swarm 結果每種組態只有一次執行**：一次兩小時結果顯示某個執行得到什麼 cycle 和成本，不提供 run-to-run 方差，也不能支持穩定的 swarm 優勢。
8. **遞迴效率提升尚屬未來假說**：目前量到的是一輪研究所找到的機制和它們的任務表現。讓較有效的 Harness 再省下研究費用、擴大下一輪搜尋並再發現更有效機制，尚未在本文的多輪實驗中展示。

## Artifact 與可重現性

截至 2026 年 10 月 7 日，論文連結的 [NVlabs/SoL-Pi GitHub repository](https://github.com/NVlabs/SoL-Pi) 可公開瀏覽；其 repository 頁面列出 MIT License，README 說明公開版本是可安裝在 Pi 上的 standalone extension，並列出 Pi 版本、Node.js 要求、設定方式與安全文件。作者的[專案頁](https://nvlabs.github.io/SoL-Pi/)提供方法與機制介紹。這些頁面證明程式碼和文件可取得，不等於 535 個搜尋環境、完整研究協調器和 EdgeBench 原始執行皆已可一鍵重跑。開始重現前須各自確認相依版本、基準任務取得方式、模型 API、計價方式及執行隔離設定。

本文沒有執行程式或重跑 benchmark。文章中的 token traffic、成本與任務分數均是 arXiv v1 的作者報告值；尤其美元數字按該文列出的價目估算，不是 live provider bill，亦非本文獨立驗證。GitHub repository 的 MIT 授權不會自動延伸到 arXiv 論文圖像，因此本文保留 Figure 1–8 的原文定位連結而不複製圖像。

## Bloss0m 工程判斷：把可重用機制當成可檢驗的改動

以下是 **Bloss0m 工程化整理**，不是作者提出的部署保證或產品選型規則。若團隊想採用其中一個機制，先把完整 Harness 版本固定下來：模型與版本、工具介面、提示詞、context policy、cache 價格、命令 timeout、驗證器、重試與權限。為每種改動建立局部測試，再用同一批代表性任務比對變更前後的能力、token 分類、美元成本、延遲和失敗型態。

Action Fusion 適用於下一步已預先確定的 edit–validate 流程；若第二個動作要先看第一個動作的輸出再決策，就先保持分開。ObservationPack 與 reducer 可以降低重複上下文，但要測量模型是否知道何時取回完整內容、摘要驗證失敗時是否可靠 fallback、原始 archive 是否需要敏感資料保護與清理。對含憑證、個資或機密程式碼的日誌，尤其要確認 reducer 的模型路由和 archive 保存位置。

Context compact 的經濟 gate 應以部署使用的 prompt cache read/write 價格和摘要呼叫成本重新估算。論文明確指出 gate 沒有單獨計入摘要呼叫；若供應商快取費率、prefix 可重用性或任務長度不同，原設定的判斷可能失準。把「壓縮後還完成任務」和「壓縮後沒有丟掉必要證據」當成兩個驗收問題，不要只看 context token 減少量。

更廣泛地使用 auto-research 時，先凍結可檢查的 verifier、能力容忍值與效率目標；把研究候選產生、開發調整、候選接受與最終測試分成有紀錄的邊界。每次只有在候選凍結後才使用一次性驗證池，不把失敗任務回饋進搜尋。另保留未觸發機制的數據、人工介入、超時和工具錯誤，否則低 token traffic 可能來自提前停止或不同任務難度。

若產品需要保證安全、準確或穩定完成，不應用一個平均分和 token cost 取代分層的驗收，也不應直接把 44.7–49.0% 的記錄 traffic 減量套到自己的帳單預估。該數字可用來提出測試假設；實際採用仍取決於本地工作負載、價格、延遲、安全邊界與重複執行的方差。

## 讀完後的三個記憶點

1. **研究本身也是系統設計**：SoL-Pi 將候選搜尋、凍結 gate、能力保留和 held-out 驗證組成自動研究流程；成功條件在搜尋前定義。
2. **四種機制處理不同資料流**：合併動作、按經濟條件壓縮 context、保留大型輸出的可回取原文、以及驗證日誌摘要，都要以 end-to-end 能力和成本評估。
3. **數字有範圍**：EdgeBench 和其他基準的 token traffic、美元成本、分數皆為作者報告；有限的 40 題最終評估、兩個模型 backend、每種 swarm 組態一次執行，以及未證明的多輪遞迴效益，構成採用前的邊界。

## Primary sources

- Liu, Haozhe, et al. [SoL-Pi: Recursively Scaling Auto-Research Loops for Efficient Agent Harness](https://arxiv.org/abs/2609.20519), arXiv:2609.20519v1, 17 September 2026. Key anchors: Sections 1–3 and 5.1; Figures 1–8; Tables 1–4.
- [NVlabs/SoL-Pi source repository](https://github.com/NVlabs/SoL-Pi), including README, configuration, compatibility, and security documentation. Repository license: MIT.
- [SoL-Pi project page](https://nvlabs.github.io/SoL-Pi/).
