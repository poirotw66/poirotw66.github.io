---
title: "Titanic — Machine Learning from Disaster"
description: "Kaggle Titanic survival prediction complete implementation: research, progressive feature engineering, and CatBoost & RF ensembling. Public LB 0.81578, the upper bound of the legitimate solution range."
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
image: "/blog/37-kaggle-titanic-survival-prediction/title_image.webp"
---

[Kaggle Titanic](https://www.kaggle.com/competitions/titanic) is a classic practice for introductory tabular classification: predicting survival based on passenger features. This project went through a complete ML mini-cycle of **research → progressive implementation → submission → wrap-up**, ultimately achieving a **Public LB of 0.81578** (approximately 341 / 418 correct), landing at the practical upper bound of legitimate solutions.

For the complete methodology and step-by-step lessons, please see the blog post: **[Kaggle Titanic: From 0.74 to 0.816, Feature Engineering is More Important than Hyperparameter Tuning](/blog/37-kaggle-titanic-survival-prediction/)**.

---

## Context

Small-sample tabular binary classification (891 training, 418 test), with the evaluation metric being **Accuracy**. The goal is not to chase a 1.0 on the leaderboard (mostly cheating by looking up the actual answers), but rather to verify the gap between feature engineering, cross-validation, and the leaderboard under the premise of being **reproducible and explainable**.

## Challenge

- Early Tier 1 features + switching models (RF → CatBoost → voting) could only push the LB to ~0.78, while CV was often higher than the LB.
- Bruteforce OneHot encoding of `Deck` or fitting imputation statistics outside of CV would lead to overly optimistic OOF scores and LB drop-offs.
- Optuna boosted CV to 0.847, but the Public LB actually dropped to 0.794.
- In Notebook porting, if scaler/encoder were not fitted separately, CV could differ by ~7%.

## Solution

Single entry point `train.py`, modular `features_*.py`:

```
data/train.csv, test.csv
    → features_kaggle815.py   (Step 5 — 815 notebook features)
    → features_geeky837b.py   (Step 7b — strict ipynb porting)
    → CatBoost / RF + StratifiedKFold
    → submission_step_blend.csv (default: average of two survival probabilities)
```

| Submission File | Method | CV | Public LB |
| ------ | ---- | --- | --------- |
| `submission_step5.csv` | 815 notebook FE + CatBoost | 0.824 | **0.81578** |
| `submission_step7b.csv` | Strict Geeky porting + RF | 0.836 | **0.81578** |
| `submission_step_blend.csv` | Average of two probabilities | 0.833 | **0.81578** |

**Public demonstration primarily focuses on Step 5**; the blend is an ensemble experiment (it changed 6 hard labels compared to Step 5, but the score remained the same—correct and incorrect changes offset each other).

### Quick Start

```bash
pip install -r requirements.txt
python train.py              # Default: blend
python train.py --step 5     # CatBoost single model
python train.py --step 7b    # RF strict porting
```

## Impact

- **Public LB 0.81578**, an improvement of about 5 percentage points over the gender baseline (~0.765).
- The mature feature recipe of Step 5 alone raised the LB from ~0.782 to 0.816 (**+3.3%**).
- Three independent pipelines achieved **the same score** on the public leaderboard, verifying that "when the recipe is right, switching the model has a low marginal benefit."

## Key Lessons

1. **Feature Engineering > Tuning** — A mature FE recipe immediately widens the gap; Optuna is prone to overfitting the folds on small data.
2. **High CV ≠ High LB** — The sample split of 891 vs 418 often decouples OOF from the leaderboard.
3. **Strict Reproduction** — Whether scaler/encoder are fitted separately can result in a ~7% difference in CV.
4. **Knowing When to Stop** — 0.81578 is practically the ceiling for honest solutions.

## Further Reading

- Code and Documentation: [GitHub — poirotw66/titanic](https://github.com/poirotw66/titanic)
- Complete Practical Record: [Blog Post](/blog/37-kaggle-titanic-survival-prediction/)
- Analogy for Evaluation Decoupling from Offline Metrics: [Deployment Simulation and Evaluation Awakening](/blog/25-deployment-simulation/)
