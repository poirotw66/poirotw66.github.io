---
title: "Real-Time Detection and Repair of LLM Agent Failures：Agent 失敗的即時偵測與修復"
description: "精讀 AgentTrajectorySentinel 如何用健康軌跡訓練的低成本時間監控器、決定性驗證與 rollback-and-retry，在不逐步呼叫 LLM judge 的情況下提早攔截失敗；同時拆開它的校準依賴、內容盲點、修復實驗與可重現性邊界。"
pubDate: 2026-08-07
updatedDate: 2026-08-07
tldr:
  - "論文把 agent reliability 寫成 runtime control loop：先從 step telemetry 偵測行為偏移，再用 deterministic checks 驗證工具結果，最後 rollback 到已知狀態並重試。"
  - "在 2,823 個跨 25 個 corpus 的 episode 上，主要 ESN-CUSUM monitor 在 5% false-alarm budget 下回報 0.707 detection、AUROC 0.872；但跨 deployment 未重新校準時 AUROC 只有 0.527。"
  - "決定性驗證在同一批標註 episode 上以 0/63 false positives 捕捉 60% 失敗，加入 coverage check 後為 96%；repair study 的 located policy 將整體成功率從 52% 提升到 73%。"
  - "最可靠的工程結論不是『零誤報的通用監控器』，而是讓行為監控、合約驗證、judge escalation 與可回滾修復各自處理它們看得見的失敗。"
audience:
  - "正在設計 Agent observability、runtime guard 或 evaluation harness 的 AI 工程師。"
  - "需要把工具合約、失敗隔離、重試成本與校準流程接到 production agent platform 的技術負責人。"
tags: ["Paper Reading", "AI Agent", "Evaluation", "Agent Runtime", "Observability", "Governance"]
image: "/paperReading/14-agent-trajectory-sentinel/title_image.png"
field: "AI Agent"
difficulty: "advanced"
showToc: true
paper:
  title: "Real-Time Detection and Repair of LLM Agent Failures"
  authors:
    - "Sunny Dubey"
  year: 2026
  venue: "arXiv cs.AI/cs.LG/cs.SE preprint, v1 (submitted 2026-08-03)"
  links:
    pdf: "https://arxiv.org/pdf/2608.02464v1"
    arxiv: "https://arxiv.org/abs/2608.02464"
    doi: "https://doi.org/10.48550/arXiv.2608.02464"
    code: "https://github.com/sunnydubey1111/agent-trajectory-sentinel"
series:
  id: "agent-evaluation"
  title: "Agent 評測"
  part: 1
  totalParts: 1
---

如果 Agent 在第 4 步已經開始循環、工具錯誤連鎖，或把錯誤的工具結果當成事實，我們能不能在最後答案送出前攔下它？而且不必每一步都再付一個 LLM judge 的成本？

我的短答是：**AgentTrajectorySentinel 證明了一個有用的 runtime 分層，但沒有證明一個可跨 deployment、可偵測所有 hallucination 的通用監控器。** 它最值得採用的地方，是把「偵測」接到「驗證、回滾、修復」，並且把每一層的盲點寫進評測，而不是用一個總分遮住它們。

> **花花的工程提醒**
>
> 把健康軌跡當成 null distribution 之前，先把部署的 model、temperature、tool roster、telemetry schema 與 acceptance gate 固定下來。這個 monitor 的「便宜」成立在它不需要第二個模型，但它不是免費的：每個 deployment 都要付校準與維護成本。

## 先回答讀者問題：可靠性來自分層，不是單一 detector

這篇 16 頁的 arXiv v1 preprint 由 Sunny Dubey 於 2026-08-03 提交，沒有 venue 或 OpenReview record。論文提出的系統有四個相連部分：

1. **Observable telemetry**：每個 agent step 產生輸出語義、token uncertainty 與 action metadata。
2. **Healthy-only behavioural monitor**：用只看健康 episode 的 echo-state network（ESN）與 CUSUM 累積持續偏移。
3. **Deterministic verification**：從 agent 實際收到的 tool results 重算答案、檢查必要呼叫是否完成、檢查 tool result 是否符合可回傳的形狀，另有 numeric-grounding check。
4. **Rollback and repair**：告警後回到最後一個 fact-gathering checkpoint，重新呼叫模型；repair prompt 只指出失敗的 check，不直接把答案塞回去。

因此，讀者應該把它當成一個 **failure containment loop**，而不是一個新的 LLM-as-a-judge。論文的主問題、符號與 causal scoring protocol 由 [§3 Problem and Monitor](https://arxiv.org/html/2608.02464v1#S3) 定義。

## 紙本身是什麼：問題、狀態與主張邊界

一個 episode 是 step 序列 $t=1,\ldots,T$。每一步的 observable vector 寫成 $x_t=[e_t;u_t;m_t]$：$e_t$ 是輸出文字的 deterministic char-3-gram hash embedding，$u_t$ 是 token-level uncertainty aggregates，$m_t$ 則含 action type、latency、output length 與 error flag。版本演化從 43 維 base telemetry 到加上 behavior features 的 51 維，再到 content-grounding features 的 60 維；對應的內容整理在 [§4 Telemetry 的 Table 1](https://arxiv.org/html/2608.02464v1#S4.T1)。

ESN 每個 channel 維持一個固定的 sparse reservoir，只學一個 ridge readout 去預測下一步。令 $s_t$ 是各 channel CUSUM 的最大值，$\theta$ 則由 healthy validation episodes 的最高分位數決定；當 $s_t>\theta$ 時才告警。這樣做的重點是 causal：第 $t$ 步不能看到未來，也不需要 failure labels。

**Paper claim.** ESN-CUSUM 的 scoring 約 200 微秒／step，低於逐步呼叫 7B auditor；但 full v4 telemetry adapter 的中位數成本是 674 微秒／step，這兩個數字不能混成單一 latency guarantee。

**Bloss0m judgment.** 方法真正可移植的是「healthy null + per-channel accumulation + deterministic checks + rollback」的邊界設計，不是 ESN 這個單一模型選擇。

## 評測設計：資料、baseline、指標與成本

論文及其 artifact 的 corpus 共含 2,823 個 episode、25 個 corpus；其中 770 個使用真實工具，其餘使用 deterministic mock-tool suite。模型分布是 qwen2.5:7b 1,890 個、llama3.1:8b 433 個、qwen2.5:3b 357 個、gemini-2.5-flash 143 個。三類 agent framework 主要包含 native Ollama loop、LangGraph 與 AutoGen，另外有研究任務與 live-tool corpus。這裡的「real」是執行過 real tools，不等於 production traffic；failure injector 仍控制了不少研究 corpus 的 onset。

比較方法包括 memoryless Mahalanobis 與 $\Delta$-Mahalanobis、cosine/self-drift、rolling entropy、linear VAR-ridge、GRU、LSTM、TCN，以及 ESN 與 Mahalanobis 的 hybrid fusion。決定性層則用 `total_consistency`、`required_coverage`、`tool_contract` 與 numeric-grounding check。主要報告的 metric 是 AUROC、固定 false-alarm budget 下的 detection rate、steps saved／mean lead、false positives、recovery rate、task success、calls per recovery、latency 與 state footprint。

大多數 offline monitor study 是 CPU-only；artifact 的 reproduction record 以 Windows 11、Python 3.14.5、24 logical cores 為一個已記錄環境，GRU/LSTM/TCN 另外需要 CPU 版 PyTorch。live agent 需要本機 Ollama 與 qwen2.5:7b 或 llama3.1:8b；Gemini corpus 與 measured judge 則需要 Gemini API。這些是 artifact 所記錄的設定，不是我對任何平台的最低硬體保證。

## 結果一：時間訊號有效，但只在有時間累積時有效

在 synthetic testbed 的五個 seed 中，主要 `esn_cusum_max` 在 5% false-alarm budget 下 detection 是 $0.707\pm0.068$，episode AUROC 是 $0.872\pm0.015$，平均 lead 是 4.6 steps；最強的 memoryless $\Delta$-Mahalanobis detection 是 $0.374\pm0.03$。這個 headline 必須連著它的 testbed caveat 讀：injector 提供 ground-truth onset，卻不等於真實世界失敗的完整分布。

![Real agent traces：監控器在注入失敗與 grounding blind spot 的 step-level 行為](https://arxiv.org/html/2608.02464v1/fig1_score_traces_real.png)

*Figure 1：真實工具軌跡上的 CUSUM score。注入的 context corruption、goal drift、looping、tool cascade 在驗證 onset 後被告警，而 grounding loss 的行為 channel 可以保持平坦；該類由 deterministic grounding verifier 處理。來源：[Dubey, Figure 1／§5](https://arxiv.org/html/2608.02464v1#S5.F1)，圖像依論文 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

論文的 horizon diagnosis 更有工程價值：在 1,002 個 injected episodes 上，ESN 相對 Mahalanobis 的 detection gap 在 post-onset horizon $\leq3$ steps 是 +0.09、4–8 steps 是 +0.14、$\geq9$ steps 是 +0.40。也就是說，reservoir 需要「失敗已經開始、但 episode 尚未結束」的時間；如果錯誤發生後只剩一兩步，memoryless distance 反而很有競爭力。

## 結果二：跨 corpus 的 failure coverage 才是誠實的 headline

![Real deployments：不同 failure class 的 monitor coverage](https://arxiv.org/html/2608.02464v1/fig3_class_coverage_real.png)

*Figure 2：九個 real corpus 的 primary-monitor detection rate。空白代表該 corpus 沒有該類，不是 detection 為零。looping 約 0.48–1.00，tool cascade 約 0.17–1.00，goal drift 在出現的四個 corpus 是 0.66–0.86；weak spots 是 wrong_document 0.00–0.20 與 malformed_json 0.05–0.50。來源：[Dubey, Figure 2／§5](https://arxiv.org/html/2608.02464v1#S5.F2)，依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

這張圖比 pooled AUROC 更能阻止過度解讀。looping、工具錯誤連鎖、突然的 goal drift 通常會改變可觀察的 dynamics；錯誤內容如果沒有改變行為，monitor 就看不到。跨部署 transfer 也不是免費的：qwen2.5:7b 上校準的 monitor 直接套到匹配任務的 llama3.1:8b，AUROC 是 0.527、healthy false alarm 是 0.75；在目標 deployment 重新校準後才到 0.885。

**Evidence.** 這裡的結論是「校準分布很重要」，不是「llama3.1 很難」。paper 也報告 qwen2.5:7b 到 3b 的未校準 transfer 接近 chance，而 3b corpus 自身重新校準只有 0.556，因此 target difficulty 與 calibration shift 仍糾纏在一起。

## 結果三：content blind spot 要交給不同機制

行為監控與一般 statistical monitor 共享一個盲點：資料被改壞，但 agent 的行為仍然看起來合理。論文在 telemetry v4 加入九個 content-grounding features，包含 query-result dissimilarity、result self-consistency、JSON prefix validity、character anomaly 與 lexical relevance flag。

在 [§8 的 Table 2](https://arxiv.org/html/2608.02464v1#S8.T2) 中，pooled injected episodes 共 $n=874$，其中 content classes $n=313$、behavioral classes $n=561$。content gate 把 content-class detection 從 0.27 提到 0.58（+96／-0），behavioral-class detection 則從 0.74 提到 0.79（+27／-0）。這支持的是「加一個對的 channel 可以覆蓋結構化內容錯誤」，不是「grounding 能驗證所有事實」。wrong-but-well-formed 的 plausibly wrong number 仍需要外部 reference。

論文也測量了把 token-surprisal channel 拿掉的結果：ESN 的 AUROC 變化是 +0.000，detection 只變 +0.002。這意味著 provider 不提供 logprobs 並不會自動摧毀整個設計；真正不能省略的是被 monitor 看得到的 structured tool results。

## 結果四：Hybrid 更穩，但不是支配所有 deployment

![Hybrid logistic fusion：不同 deployment 的 Mahalanobis／ESN 決策邊界](https://arxiv.org/html/2608.02464v1/hybrid_explain.png)

*Figure 5：hybrid logistic fusion 在不同 deployment 上學到的決策邊界；短 horizon 的 real-agent data 更偏 Mahalanobis，長 horizon simulator 更偏 ESN。來源：[Dubey, Figure 5／§7](https://arxiv.org/html/2608.02464v1#S7.F5)，依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。*

cross-fit logistic hybrid 的 pooled AUROC 是 0.826，ESN 單獨是 0.802，$\Delta$-Mahalanobis 是 0.807；這是不同 parent 在不同 regime 各有盲點的 pooled gain。但在八個 dataset 上，它相對「該 dataset 表現較好的 parent」有七個 AUROC 不更好，八個 detection rate 都不更好，平均 detection 差 -0.140。紙本因此把 hybrid 定位成 deployment regime 未知時的 default，而不是 dominance result。

這個結果與 repository 的 ablation 一起看更重要：把相同的 per-channel max wrapper 給 GRU 後，GRU detection 可到 0.76、AUC 0.873，優於 monolithic GRU 的 0.60／0.82。**Bloss0m judgment：大部分 margin 可能來自 channel-wise fusion 與 calibrated threshold，而不該簡化成 ESN 本身打敗所有 sequence model。**

## 決定性驗證與 repair：最接近 production 的一組結果

三個 deterministic checks 不需要 healthy null、threshold 或 calibration：

- `total_consistency` 從 agent 真正收到的 tool results 重算 stated total。
- `required_coverage` 檢查任務要求的每個呼叫是否真的完成。
- `tool_contract` 在 result 到達時檢查它是否符合 tool 可回傳的 shape。

在 [§10 的 Table 3](https://arxiv.org/html/2608.02464v1#S10.T3) 中，served temperature $T=0.2$ 的同批 episodes 上，checks 捕捉 60% failures、加 coverage check 後 96%，monitor 是 54%；checks 的 false positives 是 0/63，monitor 是 11/63（17%）。對 disjoint task seeds 的 120-episode holdout，checks 只有 totals 時捕捉 54%，加 coverage 是 93%，false positives 是 0/64；同一 task plan 的 llama3.1:8b arm 則是 110/110 failures、0/10 false positives。這些 denominators 不同，不能拿來拼成一個通用 96%。

repair study 將 flagged run rollback 到同一個 checkpoint，再以相同 prefix 重跑；每個 repair rung 在 55 個 genuinely-wrong episodes 上做三次獨立 repeat。[Table 4／§10](https://arxiv.org/html/2608.02464v1#S10.T4) 的結果是：plain resample recovery 16%，只指出「哪個 check 失敗、不要給值」的 `located` 是 45%（$p=0.0005$，每次 recovery 6.4 calls），generic 36%，specific 36%，recompute 28%，adaptive 21%。經 Bonferroni $\alpha=0.01$ 後，只有 `located` 的 headline survives；generic 與 specific 應視為 suggestive。

在整體 120 episodes 的 net accounting 中，`located` 把 task success 從 52% 提到 73%，recover 25 個 failures 且沒有破壞原本正確的 run；單純 resampling 已經有 16% recovery，所以提升不能全部歸因於「重試」。這是本文最值得帶回 platform 的結果：**告訴 agent 哪個可驗證條件失敗，比把正確答案直接塞給它更有用。**

## Organic failure、hallucination 與負結果

這篇 paper 最成熟的地方，是沒有把 hallucination 研究包裝成成功故事。30 個非注入、高 temperature episode 中有 11 個 organic failures：7 個 silent abort、3 個 fabricated counts、1 個 ungrounded retrieval blend。未重新 fit 的 behavioural monitor 只抓到 3 個 fabrication 中的 1 個，而且 organic failure set 的 within-organic AUROC 是 0.31–0.42；temperature-matched null 在 healthy episodes 上仍有 36% false alarm。55-episode pre-registered replication 只產生 2 個 candidate hallucinations，低於預先要求的 10 個，因此**沒有提出 hallucination detection claim**。

相對地，completion check 抓到 7/7 silent abort、0 false positives；numeric-grounding verifier 在 provoked corpus 對 11 個 ungrounded-input fabrication 的 detection 是 0.55，另一次 deterministic checks 對 26 個 provoked fabrications 是 26/26。它們分屬不同 denominator、不同 layer，不能寫成「hallucination 100% 可偵測」。

## 限制、威脅與 evidence 不支持的解讀

**Paper-stated limitations.**

- 健康 null 必須在 exact serving distribution 收集：model family、temperature、toolset、probe pattern、latency regime 變了就要重校準。
- slow goal drift 幾乎逃過 per-step-surprise monitor；只有 trajectory self-consistency 弱弱地看得到。
- 沒有被 telemetry 傳入的 result 就不可見；內容太短也可能沒有足夠訊號。
- plausible-value corruption 在 observable telemetry 下原理上不可判斷，必須接外部 reference。
- fabrication 的 organic base rate 太低；研究範圍是 mock-tool 與 research-loop tasks、兩個 local model family 加一個 commercial API，wall-clock latency 也具機器相依性。

**Selection and reproducibility threats.** Data card 記錄 2,056 次嘗試中有 512 次被 acceptance gate 丟棄，整體 discard 24.9%，各 corpus 從 1.2% 到 55.4% 不等。外部 AFTraj-2K 與 ATBench 是下載後使用，沒有由 repository 重新散布；外部 dataset 的 coverage 因此仍受其原始資料與轉換流程影響。

**Claims not supported by the evidence.** 這篇 paper 沒有支持 universal zero-false-positive production monitoring、跨 deployment 不需 calibration、或可靠捕捉所有 agent hallucination。它也沒有證明 rollback 在工具本身壞掉時能修好一切：live repair matrix 顯示 goal drift 是唯一一個 retry 能修復的 class，tool cascade 與 looping 更像是需要快速結束或 escalation；grounding loss 應交給 grounding check。

## 工程落地：何時用、何時不要用

如果要把這個想法放進 production agent，我會先做一個窄版 control loop：

1. 在 adapter 層固定並版本化 telemetry schema，至少保留 tool call、result、error、latency、task anchor 與完整 event trace。
2. 用每個 deployment 的 healthy corpus 建立 null，並用 model、temperature、tool roster 改變後的 holdout 做 recalibration test。
3. 將 deterministic checks 與 behavioural monitor 分開計算 precision、recall、latency 與 failure class；不要用一個總分隱藏它們的 coverage gap。
4. 讓高風險告警回到最後一個 verified checkpoint；repair prompt 只描述可驗證的失敗條件，並保留原始與修復後 trace。
5. 將 judge 放在 escalation layer，而不是每一步都呼叫；但先用真實 judge calibration 取代 paper 中理想化的 judge 假設。論文 §6 實測 Gemini judge 的 $p_{detect}=0.548$、$p_{false}=0.052$，原先假定的 0.90／0.02 會讓 detection recovery 從 82% 降到 43%。

不要在以下情況單獨使用它：結果不會流經 telemetry、任務需要外部世界 reference 才能判斷數值真假、episode 太短而沒有 post-onset horizon、或部署的健康行為尚未收集。此時應先做 contract verification、外部 fact check、人工／模型 escalation，或設計可恢復的 circuit breaker。

## Reproducibility：截至 2026-08-07 的 artifact 狀態

我在 2026-08-07 獨立檢查了論文提到的 endpoints：

- [GitHub repository](https://github.com/sunnydubey1111/agent-trajectory-sentinel)：public，`README.md`、pinned lock files、code、traces、results、`DATA_CARD.md`、`REPRODUCE.md`、claims ledger 與 manifest 都可讀；repository [LICENSE](https://github.com/sunnydubey1111/agent-trajectory-sentinel/blob/main/LICENSE) 是 MIT。quickstart 提供 synthetic study、figure regeneration、verification study、repair re-analysis 與 live demo 指令。
- [Hugging Face dataset](https://huggingface.co/datasets/sunnydubey1111/agent-trajectory-sentinel)：endpoint 可用，dataset page 顯示 parquet、2,823-episode corpus 與 `mixed-see-licensing`；資料不是空頁或 gated download。其 model outputs、Wikipedia、Open-Meteo 與外部 benchmarks 仍受各自 upstream terms 約束。
- [Hugging Face live demo](https://huggingface.co/spaces/sunnydubey1111/agent-trajectory-sentinel-demo)：endpoint 可用，頁面在檢查時標示 `Running`。這驗證的是 demo surface 存在，不等於我在本機重跑了 model call。
- [Recorded walkthrough](https://youtu.be/a05n_000klE)：short URL 可解析到 YouTube watch page；它是說明材料，不是可重現 artifact。

最小的 offline reproduction 是 pinned CPU environment 下跑 synthetic experiment、verification study 與 repair-policy re-analysis，再把 shipped tables 對回 `CLAIMS.md`。需要 Ollama 或 Gemini 的 real-trace／live study 應視為 conditional reproduction；外部 AFTraj-2K、ATBench 與第三方模型輸出也不能因為 repository 可讀就宣稱全部可再散布。

## 結語：把「偵測失敗」改成「管理已知邊界」

AgentTrajectorySentinel 的核心貢獻不是一個神奇的 ESN，而是把 agent reliability 拆成可觀測、可驗證、可回滾的幾個控制點：行為偏移由 monitor 處理，工具與數值一致性由 deterministic verifier 處理，未知或高風險狀態才升級到 judge，錯誤狀態則回到最後一個 verified checkpoint。

它與 [OSReward 的跨平台 agent outcome evaluation](/paper-reading/08-osreward-agent-evaluation/) 是互補關係：OSReward 問「完成後怎麼判斷 trajectory 好不好」，這篇問「還沒完成時怎麼知道 trajectory 正在壞掉」。如果你要把兩者接成一個 platform，應保留失敗類型、denominator、校準狀態與 repair cost，而不是把 offline outcome score 當作 runtime safety guarantee。再往 production governance 延伸，可對照 [Enterprise Agentic AI Governance](/blog/39-enterprise-agentic-ai-governance/) 與 [Enterprise AI Agent Security](/blog/43-enterprise-ai-agent-security/)。

## Primary sources

- [ArXiv record：Real-Time Detection and Repair of LLM Agent Failures](https://arxiv.org/abs/2608.02464)：版本、作者、摘要與 submission metadata。
- [ArXiv HTML full paper v1](https://arxiv.org/html/2608.02464v1)：§3–§11、Figures 1–5、Tables 1–5、limitations 與 artifact appendix。
- [ArXiv PDF v1](https://arxiv.org/pdf/2608.02464v1)：完整 16 頁 preprint。
- [Official artifact repository](https://github.com/sunnydubey1111/agent-trajectory-sentinel)：程式、trace、results、data card、reproduction record 與 claim-to-evidence ledger。
- [Dataset](https://huggingface.co/datasets/sunnydubey1111/agent-trajectory-sentinel) · [Live demo](https://huggingface.co/spaces/sunnydubey1111/agent-trajectory-sentinel-demo) · [Walkthrough](https://youtu.be/a05n_000klE)：作者列出的 material artifact endpoints。
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)：本文引用的 arXiv figures 授權；repository code 的 MIT license 與 recorded third-party data terms 另行適用。
