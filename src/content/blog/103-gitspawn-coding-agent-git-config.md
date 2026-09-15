---
title: "GitSpawn：當 Repository 的 Git Config 先於 Coding Agent 的信任邊界執行"
description: "拆解 GitSpawn 如何透過 repository-local 的 core.fsmonitor 觸發背景命令，穿過 coding agent 的 workspace trust 與 approval 邊界，並整理 archive 交付條件、修補矩陣、安全重現界線與企業控制。"
pubDate: 2026-09-15
updatedDate: 2026-09-15
tldr:
  - "GitSpawn 的核心不是模型被 prompt injection，而是 Agent 啟動時背景執行的 Git 讀取了 repository 自己的 .git/config。"
  - "core.fsmonitor 原本是加速 index refresh 的正常 Git 設定；當它來自未驗證的 archive、shared drive 或 USB，卻可能讓 Git 以開發者權限執行外部命令。"
  - "一般 clone、fetch、pull 不會以同樣方式攜帶來源端的 local Git config；保留 .git 目錄的檔案搬運才是 brief 所描述的交付條件。"
  - "修補單一 sink 不等於完成治理：企業仍要在 Agent 開啟 repository 前驗證 provenance，隔離 Git 子程序，並撤銷不必要的 host、credential 與 network 權限。"
audience:
  - "負責 AI coding agent、developer platform 與 endpoint security 的工程師"
  - "需要制定 repository intake、Agent sandbox 與供應鏈治理政策的企業平台與安全團隊"
category: "Enterprise AI"
tags: ["AI Agent", "Enterprise AI", "AI 安全", "Governance"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 12
kind: "article"
showToc: true
image: "/blog/103-gitspawn-coding-agent-git-config/title_image.webp"
---

GitSpawn 值得注意的地方，不是又多了一種 prompt injection，而是它把問題推到了 prompt 之前：**repository 的 metadata 可能先取得執行權，Agent 的信任提示與工具核准才姍姍來遲。** Cloud Security Alliance（CSA）在 2026 年 9 月 3 日發布的研究 note，整理了 Manifold Security 對七個常用 AI coding agent 的八項相關發現；其中一條共同路徑是，Agent 為了知道目前 branch、diff 或 working tree 狀態，在背景呼叫 `git status` 或 `git diff`，而 Git 讀取了 repository 內的 `.git/config`。

這不是說每個 Git repository 都會攻擊你，也不是說 `core.fsmonitor` 這個效能功能本身有問題。真正的工程問題是：**一個會隨檔案一起被帶進工作目錄、又能命名外部程式的設定檔，是否在 provenance 尚未確認前就被當成可信的操作 metadata？** 本文沿著這條執行鏈拆解 GitSpawn，說明 `.git` 目錄如何影響交付風險、為什麼 approval prompt 可能看不見它、如何讀取 2026-09-01 的 patch matrix，以及企業該把控制點放在哪裡。

> **花花的一句話**
>
> 對 coding agent 而言，repository config 不是被動的文字內容，而是必須在信任建立前隔離的 executable input。

## 先看完整的執行鏈

GitSpawn 的最小威脅模型可以寫成四個相鄰階段：

| 階段 | 發生的事 | 為什麼容易被漏掉 |
| --- | --- | --- |
| 交付 | 使用者拿到一個保留 `.git` 目錄的 archive、shared folder、sync folder 或 USB copy | 大家通常只檢查 tracked files，忘了 `.git/config` 也被一起搬進來 |
| Agent 啟動 | Coding agent 在使用者輸入 prompt 前，或在顯示 workspace trust 前，收集 repository context | 這是產品的背景初始化，不一定被呈現成「執行 shell command」 |
| Git refresh | Agent 呼叫 `git status`、`git diff` 或其他會讀取 index 的操作 | 指令看起來只是查詢狀態，但 Git 會先 refresh index |
| 子程序執行 | Git 依 `core.fsmonitor` 指定的 helper 名稱啟動程式 | 執行點位於 Git 子程序，不在 Agent 對模型工具呼叫的 approval layer |

因此攻擊者不必先污染依賴、說服模型接受一段指令，或部署惡意 MCP server。只要能讓一個未驗證的 `.git/config` 到達開發者會開啟的目錄，並讓 Agent 的初始化路徑觸發 Git，就可能在「使用者還沒真正開始工作」的時刻跨過原本的控制面。實際能讀到哪些檔案、credential 或網路資源，仍取決於 Agent 的隔離方式與啟動該 Agent 的使用者權限；這不是每台機器都相同的固定 blast radius。

這也解釋了為什麼它不應被簡化成「Agent 沒有顯示 prompt 就執行命令」。更準確的描述是：**安全控制的觀察點和實際的執行點不在同一層。** Agent 以為自己只是問 Git 一個問題，Git 卻依 repository-supplied config 啟動了另一個程式。

## `core.fsmonitor` 原本是什麼？

Git 官方的 [`git-config` 文件](https://git-scm.com/docs/git-config) 將 `core.fsmonitor` 定義為檔案系統監控設定：它可以使用內建 monitor，或指定一個 fsmonitor hook command，協助 Git 找出自上次檢查後可能變動的檔案，避免每次都完整掃描大型 working tree。官方的 [`git update-index` 文件](https://git-scm.com/docs/git-update-index) 也說明，這項設定會在下一次讀取 index 的命令中生效。

這個設計本身合理，因為 Git 必須能讓受信任的開發者選擇 Watchman 等工具來改善大型 repository 的效能。風險出在設定的**來源與時機**：

1. repository-local 的 `.git/config` 不是開發者全域設定，而是跟著某個工作目錄走的狀態；Git 官方文件也把它與 user-level `.gitconfig` 分開描述。
2. `core.fsmonitor` 的值可以是外部 command 的 pathname。當 Agent 讓 system Git 直接讀取 repository config，這個 command 就進入了 Agent 的背景 context-gathering 路徑。
3. `git status`、`git diff` 這類看似唯讀的操作，可能先 refresh index；「查詢」不代表整條呼叫鏈沒有可執行副作用。

Manifold 對這個 sink 的建議是，在 Agent 的 Git 呼叫上明確覆寫設定，例如：

```sh
git -C /path/to/repository -c core.fsmonitor=false status --short
```

這是針對 `core.fsmonitor` 的具體緩解，不是通用的「所有 Git config 都安全」證明。Manifold 也特別提醒，其他會命名程式的設定可能有相同形狀；CSA note 則以 Claude Code 的另一條 `ultrareview` 設定路徑說明，修掉一個已知 sink 不一定消除了底層的信任假設。

## 交付條件：不是「clone 任何惡意 URL」

理解 delivery path 很重要，否則防禦會過度寬泛或誤判風險。Manifold 的研究指出，Git 自己不會在一般 clone、fetch、pull 中把來源端的 local `.git/config` 原封不動帶給你；這條路徑需要的是「以檔案搬運 repository，並保留 `.git` 目錄」。Goose 的 advisory 也列出 archive、shared volume、nested 或 auto-discovered repository，以及某些 CI checkout 作為需要逐一檢查的情境。

| 來源方式 | 是否保留來源端 local config | 工程判斷 |
| --- | --- | --- |
| 從已知可信 remote 重新 `clone` | 通常由本地 clone 重新建立設定 | 仍要驗證 remote、commit 與其他供應鏈輸入，但不是這個 local-config 搬運條件的同一條路徑 |
| ZIP、tar 或其他完整 archive | 若 archive 包含 `.git`，會保留 `.git/config` | 解壓縮後先 quarantine；不要直接在 Agent 工作目錄開啟 |
| shared drive、sync folder、USB | 以資料夾搬運時可能保留整個 `.git` | 把檔案交付視為 untrusted repository input |
| CI、nested repository 或自動發現的工作目錄 | 取決於 checkout／mount／discover 行為 | 以實際 Agent 與 runner 的流程測試，不要只看產品宣稱的 workspace trust |

換句話說，GitSpawn 的可利用條件不是「只要使用 Git 就會發生」，而是「一個 attacker-controlled local Git config 被放到 Agent 會直接使用的 repository 內」。這個條件在顧問把專案交給客戶、團隊用 ZIP 傳遞 prototype、或開發者從共用磁碟打開資料夾時都可能成立。

## 為什麼 workspace trust 與 approval prompt 可能來不及？

CSA note 將這條路徑描述為 Agent 的正常啟動或 context-gathering 行為：有些產品在使用者輸入 prompt 前就執行 Git，有些在 workspace-trust 尚未接受前觸發；Manifold 對 Goose 的具體觀察則是，`goose review` 為了整理 diff，在 model call、tool approval 與 trust prompt 前就透過 system Git 觸發了 helper。

這裡有三個需要分開的邊界：

- **Workspace trust** 決定使用者是否信任這個資料夾，但如果資料夾分析本身已經讓 Git 讀到可執行 config，trust UI 就不是第一個控制點。
- **Tool approval** 通常攔截模型提出的 shell 或 tool invocation；Git 由 Agent 自己的初始化程式啟動時，未必會重新經過同一個核准器。
- **Agent sandbox** 可能限制模型工具，但若背景 Git 與 helper 在 host 上以使用者權限執行，sandbox 的作用域就沒有覆蓋到真正的 child process。

這就是為什麼「我沒有批准任何危險命令」不能當成排除條件。成功執行的 command 可能繼承啟動 Agent 的使用者身分與環境，包括 SSH agent、雲端 credential、shell token 或同一顆磁碟上的其他 repository；哪些資源實際可用，要依作業系統、credential 注入和 sandbox 設計判斷。CSA note 截至發布時沒有報告 GitSpawn 在野外遭利用的證據，這個狀態也不應被寫成未來永遠安全的保證。

> **花花的工程提醒**
>
> Approval prompt 只能保護它看得到的執行點；只要背景初始化、Git 子程序或 downstream helper 在控制面之外，UI 顯示「等待你核准」並不等於尚未發生副作用。

## Patch matrix 要讀成時間切片

以下是 CSA note 與 Manifold disclosure 所記錄、以 2026 年 9 月 1 日為基準的八項 finding／七個 Agent 狀態。它是公開 disclosure 的 snapshot，不是 2026 年 9 月 15 日的即時版本清單；部署前仍須以各產品的最新 release note、security advisory 與實際 build 驗證。

| Agent | 路徑或 finding | 2026-09-01 狀態 | 證據與備註 |
| --- | --- | --- | --- |
| Claude Code | `core.fsmonitor` | Patched in `2.1.196` | Manifold reported 2026-06-26；CSA 列入已修補 |
| Claude Code | `ultrareview` 的另一個 config key | Unpatched on `2.1.252` | 不是同一個 `core.fsmonitor` sink；不要把前一列的修補當成全類別修補 |
| OpenAI Codex | related Git/config path | Patched | CSA matrix report：CLI `0.131.0`、Desktop `26.519.x`；版本需再向官方核對 |
| Cursor | `core.fsmonitor` | Patched | CSA／Manifold 的 disclosure matrix |
| Goose | `goose review` → `git diff` → `core.fsmonitor` | `<1.44.0` affected；`1.44.0` fixed | [Goose GHSA advisory](https://github.com/aaif-goose/goose/security/advisories/GHSA-r5pp-p5r8-466r)，CVE-2026-72718，CVSS 4.0 base 7.0 |
| Hermes Agent | `core.fsmonitor` | Unpatched on `0.21.0` | CSA／Manifold snapshot；CVE-2026-71963 由獨立 CVE authority 指派 |
| Qwen Code | `core.fsmonitor` | Unpatched on `0.22.3` | Manifold 表示在使用者 authentication 前可能觸發 |
| Grok Build | `core.fsmonitor` | Unpatched on `1.0.13` | Manifold 表示可在第一個 prompt keystroke、訊息送出前觸發 |

Goose 的 advisory 提供了最完整的單一案例：受影響版本是 `<1.44.0`，測試的 `1.41.0` 會在 `goose review` 收集 diff 時執行 repository 的 `core.fsmonitor`，修補版為 `1.44.0`。但這個 advisory 的修補只代表 Goose 這條已識別路徑，不代表所有 coding agent 或所有 Git config sink 都已經安全。

## 安全的 lab reproduction 邊界

若團隊需要確認自家 Agent 是否在 trust gate 前呼叫 Git，目標應是驗證**順序與隔離**，而不是製作可散播的 exploit。CSA、Manifold 與 Goose advisory 都提供了足以理解機制的公開證據；在沒有隔離環境時，不值得為了「再看一次」而把 payload 放進日常工作站。

一個合格的 lab 至少應符合：

1. 使用一次性的 VM 或專用測試主機，沒有 personal repository、SSH agent、cloud credential、provider API key、shell secrets 或 host home mount。
2. 使用 disposable repository 與本地 archive，網路預設封鎖或只允許觀測所需的 endpoint；不要把測試資料放在 shared drive、sync folder 或 CI production runner。
3. 只觀察無害的 marker、process trace 或 audit event，不讀取或外傳機密，不建立 persistence，不改檔、不刪檔，也不測試破壞性行為。
4. 固定 OS、Git、Agent 與 Agent 啟動方式，記錄「開啟資料夾 → trust prompt → model call → Git subprocess」的時間序；每個版本都要獨立記錄，不能用一個版本的結果推論整個產品。
5. 若無法確保上述隔離，就停在靜態檢查：先用檔案工具檢視 `.git/config`，再以顯式覆寫 `core.fsmonitor=false` 的方式做受控 Git 查詢，或直接交給供應商的 security test process。

這條邊界同樣適用於 incident response：若在真實工作站發現可疑 config，不要直接用 Agent「幫忙檢查」該目錄；先隔離副本、保存證據，再在無 credential 的分析環境處理。若已有不預期的 helper 執行，應依組織流程旋轉可能暴露的 token、檢查 child-process 與 network telemetry，而不是只刪除那一行設定。

## 企業控制：把 repository intake 當成 security gate

GitSpawn 最有價值的工程後果，是要求企業把「開啟 repository 之前」納入 Agent control plane，而不是只在模型收到 prompt 之後加 guardrail。可以用五層控制落地。

### 1. 來源與檔案交付

- 為 archive、shared folder、sync folder、USB 與 nested repository 建立明確的 untrusted intake 狀態；不因資料夾看起來像內部專案就自動信任。
- 在 quarantine 中檢查 `.git/config` 的來源、變更紀錄與 command-bearing settings。若只需要原始碼，優先移除 `.git` 後從可信 remote 重新建立 repository；若必須保留歷史，先由受控流程重新 hydrate，而不是把外來 `.git` 直接交給 Agent。
- 對 Agent 的所有 background Git call 使用 allowlist 或顯式 config override；`git -c core.fsmonitor=false ...` 可作為窄化控制，但不能取代對其他 config sink 的盤點。

### 2. Agent 與 Git 的隔離

- 使用 per-task ephemeral VM、container 或 OS sandbox，避免把整個 home directory、SSH socket、雲端 metadata endpoint 與其他 repository 掛進來。
- 以短效、最小 scope 的 credential 執行；對網路採 default-deny 與目的地 allowlist，讓即使有意外 code execution，讀取與外傳路徑也受到限制。
- 將 sandbox 邊界延伸到 Agent 啟動的 Git 與所有 descendant process，並在測試中確認 background context gathering 與 review command 也走同一個隔離層。

### 3. Vendor security contract

在採購或升級 coding agent 時，不只問「有沒有 workspace trust」。還應要求供應商說明：啟動前執行哪些 subprocess、Git config 是否被清洗、哪些 config keys 被覆寫、child process 是否 sandboxed、失敗時會怎麼處理，以及如何通知與驗證修補。安全測試要涵蓋沒有 prompt、沒有 model call、沒有 tool approval 的路徑；否則容易只測到最顯眼的 shell guardrail。

### 4. 觀測、版本與回應

集中記錄 Agent parent process、Git binary、working directory、config origin、child-process lineage、network egress 與 version。把公開 advisory 的版本矩陣當成輸入，而不是永久 allowlist；新版本上線前重跑 startup、review、nested repo 與 archive 測試。若發現可疑 helper 已執行，依 incident playbook 旋轉 token、檢查同一使用者可達的 repository 與 endpoint，並保留足以重建時間序的紀錄。

### 5. 把 metadata provenance 寫進治理政策

企業的 Agent policy 應明確定義：repository content、`.git` metadata、Agent skills、MCP server descriptor 和 plugin config 都是不同類型的 untrusted input；它們不能因為「看起來是設定」就跳過 provenance、review、pinning、sandbox 與 rollback。這個分層也延續 [企業 AI Agent 安全架構](/blog/43-enterprise-ai-agent-security/) 的原則：模型、工具、資料、執行環境與供應鏈需要分別建 threat model，而不是依賴單一 gateway。

## 從 GitSpawn 得到的架構判斷

GitSpawn 讓 Agent 的安全邊界多了一個常被忽略的前置層：**bootstrap trust boundary**。在 workspace trust 或 model approval 之前，平台已經決定要不要讀取 repository metadata、啟動 Git、載入 skills、解析 hooks 或建立任何 downstream process。這一層的責任不是模型能否拒絕 prompt，而是平台是否先完成 provenance、隔離與 deterministic policy check。

這和 [Enterprise Agentic AI governance control plane](/blog/39-enterprise-agentic-ai-governance/) 的分工一致：模型可以提出計畫，但身分、工具 scope、政策、稽核與 shutdown path 必須由模型外部的確定性元件負責。也呼應 [Claude Managed Agents 的 runtime control plane](/blog/88-claude-managed-agents-control-plane/) 對 provenance 的提醒：repository-supplied skills 與其他檔案輸入都要能被 pin、review、追蹤與撤銷。若要先補齊 Agent 的整體架構，可從 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 的 execution envelope、工具權限與 failure recovery 開始，再把 Git bootstrap 納入 envelope 的入口。

> **花花的判斷**
>
> GitSpawn 的長期教訓不是「永遠關掉 Git」，而是把 repository metadata 從便利的背景輸入提升為供應鏈資產：先驗證來源與隔離，再讓 Agent 取得 context。

## 給平台團隊的上線檢查表

在允許 coding agent 接觸外來 repository 前，至少確認：

1. 你能說出 Agent 在第一個 prompt 前會啟動哪些 Git 與其他 subprocess。
2. archive、shared drive、sync folder、USB、nested repo 與 CI checkout 的 `.git` 保留行為已被分別測試。
3. repository-local config 已被檢查或在不可信狀態下被隔離，且不只針對 `core.fsmonitor` 做單點假設。
4. Git 及其 descendant process 沒有不必要的 host home、SSH agent、長效 token、cloud metadata 或廣泛 network egress。
5. patch matrix 有 owner、版本 pin、回歸測試與停用／回滾流程；「patched」只代表指定版本與指定路徑已驗證。
6. incident response 能從 process tree、config origin 與 network log 重建發生了什麼，並在必要時旋轉可能暴露的 credential。

如果這六項仍答不出來，問題不在於要不要立刻禁止所有 AI coding agent，而在於目前的 control plane 還看不見 Agent 開始工作前的那幾秒。GitSpawn 將這個盲點變成一個具體、可測試、也可以透過架構修補的工程要求。

## 來源與證據邊界

- [Cloud Security Alliance AI Safety Initiative：GitSpawn research note](https://labs.cloudsecurityalliance.org/research/csa-research-note-gitspawn-ai-coding-agent-rce-20260903-csa/) — 2026-09-03 發布的主要研究 note，包含八項 findings、七個 Agent、交付條件、patch matrix 與企業建議。
- [Manifold Security：GitSpawn disclosure](https://www.manifold.security/blog/ai-coding-agents-git-hijack) — 2026-09-01 的技術揭露，說明背景 Git context gathering、`core.fsmonitor` sink、archive delivery 與各 Agent 的測試時間點。
- [Goose GHSA-r5pp-p5r8-466r](https://github.com/aaif-goose/goose/security/advisories/GHSA-r5pp-p5r8-466r) — 2026-07-24 發布的 Goose advisory，確認 `<1.44.0` 受影響、`1.44.0` 修補、CVE-2026-72718 與 `goose review` 的執行鏈。
- [Git `git-config` documentation](https://git-scm.com/docs/git-config) 與 [`git update-index` documentation](https://git-scm.com/docs/git-update-index) — Git 官方對 `core.fsmonitor`、local config 與 index refresh 的功能說明。

Patch 狀態、產品版本與「是否已在野外利用」都具有時間性；本文把它們限制在上述來源可驗證的 disclosure snapshot，不將其延伸成今日所有版本或未來版本的安全保證。
