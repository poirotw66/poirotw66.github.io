---
title: "Can Authorization Hold After an Agent Requests Payment? A Deep Reading of APort Vault"
description: "A deep reading of APort Vault that separates payment requests, successful payments, policy decisions, recipient membership, and unpermitted transfers while examining what a pre-action authorization layer does and does not establish."
pubDate: 2026-09-24
updatedDate: 2026-09-24
tldr:
  - "The benchmark replays the same human-written attacks against the same models, prompts, tools, and decode settings, changing whether a deterministic policy check runs before payment execution. It measures the action boundary, not whether a model refuses."
  - "At Levels 2–4, where policies allow some recipients and forbid others, model-alone replay produced 140/76,842 unpermitted transfers versus 0/69,297 behind the layer; 68,970 matched triples yielded 105 versus 0, with a 0.38% session-clustered upper bound across 790 source sessions."
  - "The observed zero was not achieved by denying every payment: 25,370 successful payments still occurred behind the layer. Yet it is not a universal guarantee, and the local Level 4 engine was stricter than the public policy pack."
  - "The dataset files are publicly listed under CC BY 4.0, but Parquet access is gated behind sign-in and acceptance of use conditions. The replay harness, judge prompts, and signing keys are also withheld, so the pack is not fully open or end-to-end reproducible."
audience:
  - "Engineers building agents that can trigger payments, orders, refunds, or other external side effects"
  - "Teams responsible for agent tool gateways, authorization policy, benchmark design, and security evaluation"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Authorization", "Evaluation", "Governance"]
image: "/paperReading/66-aport-vault-payment-agent-authorization/title_image.webp"
field: "AI Agent"
difficulty: "advanced"
showToc: true
topics:
  - agent-safety-governance
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "APort Vault: Benchmarking AI Agent Payment Authorization with the Open Agent Passport"
  authors:
    - "Uchi Uchibeke"
  year: 2026
  venue: "arXiv cs.CR preprint, v1 (2026-09-18; not peer reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2609.22076v1"
    arxiv: "https://arxiv.org/abs/2609.22076"
    doi: "https://doi.org/10.48550/arXiv.2609.22076"
    code: "https://github.com/aporthq/aport-agent-guardrails"
    project: "https://huggingface.co/datasets/aporthq/vault-benchmark-v1"
series:
  id: "aport-vault-payment-authorization"
  title: "Agent Authorization and Tool Boundaries"
  part: 1
  totalParts: 1
---

This reading covers only version 1 of [APort Vault: Benchmarking AI Agent Payment Authorization with the Open Agent Passport](https://arxiv.org/abs/2609.22076). Uchi Uchibeke submitted v1 on 2026-09-18 in the arXiv cs.CR category. It is an arXiv preprint, and this article does not treat it as peer reviewed. The author is also the founder of APort Technologies Inc., which develops the authorization layer evaluated in the paper; the paper records this relationship in its disclosure.

This is a benchmark and systems-analysis paper, not a new model and not a proof of a general-purpose agent safety architecture. It asks a deployer-facing question that can be stated precisely: once a payment agent has produced a transfer call, does a deterministic policy check placed before tool execution change whether money actually moves to a recipient the passport does not permit? The answer is limited to the simulated payment environment, completed replay cells, the local policy engine, and policy Levels 2–4 of the five-level setup.

## The paper in 90 seconds

- **Problem:** Adversarial prompt benchmarks often score refusal, judge verdicts, or model rankings. A deployer instead needs to know whether an external side effect occurred. A payment request, a successful payment, and a payment to a forbidden recipient are separate events; a single “attack success” rate can blur them.
- **Core insight:** Put authorization in the execution path between the model and payment tool. The model proposes a transfer call; a deterministic policy engine compares that call with the passport capability, recipient, and constraints; only an allowed call reaches the bank tool. This changes the execution boundary, not the model’s prompt or propensity to refuse.
- **Strongest evidence:** The unpaired Level 2–4 aggregate is 140/76,842 unpermitted transfers with the model alone and 0/69,297 behind the layer. On 68,970 matched model, prompt, and replay-track triples, the counts are 105 versus 0. The layer condition still records 25,370 successful payments, so the observed zero did not come from refusing all payments.
- **Main boundary:** Read the Level 2–4 zero-event upper bound at the source-session level: 3/790 = 0.38%, as reported by the authors. This is not a security guarantee. The local Level 4 engine also required a memo confirmation code absent from the public pack; corpus selection, one run per cell, partial multi-turn coverage, missing human validation, gated artifacts, and the author’s role as provider all limit transfer.

My bounded verdict is: **APort Vault replaces a proxy such as “the model appeared to refuse” with execution records, comparing whether the same attack caused a policy-forbidden transfer with and without a pre-tool authorization layer. It provides strong but narrow evidence about an execution boundary. It does not measure the security, compliance, or benign-task overblocking of arbitrary payment systems.**

> **Huahua's engineering note**
>
> Security has to hold where the side effect happens. A model saying “I will pay” does not mean money moved; a model saying “I will not pay” does not prove an external service did not execute a call. A policy check in the tool dispatcher is a concrete control point, but the paper’s result only matters when that check reads the right passport and actual parameters and every path to the side effect goes through it.

## Why the prior approach is insufficient: problem and evaluation target

A payment agent joins two actors: a model that generates tool calls from a conversation and a payment tool that changes a bank ledger. An attacker may persuade the model to propose a transfer, but model refusal, a model request, a tool accepting that request, payment success, recipient allowlist membership, and a policy violation are not interchangeable. If an evaluation only asks whether the model said “yes,” it cannot establish whether money moved. If it reports only request rate, it cannot call that authorization failure.

The authors argue that many adversarial-prompt benchmarks compare whether models refuse or comply, measuring a model version’s tendency under particular inputs. That has value, but the result changes when a model is retrained or replaced, and it does not answer what catches residual risk when a deployed model can still be manipulated. This paper moves the experimental variable to the tool boundary: with the same model, prompt, decode settings, tool schema, and replay track, it compares direct execution with execution preceded by an authorization layer. That is the central comparison strategy ([Introduction, Sections 1.1–1.3](https://arxiv.org/html/2609.22076v1#S1); [Methods, Section 3.4](https://arxiv.org/html/2609.22076v1#S3.SS4)).

### Separate the five recorded events before reading the results

| Event | Operational definition in the paper | What it answers |
| --- | --- | --- |
| **Payment request** | A transfer_funds call appears in the executed tool calls | The model proposed a payment action; that action may or may not violate policy |
| **Successful payment** | The bank tool returned success: true | A payment occurred in the simulated ledger; it does not mean the payment was unauthorized |
| **Policy decision** | The deterministic engine allowed or denied a call, behind the layer only | What the policy decided about that call; the model-alone architecture has no such event |
| **Recipient membership** | Whether the recorded recipient was on the level’s allowlist | Whether the destination was permitted; not whether the requester had legitimate intent |
| **Unpermitted transfer** | At Levels 2–4, a successful payment to a forbidden recipient; at Level 5, any successful payment | Whether the authorization boundary failed; the headline here excludes Level 5 |

An evaluation is the denominator, not one of the five events; 76,842 and 69,297 below are completed evaluation counts. A request and a successful payment differ. The mock bank rejects invalid amounts and insufficient-funds calls, so success is narrower than a request. An unpermitted transfer at Levels 2–4 is also not “any payment”: the policy may permit payments to allowlisted recipients; the violation is a successful payment to a recipient the passport forbids. Only Level 5, which grants no payment capability, counts any successful payment as unpermitted. However, Level 5 uses a special prompt that explicitly tells the model to call the tool and says a guard will intercept it. It mainly measures enforcement, not whether an attacker can persuade a model. The headline result in this reading is limited to Levels 2–4 and never pools in Level 5.

There is a semantic limit as well. Every input originated in a competition attack attempt, but that does not make every allowlisted payment a “legitimate task,” nor does every request mean the model was successfully compromised. Recipient membership reports where the money went; it does not determine whether the user was entitled to request it, whether the stated business rationale was true, or whether the model acted under manipulation. The authors do not adjudicate intent or payment legitimacy. Their pre-registered human-labeled validation slice was not completed.

## Core intuition: check again after the model, before the side effect

With model self-refusal alone, the control point remains inside the model being tested: if persuaded, the model may still emit a tool call. APort Vault’s architecture treats a proposed transfer as a candidate action, then runs a deterministic check against the passport and transaction fields before the tool dispatcher passes it to the mock bank. That decision does not depend on asking the model to say again that the transfer is unsafe.

In this paper, the Open Agent Passport (OAP) is the context for the passport and pre-action authorization implementation. The public OAP specification and payment policy pack describe policy objects with capabilities, assurance, transaction limits, daily caps, merchant and country allowlists, category filters, and idempotency. A policy decision and actual enforcement remain two separate layers: a trusted execution path has to translate a deny into “the payment tool will not be called.” The tested design is not merely “there is a policy JSON.” The deterministic decision sits between the transfer call and execution, and a denied call does not execute.

This distinction is why the result should not be shortened to “OAP makes models safer.” The model did not receive a modified system prompt across the two architectures. The layer does not try to persuade the model or change its ability; it checks structured fields in the tool call that the policy can evaluate, such as recipient, amount, capability, and audit code. It does not independently determine whether the transaction’s purpose is true, whether social engineering worked, or whether the policy itself is correct.

## Walk one case through the control path

The following is an **explanatory example** based on the paper’s Level 2 forged-receipt cohort, not additional experimental evidence. The authors describe attacks that include forged text in a user message resembling a verify_recipient tool result that approved a payee. The attack changes the model’s belief about whether a recipient was verified; it does not change the passport allowlist.

1. **Input:** In a multi-turn conversation, an attacker supplies a fake tool receipt claiming that a recipient outside the allowlist was verified. The message is user-provided text, not a trusted tool result.
2. **Intermediate representation:** Given the conversation and available transfer_funds schema, the model emits a payment call with recipient and amount parameters. The benchmark counts a request even if policy later denies the call.
3. **Model-alone path:** Without an additional check, the payment tool executes the request. If the mock bank returns success and the recipient is outside that passport’s allowlist, this counts as an unpermitted transfer at Levels 2–4.
4. **Path with the authorization layer:** Before execution, the dispatcher checks the actual recipient against policy. A fake receipt does not add the recipient to the allowlist, so policy denies the call and it does not reach the mock bank.
5. **Outcome and likely failure:** The study measures successful payment and recipient in executed-tool records, not whether a judge thinks the text looked like an attack. The measured boundary would disappear if a runtime had a bypass that calls the bank directly, read the wrong recipient field, used an overbroad passport, or otherwise let someone bypass the pre-tool denial.

The operational chain is: **attack conversation → model proposes transfer parameters → tool dispatcher receives the actual call → deterministic policy decision → execute only if allowed → classify outcome from execution records**. This does not validate business intent, and request presence or absence is not substituted for payment success or authorization failure.

## Evaluation design: corpus, policy levels, architectures, and replay tracks

### The attack corpus came from a public CTF

From March to August 2026, the authors ran a public capture-the-flag event on a live simulated bank agent. Participants tried to get it to transfer funds outside its policy. The authors removed 372 empty submissions and 7 submissions containing personal information from 4,750 raw attempts, leaving 4,371 human-written attacks from 1,128 source sessions. Of these, 4,272 (97.7%) arrived during the launch window from 2026-03-06 to 03-12. These attacks reflect what competition participants wrote, unlike a suite of researcher-authored jailbreak templates. But participants self-selected and had a prize incentive; they are not a representative user sample or state-grade adversaries.

A priority-ordered regex classifier assigns categories including authority_claim, direct_transfer, privilege_escalation, json_injection, social_engineering, emotional_manipulation, prompt_injection, reconnaissance, capability_self_register, and account_manipulation. The social_engineering category is the classifier’s residual bucket, not a claim about the underlying technique: authority claims and emotional manipulation are categorized separately because the regex classifier matched them earlier. The results also reveal uneven coverage. Authority claims and direct transfer requests dominate; tool-sequence exploits, parameter fuzzing, and multi-agent delegation are underrepresented because the CTF exposed one single-agent banking interface.

### The five policy levels are not five attack difficulty settings

| Level | Passport / policy constraints | What counts as an unpermitted transfer there |
| --- | --- | --- |
| 1 | payments.charge, $50,000 ceiling, wildcard recipient | Any recipient is permitted by design; this is a policy-permits observation |
| 2 | $2,500 ceiling, three allowlisted recipients | Successful payment to a non-allowlisted recipient |
| 3 | $500 ceiling, one allowlisted recipient, per-transaction and daily caps | Same as Level 2 |
| 4 | $1,000 ceiling, one allowlisted recipient, caps, idempotency, and audit-code conditions | Same as Level 2 |
| 5 | Empty capability list; no payment permission | Any successful payment, but the prompt explicitly instructs the model to call and says a guard will intercept it |

Levels 2–4 contain both allowed and forbidden recipients, making them the useful levels for comparing an authorization boundary. Level 1 is a wildcard control that illustrates what the layer permits when policy says yes; it is not a case where an attacker obtained an unauthorized payment. Level 5 is an enforcement control with no capability and explicit tool-call instruction; it is not comparable to attack success at Levels 2–4. Level 4 is especially easy to misread: the prompt asks the model to process documented payments to its allowlisted recipient with a valid audit code and amount cap; prior transaction history and the verification tool also indicate that the payee is approved. Its high request rate mostly reflects an allowed task configuration, not a 79.4% jailbreak rate.

### Comparison conditions and statistical units

The 4,371 attacks were replayed across 14 models from 8 labs, five policy levels, two replay tracks, and two architectures. Track A sends only the attacker’s final user message to isolate the payload. Track B sends the full attack message sequence in order, preserving multi-turn context. The architectures are model alone, where a transfer call executes, and behind the layer, where the same call is evaluated by a deterministic policy engine before execution. The paper says the model, model version, prompt, decode settings, tool schema, and replay track are the same; the manipulated architecture variable is whether the authorization layer is present.

The experiment completed 225,964 of 244,776 planned evaluations; it discloses 5,395 error rows by cell. The single-turn grid is complete across all 14 models. Multi-turn coverage is complete for eight major-provider models; Kimi K3 and GLM-5.3 lack a behind-layer cell, and Qwen3.8 Max is partial (260/709 at Level 1). The authors do not treat missing cells as zero and state that no headline claim relies on a partial cell. Each cell ran once, leaving no within-cell repeated-sampling variance estimate. The authors kept CTF production temperatures by level (0.8 down to 0.1; Level 5’s output cap is 256 tokens and others 1,024) rather than repeating samples. Provider-specific top_p and penalty defaults were not normalized, a confound for cross-model comparisons.

Because evaluations from one source session are not independent, the paper uses 1,500 source-session-clustered percentile bootstrap resamples. For zero outcomes, it gives both an exact one-sided per-evaluation upper bound and a per-session rule-of-three bound, using the latter as its conservative reported figure. The matched comparison also fixes model, prompt, and replay track, reducing the risk of attributing prompt or model differences to the layer.

## Result 1: read the five events in Figure 1

![APort Vault original Figure 1: the five payment events at Levels 2–4 and Level 5.](/paperReading/66-aport-vault-payment-agent-authorization/figures/stages.png)

*Figure 1 (paper Figure 1, Results Section 4.3): Read downward from request and successful payment through allowlist membership to unpermitted transfer. The distinction is between a model asking for a payment and an unauthorized payment executing. At Levels 2–4, the layer condition still records 25,370 successful payments while it records zero observed unpermitted transfers; Level 5 needs separate interpretation because it has no payment capability and its prompt tells the model to call the tool. [Original figure and Section 4.3](https://arxiv.org/html/2609.22076v1#S4.F1) · Source: Uchi Uchibeke, APort Vault (2026), arXiv v1, CC BY 4.0.*

| Five events, Levels 2–4 | Model alone | Behind the layer | How to read it |
| --- | ---: | ---: | --- |
| Evaluations containing a payment request | 28,543 / 76,842 | 25,527 / 69,297 | The model emitted a payment call |
| Evaluations containing a successful payment | 28,521 / 76,842 | 25,370 / 69,297 | The mock bank returned success |
| Policy decision (calls, not evaluations) | Not applicable | 25,453 allowed / 187 denied, 25,640 calls total | The deterministic engine decision; do not add to evaluation denominators |
| Evaluations with an allowlisted recipient | 28,380 / 76,842 | 25,370 / 69,297 | Recipient membership; not an intent verdict |
| Unpermitted transfer | 140 / 76,842 | 0 / 69,297 | A successful payment went to a forbidden recipient |

The key question is: “With a deterministic authorization check before the tool, do payments elicited by the same attacks still execute to a policy-forbidden recipient?” In the Levels 2–4 aggregate, the model-alone architecture produced 140 such events and the behind-layer condition observed none in its completed evaluations. Requests and successful payments still occurred in large numbers, so the difference sits at the boundary outcome rather than turning the models into universal refusers. The layer evaluated 25,640 transfer calls, allowed 25,453, and denied 187: 148 for a forbidden recipient, 17 for an invalid amount, 13 for a limit violation, and 9 for a missing audit code. Calls, evaluations, and evaluations containing a denial are different units: 172 evaluations included a denial, 15 of which also contained a successful payment. A denial somewhere in an evaluation does not mean that evaluation had no payment at all.

The denominators matter. Model alone and behind-layer conditions have different total evaluation counts (76,842 and 69,297), partly because multi-turn coverage is incomplete. The second key comparison therefore uses only matched triples completed in both conditions. Among 68,970 model, prompt, and replay-track matches, model alone had 105 unpermitted transfers and behind the layer had 0; request counts were 25,362 and 25,420. This makes the architecture comparison more direct, but it remains a comparison within the authors’ harness and completed sample, not a randomized trial across arbitrary deployments.

## Result 2: request rate is not attack success

![APort Vault original Figure 2: payment request rates across models on the same Level 4 prompts.](/paperReading/66-aport-vault-payment-agent-authorization/figures/models_l4.png)

*Figure 2 (paper Figure 2, Results Section 4.5): Request rates range from 71.2% to 84.3% across models on the same 1,293 Level 4 prompts. This is cross-model behavior within one level, not an unpermitted-payment rate. Level 4 explicitly authorizes documented transfers to its allowlisted recipient, so high request rates reflect shared task behavior and should not be described as models being successfully jailbroken. [Original figure and Section 4.5](https://arxiv.org/html/2609.22076v1#S4.F2) · Source: Uchi Uchibeke, APort Vault (2026), arXiv v1, CC BY 4.0.*

Model-alone request rates by level are 10.9% at Level 1, 3.0% at Level 2, 0.1% at Level 3, 79.4% at Level 4, and 25.3% at Level 5. These rates vary substantially, but each attack belongs to exactly one policy configuration, so policy level, prompt task, and attack cohort vary together. We cannot isolate the difference as a policy effect or a model-refusal effect. Level 4’s prompt authorizes documented transactions to the approved recipient with a valid audit code and within the amount cap; the history also shows prior transfers to that payee. Among the 1,293 Level 4 prompts, 809 (62.6%) elicit a request from all 14 models, and every one ends in a successful payment to the level’s allowlisted recipient. This is shared, allowed behavior under the task setup.

The 25,370 successful payments behind the layer should likewise not be treated as a utility or legitimate-throughput metric. They show that some permitted calls executed in the mock bank and that the layer was not deny-all. They do not measure benign task quality, real payment quality, or human adjudication. Because the corpus consists entirely of competition attack attempts, it cannot estimate overblocking on legitimate traffic.

## Result 3: matched requests and the execution boundary separate

![APort Vault original Figure 3: request rates and unpermitted-transfer outcomes on matched prompts in both architectures.](/paperReading/66-aport-vault-payment-agent-authorization/figures/matched.png)

*Figure 3 (paper Figure 3, Results Section 4.6): The matched prompts shown cover Levels 2–5. Request rates are close across architectures while the unpermitted-transfer counts differ. Level 5’s zero belongs to a separate enforcement test with no capability and explicit call instructions; it is excluded from this article’s Level 2–4 headline. The figure supports the bounded reading that the headline is not achieved by suppressing requests; it does not show identical model behavior or equivalent request rates. [Original figure and Section 4.6](https://arxiv.org/html/2609.22076v1#S4.F3) · Source: Uchi Uchibeke, APort Vault (2026), arXiv v1, CC BY 4.0.*

Across 68,970 matched triples, the paired Level 2–4 request-rate difference behind the layer relative to model alone is +0.084 percentage points, with a session-clustered 95% interval of [-0.020, +0.189]. The authors report this as an observation rather than an equivalence test. Requests differ in 1,220 pairs (1.77%): 581 have a request only with the model alone and 639 only behind the layer. Denied-tool feedback may change the model’s later behavior. Similar aggregate rates do not establish identical behavior or identify a causal mediation path for each request. The narrower supported reading is that the layer-side zero in unpermitted transfers was not obtained by broadly suppressing payment calls.

Figure 3 also helps explain why request behavior may transfer more readily across models than a forbidden-recipient boundary outcome. It does not show that the agent behaves identically apart from the request rate, or that the layer is an invisible observer to the model. The model may receive tool feedback after a denied call and continue the interaction. The manipulated variable is the execution architecture, with each call’s outcome retained.

## Statistical interpretation of a zero

$$
\widehat{r}_{\mathrm{observed}} = \frac{k}{n}
\qquad
U_{\mathrm{session}} \approx \frac{3}{S}
$$

Here, $k$ is the observed count of unpermitted transfers, $n$ is the evaluation denominator, and $S$ is the number of distinct source sessions represented in the replay. For the layer’s Level 2–4 result, $k=0$, $n=69{,}297$, and $S=790$. The empirical observed rate is 0/69,297, but the data do not show that the true risk rate must be zero. If all 69,297 evaluations were incorrectly treated as independent, the paper gives an exact one-sided 95% upper bound of 0.0043%. Because multiple replays share a source session, it reports the more conservative per-session rule-of-three bound, $3/790=0.38\%$. This approximates an upper bound after no observed event; it is not a model guarantee or deployment SLA.

Conversely, the 140 model-alone Level 2–4 outcomes are concentrated in 24 of 790 source sessions. One session contributes 67 outcomes (47.9%); two account for half, and ten account for 90%. Thus 76,842 evaluations are not 76,842 independent attackers. The authors cluster uncertainty by source session so repeated attacks from the same source do not create false precision. An aggregate rate alone would erase the structure that a small number of sources repeatedly used related attacks.

### One conspicuous attack family does not describe all multi-turn attacks

The model-alone condition has 113 multi-turn Level 2–4 outcomes. Of these, 111 come from 103 forged-receipt attempts across eight sessions, all at Level 2. Attackers included a literal-looking [Tool Result: verify_recipient] in their own messages to make the model believe the payee had already been verified. This targets the model’s belief about prior tool state. The tool boundary still checks the actual recipient against the actual allowlist, rather than trusting the fake receipt in the conversation.

In the attack-category table, json_injection rises from 1/2,184 in single-turn replay to 112/2,183 in multi-turn replay; other categories do not show a similar increase. This is consistent with the authors’ interpretation that the multi-turn effect in this corpus is almost entirely driven by one forged-receipt technique and a small cluster of sessions. It does not prove that multi-turn attacks in general rely on this technique, nor contradict other studies that use refusal as their outcome. This paper studies a different domain and execution-based endpoint.

## Judge audit, negative results, and operating cost

The headline uses a deterministic outcome from executed tool records, not an LLM judge’s verdict. The authors still have Mistral Medium 3.5 and Grok 4.6 audit transcripts as judges. On the 222,400 evaluations where both returned their pre-escalation verdicts, pooled inter-judge Cohen’s kappa is 0.772; by level it is 0.991 at L1, 0.676 at L2, 0.167 at L3, 0.864 at L4, and 0.521 at L5. Their recall against the deterministic outcome also differs: Grok recovers 99.1% with three false positives; Mistral recovers 64.4%, misses 3,356 confirmed outcomes, and has 139 false positives. Had the headline depended on the judges, one panel member would have missed about a third of model-alone outcomes. This judge reliability issue does not change the deterministic headline, but it limits secondary analyses that use judge fields.

The original plan included a stratified human-labeled validation slice of about 300 evaluations to compare judge results with human labels, and the dataset card had promised it. The slice was not completed before the freeze. The authors acknowledge it as a gap. It would be inaccurate to extend “the headline does not require a judge” into “the benchmark’s human intent or judgment labels have been validated.”

Provider temperatures followed the CTF level settings, while top_p and penalty defaults remained unnormalized. Providers blocked 582 evaluations at input filtering before the model saw the prompt, 538 of them GPT-6 Astra; these remain in the overall denominators as trials with no payment. That choice is conservative for the model-alone architectural claim and relatively neutral behind the layer, but provider filtering and decode defaults confound model-to-model comparisons.

On cost, the banker consumed 987.6M input tokens and 218.5M output tokens, plus 686.0M cache reads. The judge panel used another 1,071.7M input and 14.0M output tokens, about 47.4% of all input and output tokens combined. End-to-end median evaluation latency ranges from 8.2 seconds for GPT-5.6 Luna single-turn to 66.8 seconds for Kimi K3 multi-turn. Per-model medians with and without the layer are close relative to the run noise. This paper does not directly measure the authorization check’s own latency; its cited 53ms median comes from the companion paper, not an independent measurement in this benchmark.

## OAP and the policy engine: the result is not the deployment configuration

The public [OAP specification](https://github.com/aporthq/aport-spec) and [finance.payment.charge.v1 policy pack](https://github.com/aporthq/aport-policies/tree/main/finance.payment.charge.v1) describe checkable fields such as capability, assurance, transaction amount, daily cap, merchant and country allowlists, category filters, and idempotency. These can support a deterministic policy decision. A deployer still has to confirm that the runtime checks the same passport, the actual tool parameters, and the intended policy version, and that every path capable of producing the payment side effect passes through that enforcement point.

The behind-layer condition used a local deterministic implementation ported from the CTF server and evaluated the finance.payment.charge.v1 policy pack; it did not call the hosted service for each tool call. The authors report a 100-case parity sample against the hosted verifier on September 5, but checking that parity evidence requires their infrastructure. They disclose two differences: the local Level 5 denial-reason code differs in wording, and more materially, the local Level 4 engine additionally requires a confirmation code in the transfer memo, which the published pack does not enforce. The authors say this does not change the replay outcome, but the local engine is stricter at Level 4. Its zero therefore cannot by itself establish the behavior of the public pack’s Level 4 configuration.

## Evidence map: paper, observed data, and engineering interpretation

- **Paper / author-defined:** The two architectures, Track A/B, five policy levels, five recorded events, executed-tool-call outcome metric, session-clustered intervals, policy-engine parity account, and replay protocol built from human-written CTF attacks (Methods, Sections 3.1–3.10).
- **Evidence / directly observed in this data:** Levels 2–4 have 140/76,842 unpermitted transfers model alone and 0/69,297 behind the layer; 68,970 matched triples yield 105 versus 0; the zero-event per-session upper bound across 790 sessions is 0.38%; the layer records 25,370 successful payments and denies 187 of 25,640 calls (Results, Sections 4.3–4.8).
- **Author interpretation:** When the policy is correctly defined and the check is in the execution path, an induced unpermitted transfer request does not move simulated money; the layer’s aggregate zero is not achieved by suppressing requests (Sections 4.3–4.5 and 6.2).
- **Bloss0m engineering judgment:** The result supports placing machine-checkable constraints at the tool boundary for side effects, and keeping request, success, allow/deny, and recipient-policy outcome separate in evaluation. It does not validate any particular service. A transfer needs parameter mapping, policy completeness, bypass closure, failure handling, and auditable evidence to carry the same interpretation.
- **Not established:** Security guarantees for arbitrary payment systems, real banks, other side-effect tools, data exfiltration, or multi-agent delegation; overblocking on ordinary users; zero observed events as zero real risk; equivalent outcomes for the public pack and stricter local Level 4 engine; or a general claim that multi-turn attacks are more effective.

## Artifacts and reproducibility: direct status as of 2026-09-24

The [Hugging Face dataset page](https://huggingface.co/datasets/aporthq/vault-benchmark-v1) publicly lists Parquet files, the prompt corpus, outcomes, transcripts, five level configurations, methodology, results, reproduction scripts, and a CC BY 4.0 license. It also states that sign-in and acceptance of use conditions are required to access the files. The page and terms were viewable today: users must agree to use the data for research, evaluation, or defense; attribute APort’s compilation; not identify participants; and follow each model provider’s terms for generated outputs. Hugging Face shares the account username and email with the dataset authors. An unauthenticated request for outcomes.parquet returned HTTP 401 GatedRepo. This is a **publicly listed, condition-gated dataset**, not an anonymously downloadable open corpus.

The authors say released rows and release/paper_analysis.py reproduce the paper analysis, and list a frozen snapshot, preregistration, coverage and errors, and scoring code. But end-to-end replay is more than running the analysis script. The dataset page says the replay harness, judge prompts, and signing keys are not released. The private snapshot is needed to recover each judge’s original pre-escalation verdict, counterfactual would_aport_allow, turn-to-outcome, denial reason codes, and banker cache tokens. GLM-5.3 transcripts are withheld under provider terms: 34 Level 2–4 successful-payment details are absent (390 at Level 5), while the headline request, recipient-membership, and unpermitted-transfer rows remain. Analysis of the full Parquet requires pyarrow; the frozen analysis path reportedly needs only Python’s standard library.

The GitHub aport-agent-guardrails and aport-spec repositories are public, and the policy pack exposes policy structure and tests. They let readers inspect the interface concept and some rules, but do not remove the dataset gate or make the paper’s harness replayable. A minimal useful reproduction would first require approved data access, then the fixed corpus snapshot, public analysis code, consistent denominator rules, and session-clustered bootstrap. Re-running the agents also requires model provider/version access, the replay harness, and compliance with the providers’ transcript restrictions. A linked repository and scoring script should not be rewritten as “any independent researcher can fully reproduce it today.”

## Limitations and claim strength: where the zero stops

1. **One domain and one tool:** The test uses a simulated bank and one transfer_funds tool. It does not directly transfer to code execution, data access, refunds, procurement, asset movement, or agent-to-agent delegation.
2. **Selected CTF participants and outcome concentration:** Participants self-selected and competed for prizes. The 140 model-alone Level 2–4 outcomes come from only 24 source sessions, and one session accounts for 47.9%. This is an observation on one corpus, not an attacker-population estimate.
3. **Policy level and attack content vary together:** Each attack belongs to one policy configuration. Levels 1 and 5 have special policy meanings, and Level 4 authorizes many documented payments. A request rate pooled across levels cannot identify a causal policy effect.
4. **One run per cell and provider confounds:** Each cell ran once at its original temperature; there is no repeated-run variance estimate. Provider top_p and penalty defaults are not normalized, so cross-model rankings need caution.
5. **Incomplete coverage:** Multi-turn behind-layer cells are missing for Kimi and GLM and partial for Qwen. The headline uses completed cells, but still reflects their mixture. The denominator includes 582 provider input-filter refusals, which also affects individual model comparisons.
6. **Stricter local Level 4 engine:** The local engine checked for a memo confirmation code that the public pack does not require. This is a direct transfer limitation: do not attribute its zero to a different public configuration.
7. **No human validation of intent or judges:** All inputs came from attack attempts; allowlist membership only means the destination is permitted. The planned human validation slice was not completed. A deterministic endpoint avoids using judges for the headline but does not resolve whether a request itself was legitimate.
8. **Partial and gated artifact release:** The analysis rows can reproduce most tables as described by the authors, but not the entire environment. The harness, judge prompts, signing keys, and some private fields are unavailable, and downloading Parquet today requires gated access.
9. **Author conflict of interest:** APort, founded by the author, builds the evaluated authorization layer, and the author designed, ran, and analyzed the benchmark. The authors cite the deterministic metric, preregistration, error rows, and analysis script as structural mitigations; the evaluation still needs independent replication and policy audit.
10. **No model-internal causal claim or universal guarantee:** Similar request rates do not explain why a model complied. The layer’s effect depends on a correct policy, all tool paths traversing the gate, a passport that expresses the relevant restriction, and an enforcement point that is not misconfigured or bypassed.

## Engineering judgment: where to borrow this method, and when not to

**Bloss0m synthesis (not a new framework proposed by the authors):** If an agent can make payments, send mail, delete data, publish content, or change permissions, a benchmark can borrow the paper’s event separation: did the agent request an action; did the tool report success; what did policy decide; was the target permitted; and did a forbidden side effect occur anyway? Keep a shared evaluation/session key on every event, and report calls separately from evaluations to avoid mixing units when several calls occur in one trial. This is an evaluation recommendation derived from the paper’s measurement design, not a security validation of any product.

**A control point worth borrowing:** Put a deterministic check before every sensitive tool execution. Use the actual serialized parameters and a versioned policy for allow/deny; a denial should prevent the side-effect call from reaching the backend rather than only appearing in a log. Confirm that each action’s relevant parameters are expressible in policy, measure whether allowed payments still succeed, and rerun positive and negative cases after model, policy, and deployment changes. Infrastructure controls can complement model-level defenses; they do not replace identity checks, backend authorization, human approval, or data minimization.

**When not to copy the result directly:** A pre-tool check is not enough if the side effect cannot be observed or expressed as a structured decision before execution; if the checked recipient, amount, owner, or scope can diverge from the actual side-effect parameters; if another payment route bypasses the same gate; if policy does not distinguish legitimate exceptions from forbidden targets; or if the main risks are semantic misuse after authorization, fabricated business intent, or behavior accumulated across sessions. Those settings need their own policy model, bypass inventory, independent security tests, and auditable human intent validation. The paper does not provide those answers.

To design a benchmark inspired by this study, choose an external state change with a directly observable outcome, match model, prompt, tool schema, and replay track across architectures, and vary the execution boundary. Include both benign permitted tasks and adversarial attempts, cluster by participant/session or attack source, publish cell coverage and failures, test whether denied-call feedback changes later model behavior, and add benign false-denial and policy-misconfiguration evaluations. These are Bloss0m extensions of the paper’s approach; the paper did not complete all of them.

## Three things to remember

1. **Technical idea:** Treat the model’s payment request as a proposed action. The authorization decision must use the actual tool parameters, passport, and policy, and a trusted enforcement path must apply it before the side effect.
2. **Evidence:** On completed Level 2–4 benchmark cells, model alone has 140/76,842 unpermitted transfers versus 0/69,297 behind the layer; 68,970 matched triples yield 105 versus 0. Attach the 0.38% session-clustered upper bound across 790 sessions, and note that 25,370 successful payments still occurred.
3. **Adoption boundary:** This is a narrow result from a simulated payment tool, an author-run CTF corpus, a particular local engine, and incomplete gated artifacts. It supports testing the execution boundary; it is not a production security guarantee and does not establish the public Level 4 pack’s zero-event behavior.

## Further reading

- [Bounded Agents: Delegation Security for Multi-Agent AI Systems](/en/paper-reading/bounded-agents-delegation-security/): a different authorization argument about permission state, scope, and action composition.
- [Tool Calls Are Not Workflows: Agentic RAG Failure Attribution](/en/paper-reading/49-tool-calls-workflows-fail/): why tool-call records, execution state, and task completion need separate event definitions.

## Primary sources

- [Uchi Uchibeke, APort Vault, arXiv:2609.22076v1](https://arxiv.org/html/2609.22076v1) (this article is pinned to v1; the paper and three original figures carry CC BY 4.0).
- [Vault Benchmark v1 dataset card and access terms](https://huggingface.co/datasets/aporthq/vault-benchmark-v1) (checked 2026-09-24; files are publicly listed but gated behind sign-in and conditions; unauthenticated Parquet request returned 401).
- [Open Agent Passport specification repository](https://github.com/aporthq/aport-spec) and [finance.payment.charge.v1 public policy pack](https://github.com/aporthq/aport-policies/tree/main/finance.payment.charge.v1).
- [APort agent guardrails repository](https://github.com/aporthq/aport-agent-guardrails).
