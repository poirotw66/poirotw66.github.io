---
title: "ABC-LLM：AI 如何修改指定樂段，保留同一份樂譜？"
description: "從 ABC 樂譜、操作範圍與保留條件，理解持續符號音樂編輯的實驗，以及可靠操作與音樂品質之間的距離。"
pubDate: 2026-10-29
updatedDate: 2026-10-29
tldr:
  - "每輪輸出的樂譜成為下一輪的狀態；操作同時指定改變與保留。"
  - "LoRA 適配提升作者測試中的檢查器准入與條件遵循，證據限於 IrishMan 和指定操作。"
audience:
  - "關心生成工具可控性與符號音樂的工程讀者"
tags: ["Paper Reading", "Research"]
topics:
  - "generative-media-interaction"
image: "/paperReading/105-persistent-symbolic-music-editing/title_image.webp"
field: "AI Music"
difficulty: "intermediate"
paperType: "mixed"
showToc: true
paper:
  title: "From One-Shot Generation to Incremental Music Composition: Adapting a General-Purpose Instruction LLM for Persistent Symbolic Editing"
  authors:
    - "André Ricardo Ducca Fernandes"
    - "Jean-Pierre Briot"
    - "Simone Diniz Junqueira Barbosa"
    - "Hélio Côrtes Vieira Lopes"
  year: 2026
  venue: "arXiv:2609.34994v1, preprint, 2026-09-28"
  links:
    pdf: "https://arxiv.org/pdf/2609.34994v1"
    arxiv: "https://arxiv.org/abs/2609.34994v1"
---

作曲時，「替這段旋律加和弦」通常意味著保留旋律；「改第三到第五小節」意味著其餘小節仍是原來的作品。如果每次要求都換來另一首歌，生成能力再強，也很難累積先前的選擇。這篇 2026 年 9 月的預印本將問題改成：一般指令模型能否學會在同一份可檢查的符號樂譜上，連續執行不同修改？作者以 Llama 的適配前後比較測試這個問題，而非比較誰生成的歌曲更好聽。[原文 §1、§6](https://arxiv.org/html/2609.34994v1#S1)

## 先看一份可以繼續改的樂譜

ABC 是純文字記譜法。原文 Figure 3 的極小例子如下，保留原文音符與和弦標記：

```abc
X:1
L:1/4
M:4/4
K:C
"CM7" E F G A | "FM7" A G F E |
```

`L:1/4` 設定基本音長，`M:4/4` 是拍號，`K:C` 是調號；豎線分隔小節，雙引號裡的是和弦符號。它主要表達一條旋律加上可選和弦標記，不等於完整多聲部編曲。[§3.2、Figure 3](https://arxiv.org/html/2609.34994v1#S3.F3)

![原論文的兩小節五線譜](/paperReading/105-persistent-symbolic-music-editing/lead_sheet_score.png)
Figure 3，§3.2：以上 ABC 的五線譜呈現；注意和弦標記與旋律可在同一表示中分別檢查。來源：[Fernandes 等，v1](https://arxiv.org/html/2609.34994v1#S3.F3)，CC BY 4.0；原圖未修改。

從這個表示理解「加和弦」，可以想像輸入只有 `E F G A | A G F E |`，輸出插入上述和弦標記，但不應改掉音符。這是 Bloss0m 從原文例子拆出的教學情境，不是論文記錄的一次模型輸出。若模型同時把 E 改成 D，即使 ABC 合法、聽起來也可以，它仍違反這次操作的保留條件。

原文另一個作者挑選的評估對話 `song_id=44`，則有完整四輪路徑：先建立 A Dorian、6/8 的旋律，再加入 Am、G 和弦，接著補寫第 3–5 小節，最後轉成 C Dorian。每一步的結果都成為下一步輸入，不是四份彼此無關的樣本。[§4.4、Table 2](https://arxiv.org/html/2609.34994v1#S4.T2)

![原論文四輪持續編輯例子](/paperReading/105-persistent-symbolic-music-editing/persistent_dialogue_example.png)
Figure 8，§4.4：作者的示意呈現對應 Table 2 的操作語義；它展示狀態延續，不能單獨代表所有對話都成功。來源：[Fernandes 等，v1](https://arxiv.org/html/2609.34994v1#S4.F8)，CC BY 4.0；原圖未修改。

## 狀態、範圍與保留條件如何連起來

作者把前一輪樂譜記作 $s_{t-1}$，使用者要求是 $u_t$，解析出的操作是 $o_t$，可修改範圍是 $r_t$。新樂譜遵循原文 Equation 1：

$$s_t=F_{o_t}(s_{t-1},u_t,r_t).$$

這裡的式子是一份互動契約，不是保證模型一定正確的定理。操作決定允許怎樣改變，也決定哪些關係不能破壞。建立旋律或建立帶和弦旋律是兩種初始化；加和弦、局部補寫、移調則作用於現有狀態。現行版本中，加和弦與移調涵蓋整份作品，只有補寫使用指定小節。因此「只把第五到第八小節移調」尚不是已測能力。[§3.1、§7](https://arxiv.org/html/2609.34994v1#S3.SS1)

加和弦須保留旋律；補寫須保留指定範圍以外的材料；移調改變音高及和弦時，須保留結構與節奏關係。這也解釋為何單看輸出能否解析並不夠：解析器只決定它能否接受後續檢查，操作檢查器才比較修改與不變條件。

![操作如何作用於持續樂譜的原論文圖](/paperReading/105-persistent-symbolic-music-editing/artifact_state_transition.svg)
Figure 2，§3.1：操作同時約束改變與保留；輸出成為下一輪狀態。來源：[Fernandes 等，v1](https://arxiv.org/html/2609.34994v1#S3.F2)，CC BY 4.0；原圖未修改。

這個問題與既有工作相接，而非憑空發明局部編輯。作者指出 DeepBach、Coconet 已支持局部重寫；BeatEdit 使用專門編輯表示，MusiChat 結合 LLM 與符號引擎維持作品狀態。本篇的設計點，是讓一般指令模型直接從前後狀態的監督學到這些行為。文中的設計空間圖是定性定位，不是系統排名；也沒有在共同預算下證明優於那些方法。[§2](https://arxiv.org/html/2609.34994v1#S2)

## 訓練教的是前後關係

資料來自 IrishMan 愛爾蘭傳統曲目：216,284 首，其中論文報告的訓練切分為 214,122、驗證切分為 2,162。對話從訓練切分構造，保留材料用於評估參照。六種情境組合純旋律或帶和弦作品，以及模型建立作品或使用者提供作品兩種起點。[§3.2–3.3](https://arxiv.org/html/2609.34994v1#S3.SS3)

加和弦配對未標和弦與已標和弦版本；補寫替換解析後的一至四小節，複製其餘材料；移調依抽樣音程轉換當前樂譜，包含既有和弦。856 筆模板記錄覆蓋 19 個內部提示類型。生成資料有 496,038 筆 JSONL 記錄，但只有 495,853 筆含至少一個監督操作；合計 3,241,509 個使用者—助理操作實例。平均每筆 6.535 個操作，非空記錄範圍為 1–20。記錄數、操作數與曲目數是三種分母。

基礎模型為 Llama 3.1 8B Instruct。LoRA 凍結基礎權重，學習低秩更新，讓模型從前後狀態監督學習操作。評估前將 adapter 合併回基礎模型，暫稱 ABC-LLM；這不是新增一個推論時的確定性編輯引擎。[§3.4](https://arxiv.org/html/2609.34994v1#S3.SS4)

## 先問能否檢查，再問是否遵循

每個模型評估 500 段對話。250 段純旋律對話各有生成、補寫、移調三個輸出；250 段帶和弦對話各有和聲前旋律生成、加和弦、帶和弦補寫、帶和弦移調四個輸出。合計七種狀態、每種 250 次，共 1,750 次嘗試。訓練中的「直接建立帶和弦旋律」並未成為獨立評估狀態。[§3.5](https://arxiv.org/html/2609.34994v1#S3.SS5)

作者報告基礎模型有 1,234 次可抽出 ABC，僅 514 次進入操作檢查器；適配模型分別是 1,750 與 1,739。以全部嘗試為分母，准入率從 29.37% 變成 99.37%。但條件遵循分數 0.7205 → 0.9798 的母體，是各自已准入的回應。不能將它改寫成全部 1,750 次中「97.98% 完美完成操作」，也不能直接當成人類評分。[§4.1、Table 1](https://arxiv.org/html/2609.34994v1#S4.T1)

![各狀態的准入與條件遵循原圖](/paperReading/105-persistent-symbolic-music-editing/per_operation_reliability.svg)
Figure 6，§4.1：Table 1 的七狀態分解；基礎模型移調在已准入子集仍有能力，但大量嘗試先被准入程序排除。來源：[Fernandes 等，v1](https://arxiv.org/html/2609.34994v1#S4.F6)，CC BY 4.0；原圖未修改。

操作診斷讓改善更具體：適配模型加和弦時保留 4,639/4,644 個比較旋律小節，但只有 224/249 個准入回應加入預期的引號和弦符號。補寫保留 8,886/9,043 個非目標小節，改動 1,168/1,230 個目標小節；移調則有 492/496 個准入回應符合要求調性。這些仍是不同單位的檢查，尤其小節比例不能當成整段對話成功率。非目標小節仍有被改動的情況，也說明高平均分數不等於硬性保證。[§4.1](https://arxiv.org/html/2609.34994v1#S4.SS1)

## 音樂特徵與語料重疊回答另外兩個問題

嚴格音樂特徵條件下，基礎模型僅 14/1,750 個輸出合格；適配模型在情境等量化前有 1,548 個，之後使用 1,471 個。因此作者能對適配模型計算九種音高／節奏特徵乘七狀態的 63 組比較，基礎模型卻不足以做對等分析。這不是「同一批可用樣本證明適配模型音樂更好」的比較。[§4.2](https://arxiv.org/html/2609.34994v1#S4.SS2)

![各評估階段保留母體的原圖](/paperReading/105-persistent-symbolic-music-editing/population_funnel.svg)
Figure 7，§4.1–4.2：以每模型 1,750 次嘗試為母體；strict feature eligible 是等量化之前的集合。來源：[Fernandes 等，v1](https://arxiv.org/html/2609.34994v1#S4.F7)，CC BY 4.0；原圖未修改。

方法用成對 Euclidean 距離、KLD 與重疊面積 OA 描述特徵分布。距離非負，普通對稱 Gaussian KDE 卻可能把密度放到零以下；作者採 Schuster 鏡像校正處理邊界。帶和弦狀態還測和弦音／非和弦音比例 CTnCTR，並對音高與和弦的調內率使用 Mann–Whitney 檢定和 Holm 校正。調內率十組比較的雙方中位數均為 1.0，有明顯天花板效應；高分布重疊仍無法回答聽眾是否喜歡作品。[§3.5.2、§4.2](https://arxiv.org/html/2609.34994v1#S3.SS5.SSS2)

記憶分析則使用相對主音編碼的 LCS，保留時值與事件順序，讓一致整體移調不影響比較。作者將生成對訓練集的重疊，與保留驗證曲目對訓練集的重疊比較。嚴格 `copy > 0.8` 門檻下，七狀態的標記率均低於對應的保留基準：帶和弦 15.60%、純旋律 27.60%。加和弦的未校正檢定 $p=0.0072$，其標記率卻是較低的 14.47%；其他六組 $p$ 為 0.0622–0.5852。作者據此未見系統性高重疊增加，但低重疊或不顯著都不能證明沒有記憶，更不是抄襲判定。[§3.5.3、§4.3](https://arxiv.org/html/2609.34994v1#S4.SS3)

## 原型提供介面路徑，仍缺音樂家的證據

NONOTO 擴充原型讓使用者檢視樂譜、提出自然語言操作、取得 ABC、觀看記譜與試聽。它接上既有播放、MIDI 輸出能力；Figure 9 展示整合方向，不是專業作曲環境或 HCI 實驗。[§5](https://arxiv.org/html/2609.34994v1#S5)

![擴充 NONOTO 原型](/paperReading/105-persistent-symbolic-music-editing/nonoto_prototype.png)
Figure 9，§5：自然語言與 ABC 的原型介面；截圖明示使用 local ABC LLM mock，不能當成真實模型端到端運行、實際可用性或共同創作效果證據。來源：[Fernandes 等，v1](https://arxiv.org/html/2609.34994v1#S5.F9)，CC BY 4.0；原圖未修改。

截至 2026-10-29，公開可讀的 [NONOTO 上游程式庫](https://github.com/SonyCSLParis/music-inpainting-ts)與 [TunesFormer 程式庫](https://github.com/sander-wood/tunesformer)可供理解背景，但不能代替本篇適配模型、生成對話資料與擴充介面的確切版本。這些本篇資產的可下載版本仍未確認。本文結果為作者報告，沒有獨立重現的模型評估。

證據邊界集中在幾處：主要是單音主旋律與和弦標記、IrishMan 域內材料、模板構造要求，以及固定的操作範圍。沒有跨曲風驗證、音樂家聽測或可控感研究，也缺與專門編輯系統的共同協定比較。訓練細節可讀，卻尚不足以推論成本、延遲、無效中間狀態的恢復能力或長對話穩定性。[§6–7](https://arxiv.org/html/2609.34994v1#S6)

## Bloss0m 的工程判斷：讓保留條件先成為可見物件

作者的實驗支持在指定環境下學會操作契約；Bloss0m 的延伸判斷是，創作工具設計可以先把「作品狀態、可改範圍、保留條件」寫清楚，再決定哪些步驟需要生成模型。如此一來，使用者說的「只改這裡」才有可比較的前後依據。這是工程解讀，尚無本篇以外媒體的跨域實測。

若任務僅是精確移調，作者也指出確定性符號演算法更適合；若要在多種操作間提供自然語言介面，這項研究才提供一個值得研究的設計點。部署時額外加入差異檢視、範圍檢查與接受修改前的驗證，是 Bloss0m 的建議，不是本文已評估的可靠性機制。

> **花花的工程提醒**
>
> 「保留原旋律」是一個可檢查的要求；「保留音樂意圖」還需要音樂家判斷。兩者之間的距離，正是後續使用者研究要補上的證據。

## 一手來源

- [完整論文 v1：方法、兩張表與九張圖](https://arxiv.org/html/2609.34994v1)
- [arXiv 版本與作者資訊](https://arxiv.org/abs/2609.34994v1)
- [NONOTO 上游介面程式庫](https://github.com/SonyCSLParis/music-inpainting-ts)
- [TunesFormer 與 IrishMan 背景資源](https://github.com/sander-wood/tunesformer)
