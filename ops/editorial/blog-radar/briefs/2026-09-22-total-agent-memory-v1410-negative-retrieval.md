---
stableId: "url:https://github.com/vbcherepanov/total-agent-memory/releases/tag/v14.1.0"
status: "durable-post-candidate"
firstSeenAt: 2026-09-22
lastVerifiedAt: 2026-09-22
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 23
decision: "write-now"
---

# total-agent-memory v14.1.0：記憶檢索不只找支持證據，也要主動搜尋反例

## Identity

- Search window: Strict 72-hour scan ending 2026-09-22; the official release was published 2026-09-21.
- Discovery queries: `total-agent-memory v14.1.0 negative retrieval`; `memory_answer contradiction abstention`; `total-agent-memory LongMemEval benchmark limitations`.
- Canonical URL: https://github.com/vbcherepanov/total-agent-memory/releases/tag/v14.1.0
- Publisher or author: total-agent-memory maintainers.
- Published or updated date: 2026-09-21.
- Source type: release-notes.
- Direct supporting sources:
  - Repository and benchmark notes: https://github.com/vbcherepanov/total-agent-memory
  - Release history: https://github.com/vbcherepanov/total-agent-memory/releases

## Editorial fit

- Why now: v14.1.0 makes contradiction-seeking retrieval and abstention thresholds concrete in a small open-source change, while the repository records both ambitious benchmark numbers and corrections.
- Reader question: How can a memory system detect that its first retrieved answer is too convenient, incomplete, or contradicted by another memory?
- Category and topic cluster: AI Engineering / ai-agent.
- Existing coverage and duplication risk: No bilingual article or matching Radar entry was found. The article should emphasize retrieval policy and evidence calibration, not repeat generic vector-memory introductions.
- Why this remains useful after the current news cycle: Negative evidence, abstention, and correction logs are reusable design patterns for agent memory and RAG.

## Claim map

- Primary claim: The release adds a second, contradiction-seeking retrieval pass and makes the answer path expose abstention/caveat thresholds.
- Measured evidence: The release documents negative retrieval in `memory_answer`, thresholds of 0.60 for abstention and 0.30–0.60 for caveats, plus schema-constrained output for Anthropic and Ollama. The repository reports 1M-message latency, LongMemEval-style recall, corrected LoCoMo scores, and three-seed spread.
- Vendor or author claims requiring qualification: Repository benchmarks are self-reported; the corrected LoCoMo result and seed spread are useful transparency but not independent validation.
- Bloss0m engineering consequence: Treat contradiction search as a policy-controlled retrieval stage, log why an answer abstained, and keep threshold calibration separate from model confidence rhetoric.

## Evidence audit

- Primary evidence inspected: Signed GitHub release, repository implementation/README, benchmark notes, and correction/limitation disclosures.
- Baseline or comparison: Prior single-pass memory answer behavior versus the v14.1.0 negative-retrieval path.
- Missing evidence: Independent reruns, workload-specific threshold calibration, adversarial contradiction sets, and user-impact measurement for abstention.
- Conflicts or uncertainty: The release is narrow; benchmark claims live primarily in the repository. Keep the article anchored on the inspectable implementation and report numbers as author results.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: 「RAG 的下一步不是更多 top-k，而是找反例：total-agent-memory 如何把 contradiction、abstention 與 caveat 寫進 memory contract」。
- Internal routes: Link to RAG evaluation, provenance contracts, agent memory, and evidence-aware answer generation.
- Human decision required: Reproduce the threshold behavior on a tiny contradictory-memory fixture before calling it a reliability improvement.
