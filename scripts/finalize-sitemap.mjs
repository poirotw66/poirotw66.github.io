/**
 * Post-build pass over the generated sitemap.
 *
 * `@astrojs/sitemap` emits every static route with no extra signal. Search
 * Console then reports thin or non-indexable routes as "crawled - currently not
 * indexed", and has no `lastmod` to decide what is worth recrawling. This pass
 * reads the built HTML — the single source of truth for what each page declares
 * — and rewrites the sitemap so it only advertises indexable URLs, carries a
 * `lastmod` per URL, and annotates the zh/en pair with hreflang alternates.
 *
 * Nothing here changes what is deployed: dropped URLs stay on disk and stay
 * crawlable, they are simply not submitted to search engines.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DIST = path.resolve('dist');
const SITE_ORIGIN = 'https://www.bloss0m.com';

const XHTML_NS = 'http://www.w3.org/1999/xhtml';

/** Reads the `<loc>` values of a sitemap document, in document order. */
export function parseLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1]);
}

/** True when the built page asks search engines not to index it. */
export function isNoindex(html) {
  const meta = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  return Boolean(meta && /\bnoindex\b/i.test(meta[1]));
}

/**
 * Best available modification date for a page.
 *
 * Article routes carry `dateModified` / `datePublished` in their JSON-LD; hubs
 * carry neither and inherit the newest date below their path instead.
 */
export function readPageDate(html) {
  const modified = html.match(/"dateModified":"([^"]+)"/);
  if (modified) return modified[1];
  const published = html.match(/"datePublished":"([^"]+)"/);
  return published ? published[1] : undefined;
}

/** Maps a sitemap URL to the built file that serves it. */
export function distPathForUrl(url, dist = DEFAULT_DIST) {
  const { pathname } = new URL(url);
  const relative = pathname.replace(/^\/+/, '');
  if (relative === '' || relative.endsWith('/')) {
    return path.join(dist, relative, 'index.html');
  }
  // A last segment with an extension (feed.xml, index.json) is already a file;
  // everything else is a directory route served by its index.html.
  const hasExtension = path.extname(relative) !== '';
  return path.join(dist, hasExtension ? relative : `${relative}/index.html`);
}

/** `/en/blog/x/` and `/blog/x/` are the same page in two languages. */
export function zhPathOf(pathname) {
  return pathname === '/en/' ? '/' : pathname.replace(/^\/en\//, '/');
}

/** Newest descendant date, used as the `lastmod` of a hub that has none itself. */
function inheritedDate(pathname, dates) {
  let newest;
  for (const [candidate, date] of dates) {
    if (candidate === pathname || !candidate.startsWith(pathname)) continue;
    if (!newest || date > newest) newest = date;
  }
  return newest;
}

/**
 * Decides the final sitemap entries.
 *
 * @param {string[]} locs absolute URLs emitted by `@astrojs/sitemap`
 * @param {(url: string) => string | undefined} readHtml built HTML for a URL
 * @returns {{ entries: Array<{loc: string, lastmod?: string, links?: Array<{hreflang: string, href: string}>}>, dropped: string[] }}
 */
export function buildEntries(locs, readHtml) {
  const dropped = [];
  const kept = [];
  const ownDates = new Map();

  for (const loc of locs) {
    const pathname = new URL(loc).pathname;
    if (pathname.endsWith('/index.html') || /\.(json|xml)$/i.test(pathname)) {
      dropped.push(loc);
      continue;
    }
    const html = readHtml(loc);
    if (html === undefined) {
      dropped.push(loc);
      continue;
    }
    if (isNoindex(html)) {
      dropped.push(loc);
      continue;
    }
    const date = readPageDate(html);
    if (date) ownDates.set(pathname, date);
    kept.push({ loc, pathname });
  }

  const keptPaths = new Set(kept.map((entry) => entry.pathname));

  const entries = kept.map(({ loc, pathname }) => {
    const entry = { loc };

    const lastmod = ownDates.get(pathname) ?? inheritedDate(pathname, ownDates);
    if (lastmod) entry.lastmod = lastmod;

    const zhPath = zhPathOf(pathname);
    const enPath = zhPath === '/' ? '/en/' : `/en${zhPath}`;
    if (keptPaths.has(zhPath) && keptPaths.has(enPath)) {
      const origin = new URL(loc).origin;
      entry.links = [
        { hreflang: 'zh-Hant', href: `${origin}${zhPath}` },
        { hreflang: 'en', href: `${origin}${enPath}` },
        { hreflang: 'x-default', href: `${origin}${zhPath}` },
      ];
    }

    return entry;
  });

  return { entries, dropped };
}

const escapeXml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Serializes entries back into a sitemap document. */
export function renderSitemap(entries) {
  const body = entries
    .map((entry) => {
      const parts = [`<loc>${escapeXml(entry.loc)}</loc>`];
      if (entry.lastmod) parts.push(`<lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      for (const link of entry.links ?? []) {
        parts.push(
          `<xhtml:link rel="alternate" hreflang="${escapeXml(link.hreflang)}" href="${escapeXml(link.href)}"/>`,
        );
      }
      return `<url>${parts.join('')}</url>`;
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    `xmlns:xhtml="${XHTML_NS}">` +
    body +
    '</urlset>'
  );
}

function finalize(dist = DEFAULT_DIST) {
  const sitemaps = fs
    .readdirSync(dist)
    .filter((name) => /^sitemap-\d+\.xml$/.test(name))
    .map((name) => path.join(dist, name));

  if (sitemaps.length === 0) {
    throw new Error(`No sitemap-<n>.xml found in ${dist}. Did astro build run?`);
  }

  const readHtml = (url) => {
    const file = distPathForUrl(url, dist);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined;
  };

  // Build every file's entries from one pass so hreflang pairing still works
  // when Astro splits the sitemap across several documents.
  const locsByFile = new Map(sitemaps.map((file) => [file, parseLocs(fs.readFileSync(file, 'utf8'))]));
  const { entries, dropped } = buildEntries([...locsByFile.values()].flat(), readHtml);
  const entryByLoc = new Map(entries.map((entry) => [entry.loc, entry]));

  if (entries.length === 0) {
    throw new Error('Every sitemap URL was withheld — refusing to write an empty sitemap.');
  }

  for (const [file, locs] of locsByFile) {
    const fileEntries = locs.map((loc) => entryByLoc.get(loc)).filter(Boolean);
    fs.writeFileSync(file, renderSitemap(fileEntries));
  }

  for (const loc of dropped) {
    console.log(`  dropped ${loc.replace(SITE_ORIGIN, '')}`);
  }

  const withLastmod = entries.filter((entry) => entry.lastmod).length;

  console.log(
    `Sitemap finalized: ${entries.length} URLs submitted (${withLastmod} with lastmod), ${dropped.length} noindex URLs withheld.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    finalize();
  } catch (error) {
    console.error(`Sitemap finalize failed: ${error.message}`);
    process.exit(1);
  }
}

export { finalize };
