# Paper-reading article template

Adapt the wording and order to the paper type. Preserve the teaching functions; do not publish placeholder headings mechanically. Read `reader-facing-editing.md` for separating publication prose from verification notes. This is a teaching outline, not an audit report.

```markdown
## 90 秒掌握論文 / The paper in 90 seconds

- **問題 / Problem:** ...
- **核心洞見 / Core insight:** ...
- **最強證據 / Strongest evidence:** ...
- **主要邊界 / Main boundary:** ...

Connect the problem, changed idea or question, investigation, central finding, and significance in a compact paper story here or within the opening map. Avoid repeating the same thesis. Give the source version in a brief note; normally continue straight into the problem and mechanism rather than add a dedicated provenance section. Put detailed source and artifact discussion after the main evidence unless needed to understand the argument.

## 理解前需要知道什麼 / What to know first

Define only the prerequisites used below.

## 核心直覺 / Core intuition

Contrast the previous decision rule with the new one before notation.

## 用一個例子走完整個方法 / Walk one example through the method

1. Input: ...
2. Intermediate representation: ...
3. Decision or transformation: ...
4. Output: ...
5. Likely failure point: ...

## 技術機制 / Technical mechanism

Explain the architecture and equations. Define symbols and operational effects.

## 實驗如何讀 / How to read the evidence

For each central result: question → controls → observation → explanation → boundary. Keep conditions needed to interpret that result nearby; consolidate recurring general limitations later.

## 證據地圖 / Evidence map

Explain which findings support the conclusion, what remains uncertain, and where engineering judgment begins. Use a compact table or connected prose when useful; do not publish internal claim classifications or pass/fail checklists mechanically. Retain locatable source anchors. Name diagnostic sections after the evidence available (for example, failure patterns or cost trade-offs); do not use an ablation heading unless the paper actually provides ablation evidence.

## Artifact 與可重現性 / Artifacts and reproducibility

Briefly state what readers can access as of the checked date, any material gate or missing component, and whether the article reports author results or an independent rerun. Link the usable artifacts. Omit browser/API errors, retry history, inspected-file inventories, and lists of commands not executed.

## Bloss0m 工程判斷與不適用條件 / Bloss0m engineering judgment and when not to use it

Label original recommendations here. If also discussing author recommendations, attribute those separately and mark where Bloss0m synthesis begins.

## 讀完後的三個記憶點 / Three things to remember

1. Technical idea: ...
2. Evidence: ...
3. Boundary: ...

## Primary sources
```

Before handoff, answer all seven Paper Essence Contract questions in `SKILL.md` using only the draft. If an answer cannot point to a section, revise the draft. Then reopen both saved files and perform the reader-facing publication gate on the complete final bodies, including inherited sections, headings, and captions. Keep teach-back answers, audit results, and figure exceptions in working notes or the final handoff.
