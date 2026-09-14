---
title: "Forge v0.18.1：開源多使用者 MCP Auth 與 Agent Governance"
description: "拆解 Forge v0.18.1 如何把多使用者 MCP 的身分、OAuth 同意、租戶、政策、出口與逐次稽核串成可檢查的 Agent runtime contract，並標出尚未被獨立驗證的邊界。"
pubDate: 2026-09-14
updatedDate: 2026-09-14
tldr:
  - "Forge v0.18.1 的重點不是替 MCP 加一個登入按鈕，而是把 user principal 與 agent principal 分成兩條可觀測的 token／connection 路徑。"
  - "`auth.type: user` 以 `{subject, server}` 做 lazy consent 與 per-user connection pool；`type: platform`／2LO 讓 agent 以服務身分執行。"
  - "OAuth 2.1 discovery／DCR、PDP／DEFER、SOCKS5／private-CIDR egress 與 audit attribution 共同構成 runtime boundary，但不是 production security 證書。"
  - "採用時先驗證 consent、TTL／revocation、跨租戶、bypass、load／recovery；`forge try` 只適合本機 onboarding smoke test。"
audience:
  - "負責 Agent runtime、MCP integration 或 AI platform governance 的工程師"
  - "需要把開源 runtime 帶進多租戶或正式環境的架構師與安全團隊"
category: "AI Engineering"
tags: ["AI Agent", "MCP", "Enterprise AI", "Governance", "Platform Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 32
kind: "article"
showToc: true
image: "/blog/99-forge-mcp-auth-runtime/title_image.webp"
---

Forge v0.18.1 在 2026 年 8 月 20 日發布。官方 [v0.18.1 release notes](https://github.com/initializ/forge/releases/tag/v0.18.1) 將這一版定位成 delegated per-user MCP auth、OAuth 2.1 discovery／DCR、`forge try`，以及 egress、approval、PDP、audit 的一組 runtime 能力。它真正值得拆解的問題不是「MCP 有沒有 OAuth」，而是：**當同一個 Agent runtime 同時服務很多人時，誰的身分取得 token、誰同意、哪一條 connection 執行、哪一個 policy 決定放行，以及最後能不能把整次 invocation 串回同一條 audit trail？**

本文把證據分成三層：release note 與 changelog 是 Forge maintainers 的官方宣稱；v0.18.1 tag 的文件與原始碼是可檢查的實作細節；「這套設計適不適合你的 production boundary」則是 Bloss0m 的工程推論。開源代表可以閱讀與測試，不等於已完成獨立安全稽核或被證明能承受所有多租戶威脅模型。

> **花花的一句話**
>
> Forge v0.18.1 的核心不是把 Agent 變得更有權限，而是把「以誰的身分、經過哪個同意閘門、用哪個工具連線」變成 runtime contract。

## 先把 user principal 與 agent principal 分開

多數 MCP 範例只有一個 server credential，所以「Agent 呼叫工具」看起來像單一事件；多使用者部署則至少有兩個 principal：代表整個服務的 agent principal，以及提出這次請求的 user principal。兩者若共用 token 或共用 connection，稽核上就很難回答「這次寫入到底是誰授權的」。

Forge v0.18.1 的 managed config 用 `auth.type` 把這個邊界寫進 server definition。下面是依照官方 [MCP configuration reference](https://github.com/initializ/forge/blob/v0.18.1/docs/mcp/configuration.md) 縮寫的示意，不是可直接貼上的完整設定：

```yaml
platform:
  token_endpoint: ${INITIALIZ_TOKEN_ENDPOINT}
  agent_identity: ${FORGE_PLATFORM_TOKEN}
  authorize_endpoint: ${INITIALIZ_AUTHORIZE_ENDPOINT}

mcp:
  servers:
    - name: vendor-read
      url: https://mcp.example.com/read
      auth: { type: platform, ref: vendor.tools }
      required: true
    - name: vendor-write
      url: https://mcp.example.com/write
      auth: { type: user, ref: vendor.tools }
      required: false
      tools:
        schemas: []
```

| 邊界 | `auth.type: user` | `auth.type: platform` 或 `oauth` + `client_credentials` |
| --- | --- | --- |
| token principal | 由已驗證 request 解出的 user subject；managed mode 交給 platform broker | Forge agent identity 或 OAuth client 本身 |
| connection | 每個 requesting subject 一條 lazy connection；不同 subject 不共用 | 通常在啟動時建立並重用服務 connection |
| consent／啟動 | 首次呼叫沒有 grant 時進入 auth-required；`required: true` 不適用 | 沒有每位使用者的 delegated consent；`required: true` 可以成立 |
| token failure | 401／403／404 代表尚未取得 delegated grant，會觸發 gate | startup 或 call-time 的 credential／protocol error，按服務身分處理 |

這個差異帶來一個容易漏掉的設定限制：`type:user` 沒有 user token 或 live connection 可在 startup 取得 tool schema，因此需要預先提供 `tools.schemas`。Forge 可以先從 registry materialize schema、註冊工具；真正的 per-user connection 則在第一次 call 才建立。schema 是部署時的 snapshot，如果上游 MCP server 後來改工具，必須重新 materialize 或 redeploy，不能把它當成每次 call 都會自動同步的 discovery。

`ref` 也不是使用者名稱，而是 platform tool registry 的 key；如果省略，預設以 server name 對應。`type: platform` 使用 agent credential 呼叫 platform token endpoint；`type:user` 則額外帶上 `subject`，讓 platform 決定該使用者是否有 grant。這是「agent 代表 user」與「agent 以自己的服務身分」兩條真正不同的授權路徑。

## OAuth 2.1 discovery／DCR 是登入時協定，不是每次 request 的授權

Forge 的 standalone `forge mcp login` 會依序處理明確設定、已保存的 registration，再進入 discovery。可檢查的 v0.18.1 實作大致串起這條鏈：

1. 先用 RFC 9728 protected-resource metadata 找 authorization server；metadata 可以來自 well-known URL 或 401 response 的 `WWW-Authenticate: resource_metadata`。
2. 再用 RFC 8414 authorization-server metadata（必要時 fallback 到 OpenID Connect configuration）取得 authorize、token 與 registration endpoint。
3. 若 server 支援 RFC 7591 DCR，第一次 login 以 public PKCE client 取得 client ID，將 registration 與 endpoint 加密保存；client secret 不被持久化，confidential registration 會 fail closed。
4. 沒有 registration endpoint 又沒有明確 `client_id` 時，login 失敗，而不是猜一個 client 或放寬驗證。headless refresh 也不會臨時啟動 discovery。

這條流程服務的是 interactive standalone login。managed `auth.type: user` 不在每個 runtime pod 重新做 discovery，而是呼叫 platform 的 token／authorize broker。platform 端持有 provider callback、refresh token 與租戶規則；Forge 收到的只有短效 access token，官方文件也明確要求不要把 refresh token 放進 Forge 的 endpoint response。

如果是 standalone 的 agent principal，`auth.type: oauth` 搭配 `grant: client_credentials` 是另一條 2LO 路徑：需要明確的 `client_id`、`client_secret_env`、`token_url`，不會開 browser，也沒有 per-user consent。這個分類很重要，因為「支援 OAuth discovery」不代表所有 MCP call 都會有 end-user identity。

## 四個 runtime 元件：resolver、gate、pool、audit

### 1. Resolver 把 user token 與 agent token 分開

managed token endpoint 收到的是 `{server: ref}`（agent principal）或 `{server: ref, subject}`（delegated user）。請求帶 platform agent identity 的 bearer，以及可選的 `Org-Id`／`Workspace-Id` tenancy headers。endpoint 回傳 `access_token` 與可選的 `expires_in`；若省略，Forge 以五分鐘作預設。

v0.18.1 的 `SubjectTokenStore` 預設是 process 內記憶體快取，只保存 access token、不保存 refresh token；過期時會清除，並在到期前約 30 秒提早重新取得。delegated token 還有五分鐘的 cache TTL 上限，即使 provider 給的 lifetime 更長，也會讓 platform 在這個視窗內重新決定 grant 是否仍有效。這是良好的斷線上限設計，但不是即時 revocation 的保證：下游、platform、cache 與 replica 的行為仍要實測。

若 deployment 有多個 replica 或需要 restart 後仍保留 grant，應換成 shared／durable store，並測試 token rotation、跨 replica 的 cache miss 與撤銷。`${VAR}` endpoint／identity 在 request/use 時展開，因此旋轉 platform secret 不必依賴整個 runtime 重啟；這仍不代表已解決 secret manager、audit redaction 或 process memory 的風險。

### 2. Auth gate 把「尚未授權」變成可恢復狀態

當 delegated token resolver 得到 401、403 或 404，Forge 將它分類為 `ErrNoToken`，而不是立刻把工具呼叫判成永久失敗。auth gate 以 `{subject, server}` 去重：第一個 waiter 將 task 標成 `auth-required`、發出一次 `mcp_auth_required` 並交付 consent；同一位使用者對同一個 server 的併發 calls 共用這個 gate。

`POST /mcp/consent` 只接受已驗證的 `{subject, server, granted}` 訊號，不攜帶 token。platform 必須先能從 token endpoint 回傳 access token，才應送出 `granted:true`；Forge 收到後會重新 resolve token 並喚醒所有 parked calls。`granted:false` 讓等待中的 call 快速失敗；timeout／canceled 則產生對應 audit event。這把「使用者已經完成 provider OAuth」與「某一個工具操作該不該放行」分成兩件事。預設 gate 等待十分鐘。

### 3. Subject pool 把 identity 綁在 connection

`subjectConnPool` 的語意不是一個更大的共用 connection cache，而是每個 user subject 一條獨立的 MCP connection。第一次使用會在該 subject 的 auth identity 下執行 factory 與 `Initialize`，之後重用；同一 subject 的 burst 由 single-flight 合併成一次建立，不同 subject 不互相阻塞。連線錯誤可 `Evict`，讓下一次 call 重新建立；`Close` 則會拆掉所有 subject connections。

實作還刻意用 background-derived context 與約 30 秒的 establish timeout，避免某個 caller 在共用 connection 建立中取消，就把其他等待者一起砍掉。這是有意義的 concurrency contract，但也提醒我們：MCP server 若把 connection state 當成 user session，就必須測試 server 端 identity binding、重連後的狀態與跨 pod routing，不能只測 token endpoint 回了 200。

### 4. Audit 把 invocation 串起來，但不是資料內容記錄器

MCP tool call、tool result、auth required／resolved／timeout、PDP decision、DEFER、egress allowed／blocked 等事件都可以帶著同一組 correlation ID、task ID 與 invocation-scoped monotonic sequence。MCP tool audit 預設只記錄 arguments size、result size、duration 與 reason，不把完整 arguments／results 寫進 audit；這降低資料暴露，但會讓事後重播需要額外的受控 evidence。

另一個不能忽略的例外是 raw SOCKS5：no-auth SOCKS5 沒有像 HTTP proxy 的 `Proxy-Authorization` identity channel，因此 egress audit 只能可靠地記 host:port 與 allow／deny，無法保證每個 socket 都有同一個 task／invocation attribution。若你的合規要求是每個外連 socket 都可回到使用者與任務，這是必須補強或限制的缺口。

## 一次 delegated MCP tool call 的完整生命週期

把上述元件放回一次 request，可以得到一條可測試的 runtime contract：

1. **建立 request context。** 入站請求先經過 authentication；Forge 從 context 取 email（優先）或 opaque user ID 作為 subject，同時保留 org／workspace、task ID、correlation ID 與 invocation ID。
2. **選出 namespaced tool。** Agent 看到的是已註冊的 MCP tool；`server__operation` 之類的名稱只是 routing identity，不應被當成 authorization 本身。
3. **先過 execution policy。** runner 的 hook 順序包含 guardrails、intent alignment、step-up，再到 managed PDP 或 static DEFER。PDP 回 `allow`、`deny` 或 `defer`；transport timeout、malformed response 與 unknown decision 都 fail closed，且只做一次 transport retry。
4. **若是 DEFER，先停在操作 approval。** static DEFER 以 task ID 與 tool allowlist 做一次任務級決策，經 `POST /tasks/{id}/decisions` approve／reject。它問的是「這個 tool action 現在可不可以做」，不是「這個 Agent 能不能以 user 身分登入 MCP server」。
5. **Resolve user credential。** `type:user` 向 subject token store 查找；cache miss 時，Forge 以 agent bearer、`server`、`subject` 與 tenancy headers 呼叫 platform token endpoint。401／403／404 代表尚未有 grant，進入下一步；其他 protocol failure 應直接報錯。
6. **進入 auth-required gate。** gate 以 `{subject, server}` 合併併發等待，更新 task state，交付 platform 的 authorize URL 或其他 consent prompt。URL 是 opaque delivery；Forge 不應看見 provider authorization code 或 refresh token。預設 gate timeout 到期後，parked calls 失敗並留下 `mcp_auth_timeout`。
7. **consent 後重新 resolve。** 使用者完成 platform-owned OAuth callback 後，platform 先把 delegated access token 放到自己的 custody，再呼叫已驗證的 `POST /mcp/consent`。Forge 被喚醒後重新取 token，而不是相信前一個 grant signal 永遠有效。
8. **建立或重用 subject connection。** pool 在該 subject 的 credential 下 lazy initialize MCP server，接著執行 tool call。所有 MCP HTTP、token、authorize traffic 都走同一套 egress controls；raw TCP 則受 SOCKS5 port／CIDR 規則約束。
9. **收束 invocation。** allow／deny、auth gate、egress、tool result 與 task outcome 用 correlation／task／sequence 串起來；需要內容證據時，另外使用受控 trace，而不是假設 audit event 會保存完整 tool payload。

這裡有一個關鍵排序：managed PDP 的 `BeforeToolExec` 在 MCP tool 執行前；MCP auth gate 則包在 MCPTool 的 resolve→CallTool sequence 內。因此「PDP allow」只代表 policy 允許進入工具路徑，不代表 user 已完成 MCP consent，也不代表下游 server 一定接受這個 subject 的 token。

## Gate、DEFER 與 PDP 是三種不同決策

把它們都叫「approval」會讓 rollout 變得模糊。v0.18.1 的程式碼與文件可以用下表區分：

| 機制 | key | 問題 | 典型結果 |
| --- | --- | --- | --- |
| MCP auth gate | `{subject, server}` | 這個 user 是否已授權 Agent 代表自己連到這個 MCP server？ | grant／reject／timeout；一次 grant 可喚醒同一 subject/server 的 parked calls |
| Static DEFER | `taskID`，再套 tool allowlist | 這個 task 的這次高風險 tool action 是否需要人工核准？ | approve／reject；以 task 為範圍 |
| Managed PDP | `agent`、task、invocation、tool、parsed args | 在目前 policy context 下，tool call 是否 allow、deny 或 defer？ | `allow`／`deny`／`defer`；失敗時 default-deny |

runner 的實作是「一個決策來源」：如果 `security.pdp.enabled`，managed PDP 優先，static `security.defer.tools` 會被忽略；不能想當然以為兩張規則表會自動取聯集。PDP request 的 `caller.subject` 在 v0.18.1 實作中是 `agent:<agentID>`，不是入站 end-user subject；user subject 主要驅動 delegated token resolver。本文的工程推論是：若你的 PDP 需要真正做 per-user authorization，必須明確把 user／tenant identity 以受信任 context 傳入並驗證，不能只看「有 PDP」這個開關。

另外，PDP 會收到完整 parsed arguments。這使它能做精細 policy，也把敏感資料帶出 runtime pod；PDP endpoint 應放在內部受 TLS 保護的網路，並為 secrets、個資與大型 payload 設計 redaction 或 schema-aware policy。MCP audit 不記完整 arguments，不等於 PDP 不會看到它們。

## Egress 是 auth boundary 的一部分

Forge 會把 MCP server、OAuth discovery／authorize host、platform resolver host 與 MCP HTTP traffic 放到同一個 egress-controlled client。HTTP forward proxy 與 optional SOCKS5 raw TCP listener 共用 SafeDialer 的 matcher：private CIDR 可以額外縮窄，cloud metadata 與 loopback 永遠封鎖；malformed CIDR 在 config load 時失敗。

SOCKS5 的 allowlist 是 host:port 或 wildcard 加 exact port。這裡有個很實際的陷阱：HTTP 的 `allowed_hosts` 是 port-agnostic，列出 `api.example.com` 讓 HTTPS 可達時，也可能讓同一 hostname 透過 SOCKS5 連到其他 TCP port。需要 port-level control 時，應明確填 `allowed_tcp`，並測試 wildcard、DNS、redirect 與 private IP 的組合。`socks5h://` 讓 server-side resolver 查 DNS；即使 client 先自行解析，SafeDialer 仍應在 IP／private-CIDR 層阻擋未允許目標。

這個設計把「可連到哪裡」納入 runtime contract，但不會自動回答「這個 user 是否有權呼叫該 API」。egress allow、MCP delegated token、PDP allow 與下游 service authorization 是四個不同的 gate，應在 audit 與測試中分開觀察。

## Rollout／migration checklist

- [ ] 先畫出每個 MCP server 的 principal：哪些 read／write 操作需要 end-user delegation，哪些只需要 agent service identity。
- [ ] `type:user` 使用 `required:false`，預先 materialize 並版本化 `tools.schemas`；測試 schema stale、工具 rename 與上游 capability 變更。
- [ ] 對 token endpoint 做 contract test：agent／delegated request body、`Org-Id`／`Workspace-Id`、401／403／404、`expires_in`、secret rotation，以及「只回 access token、不回 refresh token」。
- [ ] 決定 managed 或 standalone consent。若是 managed，確認 platform callback、grant persistence、delivery channel 與 tenant binding；若是 standalone，特別測試單次、會過期、與 session 綁定的 consent capability link 是否可能外洩。
- [ ] 測試同一 subject/server 的 gate fan-out、grant／reject race、timeout、caller cancellation、restart 與多 replica；需要跨 pod 時不要依賴預設 in-memory token store。
- [ ] 驗證五分鐘 delegated TTL cap 與 downstream 401 後的 evict／reconnect 行為；把「短效」當成需要測量的 property，不是 revocation SLA 的替代品。
- [ ] 選定唯一 policy source：PDP 或 static DEFER。測 allow／deny／defer、fail closed、approver allowlist、完整 args 的 redaction，以及 user identity 是否真的進入 policy context。
- [ ] 對 HTTP 與 SOCKS5 分別測 host、port、private CIDR、metadata／loopback、DNS、redirect 與 audit attribution；如果要求 per-invocation socket attribution，限制 raw no-auth SOCKS5 或補上 identity channel。
- [ ] 先用 `forge try --audit` 建立本機 smoke baseline，再在 staging 以真實 MCP server 驗證 consent、token、pool、policy、egress 與 recovery；不要把 `forge try` 的成功當成多租戶安全證據。

## Failure modes 與 operational trade-offs

| Failure mode | v0.18.1 路徑 | 團隊要處理的 trade-off |
| --- | --- | --- |
| delegated endpoint 回 401／403／404 | 分類成 `ErrNoToken`，park 在 `{subject, server}` gate；超時後失敗 | 使用者體驗是可恢復的，但需要可靠 consent delivery 與明確 timeout；不能用 404 掩蓋所有 protocol error |
| consent signal 先到、token 尚未可取 | resume 後重新 resolve；仍無 token 就再次等待／失敗 | grant notification 與 token custody 必須有順序保證，否則會出現「已同意但仍卡住」 |
| token 被撤銷或下游回 401 | cache TTL 與 connection eviction 讓下一次重新取得 | 五分鐘 cap 降低 stale window，卻增加 token endpoint 流量；要用測試確認 revoked token 不會從 pool 繼續送出 |
| 多 replica 使用預設 in-memory store | 每個 process 只看得到自己的 token／gate／connection state | 簡化部署換來 restart 與跨 pod 的一致性風險；shared store 也帶來 encryption、locking 與 failure mode |
| PDP timeout、malformed 或未知 decision | default-deny，最多一次 transport retry | 安全性偏 fail closed，但 provider／PDP 故障會直接降低任務可用性；需有可觀測的 denial reason 與 fallback policy |
| PDP 與 static DEFER 同時設定 | PDP enabled 時 static map 被忽略 | 配置看似更完整，實際可能讓操作者以為有兩層 approval；應在 CI 檢查唯一 decision source |
| DCR 缺 registration endpoint，或只接受 confidential client | discovery／login fail closed | 可互通性下降，但不應為了登入成功而把 client secret 或未知 callback 變成持久化風險 |
| `allowed_hosts` 意外放寬 SOCKS5 port | HTTP hostname allowlist 可能跨到任意 TCP port | 方便與精確隔離互相拉扯；高風險服務應用 `allowed_tcp` 做明確 port boundary |
| raw SOCKS5 沒有 invocation identity | audit 仍可記 host:port 與 decision，但不保證 task／user attribution | 網路通要和合規可追溯分開評估；必要時停用 raw path 或在上游代理補強身份 |

## `forge try` 是 onboarding ladder，不是 auth security test

`forge try` 的價值在於讓工程師快速看到 Forge runtime，而不是宣稱多使用者 MCP 已被驗證。官方 CLI reference 描述它會在不到一分鐘內啟動 keyless demo agent，帶 weather skill 與 `http_request`、`datetime_now`、`math_calculate` built-ins；它使用與 `forge run` 相同的 tool registry、egress、audit 與 progress hooks，但在 process 內執行，不啟動 A2A server、daemon 或 port。

可以先跑：

```bash
forge try
forge try --audit
forge try --once "what's 17% of 4,200?"
forge try --keep
```

credential resolution 依序看 explicit flags、環境變數 API key、保存的 OpenAI OAuth、local Ollama 與 picker；除非使用 `--keep`，一般不會把暫存 workspace 留在磁碟。要測真正的 `auth.type:user`，應以 `--keep` 保存本機配置，加入受測 MCP server，再刻意測「無 grant → consent → token → per-user connection → tool call」的完整路徑。即使這條 smoke test 通過，也只證明本機 happy path 可走，不包含繞過測試、租戶壓力、replica recovery 或獨立安全審查。

## 限制：可檢查的 code 不等於已證明的 production security

這篇依 v0.18.1 release、changelog、repository docs 與 tag source 做靜態分析，沒有把 maintainers 的描述升格成外部驗證。至少有幾個邊界必須保留：

- 沒有獨立 security audit、公開 penetration／bypass 測試或完整 threat-model coverage。
- 沒有公開的多租戶負載、token leakage、replica restart、gate recovery、connection isolation 或 provider interoperability 數據。
- standalone consent link 在文件中被視為 bearer capability；若 delivery 或 link 洩漏，可能造成錯誤的 subject association。managed platform-owned callback 能縮小這個邊界，但部署者仍要驗證 tenant、session 與 delivery binding。
- PDP 的 v0.18.1 request 把 caller subject 表示成 agent principal；是否足以支援你的 end-user authorization，不能從「PDP enabled」推導，必須檢查 adapter 與 policy input。
- open-source 讓團隊能看見 resolver、gate、pool、egress 與 audit 的控制點；它不保證上游 provider、部署設定、secret store、網路與下游 API 已經安全。

因此，Forge v0.18.1 最合理的定位是：一個把多使用者 MCP 授權與 Agent governance 寫成可閱讀 runtime contract 的開源基線。它值得拿來做 architecture spike 與 contract testing，但正式採用的 proof obligation 仍在每個團隊自己的 threat model、tenant model、SLO 與 incident response。

## 延伸閱讀

- [AI Agent 完整指南：從模型到可治理的 Agent 系統](/blog/64-ai-agent-guide/)
- [Model Context Protocol（MCP）規格與實作脈絡](/blog/34-model-context-protocol-mcp/)
- [Enterprise AI Agent Security：工具、權限與執行邊界](/blog/43-enterprise-ai-agent-security/)
- [Agentic AI 平台契約：把能力、政策與證據接起來](/blog/93-agentic-ai-platform-contract/)

## 來源與證據界線

- [Forge v0.18.1 release notes](https://github.com/initializ/forge/releases/tag/v0.18.1)
- [Forge changelog](https://useforge.ai/changelog/)
- [Forge repository](https://github.com/initializ/forge)
- [Delegated consent documentation at the v0.18.1 tag](https://github.com/initializ/forge/blob/v0.18.1/docs/mcp/delegated-consent.md)
- [MCP configuration reference at the v0.18.1 tag](https://github.com/initializ/forge/blob/v0.18.1/docs/mcp/configuration.md)
- [Per-subject connection pool implementation](https://github.com/initializ/forge/blob/v0.18.1/forge-core/mcp/subject_pool.go)
- [Auth gate implementation](https://github.com/initializ/forge/blob/v0.18.1/forge-cli/runtime/mcp_authgate.go)
- [Managed PDP resolver](https://github.com/initializ/forge/blob/v0.18.1/forge-cli/runtime/pdp_resolver.go)
- [Egress control documentation](https://github.com/initializ/forge/blob/v0.18.1/docs/security/egress-control.md)
- [Forge CLI reference for `forge try`](https://github.com/initializ/forge/blob/v0.18.1/docs/reference/cli-reference.md)
