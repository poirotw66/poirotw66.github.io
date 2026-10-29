import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { writeReleaseManifest, releaseFile } from './write-release-manifest.mjs';
import { verifyDeployment } from './verify-deployment.mjs';
import { encodeSearchItems } from '../public/js/search-index-codec.js';

const SHA = 'a'.repeat(40);

async function fixture(t, intercept = () => false) {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'release-readback-'));
  const write = (route, data) => {
    const file = releaseFile(dist, route);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data));
  };
  for (const prefix of ['', '/en']) {
    const lang = prefix ? 'en' : 'zh-Hant';
    const html = `<html lang="${lang}"><head><link href="/css/site.css" rel="stylesheet"></head><body><script src="/js/site.js"></script></body></html>`;
    for (const route of [`${prefix}/`, `${prefix}/search/`, `${prefix}/paper-reading/sample/`]) write(route, html);
    write(`${prefix}/search/data.json`, encodeSearchItems([{ type: 'paperReading', title: 'Paper', description: 'Evidence', url: `${prefix}/paper-reading/sample/`, date: '2026-10-30', tags: [], category: 'AI' }]));
    write(`${prefix}/paper-reading/data/essence/sample.json`, [['Problem', 'Question']]);
  }
  write('/css/site.css', 'body { color: black; }');
  write('/js/site.js', 'console.log("fixture");');
  const manifest = writeReleaseManifest({ dist, sha: SHA });
  const server = createServer((request, response) => {
    if (intercept(request, response, manifest)) return;
    const route = new URL(request.url, 'http://localhost').pathname;
    const file = releaseFile(dist, route);
    if (!fs.existsSync(file)) { response.writeHead(404); response.end('Missing'); return; }
    response.writeHead(200);
    response.end(fs.readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dist, { recursive: true, force: true });
  });
  return { dist, write, manifest, url: `http://127.0.0.1:${server.address().port}` };
}

const verify = (site, options = {}) => verifyDeployment({ url: site.url, sha: SHA, attempts: 1, timeoutMs: 1000, delayMs: 0, ...options });

test('release readback verifies final bilingual pages, compact search, summaries and referenced assets', async (t) => {
  const site = await fixture(t);
  assert.deepEqual(await verify(site), { sha: SHA, files: 12, attempts: 1 });
  assert.equal(JSON.parse(fs.readFileSync(path.join(site.dist, 'release.json'), 'utf8')).sha, SHA);
});

test('an old release version is retried but cannot be reported as the expected release', async (t) => {
  let manifestCalls = 0;
  const site = await fixture(t, (request, response, manifest) => {
    if (request.url !== '/release.json') return false;
    response.end(JSON.stringify({ ...manifest, sha: ++manifestCalls === 1 ? 'b'.repeat(40) : SHA }));
    return true;
  });
  const retry = [];
  assert.equal((await verify(site, { attempts: 2, onRetry: (item) => retry.push(item) })).attempts, 2);
  assert.equal(retry.length, 1);
  await assert.rejects(verify(site, { sha: 'c'.repeat(40) }), /Release SHA mismatch/);
});

test('missing routes, successful HTTP with wrong bytes, and upstream errors fail verification', async (t) => {
  const site = await fixture(t);
  fs.unlinkSync(releaseFile(site.dist, '/en/search/'));
  await assert.rejects(verify(site), /HTTP 404/);
  site.write('/en/search/', '<html lang="en">Wrong version</html>');
  await assert.rejects(verify(site), /does not match release/);
  const unavailable = await fixture(t, (_request, response) => { response.writeHead(503); response.end('Unavailable'); return true; });
  await assert.rejects(verify(unavailable), /HTTP 503/);
});

test('untrusted manifest routes and invalid semantic payloads cannot pass', async (t) => {
  const site = await fixture(t);
  const manifestFile = path.join(site.dist, 'release.json');
  const unsafe = structuredClone(site.manifest);
  unsafe.entries[0].path = '//outside.example/page';
  fs.writeFileSync(manifestFile, JSON.stringify(unsafe));
  await assert.rejects(verify(site), /Invalid release entry/);
  site.write('/en/search/', '<html lang="zh-Hant">Wrong language</html>');
  writeReleaseManifest({ dist: site.dist, sha: SHA });
  await assert.rejects(verify(site), /wrong HTML language/);
  site.write('/en/search/', '<html lang="en">Search</html>');
  site.write('/en/search/data.json', { version: 1, items: [] });
  writeReleaseManifest({ dist: site.dist, sha: SHA });
  await assert.rejects(verify(site), /Invalid search index/);
});
