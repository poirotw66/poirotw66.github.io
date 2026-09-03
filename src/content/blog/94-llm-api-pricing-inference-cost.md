---
title: "LLM 推論成本怎麼算？從 DeepSeek-R1 實測到 GPU 租價"
description: "以 DeepSeek-R1 的 MLPerf 公開紀錄對照 8 張 B200／B300 的吞吐與延遲，再用有來源的 GPU 租價試算成本，分清實測、算術推導與 API 售價。"
pubDate: 2026-09-03
updatedDate: 2026-09-03
tldr:
  - "DeepSeek-R1 的公開測試各使用 8 張 B200／B300，整組輸出吞吐為每秒 51,692.89／60,413.44 Token"
  - "兩組 P95 首字延遲約 1 秒，但平均每輸出 Token 約 70 毫秒；總吞吐不是單人速度"
  - "B200 實測吞吐搭配外部整組租價 USD 53.52／小時，可條件式折算約 USD 0.288／百萬輸出 Token，並非實測帳單"
  - "API 售價、公開 benchmark 與成本推導必須分開；不能把 R1 的 8 張 GPU 說成 GPT／Claude 的配置"

audience:
  - "需要估算 Agent、RAG 與模型 API 預算的工程師"
  - "評估託管 API 與自建推論服務的架構及平台團隊"
category: "AI Engineering"
tags: ["AI Agent", "Enterprise AI", "Platform Engineering", "Evaluation"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 10
kind: article
showToc: true
wideHeader: true
image: "/blog/94-llm-api-pricing-inference-cost/title_image.webp"
---
要讓大型語言模型快速開始回答，背後究竟需要多少 GPU？與其從 GPT、Claude 的售價猜機房配置，不如先看一個有公開權重、硬體規格與原始測試紀錄的案例：**DeepSeek-R1**。

在 MLPerf Inference v6.0 的 Nebius 提交結果中，**8 張 B200 與 8 張 B300** 都跑出約 **1 秒的 P95 首字延遲**，整組輸出吞吐分別為 **51,692.89 與 60,413.44 Token／秒**。這些是公開實測，不是本文假設；也不是本站自行租機測得的結果。[B200 原始紀錄](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)、[B300 原始紀錄](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)

但有一個重要差別：**整組每秒五、六萬 Token，不代表你一個人的答案也以這個速度出現。** 同一份紀錄的平均每輸出 Token 時間約為 70 毫秒。首字等待、生成節奏與整組吞吐，是三個不同指標。

本文先讀懂這組實測，再比較 API 費率、模型容量與 GPU 租價。所有價格是 **2026-09-03 查核的公開快照**；實測數據、官方報價與本文算術推導分開標示，不把估算包裝成供應商內部成本。

## 一、先看真實數字：8 張 GPU 跑 DeepSeek-R1

### 測的是哪個模型、哪種服務？

這裡是完整的 **DeepSeek-R1，671B 總參數、每 Token 啟用 37B**，不是蒸餾小模型，也不是後來的 R1-0528 或 V4。選它不是宣稱它最新，而是因為這組案例能同時追到模型、系統與測試紀錄。[DeepSeek 官方模型卡](https://huggingface.co/deepseek-ai/DeepSeek-R1)

| 測試條件 | 本文採用的範圍 | 查核來源 |
| --- | --- | --- |
| 提交與場景 | Nebius；MLPerf Inference v6.0；Server；兩組結果均標示 VALID | 上述 B200／B300 原始紀錄 |
| 模型與精度 | 完整 R1；提交欄位記錄權重為 FP4，經量化與 affine fusion | [B200 measurements](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/measurements.json)、[B300 measurements](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/measurements.json) |
| 軟體與版本 | DeepSeek-R1 的 TensorRT-LLM 執行路徑；系統列示分支 feat/1.2-mlpinf、CUDA 13.1 | [執行說明](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/code/deepseek-r1/tensorrt/README.md)、下表系統檔 |
| 工作負載 | 4,388 筆評測樣本，涵蓋數學、知識問答與程式題；不是固定長度的聊天測速 | [MLCommons 工作負載說明](https://github.com/mlcommons/inference/blob/master/language/deepseek-r1/README.md) |

執行說明把原始 R1 權重固定到 revision `56d4cbbb4d29f4355bab4b9a39ccb717a14ad5ad`，也列出 NVIDIA FP4 checkpoint 選項。**模型基底與 FP4 精度可確認，但不能只靠這份 README 唯一判定每次提交使用了哪個量化 checkpoint revision。** 同理，不能把資料集檔名裡的 `fp8_eval` 誤認成這次的權重精度。

### 硬體、吞吐與體驗放在同一張表

下列延遲從原始紀錄的奈秒換算，四捨五入到小數點後兩位。TTFT 是首個輸出 Token 的等待時間；TPOT 是每輸出 Token 的時間指標，不能把它當成單次最慢停頓。

| 指標 | 8 × B200 | 8 × B300 |
| --- | ---: | ---: |
| 節點／GPU 數 | 1／8 | 1／8 |
| 每 GPU 記憶體（提交規格） | 180 GB | 270 GB |
| 整組記憶體（相加） | 1.44 TB | 2.16 TB |
| 整組輸出吞吐（Token／秒） | 51,692.89 | 60,413.44 |
| 完成樣本／秒 | 13.81 | 16.05 |
| 平均 TTFT（毫秒） | 629.79 | 616.63 |
| P95 TTFT（毫秒） | 959.56 | 996.55 |
| 平均 TPOT（毫秒） | 71.86 | 69.31 |
| P95 TPOT（毫秒） | 75.48 | 78.83 |
| 完整請求延遲中位數（秒） | 152.24 | 145.46 |

硬體取自 [B200 系統檔](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/systems/nebius_b200_n1.json)與 [B300 系統檔](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/systems/nebius_b300_n1.json)；效能取自 [B200 performance log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)與 [B300 performance log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)。TB 是十進位相加，並非一塊可無損任意取用的共享記憶體；B300 的 270 GB 採提交規格，不與其他產品頁的容量數字混用。

原始設定列出的 TTFT／TPOT 限制是 **2 秒／80 毫秒**；這是驗收條件，不是量到的延遲。上表另列實際平均與 P95，避免把規格上限當成實測。B200／B300 的目標到達率分別為 **14／16.2 次請求每秒**，不是固定併發人數；兩組是各自調校的服務點，不是只有 GPU 型號不同的控制實驗。

量化也不能只看速度：同一提交的獨立 accuracy run，在這套題庫的 exact-match 分數分別為 **81.43%／81.59%**。這不是一般任務正確率，也不是與未量化版本的品質差比較。[B200 accuracy](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/accuracy/accuracy.txt)、[B300 accuracy](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/accuracy/accuracy.txt)

### 這些數字可以怎麼理解？

**一組 8-GPU 服務，確實能在這套測試負載下約 1 秒開始輸出，但長推理答案仍可能需要數分鐘。** 上表完整請求的中位數約 2.5 分鐘，不能把「首字快」寫成「完整答案 1 秒完成」。這也不是已證明每條串流都能達到 40 Token／秒。

更不能用 51,692.89 除以某個單人速度，就宣布能讓多少人同時順暢聊天。輸入與輸出長度、排隊、快取、推理量及延遲要求不同，都會改變服務容量。本文沒有將未核定的 batch、快取命中率或推測解碼設定擅自填成零；若要重現或採購，仍須補齊實際執行設定並用自己的請求重測。

最後，**8 張是這次公開測試的配置，不是 R1 的最低部署張數，也不是每位使用者獨占 8 張，更不是 GPT／Claude 的實際配置。** 多 GPU 副本可透過批次排程服務多筆請求；常駐模型也不等於每收到一句話才重新啟動一整組卡。

> **花花的一句話**
>
> 同一張表要同時看「多久開始」、「每個 Token 多久」與「整組完成多少」。只看最大的吞吐數字，最容易高估自己會感受到的速度。

## 二、九個模型的價目表，必須先對齊計價條件

以下價目表用來算購買 API 的帳單，不是上節 R1 的成本或性能對照；尤其 DeepSeek V4 Pro 與 R1 是不同模型。下表單位均為 **USD／一百萬 Token**，採文字工作負載的標準線上費率；未套用 Batch、企業議價或免費額度。快取欄是讀取命中價格，不包含建立與儲存費。模型名稱連到官方來源。

| 模型／服務 | 一般輸入 | 快取讀取 | 輸出 | 本表採用的條件 |
| --- | ---: | ---: | ---: | --- |
| [GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol) | 4.00 | 0.40 | 20.00 | 輸入不超過 272K；促銷價格 |
| [Claude Fable 5.1](https://platform.claude.com/docs/en/about-claude/pricing) | 10.00 | 0.25 | 50.00 | 標準費率 |
| [Claude Opus 5](https://platform.claude.com/docs/en/about-claude/pricing) | 5.00 | 0.50 | 25.00 | 標準費率 |
| [Gemini 3.1 Pro Preview](https://ai.google.dev/gemini-api/docs/pricing) | 2.00 | 0.20 | 12.00 | Prompt 不超過 200K |
| [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/pricing) | 0.75 | 0.075 | 3.75 | 至 2026-12-31 的價格 |
| [Grok 4.6](https://docs.x.ai/developers/pricing) | 2.00 | 0.50 | 6.00 | Prompt 小於 200K |
| [DeepSeek V4 Pro](https://api-docs.deepseek.com/quick_start/pricing/) | 1.32 | 0.044 | 3.96 | 尖峰時段；API 別名對應 Pro-0813 |
| [Qwen3.8 Max](https://www.alibabacloud.com/help/en/model-studio/qwen3-8-max) | 1.65 | 0.206 | 4.951 | 北京部署；implicit cache |
| [Kimi K3](https://platform.kimi.ai/) | 3.00 | 0.30 | 15.00 | 國際平台美元報價 |

50 ÷ 3.75 約為 **13.3 倍**，但這只是兩個列示條件下的輸出單價比，不是能力、速度或硬體成本比。表內也不是完全同質的產品：包含 Preview、促銷與特定地區費率。

### 三種不能省略的小字

**有效日期。** GPT-5.6 Sol 的官方頁面將目前價格標為至少持續到 2026-11-21 的促銷。Gemini 3.8 Flash 則列出自 2027-01-01 起輸入／輸出為 1.50／7.50。做年度預算時，要保留促銷結束情境，不能把今天的價格直接乘十二個月。

**地區與快取種類。** Qwen3.8 Max 新加坡部署的輸入／輸出是 2.00／6.00；北京 explicit cache read 為 0.137，與表中的 implicit cache 不同。Kimi 本文直接採國際美元價，不把人民幣換算值當成全球統一售價。

**Context 上限不等於計價門檻。** GPT-5.6 Sol 輸入超過 272K，整筆請求的輸入／輸出倍率分別變成 2／1.5；Gemini 3.1 Pro 超過 200K 是 4／18；Grok 4.6 的價格表在 200K 起列為 4／12。不要把整筆請求切換費率，誤算成只有超出的 Token 加價。[OpenAI 模型規格](https://developers.openai.com/api/docs/models/gpt-5.6-sol)、[Google 價格表](https://ai.google.dev/gemini-api/docs/pricing)、[xAI 價格表](https://docs.x.ai/developers/pricing)分別定義自己的門檻。

相對地，Claude Fable 5.1 與 Opus 5 的完整 1M context 適用標準費率。支援長上下文，並不代表每家都會用同一個級距收費。[Anthropic 定價文件](https://platform.claude.com/docs/en/about-claude/pricing)

## 三、先算一筆請求，而不是只看輸出單價

把一般輸入、快取讀取、快取建立與輸出，分成互不重複的計費數量。若費率單位是每百萬 Token，基本模型是：

$$
C_{request}=\frac{I_uP_u+I_rP_r+I_wP_w+OP_o}{10^6}+C_{extra}
$$

其中 I 是各類輸入數量，O 是**計費輸出**，P 是對應單價；u、r、w 分別表示未快取、快取讀取、快取建立。額外費用可能包含快取儲存、搜尋、程式執行或其他工具。若供應商將建立費定義成附加費，必須改寫模型，不能照抄分類後重複收算。

### 一個可以自己重算的例子

假設某次 GPT-5.6 Sol 請求包含 20,000 個輸入 Token，其中 18,000 已命中快取、2,000 是一般輸入，另產生 2,000 個計費輸出；本次沒有建立快取、沒有額外工具費，也未跨入長上下文級距。

$$
C_{request}=\frac{2{,}000\times4+18{,}000\times0.4+2{,}000\times20}{10^6}=0.0552
$$

單次為 **USD 0.0552**；若全部輸入都未快取，則為 **USD 0.12**。但這不是快取生命週期的完整報酬：初次建立與後續失效仍需入帳。OpenAI 的短上下文快取建立單價是 5.00，而非讀取價 0.40。[OpenAI API 定價](https://developers.openai.com/api/docs/pricing)

快取命中通常是在重用已處理的前綴狀態，省去部分重複 prefill；不是免費讀取一份文字檔。以服務流程來說，**prefill** 處理輸入並建立後續生成需要的狀態；**decode** 逐步產生輸出。兩階段的平行性、記憶體存取與排程條件不同，不能只用輸入加輸出的總 Token 數比較所有工作負載。[AMD ATOM 服務與快取配置](https://rocm.docs.amd.com/projects/atom/en/main/model_run_guide.html)

還有兩個常見漏項。第一，計費輸出不一定等於讀者看到的答案：Google 明確將 thinking tokens 納入輸出計價；Gemini 3.1 Pro 的快取儲存另收 4.50／百萬 Token／小時。第二，不同模型 tokenizer 不同，同一份文件不保證有相同 Token 數。[Google 計價說明](https://ai.google.dev/gemini-api/docs/pricing)

對 Agent 而言，還要把整段工作流的模型呼叫、工具結果回填與重試加總。把單次聊天價格當成一件 Agent 任務的成本，通常會漏掉真正的大項；任務邊界可參考 [AI Agent 架構指南](/blog/64-ai-agent-guide/)。

## 四、總參數與啟用參數，回答的是不同問題

MoE（Mixture of Experts，混合專家）模型只讓每個 Token 通過一部分專家，但其他專家權重仍需要被儲存或調度。總參數比較接近容量問題；每 Token 啟用參數是計算量的線索，卻不是完整的 FLOPs、延遲或電費。

| 公開模型 | 總參數 | 每 Token 啟用參數 | 官方揭露與適用邊界 |
| --- | ---: | ---: | --- |
| [DeepSeek-R1](https://huggingface.co/deepseek-ai/DeepSeek-R1) | 671B | 37B | 上節實測模型；測試提交使用 FP4，不是 BF16 基準 |
| [DeepSeek-V4-Pro](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro) | 1.6T | 49B | MoE；公開權重包含混合精度配置，不宜假定全模型都是 FP8 |
| [Qwen3.8-2.4T-A95B](https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B) | 2.4T | 95B | 開放模型架構參考；不代表託管 Max 服務的完整部署細節 |
| [Kimi-K3](https://huggingface.co/moonshotai/Kimi-K3) | 2.8T | 104B | 公開模型卡列出 MXFP4 權重、MXFP8 activation |

T 表示兆、B 表示十億。依公開數字相除，依表格順序，啟用占比分別約為 5.51%、3.06%、3.96%、3.71%。**這不代表耗電只剩同尺寸 dense 模型的相同比例**：attention、共享元件、路由、資料搬移與 GPU 間通訊都還存在。

Kimi 的啟用參數應直接採模型卡的 104B，不可用總參數乘上「選中專家數／全部專家數」取代；共享與非路由參數不服從那個比例。這也說明為什麼只有專家數量，仍不足以推算成本。

對 GPT、Claude、Gemini 與 Grok，本文所查的官方 API 文件不足以建立這種參數與部署對照。因此不填猜測的參數量，也不由價格指定它們必定使用某款 GPU 或 TPU。即使有開放權重，公開模型版本也不能自動視為託管 API 當下的完整實作。

## 五、裝得下權重，只是硬體估算的第一關

先做最簡單的理想 payload 計算：

$$
M_{weights}=P_{total}\times b
$$

b 是每個參數占用的 bytes。若假設所有權重都用同一精度，BF16 為 2、FP8 為 1、FP4 為 0.5，可得到下列**算術情境**；單位為十進位 TB，不是 TiB。

| 模型規模 | BF16 理想 payload | FP8 理想 payload | FP4 理想 payload |
| --- | ---: | ---: | ---: |
| 671B | 1.342 TB | 0.671 TB | 0.3355 TB |
| 1.6T | 3.2 TB | 1.6 TB | 0.8 TB |
| 2.4T | 4.8 TB | 2.4 TB | 1.2 TB |
| 2.8T | 5.6 TB | 2.8 TB | 1.4 TB |

R1 的理想 FP4 payload 約為 335.5 GB，但不能因此認為 335.5 GB 記憶體就能重現上節效能。這張表不是每個模型各自都有三種可用 checkpoint 的聲明，也沒有算進量化 scale、混合精度層或 runtime buffer。

NVIDIA H200 提供 141 GB HBM。只做容量除法，1.6 TB／141 GB 向上取整是 12 張；2.4 TB 是 18 張；1.4 TB 是 10 張。[NVIDIA H200 規格](https://www.nvidia.com/en-us/data-center/h200/)

**這些張數不是部署建議。** 它們只是假設權重全駐留 HBM、理想切分時的 payload 容量下界；不能保證平行切分合法、量化 kernel 相容或效能可用。用 H200 的容量除 MXFP4 payload，也不等於 H200 原生支援該 checkpoint 的最佳執行路徑。

正式服務還要處理 KV cache（注意力的 key／value 狀態）或混合架構的循環狀態、activation、暫存與通訊 buffer，並為長請求、併發、故障切換留容量。MoE 還可能因專家分布不均而出現忙碌 GPU 等待其他 GPU 的狀況。

公開服務配置比容量除法更接近現實。把 AMD 文件中的兩種配置與尚未公開的產品部署分開看：

| 參考配置 | GPU 資源 | 能支持的判斷 | 來源 |
| --- | --- | --- | --- |
| Kimi-K3 aggregated | 單節點 8 張 MI355X | 同一組卡處理輸入與生成；具體配置可部署 | [AMD Infera](https://rocm.docs.amd.com/projects/infera/en/latest/recipes/kimi-k3-optimized.html) |
| Kimi-K3 disaggregated | 8 張 prefill＋8 張 decode，共 16 張 MI355X | 分離兩個階段，跨節點傳遞 KV；需驗證通訊與延遲 | [AMD Infera](https://rocm.docs.amd.com/projects/infera/en/latest/recipes/kimi-k3-optimized.html) |
| GPT-5.6 Sol／Claude Fable 5.1 | 本文所查文件未揭露 | 不能把上述張數直接移植為它們的配置 | [OpenAI](https://developers.openai.com/api/docs/models/gpt-5.6-sol)／[Anthropic](https://platform.claude.com/docs/en/models/fable-5-1/overview) |

前兩列是**軟硬體參考配置，不是官方託管服務的機房清單**。16 張也不表示吞吐必然是 8 張的兩倍；跨節點通訊與工作負載都會改變結果。這些數字的用途，是建立「一個服務副本可能是一整組加速器」的直覺，而非宣布所有大型模型都需要 8–16 張。

> **花花的工程提醒**
>
> 容量下界回答「權重理想上放不放得下」；部署測試回答「能不能跑」；符合延遲、吞吐與可用性要求的壓測，才回答「能不能拿來服務使用者」。

## 六、用有效吞吐量，把 GPU 小時換成成本區間

比「需要幾張卡」更有用的量，是**同一付費時段內，整組設備實際完成多少輸出 Token**。設 N 為付費 GPU 張數，T 為整組平均輸出 Token／秒，則：

$$
G_{hours/MTok}=\frac{10^6N}{3600T}
$$

若每 GPU 每小時租價為 r，GPU 租金攤提為：

$$
C_{GPU/MTok}=\frac{10^6Nr}{3600T}
$$

這裡的 MTok 專指一百萬**輸出** Token；分子包含服務同一批工作負載所用的 GPU 時間，因此也把處理其輸入的 GPU 時間攤入。它不是可以另外再加一次的獨立 decode 成本。

### GPU 租用參考價：單卡單價與整組報價要分開

以下是 **2026-09-03 查核**的報價，單位均為 **USD／小時**。DigitalOcean 為 Dedicated Inference，Lambda 為 on-demand Instances；兩者服務內容不同，不是同條件性能排名。8-GPU 欄採該方案的整組費率，不把單卡價格一律乘八。

| GPU／供應商 | 單 GPU | 8 GPU 整組 | 來源 |
| --- | ---: | ---: | --- |
| H100／DigitalOcean | 4.41 | 30.32 | [官方價目](https://docs.digitalocean.com/products/inference/details/pricing/) |
| H200／DigitalOcean | 4.47 | 35.78 | [官方價目](https://docs.digitalocean.com/products/inference/details/pricing/) |
| B300／DigitalOcean | 10.39 | 83.10 | [官方價目](https://docs.digitalocean.com/products/inference/details/pricing/) |
| MI300X／DigitalOcean | 2.59 | 20.70 | [官方價目](https://docs.digitalocean.com/products/inference/details/pricing/) |
| MI325X／DigitalOcean | 2.98 | 23.82 | [官方價目](https://docs.digitalocean.com/products/inference/details/pricing/) |
| MI350X／DigitalOcean | 6.89 | 未列示 | [官方價目](https://docs.digitalocean.com/products/inference/details/pricing/) |
| H100 SXM／Lambda | 4.29 | 31.92（8 × 3.99） | [官方價目](https://lambda.ai/instances) |
| B200 SXM6／Lambda | 6.99 | 53.52（8 × 6.69） | [官方價目](https://lambda.ai/instances) |

Lambda 的 8-GPU 頁籤列的是**每張** GPU 每小時費率，上表才乘八換成整組。DigitalOcean 的 8x 則已是整組報價。來源未列示的項目留白，不自行補成可購買的方案；MI350X 也不是前節配置使用的 MI355X。

例如 8 張 H200 依表中方案連續租 24 小時，費用是 **35.78 × 24＝USD 858.72**，不是有人提問時才計費。是否另有稅金、儲存、網路或承諾用量條件，仍要確認方案；Lambda 明示適用稅額另計。便宜的每卡小時，不保證便宜的每件任務：容量、互連與實測吞吐必須一起比，也不能把某 GPU 的測速搭配另一款 GPU 的租價。

### 用實測吞吐與外部租價，做一個可重算的折算

這裡不再任選每秒 4,000 Token 或每卡 USD 4。吞吐採第一節的 R1 原始紀錄，時租採上表相同 GPU 型號的 8-GPU 報價。

**但供應商不同：實測是 Nebius，報價是 Lambda／DigitalOcean。下表是「假如租來的環境也能維持該吞吐」的跨供應商成本情境，不是這些平台的實測帳單，更不是部署效能保證。** 同型 GPU 仍可能有不同互連、功耗、CPU、記憶體與服務設定，正式比較必須在實際租用環境重測。

| 外部租價折算情境 | 整組輸出吞吐（Token／秒） | 整組時租（USD） | 每百萬輸出折算（USD） |
| --- | ---: | ---: | ---: |
| Nebius B200 實測 × Lambda 8-GPU 租價 | 51,692.89 | 53.52 | 0.288 |
| Nebius B300 實測 × DigitalOcean 8-GPU 租價 | 60,413.44 | 83.10 | 0.382 |

吞吐來源：[B200 log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)、[B300 log](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)；租價來源：[Lambda](https://lambda.ai/instances)、[DigitalOcean](https://docs.digitalocean.com/products/inference/details/pricing/)。最後一欄為本文推導，未加供應商方案外的費用。

以 B200 為例，直接把整組時租取代公式中的 N × r：

$$
C_{GPU/MTok}=\frac{53.52\times10^6}{3600\times51{,}692.89}\approx0.288
$$

這個低數字成立的關鍵，不是「一張卡很便宜」，而是**整組設備在該測試負載下持續完成大量輸出**。它不能拿來宣稱 R1 一定比表中的 V4 Pro、GPT 或 Claude 划算：模型、品質、負載、服務範圍與計價分母都不同。

### 利用率不能漏算，也不能算兩次

假設 B200 情境只有一部分付費時間能以參考吞吐工作，其餘完全閒置，可做下列線性敏感度分析。這三列是**假設，不是新增的實測結果**。

| 以參考吞吐運作的時間占比 | 日曆平均輸出吞吐（Token／秒） | 每百萬輸出折算（USD） |
| --- | ---: | ---: |
| 100% | 51,692.89 | 0.288 |
| 50% | 25,846.445 | 0.575 |
| 25% | 12,923.2225 | 1.150 |

可寫成 T＝u × T_ref，u 是有效忙碌時間占比，**不是 GPU 監控面板的 SM utilization**。若 T 已由「整個付費時段的輸出總量／該時段秒數」算出，就已包含閒置，不可再除一次利用率。真實低流量也可能改變批次效率，突發與排隊不一定線性；這張表只揭示閒置的攤提效果，不是生產流量預測。

### Benchmark 的分母，要比品牌名稱先看

一組可用於成本估算的 benchmark 至少要交代：模型與精度、GPU 型號與數量、服務引擎、輸入／輸出長度、併發、快取命中率、推測解碼設定，以及達成的延遲條件。

「3,000 Token／秒」若是輸入加輸出，就不能當成 3,000 個輸出 Token；單請求串流速度也不等於叢集總吞吐。為了拉高吞吐而放寬排隊時間，可能無法符合你的服務需求。AMD ATOM 的測試文件明列輸入／輸出長度和併發設定，正是讓數字可解讀的必要背景。[AMD ATOM 測試配置](https://rocm.docs.amd.com/projects/atom/en/main/model_run_guide.html)

如果 GPU 租金試算高於 API 單價，不代表供應商必然賠錢；可能是你的吞吐假設、公開租價或負載條件不同。反過來，也不能把 API 售價減去 GPU 租金，就稱為毛利：CPU、網路、儲存、維運、備援與其他成本都尚未完整計入。

### 要回答「100 人要幾張卡」，還缺什麼？

本文不再給沒有對應壓測的 GPU 人數表。**8 張卡的公開實測回答的是特定服務點，不是所有工作負載的併發上限。** 完成請求／秒是速率；同時生成中的請求數是併發；兩者不能直接互換。

若要替自己的網站或 Agent 平台規劃容量，先固定模型版本與精度，從真實請求取樣輸入／輸出長度、快取與工具往返，再逐步提高到達率。每個負載點一起記錄 P95 TTFT、TPOT、失敗率與整組輸出吞吐，直到碰到預先訂好的品質與延遲門檻；最後才加上流量尖峰與故障備援容量。

若目標是每條串流 40 Token／秒，對應的時間預算約為 25 毫秒／Token。這與本文實測平均 TPOT 約 70 毫秒不同，**不能直接套用其總吞吐，宣稱相同配置已達成那個目標**；更不能把增加副本當成單條生成必然加速的證明。

## 七、折扣與級距，揭示的是服務政策，不是硬體祕密

**同一服務，不同時段。** DeepSeek V4 Pro 的離峰輸入／快取／輸出為 0.66／0.022／1.98，是表中尖峰的一半。尖峰定義為週一至週五 UTC 01:00–04:00、06:00–10:00，其餘為離峰。[DeepSeek 定價](https://api-docs.deepseek.com/quick_start/pricing/)

**同一模型，不同完成時限。** Claude Fable 5.1 和 Opus 5 的 Batch 輸入／輸出均為標準價五折。它適合可等待的處理，不應直接代入即時互動預算。[Anthropic Batch 費率](https://platform.claude.com/docs/en/about-claude/pricing)

Batch 也不是跨模型通用權利：Grok 4.6 官方標為不支援；Kimi 的 Batch 費率頁列出 K2.6、K2.5，不能把那些折扣自動套給 K3。Qwen 也需要查實際地區與模型快照的支援，不能從平台有 Batch 功能就推論每個模型可用。[Grok 模型頁](https://docs.x.ai/developers/models/grok-4.6)、[Kimi Batch 定價](https://platform.kimi.ai/docs/pricing/batch)、[Qwen 模型頁](https://www.alibabacloud.com/help/en/model-studio/qwen3-8-max)

把離峰、Batch、促銷與長上下文門檻放在一起，合理的結論是：**售價同時受服務條件與商業政策影響，不能只視為物理運算量計表。** 但這不是控制實驗，不能因此宣稱折扣前後底層硬體、負載與成本完全不變。

對平台團隊，實際決策是把可延後的工作移出即時路徑、穩定可重用前綴、避免無效長上下文，再用品質與延遲回歸確認沒有省錯地方。RAG 的檢索品質與內容選擇往往比一味塞滿 context 更值得先處理，相關方法見 [Enterprise RAG 指南](/blog/65-enterprise-rag-guide/)。

## 八、最後比較每件成功任務，而不是最便宜的 Token

假設兩條工作流處理同一批 100 件任務，使用相同驗收標準。A 總費用 USD 8，80 件通過；B 總費用 USD 12，96 件通過。每件成功任務成本分別為 **0.10 與 0.125**。B 不因通過率高就必然更便宜，A 也不因單價低就自動可採用：若上線要求至少 95 件通過，A 根本不符合門檻。

這是本文的假設例子，不是模型排名。完整比較還應把失敗任務的重試、人工複核與升級成本納入分子；不同安全、延遲或品質門檻下的結果，不應混成同一張排行榜。

$$
C_{accepted\ task}=\frac{C_{model}+C_{tools}+C_{infra}+C_{review}}{N_{accepted}}
$$

開始選型前，先留下一份能重跑的紀錄：

1. **固定服務版本與費率。** 記下日期、地區、模型 ID、長上下文門檻及折扣期限，不只寫產品暱稱。
2. **取樣真實任務。** 保存輸入／計費輸出長度、快取命中與建立量、工具呼叫、重試及人工處理，避免只測一句問候語。
3. **先訂驗收門檻。** 用同一題庫檢查正確性、安全性、P95 延遲與完成率，再比較成本。
4. **做三組負載情境。** 至少看持續忙碌、平常流量與突發尖峰；自建服務要把備援與閒置的付費時間算進去。
5. **持續對帳與回歸。** 用帳單核對估算，費率、模型或路由改變後重新量測。平台實作可接到 [生成式 AI 平台工程的觀測與評測流程](/blog/38-financial-genai-platform-engineering/)。

### 最後給一個有數字、也有邊界的答案

**公開證據能支持的答案是：DeepSeek-R1 在這次測試用一組 8 張 B200／B300，達到每秒 51,692.89／60,413.44 個輸出 Token；P95 首字延遲為 959.56／996.55 毫秒，平均 TPOT 為 71.86／69.31 毫秒。** 這就是可核對的硬體與體驗尺度，而不是從 API 售價猜出來的張數。[B200 紀錄](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b200_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)、[B300 紀錄](https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/Nebius/results/nebius_b300_n1/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)

在另一個明確分開的成本情境中，若租用的 B200 環境能維持相同吞吐，按外部整組 **USD 53.52／小時** 折算，約為 **USD 0.288／百萬輸出 Token**；只有一半時間以該速率工作，約為 **USD 0.575**。這不是 Nebius 的成本揭露，也不是 Lambda 的性能測試。

所以，讀者可以帶走「**一個可公開查證的大型推理模型服務案例，背後是一整組 8 張高階 GPU**」這個具體概念，但不能延伸成「每個人占用 8 張」、「GPT／Claude 也固定用 8 張」或「100 人一定要幾張」。真正的採購結論，仍須由自己的工作負載、延遲、品質與每件成功任務成本共同驗證。

### 資料與推估邊界

本文區分三層證據：MLCommons 儲存庫中的 Nebius 提交紀錄是公開實測；模型卡、部署文件與價目表是官方揭露；權重 payload、跨供應商租價折算及閒置敏感度是本文推導。測試結果連結固定到 commit `4d3916ac9cf474b679cdfcf492d43a0559418ad1`，避免日後檔案更新造成數字無法追溯。本站未自行重跑測試，也沒有供應商內部成本帳、完整生產部署或同條件跨模型壓測，因此不提供實際毛利或 GPT／Claude GPU 張數。正式採購與部署前，請重查價格、補齊執行設定並實測。
