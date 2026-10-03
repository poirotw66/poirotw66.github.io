---
title: "Claude-shaped science：Agent 算得快，人仍要選對問題"
description: "Matthew Schwartz 分享如何用 BootLoops 把 Agent 接進可重算的量化研究；真正決定結果是否成為科學進展的，仍是人類選題、專家校準與驗證。"
pubDate: 2026-10-03
updatedDate: 2026-10-03
tldr:
  - "BootLoops 把數學與科學計算工具、操作 protocol 和驗收條件組成可由不同 LLM 驅動的 harness。"
  - "Schwartz 自述數週內完成 30 個 Feynman integrals 的端到端計算，其中 15 個重現已知結果、15 個是此前未計算的結果；這不是獨立稽核的生產力研究。"
  - "研究者仍需選出值得解的問題，並由領域專家判斷技術正確的結果是否具有科學意義。"
audience:
  - "設計 Agent harness、可驗證計算或研究工作流的工程師"
  - "評估 AI 對科學研究任務與研究者分工影響的實驗室主管及研究人員"
category: "AI Engineering"
tags: ["AI Agent", "Research", "Machine Learning"]
kind: "article"
showToc: true
image: "/blog/131-anthropic-claude-shaped-science-agentic-research-workflow/title_image.webp"
---

如果 Agent 能把一段計算從數週縮短到幾十分鐘，這代表科學家可以少做一些工作嗎？Anthropic Science 於 2026 年 10 月 1 日刊出物理學家 Matthew D. Schwartz 的客座文章 [《Claude-shaped science》](https://www.anthropic.com/research/claude-shaped-science)，給出的答案比較細緻：Agent 擅長處理某些可編碼、可重算、答案能被檢查的工作；但人類仍要挑選值得解的問題，並判斷答案對該領域是否重要。

Schwartz 在文中描述他與 Claude、以及自己建立的 BootLoops 工具集合作的研究經驗。文章是研究者的第一人稱回顧，不是 Anthropic 對生產力的獨立評估，也不是工作被取代的實證。它最值得看的地方，是把「AI 幫忙做科學」拆成一條可討論的工作流程：計算可以自動化，驗證要設計進工具，而研究方向與意義仍需要人的判斷。

> **花花的一句話**
>
> Agent 可以擴大研究者能計算的範圍，卻不會自動知道哪個正確答案值得成為一篇科學論文。

## 從「像人類科學家」改成找適合 Agent 的問題

Schwartz 認為，現有大型語言模型的能力和研究者期待的「人類合作者」並不完全吻合。模型能讀大量論文、寫程式，也能在明確的數學問題上快速試算；但面對開放式科學問題時，仍可能需要研究者反覆拉回方向，才會產生有用成果。

因此，他改用另一個問題開始：哪些研究工作剛好符合目前 Agent 的長處？這類問題被他稱為「Claude-shaped」：不必要求模型一口氣提出重大理論，而是找一段可明確表示、可用程式處理，且結果能經由獨立路徑檢查的工作。這是一個研究者提出的工作假說，不是經比較實驗證明所有科學工作都適用的分類。

## BootLoops：讓計算能力連上可檢查的工具

[BootLoops](https://github.com/BootLoops-ai/bootloops) 不是新的基礎模型，也不是 Anthropic 的產品。它由 Schwartz 建立與維護，是一套讓 LLM Agent 使用的量化科學工具與工作 protocol；Anthropic 客座文章的 disclosure 也明確指出，Schwartz 當時是 Anthropic 訪問研究員，而 BootLoops 並非 Anthropic 專案。

這套 harness 的工程重點不只是把工具交給 Agent。GitHub README 說明，每項工具會記錄用途、適用時機、輸出意義，以及答案必須通過的測試。部分計算使用精確或高精度算術、誤差界限、完整性證書或獨立計算路徑；不同工具各有自己的接受條件。簡單說，Agent 可以提出計算與執行步驟，但不能只因自己說「完成」就讓結果通過。

對工程團隊而言，這比一個萬用研究 prompt 更具體：把領域方法封裝成可重用工具，並把驗收規則和工具放在同一工作流裡。它也不是免設定的單一程式；repo 說明部分外部計算引擎要另外安裝，工具自測中也有需要額外資料的項目。正式採用前，團隊仍須依問題確認相依套件、輸入資料與驗證路徑。

## 30 個積分說明了什麼，又沒有說明什麼

文章中最鮮明的案例是 Feynman integrals。Schwartz 表示，Claude 協助把分散在論文與不同程式語言中的方法移到共同框架，也延伸既有計算工具；他們端到端處理了 30 個積分，其中 15 個以新方法重現已知結果，另外 15 個是此前未計算的結果。作者說這些工作在幾週內完成。

這是具體而值得追查的研究成果，但要保留證據邊界：上述數量與時間是 Schwartz 在客座文章中的自述，不是獨立研究者對工時、成本或整體生產力的稽核。重現已知結果、計算此前未算過的積分，也不能直接等同產生了 15 項重要的新科學發現。要評估個別結果，還要讀它對應的論文、程式與驗證資料，而不是只看總數。

## 專家把「算對」推向「值得研究」

文章提供了一個比成功數字更重要的例子：Claude 把一個中性生物多樣性模型的方程式解出來，Schwartz 將初步結果帶給生態學家 James O’Dwyer。Schwartz 說，O’Dwyer 認可技術上的成果，卻提醒這個結論對許多生態學家可能不夠新；他進一步建議分析觀測值扣除模型預測後的差異。兩人再與 Claude 合作，將問題改成更貼近生態學家關心的預測模型。

這段過程揭示一條常被「Agent 發現新知」敘事略過的邊界：計算檢查可以告訴我們某個推導或數值是否吻合規則，卻無法單獨決定研究問題是否重要、既有領域是否早已知道相似結果，或下一步該如何提出。跨領域時，這個落差更大；原作者也表示，幾乎每次都需要領域專家協助把技術上正確的發現導向更有意義的問題。

> **花花的工程提醒**
>
> 可重算的答案不是完整的科學驗證。還要檢查模型假設、資料來源、獨立驗證路徑，以及領域專家如何判斷結果的意義。

## 研究 Agent 的工作流可以怎麼設計

Schwartz 也描述了支撐多個並行研究專案的操作方式：Claude Code 工作階段分別在 Google Cloud 虛擬機執行，由一個主工作階段協調子專案、計算資源與結果驗證；中間狀態保存在各專案的 Markdown 檔案中，另有工作階段負責程式驗證與扮演對抗性審稿者。這是作者對其工作環境的描述，不代表 BootLoops 自動替所有使用者提供相同的雲端編排系統。

文章也坦白列出 Agent 的失誤：它會過早宣告完成、時間估算不可靠、偏好把大量時間花在慢速計算而不是先做更快工具，長任務還會因上下文遺失而偏離原計畫。這些不是枝節，而是研究工作流設計必須處理的 failure mode。工程上可採取的做法包括：

1. 先由人定義問題、可接受輸出與停止條件；Agent 不自行改寫驗收標準。
2. 把昂貴計算拆成小型測試，先量測，再決定是否擴大執行。
3. 對關鍵數值要求可重算結果、獨立路徑或具正反控制的測試，而非只讀模型摘要。
4. 將計畫、資料、工具版本與中間結果持續保存，讓長任務可恢復且能被同儕檢查。
5. 由熟悉該領域的人判斷結果的新穎性、意義與下一個研究問題。

以上是從 Schwartz 的經驗整理出的工程建議，不是文章宣稱已證明的通用最佳實務。GitHub README 也提醒，部分工具會評估輸入檔內容，可能執行任意命令；不可信輸入應在隔離環境處理。數值證書能降低計算錯誤風險，不等於安全沙箱。

## 數量不能代替研究品質或工作影響評估

Schwartz 另稱，三個月內他與 19 位共同作者在 18 個領域推進 36 篇手稿，候選問題約有 400 個。這些規模是作者的專案摘要，不代表 36 篇都已發表、經同儕審查或達到相同成熟度。客座文章也沒有提供可用來估算每篇研究節省多少人時、研究成本如何改變，或職位需求是否變化的對照資料。

所以，這篇材料能支持的結論是：當任務是大量、可形式化、可驗算的計算，Agent harness 有機會降低技術工作的摩擦，讓研究者探索更多問題；它不能單獨證明科研整體生產力提升了多少，更不能推出研究人員會被取代。作者自己也強調，科學進展仍依賴資料取得、理解與檢查，接著才提出下一個問題。

## BootLoops 授權與使用邊界

目前 GitHub 主 repo 將 BootLoops 程式碼標示為 MIT，repo prose 與 figures 使用 CC BY 4.0；但這不代表整個工具鏈和所有相鄰 repo 都採相同授權。主 repo 明確說明，部分第三方程式保留原授權，並列出 GPL 元件；同一組織發布的其他 repo 也可能有自己的授權。若要在產品或研究服務中再散布，應逐一檢查實際使用的檔案、外部引擎和 sibling repository 授權，而不是只看組織頁上的單一標籤。

## 研究團隊可以先做的三個小實驗

若要借鏡這個模式，先不要從「讓 Agent 自動做完整研究」開始。挑一個已有可信答案的小型量化任務，讓 Agent 在固定資料與版本上重現它；再加入一項可以人工判斷的新問題，觀察工具驗證能處理哪一段、哪些決策仍需領域專家。最後記錄錯誤類型、人工修正、計算成本與研究者的選題時間。這些資料才能回答團隊真正關心的問題：Agent 是縮短了可驗證的計算環節，還是只把工作轉移到檢查輸出？

本文和 [Anthropic 的機器人工作研究](/blog/130-anthropic-robot-work-exposure-cost-boundary/)關注的不是同一件事：#130 比較實體任務的機器人能力曝光與成本競爭力；本文聚焦 Agent 如何改變研究工作的計算、驗證與選題分工。想補足 Agent 狀態、工具與治理的架構脈絡，可讀[AI Agent 實戰指南](/blog/64-ai-agent-guide/)；想看科研 Agent 工作台如何處理治理和產物來源，可接著讀[AIPOCH Open Science 架構解析](/blog/90-aipoch-open-science-workbench/)。

### Sources

- Matthew D. Schwartz, [“Claude-shaped science”](https://www.anthropic.com/research/claude-shaped-science), Anthropic Science guest post, 2026-10-01. Schwartz discloses that he was a visiting researcher at Anthropic; BootLoops is not an Anthropic project and is owned and maintained by him.
- [BootLoops main repository](https://github.com/BootLoops-ai/bootloops): toolkit, verification protocols, installation and platform notes, and licensing details.
- [BootLoops project site](https://bootloops.ai/): overview of the model-independent harness and its tools and application manuscripts.
