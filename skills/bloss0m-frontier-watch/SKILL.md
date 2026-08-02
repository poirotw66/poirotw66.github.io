---
name: bloss0m-frontier-watch
description: Research and triage durable AI engineering topics and recent research papers for the Bloss0m editorial pipeline. Use when Codex needs to run a daily frontier scan, maintain the Blog Radar or Paper Radar ledger, deduplicate papers by stable identifiers and versions, score candidates, map them to existing knowledge-series gaps, prepare paper briefs, or produce a weekly shortlist without automatically publishing content.
---

# Bloss0m Frontier Watch

Turn daily scanning into a small, evidence-backed editorial queue. Optimize for lasting reader value rather than publishing frequency.

## Required context

- In a Bloss0m checkout, read `AGENTS.md` and inspect `git status` before editing.
- For Paper Radar work, read [references/paper-radar.md](references/paper-radar.md), `ops/editorial/paper-radar/series-map.yaml`, and `ops/editorial/paper-radar/ledger.json`.
- Inspect the current `src/content/paperReading` pair before claiming that a topic or series gap exists.
- For Blog Radar work, inspect the existing blog archive and topic taxonomy before suggesting a new article.

## Modes

- **scan:** discover recent sources, deduplicate them, and update `last_seen_at`; do not draft publishable content.
- **triage:** verify primary sources, score candidates, and record the decision and rationale.
- **brief:** create a structured brief only for a candidate that clears the relevant threshold.
- **weekly:** rank a bounded editorial shortlist from the ledger; do not inflate the list with low-value items.
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
9. In weekly mode, recommend at most 10 papers for review and at most 2 deep-read candidates. Explain why each deserves scarce editorial time.
10. Run `npm run check:paper-radar` after changing Paper Radar state.

## Guardrails

- Never publish, merge, push, or change article content during scan, triage, brief, or weekly mode.
- Never equate recency, citations, social attention, or benchmark rank with paper quality.
- Reject or defer papers with unresolved identity, inaccessible primary material, withdrawn status, or evidence too weak for the proposed claim.
- Track revised and withdrawn papers explicitly. Re-evaluate the score when a revision changes experiments, conclusions, or limitations.
- Keep Traditional Chinese and English publication paths paired in ledger records.
- Preserve unrelated local work and do not overwrite human notes in briefs.
