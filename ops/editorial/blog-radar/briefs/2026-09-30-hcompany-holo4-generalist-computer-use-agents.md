---
stableId: "url:https://huggingface.co/blog/Hcompany/holo4"
status: "candidate"
firstSeenAt: 2026-09-30
lastVerifiedAt: 2026-09-30
primaryCategory: "AI Engineering"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 23
decision: "candidate"
---

# Holo4: powering generalist computer-use agents

## Identity

- Search window: 2026-09-27 through 2026-09-30; source dated 2026-09-28.
- Discovery queries: `generalist computer-use agent model GUI MCP API benchmark release 2026`; `open-weight agent model trajectory dataset September 2026`; `site:huggingface.co/blog agent model September 2026`.
- Canonical URL: https://huggingface.co/blog/Hcompany/holo4
- Publisher or author: H Company, through its Hugging Face team account.
- Published or updated date: 2026-09-28.
- Source type: First-party model and engineering announcement.
- Direct supporting sources: [Holo4-27B model card](https://huggingface.co/Hcompany/Holo4-27B); [Holo4-35B-A3B model card](https://huggingface.co/Hcompany/Holo4-35B-A3B); [trajectory dataset](https://huggingface.co/datasets/Hcompany/trajectories); [H Company model collection](https://huggingface.co/collections/Hcompany/holo4).

## Editorial fit

- Why now: Holo4 combines a fresh model release with public weights and benchmark traces, giving readers something concrete to inspect rather than a capability claim alone.
- Reader question: Can one agent model move between screenshots, code execution, MCP, and ordinary APIs—and what does “open” mean when the strongest variant has a non-commercial license?
- Story hook: The company reports 61.7% on OSWorld 2.0 for Holo4-27B versus 30.9% for Holo4-35B-A3B, but the 27B weights are CC BY-NC 4.0 while the lower-scoring 35B-A3B weights are Apache 2.0. The product story therefore has an unusually concrete performance-versus-usage-rights tension.
- Category and topic cluster: AI Engineering; no narrower existing cluster cleanly captures a generalist model plus cross-interface harness.
- Existing coverage and duplication risk: The archive has earlier computer-use and agent readings, including Holo3.1-adjacent material, but no Holo4 release or this model-family/license comparison. Keep the article focused on the interface-unifying design, benchmark caveats, and license split rather than re-explaining computer-use agents.
- Why this remains useful after the current news cycle: Real workflows cross GUI-only legacy software and API-enabled systems. The model/harness boundary, long-horizon context management, and license-aware model selection remain relevant even when benchmark scores change.

## Claim map

- Primary claim: Holo4 is a family of computer-use models designed to select among GUI interaction, code, MCP, and API tools within one agent workflow. H Company says it trained on roughly 10,000 generated tasks across web apps, MCP servers, and desktop environments and rebuilt its harness for runs lasting hundreds of steps.
- Measured evidence: The company reports OSWorld 2.0 scores of 61.7% for Holo4-27B and 30.9% for Holo4-35B-A3B, plus AutomationBench scores of 45.4% and 34.5%, respectively. Its cost plots estimate per-task costs from token counts and H Models API/list prices. These are company-reported evaluations, not independent replications.
- Vendor or author claims requiring qualification: Comparison points mix releases, harnesses, public/private subsets, and pricing assumptions. H Company explicitly notes these differences. Do not mix its separate OSWorld and OSWorld 2.0 figures, or present its cost comparison as an apples-to-apples independent benchmark.
- Bloss0m engineering consequence: Treat the model and harness as one system: screen/tool observations, code execution, memory over hundreds of steps, and action routing all affect measured capability. Evaluate each interface and the combined workflow separately before choosing a model for deployment.

## Evidence audit

- Primary evidence inspected: H Company’s dated Hugging Face article, both model cards, the public trajectory dataset card, and the listed benchmark methodology and caveats.
- Baseline or comparison: Holo4-27B is compared with its Qwen base and closed models on OSWorld 2.0; model and cost figures for other systems come from several public leaderboards, model cards, and vendor runs. AutomationBench results use H Company’s internal harness for Holo4 and public/private-set sources for others.
- Missing evidence: Independent benchmark reruns, unified harness comparisons, a released training recipe, and a working dataset preview. At review time, Hugging Face’s dataset page listed an Apache-2.0 artifact but its full viewer reported a job-manager failure; downloadable availability should be rechecked before attempting reproduction.
- Conflicts or uncertainty: The model cards list Holo4-27B weights as CC BY-NC 4.0 and Holo4-35B-A3B as Apache 2.0. Scores and pricing depend on the variant and benchmark setup; neither model’s reported results establish a general business-task success rate.

## Recommended treatment

- Output level: write-now; durable-post-candidate, not a publication promise.
- Proposed angle: “One agent, four interfaces—but the best-scoring model is not the commercially licensed one.” Explain the model/harness split, long-horizon memory, and how to read the benchmark tables without conflating OSWorld with OSWorld 2.0 or vendor costs with independent TCO.
- Internal routes: Existing computer-use, MCP/tool-use, and agent-evaluation readings; link only after confirming their current bilingual routes during drafting.
- Score rationale: 23/25 (topic 5, durability 4, evidence 4, engineering 5, reader interest 5). First-party model cards, weights, and traces make the architecture inspectable; no independent reproduction and a temporarily broken dataset viewer prevent a higher evidence score. The interface mix and license/performance split provide the concrete reader hook.
- Human decision required: Preserve H Company attribution for all scores and cost estimates; verify trajectory downloads and license terms at writing time; do not call both checkpoints commercially open.
