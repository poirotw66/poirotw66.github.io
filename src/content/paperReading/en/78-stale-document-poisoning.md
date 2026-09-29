---
title: "Stale-Document Poisoning: How RAG Can Recognize Evidence That No Longer Applies"
description: "Authentic, once-correct documents can make RAG overturn an answer the model already got right. This reading examines 317 cross-domain knowledge reversals, the difference between dates and validity intervals, causal interventions, and a reranker whose gains depend on trustworthy metadata."
pubDate: 2026-09-29
updatedDate: 2026-09-29
tldr:
  - "Stale-document poisoning is not malicious prompt injection: an authentic, once-correct document can still reverse a model’s correct answer after its conditions stop applying."
  - "The 317 reversals cover 87 medical, 100 legal, 60 software/API, and 70 platform-policy items. Poisoning is counted only among items each model answered correctly without retrieval, so denominators vary by model and domain."
  - "In a 50-item control with explicit validity boundaries, dates alone barely separate valid from superseded evidence. With the boundary stated, Qwen-72B makes 50/50 transitions and Llama-70B makes 47/50 with prose and 50/50 with a table."
  - "A fixed reranker lowers poisoning by 4.6–10.0 percentage points in four medical/legal cells when dates are correct. Gains are small and nonsignificant when dates are absent; incorrect dates can make selection worse."
audience:
  - "Engineers building long-lived knowledge bases, RAG, or document question-answering systems"
  - "Researchers studying time-sensitive QA, model knowledge conflicts, and retrieval evaluation"
tags: ["Paper Reading", "Retrieval", "RAG", "Evaluation", "AI Safety", "LLM"]
image: "/paperReading/78-stale-document-poisoning/title_image.webp"
field: "NLP"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-evaluation-observability
paper:
  title: "Stale-Document Poisoning: When Outdated Retrieval Overrides Correct Model Answers"
  authors:
    - "Md Shamim Ahmed"
    - "Lukas Galke Poech"
    - "Richard Röttger"
  year: 2026
  venue: "arXiv cs.CL preprint, v1 (2026-09-25; peer-review status unverified)"
  links:
    pdf: "https://arxiv.org/pdf/2609.31342v1"
    arxiv: "https://arxiv.org/abs/2609.31342"
    doi: "https://doi.org/10.48550/arXiv.2609.31342"
---

This reading follows arXiv v1, submitted on 2026-09-25. The source labels the paper CC BY 4.0; peer-review status is not established by the source. [Paper v1](https://arxiv.org/abs/2609.31342v1) asks a narrower and more operational question than whether models can be influenced by bad documents: when a model already answers correctly, can a genuine document that used to be valid but no longer applies make retrieval reverse that answer?

## The paper in 90 seconds

- **Problem:** Retrieval can supply information that a model has not learned, but a knowledge base can also become stale. If an old document remains relevant, authoritative, and historically correct, will a model follow it without recognizing that its applicability has ended?
- **Core idea:** The authors separate what a document says from when it applies. In the poisoning experiments, they count only items a model answered correctly without retrieval and then failed after seeing stale evidence. In a temporal-applicability control, they hold the historical evidence fixed and vary only the date of the question.
- **Strongest evidence:** Conditional poisoning across open models and domains ranges from 17% to 91%, not an estimated error prevalence for all RAG queries. On 50 reversals, date-only applicability gaps are just 0.04–0.14 across four models; with explicit validity boundaries, the gaps rise to 0.94–1.00 for the two larger models. Figures 2 and 3 show these distinct forms of evidence.
- **Main boundary:** A large model can switch when a prompt states the validity boundary. That does not show it can infer a correct legal, medical, or software validity period from arbitrary documents. The reranker’s gains also depend on accurate dates.

**The paper’s story:** Existing RAG evaluations often treat external evidence as a way to supplement a model. Yet an authoritative old guideline can remain highly relevant and historically trustworthy. The authors build a source-grounded set of knowledge reversals, measure whether stale evidence overturns answers, then use date-paired prompts with identical evidence to separate temporal applicability from content changes. Activation patching tests whether applicability information can causally affect an answer. The results suggest that models readily use current evidence but do not reliably translate a document date into a judgment about whether it applies now; incorrect dates can also undermine a retrieval-side defense. The problem therefore extends beyond finding relevant material to deciding whether it still has authority for the current question.

> **Huahua's engineering note**
>
> “Published earlier” does not mean “expired now,” and “published later” does not mean “currently applicable.” A system needs verifiable records of effective periods, withdrawals, or supersession; it cannot safely ask a model to guess the rule from a year alone.

## Three failures that should not be conflated

The paper defines stale-document poisoning as a retrieval-induced failure. For item `i`, a timely answer is correct at the evaluation time, while old evidence `dᵢ` supports an answer `yᵢold` that used to be correct but has been superseded. The item counts as poisoned only if the same model answered correctly without retrieval and, after receiving the old document, no longer gives the timely answer (Section 2, Equation 1). This is neither an ordinary QA error nor an automatic failure every time retrieval returns an old document.

It is also different from adversarial poisoning and indirect prompt injection. Those settings typically emphasize how an attacker fabricates, places, or manipulates content. The central documents here can be official, authentic, and once applicable; they require no attacker, forgery, or embedded instruction. They become harmful because their conditions have changed (Section 1). This does not make authentic documents inherently safe. Authenticity answers whether a source is what it claims to be; temporal applicability asks whether its claim still governs this question. They are separate properties.

A third distinction is between stale parametric knowledge and stale retrieved evidence. A model’s weights may not contain a new fact. The paper’s primary poisoning measure deliberately excludes items the model already gets wrong without retrieval, then asks whether external old evidence overrides an answer it had right. The authors separately compare settled and recent medical reversals and find recent items harder, but the two sets contain different questions. Residual difficulty differences remain possible, so the comparison supports “recent reversals are harder” without fully identifying a pure time effect (Figure 2a, Appendix D).

## Why prior approaches are insufficient

A relevance score can find a document that matches the question while ignoring whether its recommendation still governs the requested date. A publication date identifies when text appeared, not when its advice became effective or was withdrawn. This gap motivates the paper’s validity-controlled comparisons; it does not imply that all older documents should be discarded.

## Core intuition and conceptual scaffold: relevance, date, and applicability are different fields

The paper’s conceptual contribution is not a new temporal-reasoning algorithm. It separates three questions that are easy to collapse: is a retrieved document relevant to the question, when was it published, and is its recommendation valid at the time asked? The first is retrieval matching; the second is a document property; the third requires source, rule, and time to support an applicability judgment. If a policy was published in 2022 and revised in 2024, “2022” alone neither proves it is still valid nor tells us when it stopped applying.

Section 2 formalizes two related but non-interchangeable quantities. For model `m`, `Eₘ` is the set of items it answered correctly without retrieved context. The poisoning rate `Pₘ` divides by `|Eₘ|` and measures the share of those items that no longer receive the timely answer after stale evidence is supplied. On the temporal-applicability subset, `Rₘ(v)` is the old-answer rate when `v=1` means the document remains within its verified validity interval and `v=0` means it has been superseded. The applicability gap `Gₘ=Rₘ(1)-Rₘ(0)` is larger when the model changes its reliance on the same evidence between valid and stale dates.

The metrics answer different questions. `Pₘ` compares a current answer with a document supporting an old answer and measures retrieval-induced reversals. `Gₘ` pairs the same historical document with different evaluation dates and measures whether trust tracks applicability. The first establishes that the failure occurs; the second isolates the temporal question from document-content changes. The authors describe the broader behavior as selective epistemic trust. I use “selective evidence trust” as a reader-facing translation; it is an explanatory concept, not a general-purpose module implemented by the paper.

Figure 1’s simplified account starts with a timely prior that is correct without retrieval. After an outdated document enters, the timely-answer margin drops markedly near the output. Poisoning also occurs with neutral retrieval, while a follow directive raises the risk. By contrast, matched current documents are followed in 97%–100% of the medical trials. This comparison suggests the result is not that models cannot use retrieval; rather, their deference does not reliably depend on whether the evidence still applies.

![Figure 1: Conceptual path from a correct model prior to an answer overridden by stale evidence](/paperReading/78-stale-document-poisoning/figures/figure-1-concept.png)

*Figure 1 (Section 1, conceptual overview): Notice that the timely prior is suppressed mainly in later layers, that neutral retrieval can already change the answer, and that a follow directive amplifies the effect. Matched current evidence is the important contrast. Original source: [arXiv v1 Figure 1](https://arxiv.org/html/2609.31342v1#S1.F1). Original author artwork, reused under CC BY 4.0 as stated on the paper page.*

## End-to-end worked example: Walk one reversal through the method

An item in the benchmark can be abstracted as an official recommendation that changed from an old answer to a new answer. The real items were constructed from dated official sources; this walkthrough describes the evaluation structure rather than inventing an unchecked example.

1. **Build a reversal pair.** Researchers record question `qᵢ`, the timely answer `yᵢ*`, a formerly correct answer `yᵢold`, and dated official sources supporting each. Current and old documents use a shared format; they differ chiefly in the recommendation and whether it has been superseded (Section 2, Appendix A).
2. **Measure the no-retrieval baseline.** The model answers without external documents. Only items where it gives `yᵢ*` enter `Eₘ`. If it was already wrong, the later experiment cannot call it “retrieval turning a correct answer wrong,” so it stays out of the poisoning denominator.
3. **Supply the old evidence.** The same model sees an authentic historical document. A fixed-reference judge labels the answer timely, superseded, or unclear. The primary poisoning outcome counts any answer not labeled timely; a supplementary analysis also checks results after excluding unclear answers (Appendices C and J).
4. **Pair with current evidence.** For the 87 medical items, the authors substitute a matched up-to-date document. Four models give the timely answer on all 87; Qwen-7B and Llama-8B each do so on 86/87. Among items initially wrong without retrieval, the current evidence recovers 97%–100% (Appendix E). This checks that models are not simply unable to use retrieval.
5. **Isolate time.** On a 50-item subset with clear official validity boundaries, the question, options, instructions, and historical evidence stay fixed. Each prompt places the evaluation date once inside the validity period and once after it. The paper compares date-only, prose boundary, and table boundary formats (Section 2, Appendix F).
6. **Test internal causal influence.** On up to 20 behaviorally eligible items per large model, the authors patch the internal state at the evaluation-date position between paired prompts, with reverse, self-patch, and unchanged source-date controls. This tests whether information can change answer preference; it is not an intervention product evaluated in deployed generation (Appendices G–H).

Potential failure points remain throughout the chain: an official page may not be fully archived; a publication date may differ from an effective date; identifying supersession can require contextual interpretation; a model may switch only in an explicit forced-choice format; and a retriever may treat an incorrect date as a ranking signal. Source verification in the benchmark reduces some uncertainty but does not make these operational problems disappear.

## Benchmark and judgment protocol

The knowledge-reversal benchmark has 317 items: 87 medical, 100 legal, 60 software/API, and 70 platform-policy items. Each has an official source URL, and a fixed benchmark snapshot prevents later corpus updates from silently changing the reported evaluation. New versions may add reversals, but they do not alter this paper’s frozen snapshot (Section 2). Twelve models take part in the medical recent-versus-settled analysis: six API models and six open-weight models from roughly 4B to 72B parameters. The main four-domain poisoning grid instead uses Qwen2.5 and Llama 3.1 models at 7B/8B and 70B/72B. Figure 2a and 2b use different subsets; neither is a pooled rate.

An automatic judge classifies free-text answers as timely, superseded, or unclear against fixed reference answers. The authors validate it in two ways. A second judge from another model family relabels 840 stored medical answers from seven models, with Cohen’s κ=0.93. Separately, two external PhD students blindly label a stratified sample of 200 answers spanning all four domains, model families, and unaided and stale-document conditions. A separate blinded adjudicator resolves the 48 initial disagreements. Against the final human labels, the automatic judge reaches 92.5% accuracy (95% CI 88.9%–95.9%) and macro-F1 0.894 (95% CI 0.836–0.941); intervals use item-clustered bootstrap over 152 underlying items (Appendix C). This makes the automatic labels auditable, but it does not turn them into error-free human ground truth.

Only 39 of 87 official medical pages were archived automatically; URLs and capture status remain for the rest. The authors report that 460 nonmedical snapshots passed provenance, temporal-validity, duplicate, and archive-integrity checks (Section 2, Appendix A). These are artifact-audit results, not evidence that independent domain experts re-evaluated every clinical or legal claim.

## Result 1: recent reversals are harder, and stale evidence can undo a correct answer

Figure 2a compares no-retrieval performance on settled and recent medical reversals. All twelve models are near ceiling on many long-settled items, but accuracy falls on recent changes: for example, 0.61 for Qwen-7B, 0.64 for Llama-8B, 0.76 for GPT-4o, and 0.87 for Claude-Opus-4.5. After multiple-comparison correction, 10/12 models retain a significant difference. Because the groups contain different questions, residual difficulty differences cannot be ruled out; the analysis is medical only (Figure 2a, Appendix D). This provides context about changing knowledge, but it is not the primary stale-document poisoning measure.

Figure 2b’s cross-domain rates count only items each model answered correctly without retrieval. Under instructions to follow the evidence, conditional poisoning ranges from 0.167 to 0.906 across the four tested models and domains. Llama-3.1-70B reaches 58/64 (0.906) in medicine; Qwen2.5-72B reaches 47/55 (0.855). The lowest cell is software/API at 7/42 for Llama-70B. Law and policy are not uniformly low either: Qwen-7B is 34/55 (0.618) in law and 20/37 (0.541) in policy. The denominators vary with each model’s no-retrieval correctness, so 17%–91% describes conditional rates in the evaluated models and conditions—not prevalence across all RAG queries (Appendix E, Table 5).

With neutral retrieved-document wording, the medical comparison reports poisoning of 30% for Llama and 37% for Qwen. Explicitly instructing the model to follow the document when it conflicts with prior knowledge raises those rates to 66% and 75%. In the 2×2 prompt factorial, under a neutral header, the instruction moves Qwen from 0.37 to 0.75 (n=51, OR 4.92, 95% CI 2.59–9.34) and Llama from 0.30 to 0.66 (n=53, OR 4.50, 95% CI 2.46–8.23). For each model, 19 items deteriorate and none improve (exact McNemar p=3.8×10⁻⁶). Once the follow directive is present, labeling the header “most current” adds no detectable effect (Section 3.4, Appendix K). This supports an instruction-pressure effect in the tested prompts, not a universal effect for every product prompt.

![Figure 2: Recent knowledge reversals, cross-domain poisoning, and paired changes under follow instructions](/paperReading/78-stale-document-poisoning/figures/figure-2-phenomenon.png)

*Figure 2 (Section 3.1, behavioral results): (a) no-retrieval accuracy on settled and recent medical reversals; (b) poisoned rates across four domains; (c) paired change from document-only to instructed retrieval. Keep each cell’s distinct eligible denominator in view; the panels do not establish general prevalence. Original source: [arXiv v1 Figure 2](https://arxiv.org/html/2609.31342v1#S3.F2). Original author artwork, reused under CC BY 4.0 as stated on the paper page.*

## Result 2: a document date is not a validity interval

If the current and outdated documents in Figure 2 support different recommendations, content differences could drive answer changes. Figure 3 and Appendix F address this confound. In 50 source-verified reversals with explicit applicability boundaries, the same historical evidence, question, options, and instructions appear at a valid evaluation date and again after supersession. Only the evaluation date changes. The authors compare date-only input with an explicit prose boundary and a table boundary. The 50 items comprise a frozen 21-item set, a 12-item replication, and a 17-item extension. Each of four models completes 600 cells; the main analysis uses neutral instructions and a fixed parser rather than a free-text judge (Appendix F).

Date-only applicability gaps for Qwen-7B, Llama-8B, Qwen-72B, and Llama-70B are 0.06, 0.04, 0.12, and 0.14. The larger models are somewhat higher, but the differences remain small. With an explicit boundary, Qwen-72B makes all 50 old-to-current transitions in prose and table formats. Llama-70B makes 47/50 with prose and 50/50 with a table. The corresponding date-only transition counts for these models are just 6/50 and 7/50. Under the gap definition, explicit boundaries produce 0.94–1.00 for the large models; smaller models improve more modestly: Qwen-7B reaches 0.18/0.42 and Llama-8B 0.30/0.28 for prose/table. Intervals use item-clustered bootstrap (Figure 3, Appendix F, Table 7).

This is closer to “an explicit rule lets some models apply a comparison capability” than to “the model has reliable temporal awareness.” Directly stating the date when an old recommendation stopped applying is a stronger condition than merely showing a source date. A real system still needs a person or process to identify that boundary from an authoritative source and preserve it accurately. The Windows-support example in Figure 3 illustrates the control format; it should not be generalized to every policy document.

![Figure 3: The same historical evidence under different question dates and validity-boundary formats](/paperReading/78-stale-document-poisoning/figures/figure-3-applicability.webp)

*Figure 3 (Section 3.2, Appendix F, temporal-applicability control): The left panel keeps historical content fixed and changes only the evaluation date; the right compares date-only input with prose and table boundaries. The key distinction is between merely listing a date and stating when support ends. Original source: [arXiv v1 Figure 3](https://arxiv.org/html/2609.31342v1#S3.F3). Original author artwork, reused under CC BY 4.0 as stated on the paper page.*

## Result 3: applicability information reaches the decision, without revealing a time-specific circuit

The authors perform bidirectional activation patching on Qwen-72B and Llama-70B. They transfer the internal state at the evaluation-date span from a valid-date prompt into its stale-date pair and then reverse the transfer. Controls patch the unchanged source-date span or perform a self-patch. Each large model contributes at most 20 items that independently show the expected answer-logit preferences, so these are mechanism estimates on eligible items—not average behavior across all 50 items or free-form generations (Section 2, Appendix G).

At layer zero, transferring the complete residual state shifts answer preference by 23.08 logits for Qwen-72B (95% cluster-bootstrap CI 21.06–25.53) and 7.82 for Llama-70B (6.92–8.65). The reverse patch shifts preference in the opposite direction. Patching the unchanged source-date position moves the margin only 0.04 and 0.03; self-patches are essentially zero. Tracing through layers shows the effect gradually reaching the final decision representation. The authors report that attention is a stronger early contributor, then select candidate heads on 10 discovery items and freeze them for a separate 10-item confirmation set (Appendices G–H).

A crucial boundary is that the same heads also contribute to ordinary date comparison and non-temporal numeric-threshold tasks. The paper therefore does not claim a dedicated temporal circuit. A more defensible reading is that a shared comparison-and-decision pathway contains components relevant to temporal applicability. The confirmation set is only 10 items per model, and the interventions use explicit options and logit margins. They do not directly establish that unconstrained generation in production RAG uses the same pathway. The mechanism evidence answers “can explicit applicability information influence the answer?” It does not answer “can the model find a trustworthy validity source on its own?”

## Diagnostic analysis: failure modes, subgroups, and retrieval cost

Section 3.5 and Appendix N evaluate a fixed hybrid reranker whose weights were not tuned on test outcomes. Each retrieval set contains one current and two outdated documents. Dense retrieval supplies the top four candidates; the reranker scores them as:

$$
s(d,q)=0.5\,\cos(d,q)+0.5\,r(d)+0.1\,I_{\mathrm{sup}}(d)
$$

Here `cos(d,q)` is semantic similarity, `r(d)` is the min–max normalized document year within the index, and `I_sup` is 1 when the document explicitly signals supersession. This is the tested fixed heuristic, not a general method for identifying validity. The dense baseline uses `all-MiniLM-L6-v2`; downstream generation comparisons focus on Qwen-7B and GPT-4o in medicine and law (Appendix N).

With correct dates, poisoning falls in all four downstream cells by 4.6–10.0 percentage points, but only three exact paired tests reach p<0.05: law/Qwen 0.640→0.540 (p=.0129), law/GPT-4o 0.700→0.610 (p=.0225), and medicine/GPT-4o 0.621→0.529 (p=.0215). Medicine/Qwen falls from 0.609 to 0.563 (p=.125). With dates absent, three cells improve by only 1.0–4.0 points, none significantly, while one worsens by 1.1 points. More concerning, with incorrect dates the reranker selects the current document zero times in every domain, below the dense baseline; a bad time signal can reverse the ranking (Appendix N).

The appendix first presents an idealized proof of principle: under correct metadata, a simple recency rule moves poisoning from 16/66 to 0/66 for GPT-4o and from 27/77 to 0/77 for Claude. The authors explicitly say these are not the more realistic defense estimates and do not substitute for later tests with missing or noisy dates (Appendix N). The operational question is therefore not merely whether to add recency. It is who maintains index year, effective date, withdrawal date, and supersession links; how their error rates are measured; and when an untrusted field should be ignored.

## Evidence map: what is supported and what remains an inference

| Observation in the paper | Supported conclusion | What it does not establish |
| --- | --- | --- |
| Stale documents reverse previously correct answers; matched current evidence is followed in 97%–100% of medical trials (Section 3.1, Appendix E) | In the tested setting, models are not generally unable to use retrieval; stale evidence selectively harms correct answers | The same rate across all RAG queries or that every current document is safe |
| 317 items across four domains; each model/domain has its own no-retrieval-correct denominator (Appendix E) | The failure appears across four tested domains and two open-model families | 17%–91% as real-world prevalence or a direct unconditional ranking of domains |
| Fifty fixed-evidence items vary only evaluation date; explicit boundaries outperform dates (Figure 3, Appendix F) | Document dates and stated validity rules are different inputs; explicit rules improve discrimination in the control task | That models can independently infer valid intervals from uncurated documents |
| Bidirectional activation patches have large effects while matched controls are near zero; selected heads also support general comparison (Appendices G–H) | In a limited, eligible forced-choice task, evaluation-date state causally influences answer choice | A dedicated temporal module or localization of deployed free-form behavior |
| The fixed reranker helps in four cells with accurate dates; missing and incorrect dates behave differently (Appendix N) | Trustworthy temporal fields can help retrieval-side filtering | That ranking by recency prevents stale evidence or that metadata can be assumed correct |

The authors connect these results to selective epistemic trust: ranking by relevance alone does not establish when content applies. My **engineering interpretation** is that RAG evaluation should test both whether valid new evidence corrects stale model knowledge and whether superseded evidence harms a model that was already correct. This is a test direction synthesized from the paper’s paired conditions, not a complete launch checklist validated by the benchmark.

## Limitations and adoption boundaries

1. **Limited benchmark external validity.** The 317 items are source-verified knowledge reversals, not a random sample of stale documents from arbitrary enterprise corpora. Item types do not estimate real-world rates; medical guidance, precedent, APIs, and platform rules also expire in different ways.
2. **The denominator is not fixed at 317.** Poisoning uses `Eₘ`, which changes with each model’s no-retrieval correctness. The actual denominators in the cross-domain grid—such as 39/51, 47/55, and 58/64—are essential. The percentages are not error rates over every item.
3. **Recent versus settled medical items differ.** Each model acts as its own comparator, but different questions mean item difficulty can remain a confound (Section 2, Appendix D).
4. **The judge is not perfect annotation.** Its 92.5% accuracy and 0.894 macro-F1 are estimates against 200 adjudicated human labels clustered over 152 items; κ=0.93 measures agreement with a second model judge. These validations answer different questions and neither makes automatic judgment equivalent to full human ground truth (Appendix C).
5. **The temporal control is small and explicit.** Fifty items were selected for clear applicability boundaries. Four Qwen/Llama models answer constrained two-choice questions. The result shows that stated boundaries can change behavior, not that arbitrary natural-language documents contain parseable intervals.
6. **Mechanistic samples are narrower still.** Causal analysis uses at most 20 eligible items per large model; head confirmation uses 10 items per model. This is local evidence from a controlled task, not a full circuit map or a deployed causal effect.
7. **The reranker depends on metadata.** Incorrect dates reduce current-document selection to zero across the evaluated domains. The paper does not demonstrate that automatically extracted validity fields will be accurate enough in production or that clinicians and legal experts externally reviewed those fields.
8. **Reproduction access remains unclear.** Appendix P describes environment files, scripts, data, per-run outputs, and pinned revisions, and says the main open-weight runs used two B200 GPUs. Yet the paper page and arXiv source archive provide no direct public repository/download URL or license for that experimental bundle. The available arXiv source tarball contains LaTeX and figures; it is not the described data-and-code release. The results below remain author-reported; this reading did not independently rerun the benchmark.

## Reproducibility and materials readers can access

As of 2026-09-29, the arXiv v1 HTML, PDF, and source archive are publicly accessible, and the paper page labels the work CC BY 4.0. All three reused figures come from the source archive: Figure 1 is a PNG, while Figures 2–3 are accompanying PDF figure files that this reading converted to raster form without redrawing their contents. Appendix P says the release contains benchmark items, official-source provenance, archived snapshots, poisoning corpora, code, per-run outputs, figure scripts, and model revisions. However, no direct download page for that experimental bundle or its license was located, so it cannot be described as a verified downloadable or licensed data/code release. Requirement manifests and hardware notes in the paper are not an artifact endpoint.

This reading did not rerun the authors’ experiments. If the bundle becomes available, a useful small reproduction would select a few pairs with official supersession boundaries, fix the query and historical document, compare date-only with explicit validity intervals, and run with and without retrieval. Preserve each item’s no-retrieval eligibility, retrieval rank, and answer label; report the eligible denominator before the poisoning rate. Medical, legal, or policy validity still needs source review independent of an LLM judge.

## Bloss0m engineering judgment: make applicability a data-governance responsibility

In the Discussion, the authors recommend recording explicit effective dates, supersession relations, or validity intervals and evaluating both the corrective value of valid evidence and the harm from stale evidence (Section 5). The following **Bloss0m engineering synthesis** turns that direction into system questions; it is not a complete architecture evaluated by the paper:

- **Preserve time-field semantics.** Distinguish publication, revision, effective, expiration, and withdrawal dates. If the source cannot support a field, keep it unknown or scoped; do not fill it with the document year.
- **Record supersession relations.** Keep old and new records traceable so the archive can answer both “what was the rule then?” and “which record is current now?” The existence of a newer version does not by itself prove a reviewed supersession relation.
- **Carry temporal conditions into answers.** A retrieval result for changing guidance should expose source time, applicable scope, and validity boundary. An answer can identify the version it used and when additional verification is needed.
- **Add a metadata-quality gate to reranking.** When dates are absent, contradictory, or untrusted, do not treat a recency score as reliable. The fixed scoring rule only demonstrates modest benefit with accurate dates; wrong dates reverse the selection outcome.
- **Test both directions.** Measure whether current evidence repairs stale model knowledge and whether stale evidence corrupts an answer that was already correct. Report no-retrieval eligibility, wrong answers, and unclear responses alongside any aggregate rate.

**When not to adopt directly:** If the corpus lacks trustworthy validity periods and supersession provenance, start with source inventory and update ownership; do not deploy “newer means safer” as a substitute. If correctness depends on case date, jurisdiction, product version, or policy scope, a generic publication date cannot stand in for those conditions. In high-stakes settings, this paper motivates temporal-validity tests; it is not medical or legal advice and does not establish that its reranker lowers operational risk.

For a related view of evidence selection, see [Learning When to Trust](/en/paper-reading/63-selective-context-preference-trust/), then compare with [When Stale Constraints Go Unchecked](/en/paper-reading/73-when-stale-constraints-go-unchecked/): that paper studies whether an agent’s limited memory-verification budget reaches an update path, whereas this paper manipulates the applicability of retrieved historical evidence. Both involve old information, but they concern memory-verification allocation and retrieval applicability, respectively. [RAG-Sieve](/en/paper-reading/55-ragsieve-rag-poison-detection/) offers a further contrast on detecting poisoned retrieval content; malicious injection uses a different threat model from authentic but outdated documents.

## Three things to remember

1. **Failure definition:** A paper item counts as poisoning only when a model first answers correctly without retrieval and then stops giving the timely answer after seeing old evidence; denominators therefore vary.
2. **Key distinction:** A document date says when it was published; a validity boundary says when its recommendation applies. The 50-item paired control shows that stating the latter matters far more than merely supplying the former.
3. **Deployment boundary:** Recency-aware reranking has modest gains with accurate dates, little effect when dates are missing, and reversed selection under wrong dates. Temporal-metadata quality is itself a systems responsibility.

### Primary sources

- Ahmed, Poech, and Röttger, [Stale-Document Poisoning: When Outdated Retrieval Overrides Correct Model Answers, arXiv v1](https://arxiv.org/abs/2609.31342v1), submitted 2026-09-25. Main text Sections 1–6; benchmark construction and source capture in Appendix A; model revisions in B; judge protocol and validation in C; model and cross-domain results in D–E; temporal applicability and interventions in F–H; prompt and status analyses in J–K; retrieval gate and stress test in N; frontier-model cells in O; reproducibility description in P.
- [Full HTML](https://arxiv.org/html/2609.31342v1) · [PDF](https://arxiv.org/pdf/2609.31342v1) · [arXiv source archive](https://arxiv.org/src/2609.31342v1)
