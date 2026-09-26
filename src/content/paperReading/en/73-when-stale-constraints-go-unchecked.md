---
title: "The Source Link Is Intact, but the Rule Is Stale: How Agents Miss Updates Under a Verification Budget"
description: "A deep reading of When Stale Constraints Go Unchecked: immutable provenance, append-only supersession, and stale-consistent decisions under a two-record verification budget. Audits four runs, the held-out correction, denominators, and the Zenodo artifact while bounding the synthetic evidence."
pubDate: 2026-09-26
updatedDate: 2026-09-26
tldr:
  - "The paper is not about a broken provenance link. The link still points correctly to a historical source, but that source is later superseded and the agent does not spend one of its two verification slots on the update path."
  - "Across two scripted worlds, six models, and a fixed two-record budget, native allocation produced stale-consistent decisions in 74.7%–77.3% of the superseded condition; forcing one slot onto the critical path improved the primary runs by 72.7–74.0 percentage points."
  - "The original procurement held-out contrast was +61.3 pp. After finding a timeline inconsistency, the author kept that result and added a post hoc-motivated but pre-frozen robustness replication at +73.3 pp. They must not be averaged or substituted for each other."
  - "The Zenodo v1 data and code were inspected; its published ZIP checksum, internal archive manifest, and lightweight number generator were verified. This reading did not rerun the model experiments. Synthetic worlds, installed staleness, and an oracle intervention bound the claims."
audience:
  - "Engineers building agents with persistent memory, RAG, or cross-session state"
  - "Researchers evaluating agent verification budgets, freshness, and memory updates"
tags: ["Paper Reading", "AI Agent", "Agent Memory", "Evaluation", "Provenance", "AI Safety"]
image: "/paperReading/73-when-stale-constraints-go-unchecked/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-memory-adaptation
  - agent-evaluation-observability
  - retrieval-rag
paper:
  title: "When Stale Constraints Go Unchecked: Budgeted Verification Failures in Inherited Agent Memory"
  authors:
    - "Kazuki Nakayashiki"
  year: 2026
  venue: "arXiv cs.IR preprint, v1 (2026-08-26; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2608.25553v1"
    arxiv: "https://arxiv.org/abs/2608.25553"
    doi: "https://doi.org/10.48550/arXiv.2608.25553"
    code: "https://doi.org/10.5281/zenodo.22108558"
---

This reading is pinned to **arXiv v1**; it does not silently mix in a later revision. Kazuki Nakayashiki submitted this cs.IR preprint on 2026-08-26. At the time of writing, it is not a paper with confirmed peer review. It follows the author’s earlier measurement of verification allocation in inherited memory, but asks a further question: if a constraint in memory has gone stale because a newer source withdrew it, can an agent avoid the error without a larger budget when its limited checks never reach that provenance path? [Paper v1](https://arxiv.org/abs/2608.25553v1) · [Zenodo v1 archive](https://doi.org/10.5281/zenodo.22108558)

## The paper in 90 seconds

- **Problem:** A long-running agent inherits a constraint that was once true. A source later changes, but the memory is not rebuilt. When the agent can verify only a few records, does it act on the old memory because it never retrieves the superseding record?
- **Core idea:** Provenance availability is not the same as provenance use. The authors separate the memory, its original source, a later superseding record, and the verification policy; they then measure whether decisions match the archive’s current record under a fixed two-record budget.
- **Strongest evidence:** In the primary growth-world `stated-memory × superseded` cell, native allocation produced 34/150 decisions consistent with the current record; forced-critical produced 145/150, a +74.0 percentage-point difference with a 95% model-stratified bootstrap interval of [+68.0, +80.0]. The fresh-wording replication was 38/150 versus 147/150 (+72.7 pp).
- **Main boundary:** This is a controlled experiment over six memories, two scripted worlds, two memory forms, and six models. Forced-critical knows in advance which path matters. It estimates how much error is attributable to allocation; it is not a production scheduler proposed or evaluated by the authors.

**Bounded verdict:** The paper provides evidence that verification-path allocation causally changes decisions in its fixed-budget synthetic tasks. It does not estimate how prevalent stale stated constraints are in real systems, nor show that a freshness score can identify which source to check in a real workflow.

> **Huahua's engineering note**
>
> A memory can have an intact source trail and still be unsafe to follow now. If an audit confirms only what document once produced the belief, without following updates or revocations to the record that remains current, provenance is history—not a current verification result.

## Why prior approaches are insufficient: prior work and research gap

The earlier study, [Verification Allocation in Inherited Agent Memory](https://doi.org/10.5281/zenodo.22084498), measured where a limited verification budget goes. This paper asks whether native allocation causes an avoidable decision error after the stated constraint has become stale. These are two questions studied with a related instrument; the earlier DOI must not be mistaken for this paper’s artifact. In particular, `10.5281/zenodo.22084498` is the prior work’s concept DOI. Zenodo currently resolves that concept to the prior work’s v2, `10.5281/zenodo.22102676`. This paper’s v1 data/code archive has the separate DOI `10.5281/zenodo.22108558`.

The authors distinguish layers of the problem. A retriever may use freshness metadata to decide what to surface now. A memory store may invalidate or revoke records. This paper observes a different point: after inheriting a set of memories, an agent must decide which sources to inspect within its budget. It does not collapse these into one retrieval algorithm or propose a new way to predict critical paths. Instead, it measures a causal policy contrast: how much does the decision change if, under the same two-record budget, one slot is redirected to a specified critical path?

## Five objects to keep distinct

Section 2 and Figure 1 distinguish five objects. Do not describe “stale memory” as a “bad source link.”

| Object | Meaning in the paper | Does it change when a new source appears? |
| --- | --- | --- |
| Source record `S` | An archived record with an ID, date, results, and conclusion | A new record is appended; the old one is not overwritten |
| Memory `M` | A one-line belief derived from a source and inherited by the next agent | Without re-consolidation, it may preserve an old constraint |
| Provenance `M → S₀` | The historical fact that `M` was derived from `S₀` at `t₀` | The historical relation remains unchanged and correct |
| Supersession `S₀ ⇒ S₁` | At `t₁ > t₀`, a newer authoritative record `S₁` replaces `S₀` as current on the same question | Appended; `S₀` is not deleted |
| Current record `cur(S₀)` | `S₁` when a supersession exists; otherwise `S₀` | Determined by the archive’s current state |

Thus, **staleness is a relation between memory content and the current record, not an attribute of the provenance link**. `M → S₀` may accurately record the historical source even though `S₁` has withdrawn the constraint stated by `M`. This matters for auditability: rewriting an old provenance edge as if it were erroneous would erase what supported the original decision.

The experiment makes verification unusually easy for the agent. A request for `S₀` returns the original record, a status line, and—if it has been superseded—`S₁` as well. All records have a status line regardless of whether they were superseded, so merely seeing a status line does not reveal which world is active. Discovering the update therefore costs one request. The failure question is narrowed to whether one of the two slots reaches that path. The authors note that a real archive requiring multi-hop discovery would make recovery harder, not easier.

## Core intuition: relevance does not imply verification priority

Semantic retrieval scores often approximate the question, “How relevant is this memory to the current task?” A constraint can be highly relevant and directly shape a plan; precisely because it reads as settled, the agent may not check its source again. The paper separates two decisions: **relevance** determines what is surfaced; **verification allocation** determines which sources receive a limited number of requests. This is the authors’ interpretation of the experiment, not a freshness-aware retriever implemented in the paper.

```text
day 31: source S₀ is written → memory M records a constraint from S₀
                 │ historical provenance M → S₀ remains unchanged
day 68: in the superseded world, authoritative S₁ withdraws the constraint
day 76: an agent inherits M and can inspect only two source records
day 79: the agent decides; the outcome is scored against cur(S₀)
```

In the valid world there is no day-68 update, so the constraint still holds. In the superseded world, `S₁` withdraws it. But at allocation time, the agent cannot see which world it is in; the two worlds are indistinguishable to it then. “Knowing the answer is stale” is not a direct signal available when the agent chooses a path.

## Walk one faithful example through the method

The following follows the growth-world discount scenario. The paper’s target is `memory_73`, derived from `exp_73`; the dates and variables come from Sections 2–3, not from a new production incident.

1. **Old evidence is recorded:** Day-31 source `S₀` reports that a promotional discount harms retention and prohibits reuse. Memory `M` compresses this constraint into one line and points back to `S₀`.
2. **Only one world receives an update:** In the superseded world, a new `S₁` is added on day 68 and withdraws the constraint for the same question. Memory `M` is not re-consolidated; `M → S₀` remains a correct historical link.
3. **The agent chooses two records to inspect:** On day 76, the agent inherits six memories and faces five candidate actions. A competitor’s second price cut makes the constrained discount tempting. The agent submits up to two memory IDs and a provisional action.
4. **One of three policies is applied:** Native returns the two records the agent named. Forced-critical replaces one slot with the target memory’s provenance path. Forced-noncritical inserts a seeded random non-target record. All three conditions return two records; the budget does not increase.
5. **The agent decides and is scored:** On day 79, the agent sees returned records and status lines before its final decision. In the superseded world, `S₁` is the standard: the withdrawn constraint should no longer govern the action. In the valid world, `S₀` remains current.
6. **A likely failure point:** If native allocation spends both slots elsewhere, the agent does not see `S₁`; the old memory still reads plausibly, and it may act on it. In a real archive with multi-hop lineage, incomplete timestamps, conflicting authorities, or incorrect status metadata, the paper’s one-request discovery assumption would no longer hold.

This is why the authors call it a budgeted verification failure: the agent is not shown a correction and then unable to understand it; the correction never enters the decision context. Forced-critical tests whether errors fall when the path is reached. It does not show how to reliably identify that path in an unknown task.

## Experimental design: three factors, two worlds, two records

This is an empirical, benchmark-style controlled experiment. The full design crosses memory form `F`, world state `W`, and verification policy `P`:

| Factor | Conditions | Operational difference |
| --- | --- | --- |
| Memory form `F` | stated / removed | Stated retains positive evidence, a quantified negative outcome, and a prohibition; removed keeps the positive evidence but replaces the negative result and constraint with a neutral fact and sentence |
| World `W` | valid / superseded | In valid, `S₀` remains current; in superseded, `S₁` withdraws the constraint. The day-68 change is invisible at allocation time |
| Policy `P` | native / forced-critical / forced-noncritical | Native returns the agent’s two IDs. The other policies replace one slot at archive response time, still returning two records |

“Removed” is a mechanism control, not another stale-memory condition: the source still contains the original constraint, while the memory no longer states it. This lets the authors test whether explicitly writing the constraint changes the chance that the agent checks its source. With a stated constraint, the target provenance path was named in 181/900 primary-run turn-1 responses (20.1%) and 208/900 replication responses (23.1%). With that constraint removed, rates were 66.9% and 72.9%. These rates pool six world × policy cells whose turn-1 prompts were identical; they should not be treated as constant behavior for every model.

### Episode units and models

Each episode has two turns. On turn 1 (day 76), the model returns verification IDs, a provisional action, a scale, and a rationale; the archive returns two source records according to the policy. On turn 2 (day 79), the model sees those records and submits its final decision. The author reuses the prior work’s system prompt, JSON schema, and six models: Claude Opus 5, Sonnet 5, Haiku 4.5, GPT-5.6 Sol, Terra, and Luna. No judge model scores the outcome.

The primary run has `2 × 2 × 3 = 12` cells × 6 models × 25 episodes per model and cell, or **1,800 episodes**. A fresh-wording replication adds 1,800 episodes with fresh seeds and six new wording families. A procurement held-out run uses only the stated-memory form and has 900 episodes; the corrected held-out robustness replication also has 900. In total there are **5,400 confirmatory episodes, 10,800 kept model calls, five retries, and zero errors**. A 48-episode mechanics pilot is excluded from confirmatory results. Each headline cell contains 6 models × 25 = **150 episodes**; the full run’s 1,800 is not the denominator for one stale-memory cell.

### Outcome `Y`

- `V`: whether the agent named the target provenance path on turn 1.
- `R`: whether the archive actually returned the target source record.
- `Y`: whether the turn-2 decision agrees with the record marked current by the archive. In the superseded world, choosing the action constrained by the withdrawn rule is inconsistent; in the valid world, decisions are scored against still-current `S₀`.

Scoring is deterministic and uses no model judge. The main estimand is the risk difference in `Y` between forced-critical and native within `stated × superseded`, equally weighted across models, with 4,000 model-stratified bootstrap resamples. The fixed budget is central: both arms inspect two records; one path changes.

## Figure 1: history stays put while current status changes

![Original Figure 1 from the paper: provenance from S₀ to M remains unchanged while S₁ supersedes S₀ later; an agent verifies two records before deciding.](/paperReading/73-when-stale-constraints-go-unchecked/figures/figure-1-provenance-timeline.png)

*Figure 1 (paper Section 2, “Provenance, supersession, and stale memory,” anchor [S2.F1](https://arxiv.org/html/2608.25553v1#S2.F1)): Notice that the vertical historical relation `M → S₀` and the later temporal update `S₀ ⇒ S₁` are different links; the second does not rewrite the first. The agent has two budget slots, and only inspecting M’s path reveals supersession and S₁. Source: original v1 figure by Kazuki Nakayashiki, reused under arXiv’s [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license; cropped from the paper PDF without changing its research content.*

The point is not that the memory was updated; it was not re-consolidated. The historical record remains auditable, while the current interpretation follows the append-only supersession. The authors’ archive makes this relationship unusually easy to inspect: one request to an old record immediately returns the newer record. This means the experiment tests budget allocation, not multi-hop search through a production lineage graph.

## Figure 2 and Table 1: what changes under the same budget?

![Original Figure 2 from the paper: native allocation versus forced-critical verification under the same budget across four runs.](/paperReading/73-when-stale-constraints-go-unchecked/figures/figure-2-same-budget-result.png)

*Figure 2 (paper Section 4.3, “Re-allocating the same budget removes most of the error,” anchor [S4.F2](https://arxiv.org/html/2608.25553v1#S4.F2)): The y-axis is the share of decisions still consistent with stale memory in the stated-memory, superseded-world condition. Each run’s bar has `n=150`, 25 per model, with Wilson 95% intervals. Original and corrected held-out are separate results. Source: original v1 figure, CC BY 4.0; cropped from the PDF with no redrawing of data.*

**Table 1 uses only the `stated × superseded` cell for each run:**

| Run | Episodes in full run | Native: `Y` current-record-consistent | Forced-critical: `Y` current-record-consistent | Risk difference (95% CI) | Models with positive effect |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary growth | 1,800 | 34/150 (22.7%) | 145/150 (96.7%) | +74.0 pp [+68.0, +80.0] | 6/6 |
| Fresh-wording replication | 1,800 | 38/150 (25.3%) | 147/150 (98.0%) | +72.7 pp [+66.7, +78.7] | 6/6 |
| Procurement held-out, original | 900 | 38/150 (25.3%) | 130/150 (86.7%) | +61.3 pp [+54.0, +68.0] | 6/6 |
| Procurement held-out, corrected robustness | 900 | 36/150 (24.0%) | 146/150 (97.3%) | +73.3 pp [+68.7, +77.3] | 5/6 |

In the superseded world, the native stale-consistent rate is `1 − Y`: **77.3%** (116/150) in primary, **74.7%** (112/150) in replication, **74.7%** (112/150) in original held-out, and **76.0%** (114/150) in corrected held-out. The “about three quarters” description refers to these four specified cells, not an overall failure rate across all 5,400 episodes.

The primary run clarifies the contrast. Both arms receive two records. Native returned the target record in 32/150 episodes and had `Y=34/150`; forced-critical guarantees the path is checked and has `Y=145/150`. When the record was returned, native decisions were 32/32 current-consistent; without it, 2/118 were. Those last two are descriptive splits by a post-treatment event, not an additional randomized causal estimate.

The stated-versus-removed comparison adds another piece. In the **valid world** (the source constraint remains current), native errors in the removed-memory cell were 32/150 (21.3%) in primary and 35/150 (23.3%) in replication. These are `1 − Y` for removed × valid, not superseded cells. In removed × superseded × native, the errors are instead 21/150 and 15/150, implied by `Y=129/150` and `135/150` in the tables. The authors interpret the stated-versus-removed behavior as suggesting that an explicitly stated constraint can make memory feel settled and reduce source checking. This is an observation inside the controlled design, not evidence that deleting constraints reduces errors in real systems.

### The original and corrected held-out results must not be collapsed

After running and analyzing the original procurement held-out, the author audited rationales from 20 forced-critical episodes that did not switch vendors. The day-74 turn-2 situation said the contract expired “in 3 days,” while the source record said onboarding required six weeks and the day-71 turn-1 situation said the contract expired in 14 days—eleven days should have remained. Even after reading the superseding record, a record-consistent switch was therefore implausible under the scenario’s own timing; ten non-switching cases explicitly cited this reason.

The author did not edit or discard that original run. It remains **130/150 versus 38/150, +61.3 pp [+54.0, +68.0]**, reported as run. Afterward, the author changed the single conflicting sentence to say the contract expired in 11 days and a month-to-month bridge was available, used fresh seeds, and froze the complete robustness specification, success criteria, and OSF deposit before executing it. That run gave **146/150 versus 36/150, +73.3 pp [+68.7, +77.3]**. It was initiated after the original issue was discovered, so it is post hoc relative to the original run, even though it had a pre-frozen protocol of its own. The correct reading is to report the original result beside the robustness replication—not average them or replace +61.3 with +73.3.

## Figure 3: direction is more consistent than magnitude

![Original Figure 3 from the paper: per-model forced-critical minus native effects under the same budget across four runs.](/paperReading/73-when-stale-constraints-go-unchecked/figures/figure-3-model-heterogeneity.png)

*Figure 3 (paper Section 4.9, “Model heterogeneity and a ceiling case,” anchor [S4.F3](https://arxiv.org/html/2608.25553v1#S4.F3)): Each arm has `n=25` per model and run; the effect ceiling is set by the rate at which native allocation leaves the critical path unchecked. Notice Haiku 4.5’s zero effect in corrected procurement: it already checked the critical record natively in 25/25 episodes, leaving no headroom. Source: original v1 figure, CC BY 4.0; cropped from the PDF without changing groups or values.*

Primary per-model effects range from +16.0 to +96.0 pp. Sonnet 5 improves by only +16 because it already checks the target more often; its structural bound is 24 pp. In corrected held-out, Haiku 4.5 checks `memory_c2` natively in 25/25 episodes and is current-record-consistent in all 25, so the effect is +0.0 at a bound of zero. That is not a failed intervention; there is no native under-verification left to repair.

The authors report that leave-one-model-out estimates remain at least +69.6 pp for the primary run, but the magnitude varies substantially. The same model can have a native verification rate of 0%–12% in the growth world and 80%–100% in procurement. The supported wording is: “In these models and scenarios, forced-critical usually has a positive direction.” It is not that one world- and task-independent scheduler is already known. The corrected held-out effect is positive for 5/6 models, preserving the denominator; one model is at a zero-effect ceiling case.

## Ablations and controls: what supports the mechanism, and what is not a headline

1. **Constraint stated versus removed:** Under the same positive evidence, explicitly including the negative result and prohibition changes whether the agent checks the source on turn 1. This supports the observation that a written constraint may read as settled. But confidence, plan, and salience were not manipulated, so the paper does not identify a psychological mechanism.
2. **Superseded versus valid source:** In valid worlds, where the source still supports the constraint, forced-critical changes `Y` little relative to native: +0.7, +2.0, +0.7, and +0.0 pp across the four runs; intervals include zero. This is consistent with the effect depending on whether the source actually overturns the memory, but says nothing about the cost or side effects of rechecking in a product.
3. **Forced-critical versus forced-noncritical:** Appendix D’s noncritical control has a design limitation. When the agent named the target second, this arm replaces it with a random record plus the agent’s first choice, discarding the target. This occurred in 19, 18, 19, and 21 episodes across the four runs, all of which were stale-consistent. The contrast therefore mixes the value of the critical record with the cost of overriding a native choice. The author withdraws its narrative weight; the headline comparison is forced-critical versus native.
4. **Fresh wording and domain transfer:** Six new wording families preserve a large difference in replication, and a second procurement domain also shows a positive difference. But the original held-out scenario has a timing inconsistency, so it must be read alongside the corrected robustness replication. These are internal replications by the same author, harness, and model set—not independent-team replications.

Appendix A reports primary family effects from +60.9 to +89.3 pp and replication effects from +56.5 to +86.2 pp, suggesting that one wording family does not carry the result. The corrected held-out specification was deposited to OSF before execution, and its seeds do not overlap the earlier 4,548 episodes. These steps improve auditability but do not replace a cross-team rerun or evaluation on real memory sources.

## Evidence map: paper, observed data, and engineering interpretation

- **Direct paper claim:** Under its assigned controlled conditions, verification policy changes whether agent decisions agree with the archive’s current record. Moving one slot to a specified critical path at the same two-record budget improves `Y` substantially in the `stated × superseded` cells.
- **Checkable observations:** Counts, denominators, native and forced-critical results, bootstrap intervals, model heterogeneity, the held-out inconsistency, and corrected replication appear in Tables 1–7 and Appendices A–E. Outcomes are scored deterministically from the response schema; no model judge is involved.
- **Author interpretation:** The avoidable error approaches the structural ceiling set by native under-verification. Production memory systems may need freshness, supersession, or expected-loss signals distinct from semantic relevance.
- **Bloss0m engineering synthesis:** A memory schema could preserve an immutable origin edge while separately tracking supersedes/revokes relations, source authority, validity intervals, and last-checked time. High-impact decisions might reserve a verification slot for potentially invalidated constraints. This is a design direction derived from the evidence, **not a scheduler proposed and evaluated by the authors**.
- **Not established:** The prevalence of stale stated constraints in real agent memory; who may revoke an authoritative source; what to do with delayed or incorrect timestamps; how to resolve conflicting authorities; whether a scheduler can identify high-risk paths within budget; or whether this mechanism improves general RAG or production-task accuracy.

`Y` is not a general answer-accuracy score. It asks whether the final decision matches the record the archive designates current; the scripted world defines that status. Any reported proportion needs its condition, denominator, and world. The 77.3% result does not mean “real agents have a 77.3% chance of violating policy.”

## Artifacts and reproducibility: direct status as of 2026-09-26

Paper v1 points to the Zenodo record [10.5281/zenodo.22108558](https://doi.org/10.5281/zenodo.22108558), published as v1 on 2026-08-26; record metadata lists CC BY 4.0. The record lists four files: `paper2-preprint-v1.pdf`, `paper2-data-and-code-v1.zip`, `paper2-latex-source-v1.tar.gz`, and `SHA256SUMS`. I downloaded the 22,778,768-byte data/code ZIP directly; its SHA-256 matches the checksum published by Zenodo, and the extracted archive’s `MANIFEST.sha256sum` also passes.

The ZIP README labels **text and data CC BY 4.0, and code MIT**; those layers should not be collapsed into one license description. Contents include 5,400 confirmatory episodes across primary, replication, original held-out, and corrected held-out runs; 48 explicitly excluded pilot episodes; frozen specifications and manifests, OpenTimestamps proofs, registration records, analysis and independent recomputation scripts, a number/figure-data generator, LaTeX sources, and corrected-held-out diff and seed audits. This is not just a README claim: the ZIP tests cleanly, the published and internal checksums pass, and the extracted data and code files are present.

As a lightweight check, I ran `paper2/scripts/generate.py` from the extracted archive. It reads raw episode JSON rather than trusting stored `scored` fields. It completed and emitted 229 macros, reporting 5,400 episodes, 10,800 calls, five retries, zero errors, and reproducing the four headline risk differences and intervals. The README documents full experimental reruns as requiring Node 22, Anthropic/OpenAI provider API keys, and `npm install`; the keys are not included. **I did not rerun the model experiments.** The precise status is therefore: raw episodes and analysis are inspectable, and the number generator runs; rerunning the model calls requires external credentials and runtime setup.

Do not conflate the two Zenodo records. The prior instrument paper’s `10.5281/zenodo.22084498` concept DOI currently resolves to its v2, `10.5281/zenodo.22102676`; the v1 code/data for this paper are separately published as `10.5281/zenodo.22108558`. The prior DOI cited in the bibliography is not this paper’s download link.

## Limitations and claims the paper does not support

1. **Two hand-scripted worlds:** the growth discount and procurement reliability constraints were constructed by the researcher. There is no naturally arising consolidation chain and no evidence that real stale constraints occur at the same rate.
2. **Installed staleness:** the author assigns the superseded state, and the archive defines current truth. Real data may lack clear revocation events or contain multiple conflicting authorities.
3. **A single-hop, noise-free archive:** one request returns the original, status, and update. Delayed or wrong timestamps, incomplete lineage, permission failures, and unavailable updates were not manipulated.
4. **Forced-critical is an oracle:** the experimenter knows which path matters. It identifies the avoidable share under the budget; it is not a deployable policy.
5. **Narrow model, prompt, and world coverage:** six models from two providers, one system prompt, one JSON schema, and one archive message format. Model-by-world behavior varies substantially; results do not automatically transfer to other models or tool interfaces.
6. **Same-team replications:** fresh wording and held-out conditions provide useful internal robustness checks, but use the same author, code, and model set; they are not independent replications.
7. **A material original held-out inconsistency:** it affects the forced-critical arm adversely. The author retains the +61.3 pp original and adds +73.3 pp corrected robustness. The chronology matters; do not select only the larger result as the headline.
8. **An imperfect noncritical control:** force-noncritical sometimes discards the agent’s second-ranked target, adding a design bias to that comparison. The author withdraws its headline interpretation.

## Engineering judgment: which question is worth carrying forward?

**Bloss0m engineering interpretation:** represent “where did this belief come from?” separately from “is it still current?” Preserve immutable provenance; separately record supersedes/revokes relations, source authority, validity interval, and last verification time. For high-impact decisions, a system might reserve a slot for checking constraints at risk of invalidation. This is a research-inspired proposal, not a tested design win. A production experiment should also track false alarms, latency, token/API cost, and authority-resolution errors.

**This question is useful when:** agents inherit policies, preferences, permissions, contract terms, or operational constraints across sessions while source material can be superseded or withdrawn. A small study could hold relevance and a two-record budget fixed, then compare native, recency-only, authority-aware, and loss-aware allocation on de-identified real supersession chains. It should blind update time and report erroneous actions, excess checks, and incorrect overwrites.

**Do not copy the intervention directly when:** sources have no version IDs, reliable authority hierarchy, or auditable supersession edges. A timestamp alone may make incorrect data look more precise. This paper is not evidence that all agent memory becomes stale, or that inserting a freshness score will prevent roughly three quarters of errors.

For adjacent reading: [MemGPT: Context as Memory Paging](/en/paper-reading/28-memgpt-context-as-memory-paging/) explores persistent memory state and control; [APort Vault](/en/paper-reading/66-aport-vault-payment-agent-authorization/) examines deterministic authorization before tool execution; and [Trajectory-Aware Benchmark Subset Selection](/en/paper-reading/67-trajectory-aware-benchmark-subset-selection/) studies evidence slicing in agent evaluation. These are conceptual connections, not papers using the same data or mutually validating one another.

## Three things to remember

1. **Technical idea:** Provenance says what supported a belief at the time; supersession says which source is current. The former can remain correct while the memory is stale.
2. **Strongest evidence:** In the specified synthetic `stated × superseded` cells under a fixed two-record budget, native stale-consistent rates were 74.7%–77.3% across four runs. Oracle forced-critical contrasts were +61.3 to +74.0 pp, with a separate +73.3 pp corrected held-out robustness run.
3. **Claim boundary:** The experiment measures an avoidable decision difference from verification allocation in a controlled archive. It does not estimate real-world stale-memory prevalence or supply a deployable critical-path scheduler.

## Primary sources

- [arXiv v1 abstract and history](https://arxiv.org/abs/2608.25553v1) — version, author, category, submission date, and v1 source.
- [arXiv v1 full text](https://arxiv.org/html/2608.25553v1) — Sections 1–6, Figures 1–3, Tables 1–7, and Appendices A–E.
- [Zenodo v1 archive record](https://doi.org/10.5281/zenodo.22108558) — metadata, file list, record license, and direct data/code ZIP.
- [Zenodo v1 data and code ZIP](https://zenodo.org/api/records/22108558/files/paper2-data-and-code-v1.zip/content) — directly inspected archive, license split, raw episodes, scripts, manifests, and README.
- [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/) — license linked from arXiv and the Zenodo record.
- [Prior instrument paper concept DOI](https://doi.org/10.5281/zenodo.22084498) — separate prior work, not this paper’s archive.
