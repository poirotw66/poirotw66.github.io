---
title: "Kaggle Titanic：從 0.74 到 0.816，特徵工程比調參重要"
description: "鐵達尼號生存預測競賽的完整實戰紀錄：漸進式特徵工程、CatBoost 與 RF 集成、CV 與 Public LB 脫鉤、嚴格 notebook 移植，以及何時該停手。最終 Public LB 0.81578。"
pubDate: 2026-07-06
updatedDate: 2026-07-06
tldr:
  - "鐵達尼號生存預測競賽的完整實戰紀錄：漸進式特徵工程、CatBoost 與 RF 集成、CV 與 Public LB 脫鉤、嚴格 notebook 移植，以及何時該停手"
  - "最終 Public LB 0.81578"
  - "891 筆訓練、418 筆測試的小樣本表格分類 — 用一輪完整 ML 循環學會「配方比調參重要」"
audience:
  - "對 AI Engineering、實作方法與技術決策感興趣的工程師及產品團隊。"
  - "希望拿到可執行重點，而不只是行銷摘要的讀者。"
category: "AI Engineering"
tags: ["Machine Learning","Data Engineering","AI"]
kind: guide
showToc: true
subtitle: "891 筆訓練、418 筆測試的小樣本表格分類 — 用一輪完整 ML 循環學會「配方比調參重要」"
image: "/blog/37-kaggle-titanic-survival-prediction/title_image.jpg"
---
![Kaggle Titanic 生存預測 — Public LB 0.81578](/blog/37-kaggle-titanic-survival-prediction/title_image.jpg)

[Titanic - Machine Learning from Disaster](https://www.kaggle.com/competitions/titanic) 是 Kaggle 上最經典的入門競賽：依乘客特徵預測是否生還，評分指標為 **Accuracy**。資料量小（訓練 891 筆、測試 418 筆），卻濃縮了表格 ML 的核心課題——**特徵工程、交叉驗證、leaderboard 泛化、以及何時該停手**。

我將這次實作整理成可重現的 [GitHub 專案](https://github.com/poirotw66/titanic)，並在 [Lab 專案頁](/projects/titanic/) 放上精簡摘要。本文記錄從研究到收尾的完整路線，以及每一步換了什麼、分數怎麼變、為什麼最後選擇停在 **Public LB 0.81578**。

---

> **花花的一句話**：喵！比起盲目地調整參數，找出最適合的特徵配方才是預測生還的關鍵，就像挑選最對味的貓罐頭一樣重要！
>
> **花花的工程提醒**：在處理小樣本的表格資料時，務必建立穩健的交叉驗證 (CV) 機制，並將其與 Public LB 脫鉤，以避免模型過度擬合。

## 問題長什麼樣？

這不是 NLP，也不是深度學習任務，而是 **小樣本表格二元分類**。強訊號在 EDA 階段就很明顯：

| 特徵 | 觀察 | 含義 |
| ---- | ---- | ---- |
| `Sex` | 女性生還率 ~74% vs 男性 ~19% | 「婦女幼兒優先」政策 |
| `Pclass` | 1 等 > 2 等 > 3 等 | 艙等與逃生資源相關 |
| `Name` | 含 Mr/Mrs/Miss/Master 等稱謂 | 可萃取 `Title`，代理年齡與社會角色 |
| `Cabin` | 訓練集 77% 缺失 | 需 domain 推斷，不可粗暴 OneHot |

僅用性別 baseline（全判女性存活）約 **0.765**。排行榜上的 **1.0** 多為查表作弊，不是合理的 ML 目標（參考 [How top LB got their score](https://www.kaggle.com/tarunpaparaju/how-top-lb-got-their-score-use-titanic-to-learn)）。

社群經過十餘年收斂後，**解法空間其實很固定**：Tier 1 特徵（Title、FamilySize、Age/Fare 填補）→ `Pipeline` 防洩漏 → `StratifiedKFold` → 樹模型（CatBoost / RF）。差異主要在 **特徵配方是否成熟**，以及 **你有沒有在 CV 外偷偷 fit 統計量**。

---

## 演進路線：七個 Step 與一個 blend

我採用「一步一提交」的方式，讓每次改動對應可量化的 LB 變化：

| Step | 變更內容 | CV（5-fold） | Public LB | 心得 |
| ---- | -------- | ------------ | --------- | ---- |
| 1–2 | 基礎特徵 / OneHot RF | ~0.83 | 0.74–0.75 | 特徵不足；Deck 粗暴 OneHot 在 test 不穩 |
| 3–4 | CatBoost / soft voting | ~0.83 | 0.77–0.78 | 換模型但 FE 沒跟上 |
| **5** | **815 notebook FE + CatBoost** | 0.824 | **0.81578** | **突破（+3% LB）** |
| 6 | Step 5 特徵 + Optuna | 0.847 | 0.794 | CV↑ LB↓ |
| 7 | Geeky target encoding（鬆散移植） | 0.763 | 0.734 | notebook 移植不完整 |
| 7b | Geeky 嚴格 ipynb 移植 + RF | 0.836 | **0.81578** | scaler/encoder 分開 fit 很關鍵 |
| blend | (p₅ + p₇b) / 2 | 0.833 | **0.81578** | 集成實驗；public 與單模平手 |

三條不同 pipeline 在 public 榜上 **同分**（約 341 / 418 正確）。對外展示以 **Step 5** 為主；**blend** 是集成實驗——較 Step 5 改動 6 筆硬標籤，分數不變，因為對錯抵銷。

---

## Step 5：突破點在特徵工程，不在換模型

Step 3 用 CatBoost + 自研 Tier 1–2 特徵，CV 已到 0.838，LB 卻只有 0.768。Step 4 做 soft voting，LB 爬到 0.782，仍離 0.81 有距離。

轉折發生在移植 [Kaggle 815 notebook](https://www.kaggle.com/code/eu1234/titanic-81-57-leaderboard-top-1-no-cheating) 的特徵配方到 `features_kaggle815.py`：

- **train + test 合併填補** — 對 Ticket、Deck、票價等欄位，合併後再算統計量更穩定。
- **Status、Lucky_family 等 domain 特徵** — 超越教科書 Tier 1 的組合。
- **Deck 多步推斷** — 不能直接把缺失填 `U` 再 OneHot；Step 2 的教訓。
- **CatBoost**（depth=4, iter=1000, lr=0.0005）— 類別特徵友好，小資料表現佳。

結果：CV 0.824（反而比 Step 3 低），但 **LB 跳到 0.81578**。這是典型的 **「OOF 不是唯一真理」** 案例——你優化的是泛化到 **另一份 418 筆**，不是 fold 內的重抽樣。

若只能記一件事：**在 Titanic 這種題目上，投資成熟特徵配方的報酬率，遠高於換分類器或調超參。**

---

## Step 6：Optuna 的警示 — CV 0.847，LB 0.794

Step 5 穩定後，我用 Optuna 對 CatBoost 做 50 trials 超參搜尋。CV mean 升到 **0.847**（+2.3%），Public LB 卻掉到 **0.794**（-2.2%）。

小資料（891 筆）上，超參搜尋很容易 **過擬合 fold 內的雜訊模式**，在 OOF 上好看、在 leaderboard 上難看。這和 LLM 領域的「評估覺醒」不同，但本質類似：**你優化的指標，未必等於真實部署（或 hidden test）關心的指標**。我在 [部署模擬與評估覺醒](/blog/25-deployment-simulation/) 討論的是另一個維度，但「離線指標脫鉤」的警覺是相通的。

**結論：生產提交用 Step 5，不再追 CV 極致。**

---

## Step 7 vs 7b：嚴格 reproduce 差 7% CV

我另外移植了 [Geeky Codes 進階 FE 教學](https://geekycodes.in/python/titanic-advanced-feature-engineering-tutorial/)：

- **Step 7（鬆散版）** — 簡化移植，target encoding 與 scaler 處理不嚴謹 → CV 0.763，LB 0.734。
- **Step 7b（嚴格 ipynb 移植）** — `features_geeky837b.py` 對齊 notebook：`StandardScaler` 與 encoder **分開 fit** → CV 0.836，LB **0.81578**。

同一份教學、同一套特徵概念，**實作細節**（統計量在哪個資料範圍 fit、train/test 是否洩漏）可以讓 CV 差 ~7%，LB 卻可能碰巧相同（兩條路線在 10 筆上分歧、public 上互抵）。

這對工程師的啟示很直接：**「我有照 tutorial 做」不等於「我 reproduce 了結果」。**

---

## Blend：集成實驗，public 沒有贏，但流程完整

最終預設產出 `submission_step_blend.csv`：Step 5（CatBoost）與 Step 7b（RF）的 **存活機率平均**，再 threshold 0.5 轉硬標籤。

- 兩條路線 **97.6%** 硬標籤一致。
- blend 只改 6 筆，public LB 仍 **0.81578**。
- OOF CV 0.833，介於兩單模之間。

集成要有效，需要 **錯誤模式不同**（diversify）。這裡兩條 pipeline 太像，public 上拉不開差距；若 private LB 公布後有差異，再記一筆即可，不必為此繼續刷分。

```bash
pip install -r requirements.txt
python train.py              # 預設 blend
python train.py --step 5     # CatBoost 單模
python train.py --step 7b    # RF 嚴格移植
```

程式結構見 [GitHub repo](https://github.com/poirotw66/titanic)：`train.py` 單一入口，`features_kaggle815.py` / `features_geeky837b.py` 模組化，研究筆記在 `docs/ml-research-best-model.md`。

---

## 五個可帶走的教訓

1. **特徵工程 > 調參** — Step 5 單靠成熟 FE 將 LB 從 ~0.782 拉到 0.816；Optuna 反而有害。
2. **CV 高 ≠ LB 高** — 訓練 891、測試 418，OOF 與 leaderboard 脫鉤很常見；應追 **可重現的泛化**，不是 fold 分數極致。
3. **Pipeline 防洩漏** — 填補、編碼、scaling 必須在 fold 內或正確封裝；全資料 fit 再 CV 會樂觀偏差。
4. **嚴格 reproduce** — 教學 notebook 的「精神」與「逐行對齊」差很多；Step 7 vs 7b 是活生生的例子。
5. **知道何時停** — 0.81578 落在合法解法 ~0.78–0.82 的 **上緣**；追 1.0 或再刷 0.84+ 的邊際效益極低。

---

## 和「企業 AI 工程」的距離

Titanic 是練功題，不是 Agentic RAG 或 document intelligence 主線。但它訓練的能力在實務裡仍然有用：

- **表格特徵與 domain 知識** — 企業結構化資料的 ETL 與特徵設計。
- **離線 vs 線上指標** — 和 A/B、shadow deployment 的落差同一個家族。
- **可重現與模組化** — `features_*.py` + 單一 CLI，比一坨 notebook 好維護。

若你也在做 Kaggle 入門或想整理 portfolio，建議 **抄架構 + 抄 Tier 1 特徵，本地 CV 驗證後再提交**，不要盲抄 top kernel。

---

## 延伸連結

- **程式碼**：[github.com/poirotw66/titanic](https://github.com/poirotw66/titanic)
- **Lab 專案摘要**：[/projects/titanic/](/projects/titanic/)
- **Step 5 參考 notebook**：[Titanic 81.57% — no cheating](https://www.kaggle.com/code/eu1234/titanic-81-57-leaderboard-top-1-no-cheating)
- **Step 7b 參考教學**：[Advanced Feature Engineering Tutorial](https://geekycodes.in/python/titanic-advanced-feature-engineering-tutorial/)
- **競賽主頁**：[kaggle.com/competitions/titanic](https://www.kaggle.com/competitions/titanic)
