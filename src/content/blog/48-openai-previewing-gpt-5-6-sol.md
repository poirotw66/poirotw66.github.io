---
title: "GPT-5.6 Sol 已正式推出：模型路由、價格與評測判讀"
description: "更新 GPT-5.6 從有限預覽轉為正式供應後的 Sol、Terra、Luna 定位、API 規格與價格，並整理 benchmark 限制和企業導入決策。"
pubDate: 2026-07-10
updatedDate: 2026-08-09
tldr:
  - "GPT-5.6 已在 2026 年 7 月 9 日由有限預覽轉為正式供應；Sol、Terra、Luna 是能力與成本不同的三個層級。"
  - "1.05M context、128K 最大輸出與高 benchmark 分數不等於所有任務都該路由到 Sol；長上下文加價、推理延遲與實際任務成功率必須一起評估。"
audience:
  - "評估 OpenAI 模型選型、Agent 工作流或 API 遷移的工程師"
  - "需要核對 GPT-5.6 成本、可用性與官方 benchmark 邊界的技術決策者"
category: "Industry Pulse"
tags: ["AI Agent", "OpenAI", "Machine Learning", "Evaluation"]
kind: "article"
showToc: true
image: "/blog/48-openai-previewing-gpt-5-6-sol/title_image.jpg"
---

這個 route 保留了「previewing」的歷史名稱，但產品狀態已改變。OpenAI 在 2026 年 6 月 26 日先向少數合作夥伴提供 GPT-5.6 有限預覽，接著在 7 月 9 日宣布整個家族正式供應。根據 [GPT-5.6 正式發布頁](https://openai.com/index/gpt-5-6/) 與 [GPT-5.6 Sol 型號文件](https://developers.openai.com/api/docs/models/gpt-5.6-sol)，Sol 現在是旗艦層級，`gpt-5.6` alias 會路由至 `gpt-5.6-sol`；Terra 與 Luna 則分別面向成本與能力平衡、以及成本敏感的大量工作負載。

因此，工程問題已不是「如何取得預覽資格」，而是如何用自己的任務、延遲與成本資料建立 routing policy。模型越強，不代表把所有請求送往最大層級就越可靠。

> **花花的判斷**
>
> GPT-5.6 最重要的系統改變是選型空間變大；路由器必須依任務風險與實測成功率決策，而不是把官方模型階層直接當成應用分類器。

## 已核實的產品狀態與規格

截至 2026 年 8 月 9 日，三個 API 型號皆列於官方文件，並可透過 Responses API 使用：

| 型號 | 官方定位 | Input / cached input / output（每 1M tokens） |
| :--- | :--- | :--- |
| `gpt-5.6-sol` | 旗艦能力；`gpt-5.6` alias 指向此型號 | US\$5 / US\$0.50 / US\$30 |
| `gpt-5.6-terra` | 能力與成本平衡 | US\$2.50 / US\$0.25 / US\$15 |
| `gpt-5.6-luna` | 成本敏感、大量工作負載 | US\$1 / US\$0.10 / US\$6 |

三者的官方型號頁均記載 1,050,000-token context window、128,000-token 最大輸出、2026 年 2 月 16 日 knowledge cutoff，以及文字與圖片輸入、文字輸出。音訊與影片不是這個模型家族的輸入輸出能力；即時語音應查看獨立的 Realtime 型號。

定價還有兩個容易被摘要忽略的條件：輸入超過 272K tokens 時，整個 request 的 input 以 2 倍、output 以 1.5 倍計價；GPT-5.6 的 cache write 以未快取 input 的 1.25 倍計價。cached read 雖然便宜，但 cache 是否命中與長上下文 premium 會直接改變單次任務成本。

## 新能力如何影響 Agent 架構

官方 [GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model) 建議 reasoning、tool calling 與多輪工作使用 Responses API，並明列幾項新能力：

- `reasoning.effort` 支援 `none`、`low`、`medium`、`high`、`xhigh`、`max`；更高 effort 應以實測品質增益交換延遲與 token，而不是預設開到最高。
- Pro mode 是 `reasoning.mode: "pro"`，不是另一個 Pro model slug；它和 reasoning effort 是兩個獨立設定。
- Programmatic Tool Calling 允許模型在託管 runtime 內協調符合條件的工具與中間結果。
- Multi-agent 仍標記為 beta。它可平行處理可拆分的工作，但需要額外驗證結果完整性、成本與失敗收斂。
- Persisted reasoning 與 explicit prompt caching 可減少重複上下文處理，但也帶來狀態生命週期與 cache write 成本。

合理的路由器不應只看 prompt 長度。它至少要輸入任務風險、工具副作用、SLA、context 大小與預估成本，再把請求送到候選模型；高風險或低信心結果仍要進入驗證或人工審批。若要完整整理 Agent 的工具、狀態與評測面，可搭配 [AI Agent 完整指南](/blog/64-ai-agent-guide/) 閱讀。

## Benchmark 能說什麼，不能說什麼

OpenAI 的正式發布頁報告多項 vendor-run evaluations。例如 GPT-5.6 Sol 在 Terminal-Bench 2.1 為 88.8%，高於頁面列出的 GPT-5.5 85.6%；在 BrowseComp 為 90.4%，搭配 Ultra 時為 92.2%。這些結果支持「特定設定下的工具與終端任務有提升」這個窄結論，但不能直接換算成你的 production success rate。

長上下文數字尤其需要保守解讀。在 OpenAI MRCR v2 的 8-needle、512K–1M 區間，發布頁列出的 Sol 分數是 73.8%，GPT-5.5 是 74%。也就是說，能接收 1.05M tokens 不等於能在所有長上下文位置穩定找回關鍵資訊。更大的 context 也會增加 prefill latency、成本與不相關資訊干擾。

評估模型時，至少固定 prompt、工具、reasoning effort、最大重試與成功判準，再比較：

- 任務成功率與必要證據是否齊全；
- p50 / p95 latency 與超時率；
- input、cached input、reasoning、output 的實際 token；
- 工具呼叫次數、失敗恢復與副作用重複率；
- 每個成功任務的總成本，而非只有每 token 標價。

> **花花的工程提醒**
>
> 先讓 Terra 與 Luna 在代表性資料集上挑戰 Sol；只有當 Sol 的成功率提升足以支付更高延遲與成本時，才把該任務升級路由。

## 限制、保障措施與導入風險

GPT-5.6 仍可能產生錯誤答案、錯用工具或遺漏長上下文證據。官方 guidance 也提醒，cyber 與 biology 的即時 classifiers 可能拒絕輸出，或在 streaming 期間暫停數秒檢查；合法的 dual-use 工作亦可能受到影響。這類延遲與拒絕必須進入 SLA、fallback 與使用者溝通設計。

另外，官方 benchmark 是模型供應商發布的結果，包含特定 scaffold、工具與 reasoning 設定。除非在自己的資料、權限與負載下重現，不能把它當成採購保證。對長任務，還要設置 checkpoint、可恢復狀態與獨立驗證；相關方法可延伸閱讀 [長任務代理的 Harness](/blog/10-effective-harnesses-for-long-running-agents/) 與 [Harness Engineering](/blog/11-harness-engineering/)。

## 來源

- [OpenAI：GPT-5.6 正式發布](https://openai.com/index/gpt-5-6/)（2026-07-09；availability、vendor evaluations）
- [OpenAI API：GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)（reasoning、tools、migration 與 safeguards）
- [OpenAI API：GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol)、[Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra)、[Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)（型號、context、價格與能力）
