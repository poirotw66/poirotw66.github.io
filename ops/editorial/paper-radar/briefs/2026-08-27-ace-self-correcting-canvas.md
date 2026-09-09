---
stableId: "arxiv:2608.24103"
status: "deep-read-candidate"
firstSeenAt: 2026-08-27
lastVerifiedAt: 2026-08-27
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "deep-read-candidate"
---

# ACE: a self-correcting agent for presentation canvas editing

## Identity

- Stable ID: arxiv:2608.24103.
- Source version: v1.
- First submitted: 2026-08-25.
- Canonical URL: https://arxiv.org/abs/2608.24103
- Venue or status: arXiv preprint; EMNLP 2026 Industry Track acceptance stated by the project repository.
- Public artifacts: https://github.com/BloomBerry/agentic-canvas-editor and https://huggingface.co/datasets/BloomBerry/figma-slide-benchmark

## Editorial fit

- Reader question: Can a document-editing agent improve its own slides without relying on a pixel-perfect reference as the only definition of correctness?
- Series track: Agent Systems.
- Named gap: Agent evaluation—ground-truth-free judging, self-correction, and artifact-level rollback.
- Why now: Presentation automation exposes both agent action complexity and the evaluation problem: many valid designs differ from the reference file.

## Claim map

- Problem: Flat absolute-positioned document formats make agents recompute coordinates, while reference-diff metrics can punish valid alternative designs.
- Main claim: ACE uses a hierarchical scene graph, a 98-tool presentation action space, CARE content-aware routing, and a self-correction loop driven by an instruction-following judge.
- Reported results: On a 94-task benchmark, ACE reports IF 4.23 versus 3.81 for an HTML agentic baseline, 1.75× speed, and roughly 44% lower cost; the source reports paired significance and out-of-loop judge replication.
- Human evidence: Twenty-six blind raters prefer ACE overall at a 58.7% decisive win rate, and prefer self-corrected output in 81% of comparisons.
- Reliability mechanism: The system halts after a threshold or max iterations and uses strict-peak rollback to remove observed regressions.

## Evidence audit

- Datasets and benchmarks: The paper reports 94 evaluable tasks; the repository publishes execution logs and a benchmark case, while the slide decks are not bundled because they contain third-party content.
- Baselines: Same-backbone agentic HTML pipeline, single-turn scene-graph editor, Claude-Skill, and PPTArena are referenced in the paper’s comparisons.
- Ablations: CARE routing, self-correction, judge variants, and out-of-loop evaluation are described; exact statistical tables and per-task results require full-paper reading.
- Uncertainty and threats: Ground-truth-free judging can encode aesthetic or instruction-following bias; the external rater sample is small and the task distribution may favor structured canvas operations.

## Reproducibility

- Code: Public GitHub repository includes the Python orchestrator, TypeScript MCP tools, Figma plugin, benchmark case, execution logs, and mock mode.
- Model: The paper/repository mention Claude Sonnet 4.6 and GPT-5.5 judge configurations; exact prompt and runtime settings require audit.
- Data and license: Code is public under Apache-2.0; benchmark decks are not bundled and require user-owned Figma Slides files in live mode.
- Setup obstacles: Live reproduction needs API keys, Figma access, multiple local services, and a desktop plugin; mock mode can verify pipeline logic without credentials.
- Estimated reproduction scope: Mock and log analysis are practical; full benchmark reproduction is moderate to substantial.

## Critical reading

- Strongest result: The paper combines a useful document representation, context routing, self-correction, and rollback with publicly inspectable logs rather than only a final score.
- Weakest assumption: An instruction-following judge is a sufficiently stable proxy for presentation quality across different valid designs.
- Limitations: Results may not transfer to arbitrary document types, brand-sensitive layouts, or tasks requiring factual content decisions.
- The evidence does not support: A claim that self-correction universally improves creative document editing or that the judge replaces human review.

## Bloss0m connection

- Existing paired routes: None assigned.
- Duplication risk: Low; this is a concrete multimodal/document agent with unusually inspectable artifacts and is distinct from GUI anomaly testing.
- Potential article value: Excellent figure-led reading: scene graph versus flat canvas, CARE routing, self-correction loop, and strict-peak rollback.

## Recommendation

- Output level: deep-read-candidate.
- Rationale: Near-complete evidence package, strong engineering consequence, and a direct bridge between agent architecture and evaluation validity.
- Open questions for approval: How much does each component contribute? How robust is the judge to style diversity? Which failures remain after rollback? Can the mock path expose enough evidence for a bilingual reading without Figma access?
