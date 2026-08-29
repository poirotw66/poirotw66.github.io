---
title: "Meta Muse Spark 到 1.2：多模態推理、平行 Agent 與版本邊界"
description: "從初代 Muse Spark 到 1.1、1.2，整理 Meta 已公開的多模態、平行 Agent、coding 與 API 能力，並區分官方宣稱和未公開的模型內部細節。"
pubDate: 2026-07-08
updatedDate: 2026-08-29
tldr:
  - "初代 Muse Spark 的重點是原生多模態、工具使用、visual chain of thought，以及以平行 Agent 擴展 test-time reasoning。"
  - "Meta 沒有公開 MCTS、PRM、DPO 或固定 Planner／Actor／Verifier 路由；這些不能寫成已證實實作。"
  - "1.1 將能力推向工具、computer use 與公開 API，1.2 再聚焦 coding 與 Muse Code；評估時必須標記版本。"
audience:
  - "追蹤前沿模型與 Agent 平台演進的工程師及產品團隊"
  - "需要區分模型公告、vendor benchmark 與工程推論的讀者"
category: "Industry Pulse"
tags: ["AI", "Meta", "多模態", "AI Agent"]
kind: "article"
showToc: true
image: "/blog/61-meta-muse-spark/title_image.webp"
---
Meta 在 2026 年 4 月推出初代 Muse Spark，將它定位為 Meta Superintelligence Labs 的第一個 Muse 模型。短短數月內，產品又演進到 1.1 與 1.2，因此今天閱讀初代公告時，最重要的不是把所有能力混成一個「Muse Spark」，而是確認每項能力屬於哪個版本、哪種存取方式。

本文以 Meta 的第一方公告為界：能確認的是多模態、工具使用、平行 Agent、官方評測與版本可用性；無法由公開資料確認的內部演算法，不會補成看似精確的架構故事。

> **花花的一句話**
>
> Muse Spark 的核心演進，是從展示多模態推理與平行 Agent，走向可透過 API 與 coding agent 實際使用；版本號比產品家族名稱更重要。

## 初代 Muse Spark 公開了什麼

[Meta 的初代公告](https://ai.meta.com/blog/introducing-muse-spark-msl/)將 Muse Spark 描述為原生多模態推理模型，支援 tool use、visual chain of thought 與 multi-agent orchestration。公開示例包含視覺定位、互動式標註，以及由多個 Agent 平行推理的 Contemplating mode。

Meta 報告 Contemplating mode 在 Humanity's Last Exam 得到 58%、在 FrontierScience Research 得到 38%。這些是 vendor-reported results；若沒有獨立重現，不應直接推論成特定工作負載的準確率或投資報酬。

官方也說明三個 scaling axes：

1. **Pre-training**：改進架構、最佳化與資料整理，以提升每單位訓練算力的能力。
2. **Reinforcement learning**：隨 RL steps 增加，觀察訓練與 held-out 評測的表現變化。
3. **Test-time reasoning**：用 thinking-time penalty 控制 token 成本，並以多個平行 Agent 增加推理計算量。

公開內容沒有說 Contemplating mode 使用 MCTS 加 PRM，也沒有揭露固定的 Planner／Actor／Verifier 路由。將這些常見模式套進產品，只能算架構假說，不能寫成 Meta 已證實的實作。

## 健康資料：公開的是資料整理，不是 RLHF 配方

Meta 表示曾與超過 1,000 名醫師合作整理資料，使健康回答更完整、符合事實，並展示營養資訊與運動肌群等互動輸出。公告沒有說這 1,000 人直接參與 RLHF，也沒有公開 DPO、CGM 個人化建議或 3D 肌肉模型的訓練配方。

因此比較準確的結論是：Meta 把健康列為重要應用與資料投資領域，但這不足以證明模型可替代臨床判斷，也不足以重建其 post-training pipeline。

> **花花的工程提醒**
>
> 「與專家合作整理資料」不等於「已公開 RLHF／DPO 流程」；在醫療情境還要另外驗證資料時效、地區適用性、引用、拒答與升級真人的機制。

## 1.0、1.1 與 1.2 不要混用

| 版本 | 官方重點 | 存取狀態與判讀 |
| --- | --- | --- |
| 初代 Muse Spark | 多模態、工具使用、visual chain of thought、平行 Agent | meta.ai 與 Meta AI app；初期 API 為 private preview |
| Muse Spark 1.1 | 工具與 computer use、coding、百萬 token context、Meta Model API | [2026 年 7 月公告](https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/)將 API 推到 public preview |
| Muse Spark 1.2 | coding 最佳化與 Muse Code | [Meta 開發者入口](https://developer.meta.com/ai/)顯示 1.2 與 Muse Code 已成為目前開發者主線 |

這個版本表也提醒一件事：初代 benchmark、1.1 的 API 能力與 1.2 的 coding 表現不能互相代換。模型 ID、價格、區域與 preview 條款都應在實作當天重新查證。

## 對工程團隊的實際意義

Muse Spark 最值得觀察的不是「System 2」標籤，而是兩個可測試的系統決策：

- **平行 Agent 是否真的降低端到端延遲**：要把排程、重複工作與彙整成本一起量測。
- **多模態與 computer use 是否能通過可重現評測**：測試應包含視覺誤讀、工具失敗、長流程狀態漂移與權限越界。

正式採用前，至少固定模型版本、保存評測資料集、記錄 reasoning 與工具成本，並為高風險動作設人工確認。想建立完整 Agent 評估框架，可先看[AI Agent 實戰指南](/blog/64-ai-agent-guide/)；若要改善 coding agent 的長流程可靠性，可接著讀[長時間 Agent 的 Harness 設計](/blog/10-effective-harnesses-for-long-running-agents/)。

## 主要來源

- [Meta：Introducing Muse Spark](https://ai.meta.com/blog/introducing-muse-spark-msl/)
- [Meta：Introducing Muse Spark 1.1](https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/)
- [Meta AI for developers](https://developer.meta.com/ai/)
