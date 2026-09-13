---
stableId: "arxiv:2609.02749"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-06
lastVerifiedAt: 2026-09-06
primaryTrack: "agent-systems"
primaryGap: "tool-use-reliability"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# Repo-To-Skill: operational knowledge distilled from GitHub repositories

## Identity

- Stable ID: `arxiv:2609.02749`.
- Canonical URL: https://arxiv.org/abs/2609.02749
- Authors: Jianlyu Chen et al.; see the arXiv record for the complete author list.
- Venue or review status: arXiv v1 submitted 2026-09-02; subjects cs.AI, cs.SE, and cs.LG.
- DOI / OpenReview / arXiv aliases: `10.48550/arXiv.2609.02749`; no separate venue record located.
- Code / model / data: Paper HTML is available at https://arxiv.org/html/2609.02749v1. The public AREX-Skill artifact and library are at https://github.com/VectorSpaceLab/AREX-Skill; the repository says its general code is Apache-2.0 while each skill's source license is authoritative.

## Editorial fit

- Reader question: Can an agent gain durable, source-grounded operational knowledge from repositories without turning a large skill library into opaque prompt cargo cult?
- Why this belongs in the selected track: It fills `agent-systems` / `tool-use-reliability` with a concrete skill lifecycle: repository distillation, provenance, routing, progressive disclosure, and benchmark verification.
- Gap it fills: Existing skill coverage discusses packaging, compression, and use; Repo-To-Skill focuses on extracting reusable operational procedures from real ML repositories at library scale.
- Why now: The paper reports more than 5,000 verified skills distilled from 1,000 ML repositories across 20 areas and 178 families, with large reported gains under fixed GPT-5.5/Codex conditions.

## Claim map

- Problem: Model weights and generic harnesses do not contain repository-specific procedures, dependencies, and execution knowledge needed for complex research and engineering tasks.
- Main claim: DisCo plus the AREX-Skill Library can distill repository knowledge into routed, progressively disclosed skills that improve downstream agent benchmarks.
- Method: Build a repository-level skill graph, extract and verify operational units, attach source commit/provenance and execution boundaries, then route only relevant skills to the agent.
- What is genuinely new: The work treats operational knowledge as a separately maintained layer between model and harness, with a library-scale indexing and verification pipeline.

## Evidence audit

- Dataset and construction: 1,000 ML repositories, 5,000+ skills, 20 areas, 178 families; reported evaluation uses MLE-bench's 75 competitions, PaperBench's 20 papers, FrontierCS's 188 tasks, and PassNet's 200 samples.
- Metrics: With GPT-5.5, a fixed harness, and budget, the skill-equipped setup reports +134.3% MLE-bench, +34.4% PaperBench, +9.2% FrontierCS, and +14.0% PassNet relative gains.
- Artifact evidence: The public repository documents the library, routing/progressive-disclosure design, repository provenance, and source/code/run limitations; the paper and README provide complementary but not independent efficacy evidence.
- Threats to validity: Construction cost is reported around $40 per repository in the project material; benchmark contamination, judge-based verification, vendor/model dependence, refresh quality, and generalization beyond ML repositories remain open.

## Reproducibility

- Available artifacts and licenses: Paper HTML and public AREX-Skill repository are available. The paper is CC BY-NC-SA 4.0 on arXiv; individual skill licenses may differ from the repository's general Apache-2.0 license.
- Environment or compute requirements: Repository crawling, source parsing, skill verification, graph/router construction, GPT-5.5/Codex execution, and benchmark-specific environments.
- Smallest useful reproduction: Select a few permissively licensed repositories, generate skills with pinned source commits, inspect them manually, and compare a fixed agent with and without progressive disclosure on held-out tasks.
- Blocking unknowns: Exact construction prompts and costs, verification judge reliability, refresh/deprecation policy, library version pinning, source-license enforcement at serving time, and contamination controls.

## Critical reading

- Strongest result: Provenance and progressive disclosure connect a large operational knowledge base to an execution harness without requiring the whole library in every prompt.
- Weakest assumption: Repository-derived instructions remain correct, safe, and useful after dependencies, APIs, licenses, and project conventions change.
- Claims not supported by the evidence: Benchmark gains do not yet prove durable improvement on proprietary repositories, non-ML software, or agents with different model/harness budgets.

## Bloss0m connection

- Related series areas: skills, tool-use reliability, agent harnesses, and enterprise knowledge governance.
- Related candidates: SkillZip, TRACE, Prime Agent, and the existing skills/subagents/hooks coverage.
- Duplication risk: Medium; differentiate by focusing on operational-knowledge provenance and library maintenance, not skill compression or generic prompt routing.
- Suggested internal links: `29-agent-era-skills-subagents-commands-hooks`, `agent-systems`, and `tool-use-reliability`.

## Recommendation

- Output level: Deep Read.
- Score rationale: 5 topic relevance + 5 novelty + 4 evidence quality + 4 reproducibility + 5 engineering value + 5 series value = 28. The artifact and source-grounded design are strong, but cost, licensing, verification, and benchmark-contamination boundaries require a critical read.
- Open questions requiring human approval: Pin a reproducible library snapshot and verify a small skill sample's source/license/procedure fidelity before publication; decide whether the article should emphasize agent capability gains or knowledge-base operations.

