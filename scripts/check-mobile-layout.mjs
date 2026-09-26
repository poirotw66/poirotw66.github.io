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
    response.writeHead(200, { 'Content-Type': mime(path) });
    response.end(await readFile(path));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));

const browser = await puppeteer.launch({ headless: true, executablePath: chrome, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const base = `http://127.0.0.1:${server.address().port}`;
const page = await browser.newPage();

try {
  await page.setViewport({ width: 390, height: 844 });
  for (const route of [
    '/en/blog/',
    '/paper-reading/',
    '/en/paper-reading/',
    '/blog/100-gemini-3-8-flash-coding-agent-workflow/',
    '/en/blog/100-gemini-3-8-flash-coding-agent-workflow/',
    '/blog/117-benchling-agentcore-multitenant-code-execution/',
    '/search/',
    '/en/search/',
  ]) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle0' });
    assert.equal(response.status(), 200, route);
    const result = await page.evaluate(() => {
      const facts = document.querySelector('.article-facts');
      const date = facts?.querySelector('.article-fact-date');
      const reading = facts?.querySelector('.article-fact-reading');
      const chapters = [...document.querySelectorAll('.article-toc--mobile .article-toc-chapter > a')];
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        currentNav: document.querySelector('.nav-links a[aria-current="page"]')?.getAttribute('href'),
        sections: [...document.querySelectorAll('.hub-section')].slice(0, 3).map((item) => item.id),
        searchTop: document.querySelector('#filter-query')?.getBoundingClientRect().top,
        compactFacts: Boolean(facts?.classList.contains('article-facts--compact')),
        sameDateRow: date && reading ? Math.abs(date.getBoundingClientRect().top - reading.getBoundingClientRect().top) < 4 : null,
        roleCards: [...document.querySelectorAll('.role-comparison-card')].filter((item) => getComputedStyle(item).display !== 'none').length,
        summaryPoints: document.querySelectorAll('.article-brief-tldr--mobile > ul > li').length,
        chapterCount: chapters.length,
        firstChapter: chapters[0]?.textContent?.trim(),
        validChapterTargets: chapters.every((link) => document.getElementById(decodeURIComponent(link.hash.slice(1)))),
        paperThumbnails: [...document.querySelectorAll('#paper-reading-list .blog-list-thumb-img')].slice(0, 8).every((image) => image.getAttribute('src')?.endsWith('-thumb.webp')),
      };
    });
    assert.equal(result.overflow, false, `${route} overflows at 390px`);
    if (route === '/en/blog/') assert.equal(result.currentNav, '/en/blog/');
    if (route.includes('/paper-reading/')) {
      assert.deepEqual(result.sections, ['paper-library', 'research-topics', 'reading-paths']);
      assert.ok(result.searchTop < 844, `${route} search falls below the first viewport`);
      assert.equal(result.paperThumbnails, true, `${route} uses full-size list covers`);
      await page.type('#filter-query', 'RAGSieve');
      const filtered = await page.$$eval('[data-paper-reading-item="1"]', (items) => items.filter((item) => item.style.display !== 'none').length);
      assert.ok(filtered >= 1 && filtered <= 2, `${route} search did not narrow the library`);
    }
    if (route.includes('/blog/100-') || route.includes('/blog/117-')) {
      assert.equal(result.compactFacts, true);
      assert.equal(result.sameDateRow, true);
    }
    if (route.includes('/blog/100-')) {
      assert.equal(result.roleCards, 3);
      assert.equal(result.summaryPoints, 3);
      assert.equal(result.chapterCount, 8);
      assert.equal(result.validChapterTargets, true);
      assert.equal(result.firstChapter, route.startsWith('/en/') ? 'Workstations, not ranks' : '不同模型，不同工作站');
    }
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${route} overflows in dark mode`);
  }

  await page.setViewport({ width: 1280, height: 850 });
  for (const route of [
    '/blog/100-gemini-3-8-flash-coding-agent-workflow/',
    '/blog/117-benchling-agentcore-multitenant-code-execution/',
    '/paper-reading/59-hype-hypothetical-prompt-embeddings/',
  ]) {
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle0' });
    const widths = await page.evaluate(() => ({
      prose: document.querySelector('.article-content').getBoundingClientRect().width,
      header: document.querySelector('.article-header').getBoundingClientRect().width,
      table: document.querySelector('.article-content table')?.getBoundingClientRect().width,
    }));
    assert.ok(widths.prose >= 800 && widths.prose <= 900, `${route} prose width ${widths.prose}`);
    assert.ok(widths.header > widths.prose, `${route} masthead is not wider than prose`);
    if (widths.table) assert.ok(widths.table <= widths.prose + 1, `${route} table exceeds the prose column`);
  }

  for (const route of ['/search/', '/en/search/']) {
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle0' });
    await page.type('#site-search-input', 'Benchling');
    await page.waitForFunction(() => document.querySelector('#site-search-results')?.textContent?.includes('Benchling'));
    assert.ok((await page.$eval('#site-search-results', (item) => item.textContent)).includes('Benchling'));
  }

  console.log('Mobile layout, article width, navigation, paper discovery, and search checks passed.');
} finally {
  await browser.close();
  server.close();
}
