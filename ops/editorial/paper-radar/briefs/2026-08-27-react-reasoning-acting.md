---
stableId: "arxiv:2210.03629"
sourceVersion: "v3"
status: "published"
firstSeenAt: 2026-08-27
lastVerifiedAt: 2026-08-27
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "published"
---

# ReAct: Synergizing Reasoning and Acting in Language Models

## Identity

- Stable ID: `arxiv:2210.03629`.
- Canonical URL: https://arxiv.org/abs/2210.03629
- Authors: Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, and Yuan Cao.
- Venue or review status: ICLR 2023; arXiv v3 PDF and HTML; OpenReview forum `WE_vluYUL-X`.
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI `10.48550/arXiv.2210.03629`; OpenReview `WE_vluYUL-X`.
- Code / model / data: Project page https://react-lm.github.io/ and GPT-3 prompting repository https://github.com/ysymyth/ReAct (MIT). Prompts and `wikienv.py` are reachable. PaLM checkpoints are not generally available.

## Editorial fit

- Reader question: Should LLM reasoning and acting stay as separate systems, or can a thought that does not touch the environment be added to the action space so the same trajectory can plan, retrieve, and act?
- Why this belongs in the selected track: ReAct is the source paradigm behind many later “ReAct agent” runtimes, and it is the right place to separate an auditable thought–action–observation contract from a few-shot Wikipedia loop.
- Gap it fills: Tool-use reliability at the control-point layer: when a model may think versus when it may call an environment, and what a weak three-action API actually measures.
- Why now: Later Bloss0m readings (RAG-MCP, MidTool, Read-Gate, Argus) assume a thought–action loop already exists. This classic ICLR paper is the missing method note that those later papers inherit.

## Claim map

- Problem: Chain-of-thought is ungrounded; act-only methods do not keep a verbal working memory for planning and exceptions.
- Main claim: Interleaving free-form thoughts with environment actions improves groundedness and, on ALFWorld and WebShop, few-shot success versus imitation / RL baselines; on HotpotQA the best prompting numbers are ReAct↔CoT-SC switches, not pure ReAct.
- Method: Expand $\hat{\mathcal{A}}=\mathcal{A}\cup\mathcal{L}$; thoughts update context only; HotpotQA / FEVER use a search / lookup / finish Wikipedia API; ALFWorld and WebShop use sparse thoughts.
- What is genuinely new: Treating language thought as a first-class action that does not emit an environment observation, then measuring that choice against reason-only and act-only ablations on both knowledge and interactive tasks.

## Evidence audit

- Datasets: HotpotQA and FEVER in a question-only setup; ALFWorld 134 unseen games; WebShop 500 test instructions over 1.18M products.
- Benchmarks and metrics: HotpotQA EM and FEVER accuracy with PaLM-540B; ALFWorld success rate; WebShop score and success rate.
- Baselines: Standard, CoT, CoT-SC, Act, ReAct, ReAct↔CoT-SC switches, supervised SoTA, BUTLER, IL, IL+RL, and an Inner Monologue-style ReAct-IM ablation.
- Ablations: stripping thoughts or environment from the same traces; ReAct-IM dense external-feedback thoughts; prompt permutations on ALFWorld; 3,000-trace finetuning of PaLM-8B / 62B.
- Statistical uncertainty: Main prompting results are greedy point estimates; CoT-SC uses 21 samples at temperature 0.7; ALFWorld reports avg and best-of-6; human labels cover 200 HotpotQA traces.
- Threats to validity: intentionally weak Wikipedia API; mismatched ALFWorld trial budgets versus BUTLER; PaLM not generally reproducible; GitHub 500-example GPT-3 table is not Table 1.

## Reproducibility

- Available artifacts and licenses: arXiv v3 HTML / PDF under CC BY 4.0; GitHub MIT prompting code, notebooks, and prompt JSON; live Wikipedia via `wikienv.py`.
- Environment or compute requirements: PaLM-540B for the main tables; GPT-3 text-davinci-002 for the public notebooks; ALFWorld and WebShop installs for the interactive tasks.
- Smallest useful reproduction: run the public HotpotQA notebook prompts against a handful of questions and check that thoughts do not mutate wiki state.
- Blocking unknowns: PaLM weights, the exact 3,000 finetuning traces, and a frozen Wikipedia dump matching 2023 pages.

## Critical reading

- Strongest result: Table 2’s hallucination split (CoT 56% vs ReAct 0%) plus ALFWorld / WebShop gains over act-only and the paper’s IL / RL baselines, with the abstract percentages traced to those tables rather than Table 1.
- Weakest assumption: A few-shot loop on a three-action Wikipedia API, or one-shot WebShop clicks, is informative enough to name a general agent recipe.
- Stated limitations: in-context length, limited thought / action support under prompting, and the need for more human traces if finetuning.
- Claims not supported by the evidence: production superiority, enterprise tool safety, or treating 35.1 / 64.6 as pure ReAct.

## Bloss0m connection

- Related Traditional Chinese routes: `04-RAG-MCP`; `15-before-reasoning-fails`; `10-argus-agentic-runtime`; `23-midtool-agentic-tool-use`.
- Related English routes: paired English routes for the same entries.
- Duplication risk: Low. No existing Bloss0m paper-reading covers this ICLR 2023 method; later notes inherit the loop without teaching it.
- Suggested internal links: tool-schema routing, evidence-before-answer discipline, runtime control planes, and tool-use mid-training.

## Recommendation

- Output level: Deep Read.
- Score rationale: Landmark method, four-benchmark evidence, honest HotpotQA negative, and still-reachable prompts justify publication; PaLM non-reproducibility is recorded rather than hidden.
- Open questions requiring human approval: none for this approved publication request; keep Table 1 versus abstract arithmetic explicit.
