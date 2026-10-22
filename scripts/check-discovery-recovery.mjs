import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import puppeteer from 'puppeteer-core';

const dist = resolve('dist');
const chrome = [
  process.env.CHROME_PATH,
  process.env.LHCI_CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/snap/bin/chromium',
].find((candidate) => candidate && existsSync(candidate));
assert.ok(chrome, 'Chrome is required for the mobile layout check');

const mime = (path) => path.endsWith('.css') ? 'text/css'
  : path.endsWith('.js') ? 'text/javascript'
    : path.endsWith('.json') ? 'application/json'
      : path.endsWith('.webp') ? 'image/webp'
        : path.endsWith('.svg') ? 'image/svg+xml'
          : 'text/html';

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let path = resolve(dist, `.${pathname}`);
    assert.ok(path === dist || path.startsWith(`${dist}${sep}`));
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    const body = await readFile(path);
    const compressed = path.endsWith('.json') && /gzip/.test(request.headers['accept-encoding'] ?? '');
    response.writeHead(200, { 'Content-Type': mime(path), ...(compressed ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}) });
    response.end(compressed ? gzipSync(body) : body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));

const browser = await puppeteer.launch({ headless: true, executablePath: chrome, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const base = `http://127.0.0.1:${server.address().port}`;
const timings = [];
try {
  for (const prefix of ['', '/en']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    let failPage = true;
    let failEssence = true;
    const calls = new Map();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === `${prefix}/paper-reading/data/3.json`) {
        calls.set(url.pathname, (calls.get(url.pathname) ?? 0) + 1);
        if (failPage) return request.respond({ status: 404, contentType: 'application/json', body: '{}' });
      } else if (/\/paper-reading\/data\/\d+\.json$/.test(url.pathname)) calls.set(url.pathname, (calls.get(url.pathname) ?? 0) + 1);
      if (url.pathname.includes('/data/essence/') && failEssence) return request.respond({ status: 500, body: '{}' });
      return request.continue();
    });
    await page.goto(`${base}${prefix}/paper-reading/`, { waitUntil: 'networkidle0' });
    const total = await page.$eval('#paper-list-more', (el) => Number(el.dataset.totalCount));
    const started = performance.now();
    await page.click('#paper-list-more');
    await page.type('#filter-query', 'RAGSieve');
    await page.waitForFunction(() => document.querySelector('#paper-reading-list').getAttribute('aria-busy') === 'false' && !document.querySelector('#paper-list-error').hidden);
    const partial = await page.evaluate(() => ({
      count: document.querySelectorAll('[data-paper-reading-item="1"]').length,
      text: document.querySelector('#paper-reading-summary').textContent,
      moreVisible: getComputedStyle(document.querySelector('#paper-list-more')).display !== 'none',
    }));
    assert.equal(partial.count, total - 24);
    assert.match(partial.text, /Partial results|部分結果/);
    assert.equal(partial.moreVisible, true);
    failPage = false;
    await page.click('#paper-list-retry');
    await page.waitForFunction(() => document.querySelector('#paper-list-error').hidden && getComputedStyle(document.querySelector('#paper-list-more')).display === 'none');
    assert.equal(await page.$$eval('[data-paper-reading-item="1"]', (els) => new Set(els.map((el) => el.querySelector('details').dataset.paperEssence)).size), total);
    assert.equal(calls.get(`${prefix}/paper-reading/data/3.json`), 2);
    for (const [url, count] of calls) if (!url.endsWith('/3.json')) assert.equal(count, 1, url);
    const finalText = await page.$eval('#paper-reading-summary', (el) => el.textContent);
    assert.match(finalText, /result\(s\) across|筆結果，已搜尋/);
    timings.push({ route: `${prefix}/paper-reading/`, searchAndFailedRetryMs: Math.round(performance.now() - started) });
    await page.click('#filter-reset');
    await page.click('.paper-essence summary');
    await page.waitForSelector('[data-essence-error]');
    failEssence = false;
    await page.click('.paper-essence summary');
    await page.click('.paper-essence summary');
    await page.waitForSelector('.paper-essence dl');
    assert.equal(await page.$$eval('[data-essence-error]', (els) => els.length), 0);
    const requests = [...calls.values()].reduce((sum, value) => sum + value, 0);
    await page.type('#filter-query', 'no-match-zzzz');
    await page.waitForFunction(() => /0 result|0 筆/.test(document.querySelector('#paper-reading-summary').textContent));
    assert.equal([...calls.values()].reduce((sum, value) => sum + value, 0), requests);
    await page.close();
    const search = await browser.newPage();
    let failSearch = true;
    let searchRequests = 0;
    await search.setRequestInterception(true);
    search.on('request', (request) => {
      if (new URL(request.url()).pathname === `${prefix}/search/data.json`) {
        searchRequests += 1;
        if (failSearch) return request.respond({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return request.continue();
    });
    await search.goto(`${base}${prefix}/search/`, { waitUntil: 'networkidle0' });
    await search.type('#site-search-input', 'B');
    await search.waitForFunction(() => /temporarily unavailable|暫時無法使用/.test(document.querySelector('#site-search-summary').textContent));
    failSearch = false;
    const searchStarted = performance.now();
    await search.type('#site-search-input', 'enchling');
    await search.waitForFunction(() => document.querySelector('#site-search-results').textContent.includes('Benchling'));
    assert.equal(searchRequests, 2);
    timings.push({ route: `${prefix}/search/`, compactSearchRetryMs: Math.round(performance.now() - searchStarted) });
    await search.close();
    const coldContext = await browser.createBrowserContext();
    const cold = await coldContext.newPage();
    await cold.goto(`${base}${prefix}/search/`, { waitUntil: 'networkidle0' });
    const coldStarted = performance.now();
    await cold.type('#site-search-input', 'Benchling');
    await cold.waitForFunction(() => document.querySelector('#site-search-results').textContent.includes('Benchling'));
    const transfer = await cold.evaluate(() => {
      const entry = performance.getEntriesByType('resource').find((item) => item.name.endsWith('/search/data.json'));
      return { encodedBodyBytes: entry.encodedBodySize, decodedBodyBytes: entry.decodedBodySize, transferBytes: entry.transferSize };
    });
    assert.ok(transfer.encodedBodyBytes < transfer.decodedBodyBytes);
    assert.ok(transfer.transferBytes > 0, 'Cold search must transfer data over the test server');
    timings.push({ route: `${prefix}/search/`, coldFirstSearchMs: Math.round(performance.now() - coldStarted), localGzipTransfer: transfer });
    await coldContext.close();
  }
  console.log('Bilingual browser checks passed: partial-page counts, concurrent requests, retry deduplication, complete empty results and summary retry.');
  console.log(JSON.stringify(timings));
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
