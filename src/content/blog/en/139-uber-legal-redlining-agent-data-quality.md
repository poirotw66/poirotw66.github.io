---
title: "Uber’s Legal Redlining Agent: Turning RAG Results into Decision Evidence"
description: "A look at how Uber’s legal agent evolved through better retrieval keys, lawyer feedback, time-weighted examples, balanced few-shot context, and deterministic rules."
pubDate: 2026-10-11
updatedDate: 2026-10-11
tldr:
  - "Uber reports that its Legal Redlining Agent reduced average contract review time by more than 20% and reached 91% accuracy on AI-generated decisions; the public post does not define the denominator or evaluation design."
  - "The first RAG version used a retrieval key that did not align with the target content; later versions used lawyers’ actual decisions, edits, and reasoning as feedback data."
  - "Historical examples need time and intent filters, few-shot context needs positive and negative cases, and non-negotiable policies belong in deterministic rules."
audience:
  - "AI engineers building enterprise RAG, agents, or legal document workflows"
  - "Teams responsible for data engineering and knowledge governance in high-stakes workflows"
  - "Product and legal leaders evaluating AI decision quality and human-review boundaries"
category: "AI Engineering"
tags: ["RAG", "AI Agent", "Enterprise AI", "架構模式"]
cluster: "ai-agent"
clusterRole: "case"
clusterOrder: 50
kind: "article"
showToc: true
image: "/blog/139-uber-legal-redlining-agent-data-quality/title_image.webp"
---

Uber’s Legal Redlining Agent evolved from a RAG prototype that retrieved legal playbooks into a contract-review tool that uses lawyer feedback, recent examples, negotiation rules, and an agentic modification workflow. Uber says the system reduced average contract review time by more than 20% and reached 91% accuracy on AI-generated decisions. The Legal Redlining Agent was also part of Uber Legal’s award-winning submission. These are figures reported by Uber; its engineering post does not provide the accuracy denominator, labeling method, baseline, or an independent evaluation, so they should be treated as company-reported results rather than a general benchmark.

The useful story is not simply “RAG became an agent.” It is how data became decision evidence: how retrieval keys were aligned with the task, how historical decisions retained their time context, how positive and negative examples helped define boundaries, and which policies were kept out of open-ended model judgment.

> **Huahua in one sentence**
>
> RAG quality depends on whether the retrieved data supports the decision at hand, not on how many documents the knowledge base contains.

## The playbook retrieval did not answer the right question

Uber’s first version put legal playbooks and negotiation examples into a RAG pipeline. The idea was to retrieve relevant passages by semantic similarity, then ask a large language model (LLM) how to respond to contract redlines. The team found three problems: the “key” representing the query intent differed in granularity from the content to be retrieved, making similarity unreliable; generated responses could sound too defensive or too accommodating; and the system struggled to generalize to situations missing from the playbooks.

This is why a “relevant document” is not necessarily “decision evidence.” A contract revision is judged through the original clause, the counterparty’s edit, its intent, and the company’s acceptable position. If an index stores a general policy without connecting it to the clause and decision context, even a high retrieval score may only deliver text that looks similar.

Uber later aligned data representation more closely with the work. Its rules index uses the original contract sentence as a stable search key; its historical feedback index uses the intent expressed by the counterparty’s change. The team notes that negotiations often start from the same template, making it possible to anchor later interactions to the original clause. Semantic search can still find similar cases when lawyers annotate the text or counterparties make small changes. The data-modeling task is to preserve what decision each record informs, not merely to store a text embedding.

## A lawyer’s correction is the useful supervision signal

Early feedback stored choices such as accept, reject, or modify, along with the original text, the redline, and a negative rating. This could signal a poor result, but not necessarily explain what the lawyer wanted instead. Uber later captured the expected action, specific comments, and the final text the lawyer adopted. Feedback could then describe not only where the suggestion failed, but how a particular intent should be handled under a policy.

For data engineering, this is a move from weak labels toward task-specific supervision. Each record should be traceable to the source clause, counterparty intent, applicable rule, model suggestion, lawyer decision, final wording, and rationale. That structure makes it easier to reconstruct context and inspect how recommendations change in similar cases. Uber says its feedback store contains thousands of interactions; the public post does not disclose the data distribution, deduplication strategy, or label-consistency results.

At runtime, the system uses similarity search and metadata filtering to narrow the pool to about 20 documents, then applies another LLM layer to check whether candidates align with the user’s and counterparty’s intent. This two-stage approach has a practical implication: vector search finds candidates; it should not alone decide which examples belong in the context. Policy, intent, and clause conditions still need validation. When evaluating RAG, teams should track not only Recall@k but whether examples in the final prompt can actually support the decision.

## Old examples should not carry the same weight as current policy

Legal strategy and company policy change. Uber says it applies exponential decay to historical interactions, with a configurable half-life currently set to 365 days. Recent decisions are therefore more likely to appear in context, reducing reliance on outdated positions. This does not delete older data; it changes how much influence each example has over time.

This is one way to address concept drift, but 365 days is not a universal answer. A useful half-life depends on how often policy changes, how long a clause remains relevant, and the risk of applying an outdated precedent. When policy has a formal effective date, version and validity metadata should take precedence over simple time decay. Expired policies must be withdrawable or excluded; they should not merely fade slowly in ranking. Time weighting is a retrieval strategy. Source versions, validity periods, and revocation workflows are the governance foundation.

Uber also describes dynamic few-shot prompting that balances agree and disagree examples. A small set of positive examples may teach the model to accept every similar-looking edit; only negative examples may lead it to reject negotiable changes. Showing both helps define the decision boundary. But balance alone does not guarantee representative sampling: teams still need to avoid selecting only easy, recent, or frequent cases, and check coverage by clause type, counterparty edit, and policy version.

## Leave flexible judgment to the model; enforce hard rules deterministically

Uber describes four stages of evolution: RAG, lawyer feedback, tone adjustment, and agentic modifications. When the system recommends MODIFY, the agent uses historical feedback and rules to draft compromise language, reducing the risk that generic text generation will depart from defined contract terms or add new provisions. Lawyers still review and decide whether to accept, reject, or change the suggestion.

The rules database is a related path. Lawyers can select important or frequently edited sentences in a template and associate them with the company’s position, fallback positions, and an example response. When a rule matches with high confidence, the system injects it into the context and asks an LLM to check that the output follows the specification. Uber’s architecture description also says a deterministic Rules Engine handles non-negotiable policies, while a probabilistic feedback loop handles negotiable nuance in tone and strategy.

That boundary matters. An LLM can help interpret intent, explain a rationale, or draft wording, but hard policies should be enforced through programmatic conditions, allowed values, and output validation. If compliance depends only on another model “checking again,” it remains a probabilistic judgment, not a deterministic guarantee. For high-stakes actions, a deterministic rule can block disallowed outcomes and route exceptions to a person.

> **Huahua's engineering note**
>
> Recency weighting and balanced examples can improve context, but they do not replace rule versioning, validity periods, source traceability, or human review.

## Turn the case into practical data-engineering checks

This case suggests a data-pipeline checklist, not just a prompt tweak:

1. **Define the data unit around the decision.** Preserve the relationship among the source clause, the edit, counterparty intent, policy, and final decision. Avoid comparing a query key with document fragments that represent a different unit of meaning.
2. **Make feedback traceable.** Record model inputs and outputs, the lawyer’s action, final adopted wording, rationale, timestamp, policy version, and source ID. Govern sensitive data through retention and access controls.
3. **Bring time into retrieval.** Use validity periods, versions, and time decay together. Define how obsolete rules are withdrawn and indexes rebuilt so expired examples do not remain retrievable just because they have a lower score.
4. **Evaluate boundaries, not only averages.** Split test cases by clause type, policy version, accept/reject/modify outcome, rare scenarios, and cases with no applicable rule. Measure when the agent should hand off to a lawyer.
5. **Separate deterministic policy from generative work.** Validate rule matches, output schemas, prohibited terms, and approval conditions in code. Use the model for intent interpretation, explanations, and candidate wording, while people retain final authority.

Uber’s public case offers useful architectural ideas, but it does not show that the reported impact has been independently reproduced. In addition to the missing accuracy calculation details, the post does not publish stage-by-stage ablations, error distributions, sample sizes by contract type, or long-term drift-monitoring results. Teams can reuse the data-modeling principles, but should establish their own baseline and evaluation set using their contracts, policies, and legal workflow.

For a broader view of data, versions, and evaluation across the pipeline, read the [Enterprise RAG guide](/en/blog/65-enterprise-rag-guide/). The [AI Agent guide](/en/blog/64-ai-agent-guide/) covers model and tool boundaries, while the [Agentic AI platform contract](/en/blog/93-agentic-ai-platform-contract/) adds the wider control-plane perspective.

## Source

- [Uber Engineering: Scaling AI in Legal: Building Uber’s Redlining Agent (October 8, 2026)](https://www.uber.com/us/en/blog/building-ubers-redlining-agent/): the four iterations, architecture, feedback data, time weighting, rules engine, and company-reported outcomes.

This article separates Uber’s implementation statements from engineering interpretation. The reported reduction of more than 20% in review time and 91% accuracy are company-reported figures; the source does not provide enough evaluation data to independently recalculate them.
