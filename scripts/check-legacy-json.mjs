import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeSearchItems } from '../public/js/search-index-codec.js';

const legacyUrl = /\/(?:en\/)?(?:search\/index\.json|paper-reading\/data\/essence\.json)(?=["'`?#\s]|$)/g;

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

/** Reader pages and delivered JavaScript must use compact or per-note endpoints. */
export function findLegacyConsumerReferences(dist) {
  const files = [
    ...['', 'en/'].flatMap((prefix) => [
      path.join(dist, prefix, 'search/index.html'),
      path.join(dist, prefix, 'paper-reading/index.html'),
    ]),
    ...walk(path.join(dist, 'js')).filter((file) => file.endsWith('.js')),
    ...walk(path.join(dist, '_astro')).filter((file) => file.endsWith('.js')),
  ];
  return files.flatMap((file) => {
    assert.ok(fs.existsSync(file), `Missing reader page: ${path.relative(dist, file)}`);
    const source = fs.readFileSync(file, 'utf8').replaceAll('\\/', '/');
    return [...source.matchAll(legacyUrl)].map(([url]) => ({ file: path.relative(dist, file), url }));
  });
}

/** Verify every legacy payload against the modern payload consumed by readers. */
export function checkLegacyJson(dist = path.resolve('dist')) {
  const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(dist, relative), 'utf8'));
  const coverage = [];
  for (const prefix of ['', 'en/']) {
    const legacySearch = readJson(`${prefix}search/index.json`);
    assert.ok(Array.isArray(legacySearch), `${prefix}search/index.json must retain its array shape`);
    const currentSearch = decodeSearchItems(readJson(`${prefix}search/data.json`));
    assert.deepEqual(legacySearch, currentSearch, `${prefix}search legacy fields or item order diverged`);

    const legacyEssence = readJson(`${prefix}paper-reading/data/essence.json`);
    assert.ok(legacyEssence && typeof legacyEssence === 'object' && !Array.isArray(legacyEssence), `${prefix}essence.json must retain its slug-keyed object shape`);
    const directory = `${prefix}paper-reading/data/essence`;
    const slugs = fs.readdirSync(path.join(dist, directory)).filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -5)).sort();
    assert.deepEqual(Object.keys(legacyEssence).sort(), slugs, `${prefix}legacy essence coverage differs from per-note responses`);
    for (const slug of slugs) {
      assert.deepEqual(legacyEssence[slug], readJson(`${directory}/${slug}.json`), `${prefix}legacy essence differs for ${slug}`);
    }
    coverage.push({ language: prefix ? 'en' : 'zh', searchItems: legacySearch.length, essenceNotes: slugs.length });
  }
  assert.deepEqual(findLegacyConsumerReferences(dist), [], 'Reader code must not fetch legacy bulk JSON endpoints');
  return coverage;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = path.resolve(process.argv.find((arg) => arg.startsWith('--dist='))?.slice(7) ?? 'dist');
  try {
    console.log(`Legacy JSON compatibility and reader isolation passed: ${JSON.stringify(checkLegacyJson(dist))}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
