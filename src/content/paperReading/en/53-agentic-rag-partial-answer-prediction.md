---
title: "Predicting Partial Answer Quality and Utility in Agentic Retrieval-Augmented Generation"
description: "A deep reading of Predicting Partial Answer Quality and Utility in Agentic Retrieval-Augmented Generation: turning intermediate answer quality, utility, and trajectory signals into an early-stopping controller, then checking the savings and transfer boundary."
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "The paper does not wait for the final answer to evaluate agentic RAG. It predicts quality and utility after each partial answer and asks whether the next retrieval and generation round is worth its cost."
  - "Quality is easier to predict than utility. On Search-R1, the best quality Pearson correlation is about 0.438 and the best utility correlation about 0.321, showing that “good enough now” and “better after another round” are different signals."
  - "With thetaP=0.3 and thetaU=0.2, the controller reduces average iterations from 3.21 to 2.86, a 10.89% reduction, while retaining 97.60% of natural-stopping quality."
  - "The evidence is bounded by Search-R1, R1-Searcher, three multi-hop QA benchmarks, an F1 probe, and fixed thresholds. The public code is inspectable, but large trajectories, indexes, checkpoints, and data are not bundled."
audience:
  - "Engineers building agentic RAG, multi-hop retrieval, trajectory evaluation, or adaptive inference"
  - "Research and platform teams that need a verifiable trade-off among answer quality, retrieval rounds, tokens, latency, and early stopping"
tags: ["Paper Reading", "RAG", "Agentic RAG", "Retrieval", "Evaluation", "Observability"]
image: "/paperReading/53-agentic-rag-partial-answer-prediction/title_image.webp"
field: "Information Retrieval"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
  - agent-memory-adaptation
paper:
  title: "Predicting Partial Answer Quality and Utility in Agentic Retrieval-Augmented Generation"
  authors:
    - "Fangzheng Tian"
    - "Debasis Ganguly"
    - "Craig Macdonald"
  year: 2026
  venue: "CIKM 2026（arXiv 2609.16453 v1，2026-09-15；accepted full paper）"
  links:
    pdf: "https://arxiv.org/pdf/2609.16453v1"
    arxiv: "https://arxiv.org/abs/2609.16453"
    doi: "https://doi.org/10.1145/3799682.3840904"
    code: "https://github.com/DanielTian97/agentic_rag_predictions"
    project: "https://arxiv.org/html/2609.16453v1"
series:
  id: "agentic-rag-trajectory-evaluation"
  title: "Agentic RAG 的軌跡評估"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** An agentic RAG system may execute several query, retrieve, read, and reasoning rounds before it produces a final answer. Running every instance to natural stopping wastes cost after the answer has saturated, while continuing after a failure pattern may only repeat the failure. The paper asks whether each partial answer can provide a prediction of quality and utility.
- **Core insight:** Partial quality and incremental utility are different targets. Quality asks how close the current answer is to the gold answer; utility asks how much quality changed from the previous round. Quality is easier to predict, while the sign and magnitude of utility depend more strongly on trajectory, retrieval noise, and task.
- **Strongest evidence:** On Search-R1 and R1-Searcher over HotpotQA, 2WikiMultiHopQA, and MuSiQue, the authors compare supervised and unsupervised predictors. Search-R1 reaches about 0.438 at the best quality Pearson correlation and about 0.321 for utility; with thetaP=0.3 and thetaU=0.2, the controller reduces average iterations from 3.21 to 2.86 and preserves 97.60% of natural-stopping quality.
- **Main boundary:** Partial answer quality is probed with F1 against a gold answer. That is not open-ended answer quality, and it does not show that a threshold transfers to a new retriever, model, corpus, answer format, or controller. Probing itself has generation cost.

My bounded verdict is: **the paper moves agentic RAG stopping from a fixed round cap toward trajectory-aware control. The valuable artifact is not the isolated 10.89% saving; it is the decision contract that puts current quality, next-round gain, natural stopping, and probe cost in the same record.** This remains a benchmark-bound predictor/controller study, not a universal early-stopping guarantee for production RAG.

> **Huahua's engineering note**
>
> Early stopping is not simply “stop when the predictor says good enough.” If the predictor cannot see missing evidence, query rewrite quality, retriever recall, abstention, downstream risk, or policy constraints, the system may save tokens while leaving correctness debt for the next layer.

## Version, sources, and the reader question

This article reads [Predicting Partial Answer Quality and Utility in Agentic Retrieval-Augmented Generation](https://arxiv.org/abs/2609.16453) v1, submitted to arXiv on 2026-09-15. The authors are Fangzheng Tian, Debasis Ganguly, and Craig Macdonald; the metadata also identifies it as an accepted full CIKM 2026 paper. I checked the [full arXiv HTML](https://arxiv.org/html/2609.16453v1), [PDF](https://arxiv.org/pdf/2609.16453v1), Figures 1–5, Tables 1–4, Sections 3–7, the limitations and future-work discussion, and the authors’ [agentic_rag_predictions code repository](https://github.com/DanielTian97/agentic_rag_predictions). The paper page marks the ACM article CC BY 4.0; the body figures below come from the original HTML assets.

The reader question is: **For an agentic RAG loop that keeps searching, when is another round worth its cost, and when does it only disturb an answer that has stabilized?** This follows [VikingRAG’s structured evidence navigation](/en/paper-reading/48-vikingrag-structured-document-retrieval/), [DocMemo’s dynamic evidence discovery](/en/paper-reading/21-docmemo-dynamic-evidence-discovery/), and [EvoOntology’s self-evolving retrieval structure](/en/paper-reading/50-evoontology-self-evolving-ontology/): this paper shifts the focus from how to search toward when to stop.

## Evidence map: Paper, Evidence, and Bloss0m judgment

| Layer | What this reading says |
| --- | --- |
| **Directly supported by the Paper** | The definitions of partial quality and utility; trajectory prefixes; probing; supervised and unsupervised predictors; Search-R1 and R1-Searcher setup; three multi-hop QA datasets; correlations; ablations; threshold controller; and iteration／quality trade-offs. |
| **Author claims** | Quality is more predictable than utility; trajectory signals provide early-stopping evidence before natural stopping; a simple controller can lower average iterations while preserving most natural-stopping quality. |
| **Not established by the Evidence** | Transfer to open-ended long-form answers, a different corpus, LLM, retriever, tool failure pattern, or adversarial retrieval; and equivalence between an F1 probe and real user utility. |
| **Bloss0m engineering judgment** | Store a stopping decision as a replayable controller event: trajectory prefix, predicted P／U, threshold version, evidence gap, probe cost, natural-stop comparator, and human or policy override. |

### Paper Essence Contract

1. **What problem does it solve?** It predicts partial answer quality and utility while an agentic RAG trajectory is forming, so the system can stop before spending another retrieval round unnecessarily.
2. **Why are previous approaches insufficient?** A fixed iteration cap does not know each instance’s saturation point. Looking only at the final answer is too late for control, while quality alone cannot answer whether another round will add value.
3. **What is the core technical idea?** Build answer, retrieval, confidence, similarity, and question-iteration alignment features from a trajectory prefix; train quality and utility predictors; then pass their estimates to a state-based early-stopping controller.
4. **How does one input flow?** Question → initial answer and retrieval trajectory → partial-answer probe after each round → prefix features → predict P_i and U_i → use thetaP and thetaU to stop, roll back, or continue → compare against natural stopping on iterations and quality.
5. **What evidence supports the headline claim?** Table 2’s trajectory statistics, Table 3’s predictor correlations, Table 4’s feature ablation, Figure 3’s utility distributions, Figure 4’s trajectory patterns, and Figure 5’s stopping trade-off.
6. **Where does the claim stop?** The study demonstrates control evidence under fixed models, datasets, retriever, probe, and thresholds. It is not a transferable quality oracle and does not cover every open-ended, tool-use, or production risk.

## Core intuition: separate “answer quality now” from “value of another round”

An ordinary agentic RAG loop often collapses “can we find more evidence?” and “do we already have enough answer?” into one continue heuristic. This paper separates them:

- **Partial quality P_i:** the quality of answer a_i against the gold answer a*, measured with F1 as the benchmark probe.
- **Utility U_i:** the quality added by the current round, defined as U_i = P_i − P_{i−1}; it can be positive, negative, or close to zero.
- **Natural stopping:** the original Search-R1 or R1-Searcher loop stops according to its own behavior. This is the controller’s cost and quality comparator, not an oracle.
- **Control decision:** the predictor sees only the current and prior trajectory prefix; it cannot read the future gold score. The controller uses predicted P and U with thresholds to stop, roll back, or continue.

The separation exposes a common mistake. If the current answer is already stable, quality may be high while utility is low, so another search has little expected value. If quality is low but utility is positive, another round may still be worthwhile. If both are low or utility is negative, continuing blindly may not recover the answer. A useful controller therefore needs both signals and must also know predictor uncertainty and evidence gaps; a fixed cap alone is not a stopping policy.

## Worked example: walking through agentic RAG with Figure 1

![Figure 1: where partial-answer prediction sits in the agentic RAG pipeline](/paperReading/53-agentic-rag-partial-answer-prediction/paper/figure-1-in-trajectory-prediction.png)

*Figure 1 (original paper Section 3.1, trajectory and in-trajectory prediction): a question enters initial reasoning, then repeats query and retrieval before producing a partial answer. The predictor estimates quality／utility on each prefix, and the controller decides whether to stop or continue. See the [original figure and caption](https://arxiv.org/html/2609.16453v1#S3.F1). License status: the paper page marks the work CC BY 4.0; this article uses the original figure without altering its content.*

Following the abstraction in Figure 1, an input does not move directly to an answer; it forms a trajectory:

1. **Initial state:** question q*, initial reasoning or retrieval state r0, and a0 generated from the model’s parametric knowledge. i=0 can have no external passage, so it is not the same as an empty answer.
2. **Round i:** the agent generates query qi, retrieves context ci, updates retrieval state ri, and greedily decodes partial answer ai.
3. **Prefix formation:** the trajectory can be written as tau_i = (q*, r0, {qj, cj, rj} for j=1 to i). The predictor may use only answer, retrieval, and trajectory features inside this prefix.
4. **Offline target:** using the benchmark gold answer, the authors compute P_i = F1(a_i, a*) and U_i = P_i − P_{i−1}. A production controller cannot see this gold score, so it must learn a prediction.
5. **Controller decision:** if predicted quality is high or predicted utility indicates that the current state is sufficient, stop; if a formerly high-quality state has degraded, roll back to the earliest high-quality state; otherwise continue retrieving.

The worked example matters because it places the decision point after a partial answer is formed but before the next round incurs cost. It also preserves an evaluator mismatch: F1 is a research probe. A real user may care about citation completeness, freshness, policy compliance, explanation quality, or abstention rather than lexical overlap.

## Method and predictors: extracting signals from a trajectory prefix

### Signals cover answer, retrieval, and trajectory

The authors group features into families. Intra-iteration features observe query and context quality-prediction signals, answer confidence, and the current answer state. Inter-iteration features observe answer, query, and context similarity across adjacent steps or windows, including RBO, SBERT similarity, and confidence deltas. Question-iteration alignment asks whether new queries remain aligned with the original question. These signals are not presented as causal explanations; they are prefix-observable changes used to estimate P_i and U_i.

There are supervised and unsupervised predictor paths. Supervised models use cross-encoder or regressor-style learners to predict partial quality or utility. Unsupervised models combine similarity, confidence, and retrieval signals. Some settings use an MLP with windows w in {1, 3, 5} and hidden layers of 16 and 8. The authors also compare probing and non-probing. Probing directly measures a partial answer but requires extra generation; non-probing avoids that call and uses the existing trajectory.

### The controller has states, not one threshold

The controller turns thetaP and thetaU into states. In the paper’s semantics:

- **State 0:** predicted quality is high and predicted utility supports the current state as sufficient, so stop the current trajectory.
- **State 1:** quality is high but the utility signal is unstable; the controller can stop conservatively or observe the next decision.
- **State 2:** quality is below threshold or new evidence may still have value, so continue.
- **State 3:** the trajectory has degraded after state 0 or 1; roll back to the earliest high-quality state instead of assuming the last answer is best.

This reveals two implementation risks. First, rollback must retain the answer, evidence, and trajectory pointer rather than rewrite one string. Second, thresholds are model, dataset, probe, and metric specific. thetaP=0.3 does not automatically transfer to another F1 definition, answer length, or open-ended judge.

## Experimental setup: two agents, three benchmarks, and a fixed retrieval world

The authors use Qwen2.5-7B Search-R1 and R1-Searcher. Retrieval uses E5 over 2018 Wikipedia passages with top-3 results; the tool and evaluation environment is based on PyTerrier and FlashRAG. Datasets are HotpotQA, 2WikiMultiHopQA, and MuSiQue. Metrics include answer F1, partial quality, utility, Pearson and Kendall correlations, average iterations, and relative quality preservation. The training setup combines multiple training splits, while evaluation follows each benchmark’s dev or evaluation protocol.

Table 2’s trajectory statistics are an important baseline. Search-R1 final F1 is about 0.549, 0.429, and 0.274 for HotpotQA, 2Wiki, and MuSiQue; delta F1 is about 0.265, 0.155, and 0.155; average utility is about 0.097, 0.045, and 0.047; and average iterations are about 2.730, 3.463, and 3.337. R1-Searcher final F1 is about 0.529, 0.454, and 0.272, with average iterations about 2.311, 2.386, and 2.718. These numbers show that trajectory length, quality, and per-step gain do not have a fixed ratio; one more round means different things for different agents.

Compute, retrieval indexes, model checkpoints, and generation cost are part of the experimental boundary. The result tables are not a token budget that can be re-derived without hardware, batch, provider, and probing details. If every probe is added to production, the generation cost of the evaluator may consume the saved retrieval rounds.

## RQ1: are partial quality and utility predictable?

![Figure 3a: utility prediction distribution and trajectory traces on Search-R1](/paperReading/53-agentic-rag-partial-answer-prediction/paper/figure-3a-utility-search-r1.svg)

*Figure 3a (original paper Section 6.1, RQ1／Search-R1): utility values concentrate near zero while positive and negative tails remain; the next round’s gain is not a stable constant. See the [original figure and caption](https://arxiv.org/html/2609.16453v1#S6.F3). License status: the paper page marks the work CC BY 4.0; this article uses the original figure without altering its content.*

![Figure 3b: utility prediction distribution and trajectory traces on R1-Searcher](/paperReading/53-agentic-rag-partial-answer-prediction/paper/figure-3b-utility-r1-searcher.svg)

*Figure 3b (original paper Section 6.1, RQ1／R1-Searcher): after changing the agent, the near-zero concentration, positive and negative tails, and fluctuations still need to be separated; an average gain is not a replacement for a trajectory. See the [original figure and caption](https://arxiv.org/html/2609.16453v1#S6.F3). License status: the paper page marks the work CC BY 4.0; this article uses the original figure without altering its content.*

The common message in Figures 3a and 3b is a distribution concentrated near zero with positive and negative tails. Figure 4 further separates three trajectory shapes: positive trajectories improve in early rounds and plateau; negative trajectories drop early and usually fail to recover; zero trajectories fluctuate without net improvement. These patterns explain how quality can be high while utility is low.

Table 3 shows that quality is more predictable than utility. Search-R1’s best quality Pearson is about 0.438 with Kendall tau about 0.345; its best utility Pearson is about 0.321 with tau about 0.208. R1-Searcher quality is also around 0.4, while its best utility is about 0.321. Supervised predictors are generally strongest; combining all feature families is close to or reaches the best result, but probing adds little correlation and costs generation. The evidence supports “there is signal in the trajectory prefix,” not “the predictor is a reliable oracle.”

## RQ2: which feature families actually help?

Table 4 reports a Search-R1 ablation. Quality-predictor Pearson correlation is:

- intra-iteration: about 0.323／0.351／0.347 for windows 1／3／5;
- inter-iteration: about 0.312／0.331／0.334;
- question-iteration alignment: about 0.306／0.326／0.330;
- all families: about 0.343／0.363／0.358, with the paper reporting p<.05.

There are two ways to read this. First, window 3 is often more stable than window 1, so a short change pattern contains more information than one step. Window 5 does not keep improving, showing that a longer history is not a free gain. Second, all features provide bounded improvement rather than making every signal production-worthy. Feature acquisition, logging, privacy, latency, and missingness change the real cost.

## RQ3: the savings and quality trade-off

![Figure 5: early-stopping trade-off between quality preservation and average iterations](/paperReading/53-agentic-rag-partial-answer-prediction/paper/figure-5-tradeoff.svg)

*Figure 5 (original paper Section 6.3, RQ3): the Search-R1 threshold controller forms a trade-off between average iterations and quality relative to natural stopping. More aggressive stopping can save more rounds while reducing quality preservation. See the [original figure and caption](https://arxiv.org/html/2609.16453v1#S6.F5). License status: the paper page marks the work CC BY 4.0; this article uses the original figure without altering its content.*

Search-R1 natural stopping averages 3.21 iterations. With thetaP=0.3 and thetaU=0.2, the controller lowers the average to 2.86, a 10.89% reduction, while retaining 97.60% of natural-stopping quality. Raising thetaU to 0.3 increases quality preservation to 98.49% but adds about 0.06 iterations. This is a sensible frontier: requiring stronger evidence that utility has fallen saves fewer rounds but preserves more quality.

A fixed iteration cap is a baseline, not the same controller. A sharper cap produces a more visible quality drop. Probing can provide additional partial-answer information, but each round also generates evaluator output, so extra quality cannot be read without latency and token cost. The evidence supports an adaptive controller over a crude fixed cap in this harness; it does not establish one threshold as optimal for all traffic.

## Artifact status and reproducibility

The authors’ [GitHub repository](https://github.com/DanielTian97/agentic_rag_predictions) is public, uses master as its default branch, and contains control, predictions, probing, prediction_head, tests, environment.yml, and figure or documentation paths. I independently inspected the README and tree. It clearly exposes probing, feature, predictor, and controller code plus lightweight tests. It also states that Python 3.11, PyTorch, FAISS, Java, model-provider access, retrieval indexes, data, and checkpoints are needed.

Large trajectory dumps, retrieval results, dense and sparse indexes, model checkpoints, and datasets are not included in a clean clone. The repository also has no clear open-source license file. Its status is closer to inspectable code paths and reproducible control flow than a download-and-run reproduction of Tables 2–4 and Figure 5. This is a conditional artifact result: the code is reachable and readable, but full reproduction needs external data, indexes, models, and compute.

The [10.1145/3799682.3840904 DOI](https://doi.org/10.1145/3799682.3840904) identifies the CIKM 2026 record. I independently checked the DOI endpoint on 2026-09-17 and received HTTP 404, so this reading preserves it as a publication identifier rather than calling the current endpoint a downloadable artifact. It does not replace the missing data and checkpoint bundle in the repository. A credible rerun would also need fixed Qwen2.5-7B checkpoint, retriever version, 2018 Wikipedia snapshot, top-3 index, probe prompt and decoding policy, threshold configuration, evaluation split, and hardware or generation accounting.

## Bloss0m engineering synthesis: make stopping a replayable event

This section is a Bloss0m engineering judgment, not a paper claim. I would store every controller decision as an immutable event:

| Event field | Why retain it | What goes wrong without it |
| --- | --- | --- |
| Trajectory-prefix hash and step index | Identify the history visible to the predictor | The same answer cannot be traced back to its signals |
| Partial answer, retrieved evidence, and source version | Connect P_i and U_i to evidence | A score exists without a way to inspect missing evidence |
| Predicted P, predicted U, uncertainty, and threshold version | Explain stop or continue | A threshold update makes old decisions uninterpretable |
| Natural-stop comparator and fixed-cap counterfactual | Measure savings and quality cost | 10.89% becomes a marketing number without a baseline |
| Probe latency, tokens, model, provider, and cache state | Include evaluator cost in TCO | Probing may consume the stopping savings |
| Policy override, abstention, and rollback pointer | Give high-risk queries a safety exit | A predictor error leaves only the final answer |

The contract also needs an explicit evidence gap. If a query has not covered a necessary entity, the retriever returns conflicting passages, citations are incomplete, a tool returns unknown, or a policy rule is unresolved, the controller cannot inspect predicted P alone. It should hand control to continue, abstain, human review, or a deterministic verifier. This is an engineering extension from the paper’s evidence, not a safety mechanism evaluated by the paper.

### When is this worth using?

Early stopping is worth considering when traffic is large, each retrieval and generation round has measurable cost, a partial-quality proxy can be calibrated, trajectories are logged, the natural-stop baseline is stable, and abstention or a downstream verifier can catch stop errors. It is an adaptive-compute controller, not a substitute for answer correctness.

### When should it not be used directly?

Do not directly move the F1 predictor and thetaP／thetaU into production for open-ended long-form research, high-risk legal or medical advice, tasks where citation completeness dominates, or systems whose corpus and retriever are changing rapidly. Novel entities, tool failures, multilingual evidence, adversarial passages, and fresh-data queries can sit outside training. A fixed cap may be crude, but while a predictor is uncalibrated and trajectories are not observable, it can be easier to govern than an unvalidated adaptive stop policy.

## Limitations, failure modes, and evidence boundary

The first limitation is task and metric. F1 is useful for short-answer multi-hop QA but cannot describe open-ended explanations, citation validity, freshness, policy compliance, or user utility. The second is model and retriever: the study uses Search-R1, R1-Searcher, Qwen2.5-7B, E5 top-3, 2018 Wikipedia, and three benchmarks. Model size, retrieval depth, tool failure patterns, corpus drift, and answer format can change the predictor.

There is also probe cost and controller simplicity. In-trajectory probing gives more direct partial-answer evidence but consumes generation latency; non-probing lowers cost while relying on existing signals. The controller is a simple heuristic state machine, not an uncertainty-aware optimal stopping policy. The paper identifies advanced agentic RAG and open-ended long-form settings as future work. Therefore 97.60% is not a quality guarantee, and 10.89% is not a fixed cost saving.

Finally, the artifact boundary matters. The repository does not include large data, indexes, or checkpoints and has no clear license; missing confidence intervals for transfer cannot be invented by this reading. A clean clone can validate control flow without reproducing every table on the same corpus, model, and hardware. These are artifact, cost, and transfer diagnostics, not a dismissal of the work.

## Three things to remember

1. **Quality and utility are different:** an answer can already be good while another search adds little, or be weak while the next round still has positive utility.
2. **Report adaptive stopping with natural stopping:** moving Search-R1 from 3.21 to 2.86 iterations, a 10.89% reduction, means something only alongside 97.60% quality preservation.
3. **A predictor is not an oracle:** F1 probing, fixed thresholds, three benchmarks, specific models and retrievers, and an incomplete artifact define the claim boundary. Production still needs evidence gaps, abstention, logging, and verification.

## Primary sources

- [Predicting Partial Answer Quality and Utility in Agentic RAG arXiv record](https://arxiv.org/abs/2609.16453)
- [Full arXiv HTML](https://arxiv.org/html/2609.16453v1)
- [Paper PDF](https://arxiv.org/pdf/2609.16453v1)
- [ACM DOI／CIKM 2026 record](https://doi.org/10.1145/3799682.3840904)
- [Official code repository](https://github.com/DanielTian97/agentic_rag_predictions)
