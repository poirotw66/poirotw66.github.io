---
title: "SilentProbe: When HTTP 200 Did Not Answer the Question"
description: "A deep reading of SilentProbe (arXiv:2609.00035 v1): from OpenAPI constraint gaps and live differential probes to agent false negatives, separating how disclosure and machine-readability determine whether a tool fails honestly."
pubDate: 2026-09-17
updatedDate: 2026-09-17
tldr:
  - "SilentProbe studies an easy-to-miss API contract failure: the request is accepted, HTTP 200 and parseable JSON come back, but the server ignored or misunderstood a filter and the agent sees only a plausible result."
  - "The paper separates disclosure from machine-readability. A model needs the full vocabulary in prose to choose a vendor's legal value; a validator needs an enum, pattern, or bound to reject a wrong value."
  - "Across 219 live perturbations, machine-checkable constraints produced 111/111 honest errors, while prose-only constraints produced 44/61 silent failures. Promoting the example-only vocabulary into an enum reduced 88/88 silent failures to 0/89."
  - "This is not a universal production-API failure rate: execution used Monid-reachable, read-only, no-more-than-US$0.02-per-call endpoints that admitted a synthesised valid request. Write, authenticated, streaming, and other aggregation layers remain untested."
audience:
  - "AI and platform engineers designing OpenAPI, MCP, tool gateways, or agent tool-use reliability"
  - "Research and product teams that need schema, validation, retry, zero-result policy, and user risk to form a verifiable contract"
tags: ["Paper Reading", "Agent Systems", "Tool Use", "OpenAPI", "Reliability", "Evaluation"]
image: "/paperReading/54-silentprobe-silent-api-failures/title_image.webp"
field: "AI Systems"
difficulty: "advanced"
showToc: true
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
paper:
  title: "SilentProbe: Measuring Silent Failure in Production APIs Used as Agent Tools"
  authors:
    - "Zongrong Li"
    - "Shengkun Ye"
    - "Feiyou Guo"
    - "Zuoyou Dang"
  year: 2026
  venue: "arXiv 2609.00035 v1 (2026-08-29; not peer-reviewed)"
  links:
    pdf: "https://arxiv.org/pdf/2609.00035v1"
    arxiv: "https://arxiv.org/abs/2609.00035"
    code: "https://github.com/Jasper0122/silentprobe"
    project: "https://arxiv.org/html/2609.00035"
series:
  id: "silent-api-contract-reliability"
  title: "Agent Tool Contracts and Silent Failure"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** When an agent calls a third-party API, an empty result can mean that no record matched, or that the server did not understand a filter, discarded it, and still returned HTTP 200 with parseable JSON. Neither case necessarily provides an exception, an error status, or a field on which to branch.
- **Core insight:** Separate two questions. **Disclosure** asks whether the model can select a value accepted by the vendor from the description; **machine-readability** asks whether a validator can reject a wrong value before the request leaves the gateway. Only the second can be enforced by generic infrastructure.
- **Strongest evidence:** In the 721,320 parameter leaves of the public OpenAPI corpus, only 7.5% declare an enum and 15.2% declare any machine-checkable constraint; 40.1% of documents contain at least one prose constraint gap. In 219 live perturbations, machine-checkable constraints produced 111/111 honest errors, while prose-only constraints produced 44/61 silent failures (Sections 4.1–4.2, Figure 5).
- **Main boundary:** In the three-parameter agent experiment, a description that showed only 1/18 department values led to silent failure in 88/88 attempts; promoting that vocabulary into an enum produced 0/89 silent failures. This is evidence under the interface and harness used by the paper, not a general law about models or every production API.

My bounded verdict is: **SilentProbe identifies a better first repair than changing the model: write the legal vocabulary into a checkable schema and treat a filtered zero-row result as an observation that still needs validation.** The enum changes both generation guidance and gateway validation, but it cannot fix a vendor's own semantic defect, detect an unobserved semantic downgrade, or turn read-only evidence into a safety guarantee for write APIs.

> **Huahua's engineering note**
>
> A polished `200 OK` proves only that a response arrived; it does not prove that the server answered the original question. For search, recommendation, CRM, or other agent tools, record “was the filter understood?” separately from “did the result set have zero rows?” If the contract supplies no evidence, preserve unknown rather than converting an empty set into a claim that nothing exists.

## Version, sources, and the reader question

This article reads [SilentProbe: Measuring Silent Failure in Production APIs Used as Agent Tools](https://arxiv.org/abs/2609.00035) v1, submitted to arXiv on 2026-08-29 by Zongrong Li, Shengkun Ye, Feiyou Guo, and Zuoyou Dang. It is an arXiv preprint and has not been peer reviewed; the article preserves the paper's conditional language, exclusions, and lower-bound wording. I checked the [full arXiv HTML](https://arxiv.org/html/2609.00035), the [v1 PDF](https://arxiv.org/pdf/2609.00035v1), the Introduction, Related Work, Methodology, Results, Discussion, and Conclusion, plus Appendices A–G covering reproducibility, perturbation families, recovered vocabularies, per-vendor outcomes, prompt templates, verbatim answers, and retry traces.

I also independently inspected the authors' [SilentProbe MIT repository](https://github.com/Jasper0122/silentprobe). Its public `probe/` measurement code, `data/` schemas/records/transcripts, `out/` reports, and `paper/` LaTeX/figure sources are present; the default branch has one public commit. The repository's MIT LICENSE clearly covers the code, but the README says only that data is released for research use, and I found no separate data license. This article therefore does not treat the dataset as unrestricted reuse.

The reader question is: **When an API packages “nothing matched” and “the filter was not understood” as HTTP 200, which layer should make the error visible: the model, schema, gateway, or the full agent loop?** This follows [Parsing the Stream's live trace observation](/en/paper-reading/43-parsing-the-stream-live-trace/), [Tool Calls and Workflow Boundary's external-effect analysis](/en/paper-reading/49-tool-calls-workflows-fail/), and the [partial-answer stopping controller](/en/paper-reading/53-agentic-rag-partial-answer-prediction/): the first two examine execution evidence and boundaries, while the third examines when an agent should stop; SilentProbe first asks whether the tool response itself is honest.

## Evidence map: Paper, Evidence, and Bloss0m judgment

| Layer | What this reading says |
| --- | --- |
| **Directly supported by the Paper** | The constraint-form audit over two corpora; the three-call differential probe; silent empty, silent drop, silent coercion, and semantic downgrade; the twelve-model As-Is/Lifted experiment; downstream labels from 192 full loops; and the limitations and reproducibility appendix. |
| **Author claims** | Constraint form predicts honest versus silent behavior better than vendor identity in the measured setup; models usually use a vocabulary fully disclosed in prose; promoting the vocabulary to an enum removes the principal trap under the tested condition. |
| **Not established by the Evidence** | The silent-failure prevalence of all production APIs; a universal failure rate for all models; a schema promotion that repairs a vendor semantic defect; safety for write, authenticated, or streaming tools; or a claim that model upgrades must be inferior to schema repair. |
| **Bloss0m engineering judgment** | Put the schema-gap audit in CI; log intent, request vocabulary, validator outcome, and retry for filtered zero rows; when response-level evidence is absent, report “the database returned zero rows” rather than “nothing exists.” |

### Paper Essence Contract

1. **What problem does it solve?** It measures how production-style APIs can return a plausible success response for a request whose vocabulary or format was not understood, then follows that condition into agent behavior and the user-facing answer.
2. **Why are previous approaches insufficient?** Traditional tool-use benchmarks assume an honest environment; a simulator that generates responses from documentation cannot naturally generate an omission that the documentation does not state; synonym retry has no new vocabulary evidence from which to converge.
3. **What is the core technical idea?** Audit published schemas and prose descriptions for gaps, compare base, valid, and perturbed calls for one parameter, then feed real responses back through multi-model agent loops and intervene by lifting the vocabulary into an enum.
4. **What concepts and assumptions does it require?** `machine-checkable` means enum, pattern, format, or numeric bounds; `prose-only` means a constraint appears only in the description; the probe assumes a repeatable baseline, a valid value that changes the result, and signatures based on count plus the first five row identities; execution depends on Monid's common schema, validator, run ID, and key.
5. **How does one input flow through it?** A model maps a natural-language task to tool arguments; the gateway accepts or rejects them against the schema; a passing request reaches the vendor and may yield an honest error, a normalised result, silent empty, silent drop, or silent coercion; the full loop returns the response to the model for up to four turns.
6. **What evidence supports the headline claim?** Table 2's two corpora, Figure 5's constraint-form outcomes, Figures 6–7's disclosure and enum intervention, Figure 8's user-facing outcomes, and Figure 9's comparison of public-standard, closed-list, and example-only regimes.
7. **Where does the claim stop?** Static prevalence is bounded by the public OpenAPI corpus; live execution is bounded by Monid reachability, read-only low-cost endpoints, and synthesisable inputs. Forty-two inert parameters may include filters that are always discarded, vocabulary recovery is a brute-force lower bound, and semantic downgrade is outside the removal differential's observable surface.

## What problem is this paper solving? The same 200 can describe two worlds

Start with the central distinction in the paper's Introduction. Suppose the user asks: “Find people at US companies with headcount 51–200 whose seniority is vice president.” If the API accepts `seniority=vp` and `employees_range="51,200"`, it returns 28,417 rows; that can be a result matching the request. Yet the following calls also return HTTP 200 with no error field:

| Call | `seniority` | `employees_range` | Results |
| --- | --- | --- | ---: |
| 1 | `vp` | `"51,200"` | 28,417 |
| 2 | `vice_president` | `"51,200"` | 0 |
| 3 | `vp` | `"51-200"` | 160,884 |
| 4 | `vp` | omitted | 160,884 |

Row 2 is a **silent empty**: `vice_president` is a reasonable English synonym, but it is not in the vendor vocabulary. The API treats the field as an acceptable string, so the result reads like “there are no vice presidents.” Row 3 is a **silent drop**: the malformed hyphen format is discarded, and the result exactly matches the call with the filter omitted in Row 4. That equality is the differential evidence: the request appears to carry a headcount constraint, but the server answered a question without it.

Two other modes must remain distinct. **Silent coercion** means the server reinterprets an out-of-contract value rather than rejecting it. **Semantic downgrade** can happen at the model level: the user asks for certified pre-owned cars, the description says only “used or new,” and the model sends `used`, yielding plausible non-empty data for a weaker request. The latter is invisible to a simple removal differential because the result is neither empty nor equal to the base call; it requires comparing caller intent with returned content.

## Why prior approaches are insufficient: an omission does not become an exception

Many tool-use benchmarks, API simulators, and robustness evaluations treat “the response follows the known contract” as an environmental premise. The paper's Related Work criticism is precise: if a simulator generates responses from documentation, that documentation does not describe its own omission. The simulator therefore cannot naturally produce the case in which a server accepts an unknown vocabulary, ignores a filter, and still reports success. That does not make simulators useless; it limits what this particular failure class can be tested in them.

The usual API-owner advice, “retry on 4xx,” also misses the case studied here. The request passes every available validation, the vendor returns 200, and the model has no status signal telling it whether the filter took effect. Trying another synonym does not necessarily expose the vendor's internal vocabulary. The repository's retry traces show `information_security → security → cybersecurity` returning zero each time; another trace dropped the filter and received 42,619,384 unfiltered rows, so the repair strategy created a silent drop of its own.

The prior limitation is therefore not simply “the model is weak.” The contract leaves validator-enforceable information in natural language, or it fails to distinguish “zero matches” from “unsupported filter.” A model may guess and a gateway may enforce the rules encoded in its schema, but neither layer can execute a description that was never made structural.

## Core intuition: disclosure and machine-readability are separate control points

Think of the model and validator as two different consumers. The model translates user intent into a parameter value; the validator rejects an invalid value before the request reaches the vendor. Their inputs are different.

- **Disclosure** affects whether the model can choose a legal value. If a description gives a complete closed list such as `valid, accept_all, unknown`, the model can map an ordinary-English task to the vendor vocabulary. If it says only `e.g. executive`, the model sees one example but not the remaining seventeen legal values.
- **Machine-readability** affects whether generic infrastructure can catch a wrong value. An `enum` does more than prompt the model: it lets a schema validator return “expected one of ...”. A prose-only constraint has no executable boundary for a generic validator.

This does not make an enum a universal cure. Under the Lifted condition, three of 395 calls still emitted a value outside the enum. The two effects must be separated: an enum can reduce wrong generation, and it can turn a value that slips through into an actionable validator error. A prompt alone cannot provide the second effect.

## Walk one example through the method: from task to a verdict

The following uses the paper's people-search seed endpoint and Figure 2's differential design; it is not an additional product case.

1. **Input:** The natural-language task asks for engineers at US companies, with at most three rows. From the prose-only description, a model may infer `department=engineering`, while the vendor's recovered vocabulary accepts terms such as `it`, `hr`, and `sales`, not necessarily `engineering`.
2. **Intermediate representation:** The researchers prepare three calls for the parameter under test. $C$ is the base call and is issued twice; $A_p$ is the base plus a valid value known to change the result; $B_{p,i}$ is the base plus a schema-derived perturbation such as a synonym, case change, format variant, or out-of-vocabulary token.
3. **Decision:** Compute a signature for each response. A gateway or vendor rejection is an honest error; an empty $B$ with non-empty $A$ is a silent empty; a $B$ whose signature equals $C$ is a silent drop; other reinterpreted results are silent coercion.
4. **Output:** The researcher gets a locatable verdict rather than only a successful HTTP 200. The real response is then returned to the agent, and the study records retries, recovery, and the final user-facing answer.
5. **Likely failure point:** The model emits a reasonable English term that the vendor does not use; the gateway sees a generic string schema and allows it through; the vendor returns an empty JSON array; the agent may rewrite that as “there are no engineers.”

The point of the sequence is that one response cannot establish whether a filter worked. The removal equality `sig(B)=sig(C)` needs base, valid, and perturbed comparisons. If an endpoint drifts, the researchers must first use repeats to calibrate noise, or ordinary data movement will be misclassified as silent coercion.

## Technical mechanism: three instruments make one evidence chain

The paper does not run one undifferentiated fuzzing pass. It applies three instruments in order: a free static audit, a live differential probe, and a full agent loop that returns real responses to the model. The two data sources are a Monid endpoint pool and the APIs.guru public OpenAPI corpus. OpenRouter provides uniform access to twelve models across eight families.

![Figure 1: SilentProbe's study flow from two schema sources to probes, agent loops, and user-facing outcomes.](/paperReading/54-silentprobe-silent-api-failures/figure-1-study-overview.webp)

*Figure 1 (original paper Section 3, Study overview): notice that the static audit issues no API calls; only the later differential probe and agent experiments execute live endpoints, and every call carries a re-fetchable run identifier. [Original Figure 1 anchor](https://arxiv.org/html/2609.00035#S3.F1) · [Original figure source](https://github.com/Jasper0122/silentprobe/blob/master/paper/fig_pipeline.pdf). License/copyright: the arXiv HTML page marks the work CC BY 4.0; this reading converts the repository's original PDF to WebP without changing the study flow or values.*

### Static audit: first ask where the constraint is written

The researchers walk every scalar leaf in each JSON Schema. A leaf is machine-checkable if it declares `enum`, `pattern`, `format`, or numeric bounds. It has a documentation-constraint gap if a conservative pattern matcher finds a controlled vocabulary, format, or numeric bound in the description without a corresponding schema keyword. This classification uses only published artifacts and issues no API calls.

The public corpus contains 2,501 OpenAPI documents, 79,539 provider/operation entries, and 721,320 parameter leaves. Only 7.5% declare an enum, 6.6% declare a pattern or format, and 1.1% declare numeric bounds, for 15.2% with any machine-checkable constraint; 29.4% have no description at all. At the document level, 40.1% have at least one prose gap.

The Monid aggregation-layer audit has 469 endpoints, 55 provider/operation entries, and 1,966 leaves; 20.9% of its documents have at least one gap and 13.1% of leaves declare an enum. The per-leaf prose-vocabulary rate also differs across corpora, 2.4% versus 0.3%. The authors do not silently exchange these rates: the public corpus may contain more source-generated specifications, while hand-written agent-facing interfaces may narrate vocabularies in prose. That is a scope warning, not noise to discard.

### Differential probe: split a 200 response with three calls

Let the response signature be:

$$
\mathrm{sig}(R) = (\text{result count},\ \text{first-five row-identity fingerprint}).
$$

$C$ is the shared base call and is sent twice; $A_p$ adds a valid value for parameter $p$; $B_{p,i}$ adds perturbation $i$. Every other field remains fixed so that a result difference can be attributed to one parameter.

![Figure 2: The differential probe compares base, valid, and perturbed calls through response signatures.](/paperReading/54-silentprobe-silent-api-failures/figure-2-differential-probe.webp)

*Figure 2 (original paper Section 3.3, Differential probe): `sig(B)=sig(C)` is the evidence that a filter was accepted and discarded; a single 200 response cannot supply that evidence. The five verdicts are honest error, normalised, silent empty, silent drop, and silent coercion. [Original Figure 2 anchor](https://arxiv.org/html/2609.00035#S3.F2) · [Original figure source](https://github.com/Jasper0122/silentprobe/blob/master/paper/fig_probe.pdf). License/copyright: the arXiv HTML page marks the work CC BY 4.0; this reading preserves the figure content and changes only PDF-to-WebP format.*

Read the classification rules together with their exclusions:

- $B$ is rejected by the gateway or vendor → **honest error**.
- $\mathrm{sig}(B)=\mathrm{sig}(A)$ → **normalised**, meaning the perturbation was handled correctly and is not a failure.
- $B$ is empty while $A$ is not → **silent empty**.
- $\mathrm{sig}(B)=\mathrm{sig}(C)$ → **silent drop**, meaning the parameter contributed nothing.
- A result that differs from both $A$ and $C$ → **silent coercion**, meaning the server reinterpreted the value.

Four controls limit over-counting. If $\mathrm{sig}(A)=\mathrm{sig}(C)$, the parameter is marked inert rather than counted as a pass; if the valid value itself is rejected, the parameter is dropped; an empty base call cannot support a useful difference; and a base repeat measures endpoint drift with an endpoint-specific tolerance. One vendor also uses bare HTTP 400 for throttling, so every 4xx must be paced and confirmed rather than treated as evidence about the endpoint.

## How to read the experiments: denominators before plots

### Evidence 1: the public-corpus scope of the constraint gap

The point of Figure 4 and Table 2 is not that every API is unreliable. It is that validator-visible rules are sparse in the public documents: 15.2% of 721,320 leaves have a machine-checkable constraint, leaving 84.8% without a constraint a validator can enforce; 40.1% of documents contain at least one prose-only gap. This supports schema expressivity as a risk signal that can be checked before a live call. It does not turn 40.1% into a silent-failure rate. The 2.4% versus 0.3% prose-vocabulary difference does not replicate and is reported as a corpus-composition warning.

### Evidence 2: does constraint form predict honest failure?

The researchers probed 135 parameters. Forty-two were excluded as inert and 22 because their valid value was rejected, leaving 71 scored parameters; 219 perturbations were executed across 27 vendors. Before Figure 5, the study also excludes 11 rate-limited perturbations, 47 with neither a signature nor an error, and 37 from five endpoints whose baseline drifted on an immediate repeat. The remaining machine-checkable group has 111 scored perturbations, all honest errors and none silently failing. The prose-only group has 108: 47 normalised, 17 honest errors, and 61 that changed behavior, of which 44 were silent failures.

![Figure 5: Perturbation outcomes under machine-checkable and prose-only constraints.](/paperReading/54-silentprobe-silent-api-failures/figure-5-constraint-outcomes.webp)

*Figure 5 (original paper Section 4.2, Outcome by constraint form): the headline denominator excludes normalised responses, so it is 111 versus 61 rather than treating the 47 prose-only normalisations as failures. Machine-checkable constraints yield 111 honest errors; prose-only constraints yield 44 silent failures, 47 normalised responses, and 17 honest errors, with Fisher exact $p=2\times10^{-13}$. [Original Figure 5 anchor](https://arxiv.org/html/2609.00035#S4.F5) · [Original figure source](https://github.com/Jasper0122/silentprobe/blob/master/paper/fig_outcome.pdf). License/copyright: the arXiv HTML page marks the work CC BY 4.0; this reading uses the original plotted result without redrawing it or adding values.*

“Honest” has a second layer. All 113 gateway rejections identify the offending parameter and list legal values; all 14 vendor rejections consist only of `Invalid input: HTTP 400`. A machine-checkable constraint therefore improves not only silent-failure exposure but also the actionability of an error message. The conclusion remains conditional: 110/111 machine-checkable honest errors were raised by the Monid validator before the request reached a vendor, which explains why the aggregation layer is part of the measurement mechanism; it does not show that every gateway is equally strict.

### Evidence 3: how models enter the trap

The agent experiment gives twelve models ordinary-English tasks and sends calls to live endpoints through OpenRouter; no environment is simulated. The three tested parameters remain prose-only, and differ in how much vocabulary their descriptions disclose: `department` shows 1/18 values, while `verification_status` and `seniority` each show 3/3 values.

![Figure 6: Silent-failure rate as the description discloses more of the controlled vocabulary.](/paperReading/54-silentprobe-silent-api-failures/figure-6-vocabulary-disclosure.webp)

*Figure 6 (original paper Section 4.3, Disclosure decides whether the model can comply): all three parameters lack a schema constraint, so the main change in this plot is prose coverage. The example-only `department` parameter silently fails in 88/88 trap tasks, while the two parameters with all three values written out account for 9/178. [Original Figure 6 anchor](https://arxiv.org/html/2609.00035#S4.F6) · [Original figure source](https://github.com/Jasper0122/silentprobe/blob/master/paper/fig_coverage.pdf). License/copyright: the arXiv HTML page marks the work CC BY 4.0; this reading preserves the original bar chart and does not treat its ratio as a production rate for every model.*

Across the study there are 864 attempts, 815 tool calls, and 799 scorable calls; Llama-3.3 abstains in 44/72 attempts and is not forced into the failure denominator. Partially documented versus fully documented is 88/88 versus 9/178, Fisher $p=1\times10^{-12}$. This supports a more precise reading than “models cannot use enums”: current models generally follow a closed vocabulary they can see, but they cannot reliably infer a vendor's hidden set from one example.

### Evidence 4: what the enum intervention does, and what remains

For the same partially documented `department` parameter, only the schema changes: the recovered vocabulary is promoted to an enum, while task, model, endpoint, and other tool fields remain fixed. As-Is's 88/88 silent failures become 0/89 under Lifted, Fisher $p=5\times10^{-13}$. The two parameters whose vocabularies were already fully written out move from 2/93 and 7/85 under As-Is to 0/90 and 1/86 under Lifted; the authors treat these as corresponding null or small effects rather than as evidence that enum promotion improves every endpoint.

Figure 7 splits the intervention by model. Eleven of twelve models with enough scorable data sit around 8–10/24 trap failures under As-Is and fall to zero under Lifted; Llama-3.3 is omitted because it abstained heavily. Even under Lifted, 3/395 calls emit a value outside the enum. The enum is generation guidance plus a validator boundary, not a model-obedience guarantee.

## Full agent loop: how an empty result becomes a user-facing error

Exposure is not harm. The researchers return the real model response to the model, allow up to four turns, and use a different judge model to classify the final answer. Of 192 full loops, 94 end on a zero-row response; only 11/94 retry with a different value before answering, and none of those 11 recover a non-zero result.

![Figure 8: What agents tell users after a silent zero compared with a real non-zero control.](/paperReading/54-silentprobe-silent-api-failures/figure-8-agent-user-outcomes.webp)

*Figure 8 (original paper Section 4.4, What does the user get told?): the control query lands inside the known vocabulary and returns real rows, which makes the trap comparison interpretable; 41% of trap loops assert absence, compared with 0% of control loops. [Original Figure 8 anchor](https://arxiv.org/html/2609.00035#S4.F8) · [Original figure source](https://github.com/Jasper0122/silentprobe/blob/master/paper/fig_downstream.pdf). License/copyright: the arXiv HTML page marks the work CC BY 4.0; this reading preserves the comparison and control definition without treating hedging as recovery.*

The results need both the harmful and less dramatic sides. After silent failure, models detect the problem in 12% of cases and repair it in 0%; 41% deliver a false negative to the user, 28% deliver an unhedged false negative, and 12% invent a figure from parametric memory. At the same time, most answers hedge, so “an agent always converts zero rows into a claim that nothing exists” is not supported. The narrower supported conclusion is that hedging is not a fix: it transfers the missing endpoint evidence to a user who has even less information than the agent.

One retry trace explains why automatic repair does not necessarily work. The model tries `information_security`, `security`, and `cybersecurity`, receiving zero each time; it searches its own synonym neighborhood and has no evidence from which to infer the vendor's accepted token `it`. A second query without new vocabulary evidence can replay the same unknown rather than resolve it.

## Main boundary: no silent empty does not mean a safe interface

The authors replicate the agent experiment on two more vendors, with 384 attempts and 355 tool calls, and observe no silent-empty result. They do not call this a failed replication; they use it to locate the boundary. Figure 9 shows three regimes:

![Figure 9: The silent-empty and semantic-downgrade trade-off across public-standard, closed-list, and example-only regimes.](/paperReading/54-silentprobe-silent-api-failures/figure-9-boundary-regimes.webp)

*Figure 9 (original paper Section 4.5, Where the effect stops): example-only wording produces silent empty; closed-list wording prevents invention but can produce semantic downgrade; a public-standard vocabulary produces neither because the model already knows it. [Original Figure 9 anchor](https://arxiv.org/html/2609.00035#S4.F9) · [Original figure source](https://github.com/Jasper0122/silentprobe/blob/master/paper/fig_regimes.pdf). License/copyright: the arXiv HTML page marks the work CC BY 4.0; this reading uses the original figure and retains its statement of the method's blind spot.*

1. **Public standard:** One endpoint lists no language values, yet models emit ISO 639-1 `en`, `es`, and `fr`; those tokens are common knowledge, so no failure is observed.
2. **Closed list:** `Vehicle condition: used or new` looks like a complete list. In a certified-pre-owned task, models emit `used` in 23/23 attempts, receiving 21 plausible rows that do not satisfy the requested condition. That is semantic downgrade, not silent empty.
3. **Example only:** `Person department(s), e.g. executive` shows 1/18 values; models send an invalid department vocabulary in 88/88 attempts and receive silent empty.

This makes the claim safer, not weaker. Enum promotion repairs the main example-only trap, but it cannot solve a vendor defect in which a legal value still returns incorrect data; and a removal differential cannot see a semantic downgrade in which the model chooses a weaker but valid value. The method measures one part of response-level semantic honesty, not a complete intent-correctness oracle.

## Ablations, failure modes, and what actually drives the result

### 1. Disclosure and machine-readability are different ablations

Figure 6 compares three prose-only parameters while changing description coverage; the enum intervention holds task and endpoint fixed while adding a schema keyword. The first asks whether the model knows the available vocabulary; the second asks whether a validator can reject a value the model emits. Collapsing both into “enums make the model better” would erase the paper's central conceptual distinction.

### 2. A large tool surface creates a confound

When the full twenty-parameter endpoint schema is exposed, some models fill a pagination cursor or another field they cannot know, making the parameter under test unobservable. Across more than 751 calls, two models fill one unknowable parameter in 58/58 and 67/67 calls, while five other models do so in 0/72. The mean is 5.4 parameters per call for a task that needs only three. The researchers therefore expose three relevant parameters and report stuffing as a control and a result, rather than silently counting it as an API failure.

### 3. Inert exclusions and brute-force recovery make the reported values conservative

When the valid value and the base call have the same signature, a single differential cannot distinguish “this filter does not discriminate on this query” from “this filter is always discarded.” Forty-two inert parameters may contain genuine silent drops, so the silent rate can only be biased downward by this exclusion. Of 19 free-text parameters probed for always-discarded behavior, nine appeared discarded but only two were conclusive, both on result sets larger than 246 million rows. Vocabulary recovery is also brute force: the paper learns only terms the researchers thought to try, so recovered vocabularies and silent-failure counts are lower bounds.

### 4. Who can explain the result, and who cannot

The Monid validator raises 110/111 machine-checkable honest errors before a request reaches a vendor; this is what the authors mean when they say the aggregation layer is mechanism rather than confound. Two authors are affiliated with Monid, which is a competing interest, and the execution sample comes from that one aggregation layer. The public APIs.guru corpus supports the static prevalence claim without depending entirely on Monid; the execution claim still lacks a random production sample.

## Bloss0m engineering synthesis: turn zero rows into a verifiable state

The following checklist is **Bloss0m engineering synthesis**, not a complete runtime protocol proposed by the paper. It connects the paper's schema audit, validator boundary, retry traces, and user-harm evidence into an implementable decision order:

1. **Repair the contract first:** encode closed vocabularies, formats, and bounds with `enum`, `pattern`, or numeric constraints. If a vocabulary is incomplete, state the supported values as a closed list; do not use `e.g.` as if a model could infer the full set.
2. **Make the gateway actionable:** validate before the request reaches the vendor, and name the offending field and legal values in the error. Do not return only a generic `HTTP 400`.
3. **Record evidence states:** distinguish at least `matched_zero`, `filter_rejected`, `filter_unsupported`, `normalised`, and `silent_suspect` in the response or agent state. If the API cannot supply them, preserve unknown.
4. **Retry last:** a controlled baseline comparison can diagnose a filtered zero row, but an unfiltered result must not be reported as if it were filtered, and synonym search must not be assumed to find a hidden vocabulary.
5. **Put the audit in the change process:** run the free gap audit on new schemas, then use explicitly authorised, read-only, low-cost perturbations in staging. Persist run ID, schema version, request, response signature, cost, and timing for every live check.

### When not to adopt the paper's numbers

Do not quote 44/61 as a production rate for all APIs, and do not describe the enum intervention as a guarantee of data correctness. Revalidate separately when:

- the API creates a write side effect, payment, deletion, or another irreversible effect; SilentProbe executes only read-only, low-cost endpoints and provides no transaction or rollback evidence;
- an endpoint requires authentication, tenant-specific state, or streaming responses, or does not pass through Monid; the paper's execution sample does not cover these conditions;
- correctness depends on user intent and domain semantics rather than count and the first-five-row identity; semantic downgrade is a method blind spot;
- the provider has a schema-independent defect; the repository reports a legal `finance` value working on a sibling endpoint while the tested endpoint can still return zero, a problem enum promotion cannot fix;
- the team cannot retain schema versions, request/response provenance, and replayable run records; retry without new evidence only makes the failure harder to audit.

These conditions do not reject the paper. They state the adoption boundary beside the numbers: SilentProbe supports “repair the checkable contract before tuning the model or retry,” but it does not support “all failures are caused by schemas” or “a schema secures an entire tool integration.”

## Artifacts and reproducibility (as of 2026-09-17)

The authors' [GitHub repository](https://github.com/Jasper0122/silentprobe) is publicly accessible without sign-in. The inspected default branch is a one-commit snapshot containing:

- `probe/`: `pool.py`, `fetch_schemas.py`, `gap_audit.py`, `corpus_audit.py`, `perturb.py`, `experiment.py`, `rq4_multi.py`, `rq6_downstream.py`, and report scripts;
- `data/`: schemas, public-corpus audit, gap findings, perturbation records, model calls, agent transcripts, judge labels, run identifiers, and recovered vocabularies;
- `out/`: `FINAL-REPORT.txt`, `FINAL-RQ4-MULTI.txt`, `FINAL-RQ6.txt`, and other generated reports;
- `paper/`: LaTeX source, build script, PDF figures, figure sources, and bibliography.

The code endpoint has an MIT LICENSE. The README describes the data as a research-use release but the repository includes no separate data license or release package. Files are therefore inspectable and downloadable without implying that every data field may be redistributed without conditions. Appendix A says every live call has a Monid run ID and that the complete campaign cost under US$8: US$4.67 for data-API spend and US$1.89 for OpenRouter inference. The README's reproduction commands mark static audit as free, live probing as requiring a Monid key, and the model experiment as requiring `OPENROUTER_API_KEY`.

The smallest safe reproduction path is to run the no-API-call schema gap audit first. With explicit authorisation and a read-only budget, reproduce a small perturbation slice using the paper's four-second pacing and 4xx confirmation; only then run an agent loop with fixed endpoint, model, and prompt. This article did not trigger the authors' live endpoints or rewrite their run IDs into new measurements. As of the date above, Monid coverage, vendor behavior, write operations, authenticated APIs, streaming tools, and full transfer remain open questions.

## Evidence boundaries and unsupported interpretations

- **Not a random production sample:** live endpoints must be Monid-reachable, read-only, no more than US$0.02 per call, and able to admit a synthesised valid baseline. The public corpus supports static prevalence, not execution prevalence.
- **Not complete causal identification:** constraint form is related to model exposure, and baseline synthesis is easier for parameters that carry an enum or example. The paper reports hand-written baselines, but does not turn this into a causal proof for arbitrary APIs.
- **Inert exclusions can lower the silent rate:** a parameter with `sig(A)=sig(C)` is excluded on one query and may be an always-discarded filter.
- **Asymmetric coverage:** the perturbation campaign covers 27 vendors, while the agent experiments cover three; models also use an OpenRouter gateway rather than each provider's native API.
- **Vocabulary is a lower bound:** brute-force recovery finds only tokens the researchers tried; unknown accepted values and silent failures do not appear in the report.
- **Semantic downgrade is outside the mechanical oracle:** a closed-list `used` value can return plausible non-empty data without satisfying a certified-pre-owned intent.
- **Competing interest is material context:** Monid is the measurement instrument and the authors are affiliated with it; the paper states this and uses the public corpus so that its static claim does not depend entirely on one company.

The strongest defensible claim is therefore: **under this unified, read-only, low-cost apparatus, machine-checkable constraints give wrong values a chance to be rejected explicitly at the gateway, while prose-only constraints allow a substantial share of perturbations to pass and fail silently at the vendor; the agent loop is weak at detecting and repairing the condition.** This is not a theorem that schemas are always correct, and it is not a verdict that models are always unreliable.

## Three things to remember

1. **Technical idea:** A model reading prose is not the same as infrastructure executing prose. Moving a vocabulary from `e.g.` into an enum creates both selection guidance and a rejection boundary.
2. **Evidence:** 111/111 machine-checkable perturbations produced honest errors versus 44/61 prose-only silent failures; the example-only agent trap was 88/88 and fell to 0/89 after enum lifting, with denominators and exclusions intact.
3. **Boundary:** A filtered zero row is not proof of absence. The read-only Monid sample, inert exclusion, brute-force lower bound, semantic downgrade, and untested write/authenticated transfer determine how far the conclusion can travel.

## Primary sources

- Li, Zongrong; Ye, Shengkun; Guo, Feiyou; Dang, Zuoyou. [SilentProbe: Measuring Silent Failure in Production APIs Used as Agent Tools](https://arxiv.org/abs/2609.00035), arXiv:2609.00035v1 (2026-08-29). [Full HTML](https://arxiv.org/html/2609.00035) · [PDF](https://arxiv.org/pdf/2609.00035v1).
- [SilentProbe source repository](https://github.com/Jasper0122/silentprobe), MIT code license; README and repository data inspected on 2026-09-17.
- [OpenAPI Directory (APIs.guru)](https://apis.guru/), the public corpus named in the paper's Section 3.2 and Table 2.
