---
title: "pstack 怎麼用？從 poteto-mode 開始的 AI 開發工作流與六個範例"
displayTitle: "pstack 怎麼用？六個 AI 開發任務範例"
description: "依 pstack 官方指南，說明 poteto-mode、模型設定與常用 skills，提供修 bug、加功能、重構、調查、審查與設計範例，並區分 Cursor、Claude Code 和 Codex 的使用邊界。"
pubDate: 2026-11-06
updatedDate: 2026-11-06
tldr:
  - "先用 poteto-mode 加上目標、完成標準與證據需求；大多數任務不必手動串接 skills。"
  - "Skill 定義單項工作方法，playbook 安排任務步驟，principle 約束工程判斷；安裝不等於全部自動啟動。"
  - "Cursor 是主要使用環境，Claude Code 有官方轉接說明；Codex 能載入 skill，不代表編排與模型設定完全相同。"
audience:
  - "已安裝 pstack，想開始交付實際任務的開發者"
  - "使用 Cursor、Claude Code 或 Codex 的 AI 協作開發者"
category: "AI Engineering"
tags: ["AI Agent", "Harness Engineering", "Software Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 54
kind: "article"
showToc: true
readingStyle: focused
image: "/blog/152-pstack-poteto-mode-usage-guide/title_image.webp"
imageAlt: "花花操作銅製轉轍器，把載著空白任務紙的小車導向檢查拱門，象徵選擇工作流程與驗證交付。"
---

安裝完 pstack，看到 `/how`、`/architect`、`/arena`、`/interrogate` 一長串名稱，很容易把第一個問題變成「我該照什麼順序使用它們？」[官方使用指南](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-help/SKILL.md)給的入口其實很集中：先用 `/poteto-mode` 說清楚任務，讓它選擇工作流程，再在需要特定產出時直接指定其他 skill。

這篇文章寫給已安裝、卻還不知道怎麼開始的開發者。要解決的問題是：**如何把「幫我做好」改成 Agent 能執行、你也能驗收的任務？** pstack 提供任務分類、分工與驗證的做法；你仍需要定義什麼結果才算完成。

本文於 2026-11-06 查核官方文件，以 `cursor/plugins` 中 pstack 的 [commit `c742dd6`](https://github.com/cursor/plugins/tree/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack)為閱讀版本。下方是依文件改寫的教學提示詞，**沒有逐一執行這些開發任務，也不提供效能或成功率實測結論**。指令範例以 Cursor 為主，其他環境的差異另列。

## 先理解 skill、playbook 與 principle

pstack 把工程習慣寫成可供 Agent 讀取的 instructions、參考文件與工作流程。[README](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/README.md)將目標放在程式碼品質與可驗證性；這是作者提出的設計方向，不能直接當成採用後必然改善品質的實測證據。

實際使用時，三個層次分清楚就夠了：

- **Skill** 處理一種工作。例如 `/how` 解釋程式如何運作，`/interrogate` 尋找能重現的問題。
- **Playbook** 安排一類任務的步驟。例如 Bug fix、Feature、Refactoring 與 Investigation。它們放在 `poteto-mode` 內，不各自對應一個斜線指令。
- **Principle** 提供工程判斷準則。例如修改後應檢查實際行為，或遇到能用實驗回答的問題，先取得證據。

依 [poteto-mode 的規則](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/SKILL.md)，入口會比對任務、讀取合適的 playbook，將步驟放進待辦，再按需要使用其他 skills；省略的步驟應留下理由。使用者因此可以檢查它選了什麼流程、跳過了什麼，而不只看到最後一段「已完成」。

> **花花的一句話**
>
> 交給 pstack 的第一件事，是定義一個能被證據判定完成的任務；skill 名稱可以之後再學。

## 已經安裝，接下來做什麼？

在 Cursor，官方的[設定流程](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/01-setup.md)是先執行 `/setup-pstack`，選擇推理預算與各角色使用的模型，再開新聊天使用設定。若還沒安裝，指南提供 `/add-plugin pstack` 作為安裝入口。

`setup-pstack` 會寫入 `~/.cursor/rules/pstack-models.mdc`。這是 Cursor 的角色設定檔；它不會替你購買模型權限，也不代表其他工具會自動讀取相同路徑。指南列出 `small`、`medium`、`large` 與 `unlimited` 等預算選項，但這些是推理程度的設定，**不是固定金額或 token 上限**。角色設為 `auto` 或 `inherit-parent` 時，依指南會沿用父聊天模型；審查名單有幾個項目，也會影響啟動的子代理數量。

接著，在 Cursor 聊天中選取 `/poteto-mode` 並輸入任務。若要讓 skill 在後續回合持續作用，[Cursor 的 Custom Mode 說明](https://cursor.com/docs/skills#using-a-skill-as-a-custom-mode)提供從選單以 Mac 的 Option+Enter 或 Windows 的 Alt+Enter 啟用方式；一般附加 skill 到單則訊息，不能視為整段對話都持續套用。新手也可以在每項新任務明確指定 `/poteto-mode`。

設定完成後，先選一個範圍小、結果清楚的任務。不要把「整個專案優化一下」當成第一次驗收題。

## 提示詞要寫到什麼程度？

官方的[提示詞指南](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-help/references/prompting.md)強調目標、完成檢查、證據、已知線索與限制。你可以把它整理成五個問題：

1. 哪個行為有問題，或你希望新增什麼？
2. 哪個可觀察的結果代表完成？
3. 要看到測試輸出、畫面、資料值，還是前後比較？
4. 已經知道哪些重現步驟、檔案或錯誤？
5. 這次可以改到哪裡，哪些動作要留給你？

不必每次填滿五項，也不需要替 Agent 排定 `/how → /architect → /arena → /interrogate`。流程本來就會按情境選擇；手動加一長串技能，容易把注意力移到「有沒有跑完儀式」，反而模糊了交付目標。

下面六個範例均為**示意任務**。請替換成專案實際的路徑、指令與資料；提示詞裡要求的證據，是你應向 Agent 索取的交付物，不是本文已取得的結果。

## 範例一：修正手機文章頁的橫向溢出

適合已知畫面有問題，卻還沒確認根因的情境。

```text
/poteto-mode 文章頁在手機上會被長網址撐寬。
先重現，再做最小修正。
完成標準：在 375px 與 390px 寬度下，頁面沒有整頁橫向捲動；
長網址、程式碼和表格仍可閱讀。
提供修改前後的瀏覽器檢查與截圖。
保留無關修改，不要 commit 或部署。
```

這個要求把「看起來正常」拆成可檢查的行為。你要驗收的是實際頁面寬度、內容可讀性與變更範圍；build 通過只能證明部分建置條件成立。如果程式碼區塊需要自己橫向捲動，也應檢查它有沒有連帶撐寬整個頁面。這是本文對此示例提出的驗收設計。

## 範例二：新增輸出格式，保住既有 CLI 使用方式

新增功能時，把新行為與應保留的舊行為一起寫出來。

```text
/poteto-mode 替這個 CLI 新增 --json 輸出選項。
JSON 要包含 id、status 與 message。
未指定 --json 時，既有文字輸出必須逐位元組相同。
完成標準：成功與失敗情境都能解析 JSON，原有 exit code 不變。
提供驗證命令與代表性輸出，不要 commit。
```

這個例子適合 Feature 流程。除了看新選項能否使用，還要比較原有文字輸出與 exit code。能解析 JSON 也不代表欄位語意正確，審查時仍要核對成功與失敗的內容。若專案尚未定義 JSON schema，應先把欄位型別與失敗格式定清楚。

## 範例三：重構時先固定可以比較的行為

「整理一下程式碼」容易變成順手改功能。指定一個可比較的外部結果，會更容易驗收。

```text
/poteto-mode 把文章閱讀時間的重複計算集中到一個模組。
這次只重構，不調整演算法或顯示格式。
先記錄現有繁中與英文樣本的輸出，再修改。
完成標準：樣本結果完全相同，所有呼叫端使用同一份實作。
列出比較方式、結果與尚未涵蓋的情境，不要 commit。
```

這符合 [Refactoring 的定位](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/SKILL.md)：改結構，同時保留行為。本文建議至少包含空內容、中文、英文與含程式碼的樣本；樣本一致是這些案例的證據，不能升級成「所有輸入都已證明等價」。

## 範例四：先調查，不讓疑問直接變成修改

當你還不確定問題在哪裡，要明確指定只讀調查。

```text
/poteto-mode new task. 調查使用者登出後，為什麼仍看得到上一個帳號的快取內容。
先不要修改任何檔案。
說明登出、快取失效與畫面更新的實際流程，附上程式位置。
用可重現的步驟區分已確認行為與假說。
如果缺少執行環境或資料，列出無法確認的部分。
```

`new task` 用來表明這是新任務，避免沿用上一項工作的流程；「先不要修改」則把交付物定為調查報告。官方[任務路由指南](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/02-poteto-mode.md)將這類唯讀問題歸入 Investigation。你應收到流程、依據、重現結果和未知項，而非一份還沒釐清原因的 patch。

## 範例五：修改後，要求審查者證明問題

已經有 diff，想找真實 bug 或回歸時，可以直接使用 `/interrogate`。

```text
/interrogate 審查目前分支相對 main 的修改，包含尚未提交的差異。
不要修改正式實作，也不要 commit。
聚焦錯誤行為與相容性回歸；
每個保留的問題都要有可執行的重現方式、實際結果與預期結果。
無法驗證的疑慮另列為限制，不要當成已確認 bug。
```

依 [interrogate 的規則](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/interrogate/SKILL.md)，審查者嘗試用實際執行證明失敗，主流程再重跑並篩選發現；它的交付是報告，不是自動套用修正。「沒有驗證成立的發現」也是有效結果，不應為了湊清單硬列風險。

若問題是「這個小改動會不會影響 diff 之外的其他地方」，[blast-radius](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/blast-radius/SKILL.md)更貼近需求。它會追查外部依賴、資料格式與呼叫關係，並嘗試執行程式來證明關鍵安全假設。兩者回答的問題不同，無須每次全部啟動。

## 範例六：先看設計，再決定是否實作

若模組邊界還沒定好，可以使用 `/architect`，但要注意它預設會繼續實作。要先審設計，必須把 checkpoint 說清楚。

```text
/architect with checkpoint
替文章搜尋設計可替換的索引讀取介面。
需要支援目前的靜態 JSON，以及未來可能採用的遠端來源。
先檢查既有搜尋流程，比較至少兩個結構不同的方案。
說明公開介面、錯誤處理與對現有呼叫端的影響。
先停在設計檢查點，等我看過再填入實作；不要 commit。
```

官方 [architect skill](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/architect/SKILL.md)包含理解現有系統、比較草圖、整合設計與實作；人工檢查點是明確選入的行為。這個示例適用於遠端來源已是已知需求的情況；若只是模糊的未來可能性，本文建議先評估是否值得增加抽象層。

## 什麼時候直接點名其他 skill？

需要的產出已經很明確時，直接選 skill 比完整開發流程更容易控制範圍。以下依[官方技能對照](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-help/SKILL.md)整理；這些是用途說明，不代表一次任務應全部使用。

| 你現在的問題 | Skill | 主要產出 | 使用時要說清楚 |
| --- | --- | --- | --- |
| 程式現在如何運作？ | `/how` | 架構與執行流程說明 | 指定模組或功能 |
| 當初為什麼這樣設計？ | `/why` | 有來源的設計理由與未知項 | 缺少歷史紀錄時不能編造動機 |
| 想真正理解這項修改 | `/teach` | 結合運作方式與理由的解釋 | 指出讀者背景與疑惑 |
| 需求還太模糊 | `/sharpen` | 更深入、可驗收的提示詞 | 它改寫任務，不直接做任務 |
| 希望多份方案互相比較 | `/arena` | 從多個候選整合出的結果 | 同一份題目，不是分割工作 |
| 要平行檢查多個範圍 | `/swarm` | 彙整後的檢查報告 | 範圍、完成條件與隔離方式 |
| 忘記這段聊天做了什麼 | `/ketchup` | 本聊天進度與待決定項目 | 不等於重建所有歷史聊天 |
| 不知道該選哪個 | `/poteto-help` | 用法與建議提示詞 | 問使用方法即可 |

## Cursor、Claude Code、Codex 要分開看

Skill 文件可以被不同工具閱讀，但文件裡的工具名稱、模型角色、規則路徑和長時間執行能力，仍依宿主環境而定。pstack 的[使用指南](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-help/SKILL.md)也明確指出這個限制。

| 環境 | 任務入口 | 模型設定與編排 | 應核對的邊界 |
| --- | --- | --- | --- |
| Cursor | `/poteto-mode` | `/setup-pstack` 寫入 Cursor 規則 | Custom Mode、子代理與 `/loop` 的實際可用性 |
| Claude Code | `/pstack:poteto-mode` | 官方 adapter 將模型規則映射到 `~/.claude/rules/pstack-models.md` | 非 Claude 模型與 Cursor 專屬功能的替代或略過 |
| Codex | 已安裝後明確指定 skill，例如 `$poteto-mode` | 依 Codex 當前提供的工具與模型能力執行 | 載入 skill 不足以證明 Cursor 編排已完整移植 |

Claude Code 的官方[轉接說明](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/harness/claude-code.md)定義了指令前綴、工具與規則路徑的對應，也說明非 Claude 模型如何回退，以及無法使用的 Cursor 功能如何記錄略過。因此不能因為設定檔寫了某個模型名稱，就宣稱該模型實際參與審查。

Codex 的 [OpenAI 官方 skill 文件](https://learn.chatgpt.com/docs/build-skills#how-chatgpt-and-codex-use-skills)說明，在 CLI 或 IDE extension 可透過 `/skills` 或 `$` 明確選取 skill。若你已在 Codex 安裝這些檔案，可用 `$poteto-mode` 搭配同樣的目標與驗收標準；但本文沒有完成跨平台編排實測，不承諾 Cursor 的 Custom Mode、模型路由或 `/loop` 能原樣使用。`/loop` 本身也是 Cursor 內建功能，不是 pstack 提供的 skill。

## 使用後，怎麼知道這次值得？

先檢查交付物，再討論是否要開更多代理。對上述範例，可用的證據分別是實際畫面、可解析的輸出、重構前後比較、能追查的流程、可重跑的失敗，以及有取捨的設計。要求 Agent 說明哪些檢查沒做、為什麼沒做，會比只問「全部好了嗎」更有幫助。

成本也要跟任務一起看。[設定指南](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/01-setup.md#keep-the-cost-in-check)指出，子代理、審查面板與較高推理程度會增加 token 消耗；縮小面板或調低預算是可用的控制方式。這不是固定省多少錢的承諾，`auto` 也不是免費模式。

如果要同時修改多個範圍，[任務指南](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/02-poteto-mode.md#give-parallel-work-its-own-machine)建議隔離代理的工作環境。本機 worktree 能隔離檔案，但還要留意 port 與共用建置輸出；平行分工不是把所有代理丟進同一個目錄。

> **花花的工程提醒**
>
> 多一位審查者，只有在他能取得必要環境、獨立執行並交回證據時，才增加可檢查的資訊。多段「看起來沒問題」不能補上缺少的驗證。

第一次使用，挑一個今天本來就要處理的小問題，寫出目標、可判定的完成標準與想看的證據，再交給 `poteto-mode`。交付後，對照真正跑過的檢查與留下的限制，決定這類任務是否值得保留這套流程。若想進一步理解 Agent 的工具、狀態與評估如何配合，可接著閱讀 [AI Agent 工程指南](/blog/64-ai-agent-guide/)。

## 來源與閱讀版本

- [pstack 使用指南](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-help/SKILL.md)：官方技能入口與情境對照；由 poteto 維護，屬操作文件，不是效果評測。
- [pstack README 與固定版本](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/README.md)：本文閱讀快照；該 pstack 路徑最近一次變更的 commit 時間為 2026-10-27 UTC，不等於產品發布日。
- [設定指南](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/01-setup.md)、[任務路由指南](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/guide/02-poteto-mode.md)、[提示詞寫法](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-help/references/prompting.md)：設定、任務與驗收設計的主要依據。
- [Claude Code adapter](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/harness/claude-code.md)、[Cursor Skills](https://cursor.com/docs/skills)、[OpenAI Skills](https://learn.chatgpt.com/docs/build-skills)：平台差異；線上文件可能隨版本更新，查核日為 2026-11-06。
