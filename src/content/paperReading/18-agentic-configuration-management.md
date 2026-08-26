---
title: "Agentic Configuration Management：把 Agent 系統當成可治理的組態，而不只是一次執行"
description: "深讀 ACM 如何用跨框架的 Configuration Graph、immutable revisions、dependency-aware impact propagation 與 runtime provenance，治理 LangGraph、CrewAI 與 OpenAI Agents SDK 的異質 Agent 組態。"
pubDate: 2026-08-12
updatedDate: 2026-08-24
tldr:
  - "ACM 的核心不是另一個 Agent orchestration framework，而是在執行框架之上加一層 framework-independent configuration governance。"
  - "它把 agent、prompt、model、tool、workflow 與 policy 表成 typed、independently versioned 的 Agentic Configuration Items，並用 immutable Release Baseline 固定可重建的完整組態。"
  - "在 27 個 governance scenarios 與 9 個 impact cases 中，LangGraph、CrewAI、OpenAI Agents SDK 都可投影到相同治理 kernel；global model change 在受控圖上觸及 5 個 ACI，固定點 3 次收斂。"
  - "論文證明的是受控案例中的 semantic projection 與 deterministic governance feasibility，不是 production incident reduction、普遍互通性或法規合規。"
audience:
  - "正在設計 Agent platform、AgentOps、prompt／tool／model versioning 與 release governance 的 AI 工程師。"
  - "需要把異質 Agent framework 的組態、依賴、runtime trace 與 audit evidence 接在一起的平台與治理團隊。"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Governance", "AgentOps", "Evaluation"]
image: "/paperReading/18-agentic-configuration-management/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
paper:
  title: "Agentic Configuration Management (ACM): A Reference Configuration Model for Governed Agentic Systems"
  authors:
    - "Audrey Quessada-Vial"
  year: 2026
  venue: "arXiv cs.SE preprint, v1 (submitted 2026-08-11; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.11166v1"
    arxiv: "https://arxiv.org/abs/2608.11166"
    doi: "https://doi.org/10.48550/arXiv.2608.11166"
    code: "https://github.com/audreyqvial/ACM"
series:
  id: "agent-security"
  title: "Agent 安全"
  part: 2
  totalParts: 2
---

## 90 秒地圖 / The paper in 90 seconds

- **問題**：一個 agent system 的行為不只由程式碼決定，還取決於 prompt、model、tool、skill、workflow、policy、framework 與 runtime state；現有 framework 和 AgentOps 工具各自管理一部分，卻很難把「哪個完整組態產生了這次執行」固定下來。
- **核心洞見**：ACM 把這些異質 artifact 正規化成 typed、independently versioned 的 Agentic Configuration Items（ACI），由四張互連的 Configuration、Evolution、Assurance、Runtime Graph 管理；執行 framework 只負責投影，治理 kernel 在共同表示上工作。
- **最強證據**：27 個 controlled governance scenarios 跨 LangGraph、CrewAI 與 OpenAI Agents SDK，另有 9 個 quantitative impact cases；三個 framework 在受控範圍得到相同 governance outcomes，重複執行的 impact set 與 metrics 也一致（Section 7.2–7.6、Tables 8、10、12）。
- **主要邊界**：這是 reference model 與 prototype 的 conformance／feasibility evidence；distributed execution、learning、long-term memory、MCP/A2A native protocol 與 large-scale industrial validation 都在目前範圍外（Table 13、Table 14、Sections 8.4、9）。

## 先回答讀者問題：為什麼 Agent 也需要像軟體一樣做組態管理？

如果一次 Agent 執行出現錯誤，團隊通常要回頭拼出一個「當時到底跑了什麼」：哪個 prompt revision、哪個 model、哪些 tools、哪些 permissions、哪一版 workflow、哪份 policy、哪個 deployment parameter，以及 runtime 途中是否發生了 dynamic mutation。只記錄 trace，可能知道發生了什麼，卻不一定知道它是從哪個完整組態產生；只做 prompt versioning，又會漏掉 tool、handoff、policy 與 dependency。

ACM 的讀法是：**先治理可被部署的 configuration，再把 runtime observation 連回它；不要把 configuration 和 execution 混成同一個東西。** 這使它比較像一個跨 framework 的 SCM／governance layer，而不是新的 agent runtime。論文把這個缺口定位在 Software Configuration Management、AI governance、LLMOps／AgentOps 與 agent framework 之間（Sections 2.3–2.5、Table 2）。

> **花花的工程提醒**
>
> 如果 production audit 只能回答「這次 agent 做了什麼」，卻回答不了「它是由哪個 prompt、tool、model、policy 與 baseline 組成」，你有 observability，但還沒有完整的 configuration governance。

## 先前方法的限制 / Limitation of prior approaches

傳統 Software Configuration Management 能管理一般 software artifact，但沒有 agent-specific、framework-independent representation；AI governance framework 能提出 accountability 與 auditability 要求，卻通常不規定可操作的 configuration model；LLMOps／AgentOps 能提供 trace、evaluation 與 deployment tooling，但多半以 platform-specific artifact 為中心；agent framework 則負責 execution semantics。這些方法各自解決一部分問題，卻沒有共同的 semantic boundary 來治理完整 agent configuration。這正是 ACM 要補的缺口（Sections 2.1–2.5、Table 2）。

## 核心直覺：把「執行框架的物件」先轉成「治理物件」

傳統做法通常是讓每個 framework 自己保存自己的 graph、agent、task、tool 或 handoff，再另外接 tracing、evaluation 與 deployment metadata。這些工具各自有用，但它們的語義邊界不同：LangGraph 的拓撲是顯式 state graph，CrewAI 混合 crew、task、flow 與動態 orchestration，OpenAI Agents SDK 則以 agent handoff 表達 delegation。若治理規則直接寫在每個 framework adapter 裡，平台就會被 framework-specific semantics 綁住。

ACM 把控制點改成兩階段：

1. **Semantic projection**：從 native framework 抽出 governance-relevant entities、relationships 與 metadata，正規化 identity、reference 與 digest，建立 immutable ACI revisions。
2. **Common governance kernel**：在 normalized Configuration Graph 上做 validation、lifecycle／quality／assurance／eligibility evaluation、impact propagation、release governance 與 runtime reconstruction。

這個分離讓「差異」停在 projection stage。論文的 Table 5 說明三種 introspection regime：LangGraph 主要直接抽取 graph；CrewAI 部分需要 adapter metadata 與 semantic reconstruction；OpenAI Agents SDK 則從 handoff relationships 重建 delegation topology。三者之後都交給同一個治理 kernel（Section 6.3、Table 5）。

![ACM Figure 3：以 Four-Graph Organization 統一描述 agent、workflow、configuration 與 execution。](https://arxiv.org/html/2608.11166v1/figures/ACM_reference_model.png)

*Figure 3，論文 Section 4 的 reference model：Four-Graph Organization 將 agent、workflow、configuration 與 execution 的關係放到 framework-independent 的治理邊界內。見 [原始 Figure 3 anchor](https://arxiv.org/html/2608.11166v1#S4.F3) 與 [arXiv HTML figure endpoint](https://arxiv.org/html/2608.11166v1/figures/ACM_reference_model.png)。arXiv source 標示 perpetual non-exclusive license；本文保留 attribution，依 [arXiv reuse terms](https://info.arxiv.org/help/license/index.html) 使用。*

## 用一個例子走完整個方法 / Walk one example through the method

下面是依 ACM 的 model 與 impact experiment 改寫的**說明例**，不是論文新增的 production experiment。

1. **Input**：一個 report agent workflow 有 planner、writer、shared model、兩個 prompts、web-search tool 與一條 handoff／dependency chain；平台團隊要把 shared model 從 revision `m1` 換成 `m2`。
2. **Intermediate representation**：adapter 把 agent、prompt、model、tool、workflow 與 relationships 投影成 ACI revisions，為每個 revision 保存 stable logical ID、content digest 與 native provenance；完整部署則由 immutable Release Baseline 指向這些 exact revisions。
3. **Governance decision**：ACM 對 model change 初始化 impact valuation，沿著 typed dependency relationships 做 monotone propagation。每一輪只要 impact state 還擴張，受影響的 ACI 就會留在 worklist；直到下一輪不再改變，才得到 least fixed point。
4. **Output**：治理報告列出受影響的 prompts、agents、workflow 或 release baseline，並把 runtime entity 連回它的 governing revision；團隊可決定哪些項目要重新驗證、哪個 baseline 不可直接 promote。
5. **Likely failure point**：如果 CrewAI 的 dynamic flow topology 沒有被 native introspection 暴露，adapter 可能只能透過 metadata 或 runtime evidence 補足。ACM 可以把 extraction status 與 unresolved／approximated semantics 記錄出來，但不能把未觀察到的 framework semantics 憑空還原。

這個例子的重點不是「ACM 會自動判斷某個 model 比另一個好」，而是把**變更的波及範圍與驗證邊界**變成可追溯、可重播、可重複計算的治理輸出。

## ACM 的四張圖與組態邊界

ACM 把 reference model 寫成四張互連 graph：

- **Configuration Graph**：描述 agent system 的 governed composition 與 structural dependencies。
- **Evolution Graph**：保存 immutable revisions、lineage、replacement 與 derivation history。
- **Assurance Graph**：連接 policies、assurance evidence、compliance constraints、ownership 與 governance evaluation。
- **Runtime Graph**：記錄執行觀察，並透過 provenance link 指回 governing configuration revision。

論文的公式可以先只讀成一個資料結構：

$$\mathcal{G}_{\mathrm{ACM}}=(G_C,G_E,G_A,G_R)$$

這裡的 $G_C$ 到 $G_R$ 不是四個互不相干的 database，而是四種 governance view。它們分開，是為了不讓 runtime mutation 直接改寫已發布的 configuration；它們相連，是為了讓 audit 能從一個 runtime node 回到唯一的 immutable revision（Section 4.1、Appendix H.4）。

### 為什麼 Release Baseline 是重要的治理單位？

單一 prompt 或 tool revision 不能代表完整可部署系統。ACM 的 Release Baseline 是一組 immutable ACI revisions 的一致快照，包含組態關係與治理資訊，作為 reproducibility、audit、release management 與 compliance assessment 的主要單位（Section 4.5、Figure 6）。

因此，rollback 不應只是「把某個 prompt 名稱改回舊值」；應該能重建當時的完整 baseline，並保留 runtime observation 與該 baseline 的關聯。

## 技術機制：依賴變更如何收斂到固定點？

對每個 ACI revision，ACM 先計算 local quality、assurance 與 lifecycle state，再對 impact state 做 propagation。用論文 Section 5.5 的簡化表示：

$$\iota^{(k+1)}=\widehat{\mathrm{Prop}}_{G_C,\Pi}(\iota^{(k)})$$

- $\iota^{(k)}$ 是第 $k$ 輪對所有 revision 的 impact valuation。
- $G_C$ 是固定的 Configuration Graph。
- $\Pi$ 是 relationships 對應的 propagation policy。
- $\widehat{\mathrm{Prop}}$ 依目前 impact 與 incoming dependencies 產生下一輪 valuation。

只要 operator 是 monotone，valuation 就不會在 propagation 中倒退；由於 impact domain 是有限的，序列會在有限輪數後穩定：

$$\iota^{*}=\widehat{\mathrm{Prop}}_{G_C,\Pi}(\iota^{*})$$

這個 $\iota^{*}$ 是從初始變更出發、在模型假設下得到的 least fixed point。它回答的是「依這套 graph 與 policy，哪些 revision 的 impact state 被傳遞到了」；它不回答「模型輸出品質一定變好」，也不取代 human approval 或 domain-specific test。Eligibility 在 propagation 穩定後才根據 lifecycle、quality、assurance 與 $\iota^{*}$ 做 local evaluation（Sections 5.4–5.7、Appendices E–G）。

## 實驗如何讀：它測的是治理 kernel，不是 production agent quality

### Campaign A：27 個 governance scenarios

這組實驗回答 RQ1–RQ3：模型能否表示治理概念？實作是否符合 formal semantics？不同 framework 能否投影到 governance-equivalent representation？27 個 controlled scenarios 覆蓋 immutable revisions、lifecycle evolution、governance states、dependency propagation、release baselines、runtime governance、dynamic agents 與 semantic projection；每個 framework 都先 projection，再由同一個 kernel 處理（Section 7.2.1、Table 8）。

**問題**：相同 governance concept 放在不同 native abstraction 中，會不會導致不同治理結果？

**控制**：固定 normalized kernel 與 expected semantic properties，只讓 native representation 與 introspection mechanism 改變。

**觀察**：論文報告三個 framework 的 27 scenarios 都得到與 expected semantic properties 一致的 governed representation；差異集中在 extraction status，而不是後面的 kernel（Section 7.3、Table 10）。

**解釋**：projection boundary 把 framework-specific extraction 與 framework-independent governance 分開。

**邊界**：這是 scenario-based conformance evidence，不是獨立資料集上的 universal correctness，也不是證明所有 framework 都可無損投影。

### Campaign B：9 個 impact cases、5 次重複執行

這組實驗把三個 framework 與三種 change scope（local、intermediate、global）組成 9 個 cases，每個 case 重複 5 次。測量 impact size、impact depth、impact ratio、fixed-point convergence／reproducibility，以及 residual configuration inspection scope（Section 7.5、Table 12）。

論文的 Table 12 報告三個 framework 在相同受控圖上的 metrics 完全一致：local 與 intermediate change 各影響 2 個 ACI，global model update 影響 5 個 ACI；三種 scope 都在 3 次 fixed-point iterations 收斂。inspection scope reduction 為 local `0.846`、intermediate `0.692`、global `0.615`。

這些數字要精確讀：**reduction 是 protocol 定義的 residual configuration-inspection scope，不是人工時間、營運成本或工程師 productivity 的測量**。所以可以說 ACM 在受控案例縮小了需要再檢查的 configuration scope；不能直接說它把 change review 成本降低了 84.6%。

### Framework slice：抽取能力本身就是結果的一部分

論文把三種 framework 當成 complementary introspection regimes，而不是三個互相競爭的產品。LangGraph 的 execution graph 可直接 introspect；CrewAI 的部分 flow topology 在 execution time 才解析，adapter 需要 metadata／semantic reconstruction；OpenAI Agents SDK 的 handoff topology 可由 agent definitions 直接重建（Section 6.3、Section 7.4）。

這個 slice 很重要：**治理模型的共同性，不等於 native configuration 的資訊完全相同。** 論文也明確說 governance-equivalent 不是 complete informational identity；ACM 的成功條件是保留治理所需的 semantics，而非把每個 framework 的全部細節都變成同一種圖（Section 7.4）。

## 證據地圖 / Evidence map

- **Paper directly supports**：ACM 的四 graph representation、typed ACI／immutable baseline、semantic projection pipeline、formal monotone impact propagation，以及在三個指定 framework、27 個 scenarios、9 個 impact cases 中的 deterministic／cross-framework consistency（Sections 4–7、Tables 5、8、10、12）。
- **Author interpretation**：作者認為 ACM 可作為 AgentOps／LLMOps 與 execution framework 之間的 framework-independent governance layer，並可延伸到更多 ecosystem（Sections 8.3、10.4）。
- **Not established**：沒有證明 production incident reduction、human audit time、industrial scale、所有 framework 的 semantic coverage、法規 compliance certification，或將 ACM 接上 MCP／A2A 後必然安全。
- **Bloss0m engineering judgment**：最值得移植的是「projection、governance kernel、runtime provenance」三層邊界與可重建 baseline；採用前應先把 unsupported／approximated extraction 變成明確的 release gate，而不是把一個 normalized graph 當成完整 truth。

## Ablation、限制、失敗模式與未支持解讀 / Limitations, failure modes, and unsupported interpretations

這不是一篇以 model accuracy ablation 為主的 paper；它的「消融」更接近 boundary analysis：不同 framework、不同 introspection regime、不同 change scope，以及對 invalid lifecycle transition、missing dependency、unauthorized runtime behavior、configuration drift 的 scenario。論文報告在受控 scenarios 中，差異停留在 projection stage，沒有改變共同 kernel 的治理結果（Sections 7.3–7.4、9.5）。

真正需要注意的 failure mode 有三種：

1. **Projection loss**：native framework 的 dynamic／opaque semantics 未必能完整被抽出；ACM 能標記 approximated 或 unsupported，但標記本身不是修復。
2. **Model-scope omission**：目前刻意不表示 distributed execution、multi-agent planning、learning／adaptation、self-modifying execution、long-term memory、native MCP／A2A protocol 與 collective negotiation（Table 13）。
3. **Evaluation overreach**：27 scenarios 是提案團隊定義的 normative cases；formal proof 覆蓋的是指定 propagation semantics 的 monotonicity、convergence、termination 與 least-fixed-point properties，不是整個 governance model 的 machine-verified correctness（Sections 9.1–9.4）。

因此，最弱的推論不是「模型能不能收斂」，而是「這個模型在三個受控 framework 上可收斂，所以 production governance 已經解決」。這一步證據不夠。**限制**也很清楚：案例由提案團隊設計、framework coverage 只有三種、完整 governance model 尚未 machine-verified，而且 artifact 的 license 與 exact table correspondence 還需要本地 clone 核對。

## Artifact 與可重現性 / Artifacts and reproducibility

截至 **2026-08-12**，論文的 [arXiv v1](https://arxiv.org/abs/2608.11166) 與 [full HTML](https://arxiv.org/html/2608.11166v1) 可讀；[official GitHub repository](https://github.com/audreyqvial/ACM) 公開可存取，HEAD 為 `36d3d5ba20c2f4b652a4060a49874520653f746f`。repository 的 `acm-project-scaffold` 目前可直接看到 Python core、LangGraph／CrewAI／OpenAI Agents SDK adapters、27 scenario fixtures、pytest suite，以及 evaluation、impact、preservation reports；README 也提供 `pytest` 與 report generation commands。

但這裡要區分三件事：

- **Endpoint usable**：repository 與 scaffold files 可讀，tests、fixtures、reports 不是空連結。
- **Artifact completeness**：GitHub API 的 repository metadata 沒有標示 license；framework optional dependencies、Python 版本、以及 paper tables 與 current HEAD 的 exact correspondence 仍需要 clone 後確認。
- **Reproduction claim**：可以依 README 嘗試 reproduction，但截至本次檢查不能稱為 one-command、fully independently verified reproduction；也沒有 production trace／dataset 可供外部驗證。

最小重現路徑是 clone 固定 HEAD、建立 Python 3.11–3.13 virtual environment、安裝 core 加 `pytest`／`pyyaml`，先跑 `PYTHONPATH=. python -m pytest tests/ -q`，再執行 `run_evaluation.py --repeat 10`。若要重現 cross-framework projection，還要安裝對應 optional framework dependencies，並逐一記錄 extraction status、missing／approximated constructs 與 report version。

## 工程判斷：什麼時候值得採用？什麼時候不要直接套？

**值得採用的情境**：你有多個 Agent framework、prompt／tool／model 會獨立演進、release 需要可回溯、audit 要能從 runtime 回到 exact configuration、或一次 shared dependency change 會跨越多層 workflow。這時可先取 ACM 的最小邊界：ACI identity + content digest、immutable baseline、typed dependency graph、projection status、runtime provenance，再接到既有 CI／evaluation／observability pipeline。

**不要直接套用的情境**：你要的是 agent planning、runtime learning、long-term memory、distributed consensus、MCP／A2A protocol semantics、production incident prevention 或法規 certification。ACM 自己把這些列為未覆蓋範圍；若把 governance graph 誤當成 execution safety，會把「可追溯」錯讀成「不可出錯」。

部署前我會要求三個 gate：

1. projection coverage gate：每一個 native construct 必須有 preserved／approximated／unsupported status。
2. baseline gate：每次 production promotion 都要能重建 exact ACI revisions、dependency graph 與 policy evidence。
3. runtime gate：每個 runtime entity 都要能回指 governing revision；如果事件順序、baseline 或 replay semantics 不固定，就不能宣稱 deterministic replay。

## 三個記憶點 / Three things to remember

1. **技術想法**：ACM 治理的單位是跨 framework 的 versioned configuration，不是單一 prompt、model 或一次 runtime trace；semantic projection 把 native abstraction 接到共同治理 kernel。
2. **最強證據**：三個 framework、27 個 governance scenarios 與 9 個 impact cases 在受控範圍產生一致 governance outcomes；global change 的 impact 與 fixed-point metrics 可重複，但 inspection reduction 不是人工成本。
3. **採用邊界**：它是可檢驗的 governance reference model 與 partial artifact，不是 production safety guarantee、universal standard、完整 formal verification 或法規合規證明。

## Next reading

若要把 ACM 的 configuration governance 接到 runtime safety，可以接著看 [AgentS4D：任務完成了，Runtime 真的安全嗎？](/paper-reading/12-agents4d-runtime-risks/)，它把 workspace agent 的 carrier、lifecycle 與 unsafe-complete 分開；若要看 trajectory 在執行中如何被偵測與修復，可讀 [Real-Time Detection and Repair of LLM Agent Failures](/paper-reading/14-agent-trajectory-sentinel/)。平台治理背景則可對照 [Enterprise Agentic AI 治理](/blog/39-enterprise-agentic-ai-governance/) 與 [企業 AI Agent 安全](/blog/43-enterprise-ai-agent-security/)。

## Primary sources

- [Paper: arXiv 2608.11166 v1](https://arxiv.org/abs/2608.11166)
- [Paper: full HTML](https://arxiv.org/html/2608.11166v1)
- [Official artifact: audreyqvial/ACM](https://github.com/audreyqvial/ACM)
