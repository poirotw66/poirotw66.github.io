import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];
const LOCALES = [
  { path: '/', expectedTitle: '目前正在推進的工作', expectedCtaHref: '/now/', expectedStatusCount: 2 },
  { path: '/en/', expectedTitle: 'Work currently in progress', expectedCtaHref: '/en/now/', expectedStatusCount: 2 },
];
const THEMES = ['warm', 'dark'];

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/snap/bin/chromium',
];

function contentTypeFor(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.webp')) return 'image/webp';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.woff2')) return 'font/woff2';
  return 'application/octet-stream';
}

export function isPathInside(parentDir, candidatePath) {
  const relative = path.relative(parentDir, candidatePath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function resolveDistFile(urlPath, rootDir = distDir) {
  let cleaned;
  try {
    cleaned = decodeURIComponent((urlPath ?? '/').split('?')[0].split('#')[0]);
  } catch {
    return null;
  }

  const relative = cleaned === '/' ? 'index.html' : cleaned.replace(/^\//, '').replace(/\/$/, '/index.html');
  const candidate = path.normalize(path.join(rootDir, relative));
  if (!isPathInside(rootDir, candidate)) {
    return null;
  }
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }
  const htmlSibling = `${candidate}.html`;
  if (fs.existsSync(htmlSibling) && fs.statSync(htmlSibling).isFile()) {
    return htmlSibling;
  }
  return null;
}

export function resolveChromeExecutable(
  env = process.env,
  existsSync = fs.existsSync,
  candidates = CHROME_CANDIDATES,
) {
  const fromEnv = env.CHROME_PATH ?? env.LHCI_CHROME_PATH;
  if (fromEnv) {
    if (!existsSync(fromEnv)) {
      throw new Error(`Chrome executable not found at ${fromEnv}`);
    }
    return fromEnv;
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Set CHROME_PATH or LHCI_CHROME_PATH to a Chrome executable for Roadmap render checks');
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    const filePath = resolveDistFile(req.url ?? '/');
    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to bind static preview server'));
        return;
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

function isVisibleBox(box, viewport) {
  return (
    box.width > 0 &&
    box.height > 0 &&
    box.bottom > 0 &&
    box.right > 0 &&
    box.top < viewport.height &&
    box.left < viewport.width
  );
}

test('resolveDistFile rejects path escapes and malformed encoding', () => {
  assert.equal(resolveDistFile('/../dist-private/secret.txt'), null);
  assert.equal(resolveDistFile('/%2e%2e/dist-private/secret.txt'), null);
  assert.equal(resolveDistFile('/%'), null);
  assert.equal(isPathInside(distDir, path.join(distDir, 'index.html')), true);
  assert.equal(isPathInside(distDir, path.join(root, 'dist-private', 'secret.txt')), false);
});

test('resolveChromeExecutable prefers env, then portable OS candidates', () => {
  const fakeEnvPath = path.join(root, 'fake-chrome');
  assert.equal(
    resolveChromeExecutable({ CHROME_PATH: fakeEnvPath }, (candidate) => candidate === fakeEnvPath),
    fakeEnvPath,
  );
  assert.equal(
    resolveChromeExecutable({}, (candidate) => candidate === '/usr/bin/google-chrome-stable'),
    '/usr/bin/google-chrome-stable',
  );
  assert.equal(
    resolveChromeExecutable({}, (candidate) => candidate.endsWith('chrome.exe')),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  );
  assert.throws(() => resolveChromeExecutable({}, () => false), /CHROME_PATH|LHCI_CHROME_PATH/);
});

test('homepage Roadmap renders without overflow across viewport, locale, and theme matrix', async (t) => {
  assert.equal(fs.existsSync(distDir), true, 'dist/ is required; run npm run build first');

  const { server, baseUrl } = await startStaticServer();
  let browser;
  t.after(async () => {
    const errors = [];
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        errors.push(error);
      }
    }
    try {
      await new Promise((resolve, reject) => {
        server.close((closeError) => (closeError ? reject(closeError) : resolve()));
      });
    } catch (error) {
      errors.push(error);
    }
    if (errors.length === 1) {
      throw errors[0];
    }
    if (errors.length > 1) {
      throw new AggregateError(errors, 'Failed to clean up Roadmap render resources');
    }
  });

  browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveChromeExecutable(),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  for (const locale of LOCALES) {
    for (const viewport of VIEWPORTS) {
      for (const theme of THEMES) {
        await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
        await page.goto(`${baseUrl}${locale.path}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#roadmap');
        await page.evaluate((nextTheme) => {
          document.documentElement.setAttribute('data-theme', nextTheme);
          document.documentElement.style.scrollBehavior = 'auto';
          const roadmap = document.querySelector('#roadmap');
          if (!roadmap) {
            throw new Error('#roadmap missing after waitForSelector');
          }
          roadmap.scrollIntoView({ block: 'start' });
        }, theme);
        await page.waitForFunction(() => {
          const roadmap = document.querySelector('#roadmap');
          if (!roadmap) {
            return false;
          }
          if (Number(window.getComputedStyle(roadmap).opacity) <= 0) {
            return false;
          }
          const box = roadmap.getBoundingClientRect();
          return (
            box.width > 0 &&
            box.height > 0 &&
            box.bottom > 0 &&
            box.right > 0 &&
            box.top < window.innerHeight &&
            box.left < window.innerWidth
          );
        });

        const result = await page.evaluate(
          ({ expectedTitle, viewportHeight, viewportWidth }) => {
            const roadmap = document.querySelector('#roadmap');
            if (!roadmap) {
              return { ok: false, reason: 'missing #roadmap' };
            }

            const heading = roadmap.querySelector('h2');
            const statusNodes = [...roadmap.querySelectorAll('.home-roadmap-status')];
            const cards = [...roadmap.querySelectorAll('.home-roadmap-card')];
            const cta = roadmap.querySelector('a.btn');
            const docEl = document.documentElement;
            const roadmapStyle = window.getComputedStyle(roadmap);
            const roadmapBox = roadmap.getBoundingClientRect();

            const statuses = statusNodes.map((node) => {
              const style = window.getComputedStyle(node);
              const box = node.getBoundingClientRect();
              return {
                text: node.textContent?.trim() ?? '',
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                width: box.width,
                height: box.height,
              };
            });

            const clippedCards = cards.filter((card) => {
              const box = card.getBoundingClientRect();
              return box.right > roadmapBox.right + 1 || box.left < roadmapBox.left - 1;
            }).length;

            return {
              ok: true,
              heading: heading?.textContent?.trim() ?? '',
              expectedTitle,
              statusCount: statuses.length,
              statuses,
              hasCta: Boolean(cta),
              ctaHref: cta?.getAttribute('href') ?? '',
              ctaTabIndex: cta?.tabIndex ?? null,
              scrollWidth: docEl.scrollWidth,
              clientWidth: docEl.clientWidth,
              theme: docEl.getAttribute('data-theme'),
              roadmapDisplay: roadmapStyle.display,
              roadmapVisibility: roadmapStyle.visibility,
              roadmapOpacity: roadmapStyle.opacity,
              roadmapBox: {
                top: roadmapBox.top,
                left: roadmapBox.left,
                right: roadmapBox.right,
                bottom: roadmapBox.bottom,
                width: roadmapBox.width,
                height: roadmapBox.height,
              },
              viewport: { width: viewportWidth, height: viewportHeight },
              clippedCards,
            };
          },
          {
            expectedTitle: locale.expectedTitle,
            viewportHeight: viewport.height,
            viewportWidth: viewport.width,
          },
        );

        const label = `${locale.path} ${viewport.name} ${theme}`;
        assert.equal(result.ok, true, `${label}: ${result.reason}`);
        assert.equal(result.heading, locale.expectedTitle, `${label}: heading`);
        assert.equal(result.statusCount, locale.expectedStatusCount, `${label}: status count`);
        assert.ok(
          result.statuses.every(
            (status) =>
              status.text.length > 0 &&
              status.display !== 'none' &&
              status.visibility !== 'hidden' &&
              Number(status.opacity) > 0 &&
              status.width > 0 &&
              status.height > 0,
          ),
          `${label}: status text must remain computed-visible`,
        );
        assert.equal(result.hasCta, true, `${label}: CTA missing`);
        assert.equal(result.ctaHref, locale.expectedCtaHref, `${label}: CTA href must match locale`);
        assert.notEqual(result.ctaTabIndex, -1, `${label}: CTA must be focusable`);
        assert.equal(result.theme, theme, `${label}: theme`);
        assert.notEqual(result.roadmapDisplay, 'none', `${label}: roadmap display`);
        assert.notEqual(result.roadmapVisibility, 'hidden', `${label}: roadmap visibility`);
        assert.ok(Number(result.roadmapOpacity) > 0, `${label}: roadmap opacity`);
        assert.ok(
          isVisibleBox(result.roadmapBox, result.viewport),
          `${label}: roadmap must intersect the viewport`,
        );
        assert.equal(result.clippedCards, 0, `${label}: roadmap cards must not clip outside the section`);
        assert.ok(
          result.scrollWidth <= result.clientWidth + 1,
          `${label}: horizontal overflow ${result.scrollWidth} > ${result.clientWidth}`,
        );

        await page.focus('#roadmap a.btn');
        const activeIsCta = await page.evaluate(() => {
          const cta = document.querySelector('#roadmap a.btn');
          return document.activeElement === cta;
        });
        assert.equal(activeIsCta, true, `${label}: CTA must accept keyboard focus`);
      }
    }
  }
});
