---
title: "What Evidence Should an AI Agent's Vulnerability Report Include? MobileCybench Replays Executable Probes"
description: "MobileCybench replays Android agent exploits in an isolated environment, then checks trusted state with executable probes to see which security properties were violated."
pubDate: 2026-09-24
updatedDate: 2026-09-24
tldr:
  - "Do not judge an agent report by persuasive prose alone; replay its exploit under explicit attacker privileges and check it with an independent security probe."
  - "A triggered probe shows that one checked property failed in that replay; attribution, severity, impact, and patch status require separate review."
  - "MobileCybench tests five coding agents against 495 probes across 13 Android apps; benchmark construction and runs surfaced 23 previously unreported vulnerabilities, 12 of which maintainers validated."
audience:
  - "Engineers building coding agents, security testing harnesses, and vulnerability disclosure workflows"
  - "Open-source maintainers and product security teams triaging agent-generated reports"
category: "AI Engineering"
tags: ["AI Agent", "AI Safety", "Evaluation", "Research"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 40
kind: "article"
showToc: true
image: "/blog/119-mobilecybench-executable-security-probes/title_image.webp"
---

An AI coding agent can produce a convincing vulnerability report quickly. What maintainers need to know is more specific: under which privileges did a reproducible action change protected state? The [MobileCybench paper](https://arxiv.org/abs/2609.23980) turns that question into an executable security probe. It replays an exploit in an isolated Android app and backend environment, then checks whether a security property that should hold was violated.

That moves a report from “sounds plausible” toward “can be replayed and checked.” A triggered probe still establishes only that one property failed under the specified conditions. It does not identify the root cause, rate severity, or stand in for maintainer validation. MobileCybench is a useful model for the evidence a vulnerability report can carry, but its application and property coverage is limited, and its replay setup is substantial.

> **Huahua in one sentence**
>
> A credible agent vulnerability report should replay its claim in an isolated environment and let an independent check observe a state change the attacker cannot simply assert.

## Replace “I found a bug” with a checkable property

Many vulnerability benchmarks use a catalog of known bugs as the answer key: did the agent rediscover a listed issue? MobileCybench uses a different unit. A probe encodes a security property that should remain true, such as “a non-owner cannot read this file” or “only the Home Assistant app can update the phone’s reported location.” After an agent submits an exploit, the evaluator starts the app from a seeded state, replays the exploit, and reads trusted state from the emulator, backend, or database to see whether the property still holds.

The paper’s Home Assistant example makes the evidence chain concrete. The Android app accepts a location broadcast from any app and forwards the forged location to its server. After replaying the malicious app, the evaluator compares the server’s device-tracker record with the test baseline. The unauthorized value has changed, so the relevant probe triggers. The check reads app or backend state, rather than trusting a success message printed by the exploit itself.

> **Huahua's engineering note**
>
> A trigger answers “which property failed in this replay?” It does not automatically answer “which bug caused it, how severe is it, or how should it be rated?”

## How to read the benchmark and its results

MobileCybench contains 13 Android applications and 495 probes written and reviewed by the authors, covering confidentiality, integrity, availability, and access control. Five coding agents were evaluated in two attack settings: a malicious app installed on the victim’s device, and a remote attacker with a low-privilege backend account. Each setting also has an APK-only condition and a source-visible condition. The paper repeats each app, setting, and access configuration twice, so its results describe this particular collection of apps, probes, agent versions, and isolated setups.

The paper reports 23 previously unreported vulnerabilities surfaced during benchmark construction and runs. By the time of writing, maintainers had validated 12 of them—a majority—with 7 patched and 5 acknowledged; 6 had public CVEs. The 23 refers to findings surfaced across the work, not 23 independent discoveries by the five evaluated agents. In the evaluation alone, patch-differential attribution deduplicated the agents’ results to 19 attributable vulnerabilities.

The authors ran their own application instances and backends in Android emulators, avoiding production services and real users. The public repository provides the harness, 13 app environments, and 495 probes. For dual-use reasons, the authors withhold agent exploits, run logs, and reference vulnerabilities that are not yet patched. The published materials therefore support inspection of the scoring method and replay conditions for public findings; they do not expose every experimental trace or every unpatched exploit for outside reproduction.

## What still needs review after a probe triggers

Treat a probe result as triage evidence rather than a complete vulnerability verdict. A valid trigger means that the submitted exploit, under the configured attacker privileges, violated at least one property checked by the probes. Several probes can trigger because one effect violates multiple properties; different root causes can also trigger the same probe. A probe score therefore does not map directly to a vulnerability count.

The paper then attributes a trigger by replaying the exploit against a vulnerable build and its corresponding patched build. If the probe-triggering effect occurs on the vulnerable version and disappears on the patched one, the trigger can be attributed to that reference vulnerability. Even then, **attribution is not severity**. Maintainers must still examine the root cause, prerequisites, affected versions and users, actual confidentiality or integrity impact, exploitability, and whether the patch fully closes the issue. CWE classification, CVE assignment, advisory publication, and bounty decisions each have their own review process.

For maintainers handling reports, the following evidence makes that review more concrete:

1. **Threat model**: app and version, attacker’s starting privileges, target user or data, and the app or backend boundary involved.
2. **Replay material**: a minimal executable exploit, configuration, prerequisites, and steps, with instructions for restoring a clean baseline.
3. **Independent observation**: which trusted app, emulator, or server-side state should remain unchanged, and what difference replay actually produced.
4. **Result classification**: whether a probe triggered, which property failed, how infrastructure errors and expected behavior were excluded, and whether the result repeats from a clean state.
5. **Follow-up validation**: suspected root cause, affected versions, patch differential, and impact evidence, clearly marking what still needs maintainer confirmation.

This list is not sufficient proof of every real-world vulnerability, nor does every report need to build a full benchmark. It helps maintainers distinguish a model’s claim, an executable proof of concept, an observed property violation, and a vulnerability with a confirmed cause and impact.

## Probe coverage and operational limits

Replayability needs an environment; one shell command in an issue does not guarantee it. The authors describe spending about 30 author-hours per application to specify and write probes, deriving properties from source code, documentation, and pilot agent runs. Even reviewed probes cover only the properties a team has explicitly identified. A silent suite means the submitted exploit did not trigger a current check; it does not establish that the app is secure or free of other vulnerabilities.

The public repository’s getting-started guide calls for a clone with submodules, a Python environment, and agent authentication. Experiments also need an Android emulator, each app’s backend, seeded test data, agent credentials, and a way to reset the baseline. A full matrix spans 13 apps, attack modes, APK or source visibility, and multiple agent configurations; the paper gives each agent run up to two hours. These costs limit who can repeat the complete study and make containers, emulator state, data versions, network permissions, and reset procedures part of the test specification.

> **Huahua's take**
>
> For maintainers, the reusable artifact is not an agent leaderboard; it is a security check that can be updated with the app, replay an exploit, and judge the result from trusted state.

For the probe design and detailed evaluation, continue with [Paper Reading #68: MobileCybench and Executable Security Probes](/en/paper-reading/68-mobilecybench-executable-security-probes/). For broader context on agent runtime, tools, and failure recovery, see the [AI Agent guide](/en/blog/64-ai-agent-guide/). For threat boundaries, read [Enterprise AI Agent Security](/en/blog/43-enterprise-ai-agent-security/); for turning permissions, evaluation, and audit into launch criteria, see the [Agentic AI Platform Contract](/en/blog/93-agentic-ai-platform-contract/).

## Sources

- [Zhang et al., MobileCybench: Evaluating Agent Vulnerability Discovery via Executable Probes (arXiv:2609.23980)](https://arxiv.org/abs/2609.23980) — method, results, limitations, and responsible disclosure.
- [MobileCybench author repository and README](https://github.com/bountybench/mobilecybench) — harness, released materials, and reproduction prerequisites.
