---
title: "EconSkills 精讀：網頁 Agent 技能如何轉移與檢索"
description: "EconSkills 將成功的經濟資料查詢軌跡整理成含範圍、驗證與復原步驟的參數化 SOP。已知技能匹配時轉移有效；整庫檢索仍受覆蓋率與近似錯配牽制。"
pubDate: 2026-10-05
updatedDate: 2026-10-05
tldr:
  - "論文把 50 條已驗證網頁軌跡整理成可填入新日期、地區或指標的七欄 SOP，並分開量測已知正確技能時的轉移，以及必須從技能庫自行挑選時的部署效果。"
  - "100 個 held-out 變體、每條件三次執行中，匹配技能成功率由 41.0% 升至 49.3%；原始軌跡只有 7.0%，顯示可遷移的是經抽象化的程序，而非照抄舊操作。"
  - "全庫 360 題中，取回五條技能的 RETR5 整體為 28.3%，與無技能的 28.1% 持平；但在 210 個沒有直接對應技能的任務上，近似提示可能抵銷覆蓋任務的收益。"
  - "公開資料集有 50 個 Apache-2.0 技能檔；結果仍是作者報告，使用單一模型與一次部署執行，且即時網站會漂移，不能解讀為通用 Agent 效能保證。"
audience:
  - "設計網頁 Agent 技能庫、程序記憶與檢索流程的工程師"
  - "評估工具型 Agent 跨任務轉移、網站資料查詢或檢索可靠度的研究者"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "Research"]
image: "/paperReading/88-econskills-web-agent-skill-transfer/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - retrieval-rag
paper:
  title: "EconSkills: Studying Skill Transfer and Retrieval for Web Agents on Live Economic Data"
  authors:
    - "Yinzhu Quan"
    - "Zefang Liu"
  year: 2026
  venue: "arXiv:2609.19523 v1, submitted 2026-09-17; preprint, peer-review status not established"
  links:
    pdf: "https://arxiv.org/pdf/2609.19523v1"
    arxiv: "https://arxiv.org/abs/2609.19523"
    project: "https://huggingface.co/datasets/EconWebArena/EconSkills"
series:
  id: "agent-skill-transfer-evaluation"
  title: "Agent 技能轉移與評測"
  part: 1
  totalParts: 1
---

本文依據 2026 年 9 月 17 日提交的 [arXiv v1 預印本](https://arxiv.org/abs/2609.19523)；目前沒有已確認的同行審查狀態。作者想回答的不是「把成功對話存起來有沒有用」這麼寬的問題，而是：當一個網頁 Agent 之後還要查同一網站、但換了日期、國家或資料序列時，如何把已驗證的操作路徑改寫成可重用程序？以及當 Agent 必須從一整個技能庫自行找程序時，轉移效果還能保留多少？研究用官方經濟資料網站上的任務，將兩個問題分開測。最值得注意的結果是：給定正確匹配的技能確實有幫助，但整庫檢索遇到沒有直接覆蓋的任務時，近似提示可能反而拖累表現。

> **花花的工程提醒**
>
> 「有一條看起來相關的技能」不代表它適用於目前任務。技能要說清楚服務哪個資料與網站、何時可以用、怎麼確認答案，以及頁面變動時怎麼復原；若範圍不符，讓 Agent 拒絕使用往往比硬給提示更安全。

## 90 秒地圖

- **問題**：多數網頁 Agent 評測把每題當成獨立任務。Agent 在某網站摸索出有效路徑後，下一題即使只改國家或年份，也可能又從頭開始；把整段歷史照貼進 prompt 又會混入舊任務值與無關操作。
- **核心洞見**：EconSkills 從已成功且經 benchmark 檢查的軌跡萃取七欄 SOP，把特定日期、國家、指標等值改成 placeholder，並保留前置條件、網站提示、驗證及復原。作者再把「程序本身可否轉移」與「從技能庫選程序」拆成兩個實驗。
- **最強證據**：在 100 個同網站／同程序族的 held-out 變體中，匹配技能把成功率從 41.0% 提到 49.3%（300 個配對 seed-level 結果；McNemar exact test，p = 0.0031）；原始成功軌跡只有 7.0%。但 360 題整庫部署時，RETR5 是 28.3%，BASE 是 28.1%；在 210 個沒有直接匹配技能的題目上，RETR5 只有 14.3%，BASE 為 16.7%。
- **主要邊界**：實驗固定為一個 gpt-5-mini agent、BrowserGym／AgentLab 設定及 30 步上限。受控轉移已知正確技能；整庫部署每題每條件只跑一次。網站會變，且正確到達頁面並不保證選對單位、日期或序列。

## 既有方法的限制：從「重播成功軌跡」改問「什麼程序能跨任務使用」

經濟資料查詢常要在央行、統計局或國際組織的網站，找一個明確數字。問題不只是網頁導航：相鄰資料可能分別代表名目與實質值、季調與未季調序列、初值與修訂值，或不同生效日期。Agent 若在第一個任務中找到某條序列，下一次查同一網站上的另一個月份，不一定要重新摸索選單；但舊軌跡裡的日期和國家也不能照搬。

既有的一次性評測往往在任務結束後丟棄操作經驗。反思式 Agent 可以留下任務心得，但若它沒有把「哪些步驟與網站結構穩定」和「哪些值只屬於本次題目」分開，經驗既可能太鬆散，也可能是一段不可安全重用的 click recording。EconSkills 把可重用知識定義成更接近標準作業程序（SOP）的東西：保留導航方式、適用範圍和判讀檢查，把特定 instance 的值抽象成插槽。

因此論文關心兩種不同能力。**匹配轉移**假設系統已經知道該用哪一條技能，測技能本身能否幫助新任務；**技能庫部署**則要求系統從一個庫裡找出上下文，測試內容品質、檢索與 Agent 如何使用提示的合成效果。兩個數字不能混在一起看：第一個是「給對程序會不會進步」，第二個才接近「實際部署一個技能庫會發生什麼」。

## 核心直覺：把任務值抽象掉，但不抽掉資料語意

EconSkills 以七個欄位描述技能：名稱、目的、前置條件、按序執行的程序、網站特定指引、驗證規則、復原方式（Section 3.2；Table 2）。把一次性的「查 2024 年 3 月某幣別匯率」泛化時，日期和幣別會變成 `<date>`、`<currency>`；仍須保留「歐元對目標幣別」方向、日期範圍如何設成同一天、要用表格還是 CSV 取得精確值，以及非營業日不能默默拿前一天替代等知識。

這個抽象不是保證。作者先用 BrowserGym 操作網站，只有當 seed 任務同時通過 EconWebArena 的自動檢查，技能才納入：答案要包含正確值，最後頁面也必須位於預期的權威網域。抽取器讀取成功軌跡、造訪 URL、accessibility tree、動作與最終答案，再改寫成七欄 SOP。最後把 JSON 技能轉成 Markdown，放進 Agent 的額外指示通道（Sections 3.1–3.3）。

論文 [Figure 1](https://arxiv.org/html/2609.19523v1#S3.F1) 展示技能如何從已驗證的 seed 軌跡萃取，再由 Agent 用於新的經濟資料任務。

*Figure 1（論文 Section 3）：作者的三階段流程是任務執行、技能萃取及技能應用。此處以原文圖說與錨點說明，不複製圖像；arXiv v1 頁面標示的是永久、非專屬散布授權，並非明確的圖像重用授權。來源：[arXiv v1, Figure 1](https://arxiv.org/html/2609.19523v1#S3.F1)。*

### 兩個實驗分別隔離程序與選擇

作者用 50 個已解 seed task 各萃取一項技能，覆蓋 37 個權威網站與 EconWebArena 十類經濟資料中的九類。每條技能來自一個 seed 任務；50 條 skill family 各配兩個 held-out variants，總計 100 個新題目。受控實驗有三個條件：BASE 不給技能、TRAJ1 提供一段移除最終答案的原始成功軌跡、MATCH1 提供抽象後且直接匹配的技能。每個變體、每個條件都跑三次（seed 0、1、2），所以是 100 × 3 × 3 = 900 次 browser-agent episodes（Sections 3.3、4.1）。

另一個實驗讓技能選擇也成為問題：對全部 360 題各跑一次，測 BASE、ALL50（整個技能庫）、RETR5（依名稱與目的檢索前五條）、RAND5（五條隨機技能）和 HINT30（一條可忽略的提示）。HINT30 對 150 題直接覆蓋任務提供對應 family skill；另 210 題則仍拿到 top-1 檢索結果。後者不是「完全沒有提示」，而是沒有可直接匹配的技能。因此 HINT30 的無覆蓋組結果同時測到近似檢索與「請忽略不相符技能」這道提示是否足以克制錯配（Section 3.3；Appendix C）。

| 比較層次 | 任務與控制 | 它回答什麼 | 無法單獨回答什麼 |
| --- | --- | --- | --- |
| 已知匹配的受控轉移 | 100 個 held-out variants；BASE、原始 TRAJ1、抽象 MATCH1；每組三次 | 一條已知相關程序，是否比從頭做或照搬舊軌跡好？ | 真實系統能不能從大型技能庫選對技能？ |
| 整庫部署 | 360 個 live tasks；BASE、ALL50、RETR5、RAND5、HINT30；每組每題一次 | 檢索數量與覆蓋狀態，如何影響端到端成功率？ | 這些結果對多次執行的穩定度有多大？單次部署設定沒有跨 seed 誤差棒。 |

## 用一個例子走完整個方法：ECB 匯率技能

論文 Table 2 與 Appendix B.1 展示一條歐洲央行（ECB）參考匯率查詢技能。假設新題目要求「某一日，歐元兌特定幣別的參考匯率」。這不是拿 seed 的點擊順序機械重播，而是用它的 placeholder 與網站語意重建操作：

1. **輸入**：任務提供目標幣別及日期；技能前置條件確認這確實是 ECB 歐元外匯參考匯率問題，且 ECB 網站可用。
2. **填入插槽**：把 `<currency>`、`<date>` 放進既定操作，導向該幣別的 EUR reference-rate 頁面，並把日期範圍起訖都設成目標日。
3. **選擇精確呈現**：若圖表 tooltip 不夠明確，改用表格或 CSV；不要把圖形趨勢估值當成精確日值。
4. **驗證結果**：核對來源網域、頁面標題、幣別、日期與報價方向。ECB 的報價是「每 1 歐元可兌多少目標幣別」，不是反向匯率；要確認取到的是日參考匯率，而非百分比變動或指數。
5. **復原或停止**：若頁面不存在，回到 ECB 清單或站內搜尋；若日期欄位失效，改用 date picker；若遇到非營業日，不可未經允許就以最近一個營業日代替。

這條程序將網站上的穩定導覽結構與任務值拆開，也在「已抵達頁面」和「拿到正確答案」之間保留語意檢查。另一條 USCIS 費率技能則提醒，技能還得確認費率生效日期、表格列的申請類型、每位受益人或每次申請等限定詞，以及附加費或豁免；找對費率頁面，仍可能讀錯列（Appendix B.2）。

可能的失敗點包括目標日期是非營業日、網站改了選單、頁面上存在名稱很像但含義不同的序列，或模型把匯率方向倒置。SOP 的驗證和復原欄不是附註裝飾，而是決定程序是否可以被安全重用的一部分。相反地，若只保存「點某個選單、點第三列、讀取數字」，網站版面一改，這段技能就不再描述同一個工作。

## 結果一：匹配技能有效，原始軌跡卻不是好替代品

在 100 個 held-out variants 上，BASE 成功 123/300 次（41.0%），MATCH1 成功 148/300 次（49.3%），提升 8.3 個百分點。以相同 variant、條件和三個 seed 配對，MATCH1 把 46 個 BASE 失敗轉成成功，但也有 21 個方向相反的轉換；McNemar exact test 為 p = 0.0031（Table 3；Appendix C）。這支持一個有限結論：在作者指定的模型、網站任務與已知正確匹配條件下，抽象技能帶來淨改善，但不是每題都受益。

TRAJ1 只成功 21/300 次（7.0%），儘管軌跡源自同一程序族的成功任務。它的平均 episode steps 只有 7.95，看起來比 BASE 的 19.83 少；但這個短不是高效率，而是大量 run 提早失敗終止。匹配技能的平均步數是 15.67。若只比較 BASE 和 MATCH1 都成功的 102 個 seed-level cells，MATCH1 平均少 2.37 步，中位數少兩步；其中 59 個 cell 較短、15 個相同、28 個較長，排除平手後的雙尾 sign test p = 0.0012。步數分析只看兩邊都成功的配對，避免把提早失敗錯當成省步數（Section 4.2.1）。

論文還用 source-variant 層級避免把同一題的三個 seed 當成三個獨立任務家族。100 對中，27 對的匹配技能平均成功率提高，12 對下降，29 對至少有一邊成功但未分類為增減，32 對兩個條件都沒有成功。這些數字提醒：總體成功率的正向差異不是人人適用的保證；技能是否讓結果更好，與網站是否有穩定的序列頁或選擇器路徑有關（Table 5；Section 4.2.3）。

論文 [Figure 2](https://arxiv.org/html/2609.19523v1#S4.F2) 的代表性 live-site 軌跡顯示匹配提示如何改變導航，也顯示到達正確區段不等於已驗證答案。

*Figure 2（論文 Section 4.2.3）：ONS 任務中，提示將 Agent 從一般下載介面導向 MM23 時間序列表；USCIS 任務中，Agent 雖抵達 I-140 費用段落，仍未在 30 步內交回驗證值。這裡連結原文而不複製含第三方網站畫面的圖像。來源：[arXiv v1, Figure 2](https://arxiv.org/html/2609.19523v1#S4.F2)。*

## 結果二：一個相關提示，不等於技能庫整體有效

360 題的部署實驗把覆蓋與未覆蓋切開（Table 4）。BASE 整體成功 101/360（28.1%）；RETR5 為 102/360（28.3%），McNemar p = 1.0，統計上與 BASE 持平。若只看庫中有直接對應技能的 150 題，RETR5 成功 72/150（48.0%），BASE 為 66/150（44.0%），RETR5 領先。若看另外 210 題，RETR5 只有 30/210（14.3%），BASE 則為 35/210（16.7%）。在這組沒有精確技能的任務中，將五條近似候選放進上下文沒有帶來整體收益。

ALL50 是更清楚的反例：一次把整個 50 條技能庫交給 Agent，360 題中只成功 41 題（11.4%），低於 BASE 的 28.1%。RAND5 為 24.4%，HINT30 為 25.8%。這些對照說明提示數量與關聯性很重要，但不能直接證明只有 token 長度造成干擾：論文討論明確指出，它沒有將 prompt 長度、矛盾指示和相關性判斷各自獨立識別（Section 4.4）。

HINT30 在有直接覆蓋的 150 題中為 46.0% 對 BASE 的 44.0%，差異不顯著（p = 0.711）；它在 100 個 held-out variants 上兩邊都成功 45 題。可是在無直接匹配的 210 題上，HINT30 提示 Agent「技能可能過時或不匹配，不合用時可忽略」，仍只有 24/210（11.4%），BASE 則是 35/210（16.7%），差異 p = 0.043；整體 25.8% 對 28.1%，p = 0.341（Tables 4、6；Section 4.3）。作者因此把覆蓋感知的篩選列為下一個設計目標。這是基於觀察提出的方向，不代表研究已驗證一個能正確 abstain 的檢索器。

### 兩個容易混淆的比較

第一，受控 MATCH1 與部署 HINT30 不是同一實驗。MATCH1 在三個條件各有三次重跑，並直接指定正確技能；HINT30 是部署設定，只跑一次，對覆蓋組給精確技能、對未覆蓋組給近似 top-1 提示，且告知可以忽略。兩者的 prompt framing、任務組成與重跑方法不同，不能用 HINT30 的 100 題持平結果推翻 MATCH1 的受控轉移結果，也不能以 MATCH1 的收益宣稱整個檢索系統有效。

第二，360 題實驗沒有跨 seed 的變異估計。它可以做同一任務上 BASE 與不同處理條件的 paired comparison，但各條件每題只有一個 run，不能告訴我們不同重跑下結果會有多穩定。作者的 p 值依賴配對任務結果；沒有 error bars 不等於差異精確到可以直接外推至另一個模型或一批即時網站。

## 失敗型態：站點導航與經濟語意是兩道不同的關卡

附錄 D 的案例追蹤為整體數字提供具體機制。英國 ONS 的 Task 225 中，BASE 在一般資料下載頁用滿 30 步仍無法完成；HINT30 導向專用 MM23 時序頁，14 步便成功（Figure 3）。美國 Treasury Task 274 中，BASE 在站內搜尋後停在失效連結；匹配提示提供每日 par-yield 路徑與替代方式，讓 Agent 15 步到達歷史表格並成功（Figure 5）。這兩個案例顯示路徑提示可以省下重複探索。

USCIS Task 264 則指出界線：BASE 走到 I-140 費用表，9 步成功；有 hint 的 Agent 到了相關費用區段，仍未在 30 步內回傳通過檢查的值（Figure 4）。這不是只要有技能就一定勝出的故事，而是把「找到正確內容」和「讀對指定行並完成答案驗證」分開。Figure 6 對比 ONS、USCIS、SBA 的 BASE 與 RETR5 終點：RETR5 在 ONS 從未解決變成 5 步成功，在 SBA 從 12 步縮到 3 步；USCIS 仍暴露資料抽取問題。

作者的軌跡分析也指出兩類復用邊界：網頁重設計、動態選單或下載控制改動，可能讓舊路徑失效；即使抵達相關頁面，也可能讀錯單位、日期、序列、調整方式或申請類別。某些近似技能甚至會讓 Agent 在卡住後繼續待在錯頁。這些觀察是對保存軌跡的定性分析，不是對網站改版率或錯誤機率的量化估計（Sections 4.2.3、4.3；Appendix D）。

## 證據地圖：作者的結論、實驗支持什麼，以及尚未量到什麼

| 證據層次 | 目前可說的事 | 對應錨點與界線 |
| --- | --- | --- |
| **作者主張** | 經驗可轉成有範圍、前置條件、步驟、驗證與復原的技能；已知匹配時可跨任務轉移。 | Sections 3–4；以一個 benchmark、一種 Agent backbone 與 50 條技能測試。 |
| **直接量測** | MATCH1 在受控 held-out 變體上有 8.3 個百分點的成功率提升；RETR5 只在直接覆蓋子集領先，整體與 BASE 持平。 | Table 3 的 300 個配對結果及 Table 4 的覆蓋分層；兩種實驗的設定不可互換。 |
| **診斷訊號** | ALL50 表現下滑；未覆蓋組的近似提示低於 BASE；live-site 例子呈現導航收益與語意擷取失敗。 | Table 4、Table 6、Figures 2–6、Appendix D；定性案例不能估計盛行率。 |
| **尚未證明** | 未證明相同效果可跨模型、技能抽取器、更多領域、更多次部署重跑或網站長期變動後保持；也沒有證明 abstention 機制能解決錯配。 | Section 7；公開 skill 檔可閱讀不等於獨立重跑所有實驗。 |
| **Bloss0m 工程解讀** | 技能庫的品質應同時報覆蓋、匹配方式、拒絕錯配能力及答案驗證；整體平均不能取代覆蓋分層。 | 根據 Tables 4、6 與 Section 4.4 的工程化整理，不是作者測試過的生產架構。 |

## 限制與不該外推的結論

本研究的外部效度有幾個明確邊界（Section 7）。首先，全部 agent 實驗使用一個 gpt-5-mini backbone、一組 BrowserGym／AgentLab 環境設定及固定 30 步上限。模型、瀏覽器觀察、動作集合及提示位置在每個研究內保持固定，這有助於比較條件，卻未測試別的 backbone 是否同樣受益。第二，50 個技能都由已驗證 seed 產生，且沿用一個抽取 schema；若 seed 類型、抽取器、技能庫大小或網站類型改變，結果也可能改變。

第三，研究只取 EconWebArena 的即時經濟資料任務。該環境在 360 題、37 個來源網站上覆蓋政府、銀行、勞動、能源、教育、健康等九類，但它仍不是一般網頁工作、電商流程、登入後工作台或企業內網的代表性抽樣。也無法由此推出技能是否可跨不同網站、不同經濟領域或其他語言轉移。

第四，網站漂移是研究對象本身的限制。作者處理四個已由來源變動造成數值變化的 benchmark 答案，使用不依實驗條件結果建構的固定 correction table（Section 4.1；Appendix A）。這是避免拿過期 gold value 評分的合理做法，但即時網站和版本化基準仍會有同步成本；一次在特定時間點可用的步驟，不保證未來仍成立。技能前置條件、驗證與復原若沒有持續更新，舊技能可能逐漸變成誤導。

第五，受控 MATCH1 的「已知正確匹配」有利於隔離程序品質，卻跳過了最困難的檢索選擇；RETR5/HINT30 才把選擇帶回，但每題只有一次執行。第六，原始 TRAJ1 很差，可支持此實驗中不宜直接複製特定歷史軌跡，不能推廣成所有 demonstrations 都無效。第七，ALL50 較差與 context interference 的解釋相容，但研究沒有分別操弄 prompt 長度、相互衝突指示與語意關聯，因此不應斷言 token 數量是唯一原因（Section 4.4）。

最後，作者提供的核心結果是成功率、步數、配對檢定與部分瀏覽軌跡；論文沒有測量技能庫在團隊中的維護工時、長期成本、經濟分析師是否更快完成任務，或錯誤數字對決策造成的損失。成功到達官網不等於資料被正確解讀，更不等於業務決策正確。這些都需要額外的人因、營運及長期研究。

## Artifact 與可重現性

截至 2026 年 10 月 5 日，作者的 [EconSkills Hugging Face 資料集](https://huggingface.co/datasets/EconWebArena/EconSkills) 公開可讀，dataset viewer 顯示 50 筆 JSON 技能，頁面標示 Apache-2.0；這讓讀者可以檢視七欄技能內容。作者也說明 EconWebArena 任務可搭配 [BrowserGym](https://github.com/ServiceNow/BrowserGym) 與 [AgentLab](https://github.com/ServiceNow/AgentLab) 重跑，兩者均有公開的上游專案。EconSkills 的技能資料集是可用 artifact，不代表本文已核實一個包含完整實驗管線、所有條件設定與受控資料的獨立重現套件。

作者在 Appendix A 提供步驟、配置與更正值處理方式，但執行 live benchmark 仍需要網站目前可用、相應 Python／瀏覽器環境、模型端點與 API 權限；論文使用 gpt-5-mini，外部讀者不應假設模型呼叫免費或可以無憑證重現。另因網站持續變動，後續重跑可能與原始 snapshot 不同。本文沒有獨立重跑實驗，數據皆為作者報告；可重現性應理解為有可檢視的技能檔和重跑指引，而不是本站已驗證完全重現 900 次受控 episodes 與 360 題部署結果。

論文圖片包含網站介面截圖；arXiv v1 頁面提供的是永久、非專屬散布授權，未明確給出圖像重用授權，而截圖也涉及第三方網站畫面。因此本文不複製原圖，改以 figure 編號、論文定位資訊與文字解讀說明相關證據。上方 Evidence Atlas 封面是依據「已匹配／未覆蓋」兩種證據路徑繪製的概念圖，不代表論文的實測數值或原始圖表。

## Bloss0m 工程判斷：技能庫也需要「不適用」路徑

以下是 **Bloss0m 工程解讀**，不是 EconSkills 論文已部署或實驗驗證的架構。若團隊要把程序記憶帶進網頁 Agent，我會把以下檢查做成技能選擇與執行前後的契約：

1. **先判斷範圍**：讓技能宣告適用的權威網域、資料類型、序列、互動形式和必要任務欄位；只因網址相同，不代表資料語意相同。
2. **匹配不足就拒絕注入**：記錄覆蓋程度或檢索信心，提供明確的 abstain 分支。論文未測出現成的拒絕閾值；不能假定模型看見「可忽略」後就一定會忽略。
3. **把驗證當成成功條件**：把 domain、entity、period、unit、series definition、adjustment/revision 狀態等要求轉成可檢查條件，特別是權威數據來源相鄰指標很容易混淆時。
4. **保留復原與來源狀態**：頁面找不到、欄位變名或數值不符合範圍時，走站內搜尋、替代表格或停止升級人工檢查；記錄技能所依據的來源與最後驗證時間。
5. **依覆蓋分層評測**：至少同時報告有直接匹配、只有近似技能及沒有技能三組，並計入任務結果、工具步數、失敗原因與跨 seed 波動。只看 aggregate，會掩蓋 covered task 的收益與 uncovered task 的退步。

不適合將 EconSkills 的 SOP 直接套用於需要登入、具副作用交易、個資處理或決策風險高的網站工作，除非權限、審計、人工核准及錯誤回復另有明確設計。論文評估的是讀取公開經濟數據頁面的瀏覽器任務，不是任何付款、送件、更新紀錄或正式決策流程。

## 讀完後的三個記憶點

1. **技能是經抽象化的程序，不是舊軌跡複製品**：日期、國家、指標等 instance values 要抽成變數，但資料語意、前置條件、驗證與復原不能一起丟掉。
2. **轉移和檢索是兩個問題**：MATCH1 在已知正確匹配的條件下成功率提升；RETR5 在整體 360 題僅與 BASE 持平，且未覆蓋任務更弱。
3. **抵達頁面不等於取得可用證據**：單位、期間、序列、版本與來源必須再次驗證；技能應能判斷不適用並退出。

## Primary sources

- Quan, Y. and Liu, Z. (2026). [EconSkills: Studying Skill Transfer and Retrieval for Web Agents on Live Economic Data](https://arxiv.org/abs/2609.19523), arXiv:2609.19523v1. Main anchors: Sections 3–4.4, 7; Tables 1–6; Figures 1–6; Appendices A–D.
- Authors' [EconSkills skill dataset](https://huggingface.co/datasets/EconWebArena/EconSkills) and related [EconWebArena benchmark](https://huggingface.co/datasets/EconWebArena/EconWebArena).
- [BrowserGym](https://github.com/ServiceNow/BrowserGym) and [AgentLab](https://github.com/ServiceNow/AgentLab), the browser-agent ecosystem cited for the evaluation setup.

<!-- paper-reading-no-body-figures: The paper's figures include third-party live-site screenshots, and arXiv v1 does not state an explicit figure reuse license; the article cites and interprets the material figure evidence instead of copying images. -->
