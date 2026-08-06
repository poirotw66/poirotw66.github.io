---
title: "AskChem: Making Provenance-Carrying Claims the Retrieval Unit"
description: "A critical reading of AskChem's atomic claims, source locators, faceted taxonomy, evidence graph, and AskChem-Bench results, with a clear boundary between citation traceability and scientific correctness."
pubDate: 2026-08-07
updatedDate: 2026-08-07
tldr:
  - "AskChem binds a claim to a source DOI and a verbatim quote or evidence locator, then organizes the reusable object through faceted taxonomy and an evidence graph."
  - "On 30 AskChem-Bench questions, AskChem-grounded GPT-5.5 reaches 100% DOI existence versus 88.3% for LLM-only; Edison Scientific produces more grounded quantitative detail and a slightly higher on-topic rate."
  - "The paper demonstrates traceable retrieval and interface design, not that claim extraction is always correct or that provenance is equivalent to scientific truth."
  - "As of 2026-08-07, the source, API, benchmark JSON, and dataset page are accessible; the full index is large, and production cost, latency, and update baselines remain unmeasured."
audience:
  - "AI engineers building production RAG, scientific search, or agent-facing knowledge services."
  - "Researchers and technical leads who need to separate citation, provenance, cross-document relations, and retrieval evaluation."
tags: ["Paper Reading", "RAG", "Claim-Centered Retrieval", "Chemistry", "Evidence Graph", "Benchmark"]
image: "/paperReading/11-askchem-claim-centered-synthesis/title_image.png"
field: "NLP"
difficulty: "advanced"
showToc: true
paper:
  title: "AskChem: Claim-Centered Infrastructure for Chemistry Literature Synthesis"
  authors:
    - "Bing Yan"
    - "Gregory Wolfe"
    - "Stefano Martiniani"
    - "Kyunghyun Cho"
  year: 2026
  venue: "arXiv cs.CL preprint, v1 (2026-07-30)"
  links:
    pdf: "https://arxiv.org/pdf/2607.28618v1"
    arxiv: "https://arxiv.org/abs/2607.28618"
    code: "https://github.com/bingyan4science/askchem"
    project: "https://askchem.org"
series:
  id: "retrieval-systems"
  title: "Retrieval Systems"
  part: 1
  totalParts: 1
---

When a research question is distributed across dozens of papers, a search result that returns only paper titles or chunks still leaves localization, checking, and cross-paper synthesis to a person or an agent. AskChem asks a sharper question: **can a provenance-carrying scientific claim become the searchable, browsable, linkable, reusable infrastructure object?**

> **Huahua's engineering note**
>
> Provenance fixes where a statement came from; it does not automatically establish whether the statement is correct. In a scientific workflow, traceability and semantic correctness need separate checks.

## The short answer: what changes when retrieval is claim-centered?

**Reader question: What changes when a retrieval system indexes provenance-carrying claims instead of documents or chunks?**

My short answer is that the retrieval output changes from “possibly relevant context” to “an evidence candidate that can be inspected directly.” AskChem defines a claim as an atomic, typed assertion. Each claim is linked to a source DOI, a verbatim quote, or an `evidence_locator` when the relevant full-text evidence cannot be represented as one contiguous sentence. The same claim identity is then placed into a stabilized faceted taxonomy, a cross-paper evidence graph, and a more exploratory Living Taxonomy.

The engineering value is not the word *claim* by itself. It is the decision to persist provenance, structured fields, view paths, and typed relations together. Search, browsing, the API, the SDK, and MCP can return the same claim object. But the paper's evaluation directly supports a narrower statement: the system makes evidence easier to trace and assemble. It does not establish that extraction is semantically correct, or cleanly separate the causal contributions of taxonomy, vector retrieval, paper recall, and the generator.

## Paper identity, status, and problem definition

AskChem is an **arXiv cs.CL v1 preprint**, submitted on 2026-07-30 by Bing Yan, Gregory Wolfe, Stefano Martiniani, and Kyunghyun Cho. As of this reading, I treat it as a preprint rather than an accepted conference paper. The complete source is available as the [arXiv HTML version](https://arxiv.org/html/2607.28618v1) and [PDF](https://arxiv.org/pdf/2607.28618v1).

The paper is not proposing another paper-ranking interface. It addresses the middle layer of cross-paper synthesis: researchers often need to ask which materials achieved which result under which conditions, how a topic changed over time, and which findings support or contradict each other. Document retrieval leaves those operations to the reader. AskChem moves them into the index and data model.

In [§1 Introduction](https://arxiv.org/html/2607.28618v1#S1) and [§2 Claim-Centered Representation](https://arxiv.org/html/2607.28618v1#S2), the paper defines a claim as an “atomic, typed scientific assertion” extracted from a paper and records its source DOI, quote, structured fields, and extraction confidence. Three voices should remain separate:

- **Paper evidence:** the current live index is described in the paper as 2.4M claims, 147K papers, 307K taxonomy nodes, and 171,342 typed evidence edges.
- **Author/system claim:** these claims support human and agent search, browsing, REST, SDK, and MCP workflows, and improve citation groundedness for cross-paper synthesis.
- **Bloss0m judgment:** this is an evidence-oriented retrieval substrate. Downstream verifiers or humans still need to check semantics, units, conditions, experimental design, and applicability to the current question.

## Method skeleton: from full text to a reusable claim object

The method can be reduced to a pipeline that is concrete enough to implement:

1. **Extraction:** a high-throughput pipeline reads titles and abstracts, while a deeper pipeline reads full-text PDFs. Appendix B says the abstract extractor uses GPT-5-mini and the deep extractor uses Gemini 3.1 Pro with native-PDF input and Vertex AI batch; an older legacy slice uses GPT-4o / GPT-4o-mini.
2. **Schema validation:** each extraction returns a JSON object validated against the claim schema, required provenance fields, numeric ranges, and chemistry-specific fields; invalid JSON or schema-invalid output is retried. These gates enforce structure, not scientific correctness.
3. **Shared identity, multiple structures:** Source stores DOI, venue, year, citation count, and OpenAlex-aligned authors; TreeNode stores taxonomy paths; Edge stores typed claim-to-claim relations.
4. **Organization and retrieval:** the stabilized faceted taxonomy classifies claims by reaction, substance, application, technique, mechanism, claim type, data, time, and author views; hybrid `/search` fuses FTS5 claim-text, paper-level recall, taxonomy-node recall, and dense-vector recall with reciprocal rank fusion.
5. **Cross-paper links and interfaces:** a second relation-extraction pass emits `supports`, `contradicts`, `extends`, `derives_from`, and `cites_as_evidence` edges; the same claim objects are exposed to people and agents through the web UI, REST, Python SDK, and MCP.

## Figure 2: the durable object is claim identity, not prompt context

![AskChem Figure 2: claim-centered retrieval and the three complementary structures](https://arxiv.org/html/2607.28618v1/x1.png)

*Figure 2 shows the claim as retrieval unit connected to a faceted taxonomy, evidence graph, and Living Taxonomy. Source: [AskChem Figure 2](https://arxiv.org/html/2607.28618v1#S1.F2), Bing Yan et al.; used under the paper's [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license, checked 2026-08-07.*

The useful part of this figure is not the three UI names. It is that **one claim identity is reused by different structures**. Once search finds a claim such as “a catalyst achieves a given Faradaic efficiency under given conditions,” the user can follow a taxonomy path to similar findings, follow the evidence graph to supporting or contradictory findings, and retain the DOI and source evidence. That is easier to audit after generation than asking a generator to infer citations from a long chunk each time.

Appendix B gives a concrete claim record: `claim_id` `7c92fcacd8cb64d4`, source DOI `10.1002/anie.201914977`, structured fields for Ni SA-N2-C and CO₂ reduction, a 98% CO Faradaic efficiency, and a 1622 h⁻¹ turnover frequency, plus a verbatim quote. This demonstrates the data model; it is not an AskChem chemistry experiment. The values still need to be checked against the source paper.

## Faceted taxonomy, evidence graph, and Living Taxonomy have different jobs

### Faceted taxonomy: making multiple cuts through one question operational

AskChem does not compress all claims into one fixed chemistry ontology. Section 4 explains that category paths are induced while papers and claims are digested, then stabilized through canonical top-level routing, synonym normalization, and fuzzy clustering into persistent L1/L2/L3 paths. For example, `coupling/cross_coupling/suzuki` is both a browsing location and a taxonomy-recall signal.

![AskChem Figure 4: the same topic expanded across multiple operational views](https://arxiv.org/html/2607.28618v1/x3.png)

*Figure 4 shows CO₂-reduction claims through reaction, substance, application, technique, mechanism, data, claim type, time, author, and network views. Source: [AskChem Figure 4](https://arxiv.org/html/2607.28618v1#S1.F4), Bing Yan et al.; used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), checked 2026-08-07.*

The engineering implication is that taxonomy is not merely a front-end filter. It can change candidate recall and result grouping. But the paper does not provide a clean taxonomy-recall ablation or expert validation of taxonomy placement. “Stable paths” should therefore be read as an operational property, not as evidence that the induced categories form a correct scientific ontology.

### Evidence graph: making cross-paper relations queryable

Section 3 reports 171,342 typed edges. The authors audit a stratified sample of 148 edges with a domain expert; after excluding two undecidable cases, 143 of 146 relation types are correct, producing 97.9% edge-type precision. This is a small-sample precision estimate for relation labels. It is not graph recall, and it is not factual accuracy of claim content.

![AskChem Figure 3: corpus-scale provenance and automatic quality checks](https://arxiv.org/html/2607.28618v1/x2.png)

*Figure 3 summarizes corpus coverage and automatic quality checks for the deployed index. Its caption also warns that these statistics do not replace expert judgments of claim semantics or taxonomy placement. Source: [AskChem Figure 3](https://arxiv.org/html/2607.28618v1#S1.F3), Bing Yan et al.; used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), checked 2026-08-07.*

The most important caveat is already in the paper: 100% source-grounded means that a claim has a claim type, source DOI, and verbatim quote. It does not mean the LLM interpreted the source sentence correctly. For production RAG, this changes “no citation” into “a citation that can be checked,” rather than removing the verification boundary.

### Living Taxonomy: exploring what principle governs a contribution

The Living Taxonomy asks a different question from the faceted taxonomy. It places paper-grounded leaves below principles, theories, models, mechanisms, and phenomena, while the faceted taxonomy serves routine search and browsing. Section 5 and Appendix B Table 3 report 4,931 nodes, about 1.1M claims, and 360,546 paper placements, including 663 open proposed branches.

![AskChem Figure 5: the principle-centered Living Taxonomy](https://arxiv.org/html/2607.28618v1/figures/screenshot_taxonomy.png)

*Figure 5 is a screenshot of the principle-centered Living Taxonomy. Source: [AskChem Figure 5](https://arxiv.org/html/2607.28618v1#S3.F5), Bing Yan et al.; used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), checked 2026-08-07.*

The authors explicitly position it as an exploratory overview, not a fully validated scientific ontology. Appendix B also notes that nearest-neighbor placement can force-fit low-margin cases into an unsuitable host. It is useful for proposing reading paths or surfacing taxonomy gaps; it should not be an unsupervised scientific classification decision.

## Experimental setup: what does AskChem-Bench actually measure?

### Tasks and data

AskChem-Bench v1.1 contains **30 questions**, split evenly across three cross-paper tasks:

| Task | Question type | What it probes |
|---|---|---|
| CA: Cross-Paper Condition Aggregation | Aggregate catalysts, conditions, and performance metrics from multiple papers | Whether distributed quantitative claims can be assembled |
| TC: Temporal Claim Tracking | Track how a scientific topic changes over time | Whether years and evolution context survive synthesis |
| CS: Contradiction Surfacing | Identify contradictory or competing claims | Whether claim-level structure can expose conflict |

The benchmark is narrow but well aligned to the proposed infrastructure. It measures cross-paper search and citation groundedness, not full chemistry reasoning, experimental design quality, user utility, or the quality of a real research decision.

### Baselines, budgets, and metrics

All five settings use a GPT-5.5 reader:

1. **LLM only:** the reader without AskChem retrieval.
2. **+AskChem:** the same reader grounded with AskChem claim retrieval.
3. **+Paperclip:** Paperclip's paper-level retrieval.
4. **Edison Scientific:** a closed PaperQA-family agent.
5. **NotebookLM Deep Research:** Google NotebookLM's Deep Research setting.

Appendix A says AskChem rewrites each question into 3–4 keyword subqueries, fans them out to hybrid search, and diversifies the merged evidence to at most 40 claims. Paperclip uses the same rewriter and synthesizer over paper retrieval; Edison and NotebookLM run their own systems. This is not a perfectly homogeneous model, tool-budget, or retrieval comparison, especially because Edison is closed. Read the table as a profile comparison, not proof of production superiority.

The paper defines the metrics as follows:

- **DOI existence:** the fraction of cited DOIs that resolve in CrossRef.
- **Citation density:** distinct verified DOIs per answer.
- **Grounded specificity:** quantitative tokens sharing a sentence with a citation marker.
- **Recent high-impact:** the proportion of cited papers from the last five years with at least 50 citations.
- **Paper relevance:** a Gemini 3.1 Pro judge score from 0–3: 3 direct, 2 on-topic, 1 loose, 0 irrelevant.

The Gemini judge was calibrated on 100 domain-expert labels; the paper reports 93% agreement and κ = 0.914. That describes agreement with calibration labels. It does not mean that experts independently scored every one of the 30 questions.

## Results: citation resolvability improves, but not every quality axis wins

The table below reproduces the paper's Table 1; the metric direction and denominator are unchanged, and the values are the overall result across 30 questions.

| Metric | LLM only | +AskChem | +Paperclip | Edison Scientific | NotebookLM |
|---|---:|---:|---:|---:|---:|
| DOI existence (%) | 88.3 | **100** | **100** | 99.1 | 93.7 |
| Citation density (/answer) | 9.6 | **18.1** | 7.5 | 10.7 | 7.9 |
| Grounded specificity | **8.1** | 5.9 | 0.5 | **29.2** | 0.1 |
| Recent high-impact (%) | 0.6 | **18.5** | 6.1 | 11.3 | 12.1 |
| Paper relevance (0–3) | 1.66 | **2.15** | 1.72 | 2.07 | 1.84 |
| On-topic ≥ 2 (%) | 65.8 | 86.6 | 57.8 | **89.7** | 78.9 |

### Four locatable evidence anchors

1. **DOI resolvability:** [§7 RQ3 and Table 1](https://arxiv.org/html/2607.28618v1#S7) show +AskChem rising from 88.3% for LLM-only to 100%, while citation density rises from 9.6 to 18.1. This directly supports the narrower claim that claim-centered grounding reduces unresolved citations on this benchmark.
2. **Grounded quantitative detail:** in the same Table 1, +AskChem has grounded specificity 5.9 while Edison has 29.2. The authors acknowledge that Edison produces substantially more citation-linked quantitative detail; AskChem does not win every groundedness measure.
3. **Topic relevance:** +AskChem has mean relevance 2.15 and on-topic ≥ 2 of 86.6%; Edison has 2.07 and 89.7%. AskChem's mean score is higher, but Edison has the slightly higher on-topic rate. “Best mean relevance” should not become “most relevant on every question.”
4. **Representative failure case:** in the ca04 example at [Figure 6 / §7](https://arxiv.org/html/2607.28618v1#S7.T1), the paper says GPT-5.5 alone produces 14 DOIs, six of which do not resolve in CrossRef; the AskChem-grounded answer has all 22 cited DOIs resolving. This supports better citation auditability, but it is one representative case, not a factual-accuracy result for the whole benchmark.

The authors claim that AskChem-grounded GPT-5.5 obtains 100% resolvable DOIs, the highest citation density, the best mean relevance, and the highest recent-high-impact coverage. Table 1 supports those row-level numbers. **My narrower conclusion is that AskChem demonstrates the value of citation plumbing and a reusable retrieval object; it does not show that every chemical statement in the answer is correct or ready for an experimental decision.**

## Evidence map: evidence, author claims, and inference

| Layer | What this article can safely say | What it should not become |
|---|---|---|
| Paper evidence | Claims carry DOI and quote / locator; hybrid search combines FTS5, paper, taxonomy, and dense-vector recall; +AskChem reaches 100% DOI existence on 30 questions. | Every claim is semantically correct; retrieval gain has been isolated. |
| Author / vendor claim | The live index, Web / REST / SDK / MCP, and public dataset support agent-native access; the system is suitable for interactive browsing. | Predictable production latency, low cost, or cross-domain generalization has already been established. |
| Bloss0m inference | A claim is an interface that carries provenance and supports downstream audit better than a transient chunk; claim identity can be a durable RAG-platform record. | AskChem's chemistry index is a domain-agnostic memory, or provenance is truth. |

## Ablations and attribution: what the result can and cannot explain

This paper **does not include a clean retrieval ablation** that fixes the reader and evidence budget while removing taxonomy recall, the evidence graph, dense-vector retrieval, or the RRF channel one at a time. Table 1 compares complete settings. It answers how the claim-centered infrastructure profiles end to end; it does not answer which component caused how much of the gain.

The 97.9% edge-type precision is a small structural audit of the evidence graph, not an answer ablation with the graph removed. JSON constraints, numeric checks, and retries are extraction-pipeline validation gates, not a gold evaluation of semantic claim accuracy. The Living Taxonomy's proposed branches and placement caveat make the remaining uncertainty explicit: exploratory classification needs people or additional evaluation.

The most defensible attribution ladder is therefore:

1. **Established:** source-carrying claim retrieval makes resolvable citations easier to produce and increases citation density on this benchmark.
2. **Plausible but not isolated:** claim-level structure, query fan-out, evidence diversification, and prompt grounding jointly contribute; their individual contributions are unknown.
3. **Not established:** provenance-carrying claims produce higher factual accuracy, fewer experimental mistakes, or lower total cost in real research workflows.

## Limitations, threats to validity, and unsupported interpretations

The paper's limitations are important because they define the boundary of “claim-centered” infrastructure:

- **Corpus coverage:** the corpus covers only a fraction of chemistry, and abstract extraction is shallower than full-text extraction. Even an index of 147K papers is not the whole chemistry literature.
- **Extraction and relation errors:** LLM-generated claims, relations, and taxonomy placements can be wrong. A quote enables checking, but it does not stop a model from misreading conditions, values, negation, or causality.
- **Evaluation target and size:** 30 questions directly measure groundedness, relevance, citation density, and related proxies. They do not sufficiently measure factual accuracy, researcher utility, human time saved, or experimental outcomes.
- **Unisolated retrieval gain:** taxonomy-based recall, paper-level recall, dense retrieval, RRF, rewriting, and generation are not separated through component-wise ablations.
- **Asymmetric comparison:** Edison is a closed agentic system; tool access, prompts, retrieval, update frequency, and reader policy may differ. The results should not be written as “AskChem beats every research assistant.”
- **Insufficient classification validation:** the Living Taxonomy is exploratory, and the faceted taxonomy has no reported expert placement validation. This matters especially for contradiction surfacing and temporal tracking, where a wrong category can change which evidence candidates are visible.
- **Production unknowns:** the paper and public endpoints do not report full-corpus update latency, indexing cost, per-query latency, throughput, embedding / LLM spend, or long-term maintenance burden. The public README also says that self-hosting does not reproduce askchem.org's private operational configuration.

Three unsupported interpretations should be removed: **“100% DOI existence equals 100% factual correctness” is false; “open source plus a dataset equals production reproducibility” is false; and “claim unit equals domain-agnostic memory” is not established by this chemistry paper.**

## Engineering implications: how to bring the idea into production RAG

The most portable part of AskChem is the data boundary, not the complete chemistry pipeline. For a general RAG or agent platform, I would start with a constrained version:

1. Make `Claim` a first-class object: keep `claim_id`, source document, quote / locator, claim type, extraction model and version, confidence, time, conditions, and numeric fields explicit.
2. Model `Source`, `TaxonomyPath`, and `EvidenceEdge` as traceable relations instead of keeping generated citations only in a message log.
3. Treat `supports`, `contradicts`, `extends`, and `derives_from` as typed edges that require provenance. Evaluate edge labels and semantic correctness separately.
4. Return an evidence bundle from retrieval: claim, quote, locator, source metadata, view paths, and neighboring relations, so the generator does not have to infer citations from a long chunk.
5. Use different evaluators for different query types: citation resolution, condition aggregation, temporal consistency, contradiction recall, factual verification, cost, and latency should not be collapsed into one score.
6. Make extraction, taxonomy placement, and edge admission rerunnable, versioned, and auditable. When confidence is low or taxonomy placement abstains, return “needs review” instead of forcing a category.

This is also where AskChem differs from the existing reading path: [RAG vs GraphRAG](/en/paper-reading/07-GraphRAG-vs-RAG/) compares chunk, graph, and hybrid retrieval trade-offs at task level; AskChem moves the question one layer earlier and asks what data unit the graph or vector retriever should search. If an agent also needs to route retrieved schemas into tools, compare it with [RAG-MCP](/en/paper-reading/04-RAG-MCP/) and its prompt-bloat problem.

## Reproducibility and artifact status (as of 2026-08-07)

I separated the paper's release statement from direct endpoint checks:

| Artifact | Direct check | Reproducibility reading |
|---|---|---|
| Live system | [askchem.org](https://askchem.org) is reachable; the home page and API docs expose Web, REST, and agent workflows. | **Usable for inspection and queries;** no production SLA is inferred. |
| MIT source | The [GitHub repository](https://github.com/bingyan4science/askchem) is public and exposes `src/`, `sdk/`, `mcp_server.py`, tests, Docker, and docs; the repository identifies an MIT license. | **Usable source;** the README says self-hosting does not reproduce askchem.org's private operational configuration, and there is no pinned paper release. |
| Index snapshot | The [Hugging Face dataset page](https://huggingface.co/datasets/bing-yan/askchem) is reachable and lists `claims.jsonl`, `sources.jsonl`, hierarchy, metadata, and an approximately 25.44 GB `askchem.db`; the page reports about 40.9 GB total files. | **Partially usable;** the download is large, the data viewer reports a schema-casting error, and I did not download or claim a completed local rebuild of the full snapshot. |
| AskChem-Bench | The [public benchmark endpoint](https://askchem.org/api/benchmark) returns JSON directly with version 1.1, 30 questions, CA / TC / CS, methodology, results, and reproducibility fields. | **Usable JSON artifact;** current prompt and environment versions still need to be pinned against the repository and endpoint. |
| REST / OpenAPI | [API docs](https://askchem.org/api/docs) returns 200; search, claim, neighborhood, source, and stats endpoints return JSON in direct checks. | **Usable for bounded reproduction;** fix the anonymous rate limit, data version, and `/api/` versus `/v1/` choice. |
| SDK / MCP | The repository's `sdk/` directory, the PyPI [askchem package page](https://pypi.org/project/askchem/), and the [MCP client](https://askchem.org/static/askchem_mcp.py) are reachable. | **Announced and inspectable;** this reading did not install the package, run the MCP server, or verify long-term compatibility. |
| Demo | The [YouTube screencast](https://youtu.be/SOjueOlPS-8) URL is reachable. | **Reachable landing page;** the video was not treated as method evidence. |

The live `/api/stats` endpoint returned 2,442,810 claims, 146,627 sources, 7 views, and 10,327 nodes on the publication date. Those exact counts do not match the paper's narrative 2.4M / 147K / 307K-node statistics. The difference may reflect an index snapshot, counting convention, or version change; without a release manifest, I do not merge the numbers.

The smallest bounded reproduction is to use the public benchmark JSON for its 30 questions and protocol, fix an AskChem index snapshot, sample the search / claim / source endpoints, check quotes and DOIs, and rerun LLM-only and AskChem-grounded settings with the same reader. A full reproduction claim would still require pinned prompts, model version, retrieval budget, API snapshot, CrossRef query time, token / cost accounting, and scoring code.

## Conclusion and next reading

AskChem's strongest contribution is to make “retrieved evidence” a reusable infrastructure object: a claim carries a DOI and quote, taxonomy supplies multiple browsing lenses, the evidence graph stores cross-paper relations, and the API and MCP make the same object available to people and agents. AskChem-Bench supports improved DOI resolvability and citation density, but Edison’s grounded specificity and on-topic rate remind us that more resolvable citations do not make one system best on every quality axis.

Placed in Bloss0m's retrieval-systems path, AskChem is a production-oriented case of moving from document / chunk retrieval toward **provenance-carrying claim retrieval**. The next useful implementation experiment is not to copy its chemistry taxonomy. It is to build a small domain index, run component ablations, verify factual claims, measure update latency and total cost, and preserve “uncertain” as a queryable result.

## Primary sources

- [AskChem arXiv record](https://arxiv.org/abs/2607.28618): title, authors, version, and abstract.
- [AskChem full paper in arXiv HTML](https://arxiv.org/html/2607.28618v1): Sections 2–7, Figures 2–6, Appendices A–B, limitations, and availability.
- [AskChem PDF](https://arxiv.org/pdf/2607.28618v1): the complete 10-page preprint with tables and appendices.
- [AskChem source repository](https://github.com/bingyan4science/askchem): MIT-licensed source, SDK, MCP server, benchmark, and deployment material.
- [AskChem index snapshot](https://huggingface.co/datasets/bing-yan/askchem): CC-BY dataset page and file listing.
- [AskChem-Bench JSON](https://askchem.org/api/benchmark) and [OpenAPI docs](https://askchem.org/api/docs): public questions, methodology, results, API schemas, and bounded-reproduction entry points.
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): the license basis for the reused arXiv Figures 2–5.
