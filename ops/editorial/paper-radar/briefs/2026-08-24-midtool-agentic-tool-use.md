---
stableId: "arxiv:2608.20314"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-08-24
lastVerifiedAt: 2026-08-24
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 4
  total: 28
decision: "deep-read-candidate"
---

# MidTool: Mid-training Data Synthesis for Agentic Tool Use

## Identity

- Stable ID: `arxiv:2608.20314`.
- Canonical URL: https://arxiv.org/abs/2608.20314
- Authors: Fengqing Jiang, Yite Wang, Boyi Liu, Zhaoyang Wang, Canwen Xu, Zhewei Yao, Radha Poovendran, and Yuxiong He.
- Venue or review status: arXiv v1, submitted 2026-08-20; no venue or review record identified in this scan.
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI link; no separate venue identity identified.
- Code / model / data: The paper's Data & Model link now resolves to the MidTool Hugging Face organization. [MidTool-Mix](https://huggingface.co/datasets/MidTool/MidTool-Mix), [Arctic-MidTool-MT-4B](https://huggingface.co/MidTool/Arctic-MidTool-MT-4B), [Arctic-MidTool-MT-8B](https://huggingface.co/MidTool/Arctic-MidTool-MT-8B), corresponding RL checkpoints, and the web/PDF fastText quality classifiers are visible; dataset and model access is gated by the listed licenses and upstream terms.

## Editorial fit

- Reader question: Should general tool-use capability be taught earlier in the model lifecycle through mid-training, or can post-training alone teach schema grounding, multi-step calls, and recovery?
- Why this belongs in the selected track: MidTool connects corpus construction to tool-use reliability, using web, PDF, code, REST API, and MCP artifacts to train models before SFT and RL, then evaluates both in-distribution function calling and out-of-distribution MCP servers.
- Gap it fills: Tool affordance grounding, argument construction, multi-tool workflow composition, recovery from missing information, and the boundary between general tool use and specialized agency.
- Why now: Existing Radar candidates examine tool calling and agent evaluation at runtime. MidTool asks whether part of the reliability problem should be moved into the data and mid-training stage instead.

## Claim map

- Problem: Tool-use data is fragmented across documentation, code, schemas, and executable workflows; post-training corpora may not teach models how to infer tool boundaries or recover across multiple turns.
- Main claim: A 20.3B-token MidTool-Mix with context-grounded and native agentic trajectories improves downstream tool-use performance for Qwen3-4B and Qwen3-8B, with gains that transfer to unfamiliar MCP servers.
- Method: Collect and filter web, PDF, code, and tool artifacts; synthesize grounded QA/trajectories from documents and executable trajectories from APIs/MCP skills; mid-train base models, then hold SFT and optional RL recipes fixed for comparison.
- What is genuinely new: The paper treats general tool use as a mid-training target and separates grounding data from execution data, rather than treating tool calls only as post-training demonstrations.

## Evidence audit

- Datasets: MidTool-Mix contains 20.3B tokens across 11.22M samples: web 42%, code 26%, PDF 23%, native trajectories 9%. The tool inventory contains 2.60M unique tool names, with a 37.2% domain-specific long tail by the paper's keyword categorization.
- Benchmarks and metrics: BFCLv3, verified tau2-Bench, and MCP-Universe. For the 4B SFT setting, MidTool-Mix reports BFCL overall 50.25% versus 39.73% without mid-training, tau2-Bench Pass@4 28.06% versus 20.50%, and MCP-Universe 5.03% versus 1.68%.
- Baselines: No mid-training, matched-budget Dolmino-20BT, processed raw data without trajectories, native trajectories, context-grounded trajectories, Qwen3-4B/8B base models, and downstream SFT with optional RL.
- Ablations: Raw-source-only versus each trajectory branch, matched-budget generic mid-training, benchmark contamination audit, and a small VisualToolBench transfer study. The web-search subset of MCP-Universe remains at 0.00% in the complete mixture, exposing a capability boundary.
- Statistical uncertainty: The paper presents point estimates and controlled recipes, but the inspected sections do not provide a full confidence-interval treatment across all reported cells. Treat gains as study-specific, not as a universal mid-training multiplier.
- Threats to validity: Teacher-generated trajectories, keyword-based tool categorization, surface n-gram contamination checks, fixed post-training recipes, and high compute requirements may limit transfer to other models, tool distributions, and training budgets.

## Reproducibility

- Available artifacts and licenses: The Hugging Face dataset card exposes MidTool-Mix as a 42.7 GB gated dataset with web, PDF, code, and native-agent-traj subsets; model cards expose 4B/8B mid-training and RL checkpoints. The dataset uses the MidTool-Mix License and upstream terms; model cards require Apache-2.0 plus dataset terms. The paper and cards provide loading paths, but this article did not download or execute the artifacts.
- Environment or compute requirements: ArcticTraining on 32 H200 GPUs for mid-training and SFT, an AWM/VeRL-style GRPO setup on eight B200 GPUs for RL, Qwen3 base checkpoints, 526 synthetic environments, and the BFCL, tau2-Bench, and MCP-Universe harnesses.
- Smallest useful reproduction: Recreate a small four-source mixture with public documentation and MCP schemas; compare raw mid-training, grounded trajectories, native trajectories, and generic technical data on BFCL-like calls and a held-out MCP server set, measuring tool selection, argument validity, recovery, final grounding, tokens, and compute.
- Blocking unknowns: Checkpoint hashes, data filtering scripts, teacher-model prompts, trajectory validation code, and whether the reported 20.3B-token mixture can be streamed or reproduced without the full training stack. Access approval and upstream license review are still required for a real reproduction.

## Critical reading

- Strongest result: The branch ablation and benchmark spread show that grounded and native trajectories contribute different signals, while the 0.00% web-search subset prevents the paper from collapsing “general tool use” into general deep research.
- Weakest assumption: Improvements on BFCL, tau2-Bench, and MCP-Universe capture enough of the desired tool-use capability to justify a mid-training investment; real production tools have different schemas, permissions, latency, and side effects.
- Stated limitations: The authors leave mid-training/post-training co-design, matched-budget mixture design, dependence on strong teachers, and specialized agency beyond general tool use as future work.
- Claims not supported by the evidence: MidTool does not prove that mid-training is cheaper than post-training, that the dataset is safe for arbitrary tool permissions, or that improved tool success means grounded and correct final answers in all domains.

## Bloss0m connection

- Related Traditional Chinese routes: `04-RAG-MCP`; `22-swe-bench-promax`; current Bitter Lesson of Tool Calling, AgentChaos, and other tool-use reliability Radar candidates.
- Related English routes: paired English routes for the same entries.
- Duplication risk: Medium. It overlaps tool-calling evaluation, but its contribution is data-stage intervention and the separation of grounding from execution trajectories.
- Suggested internal links: tool schemas, MCP server discovery, tool-result grounding, synthetic data validation, cost accounting, and permission-aware replay.

## Recommendation

- Output level: Deep Read.
- Score rationale: Strong ablations, clear capability boundary, broad benchmark coverage, and unusually actionable data-pipeline detail justify promotion; public artifact access and very high reproduction compute remain to be confirmed.
- Open questions requiring human approval: Review gated artifact access and upstream data terms before attempting reproduction. Preserve the web-search failure and the difference between successful tool invocation and evidence-grounded final answers.
