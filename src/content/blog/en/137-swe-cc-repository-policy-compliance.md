---
title: "SWE-CC: Passing Tests Can Still Break Repository Rules"
description: "SWE-CC turns 823 contribution policies from 12 open-source projects into executable checks, showing what test results and resolve rates leave out of coding-agent evaluations."
pubDate: 2026-10-08
updatedDate: 2026-10-08
tldr:
  - "SWE-CC checks 823 machine-checkable repository policies across 12 open-source projects and 500 SWE-bench-derived tasks."
  - "The authors report violations in 43.1% of applicable policies; among functionally resolved runs, 50.3% of violations occurred during intermediate execution rather than only in the final patch."
  - "Coding-agent evaluations should measure policy retrieval, tool-use trajectories, and deliverables alongside functional tests."
audience:
  - "Engineers evaluating or deploying coding agents"
  - "Maintainers setting contribution policies for open-source repositories"
category: "AI Engineering"
tags: ["AI Agent", "Software Engineering", "Evaluation", "Harness Engineering"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 47
kind: "article"
showToc: true
image: "/blog/137-swe-cc-repository-policy-compliance/title_image.webp"
---

A coding agent fixes a bug and passes the test suite, yet it may have skipped the project’s required test workflow, omitted a required AI-assistance disclosure, or submitted the change in a way the maintainers’ guidelines prohibit. A benchmark that looks only at the final patch and test result will not count those process failures.

The [SWE-CC paper](https://arxiv.org/abs/2610.06193) makes that gap measurable. It compiles 823 machine-checkable contribution policies from 12 open-source projects, then checks both agents’ intermediate actions and their final deliverables. Across the paper’s 500 tasks, the authors report violations in 43.1% of applicable policies. Even among functionally resolved runs, 50.3% of violations occurred during intermediate execution.

This is not a universal production violation rate, and it does not show that every violation leads to a rejected contribution or causes harm. The narrower lesson is clear: **functional correctness and repository-policy compliance are separate dimensions of contribution quality.**

> **Huahua in one sentence**
>
> A patch passing its tests shows that it works under those tests; it does not prove the agent followed the repository’s contribution rules.

## What does SWE-CC check?

Coding benchmarks commonly judge whether an issue is resolved and whether tests pass. That answers whether the code appears to fix the problem, but not necessarily how the agent got there or whether the result follows this particular project’s contribution rules. SWE-CC checks two kinds of evidence:

- **Execution trajectory:** how the agent finds policies, which commands it runs, when it runs tests, and whether it follows required process order.
- **Final deliverables:** the code diff, commit message, pull request (PR) description, documentation, and other files produced for the task.

The policies come from each project’s own contributor documentation. They are not a universal style guide created by the researchers. The team collected contribution documents from 12 SWE-bench Verified repositories, extracted atomic policies, and retained 823 rules that had observable evidence, were within a contributor’s control, and expressed mandatory requirements. A rule such as “update the docstring when changing a function signature” applies only when that condition is met; a task that does not touch the relevant code is not penalized for it.

Each retained policy has a checker. The authors describe the scoring stage as using lightweight, deterministic programmatic checks rather than asking another language model to make a fresh judgment. They tested checkers against a passing case, a violating case, and a not-applicable case, then had two annotators with software-engineering experience inspect a sample of 150 checkers (18.2% of the 823). The paper reports 94.0% agreement on those sampled verdicts, a Cohen’s κ of 0.72, and acceptance of 87.2% of the sampled checkers. This is the paper’s reported construction validation; it is not an independent external rerun of the full benchmark.

## What is the denominator behind 43.1%?

SWE-CC separates policy applicability from compliance: did an agent’s work trigger a rule, and, if so, did the agent follow it? The paper’s abstract reports violations in 43.1% of applicable policies. That figure describes **the selected repositories, tasks, models, scaffolds, and checkers in this evaluation**. It should not be read as the general violation rate for all coding agents or GitHub contributions.

The study ran 500 end-to-end contribution tasks derived from SWE-bench Verified with four models, two agent scaffolds (mini-SWE-agent and OpenHands), and two policy-provision settings:

1. **Native:** The agent receives the locations of repository policy documents and must find and interpret them, closer to a setting where rules are distributed through a repository.
2. **Consolidated:** The extracted atomic policies are placed in one file for the agent to read, reducing policy-retrieval friction and testing whether explicit rules improve compliance.

Functional resolution rates across the four models and two scaffolds ranged from 74.6% to 94.4%, while policy compliance under Native ranged from 51.8% to 63.8%. Providing a consolidated policy file raised average compliance by about 8.75 percentage points. Functional resolution changed little, however, and substantial non-compliance remained. In other words, finding the rules matters, but seeing a rule does not mean an agent can or will follow it consistently.

The other striking result concerns timing. Among functionally resolved runs, the authors attribute 50.3% of policy violations to intermediate trajectories, such as running tests before committing when the project requires the reverse order. Those violations may leave no trace in the final code. A patch-only review cannot reconstruct process compliance after the fact.

## What the benchmark shows—and what it does not

SWE-CC’s contribution is not only the 43.1% result. It also makes repository-policy compliance a concrete evaluation design. Compared with an evaluation of the final patch alone, it observes three things together:

- **Whether policies were found:** Did the agent attempt retrieval, and did the relevant text reach its context?
- **Whether the process followed them:** Did tool calls, command order, and testing workflow conform to the rules?
- **Whether the deliverable followed them:** Did the final code, commit, PR text, and documentation meet checkable requirements?

Still, this is a bounded author-run study. Its sample covers 12 selected open-source projects and 500 SWE-bench-derived tasks; it cannot stand in for every repository, language, work type, or maintainer decision. The 823 rules also cover only requirements the authors considered explicit, checkable, and within a contributor’s control. Ambiguous advice, subjective judgment, and obligations that cannot be verified from run artifacts do not fit the same measurement.

The authors’ public repository includes exported outcomes for all 8,000 experiment runs, per-policy verdicts, checkers, tests, and execution code, along with one complete example trajectory. But it **does not include all 8,000 historical trajectories**, so outside researchers cannot re-grade every action from the original runs. The paper describes its human sample-audit procedure and findings, but the repository does not release the independent checker-audit ratings. I found no independent external rerun of the study.

Finally, a checker’s policy violation is not proof that a maintainer would reject the PR, nor that each violation caused user harm, a defect, or measurable review overhead. A more defensible reading is that resolve rate alone leaves some observable repository-governance failures out of the picture.

> **Huahua's engineering note**
>
> Read compliance together with triggering and task-completion rates. An agent that does less may bring fewer rules into scope; a single ratio can mistake differences in work performed for a capability gain.

## How can teams apply this idea?

If you evaluate coding agents, you do not need to turn every repository rule into a large benchmark on day one. Start with a small set where inputs, outputs, and exceptions can be stated clearly:

1. **Choose rules that can affect a merge.** Examples include required test commands, protected paths, and mandatory commit or PR fields. Separate recommendations from hard requirements.
2. **Record what the agent actually did.** Capture policies it read, tools it ran, their order, and the files it submitted. Without that evidence, process rules cannot be checked.
3. **Make checks conditional.** Judge a policy only when the task changes the relevant files or triggers the corresponding process. Preserve unknown outcomes when evidence is missing instead of silently counting them as passes.
4. **Report function and governance separately.** Track resolve rate, policy triggering, compliance among applicable rules, and withheld or unjudgeable outcomes so one score does not hide trade-offs.
5. **Sample high-impact checks manually.** Look for checkers that misread policies or mistake an exception for a violation; set the balance between automatic checking and human review according to risk.

This connects to evaluation, state, and observability in the [AI Agent field guide](/en/blog/64-ai-agent-guide/): an agent’s claimed success needs inspectable evidence, not just a final message saying “done.” If policies involve permissions, sensitive data, or external tools, see the [enterprise AI agent security architecture](/en/blog/43-enterprise-ai-agent-security/). For how rules enter an agent harness, continue with the [Harness Engineering reading map](/en/blog/13-harness-engineering-reading-map/) and the [Agentic AI platform contract](/en/blog/93-agentic-ai-platform-contract/).

SWE-CC should not be treated as an incident rate for every coding agent in production. It is a reminder about evaluation design: **to know whether an agent can make an acceptable contribution to a repository, inspect what it found, what it did, and what it left behind.**

## Sources

- Truong et al., 2026, [*Correct Code, Broken Contributions? SWE-CC: Benchmarking Repository Policy Compliance for Coding Agents*](https://arxiv.org/abs/2610.06193); [HTML full text](https://arxiv.org/html/2610.06193v1).
- [SWE-CC benchmark, checkers, tests, and result data](https://github.com/dangtruong01/swe-cc-arxiv).
