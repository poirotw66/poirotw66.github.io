---
title: "Closed-World Resolution 精讀：工具幻覺必須先於權限閘"
description: "精讀 Closed-World Resolution Against Tool Hallucination in LLM Agents，拆解工具不存在、參數不合 schema 與 MCP 多伺服器碰撞為何可能繞過一般權限閘，以及論文測量結果的適用邊界。"
pubDate: 2026-10-04
updatedDate: 2026-10-04
tldr:
  - "工具選擇回答要用哪個已知工具；權限閘回答這個工具此刻能不能用。兩者都假設呼叫已對應到真實工具與正確簽章。"
  - "作者在十個託管模型、兩種單一 registry 呼叫介面中觀察到 322 次工具幻覺；raw JSON 比 schema-enforced surface 更容易出現不存在的工具名稱。"
  - "MCP 合併多個伺服器後，碰撞與低信任工具 shadowing 成為結構性新風險；十模型 live 測試共記錄 154 次 M1–M3 幻覺。"
  - "閉世界解析可擋住可由 registry 和 signature 判定的錯誤，卻無法識別 schema 合法、但語意上選錯工具的呼叫。"
audience:
  - "建置 function-calling agents、MCP hosts 或工具執行閘的工程師"
  - "評估 Agent tool-use reliability 與安全控制的研究者"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Evaluation", "MCP"]
image: "/paperReading/85-closed-world-tool-resolution/title_image.webp"
field: "AI Agent"
difficulty: "intermediate"
showToc: true
topics:
  - agent-safety-governance
  - tool-use-coding-agents
paper:
  title: "Closed-World Resolution Against Tool Hallucination in LLM Agents"
  authors:
    - "Laxmipriya Ganesh Iyer"
  year: 2026
  venue: "arXiv cs.AI preprint v1, submitted 2026-09-16; peer-review status not established"
  links:
    pdf: "https://arxiv.org/pdf/2609.19425v1"
    arxiv: "https://arxiv.org/abs/2609.19425"
series:
  id: "agent-tool-resolution"
  title: "Agent 工具解析與執行安全"
  part: 1
  totalParts: 1
---

<!-- paper-reading-no-body-figures: 原論文頁面只記載 arXiv 對該文的 perpetual non-exclusive distribution license，未見作者授予第三方重用圖像的明確授權；因此本文不複製原圖，改以正文解讀並連結 Figure 1–4。 -->

## 90 秒地圖

- **問題**：工具選擇會決定模型偏好哪個工具，權限閘會限制真實工具的操作，但兩者通常假設呼叫名稱與參數已對應 registry 中存在的工具。若模型輸出不存在的名稱或 schema 沒有的欄位，gate 可能根本沒有可供查詢的 contract。
- **核心洞見**：在政策判斷之前，加一道閉世界解析：先確認工具在可信 registry 中，再以宣告的 signature 檢查參數。它的技術本身是普通的 membership 與型別驗證；論文主張的重點是此檢查必須放在 gate 前。
- **最強證據**：作者以十個 Amazon Bedrock hosted models 測兩種單一 registry invocation surfaces、每模型每 surface 60 個 probes，記錄 322 次真實模型輸出的 H1–H5 幻覺；另在十個模型的 raw-JSON MCP surface 記錄 154 次 M1–M3 事件（Sections VI–VII、Figures 2–4、Tables I–III）。
- **主要邊界**：失敗率是特定對抗提示、工具 registry、Bedrock 模型版本與小樣本測試的點估計；fail-open stack 執行 322/322 與 resolver 擋下 322/322 是威脅模型及演算法的推導結果，不是獨立量測到的線上事故率。

這篇研究的故事不是發現一種新型模型 jailbreak，而是指出工具安全架構漏了一個更前面的問題：policy gate 判斷「這個工具可不可以做」，但模型可能先編造了一個 registry 根本沒有的工具。若執行層遇到未識別呼叫仍 fail open，既有 gate 可能無法讀取不存在工具的風險標籤或授權條件。作者將一個簡單的 registry/signature resolver 放到 gate 之前，並將問題延伸到 MCP：多個 server 被攤平成單一 namespace 時，即使單一模型不會編造工具，名稱碰撞或低信任 server 冒名也會造成新的路由錯誤。

本文依據 2026-09-16 提交的 arXiv v1 cs.AI 預印本；截至本文日期，來源未建立同儕審查狀態。以下會區分模型實際輸出的量測、由設定直接推出的防禦結果，以及工程上的解讀。

## 既有方法的限制：工具選擇與授權閘的缺口

**工具選擇**：從已知工具中挑選對當前需求有幫助的一個或幾個。

**權限閘控（gating）**：依狀態、風險與授權決定某個已知工具呼叫是否可執行。

**合約完整性驗證**：確認工具描述或合約是否遭到竄改。這些工作各有價值，但它們的輸入前提不同：若 call name 不存在，gate 沒有該工具的合約、風險標籤或授權規則；若工具 signature 不含模型輸出的參數，僅驗證該工具合約的來源，也不會自動判斷多出來的參數是否合法（Introduction；Section II）。

論文將這個缺口稱為「demand-side」問題：防禦不只要整理哪些工具可供模型使用，還要檢查模型最後實際要求執行什麼。這一點不表示每種常見框架都必然 fail open。論文的形式化威脅模型明確假設 fail-open executor：防禦層未拒絕的呼叫就會執行；嚴格拒絕未知名稱的 executor 已經實作了某種退化版 closed-world resolver（Section II）。所以閱讀時應把結論當成架構條件句，而非對所有 runtime 的通用事故判定。

## 核心直覺：gate 前先問「它存在嗎？」

假設工具 registry 為有限集合 $R$。每個工具 $t$ 有一個 signature $\sigma(t)$，說明可接受的 key、必填欄位、型別、enum 或範圍。模型送來呼叫 $(n,\alpha)$，其中 $n$ 是名稱、$\alpha$ 是參數 map。closed-world resolver 只做三個檢查：$n$ 必須存在於 $R$；不接受未宣告的 key 或缺少的必填 key；每個值要符合對應型別與約束（Section IV、Algorithm 1）。

這不是語意正確性判斷。resolver 不會確認模型是否選了最適合任務的工具，也不會推論使用者真正意圖，更不保證 registry 本身寫得正確。它回答的是窄但必要的一個問題：這個請求是否能被忠實地指向 registry 裡的一個工具，且參數符合它宣告的介面？通過 resolver 之後，呼叫仍須交給 causal gate 判斷；若系統另有合約完整性驗證器或執行效果驗證，這些也各自處理不同問題。論文第二節把合約完整性驗證器描述為位於 registry 與 gate 之間，但第四節 Figure 1 的管線又將 contract verifier 列在 gate 之後；這是文內順序描述不一致，不能把它簡化成單一固定次序。作者對執行效果驗證的說法則清楚：它在 gate 通過後、動作執行後檢查效果。核心結果仍是 schema resolution 必須先於 gate。論文沒有提出用 resolver 取代後續授權政策。

## 端到端 worked example：用 `transfer_funds` 走一次呼叫

把使用者需求想成「支付已核對的帳款」，而模型需要呼叫一個收款工具。registry 裡有 `transfer_funds`，signature 要求 `recipient_id` 為 opaque id、`amount` 為限定範圍內的數值，並不含 `override` 欄位。

1. **模型發出呼叫**：`transfer_funds(recipient_id="acct-7", amount="all of it", override=true)`。名稱雖然存在，但值型別錯誤，而且多出未宣告欄位。
2. **先做 resolver 檢查**：`override` 不在 signature 中，因此按 H2 規則拒絕；若只看型別，字串 `all of it` 也會按 H3 拒絕。
3. **policy gate 不會接手無效呼叫**：它只針對已解析的工具與已知風險資料決策。這次拒絕發生在政策授權前，並未證明使用者本身是否有轉帳權。
4. **修正或停止**：上層可以請模型重試、要求澄清，或回報輸入格式不合法；這些復原行為不是論文測試的主要對象。
5. **失效邊界**：假如模型把合法的 `recipient_id`、合法數值傳給錯誤但同樣接受這些欄位的工具，單靠 schema resolver 看不到意圖錯配。這是 H5 的不可辨識殘餘，需靠選擇、上下文或語意層處理（Sections III–V）。

這個例子是按論文 Algorithm 1 重新表述的工程情境，不是論文實驗的逐字 trace。它刻意只展示可由 signature 判斷的錯誤，不應把型別檢查理解成可阻止每種錯誤或惡意操作。

## 論文的五類呼叫錯誤

作者以錯誤出現在執行堆疊哪一層作為分類主軸（Section III）。

| 類別 | 呼叫出了什麼問題 | 可由 resolver 判定嗎？ |
| --- | --- | --- |
| H1：不存在的工具 | 名稱不在 registry，例如 `wipe_disk` | 是，membership check 直接拒絕 |
| H2：幻覺參數 | 工具存在，但參數 key 未宣告或漏掉必填欄位 | 是，對照 signature |
| H3：型別違反 | key 存在，但值型別、enum 或範圍錯誤 | 是，對照 signature |
| H4：不在目前 causal frontier 的真工具 | 呼叫本身有效，但此狀態下 gate 沒有開放它 | 不是；這正是 gate 的工作 |
| H5：借用其他工具的參數形狀 | 名稱是工具 A，參數看起來像工具 B；如果也符合 A 的 signature，則 schema 無法分辨 | 僅能擋住不符合 A signature 的子集 |

分類的價值在於避免把所有不好的 tool call 都叫成一種「hallucination」。H1–H3 是名稱／schema 問題，H4 是因狀態或授權條件造成的 gate 問題，H5 的殘餘則是工具語意混淆。這些類別由不同控制面負責；把它們混成一個成功率，會掩蓋 resolver 與 gate 各自能保證什麼。

## 方法流程：為什麼 resolution 必須在 gate 之前

論文將因果 gate 抽象成只對 registry 內工具有定義的函式。gate 讀取對應工具的風險與授權資料，並依當前可見工具集合 $V$ 及系統狀態 $S$ 決策。對於 $n\notin R$ 的 H1，$R[n]$ 不存在，gate 無法取得相關 contract 欄位；在 fail-open 假設下，沒有明確拒絕的呼叫便可能送到 executor（Section V, Propositions 1–2）。

把 registry membership check 放到 gate 後面也不能修補這個順序問題：gate 已先被要求判斷一個它不認識的名稱；後面的合約驗證器也沒有可信合約可比。作者因此得到一個明確的順序結果：schema 可判定的幻覺防禦要早於 causal gate，而 runtime effect verification 若存在，則在授權 gate 與動作執行後檢查效果。須留意，論文第二節將合約完整性驗證器放在 registry 與 gate 之間，第四節圖示與文字卻把它排在 gate 後，兩處對此層位置互相矛盾；這不影響「先解析，再讓 gate 判斷」的主要論證，但不宜替作者消除矛盾。這些命題是依照定義與威脅模型推導出的形式化性質，並非複雜數學定理，更不是在各種產品 runtime 上完成的安全證明。

另一個重要前提是 registry 可信。resolver 與論文的分類器都讀同一份 $R$；錯誤的 signature、遭竄改的 registry 或未列入的合法工具，會使共同參照本身出錯。論文把這類來源完整性交給另一層 contract-verification 假設處理，不表示 membership check 單獨能驗證供應鏈（Section II、Proposition 3 後的說明）。

## 單一 registry 實驗：模型輸出與派生的執行結果

作者將十個模型放在 Amazon Bedrock Converse API 上測試：Claude Opus 4.8、Sonnet 4.6、Haiku 4.5、Nova Premier、Nova 2 Lite、GPT-OSS-120B、Llama-3.1-8B、Llama-3.1-70B、Ministral-3-8B 與 Mistral-Large-3（675B）。每模型每種介面有 60 個 probes，包含針對 H1–H5 的對抗提示、間接注入與含糊請求。模型可用的可見工具 subset 為 10 個，但 resolver 以 100-tool registry 判斷輸出（Section VI-A）。

作者比較兩種 invocation surfaces。**Schema-enforced API** 在模型生成階段提供工具與 JSON schema；**raw-JSON bridge** 則把工具目錄寫入提示，之後由外部 bridge 解析模型手寫 JSON。這不是完整對照的同一套產品，只是研究者選擇的兩種輸入／輸出約束方式。

結果方面，跨十個模型與兩種 surfaces 共記錄 322 次 H1–H5 genuine hallucinations。裸 JSON surface 的 H1 fabricated names 為 34 次，schema surface 為 3 次；這三次都來自兩個最弱的開放權重模型。raw-JSON 每個模型都至少出現一次幻覺，模型級 unconditional rates 約在 13%–57%。同時，Opus 與 Sonnet 在 schema surface 對抗 probes 的 no-call fractions 分別是 0.70、0.75；因此某些低 hallucination rate 反映大量拒絕不出手，不應直接解讀成「模型有呼叫時都能安全遵守」（Table I、Figure 2）。

作者還比較 Llama 8B/70B 與 Mistral 8B/675B，raw-JSON rate 分別約為 0.55/0.57 與 0.45/0.55。這些成對點估計沒有顯示參數規模必然消除工具幻覺；它們不代表整個模型家族的能力曲線，也沒有信賴區間或 seed variation。每模型每 surface 只有 60 個 probes，資料適合指出可能的失效模式，不能給出某個模型或產業 runtime 的穩定盛行率。

最容易過度引用的「322 遇到 gate-only 全部執行，完整 stack 一個都沒執行」需要拆成兩部分。322 是模型實際輸出的量測值；322/322 與 0/322 則是 fail-open executor、resolver 規則及已分類呼叫定義下的結果，論文清楚說明它們並非獨立測得的線上執行事故率。作者也區分 147 個真正的型別錯誤與 21 個可被 lenient bridge 強制轉型的數字字串，以免把序列化轉換誤算成相同型態的失敗（Section VI-A、Table I、Figure 2）。

## Controlled test：分類覆蓋與 H5 殘餘

真實模型較少自然觸發 H4 與 schema-valid H5，作者因而另用 scripted calls 對每類 H1–H5 各建立 400 個 deterministic trials，依序送入 no-defense、gate-only、gate 加 contract verification、resolver-only 與 full-stack。400 個 honest calls 的 over-rejection track 只是確認自建 generator 格式正確；由於合法呼叫在定義上必須通過 resolver，零 over-rejection 不構成獨立的真實流量 false-reject 率（Section VI-B、Table II、Figure 3）。

這組控制結果支持分類邊界：單獨 causal gate 可擋住 H4，卻依 fail-open 設定漏掉 H1–H3 與 H5；resolver 可擋住 H1–H3，但不會判斷合法格式的 H4；完整組合把 H1–H4 都歸零，H5 仍有 0.1525 attack-success。這個 H5 留存不是 resolver 的實作疏漏，而是定義所導致的不可辨識性：若呼叫對 A 的 signature 完全合法，僅看 registry 和欄位型別就沒有證據證明模型原本想呼叫 B。作者把它歸回 tool-selection problem，並指出「先 resolve 再 select」是待驗證的合理組合方向，而非本文已量測證實的效果（Proposition 4；Section VI-B）。

## MCP 延伸：多伺服器合併本身製造歧義

單一 registry 假設有一份權威工具表；MCP host 則常會連接多個 server，再把工具扁平合併到模型看見的 namespace。論文表示，原先的單一 registry 模型無法表達這種合併帶來的 server identity 與信任差異，因而定義第二組分類 M1–M5（Section VII）。

| 類別 | MCP 合併後的新問題 | 基本處理方向 |
| --- | --- | --- |
| M1：跨 server 誤造 | 沒有連線 server 提供該工具 | 查部署集合，沒有 provider 即拒絕 |
| M2：同信任層名稱碰撞 | 多個 server 宣告相同名稱，意圖不明 | 拒絕扁平名稱，要求指定 server |
| M3：shadowing／rug pull | 低信任 server 宣告高信任 server 同名工具 | 拒絕跨信任層重名，不猜測 provider |
| M4：過期定義 | listing 後 schema 改變 | 比較當前 schema 與 listing digest |
| M5：跨 server 簽章借用 | 使用另一 server 工具的 argument shape | 對選定的 `(server, tool)` 再做 signature check |

MCP resolver 需要把呼叫解析為合格的 `(S_i, t)`，而不只是扁平工具名稱。唯一 provider 可形成候選；無 provider 直接拒絕；多 provider 則按信任層分出 shadow 與同層歧義；接著比對 listing digest，最後才檢查參數（Section VII-C、Algorithm 2）。此設計假設 host 確實掌握每個 server 的身分、信任層、schema 更新和 digest。它不是對每種 MCP 實作均可直接套用的標準設定。

在作者四 server 的 synthetic benchmark 裡，每類 M1–M5 各 400 trials。naive host 的 1.00 與 resolver 的 0.00 是由它們設定的 first-provider/fail-open policy 與 resolver 規則直接決定，不是從 production hosts 收集的自然事故比例。live MCP 測試則把合併目錄交給十個 Bedrock models，觀察到 154 次 M1–M3 事件：62 次 shadowing、52 次 collision、40 次 cross-server fabrication。Opus 4.8 在單一 schema-enforced registry test 沒有幻覺，卻在此 MCP surface 得到 0.57 rate。論文主張這顯示 merge topology 可引入與模型參數規模無關的新失效面；但 live MCP 仍是特定 synthetic/real-shaped server manifests、對抗提示與同一測試設計，不是跨部署事故統計（Section VII-D、Table III、Figure 4）。

作者也量到安全政策的使用性成本。嚴格拒絕所有多 provider flat calls 時，誠實呼叫若碰上同信任層重名，會有 1.00 over-rejection；server-pinned 或唯一 provider calls 則是 0.00。pin-assisted 版本可在同信任碰撞時自動選 provider，保留跨信任 shadow 的拒絕，但同層相同名稱仍可能指向行為不同的工具。因此 pinning 是一個權衡，不是能保證語意正確的銀彈（Sections VII-D、Table III）。

## 證據地圖：形式推論、live emissions、scripted tests

| 證據層 | 直接觀察／論文主張 | 合理解讀 | 不能據此推論 |
| --- | --- | --- | --- |
| 結構形式化（Section V） | 在 trusted registry + fail-open assumptions 下，gate 對 unknown names 沒有 contract 可讀；前置 resolver 能對 H1–H3 做 closed-world 拒絕 | 防禦放置順序是明確的系統設計性質 | 所有 runtime 都 fail-open；這就是已完成的產品安全證明 |
| 單一 registry live 模型輸出（Section VI-A） | 10 models × 2 surfaces；322 emissions，raw JSON 中 H1=34、schema surface H1=3 | 呼叫介面約束與 refusal 行為會影響可觀測錯誤形態 | 每個模型在真實流量中有相同長期 hallucination rate |
| Controlled class tests（Section VI-B） | scripted H1–H5 及 honest calls 經五種 pipeline 比較 | 清楚測出各 gate/resolver 組合的邏輯覆蓋與 H5 殘餘 | synthetic trial 頻率等於 production prevalence；自建 honest generator 證明無 false reject |
| MCP live + synthetic（Section VII） | live 154 個 M1–M3 emissions；synthetic 用例覆蓋 M1–M5 | 多 server 扁平合併值得明確表示 provider 和信任層 | 所有 MCP hosts 都會以相同 first-provider/fail-open 行為路由 |
| HTB leaderboard（Section VIII） | 作者對 visible split 報告工具解析方法與多種 baselines 分數 | 可比較不同 resolver 的設計方向 | 尚未由獨立團隊重跑或驗證的排行榜具有外部效度 |

Figure 2 和 Table I 的模型對照要同時看 unconditional rate、conditional rate 與 no-call fraction；不把拒答視為失敗或成功都會造成偏差。Figure 3 的控制結果則不能和 live emissions 混作同一種 evidence：前者是刻意生成類別和 policy outcome 的 deterministic probe，後者是模型受提示後實際輸出的分類。Figure 4 同樣把 scripted MCP class coverage 和 live 事件放在一張圖，但論文 caption 明確指出 synthetic 1.00/0.00 是 by-construction outcome。

## HTB 與可重現性：作者宣稱釋出，讀者仍需確認 artifact

論文 Section VIII 稱 Hallucinated-Tools Benchmark（HTB）為版本化、deterministic、可安裝套件，命令是 `pip install toolguard` 與 `toolguard-bench`；它包含 H1–H5、M1–M5、external baselines、real-shaped catalog adapters 及不隨公開 package 提供的 held-out split。文章公開頁面沒有連到作者 GitHub 或專案 repo，也沒有提供資料檔的獨立下載位置。本文查閱時，PyPI index 對 `toolguard` 回報沒有符合版本；因此「論文描述了 benchmark」不等於已能取得套件或 held-out data。可用狀態截至 2026-10-04，後續應以作者明確連結的 release 為準。

論文稱其將分類後的模型 call transcripts 隨 paper commit，讓讀者核對每次分類；但原始 provider response envelopes 未公開，從頭重算 live model rates 仍需 Bedrock 存取和重新發出 probes。Controlled trials 被稱為 seeded、offline、deterministic，但沒有可供本文驗證的套件入口。研究數字在本文均是作者報告；沒有獨立重跑，也沒有外部團隊的 HTB score。讀者若要重現，先找到版本化 package、transcripts、registry、held-out split 規格、Bedrock model IDs 與 probe seed，再分清可重分析與需重跑模型的部分。

## 主要限制與可能的替代解釋

1. **外部效度窄**：單一 registry 使用固定 100-tool synthetic registry，MCP 用四個 server 的測試部署。live 模型是真實 hosted API 輸出，但每 surface 每模型只有 60 個 probes；無信賴區間或 seed variation，無法估計穩定長期發生率（Section X）。
2. **執行結果大多是條件推導**：fail-open gate 執行 322/322 與 resolver 執行 0/322 是 threat model 加上 resolver 定義導出的結果。這有助於說清楚架構性質，不是測得模型真的對線上系統成功造成 322 次副作用。
3. **honest false-reject 證據自我參照**：作者的 well-formed call 定義與 generator 都依 resolver 所用 schema 建立，所以 0.00 over-rejection 是 construction-consistency check。作者自己指出，仍需對獨立 honest-call corpus 或 live honest emissions 量真正 false-reject rate（Section X）。
4. **H5 解法尚未完成測試**：論文將 schema-valid 借用歸為 selection 誤差，但沒有把真正的 tool-selection layer 接在 resolver 後測試它是否縮小 residue。0.1525 是該 synthetic borrowed-signature construction 的 sample estimate，不能直接套用真實工具目錄。
5. **工具清單需要可信**：wrong/missing schema、registry update race、server trust labeling error 等，會破壞 resolver 用來判斷的參照。MCP digest check 涉及 listing freshness，但信任根、如何安全維護權限層級仍是部署責任，不能只靠這篇的演算法文字解決。
6. **拒絕與消歧要納入產品流程**：嚴格拒絕碰撞工具會造成使用性損失；pin-assisted 又保留語意不確定性。系統還要有明確的錯誤回饋、重試上限、人工確認與 fail-closed 行為，本文沒有評估這些端到端 workflow。
7. **模型和 API 時態性**：實驗列出 2026 年的特定模型名稱，工具呼叫 API、模型版本、拒答策略與 Bedrock 可用性會變動。後續重現必須鎖定實際 model version 和請求設定，不應把結果歸因成永久模型特性。

## Bloss0m 工程判斷：把解析錯誤和授權判斷分成兩道門

> **花花的工程提醒**
>
> Schema 通過只代表呼叫格式吻合登記介面，不代表這次動作已獲授權，也不代表模型挑對了工具。

以下是 **Bloss0m 工程化整理**，不是作者量測過的端到端部署配方。可把工具呼叫交付執行器前拆成兩個責任邊界：

1. **解析／驗證輸入**：在可信且版本化的 registry 中解析工具 identity，驗證所有欄位、必填值與型別；未知或含糊名稱採拒絕或要求 server pin，不進 executor。
2. **授權／判斷狀態**：只有解析完成的合法 call，才由 risk/policy gate 依使用者權限、當前狀態、工具效果和因果 frontier 評估。
3. **執行與結果驗證**：授權之後記錄最終綁定的工具 identity、signature version、policy decision 與執行結果；若 registry 或 server schema 變更，需重新解析，而不是沿用舊 listing。
4. **保留語意選擇**：在可觀測到的 tool identity 與 signature 之外，另評估「為何這個工具適合這個意圖」；resolver 不能代替工具選擇或使用者確認。

這套分工適合工具呼叫可被安全攔截、registry 能作為權威來源且未知名稱不會被靜默路由的系統。若 API 原生已強制 exact tool membership、unknown args fail closed，前置層仍需確認和 API 的解析語意一致，避免重複檢查造成 drift。對非決定性 schema、動態 server discovery、工具效果會在授權後改變或多 provider 的情境，需要明確的 pinning、versioning 和 TOCTOU 策略；單純的 JSON schema validator 不會涵蓋這些問題。

## 讀完後的三個記憶點

1. **技術概念**：工具選擇、權限 gate 和 registry/signature resolution 是不同責任；H1–H3 需要在 gate 前解析，H4 留給 gate，schema-valid H5 仍是語意選擇問題。
2. **證據解讀**：322 與 154 是作者測到的模型輸出分類數；以 fail-open 為前提的執行／阻擋比率，以及 scripted benchmark 中的固定結果，不能都報成生產事故量測。
3. **採用邊界**：可信 registry、MCP server identity、schema freshness 和明確拒絕行為是 resolver 成立條件；本文既未展示外部 benchmark 重跑，也未解決合法格式下的工具意圖混淆。

## 延伸閱讀

- [Who Holds the Pen? Let Specifications, Not Agents, Sign Off](/paper-reading/76-specifications-not-agents-sign-off/)：從執行授權延伸到任務狀態與完成驗收由誰掌握。
- [LLM Agents Can Easily Tamper With Their Own Traces](/paper-reading/77-llm-agents-can-easily-tamper-with-their-own-traces/)：比較 agent 可觸及的執行紀錄與可信觀測邊界。
- [Agent Skills version-specific plugin migration study](/paper-reading/75-agent-skills-version-specific-plugin-migration/)：閱讀工具／指令介面如何影響 coding agent 的任務表現。

## Primary sources

- Iyer, L. G. (2026). [Closed-World Resolution Against Tool Hallucination in LLM Agents, arXiv v1](https://arxiv.org/abs/2609.19425)；[HTML 全文與 Figures 1–4](https://arxiv.org/html/2609.19425v1)。
- [arXiv perpetual non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html)（該授權說明 arXiv 的散布權；本文未將其解讀為作者授予第三方複製原圖的許可）。
