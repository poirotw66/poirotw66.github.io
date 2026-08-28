---
stableId: "arxiv:2305.15334"
sourceVersion: "v1"
status: "published"
firstSeenAt: 2026-08-27
lastVerifiedAt: 2026-08-27
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "published"
---

# Gorilla: Large Language Model Connected with Massive APIs

## Identity

- Stable ID: `arxiv:2305.15334`.
- Canonical URL: https://arxiv.org/abs/2305.15334
- Authors: Shishir G. Patil, Tianjun Zhang (equal contribution), Xin Wang (Microsoft Research), Joseph E. Gonzalez (UC Berkeley).
- Venue or review status: NeurIPS 2024 camera-ready; arXiv v1 PDF/HTML (posted 2023-05-24; only this arXiv version as of 2026-08-27).
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI `10.48550/arXiv.2305.15334`; NeurIPS hash `e4c61f578ff07830f5c37378dd3ecb0d`.
- Code / model / data: Project https://gorilla.cs.berkeley.edu; GitHub https://github.com/ShishirPatil/gorilla (Apache-2.0) with `data/apibench`; Hugging Face `gorilla-llm/*` models listed publicly. Later BFCL / OpenFunctions materials in the same repo are out of scope for this note's tables.

## Editorial fit

- Reader question: When APIs become a huge changing documentation catalog, is tool use still Toolformer-style next-token insertion of a few APIs, or a retrieve-then-call problem that must see documents in training?
- Why this belongs in the selected track: Gorilla is the catalog-scale API-calling ancestor between Toolformer and the MidTool / RAG-MCP leaves on the Agent foundations map.
- Gap it fills: Tool-use reliability at catalog scale: hallucination versus wrong-API error under AST matching, with retriever-aware finetuning.
- Why now: Blog 91's remaining plus-item hole after Toolformer and before MidTool / RAG-MCP; notes 24–34 and blogs 91/92 are already on main.

## Claim map

- Problem: LLMs hallucinate API names, arguments, and usage over massive, frequently updated APIs.
- Main claim: A LLaMA-7B finetuned with Retriever Aware Training (RAT) on APIBench can beat prompted GPT-4 on writing API calls and can adapt to test-time documentation changes while lowering hallucination.
- Method: Collect ~1,645 ML-hub APIs → self-instruct (~16,450 pairs) → finetune with or without retrieved API JSON → evaluate with AST subtree matching; retrievers BM25 / GPT-Index / Oracle.
- What is genuinely new: Systematic catalog-scale APIBench plus retriever-aware finetuning for API calls, not few-API Toolformer insertion and not an agent loop.

## Evidence audit

- Datasets: APIBench TorchHub / TensorHub / HuggingFace; holdout self-instruct split; constraint subset ~65.26% of TorchHub with accuracy fields.
- Benchmarks and metrics: overall AST accuracy, hallucination, wrong-API error; Table 3 AST vs human 0.78 and executable 0.72 on 100 samples.
- Baselines: LLaMA-7B, GPT-3.5-turbo-0301, GPT-4-0314, Claude-v1; zero-shot and retrieval settings.
- Ablations: finetune with vs without Oracle retrieval (Table 2); constraint-aware Table 4; Gorilla 0-shot vs GPT 3-shot Table 5; Figure 6 test-time doc change.
- Statistical uncertainty: point estimates; checklist says LLM experiments run once.
- Threats to validity: ML-hub corpus; single-call eval; HuggingFace non-exhaustive domain check for some baselines; appendix API counts disagree with Figure 3's 1,645.

## Reproducibility

- Available artifacts and licenses: NeurIPS PDF; arXiv v1 under perpetual non-exclusive license; GitHub Apache-2.0 code/data; project page live; HF models listed.
- Environment or compute: LLaMA-7B finetune, lr 2e-5, batch 64, 5 epochs, max seq 2048; GPT-4 used for self-instruct only.
- Smallest useful reproduction: one APIBench JSON with and without the reference-doc prefix; AST/string membership check. Does not reproduce Table 1.
- Blocking unknowns: none for reading; full Table 1 rerun not claimed here.

## Critical reading

- Strongest result: Table 1 Gorilla 0-shot 59.13 / 71.68 / 83.79 overall with hallu 6.98 / 10.95 / 5.40 versus GPT-4 0-shot hallu 36.55 / 37.16 / 78.65; Table 2 shows Oracle+RAT ceiling and BM25 damage; Figure 6 shows test-time adaptation.
- Weakest assumption: Single-call AST matching on ML hubs is informative enough to name general “LLM connected with massive APIs,” including REST product settings.
- Stated limitations / checklist: open code/data; LLM runs once; no error bars.
- Claims not supported by the evidence: ReAct loops, MidTool mid-training, RAG-MCP / MCP authorization, or back-filling later BFCL numbers.

## Bloss0m connection

- Related Traditional Chinese routes: `25-toolformer-self-supervised-api-calls`; `23-midtool-agentic-tool-use`; `04-rag-mcp`; blog `91-agent-method-foundation-reading-map`.
- Related English routes: paired English routes for the same entries.
- Duplication risk: Low. No existing Bloss0m paper-reading covers Gorilla; Toolformer and RAG-MCP share the tool-use family without teaching catalog-scale RAT.
- Suggested internal links: training-filter ancestor (Toolformer), mid-training leaf (MidTool), schema-routing leaf (RAG-MCP), spine map (blog 91).

## Recommendation

- Output level: Deep Read.
- Score rationale: Landmark catalog-scale tool-use method, explicit hallucination split, open artifacts, and honest train/test retrieval mismatch. Reproducibility 4 because code/data are public though Table 1 was not rerun here.
- Open questions requiring human approval: none for this approved publication request; keep Table 1 numbers and do not import MidTool / RAG-MCP / BFCL scores.
