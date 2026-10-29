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
assert.ok(chrome, 'Chrome is required for analytics browser checks');

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

async function analyticsEvents(page, name) {
  return page.evaluate((eventName) => (window.dataLayer ?? [])
    .map((entry) => Array.from(entry))
    .filter((entry) => entry[0] === 'event' && entry[1] === eventName)
    .map((entry) => entry[2]), name);
}

async function toggleDetails(page, selector, open) {
  await page.$eval(selector, (details, nextOpen) => new Promise((done) => {
    if (details.open === nextOpen) return done();
    details.addEventListener('toggle', done, { once: true });
    details.open = nextOpen;
  }), open);
}

try {
  for (const prefix of ['', '/en']) {
    const page = await createPage();
    const response = await page.goto(`${base}${prefix}/paper-reading/`, { waitUntil: 'networkidle0' });
    assert.equal(response.status(), 200);
    const initial = '.paper-essence';
    const initialSlug = await page.$eval(initial, (details) => details.dataset.paperEssence);
    assert.equal((await analyticsEvents(page, 'paper_essence_open')).length, 0);
    await toggleDetails(page, initial, true);
    assert.deepEqual((await analyticsEvents(page, 'paper_essence_open')).map((event) => event.paper_slug), [initialSlug]);
    await toggleDetails(page, initial, false);
    await toggleDetails(page, initial, true);
    assert.equal((await analyticsEvents(page, 'paper_essence_open')).length, 1, 'reopening an initial summary must not double count');

    const initialCount = await page.$$eval('.paper-essence', (details) => details.length);
    await page.click('#paper-list-more');
    await page.waitForFunction((count) => document.querySelectorAll('.paper-essence').length > count, {}, initialCount);
    const dynamicSlug = await page.$$eval('.paper-essence', (details, index) => details[index].dataset.paperEssence, initialCount);
    const dynamic = `[data-paper-essence="${dynamicSlug}"]`;
    await toggleDetails(page, dynamic, true);
    assert.deepEqual((await analyticsEvents(page, 'paper_essence_open')).map((event) => event.paper_slug), [initialSlug, dynamicSlug]);

    await page.type('#filter-query', 'no-match-analytics-fixture');
    await page.waitForFunction(() => document.querySelector('#paper-reading-list').getAttribute('aria-busy') === 'false' && [...document.querySelectorAll('[data-paper-reading-item]')].every((item) => getComputedStyle(item).display === 'none'));
    await page.click('#filter-reset');
    await page.waitForFunction((slug) => getComputedStyle(document.querySelector(`[data-paper-essence="${slug}"]`).closest('[data-paper-reading-item]')).display !== 'none', {}, dynamicSlug);
    await toggleDetails(page, dynamic, false);
    await toggleDetails(page, dynamic, true);
    assert.equal((await analyticsEvents(page, 'paper_essence_open')).length, 2, 'filtering and reopening must not double count');

    await page.$eval(dynamic, (details) => {
      const parent = details.parentNode;
      details.remove();
      parent.appendChild(details);
    });
    await toggleDetails(page, dynamic, false);
    await toggleDetails(page, dynamic, true);
    assert.equal((await analyticsEvents(page, 'paper_essence_open')).length, 2, 'reinserting the same element must not double count');
    await page.evaluate(() => new Promise((done) => {
      const unrelated = document.createElement('details');
      unrelated.id = 'unrelated-details';
      document.body.appendChild(unrelated);
      unrelated.addEventListener('toggle', done, { once: true });
      unrelated.open = true;
    }));
    assert.equal((await analyticsEvents(page, 'paper_essence_open')).length, 2, 'unrelated details must not generate paper analytics');
    await page.close();
  }

  for (const scenario of [
    { name: 'long article', top: 0, height: 4000, initiallyRead: false, nextTop: -2201 },
    { name: 'short visible article', top: 100, height: 400, initiallyRead: true },
    { name: 'short article below the viewport', top: 1200, height: 400, initiallyRead: false, nextTop: 400 },
    { name: 'viewport resize', top: 0, height: 1600, initiallyRead: false, viewportHeight: 1300 },
  ]) {
    const page = await createPage();
    await page.evaluateOnNewDocument(({ top, height }) => {
      window.analyticsArticleGeometry = { top, height };
      const original = HTMLElement.prototype.getBoundingClientRect;
      HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
        if (this.matches('[data-article-reader]')) {
          const geometry = window.analyticsArticleGeometry;
          return new DOMRect(0, geometry.top, 1000, geometry.height);
        }
        return original.call(this);
      };
    }, scenario);
    const response = await page.goto(`${base}/blog/64-ai-agent-guide/`, { waitUntil: 'networkidle0' });
    assert.equal(response.status(), 200);
    assert.equal((await analyticsEvents(page, 'article_read_75')).length, Number(scenario.initiallyRead), scenario.name);
    if (scenario.viewportHeight) {
      await page.setViewport({ width: 1280, height: scenario.viewportHeight });
      await page.waitForFunction(() => (window.dataLayer ?? []).some((entry) => entry[1] === 'article_read_75'));
    } else if (scenario.nextTop !== undefined) {
      await page.evaluate((top) => {
        window.analyticsArticleGeometry.top = top;
        window.dispatchEvent(new Event('scroll'));
      }, scenario.nextTop);
    }
    assert.equal((await analyticsEvents(page, 'article_read_75')).length, 1, `${scenario.name} must report reaching the threshold`);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
    });
    assert.equal((await analyticsEvents(page, 'article_read_75')).length, 1, `${scenario.name} must report only once`);
    await page.close();
  }
  console.log('Analytics checks passed: bilingual initial/dynamic summaries, filtering, deduplication, article depth, and resize.');
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
