---
title: "企業 AI Agent 安全架構：Threat Model、控制面與上線檢查表"
description: "以 Prompt Injection、工具授權、資料外洩、記憶與身分、供應鏈及可觀測性為邊界，建立可驗證的企業 AI Agent 縱深防禦架構。"
pubDate: 2026-07-09
updatedDate: 2026-08-09
tldr:
  - "模型只能提出行動建議；工具授權、租戶隔離、額度與高風險核准必須由模型之外的確定性控制執行。"
  - "Agent 安全要同時約束輸入、身分、資料、工具、執行環境與供應鏈，單一 Guardrail 或 Gateway 都不是完整防線。"
  - "先以唯讀與影子模式建立資產清冊、對抗測試及事故處理能力，再逐步開放可回復、可撤銷的寫入權限。"
audience:
  - "設計企業 AI Agent 的平台、安全與應用工程團隊"
  - "負責風險、稽核、身分治理與正式上線決策的技術主管"
category: "Enterprise AI"
tags: ["AI Agent", "Enterprise AI", "AI 安全", "架構模式", "Governance"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 4
kind: "article"
showToc: true
image: "/blog/43-enterprise-ai-agent-security/title_image.jpg"
---
企業 AI Agent 的安全問題，不只是「模型會不會說錯話」，而是機率式決策器能否跨越身分、資料與工具邊界，對確定性的企業系統造成真實副作用。Prompt Injection 可能藏在使用者輸入、網頁、Email、檢索文件或另一個 Agent 的訊息裡；一旦 Agent 同時擁有廣泛工具與長效憑證，文字就可能被放大成寄信、轉帳、刪除資料或外傳機密的動作。

因此，安全目標不是讓模型「永遠判斷正確」，而是建立一個可執行的 **Agent execution envelope（Agent 執行包絡）**：每次執行都明確綁定誰發起、代表誰、為何執行、能讀哪些資料、能呼叫哪些工具、可產生哪些副作用，以及時間、步數與成本上限。模型可以在包絡內規劃；是否允許行動，必須由模型之外的控制決定。

> **花花的一句話**
>
> 把模型當成會提出計畫的不受信任元件，而不是會替系統授權的安全邊界。

## 先定義威脅模型，而不是先選 Guardrail

[OWASP Prompt Injection 指南](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 指出，直接與間接 Prompt Injection 都可能改變模型行為，而其影響取決於系統授予模型的 agency。這表示「偵測惡意文字」只是其中一項緩解措施；真正需要保護的是模型之後可以觸及的資產與動作。

建立 threat model 時，先列出四項事實：

1. **資產**：客戶資料、原始碼、憑證、付款與郵件能力、長期記憶、稽核紀錄。
2. **信任主體**：終端使用者、委託使用者、Agent workload、工具服務、供應商與維運人員。
3. **入口**：Prompt、檢索內容、工具回傳、檔案、瀏覽器頁面、Webhook、Agent-to-Agent 訊息。
4. **最壞副作用**：越權讀取、跨租戶洩漏、不可逆寫入、權限提升、服務或預算耗盡、證據遭竄改。

[MITRE ATLAS](https://atlas.mitre.org/) 是持續更新的 AI 對抗技術知識庫，可協助把攻擊情境映射到 tactic 與 technique；它適合用來補足紅隊案例，但不等於已涵蓋所有未來攻擊。[NIST AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) 則提供跨生命週期的治理、盤點、量測與事故處理框架。兩者都應轉換成組織自己的風險假設、測試與責任人，而不是當成合規勾選表。

## 五個必須分開處理的威脅邊界

| 邊界 | 典型失敗 | 主要控制 |
| --- | --- | --- |
| Prompt 與外部內容 | 網頁、Email 或檢索文件中的間接指令劫持目標 | 將外部內容標成不受信任資料、限制可用工具、保留來源、加入對抗測試；不要依 Prompt 宣告改變權限 |
| 工具與副作用 | 模型因誤判、幻覺或惡意內容呼叫過度強大的工具 | 最小工具集、讀寫分離、參數 schema、政策檢查、冪等鍵、金額與頻率上限、高風險人工核准 |
| 資料與出口 | 敏感內容進入模型上下文，再透過回答、HTTP、Email 或檔案外傳 | 查詢時授權、租戶隔離、欄位遮罩、出口 allowlist、DLP、禁止 Prompt 與記憶接觸原始密鑰 |
| 記憶與身分 | 污染長期記憶、跨使用者讀取，或混淆「使用者」與「代為行動者」 | 記憶分區、來源與寫入者、TTL、敏感寫入審核；明確記錄 subject、actor、tenant 與 purpose |
| 供應鏈與可觀測性 | 工具描述、Prompt、模型、套件或遠端服務被替換；紀錄不足或反而收進機密 | 版本鎖定、簽章與來源清冊、變更審核、沙箱與出口限制、結構化且去敏的 audit event、異常告警與回復演練 |

[OWASP Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) 將傷害根因拆成過多功能、過多權限與過多自主性。這個拆法很實用：即使 Prompt Injection 無法完全攔截，只要工具能力、實際權限與自主範圍同時被壓低，攻擊的爆炸半徑仍可受到限制。OWASP 的 [Agentic AI Threats and Mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/) 也提醒，記憶污染、工具濫用與多 Agent 信任鏈需要獨立建模，不能只沿用聊天機器人的輸入過濾。

## 縱深防禦：把控制面放在模型之外

一個可操作的企業架構可分成七層。重點不是採用特定產品，而是每層都有可測試的責任。

### 1. 入口與工作階段邊界

先驗證使用者與 workload，建立不可由模型覆寫的 `user_id`、`actor_id`、`tenant_id`、用途、資料分類與 session。外部文件、工具回傳與其他 Agent 訊息一律標為不受信任內容，不能因其中寫著「管理員已核准」就提高權限。

### 2. 編排器與有限狀態

模型負責提出計畫、選候選工具或判斷資訊是否足夠；編排器負責最大步數、timeout、重試、成本、停止條件與可回復狀態。高風險流程應優先使用明確狀態機，避免讓模型自由遞迴直到成功。

### 3. Policy Decision 與 Enforcement Point

每個工具呼叫在執行前，都以結構化請求送進政策層：主體、代行者、租戶、目的、工具、動作、資源、參數摘要與風險級別。政策引擎回傳 allow、deny 或 require-approval，執行點再強制落實；模型說「已獲核准」不構成證據。

### 4. 工具與資料 Gateway

Gateway 應提供工具 allowlist、schema 驗證、Credential Broker、速率與額度限制、出口政策及一致的 audit event。它是重要 choke point，但不是唯一防線：目標 API 仍須自行驗證身分與授權，否則繞過 Gateway 或設定錯誤仍會直接暴露資產。

### 5. 隔離的執行環境

程式執行、瀏覽器操作與不受信任檔案處理應使用按任務隔離的 sandbox，預設關閉不必要的網路、檔案系統與雲端 metadata 存取。為 CPU、記憶體、步數、token、外部請求與金額設硬上限，並讓 kill switch 能撤銷 session、憑證與後續工作。

### 6. 證據與營運回饋

記錄輸入來源雜湊、模型與 Prompt 版本、工具名稱與參數摘要、政策結果、人工核准、外部副作用、錯誤與成本。不要把未去敏的完整 Payload、密鑰或私密 chain-of-thought 當成「完整稽核」保存；實務上需要的是能重建決策與副作用的最小充分證據，以及與 SIEM、事件處理和資料保存政策對接的紀錄。

### 7. 生命週期控制面

Agent Registry 至少應列出 owner、用途、模型與 Prompt 版本、工具與資料範圍、供應商、評測結果、部署環境、風險等級、最後審查日與停用方式。[NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) 特別強調資產盤點、第三方風險、上線後監控、override、decommission 與 incident response；這些項目應是營運能力，而不只是設計文件。

> **花花的工程提醒**
>
> Guardrail 模型可以當偵測訊號，但不應是付款、刪除、權限變更或跨租戶存取的唯一閘門；高影響控制必須能以程式、政策或人工核准確定執行。

## 確定性控制與模型判斷如何分工

| 決策 | 應由確定性控制負責 | 模型可協助的部分 |
| --- | --- | --- |
| 能否讀取資料 | RBAC／ABAC、租戶與欄位授權 | 判斷使用者想查哪一類資料 |
| 能否呼叫工具 | allowlist、scope、resource、schema | 從已允許工具中提出候選 |
| 是否執行高風險動作 | 金額、目的地、雙人覆核、交易前置條件 | 摘要理由與待確認差異 |
| 是否可對外傳送內容 | 出口 allowlist、資料分類與 DLP 規則 | 語意分類或可疑內容評分 |
| 是否停止執行 | timeout、步數、成本與錯誤上限 | 判斷任務可能已完成 |
| 是否跨 session 寫入記憶 | 身分、namespace、資料類別、TTL 與寫入政策 | 提議值得保存的候選事實 |

模型分類器、Prompt Injection 偵測器與 LLM-as-a-Judge 都可能出現 false positive、false negative，或受到同一份惡意內容影響。它們適合提供風險分數、告警與人工排序；若錯誤會造成重大副作用，最終 enforcement 不應只依賴另一個模型的判斷。

## 身分：區分委託者、行動者與 workload

當 Agent 代表人類呼叫後端時，[OAuth 2.0 Token Exchange（RFC 8693）](https://www.rfc-editor.org/rfc/rfc8693.html) 定義了 token exchange，以及 impersonation 與 delegation 的 subject / actor 語意。實作時應把 audience、resource、scope、actor 與有效期綁定目標工具，並確保撤銷與 session 結束能傳遞到下游。RFC 並未替部署決定固定 TTL，也不會自動完成業務授權；「拿到交換後 token」仍不代表每個動作都應被允許。

對背景服務或自主 workload，[SPIFFE Workload API](https://spiffe.io/docs/latest/spiffe-specs/spiffe_workload_api/) 可交付 X.509-SVID／JWT-SVID 與 trust bundle；[SPIFFE 的概念文件](https://spiffe.io/docs/latest/spiffe/concepts/) 說明其短效憑證會自動輪替，應用不必預先攜帶 bootstrap secret。這能改善 workload authentication 與靜態密鑰問題，但 SPIFFE ID 只回答「是哪個 workload」，不回答「它是否能替這位客戶退款」。後者仍須由業務政策與目標服務授權。

## 一次高風險工具呼叫應如何通過系統

以「替客戶退款並寄出通知」為例：

1. Agent 根據對話提出 `refund.create` 計畫，但尚未執行。
2. 編排器補上不可變的使用者、客服角色、租戶、case ID 與 session。
3. 政策層檢查退款上限、案件狀態、資料範圍、收款對象與是否需要第二人核准。
4. Tool Gateway 驗證 schema 與冪等鍵，取得只對退款 API 有效的短效憑證；通知工具無法看到付款憑證。
5. 目標 API 再次驗證授權與業務前置條件，回傳交易 ID，而不是只接受模型產生的成功敘述。
6. 系統記錄政策版本、核准者、交易 ID 與通知結果；失敗時停止後續步驟，依補償流程復原或交由人工。

這條路徑的核心是 **先核准結構化意圖，再執行具體副作用**，而不是先讓模型自由操作，再靠輸出掃描補救。AWS 的 [生成式 AI 安全參考架構：Agent capability](https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture-generative-ai/gen-auto-agents.html) 也把 session isolation、identity、gateway、memory 與 observability 視為彼此配合的能力，並明確指出 Agent 可能透過工具組合擴大權限；這是可參考的雲端實作分層，不是對所有平台的安全保證。

## 仍然會失敗的地方

- **Prompt Injection 無法只靠分類器消失**：新型態、編碼內容、多步驟與跨工具注入可能穿過偵測。
- **最小權限也可能被組合**：多個低權限工具串接後，可能產生原本沒被單獨評估的高影響結果。
- **人工核准可能流於形式**：告警過多、摘要不完整或介面誘導，會形成 approval fatigue。
- **Gateway 可能成為單點失效或單點繞過**：政策同步、憑證注入與旁路流量都需要持續測試。
- **記錄越多不等於越可稽核**：過量 trace 可能保存個資與機密，卻仍缺少政策版本、外部副作用或關聯 ID。
- **供應商與模型會改變**：模型、遠端工具、Prompt、套件和資料來源更新都可能讓既有評測失效。
- **框架不是保證書**：OWASP、NIST、MITRE ATLAS、SPIFFE 或任何雲端產品都只能支援部分風險管理；責任仍由實際架構、設定、流程與維運共同承擔。

## 分階段上線檢查表

### 第 0 階段：盤點與定界

- [ ] 每個 Agent 有 owner、用途、資料分類、工具、副作用、供應商與停用方式。
- [ ] 定義 subject、actor、workload、tenant 與 session，禁止共用長效服務帳號。
- [ ] 列出 direct / indirect Prompt Injection、跨租戶、記憶污染、工具組合、供應鏈與出口情境。
- [ ] 為每項高風險動作定義禁止、人工核准、可回復與事故通報條件。

### 第 1 階段：唯讀與影子模式

- [ ] 先以唯讀工具或 dry run 驗證規劃，不對真實系統產生副作用。
- [ ] 建立正常、權限不足、惡意內容、工具逾時與跨租戶的評測集。
- [ ] 驗證 trace 能關聯輸入來源、政策決策、工具結果與版本，且不暴露密鑰或不必要個資。

### 第 2 階段：有限寫入

- [ ] 每個寫入工具有 schema、最小 scope、冪等、timeout、額度、rate limit 與回復方案。
- [ ] 高影響動作採 step-up 或雙人核准；核准畫面顯示實際資源、參數與差異。
- [ ] 目標 API 獨立驗證權限，不把 Gateway 或模型輸出當成唯一信任來源。

### 第 3 階段：對抗與故障演練

- [ ] 測試網頁、Email、檔案、工具輸出、記憶與 Agent-to-Agent 的間接注入。
- [ ] 測試多工具組合、重播、競態、供應商失效、憑證撤銷與 kill switch。
- [ ] 將結果映射到 OWASP / MITRE ATLAS，但同時保留企業特有的 abuse case。

### 第 4 階段：小流量與持續治理

- [ ] 以 canary、低額度與明確退出條件上線，監控拒絕率、人工接手、越權、異常出口、成本與復原時間。
- [ ] 建立 on-call、事件分級、停用、通知、鑑識資料與復原 runbook，並定期演練。
- [ ] 模型、Prompt、工具、權限、記憶策略或供應商變更時重新跑安全回歸；定期清除不用的 Agent、工具與憑證。

## 延伸閱讀

- 先用 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 對齊模型、工具、狀態、評測與治理的整體架構。
- 若工具透過標準介面接入，接著看 [MCP：模型與工具之間的標準介面](/blog/34-model-context-protocol-mcp/)；協定一致不代表授權會自動安全。
- 需要把安全責任放進企業平台時，可延伸到 [Enterprise Agentic AI 控制面與治理](/blog/39-enterprise-agentic-ai-governance/)。
- 涉及程式執行或多租戶 runtime，參考 [EKS 多租戶 AI Agent Sandbox](/blog/54-eks-multitenant-ai-agent-sandbox-bitoclaw/) 的隔離取捨。

## 主要來源

- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [OWASP LLM06:2025 Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)
- [OWASP Agentic AI — Threats and Mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/)
- [NIST AI 600-1：Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)
- [NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)
- [MITRE ATLAS](https://atlas.mitre.org/)
- [RFC 8693：OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693.html)
- [SPIFFE Workload API](https://spiffe.io/docs/latest/spiffe-specs/spiffe_workload_api/)
- [AWS Security Reference Architecture for Generative AI：Agents](https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture-generative-ai/gen-auto-agents.html)
