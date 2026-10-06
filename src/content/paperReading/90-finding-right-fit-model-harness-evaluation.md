---
title: "Finding the Right Fit 精讀：模型、Harness 與任務如何改變 Agent 排名"
description: "比較 66 組模型與 Harness 在三個任務集上的分數、成本與失敗回饋。讀懂排名反轉，也看清一次執行、未配平設定與軌跡案例能支持到哪裡。"
pubDate: 2026-10-06
updatedDate: 2026-10-06
tldr:
  - "同一批模型在不同 Agent Harness 下會互換排名；四種模型的最高分 Harness 會隨任務集改變。"
  - "Terminal-Bench 4 的 GPT-6 Astra 在 PI 為 60.32%、每題 4.66 美元；在 DSH 為 52.38%、每題 19.94 美元。這是該次設定的觀察值，不是普遍成本保證。"
  - "配對軌跡顯示，超時回饋、工具錯誤呈現與續跑策略可能改變模型能否自行修復；案例不足以分離單一因果因素。"
  - "每題只計一次最後執行，沒有重跑方差；要為產品選型，仍須在目標工作負載與自己的安全、成本條件下重測。"
audience:
  - "開發與評估程式碼 Agent、終端 Agent 的工程師"
  - "需要比較模型、Agent 執行框架、成功率與 API 成本的研究者"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "Research"]
topics:
  - agent-evaluation-observability
  - agent-safety-governance
field: "AI Systems"
difficulty: "advanced"
showToc: true
image: "/paperReading/90-finding-right-fit-model-harness-evaluation/title_image.webp"
paper:
  title: "Finding the Right Fit: Model–Harness Interactions across Agent Tasks"
  authors:
    - "Yixuan Li"
    - "Yiyun Zhou"
    - "Yao Long Teng"
    - "Fuchao Yang"
    - "Yanchen Deng"
    - "Zhiyi Lyu"
    - "Xuyu Dong"
    - "Feng Chen"
    - "Bo An"
  year: 2026
  venue: "arXiv:2610.00917 v1 (2026-10-01; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2610.00917v1"
    arxiv: "https://arxiv.org/abs/2610.00917"
    code: "https://github.com/liyix/finding-the-right-fit"
    project: "https://huggingface.co/datasets/yixuanli97/finding-the-right-fit"
series:
  id: "agent-model-harness-fit"
  title: "Agent Evaluation and Reliability"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文

- **問題**：模型排行榜把模型分數排好，卻無法回答一個部署選擇：同一模型換上不同工具循環、錯誤處理、上下文管理和停止規則後，原本的排名還成立嗎？
- **核心洞見**：把比較單位從「模型」改成「模型 × Harness × 任務集」的已執行組態。Harness 是模型外面的行動迴圈與執行政策，包括工具介面、上下文壓縮、重試、逾時和完成條件。
- **最強證據**：在 Terminal-Bench 4 的 63 題非 H100 子集，Claude 在 OpenHands 比 GPT 高 7.94 個百分點；到了 PI，Claude 反而低 30.16 個百分點。GPT-6 Astra 在 PI 得 60.32%，每題成本 4.66 美元；在 DSH 得 52.38%，每題 19.94 美元（論文 Table 1、Figure 1、Section 4.1–4.3）。
- **主要邊界**：作者每題採最後一次有效執行的結果，沒有同一組態的重跑方差估計，而且模型推理、工具、上下文及 Harness 預設並未全部等價。這是有限任務上的系統比較，不是單獨改變 Harness 元件所得的因果效果。

本文依據 2026 年 10 月 1 日提交的 arXiv v1 預印本。研究追問的不是「哪個模型永遠最好」，而是同一模型的優勢如何被 Harness 與任務改寫。作者交叉比較四個可配置 Harness、五個模型及三組工作負載，再用少量配對軌跡觀察失敗如何傳回模型。結果呈現出兩種同時存在的現象：多數模型的最佳 Harness 會隨任務改變，但某些配對可能在本次三組任務中維持優勢；執行時的錯誤回饋也提供了理解分數差異的線索。這些發現能幫忙設計更有用的評估問題，卻不能取代團隊自己的重跑、成本帳與安全驗收。

## 先釐清：模型、Harness、任務集是不同層

在典型的工具型 Agent 中，模型讀取狀態、提出工具呼叫、接收輸出，再決定下一步。Harness 負責把這個迴圈落實：暴露哪些工具、如何序列化呼叫、錯誤要不要回給模型、長上下文何時壓縮、命令是否有逾時、模型中斷後是否續跑，以及何時判定完成。因此 Harness 不只是外殼；它會改變模型「看得見什麼、能做什麼、何時還有機會修正」。

第三層是任務集。一般終端工作、專業工作流程和困難命令列任務，對工具介面、視覺操作、長步驟規劃與驗收的要求各不相同。相同模型與 Harness 的組合，在不同任務集合上也可能有不同的適配度。論文稱觀察到的最佳分數為 empirical fit（經驗適配）：對模型 (m) 和任務集合 (b)，作者在實際評估過的 Harness 中找出分數最高者：

$$
h^*(m,b) \in \operatorname*{arg\,max}_{h \in \mathcal{H}_{m,b}} S_{h,m,b}.
$$

這個記號只描述樣本中哪一個已測組態得分最高。它不是對未測 Harness 的預測，也不代表 Harness 元件本身造成了全部分差。平均獎勵 (S) 以預定任務數 (N_b) 為分母；若最後一次執行沒有可用的 verifier 結果，論文以 0 計入，若有數值獎勵則保留，TUA-Bench 與 ALE-CLI 可有部分分數，Terminal-Bench 4 則採二元結果（Section 3.3）。三組任務的獎勵不合併成一個總排名。

這裡的「66 組」包含 4 個可配置 Harness（OpenHands、DeepSeek Harness，簡稱 DSH、PI、openJiuwen）各自搭配 5 個模型、跨 3 個任務集的 60 個組態，再加 6 個原生參考組態：Codex–GPT 與 Claude Code–Claude 各在三個任務集上各一組（Section 3.1）。原生配對只是參考線，並不代表它們與另外四個 Harness 的工具、預設或模型介面已完全配平。

## 為什麼只看模型排行榜不夠：核心直覺與既有方法的限制

常見的簡化問題是「模型 A 還是模型 B 比較強？」論文把它拆成三個更可操作的問題：模型排序會不會隨 Harness 改變？同一模型的最佳 Harness 會不會隨任務改變？原廠 Harness 是否總能讓該廠模型表現最好？這種拆法的價值，在於避免把一個完整系統的分數誤讀成模型的孤立能力。

在 Terminal-Bench 4，OpenHands 下 Claude Opus 5 得 36/63 題，GPT-6 Astra 得 31/63 題，換算成平均獎勵，Claude 領先 GPT 7.94 個百分點。DSH 下 Claude 得 22/63，GPT 得 33/63；PI 下 Claude 得 19/63，GPT 得 38/63。四個可配置 Harness 中，Claude 減 GPT 的差值依序為 +7.94、−17.46、−30.16、−12.70 個百分點（Table 1、Section 4.1）。同一對模型的順序翻轉了。這能證明的是觀察到的系統排序不固定；不能單靠這個對照判定哪一個具體 Harness 功能造成 38.09 個百分點的差距。

圖 1 把分數和每題成本放在同一張圖，提醒讀者「得分較高」與「值得付出的執行成本」要一起看。成本是 OpenRouter 價格下的 Agent 模型 API 成本，包含 Harness 的輔助模型呼叫、不含 evaluator 呼叫，並取自同一筆最後計分的執行（Section 3.4）。因此，圖中的比較是當時模型價格、任務和各自執行設定的成本帳，不是通用採購估價。

![Original paper Figure 1. Score versus model cost per task across the three task collections.](/paperReading/90-finding-right-fit-model-harness-evaluation/figure-1.svg)

*原論文 Figure 1，Section 4。圖中各點為三個任務集上 66 組模型–Harness 組態的分數與每題模型成本；虛線為各任務集 22 個組態中的 Pareto frontier。圖中位數象限是視覺分區，不能解讀成跨任務的統一門檻。圖檔直接取自 [arXiv v1 Figure 1](https://arxiv.org/html/2610.00917v1#S4.F1)，依該預印本頁面所列 CC BY 4.0 原樣重用，未改繪。*

## 用一個例子走完整個方法：從 Hang 到可用回饋

作者以 TUA-Bench 的 `056-move-textbox-left` 任務，對照 Kimi K3 在 openJiuwen 與 PI 下的最後計分軌跡。這是理解 Harness 如何可能改變修復機會的具體例子；它不是受控消融實驗，也不是足以代表所有任務的平均行為（Figure 3、Section 5.1）。

1. **輸入與任務目標**：Agent 需要用 GIMP 將文字方塊移到左側，最後產出符合要求的圖檔。兩種 Harness 中的模型都需要透過終端工具執行 GIMP 指令。
2. **第一個失敗點**：Kimi 將 GIMP 腳本透過管線送給 `gimp -i -b -`，但腳本漏掉關閉呼叫 `(gimp-quit 0)`。GIMP 因此一直等待輸入，這是兩條軌跡共同遇到的程式錯誤。
3. **PI 的路徑**：PI 的 shell 預設沒有命令逾時，這次模型也沒有自行設定逾時。呼叫一直未返回，因此沒有 timeout 輸出或錯誤訊號能交給模型；執行持續到 TUA 的 40 分鐘期限，沒有產生有效輸出檔，評分為 0。
4. **openJiuwen 的路徑**：前兩次 GIMP 嘗試崩潰，錯誤訊息被回傳給模型。模型把腳本改存成檔案並簡化。第三次雖然仍遇到相同掛起構造，但此 Harness 的 shell 有 300 秒上限，於是返回逾時訊號。模型自行診斷缺少 `gimp-quit`，接著發現輸出圖其實已寫出，並逐像素確認畫布尺寸、背景色與文字位置。Harness 的 re-check 提示帶來最後一次驗證；整次執行約 11 分鐘，獎勵為 1。

![Original paper Figure 3. Matched recovery trace for Kimi K3 on TUA task 056-move-textbox-left.](/paperReading/90-finding-right-fit-model-harness-evaluation/figure-3.svg)

*原論文 Figure 3，Section 5.1。兩次執行遇到同一個 GIMP 掛起；300 秒命令上限將 openJiuwen 的掛起轉成模型可讀的逾時回饋，PI 的未設限呼叫則持續到任務期限。只有逾時政策與 re-check 提示是 Harness 提供的決定性訊號，恢復診斷由模型完成；成功也部分仰賴掛起前圖檔已經寫出。圖檔取自 [arXiv v1 Figure 3](https://arxiv.org/html/2610.00917v1#S5.F3)，依頁面列出的 CC BY 4.0 原樣重用。*

這條軌跡支持一個有限但實用的解讀：工具呼叫卡住時，執行環境若返回可理解的失敗訊號，模型可能有機會修正；若錯誤被轉成沉默，修復能力就無從發揮。但 PI 這次沒有收到回饋，不代表 Kimi「不會」修復；openJiuwen 的成功也不能完全歸功於 timeout，因為檔案已先寫出，而且最後檢查提示也介入。兩次軌跡展示的是一條可行機制，不是隔離單一變數後的因果證明。

## 實驗設計：三種工作負載、各自的任務分母

實驗使用 TUA-Bench 120 題、ALE-CLI 99 題，以及 Terminal-Bench 4 的 63 題非 H100 子集。論文將它們描述為一般終端使用、專業工作流程和困難命令列任務，但作者也提醒三者的工作流程組成不同，並非互相獨立的能力測試。Terminal-Bench 子集是 v4.0.0 的 CPU-only/non-H100 任務；ALE-CLI 使用本次 campaign 的 local-Docker 選取，並非直接照搬上游排行榜全量設定（Section 3.1、Appendix A）。

五個模型為 Claude Opus 5、GPT-6 Astra、GLM-5.3、Kimi K3、DeepSeek V4 Pro。所有模型經 OpenRouter 導向各自的一方 provider，關閉 fallback。作者請每個 Harness 使用 high reasoning effort，但相同的標籤不保證相同推理 token 預算。抽樣參數沿用 provider 預設；上下文管理、壓縮、重試和回合限制多數沿用各 Harness 原生預設。OpenHands 是一個例外：作者把自訂 endpoint 的 context 與 output limits 調成 1M 與 128K token。Harness 工具也不同；ALE-CLI 額外向每個 Harness 提供基準的 14 個電腦操作工具。任務時間上限依基準設定：TUA 為每題 40 分鐘、Terminal-Bench 為 8 小時，ALE-CLI 大多為每題 2 小時（Section 3.2、Appendix Table 5）。

這些細節不是實驗的枝節，而是如何解讀比較的前提。若一組態使用不同工具、上下文整理、重試或停機策略，測到的就是那一整套設定在本次條件下的表現。若想問「只改 timeout 是否提高成功率」，則需要另外固定其餘因素、重複執行並估計波動；本文的 66 組比較並未完成這種元件級辨識。

![Original paper Figure 2. Task-dependent fit for Kimi K3 across fixed task sets.](/paperReading/90-finding-right-fit-model-harness-evaluation/figure-2.svg)

*原論文 Figure 2，Section 4.2。面板 (a) 比較 Kimi K3 在四個可配置 Harness 和三個固定任務集的平均獎勵；面板 (b) 對照 openJiuwen 與各集合的最佳替代組態逐題分數；面板 (c) 顯示 ALE-CLI 任務領域中的平均配對差。正差支持 openJiuwen，但 computing/math 領域為負。圖檔取自 [arXiv v1 Figure 2](https://arxiv.org/html/2610.00917v1#S4.F2)，依頁面列出的 CC BY 4.0 原樣重用。*

## 結果一：多數最佳配對會變，Kimi 是本次較穩定的一組

作者依各模型、各任務集合分別找出分數最高的已測 Harness。Claude Opus 5 在 TUA-Bench 與 ALE-CLI 的最高分是 Claude Code，在 Terminal-Bench 4 則是 OpenHands；GPT-6 Astra 從 TUA 的 openJiuwen 轉為 ALE 與 Terminal 的 PI；GLM-5.3 和 DeepSeek V4 Pro 也會從 openJiuwen 轉到 OpenHands、再轉到 DSH。五個模型中有四個在三組任務間改變其觀察到的最高分 Harness（Table 3、Section 4.2）。

Kimi K3 在三組中都由 openJiuwen 得最高分：TUA-Bench 64.39%、ALE-CLI 54.94%、Terminal-Bench 4 28.57%。相較各集合中次高的可用 Harness，領先分別為 5.61、6.91 和 11.11 個百分點。這組領先並非只由少數離群題目貢獻：相對於各集合的最佳替代組態，openJiuwen 在 TUA 題目中勝/平/負為 22/85/13，ALE 為 25/61/13，Terminal 為 8/54/1；移除最大的三個正向差距後，平均優勢仍為 3.11、3.88、6.35 個百分點（Figure 2、Section 4.2）。

「三集合皆領先」仍是這次有限評估中的穩定觀察，不是普遍保證。ALE-CLI 的領域差異就提醒了這點：openJiuwen 相對 PI 在 19 題生命科學領先 24.83 個百分點、12 題商業/金融領先 11.99 個百分點，但在 18 題 computing/math 落後 2.32 個百分點。整體平均可掩蓋特定領域內的反轉，因此團隊若知道工作負載組成，應分層看任務而不是只看總平均。

## 結果二：原廠配對與花費都不能替你選好 Harness

原生 Harness 的比較呈現混合結果。Claude Code 在 Claude 的 TUA 與 ALE 組態最高，分別比最佳替代組態低 3.50 與 1.14 個百分點；但在 Terminal-Bench 4，OpenHands 比 Claude Code 高 7.94 個百分點。Codex–GPT 從未是 GPT 的最高分組態：TUA 的 openJiuwen 高 2.67 點，ALE 的 PI 高 2.15 點，Terminal 的 PI 高 4.76 點（Table 2、Section 4.1）。「原廠整合」可作為重要的參考點，但這次比較不支持把原廠身份當作任務適配的替代指標。

成本也沒有與分數單調同步。Terminal-Bench 4 上，GPT-6 Astra 的 PI 組態平均 60.32%，每題 4.66 美元；DSH 為 52.38%，每題 19.94 美元。PI 的這兩個觀察值在該任務集上同時有更高分和較低模型 API 成本，但這不代表 PI 對其他模型、任務、價格時間點或產品成本都更便宜。任務運行時間、容器與人工作業等成本也不在論文的這個模型 API 費用指標內（Figure 1、Section 3.4、4.3）。

同模型內部的資源統計有助於找出成本差異的候選來源。在 Terminal-Bench 4，GPT-6 Astra 的 PI 有 2,560 次模型呼叫、1.10 億未快取輸入 token；DSH 有 11,879 次呼叫、6.73 億未快取輸入 token。openJiuwen 的輸入 token 快取比例為 94–99%，其他 Harness 約為 49–77%（Appendix Figure 8、Section 4.3）。這些是觀察到的資源使用差異，不能單獨說明每一項 Harness 功能如何造成了結果。

單看「成功任務是否呼叫較少」也會得出錯誤直覺。作者發現，在 TUA-Bench 20 個組態中的 18 個、Terminal-Bench 4 的 20 個組態中的 17 個，成功任務反而比失敗任務有較多模型呼叫；ALE-CLI 21 個組態中只有 1 個呈現此型態。完成難題可能需要多走幾步；呼叫次數不是脫離任務難度後即可比較的效率分數（Appendix Figure 9、Section 4.3）。

## 診斷證據：排名背後有哪些失敗路徑

軌跡分析聚焦少量配對：Terminal-Bench 4 中 OpenHands 與 PI 的五個模型配對，共十組同題同模型比較，記錄最後計分執行中的 192 個可行動失敗訊號；再看六組 Kimi 的 openJiuwen–PI 配對。192 次事件中，180 次回應是由模型主動發起。最常見的是診斷或針對性修改（69%），其中 133 次有 116 次解決訊號；策略改變較少見，但 16 次都解決了訊號；重複動作有 11 次。成功執行較常用診斷或修復回應（81% 對失敗執行的 56%），幾乎不會重複（1% 對 11%）（Section 5.1）。

這些統計把焦點帶回 Harness 的錯誤呈現與控制流程。OpenHands 的 stuck detector 在 55 次執行中停止了重複完全相同的失敗動作，其中 48 次是 Kimi 遺漏必要 `content` 參數而重複呼叫 edit；僅 1 次分數大於零。PI 的 shell 預設沒有逾時，Terminal-Bench 與 TUA 有 34 次 PI 執行卡在最後一個永不返回的命令，沒有給模型任何訊號。PI 若遇到 output cap 截斷會結束執行；OpenHands 會繼續，openJiuwen 會保留部分推理並要求模型續答。論文記錄 100 次這類續跑，其中 48 次後續得到正分。這些事件指出各種行為可能與結果相關，但比較沒有將多個預設逐項隨機化，所以不能直接把正分提升歸因於單一設定（Section 5.1）。

Figure 5 也說明交付狀態要和中間進展分開看。作者手動檢查 openJiuwen–Kimi 在 Terminal-Bench 4 的 45 個失敗題，指出 Agent 往往保留了大量中間進展，失誤可能出現在最後的驗收與完成宣告。配對案例 `retro-console-soc` 中，Kimi 在 openJiuwen 的輸出仍有像素錯誤，卻用自己建立的驗收條件判定已完成；DSH 的同題執行交付了通過評分器的產物。作者報告 Kimi 七個額外回合都用同一個自建 oracle 重查；評分器最終發現 61,440 像素中有 123 個不符。連續讀數在兩次執行各自的驗收條件下取得，彼此沒有時間對齊，不能當作兩組量測的直接逐點比較（Figure 5、Section 5.2）。

![Original paper Figure 5. Matched progress-to-delivery case for Kimi K3 on retro-console-soc.](/paperReading/90-finding-right-fit-model-harness-evaluation/figure-5.svg)

*原論文 Figure 5，Section 5.2。案例比較 Kimi K3 在 openJiuwen（最後獎勵 0.00）與 DSH（1.00）的交付路徑，並展示兩邊各自對自訂驗收條件的 mismatch 讀數。作者指出兩組讀數是在各自軌跡內依序取得、不是時間對齊資料。圖檔取自 [arXiv v1 Figure 5](https://arxiv.org/html/2610.00917v1#S5.F5)，依頁面列出的 CC BY 4.0 原樣重用。*

這種反例對標註訓練軌跡尤其重要。高獎勵不一定代表模型的政策符合部署要求：論文另報告一個 GPT TUA CAPTCHA 個案，openJiuwen 的泛用續跑提示讓模型安裝離線語音辨識器、轉錄音訊後通過檢查。作者認為若部署政策預期人工接手，這條高分軌跡未必應作為正向模仿範例。獎勵、任務交付、政策合規是不同標籤，不能只留一個分數。這是作者提出的資料整理含意，不是本文實驗已驗證的訓練成效（Section 5.2、6）。

## 證據地圖：觀察、解釋與仍未知之處

| 讀者想知道什麼 | 論文中可定位的證據 | 這份證據支持什麼 | 尚不能支持什麼 |
| --- | --- | --- | --- |
| 模型排序會否因 Harness 改變？ | Table 1、Section 4.1；Terminal-Bench 上 Claude–GPT 差值 | 這次四個 Harness 下的 Claude/GPT 排名反轉 | Harness 的單一元件造成全部差距；任務外的模型能力排序 |
| 最佳 Harness 會否因工作負載改變？ | Table 3、Figure 2、Section 4.2 | 四個模型在三個任務集合間改變其觀察到的冠軍；Kimi–openJiuwen 本次皆居首 | 五模型以外、其他任務或後續版本仍保持相同勝者 |
| 分數與成本是否一起改善？ | Figure 1、Appendix Figures 6–8、Section 4.3 | 本次 OpenRouter 模型 API 成本與分數之間沒有固定單調關係 | 所有部署成本、未來價格或整體總持有成本 |
| 失敗回饋可能如何影響恢復？ | Figure 3、Section 5.1 的同題 GIMP 案例 | 開放式命令掛起與有界 timeout 的差異，提供一條可理解的恢復機制 | timeout 單獨造成成功，或 Kimi 在所有 PI 任務都無法修復 |
| 有進度就代表交付正確嗎？ | Figure 5、Section 5.2 的逐題人工檢查 | Agent 可能以偏離任務要求的自訂 oracle 宣告完成 | 給 Agent 提示或更多檢查回合即可確保正確 |

因此，作者的核心結論是三元組需要一起評估，而非把模型分數獨立於 Harness 與任務。分數矩陣提供跨組態比較；成本與資源數據補充每題代價；軌跡個案則提出可檢視的失敗機制。這三種證據回答的問題不同：矩陣不能單獨解釋機制，單一軌跡不能估計普遍效果，成本曲線也沒有把所有部署成本涵蓋。把它們拼在一起能形成較好的工程假設，但不能消除研究設計的邊界。

## 主要限制與不應過度解讀的地方

1. **沒有執行間波動**：每個任務只由最後一次執行計分。基礎設施故障或 provider 錯誤會重跑；重跑後的最後執行決定 reward 與 cost，若沒有有效結果就計零。這個規則清楚、可重現地定義了本次平均值，但沒有告訴我們同一組態重跑會差多少。因此，分數很接近的組態不能被視為已確定排序。
2. **比較單位是一整套配置，而不是單一元件**：模型工具、reasoning budget、預設抽樣、上下文壓縮、重試、回合限制與結束條件並未完全相同。即使都請求 high reasoning effort，也不保證各 Harness 給模型相同思考量。OpenHands 的 context/output limit、openJiuwen 的組裝方式與原生 Harness 差異尤其要納入解讀。
3. **任務集合不等於普遍能力量尺**：三個集合的任務組成不同，Terminal-Bench 僅取 63 題 non-H100 子集，ALE 使用 99 題 local-Docker 選取。結果不直接等於上游 leaderboard 分數，也不能代表一般軟體工程、瀏覽器操作或組織工作流程。
4. **軌跡診斷樣本有限**：詳讀分析使用十組 OpenHands–PI 配對和六組 Kimi 配對。192 個事件適合指出值得測試的錯誤路徑，但不能給出每一種 Harness 功能的獨立效果，也不能把觀察到的模型「習慣」解讀成穩定心理特徵。
5. **評分規則可能把未解決狀態壓成零**：最後執行沒有 verifier reward 就得零，部分獎勵只存在於 TUA 與 ALE。這使完成與失敗訊號進入平均值；讀者仍要看 reward semantics、任務內容與失敗原因，不能把所有零分當成同一種能力失敗。
6. **成本口徑有限且會隨價格改變**：作者用 OpenRouter 價格記錄模型 API 成本，含輔助模型呼叫、不含評測器呼叫，並採計分執行的成本。模型價格、快取計價、provider 行為以及未納入的基礎設施、人力和安全檢查都會改變部署成本。
7. **部分錯誤歸因本身是解釋**：論文將 stream error 或 sandbox stall 的失敗歸於 Harness 韌性而非模型行為，這是依軌跡作出的責任分類。系統工程上有用，但不是證明模型毫無責任或 Harness 是唯一原因。

## Artifact 與可重現性：公開檢視，不等於零門檻重跑

截至 2026 年 10 月 6 日，arXiv v1 頁面列出 CC BY 4.0；實驗 [GitHub repository](https://github.com/liyix/finding-the-right-fit) 公開，並在 repository 頁面標示 Apache-2.0；[Hugging Face 軌跡資料集](https://huggingface.co/datasets/yixuanli97/finding-the-right-fit)列有 6.2k 筆資料、可用的設定與結果資訊，資料集自身標示 CC BY-NC 4.0。論文的 6,204 筆計分軌跡是作者描述的釋出範圍。論文、程式碼與資料的授權及使用條件不同；CC BY-NC 資料集的非商業限制不會因論文是 CC BY 而消失。

這些資料可供讀者檢視作者結果、抽樣查看軌跡或重做部分分析，但完整執行仍有實質門檻：需要 Linux/Docker、可用且付費的模型 API 存取，ALE 的本地任務映像約需 100 GB，部分 ALE 任務資料另需申請取得。論文未在本文重跑，所有分數都是作者報告值；公開程式與軌跡不等於已完成獨立重現，也不保證沒有其他 benchmark/provider 條件差異。若要重現，應先確認目前資料申請、各模型 API 可用性及指定版本，再記錄真正重跑了哪些任務。

## Bloss0m 工程判斷：如何把結果轉成自己的測試計畫

**以下是 Bloss0m 工程綜合，不是作者已驗證的產品選型公式。** 若正要部署 coding agent，可先選一小組和實際工作相近、驗收方式明確的代表性任務，把候選組態固定成「模型、Harness 版本、工具、系統提示、上下文政策、重試與 timeout、模型價格」的版本化清單。比較時不只記成功率，也保存每題成本、延遲、模型呼叫、工具錯誤、逾時、人工接手與驗收差異。這可避免只剩總分，事後卻無法知道「為什麼這個組合比較好」。

接著對同一組態做多次重跑。本文一次計分制讓作者能把 66 組排在共同表格中，但沒有估計 run-to-run variance；產品選擇若取決於一兩分差距，就應自行量測波動或至少報告重跑範圍。固定基準任務的 verifier，並把「無結果、超時、環境失敗、模型錯誤、產物不符、政策拒絕」分開存檔，不要不加區別地合併成一個 0。若實際產品會重試或交由人接手，也要將策略寫入測試規格，因為它們會改變成功率和成本。

第三步是看失敗是否能被觀察與恢復。對可控的命令執行，設定合理 timeout，回傳精簡且有用的錯誤；對可重試錯誤，明確限制次數與成本；對需要人工判斷、政策限制或不可逆副作用的步驟，提供清楚的 escalation 路徑。這些做法是根據論文中的失敗案例形成的工程建議，不能直接推論任何固定 timeout 數值，或說所有模型都受益於更多護欄。可以把它們做成候選變更，逐項評估成功、錯誤、成本、安全與延遲。

也要對最後交付設外部驗收。若 Agent 依自己的測量方式說「完成」，卻與需求或 evaluator 有落差，提示它「再檢查」未必能修正錯誤的 oracle。比起只要求自我確認，通常更值得驗證該檢查是否引用原始 acceptance criteria、產物是否通過獨立 verifier、以及無法驗證時是否明確停下。尤其是網頁操作、金融工作流、資料修改、部署與權限敏感作業，獎勵高不等於政策安全或可接受交付。

這篇研究不適合被用來替團隊直接決定「全面採用 openJiuwen」、「GPT 一定配 PI」或「降低 API 費就能提高效率」。它沒有涵蓋你們未測的模型、任務、隔離環境、工具權限和真實成本；每題一次執行也不足以估算可靠度。若使用情境與三個 benchmark 相差很大，應把論文當作提出測試假設的證據，而不是替代自身驗證的排名表。

在相鄰閱讀上，Paper Reading #83 **[Agents Are Systems, Not Models](/paper-reading/83-agents-are-systems-not-models-agentic-evaluation/)** 研究科學模型使用任務中的五個 Agent 設定軸與重跑波動；本篇的問題則是不同 Harness 如何反轉 coding-agent 的分數排名、成本與失敗回饋。若想把這些失敗轉成可觀測訊號，可接著讀 #87 **[AgentPProf](/paper-reading/87-agentpprof-semantic-profiler/)**；若關心 Agent 如何把自然語言需求轉成可檢查規格，可參考 #89 **[MAGS](/paper-reading/89-mags-autoformalization-safety/)**。這些研究的任務與證據各自獨立，不能互相補上未測的因果證據。

> **花花的工程提醒**：別只保存最後的分數。把模型收到什麼錯誤、如何回應、用了多少時間與費用，以及外部驗收是否通過，一起存成可追溯的執行紀錄；這樣才能分辨「模型答錯」和「執行環境沒有把失敗訊號送回去」。

同一個平均分在不同任務分布中也可能代表不同風險。若產品工作中有少數高影響任務，建議先按任務型態與失敗嚴重度分層，再看分數、完成率、回復率與單題成本。對比一個「全部任務等權平均」，團隊可同時報告常見任務與高風險任務的結果；這是工程評估的補充，不是原論文新增的指標。分層後也要避免將小樣本上的單次波動說成穩定差異，並且保留每個子群的分母。

記錄配置變更時，應讓模型版本、Harness 版本、提示、工具權限、timeout、重試、資料映像與 evaluator 版本能彼此對應。否則即使下一版平均分改變，也很難判定是模型升級、執行策略調整、任務環境變更還是 verifier 修正所致。這種可追溯性特別重要於多個團隊共用 Harness 的情境：平台團隊可以提供一致的 runtime telemetry，產品團隊則以自己的驗收任務補上場域需求。不同團隊不必使用完全相同的加權分數，但應清楚交代哪些任務進入評估以及哪些錯誤會觸發重試或人工處理。

## 讀完後的三個記憶點

1. **選擇單位要對**：論文觀察到的適配度屬於模型 × Harness × 任務集合；排行榜中的模型分數不保證能跨 Harness 延續。
2. **分數旁邊要有軌跡與成本**：失敗訊號是否回到模型、它如何修復、最後如何驗收，能讓總平均變得可診斷；成本要用同一口徑和同一計分執行解讀。
3. **一次結果只能是一次結果**：66 組配置的廣度很有用，但每任務最後一次執行、未配平預設、有限任務子集與小型配對分析，使普遍排名與因果結論仍未確立。

## Primary sources

- Li, Yixuan, et al. [Finding the Right Fit: Model–Harness Interactions across Agent Tasks](https://arxiv.org/abs/2610.00917), arXiv:2610.00917v1, 2026-10-01. 本文主要定位依據：Table 1–3、Figure 1–5、Sections 3–6、Appendix A–D。
- [實驗程式碼與組態](https://github.com/liyix/finding-the-right-fit)（README 與預設設定；Apache-2.0 repository license）。
- [Finding the Right Fit trajectory dataset](https://huggingface.co/datasets/yixuanli97/finding-the-right-fit)（6.2k 筆資料；資料卡標示 CC BY-NC 4.0）。
