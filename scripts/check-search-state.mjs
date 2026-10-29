import assert from 'node:assert/strict';
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
assert.ok(chrome, 'Chrome is required for search-state browser checks');

const mime = (path) => path.endsWith('.js') ? 'text/javascript'
  : path.endsWith('.css') ? 'text/css'
    : path.endsWith('.json') ? 'application/json'
      : path.endsWith('.webp') ? 'image/webp'
        : path.endsWith('.svg') ? 'image/svg+xml'
          : 'text/html';
const server = createServer(async (request, response) => {
  try {
    let path = resolve(dist, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
    assert.ok(path === dist || path.startsWith(`${dist}${sep}`));
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    response.writeHead(200, { 'Content-Type': mime(path) });
    response.end(await readFile(path));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ headless: true, executablePath: chrome, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function createPage() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    // Exercise the production bundle without sending analytics or loading embeds.
    if (new URL(request.url()).origin !== base) return request.abort();
    return request.continue();
  });
  return page;
}


async function waitForResults(page, count) {
  await page.waitForFunction((expected) => {
    const summary = document.querySelector('#site-search-summary').textContent;
    return !/Searching|搜尋中|temporarily unavailable|暫時無法使用/.test(summary)
      && document.querySelectorAll('#site-search-results > li').length === expected;
  }, {}, count);
}

async function setQuery(page, query) {
  await page.$eval('#site-search-input', (input, value) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, query);
}

try {
  for (const prefix of ['', '/en']) {
    const page = await createPage();
    let indexRequests = 0;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === `${prefix}/search/data.json`) indexRequests += 1;
    });
    await page.goto(`${base}${prefix}/search/?campaign=fixture#results`, { waitUntil: 'networkidle0' });
    await waitForResults(page, 12);
    assert.equal(indexRequests, 0, 'default search must retain lazy index fetching');
    const initialHistoryLength = await page.evaluate(() => history.length);
    await setQuery(page, 'Agen');
    await setQuery(page, 'Agent');
    await waitForResults(page, 12);
    assert.equal(await page.evaluate(() => history.length), initialHistoryLength, 'typing must replace the current history entry');
    await page.select('#site-search-type', 'blog');
    await waitForResults(page, 12);
    await page.click('#site-search-more');
    await waitForResults(page, 24);
    const sharedUrl = page.url();
    const state = new URL(sharedUrl);
    assert.equal(state.pathname, `${prefix}/search/`);
    assert.equal(state.searchParams.get('q'), 'Agent');
    assert.equal(state.searchParams.get('type'), 'blog');
    assert.equal(state.searchParams.get('page'), '2');
    assert.equal(state.searchParams.get('campaign'), 'fixture');
    assert.equal(state.hash, '#results');

    await page.goBack();
    await waitForResults(page, 12);
    assert.equal(new URL(page.url()).searchParams.has('page'), false);
    await page.goForward();
    await waitForResults(page, 24);
    await page.reload({ waitUntil: 'networkidle0' });
    await waitForResults(page, 24);
    assert.equal(await page.$eval('#site-search-input', (input) => input.value), 'Agent');
    assert.equal(await page.$eval('#site-search-type', (input) => input.value), 'blog');
    const share = await createPage();
    await share.goto(sharedUrl, { waitUntil: 'networkidle0' });
    await waitForResults(share, 24);
    assert.equal(await share.$eval('#site-search-input', (input) => input.value), 'Agent');
    await share.close();

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('#site-search-results a'),
    ]);
    await page.goBack({ waitUntil: 'networkidle0' });
    await waitForResults(page, 24);
    assert.equal(page.url(), sharedUrl, 'returning from a result must restore the exact search state');
    await page.click('#site-search-reset');
    await waitForResults(page, 12);
    assert.equal(new URL(page.url()).search, '?campaign=fixture');
    assert.equal(new URL(page.url()).hash, '#results');

    await page.goto(`${base}${prefix}/search/?type=unsupported&page=-100&campaign=fixture`, { waitUntil: 'networkidle0' });
    await waitForResults(page, 12);
    assert.equal(new URL(page.url()).search, '?campaign=fixture');
    await page.goto(`${base}${prefix}/search/?q=no-match-search-state-fixture&page=999`, { waitUntil: 'networkidle0' });
    await waitForResults(page, 0);
    assert.equal(new URL(page.url()).searchParams.has('page'), false, 'oversized page must clamp to actual result count');
    assert.equal(await page.$eval('#site-search-empty', (element) => element.hidden), false);
    await page.close();

    const retry = await createPage();
    let failIndex = true;
    retry.removeAllListeners('request');
    retry.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin !== base) return request.abort();
      if (url.pathname === `${prefix}/search/data.json` && failIndex) {
        return request.respond({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return request.continue();
    });
    await retry.goto(`${base}${prefix}/search/?q=Agent&type=blog&page=2`, { waitUntil: 'networkidle0' });
    await retry.waitForFunction(() => /temporarily unavailable|暫時無法使用/.test(document.querySelector('#site-search-summary').textContent));
    assert.equal(new URL(retry.url()).searchParams.get('page'), '2', 'failed loading must not discard requested state');
    failIndex = false;
    await setQuery(retry, 'Agent');
    await waitForResults(retry, 12);
    assert.equal(new URL(retry.url()).searchParams.has('page'), false);
    await retry.close();
  }
  console.log('Search-state checks passed: bilingual lazy loading, sharing, reload, result return, back/forward, reset, malformed state and retry.');
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
