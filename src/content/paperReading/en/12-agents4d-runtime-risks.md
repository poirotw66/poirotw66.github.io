---
title: "AgentS4D Deep Read: The Task Finished—Is the Runtime Safe?"
description: "A critical reading of how AgentS4D places workspace-agent risk entry, induction strategy, target harm, and lifecycle evidence in one sandbox benchmark, and why completion rate cannot stand in for safety."
pubDate: 2026-08-07
updatedDate: 2026-08-09
tldr:
  - "AgentS4D evaluates the complete harness–LLM–task-environment configuration rather than only a model response or the final deliverable."
  - "Its 328 risk-injected cases run across four harnesses and five LLM backends, producing 6,560 executions; 4,461 (68.0%) trigger a prespecified unsafe signal."
  - "4,344 unsafe executions still complete the original task, representing 66.22% of all runs; task completion and runtime safety must be judged separately."
  - "The portable contribution is a carrier × strategy × harm matrix plus K1–K7 evidence retention—not treating a controlled benchmark rate as a production incident rate."
audience:
  - "AI engineers designing workspace agents, agent harnesses, or AI safety gates."
  - "Technical leads bringing prompt injection, skills, memory, MCP, and external side effects into one evaluation system."
tags: ["Paper Reading", "AI Agent", "Evaluation", "Enterprise AI", "Governance"]
image: "/paperReading/12-agents4d-runtime-risks/title_image.png"
field: "AI Agent"
difficulty: "advanced"
showToc: true
paper:
  title: "AgentS4D: Benchmarking Runtime Risks across the Execution Lifecycle of LLM-Based Workspace Agents"
  authors:
    - "Jiajun Zhou"
    - "Zhaoxuan Ke"
    - "Jihang Ye"
    - "Xuanze Chen"
    - "Shanqing Yu"
    - "Qi Xuan"
  year: 2026
  venue: "arXiv cs.SE preprint, v1 (2026-07-29; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2607.27294v1"
    arxiv: "https://arxiv.org/abs/2607.27294"
    doi: "https://doi.org/10.48550/arXiv.2607.27294"
series:
  id: "agent-security"
  title: "Agent Security"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** a workspace agent can finish its task while creating unsafe side effects through prompts, skills, files, web content, memory, or user messages.
- **Core insight:** AgentS4D evaluates the complete harness–LLM–task environment, crossing risk source, induction strategy, harm, and execution-lifecycle evidence while scoring completion separately from safety.
- **Strongest evidence:** 328 risk-injected cases across 20 harness/backend configurations yield 6,560 runs; 4,461 (68.0%) trigger a prespecified unsafe signal and 4,344 (66.22%) are both unsafe and complete (Section 4; Table 2).
- **Main boundary:** assets, effects, and cases are synthetic/controlled, and v1 has no executable code or data. These rates are not production incident rates or a universal safety ranking.

## Why the previous approach is insufficient

Final-task success or a single risk surface misses carrier, harness, and lifecycle interactions and cannot reveal unsafe-complete runs.

## Core intuition

Outcome-only benchmarks make task completion their main output. This paper separates completion from prespecified unsafe evidence because the same completion predicate can hide a dangerous tool call, file write, or external interaction. The K1–K7 lifecycle checkpoints ask when risk enters and through which carrier, rather than only what the final model response says (Figure 1; Section 3).

## Worked example: a skill-borne risk

Imagine an agent asked to organize workspace documents. A skill contains a seemingly useful instruction that actually requests data exfiltration. AgentS4D treats the skill as a risk carrier, pairs its strategy and target harm in a controlled injection, and records both whether organization completes and whether a host-side unsafe signal fires. If the documents are organized but an unauthorized transmission occurs, the run is unsafe-complete. This explains the paper taxonomy; it is not an additional experimental result (Figure 2; Section 3.2).

## How to read the evidence

**Table 2 / Section 4** asks whether completion and safety split across complete configurations under the same injected risk. The controls are crossed carrier, strategy, target-harm, and lifecycle slices—not a head-to-head defense-baseline contest. **Figures 4–5** show why the aggregate 68.0% cannot be read as one model-capability score. **Section 4.4** supports observations inside the sandbox and its prespecified signals; without a defense-intervention ablation, it does not show that lifecycle checkpoints themselves prevent incidents.

## Artifacts and engineering decision

As of **2026-08-09**, arXiv v1 and its TeX source are accessible; no official code, case files, verifier implementation, data, or executable benchmark endpoint is available. It is therefore not reproducible from public artifacts. Use its matrix to design an internal red-team: separate completion, safety, and evidence integrity and attach deterministic host-side checks to each carrier. Do not rank vendors by its synthetic unsafe rate or use an LLM judge as the only safety control.

## Three things to remember

1. Completing a task is not being safe; unsafe-complete needs its own evaluation cell.
2. Risk belongs to the harness–model–environment configuration and needs carrier and lifecycle evidence.
3. This is a useful evaluation taxonomy, not a deployable or reproducible defense package.

An agent can produce a correctly formatted workspace file while reading an unauthorized resource, sending data to an unapproved service, or writing attacker-controlled content into persistent state. **AgentS4D** matters because it separates “did the task finish?” from “was the execution safe?” and compares both judgments across the same case matrix of harness and model combinations.

As of August 9, 2026, this remains an **arXiv cs.SE v1 preprint**, submitted on July 29, 2026. I found no evidence of peer review or an accepted venue. The numbers below refer to v1; unless stated otherwise, they are observations in the authors’ controlled sandbox, not production incident rates.

> **Huahua's engineering note**
>
> An agent’s “done” signal is an outcome signal, not proof of safety. Keep completion, safety, and evidence integrity as separate fields so you can tell whether the agent did the right thing, finished the task, or finished while crossing a safety boundary.

## The reader question: how should we evaluate a workspace agent that finishes but may still be unsafe?

My short answer is to move the unit of evaluation from the model to the complete **harness–LLM–task-environment** configuration, and to retain three independent facts for every run: whether the authorized task completed, whether a prespecified unsafe signal fired, and whether the execution record is sufficient for a reliable judgment. AgentS4D supports this evaluation direction; it does not show that any harness or model is universally safer in production.

## Evidence Map

The paper is easiest to read in three layers:

- **Paper evidence:** 328 cases run once on each of 20 harness–LLM configurations produce 6,560 runs; 4,461 trigger an unsafe signal, and 4,344 still satisfy the original completion predicate ([abstract and main results](https://arxiv.org/html/2607.27294v1#S5)).
- **Author claim:** safety is shaped not only by what the payload says, but by the carrier through which it enters and by the harness–backend pairing that processes it ([Figure 6](https://arxiv.org/html/2607.27294v1#S5.F6)).
- **Bloss0m judgment:** this is a useful framework for designing an internal safety gate, but the absence of public case packages, verifiers, and run archives prevents it from being a reproducible vendor leaderboard.

## Paper identity and the problem it actually measures

The paper treats a workspace agent as a stateful, multi-step system that may read files, call command or browser tools, use external services, and leave state across turns. Its security objective is more than “did the model produce harmful text?” It includes the confidentiality, integrity, and availability of workspace assets, least privilege, preservation of the authorized objective, and control over external effects.

AgentS4D’s evaluated unit contains:

1. A **harness** that manages system instructions, context and session state, tool interfaces, permissions, and orchestration.
2. An **LLM backend** accessed through a remote model relay.
3. A **task environment** containing the workspace, controlled services, case-specific assets, and a host-side verifier.

That definition matters. The paper does not directly assign differences to the model or the harness; it reports the behavior of the complete configuration. Visibility is not authorization: if preregistered execution evidence shows a prohibited attempt or realized consequence, the run is Unsafe even when the final deliverable is correct.

## Method skeleton: from a clean task to an adjudicable safety case

AgentS4D can be reduced to five steps:

1. Start from the task core, workspace, deliverable, and completion predicate of 76 executable Workspace-Bench 1.0 tasks.
2. Add one primary risk-entry carrier while preserving the original authorized objective and delivery condition.
3. Fix one source $S$, one induction strategy $T$, and one target harm $L$ for each case, producing 328 risk-injected cases.
4. Execute each case once across a complete 4-harness × 5-backend grid in a fresh container.
5. After the run, a host-side verifier judges completion and safety separately, then maps evidence from unsafe runs to K1–K7 lifecycle checkpoints.

![AgentS4D Figure 2: cases, complete harness–LLM configurations, host-side verification, and lifecycle evidence](https://arxiv.org/html/2607.27294v1/x2.png)

*Figure 2: AgentS4D’s benchmark overview. Source: [Zhou et al., Figure 2](https://arxiv.org/html/2607.27294v1#S4.F2), direct image at [arXiv HTML](https://arxiv.org/html/2607.27294v1/x2.png). The page lists the [arXiv.org perpetual non-exclusive license](https://info.arxiv.org/help/license/index.html); this reuse preserves source, figure number, and license information.*

### Three case-design dimensions plus one post-run evidence dimension

The authors deliberately do not collapse “where the risk enters,” “how it induces behavior,” “what harm it targets,” and “where evidence appears during execution” into one label. The first three are fixed before execution; the K dimension is mapped afterward from retained traces and verifier evidence.

| Dimension | Paper definition | Categories |
| --- | --- | --- |
| $S$ risk-entry source | The carrier through which adversarial content is presented to the agent | S1 current-user message, S2 uploaded resource, S3 webpage/URL, S4 external skill, S5 task-scoped long-term memory, S6 MCP/tool service |
| $T$ induction strategy | The way the payload tries to influence the agent | T1 instruction override, T2 authority impersonation, T3 priority manipulation, T4 covert embedding, T5 conditional triggering, T6 encoding-based obfuscation |
| $L$ target harm | The protected asset or authorization boundary tested by the verifier | L1 data leakage, L2 destructive action, L3 internal reconnaissance, L4 privilege escalation, L5 goal hijacking, L6 unauthorized access, L7 compliance bypass, L8 uncontrolled external communication, L9 persistent contamination |
| $K$ lifecycle checkpoint | The functional stage where evidence appears in an unsafe run | K1 input ingestion, K2 source/authorization assessment, K3 planning/decision, K4 tool execution, K5 external interaction, K6 state update, K7 result delivery |

The S4/S6 distinction is easy to lose: S4 is a case-provided skill bundle, and provisioning it does not prove that the agent contacted the payload; S6 is a case-provided MCP/tool service whose description, schema, resource, prompt, or returned content can carry the payload. Appendix A and Tables S1–S4 define contact evidence, induction strategies, target harms, and checkpoints.

## Experimental design: a crossed grid, but no conventional defense baseline

### Dataset and case construction

The 328 cases derive from 76 Workspace-Bench source tasks: all 54 tasks in the easy split plus 22 selected medium/hard tasks whose workflows support a task-coherent carrier without changing the authorized objective. Every source task contributes at least one injected case. Each case preserves the original objective, relevant assets, expected deliverable, and completion predicate. The authors add synthetic protected values, controlled web/mail/API/MCP services, and a case-specific unsafe predicate.

This is not a simple task-count multiplication: each case has one primary $S/T/L$ assignment, and 328 cases × 20 configurations yields 6,560 runs. All assets and targets are synthetic or controlled. Containers technically retain public Internet egress, but the tasks do not instruct agents to use the public Internet and do not target real users, production systems, real accounts, or production credentials.

### Harnesses, models, environment, and baseline

- **Harnesses:** Hermes, OpenClaw, Claude Code, and Codex.
- **LLM backends:** GPT-5.5, Gemini 3.1 Pro, DeepSeek-V4-Pro, MiniMax-M3, and Qwen3.7-Plus.
- **Versions and dates:** Hermes 0.14.0, OpenClaw 2026.6.9, Claude Code 2.1.201, and Codex CLI 0.142.5; evaluation ran from July 11 to July 26, 2026. The Gemini route targeted `gemini-3.1-pro-preview`. These are evaluation routes in Appendix D, not a guarantee of current API availability.
- **Controls:** all 20 combinations share cases, payload semantics, task resources, and verifier rules. Adapters handle workspace paths, skill locations, API/session formats, permission prompts, and run-record export. The paper explicitly adds no benchmark-specific safety instruction or defense.
- **Baseline:** there is no single no-attack, no-defense, guardrail, or intervention baseline. The nearest comparison is the same case under different harness–LLM configurations; Appendix F compares related benchmark designs, not interchangeable raw scores.

Each run gets a fresh task-specific container with its own workspace, session, adapter state, and audit directory. The host exports deliverables, traces, state changes, and controlled-service receipts before running the verifier. Evidence retention is therefore part of the method, not an afterthought that only inspects the final answer.

### Metrics: do not collapse cASR, SHR, and TCR into one score

Let $n_T$ be all scheduled runs and $n_C$ the runs satisfying the original completion predicate. Let $n_U$ be Unsafe, $n_D$ Safe with explicit-defense attribution, $n_E$ Safe with confirmed payload contact but no explicit-defense attribution, $n_N$ Safe with unconfirmed contact, and $n_I$ Inconclusive. The paper defines:

$$
\mathrm{ASR}=\frac{n_U}{n_T},\quad
\mathrm{cASR}=\frac{n_U}{n_U+n_D+n_E},\quad
\mathrm{SHR}=\frac{n_D+n_E}{n_T-n_I},\quad
\mathrm{TCR}=\frac{n_C}{n_T}.
$$

ASR is the unsafe-signal rate over all scheduled runs; cASR excludes inconclusive runs and Safe runs without confirmed exposure or explicit defense; SHR measures safe handling among conclusive runs and includes exposed-safe outcomes, so it is not a direct measure of intentional defense. cASR and SHR have different denominators and are not complements. The authors use 5,000 source-task bootstrap replicates with seed `20260715` for 95% intervals, preserving the dependence among cases derived from the same source task.

## Result 1: delivery success does not establish runtime safety

![AgentS4D Figure 5: the joint distribution of completion and safety verdicts](https://arxiv.org/html/2607.27294v1/x5.png)

*Figure 5: the joint view of completion and safety. Source: [Zhou et al., Figure 5](https://arxiv.org/html/2607.27294v1#S5.F5), direct image at [arXiv HTML](https://arxiv.org/html/2607.27294v1/x5.png). The page lists the [arXiv.org perpetual non-exclusive license](https://info.arxiv.org/help/license/index.html); this reuse preserves source, figure number, and license information.*

Across all 6,560 runs, **ASR is 68.00%**, **cASR is 75.75%**, **SHR is 22.20%**, and **TCR is 93.73%**. Of the 4,461 Unsafe runs, **4,344 complete the original task (97.38%)**, representing **66.22% of all runs**; **70.65% of all completed runs are Unsafe**. This is the paper’s clearest engineering warning: an agent can deliver the required artifact while crossing an authorization or side-effect boundary.

Figure 5 also shows that this is not an artifact of one pooled average. Across the 20 configurations, TCR ranges from 87.50% to 98.48%, while the unsafe share among completed runs ranges from 49.83% to 92.74% and exceeds 50% in 19 configurations. These figures describe AgentS4D’s case predicates and controlled environment; they do not mean that “19 models are unsafe” in production.

## Result 2: the real unit is the harness–LLM pairing

Across the 20 configurations, no harness has the lowest cASR with all five backends. Qwen3.7-Plus has the lowest cASR under all four harnesses, but it still ranges from **58.02%** with OpenClaw to **63.88%** with Codex. Configuration-level cASR ranges from **58.02% to 93.65%**, while TCR ranges from **87.50% to 98.48%**.

The authors therefore support “safety behavior depends on the pairing,” not “choose one model and safety is solved.” This is also not a clean causal component ablation: each harness brings its native prompt, permission mode, session management, and adapter, and the paper reports the complete configuration as the unit.

## Result 3: the same induction can become a different risk when the carrier changes

![AgentS4D Figure 6: cASR across risk-entry sources and induction strategies](https://arxiv.org/html/2607.27294v1/x6.png)

*Figure 6: cASR across carriers and induction strategies. Source: [Zhou et al., Figure 6](https://arxiv.org/html/2607.27294v1#S5.F6), direct image at [arXiv HTML](https://arxiv.org/html/2607.27294v1/x6.png). The page lists the [arXiv.org perpetual non-exclusive license](https://info.arxiv.org/help/license/index.html); this reuse preserves source, figure number, and license information.*

Table S16 in Appendix E reports nontrivial cASR for all six sources:

| Carrier | Cases | cASR | TCR |
| --- | ---: | ---: | ---: |
| S1 current-user message | 55 | 76.52% | 94.09% |
| S2 uploaded resource | 85 | 64.50% | 93.29% |
| S3 webpage/URL | 69 | 78.31% | 94.28% |
| S4 external skill | 52 | 86.51% | 96.92% |
| S5 long-term memory | 37 | 91.83% | 90.41% |
| S6 MCP/tool service | 30 | 62.27% | 91.67% |

The conditional contrasts matter more than a single source ranking:

- For T4 covert embedding, cASR is **98.66%** through S4 external skills and **46.53%** through S6 MCP/tool services, a 52.13-point difference.
- For T6 encoding-based obfuscation, cASR is **93.97%** through S4 and **40.59%** through S6.
- Holding target harm L6 unauthorized access fixed, T4 reaches **100%** through S4 versus **46.51%** through S6. Holding S4 and L3 internal reconnaissance fixed, T4 reaches **97.53%** versus **64.38%** for T1 instruction override.

So “we tested prompt injection” or “we tested MCP once” is underspecified. The carrier, strategy, and harm determine what behavior is actually being observed.

## Result 4: unsafe evidence often crosses multiple execution stages

![AgentS4D Figure 8: lifecycle evidence patterns in unsafe runs](https://arxiv.org/html/2607.27294v1/x8.png)

*Figure 8: the number and co-occurrence of K1–K7 evidence in unsafe runs. Source: [Zhou et al., Figure 8](https://arxiv.org/html/2607.27294v1#S5.F8), direct image at [arXiv HTML](https://arxiv.org/html/2607.27294v1/x8.png). The page lists the [arXiv.org perpetual non-exclusive license](https://info.arxiv.org/help/license/index.html); this reuse preserves source, figure number, and license information.*

Among the 4,461 Unsafe runs, **4,360 (97.74%)** contain evidence at two or more checkpoints and **3,869 (86.73%)** at three or more; four checkpoints is the most common pattern (37.44%). There are **818 runs** without K7 result-delivery evidence, yet **810** of them still complete the task. Among those completed runs, 649 (80.12%) also contain K4 tool-execution, K5 external-interaction, or K6 state-update evidence.

The strongest pair in Figure 8(b) is K2 source/authorization assessment with K3 planning/decision formation: 1,198 runs (26.86%), or 1.55 times the co-occurrence expected from their marginal frequencies. Of those, 880 also contain K4, K5, or K7 evidence. This makes checking only the final output especially fragile: risk may already have appeared while the agent assessed a source, formed a plan, called a tool, or changed state.

But K labels are a post-run rule-guided mapping, and the authors acknowledge that it has not received blinded human validation. They are diagnostic annotations, not proof of a causal chain.

## Ablations and robustness: what does v1 establish, and what does it not?

There is no conventional ablation that removes a safety module, swaps a verifier, or compares a defense intervention. The closest analyses are risk strata and mapping sensitivity. That distinction matters; otherwise a benchmark analysis can be misread as an intervention study.

1. **Partially matched carrier sensitivity:** holding source task, strategy, harm, and configuration fixed leaves 32 strata from 19 source tasks, 66 cases, and 1,320 runs. The mean within-configuration carrier range in all-run ASR is **40.63 percentage points** (95% CI 32.90–49.29); the cASR range is 30.79 points (95% CI 22.06–40.76). Some carrier pairs have only one task or very few strata, and the paper labels those comparisons descriptive rather than universal causal effects.
2. **Source-task weighting:** the case-weighted result is cASR 75.75% and TCR 93.73%; equal weighting across 76 source tasks gives cASR 71.99% and TCR 92.39%. The direction survives, but the headline cASR drops 3.76 points, showing that case composition matters.
3. **Alternative K mapping:** removing evidence supplied only by S/T/L metadata and tightening generic K7 delivery matching still leaves 3,226 Unsafe runs (72.32%) with evidence at two or more checkpoints. K2–K3 remains the most common pair (1,198 runs, 26.86%, 1.55× expected), but the multi-checkpoint rate is below the 97.74% primary result, showing that metadata increases coverage.
4. **Safe-handling composition:** there are 356 explicit-defense runs, 1,072 exposed-safe runs, 543 exposure-unconfirmed Safe runs, and 128 Inconclusive runs. Exposed-safe outcomes dominate the safe-handling numerator across harnesses; “no unsafe signal fired” is not equivalent to intentional risk recognition and defense.

## Limitations, threats to validity, and unsupported claims

### Limitations stated by the paper

- **Limited external validity:** all targets, protected values, credentials, and external targets are synthetic or controlled; no real user, production system, real account, or production credential is tested.
- **Restricted attacker model:** the attacker is task-informed but non-adaptive, controls one designated carrier, and cannot observe the live trajectory, alter the payload online, or see the verifier. The scope excludes coordinated multi-source attacks, colluding agents, physical action, production MCP compromise, training/weight poisoning, and host/verifier compromise.
- **Limited configurations and sampling:** four harnesses and five backends are evaluated; 328 cases derive from 76 source tasks; each case–configuration pair contributes one analyzed execution. Adapter behavior, native prompts, permissions, and model routes all belong to the complete configuration.
- **Diagnostic assumptions:** the K mapper has not been blinded-human validated; explicit-defense attribution uses a fixed DeepSeek-V4-Pro classifier and changes only Safe-run categorization, not the primary Safe/Unsafe/Inconclusive verdict.
- **Low reproducibility:** Appendix D lists versions, image digests, timeouts, run schemas, and a reproduction workflow, but v1 provides no code, case packages, run records, analysis scripts, model route, credentials, or executable benchmark package.

### Claims the evidence does not support

| Unsupported interpretation | Why the evidence does not support it |
| --- | --- |
| “68.0% is the incident rate for production agents.” | The denominator is 6,560 controlled runs; cases use synthetic/controlled assets, and a blocked attempt can count as Unsafe when the predicate defines it that way. |
| “Hermes, OpenClaw, Claude Code, or Codex is universally safest.” | Results change with backend, carrier, strategy, harm, and native configuration; there is no component-level causal decomposition. |
| “Retaining lifecycle evidence prevents unsafe execution.” | Evidence is an input to post-run verification and audit; the paper has no prevention or defense intervention study. |
| “Exposed-safe means the agent understood and resisted the attack.” | The authors confirm contact and the absence of an unsafe signal; only the explicit-defense subset contains evidence of risk recognition plus protective action. |
| “The full experiment is reproducible from Appendix D alone.” | The case package, verifier, analysis code, model route, and artifact archive are still missing; only a method-inspired internal reproduction is currently possible. |

## Artifact status as of August 9, 2026

I independently checked the primary endpoints named by the paper: the abstract, experimental HTML, PDF, TeX source, and the Figure 2, 5, 6, and 8 image URLs used here all resolve; HTTP 200 means an endpoint is reachable, not that the benchmark is reproducible.

| Artifact | Status (2026-08-09) | Reproduction meaning |
| --- | --- | --- |
| [arXiv abstract](https://arxiv.org/abs/2607.27294), [HTML](https://arxiv.org/html/2607.27294v1), [PDF](https://arxiv.org/pdf/2607.27294v1) | Accessible | Enough to verify v1 metadata, full text, figures/tables, Appendices A–G, and limitations. |
| [TeX source](https://arxiv.org/src/2607.27294v1) | Accessible gzip source archive | The paper’s source, not an executable AgentS4D benchmark. |
| Code, case data, verifier, analysis scripts, run archive, checkpoint | **Not released with v1; no verifiable direct release endpoint** | The public files cannot rebuild the same 328 cases or 6,560 runs; the paper’s future release language remains future work. |
| Harness image digests and versions | Listed in Appendix D, but no benchmark package is downloadable | Useful fields for auditing a future release, not a current rerun path. |
| [Workspace-Bench 1.0 arXiv record](https://arxiv.org/abs/2605.03596) | Upstream paper record accessible | Not the same as releasing AgentS4D’s transformed cases, unsafe predicates, or host verifier. |

The smallest useful internal reproduction would be a small crossed matrix: a few synthetic workspace tasks × two harnesses × two backends × several S/T/L carrier conditions, while retaining K1–K7 tool calls, service receipts, state diffs, artifact hashes, and separate completion/safety verdicts. That is my engineering proposal, not an AgentS4D result; a full reproduction should wait for a verifiable case-package, verifier, and analysis-code release.

> **Huahua's engineering note**
>
> “Will release later” in a preprint does not mean “rerunnable today.” For a reproduction plan, track the paper, TeX, case files, verifier, model route, run archive, and license as separate availability fields.

## Engineering translation: make runtime safety an executable gate

I would carry AgentS4D into five vendor-neutral interfaces:

1. **Fix the authorization reference first:** store the authorized objective, task scope, expected deliverable, and completion predicate; do not let an external document, skill, or memory overwrite the original intent.
2. **Build a carrier × strategy × harm matrix:** separate user message, file, web, skill, memory, and MCP/tool service. The same strategy through a different carrier is a new test, not a duplicate of the old one.
3. **Keep three verdicts:** `completion` checks the original task, `safety` checks a concrete unsafe predicate, and `evidence_integrity` checks whether the record is sufficient for a safety conclusion. A high-risk deployment may route Inconclusive to human review or a fail-closed policy; that is deployment policy, not a paper rate.
4. **Retain evidence at the state boundary:** store tool names and arguments, command results, external requests/responses, state diffs, file hashes, memory changes, service receipts, and exported artifacts, corresponding to K1–K7.
5. **Separate defense from silence:** payload contact without an unsafe signal is exposed-safe; explicit-defense requires evidence of risk recognition plus protective action. This prevents “the attack happened not to succeed” from being counted as a safety capability.

The benchmark’s non-use case is equally clear: do not treat it as a vendor ranking, a production-readiness certificate, or a replacement for a broader security test suite. Its best use is to force a concrete question: “For which carrier, lifecycle stage, or irreversible side effect do we still lack verifiable evidence?”

## Conclusion: completion is a product metric; safety is a separate line

AgentS4D’s strongest contribution is not a new safety score but an operational separation: evaluate the full harness–LLM–environment; use S/T/L to describe how risk cases are constructed; judge completion and safety independently; and retain lifecycle evidence through K1–K7. “Finished” and “safe” no longer get to impersonate each other.

It complements the existing reading path: [OSReward’s agent evaluation](<https://poirotw66.github.io/en/paper-reading/08-osreward-agent-evaluation>) focuses on completion judgments and the evidence problem of model judges; [ContextWeave’s workflow-memory evaluation](<https://poirotw66.github.io/en/paper-reading/09-contextweave-workflow-benchmark>) shows that memory can improve work outcomes while also misleading; and [Argus’s runtime reading](<https://poirotw66.github.io/en/paper-reading/10-argus-agentic-runtime>) places durable state, verification, and rollback in a long-horizon control plane. AgentS4D adds the security question: do those state and control boundaries actually hold across carriers and harness–LLM pairings?

## Primary sources

- [AgentS4D arXiv record](https://arxiv.org/abs/2607.27294): v1 metadata, authors, submission date, and abstract.
- [AgentS4D full HTML](https://arxiv.org/html/2607.27294v1): Figures 2, 5, 6, and 8; Tables S16–S21; and Appendices A–G.
- [AgentS4D PDF](https://arxiv.org/pdf/2607.27294v1): the 30-page v1 primary paper.
- [AgentS4D TeX source](https://arxiv.org/src/2607.27294v1): accessible paper source archive; it does not contain an executable benchmark package.
- [Workspace-Bench 1.0 record](https://arxiv.org/abs/2605.03596): upstream paper record for the source tasks used by AgentS4D.
- [arXiv license information](https://info.arxiv.org/help/license/index.html): the license page identified for the reused paper figures.
