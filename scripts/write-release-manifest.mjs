import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const releaseDigest = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const releaseFile = (dist, route) => path.join(dist, route.endsWith('/') ? `${route}index.html` : route);
const isSafeRoute = (route) => typeof route === 'string' && route.startsWith('/') && !route.startsWith('//')
  && !/[\\?#%]/.test(route) && !route.split('/').some((part) => part === '.' || part === '..');

export function validateReleaseManifest(manifest, expectedSha) {
  if (manifest?.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(manifest.sha) || manifest.sha !== expectedSha) {
    throw new Error(`Release SHA mismatch: expected ${expectedSha}, received ${manifest?.sha ?? 'invalid manifest'}`);
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length < 11 || manifest.entries.length > 24) throw new Error('Invalid release entry count');
  const paths = new Set();
  for (const entry of manifest.entries) {
    if (!isSafeRoute(entry.path) || paths.has(entry.path) || !/^[a-f0-9]{64}$/.test(entry.sha256)
      || !Number.isInteger(entry.bytes) || entry.bytes <= 0 || entry.bytes > 4 * 1024 * 1024
      || !['page', 'search-index', 'paper-essence', 'asset'].includes(entry.role)) throw new Error('Invalid release entry');
    if (entry.role !== 'asset' && !['zh-Hant', 'en'].includes(entry.lang)) throw new Error('Invalid release language');
    paths.add(entry.path);
  }
  for (const prefix of ['', '/en']) {
    const lang = prefix ? 'en' : 'zh-Hant';
    for (const route of [`${prefix}/`, `${prefix}/search/`]) {
      if (!manifest.entries.some((entry) => entry.path === route && entry.role === 'page' && entry.lang === lang)) throw new Error(`Missing release page: ${route}`);
    }
    if (!manifest.entries.some((entry) => entry.path === `${prefix}/search/data.json` && entry.role === 'search-index' && entry.lang === lang)) throw new Error('Missing compact search coverage');
    const article = manifest.entries.find((entry) => entry.role === 'page' && entry.lang === lang && entry.path.startsWith(`${prefix}/paper-reading/`));
    if (!article) throw new Error('Missing paper article coverage');
    const slug = article.path.slice(`${prefix}/paper-reading/`.length).replace(/\/$/, '');
    if (!manifest.entries.some((entry) => entry.path === `${prefix}/paper-reading/data/essence/${slug}.json` && entry.role === 'paper-essence' && entry.lang === lang)) throw new Error('Missing paper essence coverage');
  }
  if (!manifest.entries.some((entry) => entry.role === 'asset')) throw new Error('Missing release assets');
  return manifest;
}

/** Hash a bounded sample of final delivered files, after all build optimizers. */
export function writeReleaseManifest({ dist = path.resolve('dist'), sha } = {}) {
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('An exact 40-character Git SHA is required');
  const directory = path.join(dist, 'paper-reading/data/essence');
  const slug = fs.readdirSync(directory).filter((name) => name.endsWith('.json')).sort()
    .map((name) => name.slice(0, -5)).find((name) => fs.existsSync(path.join(dist, `en/paper-reading/data/essence/${name}.json`)));
  if (!slug) throw new Error('No bilingual paper sample is available');
  const entries = [];
  const htmlPages = [];
  const add = (route, role, lang) => {
    if (!isSafeRoute(route)) throw new Error(`Unsafe release route: ${route}`);
    const bytes = fs.readFileSync(releaseFile(dist, route));
    entries.push({ path: route, role, ...(lang ? { lang } : {}), bytes: bytes.length, sha256: releaseDigest(bytes) });
    if (role === 'page') htmlPages.push(bytes.toString('utf8'));
  };
  for (const prefix of ['', '/en']) {
    const lang = prefix ? 'en' : 'zh-Hant';
    for (const route of [`${prefix}/`, `${prefix}/search/`, `${prefix}/paper-reading/${slug}/`]) add(route, 'page', lang);
    add(`${prefix}/search/data.json`, 'search-index', lang);
    add(`${prefix}/paper-reading/data/essence/${slug}.json`, 'paper-essence', lang);
  }
  const references = [...new Set(htmlPages.flatMap((html) => [...html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)].map((match) => match[1])))];
  for (const pattern of [/\.css$/, /\.js$/, /\.(?:webp|png|svg)$/]) {
    for (const route of references.filter((route) => isSafeRoute(route) && pattern.test(route)).slice(0, 2)) add(route, 'asset');
  }
  const manifest = validateReleaseManifest({ schemaVersion: 1, sha, entries }, sha);
  fs.writeFileSync(path.join(dist, 'release.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const value = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
    const sha = value('sha') ?? process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const manifest = writeReleaseManifest({ dist: path.resolve(value('dist') ?? 'dist'), sha });
    console.log(`Release manifest written for ${manifest.sha}: ${manifest.entries.length} sampled files.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
