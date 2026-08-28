---
stableId: "arxiv:2304.03442"
sourceVersion: "v2"
status: "published"
firstSeenAt: 2026-08-28
lastVerifiedAt: 2026-08-28
primaryTrack: "agent-systems"
primaryGap: "multi-agent-coordination"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 3
  engineeringValue: 5
  seriesValue: 5
  total: 27
decision: "published"
---

# Generative Agents: Interactive Simulacra of Human Behavior

## Identity

- Stable ID: `arxiv:2304.03442`.
- Canonical URL: https://arxiv.org/abs/2304.03442
- Authors: Joon Sung Park, Joseph C. O'Brien, Carrie J. Cai, Meredith Ringel Morris, Percy Liang, Michael S. Bernstein.
- Venue or review status: UIST 2023 (ACM); arXiv v2 (2023-08-06).
- DOI: https://doi.org/10.1145/3586183.3606763
- Code / demo: https://github.com/joonspk-research/generative_agents ; https://reverie.herokuapp.com/UIST_Demo/

## Editorial fit

- Reader question: When believability requires many agents in a sandbox—not one chat window—how should observation, reflection, and planning compose a memory control plane, and how is that different from MemGPT OS paging?
- Why this belongs in the selected track: Fills blog 91 memory-line plus-item: multi-agent memory stream vs single-agent context paging.
- Gap it fills: Multi-agent coordination and memory architecture before later xMemory / production runtime leaves.
- Why now: Notes 24–35 and blogs 91/92 on main; Gorilla is note 35.

## Claim map

- Problem: Long-horizon believable agents need growing memories and multi-agent social dynamics; single-shot LLM behavior is insufficient.
- Main claim: Memory stream + reflection + retrieval-based planning enables believable individual and emergent social behavior in Smallville (25 agents).
- Method: Natural-language memory stream; recency/importance/relevance retrieval; reflection when importance sum > 150; hierarchical planning; ChatGPT backend.
- What is genuinely new: Architectural pattern for social-simulacra memory control plane in a multi-agent sandbox—not MemGPT paging, not Reflexion across-trial buffers.

## Evidence audit

- Controlled evaluation: 100 participants rank interview believability; TrueSkill full μ=29.89 vs ablations down to 21.21; Kruskal-Wallis H(4)=150.29, p<0.001.
- End-to-end two game days: mayor info 4%→32%, party 4%→52%, network density 0.167→0.74, 12 invited / 5 attended party.
- Ablations: observation, reflection, planning each critical (Figure 8).
- Stated limitations: cost (thousands USD tokens), short horizon, retrieval failures, instruction-tuning politeness, not production ACL memory.

## Recheck triggers

- Demo endpoint availability on Heroku.
- Cost and API changes for full 25-agent reproduction.
