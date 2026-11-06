# Bloss0m editorial automation contract

## Active schedules

- **Bloss0m Daily Frontier Watch** — daily at 04:30 Asia/Taipei (UTC+8). Keep ACTIVE, model and reasoning effort unchanged when editing editorial policy.
- **Bloss0m Weekly Editorial Review** — documented Friday 16:00 local cadence only; no matching local automation was found in the 2026-09-18 audit. Do not report it as installed without verification.

## Daily purpose and discovery

Find questions the author may want to understand, play with, collect, or write about. Follow the four exploration lanes and evidence policy in `skills/bloss0m-frontier-watch/references/blog-radar.md`; no topic is required to demonstrate an incident or workplace impact. Agent/RAG, PDF/OCR, multimodal systems and creative AI are examples, not a restriction to enterprise IT.

- News: primarily 24–72 hours, backfill up to seven days with actual source dates.
- Discovery: also seek unfamiliar works from the last 30–90 days; label **newly discovered, not newly published**. Historical context is allowed but must not be sold as recent news.
- Seek varied authors, methods and artifacts, preferably three organizations and at most two cards per organization when evidence permits. Do not fill quotas.
- Start external discovery before archive lookup. Use stable IDs/canonical URLs for cheap deduplication; inspect both language archives and contentEntries before declaring a formal candidate unwritten.
- Separate **exploration leads** from **formal writing candidates**. Leads may have unknown evidence, but must have an actual linked source and an honest question. They are never write-now recommendations. Formal Blog candidates require 23–25/25, evidenceQuality >= 3 and readerInterest >= 4; formal Paper candidates require 28–30/30 and evidenceQuality >= 3 under the v2 rubric. Do not inflate scores.
- Read the actual primary source and the technical material needed for the proposed claim. Separate source-reported numbers, independent verification and inference. A runnable demo proves only what it demonstrates; code availability is not independent reproduction. Unchecked numerical claims cannot support formal admission.
- Same source with no material verified update: do not recommend again within seven days. Compare mechanism and reader question too, not just titles. Prefer a different topic when the previous three presented cards share a topic; if no alternative is credible, show fewer cards. Never invent personal feedback.

## Daily storage and site protection

**Legacy live-prompt migration guard:** If the received scheduled prompt still limits daily writes to the old Blog/Paper Radar directories and does not explicitly authorize the independent inbox, treat that run as entirely read-only. Do not use the old allowance to write shared ledgers, and do not infer wider write permission from these repository rules. Report `live-prompt-migration-pending`; research and reporting may continue under the old prompt's narrower topic/time limits, but no research file or automation memory is written. Only after the live prompt explicitly authorizes the inbox does the storage workflow below apply. This guard does not permit changing the live prompt, settings or permissions.

Daily research writes **only** to `/Users/cfh00896102/.codex/automations/bloss0m-daily-frontier-watch/candidate-inbox/`, using the append-only helper and output contract in `skills/bloss0m-frontier-watch/references/candidate-inbox.md`. A unique run file is created exclusively, never overwritten. A separate immutable feedback event records only explicit user decisions; daily research cannot fabricate or rewrite those decisions. No shared ledger is written by the daily job, even in a clean worktree.

Read site state for deduplication, but never stash, reset, clean, overwrite or commit user work. Any unrelated dirty path blocks writes to the website, including import; it does **not** block saving research in the dedicated inbox. The daily job does not modify site files, automation.toml, memory.md, scripts or app settings. Validate the batch before saving; if validation fails, leave it unsaved and report the exact issue. Never install dependencies, generate images, build the site, run paid experiments or invoke a second automation.

A later explicit human decision naming the candidate and action is required to import into formal Radar. `collect` feedback means save, not import or publish. Import must recheck source changes, bilingual coverage, current hashes and Git status; preserve existing human notes and edits, stop on conflicting or unrelated dirty paths, and validate Radar before/after the complete batch. Research state and `want-write` feedback are not publication authorization.

## Daily report (Traditional Chinese)

1. Lead with **at most three cards**, ordered by curiosity, meaningful novelty and the author's explicit feedback; scores are supporting evidence, not the sole order. Each card states: surprise, unresolved question, reason to explore, a way to understand or optionally try it (cost/requirements if known), possible writing angle, confirmed facts with sources, unknowns, and lead/formal status. Experiments are optional and must not be executed automatically.
2. Brief research notes: actual windows, publication/discovery dates, sources opened, formal score rationales if applicable, coverage gaps and rejection reasons. Distinguish verified rejection, unverified lead and no lead found; zero recommendations is valid.
3. Storage/validation: saved run path, suppression reasons, preserved feedback and any blockers. Confirm no website/publication actions occurred. Do not repeat a five-item backlog daily or pad empty lanes.

## Weekly and publication boundaries

An explicitly invoked weekly review may read the inbox and formal Radar, and write only `ops/editorial/editorial-reviews/YYYY-Www.md` when safe. Preserve human decisions; at most ten qualified candidates and two Paper Deep Reads, no quotas. It must not import a lead without a named human import decision.

Only explicit approval of a named topic hands work to `$publish-bilingual-ai-blog` or `$publish-bilingual-paper-reading`. Follow both strict Paper audits and the canonical seven-question semantic teach-back before a publication PR or published state. Failed gates remain needs-revision. Commit, push, publish and merge require their own authorization.
