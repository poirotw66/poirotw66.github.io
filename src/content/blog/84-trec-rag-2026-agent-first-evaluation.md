---
title: "TREC RAG 2026：RAG 評測為何開始加入 Agent"
description: "用 TREC RAG 2026 說明 RAG 評測從文件問答走到 Agent-in-the-loop，這篇講方向與題目設計，不講企業 harness 怎麼實作。"
pubDate: 2026-08-09
updatedDate: 2026-08-28
tldr:
  - "TREC RAG 2026 把 Retrieval 與 Retrieval-Augmented Generation 分成兩個互補任務。"
  - "RAGDoll 將 relevance、nuggets、citation support 與 metrics 串成可觀察的評測工作流。"
  - "這篇是入口；下一篇會進一步拆解企業團隊如何實作可重播的 RAG evaluation harness。"
audience:
  - "想快速理解 TREC RAG 2026 與 Agent-first 評測方向的 AI 工程師"
  - "正在規劃企業 RAG 評測、治理與觀測性的技術主管"
category: "AI Engineering"
tags: ["RAG", "Evaluation", "AI Agent", "Enterprise AI"]
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 8
kind: "article"
showToc: true
image: "/blog/84-trec-rag-2026-agent-first-evaluation/title_image.webp"
---

RAG 系統最難維護的地方，通常不是模型能不能寫出流暢答案，而是團隊能不能回答：它找到哪些證據？為什麼使用這些證據？引用是否真的支援答案？如果讓 Agent 多走幾步，品質是否提高，還是只增加延遲與成本？

[TREC RAG 2026](https://trec-rag.github.io/) 提供了一個很好的入口。官方 track 把 2026 年描述為 TREC 的第一個 Agent-first track，並將評測拆成 Retrieval 與 Retrieval-Augmented Generation 兩個互補任務；同時提供新的 ClimbMix-400b corpus 與 RAGDoll 評測工具。這些設計讓「找不到證據」與「找到證據卻沒有用對」有機會被分開討論。

> **花花的一句話**
>
> RAG 評測的重點，不只是最後答案對不對，而是整條證據與決策流程能不能被重播、診斷與信任。

## 先理解公開 benchmark 在量什麼

官方定義的兩項任務可以簡化成：

- **Retrieval：** 給定 narrative，回傳與該 narrative 相關、且可作為答案證據的 ClimbMix 文件排名清單。
- **Retrieval-Augmented Generation：** 從 ClimbMix collection 找到相關證據，回傳以證據為根據的摘要答案。

這個拆分很重要。只看 end-to-end answer score，會把 parser、index、retriever、context assembly、generation 與 citation 的失敗混在一起；有 Retrieval run 作為參照，才知道必要文件是否根本沒有進入候選集合。

截至 2026 年 8 月 9 日，官方頁面的 results and judgments 仍標示為 TBD。因此本文不解讀任何參賽結果，而是把公開任務與工具當成一套值得觀察的評測基礎設施。[RAGDoll](https://github.com/castorini/RAGDoll) 的 README 顯示，它可以 materialize prompts、產生 gold-standard artifacts、做 relevance 與 nugget 流程、解析 citation support，並計算支援 metrics；這些是可觀察的流程介面，不是生產可靠性的保證。

## 為什麼這對企業 RAG 有用？

企業 RAG 的品質問題，往往分布在不同階段：

1. 文件沒有被正確解析或索引。
2. 相關文件沒有進入 top-k，或被錯誤排序。
3. 證據在 context 組裝時被截斷、重複或淹沒。
4. 模型看到正確證據，卻產生沒有被支援的推論。
5. 答案有 citation，但 citation 指向錯誤版本或只支援句子的一部分。

TREC RAG 2026 的價值，在於它讓工程師可以從「答案看起來好不好」往前追到「候選文件、證據單位與引用支援」。它不會自動涵蓋 ACL、撤回文件、tenant isolation、延遲與成本，但它提供了設計診斷流程時可以借用的語言。

## 下一篇會深入哪些技術細節？

如果你想知道如何把這個想法落地成自己的 evaluation harness，請接著閱讀：

### [企業 RAG 評測 Harness 怎麼做（TREC RAG 2026）](/blog/85-trec-rag-2026-rag-evaluation-harness/)

下一篇會從資料結構與執行流程開始，具體討論：

- Retrieval-only 與 end-to-end RAG run 如何使用同一組 test cases；
- candidate documents、final context、nuggets、answer sentences 與 citations 如何串成 evidence lineage；
- relevance、support、coverage、correctness、abstention、latency 與 cost 如何放進同一張 scorecard；
- Agent trace 要記錄哪些狀態，才能分辨多走一步帶來品質，還是只帶來浪費；
- judge prompt、人工抽樣、版本 manifest 與 corpus snapshot 如何支援可重現比較；
- 何時應該維持簡單的 hybrid baseline，何時才值得引入 Agentic RAG。

在進入深度實作前，可以先閱讀 [Enterprise RAG 完整指南](/blog/65-enterprise-rag-guide/) 理解資料、權限、版本與檢索架構，再閱讀 [AI Agent 指南](/blog/64-ai-agent-guide/) 補上工具呼叫與失敗路徑。這三篇的閱讀順序是：先看 RAG 評測問題，再看 harness 設計，最後把它放回企業架構與 Agent runtime。

> **花花的工程提醒**
>
> Benchmark 可以提供共同問題與可比較的 artifacts，但不能替你的公司決定資料授權、權限邊界、SLO 或可接受成本；那些仍然要用自己的資料與流量驗證。

## Sources

- [TREC RAG 2026 official track page](https://trec-rag.github.io/)
- [RAGDoll evaluation runner and workflow](https://github.com/castorini/RAGDoll)
- [TREC RAG 2026 agent skills](https://github.com/TREC-RAG/trec-rag-skills)
