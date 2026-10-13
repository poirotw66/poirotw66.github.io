---
title: "Agent Planning Benchmark 精讀：拆解 Agent 規劃與失敗診斷"
description: "從 4,209 個案例與五種規劃設定，理解 APB 如何把 Agent 的長程規劃、工具干擾、故障恢復與拒答拆成可診斷的證據；並檢視其受建構任務、LLM 評審與受控執行驗證限制的範圍。"
pubDate: 2026-10-11
tldr:
  - "APB 把整體計畫、依回饋逐步規劃、無關工具、故障工具與不可解任務分開評估，試圖定位 Agent 是在哪一類規劃決策出錯。"
  - "作者在 12 個多模態模型上觀察到整體長程規劃比 step-wise 規劃更難；E4 邏輯錯誤跨設定常見，工具干擾與資訊不足也揭露不同弱點。"
  - "額外的 ToolSandbox 與 τ²-bench 各 200 題受控比較中，APB 引導的一輪修正提高三個模型的執行指標；這是作者報告的有限環境結果，不是生產可靠度證明。"
  - "資料含作者建構與模型擴增案例，評分部分依賴 LLM judge；資料集檢視器回報 schema CastError，程式與資料授權尚未確認，且沒有獨立重跑。"
audience:
  - "設計與評估使用工具的 LLM Agent 的研究者和工程師"
  - "需要區分規劃錯誤、執行失敗與不確定拒答的技術讀者"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Evaluation", "Research"]
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
field: "AI Systems"
difficulty: "advanced"
showToc: true
image: "/paperReading/96-agent-planning-benchmark-diagnostic-planning/title_image.webp"
paper:
  title: "Agent Planning Benchmark: A Diagnostic Framework for Planning Capabilities in LLM Agents"
  authors:
    - "Haoyu Sun"
    - "Wenxuan Wang"
    - "Mingyang Song"
    - "Jujie He"
    - "Weinan Zhang"
    - "Yang Liu"
    - "Yang Yang"
    - "Yu Cheng"
  year: 2026
  venue: "arXiv:2606.04874 v3 (2026-10-05; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2606.04874v3"
    arxiv: "https://arxiv.org/abs/2606.04874"
    code: "https://github.com/Mikivishy/AgentPlanningBenchmark"
    project: "https://huggingface.co/datasets/Mikivis/AgentPlanningbBenchmark"
series:
  id: "agent-planning-diagnostics"
  title: "Agent 規劃與評測"
  part: 1
  totalParts: 1
---

<!-- paper-reading-no-body-figures: The v3 paper's figures are material, but its arXiv record provides only a perpetual non-exclusive distribution license and no explicit figure-reuse permission. This reading therefore includes no copied paper figures. -->

## 90 秒掌握論文

- **問題**：Agent 的最終任務成功率把計畫品質、工具呼叫、環境狀態與失敗後復原混在一起。結果失敗時，光看最後答案很難知道模型是否誤解目標、漏掉步驟、選錯工具，或只是遇到執行端問題。
- **核心洞見**：把「規劃」拆成不同資訊條件與失敗壓力下的測試，再用正確率、計畫等級和錯誤類別交叉觀察。APB 包含 Holistic Planning、Step-wise Planning、Tool-Extraneous、Tool-Broken、Unsolvable 五種設定。
- **最強證據**：論文報告 4,209 個案例、22 個領域、12 個多模態模型；另在 ToolSandbox 與 τ²-bench 各 200 題上比較直接執行、先規劃再執行和一輪 APB 引導修正，三個代表模型的修正組執行指標均高於 plan-first 組（Sections 4.2、5.1）。
- **主要邊界**：資料包含模型輔助擴增與作者建構案例，LLM judge 仍可能誤判；兩個執行環境是受控測試，不能代表開放式生產工作。論文也報告長思考對部分 step-wise 設定可能過度修正。

本文依據 2026 年 10 月 5 日提交的 arXiv v3 預印本；其同儕審查狀態未建立。APB 的重點不是再造一個「誰的 Agent 最強」總榜，而是把執行前的規劃能力拆開來看：完整工具鏈能否先排對、看到中間回饋後能否選對下一步、面對干擾或故障工具能否調整，以及證據不足時是否停止。作者以五種設定評估 12 個模型，再把診斷訊號帶進兩個現成執行環境做受控驗證。這讓論文從「計畫評分」向下游執行多走了一步，但它仍提供的是特定 benchmark 與任務上的作者結果，不是實際部署的可靠率。

## 既有評估方法的限制：為什麼只看任務成功率不夠

端到端 Agent benchmark 的任務完成率很重要，因為它回答系統最後有沒有完成工作。但這個數字把多個環節摺在一起：模型怎麼理解需求、是否把任務分解完整、工具與參數是否合適、回傳資料是否正確、環境是否穩定，以及失敗後有沒有恢復。若工具服務短暫失效，成功率可能下降，即使模型預先選擇的策略合理；反過來，即使工具回應正常，一個漏掉前置條件的計畫也可能在後續步驟中才暴露。

APB 的研究問題因此偏向診斷：在工具尚未執行，或只提供部分軌跡回饋時，模型提出的規劃是否合理？當可用工具、回傳結果或任務可行性改變，模型是否能作出適當調整？既有專注終局結果的評測沒有消失，而是缺少定位失敗發生在規劃哪一層的訊號。作者把 APB 定位為完整執行 benchmark 的上游補充，而非替代品（Sections 1、3、6）。

「上游」也不是說規劃分數可以單獨預測部署成敗。APB 將輸入約束在自然語言或多模態任務、固定工具規格和可提供的軌跡內容上；它不建模隨機狀態轉移、信念狀態更新或動作結果機率。因此，這套測試能問計畫是否滿足任務條件，不能完整表示現場工具的隨機性、權限政策、網路故障與長期副作用（Limitations）。

## 核心直覺：同一個模型要回答不同的規劃問題

APB 不把規劃當成單一抽象能力，而按可見資訊、規劃範圍和壓力源拆分測試。最核心的對照是 **Holistic** 與 **Step-wise**。前者給模型一個目標、系統提示和工具集合，要求一次產生完整計畫與工具鏈；後者給它部分執行軌跡（包括已採取動作及工具回傳），要求預測接下來一到三個動作（Section 3.1）。前者測全局分解與長程一致性，後者測使用當前狀態和回饋作局部決策。

這兩者不是簡單的難度級別。同一條工具鏈可能在全局上看似完整，但其中一步參數不對；一個 step-wise 動作也可能在眼前看來合理，卻因模型未看見更遠的依賴關係而導致後續死路。APB 以多種資訊條件測試這些不同錯誤，而不是假設「短期答對就代表長程計畫也可靠」。

### 五種設定各自要診斷什麼

| 設定 | 模型收到什麼、要輸出什麼 | 對應問題 |
| --- | --- | --- |
| Holistic（1,109 題） | 目標與工具集合；輸出完整計畫及工具鏈 | 能否先拆解長程目標並維持步驟、依賴與限制一致 |
| Step-wise（900 題） | 部分軌跡與工具回饋；預測下一步，或接下來二至三步 | 能否根據當前狀態更新局部決策，而非過早結束 |
| Tool-Extraneous（1,500 題） | 在原工具集合中加入 2、4、6、8 或 10 個語意相近但無關工具 | 工具目錄變吵時，是否會誤選干擾工具 |
| Tool-Broken（300 題） | 關鍵工具回傳錯誤，並提供替代工具 | 能否診斷失敗並改用替代工具，而非重試壞工具或放棄 |
| Unsolvable（400 題） | 任務缺資訊、缺工具、視覺證據不可用或約束互相矛盾 | 是否辨認任務無法成立並明確拒答，而非補造資訊 |

論文列出各設定的規模，並指出 Tool-Extraneous 題由部分基礎案例擴增，Unsolvable 題也由既有整體規劃題轉換而來；這些數量不是五組完全互斥、各自獨立抽樣的任務群（Section 3.1; Appendix B）。

### 走完整個方法：從一次輸入到可診斷結果

想像使用者要比對幾份文件，抽出限制，再透過工具建立摘要。Holistic 模型一次看見目標與工具描述，必須提出步驟順序、呼叫哪個工具以及參數理由；評審再判斷整個方案是否可行且涵蓋要求。Step-wise 模型則看到先前查詢及工具回傳，例如其中一份文件缺少日期，接著只須預測下一個動作。這能分辨它是否把新證據納入決策，而不是照抄原先假設。

再把工具清單加入名稱相似但功能不相關的工具，測試干擾下的選擇；把關鍵工具回應換成錯誤結果並提供替代品，測試修復；最後移除必要資料或製造互斥限制，測試是否停止。每個案例經模型產生答案後，由評估流程判定正確性、缺陷嚴重度及錯誤類型。**這個例子是對論文協定的教學改寫**；它不是作者實驗中的單一案例或額外結果。

## 方法流程：三個互補的評估視角

APB 的結果不是只用一種分數。第一層是 **Plan Correctness**：計畫是否邏輯合理、可執行，並完整滿足任務目標。第二層是 **Plan Grade**：以 0、0.2 到 1.0 的離散級距衡量缺陷嚴重度、目標完成、完整性、約束滿足和邏輯一致性；它不是與單一標準計畫的文字距離。第三層是 E1–E6 錯誤分類，讓同一個回答可以同時標記多種問題（Section 3.3; Appendix C.2）。

| 錯誤 | 讀法 | 要注意的界線 |
| --- | --- | --- |
| E1 目標理解 | 誤解使用者真正想完成的事 | 不是表面文字相似度 |
| E2 提前結束／任務不完整 | Step-wise 未解完就停止；Holistic 漏列必要子任務 | 名稱依規劃範式呈現不同子型 |
| E3 約束違反 | 違反系統提示或明示限制 | 需以題目實際提供的條件判斷 |
| E4 邏輯錯誤 | 依賴順序、前提或因果關係不成立 | 只要替代路徑可行且滿足限制，偏離參考路徑本身不算錯 |
| E5 工具使用錯誤 | 誤解工具功能或操作語義 | 包含把無關干擾工具用進計畫 |
| E6 幻覺 | 編造事實、工具或尚未取得的中間結果 | 不是所有估計都屬此類，要看題目與輸出證據 |

這組視角彼此補充：Correctness 回答「整體是否過關」，Grade 回答「缺陷有多嚴重」，Taxonomy 回答「問題屬於哪種機制」。由於一個樣本可同時有多種錯誤，E1–E6 的出現率不應被解讀成互斥的失敗比例；跨任務比較也要留意題型、範式與評分條件是否相同。論文也用任務特定行為分類看故障恢復（Replace、Alter、Retry、Refuse、Other）與不可解題拒答率。不同分類不應混成同一個錯誤總數：在 Tool-Broken 中 Replace 是預期的復原路徑；Unsolvable 的拒答則是合理終點（Sections 3.1、4.2.3–4.2.4）。

評分大量依賴 LLM-as-a-Judge。作者稱其評估會將輸出對照參考軌跡，但接受語意有效的替代方案，並在附錄分析 judge 一致性、答案多樣性和自我評估偏誤（Appendix D）。在同一批 720 個人類標註樣本上，Gemini 3 Pro 的 correctness agreement 為 92.22%、F1 為 0.935；拿掉參考答案後 agreement 降為 80.83%（Table 7）。這說明參考軌跡對評審判斷很重要，也提醒讀者 judge 的表現依賴可用的參考資料。這 720 個樣本是 judge 評估的一部分，不等同於 720 個完整獨立的人類 benchmark 樣本，也不能視為所有題型都已被人工裁決。

## 實驗如何讀：能力差異比總排名更有用

作者評估 12 個多模態模型，包含六個開放權重模型和六個專有模型。主要結果是作者在 APB 上執行的 benchmark 聚合；沒有獨立第三方重跑或用來建立跨部署信賴區間的統計不確定性估計。閱讀 Table 1 與 Figure 3 時，應先問每一列對應哪種設定和錯誤類型，再看模型名稱或排序（Sections 4.1–4.2.1）。

### 長程完整規劃與回饋下的局部規劃

論文報告所有模型在 Holistic 的正確率低於 Step-wise，且開放權重模型在長程整體規劃特別脆弱。錯誤分布中，E4 邏輯錯誤是共同瓶頸；Holistic 還有較多任務不完整、約束違反與幻覺，Step-wise 則集中在局部工具使用與邏輯問題。作者另外在同一批 300 個底層案例上做配對分析，並在 Appendix G.1 報告結果與顯著性檢定。此處支持的是兩種規劃條件難度與錯誤型態不同，不是證明任一模型總是無法作長程規劃。

### 無關工具會讓長程工具鏈更容易偏航

Tool-Extraneous 對 Holistic 的影響比 Step-wise 明顯。作者報告 GPT-5 與 Claude Sonnet 4.5 在整體規劃的正確率分別下降 22.0 與 12.3 個百分點；Step-wise 的下降則落在 0.9 至 6.7 個百分點（Table 2）。圖中工具干擾數增加與錯誤使用干擾工具呈正向關係（Figure 4）。這與一個可理解的機制一致：一次生成的長工具鏈，任何早期誤選都可能連鎖影響後續步驟；每次只決定一個或少數動作時，模型有回饋機會重新定位。

這項差異不是「逐步規劃普遍更好」。Step-wise 看到執行回饋，與 Holistic 的輸入資訊並不相同；模型也仍會出現工具選錯和邏輯錯誤。結果指出的是這種測試設計下的相對韌性，不能直接推成增加工具清單後，實際 Agent 系統會維持成功率。

### 故障復原與拒答不是同一個安全能力

Tool-Broken 要求模型看到錯誤回傳後選擇替代工具或其他有效工具；Unsolvable 要求模型在證據、工具或約束令任務無法完成時拒絕。作者發現模型普遍較能察覺明示的約束衝突，較難處理資訊缺漏；缺少必要工具時，部分開放權重模型仍盲目嘗試。特定專有模型也在移除工具或視覺資訊不足等子題上有弱點（Section 4.2.3–4.2.4）。

這兩種能力方向不同：故障後恢復是「仍可完成，換條路走」；不可解任務是「目前條件下不能承諾完成」。把兩者合成一個泛稱的韌性分數，會掩蓋模型可能很會替換工具，卻不會承認缺少必要資料。對工程團隊而言，這種差別值得在評測報表保留。

## 修正計畫是否改善執行：受控橋接實驗

v3 另加入兩個獨立於 4,209 題主要 benchmark 的執行驗證：ToolSandbox 200 題與 τ²-bench 200 題。作者對每個環境測試三個模式：Direct 不先規劃直接執行；Plan-first 先產生整體計畫再執行；Refine 從相同初始計畫出發，接受一輪 APB 引導的診斷後修訂，再以相同執行器執行。GPT-4o、Qwen3-VL-235B-A22B 與 Gemini 2.5 Flash 是三個代表模型。評估使用 Gemini 3 Pro 產生計畫等級、E1–E6 指標與診斷理由，再要求被測模型自我修訂；提示包含 anti-leak 條件，執行器、採樣設定與環境在 Plan-first 和 Refine 間保持一致（Section 5.1; Appendix C.10）。

ToolSandbox 的指標是軌跡相似度，τ²-bench 的指標是任務 reward，兩者都是越高越好。相較 Plan-first，Refine 在三個模型的 ToolSandbox 軌跡相似度高出 3.4–5.5 個百分點，τ²-bench reward 高出 0.03–0.07；例如 GPT-4o 分別從 79.2 到 83.3、從 0.56 到 0.63（Table 3）。作者也報告 APB correctness 與 grade 在修訂後上升。這使 APB 的診斷訊號不只與計畫評分有關，也在這組受控比較中伴隨較好的下游執行指標。

但證據仍有範圍。比較只包含兩個環境、各 200 題與三個模型，且修訂依賴一個 Gemini 3 Pro 評審模型提供結構化批評。它支持「這種一輪、這種提示與執行配置下，修訂組指標較佳」，不支持「APB 一定改善任何生產任務」，也不能拆除模型版本、任務設計、judge 品質與工具環境對結果的影響。論文未提供獨立重跑。

## 長思考的代價：多一些反省不一定更好

作者比較 Self-Refinement 與 Critic-Guided Refinement，並測試有無明確錯誤指標的提示（Table 4）。在 Holistic 規劃中，E1–E6 指標引導的修訂通常能提高正確率；但 Step-wise 結果更不一致。有些模型在短期決策上增加反省後反而下降，特別是沒有指標約束的自我修訂。這種 over-correction 提醒讀者：整體計畫的缺陷檢查與眼前一個動作的最佳化，不一定適合相同的反思深度。例如，Table 4 中 InternVL3.5-30B-A3B 使用帶錯誤指標的自我修訂後，step-wise 正確率由 60.00% 降至 43.33%（−16.67 個百分點）；改用帶指標的 critic 修訂則升至 68.00%（+8.00 個百分點）。同一模型的 holistic 正確率在 critic 修訂下由 9.33% 升至 42.00%。這不是單純「反省有用或無用」，而是修訂方式與規劃範式交互作用。

在 Step-wise 設定中，預測範圍從一步拉長到兩步、三步，正確率隨 horizon 延伸而下降；錯誤類型也隨規劃範圍改變（Figure 5; Appendix G.1）。這符合局部決策逐步累積依賴的直覺，但仍是作者 benchmark 中指定預測協定的結果。Table 5 的效率感知規劃則另外測試成本標記工具、不同有效路徑與陷阱工具；它回答成本選擇能力，不應誤讀成前述修訂實驗的成本效益分析（Section 5.4; Appendix C.9）。

## 證據地圖：結論能走到哪裡

| 作者的主張 | 論文提供的證據 | 這些證據能支持什麼、不能支持什麼 |
| --- | --- | --- |
| 規劃需要多設定診斷，而非只看終局成功 | 4,209 題、22 領域、五種設定；12 個模型與 E1–E6 分析（Sections 3–4; Table 1） | 展示了 benchmark 覆蓋和不同錯誤分布；不證明這些類別涵蓋所有真實規劃問題 |
| 工具噪音、失效和不可解條件暴露不同缺陷 | 工具干擾數量比較、故障行為分類、四種不可解條件的拒答分析（Tables 1–2; Section 4.2） | 支持在該題集和提示下觀察到的模型差異；不能推出部署時相同失敗率 |
| APB 引導修訂可能改善執行結果 | ToolSandbox 和 τ²-bench 各 200 題，三種執行模式（Table 3; Section 5.1） | 在兩個受控環境中，Refine 指標高於 Plan-first；不建立跨任務普遍因果保證 |
| 更深反省不是所有規劃步驟的解法 | Self/Critic、with/without metric 比較與不同 horizon 結果（Table 4、Figure 5） | 顯示特定模型與設定下有 over-correction；不能歸納為所有 step-wise 任務都應少思考 |

資料建置將 OpenCUA、GTA、GAIA、ToolBench、FrameThinker 和公開線上 Agent 平台的互動資料納入，再以 Claude Sonnet 4.5 擴增部分查詢、工具集合和軌跡；規則式檢查、兩階段 LLM 驗證與作者人工檢查構成品質流程（Section 3.2; Appendix B）。作者說明擴增不是從零生成所有題目，且評測模型看不到生成器身分、合成軌跡和參考計畫。但他們也指出，無法直接稽核專有模型預訓練污染。資料來源混合讓測試較多樣，同時使「建構案例能代表真實工作」成為外部效度問題。

720 個人類標註比較有助於檢視 judge 評分，但自動評審仍受模型偏誤、判斷邊界與參考表示影響。資料中有合成或建構任務，作者也承認任務數不可能涵蓋開放世界，且某些垂直領域可能代表不足（Limitations; Appendix D）。因此，論文最有力的貢獻是建立一套可把規劃模式與失敗類型分開觀察的評估框架，再提供初步下游驗證；最需要審慎外推的部分，是將固定題集、固定工具描述與 judge 評分連到真實多變的工作流。

## 限制、可重現性與讀者可取得的材料

論文是 arXiv v3 預印本，提交日期為 2026 年 10 月 5 日；同儕審查狀態未建立。作者明確指出 APB 聚焦規劃，不建模隨機轉移或 belief-state 更新，應補充而非取代端到端部署測試。資料及 judge pipeline 的部分步驟依賴專有基礎模型，外部讀者也無法確認其當時 provider 版本是否與作者執行時相同（Limitations）。

截至 2026 年 10 月 11 日，作者的 [評估程式庫](https://github.com/Mikivishy/AgentPlanningBenchmark) 與 [Hugging Face 資料集](https://huggingface.co/datasets/Mikivis/AgentPlanningbBenchmark) 頁面可公開檢視。資料集網頁目前在 viewer 產生資料時顯示 schema `CastError`；這表示透過 viewer 瀏覽的路徑受阻，不能據此斷言底層下載檔案不存在。程式與資料的明確授權尚未確認，因此讀者應先核實授權和準備流程，再決定是否下載、改作或散布。Repository 提供資料準備與執行說明，但完整實驗需要 Python 依賴、模型 API 存取和多次模型呼叫；使用大型 self-hosted judge 也有顯著算力需求。

本文未獨立重跑 benchmark；所有實驗數字均為作者報告。若要做小規模再現，可先在確認授權後準備一個 split，對單一模型執行小樣本，再比較 plan-first 與一輪診斷修訂。這種抽樣試跑只驗證命令、schema 與局部流程可工作，不會重現論文完整比較，也不會解除 viewer 錯誤或模型版本變動帶來的差異。

## Bloss0m 工程判斷：把規劃分數接回執行證據

以下是 **Bloss0m 工程判斷**，不是作者提出或驗證過的部署流程。若把 APB 的設計帶進內部 Agent 評估，應把規劃與執行分成相鄰但獨立的關卡：先記錄計畫是否覆蓋目標、滿足限制、選擇正確工具，再記錄同一計畫在環境中的實際結果。當前者高、後者低，才有理由調查權限、工具穩定度、狀態同步或執行器；不能把計畫分數當成執行成功的替代值。

工具故障測試也應同時記錄錯誤回傳、可用替代項、是否重試及副作用是否已發生。不可解測試則要精確指定缺少的資訊或工具，並區分「暫時無法判定」和「邏輯上互相矛盾」。這樣才能看出模型是否知道何時換路、何時澄清、何時停下，而不是只看拒答比例高低。這些記錄方式是根據 APB 的分類所作的工程延伸，仍需按實際工具權限、業務風險和任務分布驗證。

APB 較適合作為版本間的診斷組合，而不是單一 leaderboard gate。採用時可固定代表性案例與模型版本，對長程、step-wise、工具干擾、故障替換、資訊缺漏分別設門檻，並把重複執行變異、judge 抽查和實際端到端評估一起保存。若產品任務有隨機環境、動態權限、多使用者副作用或不能預先定義的完成條件，還需要環境互動與人工審查；APB 不能回答那些完整問題。

## 讀完後的三個記憶點

1. **方法**：APB 把完整規劃、回饋下的局部規劃、無關工具、工具故障和不可解任務分開測，並用正確性、嚴重度與 E1–E6 分類描述失敗。
2. **證據**：12 個模型的比較指出 Holistic 長程規劃較難、工具干擾更傷整體工具鏈；兩個各 200 題的受控執行研究中，一輪 APB 引導修訂改善三個模型的特定執行指標。
3. **界線**：建構任務、LLM judge、有限環境和未獨立重跑限制外推。規劃診斷可以幫忙定位問題，不能替代真實執行測試或證明生產可靠度。

## 延伸閱讀

- [Tool Call Succeeds, Workflow Fails](/paper-reading/49-tool-calls-workflows-fail/)：理解工具回應成功與整體工作流程完成之間的差距。
- [Claim-Safe Closed-Loop AI Evaluation](/paper-reading/94-claim-safe-closed-loop-ai-evaluation/)：從評估資料、回饋迴路與可追溯聲明延伸 Agent 評測設計。
- [ScienceIDE: Turning World's Scientific Codebase into Agent Learnable Environments](/paper-reading/95-scienceide-scientific-code-environments/)：比較以可執行環境和領域檢查評估長程 Agent 任務的另一種設計。

## Primary sources

- Sun et al., [Agent Planning Benchmark: A Diagnostic Framework for Planning Capabilities in LLM Agents, arXiv v3](https://arxiv.org/html/2606.04874v3), 2026-10-05. 本文所有實驗結果均為作者報告，未獨立重跑。
- [APB 評估程式庫](https://github.com/Mikivishy/AgentPlanningBenchmark) 與 [APB 資料集](https://huggingface.co/datasets/Mikivis/AgentPlanningbBenchmark)，頁面查核日期 2026-10-11；程式與資料授權尚未確認。
