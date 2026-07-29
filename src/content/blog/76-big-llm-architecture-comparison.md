---
title: "2025/2026 當代大型語言模型架構深度解析：從 DeepSeek V3 到 Llama 4"
description: "探討 DeepSeek V3、Llama 4、Gemma 3 與 Kimi K2 等最新 LLM 架構的關鍵技術，包含 MLA、MoE 與滑動視窗注意力機制的工程實踐。"
pubDate: 2026-07-29
updatedDate: 2026-07-29
category: "AI Engineering"
tags: ["架構模式", "AI"]
kind: "article"
showToc: true
image: "/blog/76-big-llm-architecture-comparison/title_image.webp"
tldr:
  - "DeepSeek V3 與 Llama 4 證明了混合專家 (MoE) 是提升推理效率的關鍵。"
  - "MLA 與滑動視窗注意力成為取代傳統 MHA 的顯學，大幅節省 KV Cache。"
  - "寬度與深度的權衡：Qwen3 偏好深度，而 gpt-oss 則以寬度與少數大型專家見長。"
audience:
  - "想了解最新 LLM 底層架構差異的 AI 開發者"
  - "規劃自建或微調模型基礎設施的技術負責人"
---

從 GPT-2 發展至今已過去數年，乍看之下當代的模型架構似乎並未脫離 Transformer 的本質，但深入檢視 2025 年與 2026 年最新發布的模型（如 [DeepSeek V3](https://arxiv.org/abs/2412.19437)、Llama 4、Gemma 3 及 Kimi K2），我們會發現底層架構發生了極其精妙且關鍵的改變。

這篇文章改編自 Sebastian Raschka 的深度解析（[原文參考](https://magazine.sebastianraschka.com/p/the-big-llm-architecture-comparison)），為你統整當前頂尖開放權重模型背後的工程抉擇。為什麼有些模型極度依賴混合專家 (MoE)？為什麼有些模型重新設計了注意力機制 (Attention) 與標準化 (Normalization) 佈局？讓我們一探究竟。

> **花花的一句話**
>
> 現代 LLM 架構創新的核心早已不是單純的「參數規模競賽」，而是**「如何在有限的推理記憶體頻寬 (Memory Bandwidth) 內，塞入最高效的快取與路由策略」**。

## 1. DeepSeek V3 的效率雙刃劍：MLA 與 MoE

DeepSeek V3（以及後續基於它的 DeepSeek R1）能在開源生態系中掀起巨浪，主要歸功於其極佳的計算效率，這一切仰賴兩項核心技術：**多頭潛在注意力 (Multi-Head Latent Attention, MLA)** 與 **混合專家 (Mixture-of-Experts, MoE)**。

### 1.1 多頭潛在注意力 (MLA)

傳統的 Multi-Head Attention (MHA) 在推理時 KV Cache 的記憶體佔用極大。過去業界習慣採用 Grouped-Query Attention (GQA) 來緩解這點，透過讓多組 Query 共用相同的 KV 頭（例如將 4 個注意力頭分組為 2 個 KV Group）來降低記憶體頻寬需求。

![MLA vs MHA 架構比較](/blog/76-big-llm-architecture-comparison/fig_mla_vs_mha.png)

然而，DeepSeek V3 放棄了 GQA，採用了自家的 MLA。MLA 不採用「共用」策略，而是將 Key 與 Value 張量**壓縮到低維度的潛在空間 (Latent Space)**，存入 KV Cache 後，直到推理當下才將其映射回原本的維度。研究指出，這不僅省下了大量記憶體，甚至在模型表現的消融實驗中，MLA 的表現略勝傳統的 MHA 與 GQA。

### 1.2 混合專家 (MoE) 與共享專家

DeepSeek V3 擁有高達 6710 億參數，但推理時僅會啟動約 370 億參數。它將標準的 FeedForward 模組替換為大量的專家網路。

![DeepSeek MoE 模組設計](/blog/76-big-llm-architecture-comparison/fig_deepseek_moe.png)

DeepSeek V3 每個 MoE 模組具備 256 個專家，每次僅透過路由啟動 8 個專家，加上 **1 個永遠啟動的共享專家 (Shared Expert)**。共享專家的好處在於：通用的語法和基礎邏輯可以被共享專家吸收，讓其他 256 個路由專家有更多空間去學習高度專業的領域特化知識。



## 2. 小巧強大的工程教科書：OLMo 2 與 Gemma 3

OLMo 2 和 Gemma 3 雖然沒有像 DeepSeek 那樣擁有驚人的千億參數，但它們在架構的細節打磨上堪稱教科書等級。

### 2.1 OLMo 2 的 QK-Norm 與 Post-Norm

在模型訓練的穩定性上，OLMo 2 採用了一種帶有變體的 Post-Norm (Post-LN)。傳統的 GPT 與 Llama 系列習慣使用 Pre-Norm 來確保模型初始化時梯度平穩，但容易在極深層的網路中發生表現退化。

![OLMo 2 的 Post-Norm 架構](/blog/76-big-llm-architecture-comparison/fig_olmo_norm.png)

OLMo 2 將 RMSNorm 放置於 Attention 與 FeedForward **之後**（但仍在殘差連接之內）。同時，它們在 Query 與 Key 進行內積前加入了 **QK-Norm**。這兩項架構微調不僅有效平滑了梯度，還大幅降低了長鏈條訓練崩潰的風險，為穩定訓練打下基礎。

### 2.2 Gemma 3 的滑動視窗注意力 (Sliding Window Attention)
與 MoE 透過減少活化參數來省記憶體不同，Gemma 3 解決了長文本注意力機制計算量爆炸的問題。Gemma 3 將 Global Attention 與 Local Attention 混合，比例設定為 1:5。也就是每 5 層僅看周圍 1024 個 Token 的**滑動視窗注意力**，才搭配 1 層全局注意力。實驗證明這對最終生成品質影響甚微，卻大幅減少了 KV Cache。

> **花花的工程提醒**
>
> 許多開發團隊在微調 (Fine-tuning) 這些新架構時容易踩坑。例如 Gemma 3 特殊的 Normalization 佈局與滑動視窗，意味著你不能直接套用 Llama 3 的推論或微調腳本，務必確認你的框架（如 vLLM 或 TRL）已原生支援這些特製模組。

## 3. 千億參數級別的設計哲學分歧

當我們觀察更大規模的模型，如 Qwen3、gpt-oss、Kimi K2 與 GLM-4.5 時，會發現架構設計出現了明顯的分歧：**深度與寬度**，以及**專家數量與大小**的權衡。

### 3.1 寬度 (gpt-oss) 還是 深度 (Qwen3)？

![gpt-oss 與 Qwen3 架構對比](/blog/76-big-llm-architecture-comparison/fig_gptoss_vs_qwen3.png)

- **Qwen3 (30B/235B)** 傾向於**更深的架構**，例如 Qwen 3 採用了 48 層 Transformer Blocks。深層架構通常能提供更複雜的邏輯組合能力，但在訓練時容易出現梯度不穩定與優化困難的問題。
- **gpt-oss (20B/120B)** 則選擇了**更寬的架構**。它僅有 24 層 Transformer，但內部嵌入維度 (Embedding Dimension) 大幅拉寬至 2880，其中間投影層 (Intermediate Projection) 也同樣增寬。寬架構在硬體推理階段更容易進行高度平行化，從而獲得更高的 `tokens/sec` 生成吞吐量。除了寬度，gpt-oss 甚至復活了 GPT-2 時代的**注意力偏置 (Attention Bias)**，並引入了「**隱式注意力下沉 (Attention Sinks)**」。不同於傳統加入實體 Token 來吸收無用的注意力分數，gpt-oss 透過為每個 Head 加入可學習的 Bias Logit 來穩定長文本表現。

### 3.2 專家配置：少而大 vs 多而小

- Qwen3 與 DeepSeek V3 傾向於使用**大量且小型的專家**（例如 128 或 256 個）。
- gpt-oss 與 Grok 2.5 則採用**少數且大型的專家**（例如僅 8 或 32 個）。在 gpt-oss 中，每次推理僅會啟動 4 個大型專家，相對於 Qwen 3 的 8 個活躍專家，這種設計顯然是為了進一步壓榨 GPU 記憶體頻寬的傳輸極限。

### 3.3 GLM-4.5 的 MoE 前置 Dense 層設計

GLM-4.5 是另一個兆級參數的競爭者，其架構理念高度呼應了 DeepSeek V3（同樣採用 MLA 與 MoE），但它在網路前期做了一個極為特殊的設計調整。

![GLM-4.5 與 Qwen3 對比](/blog/76-big-llm-architecture-comparison/fig_glm_vs_qwen3.png)

GLM-4.5 在進入 MoE 稀疏模組之前，**刻意保留了 3 層傳統的 Dense 層**。這背後的工程考量在於：大型 MoE 系統在訓練初期容易因為稀疏路由的隨機性，導致特徵萃取不穩定。透過保留前幾層為 Dense 結構，模型能先穩固地抓取字詞的語義與句法特徵 (Syntactic Feature Extraction)，隨後再交由 MoE 進行高階的邏輯分發。

### 3.4 Mistral Small 3.1 的速度取捨

![Mistral Small 3.1 與 Gemma 3 架構比較](/blog/76-big-llm-architecture-comparison/fig_mistral_vs_gemma.png)

如果說 Gemma 3 透過 1:5 的「滑動視窗注意力」來極限壓縮記憶體，那麼 Mistral Small 3.1 則是走上了另一條極致追求低延遲 (Low Latency) 的路徑。Mistral 放棄了過去引以為傲的滑動視窗，全面回歸標準的 Grouped-Query Attention (GQA)。雖然這會增加 KV Cache 消耗，但透過減少層數與高度優化的底層算子（如 FlashAttention），Mistral 達成了比 Gemma 3 更快的生成速度。

> **花花的判斷**
>
> 短期內，**MLA 結合大量小型專家的 MoE** (如 DeepSeek 與 Kimi K2 的路線) 是在千億規模下同時兼顧「訓練吞吐量」與「推理成本」的最優解。然而，在端側小模型（如 Gemma 3n）中，透過**滑動視窗**與 **Per-Layer Embedding (PLE)** 來極限壓縮記憶體，才是主戰場。

## 4. SmolLM3 與無位置編碼 (NoPE) 的奇襲

SmolLM3 雖然參數僅有 30 億，但其架構實驗極具啟發性。最引人注目的設計是它部分捨棄了傳統的位置編碼（如 RoPE），轉而採用 **NoPE (No Positional Embeddings)**。

過去在 Transformer 中，我們必須依賴絕對或相對位置編碼來讓模型理解詞彙順序。然而，NoPE 證明了僅靠因果注意力遮罩 (Causal Attention Mask)，模型依舊能隱式地學習到序列方向性。更重要的是，NoPE 被證實能顯著提升「長度泛化 (Length Generalization)」能力——也就是當推理時遇到的文本長度超越訓練長度時，其效能衰退的速度遠比 RoPE 慢。SmolLM3 在每 4 層中套用一次 NoPE 實驗，這為未來輕量級模型的長文本處理提供了新思路。

## 5. Kimi K2：兆級巨獸與 Muon 優化器

當我們把目光放回超大模型，Kimi K2 以 **1 兆參數 (1 Trillion)** 的規模驚豔全場。它的基礎架構幾乎是 DeepSeek V3 的放大版（同樣採用 MLA 與 MoE），但它在訓練工程上有個重大突破：放棄了業界標配的 AdamW，改用 **Muon 優化器**。

這是 Muon 首次被證明能在千億甚至兆級規模的模型上穩定收斂（過去只在 16B 級別被驗證過）。Muon 帶來了極其平滑且快速下降的訓練損失曲線 (Loss Curve)，這是 Kimi K2 能夠在基準測試中匹敵 GPT-4 與 Claude 3.5 的底層關鍵。

---

## 結語與未來展望

從 2025 到 2026 年，我們看到模型架構不再盲目追求簡單的「堆疊參數」，而是走向了對硬體與記憶體高度妥協卻又極致優化的工程藝術。NoPE (無位置編碼) 技術在 SmolLM3 上的實驗，以及 gpt-oss 重新啟用注意力偏置 (Attention Bias) 與注意力下沉 (Attention Sinks)，都證明了架構演進依然充滿了各種可能性。

如果你正在建立企業內部的 Agent 基礎設施，選擇底層模型時，除了看 Benchmark，更該看看它的架構：**它是否有 MoE？是否用了滑動視窗？這將直接決定你在高併發場景下需要準備多少 GPU。**

想了解更複雜的 Agent 如何受限於長鏈條推理，可以參考我們的 [AgentEscapeBench 評測深度解析](/blog/74-agentescapebench-ood-tool-reasoning)。

*（本文架構觀點與基準分析整理自 Sebastian Raschka 的深度評測。）*
