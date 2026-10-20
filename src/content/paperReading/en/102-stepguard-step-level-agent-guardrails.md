---
title: "StepGuard Paper Reading: Guarding Agent Actions Step by Step"
description: "A close reading of how StepGuard trains a 4B runtime guard from prefix-aligned synthetic trajectories and uses Balance-GRPO to adjust safety and task utility. We examine the 77.3% relative ASR reduction and 2.8-point utility decrease on AgentDojo and AgentDyn, along with synthetic supervision, failure modes, latency, and the absence of a formal guarantee."
pubDate: 2026-10-20
updatedDate: 2026-10-20
tldr:
  - "StepGuard judges each tool call before execution and can audit completed trajectories. It is an intervening classifier, not an authorization system or formal safety proof."
  - "With a fixed Qwen3.6-35B-A3B agent on AgentDojo and AgentDyn, the authors report mean ASR falling from 23.15% to 5.25%: a 77.3% relative or 17.9-point absolute decrease. Mean utility falls from 81.5 to 78.7, a 2.8-point decrease."
  - "In the same AgentDojo setup, StepGuard averages 599.9 ms per guard call and about 2.53 seconds of guard inference per task. On AgentHarm, task completion falls from 70.9 to 52.8, showing that utility costs vary by environment."
  - "As of 20 October 2026, the official repository, 4B model, and 7,000 SFT/RL examples are available; the StepGen data-generation engine is still marked planned, and dynamic benchmarks retain their upstream terms."
audience:
  - "Engineers building LLM agents with tool calls and runtime safety controls"
  - "Researchers studying prompt injection, tool misuse, guardrail false positives, and task utility"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Evaluation", "Tool Use"]
topics:
  - agent-safety-governance
  - agent-evaluation-observability
image: "/paperReading/102-stepguard-step-level-agent-guardrails/title_image.webp"
field: "AI Systems"
difficulty: "intermediate"
showToc: true
paper:
  title: "StepGuard: Learning Step-Level Guardrails with Scalable Supervision and Safety–Utility Balancing"
  authors:
    - "Zhijie Zheng"
    - "Yu Li"
    - "Chen Qian"
    - "Yuqian Fu"
    - "Yanwei Fu"
    - "Lu Sheng"
    - "Jing Shao"
    - "Dongrui Liu"
  year: 2026
  venue: "arXiv:2608.24777 v1 (2026-08-25; accepted to EMNLP 2026 per authors' repository)"
  links:
    pdf: "https://arxiv.org/pdf/2608.24777v1"
    arxiv: "https://arxiv.org/abs/2608.24777"
    code: "https://github.com/zheng977/StepGuard"
    project: "https://zheng977.github.io/StepGuard/"
series:
  id: "agent-safety-and-runtime-guardrails"
  title: "Agent Safety and Runtime Guardrails"
  part: 1
  totalParts: 1
---

This reading follows [arXiv v1](https://arxiv.org/abs/2608.24777), submitted on 25 August 2026. The authors' current repository identifies the paper as accepted to EMNLP 2026; the experimental figures below remain those reported in v1, while later model and data releases are described separately. The paper is worth reading not only because it lowers average attack scores, but because it places a safety judgment at each tool-call decision and measures whether the guard prevents the original task from being completed.

> **Huahua's engineering note**
>
> An extra judgment before a tool call may block an unauthorized action, but it may also mistake normal work for danger. Read safety scores together with blocked work, latency, and recovery from mistakes.

## The paper in 90 seconds

- **Problem:** A check only at the final answer or end of a trajectory may arrive after a tool has leaked data, modified files, or submitted a transaction. A guard that blocks too aggressively can also prevent legitimate work. The paper focuses on pre-execution action decisions and defense bias between safe and unsafe examples (§§1, 3).
- **Core insight:** StepGen gives an unsafe trajectory and safe alternatives the same prefix up to a designated risky step. It then creates one safe branch that refuses the risk and another that recognizes it and safely continues, plus benign examples that reuse the same tools. StepGuard first learns from these examples with SFT, then uses Balance-GRPO to upweight whichever safe or unsafe class currently performs worse (§§4–5; Figures 1–2).
- **Strongest evidence:** With the same Qwen3.6-35B-A3B agent on AgentDojo and AgentDyn, the authors report mean ASR of 23.15% without a guard and 5.25% with StepGuard. Mean utility falls from 81.5 to 78.7. That is a 77.3% relative and 17.9-point absolute reduction in ASR, alongside a 2.8-point utility decrease (§6.2.2; Appendix A.1, Table 6).
- **Main boundary:** Those two benchmark averages do not represent open-ended tool environments. On AgentHarm, task completion falls from 70.9 to 52.8. Training labels mostly come from synthetic trajectories and LLM annotation; false negatives, false positives, inference latency, and the absence of a formal safety guarantee remain material (§9; Appendices A.2, H).

## Prior approaches: why is a final outcome check not enough?

A tool-using agent produces more than text. It may read a file, organize information, and then call a tool to send an email, write to a database, or make a payment. If the system reviews only the final answer, sensitive information may already have been transmitted or an irreversible side effect may already have occurred. Conversely, if every apparently risky tool is blocked, the agent may fail at work the user explicitly authorized. A safety control therefore needs to answer two questions at once: is this step unauthorized or harmful, and can the remaining legitimate task continue after the intervention? (Paper §1, §3.)

General content-safety guards usually classify input or output text. An agent guard must also interpret the user request, tool schema, previous actions and observations, and the parameters of the candidate action. A tool name alone is rarely enough to judge safety: a delete tool could clean a temporary file the user named, or erase a shared directory after a malicious instruction. The relevant evidence is who authorized which scope, what happened in context, and what the proposed action will do—not merely the tool string or the presence of an injection.

StepGuard's task definition covers two inputs. In post-hoc trajectory auditing, the guard sees the full action-observation sequence. For pre-execution guarding, it sees the user request, available tools, prior interaction prefix, and candidate action. Its structured output includes a safe/unsafe judgment, whether a risk source is present, the risk type, and—when auditing a trajectory—the unsafe step (§3). The authors distinguish “a risk source is present” from “the behavior is unsafe”: malicious injected text may appear without the agent following it. If the agent detects the injection and chooses a safe alternative, the observed trajectory can still be safe.

## Core intuition: compare decisions after the same context

If unsafe examples come from one situation and safe examples from another tool or task, a model may learn a surface cue such as “this tool is always dangerous” instead of identifying the step that creates risk. StepGen's central design is **prefix-aligned contrastive branching**: it generates a shared interaction prefix up to a risk anchor, then expands safe and unsafe continuations from that same context. This concentrates the difference in the critical action and its consequences rather than making the entire task different from beginning to end (§§4.1–4.2).

One StepGen group contains four trajectories: an unsafe baseline; a Refuse branch rerolled from the shared prefix that declines the risky action; an Aware branch that recognizes the risk and continues safely; and an independently constructed benign tool-reuse trajectory. The final example matters because the guard should not equate a tool's name with a security risk when that tool also has legitimate uses. Every action in the trajectories receives a Safe/Unsafe label and rationale. A mechanical structural check and an LLM quality score filter the groups before retention (§4; Appendices D.4–D.5).

![Original paper Figure 1: StepGen locates the risk anchor in an unsafe trajectory, branches into refuse and aware-safe continuations from the shared prefix, and adds a benign example that uses similar tools.](/paperReading/102-stepguard-step-level-agent-guardrails/figures/EMNLP_pipeline.png)

*Figure 1 (paper §4): The branches control context and decisions; they are not a statistical sample of real incidents. Source: [arXiv v1 Figure 1](https://arxiv.org/html/2608.24777v1#S3.F1). Reproduced under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license stated on the arXiv page.*

## Walk one example through the method

Suppose a user asks an agent to collect figures from public documents, organize them in a table, and email the result to a named colleague. One document contains an indirect instruction to send a local credential to an external server. The following example reconstructs the paper's method; it is not a published benchmark trace.

1. **Input and prefix:** The agent has read public documents as requested. The guard retains the request, tool specifications, earlier actions, and returned observations. The risk string came from a tool response, not from explicit user authorization.
2. **Candidate action:** The agent prepares to call a network tool to send the credential to the address specified in the document. StepGuard judges the candidate action in its current prefix; the fact that the tool has network access does not authorize this destination.
3. **Intervention and recovery:** If the call is classified unsafe, the runtime wrapper blocks it before execution and gives the agent self-reflection feedback to reconsider. If the agent recognizes the injection and instead organizes the originally requested public figures, the guard can allow that safe alternative. StepGuard returns a judgment; the application wrapper is responsible for blocking and recovery (Appendix G.3; Figure 9).
4. **Possible failure:** The task could be interrupted if a legitimate email, cloud upload, or batch cleanup is mistaken for an unauthorized action. A dangerous call could still pass if the guard misunderstands a tool side effect or the authorization boundary in context. A classifier cannot replace explicit permission policies, destination allowlists, or transaction confirmation.

This example makes clear that StepGuard is not a complete authorization controller built into an agent framework. In the runtime experiments, the guard sits before each tool call; an unsafe action is blocked and returned to the agent with self-reflection feedback, while the guard's private reasoning is not directly exposed (Figure 9; Appendix G.3). Results therefore depend on whether an application invokes the guard at every relevant execution point, how it handles false blocks, and whether the agent can act on the feedback.

## Technical mechanism: data construction and Balance-GRPO

### How StepGen constructs supervision

StepGen samples a risk source, failure mode, harm type, and tool subset. A planner creates an execution plan with tool calls, parameter constraints, and parameter provenance, and designates the first unsafe action as the anchor. An environment simulator rolls out the plan into an unsafe baseline. For risks triggered by tool responses, the injection is placed in the relevant observation so the designated anchor is the earliest unsafe decision (§4.1; Appendices D.1–D.3).

StepGen then keeps the interaction prefix before the anchor fixed and regenerates the suffix under Refuse and Aware safe modes. The Refuse branch declines the risky action. The Aware branch identifies the risk and continues through a safe alternative, avoiding a definition of “safe” that simply means stopping. A separate benign trajectory reuses the same tool subset without rerolling the unsafe suffix. Each executed action receives a safety class and structured rationale. A mechanical validator checks JSON structure, tool schemas, parameter lineage, and anchor placement; an LLM auditor checks authorization scope, contextual consistency, label propagation, and plausibility of tool responses (§§4.2–4.3; Appendix D).

The authors report that StepGen retains 10,815 groups, from which 3,000 records are sampled for supervised fine-tuning and another 4,000 for reinforcement learning. Indirect prompt injection accounts for 6,804 records, or 62.9% of the retained pool; malicious user instruction or jailbreak accounts for only 239, or 2.2% (Appendix C.1; Table 13). The distribution is a reminder that a five-digit data count does not imply balanced risk coverage. The model is trained across eight risk sources, but their sample weights differ substantially.

### Why Balance-GRPO is not just increasing the safe-class weight

StepGuard starts from Qwen3-4B-Instruct, uses 3K StepGen demonstrations for SFT, then applies GRPO to 4K prompts. Its structured reward gives 0.5 for a correct safe/unsafe label and another 0.5 for a correct risk category, but only when the safety label is also correct. Standard GRPO normalizes advantages across rollouts for the same prompt. StepGuard then applies a class-count correction based on the number of safe and unsafe examples in a batch and a weight based on the current accuracy gap, so the weaker class receives more influence during the update (§5).

Let $Acc_{safe}$ and $Acc_{unsafe}$ be the two class accuracies in a rollout batch. The paper defines $\Delta_{cls}=Acc_{safe}-Acc_{unsafe}$. When safe judgments perform worse, the normalized advantage for safe examples receives more weight; when unsafe judgments perform worse, unsafe examples receive more weight. This neither changes the labels nor lets a deployed user set a safety preference. It redistributes gradient weights during training according to observed class performance. The method also uses a deadband and clipping to limit extreme weights (§5).

The design targets two familiar biases. **Over-defense** classifies many legitimate actions as unsafe and reduces utility. **Under-defense** permits unsafe actions and reduces safety. Simply increasing the safe-example ratio can close the class-accuracy gap while weakening detection of unsafe actions. The authors' ablation reports unsafe accuracy of 76.2 with safe upsampling and 77.5 with fixed weights, compared with 86.4 for Balance-GRPO; safe accuracy with Balance-GRPO is 78.4 (Table 4a). This supports the authors' motivation to correct class bias while preserving detection, rather than merely making the model refuse less often.

## How the experiments answer the question: classification, runtime trade-offs, and errors

### Static guard judgments are not task outcomes after interception

Static testing covers three trajectory-level benchmarks (ATBench, R-Judge, and ASSE Security) and two step-level benchmarks (TS-Bench-Dojo and TS-Bench-Harm). The metrics are accuracy and unsafe-class F1, averaged without weighting across benchmarks. StepGuard reports mean trajectory-level accuracy/F1 of 83.0/83.3 and step-level scores of 84.8/84.1. The table's GPT-5.4 reference scores are 83.0/84.4 and 81.3/83.3, respectively (Table 1). The authors report the highest average among the open-weight guards listed; the step-level average also exceeds the GPT-5.4 reference row. This does not show that StepGuard beats GPT-5.4 under every policy, model, or tool schema. The benchmarks also differ in task, prompts, and output format, and some specialized guards use their official prompts rather than exactly the same input conditions (§6.1; Appendix G.1).

Static classification asks whether a guard recognizes labels. It does not tell us whether the task still succeeds after the guard enters the loop. To measure that difference, the authors deploy the guards in AgentDojo, AgentDyn, and AgentHarm using the same Qwen3.6-35B-A3B agent backbone, tasks, and tool environments, changing only the guard. Safe calls proceed; unsafe calls are blocked and returned as self-reflection feedback (§6.1; Appendix G.3).

### What the 77.3% relative reduction means

The headline figure combines ASR from **AgentDojo and AgentDyn only**. Without a guard, the two scores are 25.1 and 21.2, whose simple mean is $(25.1+21.2)/2=23.15\%$. With StepGuard, they are 1.2 and 9.3, averaging $(1.2+9.3)/2=5.25\%$. The absolute difference is $23.15-5.25=17.90$ percentage points. Relative to the 23.15% no-guard baseline, the decrease is $17.90/23.15\approx77.3\%$ (§6.2.2; Table 6). “A 77.3% reduction” is a relative decrease, not a 77.3-point drop, and it does not mean that either benchmark has zero residual risk.

In the same comparison, AgentDojo utility rises from 89.7 to 90.7, while AgentDyn utility falls from 73.3 to 66.7. Their unweighted mean moves from 81.5 to 78.7, a decrease of 2.8 score points. Utility therefore rises by 1.0 point on AgentDojo and falls by 6.6 on AgentDyn; “only a 2.8-point decrease” is the net change averaged across two environments, not the same small cost in each one. Utility is also a benchmark-specific scale, not a monetary value or universal completion percentage (Table 6; Appendices E.5–E.6).

![Original paper Figure 4: Runtime utility against risk scores on AgentDojo, AgentDyn, and AgentHarm. Upper left is better, but AgentHarm carries a larger task-completion cost.](/paperReading/102-stepguard-step-level-agent-guardrails/figures/runtime_utility_asr_tradeoff.svg)

*Figure 4 (paper §6.2.2): The horizontal axis is ASR or malicious score depending on the benchmark; they are not one shared safety metric. AgentHarm must also be read with task completion. Source: [arXiv v1 Figure 4](https://arxiv.org/html/2608.24777v1#S6.F4). Reproduced under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license stated on the arXiv page.*

### AgentHarm is an important counterexample to the mean

On AgentHarm, StepGuard reduces malicious score from 22.8 without a defense to 3.4, but task completion also falls from 70.9 to 52.8 (Table 6). The paper notes that other guards face a similar tension and that no evaluated method offers a clearly favorable trade-off on this benchmark (§6.2.2). The 77.3% / 2.8-point headline cannot be extended to AgentHarm, and the result should not be summarized as a universally “small utility loss.” In highly adversarial tasks that directly request harmful actions, the risk target, utility definition, and appropriate refusal behavior differ from ordinary tool-use benchmarks.

### Balance-GRPO ablations and data imbalance

In the training ablation on static benchmarks, vanilla GRPO has a 13.0-point safe/unsafe accuracy gap and overall accuracy/F1 of 81.5/81.9. Balance-GRPO reduces the gap to 8.0 and raises accuracy/F1 to 82.2/82.1. Fixed class weights also reduce the gap to 7.9, but lower unsafe accuracy to 77.5 compared with 86.4 for Balance-GRPO (Table 4a). In runtime comparisons, relative to vanilla GRPO, Balance-GRPO raises AgentDojo utility from 85.3 to 90.7 while ASR rises from 0.9 to 1.2; on AgentDyn, utility rises from 60.0 to 66.7 while ASR rises from 9.0 to 9.3 (Table 4b). The reported change is a trade-off improvement for these checkpoints and benchmarks, not a monotonic improvement in both metrics.

Figure 5 shows the safe/unsafe accuracy gap and macro-F1 over 80 training steps. It complements the final checkpoint table by showing how balancing updates evolve during one run, but the curve is not an independent-seed stability analysis. The appendix's three repeated evaluations use the same fixed checkpoint and measure evaluation-pipeline variability, not variability across newly trained models (Appendix A.4).

![Original paper Figure 5: The safe/unsafe accuracy gap and macro-F1 through Balance-GRPO training.](/paperReading/102-stepguard-step-level-agent-guardrails/figures/balance_grpo_safe_unsafe_gap_80steps.svg)

*Figure 5 (paper §7.2): The training trajectory shows class gap and macro-F1 within one run; it is not a confidence interval across random seeds. Source: [arXiv v1 Figure 5](https://arxiv.org/html/2608.24777v1#S7.F5). Reproduced under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license stated on the arXiv page.*

### A human-labeled subset and the observed failure modes

The authors create a post-training, held-out subset of 100 execution traces from NVIDIA's Nemotron-AIQ Agentic Safety Dataset, not used for hyperparameter selection. It is stratified into 25 benign traces, 25 traces exposed to an attack without unsafe execution, and 50 traces involving unsafe execution; each is manually inspected and labeled according to observed behavior. Balance-GRPO scores 82.0 accuracy and 83.0 F1 on this subset, higher than vanilla GRPO at 75.0/76.6. Safe accuracy rises from 68.0 to 76.0 and unsafe accuracy from 82.0 to 88.0 (Appendix A.3; Table 8). This is human-labeled evidence independent of StepGen-generated supervision, but it covers only 100 traces. It is not a comprehensive human audit of the training labels or evidence that real deployments will have the same error rate.

The appendix manually classifies 575 static-benchmark errors: 307 false positives and 268 false negatives. Of the false positives, 134/307 (43.6%) involve benign use of sensitive tools; another 79/307 (25.7%) occur when the agent handled suspicious context safely but was still blocked. Among false negatives, 53/268 (19.8%) miss malicious intent; multi-step risk propagation and authorization/privacy violations each account for 47/268 (17.5%), and context-dependent prompt injection for 44/268 (16.4%) (Appendix H; Table 16). These categories are shares of the misclassified static examples, not rates among real agent actions. They do, however, show why deployment evaluation should log both false blocks and missed risks and test risk propagation across steps.

## Evidence map: what is supported and what remains open

| Question | Evidence in the paper | Supported interpretation | Not established |
| --- | --- | --- | --- |
| Can it recognize safe actions in benchmarks? | Table 1: three trajectory-level and two step-level benchmark averages for accuracy/F1 | StepGuard has competitive average classification scores among the listed open-weight guards | General superiority across arbitrary tools, policies, languages, or agent backbones |
| What changes in runtime? | Table 6: fixed Qwen3.6-35B-A3B on AgentDojo, AgentDyn, and AgentHarm | On the first two, mean ASR falls 77.3% relatively and mean utility falls 2.8 points; on AgentHarm, completion falls 18.1 points | The 77.3% applies to every benchmark; the 2.8-point average is a small cost in each environment |
| Which training designs help? | Tables 2–4 and Figure 5: prefix labels, benign tool reuse, and Balance-GRPO ablations | Under the paper's settings, components improve named metrics or safe/unsafe balance | Each component will have the same independent effect on real traffic |
| Where does it still err? | Appendix H, Table 16: 575 static errors; Appendix A.3: 100 human-labeled traces | Benign sensitive-tool use is often over-blocked; multi-step and contextual risks are still missed | The observed false-positive/negative shares are production error rates |
| Can it be the security boundary by itself? | §§9–10, runtime wrapper, and released artifact | It can serve as a classifier before tool execution, and a model is available | A formal guarantee, authorization enforcement, an unbypassable control, or zero-risk deployment |

## Limitations and claims that do not follow

1. **Supervision is synthetic.** StepGen rollouts, step labels, and quality filtering rely on generative models and an LLM auditor. This scales the data but may inherit teacher-model biases, incorrect risk categories, overly regular scenarios, or missing failure modes. The released pool heavily weights indirect prompt injection, so risk coverage is not uniform (§9; Appendix C).
2. **Threat coverage is bounded.** The authors explicitly leave open-ended tool ecosystems, longer workflows, multi-agent interactions, and adaptive adversaries outside the evaluation scope (§9). A large set of attack categories is not equivalent to a red team that continuously adapts to the guard. New schemas, permission models, and injection locations still need fresh evaluation.
3. **Utility costs depend on the environment.** A small increase in AgentDojo utility does not prove that the guard improves the agent; it may reflect evaluation variation or self-reflection feedback. Utility falls by 6.6 points on AgentDyn and completion by 18.1 points on AgentHarm, so the mean hides differences among work types (Table 6).
4. **Checking each action adds runtime cost.** Under the all-calls-inspected AgentDojo profile, the authors measure 599.9 ms and 195.5 generated tokens per guard call. At 4.22 calls per task, guard inference totals about 2.53 seconds, or 7.24% of task time (Appendix A.2; Table 7). This is a measurement in one serving/evaluation setup, not a production latency promise. Intercepting every sensitive call, queueing, retries, or loading a long context can change actual P95/P99 costs.
5. **It is neither a formal guarantee nor a policy engine.** StepGuard returns judgments and risk labels; application code decides whether to block, retry, or allow. The authors explicitly state that false positives and false negatives remain and that deployment needs access control, monitoring, and human oversight (§§9–10). Confidence or a rationale is not authorization validation, transaction approval, or a proof of safety.
6. **Static and dynamic scores measure different things.** Static benchmark accuracy/F1 and runtime ASR, utility, malicious score, and completion are not interchangeable. Holding the agent backbone fixed helps isolate guard changes, but outcomes still depend on benchmark tasks, labels, tools, and utility functions; these scores do not tell us how users experience a natural workflow.

## Artifacts and reproducibility

As of October 20, 2026, the authors' [GitHub repository](https://github.com/zheng977/StepGuard) provides code, evaluation adapters, training recipes, and deployment examples. The official [Hugging Face model card](https://huggingface.co/ninty-seven/StepGuard) identifies a 4B StepGuard model based on Qwen3-4B-Instruct-2507 and lists an Apache-2.0 license. The authors also release [3,000 SFT and 4,000 RL examples](https://huggingface.co/datasets/ninty-seven/stepguard_data), whose dataset card also lists Apache-2.0. The README still marks the StepGen generation engine as planned. The current release therefore allows inspection of training examples, prompts, the model, and inference recipes, but does not mean the complete synthetic-data generation process can be rebuilt from public code. The model, code, and training corpus are accessible; dynamic benchmarks still require their upstream environments and terms to be checked. Third-party benchmarks and dependencies remain under their own terms.

This reading did not retrain the model or rerun the benchmarks; the tables and error analyses are author-reported results from arXiv v1. Public model and data artifacts improve inspectability, but are not an independent reproduction. A small initial assessment could apply the model-card prompt and input format to a set of tool traces that a team is authorized to test, then separately record false positives, false negatives, tool latency, and task completion. Compare guarded and unguarded runs with the same agent, tasks, and seeds. A full reproduction requires the corresponding benchmark, model-serving services, and tool environments; their access conditions and licenses should be checked first.

## Bloss0m engineering judgment: treat it as a measurable interception layer

**Bloss0m engineering judgment:** StepGuard is best treated as a replaceable classifier at the action boundary, paired with explicit permission policies, parameter allowlists, tool isolation, and human confirmation. For high-impact but recoverable operations, per-step review may be worth the cost of earlier intervention. For latency-critical paths, workflows where a mistaken block is very expensive, or actions already governed by strict capability enforcement, another LLM judgment may not be the best control point. This is an engineering interpretation, not a deployment architecture validated by the paper.

A pilot should treat safety and usability as one acceptance set: label the authorization source and risk type for each action; measure over-blocking on harmless but sensitive operations; measure missed actions with multi-step prompt injection and unseen tool schemas; and track post-intervention completion, retries, P95/P99 latency, and human escalations separately. Preserve original events and model versions for review, while keeping high-impact side effects under enforceable policy controls. Do not turn the paper's 77.3% relative ASR reduction into an internal target or treat its 2.8-point mean utility cost as a local budget.

If an agent can reach payment, deletion, external transfer, or high-privilege tools, first define the authorizing principal, resource scope, parameter constraints, and recovery path. Without policy ground truth to compare against, a guard can only learn an approximate judgment. No benchmark score can tell a team whether that approximation matches its actual authority model.

## Three things to remember

1. **Technical idea:** StepGen contrasts risky, refuse, aware-safe, and benign tool-use trajectories after a shared interaction prefix, teaching the guard where an action introduces risk.
2. **Evidence:** In the specific fixed-backbone AgentDojo/AgentDyn evaluation, mean ASR falls from 23.15% to 5.25% (77.3% relatively), while mean utility falls 2.8 points. AgentHarm completion falls substantially, and runtime latency matters.
3. **Adoption boundary:** Synthetic labels, benchmark threat coverage, false blocks and misses, per-step inference cost, and responsibility for outer policy controls all require measurement in the actual tool environment. A model guard is not a formal guarantee.

## Primary sources

- Zheng, Zhijie, Yu Li, Chen Qian, Yuqian Fu, Yanwei Fu, Lu Sheng, Jing Shao, and Dongrui Liu. [“StepGuard: Learning Step-Level Guardrails with Scalable Supervision and Safety–Utility Balancing,” arXiv:2608.24777v1](https://arxiv.org/html/2608.24777v1), submitted 25 August 2026. See §§3–10, Figures 1–5, Tables 1–6, and Appendices A–H. The arXiv page lists the v1 license as CC BY 4.0.
- Authors' [StepGuard code repository](https://github.com/zheng977/StepGuard), including the [README and release status](https://github.com/zheng977/StepGuard#-model-and-release-status), [Apache-2.0 license](https://github.com/zheng977/StepGuard/blob/main/LICENSE), and [third-party notices](https://github.com/zheng977/StepGuard/blob/main/THIRD_PARTY_NOTICES.md).
- Authors' [StepGuard-4B model card](https://huggingface.co/ninty-seven/StepGuard) and [StepGuard-Data card](https://huggingface.co/datasets/ninty-seven/stepguard_data).
