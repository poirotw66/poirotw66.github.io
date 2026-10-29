---
title: "GravityOCR：解碼快 3.94 倍，為什麼整頁只快 1.32 倍？"
description: "從共享參數的 diffusion 起草與 AR 驗證，理解 GravityOCR 的三種速度分母、輸出等價條件與 OCR 管線瓶頸。"
pubDate: 2026-10-29
updatedDate: 2026-10-29
tldr:
  - "作者報告的 3.94× 是英文區域裁切的純解碼加速；包含版面與組裝的整頁流程為 1.32×，皆相對同一 checkpoint 的 AR 路徑。"
  - "同一組權重先平行起草，再以因果 AR 驗證，只接受連續相符的前綴；草稿錯誤先影響接受長度。"
  - "精確算術下的 greedy 等價不代表 bf16 逐字相同；中文文件與不同併發負載仍須另行驗證。"
audience:
  - "比較文件 OCR 模型與推論管線的工程師"
  - "想讀懂解碼加速數字及其限制的 AI 系統開發者"
category: "AI Engineering"
tags: ["Multimodal", "Evaluation", "Platform Engineering"]
kind: "article"
showToc: true
image: "/blog/147-gravityocr-self-speculative-decoding/title_image.webp"
---

把 PDF 辨識器的文字生成加速近四倍，使用者等待整頁轉換的時間，會縮短到四分之一嗎？GravityOCR 恰好把這個問題攤開：作者報告純解碼加速 **3.94×**，完整頁面處理卻是 **1.32×**。兩個結果都相對同一模型 checkpoint 的 autoregressive（AR，自回歸）路徑，只是計時起訖不同。[論文的測量協定](https://arxiv.org/html/2609.26638v1#A3)讓這個落差成為值得讀的系統問題。

如果你正在比較 OCR 方案，先別急著選最大的倍數。GravityOCR 的意思是：一組權重可以先猜一段，再由自己逐位置核對，減少解碼的依序等待；但讀圖、準備上下文和整理整頁，仍然要花時間。要理解它改善了什麼，得同時看「哪些 token 可以一起猜」和「哪些工作被計入速度」。

## 看得到文字，仍不能把所有猜測直接寫進答案

文件 OCR 有一個有利條件：答案受到輸入影像約束，不必像自由寫作一樣憑空延伸。這使得多個位置一起預測，看起來相當合理。但影像沒有消除輸出之間的依賴。文字要維持順序，HTML 表格要閉合，LaTeX 的括號也要配對。

同一輪平行預測時，每個位置都看不到其他位置在這一輪剛選出的值。各自很有把握，合在一起仍可能漏字或重複。這也說明，信心高與「放到完整序列裡正確」是不同的判斷。

GravityOCR 把這兩件事拆開：block diffusion 負責提出一段候選，因果 AR 路徑決定哪些候選可以進入輸出。它們共享視覺編碼器、語言 decoder 與輸出 head；模型另加入 mask token 的 embedding，並經過聯合訓練，讓同一套參數同時學會去噪起草和下一 token 預測。這不是把任意 AR 模型切換一個推論選項就能得到的能力。[論文方法](https://arxiv.org/html/2609.26638v1#S3)與[官方實作說明](https://github.com/trillion-labs/GravityOCR/blob/main/docs/SGLANG_SELFSPEC_IMPL.md)都把雙路徑訓練列為前提。

## 起草可以平行，接受必須從左邊連續成立

在作者採用的設定中，每輪起草使用一個邊界 token，後面接 **32 個 mask**。第一次 forward 同時產生一個因果預測 `a0`，以及平行草稿 `d1…d32`。第二次 forward 改用因果 attention，檢查這些草稿對上 AR 預測的情況。[官方 README](https://github.com/trillion-labs/GravityOCR#how-it-works)將它概括為一輪兩次 forward。

想像一個只用來說明規則的例子：`d1`、`d2` 都符合 verifier 的預測，`d3` 首次不符。這輪便接受 `a0`、`d1`、`d2`，再接上 verifier 自己選出的 `a3`。即使 `d4` 恰巧也相符，也不能跳過第三個位置接受它：它原本依賴的前綴已經改了。若整段草稿都通過，verifier 還能多給下一個 token。

這個區分很重要。草稿品質差，首先造成的是每輪接受得更短，而不是直接把所有高信心猜測寫入結果。實作也要清掉遭拒草稿的狀態，讓下一輪使用的 key/value（KV）cache 保持因果；否則「只接受驗證過的前綴」就只剩表面規則。[解碼路徑文件](https://github.com/trillion-labs/GravityOCR/blob/main/docs/DECODE_PATHS.md)也區分了僅快取視覺前綴與完整增量快取的實作，不能只憑 self-speculative 這個名稱推定速度。

## 三個速度數字，計時邊界逐層擴大

以下都是作者報告、單張 H100 上的結果，對照皆為同一個最終 GravityOCR checkpoint 的 AR 路徑；不是本站重現。速度使用英文資料，品質則在完整評測集上計分。

| 計時範圍 | AR → self-speculative | 相對加速 | 包含什麼 |
|---|---|---|---|
| 區域 crop 純解碼 | 777 → 3,057 tok/s | 3.94× | 輸出 token 生成 |
| 區域 crop 完整請求 | 486 → 844 tok/s | 1.74× | 視覺編碼、prompt prefill、解碼 |
| 完整頁面 | 0.554 → 0.730 pages/s | 1.32× | 版面分析、裁切、辨識、Markdown 組裝 |

前兩列是 **8,922 個英文標註區域 crops、batch size 1**，直接送入辨識模型，不做版面分析。第三列使用 **100 頁子集，一次處理一頁**；但同一頁約有 18 個區域請求並行送出。「一頁在途」不等於「一次只有一個 crop」。作者均使用完整解析度、自然 EOS，不設輸出長度上限。[論文表 1、表 3 與附錄 C](https://arxiv.org/html/2609.26638v1#A3)提供了這些條件。

第一層落差很好理解：解碼變快，固定的視覺編碼與 prefill 就更顯眼。第二層又加入頁面工作和區域排程，AR 原本就能透過多個區域的並行利用 GPU。這使得單一 crop 的依序等待，不會原封不動地成為整頁的等待。

但不能反過來說「所以版面分析現在就是最大瓶頸」。這些總體比值沒有提供足夠的各階段時間分布，無法單獨辨認版面、視覺編碼、組裝各占多少剩餘時間。它們支持的是：加速範圍擴大後，收益會受到其他階段與排程稀釋；真正的下一個瓶頸仍需 profiling。

同樣地，作者的 **9.7 tokens per forward** 同時計入起草和驗證兩次模型呼叫，不含視覺與 prompt prefill。它是解碼步數效率，不能讀成每輪只呼叫一次模型，也不能直接換成 9.7 倍時間加速。[官方結果說明](https://github.com/trillion-labs/GravityOCR#results)列出了它與實際 pages/s 的差別。

## 驗證保住同一 checkpoint 的輸出契約，不保證原模型零損失

這裡有兩種容易混在一起的「保持品質」。

第一種是解碼方式的等價：在精確算術下，greedy 驗證只提交同一 checkpoint 的 AR 會選出的 token。但在 bf16 服務中，作者比較兩條路徑的完整輸出字串，英文 crops 的完全一致率是 **96.6%**。不同 attention kernels 在接近並列的 logits 上可能翻轉 argmax；這是理論契約與數值實作之間的距離，不能用「完全無損」一筆帶過。[附錄 B.3](https://arxiv.org/html/2609.26638v1#A2.SS3)列出測試條件；[模型卡](https://huggingface.co/trillionlabs/GravityOCR)也保留這個實測比例。

第二種是改造前後的模型品質。作者在完整 **OmniDocBench v1.6、1,651 頁**上報告，最終 GravityOCR Overall 為 **95.16**，原始 GLM-OCR 為 **95.48**。兩種解碼共用權重，不代表聯合訓練改造前後沒有差異。作者另以 AR 路徑做 Group Relative Policy Optimization（GRPO），將前者由 **94.92 提升至 95.16**；這是在共享權重上改善模型，不是驗證器憑空修復所有 OCR 錯誤。[論文表 1、表 6](https://arxiv.org/html/2609.26638v1#S4)支持這個區分。

> **花花的工程提醒**
>
> 「與自己逐 token 解碼等價」回答的是解碼契約；「能不能讀對這份文件」仍要看模型、資料與品質評測。兩者需要分開驗收。

## 比較 OCR 速度前，先固定文件與等待方式

我認為這篇工作的價值，是把「預測得更多」與「可以安全提交更多」連起來，再讓我們看見這種局部改善到了管線裡會變成什麼。共享參數省去了另一套 drafter，但兩次完整模型 forward 仍有成本；真正有用的是被接受的連續前綴，和省下的依序等待。

這也讓使用情境變得具體：短文字區域可能很快就結束，固定讀圖成本占比仍高；長結構輸出有更多解碼工作可攤提，但不能單憑「表格」兩字就預測收益。併發量也會改變 AR 的利用率。作者另做的 **RL 前 batch sweep**，在不同於上述 crop 測試的佇列設定下，加速由 batch 1 的 **1.85×** 收斂到 batch 64 的 **1.13×**；不能把這兩點接成最終 checkpoint 的同一條曲線。[附錄 C 與圖 6](https://arxiv.org/html/2609.26638v1#A3)明確區分了協定。

官方已釋出[模型與模型卡](https://huggingface.co/trillionlabs/GravityOCR)，但一般 Transformers AR 載入不會自動得到論文的 self-speculative 加速；後者需要[作者 repository 的 SGLang v0.5.12 patch 或指定增量快取路徑](https://github.com/trillion-labs/GravityOCR)。公開 repository 提供推論、服務與評測，並不包含訓練和 RL 程式。[官方範圍說明](https://github.com/trillion-labs/GravityOCR/blob/main/AGENTS.md)值得一併閱讀。

若要判斷它是否適合自己的文件，下一步應先固定一組文件、品質標準與計時邊界，分別比較 crop 延遲和整頁吞吐，再決定是否值得做模型實驗。英文速度結果不能直接當作中文掃描 PDF、其他 GPU 或更高併發的保證。對開頭的問題，答案因此很具體：GravityOCR 加快了經過驗證的文字生成；整頁是否接近這個倍數，取決於你的時間到底花在哪裡。
