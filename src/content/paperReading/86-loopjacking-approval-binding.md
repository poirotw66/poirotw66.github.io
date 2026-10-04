---
title: "Loopjacking 論文精讀：人類核准如何失去操作綁定"
description: "精讀 Loopjacking 如何區分核准畫面不完整與核准後狀態替換，並以版本固定的產品路徑、sink-level 證據及負向控制檢驗人工核准是否仍約束最終副作用。"
pubDate: 2026-10-04
updatedDate: 2026-10-04
tldr:
  - "Loopjacking 指產品把人類對操作 A 的真實決定用來授權或釋放重大不同的操作 B；論文將失敗分成核准前表示不完整，以及核准後狀態替換。"
  - "作者在特定配置與版本重現 Agno AgentOS 七個版本點、LangGraph Agent Server 12 個條件式 in-memory 組合，以及 OpenClaw 2026.2.23 的問題；OpenClaw 2026.2.24 與 OpenAI Agents SDK 0.22.0／0.22.2 提供修補或負向控制。"
  - "測試以合成身分、loopback 服務與無害 ledger／暫存檔為 sink；證據支持這些具名 trace，不是 Agent 生態系的漏洞盛行率或使用者受騙率。"
  - "實務重點是核准完整 canonical operation，並在副作用前重新比對目前操作、principal、task 與 scope；也要禁止未授權者修改待核准狀態。"
audience:
  - "設計 Agent 工具核准、MCP gateway 與 human-in-the-loop 流程的工程師。"
  - "負責授權、產品安全、工作流狀態與可稽核副作用的安全工程師。"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Governance", "Evaluation"]
image: "/paperReading/86-loopjacking-approval-binding/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-safety-governance
  - agent-evaluation-observability
paper:
  title: "Loopjacking: Hijacking Human-in-the-Loop Approval"
  authors:
    - "Adithyan Arun Kumar"
  year: 2026
  venue: "arXiv cs.CR preprint v1, submitted 2026-09-17; peer-review status not established"
  links:
    pdf: "https://arxiv.org/pdf/2609.21081v1"
    arxiv: "https://arxiv.org/abs/2609.21081"
    project: "https://github.com/adithyan-ak/loopjacking"
series:
  id: "agent-approval-binding-security"
  title: "Agent 核准與操作綁定安全"
  part: 1
  totalParts: 1
---

本文依據 [arXiv:2609.21081v1](https://arxiv.org/abs/2609.21081)，作者 Adithyan Arun Kumar 於 2026-09-17 提交。來源確認為 arXiv 預印本，沒有已確認的同行審查狀態。作者研究的不是人是否會被一段文字說服，而是系統能否確保人核准的操作，就是最後抵達工具或外部副作用端的操作。論文用兩種不同路徑說明這條界線如何斷開，再以隔離環境中的實際產品路徑、版本比較、負向控制與無害 sink 檢驗它；它沒有估算整個 Agent 生態系的盛行率。

> **花花的工程提醒**
>
> 「有人按了核准」只證明某個 UI 或流程記錄了決定。若 runtime 沒有把完整操作、決策者、任務範圍與最後執行的效果綁在一起，這個事件本身不能證明副作用受該決定授權。

## 90 秒地圖

- **問題**：人工核准常被當成危險操作前的最後防線，但操作在呈現、儲存、續跑與 dispatch 間會經過多種表示。若人看到的 A 與執行的 B 不一致，核准紀錄仍可能被產品邏輯消耗。
- **核心洞見**：作者把這種產品自有的「人類決定到操作效果」錯綁稱為 Loopjacking，並分成兩類：完整請求在核准前已含 B、畫面只呈現不完整 A；或人確實核准 A，之後可變工作流狀態被換成 B。
- **最強證據**：Table 2 報告多個精確版本點與控制結果：Agno 3.0.9 的替換 trace 為 5/5、direct-B 嘗試 3/3 遭拒；OpenClaw 2026.2.23 的表示錯配為 3/3，2026.2.24 對應修補版拒絕錯配 3/3。另有 12 個 LangGraph Agent Server 版本點在明確的 in-memory 與授權條件下重現狀態替換。
- **主要邊界**：候選產品是目的性選樣，測試只涵蓋具名版本與配置。LangGraph 結果取決於一項自訂 Auth policy；scripted approval 不測量人的理解；所有效果都落在無害 sink，因此沒有真實交易、客戶資料或正式服務影響的量測。

## 既有方法的限制：核准不變量未落到執行點

Human-in-the-loop 常被畫成簡單序列：Agent 提出動作 → 人看過 → 人按允許 → 系統執行。實際產品可能先產生結構化 tool call，再渲染一個字串；也可能把 pending action 存入 thread，等待另一個角色 resolve，然後從目前狀態重建請求；最後才將參數送到工具。人類決定、被檢視的表示、權威狀態及 sink 收到的 operation，可能分別由不同元件控制（Introduction；Section 2.1）。

論文把完整操作視為不只一段 command string。它可能包含 action、參數、target resource、principal、task scope 與足以改變效果的 execution context。令 A 為人理解並核准的操作，D_A 為該決定，B 為最後到達 sink 的操作。**核准綁定不變量**要求：只有在使用核准的當下，重新建構的完整操作與 A 在授權相關效果上等價，而且決定仍適用於目前 principal、task 與 scope 時，D_A 才能授權執行；否則系統要拒絕或要求重新核准（Section 2.1）。這是論文提出的操作性安全要求，並非一項對任意實作的形式證明。

## 核心直覺：A 在核准前就錯，或在核准後才被換掉

兩種變體共享同一個失敗核心——產品把決定 A 的權限交給 B——但改變發生的時間與防守位置不同。

| 變體 | B 何時出現 | 人看到什麼 | 產品失敗在哪裡 | 對應安全分支 |
| --- | --- | --- | --- | --- |
| **表示型（representation-based）** | 核准前，完整 request 或 execution context 已包含 B | 只看到缺漏或誤表的 A | approval renderer、正規化或檢查沒有呈現完整操作 | 核准完整 canonical operation，拒絕無法一致解讀的表示 |
| **核准後狀態替換（post-approval state substitution）** | 人核准 A 後、決定被消耗前 | 當時看到正確的 A | pending task、thread、session 或 continuation 狀態被替換成 B，舊決定仍有效 | 使用時重建並比較操作，或阻止未獲授權的 pending-state mutation |

![論文 Figure 1：核准決定必須綁定最後釋出的操作。](/paperReading/86-loopjacking-approval-binding/figure-1.png)

*Figure 1（論文 Section 2.1）：核准綁定模型。比較人可見的 A 與產品最後釋放的 B；若不等價，就拒絕或重新核准。圖像由 Adithyan Arun Kumar, “Loopjacking: Hijacking Human-in-the-Loop Approval,” [Figure 1](https://arxiv.org/html/2609.21081v1#S2.F1) 的 arXiv v1 PDF 裁取並 rasterize，內容未改編；依 arXiv 頁面標示的 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

這個名詞刻意不涵蓋所有 agent 安全問題。要把 trace 稱為 Loopjacking，作者要求：有真實的人類決定；A 與 B 在授權相關效果上有實質差異；存在攻擊者可達的影響路徑；產品自有邏輯將 A 的決定用於 B；能觀察到抵達 consequential sink 的確切操作；攻擊者本身沒有等價的直接權限（Sections 2.2–2.4）。因此，使用者明知畫面顯示 B 仍同意、一般可變狀態、偽造確認但根本沒有真人決定，或只發生 prompt injection 卻沒有重用 A 的核准，都不符合此定義。

![論文 Figure 2：兩種錯綁路徑與各自的安全分支。](/paperReading/86-loopjacking-approval-binding/figure-2.png)

*Figure 2（論文 Section 2.2）：B 可在核准前就藏於未完整呈現的 request，也可在核准後從正確 A 演變為 B；完整呈現與使用時綁定處理兩者，禁止未授權修改則額外保護第二種路徑。圖像由 Adithyan Arun Kumar, “Loopjacking: Hijacking Human-in-the-Loop Approval,” [Figure 2](https://arxiv.org/html/2609.21081v1#S2.F2) 的 arXiv v1 PDF 裁取並 rasterize，內容未改編；依 arXiv 頁面標示的 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

## 具體例子：走完整個 20 單位核准與狀態替換

論文用無害 transfer stub 讓操作差異容易看見：A 是轉 20 單位給核准供應商；B 是轉 2,000 單位到攻擊者指定 sink。實驗不會真的搬動資產，而是由工具把收到的完整參數附加到 ledger（Sections 3、4.1）。

1. **建立 A**：低權限 maker 建立一個 pending action。產品核准畫面、approval record 都顯示 20 單位與供應商；maker 可以啟動或繼續自己的工作，但沒有核准 token，也不能直接執行 B。
2. **由另一角色核准**：具核准權限的 administrator 檢視 A 並核准。這是產品記錄的真實決定，不是模型自稱「已核准」。
3. **核准後改狀態**：在某些測試路徑，maker 對同一個 run／thread 送出 B。若 product continuation 從目前狀態載入被替換的參數，卻只檢查「該 run 已沒有待處理核准」或重用舊 approval，就會放行 B。
4. **檢查 sink，而非停在 HTTP 回應**：研究者驗證最後 ledger 收到的是 2,000 單位與攻擊者 sink；再確認未核准的直接 B 被拒、原樣 A 仍能成功、無權限角色也無法越權。這排除單純「endpoint 回 200」或 model output 看似成功的弱證據。
5. **執行修正控制**：研究用的 canonical descriptor 比對在 Agno trace 拒絕 B 而保留 A。這證明測試 trace 可被該不變量阻斷，但不是 Agno 廠商修補版。LangGraph 另測一個支援的 policy，直接禁止 maker 更新待核准 thread；在此條件下 B 被擋，A 仍能通過。

此流程的關鍵不是 maker 能不能自己按 approve，而是「核准後續跑」是否把 A 的決定帶到經修改的 B。對狀態替換而言，只有 approval UI 上曾顯示 A，不足以保證後續執行仍是 A；對表示型錯配而言，使用時再比對若比對的仍是被截斷的欄位，也不夠。比較必須覆蓋完整、具語意重要性的操作內容。

## 三種產品路徑，兩種失效時點

作者選取不同的 owner、state 與 approval boundary，建立三條 positive path，再加入一種預期保持綁定的 negative control。測試是目的性案例集，挑選它們是為了讓機制與 sink 可觀察，不是隨機抽樣框架（Sections 3、4.1；Table 1）。

| 產品路徑 | 失效時點與條件 | 觀察到的效果 | 必須保留的限制 |
| --- | --- | --- | --- |
| **Agno AgentOS regular Agent** | 核准 A 後，同一 run 的 continuation 接受 caller 提供的 B；maker 有 run/continue 權限，但沒有 admin approval token | 七個測試版本點：2.5.6、2.9.0、3.0.1、3.0.2、3.0.3、3.0.6、3.0.9 都重現 strict trace；3.0.9 的 A→B 為 5/5，direct B 被拒 3/3 | 2.5.5 可以直接執行 B，故不算 Loopjacking；沒有測完所有中間版本，也未建立連續受影響區間或廠商修補版。 |
| **LangGraph Agent Server in-memory composition** | 自訂 Auth policy 允許 maker 更新 shared pending thread，但不許其 resume 或執行 B；另一個 approver resume 時從目前 thread state 重建動作 | 12 個執行版本點從 0.7.5 到 0.14.0 通過 strict trace；deny-update policy 擋 B 並保留 A | 是有條件的文件化 extension point 組合，不代表預設配置。0.14.0 是單獨執行點；掃描過 wheel 的版本不能全都稱為實際重跑；Production Postgres 未測。 |
| **OpenClaw shell-wrapper** | 完整 argv 在核准前已含 B，畫面只呈現 inline shell payload 的 A | 2026.2.23 三次都讓 B 到 node-host；2026.2.24 在相同輸入下三次都於 node 執行前拒絕錯配，同時保留 A 的正常路徑 | 這是唯一有原生受影響／修正版本配對的正向案例；自動化核准角色不測人的理解、受騙率或 UI 品質。 |

**Agno 的內部鏈條**是 run-level approval gate 和後續 continuation 分開：approval record 精確記錄已核准的 tool 與 args；核准解除後，continuation route 會反序列化 caller 提供的 tool execution，將它放進 run，再 dispatch confirmed execution。主要測試路徑比對了 call identity，但未把目前 tool arguments 與核准記錄的 descriptor 比較（Section 3.1）。作者列出的版本點確實各有 positive trace；他們不主張所有相鄰 patch 都中招。2.5.5 是重要邊界控制，因為 direct B 本身能執行，無需 hijack approval。此區分說明漏洞定義需要驗證「核准必要性」，而不只是找到權限過寬。

**LangGraph 的條件組合**需要讀者看清角色分離與授權政策。Maker 可透過 shipped A2A <code>message.command.update</code> 改 pending shared thread，不能 resume；approver 可讀、核准與 resume，不能做 maker 的更新。Resume 會根據目前 thread state 重建 call，之後以 authenticated resume principal 執行。論文展示這種 composition 在 12 個指定 in-memory Agent Server 版本上如何把舊 A 決策用於 B，也展示 deny-update policy 會阻止狀態替換（Section 3.2；Table 2）。結果是「只要允許這項更新的政策存在，這條配置路徑就可以出現錯綁」，不是「LangGraph 預設容易被接管」。

**OpenClaw 的時序相反**：B 早已在完整 positional argument vector 中，只是批准事件的顯示形式只有 inline shell payload <code>$0 "$1"</code>。2026.2.23 的 gateway／node-host 放行完整 vector，2026.2.24 加入對完整 argv 的一致性檢查並拒絕 mismatch（Section 3.3）。作者以本地原生 trace 與 vendor advisory／patch 相互支持，並將一筆後來看似重複的 advisory 以版本 artifact 與 commit ancestry 重新比對；那是作者的證據調和，不代表 GitHub 或廠商正式判定兩份紀錄重複。

## 技術機制：從核准表示到最終副作用的執行路徑

這不是比較模型哪個「更安全」的 benchmark。模型選擇不是被測原因；實驗使用 deterministic local model fixtures，將注意力放在產品自身的 approval-to-effect data path。身份是 synthetic；網路流量經 loopback；可能有影響的工具都改寫為 append-only ledger 或 temporary marker，沒有呼叫 production service（Section 4.1；Section 7.2）。

每個 positive trace 需要多個相互補足的檢查：人先看到精確 A；不變的 A 可成功；攻擊者身份直接呼叫 B 會失敗；在產品提供該權限邊界時，wrong actor／outsider 會失敗；最後 B 必須精確抵達 sink。安全控制要拒絕 mismatch 同時保留合法 A。這讓結果比單一 HTTP status 更能回答「什麼動作以誰的權限真正執行了」，但測試仍然是決定性的本機重現，而非生產事故遙測或人因實驗。

**Table 2 的分母不可互換。** Agno 3.0.9 的嚴格正向版本點有 5/5 次替換、5/5 次 unchanged A、3/3 次 direct-B 拒絕，以及聲明的 23 個測試 cells 全完成；不代表每一版本點都運行了同一個完整 23-cell matrix。OpenClaw 2026.2.23／2026.2.24 的 paired trace 分別為 3/3；OpenAI SDK 每個版本的 mutation rejection 也各是 3/3。這些 trial counts 只描述固定 harness 中觀察到的結果，不應加總成生態系風險機率（Table 2；Sections 4.2–4.3）。

## 證據地圖：作者主張、實際觀察與本文推論

| 層次 | 內容 | 錨點與邊界 |
| --- | --- | --- |
| **作者主張** | Loopjacking 有兩種主要變體；完整 canonical rendering 加上使用時比對，或阻止未授權 pending-state mutation，可阻斷測試中的錯配，同時保留合法 A。 | Definition、Figure 2、Sections 2.2、6；這是可測定義與指定 trace 的結論，不是任意系統的形式保證。 |
| **測試直接觀察** | 具名版本的產品路徑將 B 寫入無害 sink；direct-B、unchanged-A、角色邊界及安全控制共同定位核准是否被重用。 | Table 2、Sections 3–4；記錄的是指定版本／配置和 trial，不是產品群體盛行率。 |
| **作者明確保留** | 樣本為 purposive set；LangGraph 結果 conditional；scripted approver 不測人因；無真實服務副作用，亦無 independent reproduction。 | Section 7；Agno、LangGraph 中間版本及 Postgres 範圍各有限制。 |
| **本文工程推論** | 對延遲執行或可續跑流程，應同時測核准前表示完整性與核准後狀態新鮮度，且在 sink 前驗證操作等價。 | 這是 Bloss0m 工程化整理，依 Sections 2、6.4 推導，非作者提出的獨立 protocol。 |

因此，證據最有力地支持「核准必須約束最後效果」這項設計要求，也顯示它可被有意義的產品 trace 測試。它不能證明某一產品以外的預設行為、所有版本的受影響範圍，或真實使用者在日常工作中會遇到多少次錯綁。

## 負向控制的意義：序列化與續跑本身不是漏洞

OpenAI Agents SDK 0.22.0 與 0.22.2 在此研究中作為 negative control，不是漏洞對象。作者把已核准的 per-call state 序列化、還原再續跑；原樣 A 都執行成功。接著在保持 canonical approval／invocation records 與 call ID 的情況下，只把 serialized pending invocation 改成 B；還原雖成功，但 resume 丟出 <code>ModelBehaviorError</code>，ledger 沒有副作用，直接未核准的 B 也會 pause（Section 4.2）。

這個控制有兩個讀法。第一，pause/resume、serialization 或同一個 call ID 不能單獨作為漏洞判準；重要的是實際 authority-binding 邏輯。第二，這項結果只覆蓋指定 SDK 版本的 ordinary function-tool per-call approval；它不證明 SDK 周邊所有 application-authored approval 安全，也不涵蓋刻意採用 sticky <code>always_approve</code> 或攻擊者能偽造所有 trusted canonical fields 的情境。

## Figure 3 與 A2A：協定提供載體，不自動提供授權

![論文 Figure 3：A2A 協調狀態與實作方授權語意的邊界。](/paperReading/86-loopjacking-approval-binding/figure-3.png)

*Figure 3（論文 Section 2.5）：A2A 在延後核准工作流中提供 Task、message、interrupt 與 resume 協調；核准視圖、決定範圍、目前操作的選擇、使用時比較與 sink 則屬於實作或 issuer。只有實作把 D_A 用於 B 的紅色分支才符合論文的 Loopjacking 定義。圖像由 Adithyan Arun Kumar, “Loopjacking: Hijacking Human-in-the-Loop Approval,” [Figure 3](https://arxiv.org/html/2609.21081v1#S2.F3) 的 arXiv v1 PDF 裁取並 rasterize，內容未改編；依 arXiv 頁面標示的 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

作者用 A2A 當成一種**條件式 carrier**，不是把協定宣告成易受攻擊。論文描述其當時的非終端 <code>TASK_STATE_AUTH_REQUIRED</code>、同一 Task 的訊息協調，以及 out-of-band credential 後續執行機制；若某實作把 A 顯示給 approver，卻在 credential 到達後從同一 Task 最新 state 選 B 並消耗 D_A，錯誤在應用方的授權連結。作者並追蹤 Issue 2080 與 merged PR 2081 新增的規格提醒：interrupt state 是協調訊號，不是授權 grant，實作者必須定義被授權操作並在之後使用時檢查（Section 2.5）。這是規格責任的澄清，不是 A2A 自身漏洞，也不是對所有 SDK 的普遍推論。

## 作者如何定位貢獻：命名與案例，不是發明核准完整性

論文把 Loopjacking 與相鄰概念區隔得很窄。<em>Lies in the Loop</em> 涵蓋核准畫面呈現被操弄，與表示型變體重疊；<em>Consent Integrity</em> 已提出可信呈現與 bind-to-execution；<em>Authorization Continuity</em> 關注 grant 是否在 state、delegation 或 task phase 變動後仍有效；session smuggling 或 memory poisoning 可以把 B 帶進工作流，但不一定重用一筆人對 A 的決定（Section 5；Table 3）。

因此較可信的 novelty 說法是：作者提供一個以可測 trace 定義的分類，並比較了多個具名 release/configuration 的 approval 路徑，指出 mismatch 是在表示階段發生，還是正確審批之後發生。論文並未宣稱首先發現 action binding 原則、授權連續性或 commit-time revalidation。這項貢獻的實務用處，是讓測試者能以一致條件辨認核准到效果之間的失聯，而不是創造新的普遍安全法則。

## 失敗型態與修復含義

作者建議的核心防線是 **canonical approval record** 與 **use-time decision**（Sections 6.1–6.3）。把人核准的完整 operation 以一致、可重建的格式保存；在 side effect 前重新組合實際將執行的 operation，檢查它和紀錄在具授權意義的欄位上等價，且 approver、principal、task、scope、有效期與消耗狀態都仍成立。若比較失敗，拒絕或重新取得核准。對可變 pending state，另要防止未授權角色修改；每次 mutation 都必須經 policy 判定，不可只依「曾經核准過」放行。這幾項是作者的方向性建議，不等於本文宣稱某一個實作方式已提供完整安全保證。

本文的 **Bloss0m 工程化整理**是把兩種變體轉成互補測試面：其一，變換 approval view、正規化方式及 command encoding，檢查呈現 A 時 complete execution context 是否已含 B；其二，在 approve 與 effect 間逐一 mutate 參數、target、principal、thread、session、scope、expiry 與 resume context，檢查 use-time comparison 是否 fail closed。再以 sink-level ledger assertion 同時驗證拒絕效果與 unchanged A 的可用性。這是從論文兩種分類與 Section 6.4 測試指引整理出的工程檢查清單，不是作者聲稱已標準化的協定。

**不應只看一個 identifier。** Agno 的 trace 中 call identity 可保持相同，args 卻已變；僅比較 call ID 無法證明 operation 相同。同樣地，對整個 workflow 記一個 <code>approved=true</code>，會把使用者核准的單一動作擴大成後續任務狀態的授權。Digest 或 canonical serialization 可幫助建立穩定表示，但仍需說清楚 canonicalization 覆蓋哪些欄位，以及應用在 effect 前檢查哪個來源狀態。更重要的是，approval binding 不取代 action-level authorization、參數驗證、最小權限或後端自己執行的權限檢查。

## 研究限制與不能推論的事

第一，**樣本不是流行率樣本**。三條 positive product paths 加一條 negative control 是目的性選取，旨在顯示機制差異，而不是抽樣所有 Agent framework。結果不能支持「多數工具核准都不安全」、「某框架整個版本範圍受影響」或統一 severity／CWE／CVSS 結論（Section 7.1）。

第二，**版本與配置邊界明確**。Agno 只證明列出的七個 strict-positive release points 與該 regular-Agent 設定；中間版本未全數執行，且沒有確認修正版本。LangGraph 依賴 in-memory runtime、LangChain 1.3.18、LangGraph 1.2.11 及允許非 approver 更新 shared thread 的 custom Auth policy；其支援的 deny-update policy 能反駁「此產品路徑必然不安全」的說法。正式 Postgres 路徑未測，因官方部署需要 license key。OpenClaw 只有 2026.2.23/2026.2.24 這組 affected/fixed 配對。以上版本資料以論文 2026-09-10 evidence cutoff 為準，不可當成當前所有版本狀態。

第三，**系統 trace 不等於人因證據**。核准角色在 harness 已確認精確產品事件後自動作出決定，這使測試能隔離產品 binding，但不測量人會不會理解顯示內容、受騙機率或 UI 可用性。實驗也沒有發生真實付款、資料外洩或破壞性副作用；所有 sink 都是無害的 mock ledger 或 temporary marker（Sections 4.1、7.2）。

第四，**作者與外部複製仍有界線**。四條路徑的實驗皆由單一研究者操作；部分代表性版本在 Linux 重跑，其餘多為乾淨 macOS 環境，作者沒有主張獨立重現。公開 evidence archive 有原始請求、approval record、結果、版本與雜湊 manifest，且帶有 read-only <code>verify_archive.py</code>；這能讓讀者核對封存證據的完整性，卻不等於獨立研究者已從空環境重跑所有實驗。

## Artifact 與可重現性

截至 2026-10-04，作者的 [loopjacking evidence archive](https://github.com/adithyan-ak/loopjacking) 公開了 <code>EVIDENCE.md</code>、版本化 bundles、checksum manifests、各 harness 說明與 <code>verify_archive.py</code>。README 指出 Python 3.10+ 可執行唯讀 archive verifier；重跑實驗時，若 pinned packages 或 dependencies 尚未快取則需要網路。這個 verifier 檢查封存檔的雜湊與結果 oracle，不會重新執行 AgentOS／LangGraph／OpenClaw 測試，因此應分清「驗證公開紀錄」與「重現實驗」。GitHub repo 未提供可確認的程式碼授權條款，讀者可檢視內容，但不能只因 repository public 就假設可任意再散布或改作。本文未獨立重跑論文實驗；結果皆為作者報告。

## Bloss0m 工程判斷與不適用條件

如果你的 workflow 在核准後會等待 callback、queue、human handoff 或 agent resume，應把 approval 綁到一份完整且不可含糊的 operation descriptor，並在副作用邊界重新驗證目前狀態。Descriptor 至少要能區別授權相關的 action、arguments、target、principal、task/scope 與有效性；哪些欄位是 material，必須按產品威脅模型定義。若核准的是整個可變任務而非單一動作，也要把這種授權範圍明白呈現，並限制後續各個 effect。

這篇論文不適用於推斷所有 prompt injection 都是核准錯綁、估計真實環境受影響率，或替代系統自己的安全審查。若攻擊者本來就有直接執行 B 的權限，該 trace 不符合作者對 Loopjacking 的必要條件；若沒有真人作出決定，也不屬於此文定義。遇到無法重建完整 operation、可信核准紀錄可被偽造、或未觀測到真正 sink 的情境，結果應標為未確定，而不是用 UI 訊息推定安全。

適合把這篇和 [Bounded Agents 的 delegation 與 action composition 授權模型](/paper-reading/bounded-agents-delegation-security/) 一起讀：前者問某一筆人類核准是否仍綁定同一個副作用，後者問多個各自可准許的 action 是否會組合成不被允許的結果。再讀 [MobileCybench 的可執行安全探針](/paper-reading/68-mobilecybench-executable-security-probes/)，可比較 security claim 如何從控制流程走到可觀察的效果。英文延伸可參考 [Specifications, Not Agents, Sign Off](/en/paper-reading/76-specifications-not-agents-sign-off/)，理解外部 runtime 如何界定任務完成權威。

## 讀完後的三個記憶點

1. **核准不是永續通行證**：它只對使用者理解並同意的操作、principal、任務與範圍有效。
2. **兩種錯配發生在不同時點**：表示型錯配在核准前隱去 B；狀態替換在核准後把 A 換成 B。只修其中一條會留下另一條。
3. **證據只支持具名 trace**：作者以版本固定、sink-level mock 和控制測試證明那些指定配置下的操作結果，沒有測出產業盛行率或人的受騙率。

## Primary sources

- Adithyan Arun Kumar, [“Loopjacking: Hijacking Human-in-the-Loop Approval,” arXiv:2609.21081v1](https://arxiv.org/abs/2609.21081)（全文：[HTML v1](https://arxiv.org/html/2609.21081v1)、[PDF v1](https://arxiv.org/pdf/2609.21081v1)；提交於 2026-09-17）。
- 作者的 [公開 evidence archive](https://github.com/adithyan-ak/loopjacking)，特別是 [EVIDENCE.md](https://github.com/adithyan-ak/loopjacking/blob/main/EVIDENCE.md) 與 README。Archive 有 verifier，但 repository 未見明確程式碼授權聲明。
- 圖片來源：原論文 Figures 1–3，分別錨定 [Figure 1](https://arxiv.org/html/2609.21081v1#S2.F1)、[Figure 2](https://arxiv.org/html/2609.21081v1#S2.F2)、[Figure 3](https://arxiv.org/html/2609.21081v1#S2.F3)，依 arXiv 標示之 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 重製，未修改。
