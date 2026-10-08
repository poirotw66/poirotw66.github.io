---
stableId: "url:https://arxiv.org/abs/2610.08662"
status: "durable-post-candidate"
firstSeenAt: 2026-10-08
lastVerifiedAt: 2026-10-08
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 24
decision: "write-now"
---

# ParanoiaEval: Benchmarking Unnecessary Defensive Work in Agentic Coding

## Identity

- Search window: 2026-10-05 to 2026-10-08; primary source submitted 2026-10-06.
- Discovery queries: `AI agent incident failure postmortem October 2026`; `AI coding agent benchmark evaluation paper arXiv October 2026`; `agentic coding unnecessary defensive work benchmark`.
- Canonical URL: https://arxiv.org/abs/2610.08662
- Publisher or author: Hanjun Luo, Xiucheng Zhang, Zhuoning Xu, Zhimu Huang, Yingbin Jin, Xinfeng Li, and Hanan Salam; affiliations include New York University and The Hong Kong Polytechnic University.
- Published or updated date: 2026-10-06 (arXiv v1).
- Source type: research-lab.
- Direct supporting sources: [full paper](https://arxiv.org/html/2610.08662v1); [benchmark, paired tasks, runners, and judge](https://github.com/ZhuoningXu/ParanoiaEval_release).

## Editorial fit

- Why now: A new controlled benchmark puts numbers on an agent failure mode that ordinary correctness scores miss: doing defensive work after context has already resolved the risk.
- Reader question: When does an agent's caution protect a codebase, and when does it add work developers will reject?
- Story hook: Across 9,600 author-run evaluations, unnecessary risk treatment appeared in 11.2%–58.7% of runs; in the authors' 20-developer post-hoc study, excess-treatment runs scored 1.27 points lower in satisfaction and were accepted as-is 38% versus 78% of the time.
- Category and topic cluster: AI Engineering / ai-agent.
- Existing coverage and duplication risk: No matching source ID, URL, bilingual draft, or content entry was found. It is adjacent to agent evaluation coverage but focuses on over-treatment and developer acceptance.
- Why this remains useful after the news cycle: Agent evaluations and code review should measure whether a change is warranted, not only whether it is syntactically valid or task-complete.

## Claim map

- Primary claim: Risk-treatment judgment is a distinct agent capability; more capable task completion does not guarantee that the agent chooses an appropriate response to risk.
- Measured evidence: The paper reports 200 evidence-controlled task pairs, eight models, two harnesses, 9,600 runs, and a post-hoc human study with 20 developers. Treatment violations corresponded to a 1.27-point lower satisfaction rating and 38% versus 78% as-is acceptance.
- Vendor or author claims requiring qualification: Results are author-run and the human study is small and region-bounded. The paper does not quantify long-term maintenance costs.
- Bloss0m engineering consequence: Include paired-context cases in agent evals and make code review ask whether each defensive change responds to evidence in the repository.

## Evidence audit

- Primary evidence inspected: arXiv v1 abstract, methods, human-study design/results, limitations, judge validation, and artifact repository.
- Baseline or comparison: Matched repository tasks differ only in treatment-defining evidence; eight model configurations are run with Claude Code and Codex harnesses.
- Missing evidence: No independent replication, full trajectories, or experimental result bundle was verified in the public repository.
- Conflicts or uncertainty: The judge is agentic but calibrated against human annotation; task evidence is more controlled and salient than context scattered across a live team's tools.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “Sometimes the agent protects the code from a risk that is already gone—and the developer trusts the result less.” Explain the paired-task setup, satisfaction/acceptance evidence, and why the reported percentages are not production prevalence estimates.
- Internal routes: Existing agent-evaluation and code-review-workflow posts, after route-level duplication review.
- Human decision required: Approve the bilingual drafting topic; keep the 20-participant human-study scope visible and attribute every result to the paper.
