---
stableId: "arxiv:2609.11390"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-12
lastVerifiedAt: 2026-09-12
primaryTrack: "retrieval-systems"
primaryGap: "production-rag"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 5
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "deep-read-candidate"
---

# VikingRAG：讓結構化文件的 Agentic RAG 少走幾輪、少吃幾千 token

## Identity

- Search window: strict 72-hour scan ending 2026-09-12; arXiv v1 was submitted on 2026-09-10.
- Canonical URL: https://arxiv.org/abs/2609.11390
- Authors: Peiyuan Gao, Gaoyuan Zhang, Haojie Qin, Yahui Sun, Qianyi Zhang, Yunhao Zhang, Zeyu Wang, and Wei Lu.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-10; not peer-reviewed in the primary record.
- DOI / OpenReview / arXiv aliases: https://doi.org/10.48550/arXiv.2609.11390
- Code / model / data: Public AGPL-3.0 repository https://github.com/rucdatascience/VikingRAG with Docker Compose workflow, benchmark adapters, Supplement.pdf, and OpenViking-related storage code. The default inference backbone is DeepSeek-V4-Pro Preview through Volcano Engine; robustness checks use GPT-5.5, Seed-2.0, and GLM-4.7.

## Editorial fit

- Reader question: Can a structured-document RAG agent keep the benefits of multi-round evidence gathering without putting every directory, tool call, and previous answer into the prompt?
- Why this belongs in the selected track: VikingRAG treats hierarchical document storage, agentic retrieval, reuse of past traces, and escalation as one serving-system design rather than as independent retriever tricks.
- Gap it fills: Production RAG—how URI-addressable document structure, retrieval traces, and evidence-sufficiency checks can reduce recurring context cost while retaining a path to deeper retrieval.
- Why now: Long enterprise documents make both incomplete evidence and repeated tool interaction expensive. This paper offers a concrete answer: keep the hierarchy outside the prompt, reuse successful paths, and escalate only when a cheap first pass cannot support the answer.

## Claim map

- Problem: Flat chunk retrieval loses structural cues; existing structure-aware systems may expose whole directories or repeatedly pay the full multi-round interaction cost.
- Main claim: VikingRAG matches high-accuracy structure-aware RAG while using 11.6%–51.9% of baseline tokens; retrieval-trace reuse plus adaptive escalation reduces token use to 5.1%–32.5% while retaining competitive accuracy and practical storage behavior.
- Method: Ingest documents into hierarchy-preserving URI-addressable nodes, chunks, and multi-granular abstracts. Expose Search, List, Grep, and Read as agent tools; convert successful multi-round traces into query-conditioned experience edges; then run a sufficiency check before escalating from one-round retrieval to full agentic retrieval.
- What is genuinely new: The semantic and structural paths share one address space, so a vector hit can become a scoped navigation entry point. Historical tool traces become reusable shortcuts rather than merely logs, and the escalation decision is tied to explicit answer constraints such as entity, time, and scope.

## Evidence audit

- Datasets: Six real structured-document collections—VersionQA, SyllabusQA, QASPER, HotpotQA, LegalBench-cuad, and FinanceBench—cover software documentation, syllabuses, scientific papers, Wikipedia, contracts, and financial reports. The evaluated collections range up to 8.78M tokens and include PDF, Markdown, DOCX, and TXT.
- Benchmarks and metrics: Eight representative RAG systems are compared on end-to-end semantic answer accuracy, latency, LLM token consumption, ingestion time, deletion time, and storage cost. The protocol uses an LLM judge with expert verification; default settings are K=10 retrieved chunks, 1,000-token chunk bound, and 15 retrieval rounds.
- Baselines: MoDora, BookRAG, DeepRead, KohakuRAG, LightRAG, HippoRAG-2, SQL-AgenticRAG, and NaiveRAG cover tree, graph, relational, and flat-vector designs. Key robustness checks repeat VersionQA experiments with four backbone LLM families.
- Ablations: The paper varies experience warm-up queries, similarity threshold, retrieved chunk count, chunk size, round budget, document count, and backbone model. With 1,000 generated historical questions per dataset, experience-edge construction takes 1.5–3.7 seconds per query; the evidence checker lowers false-no-escalation rates versus a naive prompt, although errors remain.
- Statistical uncertainty: The paper exposes aggregate tables and parameter sweeps, but the primary record does not provide a conventional confidence-interval analysis for every headline comparison. The judge protocol and expert verification are evidence, not independent replication.
- Threats to validity: Historical questions are generated from the same documents as evaluation questions, so semantic overlap is realistic but not equivalent to an independently collected production workload. The 24-hour ingestion budget and provider-specific model APIs also shape which baselines finish.

## Reproducibility

- Available artifacts and licenses: The public `rucdatascience/VikingRAG` repository is an end-to-end artifact under AGPL-3.0. Its README documents Docker Compose services, pinned dataset checksums or Git revisions, explicit YAML configurations, persisted checkpoints, and runnable benchmark stages; the repository also includes `Supplement.pdf`.
- Environment or compute requirements: Docker/Compose, provider credentials, substantial storage, and model API access. The paper reports experiments on two Intel Xeon 6342 CPUs and two NVIDIA L20 GPUs.
- Smallest useful reproduction: Run one dataset, compare NaiveRAG/DeepRead/VikingRAG under the published K/L/B defaults, then warm the system with a controlled historical query set and measure token use, latency, and false-no-escalation. Inspect the experience-edge records rather than treating the final answer score as the only output.
- Blocking unknowns: Full reproduction still depends on external model-provider availability and may be expensive. The public workflow is inspectable, but an independent run has not been performed in this scan, and the LLM-judge/expert-verification implementation needs separate audit.

## Critical reading

- Strongest result: The design connects a practical systems abstraction—URI-addressable hierarchical storage—to a measurable serving trade-off. It also reports that the main conclusion survives several backbone swaps and that experience edges add lightweight URI-level state rather than copying whole documents.
- Weakest assumption: A single evidence-sufficiency checker can reliably decide when a cheaper one-round path is safe. The paper reports false-no-escalation above 5% on many datasets, so this is a risk-control mechanism, not a correctness guarantee.
- Stated limitations: The paper’s most direct evidence comes from structured-document QA collections, synthetic historical warm-up questions, bounded ingestion experiments, and model-judged answer accuracy. Generalization to live enterprise update rates, access control, adversarial documents, and noisy multi-tenant traces remains open.
- Claims not supported by the evidence: The results do not establish that VikingRAG is cheaper in total cost of ownership for every deployment, that experience edges remain safe under document revisions or permission changes, or that token savings automatically translate into better end-user latency under a real provider’s queueing and cache behavior.

## Bloss0m connection

- Related Traditional Chinese routes: production RAG, agentic retrieval, RAG evaluation, and MCP/tool-mediated evidence gathering.
- Related English routes: Retrieval Systems, enterprise RAG, and agent observability.
- Duplication risk: Medium-low; existing RAG coverage discusses retrieval and memory, but not the combination of external hierarchy, reusable retrieval traces, and adaptive escalation.
- Suggested internal links: Pair with Q2D-Web for production-scale retrieval evaluation, REVA for reusable compression at serving time, and existing RAG-MCP coverage for tool-mediated retrieval.

## Recommendation

- Output level: Deep Read.
- Score rationale: 29/30: unusually strong engineering fit, six heterogeneous structured-document datasets, multiple baselines and backbone checks, a public reproducible workflow, and a clear cost/accuracy trade-off. Evidence quality is held at 4 because the main answer metric is LLM-judged and external replication is not yet verified.
- Open questions requiring human approval: How do experience edges behave after document updates, ACL changes, or corrupted historical traces? What is the break-even point between one-time edge construction and recurring query savings? Can the sufficiency checker be calibrated with an independent verifier?
