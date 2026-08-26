---
title: "Before Reasoning Can Fail: Pre-Evidence Procedural Failures in Agentic RAG"
description: "A deep read of how Before Reasoning Can Fail turns answer-before-reading into an observable trajectory failure, and tests whether Read-Gate actually improves multi-hop QA."
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "This arXiv v1 preprint separates pre-evidence discipline failures from post-gold-read failures in agentic RAG."
  - "Across 12,000 paired trajectories on HotpotQA, 2WikiMultiHopQA, and MuSiQue, the two failure indicators overlap only 11.2%–13.1%, so they should not be collapsed into one reasoning error."
  - "Read-Gate raises LLM-Acc by 3.2–9.4 points on full gpt-5-mini minimal cells, while small medium-reasoning boundary checks show zero or negative gains."
  - "The portable engineering lesson is to observe the search → read → final boundary before deciding whether to gate it; Read-Gate is not retrieval-quality monitoring or answer verification."
audience:
  - "AI engineers designing agentic RAG controllers, trace logging, or evidence provenance."
  - "Technical leads separating retrieval, evidence inspection, generation, and verification failures."
tags: ["Paper Reading", "RAG", "Agentic RAG", "Retrieval", "Evaluation", "Observability"]
image: "/paperReading/15-before-reasoning-fails/title_image.webp"
field: "Retrieval Systems"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
paper:
  title: "Before Reasoning Can Fail: Pre-Evidence Procedural Failures in Agentic RAG"
  authors:
    - "Daeyoung Roh"
    - "Donghee Han"
  year: 2026
  venue: "arXiv cs.AI preprint, v1 (submitted 2026-08-03)"
  links:
    pdf: "https://arxiv.org/pdf/2608.02011v1"
    arxiv: "https://arxiv.org/abs/2608.02011"
    doi: "https://doi.org/10.48550/arXiv.2608.02011"
    code: "https://github.com/Noverse0/before-reasoning-fails"
series:
  id: "production-rag-controls"
  title: "Production RAG Controls"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** an agentic RAG system can search snippets but finalize before reading. That is a procedural failure before evidence-conditioned reasoning, distinct from being wrong after reading gold evidence.
- **Core insight:** saved tool traces, retrieved/read passages, and final answers define discipline and post-gold-read failure; Read-Gate requires at least one read after search and before final, without changing model, retriever, or reasoning budget.
- **Strongest evidence:** 12,000 paired trajectories over HotpotQA, 2WikiMultiHopQA, and MuSiQue; forced reading adds 14.9–19.9 LLM-Acc points on the zero-read subset and 3.2–9.4 on full minimal-reasoning cells (Table 1; Section 5.2).
- **Main boundary:** it applies to systems with observable search/read/final actions; reading does not guarantee the right evidence or reasoning, and incomplete MuSiQue gold chunks limit post-gold-read analysis.

## Why the previous approach is insufficient

Final accuracy or a larger hidden-thinking budget cannot reveal whether evidence was inspected. An agent can retrieve a snippet and answer from priors or that snippet. Policy learning changes preferences but does not guarantee a checkable read-before-final invariant at runtime (Sections 2–3).

## Core intuition and method

Wrong trajectories use priority accounting across discipline, post-gold-read, retrieval, and ambiguity, while multi-label indicators test co-occurrence. Read-Gate is deliberately narrow: after search, `read_count=0` rejects final and returns a corrective observation. It enforces an evidence-inspection action rather than injecting more context (Figure 2; Sections 3.1–3.4).

## Worked example: a two-hop question

Search returns two snippets. A voluntary agent finalizes without opening either and is wrong: it is a no-read discipline failure. Read-Gate blocks final and requires reading a candidate chunk; if the answer remains wrong, it may be post-gold-read, retrieval, or ambiguity. Supplying the same text without a read action is exactly what the ctx-inject control separates. This is an explanatory Figures 1–2 walkthrough.

## How to read the evidence

**Figure 3 / Table 1** separate the selected zero-read rescue subset from population effect: 14.9–19.9 is not every query's marginal effect. **Table 2 / Section 5.4** compares no gate, Read-Gate, and ctx-inject to ask whether gain is only extra context. **Sections 5.5–5.6 and Appendices C–D** test reasoning level, extractors, thresholds, paired McNemar tests, and bootstraps. More hidden thinking does not guarantee reading, but that does not make every gate free or every failure recoverable.

## Artifacts and engineering decision

As of **2026-08-09**, the [official repository](https://github.com/Noverse0/before-reasoning-fails) is reachable. The paper announces the full agent loop, reproduction scripts, 33,950 raw trajectories (49 files), and cached analysis outputs. Full reproduction still needs clone-level license, data processing, OpenAI API/model-version, and cost verification. Use a minimal read invariant and traces in high-risk evidence workflows. Do not force it onto implicit-retrieval systems with no read boundary or treat “read” as a grounding guarantee.

## Three things to remember

1. Search does not mean evidence inspection; procedural failure can precede reasoning.
2. Read-Gate is a runtime action constraint, not a synonym for a stronger model or more context.
3. Deployment must measure read quality, retrieval coverage, latency, and residual post-read errors.

An agent can retrieve a plausible snippet, skip the full passage, and still produce an answer. That answer may be accidentally correct, or it may look reasoned even though the system never entered evidence-conditioned reasoning. Roh and Han’s **Before Reasoning Can Fail** asks a more operational question than “can the model think?”: did the model execute the evidence-inspection procedure that should precede the answer?

> **Huahua's engineering note**
>
> If a trace stores only the final answer—not the search, read, chunk identity, and finalization boundary—you cannot tell whether the failure came from retrieval, evidence inspection, or post-read reasoning.

## The short answer: yes, an agent can fail before reasoning is tested

**Reader question: Can a RAG agent be wrong because it never inspected retrieved evidence, even when its answer-side reasoning looks substantial?**

Yes, with an important qualification: the paper defines this failure from saved trajectories on an agentic RAG interface with discrete `search`, `read`, and `final` actions. It does not show that every error is caused by “not reading,” nor that Read-Gate turns a general enterprise RAG system into a reliable one.

Across 12,000 paired trajectories, the authors assign wrong cases to four mutually exclusive accounting buckets: discipline, post-gold-read, retrieval, and residual ambiguity. The multi-label version allows discipline and post-gold-read indicators to co-occur; their both-trigger rate is **11.2%–13.1%** across regex and spaCy entity extractors. That supports the claim that the two failures are not the same axis, not a universal estimate of all RAG errors ([abstract and §3.1–§3.4](https://arxiv.org/html/2608.02011v1#S3)).

## Paper identity, version, and scope

This article follows the assigned **arXiv v1**, submitted **August 3, 2026**, by Daeyoung Roh and Donghee Han. It is a cs.AI preprint, not an accepted conference or journal paper. There is a versioning wrinkle: as of August 7, 2026, the arXiv record already lists a v2 revised on August 4. The numbers, figures, and anchors below are fixed to the assigned [v1 HTML](https://arxiv.org/html/2608.02011v1) and [v1 PDF](https://arxiv.org/pdf/2608.02011v1), so this should not be read as a v2 results summary.

The study targets English, Wikipedia-style multi-hop QA. Its unit of observation is not an answer alone, but a trajectory containing tool calls, retrieved snippets, read passages, gold evidence, and the final answer. For wrong trajectories, the paper uses this priority order for mutually exclusive accounting:

$$
\mathcal{E}_{wrong}=\mathcal{E}_{disc}\;\dot{\cup}\;\mathcal{E}_{post}\;\dot{\cup}\;\mathcal{E}_{retr}\;\dot{\cup}\;\mathcal{E}_{amb}.
$$

Here $\mathcal{E}_{disc}$ means a wrong answer that violates the evidence-inspection protocol; $\mathcal{E}_{post}$ means the agent read at least one gold-supporting chunk and was still wrong; $\mathcal{E}_{retr}$ means gold evidence was absent from the top-$k$ results; and $\mathcal{E}_{amb}$ is the residual bucket. The authors stress that these are deterministic measurements over saved trajectories, not psychological claims about latent model cognition ([§3 Framework](https://arxiv.org/html/2608.02011v1#S3)).

## Method skeleton: make reading an inspectable runtime invariant

The experimental workflow has four steps:

1. **Save the trajectory**: record the top-five chunk IDs and snippets returned by `search`, full chunks returned by `read`, read count, gold evidence, and the final answer.
2. **Label the error axes**: check no-read final, snippet-only final, and low-evidence final; then check whether a gold-supporting chunk was read; only afterward assign retrieval or ambiguity.
3. **Add Read-Gate**: if the model emits `final` with `read_count=0`, the environment rejects the action and returns a corrective observation asking it to call `read` on a promising chunk. Read-Gate does not change model weights, the retriever, index, judge, temperature, or reasoning budget ([§3.2–§3.3](https://arxiv.org/html/2608.02011v1#S3.SS2)).
4. **Run paired comparisons**: compare no-gate, reasoning-effort variants, and Read-Gate on the same question IDs, reporting accuracy, error rates, paired tests, and loop/cost overhead.

The invariant is “a read occurs after search and before final,” not “the correct chunk was read” or “the answer was verified.” That distinction is the paper’s most important engineering boundary.

## Experimental setup: data, controllers, baselines, and metrics

### Datasets and sample design

The main study uses three Wikipedia-style multi-hop QA datasets: **HotpotQA, 2WikiMultiHopQA, and MuSiQue**. Each dataset × condition cell contains $n=1{,}000$ examples paired by question ID. The four OpenAI controller conditions are:

1. `gpt-4o-mini`;
2. `gpt-5-mini` with minimal reasoning;
3. `gpt-5-mini` with medium reasoning;
4. `gpt-5-mini` minimal reasoning plus Read-Gate.

Three datasets × four conditions × 1,000 questions produce **12,000 OpenAI-family paired trajectories**. Medium-reasoning boundary ablations and the gate-family probe use matched $n=100$ samples and should not be mixed with the full $n=1,000$ cells. The processed MuSiQue export lacks complete per-chunk gold-evidence fields, so MuSiQue supports aggregate accuracy, discipline failures, and Read-Gate effects, while analyses requiring gold chunks are mainly restricted to HotpotQA and 2WikiMultiHopQA ([§4.1](https://arxiv.org/html/2608.02011v1#S4.SS1)).

### Agent interface, retrieval, and judging

The two tools are hybrid `search` and full-chunk `read`. Search combines BM25 with a Qwen3-Embedding-0.6B dense retriever using reciprocal-rank fusion with $k=60$, then returns the top-$k=5$ chunk IDs and short snippets. `read` expands a chunk ID to its full text; duplicate chunk IDs across search calls are not charged again as new evidence. The main loop cap is 10, the token budget is 128k, and temperature is 0.0.

The primary metric is **LLM-Acc**: a fixed gpt-5-mini judge sees only the question, gold answer, and prediction, then returns a binary semantic-equivalence label. **Contain-Acc** is a secondary string-containment metric where short-form gold answers exist. The paper also reports discipline/post-gold-read rates, odds ratios, exact McNemar tests, question-clustered logistic models, paired bootstrap 95% CIs, and within-cell stratified label permutation. Gemini 2.5 Flash is only an external hidden-thinking-budget diagnostic; Gemini 2.5 Pro re-judges a stratified $n=450$ sample for cross-judge robustness and is not the main controller.

## Figure 2: wrong trajectories have four actionable branches

![Figure 2: trajectory-level error decomposition](https://arxiv.org/html/2608.02011v1/x2.png)

*Figure 1 — Paper Figure 2 assigns wrong trajectories by priority to discipline, post-gold-read, retrieval, and ambiguity; Read-Gate directly blocks only the discipline branch. Source: [Figure 2, §3](https://arxiv.org/html/2608.02011v1#S3.F2). The figure is attributed to Daeyoung Roh and Donghee Han under the paper’s [arXiv non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html); that page is not a CC BY statement.*

The three discipline subtypes mean different things:

- **No-read final**: a wrong answer is emitted with `read_count=0`; this is the primary signal that does not depend on entity-matching heuristics.
- **Snippet-only final**: an answer entity appears in a search snippet but never in a read chunk.
- **Low-evidence final**: named entities from the question have less than 80% coverage in read chunks.

So “a read action happened” does not mean “the evidence was sufficient.” Appendix H’s pooled breakdown shows that, among 1,725 discipline failures, **56.8%** are strict no-read, **9.3%** snippet-only, and **33.9%** low-evidence. Another **43.2%** of discipline failures already have at least one read, which is exactly why Read-Gate cannot guarantee adequate evidence inspection ([Appendix H, Table 15](https://arxiv.org/html/2608.02011v1#A8.T15)).

## Results: when does Read-Gate help?

### 1. The two failure axes are genuinely different

Among the 12,000 OpenAI trajectories, **3,807** are wrong. Multi-label reclassification gives the following discipline-only / post-only / both / neither shares:

| Entity extractor | discipline-only | post-only | both | neither |
| --- | ---: | ---: | ---: | ---: |
| regex | 46.5% | 21.4% | 11.2% | 20.9% |
| spaCy `en_core_web_sm` | 50.2% | 19.5% | 13.1% | 17.2% |

Agreement for the binary discipline indicator is Cohen’s $\kappa=0.628$. Figure 3 also shows discipline failures peaking for gpt-5-mini minimal while post-gold-read errors follow a different curve; the authors therefore treat them as separate control axes rather than one “the model cannot reason” score ([Figure 3, §5.1](https://arxiv.org/html/2608.02011v1#S5.F3)).

![Figure 3: error indicators across agent regimes](https://arxiv.org/html/2608.02011v1/x3.png)

*Figure 2 — Paper Figure 3 uses regime-level positions, not a model-scaling curve. It supports different trajectories for discipline and post-read errors; it does not show that a larger model necessarily fixes every failure. Source: [Figure 3, §5.1](https://arxiv.org/html/2608.02011v1#S5.F3); attribution and license note as above.*

### 2. Forced reading rescues questions the agent would otherwise skip

[Table 1](https://arxiv.org/html/2608.02011v1#S5.T1) selects questions that finalized with zero reads under the voluntary minimal-reasoning policy, then reruns the same questions under forced reading. LLM-Acc changes from HotpotQA **58.1 → 73.0 (+14.9)**, 2Wiki **42.1 → 62.1 (+19.9)**, and MuSiQue **22.5 → 37.4 (+14.9)**, with paired McNemar $p<10^{-4}$.

This is a **rescue effect on a self-selected zero-read subset**, not a population-level marginal effect. Writing “Read-Gate generally improves accuracy by 14.9–19.9 points” would overstate the result; the full minimal cells are the relevant control.

### 3. Full minimal cells gain 3.2–9.4 points, in line with residual discipline error

The full minimal cells in [Table 3](https://arxiv.org/html/2608.02011v1#S5.T3) are HotpotQA **79.6 → 82.8 (+3.2)**, 2Wiki **64.4 → 69.7 (+5.3)**, and MuSiQue **34.2 → 43.6 (+9.4)**. The corresponding no-gate discipline-failure rates are **13.3%, 22.1%, and 57.0%**; more residual discipline error means more headroom for the gate.

The medium boundary rows instead report HotpotQA **+0.0**, 2Wiki **−7.0**, and MuSiQue **−4.0**, using matched $n=100$ ablations. This is not a contradiction: when the agent already reads reliably, the gate has little headroom and can add rejected actions and loop cost. Appendix B.4’s Figure 5 makes the conditional relationship explicit ([Figure 5, Appendix B.4](https://arxiv.org/html/2608.02011v1#A2.F5)).

### 4. Adding the same chunk text is not enough to explain the gain

The three-arm mechanism ablation reports the following ([Table 2, §5.4](https://arxiv.org/html/2608.02011v1#S5.T2)):

| Dataset | No Read-Gate | Read-Gate | Context injection |
| --- | ---: | ---: | ---: |
| HotpotQA | 79.6 | **82.8 (+3.2)** | 79.5 (−0.1) |
| 2WikiMultiHopQA | 64.4 | **69.7 (+5.3)** | 57.0 (−7.4) |
| MuSiQue | 34.2 | **43.6 (+9.4)** | 38.1 (+3.9) |

Context-inject detects the same trigger but silently appends the rank-1 chunk text as a user-role observation without an actual read tool call. It is net-negative on 2Wiki. The interpretation best supported by the controls is therefore a self-issued read action or action-commitment effect, not simply more context. This is still an interpretation supported by the controls, not a conclusively isolated causal mechanism. The MuSiQue four-arm probe ($n=500$) gives only local support: user-role injection +4.4, tool-role injection +5.2, and Read-Gate +8.2, with Read-Gate adding **+3.0** over tool-role injection ([Appendix C.1, Table 10](https://arxiv.org/html/2608.02011v1#A3.T10)).

### 5. Read-Gate and reasoning effort change different parts of the trajectory

If we look only at marginal $P_{post}$, Read-Gate has OR 1.46. The paper explains that this is reclassification: some no-read wrong answers become with-read wrong answers and therefore become eligible for the post-gold-read label. After matching read exposure, the within-strata $P_{post}$ OR for $n=1,863$ trajectories is **1.00 [0.84, 1.19]**; the stricter HotpotQA + 2Wiki gold-read-both stratum is also **1.00 [0.83, 1.20]**. By comparison, gpt-5-mini medium versus minimal lowers $P_{disc}$ to **0.22 [0.20, 0.26]** and $P_{post}$ to **0.51 [0.43, 0.61]**. [Table 4, §5.5](https://arxiv.org/html/2608.02011v1#S5.T4) is the clearest evidence that a runtime constraint is not just more reasoning under another name.

![Figure 7: Read-Gate and reasoning effort move through the failure plane differently](https://arxiv.org/html/2608.02011v1/x6.png)

*Figure 3 — Paper Figure 7 places $P_{disc}$ and $P_{post}$ on one plane: Read-Gate mainly moves pre-evidence failure downward, while medium reasoning changes both axes. MuSiQue has no gold evidence, so $P_{post}=0$. Source: [Figure 7, Appendix J](https://arxiv.org/html/2608.02011v1#A10.F7); attribution and the [arXiv non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) as above.*

## Ablations and diagnostic slices: results that change the interpretation

- **Hidden thinking budget**: for Gemini 2.5 Flash without Read-Gate, increasing the thinking budget from 0 to 1,024 raises zero-read finalization by **+5.7, +24.8, and +42.6 pp** on HotpotQA, 2Wiki, and MuSiQue. The paired correctness Net Δ is **−44, −67, and −73** ([Table 5, §5.6](https://arxiv.org/html/2608.02011v1#S5.T5)). This is an external diagnostic, not evidence that all hidden reasoning is harmful, but it rejects the assumption that more internal tokens naturally produce more evidence inspection.
- **Prompt-only control**: Appendix K’s strict prompt reduces zero-read rates to 12.4% on HotpotQA, 20.7% on 2Wiki, and 48.1% on MuSiQue, but LLM-Acc remains 79.6, 61.6, and 37.4. It does not reproduce Read-Gate’s 82.8, 69.7, and 43.6 ([Table 17, Appendix K](https://arxiv.org/html/2608.02011v1#A11.T17)). Textual instructions can change surface behavior without being equivalent to execution-level enforcement.
- **Broader gate family**: Appendix F’s `+snippet`, `+lowev`, and `full` gates can produce local gains in $n=100$ probes, but low-evidence and full variants exceed two corrections per question and are dataset-sensitive. The authors therefore use the weakest interpretable read-before-final invariant as the main intervention rather than enabling every heuristic coverage gate ([Figure 6, Appendix F](https://arxiv.org/html/2608.02011v1#A6.F6)).
- **Cross-family transfer**: in Qwen2.5 $n=200$ per-cell checks, the direction is unstable: MuSiQue 3B is **+6.0 [1.0, 11.5], $p=0.043$**, while HotpotQA 3B is −2.0 and 2Wiki 7B is −2.0; most other intervals cross zero. This supports “the framework is testable,” not “the gate will work on every backbone” ([Appendix D.1, Table 12](https://arxiv.org/html/2608.02011v1#A4.T12)).
- **Judge robustness**: the fixed gpt-5-mini judge and Gemini 2.5 Pro agree at pooled $\kappa=0.924$ on a stratified $n=450$ sample; reweighted cell gaps range from −3.7 to +1.3 points. This reduces concern about a single judge family, but does not turn an LLM judge into ground truth ([Appendix L, Table 18](https://arxiv.org/html/2608.02011v1#A12.T18)).

## Evidence map: paper, author/vendor claims, and Bloss0m judgment

### Paper evidence

The paper supports three narrow conclusions. First, discipline and post-gold-read failures are trace-observable, substantially non-overlapping axes. Second, Read-Gate can recover some zero-read failures in minimal cells with high residual discipline error. Third, more hidden thinking does not guarantee external evidence inspection. All three claims are tied to English Wikipedia-style multi-hop QA, a two-tool action boundary, and the controller families tested here.

### Author and vendor claims

Section 4.4 says that the authors release the full agent loop, Read-Gate implementation, scripts to reproduce the paper’s tables and figures, and 33,950 raw trajectories including the 12,000-trajectory paired corpus. That is a **release claim in the paper**. On August 7, 2026, I opened the [official code URL named in the paper](https://github.com/Noverse0/before-reasoning-fails) directly and received **HTTP 404**, so I cannot rewrite the claim as “the code is downloadable and fully reproducible.”

The study also depends on the OpenAI API, Google Gemini API, and Qwen3-Embedding-0.6B. These are experimental dependencies, not artifacts controlled by the paper. Model-version drift, API policy, token prices, and judge behavior can change a rerun; that is a vendor-dependent constraint, not a measured Read-Gate effect.

### Bloss0m inference

My engineering judgment is that a high `search → final` rate with `read_count=0` is a good reason to run Read-Gate as a low-intrusion shadow test. The gate does not fix retrieval misses, irrelevant chunks, permission leaks, or answer verification. If the system already reads reliably, or if there is no discrete read boundary, enabling the gate globally may add latency, loops, and token cost without useful headroom.

## Limitations, threats to validity, and unsupported claims

The paper’s limitations should remain visible:

1. **Domain narrowness**: all three datasets are English Wikipedia-style multi-hop QA. Enterprise documents, private knowledge bases, non-English corpora, and multimodal RAG have different snippet semantics.
2. **Interface assumption**: the framework assumes observable discrete `search`/`read`/`final` actions. Fixed-context RAG, implicit interleaved retrieval-generation, and agents without a read action cannot be applied directly.
3. **Retrieval is out of scope**: Read-Gate assumes search returns useful candidates often enough. If gold evidence is absent from the top five, forced reading only makes the agent inspect the wrong material; production systems still need retrieval-quality monitoring, filtering, and answer-side verification ([Limitations](https://arxiv.org/html/2608.02011v1#Sx1.SS0.SSS0.Px1)).
4. **Gold-evidence caveat**: MuSiQue lacks complete per-chunk gold fields, so its post-gold-read analysis is not comparable to the other two datasets.
5. **Heuristic labels**: snippet-only and low-evidence use entity matching. The authors add a strict no-read lower bound, threshold sweeps, bootstrap, permutation, and a hand-labeled matcher check, but these are not a full human relabeling of every trajectory.
6. **Intervention downside**: when the agent already reads reliably, medium rows show zero or negative Read-Gate gains; Appendix B.5 also shows increases in reads, loops, corrections, and retrieved tokens. Read-Gate is a diagnostic intervention, not a universally optimal policy.
7. **Unsupported claims**: the evidence does not support “Read-Gate replaces stronger reasoning,” “Read-Gate solves retrieval quality,” “one read means sufficient evidence,” or “hidden thinking is harmful to production RAG.” Nor does it support treating the 14.9–19.9-point rescue effect as the gain on all traffic.

## Engineering translation: observe the invariant before enforcing it

To turn this paper into a production experiment, I would proceed in this order:

1. **Log before blocking**: record `search_count`, `read_count`, read chunk IDs, top-k rank, finalization timing, retrieved tokens, loop turns, answer, and verifier outcome. Establish no-read and low-evidence proxy rates first.
2. **Run a risk-gated shadow test**: enable the gate only on traffic with high zero-read finalization, high answer risk, and a retryable read API. Compare matched questions or traffic slices on accuracy, unsupported answers, latency, cost, and abstention; do not rely only on an LLM judge.
3. **Keep three responsibility chains separate**: retrieval quality measures recall and coverage; Read-Gate measures procedural compliance; answer verification measures final correctness. One aggregate accuracy should not hide the differences.
4. **Use a feature flag**: set correction and loop caps, fallbacks, and a kill switch. If the candidates are irrelevant, route to retry, clarify, or abstain rather than asking the agent to read indefinitely.
5. **Do not force-fit the method**: fixed-context RAG, controllers without an observable read action, and flows where reading can expose sensitive documents need separate policy and provenance designs.

This connects to the site’s [OSReward agent evaluation reading](/en/paper-reading/08-osreward-agent-evaluation/): OSReward argues for failure recall, verifier coverage, and false-success metrics; this paper adds whether the RAG trajectory actually inspected evidence before finalization. For an earlier tool-routing control point, see [RAG-MCP](/en/paper-reading/04-RAG-MCP/). For workflow-level agent evaluation and memory, see [ContextWeave](/en/paper-reading/09-contextweave-workflow-benchmark/).

## Artifact status as of August 7, 2026

| Artifact | Direct verification | Reproduction meaning |
| --- | --- | --- |
| [Paper v1 HTML](https://arxiv.org/html/2608.02011v1) / [PDF](https://arxiv.org/pdf/2608.02011v1) | Accessible; Figures 1–7, Tables 1–19, and Appendices A–M are locatable | The paper evidence can be audited; the current arXiv record also lists v2, while this article stays on v1 |
| [Paper-linked code URL](https://github.com/Noverse0/before-reasoning-fails) | HTTP 404; the paper claims a release, but the endpoint is unavailable | Do not claim that the 12,000 trajectories or table scripts can be rerun directly |
| [HotpotQA official page](https://hotpotqa.github.io/) / [repository](https://github.com/hotpotqa/hotpot) | Official page and repository accessible; the page lists downloads and CC BY-SA 4.0 | The dataset is obtainable, but that does not recreate the paper’s preprocessing or API traces |
| [2WikiMultiHopQA repository](https://github.com/Alab-NII/2wikimultihop) | Repository accessible; its README links the dataset and shows an Apache-2.0 repository license | The data endpoint still follows the README’s external download; do not assume the paper’s processed export is identical |
| [MuSiQue repository](https://github.com/StonyBrookNLP/musique) | Repository, download script, and CC BY 4.0 data statement accessible | The dataset is obtainable, but the paper’s processed MuSiQue export still has the per-chunk gold caveat |
| [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) | Hugging Face model page accessible and marked Apache-2.0 | The retriever artifact is obtainable; version, index, and RRF settings still need to match |

The smallest useful reproduction is therefore not a claim of full reproduction. Once the author endpoint is restored—or after rebuilding the protocol independently—use matched question IDs, the same hybrid top-five/RRF setup, a ten-loop cap, and temperature 0 to compare no-gate and Read-Gate. Log zero-read rate, LLM-Acc, Contain-Acc, reads per question, corrections per question, and retrieved tokens. If you use the public datasets with your own controller, call it a protocol replication, not a reproduction of the paper.

## Conclusion: ask whether evidence was read before asking how deeply the model reasoned

Before Reasoning Can Fail does not introduce a complicated new retriever. Its contribution is to make a procedural boundary measurable before overall accuracy hides it: did the agent search, did it read, what did it read, when did it finalize, and did the error happen before or after inspection?

The safest interpretation of Read-Gate is a **diagnostic runtime invariant**. When zero-read rates are high, it can trade a small execution constraint for a 3.2–9.4-point gain on full minimal cells; when the agent already reads, or retrieval quality is poor, it does not create correctness and may add cost. For production RAG, the durable takeaway is not “force one read on every question,” but to place evidence inspection, retrieval coverage, answer verification, and cost in the same trajectory-level observability model.

## Primary sources

- Roh, Daeyoung; Han, Donghee. [Before Reasoning Can Fail arXiv record](https://arxiv.org/abs/2608.02011) (version, authors, and abstract; as of August 7, 2026, it lists v2).
- Roh, Daeyoung; Han, Donghee. [Before Reasoning Can Fail v1 full HTML](https://arxiv.org/html/2608.02011v1); [v1 PDF](https://arxiv.org/pdf/2608.02011v1).
- [Paper-linked code endpoint](https://github.com/Noverse0/before-reasoning-fails) (as of August 7, 2026: HTTP 404).
- [HotpotQA official dataset page](https://hotpotqa.github.io/).
- [2WikiMultiHopQA official repository](https://github.com/Alab-NII/2wikimultihop).
- [MuSiQue official repository](https://github.com/StonyBrookNLP/musique).
- [Qwen3-Embedding-0.6B model card](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B).
