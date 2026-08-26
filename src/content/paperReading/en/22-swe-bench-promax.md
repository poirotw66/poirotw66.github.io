---
title: "SWE-Bench ProMax: Can Large-Scale Multilingual Refactoring Measure Long-Horizon Coding Agents?"
description: "A deep reading of SWE-Bench ProMax, which uses 170 cross-file, multilingual, behavior-preserving refactoring tasks to test whether coding agents can complete large changes rather than merely fix a nearby test."
pubDate: 2026-08-13
updatedDate: 2026-08-24
tldr:
  - "SWE-Bench ProMax moves coding-agent evaluation beyond Python-heavy bug fixing toward seven languages and gold patches averaging 11.4 source files."
  - "Under the paper's fixed scaffolds, 300-step limit, and $10-per-instance cap, OpenHands + GPT-5.2 reaches the top resolve rate of 41.2%; scaffold effects, language slices, and cost differences matter more than one leaderboard number."
  - "The dataset and evaluation metadata are available from Hugging Face as of 2026-08-13; the paper does not expose a verified official scaffold/checkpoint path for end-to-end reproduction, and language/repository concentration limits generalization."
audience:
  - "AI engineers designing coding-agent benchmarks, long-horizon software-engineering agents, or multi-repository evaluation"
  - "Engineering teams that need to tell whether an agent completed a cross-file refactor or only patched the code near the visible test"
tags: ["Paper Reading", "Agent Systems", "Evaluation", "Software Engineering", "Benchmark"]
image: "/paperReading/22-swe-bench-promax/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "SWE-Bench ProMax: Benchmarking Agents on Large-Scale Multilingual Code Refactoring"
  authors:
    - "Yuling Shi"
    - "Jinghan Xu"
    - "Kelin Fu"
    - "Wenhao Zeng"
    - "Shilin He"
    - "Lei Zhang"
    - "Yue Liu"
    - "Zelin Zhao"
    - "Terry Yue Zhuo"
    - "Jialun Cao"
    - "Siyu Ye"
    - "Tianyu Liu"
    - "Kai Cai"
    - "Shing-Chi Cheung"
    - "Xiaodong Gu"
  year: 2026
  venue: "arXiv 2608.09802 v1 (2026-08-10; source-version metadata; COLM 2026 accepted-list title differs)"
  links:
    pdf: "https://arxiv.org/pdf/2608.09802v1"
    arxiv: "https://arxiv.org/abs/2608.09802"
    project: "https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax"
---

## The paper in 90 seconds

- **Problem:** Existing coding-agent benchmarks are often Python-heavy and centered on one issue or bug fix. An agent may make a visible test pass while missing cross-file call sites, configuration, documentation, or tests. That does not answer whether it can complete a large, behavior-preserving refactor.
- **Design:** The authors mine GitHub refactoring commits, validate Docker environments, use expert and LLM-assisted analysis, and manually review candidates. The final 170 tasks cover Python, Java, TypeScript, Go, C, C++, and Rust.
- **Strongest result:** Under the paper's mini-SWE-agent and OpenHands scaffolds, with at most 300 steps and $10 per instance, OpenHands + GPT-5.2 reaches a 41.2% resolve rate. The same model reaches only 21.8% with mini-SWE-agent. This is first a scaffold-and-model result, not a model-only leaderboard.
- **Main boundary:** Resolve is a binary outcome—every test must pass. It does not score maintainability, untested behavior, review quality, or the action trace. TypeScript tasks come from only two repositories, with 25 from Angular; language scores are not an independent, balanced experiment in language difficulty.

My bounded verdict is: **SWE-Bench ProMax makes large-refactor completeness a more demanding final-state test and exposes cross-file coordination as a bottleneck; 41.2% alone does not represent general software-engineering ability or certify production review, permissions, and rollback workflows.**

> **Huahua's engineering note**
>
> When you see a benchmark headline, ask whether it measures the model, the scaffold, the test suite, or the product of all three. The most useful signal here is not who ranks first: the same model can nearly double its score under another scaffold, while agents still modify fewer files than the gold patch.

## Version and reading scope

This reading uses [arXiv:2608.09802 v1](https://arxiv.org/abs/2608.09802), submitted on 2026-08-10, whose paper title is *SWE-Bench ProMax* and whose author list has 15 names. The PDF footer says “Published as a conference paper at COLM 2026,” but the [COLM 2026 accepted-papers page](https://colmweb.org/AcceptedPapers.html) lists a related title, *SWE-Cascade: Benchmarking Agents on Large-Scale Multilingual Code Refactoring*, with an additional author, Yingwei Ma. Author pages also use SWE-Cascade. Because the accepted-papers page does not provide a directly mappable OpenReview or PDF link, this article keeps the arXiv v1 metadata and does not infer that the two versions are fully identical.

This is not a cosmetic footnote. Merging the ProMax title, the SWE-Cascade title, the author lists, and the result tables without qualification would make it impossible to tell which numbers, artifacts, and claims were actually verified for this reading.

## What to know first

A coding-agent benchmark has at least four layers: **the task**, **the tests and judge**, **the agent scaffold**, and **the model plus execution budget**. A scaffold can change tool calls, context management, stopping behavior, and test execution. A model changes planning, editing, and error-recovery ability. SWE-Bench ProMax fixes or crosses these layers explicitly, which is why it reveals that they are not interchangeable.

The paper is a useful companion to Bloss0m's [OSWorld agent evaluation](/en/paper-reading/08-osreward-agent-evaluation), [ContextWeave workflow benchmark](/en/paper-reading/09-contextweave-workflow-benchmark), [Agent Trajectory Sentinel](/en/paper-reading/14-agent-trajectory-sentinel), and [ADIAS issue-centric optimization](/en/paper-reading/20-adias-issue-centric-agent-optimization): those readings help separate final-state from trajectory evaluation and place benchmark scores alongside issue scope, observability, and feedback loops.

## Why existing benchmarks are insufficient

A conventional bug-fix task can compress success into “a regression test changes from fail to pass.” Refactoring usually has a larger blast radius: rename or move an API, update multiple callers, synchronize configuration and documentation, and preserve existing behavior. Running only the tests nearest the issue can make a local patch look successful without completing the migration.

The paper therefore defines tasks around an outcome: the agent starts from a pre-refactor commit and a natural-language issue, edits a preconfigured Docker repository with a full test suite, and is resolved only when every test passes. The agent does not need to reproduce the gold patch's exact actions, and the action trace is not itself the success metric. This makes the metric clear, but also makes benchmark validity depend heavily on test coverage.

This “scale-up” is not rhetorical. Figure 1 places ProMax and earlier benchmarks on the same distributions: 30% of ProMax instances modify more than 10 files and 32% change more than 200 LOC, while 86% of SWE-bench Verified instances modify only one file. The evaluation unit therefore moves from “does a local patch pass?” toward “does a set of changes remain consistent across the repository?” That does not mean that more files automatically make a task representative of every real maintenance workflow.

![SWE-Bench ProMax Figure 1: distributions of modified files and lines of code across benchmarks.](https://arxiv.org/html/2608.09802v1/breakdown_side_by_side.svg)

*Figure 1, the scale comparison in paper Section 1: the left panel shows modified files per instance and the right panel shows modified lines of code. [Original Figure 1 anchor](https://arxiv.org/html/2608.09802v1#S1.F1); image from the [arXiv HTML figure endpoint](https://arxiv.org/html/2608.09802v1/breakdown_side_by_side.svg). The arXiv source is marked CC BY 4.0; attribution is preserved under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).*

## Core intuition

The paper's intuition can be compressed into one sentence: **enlarge a refactor's scope across files, modules, and languages, then make a complete test suite hold the agent accountable for the final state.**

The dataset pipeline has three stages:

1. **Automated collection:** Find GitHub repositories meeting star, license, and primary-language conditions, then collect post-January-2025 commits whose messages contain `refactor` but not `bug fix`, and that modify both test and non-test files.
2. **Environment validation:** Check the pre-refactor commit and gold patch in Docker; discard candidates whose environment or gold tests fail.
3. **Expert and LLM-assisted filtering:** Analyze refactoring scope, rewrite natural-language problem statements, filter for quality, and verify with humans. The process narrows 29,782 initial candidates to 170 tasks.

The value of this pipeline is not only scale. It separates “a commit looks like a refactor” from “a commit can become an evaluable agent task.” The tradeoff is that collection rules, human judgments, and test quality all enter the benchmark's measurement model.

![SWE-Bench ProMax Figure 3: the data-construction pipeline from candidate collection through environment validation and expert filtering.](https://arxiv.org/html/2608.09802v1/data_collection.png)

*Figure 3, the data collection and curation pipeline in paper Section 3.2: 29,782 initial candidates do not become benchmark tasks directly. They pass Docker/gold-patch validation, complexity filtering, problem rewriting, test review, and human verification before 170 remain. [Original Figure 3 anchor](https://arxiv.org/html/2608.09802v1#S3.F3); image from the [arXiv HTML figure endpoint](https://arxiv.org/html/2608.09802v1/data_collection.png). The arXiv source is marked CC BY 4.0; attribution is preserved under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).*

## Walk one task through the benchmark

The following faithful walkthrough is derived from Sections 3–4 and Appendix C; it does not invent private details about a particular instance:

1. **Input:** Give the agent a repository at the pre-refactor commit, a natural-language issue, a preconfigured Docker environment, a full test suite, and a gold patch used as the reference change.
2. **Planning and edits:** The agent reads code, searches symbols, edits source/test/config files, and repeatedly runs tests under a 300-step and $10-per-instance budget.
3. **Decision:** The system checks only whether the final repository passes the complete test suite. It records resolve or unresolved. It does not require the diff to equal the gold patch and gives no partial score for “finding the core files.”
4. **Typical success:** The agent edits the definition and all call sites, updates types or interfaces, synchronizes tests and required documentation, and passes the full suite.
5. **Typical failure:** The agent edits the core area represented in the gold patch but misses peripheral call sites, configuration, documentation, or tests. Figure 5 identifies this incomplete refactoring pattern as a dominant failure mode.

The walkthrough shows that the benchmark tests **global consistency under a bounded execution loop**, not whether a model can produce a plausible-looking code snippet.

## Dataset and task construction

The final dataset has 170 tasks from 70 repositories:

| Language | Tasks | Repositories | Avg. gold-patch files | Avg. gold-patch LOC |
| --- | ---: | ---: | ---: | ---: |
| Python | 29 | 18 | 10.6 | 299.8 |
| Java | 26 | 11 | 20.8 | 309.8 |
| TypeScript | 28 | 2 | 11.9 | 122.6 |
| Go | 23 | 16 | 16.0 | 227.4 |
| C | 20 | 9 | 17.9 | 424.1 |
| C++ | 22 | 9 | 21.4 | 196.3 |
| Rust | 22 | 5 | 14.5 | 284.8 |

Across all tasks, the gold source patch changes an average of 11.4 files, 261.6 LOC, and 8,179.5 tokens; the maximum is 182 files, 4,503 LOC, and 72,623 tokens. Including the test patch, a task averages 15.9 files. As of 2026-08-13, the [Hugging Face dataset endpoint](https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax) exposes the data and evaluation metadata; it is a public dataset with `swe-bench-promax.json` and `eval.json`, not merely a leaderboard.

The multi-label task analysis is also important: Cleanup is 66.5%, API Interface Change 65.3%, New Feature 43.5%, and Bug Fix 41.2%; 46.5% of instances span at least three categories. The analysis labels 99.4% as requiring cross-file reasoning and 98.8% as involving API semantics. In other words, “refactoring benchmark” contains compound maintenance work, not only renaming.

Figure 9 in Appendix B breaks that structure into required skills: 99.4% of instances require cross-file reasoning, 98.8% require API semantics, 97.1% require interface-contract reasoning, and 91.8% require pattern matching. These percentages come from a Claude Sonnet 4.6-assisted multi-label analysis, not from resolve-rate conditions or an independently human-scored ability test. They are useful for describing the intended task mix, not for proving that an agent actually used a particular reasoning process.

![SWE-Bench ProMax Figure 9: required reasoning skills annotated across instances.](https://arxiv.org/html/2608.09802v1/reasoning_abilities.svg)

*Figure 9, the task-skill distribution in the Appendix B section “Required skills”: cross-file reasoning, API semantics, interface contracts, and pattern matching appear across nearly the entire collection. [Original Figure 9 anchor](https://arxiv.org/html/2608.09802v1#A2.F9); image from the [arXiv HTML figure endpoint](https://arxiv.org/html/2608.09802v1/reasoning_abilities.svg). The labels were assisted by Claude Sonnet 4.6 and are analysis-only; the arXiv source is marked CC BY 4.0 and is reused here under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/) with attribution preserved.*

## Evaluation mechanism

### 1. Resolve rate: strict but flat final-state scoring

For instance $i$, one run's outcome can be written as:

$$r_i = \mathbb{I}[\text{all tests pass after the agent stops}]$$

The benchmark resolve rate is:

$$\text{ResolveRate}=\frac{1}{N}\sum_{i=1}^{N}r_i$$

The benefit is repeatability and easy comparison without treating the gold patch as the only valid solution. The limitation is just as clear: a patch that misses one peripheral call site and a patch that makes no progress are both zero; untested behavior remains invisible; intermediate reasoning and risk management do not affect the score.

### 2. Two scaffolds under the same budget

The paper runs mini-SWE-agent and OpenHands with six frontier or open-weight models, under the same 300-step, $10-per-instance cap and Docker environment. The comparison is not an abstract model score:

$$\text{Outcome}=f(\text{model},\text{scaffold},\text{task},\text{tests},\text{budget})$$

Scaffold interaction is therefore part of the result, not just noise. GPT-5.2 rises from 21.8% with mini-SWE-agent to 41.2% with OpenHands, while Gemini-3-Pro drops from 26.5% to 19.4%. Opposite changes like these are why the model name alone is insufficient.

### 3. Cost and steps are auxiliary signals

The paper reports average steps and API cost so we can see whether an agent trades more exploration for success. Cost is measured model/API usage, not full infrastructure TCO; steps are not synonymous with productivity. Qwen3.5 uses many steps under both scaffolds without reaching the top resolve rate, suggesting unproductive loops rather than deeper reasoning.

## How to read the evidence

### Table 3: the winner is a model–scaffold pair

| Scaffold | Model | Resolve rate | Avg. steps | Avg. cost |
| --- | --- | ---: | ---: | ---: |
| mini-SWE-agent | Claude Sonnet 4.6 | 30.6% | 99.5 | $2.32 |
| mini-SWE-agent | GPT-5.2 | 21.8% | 25.2 | $0.19 |
| OpenHands | Claude Sonnet 4.6 | 38.8% | 117.9 | $4.77 |
| OpenHands | GPT-5.2 | **41.2%** | 115.1 | $3.60 |
| OpenHands | GLM-5 | 36.5% | 114.2 | $0.24 |
| OpenHands | Qwen3.5 | 36.5% | 141.2 | $0.78 |

The 41.2% is the highest result for OpenHands + GPT-5.2 under this protocol, not “GPT-5.2's general SWE ability.” GLM-5 is also notable: at 36.5%, its average cost is $0.24, about one-twentieth of Claude Sonnet 4.6's $4.77. That is an API-cost efficiency signal inside the benchmark, not a guarantee of enterprise total cost.

### Language slices: no model dominates every language

Under OpenHands, the per-language leaders are split: GPT-5.2 reaches 48.3% on Python and 75.0% on C; Claude reaches 53.6% on TypeScript and 63.6% on Rust; GLM-5 leads Java at 34.6%; Kimi-K2.5 leads Go at 43.5%; and Qwen3.5 leads C++ at 54.5%. This looks more like an interaction among model training, scaffold behavior, repository distribution, and task patterns than a clean ranking of language difficulty.

The 28 TypeScript tasks come from two repositories, including 25 from Angular. Go has 23 tasks from 16 repositories. TypeScript scores are therefore more exposed to one ecosystem and its project conventions. That is a sampling boundary, not necessarily a dataset flaw; it must simply be stated when interpreting the slice.

### Figure 5: agents often find the core without completing the migration

![SWE-Bench ProMax Figure 5: the gap between agent and gold-patch file coverage, plus interaction rounds for resolved and unresolved runs.](https://arxiv.org/html/2608.09802v1/failure_analysis_cdf.svg)

*Figure 5, the agent-behavior analysis in paper Section 5.2: the left panel compares modified-file CDFs for Claude Sonnet 4.6 and Kimi-K2.5 with the gold patch; the right panel compares interaction-round CDFs for resolved and unresolved runs. [Original Figure 5 anchor](https://arxiv.org/html/2608.09802v1#S5.F5); image from the [arXiv HTML figure endpoint](https://arxiv.org/html/2608.09802v1/failure_analysis_cdf.svg). The arXiv source is marked CC BY 4.0; attribution is preserved under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).*

The left side of Figure 5 compares the number of files changed by agents and gold patches. Agents usually edit fewer files, and the gap widens as the gold patch grows. This supports incomplete refactoring as a dominant failure mode: the agent finds the main definition or the files near a test but does not trace peripheral call sites, documentation, configuration, or cross-module dependencies.

The right side shows early, steep pass curves and later, gradual fail curves. Failed runs use more rounds and often enter edit–revert–reread loops. This does not mean that “thinking longer” is useless; it means search coverage, the remaining migration surface, and the stopping reason should become trajectory telemetry instead of simply increasing the step limit.

### Cost and steps: more is not automatically better

With OpenHands, Qwen3.5 averages 141.2 steps and reaches 36.5%; Claude averages 117.9 steps and reaches 38.8%; GPT-5.2 averages 115.1 steps and reaches 41.2%. mini-SWE-agent shows a similar signal: Qwen3.5 averages 155.4 steps at 20.6%, while GPT-5.2 uses 25.2 steps at 21.8%.

The safer interpretation is that a step budget is an opportunity, not a quality score. The engineering problem is how to shrink the search space faster using the file graph, test failures, and repair signals.

## Evidence map

- **Directly supported by the paper:** the 170-task, seven-language, 70-repository composition; Table 2 patch sizes; Table 3 model/scaffold resolve rates, steps, and costs; Figure 5 file coverage and failure behavior; and Appendix A repository/license statistics.
- **Author analysis:** long-horizon cross-file coordination is the major bottleneck; agents often find the core change but miss peripheral surface; the benchmark adds pressure missing from Python-centric, short-horizon bug-fix evaluation.
- **Engineering inference in this reading:** coding-agent evaluation should record scaffold, test coverage, repository concentration, and change-surface coverage together; one pass rate is not enough to localize failure.
- **Not established:** the results do not show that an agent performs reliably on unseen enterprise repositories, codebases without complete tests, production migrations requiring human review, or different cost and GPU configurations.

## Limitations and unsupported interpretations

First, this benchmark is mined from public GitHub history. Commit selection, exclusion rules, human rewriting, and test validation shape the task distribution. The paper documents a funnel from 29,782 candidates to 170 tasks, but that is not the same as a representative sample of all real refactoring.

Second, passing tests is necessary, not synonymous with full correctness. If the gold patch's tests do not cover documentation, migration scripts, performance, security, or backward compatibility, resolve can overestimate patch quality; flaky or environment-sensitive tests can also give a zero to a patch moving in the right direction.

Third, language slices are unbalanced and repository concentration is visible. TypeScript's Angular concentration makes it unsuitable as a cross-language difficulty test; the appendix classifications also use Claude Sonnet 4.6 for LLM-assisted analysis, and those labels are research analysis rather than instance success conditions.

Fourth, a 300-step and $10 cap is a useful comparison protocol but also an external-validity boundary. A production agent may use different tools, parallel workers, build caches, private code search, human checkpoints, or a longer time budget. These results do not directly transfer to those settings.

SWE-Bench ProMax therefore **has not established** that an agent can reliably complete arbitrary large refactors, that pass rate equals mergeability, that benchmark cost equals TCO, or that one model is better across every language and repository family.

## Artifacts and reproducibility

As of 2026-08-13, I verified that the [Hugging Face dataset](https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax) is public at revision `86fce26c694c5c362efd6bf116bee142b447b578`; the README, `swe-bench-promax.json`, and `eval.json` are directly accessible. The dataset card exposes the test split, 170 tasks, and seven languages, while `eval.json` contains evaluation-script metadata for each instance. **The data and evaluation metadata are available as of that date.**

The paper and dataset card do not expose an official model-checkpoint and scaffold-code path that I could verify for clean-room reproduction of every Table 3 result. The Hugging Face metadata also does not declare a separate dataset license; the paper says that source-repository open-source license conditions were respected. I therefore separate the artifact status into:

- **Available:** paper v1, public dataset endpoint, README, primary JSON, and evaluation metadata.
- **Unverified:** complete scaffold commit, model checkpoints, execution image, prompt/tool versions, all cost-calculation settings, and one-command result reproduction.
- **Engineering caution:** internal use still requires checking each source repository's license, redistribution rights, and Docker build/network/secret policy.

The smallest useful reproduction should pin the dataset revision, select one language and a small set of instances, fix the model, scaffold, step/cost cap, then save the patch, full test log, modified-file count, step trace, and cost record before applying the paper's resolve rule. Do not call “downloadable JSON” end-to-end reproducibility.

## Engineering decision and when not to use it

**Use it for:**

- Testing large API migrations, cross-file refactors, and multilingual repository maintenance rather than one-function bug fixes.
- Preserving full test results, modified-file surface, failure reasons, steps, and cost, while keeping resolve rate separate from patch review.
- Comparing the interaction of model, scaffold, and budget when selecting an agent workflow rather than producing only a model leaderboard.

**Do not treat it as proof of:**

- Mergeability. Production still needs human review, security and license scanning, migration rehearsal, rollback, and checks for untested behavior.
- Language ability rankings. Inspect repository concentration, task categories, and sample sizes before reading a slice leader as a capability claim.
- Deployment TCO. Add compilation, containers, parallel workers, caches, retries, and human intervention.

If I turned this benchmark into an internal gate, I would add three companion metrics: **change-surface recall** (how many required files, marked by the gold patch or reviewers, were covered), **test-gap review** (which behaviors remain unverified after tests pass), and **recovery efficiency** (steps/cost from the first failure to finding the missing call site). These are not reported paper results; they operationalize the failure mode that the paper reveals.

## Three things to remember

1. **The question changed:** SWE-Bench ProMax asks not only whether an agent can fix a bug, but whether it can reach a cross-file final state in a multilingual codebase.
2. **Split the headline:** 41.2% is the OpenHands + GPT-5.2 pair result; scaffold effect, language/repository distribution, and cost/steps explain why that number exists.
3. **The bottleneck is coverage:** agents often find the refactor's core and miss the peripheral surface. Future benchmarks and production telemetry should track which files changed, which remain, and why the agent stopped.

## Primary sources

- [SWE-Bench ProMax full arXiv HTML (v1, 2026-08-10)](https://arxiv.org/html/2608.09802v1)
- [SWE-Bench ProMax arXiv abstract and version record](https://arxiv.org/abs/2608.09802)
- [SWE-Bench ProMax paper PDF](https://arxiv.org/pdf/2608.09802v1)
- [SWE-Bench ProMax Hugging Face dataset](https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax)
- [SWE-Bench ProMax dataset README](https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax/raw/main/README.md)
- [COLM 2026 accepted papers (title/version discrepancy reference)](https://colmweb.org/AcceptedPapers.html)
