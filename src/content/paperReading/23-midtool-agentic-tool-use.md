---
title: "MidTool：把工具使用提前放進 mid-training，Agent 真的會更可靠嗎？"
description: "深讀 MidTool：用 20.3B-token、11.22M-sample 的工具使用語料，把 schema grounding、工作流組合與不完整資訊下的恢復能力提前教給模型；但 web-search 仍是 0%。"
pubDate: 2026-08-24
updatedDate: 2026-08-24
tldr:
  - "MidTool-Mix 把 web、PDF、code 與 API／MCP 工具軌跡組成 20.3B tokens、11.22M samples 的 mid-training mixture，針對 grounding 與 execution 兩種缺口各做一條資料合成分支。"
  - "在論文固定的 Qwen3-4B + SFT 設定，MidTool-Mix 讓 BFCLv3 overall 從 39.73% 升到 50.25%、$\\tau^{2}$-Bench Pass@4 從 20.50% 升到 28.06%、MCP-Universe pass 從 1.68% 升到 5.03%。"
  - "這不是『工具使用已經解決』：MCP-Universe 的 web-search 子集仍為 0.00%，而且資料大量由模型合成、資料集與模型受 gated access／上游條款約束。"
audience:
  - "設計 tool-use mid-training、function calling、MCP agent 或長回合互動評測的 AI 工程師"
  - "需要判斷 agent 是真的學會工具邊界與工作流，還是只在固定工具與短回合資料上記住格式的研究者與工程團隊"
tags: ["Paper Reading", "Agent Systems", "Tool Use", "MCP", "Training"]
image: "/paperReading/23-midtool-agentic-tool-use/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - tool-use-coding-agents
paper:
  title: "MidTool: Mid-training Data Synthesis for Agentic Tool Use"
  authors:
    - "Fengqing Jiang"
    - "Yite Wang"
    - "Boyi Liu"
    - "Zhaoyang Wang"
    - "Canwen Xu"
    - "Zhewei Yao"
    - "Radha Poovendran"
    - "Yuxiong He"
  year: 2026
  venue: "arXiv 2608.20314 v1 (2026-08-20)"
  links:
    pdf: "https://arxiv.org/pdf/2608.20314v1"
    arxiv: "https://arxiv.org/abs/2608.20314"
    project: "https://huggingface.co/datasets/MidTool/MidTool-Mix"
---

## 90 秒掌握論文 / The paper in 90 seconds

- **問題**：工具使用不只是填對函式名稱與 JSON 引數。Agent 還需從文件、schema、程式碼與不完整對話中辨識工具 affordance、決定何時呼叫、串接多個工具，並在缺漏資訊時主動澄清或恢復。MidTool 探討的核心問題是：這些通用能力能否在 post-training 之前，透過專門的 mid-training 階段提早注入基礎模型？
- **核心洞見**：將工具使用的可遷移先驗解構為兩大面向——從非結構化材料中辨識工具邊界的「grounding」，以及在介面上排定多回合互動的「execution」。藉由包含 20.3B tokens、11.22M samples 的 MidTool-Mix，分別以 context-grounded 擴增與 native agentic 合成兩條分支提供互補監督。
- **最強證據**：在 Qwen3-4B-Base 固定 100K TOUCAN SFT 的受控實驗中，MidTool-Mix 讓 BFCLv3 overall 從 39.73% 升至 50.25%（+10.52 pp）、$\tau^2$-Bench Pass@4 從 20.50% 升至 28.06%（+7.56 pp）、MCP-Universe pass 從 1.68% 升至 5.03%（+3.35 pp）；Qwen3-8B 與 RL 階段亦呈同向增益。Table 6 消融實驗更證實兩條分支缺一不可。
- **主要邊界**：MCP-Universe 的 web-search 子集得分與 pass rate 仍為 0.00%；視覺工具試驗顯示 tool success 提升不代表 final-answer grounding 成立；且高昂算力成本（32 張 H200 與 8 張 B200）以及未經人工逐一審查的合成語料，構成了實際落地的關鍵限制。

傳統工具調用通常假設預訓練模型已具備足夠的語意理解力，僅靠下游數萬條示範軌跡進行格式微調（SFT）即可掌握 API 呼叫。然而當面對陌生工具、缺失引數或長程多回合交互時，模型往往陷入幻覺或格式死記。MidTool 團隊打破這種後期補救思維，提出在 pre-training 與 post-training 之間插入專門的 mid-training 階段，利用大規模技術語料與兩條合成分支重塑基礎模型對工具知識的先驗。這項研究的核心價值不在於單純累積 benchmark 分數，而在於量化證明了「提早注入工具先驗」能實質降低下游微調的收斂難度並提升跨領域遷移能力。

Bloss0m 評估結論：**MidTool 最具啟發性的貢獻，是把「工具使用的可遷移先驗」拆解為 grounding 與 execution 兩個互補的資料問題，並以消融實驗證實兩者不可偏廢；但實驗亦明確劃出邊界：通用工具 mid-training 無法自然泛化為具備反覆檢索與假設檢驗能力的 deep-search agent。**

本文依據 [arXiv:2608.20314 v1](https://arxiv.org/abs/2608.20314)（提交日期 2026-08-20；尚未經同儕審查）。分析範圍涵蓋 [arXiv HTML 版](https://arxiv.org/html/2608.20314v1) 之正文、Tables 2–6、Appendices A–D、VisualToolBench pilot 及 limitations 討論。

> **花花的工程提醒**
>
> 如果你的 agent 會呼叫工具，卻常常在最後答案沒有把工具結果說對，單純增加 function-calling examples 可能不夠。MidTool 提供的實用假說是：先讓模型在 mid-training 學會讀懂工具與工作流，再用 post-training 對齊產品需要的行為；不過最後仍要分別評估「呼叫成功」和「答案有沒有被結果支撐」。

![MidTool 論文 Figure 1：資料來源、訓練流程與 MCP-Universe 結果的總覽。](/paperReading/23-midtool-agentic-tool-use/paper/figure-1-teaser.webp)

*Figure 1，論文 teaser：左側是 web、PDF、tool、code 與 agentic trajectory；中間是 base model → mid-training → tool-use SFT → agentic RL；右側是作者用來說明 transfer 的 MCP-Universe 圖。這張圖是作者的 overview，不是額外的獨立 benchmark；原圖可定位到 [Figure 1](https://arxiv.org/html/2608.20314v1#S0.F1)，取自 arXiv HTML，頁面標示 CC BY 4.0。*

## 理解前需要知道什麼 / What to know first

在深讀具體訓練機制前，需要釐清以下關鍵概念與既有架構瓶頸：

### 什麼是 Mid-training

Mid-training 是介於廣泛語言預訓練（general pre-training）與下游對齊（post-training：SFT / RL）之間的特定訓練階段。它延續預訓練的自回歸語言模型目標，但採用高度篩選且領域專注的語料。其目的不是固定模型的最終對話風格或特定產品規則，而是在基礎模型中建立特定任務領域（如程式碼或工具使用）的密集先驗分佈。

### 工具使用的雙層結構：Grounding 與 Execution

論文將通用的工具使用能力拆解為兩個不可割裂的層次：

1. **Grounding（語境錨定）**：從 API 參考文件、開發者指南、SDK 程式碼與 PDF 手冊等非結構化或半結構化材料中，精確辨識工具的存在、邊界、必填欄位、參數型別約束與潛在的工作流依賴。
2. **Execution（多回合執行）**：在交互環境中按依賴關係排定呼叫順序、偵測並追問缺失資訊、解析工具回傳的結構化資料，並在遇到報錯時調整下一步策略。

### 為什麼既有 Post-training 作法不夠

傳統方法常直接以數千至數萬條高品質對話示範對預訓練模型進行 SFT。這種作法存在結構性缺陷：狹窄的示範軌跡容易讓模型僅學會「長得像一個 tool call」的 JSON 格式表面特徵，卻未能吸收廣布於技術手冊、函式庫原始碼與系統規格中的背景知識。

當面對陌生工具或長上下文時，缺乏底層工具先驗的模型極易產生參數幻覺，或在工具回傳非預期資料時失去修復能力。過去方法試圖在微調階段同時解決「學習領域知識」與「學習對話策略」，造成了嚴重的任務負擔過載。

### 讀者真正要回答的核心問題

這篇論文並非單純探討「把更多工具軌跡塞進訓練集是否有效」。比較精確的技術評估視角是：**在 downstream SFT 與 RL 配方完全固定的嚴格受控條件下，把通用工具使用的資料提前到 mid-training，是否能讓小參數量模型（4B／8B）在陌生工具、長回合互動與 schema grounding 上獲得真正可遷移的泛化能力？**

## 核心直覺 / Core intuition

MidTool 的核心直覺可以比喻為工程師的學習路徑：在被指派具體的客服或系統維運任務之前，工程師應先大量通讀 API 官方文檔、開源專案程式碼與架構手冊，在腦中建立完整的工具 affordance 地圖；之後在產品對齊階段，只需學習組織特定的溝通語氣、權限控管與業務策略。

若僅在最後微調階段硬塞格式示範，模型就如同未看手冊就直接上工的實習生：雖然能勉強輸出合法的 JSON 括號，卻無法理解何時該呼叫、遇到缺漏欄位該向使用者詢問什麼，以及前一個工具的回傳數值該如何影響下一步決策。

這項直覺直接催生了雙合成分支的設計哲學：
- **Context-grounded 分支**：教導模型「如何從混亂的技術文本中提煉並理解工具」。
- **Native agentic 分支**：教導模型「如何在嚴格的可執行介面上精準操作工具工作流」。

兩者結合，方能構成完整的工具使用先驗基底。

## 用一個例子走完整個方法 / Walk one example through the method

為了具體理解 Sections 2.2–2.3 的技術串接，以下走訪一個標準的端到端資料生成與模型訓練實例：

1. **原始材料輸入（Input）**：系統攝取一份電商 API 開發者文件，內文說明：「呼叫 `search_orders` 輸入使用者 ID 可查詢歷史訂單；取得 `order_id` 後呼叫 `refund_order` 執行退款；若使用者未指定退款日期，系統預設必須先向使用者確認具體時間。」
2. **語意品質篩選與 Affordance 萃取（Intermediate representation）**：文件通過 fastText 分類器與長度、格式啟發式規則保留。接著由教師模型 Qwen3-235B-A22B-Instruct-2507 進行語法與語意解析，抽取出兩個工具的邊界定義、必填參數清單（`order_id`、`amount`、`refund_date`）以及相依工作流規則。
3. **軌跡規劃與多樣化生成（Decision & Transformation）**：規則規劃器（rule-based planner）依據該文件的資訊豐富度配置生成預算，指示教師模型合成兩種樣本：一組單步參數抽取問答，以及一組多回合互動軌跡——在該軌跡中，模型先主動向使用者澄清退款日期，待取得完整資訊後，依序發出 `search_orders` 與 `refund_order` 呼叫。
4. **語法與一致性驗證（Validation output）**：若該資料進入 native 分支，合成引擎對其施加四重結構檢驗：對話回合順序是否合理、必填引數是否完全匹配 schema、工具模擬回傳值是否符合型別，以及後續步驟是否忠實基於工具回傳做決策。檢驗未通過者附帶錯誤診斷重試，兩次失敗則徹底丟棄。
5. **模型訓練與遷移推論（Output）**：合格樣本打包併入 20.3B tokens 的 MidTool-Mix，完成 1-epoch mid-training。隨後模型載入固定 100K TOUCAN SFT 進行行為對齊。在評測時，當面對一個全新的機票退票 MCP 工具時，模型能自然展現出「先查詢機票記錄、發現遺失航程資訊時主動提問、確認後再發起退票」的多回合行為。
6. **潛在失敗點（Likely failure point）**：若模型在呼叫退票工具並收到 `{"status": "error", "message": "insufficient_funds"}` 後，未能理解錯誤碼並調整路徑，反而向使用者宣稱退款成功，這便是典型的「工具呼叫成功但最終回答未受約束（ungrounded）」的失敗樣態。

## 技術機制 / Technical mechanism

MidTool 的資料構建流程包含四個互補來源、嚴格的多階段過濾，以及兩條各自專注於不同能力缺口的合成分支。

### Stage 1：收集互補的 Raw Sources

MidTool 並非單純爬取現成的函式宣告，而是刻意組合四種相輔相成的資訊載體：

- **Web 語料**：自 FineWeb 的 Common Crawl 處理資料中篩選 2020–2025 年間的 API 參考、開發者手冊、故障排除指南、技術教學與 CLI 指令指南。
- **PDF 手冊**：利用 FinePDFs 的英文子集，補充企業軟體手冊、產品白皮書與長篇程序性操作手冊。
- **Code 程式碼**：從 GitHub 事件數據中探索活躍的 agent 與 MCP 專案，結合具備良好社群評分的開源儲存庫；優先保留函式庫、SDK、框架範例與文檔路徑，同時嚴格排除已知 benchmark 儲存庫以防資料污染。
- **Structured Tool Artifacts**：自公開生態收集 REST API 與 MCP skills，直接取得具備可執行定義的 OpenAPI schema、參數型別與端點規格。

### Stage 2：Source-Specific Filtering 與去重

各資料源依照其特性執行專門的淨化管線：

- **Code 管線**：移除二進位檔、權重檔與日誌；依據行數、平均行長、英文字符比例等啟發式規則過濾；採用 SHA-256 精確去重與 MinHash LSH 近似去重；在高品質專案中優先保留 `docs`、`examples`、`tutorials`、`guides`、`samples`、`cookbook` 等目錄。
- **Web 與 PDF 管線**：執行四階篩選：高召回關鍵字與 URL 前置過濾、以大模型標註樣本訓練的 fastText 分類器、文檔級品質評分，以及 MinHash LSH 去重。整體流程高度偏向開發者實用材料，並確保資料集的淨化依據客觀分類器而非黑箱人工挑選。

### Stage 3：把材料轉化為監督訊號的雙分支機制

材料經過過濾後，分流進入兩條互補的合成管線：

#### Context-Grounded Trajectory Augmentation

該分支由非結構化的 Web、PDF 與 Code 文檔出發。首先由 Qwen3-235B-A22B-Instruct-2507 評估文檔品質並建立 affordance profile；接著由規則規劃器根據品質分數配置生成額度，合成涵蓋工具選擇、基於 schema 的參數抽取、格式化呼叫、工作流識別、平行呼叫、澄清提問與長上下文推理等多樣化 QA 與互動軌跡。所有生成內容必須通過解析器與語意品質閘門才可入庫。

#### Native Agentic Trajectory Synthesis

該分支從 REST API 與 MCP skills 的可執行介面出發。先建立工具庫清單、解析定義並統整出標準化 canonical schema；隨後根據可行性剖析配置單步呼叫、多工具／平行工具使用，以及故意省略關鍵參數的澄清軌跡。

生成後施加嚴格的靜態審查：驗證 turn ordering、schema grounding、required arguments 與 tool-response consistency；不合格者攜帶錯誤訊息重試，仍未過關則淘汰。此分支亦融合了 AWM 模擬環境的 rollout 與過濾後的 Nemotron Agentic 軌跡。

![MidTool 論文 Figure 2：從四類資料、預處理到兩條 agentic trajectory synthesis 分支的 pipeline。](/paperReading/23-midtool-agentic-tool-use/paper/figure-2-pipeline.webp)

*Figure 2，論文 Section 2 的完整 pipeline。注意 Stage 3 並不是把所有文件直接變成成功示範：context-grounded branch 先建立 profile／plan，native branch 先整理可執行 schema，再對生成 trajectory 做結構與 response consistency 檢查。原圖可定位到 [Figure 2](https://arxiv.org/html/2608.20314v1#S2.F2)，取自 arXiv HTML，頁面標示 CC BY 4.0。*

### 資料管線的核心工程介面

Figure 2 展現出 MidTool 的技術本質在於將資料合成拆解為可審計的四層介面：
1. **來源層**：確定模型接觸的是文件語境、程式碼 pattern 還是可直接解析的 schema。
2. **品質層**：串接關鍵字、fastText、去重與目錄 heuristic，避免單一粗糙過濾器造成訊號失真。
3. **計畫層**：先行產出 affordance profile，依文檔品質與複雜度按比例分配生成預算，阻止低質單步樣本氾濫。
4. **驗證層**：在樣本入庫前嚴格檢驗引數、回合序與回傳一致性，確保訓練訊號具備正確的因果邏輯。

### 20.3B Tokens 語料組成

論文 Table 2 揭露了最終訓練集 MidTool-Mix 的詳細組成分佈：

| 子集 | Tokens（原始來源／擴增合成） | Samples | 佔比 |
| --- | ---: | ---: | ---: |
| Web | 4.4B / 4.1B | 6.86M | 42% |
| PDF | 2.6B / 2.1B | 1.34M | 23% |
| Code | 3.8B / 1.5B | 2.60M | 26% |
| Native agentic trajectory | 1.8B | 0.42M | 9% |
| **總計** | **20.3B** | **11.22M** | **100%** |

值得注意的是，native trajectory 雖然僅佔 9% 的 token 量，但在後續消融中證明其對精準呼叫至關重要。整個語料庫統計包含約 2.60M 個獨立工具名稱，並涵蓋 37.2% 的長尾領域分類，大幅擴展了模型見識過的工具語意空間。

![MidTool 論文 Figure 3：MidTool-Mix、FineWeb 與 Dolmino 的 t-SNE 分布。](/paperReading/23-midtool-agentic-tool-use/paper/figure-3-tsne.webp)

*Figure 3，論文 Appendix A.4 的 t-SNE visualization：MidTool-Mix 與 FineWeb／Dolmino 有部分重疊，也有明顯的獨立區域。這是 embedding space 的定性分布圖，不是能力提升的因果證據；原圖可定位到 [Figure 3](https://arxiv.org/html/2608.20314v1#S2.F3)，取自 arXiv HTML，頁面標示 CC BY 4.0。*

Figure 3 透過 Arctic-Embed-2.0-L 抽取特徵並進行 t-SNE 降維，顯示 MidTool-Mix 既保留了通用網頁文本的語義連續性，又在工作流與工具操作區域形成了鮮明的獨立叢集，定性印證了該語料並非通用預訓練文本的機械式複寫。

## 實驗如何讀 / How to read the evidence

### 實驗設計與隔離控制

為了嚴格隔離 mid-training 的獨立因果效應，作者採用了對照實驗設計：
- **骨幹模型**：Qwen3-4B-Base 與 Qwen3-8B-Base。
- **訓練架構**：以 ArcticTraining 在 32 張 H200 上進行 mid-training 與 SFT。Mid-training 設定 1 epoch、最大序列長度 8,192、全域 batch size 4M tokens。
- **固定的下游配方**：SFT 階段統一使用 TOUCAN 的 100K tool-use 子集（最大序列長度 32,768）；可選的 RL 階段使用 8 張 B200 訓練於 AWM 的 526 個合成環境（64 steps、每步 16 rollouts、上限 20 turns）。
- **基準評測**：
  - **BFCLv3**：評估單回合、多回合、schema 參數抽取與幻覺抑制。
  - **$\tau^2$-Bench**：於航空、零售、電信等垂直領域評測交互式任務達成度與錯誤恢復。
  - **MCP-Universe**：在瀏覽器自動化、金融、地理定位與網路搜尋等真實 MCP 伺服器上檢驗陌生工具遷移能力。

所有實驗均關閉模型內置的 thinking mode，以排除推理長度動態變化帶來的干擾。

### 主要成果分析

在最關鍵的 Qwen3-4B-Base + SFT 設定下，論文 Table 3–5 呈現了直接對比數據：

| 評測基準 | 未經 Mid-training | + MidTool-Mix | 絕對差異 |
| --- | ---: | ---: | ---: |
| BFCLv3 overall | 39.73% | 50.25% | +10.52 pp |
| $\tau^2$-Bench overall Pass@4 | 20.50% | 28.06% | +7.56 pp |
| MCP-Universe overall pass | 1.68% | 5.03% | +3.35 pp |

提升幅度最顯著的區域在於多回合任務：BFCL multi-turn 平均分數由 15.50% 躍升至 26.63%，證明 mid-training 有效改善了模型在函式缺失、參數遺漏與長程上下文協商中的應對彈性。

橫向對比 4B 與 8B 在不同訓練階段的整體表現：

| 基礎模型 | 下游訓練配方 | BFCLv3 overall | $\tau^2$-Bench Pass@4 | MCP-Universe pass |
| --- | --- | ---: | ---: | ---: |
| Qwen3-4B-Base | SFT | 39.73% | 20.50% | 1.68% |
| Qwen3-4B-Base + MidTool-Mix | SFT | **50.25%** | **28.06%** | **5.03%** |
| Qwen3-4B-Base | SFT + RL | 39.51% | 25.54% | 2.23% |
| Qwen3-4B-Base + MidTool-Mix | SFT + RL | **54.18%** | **38.49%** | **10.06%** |
| Qwen3-8B-Base | SFT | 47.62% | 28.06% | 3.35% |
| Qwen3-8B-Base + MidTool-Mix | SFT | **51.12%** | **34.89%** | **3.91%** |
| Qwen3-8B-Base | SFT + RL | 45.79% | 38.13% | 5.03% |
| Qwen3-8B-Base + MidTool-Mix | SFT + RL | **55.12%** | **39.57%** | **9.50%** |

這份總覽數據揭示了兩個核心事實：第一，MidTool-Mix 的效益在 4B 模型上最為顯著；第二，8B 模型在僅微調 SFT 時於 MCP 上的提升較小（3.35% → 3.91%），顯著的差距是在經過 RL 環境探索後才完全拉開。這表明「模型規模擴大也能受益」的假說成立，但不同規模對不同評測項目的敏感度存在異質性。

![MidTool 論文 Figure 4：相同下游 tool-use SFT corpus 上的 loss convergence。](/paperReading/23-midtool-agentic-tool-use/paper/figure-4-sft-loss.webp)

*Figure 4，論文 Appendix C.1：Qwen3-4B-Base + MidTool-Mix 從較低的 SFT loss 開始，早期收斂較快，並在大部分 training steps 維持較低 loss；這是 optimization efficiency signal，不是直接的 agent success 指標。原圖可定位到 [Figure 4](https://arxiv.org/html/2608.20314v1#A3.F4)，取自 arXiv HTML，頁面標示 CC BY 4.0。*

![MidTool 論文 Figure 5：4B 與 8B 在 RL 訓練中的平均 reward。](/paperReading/23-midtool-agentic-tool-use/paper/figure-5-rl-reward-4b.webp)

![MidTool 論文 Figure 5：8B 在 RL 訓練中的平均 reward。](/paperReading/23-midtool-agentic-tool-use/paper/figure-5-rl-reward-8b.webp)

*Figure 5，論文 Appendix C.2：MidTool-Mix 初始化的 RL reward 在早期較高、上升較快，非 mid-trained baseline 在相同 environment 後期逐步追上。這比較像「更快適應」而不是「永遠更高」；原圖可定位到 [Figure 5](https://arxiv.org/html/2608.20314v1#A3.F5)，取自 arXiv HTML，頁面標示 CC BY 4.0。*

Figure 4 與 Figure 5 提供了底層優化機制的有力註解：MidTool 注入的先驗本質上提升了模型的**優化效率（optimization efficiency）**——讓模型以更低的初始 loss 進入下游微調，並在強化學習初期以更快的速度爬升獎勵值。

### 關鍵邊界：Web-Search 的 0.00% 失敗

在 MCP-Universe 的細項評測中，雖然瀏覽器操作、金融分析與位置資訊等工具子集的通過率皆有增長，但 **web-search 子集的 score 與 pass rate 均牢牢固定在 0.00%**。

這項失敗是整篇論文最重要的科學邊界：它證實了「掌握通用工具呼叫」與「進行深度搜尋（deep-search agency）」屬於截然不同的認知架構。深度搜尋要求模型在發起檢索後，批判性評估檢索結果是否充分、動態調整查詢關鍵字、消除不同來源間的衝突資訊，並自主判定終止條件。MidTool 傳授的 schema 解析與呼叫排序，完全不足以自動催生這種高階控制迴路。

### 消融實驗：雙分支的互補性驗證

論文 Table 6 在固定 Qwen3-4B-Base + SFT 下，比較了不同語料組合及同等預算的通用資料（Dolmino-20BT）：

| 訓練語料配置 | BFCL non-live | BFCL live | BFCL multi-turn | BFCL overall | $\tau^2$ Pass@1 | $\tau^2$ Pass@4 | MCP score | MCP pass |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 無 Mid-training | 59.94% | 43.75% | 15.50% | 39.73% | 8.54% | 20.50% | 13.20 | 1.68% |
| Dolmino-20BT | 61.44% | 51.74% | 16.13% | 43.10% | 7.37% | 21.22% | 5.41 | 0.00% |
| 僅使用處理後 Raw Data | 60.40% | 52.60% | 13.90% | 42.30% | 7.30% | 21.90% | 12.20 | 3.03% |
| 僅加入 Native Trajectories | 68.21% | 55.81% | 18.75% | 47.59% | 4.23% | 12.95% | 6.80 | 1.12% |
| 僅加入 Context Trajectories | 62.73% | 50.26% | 21.00% | 44.66% | 8.99% | 21.94% | 8.46 | 1.12% |
| **完整 MidTool-Mix** | **66.38%** | **57.74%** | **26.63%** | **50.25%** | **12.23%** | **28.06%** | **18.66** | **5.03%** |

消融數據帶來了一項極具洞察力的發現：僅加入 Native Trajectories 的模型在 BFCL non-live 達到了驚人的 68.21%（甚至超過完整混合集的 66.38%），但其在多回合的 $\tau^2$-Bench Pass@4（12.95%）與 MCP-Universe（1.12%）卻發生顯著退化。

這證明了過度單一的可執行軌跡容易讓模型「過擬合於格式填寫」，喪失了面對真實複雜環境時的容錯與遷移能力。唯有將 context-grounded 與 native executable 雙向融合，才能在保持呼叫精準度的同時維繫泛化彈性。

### 輔助驗證與潛在斷裂

- **DeCon 污染檢測**：作者執行 DeCon 污染分析，檢驗出少於 20 個潛在 n-gram 重疊候選，人工審核證實均為公開通用的 API 宣告模板，未發現測試集資料洩漏。然而該檢驗僅能排除表面字詞重疊，無法完全保證語意層級無相似性干擾。
- **VisualToolBench 視覺試驗**：Appendix C.3 報告了小型視覺工具遷移試驗。tool success 從 0.5863 顯著上升至 0.7231，但衡量最終回答品質的 overall rubric 僅從 0.0567 微幅升至 0.0661。這一巨大落差深刻提醒：**工具呼叫成功絕不等於最終回答正確**，評測若只記錄 call success，極易掩蓋答案未受工具回傳約束的根本性失敗。

## 證據地圖 / Evidence map

為了將論文報告的經驗數據與工程推論嚴格區隔，本節將相關主張明確歸類為四個層次：

| 層次 | 核心主張範疇 | 關鍵依據與邊界 |
| --- | --- | --- |
| **論文直接證據** | 4B／8B 在固定的 SFT 與 RL 下，於 BFCL、$\tau^2$-Bench 及 MCP-Universe 部份指標取得顯著增益；雙分支消融證實互補性。 | Tables 3–6、Figures 4–5、Appendix A–D 之具體統計數據。 |
| **作者因果解讀** | 工具使用應作為通用底層先驗於 mid-training 注入；雙分支分別解決 grounding 與 execution 瓶頸。 | 論文 Sections 1–2 之理論論述與動機闡釋。 |
| **論文未證明** | 跨非 Qwen 模型架構的穩定性、是否能自然衍生 search agent、真實生產環境的投資回報率。 | MCP web-search 仍為 0.00%、缺乏 cross-seed 信賴區間。 |
| **Bloss0m 工程化整理** | 實務評測須強制解耦「呼叫成功」與「答案 grounding」；導入時應採漸進式四段對照。 | 基於資料合約與工程部署實踐之獨立推論。 |

### 論文直接證據 / Direct paper evidence

1. **基準提升**：在 Qwen3-4B-Base + SFT 下，MidTool-Mix 讓 BFCLv3 overall 達到 50.25%（無 mid-training 為 39.73%）、$\tau^2$-Bench Pass@4 達到 28.06%（20.50%）、MCP-Universe pass 達到 5.03%（1.68%）。（Tables 3–5）
2. **多回合優勢**：BFCL multi-turn 分數由 15.50% 提高至 26.63%，主要增益集中在參數缺失與長程協商情境。（Table 3）
3. **優化效率**：相同下游 SFT 語料上，MidTool 初始化具備更低的起始 loss 與更快的收斂速度（Figure 4）；RL 訓練初期獎勵值攀升更陡峭（Figure 5）。
4. **雙分支消融**：Table 6 證實單純使用 raw data（BFCL 42.30%）、單純使用 native trajectories（BFCL 47.59%、$\tau^2$ Pass@4 12.95%）或單純使用 context trajectories（BFCL 44.66%、$\tau^2$ Pass@4 21.94%），表現皆顯著遜於完整 MidTool-Mix（50.25% 與 28.06%）。
5. **視覺試驗脫節**：Appendix C.3 顯示 tool success 提升 13.68 pp，但 overall rubric 僅微升 0.94 pp。

### 作者因果解讀 / Author causal claims

1. **先驗注入時機**：作者主張工具使用能力涉及深層的符號 grounding 與規劃，屬於通用世界知識的一部分，應於 mid-training 階段塑造，而非單純視為後訓練的語氣與格式對齊。
2. **功能分工機制**：作者認為 context-grounded 擴增教會模型在非結構化文檔中識別工具邊界，而 native synthesis 則確立了介面操作的語法精確度，兩者在特徵空間上形成互補。
3. **搜尋失敗歸因**：作者將 MCP web-search 的 0.00% 失敗解釋為：通用工具先驗不足以應對探索型檢索所必需的反覆假設檢驗與證據收斂。

### 論文未證明 / Unsupported claims

1. **跨架構與預算泛化**：論文僅在 Qwen3-4B 與 8B 上實驗，尚未證明該方法在 Llama、Mistral 或其他 MoE 架構上是否有一致增益，亦未在嚴格對齊算力預算下全面掃描最優混合比例。
2. **深度搜尋能力自發湧現**：實驗明確顯示其無法解決 web-search 任務，尚未證明純工具先驗能轉化為 deep-search agent。
3. **統計分佈完整性**：評測結果主要為單點估計（point estimates），缺乏跨隨機種子（cross-seed）的方差與信賴區間分析。
4. **生產環境性價比**：未證明在實際工業場景中，耗費 32 張 H200 進行 mid-training 的投資回報率，是否高於直接優化 runtime 重試機制、動態 schema 剪裁或強化 prompt engineering。

### Bloss0m 工程化整理 / Bloss0m engineering synthesis

1. **雙重評估原則**：團隊在評估任何 tool-augmented agent 時，必須強制將「工具呼叫語法成功率」與「最終答案實質依據工具回傳（grounding faithfulness）」分開計分，防止產生系統運行良好的虛假安全感。
2. **資料合約分流**：企業內部建構工具資料時，應嚴格區分 raw doc、context-grounded 與 native executable 三類資產，並在 native 軌跡入庫前實施強制的 schema 靜態檢查與回傳一致性驗證。

## Artifact 與可重現性 / Artifacts and reproducibility

截至 2026-08-24 的公開資產與可存取狀態如下：

- **論文正文與附錄**：[arXiv abstract](https://arxiv.org/abs/2608.20314)、[arXiv HTML full version](https://arxiv.org/html/2608.20314v1) 與 [PDF v1](https://arxiv.org/pdf/2608.20314v1) 均可自由存取。論文於 arXiv HTML 頁面標註採用 CC BY 4.0 授權。
- **資料集**：Hugging Face 組織頁公開 [MidTool/MidTool-Mix](https://huggingface.co/datasets/MidTool/MidTool-Mix)（總體積約 42.7 GB），涵蓋 Web、PDF、Code 與 Native-agent-traj 子集。存取需要透過 Hugging Face 申請授權並接受 MidTool-Mix License 及上游資料規範。
- **模型權重**：[Arctic-MidTool-MT-4B](https://huggingface.co/MidTool/Arctic-MidTool-MT-4B)、[Arctic-MidTool-MT-8B](https://huggingface.co/MidTool/Arctic-MidTool-MT-8B) 及相應的 RL checkpoint 均已公開。Model card 明確將其定位為後續 SFT／RL 的基礎模型，而非可直接對話開箱即用的助理模型。存取要求同意 Apache-2.0 及相關授權條款。
- **輔助管線資產**：用於過濾 Web 與 PDF 的 fastText 分類器亦已開放，但部分頁面標示受限存取。
- **可重現性邊界說明**：本文所引用的數據均為作者發表之實驗結果，本文並未宣稱已在本地完整重現基準測試。要完成端到端的獨立重現，除了獲取受限資料外，尚需重建 32 張 H200 的 ArcticTraining 分布式環境、AWM 模擬器與 BFCL／$\tau^2$-Bench 的評測 harness。

## Bloss0m 工程判斷與不適用條件 / Bloss0m engineering judgment and when not to use it

### 給工程團隊的漸進式實施路徑

若團隊有意將 MidTool 的核心思想引入自身的客製化模型或私有 agent 管線，建議工程團隊先執行小型、可回溯的四段對照實驗，而非盲目投入海量算力複製 20.3B tokens：

1. **建立工具資料合約（Data Contract）**：為每一條內部工具使用樣本標註資料來源、API 版本、必填引數清單、環境回傳結構、資安權限等級，以及是否為合成資料。
2. **嚴格分流三類資料資產**：嚴禁將未經結構化驗證的技術文件問答、模擬合成的 tool call trace 與生產環境的真實執行日誌混淆在同一資料集內，避免引入不可解釋的噪訊。
3. **固定下游微調配方進行消融**：在投入大量算力前，建立一個由百萬級 token 組成的實驗子集，設置五組嚴格對照（no-mid、raw-only、context-only、native-only、full-mix），驗證特定業務領域的工具邊界是否真能透過 mid-training 獲取增益。
4. **指標解耦與切片監控**：評估時除了追蹤語法有效性與 Pass@k，必須強制加入「最終答案是否引用工具真實回傳」的幻覺檢測，並將包含多步檢索的長程任務單獨切片分析。

### 什麼情況不該採用 Mid-training

在以下情境中，推動 mid-training 往往不符合工程效益：

- **瓶頸在於 Runtime 與架構層面**：若當前 agent 的主要故障源於工具權限設定錯誤、缺少穩健的超時重試機制、上下文長度膨脹導致注意力渙散，或是模型日誌觀測能力不足，此時應優先修正執行時架構（runtime plumbing）。
- **後訓練標註品質低劣**：若現有 SFT 資料中充斥著錯誤的參數標籤或格式矛盾，先提升 post-training 資料的清洗標準比盲目進行 mid-training 更具回報。
- **高度依賴即時 Deep-Search 的場景**：MidTool 實驗已明確證明通用工具先驗無法解決 web-search 的 0.00% 困境。若核心需求是具備探索、篩選與交叉比對能力的研究型 agent，應當專注於設計專門的檢索推理閉環與反思機制，而非期盼通用 mid-training 自然生長出搜尋智能。

## 讀完後的三個記憶點 / Three things to remember

1. **先驗位置決定能力上限**：MidTool 將工具理解、schema grounding 與執行工作流提前至 mid-training 階段塑形，證明了工具使用不只是後訓練的對話格式對齊，更是模型基礎認知先驗的重要組成。
2. **雙分支資料結構具備實質互補性**：Context-grounded 擴增賦予模型通讀文檔與理解邊界的能力，Native agentic 合成則奠定精確呼叫的底層機制；消融實驗證實任何單一分支皆無法兼顧精確性與泛化性。
3. **謹記關鍵能力邊界**：工具呼叫成功不等於最終答案受工具約束；且通用工具先驗在面對 deep-search 式的探索型檢索時依然完全失效（0.00% pass），切勿將 benchmark 指標的局部增益過度推論為 agent 全面成熟。

### 一句話帶走

**工具使用並非微調階段的格式粉刷，而是需要提前在 mid-training 植入的認知先驗；但掌握工具調用，絕不等於自動擁有了自主深度搜尋的控制智能。**

想進一步探索相關機制，建議延伸閱讀目錄級 API 呼叫的經典研究 [Gorilla](/paper-reading/35-gorilla-llm-connected-with-massive-apis/)，以及探討動態檢索如何解決工具膨脹的 [RAG-MCP：用檢索降低工具選擇的 prompt bloat](/paper-reading/04-rag-mcp/) 與 [MCP roadmap](/blog/mcp-roadmap/)，深入理解 runtime 層面的工具治理之道。

## Primary sources

- [Jiang et al., “MidTool: Mid-training Data Synthesis for Agentic Tool Use,” arXiv:2608.20314 v1](https://arxiv.org/abs/2608.20314)
- [MidTool full paper in arXiv HTML](https://arxiv.org/html/2608.20314v1)
- [MidTool-Mix dataset card and license on Hugging Face](https://huggingface.co/datasets/MidTool/MidTool-Mix)
- [Arctic-MidTool-MT-8B model card on Hugging Face](https://huggingface.co/MidTool/Arctic-MidTool-MT-8B)
