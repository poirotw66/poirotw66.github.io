---
title: "How Can a Vulnerability Report Become Executable Evidence? A Deep Read of MobileCybench"
description: "A deep read of MobileCybench: 13 Android apps and 495 executable security probes used to evaluate five coding agents, with careful distinctions among probe triggers, vulnerability attribution, maintainer confirmation, and the limits of the evidence."
pubDate: 2026-09-24
updatedDate: 2026-09-24
tldr:
  - "MobileCybench encodes application security properties as hidden executable probes and replays agent-submitted exploits in an isolated environment. A trigger means a checked property was violated; it does not by itself identify the root cause or establish severity."
  - "The benchmark covers 13 Android apps, 495 probes authored and reviewed by the authors, five coding agents, and four settings formed by malicious-app versus low-privilege remote attack and APK-only versus source-visible access."
  - "Across two attempts for each of 250 agent-app-setting-access configurations, 77 triggered at least once, producing 124 triggered runs. Agents reproduced 19 of the 24 reference vulnerabilities."
  - "Benchmark construction and evaluation surfaced 23 previously unreported vulnerabilities; 12 were maintainer-confirmed (seven patched, five acknowledged). That is a majority, not confirmation of all 23, and not evidence that agents alone found all of them."
audience:
  - "Engineers responsible for Android and mobile-service security testing"
  - "Researchers building replayable, automatically scored agent-security benchmarks"
  - "Product-security teams separating model output, vulnerability evidence, and maintainer triage"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Evaluation", "Mobile Security"]
image: "/paperReading/68-mobilecybench-executable-security-probes/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - agent-safety-governance
paper:
  title: "MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes"
  authors:
    - "Andy K. Zhang"
    - "Ava Huang"
    - "Joey Ji"
    - "Wai Han"
    - "Thomas Qin"
    - "Nardos Demilew"
    - "Michael Tian-Yue Liu"
    - "Brian Song"
    - "Riya Dulepet"
    - "Brian Wang"
    - "Kyleen Liao"
    - "Cuiyuanxiu Chen"
    - "Nishka Kacheria"
    - "Andrew Wu"
    - "Pratham Rangwala"
    - "Xinjie Wang"
    - "Laura Gomezjurado Gonzalez"
    - "Anita Ding"
    - "Benjamin Yi"
    - "Daniel E. Ho"
    - "Dan Boneh"
    - "Dawn Song"
    - "Ion Stoica"
    - "Percy Liang"
  year: 2026
  venue: "arXiv cs.CR preprint, v1 (2026-09-21; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2609.23980v1"
    arxiv: "https://arxiv.org/abs/2609.23980"
    doi: "https://doi.org/10.48550/arXiv.2609.23980"
    code: "https://github.com/bountybench/mobilecybench"
    project: "https://arxiv.org/html/2609.23980"
series:
  id: "agent-security-evaluation"
  title: "Agent Security Evaluation and Executable Evidence"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** Vulnerability benchmarks often take one of two scoring routes: recognize exploit markers for known bugs, or check generic properties such as crashes. The first cannot automatically score unknown bugs; the second may miss an application-specific violation such as one user’s private file being exposed to another. The authors ask whether we can encode the properties an application must maintain and leave machine-checkable evidence when a replayable exploit violates one.
- **Core insight:** A probe is an executable check for a security property. An agent submits more than a prose report: it submits a malicious Android app or remote-attack script. The evaluator replays it from a clean, pinned state, then inspects trusted device, service, or database state. A probe trigger shows a property violation; a later comparison between vulnerable and patched builds can attribute it to a reference vulnerability.
- **Strongest evidence:** The benchmark contains 495 probes across 13 apps: 227 malicious-app-specific probes, 187 remote-attacker-specific probes, and 81 generic instances. Five agents were evaluated under four settings with two attempts per configuration. At least one attempt triggered in 77/250 configurations, and 124 runs triggered 34 distinct application-specific probes. Of 24 reference vulnerabilities, 19 were reproduced by at least one exploit. Benchmark construction and evaluation also surfaced 23 previously unreported vulnerabilities, 12 of which maintainers confirmed.
- **Main boundary:** These are measurements on 13 apps, a property set chosen by the authors, a limited set of agent versions, and a pinned container/emulator protocol. Silence means only that no checked property was shown to fail. It does not prove an app is secure, that an agent found no bug, or that vulnerability severity has been established.

**Bounded verdict:** MobileCybench’s key move is to make vulnerability reports replayable and score them against properties: it replaces “the attack sounds plausible” with “did a checked state invariant fail?” But the scoring pipeline has distinct evidence layers. Probe triggers, reference-vulnerability attribution, maintainer confirmation, and CVSS severity are not interchangeable.

> **Huahua's engineering note**
>
> An automated check is meaningful only when it observes trusted state, defines the attacker’s authority, and can rebuild the baseline. Translating “a probe fired” directly into “a severe new vulnerability was found” skips root cause, attribution, duplicate reports, patch status, and maintainer confirmation.

## Version, research question, and paper claim

This reading follows arXiv v1 of [MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes](https://arxiv.org/abs/2609.23980), submitted to cs.CR on 2026-09-21. As of this verification, it is a preprint; this article does not describe it as peer reviewed. I inspected the complete paper, Appendices A–E, supplemental result and cost tables, and the author-linked [MobileCybench repository](https://github.com/bountybench/mobilecybench). The arXiv HTML page marks the paper CC BY 4.0; the original figures used here include their figure numbers, paper anchors, and license attribution.

This is an empirical benchmark, dataset-construction, and agent-evaluation paper. It is neither a general algorithm for finding every vulnerability nor a complete Android threat model. Its questions divide into two parts. First, can executable probes for application-specific security properties score the effects of unknown exploits in a replayable way? Second, which properties do five coding-agent systems trigger across local Android and remote attack settings, and which submitted exploits can be mapped to established reference vulnerabilities?

## Why the previous approach is insufficient: scoring granularity

The limitation in earlier benchmarks lies in scoring granularity. A marker for a known vulnerability can precisely recognize a particular CVE or seeded bug, but it does not automatically adapt when a new vulnerability appears. Generic invariants such as crashes and memory-safety errors apply more broadly but cannot express each app’s authorization rules, private state, or device-integration expectations. MobileCybench instead uses the application’s own security properties as its unit. A vulnerability is a defect that lets an attacker violate a property; an exploit is an executable artifact that causes the violation; a probe is a program that reads trusted state and checks whether the property still holds. These are different conceptual layers.

## First separate the scoring units: trigger, attribution, and confirmation

| Evidence layer | What it means in MobileCybench | What it cannot establish by itself |
| --- | --- | --- |
| **Probe trigger** | After exploit replay, one or more probes observe that their property was violated; the run counts as triggered | It does not identify a unique root cause, mean exactly one vulnerability triggered, or supply a general severity score |
| **Configuration trigger** | At least one of two independent agent runs triggers for a fixed agent, app, attack setting, and access level | It does not mean both attempts worked; pass@2 is at least as high as the one-attempt rate |
| **Reference attribution** | Replay the saved exploit on vulnerable and patched builds; attribute it only when the effect appears on the vulnerable build and disappears on the patched build | It names only vulnerabilities with a completed attribution package; an unmatched trigger may be a new bug, a coverage gap, or an insufficient replay difference |
| **Human triage / maintainer validation** | Researchers inspect the finding, and maintainers confirm its reality, acknowledge it, or patch it | It does not mean all 23 were confirmed, nor that the team was first to find the issue or that every issue is public |
| **Severity** | Individual public cases may carry CWE and CVSS details | A probe does not compute severity, and the 495-probe benchmark has no single comparable severity score |

## Core intuition: turn a security expectation into a replayable state check

The main text says that the probes inspect trusted application state and that the properties under test were fixed before the scored runs. One example is Home Assistant: only its trusted app should report a phone’s location. If another ordinary installed app can forge location, it should not be able to change the server’s recorded value. An agent’s malicious app sends a forged Intent to an exported receiver; the receiver accepts it and forwards the forged coordinates, so the server state departs from the seeded baseline and relevant probes trigger. The measured event is a violation of a particular property. A separate attribution package then uses the vulnerable/patched build difference to match a reference vulnerability. Figure 2 shows this mechanism and the checks that remain silent.

![Paper Figure 2: Probe-based scoring on a Home Assistant replay.](/paperReading/68-mobilecybench-executable-security-probes/figures/figure-2-probe-scoring.png)

*Figure 2 (paper Figure 2, Section 2.2): A forged Intent changes the seeded location on the server; server-state and device-tracker probes trigger, while the crash probe and other checks stay silent. Notice that “which property check triggered” and “whether a crash occurred” are different observations. Source: Andy K. Zhang et al., “MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes,” [Figure 2 and Section 2.2](https://arxiv.org/html/2609.23980v1#S2.F2). The original is unchanged; the paper is licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and attribution is retained.*

## Walk a Home Assistant attack through the scoring path

1. **Input:** An ordinary, low-privilege installed app forges a location Intent to Home Assistant’s exported receiver.
2. **Intermediate state:** The receiver accepts a message without trusted sender proof and forwards attacker-controlled coordinates to the backend.
3. **Execution outcome:** The server-side seeded location changes. The agent submits an installable APK exploit, not a prose claim that the state changed.
4. **Probe decision:** Application-specific probes that inspect server state observe a property violation and trigger. A crash check may remain silent because a security effect does not require the app to crash.
5. **Attribution and likely failure:** If the exploit triggers on the pinned vulnerable build and stays silent on the patched build, the package maps it to a reference vulnerability. If the receiver gains a sender check, the baseline is not seeded correctly, or the effect requires live-victim interaction, this replay path may not reproduce it.

This case also shows the causal boundary. Trigger records rely on an observed replay result rather than a researcher’s judgment that the exploit’s prose sounds credible. But they still show only that the property encoded by a probe failed. One exploit can trigger several probes, while different vulnerabilities can violate the same property. The result does not automatically identify which source line a patch should change.

## The evaluation path and its four attack settings

The authors selected 13 open-source Android applications, with Google Play download buckets ranging from 10K+ to 10M+: Audiobookshelf, Conversations, Home Assistant, Jerboa, Moe Memos, Moodle Mobile, Nextcloud Talk, ntfy, openHAB, ownCloud, OwnTracks, Termux, and wallabag. Each environment seeds a baseline of accounts, files, messages, preferences, and other state. An agent runs in a Kali Linux container, inspects an APK or source, uses ADB and APIs, and submits one replayable exploit. Targets, backends, and emulators are the research team’s isolated instances, not production services.

Two attack settings change the surface the attacker can reach. In the **malicious-app** setting, the attacker can install an ordinary user app on the victim’s device and attack through Android intents, exported components, content providers, deep links, shared storage, and other inter-app surfaces. The agent receives no victim credentials; root, instrumentation hooks, UI automation against other apps, and signature/privileged permissions are disallowed. In the **remote-attacker** setting, the attacker is off-device and sends requests with a low-privilege, non-administrative backend account. The attacker does not receive victim credentials, backend internals, or app-private files. Termux has no backend and therefore no remote-attacker task.

Each attack setting has two access levels. **APK-only** provides an obfuscated APK and restricts network access to reduce public source or advisory lookups. **Source-visible** provides source code in addition to the APK and allows more permissive network access. This is not a single-variable “can the agent see source?” experiment: network conditions and obfuscation change as well. The authors therefore warn against treating the difference as a clean causal effect of source access. APK-only also cannot rule out training-data memorization; it means the target source was not mounted for the agent and external source lookup was restricted.

![Paper Figure 1: MobileCybench’s agent-exploit and isolated replay evaluation flow.](/paperReading/68-mobilecybench-executable-security-probes/figures/figure-1-evaluation-flow.png)

*Figure 1 (paper Figure 1, Section 1): An agent explores an APK or source through an emulator and backend, then submits an exploit. The evaluator installs a malicious app on a clean emulator or replays a remote script from a separate container; hidden probes inspect emulator, service, and database state. A trigger occurs after replay and probe scoring, not through model self-assessment. Source: Andy K. Zhang et al., “MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes,” [Figure 1 and Section 1](https://arxiv.org/html/2609.23980v1#S1.F1). The original is unchanged; the paper is licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and attribution is retained.*

The five evaluated systems are OpenCode/GPT-5.5, OpenCode/GPT-5.6-Sol, OpenCode/GLM-5.2, Claude Code/Opus 4.8, and Claude Code/Opus 5. Each agent ran twice for each available configuration, giving 250 configurations and 500 agent-generation runs. Each run had up to two hours and one exploit submission. A configuration counts as pass@2 triggered if either attempt triggers a probe. Termux has no remote-attacker setting. A missing exploit, failed build or replay, or silent probe suite does not count as a trigger.

## Technical mechanism: the replay path from input to score

One evaluation follows these steps:

1. **Input and authority:** The task prompt names the app and attack mode, then provides an APK or source, emulator/backend access, and the appropriate attacker account. Both the prompt and replay harness constrain what the attacker may do.
2. **Intermediate artifact:** The agent submits a malicious APK project or remote `exploit.sh`. During exploration, it may inspect a richer environment. For scoring, the evaluator prepares victim state again so the exploit cannot rely on credentials or transient state that existed only in the development container.
3. **Replay:** The evaluator starts from the seeded baseline and runs the APK on a fresh install, or executes a remote script in a separate container with the low-privilege account. The two settings follow Android IPC and backend paths, respectively.
4. **Probe scoring:** Each probe reads trusted emulator, service, or database state and checks its property. One or more triggered probes make a triggered run. Silence means only that this exploit did not break an encoded property.
5. **Attribution rescore:** For a finding with a reference package, the evaluator replays the saved exploit on vulnerable and patched builds. A differential maps the result to that reference vulnerability; this rescore does not change whether the earlier run triggered.

The last two stages must remain separate. The headline trigger rate is not the same as the number of distinct vulnerabilities. The authors created 26 reference packages, of which 24 were complete and enabled for attribution. A package contains a pinned vulnerable baseline, a reference exploit, a patch that removes the vulnerability, and a verifier. The package checks a specific, already-triaged bug; it is not open-ended discovery. Each package is validated by checking that its reference exploit succeeds on the vulnerable build, fails on the patched build, and leaves health checks passing. Otherwise the differential itself would be suspect.

## Benchmark construction: coverage and failure boundaries for 495 probes

Appendix A divides the 495 probes into 227 malicious-app-specific probes, 187 remote-attacker-specific probes, and 81 generic instances. The authors derived them from source code, documentation, pilot agent runs, victim-owned state, authorization requirements, and attacker capabilities, then wrote and reviewed them with AI coding assistance. The paper reports about 30 author-hours per application. Four property families are confidentiality, integrity, availability, and access control (CIAA). Specific probes can check, for example, whether a non-owner can read a file or another app can unlock a Home Assistant door. Generic checks cover broader properties such as not leaking planted secrets, crashing, or modifying planted records.

The authors checked for spontaneous triggers with a no-agent baseline: they replayed a no-op across 13 malicious-app app/setting pairs and 12 remote-attacker pairs, with 0/25 triggers. This is a false-positive check for those seeded environments, not a proof covering every runtime state and race condition. Generic probes never triggered in the 124 scored triggered runs; every observed trigger came from an application-specific check, with 34 distinct probes spanning all four CIAA families. This supports the value of app-specific properties beyond generic crash checks, while also showing that scores depend heavily on which properties the authors selected.

The false-negative check for probe coverage cannot use every possible vulnerability as its denominator: the total vulnerability population for an app is unknown. Appendix A.5 instead evaluates the authors’ own reference exploits. Of the 24 attribution packages, 19 (79%) triggered at least one application-specific probe. Of the five misses, one was structural: its effect appears only after a live victim opens the attacker’s payload, which unattended replay cannot stage. The other four were coverage gaps: the effect was real, but the released standard suite lacked a probe for the channel where it landed or a seeded baseline to compare against. This is coverage on a known reference set, not vulnerability recall over an entire app.

That result changes the adoption calculation. A new probe or seeded baseline may let previously saved exploits be rescored without running agents again. But maintaining the suite requires domain review, state setup, and checks against unintended triggers. Silence is not security, and a trigger is not complete threat coverage. The authors froze the selected properties before the run grid, while acknowledging that this set reflects their judgment and may not represent the broader population of Android security properties.

## Main results: triggers, agent differences, and reproduction

Of 250 configurations, 77 triggered on at least one attempt (pass@2), producing 124 triggered runs: 80 malicious-app runs and 44 remote-attacker runs. For remote attacks, only Audiobookshelf and wallabag triggered across all five agents; most other apps were harder under the low-privilege remote setting. OpenCode/GPT-5.6-Sol had the highest APK-only malicious-app configuration trigger rate at 53.8% (7 of 13 apps); GPT-5.5 and Opus 5 each had 46.2%, Opus 4.8 had 38.5%, and GLM-5.2 had 15.4%. In the APK-only remote-attacker setting, all five agents were at 16.7% (2 of 12 apps): precisely Audiobookshelf and wallabag. These settings should not be collapsed into one agent ranking.

Across both attempts, the aggregate trigger rate rose from 28.8% with APK-only access to 32.8% with source-visible access, a modest increase with variation by app and agent. Source-visible runs reached 17 distinct attributed vulnerabilities, compared with 12 in APK-only runs; seven were found only in source-visible runs and two only in APK-only runs. Because network access and obfuscation changed together with source access, this is not a single-factor causal comparison. Figure 5 also uses 25 APK-only configurations per agent as its denominator, while the remote-attacker portion has fewer eligible apps because Termux has no backend.

![Paper Figure 3(a): Trigger share and API cost for APK-only malicious-app configurations.](/paperReading/68-mobilecybench-executable-security-probes/figures/figure-3a-malicious-app-cost.svg)

*Figure 3(a) (paper Figure 3, Section 4.2, left panel): Each point summarizes one agent’s APK-only malicious-app configurations; the y-axis is the pass@2 trigger share and the x-axis is API cost across both attempts. Do not treat minimum cost as a substitute for vulnerabilities found, or read a point as the cost of one exploit: it is an agent-level aggregate and excludes emulator/host compute and the human work of probe authoring and triage. Source: Andy K. Zhang et al., “MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes,” [Figure 3 and Section 4.2](https://arxiv.org/html/2609.23980v1#S4.F3). The left panel is unchanged; the paper is licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and attribution is retained.*

Success and failure metrics also differ. An exploit can trigger a property while matching no reference package. Of 77 triggered configurations, 76 were attributed to a vulnerability in the bank; one trigger was unmatched. Across 124 triggered runs, attribution and deduplication produced 19 vulnerability instances. Four were reached by all five agents, and three vulnerabilities (two in wallabag and one in Audiobookshelf) accounted for 57/124 triggered runs. The apps are diverse, but successful runs concentrate on a few relatively reproducible vulnerabilities; this is not a uniformly difficult vulnerability sample.

Agent uniqueness is limited, but not absent: in APK-only runs, three of the five agents each detected one vulnerability no other agent found. An ensemble might therefore add marginal cases, but the sample is still only five particular scaffold/model combinations with different provider cyber-authorization tiers. Claude Code/Opus 4.8 had provider refusals in 24/96 available transcripts (25.0%) and Opus 5 in 42/99 (42.4%). Some agents saved an exploit before a refusal or continued after it; 11/66 refusal-affected runs still triggered. These rates use runs with retained transcripts and reflect exploit construction plus provider blocking. The authors do not estimate what performance would have been without refusals.

## The 23 findings and the limit of the word “discovery”

The paper’s disclosure counts come from distinct processes and units; they cannot be inferred from one benchmark score. During environment construction, probe writing, reference-exploit validation, and agent evaluation, the team surfaced 23 vulnerabilities that were not in the public record at the time. This does not mean “agents found 23”: findings could appear during benchmark construction or agent evaluation, and the count is distinct from 77 triggered configurations and 19 reference vulnerabilities reproduced by agents. Maintainers confirmed 12 of the 23, a majority but not all; seven were patched and five acknowledged. Confirmation means the issue is real, not that this team was necessarily first worldwide, since private reports from others may overlap.

As reported in the paper, six findings had public CVEs; a Nextcloud Talk finding was also public through HackerOne without a CVE. Five of the six CVEs had a public runnable benchmark task; the web-only Audiobookshelf CVE did not. Unpublished findings and their individual status remain omitted under disclosure arrangements. Maintainer confirmation, accepted disclosure, a patch, a public CVE, and a replayable benchmark package are connected but distinct lifecycle events.

One of the clearest cases involves Home Assistant location broadcasts: an ordinary local app can send a forged location to an exported receiver with no sender or permission check; the receiver forwards it to the user’s server, potentially affecting automations triggered by “owner is home.” The paper gives CWE and CVSS assessments for selected public cases. That severity evaluation belongs to an individual vulnerability, however; it cannot be derived automatically from “a probe triggered.” A probe’s job is to show a property failure. Severity requires separate analysis of exploitability, impact, scope, and the product context.

## Compute cost and reproducibility beyond API price

Appendix E reports 373.5 hours of wall-clock time across 500 agent-generation runs, with a 37.0-minute median and 44.8-minute mean; these records include container setup, replay, and teardown, and the maximum is 134.6 minutes. Total LLM API cost is $6,973.19, with a median of $10.95 per run. Those prices exclude host compute, emulator/Docker runtime, storage, human probe authoring, manual triage, disclosure, and attribution-package construction. The five agents averaged 111.4 model turns and 175.9 tool calls per run, with medians of 98 and 142. About 30 author-hours per app make clear that the benchmark costs far more than its inference bill.

Costs are not perfectly comparable. Provider token counters have different meanings; some costs use a provider total and others a token-and-price estimate. Cache-write counters were not recorded. Host CPU, RAM, and SSD allocations were not pinned or reported as benchmark constants, and the model service endpoints were not immutably pinned in the run logs. The emulator was a headless Pixel 2 AVD with 2GB RAM and SwiftShader, on Android API level 33, 34, or 35 depending on the app. APK builds had a 1,200-second timeout, remote script replay 600 seconds, and malicious-app scoring/regrading 180 seconds. Thus the target and harness state are documented for reconstruction, but each external provider response is not necessarily bit-for-bit reproducible.

The repository was directly accessible at verification time and includes `runner.py`, app harnesses, probe suites, and operational documentation. Its README offers per-app and batch execution. Re-running still requires cloning submodules, creating the Python environment, installing Android/Docker prerequisites, authenticating with an agent, and allocating substantial CPU and storage. The Ethics Statement also says that submitted agent exploits, full run logs, and attribution references for findings that are not yet public are withheld to avoid releasing ready-to-use exploits against unpatched versions. The released reference packages therefore cover the public runnable portion (five public runnable tasks); the code exists, but not every paper result can be reproduced without restriction.

## Evidence map: author claims, observations, and this article’s judgment

- **What the paper claims:** Encoding app-specific security properties as probes can evaluate unknown exploit effects; Android attack surfaces include IPC and device interactions that host- or web-only harnesses do not execute. MobileCybench provides 13 runnable app environments, 495 probes, two attack settings, and two access levels.
- **What the experiment directly observes:** 77 of 250 configurations triggered at pass@2; 124 runs triggered 34 distinct application-specific probes. Generic probes did not trigger, and the no-op baseline was 0/25. Source-visible settings reached more unique attributed vulnerabilities, but trigger rates rose only from 28.8% to 32.8% with mixed app- and agent-level changes. Nineteen of 24 reference exploits triggered at least one application-specific probe.
- **What the authors disclose and externally validate:** The team surfaced 23 previously unreported findings; maintainers confirmed 12 (seven patched and five acknowledged), and six received public CVEs. This is neither another wording for agent triggers nor a claim that all details are public.
- **Engineering judgment in this article:** The reusable pattern is to encode state properties as replayable assertions, score property failures first, then perform root-cause attribution. A team applying this to its own product would need a security owner to maintain a property inventory, trusted state oracle, seeded baseline, and regression policy. Probe counts and the agent ranking in this one study should not become deployment standards.
- **Not established:** Overall vulnerability recall for Android apps, generalization across apps or platforms, production attack rates, a uniform severity measure for every trigger, actual triage savings for security teams, a universal ranking of model capabilities, or a security guarantee for arbitrary user environments.

## When probe-based evaluation is useful

If a product has a resettable environment, trusted server/device state that can be inspected, and clearly defined attack roles and permissions, probe-based scoring can turn a prose report into a replayable property test. It is especially useful for application-specific authorization, confidentiality, and integrity properties: cross-account file access, unauthorized changes, IPC sender checks, or rules about which app may write backend state. A sensible pilot would start narrowly: define one risk as a property, seed a baseline, write a no-op control, verify that normal flows do not trigger the check, then add vulnerable/patched differential tests and a finding-triage process.

Do not use one trigger rate to claim that “agent A is safer” or that “the system has no vulnerabilities.” If the app’s security expectations are not explicit, the benchmark imports its authors’ blind spots into the leaderboard. If an effect needs live user interaction, cross-device timing, or a third-party service that cannot be reset, a single offline replay may miss it. If you provide only an APK but do not audit training and runtime lookup channels, you cannot claim the run is uncontaminated. If source access is compared while network restrictions and obfuscation also change, conclusions apply to the combined access setup. Finally, interpreting red-team or bug-bounty counts requires looking at provider refusals, unmatched probe triggers, severity review, and duplicate disclosures.

## Three things to remember

1. **Scoring unit:** A probe checks a property. A trigger shows that this replay violated it; it does not by itself name the root cause or assess severity.
2. **Strongest evidence:** The four-setting grid covered 13 apps, 495 probes, and five agents, yielding 77 pass@2 triggered configurations. Reference-exploit coverage was 19/24, and both silence and unmatched triggers have specific blind spots.
3. **Adoption boundary:** Of 23 previously unreported findings, 12 were maintainer-confirmed. Keep that qualifier attached. The engineering pattern to reuse is a property oracle, isolated replay, patch differential, and disclosure process—not the raw trigger rate as a security verdict.

For related reading, [Bounded Agents: A Security Model for Tool Delegation](/en/paper-reading/64-bounded-agents-delegation-security/) discusses delegated-tool authority, while [Causal Failure Attribution in Agentic RAG](/en/paper-reading/65-agentic-rag-causal-failure-attribution/) separates an observable outcome from causal attribution. They share a useful evaluation lesson with this paper: the unit of a score must match the level of the conclusion.

## Primary sources

- Zhang et al., [MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes, arXiv v1](https://arxiv.org/abs/2609.23980), [full HTML](https://arxiv.org/html/2609.23980). Key anchors: [Figure 1 and Section 1](https://arxiv.org/html/2609.23980v1#S1.F1), [Figure 2 and Section 2.2](https://arxiv.org/html/2609.23980v1#S2.F2), [Section 2.3 attribution](https://arxiv.org/html/2609.23980v1#S2.SS3), [Table 1 and Section 3](https://arxiv.org/html/2609.23980v1#S3.T1), [Figures 3–6 and Section 4](https://arxiv.org/html/2609.23980v1#S4), [Appendix A probes and coverage](https://arxiv.org/html/2609.23980v1#A), [Appendix B protocol](https://arxiv.org/html/2609.23980v1#B), [Appendix C detailed results](https://arxiv.org/html/2609.23980v1#C), [Appendix D disclosure and attribution](https://arxiv.org/html/2609.23980v1#D), and [Appendix E resource accounting](https://arxiv.org/html/2609.23980v1#E).
- The authors’ [MobileCybench repository](https://github.com/bountybench/mobilecybench) and its README/setup documentation; availability checked as of 2026-09-24.
