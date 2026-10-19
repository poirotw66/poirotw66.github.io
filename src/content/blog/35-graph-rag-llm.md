---
title: "GraphRAG 是什麼：用知識圖譜補足多跳查詢與證據關係"
description: "從 QCon AI GraphRAG 演講拆解圖式檢索、社群摘要、Cypher 多跳案例、來源追溯、Graph ETL 成本及失敗邊界。"
pubDate: 2026-07-02
updatedDate: 2026-10-19
tldr:
  - "GraphRAG 能明確查詢實體關係，但 Cypher 的確定性不等於來源事實 100% 正確。"
  - "先用固定題集比較 Hybrid RAG、查詢分解與 GraphRAG，再決定是否負擔建圖與維護成本。"
audience:
  - "對 AI Engineering、實作方法與技術決策感興趣的工程師及產品團隊。"
  - "希望拿到可執行重點，而不只是行銷摘要的讀者。"
category: "AI Engineering"
tags: ["RAG","Knowledge Graph","Enterprise AI","AI"]
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 4
kind: "article"
showToc: true
image: "/blog/35-graph-rag-llm/title_image.webp"
---

當使用者問「這家供應商的母公司，還有哪些產品受同一份合約約束？」時，RAG 如果只挑五個語義相近的段落，可能找得到供應商卻找不到跨文件的持股與產品關係。

[QCon AI 的 GraphRAG 演講](https://www.infoq.com/presentations/graph-rag-llm/)中，Cassie Shum 討論的重點正是這種**資料基礎不足，導致模型無法可靠組合上下文**的問題。圖譜有潛力讓關係成為可查詢的資料，而不只是散落在文字段落裡的線索；但圖譜不是事實保證，也不會因為使用 Cypher 就自動消除幻覺。

> **花花的一句話**
>
> GraphRAG 適合「答案藏在關係裡」的問題。先確認一般檢索真的缺少關係，再決定是否值得建圖。

## 一、傳統檢索究竟卡在哪裡？

| 問題類型 | 單純 Top-k 的風險 | GraphRAG 能提供的額外線索 |
| --- | --- | --- |
| 全域摘要 | 只讀少數 Chunk，容易漏掉跨文件主題 | 圖社群、群組摘要或階層索引 |
| 多跳關係 | A→B 與 B→C 分散在不同文件 | 依明確的節點及邊查詢路徑 |
| 證據追溯 | 找到答案卻很難定位哪一段支持哪個關係 | 為節點與邊保存來源和版本 |

這不代表沒有圖就一定做不到。文件階層搜尋、query decomposition、reranking 和高品質引用，也可能解決相同問題。GraphRAG 增加的是另一種**資料表示與查詢能力**，同時增加了抽取與維護成本。

## 二、先理解兩種常見的圖式檢索路徑

「GraphRAG」不是單一固定的程式架構，至少需分清兩類：

1. **關係遍歷／局部查詢**：使用事先建好的實體、關係和型別，回答供應商、組織、產品間的多跳問題。
2. **社群摘要／全域查詢**：把大量實體與關係分群、產生可閱讀的摘要，再合成跨文件的主題答案。Microsoft GraphRAG 的社群摘要是一個代表性方向。

第一種較容易展示條件式路徑；第二種偏向回答「整個語料的主要議題是什麼」。它們使用的索引、成本和評測目標不一定相同，**不能直接視為相同的命中率實驗**。

## 三、Cypher 範例：正確遍歷不代表資料必然正確

以下是**教學用圖結構**，假設資料庫已有正確的 `SUBSIDIARY_OF` 與 `OWNS_PRODUCT` 關係：

```cypher
MATCH (supplier:Company {name: 'Acme Corp'})
      -[:SUBSIDIARY_OF]->(parent:Company)
MATCH (parent)-[:OWNS_PRODUCT]->(product:Product)
RETURN parent.name AS ParentCompany,
       collect(DISTINCT product.name) AS Products
```

這段查詢可以確定地遍歷**已儲存**的關係，但結果不會自動告訴我們：

- `Acme Corp` 是否和另一個同名實體混淆。
- 股權關係是否已失效或尚未生效。
- `OWNS_PRODUCT` 是否來自推測、舊版文件或未核准來源。
- 商品清單是否完整，或因抽取漏邊而缺失。

因此要區分**查詢執行的確定性**與**資料所代表事實的正確性**。Graph traversal 可以減少自由生成時的推理跳躍，但不能保證「100% 精準上下文」或杜絕幻覺。

## 四、GraphRAG 最難的是 ETL，而不是畫出節點

從非結構化內容建圖，至少要經過以下關卡：

1. **來源擷取與權限**：保留文件 ID、版本、有效日期及 ACL。
2. **實體抽取**：辨識公司、產品、契約與條件，標出來源片段。
3. **實體對齊**：處理別名與同名異物，例如品牌名與法人名稱；不確定時保留候選，而非強行合併。
4. **關係驗證**：對每條邊標示關係型別、時間、來源、信心與核准狀態。
5. **建索引與查詢**：選擇圖遍歷、混合檢索、社群摘要或其他策略。
6. **變更與刪除**：當原始來源撤回、ACL 更新或關係失效時，修正受影響節點、邊及快取。

LLM 可協助提名實體與關係，卻不等於自動產出權威知識圖。對關鍵關係可以加入抽樣人工審查、規則檢驗與來源可回溯機制。

### 真正的 provenance 應長什麼樣？

建議在關係層保存 `source_document_id`、`source_span`、`source_version`、`valid_from`、`valid_to` 等欄位，並且讓回答中的每個重要主張能回連到**原文片段**。

即使邊有 `confidence_score`，它也只是模型或抽取流程的訊號，不等於已證明的事實。稽核仍需要身份驗證、來源授權、編輯紀錄及可重播的查詢路徑。

## 五、是否值得導入？先跑同一批評測題

在選型前，至少比較三條路線：

| 方案 | 先回答的問題 | 主要成本 |
| --- | --- | --- |
| Hybrid RAG + reranker | 現有檢索是否已找齊關鍵證據？ | 索引、排序與標註 |
| Hybrid + query decomposition | 多跳失敗是否只因查詢沒有分解？ | 多輪查詢與合成延遲 |
| GraphRAG | 關係建模與圖遍歷是否顯著改善同一批問題？ | Ontology、抽取、對齊、更新與圖查詢 |

評測題應包含：同名公司、跨文件兩跳／三跳、過期關係、來源衝突、無答案、越權查詢及全域摘要。指標同時看**答案正確率、引用覆蓋、關係精確率、權限洩漏率、P95、更新成本**，而非只展示漂亮的知識圖畫面。

### 一個容易被忽略的風險

若原始文件把「A 曾經屬於 B」描述成歷史事實，但建圖時被抽成永久的 `SUBSIDIARY_OF`，即使 Cypher 完全正確，Agent 也會回答出**時間上錯誤**的關係。這是知識版本與有效期間問題，不能靠換成圖資料庫自行修正。

## 六、結論：圖是關係索引，不是安全證書

GraphRAG 的真正價值，是讓跨文件的**實體、關係與脈絡**可以被明確查詢；而不是保證比所有 RAG 都更準確。它是否有收益，取決於企業問題是否真的需要關係結構，以及來源和圖譜是否維護得住。

如果既有 Hybrid RAG 已通過相同題集，不必為了使用新名詞而擴大架構；如果問題確實反覆敗在多跳關係、全域摘要或時間條件，就可以用受控 PoC 驗證建圖的價值。

## 來源與延伸閱讀

- [Cassie Shum，QCon AI：Graph RAG: Building Smarter Retrieval Workflows](https://www.infoq.com/presentations/graph-rag-llm/)：演講中關於資料基礎與企業圖工程的觀點。
- [Microsoft GraphRAG 官方專案](https://github.com/microsoft/graphrag)：社群摘要路徑的參考實作。
- [Enterprise RAG 指南](/blog/65-enterprise-rag-guide/)：檢索、權限、評測及上線條件。
- [Open Knowledge Format](/blog/24-open-knowledge-format/)：知識交換與 provenance 記錄。
- [PixelRAG](/blog/23-pixelrag/)：圖與視覺檢索各自處理不同結構資訊。
