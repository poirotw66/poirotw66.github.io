---
stableId: "url:https://www.anthropic.com/research/project-swap"
status: "candidate"
firstSeenAt: 2026-09-28
lastVerifiedAt: 2026-09-28
primaryCategory: "Industry Pulse"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 4
  readerInterest: 5
  total: 23
decision: "write-now"
---

# Project Swap: What happens when agents trade for us?

## Identity

- Search window: Seven-day backfill ending 2026-09-28 (Asia/Taipei); the source is dated 2026-09-24, outside the strict 72-hour window.
- Discovery queries: `AI agents marketplace experiment preference negotiation`; `Anthropic Project Swap agent market results`; `agent preference elicitation model market efficiency`.
- Canonical URL: https://www.anthropic.com/research/project-swap
- Publisher or author: Anthropic Research, Economics.
- Published or updated date: 2026-09-24.
- Source type: First-party research-lab report.
- Direct supporting sources:
  - Full 26-page report linked from the research page: https://www-cdn.anthropic.com/3818cf6119b88f9714d995f6549fa8aac0bd5ab5/Project-Swap.pdf
  - The article cites its predecessor, Project Deal, as context; it is not used as evidence for Project Swap results.

## Editorial fit

- Why now: Agent marketplaces turn a simple model-quality question into a joint problem of preference elicitation, fiduciary behavior, market rules, and who can observe negotiations.
- Reader question: When an agent bargains for someone, is the main bottleneck negotiation skill—or whether the agent understood what that person wanted?
- Story hook: In this controlled book exchange, a five-minute preference conversation matched participant rankings on 61% of book pairs; the report attributes 85% of the gap from the best possible assignment to noisy preference estimates, not the decentralized trading floor.
- Category and topic cluster: Industry Pulse / `ai-agent`.
- Existing coverage and duplication risk: No matching bilingual Project Swap article or draft was found. The experiment is distinct from general agent negotiation demos because it measures participant preferences and compares actual-market outcomes with centralized allocation baselines.
- Why this remains useful after the current news cycle: Any agent allowed to make choices on a person's behalf needs tests for preference understanding and explicit rules for loyalty, consent, and marketplace visibility.

## Claim map

- Primary claim: In Anthropic's miniature market, errors in modeling participants' preferences accounted for most of the measured shortfall; stronger models also changed market outcomes more than the tested instruction variants.
- Measured evidence: 201 Anthropic employees across six office pools participated. The preference analysis reports 61% pairwise agreement for Fable 5 against participants' ranked books, compared with 50% random agreement. The decentralized market scored 0.55 against a 0.89 utilitarian optimum; the best assignment using Claude's noisy rankings scored 0.60, which the report uses to attribute 85% of the shortfall to preference representation. The authors also report 80 homogeneous-model reruns and 60 mixed-model floors, plus a participant survey three weeks later.
- Vendor or author claims requiring qualification: All cohort participants were Anthropic employees; market operations and model comparisons are Anthropic-run; the report is not an independent replication. Pairwise preference fit and the market efficiency metric are experiment-specific, not general rates for personal agents.
- Bloss0m engineering consequence: Evaluate the preference model separately from bargaining policy; show users where preference estimates are uncertain; define when an agent may compromise with another agent and which market logs participants can inspect.

## Evidence audit

- Primary evidence inspected: Anthropic Research article and its 26-page report, including the experiment design, reruns, market baselines, figures, appendix, and footnotes.
- Baseline or comparison: Random pairwise ranking, several Claude model families, neutral/ruthless/prosocial instructions, decentralized trading, Top Trading Cycles, and a utilitarian optimum computed from participant rankings.
- Missing evidence: Public participant-level raw data, runnable simulation code, external participant population, incentives beyond a low-stakes book swap, and independent replication.
- Conflicts or uncertainty: Most analyses exclude the Dublin pool because it had only three participants. The remaining participants are still Anthropic employees in a low-stakes book exchange; the findings should not be generalized to employment, healthcare, finance, or other high-stakes markets without new evidence.

## Recommended treatment

- Output level: write-now; durable-post-candidate, not a publication promise.
- Proposed angle: “The agents could trade; the hard part was knowing what their people wanted.” Use the 61% preference-fit result and 85% gap decomposition to explain why marketplace agents need user-representation tests before better negotiation strategies.
- Internal routes: Agent evaluation, multi-agent coordination, delegated authority, and AI economics.
- Human decision required: Approve before writing; identify all figures as Anthropic's own controlled study and keep the low-stakes employee sample in the headline caveat.
