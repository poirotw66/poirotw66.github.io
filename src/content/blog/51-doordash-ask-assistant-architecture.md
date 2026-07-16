---
title: "轉化率提升 24%！DoorDash 揭秘 Ask Assistant 智能購物助理底層架構"
description: "深度剖析外送龍頭 DoorDash 如何結合大型語言模型、專屬 AI Agent、Model Context Protocol (MCP) 以及三層記憶體系統，打造出日均執行 2,000 次自動化評估的企業級 AI 購物助理系統。"
pubDate: 2026-07-14
category: "AI & Data Engineering"
tags: ["DoorDash", "AI Agent", "MCP", "Platform Engineering", "Information Retrieval", "Machine Learning"]
kind: "article"
showToc: true
image: "/blog/51-doordash-ask-assistant-architecture/title_image.webp"
---
在生成式 AI 落地企業的過程中，最難的往往不是「呼叫 API」，而是如何將 AI 助理穩定、安全且高效率地整合進現有的複雜業務系統中。

外送與零售龍頭 **DoorDash** 近期發表了一系列技術文章，公開了其生成式 AI 助手 **「Ask DoorDash」** 的底層架構設計。這款助手旨在幫助消費者透過自然語言發現餐廳、規畫餐點，並在 2 分鐘內自動建立好購物車。

最引人注目的是其帶來的真實業務增長：**在為期 7 天的生產環境測試中，AI 助手的記憶體系統讓超市購物的結帳轉化率 (Checkout Conversion) 提升了 24%、平均購物籃大小 (Basket Size) 增加了 17%，並減少了 7% 的對話輪數。**而在餐廳探索場景中，開放式查詢的轉化率也提升了 15%。

以下為您深度解析這套兼具高擴展性與業務價值的企業級 AI 架構。

---

## 1. 職責分離：助理執行期 (Assistant Runtime) 與 MCP 隔離架構

許多初期的 AI 專案會將「商業邏輯」直接寫進 System Prompt 中，這會導致 Prompt 變得無比臃腫且難以維護。DoorDash 採用了**執行期與業務功能分離**的架構：

![DoorDash Assistant Runtime Architecture](/blog/51-doordash-ask-assistant-architecture/doordash_runtime.jpg)
*DoorDash 助理執行期架構 (來源：DoorDash Engineering Blog)*

### 助理執行期 (Assistant Runtime)
中央執行期只負責三件事：**協調用戶輸入、調度專屬 Agent，以及管理會話狀態。**它是一個輕量且與業務無關的 Core Engine。

### Model Context Protocol (MCP) 共享層
所有具體的業務功能（如目錄搜尋、推薦、購物車操作、結帳、歷史訂單等）全部被封裝在一個共享的 **MCP 工具層**中。
*   **優勢**：與其讓模型直接去理解「如何呼叫購物車 API」，不如讓模型透過標準化的 MCP 協定去呼叫定義好的 Tools（例如 `add_item_to_cart()`）。這使得後端微服務可以自由升級，而不會破壞 AI 助理的 Prompt 邏輯，大幅提升了平台的可靠性與可維護性。

---

## 2. 核心記憶體系統 (Intelligence & Memory Layer)

> 「Agent 不僅僅需要存取用戶數據，它們更需要在正確的時刻，為正確的任務提供正確的上下文。」

為了達到極致的個人化體驗，DoorDash 引入了一個包含**三種記憶體機制**的智能層：

![DoorDash Memory Architecture](/blog/51-doordash-ask-assistant-architecture/doordash_memory.jpg)
*跨越生成、工具層、儲存、策略與智能體的記憶體架構 (來源：DoorDash Engineering Blog)*

1.  **長期記憶 (Long-term Memory)**：
    這是基於用戶的歷史消費行為，在**離線 (Offline)** 狀態下計算生成的。它捕捉了用戶的長期偏好，例如「喜愛的菜系（如日式、義式）」或「飲食限制（如全素、無麩質）」。
2.  **會話記憶 (Session Memory)**：
    在單次對話互動中，維持上下文的連貫性。例如，用戶先說「我想吃拉麵」，接著說「那幫我加一顆糖心蛋」，Session Memory 能確保第二句的指令正確關聯到拉麵上。
3.  **智能體記憶 (Agentic Memory)**：
    儲存用戶在對話中「顯式告訴」助理的事實。例如，用戶提到「我對花生過敏」，這項事實會被即時存入，並在後續的所有推薦與購物車防護網中生效。

### 記憶檢索流程
當用戶發起請求時，系統會先透過**語義向量搜尋 (Semantic Vector Search)** 從這三個記憶庫中撈出最相關的資料，進行排序 (Ranking) 後，才動態注入到 Prompt 的 Context 中。這將記憶體管理與 LLM 的推理徹底解耦，大幅節省了 Token 消耗。

---

## 3. 確定性動作與效能最佳化

在實務運行中，如果每一步都依賴 LLM 的生成，不僅延遲 (Latency) 極高，且極易因為模型幻覺而導致系統出錯。DoorDash 採取了幾項關鍵的優化手段：

*   **確定性動作 (Deterministic Actions)**：
    當用戶說「幫我把購物車裡的東西結帳」時，系統**不會**把這個權限交給 LLM 去自主執行。相反地，LLM 只能輸出一個結構化的意圖，由外層的確定性程式碼去呼叫防護網與確認工作流 (Confirmation Workflows)，確保支付等高風險操作 100% 安全。
*   **版本化產物 (Versioned Artifacts)**：
    所有的購物車狀態與推薦結果都採用版本化管理，允許用戶隨時「回滾 (Rollback)」到前一步的對話狀態，避免因為 LLM 抽風而搞砸整張訂單。

---

## 4. 每日 2,000 次！自動化模擬評估平台

「建構一個有用的 AI Agent 很難，但要知道它是否真的好，更難。」

為了驗證生產環境中 AI Agent 的行為，並在模型升級（如遷移到更新、更快的 LLM）時不產生功能衰退 (Regression)，DoorDash 建立了一套**自動化模擬對話評估平台**：
*   **雙 LLM 對弈模擬**：利用一個 LLM 扮演「虛擬顧客」，帶入特定的飲食偏好與挑剔的對話風格；另一個 LLM 則是待測試的「DoorDash 助理」。兩者在隔離環境中進行多輪模擬對話。
*   **錄製工具 Stub (Fixtures)**：將所有真實的 API 回傳值錄製下來，避免測試時產生真實的訂單費用，同時確保測試的可重複性 (Reproducibility)。

### 評測平台帶來的驚人成效
*   **規模化**：每日執行超過 **2,000 次**自動化評估。
*   **效率提升**：將每次回歸測試 (Regression Testing) 的時間，從 **6 小時大幅縮短至 20 分鐘**。
*   **無痛遷移**：在最近一次的模型遷移中，這套平台幫助工程團隊在「品質分數提升 8 分」的前提下，成功將系統延遲**降低了 35%**。

## 結論：企業級 AI 應用的實踐範本

DoorDash 的 Ask Assistant 架構為我們展示了現代 **平台工程 (Platform Engineering)** 在 AI 時代的實踐範本：**領域團隊 (Domain Teams) 專注於開發特定領域的專屬 Agent，而平台團隊 (Platform Teams) 則負責維護執行期、MCP 工具鏈、記憶體系統與評估基礎設施。**

透過將 LLM 與確定性系統、標準化協定 (MCP) 及三層記憶體完美結合，DoorDash 證明了：不要讓 LLM 獨自挑大樑，給它套上強大的「約束 Harness」，AI 才能真正為企業帶來巨大的商業回報。

---
*參考資料來源：[InfoQ - How DoorDash Built an AI Shopping Assistant That Doesn’t Rely on the LLM Alone](https://www.infoq.com/news/2026/07/doordash-ai-ask-assistant/)*
