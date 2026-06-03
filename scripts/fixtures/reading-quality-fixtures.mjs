export const validPaperReadingBody = `
### §1 Introduction

Pipeline: parse → graph → retrieve → generate.

1. Parse PDF with MinerU
2. Build dual-graph (Figure 2)
3. Hybrid retrieval (Table 1)

**限制：** parser failure dominates (Appendix A.5).

**編者總評：** Worth POC on long PDFs.

See §3.2 and Table 4 for numbers.
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
