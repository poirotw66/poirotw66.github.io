---
title: "Open Knowledge Format（OKF）v0.2：企業知識的來源、驗證與可攜格式"
description: "以 OKF v0.2 官方規格解釋 Markdown、YAML、sources、generated、verified、status 與 Attested Computation，釐清與 RAG/LLM Wiki 分工。"
pubDate: 2026-06-16
updatedDate: 2026-10-19
tldr:
  - "OKF v0.2 是開放的 Markdown + YAML 知識交換格式，type 是唯一一律必填的概念欄位。"
  - "v0.2 新增來源、驗證、生命週期與計算驗證訊號；不自動提供檢索、存取授權或知識發布。"
audience:
  - "追蹤 AI 產品與產業動態的工程師與產品人"
  - "需要快速掌握重點再決定是否深挖的讀者"
category: "Cloud & Platform"
tags: ["AI Agent","RAG","Google Cloud","Knowledge Graph"]
image: "/blog/24-open-knowledge-format/title_image.webp"
subtitle: "格式可攜，來源驗證與上線核准仍需治理"
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 3
kind: guide
showToc: true
---

![OKF：以 Markdown 與 YAML 保存可移轉的企業知識](/blog/24-open-knowledge-format/title_image.webp)

企業想讓 AI Agent 回答「每週活躍用戶（WAU）怎麼算」，答案可能散落在資料表 schema、指標定義、排程程式與營運手冊。即使 RAG 找到了文件，下一個問題仍是：**如何把這些知識交給另一個系統，並知道來源、版本與可信程度？**

[Open Knowledge Format（OKF）](https://github.com/GoogleCloudPlatform/open-knowledge-format) 嘗試為「知識如何交換」提供簡單的檔案契約。它不是資料庫、檢索演算法或 Agent Runtime，而是**可用 Git 管理、由人與 Agent 共同閱讀的 Markdown 知識格式**。

本文依照官方 **v0.2 規格**整理。原始 v0.1 內容已不足以說明目前的來源追溯、更新狀態與計算驗證功能，請勿混用兩版欄位。

> **花花的一句話**
>
> OKF 解決的是「怎麼保存與交換知識」；Agent 能不能查對、用對、得到授權，還需要另外一層治理。

## 一、OKF 的最小契約

一個 OKF Bundle 是可攜帶的資料夾，裡面每個概念以 Markdown 文件表示，文件開頭有 YAML frontmatter。規格要求的**唯一一律必填欄位是 `type`**，`title`、`description`、`resource`、`tags` 都是建議性欄位。未知的額外欄位與自訂 `type` 應由 Consumer 寬容處理。 <escape></escape>

```text
business-knowledge/
  index.md
  metrics/
    weekly-active-users.md
  runbooks/
    account-recovery.md
```

`index.md` 可作目錄索引，`log.md` 可記錄更新歷史，兩者依 v0.2 都是**可選的保留檔名**。Concept 之間可以用一般 Markdown 連結形成關係，不必先架設圖資料庫。

### 一個最小的指標文件

以下是**示意資料**，不是官方範例或正式的 WAU 定義：

```markdown
---
type: Metric
title: Weekly Active Users
description: 至少發生一次有效事件的去重使用者數
resource: internal://metrics/wau
tags: [product, analytics]
---

# 口徑
僅計入符合有效事件清單的紀錄，依產品時區分週。
具體 SQL 與有效事件定義應由資料擁有者維護。
```

這份文件可讀、可 diff、可攜，但**只寫了 `type` 不代表內容已經通過事實核驗**。

## 二、v0.2 新增了哪些可治理訊號？

OKF v0.2 在保留簡潔格式的前提下，擴充下列**可選**欄位家族：

| 欄位 | 回答的問題 | 實務意義 |
| --- | --- | --- |
| `sources` | 內容從哪裡來？ | 明確列出來源及部分可信度訊號 |
| `generated` | 由誰、何時產生？ | 留下生成者與產製時間 |
| `verified` | 由誰、何時驗證？ | 可區分尚未驗證、機器確認與人工審閱的訊號 |
| `status` | 內容是否仍有效？ | 例如 draft、stable、deprecated |
| `stale_after` | 何時應重新檢查？ | 讓 Consumer 標示可能過期的知識 |
| Attested Computation | 數值是否依指定方法計算？ | 描述 runtime、參數、executor 與 attester 的契約 |

這些欄位不是保證。**來源 URL 可以指向錯資料；人類審閱標記也不等於業務核准；`stale_after` 不會自己刷新資料**。OKF 負責讓訊號可被交換，實際驗證行為由 Producer 與 Consumer 決定。

### v0.1 → v0.2：別繼續使用舊欄位當作最新版

官方 §13 明確列出兩項需留意的替換：

- 舊版 `timestamp` 已由 `generated.at` 取代；讀取舊 Bundle 時可保留 fallback。
- 正文的 `# Citations` 清單已由 frontmatter 的 `sources` 取代；舊清單可為相容性保留。

其餘新增家族多屬可選擴充。**不能因為文件缺少 `verified` 或 `sources` 就一律判定 v0.2 不合規**。規格本身維持「minimal、可容忍未知欄位」的哲學。

## 三、給企業 Agent 的實際使用流程

回到 WAU 問題：Agent 不能只讀到一段聲稱「WAU = 每週登入人數」的摘要，就認定指標正確。一個較穩健的流程是：

1. **找候選概念**：先根據類型、名稱、索引與語義搜尋找到 `metrics/weekly-active-users.md`。
2. **檢查來源與狀態**：讀取 `sources`、`generated`、`verified`、`status`；沒有資訊就明確顯示未知。
3. **執行查證**：若問題涉及實際數字，向有授權的系統取得資料，必要時執行受管控查詢。
4. **確認回答依據**：保留概念、來源、政策版本與查詢條件；若缺少權威定義，追問或拒絕做出定論。

v0.2 的 **Attested Computation** 是特定的宣告式概念類型，用 `runtime`、`parameters`、`executor` 與 `attester` 描述計算與核驗的介面。它**沒有替你提供通用執行沙箱、授權、排程或保證正確的驗證器**，執行環境仍需另外設計。

## 四、OKF、RAG、LLM Wiki 不互相取代

| 元件 | 主要責任 | 不替你完成的事 |
| --- | --- | --- |
| OKF | 保存與交換知識概念、來源及狀態 | 搜尋排序、資料授權、正式發布 |
| RAG 索引與查詢 | 召回、重排、組裝適用證據 | 自動修正失效來源或批准知識 |
| LLM Wiki／知識編譯流程 | 比對變更、產生候選、審核與回歸測試 | 取代來源資料的事實權威 |
| Agent Runtime | 規劃查詢、使用工具、回答或拒答 | 因為使用了格式就得到操作授權 |

因此，OKF 可以作為知識編譯流程的**輸出介面之一**：審核通過後匯出有來源、版本與有效狀態的 Bundle，再由 RAG 建立索引。但從草稿到 Release 的准駁與回滾，仍是團隊自建的治理流程，不是 OKF 規格內建的發布服務。

## 五、採用前的驗收清單

- **相容性**：新 Consumer 能讀舊版 `timestamp`、`# Citations`，也能容忍未知 `type` 與自訂欄位。
- **來源追溯**：抽樣驗證 `sources` 的 URI 是否存在、是否真正支持內容。
- **更新語意**：標記過期、撤回、未驗證文件，確保查詢層能隔離未發布知識。
- **權限**：Bundle 的可讀權限和原始資料的存取權限不能被混為一談；敏感來源 URL 也須檢查。
- **計算證明**：對使用 Attested Computation 的數值，驗證 executor 的收據與 attester 行為，不把 LLM 文字自評當成獨立證據。

**適用界線：**OKF 適合需要跨工具移轉、版本差異審閱與人機共讀的知識。若需求只是一組固定 FAQ，規格帶來的管理負擔也要和收益一起評估。

## 來源與延伸閱讀

- [OKF 官方主要儲存庫](https://github.com/GoogleCloudPlatform/open-knowledge-format)
- [OKF v0.2 完整規格，尤其 §4、§5、§10、§13](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md)
- [Google Cloud 最初介紹 OKF 的文章](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing/)
- [Enterprise RAG 指南](/blog/65-enterprise-rag-guide/)：查詢、索引與權限如何分工。
- [LLM Wiki 知識變更驗證](/blog/143-llm-wiki-knowledge-change-validation/)：更新、審核與回歸測試。
- [GraphRAG](/blog/35-graph-rag-llm/)：關係式檢索與圖工程的取捨。
