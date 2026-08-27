---
stableId: "arxiv:2201.11903"
sourceVersion: "v6"
status: "published"
firstSeenAt: 2026-08-27
lastVerifiedAt: 2026-08-27
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "published"
---

# Chain-of-Thought Prompting Elicits Reasoning in Large Language Models

## Identity

- Stable ID: `arxiv:2201.11903`.
- Canonical URL: https://arxiv.org/abs/2201.11903
- Authors (v6 PDF / NeurIPS 2022 camera-ready): Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, Brian Ichter, Fei Xia, Ed H. Chi, Quoc V. Le, and Denny Zhou.
- Venue or review status: NeurIPS 2022; arXiv v6 PDF and HTML (last revised 2023-01-10). CC BY 4.0 on arXiv.
- DOI / aliases: arXiv-issued DOI `10.48550/arXiv.2201.11903`; NeurIPS hash `9d5609613524ecf4f15af0f7b31abca4`.
- Code / model / data: Author repo https://github.com/jasonwei20/chain-of-thought-prompting (created 2022-01-28) with LaMDA 137B / GPT-3 trace zip. PaLM and LaMDA checkpoints are not generally available. NeurIPS Supplemental zip 404 as of 2026-08-27.

## Editorial fit

- Reader question: When a frozen model cannot do multi-step reasoning, is the missing control point whether the few-shot prompt writes intermediate natural-language steps before the answer—and where does that stop being an agent?
- Why this belongs in the selected track: CoT is the reason-only ancestor of ReAct. Agent-systems notes 24–28 already assume “thought” exists; this note teaches the prompting contract those later loops inherit, without turning CoT into a tool loop.
- Gap it fills: Tool-use reliability at the layer *before* tools: when a model may only think versus when it may touch the world. CoT never calls tools, never receives environment observations, and never pages memory.
- Why now: Blog 91 still treated CoT as an ancestor without a 2026 note. This pair closes that hole and sits on the agent-systems path immediately before ReAct.

## Claim map

- Problem: Standard few-shot $\langle$input, output$\rangle$ prompting is weak on multi-step arithmetic, commonsense, and symbolic tasks; scaling alone often leaves those curves flat; rationale finetuning is expensive.
- Main claim: Few-shot exemplars that include intermediate reasoning steps elicit multi-step reasoning in sufficiently large frozen models; PaLM 540B GSM8K 17.9 → 56.9 exceeds Cobbe et al.’s finetuned GPT-3 + verifier 55.
- Method: Replace $\langle x, y \rangle$ with $\langle x, r, y \rangle$; greedy decode; optional post-hoc Python `eval` is not an in-loop tool. Eight math exemplars (four for AQuA).
- What is genuinely new: Eliciting the chain by demonstration rather than finetuning, and showing the gain is emergent in scale rather than a smooth bonus at every size.

## Evidence audit

- Datasets: GSM8K, SVAMP, ASDiv, AQuA, MAWPS; CSQA, StrategyQA, BIG-bench Date / Sports, SayCan; synthetic last-letter and coin-flip (in-domain and OOD).
- Benchmarks and metrics: Solve-rate / accuracy (%). Headline arithmetic is Table 1 / Figure 4; commonsense Table 4; symbolic Table 5.
- Baselines: Standard few-shot prompting; then-supervised / finetuned SOTA rows; equation-only, variable-compute (dots), reasoning-after-answer ablations.
- Ablations: Figure 5 / Tables 6–7; annotator / exemplar / order robustness; MAWPS subset split (Table 3); error analysis on 50+50 LaMDA GSM8K traces and 45 PaLM 62B errors.
- Statistical uncertainty: LaMDA uses five exemplar-order seeds; other models are single-order greedy point estimates.
- Threats to validity: PaLM / LaMDA not public; BIG-bench Date / Sports use the first ten eval items as exemplars; Section 4 StrategyQA prose 75.6 vs Table 4 77.8; Codex GSM8K 63.1 is a v5 row, not the abstract’s PaLM headline.

## Reproducibility

- Available artifacts and licenses: arXiv v6 HTML / PDF under CC BY 4.0; NeurIPS 2022 abstract page; author GitHub zip of traces; coin-flip / last-letter MIT (Google 2021).
- Environment or compute requirements: PaLM 540B on TPU v4 and LaMDA 137B on TPU v3 for the main tables; GPT-3 via the then-public API.
- Smallest useful reproduction: Appendix Table 20’s eight math exemplars on a handful of GSM8K items, checking that intermediate steps appear and no API is called.
- Blocking unknowns: PaLM weights; a frozen snapshot of 2022 GPT-3 engines; NeurIPS supplemental zip.

## Critical reading

- Strongest result: Table 1 PaLM 540B GSM8K 17.9 → 56.9 plus Figure 5 showing equation-only / dots / after-answer stay near baseline, plus Table 2’s small-model negatives.
- Weakest assumption: That a handful of human-written chains plus greedy decoding is enough to name a general reasoning recipe, including for models far below ~100B.
- Stated limitations: Unclear whether the network is “reasoning”; unfaithful chains; scale cost; finetune annotation would be expensive.
- Claims not supported by the evidence: Agent loops, tool use, memory paging, self-consistency numbers, or later reasoning-model GSM8K scores.

## Bloss0m connection

- Related Traditional Chinese routes: `24-react-interleaved-reasoning-acting`; `25-toolformer-self-supervised-api-calls`; blog `91-agent-method-foundation-reading-map`; blog `08-efficient-paper-reading-three-pass`.
- Related English routes: paired English routes for the same entries.
- Duplication risk: Low. ReAct already contrasts with CoT as ungrounded thought; no existing Bloss0m paper-reading teaches the 2022 prompting paper itself.
- Suggested internal links: ReAct (thought as an action in a loop), Toolformer (training-time API insert), reading map (spine), three-pass method.

## Recommendation

- Output level: Deep Read.
- Score rationale: Landmark method, three-suite evidence, honest small-model negatives, and still-reachable prompts justify publication; closed PaLM / LaMDA keep reproducibility at 3.
- Open questions requiring human approval: none for this approved publication request; keep Table 1 56.9 vs Figure 2’s rounded 57 explicit; do not back-port self-consistency or later reasoning-model numbers.
