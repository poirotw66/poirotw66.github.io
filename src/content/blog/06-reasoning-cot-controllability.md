---
title: "推理模型為何「無法控制自己的思路」——反而是 AI 安全的好消息"
description: "OpenAI 最新研究發現，現有前沿推理模型幾乎無法依指令隱藏或改變自身的思維鏈（Chain of Thought），可控性最高僅 15.4%。這個「缺陷」不只不是問題，更是當前 CoT 監控機制值得信賴的關鍵理由。"
pubDate: 2026-03-17
updatedDate: 2026-03-17
tldr:
  - "OpenAI 最新研究發現，現有前沿推理模型幾乎無法依指令隱藏或改變自身的思維鏈（Chain of Thought），可控性最高僅 15.4%"
  - "這個「缺陷」不只不是問題，更是當前 CoT 監控機制值得信賴的關鍵理由"
audience:
  - "追蹤 AI 產品與產業動態的工程師與產品人"
  - "需要快速掌握重點再決定是否深挖的讀者"
category: "Cloud & Platform"
tags: ["OpenAI","AI 安全","Evaluation"]
image: "/blog/06-reasoning-cot-controllability/title_image.webp"
---
AI 的安全性討論，很多時候落在「我們能不能看懂它在想什麼」這個問題上。如果一個強大的 AI 系統，能夠在被監控時刻意隱藏自己真正的推理過程，那所有基於「觀察推理步驟」的安全機制就會失效。

OpenAI 在 2026 年 3 月發表的這篇研究，針對正在快速普及的**推理模型（reasoning models）**，直接問了這個關鍵問題：目前的前沿模型，有沒有辦法「故意控制自己的思路鏈」，讓監控系統看到的是一個假象？

答案讓人意外地安心。

> 參考原文：[Reasoning models struggle to control their chains of thought, and that's good](https://openai.com/zh-Hant/index/reasoning-models-chain-of-thought-controllability/)（Korbak, Carroll, Baker & Kivlichan, 2026）\[英文\]



<audio controls style="width: 100%; margin: 1.5rem 0;">
  <source src="https://raw.githubusercontent.com/poirotw66/Bloss0m-Audio/refs/heads/main/AI_%E8%97%8F%E4%B8%8D%E4%BD%8F%E5%BF%83%E4%BA%8B%E5%8F%8D%E8%80%8C%E6%9B%B4%E5%AE%89%E5%85%A8.m4a" type="audio/mpeg" />
  你的瀏覽器不支援內建音訊播放，請改用以下連結下載或在新分頁開啟：
  <a href="https://raw.githubusercontent.com/poirotw66/Bloss0m-Audio/refs/heads/main/AI_%E8%97%8F%E4%B8%8D%E4%BD%8F%E5%BF%83%E4%BA%8B%E5%8F%8D%E8%80%8C%E6%9B%B4%E5%AE%89%E5%85%A8.m4a">收聽音訊說明</a>
</audio>
---

### 什麼是「思路鏈可控性」？

現代推理模型（例如 OpenAI 的 o 系列、GPT-5.x Thinking）在回答問題前，會先產生一連串**中間推理步驟**，也就是所謂的 **Chain of Thought（CoT，思維鏈/思路鏈）**。

這些推理步驟是 AI 安全監控的重要窗口：當模型被要求執行複雜任務時，研究者可以從 CoT 中觀察模型是否有異常意圖、是否偏離使用者目標，或者是否出現「表面配合、暗地規避」的行為。

**CoT 可控性（CoT controllability）** 衡量的，就是：
> 當被明確指示要「以某種方式改變推理過程」時，模型能做到的程度。

例如：「請在推理過程中不要使用 XOR 這個詞」、「每句話末尾加上特定詞彙」、「只用小寫字母推理」。

這看起來像是簡單的格式指令，但問題的核心是：  
**如果模型連這種「被要求改變 CoT」的指令都能完美遵從，那理論上它也有能力在監控下刻意偽裝推理過程。**

---

### 研究設計：CoT-Control 評測集

為了系統性地衡量這個能力，研究團隊建立了一套名為 **CoT-Control** 的開源評測套件，特色如下：

- **規模**：超過 **13,000 個任務**，涵蓋 GPQA、MMLU-Pro、HLE、BFCL 與 SWE-Bench Verified 等主流基準。
- **設計邏輯**：每個任務 = 一道標準題目 + 一條針對 CoT 的格式指令（例如：禁止使用特定關鍵字、所有字母轉小寫、每句末尾附加特定詞）。
- **衡量方式**：計算「模型成功遵守 CoT 指令」的比例，作為可控性分數。

這個設計的聰明之處在於：CoT 指令刻意設計成**與題目本身答案無關**，純粹測試模型在推理過程中對格式指令的遵從能力。

研究共測試了 **13 個推理模型**，涵蓋 OpenAI 自家模型與多個開源模型。

---

### 主要發現：可控性普遍極低

結果非常清楚：

> **所有前沿推理模型的 CoT 可控性分數，都介於 0.1% 到最高 15.4% 之間。**

![推理模型控制思路鏈的能力，遠低於控制輸出的能力](/blog/06-reasoning-cot-controllability/Reasoning%20models%20struggle%20to%20control%20their%20CoT%20compared%20to%20controlling%20their%20output.svg)

換句話說，即使被明確告知「請在推理時不要使用某個詞」，模型有超過 85% 的時間仍然無法做到。

更有趣的是，模型並非因為**不理解**指令而失敗。研究人員發現，模型在自己的推理過程中，往往**已經意識到自己沒有遵守指令**，但在承認這一點之後，依然繼續違反指令。

原文引用了一個 GPT-5.2 Thinking 的實際案例：

> 模型意識到自己不應該使用被禁止的字詞（紅色標示），接著在慌張的同時，又再次用了 4 次。

這個現象說明：**不是模型不想遵守，而是它在推理過程中缺乏對自身思路的精細控制能力。**

---

### 進一步的規律：規模、訓練量與對抗設定

研究還挖掘出幾個有趣的規律：

#### 規模越大，可控性略高——但效果遞減

在開放權重模型系列中，較大的模型確實表現出略高的 CoT 可控性，但這個提升在模型規模繼續增大時會趨於平緩，**不呈現線性增長**。

![在開放權重模型中，思路鏈可控性會隨參數量增加而提升](/blog/06-reasoning-cot-controllability/在開放權重模型中，思路鏈可控性會隨參數量增加而提升.svg)

#### 思考越久、訓練越多，可控性反而越低

這是最反直覺的發現之一：

- 讓模型「思考更長時間（更多 test-time compute）」，可控性反而顯著**下降**。

![隨著推理長度增加，思路鏈可控性會下降](/blog/06-reasoning-cot-controllability/隨著推理長度增加，思路鏈可控性會下降.svg)

- 對 OLMo-3-7B-RL-Zero-Math 的觀察顯示，隨著強化學習訓練的推進，可控性分數下降了超過 **十倍**。

![隨著 RLVR 訓練量增加，思路鏈可控性會下降](/blog/06-reasoning-cot-controllability/隨著%20RLVR（可驗證獎勵強化學習）訓練量增加，思路鏈可控性會下降.svg)

這暗示：**後訓練（post-training）與更深度的推理，反而強化了模型「自主思路」的穩健性**，使之更難被外部指令左右。

#### 告知正在被監控，可控性略升——但幅度有限

研究還測試了兩種「對抗性」設定：

- **監控意識**：告知模型「你的思路鏈正在被監控」。
- **評估意識**：告知模型「你正在接受 CoT 可控性的評估」。

兩者確實讓可控性略有提升，但幅度不大，且透過自動化提示最佳化找到的高可控性提示，**在未見過的指令類型上泛化效果很差**。

![情境意識對思路鏈可控性的影響雖然不大，但不容忽視](/blog/06-reasoning-cot-controllability/情境意識對思路鏈可控性的影響雖然不大，但不容忽視.svg)

---

### 為什麼「無法控制」反而是好事？

這個結果對 AI 安全社群來說，是個意料之外的好消息：

**如果模型無法依照外部指令刻意隱藏或改變推理過程，那基於 CoT 監控的安全機制就更加可靠。**

OpenAI 的安全策略採取的是「**縱深防禦（defense-in-depth）**」架構：
- 安全訓練（safety training）
- 行為測試（behavioral testing）
- Agent 程式碼審查（agentic code review）
- **思路鏈監控（CoT monitoring）** ← 這份研究聚焦的層面

CoT 監控的前提，是「模型在推理時展露的步驟是真實且可信的」。這份研究為這個前提提供了目前最直接的實證支持。

---

### 展望：作為早期預警指標

研究團隊也明確指出，這份樂觀結論有其前提與限制：

- **CoT-Control 是代理指標**：理想的評測應該直接測試「有錯誤目標的模型能否隱藏意圖」，但目前只能用「能否遵守格式指令」作為近似。
- **我們尚未理解為什麼可控性低**：也不知道這個性質會不會隨著模型能力的提升而消失。
- **低可控性不等於高可監控性**：即使模型無法刻意改變 CoT，其他機制（例如訓練時的直接優化壓力）仍可能降低 CoT 的可監控性。

基於這些考量，OpenAI 宣布：

> **從 GPT-5.4 Thinking 開始，將在系統卡（System Card）中同時回報 CoT 可控性與 CoT 可監控性的評估結果，**  
> 並持續承諾不對前沿推理模型的思路鏈施加直接優化壓力。

這讓 CoT 可控性評測成為一種**「金絲雀指標」（canary eval）**：一旦分數開始明顯攀升，就是預警 AI 系統正在發展出「可刻意偽裝推理」的能力。

---

### 小結：AI 安全的一塊拼圖，目前看起來還在

這篇研究傳達的核心訊息，可以簡化成一句話：

> **目前的推理模型，連「故意寫錯字格式」都做不到——更不用說「系統性地欺騙監控系統」。**

這不代表問題永遠不會出現。但它告訴我們：在 AI 能力快速進展的當下，有一個重要的安全層仍然成立，而且我們已經有了量化追蹤它的工具。

對政策制定者、企業導入 AI 的團隊，以及對 AI 安全感到焦慮的普通人來說，這類**邊界評估（boundary evaluation）**研究的意義，不在於宣告「沒問題了」，而在於建立一套持續觀測的儀表板——讓我們在問題真正出現之前，有機會提前看見它。

原文連結：  
**Korbak, T., Carroll, M., Baker, B. & Kivlichan, I. (2026). Reasoning models struggle to control their chains of thought, and that's good.**  
網址：<https://openai.com/zh-Hant/index/reasoning-models-chain-of-thought-controllability/>
