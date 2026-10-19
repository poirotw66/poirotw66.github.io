---
title: "Open Knowledge Format (OKF) v0.2: Provenance and Portable Agent Knowledge"
description: "An engineering guide to OKF v0.2 Markdown bundles, provenance, verification, lifecycle fields, attested computation, and boundaries with RAG and LLM Wiki."
pubDate: 2026-06-16
updatedDate: 2026-10-19
tldr:
  - "OKF v0.2 is a portable Markdown/YAML knowledge format; type is its only universally required concept field."
  - "Provenance, verification, lifecycle and attestation metadata do not replace retrieval, access control, or review workflows."
audience:
  - "Engineers and PMs tracking AI product and industry signals"
  - "Readers who want a fast brief before deciding whether to go deeper"
category: "Cloud & Platform"
tags: ["AI Agent","RAG","Google Cloud","Knowledge Graph"]
image: "/blog/24-open-knowledge-format/title_image.webp"
subtitle: "The format is portable; provenance and approval still need governance"
cluster: "enterprise-rag"
clusterRole: "support"
clusterOrder: 3
kind: guide
showToc: true
---

![OKF: portable enterprise knowledge through Markdown and YAML](/blog/24-open-knowledge-format/title_image.webp)

An enterprise agent is asked, "How do we calculate weekly active users (WAU)?" The answer is scattered across table schemas, metric definitions, scheduled queries, and runbooks. Even after retrieval finds a related document, there is another question: **How can that knowledge move between systems while preserving its provenance, version, and trust signals?**

[Open Knowledge Format (OKF)](https://github.com/GoogleCloudPlatform/open-knowledge-format) offers a small file-based contract for knowledge exchange. It is **not a database, a retriever, or an agent runtime**. It is a portable directory of Markdown concepts and YAML metadata, readable by humans and agents.

This revision follows the official **v0.2 specification**. The original v0.1 description does not cover today's provenance, lifecycle, and computation-attestation fields. Treat versions explicitly.

> **Huahua in one sentence**
>
> OKF describes how knowledge is packaged and exchanged. Correct retrieval, authorization, and approval remain separate engineering problems.

## 1. The minimal OKF contract

An OKF bundle is a portable directory. Each concept is a Markdown document with YAML frontmatter. The **only universally required frontmatter key is `type`**. Fields such as `title`, `description`, `resource`, and `tags` are recommended, not mandatory. Consumers should tolerate unknown types and extra producer-defined fields.

```text
business-knowledge/
  index.md
  metrics/
    weekly-active-users.md
  runbooks/
    account-recovery.md
```

An `index.md` can aid progressive navigation and a `log.md` can record history. Both are **optional reserved filenames** under v0.2. Concept files can link to each other using ordinary Markdown; a graph database is not required.

### An illustrative metric

This is **fictional sample content**, not the official WAU definition:

```markdown
---
type: Metric
title: Weekly Active Users
description: Distinct users with an eligible event during a week
resource: internal://metrics/wau
tags: [product, analytics]
---

# Definition
Count distinct users with an event in the approved event list,
using the product reporting timezone.
The dataset owner maintains the source query and event definition.
```

The document is portable and diffable. Merely supplying `type` **does not validate whether the metric statement is true**.

## 2. What v0.2 adds

OKF v0.2 keeps the minimal format but defines several **optional** field families:

| Field | Question answered | Practical interpretation |
| --- | --- | --- |
| `sources` | Where was this knowledge derived? | Source references and selected credibility signals |
| `generated` | Who created it, and when? | Producer attribution and creation time |
| `verified` | Who checked it, and when? | Signals for machine or human review |
| `status` | Is it currently usable? | For example draft, stable, deprecated |
| `stale_after` | When should it be revisited? | Allows consumers to flag potentially stale content |
| Attested Computation | Was a value computed by an approved method? | Runtime, parameters, executor, and attester contracts |

These are signals, **not guarantees**. A source URI can still be wrong; a human-reviewed label is not automatically business approval; and `stale_after` does not refresh a document on its own. OKF makes information exchangeable while producers and consumers remain responsible for validation.

### v0.1 to v0.2: two changes worth migrating

Section 13 of the specification describes two noteworthy replacements:

- The older `timestamp` is superseded by `generated.at`; consumers may retain a legacy fallback.
- A body-level `# Citations` list is superseded by the `sources` frontmatter family; consumers may still parse legacy citations.

Most other field families are optional additions. **Do not reject a v0.2 concept solely because it lacks `verified` or `sources`**. The format deliberately preserves minimal conformance and extensibility.

## 3. How an enterprise agent should use it

Return to the WAU question. Finding a concept that says "WAU is weekly logins" is not proof of a valid business definition. A more defensible query path is:

1. **Locate a candidate concept** using type, names, indexes, and search.
2. **Inspect provenance and lifecycle** with `sources`, `generated`, `verified`, and `status`. Treat absent fields as unknown.
3. **Verify operational values** against authorized systems, using controlled queries when appropriate.
4. **Ground the response** in a concept ID, source, policy version, and query assumptions; clarify or decline when no authoritative definition exists.

The v0.2 **Attested Computation** concept type declares an interface using `runtime`, `parameters`, `executor`, and `attester`. It **does not supply a universal execution sandbox, authorization, scheduler, or infallible verifier**. Those runtime controls remain separate.

## 4. OKF, RAG, and LLM Wiki have different jobs

| Component | Primary responsibility | What it does not provide |
| --- | --- | --- |
| OKF | Represent and exchange concepts, sources, and lifecycle data | Retrieval ranking, access policy, formal publication |
| RAG indexing and querying | Retrieve, rerank, and assemble relevant evidence | Automatically repair stale facts or approve knowledge |
| LLM Wiki / knowledge compilation | Analyze changes, draft updates, review, regression-test | Replace the authority of primary documents |
| Agent runtime | Plan searches, invoke tools, answer or refuse | Authorization merely because the input uses OKF |

An OKF bundle can be **one output artifact** of a knowledge-compilation pipeline: review the changes, export a source-linked and versioned bundle, and then index the approved release. Draft-to-release approval and rollback are **team governance mechanisms**, not a publication service built into OKF.

## 5. Acceptance checks before adoption

- **Compatibility:** Read legacy `timestamp` and `# Citations` when necessary, and tolerate unknown `type` values.
- **Provenance:** Sample-check that source URIs exist and actually support each claim.
- **Freshness:** Distinguish stale, withdrawn, unverified, and formally published content.
- **Permissions:** A readable bundle does not automatically grant access to the underlying source; source URIs may themselves be sensitive.
- **Attestation:** If using Attested Computation, inspect execution receipts and deterministic attester behavior instead of trusting LLM self-evaluation.

**Scope:** OKF can help when knowledge must cross tools, support version review, and remain readable by people and agents. For a tiny, stable FAQ set, evaluate its management overhead before adding a new format layer.

## Sources and further reading

- [Canonical OKF repository](https://github.com/GoogleCloudPlatform/open-knowledge-format)
- [Complete OKF v0.2 spec, especially §§4, 5, 10, and 13](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md)
- [Google Cloud's original OKF introduction](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing/)
- [Enterprise RAG guide](/en/blog/65-enterprise-rag-guide/): retrieval, indexing, and authorization boundaries.
- [LLM Wiki knowledge change validation](/en/blog/143-llm-wiki-knowledge-change-validation/): updates, review, and regression.
- [GraphRAG](/en/blog/35-graph-rag-llm/): trade-offs in explicit relationships and graph operations.
