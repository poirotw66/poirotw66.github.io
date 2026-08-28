---
stableId: "arxiv:2203.02155"
sourceVersion: "v1"
status: "published"
firstSeenAt: 2026-08-28
lastVerifiedAt: 2026-08-28
primaryTrack: "foundations"
primaryGap: "instruction-alignment"
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

# Training language models to follow instructions with human feedback

## Identity

- Stable ID: `arxiv:2203.02155`.
- Canonical URL: https://arxiv.org/abs/2203.02155
- Authors (v1 PDF / NeurIPS 2022): Long Ouyang, Jeff Wu, Xu Jiang, Diogo Almeida, Carroll L. Wainwright, Pamela Mishkin, Chong Zhang, Sandhini Agarwal, Katarina Slama, Alex Ray, John Schulman, Jacob Hilton, Fraser Kelton, Luke Miller, Maddie Simens, Amanda Askell, Peter Welinder, Paul Christiano, Jan Leike, and Ryan Lowe (OpenAI).
- Venue or review status: NeurIPS 2022; arXiv v1 (2022-03-04). arXiv.org perpetual non-exclusive license.
- Code / model / data: Sample outputs at https://github.com/openai/following-instructions-human-feedback; 175B weights not public. SFT ~13k, RM ~33k, PPO ~31k API prompts; 40 contractors.

## Editorial fit

- Reader question: After Transformer on the foundations spine, how does InstructGPT align a frozen GPT-3 architecture to follow instructions via SFT, a 6B reward model, and PPO (PPO-ptx), and what do 2022 labeler preference win rates contract for versus later ChatGPT, GPT-4, or DPO?
- Why this belongs in the selected track: Sixth foundations node; teaches post-pretraining instruction-alignment control point after sequence transduction.
- Gap it fills: instruction-alignment gap in series-map; bounded to 2022 API labeler preference evidence.
- Why now: Completes foundations path immediately after Transformer without inventing BERT, GPT-2/3 pretraining, ChatGPT product, or DPO notes.

## Claim map

- Problem: Pretrained LMs misalign with user intent; scale alone does not fix instruction following.
- Core idea: Three-stage RLHF on GPT-3 architecture—SFT demonstrations, 6B RM on rankings, PPO with KL penalty (default PPO-ptx pretraining mix).
- Evidence: Figure 1 175B vs GPT-3 85±3%, vs few-shot 71±4%; 1.3B beats 175B GPT-3; TruthfulQA ~2x; closed-domain hallucination 21% vs 41%; alignment cost 4.9/60 vs 3640 petaflops/s-days.
- Boundary: Closed models; specific labeler pool; not ChatGPT product, GPT-4, DPO, Llama-2-chat; do not import WMT BLEU or YOLO mAP.

## Publication

- Content entries: `40-instructgpt-human-feedback` (ZH + EN).
- Path wiring: `foundations` immediately after `39-attention-is-all-you-need` in `paperReadingPaths.ts`.
- Tiny inbound: one-line pointer from Transformer further-reading section.
