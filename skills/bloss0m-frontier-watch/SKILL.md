---
name: bloss0m-frontier-watch
description: Research and triage durable AI engineering topics and recent research papers for the Bloss0m editorial pipeline. Use when Codex needs to run a daily frontier scan, maintain the Blog Radar or Paper Radar ledger, deduplicate papers by stable identifiers and versions, score candidates, map them to existing knowledge-series gaps, prepare paper briefs, or produce a weekly shortlist without automatically publishing content.
---

# Bloss0m Frontier Watch

Turn daily scanning into a small, evidence-backed editorial queue. Optimize for lasting reader value rather than publishing frequency.

## Required context

- In a Bloss0m checkout, read `AGENTS.md` and inspect `git status` before editing.
- For Paper Radar work, read [references/paper-radar.md](references/paper-radar.md), `ops/editorial/paper-radar/series-map.yaml`, and `ops/editorial/paper-radar/ledger.json`.
- For Blog Radar work, read [references/blog-radar.md](references/blog-radar.md), `ops/editorial/blog-radar/ledger.json`, `specs/taxonomy.md`, and `src/data/blogTaxonomy.mjs`.
- For weekly review, read both ledgers and `ops/editorial/editorial-reviews/review-template.md`.
- Inspect the current `src/content/paperReading` pair before claiming that a topic or series gap exists.
- For Blog Radar work, inspect the existing blog archive and topic taxonomy before suggesting a new article.

## Modes

- **scan:** discover recent sources, deduplicate them, and update `last_seen_at`; do not draft publishable content.
- **triage:** verify primary sources, score candidates, and record the decision and rationale.
- **brief:** create a structured brief only for a candidate that clears the relevant threshold.
- **weekly:** combine both ledgers into a bounded editorial shortlist; do not inflate the list with low-value items.
- **handoff:** after explicit user approval, pass a blog candidate to `$publish-bilingual-ai-blog` or a paper candidate to `$publish-bilingual-paper-reading`.

## Workflow

1. Select Blog Radar or Paper Radar and one mode.
2. Search primary sources first. Treat aggregators, social posts, newsletters, and repository stars as discovery signals, not evidence.
3. Resolve a stable identifier before adding a paper: prefer DOI, then OpenReview forum ID, then normalized arXiv ID without a version suffix. Track the source version separately.
4. Check the ledger, both language archives, and aliases before creating an entry. Update an existing record when only the version changed.
5. Verify the source itself and distinguish author claims, measured results, and editorial inference.
6. Score every candidate with the appropriate rubric. Record each dimension, total, decision, and a concise rationale; never score from a title or abstract alone when recommending a deep read.
7. For papers, compare the candidate with `series-map.yaml`. Prefer filling a named gap or extending a strong existing path over creating a one-off series.
8. Create a brief from `ops/editorial/paper-radar/brief-template.md` only when the threshold is met. Preserve unknowns instead of inventing details.
9. In weekly mode, write one `ops/editorial/editorial-reviews/YYYY-Www.md` from the template. Include 5–10 total candidates when evidence permits, no more than 2 paper Deep Reads, and at most 2–4 publication slots. Use `insufficient-signal` instead of padding a weak week.
10. Make repeated runs idempotent: update an existing stable ID or weekly file instead of appending duplicates, preserve first-seen dates and human decisions, and record the ledger snapshot dates used by a weekly review.
11. Run `npm run check:editorial-radar` after changing either ledger or a weekly review.

## Guardrails

- Never publish, merge, push, or change article content during scan, triage, brief, or weekly mode.
- Never commit automatically. Leave validated Radar or review changes for human inspection in the automation task.
- Never equate recency, citations, social attention, or benchmark rank with paper quality.
- Reject or defer papers with unresolved identity, inaccessible primary material, withdrawn status, or evidence too weak for the proposed claim.
- Track revised and withdrawn papers explicitly. Re-evaluate the score when a revision changes experiments, conclusions, or limitations.
- Keep Traditional Chinese and English publication paths paired in ledger records.
- Preserve unrelated local work and do not overwrite human notes in briefs.
- Before an automation writes, inspect every dirty path. Continue only when all dirty paths are inside `ops/editorial/blog-radar`, `ops/editorial/paper-radar`, or `ops/editorial/editorial-reviews` and `npm run check:editorial-radar` already passes; treat those files as pending editorial state and update them idempotently. If any other path is dirty, a primary source is inaccessible, or validation fails, stop writes and report the exact failure. Never discard, reset, stash, commit, or repair unrelated work.
