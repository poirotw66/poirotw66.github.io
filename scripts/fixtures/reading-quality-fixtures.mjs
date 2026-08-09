export const validPaperReadingBody = `
## Reader question and evidence map

Paper evidence, author claims, and our engineering judgment are separated here.

## Method

Pipeline: parse → graph → retrieve → generate.

1. Parse PDF with MinerU
2. Build dual-graph (Figure 2)
3. Hybrid retrieval (Table 1)

## Experimental setup

The dataset and benchmark compare two baselines with accuracy and latency metrics on one GPU.

## Ablation and limitations

The ablation and failure analysis show that parser failure dominates (Appendix A.5).

## Artifact and reproducibility

As of 2026-08-09, the repository and dataset are accessible; the checkpoint is gated.

## Engineering implications and when not to use it

**編者總評：** Worth POC on long PDFs.

See §3.2 and Table 4 for numbers.

## Primary sources

[Full paper](https://example.com/paper)
`.trim();

export const bannedPartOneBody = `
## 第一部分

Summary only.
`.trim();

export const thinPaperBody = `
Short note without anchors.
`.trim();

export const validBlogDeepReadBody = `
### 原文出處

Author (2026). Title. https://example.com/post

### 概念地圖

| Term | Meaning |
|------|---------|
| A | Alpha |

See Figure 1 and Table 2 in §2.

**編者判斷：** The source understates operational cost.
`.trim();
