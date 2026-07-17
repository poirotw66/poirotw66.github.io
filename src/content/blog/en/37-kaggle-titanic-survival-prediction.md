---
title: "Kaggle Titanic: From 0.74 to 0.816, Feature Engineering Outperforms Parameter Tuning"
description: "A complete practical record of the Titanic survival prediction competition: progressive feature engineering, CatBoost and RF ensembling, decoupling CV from Public LB, strict notebook porting, and knowing when to stop. Final Public LB 0.81578."
pubDate: 2026-07-06
category: "AI & Data Engineering"
tags: ["Kaggle", "Machine Learning", "Feature Engineering", "CatBoost", "Titanic"]
kind: guide
showToc: true
subtitle: "891 筆訓練、418 筆測試的小樣本表格分類 — 用一輪完整 ML 循環學會「配方比調參重要」"
image: "/blog/37-kaggle-titanic-survival-prediction/title_image.webp"
---
![Kaggle Titanic Survival Prediction — Public LB 0.81578](/blog/37-kaggle-titanic-survival-prediction/title_image.webp)

[Titanic - Machine Learning from Disaster](https://www.kaggle.com/competitions/titanic) is the most classic introductory competition on Kaggle: predicting whether passengers survived based on their features, with **Accuracy** as the evaluation metric. The dataset is small (891 records for training, 418 for testing), yet it condenses the core topics of tabular ML — **feature engineering, cross-validation, leaderboard generalization, and knowing when to stop**.

I have organized this implementation into a reproducible [GitHub project](https://github.com/poirotw66/titanic), and put a concise summary on the [Lab project page](/projects/titanic/). This article records the complete journey from research to wrap-up, detailing what was changed at each step, how the scores changed, and why I finally chose to stop at **Public LB 0.81578**.

---

## What Does the Problem Look Like?

This is not NLP, nor is it a deep learning task; it is **small-sample tabular binary classification**. Strong signals are very obvious during the EDA phase:

| Feature | Observation | Meaning |
| ---- | ---- | ---- |
| `Sex` | Female survival rate ~74% vs Male ~19% | "Women and children first" policy |
| `Pclass` | 1st class > 2nd class > 3rd class | Cabin class correlates with escape resources |
| `Name` | Contains titles like Mr/Mrs/Miss/Master | Can extract `Title` as a proxy for age and social role |
| `Cabin` | 77% missing in the training set | Requires domain inference, cannot be aggressively OneHot encoded |

Using only a gender baseline (predicting all females survive) yields about **0.765**. The **1.0** scores on the leaderboard are mostly from table-lookup cheating, which is not a reasonable ML goal (refer to [How top LB got their score](https://www.kaggle.com/tarunpaparaju/how-top-lb-got-their-score-use-titanic-to-learn)).

After more than a decade of community convergence, **the solution space is actually quite fixed**: Tier 1 features (Title, FamilySize, Age/Fare imputation) → `Pipeline` for leakage prevention → `StratifiedKFold` → tree models (CatBoost / RF). The differences mainly lie in **whether the feature recipe is mature**, and **whether you secretly fit statistics outside of CV**.

---

## Evolution Journey: Seven Steps and One Blend

I adopted a "commit at every step" approach, allowing each change to correspond to a quantifiable LB variation:

| Step | Changes | CV (5-fold) | Public LB | Thoughts |
| ---- | -------- | ------------ | --------- | ---- |
| 1–2 | Basic features / OneHot RF | ~0.83 | 0.74–0.75 | Insufficient features; aggressive Deck OneHot is unstable on test |
| 3–4 | CatBoost / soft voting | ~0.83 | 0.77–0.78 | Changed model but FE didn't keep up |
| **5** | **815 notebook FE + CatBoost** | 0.824 | **0.81578** | **Breakthrough (+3% LB)** |
| 6 | Step 5 features + Optuna | 0.847 | 0.794 | CV↑ LB↓ |
| 7 | Geeky target encoding (loose porting) | 0.763 | 0.734 | Notebook porting incomplete |
| 7b | Strict Geeky ipynb porting + RF | 0.836 | **0.81578** | Fitting scaler/encoder separately is crucial |
| blend | (p₅ + p₇b) / 2 | 0.833 | **0.81578** | Ensemble experiment; tied with single model on public |

Three different pipelines scored the **same** on the public leaderboard (about 341 / 418 correct). The outward presentation focuses on **Step 5**; the **blend** is an ensemble experiment — changing 6 hard labels compared to Step 5, but the score remains unchanged because the rights and wrongs cancelled out.

---

## Step 5: The Breakthrough lies in Feature Engineering, Not Changing Models

In Step 3, using CatBoost + self-developed Tier 1–2 features, the CV reached 0.838, but the LB was only 0.768. Step 4 performed soft voting, bringing the LB up to 0.782, still a distance away from 0.81.

The turning point occurred when porting the feature recipe from the [Kaggle 815 notebook](https://www.kaggle.com/code/eu1234/titanic-81-57-leaderboard-top-1-no-cheating) to `features_kaggle815.py`:

- **Combined train + test imputation** — for fields like Ticket, Deck, and Fare, calculating statistics after combining is more stable.
- **Domain features like Status, Lucky_family** — surpassing the textbook Tier 1 combinations.
- **Multi-step Deck inference** — you cannot directly fill missing values with `U` and then OneHot encode; a lesson from Step 2.
- **CatBoost** (depth=4, iter=1000, lr=0.0005) — friendly to categorical features, performs well on small data.

Result: CV 0.824 (actually lower than Step 3), but **LB jumped to 0.81578**. This is a classic **"OOF is not the only truth"** case — what you are optimizing is the generalization to **another 418 records**, not resampling within the folds.

If you can only remember one thing: **On a problem like Titanic, the ROI of investing in a mature feature recipe is far higher than changing classifiers or tuning hyperparameters.**

---

## Step 6: A Warning from Optuna — CV 0.847, LB 0.794

After Step 5 stabilized, I used Optuna to do a 50-trial hyperparameter search on CatBoost. The CV mean rose to **0.847** (+2.3%), but the Public LB dropped to **0.794** (-2.2%).

On small datasets (891 records), hyperparameter search can easily **overfit to noise patterns within the folds**, looking good on OOF but poor on the leaderboard. This is different from "evaluation awakening" in the LLM field, but the essence is similar: **the metric you optimize might not equal the metric that real-world deployment (or the hidden test) cares about**. I discussed another dimension in [Deployment Simulation and Evaluation Awakening](/blog/25-deployment-simulation/), but the vigilance against "offline metric decoupling" is common.

**Conclusion: Use Step 5 for production submission, stop chasing CV extremes.**

---

## Step 7 vs 7b: Strict Reproduce Makes a 7% CV Difference

I also ported the [Geeky Codes Advanced FE Tutorial](https://geekycodes.in/python/titanic-advanced-feature-engineering-tutorial/):

- **Step 7 (Loose version)** — simplified porting, inexact handling of target encoding and scaler → CV 0.763, LB 0.734.
- **Step 7b (Strict ipynb porting)** — `features_geeky837b.py` aligns with the notebook: `StandardScaler` and encoder are **fit separately** → CV 0.836, LB **0.81578**.

From the same tutorial and the same set of feature concepts, **implementation details** (what data range statistics are fit on, whether train/test leakage occurs) can result in a ~7% CV difference, yet the LB might coincidentally be the same (the two routes diverge on 10 records, cancelling out on public).

The takeaway for engineers is very direct: **"I followed the tutorial" does not equal "I reproduced the results."**

---

## Blend: Ensemble Experiment, No Win on Public, but a Complete Process

The final default output is `submission_step_blend.csv`: the **average of survival probabilities** from Step 5 (CatBoost) and Step 7b (RF), then thresholded at 0.5 into hard labels.

- The two routes have **97.6%** agreement on hard labels.
- The blend only changes 6 records, the public LB remains **0.81578**.
- OOF CV 0.833, sitting between the two single models.

For an ensemble to be effective, you need **different error modes** (diversify). Here, the two pipelines are too similar to pull ahead on public; if there are differences after the private LB is revealed, taking note of it is enough, there's no need to keep grinding for score.

```bash
pip install -r requirements.txt
python train.py              # Default blend
python train.py --step 5     # CatBoost single model
python train.py --step 7b    # RF strict porting
```

For code structure, see the [GitHub repo](https://github.com/poirotw66/titanic): `train.py` is the single entry point, `features_kaggle815.py` / `features_geeky837b.py` are modularized, and research notes are in `docs/ml-research-best-model.md`.

---

## Five Takeaway Lessons

1. **Feature Engineering > Parameter Tuning** — Step 5 alone pulled the LB from ~0.782 to 0.816 using mature FE; Optuna was actually harmful.
2. **High CV ≠ High LB** — With 891 for training and 418 for testing, decoupling between OOF and the leaderboard is very common; you should chase **reproducible generalization**, not the extreme fold score.
3. **Pipeline Leakage Prevention** — Imputation, encoding, and scaling must be done within the folds or properly encapsulated; fitting on the full data and then doing CV will result in an optimistic bias.
4. **Strict Reproduce** — The "spirit" of a tutorial notebook and "line-by-line alignment" are vastly different; Step 7 vs 7b is a living example.
5. **Know When to Stop** — 0.81578 falls at the **upper edge** of the legitimate solution range (~0.78–0.82); chasing 1.0 or grinding for 0.84+ again has extremely low marginal benefit.

---

## Distance from "Enterprise AI Engineering"

Titanic is a practice problem, not the main quest of Agentic RAG or document intelligence. But the skills it trains are still useful in practice:

- **Tabular features and domain knowledge** — ETL and feature design for enterprise structured data.
- **Offline vs. Online metrics** — Belongs to the same family as the gap in A/B testing and shadow deployment.
- **Reproducibility and modularization** — `features_*.py` + single CLI is easier to maintain than a monolithic notebook.

If you are also doing Kaggle introductions or want to organize your portfolio, I recommend **copying the architecture + copying Tier 1 features, then submitting after local CV verification**, instead of blindly copying top kernels.

---

## Extended Links

- **Code**: [github.com/poirotw66/titanic](https://github.com/poirotw66/titanic)
- **Lab Project Summary**: [/projects/titanic/](/projects/titanic/)
- **Step 5 Reference Notebook**: [Titanic 81.57% — no cheating](https://www.kaggle.com/code/eu1234/titanic-81-57-leaderboard-top-1-no-cheating)
- **Step 7b Reference Tutorial**: [Advanced Feature Engineering Tutorial](https://geekycodes.in/python/titanic-advanced-feature-engineering-tutorial/)
- **Competition Homepage**: [kaggle.com/competitions/titanic](https://www.kaggle.com/competitions/titanic)
