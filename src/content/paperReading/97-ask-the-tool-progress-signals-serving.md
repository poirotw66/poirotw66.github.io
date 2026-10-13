---
title: "Ask the Tool, Don't Guess 精讀：工具進度如何改變 KV Cache 調度"
description: "工具執行時間取決於即時負載，呼叫名稱和歷史紀錄難以預測。本文解析 Ask the Tool, Don't Guess 如何從工具輸出與執行環境讀取進度，將它轉成 KV cache 保留、卸載與回載訊號，並檢視作者在 4 張 H100 上報告的 TTFT 改善及其適用邊界。"
pubDate: 2026-10-13
tldr:
  - "工具呼叫等待期間，對話的 KV cache 仍占用 GPU 記憶體；呼叫名稱或歷史時長無法看見這一次工作在目前負載下的剩餘時間。"
  - "論文把工具已有的計數器、階段訊息和執行環境痕跡導入獨立側通道，讓 serving controller 依進度刷新、釋放或預取 KV cache。"
  - "在作者以 4 張 H100 SXM 重播 agent sessions 的測試中，相較 LRU，p90 post-tool TTFT 在純 HBM 配置下降 20.7%，HBM 加 DRAM 配置下降 20.8%；這不是跨服務或工作負載的普遍保證。"
  - "工具可能沒有可讀訊號、解析可能改變工具行為，租戶也可能謊報進度；論文提出 session credit ledger 模擬，但尚無可供獨立重跑的專屬程式碼、trace 或 engine patch。"
audience:
  - "設計 LLM agent serving、KV cache 與工具執行平台的工程師"
  - "研究長時間工具呼叫、推論排程與 agent 可觀測性的讀者"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Inference", "Observability", "Research"]
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
field: "AI Systems"
difficulty: "advanced"
showToc: true
paper:
  title: "Ask the Tool, Don’t Guess: Agent Tool Calls Hold Their Progress, and the Serving System Should Read It"
  authors:
    - "Yipeng Liu"
    - "Yingqiang Zhang"
    - "Feifei Li"
    - "Huanchen Zhang"
  year: 2026
  venue: "arXiv:2609.18849 v1 (2026-09-16; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.18849v1"
    arxiv: "https://arxiv.org/abs/2609.18849v1"
---

<!-- paper-reading-no-body-figures: The arXiv v1 record provides a perpetual non-exclusive distribution license but no explicit permission to reuse its figures, and no locally available figure assets with separately verified reuse permission were found. This reading therefore includes no copied paper figures. -->

## 90 秒掌握論文

- **問題**：Agent 等待工具時，上一輪對話的 KV cache 可能繼續占用 GPU 記憶體。Serving 系統必須決定保留它、移出 GPU，或在工具快完成時載回；但工具名稱、歷史耗時、預先宣告的時間與 GPU 佔用量都看不到此刻這個呼叫還要做多少工作。
- **核心洞見**：執行中的工具可能已經有答案：測試數、編譯單位、下載位元組或階段訊息。若把這些進度放到不影響 agent 原始觀察的側通道，serving controller 就能從「猜工具會跑多久」轉為「讀取工具目前走到哪裡」，並持續修正快取決策。
- **最強證據**：作者在四類公開 agent trace 中盤點可恢復的訊號，建立 wrapper 對照四個既有時間預測器，再把控制提示接進 vLLM，以 4 張 H100 SXM 重播 sessions。Figure 9 報告相較 LRU 的 p90 post-tool TTFT：純 GPU HBM 下降 20.7%，GPU HBM 加主機 DRAM 下降 20.8%（Sections 4–5）。
- **主要邊界**：這是 arXiv v1 預印本的作者實驗；長時間遠端 API、人工作業、尚未收到第一個位元組的等待，以及無法解析的工具仍不提供有效進度。結果不能證明任意工具協定、引擎或服務流量都會得到相同延遲改善。

這篇論文把工具呼叫視為 agent runtime 與模型 serving 之間的控制介面。它的主張並不是「每一種工作都能報出精準 ETA」，而是工具內部常留有兩種有用訊號：可換算為剩餘工作量的強訊號，以及只能指出最後階段將近的弱訊號。即使不改 agent 看見的輸出，serving 層也可能運用這些訊號安排快取生命週期。下文數字均為作者報告；本文沒有獨立重跑。

## 理解前需要知道什麼

Transformer 推論會把已處理 token 的 key/value 張量保存在 KV cache，避免下一輪重新計算整段上下文。Agent 呼叫工具後，模型暫時不產生 token，但工作階段仍可能需要原有上下文。若 GPU 空間緊張，serving 系統可以保留某些閒置請求的快取，把別的移出，或稍後再載回。過早移除會讓呼叫返回後要重算或等待載回；保留太久則可能擠壓正在生成的請求。

TTFT（time to first token）是請求送入模型後等到第一個新 token 的時間。本文關心的 post-tool TTFT，是工具完成後 agent 再次呼叫模型時，直到模型開始回覆的等待。p90 表示這組量測中第 90 百分位的延遲，而不是平均延遲。HBM 是 GPU 高頻寬記憶體；此處「HBM + DRAM」表示 GPU 記憶體外還有主機記憶體作為 KV offload 層。

## 核心直覺：由「呼叫前預測」改成「執行中回報」

工具時間不是命令列字串的固定屬性。同一個 build 在閒置 sandbox 可能比記錄中的執行快一個數量級；加入競爭鄰居後，多數呼叫又會慢上數倍。遠端套件站、物件儲存和模型 API 的回應速度也會隨時間、配額和外部狀態變化。歷史分布只有在工作環境相近時才有參考價值，混合不同負載歷史會讓預測在呼叫尾端更不準（Section 2.1、Figure 3、Table 1）。

傳統估計器包含固定 TTL、已經過時間、依工具名稱統計、依名稱與參數分類的模型、引擎佔用狀態，以及呼叫開始前由 caller 宣告的預估時間。它們的共同限制是沒有觀察呼叫正在做的工作。引擎知道 GPU 忙不忙，卻可能不知道某個工具剛開始或即將結束；固定宣告也要等工具結束才能修正。論文主張再增加一層資訊：執行中的工具持續回報可見進度，讓估計能跟著目前速度更新（Section 2.1、Table 1）。

這種進度不一定是 0 到 100% 的漂亮進度條。**強訊號**有計數與可信總量，例如「已完成 40 個、總共 66 個編譯單位」；**弱訊號**沒有可靠總量，但能指出末段工作或結束標記，例如 build 即將進入 link 階段。弱訊號不足以回答「還剩幾分鐘」，卻可能足以在快取回載需要的數秒前觸發預取（Section 2.2）。相對地，遠端 API 若只在完成時回應、命令在等人工輸入，或下載尚未收到第一個位元組，當下就沒有可解析的中途訊號。

## 用一個例子走完整個方法

以論文中的 scikit-learn 編譯為例，工具可能執行 232 秒，而 agent 只看見 `tail` 保留下來的最後幾行。編譯器卻會在 verbose 模式下逐一列出正在處理的檔案；dry run 可以先取得總數 66。論文所述的流程如下：

1. **註冊呼叫**：harness 以 call ID 向 serving side 登記這次工具執行，並準備可用的 verbose 開關或 dry run。
2. **保留原輸出**：工具照常執行，agent 仍透過原本的 pipeline 看見它原來會看見的內容。額外輸出留在側通道，不混進 agent 的觀察。
3. **發布事件**：executor tap 讀取編譯器輸出或 build 目錄新增的 object files，定期送出 call ID、已完成數、總數（若有）、phase 和 timestamp。
4. **更新剩餘時間**：controller 根據目前速率與未完成工作估 ETA。若這個上下文值得保留，engine 刷新 KV blocks 在 eviction queue 的位置；若判斷仍需很久，則停止刷新，讓 LRU 或 DRAM offload 接手。
5. **接近返回時恢復**：在有 DRAM 層的配置，controller 可在預估返回前一段 lead time 把上下文載回。工具完成後，原始輸出和 exit status仍回到 agent。

例子最容易失效的地方，是把「完成單位比例」直接當成「耗時比例」。若每個 compile unit 時長差異很大，40/66 不等於完成 61% 的時間；多階段 build 的階段比例未知時，論文把它降為弱訊號，只用末段標記作預取時機。這是進度設計的重要區分：訊號應保留其可信程度，不能為了給出單一百分比而假裝知道剩餘時間（Sections 2.2、3.2）。

## 技術機制：一條狀態側通道與快取控制

論文的 wrapper 位於 executor 和工具程序之間。主路徑把工具 bytes 原樣傳給 agent；另一條狀態路徑則把工具輸出和執行環境痕跡轉成同一種事件。事件包含 call ID、已完成工作、可選總量、階段與時間戳。輸出 parser 可讀百分比、計數器和 progress library；環境觀察則可數新增 object files、讀套件索引中的下載大小或取得測試 runner 的收集數量（Section 3.2、Figure 6）。

作者處理三層「沉默」：基礎設施環境變數把 tqdm 等 progress bar 關掉；agent 自己加上 `-q`、`tail`、redirect 或 pipeline 過濾輸出；工具本身需要正確開關才會列出進度。Wrapper 在不讓 agent 多看見資料的前提下重新開啟訊號、複製被過濾的完整 stream，或在需要時先 dry run 求總數。第三種情況是 agent 自己寫的腳本：作者在生成時要求加入 side-channel progress line，再比對原版與儀器版輸出和 exit status，並比較 benchmark 分數（Section 3.1、Appendix B）。

訊號可信度還有兩個處理。若 counter 超過宣告總量，wrapper 不把它硬截為 100%，而是撤回總量，退回無總數的計數，避免錯誤的完成警報。多階段工作若有過往階段時長比例，可以將各階段合併成加權進度；比例未知或不穩定時，只保留最後階段的 end marker，歸類為弱訊號。作者在 realistic call 上量到 wrapper 的牆鐘額外成本低於 1%（Section 3.2）。這些設計是保守地調低訊號品質，不是提供真實性證明。

Serving 端不需要重寫 scheduler。論文對 vLLM 增加以先前 response ID 指定 context 的幾個操作：`refresh` 將 resident blocks 移到 eviction queue 較安全的一端；`release` 讓它優先被移除但仍可尋址；`query` 回報 context 還有多少內容留在 GPU。操作在 scheduler steps 之間進行，不處理正被執行中的 block，也不讓錯誤往 serving loop 冒泡；沒有收到 hint 時，engine 保持原先行為（Appendix D）。Controller 持續讀取事件，在估計剩餘時間低於 keep threshold 時刷新；當估計移到門檻另一側則停止刷新。若有 DRAM，還會以 lead time 做載回。這讓報告進度影響快取保留、卸載與預取，而不是只呈現在 UI 上。

## 實驗如何讀：訊號準確度與端到端延遲是兩類證據

作者先盤點 mini-SWE-agent、OpenHands、Terminal-Bench 與 OpenTelemetry trace 等公開來源中的工具時間。依 Table 2，加入各種 instrumentation 後，強訊號覆蓋的工具時間在三組主要資料分別為 38.2%、50.6% 和 48.0%；再計入弱訊號後達 66.2%、59.2% 和 71.8%。這些比例按「工具執行時間」計算，不是可支援進度的呼叫比例。不可解析時間仍占約 12–18%，而哪類工具沉默會隨 corpus 改變；作者沒有證明這三個比例代表所有 agent 生產流量（Section 2.2、Table 2、Figure 4）。

預測品質測試在 KV cache 決策時點比較 progress stream 和四種已發表 predictor 的重作版本：Continuum 的依工具耗時分布、CacheWise 的名稱/參數群集、TokenCake 的近期平均，以及 InferCept 的工具剖析時長和 elapsed-time 規則。作者另加入 in-flight history estimator。於呼叫進度 50% 評估「誰應該被驅逐」時，progress stream 的中位 ETA 誤差約為呼叫時長五分之一，最佳歷史 predictor 約三分之一。到 90% 時，progress 的中位誤差低於 10%，最佳歷史 predictor 約 80%（Figure 7）。「總是快完成」的靜態估計器在 90% 看似準確，卻會在更早時幾乎每個檢查點都誤報，所以 ETA 誤差不能取代適時觸發率（Section 4.2）。

觸發測試把載回所需時間視為 recovery budget，檢查第一次觸發是否落在理想時間附近。以兩秒預算計，progress stream 在容許額外 lead 等於預算時，測試、build、script 的及時觸發率分別是 31%、15%、50%；半秒預算則分別為 21%、2%、50%。Build 步驟時間差異大，因此緊迫預算下較難抓準；每輪均勻的 instrumented scripts 表現較穩。若改用「早或晚都可，只要在預算範圍內」的雙側誤差，整體在兩秒、半秒預算下各有 61%、33% 落入容許範圍（Appendix C）。這說明訊號改善方向清楚，但精準回載時機仍受工作的單位均勻度與恢復成本影響。

作者也在同一台機器重播四種負載：閒置、全程競爭、三分之一處開始競爭，以及半途解除競爭。匹配環境的歷史 predictor 在特定條件尚可；混合不同負載的歷史在呼叫尾端會差一個數量級。Progress 使用執行中觀察到的速率，對負載改變較不依賴舊歷史。但 Appendix C 指出，若中途移除負載，基於整段平均的速率會帶著舊負載估計數十秒，直到新速率反映出來；windowed rate 約十秒內能恢復，代價是可能 overshoot（Section 4.3、Appendix C）。因此「環境變化時穩定」不能解讀成毫無適應延遲。

核心系統實驗使用作者重播的 agent sessions，在 4×H100 SXM 上測試純 GPU 記憶體與 GPU 加主機 DRAM 兩個配置，以 LRU 和知道每個精確返回時間的 oracle 為參照。純 HBM 時，錯留快取會擠掉別的 context，錯驅逐則讓本呼叫承擔重算，決策主要是排出保留順位。有 DRAM 時，移出 GPU 會複製到主機層，決策增加何時釋放、何時載回，並帶來 reload latency 和 DRAM traffic。Progress controller 的 threshold 和 hysteresis 規則也因此不同（Sections 5.1–5.2）。

在該設定的 Figure 9，進度訊號相對 LRU 將 p90 post-tool TTFT 降低 20.7%（HBM only）及 20.8%（HBM + DRAM），接近 oracle；DRAM 配置下二者載回量也約為 LRU 的三分之一。論文 abstract 的精確 headline 即為這兩個百分比。它們描述特定 replay cohort、改過的 vLLM、4 張 H100 與兩種 memory 配置的比較，不能外推成任何線上服務可降低兩成延遲。作者也報告依工具時長切片後，至少 10 秒的呼叫平均 post-tool TTFT 改善可達 34.2% 與 35.3%，這是平均值的條件切片，不是整體 p90（Figure 10）。

診斷結果指出短呼叫收益很小，因為多數短於一秒的呼叫不會引發驅逐；越長的呼叫，快取決策越有價值。某些一分鐘以上的呼叫中，作者方法只剩約四分之一改善，而 oracle 維持多數收益。把 oracle 真值只補到方法聽不到訊號的階段，可追回 oracle 效益的 63%；補在已有事件的階段則為 17%。這讓作者把後續主要瓶頸歸於訊號 coverage，而非已覆蓋區域的估計精度（Section 5.2）。歷史 predictors 的行為則是要麼缺少 hint 回退 LRU，要麼過度估短而幾乎保留所有 context；在純 GPU 記憶體下，後者 p90 可比 LRU 差最多四分之一，在 DRAM 配置則提前回載，reload volume 是本文方法的 8 至 13 倍（Section 5.2）。

訊號是否改變 agent 行為另以 SWE-bench Verified 的 100 題檢視。只加側通道時，solved 為 100 題基準的 paired difference −1；steps、tokens、tool time、wall time 的差異也未呈現顯著變化。Prompt agent 產生更完整訊號可把強訊號覆蓋提高到 33.3% tool time，但 completion tokens 平均增加 1,575，且 solved paired difference 為 −2。移除輸出靜音的更侵入版本沒有提高訊號比例，non-zero exit codes 增加 455，展示了 instrumentation 對工具行為可能造成的風險（Section 4.3、Table 4）。作者說「無可量測的 agent score 成本」應限於其測試與不確定區間，不能當作等價性定理。

## 當回報者會說謊：訊號要有預算與責任邊界

進度內容可能由租戶控制。惡意或錯誤腳本可以先宣稱 90% 完成，卻把重工作留到最後；工具回傳前，純對話紀錄不一定能揭露這種謊報。作者不讓任何單一 report 自動擁有控制權，而替每個 session 設兩本 credit ledger：一本文字上授權保留記憶體，一本授權承擔延遲風險。正確報告可累積 credit，engine 依訊號採取行動會消耗 credit，完成時若證明報告不準就扣回。某本 ledger 歸零後，該面向回到無訊號時的服務方式（Section 5.3）。

初步 lying simulation 中，謊報者持有的記憶體增加 6%，兩本 ledger 合計收回其中 5%。這是針對模擬中的策略與機制的結果，並不證明對抗者無法找到其他操弄手法，也沒有建立所有租戶策略下的公平性。作者提醒進度流會揭露租戶工作負載結構，應視為與工具輸出同等敏感的側通道；何者承擔錯誤決策成本則是政策選擇，不是技術機制自動解決的問題（Ethics Statement）。

## 證據地圖：論文支持到哪裡

| 作者主張 | 證據 | 可以支持的判讀與限制 |
| --- | --- | --- |
| 工具呼叫開始前的預測看不到目前執行條件 | 同一命令重播、不同負載下的耗時與順位比較（Section 2.1、Figure 3） | 支持呼叫時間會受環境影響；不代表所有工具都不可預測 |
| 工具 stack 中有可恢復進度，且強弱不同 | 四類 corpus census、各類工具計數和 end marker（Section 2.2、Table 2、Figures 4–5） | 支持特定 traces 下可讀的工具時間占多數；opaque calls 仍存在，樣本不是所有線上請求 |
| 獨立 side channel 可在不改 agent 輸入的情況下傳遞狀態 | Wrapper、輸出比對與 benchmark/control 組比較（Section 3、Table 4） | 支持被測 harness 的觀察保持和行為成本；每種新 instrumentation 仍需重新驗證 |
| 進度訊號能改善 KV 快取決策與 post-tool TTFT | 預測器比較與 4×H100 vLLM integration（Sections 4–5、Figures 7–10） | 支持限定 replay、engine 和記憶體設定中的結果；沒有生產流量或多供應商外部驗證 |
| 對不可信訊號可設計有限制的信用機制 | 將記憶體與延遲分帳的 preliminary simulation（Section 5.3） | 展示一種風險控制設計；不等於惡意訊號已被消除或政策公平已證明 |

## 限制、重現範圍與可取得資源

來源是 2026 年 9 月 16 日提交的 arXiv v1 預印本；目前引用只據該版本，不能推定經過同儕審查。arXiv 主記錄未連結論文專屬作者程式庫。第三方搜尋頁的「Request Code」也不是作者發布證據。沒有驗證到可下載的作者 trace bundle 或本文 vLLM patch；公開 agent 專案與 vLLM 本身只能作背景，不是這個系統的完整重現包。此狀態按 2026 年 10 月 13 日記錄。

論文交代了 event schema、wrapper 方式、engine hints 與 controller 邏輯，但重做 headline 結果仍需要對應 traces、parser 和預處理、精確的 workload mix、作者的 controller thresholds、serving patch，以及 4 張 H100 或經驗證的模擬器。文中報告的是作者實驗，本文沒有獨立重跑。較小的後續驗證可以先挑一個自有長時間工具，記錄可驗證的單調計數和完成事件，再在小型並發負載下比較固定 duration predictor 與工具進度，量測 GPU residency、reload volume 與 post-tool TTFT；但這只檢驗自家工具和控制器，不等於重現論文 benchmark。

可用工具也未必有價值，若「dry run」改變 cache、verbose 模式改變副作用、instrumented script 的輸出或 exit code 不同，則先不應把其訊號接進 serving 決策。對遠端 API、需人工確認、長時間無首位元組的下載，或只有工作開始/完成兩端事件的工具，控制器還需要其他估算或採取保守預設。

## Bloss0m 工程判斷：把進度事件當作有來源的控制提示

以下是 **Bloss0m 工程判斷**，不是論文驗證過的部署建議。若平台要採用類似介面，先定義進度事件代表哪個可觀察工作單位、總量如何取得、counter 何時可撤回、phase 是否可比較，以及 call ID 如何綁定單一請求。Serving controller 應把「有信號」和「信號可靠到足以行動」分開；至少保留強訊號、弱訊號、沒有訊號和撤回訊號幾種狀態，並在每次決策留下進度版本、採取的操作和實際完成時間，才能查出早載回、晚載回或錯誤保留。

從小範圍開始比把所有工具都包上 parser 更合理：先選輸出格式穩定、工作單位可數、instrumentation 可做輸出等價測試的本地工具；同時量測 agent 可見 stream、工具 side effects、exit status、cache bytes、DRAM traffic、TTFT 和吞吐。當負載改變時，估計器速率窗口也要有明確適應策略；論文的 windowed rate 較快追上變動，但可能 overshoot。對租戶可控的事件則要有配額、回退與稽核途徑，不把信用制當作「信號可信」的證明。

不宜直接採用此機制的場合包括：工具工作單位高度不均且無末段訊號；工具只能在結束時回應；多租戶環境無法把工作負載進度視為敏感資料；快取誤判的代價比省下的重算更高；或目前引擎缺少可安全刷新、釋放與查詢 context 的接口。本文提出的是可量測的 runtime contract 方向，真正的收益取決於進度 coverage、控制策略、cache layout 和負載形態。

## 讀完後的三個記憶點

1. **概念**：工具進度可能是 serving 控制面的輸入；它可以是帶總量的工作比例，也可以只是足以觸發預取的末段事件。
2. **證據**：作者在特定 4×H100 vLLM replay 中，相較 LRU 報告 HBM only 與 HBM + DRAM 的 p90 post-tool TTFT 分別下降 20.7% 和 20.8%；此結果與 wrapper coverage、實驗配置綁定。
3. **邊界**：訊號可能缺席、解析可能有干擾、回報者可能說謊，而且本文 artifacts 尚不足以獨立重跑；任何部署都需重新驗證行為保持、隱私和控制失誤成本。

## 延伸閱讀

- [Parsing the Stream：為 Agent 即時軌跡建立資料模型](/paper-reading/43-parsing-the-stream-live-trace/)：延伸理解如何把執行事件轉為可分析的結構化 trace。
- [When Tool Calls Succeed but Workflows Fail](/paper-reading/49-when-tool-calls-succeed-workflows-fail/)：工具呼叫成功與整體工作流完成之間的落差。
- [Predicting Partial Answer Quality and Utility in Agentic RAG](/paper-reading/53-agentic-rag-partial-answer-prediction/)：另一種以中途訊號支援 agent 執行中決策的研究。

## Primary sources

- Liu、Zhang、Li、Zhang， [Ask the Tool, Don’t Guess: Agent Tool Calls Hold Their Progress, and the Serving System Should Read It, arXiv v1](https://arxiv.org/html/2609.18849v1)，2026 年 9 月 16 日提交。本文的工具時間盤點、預測比較、vLLM 實驗與 lying simulation 均為作者報告，未獨立重跑。
- [arXiv 摘要與版本記錄](https://arxiv.org/abs/2609.18849v1)：包含 v1 日期及永久非專屬散布授權；該授權本身未明確授予本文重用論文圖片的權利。
