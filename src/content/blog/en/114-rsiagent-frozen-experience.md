---
title: "RSIAgent: Can an Agent Improve Without Updating Model Weights?"
description: "A focused engineering reading of RSIAgent's curriculum, actor, verifier, and broad-to-deep exploration loop, with a careful audit of frozen experience, benchmark reporting, and reproducibility limits."
pubDate: 2026-09-22
updatedDate: 2026-09-22
tldr:
  - "RSIAgent's training-free self-improvement keeps model parameters fixed while writing procedures, failure conditions, and causal clues into external memory."
  - "A Curriculum Agent selects practice, an Actor Agent executes and distills it, and a Verifier Agent checks the environment independently enough to ground the loop."
  - "Broad Recursive Self-exploration builds coverage, Deep Recursive Self-exploration targets gaps and boundary conditions, and memory is frozen before evaluation."
  - "The reported aggregates include selected retries, different budgets, and retained baselines rather than matched independent reruns of every task; they are system evidence, not a universal capability law."
audience:
  - "Engineers building agent memory, multi-agent harnesses, or computer-use evaluations"
  - "Technical leaders deciding whether training-free adaptation belongs in a controlled production environment"
category: "AI Engineering"
tags: ["AI Agent", "Evaluation", "Research", "Architecture Patterns"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 38
kind: "article"
showToc: true
image: "/blog/114-rsiagent-frozen-experience/title_image.webp"
---

Can an agent learn a new environment if it never updates its model weights? RSIAgent's answer is yes for improving **subsequent task execution**, but the learning happens outside the model. The system explores a software environment with fixed-parameter models, turns verified procedures, failure conditions, and action consequences into persistent memory, then freezes that memory before using the same Actor–Verifier harness on downstream tasks.

That distinction matters. RSIAgent does not claim that the model itself has completed online training, and it is more than placing a longer conversation in context. It turns exploration, verification, consolidation, and reuse into an observable runtime lifecycle. This article uses the [official RSIAgent repository](https://github.com/AetherLabsAI/RSIAgent) and the [arXiv paper](https://arxiv.org/abs/2609.15364) to explain how the method works, what its evidence supports, and what engineers should not infer from the reported scores.

> **Huahua in one sentence**
>
> Fixed weights do not mean a fixed system: RSIAgent puts improvement into external experience that can be verified, frozen, and reused.

## What changes in a training-free system?

The paper frames the problem as follows: given a new environment and fixed model parameters, the agent first explores autonomously to construct persistent memory, then uses that memory for downstream tasks. The memory is not merely a list of successful trajectories. It aims to preserve environment-specific knowledge about which action works under which conditions and with which consequences, including failures and corrected rules.

RSIAgent therefore has at least three mutable layers:

1. **Exploration decisions**: the Curriculum Agent chooses the next practice task from the target, existing memory, and previous outcomes.
2. **Execution experience**: the Actor Agent operates the environment through executable Python or Bash programs and visual observations, producing procedures and results.
3. **Persistent memory**: after the Verifier reports, the Actor can consolidate, revise, or remove advice so later Actor instances can reuse it.

The Verifier Agent is the important boundary. It inspects execution results, interface state, and other environment evidence without reading the Actor's private reasoning or memory. That is not a perfect independent judge, but it is closer to an auditable feedback loop than letting the Actor declare its own success.

## Three roles, three responsibilities

RSIAgent decomposes recursive self-improvement into a multi-agent harness rather than letting one long conversation reflect forever:

- **Curriculum Agent**: finds useful exploration directions, including prerequisite skills, informative variants, failure-driven practice, and stress tests.
- **Actor Agent**: executes tasks, produces replayable programmatic actions, and consolidates grounded experience into memory.
- **Verifier Agent**: decides from environment feedback whether the requirements were actually met, returning PASS, FAIL, or a request for more evidence.

The engineering value of the separation is that memory updates do not depend only on the model's narration of its own trajectory. A complete agent architecture still needs to connect state, tools, evaluation, and failure recovery; the [AI Agent guide](/en/blog/64-ai-agent-guide/) is a useful map for deciding which boundaries should become separate services or permission scopes.

## Broad to deep: build the map, then chase the cracks

RSIAgent's curriculum is not simply repeating the same task. It explores broadly first, then deeply. The paper calls the two exploration stages Broad Recursive Self-exploration (BRS) and Deep Recursive Self-exploration (DRS), followed by frozen-memory evaluation.

### Phase 1: BRS builds environmental coverage

BRS proposes multiple exploration projects in different directions. Actors and Verifiers run them in parallel, then the system waits for a complete wave before planning the next one. The official reference configuration gives a nominal eight-project budget with up to four projects in parallel; the budget is checked after a completed wave, so the realized count can exceed the nominal value.

The wave barrier is not only an optimization. It lets the next curriculum step see the outcomes of multiple branches and identify uncovered environment structures, procedures, and failure patterns. For engineers, BRS is closer to building a searchable operating map than chasing one impressive success.

### Phase 2: DRS targets hard cases and boundaries

DRS switches to a sequential loop. The Curriculum Agent uses target attempts, Verifier feedback, and the Actor's learning diagnosis to select practice likely to expose hidden constraints, corner cases, or incorrect interpretations. Each verified experience updates memory before the next target attempt or supplementary project is proposed.

A success does not automatically end DRS. The curriculum review decides whether more practice is useful. This lets DRS treat “successful but fragile” as the next question instead of mistaking the first PASS for completed learning.

### Phase 3: freeze experience, then test

After exploration, memory is frozen and the Curriculum Agent and all memory updates are disabled. The Actor can only use the procedures, conditions, and failure lessons already stored; the Verifier still checks whether the final execution satisfies the requirements. The official lifecycle also resets the environment and places the benchmark evaluator outside the Actor–Verifier loop.

This is the measurable version of “frozen experience”: evaluation cannot quietly write new successes back to the database. Otherwise, the experiment measures a continuously adapting system rather than whether a fixed experience corpus generalizes.

> **Huahua's engineering note**
>
> Freezing memory must be an inspectable lifecycle boundary: retain the pre- and post-freeze versions, hashes, write state, and evaluator entry point, or “no updates” is only a prompt claim.

## Demos and benchmark pins: read the evidence in layers

The official repository shows FreeCAD, OSWorld, and Agents' Last Exam (ALE) integrations and case studies, and pins the OSWorld-V2 `v2026.08.08` release plus a public ALE commit. Those pins help recreate the environment. The repository also provides smoke checks for immutable memory, Verifier isolation, candidate replay, and checkpoint rollback. But a smoke check validates runtime mechanics, not the full benchmark score.

The paper reports two main aggregates. The table below keeps the partial score and binary accuracy that best show the method-level comparison, placing `w/o RSI` and RSIAgent side by side:

| Benchmark | Coverage | Partial: w/o RSI → RSI | Binary: w/o RSI → RSI |
| --- | --- | ---: | ---: |
| OSWorld 2.0 0808 offline | 82 tasks | 71.97 → 78.98 | 37.80 → 42.68 |
| ALE Near-term | 67 tasks | 83.75 → 84.82 | 49.25 → 50.75 |

These numbers support a narrower conclusion: under the authors' harness, exploration settings, and reporting rules, external memory plus two-stage exploration produced a system-level improvement signal. They do not support the broader claim that a fixed-weight agent generally beats every frontier model. In particular, ALE binary accuracy is 50.75, while the paper's comparison table lists GPT-6 Astra at 52.24; partial and binary metrics are not interchangeable.

## Why the aggregate is not a matched rerun

This is the part most likely to disappear under a headline. The paper's appendix discloses the reporting scope clearly:

- The OSWorld RSI aggregate replaces baseline scores with 41 recorded RSI results and retains baseline scores for the remaining tasks. ALE combines 19 RSI-column scores with 48 baseline scores.
- Additional exploration was directed toward tasks below full credit that did not already have an RSI lineage. Tasks already at full credit were not expanded in the same way.
- The records include selected retries, different evaluation budgets, local corrected grades, and protocol variants. This is not every task rerun independently with the same budget and averaged as matched pairs.
- Tasks without new exploration remain in the benchmark denominator, but retained baselines are not independent RSI evaluations. OSWorld T082 is also counted as zero under the reported setup-failure convention.

The right reading is therefore: “this reporting workflow shows improvement across a selected and partially completed task set,” not “RSI improves every task equally.” If a team uses the result for procurement or model selection, it should additionally preserve the task cohort, whether RSI actually ran, retry count, budget, grader version, and missingness.

> **Huahua's take**
>
> RSIAgent's most useful lesson is not “win without training.” It is how to turn exploration cost into an auditable experience asset; without matched reruns and third-party reproduction, the scores support feasibility, not a universal advantage.

## Failure analysis is closer to engineering truth than the demos

The paper groups its failure analysis into three mechanisms that can reinforce one another:

1. **Exploration misses the weakness**: if practice does not challenge the decision responsible for failure, memory can grow without repairing the target-specific weakness.
2. **Verification accepts incomplete work**: producing an output does not prove that every task requirement, field value, and artifact discrepancy was checked. A false PASS sends the problem into later learning.
3. **Memory consolidation is unreliable**: an insufficiently verified interpretation can become a reusable rule, causing later tasks to repeat the wrong condition.

These mechanisms explain why “try more times” is not a sufficient self-improvement strategy. If the curriculum selects the wrong practice or the Verifier reads the wrong evidence, retries only add cost and may make the error more durable. Production environments also need to account for unintended actions, unauthorized access, and privacy leakage when an agent can execute programs, access software, and retain data.

## A rollout checklist for engineering teams

If a team wants to add this kind of training-free adaptation to an agent runtime, validate the following before chasing benchmark scores:

1. **Manage experience as an artifact**: attach environment version, task, evidence, Verifier verdict, timestamp, and a revocable version chain to each memory item.
2. **Isolate Actor and Verifier**: separate at least their contexts, read permissions, and write scopes; add checkpoint-protected inspection and a human gate for high-risk systems.
3. **Separate exploration from evaluation**: exploration may write, sealed evaluation may not; record the tasks that actually ran instead of relying only on the aggregate denominator.
4. **Use a failure-driven curriculum**: success proves one path worked; also test missing data, delayed state, alternative conditions, and wrong actions.
5. **Price test-time work**: model calls, tools, VMs, verification, and retries can cost more than one fine-tuning run; changing environments also need memory expiry and rebuild policies.

This design can be compared with [Anthropic Agent Memory and Dreaming](/en/blog/83-anthropic-memory-and-dreaming/): both place improvement in model-external memory, but RSIAgent emphasizes curriculum, Verifier grounding, and a freeze boundary. For a related view of how an agent can drift while optimizing an evaluation target, read [Ornith 1.0's self-scaffolding and evaluation boundaries](/en/blog/69-ornith-1-0-self-scaffolding-llm/) and [Automated Alignment Researchers' integrity gates](/en/blog/98-automated-alignment-researchers/).

## Sources and next step

- [Official RSIAgent repository](https://github.com/AetherLabsAI/RSIAgent): architecture, benchmark pins, demos, runtime checks, and setup.
- [RSIAgent: Autonomous Exploration for Recursive Self-improvement in New Environments](https://arxiv.org/abs/2609.15364): v2 paper, method, main tables, failure analysis, and reporting appendix.

If you want to implement a similar harness, first build a memory artifact that can be frozen, hashed, and independently checked. Then use a small task cohort to test whether exploration actually hits weaknesses and whether the Verifier reads complete evidence. Whether the model weights change is one of the easiest properties to check in the chain.
