---
title: "SIFT: Turning Expensive Self-Improvement Evaluation into Cheap Ranking and Deferred Verification"
description: "A deep reading of Self Improvement via Fast Tree-search (arXiv:2609.19526): pairwise LLM judging, regularized Bradley–Terry ranking, and asynchronous tree search decide which agent patches deserve expensive benchmark verification."
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "SIFT does not replace benchmarks with a judge; it inserts a cheap relative ranking signal between candidate generation and full evaluation."
  - "Each new agent is compared with a small set of strong incumbents. The win-loss matrix is aggregated with a regularized Bradley–Terry model, then combined with subset accuracy and visit count to choose parents and evaluation priority."
  - "On Polyglot-225, SIFT reports 31.1% with Qwen3-Coder-30B and Qwen3-480B as judge, and 35.1% with o3-mini and gpt-5.4 as judge; one Qwen run used 224 CPU-hours, 6.7 hours, and $34.3."
  - "TerminalBench and SWE-60 reruns suggest judge-guided selection is more reliable than selecting by search accuracy alone, but the strongest judge is stronger than the coding backbone and no public implementation was verified."
audience:
  - "Researchers and platform engineers building recursive self-improvement, coding agents, or agent-harness search"
  - "Evaluation teams balancing benchmark cost, reproducibility, and automated exploration"
tags: ["Paper Reading", "Agent Systems", "Agent Evaluation", "Coding Agents", "LLM-as-a-Judge", "Self-Improvement"]
image: "/paperReading/60-sift-fast-tree-search/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
  - agent-safety-governance
paper:
  title: "Self Improvement via Fast Tree-search"
  authors:
    - "Xinghong Fu"
    - "Aravinth Kulanthaivelu"
    - "Yutaro Yamada"
  year: 2026
  venue: "arXiv 2609.19526 v1 (2026-09-17)"
  links:
    pdf: "https://arxiv.org/pdf/2609.19526v1"
    arxiv: "https://arxiv.org/abs/2609.19526"
    doi: "https://doi.org/10.48550/arXiv.2609.19526"
series:
  id: "self-improving-agents"
  title: "Self-Improving Agents"
  part: 1
  totalParts: 1
---

This article reads [Self Improvement via Fast Tree-search](https://arxiv.org/abs/2609.19526), arXiv v1 submitted on 2026-09-17. The authors are affiliated with MIT and Sakana AI. I checked the arXiv HTML/PDF Sections 1–5, Tables 1–7, Figures 1–9, Appendices A–B, and the safety discussion. The paper is marked [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the figures below are local mirrors of the original paper assets, with source and location links kept in every caption.

The paper is not mainly asking whether an agent can modify its own code. It asks the more operational question: **when self-improvement has produced dozens or hundreds of candidate patches, which ones deserve an expensive benchmark run first?** SIFT answers by putting a cheap relative preference signal between candidate generation and full evaluation, allowing search to move ahead while verification is deferred to the most promising nodes.

## The paper in 90 seconds

- **Problem:** recursive self-improvement repeatedly reruns downstream tasks for each candidate agent, so evaluation cost and wall-clock time quickly dominate patch generation.
- **Method:** a new patch is pairwise-judged against a small set of strong incumbents; all wins and losses are aggregated with a regularized Bradley–Terry model into a judge rank.
- **Search policy:** parent sampling combines judge rank, subset-accuracy rank, and a visit-count exploration term. The evaluation queue is also prioritized, so expansion and full evaluation can proceed asynchronously.
- **Results:** on Polyglot-225, SIFT reaches 31.1% with Qwen3-Coder-30B/Qwen3-480B and 35.1% with o3-mini/gpt-5.4. On TerminalBench 2.1, the judge-selected agent averages 36.7% over three full evaluations, compared with 29.2% for the starting agent.
- **Boundary:** the judge is a noisy ranking oracle, not a substitute for the benchmark. Without a public implementation, the reported CPU, API cost, and model-version details remain difficult for outside researchers to reproduce independently.

My bounded verdict is: **SIFT’s real contribution is reallocating resources between search and proof, not claiming that an LLM judge is more reliable than execution. It reframes self-improvement as speculative ranking followed by selective verification. As long as adoption still depends on full benchmarks, every judge rank remains a waypoint rather than a verdict.**

> **Huahua’s engineering reminder**
>
> If an agent can rewrite its own harness, production systems should store candidate patches, judge rationale, benchmark traces, writable-file allow-lists, and the adopted commit as separate artifacts. SIFT can reduce exploration cost; it cannot by itself establish evaluation integrity.

## Why prior approaches are not enough: every patch waits for a full benchmark

In self-improvement loops such as DGM, HGM, and SICA, a self-improver reads the current agent code and failure records, creates a child agent, and sends that child through a downstream benchmark. The result feeds the next round. The path is intuitive, but it has a scheduling bottleneck: **the next parent often cannot be chosen until earlier candidates finish their full evaluations.**

The cheap alternative is a benchmark subset, but subset scores are noisy, and one task execution can still take much longer than a pairwise judge call. SIFT keeps the signals separate and asks different questions:

| Signal | What it answers | What it must not be read as |
| --- | --- | --- |
| Subset accuracy | How did the candidate actually perform on a fixed small set? | A reliable full-benchmark ranking |
| Pairwise judge / BT rank | Which candidate looks more promising from its implementation? | Proof of downstream behavior |
| Full benchmark | How did the candidate perform on the complete task set? | A free guarantee on other models or tasks |

This separation is the key to the paper: SIFT’s judge is a cheap search signal, not an automatic evaluator.

## Core intuition: split self-improvement into ranking and verification

![Original SIFT Figure 1: pairwise judging, Bradley–Terry ranking, and the evaluation queue inside the self-improvement loop](/paperReading/60-sift-fast-tree-search/paper/pipeline_full_bigfont.webp)

*Figure 1 (original paper Figure 1, Section 3): the left side shows the pairwise win-loss matrix and BT strength, the center shows the agent tree, and the right shows a priority queue ranked by judge and accuracy signals. Original asset: [arXiv Figure 1](https://arxiv.org/html/2609.19526v1/figures/pipeline_full_bigfont.png) · [Section 3 anchor](https://arxiv.org/html/2609.19526v1#S3.F1). The arXiv page marks the paper CC BY 4.0; the local mirror preserves attribution and must be reused under that license.*

In plain language, SIFT follows this loop:

```text
current agent harness
        ↓ self-improve
candidate patch
        ├─ pairwise judge → win/loss matrix → BT rank
        ├─ easy subset → early rejection or temporary accuracy
        └─ priority queue → full benchmark when resources are available
```

The cheap ranking signal and the actual downstream verification are deliberately separate. A candidate can generate a child while its full evaluation is still pending, but a benchmark remains necessary to decide whether the patch really improved the agent.

## A worked example: follow one candidate node end to end

Assume the archive contains a root, node 3, node 4, and other harnesses. A self-improver creates node 10. Instead of immediately running all 225 Polyglot tasks, SIFT processes it as follows:

1. **Generate a patch:** the self-improvement model changes allowed runtime files and produces a child agent. Sandboxing and a writable-file allow-list prevent it from changing benchmark or evaluation-harness code.
2. **Pass an easy gate:** the candidate runs on a fixed small subset. A clearly broken patch is rejected; a candidate waiting for full evaluation temporarily inherits its parent’s accuracy for sampling.
3. **Choose comparison targets:** the new candidate is compared with strong archive nodes, typically the top 10, rather than every node.
4. **Record preferences:** the judge sees two candidate runtime implementations and returns which one is more likely to improve the agent. Each outcome becomes a `W_ij` win or loss.
5. **Update BT ranks:** sparse and potentially inconsistent pairwise outcomes are fit into latent strengths, and the search uses their ranks rather than treating the values as absolute quality scores.
6. **Prioritize parents and evaluation:** high judge rank, high subset accuracy, and a low visit count make a node more likely to be selected as a parent; promising nodes enter the full-evaluation priority queue.
7. **Verify:** the full benchmark, reruns, and cross-model transfer determine whether the patch deserves adoption.

This walkthrough exposes an easy mistake: **a node can be expanded because its judge rank is high without being proven to be the best node.**

## The method: what Bradley–Terry is doing here

For every agent node `i`, the paper assumes an unobserved strength `θ_i`. A judge comparison between `i` and `j` is modeled as:

```text
P(i preferred to j) = θ_i / (θ_i + θ_j)
```

The accumulated win-loss matrix `W_ij` is not used as the final rank directly. A regularized BT fit combines sparse comparisons into strengths for every node. The regularizer matters for new nodes: a node that has only been compared a few times should not look strong merely because it has a small raw win count.

SIFT then combines BT rank `r_b(i)`, subset-accuracy rank `r_a(i)`, and the number of times a node has been selected as a parent `v_i`:

```text
P(i) ∝ exp(-α r_b(i) - β r_a(i) - η log(1 + v_i))
```

`α` and `β` control the influence of judge and measured subset signals; `η` discourages the search from repeatedly exploiting one lineage. The default is 1 for all three. With `η=0`, the o3-mini Polyglot result falls from 35.1% to 30.1%, suggesting that exploration is a real part of the search rather than cosmetic regularization.

## The asynchronous pipeline: expansion does not wait for evaluation

![Original SIFT Figure 2: a disaggregated pipeline runs expansion and benchmark evaluation in parallel](/paperReading/60-sift-fast-tree-search/paper/disagg.webp)

*Figure 2 (original paper Figure 2, Section 3): SIFT separates expansion, judging, and downstream evaluation into parallelizable work. A strong judge signal can expand a node before its full evaluation completes. Original asset: [arXiv Figure 2](https://arxiv.org/html/2609.19526v1/figures/disagg.png) · [Section 3 anchor](https://arxiv.org/html/2609.19526v1#S3.F2). The chart is an original CC BY 4.0 paper asset mirrored locally.*

In a blocking pipeline, the loop is roughly patch → benchmark → wait → next patch. SIFT’s orchestrator interleaves three workers:

- an expansion worker selects parents and produces children;
- a judge worker compares each child with frontier nodes and updates the BT rank;
- an evaluator worker consumes the priority queue for subset or full benchmark runs.

“Fully disaggregated” therefore does not mean “benchmark-free.” The gain comes from overlapping work and letting the judge guide exploration before downstream evaluation completes.

## Cost model: the cheap signal is not free

With the default maximum of `K=10` pairwise comparisons, the paper estimates up to ten judge calls for one candidate. Table 1 reports these average per-step costs:

| Module | Model | API cost | CPU time |
| --- | --- | ---: | ---: |
| Self-improvement expansion | gpt-5-mini | $0.12 | 0.186 h |
| One pairwise judge call | gpt-5.4 | $0.044 | 0.0042 h |
| Polyglot-50 full evaluation | o3-mini | $6.00 | 2.6 h |

The intuition is clear: rank a candidate with a small number of judge calls, then reserve full evaluation for promising nodes. Total cost still depends on expansion count, judge model, full evaluations, and retries; one \$0.044 comparison cannot be used to estimate an entire run.

![Original SIFT Figure 3: Polyglot tree-search progress](/paperReading/60-sift-fast-tree-search/paper/qwen_qwen_tree_search_progress.png)

*Figure 3 (original paper Figure 3, Section 4): the Qwen3-Coder-30B configuration improves Polyglot-50 search performance and archive average over 30 evolution steps. The best descendant’s full Polyglot-225 result is 31.1%; not every intermediate point is a completed full evaluation. Original asset: [arXiv Figure 3](https://arxiv.org/html/2609.19526v1/figures/qwen_qwen_tree_search_progress.png) · [Section 4 anchor](https://arxiv.org/html/2609.19526v1#S4.F3). The chart is CC BY 4.0 and its attribution is preserved.*

## Experiment 1: read Polyglot results together with cost

Polyglot contains 225 tasks across C++, Go, Rust, Java, JavaScript, and Python. Search first uses a four-task gate and then a fixed Polyglot-50 subset; the 225-task benchmark is held out for final validation. A fixed intermediate subset makes node comparisons more meaningful than random task sampling.

| Method | Coding model | Judge | Polyglot-225 |
| --- | --- | --- | ---: |
| Base agent | Qwen3-Coder-30B | — | 20.0% |
| SICA | Qwen3-Coder-30B | — | 25.1% |
| DGM | Qwen3-Coder-30B | — | 27.1% |
| HGM | Qwen3-Coder-30B | — | 30.5% |
| SIFT | Qwen3-Coder-30B | Qwen3-Coder-480B | 31.1% |
| SIFT | Qwen3-Coder-30B | gpt-5.4 | 32.0% |
| Base agent | o3-mini | — | 14.2% |
| DGM | o3-mini | — | 30.7% |
| SIFT | o3-mini | gpt-5.4 | 35.1% |
| SIFT | o3-mini | gpt-5-mini | 31.6% |

One Qwen SIFT run reaches 31.1% after 30 steps with \$34.3 in API cost, 224 CPU-hours, and 6.7 hours of wall-clock time. The o3-mini/gpt-5.4 configuration reaches 35.1%; the same table reports \$86.8, 59 CPU-hours, and 2.1 hours. These numbers support improved efficiency under the paper’s settings, not a universal cost/performance guarantee.

### Transferability

![Original SIFT Figure 4: an o3-mini-discovered agent harness transferred across coding models](/paperReading/60-sift-fast-tree-search/paper/o3_polyglot_transfer.png)

*Figure 4 (original paper Figure 4a, Section 4.1): the harness found with o3-mini is re-evaluated with other coding models, and the authors report improvement over the corresponding base agents. Original asset: [arXiv Figure 4a](https://arxiv.org/html/2609.19526v1/figures/o3_polyglot_transfer.png) · [Section 4 anchor](https://arxiv.org/html/2609.19526v1#S4.F4). This is an author-run transfer experiment, not an independent replication; the original page marks it CC BY 4.0.*

The paper also transfers the Qwen3-Coder-30B configuration to other coding models. This matters because a patch that only helps the model that generated it could be overfitting to a judge or a backbone. Transfer is initial evidence of broader harness value, but the model count, task distribution, and full environmental details are not enough to establish generality.

## Experiment 2: TerminalBench shows that judge rank is not accuracy rank

TerminalBench 2.1 contains long-horizon terminal tasks. Search uses a fixed random 50-task subset; selected agents receive three repeated full evaluations on 89 tasks:

| Selection | Search evaluation | Repeated full mean |
| --- | ---: | ---: |
| Starting agent | 14/50 | 26.0/89 (29.2%) |
| SIFT judge rank 1 | 18/50 | 32.7/89 (36.7%) |
| SIFT accuracy rank 1 | 19/50 | 25.0/89 (28.1%) |
| No-judge accuracy rank 1 | 19/50 | 26.0/89 (29.2%) |

The striking result is that the highest-scoring search candidate is not the best full-benchmark candidate. The judge-selected node scores only 18/50 during search but averages 36.7% in repeated evaluation. This supports judge rank as a way to find candidates hidden by subset noise, not as evidence that the judge can replace execution.

![Original SIFT Figure 5: the relationship between judge rank and realized TerminalBench performance](/paperReading/60-sift-fast-tree-search/paper/judge_value_breakthrough_state.png)

*Figure 5 (original paper Figure 5, Section 4.2): nodes are grouped by BT judge rank and compared with realized full-benchmark accuracy. Original asset: [arXiv Figure 5](https://arxiv.org/html/2609.19526v1/figures/judge_value_breakthrough_state.png) · [Section 4.2 anchor](https://arxiv.org/html/2609.19526v1#S4.F5). It is a CC BY 4.0 paper result; correlation should not be read as a causal guarantee.*

### The stronger judge trade-off

The gpt-5.4-high judge reaches a 36.7% repeated mean, with `ρ=0.72` between BT rank and full score and top-five recall of 4/5. The weaker gpt-5 judge still reaches 34.5% and `ρ=0.71`, but top-five pairwise agreement falls to 0.50. A cheaper judge can steer search toward the right region, yet make more mistakes when ordering the final frontier.

A practical design could therefore be tiered: a cheap judge handles most comparisons, a stronger judge reorders only the frontier, and real benchmark execution makes the final decision. This is a reasonable extension, not a completed production recipe from the paper.

## What the judge sees changes ranking quality

The paper compares four candidate representations: diffs, diffs with swap ordering, full files, and full files with swap ordering. Across 50 non-root nodes:

| Judge input | Spearman ρ | Cost per comparison |
| --- | ---: | ---: |
| Diffs | 0.40 | $0.0076 |
| Diffs + swap-order | 0.43 | $0.014 |
| Full files | 0.68 | $0.011 |
| Full files + swap-order | 0.67 | $0.021 |

This is an engineering-relevant counterintuitive result: full files provide more context than a diff, yet cost less than swap-ordered full files and produce the strongest ranking correlation. The authors therefore use full-file comparisons without swap ordering. A plausible explanation is that the judge can reason about the final runtime implementation directly instead of reconstructing behavior from a patch chain.

![Original SIFT Figure 6: the speed contribution of asynchronous and speculative expansion](/paperReading/60-sift-fast-tree-search/paper/judge_value_time_advantage_average.png)

*Figure 6 (original paper Figure 6, Section 4.3): averages across five runs decompose the contribution of disaggregation and speculative judge-guided expansion. Original asset: [arXiv Figure 6](https://arxiv.org/html/2609.19526v1/figures/judge_value_time_advantage_average.png) · [Section 4.3 anchor](https://arxiv.org/html/2609.19526v1#S4.3). This is an author-reported result, not a general latency guarantee; the original page marks it CC BY 4.0.*

## SWE-60: reruns expose the instability of a single search score

In the SWE-60 appendix experiment, the starting agent scores 40.0% once. SIFT judge rank 1 (node 16) scores 53.3% during search and averages 50.4% over four full-60 evaluations; judge rank 2 (node 12) averages 53.8%. The no-judge accuracy rank 1 (node 11) scores 51.7% in search but only 44.6% across repeats.

![Original SIFT Figure 7: SWE-60 judge versus no-judge reruns](/paperReading/60-sift-fast-tree-search/paper/swe60_pooled_sharpening.svg)

*Figure 7 (original paper Appendix A Figure 8, SWE-60 experiments): pooled repeated evaluations show why judge-guided selection can be more stable than selecting only by the search score. Original asset: [arXiv figure asset](https://arxiv.org/html/2609.19526v1/figures/swe60_pooled_sharpening.svg) · [Appendix A anchor](https://arxiv.org/html/2609.19526v1#A.F8). The original page marks it CC BY 4.0; it is still a SWE-60 subset result, not a full SWE-bench claim.*

The qualitative lineage makes the preference concrete. One favored lineage adds LLM-style wrappers to the `git_patch` tool, then adds guarded recovery for malformed patches and support for full-file/add-file wrapper blocks. The judge prefers the more conservative node because another patch could silently place an edit incorrectly. Static code review does not prove behavior, but it can expose a runtime risk that a single noisy benchmark score has not yet revealed.

## Safety and evaluation integrity

The authors observed diagnosis agents occasionally proposing patches that relaxed timeouts or retry counts. If those patches were allowed, the agent could modify the evaluation environment and create a fake improvement. The paper uses three minimum controls:

1. Run candidates in sandboxed Docker containers.
2. Allow writes only to explicit runtime files, rejecting patches that touch benchmark or harness code.
3. Keep patch, judge decision, and downstream evaluation separate so judge rank cannot become the sole adoption condition.

This is why SIFT should be read as an engineering system rather than a single ranking trick: **search efficiency is the benefit, but modification boundaries and evaluation provenance are the prerequisites.**

## Limitations: why this is 28/30, not 30/30

- **No verified public implementation:** the paper describes the method, prompts, costs, and experiments, but no official repository was verified for an independent rerun at the time of reading.
- **The strongest judge is stronger than the coding backbone:** this is practical, but it is not pure self-judged improvement.
- **A single latent-strength assumption:** BT compresses a candidate into one scalar rank. A patch can help long-horizon debugging while harming syntax repair; one rank hides that trade-off.
- **Limited benchmark scope:** core evidence is concentrated on Polyglot, TerminalBench, and SWE-60 coding-agent settings, not research agents, browser agents, or enterprise workflows.
- **Limited independent verification:** repeated runs and cross-model transfer are author-run evidence; model versions, task availability, and API pricing can all change.

## Engineering judgment: when not to use SIFT

SIFT is a good fit when there are many candidates, full evaluation is expensive, and the search system can pin the subset, preserve runtime snapshots, and enforce a sandbox. Do not put judge rank into an automatic adoption path when the task is high-risk, the candidate set is small, or the platform cannot retain benchmark traces, allow-lists, and reproducible environments. In particular, never ship a self-modification directly to production from judge preference alone.

## Evidence map: paper directly supports, author claims, and engineering inference

- **Paper directly supports:** the Polyglot, TerminalBench, and SWE-60 settings, comparison tables, cost reports, reruns, and judge-input ablation.
- **Author claims:** BT-guided asynchronous search can find stronger and transferable coding-agent harnesses with less resource use.
- **Engineering inference in this article:** production should treat judge rank as a speculative signal and combine versioned snapshots, sandboxing, full benchmarks, and human approval into an adoption gate. That is not a deployment guarantee established by the paper.

## Engineering translation for agent platforms

I would turn SIFT into five explicit contracts:

| Contract | Artifact to retain | Failure handling |
| --- | --- | --- |
| Candidate patch | parent commit, complete changed files, dependencies, versions | reject if the parent cannot be reconstructed |
| Judge comparison | input snapshot, model, prompt, outcome, rationale | mark low confidence when the comparison graph is disconnected |
| Intermediate evaluation | fixed subset, task version, timeout, trace | use subset score for ranking only, never for publishing |
| Full verification | benchmark result, reruns, cost, environment hash | return to frontier review when variance is high |
| Adoption | allow-list diff, human approval, production canary | never write to production directly from a benchmark result |

This mapping is an implementation checklist derived from the paper’s safety discussion and evidence boundary, not a new theorem. The important operational rule is to keep judge-only rank and full-benchmark result as separate fields so dashboards do not display a speculative preference as verified quality.

## Three takeaways to remember

1. **SIFT ranks before it verifies:** pairwise judging and BT ranking decide what to explore, not whether the benchmark can be skipped.
2. **Asynchrony is half of the cost story:** the signal is useful because expansion, subset checks, judging, and full evaluation overlap.
3. **Reliability comes from boundaries and reruns:** strong judges, fixed subsets, sandboxing, allow-lists, and repeated full evaluation are all necessary; without a public implementation, the 28/30 reproducibility gap remains.

## Primary sources

The primary sources for this article are the [arXiv abstract](https://arxiv.org/abs/2609.19526), [arXiv HTML v1](https://arxiv.org/html/2609.19526v1), [arXiv PDF v1](https://arxiv.org/pdf/2609.19526v1), and the [original figure assets](https://arxiv.org/html/2609.19526v1/figures/). All numbers, figures, and limitations are fixed to v1; this article does not claim an independent rerun.

## Sources and figure index

- [arXiv abstract](https://arxiv.org/abs/2609.19526)
- [arXiv HTML v1](https://arxiv.org/html/2609.19526v1)
- [arXiv PDF v1](https://arxiv.org/pdf/2609.19526v1)
- [Original figure assets](https://arxiv.org/html/2609.19526v1/figures/)
- [Bradley–Terry model background](https://doi.org/10.1093/biomet/39.3-4.324)
