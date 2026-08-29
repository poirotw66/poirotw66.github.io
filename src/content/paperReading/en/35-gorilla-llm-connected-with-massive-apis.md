---
title: "Gorilla: Turn a Large API Catalog into Retrievable Tools, but APIBench Does Not Establish MCP Product Behavior"
description: "A source-grounded reading of Patil et al., NeurIPS 2024: retriever-aware finetuning of LLaMA-7B on APIBench (TorchHub / TensorHub / HuggingFace) so catalog-scale API calls can be retrieved and checked. Zero-shot overall accuracy and hallucination beat prompted GPT-4 on that table—this is not a ReAct loop, MidTool mid-training, or RAG-MCP product routing."
pubDate: 2026-08-27
updatedDate: 2026-08-27
tldr:
  - "Gorilla changes the control point: over a huge, changing API-documentation catalog, retrieve then call—unlike Toolformer’s next-token insertion for a handful of fixed APIs."
  - "APIBench covers about 1,645 ML-hub APIs. On NeurIPS Table 1, Gorilla zero-shot overall on TorchHub / HuggingFace / TensorFlow Hub is 59.13% / 71.68% / 83.79%, with hallucination 6.98% / 10.95% / 5.40%, versus GPT-4 zero-shot hallucination 36.55% / 37.16% / 78.65% on the same table."
  - "Retriever Aware Training (RAT) lets the model track test-time document changes; a weak retriever at test time can mislead. This is not an agent observation loop and not an MCP product authorization contract."
audience:
  - "AI engineers expanding function calling from a few fixed tools to hundreds or thousands of versioned documents."
  - "Leads who must separate Toolformer, Gorilla, MidTool, and RAG-MCP into a few-API training filter, catalog-scale retrieve-and-call, a mid-training prior, and product schema routing."
tags: ["Paper Reading", "Agent Systems", "Tool Use", "Training"]
image: "/paperReading/35-gorilla-llm-connected-with-massive-apis/title_image.webp"
field: "NLP"
difficulty: "intermediate"
showToc: true
topics:
  - tool-use-coding-agents
  - agent-evaluation-observability
paper:
  title: "Gorilla: Large Language Model Connected with Massive APIs"
  authors:
    - "Shishir G. Patil"
    - "Tianjun Zhang"
    - "Xin Wang"
    - "Joseph E. Gonzalez"
  year: 2024
  venue: "NeurIPS 2024 (arXiv 2305.15334 v1)"
  links:
    pdf: "https://proceedings.neurips.cc/paper_files/paper/2024/file/e4c61f578ff07830f5c37378dd3ecb0d-Paper-Conference.pdf"
    arxiv: "https://arxiv.org/abs/2305.15334"
    doi: "https://doi.org/10.48550/arXiv.2305.15334"
    code: "https://github.com/ShishirPatil/gorilla"
    project: "https://gorilla.cs.berkeley.edu"
series:
  id: "gorilla-llm-connected-with-massive-apis"
  title: "Gorilla Deep Dive"
  part: 1
  totalParts: 1
---

The [Agent foundations reading map](/en/blog/91-agent-method-foundation-reading-map/) shows how this note relates to other tool-use methods. [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/) studies next-token insertion for a small API set; Gorilla handles catalog-scale API calling; [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/) and [RAG-MCP](/en/paper-reading/04-rag-mcp/) later study mid-training and MCP schema routing. Their problem settings are different.

## The paper in 90 seconds

- **Problem:** LLMs writing API calls often hallucinate names, arguments, and usage. The real world is not five fixed tools; it is a huge API catalog whose documentation changes frequently.
- **Core insight:** Treat tool use as **retrieve then call**. Build instruction–API pairs on APIBench with self-instruct, then finetune LLaMA-7B in a retriever-aware way (RAT) so the model learns to read the documentation after `Use this API documentation for reference:` and emit a correct call.
- **Strongest evidence:** NeurIPS Table 1. Gorilla zero-shot overall on TorchHub / HuggingFace / TensorFlow Hub is 59.13% / 71.68% / 83.79%, with hallucination 6.98% / 10.95% / 5.40%. GPT-4 zero-shot on the same table is 38.70% / 19.80% / 18.20% overall and 36.55% / 37.16% / 78.65% hallucination. Figure 6 shows that when documents change at test time, a RAT-trained model changes its call.
- **Main boundary:** The corpus is ML-hub model-card / API JSON, not an arbitrary REST product catalog. Evaluation is single-call AST subtree matching, not a multi-step agent loop. A weak retriever can hurt (Table 2). Do not write APIBench numbers into MidTool or RAG-MCP.

My conclusion: **Gorilla's lasting contribution is to frame catalog-scale tool use as a retrieve-and-call problem and make retrieved documentation visible during training. APIBench is not an MCP product specification, and scores from later methods do not belong in this table.**

> **Huahua in one sentence**
>
> Once tools multiply, the question stops being “can you insert one API” and becomes “the documentation shelf is huge—can you find the right page, and will you refuse to invent one?”

## Version and reading scope

This article uses the [Patil et al., NeurIPS 2024](https://proceedings.neurips.cc/paper_files/paper/2024/hash/e4c61f578ff07830f5c37378dd3ecb0d-Abstract-Conference.html) camera-ready PDF for numbers and table indices, and cross-checks [arXiv:2305.15334 v1](https://arxiv.org/abs/2305.15334). The version was first posted on 2023-05-24 and, as of 2026-08-27, remains the only arXiv version.

Author order follows the PDF: Shishir G. Patil, Tianjun Zhang (equal contribution), Xin Wang (Microsoft Research), and Joseph E. Gonzalez (UC Berkeley). The NeurIPS abstract names the method **Retriever Aware Training (RAT)**. Tables 1–2 match arXiv v1; the camera-ready adds AST-versus-human checks (Table 3), renumbers constraint-aware calls to Table 4, and adds the Gorilla 0-shot versus GPT 3-shot comparison in Table 5.

Beyond the abstract, I checked APIBench / Gorilla / AST in Section 3, Tables 1–5 and Figures 5–6 in Section 4, Appendix A data and hyperparameters, and artifacts as of **2026-08-27**. Internal links only point to notes that already exist: [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/), [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/), [RAG-MCP](/en/paper-reading/04-rag-mcp/), and [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/). This article does not invent HuggingGPT or AutoGPT notes.

This is a published NeurIPS paper; the arXiv snapshot remains the v1 preprint form.

## The question a reader should actually answer

When tools grow from “calculator + search + translation” into “thousands of TorchHub / TensorHub / HuggingFace APIs whose docs change,” should engineering keep stuffing documents into prompts, or should **retrieved documentation** become part of the finetuning contract? Patil et al. answer by building APIBench and using RAT so LLaMA-7B sees documents in both training and inference. Evaluation uses AST subtree matching to separate hallucination from selecting a wrong but real API.

The precise reading is not “is Gorilla forever stronger than GPT-4.” The real question is: **on catalog-scale API calling, which overall / hallucination cells move when retriever-aware finetuning is compared with prompted closed models, and where does the claim stop because of retriever quality, the single-call contract, or the ML-hub corpus?**

## Evidence map

| Layer | Wording used in this article |
| --- | --- |
| **Paper directly supports** | Figure 3 describes self-instruct plus retrieval training / inference; Table 1 reports overall / hallu / err for three hubs and four retrieval settings; Table 2 contrasts finetuning without a retriever versus with an Oracle retriever; Table 3 reports AST and human accuracy 0.78 and executable rate 0.72; Figure 6 shows test-time document change; hyperparameters include lr $2\times10^{-5}$, batch 64, and 5 epochs. |
| **Author claims** | Catalog-scale API calling needs systematic data and evaluation; RAT can reduce hallucination and adapt to document updates; within this scope, finetuning can beat GPT-4 used only as a prompt. |
| **Not established** | ReAct-style multi-step thought–action–observation; MidTool’s mid-training mixture; RAG-MCP / MCP product permissions and routing SLAs; external validity to arbitrary REST / billed APIs; that a weak retriever never hurts. |
| **Bloss0m engineering judgment** | Gorilla moves tool use to catalog scale; the key question is whether documentation enters both training and inference. MidTool asks when to teach affordances, while RAG-MCP narrows candidates when product schemas become too numerous. Their numbers are not interchangeable. |

Later sections keep numbers, author claims, and engineering judgment apart. “Beats GPT-4” means only the APIBench holdout cell on Table 1 at writing time.

## Why the previous approach is insufficient

Sections 1–2 draw two 2023-era lines clearly.

**A handful of hand-coded tools plus prompting.** Toolformer, browsers, calculators, and Python interpreters showed that LLMs can call tools, but usually assumed a small tool set whose docs fit in the prompt. Once tools become a **changing cloud API catalog**, stuffing the whole library into the prompt stops working, and hallucinated names and arguments become the main failure mode.

**Prompting demos without a systematic evaluation and training pipeline.** Many contemporaneous demos showed “let the model call an API” without scalable data collection, a holdout evaluation, or a way to put retrieved documents into finetuning. The authors also separate general program synthesis from **linear, checkable API calls**: the latter behaves more like tool use and is easier to score for functional equivalence against a dataset with AST matching.

So the prior approach is insufficient not because “nobody thought of tools,” but because the **control point stopped at few-API or pure prompting**: either the tool set was tiny, or document retrieval was never a training-visible signal. Gorilla changes the retrieve-and-call contract at catalog scale.

## Core intuition

Ignore the tables for a moment. Picture two ways of teaching tools.

[Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/) is five pens in a pocket: ask whether inserting one QA or calculator call makes the next tokens easier to predict. Gorilla is a library whose shelves get rearranged: the question becomes “find the right documentation page, then emit the call that page supports; if the page changes, the call must change.” If training never shows `Use this API documentation for reference: …`, suddenly pasting a document at test time can look like noise—or actively mislead. Table 2 is the quantitative version of that story.

Contrast three next steps that are easy to conflate:

- **Toolformer (note 25):** whether next-token prediction should insert one API call; few tools; a loss filter decides what to keep.
- **Gorilla (this note):** which document to retrieve from a catalog, then emit a call checkable by AST; training may be zero-shot or RAT.
- **MidTool / RAG-MCP (later methods):** MidTool moves affordances earlier into mid-training; RAG-MCP shrinks MCP schema candidates on the product surface. Their numbers do not belong in APIBench.

> **Huahua's engineering note**
>
> The paper itself says adding retrieval does **not** always help. Zero-shot finetuning can be strong in this scope; forcing BM25 or a weak retriever at test time can drop overall and raise error. Ask first whether training saw retrieved documents, then whether the test-time retriever is good enough.

## Walk one example through the method

The following walks the teaching examples in Figures 3 and 6. It is not an independent experimental score.

1. **Input:** A natural-language user request, for example “convert spoken language in a recording to text,” or “automatically remove the background from an input image.” There is no agent state and no multi-turn observation.
2. **Intermediate representation:** Each API in the database is a JSON object (domain, framework, api_call, arguments, example_code, performance, description, and related fields). If retrieval is on, BM25 / GPT-Index / Oracle returns the top-1 document; the user prompt is followed by `Use this API documentation for reference: <retrieved_API_doc_JSON>`.
3. **Model or system decision:** Gorilla (instruction-finetuned LLaMA-7B) reads the prompt (and optional document) and emits a structured API call. Under RAT, the documentation field already appears in training dialogues, so the model is taught that the second half of the question is there to answer the first half. In Figure 6, the same “remove background” request yields different calls when retrieval points at `fcn_resnet101` or at an NVIDIA-registry `fcn_resnet50`.
4. **Output:** A single API-call string (often with domain / provider / explanation). At evaluation time the candidate becomes an AST and is checked for a subtree match against the dataset (Figure 4): a match counts as correct; no dataset match counts as hallucination; a match to the wrong API counts as error.
5. **Likely failure point:** A wrong retrieved document can mislead a model trained without retrieval (Table 2, BM25 columns on the left). Constraint prompts (parameter count / accuracy floors) lower overall (Table 4). HuggingFace is not exhaustive, so for non-Gorilla models the authors fall back to a looser domain multiple-choice check—read that footnote before treating cross-model cells as equally strict.

This example teaches **how the mechanism runs end to end**. For the three-hub headline table, return to Table 1; for whether retrieval helps or hurts, use Table 2; for test-time document edits, use Figure 6.

## Technical mechanism

**APIBench data.** The authors collect APIs from Torch Hub, TensorFlow Hub v2, and HuggingFace model cards into JSON fields meant to generalize toward REST-like records. Figure 3 / the main text state **1,645** APIs (Torch Hub exhaustive, TensorFlow Hub v2 exhaustive, HuggingFace top-20 per domain). Appendix A.1 separately lists Torch / Tensor / HF as 95 / 696 / 925, which does not sum to 1,645—an internal inconsistency. This article follows Figure 3’s 1,645 and “10 instructions per API” narrative, and treats the appendix split as a boundary note.

**Self-instruct.** Six hand-written instruction–API demonstrations per hub (18 human examples total) seed GPT-4 to generate 10 instructions per API (about **16,450** `{instruction, API}` pairs), then split into train and holdout test. Instructions are told not to leak API names.

**Gorilla finetuning.** Pairs become single-turn user–agent chats; LLaMA-7B receives standard instruction finetuning. Two training variants:

- **Without retrieval:** only the user instruction.
- **RAT (with retrieval):** the user message appends the reference document string, forcing the model to parse documentation to answer the task.

Inference supports the same zero-shot and retrieval modes; beyond concatenating the document there is no further prompt tuning. The authors mention an execution system, but it is **not the focus of the paper**.

**AST subtree matching.** Because many models can solve the same task, unit tests struggle to decide which API is “right.” Candidates become ASTs and are checked for a subtree match against a dataset API (optional arguments such as `pretrained=True` allowed). Hallucination means no dataset API matches; error means the wrong API matches. NeurIPS Table 3: on 100 sampled Gorilla generations, AST accuracy is 0.78 and matches human evaluation; with supporting install / setup code, human-executable rate is 0.72.

Operational constraints:

- **Retrievers:** zero-shot / BM25 / GPT-Index (`text-davinci-003`) / Oracle; each API is one indexed document; top-1 is used.
- **Baselines:** GPT-4 `gpt-4-0314`, GPT-3.5 `gpt-3.5-turbo-0301`, Claude `claude-v1`, LLaMA-7B.
- **Training hyperparameters (appendix):** lr $2\times10^{-5}$, batch 64, 5 epochs, warmup ratio 0.03, max sequence length 2048.

![Gorilla paper Figure 1: under the same speech-to-text prompt, GPT-4 hallucinates a nonexistent model, Claude picks the wrong library, and Gorilla emits a usable call.](/paperReading/35-gorilla-llm-connected-with-massive-apis/paper/figure-1-api-call-examples.webp)

*Original Figure 1, paper Introduction: closed-model prompting versus Gorilla API calls. Locatable at [ar5iv Figure 1](https://ar5iv.labs.arxiv.org/html/2305.15334#S1.F1) (asset [code-examples.png](https://ar5iv.labs.arxiv.org/html/2305.15334/assets/code-examples.png)). Taken from the arXiv / ar5iv sources; the arXiv page marks the perpetual non-exclusive license. This article cites it for teaching under the [arXiv reuse terms](https://info.arxiv.org/help/license/index.html); the NeurIPS proceedings version is also under conference publication terms.*

![Gorilla paper Figure 3: upper half shows self-instruct and API-database training; lower half shows zero-shot or retrieval-augmented inference.](/paperReading/35-gorilla-llm-connected-with-massive-apis/paper/figure-3-system-overview.webp)

*Original Figure 3, paper Section 3: Gorilla system overview and APIBench construction. See [ar5iv Figure 3](https://ar5iv.labs.arxiv.org/html/2305.15334#S3.F3) (asset [llmapi.png](https://ar5iv.labs.arxiv.org/html/2305.15334/assets/llmapi.png)). License note as above.*

![Gorilla paper Figure 4: build an AST for a candidate API and match a dataset subtree to decide correct versus hallucinated.](/paperReading/35-gorilla-llm-connected-with-massive-apis/paper/figure-4-ast-subtree-matching.webp)

*Original Figure 4, paper Section 3.3: AST subtree-matching evaluation. See [ar5iv Figure 4](https://ar5iv.labs.arxiv.org/html/2305.15334#S3.F4) (asset [ast.png](https://ar5iv.labs.arxiv.org/html/2305.15334/assets/ast.png)). License note as above.*

## How to read the evidence

### Table 1: catalog-scale accuracy and hallucination

1. **Question:** On holdout instructions, can each LLM emit an AST-checkable correct API under 0-shot / BM25 / GPT-Index / Oracle, and how do hallucination and wrong-API error split?
2. **Controls:** Same APIBench split; fixed baseline checkpoints; when retrieving, top-1 documents are concatenated with the same reference phrase.
3. **Observation:** Gorilla (0-shot) overall 59.13 / 71.68 / 83.79 with hallu 6.98 / 10.95 / 5.40. GPT-4 (0-shot) overall 38.70 / 19.80 / 18.20 with hallu 36.55 / 37.16 / 78.65. The authors state Gorilla zero-shot is about 20.43 points better than GPT-4, about 10.75 better than ChatGPT, and up to about 83 better than LLaMA (their wording follows the table contrasts). Under GPT-Index, Gorilla reaches TorchHub 61.82 (hallu 0), HuggingFace 47.46, and TensorFlow Hub 64.96.
4. **Plausible mechanism:** Finetuning aimed at API calls aligns better with the AST contract than a general chat model; without documents present, Gorilla can still call from finetuned memory, so zero-shot is strong.
5. **Not established:** A production REST gateway; multi-step tools; treating HuggingFace baseline rows that only check domains as equally strict as Gorilla’s full AST check.

![Gorilla paper Figure 5: bar chart of accuracy on three hubs under the GPT-Index retriever.](/paperReading/35-gorilla-llm-connected-with-massive-apis/paper/figure-5-gpt-retriever-accuracy.webp)

*Original Figure 5, paper Section 4.1: accuracy with the GPT retriever. See [ar5iv Figure 5](https://ar5iv.labs.arxiv.org/html/2305.15334#S4.F5) (asset [grid_bars_GPT_Retrieval.svg](https://ar5iv.labs.arxiv.org/html/2305.15334/assets/grid_bars_GPT_Retrieval.svg)). License note as above.*

### Table 2: when the retriever helps or hurts

1. **Question:** How does finetuning with versus without an Oracle retriever change test-time 0-shot / BM25 / GPT-Index / Oracle overall and hallucination?
2. **Controls:** Same Gorilla backbone; left columns finetuned without retrieval; right columns finetuned with Oracle retrieval.
3. **Observation:** Zero-shot after no-retriever finetuning is already 59.13 / 71.68 / 83.79, but test-time BM25 falls to 37.63 / 11.28 / 34.30. Oracle finetuning collapses test-time zero-shot to 0 (hallu near 100) because the model expects a document; giving Oracle at test time raises overall to 67.20 / 91.26 / 94.16, with TorchHub hallu at 0.
4. **Plausible mechanism:** The training distribution decides what the model depends on; the retrieval contract must match between train and test, or a weak retriever misleads.
5. **Not established:** “Always retrieve” or “never retrieve”; only a conditional recommendation on this data and these retrievers.

### Figure 6 and Tables 4–5: test-time change, constraints, prompting contrast

![Gorilla paper Figure 6: under the same background-removal instruction, Gorilla’s output tracks retrieval updates to ResNet-101 or a different registry.](/paperReading/35-gorilla-llm-connected-with-massive-apis/paper/figure-6-test-time-doc-change.webp)

*Original Figure 6, paper Section 4.2: retriever-aware training adapting to test-time documentation changes. See [ar5iv Figure 6](https://ar5iv.labs.arxiv.org/html/2305.15334#S4.F6). This asset is a teaching crop from the NeurIPS PDF page; if the crop edge is rough, prefer the PDF or HTML original. License boundary as above.*

Figure 6 is a mechanism illustration, not a score table: when documents upgrade or registries move, the RAT model retargets the call. Table 4 (constraint-aware; Table 3 in the older arXiv draft) uses the TorchHub subset with at least one accuracy field (~65.26% of that hub). Overall drops for every model; Gorilla 0-shot accuracy-const is 47.88, and 67.60 with Oracle. Table 5 compares Gorilla 0-shot with GPT 3-shot in-context prompting; some cells do not match Table 1’s 0-shot baselines exactly, so treat Table 5 as a “can prompting replace finetuning?” supplement rather than a replacement for Table 1.

The authors also note that GPT-3.5 often hallucinates less than GPT-4 across settings and speculate that RLHF relates to truthfulness—that is author interpretation, not a causal experiment.

## Ablations and what actually drives the result

The headline is not “another 7B chat model.” Three ingredients stack:

1. **The task is narrowed to a checkable single API call** (AST), not general program synthesis.
2. **Data covers catalog scale** (APIBench + self-instruct), so finetuning sees many hub APIs.
3. **RAT makes documentation first-class**; Table 2 shows that retriever quality and train/test consistency decide whether retrieval helps or hurts.

The negative side matters too: BM25 often raises error; Oracle finetuning cannot be used with zero documents. Engineering-wise this is the closed-book expert versus open-book librarian contract.

## Limitations, threats to validity, and unsupported readings

- **Corpus boundary:** Evidence is on ML model hubs; REST cost / latency examples are motivation, not the main evaluation arena.
- **Single call:** Method and evaluation do not cover ReAct-style multi-step observation.
- **Evaluation approximation:** AST matches humans on 100 samples, but that is not the same as every generation running in a real dependency / GPU stack; executable 0.72 includes supporting-code failures.
- **Asymmetric baselines:** When HuggingFace is non-exhaustive, non-Gorilla models are scored with a looser domain check.
- **Statistics:** The paper checklist states LLM experiments were run once for cost reasons, with no error bars.
- **Do not conclude:** APIBench ≠ MCP product; Gorilla ≠ MidTool; retrieval success ≠ authorization success; later BFCL / OpenFunctions product numbers must not be written back into Table 1.

## Engineering decision and when not to use it

When is Gorilla worth borrowing? When the pain is **“too many versioned tools / docs, and the model hallucinates endpoints,”** and you can accept a versioned API registry, top-k documents, AST or schema validation, and a retrieval contract that matches train and test. A fitting prototype is a single-call assistant over an internal SDK, model hub, or OpenAPI catalog.

When should you not treat this paper as a construction blueprint?

- For thought–action–observation multi-step loops, read [ReAct](/en/paper-reading/24-react-interleaved-reasoning-acting/).
- For a handful of fixed APIs where the question is whether a call reduces future-token loss, read [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/).
- To build tool affordances and executable trajectories earlier in mid-training, read [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/).
- When candidates are MCP schemas and you need product routing plus permissions, read [RAG-MCP](/en/paper-reading/04-rag-mcp/). Retrieval is still not authorization.

> **Huahua's judgment**
>
> Decide whether you want a closed-book expert or an open-book librarian before you adopt RAT. Do not ship a weak retriever and then blame the model for “not knowing how to use tools.”

## Artifacts and reproducibility

Direct endpoint status as of **2026-08-27**:

- **Paper:** [arXiv abs](https://arxiv.org/abs/2305.15334), [v1 PDF](https://arxiv.org/pdf/2305.15334v1), and [ar5iv HTML](https://ar5iv.labs.arxiv.org/html/2305.15334) are readable; the [NeurIPS 2024 PDF](https://proceedings.neurips.cc/paper_files/paper/2024/file/e4c61f578ff07830f5c37378dd3ecb0d-Paper-Conference.pdf) is readable. arXiv marks the perpetual non-exclusive license; the authors’ checklist states code / data / models are released under **Apache 2.0**.
- **Project page:** [gorilla.cs.berkeley.edu](https://gorilla.cs.berkeley.edu) loads.
- **Code / data:** [ShishirPatil/gorilla](https://github.com/ShishirPatil/gorilla) loads (Apache-2.0); `data/apibench` and related directories are present. The repository later also hosts BFCL and related projects; their leaderboard scores do not belong in this paper's Table 1.
- **Models:** Public `gorilla-llm/*` model cards appear in the Hugging Face API listing; some model HTML pages returned 401 in this environment, so weight download paths are marked **usable / re-check in a browser**, and this article does not claim a Table 1 rerun.
- **Smallest useful reproduction:** Take one JSON record from `data/apibench`, write prompts with and without `Use this API documentation for reference:`, compare whether the call changes, and check dataset membership with AST or string matching. That does not reproduce all of Table 1.

## Three things to remember

1. **Technical idea:** Catalog-scale tool use is **retrieve then call**; RAT makes API documentation visible during training, not only as a test-time paste.
2. **Evidence:** On Table 1, Gorilla 0-shot beats same-table GPT-4 0-shot with higher overall and lower hallucination across three hubs; Table 2 shows weak retrieval can hurt while Oracle + RAT raises the ceiling; Figure 6 shows test-time document edits.
3. **Boundary:** APIBench is an ML-hub single-call evaluation, not a ReAct runtime, MidTool, or MCP product specification. What transfers is “keep documentation consistent between train and test”; what does not transfer is treating 59.13 / 71.68 / 83.79 as today's SLA for an arbitrary tool gateway.

## Further reading

Gorilla asks how to retrieve and call over a large API catalog. If the next question is few-API next-token loss filtering, read [Toolformer](/en/paper-reading/25-toolformer-self-supervised-api-calls/); for a mid-training prior, read [MidTool](/en/paper-reading/23-midtool-agentic-tool-use/); for MCP schema blow-ups, read [RAG-MCP](/en/paper-reading/04-rag-mcp/); for spine placement, see the [reading map](/en/blog/91-agent-method-foundation-reading-map/).

## Primary sources

- [Patil et al., “Gorilla: Large Language Model Connected with Massive APIs,” NeurIPS 2024](https://proceedings.neurips.cc/paper_files/paper/2024/hash/e4c61f578ff07830f5c37378dd3ecb0d-Abstract-Conference.html)
- [arXiv:2305.15334 v1](https://arxiv.org/abs/2305.15334)
- [NeurIPS 2024 PDF](https://proceedings.neurips.cc/paper_files/paper/2024/file/e4c61f578ff07830f5c37378dd3ecb0d-Paper-Conference.pdf)
- [Project page](https://gorilla.cs.berkeley.edu)
- [GitHub: ShishirPatil/gorilla](https://github.com/ShishirPatil/gorilla)
- [arXiv.org perpetual non-exclusive license](https://info.arxiv.org/help/license/index.html)
