---
title: "Holo4：一個 Agent 跨 GUI、程式與工具，授權卻不相同"
description: "拆解 H Company Holo4 的跨介面 Agent 與長流程 harness，並核對 benchmark、公開軌跡資料和兩個 checkpoint 的授權差異。"
pubDate: 2026-09-30
updatedDate: 2026-09-30
tldr:
  - "Holo4 把螢幕操作、程式執行、MCP 與 API 工具放進同一個 Agent 工作流；實際能力取決於模型與執行 harness。"
  - "H Company 報告 Holo4-27B 在 OSWorld 2.0 得 61.7%，35B-A3B 得 30.9%；這些是發布方結果，不能與不同版本的 OSWorld 分數混看。"
  - "27B 權重採 CC BY-NC 4.0，35B-A3B 採 Apache 2.0；性能、部署條件與商業授權必須一起評估。"
  - "7,366 條公開 trajectories 增加了檢查機會，但不等於獨立重跑，也沒有公開完整訓練配方。"
audience:
  - "設計 computer-use、MCP 或多介面 Agent 的工程師"
  - "需要比較開放權重、benchmark 與商業使用條件的技術決策者"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Research", "多模態"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 44
kind: "article"
showToc: true
image: "/blog/128-holo4-generalist-computer-use-agents/title_image.webp"
---

多數 computer-use Agent 的展示，容易讓人以為問題只在「模型能不能看懂畫面」。但一個真實工作流程可能先在桌面軟體操作，再跑一段程式，接著呼叫 MCP 或企業 API，最後還要記住前面幾十步的狀態。H Company 的 Holo4 想把這些介面放進同一個 Agent 工作流；它最值得注意的工程問題，不只是模型分數，而是模型、harness、評測與授權必須一起看。

本文根據 [H Company 的 Holo4 公告](https://huggingface.co/blog/Hcompany/holo4)、[Holo4-27B model card](https://huggingface.co/Hcompany/Holo4-27B)、[Holo4-35B-A3B model card](https://huggingface.co/Hcompany/Holo4-35B-A3B) 與[公開 trajectories dataset](https://huggingface.co/datasets/Hcompany/trajectories)整理。benchmark 與成本數字都保留為 H Company 自行報告；公開軌跡提供稽核線索，但目前不能取代統一環境下的獨立重跑。

> **花花的一句話**
>
> Holo4 的重點不是「一個模型會更多工具」，而是同一個 Agent loop 能依任務在畫面、程式與工具介面間切換。

## Agent 能力不只在模型裡

Holo4 是一組視覺語言模型（vision-language model, VLM），包含 27B dense 與 35B-A3B Mixture-of-Experts 版本。依 model card，27B 建立在 Qwen3.8 dense 架構上，35B-A3B 則建立在 Qwen3.6 MoE 上。H Company 把兩者與 `hai-agents` harness 配合使用：harness 將螢幕截圖和工具結果交給模型，執行模型提出的點擊、輸入、程式或工具呼叫，再把結果送回下一輪。

這不是模型單獨「直接控制所有東西」。模型提出動作，harness 才是實際接觸桌面、程式沙箱和工具的執行層。兩者的邊界決定了截圖如何回傳、工具結果如何呈現、程式在哪裡跑，以及失敗後能否重試或復原。這也是評估 Agent 時應把 model、harness 和 environment 視為同一個測試系統的原因；更完整的架構背景可參考[AI Agent 完整指南](/blog/64-ai-agent-guide/)。

H Company 說 Holo4 能在 GUI、code、MCP 與 API 間選擇介面，並可在 web、desktop、Android、code sandbox 和 business API 環境執行。這種跨介面設計有實際吸引力：如果既有軟體沒有 API，Agent 可透過 GUI 操作；若有可控的 API 或 MCP server，則不必把每件事都模擬成滑鼠點擊。但公告沒有公開完整的路由策略、工具權限模型或每一類環境的錯誤處理細節，因此不應把「支援多種介面」直接解讀成已證明能可靠地在它們之間切換。

## 長流程的瓶頸是狀態，不是多一個工具

H Company 表示，Holo4 的 Agentic Task Factory 已產生約 10,000 個 web app、MCP server 與 desktop environment 任務，其中也包含 GUI 和 MCP 能讀取同一狀態的 hybrid environment。公司並稱模型經過 supervised learning 和 reinforcement learning，訓練任務涵蓋多種互動環境。這些是發布方對資料與訓練流程的描述；公告沒有提供足以重建資料生成、訓練或去重流程的完整配方。

比模型大小更直接影響長任務的變化，是 H Company 所說的 harness 改版。團隊依 OSWorld 2.0 的失敗案例調整執行迴圈，強化可跨數百步維持狀態的 memory，並讓 Agent 能在桌面環境使用 shell。這指出一個關鍵架構事實：長流程的上下文不是單純把對話視窗加長。系統還需要能保留任務進度、辨認先前動作造成的狀態變化，並在工具回傳後決定下一步。

但 H Company 沒有公開 memory 的資料結構、生命週期、遺忘規則、更新驗證或跨任務隔離方式。若 memory 會影響後續動作，這些細節就關係到 stale state、任務間污染與錯誤延續；「能記得數百步」是能力主張，不是持久記憶已安全可靠的證據。可對照[把經驗凍結後再重用的 RSIAgent](/blog/114-rsiagent-frozen-experience/)：兩者公開描述的是不同機制，不應因都提到 memory 就視為同一種設計。

## 先分清 OSWorld 與 OSWorld 2.0

Holo4 的 headline 分數值得注意，因為 27B 在這組模型裡比 35B-A3B 得分高；但閱讀前必須先看清 benchmark 版本與測試條件。

| Holo4 變體 | 公告中的架構 | OSWorld 2.0 | 公告估算的單任務成本 | 權重授權 |
| --- | --- | ---: | ---: | --- |
| Holo4-27B | Qwen3.8 dense，27B | 61.7% | US\$1.22 | CC BY-NC 4.0 |
| Holo4-35B-A3B | Qwen3.6 MoE，35B-A3B | 30.9% | US\$0.61 | Apache 2.0 |

數字來自 H Company 公告與 model card，不是獨立評測。另有一個容易混淆的數字：Holo4-27B 在另一個 OSWorld 設定報告 85.2%，成本 US\$0.08；它不是 OSWorld 2.0 的 61.7%。只看「OSWorld」這個名稱而忽略版本與評分流程，會把不同任務集、harness 或測試條件的分數放進同一列比較。

成本也不是部署總成本。H Company 說其圖表依每次執行的輸入／輸出 token 和 H Models API 價格估算；其他比較點則可能採模型卡、公開 leaderboard、不同 harness 或 private subset。公告自己也提醒 releases、harnesses 和 task subsets 不同。因此，這些數字適合當作待驗證的成本—表現假設，不適合直接當成企業 TCO 或跨模型採購排名。若工作流程使用 MCP，還需另外評估工具授權與身分傳遞；[跨帳號 AgentCore Gateway 的範例](/blog/120-aws-agentcore-multi-account-mcp/)展示了另一個重要邊界：工具能被呼叫，不代表權限就已經正確治理。

## 開放軌跡讓人能檢查，仍不等於能重現

這次發布的一個實質優點，是 H Company 公開了[7,366 條 Holo4 trajectories](https://huggingface.co/datasets/Hcompany/trajectories)。dataset card 說明資料涵蓋 Holo4-27B 與 Holo4-35B-A3B，包含每一步的 reasoning、action、tool result 和 screenshot；`data/index.json` 另列 benchmark、模型、任務、success、score、duration 與步驟數。讀者因此可以抽查同一任務中的觀察、動作和工具回傳是否支持作者所報告的行為，而不是只看總分。

資料集本身標示 Apache 2.0，但 benchmark 上游任務仍受各自授權約束；README 也說 credentials、internal hosts 和 personal data 會以 `<PII removed>` 遮蔽，部分 screenshots 替換成 placeholder，少數任務未納入。公開可下載、允許檢視，提升了透明度；它不表示原模型訓練資料、harness、benchmark 環境或所有任務內容都一併開放。研究與正式重跑仍需要固定的 task split、environment、harness、停止條件與成功判定。

因此，較準確的說法是：這批軌跡提供了**可檢查的發布方執行紀錄**，不是獨立重現的 benchmark。它可以幫工程團隊找失敗模式、檢視長流程裡發生什麼，也能作為建立自己的回歸測試線索；但不能單靠 trace bundle 證明別人的部署會得到相同分數。

## 「開放權重」要連授權一起讀

Holo4 最清楚的採用取捨，是跑分較高的 27B 權重採 CC BY-NC 4.0，而分數較低的 35B-A3B 權重採 Apache 2.0。Holo4-27B 的 base model 授權不能取代 H Company 對微調 checkpoint 標示的授權；同樣地，dataset 的 Apache 2.0 也不會延伸到模型權重。若用途涉及商業服務，不能把「權重可下載」簡化成「可商用」。應由法務與模型治理流程核對實際 checkpoint、衍生內容、依賴與授權條件。

這也讓「哪個版本更好」變成多目標選擇，而不是照 leaderboard 取第一名：27B 的 OSWorld 2.0 分數較高，但非商用授權會排除某些情境；35B-A3B 具較寬鬆的 Apache 2.0 授權，但其發布方分數較低。還得考慮推論硬體、延遲、API 價格、工具可靠度和任務失敗後的復原成本。這些條件未被一個 benchmark score 概括。

## 團隊如何做有用的採用測試

若要評估 Holo4 或其他跨介面 Agent，建議先把「模型能力」拆成一組可重跑的工作流程：

1. **固定代表性任務與環境**：選出需要 GUI、code、MCP/API 的實際流程，固定應用版本、資料、帳號角色、初始狀態和完成條件。
2. **固定 harness，再比較模型**：控制 prompt、截圖頻率、工具 schema、memory、重試與停止條件。否則變動可能來自 harness，不是 checkpoint。
3. **記錄成功與失敗，不只看平均分**：追蹤任務完成率、錯誤類型、人工接手、步數、token、延遲和每次重跑成本；按介面與任務難度分層。
4. **隔離操作權限**：先在 disposable VM 或專用測試租戶執行，禁止接觸真實憑證與不可逆操作；再逐步加入最小權限和人工核准。
5. **把授權列入模型清單**：記錄實際下載的 checkpoint revision、模型卡、license、量化版本與使用場景，避免將 dataset 或 base model 的授權誤套在微調權重上。

Holo4 的工程價值，在於它把跨介面 Agent 的組成暴露得更清楚：模型選擇動作，harness 維持迴圈，環境執行工具，trajectory 讓部分行為可被抽查。它的分數與成本仍需要外部團隊以相同 harness 和自己的任務驗證；它的公開軌跡提升了可檢查性，但沒有消除評測與授權的邊界。

## 延伸閱讀與原始資料

- [AI Agent 完整指南：架構、工具、評測與企業落地](/blog/64-ai-agent-guide/)
- [RSIAgent：模型權重不變，Agent 真的能自我改進嗎？](/blog/114-rsiagent-frozen-experience/)
- [AWS AgentCore Gateway 跨帳號 MCP：資料留在 LOB，授權留在 Gateway](/blog/120-aws-agentcore-multi-account-mcp/)
- [Holo4 官方公告](https://huggingface.co/blog/Hcompany/holo4)、[27B model card](https://huggingface.co/Hcompany/Holo4-27B)、[35B-A3B model card](https://huggingface.co/Hcompany/Holo4-35B-A3B)、[trajectories dataset card](https://huggingface.co/datasets/Hcompany/trajectories)
