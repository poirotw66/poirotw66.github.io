---
title: "派對之後：病毒式 Agent Skill 生態留下的治理與安全掃描難題"
description: "深讀 After the Party 的 OpenClaw／ClawHub 生態研究：從 91 天的爆發式成長、下載集中與 reviewability gap，到 privilege evidence、掃描器分歧與可轉移的治理方法。"
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "這篇研究把 OpenClaw／ClawHub 的生態拆成成長、可觀測治理訊號、權限證據與安全掃描四個問題；它沒有把快速成長直接等同於不安全。"
  - "91.11 天內，研究重建的 skill stock 從 33,399 增至 65,175；總下載量高度集中，前 10% 取得 46.93%，但熱門不等於可授權。"
  - "77.86% 的 skill 沒有 stars 或 comments；64,324 個可評估項目中，85.06% 至少出現一項 privilege evidence，且三個 scanner 的旗標高度不一致。"
  - "最可帶進工程現場的結論是分層治理：provenance 與版本、artifact review、host policy、runtime telemetry 必須分開；Zenodo DOI 截至 2026-09-17 無法由端點取得。"
audience:
  - "負責 Agent skill registry、工具供應鏈、權限治理或 AI 平台風險的工程師"
  - "需要把下載、review、scanner 與 runtime policy 接成可追溯控制面的研究與平台團隊"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Agent Evaluation", "Governance", "Tool Use"]
image: "/paperReading/52-after-party-agent-skill-ecosystem/title_image.webp"
field: "AI Safety"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
  - tool-use-coding-agents
paper:
  title: "After the Party: Governing What a Viral Agent-Skill Ecosystem Left Behind"
  authors:
    - "Yunpeng Xiong"
    - "Ting Zhang"
  year: 2026
  venue: "arXiv 2609.17274 v1（2026-09-15；APSEC 2026 accepted version，尚未 camera-ready）"
  links:
    pdf: "https://arxiv.org/pdf/2609.17274v1"
    arxiv: "https://arxiv.org/abs/2609.17274"
    doi: "https://doi.org/10.48550/arXiv.2609.17274"
    project: "https://arxiv.org/html/2609.17274v1"
series:
  id: "agent-skill-ecosystem-governance"
  title: "Agent Skill 生態治理"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文

- **研究問題**：當一個 agent-skill registry 在幾個月內快速擴張，下載量、stars、版本、留言、宣告的 capability 與實際可執行權限，哪些訊號還能支持治理決策？研究者以 OpenClaw 與 ClawHub 為案例，追蹤成長、關聯可攜性、reviewability 與 scanner agreement。
- **核心洞見**：skill 不是只存在於文字內容裡。相同的 SKILL.md 或 package，在不同 host、tool visibility、execution context 與 policy 下，可能暴露完全不同的 privilege surface；registry metadata 也不能把 popularity、reviewability、static evidence 與 runtime behavior 合成一個信任分數。
- **最強證據**：RQ1 重建 91.11 天的 stock 由 33,399 增到 65,175；前 10% 取得 46.93% downloads，Gini 為 0.528。RQ3 顯示 85.06% 的可評估 skill 至少有一項 privilege evidence；RQ4 的三個 scanner 只在 446 個項目上同時 flag，且人工 reference set 中 LLM scanner 的 sensitivity 61.06%、static scanner 為 21.67%。
- **主要邊界**：這不是所有 registry 的 insecurity prevalence，也不是三個 scanner 的通用 benchmark。資料是單一生態、特定 snapshot、部分歷史資料重建；withdrawn data、缺失欄位與沒有 perfect ground truth，都會改變可解釋範圍。

我的 bounded verdict 是：**這篇 paper 最值得帶走的不是某個 scanner 的排名，而是把「發現可信」與「允許執行」拆成不同控制面。** 熱門可以幫助 discovery，卻不能授權；metadata 可以標示未知，卻不能替 runtime policy 背書；scanner flag 可以安排 review，卻不能單獨宣判 maliciousness。

> **花花的工程提醒**
>
> 把 skill registry 想成一個供應鏈入口，而不是一個 app store。每一次安裝都要能回答來源、版本、publisher、capability、review state、host policy、runtime telemetry 與撤銷條件；缺任何一項，就把狀態留在 unknown，而不是自動補成 safe。

## 版本、來源與讀者問題

本文讀的是 [After the Party: Governing What a Viral Agent-Skill Ecosystem Left Behind](https://arxiv.org/abs/2609.17274) 的 v1，arXiv v1 於 2026-09-15 提交，作者為 Yunpeng Xiong 與 Ting Zhang；論文頁面同時標示 APSEC 2026 accepted version。2026-09-16 的 arXiv record 已有 v2，標題也改成較寬的 “Growth, Governance, and Security Scanning in the OpenClaw Agent Skill Ecosystem”。為了遵守本次 Paper Radar brief 的 sourceVersion，我全文核對的是 [v1 full HTML](https://arxiv.org/html/2609.17274v1)、[v1 PDF](https://arxiv.org/pdf/2609.17274v1)、全部 figures、tables、appendices、limitations 與資料可用性說明；下面的數字不混入 v2 的新版本敘述。

這篇讀法對應的問題是：**當 registry 從小型社群變成高流量供應鏈，我們應該把哪些 observable signals 留在治理 contract 裡，哪些訊號只能當作 discovery hint？** 這個問題可以接在 [Tool Calls 為何會讓 workflow 失敗](/paper-reading/49-tool-calls-workflows-fail/)、[Continuity Security 的 context contract](/paper-reading/45-continuity-security-context-contracts/) 與 [Plan Injection 的 observer blind spot](/paper-reading/51-plan-injection-cot-monitoring/) 後面讀：它把 context、tool boundary 與 supply-chain provenance 放進同一個治理問題，但沒有假裝它們是同一個 metric。

## 證據地圖：Paper、Evidence 與 Bloss0m judgment

| 層次 | 本文採用的說法 |
| --- | --- |
| **論文直接支持** | 三個 snapshot、OpenClaw Git history 與 GitHub issue／PR、33,399 → 65,175 的 stock 成長、下載集中、RQ2 的 cohort／age 關聯、RQ3 的 privilege dimensions、RQ4 的 scanner coverage／overlap／reference sample 與 bootstrap intervals。 |
| **作者主張** | hypergrowth 會增加治理負擔，但不等於已證明 insecurity；feedback scarcity 與 privilege visibility 形成 reviewability gap；scanner disagreement 代表需要 layered governance，而不是單一 gate。 |
| **作者尚未證明** | 哪些 skill 在 runtime 真的造成 harm、熱門 skill 的真實 maliciousness rate、scanner 是否能在其他 registry 或其他 host transfer、任何一個 scanner 是否能取代 human adjudication。 |
| **我的工程推論** | 把 registry 信任拆成 discovery、provenance、artifact review、host policy、runtime telemetry 五個狀態；把 unknown、withdrawn、not evaluated、flagged for review 與 allowed 分開儲存。 |

### Paper Essence Contract

1. **它解決什麼問題？** 它用 OpenClaw／ClawHub 的可觀測資料，問一個病毒式 skill 生態在成長、reviewability、privilege evidence 與 scanner coverage 上留下什麼治理負擔。
2. **為什麼既有訊號不夠？** 下載量與 stars 是偏斜且容易隨 cohort 變動的 attention signal；SKILL.md 的宣告不能直接描述 host policy 與實際 runtime effect；scanner 的輸出也沒有天然的 perfect ground truth。
3. **核心技術想法是什麼？** 以 stable skill ID 建立多 snapshot corpus，分別測 growth、cohort／age transportability、可觀測 feedback 與 privilege features，再將 scanner statuses 正規化並以人工 adjudication 的小型 reference set 校準。
4. **一個項目如何走過研究流程？** registry crawl → stable ID 與版本／下載／feedback normalization → Git／issue／PR context → privilege regex evidence 與 unknown state → 三個 scanner status → coverage／overlap → stratified sample 與兩位 annotator adjudication → bounded interpretation。
5. **什麼證據支撐 headline claim？** Figure 2 的 growth／stock／download concentration、Section 4.2 的 RQ2 association table、Figure 4 的 accountability／privilege evidence、Figure 5 的 scanner overlap 與 Tables 3–5 的統計結果共同支撐，而不是任何一個單點數字。
6. **claim 在哪裡停止？** paper 量到的是 public artifact surface 與研究者定義的 static evidence，不是 agent 執行時的完整行為；它提供 measurement protocol 的轉移方向，不提供原始 rates 的跨平台承諾。

## 核心直覺：一個 skill 有三層，不是一段文字

研究最重要的 conceptual move 是把 skill 拆成三層。第一層是 **declared artifact content**：README、SKILL.md、scripts、package files 與 metadata 寫了什麼。第二層是 **host policy 與 tool visibility**：agent runtime 允許哪些 tools、shell、network、filesystem、credentials，以及 host 是否在呼叫前做 approval、sandbox 或 deny。第三層是 **actual invocation 與 runtime effects**：skill 真的被呼叫了什麼、把哪些 bytes 送到哪裡、建立了哪些副作用、是否被 log 或 rollback。

這三層不能互相代換。Skill A 與 Skill B 可能有相同的指令文字，但 A 在 read-only sandbox 中只能列出檔案，B 在有 shell、network 與 cloud credential 的 host 中可以寫入外部系統。反過來，一個 artifact 內含 network script，也不代表每個 host 都會執行它；static evidence 是 capability signal，不是 runtime observation。這個分解也說明為什麼 paper 把 present、absent、unknown 分開：缺少 SKILL.md、invalid UTF-8、malformed frontmatter 或 withdrawn source 時，研究者不能把「沒有看到」當成「不存在」。

研究者因此沒有建立一個單一 trust score。RQ2 量 popularity、stars、versions、files、scripts 與 age；RQ3 量 12 個 privilege dimensions；RQ4 再把 LLM、static 與 VirusTotal 的結果獨立處理。這種拆法對工程很重要，因為每個訊號的 owner、更新頻率、false positive、撤銷流程與可補救性都不同。

## 逐步例子：從一次安裝請求看出治理缺口

下面是一個忠於論文三層模型的 composite walkthrough，不是 dataset 裡某一列，也不代表 paper 對該 skill 做了 runtime experiment。假設團隊要安裝一個「整理 incident timeline」的 skill：

1. **Discovery**：registry 顯示它有很多 downloads、數個 versions，但 stars 與 comments 都是空的。這只能說它被注意到，不能說它被 review。
2. **Provenance**：平台鎖定 publisher、skill ID、latest version、content hash 與 crawl time；若 latestVersion 欄位缺失，就標示 unknown，不用舊版本冒充最新版本。
3. **Artifact review**：解析 SKILL.md、scripts、file count、network access、shell invocation、destructive command 與 secret references。靜態結果指出可能 privilege，不宣稱已發生 effect。
4. **Host policy**：同一 artifact 在 staging host 只開 read-only retrieval，在 production host 還有 ticket API、shell 與 outbound network。兩個 host 的 allow decision 必須不同，且寫入權限不能由 popularity 推導。
5. **Runtime telemetry**：agent 呼叫 skill 後，記錄 tool name、input hash、credential scope、destination、effect result 與 policy decision。若只取得 tool response，卻不能確認外部 side effect，結果要是 unknown。
6. **Scanner triage**：LLM scanner、static scanner 與 VirusTotal 的 flags 分開保存。任一 flag 只把項目送進 review queue；若多個 scanner 沒有 flag，也不能把缺少 coverage 當成 clean。
7. **Revocation**：publisher、version、hash、host policy 或 runtime incident 任一項被撤銷時，已安裝副本要能反查、隔離、回滾；不能只從 registry 刪掉 listing 就假設所有 cache 消失。

這個例子把「熱門」與「可執行」之間的空隙展示出來：下載數屬於 discovery signal，content review 屬於 artifact evidence，host policy 屬於 execution authorization，runtime telemetry 才接近 effect observation。paper 的結果支持把它們分層，而不是支持任何特定產品必須採用這七步。

## 既有方法為什麼不夠：三個 snapshot、四個研究問題

### 資料與研究邊界

研究者從 OpenClaw 的 Git head、GitHub issues／pull requests 與 ClawHub registry 建立 corpus。Git head 截至 2026-07-15 有 68,858 commits；GitHub 編號範圍約 96,000，研究者取得 94,248 個 issue／PR records，其中 1,752 個無法存取。registry crawl 的主要 June snapshot 是 2026-06-22 的 65,175 個 skills，另有 2026-07-14 的 68,096 作為觀察 context；RQ1 的早期 stock 以 2026-03-20 重建，研究窗從 2026-03-20 到 2026-06-19，最後部分時間右設限。

研究單位是 stable skill ID，不是每一次 listing event。作者把 downloaded count、stars、comments、latest version、versions、file count、scripts 與 age 正規化，並把缺失 metadata 留在 missingness 分析中。這裡的 benchmark 不是 downstream QA，而是 registry-level measurement：dataset 是 public registry／Git history／issue corpus；metrics 是 stock、downloads、Gini、Spearman、odds ratio、rank-biserial effect、coverage、precision、sensitivity、specificity 與 95% bootstrap intervals；compute 與 annotator context 則在方法與 threats 中交代，不應被誤讀成大規模 production test。

### RQ1：生態怎麼長，注意力怎麼集中？

![Figure 2：OpenClaw／ClawHub 生態成長、stock 與下載集中](/paperReading/52-after-party-agent-skill-ecosystem/paper/figure-2-ecosystem.svg)

*圖 2（原論文 Section 4.1，RQ1）：作者把 commit、issue／PR activity、skill stock 與 downloads 放在同一個 growth view；最值得注意的是 stock 上升與 attention concentration 同時發生。[原始圖與 caption](https://arxiv.org/html/2609.17274v1#S4.F2)。授權狀態：原論文頁面標示 CC BY 4.0；此處使用作者原圖，未改動內容。*

Figure 2 所對應的結果是「成長很快，但不是均勻長大」。12 月每日新增 commit 約 2,151，3 月出現 16,832 peak，6 月回落到 7,124；issues 與 PRs 在 3 月的 peak 分別為 11,211 與 16,859。重建的 stock 在 91.11 天由 33,399 增至 65,175，增加 95.14%；March／April 新增量為 41,223，佔研究窗累計的 63.25%。這是 activity burst 與 stock growth 的描述，不等於每一個新 artifact 都低品質。

下載分布則更偏斜：研究 corpus 的總 downloads 為 62,342,228，median 是 515；前 1% 取得 21.36%，前 10% 取得 46.93%，底下 50% 只有 18.79%，Gini 為 0.528。這個結果對 registry UX 的含義是，少數 artifact 會成為大多數使用者接觸到的入口，但 visibility 會放大檢查負擔：top downloaded skill 一旦 provenance、version pin 或 capability metadata 不完整，影響面不只是一個 repository。

### RQ2：association 能不能跨 cohort 與 age？

RQ2 沒有把「高下載」直接解讀成「高品質」。研究者先在 June full cohort 65,175 個 skill 上計算 seven signals：log downloads、stars present、multiple versions、version depth、file count、scripts present 與 script count；再與 pre-cutoff cohort 31,031 個 skill、cohort／age-adjusted model 比較。June 的 visibility 約為 63,574／65,175，也就是 97.54%；pre-cutoff 的 visibility 為 30,566／31,031，即 98.50%。這代表缺失並非主體，但 321 筆 missing latestVersion 仍可能與 outcome 差異有關。

![Figure 3：三個 cohort 中 baseline association 的方向與可攜性](/paperReading/52-after-party-agent-skill-ecosystem/paper/figure-3-transportability.svg)

*圖 3（原論文 Section 4.2，RQ2）：把 March discovery、June full cohort 與 pre-cutoff cohort 的 association 放在同一張圖比較；讀者應注意 effect direction、magnitude 與 age-adjusted odds ratio 並不穩定。[原始圖與 caption](https://arxiv.org/html/2609.17274v1#S4.F3)。授權狀態：原論文頁面標示 CC BY 4.0；此處使用作者原圖，未改動內容。*

Full cohort 中七個 sign 有六個方向重現，但只有三個達到顯著；downloads 的 association 從負到正落在約 −0.19 到 +0.20，且 Spearman ranking 約為 −0.61，顯示排序並不穩定。把 age 標準化後，只有 has-scripts 的 odds ratio 約 1.14（95% CI 1.08–1.20）保持正向，而 downloads 約 0.81（0.76–0.87）。pre-cutoff 的七個 association 則全數為負，downloads 約 0.47、stars 約 0.72；沒有任何一個七訊號組合在這個切法下保持 7/7。

這一節的工程重點不是選一個更好的 popularity feature，而是承認 transportability failure。不同 cohort 的 skill age、listing policy、withdrawn data、平台功能與使用者行為會改變關聯。若把某個 snapshot 的 correlation 寫成 admission rule，下一個 cohort 可能得到相反決策。

### RQ3：可問責與 privilege evidence 是否同時存在？

![Figure 4：accountability signal 與 privilege evidence 的可觀測缺口](/paperReading/52-after-party-agent-skill-ecosystem/paper/figure-4-reviewability-gap.svg)

*圖 4（原論文 Section 4.3，RQ3）：左側呈現 owner、auto status、version 等 accountability evidence，右側對照 12 個 privilege dimensions；圖的重點是 metadata 可見性與 capability evidence 並不等於完整 review。[原始圖與 caption](https://arxiv.org/html/2609.17274v1#S4.F4)。授權狀態：原論文頁面標示 CC BY 4.0；此處使用作者原圖，未改動內容。*

RQ3 的 June snapshot 有 65,175 個 skill；其中 64,324 個可評估，851 個因所有欄位都 unknown 而被排除。owner evidence 約 99.82%，auto status 99.51%，multiple versions 41.32%，moderation 35.19%，comments 只有 1.72%。最醒目的 reviewability 結果是 77.86% 沒有 stars 或 comments；在 97.79% 的治理狀態中，使用者 feedback 沒有形成可見紀錄，只有 1.71% 被歸類為 complete record。

Privilege evidence 以 present／absent／unknown 表示，不等於作者宣告的 YAML key。由 regex 從 153,536／153,986 個 present results 抓到的 evidence，顯示至少一項 privilege 的 skill 佔 85.06%；至少四項佔 25.25%；平均 2.39、median 2。shell 約 58.08%，network 約 57.06%，destructive 約 1.61%。這些比例描述 artifact surface 的可觀測 evidence，不是 runtime invocation rate。

feedback 與 privilege 的交叉更能呈現 reviewability gap：zero-feedback 且可評估的項目中，42,160 個有 privilege evidence，佔 84.34%。有 commenter 的 skill 平均 privilege dimension 是 2.92；沒有 feedback 的 group 是 2.32；至少四項的比例則為 36.46% 對 23.46%。這裡不能推論「有留言就安全」，只能說 review input 與 capability evidence 並沒有均勻覆蓋。

### RQ4：三個 scanner 看見的是同一個世界嗎？

![Figure 5：LLM、static 與 VirusTotal scanner flags 的重疊與差異](/paperReading/52-after-party-agent-skill-ecosystem/paper/figure-5-scanner-overlap.svg)

*圖 5（原論文 Section 4.4，RQ4）：三個 scanner 的 coverage、共同 flag 與各自獨有 flag，讓「沒有共同警告」和「已被證明 clean」之間的差距可視化。[原始圖與 caption](https://arxiv.org/html/2609.17274v1#S4.F5)。授權狀態：原論文頁面標示 CC BY 4.0；此處使用作者原圖，未改動內容。*

作者先把 scanner status 正規化，再分析 coverage。LLM、static、VirusTotal 各自覆蓋約 99.42%、97.80%、97.19%；三者共同有結果的 61,990 個，佔 95.11%，另有 3,185 個 missing／indeterminate。共同 flag 至少一個的為 24,148，三個全 flag 只有 446；LLM-only 旗標有 15,874。這不是單純的工具競賽，而是表示每個 scanner 的 visibility、rule vocabulary 與判斷 unit 不同。

作者從 eligible pool 276 個項目做 stratified sample，seed 42，抽出 180 個（80 flagged、100 clean）。兩位 annotator 有 7 年與 5 年經驗，先各自判斷，再 adjudicate 成 69 個 flag 與 111 個 do_not_flag。這個 reference label 的 flag 含義比 maliciousness 更寬，包含 suspicious、privilege、prompt injection 或需要 review 的 evidence，所以不應把 precision 叫成「惡意偵測準確率」。

以這個小型 reference set 與 bootstrap intervals 為界，LLM scanner 的 sensitivity 為 61.06%、specificity 81.28%、precision 67.40%；static 是 sensitivity 21.67%、specificity 95.38%、precision 74.84%；VirusTotal 是 sensitivity 25.11%、specificity 84.54%、precision 50.74%。這些數字支持「coverage 與錯誤型態不同」；它們不支持任一 scanner 在 production 取代 human review，也沒有提供 LLM 與 static precision 的統計排名結論。

## 實驗證據怎麼讀：數字、缺失與不確定性

### 可比性不是自動存在

RQ2 的 cohort、age、missingness 與 BH correction 必須一起看。若只挑 full June 的正向 association，會忽略 pre-cutoff 全部負向的結果；若把缺少 latestVersion 的項目直接刪除，也會把 outcome-differential missingness 隱藏起來。研究者用 Mann–Whitney、rank-biserial effect、Spearman 與 odds ratio 表達不同層次的關聯，這不是一個可以被單一 correlation 替代的 analysis。

RQ3 的 privilege features 也要和 parser quality 一起看。missing SKILL.md、invalid UTF-8、malformed frontmatter 進入 unknown；因此 absent 只表示在可解析 artifact surface 中沒有被該 detector 找到。這個 semantics 比把 unknown 塞進 absent 更保守，但也表示 85.06% 只能讀成「至少出現 static privilege evidence 的可評估比例」。

RQ4 的 reference sample 規模小，而且 annotator 的 label 不等同於 malware ground truth。三個 scanner 的 raw flags 多數是 suspicious 而不是 malicious：LLM 約 22,862 suspicious 對 1 malicious，VirusTotal 約 4,643 suspicious 對 210 malicious。因而 scanner overlap 是 triage evidence，不是 severity truth。

### 失敗模式、成本與轉移

paper 的 failure modes 具有可操作性：

- **snapshot drift**：registry policy、host feature、withdrawn item 與 downloads 會變，舊 correlation 不能直接當新 gate。
- **cohort confounding**：早期項目有較長 age，後期項目承受不同 discovery policy；age adjustment 不能保證消除所有 confounders。
- **schema missingness**：latestVersion、SKILL.md、frontmatter 或 Git source 缺失時，分析的 denominator 會變。
- **static/runtime gap**：shell、network、destructive evidence 是可能 capability，不是 actual effect。
- **scanner label gap**：沒有 perfect ground truth，reference set 的 flag 定義較寬；precision／sensitivity 只適用於該抽樣與 label contract。
- **review cost**：65,175 項目的 full manual review 不現實；但「自動掃過」也不代表 review queue 已被解決。應把 flags、unknown 與高影響 exposure 分層排序。
- **transfer failure**：作者明確提醒 rates 不應原封不動搬到其他 registry；較能轉移的是 measurement protocol、欄位語義與 audit trail，而不是 85.06%、61.06% 或 0.528。

## Artifact 與可重現性：paper 的 claim 要和端點現況分開

論文的 data availability 指向 [Zenodo DOI 10.5281/zenodo.21469516](https://doi.org/10.5281/zenodo.21469516)。我在 2026-09-17 以 DOI redirect 與 Zenodo record API 獨立檢查：DOI endpoint 回傳 404，Zenodo API 也回報 persistent identifier 未註冊。因此本文不把該 DOI 寫成「目前可下載的 replication package」；更精確的狀態是：**paper 宣稱資料可用，但截至檢查日指定 endpoint 無法取得 record。**

[OpenClaw repository](https://github.com/openclaw/openclaw) 與 [ClawHub repository](https://github.com/openclaw/clawhub) 本身可由 GitHub endpoint 存取，但這只證明現行 repository endpoint 存在，不保證 paper 的 historical crawl、withdrawn items、registry dump、issue access snapshot 或研究者衍生 tables 可由今天的 repository 重建。若要重跑，至少需要固定 commit／crawl date、stable ID mapping、缺失資料處理、regex version、scanner version、sample seed、annotator rubric 與 label adjudication。

## Bloss0m 工程化整理：把 registry trust 寫成五個狀態

以下是本文的 engineering judgment，不是論文提出的產品規格；它只把 paper 的分層 evidence 轉成可以落地的 record contract：

| 控制面 | 應保留的欄位 | 可以回答的問題 | 不可以宣稱的事 |
| --- | --- | --- | --- |
| Discovery | download snapshot、stars、comments、ranking、age | 使用者通常會看到什麼？ | 熱門就是安全 |
| Provenance | publisher、stable ID、version、content hash、source、withdrawn time | 這份 artifact 從哪裡來、是否可反查？ | source 存在就可信 |
| Artifact review | parsed files、scripts、network／shell／destructive evidence、unknown reason、scanner flags | 靜態內容暴露哪些可能 capability？ | evidence 就等於 runtime effect |
| Host policy | tool visibility、filesystem scope、credential scope、network egress、approval、sandbox | 在這個 host 允許什麼？ | artifact metadata 可以覆寫 host policy |
| Runtime telemetry | invocation、input／output hash、destination、policy decision、effect outcome、rollback／revocation | 實際發生什麼、能否追溯？ | 一次沒有觀測到的 effect 就不存在 |

每個 control plane 都應有自己的 state machine，例如 discovered → provenance_verified → artifact_review_required → host_allowed → runtime_observed；任一節點缺資料就停在 unknown 或 review_required。這樣做的代價是多幾個欄位、queue 與 operator workflow；好處是後續能回答「哪一層做了錯誤決定」，而不是用一個 trust score 把責任混在一起。

### 什麼時候不要直接採用這個方法？

如果系統是純 read-only、沒有 external side effect、沒有第三方 skill 安裝，完整 registry governance 可能會超過風險本身；可以先使用簡化 provenance 與 permission boundary。反過來，如果 skill 可以讀 credential、寫 production、改 policy、發送訊息或執行 arbitrary shell，就不應只採用 scanner flag、downloads threshold 或 stars gate。對高影響 action，必須加入 host-level least privilege、approval／sandbox、runtime audit、撤銷與 incident replay；paper 的 public static measurement 不能替這些 controls 背書。

## 限制與不支持什麼

這篇研究的 internal validity 受 missing latestVersion、缺少 SKILL.md、invalid encoding、malformed metadata 與 withdrawn data 影響；RQ1 的 June endpoint 也有 right-censoring。external validity 更窄：案例是 OpenClaw／ClawHub，一個短期且高速成長的 registry；activity、policy、publisher 行為與 scanner coverage 在另一個 ecosystem 可能不同。RQ3 的 privilege regex 會錯過語意型、間接型或 runtime-only capability；RQ4 的 reference sample 太小，且 annotator labels 不是 maliciousness truth。研究沒有執行 sandbox runtime、沒有建立全 registry 的 independent ground truth，也沒有證明某個 static flag 會造成真實 harm。

所以，不應從本文推出以下結論：OpenClaw 的 85.06% 就是實際危險率；前 10% downloads 就是風險集中率；沒有 scanner flag 就 clean；有 owner 或 auto status 就 accountable；或所有 agent-skill registry 都會重現同樣的 91.11-day curve。可轉移的是「如何把 unknown 留在資料模型裡、如何固定 snapshot 與 cohort、如何把 artifact evidence 和 runtime evidence 分開」。

## 三個記憶點

1. **成長與信任是兩條軸**：stock +95.14%、downloads Gini 0.528 是 discovery／capacity signal，不是 authorization signal。
2. **reviewability 是資料品質問題也是治理問題**：77.86% 沒有 stars 或 comments，85.06% 至少有一項 privilege evidence；未知與缺 feedback 都要進 workflow，而不是被默認忽略。
3. **scanner 只能分流**：三者共同 flag 只有 446；reference set 的 sensitivity／precision 受 label、sample、版本與 coverage 限制，真正的 runtime safety 仍需要 host policy 與 telemetry。

## 原始出處

- [After the Party v1 arXiv abstract and version record](https://arxiv.org/abs/2609.17274)
- [After the Party v1 full HTML](https://arxiv.org/html/2609.17274v1)
- [After the Party v1 PDF](https://arxiv.org/pdf/2609.17274v1)
- [Paper data-availability DOI](https://doi.org/10.5281/zenodo.21469516)（截至 2026-09-17 endpoint 404）
- [OpenClaw repository](https://github.com/openclaw/openclaw) 與 [ClawHub repository](https://github.com/openclaw/clawhub)
