---
title: "RAG without Forgetting: Writing Successful Query Expansion Back into the Index"
description: "A source-grounded assessment of ERM's correctness gate, selective attribution, bounded key updates, BEIR/BRIGHT results, and missing artifacts."
pubDate: 2026-03-23
updatedDate: 2026-08-09
tldr:
  - "ERM is training-free index adaptation: it stores only expansion signals accepted by a correctness gate and attributes them to benefiting document keys."
  - "The paper shows broad benchmark gains, but mutable-index safety still depends on clean verification, repeat traffic, provenance, and rollback."
audience:
  - "Search engineers reducing query-time expansion work in high-QPS RAG."
  - "ML teams governing feedback contamination, index drift, and online memory."
tags: ["Paper Reading", "RAG", "Retrieval", "Query Expansion", "Continual Learning", "Vector Index"]
image: "/paperReading/05-RAG-without-Forgetting/image_1.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
paper:
  title: "RAG without Forgetting: Continual Query-Infused Key Memory"
  authors:
    - "Yuntong Hu"
    - "Sha Li"
    - "Naren Ramakrishnan"
    - "Liang Zhao"
  year: 2026
  venue: "arXiv 2602.05152 v1 (preprint)"
  links:
    pdf: "https://arxiv.org/pdf/2602.05152.pdf"
    arxiv: "https://arxiv.org/abs/2602.05152"
series:
  id: "rag-without-forgetting"
  title: "RAG without Forgetting Deep Dive"
  part: 1
  totalParts: 1
---

## Reader question and verdict

Query expansion (QE) can bridge a query–document mismatch, but normally pays for generation again on the next request. Key expansion (KE) is persistent, but often refreshes the corpus offline or applies heuristic changes without knowing whether downstream work was actually correct. *RAG without Forgetting* proposes Evolving Retrieval Memory (ERM): take a query's expansion units, accept them only after a correctness gate, assign each unit only to document keys for which it raises similarity, then accumulate bounded changes in an index-side memory.

That is a sharper idea than “make the retriever continually learn.” ERM does not retrain retriever parameters. It mutates stored keys, and its practical value depends on whether successful queries repeat and whether the gate really represents trustworthy success. The paper, an arXiv v1 preprint posted 2026-02-05, provides substantial benchmark evidence on 13 BEIR/BRIGHT domains. It does **not** provide a public implementation, long-running production A/B, attack evaluation, user-data policy, or rollback incident study. Treat it as a design and evaluation starting point for governed offline/canary adaptation—not permission for an index to learn from every interaction.

## Evidence Map

- **Paper evidence:** Figure 1 contrasts QE, KE, and ERM; Figure 2 and Sections 4.1–4.3 define gated feedback, selective attribution, and progressive key evolution; Table 1 reports retrieval; Table 2 reports StackExchange generation; Figures 3–4 and Appendix B.9/Figure 6 diagnose latency, adaptation budget, transfer, and QE choice.
- **Author claims:** under stated similarity assumptions, query and key expansion are equivalent; bounded selective updates converge; accumulated useful expansion can amortize query-time work and run at native retrieval latency.
- **What is not established:** verifier precision under live feedback, privacy of persisted interactions, adversarial/prompt-injected queries, operational rollback, index serving consistency, dollar cost, or stability over a real evolving corpus.
- **Bloss0m judgment:** ERM is safest when a separate trusted signal can gate an immutable, attributable delta log. Its value is not “memory” in the abstract; it is controlled amortization of repeatedly verified query patterns.

## The mechanism in one equation and three stages

The paper represents a corpus as documents $D=\{d_i\}$ with retriever keys $K=\{k_i\}$, and scores a query $q$ against a key through a similarity function $S(q,k_i)$ (Section 3). An expansion method produces $c(q)=\{e_1,\ldots,e_m\}$. ERM's question is not simply whether an expanded query retrieved something better; it is whether one expansion unit should become a persistent addition to one particular key.

**1. Correctness-gated feedback (Section 4.1; Figure 2a).** The paper defines a retrieval verifier $V_r$ (such as recall@K or a DPR match) and a generation verifier $V_g$ (such as ROUGE, task loss, or LLM-as-judge). Each is turned into a binary indicator by a task-specific threshold. The expanded query is accepted when retrieval or generation correctness holds. This “OR” rule is useful because BEIR has retrieval labels while BRIGHT can have answer-level ground truth; it is also a contamination boundary. A weak answer judge, click feedback, leaked answer, or poorly chosen threshold can turn a wrong association into a persistent index update.

**2. Selective expansion attribution (Section 4.2; Figure 2b).** For each retrieved document and expansion unit, the authors compute the marginal similarity gain from augmenting that key with the unit. In simplified notation,

$$
\Delta_{i,j}(q) = \operatorname{sim}(f(q), k_i \oplus f(e_j)) - \operatorname{sim}(f(q), k_i).
$$

Only positive-benefit associations are candidates for that document's memory. The important distinction is that a globally useful expansion is not copied blindly to every top-k result. This is the paper's defense against a generic query phrase causing indiscriminate key drift.

**3. Progressive key evolution (Section 4.3; Figure 2c).** Per-query attribution weights are softmax-normalized over its expansion units; gains are accumulated over a batch; low-scoring memories are discarded and retained units augment the document key. Updates are norm-bounded and a saturation rule ends a round when marginal benefit diminishes. The method claims no retriever parameter training. “Training-free,” however, does not mean governance-free: index state, vector norms, cached expansions, and the verifier all become learned operational state.

Figure 1 is a useful comparison rather than proof of universal superiority. QE pays inference-time expansion and discards it. KE has persistent corpus-side work but may be weakly aligned to tasks. ERM attempts to persist only task-validated local experience. Whether that amortizes in practice hinges on the paper's long-tail assumption: a small group of repeated intents dominates query traffic.

## What the theoretical claims actually cover

The paper's Section 4 and Appendix A state equivalence between query and key expansion under standard/additive similarity structure, then show convergence of the bounded selective update. Appendix A.3 sharply limits the scope: the consistency result applies exactly to unnormalised dense retrievers with additive augmentation and only approximately to cosine models when key norms change slowly; it does **not** extend to sparse or late-interaction retrievers as a global optimality result. This qualification matters because Table 1 includes BM25 alongside dense models.

Appendix A.4 gives an amortized-cost argument under a Zipf-like repeated-intent model: if expansion is done at most once per distinct intent, the number of distinct adapted intents grows sublinearly in the stated regime, relative to doing QE on every query. That is a model of traffic, not evidence that an enterprise's incident-driven, multilingual, seasonal, or one-off workload behaves that way. The “zero inference-time overhead” claim should therefore be read as *after a key has been updated, the serving path need not generate a new QE for that query pattern*; it does not erase storage, background evolution, cache, or monitoring cost.

## Evaluation protocol: coverage is broad, comparability is qualified

Section 5 and Appendix B.1 evaluate 13 datasets from two benchmarks. BRIGHT contributes seven StackExchange Q&A domains (Biology, Earth Science, Economics, Psychology, Robotics, StackOverflow, Sustainable Living) plus four coding/math domains (LeetCode, Pony, AoPS, TheoremQA-T). BRIGHT provides retrieval relevance and generation ground truth. BEIR contributes NFCorpus (323 medical queries over 3.1K documents) and SciDocs (1,000 queries over 4K documents), which have retrieval labels but no generation ground truth. Table 3 gives the dataset counts; LeetCode reaches 413,932 documents while Pony has 7,894. The mix is meaningful, but it is not a multilingual, private-enterprise, or live conversational benchmark.

The reported retrieval table covers sparse BM25, open dense BGE-Large/BGE-Base/BGE-M3-Dense/GTE-Base/MiniLM, and commercial Cohere and Voyage embeddings. Appendix B.2 calls the experiment set nine retrieval models; Table 1 displays the representative families and ERM counterparts. The authors also vary four document-index representations—full document, title, abstract, and keywords—and Appendix B reports 393 naive retrieval experiments. This means the best per-dataset configurations are not a fixed apples-to-apples single configuration. Appendix B.7 says GTE-base wins eight of 13 naive configurations, while index representation is domain-dependent: title helps much of StackExchange, abstract/keywords help other technical cases.

The principal retrieval metric in Table 1 is nDCG@1; Section 5 also names nDCG@10 and MRR in its evaluation discussion, while Figure 3/4 use nDCG@10. Table 2 evaluates end-to-end StackExchange question answering with Claude-3.5-sonnet for both generation and evaluation. This is broader evidence than a single retriever, yet it leaves unreported GPU/CPU hours, vector-index bytes, update I/O, background compaction, verifier request price, and exact judge prompts. The paper says it combines multiple QE strategies and random seeds and aggregates tested configurations (Section 5); without the runnable harness and raw logs, variance and selection sensitivity cannot be independently checked.

## Results: read absolute values before relative gains

[Table 1](https://arxiv.org/html/2602.05152v1#S4.T1) reports nDCG@1 across the 13 domains. Its headline pattern is real within the reported protocol: BM25 average rises from **26.3** to **38.5** (+46%); BGE-Large from **48.6** to **55.7** (+15%); GTE-Base from **49.9** to **56.4** (+13%); Cohere from **48.7** to **55.2** (+13%); Voyage from **50.8** to **56.3** (+11%). The effect is not uniformly positive. BGE-Large declines on Biology (95.1→91.3), StackOverflow (43.4→40.4), and Sustainable Living (79.1→75.9); GTE-Base has several small regressions too. “Consistent” in the paper should mean broad aggregate benefit, not a guarantee for every retriever–domain pair.

The spectacular relative numbers need denominators. BM25 goes from 0.9 to 20.7 on AoPS (+2200%) and 7.9 to 37.8 on TheoremQA (+378%). Those gains indicate the representation gap in reasoning-heavy retrieval can be large; they do not mean a deployed system becomes 23 times more correct. Conversely, some starting values are already high and leave little headroom. The authors' own Table 1 shows the richer story: weaker and mismatched baselines can benefit more, while a strong retriever can still lose in individual domains.

[Table 2](https://arxiv.org/html/2602.05152v1#S5.T2) makes the downstream connection on the seven StackExchange domains. BM25 answer quality average rises 72.6→76.6 (+6%); BGE-Large 74.5→77.6 (+4%); GTE-Base 77.4→79.0 (+2%); Cohere 79.3→80.5 (+2%). Several per-domain values decline (for example GTE-Base on Earth Science, Cohere on Earth Science and Robotics). Since Claude-3.5-sonnet both generates and evaluates in this setup, a model-family judge can be a pragmatic metric but is not independent human validation.

## Latency, adaptation budget, and transfer diagnostics

[Figure 3](https://arxiv.org/html/2602.05152v1#S5.F3) compares naive retrieval, ERM, and HyDE with GTE-base, title indexing, and a 0.5 split. The text reports native retrieval/ERM around 150–180 ms per query versus HyDE around 7–15 seconds, with comparable or better retrieval performance. This is a compelling **serving-path** result, not a total-system cost result: ERM has shifted work to expansion, verification, and key evolution before serving later repetitions. The figure does not publish a production tail distribution or a cost ledger for that work.

[Figure 4](https://arxiv.org/html/2602.05152v1#S5.F4) uses disjoint adaptation/held-out queries, resets keys for every split, and increases the adaptation fraction from 0.3 to 0.8. The reported nDCG@10 rises monotonically in the displayed AoPS, Psychology, TheoremQA-T, and SciDocs cases. That supports the narrow claim that more past adaptation data helps under this offline protocol. It is not a proof against temporal drift: the offline split, reset, and known benchmark labels differ from months of live feedback and changing documents.

Appendix B.9 gives two valuable failure/transfer warnings. [Figure 6](https://arxiv.org/html/2602.05152v1#A2.F6) reports LeetCode gains over QE/retriever combinations ranging from +12% (Facet with BM25) to +58% (HyDE with BGE-Large). The result says ERM can complement different QE choices on that dataset; it does not license choosing QE blindly elsewhere. Table 5 shows HyDE often leading on BEIR/technical content and Diver on several StackExchange domains. It also records negative best-QE deltas for Biology (−0.7%) and Pony (−0.4%); the appendix explains that already aligned queries/documents can receive noise rather than help.

The paper also examines five BRIGHT StackExchange datasets with zero gold-document overlap across queries (Section 5.2). It reports BM25 improvements of +6–47% and dense models within ±3% of baseline. This is a useful anti-forgetting diagnostic: updates did not obviously collapse unrelated retrieval under that constructed condition. It still does not measure poison persistence, fairness between frequent and rare intents, or what happens when a false gate repeatedly updates the same popular document.

## Gate contamination and the real forgetting risk

ERM calls its bounded updates “without forgetting,” but a bound on vector magnitude is not a semantic correctness guarantee. A false-positive correctness gate can write an expansion produced by hallucination, a poisoned document, leaked answer text, a biased click, or an unsafe user instruction into a reusable key. Selective attribution limits the blast radius compared with copying to every retrieved document; it does not prove that the selected document was the right one or that a later query will interpret the injected signal safely.

This creates two asymmetric risks. Popular intents offer enough repetition to amortize QE, but also receive enough traffic to reinforce an early mistaken association. Rare, long-tail intents cannot amortize the first expansion and may never accumulate sufficient trusted evidence; their quality can lag even while aggregate average rises. A mutable index may also privilege historical traffic over new product vocabulary. The paper acknowledges positive-feedback bias in Section 5.3 and suggests larger batches and more patient stopping to encourage exploration. That is a plausible mitigation, not an operational governance policy.

For a deployment, separate **evidence to serve** from **evidence to learn**. A retrieval or answer may be usable for one request while still failing the much stricter criteria to persist its expansion. Require provenance, a versioned verifier, a minimum support count from independent sessions, a holdout check, an expiry/TTL, and a reversible delta. Never learn directly from untrusted tool output, raw click-through, or prompts that can contain instructions. These are Bloss0m safeguards, not experimental variables in the paper.

## Artifact and reproducibility status (checked 2026-08-09)

The [arXiv record](https://arxiv.org/abs/2602.05152) and [full HTML/PDF](https://arxiv.org/html/2602.05152v1) are **accessible**. No first-party GitHub repository, checkpoint, demo, direct ERM dataset package, index snapshot, or runnable harness is linked in the paper/record, and no official code endpoint was located as of 2026-08-09. ERM code, QE prompts, correctness thresholds, seed/order configuration, key-delta logs, index representation, judge prompts, and complete result logs are therefore **missing/unavailable**.

[BEIR](https://github.com/beir-cellar/beir) and [BRIGHT](https://github.com/SDU-NLP/BRIGHT) are separate benchmark endpoints, not an ERM release. Acquiring them does not reconstruct the paper's choice of expansion method, model/API versions, document representation, adaptation split, gate, batch schedule, or aggregate configuration selection. The paper is inspectable, but not one-command reproducible.

## Engineering decision: use, pilot, or avoid

| Situation | Decision | Reason |
| --- | --- | --- |
| Repeated, read-heavy internal intents with labelled outcome signals | Offline replay, then canary ERM | This resembles the amortization premise and permits audit. |
| High-QPS retrieval with trustworthy separate verifier | Consider a versioned key-memory pilot | Serving latency may improve after validated adaptation. |
| One-off, long-tail, seasonal, or rapidly changing queries | Prefer stateless QE or reviewed offline refresh | Repetition and stable feedback assumptions are weak. |
| Feedback exposed to prompt injection, clicks, or untrusted tools | Do not write directly to keys | Gate contamination becomes persistent retrieval contamination. |
| Regulated/private interaction data | Stop until retention, consent, and deletion semantics are designed | Persisted expansions may encode user-derived information. |
| No key-level provenance, TTL, or rollback | Do not deploy mutable memory | A bounded vector is still difficult to investigate without deltas. |

An internal reproduction should freeze corpus, retriever and index versions; replay only labelled historical requests; record every candidate expansion, gate result, attributed document, key delta, and schema/model version; and evaluate a time-separated holdout. Promote a delta through shadow retrieval, then a small canary. Monitor nDCG/answer correctness where labels exist, coverage by query cohort, key norm and memory size, retrieval latency, storage/compaction, false-gate rate, and rollback success. A kill switch should revert to a known index generation, not attempt to infer an inverse update from a live vector.

## Next reading

ERM persists retrieval experience; [RAG-MCP](/en/paper-reading/04-RAG-MCP/) routes a request to a tool schema. They meet at the same engineering boundary: a model-generated signal should not become durable system state merely because it is plausible. In one case the state is a chosen capability; in the other it is an augmented key. Both need a gate with observable error rates.

## Primary Sources

- [Hu et al., RAG without Forgetting arXiv record](https://arxiv.org/abs/2602.05152) and [full paper](https://arxiv.org/html/2602.05152v1): Sections 3–5; Figures 1–4; Tables 1–2; Appendix A and Appendix B.1/B.7–B.9.
- [BEIR benchmark repository](https://github.com/beir-cellar/beir) and [BRIGHT benchmark repository](https://github.com/SDU-NLP/BRIGHT): available benchmark endpoints, separately checked from the absent ERM artifact.
