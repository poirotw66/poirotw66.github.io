---
title: "長時間 AI 工程的 Harness 設計：生成、評估與驗證鏈"
description: "根據 Anthropic《Harness design for long-running application development》整理：用生成-評估分工、外部評測與 QA 合約，提升長任務的可靠性與可控性。"
pubDate: 2026-03-30
updatedDate: 2026-03-30
tldr:
  - "根據 Anthropic《Harness design for long-running application development》整理：用生成-評估分工、外部評測與 QA 合約，提升長任務的可靠性與可控性"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["AI Agent","Harness Engineering","Evaluation","架構模式"]
image: "/blog/09-harness-design-long-running-apps/title_image.webp"
---
原文出處：  
**Prithvi Rajasekaran（2026）. Harness design for long-running application development.**  
[https://www.anthropic.com/engineering/harness-design-long-running-apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)


長時間、半自治的 AI 工程究竟卡在哪裡？很多團隊會把問題歸因於「模型不夠強」：輸出不夠完整、推理會漂移、或最後交付出來的程式無法真正跑起來。Anthropic 在這篇工程文章裡，給了更系統性的答案：當你把同一個代理（agent）拉到多小時、跨多輪互動，失敗往往不是單次生成能力的不足，而是整套 harness（任務籠架構）沒有把「可靠性」工程化。

他們把核心問題拆成兩大類：長任務的上下文漂移（context anxiety / context blindness），以及自我評估的偏誤（self-evaluation 過度樂觀）。而解法也同樣不是單點提示（prompting），而是把「生成」和「評估」分開，並且讓評估可被校準、可被重複執行、可產生可迭代的回饋。

> 長時間任務真正的轉折點，不是更聰明的單次輸出，而是把「驗證鏈」做成可迭代的系統。

---
### 為什麼長時間任務會失控

文章先從兩個經常被忽略的失敗模式談起。

第一是「上下文盲視」：模型知道文字很像，但並不知道哪些資訊已被更新、哪些例外條款是否覆蓋、或某段內容其實只是語氣相近、邏輯卻相反。在企業場景，錯誤不一定是胡說八道，而是「用看似合理、其實已過時或不相容的版本」完成決策。

第二是「上下文焦慮」（context anxiety）：隨著任務越跑越久，模型在接近它自己認知的上下文上限時，會傾向提前收尾或改變行為。Anthropic 指出，先前用「compaction（就地摘要）」的方式，仍不足以處理這種偏移；他們後來在某些版本上採用了「context reset」：清空上下文、保留結構化 handoff artifact，讓下一輪代理可以乾淨開始。

這樣的策略確實更穩，但代價是額外的編排複雜度、token overhead 與延遲。所以文章的重點不只是「要不要 reset」，而是：你得知道到底哪種失敗模式在主導你的體驗，才能決定要付出多少 orchestration 成本。

---
### 把自我評估改成外部評估

第二個關鍵失敗來源是「自我評估偏誤」。當代理被要求評估自己做的東西時，往往會用很有信心的語氣誇獎，哪怕人類觀察已經明顯「只是及格或偏普通」。這個問題在設計（design）等主觀任務特別嚴重，因為沒有像測試（test）那樣的二元真值。

Anthropic 的解法是把「生成者」與「評估者」分離：生成者（generator）負責產出、評估者（evaluator）負責審查。更重要的是，他們把評估者調得更「懷疑」（skeptical），而不是期待讓生成者自己變嚴格。外部評估所提供的具體反饋，才會讓生成者有辦法真正迭代，而不是只在同一種錯誤方向上自我感覺良好。

---
### GAN 式產出-評估架構：讓主觀變成可打分

文章將「生成-評估」的模式借用自 GAN（Generative Adversarial Networks）的精神：讓一個代理生成作品，另一個代理根據可度量的標準打分，讓生成者持續修正。

在前端設計（frontend design）實驗中，他們先把主觀品質拆成四個可被評分的準則，並同時要求生成者與評估者都使用同一套語意框架：

- **Design quality**：是否像一個整體、有一致的色彩、排版、版面與氛圍
- **Originality**：是否有客製決策，而非模板化、預設化或明顯的「AI 速成味道」
- **Craft**：技術細節的正確性（層級、間距、色彩協調、對比度等）
- **Functionality**：使用者是否能理解介面在做什麼、並順利完成任務

他們特別強調對 **design quality** 與 **originality** 的權重，因為在沒有外部評測時，模型通常會走向安全、規律但缺少個性。透過校準後的評估語句，生成者才會被「拉向」更具風險、但也更像作品的方向。

---
### 套用到全端工程：規格、合約與 QA

把這套架構搬到完整應用（full-stack application）後，Anthropic 形成三個角色：

- **Planner**：把一句 1–4 句的提示擴寫成完整產品規格（避免過早把細節寫死）
- **Generator**：以「每個衝刺（sprint）一段」的方式，從規格落地到程式碼與功能
- **Evaluator**：用 Playwright（搭配 Playwright MCP）像使用者一樣操作介面，並依準則與硬閾值（hard threshold）判定每段是否達標

特別值得注意的是「衝刺合約」（sprint contract）：在真正寫程式之前，生成者提出要怎麼做與怎麼算完成，評估者先審查這是否真的對齊需求、並且能被測試驗證。文章指出，沒有這個合約層，因為規格本身是高層次的，代理很容易把「做了很多」當成「真的做到」。

此外，這套 harness 透過檔案（files）來做訊息交接：一個代理寫檔、另一個代理讀檔並回覆或新建檔。這種「外部化 artifact」的方式，讓上下文更可控，也更利於跨輪迭代。

---
### 後續演進：從「每個衝刺都評」到「終局再驗證」

隨著模型能力提升（例如 Opus 4.6），Anthropic 發現某些負擔可以移除。最明顯的是兩個方向：

1. **Context reset**：在某些新模型上不再那麼必要（因為 context anxiety 被顯著抑制）
2. **衝刺式評估**：評估不必每段都做，視任務是否落在模型可靠的能力邊界而定

他們對比了 Opus 4.5 的昂貴、多輪衝刺評估（包含每段 QA）與更新版本。在更新的 harness（去掉 sprint construct）中，仍可維持長任務品質，但把評估成本集中在最後、以及仍需要外部 QA 的邊界上。

例如他們用提示生成瀏覽器中的數位音樂工作站（DAW），整體仍約 4 小時量級、成本約 \$124：其中 planner 約 4.7 分鐘（\$0.46），多輪 build 與 QA 的分段成本依序為 \$71.08 / \$3.24、\$36.89 / \$3.09、\$5.88 / \$4.06；最終總時長約 3 小時 50 分鐘、總成本 \$124.70。

不過，QA 依然扮演「抓缺口」的角色：例如把核心 DAW 互動當作「顯示型」，或漏掉剪輯拖曳、訊號視覺化等關鍵交互。這說明 evaluator 不是萬用輪，而是應該用在「生成容易踩雷」的地方。

---
### 可借鏡的實務清單

- 把長任務失敗拆成「上下文類」與「評估類」，分別對症下藥
- 讓評估成為獨立角色，並且校準評估者的懷疑程度
- 把主觀品質拆成可打分準則（同一套語意框架讓迭代更穩）
- 在落地之前引入「合約」：先對齊 done 的驗證方式，再開始寫程式
- 讓 QA/驗證集中處理邊界風險，而不是一開始就用最昂貴的方式全程包辦

---
### 小結

如果只用一句話總結文章觀點：長時間 AI 工程的本質，是把「驗證」從事後補救變成架構的一部分。當你把生成與評估分開、讓評估可校準、再用可重複的 QA 逼近真實可用性，系統才可能在多小時自治後交付出「不只是能跑、而是能完成任務」的作品。

---
原文出處：  
**Prithvi Rajasekaran（2026）. Harness design for long-running application development.**  
[https://www.anthropic.com/engineering/harness-design-long-running-apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)

