---
title: "長時間 AI 工程的 Harness 設計：生成、評估與驗證鏈"
description: "以 Anthropic 的長時間應用實驗說明 Planner、Generator、Evaluator、QA Contract、不同模型的 Context Reset 取捨與具體成本。"
pubDate: 2026-03-30
updatedDate: 2026-10-19
tldr:
  - "Anthropic 將規劃、生成與瀏覽器驗證分工，並在實作前建立可驗收的 Sprint Contract；Evaluator 本身仍需校準。"
  - "Opus 4.5 遊戲製作器完整 Harness 約 6 小時、US$200；Opus 4.6 的另一個 DAW 任務為 US$124.70，並非只比較模型的實驗。"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["AI Agent","Harness Engineering","Evaluation","架構模式"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 6

image: "/blog/09-harness-design-long-running-apps/title_image.webp"
showToc: true
---

你請 Coding Agent 製作一套完整的 Web App。第一次執行，它把介面、API 與資料庫都生了出來，看起來很有進度；等你真正點進遊戲的「開始」按鈕，人物卻不能動。這時最需要的不是再生成十個功能，而是**有人能以使用者的操作流程證明目前的程式真的符合需求**。

Anthropic 工程師 Prithvi Rajasekaran 在 2026 年 3 月 24 日發表的 [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) 研究兩種相連的任務：主觀的前端視覺設計，以及可檢驗的長時間全端應用開發。核心思路是把模型外部的規格、檢驗、工具與回饋回路設計成 Harness，而不是把「請更仔細」寫進 Prompt。

> **花花的一句話**
>
> 長任務品質不是生成次數堆出來的。先定義如何驗收，再讓產生者與檢驗者用同一份證據對話。

## 一、先分清兩種失敗：長 Context 與自我評分

原文辨認兩類問題：

| 問題 | 觀察 | 不能直接歸因於 |
| --- | --- | --- |
| 長 Context 失去連貫 | 任務變長後，模型遺漏步驟或提前宣布完成（context anxiety） | 文件相似度或某個 RAG 解析器失靈 |
| 自我評估偏樂觀 | Agent 產出作品後，容易過度稱讚自己的實作 | 「只要另開一個 LLM 就一定客觀」 |

對早期 **Sonnet 4.5** 的長任務實驗，作者觀察到 compaction（將舊對話就地摘要）仍無法完全解決 Context Anxiety，因此使用 **Context Reset + 結構化 Handoff**：開始新的工作階段，透過檔案恢復必要狀態。

但在後來使用 **Opus 4.5** 的完整應用 Harness 時，作者表示這種焦慮已大幅降低，因此**改以單一連續 session 搭配自動 compaction，不再需要每輪 Context Reset**。這是**不同模型、不同實驗階段的工程取捨**，不是「所有 Agent 都應固定 Reset」的建議。

## 二、主觀美感如何變成可評估的工作？

一個前端頁面「好不好看」很難交給單一正誤判定。作者採用四個評估維度：

| 評估維度 | 要判定的問題 |
| --- | --- |
| Design quality | 排版、字體、色彩與畫面是否形成一致的視覺語言？ |
| Originality | 是否做出針對產品情境的設計，而非照搬常見模板？ |
| Craft | 間距、對比、字級及細節是否具有基本水準？ |
| Functionality | 使用者能否找到功能並完成實際操作？ |

Generator 產生 HTML/CSS/JS；獨立 Evaluator 使用 **Playwright MCP** 打開網頁、操作與截圖，依相同標準評分並寫下具體問題。作者以少量示例校準 Evaluator，避免只用「看起來不錯」給過高分。

該階段通常進行 **5 至 15 次迭代**，完整執行可能長達 **4 小時**。得分通常會改善，但作者也承認，不一定是最後一輪最好，且複雜度常隨迭代上升。**這些是作者觀察，不是經過大規模盲測的通用美學指標。**

## 三、全端 Harness 是三個角色與一份 Sprint Contract

在早期全端實驗中，設計被拆成：

1. **Planner**：把 1～4 句需求擴展為產品規格，但不過早鎖死細節實作。
2. **Generator**：依規格逐個功能建置，使用 Git 保留開發狀態。
3. **Evaluator**：以 Playwright 操作前端、驗證 API 與資料庫狀態，記錄實際的功能缺口。

其中最值得借鏡的是**寫程式之前先談好驗收條件**。Generator 提出 Sprint Contract：要做的功能、使用者動作、預期結果及如何測試；Evaluator 先檢查是否符合產品規格。若不一致，雙方先修正合約，再進入實作。

例如「矩形填滿工具」：

```text
需求：拖曳矩形，所有範圍內的 tile 都應被填滿。
Action：選取填滿工具，從 (2,2) 拖曳到 (4,4)。
Expected：九個 tile 全部更新。
Evidence：Browser replay + canvas state / screenshot。
Failure：只更新拖曳起點與終點，不得標記通過。
```

這是依官方缺陷案例整理的**示意 QA Contract**，不是官方提供的原始 JSON 格式。好的測試不能只有「頁面能打開」，而要檢查使用者真正需要的互動。

## 四、成本案例：品質提升伴隨巨大執行代價

原文使用同一個「2D 復古遊戲製作器」提示，對照 Solo 與完整 Harness：

| 方案 | 執行時間 | 報告的模型成本 |
| --- | --- | --- |
| Solo Agent | 約 20 分鐘 | 約 US$9 |
| 完整 Harness（Opus 4.5） | 約 6 小時 | 約 US$200 |

作者認為完整 Harness 產出的遊戲更完整，核心遊玩功能也能執行，而 Solo 的實作在互動測試時失敗。但這是**特定任務的案例比較**，不代表「多代理一定更好」，也沒有將每多花一美元的成果效益單獨隔離測量。

更重要的是，原文記錄 Evaluator 一開始也會漏測、替錯誤辯護，必須閱讀 QA Trace、反覆校準，才能指出實際 Bug。**增加 Evaluator 不等於自動有可靠 QA。**

## 五、模型改善後，該把 Harness 簡化嗎？

作者在 Opus 4.6 階段移除 Sprint 結構，保留 Planner 與 Evaluator，並把 QA 調整為較集中、必要時再返工的流程。以瀏覽器 Digital Audio Workstation（DAW）為例：

| 階段 | 報告時間 | 模型成本 |
| --- | --- | --- |
| Planner | 4.7 分鐘 | US$0.46 |
| Build 1 → QA 1 | 2 小時 7 分＋8.8 分 | US$71.08＋3.24 |
| Build 2 → QA 2 | 1 小時 2 分＋6.8 分 | US$36.89＋3.09 |
| Build 3 → QA 3 | 10.9 分＋9.6 分 | US$5.88＋4.06 |
| **總計** | **3 小時 50 分** | **US$124.70** |

這不是 Opus 4.5 與 4.6 的嚴格控制變因實驗，因為**任務、Harness 設計與模型都改變了**，不能把 200 → 124.70 當成單純換模型省下的百分比。

DAW 的 QA 還是抓到了核心問題：Timeline Clip 無法拖動、錄音按鈕沒有真的擷取麥克風、某些效果器只是數值欄位。更精簡的 Harness 仍可能需要專門的外部驗證。

## 六、落地時把觀測與驗收寫成可執行契約

對工程團隊，建議從下面這個最小流程開始：

```text
User requirement
  → Planner: 產出可審查的功能與非功能需求
  → QA Contract: 先定義 Done、反例與測試證據
  → Generator: 小步實作、保存版本
  → Independent evaluator: 操作 UI/API、執行測試
  → Gate: 不符合 → 提交缺陷；符合 → PR / 人工審核
  → Trace: 記錄時間、token、工具、失敗原因與返工
```

可以先挑**同一批 5～10 個具有代表性、可重現的任務**，對照單 Agent 與 Full Harness 的完成率、缺陷數、驗證覆蓋、成本、P95 及人工覆核時間。對金流、權限、正式資料庫等有副作用的操作，Evaluator 仍須在隔離環境與最小權限下運行。

**關鍵結論：**Harness 的價值是讓原本模糊的「看起來完成」轉成可查證的交付結果。模型越進步，越應重檢原本哪些多代理步驟仍值得花錢。

## 原始來源與延伸閱讀

- [Anthropic：Harness design for long-running application development（2026-03-24）](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Anthropic：Effective harnesses for long-running agents](/blog/10-effective-harnesses-for-long-running-agents/)：跨 Context 的交接協定。
- [OpenAI Harness Engineering](/blog/11-harness-engineering/)：Repository 知識、可觀測性與執行規則。
- [Harness Engineering 閱讀地圖](/blog/13-harness-engineering-reading-map/)：從角色選擇閱讀順序。
