---
stableId: "arxiv:2609.02885"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-03
lastVerifiedAt: 2026-09-03
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
decision: "deep-read-candidate"
---

# Discriminative World Models：Web Agent 不只要預測下一頁，更要分辨哪個 action 會帶來哪個結果

## Identity

- Search window: strict 72-hour scan from 2026-08-31 00:32Z to 2026-09-03 00:32Z.
- Canonical URL: https://arxiv.org/abs/2609.02885
- Authors: Kelvin Li, Dhruv Pendharkar, Anish Pahilajani, Chuyi Shang, Leon Oks, Leonid Karlinsky, Rogerio Feris, Trevor Darrell, and Roei Herzig; affiliations include UC Berkeley, MIT-IBM Watson AI Lab, Cal Poly, and Xero.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-02; CC BY 4.0 HTML version available.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.02885
- Project page: https://dhruvpendharkar.github.io/dwm/. A public code repository or checkpoint was not located in the verified primary sources.

## Editorial fit

- Reader question: If a Web Agent can imagine five next actions, what should its world model predict so a ranker can tell those actions apart?
- Why this belongs in the selected track: It changes world-model training from reproducing a fixed HTML, AXTree, or prose target into preserving action-relevant differences for downstream ranking.
- Gap it fills: Tool-use reliability—choosing among competing actions before executing a costly or irreversible browser step.
- Why now: The paper connects a representation-level objective to held-out matching, PRM ranking, and end-to-end WebArena-Lite success rather than stopping at a prettier predicted state.

## Claim map

- Problem: Supervised next-state prediction may generate a plausible state representation while hiding the difference between the queried action and alternative actions from the same browser state.
- Main claim: Predicted-state matching trains a representation to distinguish the true outcome of a queried action from alternative outcomes, producing a more useful input for action ranking.
- Method: Merge repeated WebArena Go-Browse states into branching decision points, create pairwise queried-versus-alternative examples, train a world model with a matching judge, and feed predicted states to trained or frozen PRMs.
- What is genuinely new: The target is not a canonical state string; it is a representation that retains the distinctions needed by a downstream decision-maker.

## Evidence audit

- Data and tasks: 7,730 branching decision points from 2,839 Go-Browse trajectories yield 30,920 pairwise examples across Shopping, CMS, Reddit, GitLab, and Map domains.
- Metrics and baselines: The held-out matching benchmark compares GPT-4o, GPT-4o-mini, Qwen3 models, WebDreamer-7B, WebWorld-8B, and a data-matched AXTree SFT baseline. The proposed model reaches 80.80% overall matching accuracy versus 74.51% for WebDreamer-7B and 70.17% for WebWorld-8B under the primary Qwen3-32B judge.
- Downstream evidence: With a fixed GPT-4o policy on WebArena-Lite, ReAct reaches 13.94% success, Best-of-5 reaches 21.82%, and Best-of-5 plus predicted-state matching reaches 28.48%. Frozen-ranker experiments also show the predicted states outperform the supervised-state baseline.
- Controls: Matching-judge robustness uses GPT-4o and Llama-3.1-70B; the ranking setup holds task context and candidate actions fixed while changing the state representation.
- Statistical uncertainty: The reported results are point estimates; the paper does not present a broad independent replication or confidence interval protocol for the main cells.
- Threats to validity: Branches come from repeated states in Go-Browse and do not enumerate all possible actions. The judge is still an LLM proxy, the end-to-end policy is GPT-4o, and all environments are benchmarked rather than live websites.

## Reproducibility

- Available artifacts: Full HTML paper, project page, detailed prompts, training settings, dataset construction, baselines, and evaluation protocol. A complete public code/checkpoint artifact was not found in the verified source set.
- Environment or compute requirements: Reconstructing the branching data requires WebArena/Go-Browse assets and multiple model families; end-to-end reproduction needs a WebArena-Lite environment and a GPT-4o-equivalent policy.
- Smallest useful reproduction: Rebuild a small set of repeated browser states, train or prompt a world model with pairwise matching, compare fixed-format versus discriminative representations under the same judge, then run a five-action ranker on held-out tasks.
- Blocking unknowns: Public checkpoint availability, exact dataset release terms, random seeds, model training budget, and transfer beyond the five WebArena domains.

## Critical reading

- Strongest result: The paper measures the proposed representation at three layers—matching, action ranking, and end-to-end success—so the objective is tied to a concrete tool-use decision.
- Weakest assumption: A language-model judge can reliably decide whether a textual representation captures the correct browser outcome; better judge agreement is not the same as real-world action safety.
- Unsupported leap: The results do not show robustness to live web drift, authentication, hidden state, side effects, or adversarial page content.

## Bloss0m connection

- Related routes: Web agents, tool-use reliability, world models, process reward models, and agent evaluation.
- Duplication risk: Medium with existing web-agent candidates, but the discriminative objective and action-branching data are distinct from generic browser-agent benchmarks.
- Suggested internal links: Pair with the existing tool-use papers and the trace-state paper; contrast predicted-state matching with fixed schema/provenance views that preserve facts for a different consumer.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: direct tool-selection consequence, a clean objective mismatch, three evaluation layers, judge robustness, and rich method detail. Reproducibility is 3/5 because the project page is public but a complete code/checkpoint artifact was not verified.
- Open questions requiring human approval: Can independent teams reproduce the 28.48% end-to-end gain? What safety filter is required before using imagined states to select real browser actions?

