---
title: "RAG-MCP：用語意檢索對抗 MCP 工具海的提示膨脹（詳細筆記）"
description: "依 arXiv:2505.03275 解讀 RAG-MCP 三階段管線、11100 工具壓力測試、MCPBench 對照實驗與工程取捨。"
pubDate: 2026-03-23
tags: ["論文精讀", "RAG", "MCP", "工具選擇", "LLM 函式呼叫", "Prompt 膨脹"]
image: "/paperReading/04-RAG-MCP/image_1.webp"
field: "NLP"
difficulty: "intermediate"
paper:
  title: "RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation"
  authors:
    - "Tiantian Gan"
    - "Qiyao Sun"
  year: 2025
  venue: "arXiv 2505.03275"
  links:
    pdf: "https://arxiv.org/pdf/2505.03275.pdf"
series:
  id: "rag-mcp"
  title: "RAG-MCP 精讀"
  part: 1
  totalParts: 1
---

MCP（Model Context Protocol）讓一個助理能掛接數千個外部工具，但 **prompt bloat** 很快變成硬限制：把所有 MCP schema 塞進 context，模型不是選錯，就是幻覺不存在的 API。Gan & Sun 的 **RAG-MCP**（arXiv:2505.03275）核心很單純：**工具發現 = 檢索子問題**，生成 LLM 只看 top-k（實驗中常為 **1 個**）最相關 MCP。

---

### §1 問題：工具規模 vs 上下文窗口

**§1.1 背景：**

- LLM 工具使用已有 Toolformer、ReAct、WebGPT、Gorilla 等路線  
- MCP 標準化後，**mcp.so 上 4400+ servers**（§2.3, 2025/4）— 工具集可持續膨脹  
- **Prompt bloat：** 全量 schema → context 飽和 → 區分度下降（§3.1）

**Needle-in-a-Haystack 類比（§3.1）：** 作者設計 **MCP stress test** — 在 N 個 MCP 中藏 1 個 ground-truth，量測隨 N 增長的選擇能力退化。

---

### §2–3 方法：RAG-MCP 三階段（Figure 2, §3.2–3.3）

```
User Task → (1) Retrieval → (2) Validation → (3) LLM + 單一 MCP 執行
```

| 階段 | 做什麼 | 細節（§3.2） |
|------|--------|--------------|
| **Retrieval** | 向量索引搜 MCP metadata | 實驗用 **Qwen-max** encode query；semantic top-k |
| **Validation** | 可選 few-shot 探針 | 對候選 MCP 做 synthetic query 測試相容性 |
| **Invocation** | **只注入最佳 MCP** schema | LLM 專心規劃與參數填寫，不再做 discovery |

**相對 Blank Conditioning 的優勢（§3.2 bullet list）：**

- **Reduced prompt size** — 不全量載入  
- **Lower cognitive load** — 少 distractor  
- **Resource efficiency** — 只啟動選中 MCP server，非全部 instantiate  
- **Multi-turn robustness** — 每輪由 retriever 重新召回工具，不必重塞全表  

---

### §3.1 MCP Stress Test 設計

- **N：** 1 → **11100**，26 個間隔（§3.1, §4.1）  
- 每 trial：**1 ground-truth + (N−1) distractors**，registry 來自 **4400+ public servers**  
- **20 個 web-search 任務** / 配置；模型需 (a) 選對 MCP (b) 發有效 query (c) 回傳結果  
- **Figure 3：** 橫軸 MCP position 1–11100，黃=成功、紫=失敗  

**§5 觀察模式：**

| 區間 | 現象 |
|------|------|
| position &lt; 30 | 成功率 **>90%**（池子小） |
| 31–70 | 語意重疊 MCP 增多，失敗叢集 |
| **≳100** | 紫色主導 — **檢索精度**成瓶頸 |
| 高 position 零星黃點 | 少數 MCP 與特定 query 仍高度對齊 |

> **錨點：** 這說明 RAG-MCP **緩解 bloat ≠ 無限擴展**；萬級 registry 需要 hierarchical / adaptive retrieval（§5 結論）。

---

### §4.2 MCPBench 主實驗（Table 1）

**設定（§4.2）：**

- 資料：**MCPBench web search 子集**  
- Base LLM：**qwen-max-0125**；評估 **Deepseek-v3**；答案驗證 **Llama-as-Judge**  
- 每 baseline **20 trials**；每 trial 最多 **10 輪** MCP 互動  
- 成功定義：20 次中 **>10 次正確**

**三種 baseline（§4.2）：**

1. **Blank Conditioning** — 全部 N 個 MCP 描述進 prompt  
2. **Actual Match** — 關鍵字 pre-filter 再 prompt  
3. **RAG-MCP** — 向量檢索，**只注入 top-1 MCP**  

**Table 1 結果：**

| 方法 | Accuracy | Avg Prompt Tokens | Avg Completion Tokens |
|------|----------|-------------------|------------------------|
| **RAG-MCP** | **43.13%** | **1084** | 78.14 |
| Actual Match | 18.20% | 1646 | 23.60 |
| Blank | 13.62% | 2133.84 | 162.25 |

**怎麼讀：**

- 準確率：**43.13 vs 13.62** ≈ **3.17×**（Abstract 寫 "more than triples"）  
- Prompt tokens：**1084 vs 2133.84** ≈ **49% 降幅**（"over 50%"）  
- Completion tokens 上升但作者認為換取更高 task success（§4.2, §5.1）

**§5.1 歸因：**

- Focused context filtering  
- Prompt efficiency → 更多 window 給推理  
- Balanced generation → 略長 completion 對應更完整驗證  

---

### 與標準 RAG 的類比（§1, §2.2）

| RAG QA | RAG-MCP |
|--------|---------|
| 索引 Wikipedia 段落 | 索引 MCP schema + 用法 |
| 檢索 top 文章 | 檢索 top 工具 |
| 餵 LLM 生成答案 | 餵 LLM **function call** |

**Extensibility（§1.2）：** 新 MCP **只更新外部索引**，不需重訓 LLM — 對快速迭代的工具生態關鍵。

---

### 限制與編者判斷

1. **43% 仍不高** — web search 子集 + 多 distractor；離「生產可用」還需 rerank、階層索引、工具分域  
2. **Top-1 注入** — 檢索 miss 即全敗；論文未深入 top-k&gt;1 的 trade-off  
3. **Validation 成本** — synthetic probe 增加延遲（§3.2 step 2）  
4. **領域外推** — 實驗聚焦 WebSearch；DB、Git、Slack 等 MCP 語意更近，錯誤模式可能不同  

**總評：** 這是把 **RAG 的「先縮小證據集合」** 搬到 tool routing 的最清晰論文之一；工程上應預設 **「registry &gt;50 就該有 retriever」**，而不是繼續堆 AGENTS.md。

---

### 第三遍延伸

- [ ] 用自家 MCP 清單畫 **N–accuracy** 曲線，找 knee point  
- [ ] 試 **top-3 注入 + LLM rerank** vs top-1  
- [ ] 量測 **只 retrieval vs retrieval+validation** 延遲差  

---

### 原始出處

- Gan, Sun. *RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation*. arXiv:2505.03275 (2025). [PDF](https://arxiv.org/pdf/2505.03275.pdf)
