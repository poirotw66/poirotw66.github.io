# Two-Article Writing Batch Manifest

- Batch date: 2026-10-03 (Asia/Taipei)
- Coordinator: primary task
- Baseline: current `main` worktree at dispatch; existing Radar edits listed below are preserved.
- Requested worker model: `gpt-6-luna`, reasoning `high`.
- Worker 1: Arendt (`01a0ff55-f560-7520-b4a7-7dde74ce6b0d`).
- Worker 2: Euler (`01a0ff55-f873-71d2-90e5-afcef4e41532`).
- Dispatch rule: each worker owns exactly one row. IDs, slugs, output files, and assets are reserved; do not choose or change them.
- Publication skills: `publish-bilingual-ai-blog` for Blog #131; `publish-bilingual-paper-reading` for Paper Reading #83; use the image generation skill for required raster covers.

## Preserved pre-existing changes

- `ops/editorial/blog-radar/ledger.json`
- `ops/editorial/blog-radar/briefs/2026-10-03-anthropic-claude-shaped-science.md`
- `ops/editorial/paper-radar/ledger.json`
- `ops/editorial/paper-radar/briefs/2026-10-03-agents-are-systems-not-models.md`

These are coordinator-owned Radar changes from the daily run. Workers must not modify them.

## Assignments and reserved outputs

| Worker | Type / ID | Stable basename | Primary source | Traditional Chinese | English | Reserved assets |
| --- | --- | --- | --- | --- | --- | --- |
| 1 — Arendt | Blog #131 | `131-anthropic-claude-shaped-science-agentic-research-workflow` | https://www.anthropic.com/research/claude-shaped-science; https://github.com/BootLoops-ai/bootloops | `src/content/blog/131-anthropic-claude-shaped-science-agentic-research-workflow.md` | `src/content/blog/en/131-anthropic-claude-shaped-science-agentic-research-workflow.md` | `public/blog/131-anthropic-claude-shaped-science-agentic-research-workflow/` |
| 2 — Euler | Paper Reading #83 | `83-agents-are-systems-not-models-agentic-evaluation` | https://arxiv.org/abs/2610.01618 (v1); https://github.com/lusxvr/rethinking-agent-evaluation; https://huggingface.co/datasets/lusxvr/agentic-science-trajectories | `src/content/paperReading/83-agents-are-systems-not-models-agentic-evaluation.md` | `src/content/paperReading/en/83-agents-are-systems-not-models-agentic-evaluation.md` | `public/paperReading/83-agents-are-systems-not-models-agentic-evaluation/` |

## Editorial and evidence boundaries

- Blog angle: explain how a quantitative-science workflow can use an agent for reproducible, checkable calculations while humans still select research questions and judge significance. Attribute the reported 30-integral and broader manuscript/project totals to Matthew D. Schwartz; do not present them as an independent productivity study or job-displacement result. Distinguish BootLoops from Anthropic and note that component licenses vary.
- Paper angle: explain why agent performance is a property of a configured system, including task information, reasoning, verification, runtime, backbone, and run-to-run variance. Preserve all four-task/two-domain limits and the distinction between the paper's released trajectories, its repository's announced full code/benchmark, and independent reproduction.
- Keep the two pieces distinct: the Blog is about scientific work and human judgment; the Paper Reading is about the design and interpretation of agent evaluation.
- #130 is already occupied by the Anthropic robot-work article. Do not edit or renumber it.

## Worker boundaries and local gates

- Workers may edit only their row's two Markdown files and reserved asset directory. The Blog worker owns one original 1200 × 750 Huahua `title_image.webp`; inspect `public/brand/bloom-hero.webp` first. The Paper worker owns one original 1200 × 750 Evidence Atlas `title_image.webp` without a mascot and the body figures/assets needed by its figure audit. Do not create responsive cover derivatives; the coordinator build owns them.
- Blog worker: verify primary claims and artifact/license scope; create a substantive Traditional Chinese and English pair; run `node skills/publish-bilingual-ai-blog/scripts/audit-blog-pair.mjs --mode=new 131-anthropic-claude-shaped-science-agentic-research-workflow`; inspect its links, figure/cover, and language parity.
- Paper worker: read the entire arXiv v1 including appendices, figures, tables, limitations and artifacts; use the Paper Essence Contract and reader-facing gate. Include at least three distinct reusable original-paper figures per language if available, with immediate captions and provenance, plus one Evidence Atlas cover. Run strict figure, pair, and comprehension audits for the assigned basename and complete the seven-question teach-back.
- Workers must not modify this manifest, any Radar ledger/brief, shared skill/configuration, another article, or files outside their row. Do not install dependencies, run repository-wide checks/builds, generate responsive derivatives, commit, push, open a PR, or publish.
- Worker reports contain only `filesModified`, `localChecks`, `blockers`, and `status`, with concise evidence and no terminal transcript.

## Coordinator review and integration

- Blog #131: both locales and the original cover were delivered. The coordinator reviewed the source claims, bilingual parity, and visual; the scoped new-post audit passed with 0 errors and 0 warnings.
- Paper Reading #83: the assigned worker delivered its reserved figure assets and cover but did not create either article body or run its audits. The coordinator then completed both bilingual bodies from arXiv v1, reviewed the paper's task definitions, figures, results, limitations, and current artifact status, and retained six original paper figures under CC BY 4.0.
- Paper #83 strict figure, pair, and comprehension audits passed; the seven-question teach-back and reader-facing review were completed by the coordinator. Both entries now point to their reserved bilingual content basenames in the Radar ledgers; the Paper record remains a deep-read candidate rather than being mislabeled published.
- The coordinator preserves the pre-existing daily Radar edits and runs the repository-wide editorial check and build once for this batch. This request authorizes writing only; do not commit, push, create a PR, or publish.
