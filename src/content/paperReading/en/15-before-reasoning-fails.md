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

- **Problem:** In tool-augmented agentic RAG systems, models frequently retrieve candidate snippet previews via `search` and immediately emit a `final` answer without calling `read` to inspect full passages. This pre-evidence procedural failure (discipline failure) occurs before evidence-conditioned reasoning is ever tested, yet traditional evaluations lump it together with general model reasoning errors.
- **Core insight:** By logging full interaction trajectories—including tool calls, retrieved passages, read passages, and final answers—errors can be rigorously decoupled into procedural discipline failures and post-gold-read reasoning failures. Read-Gate introduces a minimal runtime invariant: after search and before finalization, at least one full read action must occur, without altering model weights, the retriever, or the reasoning decode budget.
- **Strongest evidence:** Across 12,000 paired trajectories spanning HotpotQA, 2WikiMultiHopQA, and MuSiQue, forcing reading on the zero-read subset that otherwise skips evidence raises LLM-evaluated accuracy by 14.9–19.9 percentage points. On full, unselected minimal-reasoning cells, the net accuracy gain is 3.2–9.4 points ([Table 1 and Table 3](https://arxiv.org/html/2608.02011v1#S5)).
- **Main boundary:** The approach requires an observable discrete action interface (`search`, `read`, and `final`). Executing a read action enforces procedural compliance, but does not guarantee the retriever retrieved gold evidence or that downstream inference is correct. For capable models that already inspect evidence voluntarily, external gating yields zero or negative gain while adding latency and loop overhead.

*Version note: This reading follows the [arXiv v1 preprint (arXiv:2608.02011v1)](https://arxiv.org/abs/2608.02011) submitted on August 3, 2026, by Daeyoung Roh and Donghee Han.*

## What to know first

Before delving into the specific mechanics, three foundational prerequisites and boundaries of previous approaches must be clarified:

1. **Discrete action interfaces in agentic RAG:** Standard RAG pipelines statically concatenate retrieved top-$k$ documents into the prompt in a single pass. In contrast, agentic RAG provides iterative tool-use primitives, typically `search` (returning chunk IDs and concise snippets), `read` (expanding a specified chunk ID into its complete text), and `final` (terminating search and returning the final answer). This decoupled design aims to curb prompt bloat and manage compute budgets.
2. **Why previous approaches and traditional evaluation are insufficient:** Conventional evaluation benchmarks measure only final answer metrics (such as Exact Match, F1, or LLM-as-a-judge scores), or attempt to resolve failures by increasing hidden thinking budgets (reasoning tokens) and applying preference tuning. However, these methods fail to detect whether an agent actually inspected external retrieved passages or merely guessed from pre-trained parametric priors and brief snippets. When an agent spots a plausible snippet keyword and answers immediately, it may produce fluent, structured reasoning that is completely ungrounded in external evidence.
3. **Two fundamentally distinct failure axes:**
   - **Pre-evidence discipline failure:** The model violates the evidence-inspection protocol, finalizing the response before opening and examining necessary supporting text.
   - **Post-gold-read reasoning failure:** The model successfully retrieves and reads the gold-supporting evidence chunk, but still derives an incorrect answer during subsequent logical integration and multi-hop synthesis.

## Core intuition

Under voluntary termination policies, the agent decides when to stop searching. On multi-hop questions, models frequently display overconfidence, mistaking superficial snippet matches for complete factual verification. The core intuition of Read-Gate is to convert evidence inspection from an internal voluntary choice into an external environment-enforced invariant: if `read_count == 0` after search, the environment rejects `final` and returns a corrective observation directing the model to inspect candidate chunks first.

Error analysis moves from an opaque single failure score to an observable, priority-governed trajectory taxonomy:

![Figure 2: trajectory-level error decomposition](https://arxiv.org/html/2608.02011v1/x2.png)

*Figure 1 — Paper Figure 2 assigns wrong trajectories by priority to discipline, post-gold-read, retrieval, and ambiguity; Read-Gate directly blocks only the discipline branch. Source: [Figure 2, §3](https://arxiv.org/html/2608.02011v1#S3.F2). The figure is attributed to Daeyoung Roh and Donghee Han under the paper’s [arXiv non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html); that page is not a CC BY statement.*

Within discipline failures, the authors define three actionable subtypes:
- **No-read final:** An incorrect answer emitted with `read_count = 0`. This is the cleanest, most objective signal, requiring no entity-matching heuristics.
- **Snippet-only final:** The answer entity appears only in search snippet previews and never in any read passage.
- **Low-evidence final:** Question named entities achieve less than 80% coverage across read passages.

> **Huahua's engineering note**
>
> If a trace stores only the final answer—not the search, read, chunk identity, and finalization boundary—you cannot tell whether the failure came from retrieval, evidence inspection, or post-read reasoning.

## Walk one example through the method

Consider a multi-hop question requiring two distinct factual steps to trace how voluntary execution diverges from Read-Gate enforcement:

1. **Input question:** "In what years did the birth city of the director of *Inception* host the Summer Olympic Games?"
2. **Search and intermediate representation:** The agent issues `search("Inception director birth city Summer Olympics")`. The hybrid retriever returns top-5 snippets, including a snippet on Christopher Nolan's early life in London and a snippet on London's Olympic hosting history.
3. **Likely failure point under voluntary policy:** Under an unconstrained policy, the model notices "Christopher Nolan" and "London" in the snippets, assumes it knows the rest from memory, and emits `final("1948")`, skipping passage verification entirely. If the question requires all three modern hosting years, this forms a classic no-read discipline failure.
4. **Decision transformation via Read-Gate:** The environment intercepts the `final` call. Evaluating its internal state counters, it detects `search_count > 0` and `read_count == 0`. It rejects the action and injects a corrective observation: `[Action Rejected: You have searched candidate snippets but executed 0 read actions. You must call read on at least one promising chunk before finalizing.]`.
5. **Enforced execution and output:** The agent issues `read(chunk_id=1042)`, retrieves the full passage detailing London's Olympic history across 1908, 1948, and 2012, verifies the comprehensive timeline, and emits `final("1908, 1948, 2012")`. If it still fails, the error is cleanly reclassified into post-gold-read reasoning or retrieval coverage.
6. **Contrast with context injection:** If the environment silently appends the top-ranked passage directly to the prompt (ctx-inject), the model does not issue an intentional tool call. Controlled experiments show this passive injection lacks action commitment and can even degrade performance.

## Technical mechanism

The paper formalizes the agentic RAG interaction as a discrete trajectory $\tau = (a_1, o_1, a_2, o_2, \dots, a_T, o_T, y)$. The environment provides two tools:
- `search(q)`: Combines BM25 lexical search with Qwen3-Embedding-0.6B dense retrieval merged via Reciprocal Rank Fusion ($k=60$), returning top-$k=5$ candidate chunk IDs and snippets.
- `read(chunk_id)`: Fetches the complete passage by chunk ID, with deduplication across rounds so identical passages are not counted as new evidence.

Execution is constrained by a 10-turn cap, 128k token context window, and temperature 0.0.

For all erroneous trajectories $\mathcal{E}_{wrong}$, the paper defines a strict mutually exclusive priority accounting order:

$$
\mathcal{E}_{wrong} = \mathcal{E}_{disc} \;\dot{\cup}\; \mathcal{E}_{post} \;\dot{\cup}\; \mathcal{E}_{retr} \;\dot{\cup}\; \mathcal{E}_{amb}.
$$

Symbols are defined as follows:
- $\mathcal{E}_{disc}$ (Discipline failure): The agent finalized without satisfying the evidence inspection protocol.
- $\mathcal{E}_{post}$ (Post-gold-read failure): The trajectory read at least one gold-supporting chunk, but the final answer was still wrong.
- $\mathcal{E}_{retr}$ (Retrieval failure): The gold-supporting chunk was absent from all top-$k$ search candidate lists.
- $\mathcal{E}_{amb}$ (Residual ambiguity): Unresolved errors not cleanly attributable to the preceding categories.

Read-Gate enforces a compact predicate: whenever $a_t = \text{final}$ with $\text{search\_count} > 0$ and $\text{read\_count} = 0$, the action is intercepted. It leaves model parameters, retriever weights, dense embeddings, and user queries untouched, acting purely as an environment state-machine check.

## How to read the evidence

The experimental setup spans three benchmark multi-hop datasets: **HotpotQA**, **2WikiMultiHopQA**, and **MuSiQue**. Each dataset × condition cell uses $n=1{,}000$ examples matched by question ID. The four primary OpenAI controllers are:
1. `gpt-4o-mini`
2. `gpt-5-mini` minimal reasoning
3. `gpt-5-mini` medium reasoning
4. `gpt-5-mini` minimal reasoning + Read-Gate

This yields **12,000 OpenAI-family paired trajectories**. The primary metric is **LLM-Acc**, evaluated by a fixed `gpt-5-mini` judge for semantic equivalence, supported by **Contain-Acc** (string containment).

### 1. The two failure indicators are orthogonal control axes

Across 3,807 erroneous cases in the 12,000 trajectories, multi-label classification reveals how infrequently discipline and post-gold-read failures co-occur:

| Entity extractor | Discipline-only | Post-only | Both co-occur | Neither |
| --- | ---: | ---: | ---: | ---: |
| regex | 46.5% | 21.4% | 11.2% | 20.9% |
| spaCy `en_core_web_sm` | 50.2% | 19.5% | 13.1% | 17.2% |

Agreement on the discipline indicator between extractors is Cohen’s $\kappa = 0.628$. With a co-occurrence rate of only 11.2%–13.1%, procedural failures and post-evidence reasoning errors represent largely independent failure mechanisms ([§5.1](https://arxiv.org/html/2608.02011v1#S5.SS1)).

![Figure 3: error indicators across agent regimes](https://arxiv.org/html/2608.02011v1/x3.png)

*Figure 2 — Paper Figure 3 uses regime-level positions, not a model-scaling curve. It supports different trajectories for discipline and post-read errors; it does not show that a larger model necessarily fixes every failure. Source: [Figure 3, §5.1](https://arxiv.org/html/2608.02011v1#S5.F3); attribution and license note as above.*

### 2. Rescue effects on zero-read queries do not represent population gains

On questions where the unconstrained minimal-reasoning agent voluntarily skipped reading ([Table 1](https://arxiv.org/html/2608.02011v1#S5.T1)), forced reading produces substantial rescue gains:
- HotpotQA: LLM-Acc increases from 58.1 to 73.0 (+14.9 points, McNemar $p < 10^{-4}$)
- 2WikiMultiHopQA: 42.1 to 62.1 (+19.9 points, McNemar $p < 10^{-4}$)
- MuSiQue: 22.5 to 37.4 (+14.9 points, McNemar $p < 10^{-4}$)

This measures the localized rescue capacity on self-selected zero-read queries; it must not be cited as the general population-level effect across all traffic.

### 3. Population-level gains range from 3.2 to 9.4 points

On the full, unselected $n=1{,}000$ minimal-reasoning cells ([Table 3](https://arxiv.org/html/2608.02011v1#S5.T3)):
- HotpotQA: 79.6 → 82.8 (+3.2 points; baseline discipline error 13.3%)
- 2WikiMultiHopQA: 64.4 → 69.7 (+5.3 points; baseline discipline error 22.1%)
- MuSiQue: 34.2 → 43.6 (+9.4 points; baseline discipline error 57.0%)

Gains directly track the baseline prevalence of discipline failures. In contrast, matched $n=100$ ablations on medium reasoning show changes of +0.0, −7.0, and −4.0 points. When an agent already reads reliably, adding an external gate provides no headroom and introduces unnecessary friction.

### 4. Mechanism ablation: passive context injection does not replicate the gate

To verify whether improvements stem merely from extra prompt tokens, the authors evaluate a context-injection baseline ([Table 2](https://arxiv.org/html/2608.02011v1#S5.T2)):

| Dataset | No Read-Gate | Read-Gate | Context injection |
| --- | ---: | ---: | ---: |
| HotpotQA | 79.6 | **82.8 (+3.2)** | 79.5 (−0.1) |
| 2WikiMultiHopQA | 64.4 | **69.7 (+5.3)** | 57.0 (−7.4) |
| MuSiQue | 34.2 | **43.6 (+9.4)** | 38.1 (+3.9) |

On 2WikiMultiHopQA, passive context injection degrades accuracy by 7.4 points. Across all datasets, Read-Gate outperforms injection. This supports the interpretation that requiring an explicit, agent-issued read tool call creates action commitment that passive prompt appending fails to reproduce.

### 5. Movement across the failure plane

Marginally, Read-Gate appears to increase post-gold-read errors (OR = 1.46). However, the paper demonstrates this is a reclassification artifact: queries previously counted as zero-read failures now execute a read, becoming eligible for the post-read failure label. In a stratified analysis controlling for read exposure ($n=1,863$), the odds ratio is exactly 1.00 [0.84, 1.19] ([Table 4](https://arxiv.org/html/2608.02011v1#S5.T4)).

![Figure 7: Read-Gate and reasoning effort move through the failure plane differently](https://arxiv.org/html/2608.02011v1/x6.png)

*Figure 3 — Paper Figure 7 places $P_{disc}$ and $P_{post}$ on one plane: Read-Gate mainly moves pre-evidence failure downward, while medium reasoning changes both axes. MuSiQue has no gold evidence, so $P_{post}=0$. Source: [Figure 7, Appendix J](https://arxiv.org/html/2608.02011v1#A10.F7); attribution and the [arXiv non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) as above.*

### 6. Diagnostic slices and ablations

- **Thinking budgets do not guarantee evidence inspection (Table 5, §5.6):** In Gemini 2.5 Flash without Read-Gate, scaling thinking tokens from 0 to 1,024 increases zero-read finalization by +5.7, +24.8, and +42.6 percentage points across HotpotQA, 2Wiki, and MuSiQue, with paired Net $\Delta$ correctness dropping by −44, −67, and −73. More internal reasoning tokens can exacerbate reliance on pre-trained priors.
- **Prompt instructions do not replace execution invariants (Appendix K, Table 17):** Strict system prompts reduce zero-read rates but achieve accuracies of only 79.6, 61.6, and 37.4, failing to match Read-Gate’s 82.8, 69.7, and 43.6.
- **Broader gate families incur high costs (Appendix F, Figure 6):** Expanding gates to enforce low-evidence coverage (`+lowev` and `full`) averages over 2 corrections per question, creating heavy loop overhead with inconsistent accuracy gains.
- **Cross-model transfer sensitivity (Appendix D.1, Table 12):** On Qwen2.5 3B/7B, MuSiQue 3B gains +6.0 ($p=0.043$), but HotpotQA and 2Wiki show −2.0 point shifts, with most confidence intervals crossing zero.
- **Judge robustness (Appendix L, Table 18):** Gemini 2.5 Pro and gpt-5-mini agree at $\kappa = 0.924$ across a stratified $n=450$ sample, with reweighted differences within −3.7 to +1.3 points.

## Evidence map

### Direct paper evidence

1. Across 12,000 paired trajectories, pre-evidence discipline failures and post-gold-read reasoning failures overlap only 11.2%–13.1%, proving they can be decoupled into distinct operational telemetry targets.
2. In minimal-reasoning environments with frequent zero-read tendencies, Read-Gate reliably delivers 3.2–9.4 percentage points of net accuracy gain across multi-hop benchmarks (Table 3).
3. Increasing internal hidden thinking budgets does not prompt models to inspect external evidence, and in Gemini 2.5 Flash significantly increases zero-read rates (Table 5).

### Author causal claim

The authors argue that Read-Gate’s advantage over passive context injection stems from self-issued action commitment rather than token availability. Furthermore, they contend that externalizing procedural constraints into the execution environment provides more deterministic reliability than relying on prompt guidelines or internal model heuristics.

### Unsupported claims

1. **Unverified domain generalization:** The study tests exclusively on English Wikipedia-style multi-hop QA, leaving private corporate repositories, complex legal contracts, codebases, and multimodal domains unverified.
2. **Cannot compensate for poor retrieval:** If the retriever fails to surface gold passages in top-$k$, forcing passage reads only forces the agent to read irrelevant noise.
3. **Inapplicable to seamless architectures:** Standard fixed-context RAG, implicit interleaved retrieval models, and architectures lacking discrete read tools cannot use this mechanism.
4. **MuSiQue annotation limits:** MuSiQue lacks complete per-chunk gold evidence labels, limiting post-read failure conclusions on that dataset.
5. **Negative impact on capable models:** For controllers that already read reliably (e.g. medium reasoning), external gating introduces latency and retry overhead with zero accuracy gain.
6. **No grounding or verification guarantee:** Reading full passages does not ensure correct comprehension, nor does it replace post-generation fact-checking.

### Bloss0m engineering synthesis

In production agentic RAG architectures, overall reliability must be decomposed into three distinct observability planes:
1. **Retrieval coverage:** Monitoring top-$k$ recall and candidate passage relevance.
2. **Procedural compliance:** Tracking state transitions across `search → read → final` and logging zero-read rates, which represents the operational boundary addressed by Read-Gate.
3. **Answer verification:** Evaluating post-read logical validity and factual consistency using dedicated verifier models.
Conflating these planes leads engineering teams to misdiagnose procedural skipping as reasoning deficits, wasting resources on model fine-tuning or costly model upgrades.

## Artifacts and reproducibility

As of **August 9, 2026**, the [official repository](https://github.com/Noverse0/before-reasoning-fails) is publicly accessible, providing full agent loop implementations, Read-Gate controller modules, paper table and figure reproduction scripts, and 33,950 raw trajectory records (across 49 JSON files), including the 12,000 paired trajectories.

Status of external dependencies:
- [HotpotQA official page](https://hotpotqa.github.io/): Publicly downloadable under CC BY-SA 4.0.
- [2WikiMultiHopQA repository](https://github.com/Alab-NII/2wikimultihop): Accessible with external dataset download links under Apache-2.0.
- [MuSiQue repository](https://github.com/StonyBrookNLP/musique): Data and download scripts available under CC BY 4.0.
- [Qwen3-Embedding-0.6B model card](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B): Model weights available under Apache-2.0.

Reproduction boundaries: Reported metrics represent author-published results. Independent reruns require configuring commercial API credentials (OpenAI and Google Gemini), selecting matching model snapshots, building retrieval indices, and incurring inference compute costs. Replicating the protocol with custom controllers on public datasets constitutes protocol replication rather than exact paper reproduction.

## Bloss0m engineering judgment and when not to use it

The following principles define Bloss0m's engineering recommendations for production deployment:

### Recommended use cases

1. **Telemetry reveals high zero-read rates:** Trace logs in production agentic RAG show agents frequently finalize immediately after search while exhibiting factual hallucinations.
2. **High-stakes auditable workflows:** Legal discovery, compliance checking, and medical QA where full source citation and verifiable reading steps are mandatory.

### Phased rollout strategy

1. **Log telemetry before enforcing:** Instrument `search_count`, `read_count`, visited chunk IDs, and turn latency to establish a baseline of zero-read frequency without blocking requests.
2. **Conduct risk-gated shadow tests:** Apply Read-Gate in shadow mode to high-risk traffic, comparing latency, API cost, and abstention rates alongside accuracy metrics.
3. **Implement circuit breakers:** Treat Read-Gate as a feature-flagged middleware with an enforced correction cap (maximum 2 retries); if candidate snippets are irrelevant, guide the model to abstain or request user clarification rather than forcing repeated reads.

### When not to use it

1. **Fixed-context or single-pass RAG:** Pipelines that concatenate documents statically into the prompt cannot accommodate discrete action gating.
2. **Capable models with high voluntary reading rates:** In models with medium or high reasoning effort that already read consistently, gating introduces latency and loop costs with zero gain.
3. **Low-precision retrieval systems:** When search surfaces mostly irrelevant noise, forced reading exposes the model to distractor content and induces confusion.
4. **High-latency or permission-gated retrieval:** Where fetching full chunks incurs steep billing or strict access reviews, forced reads create operational bottlenecks.

Related reading:
- On failure recall, verifier coverage, and agent evaluation frameworks, see the [OSReward evaluation guide](/en/paper-reading/08-osreward-agent-evaluation/).
- On tool-routing pre-controls, see the [RAG-MCP architectural review](/en/paper-reading/04-RAG-MCP/).
- On long-context workflow and memory evaluation, see the [ContextWeave benchmark analysis](/en/paper-reading/09-contextweave-workflow-benchmark/).
- On self-reflective tokens for retrieval decisions without external gating, see the [Self-RAG deep dive](/en/paper-reading/33-self-rag-retrieve-generate-critique/).

## Three things to remember

1. **Technical idea:** Searching does not equal inspecting evidence. In tool-augmented agentic RAG, enforcing "read before final" as an environment runtime invariant prevents premature finalization before reasoning is ever tested.
2. **Evidence:** Across 12,000 multi-hop trajectories, discipline failures and post-gold-read reasoning failures overlap only 11.2%–13.1%. Read-Gate yields a 3.2–9.4 point gain on unselected minimal-reasoning cells, but shows zero headroom on models that already read reliably.
3. **Boundary:** Read-Gate is a lightweight procedural invariant, not a cure for poor retrieval or flawed deductive logic. Production systems must balance retrieval coverage, procedural compliance, answer verification, and latency costs.

## Primary sources

- Roh, Daeyoung; Han, Donghee. [Before Reasoning Can Fail arXiv record](https://arxiv.org/abs/2608.02011) (arXiv cs.AI preprint and abstract).
- Roh, Daeyoung; Han, Donghee. [Before Reasoning Can Fail v1 full HTML](https://arxiv.org/html/2608.02011v1); [v1 PDF](https://arxiv.org/pdf/2608.02011v1).
- [Official code repository](https://github.com/Noverse0/before-reasoning-fails) (agent loop, reproduction scripts, and trajectory corpus).
- [HotpotQA official dataset page](https://hotpotqa.github.io/).
- [2WikiMultiHopQA official repository](https://github.com/Alab-NII/2wikimultihop).
- [MuSiQue official repository](https://github.com/StonyBrookNLP/musique).
- [Qwen3-Embedding-0.6B model card](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B).
