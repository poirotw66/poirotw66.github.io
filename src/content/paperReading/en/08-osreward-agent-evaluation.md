---
title: "OSReward Deep Read: Why Agent Success Cannot Be Judged by Another Model Alone"
description: "A critical reading of OSReward's cross-platform computer-use evaluation, VLM-judge leniency, and OS-Shepherd, extended into a hybrid deterministic-verifier and model-judge architecture."
pubDate: 2026-08-02
updatedDate: 2026-08-02
tldr:
  - "OSReward shows that mainstream VLM judges often label incomplete tasks as successful; even the strongest models reach only about 70% accuracy on the hard set."
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

### Figure 3 and Figure 4: Why trust the gold labels?

In **Figure 3** and §3.3, every trajectory that survives preprocessing receives three independent labels. Unanimous cases are finalized directly; disagreements are not reduced to a majority vote but go to joint meta-review by two senior reviewers. Annotation, meta-review, and hard-set re-verification reportedly required about 800 human-hours.

**Figure 4** summarizes 1,019 trajectories across four platforms, with a roughly 43%/57% success/failure split and runs as long as 100 steps. Reasoning-and-planning errors appear in 86% of failed trajectories. Failed runs are also substantially longer, making the task sequence-level evidence integration rather than simple screenshot classification.

OSReward-Hard selects 284 genuinely ambiguous trajectories and shifts the mix to roughly 30% success and 70% failure. Most were cases on which human annotators had initially disagreed: some failed runs read like confident completions, while some successful runs use unusual paths.

### Table 1: Nearly 90% on the full set, about 70% on the hard set

The full-set numbers in **Table 1** initially look reassuring: Claude-Opus-4-8 reaches 89.7%, while GPT-5.5 and Claude-Opus-4-6 each reach 89.5%. On OSReward-Hard, however, they fall to 69.7%, 67.3%, and 67.3%. The authors therefore use the hard set as the primary diagnostic instead of relying on the easier aggregate.

The split between success recall and failure recall matters even more. Qwen3-VL-8B, for example, has 99.8% success recall but only 59.9% failure recall on the full set; on the hard set, failure recall falls to 8.2%. If such a judge supplies reinforcement-learning rewards, it does not merely miss occasional failures—it systematically rewards false success.

This is OSReward's central finding: judges share a **leniency bias**. When the textual trajectory confidently narrates completion, the judge tends to follow the story without adequately verifying the screen or final environment state.

### Figure 8: Is the judge reading the screen or the agent's story?

The ablations in §5 sharpen the diagnosis. Changing the number of trailing screenshots or removing the click marker moves aggregate accuracy by less than 0.5 percentage point. Yet these apparently harmless visual changes still flip 5–7% of individual verdicts, which is substantial label noise when each verdict becomes a training reward.

By contrast, **Figure 8** shows that removing per-step thought and action text costs 7.2 pp on average and flips 22.7% of verdicts. Removing only chain-of-thought while keeping actions is milder: a 1.8 pp loss with 11.6% flipped. Action history carries real evidence, but it also creates a vulnerability: a judge may trust what the agent says it did more than whether the environment actually changed.

### Table 2: Grading quality is harder than judging success

OSReward-Multi adds alignment and efficiency labels to 440 successful trajectories. In **Table 2**, even GPT-5.5 reaches only 63.5% Multi macro-recall; Claude-Opus-4-8 reaches 60.8%. AUC is stronger than direct level prediction, suggesting that models can rank two runs more reliably than they can calibrate an absolute quality grade.

Binary success, alignment, and efficiency should therefore not be collapsed into one vague score. A production harness should record at least whether the task completed, whether actions matched the user's intent, whether the path was efficient, and whether side effects remained acceptable.

### Table 4: What does OS-Shepherd improve?

The authors assemble roughly 100K reasoning-annotated judgments, apply SFT to 96.6K agreement-filtered samples, and then use GRPO to target false success. In **Table 4**, OS-Shepherd-9B improves from its base model's 76.7% to 86.1% on the full set and from 39.4% to 60.2% on the hard set. Hard-set failure recall rises from 14.1% to 57.6%. The 35B reaches 62.7% on the hard set, only about 2.5 pp above the 9B.

This supports targeted de-biasing over parameter scaling, but it does not make the learned judge equivalent to ground truth. Even after correcting false success, hard-set accuracy remains too low to serve as an unquestioned production gate.

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

### Limitations and claims to avoid

1. This is currently arXiv v1 and work in progress; data, models, and reported figures may change.
2. Four platforms improve breadth, but the benchmark still reflects selected applications, task distributions, and agent families.
3. Figure 10 measures agreement with existing benchmarks' verifiers, which can themselves produce false positives and negatives; agreement is not new ground truth.
4. Large-scale OS-Shepherd training used 32 NVIDIA H200 GPUs. Open artifacts do not make complete training inexpensive to reproduce.
5. Model judges fill semantic gaps; they should not replace deterministic checks that can already be implemented precisely.

### Engineering conclusion

OSReward's durable conclusion is that **agent evaluation is not the choice of one judge model; it is the design of an evidence chain.** Completion claims, text histories, and screenshots are evidence, but success should be proved through environment state whenever possible. A model judge is valuable for open-ended quality, not for converting every checkable condition back into a probability.

The next production step is therefore not chasing the top judge on one leaderboard. Measure false-success rate, failure recall, judge disagreement, review cost, and deterministic-verifier coverage. Those metrics reveal whether the agent truly completed its task—or merely narrated failure convincingly.

### Primary sources

- [OSReward arXiv abstract and version history](https://arxiv.org/abs/2607.28609)
- [OSReward full HTML paper](https://arxiv.org/html/2607.28609v1)
- [OSReward project, code, benchmark, data, and models](https://os-copilot.github.io/OSReward-Home/)
