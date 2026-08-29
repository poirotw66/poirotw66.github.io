---
title: "Mitchell Hashimoto 的 AI 採用六階段：從丟掉 Chatbot 到 Harness Engineering"
description: "深讀 Hashimoto 親筆歷程：三階段工具採用、重做 commit 練功、離峰與 slam dunk 委派、AGENTS.md 與可驗證工具，以及「總有一個 Agent 在跑」的現狀與限制。"
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "深讀 Hashimoto 親筆歷程：三階段工具採用、重做 commit 練功、離峰與 slam dunk 委派、AGENTS.md 與可驗證工具，以及「總有一個 Agent 在跑」的現狀與限制"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["AI Agent","Enterprise AI","Harness Engineering","Codex","Agentic Coding"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 13
image: "/blog/16-mitchell-hashimoto-harness-origin/title_image.webp"
showToc: true
---
Mitchell Hashimoto（Ghostty、HashiCorp 創辦人）在 2026 年 2 月寫了一篇 **全程親筆** 的文章，描述他如何從 AI 懷疑者走到 **Harness Engineering**——並刻意聲明：在 AI 話題裡，他必須強調「這篇不是 AI 寫的」。

若你厭倦 hype，這篇的價值在**節奏**：他借用任何工具都會經歷的三階段——(1) 低效 (2) 夠用 (3) 改變工作流——並把六個可複製的步驟寫清楚。本文是 [閱讀地圖 13](/blog/13-harness-engineering-reading-map/) Phase 1 收尾，與 [OpenAI 11](/blog/11-harness-engineering/)、[Fowler 14](/blog/14-martin-fowler-harness-engineering-review/)、[LangChain 15](/blog/15-langchain-agent-harness-anatomy/) 並讀：**個人工作流 + 可累積的 Harness 紀律**。

> 他對 Harness Engineering 的定義：**Agent 越能一次做對、或只需極少修補，就越需要快速、高品質的工具自動告訴它錯了。** 行業若已有更好術語，他願意換——重點是行為，不是造詞。

> **花花的一句話**
>
> 喵～不用盲目跟風 AI 炒作，從丟掉舊習慣開始，慢慢把工具和驗證機制建立起來，讓 Agent 在背景穩穩地跑！
>
> **花花的工程提醒**
>
> 採納 Agentic Coding 應循序漸進，並專注於建立可驗證的 Harness 紀律。當 Agent 負責越來越多工作時，系統必須具備快速、高品質的自動化工具來提供反饋，確保無縫協作與偵錯。

### 寫作姿態：測量、不說教、不站隊

Hashimoto 明確說：

- 不投資、不顧問任何 AI 公司（**no skin in the game**）。
- 尊重不用 AI 的選擇；此文**不是說服文**，只是分享導航方式。
- 景觀變太快，他預期很快會覺得自己 naive——但願意成長。

這種語氣在 Harness 討論裡少見：多數文章要麼賣產品，要麼宣布革命。他把自己定位成 **software craftsman who wants to build stuff**。

### Step 1：丟掉 Chatbot 做正事

**主張**：立刻停止用 ChatGPT／網頁 Gemini **做有意義的編程工作**。

Chatbot 仍有價值（他日常仍用），但編程上你是在賭模型靠訓練「猜對」，錯了就要**你**反覆糾正——在 brownfield 專案上極低效。

#### 第一次「哇」與幻滅

他還是 AI 懷疑者時，把 **Zed command palette 截圖**貼給 Gemini，要 SwiftUI 復刻——結果好到離譜；**Ghostty macOS 版 command palette 幾乎就是那次產出稍加修改**。

但想把同一招複製到其他任務時**屢敗**。在既有專案裡 chat 常產出劣質結果，複製貼上程式與終端輸出讓他抓狂——**明顯比自己做更慢**。

#### 轉折：必須是 Agent

**Agent** = 能聊天並在迴圈中呼叫外部行為的 LLM。
他認為最低限度要有：**讀檔、執行程式、HTTP 請求**。

這一步與 [LangChain 15](/blog/15-langchain-agent-harness-anatomy/)「裸模型不是 Agent」一致：沒有 Harness 迴圈，就只是聊天。

### Step 2：重做你自己的 commit（最痛苦也最值得）

他開始用 **Claude Code**，起初**不 impressed**：幾乎每個產出都要修，修補時間 > 自己做。

他沒放棄，而是採**極端練功**：

> **每個手動 commit，都再逼 Agent 做出功能與品質等價的結果（且不能看到你的手動解法）。**

等於**每件事做兩遍**——極折磨，因為擋住「把事情做完」。但他對非 AI 工具也有經驗：**摩擦是學習期正常現象**，沒耗盡努力就無法下結論。

#### 自己推導出的原則（與社群後來說法一致）

1. **Session 拆成清楚、可執行的小任務**——不要一個 mega session「畫完整隻貓頭鷹」。
2. **模糊需求**拆成 **planning session** 與 **execution session**。
3. **給驗證手段**——Agent 常能自己修錯、防回歸。

#### 負空間：知道何時不要用 Agent

在 Agent **很可能失敗**的任務上開 Agent 是純浪費。建立「負空間」認知本身就能省時間——模型迭代很快，他說自己**必須不斷重訪**這條邊界。

#### 階段感受

到此他覺得 AI **夠用**，願意放進工作流，但**還不覺得更快**——多在旁邊 babysit。這對很多讀者會共鳴：**先夠用，才談改變工作流**。

### Step 3：離峰 Agent（End-of-Day）

假設：在**本來也無法深度工作**的時段讓 Agent 推進，是否「多賺」時間？
策略：每天最後 **30 分鐘**啟動一個或多個 Agent——不是「更多擠進工作時間」，而是**用原本低效時間**。

起初同樣**煩且無效**，但他找到幾類**真的有用**的工作：

| 類型 | 做法 | 產出 |
|------|------|------|
| 深度調研 | 例如找某語言某授權的所有函式庫，各寫多頁優缺點、維護度、社群情緒 | 隔天閱讀報告 |
| 並行探路 | 對幾個模糊點子各開 Agent，**不求可 ship**，只求揭露未知的未知 | 隔天選方向 |
| Issue／PR triage | 用 `gh` 腳本並行 spin up Agent 分類；**不允許 Agent 代回覆** | 早上看報告，決定先做高價值／低 effort |

他**沒有**像某些人那樣讓 Agent **整夜 loop**；多數任務半小時內結束。重點是：傍晚疲勞時，與其低效刷問題，不如**啟動代理**，隔天 **warm start** 更快進入狀態。

感受：開始覺得比 AI 前**略多產出**。

### Step 4：外包 Slam Dunk

當他對「Agent 擅長什麼」**信心很高**後，下一步是：**讓 Agent 包辦這些，自己同時做別的深度工作**。

**早晨流程**：

1. 看昨夜 triage Agent 的結果。
2. **人工篩**出「Agent 幾乎肯定能做好」的 issue。
3. 背景**一次一個**跑 Agent（不並行多個）。
4. 自己進入 pre-AI 那種深度思考模式——不是去刷社群或影片。

#### 關鍵紀律：關掉 Agent 桌面通知

**Context switching 非常貴。**
必須是**人決定何時**去看 Agent，而不是 Agent 戳你。在自然休息點切過去看一眼即可。

#### 技能形成（Anthropic 論文）的務實回應

外包的任務**少練技能**，手動做的任務**仍自然練**。他認為這是**取捨**：不是全面不學，而是選擇把熟練度投在仍想手做的任務。
他也點名：**初階工程師若基礎不牢，技能形成問題尤其令人擔憂**——這是社會討論，不是「因此不用 AI」的簡化結論。

#### 階段感受

進入 **「不可能回去」** 區間：就算效率數據不明，也能把**喜歡的編碼**與**必須做的雜務**分離——這對資深維護者吸引力極大。

### Step 5：Engineer the Harness（術語來源）

**定義（他的話）**：
每當 Agent 做錯事，就花時間工程化，讓它**再也不會**那樣做——他稱 **harness engineering**；若業界有更好的詞他會跟。

兩種形式（與 [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/) guides/sensors 對齊）：

#### A. 更好的隱式 prompting — `AGENTS.md`

簡單反覆問題：跑錯命令、找錯 API → 寫進 AGENTS.md。
**Ghostty 範例**：[AGENTS.md](https://github.com/ghostty-org/ghostty/blob/main/AGENTS.md) **幾乎每一行都來自一次壞 Agent 行為**，加完後**幾乎不再重犯**。

這與 [OpenAI 11](/blog/11-harness-engineering/) 把規範機械化、知識地圖化是同一族，但 Hashimoto 的版本更**個人化、逐行累積**——適合單倉庫、高 commit 頻率的維護者。

#### B. 真正的程式化工具

腳本：截圖、跑**過濾後的測試**、其他可重現檢查。
並在 AGENTS.md **告知工具存在**，否則 Agent 不會用。

**與組織級 Harness 的差異**：OpenAI 談百萬行與自訂 linter；Fowler 談 sensor 覆蓋率；Hashimoto 談**你一個人也能每天做的小步外顯**。

### Step 6：總有一個 Agent 在跑

與 Step 5 **同時**推進的目標：
**若沒有 Agent 在跑，就問自己「現在是否有可委派的事？」**

他偏好**慢而深**的模型（例如 Amp 的 deep mode，類 GPT-5.2-Codex），小改動可 **30+ 分鐘**，但品質高。

#### 現實數字與克制

- 一般工作日約 **10–20%** 時間能真的讓背景 Agent 有效運行——仍是**目標**，持續改進。
- **尚未**、也**不太想**多 Agent 並行：一個背景 Agent 已是在「深度手作」與「有點笨但高產出的機器人」之間的平衡。

#### 真正的瓶頸

不是「沒模型可跑」，而是**能否持續產生值得委派的高品質任務佇列**——這即使沒有 AI，也是資深工程師該修的系統。

### Today：他現在在哪

文章結尾：他相信自己以**務實、接地氣**的方式在用現代 AI；是否 AI 會留下來他**無所謂**，只想做喜歡的軟體。

也預留「很快會覺得這篇 naive」——成長的代價是尷尬，他希望方向正確。

### 六階段不是線性必修課：你在哪裡

| 若你現況是… | 優先參考 |
|-------------|----------|
| 還在用網頁 chat 改 production 程式 | Step 1 → Agent 工具 |
| Agent 總要大量改 | Step 2 重做 commit；檢查任務是否太大 |
| 有零碎時間沒用好 | Step 3 離峰 triage／調研 |
| 已知道 Agent 擅長項但還在手做雜務 | Step 4 + **關通知** |
| 同錯誤反覆出現 | Step 5 AGENTS.md + 腳本 |
| 想提高委派比例 | Step 6 + 任務佇列設計 |

### 與本系列三篇「理論／產品／組織」的關係

| 文章 | 視角 | Hashimoto 補什麼 |
|------|------|------------------|
| OpenAI 11 | 組織、百萬行、GC | 個人如何走到類似紀律 |
| Fowler 14 | 控制論、行為缺口 | 「每次錯誤 → sensor/guide」的日常版 |
| LangChain 15 | 元件目錄 | AGENTS.md、bash、腳本在叙事中的位置 |
| **本篇** | 採用史 | 情緒、時間、通知、技能取捨 |

### 啟示與建議：可本週執行的三條

1. **選一個最近手動 commit**，用 Agent 在看不見你解法的前提下重做一遍——只為學邊界，不為趕工。
2. **加一條 AGENTS.md**：對應「上週 Agent 最常犯的同一個錯」——一行即可。
3. **關閉 Coding Agent 的桌面通知**，固定兩個時段檢查結果。

### 小結

Harness Engineering 在 Hashimoto 筆下非常樸實：**Bad Thing → 永遠不再發生；Good Thing → 可被工具驗證。** 六階段描的是**信任與委派如何漸進建立**，不是「買哪個模型」的廣告。Phase 1 深讀至此；Phase 2 五篇見 [閱讀地圖](/blog/13-harness-engineering-reading-map/)。

原文出處：
**Mitchell Hashimoto（2026）. My AI Adoption Journey.**
網址：<https://mitchellh.com/writing/my-ai-adoption-journey>
