---
stableId: "arxiv:2302.04761"
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
  reproducibility: 2
  engineeringValue: 5
  seriesValue: 5
  total: 27
decision: "published"
---

# Toolformer: Language Models Can Teach Themselves to Use Tools

## Identity

- Stable ID: `arxiv:2302.04761`.
- Canonical URL: https://arxiv.org/abs/2302.04761
- Authors: Timo Schick, Jane Dwivedi-Yu, Roberto Dessì, Roberta Raileanu, Maria Lomeli, Eric Hambro, Luke Zettlemoyer, Nicola Cancedda, and Thomas Scialom. arXiv v1 lists eight authors; the NeurIPS 2023 proceedings add Eric Hambro.
- Venue or review status: NeurIPS 2023; arXiv v1 PDF and HTML (submitted 2023-02-09; only this arXiv version).
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI `10.48550/arXiv.2302.04761`; NeurIPS hash `d842425e4bf79ba039352da0f658a906`.
- Code / model / data: Meta research page https://ai.meta.com/research/publications/toolformer-language-models-can-teach-themselves-to-use-tools/ is reachable. No official GitHub, $\mathcal{C}^{*}$, or GPT-J Toolformer checkpoint. `facebookresearch/toolformer` returns 404 as of 2026-08-27.

## Editorial fit

- Reader question: Should tool use be taught as a multi-step agent loop, or can a language model insert a single API call into next-token prediction when that call reduces future-token loss?
- Why this belongs in the selected track: Toolformer is the training-side ancestor of later tool-use notes (MidTool) and the prompting cousin of ReAct. It is the right place to separate a language-modeling filter from an agent runtime.
- Gap it fills: Tool-use reliability at the training-filter layer: when an API call is kept because it helps future tokens, not because a human already knew which tool the task needed.
- Why now: The just-published ReAct note teaches the thought–action–observation contract. Toolformer is the next foundation note: self-supervised API insertion on GPT-J + CCNet.

## Claim map

- Problem: LMs fail at arithmetic, factual lookup, low-resource languages, and time; prior tool use needed heavy annotation or task-specific few-shot prompts.
- Main claim: Self-supervised filtering of sampled API calls lets GPT-J 6.7B beat much larger models on LAMA and math in a prompted zero-shot setup, without raising WikiText/CCNet perplexity when APIs are later disabled.
- Method: Few demonstrations → sample calls over CCNet → keep calls with $L_i^{-}-L_i^{+}\ge\tau_f$ versus no-call / call-without-result → finetune GPT-J on mixed text. Tools: Atlas QA, Wikipedia BM25, calculator, calendar, NLLB.
- What is genuinely new: Treating tool use as a language-modeling filter rather than a human-labeled or task-prompted policy.

## Evidence audit

- Datasets: CCNet subset for $\mathcal{C}$ / $\mathcal{C}^{*}$; LAMA SQuAD / Google-RE / T-REx; ASDiv / SVAMP / MAWPS; WebQS / NQ / TriviaQA; MLQA; TempLAMA and Dateset; WikiText and a held-out CCNet slice.
- Benchmarks and metrics: Lenient zero-shot: first five words (LAMA), first number (math), first 20 words (QA). Decoding allows the start-of-call token in top-10 and at most one API call per input.
- Baselines: GPT-J, GPT-J+CC, Toolformer disabled, OPT-66B, GPT-3-175B (original davinci).
- Ablations: APIs disabled after finetuning; scaling across GPT-2 124M–1.6B plus GPT-J; decoding $k\in\{0,1,3,10\}$; qualitative Table 10 filter scores.
- Statistical uncertainty: Point estimates; no confidence intervals. Headline call rates on LAMA / WebQS depend on $k=10$.
- Threats to validity: lenient metrics; Atlas/NLLB are external models; Wikipedia search disabled on LAMA; QA tool disabled on QA tasks; no official artifacts.

## Reproducibility

- Available artifacts and licenses: arXiv v1 HTML / PDF under the arXiv.org perpetual non-exclusive license, not CC BY; NeurIPS 2023 PDF; Meta research page. Official code, $\mathcal{C}^{*}$, and checkpoints are missing.
- Environment or compute requirements: GPT-J 6.7B, Atlas, NLLB-600M, KILT Wikipedia dump, CCNet, 8×A100 40GB, DeepSpeed ZeRO-3.
- Smallest useful reproduction: sample Appendix A.2 QA prompts on a short factual sentence and compare future-token loss with result / no result / no call. This does not reproduce Table 3.
- Blocking unknowns: official annotation files, training scripts, and the GPT-J Toolformer checkpoint.

## Critical reading

- Strongest result: LAMA 33.8 / 11.5 / 53.5 versus GPT-J 17.8 / 4.9 / 31.9 with QA used on 98.1% of examples, plus math 40.4 / 29.4 / 44.0 versus 7.5 / 5.2 / 9.9 with the calculator on 97.9%, while Table 8 shows no perplexity cost when APIs are disabled.
- Weakest assumption: A single next-token API insertion, evaluated at most once per input, is informative enough to name a general tool-using language model.
- Stated limitations: no chaining, no interactive search, wording sensitivity, one-call eval, calculator sample-inefficiency, no tool-cost term.
- Claims not supported by the evidence: production agent superiority, beating GPT-3 on open QA, or treating unofficial GitHub forks as a reproduction of Table 3.

## Bloss0m connection

- Related Traditional Chinese routes: `24-react-interleaved-reasoning-acting`; `23-midtool-agentic-tool-use`; `04-rag-mcp`.
- Related English routes: paired English routes for the same entries.
- Duplication risk: Low. No existing Bloss0m paper-reading covers this NeurIPS 2023 method; ReAct and MidTool inherit the loop or the training-side tool prior without teaching the loss filter.
- Suggested internal links: prompting-loop cousin (ReAct), mid-training descendant (MidTool), and schema-routing contrast (RAG-MCP).

## Recommendation

- Output level: Deep Read.
- Score rationale: Landmark method, honest open-QA negative, explicit limits, and a missing official repo recorded rather than hidden. Reproducibility is 2 because endpoints are missing.
- Open questions requiring human approval: none for this approved publication request; keep Table 5 behind GPT-3 and the $k=10$ decoding knob explicit.
