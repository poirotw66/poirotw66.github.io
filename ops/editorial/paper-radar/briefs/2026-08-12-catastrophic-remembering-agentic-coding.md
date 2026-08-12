---
stableId: "arxiv:2608.11095"
sourceVersion: "v1"
status: "shortlist"
firstSeenAt: 2026-08-12
lastVerifiedAt: 2026-08-12
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 2
  engineeringValue: 4
  seriesValue: 4
  total: 24
decision: "shortlist"
---

# Why Does CLAUDE.md Keep Growing? Catastrophic Remembering in Agentic Coding

## Identity

- Stable ID: `arxiv:2608.11095`.
- Canonical URL: https://arxiv.org/abs/2608.11095
- Authors: Kushal Chakrabarti.
- Venue or review status: arXiv v1, submitted 2026-08-11; no venue or review record identified.
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI link; no separate artifact identity identified.
- Code / model / data: The paper reports a corpus of 1,867 repositories and 247,694 instruction lifetimes plus inverted IFEval and WildIFEval experiments; no public reproduction package was identified during this run.

## Editorial fit

- Reader question: Why do agentic coding instruction files accumulate stale rules, and can maintainers preserve rationale so the prompt can shrink safely?
- Why this belongs in the selected track: Prompt state is part of the tool-use harness; uncontrolled instruction growth can change context pressure, behavior, and maintenance risk even when application code is unchanged.
- Gap it fills: `agent-systems` / `tool-use-reliability`, with a direct practice connection to repository instruction files and agent memory.
- Why now: The fresh study connects repository-scale longitudinal evidence to a concrete intervention: informative comments that encode rationale.

## Claim map

- Problem: Adding an instruction is cheap, but deleting it after its rationale is forgotten risks regression, creating “catastrophic remembering” and unbounded prompt growth.
- Main claim: Across 247,694 instruction lifetimes in 1,867 repositories, prompts grew 226% and gained 4.9 net instructions per commit; informative comments reduced excess in the controlled inverse-IFEval setting and improved WildIFEval following by up to 23.1%.
- Method: Trace instruction lifetimes and deletion hazards in real repositories, then compare no-comment, noise-comment, and informative-comment treatments in inverted IFEval and WildIFEval.
- What is genuinely new: It treats repository instruction maintenance as a longitudinal retention problem and links rationale-preserving comments to a measurable prompt-size and instruction-following outcome.

## Evidence audit

- Datasets: 1,867 repositories and 247,694 tracked instruction lifetimes; controlled inverted IFEval and WildIFEval prompt experiments.
- Benchmarks and metrics: Prompt growth, instruction deletion hazard, excess prompt size, constraint satisfaction, and agentic instruction-following.
- Baselines: No comments and comment-shaped noise are compared with informative comments; the paper reports repository-stratified bootstrap intervals and matching validation on annotated transitions.
- Ablations: The paper separates wholesale rewrites and migrations from individual instruction deletions and tests prompt horizons of 15 and 51 rounds.
- Statistical uncertainty: The repository evidence is observational; controlled experiments have limited seeds and task-stationary constraints, so the reported intervention effect is not a universal maintenance guarantee.
- Threats to validity: Repository selection, instruction matching, model choice, benchmark inversion, and the distinction between comments and other structured metadata may affect generalization.

## Reproducibility

- Available artifacts and licenses: The paper provides methods and result tables; no public dataset, mining pipeline, or experiment repository was found.
- Environment or compute requirements: A repository-history corpus, instruction matching/diff pipeline, prompt-maintenance harness, and an agent model capable of following the benchmark tasks.
- Smallest useful reproduction: Mine a small set of repository instruction files, distinguish rewrite/migration events from deletions, measure prompt growth, and compare rationale comments against noise comments on a fixed task suite.
- Blocking unknowns: Corpus sampling and filtering, model prompts, full seed counts, parser/matching code, and whether comments remain effective under live coding-agent context limits.

## Critical reading

- Strongest result: The falling deletion hazard with instruction age and the post-rewrite regrowth pattern give a plausible longitudinal mechanism rather than only a prompt-length correlation.
- Weakest assumption: Encoding latent reasoning in comments may shift maintenance burden or create another instruction channel whose quality is itself difficult to govern.
- Stated limitations: The paper separates wholesale rewrites from deletion, reports limited controlled seeds, and uses controlled verifiable worlds alongside real-world prompts.
- Claims not supported by the evidence: The study does not prove that comments are sufficient for safe prompt governance, eliminate context-window costs, or transfer to all agent instruction formats.

## Bloss0m connection

- Related Traditional Chinese routes: `52-openai-prompting-guidance-gpt-5-6-sol`; `15-langchain-agent-harness-anatomy`; `19-parallel-ai-what-is-agent-harness`.
- Related English routes: the paired English routes for the same entries.
- Duplication risk: Medium. Existing coverage discusses prompts and harnesses, but not longitudinal instruction lifetimes, rationale loss, or maintenance interventions.
- Suggested internal links: AGENTS.md/CLAUDE.md governance, prompt budgets, instruction provenance, context pressure, and regression tests for agent behavior.

## Recommendation

- Output level: Shortlist
- Score rationale: The paper is highly relevant and unusually concrete for agentic coding practice, but its public reproducibility story is currently weak and the intervention needs independent verification before a deep read.
- Open questions requiring human approval: Decide whether the archive wants a practice-oriented treatment; require the corpus/matching artifacts or a small independent reproduction before promoting this to Deep Read.
