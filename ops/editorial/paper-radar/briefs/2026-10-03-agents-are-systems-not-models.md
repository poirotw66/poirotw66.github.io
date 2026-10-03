---
stableId: "arxiv:2610.01618"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-10-03
lastVerifiedAt: 2026-10-03
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read"
---

# Agents are systems, not models: Rethinking agentic evaluation

## Identity

- Canonical URL: https://arxiv.org/abs/2610.01618
- Authors: Luis Wiedmann, Leander Girrbach, Cordelia Schmid, and Zeynep Akata.
- Venue or review status: arXiv preprint v1, submitted 2026-10-01; no peer-reviewed venue identified.
- DOI / OpenReview / arXiv aliases: arXiv:2610.01618.
- Code / model / data: [paper](https://arxiv.org/html/2610.01618); [public repository](https://github.com/lusxvr/rethinking-agent-evaluation); [released trajectory dataset](https://huggingface.co/datasets/lusxvr/agentic-science-trajectories). The repository currently says full code and benchmark are forthcoming; do not call it a released implementation.

## Editorial fit

- Reader question: When an agent gets a scientific task wrong, should we blame the model—or the information, tools, verification path, and stochastic run that made up the system?
- Why this belongs in the selected track: It evaluates agents as configured systems, varying task information, reasoning and self-verification, runtime budget, and model backbone rather than treating benchmark score as a model-only property.
- Gap it fills: `agent-evaluation`—how to measure task success, cost, and failure modes reproducibly, including variance between runs and the effect of system-level support.
- Why now: The paper presents a timely, measured challenge to model-centric agent leaderboards and links its analysis to a public dataset of more than 18,000 trajectories.

## Claim map

- Problem: Agentic evaluations often compare models while leaving information access, verification support, runtime, and run-to-run variation under-specified.
- Main claim: In four scientific tasks, system configuration and information can materially shape performance; repeated-run noise is large, and supplying an explicit verification mechanism is more effective than simply asking an agent to verify its own work.
- Method: The authors evaluate multiple scientific tasks and vary task information, reasoning/self-verification instructions, runtime budget, and model backbone, with repeated agent executions and trajectory-level analysis.
- What is genuinely new: The work decomposes agent performance into system-level factors and empirical variance, showing a gap between prompting for verification and making a verification oracle/tool available.

## Evidence audit

- Datasets: Four scientific tasks across two scientific domains; the authors link a dataset of 18,000+ agent trajectories.
- Benchmarks and metrics: Task outcomes, trajectory-level behavior, self/reference-based verification, and resource/runtime comparisons. The paper reports that run-to-run noise accounts for 54% of score variance among genuine attempts.
- Baselines: Comparisons include different information conditions, model backbones, runtime budgets, and verification support. In one reported comparison, prompting for verification moves reference-based verification from 19% to 22%, while providing an oracle changes the rate substantially more; the oracle also has runtime/cost implications.
- Ablations: Separate information, reasoning/self-verification, runtime, model, and oracle/tool conditions; inspect exact task-specific tables and definitions during deep reading before generalizing the percentages.
- Statistical uncertainty: The paper uses repeated runs and reports uncertainty for key results; the 54% figure is specific to the evaluated tasks and analysis, not an estimate for all agents.
- Threats to validity: Only four tasks and two scientific domains; not every system-design dimension receives equal coverage. The paper's controlled settings do not establish production behavior or generality to coding, browser, or enterprise agents.

## Reproducibility

- Available artifacts and licenses: The linked trajectory dataset is publicly listed on Hugging Face. The linked GitHub repository is public but currently contains a README stating “Full code and benchmark coming soon”; no complete runnable implementation was verified. Confirm dataset access, data card, and license before any reuse.
- Environment or compute requirements: Full benchmark compute requirements and exact reproduction recipe are not yet available in the repository; consult the paper's experimental details and avoid claiming full reproducibility.
- Smallest useful reproduction: Re-analyze the public trajectories for run-to-run variance and verification behavior, then reproduce one task-level prompt-versus-oracle comparison once code and environment are released.
- Blocking unknowns: Full code and benchmark release date, exact dataset license/access restrictions, environment and cost, and independent rerun.

## Critical reading

- Strongest result: Verification behavior is not solved by exhortation alone: telling an agent to check its own answer produces only a small change in the reported comparison, while an explicit oracle/tool changes the available verification path.
- Weakest assumption: The authors' system-level decomposition is tested on a narrow suite of scientific tasks; it does not show that the same factor ranking holds across different agent domains or production conditions.
- Stated limitations: Four tasks across two scientific areas; only some system-design dimensions are explored in depth; broader benchmarks and system designs remain future work.
- Claims not supported by the evidence: The paper does not establish a universal 54% agent failure/noise rate, prove that larger models or more runtime never help, or demonstrate a production-ready general evaluation framework.

## Bloss0m connection

- Related Traditional Chinese routes: Search the existing Paper Reading archive for agent evaluation, verification, and reproducibility articles at drafting time; do not invent route slugs.
- Related English routes: Use the same bilingual route check after selecting the article number.
- Duplication risk: No matching arXiv ID, title, or draft was found in Paper Radar or `src/content/paperReading`. This work may inform a separate Blog Radar candidate, but today's Blog selection is intentionally a distinct story about changes to scientific work, not a duplicate summary of this evaluation paper.
- Suggested internal links: Link to relevant existing agent evaluation or verification readings only after checking both language archives and confirming topical fit.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30 (topic 5, novelty 5, evidence 4, reproducibility 4, engineering 5, series 5). Strong repeated-run evidence, a clear system-versus-model thesis, a useful verification contrast, and a public trajectory dataset support a high score. Evidence and reproducibility stop at 4 because the task/domain scope is narrow, the full code and benchmark are not released, and there is no independent rerun.
- Open questions requiring human approval: Verify all author affiliations and table-level percentages against the final source at drafting time; keep the dataset license/access caveat visible; do not imply that an oracle comparison is a free or generally available intervention.
