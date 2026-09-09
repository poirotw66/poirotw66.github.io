---
stableId: "url:https://huggingface.co/blog/funes"
status: "durable-post-candidate"
firstSeenAt: 2026-09-06
lastVerifiedAt: 2026-09-06
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 4
  engineeringValue: 5
  archiveFit: 5
  total: 24
decision: "write-now"
---

# Give Your Coding Agents a Memory You Own：把工作記憶變成可攜、可追溯的資料集

## Identity

- Search window: strict 72-hour scan from 2026-09-03 00:31Z to 2026-09-06 00:31Z.
- Discovery queries: `coding agent memory open source September 2026`; `site:huggingface.co/blog agent memory provenance`; `site:github.com/huggingface/funes`.
- Canonical URL: https://huggingface.co/blog/funes
- Publisher or author: Hugging Face community / David Corvoysier.
- Published or updated date: 2026-09-03.
- Source type: engineering-blog.
- Direct supporting sources:
  - Open-source repository: https://github.com/huggingface/funes
  - Handoff-versus-recall benchmark: https://huggingface.co/datasets/dacorvo/funes-handoff-recall-benchmark
  - Public memory dataset: https://huggingface.co/datasets/huggingface/funes-memory

## Editorial fit

- Why now: Coding agents increasingly work across machines and vendors, but their most valuable context—decisions, failed approaches, and rationale—usually disappears with the session. Funes turns that context into an inspectable local dataset and offers an optional private Hub sync.
- Reader question: How can an agent remember prior engineering decisions without hiding the evidence inside a proprietary memory service or flattening it into an untraceable summary?
- Category and topic cluster: AI Engineering / ai-agent.
- Existing coverage and duplication risk: This is distinct from hosted agent-memory announcements and from paper-level continual-retrieval work: the concrete angle is trace ingestion, append-only storage, cross-agent portability, and publication guardrails.
- Why this remains useful after the current news cycle: The design principles—raw evidence retention, deterministic indexing, bounded incremental updates, explicit dataset ownership, and source-linked recall—apply to any long-lived agent workflow.

## Claim map

- Primary claim: Funes is an open-source, local-first memory layer that indexes traces from Claude Code, Codex, pi, and Hermes into a shared turn/block shape, then lets agents recall original passages with session, timestamp, and turn provenance.
- Measured evidence: The article reports a small two-task handoff-versus-recall benchmark in which recall succeeded on both tasks and was reported as 4x to 8x cheaper than a written handoff. The repository exposes the binary, integrations, benchmark dataset, and public memory example for inspection.
- Vendor or author claims requiring qualification: The benchmark is author-supplied, small, and not an independent comparison of all agent memory systems. “Private by default,” secret redaction, and local processing are documented implementation intentions and should be checked against the current code and deployment configuration.
- Bloss0m engineering consequence: Treat agent memory as a versioned evidence pipeline: preserve raw turns, attach stable source coordinates, separate local indexing from optional sharing, and make publish-time secret scanning an explicit gate rather than a prompt instruction.

## Evidence audit

- Primary evidence inspected: Dated Hugging Face article, public `huggingface/funes` repository, repository security documentation link, handoff-versus-recall benchmark dataset, and public memory dataset.
- Baseline or comparison: The article compares recall with written handoff and compaction on two tasks; the repository documents the indexing and retrieval pipeline, supported agents, binary release/checksum path, and import contract.
- Missing evidence: Independent benchmark replication, larger task suites, recall precision/latency curves, storage growth, model-quality sensitivity, multi-user access tests, and a security audit of the publishing gate.
- Conflicts or uncertainty: The article is a community post rather than a formal Hugging Face product announcement. It is strong as an inspectable artifact and design case study, but the quantitative comparison remains an author claim until independently reproduced.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “不要把 agent memory 做成黑盒摘要：Funes 如何用 append-only traces、local retrieval 與 dataset ownership 保留工程決策的來龍去脈。”
- Internal routes: Link to existing agent-memory, continual-retrieval, provenance, and governance coverage; contrast with hosted memory products and with Paper Radar work on reconstructable agent decisions.
- Human decision required: Approve a write-now article only if the draft clearly separates repository-verifiable behavior from the two-task benchmark claim and treats remote publishing as an explicit data-sharing decision.
