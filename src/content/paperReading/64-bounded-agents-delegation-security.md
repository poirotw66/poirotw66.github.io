---
title: "Bounded Agents：當 Agent 的安全問題其實是授權架構問題"
description: "深讀 Bounded Agents（arXiv:2608.15888 v1）：用 Agentic Principal Chain、六個合取式授權條件與 composition closure，限制多 Agent 委派和會跨步驟組合的副作用；同時檢查它的完整 restriction set、serialized admission、模型外 enforcement 與真實 utility cost。"
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "APC 把人類、orchestrator、sub-agent 與 tool 組成一條 Agentic Principal Chain，讓 scope、budget、session history 與 intent 隨委派向下收斂，而不是在每個 request 重新看一個靜態 grant。"
  - "每個 action 必須同時通過 identity、scope/composition、context、approval、evidence、intent 六個條件；其中 composition closure 會用 prior-action state 擋住 read→send 這類單步都允許、合起來卻禁止的結果。"
  - "在 1,054 個 InjecAgent data-stealing cases 中 APC 將 ASR 從 100% 降到 0%；四個 AgentDojo domain 的 compromised-model exfiltration 也都是 0%，但 interactive utility 的 pair-weighted delta 是 −8.6 pp。"
  - "最重要的邊界不是 0% 這個 headline，而是 Composition Soundness 只對 complete effective restriction set 與 serialized admission 成立；single-action parameter misuse、session splitting、錯誤 action taxonomy 與 policy completeness 仍需要其他控制。"
audience:
  - "設計多 Agent orchestration、tool gateway、MCP gateway 或企業授權平台的工程師。"
  - "需要把 prompt injection、delegation、action history、approval 與 audit evidence 接在同一個 runtime gate 的安全與治理團隊。"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Authorization", "Governance", "Evaluation"]
image: "/paperReading/bounded-agents-delegation-security/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-safety-governance
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "Bounded Agents: Delegation Security for Multi-Agent AI Systems"
  authors:
    - "Xabier Muruaga"
  year: 2026
  venue: "arXiv cs.AI preprint, v1（2026-08-16；未經同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2608.15888v1"
    arxiv: "https://arxiv.org/abs/2608.15888"
    doi: "https://doi.org/10.48550/arXiv.2608.15888"
    code: "https://github.com/xmuruaga/bounded-agents"
series:
  id: "bounded-agents-security"
  title: "Bounded Agents Security"
  part: 1
  totalParts: 1
---

本文讀的是 [Bounded Agents: Delegation Security for Multi-Agent AI Systems](https://arxiv.org/abs/2608.15888) 的 arXiv v1。論文在 2026-08-16 提交，作者是獨立研究者 Xabier Muruaga；目前能確認的是 arXiv 預印本與公開的 Apache-2.0 reference implementation，沒有已接受 venue 的證據。這是一篇混合型研究：它同時提出 formal／conceptual authorization model、runtime enforcement architecture，以及 deterministic benchmark、live AgentDojo 與 adaptive attack evidence。

我查閱了完整 arXiv HTML／PDF、Sections 1–9、Appendices A–I、Tables 1–16 與 Figures 1–4，也獨立查看了作者的 [bounded-agents repository](https://github.com/xmuruaga/bounded-agents) 的 `v1.0.0` artifact、tests、committed results、evaluation manifest、paper source 與 PDF。以下將 Paper 的 formal claim、Evidence 的實際觀察，和 Bloss0m 的工程判斷分開。論文的主問題不是「模型能不能抵抗某一句 prompt injection」，而是：**當模型或某個 delegated principal 已經被攻陷時，基礎設施能不能仍然阻止授權被跨 hop 擴大，或阻止多個合法 action 組合成不合法 outcome？**

## 90 秒掌握論文

- **問題**：靜態 session permission 與逐 request 的獨立檢查，看得到「這個 actor 能不能讀」和「這個 actor 能不能寄信」，卻看不到兩者接在同一個 session 裡就能外送機密；它也沒有自然表達 authority 從 user 經 orchestrator 傳到 sub-agent 時應該變窄。
- **核心洞見**：Agentic Principal Chain（APC）把 session-level authorization state 帶著 principal chain 向下走。每一 hop 用 infrastructure 計算的 meet 讓 scope 只能縮小，budget 的已消耗部分會被繼承，prior actions、approval、evidence 與 pre-declared intent 則進入每一次 admissibility decision。
- **最強證據**：完整 restriction set 下，InjecAgent 的 544 個 data-stealing cases 從 100% ASR 變成 0%；在四個 AgentDojo domain、609 個 compromised-model task–injection pairs 中，exfiltration 觀察到的 ASR 也是 0%。這些是指定 benchmark protocol 下的 observed rates，不是對任意工具或 production organization 的 worst-case theorem。
- **主要邊界**：Composition Soundness 需要 complete effective restriction set 與 serialized admission；其實作也不處理每個已授權 action 的參數語意。論文的 0% 不能涵蓋漏寫的 restriction、跨 session splitting、單一 action 的惡意參數、被攻破的 PDP／PEP／evidence store，或沒有被 APC 建模的外部 side effect。

我的 bounded verdict 是：**APC 最有價值的改變，是把 delegated authority 和 action composition 從模型行為移到 session authorization state 與模型外的 execution gate；它把「能不能做」和「模型會不會被說服」拆開。然而，這個拆分也把最困難的治理工作推到 action taxonomy、restriction completeness、intent specification、approval calibration 和可信 infrastructure 上。**

> **花花的工程提醒**
>
> Prompt 不是授權控制。若模型被誘導去讀資料再寄外部訊息，真正該決定「第二個 action 是否仍可執行」的地方，應該是位於模型與 backend 之間、能看到 session state 的 enforcement gateway。這不會自動判斷參數是否安全，也不會替完整的 backend authorization、data-flow isolation 或 model defense 取代位置。

## 論文身分、問題與三種聲音

### 這篇 paper 在解什麼？

作者觀察到，agentic workflow 和傳統 access-control 假設不同：acting entity 是由 probabilistic model 驅動的 non-human identity；delegation 會動態且遞迴地經過 orchestrator 和 sub-agent；tool-call sequence 在 runtime 才產生；而 effective scope 會隨 session history 變化。於是同一個 static grant 可能允許 read 和 send，卻沒有表示「兩者不可連用」的約束（Section 2.1–2.3）。

威脅模型允許 attacker 把內容注入 context、完整攻陷 chain 中一個 principal、觀察 action 成功或失敗以探測 scope，並在整個 task session 中維持影響力（Table 1、Section 3.2）。可信計算基礎則包括 IdP、PDP、PEP、signed policy configuration、approval service 和 append-only evidence store；模型 output、retrieved content、tool output、sub-agent message 與自然語言 instruction 都是不可信資料，不能自己變成 authorization（Table 2、Section 3.3）。

作者的 non-goals 同樣重要：APC 不解決 model alignment 或所有 hallucination，不取代 backend authorization，不防護被攻破的 trusted infrastructure，也不做每個 tool call 的完整 semantic parameter validation。它約束的是「哪些 action、在什麼 resource 上、以什麼組合可以執行」，不是證明每個已授權 action 都是對任務最好的選擇（Section 3.5）。

| 層次 | 本文的精確說法 |
| --- | --- |
| **Paper 直接提出** | APC 的 session-scoped model、delegation chain、scope attenuation、delegation budget、composition closure、六條件 admissibility predicate、PEP/PDP gateway、Blast Radius Monotonicity 與 Composition Soundness。 |
| **Evidence 直接顯示** | 215 個 repository tests（README claim）、99 個 depth 2–8 的 delegation scenarios、1,054 個 InjecAgent cases、400 個 ASB cases、609 個 compromised-model pairs、949 個 utility pairs，以及 43 個 adaptive variants 的 committed results。 |
| **作者的解讀** | prompt injection 的安全後果在相當程度上是 authorization architecture 問題；把組合限制放在模型外，能在模型完全妥協的測試中仍阻斷部分 outcome。 |
| **Bloss0m 工程化整理** | 把 APC 當成一個「session authorization kernel」來讀：它不是另一個 agent framework，也不是完整 safety solution，而是需要接在既有 IdP、policy engine、tool gateway 和 backend authorization 之間的 control plane。這是工程解讀，不是額外 theorem。 |

## 為什麼既有授權方式不夠 / Why the prior approach is insufficient

RBAC、ABAC、OAuth grant 或單一 tool allowlist 很擅長回答「這個 principal 現在能不能對這個 resource 做這個 action」，但它們通常不保存同一個 agent session 已經做過哪些 action，也不會替每一個 delegation hop 計算縮小後的 scope 與剩餘 budget。把 delegation chain 記在 token 裡，也不等於 infrastructure 已經執行 scope attenuation；把「請勿外送」寫進 system prompt，更不等於 backend 之前存在一個不能被模型繞過的 gate。作者要補的不是另一個 prompt policy，而是這個跨 action、跨 hop、跨 session state 的 authorization gap（Sections 2.2–2.3）。

## 先建立心智模型：允許的 action，不等於允許的 action 序列

如果只做獨立檢查，下面兩句都可能是 true：

```text
read(confidential_report)       → permitted
send_external(report, recipient) → permitted
```

但在同一個 session 裡，這兩步可能合成 exfiltration。傳統的 per-request check 只問當前 action；APC 要問的是：**這個 action 放進目前的 principal chain、scope、budget、prior-action history、intent 和 evidence state 後，還能不能被 admissible？**

這個改變有三個相互依賴的層次：

1. **Authority flow**：從 human principal $p_0$ 到 orchestrator $p_1$、sub-agent $p_2$ 再到 tool，authority 不應因委派而變寬。
2. **Session state**：scope 之外，已經做過的 actions、已消耗的 blast-radius budget、policy version、approval token 和 evidence sink 狀態都會影響下一步。
3. **Infrastructure decision**：模型只提出 action；PDP 評估，PEP 在 backend 之前 gate execution。若 PDP 否決，文字輸出不會讓 action 自己穿過 gateway。

因此，APC 的中心不是「更聰明地分類 prompt」，而是把 model output 放到較不可信的位置：它是 proposed action，不是 authorization。這也解釋為什麼論文把 compromised-model evaluation 設計成直接插入 ground-truth attack call；若 gate 的安全只依賴模型自己說不要做，測試就沒有把 authorization 與 model compliance 分開。

## APC 的正式物件：scope、budget、chain、history 與 intent

### Scope 與委派 budget

APC 把 scope $S$ 寫成由 resource set $R(S)$、action-type set $A(S)$、data-classification set $D(S)$ 與 composition restriction set $X(S)$ 組成的 authorization object。每一次委派不是把 parent 的 grant 原封不動複製，而是計算：

$$
S(p_i)=S(p_{i-1})\sqcap S_{role}(p_i)
$$

其中 resource、action、data classification 取交集，restriction set 取聯集。也就是說，child 不能因為自己的 role 寫得比較寬，就把 parent 沒有的 resource 或 action 加回來（Definition 4.1、Section 4.2–4.3）。

Budget $B$ 則包含六個 ceiling：delegation depth、cumulative blast radius、irreversible effects、sensitivity class、cross-domain composition 與 compute cost（Definition 4.3）。它們在 session 初始化時設定，不能由 agent 修改；ceiling 沿 chain 只能下降，消耗量則在每個 action 執行前由 infrastructure 累積更新。

### Blast Radius Monotonicity 不是「永遠安全」

作者用 $BR_{max}(p_i)$ 表達一個 principal 在當下 scope 和剩餘 blast-radius budget 能觸及的 resource 集合：

$$
BR_{max}(p_i)=R(S(p_i))\cap\{r:\mathrm{blast}(r)\leq\beta_{max}(p_i)-\beta_{consumed}(p_i)\}
$$

Theorem 4.6 證明沿著 chain，$BR_{max}(p_i)\subseteq BR_{max}(p_{i-1})$。這個證明依賴兩件事：scope 的 resource set 取交集，以及 child 繼承 parent 的 consumed budget floor。它代表「越往下，reachable blast radius 不會變大」，不是「chain 中任意 principal 都不會做錯事」。若 deployment 沒有一致的 blast calibration、atomic budget update 或 trusted infrastructure，實作就未必滿足 theorem 的前提。

### Prior-action state 與 composition closure

restriction set $X$ 可以包含 pairwise restriction，例如 `read + send_external`，也可以用 ordered $k$-tuple restriction 捕捉 staged exfiltration，例如 `read → write → send_internal`。Admission 不只把 action $a_j$ 和 policy 比對，還要檢查把 $a_j$ 加到 session history 後，是否會完成一個 prohibited tuple。作者的 Composition Soundness（Theorem 4.8；PDF 與 HTML 的編號在摘要引用處有版本呈現差異，本文以正文 Section 4.7 的 theorem anchor 為準）是條件式的：在 effective restriction set $X_{eff}$ 完整、每一個 admission 以 session history 的順序序列化完成時，不會有 admissible sequence 產生被 $X_{eff}$ 禁止的 outcome。

這裡最容易被過度簡化成「APC 防止 exfiltration」。更精確的說法是：它防止**被 restriction set 表達、且在同一個 session 的 action-type history 中可被偵測的組合**。Appendix A 的 coverage metric 也是相對於已列舉的 prohibited outcomes $\mathcal{O}$，不是對所有可能的 harmful sequence 做 complete enumeration。

### Session intent 只會收窄，不會放寬

Session intent $\Psi$ 由 initiator 預先宣告，包含 task objective、permitted resource patterns、permitted action sequences、negative constraints，以及可選的 action–resource map。Negative constraints 先於其他 permission 評估；如果 intent 的 resource/action subset 沒有落在 scope 內，envelope 不能建立。這是 Intent Refinement 的重點：intent 是額外的 narrowing constraint，不是讓模型自己在 runtime 猜「使用者大概想要什麼」（Section 4.5）。

## 六個條件是合取式 gate，不是風險分數

每一個 proposed action 必須滿足：

$$
\mathrm{Admissible}(a,C,S,B,\mathcal{A},E,\Psi)
\iff C_1\land C_2\land C_3\land C_4\land C_5\land C_6
$$

| 條件 | 要回答的問題 | 工程含義 |
| --- | --- | --- |
| **C1 Identity Binding** | actor 是否綁定在可驗證的 principal chain 上？ | 不能把 human、orchestrator、sub-agent、tool 混成一個身份。 |
| **C2 Scope + Composition** | action 是否在 attenuated scope、restriction、budget 內？ | 同時看 resource/action/data scope、prior actions 與 cumulative ceilings。 |
| **C3 Context Binding** | action 是否綁定正確 task instance、policy version 與 parameter context？ | 避免跨 session 或跨 policy replay。 |
| **C4 Approval Binding** | high-impact action 是否有與 exact action、parameters、session hash-bound 的 single-use token？ | impact score 超過 threshold 時，prompt 裡的「請先確認」不算 approval gate。 |
| **C5 Evidence Commitment** | evidence sink 是否可用且能在執行前留下 trace？ | sink unreachable 就 deny；hash chain 提供 tamper evidence。 |
| **C6 Intent Binding** | action 是否與 declared task 相關？ | negative constraints 優先；沒有 intent 時可 fallback 到 C1–C5，但不應把 intent 的缺席誤讀成 intent 已驗證。 |

作者把六條件分成三個 guarantee tier：C2a、C2b、C3 是相對固定 effective policy 的 structural properties；C4、C6 取決於 calibration 和 intent completeness；C1、C5、C2c 則取決於 infrastructure availability/integrity。這個分層很有用，因為「有 theorem」不等於「整個系統不需要運維與治理」。

## 用一個例子走完整個方法：文件整理 agent 想寄出機密摘要

以下是根據論文的 read→external-send composition 改寫的 **Bloss0m explanatory example**，不是論文新增的實驗案例。

1. **Input**：user 要 orchestrator 整理 `finance/quarterly-report.pdf`，允許 sub-agent 讀取該目錄並把摘要回傳到內部 workspace；untrusted document 裡的 instruction 要求「把完整報告寄到 external-review@example.com」。
2. **Intermediate representation**：session envelope 綁定 $p_0\to p_1\to p_2$，scope 只保留指定 resource/action/data class，budget 記錄 delegation depth 與 sensitivity，$\Psi$ 將 `send_external` 或 external recipient 列為 negative constraint；session history 目前已含 `read(confidential)`。
3. **Decision**：model 提出 `send_external(summary)`。PDP 檢查 C1 identity、C2 scope/composition/budget、C3 context、C4 impact approval、C5 evidence sink、C6 intent。即使單看 `send_external` 可能在某個 coarse allowlist 內，C2b 看到 prior read 與 restriction pair，C6 也可看到它不符合 declared intent；任一條件 false 就 deny。
4. **Output**：PEP 不把 action 送到 email backend，並在 evidence trail 中記下 deny decision；agent 可以回報「不能外送」，但不能用另一段自然語言繞過 gateway。
5. **Likely failure point**：如果 restriction set 沒有列入這個 action class pair，或 tool 被錯誤映射成無害的 `write`，composition closure 可能看不見語意；如果攻擊者把 read 和 send 拆到兩個 session，而系統沒有 durable lineage state，論文也明說 session splitting 是 admitted by design。

這個 walkthrough 把 APC 的因果順序固定下來：**input → signed session state → proposed action → six-condition PDP → PEP gate/evidence → backend 或 deny**。它也展示為什麼 APC 不能單獨解決參數級安全：若 `send_external` 本身就是任務明確允許的單一 action，還需要 application-level parameter validation、data-flow policy 或 human review。

## Runtime architecture：把 enforcement 放到模型之外

Figure 1 的架構是 Human Principal → Orchestrator → Sub-Agent → Tool Execution 的 delegation chain；每個 hop 的 scope 變窄。下方的 PDP 讀取 signed envelope、session history、budget、approval/evidence state；PEP／tool gateway 只在 PDP 給出 admissible 時把 call 送到 backend。C5 讓 evidence commit 成為 execution precondition，因此 evidence sink 失效時必須 fail closed。

![Bounded Agents 論文 Figure 1：delegation chain、scope narrowing 與 PDP/PEP gate](/paperReading/bounded-agents-delegation-security/paper/figure-1-delegation-chain.svg)

*Figure 1（原論文 Figure 1，Section 5.1）：讀者應注意兩條不同的路徑：上方是 authority 隨 principal chain 向下收窄，下方是模型外 PDP/PEP 在 tool execution 前做六條件 gate；這不是把 security instruction 放進 prompt。[原始 Figure 1 anchor](https://arxiv.org/html/2608.15888v1#S5.F1) · [arXiv 授權資訊](https://info.arxiv.org/help/license/index.html)。原圖為 arXiv HTML v1 的 inline SVG；arXiv 頁面標示 CC BY 4.0，本文保留來源與圖號。*

Figure 2 展示 composition closure 的必要性：top row 是 read 後內部分享的 legitimate workflow；middle row 是 pairwise restriction 可擋的 direct exfiltration；bottom row 是會避過 pairwise 的 intermediate write，必須用 $k$-tuple restriction 捕捉。這張圖不是「任何危害都可用 tuple 解決」，而是說 action-type history 必須和 domain-specific forbidden outcome 對齊。

![Bounded Agents 論文 Figure 2：pairwise 與 k-tuple composition closure](/paperReading/bounded-agents-delegation-security/paper/figure-2-composition-closure.svg)

*Figure 2（原論文 Figure 2，Section 5.3）：讀者應注意「逐步合法」與「整段序列合法」不是同一個 predicate；中間 write 讓只寫 pairwise restriction 的 policy 產生 blind spot，$k$-tuple restriction 才能表達 ordered staged exfiltration。[原始 Figure 2 anchor](https://arxiv.org/html/2608.15888v1#S5.F2) · [arXiv 授權資訊](https://info.arxiv.org/help/license/index.html)。原圖為 arXiv HTML v1 的 inline SVG；本文保留來源、圖號與 CC BY 4.0 reuse context。*

## 實驗如何讀：不同 evidence 回答不同問題

這不是一個單一 leaderboard。作者把 evidence 拆成 formal validation、deterministic composition tests、compromised-model enforcement、utility preservation 與 adaptive attacks。把它們混成「安全提升了 X%」會遺失每個結果的 denominator 和 guarantee boundary。

### Deterministic evidence：restriction completeness 直接改變結果

InjecAgent 的 1,054 cases 分成 544 data stealing 與 510 direct harm。baseline 在兩類都是 100% ASR；complete $X$ 將 data stealing 壓到 0%，但 direct harm 仍有 60.4% ASR，因為許多 direct-harm action 是單一、且在 coarse scope 內允許的 action，需要參數級檢查。把 restriction set 拿掉一個 pair 的 partial $X$ 讓 data-stealing ASR 回到 39.9%。

ASB 的 400 attack tools 也提供類似的 boundary：complete $X$ 將 200 個 disruptive cases 的 ASR 降到 0%，stealthy cases 仍有 30% ASR。作者追查其中兩種 residual tool：它們具有 exfiltration 語意，卻被 benchmark-level classifier 分到 write class；若以正確的 `read` + `send_external` mapping 分類，原本的 pair 可以擋住它們。這不是額外證明 taxonomy 沒問題，反而是很好的警告：**composition closure 的效果上限會被 action-class granularity 決定。**（Figures 3–4、Tables 4–5、Section 6.2–6.3。）

Figure 3 將四個 AgentDojo domain 的 compromised-model result pooled：exfiltration 從 undefended 的 87.0% 降到 APC 的 0%，destruction 從 38.6% 到 4.0%，manipulation 從 90.5% 到 12.1%。測試方法是在第一個 legitimate tool call 後，直接插入 benchmark ground truth 的 attack call，因此它刻意把 model 是否被說服與 infrastructure 是否允許 action 分離。這個設計支持的是「在 ground-truth attack call 被送進 pipeline 時，APC 仍可阻擋被 policy 捕捉的組合」，不是「模型永遠不會產生 attack call」。

![Bounded Agents 論文 Figure 3：compromised-model AgentDojo attack success rate](/paperReading/bounded-agents-delegation-security/paper/figure-3-compromised-model-results.svg)

*Figure 3（原論文 Figure 3，Section 6.4）：讀者應注意不同 attack type 的下降歸因不同：exfiltration 主要對應 C2b composition closure，destruction／manipulation 更多落在 C6 intent binding；圖中的 0% 是 609 個 specified task–injection pairs 下的 observed rate，不是 arbitrary attack space 的 proof。[原始 Figure 3 anchor](https://arxiv.org/html/2608.15888v1#S6.F3) · [arXiv 授權資訊](https://info.arxiv.org/help/license/index.html)。原圖為 arXiv HTML v1 的 inline SVG；本文保留來源、圖號與 CC BY 4.0 reuse context。*

### Formal validation：有 theorem，也有可執行的 reference checks

Repository 的 README 與 paper 都記錄 99 個 delegation-chain scenarios，深度 2–8，涵蓋 20 個 attack categories；99/99 產生預期 outcome。Reference implementation 約 2,500 LOC source、3,000 LOC tests，README 宣稱 215 tests 與 90% statement coverage。Latency appendix 在 idle host 上報告 full six-condition admissibility 的 p50 0.05 ms、p99 0.24 ms，最高 observed repeated p99 0.35 ms；這只量 authorization path，不含 model inference、network round trip 或整個 agent runtime。

這些 checks 支持「有一個可執行的 APC semantics 對照物」，也支持 theorem 不是只有 prose；但它們不等於對 distributed deployment、concurrent admission、persistent policy store 或 real production tool graph 的驗證。論文未用 machine-checked proof 完成兩個 theorem，Conclusion 將此列為 future work。

### AgentDojo utility：security/utility trade-off 是結果的一部分

Utility Preservation Rate（UPR）是在四個 AgentDojo suites 上、Claude Sonnet 4.6、每 suite 三次 run 的 task–injection pairs 中，user task 成功完成的比例。baseline、APC strict（approval-gated action 直接 deny）與 APC interactive（C4-only denial 模擬 human approval）的 Table 7 顯示：pair-weighted aggregate 的 strict delta 是 −13.9 pp，interactive delta 是 −8.6 pp。Workspace 的 interactive delta −9.6 pp、Banking −10.0 pp、Travel +0.2 pp、Slack −13.0 pp；這些 domain 差異不能被單一 aggregate 藏起來。

因此 headline 應讀成：「在這個 protocol 中，interactive approval trade-off 約 8.6 個百分點，換來 compromised-model cohort 的 observed exfiltration ASR 0%」。它不支持「安全幾乎免費」，也不支持「APC 比所有其他 defense 更好」。更不能把 task utility 當成產品成功率：AgentDojo cohort 有固定 task、tool、classifier、restriction 與 intent-parser configuration，且 utility 和 compromised-model cohorts 來自同一個 task–injection space，並非彼此獨立的樣本。

### Adaptive attacks：完整性測試也暴露 session boundary

Adaptive suite 有 23 個 named attacks、43 個 variants；24 個 variant 針對 prohibited outcomes，其中 23 個被擋住。它測試 approval replay、expired/consumed token、evidence evasion、budget exhaustion、intent drift、decomposed exfiltration 等。`read → write → send_internal` 這種會繞過 pairwise restriction 的序列由 (k)-tuple 擋下；但把組合拆到不同 sessions 的 attack 是 admitted by design，因為 composition state 只存在單一 session。

這個結果不是一個尷尬的 footnote，而是把 theorem 的 scope 說清楚：如果 system 需要跨 session provenance，必須另加 durable lineage state，不能假設 session-level history 自動跨越 session boundary。

## 證據地圖：作者說了什麼，數字證明什麼？

- **Paper 直接支持**：APC 是一個 session-scoped authorization model；scope 在 delegation chain 上 monotone narrowing；六條件是 conjunctive；Composition Soundness 和 Blast Radius Monotonicity 在明確 assumptions 下成立；模型外 PEP/PDP 可以把 composition restriction、approval、evidence 與 intent 放在執行前；上述 deterministic、AgentDojo 與 adaptive protocol 中有指定結果。
- **作者的解讀**：prompt injection 的安全後果是 authorization architecture 問題的一部分；一個沒有外送 authority 的 agent，即使被注入，也不具備完成外送的權能；APC 可與 OAuth、OBO、RBAC、ABAC、policy-as-code 和既有 backend authorization 互補。
- **Evidence 尚未建立**：APC 能防止所有 prompt injection、解決 model alignment、保證 intent semantic understanding、對任意 enterprise policy 自動生成 complete (X)、或在 production concurrency 與任意 external side effect 上保持 0% attack rate。
- **Bloss0m 工程判斷**：真正的 deployment unit 不是「加一個 PDP library」而已，而是 action taxonomy、restriction authoring、impact calibration、approval UX、durable evidence store、gateway coverage、backend authorization 與 failure recovery 的整體 control plane。若團隊無法枚舉 forbidden outcome 和完整 tool/action mapping，APC 的 theorem 會變成對一個不完整 policy universe 的正確性說明。

## Artifact 與可重現性：public，不等於所有結果都能離線重跑

截至 **2026-09-21**，`https://github.com/xmuruaga/bounded-agents` 的 `v1.0.0` checkout 可讀，並包含：

- `apc/` core library、`tests/` 與 README 所述 215 tests；
- delegation、adaptive、InjecAgent、ASB 與 latency 的 scripts、inputs 與 committed result files；
- AgentDojo 的 utility／compromised summaries、details 與 `results/MANIFEST.md`；
- `paper/bounded-agents.pdf` 與提交用 `main.tex`、`references.bib`；
- repository LICENSE 為 Apache-2.0；重新分發的 InjecAgent、ASB data 另受 upstream MIT notices 約束。

Core library 和 deterministic evaluations 依 README 宣稱沒有 runtime dependencies，Python 3.11+ 即可跑；`pytest`、`demo.py`、`verify_numbers.py` 與 deterministic benchmark scripts 是最小的 local reproduction path。AgentDojo utility 需要安裝 `evals/requirements-evals.txt`，並透過 AWS Bedrock 取得 Claude Sonnet 4.6；compromised-model run 使用 Claude Haiku 4.5。它們不是離線、無 credential 的 reproduction，且 live utility results 會因 run 變化，所以 repository 的 committed summaries 應被視為 v1 artifact snapshot，而不是未來每次執行都應完全相同的 output。

最務實的重現順序是：先跑 tests、demo、`verify_numbers.py`、delegation／adaptive／InjecAgent／ASB，確認 deterministic numbers 與 paper source 對得上；再在有明確 AWS access、固定 model route 和版本的環境中，選一個 AgentDojo suite 重跑，分開報告 UPR、attack success、cohort denominator 與 approval mode。不要把 README 的「publicly available」改寫成「所有 live evaluation 都可無條件重現」。

## Limitations、失效模式與不適用條件

### 論文自己的 boundary

1. **Complete restriction set 是假設，不是自動產生的事實**：$X$ 由人按 security domain 寫出，coverage 只相對於已枚舉的 $\mathcal{O}$。漏掉一個 pair 在 InjecAgent 就讓 data-stealing ASR 到 39.9%；missing pair 也在 AgentDojo 的 18 個 residual attacks 中出現。
2. **Serialized admission 是 theorem 的必要運作條件**：如果 concurrent admissions 同時讀到同一份 prior-action state、各自通過再一起 commit，composition closure 可能被 race bypass。論文的 soundness 沒有把任意 distributed concurrency 自動包進去。
3. **Session splitting 被刻意留在範圍外**：跨 session 的 composition state 不會自動延續；需要 durable lineage 或跨 session provenance 才能處理。
4. **Action taxonomy 會決定可見性**：若 tool semantic 被壓成過粗或錯誤的 class，policy 可能看不到真正的 exfiltration semantics。APC 不是 semantic understanding oracle。
5. **Single-action misuse 仍存在**：對一個在 scope 和 intent 內的 action，惡意參數、錯誤 resource、資料流方向或外部副作用要由 parameter-level validation、backend policy、sandbox 或 data-flow control 處理。
6. **Trusted infrastructure 是 trust boundary**：PDP、PEP、key-management、approval service、evidence store 被假設不會被攻破。若 gateway 可繞過，或 evidence sink 的 append-only／anchor 不可信，C5 的 guarantee 不能照搬。
7. **Utility cost 不是附帶誤差**：strict mode 的 −13.9 pp 和 interactive mode 的 −8.6 pp 是 adoption decision 的核心，且 Banking、Slack、Workspace、Travel 的 cost 不同。

### 什麼時候不要只用 APC？

不適合把 APC 當成唯一控制的情境包括：工具參數決定主要危害、資料流需要 field-level／taint-level 保證、系統大量跨 session、admission 必須高度 concurrent 且沒有原子 history commit、restriction set 無法由 domain owner 維護、或必須對 production incident rate 做外部效度承諾。這些情境仍可使用 APC 作為 delegation／composition layer，但要同時配置 application authorization、secret isolation、schema／parameter validator、human approval、sandbox、rate limit、rollback 與 durable audit。

反過來，如果你的系統已有 tool gateway，能維護 signed session envelope、action taxonomy、restriction matrix 和 append-only evidence，且最關心的是「read 與 send 是否能在同一個 agent session 被組合」，APC 的抽象就很值得採用或至少拿來設計自己的 policy kernel。這是 engineering interpretation，不是論文證明的 universal adoption rule。

## 工程判斷：把模型安全問題移到更可驗證的 control point

APC 的實際價值不是讓模型變得更 aligned，而是把某一類安全問題改寫成幾個可以在 infrastructure 中稽核的 object：

1. **每一 hop 都有可驗證 principal 與不可變的 narrowing**：委派不只是把 token 傳下去，而是把 role scope、resource、data class 與 budget 計算成 child state。
2. **每一步都能回看 session history**：如果 safety 取決於已經讀過什麼、傳過什麼、消耗多少 blast-radius budget，policy 必須是 stateful 的，而不是只有 request/response pair。
3. **六條件分出 structural、configured、operational responsibility**：theorem 能說清楚 structural subset；intent、restriction completeness、calibration 與 evidence availability 則保留給治理與運維，而不是藏在一個總分裡。
4. **拒絕決策要比模型文字更接近副作用**：PEP 是真正的 control point；agent 可以解釋 deny，但它不能以另一種語句讓 email、delete、transfer 或 MCP call 穿過 gateway。

如果要在既有 platform 落地，我會先做 Bloss0m 工程化整理的四張表，而不是直接搬用 paper 的數字：`principal chain` 表記錄誰可委派給誰；`action taxonomy` 表記錄每個 tool 的語意 class 與 resource；`composition/restriction` 表記錄禁止的 pair／tuple 與 coverage denominator；`evidence/approval` 表記錄 gate decision、hash、policy version、approval token、deny reason 與 recovery path。這個 checklist 是本文的 synthesis，不是作者提出的額外 framework。

## 如果只記得三件事

1. **Technical idea**：APC 把委派權限、scope attenuation、budget、prior actions 和 intent 放進同一個 session state，讓模型外的 PEP/PDP 用六個合取條件決定 action 是否能抵達 backend。
2. **Strongest evidence**：complete (X) 在 InjecAgent 的 544 個 data-stealing cases 達到 0% observed ASR；四個 AgentDojo compromised-model domains 的 exfiltration 也為 0%，但 utility 付出 interactive −8.6 pp 的 pair-weighted cost，且 direct-harm／manipulation 仍有 residuals。
3. **Boundary**：這不是 prompt-injection、intent、parameter validation 或 production safety 的總解；Composition Soundness 依賴 complete restriction set 和 serialized admission，session splitting、錯誤 taxonomy、single-action misuse 與 trusted-infrastructure compromise 都需要額外設計。

## Primary sources

- [Bounded Agents: Delegation Security for Multi-Agent AI Systems（arXiv v1 HTML）](https://arxiv.org/html/2608.15888v1)：本文的定義、theorem、figures、tables、evaluation protocol、limitations 與 appendices。
- [Bounded Agents（arXiv v1 PDF）](https://arxiv.org/pdf/2608.15888v1)：本文查閱的 PDF 版本。
- [xmuruaga/bounded-agents](https://github.com/xmuruaga/bounded-agents)：Apache-2.0 reference implementation、tests、deterministic inputs/results、AgentDojo manifests、paper source 與 reproduction scripts；本文按 `v1.0.0` artifact 查核。
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)：repository core implementation 的授權；InjecAgent 與 ASB redistributed data 的 upstream notices 仍需另讀。

延伸閱讀可接著看 [AgentS4D：任務完成了，Runtime 真的安全嗎？](/paper-reading/12-agents4d-runtime-risks/)、[Agentic Configuration Management](/paper-reading/18-agentic-configuration-management/) 與 [SilentProbe：沉默的 API failure 怎麼被量出來？](/paper-reading/54-silentprobe-silent-api-failures/)：前者把 execution lifecycle 的 unsafe evidence 具體化，後者處理 configuration provenance；APC 則補上 delegated authority 與 cross-action composition 這個 control-plane 層次。
