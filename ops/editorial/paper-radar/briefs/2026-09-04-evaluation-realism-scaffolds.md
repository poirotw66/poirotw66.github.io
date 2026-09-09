---
stableId: "arxiv:2609.02302"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-04
lastVerifiedAt: 2026-09-04
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 5
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 4
  total: 28
decision: "deep-read-candidate"
---

# Improving Evaluation Realism：讓 Agent 安全評估更像真的部署，而不是一眼就被模型識破的考試

## Identity

- Search window: strict 72-hour scan from 2026-09-01 00:30Z to 2026-09-04 00:30Z.
- Canonical URL: https://arxiv.org/abs/2609.02302
- Authors: Axel Ahlqvist, Richard Guan, Juan-Pablo Rivera, Adeline Kassler, Dmitrii Troitskii, Alexandra Souly, Kai Fronsdal, Robert Kirk, and John Hughes; affiliations include the Meridian Visiting Researcher Programme, Cambridge Boston Alignment Initiative, UK AI Security Institute, Meridian Labs, and Anthropic.
- Venue or review status: arXiv preprint, v1 submitted 2026-09-02; 70 pages; under review at NeurIPS 2026; CC BY 4.0 HTML version available.
- DOI / aliases: https://doi.org/10.48550/arXiv.2609.02302
- Artifacts: https://github.com/AxelAhlqvist1995/petri-bon, https://github.com/meridianlabs-ai/petri_dish, and https://github.com/AxelAhlqvist1995/petri-realism-reproduction.

## Editorial fit

- Reader question: If an alignment audit is obviously synthetic to the target model, what engineering changes make the audit transcript resemble a real deployment without throwing away the behavior we want to test?
- Why this belongs in the selected track: The paper treats evaluation realism as a systems problem spanning the simulator, the target's agent harness, model calls, judges, and deployment traces.
- Gap it fills: Agent evaluation—closing the gap between benchmark harness behavior and the environment in which an agent will actually run.
- Why now: Safety and red-team results increasingly influence release decisions, yet evaluation-aware models can behave differently when they recognize an audit. This work turns that concern into two inspectable interventions with compute-matched controls.

## Claim map

- Problem: In Petri-style audits, an auditor model simulates tools and the target can detect that the interaction is an evaluation, weakening conclusions about deployment behavior.
- Main claim: Critique refinement and DISH make simulated audits harder to distinguish from deployment transcripts; the methods compose and use additional inference-time compute more effectively than simply making audits longer.
- Method: Critique refinement generates, critiques, refines, and pairwise-selects deployment-like simulator actions. DISH wraps the target in a real coding-agent harness so system prompts, tool definitions, reminders, and context injection match deployment.
- What is genuinely new: The paper separates two realism surfaces—what the auditor writes and what the target environment exposes—and measures them together rather than treating the audit prompt as the whole deployment.

## Evidence audit

- Baseline and setup: The authors modify Petri to single-branch, 30-turn audits, use 149 compatible seed instructions and sample 50 for scaling experiments. Sonnet 4.6 is the default auditor with a 10,000-token extended-thinking budget; target and judge configurations are documented in the paper.
- Critique-refinement result: On Sonnet 4.6, four parallel loops with two critique-refine iterations per turn raise realism win rate from 10% to 26%. Reported increases also occur for Opus 4.8 (2% to 6%), GPT-5.5 (1% to 6%), and Gemini 3.5 Flash (8% to 14%).
- Harness result: In coding settings, DISH raises realism win rate from 9% to 21% on Sonnet 4.6, 1% to 2% on Opus 4.7, 2% to 3% on Opus 4.8, 0.1% to 3% on GPT-5.5, and 1% to 3% on Gemini 3.5 Flash. Combining both methods gives a further 13 percentage-point increase over DISH alone on Sonnet 4.6 and improves over both single-method conditions on the other tested targets.
- Compute-matched control: A multibranch baseline spends a similar budget by extending the audit from 30 to 235 turns, producing a median of 8 or 9 branches. On Sonnet 4.6, the most concerning branch reaches 0.42 versus 0.35 for critique refinement, but has only an 18% realism win rate versus 28% for critique refinement.
- Measurement controls: The study uses eval-awareness, concerning-behavior, and seed-adherence measures; it manually annotates 65 transcripts to choose judge configurations and compares audit transcripts with 20 WildChat deployment transcripts plus 50 safety-research Claude Code transcripts.
- Statistical uncertainty: Main comparisons include 95% Wald or Wilson intervals, but the core realism measure is still a model-judged pairwise preference, not a direct human or production outcome. Judge refusals are dropped symmetrically across compared methods.
- Threats to validity: The target may expose different reasoning traces across models, the audit seeds are filtered and sampled, the deployment transcript sets are small and curated, and the result does not establish that a more realistic audit preserves every kind of concerning behavior under live tool side effects or distribution shift.

## Reproducibility

- Available artifacts: Full HTML paper, Petri-bon critique-refinement package, Petri DISH harness, reproduction repository, prompts, appendices, cost analysis, and deployment transcript documentation are linked from the primary source.
- Environment or compute requirements: Python/Inspect-based Petri evaluation, provider API access for the auditor, target, judge, and feedback roles, real or replayed coding-agent harnesses, deployment transcripts, and substantial inference-time budget.
- Smallest useful reproduction: Run baseline Petri and one critique-refine configuration on the same seeds, then compare realism win rate, verbalized evaluation awareness, seed adherence, and concerning behavior. Separately wrap one target in Claude Code, Codex CLI, or Gemini CLI and replay the same coding seeds with a fixed transcript judge.
- Blocking unknowns: Exact API spend under current provider pricing, sensitivity to judge prompts and transcript selection, long-horizon effects beyond 30 turns, and whether the released harnesses cover enough real deployment variation for independent replication.

## Critical reading

- Strongest result: The compute-matched comparison makes the practical trade-off visible: extra calls spent making each action deployment-like can improve realism more than spending the same budget on longer, more branched audits.
- Weakest assumption: A target-model preference judge can stand in for deployment realism. The authors validate judge configuration against manual labels, but the final metric still depends on model judgment and curated transcript pairs.
- Unsupported leap: Higher realism win rate is not equivalent to safer or more complete alignment evaluation. The paper itself shows that realism and concerning-behavior elicitation can move in different directions.

## Bloss0m connection

- Related routes: agent evaluation, coding-agent harnesses, tool-use reliability, red teaming, and deployment provenance.
- Duplication risk: Low to medium; it overlaps with agent-evaluation candidates, but its central object is the realism boundary between an audit harness and a production harness rather than failure attribution or task success.
- Suggested internal links: Pair with READY for the question of deployment qualification, with Parsing the Stream for observer instrumentation, and with Harness-of-Harness for the effect of the outer agent scaffold on long-horizon behavior.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: it identifies a real evaluation blind spot, provides two concrete interventions, multiple target models, a compute-matched baseline, open implementation artifacts, and a clear engineering consequence for safety teams. Reproducibility and series value are capped because the central outcome is model-judged, the transcript sets are curated, and live-production transfer is unverified.
- Open questions requiring human approval: How much realism can be bought per dollar on current models? Which deployment traces should be treated as canonical? When realism improvements reduce concerning-behavior elicitation, should the audit be rejected, reweighted, or run as a separate safety slice?

