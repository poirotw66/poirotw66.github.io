# Classics B: source and bilingual repair review

Review date: 2026-10-30. Scope: the Chinese and English pairs for 40 InstructGPT and 41 Speculative Decoding, plus eight existing body-image replacements explicitly listed in batch.json. Publication dates, routes and covers are preserved; substantive corrections justify updatedDate. The delegated worker read the selected papers and both saved article bodies and made the repairs. The coordinator completed final bilingual reading, source spot-checks and all eight visual comparisons after the worker stopped before delivering its final report. This note records that integration review rather than claiming an independent model reproduction.

## Sources and corrections

- [InstructGPT arXiv v1 PDF](https://arxiv.org/pdf/2203.02155v1): Sections 1-5, Equations 1-2, Figures 1-7, relevant supplementary evaluations and Appendix C training details. Corrected T0 26.8+-2% and FLAN 29.8+-2% versus 175B SFT; these are distinct from head-to-head InstructGPT versus FLAN/T0 rates. Corrected the inference example: the deployed policy generates without an RM call; the whole-completion RM reward and per-token KL penalty belong to PPO training. Architecture stays GPT-3 while weights are fine-tuned. SFT uses about 13k training prompts. Held-out prompts/users and 95% CIs replace an unsupported fixed labeler-count claim. The archived [official sample repository](https://github.com/openai/following-instructions-human-feedback) is readable but is not a full training/checkpoint release.
- [Speculative Decoding arXiv v2 PDF](https://arxiv.org/pdf/2211.17192v2): Sections 1-6, Algorithm 1, Theorems 3.5/3.8/3.11, Corollaries 3.6/3.9, Tables 1-4, Figures 1-5 and Appendix A proofs/cost/lenience. The rejection-conditional residual p' is not p: accepted and rejected branches jointly recover p. Alpha>c ensures some gamma accelerates in the analytical model, not every gamma. Table 4 c=0.02/0.04/0.11 is draft-specific. T5-large speedup spans 1.4-2.2X. Token-space compatibility is necessary for Algorithm 1; identical architectures are not. Public [T5X](https://github.com/google-research/t5x) and its [checkpoint catalog](https://github.com/google-research/t5x/blob/main/docs/models.md) do not establish availability of the paper's entire task-fine-tuned experiment package.

## Figure inspection

Each replacement retains the asset path and was visually compared with the named original PDF page. Only surrounding page material was cropped away; no scientific marks, values or labels were synthesized. Captions in both languages now link the pinned version and correct physical PDF page.

| Pair | Existing asset | Evidence retained | Physical PDF page |
| --- | --- | --- | --- |
| 40 | figure-1-preference-eval.webp | Figure 1 plot, legend and original caption | 2 |
| 40 | figure-2-rlhf-pipeline.webp | Figure 2 complete SFT/RM/PPO pipeline and caption | 3 |
| 40 | figure-3-winrate-panels.webp | Figure 3 all four panels, legend and caption | 11 |
| 40 | figure-4-metadata.webp | Figure 4 all four metadata plots and caption | 12 |
| 41 | figure-1-speculative-illustration.webp | Figure 1 complete token-generation example and caption | 2 |
| 41 | figure-2-expected-tokens-vs-alpha.webp | Figure 2 axes, curves, legend and caption | 3 |
| 41 | table-2-t5-xxl-speedups.webp | Table 2 header, all twelve rows and caption | 6 |
| 41 | figure-5-trace-diagram.webp | Figure 5 all three traces, legend and caption | 6 |

InstructGPT v1 uses the arXiv nonexclusive distribution license, which is not an open reuse grant; copyright stays with the original holders. Its captions retain scholarly-commentary attribution and state this distinction. Speculative Decoding v2's record lists CC BY 4.0; captions credit Leviathan, Kalman and Matias and disclose cropping. Rights were not inferred from arXiv hosting alone.

## Final saved-article teach-back

Both final saved language bodies were checked separately. Each answer below is available from the cited saved-article section in both languages; clear means the concept can be reconstructed, not that a regex or experiment proved it.

| Question | InstructGPT zh / en | Speculative Decoding zh / en |
| --- | --- | --- |
| Problem | clear / clear: next-token pretraining does not directly optimize instruction following; reader-question and prior-method sections. | clear / clear: serial target decoding leaves parallel compute idle when memory bandwidth dominates; reader-question/prior-method sections. |
| Prior limitation | clear / clear: scale/prompting and SFT imitation lack explicit human preference optimization; prior-method section, Figure 1. | clear / clear: distillation/quantization can change distributions and earlier parallel methods restrict sampling or require training; prior-method section. |
| Core idea | clear / clear: SFT demonstrations, preference RM, PPO with KL and optional pretraining mix; intuition and Figure 2. | clear / clear: cheap drafts plus target verification, acceptance and residual correction preserve the target marginal; intuition, Algorithm 1 and Appendix A.1. |
| Scaffold | clear / clear: separate policy and 6B RM, demonstrations versus rankings versus unlabelled PPO prompts; technical mechanism, Equations 1-2. | clear / clear: target p, draft q, gamma candidates, accepted prefix n and one extra/corrected token; technical mechanism. |
| End-to-end trace | clear / clear: training artifacts are established before the prompt reaches the deployed policy, which generates without RM; worked example. | clear / clear: gamma=3 translation draft, accept two tokens, reject third and sample residual correction; worked example. |
| Evidence | clear / clear: API preferences versus GPT-3/SFT, held-out labelers, supporting safety slices and alignment tax are distinct; evidence section, Figures 1/3/4/6/7. | clear / clear: Table 2's T5X, batch 1, TPU-v4 results differ from theoretical alpha/gamma/c formulas; evidence and mechanism sections. |
| Adoption boundary | clear / clear: labeler distribution, incomplete open artifacts and residual harmful outputs limit transfer; limitations and judgment. | clear / clear: compatible token domain, draft cost/fit and available parallel compute determine benefit; limitations and judgment. |

## Exact advisory dispositions

All current findings below are recommended as reviewed exceptions for the exact fingerprint only. The findings remain visible and new-publication strict checks remain unchanged. Generic bilingual count differences were measured: both pairs differ only by one extra Chinese bilingual heading's 90-second token. Speculative metric associations were inspected directly and differ because English opening-paragraph "throughput" creates an extra lexical tag, not because the table contract differs.

| Exact ID | Source/context rationale |
| --- | --- |
| `dbc273574e03e3dd979e3d7dd2b8fc0a2a0f9b9b2713b2c1923112ee2ea610ad` | The only quantitative multiset difference is the duplicated Chinese bilingual 90-second heading (two 90000ms tokens versus one). Preference rates, comparators, compute and dataset values match; InstructGPT v1 Sections 3-5 and Appendix C were checked. |
| `a7e3e96ae0c038bcbd3bd3d83076103b12b880c4d8f25483a94537ce0243c04b` | The only quantitative multiset difference is the duplicated Chinese bilingual 90-second heading. All Table 2 speedups, Table 1 theoretical factors and sampling conditions agree; Speculative Decoding v2 Sections 2-4 and Appendix A.3 were checked. |
| `1c31dc79e3b7118a3241acefc2598ea96da07db1ded32046280e76dd2ee2d51e` | The 2X summary is wall-clock acceleration in both languages (abstract/Section 4, Table 2). English "throughput" appears in the same opening paragraph describing emitted tokens; paragraph-wide lexical association adds a throughput tag without an actual bilingual measurement mismatch. |
| `3439404b134f8f42b4763aeb6ebad17f0299a518061b6aaff24461dd15360aeb` | The 3.4X result names T5-XXL/T5-small, WMT EnDe, temperature 0, batch 1 and single TPU-v4 in both languages (Table 2). English opening-paragraph "throughput" adds an extra heuristic tag; neither version changes the wall-clock comparator. |
| `27d985bca1c5c82145add9c83b55206609c4d1579f352c27d53ce4e3126ff696` | The 3X summary has the same abstract/Section 4 wall-clock scope as the 2X endpoint. Extra English opening-paragraph "throughput" association is lexical; both versions separate theory, Table 2 and unproven production latency. |
| `c358b159dc5761923ed7d60fbddc7d3e0eb38d8cdf2a5de84da867ab720eab6a` | The Chinese ablation list cites InstructGPT v1 Figures 1, 5, 29, 33-34 and Section 4.2. Head-to-head preferences 78+-4% versus FLAN and 79+-4% versus T0 are explicitly named (Section 4.1); training changes and API evaluation scope are supplied by the method/evidence sections. |
| `75ba73c718b94fc74be38bfdea1c5af9770b46c00c93cebd47acaf28b62c69cc` | Chinese design list explicitly identifies T5-XXL, Tables 2-3, temperature and Section 3.6 EnDe bigram example. The 1.25X negligible-cost result is theoretical under c=0, not an unconditioned measured serving claim. |
| `5e74dad6f8deeeb658921770c3c38cece56bc26aa2da3e3e8e2b408b452fbfe2` | Chinese judgment explicitly limits T5X 2X-3X to the 2023 experiment and rejects a 2026 serving guarantee. Section 4/Table 2 defines the setup; the correction distinguishes fixed architecture from InstructGPT fine-tuned weights. |
| `b026c7bfc417b95d9b7efb3baf50aa858f7ae7373ac88f0e926eb315ecaa98b8` | Chinese recap names Table 2, target/draft models and EnDe/CNNDM values 3.4/2.6/3.1/2.3X, then explains alpha/gamma/c. The full Table 2 evidence paragraph already provides batch, hardware, sampling and baseline; recap introduces no new experiment. |
| `11aaa0f886710cd8a6cfa0c6a1e2edca8924663d5bdeac92a4d6d39cb78daaeb` | English supporting-metrics paragraph names TruthfulQA, closed-domain hallucination and respectful-prompt toxicity, with Figures 4/6/7 and Section 4.2. V1 supports approximately twice truthful/informative answers, 21% versus 41% hallucination and about 25% lower toxicity in those distinct settings; no single pooled result is claimed. |
| `c791125aa8290f3b98bcab5d6a48c98044d04b28c151f590cb9c4cede19f2236` | English design list has the same T5/Table 2-3, temperature and negligible-cost EnDe bigram context as Chinese. Section 3.6 reports alpha about 0.2 and theoretical 1.25X with c=0; it does not promise measured deployment acceleration. |
| `29814ae33781f176d118e09de63c33d7f9c4c3241f789280b698230745d06223` | English when-not-to-use list explicitly rejects assigning 3.4X EnDe to an arbitrary 2026 API p99 SLA. A prohibition on extrapolation is not a positive unconditioned performance claim. |
| `8966d772dd896f092ebe6925cb338634408a092a7322500624cbcefcbdd519f9` | English judgment limits T5X 2X-3X to the 2023 experiment and rejects a serving warranty, matching Chinese. Section 4/Table 2 establishes its scope; the InstructGPT architecture/training correction removes a real frozen-weights error. |

## Local checks and limitations

- Existing-pair audit with --strict: PASS for both pairs (3 and 10 advisories).
- Comprehension audit with --strict: PASS, 9/9 for each language in both pairs; manual teach-back above supplies semantic review beyond that structural score.
- Figure audit with --strict --min-body-figures 3: PASS for both pairs, four body figures per language. An initial English caption-rights lexical failure was corrected by explicitly saying copyright/reuse status; no validator was changed.
- New-publication pair gate with --strict --new: FAIL. InstructGPT retains two paragraph-condition warnings and the generic count warning; Speculative Decoding retains six paragraph-condition findings plus its count/association warnings. Exact current findings and rationales are retained above. This legacy repair does not claim new-publication strict acceptance.
- No training, original model benchmark reproduction or claim of production performance was made. Whole-site build and remote CI/deployment are coordinator checks recorded separately in batch.json.
