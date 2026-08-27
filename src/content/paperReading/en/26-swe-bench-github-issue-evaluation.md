---
title: "SWE-bench: Real GitHub Issues as Evaluation, but 1.96% Is Not a Model Ceiling"
description: "A source-grounded reading of Jimenez et al., ICLR 2024 Oral: the evaluation unit is a real GitHub issue, a full Python repository, and tests. Claude 2 resolves 1.96% under BM25; that number is a protocol, not a model ranking."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "SWE-bench's evaluation unit is a real GitHub issue plus a full Python repository plus tests: the model must emit a patch that applies and that passes both fail-to-pass and pass-to-pass tests. The 2,294 tasks come from 12 popular Python packages."
  - "Headline numbers need a protocol label. Claude 2 resolves 1.96% under BM25 with a 13k context (abstract / Table 2). Under oracle retrieval, Claude 2 is 4.80% and GPT-4 is 1.74% (Table 18; GPT-4 on a 25% subset). Do not write those two pairs as one sentence about model ability."
  - "Resolve is binary. It does not score patch maintainability, untested behavior, review quality, or traces. Python plus issue-fix is the denominator; this site's SWE-Bench ProMax note is a later change of that evaluation device, not proof that models got 41% better on the same test."
audience:
  - "AI engineers putting coding-agent scores into internal reports who first need to ask whether the number measures the model, retrieval, or the test suite."
  - "Technical leads who need to separate SWE-bench, ReAct, Toolformer, and later ProMax into an evaluation substrate, an acting contract, a training filter, and a later harder slice."
tags: ["Paper Reading", "Agent Systems", "Evaluation", "Software Engineering", "Benchmark"]
image: "/paperReading/26-swe-bench-github-issue-evaluation/title_image.webp"
field: "AI Engineering"
difficulty: "intermediate"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?"
  authors:
    - "Carlos E. Jimenez"
    - "John Yang"
    - "Alexander Wettig"
    - "Shunyu Yao"
    - "Kexin Pei"
    - "Ofir Press"
    - "Karthik Narasimhan"
  year: 2024
  venue: "ICLR 2024 Oral（arXiv 2310.06770 v3）"
  links:
    pdf: "https://arxiv.org/pdf/2310.06770v3"
    arxiv: "https://arxiv.org/abs/2310.06770"
    doi: "https://doi.org/10.48550/arXiv.2310.06770"
    code: "https://github.com/SWE-bench/SWE-bench"
    project: "https://www.swebench.com/"
series:
  id: "swe-bench-github-issue-evaluation"
  title: "SWE-bench Deep Dive"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Coding benchmarks such as HumanEval compress success into writing a self-contained function. Real software engineering is: read a GitHub issue, edit a repository with thousands of files, and let tests decide whether the issue is fixed. Prior scores do not measure that job.
- **Core insight:** Change the evaluation unit to a real issue plus a full Python repository plus tests. The model emits a patch; after unix `patch` applies it, every fail-to-pass and pass-to-pass test must pass before the instance is resolved. The changed control point is not a new agent architecture; it is **what counts as success**.
- **Strongest evidence:** Under BM25 retrieval and a 13k context, Claude 2 resolves **1.96%** (abstract, Section 1, Table 2). In the same protocol, Table 5 lists Claude 2 at 1.97% and also includes Claude 3 Opus at 3.79%. Under oracle retrieval, Claude 2 rises to 4.80% (Table 18). SWE-Llama reaches only 0.70% under BM25 and still mostly solves the simplest issues.
- **Main boundary:** Python, issue-fix, binary tests. Resolve does not score maintainability, uncovered behavior, or review. BM25 and oracle are retrieval conditions, not the same ruler. Later SWE-bench Verified, SWE-agent, and ProMax numbers **must not** be back-filled into this paper's tables.

My bounded verdict is: **what is worth keeping from SWE-bench is the evaluation contract of a real issue plus execution tests; what is not worth keeping is reading 1.96% as Claude 2's ability ceiling, or treating later agent-scaffold scores as model progress this paper already measured.**

> **Huahua in one sentence**
>
> 1.96% first answers how hard this protocol is, and only then which model is stronger. The protocol includes retrieval, a context cap, patch format, and the test suite; change one of those and the number is no longer the same object.

## Version and reading scope

This article reads the ICLR 2024 Oral paper by [Jimenez et al.](https://openreview.net/forum?id=VTF8yNQM66) in the [arXiv:2310.06770 v3](https://arxiv.org/abs/2310.06770) snapshot (updated 2024-11-11; first posted 2023-10-10). The v3 PDF and [arXiv HTML](https://arxiv.org/html/2310.06770v3) are marked CC BY 4.0. Beyond the abstract, I checked the three-stage construction and task definition in Section 2, dataset features in Table 1 / Figure 3, BM25 versus oracle in Section 4, resolve numbers in Tables 2 / 5 / 6 / 18, the Sphinx example in Section 5.1 and Figure 6, fail-to-pass judging in Appendix A, slices and failure types in Appendix C, and, as of **2026-08-27**, the still-reachable [swebench.com](https://www.swebench.com/), [SWE-bench/SWE-bench](https://github.com/SWE-bench/SWE-bench) (`princeton-nlp/SWE-bench` redirects here), and the Hugging Face dataset [princeton-nlp/SWE-bench](https://huggingface.co/datasets/princeton-nlp/SWE-bench).

This is a published ICLR Oral paper, not a preprint. Table 5 in v3 already lists Claude 3 Opus and GPT-4-turbo; those rows belong to this camera-ready snapshot, not to a later leaderboard. This article does **not** use SWE-agent, SWE-bench Verified, or SWE-Bench ProMax scores to explain this paper.

## The question a reader should actually answer

When language models already “write functions” on HumanEval, can we say they fix bugs in real repositories? SWE-bench's answer is no: success must become “for this real issue, on this full codebase, emit a patch that tests accept.”

The precise reading is not “does Claude 2 have only 2% coding ability.” The real question is: **once success moves from single-function generation to fail-to-pass tests, how much of the remaining score is the model, how much is retrieval, how much is the test suite, and what can this binary number not tell an engineering team?**

## Evidence map

| Layer | Wording used in this article |
| --- | --- |
| **Paper directly supports** | 2,294 instances from 12 Python repositories (Table 10); Claude 2 at 1.96% under BM25 13k (Table 2); the BM25 summary in Table 5; oracle 4.80% / 1.74% in Table 18; repository slices in Figure 4; No-Op / Regression counts in Tables 22–23. |
| **Author claims** | Real software engineering is a sustainable, verifiable testbed for the next generation of LMs; proprietary models and SWE-Llama at the time resolve only the simplest issues. |
| **Not established** | 1.96% is not a model-ability ceiling; oracle files are not an engineer's prior; binary resolve is not mergeability; the conda-era execution context is not the later Docker harness as the same reproduction. |
| **Bloss0m engineering judgment** | Read SWE-bench as an evaluation substrate. ReAct / Toolformer teach how agents act and learn tools; [ProMax](/en/paper-reading/22-swe-bench-promax/) changes the denominator. Do not write the latter's 41.2% back into this paper's tables. |

The rest of the article keeps reported numbers, author claims, and engineering judgment in separate buckets. “Improvement” refers only to the paper's setup.

## Why the previous approach is insufficient

Section 1 states the 2023 gap cleanly. Benchmarks such as HumanEval are appealing because program outputs can be checked with unit tests, but the items are mostly self-contained problems invented for the benchmark and solvable in a few lines. Real bug-fixing requires locating code in a large repository, understanding cross-file dependencies, and changing a small error without breaking prior behavior. Prior scores were therefore both too easy to saturate and too far from production work.

The previous approach is insufficient not because “the model is not large enough,” but because **the success definition sits in the wrong place**: it measures single-function generation rather than whether a real issue is judged resolved by tests. SWE-bench changes that control point.

## Core intuition

Ignore the tables for a moment. Imagine an engineer receiving a Django GitHub issue: a documentation string is formatted wrongly under a specific setting. The job is not to write a function in an empty file. It is to clone that repository snapshot, read the issue, edit a few files, and run tests. Only passing tests counts as a fix.

SWE-bench writes that work contract into evaluation:

1. **Issue text** $P$: titles and descriptions of linked GitHub issues; discussion after the pull request's first commit is kept out of the prompt to avoid leaking the solution.
2. **Repository snapshot** $C$: the pull request's base commit. On average 3,010 non-test files and 438K lines (Table 1).
3. **Model output:** a `.patch` that names which lines to change.
4. **Judge:** apply the test patch $T$ and the predicted patch $\hat{\delta}$, then run tests. Every FAIL_TO_PASS and PASS_TO_PASS test must pass before the instance is resolved.

Gold patches edit 1.7 files, 3.0 functions, and 32.8 lines on average. Forty percent of instances have at least two fail-to-pass tests; the median number of pass-to-pass tests is 51. Success is therefore not only “make the new tests green,” but also “do not break prior behavior.”

This is not [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/): ReAct changes which next move is legal inside a prompt. It is not [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/): Toolformer changes whether a training string should insert one API call. SWE-bench **is not a new agent loop**; it is the substrate on which later loops get measured.

> **Huahua's engineering note**
>
> If 1.96% and 4.80% appear in the same paragraph, look for the retrieval label first. The former is BM25; the latter stuffs the files edited by the gold patch into context. An engineer usually does not know those files in advance. Oracle is an analytical upper bound, not a product default.

![SWE-bench Figure 1: tasks are built from real GitHub issues and merged pull requests; the model emits a patch that tests judge.](/paperReading/26-swe-bench-github-issue-evaluation/paper/figure-1-teaser.webp)

*Figure 1, paper Section 1: issue plus repository snapshot on the left, a model-generated patch in the middle, real tests judging resolve on the right. The figure teaches the evaluation unit, not a model score. The original figure is at [Figure 1](https://arxiv.org/html/2310.06770v3#S1.F1); the SVG endpoint is [teaser.svg](https://arxiv.org/html/2310.06770v3/teaser.svg). From the arXiv HTML, marked CC BY 4.0.*

## Walk one example through the method

The following walkthrough is the Sphinx task `sphinx-doc__sphinx-8713` from Section 5.1 and Figure 6, under **oracle retrieval**. It is the paper's own qualitative example, not an independent experimental score.

1. **Input:** the issue says Sphinx's napoleon extension does not format the documentation keyword `Other Parameters` correctly when `napoleon.use_param=True`. The prompt includes a suspected source location, a reproduction snippet, and package versions. The oracle setting inserts the full files edited by the gold patch, plus instructions and a diff example. Total input: 1,558 lines, 20,882 tokens.
2. **Intermediate representation:** the model does not see “write a function.” It sees issue text plus selected source files plus patch-format instructions. Under BM25, those files may not be the files that need editing (Table 3: at the 27k limit, about half the instances retrieve none of the oracle files).
3. **Model or system decision:** SWE-Llama edits the correct function, `_parse_other_parameters_section` at line 684 of `sphinx/ext/napoleon/docstring.py`, but makes it behave as if `napoleon.use_param` were **always** True. It does not read the config first or copy the branching in `_parse_parameters_section`, which is what the gold patch does.
4. **Output:** a patch that lands in the right file. After it applies, `test_parameters_with_class_reference` compares rendered docs with `napoleon_use_param=False` and immediately catches the error. The task is **unresolved**.
5. **Likely failure point:** editing the right function and emitting an applicable patch can still fail by ignoring a config branch, house style, or a cross-module constraint. Table 23 shows that most successfully applied patches are No-Ops (zero fail-to-pass tests pass) or Regressions (prior tests break). Figure 6 is the “right function, narrower logic than gold” case.

The example teaches that **tests are the judge**. Locating the function is not resolve; passing FAIL_TO_PASS and PASS_TO_PASS is.

![SWE-bench Figure 6: issue text, model patch, and test logs for the Sphinx task.](/paperReading/26-swe-bench-github-issue-evaluation/paper/figure-6-case-study.webp)

*Figure 6, paper Section 5.1: red marks deletions, green marks additions. The model edits the right function, ignores the config branch, and is caught by tests. The original figure is at [Figure 6](https://arxiv.org/html/2310.06770v3#S5.F6); the PNG endpoint is [case-study.png](https://arxiv.org/html/2310.06770v3/case-study.png). From the arXiv HTML, marked CC BY 4.0.*

## Technical mechanism

### How labels are built: three-stage filtering

Figure 2 / Section 2.1 reduce about 90,000 pull requests (Table 10 lists 93,139) to 2,294 tasks:

1. **Repo selection and scraping.** Pull requests are scraped from 12 popular Python repositories corresponding to highly downloaded PyPI packages in August 2023. Popular repositories tend to have better documentation, contributor guidelines, and test coverage.
2. **Attribute-based filtering.** Keep only pull requests that are **merged**, that **resolve at least one GitHub issue** (`fixes` / `closes` / `resolves` links in the title, body, or commits), and that **edit test files**. This step reduces 93,139 pull requests to 11,407 candidates (Table 10).
3. **Execution-based filtering.** Install $C$ in a version-specific conda environment, run tests, apply the gold patch, and run tests again. At least one test must change from fail to pass. Installation or runtime errors are dropped, as are tests that call functions or classes **first introduced in the gold patch**, because that naming is unfair even for humans. 2,294 instances remain.

Django contributes 850 tasks; Flask contributes 11 (Table 10). The headline rate is shaped by this denominator; it is not an equal average across 12 ecosystems.

Problem statement $P$ concatenates issue titles, bodies, and comments from **before** the pull request's first commit. `hints_text` is collected but unused in the reported experiments. The training set SWE-bench-train takes about 19,000 pairs from **37 disjoint repositories** and does not require test edits; sequences over 30,000 tokens are dropped, leaving about 10,000 effective training instances. That reduces train/test repository overlap; it does not prove that pretraining never saw these packages.

### How one input becomes 0 or 1 at evaluation

Section 4 admits that repositories do not fit in context (438K lines on average), so the baseline is **not an agent loop**. It is “retrieve files, then generate one patch”:

- **BM25:** the issue text is the query; file paths are prepended to documents. As many files as fit are retrieved under 13k / 27k / 50k token caps. Table 3: at 27k, all-recall versus oracle files is 39.83% and any-recall is 51.27%; about half the instances retrieve none of the gold files.
- **Oracle:** give the files edited by the gold patch (excluding test files). The authors say this is less realistic and not comprehensive—unedited files may still be required to understand behavior.

Prompt order: instructions, issue, retrieved files and docs, a patch example, then a request for a patch (Appendix D.3). Decoding is greedy, one generation per instance, aligned with Pass@1.

If applying the patch fails, the harness tries deleting extra context lines and recomputing headers (Appendix A.4 Step 6). If that fails again or tests cannot run, the instance scores 0.

The operational definition of resolve (Appendix A.4):

$$
\mathrm{Resolved}(\hat{\delta})=
\begin{cases}
1 & \text{if every FAIL\_TO\_PASS and PASS\_TO\_PASS test passes after applying }\hat{\delta},\\
0 & \text{otherwise.}
\end{cases}
$$

Adding FAIL_TO_PASS tests tightens “the new behavior this issue wants.” Adding PASS_TO_PASS tests tightens “prior behavior that must not break.” Dropping either class loosens the score and is no longer the paper's Resolve. % Apply only says the patch applied; it does not say tests passed. In Table 5, apply rates dwarf resolve rates because most applied patches are still No-Ops or Regressions.

![SWE-bench Figure 8: per-instance evaluation pipeline, from restoring the repo through applying tests and the predicted patch to comparing test logs.](/paperReading/26-swe-bench-github-issue-evaluation/paper/figure-8-evaluation.webp)

*Figure 8, paper Appendix A.4: during evaluation the Patch is model-generated. A prediction must apply and must reproduce the gold passing set on FAIL_TO_PASS / PASS_TO_PASS. The original figure is at [Figure 8](https://arxiv.org/html/2310.06770v3#A1.F8); the SVG is [pipeline-evaluation.svg](https://arxiv.org/html/2310.06770v3/pipeline-evaluation.svg). From the arXiv HTML, marked CC BY 4.0.*

SWE-Llama 7b / 13b fine-tunes only attention sublayers with LoRA, learning gold patches from oracle files plus the issue. Training took about 20 hours on 4×A100 for 7b and 47 hours on 8×A100 for 13b (Appendix B). The model is trained as if every file in context should be edited; the authors blame that shift for the especially poor BM25 scores.

## How to read the evidence

The shared protocol matters more than any single cell. The main setting is a **frozen model plus retrieved files plus one greedy patch**, not a SWE-agent-style multi-step tool loop. GPT-4 (`gpt-4-32k-0613`) is run, for budget reasons, only on a **25% random subset (574 instances)** for BM25 27k and oracle; GPT-4-turbo appears in v3 Table 5 under a different column. ChatGPT-3.5 is `gpt-3.5-turbo-16k-0613`.

### Table 2 and the abstract: the 1.96% headline is BM25, 13k

This table asks: under BM25, does a longer context raise resolve by retrieving more files? Retrieval and greedy decoding are held fixed; the token cap changes.

| Model | 13k | 27k | 50k |
| --- | ---: | ---: | ---: |
| Claude 2 | 1.96 | 1.87 | 1.22 |
| SWE-Llama 7b | 0.70 | 0.31 | 0.00 |
| SWE-Llama 13b | 0.70 | 0.48 | 0.00 |

Observation: the shortest window is best. Table 3 shows all-recall rising to 45.90% at 50k while the score falls to 1.22%. The authors' explanation is that unrelated code distracts the model from the lines that need editing. This **supports** “extra context is not free recall”; it **does not support** “Claude 2's true ability is 1.22%”—that cell is the 50k BM25 protocol.

The abstract, Section 1, and the opening of Section 5 all treat 1.96% as the headline. This article follows that line.

### Table 5: the BM25 summary, including models added in v3

Table 5 reports the main BM25 results and also SWE-bench Lite (300 instances covering 11 of 12 repositories, sampled to be more self-contained functional bug fixes; Appendix A.7).

| Model | Full % Resolved | Full % Apply | Lite % Resolved | Lite % Apply |
| --- | ---: | ---: | ---: | ---: |
| Claude 3 Opus | 3.79 | 46.56 | 4.33 | 51.67 |
| Claude 2 | 1.97 | 43.07 | 3.00 | 33.00 |
| GPT-4-turbo | 1.31 | 26.90 | 2.67 | 29.67 |
| SWE-Llama 13b | 0.70 | 53.62 | 1.00 | 38.00 |
| SWE-Llama 7b | 0.70 | 51.74 | 1.33 | 38.00 |
| ChatGPT-3.5 | 0.17 | 26.33 | 0.33 | 10.00 |

Claude 2's 1.97 versus the abstract's 1.96 is a one-tenth-point rounding difference; this article treats 1.96 as the headline and 1.97 as the Table 5 row, not as two experiments. Claude 3 Opus at 3.79% is a v3 table cell and is still BM25 one-shot generation, not a later agent scaffold. Apply rates of 26–54% against resolve below 4% mean most patches that apply still fail the tests.

This table **supports** “under this BM25 protocol, the strongest proprietary models of the time still resolve only a single-digit percentage.” It **does not support** substituting Lite's 3.00% for the full 1.96%, nor mixing GPT-4-turbo's 1.31% with Table 20's GPT-4 BM25 0.00% on the 25% subset into “the GPT-4 score.”

### Table 18: oracle is a retrieval upper bound, not a model gap in the same sentence

| Model | Oracle % Resolved | % Apply |
| --- | ---: | ---: |
| Claude 2 | 4.80 | 62.82 |
| SWE-Llama 13b | 3.97 | 66.78 |
| SWE-Llama 7b | 3.01 | 65.52 |
| GPT-4∗ | 1.74 | 34.00 |
| ChatGPT-3.5 | 0.52 | 21.80 |

∗GPT-4 is the 25% subset. Claude 2 moving from BM25 1.96 to oracle 4.80 shows that a substantial part of the headline is “the right files were never retrieved,” not merely “the model cannot write a patch.” SWE-Llama 13b is close to Claude 2 under oracle (91 versus 110 instances), but Claude 2 solves only 42% of the instances SWE-Llama solves; the two models are not solving the same “easy” slice. Table 6's oracle-collapsed setting (keep only gold-edited lines ±15) is an input ablation: it further lifts Claude 2 to 5.93% and GPT-4 to 3.40%, showing that even with the right files, extra lines still interfere. Table 23 is a failure-mode taxonomy, not another leaderboard.

This **supports** “retrieval and localization are separate confounders.” It **does not support** “oracle files equal a real engineer's working condition.”

### Figure 4, Table 7, and Table 23: slices, time, and failure type

![SWE-bench Figure 4: resolve rates across 12 repositories under oracle retrieval.](/paperReading/26-swe-bench-github-issue-evaluation/paper/figure-4-per-repo.webp)

*Figure 4, paper Section 5: the three models trend similarly across repositories, but `psf/requests` is clearly higher and `seaborn` is 0. The original figure is at [Figure 4](https://arxiv.org/html/2310.06770v3#S5.F4); the SVG is [per_repo_oracle_fig.svg](https://arxiv.org/html/2310.06770v3/per_repo_oracle_fig.svg). From the arXiv HTML, marked CC BY 4.0.*

Table 19 (paired with Figure 4) under oracle: Claude 2 reaches 15.91% on requests, 6.15% on django, 1.94% on sympy, and 0% on seaborn and flask. Embedded images appear in 32% of matplotlib instances and 10% of seaborn instances, versus 2% overall. Django's 850 / 2,294 instances pull the aggregate.

Table 7: under oracle, Claude 2 is 4.87 versus 4.23 before and after 2023; SWE-Llama 13b is 3.98 versus 3.85; the GPT-4 subset falls from 1.96 to 0.0. The authors read this as models being unlikely to “cheat” by emitting a newer snapshot of the repository. That **does not** prove pretraining never saw these packages; it only says that slicing by issue-creation year does not monotonically raise or lower most models.

Table 23 sorts successfully applied oracle patches into six classes. Claude 2: Applied 1,078, Resolved 110, No-Op 471, Regression 436. Most failures pass zero fail-to-pass tests. Binary Resolve records a partial fix as 0; if a product cares about partial progress, the metric flattens that signal.

![SWE-bench Figure 5: Claude 2 resolve falls as total input length and issue length grow.](/paperReading/26-swe-bench-github-issue-evaluation/paper/figure-5-context-length.webp)

*Figure 5, paper Section 5: total input length on the left, issue length on the right. Longer context accompanies lower resolve, matching Table 2's pattern of rising recall and falling score. The original figure is at [Figure 5](https://arxiv.org/html/2310.06770v3#S5.F5); the SVG is [swellama-issue-length-tokens.svg](https://arxiv.org/html/2310.06770v3/swellama-issue-length-tokens.svg). From the arXiv HTML, marked CC BY 4.0.*

## Limitations and threats to validity

Section 7's author limits can be used as an engineering checklist:

1. **Python only.** The authors hope the same collection procedure can extend to other languages; that is future work, not this evidence.
2. **The baseline is the most straightforward one-shot generation.** The authors explicitly do not constrain future agent or tool-augmented methods; later scaffold scores are therefore a **new protocol** and cannot be back-filled into Table 2.
3. **Execution tests alone are not enough.** The authors observe that model patches are often less complete, less efficient, and less readable than human solutions. Figure 10 uses cyclomatic complexity to show that a shorter patch can still inject complexity into a hot path.

These boundaries also have to stay on the table when reading the numbers:

- **1.96% and 4.80% are not a model gap in one sentence.** The difference is BM25 versus oracle.
- **GPT-4's 1.74% carries a star.** It is a 25% subset; on that same subset, GPT-4 BM25 27k is 0.00% (Table 20).
- **Django is 850 instances.** An unstratified total is not an equal sample of 12 ecosystems.
- **SWE-Llama's 0.70% under BM25 is a distribution shift.** It was fine-tuned on oracle files.
- **The paper's execution context is per-version conda, not Docker.** The official repository moved to a containerized harness on 2024-06-27. As of 2026-08-27, Docker is **later infrastructure**; do not write the 2024 camera-ready 1.96% as a Docker result.
- **Later Verified / Lite leaderboard / SWE-agent / ProMax numbers are not this paper's tables.** Lite's 300 instances already appear in v3 and may be cited from Table 5's Lite columns; the Verified 500 and ProMax 170 may not.

## Engineering decision and when not to use it

When is SWE-bench worth borrowing? When you need to measure whether a model can emit a test-passing patch on a real repository, and you are willing to write retrieval, context, patch format, and the test suite into the protocol note. Record separately: BM25 versus oracle, the context cap, % Apply versus % Resolved, and whether failures die on F2P or P2P.

When should this paper not be used as a construction drawing?

- If you need a thought–action–observation loop, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). SWE-bench's baseline has no such loop.
- If you need a training-side filter for when to call a tool, read [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/).
- If you need mid-training to teach tool affordances first, read [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/).
- If you need to keep a trajectory and rescore it later, read [A²E](/en/paper-reading/19-a2e-agent-auditing-engine/). SWE-bench success is a final-state test and does not store an agent trace.
- If you need cross-language, cross-file, behavior-preserving large refactors, read [SWE-Bench ProMax](/en/paper-reading/22-swe-bench-promax/). That later device changes the denominator: seven languages, 11.4 source files on average, and an explicit scaffold cross (OpenHands versus mini-SWE-agent). ProMax's 41.2% **is not** “models improved 41 points on the same 2,294 instances.”

> **Huahua's take**
>
> Treat SWE-bench as an evaluation contract: success must name the issue, the repository snapshot, the retrieval condition, and the test suite. Do not treat it as a model-ability ceiling, and do not write later scaffold scores into this 2024 table.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** the [arXiv abs](https://arxiv.org/abs/2310.06770), [v3 PDF](https://arxiv.org/pdf/2310.06770v3), and [HTML](https://arxiv.org/html/2310.06770v3) are readable; the license is CC BY 4.0. The OpenReview forum id is [VTF8yNQM66](https://openreview.net/forum?id=VTF8yNQM66).
- **Project page:** [swebench.com](https://www.swebench.com/) loads; it now includes later leaderboards and variants. **Do not** treat later numbers on that page as v3 Table 2.
- **Code:** [SWE-bench/SWE-bench](https://github.com/SWE-bench/SWE-bench) is reachable under the MIT License. `https://github.com/princeton-nlp/SWE-bench` redirects to the same repository. The README now defaults to Docker evaluation; that harness dates from 2024-06-27. Appendix A.3 of the paper describes per-version conda.
- **Data:** [princeton-nlp/SWE-bench](https://huggingface.co/datasets/princeton-nlp/SWE-bench) can be loaded with `split='test'`. That is a dataset endpoint, not “one command reruns Table 2.”
- **SWE-Llama checkpoints:** [princeton-nlp/SWE-Llama-7b](https://huggingface.co/princeton-nlp/SWE-Llama-7b) and [13b](https://huggingface.co/princeton-nlp/SWE-Llama-13b) load. Rerunning Table 2 still needs the original prompts, retrieval caches, and execution images.
- **Smallest useful reproduction:** load one instance, inspect the `FAIL_TO_PASS` / `PASS_TO_PASS` fields, apply the gold patch in a documented environment, and confirm tests move from fail to pass. That checks the judge's direction; it does not reproduce Claude 2's 1.96%.

## Three things to remember

1. **Technical idea:** SWE-bench redefines success as a real GitHub issue plus a full Python repository plus a test-passing patch, not HumanEval-style single-function generation.
2. **Evidence:** under BM25 13k, Claude 2 resolves 1.96%; oracle retrieval reaches 4.80%. Apply rates far exceed resolve rates; SWE-Llama is close to Claude 2 under oracle and almost cannot solve BM25.
3. **Boundary:** Python plus issue-fix plus binary tests. The score is a protocol. Later agent scaffolds, the Verified slice, and ProMax refactor tasks change the evaluation device and cannot be written back into this table.

## Further reading

SWE-bench asks what counts as coding success. If the next question is whether thought and environment actions should interleave, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). If the question is whether training should insert one API call, read [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/). If the question is whether a final-state test is enough and whether a rescorable trace should be kept, read [A²E](/en/paper-reading/19-a2e-agent-auditing-engine/). If the question is cross-language, cross-file, behavior-preserving refactoring, read [SWE-Bench ProMax](/en/paper-reading/22-swe-bench-promax/).

## Primary sources

- [Jimenez et al., “SWE-bench: Can Language Models Resolve Real-World GitHub Issues?,” ICLR 2024 Oral / arXiv:2310.06770 v3](https://arxiv.org/abs/2310.06770)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2310.06770v3)
- [OpenReview forum VTF8yNQM66](https://openreview.net/forum?id=VTF8yNQM66)
- [Project page](https://www.swebench.com/)
- [Evaluation code (MIT)](https://github.com/SWE-bench/SWE-bench)
- [Hugging Face dataset](https://huggingface.co/datasets/princeton-nlp/SWE-bench)
