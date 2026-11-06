---
name: bloss0m-frontier-watch
description: Discover and verify AI mechanisms, papers, runnable tools, creative works and consequential failures; preserve exploratory leads separately from rigorous Bloss0m writing candidates and prepare approved bilingual handoffs.
---

# Bloss0m Frontier Watch

Find questions worth understanding or exploring, then verify the claims needed to write responsibly. The site archive is for deduplication, not the discovery source. Do not limit curiosity to enterprise IT, incidents or workplace effects.

## Context and modes

Read `AGENTS.md` in a Bloss0m checkout. For scheduled daily work read `ops/editorial/automation-contract.md`, [Blog discovery and scoring](references/blog-radar.md), [Paper scoring](references/paper-radar.md) and [independent inbox contract](references/candidate-inbox.md). Read the respective ledger and both language coverage before formal admission. Read `ops/editorial/paper-radar/series-map.yaml` for optional series placement, not eligibility.

- **explore / daily:** search external sources, inspect promising evidence, distinguish leads from formal candidates, show up to three cards. Scheduled runs save only immutable independent inbox files, never the website ledger.
- **collect / import:** saving a lead is not formal admission. Only an explicit human import decision naming the candidate permits website Radar updates; reverify sources, coverage and safe worktree state first. Use the Blog/Paper brief template and preserve human edits.
- **paper:** research any direct AI mechanism or application including cross-domain work. A lead need not score 28/30; only a verified formal Deep Read candidate does. Never call a lead ready for writing.
- **weekly:** combine current external evidence, inbox and Radar into a bounded shortlist; follow the automation contract's write boundary. No daily backlog padding.
- **write-blog / write-paper:** require explicit approval of the named topic and formal evidence eligibility. Invoke the matching bilingual publishing skill. A discovery run is not authorization to draft or publish.

## Discovery and judgment

Use the four lanes and source/query policy in [blog-radar.md](references/blog-radar.md). Search news in 24–72 hours with up to seven-day backfill and also unfamiliar 30–90-day works, labeling discovery versus publication dates. Browse the live web for research; read actual sources, not search snippets. Follow supporting artifacts when the claim depends on them. Unknown dates stay unknown and cannot establish freshness.

Before detailed inspection, look up stable IDs/canonical URLs; before formal admission, check both archives and contentEntries. An existing draft is covered even when the ledger is stale. Do not repeat unchanged material within seven days; compare reader questions and mechanisms across sources, and consider the previous three presented cards for topic fatigue. Preserve explicit want-write, want-play, collect and tired feedback with its provenance; never infer a preference from silence.

Formal Blog: 23–25/25, evidenceQuality >= 3 and readerInterest >= 4. Formal Paper: v2 28–30/30, evidenceQuality >= 3. Score dimensions honestly before applying gates. New/unknown mechanisms can remain exploration leads without lowering evidence requirements for formal recommendations. Reports lead with at most three cards per the daily contract, then evidence and blockers; absence of verified candidates does not prove absence of worthwhile research.

## Persistence and safety

For daily runs use only the fixed outside-worktree inbox and helper in [candidate-inbox.md](references/candidate-inbox.md). Never rewrite memory.md or shared ledgers in daily mode. Website dirty state does not prevent inbox persistence. Import remains human-directed and stops on unrelated dirty files, conflicting edits or failed validation; never stash, clean, reset, or overwrite user work. Run `npm run check:editorial-radar` before/after an authorized import batch; daily inbox runs validate only their own research batch. Never install dependencies or run full-site builds, image generation, paid experiments or auto-publication during discovery.

## Publication handoff

Pass verified sources and a complete brief to `$publish-bilingual-ai-blog` or `$publish-bilingual-paper-reading` after named topic approval. Read their instructions at handoff. For paper drafts run `npm run audit:paper-pair -- --strict <basename>` and `npm run audit:paper-comprehension -- --strict <basename>`; apply the canonical [Paper Essence Contract](../publish-bilingual-paper-reading/references/paper-essence-contract.md) and seven-question teach-back to both saved languages with evidence anchors. Structural checks alone do not establish comprehension. Any missing or unsupported answer remains needs-revision; no publication PR or published status. Never auto-commit, push, publish or merge.
