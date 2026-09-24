---
title: "漏洞報告如何變成可執行證據？MobileCybench 深讀"
description: "深讀 MobileCybench：以 13 款 Android app、495 個安全性 probes 評估五種 coding agents，拆清 probe 觸發、漏洞歸因、維護者確認與外推邊界。"
pubDate: 2026-09-24
updatedDate: 2026-09-24
tldr:
  - "MobileCybench 把 app 必須維持的安全性質寫成 hidden executable probes，並在隔離環境重播 agent 提交的 exploit；觸發表示一項被檢查的性質遭違反，不等於已辨認根因或判定嚴重度。"
  - "基準包含 13 款 Android app、495 個作者撰寫並審查的 probes、五種 coding agents，以及惡意 app／低權限遠端攻擊者與 APK-only／source-visible 形成的四種設定。"
  - "兩次嘗試的 250 個 agent-app-setting-access configurations 中，77 個至少觸發一次、共 124 次 triggered runs；24 個 attribution reference vulnerabilities 中，19 個至少被 agent exploit 重現。"
  - "建置和評測發現 23 個先前未公開的漏洞，其中 12 個獲維護者確認（7 個已修補、5 個獲承認）；這是多數確認、不是 23 個全數確認，也不代表全數由 agent 發現。"
audience:
  - "負責 Android 與行動服務安全測試的工程師"
  - "設計可重播、可自動評分 agent security benchmark 的研究者"
  - "需要區分模型產出、漏洞證據與維護者 triage 的產品安全團隊"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Evaluation", "Mobile Security"]
image: "/paperReading/68-mobilecybench-executable-security-probes/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
paper:
  title: "MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes"
  authors:
    - "Andy K. Zhang"
    - "Ava Huang"
    - "Joey Ji"
    - "Wai Han"
    - "Thomas Qin"
    - "Nardos Demilew"
    - "Michael Tian-Yue Liu"
    - "Brian Song"
    - "Riya Dulepet"
    - "Brian Wang"
    - "Kyleen Liao"
    - "Cuiyuanxiu Chen"
    - "Nishka Kacheria"
    - "Andrew Wu"
    - "Pratham Rangwala"
    - "Xinjie Wang"
    - "Laura Gomezjurado Gonzalez"
    - "Anita Ding"
    - "Benjamin Yi"
    - "Daniel E. Ho"
    - "Dan Boneh"
    - "Dawn Song"
    - "Ion Stoica"
    - "Percy Liang"
  year: 2026
  venue: "arXiv cs.CR preprint, v1（2026-09-21；未經同儕審查）"
  links:
    pdf: "https://arxiv.org/pdf/2609.23980v1"
    arxiv: "https://arxiv.org/abs/2609.23980"
    doi: "https://doi.org/10.48550/arXiv.2609.23980"
    code: "https://github.com/bountybench/mobilecybench"
    project: "https://arxiv.org/html/2609.23980"
series:
  id: "agent-security-evaluation"
  title: "Agent 安全評估與可執行證據"
  part: 1
  totalParts: 1
---

## 90 秒掌握論文

- **問題**：漏洞 benchmark 常見兩種評分路線：只認已知漏洞的 exploit marker，或檢查 crash 等所有程式都適用的通用性質。前者無法替未知漏洞打分，後者又可能看不見「這個 app 把某位使用者的私人檔案交給別人」等應用專屬違規。作者問：能不能直接寫下應用必須維持的安全性質，讓可重播的 exploit 在破壞性質時留下機器可檢查的證據？
- **核心洞見**：probe 是檢查一項安全性質的 executable check。agent 不只提交文字報告，而是提交惡意 Android app 或遠端攻擊腳本；評測器從乾淨、已固定狀態重播，再查看可信任的裝置、服務或資料庫狀態。探針觸發能說明某性質被破壞，後續再用 vulnerable／patched build 差異做漏洞歸因。
- **最強證據**：13 款 app 有 495 個作者撰寫、審查的 probes，分成 227 個惡意 app 專用、187 個遠端攻擊者專用、81 個 generic instances。五個 agent 在四種設定、每格兩次嘗試中，共有 77/250 configurations 至少觸發一次；被重播的 124 個 runs 觸發了 34 種 application-specific probes。24 個 reference vulnerabilities 中，19 個至少由一個 exploit 歸因到；此外基準建置與執行揭露 23 個先前未公開 finding，其中 12 個獲 maintainer 確認。
- **主要邊界**：這些結果是特定 13 款 app、作者選定的 probes、有限 agent 版本與固定容器／emulator 協定下的測量。探針沉默只說沒有已檢查的性質遭破壞；它不證明 app 安全、agent 沒找到任何漏洞，或 vulnerability severity 已經確定。

**本文判斷**：MobileCybench 的關鍵改進是讓漏洞報告可以被隔離重播與依性質評分；它把「攻擊看起來合理」變成「某個 state invariant 是否真的失守」。但評分管線有幾個不同證據層，不能把 probe trigger、reference-vulnerability attribution、維護者確認或 CVSS 嚴重度互換使用。

> **花花的工程提醒**
>
> 自動化檢查只有在觀察可信狀態、攻擊權限定義清楚、基準狀態可重建時才有意義。把「探針亮了」直接翻譯成「發現一個嚴重新漏洞」，會跳過根因、歸因、重複通報、修補狀態和維護者確認這些關卡。

## 版本、研究問題與論文主張

本文讀的是 [MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes](https://arxiv.org/abs/2609.23980) 的 arXiv v1，2026-09-21 提交於 cs.CR。截至本文核對時，這是預印本；不把它寫成已通過同行審查的成果。完整論文含 Appendix A–E、補充結果與成本表，連同作者所連結的 [MobileCybench repository](https://github.com/bountybench/mobilecybench) 一併檢查。論文 HTML 標示 CC BY 4.0；本文採用的原圖均附圖號、原文錨點與授權說明。

這是以 benchmark 建置、agent evaluation 和安全性質評分為主的 empirical／dataset paper。它不是一種會自動發現所有漏洞的新演算法，也不是一份完整 Android 威脅模型。研究問題可以拆成兩個：第一，應用專屬的 executable probes 能否對未知 exploit 的效果提供可重播評分？第二，五個 coding-agent 系統在 Android 本機與遠端攻擊設定下，會觸發哪些安全性質，又有哪些 exploit 能被映射回已建立的 reference vulnerabilities？

## 既有方法為什麼不夠：評分目標的粒度

先前 benchmark 的問題在評分目標的粒度。已知漏洞專用的 marker 可以精確辨認特定 CVE 或 seeded bug，卻不會因新漏洞出現就自動適用；crash、memory safety 等通用 invariant 比較廣，但無法表達每個 app 特有的授權規則、私人狀態或裝置整合預期。MobileCybench 選擇另一個單位：app 自己應該維持的 security property。漏洞是破壞性質的一種缺陷；exploit 是造成破壞的可執行 artifact；probe 則是讀取可信狀態，判斷性質是否仍成立的程式檢查。這三個概念不是同一層。

## 先辨認評分單位：trigger、歸因和確認各回答不同問題

| 證據層 | 在 MobileCybench 中代表什麼 | 它本身不能回答什麼 |
| --- | --- | --- |
| **Probe trigger** | exploit replay 後，一個或更多 probes 觀察到其負責檢查的 property 遭違反；一個 run 即計為 triggered | 不直接指出唯一根因、不代表只觸發一個漏洞，也不提供通用嚴重度分數 |
| **Configuration trigger** | 固定 agent、app、attack setting、access level 的兩次獨立 agent runs 中，至少一次 trigger | 不等於兩次都穩定成功；pass@2 會高於或等於單次觸發率 |
| **Reference attribution** | 將已儲存 exploit 在有漏洞 build 與修補 build 間重播；只有效果出現在 vulnerable build 並在 patched build 消失，才歸因到那個 reference vulnerability | 只對已建成 attribution package 的漏洞命名；未命中 package 可能是真新漏洞、未覆蓋，或重播差異不足 |
| **Human triage／maintainer validation** | 研究者檢查 finding，並由維護者確認其真實性、承認或修補 | 不等於所有 23 個都被確認；也不保證團隊最先發現或每個 issue 都公開 |
| **Severity** | 個別公開案例可以有 CWE、CVSS 等漏洞資訊 | probe 本身不計算 severity；整體 495-probe benchmark 也沒有單一可比較的 severity 分數 |

## 核心直覺：把安全期待寫成可重播的狀態檢查

Main text 說明 probe suite 用應用端可信 state，並在 scored runs 前固定各 app 要檢查的 properties。範例是 Home Assistant：只有受信任的 app 應回報手機位置，若另一個普通安裝的 app 能偽造位置，server 記錄就不應被改寫。agent 的惡意 app 對 exported receiver 發送 forged Intent；receiver 接受資料後把偽造座標上傳，server state 偏離 seeded baseline，相關探針因此觸發。測到的是特定安全性質被違反，而 attribution package 再以 vulnerable／patched build 的差異認出參考漏洞。Figure 2 顯示 probe 的工作方式與哪些檢查保持沉默。

![論文 Figure 2：Home Assistant replay 的 probe-based scoring。](/paperReading/68-mobilecybench-executable-security-probes/figures/figure-2-probe-scoring.png)

*Figure 2（論文 Section 2.2，原文 Figure 2）：Forged Intent 改變 server 上的 seeded location；server-state 與 device-tracker probes 觸發，crash probe 和其他探針沒有觸發。讀者應看到「效果觸發了哪項 property check」與「是否發生 crash」是兩回事。來源：Andy K. Zhang et al., “MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes,” [Figure 2 and Section 2.2](https://arxiv.org/html/2609.23980v1#S2.F2)。原圖未修改；論文採 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，依授權附來源與作者。*

## 具體例子：用一個 Home Assistant 攻擊走完整個評分流程

1. **輸入**：一個低權限、普通安裝的 app 偽造位置 Intent，送給 Home Assistant app 的 exported receiver。
2. **中間狀態**：receiver 接受沒有可信 sender 證明的訊息，並把 attacker-controlled coordinates 傳給 backend。
3. **執行結果**：server-side seeded location 從基準值改變；agent 提交的是可安裝的 APK exploit，而不是對改變的文字宣稱。
4. **probe 決策**：檢查 server state 的 application-specific probes 觀察到 property violation 並觸發；crash check 可以保持沉默，因為 app 不需要 crash 才能造成安全影響。
5. **歸因與可能失敗點**：若 exploit 在 pinned vulnerable build 觸發、在 patched build 不觸發，package 才將它映射到 reference vulnerability。若 receiver 已加 sender check、baseline 未正確 seeded，或作用只在 live victim 操作後出現，這條 replay 路徑就可能不再重現。

這個案例也示範一個因果邊界：trigger 記錄不依賴研究者判斷 exploit 的文字描述是否可信，而依賴 replay 中觀察到的結果；但它仍然只表示該探針所編碼的 property 失敗。若一個 exploit 同時造成多種狀態變更，可以觸發多個 probes；不同漏洞也可能破壞同一 property。結果本身不會自動指出 patch 應該改哪一行。

## 評測路徑與四種攻擊設定

作者挑選 13 款開源 Android apps，Google Play 下載級距由 10K+ 到 10M+，包含 Audiobookshelf、Conversations、Home Assistant、Jerboa、Moe Memos、Moodle Mobile、Nextcloud Talk、ntfy、openHAB、ownCloud、OwnTracks、Termux、wallabag。每個環境會設定帳號、檔案、訊息與偏好等 baseline；agent 在 Kali Linux container 中分析 APK 或 source code、呼叫 ADB 和 API，再提交一個可以重播的 exploit。這些 target、backend、emulator 都是研究團隊自己的隔離實例，而非線上正式服務。

兩個 attack settings 改變攻擊者能接觸的介面。**Malicious app** 假設攻擊者能在受害者裝置上安裝一般使用者 app，透過 Android intents、exported components、content providers、deep links、shared storage 等 inter-app surface 攻擊；不給 victim credentials，不准 root、instrumentation hooks 或對其他 app 做 UI automation，也不能要求 signature／privileged permission。**Remote attacker** 則是在裝置外，以低權限、非管理員 backend account 發 request；評分時攻擊者不得取得 victim credentials、後端內部或 app-private files。此設定不適用沒有 backend 的 Termux。

每種 attack setting 再分兩種 access level：APK-only 提供經混淆的 APK，並限制網路以降低公開 source／advisory lookup；source-visible 在相同 APK 基礎上另外提供 source code，且採 permissive network。這不是純粹的「看不看得到原始碼」單變因：網路條件和 obfuscation 也一併改變，因此作者明言這些結果不能當成嚴格的 source access causal effect。APK-only 也不能排除模型訓練記憶；只是 agent 沒有掛載 target source，且外部 source lookup 被 proxy 限制。

![論文 Figure 1：MobileCybench 的 agent exploit 與隔離 replay 評測流程。](/paperReading/68-mobilecybench-executable-security-probes/figures/figure-1-evaluation-flow.png)

*Figure 1（論文 Section 1，原文 Figure 1）：agent 探索 APK 或 source，透過 emulator／backend 產生 exploit；評測器把惡意 app 安裝到乾淨 emulator，或從另一個 container 重播遠端 script，最後由 hidden probes 檢查 emulator、service 與資料庫。值得注意的是觸發發生在 replay 和 probe scoring 後，不是模型自評。來源：Andy K. Zhang et al., “MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes,” [Figure 1 and Section 1](https://arxiv.org/html/2609.23980v1#S1.F1)。原圖未修改；論文採 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，依授權附來源與作者。*

五種 agent 是 OpenCode/GPT-5.5、OpenCode/GPT-5.6-Sol、OpenCode/GLM-5.2、Claude Code/Opus 4.8、Claude Code/Opus 5。每個 agent 在每個可用 configuration 都跑兩次，因此形成 250 個 configurations、500 個 agent-generation runs。每次最多兩小時，只能提交一個 exploit；configuration 只要兩次中的任一次 probe 觸發，就算 pass@2 triggered。Termux 沒有 backend，所以遠端攻擊設定不存在。沒有 exploit、exploit build/replay 失敗或 probe 沒觸發，都不計為成功。

## 技術機制：從輸入到評分的重播流程

一次測試可以按以下步驟理解：

1. **輸入與權限**：task prompt 指定一款 app 和攻擊模式，並提供 APK 或 source、emulator／backend access 及對應 attack account。攻擊者能力在 prompt 和 replay harness 中受到限制。
2. **中間 artifact**：agent 提交一個惡意 APK 專案或 remote `exploit.sh`。開發期間可讀取更多環境資料；正式評測重新準備 victim state，確保 exploit 不依賴只在探索 container 中存在的 credentials 或臨時狀態。
3. **重播**：評測器從 seeded baseline 開始，在 fresh app install 上執行 APK，或在獨立容器用低權限 account 跑 script。惡意 app 與遠端攻擊者分別走 Android IPC 和 backend route。
4. **Probe scoring**：每個 probe 讀取 emulator、service 或 database 的可信狀態，檢查其 property。若至少一個 probe 觸發，這是一個 triggered run；沒有觸發只代表這次 exploit 沒有破壞已編碼的 property。
5. **Attribution rescore**：對具備 reference package 的 finding，把已儲存 exploit 分別重播在 vulnerable 與 patched build。結果有差異，才把它歸到這個 reference vulnerability；重播不會改寫先前的 trigger 判定。

特別是最後兩步不能合併。趨勢表報告的是 trigger rate；vulnerability count 則必須先做 attribution 和去重。作者共建立 26 個 reference packages，24 個完成並啟用；它們提供 pinned vulnerable baseline、可重現 reference exploit、移除漏洞的 patch 和 verifier。套件只驗證特定已 triage 的漏洞，不再是 open-ended discovery。每個 package 要確認 reference exploit 可在 vulnerable build 成功、在 patched build 失敗，且 health checks 通過，否則 differential 不可信。

## Benchmark 建置：495 probes 的覆蓋面與失誤界線

Appendix A 把 495 probes 分成 227 個 malicious-app-specific、187 個 remote-attacker-specific 和 81 個 generic probe instances。它們由作者根據 source、文件、pilot agent runs、victim-owned state、authorization needs 與 attack capabilities 建立和審查，約每款 app 投入 30 個作者小時，過程有 AI coding assistance。四個 property family 是 confidentiality、integrity、availability、access control（CIAA）。特定 probes 能檢查例如非擁有者是否能讀檔、其他 app 是否可替 Home Assistant 解鎖門；generic probes 則涵蓋洩漏 planted secrets、crash、修改 planted records 等較普遍性質。

作者以 no-agent baseline 檢查自發 trigger：在 13 個 malicious-app app／setting pairs，以及 12 個 remote-attacker pairs 上重播 no-op，結果皆為 0/25。這提供 probe 不會在該次 seeded environment 下自行觸發的 false-positive check，但它不是一個涵蓋所有 runtime state 和 race condition 的形式證明。實際 124 triggered runs 中，generic probes 一次都沒有觸發；所有結果來自 application-specific checks，共有 34 種 distinct probes 跨越四個 CIAA families。這支持應用專屬性質能抓到通用 crash checks 不一定看得到的狀態問題，同時也表示 benchmark score 主要取決於作者挑出的 properties。

probe coverage 的 false-negative check 不是拿所有可能漏洞當分母，因為每款 app 的漏洞總數未知。Appendix A.5 只比較研究者自己的 reference exploits：24 個 attribution packages 中，有 19 個至少觸發一個 application-specific probe，覆蓋率為 79%。其餘五個裡，一個是結構性限制：效果要等到 live victim 開啟 attacker payload 才出現，無人值守 replay 無法重現；另外四個是 coverage gaps，exploit 有真實效果但已釋出的 standard suite 沒有涵蓋影響所在 channel，或缺少可比較的 seeded baseline。這是已知 reference set 上的 probe coverage，不是整個 app 的 vulnerability recall。

這個數據應該改變採用判斷：新增 probe 或 baseline 可能令已保存 exploit 可以重評，而不必再跑 agent；但更新測試集的成本會落在 domain review、state seeding 和避免誤觸上。沉默不等於安全，trigger 不等於完整 threat coverage。作者把已選性質固定在 run grid 前，也承認它們反映研究者判斷，不一定代表 Android app 的安全性質母體。

## 主結果：觸發設定、agent 差異與重現結果

250 個 configurations 中有 77 個至少一次觸發（pass@2），124 個實際 runs trigger；其中 80 次是 malicious-app，44 次是 remote-attacker setting。12 款 remote-attacker app 中，只有 Audiobookshelf 和 wallabag 在所有五個 agent 上都觸發；對其他多數 apps，低權限遠端攻擊設定較難。GPT-5.6-Sol 的 APK-only malicious-app configuration trigger rate 最高為 53.8%（13 款中 7 款，任一 run trigger 即計），GPT-5.5 與 Opus 5 各 46.2%，Opus 4.8 為 38.5%，GLM-5.2 為 15.4%。然而，remote-attacker APK-only 五個 agent 都是 16.7%（12 款中 2 款），正好是 Audiobookshelf 和 wallabag；不同 setting 不能揉成單一 agent 排名。

作者報告兩次嘗試的 aggregate trigger rate 由 APK-only 28.8% 上升至 source-visible 32.8%，但 trigger rate 上升幅度不大、而不同 app／agent 有不同走向。source-visible runs 歸因到 17 個 distinct vulnerabilities，APK-only 為 12 個；七個只在 source-visible 中被找到，兩個只在 APK-only 中被找到。由於網路與 obfuscation 同時改變，這不是 raw source access 的單因果比較。Figure 5 的每個 agent share 也需用 25 個 APK-only configurations 為分母，remote attacker 每格因 Termux 不適用而較少；不能把有 backend 的 12 個 app 當成 13 個。

![論文 Figure 3(a)：APK-only malicious-app 設定下的 trigger share 與 API cost。](/paperReading/68-mobilecybench-executable-security-probes/figures/figure-3a-malicious-app-cost.svg)

*Figure 3(a)（論文 Section 4.2，原文 Figure 3 左 panel）：每點彙總一個 agent 的 APK-only malicious-app configurations；縱軸是 pass@2 trigger share，橫軸是這些 configurations 兩次嘗試的 API cost。讀圖時不能以最低成本取代漏洞數、也不能把每點當單一 exploit 的 cost；圖中比較的是 agent-level aggregate，而且不含 emulator／host compute 和人工 probe、triage 工時。來源：Andy K. Zhang et al., “MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes,” [Figure 3 and Section 4.2](https://arxiv.org/html/2609.23980v1#S4.F3)。左 panel 原圖未修改；論文採 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，依授權附來源與作者。*

不同成功與失敗指標不能混淆。agent 的 exploit 有時可令 property trigger，但 reference package 沒對上；77 個 triggered configurations 中 76 個能歸因到 bank 中某漏洞，剩下一個 trigger 沒有 package match。整體 124 triggered runs 最終去重為 19 個 vulnerability instances；其中 4 個被全部五種 agents 找到，3 個漏洞（wallabag 兩個、Audiobookshelf 一個）就佔了 57/124 triggered runs。換言之，設定覆蓋了多 app，但成功結果集中在少數容易重現的漏洞；benchmark 不是均勻覆蓋難度的漏洞樣本。

Agent uniqueness 也有限而非全無：在 APK-only runs，3/5 agents 各自找到一個其他 agent 沒找到的 vulnerability。這提示 ensemble 可能補到邊緣案例，但樣本仍只有五個特定 scaffold/model 組合，而且各 agent 有不同 provider cyber-authorization tier。Claude Code/Opus 4.8 有 24/96 transcripts 的 provider refusal（25.0%），Opus 5 為 42/99（42.4%）；兩者有些在被拒絕前已儲存 exploit 或之後繼續，11/66 refusal-affected runs 仍 trigger。這些 refusal rate 的分母是有 transcript 的 runs，也反映 exploit construction 與 provider block 的共同結果；作者不估計若拿掉拒絕機制會怎樣。

## 23 個 findings 與「發現」一詞的限制

論文的發現數字來自不同流程和單位，不能由一個 benchmark score 推回去。研究團隊在建置環境、撰寫 probes、驗證 reference exploits 和執行 agents 過程中，總共 surfaced 23 個先前沒有出現在公開記錄中的漏洞 finding。這不是「agent 成功找到 23 個」的同義句：finding 可在 benchmark construction 或 agent evaluation 任一階段出現；它也和 77 個觸發 configurations、19 個被 agent 重現的 reference vulnerabilities 是不同統計單位。12/23 findings 獲得 maintainer-validated，是多數而非全數；其中 7 個已修補、5 個獲承認。維護者確認代表 issue 為真，不保證本團隊是全世界第一個發現者，因為其他私下通報可能同時存在。

截至論文撰寫，六個 findings 有 public CVE；另有一個 Nextcloud Talk finding 經 HackerOne 公開但無 CVE。公開表中的六個 CVE 有五個具可公開執行的 benchmark task，web-only Audiobookshelf CVE 沒有 runnable task。尚未公開的 finding 及其個別狀態依 disclosure 約定不披露。維護者 confirmation、accepted disclosure、patch、公開 CVE、可重播 benchmark package 是彼此相關但不同的生命週期事件。

最明確的案例之一是 Home Assistant 對位置廣播的驗證：普通本機 app 可以向無 sender／permission check 的 exported receiver 發 forged location，receiver 轉送到使用者的 Home Assistant server，進而影響以「主人在家」為條件的 automation。論文提供的公開案例列出 CWE 與 CVSS 評估；但這是單一 vulnerability 的嚴重度說明，不能從「probe triggered」自動推出 CVSS。probe 的任務是證明某個 property failure；severity 需要另行分析 exploitability、impact、scope 和各產品情境。

## 計算成本與可重現性，不只看模型 API 價格

Appendix E 累計 500 次 agent-generation runs 約 373.5 小時 wall clock，median 37.0 分鐘、mean 44.8 分鐘；這些數字含 container setup、replay、teardown，個別紀錄最高 134.6 分鐘。LLM API cost 合計 $6,973.19，中位數 $10.95/run；這個帳單不包含 host compute、emulator／Docker、storage、人力 probe authoring、manual triage、disclosure 與 attribution packages。全體平均每 run 111.4 model turns、175.9 tool calls，中位數分別是 98 和 142。每款 app 約 30 作者小時的建置投入尤其提醒：benchmark 成本遠大於推理 API 成本。

成本也不是完全同質。模型供應商 token counter 意義不同，cost 一部分用 provider total、一部分按 token counter 和價格表估算；cache-write counter 沒記錄。Host CPU、RAM、SSD allocation 沒有固定和報告為 benchmark 常數；model endpoints 也沒有在 logs pin 到不可變服務版本。Android emulator 使用 headless Pixel 2 AVD、2GB RAM、SwiftShader，API level 33/34/35 依 app；APK build timeout 1,200 秒、remote script replay 600 秒、malicious-app scoring/regrade 180 秒。這使 target/harness state 有可重建記錄，但不等於每個外部 provider 回應可 bit-for-bit 再現。

Repository 在本次檢查時可直接存取，包含 `runner.py`、app harness、probe suite 和操作文件；README 說明可逐 app 或 batch 執行。實際重跑仍需要 clone/submodules、Python environment、Android／Docker prerequisites、agent authentication 和對應 model service，並配置較高的 CPU／storage 資源。Ethics statement 同時指出，為避免釋出可直接利用仍未修補漏洞的材料，agent exploits、完整 run logs 和尚未公開 findings 的 attribution references 被 withheld；目前已 release 的 reference packages 是已公開且 runnable 的部分（5 個 public runnable tasks）。因此 code repository 已有，但不能說所有論文結果都能不受限制地逐次重現。

## 證據地圖：作者主張、觀察到的結果與本文推論

- **論文明確主張**：以 app-specific security properties 編寫 probes，可評估未知 exploit 的效果；Android attack surface 包含 host-／web-only harness 不會執行的 IPC 與 device interactions。MobileCybench 提供 13 個可運行 app environments、495 probes、兩種 attack settings 和兩種 access levels。
- **實驗直接觀察**：250 configurations 中 77 個 pass@2 triggered；124 triggered runs 帶出 34 種 app-specific probe triggers。generic probes 沒觸發；no-op baseline 0/25。來源可見設定有更多 unique attributed vulnerabilities，但 trigger rates 僅由 28.8% 增至 32.8%，且各 app／agent 變化不一。19/24 reference exploits 觸發了至少一個 app-specific probe。
- **作者揭露與外部驗證**：團隊 surfaced 23 個先前未公開 findings，12 個 maintainer-validated（7 patched、5 acknowledged），六個有公開 CVE；這不是 agent trigger 的另一種表述，也不代表公開 details 全部開放。
- **本文工程判斷**：可借鑑的是「把狀態性質寫成可重播 assertion，先判 property failure，再做根因 attribution」的評測模式。若團隊要用於自己產品，需要 security owner 先維護 property inventory、可信 state oracle、baseline seeding 和變更重跑規則。作者 probes 數量或本次 agent 排名不應當成直接部署標準。
- **未建立**：Android app 漏洞整體的召回率、跨 app／跨平台泛化、production 攻擊率、每個 trigger 的統一 severity、資安團隊實際 triage 節省、模型的全域能力排名或任意使用者環境下的安全保證。

## 何時適合採用這種 probe-based evaluation

如果你的產品有可重設的環境、能讀取可信的 server／device state、攻擊角色和權限可以精確界定，probe-based scoring 能把漏洞報告從文字 judge 轉成可重播 property tests。它特別適合 app-specific authorization、confidentiality 和 integrity，例如跨帳號讀檔、未授權修改、IPC sender 檢查，以及 app 對 backend 狀態的合法寫入規則。建議先做一個足夠窄的 pilot：為一項風險定義 property、seed baseline、寫 no-op control、確認 probe 不因正常流程誤觸，再補上有漏洞／已修補 differential 測試與 finding triage 流程。

不適合直接用一個 trigger rate 宣稱「某 agent 更安全」或「系統內沒有漏洞」。若 app 的安全預期沒有被清楚寫出，probe suite 就會把作者的 blind spots 帶進排行榜；若 effect 需要真實使用者互動、跨裝置時序或不可重置的第三方服務，單次離線 replay 可能漏掉它。若只開 APK、卻沒有記錄 pretraining／runtime lookup channels，也不能宣稱無污染；如果比較 source access，同時改變 network restriction 和 obfuscation，結論只能歸於整個 access setup。最後，對 red-team 或 bug bounty 的數字解讀，要同時看 provider safety refusals、未命中 reference packages 的 triggers、severity review 和重複通報。

## 讀完後的三個記憶點

1. **技術單位**：probe 檢查 property；trigger 證明本次 replay 破壞了它，不能單獨命名根因或評估嚴重度。
2. **最硬證據**：13 款 app、495 probes、五 agents 的四設定 grid 產生 77 個 pass@2 triggered configurations；reference exploit coverage 為 19/24，未觸發或未歸因都有明確盲區。
3. **採用邊界**：23 個先前未公開 finding 中 12 個 maintainer-confirmed；這個資格必須保留。工程上要複製的是 property oracle、隔離 replay、patch differential 與 disclosure 流程，而不是把原始 trigger rate 當成安全結論。

延伸閱讀：[Bounded Agents: A Security Model for Tool Delegation](/paper-reading/64-bounded-agents-delegation-security/) 談 delegated tool 的授權邊界；[Agentic RAG Causal Failure Attribution](/paper-reading/65-agentic-rag-causal-failure-attribution/) 則示範如何把可觀察結果和因果歸因拆開。兩者和本篇有共同的評估教訓：分數單位必須和宣稱的結論同一層。

## Primary sources

- Zhang et al., [MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes, arXiv v1](https://arxiv.org/abs/2609.23980), [完整 HTML](https://arxiv.org/html/2609.23980)。主要錨點：[Figure 1 與 Section 1](https://arxiv.org/html/2609.23980v1#S1.F1)、[Figure 2 與 Section 2.2](https://arxiv.org/html/2609.23980v1#S2.F2)、[Section 2.3 attribution](https://arxiv.org/html/2609.23980v1#S2.SS3)、[Table 1 和 Section 3](https://arxiv.org/html/2609.23980v1#S3.T1)、[Figures 3–6 與 Section 4](https://arxiv.org/html/2609.23980v1#S4)、[Appendix A probes／coverage](https://arxiv.org/html/2609.23980v1#A)、[Appendix B protocol](https://arxiv.org/html/2609.23980v1#B)、[Appendix C detailed results](https://arxiv.org/html/2609.23980v1#C)、[Appendix D disclosure／attribution](https://arxiv.org/html/2609.23980v1#D)、[Appendix E resource accounting](https://arxiv.org/html/2609.23980v1#E)。
- 作者提供的 [MobileCybench source repository](https://github.com/bountybench/mobilecybench) 與其 README／setup 文件；存取狀態以 2026-09-24 為準。
