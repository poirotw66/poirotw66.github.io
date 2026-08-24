---
stableId: "arxiv:2608.09802"
sourceVersion: "v1"
status: "published"
firstSeenAt: 2026-08-13
lastVerifiedAt: 2026-08-13
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
decision: "published"
---

# SWE-Bench ProMax: Benchmarking Agents on Large-Scale Multilingual Code Refactoring

## Identity

- Stable ID: `arxiv:2608.09802`.
- Canonical URL: https://arxiv.org/abs/2608.09802
- Authors: Yuling Shi, Jinghan Xu, Kelin Fu, Wenhao Zeng, Shilin He, Lei Zhang, Yue Liu, Zelin Zhao, Terry Yue Zhuo, Jialun Cao, Siyu Ye, Tianyu Liu, Kai Cai, Shing-Chi Cheung, and Xiaodong Gu.
- Venue or review status: arXiv v1, submitted 2026-08-10; the PDF says COLM 2026, while the COLM accepted list uses the related title SWE-Cascade and adds Yingwei Ma. No directly mappable OpenReview/PDF record was identified, so the published reading keeps arXiv v1 metadata.
- DOI / OpenReview / arXiv aliases: arXiv-issued DOI link; COLM accepted-list title/author discrepancy documented in the reading.
- Code / model / data: Dataset endpoint https://huggingface.co/datasets/swe-bench-promax/SWE-Bench-ProMax is public as of 2026-08-13 at revision `86fce26c694c5c362efd6bf116bee142b447b578`; README, primary JSON, and `eval.json` are accessible. Official scaffold/checkpoint path and full end-to-end evaluation configuration remain unverified.

## Editorial fit

- Reader question: How should we evaluate coding agents on behavior-preserving, cross-file refactoring when a benchmark's tests may be narrow, contaminated, or too small to represent real maintenance work?
- Why this belongs in the selected track: It targets the `agent-systems` / `agent-evaluation` gap with a benchmark whose unit is a large multilingual refactoring change rather than a small issue patch.
- Gap it fills: Long-horizon software-engineering evaluation, benchmark quality, multilingual code maintenance, and unsaturated agent capability measurement.
- Why now: The paper is fresh and reports only 41.2% resolution for the best tested frontier-model setup on 170 curated tasks, leaving room for meaningful comparisons.

## Claim map

- Problem: Existing coding-agent benchmarks can saturate, contain flawed tests, or permit memorization; large behavior-preserving refactors are underrepresented.
- Main claim: SWE-Bench ProMax provides a harder and more realistic benchmark for long-horizon coding agents through expert-curated, multilingual, cross-file refactoring tasks.
- Method: Build 170 instances from real commits across Python, Java, TypeScript, Go, C, C++, and Rust; rewrite issue descriptions; manually review tests; filter out low-complexity or narrow-scope tasks; evaluate frontier models under two agent scaffolds.
- What is genuinely new: The benchmark's scale and refactoring-oriented construction—11.4 modified files and 261.6 lines on average—combined with explicit quality controls aimed at known SWE-bench failure modes.

## Evidence audit

- Datasets: 170 real-commit-derived instances across seven programming languages; dataset is linked on Hugging Face.
- Benchmarks and metrics: Resolve rate is the headline metric; the best reported result is 41.2%. Full-paper verification found a 300-step/$10 cap, seven-language breakdowns, patch-size diagnostics, cost/step reporting, and Figure 5 evidence of incomplete refactoring.
- Baselines: mini-SWE-agent and OpenHands are evaluated with six models. GPT-5.2 moves from 21.8% to 41.2% across scaffolds, while Gemini-3-Pro moves from 26.5% to 19.4%, confirming scaffold dependence.
- Ablations: The benchmark construction pipeline is documented, but the paper does not provide a clean causal ablation of curation choices; language and repository concentration remain important interpretation boundaries.
- Statistical uncertainty: A 170-instance benchmark supports bounded comparison but not universal estimates of software-agent reliability; the reading treats the headline as a protocol result, not a confidence interval for production reliability.
- Threats to validity: Real-commit sampling overrepresents particular repositories and languages; TypeScript has 28 tasks from 2 repositories, 25 from Angular; resolve rate still rewards test alignment over maintainability and review quality.

## Reproducibility

- Available artifacts and licenses: Public Hugging Face dataset, README, primary JSON, and eval metadata are directly accessible. HF metadata does not declare a separate dataset license; the paper states that source-repository open-source license conditions were respected.
- Environment or compute requirements: Multiple language toolchains, repository snapshots, agent harnesses, model/API access, and likely substantial execution time.
- Smallest useful reproduction: Download a small per-language slice, run one open-weight model under a documented scaffold, report patch application, test pass, timeout, token/tool cost, and human review of false positives/negatives.
- Blocking unknowns: Complete scaffold commit, model snapshots, execution image, prompt/tool versions, cost-calculation settings, one-command result reproduction, and a directly mappable venue version.

## Critical reading

- Strongest result: The benchmark makes task scale and multilingual refactoring explicit and reports substantial headroom for current agents.
- Weakest assumption: Better curation and larger patches are treated as a closer proxy for professional software engineering, but the paper must show that the tasks are not simply harder because of tooling noise or environment setup.
- Stated limitations: Resolve is an all-tests binary outcome; language/repository concentration, scaffold interaction, benchmark test coverage, and the 300-step/$10 protocol constrain external validity; dataset and eval metadata are public but end-to-end scaffold/checkpoint reproduction is not verified.
- Claims not supported by the evidence: A 41.2% resolve rate does not prove that current agents are unsafe in production, nor that ProMax is contamination-proof or a complete measure of engineering ability.

## Bloss0m connection

- Related Traditional Chinese routes: `08-osreward-agent-evaluation`; `14-agent-trajectory-sentinel`; `19-a2e-agent-auditing-engine`.
- Related English routes: the paired English routes for the same entries.
- Duplication risk: Low to medium. Existing coverage focuses on evaluation protocol and trajectory observability; ProMax adds benchmark construction and large-scale refactoring.
- Suggested internal links: benchmark validity, execution traces, test quality, patch review, cost/latency, and cross-language toolchain support.

## Recommendation

- Output level: Published Deep Read.
- Score rationale: It directly closes a top-priority evaluation gap, has a concrete public dataset and eval metadata, and provides a challenging engineering artifact. Reproducibility remains bounded because scaffold/checkpoint and end-to-end configuration are not verified; the reading also records the COLM title/version discrepancy.
- Open questions requiring future follow-up: Verify any later venue-version mapping, scaffold/checkpoint release, dataset license clarification, and independent contamination or hidden-test audit.
- Published content: `22-swe-bench-promax` (Traditional Chinese and English pair); body now embeds Figures 1, 3, 5, and 9 from the arXiv HTML source with bilingual captions, source anchors, and CC BY 4.0 attribution.
