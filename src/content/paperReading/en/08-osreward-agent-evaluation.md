---
title: "OSReward Deep Read: Why Agent Success Cannot Be Judged by Another Model Alone"
description: "A complete reading of OSReward's data construction, 27 VLM judges, Hard and Multi subsets, error and cost analyses, OS-Shepherd-100K training, and a deployable hybrid verification architecture."
pubDate: 2026-08-02
updatedDate: 2026-08-02
tldr:
  - "OSReward shows that mainstream VLM judges often label incomplete tasks as successful; even the strongest models reach only about 70% accuracy on the hard set."
  - "The 1,019 gold trajectories go through three independent labels, disagreement meta-review, and Hard-set re-verification; data quality is itself a central contribution."
  - "More reasoning, sampling, or multi-judge voting helps only marginally, while reliable frontier judges are too expensive for large-scale RL."
  - "Agent evaluation should verify environment state first, use a model judge for semantic quality, and escalate conflicting evidence to a human or stronger verifier."
audience:
  - "AI engineers building agent evaluation harnesses, computer-use agents, or reward pipelines."
  - "Technical leads deciding whether LLM-as-a-Judge is suitable for production quality gates."
tags: ["Paper Reading", "AI Agent", "Evaluation", "Computer Use", "LLM-as-a-Judge", "Reward Model"]
image: "/paperReading/08-osreward-agent-evaluation/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
paper:
  title: "OSReward: Instituting Standardized Evaluation for Cross-Platform Computer-Use Reward Models"
  authors:
    - "Qiushi Sun"
    - "Kanzhi Cheng"
    - "Yian Wang"
    - "Bowen Yang"
    - "Hang Yan"
    - "Liheng Chen"
    - "Fangzhi Xu"
    - "Zichen Ding"
    - "Nuo Chen"
    - "Jialin Cao"
    - "Xingdong Gong"
    - "Zehao Li"
    - "Kaiming Jin"
    - "Xinfeng Yuan"
    - "Zhoumianze Liu"
    - "Jingyang Gong"
    - "Zhangyue Yin"
    - "Jiahui Gao"
    - "Zhiyong Wu"
    - "Tianbao Xie"
    - "Jianbing Zhang"
    - "Ben Kao"
    - "Lingpeng Kong"
  year: 2026
  venue: "arXiv 2607.28609 v1 (work in progress)"
  links:
    pdf: "https://arxiv.org/pdf/2607.28609v1"
    arxiv: "https://arxiv.org/abs/2607.28609"
    project: "https://os-copilot.github.io/OSReward-Home/"
series:
  id: "agent-evaluation"
  title: "Agent Evaluation"
  part: 1
  totalParts: 1
---

When an agent says “task completed,” what exactly are we trusting? Its completion narrative, the final screenshot, or a concrete change in the environment? LLM-as-a-Judge is common for text responses, but a Computer-Use Agent produces a long trajectory containing screens, actions, reasoning, and external side effects. Asking another model to judge that trajectory is convenient and scalable, yet it can also turn an execution error into a positive reward.

[OSReward](https://arxiv.org/abs/2607.28609) measures this failure directly. The authors construct a human-gold benchmark across web, mobile, Windows, and Ubuntu, evaluate 27 VLM judges, and train OS-Shepherd to identify failures more reliably. Its most useful engineering lesson is not “switch to a stronger judge.” It is that **success needs an evidence hierarchy, and model judgment should be only one layer.**

> **Huahua's engineering note**
>
> An agent's claim of completion is an observation, not proof. If a result can be checked through database state, file contents, tests, or API responses, use a deterministic verifier first and reserve a model judge for semantic quality.

### Paper status and research question

As of August 2, 2026, this is **arXiv v1 and explicitly marked work in progress**. It must not be described as a peer-reviewed result. The paper asks whether VLM judgments of CUA trajectories are reliable, where their errors concentrate, and whether open data plus a specialized reward model can improve the accuracy–cost trade-off.

The method has four stages:

1. Build cross-platform environments containing real applications, websites, files, seeded state, and distractors.
2. Run several agent families on human-screened tasks to collect genuine successes and failures.
3. Have three annotators judge each trajectory independently, escalating disagreements to two senior reviewers for joint meta-review.
4. Evaluate 27 judges against the gold verdicts, identify shared failure modes, and build OS-Shepherd-100K plus 9B and 35B reward models.

The gold rule is deliberately strict: if the agent did not obtain or verify an answer through the environment, the run fails even when the answer happens to be correct. That standard is much closer to the accountability boundary of a deployed agent than “the final answer looks plausible.”

### From 1,500 instructions to 1,019 gold trajectories

OSReward does not merely rescore rollouts from an existing benchmark. It rebuilds the environment, tasks, execution, and labeling pipeline. In **§3.1–§3.3, Appendix A, and Appendix B.2**, each platform has distinct infrastructure: isolated Chromium sessions and selected self-hosted mirrors for web; roughly 20 everyday and professional Windows applications; about 30 Ubuntu applications plus roughly 20 real file types; and an Android emulator seeded with accounts, records, photos, and distractors. Success therefore has to correspond to a meaningful state change rather than a plausible answer string.

The data funnel is:

1. Annotators author roughly 1,500 grounded instructions; peer screening admits about 800 to collection.
2. One to three agents execute each instruction, with Claude, Gemini, Kimi, and Qwen backbones. An automatic pre-filter removes environment failures, persistent anti-bot blocks, and frozen runs.
3. The remaining 1,128 trajectories receive three independent labels. Seventy-five percent are unanimous, pairwise agreement is 83.3%, and Krippendorff's $\alpha=0.797$.
4. The 282 disputed cases go to joint meta-review by two senior reviewers. Another 109 trajectories are discarded for residual quality problems instead of being forced into a label.
5. The final set contains 1,019 gold trajectories: 440 successes and 579 failures. A separate Hard-set review examines 373 candidates, retains 284, and corrects 18 mistaken success/fail labels along the way.

This funnel matters because the paper does not assume human labels are perfect. It treats disagreement as a signal to resolve and, eventually, as raw material for the challenge set. OSReward-Hard is therefore not an arbitrary “difficult” sample; it consists largely of cases that divided trained humans and then survived additional review.

![OSReward Figure 3: raw trajectories pass through independent annotation and meta-review into OSReward, Hard, and Multi](/paperReading/08-osreward-agent-evaluation/figure-3-annotation-pipeline.png)

*Figure 3 | OSReward's annotation and re-review pipeline. Source: [Sun et al., OSReward Figure 3](https://arxiv.org/html/2607.28609v1#S3.F3), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*

### What does the judge actually see? The evaluation protocol

Under the common protocol in **§4.1 and Appendix C.2**, every judge receives the task instruction, the last $N=5$ states or screenshots, and the corresponding reasoning and action text. Decoding is greedy. The judge has no task-specific tool, live-environment access, step-level supervision, or deterministic verifier. It emits a short justification and success/fail verdict; OSReward-Multi additionally asks for alignment and efficiency.

Table 1 therefore measures inference from a compressed trajectory record, not re-execution or direct inspection of files and databases. That protocol matches offline trajectory curation, but it narrows the conclusion: the paper establishes the unreliability of VLM autoraters, not the unreliability of live-state verification.

The metrics must be read separately:

- **Accuracy**: overall verdict correctness.
- **Success recall (sRec)**: the share of true successes accepted; low values indicate excessive strictness.
- **Fail recall (fRec)**: the share of true failures caught; low values indicate excessive leniency.
- **Balanced accuracy**: $(\mathrm{sRec}+\mathrm{fRec})/2$, preventing the 43/57 full-set mix or 30/70 Hard-set mix from hiding directional bias.

Accuracy alone would make an always-fail classifier look roughly 70% accurate on the Hard set. The real diagnostic is therefore recall direction and error composition.

### Figure 3 and Figure 4: Why trust the gold labels?

In **Figure 3** and §3.3, every trajectory that survives preprocessing receives three independent labels. Unanimous cases are finalized directly; disagreements are not reduced to a majority vote but go to joint meta-review by two senior reviewers. Annotation, meta-review, and hard-set re-verification reportedly required about 800 human-hours.

**Figure 4** summarizes 1,019 trajectories across four platforms, with a roughly 43%/57% success/failure split and runs as long as 100 steps. Reasoning-and-planning errors appear in 86% of failed trajectories. Failed runs are also substantially longer, making the task sequence-level evidence integration rather than simple screenshot classification.

OSReward-Hard selects 284 genuinely ambiguous trajectories and shifts the mix to roughly 30% success and 70% failure. Most were cases on which human annotators had initially disagreed: some failed runs read like confident completions, while some successful runs use unusual paths.

### Table 1: Nearly 90% on the full set, about 70% on the hard set

The full-set numbers in **Table 1** initially look reassuring: Claude-Opus-4-8 reaches 89.7%, while GPT-5.5 and Claude-Opus-4-6 each reach 89.5%. On OSReward-Hard, however, they fall to 69.7%, 67.3%, and 67.3%. The authors therefore use the hard set as the primary diagnostic instead of relying on the easier aggregate.

The split between success recall and failure recall matters even more. Qwen3-VL-8B, for example, has 99.8% success recall but only 59.9% failure recall on the full set; on the hard set, failure recall falls to 8.2%. If such a judge supplies reinforcement-learning rewards, it does not merely miss occasional failures—it systematically rewards false success.

This is OSReward's central finding: judges share a **leniency bias**. When the textual trajectory confidently narrates completion, the judge tends to follow the story without adequately verifying the screen or final environment state.

### Figure 5 and Figure 6: Errors concentrate in false success

**Figure 5** places each judge in the $(\mathrm{fRec},\mathrm{sRec})$ plane. Most models occupy the lenient region with high sRec and low fRec. A few, including GPT-5.2 and Claude-Haiku, are stricter but reject more true successes. The strongest judges sit near the diagonal, showing that balance matters more than a single accuracy rank.

![OSReward Figure 5: success recall versus fail recall for judges on the full and Hard sets](/paperReading/08-osreward-agent-evaluation/figure-5-judge-bias.png)

*Figure 5 | Judges in the strict–lenient plane; most become even more lenient on the Hard set. Source: [Sun et al., OSReward Figure 5](https://arxiv.org/html/2607.28609v1#S4.F5), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*

The authors then categorize every wrong verdict with a strong VLM and human re-checking, producing the six-part taxonomy in **Figure 6**:

| Direction | Error type | What did the judge miss? |
| --- | --- | --- |
| Over-accept | task incomplete | The agent stops short, then narrates completion |
| Over-accept | wrong action | The target or operation is wrong, although the trace looks plausible |
| Over-accept | error suppressed | A mid-run error leaves no trace in the final screen or closing narrative |
| Over-reject | strict on path | An unexpected but successful route is treated as failure |
| Over-reject | strict on deviation | Detours or redundant actions are mistaken for non-completion |
| Over-reject | ambiguous completion | The final evidence does not visibly confirm a real success |

Accepting an incomplete task accounts for roughly two-thirds of all errors and is the largest category for every judge family, representing at least 48% of each model's mistakes. Over-accepts outnumber over-rejects roughly three to one overall and still about two to one among the strongest judges. Failure recall is therefore not a secondary metric; it is the core reward-safety metric because false success directly reinforces incorrect behavior.

### Figure 8: Is the judge reading the screen or the agent's story?

The ablations in §5 sharpen the diagnosis. Changing the number of trailing screenshots or removing the click marker moves aggregate accuracy by less than 0.5 percentage point. Yet these apparently harmless visual changes still flip 5–7% of individual verdicts, which is substantial label noise when each verdict becomes a training reward.

By contrast, **Figure 8** shows that removing per-step thought and action text costs 7.2 pp on average and flips 22.7% of verdicts. Removing only chain-of-thought while keeping actions is milder: a 1.8 pp loss with 11.6% flipped. Action history carries real evidence, but it also creates a vulnerability: a judge may trust what the agent says it did more than whether the environment actually changed.

### §5.3–§5.4: Why more thinking and more votes are not enough

The paper tests the most obvious inference-time remedies:

- **Higher reasoning effort** adds several points for weaker judges, but the gain shrinks toward the frontier; GPT-5.5 also improves only modestly as effort rises.
- **Sampling and self-consistency** do not stabilize individual labels. Re-running the same judge on the same input at $T=0.7$ flips 6–9% of verdicts even when aggregate accuracy barely changes.
- **Multi-judge majority voting** is limited because top judges have pairwise Cohen's $\kappa\approx0.71$ and fail on many of the same hard cases. A top-three vote improves by only about 1 pp at several times the cost.
- **The oracle pool** reaches 99.2% if one can choose the correct pooled verdict after the fact, but a deployed system does not know which judge is correct on each trajectory. The oracle motivates soft labels or confidence routing; it is not a deployable result.

Cost makes the trade-off sharper. In **Figure 1, §5.4, and Appendix Table 14**, judging all 1,019 trajectories costs roughly \$86 with Claude-Opus-4-8 and \$45 with GPT-5.5. The best sub-\$3 judge reaches only about 57% on the Hard set. The full set makes a 42-fold price reduction look like a loss of only about 3 pp, but the cheap tier's failure-catching ability collapses on difficult trajectories. At tens of thousands or millions of reward calls, this determines whether an RL design is economically viable.

### Table 2: Grading quality is harder than judging success

OSReward-Multi adds alignment and efficiency labels to 440 successful trajectories. In **Table 2**, even GPT-5.5 reaches only 63.5% Multi macro-recall; Claude-Opus-4-8 reaches 60.8%. AUC is stronger than direct level prediction, suggesting that models can rank two runs more reliably than they can calibrate an absolute quality grade.

Binary success, alignment, and efficiency should therefore not be collapsed into one vague score. A production harness should record at least whether the task completed, whether actions matched the user's intent, whether the path was efficient, and whether side effects remained acceptable.

### Figure 9 and Table 3: OS-Shepherd-100K is not scaled-up human gold

The 1,019 benchmark items are human gold; the training corpus is not. In **§6.1, Figure 9, Table 3, and Appendix D.1**, the authors create 321,631 judge instances over 82K trajectories, using agreement among several strong judges and varied screenshot settings to select training data. About 85% of trajectories survive the agreement filter. The key distinction is that **agreement selects examples instead of forcing a majority label onto ambiguous examples**.

![OSReward Figure 9: filtering and ensemble judging from roughly one hundred thousand raw instructions to OS-Shepherd-100K](/paperReading/08-osreward-agent-evaluation/figure-9-training-pipeline.png)

*Figure 9 | The OS-Shepherd-100K data funnel; band widths represent trajectory counts. Source: [Sun et al., OSReward Figure 9](https://arxiv.org/html/2607.28609v1#S6.F9), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*

The raw judge-instance pool is 37% web, 19% Windows, 14% macOS, 11% Ubuntu GUI, 9% Ubuntu GUI+CLI, and 10% mobile. Filtering yields 69,663 unique trajectories and 96,621 SFT samples spanning more than 335K screenshots. Trajectories have a median length of 12 steps, p90 of 25, and maximum of 131. Each trajectory contributes at most two samples, corresponding to the binary-only and alignment/efficiency-rubric output formats.

Three label-provenance limitations matter:

1. Training labels come from strong-judge agreement rather than new human annotation; shared bias can survive inside “high agreement.”
2. The corpus mixes self-collected data with OpenCUA, OpenMobile, ScaleCUA, and other sources. macOS exists only in the training corpus, not in the OSReward benchmark.
3. Reverse task synthesis produces about 25% of the combined Ubuntu/Windows training instructions and about 10% of web instructions, trading manual guarantees for scale.

The authors perform a contamination check: no training trajectory comes from benchmark runs, and every training instruction is compared against every OSReward instruction with an embedding cosine-similarity threshold above 0.8; no overlap is found. This reduces direct leakage but cannot exclude semantically similar tasks or distribution shortcuts shared across model families.

### Table 4: What does OS-Shepherd improve?

The authors assemble roughly 100K reasoning-annotated judgments, apply SFT to 96.6K agreement-filtered samples, and then use GRPO to target false success. In **Table 4**, OS-Shepherd-9B improves from its base model's 76.7% to 86.1% on the full set and from 39.4% to 60.2% on the hard set. Hard-set failure recall rises from 14.1% to 57.6%. The 35B reaches 62.7% on the hard set, only about 2.5 pp above the 9B.

This supports targeted de-biasing over parameter scaling, but it does not make the learned judge equivalent to ground truth. Even after correcting false success, hard-set accuracy remains too low to serve as an unquestioned production gate.

The division of labor between the two training stages is more specific than “SFT plus RL” suggests:

- **SFT** uses the 96.6K agreement-filtered samples. The authors train for three epochs but retain the one-epoch checkpoint after performance plateaus; the main effect is moving the Qwen3.5 base away from near-total leniency.
- **GRPO** mines roughly 3.1K recoverable errors for which the SFT model is wrong greedily but sometimes correct under sampling, predominantly false successes. About 2.9K are used for training and 0.2K for validation, with eight rollouts per example and roughly 150 steps.
- **Reward** is 1.0 for a correct, well-formatted verdict, 0.1 for a wrong but well-formatted verdict, and 0 for format violations. Only the language backbone updates; the vision tower remains frozen during RL.
- **Compute** is 32 NVIDIA H200s for both sizes, with prompts up to 24,576 tokens and responses capped at 512 tokens.

![OSReward Figure 13: Base, SFT, and SFT plus RL move toward the balanced diagonal](/paperReading/08-osreward-agent-evaluation/figure-13-debiasing-trajectory.png)

*Figure 13 | OS-Shepherd-9B's de-biasing path; SFT and RL raise fail recall and move the judge out of the lenient corner. Source: [Sun et al., OSReward Figure 13](https://arxiv.org/html/2607.28609v1#A4.F13), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*

**Figure 13** shows that RL does not primarily add aggregate discrimination. It relocates the operating point, sacrificing some success recall for higher fail recall. SFT performs most of the accuracy improvement; RL changes which side the model errs on. For asymmetric risk, two judges with similar balanced accuracy can therefore have very different production safety profiles.

OS-Shepherd-9B's API-equivalent cost for the full set is about \$1.36. The paper's illustrative online-RL run—200 updates × batch 16 × 16 rollouts—requires 51,200 judge calls: roughly \$4,000 with Claude-Opus-4-8, \$2,300 with GPT-5.5, and \$68 with OS-Shepherd-9B, a 30–60× difference. Self-hosting turns that marginal API cost into local GPU time. The paper claims 30–60× lower cost, not merely 30–60% lower cost.

### Figure 10: Cross-benchmark transfer is agreement, not accuracy

The authors run the same judges on AndroidWorld, WebArena, and OSWorld against each benchmark's hand-written verifier. **Figure 10** shows that agreement is driven largely by platform: mobile approaches the roughly 90% replacement bar, web is about 6 pp below it, and desktop falls substantially shorter, with similar platform ordering across judges. OS-Shepherd is the strongest open judge on OSWorld and AndroidWorld and enters the frontier cluster on WebArena; its stronger failure-catching behavior transfers.

This does not establish OS-Shepherd's true accuracy on those three benchmarks. Their verifiers can have false positives and false negatives, and the paper does not relabel the external sets with humans. Figure 10 measures agreement. It also evaluates the full SFT-plus-RL recipe, so the transfer cannot be attributed to GRPO alone. The defensible conclusion is that **the de-lenient operating point has transfer evidence, but it is not a replacement for ground truth.**

### Appendix F: Five concrete cases that fool judges

The case studies turn leniency bias into observable failure patterns:

- **Figure 20**: the source visibly dates to 2017, yet the agent presents it as recently popular and the judge fails to verify recency evidence.
- **Figure 21**: the agent claims a git check is complete, although the required `git status` command and terminal output never appear.
- **Figure 22**: the agent reaches the correct Yahoo Finance page but misreads both the Beta window and value.
- **Figure 23**: Audacity actions and export cues look convincing, but the judge does not verify that the first ten seconds of the waveform actually contain the requested Fade Out.
- **Figure 24**: a successful final save hides repeated earlier image-insertion errors in a long LibreCAD trajectory; artifact existence is not artifact correctness.

The shared pattern is that a final success cue masks earlier errors, while long trajectories make causal tracking difficult. A judge that sees only trailing screenshots is especially vulnerable to treating “saved,” “exported,” or “answered” as proof that the content is correct.

### Bloss0m extension: a hybrid verifier architecture

The following is a Bloss0m engineering inference, not the architecture proposed by the paper:

```text
Agent trajectory
  → 1. deterministic verifier: state, files, database, APIs, tests, permissions
  → 2. model judge: semantic completion, intent alignment, quality, efficiency
  → 3. disagreement router: conflict, low confidence, high risk → human/specialized verifier
  → 4. telemetry: evidence, judge version, cost, failure type, review outcome
```

The first layer checks objective invariants: Was the meeting created? Does the file exist and pass its schema? Did the tests pass? Does the database state diff match the requested effect? The second layer handles writing quality, ambiguous intent, and inefficient behavior. When the two layers conflict, the system should not average their scores; it should fail closed, retry, or escalate according to task risk.

This complements the tool-selection problem in [RAG-MCP](/en/paper-reading/04-rag-mcp/) and the memory problem in [Beyond RAG for Agent Memory](/en/paper-reading/06-beyond-rag-for-agent/). Correct tool routing and useful memory still do not prove that the external state is correct. The [Agentic AI Platform project](/en/projects/agentic-ai-platform/) offers a practical harness context in which each tool action can expose a verifiable effect.

A practical system can express each task as an evaluation contract:

| Layer | Evidence to retain | Recommended verdict behavior |
| --- | --- | --- |
| State correctness | before/after state, API response, file hash, test result | Fail closed when any required invariant fails |
| Semantic quality | user intent, completeness, readability, alignment | Emit a rubric and confidence; never override state failure |
| Process quality | steps, retries, permissions, cost, irreversible side effects | Score separately so “success” cannot hide a dangerous path |
| Conflict handling | verifier/judge disagreement, low confidence, OOD signal | Retry, specialized verifier, or human review |

At minimum, track five production metrics: false-success rate, fail recall, deterministic-verifier coverage, judge flip/disagreement rate, and cost per confirmed verdict. Accuracy remains useful, but it cannot be the only gate.

### Reproducibility: where should a team start?

Full retraining requires 32 H200s and is not a sensible starting point for most teams. The paper still supports a layered reproduction path:

1. **Low-cost audit**: sample successes, false successes, and long-horizon cases from released OSReward and Hard; rerun an existing judge and report sRec, fRec, balanced accuracy, and flip rate.
2. **Protocol reproduction**: fix last-five screenshots, full action history, and greedy decoding; then remove text or markers or vary screenshot count to test the direction of Figure 8.
3. **Harness experiment**: run deterministic verification and a model judge on the same tasks, then measure disagreement. This is more production-relevant than chasing the paper leaderboard.
4. **Training study**: begin with small-model SFT and ask whether the operating point leaves the lenient corner. Targeted RL is warranted only if false successes remain concentrated and repeated sampling reveals recoverable errors.

This sequence turns “reproduce the paper” into “test our own risk hypothesis” and avoids copying the most expensive stage first.

### Limitations and claims to avoid

1. This is currently arXiv v1 and work in progress; data, models, and reported figures may change.
2. Four platforms improve breadth, but the benchmark still reflects selected applications, task distributions, and agent families.
3. The Hard set comes from human-disagreement cases and deliberately raises the failure rate. It is diagnostic, not an estimate of production traffic base rates.
4. The main protocol sees only the final five screenshots plus full text history. Evidence from early screens or live state is already missing for some tasks.
5. OS-Shepherd-100K labels come from strong-judge agreement. Removing ambiguous cases improves cleanliness but may omit exactly the boundary cases that require arbitration.
6. Figure 10 measures agreement with existing benchmarks' verifiers, which can themselves produce false positives and negatives; agreement is not new ground truth.
7. Cost estimates use May 2026 list prices or market rates. Region, batching, quantization, and self-hosted hardware can change the frontier.
8. Large-scale OS-Shepherd training used 32 NVIDIA H200 GPUs. Open artifacts do not make complete training inexpensive to reproduce.
9. Model judges fill semantic gaps; they should not replace deterministic checks that can already be implemented precisely.

### Engineering conclusion

OSReward's durable conclusion is that **agent evaluation is not the choice of one judge model; it is the design of an evidence chain.** Completion claims, text histories, and screenshots are evidence, but success should be proved through environment state whenever possible. A model judge is valuable for open-ended quality, not for converting every checkable condition back into a probability.

The next production step is therefore not chasing the top judge on one leaderboard. Measure false-success rate, failure recall, judge disagreement, review cost, and deterministic-verifier coverage. Those metrics reveal whether the agent truly completed its task—or merely narrated failure convincingly.

### Primary sources

- [OSReward arXiv abstract and version history](https://arxiv.org/abs/2607.28609)
- [OSReward full HTML paper](https://arxiv.org/html/2607.28609v1)
- [OSReward project, code, benchmark, data, and models](https://os-copilot.github.io/OSReward-Home/)
