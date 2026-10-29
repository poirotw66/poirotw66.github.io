# Deployment readback verification

The deployment workflow should publish one validated artifact, then read the production origin back with the expected Git commit SHA. Successful upload or HTTP 200 alone does not establish that the CDN is serving that artifact.

## Build contract

After every build optimizer and artifact validation, run:

```sh
node scripts/write-release-manifest.mjs --dist=dist --sha=<full-git-sha>
```

This writes `dist/release.json`. CI supplies the exact `github.sha`; the writer also accepts `GITHUB_SHA`, with local Git HEAD as a development fallback. A local dirty build is not a clean-commit release acceptance result.

The versioned manifest records SHA-256 hashes and byte lengths for a bounded sample:

- Traditional Chinese and English home, search and one common paper article page.
- Both compact search indexes and that paper's per-note summary in each language.
- Up to two referenced CSS files, two JavaScript files and two images.

The common paper is selected deterministically from the built per-note files. The manifest is created after minification, so its hashes describe delivered files. It excludes PDFs, external embeds and the rest of the archive. No manifest is included in its own hashes.

## Production contract

After deployment completes, run:

```sh
node scripts/verify-deployment.mjs --url=https://www.bloss0m.com --sha=<full-git-sha> --attempts=6 --delay-ms=10000
```

The verifier requires the manifest SHA to match the expected commit, then fetches every sampled path and compares its length and SHA-256 digest. It also checks page languages, compact search decoding and summary structure. It never executes page JavaScript, sends analytics, follows redirects or visits external origins.

Requests use no-cache semantics, bounded response sizes and request timeouts. The default is four attempts with a ten-second delay; CI can choose up to ten attempts and at most thirty seconds per delay/request. Each retry repeats the version and content checks. An old manifest, mixed cached files, a missing route or a persistent server failure remains a failed verification after the retry budget. CI must retain this failure rather than treating a completed deploy action as acceptance.

Exact hashes deliberately detect CDN HTML or JavaScript rewriting. If an edge transformation is introduced, review this contract before changing it; do not silently ignore mismatches. This is sampled deployment integrity, not end-to-end UI testing, GA delivery confirmation, full-archive validation or a replacement for browser and accessibility tests.

## Focused local tests

```sh
node --test scripts/verify-deployment.test.mjs
```

The tests use a local HTTP server and synthetic built files. They cover a correct bilingual release, a stale manifest followed by propagation, missing routes, changed bytes, server errors, unsafe manifest routes, and invalid language/search data. They do not deploy or send production traffic.
