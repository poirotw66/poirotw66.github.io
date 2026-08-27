---
title: "Self-RAG: Let the Model Decide When to Retrieve, but Do Not Treat Reflection Tokens as a Production RAG Gate"
description: "A source-grounded reading of Asai et al., ICLR 2024: an LM is trained with reflection tokens (Retrieve / Relevant / Supported / Useful) for on-demand retrieval and self-critique. Self-RAG 7B / 13B reach 54.9 / 55.8 on PopQA; this is a when-to-retrieve method paper, not a production RAG platform and not an agent tool loop."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "Self-RAG changes whether retrieval is a fixed top-k default: the model uses Retrieve / Relevant / Supported / Useful reflection tokens to decide when to retrieve and to critique passages and its own generations."
  - "Table 2: Self-RAG 7B / 13B reach 54.9 / 55.8 on PopQA, 72.4 / 74.5 on PubHealth, and 67.3 / 73.1 on ARC-Challenge; ASQA citation precision is 66.9 / 70.3. Table 3a shows drops for No Critic and Retrieve top1."
  - "This is a 2023–24 on-demand RAG plus self-reflection method, not Lewis RAG’s always-retrieve contract and not a procedural Read-Gate; the critic is distilled from GPT-4 silver labels, and reflection tokens can still be wrong."
audience:
  - "AI engineers who need to separate when-to-retrieve from always-on RAG and from a procedural Read-Gate."
  - "Technical leads who must treat reflection tokens, a silver-label critic, and Wikipedia / Contriever settings as adoption boundaries."
tags: ["Paper Reading", "RAG", "Retrieval", "Information Retrieval"]
image: "/paperReading/33-self-rag-retrieve-generate-critique/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - retrieval-rag
paper:
  title: "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection"
  authors:
    - "Akari Asai"
    - "Zeqiu Wu"
    - "Yizhong Wang"
    - "Avirup Sil"
    - "Hannaneh Hajishirzi"
  year: 2024
  venue: "ICLR 2024 Oral (arXiv 2310.11511 v1)"
  links:
    pdf: "https://arxiv.org/pdf/2310.11511v1"
    arxiv: "https://arxiv.org/abs/2310.11511"
    doi: "https://doi.org/10.48550/arXiv.2310.11511"
    code: "https://github.com/AkariAsai/self-rag"
    project: "https://selfrag.github.io/"
series:
  id: "self-rag-retrieve-generate-critique"
  title: "Self-RAG deep reading"
  part: 1
  totalParts: 1
---

For the reading method itself, pair this with the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/). This note sits after [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/): Lewis RAG changes whether generation may condition on retrieved $z$; Self-RAG changes whether / when to call retrieval and how to critique the model’s own generations. For a procedural read-before-final contrast, see [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/). For the spine map, see the [RAG foundations reading map](/en/blog/92-rag-method-foundation-reading-map/).

## The paper in 90 seconds

- **Problem:** Standard RAG retrieves a fixed number of passages whether or not retrieval helps; irrelevant context can hurt generation and reduce instruction-following versatility. Even after retrieval, the model is not guaranteed to follow the passages.
- **Core insight:** Train an arbitrary LM to emit reflection tokens during generation: `Retrieve` decides whether to call a retriever; `ISREL` / `ISSUP` / `ISUSE` critique relevance, support, and utility. Retrieval becomes a decision, not a default pipeline stage.
- **Strongest evidence:** Table 2’s six-task summary—Self-RAG 7B / 13B reach PopQA 54.9 / 55.8, TriviaQA 66.4 / 69.3, PubHealth 72.4 / 74.5, ARC 67.3 / 73.1; biography FactScore 81.2 / 80.2; ASQA citation precision / recall 66.9 / 67.8 and 70.3 / 71.3. Table 3a: against Self-RAG (50k) at 45.5 PopQA, No Critic falls to 42.6 PopQA and 18.1 ASQA em; Retrieve top1 falls to 41.8 PopQA.
- **Main boundary:** The critic is first labeled by GPT-4 silver feedback and then distilled; reflection tokens can still be wrong; memory and evaluation stay on Wikipedia / public QA, not enterprise ACL or a citation product; this is not a tool-using agent loop.

My bounded verdict: **Self-RAG is worth keeping as the control point “retrieval is a learnable decision, and critique tokens filter generations.” It is not worth reading as a production RAG gate, treating silver critic labels as gold, or writing later agentic RAG leaderboard numbers back into these tables.**

> **Huahua in one sentence**
>
> Lewis RAG always retrieves, then generates. Self-RAG first asks whether to retrieve, then asks whether the generation is good enough. The world has not become a browser, and it has not become an access-control system.

## Version and reading scope

This note reads [Asai et al., ICLR 2024](https://openreview.net/forum?id=hSyW5go0v8) against [arXiv:2310.11511 v1](https://arxiv.org/abs/2310.11511) (first posted 2023-10-17; as of 2026-08-27 arXiv lists only v1). The arXiv HTML is marked [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the source package uses the `iclr2024_conference` style. The authors’ repository [AkariAsai/self-rag](https://github.com/AkariAsai/self-rag) cites ICLR 2024 Oral, and the OpenReview forum id is `hSyW5go0v8`. The PDF snapshot we audit still prints Preprint in the page header, so every number follows v1 PDF / HTML rather than marketing the Oral label over the tables. Author order follows the v1 PDF: Akari Asai, Zeqiu Wu, Yizhong Wang, Avirup Sil, and Hannaneh Hajishirzi (UW / AI2 / IBM).

Beyond the abstract, the note checks Section 3’s formalization and train / infer path, Tables 1–3, Figures 1–4, Appendix critic agreement and training-scale details, and artifact endpoints as of **2026-08-27**. Ancestor contrasts link only notes that already exist on this site: [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/), [DPR](/en/paper-reading/32-dense-passage-retrieval/), and [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/). Numbers from RAG-Anything, DocMemo, FinRank, 2025–26 agentic RAG leaderboards, and Deep Research products are **not** written back.

This is a published ICLR paper; evidence checking in this note is pinned to the arXiv v1 snapshot.

## The question the reader actually needs

Once a system can already “retrieve passages, then generate,” should engineering keep calling top-$k$ on every input, or let the model decide when to retrieve and then critique relevance, support, and utility? Asai et al. answer by putting those decisions into special vocabulary tokens and training one LM end to end.

The precise reading is not “is Self-RAG today’s enterprise citation product?” The real question is: **after retrieval stops being a default stage and becomes a learnable decision, on which tasks do the scores move, and where does the claim stop because the critic is silver, the memory is public Wikipedia, or the reflection tokens themselves are wrong?**

## Evidence map

| Layer | How this note uses it |
| --- | --- |
| **Paper directly supports** | Figure 1 contrasts always-retrieve RAG with on-demand Self-RAG; Table 1 defines four reflection-token families; Algorithm 1 and Section 3.3 describe inference; Table 2 reports six tasks; Table 3a / Figure 3 cover train and inference ablations, weight customization, and retrieval frequency; Figure 4 covers data scale and a 50-example human study; the Appendix reports critic agreement with GPT-4 and about 145k training instances. |
| **Author claims** | On-demand retrieval plus self-reflection can improve short-form QA, fact verification, reasoning, and long-form citation together; reflection tokens make inference controllable; beating several retrieval-augmented baselines does not require a larger proprietary stack. |
| **Not established** | Private corpora and ACL; a production hybrid / reranker stack; reflection tokens as gold labels; a tool-using agent loop; swapping Read-Gate procedural failure rates for Self-RAG scores; 2025–26 agentic RAG or DocMemo numbers. |
| **Bloss0m engineering judgment** | Read this note as the when-to-retrieve control point on the retrieval spine. For the always-retrieve ancestor, see [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/). For procedural read-before-final, see [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/). For the dense-retriever ancestor, see [DPR](/en/paper-reading/32-dense-passage-retrieval/). Those leaves change other control points; do not mix tables. |

Later sections keep numbers, author claims, and engineering judgment separate. “SOTA” means only the in-table claim at paper time.

## Why the previous approach is insufficient

Section 1 draws two pre-2023 lines clearly.

**Always-retrieve RAG** (including the [Lewis et al. 2020](/en/paper-reading/31-retrieval-augmented-generation/) ancestor): every input is prepended with a fixed number of retrieved passages. The upside is non-parametric memory when parameters are not enough. The downside is that whether retrieval is needed never becomes a decision—tasks that do not need factual grounding can still be hurt by off-topic passages; the authors cite Shi et al. on low-quality context harming generation.

**Retrieve without a follow guarantee:** even relevant passages do not guarantee that the generation stays consistent with them (the authors cite Gao et al.). The model is not explicitly trained to critique whether “this passage supports the sentence I just wrote.”

So the prior approach is insufficient not because “nobody thought of retrieval,” but because the **control point stays always-on**: retrieval is a pipeline default, and critique lives in external evaluation or post-hoc prompting rather than in the model’s own token decisions. Self-RAG changes exactly that step: Retrieve / Critique enter the same next-token objective.

## Core intuition

Ignore the tables for a moment. Imagine two open-book habits. Lewis RAG stacks five reference books on the desk for every question, even when closed-book would have been fine. Self-RAG first asks “does this next sentence need a lookup?”; only then retrieves, marks whether the passage is relevant / supportive / useful, and chooses a continuation.

Contrast three next steps that are easy to confuse:

- **Lewis RAG (note 31):** the next step is almost always “retrieve $z$, then condition generation of $y$.” There is no learned when-to-retrieve token.
- **Self-RAG (this note):** the next step first decodes `Retrieve`; only on Yes does it call a retriever, generate per candidate, decode `ISREL` / `ISSUP` / `ISUSE`, and pick a segment with critique scores.
- **Read-Gate / Before Reasoning Can Fail (note 15):** the changed control point is whether evidence is **read** after search and before final—a procedural gate, not trained reflection tokens.

> **Huahua's engineering note**
>
> Do not read “the model emitted Retrieve=Yes” as “the system already has a production citation gate.” A silver critic can be wrong, and tokens can be wrong; that failure does not magically become ACL or provenance.

## Walk one example through the method

The following uses a PopQA teaching trace from the paper’s Appendix. It explains the mechanism; it is not an independent experimental result. The input is `Who is the author of The Lie?`.

1. **Input:** a short factual question. There is no MCP, no private PDF, and no agent browser tool. The system is a Llama2-family generator trained with reflection tokens, plus an offline Contriever retriever.
2. **Intermediate representation:** the model first decodes `Retrieve=Yes`; the retriever returns passages, including one about Sam Harris’s *Lying*. Passages are wrapped in `<p>…</p>`-style markers (those chunks are masked from the training loss).
3. **Model or system decision:** for that passage the model decodes `ISREL=Relevant`, writes “The author of The Lie is Sam Harris.”, then decodes `ISSUP=Fully Supported` and `ISUSE=5`. With multiple candidates in parallel, Section 3.3 ranks segments by weighted relevance, support, and utility scores.
4. **Output:** a short answer string plus visible reflection tokens (soft weights or hard constraints can reshape behavior at inference).
5. **Likely failure point:** the same Appendix shows a plausible-but-unsupported case—a near-title book about a different author. If `ISREL` / `ISSUP` follow the error, the critique gate fails with it. The human study (Figure 4d, 50 examples each) reports PopQA S&P 92.5, ISREL 95.0, ISSUP 90.0, but biography S&P only 70.0—long-form is easier to get wrong while still looking relevant.

This PopQA item teaches **how the mechanism runs end to end**. For six-task scores, return to Table 2; for “are critique and on-demand retrieval doing real work?”, return to Table 3a.

## Technical mechanism

There are three pieces: retriever $\mathcal{R}$, critic $\mathcal{C}$, and generator $\mathcal{M}$ (at inference, one vocabulary-expanded LM usually covers generation and critique).

**Reflection tokens (Table 1)**

| Type | Inputs | Values | Role |
| --- | --- | --- | --- |
| Retrieve | $x$ or $x,y$ | yes / no / continue | Whether to call retrieval, or keep using prior evidence |
| ISREL | $x,d$ | relevant / irrelevant | Whether the passage helps solve $x$ |
| ISSUP | $x,d,y$ | fully / partially / no support | Whether the generation is supported by the passage |
| ISUSE | $x,y$ | 5…1 | Overall response utility |

Bold values in the paper mark the more desirable critique outcomes.

**Two-stage training (Section 3.2)**

1. **Critic learning:** for each reflection family, GPT-4 few-shot labels create silver supervision (author spot checks: about 95% agreement on relevance and retrieval necessity, about 90% on support, about 80% on usefulness). A Llama2-7B-initialized $\mathcal{C}$ is then trained to predict those tokens. Appendix table: Llama2-7B critic agreement with GPT-4 is Retrieve 93.8, ISSUP 93.5, ISREL 80.2, ISUSE 73.5.
2. **Generator learning:** $\mathcal{C}$ and $\mathcal{R}$ expand each $(x,y)$ into a supervised sequence interleaved with passages and reflection tokens (about 145,619 instances; the prose often rounds to 150k). $\mathcal{M}$ is trained with a standard next-token objective; loss skips retrieved chunk text; the vocabulary is expanded with reflection tokens.

This differs from PPO / RLHF: critique is computed offline and inserted into the corpus, so training stays ordinary LM loss rather than an online reward model plus PPO.

**Inference (Algorithm 1 / Section 3.3)**

For each segment, first predict Retrieve. If No, generate and score ISUSE. If Yes, retrieve multiple $d$, generate candidates in parallel, score ISREL / ISSUP / ISUSE, then run segment-level beam search with weighted critique scores (experiments default to beam width 2). Alternatively, compare the normalized `Retrieve=Yes` probability to a threshold $\delta$: larger $\delta$ means less retrieval (Figure 3c).

Operational constraints in the paper’s experiments:

- **Retriever:** Contriever-MS MARCO by default; top-5 for most tasks, up to top-10. PopQA / biography add web-search top-5; ASQA uses author-provided GTR-XXL top-5 for every baseline.
- **Memory:** official Wikipedia embeddings (2018 English Wikipedia); PopQA switches to a 2020-12 dump because entities are newer (Appendix).
- **Threshold:** retrieval threshold 0.2 for most tasks; 0 for ALCE / ASQA because of citation needs.
- **Backbone:** Self-RAG 7B / 13B are based on Llama2.

![Self-RAG paper Figure 1: always-retrieve RAG on the left versus on-demand retrieve–generate–critique Self-RAG on the right.](/paperReading/33-self-rag-retrieve-generate-critique/paper/figure-1-overview.webp)

*Figure 1, paper Introduction: left, RAG that always retrieves $K$ passages before generation; right, Self-RAG’s three steps—decide whether to retrieve, generate over multiple candidates, and pick a segment with critique tokens. Locatable at [Figure 1](https://arxiv.org/html/2310.11511v1#S1.F1); SVG endpoint [teaser_self_rag_v8.svg](https://arxiv.org/html/2310.11511v1/teaser_self_rag_v8.svg). From arXiv v1 HTML / source figures; the page marks CC BY 4.0. Reused here for teaching under that license.*

![Self-RAG paper Figure 2: a no-retrieval training example on the left and a retrieval-interleaved example with reflection tokens on the right.](/paperReading/33-self-rag-retrieve-generate-critique/paper/figure-2-training-examples.webp)

*Figure 2, paper Section 3.2: generator training examples. Left: `Retrieve=No`, then generate and score utility. Right: `Retrieve=Yes`, insert `<p>` passages, and interleave ISREL / ISSUP. Locatable at [Figure 2](https://arxiv.org/html/2310.11511v1#S3.F2); SVG endpoint [training_examples.svg](https://arxiv.org/html/2310.11511v1/training_examples.svg). Same license note as Figure 1.*

## How to read the evidence

Short-form QA, closed-set classification, and long-form citation are not one question. PopQA / TriviaQA score answer containment; PubHealth / ARC score classification / multiple-choice accuracy; Bio uses FactScore; ASQA jointly scores correctness, fluency, and citation precision / recall. Do not read ASQA citation precision as PopQA accuracy.

### Table 2: the headline is a six-task panel, not a single leaderboard

This table asks: on the same public tasks, how does Self-RAG compare with non-retrieval LMs, test-time RAG, and some systems trained with private data? What stays fixed is the public evaluation setup and the authors’ stated retriever; what changes is whether reflection tokens are trained and how inference retrieves and critiques on demand.

Selected rows (full table in the paper’s Table 2):

| Model | PopQA | TQA | Pub | ARC | Bio FS | ASQA pre / rec |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ChatGPT | 29.3 | **74.3** | 70.1 | **75.3** | 71.8 | — / — |
| Ret-ChatGPT | 50.8 | 65.7 | 54.7 | **75.3** | — | 65.1 / **76.6** |
| Ret-Llama2-chat 13B | 51.8 | 59.8 | 52.1 | 37.9 | 79.9 | 19.8 / 36.1 |
| Alpaca 13B + retrieval | 46.1 | 66.9 | 51.1 | 57.6 | 77.7 | 2.0 / 3.8 |
| Llama2-FT 7B + retrieval | 48.7 | 57.3 | 64.3 | 65.8 | 78.2 | 5.0 / 7.5 |
| Self-RAG 7B | 54.9 | 66.4 | 72.4 | 67.3 | **81.2** | 66.9 / 67.8 |
| Self-RAG 13B | **55.8** | 69.3 | **74.5** | 73.1 | 80.2 | **70.3** / 71.3 |

Observation: on the open-domain / fact-verification axis, Self-RAG 7B already exceeds ChatGPT’s PopQA 29.3 and PubHealth 70.1; on ARC, 13B’s 73.1 still sits below ChatGPT / Ret-ChatGPT at 75.3. On TriviaQA, ChatGPT’s 74.3 remains highest. On ASQA, Self-RAG citation precision meets or exceeds Ret-ChatGPT’s 65.1, but recall stays below Ret-ChatGPT’s 76.6; str-em / rouge also lag Ret-ChatGPT. The authors note that on factual-precision metrics the 7B model sometimes beats the 13B because the smaller model tends to emit shorter, more tightly grounded text.

The table **supports** “on-demand retrieval plus reflection beats same-size always-retrieve instruction-tuned baselines on several public tasks.” It does **not** support “beats every closed system” or “already a citation product.”

### Table 3a / Figure 3: critique and on-demand are not decoration

Ablations run at a 50k training scale (not the final 150k) and ask what happens if retriever / critic training is removed, or if inference collapses to always top-1.

| Setting | PopQA | PubHealth | ASQA em |
| --- | ---: | ---: | ---: |
| Self-RAG (50k) | 45.5 | 73.5 | 32.1 |
| No Retriever | 43.6 | 67.8 | 31.0 |
| No Critic | 42.6 | 72.0 | 18.1 |
| No retrieval (test) | 24.7 | 73.0 | — |
| Hard constraints | 28.3 | 72.6 | — |
| Retrieve top1 | 41.8 | 73.1 | 28.6 |
| Remove ISSUP | 44.1 | 73.2 | 30.6 |

No Critic drops ASQA em from 32.1 to 18.1; Retrieve top1 drops PopQA from 45.5 to 41.8. That **supports** “critique and multi-candidate selection contribute.” It does **not** let the 50k ablation row stand in for the final 7B / 13B Table 2 numbers.

Figure 3b: raising the ISSUP weight lifts ASQA citation precision and lowers MAUVE—more grounded generations are often shorter and less “fluent.” Figure 3c: raising $\delta$ sharply cuts retrieval frequency; PubHealth loses less accuracy than PopQA—long-tail entity questions depend more on retrieval.

![Self-RAG paper Figure 3c: retrieval frequency and normalized accuracy on PubHealth and PopQA as the retrieval threshold changes.](/paperReading/33-self-rag-retrieve-generate-critique/paper/figure-3c-retrieval-frequency.webp)

*Figure 3c, paper Section 5.2: how adaptive threshold $\delta$ changes retrieval frequency and accuracy. Locatable at [Figure 3](https://arxiv.org/html/2310.11511v1#S5.F3); SVG endpoint [tradeoff_fever.svg](https://arxiv.org/html/2310.11511v1/tradeoff_fever.svg). Same license note as Figure 1. If a crop shows only one panel, treat the full three-column Figure 3 (ablation / customization / retrieval) in the HTML as authoritative.*

### Figure 4: scale helps; the human study is small

From 5k to 150k, PopQA and ASQA citation precision rise more clearly than PubHealth. Llama2-FT does not show a matching lift from 50k to 150k—the authors use that gap to argue the gain is not “just more instruction data.” The human study uses 50 examples per task: short PopQA S&P / token agreement looks strong; biography S&P 70.0 warns that long-form can still look right while going wrong.

## Limitations and threats to validity

The Ethical Concerns section states that even with self-reflection and fine-grained attribution, outputs may still not be fully supported by citations. Keep these boundaries when reading the tables:

1. **Silver critic.** GPT-4 labels are not gold; usefulness bins are unstable even for humans (1 vs 2, 4 vs 5). Treating reflection tokens as a production gate writes distillation error into the control plane.
2. **Not a production RAG platform.** There is no ACL, private-corpus governance, hybrid stack, or citation SLA. ASQA precision / recall are evaluation metrics, not a product contract.
3. **Not an agent tool loop.** There is no browser action, no MCP, and no multi-step tool policy. Contrast [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/) or the agent spine as a different path.
4. **Not Read-Gate.** [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/) measures procedural failure to read after search; Self-RAG measures learned when-to-retrieve / critique. Do not swap those numbers.
5. **Smaller ablation scale.** Table 3a uses 50k; ASQA ablations also use a 150-example subset. The main table is the full-data 7B / 13B result.
6. **Public Wikipedia evaluation memory.** PopQA even switches dumps to 2020; private knowledge bases are not established.
7. **Do not back-port later papers.** DocMemo, RAG-Anything, FinRank, 2025–26 agentic RAG leaderboards, and Deep Research products do not belong in these tables.

## Engineering decision and when not to use it

When is this paper worth borrowing? When work switches between knowledge-intensive QA and long-form generation, you **are willing** to maintain a queryable non-parametric index, and you accept that whether to retrieve is a model-token decision whose critique weights can be tuned at inference. In that case, log separately: the Retrieve decision, retrieved $d$, generated $y$, and ISREL / ISSUP / ISUSE—`fully supported` from a token is not an audit pass.

When should you not treat this paper as a construction drawing?

- If you need the 2020 always-retrieve ancestor contract, read [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/).
- If you need the dense dual-encoder first stage, read [DPR](/en/paper-reading/32-dense-passage-retrieval/).
- If the failure mode is “searched but answered without reading,” read [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/). That is a runtime invariant, not a reflection-token training recipe.
- If you need multimodal originals, tool-schema routing, graphs, or multi-hop dynamic evidence, read those leaves; do not write their scores back into Self-RAG.

> **Huahua's take**
>
> Keep Self-RAG in the section titled “retrieval becomes a decision.” Silver critique can be a research control knob. As a production gate it still needs auditable labels, permissions, and a human escalation path when tokens fail.

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** [arXiv abs](https://arxiv.org/abs/2310.11511), [v1 PDF](https://arxiv.org/pdf/2310.11511v1), and [HTML](https://arxiv.org/html/2310.11511v1) are readable under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The [OpenReview forum](https://openreview.net/forum?id=hSyW5go0v8) resolves (this environment sometimes hits a challenge page; ICLR 2024 status is cross-checked via the GitHub citation and forum id).
- **Project page:** [selfrag.github.io](https://selfrag.github.io/) returns 200.
- **Code:** [AkariAsai/self-rag](https://github.com/AkariAsai/self-rag) returns 200 under MIT.
- **Model cards (usable):** [selfrag/selfrag_llama2_7b](https://huggingface.co/selfrag/selfrag_llama2_7b) and [selfrag/selfrag_llama2_13b](https://huggingface.co/selfrag/selfrag_llama2_13b) return 200.
- **Training environment (author-stated):** Stability AI compute for train / eval; OpenAI APIs for GPT-4 silver labels. The main experiment is not “download one notebook and reproduce Table 2.”

The smallest useful reproduction is to load public `selfrag_llama2_7b`, run a handful of long-tail PopQA items, and confirm that Retrieve / critique tokens appear and that retrieved passages show up only after Retrieve=Yes. Do not claim that this reproduces Table 2’s 54.9.

## Three things to remember

1. **Technical idea:** Self-RAG writes when-to-retrieve and self-critique into reflection tokens so one LM learns to retrieve, generate, and critique; retrieval becomes a decision rather than an always-on pipeline stage.
2. **Evidence:** On Table 2, 7B / 13B beat several retrieval-augmented baselines on PopQA, PubHealth, and related tasks, with ASQA citation precision 66.9 / 70.3; Table 3a shows No Critic and Retrieve top1 hurt.
3. **Boundary:** silver critic, public Wikipedia setup, not an agent tool loop. Do not read it as a production RAG gate, and do not write later leaf numbers back into these tables.

## Further reading

Self-RAG answers whether / when to retrieve and how to critique generations. For the always-retrieve ancestor, read [Lewis RAG](/en/paper-reading/31-retrieval-augmented-generation/); for the dense-retriever contract, read [DPR](/en/paper-reading/32-dense-passage-retrieval/); for procedural read-before-final, read [Before Reasoning Can Fail](/en/paper-reading/15-before-reasoning-fails/); for the spine diagram, see the [RAG foundations reading map](/en/blog/92-rag-method-foundation-reading-map/). For the reading method itself, see the [three-pass approach](/en/blog/08-efficient-paper-reading-three-pass/).

## Primary sources

- [Asai et al., “Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection,” ICLR 2024 / arXiv:2310.11511 v1](https://arxiv.org/abs/2310.11511)
- [arXiv HTML with figure anchors](https://arxiv.org/html/2310.11511v1)
- [OpenReview forum (ICLR 2024)](https://openreview.net/forum?id=hSyW5go0v8)
- [AkariAsai/self-rag (MIT)](https://github.com/AkariAsai/self-rag)
- [Project page](https://selfrag.github.io/)
- [selfrag/selfrag_llama2_7b model card](https://huggingface.co/selfrag/selfrag_llama2_7b)
