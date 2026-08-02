---
name: publish-bilingual-paper-reading
description: Create, audit, repair, localize, or publish a source-grounded Bloss0m paper-reading article as a complete Traditional Chinese and English pair. Use when Codex needs to turn an approved Paper Radar brief into deep reading notes, verify paper metadata and evidence anchors, preserve bilingual parity and series placement, connect a paper to engineering decisions, or validate an existing paperReading pair before publication.
---

# Publish Bilingual Paper Reading

Turn one approved paper into a durable, critical reading path. Explain the evidence and engineering consequence; do not expand an abstract into promotional prose.

## Required context

- In a Bloss0m checkout, read `AGENTS.md`, `src/content.config.ts`, and [references/content-standard.md](references/content-standard.md).
- Read the approved Paper Radar brief and its current ledger record before drafting.
- Open the full primary paper, not only its abstract. Inspect appendices, tables, figures, limitations, and official artifacts relevant to the article's claims.
- Inspect the closest existing Traditional Chinese and English paper-reading pair for current formatting and route conventions.
- Inspect `git status` and preserve unrelated local work.

## Modes

- **new:** create a new publication-ready bilingual pair from an explicitly approved brief.
- **localize:** create a missing counterpart while preserving information parity.
- **repair:** fix metadata, evidence, formatting, or bilingual drift without changing the route unless authorized.
- **audit:** report gaps without editing content.

## Workflow

1. Confirm the mode and resolve the exact brief, stable paper ID, current version, and canonical primary sources.
2. Stop if a new article lacks explicit editorial approval, the paper identity is unresolved, the source is withdrawn, or the full paper is inaccessible.
3. Build an evidence map before prose: problem, method, datasets, baselines, metrics, ablations, limitations, artifacts, and claims the evidence does not support.
4. Choose one reader question and one primary series track. Use a single-part article for new work; do not create `-part-N` files.
5. Create the Traditional Chinese article first, then produce an editorial English localization with matching claims, source anchors, metadata, callout intent, and next-reading path.
6. Follow `content-standard.md`. Use locatable Figure, Table, section, or appendix anchors for substantive claims and distinguish author claims from Bloss0m analysis.
7. Link 2–4 verified internal routes when useful. Use `/paper-reading/.../` in Chinese and `/en/paper-reading/.../` in English.
8. Use original diagrams or generated cover art when needed. Do not reproduce paper figures merely for decoration; preserve attribution and licensing for any reused figure.
9. Update the Paper Radar ledger only after both files exist and validation passes. Preserve the stable ID and source version history.
10. Run `node skills/publish-bilingual-paper-reading/scripts/audit-paper-pair.mjs <basename>`, `npm run check:reading-quality`, `npm run check:i18n`, `npm run check:paper-radar`, and `npm run build`.

## Guardrails

- Never invent a baseline, metric, ablation, limitation, citation, figure result, code release, or dataset detail.
- Never imply peer review when the source is only an arXiv preprint or active submission.
- Never treat benchmark improvement as production superiority without checking scope, cost, and evaluation design.
- Keep equations in KaTeX syntax and define symbols before using them.
- Keep both languages independently readable; do not publish a reduced English summary.
- Do not auto-merge, push, or publish. Hand off a validated local pair or Draft PR only when requested.
