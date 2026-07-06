---
title: "Titanic — Machine Learning from Disaster"
description: "Kaggle 鐵達尼號生存預測完整實作：研究、漸進式特徵工程、CatBoost 與 RF 集成。Public LB 0.81578，合法解法區間上緣。"
pubDate: 2026-07-06
tier: lab
labZone: competition
subtitle: "Kaggle · CatBoost · Feature Engineering · StratifiedKFold"
repoUrl: "https://github.com/poirotw66/titanic"
metrics:
  - "Public LB 0.81578"
  - "pandas · CatBoost · sklearn"
  - "891 train / 418 test"
impact: "三條 pipeline 同分；Step 5 特徵配方單獨 +3% LB"
image: "/blog/37-kaggle-titanic-survival-prediction/title-image.webp"
---

[Kaggle Titanic](https://www.kaggle.com/competitions/titanic) 是入門表格分類的經典練習：依乘客特徵預測是否生還。本專案走完 **研究 → 漸進實作 → 提交 → 收尾** 的完整 ML 小循環，最終 **Public LB 0.81578**（約 341 / 418 正確），落在合法解法的實務上緣。

完整方法論與逐步教訓請見部落格文章：**[Kaggle Titanic：從 0.74 到 0.816，特徵工程比調參重要](/blog/37-kaggle-titanic-survival-prediction/)**。

---

## Context（情境）

小樣本表格二元分類（891 筆訓練、418 筆測試），評分指標為 **Accuracy**。目標不是追排行榜 1.0（多為查表作弊），而是在 **可重現、可解釋** 的前提下，驗證特徵工程、交叉驗證與 leaderboard 之間的落差。

## Challenge（痛點）

- 早期 Tier 1 特徵 + 換模型（RF → CatBoost → voting）只能推到 LB ~0.78，CV 卻常高於 LB。
- 粗暴 OneHot `Deck`、在 CV 外 fit 填補統計量，都會讓 OOF 樂觀、LB 回落。
- Optuna 把 CV 拉到 0.847，Public LB 反而降到 0.794。
- Notebook 移植若 scaler/encoder 未分開 fit，CV 可差 ~7%。

## Solution（架構＋做法）

單一入口 `train.py`，模組化 `features_*.py`：

```
data/train.csv, test.csv
    → features_kaggle815.py   (Step 5 — 815 notebook 特徵)
    → features_geeky837b.py   (Step 7b — 嚴格 ipynb 移植)
    → CatBoost / RF + StratifiedKFold
    → submission_step_blend.csv（預設：兩路存活機率平均）
```

| 提交檔 | 方法 | CV | Public LB |
| ------ | ---- | --- | --------- |
| `submission_step5.csv` | 815 notebook FE + CatBoost | 0.824 | **0.81578** |
| `submission_step7b.csv` | Geeky 嚴格移植 + RF | 0.836 | **0.81578** |
| `submission_step_blend.csv` | 兩路機率平均 | 0.833 | **0.81578** |

**對外展示以 Step 5 為主**；blend 為集成實驗（較 Step 5 改動 6 筆硬標籤，分數不變——對錯抵銷）。

### 快速開始

```bash
pip install -r requirements.txt
python train.py              # 預設 blend
python train.py --step 5     # CatBoost 單模
python train.py --step 7b    # RF 嚴格移植
```

## Impact（量化成效）

- **Public LB 0.81578**，較性別 baseline（~0.765）提升約 5 個百分點。
- Step 5 成熟特徵配方單獨將 LB 從 ~0.782 拉到 0.816（**+3.3%**）。
- 三條獨立 pipeline 在 public 上 **同分**，驗證了「配方對了，模型換皮邊際效益低」。

## 關鍵教訓

1. **特徵工程 > 調參** — 成熟 FE 配方一次拉開差距；Optuna 在小資料上易過擬合 fold。
2. **CV 高 ≠ LB 高** — 891 vs 418 的樣本切分讓 OOF 常與 leaderboard 脫鉤。
3. **嚴格 reproduce** — scaler/encoder 是否分開 fit，可差 ~7% CV。
4. **知道何時停** — 0.81578 已是誠實解法的實務天花板。

## 延伸閱讀

- 程式碼與文件：[GitHub — poirotw66/titanic](https://github.com/poirotw66/titanic)
- 完整實戰紀錄：[部落格文章](/blog/37-kaggle-titanic-survival-prediction/)
- 評估與離線指標脫鉤的類比：[部署模擬與評估覺醒](/blog/25-deployment-simulation/)
