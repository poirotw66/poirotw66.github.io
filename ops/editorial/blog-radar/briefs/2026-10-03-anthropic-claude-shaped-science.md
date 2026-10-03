---
stableId: "url:https://www.anthropic.com/research/claude-shaped-science"
status: "candidate"
firstSeenAt: 2026-10-03
lastVerifiedAt: 2026-10-03
primaryCategory: "Industry Pulse"
primaryCluster: "ai-agent"
score:
  topicRelevance: 5
  durability: 4
  evidenceQuality: 4
  engineeringValue: 5
  readerInterest: 5
  total: 23
decision: "candidate"
---

# Claude-shaped science

## Identity

- Search window: 2026-09-26 through 2026-10-03; the article is dated 2026-10-01.
- Discovery queries: `AI agents scientific research scientists workflow October 2026`; `site:anthropic.com/research Claude-shaped science`; `BootLoops Matthew Schwartz open source agent science`.
- Canonical URL: https://www.anthropic.com/research/claude-shaped-science
- Publisher or author: Anthropic research guest essay by Matthew D. Schwartz, Harvard physicist.
- Published or updated date: 2026-10-01.
- Source type: Research-lab guest essay / first-person research workflow report.
- Direct supporting sources: [Anthropic essay](https://www.anthropic.com/research/claude-shaped-science); [BootLoops project site](https://bootloops.ai/); [BootLoops source organization and repositories](https://github.com/BootLoops-ai); [main BootLoops repository](https://github.com/BootLoops-ai/bootloops).

## Editorial fit

- Why now: The essay describes a current research workflow in which an agent is used less as a substitute human scientist and more as an engine for extensive, quantitatively checkable computation.
- Reader question: If an agent can reliably perform difficult calculations, which parts of scientific discovery become faster—and which choices remain irreducibly human?
- Story hook: The author reports using BootLoops to reproduce 15 known and calculate 15 previously uncomputed Feynman integrals, but also describes technically correct results that were scientifically unremarkable. The tension is between scalable computation and the human judgment needed to choose worthwhile questions and interpret importance.
- Category and topic cluster: Industry Pulse; `ai-agent`.
- Existing coverage and duplication risk: No matching canonical URL, BootLoops topic, or bilingual draft/article was found in the Blog Radar ledger or `src/content/blog`. A separate paper about agent evaluation is in today's Paper Radar; keep this post focused on changes to scientific work and the human/machine division of labor rather than repeating its benchmark analysis.
- Why this remains useful after the current news cycle: It offers a durable way to think about AI in research: automate reproducible, checkable subproblems while retaining human responsibility for problem selection, domain framing, and scientific significance.

## Claim map

- Primary claim: In the guest author's account, a model-agnostic harness with certified computational tools lets agents contribute to quantitative scientific work, while researchers still select problems and judge whether results matter.
- Measured evidence: The essay reports a 30-integral exercise (15 replications of known results and 15 calculations not previously completed by the author) and describes a broader set of 36 manuscripts across 18 fields with 19 coauthors over three months, drawn from roughly 400 candidate problems. The main BootLoops repository is public and MIT-licensed; its documentation is CC BY 4.0. The GitHub organization contains related tools with differing licenses, including GPL-licensed Kira-derived material.
- Vendor or author claims requiring qualification: The computation counts, manuscript counts, collaboration totals, and claims about scientific novelty are the guest author's self-report. The public code makes parts of the workflow inspectable but does not independently validate every calculation, manuscript, novelty claim, or estimate of research impact. Anthropic states that Schwartz was a visiting researcher and that it funded the project; BootLoops is his project, not an Anthropic product.
- Bloss0m engineering consequence: Design research agents around auditable numerical tools, reproducible protocols, and explicit human review. Do not equate producing a correct calculation with selecting a valuable scientific question or establishing a meaningful discovery.

## Evidence audit

- Primary evidence inspected: The dated Anthropic essay, BootLoops project site, public GitHub organization, main repository metadata and license descriptions.
- Baseline or comparison: The essay is a first-person workflow account, not a controlled study comparing agent-assisted and human-only scientific productivity.
- Missing evidence: Independent audit of the reported output totals; a complete mapping from agent-generated calculations to accepted manuscripts and external validation; reproducible end-to-end scripts for the essay's aggregate claims; and a causal estimate of time saved or research quality gained.
- Conflicts or uncertainty: The essay combines examples from one researcher's collaborations and reports broad output counts. Distinguish those counts from externally verified publication outcomes. BootLoops is a suite rather than a single uniformly licensed package; verify each component's license before reuse.

## Recommended treatment

- Output level: write-now; durable-post-candidate, not a publication promise.
- Proposed angle: “AI can do the integral; can it choose the discovery?” Explain the computational harness and reproducibility boundary, then examine why technical correctness does not itself establish scientific importance.
- Internal routes: Link to existing agent systems and evaluation coverage only where it adds context; do not present the separate Paper Radar evaluation as independent corroboration of the essay's output claims.
- Score rationale: 23/25 (topic 5, durability 4, evidence 4, engineering 5, reader interest 5). The work/research impact and human-judgment tension are unusually compelling, and the public code offers an inspectable artifact; the evidence score remains bounded because the impact and output totals are author-reported without an independent audit.
- Human decision required: Attribute all output totals and novelty claims to Schwartz; describe Anthropic's hosting and stated funding accurately; do not call this proof that scientists' jobs are being replaced or that the reported manuscripts were caused by AI.
