---
name: publish-bilingual-paper-reading
description: Create, audit, repair, localize, or publish a source-grounded and comprehension-complete Bloss0m paper-reading article as a Traditional Chinese and English pair, including an Evidence Atlas cover for a new reading. Use for approved Paper Radar briefs, deep reading notes, Paper Essence Contract or teach-back audits, metadata and evidence verification, bilingual parity, engineering interpretation, cover creation, or publication validation.
---

# Publish Bilingual Paper Reading

Turn one approved paper into a durable, critical reading path. Explain the evidence and engineering consequence; do not expand an abstract into promotional prose.

## Required context

- In a Bloss0m checkout, read `AGENTS.md`, `src/content.config.ts`, [references/content-standard.md](references/content-standard.md), and `docs/guideline/content/content-reading-quality.md`.
- When drafting or substantially rewriting an article, read [references/article-template.md](references/article-template.md). Preserve its teaching functions without forcing identical headings onto every paper type.
- When creating a new paper-reading pair or explicitly replacing its cover, read [references/cover-art.md](references/cover-art.md).
- Read the approved Paper Radar brief and its current ledger record before drafting.
- Open the full primary paper, not only its abstract. Inspect appendices, tables, figures, limitations, and official artifacts relevant to the article's claims.
- Open every material code, dataset, demo, and checkpoint URL independently. Record whether each endpoint is usable, empty, gated, missing, or merely announced; do not infer availability from a paper or project-page claim.
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
3. Build an evidence map before prose: problem, method, datasets, baselines, metrics, ablations, limitations, artifacts, and claims the evidence does not support. Include diagnostic slices such as platform, subgroup, failure type, calibration, cost, and transfer when the paper reports them.
4. Build the Paper Essence Contract before drafting. Write accurate answers to the problem, prior limitation, core idea, end-to-end mechanism, supporting evidence, and adoption boundary. If the paper cannot support one answer, mark the uncertainty instead of filling it with inference.
5. Choose one reader question and one primary series track. Use a single-part article for new work; do not create `-part-N` files.
6. Draft for comprehension before completeness: give a ninety-second map, explain the core intuition before notation, walk one representative input through the mechanism, interpret central results, and end with three durable memory points.
7. Create the Traditional Chinese article first, then produce an editorial English localization with matching claims, source anchors, teaching layers, metadata, callout intent, and next-reading path.
8. Follow `content-standard.md`. Use locatable Figure, Table, section, or appendix anchors for substantive claims and distinguish author claims from Bloss0m analysis.
9. Link 2–4 verified internal routes when useful. Use `/paper-reading/.../` in Chinese and `/en/paper-reading/.../` in English.
10. For every new pair, create one Evidence Atlas cover from the article's evidence map. Do not use Huahua or another mascot. Preserve an existing cover during audit, repair, or localization unless the user explicitly asks to replace it.
11. Select body figures by evidence coverage and teaching purpose: each reused figure must support a distinct claim, and a central subgroup or failure-mode result must not be omitted in favor of decorative overview figures. Preserve attribution and licensing for every reused figure.
12. Audit artifact availability at publication time. Separate “the paper says it is released” from “the endpoint is accessible and documented,” include an as-of date for partial releases, and make reproduction steps conditional when files are unavailable.
13. Run the semantic teach-back using only the draft: answer all six Paper Essence Contract questions, cite the supporting draft section, revise every `unclear` answer, and repeat once. Do not consult the paper during this comprehension pass.
14. Update the Paper Radar brief and ledger only after both files and the new local cover exist and validation passes. Preserve the stable ID and source version history; add a recheck trigger for preprints, incomplete artifacts, or pending checkpoints.
15. Run `node skills/publish-bilingual-paper-reading/scripts/audit-paper-pair.mjs --strict <basename>`, `node skills/publish-bilingual-paper-reading/scripts/audit-paper-comprehension.mjs --strict <basename>`, `npm run check:reading-quality`, `npm run check:i18n`, `npm run check:paper-radar`, and `npm run build`. Treat strict coverage or comprehension warnings as blockers; treat length and bilingual-density advisories as review prompts rather than quotas.

## Guardrails

- Never invent a baseline, metric, ablation, limitation, citation, figure result, code release, or dataset detail.
- Never call an artifact released or reproducible solely because the abstract, paper, or project page says so; verify the direct endpoint and describe access restrictions.
- Never imply peer review when the source is only an arXiv preprint or active submission.
- Never treat benchmark improvement as production superiority without checking scope, cost, and evaluation design.
- Keep equations in KaTeX syntax and define symbols before using them.
- Keep both languages independently readable; do not publish a reduced English summary.
- Keep new paper covers in the Evidence Atlas system. Do not add Huahua, fake dashboards, readable text, decorative benchmark numbers, or unverified paper claims to the cover.
- Do not auto-merge, push, or publish. Hand off a validated local pair or Draft PR only when requested.
