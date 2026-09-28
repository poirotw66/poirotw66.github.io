# Five-Article Editorial Batch Manifest

- Batch date: 2026-09-28 (Asia/Taipei)
- Coordinator: primary task
- Baseline commit: `3455d06`
- Requested worker model: `gpt-6-luna`, reasoning `high`
- Dispatch rule: one worker owns exactly one article row below; do not choose or change IDs, slugs, filenames, or another worker's scope.
- Publication skills: `publish-bilingual-paper-reading` for #76–77; `publish-bilingual-ai-blog` for #123–125.
- Existing user/scheduler changes preserved at dispatch: the two Radar ledgers and five dated briefs listed in the task's pre-dispatch `git status`.

## Assignments and reserved outputs

| Worker | Type / ID | Stable basename | Primary source | Traditional Chinese | English | Reserved assets |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Paper Reading #76 | `76-specifications-not-agents-sign-off` | https://arxiv.org/abs/2609.29921 (v1) | `src/content/paperReading/76-specifications-not-agents-sign-off.md` | `src/content/paperReading/en/76-specifications-not-agents-sign-off.md` | `public/paperReading/76-specifications-not-agents-sign-off/**` |
| 2 | Paper Reading #77 | `77-llm-agents-can-easily-tamper-with-traces` | https://arxiv.org/abs/2609.30266 (v1); https://github.com/aisa-group/perfect-crime | `src/content/paperReading/77-llm-agents-can-easily-tamper-with-traces.md` | `src/content/paperReading/en/77-llm-agents-can-easily-tamper-with-traces.md` | `public/paperReading/77-llm-agents-can-easily-tamper-with-traces/**` |
| 3 | Blog #123 | `123-microsoft-run-assert-eval-risk-to-runtime-governance` | https://commandline.microsoft.com/run-assert-eval-responsible-ai-agent-risk-discovery-at-runtime/ | `src/content/blog/123-microsoft-run-assert-eval-risk-to-runtime-governance.md` | `src/content/blog/en/123-microsoft-run-assert-eval-risk-to-runtime-governance.md` | `public/blog/123-microsoft-run-assert-eval-risk-to-runtime-governance/**` |
| 4 | Blog #124 | `124-docker-sandbox-kit-authority-as-code` | https://www.docker.com/blog/docker-sandbox-kit-spec/; https://github.com/docker/sandbox-kit-spec | `src/content/blog/124-docker-sandbox-kit-authority-as-code.md` | `src/content/blog/en/124-docker-sandbox-kit-authority-as-code.md` | `public/blog/124-docker-sandbox-kit-authority-as-code/**` |
| 5 | Blog #125 | `125-anthropic-project-swap-agent-market-preference` | https://www.anthropic.com/research/project-swap | `src/content/blog/125-anthropic-project-swap-agent-market-preference.md` | `src/content/blog/en/125-anthropic-project-swap-agent-market-preference.md` | `public/blog/125-anthropic-project-swap-agent-market-preference/**` |

## Worker boundaries

Workers may edit only their row's two Markdown files and reserved asset directory. For Blog posts, deliver one original 1200 × 750 `title_image.webp`; for Paper Readings, deliver one original 1200 × 750 Evidence Atlas `title_image.webp` and the source-licensed original-paper body figures or clearly labeled original explanatory figures required by the skill. Verify all image reuse rights and add source/figure attribution. Do not create responsive cover derivatives; the coordinator build owns those.

Workers must read and follow their complete assigned skill and its required references, verify the primary source and any cited artifact, write a substantive bilingual pair, and run only the assigned basename-scoped audits. Paper Reading workers must also complete the strict figure audit, strict pair/comprehension audits, semantic teach-back, and final reader-facing review. Blog workers must run the new-pair audit and inspect links, figures, callouts, and bilingual parity.

Workers must not edit this manifest, either Radar ledger or any Radar brief, shared skills/configuration, another article, or files outside their row. Do not install dependencies, run repository-wide checks or builds, create responsive assets, commit, push, open a PR, or publish. Report only `filesModified`, `localChecks`, `blockers`, and `status`, with concise evidence and no terminal transcript.

## Coordinator gates

After all five deliveries, review complete saved pairs and assets, repair only within the assigned outputs, update the five exact Radar entries' `contentEntries` and status after all gates pass, then run `npm run check:editorial` and `npm run build` once. Review the complete diff and stage only this manifest, the five article pairs and their reserved assets, the five Radar briefs, and the two Radar ledgers. Commit and push only after coordinator review and successful gates; do not create a PR or claim a deployed-page check without direct evidence.
