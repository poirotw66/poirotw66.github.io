# Paper Essence Contract

This is the canonical contract for Paper Reading drafting, Radar handoff, and semantic review. Structural audit scores are proxies and cannot establish semantic correctness.

## Seven questions

Before drafting, answer these from the source. Before handoff, answer them again using only the saved article:

1. **Problem:** What exact problem is the paper trying to solve or characterize?
2. **Prior limitation:** Why are existing methods, abstractions, systems, or assumptions insufficient?
3. **Core idea:** What is the paper's central new idea?
4. **Formal or conceptual scaffold:** What are the key entities, abstraction levels, assumptions, taxonomies, and relations, and how do they lead toward the main conclusion?
5. **End-to-end mechanism:** How does the proposed method, system, framework, or reasoning process work from input to outcome?
6. **Supporting evidence:** What evidence supports the paper's central claims, and what kind of evidence is it?
7. **Adoption boundary:** Under what conditions should a practitioner trust, adopt, reject, or remain uncertain about the paper's conclusions?

If the paper cannot support one answer, explicitly mark the uncertainty instead of filling it with inference.

A reader should be able to reconstruct the paper's main conceptual model from the final article alone.

## Teach-back gate

For each language, use only the draft without consulting the paper. Answer all seven questions, cite the supporting article section and its primary-source evidence anchor where applicable, and classify each answer as `clear`, `partial`, or `unclear`. Identify missing conceptual links and any reasoning that requires the original paper or outside knowledge.

Revise every `partial` or `unclear` answer and repeat once. Both languages must support materially equivalent answers, uncertainty, and claim strength. If any answer remains unsupported, keep the handoff at `needs-revision`; do not create a publication PR or mark the ledger item as published.

Keep the answers and review outcome in working notes or the handoff, not in the article. Complete the separate reader-facing publication gate after the last revision.
