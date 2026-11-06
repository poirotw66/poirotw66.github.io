---
stableId: "url:https://arxiv.org/abs/2610.17195"
status: "durable-post-candidate"
firstSeenAt: 2026-10-15
lastVerifiedAt: 2026-11-06
primaryCategory: "AI Engineering"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 5
  evidenceQuality: 3
  engineeringValue: 5
  readerInterest: 5
  total: 23
decision: "durable-post-candidate"
---

# Welcome to the Age of Agent Ads: Using On-Policy Attacks to Steer Agentic Decisions

## Identity

- Search window: 2026-10-12 17:57 UTC to 2026-10-14 20:29 UTC; source appeared within the requested 24–72 hour window.
- Discovery queries: recent AI-agent incidents and boundary cases; arXiv agent evaluations published Oct 12–14; agentic commerce and indirect retrieval steering; recent AI work and adoption evidence.
- Canonical URL: https://arxiv.org/abs/2610.17195
- Publisher or author: Tim R. Davidson, Marija Šakota, Joshua Joseph, and Robert West; EPFL and Harvard University.
- Published or updated date: 2026-10-12 (arXiv v1 submitted 17:57 UTC).
- Source type: Research paper.
- Direct supporting sources:
  - Paper and full text: https://arxiv.org/abs/2610.17195 and https://arxiv.org/html/2610.17195
  - Author-linked repository: https://github.com/trdavidson/on-policy-attacks

## Editorial fit

- Why now: As agents begin ranking products, jobs, and rentals for people, listing authors gain an incentive to optimize for model behavior. This study demonstrates a new steering path that exploits aligned caution and retrieval rather than asking an agent to violate its policy.
- Reader question: Can a listing steer an agent without hidden instructions or a false claim about the listed product itself?
- Story hook: Counterintuitive evaluation result. A listing truthfully says it does not contain an invented harmful concept; the agent searches for that term, retrieves planted false context, and can demote competing options that lack the disclaimer.
- Category and topic cluster: AI Engineering / ai-agent; agent decision failure and safety boundary.
- Existing coverage and duplication risk: No matching stable ID, canonical URL, brief, or bilingual blog or paper-reading article was found. Distinguish this controlled paper from any claim of an observed commercial incident.
- Why this remains useful after the current news cycle: It identifies a durable boundary spanning agent alignment, search behavior, third-party content, and platform policy. The paper recommends explicit “instruction integrity” rules for content that targets AI intermediaries.

## Claim map

- Primary claim: An on-policy attack can influence an agent's ranking while leaving the listing's product-specific statement truthful and exploiting model behaviors associated with caution toward harm and information seeking.
- Measured evidence: The authors evaluated beauty products, supplements, job postings, and rental listings using 100 sampled items per dataset. They tested eight closed models from Anthropic, OpenAI, Google, and xAI plus four open models, with controlled claim/snippet placements, multiple fictitious concepts, and rank-aware outcomes. They report that some models and domains are steerable, while other model/domain combinations show little or no effect; tool-role search results are generally weaker than user-role snippets. In their simulated tool-search path, the tool response is deterministic rather than a live search observation.
- Vendor or author claims requiring qualification: All results are author-reported. The study measures model rankings in constructed task setups; it does not document an actual marketplace manipulation, user loss, or deployed agent incident.
- Bloss0m engineering consequence: Agent evaluation should include content retrieved from outside the listing and test whether safety heuristics can be exploited to alter rankings. Platform rules addressing truthful self-description or keyword stuffing may not cover content engineered to trigger off-platform agent retrieval.

## Evidence audit

- Primary evidence inspected: arXiv full text, experimental setup and results, limitations, prompt appendix, reproducibility statement, and author-linked GitHub repository.
- Baseline or comparison: Intervention-free rankings; several controlled injection placements and search/no-search conditions; eight closed models across four providers and four open-weight models. The core task compares top-k ranking rates, with experiments on four public listing datasets.
- Missing evidence: The linked repository currently contains only a README and no experiment code or data, despite the paper's code-availability link. No independent reproduction was found. The search-tool condition is mocked with a deterministic response rather than a live search stack.
- Conflicts or uncertainty: The authors say snippets can be recognized as evaluation artifacts, used only one search call for search-intent estimates, and had limited compute for smaller samples. Their stated results do not establish the attack's prevalence or effect in deployed commerce systems.

## Recommended treatment

- Output level: durable-post-candidate.
- Proposed angle: “The listing is truthful; the recommendation is manipulated”: explain how a benign-looking disclaimer can activate an agent's search and safety behaviors, then separate controlled ranking results from real-world impact and inspect the missing code artifact.
- Internal routes: Agent security, indirect prompt injection, and agent evaluation.
- Human decision required: Approve a bilingual draft only if the central framing keeps the threat as a demonstrated controlled attack pattern, not a reported live incident.

## Score rationale

- AI topic relevance — 5/5: Directly concerns agent decisions, search tools, and safety in an emerging delegated-workflow setting.
- Durability — 5/5: The incentives to influence agent-mediated rankings and the gap between model and platform defenses are likely to persist beyond this release.
- Evidence quality — 3/5: The primary paper reports controlled multi-provider experiments across four datasets, but it has small samples, no independent rerun, a mocked search response, and no runnable public code at verification time.
- Engineering value — 5/5: The work changes what agent and platform safety evaluations need to test across listings and retrieved material.
- Reader interest — 5/5: The truthful-disclaimer-to-false-search-context chain is a concrete, counterintuitive way that aligned behavior can produce a bad ranking.

## Source and coverage review (2026-11-06)

Rechecked the arXiv v1 experiment and limitations plus the linked repository. The four listing datasets, sampled-item setup and mocked deterministic search remain author-reported evidence; the repository still contains only a README. This is not a deployed-marketplace incident.

The discovery window, original score and decision rationale above are historical. This review checks cited first-party evidence, not a new independent reproduction search or a re-scoring/admission decision. Existing coverage takes precedence over the original no-duplicate snapshot.
