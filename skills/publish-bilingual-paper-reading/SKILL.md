---
name: publish-bilingual-paper-reading
description: Create, audit, repair, localize, or publish a source-grounded, argument-faithful, and comprehension-complete Bloss0m paper-reading article as a Traditional Chinese and English pair, including original-paper body figures with provenance and an Evidence Atlas cover for a new reading. Use for approved Paper Radar briefs, deep reading notes, Paper Essence Contract or teach-back audits, conceptual and taxonomy fidelity checks, figure/evidence verification, metadata verification, bilingual parity, engineering interpretation, cover creation, or publication validation.
---

# Publish Bilingual Paper Reading

Turn one approved paper into a source-grounded, argument-faithful bilingual reading. The article teaches the paper; working notes and the final handoff report the agent's verification work.

## Modes and context

- **new:** create a new pair from an explicitly approved Paper Radar brief.
- **localize:** create a missing counterpart while preserving information and argument parity.
- **repair:** fix metadata, evidence, terminology, formatting, or bilingual drift without changing routes unless authorized.
- **audit:** report gaps without editing content.

Read `AGENTS.md`, `src/content.config.ts`, [content-standard.md](references/content-standard.md), the approved brief and ledger record when drafting, and the closest existing bilingual pair. Inspect `git status` and preserve unrelated work. Project instructions and the user's existing authorization take precedence.

Load these references for their relevant stage:

- [paper-essence-contract.md](references/paper-essence-contract.md): the canonical seven-question contract and teach-back gate, required for drafting and publication review.
- [argument-fidelity.md](references/argument-fidelity.md): source analysis, substantial rewriting, or evidence/conceptual audits; contains paper-type evidence maps, terminology, canonical examples, attribution, and claim-strength checks.
- [article-template.md](references/article-template.md): new drafts and substantial rewrites; preserve teaching functions without forcing identical headings onto every paper type.
- [reader-facing-editing.md](references/reader-facing-editing.md): drafting, voice repairs, and final readability review.
- [cover-art.md](references/cover-art.md): new readings or explicitly requested cover replacement only.

## 1. Resolve identity and source scope

Resolve the exact brief, stable paper ID, canonical title, authors, version, publication status, primary URL, artifacts, and relevant prior versions. A new article requires explicit editorial approval. Stop if identity or primary version is unresolved, the full paper is inaccessible, or the source is withdrawn without an editorial reason to cover it. Do not silently switch source versions or imply peer review for a preprint or submission.

Read the full primary paper, including material appendices, figures, tables, limitations, and supplementary artifacts. Identify whether the paper is empirical, systems, theoretical/formal, taxonomy/conceptual, dataset/evaluation, position/perspective, or mixed. Use the relevant evidence map in `argument-fidelity.md` before writing prose.

Build an internal argument map, terminology/ontology map, and answers to the seven-question contract. Preserve entities, abstraction levels, assumptions, dependencies, guarantees, conceptual types, and the distinction between empirical evidence, proof, conjecture, and interpretation. Label any Bloss0m-created framework or recommendation visibly at first introduction. A central conceptual collapse or unsupported strengthening blocks publication.

Independently open material code, dataset, demo, checkpoint, benchmark, and project endpoints. Record access state, version, as-of date, required permissions, missing files, and reproduction scope in working notes. Do not infer usable release from the paper or README. In the article, retain only reader-relevant availability and distinguish author-reported results from independent reruns; make reproduction steps conditional when assets are unavailable.

## 2. Plan and write the bilingual reading

Choose one primary reader question, series track, and narrative spine. New readings use a single part, not `-part-N` files. Follow repository numbering and route conventions; never overwrite an existing article.

Draft Traditional Chinese first, then localize into independently readable English. Match claims, conceptual distinctions, argument structure, evidence anchors, figures/captions, metadata, callout intent, uncertainty, synthesis labels, and next-reading paths. Do not reduce the English version to a summary.

Move from orientation through model, mechanism, evidence, boundary, and engineering consequence. Explain why notation matters and define symbols before use; use KaTeX. Prefer the paper's canonical example. A substituted example must isolate the same mechanism without adding confounds and be labeled as Bloss0m-created.

Keep the opening source/version note brief unless source status changes the argument. Keep conditions beside the claims they qualify; consolidate repeated general caveats. Headings must describe evidence actually present, so a cost comparison is not an ablation. Repetition across TL;DR, ninety-second map, recaps, and callouts must add a distinct teaching function. If the article outgrows the source, check for redundant summaries.

Use locatable Figure/Table/section/appendix/equation/theorem/definition/artifact anchors for substantive claims. Separate what authors claim, what evidence establishes or suggests, and Bloss0m inference. Preserve numerical denominators, evaluation settings, logical force, and reproduction boundaries. Do not turn benchmark scope into production superiority, correlation into causation, conjecture into proof, or absence of a general solution into impossibility.

Link 2–4 verified internal routes when useful, using `/paper-reading/.../` and `/en/paper-reading/.../` for the paired locales. Links must support conceptual continuation. Follow the metadata, detailed-note floors, bilingual density, and formatting requirements in `content-standard.md`.

## 3. Prepare figures and cover

Build a visual-evidence inventory: original figure number, teaching purpose, section, endpoint, source version, and reuse license/restriction. Prefer central results and material subgroup, ablation, or failure-mode evidence over decorative diagrams. Do not silently recreate unavailable paper figures as if they were original evidence.

For a new or substantially repaired pair, embed at least three distinct material original-paper figures per language when that many are reusable; otherwise include every material reusable figure. The archive-wide minimum is one. Repeated placements and panels of the same figure do not satisfy the distinct-figure floor. Use identical stable assets/endpoints and placement order in both languages.

Place each caption immediately after its image, with paper figure number, section or locatable anchor, what to notice, original source link, and license/copyright restriction. Adjacent panels may share a caption only when their alt text and caption identify the same numbered figure. The structural auditor deduplicates paths and caption figure numbers; source inspection still verifies that assets are distinct original evidence.

Run the scoped figure audit:

```bash
node skills/publish-bilingual-paper-reading/scripts/audit-paper-figures.mjs --strict --min-body-figures 3 <basename>
```

When only one or two material figures are reusable, use that actual minimum and explain the inventory-based reason in the handoff. For zero figures, use `--allow-no-body-figures --reason "..."` and preserve the same `<!-- paper-reading-no-body-figures: ... -->` exception in both files so the archive gate can validate it. Valid reasons include no figures, inaccessible endpoints, prohibited reuse, or no material reusable figures. Never silently omit figures or weaken a failure simply to publish.

Every new pair also needs one 1200 × 750 Evidence Atlas WebP cover from the evidence map. The cover is not paper evidence and never counts toward the figure gate. Do not include Huahua, other mascots, fake dashboards, readable decorative paragraphs, invented metrics, or unverified claims. Preserve existing covers during repair/audit/localization unless replacement is requested.

## 4. Review the final saved pair

Run the semantic teach-back in `paper-essence-contract.md`, then the final conceptual/claim-strength review in `argument-fidelity.md`. Recheck bilingual claim strength and attribution after localization.

### Reader-facing publication gate

After the last edit, reopen both saved Markdown files and read the entire body, including inherited sections, headings, captions, source notes, and artifact sections. Apply `reader-facing-editing.md`.

Reject task-execution commentary whose primary purpose is reporting the agent's work: “I checked/verified,” tool failures, retry histories, inspected-file inventories, commands run or not run, audit results, figure-count justifications, and article-production notes. Judge purpose, including Chinese and impersonal wording, rather than keyword presence. Source quotations, useful reproduction commands, and descriptions of the paper's own method remain valid.

Transform reader-relevant access restrictions, source/version qualifications, and actual reproduction scope into editorial prose; move execution logs to working notes or handoff. Preserve source anchors and figure attribution. Reject headings implying absent evidence or attributing Bloss0m recommendations to authors. Repair blockers in both languages and repeat this gate on the saved revision. Structural success does not override a semantic or editorial blocker.

If feedback quotes absent text, identify which revision it refers to before treating it as a current defect. The handoff identifies reviewed files/revision and unresolved issues; local review is not a deployed-page check.

## 5. Validate, update Radar, and hand off

For direct work, run the figure audit with the justified minimum, then:

```bash
node skills/publish-bilingual-paper-reading/scripts/audit-paper-pair.mjs --strict <basename>
node skills/publish-bilingual-paper-reading/scripts/audit-paper-comprehension.mjs --strict <basename>
npm run check:editorial
npm run build
```

The build includes full site checks. Do not precede it with `check:all`, which repeats those checks. Strict failures in figure integrity, source coverage, comprehension, metadata, routes, bilingual parity, detailed-note floors, artifact claims, or conceptual fidelity block handoff as publication-ready.

Update the brief/ledger only after both files, semantic/editorial gates, body figures or documented exception, new cover, artifact verification, and scoped strict validation pass. Preserve stable ID, canonical source, source-version history, and approval state. Recheck editorial state after ledger edits. Add recheck triggers for preprints, incomplete artifacts, unavailable code/data/checkpoints, or expected revisions. A local validated draft does not by itself establish deployment or authorize a published status.

Report files, source version, cover/figure status and justified exceptions, artifact limitations, semantic review outcome, and commands/results. Do not commit, push, merge, or publish without user authorization. Create a Draft PR only when requested.

## Delegated batches

When readings are assigned to subagents, the coordinator fixes article numbers, stable IDs, slugs, workers, exact bilingual/cover paths, reserved body-asset directories, and allowed/forbidden paths in a batch manifest before dispatch. Resolve collisions first and finalize asset lists at handoff.

Workers own source reading, bilingual drafting, body figures, one original 1200 × 750 cover, and basename-scoped figure/pair/comprehension checks plus semantic review. They do not generate responsive derivatives, run repository-wide checks/builds, install dependencies, edit shared ledgers/skills/unrelated files, commit, or push. Missing dependencies go to the coordinator.

Worker reports contain only `filesModified`, `localChecks`, `blockers`, and `status`, with concise evidence rather than terminal transcripts. The coordinator reviews deliveries as they arrive, requests scoped repairs, preserves semantic/source/figure review, integrates accepted files, and accounts for unrelated generated changes without discarding user work.

After integration and ledger updates, the coordinator runs `npm run check:editorial` and `npm run build` once. Build creates responsive covers. Reuse checks for unchanged files and rerun only gates invalidated by fixes.
