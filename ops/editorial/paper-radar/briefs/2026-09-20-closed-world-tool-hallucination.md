---
stableId: "arxiv:2609.19425"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-20
lastVerifiedAt: 2026-09-20
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 4
  total: 29
decision: "deep-read-candidate"
---

# Closed-World Resolution Against Tool Hallucination in LLM Agents

## Identity

- Search window: Seven-day backfill ending 2026-09-20; arXiv v1 was submitted 2026-09-16.
- Canonical URL: https://arxiv.org/abs/2609.19425
- Full paper: https://arxiv.org/html/2609.19425v1
- Author: Laxmipriya Ganesh Iyer, independent researcher.
- Source type: arXiv preprint with full HTML.
- Code/data: The paper releases the versioned Hallucinated-Tools Benchmark (HTB) and commits classified transcripts; the inspected record did not expose a separate repository URL.

## Editorial fit

- Reader question: Why can an agent's tool gate be secure while a fabricated tool call still reaches the executor?
- Track and gap: agent-systems / tool-use-reliability.
- Why now: The paper isolates a missing pre-gate step—closed-world name and signature resolution—then extends the problem to MCP namespace collisions and shadowing.

## Claim map

- Problem: Tool-selection and authorization gates assume the emitted name refers to a registered tool, so fabricated names and undeclared arguments can bypass the gate's semantic input domain.
- Method: A training-free Resolution Rung checks registry membership and typed signatures before the causal gate; the paper defines H1–H5 and MCP-specific M1–M5 classes.
- Main result: Across ten hosted models and two invocation surfaces, the study reports 322 genuine hallucinations; on the MCP surface it reports 154 hallucinations, including collision and shadowing cases.
- Artifact claim: HTB is described as an installable, deterministic benchmark with real-catalog adapters and a single score.

## Evidence audit

- Metrics and comparisons: raw JSON versus schema-enforced surfaces, ten hosted models, controlled ablations, synthetic MCP benchmark, and live MCP surface.
- Strong evidence: The HTML includes the threat model, algorithm, taxonomy, per-surface counts, and a clear distinction between measured emissions and execution rates that follow from the fail-open model.
- Limitations: The registry is trusted; raw provider envelopes are not committed; live-model reruns require Bedrock access; H5 borrowed signatures remain a semantic/tool-selection problem.

## Critical reading

- Strongest insight: Tool safety needs a syntactic existence/type boundary before policy reasoning, and MCP turns namespace composition into a new hallucination surface.
- Main risk: The Resolution Rung is intentionally simple and cannot detect a malicious or incorrect registry, a wrong intent, or a schema-valid call to the wrong tool.
- Suggested article focus: draw the pipeline as `resolve → gate → verify effects`, then show why the order matters with H1–H5 and M1–M5 examples.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30: direct MCP/tool reliability value, unusually explicit failure taxonomy, model-surface measurements, and a reusable benchmark; the separate artifact endpoint and independent rerun remain unverified.
