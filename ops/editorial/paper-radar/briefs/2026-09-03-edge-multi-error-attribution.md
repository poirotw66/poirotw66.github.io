---
stableId: "arxiv:2609.01360"
sourceVersion: "v1"
status: "shortlist"
firstSeenAt: 2026-09-03
lastVerifiedAt: 2026-09-03
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 3
  total: 27
decision: "shortlist"
---

# EDGE：用錯誤依賴圖找出 Agent 失敗如何一層層傳播

## Identity

- Search window: strict 72-hour scan from 2026-08-31 00:32Z to 2026-09-03 00:32Z.
- Canonical URL: https://arxiv.org/abs/2609.01360
- Authors: Jun Hou, Priya Pitre, Yi Fang, and Xuan Wang, Virginia Tech.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-01; journal reference listed as EMNLP 2026.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.01360
- Code and artifacts: https://github.com/JuneHou/EDGE.

## Editorial fit

- Reader question: When a failed agent trace contains five errors, how can a debugger distinguish an upstream trigger from downstream symptoms instead of choosing one convenient root cause?
- Why this belongs in the selected track: EDGE combines trace annotations, a dependency graph, counterfactual intervention, and a two-stage detector for multi-error attribution.
- Gap it fills: Agent evaluation—especially causal-ish debugging evidence between “the run failed” and “this one step was responsible.”
- Why now: Modern agent traces mix planning, tool use, and inter-agent coordination; the paper makes the propagation structure an explicit artifact that can guide repair prioritization.

## Claim map

- Problem: Existing attribution often focuses on one responsible agent, step, or root cause, while real failed traces contain related errors and downstream cascades.
- Main claim: An observational graph filtered by temporal priority and probability raising, pruned with CAPRI-style scoring, and then tested by counterfactual rollouts can improve category-level multi-error attribution.
- Method: Build an error dependency graph; patch an upstream span while holding tool outputs fixed; use a repair verifier and effect evaluator to validate edges; inject a thresholded graph into Stage 1 predictions, then ask Stage 2 to verify reachable downstream categories.
- What is genuinely new: The system separates inference coverage from explanation: score-filtered observational edges help find errors, while intervention-validated edges are reserved as a stronger causal anchor.

## Evidence audit

- Benchmarks and metrics: TRAIL covers 148 traces with 19 leaf categories across GAIA and SWE-Bench; MAST covers 393 AG2 traces with 13 categories. TRAIL reports weighted F1, location, and joint accuracy; MAST reports weighted F1, macro precision/recall/accuracy.
- Main result: On representative cells, EDGE raises Mistral-Small-3.1-24B TRAIL-SWE-Bench F1 by 6.94 points over the graph-guidance ablation and improves held-out weighted F1 by 8.40/2.40 on TRAIL and 1.91/12.41 on MAST for two backbones. For GPT-5, the reported TRAIL-SWE-Bench F1 change is +20.19.
- Controls and ablations: Random graph controls, causal-only versus correlation-union graphs, threshold sweeps, held-out graph construction, static graph guidance, Who&When-style prompts, and additional GPT-5/Qwen3.6-35B-A3B backbones are reported. EDGE improves weighted F1 in all six additional model-benchmark cells, while MAST accuracy decreases slightly in both.
- Statistical uncertainty: The paper reports point estimates and held-out splits, but no broad independent replication or confidence-interval protocol is presented for the headline detector cells.
- Threats to validity: Counterfactual patches, Judge A/B labels, graph thresholds, and replayability are model- and benchmark-dependent. TRAIL/MAST are English research benchmarks; production traces with hidden state, permissions, and nondeterministic tools may violate the controlled intervention assumption. EDGE also adds cost: the paper reports open-weight mean inference rising from 3.25 to 5.23 A100 GPU-hours on TRAIL.

## Reproducibility

- Available artifacts: Public EDGE repository, full HTML paper, benchmark metadata, threshold diagnostics, and dataset/license descriptions. Source benchmark data and model-serving environments retain their own licenses and access constraints.
- Environment or compute requirements: Open-weight evaluation used four A100 GPUs per job; proprietary backbones use hosted APIs. Replaying interventions on live TRAIL traces is more demanding than running a static judge.
- Smallest useful reproduction: Rebuild a graph from an 80/20 split, run the held-out Mistral or GPT-oss cell, compare baseline, static graph, causal-only, and dynamic two-stage injection, then audit one intervention edge end to end.
- Blocking unknowns: LLM judge calibration drift, sensitivity to taxonomy changes, intervention patch realism, and whether graph construction cost is amortized in a production observability pipeline.

## Critical reading

- Strongest result: The held-out graph experiment reduces the obvious leakage concern, and the distinction between observational edges and intervention-validated edges makes the causal language more disciplined than a plain LLM judge.
- Weakest assumption: Holding tool outputs fixed and patching a reasoning span may isolate one controlled direct effect, but it does not reproduce the counterfactual world in which an upstream tool call would have changed.
- Unsupported leap: Better category-level attribution is not yet evidence that repair suggestions improve task success, incident resolution time, or user safety in deployed agents.

## Bloss0m connection

- Related routes: agent observability, multi-agent failure analysis, tool-use reliability, and evidence-grounded debugging.
- Duplication risk: Low with existing evaluation candidates; the graph-plus-intervention design is distinct.
- Suggested internal links: Pair with the trace-state paper for the “what to retain” layer and with future provenance-contract coverage for “who may trust a diagnostic edge.”

## Recommendation

- Output level: Shortlist.
- Score rationale: 27/30: unusually concrete method and artifact surface, strong held-out and ablation evidence, and direct debugging value. Series value is 3/5 because the intervention semantics and extra GPU cost need careful explanation before committing to a full Paper Reading.
- Open questions requiring human approval: Should the article treat validated edges as causal claims or only controlled diagnostic evidence? Can a production team measure whether EDGE changes repair outcomes rather than only attribution F1?

