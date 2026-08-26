---
title: "MidTool：把工具使用提前放進 mid-training，Agent 真的會更可靠嗎？"
description: "深讀 MidTool：用 20.3B-token、11.22M-sample 的工具使用語料，把 schema grounding、工作流組合與不完整資訊下的恢復能力提前教給模型；但 web-search 仍是 0%。"
pubDate: 2026-08-24
updatedDate: 2026-08-24
tldr:
  - "MidTool-Mix 把 web、PDF、code 與 API／MCP 工具軌跡組成 20.3B tokens、11.22M samples 的 mid-training mixture，針對 grounding 與 execution 兩種缺口各做一條資料合成分支。"
  - "在論文固定的 Qwen3-4B + SFT 設定，MidTool-Mix 讓 BFCLv3 overall 從 39.73% 升到 50.25%、\\tau^{2}-Bench Pass@4 從 20.50% 升到 28.06%、MCP-Universe pass 從 1.68% 升到 5.03%。"
  - "這不是『工具使用已經解決』：MCP-Universe 的 web-search 子集仍為 0.00%，而且資料大量由模型合成、資料集與模型受 gated access／上游條款約束。"
audience:
  - "設計 tool-use mid-training、function calling、MCP agent 或長回合互動評測的 AI 工程師"
  - "需要判斷 agent 是真的學會工具邊界與工作流，還是只在固定工具與短回合資料上記住格式的研究者與工程團隊"
tags: ["Paper Reading", "Agent Systems", "Tool Use", "MCP", "Training"]
image: "/paperReading/23-midtool-agentic-tool-use/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - tool-use-coding-agents
paper:
  title: "MidTool: Mid-training Data Synthesis for Agentic Tool Use"
  authors:
    - "Fengqing Jiang"
    - "Yite Wang"
    - "Boyi Liu"
    - "Zhaoyang Wang"
    - "Canwen Xu"
    - "Zhewei Yao"
    - "Radha Poovendran"
    - "Yuxiong He"
  year: 2026
  venue: "arXiv 2608.20314 v1 (2026-08-20)"
  links:
    pdf: "https://arxiv.org/pdf/2608.20314v1"
    arxiv: "https://arxiv.org/abs/2608.20314"
    project: "https://huggingface.co/datasets/MidTool/MidTool-Mix"
---

## 90 秒掌握論文 / The paper in 90 seconds

- **問題**：工具使用不只是把函式名稱與 JSON argument 填對。Agent 還要從文件、schema、程式碼與不完整對話中辨認工具 affordance，決定何時呼叫、如何串接多個工具，以及缺資料時如何追問或恢復。MidTool 問的是：這些能力能不能在 post-training 之前，就透過專門的 mid-training 建立較強的先驗？
- **資料設計**：論文提出 MidTool pipeline，收集 web、PDF、code 與結構化工具 artifact，最後組成 20.3B tokens、11.22M samples 的 MidTool-Mix。它用 context-grounded trajectory augmentation 教 grounding，再用 native agentic trajectory synthesis 教 execution。
- **主要結果**：在 Qwen3-4B-Base、固定 100K TOUCAN SFT 的比較中，加入 MidTool-Mix 後 BFCLv3 overall 為 50.25%（無 mid-training 為 39.73%）、\\tau^{2}-Bench Pass@4 為 28.06%（20.50%）、MCP-Universe pass 為 5.03%（1.68%）。Qwen3-8B 也有同方向結果。
- **關鍵邊界**：MCP-Universe 的 web-search 子集仍是 0.00%。Browser automation、financial、location 有改善，不代表模型已經具備 deep-search 式的證據蒐集、反覆精煉與長程控制能力。

我的 bounded verdict 是：**MidTool 最有價值的地方，不是又多一個 agent benchmark 分數，而是把「工具使用的可遷移先驗」拆成 grounding 與 execution 兩個資料問題，並用 ablation 顯示兩者互補；但它尚未證明一般 tool-use mid-training 能自然長成 search agent。**

> **花花的工程提醒**
>
> 如果你的 agent 會呼叫工具，卻常常在最後答案沒有把工具結果說對，單純增加 function-calling examples 可能不夠。MidTool 提供的實用假說是：先讓模型在 mid-training 學會讀懂工具與工作流，再用 post-training 對齊產品需要的行為；不過最後仍要分別評估「呼叫成功」和「答案有沒有被結果支撐」。

![MidTool 論文 Figure 1：資料來源、訓練流程與 MCP-Universe 結果的總覽。](/paperReading/23-midtool-agentic-tool-use/paper/figure-1-teaser.webp)

*Figure 1，論文 teaser：左側是 web、PDF、tool、code 與 agentic trajectory；中間是 base model → mid-training → tool-use SFT → agentic RL；右側是作者用來說明 transfer 的 MCP-Universe 圖。這張圖是作者的 overview，不是額外的獨立 benchmark；原圖可定位到 [Figure 1](https://arxiv.org/html/2608.20314v1#S0.F1)，取自 arXiv HTML，頁面標示 CC BY 4.0。*

## 版本與閱讀範圍 / Version and reading scope

本文閱讀的是 [arXiv:2608.20314 v1](https://arxiv.org/abs/2608.20314)，提交日期為 2026-08-20，沒有把它寫成已經通過 peer review 的 conference paper。除了摘要與 PDF，我也逐段核對 [arXiv HTML 版](https://arxiv.org/html/2608.20314v1) 的資料 pipeline、Table 2–6、Appendix A–D、visual tool-use pilot 與 limitations。

截至 2026-08-24，論文摘要的 Data & Model 連結已能對應到 [MidTool 的 Hugging Face 組織頁](https://huggingface.co/MidTool)：其中有 [MidTool-Mix dataset](https://huggingface.co/datasets/MidTool/MidTool-Mix)、4B／8B mid-training checkpoint 與 RL checkpoint。這些資源不是「下載後即可無條件重現」的同義詞：dataset 需要接受 MidTool-Mix License，模型頁也要求接受 Apache-2.0 與 dataset terms；本文把它們列為可見、可申請存取的 artifact，而不是宣稱我已下載並跑完 reproduction。

## 讀者真正要回答的問題

這篇論文不是在問「把更多 tool-call trajectory 塞進 training 有沒有用」。如果只是 post-training dataset 變大，答案很容易被資料量、教師模型或評測 harness 混在一起。

比較精確的讀法是：**在 downstream SFT／RL recipe 固定時，把通用工具使用的資料提前到 mid-training，是否能讓小模型在陌生工具、長回合互動與 schema grounding 上得到可轉移的能力？**

這裡的 mid-training 是介於一般 pre-training 與 post-training 之間的一個階段。MidTool 不是把 SFT 拿掉，也不是說 RL 不重要；它的因果主張比較窄：先用專門的 tool-use mixture 改變 base model，再使用相同的 SFT／RL 配方，結果是否比沒有這一段更好。

## 證據地圖：論文報告與我的判讀

| 層次 | 本文採用的說法 |
| --- | --- |
| **論文直接支持** | 在固定 downstream recipe 的 4B／8B 實驗裡，MidTool-Mix 提升 BFCLv3、`\\tau^{2}`-Bench 與 MCP-Universe 的部分整體指標；Table 2–6 與 Appendices A–D 提供資料組成、ablation、污染檢查與 visual pilot。 |
| **作者仍未證明** | 一般 tool-use mid-training 是否能跨模型、跨訓練 budget、跨 benchmark 穩定泛化；也沒有證明它能自然產生 deep-search agent。 |
| **我的工程推論** | 把 raw、context-grounded、native-executable 資料分開記錄，並把 final-answer grounding 與 tool-call success 分開評估，會比只追一個 MCP overall score 更適合產品決策。 |

後文會把數字、作者的 claim 與 Bloss0m 的工程判讀分開；「提升」只指論文報告的 setup，不延伸成 production superiority。

## 核心直覺 / Core intuition

把 MidTool 想成在模型學會「如何回答」之前，先讓它大量閱讀工具說明、程式碼與可執行互動：模型先建立工具的 affordance map，再在 post-training 學習產品希望的語氣、權限與任務策略。若只在最後階段教 call format，模型可能會填對 JSON，卻不知道何時該呼叫、資料缺了該問什麼，或上一個工具結果如何改變下一步。

這也解釋了為什麼論文刻意把 context-grounded 與 native-executable 兩條分支分開：前者提供「從材料理解工具」的先驗，後者提供「在介面上執行工作流」的先驗。

## 走完整個方法 / End-to-end worked example

假設一份 API 文件寫著「先用 `search_orders` 取得 order id，再用 `refund_order` 退款；若缺少日期要先向使用者確認」。在 MidTool 的流程裡，文件先被品質 classifier 保留，Qwen3-235B-A22B-Instruct-2507 會抽出工具邊界、必填參數與 workflow affordance；rule-based planner 再配置一組單步 QA 與一組需要澄清日期、依序呼叫兩個工具的 trajectory。若資料進入 native branch，生成結果還要通過 turn ordering、required arguments 與 tool-response consistency 驗證。

這個例子不是論文裡某個私有 instance，而是把 Sections 2.2–2.3 的機制走一遍。模型先在 mid-training 看到這類 grounding／execution pattern，之後才用 TOUCAN SFT 與可選 RL 學會在 benchmark 或產品環境中完成任務；最後評估的不只是 JSON 是否合法，還包括多回合互動與陌生 MCP server 的 transfer。

## 為什麼 post-training 可能不夠

論文把一般 tool use 的困難拆成兩層：

1. **Grounding**：從文件、PDF、code 與 schema 中辨認工具邊界、必填欄位、參數格式與 workflow 結構。
2. **Execution**：在多回合互動中規劃與排序呼叫、遇到缺少資訊時追問、切換工具，並根據 tool response 修正下一步。

如果模型只在狹窄的示範軌跡上做 post-training，它可能學會「長得像一個 tool call」的輸出格式，卻沒有吸收散落在 developer documentation、API reference、manual、code repository 與 structured tool definition 裡的背景知識。MidTool 的策略是把這些材料先轉成一個較廣的 agentic prior，再把產品行為留給下游訓練。

這是一個合理但可被反駁的假說。最重要的實驗不是某個 headline number，而是同一個 SFT recipe 下的 no-mid-training 對照，以及把 raw data、context branch、native branch 拆開的 ablation。

## MidTool pipeline：四種來源、兩條合成分支

### Stage 1：收集互補的 raw sources

MidTool 不是只抓工具 schema。它刻意把四種訊號放在同一個 mixture：

- **Web**：從 FineWeb 的 processed Common Crawl dumps 取 2020–2025 的 API reference、developer documentation、troubleshooting、tutorial 與 CLI-style instructions。
- **PDF**：使用 FinePDFs 的英文內容，補上 manual、product handbook 與較長的 procedural documentation。
- **Code**：從 GitHub event data 發現 agent／MCP repositories，再加入具有 community signal 的公開 repositories；保留 libraries、SDKs、frameworks、examples 與 documentation-like paths，並排除 benchmark／dataset repository 以降低 leakage risk。
- **Structured tool artifacts**：收集 REST API 與 MCP skills，直接取得 executable schema、parameter structure 與 tool boundary，供後面的 native trajectory synthesis 使用。

這四種來源各自補不同缺口：web／PDF 給 breadth 與 procedural context，code 提供可執行的 interface pattern，tool artifact 則提供最接近真正呼叫的 schema。它們不是同一種資料的四個 mirror。

### Stage 2：source-specific filtering 與 deduplication

Code 會排除 binary、model weights、logs 等低訊號檔案，並用 line count、平均／最大行長、alpha ratio 等 heuristic 過濾，再以 SHA-256 與 MinHash LSH 做 exact／near-duplicate removal。最後，對高品質 repository 優先保留 `docs`、`examples`、`tutorials`、`guides`、`samples`、`cookbook` 等 documentation-like directories。

Web 與 PDF 則走四階段流程：high-recall keyword／URL prescreening、以 LLM-labeled seed data 訓練的 fastText classifier、document-level quality filtering，以及 MinHash LSH deduplication。這讓資料比較偏向 developer-facing technical material，也讓讀者知道 mixture 的品質依賴一串 classifier 與 heuristic，而不是人工讀完所有文件。

### Stage 3：把材料變成 supervision

MidTool 有兩條彼此互補的合成分支。

**Context-grounded trajectory augmentation** 從 web／PDF／code 文件出發。先用 Qwen3-235B-A22B-Instruct-2507 評估文件品質並建立 affordance profile，再由 rule-based planner 按文件品質配置 bounded budget，產生 tool selection、schema-grounded parameter extraction、format-constrained call、workflow recognition、parallel use、clarification 與 long-context reasoning 等 QA／trajectory。只有通過 parsing 與 semantic quality control 的資料才進入 mix。

**Native agentic trajectory synthesis** 從 REST API 與 MCP skills 的 executable interface 出發。它先建立 tool inventory、解析 definition、整理 canonical schema，再由品質與可行性 profile 決定 single-call、multiple／parallel tool use 與 information-missing trajectory 的配置。生成後嚴格檢查 turn ordering、schema grounding、required arguments 與 tool-response consistency；失敗的生成會帶著 quality-control feedback retry，仍不合格就丟棄。這條分支另外混入 AWM rollout 與 filtered Nemotron Agentic traces。

兩條分支的差異可以這樣記：**context branch 教模型從亂的資料中找出工具；native branch 教模型在可執行介面上把工具用起來。**

![MidTool 論文 Figure 2：從四類資料、預處理到兩條 agentic trajectory synthesis 分支的 pipeline。](/paperReading/23-midtool-agentic-tool-use/paper/figure-2-pipeline.webp)

*Figure 2，論文 Section 2 的完整 pipeline。注意 Stage 3 並不是把所有文件直接變成成功示範：context-grounded branch 先建立 profile／plan，native branch 先整理可執行 schema，再對生成 trajectory 做結構與 response consistency 檢查。原圖可定位到 [Figure 2](https://arxiv.org/html/2608.20314v1#S2.F2)，取自 arXiv HTML，頁面標示 CC BY 4.0。*

### 這個 pipeline 真正多做了什麼

把 Figure 2 展開，可以看到 MidTool 的 novelty 不在「使用一個大模型生資料」這件事本身，而在於把資料生成拆成幾個可檢查的介面：

1. **來源層**決定模型看到的是文件語境、程式碼 pattern，還是能直接解析的 tool schema。
2. **品質層**把 keyword／URL 高 recall、fastText、LLM annotation、deduplication 與 source-specific filtering 串起來；不同來源不共用一個粗糙的 filter。
3. **計畫層**先產生 affordance profile 與 trajectory plan，再依文件／tool source 的品質、工具數與 argument structure 配置數量，避免大量複製 trivial single-call sample。
4. **驗證層**在資料進入 training mix 前檢查 turn order、required argument、schema grounding、tool response consistency；不合格資料 retry 後仍會丟棄。

這四層讓資料 pipeline 比「prompt 一個教師模型，然後把輸出全部存下來」更容易審計；但也意味著 reproduction 必須取得 filtering threshold、planner policy、teacher prompt 與 validation code，而不是只有 dataset 名稱。

## 20.3B tokens 到底怎麼組成

論文 Table 2 的 mixture 統計如下；web／PDF／code 的斜線是 source corpus／context-grounded augmentation 的 token count：

| 子集 | Tokens | Samples | 比例 |
| --- | ---: | ---: | ---: |
| Web | 4.4B / 4.1B | 6.86M | 42% |
| PDF | 2.6B / 2.1B | 1.34M | 23% |
| Code | 3.8B / 1.5B | 2.60M | 26% |
| Native agentic trajectory | 1.8B | 0.42M | 9% |
| **Total** | **20.3B** | **11.22M** | **100%** |

這裡有一個容易忽略的重點：native trajectory 只佔 9%，但它不是「資料少所以不重要」。MidTool 的主張是，廣泛的 raw／context data 先提供 grounding，少量但經過 executable validation 的 native trajectories 補上 execution；後面的 branch ablation 正是用來檢查這個分工。

Appendix 的 inventory analysis 顯示，混合資料含有約 2.60M 個 unique tool names，並有 37.2% 的 domain long tail（依論文的 keyword categorization）。這說明作者想擴大工具表面，但不代表每個 tool name 都對應一個可直接下載、可永久呼叫的 production endpoint。

![MidTool 論文 Figure 3：MidTool-Mix、FineWeb 與 Dolmino 的 t-SNE 分布。](/paperReading/23-midtool-agentic-tool-use/paper/figure-3-tsne.webp)

*Figure 3，論文 Appendix A.4 的 t-SNE visualization：MidTool-Mix 與 FineWeb／Dolmino 有部分重疊，也有明顯的獨立區域。這是 embedding space 的定性分布圖，不是能力提升的因果證據；原圖可定位到 [Figure 3](https://arxiv.org/html/2608.20314v1#S2.F3)，取自 arXiv HTML，頁面標示 CC BY 4.0。*

Figure 3 的正確讀法不是「點分得越開，模型就越強」。作者取樣 2K examples、用 Arctic-Embed-2.0-L 做 embedding，再把 MidTool-Mix 和 FineWeb／Dolmino 放在同一個 t-SNE 空間裡。圖中 MidTool-Mix 同時保留廣泛 web data 的重疊，又出現 documentation-heavy、workflow-oriented、agentic tool-use 的獨立區域；這支持「它不只是把一般 pre-training data 換個名字」的資料分布說法，但不單獨證明 downstream transfer。

## 實驗怎麼隔離 mid-training 的效果

作者使用 Qwen3-4B-Base 與 Qwen3-8B-Base，先做 MidTool-Mix mid-training，再套用相同的 downstream recipe。SFT 使用 TOUCAN 的 100K tool-use subset；mid-training 與 SFT 以 ArcticTraining 在 32 張 H200 上進行。可選的 RL 使用 AWM 的 526 個 synthetic tool-use environments，在 8 張 B200 上訓練。

評測故意涵蓋三種不同壓力：

- [BFCLv3](https://arxiv.org/html/2608.20314v1#S3)：看 single-turn、multi-turn、schema／argument grounding 與 hallucination。
- `\\tau^{2}`-Bench：在 airline、retail、telecom 等 verticals 觀察 interactive task completion、multi-step execution 與 recovery。
- [MCP-Universe](https://arxiv.org/html/2608.20314v1#S3)：在 browser automation、finance、location、web search 等真實 MCP servers 上測陌生工具的 transfer。

這個 setup 的可取之處是 downstream SFT／RL 配方固定；限制則是 mid-training 本身仍涉及資料、教師模型、compute 與訓練 recipe 的共同選擇，不能只把差異簡化成「多看了 20.3B tokens」。

### 訓練細節：不是一句「mid-train」就結束

Appendix B 的設定把 intervention 具體化：mid-training 使用 1 epoch、最大 sequence length 8192、4M global token batch；SFT 的最大 sequence length 為 32768。RL 使用 64 steps、每步 16 rollouts、最多 20 turns。這些數字很重要，因為長 context、trajectory horizon 與每步 rollout 數會改變工具使用任務的難度與成本；若 reproduction 改掉它們，結果就不能直接和 Table 3–6 對齊。

作者也關掉 thinking mode 來對齊設定，並把同一份 downstream post-training recipe 套在 raw base 與 MidTool-Mix mid-trained base 上。這種設計讓 comparison 比較乾淨，但它仍沒有回答：更長的 mid-training 是否只是在用更多 compute 買分數，或不同 model family 是否需要不同的 mixture ratio。

## 結果：提升是真的，但要看哪一種工具能力

下面先固定在最容易讀的 Qwen3-4B-Base + SFT 設定，數字取自論文 Table 3–5；比較的是同一 base model 有沒有先做 MidTool-Mix mid-training。

| 評測 | No mid-training | + MidTool-Mix | 差異 |
| --- | ---: | ---: | ---: |
| BFCLv3 overall | 39.73% | 50.25% | +10.52 pp |
| `\\tau^{2}`-Bench overall Pass@4 | 20.50% | 28.06% | +7.56 pp |
| MCP-Universe overall pass | 1.68% | 5.03% | +3.35 pp |

BFCL 的提升不只來自 single-turn。multi-turn average 從 15.50% 到 26.63%，代表在 missing function、missing parameter 與 long-context 等子集，mid-training 可能真的補到一些較難由狹窄 SFT 穩定誘導的能力。加入 RL 後 4B 的 BFCL overall 進一步到 54.18%，但這是「mid-training + RL」的結果，不應拿來宣稱 mid-training 單獨造成全部提升。

8B 也呈現同方向：SFT-only 的 BFCL overall 是 47.62%，加上 MidTool-Mix 後是 51.12%；若再加 RL，則是 55.12%。這讓「不是只有 4B 偶然有效」的解讀更有根據，但仍然是兩個 base-model scale 與固定 recipe 的實驗範圍。

| Base model | Downstream recipe | BFCLv3 overall | `\\tau^{2}`-Bench Pass@4 | MCP-Universe pass |
| --- | --- | ---: | ---: | ---: |
| Qwen3-4B-Base | SFT | 39.73% | 20.50% | 1.68% |
| Qwen3-4B-Base + MidTool-Mix | SFT | **50.25%** | **28.06%** | **5.03%** |
| Qwen3-4B-Base | SFT + RL | 39.51% | 25.54% | 2.23% |
| Qwen3-4B-Base + MidTool-Mix | SFT + RL | **54.18%** | **38.49%** | **10.06%** |
| Qwen3-8B-Base | SFT | 47.62% | 28.06% | 3.35% |
| Qwen3-8B-Base + MidTool-Mix | SFT | **51.12%** | **34.89%** | **3.91%** |
| Qwen3-8B-Base | SFT + RL | 45.79% | 38.13% | 5.03% |
| Qwen3-8B-Base + MidTool-Mix | SFT + RL | **55.12%** | **39.57%** | **9.50%** |

這張整理表把兩個容易混淆的現象放在一起：MidTool-Mix 的增益在 4B 的三個 headline metrics 都清楚，但 8B 的 MCP SFT gain 很小（3.35% → 3.91%），主要差距在 RL 之後才拉開。也就是說，「8B 也有效」成立，但「每個 benchmark、每個 training recipe 都等比例有效」不成立。

![MidTool 論文 Figure 4：相同下游 tool-use SFT corpus 上的 loss convergence。](/paperReading/23-midtool-agentic-tool-use/paper/figure-4-sft-loss.webp)

*Figure 4，論文 Appendix C.1：Qwen3-4B-Base + MidTool-Mix 從較低的 SFT loss 開始，早期收斂較快，並在大部分 training steps 維持較低 loss；這是 optimization efficiency signal，不是直接的 agent success 指標。原圖可定位到 [Figure 4](https://arxiv.org/html/2608.20314v1#A3.F4)，取自 arXiv HTML，頁面標示 CC BY 4.0。*

![MidTool 論文 Figure 5：4B 與 8B 在 RL 訓練中的平均 reward。](/paperReading/23-midtool-agentic-tool-use/paper/figure-5-rl-reward-4b.webp)

![MidTool 論文 Figure 5：8B 在 RL 訓練中的平均 reward。](/paperReading/23-midtool-agentic-tool-use/paper/figure-5-rl-reward-8b.webp)

*Figure 5，論文 Appendix C.2：MidTool-Mix 初始化的 RL reward 在早期較高、上升較快，非 mid-trained baseline 在相同 environment 後期逐步追上。這比較像「更快適應」而不是「永遠更高」；原圖可定位到 [Figure 5](https://arxiv.org/html/2608.20314v1#A3.F5)，取自 arXiv HTML，頁面標示 CC BY 4.0。*

MCP-Universe 的結果尤其有意思。4B 的 overall score／pass 從 13.20／1.68% 到 18.66／5.03%，browser automation、financial 與 location 子集多半改善；這支持它學到一些對陌生 MCP tool 可轉移的 schema／workflow prior。

可是同一張 Table 5 也寫著：**web-search 的 score 與 pass 仍是 0.00%。** 這個 failure 是論文最重要的結果之一，因為它把「general tool use」和「deep-search-style agency」分開了。搜尋任務需要持續找證據、迭代 query、判斷是否足夠、處理矛盾資訊，再把 evidence 收斂成 grounded answer；只教工具邊界與一般工作流，不會自動長出這整套控制迴路。

## Ablation：兩條分支不是可互換的裝飾

論文 Table 6 固定 Qwen3-4B-Base + SFT，只改 mid-training corpus，並與 matched-budget 的 Dolmino-20BT 比較：

- **Processed raw data only**：BFCL overall 42.30%，比 no-mid-training 多 2.6 pp；MCP pass 3.03%，多 1.4 pp。這表示文件、code 與 filtered raw sources 本身就不是零貢獻。
- **只加 native agentic trajectories**：BFCL overall 47.59%，對 function-calling precision 的提升比較強，但 `\\tau^{2}`-Bench Pass@4 12.95%、MCP pass 1.12%，不能取代完整 mixture。
- **只加 context-grounded trajectories**：BFCL overall 44.66%，`\\tau^{2}`-Bench Pass@4 21.94%；在 transfer-oriented 評測比 native-only 更穩，但 MCP pass 仍只有 1.12%。
- **完整 MidTool-Mix**：BFCL overall 50.25%、`\\tau^{2}`-Bench Pass@4 28.06%、MCP pass 5.03%，是唯一在 Table 6 的八個主要指標都比 no-mid-training 好的配置。

| Mid-training data | BFCL non-live | BFCL live | BFCL multi-turn | BFCL overall | `\\tau^{2}` Pass@1 | `\\tau^{2}` Pass@4 | MCP score | MCP pass |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| No mid-training | 59.94% | 43.75% | 15.50% | 39.73% | 8.54% | 20.50% | 13.20 | 1.68% |
| Dolmino-20BT | 61.44% | 51.74% | 16.13% | 43.10% | 7.37% | 21.22% | 5.41 | 0.00% |
| Processed raw data only | 60.40% | 52.60% | 13.90% | 42.30% | 7.30% | 21.90% | 12.20 | 3.03% |
| + native trajectories | 68.21% | 55.81% | 18.75% | 47.59% | 4.23% | 12.95% | 6.80 | 1.12% |
| + context-grounded trajectories | 62.73% | 50.26% | 21.00% | 44.66% | 8.99% | 21.94% | 8.46 | 1.12% |
| **Full MidTool-Mix** | **66.38%** | **57.74%** | **26.63%** | **50.25%** | **12.23%** | **28.06%** | **18.66** | **5.03%** |

Table 6 還有一個值得停下來看的反直覺：native-only 在 BFCL non-live 是 68.21%，甚至高於 full mixture 的 66.38%，但它在 `\\tau^{2}`-Bench Pass@4 與 MCP-Universe 反而較差。這說明「更會填 function call」與「更能在陌生環境完成多回合任務」不是同一個 objective；full mixture 的價值在於跨指標的互補，而不是每一列都在單項冠軍。

這個結果很值得工程師拿來當 data design checklist：可執行軌跡比較像把「精確呼叫」教進去，context-grounded supervision 比較像把「理解文件與遷移到陌生環境」教進去；真正穩定的是兩者一起存在，而非迷信某一種 synthetic trajectory。

作者也做了 DeCon contamination audit：少於 20 個 candidate n-gram overlap，人工檢查後都被判為 generic API documentation 的 false positive，沒有看到 benchmark instance 或 reference answer 的 leakage。但這只能約束表面 n-gram overlap，不能排除 semantic 或 schema-level similarity。

## VisualToolBench：一個小但重要的提醒

Appendix C.3 做了一個 visual tool-use pilot。在該小型 transfer study 裡，tool success 從 0.5863 升到 0.7231，overall rubric 從 0.0567 升到 0.0661。這個方向很有趣，但不該被讀成一個已經穩健的 multimodal conclusion：作者把它定位成 pilot，且 overall rubric 的增幅遠小於 tool success 的增幅。

它揭露一個 agent evaluation 常被忽略的斷裂：**工具有成功回傳，不等於最後答案真的把工具結果用對。** 如果評測只記 tool call success，模型可能成功抓到畫面、資料或 API response，卻在 final answer 中漏掉關鍵證據、誤讀結果，或回答一個工具沒有支持的結論。

## 限制：這篇論文沒有回答什麼

### 1. 20.3B 不是一個便宜的 baseline

32 張 H200 的 mid-training／SFT、8 張 B200 的 RL，加上多個教師模型與 synthetic environment，離一般團隊「把 tool use 放進 mid-training」的成本很遠。論文自己也指出，尚未能在 matched budget 下完整 sweep mixture design，更沒有 co-design mid-training 與 post-training 的所有組合。

### 2. 訓練資料的大部分不是人工驗證

Hugging Face dataset card 明確標註：source documents 沒有被逐一人工 review，trajectories 通過 automatic validation 但沒有 human verification，且大量 corpus 是 model-generated。這不等於資料不可用，但它要求使用者把 license、上游內容、過期 API、錯誤文件與 synthetic teacher bias 都放進 reproduction risk。

### 3. 公開 artifact 不等於無摩擦 reproduction

MidTool-Mix dataset 顯示 42.7 GB，dataset access 受 MidTool-Mix License 與上游 terms 約束；4B／8B model checkpoint 也要求接受 Apache-2.0 與 dataset terms。模型頁提供 loading path，這已經比只有論文數字好很多，但完整 reproduction 仍需要取得資源、確認 license、下載大檔案，並重建作者的 ArcticTraining、AWM、benchmark harness 與固定的後訓練配方。

### 4. web-search 的 0% 不是小瑕疵

作者把它解釋為 general tool-use prior 對 deep-search-style exploratory behavior 不足。這個解釋和分項結果一致，但仍然是單篇論文、單組 MCP-Universe split 的 evidence。它提醒我們不能把 MCP pass rate 的提升寫成「agent research 已解決」。

### 5. 指標是 point estimate，不是完整不確定性分析

論文主要報告單次 benchmark numbers，沒有為每個切片提供完整 confidence interval 或跨 seed 分布。當 MCP-Universe 的絕對 pass rate 仍很低時，幾個 percentage points 的差異尤其需要用更多 seeds、任務級 bootstrap 與 action trace audit 來確認穩定度。

## 給工程團隊的實作讀法

如果要把 MidTool 的想法搬進自己的 model／agent pipeline，我會先做一個小型、可回溯的四段實驗，而不是直接照抄 20.3B tokens：

1. **先建立 tool-use data contract**：每筆資料標記來源、schema version、required arguments、tool response、權限風險與是否為人工／模型合成。
2. **分開 raw、grounded、executable 三種資料**：不要把 documentation QA、synthetic call trace 與真實 rollout 混成一個不可解釋的 blob。
3. **用同一個 post-training recipe 做對照**：至少有 no-mid、raw-only、context-only、native-only、full mixture 五個條件，否則不知道增益來自資料內容、教師模型還是下游 recipe。
4. **評估 final answer grounding**：除了 tool-call validity、schema accuracy、Pass@k，還要檢查最後答案是否引用實際 tool response，並把 web-search／long-horizon slice 單獨列出。

## 工程含義與何時不要用 / Engineering implications and when not to use

什麼情況不該先做 mid-training？如果你的瓶頸其實是工具權限、retry policy、context window、錯誤觀測或 post-training label 品質，先修 runtime 與 data plumbing 往往更划算。MidTool 證明的是「更早塑造一個通用 tool-use prior 很有希望」，不是「把所有 agent failures 都丟回 pretraining 解決」。

## 可重現性與材料狀態（截至 2026-08-24）

- **論文**：[arXiv abstract](https://arxiv.org/abs/2608.20314)、[full HTML](https://arxiv.org/html/2608.20314v1)、[PDF v1](https://arxiv.org/pdf/2608.20314v1)。arXiv HTML 頁標示論文為 CC BY 4.0。
- **資料集**：[MidTool/MidTool-Mix](https://huggingface.co/datasets/MidTool/MidTool-Mix) 可見、可申請 access，包含 web、PDF、code、native-agent-traj 子集與欄位說明；它不是本文下載進 repository 的資料。
- **模型**：[Arctic-MidTool-MT-4B](https://huggingface.co/MidTool/Arctic-MidTool-MT-4B)、[Arctic-MidTool-MT-8B](https://huggingface.co/MidTool/Arctic-MidTool-MT-8B) 與相應 RL checkpoint 可見；model card 將 mid-training checkpoint 定義為接下來做 SFT／RL 的 base，而不是 ready-to-use assistant。
- **品質 classifier**：web／PDF fastText classifier 也公開，但頁面標示 gated access；它們是 pipeline artifact，不是完整 end-to-end reproduction。
- **未驗證事項**：本文沒有聲稱已下載 dataset、載入 checkpoint、重跑 BFCL／`\\tau^{2}`-Bench／MCP-Universe，或核對所有上游資料的 license。

## 三個記憶點 / Three things to remember

1. **先驗的位置很重要**：MidTool 把工具知識、grounding 與 execution 提前到 mid-training，但仍保留 SFT／RL 的角色。
2. **兩條資料分支互補**：raw／context-grounded 資料幫助理解與 transfer，native executable trajectories 幫助精確呼叫；完整 mixture 才在主要指標上最穩。
3. **能力邊界同樣重要**：MCP-Universe web-search 仍是 0.00%，tool-call success 也不等於 final-answer grounding。

## 一句話帶走

MidTool 的訊息可以濃縮成：**工具使用不是 post-training 的格式對齊問題，而是一種需要在模型更早期建立的知識、grounding 與執行先驗；但「會用工具」和「會做深度搜尋」仍是兩個不同能力。**

想延伸閱讀，可以接著看 Bloss0m 的 [RAG-MCP：用檢索降低工具選擇的 prompt bloat](/paper-reading/04-rag-mcp/)，以及 [MCP roadmap](/blog/mcp-roadmap/)；兩者分別從 tool selection 與 protocol ecosystem 補上 MidTool 沒有完整處理的 runtime context。

## Primary sources

- [Jiang et al., “MidTool: Mid-training Data Synthesis for Agentic Tool Use,” arXiv:2608.20314 v1](https://arxiv.org/abs/2608.20314)
- [MidTool full paper in arXiv HTML](https://arxiv.org/html/2608.20314v1)
- [MidTool-Mix dataset card and license](https://huggingface.co/datasets/MidTool/MidTool-Mix)
- [Arctic-MidTool-MT-8B model card](https://huggingface.co/MidTool/Arctic-MidTool-MT-8B)
