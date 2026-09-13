---
stableId: "arxiv:2609.00035"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-05
lastVerifiedAt: 2026-09-05
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 29
decision: "deep-read-candidate"
---

# SilentProbe: Measuring Silent Failure in Production APIs Used as Agent Tools

## Identity

- Stable ID: `arxiv:2609.00035`.
- Canonical URL: https://arxiv.org/abs/2609.00035
- Authors: Zongrong Li, Shengkun Ye, Feiyou Guo, and Zuoyou Dang.
- Venue or review status: arXiv v1 submitted 2026-08-29; subjects cs.IR and cs.SE.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2609.00035`; no separate venue record located.
- Code / model / data: https://github.com/Jasper0122/silentprobe.

## Editorial fit

- Reader question: What happens when an agent receives a valid-looking HTTP 200 response for a query the API silently misunderstood?
- Why this belongs in the selected track: It fills `agent-systems` / `tool-use-reliability` with a concrete contract failure at the API boundary, not a generic model hallucination story.
- Gap it fills: Existing reliability coverage emphasizes authorization, evaluation, and replay; this paper isolates schema expressivity, silent tool failure, and downstream user-facing harm.
- Why now: The paper audits 721,320 parameters in 2,501 OpenAPI documents and connects schema gaps to live perturbations and full agent loops.

## Claim map

- Problem: A parsable HTTP response can conceal that the server ignored or misread a parameter, leaving the agent without an exception or branch condition.
- Main claim: Machine-checkable constraints yielded honest errors in 111/111 perturbations, while prose-only constraints silently failed in 44/61; models detected only 12% of downstream failures and repaired 0%.
- Method: Audit public schemas, run controlled perturbations against commercial endpoints through Monid, test 12 models across eight families, then execute full agent loops and compare schema promotion.
- What is genuinely new: The work joins specification prevalence, endpoint behavior, model compliance, and user-visible failure in one contract-level chain, with the practical intervention of promoting vocabularies into schemas.

## Evidence audit

- Datasets and probes: 721,320 public parameters; 219 schema-derived live perturbations across 27 vendors; 12 models; released schemas, perturbations, transcripts, labels, and run identifiers.
- Metrics: Honest error versus silent failure, vocabulary compliance, detection, repair, false-negative assertions, and invented figures.
- Baselines: Machine-checkable constraints versus prose-only constraints, exemplified vocabularies versus full vocabularies, and schema-lifted conditions.
- Statistical uncertainty: The paper reports Fisher exact p = 2e-13 for the live perturbation comparison and gives a cross-vendor/model design, but endpoint selection is not a random production sample.
- Threats to validity: The execution sample is limited to endpoints reachable through Monid, read-only, low-cost, and synthesizable; the public-corpus prevalence may not match hand-authored agent interfaces.

## Reproducibility

- Available artifacts and license: Public MIT repository with measurement code, data, reports, LaTeX, schemas, perturbations, transcripts, and run identifiers.
- Environment or compute requirements: Static corpus audits are free; live probes need a Monid key and model experiments need an OpenRouter key. The authors report the full campaign under US$8.
- Smallest useful reproduction: Run the free schema-gap audit, then reproduce a small closed-vocabulary perturbation with and without a machine-checkable enum and measure agent recovery.
- Blocking unknowns: Current provider behavior, Monid coverage, and whether the same error rates hold for write operations, authenticated APIs, streaming tools, and production-specific contracts.

## Critical reading

- Strongest result: A one-line schema change outperforms a model upgrade for the measured controlled-vocabulary failure, and the paper traces the failure all the way to a false user-facing answer.
- Weakest assumption: The chosen aggregation layer and read-only perturbations are representative enough to characterize “production APIs” broadly.
- Stated limitations: Reachability and cost constraints, the non-replicating prose-vocabulary prevalence result, and the bounded API sample are acknowledged.
- Claims not supported by the evidence: The results do not show all API silent failures are schema-caused or that schema promotion alone secures arbitrary tool integrations.

## Bloss0m connection

- Related Traditional Chinese routes: `43-enterprise-ai-agent-security`, `64-ai-agent-guide`, `85-trec-rag-2026-rag-evaluation-harness`, and the SARA authorization candidate.
- Related English routes: tool authorization, API contracts, schema-first MCP design, and production agent observability.
- Duplication risk: Low to medium; differentiate from authorization work by focusing on semantic tool honesty and validator-visible constraints.
- Suggested internal links: `agent-security`, `tool-use-reliability`, `43-enterprise-ai-agent-security`, and `64-ai-agent-guide`.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 5 evidence quality + 4 reproducibility + 5 engineering value + 5 series value = 29. The public artifact and end-to-end failure chain are unusually actionable; the live sample and read-only scope remain material.
- Open questions requiring human approval: Reproduce a small public slice, verify license and endpoint ethics, and decide whether the article should center schema design, validator design, or user-facing recovery.

