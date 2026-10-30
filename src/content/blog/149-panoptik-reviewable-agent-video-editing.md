---
title: "Panoptik：AI 剪片的提案，何時真的要等人接受？"
description: "從 Panoptik 的 WebMCP 編輯介面看結構化修改的價值，並釐清 README 所說的人工接受，與固定版本實際寫入時間軸的差異。"
pubDate: 2026-10-30
updatedDate: 2026-10-30
tldr:
  - "把影片修改寫成時間、位置與操作，比只讓 Agent 拖曳時間軸更容易檢查意圖與結果。"
  - "Panoptik 保留差異確認介面，但所讀版本的主要批次與數個 staging 入口會直接修改專案，不能視為所有修改皆先經接受。"
  - "本機影片處理不等於全流程離線；雲端轉錄、導演摘要與外部 Agent 是不同資料邊界。"
audience:
  - "關心 AI 創作工具控制權的創作者與產品設計者"
  - "設計編輯器與 Agent 工具介面的工程師"
category: "Creator Tools"
tags: ["Creator Tools", "AI Agent", "MCP", "架構模式"]
kind: "article"
showToc: true
image: "/blog/149-panoptik-reviewable-agent-video-editing/title_image.webp"
imageAlt: "原創概念圖：花花檢視膠卷上方的剪輯提案，虛線框將提案與影片分開。"
---

假設一段產品操作錄影裡，游標終於點到搜尋框，你想讓 AI 放大那一刻，再刪掉前面的等待。最讓人想檢查的，通常不是 AI 是否像人一樣拖動了時間軸，而是它究竟改了哪段、放大中心在哪裡、字幕是否被切斷，以及修改之後還能否繼續接手。

[Panoptik](https://github.com/Panoptik-Studio/Panoptik) 把這個問題放進瀏覽器影片編輯器：Agent 透過 WebMCP 讀取專案與影格，呼叫結構化編輯操作，創作者則在同一個時間軸與預覽畫布觀看結果。這個方向值得理解。不過，文件所說「先提案、等人接受」與實際入口的行為有明顯距離。**可見的修改結果，和修改前的接受關卡，是兩件必須分開確認的事。**

以下依據 2026-10-04 的固定原始碼版本 `e16fcb0`；這是程式碼與官方頁面的閱讀觀察，沒有剪輯效率、畫質或隱私的實測結論。GitHub 的建立時間是 2026-08-26，不能把它當成產品發布日；截至 2026-10-30，官方 repository 的 Releases 清單也沒有可對應的正式版本。[固定 README](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/README.md)

## 先把「怎麼操作介面」換成「打算改什麼」

一般 UI 操作會把剪輯意圖拆成點選、縮放時間軸、拖曳端點等動作。這些動作可能完成任務，卻不直接告訴人「刪除的是哪個時間區間」。Panoptik 的主要批次工具 `propose_edits` 接受 cut、zoom、text、speed 等操作物件；讀取工具則提供專案、逐字稿、片段和影格資訊。模型仍須判斷什麼值得突出，但不必把每次修改都翻譯成畫面上的滑鼠路徑。[批次工具定義](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/tools-batch.ts#L398-L455)

例如，「刪掉等待，放大接下來的搜尋框」可以先寫成一份人能討論的意圖：

```text
教學示意，並非實際工具執行結果：
目前時間軸 3–5 秒：刪除已確認沒有必要保留的等待
原本 8 秒的搜尋動作：刪除後出現在約 6 秒
新的 6–8 秒：放大搜尋框，確認不遮住解說字幕
```

這個例子沒有宣稱 Panoptik 已看懂搜尋框，也不保證移除等待是正確的剪輯選擇。它的用途是讓人分開看「要改哪裡」、「為何改」與「完成後是否符合原意」。比起只收到一段「已幫你剪好」的回覆，這樣比較容易指出誤解。

Bloss0m 的設計解讀是：結構化操作最有價值的地方，在於它讓創作決定能被檢查和修正。這還不是效率勝出的證據。README 對 UI 控制與結構化呼叫的資料量有約略比較，但沒有可供重現的共同工作負載與量測方法，因此不宜把它當成節省成本或提高成功率的 benchmark。

## 剪掉兩秒之後，同一個「八秒」已經不是同一處

影片編輯有一個容易被介面操作掩蓋的問題：原始素材的時間，和目前作品的時間會分開。刪掉前面兩秒後，原始錄影第八秒的動作，可能出現在目前時間軸第六秒；調整速度後，兩種時間的關係還會改變。

Panoptik 的 `timeSpace.ts` 把儲存的原始素材秒數與工具邊界的目前時間軸秒數分開。讀取結果在邊界做換算，修改則對應回素材位置。批次路徑經過 snapping 與 rebasing，回應也會附上時間軸版本及剪切造成的位移資訊，要求 Agent 重新取得狀態。[時間轉換](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/timeSpace.ts#L1-L49)、[批次回應](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/tools-batch.ts#L421-L455)

這說明為什麼「Agent 看得見畫面」仍不夠。它也需要知道自己的觀察對應哪個版本的作品，不能剪掉一段後繼續沿用舊時間戳。程式裡的語音邊界、轉場與縮放規則，則試圖把部分幾何和時間限制交給確定性程式處理。[snapping 實作](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/snapping.ts)

這些規則能表達作者想保護的條件，但不保證剪輯判斷正確：沒有可靠逐字稿或分析時，系統可能使用由現有專案合成的分析資料；知道某段沒有字幕，不等於知道那裡沒有必要保留的聲音或畫面。[分析回退分支](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/tools-batch.ts#L48-L111)

## 確認視窗存在，但主要修改不一定等它

README 將編輯描繪成 staged diff，並說人點接受以前專案不會改變。原始碼確實保留 `stagedZoomPoints`、`stagedTextOverlays`、差異清單和確認視窗。`commit_staged_changes` 在待處理數量大於零時，會等待確認，再呼叫 `commitAll()`；沒有對話框接手請求時，確認函式預設拒絕。這是一段實際存在的控制流程。[確認分支](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/tools-batch.ts#L460-L507)、[預設拒絕](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/confirm.ts#L7-L40)

問題是，不能由此推論每個修改都先進入這個分支。沿著工具實際呼叫的函式往下看，會得到不同結果：

| 路徑 | 固定版本實際寫入方式 | 人工確認的範圍 |
| --- | --- | --- |
| `propose_edits` | 執行 batch executor，直接把新 segments 寫回專案 store | 此入口沒有先等待接受 |
| 縮放、文字、背景的 staging 名稱入口 | store 將縮放與文字放入正式陣列；背景直接更新 | 名稱與回傳 staged 訊息不代表真的隔離暫存 |
| `commit_staged_changes` | 只對目前 staged diff 做確認後提交 | 有 pending 項目時才進確認；沒有時可直接回報 nothingStaged |
| `export_clip` | 先等待確認，才呼叫本機 exportProject | 控制匯出，不會補回之前修改的接受關卡 |

第一列不只是工具描述：`propose_edits` 呼叫 `executeBatchOps`，後者實際執行 `useProjectStore.setState` 更新專案。更容易忽略的是，`stageZoomProposals` 將 `staged` 改成 false 並加入 `zoomPoints`；`stageTextOverlay` 也是加入 `textOverlays`；`stageBackground` 轉呼叫直接更新的 `setBackground`。所以連名字裡帶 stage 的小工具，都不能直接視為尚未套用。[批次寫入](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/batchExecutor.ts#L371-L384)、[縮放寫入](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/stores/projectStore.ts#L768-L779)、[文字與背景寫入](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/stores/projectStore.ts#L910-L951)

字幕產生也直接替換 caption overlays；分割、刪除、速度等工具有直接修改 store 的路徑。現有差異視窗是部分機制，不能描述成所有工具共用的修改前防線。[字幕寫入](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/tools-b.ts#L497-L506)、[時間軸工具](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/tools-b.ts#L579-L897)、[匯出確認](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/tools-a.ts#L590-L615)

時間軸和畫布能呈現正式與 staged 資料，因此這仍是值得研究的共同編輯介面。但「我看得到它已改成什麼」是觀察能力；「我同意之前它不能改」是寫入約束。撤銷能力也不能代替事前接受。要理解這類工具，必須確認自己需要的是哪一層控制。

## WebMCP 是頁面內工具入口，不是隱私或接受保證

在所讀版本中，註冊程式優先使用 `document.modelContext.registerTool`，另有 `window.modelContext` 與頁面內 helper 回退。這讓相容的 Agent host 能呼叫編輯器提供的工具；它不是對任意網站或桌面軟體都適用的影片自動化協定，也不會自動替每個工具加上人工接受。[工具註冊](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/lifecycle.ts#L44-L115)

README 所說的 ChatGPT 內建瀏覽器與 Chrome 測試旗標，是專案描述的整合條件，並非本文驗證過的跨環境支援承諾。官方[首頁](https://panoptik-studio.vercel.app/)與[編輯器頁](https://panoptik-studio.vercel.app/editor)可公開讀取，但部署對應的 commit 未確認，不能把線上頁面與此固定版本當成相同執行環境。

資料邊界也要分開看。專案以 WebCodecs、Canvas2D 和瀏覽器儲存處理影片解碼、預覽與匯出；這是本機媒體路徑。轉錄與自動導演則是另外的功能：provider 程式會把音訊送到 Groq 或 proxy，把影片摘要與使用者指令送到導演 proxy；proxy 還有其他供應商的回退分支。BYOK 是使用自己的金鑰，不代表請求留在本機。[provider 路徑](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/lib/ai/providers.ts#L94-L275)、[proxy 實作](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/proxy/src/index.ts)

程式有 air-gapped 模式阻擋這些 provider 請求；但這不是對瀏覽器所有網路流量、外部 Agent host、服務端保存政策的完整稽核。`probe_frames` 可回傳影格快照，摘要工具也可能提供逐字稿，因此即使原始影片沒有整檔上傳，交給外部 Agent 的內容仍可能包含敏感資訊。不能只憑「本機匯出」認定整條創作流程完全私密。[影格工具](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/apps/web/src/webmcp/tools-batch.ts#L250-L314)

## 值得借走的，是能讓人接手的編輯表示

Panoptik 吸引人的地方，是把創作意圖、時間位置、工具結果與作品預覽放在同一個可討論的地方。Bloss0m 的判斷是，這比要求 Agent 只模仿人類拖曳操作，更有機會讓人指出錯誤、縮小修改範圍並延續自己的作品。這是設計價值的解讀，不是已量測的剪輯效率或使用者研究結論。

同時，它也提供一個很具體的提醒：提案介面不等於提案隔離。如果產品承諾「接受前不修改」，所有能寫入專案的入口都必須遵守同一條邊界；只保留一個確認按鈕或 staged 欄位並不夠。對創作者而言，接下來最有用的問題是：這次操作已套用，還是等待我接受？拒絕或丟棄會取消哪些內容？匯出畫面是否包含仍待決定的效果？

> **花花的工程提醒**
>
> `propose` 和 `stage` 是名字。只有真正把待接受內容和現有作品分開儲存，並在接受後才寫入，才構成修改前的控制權。

若要以這個專案理解可檢查的 AI 創作工具，可以先比較同一個操作的文件承諾、store 寫入與預覽呈現，而不急著把可用的 demo 當成可控性證據。程式授權也有分層：README 與根目錄授權將 web app 列為 AGPL-3.0，engine 與 schema 則按 README 為 MIT；engine 有獨立 MIT 檔案。引用這個設計不需要重用官方畫面；若後續要採用程式或素材，仍應依實際元件和素材確認權利範圍。[README 授權](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/README.md#license)、[根授權](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/LICENSE)、[engine MIT](https://github.com/Panoptik-Studio/Panoptik/blob/e16fcb090141256e1117d70a2546688c2ca22c55/packages/engine/LICENSE)
