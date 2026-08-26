---
title: "SWE-Bench ProMax：大型多語言重構，真的能測出 coding agent 的長程協作嗎？"
description: "深讀 SWE-Bench ProMax：以 170 個跨檔案、多語言、行為保持的程式重構任務，檢驗 coding agent 是否能完成大型變更，而不只修好一個測試。"
pubDate: 2026-08-13
updatedDate: 2026-08-24
tldr:
  - "SWE-Bench ProMax 將 coding-agent 評估從 Python 為主的 bug fix，推向 7 種語言與平均 11.4 個 source files 的大型重構。"
  - "在論文的固定 scaffold、300 steps 與每題 $10 上限下，OpenHands + GPT-5.2 的 resolve rate 最高為 41.2%；但 scaffold effect、語言切片與成本差異比單一總分更值得讀。"
  - "資料集與 eval metadata 截至 2026-08-13 可由 Hugging Face 取得；論文沒有提供已驗證的官方 scaffold／checkpoint reproduction path，語言分布與 repository concentration 也限制了泛化解讀。"
audience:
  - "設計 coding-agent benchmark、長程 software engineering agent 或 multi-repo evaluation 的 AI 工程師"
  - "需要判斷 agent 是真正完成 cross-file refactor，還是只找到測試附近的局部修補的工程團隊"
tags: ["Paper Reading", "Agent Systems", "Evaluation", "Software Engineering", "Benchmark"]
image: "/paperReading/22-swe-bench-promax/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "SWE-Bench ProMax: Benchmarking Agents on Large-Scale Multilingual Code Refactoring"
  authors:
    - "Yuling Shi"
    - "Jinghan Xu"
    - "Kelin Fu"
    - "Wenhao Zeng"
    - "Shilin He"
    - "Lei Zhang"
    - "Yue Liu"
    - "Zelin Zhao"
    - "Terry Yue Zhuo"
    - "Jialun Cao"
    - "Siyu Ye"
    - "Tianyu Liu"
    - "Kai Cai"
    - "Shing-Chi Cheung"
    - "Xiaodong Gu"
  year: 2026
  venue: "arXiv 2608.09802 v1 (2026-08-10; source-version metadata; COLM 2026 accepted-list title differs)"
  links:
    pdf: "https://arxiv.org/pdf/2608.09802v1"
    arxiv: "https://arxiv.org/abs/2608.09802"
    project: "https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax"
---

## 90 秒掌握論文 / The paper in 90 seconds

- **問題**：既有 coding-agent benchmark 多半以 Python、單一 issue 或 bug fix 為中心；agent 可能修好可見測試，卻漏掉跨檔案的呼叫點、設定、文件與測試。這無法回答「它能否完成大型、行為保持的重構」這個更接近真實維護工作的問題。
- **核心設計**：從 GitHub 的 refactoring commits 挖掘候選，經 Docker 環境驗證、專家與 LLM 輔助標註、人工複核，最後保留 170 個任務，涵蓋 Python、Java、TypeScript、Go、C、C++、Rust 七種語言。
- **最強結果**：在論文固定的 mini-SWE-agent 與 OpenHands scaffold、每題最多 300 steps／$10 的設定下，OpenHands + GPT-5.2 的 resolve rate 為 41.2%，但同一模型在 mini-SWE-agent 只有 21.8%。這首先是 scaffold 與 agent loop 的結果，不是單純的模型排行榜。
- **主要邊界**：resolve 是「所有測試通過」的 binary outcome，不評估 patch 的可維護性、未被測試的行為、review 品質或 action trace。TypeScript 任務集中在兩個 repository、其中 Angular 有 25 題；跨語言比較不能當作獨立且均衡的語言難度實驗。

我的 bounded verdict 是：**SWE-Bench ProMax 把「大型 refactor 是否完整」變成更有壓力的終態測試，並清楚暴露跨檔案協作仍是瓶頸；但 41.2% 不能單獨代表 agent 的通用 software-engineering 能力，也不能替生產環境的 review、權限與回滾流程背書。**

> **花花的工程提醒**
>
> 看到 benchmark headline 時，先問它測的是模型、scaffold、測試集合，還是三者的乘積。這篇最有用的訊號不是「誰第一」，而是同一模型換 scaffold 後結果可以翻倍，且 agent 修改的檔案數通常仍小於 gold patch。

## 版本與閱讀範圍 / Version and reading scope

本文閱讀的是 [arXiv:2608.09802 v1](https://arxiv.org/abs/2608.09802)，提交日期為 2026-08-10，紙本標題是 *SWE-Bench ProMax*，作者名單為 15 人。這個版本的 PDF 頁尾寫有「Published as a conference paper at COLM 2026」，但 [COLM 2026 accepted papers](https://colmweb.org/AcceptedPapers.html) 將相關題目列為 *SWE-Cascade: Benchmarking Agents on Large-Scale Multilingual Code Refactoring*，並列出多一位作者 Yingwei Ma；作者頁面也使用 SWE-Cascade 這個名稱。由於接受清單沒有提供可直接對應的 OpenReview 或 PDF 連結，本文保留 arXiv v1 的 paper metadata，不推論兩個版本已完全對齊。

這個版本註記不是枝節。若把 SWE-Bench ProMax、SWE-Cascade、作者名單與結果表無條件合併，讀者就無法知道哪一組 numbers、artifact 與 claim 是本文實際核對過的來源。

## 先建立地圖 / What to know first

一個 coding-agent benchmark 至少有四個層次：**任務本身**、**測試與判定器**、**agent scaffold**、以及**模型與執行預算**。換一個 scaffold，可能改變工具呼叫、context 管理、回合終止與測試執行方式；換一個模型，則改變規劃、編輯與錯誤修復能力。SWE-Bench ProMax 的實驗把這些層次固定或交叉比較，正好讓我們看到它們不是同一件事。

它也適合和 Bloss0m 的 [OSWorld agent evaluation](/paper-reading/08-osreward-agent-evaluation)、[ContextWeave workflow benchmark](/paper-reading/09-contextweave-workflow-benchmark)、[Agent Trajectory Sentinel](/paper-reading/14-agent-trajectory-sentinel) 與 [ADIAS issue-centric optimization](/paper-reading/20-adias-issue-centric-agent-optimization) 對讀：前者幫助理解終態與 trajectory 評估的差異，後者則提醒 benchmark 結果還要放回 issue scope、可觀測性與 feedback loop 中。

## 為什麼既有測試不夠 / Why existing benchmarks are insufficient

傳統 bug-fix task 可以把成功條件壓縮成「某個 regression test 由 fail 變 pass」。但重構通常有更大的 blast radius：重新命名或搬移 API、改變 interface、更新多個呼叫端、同步設定與文件，還要保持既有行為。只跑離 issue 最近的測試，可能讓局部 patch 看起來成功，卻沒有完成整個 migration。

論文因此將任務定義成 outcome-driven：agent 從 pre-refactor commit 與自然語言 issue 開始，在預配置 Docker 中編輯 repository；最後只有在完整 test suite 全部通過時才算 resolve。它不要求 agent 重現 gold patch 的每個動作，也不直接把操作 trace 當作 success。這讓指標很清楚，但也把 benchmark 的有效性高度繫於測試集合。

這個「放大」不是修辭。論文 Figure 1 把 ProMax 和既有 benchmark 的修改規模放在同一個分布裡：ProMax 有 30% 的 instance 需要修改超過 10 個檔案、32% 超過 200 LOC；相對地，SWE-bench Verified 有 86% 的 instance 只改一個檔案。這代表它把評估單位從「局部修補是否通過」推向「一組變更是否在 repository 裡保持一致」，但不代表只要檔案數更多就一定更接近所有真實工作。

![SWE-Bench ProMax Figure 1：不同 benchmark 的修改檔案數與程式碼行數分布。](https://arxiv.org/html/2608.09802v1/breakdown_side_by_side.svg)

*Figure 1，論文 Section 1 的規模比較：左圖是每個 instance 的 modified files，右圖是 modified lines of code。[原始 Figure 1 anchor](https://arxiv.org/html/2608.09802v1#S1.F1)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2608.09802v1/breakdown_side_by_side.svg)。arXiv source 標示 CC BY 4.0；本文保留來源與 attribution，依 [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/) 使用。*

## 核心直覺 / Core intuition

SWE-Bench ProMax 的直覺可以濃縮成一句話：**把一個 refactor 的「範圍」放大到跨檔案、跨模組與跨語言，再用完整測試逼 agent 對最後狀態負責。**

資料建立分成三段：

1. **Automated collection**：從符合 star、license 與 primary-language 條件的 GitHub repository 找出 2025 年 1 月後、commit message 含 `refactor` 但不含 `bug fix`，且同時修改 test 與 non-test files 的候選。
2. **Environment validation**：在 Docker 中檢查 pre-refactor commit 與 gold patch 是否能正常建立與執行測試；環境或 gold test 失敗的候選被丟棄。
3. **Expert and LLM-assisted filtering**：分析 commit 的 refactoring scope、重寫自然語言問題描述、做品質篩選與人工驗證，從 29,782 個初始候選收斂到 170 題。

這種 pipeline 的價值不只在數量。它把「一個 commit 看起來像 refactor」與「真的能成為可評估的 agent task」分開；代價則是資料生成規則、人工判斷與測試品質都會進入 benchmark 的 measurement model。

![SWE-Bench ProMax Figure 3：從候選收集、環境驗證到專家篩選的資料建構流程。](https://arxiv.org/html/2608.09802v1/data_collection.png)

*Figure 3，論文 Section 3.2 的 data collection and curation pipeline：29,782 個初始候選不是直接變成 benchmark，而是先經過 Docker／gold patch 驗證，再做複雜度篩選、問題重寫、測試檢查與人工複核，最後留下 170 題。[原始 Figure 3 anchor](https://arxiv.org/html/2608.09802v1#S3.F3)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2608.09802v1/data_collection.png)。arXiv source 標示 CC BY 4.0；本文保留來源與 attribution，依 [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/) 使用。*

## 用一個任務走完整個流程 / Walk one task through the benchmark

下面是依論文 Sections 3–4 與 Appendix C 的 faithful walkthrough，不是把某個 instance 的私有細節補寫成新結果：

1. **Input**：給 agent 一個 repository 的 pre-refactor commit、自然語言 issue、預配置 Docker、完整測試與 gold patch 作為參照答案。
2. **Planning and edits**：agent 讀 code、搜尋 symbol、修改多個 source／test／config files，並在最多 300 steps 與每題 $10 的限制內反覆跑測試。
3. **判定**：系統只看最後 repository 是否通過全部 tests；成功記為 resolve，失敗記為 unresolved。它不要求 diff 等於 gold patch，也不因「看起來找到核心檔案」而給部分分。
4. **典型成功**：agent 不只改定義所在檔案，還找到所有 call sites、更新型別／介面、同步測試與必要文件，最後讓完整 suite 通過。
5. **典型失敗**：agent 修改了 gold patch 的核心區域，但漏掉 peripheral call sites、設定、文件或測試，於是修改檔案數小於 gold patch；Figure 5 將這類 incomplete refactoring 視為主要失敗模式。

這個 walkthrough 顯示 benchmark 真正在測的是 **global consistency under a bounded execution loop**，不是「模型能不能產生一段像樣的 code」。

## 資料與任務結構 / Dataset and task construction

最終資料集有 170 題、70 個 repository，語言分布如下：

| 語言 | 任務數 | repository 數 | gold patch 平均檔案數 | gold patch 平均 LOC |
| --- | ---: | ---: | ---: | ---: |
| Python | 29 | 18 | 10.6 | 299.8 |
| Java | 26 | 11 | 20.8 | 309.8 |
| TypeScript | 28 | 2 | 11.9 | 122.6 |
| Go | 23 | 16 | 16.0 | 227.4 |
| C | 20 | 9 | 17.9 | 424.1 |
| C++ | 22 | 9 | 21.4 | 196.3 |
| Rust | 22 | 5 | 14.5 | 284.8 |

整體 gold source patch 平均修改 11.4 個檔案、261.6 LOC、8,179.5 tokens；最大值為 182 files、4,503 LOC、72,623 tokens。加上 test patch 後，一題平均 15.9 個檔案。資料檔與 evaluation metadata 截至 2026-08-13 可在 [Hugging Face dataset endpoint](https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax) 取得；它不是只有一張 leaderboard，而是含 `swe-bench-promax.json` 與 `eval.json` 的 public dataset。

任務的 multi-label analysis 也很值得注意：Cleanup 佔 66.5%、API Interface Change 65.3%、New Feature 43.5%、Bug Fix 41.2%，且 46.5% 的 instance 橫跨至少三種 category。99.4% 被標為需要 cross-file reasoning，98.8% 涉及 API semantics。這說明「refactoring benchmark」實際上包含複合型 maintenance work，而不是純粹的 rename。

論文 Appendix B 的 Figure 9 把這個結構再拆成 required skills：99.4% 需要 cross-file reasoning、98.8% 需要 API semantics、97.1% 需要 interface contract reasoning，91.8% 需要 pattern matching。這些比例是作者用 Claude Sonnet 4.6 做的 multi-label analysis，不是 resolve 的必要條件，也不是獨立人工標註的能力測驗；它比較適合拿來描述任務設計的意圖，而不是證明 agent 真的使用了某種 reasoning。

![SWE-Bench ProMax Figure 9：各 instance 被標註的 required reasoning skills。](https://arxiv.org/html/2608.09802v1/reasoning_abilities.svg)

*Figure 9，論文 Appendix B section「Required skills」的 task-skill 分布：cross-file reasoning、API semantics、interface contracts 與 pattern matching 幾乎涵蓋整個集合。[原始 Figure 9 anchor](https://arxiv.org/html/2608.09802v1#A2.F9)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2608.09802v1/reasoning_abilities.svg)。分類由 Claude Sonnet 4.6 輔助，僅供分析；arXiv source 標示 CC BY 4.0，本文依 [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/) 使用並保留 attribution。*

## 方法骨架 / Evaluation mechanism

### 1. Resolve rate：嚴格但扁平的終態指標

對 instance $i$，一次執行的 outcome 可以寫成：

$$r_i = \mathbb{I}[\text{all tests pass after the agent stops}]$$

整個 benchmark 的 resolve rate 是：

$$\text{ResolveRate}=\frac{1}{N}\sum_{i=1}^{N}r_i$$

這個指標的好處是可重複、容易比較，而且不必把 gold patch 當成唯一正解。它的缺點也同樣清楚：一個只差一個 peripheral call site 的 patch 與完全沒有進展的 patch 都是 0；測試沒有覆蓋到的行為不會被看見；agent 的中間推理與風險管理也不進分數。

### 2. 兩個 scaffold 與相同預算

論文使用 mini-SWE-agent 與 OpenHands 兩個 scaffold，讓六個 frontier／open-weight model 在相同的 300-step、$10-per-instance 上限與 Docker 環境下執行。比較的不是一個抽象的「model score」，而是：

$$\text{Outcome}=f(\text{model},\text{scaffold},\text{task},\text{tests},\text{budget})$$

因此，scaffold interaction 是結果的一部分，不是實驗噪音。GPT-5.2 從 mini-SWE-agent 的 21.8% 升到 OpenHands 的 41.2%；Gemini-3-Pro 卻從 26.5% 降到 19.4%。這種方向相反的變化正是不能只看模型名次的理由。

### 3. Cost 與 steps 是輔助訊號

論文同時回報平均 steps 與 API cost，讓我們觀察 agent 是否用更多探索換來成功。但 cost 是論文測得的 model/API usage，不是完整 infrastructure TCO；steps 也不是 productivity 的同義詞。Qwen3.5 在兩個 scaffold 都用了很多 steps，卻沒有最高 resolve rate，表示長時間探索可能是無效迴圈，而非更深的 reasoning。

## 如何讀結果 / How to read the evidence

### Table 3：第一名其實是 model–scaffold pair

| Scaffold | Model | Resolve rate | 平均 steps | 平均 cost |
| --- | --- | ---: | ---: | ---: |
| mini-SWE-agent | Claude Sonnet 4.6 | 30.6% | 99.5 | $2.32 |
| mini-SWE-agent | GPT-5.2 | 21.8% | 25.2 | $0.19 |
| OpenHands | Claude Sonnet 4.6 | 38.8% | 117.9 | $4.77 |
| OpenHands | GPT-5.2 | **41.2%** | 115.1 | $3.60 |
| OpenHands | GLM-5 | 36.5% | 114.2 | $0.24 |
| OpenHands | Qwen3.5 | 36.5% | 141.2 | $0.78 |

41.2% 是 OpenHands + GPT-5.2 在這個 protocol 下的最高值，不是「GPT-5.2 的通用 SWE 能力」。同樣值得注意的是 GLM-5 在 36.5% 時平均 cost 為 $0.24，約為 Claude Sonnet 4.6 的二十分之一；這是 benchmark API cost 的效率訊號，不是企業導入後的 total cost 保證。

### 語言切片：沒有一個 model 通吃

OpenHands 下，不同 model 在各語言的最高值分散：GPT-5.2 在 Python 48.3%、C 75.0%；Claude 在 TypeScript 53.6%、Rust 63.6%；GLM-5 在 Java 34.6%；Kimi-K2.5 在 Go 43.5%；Qwen3.5 在 C++ 54.5%。這比較像 model training、scaffold、repository distribution 與 task pattern 的交互作用，而不是可以直接排序的「語言難度」。

TypeScript 的 28 題來自 2 個 repository，其中 Angular 有 25 題；Go 有 23 題但來自 16 個 repositories。於是 TypeScript 的分數更容易受到單一生態系與 project convention 影響。這是 sampling boundary，不是資料集的瑕疵；但解讀時必須說出來。

### Figure 5：agent 常找到核心，卻沒有完成全域遷移

![SWE-Bench ProMax Figure 5：agent 修改檔案數與 gold patch 的差距，以及成功／失敗執行的 interaction rounds。](https://arxiv.org/html/2608.09802v1/failure_analysis_cdf.svg)

*Figure 5，論文 Section 5.2 的 agent behavior analysis：左圖比較 Claude Sonnet 4.6、Kimi-K2.5 與 gold patch 的 modified-file CDF；右圖比較 resolved 與 unresolved runs 的 interaction-round CDF。[原始 Figure 5 anchor](https://arxiv.org/html/2608.09802v1#S5.F5)；圖片取自 [arXiv HTML figure endpoint](https://arxiv.org/html/2608.09802v1/failure_analysis_cdf.svg)。arXiv source 標示 CC BY 4.0；本文保留來源與 attribution，依 [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/) 使用。*

論文 Figure 5 的左圖比較 agent 與 gold patch 修改的檔案數：agent 通常修改較少，且 gold patch 越大，差距越寬。這個 pattern 支持 incomplete refactoring 是主要 failure mode——agent 找到主要定義或測試附近的核心，但沒有追完 peripheral call sites、文件、設定與跨模組依賴。

右圖顯示 pass curve 早且陡，fail curve 較晚且平；失敗案例使用更多 rounds，常出現 edit–revert–reread 循環。這不代表「多想幾步」沒用，而是提醒我們需要把 search coverage、未完成的 migration surface 與停損原因做成 trajectory telemetry，而不是只提高 step limit。

### 成本與步數：更多不是更好

在 OpenHands 結果裡，Qwen3.5 平均 141.2 steps，仍為 36.5%；Claude 平均 117.9 steps 為 38.8%；GPT-5.2 平均 115.1 steps 卻達 41.2%。mini-SWE-agent 也有類似訊號：Qwen3.5 平均 155.4 steps、resolve rate 20.6%，GPT-5.2 只用 25.2 steps、卻有 21.8%。

這裡比較合理的解讀是：step budget 是 opportunity，不是 quality。真正的工程問題是如何在檔案圖、測試失敗與修復信號之間更快縮小搜尋空間。

## 證據地圖 / Evidence map

- **論文直接支持**：170 題、7 語言、70 repositories 的構成；Table 2 的 patch size；Table 3 的 model/scaffold resolve rate、steps 與 cost；Figure 5 的檔案覆蓋與失敗行為；Appendix A 的 repository／license 統計。
- **作者的分析解讀**：長程 cross-file coordination 是主要瓶頸；agent 常能找到核心變更但漏掉 peripheral surface；benchmark 能補足 Python-centric、短程 bug-fix evaluation 的壓力。
- **本文的工程推論**：coding-agent evaluation 應把 scaffold、測試覆蓋、repository concentration 與 change-surface coverage 一起記錄；單一 pass rate 不足以定位「為什麼失敗」。
- **尚未被證明**：結果不能推出 agent 在未見過的 enterprise repository、沒有完整測試的 codebase、需要 human review 的 production migration，或不同成本與 GPU 設定下仍保持同樣排名。

## 限制與不該過度解讀 / Limitations and unsupported interpretations

第一，這是從 public GitHub history 挖掘而來的 benchmark。它的 commit selection、排除規則、人工重寫與 test validation 會塑造任務分布；論文提供了 29,782 到 170 的篩選流程，但這不等於所有真實 refactor 的代表性抽樣。

第二，test-passing 是必要條件，不是完整正確性的同義詞。若 gold patch 的測試沒有涵蓋 documentation、migration script、performance、security 或 backward compatibility，resolve 仍可能高估 patch 品質；反過來，環境或 flaky test 也可能讓正確方向的 patch 得 0 分。

第三，語言切片不均衡，且 repository concentration 明顯。尤其 TypeScript 的 Angular concentration 使它不適合被讀成跨語言統計檢定；Appendix 的分類也使用 Claude Sonnet 4.6 做 LLM-assisted analysis，這些 labels 是研究分析，不是 benchmark instance 的成功條件。

第四，300 steps 與 $10 cap 是合理的可比較 protocol，卻也構成 external-validity boundary。企業 agent 可能使用不同工具、parallel workers、編譯 cache、私有 code search、人工 checkpoint 或更長的 time budget；本篇結果不能直接外推到那些設定。

因此，SWE-Bench ProMax **尚未證明**：agent 已經能可靠完成任意大型重構、pass rate 等於可 merge、cost 等於 TCO、或某模型在所有語言與 repository family 都更好。

## Artifact 狀態與可重現性 / Artifacts and reproducibility

截至 2026-08-13，我檢查到 [Hugging Face dataset](https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax) 是 public endpoint，revision 為 `86fce26c694c5c362efd6bf116bee142b447b578`；README、`swe-bench-promax.json` 與 `eval.json` 可直接取得。dataset card 暴露 test split、170 題與 7 種語言，`eval.json` 也包含每個 instance 的 evaluation script metadata。這代表 **資料與 evaluation metadata 可取得**，截至日期如此。

但 paper 與 dataset card 沒有提供一條我能驗證的官方 model checkpoint／scaffold code path，讓外部讀者從乾淨環境完整重跑兩個 scaffold 的全部 Table 3 結果。資料集的 Hugging Face metadata 也沒有宣告獨立 dataset license；論文則說明來源 repository 的 open-source license 條件。於是本文把狀態拆成：

- **可用**：paper v1、public dataset endpoint、README、主要 JSON 與 eval metadata。
- **未確認**：完整 scaffold commit、模型 checkpoint、執行映像、prompt／tool version、所有 cost 計算設定與一鍵重現結果。
- **工程注意**：要在企業內部使用，還要逐一核對來源 repository license、是否允許再分發，以及 Docker 中的 build／network／secret policy。

最小 reproduction 應先鎖定 dataset revision，選一個語言與少量 instance，固定 model、scaffold、step/cost cap，保存 patch、完整 test log、modified-file count、step trace 與 cost record，再與 paper 的 resolve rule 對齊。不要把「能下載 JSON」誤稱為 end-to-end reproducibility。

## 工程判斷與不適用條件 / Engineering decision and when not to use it

**適合拿來做什麼**：

- 當團隊要測的是大型 API migration、cross-file refactor、multi-language repository maintenance，而不是單一函式修 bug。
- 當你能保存完整 test result、modified-file surface、失敗原因、步數與成本，並把 resolve rate 與 patch review 分開。
- 當你要比較「模型 × scaffold × budget」的交互作用，為 agent infrastructure 選擇工作流，而不是只做 model leaderboard。

**不適合直接拿來保證什麼**：

- 不要把 pass rate 當成可 merge rate；production 還需要 human review、security／license scanning、migration rehearsal、rollback 與未被測試行為的檢查。
- 不要把語言切片的第一名當成語言能力排名；先看 repository concentration、task category 與 sample size。
- 不要把 benchmark cost 當成部署 TCO；加入編譯、容器、平行 worker、cache、失敗重跑與人工介入成本。

如果要把這篇 benchmark 變成內部 gate，我會加上三個 companion metrics：**change-surface recall**（agent 覆蓋多少 gold／reviewer 標記的必要檔案）、**test-gap review**（通過測試後仍有多少未驗證行為）、以及 **recovery efficiency**（從第一次失敗到找到遺漏 call site 的 steps／cost）。這些不是 paper 已報告的數字，而是把它揭露的 failure mode 轉成可操作的工程觀測。

## 讀完後的三個記憶點 / Three things to remember

1. **問題變了**：SWE-Bench ProMax 不只問「agent 能不能修一個 bug」，而是問「它能不能在多語言 codebase 中完成一個需要跨檔案協作的最後狀態」。
2. **headline 要拆開讀**：41.2% 是 OpenHands + GPT-5.2 的 pair result；scaffold effect、語言／repository 分布與 cost／steps 才告訴你這個 number 為何成立。
3. **真正的瓶頸是 coverage**：agent 往往找到 refactor 的核心，卻漏掉 peripheral surface。下一代 benchmark 與 production telemetry 都應追蹤「改了哪些檔案、還缺哪些檔案、為什麼停止」。

## Primary sources

- [SWE-Bench ProMax full arXiv HTML（v1，2026-08-10）](https://arxiv.org/html/2608.09802v1)
- [SWE-Bench ProMax arXiv abstract and version record](https://arxiv.org/abs/2608.09802)
- [SWE-Bench ProMax paper PDF](https://arxiv.org/pdf/2608.09802v1)
- [SWE-Bench ProMax Hugging Face dataset](https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax)
- [SWE-Bench ProMax dataset README](https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax/raw/main/README.md)
- [COLM 2026 accepted papers（title/version discrepancy reference）](https://colmweb.org/AcceptedPapers.html)
