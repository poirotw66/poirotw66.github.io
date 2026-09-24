---
stableId: "url:https://github.com/AetherLabsAI/RSIAgent"
status: "durable-post-candidate"
firstSeenAt: 2026-09-22
lastVerifiedAt: 2026-09-22
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

# RSIAgent：Agent 不更新權重，也能靠「探索後凍結的經驗」自我改進嗎？

## Identity

- Search window: Seven-day backfill ending 2026-09-22; the linked arXiv paper was revised to v2 on 2026-09-18.
- Discovery queries: `RSIAgent recursive self-improvement frozen memory`; `broad then deep exploration actor verifier agent`; `RSIAgent OSWorld ALE benchmark repository`.
- Canonical URL: https://github.com/AetherLabsAI/RSIAgent
- Publisher or author: AetherLabsAI / RSIAgent authors.
- Published or updated date: Repository and paper checked 2026-09-22; arXiv v2 dated 2026-09-18.
- Source type: repository.
- Direct supporting sources:
  - Paper: https://arxiv.org/abs/2609.15364
  - Public repository: https://github.com/AetherLabsAI/RSIAgent

## Editorial fit

- Why now: The counterintuitive idea is simple and legible: improve an agent by changing its accumulated, verified experience rather than its weights.
- Reader question: Can a curriculum/actor/verifier loop discover a new environment's hidden rules, preserve them as memory, and reuse them without training the model?
- Category and topic cluster: AI Engineering / ai-agent.
- Existing coverage and duplication risk: The archive has agent self-improvement and evaluation topics, but no RSIAgent entry. Focus on the broad-then-deep memory lifecycle and the evidence caveats, not on repeating a generic “multi-agent” overview.
- Why this remains useful after the current news cycle: The separation between exploration, verification, memory consolidation, and frozen test-time reuse is a reusable architecture pattern.

## Claim map

- Primary claim: RSIAgent uses Curriculum, Actor, and Verifier agents to build environment-specific procedural memory and reuse it at test time while keeping model parameters fixed.
- Measured evidence: The repo exposes a three-phase runtime, demos, pinned OSWorld/ALE batches, stage ablations, and failure analysis; the paper reports improvements on OSWorld-v2 and Agent's Last Exam, including open-source models outperforming the paper's cited frontier baselines.
- Vendor or author claims requiring qualification: The reporting notes say RSI aggregates include recorded entries, retained baselines, selected retries, checkpoints, and protocol variants rather than fully matched repeated runs.
- Bloss0m engineering consequence: Treat agent improvement as a data lifecycle—explore, verify, consolidate, freeze, then evaluate—rather than assuming more autonomous practice automatically produces reliable memory.

## Evidence audit

- Primary evidence inspected: Public repository, architecture/method/results pages, pinned benchmark table, arXiv v2 metadata, and reporting caveats.
- Baseline or comparison: Shared harness with and without RSI; the repo reports OSWorld-V2 and ALE results plus stage/failure analysis.
- Missing evidence: Independent rerun, fully matched repeated runs, cost/latency of exploration, and evidence that frozen memory transfers across materially different environments.
- Conflicts or uncertainty: The headline “outperforms frontier models” depends on aggregation scope and protocol variants. Keep the matched/unmatched distinction visible.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: 「自我改進不一定要 fine-tune：RSIAgent 把探索、驗證與記憶凍結成一個可審計的 agent learning loop」。
- Internal routes: Link to agent evaluation, skills transfer, memory systems, and long-horizon reliability.
- Human decision required: Reproduce one small environment with broad → deep → frozen-memory phases before making a general claim about recursive self-improvement.
