---
title: "RAG-MCP：用檢索對抗 MCP 工具海的提示膨脹"
description: "三遍掃讀 RAG-MCP：把工具發現外包給語意檢索，只把少數 MCP schema 餵給 LLM；附壓力測試熱力圖與準確率／Token 數據解讀。"
pubDate: 2026-03-23
tags: ["論文精讀", "RAG", "MCP", "工具選擇", "LLM 函式呼叫", "Prompt 膨脹"]
image: "/paperReading/04-RAG-MCP/image_1.webp"
field: "NLP"
difficulty: "intermediate"
paper:
  title: "RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation"
  authors:
    - "Tiantian Gan"
    - "Qiyao Sun"
  year: 2025
  venue: "arXiv 2505.03275"
  links:
    pdf: "https://arxiv.org/pdf/2505.03275.pdf"
series:
  id: "rag-mcp"
  title: "RAG-MCP 精讀"
  part: 1
  totalParts: 1
---

# 論文深度解析報告：RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation
## 第一部分：第一次閱讀筆記（5-10 分鐘海選）

**目標：鳥瞰論文，判斷價值。**

### 1. 🧱 為什麼要讀這篇？解決什麼「坑」？（背景與動機）

隨著 Anthropic 推出 Model Context Protocol (MCP) 標準，LLM 現在可以輕易接入成千上萬個外部工具（如資料庫、GitHub、Slack 等）。但這帶來了一個致命的工程坑：**提示詞膨脹（Prompt Bloat）與決策過載**。

如果你把所有可用工具的描述和 API 格式都塞進 Prompt 裡交給 LLM，不僅會耗盡上下文長度（Context Window），還會讓 LLM 產生「選擇困難症」，導致幻覺（選錯工具或捏造不存在的 API）。這篇論文就是要解決這個「工具越多，效能越差」的困境。

### 2. 🛠️ 技術定位：它到底「做了什麼」？（核心貢獻與方法簡述）

作者提出了一個非常優雅且直覺的框架：**RAG-MCP**。

他們將「檢索增強生成（RAG）」的概念應用在「工具選擇」上。與其把所有工具清單都丟給 LLM，不如先建立一個「工具描述的向量資料庫」。當用戶提出需求時，系統先透過語義檢索（Semantic Retrieval）找出最相關的 Top-$k$ 個工具，然後**只把這幾個工具的說明書餵給 LLM**。

### 3. 🔍 論文摘要精要

**一句話總結：** 透過將 RAG 技術應用於 MCP 工具檢索，動態篩選並只提供最相關的工具描述給 LLM，成功解決海量工具帶來的提示詞膨脹問題，使工具選擇準確率提升三倍，並大幅降低 Token 消耗。

### 4. 📊 第一遍必看圖表解析：系統架構對比

![傳統 MCP 與 RAG-MCP 推理過程對比](/paperReading/04-RAG-MCP/image_1.jpg)

**💡 圖表洞察：**

這張圖是整篇論文的靈魂。

*   **左側 (傳統 MCP)：** 系統將使用者的 Query 加上**所有** MCP 工具的描述（Prompt + MCPs）一股腦塞給 LLM。這就像給工人一本厚達千頁的工具型錄，讓他自己找螺絲起子，效率極低且容易出錯。
*   **右側 (RAG-MCP)：** 系統攔截了使用者的 Query，先透過 RAG-MCP 模組找出「唯一/少數適用的工具 (Tool MCP)」，然後只把這個工具的資訊和 Query 組合後交給 LLM。LLM 的認知負擔瞬間降到最低，只需專注於如何使用該工具。

### 5. 💡 工程直覺：這東西離落地有多遠？（初步評估）

**非常近，甚至可以說是目前 Agent 開發的 Best Practice（最佳實踐）。**

這套架構不需要重新訓練或微調（Fine-tune）龐大的 LLM，只需要外掛一個輕量級的向量檢索模組（Retriever）。對於正在使用 LangChain、LlamaIndex 或直接對接 Anthropic MCP 生態的開發者來說，這是立即可用的架構模式。

### 6. 🏁 第一遍速讀結論：三個關鍵判斷

*   **解什麼：** LLM 面對海量外部工具時的 Context 爆滿與選擇失誤問題。
*   **憑什麼：** 將工具描述視為外部知識，利用向量檢索（Vector Search）進行動態上下文過濾（Context Filtering）。
*   **值得深讀嗎：** **絕對值得。** 特別是對於致力於打造具備複雜行動能力（Action-taking）的 AI Agent 開發者，這篇論文提供了極具參考價值的架構與壓力測試數據。

---

## 第二部分：第二次閱讀精讀（30-60 分鐘精選）

**目標：抓住方法、證據與對比，吃透技術細節。**

### 1. 核心機制：深入拆解 RAG-MCP 底層邏輯

論文將 RAG-MCP 的運作流程拆解為三個優雅的步驟，徹底解耦了「工具發現（Discovery）」與「任務生成（Generation）」。

![RAG-MCP 三步管線流程圖](/paperReading/04-RAG-MCP/image_2.jpg)

**💡 機制拆解：**

1.  **Query Encoding (查詢編碼)：** 當使用者輸入自然語言任務時，系統使用一個輕量級的 LLM（實驗中使用 Qwen-max）作為 Retriever，將使用者的意圖轉換為向量特徵。
2.  **Vector Search & Validation (向量檢索與驗證)：** 在預先建好的 MCP 伺服器元數據（Metadata）向量庫中進行相似度比對，抓出 Top-$k$ 個候選工具。**亮點在於「Validation（驗證）」**：系統會生成一個 Few-shot 範例來測試這個 API 是否真的可用（Sanity Check），避免檢索到壞掉的工具。
3.  **LLM Invocation (LLM 調用)：** 最終，只有那個「最匹配且驗證可用」的 MCP Schema（參數格式、說明）會被注入到主 LLM 的 Prompt 中，LLM 接著執行標準的 Function Calling。

### 2. 檢索/運算演算法與設計哲學

作者的設計哲學深受「大海撈針（Needle-in-a-Haystack, NIAH）」測試的啟發。

在傳統做法中，正確的工具（Needle）被埋藏在成百上千個無關工具（Haystack）中。RAG-MCP 的演算法本質上是**降維打擊**：

*   **空間複雜度降低：** 將 $O(N)$ 的 Prompt 長度（$N$ 為工具總數）降低為 $O(k)$（$k$ 為檢索出的工具數，通常 $k=1$）。
*   **動態擴展性：** 新增工具時，只需將其 Schema 向量化並存入 Index，完全不需要動到 LLM 本身，實現了真正的 Plug-and-Play（隨插即用）。

### 3. 實戰表現與數據分析

為了證明這套機制的有效性，作者設計了極其嚴苛的 **MCP 壓力測試（Stress Test）**，將干擾項（Distractors）從 1 個一路增加到 11,100 個。

![MCP-RAG 壓力測試成功率熱力圖](/paperReading/04-RAG-MCP/image_3.jpg)

**💡 實驗數據與圖表深度解析：**

*   **熱力圖分析 (Figure 3)：** X 軸是工具總數，Y 軸是正確工具被放置在 Prompt 中的位置。黃色代表成功，深紫色代表失敗。
    *   **早期高成功率：** 當工具數量小於 30 時（圖表左側），幾乎全是黃色，說明 LLM 處理少量工具游刃有餘。
    *   **規模化崩潰：** 當工具數量超過 100 甚至上千時（圖表右側），深紫色佔據主導。這證明了「Prompt Bloat」是真實存在的致命傷，傳統方法在海量工具前會徹底失效。
*   **基準測試對比 (Table 1 數據)：**
    *   **準確率 (Accuracy)：** RAG-MCP 達到 **43.13%**，而把所有工具塞進去的 Blank 方法只有 **13.62%**。準確率提升了超過 3 倍！
    *   **Token 消耗：** RAG-MCP 的平均 Prompt Tokens 為 **1084**，遠低於 Blank 方法的 **2133.84**。這不僅省了算力，更省了 API 呼叫成本。

### 4. 嚴格審視：潛在風險與局限性 (Failure Cases)

身為專業研究員，我們必須挑出這篇論文的骨頭：

1.  **檢索依賴症 (Retrieval Bottleneck)：** RAG-MCP 的成敗完全取決於第一步的 Vector Search。如果使用者的 Query 描述模糊，導致 Retriever 沒抓到正確的工具，後面的 LLM 就算能力再強也無力回天（因為它根本沒看到該工具的說明）。
2.  **極端規模下的效能衰退：** 從熱力圖可以看出，當工具數量達到數千（>2111）時，即使是 RAG-MCP 也開始出現大面積的紫色（失敗）。這說明單純的語義向量檢索在面對「功能高度相似的微小差異 API」時，解析度仍然不夠。
3.  **多工具協同 (Multi-tool Workflows) 的空白：** 論文目前的設定偏向「為一個任務找到一個最適合的工具」。但在真實世界的 Agent 場景中，往往需要「先調用檢索工具，再調用計算機，最後調用發信工具」。RAG-MCP 如何在多步推理中動態切換和保留多個工具的 Context，論文並未深入探討。

### 5. 💡 總結與工程洞察：給開發者的具體建議

這篇論文為 AI Agent 的架構設計指明了方向：**「不要把 LLM 當作垃圾桶，什麼 Prompt 都往裡塞。」**

**給開發者與研究者的 Action Items：**

*   **🛠️ 立即導入 Tool RAG：** 如果你的 Agent 系統擁有超過 10 個以上的 API/工具，請立刻停止將所有 Schema 寫死在 System Prompt 中的做法。建立一個輕量級的 Vector DB 來管理你的工具庫。
*   **🧠 兩階段思考：** 將系統架構拆分為「大腦（主 LLM，負責推理與執行）」與「圖書館員（Retriever LLM，負責找工具）」。這不僅能提高準確率，還能大幅降低呼叫 GPT-4 / Claude 3.5 Sonnet 等昂貴模型的 Token 成本。
*   **🔮 未來研究方向：** 針對上述的局限性，未來的優化方向在於「階層式檢索（Hierarchical Retrieval）」——先檢索工具類別（如：財務工具），再檢索具體 API；以及強化 Retriever 對於 API 參數細節的理解能力。

---

### 原始出處

* 論文：Gan, T., Sun, Q. *RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation*. arXiv:2505.03275（2025）
  * [arXiv PDF](https://arxiv.org/pdf/2505.03275.pdf) · [arXiv 摘要頁](https://arxiv.org/abs/2505.03275)
、
