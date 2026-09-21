---
title: "RAFT: Making Troubleshooting RAG Retrieve the State That Led to a Fix"
description: "A deep reading of RAFT: A Stateful Retrieval-Augmented Framework for Troubleshooting Agents (arXiv:2609.20754): closed support cases become state-transition trajectories, intermediate entries are retrieved, and the parent case is returned with its matched anchor."
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "RAFT changes the retrieval unit from isolated chunks to ordered timeline entries inside a case; the matched entry identifies the current state, while the parent trajectory preserves how the case was resolved."
  - "On the synthetic Windows Server benchmark, RAFT's Case Hit is 0.842, 0.871, and 0.888 at 0%, 30%, and 60% progress, versus 0.673, 0.719, and 0.769 for vanilla RAG under the same setup."
  - "An Apache Jira transfer set with 30 human-audited duplicate groups and 570 distractors provides directional evidence, but no confidence intervals and no gold root-cause or resolution-coverage labels."
  - "This is not evidence that a troubleshooting agent now fixes tickets better end to end; it is a separately evaluated retrieval layer whose deployment still depends on extraction quality, privacy, freshness, and maintenance."
audience:
  - "Platform and search engineers building production RAG, support agents, or incident-response memory"
  - "Researchers deciding when to preserve case trajectories and how to evaluate state-aware retrieval"
tags: ["Paper Reading", "RAG", "Agent Systems", "Agent Evaluation", "Enterprise AI"]
image: "/paperReading/raft-stateful-rag-troubleshooting/title_image.webp"
field: "AI Engineering"
difficulty: "advanced"
showToc: true
topics:
  - retrieval-rag
  - agent-memory-adaptation
  - agent-evaluation-observability
paper:
  title: "RAFT: A Stateful Retrieval-Augmented Framework for Troubleshooting Agents"
  authors:
    - "Mingxuan Zhang"
    - "Xiaowen Wang"
    - "Anupma Sharan"
    - "Zhengyi Chen"
    - "Chenyu Diana Zhang"
    - "Shanshan Yang"
    - "Chittababu Pacharu"
  year: 2026
  venue: "arXiv 2609.20754 v1 (2026-09-17); accepted to EMNLP 2026 Industry Track"
  links:
    pdf: "https://arxiv.org/pdf/2609.20754v1"
    arxiv: "https://arxiv.org/abs/2609.20754"
    code: "https://github.com/microsoft/RAFT"
series:
  id: "stateful-troubleshooting-rag"
  title: "Stateful Troubleshooting RAG"
  part: 1
  totalParts: 1
---

This article reads [RAFT: A Stateful Retrieval-Augmented Framework for Troubleshooting Agents](https://arxiv.org/abs/2609.20754), arXiv v1 submitted on 2026-09-17. The paper notes acceptance to the EMNLP 2026 Industry Track. I checked the [full arXiv HTML/PDF](https://arxiv.org/html/2609.20754v1), including Sections 1–6, Tables 1–9, Figures 1–2, and Appendices A–D, plus Microsoft’s [RAFT artifact repository](https://github.com/microsoft/RAFT). The arXiv page marks the paper [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); every reused body visual below keeps its source and location in the caption.

The paper is not asking whether an embedding model can find a sentence that resembles a support ticket. It asks the more operational question: **when a ticket moves from symptom, to hypothesis, to investigation, to root cause and remediation, can retrieval find a historical case that reached a similar intermediate state and contains actionable evidence?** RAFT’s answer is to extract each closed case into a directed timeline of meaningful state transitions, retrieve over those entries with a hybrid score, and promote a matched entry back to its parent case. The agent receives both why the case matched and how that case eventually got to a resolution.

## The paper in 90 seconds

- **Problem:** traditional RAG chunks long, noisy support histories, so it may retrieve a symptom, a log, or administrative text without preserving diagnostic order and remediation context.
- **Core insight:** the retrieval unit for troubleshooting should be a timeline entry representing a meaningful state transition inside a case. The active case should also issue updated queries as its investigation changes.
- **Strongest evidence:** on 826 synthetic cases generated from Microsoft Learn Windows Server documentation, RAFT beats vanilla RAG, HippoRAG2, and Fast-GraphRAG on all three metrics at all three progress points. Case Hit is 0.842/0.871/0.888 at 0%/30%/60% progress, with issue-group clustered bootstrap support for the Case Hit gains over vanilla RAG ([Section 5.4, Table 2](https://arxiv.org/html/2609.20754v1#S5.T2); [Appendix C.3, Table 5](https://arxiv.org/html/2609.20754v1#A3.T5)).
- **Main boundary:** the Apache Jira set contains 30 audited duplicate groups and 570 distractors, so it is directional transfer evidence. The paper evaluates a retrieval layer, not final diagnosis, resolution success, engineer productivity, or a production incident workflow.

My bounded verdict is: **RAFT’s most valuable change is to reinterpret “find a similar case” as “find the historical investigation state that matches the current state, then preserve the parent trajectory.” That makes retrieval more like stateful memory, but it does not make diagnosis correct by itself. Extraction errors, stale remediations, privacy constraints, and incomplete histories can still travel through the entire trajectory.**

> **Huahua’s engineering reminder**
>
> Turning a ticket into a timeline is not merely a chunking upgrade. A production index should preserve source evidence, state versions, and reviewer decisions, and expose the matched anchor to the agent. Otherwise an opaque LLM summary is only being packaged as a more structured-looking memory.

## Why prior approaches are not enough: symptom similarity is not state similarity

Enterprise support cases are rarely one-shot questions. An initial ticket may contain only an error code and “login fails.” An engineer then inspects logs, proposes hypotheses, rules some out, confirms a root cause, and verifies a mitigation. Two cases can share the same opening symptom but diverge after the second check. Conversely, cases with different symptoms can expose the same root cause or remediation strategy midway through the investigation.

Vanilla RAG embeds chunks from raw emails, notes, logs, and other artifacts. The paper identifies four problems ([Section 3](https://arxiv.org/html/2609.20754v1#S3)):

1. **Scattered signal and noise:** relevant technical evidence spans multiple turns, while non-technical text can compete for lexical or semantic rank.
2. **Incoherent retrieval:** even a chunk from the correct case does not reveal what came before or after it. Reassembling many chunks into a coherent history consumes the context budget.
3. **Closed does not mean actionable:** a ticket may close because the customer stopped responding or because of an administrative process, without recording reusable diagnosis or remediation evidence.
4. **Privacy starts at the index boundary:** enterprise records may contain personally identifiable information, so abstraction, redaction, and deployment-specific filtering must happen before the agent sees the retrieval result.

This is also why RAFT does not freeze all higher-order reasoning into an offline knowledge graph. The authors scope retrieval to finding similar cases and evidence needed for diagnosis and action; the online agent can still reason about case relationships and issue families against the current case ([Problem Statement](https://arxiv.org/html/2609.20754v1#S3)).

## Core intuition: find the matched state, then put it back into the full trajectory

![Original RAFT Figure 1: offline case indexing, entry-level state-aware retrieval, and optional case-graph expansion](/paperReading/raft-stateful-rag-troubleshooting/paper/figure-1-raft-overview.webp)

*Figure 1 (original paper Figure 1, Section 4): historical cases pass through extraction and actionability filtering; meaningful state transitions form directed timelines; the active case is re-queried as its state changes; and retrieval returns parent cases with matched anchor entries. Original source: [arXiv Figure 1 anchor](https://arxiv.org/html/2609.20754v1#S4.F1) / [arXiv PDF](https://arxiv.org/pdf/2609.20754v1). The paper page marks CC BY 4.0; this local mirror preserves attribution and must be reused under that license.*

Put vanilla RAG and RAFT on the same retrieval question:

| Retrieval design | What it actually searches | What the agent receives | Main risk |
| --- | --- | --- | --- |
| Vanilla RAG | High-ranked chunks from raw cases | Potentially disconnected fragments that the agent must reassemble | It may match a symptom while losing the investigation, or treat administrative text as evidence |
| RAFT entry retrieval | All timeline entries whose state matches the current query | Distinct parent cases, the structured case representation, and the entry that triggered each match | An extraction mistake can amplify a wrong state and its whole trajectory |
| RAFT plus graph expansion | Related cases under a configured root-cause/resolution view | Additional case-level evidence beyond the direct seeds | The graph view, sparsity, thresholds, and maintenance affect noise |

The central control point is therefore not “use a graph”; the graph is explicitly optional in Figure 1. The main change is: **represent semantic state transitions, rank entries, and promote the matched entry back to its parent case.** Local similarity and full-case context are kept together.

## Walk one example through the method: from symptom to resolution

The following example follows the style of the synthetic case in Appendix A but is shortened for explanation. **It is not an additional experimental trace or a separate RAFT result.** The source case concerns auditing `logonHours` changes on Windows Server; here only its state transitions matter.

1. **Input: the initial state.** The active case says that a team wants to restrict service-account login hours and record who changes `logonHours`. The query is still broad, so early entries from historical cases are the relevant candidates.
2. **Intermediate representation: case extraction.** RAFT processes ordered artifacts and outputs entities, a timeline, root cause, and resolution steps. A timeline entry is not one message per entry; it starts when the problem framing or current understanding changes materially ([Section 4.1](https://arxiv.org/html/2609.20754v1#S4.SS1)).
3. **Decision: state-aware matching.** After new evidence, the query becomes “use a narrow SACL for writes to the `logonHours` property, rather than auditing every attribute.” This can match a hypothesis or finding entry in a historical case rather than its opening symptom.
4. **Output: parent trajectory plus anchor.** Semantic similarity and BM25 are fused with reciprocal rank fusion across all entries. A greedy procedure selects up to n distinct parent cases within the context budget. Each selected case returns its structured representation and the highest-scoring anchor entry, so the agent can see why it was retrieved.
5. **Likely failure point: extraction or evidence drift.** If extraction records a broad SACL as the confirmed fix, later queries may retrieve a superficially similar but unsuitable trajectory. If the historical remediation is obsolete, returning the full trajectory does not automatically know that it is stale.

The important lesson is not the final SACL setting. The query changes as the investigation changes. A 0% query and a 60% query are not the same static lookup; they should correspond to different states inside historical cases.

## Technical mechanism: two levels of representation, not one universal knowledge graph

### Offline indexing: raw history to a structured case

The paper represents the historical corpus as `H = {h_i}`. Each raw case has a unique identifier `u_i`, metadata `m_i`, and an ordered sequence of turns `x_1 ... x_T`. Extraction produces a structured representation that can be summarized as:

```text
h_i → h̃_i = (reviewer assessment ρ_i,
              timeline {φ₁ … φ_K},
              root cause r_i,
              resolution / mitigation a_i,
              entities e_i)
```

The operational meaning is important. `φ_k` represents a meaningful state in the investigation; `r_i` and `a_i` are diagnosis and action when the history supports them; `e_i` and metadata support filters over products, error codes, versions, or time; and `ρ_i` is an application-defined reviewer assessment. It is not equivalent to “closed means useful.”

The extraction workflow uses bounded batches so that a long history can exceed one context window. A worker receives the next ordered batch, metadata, and accumulated state, then applies targeted JSON Patch edits. A reviewer inspects the completed state, source evidence, and revision history before producing the assessment ([Appendix B.2](https://arxiv.org/html/2609.20754v1#A2.SS2); [Figure 2](https://arxiv.org/html/2609.20754v1#A2.F2)). Processing batches and semantic timeline segments are not the same thing: one batch can create several entries, and one entry can cross batch boundaries.

![Original RAFT Figure 2: bounded worker batches, an evolving case state, and final reviewer audit](/paperReading/raft-stateful-rag-troubleshooting/paper/figure-2-case-extraction.webp)

*Figure 2 (original paper Figure 2, Appendix B.2): the worker processes ordered artifacts in bounded batches, carrying state and handoff notes into the next pass through targeted edits; the reviewer audits and corrects the final state using source evidence and revision history, then returns an assessment. Original source: [arXiv Figure 2 anchor](https://arxiv.org/html/2609.20754v1#A2.F2) / [arXiv PDF](https://arxiv.org/pdf/2609.20754v1). The paper page marks CC BY 4.0; this local mirror preserves attribution and must be reused under that license.*

### Timeline entries are state transitions, not arbitrary summary paragraphs

Each `φ_k` is a contiguous segment corresponding to a meaningful investigation phase. The authors include the opening symptom, a hypothesis being added, discarded, or confirmed, root-cause confirmation, and a proposed and verified resolution. Acknowledgements or minor updates without new insight are absorbed into the current entry. The goal is to keep `K_i << T_i` while ensuring that each entry carries actions, active hypotheses, and current understanding.

Three distinctions should not be collapsed:

- **A timeline entry is not a capability:** it is the state representation that gets embedded and searched.
- **The case graph is not the timeline:** graph vertices are whole structured cases, and its edges come from a configurable similarity view.
- **An actionability assessment is not a theorem or universal filter:** the paper provides a schema and a place for the flag, while the policy for exclusion remains deployment-specific.

### Online retrieval: hybrid score, case promotion, optional expansion

When a query `q` arrives, RAFT first applies any user-specified filter to parent cases. It then ranks the remaining timeline entries with semantic and lexical scores fused by reciprocal rank fusion. The algorithm does not simply return top chunks. It scans the ranked entries, adds a parent case to `C` only on its first occurrence, accumulates the structured case size against context budget `B`, and stops when it has n distinct cases or cannot fit the next one.

The output can be written as:

```text
R = {(full structured case h̃_c, matched entry k*_c) : c in selected cases}
```

`k*_c` is the highest-scoring entry inside parent case `c`. This anchor is a provenance signal: the agent knows whether the case was recalled because of an observation, hypothesis, finding, or resolution state.

The second level is the optional graph `G=(V,E)`. In the experiments, the authors concatenate root-cause and resolution text, score case pairs with semantic plus BM25 RRF, keep top-k neighbours under a similarity threshold, and symmetrize the links. Graph expansion can pull in a sibling with the same underlying cause or remediation strategy even when its symptom or intermediate state did not match directly. It is not the source of RAFT’s main retrieval gain.

## How to read the evidence: retrieval quality is not repair success

![Original RAFT Table 2 and Table 3 evidence page: synthetic benchmark metrics and matched-entry depth](/paperReading/raft-stateful-rag-troubleshooting/paper/table-2-results-page.webp)

*Figure 3 (original paper Table 2/Table 3 evidence panel, Section 5.4): Table 2 compares Case Hit, Root Cause Coverage, and Resolution Steps Coverage at three progress points; Table 3 checks whether the matched entry moves deeper into the trajectory as the active case progresses. Original locations: [Table 2 anchor](https://arxiv.org/html/2609.20754v1#S5.T2) / [Table 3 anchor](https://arxiv.org/html/2609.20754v1#S5.T3) / [arXiv PDF](https://arxiv.org/pdf/2609.20754v1). This is an original paper page containing the table evidence, not a chart redrawn by this article. The paper page marks CC BY 4.0; this local mirror preserves attribution and reuse conditions.*

### Research question, controls, and headline result

The authors first organize Microsoft Learn Windows Server troubleshooting documentation into a structured wiki, then generate 2–4 cases per documented root cause. The result is 826 synthetic support cases across Active Directory, Windows Security, Remote Desktop, Group Policy, Licensing and Activation, Networking, and Backup and Storage ([Section 5.1, Table 1](https://arxiv.org/html/2609.20754v1#S5.T1); [Appendix A](https://arxiv.org/html/2609.20754v1#A1)). One case per root-cause group is held out as a test query; the remaining cases form the index.

The comparison includes vanilla RAG, HippoRAG2, Fast-GraphRAG, and RAFT. All methods share `text-embedding-3-large`, `gpt-5.2` for indexing, and `gpt-5.4` for evaluation. No metadata filtering is applied. The context budget is 6,000 tokens; RAFT, vanilla RAG, and HippoRAG2 are also limited to five distinct cases, while Fast-GraphRAG uses its entity/relation/chunk budget ([Section 5.2](https://arxiv.org/html/2609.20754v1#S5.SS2)). These controls isolate retrieval mechanism, but the synthetic cases average 2,767 tokens—much shorter than the tens of thousands of tokens the authors say real support cases can reach.

Queries are prefixes of each test case at 0%, 30%, and 60% of turns. The three metrics answer different questions:

- **Case Hit:** does at least one retrieved case share the query’s root cause and resolution?
- **Root Cause Coverage:** does the retrieved context entail the atomic claims in the gold root-cause explanation, according to an LLM judge?
- **Resolution Steps Coverage:** does it support the atomic claims in the gold remediation procedure?

Case Hit therefore says that a matching issue group was found. It does not say that the agent diagnosed the issue correctly or that the real system was repaired.

### Synthetic results: the advantage and its interpretation

Table 2 reports the following Case Hit values:

| Method | 0% | 30% | 60% |
| --- | ---: | ---: | ---: |
| Vanilla RAG | 0.673 | 0.719 | 0.769 |
| HippoRAG2 | 0.650 | 0.688 | 0.711 |
| Fast-GraphRAG | 0.421 | 0.442 | 0.583 |
| RAFT | **0.842** | **0.871** | **0.888** |

The direct answer is that RAFT more often retrieves a case from the same root-cause/resolution group at every stage, not only after the query contains rich diagnostic context. For RAFT versus vanilla RAG, the authors rerun identical held-out groups, progress points, and context budgets across five splits, then bootstrap issue-group clusters. Table 5 reports Case Hit differences of `+16.79 pp [13.91, 19.78]` at 0%, `+14.79 pp [12.02, 17.73]` at 30%, and `+12.19 pp [9.75, 14.68]` at 60%.

The mechanism has a matching diagnostic. The average depth of the matched entry moves from 9.1% of a case at 0% query progress, to 20.0% at 30%, and 54.0% at 60% (Table 3). This is what the state-aware hypothesis predicts: an early symptom matches an early historical entry, while additional diagnostic evidence shifts the match deeper into a comparable investigation rather than repeatedly matching the opening symptom.

This does not mean that GraphRAG is generally unsuitable for support. In this setting, HippoRAG2 and Fast-GraphRAG do not beat vanilla RAG. The authors’ interpretation is that coherent similar cases and actionable guidance matter more here than abstract relational inference across documents. That does not establish that every production GraphRAG design will regress.

### Coverage, noise, and ablations: what should remain qualified

RAFT also has the highest point estimate in all nine Root Cause Coverage and Resolution Steps Coverage columns in Table 2. Appendix C.3 is more cautious about uncertainty: early coverage gains and the 30% root-cause gain are statistically supported; the 60% root-cause interval crosses zero; the 30% resolution gain is close to the interval boundary; and the authors make no late-stage resolution-coverage claim. The best table entry is not automatically a proven advantage in every cell.

Appendix C.4 adds typos, 40% update dropout, or an unrelated turn to paired queries. The differences under typos and dropout are not statistically resolved. Under an unrelated turn, RAFT loses less Case Hit than vanilla RAG, especially at 60% progress, where the paired difference favoring RAFT is `+39.94 pp [35.73, 44.10]`. The authors explicitly bound this as controlled query-robustness on the benchmark, not noisy-corpus robustness, production-scale behavior, or cross-domain generalization.

The graph contribution is similarly modest. With k=3 and budget-matched expansion, full-sibling recovery improves at 0% and 30% but is effectively unchanged at 60%; overall Case Hit changes are only `+0.22`, `−0.28`, and `−0.06 pp`. Graph expansion is therefore an evidence-diversification option, not the source of RAFT’s main gain. An indexing-model ablation shows modest drops with gpt-5.4-mini and low reasoning, but a larger degradation with gpt-5.4-nano. This supports a cost trade-off—smaller models may be viable, extraction capacity still matters—not a claim that any cheap model is safe.

## Apache Jira transfer: closer to real histories, still a small sample

The Apache Jira evaluation set uses public histories from Cassandra, Hadoop, HBase, and Spark. A later duplicate report is the held-out query; an older issue already resolved as `Fixed` before the query opened is the exact target. Other 570 Fixed issues are distractors, not certified semantic negatives, because Jira links can be incomplete. The final set contains 30 manually audited duplicate groups and 600 corpus cases; all 30 groups are valid at 0% and 30%, while only 19 have enough pre-disclosure history for 60% ([Appendix D](https://arxiv.org/html/2609.20754v1#A4)).

RAFT reuses the synthetic experiment’s extraction prompt, schema, models, and retrieval procedure; only the context cap changes to 5,000 tokens. Jira has no gold root-cause or resolution-step annotations, so the paper reports Case Hit only: vanilla RAG is 0.667/0.667/0.789 at 0%/30%/60%, while RAFT is 0.833/0.840/0.895. These are gains of +16.7, +17.3, and +10.5 percentage points. They are directional transfer evidence: the authors provide no confidence intervals and do not call the result production validation.

The transfer test matters because it does not rely only on synthetic Windows Server labels and uses contributor-written, unredacted issue histories. It also has three important limits: 30 groups is small, the valid 60% slice is smaller, and duplicate links do not provide complete negative labels. Most importantly, it tests whether a marked duplicate is retrieved, not whether RAFT repairs a Cassandra or Spark issue and passes its real tests.

## Limitations and unsupported interpretations

RAFT’s limitations are not housekeeping that can be left to an appendix; they determine whether this retrieval layer can transfer safely into production. The synthetic evaluation is still moderate in scale, the Apache Jira transfer sample is small, and the paper does not evaluate end-to-end troubleshooting outcomes. A higher Case Hit must not be read as “the correct fix will be found”: extraction errors, freshness, privacy, and incomplete histories can all carry a wrong trajectory into context.

## Evidence map: keep Paper, Evidence, and engineering judgment separate

### Directly proposed in the paper

- a structured case representation containing reviewer assessment, timeline, root cause, resolution, entities, and metadata;
- entry-level hybrid retrieval, greedy promotion to parent cases, and a matched anchor entry;
- a configurable, optional case-level graph;
- the synthetic Microsoft Learn benchmark, Apache Jira transfer set, and three retrieval metrics: Case Hit, Root Cause Coverage, and Resolution Steps Coverage.

### What the evidence supports

- under the authors’ synthetic protocol, RAFT has higher point estimates on all three metrics at all three progress points, with clustered-bootstrap support for the three Case Hit gains over vanilla RAG;
- matched-entry depth moves deeper as query progress increases, consistent with state-aware retrieval;
- the small Apache Jira audit points in the same direction for Case Hit;
- graph expansion has a small, progress-dependent effect on sibling recovery in this benchmark.

### What is not established

- that RAFT improves final diagnosis, resolution success, engineer productivity, or an end-to-end agent reward;
- that the same gains hold for longer, drifting, privacy-sensitive production cases;
- a complete deployment TCO covering extraction cost, index latency, storage, revision, deletion, and invalidation policy;
- that the current public repository contains every synthetic benchmark file and script needed to rerun all paper tables.

### Bloss0m engineering synthesis

This article turns the adoption boundary into three deployment gates. **This is a Bloss0m engineering synthesis, not a three-stage framework proposed by the paper:**

1. **State gate:** define what counts as a meaningful state transition. Without that, “timeline entries” become arbitrary summaries and entry retrieval loses its meaning.
2. **Evidence gate:** keep every entry traceable to source artifacts, revision history, and reviewer decisions. Storing only the LLM summary makes error propagation difficult to audit.
3. **Outcome gate:** measure final diagnosis correctness, verified remediation, stale-action rate, privacy leakage, latency, token cost, and failures alongside Case Hit.

## Artifacts and reproducibility: usable implementation, partial release

As of **2026-09-21**, I independently checked Microsoft’s [RAFT repository](https://github.com/microsoft/RAFT):

| Artifact | Status | What I verified | Remaining caveat |
| --- | --- | --- | --- |
| implementation | Accessible | Public GitHub repository, MIT License, Python 3.11+ package, extraction/retrieval/graph/LocalPipeline code, and tests | External model credentials and provider configuration are required; versions affect reruns |
| Apache Jira corpus / queries | Accessible | `datasets/Apache_Jira/corpus.jsonl` (600 cases), `queries.jsonl` (30 held-out queries), and a README defining fields and evaluation rules | Jira histories drift; a fixed repository commit and source snapshot are needed for comparable reruns |
| synthetic Windows Server benchmark | Not found in the inspected current tree | The paper and README describe a released benchmark, but the public `datasets/` tree I inspected contains only `Apache_Jira` | Do not turn the release claim into “currently verified downloadable”; a direct endpoint or commit is still needed |
| full paper rerun | Partial | The Apache Jira Case Hit protocol can be reconstructed from the two JSONL files, valid-progress flags, target keys, and README | The synthetic tables, five split seeds, model endpoints, prompts, and exact generation snapshot still need to be fixed |

The repository quickstart requires `git clone`, Python 3.11+, `pip install -e .`, and provider credentials. `LocalPipeline` is for quick local experiments; production use still requires a case source, persistent vector/hybrid index, and retry queue. This is “inspectable implementation plus a usable part of the evaluation data,” not “every reported result is independently reproducible without additional release work.”

## Engineering decision and when not to use RAFT

### Conditions that make adoption plausible

- support or incident records have a trustworthy temporal order, and the current hypothesis changes as logs, tools, or interventions arrive;
- the team needs repeated retrieval during one investigation rather than a single FAQ answer;
- raw cases are long enough that re-reading them on every query costs more than one offline extraction pass;
- the organization can provide artifact provenance, reviewer policy, PII handling, and stale-case invalidation.

### Conditions for not applying it directly

- the corpus is mostly static specifications, FAQs, or short documents with no meaningful state transition; timeline extraction may only add cost;
- histories are incomplete, order is unreliable, or the “resolution” is an unverified one-off guess; parent trajectories would create false continuity;
- remediation expires quickly but cases have no version or validity metadata;
- the team cannot audit extraction but wants to treat `root_cause` and `resolution_steps` as ground truth;
- success is measured only by Case Hit, with no downstream diagnosis, safety, or outcome check.

A practical rollout is to treat RAFT as a retrieval component, not an autonomous troubleshooter: offline extraction and review → versioned index → online query and matched anchor → agent judgment → current-state verification before action. This sequence is **engineering interpretation**, not an author-claimed production protocol; it simply translates the paper’s retrieval boundary and artifact caveats into a safer adoption path.

## Three things to remember

1. **Technical idea:** RAFT is “entry-level state match plus parent-trajectory return.” The optional graph is a second-level related-case expansion, not the central insight.
2. **Evidence:** the synthetic Windows Server benchmark and the small Apache Jira audit both support higher Case Hit, and matched-entry depth moves with progress; coverage, graph contribution, and transfer evidence have narrower statistical boundaries.
3. **Boundary:** the paper shows better retrieval under a specified protocol, not that an agent now diagnoses or fixes production tickets, or that extraction, privacy, freshness, and index maintenance are solved.

## Further reading

- For a reading on grounding generation in evidence, see [Agentic RAG and partial-answer prediction](/en/paper-reading/53-agentic-rag-partial-answer-prediction/).
- For long-lived state and adaptation, see [Self-improving agents and durable state](/en/paper-reading/60-self-improvement-fast-tree-search/).
- For separating retrieval signals from agent outcomes, see [Agent evaluation and observability](/en/paper-reading/57-agentic-rag-causal-failure-attribution/).

## Primary sources

- [Zhang et al., “RAFT: A Stateful Retrieval-Augmented Framework for Troubleshooting Agents,” arXiv:2609.20754v1](https://arxiv.org/abs/2609.20754) (paper identity, Sections 3–5, Appendices A–D, CC BY 4.0).
- [Full arXiv HTML](https://arxiv.org/html/2609.20754v1) (Figures 1–2, Tables 1–9, and locatable section anchors).
- [Microsoft RAFT repository](https://github.com/microsoft/RAFT) (implementation, MIT License, Apache Jira artifacts, and quickstart; checked 2026-09-21).
