# CI validation scope and cost

## Observed cost

The completed [54a19fc deployment run](https://github.com/poirotw66/poirotw66.github.io/actions/runs/40924170018) spent 8 seconds on unit tests, 130 seconds building, 47 seconds on discovery/analytics/mobile browser checks, and 196 seconds on Lighthouse. The following [74b4c0c run](https://github.com/poirotw66/poirotw66.github.io/actions/runs/40925754480) took 14 seconds for units and 210 seconds building when inspected. These are individual observations, not performance guarantees.

A sequential local comparison before adding the release verifier took 24.47 seconds for the previous 33 npm commands and 6.51 seconds for the consolidated entry. This was one local sample on the same machine; it does not predict GitHub runner timing. The consolidated run also included the previously omitted topic, internal-link and pagination fixtures.

## Decisions

- Keep negative and edge-case fixtures. A build against valid content cannot prove a broken validator still rejects missing links, unknown topics or invalid page sizes.
- Run fixture units through `npm run test:unit`. `scripts/test-ci-unit.mjs` lists files explicitly and caps concurrency at two, retaining Node's per-file isolation without 33 npm wrappers. Individual feature commands remain available locally.
- Run the live-corpus reading-path completeness check once, inside `check:site` during build. It is deliberately absent from the unit runner.
- Include the existing topic, internal-link and pagination fixtures in the consolidated entry. Remove the pagination case that merely fixes the page-size constant at 24; retain actual partitioning, empty input and invalid-size behavior.
- Include four release readback cases because successful HTTP alone cannot distinguish stale/mixed deployments, malformed payloads and missing assets.
- Keep build/link/image/content gates and browser behavior checks. Do not infer that different layers are redundant merely because they read the same content.
- Keep the current Lighthouse scope and three-sample PR policy in this change. Its broad Markdown trigger is a larger future cost lever, but narrowing it changes performance coverage and deserves a separate decision.

The shared validation job has a 20-minute timeout. The deploy/readback job has a 15-minute timeout, allowing the Pages deployment timeout and bounded propagation retries. A readback failure marks the workflow failed after publication; it does not automatically roll back an already published site.

## Maintaining coverage

Add meaningful fixture files to the explicit unit list; avoid broad globbing that could run Chrome/dist-dependent tests before build. Browser suites still run after build. The release manifest is produced only after final optimization and validation, before uploading the Pages artifact. Production readback then checks the expected commit and a bounded output sample; see [deployment verification](./DEPLOYMENT-VERIFICATION.md).
