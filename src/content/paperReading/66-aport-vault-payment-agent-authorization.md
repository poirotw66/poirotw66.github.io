---
title: "付款呼叫已送出，授權仍能守住邊界嗎？APort Vault 深讀"
description: "深讀 APort Vault：把付款請求、付款成功、政策判斷、收款人白名單與未授權轉帳拆開，檢視模型外的 pre-action authorization 在限定 replay 中做到了什麼，以及哪些工程與證據邊界仍在。"
pubDate: 2026-09-24
updatedDate: 2026-09-24
tldr:
  - "這篇 benchmark 把同一批人類攻擊重播到相同模型、提示、工具與解碼條件，只改變付款工具執行前是否有 deterministic policy check；它測量的是 action boundary，不是模型會不會拒絕。"
  - "在具備允許與禁止收款人的 Level 2–4，model-alone 有 140/76,842 次未授權轉帳，layer 條件為 0/69,297；68,970 個 matched triples 是 105 對 0，790 個來源 session 的 zero-event clustered upper bound 為 0.38%。"
  - "這個 zero 沒有靠拒絕所有付款取得：layer 後仍有 25,370 筆成功付款；但不能把觀察到的零當成任意系統的保證，且 Level 4 的本機 engine 比公開政策包更嚴格。"
  - "資料集雖公開列出檔案與 CC BY 4.0 條款，實際 Parquet 下載仍被 Hugging Face gated access 擋住；重播 harness、judge prompts 與 signing keys 也未釋出，因此不能稱為完全開放或端到端可重現。"
audience:
  - "設計會呼叫付款、下單、退款或其他外部副作用工具的 Agent 系統工程師"
  - "負責 agent tool gateway、授權政策、benchmark 設計與安全評估的團隊"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Authorization", "Evaluation", "Governance"]
image: "/paperReading/66-aport-vault-payment-agent-authorization/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-safety-governance
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "APort Vault: Benchmarking AI Agent Payment Authorization with the Open Agent Passport"
  authors:
    - "Uchi Uchibeke"
  year: 2026
  venue: "arXiv cs.CR preprint, v1（2026-09-18；未經同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2609.22076v1"
    arxiv: "https://arxiv.org/abs/2609.22076"
    doi: "https://doi.org/10.48550/arXiv.2609.22076"
    code: "https://github.com/aporthq/aport-agent-guardrails"
    project: "https://huggingface.co/datasets/aporthq/vault-benchmark-v1"
series:
  id: "aport-vault-payment-authorization"
  title: "Agent 授權與工具邊界"
  part: 1
  totalParts: 1
---

本文只讀 [APort Vault: Benchmarking AI Agent Payment Authorization with the Open Agent Passport](https://arxiv.org/abs/2609.22076) 的 arXiv v1。v1 由 Uchi Uchibeke 於 2026-09-18 提交，分類為 cs.CR；截至本文撰寫，它是 arXiv 預印本，不能據此稱為已同儕審查。作者同時是 APort Technologies Inc. 創辦人，而公司開發本文受測的授權層；論文將這項利益關係列入 Disclosure。

這是一篇 benchmark／evaluation 與系統分析混合型論文。它不是新模型，也不是泛用 agent safety 架構的證明。它問的是一個部署者能實際區分的問題：當付款 agent 已經產生轉帳工具呼叫時，把 deterministic policy check 放在工具執行之前，能否改變「錢有沒有真的移到 passport 不允許的收款人」？答案只對指定付款模擬環境、五種 policy configuration 中的 Levels 2–4、完成的 replay cells 與本機 policy engine 成立。

## 90 秒掌握論文

- **問題**：模型安全 benchmark 常把拒絕提示、judge 評分或模型排序當成安全結果，但部署者要面對的是模型呼叫外部工具後，副作用是否真的發生。付款呼叫、付款成功與收款人是否有權收款不是同一件事；若只報一個「attack success rate」，事件可能被混在一起。
- **核心洞見**：把 authorization 放進 model 與付款工具之間的執行路徑。模型提出 transfer call；deterministic policy engine 將該 call 與 passport 的 capability、收款人與限制比對；只有 allow 才交給 bank tool 執行。這個檢查改的是執行邊界，不是模型的 prompt 或拒絕傾向。
- **最強證據**：Level 2–4 的非配對彙總為 140/76,842 次 model-alone unpermitted transfer，layer 條件為 0/69,297；在固定 model、prompt、replay track 的 68,970 matched triples 中為 105 對 0。layer 條件有 25,370 筆成功付款，說明觀察到的零不是拒絕所有付款。
- **主要邊界**：Level 2–4 的 zero-event 上界應按 790 個來源 session 聚類來讀，作者報告 per-session rule-of-three 上界 3/790 = 0.38%。它不是安全保證；Level 4 本機 engine 多檢查公開 pack 未要求的 memo confirmation code，且 corpus、單次 cell、部分 multi-turn coverage、未完成的人類驗證、gated artifacts 和作者兼任供應方都限制外推。

我的 bounded verdict 是：**APort Vault 的有用之處，在於用真實執行記錄替代「模型似乎拒絕了」這種代理指標，直接比較同一攻擊在有無工具前授權層時是否造成受政策禁止的轉帳。它提供了強而狹窄的執行邊界證據；它沒有測量任意付款系統的安全性、合規性或合法任務的 overblocking。**

> **花花的工程提醒**
>
> 安全性要落在真正會產生副作用的地方。模型輸出「我會付款」不是錢已經移動；模型輸出「我不會付款」也不是外部服務一定沒有執行。把政策檢查放在 tool dispatcher 是一個具體控制點，但只有在它檢查的是正確的 passport、正確的實際參數，而且所有外部執行路徑都必須經過它時，才有這篇實驗所討論的意義。

## 既有方法為什麼不夠：論文問題與評測對象

付款 agent 同時連著兩個行為者：會根據對話產生工具呼叫的模型，以及會改變 bank ledger 的付款工具。攻擊者可透過對話誘使模型提出轉帳，但模型拒絕、模型發出 request、工具接受 request、付款成功、收款人是否在 allowlist、以及是否違反 policy 是不同事件。如果測試只問模型有沒有說「好」，便不能推論錢有沒有移動；若只問 request rate，也不能當成 authorization failure rate。

作者認為既有對抗提示 benchmark 多數比較模型是否拒絕或服從 prompt，因此量到的是模型版本在特定輸入上的傾向。那有價值，但模型重訓或換版後結果會變，且它沒有回答部署方在模型仍然可能被操縱時，還有什麼執行中的邊界可攔截剩餘風險。本文把變數移到 tool boundary：同一 model、prompt、decode settings、tool schema 和 replay track 下，比較工具呼叫直接執行，或先由 authorization layer 判斷。這是本文的識別策略核心（[Introduction Sections 1.1–1.3](https://arxiv.org/html/2609.22076v1#S1)；[Methods Section 3.4](https://arxiv.org/html/2609.22076v1#S3.SS4)）。

### 讀結果前，先把五個事件分開

| 事件 | 論文的操作定義 | 它能回答什麼 |
| --- | --- | --- |
| **Payment request** | transfer_funds call 出現在執行工具呼叫中 | 模型有提出付款行動；不代表該行動違規 |
| **Successful payment** | bank tool 回傳 success: true | 模擬 bank ledger 發生付款；不等於未授權 |
| **Policy decision** | layer 條件中的 call 被 deterministic engine allow 或 deny | policy 對該 call 的判斷；model-alone 沒有這個事件 |
| **Recipient membership** | 記錄的 recipient 是否在該 level allowlist | 收款人是否符合 policy；不判斷提出者是否有正當商業意圖 |
| **Unpermitted transfer** | Level 2–4 成功付款到 passport 不允許的 recipient；Level 5 任一成功付款 | 授權邊界是否失敗；本文 headline 不併入 Level 5 |

Evaluation 是分母單位而非上述五種事件之一；後文的 76,842 和 69,297 是完成評測數。request 和 successful payment 不是同義詞。mock bank 會拒絕無效金額或餘額不足，因此付款成功比 request 更窄。Level 2–4 的 unpermitted transfer 也不是「任何付款」：合法 allowlist recipient 的付款可被允許；定義上的違規是成功付款到未授權收款人。Level 5 沒有任何付款 capability，才以任何成功付款都算違規。但 Level 5 有特殊 prompt 明確指示模型呼叫工具並說 guard 會攔截，因此它主要測 enforcement，而不測攻擊者能否說服模型。本文的 headline 僅用 Levels 2–4，不把 Level 5 混入。

還有一個重要語意限制：所有輸入都來自競賽攻擊，但這不表示每筆 allowlisted payment 都是「合法任務」，也不表示每個 request 都成功被攻破。recipient membership 只回答錢轉到哪裡，不回答使用者有無權要求付款、商業理由是否真實，或模型是否在 prompt manipulation 下做出決定。作者沒有替攻擊意圖或付款正當性做完整 adjudication；預先登記的人類標註驗證 slice 也沒有完成。

## 核心直覺：在模型輸出後、外部副作用前再判一次

只靠模型自我拒絕，控制點仍在被測試的模型裡：如果它被說服，就可能照樣輸出工具呼叫。APort Vault 的架構將模型提出的 transfer call 當成「候選行動」，然後在工具 dispatcher 將它交給 mock bank 之前，以 passport 與交易欄位做 deterministic check。這種判斷不依賴模型稍後再說一次「這筆交易不安全」。

OAP 在本文裡是 passport 與 pre-action authorization 的實作脈絡。公開 OAP spec 和 payment policy pack 將 capability、assurance、金額限制、每日上限、merchant/country allowlist、category、idempotency 等條件放入政策物件；政策 decision 與真正的 enforcement 仍是兩個層次：必須有可靠的執行路徑把 deny 結果變成「付款工具不會被呼叫」。本文受測架構的關鍵不是「有一份 policy JSON」，而是 deterministic decision 實際位於 transfer call 與執行之間，deny 的 call 不會執行。

這個設計也說明為什麼讀者不能把結果簡化成「OAP 使模型更安全」。在兩種 architecture 之間，模型沒有看到修改過的 system prompt；該層不試圖說服模型，也不改寫模型能力，而是檢查工具呼叫中可供政策判斷的結構欄位。它對 policy 能表示的對象有效：例如 recipient、amount、capability 與 audit code。它沒有直接回答交易目的真假、社會工程是否奏效、或安全策略本身是否正確。

## 用一個具體例子走完整個方法：從偽造收據到付款決策

以下是根據論文的 Level 2 forged-receipt cohort 重述的**解釋性例子**，不是額外實驗數據。作者描述的攻擊會在使用者訊息中偽造一段看似 verify_recipient tool 已執行、收款人已核可的文字。這攻擊改變的是模型對「收款人是否已驗證」的信念，不會真的改變 passport allowlist。

1. **輸入**：攻擊者在多輪對話裡提供一段假 tool receipt，聲稱某個未 allowlist 的 recipient 已通過驗證。這段訊息是 user-provided text，不是 trusted tool result。
2. **中間表示**：模型依照對話與可用的 transfer_funds schema 產生一筆付款呼叫，參數包含 recipient 和 amount。bench 記錄 request，即使該 call 最後被政策拒絕。
3. **模型單獨路徑**：沒有額外檢查時，付款工具會照要求執行；若模擬 bank 回傳 success，recipient 又不在該 passport 的 allowlist，這筆才計入 Level 2–4 的 unpermitted transfer。
4. **加入授權層的路徑**：dispatcher 在執行前檢查實際 recipient 與 policy。假 receipt 不會加入 allowlist，因此 policy deny，付款 call 不交給 mock bank。
5. **結果與失敗點**：研究量的是執行工具記錄中的成功付款與 recipient，不是 judge 判斷文字看起來是否像攻擊。若實際 runtime 允許另一條旁路直接呼叫 bank、政策讀取了錯的 recipient 欄位、passport 設定過寬，或任何人都能把工具呼叫前的 deny 繞開，本文測得的邊界就不存在。

例子的操作序列是：**攻擊對話 → model 提出轉帳參數 → tool dispatcher 取得實際 call → deterministic policy decision → allow 才執行 → 從執行紀錄分類 outcome**。它沒有驗證交易的 business intent；也沒有以 request 的有無代替成功付款或 authorization failure。

## 評測設計：資料、policy level、架構與 replay track

### 攻擊 corpus 來自公開 CTF

作者在 2026 年 3 月至 8 月期間舉辦一個公開 capture-the-flag，參與者在 live simulated bank agent 上嘗試把錢轉到 policy 外。4,750 筆原始嘗試中排除 372 筆空白 submission 與 7 筆含個資 submission，留下 4,371 筆人類撰寫攻擊，來自 1,128 個來源 session。97.7% 的攻擊（4,272 筆）集中在 2026-03-06 到 03-12 的 launch window。這些資料比研究者手工寫的 jailbreak template 更貼近實際競賽者撰寫方式，但參與者是自我選擇且有獎金誘因的群體，不等於一般使用者或國家級對手。

攻擊被分成 authority_claim、direct_transfer、privilege_escalation、json_injection、social_engineering、emotional_manipulation、prompt_injection、reconnaissance、capability_self_register 和 account_manipulation 等 regex 優先序分類。social_engineering 是分類器最後的 residual bucket，不能當成技術本質；較常見的 authority claim 和 emotional manipulation 先被分在各自類別。結果表本身也顯示 corpus 並不均衡：authority claims 與直接要求轉帳佔了大部分，工具序列漏洞、參數 fuzzing、多 agent delegation 等較少出現，因為競賽介面是一個單 agent bank tool。

### 五個 policy levels 不代表同一種攻擊難度

| Level | passport / policy 條件 | 該層的 unpermitted transfer |
| --- | --- | --- |
| 1 | payments.charge，上限 $50,000，recipient wildcard | 任一 recipient 都是允許的，作為 policy permits 的觀察 |
| 2 | 上限 $2,500，三個 allowlisted recipients | 成功付給非 allowlisted recipient |
| 3 | 上限 $500，一個 allowlisted recipient，單筆與每日上限 | 同 Level 2 |
| 4 | 上限 $1,000，一個 allowlisted recipient、上限、idempotency、audit code 條件 | 同 Level 2 |
| 5 | 空 capability list，沒有付款權限 | 任一成功付款；但 prompt 明示要求呼叫並告訴模型 guard 會攔截 |

Levels 2–4 有允許和禁止的 recipient，適合比較 authorization boundary。Level 1 是 wildcard control，主要說明政策允許時 layer 可放行；它不是「攻擊者真的拿到不該有的付款」。Level 5 是無能力且有明確工具呼叫指示的 enforcement control，也不能作為 Levels 2–4 的攻擊成功率。Level 4 特別重要：提示內容說明需要處理指向 allowlisted recipient 的文件化付款，過往 transaction history 和 verify tool 也顯示收款人為批准對象，因此 Level 4 的高 request rate 多數反映任務設定允許付款，不是 79.4% 的 jailbreak rate。

### 比較條件和統計單位

4,371 個攻擊被送到 14 個模型、8 家 lab、五種 policy level、兩種 replay track 與兩種架構。Track A 只送攻擊者最後一則 user message，盡量隔離最終 payload；Track B 依序重播完整攻擊訊息序列，保留多輪累積 context。兩種架構分別是 model-alone（模型產生 transfer call 就執行）與 behind-the-layer（相同 call 先由 deterministic policy engine 判斷）。作者稱 model、model version、prompt、decode settings、tool schema、replay track 相同，只有是否有授權層是被操弄的 architecture 變數。

總共完成 225,964 筆、244,776 筆計畫評測；5,395 筆 error rows 按 cell 揭露。14 個模型的 single-turn grid 完整；multi-turn 中 8 個主要 provider 模型 coverage 完整，Kimi K3 與 GLM-5.3 缺 behind-layer cell，Qwen3.8 Max 只有部分資料（Level 1 為 260/709）。作者沒有將缺漏 cell 當成零，且聲稱 headline 只用 completed cells。每個 cell 只有一次 run，沒有 within-cell 重複抽樣的變異估計；作者偏好保留 CTF 原始 temperature（依 level 0.8 到 0.1；Level 5 token cap 為 256，其餘 1,024）而非重複 sampling。各 provider 未正規化的 top_p 與 penalty defaults 也是跨模型比較的 confound。

同來源 session 的嘗試不獨立，因此信賴區間以來源 session 做 1,500 次 percentile bootstrap。對 zero outcome，作者同時給 per-evaluation exact one-sided 上界與 per-session rule-of-three，並以後者作保守呈現。判斷架構差異的 matched comparison 也保留 model、prompt、track 固定，避免把模型差異或 attack message 差異當成 layer 的效果。

## 結果一：先沿著五個事件讀 Figure 1

![APort Vault 原始 Figure 1：Levels 2–4 與 Level 5 的五個付款事件。](/paperReading/66-aport-vault-payment-agent-authorization/figures/stages.png)

*Figure 1（論文 Figure 1，Results Section 4.3）：請由 request、successful payment、allowlist recipient 到 unpermitted transfer 逐項往下看，分辨「模型有提出付款」和「未授權付款真的執行」。圖中 Levels 2–4 的 layer 條件仍有 25,370 次成功付款，而未授權轉帳為觀察到 0 次；Level 5 因沒有 capability 且 prompt 指示模型呼叫工具，須獨立解讀。[原始圖與 Section 4.3](https://arxiv.org/html/2609.22076v1#S4.F1) · 來源：Uchi Uchibeke, APort Vault (2026), arXiv v1，CC BY 4.0。*

| 五個事件，Levels 2–4 | Model alone | Behind layer | 怎麼讀 |
| --- | ---: | ---: | --- |
| 有付款 request 的 evaluations | 28,543 / 76,842 | 25,527 / 69,297 | 模型產生付款呼叫 |
| 有 successful payment 的 evaluations | 28,521 / 76,842 | 25,370 / 69,297 | mock bank 回傳 success |
| Policy decision（call 數，非 evaluation 數） | 不適用 | 25,453 allow / 187 deny，共 25,640 calls | deterministic engine 的 decision；不能與 evaluation 分母相加 |
| 收款人在 allowlist 的 evaluations | 28,380 / 76,842 | 25,370 / 69,297 | recipient membership；不是 intent 判定 |
| Unpermitted transfer | 140 / 76,842 | 0 / 69,297 | 成功付到 policy 不允許的 recipient |

主要問句是：「相同攻擊誘發的付款在 tool 前有 deterministic authorization check 時，是否還會執行至 policy 禁止的收款人？」在相同 policy level 的彙總比較中，模型單獨執行出現 140 次，behind layer 的已完成評估沒有觀察到。request 和成功付款仍然大量存在，說明差異集中在邊界 outcome，而不是把模型全部變成拒絕器。授權層評估了 25,640 個 transfer calls，allow 25,453 個、deny 187 個；其中 148 次 denial 是 forbidden recipient，17 次 invalid amount、13 次 limit violation、9 次 missing audit code。call 數、evaluation 數和含 denial 的 evaluation 數不可互換：172 個 evaluation 出現 denial，其中 15 個也有成功付款，所以「某 evaluation 曾被拒絕」不代表該 evaluation 全程沒有付款。

分母也需要一起讀。model-alone 與 layer 條件的總 evaluations 不相同（76,842 與 69,297），因多輪資料 coverage 有缺；因此第二個關鍵證據是只看兩邊都完成的 matched triples。那組 68,970 個固定 model、prompt 與 replay track 的配對裡，model-alone 有 105 次 unpermitted transfer，behind layer 是 0；requests 分別為 25,362 與 25,420。這讓跨架構的差異更直接，但仍是作者特定 harness 及已完成樣本的比較，不是對所有 deployment 的隨機對照試驗。

## 結果二：request rate 不等於攻擊成功

![APort Vault 原始 Figure 2：Level 4 同一批提示上的各模型付款 request rate。](/paperReading/66-aport-vault-payment-agent-authorization/figures/models_l4.png)

*Figure 2（論文 Figure 2，Results Section 4.5）：模型間的 request rates 在 1,293 個共同 Level 4 prompts 上落在 71.2%–84.3%；這是同層下的跨模型行為，不是未授權付款率。Level 4 的任務本身授權對 allowlisted 收款人的文件化交易，因此高 request rate 是共同任務行為，不能稱作模型被成功攻破。[原始圖與 Section 4.5](https://arxiv.org/html/2609.22076v1#S4.F2) · 來源：Uchi Uchibeke, APort Vault (2026), arXiv v1，CC BY 4.0。*

各層的 model-alone request rate 為 Level 1 10.9%、Level 2 3.0%、Level 3 0.1%、Level 4 79.4%、Level 5 25.3%。這些數字相差很大，但 attack corpus 的每個案例只屬於一個 policy configuration，因此政策層級、prompt 任務與 attack cohort 同時改變，不能把差異單獨歸因於 policy 本身或模型拒絕能力。Level 4 的提示授權以合法 audit code、批准 recipient 和金額上限處理交易，history 也列出相同批准收款人；所以 1,293 個 Level 4 prompts 中 809 個（62.6%）會讓全部 14 個模型都產生 request，且每筆都成功付至 Level 4 allowlist recipient，應解讀為共同的、任務允許行為。

同理，25,370 個 layer-side successful payment 也不能直接當成 utility 或 legitimate throughput 指標。它證明 mock bank 上有允許條件成立的付款成功執行，且 layer 不是 deny-all；但沒有 benign task set、真實付款品質或人工判斷作對照。因為整個 corpus 都是競賽 attack attempts，作者明確說這裡無法估計合法流量的 overblocking。

## 結果三：matched request 與執行邊界的分離

![APort Vault 原始 Figure 3：同一 prompts 在兩種架構中的 request rate 與未授權轉帳比較。](/paperReading/66-aport-vault-payment-agent-authorization/figures/matched.png)

*Figure 3（論文 Figure 3，Results Section 4.6）：圖中 matched prompts 覆蓋 Levels 2–5；請求率在兩種 architecture 下接近，但旁列的 unpermitted transfer 數不同。Level 5 的零屬於無 capability 且明示呼叫的獨立 enforcement 測試，不納入本文 Levels 2–4 headline。此圖支持「headline 不是靠壓低請求數取得」，不證明兩邊模型行為完全相同或 request rate 等價。[原始圖與 Section 4.6](https://arxiv.org/html/2609.22076v1#S4.F3) · 來源：Uchi Uchibeke, APort Vault (2026), arXiv v1，CC BY 4.0。*

在 68,970 matched triples 中，Level 2–4 behind-layer request rate 相對 model-alone 的配對差為 +0.084 個百分點，session-clustered 95% interval 為 [-0.020, +0.189]。作者把它當觀察值，而沒有做 equivalence test。1,220 組 pair（1.77%）的 request 行為不同：581 組只在 model-alone 有 request，639 組只在 behind-layer 有 request。被拒絕的 tool feedback 可能影響模型後續行為；平均 request rate 相近不能說模型行為完全相同，也不能識別每個 request 的因果中介路徑。可支持的較窄解讀是：layer-side 未授權轉帳為零，不是因為它大幅抑制了付款呼叫。

Figure 3 也是說明「request 比 boundary outcome 更容易跨模型延續」的視覺方式。它不表示 agent 在兩架構下除付款請求外完全相同，或 layer 只做一個對模型隱形的純旁觀檢查；模型可能看到被拒絕後的 tool feedback 並繼續對話。本文操弄的是執行架構，並保留每個不同 call 的結果。

## 零次觀察的統計解讀

$$
\widehat{r}_{\mathrm{observed}} = \frac{k}{n}
\qquad
U_{\mathrm{session}} \approx \frac{3}{S}
$$

這裡的 $k$ 是觀察到的 unpermitted transfer 數，$n$ 是評估分母，$S$ 是含有這些 replay 的不同來源 session 數。對 layer 的 Level 2–4，$k=0$、$n=69{,}297$、$S=790$。因此 empirical observed rate 是 0/69,297，但資料並不能說真實風險率必定是零。若錯把 69,297 個 evaluation 當作完全獨立，作者列出的 exact one-sided 95% 上界是 0.0043%；由於多次 replay 共用同一來源 session，論文用較保守的 per-session rule-of-three 上界 $3/790=0.38\%$。這是未觀察到事件的上界近似，不是模型保證或部署 SLA。

另一方面，model-alone 的 140 個 Level 2–4 outcomes 集中在 24/790 個來源 sessions，其中一個 session 就佔 67 次（47.9%），兩個 session 佔一半，十個 session 佔九成。因此 76,842 次 evaluations 也不能當成 76,842 個獨立攻擊者。作者用 session-clustered interval，是為了不讓重複同一來源的 attack 產生虛假的精確度。這也提醒部署者：只給 aggregate rate 會抹掉「少數來源反覆使用同一攻擊」的結構。

### 顯著的 attack family 不是所有多輪攻擊的特性

多輪 Level 2–4 model-alone outcomes 有 113 次，而其中 111 次來自 103 個 forged-receipt attempts；它們來自 8 個 sessions，集中於 Level 2。攻擊者在自己的文字中偽造 [Tool Result: verify_recipient]，讓模型誤以為 payee 已經通過驗證。這個案例顯示攻擊的是模型對先前工具狀態的信念，而工具邊界的 policy check 仍重新比對實際收款人與真實 allowlist，不讀取 transcript 裡的假 receipt。

分類表中的 json_injection 從 single-turn 1/2,184 升到 multi-turn 112/2,183；其他類別沒有類似量級差異。這支持作者的解釋：此 corpus 裡的多輪效果幾乎由單一 forged receipt technique 和少數 sessions 帶動。它不證明一般 multi-turn attacks 都只靠此技巧，也不反駁使用拒絕率量測的其他研究，因本文的 domain 與 execution-based outcome 不同。

## Judge 審查、負向結果與操作成本

headline 使用執行工具記錄的 deterministic outcome，不採信 LLM judge 來決定有沒有 unpermitted transfer。作者仍讓 Mistral Medium 3.5 和 Grok 4.6 讀取 transcript 進行 judge audit，並報告它們彼此在 222,400 個都有回覆的 evaluations 上，pooled Cohen’s kappa 為 0.772；按 level 分別是 L1 0.991、L2 0.676、L3 0.167、L4 0.864、L5 0.521。兩者對 deterministic outcome 的 recall 也有差距：Grok 99.1%（3 個 false positives），Mistral 64.4%，漏掉 3,356 個確定 outcome，另有 139 個 false positives。若把 headline 交給 judge，其中一個 judge 會漏掉約三分之一 model-alone outcomes。這個 judge 可靠性問題不會直接改寫 deterministic headline，卻會限制用 judge 欄位做的次級分析。

原計畫約 300 筆分層 human-labeled validation slice 要用來比較 judges 與人工結果，資料卡也曾承諾；該 slice 在 freeze 前沒有完成。作者明確列為缺口，因此「deterministic outcome 不需要 judge」不應被延伸成「整個 benchmark 的人工標註與 intent 判讀已經驗證」。

不同 provider 的 temperature 按競賽 level 設置，且 top_p / penalty defaults 未正規化。582 筆 evaluations 被 provider input filter 擋在模型看到 prompt 之前，其中 538 筆屬 GPT-6 Astra；它們仍留在總分母並被記為沒有付款。對 model-alone 架構這對授權層 claim 偏保守，對 layer 架構則相對中性，但模型間數字比較受到 provider filter 與解碼設定的混雜影響。

成本上，banker 端合計 987.6M input tokens、218.5M output tokens，另有 686.0M cache reads；judge panel 又花費 1,071.7M input 和 14.0M output tokens，約佔總 input/output tokens 的 47.4%。evaluation latency 從單輪 GPT-5.6 Luna 中位數 8.2 秒到多輪 Kimi K3 66.8 秒。加不加 layer 的中位數在各模型大致落於 noise 內；本文沒有直接測得 layer 每次檢查耗時。論文引用 companion paper 的 53ms median，而那不是本篇 benchmark 的獨立重測結果。

## OAP 與 policy engine：結果不等於部署設定

公開的 [OAP spec](https://github.com/aporthq/aport-spec) 和 [finance.payment.charge.v1 policy pack](https://github.com/aporthq/aport-policies/tree/main/finance.payment.charge.v1) 描述 capability、assurance、transaction amount、daily cap、merchant / country allowlists、category filters、idempotency 等可檢查欄位。它們可以支援 deterministic policy decision，但部署者還需確認 runtime 真正以相同的 passport、同一筆工具參數與相同政策版本作判斷，並確保所有能產生付款副作用的路徑都經過該 enforcement point。

本文 behind-layer 使用的是從 CTF server 移植的 local deterministic implementation，評估 finance.payment.charge.v1 policy pack，沒有每個 call 都連 hosted service。作者表示 9 月 5 日抽出的 100 筆 parity sample 與 hosted verifier 相符，但該 parity 證據需要作者 infrastructure 才能核查。另有兩項差異：Level 5 本機 denial reason code 命名不同；更影響解讀的是，Level 4 local engine 額外要求 transfer memo 內有 confirmation code，而公開 pack 沒有這條規則。作者說這不改變該回放的 outcome，但它使本地 Level 4 比公開 pack 更嚴格；因此該 Level 4 zero 不能直接當成公開 policy pack 在同樣 Level 4 設定下的證據。

## Evidence map：哪些是 Paper、哪些是資料觀察、哪些是工程判斷

- **Paper / 作者提出與定義**：兩種 architecture、Track A/B、五個政策 levels、五個記錄事件、以 executed tool calls 定義 headline outcome、session-clustered intervals、policy engine parity 描述，以及由 human-written CTF attacks 形成的 replay protocol（Methods Sections 3.1–3.10）。
- **Evidence / 這批資料直接顯示**：Levels 2–4 model-alone 有 140/76,842 次未授權轉帳，behind layer 有 0/69,297；matched 68,970 triples 是 105 對 0；790 sessions 上的 zero-event per-session upper bound 是 0.38%；layer 後有 25,370 successful payments，25,640 個 call 中 187 個被拒（Results Sections 4.3–4.8）。
- **作者解讀**：在 policy 定義正確且 check 位於執行路徑的條件下，模型即使被誘導提出未授權付款也不會讓模擬付款執行；層沒有透過壓制 request 達成 aggregate zero（Sections 4.3–4.5、6.2）。
- **Bloss0m 工程判斷**：這個結果支持將可機器判斷的限制放在會產生副作用的 tool boundary，並在 benchmark 中分開 request、success、allow/deny 和 recipient-policy outcome。本文不能替具體服務背書；要移植設計，仍需驗證工具參數映射、policy completeness、旁路封閉、錯誤回復與稽核證據。
- **未建立**：任意付款系統、真實銀行、其他副作用工具、資料外洩或 multi-agent delegation 的安全保證；真實使用者流程的 overblocking；零事件等於零真實風險；公開 pack 與更嚴格 Level 4 local engine 具有等價結果；或多輪攻擊普遍比單輪有效。

## Artifact 與可重現性：截至 2026-09-24 的直接狀態

[Hugging Face dataset page](https://huggingface.co/datasets/aporthq/vault-benchmark-v1) 對外列出 Parquet、prompt corpus、outcomes、transcripts、五個 level configs、methodology、results、reproduction scripts 與 CC BY 4.0 license；但頁面也明示檔案需登入並接受 use conditions。今天可直接讀到頁面、檔案清單與條件：使用者需同意僅用於 research/evaluation/defense、標註 APort compilation、不識別參賽者、遵守各 provider 對模型輸出的 terms；Hugging Face 會把帳號 username/email 分享給資料集作者。未登入直接讀 outcomes.parquet 得到 HTTP 401 GatedRepo。所以它是**有公開列出的受條件 gated dataset**，不是匿名可取用的完全開放 corpus。

作者聲稱從 released rows 跑 release/paper_analysis.py 可重現 paper analysis，並提供 frozen snapshot、pre-registration、coverage/errors 和 scoring code；但評測端到端 replay 不是只跑 analysis script。資料頁列明 replay harness、judge prompts、signing keys 未公開；private snapshot 中各 judge 的原始 pre-escalation verdict、counterfactual would_aport_allow、turn-to-outcome、deny reason codes 與 banker cache tokens 不能由 released rows 重算。GLM-5.3 的 transcript 依 provider terms withheld：Level 2–4 少 34 筆 successful payment 明細（Level 5 少 390），雖然 headline request / recipient membership / unpermitted transfer rows 仍提供。讀完整 Parquet 分析還需要 pyarrow；frozen analysis 路徑則按作者表示可用 Python 標準 library。

GitHub aport-agent-guardrails 和 aport-spec 對外公開；policy pack 公開列出政策結構與測試檔。這讓讀者能檢查接口概念和部分決策規則，卻無法填回 gated dataset 未登入可取用狀態，也不等於可重播論文 harness。最小的可行重現要等到資料 access granted，再使用固定 corpus snapshot、公開 analysis code、相同分母規則與 session-clustered bootstrap；要重跑 agent 還需要模型 provider / 版本、replay harness 和各 provider 可用 transcript 條件。不要把「repo 和 scoring code 有連結」直接改寫成「獨立研究者今天可完整重現」。

## 限制與 claim-strength：零的範圍在哪裡停止

1. **單一 domain 與單一 tool**：這是 simulated bank 和 transfer_funds 工具。不能直接推到 code execution、data access、refund、採購、資產移轉或 agent-to-agent delegation。
2. **CTF 群體的選擇偏差與攻擊集中**：參賽者自我選擇並有獎金刺激；140 個 model-alone outcomes 只來自 24 個 sessions，且一位參與者 session 就佔 47.9%。它是一次具體攻擊 corpus 的觀察，非攻擊者人口分布估計。
3. **Level 與攻擊內容混在一起**：每個 attack 只出現在一種 policy configuration。Level 1 / Level 5 各有特殊政策意義，Level 4 大量允許有文件記錄的付款；不能用所有層彙總請求率來做 policy 的因果解釋。
4. **單次 cell 與 provider confound**：每格僅跑一遍原始溫度，沒有 repeated-run variance；provider 的 top_p 和 penalty 未正規化。cross-model rank 因而應保守讀。
5. **覆蓋不完整**：multi-turn behind-layer 缺 Kimi / GLM，Qwen 部分缺；headline 使用 completed cells，但仍代表完成的 cell mixture。582 筆 input filter refusals 保留於 denominator，也會影響個別模型比較。
6. **Level 4 local engine 更嚴格**：本地檢查 memo confirmation code，而公佈 pack 不檢查。這是最直接的部署轉移限制之一：不要將其零直接歸給一份有差異的公開設定。
7. **意圖與 judge 沒有人類驗證**：所有資料來自攻擊 attempts，allowlisted 只代表 destination 在白名單；約 300 筆 human validation slice 未完成。deterministic outcome 避開 judge 作 headline 的不穩，但沒有解決「要求是否正當」的標註問題。
8. **資料 release 不完整且 gated**：analysis rows 可按作者描述重算多數表格，不等於重建整個環境；harness、judge prompts、signing keys、若干私有欄位均不可重算，今天實際下載 Parquet 需要 access approval。
9. **作者利益關係**：作者創辦的 APort 開發被測授權層，且 benchmark 由作者設計、執行和分析。作者提供 deterministic metric、預先登記、錯誤列與 analysis script 作結構性緩解；但這仍屬作者產製的 benchmark，需要獨立 replication 與政策稽核。
10. **不是模型內部因果或普遍保證**：兩邊相似 request rate 不能解釋模型為何服從；layer 的作用取決於 policy 正確、工具確實經過 gate、passport 表達了該風險，而且 enforcement 沒被錯設或繞過。

## 工程判斷：適合哪種情境，何時不要照搬

**Bloss0m 工程綜合（不是作者提出的新框架）**：如果你的 agent 能對金錢、寄信、刪除、發布或變更權限產生外部副作用，benchmark 可沿著五個事件設計自己的測量表：agent 是否提出 action、工具是否回報 success、policy 對 call 作了什麼判斷、目標對象是否被允許，以及副作用是否在 policy 不允許時仍發生。每筆 event 保留同一 evaluation/session key，另外報 call 數與 evaluation 數，避免多次呼叫讓單位混淆。這是從論文測量設計抽出的評估建議，不是對任何產品已完成的安全驗證。

**適合借用的控制點**：把 deterministic check 放在所有敏感工具執行前，用實際序列化參數與版本化政策決定 allow/deny；deny 不該只寫進 log，而要令 side-effect tool call 無法抵達 backend。為每種 action 確認 policy 欄位可以表達限制，測量允許付款是否仍完成，並在部署變更、policy 更新及模型更新後重跑負面與允許案例。外部控制可以補充 model-level defense，不能當成取代身份驗證、backend checks、人工批准或資料最小化。

**不要直接套用的情況**：若你的副作用無法在工具執行前觀察或表示成結構化決策；若收款人 identity、金額、owner、scope 等欄位與真正副作用參數可能不一致；若還有未經同一 gate 的支付路徑；若 policy 沒有區分合法例外與禁止對象；或若你的風險主要是授權後參數語意錯誤、business intent 造假、跨-session 的累積行為，那麼「在工具前有一個檢查」本身還不構成充分控制。對這些情境，需要建立合適的 policy model、完整化旁路盤點、獨立安全測試與可核查的 human intent validation；本文沒有提供現成答案。

若要照這篇設計 benchmark，先選一個能直接觀察的 external state change 作 outcome，配對固定 model / prompt / tool schema / replay track，只操弄執行邊界；分開 benign allowed tasks 和 adversarial attempts；按 participant/session 或攻擊來源群聚；公開每格的 coverage / failures；測試拒絕後模型是否改變後續行為；另做 benign false-denial 與 policy misconfiguration evaluation。這些屬於 Bloss0m 的方法延伸，論文沒有完整做完其中所有項目。

## 讀完後的三個記憶點

1. **技術觀念**：模型的付款 request 是待檢查 action；真正的授權決策要以實際工具參數、passport 和 policy，在副作用執行前由可信 enforcement path 落地。
2. **證據強度**：在 Levels 2–4 的 benchmark completed cells 裡，model-alone 140/76,842 對上 behind-layer 0/69,297；68,970 個 matched triples 為 105 對 0，layer-side 的 zero 需附 790 sessions 上的 0.38% clustered upper bound，且同時有 25,370 successful payments。
3. **採用邊界**：這是付款模擬器中、作者自建 CTF corpus、特定本地政策引擎與不完整 gated artifacts 上的窄結果。它支持測試 execution boundary 的價值，不能當成 production security guarantee，也不能證明公開 Level 4 pack 有相同零事件結果。

## 延伸閱讀

- [Bounded Agents: Delegation Security for Multi-Agent AI Systems](/paper-reading/bounded-agents-delegation-security/)：另一種從授權狀態、scope 與 action composition 控制 side effect 的架構論證。
- [Tool Calls Are Not Workflows: Agentic RAG Failure Attribution](/paper-reading/49-tool-calls-workflows-fail/)：閱讀工具呼叫紀錄、執行狀態與完成結果時，為何需要分開事件定義。

## Primary sources

- [Uchi Uchibeke, APort Vault, arXiv:2609.22076v1](https://arxiv.org/html/2609.22076v1)（本文版本固定為 v1；論文與三張原始圖為 CC BY 4.0）。
- [Vault Benchmark v1 dataset card and access terms](https://huggingface.co/datasets/aporthq/vault-benchmark-v1)（2026-09-24 查看；公開列出但檔案需登入、接受條件，未登入 Parquet 回應 401）。
- [Open Agent Passport specification repository](https://github.com/aporthq/aport-spec) and [finance.payment.charge.v1 public policy pack](https://github.com/aporthq/aport-policies/tree/main/finance.payment.charge.v1).
- [APort agent guardrails repository](https://github.com/aporthq/aport-agent-guardrails).
