---
title: "GitLab Orbit：讓 AI Agent 查詢程式碼與 SDLC 關聯"
description: "GitLab Orbit 將程式碼與軟體生命週期資料建成可查詢圖譜；本文釐清 Remote、Local、MCP 介面與 Beta／Experiment 成熟度。"
pubDate: 2026-07-02
updatedDate: 2026-08-29
tldr:
  - "Orbit Remote 整合跨專案的程式碼與 SDLC 資料；Orbit Local 則在本機以 DuckDB 索引工作目錄，兩者不是任選資料庫的同一部署模式。"
  - "Remote 使用 GitLab 的圖譜查詢格式，Local 可執行唯讀 SQL；Local MCP 仍是 Experiment，不宜直接視為生產級依賴。"
audience:
  - "評估程式碼知識圖譜與 AI coding agent 上下文的工程團隊"
  - "需要判斷 Orbit 導入邊界、權限與成熟度的平台負責人"
category: "AI Engineering"
tags: ["AI Agent", "MCP", "Knowledge Graph", "Enterprise AI"]
kind: "article"
showToc: true
image: "/blog/36-gitlab-orbit/title_image.webp"
---
大型軟體系統的上下文不只存在程式碼裡，也散落在 merge request、pipeline、deployment、issue 與 security finding。AI coding agent 若只靠文字搜尋，很難穩定回答「哪次變更造成故障、誰核准、哪些服務受影響」這類跨實體問題。

[GitLab Orbit](https://docs.gitlab.com/orbit/)的方向，是把程式碼結構與軟體開發生命週期（SDLC）資料建成可查詢的知識圖譜。不過它仍處於快速演進期：Remote 已被 GitLab 稱為 public beta，部分 CLI 與 Local MCP 文件仍標示 Experiment。評估時應把「架構潛力」與「目前可承諾的正式環境能力」分開。

> **花花的一句話**
>
> Orbit 的價值不是替 Agent 塞更多文字，而是讓它沿著已索引的程式碼與 SDLC 關係縮小查找範圍。

## Remote 與 Local 是兩種產品路徑

| 面向 | Orbit Remote | Orbit Local |
| --- | --- | --- |
| 資料範圍 | GitLab 群組、專案及 SDLC 資料 | 本機工作目錄中的 repository |
| 儲存與查詢 | GitLab 服務端以 ClickHouse 建圖，使用圖譜查詢格式、REST、CLI 或整合介面 | 本機 DuckDB，可用 SQL、CLI 與 Local MCP |
| 適合情境 | 跨專案依賴、事件調查、組織級脈絡 | 本機程式碼探索、離線或低延遲查詢 |
| 成熟度注意 | Remote 功能仍有 Beta／feature flag 邊界 | Local MCP 文件標示 Experiment |

依[GitLab 發布說明](https://about.gitlab.com/blog/introducing-gitlab-orbit/)，Remote 透過 change-data-capture 將 SDLC 資料寫入 ClickHouse，並解析多種程式語言；對外提供 Cypher-like DSL、MCP、REST 與 CLI。這不等於使用者能在 Remote 任意執行標準 Cypher。

Local 則依[官方 CLI 文件](https://docs.gitlab.com/orbit/local/access/cli/)把圖譜放在本機 DuckDB，支援 `orbit schema` 與 `orbit sql`。因此「ClickHouse 或 DuckDB」不是部署時可互換的儲存選項，而是 Remote 與 Local 的產品邊界。

## 不要自行發明 Schema

Orbit 公開文件會持續更新可索引資料與 schema。實作時應用 CLI 或 MCP 的 schema 工具讀取當前表格、欄位與關係，而不是假設存在 `CodeNode`、`ActionNode`、`IdentityNode` 等固定類別。

一個安全的查詢流程是：

1. 確認 Local 或 Remote，以及目前索引涵蓋哪些 repository／branch。
2. 讀取 schema 或 Remote 查詢文件。
3. 用小範圍、可驗證的問題測試結果。
4. 回到 GitLab 原始物件核對 commit、merge request 與 pipeline 狀態。

圖譜能改善候選資料的召回與關聯，但不會讓資料變得「無可辯駁」；索引延遲、權限、未收錄分支與錯誤關係仍可能影響答案。

## 透過 MCP 接入 Cursor

[Orbit Local MCP 文件](https://docs.gitlab.com/orbit/local/access/mcp/)列出的 Cursor 設定使用 stdio，不需要虛構的遠端 URL：

```json
{
  "mcpServers": {
    "orbit-local": {
      "type": "stdio",
      "command": "orbit",
      "args": ["mcp", "serve"]
    }
  }
}
```

連線後，Agent 可看到 `index`、`get_graph_schema` 與 `run_sql` 等工具。`run_sql` 是唯讀查詢，且回傳量有限；正式使用時仍要限制可索引目錄、審查工具權限，並把查詢結果當成調查線索而非最終真相。

> **花花的工程提醒**
>
> Local MCP 目前是 Experiment。導入前要驗證版本、索引範圍、權限繼承、更新延遲與失敗回復，不要讓 Agent 因為「查得到圖譜」就跳過原始紀錄核對。

## 導入判斷

Orbit 最適合的早期試點，是答案可被 GitLab 原始物件驗證、但人工跨頁查找成本很高的任務，例如 incident triage、變更影響分析或大型 repository 導覽。若流程需要強 SLA、跨分支完整性或長期穩定 API，則應先確認目前版本與部署方案是否已達要求。

想先理解 Agent 如何選工具與控制工作流程，可看[AI Agent 實戰指南](/blog/64-ai-agent-guide/)；若要理解 MCP 的協議邊界，接著讀[MCP 架構與安全限制](/blog/34-model-context-protocol-mcp/)。

## 主要來源

- [GitLab：Introducing GitLab Orbit](https://about.gitlab.com/blog/introducing-gitlab-orbit/)
- [GitLab Docs：Orbit indexed data](https://docs.gitlab.com/orbit/indexed-data/)
- [GitLab Docs：Orbit Local CLI](https://docs.gitlab.com/orbit/local/access/cli/)
- [GitLab Docs：Orbit Local MCP](https://docs.gitlab.com/orbit/local/access/mcp/)
