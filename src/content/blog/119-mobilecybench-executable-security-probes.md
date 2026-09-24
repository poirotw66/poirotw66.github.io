---
title: "AI Agent 漏洞回報要附上什麼證據？MobileCybench 用可執行 Probe 重播驗證"
description: "MobileCybench 將 Android Agent 找到的漏洞主張交給隔離環境重播，再用可信狀態上的安全性 Probe 判斷哪些性質確實遭到違反。"
pubDate: 2026-09-24
updatedDate: 2026-09-24
tldr:
  - "不要只看 Agent 寫得多有說服力；先確認 exploit 能在指定攻擊者權限下重播，並觸發獨立檢查的安全性 Probe。"
  - "Probe 觸發代表某項受檢安全性質在這次重播中失守；漏洞歸因、嚴重度、影響範圍與修補狀態仍要分別驗證。"
  - "MobileCybench 在 13 個 Android app 上提供 495 個 probes，測試五個 coding agents；建置與測試期間浮現 23 件先前未回報的漏洞，12 件已獲維護者確認。"
audience:
  - "開發 AI coding agents、安全測試 harness 與漏洞揭露流程的工程師"
  - "需要分流 Agent 產生之安全回報的開源維護者與產品安全團隊"
category: "AI Engineering"
tags: ["AI Agent", "AI 安全", "Evaluation", "Research"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 40
kind: "article"
showToc: true
image: "/blog/119-mobilecybench-executable-security-probes/title_image.webp"
---

AI coding agent 可以很快寫出一篇看似完整的漏洞報告，但維護者真正需要回答的是：在什麼權限下，哪個可重現的行為改變了受保護狀態？[MobileCybench 論文](https://arxiv.org/abs/2609.23980)把這個問題改寫成可執行的安全性 Probe：將 exploit 放進隔離的 Android app 與 backend 環境重播，再由 Probe 檢查應該維持的安全性質有沒有被破壞。

這種做法把「報告看起來合理」推進到「結果能被重播並檢查」。然而，Probe 被觸發只證明一個特定性質在指定條件下遭到違反；它本身不會指出根因、判定嚴重度，或替代維護者確認。MobileCybench 很適合用來思考漏洞回報需要哪些證據，但它也只涵蓋有限的 app 與性質，而且重跑成本不低。

> **花花的一句話**
>
> 可信的 Agent 漏洞回報，至少要把主張帶進隔離環境重播，並讓獨立檢查器觀察到超出攻擊者控制的狀態變化。

## 把「我找到漏洞」改成可檢查的性質

傳統漏洞 benchmark 常以已知漏洞清單作為答案鍵：Agent 是否重新找到某個預先列出的問題？MobileCybench 選擇另一種單位。Probe 編碼的是應該持續成立的安全性質，例如「非擁有者不能讀取這個檔案」，或「只有 Home Assistant app 能更新手機回報的位置」。Agent 提交 exploit 後，評測器從預先建立的狀態啟動 app，再重播 exploit，最後讀取 emulator、backend 或 database 的可信狀態，判斷性質是否失守。

論文中的 Home Assistant 範例具體呈現了這條證據鏈：Android app 接受任意 app 傳來的位置廣播，並把偽造的位置回報給 server。評測器重播惡意 app 後，比對 server 的 device-tracker 記錄與測試前的 baseline；未授權的值真的改變，相關 Probe 因而觸發。檢查的是 app/backend 的狀態，不是 exploit 自己輸出的成功訊息。

> **花花的工程提醒**
>
> 觸發結果回答「哪項性質在這次重播中失守」，不會自動回答「是哪個 bug、影響多嚴重、該如何評級」。

## 測試範圍與結果該怎麼讀

MobileCybench 包含 13 個 Android 應用程式與 495 個由作者撰寫、審查的 Probe，涵蓋機密性、完整性、可用性、存取控制四類性質。五個 coding agents 分別在兩種攻擊情境測試：裝在受害者裝置上的惡意 app，以及只有低權限 backend 帳號的遠端攻擊者；每種情境又分成只取得混淆 APK，或額外取得原始碼。研究以每個 app、情境與權限組合重跑兩次，因此結果是這組 app、Probe、agent 版本與隔離設定下的 benchmark 測量。

論文報告，建置與執行 benchmark 過程共浮現 23 件先前未回報的漏洞；截至論文撰寫時，維護者已驗證其中 12 件，多數已確認，其中 7 件已修補、5 件已獲承認，6 件已有公開 CVE。這個 23 是研究建置與測試期間浮現的 findings，不能全部歸成五個 Agent 在正式評測中的獨立發現；單看評測並以 patch-differential attribution 去重，Agent 找到 19 個可歸因的漏洞。

作者在 Android 模擬器內執行自架 app 與 backend，避免接觸正式服務或真實使用者。公開 repo 提供 harness、13 個 app 環境與 495 個 probes；出於雙重用途考量，尚未公開 Agent exploits、run logs，以及未修補的參考漏洞。可見的結果因此足以檢視 Probe 評分方法與可公開漏洞的重播條件，卻不代表所有實驗 trace 或未修補 exploit 都已開放供外部逐項重做。

## Probe 觸發之後，還要完成哪些判讀

把 Probe 結果當作分流證據，會比把它當成漏洞結論更準確。一次有效的觸發表示提交的 exploit 在所設定的攻擊者權限下，造成至少一項 Probe 所檢查的安全性質遭到違反。若多個 probes 都觸發，可能是同一個 effect 違反數個性質；不同根因也可能撞到相同的 Probe。Probe 分數因此不能直接等同於漏洞件數。

研究接著以漏洞版本和對應修補版本做差異重播：若 exploit 在有問題的版本觸發 Probe，而同一效果在修補版本消失，才將觸發歸因給該參考漏洞。即使如此，**歸因仍不等於嚴重度**。維護者還得檢查根因、所需前置條件、受影響版本與使用者、實際機密性或完整性影響、可利用範圍，以及修補是否完整。CWE 分類、CVE 編號、advisory 發布或 bounty 決定，也各有自己的審核過程。

對日常收件的 maintainer 而言，報告最少應讓人核對以下內容：

1. **攻擊模型**：app 與版本、攻擊者起始權限、目標使用者／資料，以及涉及的 app 或 backend 邊界。
2. **重播材料**：可執行的最小 exploit、設定、前置狀態與步驟，並說明重跑如何還原乾淨 baseline。
3. **獨立觀測**：哪個受信任的 app、emulator 或 server-side 狀態應保持不變，重播後實際觀察到什麼差異。
4. **結果分類**：Probe 是否觸發、哪項性質被違反、基礎設施錯誤與預期行為如何排除，以及在乾淨狀態下能否重現。
5. **後續確認**：可疑根因、受影響版本、修補差異與影響證據，並清楚標記哪些仍待 maintainer 驗證。

這份清單不是每個真實漏洞的充分證明，也不表示所有回報都得自行建立完整 benchmark。它讓維護者可以逐步判斷：目前有的是模型主張、可執行 PoC、已觀察到的性質違反，還是已確認根因與影響的漏洞。

## 建置成本、Probe 邊界與操作限制

可重播性需要環境，不是把一條 shell command 貼進 issue 就能保證。作者描述每個 app 的 Probe 規格與撰寫約投入約 30 個作者工時，並從 source、文件和 pilot Agent runs 推導安全性質；Probe 即使經過審查，也只能覆蓋團隊已明確列出的性質。沒有 Probe 觸發只代表這次 exploit 沒有觸及現有檢查，不能推論 app 安全或不存在其他漏洞。

公開 repo 的入門文件也要求先準備 clone 與 submodules、Python 環境和 Agent 驗證；實驗另外需要 Android emulator、各 app 的 backend、seeded test data、Agent credentials 與可重置的基線。完整 matrix 會跨 13 個 app、攻擊模式、APK／原始碼可見度和多個 Agent 設定；論文每次 run 最長給 Agent 兩小時。這些成本會限制誰能重做整套實驗，也提醒團隊要把容器、模擬器、資料版本、網路權限和重設程序一併當成測試規格。

> **花花的判斷**
>
> 對維護者來說，最可複用的產物不是一個 Agent 排名，而是能隨 app 版本更新、對 exploit 重播、並由可信狀態判斷結果的安全性檢查。

若想理解 MobileCybench 的 Probe 設計與評測結果細節，可接著讀[論文精讀 #68：MobileCybench 與可執行安全 Probe](/paper-reading/68-mobilecybench-executable-security-probes/)。更廣泛的 Agent runtime、工具權限與失敗復原脈絡，見 [AI Agent 完整指南](/blog/64-ai-agent-guide/)；若你正在設計威脅邊界，可延伸閱讀[企業 AI Agent 安全架構](/blog/43-enterprise-ai-agent-security/)，以及把權限、評測與稽核整理成上線門檻的 [Agentic AI 平台契約](/blog/93-agentic-ai-platform-contract/)。

## 來源

- [Zhang 等人，MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes（arXiv:2609.23980）](https://arxiv.org/abs/2609.23980) — 方法、結果、限制與責任揭露說明。
- [MobileCybench 作者程式庫與 README](https://github.com/bountybench/mobilecybench) — harness、公開內容與重現前置條件。
