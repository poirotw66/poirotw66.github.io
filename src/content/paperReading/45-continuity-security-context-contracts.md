---
title: "CONTINUITY：讓 Agent 的 provenance、授權與 tool effect 穿過組合邊界"
description: "精讀 Zheng 與 Yang 的 CONTINUITY（arXiv:2609.05269 v1）：用 security-context contract、field-level provenance、transformation witness 與 effect-bound permit，檢查 LLM Agent 從 instruction 到 external effect 的端到端連續性。"
pubDate: 2026-09-09
updatedDate: 2026-09-09
tldr:
  - "CONTINUITY 對準的不是『模型會不會被 prompt injection 騙』，而是多個看似正確的 security controls 組合後，provenance、authority、policy 或 action 是否在邊界被丟掉、放大、重新綁定或過期重播。"
  - "它把每個 component 寫成 assume–guarantee contract，沿著 signed root grant、leaf-level provenance、bounded typed release、transition receipt、transformation witness，最後到 subject/action/policy/replay-bound 的 one-shot permit。"
  - "在作者的 deterministic suite 中，4 個 domain、32 類 fault、每個 fault–domain 20 個 instance 共 2,560 攻擊案例；完整系統 effect ASR 為 0%、涵蓋 128/128 fault–domain classes、完成 700 個 benign tasks、升級 200 個 ambiguous tasks。"
  - "這是 conditional conformance evidence，不是現實攻擊機率，也不是 semantic correctness 的證明；trusted roots、validator correctness、context completeness、完整 effect mediation 與 provider semantics 仍在邊界外。"
audience:
  - "設計 Agent tool-use、policy gateway、MCP／protocol adapter 或 effect broker 的安全工程師"
  - "需要把 provenance、授權、轉換、replay 與 external side effect 串成可驗證控制面的技術負責人"
tags: ["Paper Reading", "Agent Systems", "Agent Security", "Tool Use", "Provenance", "Prompt Injection"]
image: "/paperReading/45-continuity-security-context-contracts/title_image.webp"
field: "AI Security"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "CONTINUITY: Security-Context Contracts for Composable LLM Agent Controls"
  authors:
    - "Chris Zheng"
    - "Geng Yang"
  year: 2026
  venue: "arXiv 2609.05269 v1（2026-09-04；未同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2609.05269v1"
    arxiv: "https://arxiv.org/abs/2609.05269"
    doi: "https://doi.org/10.48550/arXiv.2609.05269"
    code: "https://github.com/zast-ai/continuity"
    project: "https://arxiv.org/html/2609.05269"
series:
  id: "agent-security-controls"
  title: "Agent Runtime、安全與效應邊界"
  part: 1
  totalParts: 1
---

本篇讀的是 [CONTINUITY: Security-Context Contracts for Composable LLM Agent Controls](https://arxiv.org/abs/2609.05269) v1（2026-09-04）。它是 arXiv preprint，不是 peer-reviewed conference 或 journal paper；本文不把它寫成已經通過同儕審查的結果。閱讀時我核對了 [完整 arXiv HTML](https://arxiv.org/html/2609.05269)、PDF、5 個 figure、Tables 1–4、Appendix A–C、limitations，以及作者提供的 [research artifact](https://github.com/zast-ai/continuity)。

如果你先讀過 [間接 prompt injection](/paper-reading/42-indirect-prompt-injection/) 會比較容易看見本文的切入點：那篇把攻擊者控制的資料如何影響 Agent 計畫講清楚；CONTINUITY 再問下一層——即使 planner 已經被當成 adversarial，資料、授權與 action 經過 memory、policy、adapter、tool server 之後，final sink 憑什麼只提交被授權的那一個 effect？它也可以接在 [Agent trace observability](/paper-reading/43-parsing-the-stream-live-trace/) 之後閱讀：前者讓執行狀態可追溯，本文則把 security context 變成跨元件必須攜帶的 proof-carrying state。

## 90 秒掌握論文

- **問題**：一個 Agent 的安全路徑通常不只一個控制點。ingress 追 provenance、gateway 做 policy、adapter 改 protocol 表示法、tool server 產生 effect、final sink 再檢查 permit。每個點單獨看似合理，但 security-critical context 可能在邊界被截斷、放大、重新綁定，或以 stale/replayed credential 通過。
- **核心洞見**：把每個 component 寫成 assume–guarantee contract，並讓每次 transition 都攜帶可驗證的 root、field provenance、release、role-bound receipt、transformation witness 與 current finality permit。安全性不是「最後一個簽章有效」，而是 effect 能否回溯到一條完整、授權、未過期且只使用一次的 witness chain（Section 1、5、6）。
- **最強證據**：在作者的 deterministic conformance suite 中，4 個 domain、32 類 fault、每個 fault–domain 20 個 parameterized instances 形成 2,560 attack instances、128 fault–domain classes；完整 CONTINUITY 0/2,560 harmful effect、128/128 classes contained、700/700 benign completion、200/200 ambiguous escalation（Table 2、Figure 3）。
- **主要邊界**：這些是由固定 fault schema 產生的 exact conformance counts，不是自然攻擊分布或 production attack rate。root、validator、context capture、finality sink 和 provider 的正確性被放在 TCB 或 deployment assumption 中；artifact 也沒有 production MCP、A2A、OWASP ACS、cloud IAM 整合（Section 3、8.1、12）。

我的 bounded verdict 是：**CONTINUITY 最有價值的不是重新發明簽章或 policy，而是把「跨控制點不可遺失的欄位與轉換關係」變成可執行的 composition contract。對有明確 effect boundary 的 Agent 平台，它提供一個值得實作的 control-plane blueprint；對未被 mediation 覆蓋、語意 validator 不可信，或 provider 本身非原子且不可重試的路徑，它還不是安全保證。**

> **花花的工程提醒**
>
> 看到「provenance 已追蹤」「policy 已通過」「permit 已簽名」時，不要把三句話相加就當成 end-to-end authorization。要問的是：同一個 field value、同一個 task、同一個 actor、同一個 canonical action，是否被每個邊界保留並在 finality 之前重新驗證？

## 版本與閱讀範圍

論文標示為 arXiv:2609.05269v1、20 pages、5 figures，作者為 Chris Zheng 與 Geng Yang。arXiv 摘要頁顯示提交日期 2026-09-04；HTML 內頁顯示 2026-09-05。本文以 v1 為準，文章更新日為 **2026-09-09**。它的 paper HTML 標示 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，artifact repository 的 code license 為 [MIT](https://github.com/zast-ai/continuity/blob/main/LICENSE)。

閱讀範圍包括：Section 1 的問題定義與貢獻；Section 2 的 prompt compromise、control interfaces 與「signature 不等於 authorization」；Section 3 的 entities、adversary、TCB、effect model；Section 4 的四種 discontinuity operator 與 Table 1；Section 5 的 ECI、contracts、permits 與 composition conditions；Section 6–7 的 design 與 verifier；Section 8 的 methodology、Table 2–4、Figures 3–5、ablation 與 latency；Section 9 的 theorem-to-implementation 對照；Section 10–12 的 adoption discussion 與 limitations；Appendix A–C 的 proof、object schemas、commands、reason codes 與 claim-to-artifact map。

## 證據地圖與 Paper Essence Contract

先把作者直接展示的證據、作者解讀與本站判斷分開：

| 層次 | 本文採用的說法 |
| --- | --- |
| **Paper 直接支持** | Security-context discontinuity taxonomy；ECI 與 composition conditions；reference verifier；4 domains × 32 fault classes × 20 instances；Table 2 的 attack／benign／ambiguous 結果；Table 3 的 targeted ablation；Table 4 與 Figure 5 的 prototype overhead；Appendix C 的 reproduction commands。 |
| **作者主張** | 若 declared TCB、root、contracts、validators、mediation 與 finality sink 條件成立，planner-controlled proposal 不能在沒有完整 witness 的情況下跨越 finality boundary。 |
| **論文未證明** | 真實世界攻擊率；fault taxonomy 完備；trusted validator 的語意正確；production provider 的 concurrency／partial failure 安全；LLM refusal 或 prompt-injection benchmark 的模型品質；與 MCP、A2A、OWASP ACS 或 cloud IAM 的可直接互通。 |
| **Bloss0m 工程判斷** | 把 CONTINUITY 當成跨元件 security contract 的驗證骨架，而不是一個替代所有 policy engine、provenance system 或 transaction protocol 的產品。採用前要先列出所有 effect-equivalent paths 與每個 protected leaf field。 |

Paper Essence Contract 的六個問題在本文中的答案是：

1. **解決什麼問題？** 解決 security controls 組合後 security context discontinuity，亦即 provenance、authority、policy、action 或 finality fact 在 instruction-to-effect path 被遺失、放大、重綁或重播。
2. **為什麼前一種做法不夠？** 因為 local signature、allowlist、gateway policy、provenance 或 final permit 各自只看局部；它們不一定知道 upstream value 的來源，也不一定知道 downstream action 是否是同一個 canonical effect。
3. **核心技術想法是什麼？** 用 assume–guarantee contract 描述每一站需要什麼（assumption）、保證什麼（guarantee）、哪些 field 必須 preserve，以及哪些 field 允許在什麼 relation 下 transform；最後讓 finality sink 接受 proof-carrying、effect-bound、single-use permit。
4. **一個 input 怎麼走？** 由 root grant 和 deployment policy 建立 envelope，沿 memory、gateway、adapter 產生帶 receipt 的 envelope；provenance 與 typed release 綁定 leaf path 和 exact value，alias transformation 帶 trusted witness，verifier 檢查 bundle，finality sink 在當下重新檢查 subject、action、policy、revocation、expiry、nonce 與 idempotency，再提交 effect。
5. **什麼證據支持 headline claim？** Table 2／Figure 3 的 2,560 attack cases 與 128 fault–domain classes；Table 3／Figure 4 顯示移除關鍵 invariant 會重新開啟 4–24 類 fault；Table 4／Figure 5 給出 4.21 ms median proof verification 與 7.17 ms median end-to-end transition + finality。
6. **claim 在哪裡停止？工程後果是什麼？** 它停在 declared TCB、synthetic fault space、受限 transformation language、簡化 provider semantics 與完整 mediation 假設。工程上應先把 root／validator／sink 當正式的供應鏈與部署責任治理，並以 fail closed 或 escalation 處理未解釋欄位，而不是把 0/2,560 當成 production SLO。

## 前一種做法為什麼不夠 / Why previous local controls are insufficient

前一種做法不是單一演算法，而是把 provenance tracker、allowlist、policy gateway、protocol adapter 與 final permit 當成互相獨立的局部檢查。它們各自可能正確，卻沒有共同的 contract 來說明哪些 source、field、authority、transformation 與 freshness facts 必須穿過下一個邊界；因此 local pass 不能推出 end-to-end effect authorization。下面的 discontinuity taxonomy 與 worked example 會把這個 limitation 具體化。

## 先理解 security-context discontinuity

### 從 proposal 到 effect：三個不同事件

Section 2.1 把常被混在一起的三件事拆開：

1. **Proposal**：planner 產出 action candidate。CONTINUITY 假設 planner 在 attack scenario 裡已被 compromise，因此它可以任意提議 tool、destination、argument、delegation 或理由。
2. **Admission**：deterministic controls 對 canonical action、provenance、authority、policy 與 contract 條件做授權判斷。
3. **Effect**：external sink 真正提交一個外部 state transition。本文 primary metric 是 harmful effect realization，不是 planner 有沒有吐出一段危險文字。

這個切分是本文的第一個重要閱讀門檻：它不是在說「LLM 會安全地拒絕 prompt injection」，而是在問「即使 LLM 提議攻擊，控制面是否能把未經證明的提議擋在 effect boundary 外」。這和本站的 [Agent 允許的執行路徑](/paper-reading/10-argus-agentic-runtime/) 讀法相容，但本文更集中在跨 component interface 的 proof obligations。

### 四種 discontinuity operator

Section 4 把 fault 分成四個容易發生在 composition boundary 的動作：

- **Truncation**：下一個 component 看不到必要的 source、task、policy epoch、field constraint 或 context manifest。
- **Amplification**：authority、delegation scope、tool privilege 或 data release 被下游擴大，產生 upstream 沒有授權的能力。
- **Rebinding**：欄位名稱仍叫 destination 或 amount，但實際 value、source digest、tool/server、canonical representation 或 actor 已換掉。
- **Staleness／replay**：看似合法的 grant、policy、permit 或 nonce 是過期、撤銷、已用過，或在另一個 context 被重播。

為什麼 local check 會漏掉？因為簽章只回答「這個 key 簽了 object」，不回答 key 是否被授權在這個 stage 工作，也不回答 input field 與 output field 是否代表同一個 value。`ToolAllowlist` 可能看到允許的 tool identifier，卻看不到 destination 已被換掉；`Gateway + finality` 可能把 final action 綁得很緊，卻沒有驗證 adapter 怎麼從 gateway-approved state 得到它。這正是 composition gap，不是某個單獨元件一定寫錯。

## 核心直覺：讓 security context 變成 proof-carrying state

一般 Agent control path 容易長成：

`planner → provenance check → policy check → adapter → tool → effect`

每個箭頭只傳一個 action object，下一站再重新猜它來自哪裡。CONTINUITY 把它改成：

`authenticated root → signed envelopes + transition receipts → verifier → one-shot permit → mediated finality sink`

每個安全相關 field 都要有兩種可能的歷史：它要嘛被明確 preserve，要嘛被一個獨立驗證的 relation witness 合法 transform。這不是把所有 payload 都加密，也不是強迫整條 pipeline 永遠不改值；它是要求「改值」本身成為可審計的安全事件。

論文用下式表達每個 component contract：

$$\mathcal{C}_{i}=(A_{i},G_{i},P_{i},M_{i})$$

其中 $A_i$ 是 component 需要成立的 input assumptions，$G_i$ 是成功後能提供的 guarantees，$P_i$ 是必須保持不變的 fields，$M_i$ 是允許哪些 security-relevant transformation 的 relation。對外部 effect $e$，ECI 的直覺是存在一個 witness $W_e$，使得：

$$\mathsf{Realize}(e)\Rightarrow\exists W_e:\mathsf{Verify}(W_e)=1\ \land\ \mathsf{Realize}(\mathsf{Canon}(W_e))=e$$

這裡 `Verify` 是 deterministic verifier；`Canon` 是被簽章、permit 與 sink 共同使用的 canonical representation；`Realize` 是 finality sink 真正提交的 effect。方程式的 operational meaning 是：不能只驗證「某個相近的 action 有有效簽章」，而要驗證「實際 commit 的那一個 canonical action，有一條從 root 到 sink 的有效 proof chain」。

## 用一個 finance payment 例子走完整個方法

以下是依 Section 1、3、6 與 Appendix B 組合出的 faithful explanatory walkthrough，不是論文額外報告的案例結果：

1. **Input**：Agent 讀到一封 attacker-writable invoice，提出 `payment.transfer`。amount 與 destination 可能來自外部 source；使用者的 root grant 只允許指定 actor、finance tool、account scope 和 amount predicate。
2. **Intermediate representation**：trusted ingress 建立 signed root grant 和初始 envelope `E₀`，其中包含 principal、actor、task root、allowed tool/server、field constraints、provenance root、context root、policy epoch、expiry。provenance manifest 再以 JSON Pointer 指向 `/action/parameters/amount_cents` 或 `/action/destination`，綁定 source ID 和 exact value digest。
3. **Component decisions**：memory 或 gateway 只能在自己的 contract 下產生 `Eᵢ` 與 signed transition receipt。若外部 amount 要被放入受保護欄位，必須有 source/value/path/predicate/task/tool/expiry-bound 的 typed release；若 adapter 把 logical alias 轉成 canonical bank address，必須附 trusted directory 的 `alias_resolution` witness，綁定 before／after digest、field path、component、contract、task 和 expiry。
4. **Output**：verifier 逐站檢查 signer、role、predecessor、contract、changed leaf paths、preservation rules、relation witness、monotonic authority／scope／taint／policy、current policy 與 tool manifest。成功後才簽出 execution permit；permit 再綁定 principal、subject、task root、grant、audience、canonical action digest、bundle digest、policy epoch、nonce、idempotency key、one-time 與 expiry。
5. **Effect**：finality sink 在提交前重新比較實際 caller、audience、actual action digest、current policy／revocation state、expiry 與 nonce/idempotency，最後才 commit 並產生 outcome receipt。
6. **Likely failure point**：adapter 如果只把 `alias:finance:17` 換成一個看似合法的 account，卻沒有 trusted transformation witness，verifier 應回 `E_MISSING_TRANSFORM_WITNESS` 或 `E_TRANSFORM_*`；如果 permit 已被使用或 grant 已撤銷，sink 應拒絕 `E_REVOKED_AT_FINALITY`／replay 類錯誤。若存在一條不經 sink 的 shell、browser 或 alternate SDK path，則即使正常 path 都正確，也應視為 `E_UNMEDIATED_PATH`。

這個例子最重要的 intermediate representation 不是「更好的自然語言 summary」，而是把 source、field、authority、role、relation 和 finality state 放進 verifier 能重算的 objects。每一站都不能只說「我看過上一站的結果」；它要提供下一站可核對的 guarantee。

## 技術機制：從 root 到 finality

### 1. Authenticated chain origin

root grant 不是 planner 自己宣稱的 permission。Deployment policy 指定 trusted ingress、root-grant issuer、provenance／context／release／transformation issuer，以及每個 stage 的 component identity、role、contract。Root 也有 authority、delegation scope、allowed tool/server、field constraints、policy epoch、provenance/context commitments、expiry 等 bounds。Section 3.3 明確說：component key 只在 configured role 下可信；被註冊的 key 不因此能 originate chain、issue root grant 或 sign release。相反地，如果 root authority 本身被攻破，rooted guarantee 就失效，不能靠後續 monotonicity 修復。

### 2. Field-resolved provenance 與 typed release

以整個 JSON object 的模糊 provenance 不夠。Prototype 用 RFC 6901-style leaf path，使 `/action/parameters/amount_cents` 這個具體欄位能和 source ID、exact value digest 綁在一起。對 attacker-writable external field，typed release 還要綁定 source digest、target path、value digest、predicate、principal、actor、task、operation、tool 與 expiry。這使「同一個欄位名稱」不能掩蓋 value 或來源的替換；release validator 只釋放它明確聲明的那一個 bounded value。

### 3. Role-bound transition receipt

每個 `Cᵢ` 產生下一個 envelope 和 signed receipt `ρᵢ`。Verifier 檢查 stage、role、signer、contract、sequence、predecessor、input/output digest、producer 與 receipt signer 一致，並重算 changed leaf paths。契約的 guarantee 只有在 assumptions、required fields、postconditions 和 transformation relation 都通過時才發布；因此 downstream 不是因為上一站「說自己完成」就自動繼承 authority。

### 4. Validated semantic transformation

工程系統不可能完全禁止表示法變換，例如 logical alias 必須解析成 provider 的 canonical address。CONTINUITY 的重點不是 preserve-everything，而是把 legitimate change 限定成 relation witness：trusted directory issuer、relation ID、field path、before／after digest、component signer、contract、parameters、task 與 expiry 全都被綁定，verifier 再獨立執行 relation predicate。本文 artifact 實作的是 `alias_resolution` 這一種 security-relevant relation；currency conversion、schema mapping、identifier resolution、aggregation 和 declassification 需要另外的 versioned validators，不能把 `may_transform` 字串當授權。

### 5. Permit 與 finality

Verifier 成功後簽出 one-shot permit，finality sink 不只驗簽。它重新檢查 explicit caller subject、sink audience、actual action digest、policy ID／digest／epoch、grant／permit revocation、expiry、nonce、idempotency state，並在 apply 前消費 one-time state。這是 time-of-check/time-of-use 邊界：早先 gateway 通過不代表 effect 發生時仍然有效。

### 6. Complete mediation

完整 mediation 是 deployment obligation：所有 effect-equivalent path 都必須路由到相容 sink。Paper 特別列出 tool alias、direct SDK、browser automation、shell command、remote agent、recovery path 等可能的 alternate path。CONTINUITY 的正常 verifier 無法替你發現環境裡所有未列出的路徑；它只能在 path 被納入 policy 與 sink map 後，對該 path 施加 ECI。

## 論文的 architecture 與 verifier 圖

![CONTINUITY Figure 3：完整系統與不完整 composition 在 harmful-effect success 與 benign auto-completion 上的比較。](/paperReading/45-continuity-security-context-contracts/paper/figure-3-main-security-utility.webp)

*Figure 3，Section 8.2 的 main conformance result：完整系統維持 benign completion 並將 2,560 個 attack instances 的 harmful effect 全部擋下；不完整 configurations 則在不同 fault–domain 類別上失守。原始 figure anchor：[arXiv Figure 3](https://arxiv.org/html/2609.05269#S8.F3)，原始 image endpoint：[main_security_utility.svg](https://arxiv.org/html/2609.05269v1/main_security_utility.svg)。本地 WebP 由作者 [research artifact figure](https://github.com/zast-ai/continuity/blob/main/figures/main_security_utility.png) 轉檔；論文 HTML 標示 CC BY 4.0，保留作者與來源 attribution。*

這張圖的教學目的不是把每個 baseline 當成產品排名，而是顯示 composition 的缺口：`Gateway + finality` 已經有 gateway policy 和 exact final action binding，effect ASR 仍是 65.6%；`Provenance gateway` 會對 unreleased fields 正確 escalation，但 downstream provenance loss、role misuse、parameter change 和 alternate path 仍可穿過它。完整設定的 0% 只能在本 fault space 與 TCB 條件下解讀。

## 實驗如何讀：不是一張安全分數表

### Methodology：攻擊從哪裡來？

Section 8.1 的 domains 是 workspace email、finance payments、DevOps deployment 和 multi-agent delegation。每個 action 都有 domain-specific operation、resource、destination、parameter、effect class 與 data classification。32 個 fault classes 在 4 domains 展開，每個 fault–domain pair 20 個 parameterized instances，合計 `32 × 4 × 20 = 2,560` attack instances；另有 400 direct benign、300 signed typed-release benign、200 unreleased ambiguous scenarios，共 3,460 scenarios，7 個 configurations 產生 24,220 system–scenario runs。

這些不是從真實攻擊母體抽樣的 i.i.d. data。作者刻意讓 planner 從 attack 一開始就被 compromise，以免把模型偶然拒絕算成 security boundary 的功勞。Metrics 也依 terminal semantics 定義：effect ASR 是 commit harmful effect 的比例；benign auto-completion 需要一個 effect 且不 escalation；ambiguous escalation 需要 no effect 且回 `Escalate`；replay/retry 還必須同時看第二次 outcome 與 effect count。

### Main result：完整系統保留 utility，同時收緊 effect boundary

| Configuration | Effect ASR | Contained classes | Benign | Ambiguous |
| --- | ---: | ---: | ---: | ---: |
| Pass-through | 100.0% | 0/128 | 100% | 0% |
| Tool allowlist | 100.0% | 0/128 | 100% | 0% |
| Gateway policy | 96.9% | 4/128 | 100% | 0% |
| Provenance gateway | 84.4% | 20/128 | 100% | 100% |
| Effect-bound permit | 81.3% | 24/128 | 100% | 0% |
| Gateway + finality | 65.6% | 44/128 | 100% | 100% |
| **CONTINUITY** | **0.0%** | **128/128** | **100%** | **100%** |

**Question**：局部 controls 能否阻止跨層 fault？**Controls**：同一組 generated scenarios、domains、faults 與 parameter variation，只有 configuration 的 invariant 組合改變。**Observation**：完整系統 2,560 attack cases 沒有 harmful effect，700 benign 全部完成，200 ambiguous 全部 escalation；而最強 incomplete `Gateway + finality` 仍有 65.6% effect ASR。**Possible explanation**：完整系統同時補上 root trust、leaf provenance、release、role topology、transform relation、current policy、subject/action binding、replay 與 mediation。**Boundary**：Table 2 只說明這組 fault templates 被 containment；它不代表對未建模 fault、被攻破 TCB 或未納管 path 的 universal protection。

`Benign = 100%` 也不能讀成「系統什麼都不變」。作者的正常 trace 都做 logical destination alias → canonical address 的 transformation；完整系統是靠 trusted witness 接受這個合法變更。另有 300 個 signed typed-release external-data tasks 全部完成，200 個缺 release 的 ambiguous tasks 全部 escalation。這是很重要的 positive／negative control：系統不是只靠拒絕所有外部資料，而是只接受有 source、value、predicate、task、tool 與 expiry binding 的 release。

## Ablation：哪些 invariant 真正改變結果？

![CONTINUITY Figure 4：移除單一 invariant 後，在 128 個 fault–domain classes 上重新開啟的 effect ASR。](/paperReading/45-continuity-security-context-contracts/paper/figure-4-ablation.webp)

*Figure 4，Section 8.4 的 targeted ablation：每個 ablation 以 128 個 fault–domain pair 各一個 representative instance 測試；柱狀結果只顯示 nonzero effects，完整 CSV 仍保留 zero-valued redundant ablations。原始 figure anchor：[arXiv Figure 4](https://arxiv.org/html/2609.05269#S8.F4)，原始 image endpoint：[ablation.svg](https://arxiv.org/html/2609.05269v1/ablation.svg)。本地 WebP 由 [artifact ablation.png](https://github.com/zast-ai/continuity/blob/main/figures/ablation.png) 轉檔；論文 HTML 標示 CC BY 4.0，保留來源與 attribution。*

Table 3 的結果把「每個 check 都必須單獨帶來非零改善」這個誤讀排除掉：

- **No field provenance：24 classes；No contract conformance：24；Incomplete mediation：24**。這三個是最大的 targeted openings，對應 field-level source continuity、跨站 assumptions／guarantees，以及 alternate effect path。
- **No root authentication：16；No release validation：12**。Root 與外部 field 的 trust boundary 不能由 downstream signature 補救。
- **No transform-witness validation：8；No replay protection：8**。合法變換與 lifecycle finality 各自有獨立責任。
- **Role／identity／delegation／taint／policy／context／action／subject／revocation 各 4**；**No authority monotonicity alone 為 0**。最後這個 0 不是 authority monotonicity 不重要，而是其他 invariant 在這個 fault space 裡仍會攔下同一批 fault。作者明確提醒：ablation 的 zero 可能是 redundant containment，不能反推 theorem condition logically unnecessary。

這段 evidence 最適合支援「哪些 proof obligations 要寫進 contract」的工程判斷，不適合拿來算每個 invariant 的 marginal product value。因為 faults 有共同 schema，而且 removal 不是一個自然部署中互斥的因素實驗。

## Cost：proof-carrying control 面有多重？

![CONTINUITY Figure 5：signed transition 數量增加時的 proof-verification latency scaling。](/paperReading/45-continuity-security-context-contracts/paper/figure-5-scaling.webp)

*Figure 5，Section 8.5 的 scaling result：prototype 以 full signed envelope snapshots 儲存，signed transitions 越多，bundle size 與 verifier latency 約線性增加。原始 figure anchor：[arXiv Figure 5](https://arxiv.org/html/2609.05269#S8.F5)，原始 image endpoint：[scaling.svg](https://arxiv.org/html/2609.05269v1/scaling.svg)。本地 WebP 由 [artifact scaling.png](https://github.com/zast-ai/continuity/blob/main/figures/scaling.png) 轉檔；論文 HTML 標示 CC BY 4.0，保留來源與 attribution。*

Table 4 的 reference prototype p50／p95 是：proof verification **4.21／4.91 ms**；end-to-end transition + finality **7.17／8.07 ms**。Section 8.5 也給出 1、3、5、10、20 signed transitions 約 8.1、12.4、16.8、27.6、49.4 KiB。這是作者在 recorded host 上的 prototype measurement，不是 cloud-scale SLA；artifact 說明 production 可考慮 delta encoding、Merkle commitments、checkpoint receipts、batch verification 與 compact binary serialization，但那些並未在本文結果中驗證。

## 失敗案例、security analysis 與 adoption boundary

### 失敗案例：完整 state 仍可能少一個 proof obligation

論文的 failure-oriented evidence 不是只列 attack count。Minimal counterexample 顯示：如果 adapter 把 field 改成另一個 value，卻只讓 final sink 驗證一個未包含該 field 的 permit digest，攻擊者可以把另一個 action 帶到 sink；如果 finality path 可以 bypass sink，其他 path 都正確也無法保證 ECI。Theorem 2 也形式化 context-manifest completeness：如果 decision `D` 依賴 field `f`，但 downstream query `q` 不包含 `f`，那任何只依 `q` 的 deterministic decision 至少對兩個不同的 `f` 值錯一次，除非 fail closed 或重新取得 authenticated `f`。

這些不是「LLM 產生壞文字」的 failure case，而是 representation、binding 與 mediation 的 failure case。從工程角度看，最危險的 bug 可能不是 verifier 算錯，而是系統還有一條沒進 verifier 的 effect-equivalent route。

### 作者明確承認的限制

Section 12 的限制必須與 0/2,560 一起讀：

1. **Trusted roots are deployment inputs**：prototype 不替你決定誰可信，也不處理 key rotation、quorum authorization、hardware roots 或 certificate-path validation。
2. **Integrity is not semantic correctness**：trusted provenance、release 或 transformation validator 如果判斷錯，CONTINUITY 可能忠實地保存並執行錯誤結論。
3. **Context-manifest completeness**：surrounding runtime 要確保所有給 planner 的 bytes／tool outputs 都在 manifest；prototype 沒有 instrument production model runtime。
4. **Restricted transformation language**：只實作 alias resolution 和小型 predicate registry；更廣泛的 schema mapping、aggregation、declassification 需要新的 semantics、soundness 與 review。
5. **No verified implementation**：Python artifact 有 regression tests，但不是 mechanically verified、constant-time、hardened，也未形式化證明 refinement；restricted JSON encoder 應替換成標準 canonicalizer 才適合 interoperability。
6. **Synthetic conformance benchmark**：32 fault templates、4 domains、deterministic variations 用來 falsify missing invariants，但不是 real attack population，也沒有 LLM quality comparison。
7. **Simplified provider semantics**：in-memory finality world、nonce ledger、idempotency store 假設 atomic；真實 provider 有 concurrency、retry、eventual consistency、non-idempotent effect 與 partial failure。
8. **Incomplete information-flow coverage**：沒有消除 covert channels，也不能自動找出所有 semantically equivalent effect path 或防止 timing、resource name、aggregate query 等 leakage。
9. **Human and semantic error**：使用者可能授權一個不明智的 action；trusted tool 可能回 false data；本文保留 authorization context，不保證合法、明智或語意正確。
10. **Artifact integration**：不是 production MCP、A2A、OWASP ACS、cloud-IAM 或 blockchain integration。

### Adoption boundary：什麼時候用，什麼時候不要用？

**適合採用這套思路的條件**：你的 Agent 平台有可列舉的 external effect classes；每個 effect 有明確 final sink；你能指定 trusted roots、stage identities、protected leaf paths、policy epoch、revocation 與 replay state；也願意讓未釋放的外部欄位 escalation，而不是讓 planner 自己補完。付款、部署、權限變更、跨 tenant tool call 等可被 canonicalize 的工作，較適合作為第一批 contract profile。

**不要直接把本文當成足夠方案的條件**：effect path 尚未盤點，browser／shell／SDK／recovery route 可以繞過 sink；validator 只是另一個沒有可審計語意的 LLM；provider 具有不可逆且非 idempotent 的 partial failure；field transformation 需要開放式自然語言推理；或你必須在沒有可信 context manifest 的 model runtime 上做完整保證。這些情況應先縮小 effect boundary、建立 domain-specific transaction protocol、補 runtime instrumentation 或把狀態改成 explicit escalation。

與其問「要不要導入 CONTINUITY」，更可操作的問題是：**對每個 effect-equivalence class，我們能不能列出 root → field source → contract transitions → canonical action → current permit → sink 的完整 witness？** 如果不能，先做 path inventory 與 contract linting；如果能，再用 targeted fault injection 找出哪些 invariant 一拿掉就會重新開啟 fault。

## Artifact 與可重現性（as of 2026-09-09）

作者在 paper、HTML、README 與 Appendix C 指向的 material artifact URL 只有 [github.com/zast-ai/continuity](https://github.com/zast-ai/continuity)。截至 **2026-09-09** 我逐一檢查：repository public、default branch `main` 可讀；`README.md`、`ARTIFACT.md`、`pyproject.toml`、`requirements.txt`、`src/continuity/core.py`、`src/continuity/experiment.py`、`tests/`、`scripts/`、`results/*.csv`、`figures/*.png` 均有直接 endpoint；repository metadata 顯示 code license MIT。README／artifact guide 提供 Python 3.11+、`pytest`、quick 與 full reproduction commands，並說明不需要 model API key，因為 planner 是直接 instantiated 的 adversarial action。

論文與 repository 沒有另外提供 dataset、downloadable checkpoint、hosted demo 或 production integration URL；results 是 generated deterministic artifact，不是外部資料集。這些「沒有列出」的項目不能被寫成 released 或 reproducible dataset。可重現性應精確描述為：**source、tests、scripts、raw CSV 與 figures endpoint 可取得；在相容 Python／dependency／host 上可依 Appendix C 重跑，但本地 publication validation 沒有把作者的 full experiment 當成已經獨立重現。** Timing 尤其是 host-dependent。

依 Appendix C，conditional reproduction path 是：建立 Python 3.11+ virtualenv、安裝 `requirements.txt`、跑 `python -m pytest -q`（預期 30 passed）、再跑 `python scripts/run_experiments.py --output results` 與 `python scripts/make_figures.py --results results --output figures`。安全上，artifact 只把 effect 寫到 in-memory simulated world；不要把 active fault injection 直接接到真實服務。

## 與本站 reading path 的關係

本文接在 Agent Systems 路徑的 prompt injection 與 runtime control 之間：

- [Indirect Prompt Injection](/paper-reading/42-indirect-prompt-injection/)：攻擊者如何用外部資料影響 Agent；CONTINUITY 假設 planner 已經失守，往下檢查 effect boundary。
- [Parsing the Stream](/paper-reading/43-parsing-the-stream-live-trace/)：如何用 append-only trace、provenance 和 replayable state 服務 observer／worker；本文把 security context 的 preserve／transform contract 接到這類 runtime state 上。
- [ARGUS runtime](/paper-reading/10-argus-agentic-runtime/)：長任務 runtime、review 與 durable state 的控制問題；本文提供一個更窄、偏 security composition 的 verifier contract 視角。

## 讀完後的三個記憶點

1. **技術想法**：安全不是每個控制點各自說「已通過」，而是每個 security field 從 authenticated root 到 final effect 都必須 preserve，或攜帶獨立可驗證的 transformation witness。
2. **最強證據**：在固定 deterministic fault space 裡，CONTINUITY 對 2,560 attacks 的 effect ASR 為 0%、涵蓋 128/128 classes，同時完成 700 benign、升級 200 ambiguous；移除 field provenance、contract conformance 或 mediation 會重新開啟 24 類 classes。
3. **採用邊界**：這是 conditional conformance blueprint，不是現實攻擊率或 semantic correctness；root、validator、context capture、完整 effect path 與 provider transaction semantics 必須由部署者補上。

## Primary sources

- [Zheng & Yang, CONTINUITY arXiv abstract and metadata](https://arxiv.org/abs/2609.05269)
- [CONTINUITY full arXiv HTML（Sections 1–13、Figures 1–5、Appendix A–C）](https://arxiv.org/html/2609.05269)
- [CONTINUITY research artifact](https://github.com/zast-ai/continuity)
- [Artifact README](https://github.com/zast-ai/continuity/blob/main/README.md) · [Artifact evaluation guide](https://github.com/zast-ai/continuity/blob/main/ARTIFACT.md)
