---
stableId: "arxiv:2609.16453"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-17
lastVerifiedAt: 2026-09-17
primaryTrack: "retrieval-systems"
primaryGap: "rag-evaluation"
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

# Predicting Partial Answer Quality and Utility in Agentic Retrieval-Augmented Generation

## Identity

- Search window: strict 72-hour scan ending 2026-09-17; arXiv v1 was submitted on 2026-09-15.
- Canonical URL: https://arxiv.org/abs/2609.16453
- Full paper: https://arxiv.org/html/2609.16453
- Authors: Fangzheng Tian, Debasis Ganguly, and Craig Macdonald.
- Venue or review status: arXiv preprint; DOI metadata identifies a CIKM 2026 publication record, but this brief treats the arXiv v1 as the verified source version.
- DOI: https://doi.org/10.1145/3799682.3840904
- Code: Public repository https://github.com/DanielTian97/agentic_rag_predictions. It exposes probing, feature extraction, predictor, and controller code; large benchmark data, indices, checkpoints, and cluster artifacts are not bundled.

## Editorial fit

- Reader question: Can an agentic RAG system know that another retrieval step is unlikely to help, before spending another model call?
- Why this belongs in the selected track: It treats the intermediate trajectory—not only the final answer—as the object to evaluate, and turns that signal into a controllable stopping decision.
- Gap it fills: `retrieval-systems / rag-evaluation`, especially evaluation of partial progress, marginal retrieval utility, and compute-aware stopping.
- Why now: Long-horizon retrieval agents are often tuned around final answer accuracy, even though many iterations add no evidence or can make the trajectory worse. This paper supplies definitions, predictors, and an explicit quality-versus-compute trade-off that can be implemented as an evaluation layer.

## Claim map

- Problem: A final score cannot explain whether the latest retrieval-reasoning iteration improved the answer, wasted a call, or introduced a negative trajectory.
- Main claim: Partial answer quality and incremental utility can be estimated from an in-trajectory probe and used to stop Search-R1 and R1-Searcher earlier while preserving most of the quality reached by natural stopping.
- Method: After each retrieval-reasoning iteration, probe the current answer, define partial quality `P_i`, and define utility as `U_i = P_i - P_{i-1}`. Train predictors from trajectory features, then apply thresholds for predicted quality and utility to decide whether to continue.
- Signal families: The paper compares signals derived from the answer, retrieved passages, and the trajectory. The purpose is to distinguish “the answer is already good,” “the next step is unlikely to add value,” and “the trajectory is still improving.”
- What is genuinely new: The contribution is not another retriever alone. It makes intermediate answer state and marginal utility first-class RAG evaluation targets, then connects those targets to early stopping without an additional full generation for every controller decision.

## Evidence audit

- Systems and tasks: Search-R1 and R1-Searcher are evaluated on HotpotQA, 2WikiMultiHopQA, and MuSiQue. Retrieval uses top-3 E5 passages from a 2018 Wikipedia collection.
- Ground-truth and metrics: Partial answer quality is computed from answer-level correctness signals; the paper reports predictor correlation, stopping quality, average iterations, and trajectory patterns rather than only final QA accuracy.
- Predictor evidence: Supervised predictors reach Pearson correlation up to 0.438 for quality in Search-R1, with quality-prediction correlations above 0.43 in the reported setting. The paper also separates weak, strong, plateau, and negative trajectories, showing that most iterations have zero utility and decisive iterations are sparse and often early.
- Controller evidence: With quality threshold `thetaP = 0.3` and utility threshold `thetaU = 0.2`, average iterations fall from 3.21 under natural stopping to 2.86, a 10.89% reduction, while retaining 97.60% of natural-stopping quality. A `thetaU = 0.3` setting retains 98.49% quality at a small iteration increase of about 0.06.
- Comparisons: The controller is compared with natural stopping and fixed iteration caps. The paper also reports a non-probing path intended to avoid extra generation overhead, making the cost argument more concrete than a quality-only ablation.
- Statistical uncertainty: The brief records the paper’s aggregate correlations and benchmark averages. It does not infer confidence intervals, production savings, or generalization beyond the named systems and datasets.
- Threats to validity: The probe and answer-quality definition may not transfer to open-ended or poorly verifiable tasks; trajectory features may depend on retriever, corpus, prompt, and backbone; and the thresholds are not a universal policy.

## Reproducibility

- Available artifacts: The public GitHub repository contains the core implementation, predictor/controller paths, configuration material, and environment guidance. It is inspectable but has no release archive and only limited repository activity at verification time.
- Environment or compute requirements: The README describes a Python 3.11 environment with PyTorch, FAISS, Java, model-provider access, retrieval indexes, and the Search-R1/R1-Searcher data and checkpoints. Reproduction also requires the relevant retrieval corpus and enough inference budget to generate trajectories.
- Smallest useful reproduction: Run one system on one benchmark subset, save every intermediate answer and retrieved passage, calculate `P_i` and `U_i`, fit or load the predictor, and compare natural stopping with one threshold pair. Inspect stopped trajectories manually before scaling to all three datasets.
- Blocking unknowns: The repository does not provide all large benchmark data, retrieval indices, model checkpoints, or the authors’ compute environment. A clean-clone run can verify the control flow and definitions, but not necessarily reproduce every table.

## Critical reading

- Strongest result: The paper connects a measurable intermediate signal to an operational decision: roughly one fewer retrieval-reasoning step per ten while preserving 97.60% of the natural-stopping quality in the reported threshold setting. The sparse decisive-iteration analysis also gives a plausible reason why early stopping can work.
- Weakest assumption: A probe-derived estimate of partial answer quality is reliable enough across trajectory states to stop an agent without hiding evidence that would be needed for a later multi-hop step.
- Engineering consequence: A production RAG evaluator should log the answer state, newly retrieved evidence, predicted marginal utility, stop reason, and final outcome as separate fields. Otherwise “fewer iterations” cannot be audited against answer degradation.
- Claims not supported by the evidence: The results do not establish lower total monetary cost for every provider, better citation faithfulness, safety under adversarial retrieval, or transfer to arbitrary long-horizon agents and corpora.

## Bloss0m connection

- Related Traditional Chinese routes: [VikingRAG](/paper-reading/48-vikingrag-structured-document-retrieval/), [DocMemo](/paper-reading/21-docmemo-dynamic-evidence-discovery/), and [EvoOntology](/paper-reading/50-evoontology-self-evolving-ontology/).
- Related English routes: [VikingRAG](/en/paper-reading/48-vikingrag-structured-document-retrieval/), [DocMemo](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/), and [EvoOntology](/en/paper-reading/50-evoontology-self-evolving-ontology/).
- Suggested article angle: “RAG 不只要知道答案對不對，還要知道下一次搜尋值不值得。” Use the paper’s `P_i`/`U_i` vocabulary to explain why retrieval traces need a marginal-utility contract.
- Duplication risk: Low. Existing readings discuss retrieval structure, evidence memory, and semantic evolution; this candidate adds trajectory-level quality prediction and compute-aware stopping.

## Recommendation

- Output level: Deep Read candidate; it is a strong fit for a detailed bilingual paper reading because the problem, intermediate-state definitions, benchmark evidence, controller thresholds, and reproducibility boundary can all be taught explicitly.
- Score rationale: 29/30: direct RAG-evaluation relevance, a crisp and novel control objective, multiple agentic RAG systems and datasets, strong quantitative evidence, high engineering value, and an inspectable code artifact. Reproducibility is held at 4 because the large data, indexes, checkpoints, and compute environment are external.
- Open questions requiring human approval: How should a production system calibrate `thetaP` and `thetaU` per task? Can the probe be replaced by a cheaper verifier? What evidence must be retained to prove that a stopped trajectory did not miss a necessary later hop?
