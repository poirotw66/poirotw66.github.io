---
stableId: "arxiv:2112.09332"
sourceVersion: "v3"
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

# WebGPT: Browser-assisted question-answering with human feedback

## Identity

- Stable ID: `arxiv:2112.09332`.
- Canonical URL: https://arxiv.org/abs/2112.09332
- Authors (v3 PDF): Reiichiro Nakano, Jacob Hilton, Suchir Balaji, Jeff Wu, Long Ouyang, Christina Kim, Christopher Hesse, Shantanu Jain, Vineet Kosaraju, William Saunders, Xu Jiang, Karl Cobbe, Tyna Eloundou, Gretchen Krueger, Kevin Button, Matthew Knight, Benjamin Chess, and John Schulman. First three marked equal contribution; correspondence also includes Schulman.
- Venue or review status: OpenAI technical report / arXiv preprint; v3 PDF and HTML (last revised 2022-06-01). arXiv.org perpetual non-exclusive license, not CC BY. Source tarball includes `neurips_2020.sty` as a formatting template only — not a NeurIPS/ICLR record.
- DOI / aliases: arXiv-issued DOI `10.48550/arXiv.2112.09332`.
- Code / model / data: comparisons.jsonl at https://openaipublic.blob.core.windows.net/webgpt-answer-viewer/comparisons.jsonl (19,578 pairs, HTTP 200 as of 2026-08-27). Answer viewer HTML on the same blob. No official GitHub runtime. GPT-3 checkpoints not public. Hugging Face `openai/webgpt_comparisons` is a third-party loader card.

## Editorial fit

- Reader question: When a frozen GPT-3 must answer long-form questions that need the web, is the missing control point whether it may issue text-browser commands and collect quotes — and where does that stop being ReAct?
- Why this belongs in the selected track: WebGPT is the act-only ancestor of ReAct. Agent-systems notes 24–29 already assume “acting” or “thought” exist; this note teaches the browsing-QA + IL+HF contract those later loops inherit, without turning WebGPT into a thought–action–observation runtime.
- Gap it fills: Tool-use reliability at the layer *before* thought is a legal action: the model may search, click, and quote, but Table 1 has no thought.
- Why now: Blog 91 still treated WebGPT as an ancestor without a 2026 note. This pair closes that hole and sits on the agent-systems path immediately before ReAct, next to CoT.

## Claim map

- Problem: Long-form QA lags humans; differentiable retrievers cannot attach Bing; paragraph answers without quotes are hard to fact-check.
- Main claim: Finetune GPT-3 in a text browser with behavior cloning plus a preference reward model; the 175B best-of-64 model is preferred 56% to human demonstrators and 69% to ELI5 Reddit answers.
- Method: Table 1 commands; BC; RM as Elo; optional PPO with KL; rejection sampling 4/16/64. Headline models drop RL because Figure 4 shows little extra once best-of-n is on.
- What is genuinely new: End-to-end browsing + cited answering trained with human demonstrations and preferences, rather than a differentiable retriever or an interleaved thought loop.

## Evidence audit

- Datasets: ELI5 (primary); small mixes of TriviaQA, ARC, handwritten, ELI5 fact-check. Evaluation also on TruthfulQA and TriviaQA transfer.
- Benchmarks and metrics: Human preference % (ties as 50%); TruthfulQA true / true-and-informative; TriviaQA EM in Appendix G.
- Baselines: Human demonstrators; ELI5 highest-voted answers; GPT-3 QA and helpful prompts; BC versus RL versus best-of-n; Krishna et al. 23% on ELI5 references; UnitedQA on TriviaQA.
- Ablations: Figure 4 RL vs BC with and without rejection sampling; Figure 5 best-of-n vs BC; Figures 6–8 dataset / parameter / sample scaling; Table 3 TruthfulQA failure quotes; Appendix H question stance.
- Statistical uncertainty: Error bars are ±1 standard error on preference plots; comparison agreement 74% / 73%.
- Threats to validity: Reddit comparison strips citations and uses a minimal rubric; TruthfulQA 50-token truncation (~3% empty answers); GPT-3 weights closed; live Bing rather than a frozen corpus; not a conference camera-ready.

## Reproducibility

- Available artifacts and licenses: arXiv v3 HTML / PDF under arXiv perpetual non-exclusive license; comparisons.jsonl; answer viewer; third-party HF loader.
- Environment or compute requirements: GPT-3 760M / 13B / 175B plus Bing API; not generally re-runnable.
- Smallest useful reproduction: Walk Table 1 / Figure 1b on one ELI5 item and confirm there is no thought field. comparisons.jsonl can train a preference model, not the browsing policy.
- Blocking unknowns: GPT-3 weights; browser environment code; demonstration GUI; PPO training loop.

## Critical reading

- Strongest result: Section 4.1 / Figure 2 56% vs demonstrators and 69% vs Reddit, plus Section 5.1 68% best-of-64 vs BC and Figure 4 showing RL’s extra gain vanishing under rejection sampling, plus TruthfulQA 75% / 54% still below humans.
- Weakest assumption: That pairwise preference with model-collected quotes is a sufficient proxy for factual accuracy, including out of ELI5 distribution.
- Stated limitations: Cherry-picked references; unfaithful paraphrase; question-stance bias; automation bias from authoritative citations; live-web side-effect risk at higher capability.
- Claims not supported by the evidence: ReAct loops, a general agent runtime, later OpenAI browsing products, Browser-use SOTA, or ReAct’s WebShop 40.0.

## Bloss0m connection

- Related Traditional Chinese routes: `29-chain-of-thought-prompting`; `24-react-interleaved-reasoning-acting`; blog `91-agent-method-foundation-reading-map`; blog `08-efficient-paper-reading-three-pass`.
- Related English routes: paired English routes for the same entries.
- Duplication risk: Low. ReAct already contrasts with WebGPT as act-only; no existing Bloss0m paper-reading teaches the 2021 browsing-QA paper itself.
- Suggested internal links: CoT (reason without acting), ReAct (thought as an action in a loop), reading map (spine), three-pass method.

## Recommendation

- Output level: Deep Read.
- Score rationale: Landmark act-only method, pairwise human evidence with honest RL-vs-best-of-n negatives, and a reachable comparison dump justify publication; closed GPT-3 and missing environment code keep reproducibility at 3.
- Open questions requiring human approval: none for this approved publication request; keep 56% as overall usefulness versus demonstrators, not a win on every Figure 2a axis; do not back-port later browsing-product numbers.
