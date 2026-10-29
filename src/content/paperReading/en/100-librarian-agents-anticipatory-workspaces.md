---
title: "Librarian Agents: Preparing Reusable Workspaces Before Questions Arrive"
description: "Librarian Agents moves part of document retrieval before query time: a reinforcement-trained builder creates a navigable, provenance-linked filesystem for a separate answerer. This reading examines the 50 held-out BrowseComp-Plus corpus tasks, a distinct 443-question synthetic reuse set, BRIGHT transfer, token trade-offs, and the claims the evidence does not yet establish."
pubDate: 2026-10-19
updatedDate: 2026-10-19
tldr:
  - "Librarian Agents does not cache one answer. A builder organizes documents into synthetic files and source links before seeing future questions; a separate answerer navigates that workspace."
  - "On 50 held-out BrowseComp-Plus corpus tasks, arXiv v1 reports accuracy of 0.75 with Qwen3.5-4B and 0.77 with Gemini 3.1 Flash Lite. These are author-run results, not an independent rerun or a production outcome."
  - "A separate 443-question synthetic reuse evaluation and BRIGHT transfer results support testing whether upfront curation pays off, but the answerer reads more tokens and the benefit depends on workload, reuse, and the cost accounting."
  - "The public MIT repository includes compact records for recomputing selected metrics; full training still requires Tinker, Modal, and model/API access, while datasets retain upstream terms."
audience:
  - "Engineers and researchers designing long-context RAG, agentic retrieval, or enterprise knowledge assistants"
  - "Technical decision-makers comparing precomputation, retrieval quality, reuse costs, and source fallback"
tags: ["Paper Reading", "RAG", "Agentic RAG", "Retrieval", "Evaluation", "Agent Memory"]
topics:
  - retrieval-rag
  - agent-evaluation-observability
image: "/paperReading/100-librarian-agents-anticipatory-workspaces/title_image.webp"
field: "AI Systems"
difficulty: "intermediate"
showToc: true
paper:
  title: "Librarian Agents: Training LLMs to Curate Long-Context Workspaces that Anticipate Future Queries"
  authors:
    - "Anikait Singh"
    - "Teresa Zhang"
    - "Yoonho Lee"
    - "Roshen Sanjay Nair"
    - "Aviral Kumar"
    - "Chelsea Finn"
  year: 2026
  venue: "arXiv:2610.22273 v1 (2026-10-15; preprint)"
  links:
    pdf: "https://arxiv.org/pdf/2610.22273v1"
    arxiv: "https://arxiv.org/abs/2610.22273"
    code: "https://github.com/teresaz05/librarian-agents"
    project: "https://librarian-agents.github.io/"
series:
  id: "agentic-retrieval-and-workspace-memory"
  title: "Agentic Retrieval and Workspace Memory"
  part: 1
  totalParts: 1
---

## The paper in 90 seconds

- **Problem:** A document corpus may answer many questions. Searching the raw material from scratch can make an agent rediscover cross-document relationships each time. Fixed indexes move work earlier, but their predefined categories and summaries may not fit later tasks.
- **Core insight:** Before questions arrive, train a builder to turn raw documents into a layered set of synthetic files. A separate answerer then navigates the workspace for each query. The builder is rewarded for making questions hidden from it easier to answer, not merely for producing summaries that look complete.
- **Strongest evidence:** On 50 randomly held-out BrowseComp-Plus corpus tasks, the authors report 0.75 accuracy with Qwen3.5-4B and 0.77 with Gemini 3.1 Flash Lite, above the strongest listed baselines for each answerer, 0.44 and 0.42. The paper also reports a distinct 443-question synthetic reuse set, a 150-question BRIGHT evaluation across three domains, and a matched filesystem-structure analysis over 49 corpora and 435 questions (Figure 4, Tables 2–3, and Table 7).
- **Main boundary:** These are author-reported results under specific models, data, and prompts. Questions in the expanded reuse set are synthetic; the main matched BRIGHT comparison covers three domains; and keeping a workspace current as documents change remains unresolved. The answerer consumes more tokens, so accuracy alone cannot determine the operational trade-off.

The paper does not ask whether agents should replace retrieval. It asks whether some cross-document work can move before query time, so that one round of curation can serve multiple future questions. The authors formulate workspace construction as a finite-horizon decision process, reward the builder with downstream answer performance, then compare the learned builder with retrieval, precomputation, and a builder without reinforcement-learning fine-tuning. The result is a trade-off worth measuring: a richer navigable workspace improves answer accuracy on the reported benchmarks, while adding construction and read costs.

This reading follows [arXiv v1](https://arxiv.org/abs/2610.22273), submitted on 15 October 2026 and not verified as peer reviewed. The experiments below are treated as author-reported; they are distinct from the metric-recomputation capability in the public repository. Figures 4, 6, and 7 are reproduced from the paper under the CC BY 4.0 license stated on the arXiv page, with source links in their captions.

> **Huahua's engineering note**: Preparing before questions arrive assumes that future questions will use what was prepared. If the workspace does not track document changes, yesterday’s saved search can become today’s stale summary.

## Why traditional RAG is insufficient for repeated questions

The hard part of long-document question answering is not just fitting documents into a model’s context window. In an enterprise knowledge base, research archive, or software project, a useful answer may connect a design document, a release note, an issue thread, and a customer report. Reactive retrieval-augmented generation (RAG) receives a query, searches the raw documents, and synthesizes a response. It avoids preparing information for unknown uses, but each new question may repeat the work of finding the same relationships. At the other end, a knowledge graph or precomputed summary does work earlier, yet may lock the corpus into extraction rules or categories that do not fit later tasks (§1–2).

Librarian Agents asks an intermediate question: if curation itself can be trained against downstream tasks, can a builder create a structure that is more useful to an answerer than a generic index? “Beforehand” matters. The builder sees the source documents but not evaluation questions. Only after it builds a workspace does an answerer receive an individual query and navigate that workspace. The method does not prewrite an answer for each future question, nor does it assume a synthesized summary will cover every query. The workspace keeps paths to source documents so an answerer can return to details omitted from a summary.

### Separate the three roles

| Role | What it can see | What it does | Role in the evaluation |
| --- | --- | --- | --- |
| Source corpus $\mathcal{D}$ | The original documents | Remains the base source; the builder cannot delete it | Provides evidence and fallback paths |
| Builder $\pi_{\text{build}}$ | Documents and the evolving workspace, but not evaluation questions | Creates, merges, or deletes synthetic files, or stops | Is trained with downstream utility estimated on hidden questions |
| Answerer $\pi_{\text{ans}}$ | One question and the completed workspace | Lists and reads files, then produces an answer | Measures whether a workspace helps under a fixed model setup |

This is not the usual conversational memory of a personal assistant. The system organizes an external corpus rather than the agent’s own chat history, and another agent’s answers determine whether the organization is useful. The authors connect organization to task success instead of judging it only by summary fluency or manually specified graph nodes.

## Core intuition: turn some retrieval into reusable preparation

Imagine a corpus containing product design documents, release notes, issues, and customer reports. Question A asks when a behavior changed; question B asks which customers were affected; question C asks for the source behind the original decision. A reactive retriever may start over with different keywords for each question. A fixed index may have only one predefined organization. A Librarian builder could prepare a release timeline, a component index, and cross-document summaries, each linked to its source. Different questions can then take different routes through the same workspace (Figure 1; §2.2).

The key is not “more summaries are better.” A useful workspace needs to cover a range of plausible questions through efficient navigation, preserve a path back to the raw evidence, and amortize its construction cost across reuse. Those goals pull against one another. A concise index may omit rare facts; many generated files may make the answerer read more; and an outdated workspace can mislead after the corpus changes. The authors call the advance-built memory an **anticipatory workspace**. It is a system for organizing a corpus in advance, not a claim that the model knows future questions.

## Formal model: what is a workspace, and what does the builder learn?

Let the raw corpus be $\mathcal{D}=\{d_1,\ldots,d_n\}$, and let future questions be sampled from a distribution $\mathcal{Q}$. A workspace $\mathcal{F}$ is a set of files and directories with metadata such as node type and parent. The initial state $\mathcal{F}_0$ places the raw documents under the root. At each step, the builder selects an augmentation $\mathcal{A}_t$ that transforms the current filesystem into $\mathcal{F}_{t+1}$. Construction lasts for at most $H$ steps or until the builder invokes Stop. Delete never removes a raw source document.

| Action | Effect in the paper | Why it may help or create risk |
| --- | --- | --- |
| CreateFile | Synthesizes a new file from raw documents or existing synthetic files, with source references | Can form a cross-document summary; the summary may omit local details |
| MergeFiles | Combines related synthetic files into a higher-level file or directory | Creates hierarchy and shorter paths; a poor grouping can misplace information |
| Delete | Removes redundant or unhelpful synthetic files from the active workspace, not raw documents | Reduces clutter while preserving source fallback |
| Stop | Ends construction and returns the current workspace | Determines the representation used by later answers |

This action set is the interface the paper uses to bound its learning problem, not a universal filesystem standard. The builder policy $\pi_{\text{build}}(\mathcal{A}\mid\mathcal{F})$ chooses an action from the current state. The answerer policy $\pi_{\text{ans}}(\tilde{y}\mid q,\mathcal{F})$ produces answer $\tilde{y}$ from question $q$ and workspace $\mathcal{F}$. Their separation allows the construction policy to be optimized relative to a fixed answerer: the learned organization is what helps this answering setup, not a universally optimal organization independent of the answerer.

The paper models construction as a finite-horizon Markov decision process (MDP). Its state is the current filesystem, actions are the file operations above, and transitions are the resulting workspaces. With binary answer correctness, expected success under the question distribution can be written as $S(\mathcal{F})=\mathbb{E}_{q\sim\mathcal{Q},\tilde{y}\sim\pi_{\text{ans}}}[\mathrm{Acc}(\tilde{y},y^*(q))]$. The authors also define downstream utility $U(\mathcal{F})$, which can subtract synthetic-memory token and file-read costs; the construction objective can further subtract the cost of each edit (§2.3, Equations 1–4).

**The conceptual objective and the primary experiment must be read separately.** The cost terms show how a system could express the trade-off between accuracy and expenditure. But in the main BrowseComp-Plus training run, the authors set $\lambda_{\text{tok}}=\lambda_{\text{read}}=\alpha=0$. The builder therefore receives answerability probes and terminal correctness as its main learning signal, without an explicit reward for filesystem structure, navigation cost, or construction tokens. Those costs and structural properties are measured diagnostically after the fact; the main RL result does not show that the builder directly learned the most token-efficient organization (§2.3–2.4; Appendix A.7).

### Why use incremental rewards?

If the builder is evaluated only after finishing a workspace, it may have taken many actions without learning which one made answers easier or harder. The paper defines a dense reward using the change in utility before and after each edit, minus that edit’s construction cost. With no discounting, the increments telescope, leaving the final utility minus construction cost (Equations 2–4). In practice, evaluating the answerer after every file operation would be expensive. The authors probe answerability every eight builder turns, at most four times, and add a terminal correctness reward before updating the builder with GRPO. This approximates the ideal stepwise utility signal; it does not evaluate every intermediate edit exactly.

## Walk one worked example through the method

The following teaching example follows the paper’s mechanism; it is not an actual BrowseComp-Plus or BRIGHT question. Suppose a research team has design documents, issue discussions, and release announcements, and will repeatedly ask when an API behavior changed, which features were affected, and why the original change was made.

1. **Give the corpus to the builder without future questions.** The builder sees the raw documents but not the questions it will later be tested on. This prevents it from tailoring a workspace to one known query, but means it must organize the corpus for a question distribution $\mathcal{Q}$ learned from training.
2. **Create cross-document synthetic files.** The builder might create a version timeline, an API index linking to design documents and issues, and a higher-level directory file. New files should include source references, while original documents remain available. These artifacts are not prewritten answers; they provide multiple entry points for an answerer to explore.
3. **Let a separate agent navigate for a question.** Given “In which release did the API default change, and why?”, the answerer can start with the timeline, locate the release, and follow links to a design document and issue. It may need to read more synthetic files to answer. Higher accuracy does not imply lower tokens for each answer.
4. **Return to the original when a summary is incomplete.** If the timeline records the new default but not the reason, the answerer can follow a provenance reference to the source issue. This is the purpose of faithful fallback: synthetic files help with navigation but should not become the only source of truth. A broken link, stale version, or answerer that does not follow references can defeat the fallback.
5. **Reuse the preparation across queries.** Multiple future questions may share the workspace. If a corpus is queried only once, the upfront cost is difficult to amortize. If questions shift, documents change frequently, or workspace reads are costly, the theoretical reuse benefit may shrink.

This example surfaces a central assumption: future questions are unknown but come from a learnable distribution similar enough to the training tasks and documents. If the real workload differs substantially, the resulting hierarchy may be well organized yet offer the wrong entry points to users.

## How the experiments answer the question: accuracy, reuse, transfer, and structure

### The main held-out BrowseComp-Plus tasks

BrowseComp-Plus pairs document collections with questions whose answers may be distributed across sources. The authors train on 680 corpus-level tasks and randomly hold out 50 previously unseen corpus-level tasks for all evaluation. During construction, the builder sees documents but not evaluation questions; the completed filesystem is used for the evaluation questions associated with its corpus. The primary metric is binary semantic correctness against fixed reference answers, with failed constructions and generations kept in the denominator (§3; Appendix A.2).

Comparisons include embedding and reranker retrieval, late interaction, GraphRAG, Agentic RAG, AutoCompaction, and a builder without RL fine-tuning. Methods share a fixed answerer to isolate the usefulness of the generated workspace; cross-answerer results use Qwen3.5-4B and Gemini 3.1 Flash Lite. Figure 4 reports 0.75 and 0.77 for Librarian Agents. The strongest listed baselines for those models are 0.44 and 0.42, respectively, from reranker or agentic RAG. This author-run comparison supports the conclusion that the learned builder creates a workspace more useful to a fixed answerer on this benchmark. It does not establish a universal advantage across models, corpora, or live enterprise tasks.

![Figure 4: Comparison on BrowseComp-Plus with two fixed answerers. Librarian Agents reports higher accuracy on the authors’ 50 held-out corpus tasks; the plot is neither an independent rerun nor a production result.](/paperReading/100-librarian-agents-anticipatory-workspaces/figures/figure-4-browsecomp.webp)
**Figure 4 (§3, BrowseComp-Plus)** compares author-reported results with two fixed answerers. Read the strongest baseline for each answerer rather than only the tallest value. The sample unit is a held-out corpus task, so the scores should not be read as estimates for arbitrary enterprise knowledge bases. Source: [Figure 4 in the paper](https://arxiv.org/html/2610.22273v1#S3.F4). Reproduced under the CC BY 4.0 license stated on the arXiv page.

### Does one construction pay back over multiple questions?

The main held-out evaluation has one task per corpus and cannot show the effect of reuse. The authors therefore create a separate set of **443 synthetic questions across 50 corpora**, with 7–10 questions per corpus. Gemini 3.1 Flash Lite generates the questions using a few-shot prompt based on DeepDive questions, and the set is fixed during evaluation. These are not 443 distinct real-world corpora or a representative distribution of enterprise user queries. In this setting, the paper reports accuracy of about 0.64 for the RL builder and 0.24 for the base builder. The RL answerer reads an average of 26.9 files and 9,346 tokens per query, compared with 2.72 files and 1,238 tokens for the base builder (Table 2; Appendix A.2).

This calls for two separate efficiency questions. **Does raw answer-time reading fall?** Not necessarily; the RL builder’s richer workspace leads the answerer to read more files and tokens. **After accounting for construction and answer quality, do recorded tokens per expected correct answer fall?** The authors give a conditional answer using cost curves: at ten questions per corpus, the RL-to-base ratio of tokens per expected correct answer is 0.662, with a paired corpus-bootstrap 95% confidence interval of [0.504, 0.836]. The point estimate for the crossover is about 31 questions per corpus, with an interval of 18–54 (Figure 6; Appendix A.4). This is estimated from recorded tokens and full-denominator accuracy, not dollar cost, end-to-end latency, or observed adoption benefits.

![Figure 6a: Recorded construction cost amortized across queries, together with answer-time navigation tokens per query.](/paperReading/100-librarian-agents-anticipatory-workspaces/figures/figure-6-tokens-per-query.webp)
![Figure 6b: Recorded tokens per expected correct answer after normalization by full-denominator accuracy, with paired corpus-bootstrap intervals.](/paperReading/100-librarian-agents-anticipatory-workspaces/figures/figure-6-tokens-per-correct.webp)
**Figure 6 (Appendix A.4)** amortizes per-corpus construction tokens $B_m$ over $q$ questions and adds answer-time tokens $A_m$: $T_m(q)=B_m/q+A_m$. The right panel then divides by observed accuracy $p_m$ to compare recorded tokens per expected correct answer. These curves are calculated from frozen records with paired corpus bootstrapping. They describe reuse under a particular corpus, model, recorded cost, and accounting rule, not a deployment bill forecast. Source: [Figure 6 in the paper](https://arxiv.org/html/2610.22273v1#A4). Reproduced under the CC BY 4.0 license stated on the arXiv page.

The repository’s current `RESULTS.md` and `REPRODUCING.md` describe a compact-record version of the 443-question evaluation: 282/443 versus 107/443 correct, or 63.66% versus 24.15%; Librarian construction tokens are 147,634 per corpus, and the repository reports about 16.8K recorded builder and filesystem-read tokens per query at 20 questions per corpus. The paper’s main text reports 178,926 construction tokens and roughly 18K tokens per query at 20 questions. These construction totals come from distinct evaluation protocols; their numerators, question counts, or cost curves should not be mixed. The repository script can recompute the metrics from compact score records, but that does not rebuild workspaces, rerun model generations, or independently rerun the source benchmark.

### Zero-shot transfer to BRIGHT

The next question is whether a builder trained only on BrowseComp-Plus can be applied to different domains. The main BRIGHT comparison samples 50 questions each from AOPS, Biology, and Stack Overflow, for 150 total. The builder creates one workspace per domain without seeing evaluation questions. With a fixed Qwen3.5-4B answerer, Librarian averages 52.0% pass@1 (SE 2.8) and dense retrieval 20.8% (SE 2.9). Average pass@3 is 66.8% (SE 3.4) and 28.0% (SE 3.5), respectively. The authors estimate pass@3 as the probability that at least one of three attempts succeeds using four sampled responses per question; it is not simply the observed rate from exactly three generated answers (Table 3; Appendix A.2).

The gains are not uniform across the three domains: AOPS rises from 31.5% with dense retrieval to 36.0%; Biology rises from 19.5% to 34.5%; Stack Overflow rises from 11.5% to 85.5%. The Stack Overflow result therefore contributes a large part of the average gap. An average should not hide the per-domain variation, and these figures do not establish reliable transfer across a broad set of tasks. Appendix Table 6 compares the builder with the base model across nine additional BRIGHT domains, with $n=20$ per domain, but does not provide the same full set of matched retrieval baselines. These directionally consistent results are supplementary evidence, not a generalization result as strong as a large, representative multi-domain evaluation.

## Structural diagnostics and fallback: what does hierarchy add?

If RL simply creates more summaries, does filesystem structure matter? On 49 corpora with completed workspaces, the authors compare the original hierarchy with flattened and shuffled versions using 435 questions from the expanded reuse set. Table 7 reports 55.86% ± 2.58% accuracy and 3,635 ± 216 navigation tokens for the original organization; flattening yields 57.70% ± 2.81% accuracy and 5,497 ± 356 tokens; shuffling yields 51.72% ± 2.87% accuracy and 3,612 ± 221 tokens. In this separate matched answering run, removing hierarchy raises navigation cost, while shuffling semantic placement lowers accuracy. This is not an ablation of the main Figure 4 results or an end-to-end retraining of the builder: it uses a different question set, fewer completed corpora, and a fresh evaluation protocol.

Figure 7 gives a concrete fallback case. The synthetic workspace omits a detail needed to answer a question, and the answerer follows provenance information to the relevant raw source and recovers the answer. This shows one successful path, not a recovery-rate estimate for all omissions. A real system still needs readable links, identifiable source versions, an answerer that knows when to follow them, and answers whose evidence can be checked.

![Figure 7: When a synthetic file omits a needed detail, the answerer follows a provenance reference to a raw document and recovers the information.](/paperReading/100-librarian-agents-anticipatory-workspaces/figures/figure-7-provenance-recovery.webp)
**Figure 7 (Appendix A.6)** illustrates an author-selected provenance-recovery case. Its lesson is that synthetic memory does not replace the original corpus: the answerer can be routed back to a source when the summary is incomplete. It establishes that the paper presents this successful path, not how often recovery fails or links break. Source: [Figure 7 in the paper](https://arxiv.org/html/2610.22273v1#A6). Reproduced under the CC BY 4.0 license stated on the arXiv page.

## Evidence map: what the results establish, and what they leave open

| Question | Evidence in the paper | What it supports | What it does not support |
| --- | --- | --- | --- |
| Does the RL builder improve answers on this benchmark? | Figure 4: 50 held-out BrowseComp-Plus corpus tasks, two fixed answerers, retrieval and precomputation baselines | In this benchmark and setup, the authors’ learned builder produces workspaces that help the downstream answerer | A universal advantage across corpora, models, enterprise collections, or live products |
| Can reuse amortize construction? | 443-question synthetic reuse set; Figure 6 and Appendix A.4 use recorded tokens, accuracy, and bootstrap curves | Reuse count and recorded tokens per expected correct answer affect the relative cost | Guaranteed savings, lower latency, or better economics for any real query distribution |
| Can the builder transfer to other domains? | Table 3: 50 questions each from three BRIGHT domains; Table 6: 20 questions each across nine more domains | The authors observe higher scores in these fixed cross-domain evaluations | Broad external validity, stable transfer across all domains, or workflow improvements for real users |
| Does workspace structure matter? | Table 7: matched original, flattened, and shuffled comparisons on 49 corpora and 435 questions | In this analysis, hierarchy changes navigation cost and shuffled semantic placement reduces accuracy | A uniquely optimal hierarchy or complete isolation of all structure, content, and model interactions |
| What happens when synthesis omits a fact? | Figure 7: one provenance-recovery example; §2.2 describes references to raw documents | Source fallback is an important architectural capability, with a demonstrated successful case | Guaranteed recovery or citations that verify every answer claim |

One more training and evaluation boundary matters: the authors estimate answerability from hidden training questions to shape the builder, and state that evaluation questions are not used to build workspaces or select the reported checkpoint. That is preferable to exposing test questions during curation, but the assumption about distribution $\mathcal{Q}$ remains. Future queries must be sufficiently related to the training task and document types for a learned organization to provide useful entry points.

## Limitations: static corpora, cost accounting, and deployability

1. **Updating the corpus remains open.** The paper evaluates static document collections. It does not settle when to rebuild, locally update, or invalidate a workspace after documents are added, deleted, or revised. Without such a policy, a synthetic summary may become stale.
2. **Upfront curation depends on reuse.** Construction is divided by the number of questions per corpus, while the answerer reads a richer workspace. The reported token curves produce a conditional crossover after normalizing for correctness; neither raw accuracy nor construction tokens alone represent total cost.
3. **The evaluation is bounded and partly synthetic.** The main evaluation uses 50 held-out corpus tasks; the expanded reuse evaluation uses 443 synthetic questions across 50 corpora; and the main matched BRIGHT comparison includes three domains and 150 questions. There is no long-running online traffic, multi-company deployment, or real-user cost study.
4. **Training and evaluation depend on fixed services and models.** The public reproduction guide specifies a Qwen3.5-4B builder, a Qwen3.5-35B-A3B executor for Create/Merge, and Gemini 3.1 Flash Lite for history compaction. Other configurations use Tinker, Modal, and API credentials. Different models or providers may change workspaces and results.
5. **Fallback is not a source-governance guarantee.** The workspace preserves provenance links, but the paper does not evaluate document-version drift, link integrity, access-control boundaries, or claim-level citation fidelity. Returning to a raw document still requires locating and checking the relevant evidence.
6. **Benchmark comparisons are not a universal retrieval ranking.** Baselines have their own models, indexes, construction procedures, costs, and answer flows. A “strongest baseline” is strongest only under the stated protocol; the 178,926 and 147,634 builder-token figures belong to separate protocols and cannot be substituted for each other.

The authors also note that the builder’s large file context may constrain scale, and suggest combining Librarian models with clustering or retrieval. A finite set of synthetic artifacts cannot anticipate every rare query, so deciding when to bypass a summary remains a systems problem (§4). These conditions are central to whether the method fits a changing knowledge base, not incidental deployment details.

## Artifacts and reproducibility

As of 19 October 2026, the authors’ [GitHub repository](https://github.com/teresaz05/librarian-agents) publicly provides MIT-licensed code, environments, training and retrieval methods, configurations, tests, compact result records, and metric-recomputation scripts. Appendix A.11 labels synthesized workspaces, logs, and experimental results CC BY 4.0; models and BrowseComp-Plus, BRIGHT, and DeepDive data remain subject to their providers’ or upstream creators’ terms.

According to the README and `REPRODUCING.md`, `scripts/reproduce_results.sh` recomputes selected reuse, BRIGHT, and hierarchy-ablation metrics from bundled score records and checks aggregates, configuration, and the training-reward series. This is a check against released records, not workspace construction, model retraining, or an independent end-to-end benchmark rerun. Full training requires Python 3.11+, installed dependencies, Tinker, Modal, model/API permissions, and environment configuration; some baselines also require CUDA. This reading uses the authors’ reported experiments and does not claim a full reproduction.

## Bloss0m engineering judgment: when should a team prepare first?

**Bloss0m engineering judgment:** The lesson is not “replace RAG with a filesystem.” It is to treat corpus preparation as a policy that can be evaluated against downstream tasks. If a relatively stable corpus repeatedly serves similar questions, cross-document relationships are repeatedly rediscovered, and the system can preserve source and version paths, anticipatory curation is worth comparing with online retrieval under the same data and answerer. For short-lived one-off queries, frequently changing documents, or fine-grained access boundaries, the cost of building and maintaining a workspace may outweigh its benefits.

A practical evaluation should hold corpus versions, unseen questions, answerer version, response budget, and scoring budget constant. Measure accuracy, construction tokens and time, answer-time read tokens, recorded cost per expected correct answer, fallback success, and staleness after updates. In particular, measure the actual number of reuses rather than turning the paper’s estimated 31-question crossover into a procurement threshold. That point estimate comes from a specific recorded-cost curve and has a bootstrap interval; it is not a universal economic break-even.

The safest system interpretation is a **source-linked curation layer**, not an unquestionable knowledge base: synthetic files aid discovery, citations lead to versioned originals, workspaces can be invalidated after updates, and answerers can fall back when uncertain. This is a **Bloss0m engineering synthesis**, not a production architecture validated by the paper. If source permissions, dates, and fallback paths cannot be maintained, benchmark scores alone do not justify treating summaries as authoritative answers.

For related perspectives, continue with [the foundations of retrieval-augmented generation](/en/paper-reading/31-retrieval-augmented-generation/), [Bayesian analysis of RAG evaluation](/en/paper-reading/70-rat-unified-bayesian-rag-evaluation/), and [TRACE on accountable agentic retrieval](/en/paper-reading/93-trace-accountable-agentic-retrieval-archives/). Together they cover the retrieval pipeline, evaluation judgments, and the inspectability of retrieval paths.

## Three things to remember

1. **Technical idea:** A builder prepares a synthetic, hierarchical workspace with paths to source documents before questions arrive; an answerer navigates it later, and training uses downstream answer signals.
2. **Evidence:** The authors report improvements on 50 held-out BrowseComp-Plus tasks, a 443-question synthetic reuse set, and BRIGHT evaluations. Structural and fallback diagnostics add context, but a complete independent rerun is not established.
3. **Adoption boundary:** Costs depend on real reuse, answer-time workspace tokens, static versus changing corpora, and reliable source fallback. Benchmark results do not guarantee production benefit.

## Primary sources

- Singh, Anikait, Teresa Zhang, Yoonho Lee, Roshen Sanjay Nair, Aviral Kumar, and Chelsea Finn. [“Librarian Agents: Training LLMs to Curate Long-Context Workspaces that Anticipate Future Queries,” arXiv:2610.22273v1](https://arxiv.org/html/2610.22273v1), submitted 15 October 2026. See §§2–4, Figures 1–7, Tables 1–7, and Appendices A.1–A.11.
- Authors’ [code and artifact repository](https://github.com/teresaz05/librarian-agents), including [`RESULTS.md`](https://github.com/teresaz05/librarian-agents/blob/main/RESULTS.md), [`REPRODUCING.md`](https://github.com/teresaz05/librarian-agents/blob/main/REPRODUCING.md), [`CHECKPOINTS.md`](https://github.com/teresaz05/librarian-agents/blob/main/CHECKPOINTS.md), and [MIT license](https://github.com/teresaz05/librarian-agents/blob/main/LICENSE).
- Authors’ [project website](https://librarian-agents.github.io/).
