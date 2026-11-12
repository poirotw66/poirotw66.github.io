---
title: "Gemini Decisions API：用機率與信心分數設計 AI Agent 路由"
description: "從三種決策題型、Python 範例到信心門檻與多模態限制，理解 Gemini Decision 1 適合處理哪些自動化判斷。"
pubDate: 2026-11-12
updatedDate: 2026-11-12
tldr:
  - "Decisions API 對共用的多模態輸入評估是非題、選擇題或有序評分，回傳機率與信心。"
  - "各題獨立作答；流程依賴、門檻與後續動作必須由應用程式處理。"
  - "Google 公布低延遲與輸入計價，但正式使用前仍需用實際資料測試品質、成本與失敗處理。"
audience:
  - "設計 AI Agent、客服分流與內容評估流程的工程師"
  - "評估模型路由與自動化風險的技術負責人"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Enterprise AI"]
kind: "article"
showToc: true
image: "/blog/154-gemini-decisions-api/title_image.webp"
---

當客服助理收到一段故障描述和設備照片，它不一定需要先寫一段完整回答；系統可能只想知道：這是不是支援案件、應該交給哪個佇列、緊急程度如何？這些判斷需要快速、能被程式直接使用，也要知道什麼時候應該停下來請人確認。

Google 在 2026 年 11 月 11 日推出 [Gemini Decisions API](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/)，由 `gemini-decision-1` 模型對指定選項評分。本文根據官方公告與 [API 文件](https://aistudio.google.com/docs/decisions-api)說明它的決策方式，並以未實測的客服分流範例討論接入與驗證。速度和效果數字均為 Google 的報告，並非本文獨立測試結果。

> **花花的一句話**
>
> Decisions API 把「在已知選項中選哪個」和「有多確定」交給模型，後續該做什麼仍由應用程式決定。

## 它解決的是哪一段工作？

一般 AI 應用常用生成模型讀取使用者訊息，要求它輸出 JSON，再由程式解析分類。這種做法彈性很高：模型可以解釋原因、擷取欄位，也可以決定工具參數；但如果每次只需要在既有類別中選一個，應用仍要等待生成與處理輸出，而且生成的文字本身不一定提供可直接比較的選項機率。

Decision 1 採用不同的介面：開發者先定義候選答案與判斷標準，模型在一次前向運算（forward pass）中對選項評分，而不是逐 token 生成回覆。這是 Google 對機制的描述；「不產生輸出文字 token」不表示不消耗運算，也不代表任意決策都能由單次評分完成。[產品公告](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/)

想像一個完整的 Agent 請求：

```text
使用者問題與附件
    ↓
Decisions API：意圖、範圍與候選路徑
    ↓
應用程式：門檻、權限與例外處理
    ↓
FAQ 搜尋／生成回答／人工處理／其他受控流程
```

這是一個可考慮的架構，不是官方保證的唯一部署方式。選擇路徑只是其中一步：查詢資料、擷取實際欄位、產生回答與執行工具仍需要其他元件。若問題必須依賴多步推理、外部查詢或開放式結果，應比較一般生成模型，而不是勉強把所有任務壓進固定選項。

## 三種題型，共用同一份資料

一次請求包含共享的 `input` 與一組 `questions`，每題對同一份輸入獨立評估。文字、圖片、音訊、影片和 PDF 可以組合在輸入中；問題本身的指令則只接受文字。[官方文件](https://aistudio.google.com/docs/decisions-api#question-types)列出三種題型：

| 題型 | 用途 | 回傳重點 |
| --- | --- | --- |
| `noul` | 判斷敘述是否成立 | 「是」的機率與信心 |
| `choice` | 從固定選項選一個 | 選中項目、各選項機率與信心 |
| `score` | 依有序等級評分 | 機率加權後的連續分數、各級機率與信心 |

例如三個嚴重程度等級的索引是 0、1、2；若各級機率為 0.2、0.5、0.3，分數就是 `0 × 0.2 + 1 × 0.5 + 2 × 0.3 = 1.1`。這是期望等級，不代表模型找到一個名為「1.1」的類別。等級描述應清楚區分，並採用合理的線性尺度。

與產生 JSON 的一般模型不同，Decisions API 直接回傳封閉選項的分數；需要摘要、抽取自訂欄位、解釋或帶參數的工具呼叫時，仍應使用支援生成與工具呼叫的介面。[官方比較](https://aistudio.google.com/docs/decisions-api#when-to-use)

### 三種題型各適合什麼決定？

`noul` 適合一個可以明確回答是或否的條件，例如「照片是否顯示設備外殼破損？」如果「故障」容易與使用偏好或運送問題混淆，可以在 `criteria` 裡用 `true_description` 和 `false_description` 定義邊界。每題盡量只問一件事；「是否破損而且需要立刻退款」其實把事實判斷與商業政策混在一起。

`choice` 適合從有限清單分配佇列或挑選下一步。各選項的描述要說明適用條件，而不是只填 `network`、`device` 等簡短名稱。選項機率是對這組候選答案的比較；它不是開放世界的保證。如果所有選項都不適合，仍可能有一個機率最高的選項，所以需要 `other`、獨立的範圍檢查與覆核策略。

`score` 適合有順序的評分，例如從「僅外觀問題」到「沒有替代方式、工作完全中斷」。Google 建議多數 rubric 使用 2–10 級。不要把預期分數當作唯一資訊：`[0, 1, 0]` 與 `[0.5, 0, 0.5]` 的期望值都是 1，前者集中在中間等級，後者則分散在兩端。如果需要一個離散等級，官方建議選機率最高的等級，而非只將平均值四捨五入。[評分文件](https://aistudio.google.com/docs/decisions-api#score)

## Python 範例：先確認範圍，再分流

先在 [Google AI Studio](https://aistudio.google.com/api-keys) 建立 API key，設定環境變數 `GEMINI_API_KEY`，並安裝 `google-genai` SDK 3.2 以上版本：

```bash
pip install -U google-genai
export GEMINI_API_KEY="YOUR_API_KEY"
```

以下範例定義三個獨立問題。`0.85` 只是示範門檻，不能直接當成正式環境建議值；執行需要有效 API key 與模型存取權。

```python
from google import genai

client = genai.Client(http_options={"api_version": "v1beta"})

result = client.decisions.create(
    model="gemini-decision-1",
    input="My laptop cannot connect to the office Wi-Fi since this morning.",
    questions={
        "in_scope": {
            "type": "noul",
            "instructions": "Is this an IT support request?",
        },
        "queue": {
            "type": "choice",
            "instructions": "Which IT support queue best fits this request?",
            "criteria": {
                "network": "Wi-Fi, connectivity, or network access problems.",
                "device": "Laptop hardware or operating system problems.",
                "account": "Sign-in, password, or account access problems.",
                "other": "An IT support issue outside the listed categories.",
            },
        },
        "urgency": {
            "type": "score",
            "instructions": "Rate the urgency described in the request.",
            "criteria": [
                "Low: a minor issue with a practical workaround.",
                "Medium: work is affected but not fully blocked.",
                "High: work is blocked or many people are affected.",
            ],
        },
    },
)

scope = result.answers["in_scope"]
queue = result.answers["queue"]
urgency = result.answers["urgency"]

# These thresholds are illustrative, not validated operating policy.
if scope.noul < 0.85 or queue.confidence < 0.85:
    print("Route to human review")
else:
    print(f"Suggested queue: {queue.choice}")
    print(f"Expected urgency level: {urgency.score:.2f}")
```

這裡使用 `scope.noul` 檢查「是支援案件」的機率，而非只檢查 `scope.confidence`。原因是二元題回答「很確定不是」時，信心也可能很高。程式將範圍不明、範圍外及分流信心不足的案件都交給人工；正式系統還要處理 API 錯誤與空值，並依風險決定是否使用緊急程度。這段程式只印出建議，沒有建立工單或呼叫工具。

### 怎麼閱讀回傳值？

下面是為說明結構而編寫的假設回應，並非上述程式實際執行結果：

```json
{
  "answers": {
    "in_scope": { "type": "noul", "noul": 0.96, "confidence": 0.96 },
    "queue": {
      "type": "choice",
      "choice": "network",
      "probabilities": { "network": 0.78, "device": 0.12, "account": 0.05, "other": 0.05 },
      "confidence": 0.78
    },
    "urgency": {
      "type": "score",
      "score": 1.1,
      "probabilities": { "0": 0.2, "1": 0.5, "2": 0.3 },
      "legend": { "0": "Low", "1": "Medium", "2": "High" },
      "confidence": 0.5
    }
  },
  "usage": { "total_input_tokens": 300, "total_output_tokens": 0, "total_tokens": 300 }
}
```

依示範程式，雖然支援案件的機率是 0.96，`queue` 的信心 0.78 仍低於示意門檻 0.85，所以會轉人工。`urgency` 的最高機率等級為 1，但只有 0.5，且高等級仍占 0.3；若嚴重漏判代價高，不應只看 1.1 的平均分數就自動降低優先級。實際 `legend` 會對應傳入的完整等級描述；`usage` 還能包含各模態 token 數，應以實際回應為準。

### 信心與機率不是同一件事

依[文件定義](https://aistudio.google.com/docs/decisions-api#confidence)，`noul` 是回答「是」的機率，二元題信心是 `max(noul, 1 - noul)`。因此 `noul = 0.03`、`confidence = 0.97` 表示模型高度傾向「否」，不是 97% 傾向「是」。選擇題的信心則對應最高機率的選項。

官方文件指出，`noul` 的值介於 0.01 與 0.99；例如設定 `noul > 0.99` 的條件永遠不會成立。設計門檻時要留意比較運算子與回傳範圍。

Google 將這些數值描述為經校準的機率；但某個案例的 0.9 並不保證一定正確，也不能直接推定你的資料上有 90% 正確率。應用自己的標註樣本檢查不同信心區間的實際錯誤率，並考量誤判與漏判的不同代價。

## 設計題目時，要讓程式負責流程

題目之間不能互看結果。上例中的 `queue` 不知道 `in_scope` 的答案，因此程式即使收到兩個答案，也必須先檢查範圍，再決定是否採用分流結果。若第二題真正需要第一題的結果，可先呼叫一次，再依結果發出第二次請求；也可以一次問完並忽略不適用的結果。[官方多題說明](https://aistudio.google.com/docs/decisions-api#multiple-questions)

`choice` 必須從給定選項挑一個，即使輸入不符合任何選項也一樣。因此應提供清楚的 `other` 選項或另設範圍檢查，並在信心不足時轉人工。模型看不到題目的 key，完整問題必須寫在 `instructions`；每個選項與評分等級也應有具體描述。數字與日期的精確比較則交給程式，避免讓模型承擔本可確定計算的工作。

選項 key 會依 UTF-8 位元組順序排序；精確同分時，排序最前的 key 勝出。因此不要依賴傳入 JSON 的順序，也不要假設 `none_of_the_above` 會排在最後；用有明確描述的 `other` 更合適。[選擇題規格](https://aistudio.google.com/docs/decisions-api#choice)

> **花花的工程提醒**
>
> 信心門檻是營運選擇：先用真實資料量測覆蓋率、各類錯誤與人工覆核量，再依行動的風險調整。高信心也不能取代權限檢查或高風險操作的確認機制。

## 多模態實作：文字加一張設備照片

共用輸入不一定只有一段字串。下例把案件文字與本機 JPEG 放在同一次請求，並對圖片問一個具體問題；格式參考 [官方多模態範例](https://aistudio.google.com/docs/decisions-api#media)。這段範例同樣尚未實際呼叫 API。

```python
import base64
from pathlib import Path
from google import genai

client = genai.Client(http_options={"api_version": "v1beta"})
photo = base64.b64encode(Path("device.jpg").read_bytes()).decode("utf-8")

result = client.decisions.create(
    model="gemini-decision-1",
    input=[
        {"type": "text", "text": "Photo attached to a laptop support request."},
        {"type": "image", "data": photo, "mime_type": "image/jpeg", "resolution": "high"},
    ],
    questions={
        "visible_damage": {
            "type": "noul",
            "instructions": "Does the photo show physical damage to the laptop?",
        },
    },
)
print(result.answers["visible_damage"].noul)
```

圖片中看不見損壞，不等於設備正常：角度、解析度或遮擋都可能讓證據不足。多模態分流需要測試模糊圖片、非目標照片、不同光線及文字與圖片互相矛盾的情況。文件允許圖片和影片設定解析度，但更高解析度會增加 token 用量；應用資料比較不同設定的品質與成本。

送出前確認 MIME type 符合實際檔案。官方文件列出的 inline 上限為每請求 100 MB，PDF 為 50 MB；外部 HTTPS URL 每個最多 15 MB。相鄰文字區塊會直接串接、不自動插入空白或換行，因此需要自行加入分隔符。若輸入是結構化 JSON，先序列化成文字，再在問題中指明欄位路徑。[輸入規格](https://aistudio.google.com/docs/decisions-api#input)

## Google 展示了哪些用法？

Google 在公告中提出幾個自家應用；它們是產品團隊的案例與宣稱，不是本文驗證過的效益：

- **Gemini Notebook 模型路由**：依問題選擇模型等級與思考程度，Google 表示日常查詢的延遲最多降低 40%。重點是將路由與後續生成分開；收益仍取決於路由本身的錯誤與額外延遲。
- **Stitch 快速設計實驗**：用於讓產品流程線框與語音或點擊編輯快速回應；定案後可交回完整設計流程細修。
- **CC 表情反應**：從 200 多個表情選出適合的反應，展示大量固定選項的即時選擇。
- **Search 的 MCP 工具安全層**：用來偵測對抗性行為與內容。這類模型判斷可以是多層防護的一部分，不能單獨證明工具使用安全。

這四個例子共通的是「先定義清楚可選的結果，再將結果交給系統使用」。但路由模型選錯時可能讓簡單問題進入昂貴流程，或讓難題被分配到能力不足的模型；因此應同時評估延遲、成本和最終答案品質，而不是只看分類速度。[Google 公告](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/)

## 多模態、費用與使用邊界

一個請求最多包含 1,000 題，`input` 與所有題目共用 **262,144 tokens** 的上下文；`choice` 可有 2–255 個選項，`score` 可有 2–255 個等級。媒體可使用 Files API URI、公開或簽章 HTTPS 網址，或內嵌 base64；不支援 YouTube 網址和直接 `gs://` URI。圖片與影片可調整解析度，以取捨細節與 token 成本。[限制與輸入格式](https://aistudio.google.com/docs/decisions-api#limits)

截至本文撰寫，這個介面透過 Gemini Developer API 的 `v1beta` 提供，支援 Python、JavaScript SDK 與 REST；目前僅支援 `gemini-decision-1`。它不接受對話歷史、思考或工具呼叫區塊作為輸入，需將必要對話脈絡整理成文字；也不支援 Flex 或 Priority inference。Google Cloud 支援在公告中列為即將推出，實際可用性請查官方文件。[API 限制](https://aistudio.google.com/docs/decisions-api#limitations)

截至本文撰寫，Google 公布每百萬輸入 tokens **0.10 美元**、不收輸出 token 費用，並提供免費層級；同次請求的共享輸入只計費一次，題目指令與選項仍會增加輸入量。重複跨請求傳送的輸入會再次計費，因為目前不支援 context caching，也不支援 Batch API。[公告](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/)與[官方文件](https://aistudio.google.com/docs/decisions-api#limitations)說明了這些限制；價格與配額可能調整，實作前應查看[最新價格](https://aistudio.google.com/docs/pricing#gemini-decision)。

Google 宣稱在最長 16K tokens 的測試情境中，端到端延遲為 **150–250 毫秒**，1 至 100 題時延遲近乎持平；它也報告在自家共同比較的基準測試中，成本接近 Gemini 3.5 Flash-Lite 的五分之一。這不是所有請求的服務保證，也不能推論 1,000 題或完整 256K 上下文都有相同延遲。請用自己的資料、網路環境與流量測量端到端時間和總成本。

### 算一次費用，而不是只看單價

假設一個請求的共享輸入為 10,000 tokens，三題的指令和標準合計 600 tokens；以公告單價計算，輸入成本約為 `(10,000 + 600) / 1,000,000 × $0.10 = $0.00106`。這是純計價示意，未包含後續生成模型、網路、人工審核或其他系統成本，實際 token 數也必須看 `usage`。若拆成三次請求、每次都重送同一份輸入，假設每題各 200 tokens，則輸入總量變成 `3 × (10,000 + 200) = 30,600` tokens，示意成本約 $0.00306。

把獨立問題合併可減少重複輸入，但不能因此忽略依賴關係：若第二步必須依第一步結果建立問題，兩次請求可能才是正確流程。容量上限也不是最佳使用量；題目越多，指令與選項仍占用 context，應測試不同批次的實際品質與延遲。

## 從離線評估開始

可先收集已標註的真實案例，包含多意圖、資訊不足、範圍外、少見類別與惡意指令；比較現有規則或生成模型的分類結果。分別量測每個類別的錯誤、信心區間的校準、人工覆核比例，以及圖片等多模態輸入帶來的 token 成本。再以只記錄建議、不觸發操作的方式觀察實際流量。

API 安全過濾可能回傳 HTTP 400，而非答案；網路錯誤、逾時及額度不足也需要明確的降級路徑。使用者輸入屬於不可信資料，可能試圖影響分類；敏感資料送出前也應先確認適用的資料處理條款。這個模型可以協助選路，但不應單獨作為授權或安全防線。[官方最佳實務](https://aistudio.google.com/docs/decisions-api#best-practices)

可以把評估拆成四個實際決策：

1. **資料與標準**：讓領域人員定義類別、範圍外案件與「正確分流」，保留未參與門檻調整的測試集；避免同一案件的近似版本同時落在調整與測試集合。
2. **比較基準**：在同一批案例比較既有規則、現有模型與 Decisions API，包含模型呼叫、重試、後續生成及人工覆核的端到端成本。
3. **選門檻**：依類別分別觀察混淆情況、錯誤代價與覆核量。提高門檻通常降低自動處理覆蓋率，不保證每個少見類別都更安全；要用測試資料確認。
4. **觀察與回退**：記錄模型版本、題目版本、結果與人工修正，同時遵循資料最小化；監看分布變化、失敗與覆核積壓，並準備關閉自動分流的方式。

例如，錯把「無法登入」分到網路佇列可能只是增加一次轉派；錯把重大中斷評為低優先級，代價就不同。這兩種錯誤不應共用一個未經驗證的門檻。對退款、刪除或權限變更等動作，選項分數只是參考訊號，還需要既有的授權和審批控制。

如果你的系統已經有 [AI Agent 架構](/blog/64-ai-agent-guide/)，可以先挑一個有明確選項、容易人工驗證的路由節點試驗。當資料、題目和錯誤處理都經過驗證後，再決定是否把結果用於自動執行。
