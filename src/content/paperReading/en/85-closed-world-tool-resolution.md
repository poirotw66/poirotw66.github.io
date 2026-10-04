---
title: "Closed-World Resolution: Why Tool Identity Must Precede Authorization"
description: "A close reading of Closed-World Resolution Against Tool Hallucination in LLM Agents: how fabricated tools, invalid arguments, and MCP namespace collisions can bypass ordinary gates, and where the evidence stops."
pubDate: 2026-10-04
updatedDate: 2026-10-04
tldr:
  - "Tool selection asks which known tool to use; authorization gating asks whether it may run. Both usually assume the call already names a real tool with the right signature."
  - "Across ten hosted models and two single-registry invocation surfaces, the authors classified 322 emitted tool hallucinations; fabricated names were more common on raw JSON than on a schema-enforced surface."
  - "Merging MCP servers creates structural collision and low-trust shadowing risks; the live ten-model study recorded 154 M1–M3 emissions."
  - "Closed-world resolution can reject errors decidable from a trusted registry and signature, but it cannot detect a schema-valid call to the wrong tool."
audience:
  - "Engineers building function-calling agents, MCP hosts, or tool execution gates"
  - "Researchers evaluating agent tool-use reliability and security controls"
tags: ["Paper Reading", "AI Agent", "Agent Security", "Evaluation", "MCP"]
image: "/paperReading/85-closed-world-tool-resolution/title_image.webp"
field: "AI Agent"
difficulty: "intermediate"
showToc: true
topics:
  - agent-safety-governance
  - tool-use-coding-agents
paper:
  title: "Closed-World Resolution Against Tool Hallucination in LLM Agents"
  authors:
    - "Laxmipriya Ganesh Iyer"
  year: 2026
  venue: "arXiv cs.AI preprint v1, submitted 2026-09-16; peer-review status not established"
  links:
    pdf: "https://arxiv.org/pdf/2609.19425v1"
    arxiv: "https://arxiv.org/abs/2609.19425"
series:
  id: "agent-tool-resolution"
  title: "Agent Tool Resolution and Execution Security"
  part: 1
  totalParts: 1
---

<!-- paper-reading-no-body-figures: The arXiv v1 page grants arXiv a perpetual non-exclusive distribution license, but no explicit third-party figure reuse permission was verified; this article links to Figures 1–4 and discusses their evidence without copying the images. -->

## The paper in 90 seconds

- **Problem:** Tool selection chooses among known tools, while an authorization gate constrains real tools. Both commonly assume that a call already maps to an existing registry entry. If a model emits a nonexistent name or an argument absent from the schema, the gate may have no contract to inspect.
- **Core insight:** Add closed-world resolution before policy evaluation: first verify that a tool exists in a trusted registry, then check its arguments against the declared signature. The mechanism is ordinary membership and type validation; the paper's main claim is about where this check must sit.
- **Strongest evidence:** The authors tested ten Amazon Bedrock-hosted models on two single-registry invocation surfaces, with 60 probes per model and surface, and classified 322 emitted H1–H5 hallucinations. A ten-model live study on a raw-JSON MCP surface recorded 154 M1–M3 events (Sections VI–VII, Figures 2–4, Tables I–III).
- **Main boundary:** Rates are point estimates from adversarial prompts, a chosen registry, named Bedrock model versions, and a small probe set. The gating-only stack's 322/322 executions and the resolver's 322/322 rejections follow from the threat model and algorithm; they are not independent measurements of production incident rates.

The paper's story is not the discovery of a new model jailbreak. It identifies an earlier omission in tool-security architecture: a policy gate asks whether an action is allowed, but a model may first invent a tool that does not exist in the registry. If the executor fails open when a call is unresolved, a gate may have no risk label or authorization predicate to consult. The authors put a simple registry/signature resolver before the gate, then extend the problem to MCP: when multiple servers are flattened into one namespace, name collisions and low-trust shadowing can misroute calls even if the model does not invent a name against a single registry.

This reading follows the cs.AI arXiv v1 submitted on September 16, 2026. As of this article's date, its peer-review status is not established. The sections below distinguish measured model emissions, defensive outcomes derived from the setup, and engineering interpretation.

## Prior approach limitation: three different security jobs

**Tool selection** chooses one or more known tools that may help with a request. **Authorization gating** decides whether a known tool call is admissible given state, risk, and permission. **Contract-integrity verification** can check whether a tool description or contract has been tampered with. These jobs have different inputs. If a name does not exist, the gate has no contract, risk label, or authorization rule for it. If the arguments are absent from a tool's signature, checking where the contract came from does not by itself tell us whether an extra argument is valid (Introduction; Section II).

The paper calls this a demand-side problem: defenses must inspect not only which tools are made available, but also what the model actually requests. This does not mean that every common framework necessarily fails open. The formal threat model explicitly assumes a fail-open executor: a call not rejected by the defense is executed. An executor that strictly rejects unknown names already implements a degenerate form of closed-world resolution (Section II). The conclusion is therefore conditional on an architectural assumption, not a universal report of production incidents.

## Core intuition: ask whether it exists before asking whether it is allowed

Let $R$ be a finite tool registry. Each tool $t$ has a signature $\sigma(t)$ describing accepted keys, required fields, types, enums, or ranges. A model emits a call $(n,\alpha)$, where $n$ is a name and $\alpha$ is an argument map. The closed-world resolver performs three checks: $n$ must exist in $R$; undeclared keys and missing required keys are rejected; and each value must satisfy its declared type and constraints (Section IV, Algorithm 1).

This is not a semantic correctness check. The resolver does not confirm that the model picked the best tool for the task, infer the user's actual intent, or guarantee that the registry itself is correct. It answers a narrower but necessary question: can this request be faithfully resolved to a registered tool, with arguments that match its declared interface? After resolution, the call still needs to pass a causal gate; contract-integrity verification and runtime effect verification address separate concerns. Section II places the contract-integrity verifier between the registry and the gate, but Section IV's Figure 1 and accompanying text place the contract verifier after the gate. That is an inconsistency in the paper's ordering descriptions, so it should not be collapsed into one definitive sequence. The paper is clear that runtime effect verification checks effects after the gate and action. Its central result remains that schema resolution must precede the gate. The paper does not propose replacing downstream authorization policy with a resolver.

## End-to-end worked example: walk a `transfer_funds` call

Suppose the user asks the agent to pay a reconciled invoice. The registry contains `transfer_funds`; its signature requires `recipient_id` as an opaque identifier and `amount` as a number within a defined range. There is no `override` argument.

1. **The model emits a call:** `transfer_funds(recipient_id="acct-7", amount="all of it", override=true)`. The name exists, but the value has the wrong type and the call includes an undeclared field.
2. **The resolver runs first:** `override` is absent from the signature, so the call is rejected as H2. Even if that field were removed, the string `all of it` would be rejected as H3 by a strict type check.
3. **The policy gate does not authorize this invalid call:** It makes decisions only about a resolved tool and its known risk data. This rejection occurs before authorization; it does not establish whether the user was allowed to transfer funds.
4. **The system can recover or stop:** A surrounding agent may ask for a corrected call, request clarification, or report invalid input. Those recovery behaviors are not the paper's main evaluation target.
5. **Where it fails:** If the model sends a valid `recipient_id` and a valid amount to the wrong tool that accepts the same fields, a schema resolver cannot see the intent mismatch. This is the irreducible H5 residue (Sections III–V).

This example is an engineering paraphrase of Algorithm 1, not a transcript from the paper's experiments. It isolates errors decidable from a signature; type checking should not be read as a defense against every incorrect or malicious action.

## Five classes of tool-call error

The authors organize the taxonomy by the layer at which an error becomes detectable (Section III).

| Class | What went wrong | Can the resolver decide it? |
| --- | --- | --- |
| H1: nonexistent tool | The name is not in the registry, such as `wipe_disk` | Yes; membership check rejects it |
| H2: hallucinated argument | The tool exists, but a key is undeclared or a required key is missing | Yes; compare with the signature |
| H3: type violation | The key exists, but its value violates a type, enum, or range | Yes; compare with the signature |
| H4: off-frontier real tool | The call is well formed, but the tool is not exposed on the current causal frontier | No; this is the gate's job |
| H5: borrowed argument shape | The call names tool A but carries a shape borrowed from B; if the arguments still satisfy A's signature, the schema cannot distinguish them | Only the subset that violates A's signature |

This taxonomy prevents every bad tool call from collapsing into one undifferentiated “hallucination.” H1–H3 are name or schema errors, H4 is a gate error tied to state or authorization, and the residual H5 is semantic tool confusion. Different control layers own these cases; a single blended success rate would hide what resolution and gating each guarantee.

## Method flow: why resolution has to precede the gate

The paper models a causal gate as a function defined only for tools in the registry. It reads the corresponding risk and authorization data, then decides using the current visible tool set $V$ and state $S$. For an H1 call where $n\notin R$, $R[n]$ does not exist and the gate cannot read the relevant contract fields. Under the fail-open assumption, a call that is not explicitly rejected may reach the executor (Section V, Propositions 1–2).

Moving the membership check after the gate does not fix the ordering problem: the gate has already been asked to decide about an unknown name, and a later contract verifier likewise has no trusted contract to compare. The authors therefore derive an ordering result: schema-detectable hallucination defense must occur before the causal gate. Runtime effect verification, when present, checks effects after authorization and action. Note that Section II places the contract-integrity verifier between the registry and gate, while Section IV's diagram and text place it after the gate; these descriptions conflict. This does not alter the main “resolve first, then gate” argument, but the paper does not support silently choosing one contract-verifier position. These propositions formalize consequences of the definitions and threat model; they are not deep mathematical theorems or an end-to-end security proof for every product runtime.

Another important assumption is a trusted registry. Both the resolver and the paper's classifier read the same $R$. A wrong signature, tampered registry, or omitted legitimate tool can therefore corrupt their shared reference. The paper leaves that source-integrity problem to a separate contract-verification assumption; membership checking alone does not establish supply-chain integrity (Section II and the note after Proposition 3).

## Single-registry evaluation: model emissions and derived execution outcomes

The authors tested ten models through Amazon Bedrock Converse API: Claude Opus 4.8, Sonnet 4.6, Haiku 4.5, Nova Premier, Nova 2 Lite, GPT-OSS-120B, Llama-3.1-8B, Llama-3.1-70B, Ministral-3-8B, and Mistral-Large-3 (675B). Each model received 60 probes on each invocation surface, including prompts designed for H1–H5, indirect injection, and ambiguous requests. The visible subset contained 10 tools, while the resolver checked outputs against a 100-tool registry (Section VI-A).

The two invocation surfaces were different. A **schema-enforced API** supplies the tool list and JSON schema during model generation. A **raw-JSON bridge** describes tools in the prompt and then parses JSON written by the model. This is not a controlled comparison of otherwise identical products; it is a study of two chosen ways to constrain model input and output.

Across the ten models and two surfaces, the authors classified 322 genuine H1–H5 hallucinations. Fabricated H1 names appeared 34 times on raw JSON and 3 times on the schema-enforced surface; all three schema-surface cases came from the two weakest open-weight models. Every model hallucinated at least once on raw JSON, with model-level unconditional rates around 13%–57%. At the same time, Opus and Sonnet had no-call fractions of 0.70 and 0.75 on adversarial schema probes. Some low hallucination rates therefore reflect frequent abstention, not simply reliable compliance when the model acts (Table I, Figure 2).

The Llama 8B/70B and Mistral 8B/675B pairs had raw-JSON rates around 0.55/0.57 and 0.45/0.55, respectively. These paired point estimates do not show that parameter scale necessarily removes tool hallucination. They are not a model-family scaling curve, and the study reports no confidence intervals or seed variation. With only 60 probes per model and surface, the results identify possible failure modes; they do not establish a stable prevalence rate for a model or production runtime.

The headline “322 execute with the gate-only stack, none with the full stack” combines different kinds of evidence. The 322 is a measured count of model emissions. The 322/322 and 0/322 execution outcomes follow from the fail-open executor, resolver rules, and call classification; the paper explicitly says they are not independent measurements of production execution incidents. The authors also distinguish 147 genuine type errors from 21 stringified numbers a lenient bridge might coerce, so serialization behavior is not silently counted as the same failure (Section VI-A, Table I, Figure 2).

## Controlled tests: class coverage and the H5 residue

Real models rarely triggered H4 or schema-valid H5 naturally, so the authors generated 400 deterministic scripted trials for each H1–H5 class. The same calls went through five pipelines: no defense, gate only, gate plus contract verification, resolver only, and the full stack. A separate track of 400 honest calls checked over-rejection, but the generator itself used the resolver's schema to define well-formedness. A zero-rejection result is therefore a construction-consistency check, not an independent false-reject rate on real traffic (Section VI-B, Table II, Figure 3).

The controlled results support the layer boundaries. A causal gate alone blocks H4 but, by the fail-open setup, misses H1–H3 and H5. The resolver blocks H1–H3 but does not decide whether a well-formed H4 call belongs on the current frontier. The combined stack reduces H1–H4 to zero, while H5 retains a 0.1525 attack-success rate. That H5 remainder is not an implementation oversight: it follows from indistinguishability. If arguments for tool A fully satisfy A's signature, the registry and types alone provide no evidence that the model intended tool B. The authors characterize this as a tool-selection problem and suggest “resolve, then select” as a direction to test, not as a measured improvement in this paper (Proposition 4; Section VI-B).

## MCP: multi-server merging creates ambiguity

The single-registry model assumes one authoritative tool list. An MCP host may connect to several servers and flatten their tools into one namespace for the model. The paper argues that this merge introduces server identity and trust differences that a single registry cannot express, and defines a second taxonomy, M1–M5 (Section VII).

| Class | New problem after MCP merge | Basic response |
| --- | --- | --- |
| M1: cross-server fabrication | No connected server provides the named tool | Check the deployment set; reject if there is no provider |
| M2: same-tier collision | Multiple servers expose the same name, so intent is ambiguous | Reject the flat name and require a server pin |
| M3: shadowing / rug pull | A lower-trust server claims a name also used by a higher-trust server | Reject cross-tier duplicates rather than guess a provider |
| M4: stale definition | The schema changes after listing | Compare the current schema with its listing digest |
| M5: cross-server signature borrowing | Arguments borrow the shape of a tool on another server | Check the selected `(server, tool)` signature |

An MCP resolver needs to resolve a call to a qualified `(S_i, t)` pair, not just a flat name. A unique provider can become a candidate; no provider means rejection; multiple providers are separated into shadowing or same-tier ambiguity; then the resolver checks the listing digest and finally the arguments (Section VII-C, Algorithm 2). This design assumes the host knows each server's identity, trust tier, schema updates, and digest. It is not a configuration that can be applied identically to every MCP implementation.

In the authors' four-server synthetic benchmark, each M1–M5 class received 400 trials. The naive host's 1.00 and the resolver's 0.00 follow directly from the chosen first-provider/fail-open policy and resolver rules; they are not natural incident rates collected from production hosts. The live MCP study exposed the merged catalog to ten Bedrock models and recorded 154 M1–M3 events: 62 shadowing, 52 collisions, and 40 cross-server fabrications. Opus 4.8 had no hallucinations in the single-registry schema-enforced test, but showed a 0.57 rate on this MCP surface. The authors argue this suggests merge topology can create failure modes independent of model scale. The live MCP evaluation still uses specific synthetic/real-shaped server manifests and adversarial prompts, not a cross-deployment incident census (Section VII-D, Table III, Figure 4).

The paper also measures a usability cost. Strictly rejecting every multi-provider flat call creates a 1.00 over-rejection rate for honest calls to same-tier name collisions; unique-provider or server-pinned calls have 0.00. A pin-assisted variant can auto-select a provider for same-tier collisions while still rejecting cross-tier shadows. However, a same-tier name may still refer to tools with different behavior. Pinning is a trade-off, not a guarantee of semantic correctness (Section VII-D, Table III).

## Evidence map: formal reasoning, live emissions, and scripted tests

| Evidence layer | Direct observation or paper claim | Reasonable interpretation | What it does not establish |
| --- | --- | --- | --- |
| Structural formalization (Section V) | With a trusted registry and fail-open assumptions, a gate has no contract for unknown names; pre-gate resolution can reject H1–H3 | The placement order is an explicit systems-design property | Every runtime fails open; a completed product-security proof |
| Single-registry live emissions (Section VI-A) | Ten models × two surfaces; 322 emissions, with H1=34 on raw JSON and H1=3 on schema surface | Invocation constraints and refusal behavior shape observable errors | A stable long-term rate on production traffic for every model |
| Controlled class tests (Section VI-B) | Scripted H1–H5 and honest calls compared through five pipelines | Isolates the logical coverage of the resolver/gate combinations and the H5 residue | Synthetic trial frequencies equal production prevalence; the self-generated honest set proves no false rejects |
| Live and synthetic MCP tests (Section VII) | 154 live M1–M3 emissions; synthetic cases cover M1–M5 | Merged namespaces merit explicit provider identity and trust tiers | All MCP hosts route with the same first-provider/fail-open behavior |
| HTB leaderboard (Section VIII) | The authors report visible-split scores for their resolvers and several baselines | A common benchmark could compare resolver designs | External validity of a leaderboard not independently rerun by other groups |

Read Figure 2 and Table I together across unconditional rate, conditional rate, and no-call fraction; treating refusal as either success or failure without qualification can distort the comparison. Figure 3's controlled outcomes should not be blended with live model emissions: the former are deterministic probes designed to exercise each class and policy outcome, while the latter are classified model outputs. Figure 4 places scripted MCP coverage beside live events, but its caption explicitly labels synthetic 1.00/0.00 values as by-construction results.

## HTB and reproducibility: a release claim still needs an accessible artifact

Section VIII describes the Hallucinated-Tools Benchmark (HTB) as a versioned, deterministic, installable package, with the commands `pip install toolguard` and `toolguard-bench`. It is said to include H1–H5, M1–M5, external baselines, real-shaped catalog adapters, and a held-out split not shipped with the public package. The public paper page does not link an author GitHub repository or project, nor a separate data download. At the time of this reading, the PyPI index returned no matching `toolguard` distribution. The paper's description of HTB therefore does not by itself establish that readers can currently obtain the package or held-out data. Availability is stated as of October 4, 2026 and should be rechecked against an explicitly linked author release.

The paper says it commits classified model-call transcripts so readers can inspect each classification, but raw provider response envelopes are not public; recomputing the live model rates from scratch still requires Bedrock access and rerunning the probes. The controlled trials are described as seeded, offline, and deterministic, but this reading could not verify them through an accessible package. All results in this article are author-reported; no independent rerun or external HTB score was established. Before attempting reproduction, locate the versioned package, transcripts, registry, held-out split specification, Bedrock model IDs, and probe seed, then distinguish re-analysis from model reruns.

## Limitations and alternative explanations

1. **Limited external validity:** The single-registry experiments use a fixed 100-tool synthetic registry; the MCP experiment uses a four-server setup. The model outputs come from hosted APIs, but there are only 60 probes per model and surface, without confidence intervals or seed variation. These data do not establish stable prevalence (Section X).
2. **Most execution outcomes are conditional consequences:** The gate-only 322/322 and resolver 0/322 outcomes follow from the fail-open threat model and resolver definition. They clarify a system property; they are not 322 observed side effects against live systems.
3. **Honest false-reject evidence is self-referential:** The authors define well-formed calls and generate them using the resolver's own schema. The 0.00 over-rejection value is a construction-consistency check. The authors note the need for a real false-reject test using an independent honest-call corpus or live honest emissions (Section X).
4. **The H5 remedy remains untested:** The paper maps schema-valid borrowing to tool selection but does not compose a real selection layer after the resolver to measure whether it shrinks the residue. The 0.1525 is a sample estimate from the synthetic borrowed-signature construction, not a rate to transfer to real catalogs.
5. **The tool list must be trustworthy:** Incorrect or tampered signatures, registry races, omitted tools, and errors in server trust labels can undermine the resolver's reference. MCP digest checks address listing freshness, but trust roots and safe maintenance of trust tiers remain deployment responsibilities.
6. **Rejection and disambiguation need a product workflow:** Strict rejection can reduce usability; pin-assisted routing preserves semantic uncertainty. Systems still need clear errors, bounded retries, human confirmation, and fail-closed behavior, none of which this paper evaluates end to end.
7. **Models and APIs change over time:** The study names specific 2026 model versions. Tool APIs, model versions, refusal behavior, and hosted availability change; a reproduction must pin the actual model versions and request settings rather than treating the findings as permanent model properties.

## Bloss0m engineering judgment: separate resolution from authorization

> **Huahua's engineering note**
>
> Passing a schema check means a call matches the registered interface. It does not mean the action is authorized or that the model chose the right tool.

The following is **Bloss0m engineering synthesis**, not an end-to-end deployment recipe evaluated by the authors. Tool dispatch can be divided into two main control boundaries:

1. **Resolve and validate input:** Resolve tool identity against a trusted, versioned registry and validate every field, required value, and type. Unknown or ambiguous names should be rejected or require a server pin; they should not reach the executor.
2. **Authorize against context:** Only a resolved, well-formed call should reach a risk/policy gate that evaluates user permissions, current state, tool effects, and causal frontier.
3. **Execute and verify effects:** After authorization, record the final bound tool identity, signature version, policy decision, and execution outcome. If the registry or server schema changes, resolve again rather than reuse a stale listing.
4. **Keep semantic selection separate:** Evaluate why a tool fits the intent separately from its identity and signature. A resolver cannot replace tool selection or user confirmation.

This division suits systems where calls can be intercepted safely, the registry is authoritative, and unknown names are not silently routed. If an API already enforces exact membership and rejects unknown arguments, verify that a pre-gate layer uses the same parsing semantics to avoid drift. Dynamic schemas, server discovery, effects that change after authorization, and multiple providers require explicit pinning, versioning, and time-of-check/time-of-use handling. A plain JSON Schema validator does not cover those issues.

## Three things to remember

1. **Technical idea:** Tool selection, authorization gating, and registry/signature resolution have separate responsibilities. H1–H3 need resolution before the gate; H4 belongs to gating; schema-valid H5 remains a semantic selection problem.
2. **Evidence:** The 322 and 154 counts are classified model emissions. Execution/blocking ratios derived under fail-open assumptions and fixed scripted outcomes should not be reported as production incident measurements.
3. **Adoption boundary:** A trusted registry, MCP server identity, fresh schemas, and explicit rejection behavior are prerequisites. This paper does not establish an independent benchmark rerun and does not solve tool-intent confusion for schema-valid calls.

## Further reading

- [Who Holds the Pen? Let Specifications, Not Agents, Sign Off](/en/paper-reading/76-specifications-not-agents-sign-off/): extends runtime authorization to who controls task state and acceptance.
- [LLM Agents Can Easily Tamper With Their Own Traces](/en/paper-reading/77-llm-agents-can-easily-tamper-with-traces/): examines the boundary between agent-accessible execution traces and trusted observation.
- [Evaluating Agent Skills for Version-Specific Plugin Migration](/en/paper-reading/75-agent-skills-version-specific-plugin-migration/): studies how tool and instruction interfaces affect coding-agent task performance.

## Primary sources

- Iyer, L. G. (2026). [Closed-World Resolution Against Tool Hallucination in LLM Agents, arXiv v1](https://arxiv.org/abs/2609.19425); [full HTML and Figures 1–4](https://arxiv.org/html/2609.19425v1).
- [arXiv perpetual non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html) (the license states arXiv's distribution right; this reading does not interpret it as author permission for third parties to reproduce the figures).
