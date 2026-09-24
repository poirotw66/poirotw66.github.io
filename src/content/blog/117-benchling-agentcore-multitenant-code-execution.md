---
title: "Benchling 如何用 AgentCore、STS 與 DNS Firewall 隔離多租戶程式執行"
description: "拆解 Benchling 在獨立 AWS 帳戶執行 AI 產生程式碼的分層設計：每工作臨時憑證、S3 endpoint policy、DNS allow-list 與持續外洩測試。"
pubDate: 2026-09-24
updatedDate: 2026-09-24
tldr:
  - "Benchling 把不可信程式執行放進獨立 AWS 帳戶，再以每工作 STS 臨時憑證縮小到單一租戶資料範圍。"
  - "DNS Firewall、S3 VPC endpoint policy、路由、NACL 與 security group 分別限制不同通道，整體效果來自多層控制。"
  - "AWS 與 Benchling 報告的流量和零事件數字是客戶案例數據；公開文章沒有提供可重跑的 Benchling 範例。"
audience:
  - "設計多租戶 AI Agent、科學運算或程式碼沙箱的工程師"
  - "負責雲端安全、IAM 與平台可靠性的架構師和資安團隊"
category: "Cloud & Platform"
tags: ["AI Agent", "Enterprise AI", "AWS", "Platform Engineering", "Governance"]
cluster: "ai-platform-governance"
clusterRole: "case"
clusterOrder: 18
kind: "article"
showToc: true
image: "/blog/117-benchling-agentcore-multitenant-code-execution/title_image.webp"
---

多租戶產品讓 AI Agent 執行使用者產生的程式碼時，安全問題不只在容器能否互相隔離，也包括程式碼能否碰到別的租戶資料，或透過網路把結果送出去。Benchling 與 AWS 在 2026 年 9 月 21 日公開的案例，將 AgentCore Code Interpreter 放在獨立的「不可信程式」帳戶，再組合每工作臨時憑證、S3 VPC endpoint policy、DNS Firewall 和網路層限制。這是一種可供架構檢視的防禦縱深模式，不是單靠一個 DNS 規則即可證明任何外洩途徑都不存在。

> **花花的一句話**
>
> 多租戶程式沙箱的安全邊界要同時回答「這個工作能讀誰的資料」和「這個工作能把資料送去哪裡」。

## 案例證據與適用範圍

AWS Machine Learning Blog 文章由 Benchling Application Security Engineer Jeremy Stashewsky、AWS Solutions Architect Meghana Sreenivas 與 AWS Senior Solutions Architect Anil Gurrala 共同撰寫，發布日期是 2026 年 9 月 21 日。文中把需求描述為讓 Agent 產生的科學程式碼在數千個生命科學租戶之間執行，同時避免租戶互相看見資料、限制未授權網路連線，並且不為每個租戶建立一個 IAM role。

以下架構細節、驗證方式和營運數字都來自這篇 AWS／Benchling 客戶案例。AWS 的 [AgentCore Code Interpreter 文件](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-tool.html)與[在 VPC 中設定 AgentCore Runtime 和工具](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-vpc.html)可用來核對產品和 VPC 設定能力；[Route 53 Resolver DNS Firewall 規則動作](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-rule-actions.html)、[VPC endpoint policy 文件](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-access.html)和 [STS AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)則說明相關 AWS 控制的語意。這些獨立 AWS 文件能證明服務機制，不會獨立驗證 Benchling 的部署或測試結果。

公開文章沒有附上 Benchling 可直接執行的 repository、完整 policy、部署模板或 CI 測試套件；本文也沒有找到可核實的公開 runnable sample。若要重現，工程團隊仍須依自己的資料模型、帳戶結構和威脅模型建置並測試。

## 從工作派送到資料回傳的路徑

依案例文章描述，資料路徑可以拆成五步：

1. **Production Account 決定工作範圍。** Benchling 的正式環境選出工作需要的租戶資料，不把主要客戶資料庫或 production credentials 直接交給不可信程式。
2. **以 STS 建立每工作臨時權限。** 派送時產生並注入該次工作所需的短期憑證，session policy 將 S3 存取限制在授權 bucket 內的租戶路徑前綴。AWS 說明 `AssumeRole` 的 session policy 會與角色 identity policy 取交集，因此它用來再縮限既有權限，不會擴大角色權限。
3. **在另一個 AWS 帳戶啟動 Code Interpreter。** AgentCore Code Interpreter（ACCI）位於專供不可信執行的 Untrusted Code Account。該帳戶另有 ACCI 執行角色，與 production 帳戶角色分開；每次工作在隔離、短生命週期的執行環境中處理。
4. **資料只走核准的 S3 endpoint。** VPC 中區域內 S3 存取走 Gateway endpoint，跨區 S3 存取走 Interface endpoint。Endpoint policy 列出允許的 bucket，再與 IAM 和 S3 資源政策共同限制請求。AWS 特別指出，endpoint policy 是額外的存取邊界，不能取代 IAM 或 bucket policy。
5. **結果沿核准路徑返回呼叫端。** 工作可讀取其租戶範圍內的必要資料並回傳結果；它沒有通往任意公開網路的預設路由。這是案例所描述的控制目標，並不代表其他帳戶端、憑證外洩或應用層傳輸風險因此自動消失。

分離帳戶的價值是把不可信執行環境從主要 production 資源隔開；每工作憑證負責「身分有權做什麼」，endpoint policy 再限制「經這個網路出口能到哪些 S3 bucket」。若只有廣泛角色權限，即使容器彼此隔離，遭入侵的工作仍可能有跨租戶讀取的憑證路徑；若只有 endpoint policy，也不能因此略過 IAM 和 bucket policy 的正確設定。

## DNS、路由與封包層的分工

案例中的 VPC 沒有 Internet Gateway 或 NAT Gateway。DNS Firewall 規則群組以數值由小到大評估，因此文章列出三層順序：

- **Priority 10：** 先明確拒絕已知惡意網域，提供威脅情報快速封鎖與可觀測的拒絕紀錄。
- **Priority 100：** 只允許工作需要的 S3 endpoint 網域及明確核准的必要網域。
- **Priority 200：** 對其餘查詢套用 catch-all 拒絕，回覆 NODATA。AWS 文件定義 NODATA 是表示查詢成功但沒有可回覆資料；它不是通用的「封包不可能離開」證明。

若程式的 DNS 查詢經過該 VPC 的 Route 53 Resolver，未列入 allow-list 的名稱會在解析階段被拒絕，讓使用 DNS 子網域承載資料的常見外傳方式受阻。這個控制只涵蓋經過該解析器和規則群組的 DNS 查詢。DNS Firewall 本身無法證明對任意 IP 直連、其他解析途徑、應用層通道或控制設定錯誤的普遍防護；因此案例另外描述了網路封包限制：

- ACCI 專用 security group 只開必要的 outbound TCP 443，且沒有預設的 fallback 規則。
- Prefix-list routing 將可達路徑限制到 VPC endpoints；沒有 IGW 或 NAT 的預設外網路徑。
- NACL 限制允許的連線埠為 443 與 ephemeral return ports。
- VPC endpoint policy 限制透過該出口可使用的 S3 buckets，並與每工作 STS 權限疊加。

由此可見，「DNS 解析拒絕」只是鏈條中的一環。即使應用程式繞過名稱解析嘗試直接連 IP，仍需要路由、NACL、安全群組和 endpoint 邊界共同阻擋；反過來，任一條規則若過度開放，也會改變實際防護範圍。實際部署應盤點每個可能出口，而不能把 DNS Firewall 的 NODATA 回覆當成全網路封鎖的同義詞。

## 持續驗證比一次性設定更接近安全證據

Benchling 文章稱，Product Security 團隊先在 proof-of-concept VPC 測試各層，再將外洩模擬納入 CI。案例列出的測試包括：以編碼子網域模擬 DNS tunneling、直接連線未授權 endpoint，以及嘗試存取 endpoint policy 範圍外的 S3 bucket。文章表示，若測試查到不該解析的網域、連到外部 endpoint，或把資料移出核准 bucket，pipeline 就會失敗並阻擋 release。

這組測試的重點是把網路設定視為會變動的程式邊界：新增 endpoint、更新 IAM policy 或調整 VPC 時，都可能意外擴張可達範圍。工程團隊可以依同一原則維護自己的負向測試，但應記錄測試使用的 DNS 解析器、路由、角色 session、endpoint policy 和預期拒絕結果。案例文章並未公開 Benchling 的測試程式碼或覆蓋率，也沒有獨立第三方重跑結果，所以這是客戶報告的驗證流程，不是外部安全認證。

## 成效數字與營運代價

AWS／Benchling 表示，這套架構自 2026 年 4 月初部署後，每天處理超過 600 個程式執行 session，每週服務超過 250 個不同租戶，並回報零起安全事件與跨租戶資料外洩。這些都是該客戶在 AWS 案例中的報告數字，沒有公開事件定義、稽核資料或獨立驗證；不應外推成其他組織的容量承諾或「零風險」證明。

這種隔離也有持續營運成本。多帳戶和兩種 S3 endpoint 需要帳戶治理、網路路由、DNS 清單、角色政策與 log 的共同維護；跨區 Interface endpoint、持續測試、拒絕事件調查及新服務接入都會增加費用或交付時間。最小 allow-list 減少出口，也會讓合法新需求必須經過安全審查和回歸測試。AgentCore 管理沙箱生命週期可省下自行維護執行環境的工作，但不會代替客戶維護 VPC、資料範圍、政策和驗證套件。

> **花花的工程提醒**
>
> 把一組測試加入 CI 不是永久安全保證；測試必須真的穿過正式相同的 DNS、路由、NACL、security group、endpoint policy 和臨時憑證路徑，否則只是在驗證測試環境本身。

## 導入時可以先檢查什麼

若要評估類似架構，先把以下問題變成可驗證的負向案例：

- 工作被錯誤派給另一個租戶時，production 端如何阻止產生或注入錯誤範圍的憑證？
- STS session 的有效期、S3 prefix 和角色上限權限是否都符合最小權限？
- Gateway 與 Interface endpoint policy、IAM policy、bucket policy 是否彼此一致？
- 未核准網域、任意 IP、跨區目的地與非 S3 AWS endpoint 分別會在哪一層被拒絕？
- VPC 或 IAM 變更是否會觸發同一組外洩模擬，且失敗會阻止上線？
- 團隊是否能從 DNS Firewall、VPC Flow Logs 和 AWS API audit logs 分辨預期拒絕與異常嘗試？

對 Agent 架構的權限與執行層，可接著看[AI Agent 完整指南](/blog/64-ai-agent-guide/)；要比較企業 AgentCore 的控制邊界，參考 [AWS AgentCore 文件漂移案例](/blog/111-aws-documentation-drift-agentcore/)；MCP 工具權限可延伸閱讀 [GitHub MCP 的企業控制](/blog/87-github-mcp-enterprise-controls/)，而 [Agentic CI runtime 契約](/blog/116-github-agentic-workflows-runtime-contract/)則討論如何把允許、觀測、評分與復原變成可檢查的執行證據。

## 來源

- Jeremy Stashewsky、Meghana Sreenivas、Anil Gurrala，AWS Machine Learning Blog，2026-09-21：[How Benchling secured multi-tenant AI agents with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/machine-learning/how-benchling-secured-multi-tenant-ai-agents-with-amazon-bedrock-agentcore/)。
- AWS：[AgentCore Code Interpreter](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-tool.html) 與 [AgentCore VPC configuration](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-vpc.html)。
- AWS：[Route 53 Resolver DNS Firewall rule actions](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-rule-actions.html)、[VPC endpoint policies](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-access.html)、[STS AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)。

客戶案例可提供一個具體的隔離設計和驗證思路；真正可依賴的安全界線仍須由部署團隊用自身資料、網路與憑證路徑持續測試。
