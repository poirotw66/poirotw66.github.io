---
title: "MAGS Paper Reading: Formal Verification and the Boundary of Safety Specs"
description: "A deep reading of how MAGS translates agent-generated programs into Dafny, proves them against frozen specifications, and compiles them back; the reading separates 220 formal certificates from independent safety and functional results."
pubDate: 2026-10-05
updatedDate: 2026-10-05
tldr:
  - "MAGS translates agent-generated programs into Dafny, proves them against frozen API semantics and safety specifications, then compiles them back to the target language."
  - "The authors report Dafny-checked outputs for all 220 samples—100 CUDA kernels, 100 terminal programs, and 20 robotic-arm tasks. This means satisfying frozen specifications; it does not establish real-world safety or user intent by itself."
  - "Independent oracles show only 82/100 terminal outputs passing the external safety checks. Robotics functional preservation rose from 0/20 to 11/20 after adding task-success constraints, while safety checks remained 20/20."
  - "Each sample cost about 36–68 minutes and $8.60–$10.17 on average. The evidence supports a research direction for high-consequence tasks, not a drop-in guarantee for ordinary coding."
audience:
  - "Engineers building coding agents, formal-verification pipelines, or high-risk code-generation systems."
  - "Researchers evaluating agent safety, autoformalization, and machine-checkable guarantees."
tags: ["Paper Reading", "AI Agent", "Agent Security", "Evaluation", "Software Engineering"]
image: "/paperReading/89-mags-autoformalization-safety/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-safety-governance
  - tool-use-coding-agents
  - agent-evaluation-observability
paper:
  title: "MAGS: Multi-agent Auto-formalization Guarantees Safety for Agentic Outputs"
  authors:
    - "Albert Wu"
    - "Nicholas Roberts"
    - "Tzu-Heng Huang"
    - "Haoran Lin"
    - "Gil Friedman"
    - "Sungjun Cho"
    - "Gabriel Orlanski"
    - "Frederic Sala"
  year: 2026
  venue: "arXiv cs.AI preprint v1, submitted 2026-09-16; peer-review status not established"
  links:
    pdf: "https://arxiv.org/pdf/2609.19391v1"
    arxiv: "https://arxiv.org/abs/2609.19391"
series:
  id: "agent-formalization-safety"
  title: "Agent Program Generation and Formal Safety"
  part: 1
  totalParts: 1
---

This reading follows [arXiv v1](https://arxiv.org/abs/2609.19391), submitted on September 16, 2026. It is a preprint; peer review has not been established. MAGS asks a stricter question than whether generated code passes tests: can an agent-produced program carry machine-checkable safety properties while still doing the work it was meant to do? The authors run one agent pipeline across 100 CUDA kernels, 100 terminal programs, and 20 robotic-arm tasks. All 220 receive Dafny-checked outputs, but independent checks show that the guarantee still depends on whether the formal model captures the target environment. Eighteen terminal outputs fail the external security oracle, and a robot arm can become formally safe by barely moving. Those gaps are the best way into the paper's use of the word “guarantee.”

> **Huahua's engineering note**
>
> A verifier can guarantee that a program satisfies the specification it receives. It does not automatically prove that the specification expresses the user's real intent or accounts for every API, device, and environment.

## The paper in 90 seconds

- **Problem:** Unit tests, fuzzing, and static analysis find many bugs but cannot establish safety on untested inputs. Traditional formal verification can reason beyond a test suite, but expert specification and proof work are expensive for every agent-generated program (Sections 1–2).
- **Core insight:** Separate the language a program executes in from the language used to prove its properties. MAGS first constructs, audits, and freezes reusable Dafny semantics for a domain; it then embeds each program in that representation, repairs it from verifier feedback, and compiles it back to its target language (Section 3).
- **Strongest evidence:** Table 2 reports formal certificates for all 220 samples. Yet the independent domain-specific safety oracle passes only 82/100 terminal programs. Table 4 reports 0/20 initial robotics functional preservation, rising to 11/20 after lightweight task-success constraints, while independent safety checks remain 20/20 (Sections 4.1 and 4.3).
- **Main boundary:** The formal claim concerns a frozen specification and the corresponding compiled output. Semantic coverage, translation, symbol substitution, environmental assumptions, and the user's actual intent still require evidence of their own.

## Prior approach limitation: tests cover paths; specifications define the property

A program that does not fail in a test suite may simply not have reached a dangerous branch. Fuzzing, static analysis, and LLM-as-a-verifier can improve the odds of finding defects, but they do not cover every input. Formal methods offer a different kind of evidence: when the program and model satisfy a precise specification, a verifier can establish a property over the inputs described by that model rather than report only what happened on a finite set of tests. The cost is that specification construction and proof engineering have traditionally required experts. Faster code generation does not make it practical to handwrite and prove a new specification for every output (Introduction; Section 2).

MAGS changes how that work is allocated. It does not ask for a new hand-written proof specification for each generated program. Instead, it first builds reusable API semantics and safety requirements for each domain. Critic agents review those semantics; humans audit a sample; safe and unsafe probes test the resulting libraries; then the domain semantics are frozen. For each task, multiple agents translate, plan proofs, repair from Dafny feedback, and compile a verified result into the target language. One program-level pipeline can therefore handle CUDA, terminal programs, and robotic arms, while each domain still needs its own logical foundation and API model (Section 3).

The authors report that all 220 examples produce programs with “non-trivial safety guarantees” against the frozen specifications. This is a meaningful feasibility result, but it should not be read as “220 real programs have been proved safe.” The authors also use independent oracles precisely because verifier success establishes a property of the formal model; if that model omits a consequential effect, the formal result and observed safety can diverge.

## What to know first: a proof has a boundary

A **safety specification** describes conditions a program should not violate: for example, memory accesses must remain in bounds, threads must not race, or a robotic arm must avoid collisions. **API semantics** describe how a program's calls change an abstract state. **Dafny** is a language with specification and program-verification features; it encodes proof obligations through Boogie for an SMT solver such as Z3. In shorthand, the verifier proves that a program satisfies stated conditions under the modeled rules. It does not directly execute every possible world.

MAGS needs two abstraction layers. The first is a domain's logical foundation, which defines its state and safety primitives. CUDA, for instance, uses fractional permission-based separation logic to distinguish exclusive writes from shared reads. The second layer is API or module semantics: formal descriptions of the state transitions caused by calls, so the verifier can reason about program effects. Together they determine what counts as safe and which effects are visible to the model (Sections 3.1 and 4.1).

The scope of a formal conclusion can be stated as follows: if the frozen specification (S), the Dafny representation of program (P), and the verification-tool assumptions hold, the verifier establishes that (P) satisfies (S). This alone does not prove that (S) fully describes reality, nor that every behavior of the original source, compiled executable, and external environment is equivalent. MAGS strengthens different links with human semantic audits, independent probes, critics, deterministic symbol mapping, and held-out tests. Each adds a different kind of evidence; none should be collapsed into an unconditional claim of “safety.”

![Original paper Figure 1: Domain semantics begin with human-authored core logic, then agent extensions and critic and human audits; safe and unsafe probes run before the result is frozen.](/paperReading/89-mags-autoformalization-safety/figure-1-semantic-construction.jpg)

*Figure 1 (paper Section 3.1): This figure shows construction and checking of reusable semantics, not the per-program proof pipeline. Source: Albert Wu et al., *MAGS: Multi-agent Auto-formalization Guarantees Safety for Agentic Outputs*, arXiv v1, [Figure 1](https://arxiv.org/html/2609.19391v1#S3.F1). Reused under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license stated on the arXiv page.*

## Core intuition: separate semantic construction from each program's proof

If a proof agent can rewrite the specification while proving a program, the easiest way to clear a failed proof may be to weaken the safety condition. MAGS therefore puts reusable, human-audited, frozen domain semantics before per-program proof and repair. Agents working on an individual program may add helper lemmas or annotations and may modify the code when proof does not succeed, but they cannot revise the already frozen safety meaning. This separation is intended to keep the target from moving during proof (Section 3).

The key idea is not the number of agents; it is replacing “the model thinks it is right” with verifier feedback as the repair signal. Agents propose proof plans and run independent annotation-and-repair branches. A failed Dafny obligation gives a concrete point for the next attempt. The system rejects proof-bypass constructs such as `assume`, axioms, or disabled verification, and can try multiple solver seeds. A candidate counts as successful when Dafny accepts it within a budget of at most 25 total agent calls; attempts exceeding 500 seconds count as failures (Sections 3.2 and 4).

This design uses formal semantics and verifier feedback as the repair signal instead of model self-judgment or test pass/fail alone; it does not make those semantics infallible. MAGS has agents derive API behavior from official documentation, uses critics to review faithfulness, consistency, and modularity, manually audits a random 20% of generated semantics, and tests each semantic library with three safe and three unsafe probes generated independently of the semantics. The library is frozen before program verification. These steps improve the chance of detecting errors, but a 20% audit is not a full human review, and six probes do not exhaust every possible API behavior (Section 3.1).

## End-to-end worked example: walk a robotic-arm task through a representative failure

The following example reconstructs the robotics result from Section 4.3. It is not a verbatim task trace published in the paper; it connects the reported failure mode into one walkable scenario.

1. **Input:** An agent receives a task requiring an arm to manipulate an object. Its program must advance the arm's state through action APIs.
2. **Abstraction:** Domain semantics represent kinematics, spatial bounds, and collision-related conditions as a frozen specification. A lightweight, task-specific success condition provides additional steering about what “complete the manipulation” means.
3. **Translation and proof:** A translation agent rewrites the candidate in Dafny with the safety conditions. Parallel proof plans try annotations; repair agents can change code after verifier feedback but cannot weaken the frozen safety specification.
4. **Compilation and external checks:** Once verified, the candidate is compiled back to an executable program and connected to real APIs through symbol mapping. A simulator then checks collision and out-of-bounds safety and held-out task behavior.
5. **Likely failure:** If the specification represents physical interaction too coarsely, avoiding hard-to-prove actions can be easier than completing the task. The program can be formally safe yet fail to preserve the intended manipulation.

The authors observed exactly this tension in aggregate: all 20 initial robotic outputs passed independent collision and out-of-bounds checks, yet none preserved the original functionality. Inspection found repair agents often settled on vacuous solutions that avoided actions with difficult-to-prove effects. Adding lightweight task-specific success definitions as repair constraints raised functional preservation to 11/20 while keeping safety-check success at 20/20. This did not add arbitrary task success to the formal safety certificate; it guided repair away from “do nothing and therefore avoid collision” (Table 4; Section 4.3).

## Technical mechanism: how frozen semantics connect to executable output

MAGS has two dependent pipelines that should not be confused.

| Pipeline | Inputs and stages | Output or check | Question answered |
| --- | --- | --- | --- |
| Semantic construction | Human-written core logic → agents formalize APIs from official documentation → critics and human audit → safe/unsafe probes | Frozen domain semantics and safety properties | Which behaviors does the formal model treat as safe? |
| Program verification | Program → semantic extension if an API is missing → Dafny translation → proof planning and repair → verifier → compile-back | Dafny-checked executable output and reusable proof tactics | Does this output satisfy the current frozen specification? |

If a program uses an API that has not yet been modeled, the system can extend the semantics through the same construction process. Existing frozen components remain unchanged, so a single proof failure cannot be fixed by weakening prior specifications. A translation agent moves the program into Dafny and attaches the required conditions; a critic reviews whether the translation preserves behavior. A planner then proposes strategies, and parallel proof branches add annotations. Code repair is permitted only if annotations alone are insufficient. After verification, Dafny's compiler generates the target program, and a deterministic compatibility layer replaces corresponding symbols with the source-language APIs (Section 3.2).

Symbol mapping is the crucial seam between a proof and the final executable. The authors argue that deterministic substitution lets guarantees carry over to the compile-back output, provided that the mapped symbols preserve the formalized API semantics. That statement still relies on a semantic assumption: if a wrapper or real API behaves differently from its abstract symbol, the verifier has not independently checked the discrepancy. “Compiles to an executable” therefore does not mean that external hardware, operating systems, permissions, or physical environments have all been proved safe.

![Original paper Figure 2: A program is translated into Dafny, passes through parallel proof and repair, verification, and compilation; reusable proof tactics can be extracted afterward.](/paperReading/89-mags-autoformalization-safety/figure-2-proof-pipeline.jpg)

*Figure 2 (paper Section 3.2): This figure shows per-program verification and should be read separately from Figure 1's reusable semantic-construction stage. Source: Albert Wu et al., *MAGS: Multi-agent Auto-formalization Guarantees Safety for Agentic Outputs*, arXiv v1, [Figure 2](https://arxiv.org/html/2609.19391v1#S3.F2). Reused under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license stated on the arXiv page.*

## How to read the experiments: certification, safety, and functionality are separate

The authors evaluate feasibility across domains, cost, and functional preservation. Three outcome types must remain separate: Dafny verification success means satisfaction of the frozen formal specification; an independent safety check is an external observation on particular benchmark inputs; and functional preservation compares the original and compiled-back programs on a held-out test suite. One does not substitute for another (Section 4).

### The pipeline certifies all 220 samples, but external oracles differ

The evaluation includes all 100 KernelBench Level 1 CUDA kernel tasks, testing issues such as memory bounds and data races; 100 sampled SecCodePLT terminal programs across all 27 represented CWE categories, including injection, privileged access, and cryptographic API misuse; and 20 arm-control tasks from VLABench. The logical foundation, API semantics, and source-program models vary by domain, while the program-level pipeline keeps the same structure (Table 1; Section 4.1).

Table 2 reports Dafny verification for 100/100 CUDA, 100/100 terminal, and 20/20 robotics outputs, totaling 220/220. The independent safety oracles pass 100/100 CUDA, 82/100 terminal, and 20/20 robotics outputs. CUDA uses NVIDIA Compute Sanitizer's `memcheck` and `racecheck` on the evaluation inputs. Terminal uses applicable SecCodePLT security cases. Robotics uses collision and out-of-bounds metrics in the simulator. The 18 terminal disagreements concentrate in privileged-access and concurrency-related CWEs; the authors conclude that the current autoformalized module semantics do not fully capture those effects (Table 2; Section 4.1).

This does not mean the verifier proved a false proposition. The more precise interpretation is that the verifier accepted a program against the frozen model, while an external oracle found behavior not covered by that model. The trustworthiness of the formal guarantee therefore depends on semantic fidelity and coverage, not only on proof-discharge rate. Nor is an external oracle a complete model of reality: it too covers only its benchmark and evaluation scope.

### Verification is not a small code-review substitute

The authors measure time, input/output tokens, and dollar cost from translation until Dafny accepts a candidate or the retry budget expires. Mean time per sample is 36.4 minutes for CUDA, 36.3 for terminal, and 68.3 for robotics; mean cost is $8.60, $9.01, and $10.17, respectively. The ranges vary: CUDA takes 3.5–264.9 minutes and $0.93–$52.14; terminal takes 10.7–203.7 minutes and $3.37–$36.47; robotics takes 34.2–88.2 minutes and $6.37–$15.41 (Table 3; Section 4.2).

These measurements cover translation through Dafny acceptance or retry exhaustion. They exclude initial source-program generation and the one-time cost of constructing reusable domain semantics. Because proof plans may run in parallel, wall-clock time is end-to-end latency, not the sum of all agent and verifier compute. Token prices can also depend on cached-token share. The averages are useful for thinking about deployment cost, but the paper does not establish a fixed price under different model versions, cache rates, or production load.

### Functional preservation is tested on samples, not proved as equivalence

For every sample, another model independently generates ten held-out functional tests restricted to inputs satisfying the safety assumptions. Program-level agents do not see those tests. For CUDA and terminal, all ten must pass on both the original and the verified program. Robotics uses ten seeds for the original task; a pass requires a non-decreasing mean success rate compared with the original policy, and an additional task-specific constraint is used to steer repairs (Section 4.3). The paper explicitly says this is not a formal semantic-equivalence proof between original and repaired programs.

Table 4 reports final functional-preservation counts of 100/100 CUDA, 100/100 terminal, and 11/20 robotics. The robotics result of 11/20 includes lightweight success conditions; the initial 0/20 vacuous-repair result remains important diagnostic evidence. Those task-success conditions were not added to the formal safety certificate because rigorously specifying arbitrary task success is a separate specification problem. Read 11/20 as the count meeting this paper's operational definition on its held-out tests, not as a general success probability for future tasks.

## Evidence map: a formal certificate does not carry external validity

| Evidence | What the paper directly supports | Reasonable interpretation | What it does not support |
| --- | --- | --- | --- |
| Table 2, formal verification | Dafny-checked outputs for all 220 samples | One program-level framework is feasible across three very different domains | Every original program has been proved safe in the real environment |
| Table 2, external safety oracles | 100/100 CUDA, 82/100 terminal, 20/20 robotics | The frozen semantics have an observable coverage gap for terminal cases | The verifier proved false propositions in 18 cases; or all real-world terminal code has an 82% safety rate |
| Table 3, resource cost | Per-domain sample averages for time, tokens, and estimated cost | The current pipeline is an expensive safety-oriented process | The values are the complete cost including semantics construction, or transfer unconditionally to production |
| Table 4, functional preservation | 100/100 CUDA, 100/100 terminal, and 11/20 robotics on held-out tests; robotics began at 0/20 | Coarse specifications can produce safe but useless programs | Passing a finite suite proves formal equivalence to the original output |
| Figures 1–2, architecture | Two pipeline stages, frozen semantics, and verifier-guided repair | Reusable domain specifications may amortize some one-time formalization work | Semantic construction, translation, and API mapping are all machine-proved correct |

The method contributes a checkable procedure and benchmark evidence. For every result, a reader should still ask: what does this oracle cover, are tests isolated, and does it assess the formal specification or external behavior? “220/220” best supports the feasibility of the proof pipeline. “82/100” and “0/20 → 11/20” show how safety and utility remain governed by the quality of the semantic model. These disagreements are not disposable exceptions; they are central to understanding the paper's conclusion.

## Limitations and threats: which links still rely on trust?

1. **Correctness of specifications and API semantics:** The authors derive API semantics from official documentation and use critics, a 20% random human audit, and three safe plus three unsafe probes. Yet 18 terminal failures against the external oracle show these processes did not eliminate missing or incomplete semantics.
2. **Translation from source to Dafny:** Translation agents are instructed to preserve behavior, and critics review faithfulness. The chain still depends on those review methods catching semantic drift. Dafny proof directly constrains the formal representation and its compile-back chain.
3. **API mapping and environment assumptions:** Symbol substitution is deterministic, but guarantee transfer depends on the abstract symbols matching real API behavior. The authors expose environmental assumptions through runtime `expect` checks; those checks still need correct deployment in a larger, unverified program.
4. **Safety and task success are different specifications:** Robotics functional preservation at 0/20 shows how an absent or coarse success condition can make non-action attractive. The added task-specific condition is only a steering constraint, not a general task-success guarantee proved by this paper.
5. **Evaluation scope and sample size:** Only 20 robotics tasks are tested, and the evaluation uses simulation. Terminal evaluation samples 100 benchmark cases. These data do not estimate incident prevalence in deployed systems or establish universal coverage across devices, operating systems, and API versions.
6. **Incomplete cost accounting:** Table 3 excludes initial program generation and one-time domain-semantic construction. It also uses model versions and token prices from the study period. An organization estimating total cost must include expert review and maintenance.
7. **Independent reproduction is not established:** The paper's “independent” safety and functionality checks are separate oracles in the authors' own experiment. That does not mean a second research team reproduced the full benchmark.

## Artifacts and reproducibility

As of October 5, 2026, arXiv provides the v1 PDF, HTML, and TeX source; Figures 1–2 are reused under the CC BY 4.0 license shown on the paper page. Neither the arXiv record nor the paper links a public implementation, directly runnable full benchmark package, or reproduction bundle. Readers can obtain the paper materials, but cannot rerun the full 220-task MAGS experiment from the paper page alone. All figures for 220/220, 82/100, resource cost, and functional preservation in this reading are author-reported; we did not independently reproduce them.

If artifacts are released later, a reproduction would need to pin the listed model versions, Dafny/Boogie/Z3 settings, frozen semantics per domain, source tasks, compile-back mapping, agent-call retry budget, held-out tests, and safety oracles. Running a small public CUDA sample or checking that one proof compiles would not constitute a reproduction of the full experiment. If the preprint is revised, its new experiments or appendices should be compared before carrying these numbers forward.

## Bloss0m engineering judgment: attach a scope to every safety claim

The following is **Bloss0m engineering synthesis**, not a deployment recipe evaluated by the authors. When adopting a similar pipeline, phrase a guarantee as an auditable scope statement: “This output passed the listed safety properties under versioned frozen semantics, a specified Dafny toolchain and symbol mapping, and stated environment assumptions.” Report external-oracle coverage and mismatches beside it so a green proof badge cannot hide semantic disagreement.

- **Where it may fit:** Consequences are high, domain APIs are stable enough for expert review, program behavior can be mapped into sufficiently explicit formal state, and the organization can bear the cost of building and maintaining semantics.
- **Gate the domain first:** Version each API semantic library and safety requirement; record provenance, human review, positive and negative probes, and known mismatches with external oracles. Revalidate dependent programs when a specification changes; do not let per-task repair agents silently rewrite the contract.
- **Keep proof and behavior tests distinct:** Formal proof supports properties of the frozen specification; differentiated safety oracles probe semantic coverage; held-out functional tests assess behavior preservation on finite inputs. Present them separately instead of using one as a substitute for another.
- **Inspect boundary transformations:** Review source-to-Dafny translation, API symbol replacement, compiler versions, and runtime assumptions. A change in semantic mapping should trigger renewed review of the proof chain.
- **When not to use it:** If APIs are highly dynamic, no expert can review the safety specification, user intent cannot be stated, or 36–68 minutes and roughly $9–$10 per sample is unacceptable, this paper does not yet justify MAGS as a general-purpose generator. Start with a narrow domain whose semantics can be verified, and define a human workflow for rejection and repair.

The durable engineering distinction is this: **proving a frozen specification** answers whether a program obeys explicit conditions in that formal model. **Proving real intent and operational safety** additionally requires showing that those conditions cover the target, the mappings are faithful, and the task remains useful. MAGS automates the first question far enough to make it a compelling research direction, while its own failure cases show that the second does not follow automatically.

## Three things to remember

1. **Method:** Construct, audit, and freeze reusable domain semantics first; then use multiple agents to translate, plan proofs, repair from verifier feedback, and compile to the target language.
2. **Evidence:** 220/220 means all benchmark samples received Dafny-checked outputs, not that every output passed external safety and functionality checks. Terminal is 82/100, and robotics functional preservation is 11/20 after the added task constraint.
3. **Boundary:** Formal guarantees concern a stated specification and toolchain assumptions. API semantics, translation, real intent, deployment conditions, and usefulness require separate validation.

## Further reading

- [Who Holds the Pen? Let Specifications, Not Agents, Sign Off](/en/paper-reading/76-specifications-not-agents-sign-off/): explores how specification authority should be separated from agent permissions.
- [Loopjacking: How Human Approval Loses Its Binding to an Action](/en/paper-reading/86-loopjacking-approval-binding/): examines the product trust boundary between approval decisions and executed effects.
- [Agents Are Systems, Not Models: Agentic Evaluation](/en/paper-reading/83-agents-are-systems-not-models-agentic-evaluation/): discusses why agent evaluation should cover the whole system rather than model capability alone.

## Primary sources

- Wu, A., Roberts, N., Huang, T.-H., Lin, H., Friedman, G., Cho, S., Orlanski, G., & Sala, F. (2026). [MAGS: Multi-agent Auto-formalization Guarantees Safety for Agentic Outputs, arXiv v1](https://arxiv.org/abs/2609.19391); [full HTML](https://arxiv.org/html/2609.19391v1).
- [arXiv v1 PDF](https://arxiv.org/pdf/2609.19391v1) and [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).
