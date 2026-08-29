---
title: "16 個平行 Claude 建 C 編譯器：Anthropic 的 Agent Teams 與長程 Harness 實驗"
description: "深讀 Nicholas Carlini 實驗文：近 2000 次 session、約兩萬美元 API、十萬行 Rust 編譯器能編 Linux 6.9——鎖任務、測試 Harness、GCC oracle、多角色分工與能力邊界。"
pubDate: 2026-05-29
updatedDate: 2026-05-29
tldr:
  - "深讀 Nicholas Carlini 實驗文：近 2000 次 session、約兩萬美元 API、十萬行 Rust 編譯器能編 Linux 6.9——鎖任務、測試 Harness、GCC oracle、多角色分工與能力邊界"
audience:
  - "企業 AI／平台工程師與技術主管"
  - "需要可落地架構、治理與風險取捨的決策者"
category: "Enterprise AI"
tags: ["AI Agent","Harness Engineering","Anthropic","Multi-Agent","Claude"]
cluster: "ai-agent"
clusterRole: "case"
clusterOrder: 14
image: "/blog/17-anthropic-parallel-c-compiler-agents/title_image.webp"
showToc: true
---
Anthropic Safeguards 研究員 **Nicholas Carlini** 在 2026 年 2 月發表了一篇實驗紀錄：他讓 **16 個平行運行的 Claude**（以 agent teams 方式）在幾乎沒有人類即時介入的情況下，**從零**寫出一個 **Rust 實作的 C 編譯器**。產出約 **十萬行**程式碼，能在 **x86、ARM、RISC-V** 上編譯 **Linux 6.9**，通過多數編譯器測試（含 GCC torture），並能編譯、執行 **Doom**——開發過程為 **clean-room（無網路）**，僅依賴 Rust 標準庫。

這不是「我們發佈了下一代 GCC」的產品文，而是 **壓力測試**：在 Claude 4 系列演進中，用同一極難目標探測 **自主軟體開發** 的上限，並把筆墨放在 **如何設計 harness** 讓長時間、多 session、多 Agent 的系統仍能定向進步。若你已讀 [長任務 Harness（blog 10）](/blog/10-effective-harnesses-for-long-running-agents/) 的 initializer／coding 分工，本篇補上 **多實例並行、鎖任務、測試 oracle** 這一維；建議搭配 [閱讀地圖 13](/blog/13-harness-engineering-reading-map/)。

> **Agent Teams（Carlini 用語）**：多個 Claude 實例在共享程式庫上平行工作，無需操作者持續在線共同編輯——他認為這大幅擴展了 LLM agent 可完成的範圍。

> **花花的一句話**
>
> 喵～16 隻 Claude 聯手從零寫出十萬行 C 編譯器，這不是魔法，而是強大 Harness 設計的極致展現喔！把 Agent 關在無網路環境裡瘋狂寫 Code 真的很硬派呢～🐾
>
> **花花的工程提醒**
>
> 在設計長程多 Agent 任務時，請確保你的測試 Harness（例如 GCC oracle）和任務鎖定機制足夠強健，否則平行處理只會製造更多衝突與混亂。

原文出處：
**Nicholas Carlini（2026）. Building a C compiler with a team of parallel Claudes.**
來源：[Anthropic：Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)

### 背景：為什麼選「C 編譯器 + Linux kernel」

Carlini 長期用 **極難但可驗證** 的專案當標尺（先前也有類似做法）。這次的目標他事先草擬了方向，但**不**寫死實作細節：

- 從零、優化導向的 C 編譯器，**盡量無外部依賴**
- 與 **GCC 相容** 到能編譯真實軟體
- 能編譯 **Linux kernel**
- 支援多 backend；他指定了要有 **SSA IR** 等（方便多輪優化 pass），其餘交給 Agent

**模型代際（原文敘述）：**

| 階段 | 能力（編譯器維度） |
|------|-------------------|
| 早期 Opus 4 | 幾乎做不出可用編譯器 |
| Opus 4.5 | 首次能產出可通過**大型測試套件**的編譯器，仍難編譯真實大專案 |
| Opus 4.6 | 本次實驗主力；接近但**未完全**解決所有限制 |

因此文章同時是 **模型能力報告** 與 **harness 設計報告**：換代時他會用同一 benchmark 對照。

### 數據與成本：規模感

| 指標 | 數值（原文） |
|------|-------------|
| Claude Code sessions | 近 **2,000** |
| 曆時 | 約 **兩週** |
| Input tokens | 約 **20 億** |
| Output tokens | 約 **1.4 億** |
| API 費用 | 略低於 **\$20,000** |
| 產出規模 | ~**100,000** 行（Rust 編譯器） |

對一般開發者，兩萬美元是驚人開銷；對「從零做能編 kernel 的編譯器」的人類團隊估計，仍可能是**小數分之一**。文章也提醒：相對最貴的 Claude Max 訂閱，這是**極端實驗**，不是日常開發預算。

**可驗證成果（摘錄）：**

- Bootable **Linux 6.9**（x86 / ARM / RISC-V）
- 另可編譯 QEMU、FFmpeg、SQLite、Postgres、Redis 等
- 多數套件 **~99%** pass（含 GCC torture）
- **開發者終極笑點測試**：能編譯並跑 Doom

### 核心概念 1：長程迴圈——別讓 Agent 在中途「等人」

現有 agent scaffold（如 Claude Code）預設：**人要在線**，複雜任務做一段就停，等澄清或下一步指示。

Carlini 的 harness 是極簡 **無限迴圈**（與社群所謂 Ralph Loop 精神相近；他建議在**容器**裡跑，不要直接在實機上裸跑）：

```bash
while true; do
    COMMIT=$(git rev-parse --short=6 HEAD)
    LOGFILE="agent_logs/agent_${COMMIT}.log"
    claude --dangerously-skip-permissions \
           -p "$(cat AGENT_PROMPT.md)" \
           --model claude-opus-X-Y &> "$LOGFILE"
done
```

`AGENT_PROMPT.md` 要求 Agent：**拆小塊、追蹤在做什麼、決定下一步、持續做到完美**。迴圈本身**不會結束**——除非 Agent 自己搞砸（他曾見 Agent 誤執行 `pkill -9 bash` 把迴圈殺掉）。

#### 與 blog 10 的差異

| [Blog 10](/blog/10-effective-harnesses-for-long-running-agents/) | 本篇 |
|----------------------------------|------|
| 人設計 initializer + coding **角色** | 同一 prompt 反覆啟動 session |
| feature list、progress 檔交接 | 依賴 repo + 測試 + 鎖任務 |
| 產品化長任務應用 | 研究型「推到幾乎完美」 |

兩者互補：**角色分工**與**永不停止的迴圈**可以疊加。

### 核心概念 2：平行 Agent——解兩類單 session 瓶頸

單一 Claude Code session 的局限（原文）：

1. **一次只能做一件事**——多個 bug 無法真正並行修。
2. **難以專業化**——有人希望另開 session 專做文件、品質、子任務。

他的 parallel 實作刻意保持 **bare-bones**：

#### 基礎設施

- 建立 **bare git** repository
- 每個 Agent：**獨立 Docker 容器**
- 容器內 repo 掛在 `/upstream`；Agent **clone** 到 `/workspace`
- 完成後從自己的容器 **push** 回 upstream

#### 鎖任務（避免搶同一問題）

同步演算法（無中央調度器）：

1. Agent 在 `current_tasks/` 建立鎖檔，例如 `parse_if_statement.txt`、`codegen_function_definition.txt`。
2. 若兩個 Agent 搶同一檔名，**git 同步**會讓後到的失敗，進而選別的任務。
3. Agent 完成工作 → **pull** → merge 他人變更 → **push** → 刪鎖。
4. Merge conflict **頻繁**；預期由 Claude **自己解**。
5. 外層再 spawn **新容器 + 新 session**，循環。

**沒有**：專用 Agent 間通訊、總 orchestrator、高層目標強制分配——多數時候每個 Claude 挑「下一個最明顯的問題」；卡住時會寫 **failed approaches** 與剩餘任務文件。讀 git log 像看團隊紀錄片。

### 核心概念 3：測試 harness——Agent 會優化「你量到的東西」

Carlini 說：**大部分精力不在迴圈本身**，而在 **環境**：測試、腳本、回饋，讓 Agent **無人監督也能判斷對錯**。

#### 為什麼 verifier 必須近乎完美

Agent 會全力解決你給的目標。若測試量錯東西，它會**完美地做錯誤的事**。因此他：

- 找高品質**編譯器測試套件**
- 為開源專案寫 **build / verify** 腳本
- **觀察** Agent 反覆犯的錯 → **為該模式加測試**

#### 後期 regression 危機

專案後期常見：**每加功能就破舊功能**。對應措施：

- 上 **CI**
- 更嚴格要求 Agent 在 commit 前自測，新 commit **不能**弄紅主線

這與 [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/) 的 **computational sensors**、[OpenAI 11](/blog/11-harness-engineering/) 的機械化邊界是同一語言：**可機械驗證的不變量**。

### 核心概念 4：為 Claude 設計測試輸出（不是為人類儀表板）

他反覆提醒自己：**測試 harness 是給 Claude 用的**。

#### 冷啟動與定向

每個 Agent 進**新容器、零對話歷史**，在大 repo 上要花很久 **orient**。因此要求：

- **README、progress** 頻繁更新
- 測試輸出：**少而精**進 context；細節進**檔案**
- 錯誤格式：`ERROR` 與原因**同一行**，方便 `grep`
- **預先彙總統計**，避免 Agent 自己重算一大坨 log

#### Context 污染

Harness **不應**向 context 噴幾千行無用輸出——這與 [LangChain 15](/blog/15-langchain-agent-harness-anatomy/) 的 tool output offloading、[HumanLayer 21](/blog/21-humanlayer-skill-issue-harness/)「成功靜默、失敗才吵」一致。

#### 時間盲（time blindness）

Agent **沒有時間感**，可能花數小時跑測試卻不推進主線。對策：

- **稀疏**進度訊息（避免污染 context）
- 預設 **`--fast`**：跑 **1% 或 10% 隨機子樣**
  - 每個 VM 子樣**確定性**（可重現 regression）
  - 跨 VM **隨機**（整體仍覆蓋檔案空間）

### 核心概念 5：平行何時有用——從「獨立失敗測試」到 Linux kernel

#### 階段 A：大量獨立失敗

測試套件裡很多**互不相依**的 fail → 每個 Agent 領不同 fail，**平行 trivial**。

#### 階段 B：~99% 通過後

改派不同 Agent 去讓不同**小型開源專案**編過（SQLite、Redis、libjpeg、MQuickJS、Lua…）。

#### 階段 C：Linux kernel——16 人修同一個洞

編譯 kernel 不像「幾百個獨立測試」，而是**一個巨型整合任務**。16 個 Agent 常：

- 撞上**同一個 bug**
- 各自修、**互相覆寫**
- **加人不加速度**

#### 解法：GCC 作 online oracle

新測試 harness 思路：

- **隨機**用 GCC 編譯 kernel 的**大部分**檔案
- 僅**子集**用 Claude 編譯器編譯
- 若整體仍 OK → bug 在 Claude 子集
- 否則在子集內再**二分**哪些改回 GCC 編譯

於是不同 Agent 可平行修**不同檔案**上的不同問題。之後還需 **delta debugging**：有些檔案**單獨**能過、**合併**才掛，要成對找出。

> **啟示**：多 Agent 的價值取決於 harness 能否把任務切成**可獨立驗證的單元**；否則只是重複勞動。

### 核心概念 6：多角色 session（軟性專業化）

除「修 bug」外，他還用平行跑**專門化** session（因 LLM 愛重複造輪子）：

| 方向 | 目的 |
|------|------|
| Coalescing | 合併重複程式碼 |
| Compiler perf | 編譯器本身變快 |
| Output quality | 生成更有效率機器碼 |
| Rust 架構 | 以 Rust 專家視角重構結構 |
| Documentation | 維護文件 |

仍無人類指派「你是 doc agent」——靠 prompt／慣例與任務類型自然分流。

### 數據／觀察：能力邊界（原文誠實清單）

**尚未取代生產級 GCC 的原因包括：**

1. **16-bit x86 real mode**
   Linux boot 需要 16-bit 程式，且映像常限 **32KB**。Claude 編譯器可用 prefix 產 16-bit 碼，但體積膨脹到 **60KB+**，無法塞進限制 → **該階段改呼叫 GCC**（x86 特例；ARM／RISC-V 可全程自有工具鏈）。Carlini **努力修過未完全成功**。

2. **Assembler / linker**
   尚未自有；自動化剛起步、仍有 bug；展示影片部分用 **GCC 的 asm/link**。

3. **程式碼品質**
   生成碼即使開優化，仍遜於 **GCC 關閉優化**；Rust 原始碼合理但非專家級。

4. **穩定性**
   新功能仍常破壞舊功能——已觸及 Opus 4.6 在此任務上的**天花板**。

原始碼已公開；他會讓 Agent **繼續推**限制——讀者被鼓勵 clone 下來、讀 code、在自己專案上試，**觀察模型從哪裡開始崩**。

### 安全與治理：測試通過 ≠ 可以上線

結語帶 **滲透測試** 視角的不安：

- 人類在旁時可即時抓錯；**全自主**時容易「測試綠燈就以為做完」。
- 程式員可能部署**自己從未親自驗過**的軟體。

這補上 [Fowler 14](/blog/14-martin-fowler-harness-engineering-review/) **behaviour harness** 缺口與 [OpenAI 11](/blog/11-harness-engineering/) **E2E 觀測** 三角：**規模越大，驗證哲學越不能只靠單元測試**。

### 展望：從「人下任務」到「人定目標」

Carlini 認為每一代模型都開啟新工作方式：補全 → 函式體 → Claude Code → **Agent teams 實作整個複雜專案**。

產品假設常是：人定義任務 → 模型跑幾分鐘 → 人再下指令。Agent teams 指向：**人可以更野心勃勃**，系統自主推進大專案——但仍早期，**全自主開發有真實風險**。

### 與本系列對照（一表）

| 維度 | OpenAI 11 | Anthropic 10 | **本篇 17** |
|------|-----------|--------------|-------------|
| 規模敘事 | 百萬行產品、AGENTS.md | claude.ai clone、feature list | 編譯器、kernel |
| 並行 | 高 PR 吞吐 | 單序列多 session | **16 容器 + 鎖** |
| 驗證 | E2E UI、指標 | 瀏覽器自動化 | 編譯器測試、GCC oracle |
| 人的角色 | 建環境、審方向 | 設計 harness | **事後讀 log** |

### 啟示與建議：可落地的四條

1. **先問「驗證器量什麼」**：Agent 會優化 metric；錯誤測試比沒測試更危險。
2. **日誌與 progress 是給下一個 session 的**：格式要 `grep` 友好、成功路徑別灌爆 context。
3. **多 Agent 前先分解**：能否用 oracle／子樣本／檔案粒度切開？kernel 反例已示範。
4. **把 git history 當教材**：比單次 chat 更能學 harness 如何演進。

### 小結

Carlini 用 **\$20k 級實驗** 說明：Opus 4.6 + **簡單但嚴格的 harness**（無限迴圈、鎖、測試、GCC 分割）可以逼近「自主寫編譯器」的邊界；同時**誠實標出** 16-bit、連結器、效率與安全治理的缺口。對一般團隊，不必複製 16 容器，但應複製 **「為 Agent 設計 verifier」** 的執念。

### 系列導讀

- [Harness 閱讀地圖 13](/blog/13-harness-engineering-reading-map/)（清單 **#6**）
- 下一篇：[18 Phil Schmid — 2026 與 durability](/blog/18-phil-schmid-agent-harness-2026/)

原文出處：
**Nicholas Carlini（2026）. Building a C compiler with a team of parallel Claudes.**
來源：[Anthropic：Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)
