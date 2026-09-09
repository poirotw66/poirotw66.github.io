---
title: "DRACO: Sending Long-Horizon Agent Credit Back to the Steps"
description: "A source-grounded reading of DRACO (arXiv:2609.04094): dynamic per-trajectory rubrics create an outcome-blind reward, then a closed-form rule redistributes GRPO advantage to the steps cited by the judge."
pubDate: 2026-09-09
updatedDate: 2026-09-09
tldr:
  - "DRACO changes two control points: rubrics adapt to each task, rollout, and policy capability, while a trajectory-level advantage is redistributed to the steps implicated by the rubric verdicts."
  - "The credit rule preserves GRPO's total push and sign, uses step quality and 1/n_j length normalization, and avoids a learned attribution module or a judge call at every position."
  - "With Qwen3.6-27B, AppWorld test-normal TGC/SGC rises from 69.4/41.1 to 85.3/70.6; zero-shot tau-bench Banking success rises from 15.8 to 20.4."
  - "The main boundary is judge and attribution validity: the paper has no human calibration and does not directly show that cited steps are the true causal steps."
audience:
  - "AI engineers building long-horizon tool agents, outcome-blind RL, or rubric-based reward pipelines"
  - "Research and platform leads deciding whether dynamic evaluation, step credit, and judge cost belong in an agent-training stack"
tags: ["Paper Reading", "Agent Systems", "Agent Evaluation", "Reinforcement Learning", "Tool Use"]
image: "/paperReading/44-draco-dynamic-rubrics/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
  - agent-safety-governance
paper:
  title: "DRACO: Fine-Grained Credit Assignment with Dynamic Rubrics for Long-Horizon Agent Training"
  authors:
    - "Shubham Gandhi"
    - "Saurabh Goyal"
    - "Kiran Kate"
    - "Yara Rizk"
  year: 2026
  venue: "arXiv:2609.04094 v1 (2026-09-03; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2609.04094v1"
    arxiv: "https://arxiv.org/abs/2609.04094"
    code: "https://github.com/IBM/draco"
series:
  id: "agent-training-rewards"
  title: "Agent Training and Rewards"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

DRACO studies a harder setting than ordinary RL from verifiable rewards: long-horizon tool tasks where training cannot read a reliable ground-truth verifier, unit test, or gold answer. The authors use natural-language rubrics to let a frozen judge evaluate a completed trajectory. But one scalar still gives poor learning signal across dozens of turns. A trajectory may contain one decisive mistake surrounded by correct setup, or a successful outcome that includes redundant and lucky actions. If GRPO puts the same advantage on every response token, all of those decisions are reinforced or suppressed together.

- **Problem:** How can an agent be trained without an outcome oracle, and how can the resulting signal avoid treating a long trajectory as one indivisible action?
- **Core insight:** Generate, merge, deduplicate, and filter rubrics dynamically for a task and sampled rollout group. Ask the judge to cite the steps behind each verdict, then redistribute the trajectory advantage to those steps with a closed-form rule.
- **Strongest evidence:** With Qwen3.6-27B, AppWorld test-normal TGC/SGC rises from 69.4/41.1 for the base policy to 85.3/70.6 for DRACO. Against the same-budget outcome-reward reference, the margins are +5.3/+11.3 points (Table 2, Section 4.2). Zero-shot tau-bench Banking success rises from 15.8 to 20.4.
- **Main boundary:** These are benchmark and end-task results, not direct validation of the judge or of step causality. The authors have no human-rater calibration; a judge may be consistently wrong, and a wrong attribution can still produce a better policy by chance.

My bounded verdict is: **DRACO is best understood as reward plumbing. It turns an evolving rubric into a comparable trajectory signal, then rewires that existing signal to steps with evidence. It is a useful experiment when you suspect uniform trajectory credit is the bottleneck, but it is not a verifier replacement and should not be the sole control signal for high-risk tools.**

> **Huahua's engineering note**
>
> Dynamic rubrics make evaluation more responsive to the rollout, but they also make the reward target depend on the sampled group. Version the rubric set, judge model, prompt, criterion verdicts, step citations, and policy checkpoint together. Otherwise a changed score may reflect a changed judge or rubric rather than a changed policy.

## Paper identity and the limitation it targets

DRACO is an arXiv v1 preprint by Shubham Gandhi, Saurabh Goyal, Kiran Kate, and Yara Rizk, posted on 2026-09-03. There is no peer-reviewed venue information in the paper record used here, so this article treats it precisely as an **unreviewed arXiv preprint**. The official artifact is [IBM/draco](https://github.com/IBM/draco), a source repository with training, AppWorld and tau-bench evaluation, and analysis directories rather than a paper-only release.

There are two reward problems to separate. The first is outcome verification: mathematics and code often have an exact checker, but customer support, research, and compound tool operations may not have a cheap and complete oracle. The second is temporal credit assignment: once a trajectory-level scalar exists, which turn should change? Standard GRPO computes a group-normalized advantage and applies the same $A_i$ to every response token. Over a long sequence, a correct API choice, an irrelevant read, and the action that caused failure all receive the same direction and magnitude.

DRACO is not simply “rubrics instead of no rubrics.” Prior rubric-based methods can score a finished trajectory, while other step-credit methods can decompose a signal. The paper positions DRACO at their intersection: it does not use a ground-truth outcome, does not call a judge at every position, and does not train a separate attribution module. Table 1 classifies methods along outcome-blindness, dynamic rubrics, trajectory-level scoring, step attribution, and learned attribution. That table is a method taxonomy, not a performance ranking.

For nearby context, see [A²E: An End-to-End Agent Auditing Engine](/en/paper-reading/19-a2e-agent-auditing-engine), which asks how to preserve replayable trajectory and runtime evidence, and [OSReward](/en/paper-reading/08-osreward-agent-evaluation), which shows why benchmark scores, judge bias, and platform failures should not be collapsed into one claim. DRACO moves the control point earlier, into training: which process criteria become reward, and how do they affect the policy?

## Core intuition: rewire a total rather than invent another reward

The standard GRPO mental model is:

`group of rollouts → one reward per rollout → normalize to A_i → apply A_i to every response token`

DRACO's model is:

`task + rollouts → dynamic rubric set → trajectory reward R_i → GRPO advantage A_i → criterion-to-step citations → step advantages a_j`

The first change is that the rubric is not written once for the whole task distribution. The judge first proposes instruction-derived criteria. It then observes sampled executions and proposes sub-goals, failure patterns, or safety conditions that only become visible in the actual run. Candidate criteria are merged and deduplicated. **Discriminative dropout** removes a criterion if no group member fails it, because such a criterion cannot distinguish the rollouts in group-relative learning. The prompts ask for MECE criteria so one observable mistake is not punished twice by overlapping rules.

The second change is that a verdict is not just PASS or FAIL. The judge also returns `relevant_steps`. The pass fraction of criteria citing a step becomes its quality. The rollout's sign still comes from the group-level advantage: a winner is reinforced, a loser is suppressed. Credit decides where that push lands inside the trajectory. On a winner, higher-quality steps get more weight; on a loser, lower-quality steps get more weight because the objective is to suppress the bad behavior.

## A faithful worked example: from rollout to step credit

The following first uses the two-step mathematical example in Appendix E, then walks through the paper's logged seven-step rollout. The numbers are paper evidence; they are not task-success labels.

### Two steps: equal quality, equal total influence

Assume a trajectory advantage $A_i=1$, equal weights $w_1=w_2=1$, and token counts $n_1=2,n_2=4$. Then $N=6$ and:

$$
a_j=A_i\cdot\frac{Nw_j}{n_j\sum_k w_k}.
$$

The per-token advantages are $a_1=1.50$ and $a_2=0.75$. Their step totals are nevertheless $n_1a_1=3$ and $n_2a_2=3$. The longer step does not get twice the total push merely because it has twice as many tokens; it spreads the same share across more tokens.

If the second step is better, set $w_1=0.5,w_2=1$. The resulting $a_1=a_2=1$, while the step totals become 2 and 4. Total influence follows the quality-weight ratio. This is why per-token $a_j$ is not a step ranking: the $1/n_j$ term can make a short step look stronger per token. Compare $n_ja_j$ when asking how much total update a step receives.

### Seven logged steps: a winner is not necessarily a success

Appendix E.6 traces a real logged rollout with seven steps and five applicable rubric checks. R1, R2, and R3 fail; R4 and R5 pass. Its reward is $(2-3)/5=-0.2$, but it is still a winner relative to its rollout group, so $A_i\geq0$ and it uses the “reinforce high-quality steps” branch.

The cited-step counts produce $Q=1.000$ for Steps 1 and 2, $Q=0.500$ for Steps 3 and 5, and $Q=0.333$ for Steps 4 and 6. Step 7 is uncited and inherits the cited-step mean, $\bar Q=0.611$. Because this is a winner, $w_j=Q_j$. Steps 1 and 2 therefore receive three times the weight of Steps 4 and 6. With the paper's explicitly illustrative token counts $[40,40,30,50,30,60,60]$, the seven step totals sum to $310=A_iN$; Steps 1 and 2 each receive 72.47, while Steps 4 and 6 each receive 24.16.

Two lessons are easy to lose. First, **winner does not mean task pass**: it only means the rollout's rubric reward is high relative to its group. Second, credit follows judge citations, not an independently known causal label. If the judge cites the wrong step, conservation still holds while the policy update may be pointed in the wrong direction.

## Technical mechanism: dynamic rubrics, reward, and closed-form credit

### 1. The GRPO baseline

For task $x$, policy $\pi_\theta$ samples $G$ trajectories $\{\tau_i\}_{i=1}^G$ and assigns each a scalar reward $R_i$. Group normalization produces:

$$
A_i=\frac{R_i-\operatorname{mean}(\{R_j\})}{\operatorname{std}(\{R_j\})}.
$$

The standard policy-gradient term is:

$$
\nabla_\theta J=\mathbb E\left[\sum_t A_i\nabla_\theta\log\pi_\theta(y_{i,t}\mid y_{i,<t},x)\right].
$$

$A_i>0$ makes the rollout tokens more likely in context, $A_i<0$ makes them less likely, and one $A_i$ multiplies every token. DRACO keeps the group normalization and changes only the uniform multiplier.

### 2. How a dynamic rubric creates an outcome-blind reward

For a task instruction, the judge generates instruction-derived criteria. For each sampled rollout, it generates execution-derived criteria. Each criterion is expected to be scoreable from the trajectory, with a title, description, evaluator instruction, and applicability conditions. The group-level candidate pool is merged into a shared set $\mathcal R=\{c_1,\ldots,c_K\}$, duplicates are removed, and criteria with no group failure are dropped.

For rollout $i$, let $p_i$ and $f_i$ count applicable, surviving PASS and FAIL verdicts:

$$
R_i=\frac{p_i-f_i}{p_i+f_i}.
$$

If no criterion applies, $R_i=0$. NOT APPLICABLE contributes to neither numerator nor denominator. A conditional criterion whose trigger never occurs is not a free pass. The reward therefore contains no unit-test result, gold answer, or success oracle; this is the paper's outcome-blind setting.

### 3. From citations to step quality

A step is approximately one agent turn or emitted code block. Turn glue and tool-result echoes are gap tokens: they belong to no step, receive zero advantage, and are excluded from the token total used for redistribution. For step $j$, let $p_j$ and $f_j$ count passing and failing criteria that cite it. Define:

$$
Q_j=\frac{p_j}{p_j+f_j},\qquad Q_j\in[0,1].
$$

An uncited step receives the mean $\bar Q$ over cited steps. This fallback avoids silently deleting the step; it does not claim that the judge assessed it directly.

Let $n_j$ be the token count in step $j$, and $N=\sum_kn_k$ the number of tokens inside credited steps. When $A_i\geq0$, use $w_j=Q_j$ because a group winner should reinforce its good steps. When $A_i<0$, use $w_j=1-Q_j$ because a group loser should suppress its bad steps. Every token in step $j$ receives:

$$
a_j=A_i\cdot\frac{Nw_j}{n_j\sum_kw_k}.
$$

The quality weight supplies the direction-correct allocation; $1/n_j$ prevents verbosity from buying more step-total influence; $N$ preserves the total. If there is no citation, or if the normalizer collapses to zero in the unanimous degenerate cases described in Appendix E.7, the implementation falls back to uniform baseline GRPO.

The central invariant is:

$$
\sum_j n_ja_j=A_iN.
$$

The scalar total push is exactly the baseline total over the credited tokens. Only its location changes. Since $w_j\geq0$, $a_j$ cannot have the opposite sign from $A_i$: credit preserves reinforcement versus suppression. Appendix E also states no-signal equalization, monotone correctness, length independence, reward-scale invariance, and winner/loser symmetry. These are algebraic properties of the rule, not proof of performance dominance or of judge correctness.

![DRACO Figure 1: dynamic rubric generation, trajectory reward, and step-advantage reallocation](/paperReading/44-draco-dynamic-rubrics/paper/figure-1-overview.webp)

*Figure 1, Section 1: the upper path proposes, merges, and scores rubrics from the task and sampled trajectories to obtain outcome-blind $R_i$; the lower path normalizes rewards into $A_i$ and reallocates it using per-criterion step citations to obtain $a_j$. [Original Figure 1](https://arxiv.org/html/2609.04094v1#S1.F1) · [original image endpoint](https://arxiv.org/html/2609.04094v1/figures/draco_image.png). The arXiv HTML marks the paper CC BY 4.0; this article retains attribution and converts the PNG to WebP.*

## How to read the evidence: results, cost, and failure modes

### Setup and evaluation protocol

Training uses the 90-task AppWorld training split. Four outcome-blind settings start from the same Qwen3.6-27B policy: static rubric without credit, static rubric with step credit, dynamic rubric without credit, and full DRACO. A fifth comparison trains against AppWorld unit-test outcomes. The main ablations use Qwen3.6-27B; the paper also reports Qwen2.5-32B-Instruct. Runs use LoRA and GRPO, batch size 16, group size 6, and eight H100 GPUs. Training-time rubric generation, union, scoring, and credit allocation use GPT-5.4 at temperature 0.1.

Evaluation covers AppWorld test-normal (168 tasks), AppWorld test-challenge (417 tasks with unseen apps and compositions), and zero-shot tau-bench Banking (97 tasks). AppWorld reports Task Goal Completion (TGC) and Scenario Goal Completion (SGC); tau-bench reports state-matching success rate. $p^1,p^2,p^3$ are consistency measures over three evaluation runs: success in all $k$ runs, not the pass@k measure of success at least once. Qwen3.6 trains for 100 steps and Qwen2.5 for 75; the paper averages the final three checkpoints, with three evaluation runs per checkpoint.

### Figure 2 and Table 2: do not read one headline row in isolation

Table 2 is the central result. For Qwen3.6-27B, DRACO reaches 85.3/70.6 TGC/SGC on AppWorld TN, versus 69.4/41.1 for the base policy. On AppWorld TC its TGC is 61.5, and tau-bench SR is 20.4, versus 49.7 and 15.8 for base. TN gains are +15.9 TGC and +29.5 SGC. Against the same-budget outcome-reward reference at 80.0/59.3, DRACO is +5.3/+11.3. This does not show that rubrics are intrinsically more truthful than verifiers: the reward source changes, while ground truth is used only for evaluation.

With Qwen2.5-32B-Instruct, TN TGC/SGC rises from 35.7/17.3 to 62.9/42.3. That suggests the method is not limited to one starting policy, but it is not a scaling law. The consistency result is particularly informative: TN TGC $p^3$ rises from 47.6 to 72.8, a larger improvement than a single-run metric. It is still benchmark consistency, not production reliability.

![DRACO Figure 2: evaluation-cost and performance trade-off on AppWorld and tau-bench](/paperReading/44-draco-dynamic-rubrics/paper/figure-2-cost.svg)

*Figure 2, Sections 4.2 and 4.4: one panel per benchmark, with evaluation cost on the horizontal axis and Qwen3.6-27B $p^1$ on the vertical axis; up and left is better. [Original Figure 2](https://arxiv.org/html/2609.04094v1#S4.F2) · [original image endpoint](https://arxiv.org/html/2609.04094v1/pareto_cost.svg). The arXiv HTML marks the paper CC BY 4.0; this article retains attribution and uses a local copy of the SVG.*

Cost changes the interpretation. On AppWorld TN, DRACO reaches 85.3 TGC for $8.27 versus 69.4 for $10.77 untrained; on TC it reaches 61.5 for $38.03 versus 49.7 for $43.56. All rubric settings shorten AppWorld episodes; DRACO goes from 18.7 to 14.7 turns on TN and from 22.9 to 20.7 on TC. On tau-bench, turns rise slightly for every setting and gains cost more. In an out-of-domain benchmark, a shorter base rollout may simply give up earlier, so extra turns can represent completion rather than inefficiency.

### Ablation: the two parts need each other

The four-way ablation is the paper's most useful mechanism evidence. On AppWorld TN, adding step credit on top of per-trajectory rubrics adds +3.2 TGC and +5.7 SGC. Combining both components adds +4.2/+10.7 over the fixed-rubric setting, widening to +8.1/+14.3 at $p^3$. Either component alone contributes much less. On AppWorld TC, step credit on a fixed rubric costs 3.7 TGC at $p^3$, while step credit on dynamic rubrics adds 1.4. This is exactly what the mechanism predicts: credit needs criteria specific enough to implicate particular steps.

The reading should remain qualified. The base model, hyperparameters, and training setup are controlled, but this is still a finite benchmark intervention. The result supports “specific criteria make step attribution more useful” rather than the universal claim that dynamic rubrics are always necessary.

### Figure 4: a moving reward target is informative and risky

![DRACO Figure 4: static and dynamic rubric pass rates over training](/paperReading/44-draco-dynamic-rubrics/paper/figure-4-rubric-passrate.svg)

*Figure 4, Section 4.4: static-rubric pass rate reaches the mid-90s and saturates after roughly 25 steps; dynamic settings stay lower but continue moving. The dotted curve re-scores DRACO rollouts on a held-out static rubric set. [Original Figure 4](https://arxiv.org/html/2609.04094v1#S4.F4) · [original image endpoint](https://arxiv.org/html/2609.04094v1/rubric_passrate.svg). The arXiv HTML marks the paper CC BY 4.0; this article retains attribution and uses a local copy of the SVG.*

Static criteria quickly approach a ceiling, so they stop distinguishing policy behavior. Dynamic criteria keep asking about failures the current policy has not yet stabilized. Re-scoring DRACO rollouts on the fixed static set reaches 91.3%, close to static runs, which supports the authors' interpretation that per-trajectory criteria subsume the useful static criteria. It does not mean lower dynamic pass rate is automatically better; it means the generator and dropout are still finding discriminative checks.

Figure 3 adds a failure-oriented view. Early training contains many length, turn, server-error, or no-action terminations; dynamic settings eventually submit answers more often, and credit clears some termination modes earlier. The caption separates termination mode from task correctness, so normal completion must not be read as success.

## Figure 10 and self-judging: cheaper does not mean validated

![DRACO Figure 10: per-rubric pass rate and the effect of step credit](/paperReading/44-draco-dynamic-rubrics/paper/figure-10-per-rubric-credit.svg)

*Figure 10, Appendix A: the aggregate static pass-rate curve is opened into individual criteria. Most of the 21 criteria reach ceiling early, while initially hard criteria such as “Protects secret values” show clearer per-criterion differences from credit. [Original Figure 10](https://arxiv.org/html/2609.04094v1#A1.F10) · [original image endpoint](https://arxiv.org/html/2609.04094v1/per_rubric_credit.svg). The arXiv HTML marks the paper CC BY 4.0; this article retains attribution and uses a local copy of the SVG.*

The judge is the pipeline's largest training cost. The authors replace the frontier judge with the policy model, enable thinking, and repeat scoring three times, counting a criterion as pass only when all three calls pass. For 100 training steps, judge cost drops from $1607 to $316, about 5.1×. Self-judge reaches 81.1/62.7 TN TGC/SGC, above the outcome-aware reference's 80.0/59.3, and reaches 21.1 tau-bench SR.

Appendix B makes this a trade-off rather than a free substitution. On 60,689 criterion verdicts, self-judge agrees with GPT-5.4 on 89.4%, versus 72.0% for a judge that always passes. The disagreement is strongly lenient: self-judge passes 30.4% of criteria GPT-5.4 failed, but fails only 1.3% of criteria GPT-5.4 passed. In generation and union, self-judge writes fewer criteria but keeps too many candidates in the merged set; its discriminative fraction is 31.3% versus 46.5%. Agreement is evidence of operational similarity, not human validity.

## Evidence map and the Paper Essence Contract

- **Directly supported by the paper:** the outcome-blind formulation; dynamic per-trajectory rubric generation, union, dropout, and scoring; Eq. 3–7; AppWorld and tau-bench protocols; Table 2 base, outcome-reward, ablation, and self-judge numbers; and Appendix E's conservation, sign preservation, and length-independence properties.
- **Author interpretation:** dynamic rubrics track evolving policy capability; step credit concentrates a coarse reward on the cited steps; the two components interact to produce the AppWorld gain; and a sufficiently consistent self-judge can lower cost.
- **Not established:** that criteria faithfully describe the task; that the judge agrees with humans; that `relevant_steps` are causal steps; how discriminative dropout changes training-time variance; or whether the method transfers to real, high-risk, cross-provider, or materially different domains.
- **Bloss0m engineering judgment:** if you have replayable trajectories, versioned judges, and observable process criteria, DRACO is a good controlled experiment for testing whether uniform credit is limiting RL. Without independent outcome checks and human audit, treat it as an auditable heuristic reward pipeline, not a correctness oracle.

The six contract answers are explicit in the draft:

1. **What problem is solved?** “Paper identity and the limitation it targets” defines verifier-free long-horizon training and the need to route reward to steps.
2. **Why is the previous approach insufficient?** “Core intuition” and “The GRPO baseline” show why uniform $A_i$ gives correct, irrelevant, and erroneous tokens the same push, while fixed rubrics saturate.
3. **What is the core technical idea?** Dynamic per-trajectory rubrics plus citation-conditioned, closed-form step credit.
4. **How does one input move through the method?** “A faithful worked example” follows verdicts, citations, $Q_j$, the winner branch, $w_j$, $a_j$, and conservation.
5. **Which evidence supports the headline claim?** “How to read the evidence” ties Table 2, outcome-reward comparison, four-way ablation, cost, and termination analysis to the claim.
6. **Where does the claim stop, and what follows operationally?** “Figure 10 and self-judging” and “Engineering decision” state that judge validity, attribution validity, variance, and transfer remain open; keep evidence versioned, calibrate the judge, and retain independent verifiers for risky tools.

## Artifacts and reproducibility (as of 2026-09-09)

The official [IBM/draco repository](https://github.com/IBM/draco) is reachable at the audited `main` HEAD `cfafd0f81f2c49aa36a4b25a2a7b6ac6e119f47b`. It is not archived and contains an Apache-2.0 `LICENSE`, `training/`, `evals/appworld/`, `evals/tau-bench/`, and `training/analysis/`. The README documents `training/setup.sh`, `training/launchers/run.sh`, run tags, the reward pipeline, credit assignment, self-judge, logging, and evaluation runbooks. This is a **usable source artifact for inspection**.

It is not a one-command reproduction bundle. The README says model weights and AppWorld data are outside the repository and must be placed under an external `WORKSPACE_ROOT`. Frontier-judge settings require an OpenAI-compatible `/v1/completions` endpoint, a model route, and a secret file. GPU and container environments, Weights & Biases, and benchmark environments are also external. tau-bench has its own environment and data requirements. Therefore the artifact status is: code **available**; data, weights, and judge endpoint **external or gated by the user's environment**; paper checkpoints and complete run logs **not found in the audited repository endpoint**.

A minimal reproduction path is conditional: pin the commit above; prepare the INSTALL/README model weights, AppWorld data, container, and the paper's eight-H100 scale; configure `WORKSPACE_ROOT/secrets/rubric_llm.env` for a compatible judge; run a smoke version of `dynamic_credit`; then follow `evals/appworld/RUNBOOK.md` and `evals/tau-bench/README.md`. Preserve rubric JSON, criterion verdicts, relevant steps, reward, checkpoint, seed, model and prompt versions, and evaluation outputs. If external weights, data, or judge access are missing, call it a pipeline smoke test, not a reproduction of the paper's numbers.

## Engineering decision and when not to use it

**Worth testing when:**

- The task has ten or more tool turns, a sparse or non-programmatic outcome signal, and process criteria that can be made observable and versioned.
- You want to distinguish “the policy cannot do this” from “the reward is too coarse.” Start with the four-way static/dynamic and with/without-credit ablation rather than trusting one DRACO run.
- You can retain raw trajectories, judge prompts, rubric sets, citations, and policy checkpoints, while using an independent verifier only at evaluation time.

**Do not apply directly when:**

- A reliable unit test already exists. Keep the verifier as the primary signal; use rubrics for process diagnostics or auxiliary reward.
- The tools can move money, permissions, or private data and there is no human review, policy constraint, or rollback. A systematically wrong judge can become the sole optimization target.
- Criteria overlap, step boundaries are unstable, or tool results cannot be aligned to a locatable turn. Apparent $Q_j$ precision will then hide attribution noise.
- You lack judge budget, version governance, or external-model access. Self-judging is cheaper, but the paper itself finds a lenient bias; agreement percentage is not equivalence.

A minimal adoption gate is three questions: Is there an independent outcome check? Can each rubric verdict be located at a step? Can you test judge validity, citation validity, cost, and distribution shift? A “no” does not forbid a research ablation, but it should prevent DRACO from becoming the production policy optimizer.

## Three things to remember

1. **Technical idea:** DRACO does not multiply a new reward across more tokens. It makes the rollout's rubric evidence decomposable, then redistributes the existing $A_i$ with a sign-preserving, length-normalized closed-form rule.
2. **Evidence:** AppWorld TN/TC, zero-shot tau-bench, the four-way ablation, cost, and termination analyses jointly support the usefulness of dynamic rubrics plus step credit; Figures 4 and 10 show why a moving criterion set matters.
3. **Boundary:** Conservation, sign, and length independence are mathematical guarantees, not judge-validity guarantees. Production adoption needs versioned evidence, independent outcome checks, judge calibration, and a control plane for irreversible actions.

## Primary sources

- [DRACO: Fine-Grained Credit Assignment with Dynamic Rubrics for Long-Horizon Agent Training (arXiv HTML, v1)](https://arxiv.org/html/2609.04094v1)
- [DRACO paper abstract and metadata (arXiv)](https://arxiv.org/abs/2609.04094)
- [IBM/draco official artifact](https://github.com/IBM/draco)
- [DRACO Apache License 2.0](https://github.com/IBM/draco/blob/main/LICENSE)
