---
title: "2026 Google Cloud Day Taipei：開發者場的 Agentic AI 重點"
description: "整理 2026 Google Cloud Day Taipei 開發者場觀察，並以官方文件查核 ADK、Agent Runtime 與企業治理能力。"
pubDate: 2026-07-09
updatedDate: 2026-08-29
tldr:
  - "Google 的 Agent 路線已從單一模型 API 延伸到開發、部署、身分、政策、評估與觀測的一體化平台"
  - "會議簡報適合掌握方向；產品名稱、API 與可用狀態仍應回到更新中的官方文件確認"
audience:
  - "評估 Google Cloud Agent 技術棧的工程師與平台團隊"
  - "需要分清會議訊號、正式能力與架構推論的技術決策者"
category: "AI Engineering"
tags: ["AI Agent","MCP","Gemini","Google Cloud"]
cluster: "ai-agent"
clusterRole: "signal"
clusterOrder: 3
kind: "article"
showToc: true
image: "/blog/40-google-cloud-day-taipei-2026/title_image.webp"
---
這篇文章整理 2026 Google Cloud Day Taipei 開發者場的現場筆記，重點不是逐頁重述簡報，而是回答一個工程問題：Google 如何把模型、工具與資料，接成可部署、可治理的 Agent 平台？

本文已於 2026 年 8 月 29 日用 Google Cloud 官方文件重新查核。現場提及、但無法從公開文件確認的數字與實作細節不再當成既定事實；產品介面與支援範圍仍可能持續變動。

> **花花的判斷**
>
> 真正值得追蹤的不是單一 Gemini 型號，而是開發、執行、身分、政策、評估與觀測能否形成同一條可治理的交付鏈。

> **花花的工程提醒**
>
> 會議簡報適合判斷方向，不適合直接當 API 文件。實作前應再次確認模型名稱、套件版本、區域與預覽狀態。

## 從模型清單轉向完整生命週期

[Gemini Enterprise Agent Platform 官方總覽](https://docs.cloud.google.com/gemini-enterprise-agent-platform?hl=en)把平台能力分成四個面向：Build、Scale、Govern 與 Optimize。這比「選哪個模型」更接近正式環境真正要解的問題：

- **Build**：以 Agent Development Kit（ADK）或其他框架定義 Agent、工具與協作流程。
- **Scale**：把 Agent 部署到受管 Runtime，並管理 session 與 memory。
- **Govern**：使用 Agent Identity、Registry、Gateway 與政策控制存取邊界。
- **Optimize**：透過評估與可觀測性理解品質、成本及失敗路徑。

模型仍然重要，但只是這條鏈上的一個可替換元件。平台團隊更該先確認資料權限、工具副作用、追蹤紀錄與回滾方式。

## ADK 的正確定位：框架，不是魔法層

[ADK 官方文件](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk?hl=en)將它描述為開源、code-first 的 Agent 開發框架，支援 Python、TypeScript、Go 與 Java。它可組合工具、workflow agent 與多 Agent 協作，也能接到評估及部署流程。

以下是依照官方 Python 介面縮小後的示意；工具函式與資料皆為教學用途，不代表 Google Cloud Day 的實際展示系統：

```python
from google.adk.agents import Agent

def fetch_night_market_data(market_name: str) -> dict:
    """Return approved, read-only market data."""
    return {
        "market": market_name,
        "traffic_status": "high",
        "top_stalls": ["stall-a", "stall-b"],
    }

agent = Agent(
    name="market_analyzer",
    model="gemini-3.5-flash",
    instruction="Use the approved tool and state uncertainty clearly.",
    tools=[fetch_night_market_data],
)
```

Google Cloud 的 [Agent Runtime ADK quickstart](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/runtime/quickstart-adk?hl=en)在 2026 年 8 月的版本使用 `google.adk.agents.Agent` 與 `gemini-3.5-flash`。這只能證明該文件當時的示例介面，不表示每個區域、帳戶或工作負載都有完全相同的可用條件。

## 工具協定不能取代授權

MCP 與 A2A 解決的是互通方式；它們不會自動決定「誰可以做什麼」。一個工具即使採用標準協定，仍需要最小權限、輸入驗證、輸出過濾、逾時、配額與人工核准。

對企業平台而言，可以把責任拆成四層：

1. **發現與註冊**：有哪些 Agent、工具與版本可以被使用。
2. **身分與授權**：每次呼叫代表誰，以及可讀寫哪些資源。
3. **執行與隔離**：程式在哪裡跑，如何限制網路、檔案與憑證。
4. **評估與觀測**：輸出是否正確，工具軌跡與成本是否可追溯。

## 會議訊號如何轉成採用判斷

如果團隊正評估 Google Cloud Agent 技術棧，建議不要從產品展示直接跳到正式上線。先做一個可驗證的最小切片：

- 選擇一個唯讀、低副作用工具。
- 定義成功條件、拒答條件與人工接手點。
- 在本地測試後，再驗證 Runtime 的身分、session、記錄與區域限制。
- 最後才擴充到多工具、多 Agent 或具有寫入權限的流程。

## 延伸閱讀與來源

- 先用 [AI Agent 完整指南](/blog/64-ai-agent-guide/)理解模型、工具、狀態、評測與治理的整體分工。
- 實作 ADK 可接著讀 [Agent Development Kit 2.0](/blog/42-agent-development-kit-2-0/)；正式環境的控制面則參考 [Enterprise Agentic AI 治理](/blog/39-enterprise-agentic-ai-governance/)。
- 官方資料：[Gemini Enterprise Agent Platform](https://docs.cloud.google.com/gemini-enterprise-agent-platform?hl=en)、[Agent Development Kit](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk?hl=en)、[ADK Runtime quickstart](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/runtime/quickstart-adk?hl=en)。
- 會議脈絡：2026 Google Cloud Day Taipei 開發者技術專場現場筆記；本文未把無公開佐證的簡報數字列為事實。
