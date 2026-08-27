---
title: "Reflexion: Write Verbal Reflections into Memory — Do Not Mistake Retries for Weight Learning"
description: "A deep read of Shinn et al., NeurIPS 2023: frozen weights plus linguistic feedback stored in episodic memory for across-trial verbal credit assignment. HumanEval pass@1 91.0 vs GPT-4 80.1 is a programming setup with self-tests and retries; WebShop and MBPP mark the boundary."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "Reflexion’s control point is frozen weights: sparse environment or self-evaluation signals are amplified into verbal experiences, stored in a bounded episodic memory buffer, and used to condition the next trial."
  - "HumanEval (PY) Reflexion pass@1 is 91.0 versus 80.1 for the GPT-4 single-sample column (Table 1). That programming setup uses self-generated unit tests and retries; it is not “the same GPT-4 with one extra system prompt.”"
  - "ALFWorld reaches 130/134 with a heuristic trigger; HotPotQA reports about +20% over strong baselines; a Rust ablation shows dropping tests or reflections collapses gains. WebShop barely improves; MBPP (PY) falls to 77.1."
audience:
  - "Engineers wiring “reflect then retry” into an agent loop who need to separate it from weight updates and from ReAct’s within-trial interleaving."
  - "Leads who must place Reflexion, ReAct, ADIAS, and PAST-Bench as across-trial verbal memory, within-trial contracts, issue ledgers, and persistence evaluation."
tags: ["Paper Reading", "Agent Systems", "Agent Memory", "Reinforcement Learning", "Tool Use"]
image: "/paperReading/27-reflexion-verbal-reinforcement/title_image.webp"
field: "AI Engineering"
difficulty: "intermediate"
showToc: true
topics:
  - agent-memory-adaptation
  - tool-use-coding-agents
paper:
  title: "Reflexion: Language Agents with Verbal Reinforcement Learning"
  authors:
    - "Noah Shinn"
    - "Federico Cassano"
    - "Edward Berman"
    - "Ashwin Gopinath"
    - "Karthik Narasimhan"
    - "Shunyu Yao"
  year: 2023
  venue: "NeurIPS 2023 (arXiv 2303.11366 v4)"
  links:
    pdf: "https://arxiv.org/pdf/2303.11366v4"
    arxiv: "https://arxiv.org/abs/2303.11366"
    doi: "https://doi.org/10.48550/arXiv.2303.11366"
    code: "https://github.com/noahshinn/reflexion"
    project: "https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html"
series:
  id: "reflexion-verbal-reinforcement"
  title: "Reflexion deep reading"
  part: 1
  totalParts: 1
---

To see where this note sits on the ReAct family spine, start from the [Agent foundations reading map](/en/blog/91-agent-method-foundation-reading-map/).

## The paper in 90 seconds

- **Problem:** Language agents can already act in external environments, but learning from trial-and-error usually means expensive sample-heavy RL with weight updates, while few-shot in-context teaching barely stores interpretable experience across episodes.
- **Core insight:** Keep weights frozen. Amplify binary or scalar feedback into a verbal reflection, append it to an episodic memory buffer, and condition the next trial on that text. The changed control point is **across-trial verbal credit assignment**, not a parameter gradient.
- **Strongest evidence:** HumanEval (PY) Reflexion pass@1 **91.0** versus GPT-4 single-sample **80.1** (Table 1); ALFWorld heuristic setting solves **130/134** (Section 4.1); HotPotQA reports about **+20%** over strong baselines (Section 4 lead-in). Rust ablation: full Reflexion 0.68; omitting reflection or tests falls to 0.60 / 0.52 (Table 3).
- **Main boundary:** Needs a usable evaluation signal; reflections can be wrong; extra trials cost compute; memory is a sliding window (typically 1–3), not enterprise governance. WebShop barely improves (Figure 6); MBPP (PY) drops to 77.1. This is not weight learning and not a deployable runtime.

Bounded verdict: **Keep Reflexion as the contract “frozen weights + short verbal experience buffer across trials.” Do not read 91% as GPT-4 becoming 11 points stronger in one sample, and do not treat retries as finished parameter learning.**

> **Huahua's take**
>
> ReAct interleaves thought and action inside one trial. Reflexion writes a lesson after failure and starts the next trial. They can stack, but they are not the same control point.

## Version and reading scope

This note reads [Shinn et al., NeurIPS 2023](https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html) against [arXiv:2303.11366 v4](https://arxiv.org/abs/2303.11366) (updated 2023-10-10; first posted 2023-03-20). The v4 PDF and [arXiv HTML](https://arxiv.org/html/2303.11366v4) are marked CC BY 4.0. Beyond the abstract, this article checks Section 3’s Actor / Evaluator / Self-Reflection stack and Algorithm 1, Sections 4.1–4.3 for ALFWorld / HotPotQA / programming numbers, Tables 1–3, Appendix A Tables 4–5, Appendix B’s mug-and-desklamp trace and WebShop Figure 6, plus artifact endpoints as of **2026-08-27**.

This is a published NeurIPS paper, not a preprint. The PDF still prints `github.com/noahshinn024/reflexion`; as of 2026-08-27 that URL returns 404. The usable endpoint is [noahshinn/reflexion](https://github.com/noahshinn/reflexion) (MIT). This note does **not** back-fill later Reflexion variants, enterprise memory products, or SWE-bench / ProMax scores into these tables.

## The reader question

If a language agent can already act in an environment but cannot afford gradient-style RL, can “saying what went wrong” replace weight updates? Reflexion’s answer is yes—only if you have an Evaluator that can judge success or failure, and a Self-Reflection model that turns sparse signals into actionable verbal experience.

The precise reading is not “is 91% the new coding SOTA?” The real question is: **after weights are frozen, which decision does across-trial verbal memory change, and on which tasks does the method fail because the evaluator is weak, the search space is too open, or the reflection is unhelpful?**

## Evidence map

| Layer | How this note uses it |
| --- | --- |
| **Paper directly supports** | Algorithm 1 and Figure 2 define Actor / Evaluator / Self-Reflection / `mem`; Table 1 reports HumanEval (PY) 91.0 vs GPT-4 80.1; Section 4.1 reports ALFWorld 130/134; Figure 4(c) shows reflection adds about +8% over episodic memory alone; Table 3 gives the Rust ablation; Figure 6 shows almost no WebShop lift. |
| **Author claims** | Verbal reflection can act as a “semantic” gradient; a policy can be parameterized as LLM weights plus memory encoding; useful self-correction is an emergent property of stronger models. |
| **Not established** | 91.0 is not a single sample; trial compute and latency are not reported as a cost table; a sliding window is not long-horizon governance; reflection correctness has no formal guarantee; enterprise tool permissions and side effects are out of scope. |
| **Bloss0m engineering judgment** | Implement Reflexion as across-trial verbal credit assignment. For within-trial thought–action–observation, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). For issue-indexed repair ledgers, read [ADIAS](/en/paper-reading/20-adias-issue-centric-agent-optimization/). To test whether gains truly come from retained experience, read [PAST-Bench](/en/paper-reading/16-past-bench-recursive-self-improvement/). |

Later sections keep numbers, author claims, and engineering judgment separate. “Improvement” means the paper’s reported setups only.

## Why the previous approach is insufficient

Section 1 states the early-2023 gap clearly. ReAct, SayCan, Toolformer, and WebGPT showed that a language core can drive environment actions, but they mostly stop at in-context teaching: the models are too large for cheap gradient RL, and few-shot prompts barely accumulate durable lessons across episodes.

Classic RL credit assignment relies on scalar or vector rewards. The authors argue those signals struggle to tell a language policy, in semantic space, *which step should change and how*. Refinement loops such as Self-Refine mostly serve single-generation tasks and need not leave a persistent across-trial experience buffer.

So the prior limitation is not “the model cannot think.” The **learning signal sits at the wrong layer**: either refine inside one generation, or pay for weight updates. Reflexion changes that control point—conditioning the next episode with verbal experience.

## Core intuition

Ignore the tables for a moment. Imagine failing twice in a kitchen: first you hunt for a mug, then a lamp, even though both sat on the same desk; second time you write a sticky note—“find the lamp first”—and read that note before the next attempt. You did not rewire your brain; you conditioned the next trial on text.

Reflexion encodes that split:

1. **Actor** $M_a$: emits text and actions (CoT or ReAct).
2. **Evaluator** $M_e$: scores a full trajectory—environment success, heuristics, self-generated unit tests, or an LLM classifier.
3. **Self-Reflection** $M_{sr}$: amplifies the sparse reward into verbal experience $sr_t$.
4. **Memory** $mem$: appends $sr_t$, practically truncated to capacity $\Omega$ (usually 1–3) so context limits are respected.

The policy is written $\pi_\theta(a_i|s_i)$ with $\theta=\{M_a, mem\}$. Weights stay fixed; what changes is the long-term memory that conditions the Actor.

The contrast with [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/) must stay sharp: ReAct changes whether the **next step inside one trial** is a thought or an environment action; Reflexion changes how **failed trials become reusable verbal hints before the next trial**. The Actor may itself be ReAct—as in ALFWorld and some HotPotQA runs—but the reflect step happens after reset.

> **Huahua's engineering note**
>
> When 91% and 80% appear in one sentence, first ask “single sample or multi-trial with self-tests?” Table 1’s SOTA column is GPT-4 single generation; the Reflexion column includes self-tests and a reflection loop. Calling that “the same GPT-4 with one extra prompt” misleads.

![Paper Figure 2: data flow among Actor, Evaluator, Self-Reflection, and short-/long-term memory.](/paperReading/27-reflexion-verbal-reinforcement/paper/figure-2-architecture.webp)

*Figure 2, paper Section 3: environment feedback enters the Evaluator; the Actor produces a trajectory (short-term memory); Self-Reflection writes reflective text into long-term memory that conditions later actions. Algorithm 1 sits beside the diagram. Locate the original at [Figure 2](https://arxiv.org/html/2303.11366v4#S3.F2); SVG endpoint [reflexion_rl.svg](https://arxiv.org/html/2303.11366v4/reflexion_rl.svg). From the arXiv HTML / matching assets; page marked CC BY 4.0.*

## Walk one example through the method

Appendix B’s ALFWorld trace uses the task *examine the mug with the desklamp*. This is the paper’s own qualitative trajectory, not an independent score.

1. **Input:** Room observations list a bed, desks 1/2, many drawers and shelves; the goal is to examine a mug with a desklamp.
2. **Intermediate representation:** Trial #1’s ReAct-style Actor plans “find mug → take → find desklamp → use.” After empty drawers, it sees *both* mug and desklamp on desk 1, takes the mug, leaves to hunt for a lamp, then repeatedly `use`s a lamp that is not at the current location—Fail.
3. **Model or system decision:** The Evaluator (task failure / heuristic) marks failure. Self-Reflection writes that the order was wrong—examine mug *with* desklamp implies finding the lamp first—and that desk 1 already held both. That $sr$ is appended to $mem$.
4. **Output:** After reset, Trial #2 goes straight to desk 1, takes the mug, uses desklamp 1—Success.
5. **Likely failure point:** If the reflection invents the wrong cause (for example, “too many drawers” instead of order), or if the task needs a large exploratory search rewrite as in WebShop, the next trial treats a bad lesson as a hint. Appendix B.1 documents that failure mode.

## Technical mechanism

Algorithm 1 hard-codes the loop:

1. Generate trajectory $\tau_t$ from the current $\pi_\theta$.
2. Compute $r_t = M_e(\tau_t)$. Stop on pass or max trials.
3. Produce $sr_t = M_{sr}(\tau_t, r_t, mem)$.
4. Append $sr_t$ to $mem$, truncating to $\Omega$ when needed.
5. Increment $t$ and retry.

Evaluators differ by task, which changes *what can be learned*:

| Task | Actor | Evaluator signal | Memory bound (paper practice) |
| --- | --- | --- | --- |
| ALFWorld | ReAct (GPT-3 few-shot) | Environment completion; heuristic (same action/observation >3 times, or >30 steps) or LLM binary classification to trigger reflection | last 3 reflections |
| HotPotQA | CoT / ReAct | Exact-match (EM) binary answer grade | 3 experiences; retries until 3 consecutive failures |
| Programming | Function-body generation | Self-generated unit tests (≤6, AST-filtered) | 1 experience |

The programming setup is decisive: self-generated tests preserve pass@1 eligibility by avoiding hidden tests. That is why 91.0 can sit in a pass@1 column—and why correctness is tied to test quality. Table 2’s false-positive rate (tests pass, solution fails) is 0.16 on MBPP (PY) versus 0.01 on HumanEval (PY); the authors use that gap to explain why HumanEval reaches 91 while MBPP falls to 77.1.

## How to read the evidence

### ALFWorld: across-trial search and repair

**Question:** On long-horizon household tasks, can verbal memory unlock environments where ReAct stalls on hallucinated inventory or inefficient plans?

**Controls:** 134 environments across six task types; two few-shot traces; ReAct-only resets without writing memory when reflection is suggested; Reflexion writes memory then retries; learning observed over about 12 iterative steps.

**Observation:** ReAct + Reflexion (heuristic) completes **130/134**. The authors report about **+22%** over strong baselines (Section 4 lead-in). ReAct-only gains stall around trials 6–7; Reflexion rises sharply in the first two trials, then climbs toward near-perfect coverage (Figure 3).

**Explanation:** Early mistakes in long traces can be distilled into “change the plan next time”; when search surfaces are large, multi-trial memory accumulates what was already checked. That is an across-trial mechanism, not a stronger single ReAct thought.

**Boundary:** GPT-3 Actor; permissible actions are largely visible in observations. On WebShop, where search is ambiguous and actions are less “enumerated in sight,” the same method barely helps.

![Paper Figure 3: ALFWorld cumulative success for ReAct-only versus Reflexion, plus failure-reason classification.](/paperReading/27-reflexion-verbal-reinforcement/paper/figure-3-alfworld.webp)

*Figure 3, paper Section 4.1: (a) learning curves under heuristic and GPT self-evaluation triggers; (b) failure taxonomy. Locate the original at [Figure 3](https://arxiv.org/html/2303.11366v4#S4.F3); curve asset [alfworld_success.svg](https://arxiv.org/html/2303.11366v4/alfworld_success.svg). From the arXiv HTML / matching assets; page marked CC BY 4.0.*

### HotPotQA: reasoning and “trajectory-only” ablation

**Question:** After amplifying binary EM into first-person verbal reflection, can search QA and gold-context-only reasoning improve?

**Controls:** 100-question sample; CoT 6-shot, ReAct 2-shot, reflection 2-shot; CoT (GT) supplies ground-truth context to isolate reasoning; at temperature 0.7, baselines almost never solve previously failed items on later trials by chance alone.

**Observation:** The authors report about **+20%** over baselines (Section 4). CoT (GT) still misses 39%; Reflexion improves about **14%** more without access to the ground-truth answer. Figure 4(c): adding the latest trajectory as episodic memory (EPM) helps, but full reflection adds about another **+8%** absolute.

Appendix Table 5 adds backbone slices on the same 100-question setting—for example CoT (GT)+GPT-4 0.68→0.80; ReAct+text-davinci-003 0.30→0.55. Magnitudes move with the model; direction stays consistent.

**Explanation:** Replaying a failed trace is weaker than naming, in language, what should change. That supports the authors’ “semantic gradient” framing, but it still depends on a clean binary EM signal.

**Boundary:** 100-question sample; EM is not open-ended answer evaluation; CoT (GT) has answer context and does not imply closed-book search is solved.

![Paper Figure 4: HotPotQA learning curves for CoT/ReAct/CoT(GT) and the episodic-memory ablation.](/paperReading/27-reflexion-verbal-reinforcement/paper/figure-4-hotpotqa.webp)

*Figure 4, paper Section 4.2: (a) CoT/ReAct ± Reflexion; (b) CoT (GT); (c) EPM versus EPM+Reflect. Locate the original at [Figure 4](https://arxiv.org/html/2303.11366v4#S4.F4); panel assets such as [hotpotqa_success.svg](https://arxiv.org/html/2303.11366v4/hotpotqa_success.svg). From the arXiv HTML / matching assets; page marked CC BY 4.0.*

### Programming: what 91.0 is counting, and the ablation

**Question:** On coding tasks with compilers or interpreters, can self-generated tests plus verbal reflection raise pass@1?

**Controls:** HumanEval / MBPP in Python and Rust (MultiPL-E); LeetcodeHardGym with 40 hard problems released after GPT-4’s cutoff; instruction models generate function bodies zero-shot; ≤6 self-tests; memory size 1.

**Observation (Table 1):**

| Benchmark | Prev SOTA | SOTA (single sample) | Reflexion |
| --- | ---: | ---: | ---: |
| HumanEval (PY) | 65.8 (CodeT+GPT-3.5) | 80.1 (GPT-4) | **91.0** |
| HumanEval (RS) | — | 60.0 (GPT-4) | 68.0 |
| MBPP (PY) | 67.7 (CodeT+Codex) | 80.1 (GPT-4) | **77.1** |
| MBPP (RS) | — | 70.9 (GPT-4) | 75.4 |
| Leetcode Hard (PY) | — | 7.5 (GPT-4) | 15.0 |

Table 2 lists Base / Reflexion beside test-quality cells: HumanEval (PY) 0.80→0.91; MBPP (PY) 0.80→0.77. When the analysis prose mentions baselines “around 82%/80%,” this note treats Table 1/2’s 80.1 / 0.80 as the headline anchors.

Table 3 (hardest 50 HumanEval Rust problems, GPT-4):

| Approach | Test gen | Reflect | Pass@1 |
| --- | --- | --- | ---: |
| Base | ✗ | ✗ | 0.60 |
| Omit tests | ✗ | ✓ | 0.52 |
| Omit reflection | ✓ | ✗ | 0.60 |
| Reflexion | ✓ | ✓ | **0.68** |

**Explanation:** Tests supply early-stop / error localization; reflection supplies how to edit. Dropping either side fails to beat the baseline on this hard slice—omitting tests is worse, because the agent keeps making harmful edits without knowing whether the current body is correct.

**Boundary:** 91.0 depends on self-test quality; high FP rates hand in wrong solutions early (MBPP). Table 4 on starchat-beta is 0.26 vs 0.26—the authors treat useful self-correction as emergent in stronger models, not a universal prompt pattern. Multi-trial token cost is not amortized in the main tables.

### WebShop: a failure mode under weak exploration

**Question:** Does the same ReAct+Reflect stack still help on high-ambiguity e-commerce search?

**Controls:** 100 customer requests; two-shot ReAct+Reflexion; runs stopped after about four trials.

**Observation:** Figure 6 shows Reflexion barely above ReAct; reflections are not intuitively helpful. The authors conclude Reflexion struggles on tasks that need large behavioral diversity and exploration, and can stick in local minima.

**Boundary:** This is the paper’s own counterexample, not an outside nitpick. It bounds the slogan “any failure can be fixed by writing a reflection.”

![Paper Figure 6: on WebShop’s 100 requests, ReAct-only and ReAct+Reflexion nearly overlap.](/paperReading/27-reflexion-verbal-reinforcement/paper/figure-6-webshop.webp)

*Figure 6, paper Appendix B.1: within four trials there is no stable separation. Locate the original at [Figure 6](https://arxiv.org/html/2303.11366v4#A2.F6); SVG [webshop_success.svg](https://arxiv.org/html/2303.11366v4/webshop_success.svg). From the arXiv HTML / matching assets; page marked CC BY 4.0.*

## Limitations and threats to validity

Section 5 and the rest of the paper compress into an engineering checklist:

1. **Local minima remain possible.** WebShop is the empirical case.
2. **Memory is a capacity-limited sliding window.** Vector stores or SQL are future work, not this system.
3. **Test-driven coding assumptions are fragile.** Non-determinism, side effects, hardware dependence, and concurrency resist stable I/O tests.
4. **Reflections have no correctness guarantee.** A wrong lesson contaminates the next trial.
5. **Compute and latency.** Each failure may rerun a full trial; main tables report final accuracy, not unit cost.
6. **Not enterprise memory governance.** No permission, forgetting, audit, or rollback contract—read runtimes such as [Argus](/en/paper-reading/10-argus-agentic-runtime/) for that layer.
7. **Do not back-port SWE-bench / ProMax numbers.** This paper’s coding tasks are HumanEval / MBPP / LeetcodeHardGym under a different evaluation unit.

## Engineering decision and when not to use it

Borrow Reflexion when you already have an automatic success signal (tests, clear task completion, reliable heuristics), are willing to treat reflection text as auditable across-trial state, can afford extra trials, and will document the memory truncation policy.

Do not treat the paper as a construction blueprint when:

- You need within-trial thought/tool interleaving—start with [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). Reflexion does not replace that contract.
- You need training-time decisions about when to insert an API call—read [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/).
- You need an issue-level repair ledger that prevents repeating dead fixes—read [ADIAS](/en/paper-reading/20-adias-issue-centric-agent-optimization/). Reflexion’s $mem$ is a short text window, not an issue lifecycle.
- You must prove that score gains come from retained experience—read [PAST-Bench](/en/paper-reading/16-past-bench-recursive-self-improvement/).
- You need execution-based evaluation on real GitHub issues—read [SWE-bench](/en/paper-reading/26-swe-bench-github-issue-evaluation/). Do not write HumanEval 91.0 into a SWE-bench protocol.
- You lack a reliable Evaluator, face a huge exploration space, or cannot spot-check reflections: do not ship it. WebShop and MBPP false positives are the warnings.

> **Huahua's take**
>
> Treat Reflexion as an auditable across-trial sticky note, not as RL that already learned parameters. A wrong note makes the next round worse; too many notes blow the context first.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** [arXiv abs](https://arxiv.org/abs/2303.11366), [v4 PDF](https://arxiv.org/pdf/2303.11366v4), and [HTML](https://arxiv.org/html/2303.11366v4) are readable under CC BY 4.0. The [NeurIPS 2023 page](https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html) opens.
- **Code:** The printed `noahshinn024/reflexion` URL currently **404s**. The usable repo is [noahshinn/reflexion](https://github.com/noahshinn/reflexion) (MIT; README marks NeurIPS 2023). It includes HotPotQA notebooks, programming experiments, and logs; it needs `OPENAI_API_KEY` and related API access—**not** a one-command offline replay of Table 1.
- **LeetcodeHardGym:** The README points to [GammaTauAI/leetcode-hard-gym](https://github.com/GammaTauAI/leetcode-hard-gym); verify separately—it does not automatically reproduce every programming cell here.
- **Data / environments:** ALFWorld, HotPotQA, HumanEval, and MBPP are existing benchmarks; the paper does not ship one archive with the exact 100-question index plus full API snapshots.
- **Smallest useful reproduction:** Run one HotPotQA notebook agent setting, or walk one HumanEval item through generate → self-test → reflect → regenerate and inspect $mem$. That checks mechanism direction; it does not claim reproduction of 91.0.
- **Safety note:** Section 8 advises isolated execution for autonomous coding experiments; generated code is not validated before execution.

## Three things to remember

1. **Technical idea:** Reflexion stores sparse feedback as verbal reflections in a bounded episodic memory under frozen weights, enabling across-trial verbal credit assignment.
2. **Evidence:** HumanEval (PY) 91.0 vs GPT-4 80.1; ALFWorld 130/134; HotPotQA about +20%, with reflection adding about +8% over trajectory memory alone; Rust ablation shows tests and reflection are both required.
3. **Boundary:** Needs a usable evaluation signal; reflections can be wrong; retries cost compute; WebShop / MBPP / weaker models show it is not a universal retryer, nor parameter learning, nor enterprise memory governance.

## Next reading

Reflexion asks how to remember lessons in language after failure. If the next question is how thought and action should interleave inside one trial, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/); if it is whether training should insert API calls, read [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/); if it is what should count as success on real GitHub issues, read [SWE-bench](/en/paper-reading/26-swe-bench-github-issue-evaluation/); if repair progress must become an issue ledger, read [ADIAS](/en/paper-reading/20-adias-issue-centric-agent-optimization/); if score gains must be shown to come from retained experience, read [PAST-Bench](/en/paper-reading/16-past-bench-recursive-self-improvement/); if the question is runtime permissions and rollback, read [Argus](/en/paper-reading/10-argus-agentic-runtime/).

## Primary sources

- [Shinn et al., “Reflexion: Language Agents with Verbal Reinforcement Learning,” NeurIPS 2023 / arXiv:2303.11366 v4](https://arxiv.org/abs/2303.11366)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2303.11366v4)
- [NeurIPS 2023 proceedings page](https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html)
- [Code repository (MIT; usable endpoint as of 2026-08-27)](https://github.com/noahshinn/reflexion)
